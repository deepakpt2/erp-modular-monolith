import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { convertCurrency, getExchangeRate } from '@/shared/kernel/enterprise/exchangeRate';

/**
 * Exchange Rates API - TCURR Equivalent - Multi-Currency for KWD/INR
 * GET /api/exchange-rates - List rates with filters
 * POST /api/exchange-rates - Create rate from_currency to_currency valid_from rate
 * PUT /api/exchange-rates - Convert amount: ?amount=100&from=KWD&to=INR&date=2026-09-28
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
    // If amount conversion requested
    if (amount && from && to) {
      const postingDate = date ? new Date(date) : new Date();
      const result = await convertCurrency(parseFloat(amount), from, to, postingDate);
      return NextResponse.json({
      code: 'OB08',
      functionDescription: 'Exchange Rates – OB08',

        ...result,
        postingDate: postingDate.toISOString(),
        source: 'db + fallback',
        description: 'TCURR equivalent: converts using rate active on posting_date',
      });
    }

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

    // Also get company currencies
    const companies = await db.execute(sql`SELECT code, name, currency_code FROM ent_company_code WHERE code IN ('KS01','1000')`);

    return NextResponse.json({
      exchangeRates: result.rows,
      count: result.rows.length,
      companies: companies.rows,
      source: 'db',
      tcurr: 'TCURR equivalent: from_currency to_currency valid_from rate rate_type M/B/G, supports KWD<->INR, USD<->KWD/INR, EUR<->KWD/INR',
      example: 'GET /api/exchange-rates?amount=100&from=KWD&to=INR&date=2026-09-28 converts 100 KWD to INR using rate active on date',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { fromCurrency, toCurrency, validFrom, rate, rateType, companyCodeId } = body;

    if (!fromCurrency || !toCurrency || !validFrom || !rate) {
      return NextResponse.json({ error: 'fromCurrency, toCurrency, validFrom, rate required' }, { status: 400 });
    }

    if (fromCurrency === toCurrency) {
      return NextResponse.json({ error: 'fromCurrency and toCurrency must be different' }, { status: 400 });
    }

    const res = await db.execute(sql`
      INSERT INTO ent_exchange_rate (from_currency, to_currency, valid_from, rate, rate_type, company_code_id)
      VALUES (${fromCurrency}, ${toCurrency}, ${new Date(validFrom)}, ${rate}, ${rateType || 'M'}, ${companyCodeId || null})
      ON CONFLICT (from_currency, to_currency, valid_from, rate_type) DO UPDATE SET rate = ${rate}
      RETURNING id, from_currency, to_currency, valid_from, rate
    `);

    const rateRow = res.rows[0] as any;

    // Also create inverse rate automatically if not exists
    try {
      const inverseRate = (1.0 / parseFloat(rate)).toFixed(6);
      await db.execute(sql`
        INSERT INTO ent_exchange_rate (from_currency, to_currency, valid_from, rate, rate_type, company_code_id)
        VALUES (${toCurrency}, ${fromCurrency}, ${new Date(validFrom)}, ${inverseRate}, ${rateType || 'M'}, ${companyCodeId || null})
        ON CONFLICT (from_currency, to_currency, valid_from, rate_type) DO NOTHING
      `);
    } catch {}

    await db.execute(sql`
      INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description)
      VALUES ('ent_exchange_rate', ${rateRow.id}, ${`${fromCurrency}->${toCurrency}`}, 'INSERT', ${JSON.stringify(body)}::jsonb, ${`Exchange Rate CREATE TCURR: ${fromCurrency}->${toCurrency} rate ${rate} valid ${validFrom} type ${rateType||'M'}`})
    `).catch(()=>{});

    return NextResponse.json({
      success: true,
      exchangeRate: rateRow,
      message: `Exchange rate ${fromCurrency}->${toCurrency} rate ${rate} valid from ${validFrom} created, inverse auto-created`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
