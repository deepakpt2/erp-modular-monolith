import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Control Area API - OX06 / OKKP - Industry Standard Module 1 & CO
 * Manages Controlling Area Definition with cross-company-code cost accounting,
 * currency type, fiscal year variant, chart of accounts, and cost center standard hierarchy.
 */

async function ensureControlAreaSchema() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS org_mgmt_control_area (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid,
      code varchar(20) NOT NULL,
      name varchar(100) NOT NULL,
      assignment_control varchar(1) DEFAULT '2',
      currency_type varchar(10) DEFAULT '10',
      currency_code varchar(3) DEFAULT 'INR',
      chart_of_accounts_code varchar(20),
      fiscal_year_variant varchar(10) DEFAULT 'V3',
      cost_center_standard_hierarchy varchar(30),
      description text,
      is_active boolean DEFAULT true,
      created_at timestamp DEFAULT NOW(),
      updated_at timestamp DEFAULT NOW()
    )
  `).catch(() => {});

  await db.execute(sql`ALTER TABLE org_mgmt_control_area ADD COLUMN IF NOT EXISTS assignment_control varchar(1) DEFAULT '2'`).catch(() => {});
  await db.execute(sql`ALTER TABLE org_mgmt_control_area ADD COLUMN IF NOT EXISTS currency_type varchar(10) DEFAULT '10'`).catch(() => {});
  await db.execute(sql`ALTER TABLE org_mgmt_control_area ADD COLUMN IF NOT EXISTS chart_of_accounts_code varchar(20)`).catch(() => {});
  await db.execute(sql`ALTER TABLE org_mgmt_control_area ADD COLUMN IF NOT EXISTS fiscal_year_variant varchar(10) DEFAULT 'V3'`).catch(() => {});
  await db.execute(sql`ALTER TABLE org_mgmt_control_area ADD COLUMN IF NOT EXISTS cost_center_standard_hierarchy varchar(30)`).catch(() => {});
  await db.execute(sql`ALTER TABLE org_mgmt_control_area ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`).catch(() => {});
  // Ensure a unique index exists on code so ON CONFLICT (code) or ON CONFLICT (tenant_id, code) works
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_org_control_area_code ON org_mgmt_control_area (code)`).catch(() => {});
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureControlAreaSchema();

  try {
    const result = await db.execute(sql`
      SELECT 
        id, code, name,
        assignment_control,
        currency_type,
        currency_code,
        chart_of_accounts_code,
        fiscal_year_variant,
        cost_center_standard_hierarchy,
        description,
        is_active,
        created_at,
        updated_at
      FROM org_mgmt_control_area 
      ORDER BY code
    `);

    return NextResponse.json({
      data: result.rows,
      controlAreas: result.rows,
      count: result.rows.length,
      helperCode: 'OX06',
      table: 'org_mgmt_control_area'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], controlAreas: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureControlAreaSchema();

  try {
    const body = await req.json();
    const { 
      code, 
      name, 
      assignment_control, 
      currency_type, 
      currency_code, 
      chart_of_accounts_code, 
      fiscal_year_variant, 
      cost_center_standard_hierarchy, 
      description, 
      tenant_id 
    } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'CONTROL_AREA_CODE and CONTROL_AREA_NAME are required' }, { status: 400 });
    }

    let tenantId = tenant_id;
    if (!tenantId) {
      const tr = await db.execute(sql`SELECT id FROM core_tenant LIMIT 1`);
      if (tr.rows.length) {
        tenantId = tr.rows[0].id;
      } else {
        const nt = await db.execute(sql`
          INSERT INTO core_tenant (code, name) 
          VALUES ('TEN-100', 'Main Tenant') 
          ON CONFLICT (code) DO UPDATE SET name='Main Tenant' 
          RETURNING id
        `);
        tenantId = nt.rows[0].id;
      }
    }

    const coCode = code.toUpperCase().trim();
    const assignCtrl = assignment_control || '2';
    const currType = currency_type || '10';
    const currCode = (currency_code || 'INR').toUpperCase().trim();
    const coaCode = chart_of_accounts_code ? chart_of_accounts_code.toUpperCase().trim() : null;
    const fyv = fiscal_year_variant ? fiscal_year_variant.toUpperCase().trim() : 'V3';
    const stdHierarchy = cost_center_standard_hierarchy ? cost_center_standard_hierarchy.toUpperCase().trim() : null;

    // Check if record exists first to ensure compatibility whether unique constraint is on (code) or (tenant_id, code)
    const existingCheck = await db.execute(sql`
      SELECT id FROM org_mgmt_control_area 
      WHERE UPPER(code) = ${coCode}
      LIMIT 1
    `);

    let res: any;
    if (existingCheck.rows.length > 0) {
      const existingId = (existingCheck.rows[0] as any).id;
      res = await db.execute(sql`
        UPDATE org_mgmt_control_area SET 
          tenant_id = COALESCE(${tenantId}, tenant_id),
          name = ${name},
          assignment_control = ${assignCtrl},
          currency_type = ${currType},
          currency_code = ${currCode},
          chart_of_accounts_code = ${coaCode},
          fiscal_year_variant = ${fyv},
          cost_center_standard_hierarchy = ${stdHierarchy},
          description = ${description || null},
          is_active = true,
          updated_at = NOW()
        WHERE id = ${existingId}
        RETURNING id, code, name, assignment_control, currency_type, currency_code, chart_of_accounts_code, fiscal_year_variant, cost_center_standard_hierarchy
      `);
    } else {
      try {
        res = await db.execute(sql`
          INSERT INTO org_mgmt_control_area (
            tenant_id, code, name, assignment_control, currency_type, currency_code,
            chart_of_accounts_code, fiscal_year_variant, cost_center_standard_hierarchy,
            description, is_active, updated_at
          ) VALUES (
            ${tenantId}, ${coCode}, ${name}, ${assignCtrl}, ${currType}, ${currCode},
            ${coaCode}, ${fyv}, ${stdHierarchy},
            ${description || null}, true, NOW()
          )
          RETURNING id, code, name, assignment_control, currency_type, currency_code, chart_of_accounts_code, fiscal_year_variant, cost_center_standard_hierarchy
        `);
      } catch (insertErr: any) {
        // Fallback in case of race condition / unique collision
        res = await db.execute(sql`
          UPDATE org_mgmt_control_area SET 
            name = ${name},
            assignment_control = ${assignCtrl},
            currency_type = ${currType},
            currency_code = ${currCode},
            chart_of_accounts_code = ${coaCode},
            fiscal_year_variant = ${fyv},
            cost_center_standard_hierarchy = ${stdHierarchy},
            description = ${description || null},
            is_active = true,
            updated_at = NOW()
          WHERE UPPER(code) = ${coCode}
          RETURNING id, code, name, assignment_control, currency_type, currency_code, chart_of_accounts_code, fiscal_year_variant, cost_center_standard_hierarchy
        `);
      }
    }

    return NextResponse.json({
      success: true,
      controlArea: res.rows[0],
      data: res.rows[0],
      message: `Control Area ${coCode} successfully saved (OX06 / OKKP)`
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureControlAreaSchema();

  try {
    const body = await req.json();
    const { 
      id, 
      code, 
      name, 
      assignment_control, 
      currency_type, 
      currency_code, 
      chart_of_accounts_code, 
      fiscal_year_variant, 
      cost_center_standard_hierarchy, 
      description, 
      is_active 
    } = body;

    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    const coCode = code ? code.toUpperCase().trim() : null;
    const coaCode = chart_of_accounts_code ? chart_of_accounts_code.toUpperCase().trim() : undefined;
    const fyv = fiscal_year_variant ? fiscal_year_variant.toUpperCase().trim() : undefined;
    const stdHierarchy = cost_center_standard_hierarchy ? cost_center_standard_hierarchy.toUpperCase().trim() : undefined;

    let res;
    if (id) {
      res = await db.execute(sql`
        UPDATE org_mgmt_control_area SET 
          code = COALESCE(${coCode}, code),
          name = COALESCE(${name}, name),
          assignment_control = COALESCE(${assignment_control}, assignment_control),
          currency_type = COALESCE(${currency_type}, currency_type),
          currency_code = COALESCE(${currency_code}, currency_code),
          chart_of_accounts_code = COALESCE(${coaCode}, chart_of_accounts_code),
          fiscal_year_variant = COALESCE(${fyv}, fiscal_year_variant),
          cost_center_standard_hierarchy = COALESCE(${stdHierarchy}, cost_center_standard_hierarchy),
          description = COALESCE(${description}, description),
          is_active = COALESCE(${is_active}, is_active),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, code, name
      `);
    } else {
      res = await db.execute(sql`
        UPDATE org_mgmt_control_area SET 
          name = COALESCE(${name}, name),
          assignment_control = COALESCE(${assignment_control}, assignment_control),
          currency_type = COALESCE(${currency_type}, currency_type),
          currency_code = COALESCE(${currency_code}, currency_code),
          chart_of_accounts_code = COALESCE(${coaCode}, chart_of_accounts_code),
          fiscal_year_variant = COALESCE(${fyv}, fiscal_year_variant),
          cost_center_standard_hierarchy = COALESCE(${stdHierarchy}, cost_center_standard_hierarchy),
          description = COALESCE(${description}, description),
          is_active = COALESCE(${is_active}, is_active),
          updated_at = NOW()
        WHERE UPPER(code) = ${coCode}
        RETURNING id, code, name
      `);
    }

    if (res.rows.length === 0) return NextResponse.json({ error: 'Control Area not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: res.rows[0], message: `Control Area ${res.rows[0].code} updated` });
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
      res = await db.execute(sql`DELETE FROM org_mgmt_control_area WHERE id = ${id} RETURNING code`);
    } else {
      res = await db.execute(sql`DELETE FROM org_mgmt_control_area WHERE UPPER(code) = ${(code || '').toUpperCase().trim()} RETURNING code`);
    }

    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `Control Area ${res.rows[0].code} deleted`, deleted: res.rows[0].code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
