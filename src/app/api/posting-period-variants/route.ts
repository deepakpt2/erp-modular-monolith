import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Posting Period Variants API – Legal-safe own IP – Module 4
 * New: fin_posting_calendar + fin_posting_calendar_period (was fin_posting_calendar + fin_posting_calendar) – FPPC (legacy OBBO)/FPPE (legacy OB52)
 * Helper code: FPPE Posting Period Variant Edit (alias PPE, FPPE (legacy OB52), FIN-PP-E) – 4-char MOOA F=Financials, PP=PostingPeriod, E=Edit – for open/close
 * Also FPPC for calendar – alias FPPC (legacy OBBO)
 * Fallback to legacy
 */

async function ensureTableNew() {
  try {
    // fin_posting_calendar already created via schema migration, but ensure sample
    const cnt = await db.execute(sql`SELECT COUNT(*) as c FROM fin_posting_calendar`);
    if (parseInt((cnt.rows[0] as any).c || '0') === 0) {
      await db.execute(sql`
        INSERT INTO fin_posting_calendar (code, name, description) VALUES ('1000', 'Standard Posting Calendar', 'Standard 1-12 open'), ('KS01', 'Kerala Spices Posting Calendar') ON CONFLICT (code) DO NOTHING
      `);
    }
  } catch (e: any) {
    console.warn('ensure posting calendar new failed', e.message);
  }
}

