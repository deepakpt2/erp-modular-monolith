import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Inventory Location API - OX09 - Legal-Safe Module 1
 * Fresh empty – no sample data except tenant
 * Helper codes kept as-is
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    let result;
    try {
      result = await db.execute(sql`SELECT * FROM org_inventory_location ORDER BY code`);
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        return NextResponse.json({ data: [], count: 0, message: 'Table org_inventory_location not yet migrated – fresh empty Module 1', helperCode: 'OX09' });
      }
      throw e;
    }
    return NextResponse.json({ data: result.rows, count: result.rows.length, helperCode: 'OX09', table: 'org_inventory_location' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const body = await req.json();
    
      const { code, name, facility_id, facility_code, location_type, description } = body;
      
      // VALIDATION: Check foreign keys exist in DB – prevents invalid data

      if (facility_code) {
        const f = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${facility_code} LIMIT 1`);
        if (f.rows.length === 0) {
          return NextResponse.json({ error: `FACILITY_CODE ${facility_code} not found in DB – create it first via EFCC` }, { status: 400 });
        }
      }

if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });
      let facId = facility_id;
      if (!facId && facility_code) {
        const fr = await db.execute(sql`SELECT id FROM org_facility WHERE code=${facility_code} LIMIT 1`);
        if (fr.rows.length) facId = fr.rows[0].id;
      }
      if (!facId) return NextResponse.json({ error: 'facility_id or facility_code required' }, { status: 400 });
      const res = await db.execute(sql`INSERT INTO org_inventory_location (facility_id, code, name, location_type) VALUES (${facId}, ${code}, ${name}, ${location_type || 'PRIMARY'}) ON CONFLICT DO NOTHING RETURNING id, code, name`);
      if (res.rows.length===0) {
        const ex = await db.execute(sql`SELECT id, code, name FROM org_inventory_location WHERE facility_id=${facId} AND code=${code} LIMIT 1`);
        return NextResponse.json({ success: true, inventoryLocation: ex.rows[0], message: `Inventory Location ${code} exists` });
      }
      return NextResponse.json({ success: true, inventoryLocation: res.rows[0], message: `Inventory Location ${code} created (OX09)` });
    
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const body = await req.json();
    const { id, code, name, description, is_active } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });
    let res;
    if (id) {
      res = await db.execute(sql`UPDATE org_inventory_location SET code = COALESCE(${code ?? null}, code), name = COALESCE(${name ?? null}, name), description = COALESCE(${description ?? null}, description), is_active = COALESCE(${is_active ?? null}, is_active), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name`);
    } else {
      res = await db.execute(sql`UPDATE org_inventory_location SET name = COALESCE(${name ?? null}, name), description = COALESCE(${description ?? null}, description), is_active = COALESCE(${is_active ?? null}, is_active), updated_at = NOW() WHERE code = ${code} RETURNING id, code, name`);
    }
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: res.rows[0], message: `Inventory Location ${res.rows[0].code} updated` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const id = searchParams.get('id');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });
    let res;
    if (id) {
      res = await db.execute(sql`DELETE FROM org_inventory_location WHERE id = ${id} RETURNING code`);
    } else {
      res = await db.execute(sql`DELETE FROM org_inventory_location WHERE code = ${code} RETURNING code`);
    }
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `Inventory Location ${res.rows[0].code} deleted`, deleted: res.rows[0].code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
