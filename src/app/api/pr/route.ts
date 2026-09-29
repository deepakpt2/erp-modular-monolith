import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

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
          pi.item_number as material_number, pi.name as material_description,
          pi.item_number, pi.name as item_name,
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

    // Generate PR number via number range
    let prNumber = body.pr_number;
    if (!prNumber) {
      try {
        const nrRes = await db.execute(sql`SELECT current_number, prefix FROM core_number_range WHERE object_type = 'PR'::core_nr_object_type ORDER BY fiscal_year DESC LIMIT 1`);
        if (nrRes.rows.length > 0) {
          const current = parseInt((nrRes.rows[0] as any).current_number) + 1;
          const prefix = (nrRes.rows[0] as any).prefix || 'PR-';
          prNumber = `${prefix}${current}`;
          await db.execute(sql`UPDATE core_number_range SET current_number = ${current}, updated_at = NOW() WHERE object_type = 'PR'::core_nr_object_type`);
        } else {
          prNumber = `PR-${Date.now()}`;
        }
      } catch {
        prNumber = `PR-${Date.now()}`;
      }
    }

    try {
      const res = await db.execute(sql`
        INSERT INTO proc_purchase_requisition (pr_number, legal_entity_id, company_code_id, facility_id, plant_id, requester_id, required_date, header_text, currency_code, currency)
        VALUES (${prNumber}, ${legalEntityIdResolved}, ${legalEntityIdResolved}, ${facilityIdResolved}, ${facilityIdResolved}, ${requester_id || null}, ${required_date ? new Date(required_date) : null}, ${header_text || null}, ${currency_code || 'INR'}, ${currency_code || 'INR'})
        RETURNING id, pr_number
      `);
      const prId = (res.rows[0] as any).id;

      if (lines && Array.isArray(lines)) {
        let total = 0;
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

      return NextResponse.json({ success: true, pr: res.rows[0], prNumber, code: 'PPRC', message: `PR ${prNumber} created – PPRC legal-safe`, legalSafe: true });
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
    const { id, pr_number, status } = body;
    if (!id && !pr_number) return NextResponse.json({ error: 'id or pr_number required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE proc_purchase_requisition SET status = ${status}::proc_pr_status, updated_at = NOW() WHERE id = ${id} RETURNING id, pr_number, status`);
      else res = await db.execute(sql`UPDATE proc_purchase_requisition SET status = ${status}::proc_pr_status, updated_at = NOW() WHERE pr_number = ${pr_number} RETURNING id, pr_number, status`);
      if (res.rows.length === 0) throw new Error('Not found in proc_purchase_requisition');
      return NextResponse.json({ success: true, pr: res.rows[0], code: 'PPRC', message: `PR ${res.rows[0].pr_number} status ${status} – PPRC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE mm_purchase_requisition SET status = ${status}::pr_status, updated_at = NOW() WHERE id = ${id} RETURNING id, pr_number, status`);
      else res = await db.execute(sql`UPDATE mm_purchase_requisition SET status = ${status}::pr_status, updated_at = NOW() WHERE pr_number = ${pr_number} RETURNING id, pr_number, status`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'PR not found' }, { status: 404 });
      return NextResponse.json({ success: true, pr: res.rows[0], message: `PR ${res.rows[0].pr_number} status ${status} – ME51N legacy` });
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
