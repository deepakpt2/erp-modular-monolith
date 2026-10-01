import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { getNextDocumentNumber, createDocumentEntry, updateDocumentWithAudit } from '@/shared/kernel/db/documentHelpers';

/**
 * Kitting API – Legal-safe own IP – Module 7 PP Manufacturing
 * New: mfg_kitting_order + mfg_production_order isKitting (was pp_kitting_order + pp_production_order) – kittingNumber KIT-1000001, productionOrderId, kitItemId was kit_material_id prod_item EMTC, targetLotId was target_batch_id inv_lot ELTC, targetQuantity, minComponentExpiry, calculatedExpiry MIN(component expiries), k01MovementId consumption, k02MovementId production, status
 * Helper code: MKTC Kitting Create (alias KTC, MMOC (legacy CO01) Kitting, FIN-KIT-CR) – 4-char MOOA M=Manufacturing, KT=Kitting, C=Create – module grouped intuitive
 * Fallback to legacy pp_kitting_order
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const facilityId = searchParams.get('facilityId') || searchParams.get('plantId');
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'mfg_kitting_order';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT ko.*, po.order_number as production_order_number, pi.item_number as kit_number, pi.description as kit_name, il.lot_number as target_lot_number, f.code as facility_code
        FROM mfg_kitting_order ko
        LEFT JOIN mfg_production_order po ON ko.production_order_id = po.id
        LEFT JOIN prod_item pi ON ko.kit_item_id = pi.id
        LEFT JOIN inv_lot il ON ko.target_lot_id = il.id
        LEFT JOIN org_facility f ON po.facility_id = f.id
        WHERE 1=1
      `;
      if (status) query = sql`${query} AND ko.status = ${status}::mfg_prod_order_status`;
      if (facilityId) query = sql`${query} AND po.facility_id = ${facilityId}`;
      if (search) query = sql`${query} AND (ko.kitting_number ILIKE ${`%${search}%`} OR pi.item_number ILIKE ${`%${search}%`} OR pi.name ILIKE ${`%${search}%`})`;
      query = sql`${query} ORDER BY ko.kitting_number DESC LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('mfg_kitting_order not yet fallback pp_kitting_order:', newErr.message);
      source = 'db-legacy';
      table = 'pp_kitting_order';
      legalSafe = false;
      let query = sql`
        SELECT ko.*, po.order_number as production_order_number, m.material_number as kit_number, m.description as kit_name, b.batch_number as target_batch_number
        FROM pp_kitting_order ko
        LEFT JOIN pp_production_order po ON ko.production_order_id = po.id
        LEFT JOIN prod_item m ON ko.kit_material_id = m.id
        LEFT JOIN inv_lot b ON ko.target_batch_id = b.id
        WHERE 1=1
      `;
      if (status) query = sql`${query} AND ko.status = ${status}::prod_order_status`;
      if (search) query = sql`${query} AND (ko.kitting_number ILIKE ${`%${search}%`} OR m.material_number ILIKE ${`%${search}%`})`;
      query = sql`${query} ORDER BY ko.kitting_number DESC LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    }

    return NextResponse.json({
      kittingOrders: rows,
      count: rows.length,
      code: 'MKTC',
      aliasCodes: ['KTC', 'CO01', 'FIN-KIT-CR'],
      helperCode: 'MKTC',
      table,
      source,
      legalSafe,
      functionDescription: 'Kitting Order – MKTC legal-safe own IP (was MMOC (legacy CO01) Kitting) – kittingNumber KIT-1000001, kitItemId EMTC was kit_material_id, targetLotId ELTC was target_batch_id, targetQuantity, minComponentExpiry MIN(component expiries), calculatedExpiry, k01/k02 movements',
      explanation: 'Kitting legal-safe mfg_kitting_order + mfg_production_order isKitting – kittingNumber KIT-1000001, productionOrderId, kitItemId EMTC was kit_material_id, targetLotId ELTC was target_batch_id, targetQuantity, minComponentExpiry, calculatedExpiry MIN(component expiries), k01MovementId consumption, k02MovementId production, status – Code MKTC primary alias KTC/MMOC (legacy CO01) – 4-char MOOA M=Manufacturing KT=Kitting C=Create – module grouped intuitive, same length as MMOC (legacy CO01) but own IP.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, kittingOrders: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    // SAP-like unique document number – FNDC – auto-generate from FNRC if not provided
    let kit_number = body.kit_number;
    if (!kit_number) {
      try {
        const next = await getNextDocumentNumber('KIT', body.company_code || body.legal_entity_code || '1000');
        kit_number = next.document_number;
      } catch { kit_number = `KIT-${Date.now()}`; }
    }
    const { production_order_id, kit_item_id, kit_item_number, target_lot_id, target_quantity, min_component_expiry, calculated_expiry } = body;

    let kitItemIdResolved = kit_item_id;
    if (!kitItemIdResolved && kit_item_number) {
      try {
        const it = await db.execute(sql`SELECT id FROM prod_item WHERE item_number = ${kit_item_number} LIMIT 1`);
        if (it.rows.length > 0) kitItemIdResolved = (it.rows[0] as any).id;
      } catch {}
    }

    let targetLotIdResolved = target_lot_id;
    // If no lot provided, create new lot
    if (!targetLotIdResolved && kitItemIdResolved) {
      try {
        const lotRes = await db.execute(sql`
          INSERT INTO inv_lot (lot_number, item_id, manufacturing_date, expiry_date)
          VALUES (${`LOT-${Date.now()}`}, ${kitItemIdResolved}, NOW(), ${calculated_expiry ? new Date(calculated_expiry) : new Date(Date.now() + 365*24*60*60*1000)})
          RETURNING id
        `);
        targetLotIdResolved = (lotRes.rows[0] as any).id;
      } catch (e: any) {
        console.warn('inv_lot create failed:', e.message);
      }
    }

    if (!production_order_id) return NextResponse.json({ error: 'production_order_id required' }, { status: 400 });
    if (!kitItemIdResolved) return NextResponse.json({ error: 'kit_item_id or kit_item_number required' }, { status: 400 });

    let kittingNumber = body.kitting_number;
    if (!kittingNumber) kittingNumber = `KIT-${Date.now()}`;

    try {
      const res = await db.execute(sql`
        INSERT INTO mfg_kitting_order (kitting_number, production_order_id, kit_item_id, kit_material_id, target_lot_id, target_batch_id, target_quantity, min_component_expiry, calculated_expiry)
        VALUES (${kittingNumber}, ${production_order_id}, ${kitItemIdResolved}, ${kitItemIdResolved}, ${targetLotIdResolved || null}, ${targetLotIdResolved || null}, ${target_quantity || 1}, ${min_component_expiry ? new Date(min_component_expiry) : null}, ${calculated_expiry ? new Date(calculated_expiry) : null})
        RETURNING id, kitting_number
      `);

      return NextResponse.json({ success: true, kittingOrder: res.rows[0], kittingNumber, code: 'MKTC', message: `Kitting order ${kittingNumber} created – MKTC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('mfg_kitting_order insert failed:', newErr.message);
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
    // Immutable audit trail – log before update
    try {
      const docNum = body.kit_number || body.document_number || body.id;
      if (docNum) await updateDocumentWithAudit({ document_number: docNum, new_payload: body, changed_by: 'system', action: 'UPDATE' });
    } catch (auditErr) { console.warn('Audit trail failed', auditErr); }
    const { id, kitting_number, status } = body;
    if (!id && !kitting_number) return NextResponse.json({ error: 'id or kitting_number required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE mfg_kitting_order SET status = ${status}::mfg_prod_order_status WHERE id = ${id} RETURNING id, kitting_number, status`);
      else res = await db.execute(sql`UPDATE mfg_kitting_order SET status = ${status}::mfg_prod_order_status WHERE kitting_number = ${kitting_number} RETURNING id, kitting_number, status`);
      if (res.rows.length === 0) throw new Error('Not found in mfg_kitting_order');
      return NextResponse.json({ success: true, kittingOrder: res.rows[0], code: 'MKTC', message: `Kitting order ${res.rows[0].kitting_number} status ${status} – MKTC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE pp_kitting_order SET status = ${status}::prod_order_status WHERE id = ${id} RETURNING id, kitting_number, status`);
      else res = await db.execute(sql`UPDATE pp_kitting_order SET status = ${status}::prod_order_status WHERE kitting_number = ${kitting_number} RETURNING id, kitting_number, status`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Kitting order not found' }, { status: 404 });
      return NextResponse.json({ success: true, kittingOrder: res.rows[0], message: `Kitting order ${res.rows[0].kitting_number} status ${status} – MMOC (legacy CO01) legacy` });
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
    const kitting_number = searchParams.get('kitting_number');
    if (!id && !kitting_number) return NextResponse.json({ error: 'id or kitting_number required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM mfg_kitting_order WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM mfg_kitting_order WHERE kitting_number = ${kitting_number}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM pp_kitting_order WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM pp_kitting_order WHERE kitting_number = ${kitting_number}`);
    }

    return NextResponse.json({ success: true, code: 'MKTC', message: `Kitting order ${kitting_number || id} deleted – MKTC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
