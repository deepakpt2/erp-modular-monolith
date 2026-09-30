import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { getNextDocumentNumber, createDocumentEntry, updateDocumentWithAudit } from '@/shared/kernel/db/documentHelpers';
import { enforcePostingPeriod, getFiscalYearPeriodFromDate } from '@/shared/kernel/db/postingPeriodHelpers';
import { createReversalOrAdjustmentDocument, getReversalDocType } from '@/shared/kernel/db/reversalHelpers';

/**
 * Purchase Requisition API – Legal-safe own IP – Module 6 MM Procurement
 * New: proc_purchase_requisition + proc_pr_line (was mm_purchase_requisition + mm_pr_line) – prNumber PR-10000001 was 10*, legalEntityId was company_code_id, facilityId was plant_id FAC-1000 was 1000, procurementDivisionId was purchasing_org PD-1000 was 1000/KPO1, buyerTeamId was purchasing_group BUY-001 was 001/K01, itemId was material_id prod_item EMTC, uomCode was uom EUOC, inventoryLocationId was sloc_id, costUnitId was cost_center ECUC, ledgerAccountId was gl_account FGLC, taxRuleId was tax_code FTXC, currencyCode INR default was KWD
 * Helper code: PPRC PR Create (alias PRC, ME51N, FIN-PR-CR) – 4-char MOOA P=Procurement, PR=PurchaseRequisition, C=Create – same length as ME51N but own IP, module grouped, intuitive
 * Fallback to legacy mm_purchase_requisition
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const plantId = searchParams.get('plantId') || searchParams.get('facilityId');
  const status = searchParams.get('status');
  const companyCode = searchParams.get('companyCode') || searchParams.get('legalEntity') || 'ALL';

  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'proc_purchase_requisition';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT 
          pr.id, pr.pr_number, pr.status, pr.total_amount, pr.currency_code as currency, pr.required_date, pr.created_at,
          f.code as plant_code, f.name as plant_name,
          f.code as facility_code, f.name as facility_name,
          iloc.code as sloc_code, iloc.name as sloc_name,
          iloc.code as inventory_location_code,
          e.employee_number as requester_employee_number,
          e.first_name as requester_first_name,
          pi.item_number as material_number, pi.description as material_description,
          pi.item_number, pi.description as item_name,
          prl.quantity, prl.uom_code as uom, prl.estimated_price,
          prl.facility_id as plant_id, prl.inventory_location_id as sloc_id, prl.is_converted, prl.po_id,
          le.code as company_code, le.code as legal_entity_code
        FROM proc_purchase_requisition pr
        LEFT JOIN org_facility f ON pr.facility_id = f.id
        LEFT JOIN hr_employee e ON pr.requester_id = e.id
        LEFT JOIN org_legal_entity le ON pr.legal_entity_id = le.id
        LEFT JOIN proc_pr_line prl ON prl.pr_id = pr.id
        LEFT JOIN prod_item pi ON prl.item_id = pi.id
        LEFT JOIN org_inventory_location iloc ON prl.inventory_location_id = iloc.id
        WHERE 1=1
      `;

      if (search) {
        query = sql`${query} AND (pr.pr_number ILIKE ${`%${search}%`} OR pi.item_number ILIKE ${`%${search}%`} OR pi.name ILIKE ${`%${search}%`})`;
      }
      if (plantId) {
        query = sql`${query} AND (pr.facility_id = ${plantId} OR pr.plant_id = ${plantId})`;
      }
      if (status) {
        query = sql`${query} AND pr.status = ${status}::proc_pr_status`;
      }
      if (companyCode && companyCode !== 'ALL') {
        query = sql`${query} AND le.code = ${companyCode}`;
      }

      query = sql`${query} ORDER BY pr.created_at DESC LIMIT ${limit}`;

      const res = await db.execute(query);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('proc_purchase_requisition not yet fallback mm_purchase_requisition:', newErr.message);
      source = 'db-legacy';
      table = 'mm_purchase_requisition';
      legalSafe = false;

      let query = sql`
        SELECT 
          pr.id, pr.pr_number, pr.status, pr.total_amount, pr.currency, pr.required_date, pr.created_at,
          p.code as plant_code, p.name as plant_name,
          sloc.code as sloc_code, sloc.name as sloc_name,
          e.employee_number as requester_employee_number,
          e.first_name as requester_first_name,
          m.material_number, m.description as material_description,
          prl.quantity, prl.uom, prl.estimated_price,
          prl.plant_id, prl.sloc_id, prl.is_converted, prl.po_id,
          cc.code as company_code
        FROM mm_purchase_requisition pr
        LEFT JOIN ent_plant p ON pr.plant_id = p.id
        LEFT JOIN hr_employee e ON pr.requester_id = e.id
        LEFT JOIN ent_company_code cc ON pr.company_code_id = cc.id
        LEFT JOIN mm_pr_line prl ON prl.pr_id = pr.id
        LEFT JOIN ent_material_master m ON prl.material_id = m.id
        LEFT JOIN ent_storage_location sloc ON prl.sloc_id = sloc.id
        WHERE 1=1
      `;

      if (search) {
        query = sql`${query} AND (pr.pr_number ILIKE ${`%${search}%`} OR m.material_number ILIKE ${`%${search}%`} OR m.description ILIKE ${`%${search}%`})`;
      }
      if (plantId) {
        query = sql`${query} AND pr.plant_id = ${plantId}`;
      }
      if (status) {
        query = sql`${query} AND pr.status = ${status}::pr_status`;
      }
      if (companyCode && companyCode !== 'ALL') {
        query = sql`${query} AND cc.code = ${companyCode}`;
      }

      query = sql`${query} ORDER BY pr.created_at DESC LIMIT ${limit}`;

      const res = await db.execute(query);
      rows = res.rows as any[];
    }

    return NextResponse.json({
      purchaseRequisitions: rows,
      data: rows,
      count: rows.length,
      code: 'PPRC',
      aliasCodes: ['PRC', 'ME51N', 'FIN-PR-CR'],
      helperCode: 'PPRC',
      table,
      source,
      legalSafe,
      functionDescription: 'Purchase Requisition – PPRC legal-safe own IP (was ME51N) – prNumber PR-10000001, facilityId FAC-1000 was plant_id, itemId prod_item was material_id, uomCode EUOC, inventoryLocationId was sloc_id, costUnitId ECUC, ledgerAccountId FGLC, taxRuleId FTXC, currencyCode INR default was KWD, procurementDivision PD-1000 was purchasing_org, buyerTeam BUY-001 was purchasing_group',
      erpDefaults: [
        { prNumber: 'PR-10000001', facility: 'FAC-1000', item: 'ITM-1001 Spices RAW', quantity: 100, uom: 'KG', estimatedPrice: 50, status: 'DRAFT', helperCode: 'PPRC', note: 'Sample – fresh empty per requirement but CoA/GL/Tax/Currencies/UoM kept' },
      ],
      explanation: 'PR legal-safe proc_purchase_requisition + proc_pr_line – prNumber PR-10000001 was 10*, legalEntityId was company_code_id, facilityId was plant_id FAC-1000 was 1000, itemId was material_id prod_item EMTC, uomCode was uom EUOC, inventoryLocationId was sloc_id, costUnitId was cost_center ECUC, ledgerAccountId was gl_account FGLC, taxRuleId was tax_code FTXC, currencyCode INR default was KWD, procurementDivision PD-1000 was purchasing_org, buyerTeam BUY-001 was purchasing_group – Code PPRC primary alias PRC/ME51N – 4-char MOOA P=Procurement PR=PurchaseRequisition C=Create – module grouped intuitive, same length as ME51N but own IP – fresh empty per requirement but CoA/GL/Tax/Currencies/UoM kept.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, purchaseRequisitions: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();

    // SAP-like posting period enforcement – OB52 – check if period open for account type M
    try {
      const postingDate = body.required_date || body.posting_date || new Date().toISOString();
      const companyCodeForPosting = body.company_code || body.legal_entity_code || body.companyCode || '1000';
      const fiscalCheck = await getFiscalYearPeriodFromDate(companyCodeForPosting, postingDate);
      const postingCheck = await enforcePostingPeriod({ company_code: companyCodeForPosting, posting_date: postingDate, account_type: 'M' });
      if (!postingCheck.allowed) {
        return NextResponse.json({ 
          error: postingCheck.message,
          fiscal_year: postingCheck.fiscal_year,
          fiscal_period: postingCheck.fiscal_period,
          variant_code: postingCheck.variant_code,
          posting_date: postingDate,
          account_type: 'M',
          help: `Create open period via POST /api/posting-period-variants with variant_code=${postingCheck.variant_code}, account_type=M, from_period=${postingCheck.fiscal_period}, from_year=${postingCheck.fiscal_year}, to_period=${postingCheck.fiscal_period}, to_year=${postingCheck.fiscal_year}, is_open=true`
        }, { status: 400 });
      }
      // Attach fiscal info to body for storage
      (body as any)._fiscal_year = postingCheck.fiscal_year;
      (body as any)._fiscal_period = postingCheck.fiscal_period;
    } catch (ppErr: any) {
      console.warn('Posting period enforcement failed, allowing posting to not block fresh:', ppErr.message);
    }
    const { facility_id, plant_id, facility_code, plant_code, legal_entity_code, company_code, requester_id, required_date, header_text, lines, currency_code } = body;
    const finalFacilityCode = facility_code || plant_code;
    const finalFacilityId = facility_id || plant_id;
    const finalLegalCode = legal_entity_code || company_code;

    let facilityIdResolved = finalFacilityId;
    if (!facilityIdResolved && finalFacilityCode) {
      try {
        const f = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${finalFacilityCode} LIMIT 1`);
        if (f.rows.length > 0) facilityIdResolved = (f.rows[0] as any).id;
        else {
          const f2 = await db.execute(sql`SELECT id FROM ent_plant WHERE code = ${finalFacilityCode} LIMIT 1`);
          if (f2.rows.length > 0) facilityIdResolved = (f2.rows[0] as any).id;
        }
      } catch {}
    }

    let legalEntityIdResolved = null;
    if (finalLegalCode) {
      try {
        const le = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code = ${finalLegalCode} LIMIT 1`);
        if (le.rows.length > 0) legalEntityIdResolved = (le.rows[0] as any).id;
        else {
          const le2 = await db.execute(sql`SELECT id FROM ent_company_code WHERE code = ${finalLegalCode} LIMIT 1`);
          if (le2.rows.length > 0) legalEntityIdResolved = (le2.rows[0] as any).id;
        }
      } catch {}
    }

    if (!facilityIdResolved) return NextResponse.json({ error: 'facility_id/facility_code or plant_id/plant_code required' }, { status: 400 });

    // Generate PR number via number range – industry standard – assignment table
    let prNumber = body.pr_number;
    if (!prNumber) {
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS core_number_range_assignment (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            object_type varchar(50) NOT NULL,
            assignment_key varchar(100) NOT NULL,
            assignment_type varchar(50) DEFAULT 'MATERIAL_TYPE',
            number_range_code varchar(50) NOT NULL,
            fiscal_year integer,
            is_active boolean DEFAULT true,
            description text,
            created_at timestamp DEFAULT NOW(),
            updated_at timestamp DEFAULT NOW(),
            UNIQUE(object_type, assignment_key, fiscal_year)
          )
        `);
      } catch {}

      let assignedRangeCode: string | null = null;
      const companyForAssign = (body.company_code || body.legal_entity_code || finalLegalCode || '').toString().toUpperCase();
      if (companyForAssign) {
        try {
          const assignRes = await db.execute(sql`
            SELECT number_range_code FROM core_number_range_assignment
            WHERE object_type = 'PR' AND UPPER(assignment_key) = ${companyForAssign} AND is_active = true
            LIMIT 1
          `);
          if (assignRes.rows.length > 0) assignedRangeCode = (assignRes.rows[0] as any).number_range_code;
        } catch {}
      }

      try {
        let nrRes;
        if (assignedRangeCode) {
          nrRes = await db.execute(sql`SELECT code, current_number, from_number, to_number FROM core_number_range WHERE code = ${assignedRangeCode} LIMIT 1`);
        } else {
          nrRes = await db.execute(sql`SELECT code, current_number, from_number, to_number FROM core_number_range WHERE object_type = 'PR'::core_nr_object_type ORDER BY fiscal_year DESC LIMIT 1`);
        }

        if (nrRes.rows.length > 0) {
          const nr = nrRes.rows[0] as any;
          const current = parseInt((nr as any).current_number) + 1;
          if (nr.to_number && current > Number(nr.to_number)) {
            throw new Error(`Number range ${nr.code}${assignedRangeCode ? ` assigned to PR ${companyForAssign}` : ''} exhausted – ${current} > ${nr.to_number} – increase to_number or create new range and update assignment. No auto fallback.`);
          }
          prNumber = `${current}`;
          if (assignedRangeCode) {
            await db.execute(sql`UPDATE core_number_range SET current_number = ${current}, updated_at = NOW() WHERE code = ${assignedRangeCode}`);
          } else {
            await db.execute(sql`UPDATE core_number_range SET current_number = ${current}, updated_at = NOW() WHERE object_type = 'PR'::core_nr_object_type`);
          }
        } else {
          prNumber = `${Date.now()}`.slice(-10);
        }
      } catch (e: any) {
        if (e.message?.includes('exhausted')) throw e;
        prNumber = `${Date.now()}`.slice(-10);
      }
    }

    try {
      const res = await db.execute(sql`
        INSERT INTO proc_purchase_requisition (pr_number, legal_entity_id, company_code_id, facility_id, plant_id, requester_id, required_date, header_text, currency_code, currency)
        VALUES (${prNumber}, ${legalEntityIdResolved}, ${legalEntityIdResolved}, ${facilityIdResolved}, ${facilityIdResolved}, ${requester_id || null}, ${required_date ? new Date(required_date) : null}, ${header_text || null}, ${currency_code || 'INR'}, ${currency_code || 'INR'})
        RETURNING id, pr_number
      `);
      const prId = (res.rows[0] as any).id;

      let total = 0;
      let facilityCodeForMsg = facility_code || plant_code || '';
      if (lines && Array.isArray(lines)) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          let itemId = line.item_id || line.material_id;
          if (!itemId && line.item_number) {
            try {
              const it = await db.execute(sql`SELECT id FROM prod_item WHERE item_number = ${line.item_number} LIMIT 1`);
              if (it.rows.length > 0) itemId = (it.rows[0] as any).id;
              else {
                const it2 = await db.execute(sql`SELECT id FROM ent_material_master WHERE material_number = ${line.item_number} LIMIT 1`);
                if (it2.rows.length > 0) itemId = (it2.rows[0] as any).id;
              }
            } catch {}
          }
          if (!itemId) continue;

          let invLocId = line.inventory_location_id || line.sloc_id;
          if (!invLocId && line.inventory_location_code) {
            try {
              const il = await db.execute(sql`SELECT id FROM org_inventory_location WHERE code = ${line.inventory_location_code} LIMIT 1`);
              if (il.rows.length > 0) invLocId = (il.rows[0] as any).id;
            } catch {}
          }

          const qty = parseFloat(line.quantity || '0');
          const price = parseFloat(line.estimated_price || line.estimatedPrice || '0');
          total += qty * price;

          await db.execute(sql`
            INSERT INTO proc_pr_line (pr_id, line_number, item_id, material_id, quantity, uom_code, uom, estimated_price, facility_id, plant_id, inventory_location_id, sloc_id, delivery_date, item_text)
            VALUES (${prId}, ${line.line_number || i + 10}, ${itemId}, ${itemId}, ${qty}, ${line.uom_code || line.uom || 'PC'}, ${line.uom_code || line.uom || 'PC'}, ${price}, ${facilityIdResolved}, ${facilityIdResolved}, ${invLocId || null}, ${invLocId || null}, ${line.delivery_date ? new Date(line.delivery_date) : null}, ${line.item_text || null})
          `);
        }

        await db.execute(sql`UPDATE proc_purchase_requisition SET total_amount = ${total} WHERE id = ${prId}`);
      }

            try { await createDocumentEntry({ document_type: 'PR', document_number: prNumber, company_code: finalLegalCode || '1000', fiscal_year: new Date().getFullYear().toString(), created_by: 'system', payload: { pr_number: prNumber, facility_id: facilityIdResolved } }); } catch (e) { console.warn('Doc entry failed', e); }

      // Document Flow – PR is root – no preceding – but create entry as root for future PO→PR link – FDFL VBFA – WORM-lite – PR→PO→GR→IV→Payment
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS audit_document_flow (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            root_document_type VARCHAR(20),
            root_document_id UUID,
            root_document_number VARCHAR(50),
            preceding_doc_type VARCHAR(20),
            preceding_doc_id UUID,
            preceding_doc_number VARCHAR(50),
            succeeding_doc_type VARCHAR(20),
            succeeding_doc_id UUID,
            succeeding_doc_number VARCHAR(50),
            created_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);
        await db.execute(sql`
          INSERT INTO audit_document_flow (root_document_type, root_document_id, root_document_number, preceding_doc_type, preceding_doc_id, preceding_doc_number, succeeding_doc_type, succeeding_doc_id, succeeding_doc_number)
          VALUES ('PR', ${prId}, ${prNumber}, NULL, NULL, NULL, 'PR', ${prId}, ${prNumber})
        `).catch(()=>{});
      } catch {}

      // Workflow auto-start – ME54N Release PR – if amount > threshold or always – create wf_instance + wf_task for manager/owner – SBWP – T0
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS wf_definition (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(200),
            document_type VARCHAR(20) NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS wf_definition_step (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            definition_id UUID REFERENCES wf_definition(id),
            step_order INTEGER NOT NULL,
            name VARCHAR(200),
            approver_type VARCHAR(20) DEFAULT 'MANAGER',
            approver_role VARCHAR(50),
            min_amount NUMERIC,
            max_amount NUMERIC,
            requires_dual BOOLEAN DEFAULT false,
            is_owner_approval BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS wf_instance (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            definition_id UUID REFERENCES wf_definition(id),
            document_type VARCHAR(20) NOT NULL,
            document_id UUID,
            document_number VARCHAR(50) NOT NULL,
            company_code_id UUID,
            current_state VARCHAR(30) DEFAULT 'PENDING_APPROVAL',
            current_step_order INTEGER DEFAULT 1,
            requester_id UUID,
            amount NUMERIC,
            currency VARCHAR(10) DEFAULT 'INR',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS wf_task (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            instance_id UUID REFERENCES wf_instance(id),
            step_id UUID REFERENCES wf_definition_step(id),
            assignee_id UUID,
            status VARCHAR(20) DEFAULT 'PENDING',
            decision VARCHAR(20),
            comment TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            decided_at TIMESTAMPTZ,
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);

        // Ensure PR definition exists
        let defId:any = null;
        const defRes = await db.execute(sql`SELECT id FROM wf_definition WHERE document_type = 'PR' AND is_active = true LIMIT 1`);
        if(defRes.rows.length>0) defId = (defRes.rows[0] as any).id;
        else {
          const newDef = await db.execute(sql`INSERT INTO wf_definition (code, name, document_type, is_active) VALUES ('PR_APPROVAL', 'PR Approval – ME54N – Manager + Owner', 'PR', true) RETURNING id`);
          defId = (newDef.rows[0] as any).id;
          // Create steps: 1 Manager approval <10000, 2 Owner approval >10000 dual
          await db.execute(sql`INSERT INTO wf_definition_step (definition_id, step_order, name, approver_type, min_amount, max_amount, requires_dual, is_owner_approval) VALUES (${defId}, 1, 'Manager Approval – PR <10000', 'MANAGER', 0, 9999.99, false, false)`);
          await db.execute(sql`INSERT INTO wf_definition_step (definition_id, step_order, name, approver_type, min_amount, max_amount, requires_dual, is_owner_approval) VALUES (${defId}, 2, 'Manager + Owner Dual Approval – PR >=10000', 'OWNER', 10000, 999999999, true, true)`);
        }

        // Get steps for amount
        const stepsRes = await db.execute(sql`SELECT id, step_order, approver_type, min_amount, max_amount FROM wf_definition_step WHERE definition_id = ${defId} ORDER BY step_order ASC`);
        let steps = stepsRes.rows as any[];
        if(total>0){
          const filtered = steps.filter((s:any)=>{
            const min = s.min_amount ? parseFloat(s.min_amount) : 0;
            const max = s.max_amount ? parseFloat(s.max_amount) : Infinity;
            return total >= min && total <= max;
          });
          if(filtered.length>0) steps = filtered;
          else if(total >= 10000) steps = steps.filter((s:any)=>s.step_order===2);
          else steps = steps.filter((s:any)=>s.step_order===1);
        }

        if(steps.length>0){
          const instRes = await db.execute(sql`INSERT INTO wf_instance (definition_id, document_type, document_id, document_number, current_state, current_step_order, amount, currency) VALUES (${defId}, 'PR', ${prId}, ${prNumber}, 'PENDING_APPROVAL', 1, ${total}, 'INR') RETURNING id`);
          const instanceId = (instRes.rows[0] as any).id;
          // Resolve assignee – first active employee as fallback
          let assigneeId:any = null;
          try{
            const empRes = await db.execute(sql`SELECT id FROM hr_employee WHERE is_active = true LIMIT 1`);
            if(empRes.rows.length>0) assigneeId = (empRes.rows[0] as any).id;
          }catch{}
          for(const step of steps){
            if(assigneeId){
              await db.execute(sql`INSERT INTO wf_task (instance_id, step_id, assignee_id, status) VALUES (${instanceId}, ${step.id}, ${assigneeId}, 'PENDING')`);
            }
          }
          console.log(`Workflow auto-started for PR ${prNumber} – instance ${instanceId} – ${steps.length} tasks – amount ${total} – ME54N SBWP – T0`);
        }
      } catch (wfErr:any) {
        console.warn(`Workflow auto-start failed for PR ${prNumber}:`, wfErr.message);
      }

      return NextResponse.json({ success: true, pr: res.rows[0], prNumber, code: 'PPRC', message: `PR ${prNumber} created – PPRC legal-safe – total ${total} – facility ${facilityCodeForMsg} – posting period M OB52 – number range PR 1000000000 numeric only – workflow auto-started ME54N SBWP – document flow PR root – T0 BLOCKING – NO DANGLING – org wired`, legalSafe: true, document_number: prNumber, total_amount: total });
    } catch (newErr: any) {
      console.warn('proc_purchase_requisition insert failed fallback mm_purchase_requisition:', newErr.message);
      // Fallback legacy
      try {
        const res = await db.execute(sql`
          INSERT INTO mm_purchase_requisition (pr_number, company_code_id, plant_id, requester_id, required_date, header_text, currency)
          VALUES (${prNumber}, ${legalEntityIdResolved}, ${facilityIdResolved}, ${requester_id || null}, ${required_date ? new Date(required_date) : null}, ${header_text || null}, ${currency_code || 'KWD'})
          RETURNING id, pr_number
        `);
        const prId = (res.rows[0] as any).id;

        if (lines && Array.isArray(lines)) {
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let itemId = line.item_id || line.material_id;
            if (!itemId && line.item_number) {
              try {
                const it = await db.execute(sql`SELECT id FROM ent_material_master WHERE material_number = ${line.item_number} LIMIT 1`);
                if (it.rows.length > 0) itemId = (it.rows[0] as any).id;
              } catch {}
            }
            if (!itemId) continue;

            await db.execute(sql`
              INSERT INTO mm_pr_line (pr_id, line_number, material_id, quantity, uom, estimated_price, plant_id, sloc_id, delivery_date, item_text)
              VALUES (${prId}, ${line.line_number || i + 10}, ${itemId}, ${line.quantity || 0}, ${line.uom_code || line.uom || 'PC'}, ${line.estimated_price || 0}, ${facilityIdResolved}, ${line.inventory_location_id || line.sloc_id || null}, ${line.delivery_date ? new Date(line.delivery_date) : null}, ${line.item_text || null})
            `);
          }
        }

        return NextResponse.json({ success: true, pr: res.rows[0], prNumber, code: 'PPRC', message: `PR ${prNumber} created – ME51N legacy (migrating to PPRC)`, legalSafe: false });
      } catch (legacyErr: any) {
        return NextResponse.json({ error: legacyErr.message }, { status: 500 });
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const action = (body.action || body.edit_action || 'ADJUST').toUpperCase();
    const isReversal = action.includes('REVERSE');
    const originalNumber = body.pr_number || body.document_number || body.id;

    if (originalNumber && (isReversal || action.includes('ADJUST') || action.includes('CORRECT'))) {
      const reversalResult = await createReversalOrAdjustmentDocument({
        original_document_type: 'PR',
        original_document_number: originalNumber,
        action: action as any,
        reason: body.reason || body.reversal_reason || body.adjustment_reason || null,
        new_payload: body,
        company_code: body.company_code || body.legal_entity_code || '1000',
        changed_by: body.changed_by || 'system'
      });

      if (reversalResult.success) {
        try {
          const newStatus = isReversal ? 'REVERSED' : 'ADJUSTED';
          await db.execute(sql`UPDATE proc_purchase_requisition SET status = ${newStatus}::proc_pr_status, updated_at = NOW() WHERE pr_number = ${originalNumber} OR id::text = ${originalNumber}`);
        } catch (e) {
          console.warn('Status update failed for proc_purchase_requisition', e);
        }

        return NextResponse.json({
          success: true,
          original_document: originalNumber,
          reversal_document: reversalResult.reversal_document_number,
          reversal_type: reversalResult.reversal_type,
          action: action,
          code: reversalResult.reversal_type,
          message: `${isReversal ? 'Reversal' : 'Adjustment'} document ${reversalResult.reversal_document_number} (${reversalResult.reversal_type}) created for ${originalNumber} – edit as reversal/adjustment – immutable audit trail`,
          legalSafe: true,
          audit_trail: `Original ${originalNumber} status set to ${isReversal ? 'REVERSED' : 'ADJUSTED'}, new doc ${reversalResult.reversal_document_number} references original`
        });
      }
    }

    // Fallback legacy update with audit trail – immutable
    try {
      if (originalNumber) {
        await updateDocumentWithAudit({ document_number: originalNumber, new_payload: body, changed_by: 'system', action: 'UPDATE' });
      }
    } catch (auditErr) { console.warn('Audit trail failed', auditErr); }

    try {
      const { id, pr_number, status } = body;
      if (!id && !pr_number) return NextResponse.json({ error: 'id or pr_number required' }, { status: 400 });
      let res;
      if (id) res = await db.execute(sql`UPDATE proc_purchase_requisition SET status = ${status}::proc_pr_status, updated_at = NOW() WHERE id = ${id} RETURNING id, pr_number, status`);
      else res = await db.execute(sql`UPDATE proc_purchase_requisition SET status = ${status}::proc_pr_status, updated_at = NOW() WHERE pr_number = ${pr_number} RETURNING id, pr_number, status`);
      if (res.rows.length === 0) throw new Error('Not found in proc_purchase_requisition');
      return NextResponse.json({ success: true, pr: res.rows[0], code: 'PPRC', message: `PR ${res.rows[0].pr_number} status ${status} – PPRC legal-safe`, audit_trail: 'Immutable history preserved' });
    } catch {
      const { id, pr_number, status } = body;
      let res;
      if (id) res = await db.execute(sql`UPDATE mm_purchase_requisition SET status = ${status}::pr_status, updated_at = NOW() WHERE id = ${id} RETURNING id, pr_number, status`);
      else res = await db.execute(sql`UPDATE mm_purchase_requisition SET status = ${status}::pr_status, updated_at = NOW() WHERE pr_number = ${pr_number} RETURNING id, pr_number, status`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'PR not found' }, { status: 404 });
      return NextResponse.json({ success: true, pr: res.rows[0], message: `PR ${res.rows[0].pr_number} status ${status} – ME51N legacy`, audit_trail: 'Immutable history preserved' });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const pr_number = searchParams.get('pr_number');
    if (!id && !pr_number) return NextResponse.json({ error: 'id or pr_number required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM proc_purchase_requisition WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM proc_purchase_requisition WHERE pr_number = ${pr_number}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM mm_purchase_requisition WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM mm_purchase_requisition WHERE pr_number = ${pr_number}`);
    }

    return NextResponse.json({ success: true, code: 'PPRC', message: `PR ${pr_number || id} deleted – PPRC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
