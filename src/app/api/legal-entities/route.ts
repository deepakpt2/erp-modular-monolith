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
    
      const { code, name, description, tenant_id, tenant_code, company_group_id, company_group_code, currency_code, city, country, address, street, postal_code, region, tax_id, gst_number, pan, cin, phone, email, website, legal_form, registration_number, fiscal_calendar_code, posting_period_variant_code } = body;
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
      // VALIDATION: Check foreign keys exist in DB – prevents invalid K6 etc
      if (company_group_code) {
        const cgrCheck = await db.execute(sql`SELECT id FROM org_company_group WHERE code=${company_group_code} LIMIT 1`);
        if (cgrCheck.rows.length === 0) {
          return NextResponse.json({ error: `COMPANY_GROUP_CODE ${company_group_code} not found in DB – create it first via ECGC. Valid: check /api/company-groups` }, { status: 400 });
        }
      }
      if (fiscal_calendar_code) {
        let fiscalExists = false;
        try {
          const fcr = await db.execute(sql`SELECT id FROM fin_fiscal_calendar WHERE code=${fiscal_calendar_code} LIMIT 1`);
          if (fcr.rows.length > 0) fiscalExists = true;
        } catch {}
        if (!fiscalExists) {
          try {
            const fcr2 = await db.execute(sql`SELECT id FROM ent_fiscal_year_variant WHERE code=${fiscal_calendar_code} LIMIT 1`);
            if (fcr2.rows.length > 0) fiscalExists = true;
          } catch {}
        }
        if (!fiscalExists) {
          // List valid
          let validCodes: string[] = [];
          try {
            const list = await db.execute(sql`SELECT code FROM fin_fiscal_calendar ORDER BY code LIMIT 20`);
            validCodes = list.rows.map((r:any)=>r.code);
          } catch {
            try {
              const list = await db.execute(sql`SELECT code FROM ent_fiscal_year_variant ORDER BY code LIMIT 20`);
              validCodes = list.rows.map((r:any)=>r.code);
            } catch {}
          }
          return NextResponse.json({ error: `FISCAL_CALENDAR_CODE ${fiscal_calendar_code} not found in DB – create it first via FFYC. Valid codes: ${validCodes.join(', ') || 'K4, V3, K1 – create via POST /api/fiscal-calendars'}`, validCodes }, { status: 400 });
        }
      }
      if (currency_code) {
        try {
          const currCheck = await db.execute(sql`SELECT id FROM core_currency WHERE code=${currency_code} LIMIT 1`);
          if (currCheck.rows.length === 0) {
            const currCheck2 = await db.execute(sql`SELECT id FROM ent_currency WHERE code=${currency_code} LIMIT 1`);
            if (currCheck2.rows.length === 0) {
              return NextResponse.json({ error: `CURRENCY_CODE ${currency_code} not found in DB – create it first via FCYC /api/currencies` }, { status: 400 });
            }
          }
        } catch {}
      }
      if (posting_period_variant_code) {
        let ppExists = false;
        try {
          const ppr = await db.execute(sql`SELECT id FROM fin_posting_calendar WHERE code=${posting_period_variant_code} LIMIT 1`);
          if (ppr.rows.length > 0) ppExists = true;
        } catch {}
        if (!ppExists) {
          try {
            const ppr2 = await db.execute(sql`SELECT id FROM fi_posting_period_variant WHERE code=${posting_period_variant_code} LIMIT 1`);
            if (ppr2.rows.length > 0) ppExists = true;
          } catch {}
        }
        if (!ppExists) {
          let validPP: string[] = [];
          try {
            const list = await db.execute(sql`SELECT code FROM fin_posting_calendar ORDER BY code LIMIT 20`);
            validPP = list.rows.map((r:any)=>r.code);
          } catch {
            try {
              const list = await db.execute(sql`SELECT code FROM fi_posting_period_variant ORDER BY code LIMIT 20`);
              validPP = list.rows.map((r:any)=>r.code);
            } catch {}
          }
          return NextResponse.json({ error: `POSTING_PERIOD_VARIANT_CODE ${posting_period_variant_code} not found in DB – create it first via OBBO. Valid: ${validPP.join(', ') || '1000, KS01 – POST /api/posting-period-variants'}`, validCodes: validPP }, { status: 400 });
        }
      }

      let cgId = company_group_id;
      if (!cgId && company_group_code) {
        const cgr = await db.execute(sql`SELECT id FROM org_company_group WHERE code=${company_group_code} LIMIT 1`);
        if (cgr.rows.length) cgId = cgr.rows[0].id;
      }
      try {
        // Try with fiscal_calendar_code and posting_period_variant_code if columns exist – fallback without
        let res;
        try {
          res = await db.execute(sql`
            INSERT INTO org_legal_entity (tenant_id, company_group_id, code, name, currency_code, city, country, address, street, postal_code, region, tax_id, gst_number, pan, cin, phone, email, website, legal_form, registration_number, description, fiscal_calendar_code, posting_period_variant_code)
            VALUES (${tenantId}, ${cgId || null}, ${code}, ${name}, ${currency_code || 'INR'}, ${city || null}, ${country || 'IN'}, ${address || null}, ${street || null}, ${postal_code || null}, ${region || null}, ${tax_id || null}, ${gst_number || null}, ${pan || null}, ${cin || null}, ${phone || null}, ${email || null}, ${website || null}, ${legal_form || null}, ${registration_number || null}, ${description || null}, ${fiscal_calendar_code || 'K4'}, ${posting_period_variant_code || '1000'})
            ON CONFLICT DO NOTHING RETURNING id, code, name
          `);
        } catch (fiscalErr: any) {
          // Column fiscal_calendar_code or posting_period_variant_code may not exist yet – fallback without it
          if (fiscalErr.message?.includes('fiscal_calendar_code') || fiscalErr.message?.includes('posting_period_variant_code')) {
            try {
              res = await db.execute(sql`
                INSERT INTO org_legal_entity (tenant_id, company_group_id, code, name, currency_code, city, country, address, street, postal_code, region, tax_id, gst_number, pan, cin, phone, email, website, legal_form, registration_number, description, fiscal_calendar_code)
                VALUES (${tenantId}, ${cgId || null}, ${code}, ${name}, ${currency_code || 'INR'}, ${city || null}, ${country || 'IN'}, ${address || null}, ${street || null}, ${postal_code || null}, ${region || null}, ${tax_id || null}, ${gst_number || null}, ${pan || null}, ${cin || null}, ${phone || null}, ${email || null}, ${website || null}, ${legal_form || null}, ${registration_number || null}, ${description || null}, ${fiscal_calendar_code || 'K4'})
                ON CONFLICT DO NOTHING RETURNING id, code, name
              `);
            } catch {
              res = await db.execute(sql`
                INSERT INTO org_legal_entity (tenant_id, company_group_id, code, name, currency_code, city, country, address, street, postal_code, region, tax_id, gst_number, pan, cin, phone, email, website, legal_form, registration_number, description)
                VALUES (${tenantId}, ${cgId || null}, ${code}, ${name}, ${currency_code || 'INR'}, ${city || null}, ${country || 'IN'}, ${address || null}, ${street || null}, ${postal_code || null}, ${region || null}, ${tax_id || null}, ${gst_number || null}, ${pan || null}, ${cin || null}, ${phone || null}, ${email || null}, ${website || null}, ${legal_form || null}, ${registration_number || null}, ${description || null})
                ON CONFLICT DO NOTHING RETURNING id, code, name
              `);
            }
            // Also try to create assignment to fiscal calendar and posting period if tables exist
            try {
              if (fiscal_calendar_code) {
                await db.execute(sql`INSERT INTO org_legal_entity_fiscal_assign (legal_entity_id, fiscal_calendar_code) VALUES (${res.rows[0]?.id}, ${fiscal_calendar_code}) ON CONFLICT DO NOTHING`).catch(()=>{});
              }
              if (posting_period_variant_code) {
                await db.execute(sql`INSERT INTO org_legal_entity_posting_assign (legal_entity_id, posting_period_variant_code) VALUES (${res.rows[0]?.id}, ${posting_period_variant_code}) ON CONFLICT DO NOTHING`).catch(()=>{});
              }
            } catch {}
          } else {
            throw fiscalErr;
          }
        }
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
