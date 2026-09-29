import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * HR Org Unit API – Legal-safe own IP – Module 9 HR Foundation
 * New: hr_organization_unit (was hr_org_unit) – code OU-1000, name, parentId, facilityId FAC-1000 was plant_id, description, isActive
 * Helper code: HOUC HR Org Unit Create (alias OUC, PP01, FIN-HR-OU-CR) – 4-char MOOA H=HR OU=OrgUnit C=Create – module grouped intuitive
 * Fallback to legacy hr_org_unit
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';

  try {
    let rows: any[] = [];
    let table = 'hr_organization_unit';
    let legalSafe = true;
    let dbSource = 'db-new';

    try {
      let query = sql`
        SELECT ou.id, ou.code, ou.name, ou.parent_id, ou.description, ou.is_active, ou.created_at,
               f.code as facility_code, f.name as facility_name,
               (SELECT COUNT(*) FROM hr_position_new WHERE organization_unit_id = ou.id) as position_count,
               (SELECT COUNT(*) FROM hr_employee_master WHERE position_id IN (SELECT id FROM hr_position_new WHERE organization_unit_id = ou.id)) as employee_count
        FROM hr_organization_unit ou
        LEFT JOIN org_facility f ON ou.facility_id = f.id
        WHERE 1=1
      `;
      if (search) query = sql`${query} AND (ou.code ILIKE ${`%${search}%`} OR ou.name ILIKE ${`%${search}%`})`;
      query = sql`${query} ORDER BY ou.code LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('hr_organization_unit not yet fallback hr_org_unit:', newErr.message);
      dbSource = 'db-legacy';
      table = 'hr_org_unit';
      legalSafe = false;
      let query = sql`
        SELECT ou.id, ou.code, ou.name, ou.parent_id, ou.description, ou.is_active, ou.created_at,
               p.code as facility_code, p.name as facility_name,
               (SELECT COUNT(*) FROM hr_position WHERE org_unit_id = ou.id) as position_count,
               (SELECT COUNT(*) FROM hr_employee WHERE position_id IN (SELECT id FROM hr_position WHERE org_unit_id = ou.id)) as employee_count
        FROM hr_org_unit ou
        LEFT JOIN ent_plant p ON ou.plant_id = p.id
        WHERE 1=1
      `;
      if (search) query = sql`${query} AND (ou.code ILIKE ${`%${search}%`} OR ou.name ILIKE ${`%${search}%`})`;
      query = sql`${query} ORDER BY ou.code LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    }

    return NextResponse.json({
      data: rows,
      orgUnits: rows,
      count: rows.length,
      code: 'HOUC',
      aliasCodes: ['OUC', 'PP01', 'FIN-HR-OU-CR'],
      helperCode: 'HOUC',
      table,
      source: dbSource,
      legalSafe,
      functionDescription: 'HR Org Unit – HOUC legal-safe own IP (was PP01) – code OU-1000, name, parentId, facilityId FAC-1000 was plant_id, description, isActive',
      explanation: 'HR org unit legal-safe hr_organization_unit – code OU-1000, name, parentId, facilityId FAC-1000 was plant_id, description, isActive – Code HOUC primary alias OUC/PP01 – 4-char MOOA H=HR OU=OrgUnit C=Create – module grouped intuitive, same length as PP01 but own IP – fresh empty but facility kept.',
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
    const { code, name, parent_id, facility_id, plant_id, description } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    let facilityIdResolved = facility_id || plant_id;
    if (!facilityIdResolved) {
      try {
        const f = await db.execute(sql`SELECT id FROM org_facility LIMIT 1`);
        if (f.rows.length > 0) facilityIdResolved = (f.rows[0] as any).id;
      } catch {}
    }

    try {
      const res = await db.execute(sql`
        INSERT INTO hr_organization_unit (code, name, parent_id, facility_id, plant_id, description)
        VALUES (${code.toUpperCase()}, ${name}, ${parent_id || null}, ${facilityIdResolved || null}, ${facilityIdResolved || null}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}
        RETURNING id, code, name
      `);
      return NextResponse.json({ success: true, orgUnit: res.rows[0], code: 'HOUC', message: `HR Org Unit ${code.toUpperCase()} created – HOUC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('hr_organization_unit insert failed fallback:', newErr.message);
      try {
        const res = await db.execute(sql`
          INSERT INTO hr_org_unit (code, name, parent_id, plant_id, description)
          VALUES (${code.toUpperCase()}, ${name}, ${parent_id || null}, ${facilityIdResolved || null}, ${description || null})
          ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}
          RETURNING id, code, name
        `);
        return NextResponse.json({ success: true, orgUnit: res.rows[0], message: `HR Org Unit ${code.toUpperCase()} created – PP01 legacy`, legalSafe: false });
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
    const { id, code, name, description, is_active } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE hr_organization_unit SET name = COALESCE(${name}, name), description = COALESCE(${description}, description), is_active = COALESCE(${is_active}, is_active) WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE hr_organization_unit SET name = COALESCE(${name}, name), description = COALESCE(${description}, description), is_active = COALESCE(${is_active}, is_active) WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) throw new Error('Not found');
      return NextResponse.json({ success: true, orgUnit: res.rows[0], code: 'HOUC', message: `HR Org Unit ${res.rows[0].code} updated – HOUC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE hr_org_unit SET name = COALESCE(${name}, name), description = COALESCE(${description}, description), is_active = COALESCE(${is_active}, is_active) WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE hr_org_unit SET name = COALESCE(${name}, name), description = COALESCE(${description}, description), is_active = COALESCE(${is_active}, is_active) WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'HR Org Unit not found' }, { status: 404 });
      return NextResponse.json({ success: true, orgUnit: res.rows[0], message: `HR Org Unit ${res.rows[0].code} updated – PP01 legacy` });
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
      if (id) await db.execute(sql`DELETE FROM hr_organization_unit WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM hr_organization_unit WHERE code = ${code?.toUpperCase()}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM hr_org_unit WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM hr_org_unit WHERE code = ${code?.toUpperCase()}`);
    }

    return NextResponse.json({ success: true, code: 'HOUC', message: `HR Org Unit ${code || id} deleted – HOUC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
