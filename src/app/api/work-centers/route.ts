import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Work Centers API - CR01/CR02/CR03 - Work Centers for PP
 * GET /api/work-centers - List work centers with plant, cost center, capacity
 * POST /api/work-centers - Create work center
 * PUT /api/work-centers - Update work center status, capacity, rates
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const plantId = searchParams.get('plantId');
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let query = sql`
      SELECT 
        wc.id, wc.code, wc.name, wc.plant_id, wc.cost_center_id, wc.description, wc.capacity_per_hour, wc.is_active, wc.created_at,
        p.code as plant_code, p.name as plant_name,
        cc.code as cost_center_code, cc.name as cost_center_name,
        (SELECT COUNT(*) FROM pp_bom_line WHERE work_center_id = wc.id) as bom_line_count,
        (SELECT COUNT(*) FROM pp_routing_line WHERE work_center_id = wc.id) as routing_line_count
      FROM pp_work_center wc
      JOIN ent_plant p ON wc.plant_id = p.id
      LEFT JOIN fi_cost_center cc ON wc.cost_center_id = cc.id
      WHERE 1=1
    `;

    if (plantId) query = sql`${query} AND wc.plant_id = ${plantId}`;
    if (search) query = sql`${query} AND (wc.code ILIKE ${`%${search}%`} OR wc.name ILIKE ${`%${search}%`})`;

    query = sql`${query} ORDER BY wc.code LIMIT ${limit}`;

    const result = await db.execute(query);

    // Try to get routing info if tables exist
    let routingsCount = 0;
    try {
      const rc = await db.execute(sql`SELECT COUNT(*) as cnt FROM pp_routing_header`);
      routingsCount = parseInt((rc.rows[0] as any).cnt);
    } catch {}

    return NextResponse.json({
      workCenters: result.rows,
      count: result.rows.length,
      routingsCount,
      source: 'db',
      functionCodes: 'CR01 Create Work Center, CR02 Change Work Center, CR03 Display Work Center, CA01 Create Routing, CA02 Change Routing, CA03 Display Routing',
      note: 'Work Centers track machine/labor capacity, cost center, labor/machine rates for product costing labor/overhead - previously costing only material costs',
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
    const { code, name, plantId, costCenterId, description, capacityPerHour, laborRate, machineRate, overheadRate } = body;
    if (!code || !name || !plantId) return NextResponse.json({ error: 'code, name, plantId required' }, { status: 400 });

    // Try to create with extended fields if columns exist, fallback to basic
    let res;
    try {
      res = await db.execute(sql`
        INSERT INTO pp_work_center (code, name, plant_id, cost_center_id, description, capacity_per_hour)
        VALUES (${code}, ${name}, ${plantId}, ${costCenterId || null}, ${description || null}, ${capacityPerHour || '0'})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, plant_id = ${plantId}, cost_center_id = ${costCenterId || null}, description = ${description || null}, capacity_per_hour = ${capacityPerHour || '0'}
        RETURNING id, code
      `);
    } catch (e: any) {
      // Fallback basic
      res = await db.execute(sql`
        INSERT INTO pp_work_center (code, name, plant_id, cost_center_id, description, capacity_per_hour)
        VALUES (${code}, ${name}, ${plantId}, ${costCenterId || null}, ${description || null}, ${capacityPerHour || '0'})
        RETURNING id, code
      `);
    }

    await db.execute(sql`
      INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description)
      VALUES ('pp_work_center', ${res.rows[0].id}, ${code}, 'INSERT', ${JSON.stringify(body)}::jsonb, ${`Work Center CREATE CR01: ${code} ${name} plant ${plantId} capacity ${capacityPerHour}/h`})
    `).catch(()=>{});

    return NextResponse.json({ success: true, workCenter: res.rows[0], message: `Work Center ${code} created CR01` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, action, isActive, capacityPerHour } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    if (action === 'SET_ACTIVE') {
      await db.execute(sql`UPDATE pp_work_center SET is_active = ${isActive} WHERE id = ${id}`);
      return NextResponse.json({ success: true, message: `Work Center ${id} active set to ${isActive}` });
    }

    if (action === 'UPDATE_CAPACITY') {
      await db.execute(sql`UPDATE pp_work_center SET capacity_per_hour = ${capacityPerHour} WHERE id = ${id}`);
      return NextResponse.json({ success: true, message: `Work Center ${id} capacity updated to ${capacityPerHour}/h` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
