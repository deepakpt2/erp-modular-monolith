import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Exchange Rates API – Legal-safe own IP – Module 4
 * New: core_exchange_rate (was ent_exchange_rate) – rateType AVG/BUY/SELL/SPOT (was M/B/G) – INR primary default
 * Helper code: FEXC Exchange Rate Create (alias EXC, OB08, FIN-EX-CR) – 4-char MOOA F=Financials, EX=Exchange, C=Create
 * Fallback to legacy ent_exchange_rate
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const date = searchParams.get('date');
  const amount = searchParams.get('amount');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    // If amount conversion requested – try new table
    if (amount && from && to) {
      const postingDate = date ? new Date(date) : new Date();
      try {
        const rateRes = await db.execute(sql`
          SELECT rate FROM core_exchange_rate
          WHERE from_currency = ${from} AND to_currency = ${to} AND valid_from <= ${postingDate}
          ORDER BY valid_from DESC LIMIT 1
        `);
        if (rateRes.rows.length > 0) {
          const rate = parseFloat((rateRes.rows[0] as any).rate);
          const converted = parseFloat(amount) * rate;
          return NextResponse.json({
            code: 'FEXC',
            aliasCodes: ['EXC', 'OB08'],
            functionDescription: 'Exchange Rates – FEXC legal-safe (was OB08) – core_exchange_rate',
            from_currency: from,
            to_currency: to,
            amount: parseFloat(amount),
            rate,
            converted,
            postingDate: postingDate.toISOString(),
            source: 'db-new core_exchange_rate',
            legalSafe: true,
          });
        }
      } catch {}
      // Fallback legacy
      try {
        const rateRes = await db.execute(sql`
          SELECT rate FROM ent_exchange_rate
          WHERE from_currency = ${from} AND to_currency = ${to} AND valid_from <= ${postingDate}
          ORDER BY valid_from DESC LIMIT 1
        `);
        if (rateRes.rows.length > 0) {
          const rate = parseFloat((rateRes.rows[0] as any).rate);
          const converted = parseFloat(amount) * rate;
          return NextResponse.json({
            code: 'FEXC',
            aliasCodes: ['OB08'],
            from_currency: from,
            to_currency: to,
            amount: parseFloat(amount),
            rate,
            converted,
            postingDate: postingDate.toISOString(),
            source: 'db-legacy ent_exchange_rate',
            legalSafe: false,
          });
        }
      } catch {}
      // No rate found – return 1:1 fallback
      return NextResponse.json({
        code: 'FEXC',
        from_currency: from,
        to_currency: to,
        amount: parseFloat(amount),
        rate: 1,
        converted: parseFloat(amount),
        postingDate: postingDate.toISOString(),
        source: 'fallback 1:1 – no rate found',
        warning: `No rate ${from}->${to} for ${postingDate.toISOString()}, using 1:1`,
      });
    }

    let exchangeRows: any[] = [];
    let source = 'db-new';
    let table = 'core_exchange_rate';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT er.*, cc.code as company_code
        FROM core_exchange_rate er
        LEFT JOIN ent_company_code cc ON er.company_code_id = cc.id
        WHERE 1=1
      `;
      if (from) query = sql`${query} AND er.from_currency = ${from}`;
      if (to) query = sql`${query} AND er.to_currency = ${to}`;
      if (date) query = sql`${query} AND er.valid_from <= ${new Date(date)}`;
      query = sql`${query} ORDER BY er.valid_from DESC, er.from_currency, er.to_currency LIMIT ${limit}`;

      const result = await db.execute(query);
      exchangeRows = result.rows as any[];
    } catch (newErr: any) {
      console.warn('core_exchange_rate not yet, fallback ent_exchange_rate:', newErr.message);
      source = 'db-legacy';
      table = 'ent_exchange_rate';
      legalSafe = false;

      let query = sql`
        SELECT er.*, cc.code as company_code
        FROM ent_exchange_rate er
        LEFT JOIN ent_company_code cc ON er.company_code_id = cc.id
        WHERE 1=1
      `;
      if (from) query = sql`${query} AND er.from_currency = ${from}`;
      if (to) query = sql`${query} AND er.to_currency = ${to}`;
      if (date) query = sql`${query} AND er.valid_from <= ${new Date(date)}`;
      query = sql`${query} ORDER BY er.valid_from DESC, er.from_currency, er.to_currency LIMIT ${limit}`;

      const result = await db.execute(query);
      exchangeRows = result.rows as any[];
    }

    let companies: any[] = [];
    try {
      const c = await db.execute(sql`SELECT code, name, currency_code FROM ent_company_code WHERE code IN ('KS01','1000','IND1') LIMIT 20`);
      companies = c.rows;
    } catch {}

    return NextResponse.json({
      exchangeRates: exchangeRows,
      count: exchangeRows.length,
      companies,
      configurable: true,
      code: 'FEXC',
      aliasCodes: ['EXC', 'OB08', 'FIN-EX-CR'],
      helperCode: 'FEXC',
      table,
      source,
      legalSafe,
      functionDescription: 'Exchange Rates – FEXC legal-safe own IP (was OB08) – Multi-Currency for INR/KWD – core_exchange_rate AVG/BUY/SELL/SPOT (was M/B/G)',
      erpDefaults: [
        { from: 'INR', to: 'USD', rate: 0.012, type: 'AVG', helperCode: 'FEXC', note: 'Sample kept – INR primary' },
        { from: 'USD', to: 'INR', rate: 83.5, type: 'AVG', helperCode: 'FEXC' },
        { from: 'KWD', to: 'INR', rate: 272, type: 'AVG', helperCode: 'FEXC' },
        { from: 'INR', to: 'KWD', rate: 0.00367, type: 'AVG', helperCode: 'FEXC' },
      ],
      explanation: 'Exchange rates legal-safe core_exchange_rate – rateType AVG/BUY/SELL/SPOT (was M/B/G) – INR primary – Code FEXC primary alias EXC/OB08 – 4-char MOOA F=Financials EX=Exchange C=Create – module grouped intuitive – sample data kept for user convenience per requirement fresh empty but common sample data like coa, gl, tax, currencies, UoM kept.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, exchangeRates: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { from_currency, to_currency, rate, valid_from, rate_type, company_code } = body;
    if (!from_currency || !to_currency || !rate) return NextResponse.json({ error: 'from_currency, to_currency, rate required' }, { status: 400 });

    let companyCodeId = null;
    if (company_code) {
      try {
        const cc = await db.execute(sql`SELECT id FROM ent_company_code WHERE code = ${company_code} LIMIT 1`);
        if (cc.rows.length > 0) companyCodeId = (cc.rows[0] as any).id;
      } catch {}
    }

    try {
      const res = await db.execute(sql`
        INSERT INTO core_exchange_rate (company_code_id, from_currency, to_currency, rate, valid_from, rate_type)
        VALUES (${companyCodeId}, ${from_currency.toUpperCase()}, ${to_currency.toUpperCase()}, ${rate}, ${valid_from ? new Date(valid_from) : new Date()}, ${rate_type || 'AVG'}::core_exchange_rate_type)
        RETURNING id, from_currency, to_currency, rate
      `);
      return NextResponse.json({ success: true, exchangeRate: res.rows[0], code: 'FEXC', message: `Exchange rate ${from_currency}->${to_currency} ${rate} created – FEXC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('core_exchange_rate insert failed fallback ent_exchange_rate:', newErr.message);
      const res = await db.execute(sql`
        INSERT INTO ent_exchange_rate (company_code_id, from_currency, to_currency, rate, valid_from, rate_type)
        VALUES (${companyCodeId}, ${from_currency.toUpperCase()}, ${to_currency.toUpperCase()}, ${rate}, ${valid_from ? new Date(valid_from) : new Date()}, ${rate_type || 'M'}::exchange_rate_type)
        RETURNING id, from_currency, to_currency, rate
      `);
      return NextResponse.json({ success: true, exchangeRate: res.rows[0], code: 'FEXC', message: `Exchange rate ${from_currency}->${to_currency} ${rate} created – OB08 legacy (migrating to FEXC)`, legalSafe: false });
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
    const { id, rate } = body;
    if (!id || rate == null) return NextResponse.json({ error: 'id and rate required' }, { status: 400 });

    try {
      const res = await db.execute(sql`UPDATE core_exchange_rate SET rate = ${rate}, updated_at = NOW() WHERE id = ${id} RETURNING id, from_currency, to_currency, rate`);
      if (res.rows.length === 0) throw new Error('Not found in core_exchange_rate');
      return NextResponse.json({ success: true, exchangeRate: res.rows[0], code: 'FEXC', message: `Rate updated – FEXC legal-safe` });
    } catch {
      const res = await db.execute(sql`UPDATE ent_exchange_rate SET rate = ${rate} WHERE id = ${id} RETURNING id, from_currency, to_currency, rate`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Rate not found' }, { status: 404 });
      return NextResponse.json({ success: true, exchangeRate: res.rows[0], message: `Rate updated – OB08 legacy` });
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
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    try {
      await db.execute(sql`DELETE FROM core_exchange_rate WHERE id = ${id}`);
    } catch {
      await db.execute(sql`DELETE FROM ent_exchange_rate WHERE id = ${id}`);
    }

    return NextResponse.json({ success: true, code: 'FEXC', message: `Rate ${id} deleted – FEXC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
