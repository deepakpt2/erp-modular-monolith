import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Commercial Org API - OVX2 - Industry Standard Module 1 & SD
 * Pure definition of Sales Organization / Commercial Organization (TVKO).
 * Company Code assignment is handled via OVX3 (org_sales_company_assignment).
 */

async function ensureCommercialOrgSchema() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS org_commercial_org (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid,
      legal_entity_id uuid,
      code varchar(20) NOT NULL UNIQUE,
      name varchar(100) NOT NULL,
      currency_code varchar(3) DEFAULT 'INR',
      description text,
      is_active boolean DEFAULT true,
      created_at timestamp DEFAULT NOW(),
      updated_at timestamp DEFAULT NOW()
    )
  `).catch(() => {});

  await db.execute(sql`ALTER TABLE org_commercial_org ALTER COLUMN legal_entity_id DROP NOT NULL`).catch(() => {});
  await db.execute(sql`ALTER TABLE org_commercial_org ADD COLUMN IF NOT EXISTS currency_code varchar(3) DEFAULT 'INR'`).catch(() => {});
  await db.execute(sql`ALTER TABLE org_commercial_org ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`).catch(() => {});
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureCommercialOrgSchema();

  try {
    const result = await db.execute(sql`
      SELECT 
        id, code, name, currency_code, description, is_active, created_at, updated_at
      FROM org_commercial_org 
      ORDER BY code
    `);
    return NextResponse.json({
      data: result.rows,
      commercialOrgs: result.rows,
      count: result.rows.length,
      helperCode: 'OVX2',
      table: 'org_commercial_org'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], commercialOrgs: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureCommercialOrgSchema();

  try {
    const body = await req.json();
    const { code, name, description, tenant_id, currency_code, legal_entity_id, legal_entity_code } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'COMMERCIAL_ORG_CODE and COMMERCIAL_ORG_NAME are required' }, { status: 400 });
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

    let leId = legal_entity_id || null;
    if (!leId && legal_entity_code) {
      const ler = await db.execute(sql`SELECT id FROM org_legal_entity WHERE UPPER(code) = ${legal_entity_code.toUpperCase().trim()} LIMIT 1`);
      if (ler.rows.length) leId = ler.rows[0].id;
    }

    const coCode = code.toUpperCase().trim();
    const curr = (currency_code || 'INR').toUpperCase().trim();

    // Check if record exists first to prevent constraint collision
    const existingCheck = await db.execute(sql`
      SELECT id FROM org_commercial_org WHERE UPPER(code) = ${coCode} LIMIT 1
    `);

    let res: any;
    if (existingCheck.rows.length > 0) {
      const existingId = (existingCheck.rows[0] as any).id;
      res = await db.execute(sql`
        UPDATE org_commercial_org SET 
          tenant_id = COALESCE(${tenantId}, tenant_id),
          name = ${name},
          currency_code = ${curr},
          description = ${description || null},
          legal_entity_id = COALESCE(${leId}, legal_entity_id),
          is_active = true,
          updated_at = NOW()
        WHERE id = ${existingId}
        RETURNING id, code, name, currency_code
      `);
    } else {
      res = await db.execute(sql`
        INSERT INTO org_commercial_org (tenant_id, legal_entity_id, code, name, currency_code, description, is_active, updated_at) 
        VALUES (${tenantId}, ${leId}, ${coCode}, ${name}, ${curr}, ${description || null}, true, NOW()) 
        RETURNING id, code, name, currency_code
      `);
    }

    return NextResponse.json({
      success: true,
      commercialOrg: res.rows[0],
      data: res.rows[0],
      message: `Commercial Org ${coCode} saved (OVX2)`
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureCommercialOrgSchema();

  try {
    const body = await req.json();
    const { id, code, name, description, currency_code, is_active } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    const coCode = code ? code.toUpperCase().trim() : null;
    const curr = currency_code ? currency_code.toUpperCase().trim() : undefined;

    let res;
    if (id) {
      res = await db.execute(sql`
        UPDATE org_commercial_org SET 
          code = COALESCE(${coCode}, code), 
          name = COALESCE(${name ?? null}, name), 
          currency_code = COALESCE(${curr}, currency_code), 
          description = COALESCE(${description ?? null}, description), 
          is_active = COALESCE(${is_active ?? null}, is_active), 
          updated_at = NOW() 
        WHERE id = ${id} 
        RETURNING id, code, name, currency_code
      `);
    } else {
      res = await db.execute(sql`
        UPDATE org_commercial_org SET 
          name = COALESCE(${name ?? null}, name), 
          currency_code = COALESCE(${curr}, currency_code), 
          description = COALESCE(${description ?? null}, description), 
          is_active = COALESCE(${is_active ?? null}, is_active), 
          updated_at = NOW() 
        WHERE UPPER(code) = ${coCode} 
        RETURNING id, code, name, currency_code
      `);
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
      res = await db.execute(sql`DELETE FROM org_commercial_org WHERE UPPER(code) = ${(code || '').toUpperCase().trim()} RETURNING code`);
    }
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `Commercial Org ${res.rows[0].code} deleted`, deleted: res.rows[0].code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
