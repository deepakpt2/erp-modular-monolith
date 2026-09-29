import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * HR Position API – Legal-safe own IP – Module 9 HR Foundation
 * New: hr_position_new (was hr_position) – code POS-1000, name, organizationUnitId was org_unit_id, description, isManager, isOwner, isActive
 * Helper code: HPOC HR Position Create (alias POC, PO13, FIN-HR-PO-CR) – 4-char MOOA H=HR PO=Position C=Create
 * Fallback to legacy hr_position
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const orgUnitId = searchParams.get('orgUnitId') || searchParams.get('organizationUnitId');

  try {
    let rows: any[] = [];
    let table = 'hr_position_new';
    let legalSafe = true;
    let dbSource = 'db-new';

    try {
      let query = sql`
        SELECT p.id, p.code, p.name, p.organization_unit_id, p.description, p.is_manager, p.is_owner, p.is_active, p.created_at,
               ou.code as org_unit_code, ou.name as org_unit_name,
               (SELECT COUNT(*) FROM hr_employee_master WHERE position_id = p.id) as employee_count
        FROM hr_position_new p
        LEFT JOIN hr_organization_unit ou ON p.organization_unit_id = ou.id
        WHERE 1=1
      `;
      if (search) query = sql`${query} AND (p.code ILIKE ${`%${search}%`} OR p.name ILIKE ${`%${search}%`})`;
      if (orgUnitId) query = sql`${query} AND p.organization_unit_id = ${orgUnitId}`;
      query = sql`${query} ORDER BY p.code LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('hr_position_new not yet fallback hr_position:', newErr.message);
      dbSource = 'db-legacy';
      table = 'hr_position';
      legalSafe = false;
      let query = sql`
        SELECT p.id, p.code, p.name, p.org_unit_id as organization_unit_id, p.description, p.is_manager, p.is_owner, p.is_active, p.created_at,
               ou.code as org_unit_code, ou.name as org_unit_name,
               (SELECT COUNT(*) FROM hr_employee WHERE position_id = p.id) as employee_count
        FROM hr_position p
        LEFT JOIN hr_org_unit ou ON p.org_unit_id = ou.id
        WHERE 1=1
      `;
      if (search) query = sql`${query} AND (p.code ILIKE ${`%${search}%`} OR p.name ILIKE ${`%${search}%`})`;
      if (orgUnitId) query = sql`${query} AND p.org_unit_id = ${orgUnitId}`;
      query = sql`${query} ORDER BY p.code LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    }

    return NextResponse.json({
      data: rows,
      positions: rows,
      count: rows.length,
      code: 'HPOC',
      aliasCodes: ['POC', 'PO13', 'FIN-HR-PO-CR'],
      helperCode: 'HPOC',
      table,
      source: dbSource,
      legalSafe,
      functionDescription: 'HR Position – HPOC legal-safe own IP (was PO13) – code POS-1000, name, organizationUnitId was org_unit_id, isManager, isOwner, isActive',
      explanation: 'HR position legal-safe hr_position_new – code POS-1000, name, organizationUnitId was org_unit_id, description, isManager, isOwner, isActive – Code HPOC primary alias POC/PO13 – 4-char MOOA H=HR PO=Position C=Create – module grouped intuitive – fresh empty but org unit kept.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { code, name, organization_unit_id, org_unit_id, description, is_manager, is_owner } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    const orgUnitIdResolved = organization_unit_id || org_unit_id;
    if (!orgUnitIdResolved) return NextResponse.json({ error: 'organization_unit_id or org_unit_id required' }, { status: 400 });

    try {
      const res = await db.execute(sql`
        INSERT INTO hr_position_new (code, name, organization_unit_id, org_unit_id, description, is_manager, is_owner)
        VALUES (${code.toUpperCase()}, ${name}, ${orgUnitIdResolved}, ${orgUnitIdResolved}, ${description || null}, ${is_manager || false}, ${is_owner || false})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}, is_manager = ${is_manager || false}, is_owner = ${is_owner || false}
        RETURNING id, code, name
      `);
      return NextResponse.json({ success: true, position: res.rows[0], code: 'HPOC', message: `HR Position ${code.toUpperCase()} created – HPOC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('hr_position_new insert failed fallback:', newErr.message);
      try {
        const res = await db.execute(sql`
          INSERT INTO hr_position (code, name, org_unit_id, description, is_manager, is_owner)
          VALUES (${code.toUpperCase()}, ${name}, ${orgUnitIdResolved}, ${description || null}, ${is_manager || false}, ${is_owner || false})
          ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}
          RETURNING id, code, name
        `);
        return NextResponse.json({ success: true, position: res.rows[0], message: `HR Position ${code.toUpperCase()} created – PO13 legacy`, legalSafe: false });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
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
    const { id, code, name, description, is_active, is_manager, is_owner } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE hr_position_new SET name = COALESCE(${name}, name), description = COALESCE(${description}, description), is_active = COALESCE(${is_active}, is_active), is_manager = COALESCE(${is_manager}, is_manager), is_owner = COALESCE(${is_owner}, is_owner) WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE hr_position_new SET name = COALESCE(${name}, name), description = COALESCE(${description}, description), is_active = COALESCE(${is_active}, is_active), is_manager = COALESCE(${is_manager}, is_manager), is_owner = COALESCE(${is_owner}, is_owner) WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) throw new Error('Not found');
      return NextResponse.json({ success: true, position: res.rows[0], code: 'HPOC', message: `HR Position ${res.rows[0].code} updated – HPOC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE hr_position SET name = COALESCE(${name}, name), description = COALESCE(${description}, description), is_active = COALESCE(${is_active}, is_active), is_manager = COALESCE(${is_manager}, is_manager), is_owner = COALESCE(${is_owner}, is_owner) WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE hr_position SET name = COALESCE(${name}, name), description = COALESCE(${description}, description), is_active = COALESCE(${is_active}, is_active), is_manager = COALESCE(${is_manager}, is_manager), is_owner = COALESCE(${is_owner}, is_owner) WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'HR Position not found' }, { status: 404 });
      return NextResponse.json({ success: true, position: res.rows[0], message: `HR Position ${res.rows[0].code} updated – PO13 legacy` });
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
      if (id) await db.execute(sql`DELETE FROM hr_position_new WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM hr_position_new WHERE code = ${code?.toUpperCase()}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM hr_position WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM hr_position WHERE code = ${code?.toUpperCase()}`);
    }

    return NextResponse.json({ success: true, code: 'HPOC', message: `HR Position ${code || id} deleted – HPOC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
