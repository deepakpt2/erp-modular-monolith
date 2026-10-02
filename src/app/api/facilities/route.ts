import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Facility API - EFCC (legacy OX10) - Legal-Safe Module 1
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

    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    // Defensive DB migration: in pure definition (OX10 / EFCC), plant does not require legal_entity_id (assigned later via OX18)
    await db.execute(sql`ALTER TABLE org_facility ALTER COLUMN legal_entity_id DROP NOT NULL`).catch(() => {});
    await db.execute(sql`ALTER TABLE org_facility ALTER COLUMN company_code_id DROP NOT NULL`).catch(() => {});

    let leId = legal_entity_id || null;
    if (!leId && legal_entity_code) {
      const ler = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code=${legal_entity_code} LIMIT 1`);
      if (ler.rows.length) leId = ler.rows[0].id;
    }

    const facCode = code.toUpperCase().trim();
    const res = await db.execute(sql`
      INSERT INTO org_facility (legal_entity_id, code, name, description, address, city, country) 
      VALUES (${leId}, ${facCode}, ${name}, ${description || null}, ${address || null}, ${city || null}, ${country || null}) 
      ON CONFLICT (code) DO UPDATE SET 
        name = ${name}, 
        legal_entity_id = COALESCE(${leId}, org_facility.legal_entity_id),
        description = ${description || null}, 
        address = COALESCE(${address || null}, org_facility.address),
        city = COALESCE(${city || null}, org_facility.city),
        country = COALESCE(${country || null}, org_facility.country),
        updated_at = NOW() 
      RETURNING id, code, name
    `);
    return NextResponse.json({ success: true, facility: res.rows[0], message: `Facility ${facCode} created (EFCC / OX10)` });
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

import { validatePlantDeletion } from '@/shared/kernel/safety/deletionPrecheck';

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const id = searchParams.get('id');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    // SAP Standard Safety Pre-check
    const precheck = await validatePlantDeletion({ id, code });
    if (!precheck.canDelete) {
      return NextResponse.json({
        success: false,
        errorCode: 'SAP_MSG_OX10_001',
        error: precheck.errorTitle,
        diagnostic: precheck,
      }, { status: 409 });
    }

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
