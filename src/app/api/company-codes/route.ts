import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Company Codes / Legal Entities API – Legal-safe own IP – Module 1 + Module 4 – Fixed for production
 * New: org_legal_entity (was org_legal_entity) – code LE-1000, name, currency_code INR default was KWD, country, city, coa_id was chart_id, legal_form, tax_id, gst_number, is_active – ELEC Legal Entity Create alias O02/ELEC (legacy OX02)
 * Fallback to legacy org_legal_entity
 * Also supports company-groups via org_company_group? Actually company group is separate
 * Returns both legal entities and company codes for backward compat
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'org_legal_entity';
    let legalSafe = true;

    try {
      // Ensure org_legal_entity table and required columns exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS org_legal_entity (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID,
          code VARCHAR(20) NOT NULL UNIQUE,
          name VARCHAR(150) NOT NULL,
          currency_code VARCHAR(3) DEFAULT 'INR',
          country_code VARCHAR(2) DEFAULT 'IN',
          city VARCHAR(100),
          chart_of_accounts_code VARCHAR(20) DEFAULT 'CA-IN-01',
          fiscal_year_variant VARCHAR(20) DEFAULT 'K4',
          field_status_variant VARCHAR(20) DEFAULT 'FFSV-1000',
          posting_period_variant VARCHAR(20) DEFAULT 'PPV-1000',
          credit_control_area VARCHAR(20) DEFAULT 'CRED-1000',
          address TEXT,
          street VARCHAR(200),
          postal_code VARCHAR(20),
          region VARCHAR(100),
          tax_id VARCHAR(50),
          gst_number VARCHAR(30),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      const result = await db.execute(sql`
        SELECT 
          le.id, le.code, le.name, le.currency_code, le.country_code as country, le.is_active,
          le.code as legal_entity_code, le.name as legal_entity_name,
          fc.code as coa_code, fc.name as coa_name,
          ct.code as client_code, ct.name as client_name,
          (SELECT COUNT(*) FROM org_facility WHERE legal_entity_id = le.id) as plant_count,
          (SELECT COUNT(*) FROM org_cost_unit WHERE legal_entity_id = le.id) as cost_center_count,
          (SELECT COUNT(*) FROM core_number_range WHERE (company_code = le.code OR company_code IS NULL)) as number_range_count
        FROM org_legal_entity le
        LEFT JOIN fin_chart fc ON fc.code = le.chart_of_accounts_code
        LEFT JOIN core_tenant ct ON le.tenant_id = ct.id
        ORDER BY le.code
      `);
      rows = result.rows as any[];
    } catch (newErr: any) {
      console.warn('org_legal_entity fetch note:', newErr.message);
      // Clean fallback: return empty list if table or column issue occurs on fresh setup
      rows = [];
      source = 'db-empty-fallback';
    }

    let fiscalVariants: any[] = [];
    let postingVariants: any[] = [];
    let creditControlAreas: any[] = [];
    let currencies: any[] = [];

    try {
      const fv = await db.execute(sql`SELECT code, name as description FROM fin_fiscal_calendar ORDER BY code`);
      fiscalVariants = fv.rows as any[];
    } catch {
      try {
        const fv = await db.execute(sql`SELECT code, description FROM fi_fiscal_year_variant ORDER BY code`);
        fiscalVariants = fv.rows as any[];
      } catch {}
    }
    try {
      const pv = await db.execute(sql`SELECT code, name FROM fin_posting_calendar ORDER BY code`);
      postingVariants = pv.rows as any[];
    } catch {
      try {
        const pv = await db.execute(sql`SELECT code, name FROM fin_posting_calendar ORDER BY code`);
        postingVariants = pv.rows as any[];
      } catch {}
    }
    try {
      const cca = await db.execute(sql`SELECT code, name as description FROM fin_credit_policy_area ORDER BY code`);
      creditControlAreas = cca.rows as any[];
    } catch {
      try {
        const cca = await db.execute(sql`SELECT code, description, currency FROM fi_credit_control_area ORDER BY code`);
        creditControlAreas = cca.rows as any[];
      } catch {}
    }
    try {
      const cur = await db.execute(sql`SELECT code, name, decimal_places, symbol, is_active FROM core_currency ORDER BY code`);
      currencies = cur.rows as any[];
    } catch {
      try {
        const cur = await db.execute(sql`SELECT code, name, decimal_places, symbol, is_active FROM core_currency ORDER BY code`);
        currencies = cur.rows as any[];
      } catch {}
    }

    return NextResponse.json({
      companyCodes: rows,
      legalEntities: rows,
      count: rows.length,
      code: 'ELEC',
      aliasCodes: ['O02', 'OX02', 'FIN-LE-CR'],
      helperCode: 'ELEC',
      table,
      source,
      legalSafe,
      fiscalYearVariants: fiscalVariants,
      postingPeriodVariants: postingVariants,
      creditControlAreas: creditControlAreas,
      currencies: currencies,
      defaultCurrency: 'INR',
      functionCodes: 'OX15 Company, ELEC (legacy OX02) Company Code / Legal Entity, OX16 Assign Company->Company Code, OB45 Credit Control Area, FCYC (legacy OY03) Currencies INR default',
      explanation: 'Legal Entity / Company Code legal-safe org_legal_entity (was org_legal_entity) – code LE-1000, name, currency_code INR default was KWD, country, city, coa_id was chart_id, is_active – ELEC primary alias O02/ELEC (legacy OX02) – 4-char MOOA E=Enterprise L=Legal E=Entity C=Create – module grouped intuitive – fallback new→legacy→minimal – never 500, returns empty if no tables.',
    });
  } catch (e: any) {
    console.error('Company codes API fatal:', e.message);
    // Never return 500 for home page – return empty with message
    return NextResponse.json({
      companyCodes: [],
      legalEntities: [],
      count: 0,
      code: 'ELEC',
      aliasCodes: ['O02', 'OX02'],
      helperCode: 'ELEC',
      table: 'org_legal_entity',
      source: 'error-fallback',
      legalSafe: true,
      error: e.message,
      message: 'Company codes fetch failed but returned empty to avoid 500 on home page – ELEC legal-safe – run db:init-prod',
    });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { code, name, currency_code, city, country, client_code, coa_code, address, street, postal_code, region, tax_id, gst_number, pan, cin, phone, email, website, legal_form, registration_number, tenant_code } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    // Try new org_legal_entity first
    try {
      let tenantId: string | null = null;
      if (tenant_code) {
        const tRes = await db.execute(sql`SELECT id FROM core_tenant WHERE code = ${tenant_code} LIMIT 1`);
        if (tRes.rows.length > 0) tenantId = (tRes.rows[0] as any).id;
      }
      if (!tenantId) {
        const tRes = await db.execute(sql`SELECT id FROM core_tenant WHERE code = 'TEN-100' LIMIT 1`);
        if (tRes.rows.length > 0) tenantId = (tRes.rows[0] as any).id;
        else {
          const newT = await db.execute(sql`INSERT INTO core_tenant (code, name) VALUES ('TEN-100', 'Main Tenant') ON CONFLICT (code) DO UPDATE SET name='Main Tenant' RETURNING id`);
          tenantId = (newT.rows[0] as any).id;
        }
      }

      let coaId: string | null = null;
      if (coa_code) {
        try {
          const coaRes = await db.execute(sql`SELECT id FROM fin_chart WHERE code = ${coa_code} LIMIT 1`);
          if (coaRes.rows.length > 0) coaId = (coaRes.rows[0] as any).id;
        } catch {
          try {
            const coaRes = await db.execute(sql`SELECT id FROM fin_chart WHERE code = ${coa_code} LIMIT 1`);
            if (coaRes.rows.length > 0) coaId = (coaRes.rows[0] as any).id;
          } catch {}
        }
      }

      const res = await db.execute(sql`
        INSERT INTO org_legal_entity (tenant_id, code, name, currency_code, country_code, city, chart_of_accounts_code, address, street, postal_code, region, tax_id, gst_number, is_active)
        VALUES (${tenantId}, ${code.toUpperCase()}, ${name}, ${currency_code || 'INR'}, ${country || 'IN'}, ${city || null}, ${coa_code || 'CA-IN-01'}, ${address || null}, ${street || null}, ${postal_code || null}, ${region || null}, ${tax_id || null}, ${gst_number || null}, true)
        ON CONFLICT (tenant_id, code) DO UPDATE SET name=${name}, currency_code=${currency_code || 'INR'}, country_code=${country || 'IN'}, city=${city || null}
        RETURNING id, code
      `);

      return NextResponse.json({ success: true, companyCode: res.rows[0], legalEntity: res.rows[0], code: 'ELEC', message: `Legal Entity ${code.toUpperCase()} created – ELEC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('org_legal_entity insert failed, fallback org_legal_entity:', newErr.message);
      // Fallback old
      let clientId: any = null;
      if (client_code) {
        const cRes = await db.execute(sql`SELECT id FROM core_tenant WHERE code = ${client_code} LIMIT 1`);
        if (cRes.rows.length > 0) clientId = (cRes.rows[0] as any).id;
      }
      if (!clientId) {
        const cRes = await db.execute(sql`SELECT id FROM core_tenant WHERE code = '100' LIMIT 1`);
        clientId = cRes.rows.length > 0 ? (cRes.rows[0] as any).id : null;
        if (!clientId) {
          const newClient = await db.execute(sql`INSERT INTO core_tenant (code, name) VALUES ('100', 'Main Client') ON CONFLICT (code) DO UPDATE SET name='Main Client' RETURNING id`);
          clientId = (newClient.rows[0] as any).id;
        }
      }

      let coaId: any = null;
      if (coa_code) {
        const coaRes = await db.execute(sql`SELECT id FROM fin_chart WHERE code = ${coa_code} LIMIT 1`);
        if (coaRes.rows.length > 0) coaId = (coaRes.rows[0] as any).id;
      }

      const res = await db.execute(sql`
        INSERT INTO org_legal_entity (client_id, code, name, currency_code, city, country, coa_id, address, street, postal_code, region, tax_id, gst_number, pan, cin, phone, email, website, legal_form, registration_number)
        VALUES (${clientId}, ${code}, ${name}, ${currency_code || 'INR'}, ${city || null}, ${country || 'IN'}, ${coaId}, ${address || null}, ${street || null}, ${postal_code || null}, ${region || null}, ${tax_id || null}, ${gst_number || null}, ${pan || null}, ${cin || null}, ${phone || null}, ${email || null}, ${website || null}, ${legal_form || null}, ${registration_number || null})
        ON CONFLICT (code) DO UPDATE SET name=${name}, currency_code=${currency_code || 'INR'}, city=${city || null}, country=${country || 'IN'}, updated_at=NOW()
        RETURNING id, code
      `);

      return NextResponse.json({ success: true, companyCode: res.rows[0], message: `Company Code ${code} created (ELEC (legacy OX02)) – legacy`, legalSafe: false });
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
    const { id, code, name, currency_code, city, country, is_active } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE org_legal_entity SET name=COALESCE(${name},name), currency_code=COALESCE(${currency_code},currency_code), country_code=COALESCE(${country},country_code), city=COALESCE(${city},city), is_active=COALESCE(${is_active},is_active) WHERE id=${id} RETURNING id, code`);
      else res = await db.execute(sql`UPDATE org_legal_entity SET name=COALESCE(${name},name), currency_code=COALESCE(${currency_code},currency_code), country_code=COALESCE(${country},country_code), city=COALESCE(${city},city), is_active=COALESCE(${is_active},is_active) WHERE code=${code.toUpperCase()} RETURNING id, code`);
      if (res.rows.length === 0) throw new Error('Not found in org_legal_entity');
      return NextResponse.json({ success: true, companyCode: res.rows[0], code: 'ELEC', message: `Legal Entity ${res.rows[0].code} updated – ELEC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE org_legal_entity SET name=COALESCE(${name},name), currency_code=COALESCE(${currency_code},currency_code), city=COALESCE(${city},city), country=COALESCE(${country},country), is_active=COALESCE(${is_active},is_active) WHERE id=${id} RETURNING id, code`);
      else res = await db.execute(sql`UPDATE org_legal_entity SET name=COALESCE(${name},name), currency_code=COALESCE(${currency_code},currency_code), city=COALESCE(${city},city), country=COALESCE(${country},country), is_active=COALESCE(${is_active},is_active) WHERE code=${code.toUpperCase()} RETURNING id, code`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Company code not found' }, { status: 404 });
      return NextResponse.json({ success: true, companyCode: res.rows[0], message: `Company Code ${res.rows[0].code} updated – legacy` });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const code = searchParams.get('code');
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM org_legal_entity WHERE id=${id}`);
      else await db.execute(sql`DELETE FROM org_legal_entity WHERE code=${code?.toUpperCase()}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM org_legal_entity WHERE id=${id}`);
      else await db.execute(sql`DELETE FROM org_legal_entity WHERE code=${code?.toUpperCase()}`);
    }

    return NextResponse.json({ success: true, code: 'ELEC', message: `Legal Entity ${code || id} deleted – ELEC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
