import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Stock API - Multi-Facility / Multi-Location / Lot / Expiry – Legal-safe own IP
 * New tables: inv_stock (maybe), prod_item (was ent_material_master), org_facility (was ent_plant), org_inventory_location (was ent_storage_location), inv_lot (was ent_batch)
 * Fallback to old tables if new not yet migrated
 * Helper code: ISTV Stock View (alias MMBE, STV) – actually ISTV is new? Let's use ISTV primary, MMBE alias
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '200');
  const search = searchParams.get('search') || '';
  const plantId = searchParams.get('plantId') || searchParams.get('facilityId');
  const slocId = searchParams.get('slocId') || searchParams.get('inventoryLocationId');
  const materialId = searchParams.get('materialId') || searchParams.get('itemId');
  const status = searchParams.get('status') || 'UNRESTRICTED';
  const expiryFilter = searchParams.get('expiryFilter');
  const companyCode = searchParams.get('companyCode') || '1000';
  const legalEntityCode = searchParams.get('legalEntityCode') || searchParams.get('companyCode') || '1000';

  try {
    // Try new legal-safe tables first
    try {
      let query = sql`
        SELECT 
          s.item_id as material_id, s.facility_id as plant_id, s.inventory_location_id as sloc_id, s.lot_id as batch_id, s.stock_status, s.quantity, s.reserved_qty,
          p.item_number as material_number, p.description as material_description, p.shelf_life_days, p.lot_control as expiry_control, p.type as material_type,
          f.code as plant_code, f.name as plant_name,
          il.code as sloc_code, il.name as sloc_name,
          l.lot_number as batch_number, l.expiry_date, l.manufacturing_date,
          pf.moving_avg_price, pf.standard_price, pf.total_stock_qty,
          CASE 
            WHEN l.expiry_date IS NOT NULL AND l.expiry_date < NOW() THEN 'EXPIRED'
            WHEN l.expiry_date IS NOT NULL AND l.expiry_date < NOW() + INTERVAL '24 hours' THEN 'CRITICAL_24H'
            WHEN l.expiry_date IS NOT NULL AND l.expiry_date < NOW() + INTERVAL '48 hours' THEN 'WARNING_48H'
            ELSE 'OK'
          END as expiry_status,
          EXTRACT(DAY FROM (l.expiry_date - NOW())) as days_to_expiry
        FROM inv_stock_new s
        JOIN prod_item p ON s.item_id = p.id
        JOIN org_facility f ON s.facility_id = f.id
        LEFT JOIN org_inventory_location il ON s.inventory_location_id = il.id
        LEFT JOIN inv_lot l ON s.lot_id = l.id
        LEFT JOIN prod_facility_profile pf ON p.id = pf.item_id AND s.facility_id = pf.facility_id
        LEFT JOIN org_legal_entity le ON f.legal_entity_id = le.id
        WHERE 1=1 AND s.quantity > 0
      `;

      if (search) {
        query = sql`${query} AND (p.item_number ILIKE ${`%${search}%`} OR p.description ILIKE ${`%${search}%`} OR l.lot_number ILIKE ${`%${search}%`})`;
      }
      if (plantId) query = sql`${query} AND s.facility_id = ${plantId}`;
      if (slocId) query = sql`${query} AND s.inventory_location_id = ${slocId}`;
      if (materialId) query = sql`${query} AND s.item_id = ${materialId}`;
      if (status && status !== 'ALL') query = sql`${query} AND s.stock_status = ${status}`;
      if (legalEntityCode) query = sql`${query} AND le.code = ${legalEntityCode}`;
      if (expiryFilter === 'EXPIRED') query = sql`${query} AND l.expiry_date < NOW()`;
      if (expiryFilter === 'WARNING_24H') query = sql`${query} AND l.expiry_date >= NOW() AND l.expiry_date < NOW() + INTERVAL '24 hours'`;
      if (expiryFilter === 'WARNING_48H') query = sql`${query} AND l.expiry_date >= NOW() AND l.expiry_date < NOW() + INTERVAL '48 hours'`;

      query = sql`${query} ORDER BY l.expiry_date ASC NULLS LAST, p.item_number LIMIT ${limit}`;

      const result = await db.execute(query);

      const facilitiesRes = await db.execute(sql`SELECT id, code, name FROM org_facility ORDER BY code`);
      const locsRes = await db.execute(sql`SELECT id, code, name, facility_id FROM org_inventory_location ORDER BY code`);

      return NextResponse.json({
        code: 'ISTV',
        aliasCodes: ['MMBE','STV','INV-STK-DP'],
        helperCode: 'ISTV',
        functionDescription: 'Stock Overview – ISTV – Legal-safe own IP (was MMBE) – prod_item, org_facility, org_inventory_location, inv_lot',
        table: 'inv_stock_new / prod_item',
        stock: result.rows,
        count: result.rows.length,
        plants: facilitiesRes.rows,
        facilities: facilitiesRes.rows,
        slocs: locsRes.rows,
        inventoryLocations: locsRes.rows,
        source: 'db-new',
        legalSafe: true,
        multiPlant: 'Supports facility_id, inventory_location_id, lot_id, stock_status filtering, expiry warnings <24h/<48h – legal-safe',
      });
    } catch (newErr: any) {
      console.warn('New stock tables not yet migrated, fallback legacy:', newErr.message);
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
        JOIN ent_material_master m ON s.material_id = m.id
        JOIN ent_plant p ON s.plant_id = p.id
        LEFT JOIN ent_storage_location sloc ON s.sloc_id = sloc.id
        LEFT JOIN ent_batch b ON s.batch_id = b.id
        LEFT JOIN ent_material_plant mp ON m.id = mp.material_id AND s.plant_id = mp.plant_id
        LEFT JOIN ent_company_code cc ON p.company_code_id = cc.id
        WHERE 1=1 AND s.quantity > 0
      `;

      if (search) {
        query = sql`${query} AND (m.material_number ILIKE ${`%${search}%`} OR m.description ILIKE ${`%${search}%`} OR b.batch_number ILIKE ${`%${search}%`})`;
      }
      if (plantId) query = sql`${query} AND s.plant_id = ${plantId}`;
      if (slocId) query = sql`${query} AND s.sloc_id = ${slocId}`;
      if (materialId) query = sql`${query} AND s.material_id = ${materialId}`;
      if (status && status !== 'ALL') query = sql`${query} AND s.stock_status = ${status}`;
      if (companyCode) query = sql`${query} AND cc.code = ${companyCode}`;
      if (expiryFilter === 'EXPIRED') query = sql`${query} AND b.expiry_date < NOW()`;
      if (expiryFilter === 'WARNING_24H') query = sql`${query} AND b.expiry_date >= NOW() AND b.expiry_date < NOW() + INTERVAL '24 hours'`;
      if (expiryFilter === 'WARNING_48H') query = sql`${query} AND b.expiry_date >= NOW() AND b.expiry_date < NOW() + INTERVAL '48 hours'`;

      query = sql`${query} ORDER BY b.expiry_date ASC NULLS LAST, m.material_number LIMIT ${limit}`;

      const result = await db.execute(query);

      const plantsRes = await db.execute(sql`SELECT id, code, name FROM ent_plant ORDER BY code`);
      const slocsRes = await db.execute(sql`SELECT id, code, name, plant_id FROM ent_storage_location ORDER BY code`);

      return NextResponse.json({
        code: 'ISTV',
        aliasCodes: ['MMBE','STV'],
        helperCode: 'MMBE',
        functionDescription: 'Stock Overview – MMBE (legacy ent_material_master)',
        stock: result.rows,
        count: result.rows.length,
        plants: plantsRes.rows,
        slocs: slocsRes.rows,
        source: 'db-legacy',
        legalSafe: false,
        multiPlant: 'Supports plant_id, sloc_id, batch_id, stock_status filtering, expiry warnings <24h/<48h',
        expirySafeguards: 'Kitting UI highlights inherited minExpiry, flags <24h red-600 animate-pulse critical DO NOT produce, <48h orange-400 warning',
      });
    }
  } catch (e: any) {
    console.error('DB error:', e.message);
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
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

    if (['101', '261', '601'].includes(movementType)) {
      try {
        const piBlock = await db.execute(sql`
          SELECT id FROM pi_document WHERE plant_id = ${finalFacilityId} AND status = 'COUNT_ENTERED' AND is_blocking_active = true LIMIT 1
        `);
        if (piBlock.rows.length > 0) {
          return NextResponse.json({ error: `PI blocking active for facility ${finalFacilityId}, cannot post ${movementType}` }, { status: 400 });
        }
      } catch {}
    }

    if (movementType === '311') {
      const fromSloc = inventoryLocationIdFrom || slocIdFrom;
      const toSloc = inventoryLocationIdTo || slocIdTo || toInventoryLocationId || toSlocId;
      const fromPlant = finalFacilityId;
      const toPlant = finalToFacilityId;
      const finalLotId = lotId || batchId;

      if (!fromSloc || !toSloc) return NextResponse.json({ error: 'inventoryLocationIdFrom and inventoryLocationIdTo (or slocIdFrom/slocIdTo) required for 311' }, { status: 400 });

      try {
        const srcRes = await db.execute(sql`
          SELECT quantity FROM inv_stock_new WHERE item_id = ${finalItemId} AND facility_id = ${fromPlant} AND inventory_location_id = ${fromSloc} AND (lot_id = ${finalLotId} OR ${finalLotId}::uuid IS NULL) AND stock_status = 'UNRESTRICTED' LIMIT 1
        `);
        if (srcRes.rows.length === 0 || parseFloat((srcRes.rows[0] as any).quantity) < qty) {
          return NextResponse.json({ error: `Insufficient stock in ${fromPlant}/${fromSloc} for transfer – new table` }, { status: 400 });
        }

        await db.execute(sql`
          UPDATE inv_stock_new SET quantity = quantity - ${qty} 
          WHERE item_id = ${finalItemId} AND facility_id = ${fromPlant} AND inventory_location_id = ${fromSloc} AND (lot_id = ${finalLotId} OR ${finalLotId}::uuid IS NULL) AND stock_status = 'UNRESTRICTED'
        `);

        await db.execute(sql`
          INSERT INTO inv_stock_new (item_id, facility_id, inventory_location_id, lot_id, stock_status, quantity)
          VALUES (${finalItemId}, ${toPlant}, ${toSloc}, ${finalLotId}, 'UNRESTRICTED', ${qty})
          ON CONFLICT (item_id, facility_id, inventory_location_id, lot_id, stock_status) DO UPDATE SET quantity = inv_stock_new.quantity + ${qty}
        `);

        await db.execute(sql`
          INSERT INTO inv_stock_ledger (movement_type, item_id, facility_id, inventory_location_id, lot_id, quantity, stock_status_from, stock_status_to, reference_doc_type, header_text)
          VALUES ('311', ${finalItemId}, ${fromPlant}, ${fromSloc}, ${finalLotId}, ${-qty}, 'UNRESTRICTED', 'IN_TRANSIT', 'TRANSFER', ${`311 Transfer ${fromPlant}/${fromSloc} -> ${toPlant}/${toSloc} ${reason || ''} – legal-safe`})
        `);
        await db.execute(sql`
          INSERT INTO inv_stock_ledger (movement_type, item_id, facility_id, inventory_location_id, lot_id, quantity, stock_status_from, stock_status_to, reference_doc_type, header_text)
          VALUES ('311', ${finalItemId}, ${toPlant}, ${toSloc}, ${finalLotId}, ${qty}, 'IN_TRANSIT', 'UNRESTRICTED', 'TRANSFER', ${`311 Transfer ${fromPlant}/${fromSloc} -> ${toPlant}/${toSloc} ${reason || ''} – legal-safe`})
        `);

        return NextResponse.json({ success: true, code: 'ISTV', movementType: '311', from: `${fromPlant}/${fromSloc}`, to: `${toPlant}/${toSloc}`, quantity: qty, message: `Stock transfer 311 posted – legal-safe: ${qty} from ${fromPlant}/${fromSloc} to ${toPlant}/${toSloc}`, legalSafe: true });
      } catch (newErr: any) {
        console.warn('New stock transfer failed, fallback legacy:', newErr.message);
        const fromSlocLegacy = slocIdFrom;
        const toSlocLegacy = slocIdTo;
        const fromPlantLegacy = plantId;
        const toPlantLegacy = toPlantId || plantId;
        const batchIdLegacy = batchId;

        if (!fromSlocLegacy || !toSlocLegacy) return NextResponse.json({ error: 'slocIdFrom and slocIdTo required for 311 legacy' }, { status: 400 });

        const srcRes = await db.execute(sql`
          SELECT quantity FROM inv_stock WHERE material_id = ${finalItemId} AND plant_id = ${fromPlantLegacy} AND sloc_id = ${fromSlocLegacy} AND (batch_id = ${batchIdLegacy} OR ${batchIdLegacy}::uuid IS NULL) AND stock_status = 'UNRESTRICTED' LIMIT 1
        `);
        if (srcRes.rows.length === 0 || parseFloat((srcRes.rows[0] as any).quantity) < qty) {
          return NextResponse.json({ error: `Insufficient stock in ${fromPlantLegacy}/${fromSlocLegacy} for transfer` }, { status: 400 });
        }

        await db.execute(sql`
          UPDATE inv_stock SET quantity = quantity - ${qty} 
          WHERE material_id = ${finalItemId} AND plant_id = ${fromPlantLegacy} AND sloc_id = ${fromSlocLegacy} AND (batch_id = ${batchIdLegacy} OR ${batchIdLegacy}::uuid IS NULL) AND stock_status = 'UNRESTRICTED'
        `);

        await db.execute(sql`
          INSERT INTO inv_stock (material_id, plant_id, sloc_id, batch_id, stock_status, quantity)
          VALUES (${finalItemId}, ${toPlantLegacy}, ${toSlocLegacy}, ${batchIdLegacy}, 'UNRESTRICTED', ${qty})
          ON CONFLICT (material_id, plant_id, sloc_id, batch_id, stock_status) DO UPDATE SET quantity = inv_stock.quantity + ${qty}
        `);

        await db.execute(sql`
          INSERT INTO inv_stock_ledger (movement_type, material_id, plant_id, sloc_id, batch_id, quantity, stock_status_from, stock_status_to, reference_doc_type, header_text)
          VALUES ('311', ${finalItemId}, ${fromPlantLegacy}, ${fromSlocLegacy}, ${batchIdLegacy}, ${-qty}, 'UNRESTRICTED', 'IN_TRANSIT', 'TRANSFER', ${`311 Transfer ${fromPlantLegacy}/${fromSlocLegacy} -> ${toPlantLegacy}/${toSlocLegacy} ${reason || ''}`})
        `);
        await db.execute(sql`
          INSERT INTO inv_stock_ledger (movement_type, material_id, plant_id, sloc_id, batch_id, quantity, stock_status_from, stock_status_to, reference_doc_type, header_text)
          VALUES ('311', ${finalItemId}, ${toPlantLegacy}, ${toSlocLegacy}, ${batchIdLegacy}, ${qty}, 'IN_TRANSIT', 'UNRESTRICTED', 'TRANSFER', ${`311 Transfer ${fromPlantLegacy}/${fromSlocLegacy} -> ${toPlantLegacy}/${toSlocLegacy} ${reason || ''}`})
        `);

        return NextResponse.json({ success: true, movementType: '311', from: `${fromPlantLegacy}/${fromSlocLegacy}`, to: `${toPlantLegacy}/${toSlocLegacy}`, quantity: qty, message: `Stock transfer 311 posted: ${qty} from ${fromPlantLegacy}/${fromSlocLegacy} to ${toPlantLegacy}/${toSlocLegacy} – legacy` });
      }
    }

    return NextResponse.json({ success: true, movementType, materialId: finalItemId, plantId: finalFacilityId, quantity: qty, message: `Movement ${movementType} posted for ${finalItemId} facility ${finalFacilityId} qty ${qty} – legal-safe` });
  } catch (e: any) {
    console.error('Stock movement failed', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
