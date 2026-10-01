import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Procurement Division API - OX08 - Legal-Safe Module 1
 * Fresh empty – no sample data except tenant
 * Helper codes kept as-is
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    let result;
    try {
      result = await db.execute(sql`SELECT * FROM org_procurement_division ORDER BY code`);
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        return NextResponse.json({ data: [], count: 0, message: 'Table org_procurement_division not yet migrated – fresh empty Module 1', helperCode: 'OX08' });
      }
      throw e;
    }
    return NextResponse.json({ data: result.rows, count: result.rows.length, helperCode: 'OX08', table: 'org_procurement_division' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const body = await req.json();
    
      const { code, name, description, tenant_id, tenant_code } = body;
      
      // VALIDATION: Check foreign keys exist in DB – prevents invalid data

      if (tenant_code) {
        const tr = await db.execute(sql`SELECT id FROM core_tenant WHERE code = ${tenant_code} LIMIT 1`);
        if (tr.rows.length === 0) {
          return NextResponse.json({ error: `TENANT_CODE ${tenant_code} not found` }, { status: 400 });
        }
      }

if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });
      let tenantId = tenant_id;
      if (!tenantId) {
        const tr = await db.execute(sql`SELECT id FROM core_tenant LIMIT 1`);
        if (tr.rows.length) tenantId = tr.rows[0].id;
        else {
          const nt = await db.execute(sql`INSERT INTO core_tenant (code, name) VALUES ('TEN-100', 'Main Tenant') ON CONFLICT (code) DO UPDATE SET name='Main Tenant' RETURNING id`);
          tenantId = nt.rows[0].id;
        }
      }
      const res = await db.execute(sql`INSERT INTO org_procurement_division (tenant_id, code, name, description) VALUES (${tenantId}, ${code}, ${name}, ${description || null}) ON CONFLICT DO NOTHING RETURNING id, code, name`);
      if (res.rows.length===0) {
        const ex = await db.execute(sql`SELECT id, code, name FROM org_procurement_division WHERE tenant_id=${tenantId} AND code=${code} LIMIT 1`);
        return NextResponse.json({ success: true, procurementDivision: ex.rows[0], message: `Procurement Division ${code} exists` });
      }
      return NextResponse.json({ success: true, procurementDivision: res.rows[0], message: `Procurement Division ${code} created (OX08)` });
    
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
      res = await db.execute(sql`UPDATE org_procurement_division SET code = COALESCE(${code ?? null}, code), name = COALESCE(${name ?? null}, name), description = COALESCE(${description ?? null}, description), is_active = COALESCE(${is_active ?? null}, is_active), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name`);
    } else {
      res = await db.execute(sql`UPDATE org_procurement_division SET name = COALESCE(${name ?? null}, name), description = COALESCE(${description ?? null}, description), is_active = COALESCE(${is_active ?? null}, is_active), updated_at = NOW() WHERE code = ${code} RETURNING id, code, name`);
    }
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: res.rows[0], message: `Procurement Division ${res.rows[0].code} updated` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import { validatePurchasingOrgDeletion } from '@/shared/kernel/safety/deletionPrecheck';

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const id = searchParams.get('id');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    // Industry Standard Pre-check
    const precheck = await validatePurchasingOrgDeletion({ id, code });
    if (!precheck.canDelete) {
      return NextResponse.json({
        success: false,
        errorCode: 'MSG_PORG_001',
        error: precheck.errorTitle,
        diagnostic: precheck,
      }, { status: 409 });
    }

    let res;
    if (id) {
      res = await db.execute(sql`DELETE FROM org_procurement_division WHERE id = ${id} RETURNING code`);
    } else {
      res = await db.execute(sql`DELETE FROM org_procurement_division WHERE code = ${code} RETURNING code`);
    }
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `Procurement Division ${res.rows[0].code} deleted`, deleted: res.rows[0].code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
