import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Commercial Org API - OVX2 - Legal-Safe Module 1
 * Fresh empty – no sample data except tenant
 * Helper codes kept as-is
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    let result;
    try {
      result = await db.execute(sql`SELECT * FROM org_commercial_org ORDER BY code`);
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        return NextResponse.json({ data: [], count: 0, message: 'Table org_commercial_org not yet migrated – fresh empty Module 1', helperCode: 'OVX2' });
      }
      throw e;
    }
    return NextResponse.json({ data: result.rows, count: result.rows.length, helperCode: 'OVX2', table: 'org_commercial_org' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const body = await req.json();
    
      const { code, name, description, tenant_id, tenant_code, legal_entity_id, legal_entity_code, currency_code } = body;
      
      // VALIDATION: Check foreign keys exist in DB – prevents invalid data

      if (legal_entity_code) {
        const le = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code = ${legal_entity_code} LIMIT 1`);
        if (le.rows.length === 0) {
          return NextResponse.json({ error: `LEGAL_ENTITY_CODE ${legal_entity_code} not found – create via ELEC` }, { status: 400 });
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
      let leId = legal_entity_id;
      if (!leId && legal_entity_code) {
        const ler = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code=${legal_entity_code} LIMIT 1`);
        if (ler.rows.length) leId = ler.rows[0].id;
      }
      if (!leId) return NextResponse.json({ error: 'legal_entity_id or legal_entity_code required' }, { status: 400 });
      const res = await db.execute(sql`INSERT INTO org_commercial_org (tenant_id, legal_entity_id, code, name, currency_code, description) VALUES (${tenantId}, ${leId}, ${code}, ${name}, ${currency_code || 'INR'}, ${description || null}) ON CONFLICT DO NOTHING RETURNING id, code, name`);
      if (res.rows.length===0) {
        const ex = await db.execute(sql`SELECT id, code, name FROM org_commercial_org WHERE tenant_id=${tenantId} AND code=${code} LIMIT 1`);
        return NextResponse.json({ success: true, commercialOrg: ex.rows[0], message: `Commercial Org ${code} exists` });
      }
      return NextResponse.json({ success: true, commercialOrg: res.rows[0], message: `Commercial Org ${code} created (OVX2)` });
    
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
      res = await db.execute(sql`UPDATE org_commercial_org SET code = COALESCE(${code ?? null}, code), name = COALESCE(${name ?? null}, name), description = COALESCE(${description ?? null}, description), is_active = COALESCE(${is_active ?? null}, is_active), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name`);
    } else {
      res = await db.execute(sql`UPDATE org_commercial_org SET name = COALESCE(${name ?? null}, name), description = COALESCE(${description ?? null}, description), is_active = COALESCE(${is_active ?? null}, is_active), updated_at = NOW() WHERE code = ${code} RETURNING id, code, name`);
    }
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: res.rows[0], message: `Commercial Org ${res.rows[0].code} updated` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import { validateSalesOrgDeletion } from '@/shared/kernel/safety/deletionPrecheck';

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const id = searchParams.get('id');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    // Industry Standard Pre-check
    const precheck = await validateSalesOrgDeletion({ id, code });
    if (!precheck.canDelete) {
      return NextResponse.json({
        success: false,
        errorCode: 'MSG_SORG_001',
        error: precheck.errorTitle,
        diagnostic: precheck,
      }, { status: 409 });
    }

    let res;
    if (id) {
      res = await db.execute(sql`DELETE FROM org_commercial_org WHERE id = ${id} RETURNING code`);
    } else {
      res = await db.execute(sql`DELETE FROM org_commercial_org WHERE code = ${code} RETURNING code`);
    }
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `Commercial Org ${res.rows[0].code} deleted`, deleted: res.rows[0].code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
