import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Routings API - CA01/CA02/CA03 - Routings for PP
 * GET /api/routings - List routings with material, plant, operations
 * POST /api/routings - Create routing header + operations
 * PUT /api/routings - Update routing status, operations
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const plantId = searchParams.get('plantId');
  const materialId = searchParams.get('materialId');
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let query = sql`
      SELECT 
        h.id, h.routing_number, h.material_id, h.plant_id, h.bom_header_id, h.description, h.status, h.version,
        h.lot_size_from, h.lot_size_to, h.valid_from, h.valid_to,
        m.material_number, m.description as material_description,
        p.code as plant_code, p.name as plant_name,
        bh.bom_number,
        (SELECT COUNT(*) FROM pp_routing_line WHERE routing_header_id = h.id) as operation_count,
        (SELECT SUM(setup_time_minutes + machine_time_minutes + labor_time_minutes) FROM pp_routing_line WHERE routing_header_id = h.id) as total_time_minutes
      FROM pp_routing_header h
      JOIN ent_material_master m ON h.material_id = m.id
      JOIN ent_plant p ON h.plant_id = p.id
      LEFT JOIN pp_bom_header bh ON h.bom_header_id = bh.id
      WHERE 1=1
    `;

    if (plantId) query = sql`${query} AND h.plant_id = ${plantId}`;
    if (materialId) query = sql`${query} AND h.material_id = ${materialId}`;
    if (search) query = sql`${query} AND (h.routing_number ILIKE ${`%${search}%`} OR m.material_number ILIKE ${`%${search}%`} OR m.description ILIKE ${`%${search}%`})`;

    query = sql`${query} ORDER BY h.routing_number DESC LIMIT ${limit}`;

    const result = await db.execute(query);

    const routings = [];
    for (const row of result.rows as any[]) {
      const opsRes = await db.execute(sql`
        SELECT 
          l.id, l.operation_number, l.work_center_id, l.description, l.setup_time_minutes, l.machine_time_minutes, l.labor_time_minutes, l.base_quantity,
          wc.code as work_center_code, wc.name as work_center_name, wc.capacity_per_hour,
          wc.labor_rate_per_hour, wc.machine_rate_per_hour, wc.overhead_rate_percent
        FROM pp_routing_line l
        JOIN pp_work_center wc ON l.work_center_id = wc.id
        WHERE l.routing_header_id = ${row.id}
        ORDER BY l.operation_number
      `);
      routings.push({ ...row, operations: opsRes.rows });
    }

    return NextResponse.json({
      routings,
      count: routings.length,
      source: 'db',
      functionCodes: 'CA01 Create Routing, CA02 Change Routing, CA03 Display Routing, CR01 Work Center',
      note: 'Routings define sequence of manufacturing steps with work center, setup/machine/labor times for product costing labor/overhead',
    });
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
    const { materialId, plantId, bomHeaderId, description, lotSizeFrom, lotSizeTo, validFrom, validTo, operations } = body;
    if (!materialId || !plantId) return NextResponse.json({ error: 'materialId and plantId required' }, { status: 400 });

    const routingNumber = `ROUTING-${Date.now().toString().slice(-8)}`;

    const headerRes = await db.execute(sql`
      INSERT INTO pp_routing_header (routing_number, material_id, plant_id, bom_header_id, description, status, version, lot_size_from, lot_size_to, valid_from, valid_to)
      VALUES (${routingNumber}, ${materialId}, ${plantId}, ${bomHeaderId || null}, ${description || null}, 'ACTIVE', '01', ${lotSizeFrom || '1'}, ${lotSizeTo || '999999'}, ${validFrom ? new Date(validFrom) : new Date()}::timestamp, ${validTo ? new Date(validTo) : null}::timestamp)
      RETURNING id, routing_number
    `);

    const routingId = (headerRes.rows[0] as any).id;

    if (operations && Array.isArray(operations) && operations.length > 0) {
      for (const op of operations) {
        await db.execute(sql`
          INSERT INTO pp_routing_line (routing_header_id, operation_number, work_center_id, description, setup_time_minutes, machine_time_minutes, labor_time_minutes, base_quantity)
          VALUES (${routingId}, ${op.operationNumber}, ${op.workCenterId}, ${op.description || null}, ${op.setupTimeMinutes || 0}, ${op.machineTimeMinutes || 0}, ${op.laborTimeMinutes || 0}, ${op.baseQuantity || '1'})
        `);
      }
    }

    await db.execute(sql`
      INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description)
      VALUES ('pp_routing_header', ${routingId}, ${routingNumber}, 'INSERT', ${JSON.stringify(body)}::jsonb, ${`Routing CREATE CA01: ${routingNumber} material ${materialId} plant ${plantId} ops ${operations?.length||0}`})
    `).catch(()=>{});

    return NextResponse.json({ success: true, routingId, routingNumber, message: `Routing ${routingNumber} created CA01 with ${operations?.length||0} operations` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, action, status, operations } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    if (action === 'SET_STATUS') {
      await db.execute(sql`UPDATE pp_routing_header SET status = ${status}::routing_status, updated_at = NOW() WHERE id = ${id}`);
      return NextResponse.json({ success: true, message: `Routing ${id} status → ${status}` });
    }

    if (action === 'UPDATE_OPERATIONS' && operations) {
      await db.execute(sql`DELETE FROM pp_routing_line WHERE routing_header_id = ${id}`);
      for (const op of operations) {
        await db.execute(sql`
          INSERT INTO pp_routing_line (routing_header_id, operation_number, work_center_id, description, setup_time_minutes, machine_time_minutes, labor_time_minutes, base_quantity)
          VALUES (${id}, ${op.operationNumber}, ${op.workCenterId}, ${op.description || null}, ${op.setupTimeMinutes || 0}, ${op.machineTimeMinutes || 0}, ${op.laborTimeMinutes || 0}, ${op.baseQuantity || '1'})
        `);
      }
      await db.execute(sql`UPDATE pp_routing_header SET updated_at = NOW() WHERE id = ${id}`);
      return NextResponse.json({ success: true, message: `Routing ${id} operations updated ${operations.length} ops` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
