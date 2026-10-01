import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Company Relationships – FCRL own IP – Foundation Company Relationship – NEW OWN CODE – alias ELEC (legacy OX02), EFCC (legacy OX10), OX08, OX16, OB62, OB37, FPPC (legacy OBBO), OBC4
 * Implements company/legal entity/company code relationships – company groups, legal entities, company codes, plants, business area, segment, sales org, purchasing org, controlling area, inter-company – own IP
 * For large org multi-sector, critical – sector-wise reporting, profit center, business area, company code grouping, consolidation, transfer pricing
 * Tables: fin_business_area, fin_segment, fin_sales_org, fin_purchasing_org, fin_controlling_area, fin_intercompany, plus existing org_legal_entity, org_company_code, org_facility
 * Makes data available in DB for now – modules will be modified to use these data as they are reworked – per user request
 */

async function ensureTables() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_business_area (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(50) NOT NULL UNIQUE,
        name varchar(200) NOT NULL,
        company_code varchar(20),
        description text,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_segment (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(50) NOT NULL UNIQUE,
        name varchar(200) NOT NULL,
        description text,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_sales_org (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(50) NOT NULL UNIQUE,
        name varchar(200) NOT NULL,
        company_code varchar(20) NOT NULL,
        description text,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_purchasing_org (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(50) NOT NULL UNIQUE,
        name varchar(200) NOT NULL,
        company_code varchar(20) NOT NULL,
        description text,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_controlling_area (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(50) NOT NULL UNIQUE,
        name varchar(200) NOT NULL,
        description text,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_intercompany (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        from_company_code varchar(20) NOT NULL,
        to_company_code varchar(20) NOT NULL,
        clearing_account varchar(50) NOT NULL,
        description text,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW(),
        UNIQUE(from_company_code, to_company_code)
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_company_code_assignment (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_code varchar(20) NOT NULL,
        controlling_area varchar(50),
        credit_control_area varchar(50),
        chart_of_accounts varchar(50),
        fiscal_year_variant varchar(10),
        posting_period_variant varchar(50),
        field_status_variant varchar(50),
        business_area varchar(50),
        sales_org varchar(50),
        purchasing_org varchar(50),
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW(),
        UNIQUE(company_code)
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_plant_assignment (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        plant_code varchar(50) NOT NULL,
        company_code varchar(20) NOT NULL,
        purchasing_org varchar(50),
        sales_org varchar(50),
        business_area varchar(50),
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW(),
        UNIQUE(plant_code)
      )
    `);
  } catch (e: any) {
    console.warn('Ensure company relationships tables failed:', e.message);
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  await ensureTables();

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all'; // business_area, segment, sales_org, purchasing_org, controlling_area, intercompany, company_assignment, plant_assignment, all

    const result: any = {};

    if (type === 'all' || type === 'business_area') {
      const res = await db.execute(sql`SELECT * FROM fin_business_area ORDER BY code`);
      result.business_areas = res.rows;
    }
    if (type === 'all' || type === 'segment') {
      const res = await db.execute(sql`SELECT * FROM fin_segment ORDER BY code`);
      result.segments = res.rows;
    }
    if (type === 'all' || type === 'sales_org') {
      const res = await db.execute(sql`SELECT * FROM fin_sales_org ORDER BY code`);
      result.sales_orgs = res.rows;
    }
    if (type === 'all' || type === 'purchasing_org') {
      const res = await db.execute(sql`SELECT * FROM fin_purchasing_org ORDER BY code`);
      result.purchasing_orgs = res.rows;
    }
    if (type === 'all' || type === 'controlling_area') {
      const res = await db.execute(sql`SELECT * FROM fin_controlling_area ORDER BY code`);
      result.controlling_areas = res.rows;
    }
    if (type === 'all' || type === 'intercompany') {
      const res = await db.execute(sql`SELECT * FROM fin_intercompany ORDER BY from_company_code, to_company_code`);
      result.intercompany = res.rows;
    }
    if (type === 'all' || type === 'company_assignment') {
      const res = await db.execute(sql`SELECT * FROM fin_company_code_assignment ORDER BY company_code`);
      result.company_assignments = res.rows;
    }
    if (type === 'all' || type === 'plant_assignment') {
      const res = await db.execute(sql`SELECT * FROM fin_plant_assignment ORDER BY plant_code`);
      result.plant_assignments = res.rows;
    }

    // Also get existing company codes, legal entities, plants for reference
    try {
      const compRes = await db.execute(sql`SELECT code, name FROM org_company_code ORDER BY code LIMIT 100`);
      result.company_codes = compRes.rows;
    } catch {}
    try {
      const plantRes = await db.execute(sql`SELECT code, name FROM org_facility ORDER BY code LIMIT 100`);
      result.plants = plantRes.rows;
    } catch {}

    return NextResponse.json({
      success: true,
      data: result,
      code: 'FCRL',
      aliasCodes: ['OX02', 'OX10', 'OX08', 'OX16', 'OB62', 'OB37', 'OBBO', 'OBC4'],
      message: `Company relationships – FCRL own IP – ${Object.keys(result).length} types – business_area, segment, sales_org, purchasing_org, controlling_area, intercompany, company_assignment, plant_assignment – for large org multi-sector – data available in DB – modules will use as reworked – industry standard`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  await ensureTables();

  try {
    const body = await req.json();
    const { type, code, name, company_code, from_company_code, to_company_code, clearing_account, controlling_area, credit_control_area, chart_of_accounts, fiscal_year_variant, posting_period_variant, field_status_variant, business_area, sales_org, purchasing_org, plant_code, description } = body;

    if (!type) return NextResponse.json({ error: 'type required – business_area, segment, sales_org, purchasing_org, controlling_area, intercompany, company_assignment, plant_assignment' }, { status: 400 });

    if (type === 'business_area') {
      if (!code || !name) return NextResponse.json({ error: 'code and name required for business_area' }, { status: 400 });
      const res = await db.execute(sql`
        INSERT INTO fin_business_area (code, name, company_code, description)
        VALUES (${code.toUpperCase()}, ${name}, ${company_code || null}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, company_code = ${company_code || null}, description = ${description || null}, updated_at = NOW()
        RETURNING *
      `);
      return NextResponse.json({ success: true, data: res.rows[0], code: 'FCRL', message: `Business Area ${code} created – FCRL own IP – sector-wise reporting – e.g., BA01 Spices, BA02 Foods` });
    }

    if (type === 'segment') {
      if (!code || !name) return NextResponse.json({ error: 'code and name required for segment' }, { status: 400 });
      const res = await db.execute(sql`
        INSERT INTO fin_segment (code, name, description)
        VALUES (${code.toUpperCase()}, ${name}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}, updated_at = NOW()
        RETURNING *
      `);
      return NextResponse.json({ success: true, data: res.rows[0], code: 'FCRL', message: `Segment ${code} created – FCRL own IP – segment reporting – e.g., SEG01 Spices, SEG02 Foods` });
    }

    if (type === 'sales_org') {
      if (!code || !name || !company_code) return NextResponse.json({ error: 'code, name, company_code required for sales_org' }, { status: 400 });
      const res = await db.execute(sql`
        INSERT INTO fin_sales_org (code, name, company_code, description)
        VALUES (${code.toUpperCase()}, ${name}, ${company_code}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, company_code = ${company_code}, description = ${description || null}, updated_at = NOW()
        RETURNING *
      `);
      return NextResponse.json({ success: true, data: res.rows[0], code: 'FCRL', message: `Sales Org ${code} created – FCRL own IP – company_code ${company_code} – e.g., SO01 Spices Sales` });
    }

    if (type === 'purchasing_org') {
      if (!code || !name || !company_code) return NextResponse.json({ error: 'code, name, company_code required for purchasing_org' }, { status: 400 });
      const res = await db.execute(sql`
        INSERT INTO fin_purchasing_org (code, name, company_code, description)
        VALUES (${code.toUpperCase()}, ${name}, ${company_code}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, company_code = ${company_code}, description = ${description || null}, updated_at = NOW()
        RETURNING *
      `);
      return NextResponse.json({ success: true, data: res.rows[0], code: 'FCRL', message: `Purchasing Org ${code} created – FCRL own IP – company_code ${company_code} – e.g., PO01 Spices Purchasing` });
    }

    if (type === 'controlling_area') {
      if (!code || !name) return NextResponse.json({ error: 'code and name required for controlling_area' }, { status: 400 });
      const res = await db.execute(sql`
        INSERT INTO fin_controlling_area (code, name, description)
        VALUES (${code.toUpperCase()}, ${name}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}, updated_at = NOW()
        RETURNING *
      `);
      return NextResponse.json({ success: true, data: res.rows[0], code: 'FCRL', message: `Controlling Area ${code} created – FCRL own IP – e.g., CA01 Controlling – company code 1000→CA01` });
    }

    if (type === 'intercompany') {
      if (!from_company_code || !to_company_code || !clearing_account) return NextResponse.json({ error: 'from_company_code, to_company_code, clearing_account required for intercompany' }, { status: 400 });
      const res = await db.execute(sql`
        INSERT INTO fin_intercompany (from_company_code, to_company_code, clearing_account, description)
        VALUES (${from_company_code}, ${to_company_code}, ${clearing_account}, ${description || null})
        ON CONFLICT (from_company_code, to_company_code) DO UPDATE SET clearing_account = ${clearing_account}, description = ${description || null}, updated_at = NOW()
        RETURNING *
      `);
      return NextResponse.json({ success: true, data: res.rows[0], code: 'FCRL', message: `Intercompany ${from_company_code}→${to_company_code} created – clearing ${clearing_account} – e.g., 1000→1100 clearing 1600000001 – for STO and inter-company billing` });
    }

    if (type === 'company_assignment') {
      if (!company_code) return NextResponse.json({ error: 'company_code required for company_assignment' }, { status: 400 });
      const res = await db.execute(sql`
        INSERT INTO fin_company_code_assignment (company_code, controlling_area, credit_control_area, chart_of_accounts, fiscal_year_variant, posting_period_variant, field_status_variant, business_area, sales_org, purchasing_org)
        VALUES (${company_code}, ${controlling_area || null}, ${credit_control_area || null}, ${chart_of_accounts || null}, ${fiscal_year_variant || null}, ${posting_period_variant || null}, ${field_status_variant || null}, ${business_area || null}, ${sales_org || null}, ${purchasing_org || null})
        ON CONFLICT (company_code) DO UPDATE SET controlling_area = ${controlling_area || null}, credit_control_area = ${credit_control_area || null}, chart_of_accounts = ${chart_of_accounts || null}, fiscal_year_variant = ${fiscal_year_variant || null}, posting_period_variant = ${posting_period_variant || null}, field_status_variant = ${field_status_variant || null}, business_area = ${business_area || null}, sales_org = ${sales_org || null}, purchasing_org = ${purchasing_org || null}, updated_at = NOW()
        RETURNING *
      `);
      return NextResponse.json({ success: true, data: res.rows[0], code: 'FCRL', message: `Company Code Assignment ${company_code} created – FCRL own IP – controlling_area ${controlling_area}, credit_control_area ${credit_control_area}, chart ${chart_of_accounts}, fiscal ${fiscal_year_variant}, posting period ${posting_period_variant}, field status ${field_status_variant}, business_area ${business_area}, sales_org ${sales_org}, purchasing_org ${purchasing_org} – T0 BLOCKING – must exist before ELEC` });
    }

    if (type === 'plant_assignment') {
      if (!plant_code || !company_code) return NextResponse.json({ error: 'plant_code and company_code required for plant_assignment' }, { status: 400 });
      const res = await db.execute(sql`
        INSERT INTO fin_plant_assignment (plant_code, company_code, purchasing_org, sales_org, business_area)
        VALUES (${plant_code}, ${company_code}, ${purchasing_org || null}, ${sales_org || null}, ${business_area || null})
        ON CONFLICT (plant_code) DO UPDATE SET company_code = ${company_code}, purchasing_org = ${purchasing_org || null}, sales_org = ${sales_org || null}, business_area = ${business_area || null}, updated_at = NOW()
        RETURNING *
      `);
      return NextResponse.json({ success: true, data: res.rows[0], code: 'FCRL', message: `Plant Assignment ${plant_code}→${company_code} created – FCRL own IP – purchasing_org ${purchasing_org}, sales_org ${sales_org}, business_area ${business_area} – plant must belong to company code – T0` });
    }

    return NextResponse.json({ error: `Unknown type ${type}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
