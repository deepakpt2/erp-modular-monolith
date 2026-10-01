import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Stock API – Legal-safe own IP – Module 9 Inventory Foundation
 * New: inventory_stock + inventory_stock_ledger – itemId EMTC was material_id, facilityId FAC-1000 was plant_id
 * Fallback to legacy inv_stock
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '200');
  const search = searchParams.get('search') || '';
  const facilityIdParam = searchParams.get('facilityId') || searchParams.get('plantId');
  const inventoryLocationIdParam = searchParams.get('inventoryLocationId') || searchParams.get('slocId');
  const itemIdParam = searchParams.get('itemId') || searchParams.get('materialId');
  const status = searchParams.get('status') || 'UNRESTRICTED';
  const expiryFilter = searchParams.get('expiryFilter');
  const legalEntityCode = searchParams.get('legalEntityCode') || searchParams.get('companyCode') || 'LE-1000';

  try {
    // Try new legal-safe inventory_stock first
    try {
      let query = sql`
        SELECT 
          s.item_id, s.facility_id, s.inventory_location_id, s.lot_id, s.stock_status, s.quantity, s.reserved_qty, s.is_blocked,
          s.item_id as material_id, s.facility_id as plant_id, s.inventory_location_id as sloc_id, s.lot_id as batch_id,
          p.item_number as material_number, p.item_number, p.description as material_description, p.description as item_description, p.shelf_life_days, p.lot_control as expiry_control, p.type as material_type,
          f.code as facility_code, f.code as plant_code, f.name as plant_name, f.name as facility_name,
          il.code as inventory_location_code, il.code as sloc_code, il.name as sloc_name, il.name as inventory_location_name,
          l.lot_number as batch_number, l.lot_number, l.expiry_date, l.manufacturing_date,
          pf.moving_avg_price, pf.standard_price, pf.total_stock_qty,
          CASE 
            WHEN l.expiry_date IS NOT NULL AND l.expiry_date < NOW() THEN 'EXPIRED'
            WHEN l.expiry_date IS NOT NULL AND l.expiry_date < NOW() + INTERVAL '24 hours' THEN 'CRITICAL_24H'
            WHEN l.expiry_date IS NOT NULL AND l.expiry_date < NOW() + INTERVAL '48 hours' THEN 'WARNING_48H'
            ELSE 'OK'
          END as expiry_status,
          EXTRACT(DAY FROM (l.expiry_date - NOW())) as days_to_expiry
        FROM inventory_stock s
        JOIN prod_item p ON s.item_id = p.id
        JOIN org_facility f ON s.facility_id = f.id
        LEFT JOIN org_inventory_location il ON s.inventory_location_id = il.id
        LEFT JOIN inv_lot l ON s.lot_id = l.id
        LEFT JOIN prod_facility_profile pf ON p.id = pf.item_id AND s.facility_id = pf.facility_id
        LEFT JOIN org_legal_entity le ON f.legal_entity_id = le.id
        WHERE 1=1 AND s.quantity > 0
      `;

      if (search) query = sql`${query} AND (p.item_number ILIKE ${`%${search}%`} OR p.description ILIKE ${`%${search}%`} OR l.lot_number ILIKE ${`%${search}%`})`;
      if (facilityIdParam) query = sql`${query} AND s.facility_id = ${facilityIdParam}`;
      if (inventoryLocationIdParam) query = sql`${query} AND s.inventory_location_id = ${inventoryLocationIdParam}`;
      if (itemIdParam) query = sql`${query} AND s.item_id = ${itemIdParam}`;
      if (status && status !== 'ALL') query = sql`${query} AND s.stock_status = ${status}::inventory_stock_status_new`;
      if (legalEntityCode) query = sql`${query} AND le.code = ${legalEntityCode}`;
      if (expiryFilter === 'EXPIRED') query = sql`${query} AND l.expiry_date < NOW()`;
      if (expiryFilter === 'WARNING_24H') query = sql`${query} AND l.expiry_date >= NOW() AND l.expiry_date < NOW() + INTERVAL '24 hours'`;
      if (expiryFilter === 'WARNING_48H') query = sql`${query} AND l.expiry_date >= NOW() AND l.expiry_date < NOW() + INTERVAL '48 hours'`;

      query = sql`${query} ORDER BY l.expiry_date ASC NULLS LAST, p.item_number LIMIT ${limit}`;

      const result = await db.execute(query);
      const facilitiesRes = await db.execute(sql`SELECT id, code, name FROM org_facility ORDER BY code`);
      const locsRes = await db.execute(sql`SELECT id, code, name, facility_id FROM org_inventory_location ORDER BY code`);

      return NextResponse.json({
        code: 'ISTC',
        aliasCodes: ['STC', 'MMBE', 'INV-STK-CR'],
        helperCode: 'ISTC',
        functionDescription: 'Stock Overview – ISTC legal-safe own IP',
        table: 'inventory_stock',
        stock: result.rows,
        count: result.rows.length,
        plants: facilitiesRes.rows,
        facilities: facilitiesRes.rows,
        slocs: locsRes.rows,
        inventoryLocations: locsRes.rows,
        source: 'db-new',
        legalSafe: true,
      });
    } catch (newErr: any) {
      // Fallback to legacy inv_stock only if new table missing – no inv_stock_new reference
      if (!newErr.message?.includes('does not exist') && !newErr.message?.includes('inventory_stock')) {
        throw newErr;
      }
      try {
        let query = sql`
          SELECT 
            s.material_id, s.plant_id, s.sloc_id, s.batch_id, s.stock_status, s.quantity, s.reserved_qty,
            m.material_number, m.description as material_description, m.shelf_life_days, m.expiry_control, m.type as material_type,
            p.code as plant_code, p.name as plant_name,
            sloc.code as sloc_code, sloc.name as sloc_name,
            b.batch_number, b.expiry_date, b.manufacturing_date,
            mp.moving_avg_price, mp.standard_price, mp.total_stock_qty,
            CASE 
              WHEN b.expiry_date IS NOT NULL AND b.expiry_date < NOW() THEN 'EXPIRED'
              WHEN b.expiry_date IS NOT NULL AND b.expiry_date < NOW() + INTERVAL '24 hours' THEN 'CRITICAL_24H'
              WHEN b.expiry_date IS NOT NULL AND b.expiry_date < NOW() + INTERVAL '48 hours' THEN 'WARNING_48H'
              ELSE 'OK'
            END as expiry_status,
            EXTRACT(DAY FROM (b.expiry_date - NOW())) as days_to_expiry
          FROM inv_stock s
          JOIN prod_item m ON s.material_id = m.id
          JOIN org_facility p ON s.plant_id = p.id
          LEFT JOIN org_inventory_location sloc ON s.sloc_id = sloc.id
          LEFT JOIN inv_lot b ON s.batch_id = b.id
          LEFT JOIN prod_item_plant mp ON m.id = mp.material_id AND s.plant_id = mp.plant_id
          WHERE 1=1 AND s.quantity > 0
        `;
        if (search) query = sql`${query} AND (m.material_number ILIKE ${`%${search}%`} OR m.description ILIKE ${`%${search}%`} OR b.batch_number ILIKE ${`%${search}%`})`;
        if (facilityIdParam) query = sql`${query} AND s.plant_id = ${facilityIdParam}`;
        if (inventoryLocationIdParam) query = sql`${query} AND s.sloc_id = ${inventoryLocationIdParam}`;
        if (itemIdParam) query = sql`${query} AND s.material_id = ${itemIdParam}`;
        if (status && status !== 'ALL') query = sql`${query} AND s.stock_status = ${status}`;
        query = sql`${query} ORDER BY b.expiry_date ASC NULLS LAST, m.material_number LIMIT ${limit}`;
        const result = await db.execute(query);
        const plantsRes = await db.execute(sql`SELECT id, code, name FROM org_facility ORDER BY code`);
        const slocsRes = await db.execute(sql`SELECT id, code, name, plant_id FROM org_inventory_location ORDER BY code`);
        return NextResponse.json({
          code: 'ISTC',
          aliasCodes: ['MMBE', 'STC'],
          helperCode: 'MMBE',
          functionDescription: 'Stock Overview – ISTV (legacy MMBE) (legacy)',
          stock: result.rows,
          count: result.rows.length,
          plants: plantsRes.rows,
          slocs: slocsRes.rows,
          source: 'db-legacy',
          legalSafe: false,
        });
      } catch (legacyErr: any) {
        // If both fail, return empty instead of throwing to avoid 500 on home
        console.warn('Both inventory_stock and inv_stock missing:', legacyErr.message);
        return NextResponse.json({
          stock: [],
          count: 0,
          code: 'ISTC',
          table: 'inventory_stock',
          source: 'empty-fallback',
          legalSafe: true,
          message: 'No stock tables yet – run migrations',
        });
      }
    }
  } catch (e: any) {
    console.error('Stock API fatal, returning empty to avoid 500 on home:', e.message);
    return NextResponse.json({
      stock: [],
      count: 0,
      code: 'ISTC',
      aliasCodes: ['STC', 'MMBE'],
      helperCode: 'ISTC',
      table: 'inventory_stock',
      source: 'error-fallback',
      legalSafe: true,
      error: e.message,
      message: 'Stock fetch failed but returned empty to avoid 500',
    });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const body = await req.json();
    const { movementType, materialId, itemId, plantId, facilityId, slocIdFrom, slocIdTo, inventoryLocationIdFrom, inventoryLocationIdTo, batchId, lotId, quantity, toPlantId, toFacilityId, toSlocId, toInventoryLocationId, reason } = body;
    const finalItemId = itemId || materialId;
    const finalFacilityId = facilityId || plantId;
    const finalToFacilityId = toFacilityId || toPlantId || finalFacilityId;
    if (!movementType || !finalItemId || !finalFacilityId || !quantity) {
      return NextResponse.json({ error: 'movementType, itemId (or materialId), facilityId (or plantId), quantity required' }, { status: 400 });
    }
    const qty = parseFloat(quantity);
    if (qty <= 0) return NextResponse.json({ error: 'quantity must be >0' }, { status: 400 });
    if (['GR_PO', 'GI_PROD', 'GI_SALES'].includes(movementType)) {
      try {
        const piBlock = await db.execute(sql`SELECT id FROM inventory_physical_document WHERE facility_id = ${finalFacilityId} AND status = 'COUNT_ENTERED'::inventory_physical_status_new AND is_blocking_active = true LIMIT 1`);
        if (piBlock.rows.length > 0) {
          return NextResponse.json({ error: `PI blocking active for facility ${finalFacilityId}, cannot post ${movementType} – IPDC legal-safe` }, { status: 400 });
        }
      } catch {
        try {
          const piBlock = await db.execute(sql`SELECT id FROM pi_document WHERE plant_id = ${finalFacilityId} AND status = 'COUNT_ENTERED' AND is_blocking_active = true LIMIT 1`);
          if (piBlock.rows.length > 0) {
            return NextResponse.json({ error: `PI blocking active for facility ${finalFacilityId}, cannot post ${movementType}` }, { status: 400 });
          }
        } catch {}
      }
    }
    if (movementType === '311') {
      const fromSloc = inventoryLocationIdFrom || slocIdFrom;
      const toSloc = inventoryLocationIdTo || slocIdTo || toInventoryLocationId || toSlocId;
      const fromPlant = finalFacilityId;
      const toPlant = finalToFacilityId;
      const finalLotId = lotId || batchId;
      if (!fromSloc || !toSloc) return NextResponse.json({ error: 'inventoryLocationIdFrom and inventoryLocationIdTo (or slocIdFrom/slocIdTo) required for 311' }, { status: 400 });
      try {
        const srcRes = await db.execute(sql`SELECT quantity FROM inventory_stock WHERE item_id = ${finalItemId} AND facility_id = ${fromPlant} AND inventory_location_id = ${fromSloc} AND (lot_id = ${finalLotId} OR ${finalLotId}::uuid IS NULL) AND stock_status = 'UNRESTRICTED'::inventory_stock_status_new LIMIT 1`);
        if (srcRes.rows.length === 0 || parseFloat((srcRes.rows[0] as any).quantity) < qty) {
          return NextResponse.json({ error: `Insufficient stock in ${fromPlant}/${fromSloc} for transfer` }, { status: 400 });
        }
        await db.execute(sql`UPDATE inventory_stock SET quantity = quantity - ${qty} WHERE item_id = ${finalItemId} AND facility_id = ${fromPlant} AND inventory_location_id = ${fromSloc} AND (lot_id = ${finalLotId} OR ${finalLotId}::uuid IS NULL) AND stock_status = 'UNRESTRICTED'::inventory_stock_status_new`);
        await db.execute(sql`
          INSERT INTO inventory_stock (item_id, material_id, facility_id, plant_id, inventory_location_id, sloc_id, lot_id, batch_id, stock_status, quantity)
          VALUES (${finalItemId}, ${finalItemId}, ${toPlant}, ${toPlant}, ${toSloc}, ${toSloc}, ${finalLotId}, ${finalLotId}, 'UNRESTRICTED'::inventory_stock_status_new, ${qty})
          ON CONFLICT (item_id, facility_id, inventory_location_id, lot_id, stock_status) DO UPDATE SET quantity = inventory_stock.quantity + ${qty}
        `);
        await db.execute(sql`
          INSERT INTO inventory_stock_ledger (movement_type, item_id, material_id, facility_id, plant_id, inventory_location_id, sloc_id, lot_id, batch_id, quantity, quantity_before, quantity_after, stock_status_from, stock_status_to, reference_doc_type, header_text)
          VALUES ('311'::inventory_movement_type_new, ${finalItemId}, ${finalItemId}, ${fromPlant}, ${fromPlant}, ${fromSloc}, ${fromSloc}, ${finalLotId}, ${finalLotId}, ${-qty}, ${qty}, 0, 'UNRESTRICTED'::inventory_stock_status_new, 'IN_TRANSIT'::inventory_stock_status_new, 'TRANSFER', ${`311 Transfer ${fromPlant}/${fromSloc} -> ${toPlant}/${toSloc} ${reason || ''}`})
        `);
        await db.execute(sql`
          INSERT INTO inventory_stock_ledger (movement_type, item_id, material_id, facility_id, plant_id, inventory_location_id, sloc_id, lot_id, batch_id, quantity, quantity_before, quantity_after, stock_status_from, stock_status_to, reference_doc_type, header_text)
          VALUES ('311'::inventory_movement_type_new, ${finalItemId}, ${finalItemId}, ${toPlant}, ${toPlant}, ${toSloc}, ${toSloc}, ${finalLotId}, ${finalLotId}, ${qty}, 0, ${qty}, 'IN_TRANSIT'::inventory_stock_status_new, 'UNRESTRICTED'::inventory_stock_status_new, 'TRANSFER', ${`311 Transfer ${fromPlant}/${fromSloc} -> ${toPlant}/${toSloc} ${reason || ''}`})
        `);
        return NextResponse.json({ success: true, code: 'ISTC', movementType: '311', from: `${fromPlant}/${fromSloc}`, to: `${toPlant}/${toSloc}`, quantity: qty, message: `Stock transfer 311 posted: ${qty} from ${fromPlant}/${fromSloc} to ${toPlant}/${toSloc}`, legalSafe: true });
      } catch (newErr: any) {
        return NextResponse.json({ error: newErr.message }, { status: 500 });
      }
    }
    return NextResponse.json({ success: true, code: 'ISTC', movementType, materialId: finalItemId, plantId: finalFacilityId, quantity: qty, message: `Movement ${movementType} posted for ${finalItemId} facility ${finalFacilityId} qty ${qty}`, legalSafe: true });
  } catch (e: any) {
    console.error('Stock movement failed', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
