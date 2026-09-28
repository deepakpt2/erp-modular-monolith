import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Stock Transport Order API - ME27/MIGO/VL10B - Multi-Plant Logistics
 * GET /api/sto - List STOs
 * POST /api/sto - Create STO ME27
 * PUT /api/sto - Issue (351) / Receive (101) / Close
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const plantId = searchParams.get('plantId');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
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
      JOIN ent_plant sp ON sto.supplying_plant_id = sp.id
      JOIN ent_plant rp ON sto.receiving_plant_id = rp.id
      WHERE 1=1
    `;

    if (status) query = sql`${query} AND sto.status = ${status}`;
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
        JOIN ent_material_master m ON l.material_id = m.id
        WHERE l.sto_id = ${row.id}
        ORDER BY l.line_number
      `);
      stos.push({ ...row, lines: linesRes.rows });
    }

    return NextResponse.json({ stos, count: stos.length, source: 'db', functionCodes: 'ME27 Create STO, MIGO 351 Issue / 101 Receive, VL10B Process Delivery', note: 'STO moves inventory between plants with in-transit tracking and freight cost allocation' });
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
    const { supplyingPlantId, receivingPlantId, supplyingSlocId, receivingSlocId, type, freightCost, headerText, companyCodeId, lines } = body;
    if (!supplyingPlantId || !receivingPlantId) return NextResponse.json({ error: 'supplyingPlantId and receivingPlantId required' }, { status: 400 });

    const stoNumber = `45${Date.now().toString().slice(-8)}`;

    // Get companyCodeId from supplying plant if not provided
    let ccId = companyCodeId;
    if (!ccId) {
      const plantRes = await db.execute(sql`SELECT company_code_id FROM ent_plant WHERE id = ${supplyingPlantId} LIMIT 1`);
      ccId = plantRes.rows.length > 0 ? (plantRes.rows[0] as any).company_code_id : null;
    }

    const headerRes = await db.execute(sql`
      INSERT INTO mm_stock_transport_order (sto_number, type, status, company_code_id, supplying_plant_id, supplying_sloc_id, receiving_plant_id, receiving_sloc_id, freight_cost, header_text, total_amount)
      VALUES (${stoNumber}, ${type || 'TWO_STEP'}::sto_type, 'DRAFT', ${ccId}, ${supplyingPlantId}, ${supplyingSlocId || null}, ${receivingPlantId}, ${receivingSlocId || null}, ${freightCost || '0'}, ${headerText || null}, ${'0'})
      RETURNING id, sto_number
    `);

    const stoId = (headerRes.rows[0] as any).id;

    if (lines && Array.isArray(lines)) {
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        await db.execute(sql`
          INSERT INTO mm_sto_line (sto_id, line_number, material_id, quantity, uom, unit_price, batch_number)
          VALUES (${stoId}, ${l.lineNumber || (i+1)*10}, ${l.materialId}, ${l.quantity}, ${l.uom || 'KG'}, ${l.unitPrice || '0'}, ${l.batchNumber || null})
        `);
      }
      // Update total amount
      const totalRes = await db.execute(sql`SELECT SUM(quantity * unit_price) as total FROM mm_sto_line WHERE sto_id = ${stoId}`);
      const total = (totalRes.rows[0] as any).total || '0';
      await db.execute(sql`UPDATE mm_stock_transport_order SET total_amount = ${total} WHERE id = ${stoId}`);
    }

    await db.execute(sql`INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description) VALUES ('mm_stock_transport_order', ${stoId}, ${stoNumber}, 'INSERT', ${JSON.stringify(body)}::jsonb, ${`STO CREATE ME27: ${stoNumber} from ${supplyingPlantId} to ${receivingPlantId} freight ${freightCost}`})`).catch(()=>{});

    return NextResponse.json({ success: true, stoId, stoNumber, message: `STO ${stoNumber} created ME27 from plant ${supplyingPlantId} to ${receivingPlantId}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, action } = body;
    if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

    if (action === 'APPROVE') {
      await db.execute(sql`UPDATE mm_stock_transport_order SET status = 'APPROVED', updated_at = NOW() WHERE id = ${id}`);
      return NextResponse.json({ success: true, message: `STO ${id} APPROVED` });
    }

    if (action === 'ISSUE') {
      // MIGO 351 - Issue from supplying plant, put in transit
      await db.execute(sql`
        UPDATE mm_sto_line SET quantity_issued = quantity, quantity_in_transit = quantity WHERE sto_id = ${id}
      `);
      await db.execute(sql`UPDATE mm_stock_transport_order SET status = 'IN_TRANSIT', updated_at = NOW() WHERE id = ${id}`);

      // Create in-transit stock movement 351 (simplified: reduce supplying plant stock, increase in-transit)
      // For MVP, we just update status, real implementation would create inv_stock_ledger entries with movement 351
      return NextResponse.json({ success: true, message: `STO ${id} ISSUED 351 - In Transit, freight cost allocation pending` });
    }

    if (action === 'RECEIVE') {
      // MIGO 101 - Receive at receiving plant
      await db.execute(sql`
        UPDATE mm_sto_line SET quantity_received = quantity, quantity_in_transit = 0 WHERE sto_id = ${id}
      `);
      await db.execute(sql`UPDATE mm_stock_transport_order SET status = 'FULLY_RECEIVED', updated_at = NOW() WHERE id = ${id}`);
      return NextResponse.json({ success: true, message: `STO ${id} RECEIVED 101 at receiving plant` });
    }

    if (action === 'CLOSE') {
      await db.execute(sql`UPDATE mm_stock_transport_order SET status = 'CLOSED', updated_at = NOW() WHERE id = ${id}`);
      await db.execute(sql`UPDATE mm_sto_line SET is_closed = true WHERE sto_id = ${id}`);
      return NextResponse.json({ success: true, message: `STO ${id} CLOSED` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
