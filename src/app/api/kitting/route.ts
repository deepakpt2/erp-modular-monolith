import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Kitting API - Stocked K01/K02 + Phantom 261
 * GET /api/kitting - List kitting orders with plant filters
 * POST /api/kitting - Create Stocked Kit (K01 consumption + K02 production) or Phantom explosion
 * 
 * Tables: pp_kitting_order, pp_production_order, pp_bom_header, pp_bom_line
 * Multi-plant: plant_id, expiry MIN(components), batch KIT-xxx
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const plantId = searchParams.get('plantId');
  const type = searchParams.get('type'); // STOCKED, PHANTOM

  try {
    let query = sql`
      SELECT 
        ko.id, ko.kitting_number, ko.target_quantity, ko.min_component_expiry, ko.calculated_expiry, ko.status,
        ko.kit_material_id, m.material_number as kit_material_number, m.description as kit_description,
        p.code as plant_code, p.name as plant_name,
        b.batch_number as target_batch_number, b.expiry_date as target_expiry,
        po.order_number as production_order_number
      FROM pp_kitting_order ko
      LEFT JOIN ent_material_master m ON ko.kit_material_id = m.id
      LEFT JOIN ent_plant p ON m.id IS NOT NULL AND p.id IN (SELECT plant_id FROM ent_material_plant WHERE material_id = m.id LIMIT 1)
      LEFT JOIN ent_batch b ON ko.target_batch_id = b.id
      LEFT JOIN pp_production_order po ON ko.production_order_id = po.id
      WHERE 1=1
    `;

    if (plantId) query = sql`${query} AND p.id = ${plantId}`;
    if (type === 'STOCKED') query = sql`${query} AND m.is_kit = true AND m.is_phantom_kit = false`;
    if (type === 'PHANTOM') query = sql`${query} AND m.is_phantom_kit = true`;

    query = sql`${query} ORDER BY ko.created_at DESC LIMIT ${limit}`;

    const result = await db.execute(query);
    return NextResponse.json({
      code: 'CO01',
      functionDescription: 'Production Order / Kitting – CO01',
 kittingOrders: result.rows, count: result.rows.length, source: 'db', multiPlant: 'Plant via material_plant, expiry MIN(components)' });
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
    const { kitMaterialId, plantId, slocId, targetQuantity, bomHeaderId, type } = body;
    // type: STOCKED or PHANTOM

    if (!kitMaterialId || !plantId || !targetQuantity) {
      return NextResponse.json({ error: 'kitMaterialId, plantId, targetQuantity required' }, { status: 400 });
    }

    const qty = parseFloat(targetQuantity);
    if (qty <= 0) return NextResponse.json({ error: 'targetQuantity >0 required' }, { status: 400 });

    // Get BOM for kit
    let bomId = bomHeaderId;
    if (!bomId) {
      const bomRes = await db.execute(sql`
        SELECT id FROM pp_bom_header WHERE material_id = ${kitMaterialId} AND plant_id = ${plantId} AND status = 'ACTIVE' LIMIT 1
      `);
      if (bomRes.rows.length === 0) return NextResponse.json({ error: 'No active BOM found for kit material' }, { status: 400 });
      bomId = (bomRes.rows[0] as any).id;
    }

    // Get BOM lines
    const bomLinesRes = await db.execute(sql`SELECT * FROM pp_bom_line WHERE bom_header_id = ${bomId}`);
    const bomLines = bomLinesRes.rows as any[];

    // For Stocked Kit: check stock availability FIFO by expiry, calculate minExpiry
    let minExpiry: Date | null = null;
    let totalCost = 0;
    const componentsUsed: any[] = [];

    for (const line of bomLines) {
      const requiredQty = parseFloat(line.quantity) * qty;
      // FIFO by expiry
      const stockRes = await db.execute(sql`
        SELECT s.quantity, s.batch_id, b.expiry_date, mp.moving_avg_price
        FROM inv_stock s
        LEFT JOIN ent_batch b ON s.batch_id = b.id
        LEFT JOIN ent_material_plant mp ON s.material_id = mp.material_id AND s.plant_id = mp.plant_id
        WHERE s.material_id = ${line.component_material_id} AND s.plant_id = ${plantId} AND s.stock_status = 'UNRESTRICTED' AND s.quantity > 0
        ORDER BY b.expiry_date ASC NULLS LAST
        LIMIT 10
      `);

      let remaining = requiredQty;
      for (const stock of stockRes.rows as any[]) {
        if (remaining <= 0) break;
        const avail = parseFloat(stock.quantity);
        const useQty = Math.min(avail, remaining);
        remaining -= useQty;

        if (stock.expiry_date) {
          const exp = new Date(stock.expiry_date);
          if (!minExpiry || exp < minExpiry) minExpiry = exp;
        }

        const unitCost = parseFloat(stock.moving_avg_price || 0);
        totalCost += useQty * unitCost;
        componentsUsed.push({ materialId: line.component_material_id, batchId: stock.batch_id, quantity: useQty, unitCost, expiry: stock.expiry_date });
      }

      if (remaining > 0.001) {
        return NextResponse.json({ error: `Insufficient stock for component ${line.component_material_id}, required ${requiredQty}, short ${remaining}` }, { status: 400 });
      }
    }

    // Check expiry safeguards <24h/<48h
    const now = new Date();
    let expiryWarning = 'OK';
    if (minExpiry) {
      const hoursToExpiry = (minExpiry.getTime() - now.getTime()) / (1000 * 3600);
      if (hoursToExpiry < 24) expiryWarning = 'CRITICAL_24H - DO NOT produce, expiry <24h';
      else if (hoursToExpiry < 48) expiryWarning = 'WARNING_48H - consume quickly, expiry <48h';
    }

    // Generate kitting number
    const numRes = await db.execute(sql`SELECT current_number, prefix FROM ent_number_range WHERE object_type = 'KITTING_ORDER' LIMIT 1`);
    let kittingNumber = `KIT${1000000 + Date.now() % 1000000}`;
    if (numRes.rows.length > 0) {
      const nr = numRes.rows[0] as any;
      const cur = parseInt(nr.current_number) + 1;
      kittingNumber = `${nr.prefix || 'KIT'}${cur}`;
      await db.execute(sql`UPDATE ent_number_range SET current_number = ${cur} WHERE object_type = 'KITTING_ORDER'`);
    }

    // Create target batch for Stocked Kit with inherited expiry MIN(components)
    let targetBatchId = null;
    if (type !== 'PHANTOM') {
      const batchNumber = `KIT-${Date.now()}`;
      const batchRes = await db.execute(sql`
        INSERT INTO ent_batch (batch_number, material_id, plant_id, expiry_date, manufacturing_date)
        VALUES (${batchNumber}, ${kitMaterialId}, ${plantId}, ${minExpiry || new Date(Date.now() + 30*24*3600000)}, NOW())
        RETURNING id
      `);
      targetBatchId = (batchRes.rows[0] as any).id;
    }

    // Create kitting order
    const kitRes = await db.execute(sql`
      INSERT INTO pp_kitting_order (kitting_number, kit_material_id, target_batch_id, target_quantity, min_component_expiry, calculated_expiry, status)
      VALUES (${kittingNumber}, ${kitMaterialId}, ${targetBatchId}, ${qty}, ${minExpiry}, ${minExpiry}, 'POSTED')
      RETURNING id
    `);
    const kittingId = (kitRes.rows[0] as any).id;

    // Post K01 consumption and K02 production for Stocked Kit
    if (type !== 'PHANTOM') {
      for (const comp of componentsUsed) {
        // K01 consumption
        await db.execute(sql`
          INSERT INTO inv_stock_ledger (movement_type, material_id, plant_id, sloc_id, batch_id, quantity, unit_cost, total_value, reference_doc_type, reference_doc_number)
          VALUES ('K01', ${comp.materialId}, ${plantId}, ${slocId || null}, ${comp.batchId}, ${-comp.quantity}, ${comp.unitCost}, ${comp.quantity * comp.unitCost}, 'KITTING', ${kittingNumber})
        `);
        await db.execute(sql`
          UPDATE inv_stock SET quantity = quantity - ${comp.quantity} WHERE material_id = ${comp.materialId} AND plant_id = ${plantId} AND batch_id = ${comp.batchId} AND stock_status = 'UNRESTRICTED'
        `);
      }

      // K02 production
      const unitCost = totalCost / qty;
      await db.execute(sql`
        INSERT INTO inv_stock_ledger (movement_type, material_id, plant_id, sloc_id, batch_id, quantity, unit_cost, total_value, reference_doc_type, reference_doc_number)
        VALUES ('K02', ${kitMaterialId}, ${plantId}, ${slocId || null}, ${targetBatchId}, ${qty}, ${unitCost}, ${totalCost}, 'KITTING', ${kittingNumber})
      `);
      await db.execute(sql`
        INSERT INTO inv_stock (material_id, plant_id, sloc_id, batch_id, stock_status, quantity)
        VALUES (${kitMaterialId}, ${plantId}, ${slocId || null}, ${targetBatchId}, 'UNRESTRICTED', ${qty})
        ON CONFLICT (material_id, plant_id, sloc_id, batch_id, stock_status) DO UPDATE SET quantity = inv_stock.quantity + ${qty}
      `);

      // Update material plant MAP for kit
      await db.execute(sql`
        UPDATE ent_material_plant SET total_stock_qty = total_stock_qty + ${qty}, total_stock_value = total_stock_value + ${totalCost}, moving_avg_price = (total_stock_value + ${totalCost}) / (total_stock_qty + ${qty}) WHERE material_id = ${kitMaterialId} AND plant_id = ${plantId}
      `);
    } else {
      // Phantom: no intermediate stock, just record exploded components
      // In real production order confirmation 261 would issue leaf ROH
    }

    try {
      await db.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description)
        VALUES ('pp_kitting_order', ${kittingId}, ${kittingNumber}, 'INSERT', ${JSON.stringify({ kittingNumber, kitMaterialId, qty, minExpiry, totalCost, expiryWarning, type })}::jsonb, ${`Kitting ${type || 'STOCKED'} POSTED: ${kittingNumber} Kit ${kitMaterialId} Qty ${qty} Cost ${totalCost.toFixed(3)} MinExpiry ${minExpiry} ${expiryWarning}`})
      `);
    } catch (e) {}

    return NextResponse.json({
      success: true,
      kittingId,
      kittingNumber,
      targetBatchId,
      targetQuantity: qty,
      minComponentExpiry: minExpiry,
      calculatedExpiry: minExpiry,
      totalCost: totalCost.toFixed(3),
      unitCost: (totalCost / qty).toFixed(4),
      expiryWarning,
      componentsUsed,
      message: `Kitting ${type || 'STOCKED'} ${kittingNumber} posted: ${qty} kits, cost ${totalCost.toFixed(3)} KWD, minExpiry ${minExpiry}, warning ${expiryWarning}, ${type === 'PHANTOM' ? 'Phantom no intermediate stock' : 'K01 consumption + K02 production'}`,
    });
  } catch (e: any) {
    console.error('Kitting failed', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
