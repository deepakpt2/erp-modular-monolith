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
      result = await db.execute(sql`SELECT * FROM fin_fiscal_calendar ORDER BY code`);
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        return NextResponse.json({ data: [], count: 0, message: 'Table fin_fiscal_calendar not yet migrated', helperCode: 'FFYC' });
      }
      throw e;
    }
    return NextResponse.json({ data: result.rows, count: result.rows.length, helperCode: 'FFYC', table: 'fin_fiscal_calendar' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const body = await req.json();
    const { code, name, description, tenant_id, year_dependent, calendar_year, number_of_periods, from_date, to_date, start_month, end_month, year_shift, periods } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    const finalYearDep = year_dependent === true || year_dependent === 'true' ? true : false;
    const finalCalYear = calendar_year === true || calendar_year === 'true' ? true : false;
    const finalNumPeriods = number_of_periods ? parseInt(number_of_periods) : 12;

    let tenantId = tenant_id;
    if (!tenantId) {
      try {
        const tr = await db.execute(sql`SELECT id FROM core_tenant LIMIT 1`);
        if (tr.rows.length) tenantId = (tr.rows[0] as any).id;
        else {
          const nt = await db.execute(sql`INSERT INTO core_tenant (code, name) VALUES ('TEN-100', 'Main Tenant') ON CONFLICT (code) DO UPDATE SET name='Main Tenant' RETURNING id`);
          tenantId = (nt.rows[0] as any).id;
        }
      } catch {}
    }

    try {
      const existing = await db.execute(sql`SELECT id FROM fin_fiscal_calendar WHERE tenant_id = ${tenantId} AND code = ${code.toUpperCase()} LIMIT 1`);
      let res;
      if (existing.rows.length > 0) {
        res = await db.execute(sql`
          UPDATE fin_fiscal_calendar SET name = ${name}, description = ${description || null}, year_dependent = ${finalYearDep}, calendar_year = ${finalCalYear}, number_of_periods = ${finalNumPeriods}
          WHERE tenant_id = ${tenantId} AND code = ${code.toUpperCase()}
          RETURNING id, code, name
        `);
      } else {
        res = await db.execute(sql`
          INSERT INTO fin_fiscal_calendar (tenant_id, code, name, description, year_dependent, calendar_year, number_of_periods)
          VALUES (${tenantId}, ${code.toUpperCase()}, ${name}, ${description || null}, ${finalYearDep}, ${finalCalYear}, ${finalNumPeriods})
          ON CONFLICT (tenant_id, code) DO UPDATE SET name = ${name}, description = ${description || null}, year_dependent = ${finalYearDep}, calendar_year = ${finalCalYear}, number_of_periods = ${finalNumPeriods}
          RETURNING id, code, name
        `);
      }
      const calId = (res.rows[0] as any).id;

      if (periods && Array.isArray(periods) && periods.length > 0) {
        for (const p of periods) {
          try {
            await db.execute(sql`
              INSERT INTO fin_fiscal_calendar_period (fiscal_calendar_id, period, calendar_month, year_shift, description)
              VALUES (${calId}, ${p.period_number || p.period || 1}, ${p.month || p.period_number || 1}, ${p.year_shift || 0}, ${p.description || null})
              ON CONFLICT (fiscal_calendar_id, period) DO UPDATE SET calendar_month = ${p.month || 1}, year_shift = ${p.year_shift || 0}
            `);
          } catch (pe: any) {
            console.warn('period insert failed:', pe.message);
          }
        }
      }

      return NextResponse.json({ success: true, fiscalCalendar: res.rows[0], code: 'FFYC', message: `Fiscal Calendar ${code.toUpperCase()} created – FFYC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('fin_fiscal_calendar insert failed:', newErr.message);
      return NextResponse.json({ error: newErr.message }, { status: 500 });
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
    const { id, code, name, description } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });
    let res;
    if (id) res = await db.execute(sql`UPDATE fin_fiscal_calendar SET code = COALESCE(${code?.toUpperCase()}, code), name = COALESCE(${name}, name), description = COALESCE(${description}, description) WHERE id = ${id} RETURNING id, code, name`);
    else res = await db.execute(sql`UPDATE fin_fiscal_calendar SET name = COALESCE(${name}, name), description = COALESCE(${description}, description) WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, fiscalCalendar: res.rows[0], code: 'FFYC', message: `Fiscal Calendar ${res.rows[0].code} updated` });
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
    if (id) res = await db.execute(sql`DELETE FROM fin_fiscal_calendar WHERE id = ${id} RETURNING code`);
    else res = await db.execute(sql`DELETE FROM fin_fiscal_calendar WHERE code = ${code?.toUpperCase()} RETURNING code`);
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `Fiscal Calendar ${res.rows[0].code} deleted`, deleted: res.rows[0].code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
