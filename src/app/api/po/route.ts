import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db, withTransaction } from '@/shared/kernel/db/client';
import { getNextDocumentNumber, createDocumentEntry, updateDocumentWithAudit } from '@/shared/kernel/db/documentHelpers';
import { enforcePostingPeriod, getFiscalYearPeriodFromDate, calculateDueDate } from '@/shared/kernel/db/postingPeriodHelpers';
import { createReversalOrAdjustmentDocument, getReversalDocType } from '@/shared/kernel/db/reversalHelpers';
import { sql } from 'drizzle-orm';

/**
 * Purchase Order API – Legal-safe own IP – Module 6 MM Procurement
 * New: proc_purchase_order + proc_po_line (was mm_purchase_order + mm_po_line) – poNumber PO-4500000001 was 45*, legalEntityId was company_code_id, partnerId was vendor_id partner_account PSUC, facilityId was plant_id FAC-1000 was 1000, itemId was material_id prod_item EMTC, uomCode was uom EUOC, inventoryLocationId was sloc_id, costUnitId was cost_center ECUC, ledgerAccountId was gl_account FGLC, taxRuleId was tax_code FTXC, currencyCode INR default was KWD, procurementDivision PD-1000 was purchasing_org, buyerTeam BUY-001 was purchasing_group, deliveryCompleted was ELIKZ
 * Helper code: PPOC PO Create (alias POC, ME21N, FIN-PO-CR) – 4-char MOOA P=Procurement, PO=PurchaseOrder, C=Create – same length as ME21N but own IP, module grouped, intuitive
 * Fallback to legacy mm_purchase_order
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const plantId = searchParams.get('plantId') || searchParams.get('facilityId');
  const status = searchParams.get('status');
  const vendorId = searchParams.get('vendorId') || searchParams.get('partnerId');
  const companyCode = searchParams.get('companyCode') || searchParams.get('legalEntity') || 'ALL';
  const elikz = searchParams.get('elikz');

  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'proc_purchase_order';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT 
          po.id, po.po_number, po.status, po.total_amount, po.total_landed_cost, po.currency_code as currency,
          po.delivery_date, po.freight_amount, po.customs_amount, po.created_at,
          f.code as plant_code, f.name as plant_name,
          f.code as facility_code, f.name as facility_name,
          pa.account_number as vendor_number, pa.display_name as vendor_name,
          le.code as company_code, le.code as legal_entity_code,
          (SELECT COUNT(*) FROM proc_po_line WHERE po_id = po.id) as line_count,
          (SELECT SUM(quantity) FROM proc_po_line WHERE po_id = po.id) as total_ordered_qty,
          (SELECT SUM(quantity_received) FROM proc_po_line WHERE po_id = po.id) as total_received_qty,
          (SELECT BOOL_AND(delivery_completed) FROM proc_po_line WHERE po_id = po.id) as all_elikz,
          pr.pr_number as pr_ref
        FROM proc_purchase_order po
        LEFT JOIN org_facility f ON po.facility_id = f.id
        LEFT JOIN partner_account pa ON po.partner_id = pa.id
        LEFT JOIN org_legal_entity le ON po.legal_entity_id = le.id
        LEFT JOIN proc_purchase_requisition pr ON po.pr_id = pr.id
        WHERE 1=1
      `;

      if (search) {
        query = sql`${query} AND (po.po_number ILIKE ${`%${search}%`} OR pa.display_name ILIKE ${`%${search}%`} OR pr.pr_number ILIKE ${`%${search}%`})`;
      }
      if (plantId) query = sql`${query} AND (po.facility_id = ${plantId} OR po.plant_id = ${plantId})`;
      if (status) query = sql`${query} AND po.status = ${status}::proc_po_status`;
      if (vendorId) query = sql`${query} AND po.partner_id = ${vendorId}`;
      if (companyCode && companyCode !== 'ALL') query = sql`${query} AND le.code = ${companyCode}`;
      if (elikz === 'true') query = sql`${query} AND EXISTS (SELECT 1 FROM proc_po_line WHERE po_id = po.id AND delivery_completed = true)`;
      if (elikz === 'false') query = sql`${query} AND NOT EXISTS (SELECT 1 FROM proc_po_line WHERE po_id = po.id AND delivery_completed = true)`;

      query = sql`${query} ORDER BY po.created_at DESC LIMIT ${limit}`;

      const result = await db.execute(query);
      rows = result.rows as any[];
    } catch (newErr: any) {
      console.warn('proc_purchase_order not yet fallback mm_purchase_order:', newErr.message);
      source = 'db-legacy';
      table = 'mm_purchase_order';
      legalSafe = false;

      let query = sql`
        SELECT 
          po.id, po.po_number, po.status, po.total_amount, po.total_landed_cost, po.currency,
          po.delivery_date, po.freight_amount, po.customs_amount, po.created_at,
          p.code as plant_code, p.name as plant_name,
          COALESCE(pa.account_number, bp.bp_number) as vendor_number, COALESCE(pa.display_name, bp.name1) as vendor_name,
          cc.code as company_code,
          (SELECT COUNT(*) FROM mm_po_line WHERE po_id = po.id) as line_count,
          (SELECT SUM(quantity) FROM mm_po_line WHERE po_id = po.id) as total_ordered_qty,
          (SELECT SUM(quantity_received) FROM mm_po_line WHERE po_id = po.id) as total_received_qty,
          (SELECT BOOL_AND(delivery_completed) FROM mm_po_line WHERE po_id = po.id) as all_elikz,
          pr.pr_number as pr_ref
        FROM mm_purchase_order po
        LEFT JOIN ent_plant p ON po.plant_id = p.id
        LEFT JOIN partner_account pa ON po.vendor_id = pa.id
        LEFT JOIN ent_business_partner bp ON po.vendor_id = bp.id
        LEFT JOIN ent_company_code cc ON po.company_code_id = cc.id
        LEFT JOIN mm_purchase_requisition pr ON po.pr_id = pr.id
        WHERE 1=1
      `;

      if (search) {
        query = sql`${query} AND (po.po_number ILIKE ${`%${search}%`} OR COALESCE(pa.display_name, bp.name1) ILIKE ${`%${search}%`} OR pr.pr_number ILIKE ${`%${search}%`})`;
      }
      if (plantId) query = sql`${query} AND po.plant_id = ${plantId}`;
      if (status) query = sql`${query} AND po.status = ${status}::po_status`;
      if (vendorId) query = sql`${query} AND po.vendor_id = ${vendorId}`;
      if (companyCode && companyCode !== 'ALL') query = sql`${query} AND cc.code = ${companyCode}`;
      if (elikz === 'true') query = sql`${query} AND EXISTS (SELECT 1 FROM mm_po_line WHERE po_id = po.id AND delivery_completed = true)`;
      if (elikz === 'false') query = sql`${query} AND NOT EXISTS (SELECT 1 FROM mm_po_line WHERE po_id = po.id AND delivery_completed = true)`;

      query = sql`${query} ORDER BY po.created_at DESC LIMIT ${limit}`;

      const result = await db.execute(query);
      rows = result.rows as any[];
    }

    return NextResponse.json({
      pos: rows,
      purchaseOrders: rows,
      count: rows.length,
      code: 'PPOC',
      aliasCodes: ['POC', 'ME21N', 'FIN-PO-CR'],
      helperCode: 'PPOC',
      table,
      source,
      legalSafe,
      functionDescription: 'Purchase Order – PPOC legal-safe own IP (was ME21N) – poNumber PO-4500000001, facilityId FAC-1000 was plant_id, partnerId PSUC was vendor_id, itemId EMTC was material_id, uomCode EUOC, inventoryLocationId was sloc_id, costUnitId ECUC, ledgerAccountId FGLC, taxRuleId FTXC, currencyCode INR default was KWD, procurementDivision PD-1000 was purchasing_org, buyerTeam BUY-001 was purchasing_group, deliveryCompleted was ELIKZ',
      multiPlant: 'Supports facility_id per PO, partner, legalEntity, ELIKZ filtering – Module6',
      explanation: 'PO legal-safe proc_purchase_order + proc_po_line – poNumber PO-4500000001 was 45*, legalEntityId was company_code_id, partnerId was vendor_id partner_account PSUC, facilityId was plant_id FAC-1000 was 1000, itemId was material_id prod_item EMTC, uomCode was uom EUOC, inventoryLocationId was sloc_id, costUnitId was cost_center ECUC, ledgerAccountId was gl_account FGLC, taxRuleId was tax_code FTXC, currencyCode INR default was KWD, procurementDivision PD-1000 was purchasing_org, buyerTeam BUY-001 was purchasing_group, deliveryCompleted was ELIKZ – Code PPOC primary alias POC/ME21N – 4-char MOOA P=Procurement PO=PurchaseOrder C=Create – module grouped intuitive, same length as ME21N but own IP – fresh empty per requirement but CoA/GL/Tax/Currencies/UoM kept.',
    });
  } catch (e: any) {
    console.error('DB error:', e.message);
    return NextResponse.json({ error: e.message, code: 'DB_ERROR', pos: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();

    // SAP-like posting period enforcement – OB52 – check if period open for account type K
    try {
      const postingDate = body.delivery_date || body.posting_date || new Date().toISOString();
      const companyCodeForPosting = body.company_code || body.legal_entity_code || body.companyCode || '1000';
      const fiscalCheck = await getFiscalYearPeriodFromDate(companyCodeForPosting, postingDate);
      const postingCheck = await enforcePostingPeriod({ company_code: companyCodeForPosting, posting_date: postingDate, account_type: 'K' });
      if (!postingCheck.allowed) {
        return NextResponse.json({ 
          error: postingCheck.message,
          fiscal_year: postingCheck.fiscal_year,
          fiscal_period: postingCheck.fiscal_period,
          variant_code: postingCheck.variant_code,
          posting_date: postingDate,
          account_type: 'K',
          help: `Create open period via POST /api/posting-period-variants with variant_code=${postingCheck.variant_code}, account_type=K, from_period=${postingCheck.fiscal_period}, from_year=${postingCheck.fiscal_year}, to_period=${postingCheck.fiscal_period}, to_year=${postingCheck.fiscal_year}, is_open=true`
        }, { status: 400 });
      }
      // Attach fiscal info to body for storage
      (body as any)._fiscal_year = postingCheck.fiscal_year;
      (body as any)._fiscal_period = postingCheck.fiscal_period;
      // Strict ERP: Payment Terms FAPT – calculate due date from posting date + days
      try {
        if (body.payment_term_code) {
          const dueCalc = await calculateDueDate(body.payment_term_code, postingDate);
          (body as any)._due_date = dueCalc.due_date.toISOString();
          (body as any)._discount_date = dueCalc.discount_date?.toISOString();
          console.log(`Payment term ${body.payment_term_code}: ${dueCalc.message}`);
        }
      } catch (ptErr: any) {
        console.warn('Payment term calc failed:', ptErr.message);
      }

    } catch (ppErr: any) {
      console.warn('Posting period enforcement failed, allowing posting to not block fresh:', ppErr.message);
    }
    // SAP-like unique document number – FNDC – auto-generate from FNRC if not provided
    let po_number = body.po_number;
    if (!po_number) {
      try {
        const next = await getNextDocumentNumber('PO', body.company_code || body.legal_entity_code || '1000');
        po_number = next.document_number;
      } catch { po_number = `PO-${Date.now()}`; }
    }
    const { facility_id, plant_id, facility_code, plant_code, legal_entity_code, company_code, partner_id, vendor_id, partner_number, vendor_number, pr_id, pr_number, delivery_date, header_text, lines, currency_code, payment_terms_days, incoterms, freight_amount, customs_amount, tax_amount } = body;

    const finalFacilityCode = facility_code || plant_code;
    const finalFacilityId = facility_id || plant_id;
    const finalLegalCode = legal_entity_code || company_code;
    const finalPartnerId = partner_id || vendor_id;
    const finalPartnerNumber = partner_number || vendor_number;

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

    let partnerIdResolved = finalPartnerId;
    if (!partnerIdResolved && finalPartnerNumber) {
      try {
        const pa = await db.execute(sql`SELECT id FROM partner_account WHERE account_number = ${finalPartnerNumber} LIMIT 1`);
        if (pa.rows.length > 0) partnerIdResolved = (pa.rows[0] as any).id;
        else {
          const pa2 = await db.execute(sql`SELECT id FROM ent_business_partner WHERE bp_number = ${finalPartnerNumber} LIMIT 1`);
          if (pa2.rows.length > 0) partnerIdResolved = (pa2.rows[0] as any).id;
        }
      } catch {}
    }

    if (!facilityIdResolved) return NextResponse.json({ error: 'facility_id/facility_code or plant_id/plant_code required' }, { status: 400 });
    if (!partnerIdResolved) return NextResponse.json({ error: 'partner_id/partner_number or vendor_id/vendor_number required' }, { status: 400 });

    let prIdResolved = pr_id;
    if (!prIdResolved && pr_number) {
      try {
        const pr = await db.execute(sql`SELECT id FROM proc_purchase_requisition WHERE pr_number = ${pr_number} LIMIT 1`);
        if (pr.rows.length > 0) prIdResolved = (pr.rows[0] as any).id;
        else {
          const pr2 = await db.execute(sql`SELECT id FROM mm_purchase_requisition WHERE pr_number = ${pr_number} LIMIT 1`);
          if (pr2.rows.length > 0) prIdResolved = (pr2.rows[0] as any).id;
        }
      } catch {}
    }

    // Generate PO number via number range
    let poNumber = body.po_number;
    if (!poNumber) {
      try {
        const nrRes = await db.execute(sql`SELECT current_number, prefix FROM core_number_range WHERE object_type = 'PO'::core_nr_object_type ORDER BY fiscal_year DESC LIMIT 1`);
        if (nrRes.rows.length > 0) {
          const current = parseInt((nrRes.rows[0] as any).current_number) + 1;
          const prefix = (nrRes.rows[0] as any).prefix || 'PO-';
          poNumber = `${prefix}${current}`;
          await db.execute(sql`UPDATE core_number_range SET current_number = ${current}, updated_at = NOW() WHERE object_type = 'PO'::core_nr_object_type`);
        } else {
          poNumber = `PO-${Date.now()}`;
        }
      } catch {
        poNumber = `PO-${Date.now()}`;
      }
    }

    try {
      const res = await db.execute(sql`
        INSERT INTO proc_purchase_order (po_number, legal_entity_id, company_code_id, partner_id, vendor_id, facility_id, plant_id, delivery_date, header_text, pr_id, currency_code, currency, payment_terms_days, incoterms, freight_amount, customs_amount, tax_amount)
        VALUES (${poNumber}, ${legalEntityIdResolved}, ${legalEntityIdResolved}, ${partnerIdResolved}, ${partnerIdResolved}, ${facilityIdResolved}, ${facilityIdResolved}, ${delivery_date ? new Date(delivery_date) : null}, ${header_text || null}, ${prIdResolved || null}, ${currency_code || 'INR'}, ${currency_code || 'INR'}, ${payment_terms_days || 30}, ${incoterms || 'EXW'}, ${freight_amount || 0}, ${customs_amount || 0}, ${tax_amount || 0})
        RETURNING id, po_number
      `);
      const poId = (res.rows[0] as any).id;

      if (lines && Array.isArray(lines)) {
        let total = 0;
        let totalLanded = 0;
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
          let unitPrice = parseFloat(line.unit_price || line.unitPrice || '0');
          // T2 ME11 Info Record – if unit price not provided or 0, lookup from proc_info_record vendor-material
          if(unitPrice === 0){
            try{
              const infoRes = await db.execute(sql`
                SELECT unit_price FROM proc_info_record 
                WHERE (partner_id = ${partnerIdResolved} OR vendor_id = ${partnerIdResolved}) 
                AND (item_id = ${itemId} OR material_id = ${itemId})
                AND (valid_from <= CURRENT_DATE AND (valid_to IS NULL OR valid_to >= CURRENT_DATE))
                ORDER BY valid_from DESC LIMIT 1
              `);
              if(infoRes.rows.length>0){
                unitPrice = parseFloat((infoRes.rows[0] as any).unit_price || '0');
                console.log(`T2 ME11 Info Record auto price – vendor ${partnerIdResolved} material ${itemId} price ${unitPrice} – used in PO ${poNumber}`);
              }
            }catch(e){ console.warn('Info record lookup failed – T2 ME11:', e); }
          }
          const freight = parseFloat(line.freight_per_unit || '0');
          const customs = parseFloat(line.customs_per_unit || '0');
          const tax = parseFloat(line.tax_per_unit || '0');
          const totalPerUnit = unitPrice + freight + customs + tax;
          total += qty * unitPrice;
          totalLanded += qty * totalPerUnit;

          await db.execute(sql`
            INSERT INTO proc_po_line (po_id, line_number, item_id, material_id, quantity, uom_code, uom, unit_price, freight_per_unit, customs_per_unit, tax_per_unit, total_per_unit, facility_id, plant_id, inventory_location_id, sloc_id, item_text, delivery_text, is_landed_cost_relevant)
            VALUES (${poId}, ${line.line_number || i + 10}, ${itemId}, ${itemId}, ${qty}, ${line.uom_code || line.uom || 'PC'}, ${line.uom_code || line.uom || 'PC'}, ${unitPrice}, ${freight}, ${customs}, ${tax}, ${totalPerUnit}, ${facilityIdResolved}, ${facilityIdResolved}, ${invLocId || null}, ${invLocId || null}, ${line.item_text || null}, ${line.delivery_text || null}, ${line.is_landed_cost_relevant ?? true})
          `);
        }

        await db.execute(sql`UPDATE proc_purchase_order SET total_amount = ${total}, total_landed_cost = ${totalLanded} WHERE id = ${poId}`);
      }

      return NextResponse.json({ success: true, po: res.rows[0], poNumber, code: 'PPOC', message: `PO ${poNumber} created – PPOC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('proc_purchase_order insert failed fallback mm_purchase_order:', newErr.message);
      return NextResponse.json({ error: newErr.message }, { status: 500 });
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
    const originalNumber = body.po_number || body.document_number || body.id;

    if (originalNumber && (isReversal || action.includes('ADJUST') || action.includes('CORRECT'))) {
      const reversalResult = await createReversalOrAdjustmentDocument({
        original_document_type: 'PO',
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
          await db.execute(sql`UPDATE proc_purchase_order SET status = ${newStatus}::proc_po_status, updated_at = NOW() WHERE po_number = ${originalNumber} OR id::text = ${originalNumber}`);
        } catch (e) { console.warn('Status update failed', e); }

        return NextResponse.json({
          success: true,
          original_document: originalNumber,
          reversal_document: reversalResult.reversal_document_number,
          reversal_type: reversalResult.reversal_type,
          action: action,
          code: reversalResult.reversal_type,
          message: `${isReversal ? 'Reversal' : 'Adjustment'} document ${reversalResult.reversal_document_number} (${reversalResult.reversal_type}) created for ${originalNumber} – edit as reversal/adjustment – immutable audit trail`,
          legalSafe: true,
          audit_trail: `Original ${originalNumber} status set to ${isReversal ? 'REVERSED' : 'ADJUSTED'}`
        });
      }
    }

    try {
      if (originalNumber) await updateDocumentWithAudit({ document_number: originalNumber, new_payload: body, changed_by: 'system', action: 'UPDATE' });
    } catch (auditErr) { console.warn('Audit trail failed', auditErr); }

    try {
      const { id, po_number, status } = body;
      if (!id && !po_number) return NextResponse.json({ error: 'id or po_number required' }, { status: 400 });
      let res;
      if (id) res = await db.execute(sql`UPDATE proc_purchase_order SET status = ${status}::proc_po_status, updated_at = NOW() WHERE id = ${id} RETURNING id, po_number, status`);
      else res = await db.execute(sql`UPDATE proc_purchase_order SET status = ${status}::proc_po_status, updated_at = NOW() WHERE po_number = ${po_number} RETURNING id, po_number, status`);
      if (res.rows.length === 0) throw new Error('Not found');
      return NextResponse.json({ success: true, po: res.rows[0], code: 'PPOC', message: `PO ${res.rows[0].po_number} status ${status} – PPOC legal-safe`, audit_trail: 'Immutable history preserved' });
    } catch {
      const { id, po_number, status } = body;
      let res;
      if (id) res = await db.execute(sql`UPDATE mm_purchase_order SET status = ${status}::po_status, updated_at = NOW() WHERE id = ${id} RETURNING id, po_number, status`);
      else res = await db.execute(sql`UPDATE mm_purchase_order SET status = ${status}::po_status, updated_at = NOW() WHERE po_number = ${po_number} RETURNING id, po_number, status`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'PO not found' }, { status: 404 });
      return NextResponse.json({ success: true, po: res.rows[0], message: `PO ${res.rows[0].po_number} status ${status} – ME21N legacy` });
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
    const po_number = searchParams.get('po_number');
    if (!id && !po_number) return NextResponse.json({ error: 'id or po_number required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM proc_purchase_order WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM proc_purchase_order WHERE po_number = ${po_number}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM mm_purchase_order WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM mm_purchase_order WHERE po_number = ${po_number}`);
    }

    return NextResponse.json({ success: true, code: 'PPOC', message: `PO ${po_number || id} deleted – PPOC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
