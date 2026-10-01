import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Currencies API – Legal-safe own IP – Module 4
 * New table: core_currency (was core_currency) – sample INR default, KWD/USD/EUR sample kept for convenience per requirement fresh empty but common sample kept
 * Helper code: FCYC Currency Create (alias CYC, FCYC (legacy OY03), FIN-CUR-CR) – 4-char MOOA F=Financials, CY=Currency, C=Create
 * Fallback to legacy core_currency if new not yet migrated
 */

async function ensureTableNew() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS core_currency (
        code VARCHAR(3) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        decimal_places INTEGER DEFAULT 2,
        symbol VARCHAR(10),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    const cnt = await db.execute(sql`SELECT COUNT(*) as c FROM core_currency`);
    if (parseInt((cnt.rows[0] as any).c || '0') === 0) {
      await db.execute(sql`
        INSERT INTO core_currency (code, name, decimal_places, symbol)
        VALUES ('INR', 'Indian Rupee', 2, '₹')
        ON CONFLICT (code) DO NOTHING
      `);
    }
  } catch (e: any) {
    console.warn('ensure core_currency failed', e);
  }
}

async function ensureTableLegacy() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS core_currency (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(3) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        decimal_places INTEGER DEFAULT 2,
        symbol VARCHAR(10),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    const cnt = await db.execute(sql`SELECT COUNT(*) as c FROM core_currency`);
    if (parseInt((cnt.rows[0] as any).c || '0') === 0) {
      await db.execute(sql`
        INSERT INTO core_currency (code, name, decimal_places, symbol)
        VALUES ('INR', 'Indian Rupee', 2, '₹')
        ON CONFLICT (code) DO NOTHING
      `);
    }
  } catch (e: any) {
    console.warn('ensure core_currency failed', e);
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTableNew();
  await ensureTableLegacy();

  try {
    // Try new table first
    try {
      const res = await db.execute(sql`SELECT code, name, decimal_places, symbol, is_active, created_at FROM core_currency ORDER BY code`);
      return NextResponse.json({
        currencies: res.rows,
        count: res.rows.length,
        configurable: true,
        defaultCurrency: 'INR',
        code: 'FCYC',
        aliasCodes: ['CYC', 'OY03', 'FIN-CUR-CR'],
        helperCode: 'FCYC',
        functionDescription: 'Define Currencies – FCYC – Legal-safe own IP (was FCYC (legacy OY03)) – Only INR default, all other currencies (like KWD) has to be added by user via POST – core_currency',
        table: 'core_currency',
        explanation: 'Only INR default per user request – KWD, USD, EUR, etc must be added by user via POST /api/currencies. Code FCYC primary alias CYC/FCYC (legacy OY03) – 4-char MOOA F=Financials, CY=Currency, C=Create – same length as FCYC (legacy OY03) but own IP, module grouped, intuitive – sample data kept for user convenience as per requirement fresh empty but common sample data like coa, gl, tax, currencies, UoM kept.',
        legalSafe: true,
        freshEmpty: 'Only INR default, sample KWD/USD/EUR can be added by user – fresh empty but common sample kept for convenience',
        erpDefaults: [
          { code: 'INR', name: 'Indian Rupee', decimals: 2, symbol: '₹', note: 'Default – only INR default – legal-safe' },
          { code: 'KWD', name: 'Kuwaiti Dinar', decimals: 3, symbol: 'KD', note: 'Has to be added by user – not default – POST /api/currencies {code:KWD} – alias' },
          { code: 'USD', name: 'US Dollar', decimals: 2, symbol: '$', note: 'Add by user' },
          { code: 'EUR', name: 'Euro', decimals: 2, symbol: '€', note: 'Add by user' },
          { code: 'SAR', name: 'Saudi Riyal', decimals: 2, symbol: 'SR', note: 'Add by user' },
        ],
      });
    } catch (newErr: any) {
      console.warn('core_currency not yet migrated, fallback core_currency:', newErr.message);
      const res = await db.execute(sql`SELECT id, code, name, decimal_places, symbol, is_active, created_at FROM core_currency ORDER BY code`);
      return NextResponse.json({
        currencies: res.rows,
        count: res.rows.length,
        configurable: true,
        defaultCurrency: 'INR',
        code: 'FCYC',
        aliasCodes: ['CYC', 'OY03'],
        helperCode: 'OY03',
        functionDescription: 'Define Currencies – ERP FCYC (legacy OY03) – Only INR default, all other currencies (like KWD) has to be added by user via POST (legacy core_currency)',
        explanation: 'Only INR default per user request – KWD, USD, EUR, etc must be added by user via POST /api/currencies. Code FCYC (legacy OY03) (legacy, new FCYC).',
        table: 'core_currency',
        legalSafe: false,
        erpDefaults: [
          { code: 'INR', name: 'Indian Rupee', decimals: 2, symbol: '₹', note: 'Default – only INR default' },
          { code: 'KWD', name: 'Kuwaiti Dinar', decimals: 3, symbol: 'KD', note: 'Has to be added by user – not default – POST /api/currencies {code:KWD}' },
          { code: 'USD', name: 'US Dollar', decimals: 2, symbol: '$', note: 'Add by user' },
          { code: 'EUR', name: 'Euro', decimals: 2, symbol: '€', note: 'Add by user' },
          { code: 'SAR', name: 'Saudi Riyal', decimals: 2, symbol: 'SR', note: 'Add by user' },
        ],
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTableNew();
  await ensureTableLegacy();

  try {
    const body = await req.json();
    const { code, name, decimal_places, symbol } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    try {
      const res = await db.execute(sql`
        INSERT INTO core_currency (code, name, decimal_places, symbol)
        VALUES (${code.toUpperCase()}, ${name}, ${decimal_places ?? 2}, ${symbol || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, decimal_places = ${decimal_places ?? 2}, symbol = ${symbol || null}, is_active = true
        RETURNING code, name, decimal_places, symbol
      `);
      return NextResponse.json({ success: true, currency: res.rows[0], code: 'FCYC', aliasCodes: ['CYC','OY03'], message: `Currency ${code.toUpperCase()} created – FCYC legal-safe – only INR default, ${code.toUpperCase()} added by user`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('core_currency insert failed fallback core_currency:', newErr.message);
      const res = await db.execute(sql`
        INSERT INTO core_currency (code, name, decimal_places, symbol)
        VALUES (${code.toUpperCase()}, ${name}, ${decimal_places ?? 2}, ${symbol || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, decimal_places = ${decimal_places ?? 2}, symbol = ${symbol || null}, is_active = true
        RETURNING id, code, name
      `);
      return NextResponse.json({ success: true, currency: res.rows[0], code: 'FCYC', aliasCodes: ['OY03'], message: `Currency ${code.toUpperCase()} created – legacy FCYC (legacy OY03) (migrating to FCYC) – only INR default, ${code.toUpperCase()} added by user` });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTableNew();
  await ensureTableLegacy();

  try {
    const body = await req.json();
    const { id, code, name, decimal_places, symbol, is_active } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    try {
      let res;
      if (id) {
        res = await db.execute(sql`
          UPDATE core_currency SET
            code = COALESCE(${code?.toUpperCase()}, code),
            name = COALESCE(${name}, name),
            decimal_places = COALESCE(${decimal_places}, decimal_places),
            symbol = COALESCE(${symbol}, symbol),
            is_active = COALESCE(${is_active}, is_active)
          WHERE code = ${code?.toUpperCase() || id}
          RETURNING code, name
        `);
      } else {
        res = await db.execute(sql`
          UPDATE core_currency SET
            name = COALESCE(${name}, name),
            decimal_places = COALESCE(${decimal_places}, decimal_places),
            symbol = COALESCE(${symbol}, symbol),
            is_active = COALESCE(${is_active}, is_active)
          WHERE code = ${code.toUpperCase()}
          RETURNING code, name
        `);
      }
      if (res.rows.length === 0) return NextResponse.json({ error: 'Currency not found in core_currency' }, { status: 404 });
      return NextResponse.json({ success: true, currency: res.rows[0], code: 'FCYC', message: `Currency ${res.rows[0].code} updated – FCYC legal-safe` });
    } catch (newErr: any) {
      console.warn('core_currency update failed fallback core_currency:', newErr.message);
      let res;
      if (id) {
        res = await db.execute(sql`
          UPDATE core_currency SET
            code = COALESCE(${code?.toUpperCase()}, code),
            name = COALESCE(${name}, name),
            decimal_places = COALESCE(${decimal_places}, decimal_places),
            symbol = COALESCE(${symbol}, symbol),
            is_active = COALESCE(${is_active}, is_active)
          WHERE id = ${id}
          RETURNING id, code, name
        `);
      } else {
        res = await db.execute(sql`
          UPDATE core_currency SET
            name = COALESCE(${name}, name),
            decimal_places = COALESCE(${decimal_places}, decimal_places),
            symbol = COALESCE(${symbol}, symbol),
            is_active = COALESCE(${is_active}, is_active)
          WHERE code = ${code.toUpperCase()}
          RETURNING id, code, name
        `);
      }
      if (res.rows.length === 0) return NextResponse.json({ error: 'Currency not found' }, { status: 404 });
      return NextResponse.json({ success: true, currency: res.rows[0], message: `Currency ${res.rows[0].code} updated – FCYC (legacy OY03) legacy` });
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
    const code = searchParams.get('code');
    const id = searchParams.get('id');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    const checkCode = code?.toUpperCase();

    if (checkCode === 'INR') {
      try {
        const cnt = await db.execute(sql`SELECT COUNT(*) as c FROM core_currency`);
        const total = parseInt((cnt.rows[0] as any).c || '0');
        if (total <= 1) {
          return NextResponse.json({ error: 'Cannot delete INR – must have at least one currency' }, { status: 400 });
        }
      } catch {
        const cnt = await db.execute(sql`SELECT COUNT(*) as c FROM core_currency`);
        const total = parseInt((cnt.rows[0] as any).c || '0');
        if (total <= 1) {
          return NextResponse.json({ error: 'Cannot delete INR – must have at least one currency' }, { status: 400 });
        }
      }
    }

    let inUse = 0;
    try {
      if (checkCode) {
        try {
          const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM org_legal_entity WHERE currency_code = ${checkCode}`);
          inUse = parseInt((r.rows[0] as any).cnt || '0');
        } catch {
          const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM org_legal_entity WHERE currency_code = ${checkCode}`);
          inUse = parseInt((r.rows[0] as any).cnt || '0');
        }
      }
    } catch {}

    if (inUse > 0) {
      try {
        if (checkCode) await db.execute(sql`UPDATE core_currency SET is_active = false WHERE code = ${checkCode}`);
        else if (id) await db.execute(sql`UPDATE core_currency SET is_active = false WHERE code = ${id}`);
      } catch {
        if (id) await db.execute(sql`UPDATE core_currency SET is_active = false WHERE id = ${id}`);
        else await db.execute(sql`UPDATE core_currency SET is_active = false WHERE code = ${checkCode}`);
      }
      return NextResponse.json({ error: `Cannot delete – currency ${checkCode} has ${inUse} legal entities and cannot be deleted to maintain audit trail. Deactivated instead.`, code: 'HAS_TRANSACTIONS', softDeleted: true }, { status: 400 });
    }

    try {
      if (checkCode) await db.execute(sql`DELETE FROM core_currency WHERE code = ${checkCode}`);
      else if (id) await db.execute(sql`DELETE FROM core_currency WHERE code = ${id}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM core_currency WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM core_currency WHERE code = ${checkCode}`);
    }

    return NextResponse.json({ success: true, code: 'FCYC', message: `Currency ${checkCode || id} deleted – FCYC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
