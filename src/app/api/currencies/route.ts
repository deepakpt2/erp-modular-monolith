import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Currencies API – Only INR default, all other currencies (like KWD) has to be added by user
 * Code OY03 – Define Currencies
 * Configurable: POST new currency e.g., KWD, USD, EUR
 */

async function ensureTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ent_currency (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(3) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        decimal_places INTEGER DEFAULT 2,
        symbol VARCHAR(10),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    // Seed only INR as default per user request
    const cnt = await db.execute(sql`SELECT COUNT(*) as c FROM ent_currency`);
    if (parseInt((cnt.rows[0] as any).c || '0') === 0) {
      await db.execute(sql`
        INSERT INTO ent_currency (code, name, decimal_places, symbol)
        VALUES ('INR', 'Indian Rupee', 2, '₹')
        ON CONFLICT (code) DO NOTHING
      `);
    }
  } catch (e) {
    console.warn('ensure ent_currency failed', e);
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTable();

  try {
    const res = await db.execute(sql`SELECT id, code, name, decimal_places, symbol, is_active, created_at FROM ent_currency ORDER BY code`);
    return NextResponse.json({
      currencies: res.rows,
      count: res.rows.length,
      configurable: true,
      defaultCurrency: 'INR', helperCode: 'OY03',
      functionDescription: 'Define Currencies – ERP OY03 – Only INR default, all other currencies (like KWD) has to be added by user via POST',
      explanation: 'Only INR default per user request – KWD, USD, EUR, etc must be added by user via POST /api/currencies. Code OY03.',
      erpDefaults: [
        { code: 'INR', name: 'Indian Rupee', decimals: 2, symbol: '₹', note: 'Default – only INR default' },
        { code: 'KWD', name: 'Kuwaiti Dinar', decimals: 3, symbol: 'KD', note: 'Has to be added by user – not default – POST /api/currencies {code:KWD}' },
        { code: 'USD', name: 'US Dollar', decimals: 2, symbol: '$', note: 'Add by user' },
        { code: 'EUR', name: 'Euro', decimals: 2, symbol: '€', note: 'Add by user' },
        { code: 'SAR', name: 'Saudi Riyal', decimals: 2, symbol: 'SR', note: 'Add by user' },
      ],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTable();

  try {
    const body = await req.json();
    const { code, name, decimal_places, symbol } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    const res = await db.execute(sql`
      INSERT INTO ent_currency (code, name, decimal_places, symbol)
      VALUES (${code.toUpperCase()}, ${name}, ${decimal_places ?? 2}, ${symbol || null})
      ON CONFLICT (code) DO UPDATE SET name = ${name}, decimal_places = ${decimal_places ?? 2}, symbol = ${symbol || null}, is_active = true
      RETURNING id, code, name
    `);

    return NextResponse.json({ success: true, currency: res.rows[0], message: `Currency ${code.toUpperCase()} created – only INR default, ${code.toUpperCase()} added by user – OY03` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTable();

  try {
    const body = await req.json();
    const { id, code, name, decimal_places, symbol, is_active } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    let res;
    if (id) {
      res = await db.execute(sql`
        UPDATE ent_currency SET
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
        UPDATE ent_currency SET
          name = COALESCE(${name}, name),
          decimal_places = COALESCE(${decimal_places}, decimal_places),
          symbol = COALESCE(${symbol}, symbol),
          is_active = COALESCE(${is_active}, is_active)
        WHERE code = ${code.toUpperCase()}
        RETURNING id, code, name
      `);
    }

    if (res.rows.length === 0) return NextResponse.json({ error: 'Currency not found' }, { status: 404 });
    return NextResponse.json({ success: true, currency: res.rows[0], message: `Currency ${res.rows[0].code} updated – OY03` });
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

    // Security: prevent deleting INR if it's the only default? Allow but warn
    if (checkCode === 'INR') {
      const cnt = await db.execute(sql`SELECT COUNT(*) as c FROM ent_currency`);
      const total = parseInt((cnt.rows[0] as any).c || '0');
      if (total <= 1) {
        return NextResponse.json({ error: 'Cannot delete INR – must have at least one currency' }, { status: 400 });
      }
    }

    // Check if currency in use by company codes
    let inUse = 0;
    try {
      if (checkCode) {
        const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM ent_company_code WHERE currency_code = ${checkCode}`);
        inUse = parseInt((r.rows[0] as any).cnt || '0');
      }
    } catch {}

    if (inUse > 0) {
      if (id) await db.execute(sql`UPDATE ent_currency SET is_active = false WHERE id = ${id}`);
      else await db.execute(sql`UPDATE ent_currency SET is_active = false WHERE code = ${checkCode}`);
      return NextResponse.json({ error: `Cannot delete – currency ${checkCode} has ${inUse} company codes and cannot be deleted to maintain audit trail. Deactivated instead.`, code: 'HAS_TRANSACTIONS', softDeleted: true }, { status: 400 });
    }

    if (id) await db.execute(sql`DELETE FROM ent_currency WHERE id = ${id}`);
    else await db.execute(sql`DELETE FROM ent_currency WHERE code = ${checkCode}`);

    return NextResponse.json({ success: true, message: `Currency ${checkCode || id} deleted – OY03` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
