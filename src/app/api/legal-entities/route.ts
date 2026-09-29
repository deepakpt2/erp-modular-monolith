import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Legal Entity API - OX02 - Legal-Safe Module 1
 * Fresh empty – no sample data except tenant
 * Helper codes kept as-is
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    let result;
    try {
      result = await db.execute(sql`SELECT * FROM org_legal_entity ORDER BY code`);
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        return NextResponse.json({ data: [], count: 0, message: 'Table org_legal_entity not yet migrated – fresh empty Module 1', helperCode: 'OX02' });
      }
      throw e;
    }
    return NextResponse.json({ data: result.rows, count: result.rows.length, helperCode: 'OX02', table: 'org_legal_entity' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const body = await req.json();
    
      const { code, name, description, tenant_id, tenant_code, company_group_id, company_group_code, currency_code, city, country, address, street, postal_code, region, tax_id, gst_number, pan, cin, phone, email, website, legal_form, registration_number } = body;
      if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });
      let tenantId = tenant_id;
      if (!tenantId) {
        if (tenant_code) {
          const tr = await db.execute(sql`SELECT id FROM core_tenant WHERE code = ${tenant_code} LIMIT 1`);
          if (tr.rows.length) tenantId = tr.rows[0].id;
        }
        if (!tenantId) {
          const tr = await db.execute(sql`SELECT id FROM core_tenant LIMIT 1`);
          if (tr.rows.length) tenantId = tr.rows[0].id;
          else {
            const nt = await db.execute(sql`INSERT INTO core_tenant (code, name) VALUES ('TEN-100', 'Main Tenant') ON CONFLICT (code) DO UPDATE SET name='Main Tenant' RETURNING id`);
            tenantId = nt.rows[0].id;
          }
        }
      }
      let cgId = company_group_id;
      if (!cgId && company_group_code) {
        const cgr = await db.execute(sql`SELECT id FROM org_company_group WHERE code=${company_group_code} LIMIT 1`);
        if (cgr.rows.length) cgId = cgr.rows[0].id;
      }
      try {
        const res = await db.execute(sql`
          INSERT INTO org_legal_entity (tenant_id, company_group_id, code, name, currency_code, city, country, address, street, postal_code, region, tax_id, gst_number, pan, cin, phone, email, website, legal_form, registration_number, description)
          VALUES (${tenantId}, ${cgId || null}, ${code}, ${name}, ${currency_code || 'INR'}, ${city || null}, ${country || 'IN'}, ${address || null}, ${street || null}, ${postal_code || null}, ${region || null}, ${tax_id || null}, ${gst_number || null}, ${pan || null}, ${cin || null}, ${phone || null}, ${email || null}, ${website || null}, ${legal_form || null}, ${registration_number || null}, ${description || null})
          ON CONFLICT DO NOTHING RETURNING id, code, name
        `);
        if (res.rows.length===0) {
          const ex = await db.execute(sql`SELECT id, code, name FROM org_legal_entity WHERE tenant_id=${tenantId} AND code=${code} LIMIT 1`);
          if (ex.rows.length) {
            await db.execute(sql`UPDATE org_legal_entity SET name=${name}, currency_code=${currency_code || 'INR'}, city=${city || null}, country=${country || 'IN'}, description=${description || null}, updated_at=NOW() WHERE id=${ex.rows[0].id}`);
            return NextResponse.json({ success: true, legalEntity: ex.rows[0], message: `Legal Entity ${code} updated` });
          }
        }
        return NextResponse.json({ success: true, legalEntity: res.rows[0], message: `Legal Entity ${code} created (OX02)` });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    
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
      res = await db.execute(sql`UPDATE org_legal_entity SET code = COALESCE(${code ?? null}, code), name = COALESCE(${name ?? null}, name), description = COALESCE(${description ?? null}, description), is_active = COALESCE(${is_active ?? null}, is_active), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name`);
    } else {
      res = await db.execute(sql`UPDATE org_legal_entity SET name = COALESCE(${name ?? null}, name), description = COALESCE(${description ?? null}, description), is_active = COALESCE(${is_active ?? null}, is_active), updated_at = NOW() WHERE code = ${code} RETURNING id, code, name`);
    }
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: res.rows[0], message: `Legal Entity ${res.rows[0].code} updated` });
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
      res = await db.execute(sql`DELETE FROM org_legal_entity WHERE id = ${id} RETURNING code`);
    } else {
      res = await db.execute(sql`DELETE FROM org_legal_entity WHERE code = ${code} RETURNING code`);
    }
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `Legal Entity ${res.rows[0].code} deleted`, deleted: res.rows[0].code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
