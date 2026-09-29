import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Posting Calendar API – Legal-safe own IP – Module 4
 * New: fin_posting_calendar + fin_posting_calendar_period (was ent_posting_period_variant + ent_posting_period) – fromPeriod/toPeriod/accountType ALL/ASSET/CUSTOMER/VENDOR/ITEM/GL was +/A/D/K/M/S, isOpen OB52, sample kept
 * Helper code: FPPC Posting Period Calendar Create (alias PPC, OBBO, FIN-PP-CR) – 4-char MOOA F=Financials, PP=PostingPeriod, C=Create – module grouped intuitive
 * Fallback to legacy ent_posting_period_variant
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    let calendars: any[] = [];
    let periods: any[] = [];
    let source = 'db-new';
    let table = 'fin_posting_calendar';
    let legalSafe = true;

    try {
      const calRes = await db.execute(sql`SELECT * FROM fin_posting_calendar ORDER BY code`);
      calendars = calRes.rows as any[];
      try {
        const perRes = await db.execute(sql`SELECT * FROM fin_posting_calendar_period ORDER BY posting_calendar_id, from_period`);
        periods = perRes.rows as any[];
      } catch {}
    } catch (newErr: any) {
      console.warn('fin_posting_calendar not yet, fallback ent_posting_period_variant:', newErr.message);
      source = 'db-legacy';
      table = 'ent_posting_period_variant';
      legalSafe = false;
      try {
        const calRes = await db.execute(sql`SELECT * FROM ent_posting_period_variant ORDER BY code`);
        calendars = calRes.rows as any[];
        try {
          const perRes = await db.execute(sql`SELECT * FROM ent_posting_period ORDER BY posting_period_variant_id, from_period`);
          periods = perRes.rows as any[];
        } catch {}
      } catch (e: any) {
        if (e.message?.includes('does not exist')) {
          return NextResponse.json({ data: [], postingCalendars: [], count: 0, message: 'Table fin_posting_calendar not yet migrated – fresh empty Module 4', code: 'FPPC', aliasCodes: ['PPC','OBBO'], helperCode: 'FPPC', table: 'fin_posting_calendar', source: 'none', legalSafe: true });
        }
        throw e;
      }
    }

    return NextResponse.json({
      data: calendars,
      postingCalendars: calendars,
      periods,
      count: calendars.length,
      code: 'FPPC',
      aliasCodes: ['PPC', 'OBBO', 'FIN-PP-CR'],
      helperCode: 'FPPC',
      table,
      source,
      legalSafe,
      functionDescription: 'Posting Calendar – FPPC legal-safe own IP (was OBBO) – fromPeriod/toPeriod/accountType ALL/ASSET/CUSTOMER/VENDOR/ITEM/GL (was +/A/D/K/M/S), isOpen OB52, sample kept',
      erpDefaults: [
        { code: '0001', name: 'Standard Posting Calendar', periods: '1-12 open, 13-16 special', accountType: 'ALL', isOpen: true, helperCode: 'FPPC', note: 'Sample kept – OB52 open/close' },
        { code: 'KSCA', name: 'Kerala Spices Posting Calendar', periods: '1-12 open', accountType: 'ALL', helperCode: 'FPPC' },
      ],
      explanation: 'Posting calendar legal-safe fin_posting_calendar + fin_posting_calendar_period – fromPeriod/toPeriod/accountType ALL/ASSET/CUSTOMER/VENDOR/ITEM/GL was +/A/D/K/M/S, isOpen OB52 – Code FPPC primary alias PPC/OBBO – 4-char MOOA F=Financials PP=PostingPeriod C=Create – module grouped intuitive – sample data kept for user convenience per requirement fresh empty but common sample data like coa, gl, tax, currencies, UoM kept.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], postingCalendars: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const body = await req.json();
    const { code, name, description, tenant_id, periods } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

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

    try {
      const res = await db.execute(sql`
        INSERT INTO fin_posting_calendar (tenant_id, code, name, description)
        VALUES (${tenantId}, ${code.toUpperCase()}, ${name}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}, updated_at = NOW()
        RETURNING id, code, name
      `);
      const calId = (res.rows[0] as any).id;

      if (periods && Array.isArray(periods)) {
        for (const p of periods) {
          try {
            await db.execute(sql`
              INSERT INTO fin_posting_calendar_period (posting_calendar_id, from_period, to_period, account_type, is_open, description)
              VALUES (${calId}, ${p.from_period || p.fromPeriod || 1}, ${p.to_period || p.toPeriod || 12}, ${p.account_type || p.accountType || 'ALL'}::fin_posting_account_type, ${p.is_open ?? p.isOpen ?? true}, ${p.description || null})
              ON CONFLICT (posting_calendar_id, from_period, account_type) DO UPDATE SET to_period = ${p.to_period || p.toPeriod || 12}, is_open = ${p.is_open ?? p.isOpen ?? true}, description = ${p.description || null}
            `);
          } catch (pe: any) {
            console.warn('posting period insert failed:', pe.message);
          }
        }
      }

      return NextResponse.json({ success: true, postingCalendar: res.rows[0], code: 'FPPC', aliasCodes: ['PPC','OBBO'], message: `Posting Calendar ${code.toUpperCase()} created – FPPC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('fin_posting_calendar insert failed fallback ent_posting_period_variant:', newErr.message);
      const res = await db.execute(sql`
        INSERT INTO ent_posting_period_variant (tenant_id, code, name, description)
        VALUES (${tenantId}, ${code.toUpperCase()}, ${name}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}
        RETURNING id, code, name
      `);
      return NextResponse.json({ success: true, postingCalendar: res.rows[0], code: 'FPPC', aliasCodes: ['OBBO'], message: `Posting Calendar ${code.toUpperCase()} created – OBBO legacy (migrating to FPPC)`, legalSafe: false });
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
      if (id) res = await db.execute(sql`UPDATE fin_posting_calendar SET code = COALESCE(${code?.toUpperCase()}, code), name = COALESCE(${name}, name), description = COALESCE(${description}, description), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE fin_posting_calendar SET name = COALESCE(${name}, name), description = COALESCE(${description}, description), updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) throw new Error('Not found in fin_posting_calendar');
      return NextResponse.json({ success: true, postingCalendar: res.rows[0], code: 'FPPC', message: `Posting Calendar ${res.rows[0].code} updated – FPPC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE ent_posting_period_variant SET code = COALESCE(${code?.toUpperCase()}, code), name = COALESCE(${name}, name), description = COALESCE(${description}, description) WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE ent_posting_period_variant SET name = COALESCE(${name}, name), description = COALESCE(${description}, description) WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Posting Calendar not found' }, { status: 404 });
      return NextResponse.json({ success: true, postingCalendar: res.rows[0], message: `Posting Calendar ${res.rows[0].code} updated – OBBO legacy` });
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
      if (id) await db.execute(sql`DELETE FROM fin_posting_calendar WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fin_posting_calendar WHERE code = ${code}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM ent_posting_period_variant WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM ent_posting_period_variant WHERE code = ${code}`);
    }

    return NextResponse.json({ success: true, code: 'FPPC', message: `Posting Calendar ${code || id} deleted – FPPC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
