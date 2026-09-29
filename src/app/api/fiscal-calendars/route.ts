import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Fiscal Calendar API – Legal-safe own IP – Module 4
 * New: fin_fiscal_calendar + fin_fiscal_calendar_period (was ent_fiscal_year_variant + periods) – K4 April-March mapping, sample kept
 * Helper code: FFYC Fiscal Year Calendar Create (alias FYC, OB29, FIN-FY-CR) – 4-char MOOA F=Financials, FY=FiscalYear, C=Create – module grouped intuitive
 * Fallback to legacy ent_fiscal_year_variant if new not yet
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    let calendars: any[] = [];
    let periods: any[] = [];
    let source = 'db-new';
    let table = 'fin_fiscal_calendar';
    let legalSafe = true;

    try {
      const calRes = await db.execute(sql`SELECT * FROM fin_fiscal_calendar ORDER BY code`);
      calendars = calRes.rows as any[];
      try {
        const perRes = await db.execute(sql`SELECT * FROM fin_fiscal_calendar_period ORDER BY fiscal_calendar_id, period_number`);
        periods = perRes.rows as any[];
      } catch {}
    } catch (newErr: any) {
      console.warn('fin_fiscal_calendar not yet, fallback ent_fiscal_year_variant:', newErr.message);
      source = 'db-legacy';
      table = 'ent_fiscal_year_variant';
      legalSafe = false;
      try {
        const calRes = await db.execute(sql`SELECT * FROM ent_fiscal_year_variant ORDER BY code`);
        calendars = calRes.rows as any[];
        try {
          const perRes = await db.execute(sql`SELECT * FROM ent_fiscal_year_period ORDER BY fiscal_year_variant_id, period_number`);
          periods = perRes.rows as any[];
        } catch {
          try {
            const perRes = await db.execute(sql`SELECT * FROM ent_fiscal_period ORDER BY fiscal_year_variant_id, period_number`);
            periods = perRes.rows as any[];
          } catch {}
        }
      } catch (e: any) {
        if (e.message?.includes('does not exist')) {
          return NextResponse.json({ data: [], fiscalCalendars: [], count: 0, message: 'Table fin_fiscal_calendar not yet migrated – fresh empty Module 4', code: 'FFYC', aliasCodes: ['FYC','OB29'], helperCode: 'FFYC', table: 'fin_fiscal_calendar', source: 'none', legalSafe: true });
        }
        throw e;
      }
    }

    return NextResponse.json({
      data: calendars,
      fiscalCalendars: calendars,
      periods,
      count: calendars.length,
      code: 'FFYC',
      aliasCodes: ['FYC', 'OB29', 'FIN-FY-CR'],
      helperCode: 'FFYC',
      table,
      source,
      legalSafe,
      functionDescription: 'Fiscal Calendar – FFYC legal-safe own IP (was OB29) – K4 April-March mapping, V3 calendar year, K4 India fiscal, sample kept',
      erpDefaults: [
        { code: 'K4', name: 'April-March Fiscal – India', periods: 12, yearShift: -3, month: 4, helperCode: 'FFYC', note: 'Sample kept – India FY April-March – Jan-Mar yearShift -1, Apr-Dec 0' },
        { code: 'V3', name: 'Calendar Year Jan-Dec', periods: 12, yearShift: 0, month: 1, helperCode: 'FFYC' },
        { code: 'K1', name: 'Calendar Year Variant', periods: 12, helperCode: 'FFYC' },
      ],
      explanation: 'Fiscal calendar legal-safe fin_fiscal_calendar + fin_fiscal_calendar_period – period/month/yearShift for K4 April-March – Code FFYC primary alias FYC/OB29 – 4-char MOOA F=Financials FY=FiscalYear C=Create – module grouped intuitive – sample data kept for user convenience per requirement fresh empty but common sample data like coa, gl, tax, currencies, UoM kept.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], fiscalCalendars: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const body = await req.json();
    const { code, name, description, tenant_id, periods, from_date, to_date, start_month, end_month, year_shift } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });
    // from_date/to_date now OPTIONAL per user question – fixed date with year should work for any year via start_month/end_month/year_shift – variant is year-independent
    // If provided, validate from < to, but not required – allows K4 April-March template without fixed year
    if (from_date && to_date) {
      if (new Date(from_date) >= new Date(to_date)) {
        return NextResponse.json({ error: 'from_date must be before to_date – e.g., K4 2026-04-01 to 2027-03-31' }, { status: 400 });
      }
    }

    let tenantId = tenant_id;
    if (!tenantId) {
      try {
        const tr = await db.execute(sql`SELECT id FROM core_tenant LIMIT 1`);
        if (tr.rows.length) tenantId = (tr.rows[0] as any).id;
        else {
          const nt = await db.execute(sql`INSERT INTO core_tenant (code, name) VALUES ('TEN-100', 'Main Tenant') ON CONFLICT (code) DO UPDATE SET name='Main Tenant' RETURNING id`);
          tenantId = (nt.rows[0] as any).id;
        }
      } catch {
        try {
          const tr = await db.execute(sql`SELECT id FROM ent_tenant LIMIT 1`);
          if (tr.rows.length) tenantId = (tr.rows[0] as any).id;
        } catch {}
      }
    }

    // Try fin_fiscal_calendar first – robust upsert without assuming constraint name
    try {
      // Check existing
      const existing = await db.execute(sql`SELECT id FROM fin_fiscal_calendar WHERE code = ${code.toUpperCase()} LIMIT 1`);
      let res;
      if (existing.rows.length > 0) {
        // Try update with from_date/to_date if columns exist
        try {
          res = await db.execute(sql`
            UPDATE fin_fiscal_calendar SET name = ${name}, description = ${description || null}, from_date = ${from_date ? new Date(from_date) : null}, to_date = ${to_date ? new Date(to_date) : null}, start_month = ${start_month ? parseInt(start_month) : null}, end_month = ${end_month ? parseInt(end_month) : null}, year_shift = ${year_shift ? parseInt(year_shift) : 0}, updated_at = NOW()
            WHERE code = ${code.toUpperCase()}
            RETURNING id, code, name
          `);
        } catch {
          res = await db.execute(sql`
            UPDATE fin_fiscal_calendar SET name = ${name}, description = ${description || null}, updated_at = NOW()
            WHERE code = ${code.toUpperCase()}
            RETURNING id, code, name
          `);
        }
      } else {
        try {
          res = await db.execute(sql`
            INSERT INTO fin_fiscal_calendar (tenant_id, code, name, description, from_date, to_date, start_month, end_month, year_shift)
            VALUES (${tenantId}, ${code.toUpperCase()}, ${name}, ${description || null}, ${from_date ? new Date(from_date) : null}, ${to_date ? new Date(to_date) : null}, ${start_month ? parseInt(start_month) : 4}, ${end_month ? parseInt(end_month) : 3}, ${year_shift ? parseInt(year_shift) : 0})
            RETURNING id, code, name
          `);
        } catch (insErr: any) {
          // If columns missing, try without from_date/to_date
          try {
            res = await db.execute(sql`
              INSERT INTO fin_fiscal_calendar (tenant_id, code, name, description)
              VALUES (${tenantId}, ${code.toUpperCase()}, ${name}, ${description || null})
              RETURNING id, code, name
            `);
          } catch (insErr2: any) {
            if (insErr2.message?.includes('tenant_id') || insErr2.message?.includes('column')) {
              res = await db.execute(sql`
                INSERT INTO fin_fiscal_calendar (code, name, description)
                VALUES (${code.toUpperCase()}, ${name}, ${description || null})
                RETURNING id, code, name
              `);
            } else throw insErr2;
          }
        }
      }
      const calId = (res.rows[0] as any).id;

      if (periods && Array.isArray(periods) && periods.length > 0) {
        for (const p of periods) {
          try {
            await db.execute(sql`
              INSERT INTO fin_fiscal_calendar_period (fiscal_calendar_id, period_number, month, year_shift, description)
              VALUES (${calId}, ${p.period_number || p.period || 1}, ${p.month || p.period_number || 1}, ${p.year_shift || p.yearShift || 0}, ${p.description || null})
              ON CONFLICT (fiscal_calendar_id, period_number) DO UPDATE SET month = ${p.month || p.period_number || 1}, year_shift = ${p.year_shift || p.yearShift || 0}, description = ${p.description || null}
            `);
          } catch (pe: any) {
            console.warn('period insert failed:', pe.message);
          }
        }
      }

      return NextResponse.json({ success: true, fiscalCalendar: res.rows[0], code: 'FFYC', aliasCodes: ['FYC','OB29'], message: `Fiscal Calendar ${code.toUpperCase()} created – FFYC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('fin_fiscal_calendar insert failed fallback ent_fiscal_year_variant:', newErr.message);
      // Fallback to legacy ent_fiscal_year_variant – robust upsert without ON CONFLICT (code) assumption
      // Include from_date/to_date in description for legacy table
      const legacyDesc = `${description || ''} | FROM ${from_date} TO ${to_date} | START_MONTH ${start_month} END_MONTH ${end_month} YEAR_SHIFT ${year_shift}`.trim();
      try {
        const existingLegacy = await db.execute(sql`SELECT id FROM ent_fiscal_year_variant WHERE code = ${code.toUpperCase()} LIMIT 1`);
        let res;
        if (existingLegacy.rows.length > 0) {
          res = await db.execute(sql`
            UPDATE ent_fiscal_year_variant SET name = ${name}, description = ${legacyDesc}
            WHERE code = ${code.toUpperCase()}
            RETURNING id, code, name
          `);
        } else {
          try {
            res = await db.execute(sql`
              INSERT INTO ent_fiscal_year_variant (tenant_id, code, name, description)
              VALUES (${tenantId}, ${code.toUpperCase()}, ${name}, ${legacyDesc})
              RETURNING id, code, name
            `);
          } catch (legacyInsErr: any) {
            try {
              res = await db.execute(sql`
                INSERT INTO ent_fiscal_year_variant (code, name, description)
                VALUES (${code.toUpperCase()}, ${name}, ${legacyDesc})
                RETURNING id, code, name
              `);
            } catch {
              try {
                res = await db.execute(sql`
                  INSERT INTO ent_fiscal_year_variant (tenant_id, code, name, description)
                  VALUES (${tenantId}, ${code.toUpperCase()}, ${name}, ${legacyDesc})
                  ON CONFLICT (tenant_id, code) DO UPDATE SET name = ${name}, description = ${legacyDesc}
                  RETURNING id, code, name
                `);
              } catch (finalErr: any) {
                await db.execute(sql`
                  INSERT INTO ent_fiscal_year_variant (tenant_id, code, name, description)
                  VALUES (${tenantId}, ${code.toUpperCase()}, ${name}, ${legacyDesc})
                  ON CONFLICT DO NOTHING
                `);
                res = await db.execute(sql`SELECT id, code, name FROM ent_fiscal_year_variant WHERE code = ${code.toUpperCase()} LIMIT 1`);
              }
            }
          }
        }
        return NextResponse.json({ success: true, fiscalCalendar: res.rows[0], code: 'FFYC', aliasCodes: ['OB29'], message: `Fiscal Calendar ${code.toUpperCase()} created – OB29 legacy (migrating to FFYC)`, legalSafe: false });
      } catch (fallbackErr: any) {
        console.error('Both fin and ent fiscal calendar insert failed:', fallbackErr.message);
        return NextResponse.json({ error: `Failed to create fiscal calendar: ${fallbackErr.message}. Tried fin_fiscal_calendar and ent_fiscal_year_variant. Check DB schema.` }, { status: 500 });
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
    const { id, code, name, description } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE fin_fiscal_calendar SET code = COALESCE(${code?.toUpperCase()}, code), name = COALESCE(${name}, name), description = COALESCE(${description}, description), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE fin_fiscal_calendar SET name = COALESCE(${name}, name), description = COALESCE(${description}, description), updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) throw new Error('Not found in fin_fiscal_calendar');
      return NextResponse.json({ success: true, fiscalCalendar: res.rows[0], code: 'FFYC', message: `Fiscal Calendar ${res.rows[0].code} updated – FFYC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE ent_fiscal_year_variant SET code = COALESCE(${code?.toUpperCase()}, code), name = COALESCE(${name}, name), description = COALESCE(${description}, description) WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE ent_fiscal_year_variant SET name = COALESCE(${name}, name), description = COALESCE(${description}, description) WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Fiscal Calendar not found' }, { status: 404 });
      return NextResponse.json({ success: true, fiscalCalendar: res.rows[0], message: `Fiscal Calendar ${res.rows[0].code} updated – OB29 legacy` });
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
      if (id) await db.execute(sql`DELETE FROM fin_fiscal_calendar WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fin_fiscal_calendar WHERE code = ${code}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM ent_fiscal_year_variant WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM ent_fiscal_year_variant WHERE code = ${code}`);
    }

    return NextResponse.json({ success: true, code: 'FFYC', message: `Fiscal Calendar ${code || id} deleted – FFYC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
