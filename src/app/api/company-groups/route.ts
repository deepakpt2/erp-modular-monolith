import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Company Group API - OX15 - Legal-Safe Module 1
 * Fresh empty – no sample data except tenant
 * Helper codes kept as-is
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    let result;
    try {
      result = await db.execute(sql`SELECT * FROM org_company_group ORDER BY code`);
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        return NextResponse.json({ data: [], count: 0, message: 'Table org_company_group not yet migrated – fresh empty Module 1', helperCode: 'OX15' });
      }
      throw e;
    }
    return NextResponse.json({ data: result.rows, count: result.rows.length, helperCode: 'OX15', table: 'org_company_group' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const body = await req.json();
    
      const { code, name, description, tenant_id, tenant_code, currency_code, country_code, country, language } = body;
      
      // VALIDATION: Check foreign keys exist in DB – prevents invalid data

      if (tenant_code) {
        const tr = await db.execute(sql`SELECT id FROM core_tenant WHERE code = ${tenant_code} LIMIT 1`);
        if (tr.rows.length === 0) {
          return NextResponse.json({ error: `TENANT_CODE ${tenant_code} not found in DB – create it first. Valid: /api/tenants` }, { status: 400 });
        }
      }

      const finalCurrency = (currency_code || 'INR').toUpperCase().trim();
      const currCheck = await db.execute(sql`SELECT code FROM core_currency WHERE UPPER(code) = ${finalCurrency} LIMIT 1`);
      if (currCheck.rows.length === 0) {
        return NextResponse.json({ error: `CURRENCY_CODE '${finalCurrency}' is invalid or does not exist in Currencies master (core_currency). Please create it first via FCYC (/fico/currencies).` }, { status: 400 });
      }

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
      // Ensure new columns exist – auto-migrate safe – add if not exists
      try {
        await db.execute(sql`ALTER TABLE org_company_group ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'INR'`);
        await db.execute(sql`ALTER TABLE org_company_group ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'IN'`);
        await db.execute(sql`ALTER TABLE org_company_group ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'IN'`);
        await db.execute(sql`ALTER TABLE org_company_group ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'EN'`);
      } catch {}
      const finalCurrency = (currency_code || 'INR').toUpperCase();
      const finalCountry = (country_code || country || 'IN').toUpperCase();
      const finalLang = (language || 'EN').toUpperCase();
      const res = await db.execute(sql`INSERT INTO org_company_group (tenant_id, code, name, description, currency_code, country_code, country, language) VALUES (${tenantId}, ${code}, ${name}, ${description || null}, ${finalCurrency}, ${finalCountry}, ${finalCountry}, ${finalLang}) ON CONFLICT DO NOTHING RETURNING id, code, name`);
      if (res.rows.length===0) {
        const ex = await db.execute(sql`SELECT id, code, name FROM org_company_group WHERE tenant_id=${tenantId} AND code=${code} LIMIT 1`);
        if (ex.rows.length) {
          await db.execute(sql`UPDATE org_company_group SET name=${name}, description=${description || null}, currency_code=${finalCurrency}, country_code=${finalCountry}, country=${finalCountry}, language=${finalLang}, updated_at=NOW() WHERE id=${ex.rows[0].id}`);
          return NextResponse.json({ success: true, companyGroup: ex.rows[0], message: `Company Group ${code} updated – currency ${finalCurrency} country ${finalCountry} lang ${finalLang}` });
        }
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
      }
      return NextResponse.json({ success: true, companyGroup: res.rows[0], message: `Company Group ${code} created (OX15) – currency ${finalCurrency} country ${finalCountry} lang ${finalLang}` });
    
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
      res = await db.execute(sql`UPDATE org_company_group SET code = COALESCE(${code ?? null}, code), name = COALESCE(${name ?? null}, name), description = COALESCE(${description ?? null}, description), is_active = COALESCE(${is_active ?? null}, is_active), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name`);
    } else {
      res = await db.execute(sql`UPDATE org_company_group SET name = COALESCE(${name ?? null}, name), description = COALESCE(${description ?? null}, description), is_active = COALESCE(${is_active ?? null}, is_active), updated_at = NOW() WHERE code = ${code} RETURNING id, code, name`);
    }
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: res.rows[0], message: `Company Group ${res.rows[0].code} updated` });
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
      res = await db.execute(sql`DELETE FROM org_company_group WHERE id = ${id} RETURNING code`);
    } else {
      res = await db.execute(sql`DELETE FROM org_company_group WHERE code = ${code} RETURNING code`);
    }
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `Company Group ${res.rows[0].code} deleted`, deleted: res.rows[0].code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