async function ensureTableLegacy() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_posting_calendar (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_posting_calendar_period (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        variant_code VARCHAR(10) REFERENCES fin_posting_calendar(code),
        account_type VARCHAR(2) NOT NULL,
        from_period INTEGER, from_year INTEGER, to_period INTEGER, to_year INTEGER,
        from_period2 INTEGER, from_year2 INTEGER, to_period2 INTEGER, to_year2 INTEGER
      );
    `);
    const cnt = await db.execute(sql`SELECT COUNT(*) as c FROM fin_posting_calendar`);
    if (parseInt((cnt.rows[0] as any).c || '0') === 0) {
      await db.execute(sql`
        INSERT INTO fin_posting_calendar (code, name) VALUES ('1000', 'Standard Posting Variant'), ('KS01', 'Kerala Spices Posting Period') ON CONFLICT (code) DO NOTHING
      `);
      const types = ['+', 'A', 'D', 'K', 'M', 'S'];
      for (const at of types) {
        await db.execute(sql`
          INSERT INTO fin_posting_calendar_period (variant_code, account_type, from_period, from_year, to_period, to_year, from_period2, from_year2, to_period2, to_year2)
          VALUES ('1000', ${at}, 1, 2024, 12, 2026, 1, 2024, 12, 2026) ON CONFLICT DO NOTHING
        `);
      }
    }
  } catch (e: any) {
    console.warn('ensure posting period legacy failed', e.message);
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const variantCode = searchParams.get('variantCode') || searchParams.get('code') || 'ALL';

  try {
    await ensureTableNew();
    await ensureTableLegacy();

    let variants: any[] = [];
    let periods: any[] = [];
    let source = 'db-new';
    let legalSafe = true;

    try {
      const vRes = await db.execute(sql`SELECT * FROM fin_posting_calendar ORDER BY code`);
      variants = vRes.rows as any[];
      let perQuery = sql`SELECT * FROM fin_posting_calendar_period ORDER BY posting_calendar_id, from_period`;
      if (variantCode && variantCode !== 'ALL') {
        perQuery = sql`SELECT p.* FROM fin_posting_calendar_period p JOIN fin_posting_calendar c ON p.posting_calendar_id = c.id WHERE c.code = ${variantCode} ORDER BY p.from_period`;
      }
      const pRes = await db.execute(perQuery);
      periods = pRes.rows as any[];
    } catch (newErr: any) {
      console.warn('fin_posting_calendar not yet fallback fin_posting_calendar:', newErr.message);
      source = 'db-legacy';
      legalSafe = false;
      const vRes = await db.execute(sql`SELECT * FROM fin_posting_calendar ORDER BY code`);
      variants = vRes.rows as any[];
      let perQuery = sql`SELECT * FROM fin_posting_calendar_period ORDER BY variant_code, from_period`;
      if (variantCode && variantCode !== 'ALL') {
        perQuery = sql`SELECT * FROM fin_posting_calendar_period WHERE variant_code = ${variantCode} ORDER BY from_period`;
      }
      const pRes = await db.execute(perQuery);
      periods = pRes.rows as any[];
    }

    return NextResponse.json({
      postingPeriodVariants: variants,
      postingPeriods: periods,
      count: variants.length,
      configurable: true,
      code: 'FPPE',
      aliasCodes: ['PPE', 'OB52', 'OBBO', 'FIN-PP-E'],
      helperCode: 'FPPE',
      table: source === 'db-new' ? 'fin_posting_calendar + fin_posting_calendar_period' : 'fin_posting_calendar + fin_posting_calendar_period',
      source,
      legalSafe,
      functionDescription: 'Posting Period Variants – FPPE legal-safe own IP (was FPPC (legacy OBBO)/FPPE (legacy OB52)) – Define Variant FPPC (legacy OBBO), Open/Close FPPE (legacy OB52), Assign OBBP – accountType ALL/ASSET/CUSTOMER/VENDOR/ITEM/GL (was +/A/D/K/M/S), isOpen',
      erpDefaults: [
        { variant: '1000', accountType: 'ALL', from: '1/2024 to 12/2026 open', helperCode: 'FPPE', note: 'Sample kept – FPPE (legacy OB52) open/close' },
        { variant: '1000', accountType: 'ASSET', from: 'A – Asset accounting', helperCode: 'FPPE' },
        { variant: '1000', accountType: 'CUSTOMER', from: 'D – Customer', helperCode: 'FPPE' },
        { variant: '1000', accountType: 'VENDOR', from: 'K – Vendor', helperCode: 'FPPE' },
      ],
      explanation: 'Posting period variants legal-safe fin_posting_calendar + fin_posting_calendar_period – fromPeriod/toPeriod/accountType ALL/ASSET/CUSTOMER/VENDOR/ITEM/GL was +/A/D/K/M/S, isOpen FPPE (legacy OB52) – Code FPPE primary alias PPE/FPPE (legacy OB52)/FPPC (legacy OBBO) – 4-char MOOA F=Financials PP=PostingPeriod E=Edit – module grouped intuitive – sample data kept for user convenience.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, postingPeriodVariants: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { code, name, periods } = body;
    if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

    try {
      const res = await db.execute(sql`
        INSERT INTO fin_posting_calendar (code, name)
        VALUES (${code.toUpperCase()}, ${name || code})
        ON CONFLICT (code) DO UPDATE SET name = ${name || code}, updated_at = NOW()
        RETURNING id, code, name
      `);
      const calId = (res.rows[0] as any).id;

      if (periods && Array.isArray(periods)) {
        for (const p of periods) {
          await db.execute(sql`
            INSERT INTO fin_posting_calendar_period (posting_calendar_id, from_period, to_period, account_type, is_open)
            VALUES (${calId}, ${p.from_period || 1}, ${p.to_period || 12}, ${p.account_type || 'ALL'}::fin_posting_account_type, ${p.is_open ?? true})
            ON CONFLICT (posting_calendar_id, from_period, account_type) DO UPDATE SET to_period = ${p.to_period || 12}, is_open = ${p.is_open ?? true}
          `);
        }
      }

      return NextResponse.json({ success: true, variant: res.rows[0], code: 'FPPE', message: `Posting variant ${code.toUpperCase()} created – FPPE legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('fin_posting_calendar insert failed fallback fin_posting_calendar:', newErr.message);
      await db.execute(sql`
        INSERT INTO fin_posting_calendar (code, name) VALUES (${code.toUpperCase()}, ${name || code}) ON CONFLICT (code) DO UPDATE SET name = ${name || code}
      `);
      if (periods && Array.isArray(periods)) {
        for (const p of periods) {
          await db.execute(sql`
            INSERT INTO fin_posting_calendar_period (variant_code, account_type, from_period, from_year, to_period, to_year, from_period2, from_year2, to_period2, to_year2)
            VALUES (${code.toUpperCase()}, ${p.account_type || '+'}, ${p.from_period || 1}, ${p.from_year || 2024}, ${p.to_period || 12}, ${p.to_year || 2026}, ${p.from_period2 || 1}, ${p.from_year2 || 2024}, ${p.to_period2 || 12}, ${p.to_year2 || 2026})
          `);
        }
      }
      return NextResponse.json({ success: true, code: 'FPPE', message: `Posting variant ${code.toUpperCase()} created – FPPC (legacy OBBO) legacy (migrating to FPPE)`, legalSafe: false });
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
    const { variant_code, account_type, from_period, from_year, to_period, to_year, is_open, accountType, fromPeriod, toPeriod, isOpen } = body;

    const finalAccountType = accountType || account_type || 'ALL';
    const finalFrom = fromPeriod || from_period || 1;
    const finalTo = toPeriod || to_period || 12;
    const finalOpen = isOpen ?? is_open ?? true;

    if (!variant_code) return NextResponse.json({ error: 'variant_code required' }, { status: 400 });

    try {
      const calRes = await db.execute(sql`SELECT id FROM fin_posting_calendar WHERE code = ${variant_code.toUpperCase()} LIMIT 1`);
      if (calRes.rows.length === 0) {
        // Auto-create variant if not exists for FPPE (legacy OB52)
        try {
          const newVar = await db.execute(sql`INSERT INTO fin_posting_calendar (code, name) VALUES (${variant_code.toUpperCase()}, ${variant_code.toUpperCase()}) ON CONFLICT (code) DO UPDATE SET name = ${variant_code.toUpperCase()} RETURNING id`);
          const calIdNew = (newVar.rows[0] as any).id;
          await db.execute(sql`
            INSERT INTO fin_posting_calendar_period (posting_calendar_id, from_period, to_period, account_type, is_open, from_year, to_year)
            VALUES (${calIdNew}, ${finalFrom}, ${finalTo}, ${finalAccountType}::fin_posting_account_type, ${finalOpen}, ${from_year || 2026}, ${to_year || 2026})
            ON CONFLICT (posting_calendar_id, from_period, account_type) DO UPDATE SET to_period = ${finalTo}, is_open = ${finalOpen}, from_year = ${from_year || 2026}, to_year = ${to_year || 2026}, updated_at = NOW()
          `);
          return NextResponse.json({ success: true, code: 'FPPE', message: `Period ${variant_code} ${finalAccountType} ${finalFrom}/${from_year || 2026} → ${finalTo}/${to_year || 2026} ${finalOpen ? 'OPEN' : 'CLOSED'} created – FPPE legal-safe (variant auto-created)`, legalSafe: true });
        } catch (autoErr: any) {
          return NextResponse.json({ error: `Variant ${variant_code} not found and auto-create failed: ${autoErr.message}` }, { status: 404 });
        }
      }
      const calId = (calRes.rows[0] as any).id;

      // Try update, if no rows affected, insert
      const updRes = await db.execute(sql`
        UPDATE fin_posting_calendar_period SET to_period = ${finalTo}, is_open = ${finalOpen}, from_year = ${from_year || 2026}, to_year = ${to_year || 2026}, updated_at = NOW()
        WHERE posting_calendar_id = ${calId} AND from_period = ${finalFrom} AND account_type = ${finalAccountType}::fin_posting_account_type
        RETURNING id
      `);

      if (updRes.rows.length === 0) {
        await db.execute(sql`
          INSERT INTO fin_posting_calendar_period (posting_calendar_id, from_period, to_period, account_type, is_open, from_year, to_year)
          VALUES (${calId}, ${finalFrom}, ${finalTo}, ${finalAccountType}::fin_posting_account_type, ${finalOpen}, ${from_year || 2026}, ${to_year || 2026})
          ON CONFLICT (posting_calendar_id, from_period, account_type) DO UPDATE SET to_period = ${finalTo}, is_open = ${finalOpen}, from_year = ${from_year || 2026}, to_year = ${to_year || 2026}, updated_at = NOW()
        `);
      }

      return NextResponse.json({ success: true, code: 'FPPE', message: `Period ${variant_code} ${finalAccountType} ${finalFrom}/${from_year || 2026} → ${finalTo}/${to_year || 2026} ${finalOpen ? 'OPEN' : 'CLOSED'} – FPPE legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('fin_posting_calendar_period upsert failed fallback fin_posting_calendar_period:', newErr.message);
      try {
        const upd = await db.execute(sql`
          UPDATE fin_posting_calendar_period SET to_period = ${finalTo}, to_year = ${to_year || 2026}, from_year = ${from_year || 2024}
          WHERE variant_code = ${variant_code.toUpperCase()} AND account_type = ${finalAccountType} AND from_period = ${finalFrom}
          RETURNING id
        `);
        if (upd.rows.length === 0) {
          await db.execute(sql`
            INSERT INTO fin_posting_calendar_period (variant_code, account_type, from_period, from_year, to_period, to_year)
            VALUES (${variant_code.toUpperCase()}, ${finalAccountType}, ${finalFrom}, ${from_year || 2024}, ${finalTo}, ${to_year || 2026})
          `);
        }
        return NextResponse.json({ success: true, message: `Period ${variant_code} ${finalAccountType} ${finalFrom}/${from_year} → ${finalTo}/${to_year} ${finalOpen ? 'OPEN' : 'CLOSED'} – FPPC (legacy OBBO) legacy`, legalSafe: false });
      } catch (legacyErr: any) {
        return NextResponse.json({ error: `Failed to create period: ${legacyErr.message}` }, { status: 500 });
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import { validatePostingPeriodVariantDeletion } from '@/shared/kernel/safety/deletionPrecheck';

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code')?.toUpperCase();
    const id = searchParams.get('id');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    // Industry Standard Pre-check
    const precheck = await validatePostingPeriodVariantDeletion({ id, code });
    if (!precheck.canDelete) {
      return NextResponse.json({
        success: false,
        errorCode: 'MSG_PPV_001',
        error: precheck.errorTitle,
        diagnostic: precheck,
      }, { status: 409 });
    }

    try {
      if (id) await db.execute(sql`DELETE FROM fin_posting_calendar WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fin_posting_calendar WHERE code = ${code}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM fin_posting_calendar WHERE id = ${id}`);
      else {
        await db.execute(sql`DELETE FROM fin_posting_calendar_period WHERE variant_code = ${code}`);
        await db.execute(sql`DELETE FROM fin_posting_calendar WHERE code = ${code}`);
      }
    }

    return NextResponse.json({ success: true, code: 'FPPE', message: `Variant ${code || id} deleted – FPPE legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
