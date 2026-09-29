import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Facility API - OX10 - Legal-Safe Module 1
 * Fresh empty – no sample data except tenant
 * Helper codes kept as-is
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    let result;
    try {
      result = await db.execute(sql`SELECT * FROM org_facility ORDER BY code`);
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        return NextResponse.json({ data: [], count: 0, message: 'Table org_facility not yet migrated – fresh empty Module 1', helperCode: 'OX10' });
      }
      throw e;
    }
    return NextResponse.json({ data: result.rows, count: result.rows.length, helperCode: 'OX10', table: 'org_facility' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const body = await req.json();
    
      const { code, name, description, legal_entity_id, legal_entity_code, address, city, country } = body;
      
      // VALIDATION: Check foreign keys exist in DB – prevents invalid data

      if (legal_entity_code) {
        const le = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code = ${legal_entity_code} LIMIT 1`);
        if (le.rows.length === 0) {
          return NextResponse.json({ error: `LEGAL_ENTITY_CODE ${legal_entity_code} not found in DB – create it first via ELEC. Valid: /api/legal-entities` }, { status: 400 });
        }
      }

if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });
      let leId = legal_entity_id;
      if (!leId && legal_entity_code) {
        const ler = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code=${legal_entity_code} LIMIT 1`);
        if (ler.rows.length) leId = ler.rows[0].id;
      }
      if (!leId) return NextResponse.json({ error: 'legal_entity_id or legal_entity_code required' }, { status: 400 });
      const res = await db.execute(sql`INSERT INTO org_facility (legal_entity_id, code, name, description, address, city, country) VALUES (${leId}, ${code}, ${name}, ${description || null}, ${address || null}, ${city || null}, ${country || null}) ON CONFLICT (code) DO UPDATE SET name=${name}, description=${description || null}, updated_at=NOW() RETURNING id, code, name`);
      return NextResponse.json({ success: true, facility: res.rows[0], message: `Facility ${code} created (OX10)` });
    
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
      res = await db.execute(sql`UPDATE org_facility SET code = COALESCE(${code ?? null}, code), name = COALESCE(${name ?? null}, name), description = COALESCE(${description ?? null}, description), is_active = COALESCE(${is_active ?? null}, is_active), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name`);
    } else {
      res = await db.execute(sql`UPDATE org_facility SET name = COALESCE(${name ?? null}, name), description = COALESCE(${description ?? null}, description), is_active = COALESCE(${is_active ?? null}, is_active), updated_at = NOW() WHERE code = ${code} RETURNING id, code, name`);
    }
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: res.rows[0], message: `Facility ${res.rows[0].code} updated` });
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
      res = await db.execute(sql`DELETE FROM org_facility WHERE id = ${id} RETURNING code`);
    } else {
      res = await db.execute(sql`DELETE FROM org_facility WHERE code = ${code} RETURNING code`);
    }
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `Facility ${res.rows[0].code} deleted`, deleted: res.rows[0].code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
