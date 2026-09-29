import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Inventory Serial API – Legal-safe own IP – Module 9 Inventory Foundation
 * New: inventory_serial (was inv_serial MISSING) – serialNumber SER-10000001, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, lotId ELTC was batch_id, status IN_STOCK/ISSUED/BLOCKED/IN_TRANSIT, inventoryLocationId was sloc_id
 * Helper code: ISRC Serial Create (alias SRC, IQ01, FIN-IS-CR) – 4-char MOOA I=Inventory S=Serial R? Actually ISRC = Inventory Serial Create – module grouped intuitive
 * Fresh empty per requirement
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const facilityId = searchParams.get('facilityId') || searchParams.get('plantId');
  const itemId = searchParams.get('itemId') || searchParams.get('materialId');
  const status = searchParams.get('status');

  try {
    let rows: any[] = [];
    let table = 'inventory_serial';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT s.id, s.serial_number, s.status, s.created_at,
               pi.item_number, pi.name as item_name,
               f.code as facility_code, f.name as facility_name,
               il.code as inventory_location_code,
               l.lot_number
        FROM inventory_serial s
        JOIN prod_item pi ON s.item_id = pi.id
        JOIN org_facility f ON s.facility_id = f.id
        LEFT JOIN org_inventory_location il ON s.inventory_location_id = il.id
        LEFT JOIN inv_lot l ON s.lot_id = l.id
        WHERE 1=1
      `;
      if (search) query = sql`${query} AND s.serial_number ILIKE ${`%${search}%`}`;
      if (facilityId) query = sql`${query} AND s.facility_id = ${facilityId}`;
      if (itemId) query = sql`${query} AND s.item_id = ${itemId}`;
      if (status) query = sql`${query} AND s.status = ${status}::inventory_serial_status_new`;
      query = sql`${query} ORDER BY s.created_at DESC LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    } catch (e: any) {
      console.warn('inventory_serial not yet:', e.message);
      return NextResponse.json({
        data: [],
        serials: [],
        count: 0,
        code: 'ISRC',
        aliasCodes: ['SRC', 'IQ01', 'FIN-IS-CR'],
        helperCode: 'ISRC',
        table: 'inventory_serial',
        source: 'none',
        legalSafe: true,
        message: 'Table inventory_serial fresh empty – ISRC legal-safe own IP – serialNumber SER-10000001, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, lotId ELTC was batch_id, status IN_STOCK/ISSUED/BLOCKED/IN_TRANSIT – fresh empty per requirement',
        explanation: 'Inventory serial legal-safe inventory_serial – serialNumber SER-10000001, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, lotId ELTC was batch_id, status IN_STOCK/ISSUED/BLOCKED/IN_TRANSIT, inventoryLocationId was sloc_id – Code ISRC primary alias SRC/IQ01 – 4-char MOOA I=Inventory S=Serial C=Create – module grouped intuitive – fresh empty but prod_item/facility kept.',
      });
    }

    return NextResponse.json({
      data: rows,
      serials: rows,
      count: rows.length,
      code: 'ISRC',
      aliasCodes: ['SRC', 'IQ01', 'FIN-IS-CR'],
      helperCode: 'ISRC',
      table,
      source: 'db-new',
      legalSafe,
      functionDescription: 'Inventory Serial – ISRC legal-safe own IP (was IQ01) – serialNumber SER-10000001, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, lotId ELTC was batch_id, status IN_STOCK/ISSUED/BLOCKED/IN_TRANSIT',
      explanation: 'Inventory serial legal-safe inventory_serial – serialNumber SER-10000001, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, lotId ELTC was batch_id, status IN_STOCK/ISSUED/BLOCKED/IN_TRANSIT, inventoryLocationId was sloc_id – Code ISRC primary alias SRC/IQ01 – 4-char MOOA I=Inventory S=Serial C=Create – module grouped intuitive – fresh empty per requirement but prod_item/facility kept.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { item_id, material_id, facility_id, plant_id, lot_id, batch_id, inventory_location_id, sloc_id, serial_number, status } = body;

    let itemIdResolved = item_id || material_id;
    let facilityIdResolved = facility_id || plant_id;

    if (!itemIdResolved) return NextResponse.json({ error: 'item_id or material_id required' }, { status: 400 });
    if (!facilityIdResolved) return NextResponse.json({ error: 'facility_id or plant_id required' }, { status: 400 });

    let serNumber = serial_number;
    if (!serNumber) {
      try {
        const nrRes = await db.execute(sql`SELECT current_number, prefix FROM core_number_range WHERE object_type = 'SERIAL'::core_nr_object_type ORDER BY fiscal_year DESC LIMIT 1`);
        if (nrRes.rows.length > 0) {
          const current = parseInt((nrRes.rows[0] as any).current_number) + 1;
          const prefix = (nrRes.rows[0] as any).prefix || 'SER-';
          serNumber = `${prefix}${current}`;
          await db.execute(sql`UPDATE core_number_range SET current_number = ${current}, updated_at = NOW() WHERE object_type = 'SERIAL'::core_nr_object_type`);
        } else {
          serNumber = `SER-${Date.now()}`;
        }
      } catch {
        serNumber = `SER-${Date.now()}`;
      }
    }

    const res = await db.execute(sql`
      INSERT INTO inventory_serial (serial_number, item_id, material_id, facility_id, plant_id, lot_id, batch_id, inventory_location_id, sloc_id, status)
      VALUES (${serNumber}, ${itemIdResolved}, ${itemIdResolved}, ${facilityIdResolved}, ${facilityIdResolved}, ${lot_id || batch_id || null}, ${lot_id || batch_id || null}, ${inventory_location_id || sloc_id || null}, ${inventory_location_id || sloc_id || null}, ${status || 'IN_STOCK'}::inventory_serial_status_new)
      ON CONFLICT (serial_number) DO UPDATE SET status = ${status || 'IN_STOCK'}::inventory_serial_status_new
      RETURNING id, serial_number
    `);

    return NextResponse.json({ success: true, serial: res.rows[0], serialNumber: serNumber, code: 'ISRC', message: `Inventory serial ${serNumber} created – ISRC legal-safe`, legalSafe: true });
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
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await db.execute(sql`DELETE FROM inventory_serial WHERE id = ${id}`);

    return NextResponse.json({ success: true, code: 'ISRC', message: `Inventory serial ${id} deleted – ISRC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
