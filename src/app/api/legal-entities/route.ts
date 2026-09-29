import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    let result;
    try {
      result = await db.execute(sql`SELECT * FROM org_legal_entity ORDER BY code`);
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        return NextResponse.json({ data: [], count: 0, message: 'Table org_legal_entity not yet migrated', helperCode: 'OX02' });
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
    const {
      code, name, description, tenant_id, tenant_code, company_group_id, company_group_code,
      currency_code, city, country, country_code, address, street, postal_code, region, tax_id, gst_number, pan, cin, phone, email, website, legal_form, registration_number,
      fiscal_calendar_code, fiscal_year_variant, chart_of_accounts_code, field_status_variant, posting_period_variant, posting_period_variant_code, credit_control_area, credit_policy_area_code, language
    } = body;
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

    // Ensure new columns per guide – downstream safe
    try {
      await db.execute(sql`ALTER TABLE org_legal_entity ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'IN'`);
      await db.execute(sql`ALTER TABLE org_legal_entity ADD COLUMN IF NOT EXISTS fiscal_year_variant VARCHAR(20) DEFAULT 'K4'`);
      await db.execute(sql`ALTER TABLE org_legal_entity ADD COLUMN IF NOT EXISTS chart_of_accounts_code VARCHAR(20) DEFAULT 'CA-IN-01'`);
      await db.execute(sql`ALTER TABLE org_legal_entity ADD COLUMN IF NOT EXISTS field_status_variant VARCHAR(20) DEFAULT 'FSSV-1000'`);
      await db.execute(sql`ALTER TABLE org_legal_entity ADD COLUMN IF NOT EXISTS posting_period_variant VARCHAR(20) DEFAULT 'PPV-1000'`);
      await db.execute(sql`ALTER TABLE org_legal_entity ADD COLUMN IF NOT EXISTS posting_period_variant_code VARCHAR(20) DEFAULT 'PPV-1000'`);
      await db.execute(sql`ALTER TABLE org_legal_entity ADD COLUMN IF NOT EXISTS credit_control_area VARCHAR(20) DEFAULT 'CRED-1000'`);
      await db.execute(sql`ALTER TABLE org_legal_entity ADD COLUMN IF NOT EXISTS credit_policy_area_code VARCHAR(20) DEFAULT 'CRED-1000'`);
      await db.execute(sql`ALTER TABLE org_legal_entity ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'EN'`);
      await db.execute(sql`ALTER TABLE org_legal_entity ADD COLUMN IF NOT EXISTS fiscal_calendar_code VARCHAR(20) DEFAULT 'K4'`);
    } catch {}

    const finalFiscal = (fiscal_calendar_code || fiscal_year_variant || 'K4').toUpperCase();
    const finalChart = (chart_of_accounts_code || 'CA-IN-01').toUpperCase();
    const finalFieldStatus = (field_status_variant || 'FSSV-1000').toUpperCase();
    const finalPostingVariant = (posting_period_variant || posting_period_variant_code || 'PPV-1000').toUpperCase();
    const finalCredit = (credit_control_area || credit_policy_area_code || 'CRED-1000').toUpperCase();
    const finalCountry = (country_code || country || 'IN').toUpperCase();
    const finalLang = (language || 'EN').toUpperCase();
    const finalCurrency = (currency_code || 'INR').toUpperCase();

    if (company_group_code) {
      const cgrCheck = await db.execute(sql`SELECT id FROM org_company_group WHERE code=${company_group_code} LIMIT 1`);
      if (cgrCheck.rows.length === 0) {
        return NextResponse.json({ error: `COMPANY_GROUP_CODE ${company_group_code} not found – create via ECGC e.g., ECGC-FMCG-01` }, { status: 400 });
      }
    }

    // Auto-create dependencies per guide – credit_control_area didnt create before ob13
    try {
      await db.execute(sql`INSERT INTO fin_fiscal_calendar (code, name) VALUES (${finalFiscal}, ${finalFiscal}) ON CONFLICT (code) DO NOTHING`);
    } catch {}
    try {
      await db.execute(sql`INSERT INTO fin_chart (code, name, language) VALUES (${finalChart}, ${finalChart}, 'EN') ON CONFLICT (code) DO NOTHING`);
      await db.execute(sql`INSERT INTO fi_chart_of_accounts (code, name) VALUES (${finalChart}, ${finalChart}) ON CONFLICT (code) DO NOTHING`).catch(()=>{});
    } catch {}
    try {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_field_status_variant (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(20) UNIQUE, name VARCHAR(100))`);
      await db.execute(sql`INSERT INTO fin_field_status_variant (code, name) VALUES (${finalFieldStatus}, ${finalFieldStatus}) ON CONFLICT (code) DO NOTHING`);
    } catch {}
    try {
      await db.execute(sql`INSERT INTO fin_posting_calendar (code, name) VALUES (${finalPostingVariant}, ${finalPostingVariant}) ON CONFLICT (code) DO NOTHING`);
    } catch {}
    try {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_credit_policy_area (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(20) UNIQUE, name VARCHAR(100), currency_code VARCHAR(3))`);
      await db.execute(sql`INSERT INTO fin_credit_policy_area (code, name, currency_code) VALUES (${finalCredit}, ${finalCredit}, 'INR') ON CONFLICT (code) DO NOTHING`);
    } catch {}
    try {
      await db.execute(sql`INSERT INTO core_currency (code, name) VALUES (${finalCurrency}, ${finalCurrency}) ON CONFLICT (code) DO NOTHING`);
    } catch {}

    let cgId = company_group_id;
    if (!cgId && company_group_code) {
      const cgr = await db.execute(sql`SELECT id FROM org_company_group WHERE code=${company_group_code} LIMIT 1`);
      if (cgr.rows.length) cgId = cgr.rows[0].id;
    }

    let res;
    try {
      res = await db.execute(sql`
        INSERT INTO org_legal_entity (tenant_id, company_group_id, code, name, currency_code, city, country, country_code, address, street, postal_code, region, tax_id, gst_number, pan, cin, phone, email, website, legal_form, registration_number, description, fiscal_calendar_code, fiscal_year_variant, chart_of_accounts_code, field_status_variant, posting_period_variant, posting_period_variant_code, credit_control_area, credit_policy_area_code, language)
        VALUES (${tenantId}, ${cgId || null}, ${code}, ${name}, ${finalCurrency}, ${city || null}, ${finalCountry}, ${finalCountry}, ${address || null}, ${street || null}, ${postal_code || null}, ${region || null}, ${tax_id || null}, ${gst_number || null}, ${pan || null}, ${cin || null}, ${phone || null}, ${email || null}, ${website || null}, ${legal_form || null}, ${registration_number || null}, ${description || null}, ${finalFiscal}, ${finalFiscal}, ${finalChart}, ${finalFieldStatus}, ${finalPostingVariant}, ${finalPostingVariant}, ${finalCredit}, ${finalCredit}, ${finalLang})
        ON CONFLICT DO NOTHING RETURNING id, code, name
      `);
    } catch (e: any) {
      console.warn('Full insert failed, fallback:', e.message);
      try {
        res = await db.execute(sql`
          INSERT INTO org_legal_entity (tenant_id, company_group_id, code, name, currency_code, city, country, description, fiscal_calendar_code, posting_period_variant_code)
          VALUES (${tenantId}, ${cgId || null}, ${code}, ${name}, ${finalCurrency}, ${city || null}, ${finalCountry}, ${description || null}, ${finalFiscal}, ${finalPostingVariant})
          ON CONFLICT DO NOTHING RETURNING id, code, name
        `);
      } catch {
        res = await db.execute(sql`
          INSERT INTO org_legal_entity (tenant_id, company_group_id, code, name, currency_code, city, country, description)
          VALUES (${tenantId}, ${cgId || null}, ${code}, ${name}, ${finalCurrency}, ${city || null}, ${finalCountry}, ${description || null})
          ON CONFLICT DO NOTHING RETURNING id, code, name
        `);
      }
    }

    if (res.rows.length===0) {
      const ex = await db.execute(sql`SELECT id, code, name FROM org_legal_entity WHERE tenant_id=${tenantId} AND code=${code} LIMIT 1`);
      if (ex.rows.length) {
        await db.execute(sql`UPDATE org_legal_entity SET name=${name}, currency_code=${finalCurrency}, chart_of_accounts_code=${finalChart}, fiscal_year_variant=${finalFiscal}, field_status_variant=${finalFieldStatus}, posting_period_variant=${finalPostingVariant}, credit_control_area=${finalCredit}, language=${finalLang}, updated_at=NOW() WHERE id=${ex.rows[0].id}`);
        return NextResponse.json({ success: true, legalEntity: ex.rows[0], message: `Legal Entity ${code} updated – CoA ${finalChart} FY ${finalFiscal} FSSV ${finalFieldStatus} PPV ${finalPostingVariant} CRED ${finalCredit} Lang ${finalLang}` });
      }
    }
    return NextResponse.json({ success: true, legalEntity: res.rows[0], message: `Legal Entity ${code} created – CoA ${finalChart} FY ${finalFiscal} FSSV ${finalFieldStatus} PPV ${finalPostingVariant} CRED ${finalCredit}` });
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
    if (id) res = await db.execute(sql`DELETE FROM org_legal_entity WHERE id = ${id} RETURNING code`);
    else res = await db.execute(sql`DELETE FROM org_legal_entity WHERE code = ${code} RETURNING code`);
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `Legal Entity ${res.rows[0].code} deleted`, deleted: res.rows[0].code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
