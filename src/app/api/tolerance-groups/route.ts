import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Tolerance Groups API – Legal-safe own IP – Module 4
 * New: fin_tolerance_group (was ent_tolerance_group) – type GL/EMPLOYEE/CUSTOMER/VENDOR/AP/AR, sample kept
 * Helper code: FTGC Tolerance Group Create (alias TGC, OBA4, FIN-TG-CR) – 4-char MOOA F=Financials, TG=ToleranceGroup, C=Create
 * Fallback to legacy ent_tolerance_group
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'fin_tolerance_group';
    let legalSafe = true;

    try {
      const res = await db.execute(sql`SELECT * FROM fin_tolerance_group ORDER BY code`);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('fin_tolerance_group not yet fallback ent_tolerance_group:', newErr.message);
      source = 'db-legacy';
      table = 'ent_tolerance_group';
      legalSafe = false;
      try {
        const res = await db.execute(sql`SELECT * FROM ent_tolerance_group ORDER BY code`);
        rows = res.rows as any[];
      } catch (e: any) {
        if (e.message?.includes('does not exist')) {
          return NextResponse.json({ data: [], toleranceGroups: [], count: 0, message: 'Table fin_tolerance_group not yet migrated – fresh empty Module 4', code: 'FTGC', aliasCodes: ['TGC','OBA4'], helperCode: 'FTGC', table: 'fin_tolerance_group', source: 'none', legalSafe: true });
        }
        throw e;
      }
    }

    return NextResponse.json({
      data: rows,
      toleranceGroups: rows,
      count: rows.length,
      code: 'FTGC',
      aliasCodes: ['TGC', 'OBA4', 'FIN-TG-CR'],
      helperCode: 'FTGC',
      table,
      source,
      legalSafe,
      functionDescription: 'Tolerance Groups – FTGC legal-safe own IP (was OBA4) – GL/EMPLOYEE/CUSTOMER/VENDOR/AP/AR – OBA0/O tolerance',
      erpDefaults: [
        { code: 'GL-01', type: 'GL', name: 'GL Tolerance – 10% 10000 INR', lower: 0, upper: 10000, helperCode: 'FTGC', note: 'Sample kept' },
        { code: 'EMP-01', type: 'EMPLOYEE', name: 'Employee Tolerance', helperCode: 'FTGC' },
        { code: 'VEND-01', type: 'VENDOR', name: 'Vendor Tolerance AP', helperCode: 'FTGC' },
        { code: 'CUST-01', type: 'CUSTOMER', name: 'Customer Tolerance AR', helperCode: 'FTGC' },
      ],
      explanation: 'Tolerance groups legal-safe fin_tolerance_group – type GL/EMPLOYEE/CUSTOMER/VENDOR/AP/AR – Code FTGC primary alias TGC/OBA4 – 4-char MOOA F=Financials TG=ToleranceGroup C=Create – module grouped intuitive – sample data kept for user convenience per requirement fresh empty but common sample data like coa, gl, tax, currencies, UoM kept.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], toleranceGroups: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { code, name, type, lower_limit, upper_limit, description } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    try {
      const res = await db.execute(sql`
        INSERT INTO fin_tolerance_group (code, name, type, lower_limit, upper_limit, description)
        VALUES (${code.toUpperCase()}, ${name}, ${type || 'GL'}::fin_tolerance_type, ${lower_limit || 0}, ${upper_limit || 0}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, type = ${type || 'GL'}::fin_tolerance_type, lower_limit = ${lower_limit || 0}, upper_limit = ${upper_limit || 0}, description = ${description || null}, updated_at = NOW()
        RETURNING id, code, name
      `);
      return NextResponse.json({ success: true, toleranceGroup: res.rows[0], code: 'FTGC', message: `Tolerance group ${code.toUpperCase()} created – FTGC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('fin_tolerance_group insert failed fallback ent_tolerance_group:', newErr.message);
      const res = await db.execute(sql`
        INSERT INTO ent_tolerance_group (code, name, type, lower_limit, upper_limit, description)
        VALUES (${code.toUpperCase()}, ${name}, ${type || 'GL'}, ${lower_limit || 0}, ${upper_limit || 0}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, type = ${type || 'GL'}, lower_limit = ${lower_limit || 0}, upper_limit = ${upper_limit || 0}, description = ${description || null}
        RETURNING id, code, name
      `);
      return NextResponse.json({ success: true, toleranceGroup: res.rows[0], code: 'FTGC', message: `Tolerance group ${code.toUpperCase()} created – OBA4 legacy (migrating to FTGC)`, legalSafe: false });
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
    const { id, code, name, lower_limit, upper_limit } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE fin_tolerance_group SET name = COALESCE(${name}, name), lower_limit = COALESCE(${lower_limit}, lower_limit), upper_limit = COALESCE(${upper_limit}, upper_limit), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE fin_tolerance_group SET name = COALESCE(${name}, name), lower_limit = COALESCE(${lower_limit}, lower_limit), upper_limit = COALESCE(${upper_limit}, upper_limit), updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) throw new Error('Not found in fin_tolerance_group');
      return NextResponse.json({ success: true, toleranceGroup: res.rows[0], code: 'FTGC', message: `Tolerance group ${res.rows[0].code} updated – FTGC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE ent_tolerance_group SET name = COALESCE(${name}, name), lower_limit = COALESCE(${lower_limit}, lower_limit), upper_limit = COALESCE(${upper_limit}, upper_limit) WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE ent_tolerance_group SET name = COALESCE(${name}, name), lower_limit = COALESCE(${lower_limit}, lower_limit), upper_limit = COALESCE(${upper_limit}, upper_limit) WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Tolerance group not found' }, { status: 404 });
      return NextResponse.json({ success: true, toleranceGroup: res.rows[0], message: `Tolerance group ${res.rows[0].code} updated – OBA4 legacy` });
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
    const code = searchParams.get('code')?.toUpperCase();
    const id = searchParams.get('id');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM fin_tolerance_group WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fin_tolerance_group WHERE code = ${code}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM ent_tolerance_group WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM ent_tolerance_group WHERE code = ${code}`);
    }

    return NextResponse.json({ success: true, code: 'FTGC', message: `Tolerance group ${code || id} deleted – FTGC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
