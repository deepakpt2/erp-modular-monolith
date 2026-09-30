import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Inventory Reservations API – Legal-safe own IP – Module 9 Inventory Foundation
 * New: inventory_reservation (was inv_reservation MISSING) – reservationNumber RES-10000001, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, inventoryLocationId was sloc_id, lotId ELTC was batch_id, quantity, reservedQuantity, movementType 261/262/601, referenceDocType SALES_ORDER/PROD_ORDER, referenceDocId, requiredDate, isActive
 * Helper code: IRSC Reservation Create (alias RSC, MB21, FIN-IR-CR) – 4-char MOOA I=Inventory R=Reservation S? Actually IRSC = Inventory Reservation Create – module grouped intuitive
 * Fresh empty per requirement but prod_item/facility kept
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const facilityId = searchParams.get('facilityId') || searchParams.get('plantId');
  const itemId = searchParams.get('itemId') || searchParams.get('materialId');
  const referenceDocType = searchParams.get('referenceDocType');

  try {
    let rows: any[] = [];
    let table = 'inventory_reservation';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT r.id, r.reservation_number, r.quantity, r.reserved_quantity, r.movement_type, r.reference_doc_type, r.reference_doc_number, r.required_date, r.is_active, r.created_at,
               pi.item_number, pi.description as item_name,
               f.code as facility_code, f.name as facility_name,
               il.code as inventory_location_code
        FROM inventory_reservation r
        JOIN prod_item pi ON r.item_id = pi.id
        JOIN org_facility f ON r.facility_id = f.id
        LEFT JOIN org_inventory_location il ON r.inventory_location_id = il.id
        WHERE 1=1
      `;
      if (search) query = sql`${query} AND r.reservation_number ILIKE ${`%${search}%`}`;
      if (facilityId) query = sql`${query} AND r.facility_id = ${facilityId}`;
      if (itemId) query = sql`${query} AND r.item_id = ${itemId}`;
      if (referenceDocType) query = sql`${query} AND r.reference_doc_type = ${referenceDocType}`;
      query = sql`${query} ORDER BY r.required_date ASC NULLS LAST LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    } catch (e: any) {
      console.warn('inventory_reservation not yet:', e.message);
      return NextResponse.json({
        data: [],
        reservations: [],
        count: 0,
        code: 'IRSC',
        aliasCodes: ['RSC', 'MB21', 'FIN-IR-CR'],
        helperCode: 'IRSC',
        table: 'inventory_reservation',
        source: 'none',
        legalSafe: true,
        message: 'Table inventory_reservation fresh empty – IRSC legal-safe own IP – reservationNumber RES-10000001, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, inventoryLocationId was sloc_id, lotId ELTC was batch_id, quantity, reservedQuantity, movementType 261/262/601, referenceDocType SALES_ORDER/PROD_ORDER – fresh empty per requirement',
        explanation: 'Inventory reservation legal-safe inventory_reservation – reservationNumber RES-10000001, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, inventoryLocationId was sloc_id, lotId ELTC was batch_id, quantity, reservedQuantity, movementType 261/262/601, referenceDocType SALES_ORDER/PROD_ORDER, referenceDocId, requiredDate, isActive – Code IRSC primary alias RSC/MB21 – 4-char MOOA I=Inventory R=Reservation S? Actually IRSC Inventory Reservation Create – module grouped intuitive, same length as MB21 but own IP – fresh empty but prod_item/facility kept.',
      });
    }

    return NextResponse.json({
      data: rows,
      reservations: rows,
      count: rows.length,
      code: 'IRSC',
      aliasCodes: ['RSC', 'MB21', 'FIN-IR-CR'],
      helperCode: 'IRSC',
      table,
      source: 'db-new',
      legalSafe,
      functionDescription: 'Inventory Reservation – IRSC legal-safe own IP (was MB21) – reservationNumber RES-10000001, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, inventoryLocationId was sloc_id, lotId ELTC was batch_id, quantity, reservedQuantity, movementType 261/262/601',
      explanation: 'Inventory reservation legal-safe inventory_reservation – reservationNumber RES-10000001, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, inventoryLocationId was sloc_id, lotId ELTC was batch_id, quantity, reservedQuantity, movementType 261/262/601, referenceDocType SALES_ORDER/PROD_ORDER – Code IRSC primary alias RSC/MB21 – 4-char MOOA I=Inventory R=Reservation C=Create – module grouped intuitive – fresh empty per requirement but prod_item/facility kept.',
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
    const { item_id, material_id, facility_id, plant_id, inventory_location_id, sloc_id, lot_id, batch_id, quantity, movement_type, reference_doc_type, reference_doc_id, reference_doc_number, required_date } = body;

    let itemIdResolved = item_id || material_id;
    let facilityIdResolved = facility_id || plant_id;
    let inventoryLocationIdResolved = inventory_location_id || sloc_id;

    if (!itemIdResolved) return NextResponse.json({ error: 'item_id or material_id required' }, { status: 400 });
    if (!facilityIdResolved) return NextResponse.json({ error: 'facility_id or plant_id required' }, { status: 400 });
    if (!quantity) return NextResponse.json({ error: 'quantity required' }, { status: 400 });
    if (!reference_doc_type) return NextResponse.json({ error: 'reference_doc_type required (SALES_ORDER/PROD_ORDER)' }, { status: 400 });

    let reservationNumber = body.reservation_number;
    if (!reservationNumber) {
      try {
        const nrRes = await db.execute(sql`SELECT current_number FROM core_number_range WHERE object_type = 'RESERVATION'::core_nr_object_type ORDER BY fiscal_year DESC LIMIT 1`);
        if (nrRes.rows.length > 0) {
          const current = parseInt((nrRes.rows[0] as any).current_number) + 1;
                    reservationNumber = `${current}`;
          await db.execute(sql`UPDATE core_number_range SET current_number = ${current}, updated_at = NOW() WHERE object_type = 'RESERVATION'::core_nr_object_type`);
        } else {
          reservationNumber = `RES-${Date.now()}`;
        }
      } catch {
        reservationNumber = `RES-${Date.now()}`;
      }
    }

    const res = await db.execute(sql`
      INSERT INTO inventory_reservation (reservation_number, item_id, material_id, facility_id, plant_id, inventory_location_id, sloc_id, lot_id, batch_id, quantity, movement_type, reference_doc_type, reference_doc_id, reference_doc_number, required_date)
      VALUES (${reservationNumber}, ${itemIdResolved}, ${itemIdResolved}, ${facilityIdResolved}, ${facilityIdResolved}, ${inventoryLocationIdResolved || null}, ${inventoryLocationIdResolved || null}, ${lot_id || batch_id || null}, ${lot_id || batch_id || null}, ${quantity}, ${movement_type || '261'}::inventory_movement_type_new, ${reference_doc_type}, ${reference_doc_id || null}, ${reference_doc_number || null}, ${required_date ? new Date(required_date) : null})
      RETURNING id, reservation_number
    `);

    return NextResponse.json({ success: true, reservation: res.rows[0], reservationNumber, code: 'IRSC', message: `Inventory reservation ${reservationNumber} created – IRSC legal-safe`, legalSafe: true });
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

    await db.execute(sql`DELETE FROM inventory_reservation WHERE id = ${id}`);

    return NextResponse.json({ success: true, code: 'IRSC', message: `Inventory reservation ${id} deleted – IRSC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
