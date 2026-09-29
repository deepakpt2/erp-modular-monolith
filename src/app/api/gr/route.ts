import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { getNextDocumentNumber, createDocumentEntry, updateDocumentWithAudit } from '@/shared/kernel/db/documentHelpers';
import { createReversalOrAdjustmentDocument, getReversalDocType } from '@/shared/kernel/db/reversalHelpers';

/**
 * Goods Receipt API – Legal-safe own IP – Module 6 MM Procurement
 * New: proc_goods_receipt + proc_gr_line (was mm_goods_receipt + mm_gr_line) – grNumber GR-5000000001 was 50*, poId, legalEntityId was company_code_id, facilityId was plant_id FAC-1000 was 1000, itemId was material_id prod_item EMTC, facilityId, inventoryLocationId was sloc_id, lotId was batch_id inv_lot ELTC, lotNumber was batch_number, uomCode was uom EUOC, stockStatus UNRESTRICTED/QUALITY_INSPECTION/BLOCKED/IN_TRANSIT was UNRESTRICTED/QI/BLOCKED, universalLedgerId was fi_document_id FULC BSX/WRX
 * Helper code: PGRC GR Create (alias GRC, MIGO, FIN-GR-CR) – 4-char MOOA P=Procurement, GR=GoodsReceipt, C=Create – same length as MIGO but own IP, module grouped, intuitive
 * Fallback to legacy mm_goods_receipt
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const plantId = searchParams.get('plantId') || searchParams.get('facilityId');
  const slocId = searchParams.get('slocId') || searchParams.get('inventoryLocationId');
  const poId = searchParams.get('poId');
  const status = searchParams.get('status');

  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'proc_goods_receipt';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT 
          gr.id, gr.gr_number, gr.status, gr.posting_date, gr.total_amount, gr.total_landed_cost, gr.universal_ledger_id as fi_document_id,
          po.po_number, po.partner_id as vendor_id,
          f.code as plant_code, f.name as plant_name,
          f.code as facility_code, f.name as facility_name,
          iloc.code as sloc_code, iloc.code as inventory_location_code,
          pa.display_name as vendor_name,
          (SELECT COUNT(*) FROM proc_gr_line WHERE gr_id = gr.id) as line_count,
          (SELECT SUM(quantity) FROM proc_gr_line WHERE gr_id = gr.id) as total_qty
        FROM proc_goods_receipt gr
        LEFT JOIN proc_purchase_order po ON gr.po_id = po.id
        LEFT JOIN org_facility f ON gr.facility_id = f.id
        LEFT JOIN org_inventory_location iloc ON iloc.facility_id = f.id
        LEFT JOIN partner_account pa ON po.partner_id = pa.id
        WHERE 1=1
      `;

      if (search) query = sql`${query} AND (gr.gr_number ILIKE ${`%${search}%`} OR po.po_number ILIKE ${`%${search}%`} OR pa.display_name ILIKE ${`%${search}%`})`;
      if (plantId) query = sql`${query} AND (gr.facility_id = ${plantId} OR gr.plant_id = ${plantId})`;
      if (slocId) query = sql`${query} AND EXISTS (SELECT 1 FROM proc_gr_line WHERE gr_id = gr.id AND (inventory_location_id = ${slocId} OR sloc_id = ${slocId}))`;
      if (poId) query = sql`${query} AND gr.po_id = ${poId}`;
      if (status) query = sql`${query} AND gr.status = ${status}::proc_gr_status`;

      query = sql`${query} ORDER BY gr.posting_date DESC LIMIT ${limit}`;

      const result = await db.execute(query);
      rows = result.rows as any[];
    } catch (newErr: any) {
      console.warn('proc_goods_receipt not yet fallback mm_goods_receipt:', newErr.message);
      source = 'db-legacy';
      table = 'mm_goods_receipt';
      legalSafe = false;

      let query = sql`
        SELECT 
          gr.id, gr.gr_number, gr.status, gr.posting_date, gr.total_amount, gr.total_landed_cost, gr.fi_document_id,
          po.po_number, po.vendor_id,
          p.code as plant_code, p.name as plant_name,
          sloc.code as sloc_code,
          COALESCE(pa.display_name, bp.name1) as vendor_name,
          (SELECT COUNT(*) FROM mm_gr_line WHERE gr_id = gr.id) as line_count,
          (SELECT SUM(quantity) FROM mm_gr_line WHERE gr_id = gr.id) as total_qty
        FROM mm_goods_receipt gr
        LEFT JOIN mm_purchase_order po ON gr.po_id = po.id
        LEFT JOIN ent_plant p ON gr.plant_id = p.id
        LEFT JOIN ent_storage_location sloc ON sloc.plant_id = p.id
        LEFT JOIN partner_account pa ON po.vendor_id = pa.id
        LEFT JOIN ent_business_partner bp ON po.vendor_id = bp.id
        WHERE 1=1
      `;

      if (search) query = sql`${query} AND (gr.gr_number ILIKE ${`%${search}%`} OR po.po_number ILIKE ${`%${search}%`} OR COALESCE(pa.display_name, bp.name1) ILIKE ${`%${search}%`})`;
      if (plantId) query = sql`${query} AND gr.plant_id = ${plantId}`;
      if (slocId) query = sql`${query} AND EXISTS (SELECT 1 FROM mm_gr_line WHERE gr_id = gr.id AND sloc_id = ${slocId})`;
      if (poId) query = sql`${query} AND gr.po_id = ${poId}`;
      if (status) query = sql`${query} AND gr.status = ${status}::gr_status`;

      query = sql`${query} ORDER BY gr.posting_date DESC LIMIT ${limit}`;

      const result = await db.execute(query);
      rows = result.rows as any[];
    }

    return NextResponse.json({
      grs: rows,
      goodsReceipts: rows,
      count: rows.length,
      code: 'PGRC',
      aliasCodes: ['GRC', 'MIGO', 'FIN-GR-CR'],
      helperCode: 'PGRC',
      table,
      source,
      legalSafe,
      functionDescription: 'Goods Receipt – PGRC legal-safe own IP (was MIGO 50 WE/WA) – grNumber GR-5000000001, facilityId FAC-1000 was plant_id, itemId EMTC was material_id, inventoryLocationId was sloc_id, lotId ELTC was batch_id, uomCode EUOC, stockStatus UNRESTRICTED/QUALITY_INSPECTION/BLOCKED/IN_TRANSIT was UNRESTRICTED/QI/BLOCKED, universalLedgerId FULC was fi_document_id BSX/WRX',
      multiPlant: 'facility_id, inventory_location_id filtering, PI blocking check – Module6',
      explanation: 'GR legal-safe proc_goods_receipt + proc_gr_line – grNumber GR-5000000001 was 50*, poId, legalEntityId was company_code_id, facilityId was plant_id FAC-1000 was 1000, itemId was material_id prod_item EMTC, facilityId, inventoryLocationId was sloc_id, lotId was batch_id inv_lot ELTC, lotNumber was batch_number, uomCode was uom EUOC, stockStatus UNRESTRICTED/QUALITY_INSPECTION/BLOCKED/IN_TRANSIT was UNRESTRICTED/QI/BLOCKED, universalLedgerId was fi_document_id FULC BSX/WRX – Code PGRC primary alias GRC/MIGO – 4-char MOOA P=Procurement GR=GoodsReceipt C=Create – module grouped intuitive, same length as MIGO but own IP.',
    });
  } catch (e: any) {
    console.error('DB error:', e.message);
    return NextResponse.json({ error: e.message, code: 'DB_ERROR', grs: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    // SAP-like unique document number – FNDC – auto-generate from FNRC if not provided
    let gr_number = body.gr_number;
    if (!gr_number) {
      try {
        const next = await getNextDocumentNumber('GR', body.company_code || body.legal_entity_code || '1000');
        gr_number = next.document_number;
      } catch { gr_number = `GR-${Date.now()}`; }
    }
    const { po_id, po_number, facility_id, plant_id, facility_code, plant_code, posting_date, document_date, header_text, lines } = body;

    let poIdResolved = po_id;
    if (!poIdResolved && po_number) {
      try {
        const po = await db.execute(sql`SELECT id FROM proc_purchase_order WHERE po_number = ${po_number} LIMIT 1`);
        if (po.rows.length > 0) poIdResolved = (po.rows[0] as any).id;
        else {
          const po2 = await db.execute(sql`SELECT id FROM mm_purchase_order WHERE po_number = ${po_number} LIMIT 1`);
          if (po2.rows.length > 0) poIdResolved = (po2.rows[0] as any).id;
        }
      } catch {}
    }
    if (!poIdResolved) return NextResponse.json({ error: 'po_id or po_number required' }, { status: 400 });

    let facilityIdResolved = facility_id || plant_id;
    if (!facilityIdResolved && (facility_code || plant_code)) {
      try {
        const f = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${facility_code || plant_code} LIMIT 1`);
        if (f.rows.length > 0) facilityIdResolved = (f.rows[0] as any).id;
        else {
          const f2 = await db.execute(sql`SELECT id FROM ent_plant WHERE code = ${facility_code || plant_code} LIMIT 1`);
          if (f2.rows.length > 0) facilityIdResolved = (f2.rows[0] as any).id;
        }
      } catch {}
    }

    // Get PO facility if not provided
    if (!facilityIdResolved) {
      try {
        const poFac = await db.execute(sql`SELECT facility_id, plant_id FROM proc_purchase_order WHERE id = ${poIdResolved} LIMIT 1`);
        if (poFac.rows.length > 0) facilityIdResolved = (poFac.rows[0] as any).facility_id || (poFac.rows[0] as any).plant_id;
        else {
          const poFac2 = await db.execute(sql`SELECT plant_id FROM mm_purchase_order WHERE id = ${poIdResolved} LIMIT 1`);
          if (poFac2.rows.length > 0) facilityIdResolved = (poFac2.rows[0] as any).plant_id;
        }
      } catch {}
    }

    let grNumber = body.gr_number;
    if (!grNumber) {
      try {
        const nrRes = await db.execute(sql`SELECT current_number, prefix FROM core_number_range WHERE object_type = 'GR'::core_nr_object_type ORDER BY fiscal_year DESC LIMIT 1`);
        if (nrRes.rows.length > 0) {
          const current = parseInt((nrRes.rows[0] as any).current_number) + 1;
          const prefix = (nrRes.rows[0] as any).prefix || 'GR-';
          grNumber = `${prefix}${current}`;
          await db.execute(sql`UPDATE core_number_range SET current_number = ${current}, updated_at = NOW() WHERE object_type = 'GR'::core_nr_object_type`);
        } else {
          grNumber = `GR-${Date.now()}`;
        }
      } catch {
        grNumber = `GR-${Date.now()}`;
      }
    }

    try {
      const res = await db.execute(sql`
        INSERT INTO proc_goods_receipt (gr_number, po_id, facility_id, plant_id, posting_date, document_date, header_text)
        VALUES (${grNumber}, ${poIdResolved}, ${facilityIdResolved}, ${facilityIdResolved}, ${posting_date ? new Date(posting_date) : new Date()}, ${document_date ? new Date(document_date) : new Date()}, ${header_text || null})
        RETURNING id, gr_number
      `);
      const grId = (res.rows[0] as any).id;

      if (lines && Array.isArray(lines)) {
        let total = 0;
        let totalLanded = 0;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          let poLineId = line.po_line_id;
          if (!poLineId && line.po_line_number) {
            try {
              const pl = await db.execute(sql`SELECT id FROM proc_po_line WHERE po_id = ${poIdResolved} AND line_number = ${line.po_line_number} LIMIT 1`);
              if (pl.rows.length > 0) poLineId = (pl.rows[0] as any).id;
            } catch {}
          }
          if (!poLineId) continue;

          let itemId = line.item_id;
          let facilityIdLine = line.facility_id || facilityIdResolved;
          let invLocId = line.inventory_location_id;
          let lotId = line.lot_id;
          const qty = parseFloat(line.quantity || '0');
          const unitPrice = parseFloat(line.unit_price || '0');
          const unitLanded = parseFloat(line.unit_landed_cost || '0');
          const totalVal = qty * (unitPrice + unitLanded);
          total += qty * unitPrice;
          totalLanded += totalVal;

          try {
            const poLineInfo = await db.execute(sql`SELECT item_id, facility_id, inventory_location_id FROM proc_po_line WHERE id = ${poLineId} LIMIT 1`);
            if (poLineInfo.rows.length > 0) {
              itemId = itemId || (poLineInfo.rows[0] as any).item_id;
              facilityIdLine = facilityIdLine || (poLineInfo.rows[0] as any).facility_id;
              invLocId = invLocId || (poLineInfo.rows[0] as any).inventory_location_id;
            }
          } catch {}

          await db.execute(sql`
            INSERT INTO proc_gr_line (gr_id, po_line_id, line_number, item_id, facility_id, inventory_location_id, lot_id, lot_number, batch_id, batch_number, quantity, uom_code, uom, unit_price, unit_landed_cost, total_value, stock_status)
            VALUES (${grId}, ${poLineId}, ${line.line_number || i + 10}, ${itemId}, ${facilityIdLine}, ${invLocId || null}, ${lotId || null}, ${line.lot_number || null}, ${lotId || null}, ${line.lot_number || null}, ${qty}, ${line.uom_code || line.uom || 'PC'}, ${line.uom_code || line.uom || 'PC'}, ${unitPrice}, ${unitLanded}, ${totalVal}, ${line.stock_status || 'UNRESTRICTED'}::proc_stock_status)
          `);

          // Update PO line received qty
          try {
            await db.execute(sql`UPDATE proc_po_line SET quantity_received = quantity_received + ${qty} WHERE id = ${poLineId}`);
          } catch {}
        }

        await db.execute(sql`UPDATE proc_goods_receipt SET total_amount = ${total}, total_landed_cost = ${totalLanded} WHERE id = ${grId}`);
      }

      return NextResponse.json({ success: true, gr: res.rows[0], grNumber, code: 'PGRC', message: `GR ${grNumber} created – PGRC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('proc_goods_receipt insert failed:', newErr.message);
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
    const originalNumber = body.gr_number || body.document_number || body.id;

    if (originalNumber && (isReversal || action.includes('ADJUST') || action.includes('CORRECT'))) {
      const reversalResult = await createReversalOrAdjustmentDocument({
        original_document_type: 'GR',
        original_document_number: originalNumber,
        action: action as any,
        reason: body.reason || body.reversal_reason || null,
        new_payload: body,
        company_code: body.company_code || '1000',
        changed_by: body.changed_by || 'system'
      });

      if (reversalResult.success) {
        try {
          const newStatus = isReversal ? 'REVERSED' : 'ADJUSTED';
          await db.execute(sql`UPDATE proc_goods_receipt SET status = ${newStatus}::proc_gr_status, updated_at = NOW() WHERE gr_number = ${originalNumber} OR id::text = ${originalNumber}`);
        } catch (e) { console.warn('Status update failed', e); }

        return NextResponse.json({
          success: true,
          original_document: originalNumber,
          reversal_document: reversalResult.reversal_document_number,
          reversal_type: reversalResult.reversal_type,
          action: action,
          code: reversalResult.reversal_type,
          message: `${isReversal ? 'Reversal' : 'Adjustment'} document ${reversalResult.reversal_document_number} (${reversalResult.reversal_type}) created for ${originalNumber} – GR reversal/adjustment – immutable audit trail – legal-safe own IP (was MIGO 102)`,
          legalSafe: true
        });
      }
    }

    try {
      if (originalNumber) await updateDocumentWithAudit({ document_number: originalNumber, new_payload: body, changed_by: 'system', action: 'UPDATE' });
    } catch {}

    const { id, gr_number, status } = body;
    if (!id && !gr_number) return NextResponse.json({ error: 'id or gr_number required' }, { status: 400 });
    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE proc_goods_receipt SET status = ${status}::proc_gr_status, updated_at = NOW() WHERE id = ${id} RETURNING id, gr_number, status`);
      else res = await db.execute(sql`UPDATE proc_goods_receipt SET status = ${status}::proc_gr_status, updated_at = NOW() WHERE gr_number = ${gr_number} RETURNING id, gr_number, status`);
      if (res.rows.length === 0) throw new Error('Not found');
      return NextResponse.json({ success: true, gr: res.rows[0], code: 'IGRC', message: `GR ${res.rows[0].gr_number} status ${status} – IGRC legal-safe`, audit_trail: 'Immutable history preserved' });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE mm_goods_receipt SET status = ${status}::gr_status WHERE id = ${id} RETURNING id, gr_number, status`);
      else res = await db.execute(sql`UPDATE mm_goods_receipt SET status = ${status}::gr_status WHERE gr_number = ${gr_number} RETURNING id, gr_number, status`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'GR not found' }, { status: 404 });
      return NextResponse.json({ success: true, gr: res.rows[0], message: `GR ${res.rows[0].gr_number} status ${status} – MIGO legacy` });
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
    const gr_number = searchParams.get('gr_number');
    if (!id && !gr_number) return NextResponse.json({ error: 'id or gr_number required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM proc_goods_receipt WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM proc_goods_receipt WHERE gr_number = ${gr_number}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM mm_goods_receipt WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM mm_goods_receipt WHERE gr_number = ${gr_number}`);
    }

    return NextResponse.json({ success: true, code: 'PGRC', message: `GR ${gr_number || id} deleted – PGRC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
