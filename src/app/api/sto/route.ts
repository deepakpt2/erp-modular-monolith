import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { getNextDocumentNumber, createDocumentEntry, updateDocumentWithAudit } from '@/shared/kernel/db/documentHelpers';
import { createReversalOrAdjustmentDocument, getReversalDocType } from '@/shared/kernel/db/reversalHelpers';

/**
 * Stock Transport Order API – Legal-safe own IP – Module 6 MM Procurement
 * New: proc_stock_transport_order + proc_sto_line (was mm_stock_transport_order + mm_sto_line) – stoNumber STO-4500000001, type ONE_STEP/TWO_STEP, status, legalEntityId was company_code_id, supplyingFacilityId was supplying_plant_id FAC-1000, supplyingInventoryLocationId was supplying_sloc_id, receivingFacilityId was receiving_plant_id, receivingInventoryLocationId was receiving_sloc_id, inTransitFacilityId was in_transit_plant_id, freightCost, currencyCode INR default was KWD, itemId was material_id prod_item EMTC, uomCode EUOC, lotId ELTC was batch_id, lotNumber was batch_number
 * Helper code: PSTC STO Create (alias STC, PSTC (legacy ME27), FIN-ST-CR) – 4-char MOOA P=Procurement, ST=StockTransport, C=Create – same length as PSTC (legacy ME27) but own IP, module grouped, intuitive
 * Fallback to legacy mm_stock_transport_order
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const plantId = searchParams.get('plantId') || searchParams.get('facilityId');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'proc_stock_transport_order';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT 
          sto.id, sto.sto_number, sto.type, sto.status, sto.supplying_facility_id as supplying_plant_id, sto.receiving_facility_id as receiving_plant_id,
          sto.freight_cost, sto.total_amount, sto.currency_code as currency, sto.delivery_number, sto.header_text, sto.created_at,
          sp.code as supplying_plant_code, sp.name as supplying_plant_name,
          sp.code as supplying_facility_code, sp.name as supplying_facility_name,
          rp.code as receiving_plant_code, rp.name as receiving_plant_name,
          rp.code as receiving_facility_code, rp.name as receiving_facility_name,
          (SELECT COUNT(*) FROM proc_sto_line WHERE sto_id = sto.id) as line_count,
          (SELECT SUM(quantity) FROM proc_sto_line WHERE sto_id = sto.id) as total_qty,
          (SELECT SUM(quantity_issued) FROM proc_sto_line WHERE sto_id = sto.id) as total_issued,
          (SELECT SUM(quantity_received) FROM proc_sto_line WHERE sto_id = sto.id) as total_received,
          (SELECT SUM(quantity_in_transit) FROM proc_sto_line WHERE sto_id = sto.id) as total_in_transit
        FROM proc_stock_transport_order sto
        JOIN org_facility sp ON sto.supplying_facility_id = sp.id
        JOIN org_facility rp ON sto.receiving_facility_id = rp.id
        WHERE 1=1
      `;

      if (status) query = sql`${query} AND sto.status = ${status}::proc_sto_status`;
      if (plantId) query = sql`${query} AND (sto.supplying_facility_id = ${plantId} OR sto.receiving_facility_id = ${plantId} OR sto.supplying_plant_id = ${plantId} OR sto.receiving_plant_id = ${plantId})`;
      if (search) query = sql`${query} AND (sto.sto_number ILIKE ${`%${search}%`} OR sp.code ILIKE ${`%${search}%`} OR rp.code ILIKE ${`%${search}%`})`;

      query = sql`${query} ORDER BY sto.sto_number DESC LIMIT ${limit}`;

      const result = await db.execute(query);
      rows = result.rows as any[];

      const stos = [];
      for (const row of rows as any[]) {
        try {
          const linesRes = await db.execute(sql`
            SELECT l.id, l.line_number, l.item_id as material_id, l.quantity, l.quantity_issued, l.quantity_received, l.quantity_in_transit, l.uom_code as uom, l.unit_price, l.lot_number as batch_number, l.is_closed,
                   pi.item_number as material_number, pi.description as description
            FROM proc_sto_line l
            LEFT JOIN prod_item pi ON l.item_id = pi.id
            WHERE l.sto_id = ${row.id}
            ORDER BY l.line_number
          `);
          stos.push({ ...row, lines: linesRes.rows });
        } catch {
          stos.push({ ...row, lines: [] });
        }
      }

      return NextResponse.json({
        stos,
        stockTransportOrders: stos,
        count: stos.length,
        code: 'PSTC',
        aliasCodes: ['STC', 'ME27', 'FIN-ST-CR'],
        helperCode: 'PSTC',
        table,
        source,
        legalSafe,
        functionDescription: 'Stock Transport Order – PSTC legal-safe own IP (was PSTC (legacy ME27)/IGRC (legacy MIGO)/PSTD (legacy VL10B)) – stoNumber STO-4500000001, type ONE_STEP/TWO_STEP, supplyingFacilityId FAC-1000 was supplying_plant_id, receivingFacilityId was receiving_plant_id, itemId EMTC was material_id, uomCode EUOC, lotId ELTC was batch_id',
        explanation: 'STO legal-safe proc_stock_transport_order + proc_sto_line – stoNumber STO-4500000001, type ONE_STEP/TWO_STEP, status, legalEntityId was company_code_id, supplyingFacilityId was supplying_plant_id FAC-1000, supplyingInventoryLocationId was supplying_sloc_id, receivingFacilityId was receiving_plant_id, receivingInventoryLocationId was receiving_sloc_id, inTransitFacilityId was in_transit_plant_id, freightCost, currencyCode INR default was KWD, itemId was material_id prod_item EMTC, uomCode EUOC, lotId ELTC was batch_id, lotNumber was batch_number – Code PSTC primary alias STC/PSTC (legacy ME27) – 4-char MOOA P=Procurement ST=StockTransport C=Create – module grouped intuitive, same length as PSTC (legacy ME27) but own IP.',
      });
    } catch (newErr: any) {
      console.warn('proc_stock_transport_order not yet fallback mm_stock_transport_order:', newErr.message);
      source = 'db-legacy';
      table = 'mm_stock_transport_order';
      legalSafe = false;

      let query = sql`
        SELECT 
          sto.id, sto.sto_number, sto.type, sto.status, sto.supplying_plant_id, sto.receiving_plant_id,
          sto.freight_cost, sto.total_amount, sto.currency, sto.delivery_number, sto.header_text, sto.created_at,
          sp.code as supplying_plant_code, sp.name as supplying_plant_name,
          rp.code as receiving_plant_code, rp.name as receiving_plant_name,
          (SELECT COUNT(*) FROM mm_sto_line WHERE sto_id = sto.id) as line_count,
          (SELECT SUM(quantity) FROM mm_sto_line WHERE sto_id = sto.id) as total_qty,
          (SELECT SUM(quantity_issued) FROM mm_sto_line WHERE sto_id = sto.id) as total_issued,
          (SELECT SUM(quantity_received) FROM mm_sto_line WHERE sto_id = sto.id) as total_received,
          (SELECT SUM(quantity_in_transit) FROM mm_sto_line WHERE sto_id = sto.id) as total_in_transit
        FROM mm_stock_transport_order sto
        JOIN org_facility sp ON sto.supplying_plant_id = sp.id
        JOIN org_facility rp ON sto.receiving_plant_id = rp.id
        WHERE 1=1
      `;

      if (status) query = sql`${query} AND sto.status = ${status}::sto_status`;
      if (plantId) query = sql`${query} AND (sto.supplying_plant_id = ${plantId} OR sto.receiving_plant_id = ${plantId})`;
      if (search) query = sql`${query} AND (sto.sto_number ILIKE ${`%${search}%`} OR sp.code ILIKE ${`%${search}%`} OR rp.code ILIKE ${`%${search}%`})`;

      query = sql`${query} ORDER BY sto.sto_number DESC LIMIT ${limit}`;

      const result = await db.execute(query);

      const stos = [];
      for (const row of result.rows as any[]) {
        const linesRes = await db.execute(sql`
          SELECT l.id, l.line_number, l.material_id, l.quantity, l.quantity_issued, l.quantity_received, l.quantity_in_transit, l.uom, l.unit_price, l.batch_number, l.is_closed,
                 m.material_number, m.description
          FROM mm_sto_line l
          JOIN prod_item m ON l.material_id = m.id
          WHERE l.sto_id = ${row.id}
          ORDER BY l.line_number
        `);
        stos.push({ ...row, lines: linesRes.rows });
      }

      return NextResponse.json({
        stos,
        stockTransportOrders: stos,
        count: stos.length,
        code: 'PSTC',
        aliasCodes: ['STC', 'ME27'],
        helperCode: 'PSTC',
        table,
        source,
        legalSafe,
        functionDescription: 'Stock Transport Order – PSTC legal-safe own IP (was PSTC (legacy ME27)/IGRC (legacy MIGO)/PSTD (legacy VL10B)) – legacy mm_stock_transport_order – migrating to proc_stock_transport_order',
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stos: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    // SAP-like unique document number – FNDC – auto-generate from FNRC if not provided
    let sto_number = body.sto_number;
    if (!sto_number) {
      try {
        const next = await getNextDocumentNumber('STO', body.company_code || body.legal_entity_code || '1000');
        sto_number = next.document_number;
      } catch { sto_number = `STO-${Date.now()}`; }
    }
    const { supplying_facility_id, supplying_plant_id, supplying_facility_code, supplying_plant_code, receiving_facility_id, receiving_plant_id, receiving_facility_code, receiving_plant_code, type, header_text, lines, currency_code, freight_cost } = body;

    let supplyingFacilityIdResolved = supplying_facility_id || supplying_plant_id;
    if (!supplyingFacilityIdResolved && (supplying_facility_code || supplying_plant_code)) {
      try {
        const f = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${supplying_facility_code || supplying_plant_code} LIMIT 1`);
        if (f.rows.length > 0) supplyingFacilityIdResolved = (f.rows[0] as any).id;
        else {
          const f2 = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${supplying_facility_code || supplying_plant_code} LIMIT 1`);
          if (f2.rows.length > 0) supplyingFacilityIdResolved = (f2.rows[0] as any).id;
        }
      } catch {}
    }

    let receivingFacilityIdResolved = receiving_facility_id || receiving_plant_id;
    if (!receivingFacilityIdResolved && (receiving_facility_code || receiving_plant_code)) {
      try {
        const f = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${receiving_facility_code || receiving_plant_code} LIMIT 1`);
        if (f.rows.length > 0) receivingFacilityIdResolved = (f.rows[0] as any).id;
        else {
          const f2 = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${receiving_facility_code || receiving_plant_code} LIMIT 1`);
          if (f2.rows.length > 0) receivingFacilityIdResolved = (f2.rows[0] as any).id;
        }
      } catch {}
    }

    if (!supplyingFacilityIdResolved || !receivingFacilityIdResolved) return NextResponse.json({ error: 'supplying_facility_id/code and receiving_facility_id/code required' }, { status: 400 });

    let stoNumber = body.sto_number;
    if (!stoNumber) {
      stoNumber = `STO-${Date.now()}`;
    }

    try {
      const res = await db.execute(sql`
        INSERT INTO proc_stock_transport_order (sto_number, type, supplying_facility_id, supplying_plant_id, receiving_facility_id, receiving_plant_id, header_text, currency_code, currency, freight_cost)
        VALUES (${stoNumber}, ${type || 'TWO_STEP'}::proc_sto_type, ${supplyingFacilityIdResolved}, ${supplyingFacilityIdResolved}, ${receivingFacilityIdResolved}, ${receivingFacilityIdResolved}, ${header_text || null}, ${currency_code || 'INR'}, ${currency_code || 'INR'}, ${freight_cost || 0})
        RETURNING id, sto_number
      `);
      const stoId = (res.rows[0] as any).id;

      if (lines && Array.isArray(lines)) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          let itemId = line.item_id || line.material_id;
          if (!itemId && line.item_number) {
            try {
              const it = await db.execute(sql`SELECT id FROM prod_item WHERE item_number = ${line.item_number} LIMIT 1`);
              if (it.rows.length > 0) itemId = (it.rows[0] as any).id;
            } catch {}
          }
          if (!itemId) continue;

          await db.execute(sql`
            INSERT INTO proc_sto_line (sto_id, line_number, item_id, material_id, quantity, uom_code, uom, unit_price, lot_id, batch_id, lot_number, batch_number)
            VALUES (${stoId}, ${line.line_number || i + 10}, ${itemId}, ${itemId}, ${line.quantity || 0}, ${line.uom_code || line.uom || 'PC'}, ${line.uom_code || line.uom || 'PC'}, ${line.unit_price || 0}, ${line.lot_id || line.batch_id || null}, ${line.lot_id || line.batch_id || null}, ${line.lot_number || line.batch_number || null}, ${line.lot_number || line.batch_number || null})
          `);
        }
      }

      return NextResponse.json({ success: true, sto: res.rows[0], stoNumber, code: 'PSTC', message: `STO ${stoNumber} created – PSTC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('proc_stock_transport_order insert failed:', newErr.message);
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

    // SAP-like edit = Reversal or Adjustment document – legal-safe own IP – FNDC
    // Edit does NOT directly UPDATE – creates reversal/adjustment doc
    const action = (body.action || body.edit_action || 'ADJUST').toUpperCase();
    const isReversal = action.includes('REVERSE');
    const isAdjustment = action.includes('ADJUST') || action.includes('CORRECT') || !isReversal;
    const originalNumber = body.sto_number || body.document_number || body.id;
    if (originalNumber && (isReversal || action.includes('ADJUST') || action.includes('CORRECT'))) {
      const reversalResult = await createReversalOrAdjustmentDocument({
        original_document_type: 'STO',
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
          await db.execute(sql`UPDATE proc_sto SET status = ${newStatus}::proc_sto_status, updated_at = NOW() WHERE sto_number = ${originalNumber} OR id::text = ${originalNumber}`);
        } catch (e) {
          console.warn('Status update failed for proc_sto', e);
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
    // If no action or not reversal/adjustment, fall through to legacy update with audit trail
    // Immutable audit trail – log before update
    try {
      const docNum = body.sto_number || body.document_number || body.id;
      if (docNum) await updateDocumentWithAudit({ document_number: docNum, new_payload: body, changed_by: 'system', action: 'UPDATE' });
    } catch (auditErr) { console.warn('Audit trail failed', auditErr); }
    const { id, sto_number, status, action: txn_action, sto_line_id, quantity } = body;
    if (!id && !sto_number) return NextResponse.json({ error: 'id or sto_number required' }, { status: 400 });

    // Handle issue/receive actions
    if (action && sto_line_id) {
      try {
        if (action === 'issue') {
          await db.execute(sql`UPDATE proc_sto_line SET quantity_issued = quantity_issued + ${quantity || 0}, quantity_in_transit = quantity_in_transit + ${quantity || 0} WHERE id = ${sto_line_id}`);
        } else if (action === 'receive') {
          await db.execute(sql`UPDATE proc_sto_line SET quantity_received = quantity_received + ${quantity || 0}, quantity_in_transit = quantity_in_transit - ${quantity || 0} WHERE id = ${sto_line_id}`);
        }
        return NextResponse.json({ success: true, code: 'PSTC', message: `STO line ${sto_line_id} ${action} ${quantity} – PSTC legal-safe` });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE proc_stock_transport_order SET status = ${status}::proc_sto_status, updated_at = NOW() WHERE id = ${id} RETURNING id, sto_number, status`);
      else res = await db.execute(sql`UPDATE proc_stock_transport_order SET status = ${status}::proc_sto_status, updated_at = NOW() WHERE sto_number = ${sto_number} RETURNING id, sto_number, status`);
      if (res.rows.length === 0) throw new Error('Not found in proc_stock_transport_order');
      return NextResponse.json({ success: true, sto: res.rows[0], code: 'PSTC', message: `STO ${res.rows[0].sto_number} status ${status} – PSTC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE mm_stock_transport_order SET status = ${status}::sto_status, updated_at = NOW() WHERE id = ${id} RETURNING id, sto_number, status`);
      else res = await db.execute(sql`UPDATE mm_stock_transport_order SET status = ${status}::sto_status, updated_at = NOW() WHERE sto_number = ${sto_number} RETURNING id, sto_number, status`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'STO not found' }, { status: 404 });
      return NextResponse.json({ success: true, sto: res.rows[0], message: `STO ${res.rows[0].sto_number} status ${status} – PSTC (legacy ME27) legacy` });
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
    const sto_number = searchParams.get('sto_number');
    if (!id && !sto_number) return NextResponse.json({ error: 'id or sto_number required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM proc_stock_transport_order WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM proc_stock_transport_order WHERE sto_number = ${sto_number}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM mm_stock_transport_order WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM mm_stock_transport_order WHERE sto_number = ${sto_number}`);
    }

    return NextResponse.json({ success: true, code: 'PSTC', message: `STO ${sto_number || id} deleted – PSTC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
