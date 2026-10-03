import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Fiscal Calendars / Fiscal Year Variants API - OB29 (T009 / T009B)
 * Full parity with industry standard specifications:
 * - Number of Posting Periods (usually 12)
 * - Number of Special Periods (usually 4)
 * - Year-Dependent flag & Calendar Year flag
 * - Standard Period / Calendar Month mappings with Year Shift (-1, 0, +1)
 */

async function ensureFiscalCalendarSchema() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS fin_fiscal_calendar (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid,
      code varchar(20) NOT NULL UNIQUE,
      name varchar(100) NOT NULL,
      description text,
      year_dependent boolean DEFAULT false,
      calendar_year boolean DEFAULT false,
      number_of_periods integer DEFAULT 12,
      number_of_special_periods integer DEFAULT 4,
      start_month integer DEFAULT 1,
      end_month integer DEFAULT 12,
      year_shift integer DEFAULT 0,
      from_date varchar(10),
      to_date varchar(10),
      is_active boolean DEFAULT true,
      created_at timestamp DEFAULT NOW(),
      updated_at timestamp DEFAULT NOW()
    )
  `).catch(() => {});

  await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS number_of_special_periods integer DEFAULT 4`).catch(() => {});
  await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS start_month integer DEFAULT 1`).catch(() => {});
  await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS end_month integer DEFAULT 12`).catch(() => {});
  await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS year_shift integer DEFAULT 0`).catch(() => {});
  await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS from_date varchar(10)`).catch(() => {});
  await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS to_date varchar(10)`).catch(() => {});
  await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`).catch(() => {});

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS fin_fiscal_calendar_period (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      fiscal_calendar_id uuid NOT NULL REFERENCES fin_fiscal_calendar(id) ON DELETE CASCADE,
      period integer NOT NULL,
      calendar_month integer NOT NULL,
      year_shift integer DEFAULT 0 NOT NULL,
      start_day_month varchar(10),
      end_day_month varchar(10),
      description text,
      created_at timestamp DEFAULT NOW(),
      UNIQUE(fiscal_calendar_id, period)
    )
  `).catch(() => {});
}

function generateStandardPeriods(code: string, startMonth: number, numPeriods: number, yearShift: number) {
  const periods = [];
  for (let p = 1; p <= numPeriods; p++) {
    const calMonth = ((startMonth - 1 + (p - 1)) % 12) + 1;
    let shift = 0;
    if (startMonth !== 1) {
      shift = calMonth < startMonth ? (yearShift || -1) : 0;
    }
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    periods.push({
      period: p,
      calendar_month: calMonth,
      month_name: monthNames[calMonth] || `Month ${calMonth}`,
      year_shift: shift,
      description: `Period ${p} (${monthNames[calMonth]})`
    });
  }
  return periods;
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureFiscalCalendarSchema();

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  try {
    let query = sql`
      SELECT 
        fc.id, fc.code, fc.name, fc.description,
        fc.year_dependent, fc.calendar_year,
        fc.number_of_periods, fc.number_of_special_periods,
        fc.start_month, fc.end_month, fc.year_shift,
        fc.from_date, fc.to_date, fc.is_active,
        fc.created_at
      FROM fin_fiscal_calendar fc
      WHERE 1=1
    `;

    if (code) {
      query = sql`${query} AND UPPER(fc.code) = ${code.toUpperCase().trim()}`;
    }
    query = sql`${query} ORDER BY fc.code`;

    const result = await db.execute(query);
    const rows = result.rows as any[];

    // Fetch period definitions for each variant
    for (const r of rows) {
      try {
        const periodRes = await db.execute(sql`
          SELECT period, calendar_month, year_shift, start_day_month, end_day_month, description
          FROM fin_fiscal_calendar_period
          WHERE fiscal_calendar_id = ${r.id}
          ORDER BY period
        `);
        if (periodRes.rows.length > 0) {
          r.periods = periodRes.rows;
        } else {
          // If no custom periods, synthesize standard periods based on start_month and number_of_periods
          const startM = r.start_month || (r.code === 'K4' || r.calendar_year ? 1 : 4);
          r.periods = generateStandardPeriods(r.code, startM, r.number_of_periods || 12, r.year_shift || 0);
        }
      } catch {
        r.periods = generateStandardPeriods(r.code, r.start_month || 1, r.number_of_periods || 12, r.year_shift || 0);
      }
    }

    return NextResponse.json({
      data: rows,
      fiscalCalendars: rows,
      count: rows.length,
      helperCode: 'FFYC',
      aliasCode: 'OB29',
      table: 'fin_fiscal_calendar'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], fiscalCalendars: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureFiscalCalendarSchema();

  try {
    const body = await req.json();
    const { 
      code, 
      name, 
      description, 
      tenant_id, 
      year_dependent, 
      calendar_year, 
      number_of_periods, 
      number_of_special_periods,
      from_date, 
      to_date, 
      start_month, 
      end_month, 
      year_shift, 
      periods 
    } = body;

    if (!code || !name) return NextResponse.json({ error: 'FISCAL_CALENDAR_CODE and FISCAL_CALENDAR_NAME are required' }, { status: 400 });

    const finalYearDep = year_dependent === true || year_dependent === 'true';
    const finalCalYear = calendar_year === true || calendar_year === 'true';
    const finalNumPeriods = number_of_periods ? parseInt(number_of_periods) : 12;
    const finalSpecialPeriods = number_of_special_periods ? parseInt(number_of_special_periods) : 4;
    const finalStartMonth = start_month ? parseInt(start_month) : (finalCalYear ? 1 : 4);
    const finalEndMonth = end_month ? parseInt(end_month) : (finalCalYear ? 12 : 3);
    const finalYearShift = year_shift ? parseInt(year_shift) : 0;
    const coCode = code.toUpperCase().trim();

    let tenantId = tenant_id;
    if (!tenantId) {
      try {
        const tr = await db.execute(sql`SELECT id FROM core_tenant LIMIT 1`);
        if (tr.rows.length) tenantId = (tr.rows[0] as any).id;
        else {
          const nt = await db.execute(sql`
            INSERT INTO core_tenant (code, name) 
            VALUES ('TEN-100', 'Main Tenant') 
            ON CONFLICT (code) DO UPDATE SET name='Main Tenant' 
            RETURNING id
          `);
          tenantId = (nt.rows[0] as any).id;
        }
      } catch {}
    }

    const existingCheck = await db.execute(sql`
      SELECT id FROM fin_fiscal_calendar WHERE UPPER(code) = ${coCode} LIMIT 1
    `);

    let res: any;
    if (existingCheck.rows.length > 0) {
      const existingId = (existingCheck.rows[0] as any).id;
      // Ensure optional columns exist
      await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT NOW()`).catch(() => {});
      await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS number_of_special_periods integer DEFAULT 4`).catch(() => {});
      await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS start_month integer DEFAULT 1`).catch(() => {});
      await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS end_month integer DEFAULT 12`).catch(() => {});
      await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS year_shift integer DEFAULT 0`).catch(() => {});
      await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS from_date varchar(10)`).catch(() => {});
      await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS to_date varchar(10)`).catch(() => {});

      const safeFromDate = from_date && from_date.trim() !== '' ? from_date.trim() : null;
      const safeToDate = to_date && to_date.trim() !== '' ? to_date.trim() : null;

      res = await db.execute(sql`
        UPDATE fin_fiscal_calendar SET 
          name = ${name},
          description = ${description || null},
          year_dependent = ${finalYearDep},
          calendar_year = ${finalCalYear},
          number_of_periods = ${finalNumPeriods},
          number_of_special_periods = ${finalSpecialPeriods},
          start_month = ${finalStartMonth},
          end_month = ${finalEndMonth},
          year_shift = ${finalYearShift},
          from_date = ${safeFromDate},
          to_date = ${safeToDate},
          is_active = true
        WHERE id = ${existingId}
        RETURNING id, code, name
      `);
    } else {
      const safeFromDate = from_date && from_date.trim() !== '' ? from_date.trim() : null;
      const safeToDate = to_date && to_date.trim() !== '' ? to_date.trim() : null;

      res = await db.execute(sql`
        INSERT INTO fin_fiscal_calendar (
          tenant_id, code, name, description, year_dependent, calendar_year,
          number_of_periods, number_of_special_periods, start_month, end_month,
          year_shift, from_date, to_date, is_active
        ) VALUES (
          ${tenantId}, ${coCode}, ${name}, ${description || null}, ${finalYearDep}, ${finalCalYear},
          ${finalNumPeriods}, ${finalSpecialPeriods}, ${finalStartMonth}, ${finalEndMonth},
          ${finalYearShift}, ${safeFromDate}, ${safeToDate}, true
        )
        RETURNING id, code, name
      `);
    }

    const calId = (res.rows[0] as any).id;

    // Persist period mappings
    const periodList = (periods && Array.isArray(periods) && periods.length > 0)
      ? periods
      : generateStandardPeriods(coCode, finalStartMonth, finalNumPeriods, finalYearShift);

    for (const p of periodList) {
      try {
        await db.execute(sql`
          INSERT INTO fin_fiscal_calendar_period (
            fiscal_calendar_id, period, calendar_month, year_shift, description
          ) VALUES (
            ${calId}, ${p.period || p.period_number || 1}, ${p.calendar_month || p.month || 1}, ${p.year_shift || 0}, ${p.description || null}
          )
          ON CONFLICT (fiscal_calendar_id, period) DO UPDATE SET 
            calendar_month = ${p.calendar_month || p.month || 1},
            year_shift = ${p.year_shift || 0},
            description = ${p.description || null}
        `);
      } catch (pe: any) {
        console.warn('Period insert warning:', pe.message);
      }
    }

    return NextResponse.json({
      success: true,
      fiscalCalendar: res.rows[0],
      code: 'FFYC',
      message: `Fiscal Calendar Variant ${coCode} successfully saved (OB29)`,
      legalSafe: true
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
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
      res = await db.execute(sql`DELETE FROM fin_fiscal_calendar WHERE id = ${id} RETURNING code`);
    } else {
      res = await db.execute(sql`DELETE FROM fin_fiscal_calendar WHERE UPPER(code) = ${(code || '').toUpperCase().trim()} RETURNING code`);
    }

    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `Fiscal Calendar ${res.rows[0].code} deleted`, deleted: res.rows[0].code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
