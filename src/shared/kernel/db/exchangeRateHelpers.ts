/**
 * Exchange Rate Helpers – FEXC own IP – Foundation Exchange Rate Config – alias OB08
 * Implements exchange rate lookup with validity dates, inverse fallback, rate types M/B/G, spread, translation ratio, direct/indirect
 * For large org with foreign currency, critical – GR, billing, payment need exchange rates
 * Table: fin_exchange_rate – from_currency, to_currency, rate, from_date, to_date, rate_type, spread, from_factor, to_factor
 */

import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { cacheGet, cacheSet, cacheDelPattern } from '@/shared/kernel/cache/client';

async function ensureTables() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_exchange_rate (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        from_currency varchar(10) NOT NULL,
        to_currency varchar(10) NOT NULL,
        rate numeric NOT NULL,
        from_date date NOT NULL,
        to_date date,
        rate_type varchar(10) DEFAULT 'M',
        spread numeric DEFAULT 0,
        from_factor numeric DEFAULT 1,
        to_factor numeric DEFAULT 1,
        description text,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_ex_rate_from_to ON fin_exchange_rate(from_currency, to_currency)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_ex_rate_dates ON fin_exchange_rate(from_date, to_date)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_ex_rate_type ON fin_exchange_rate(rate_type)`);
  } catch (e: any) {
    console.warn('Ensure exchange rate table failed:', e.message);
  }
}

export async function getExchangeRate({
  from_currency,
  to_currency,
  posting_date,
  rate_type = 'M',
}: {
  from_currency: string;
  to_currency: string;
  posting_date: Date | string;
  rate_type?: string;
}): Promise<{ found: boolean; rate?: number; message?: string; available_rates?: any[] }> {
  await ensureTables();

  try {
    const fromCurr = from_currency.toUpperCase();
    const toCurr = to_currency.toUpperCase();
    const postDate = typeof posting_date === 'string' ? posting_date : posting_date.toISOString().split('T')[0];

    // Same currency – rate 1
    if (fromCurr === toCurr) {
      return { found: true, rate: 1, message: `Same currency ${fromCurr}→${toCurr} – rate 1` };
    }

    // Check cache first – dragonfly cache with short TTL for frequent changes
    const cacheKey = `ex:${fromCurr}:${toCurr}:${postDate}:${rate_type}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return { found: true, rate: cached.rate, message: `Exchange rate from cache – ${fromCurr}→${toCurr} ${cached.rate} valid for ${postDate} – rate_type ${rate_type}` };
    }

    // Direct lookup – from_currency → to_currency valid for posting_date and rate_type
    const directRes = await db.execute(sql`
      SELECT rate, from_date, to_date, rate_type, from_factor, to_factor, spread FROM fin_exchange_rate
      WHERE from_currency = ${fromCurr} AND to_currency = ${toCurr}
      AND from_date <= ${postDate}::date AND (to_date IS NULL OR to_date >= ${postDate}::date)
      AND (rate_type = ${rate_type} OR rate_type IS NULL)
      ORDER BY from_date DESC LIMIT 1
    `);

    if (directRes.rows.length > 0) {
      const row = directRes.rows[0] as any;
      // Apply translation ratio – e.g., 100 JPY = 0.75 USD – from_factor 100, to_factor 1, rate 0.75
      const fromFactor = Number(row.from_factor) || 1;
      const toFactor = Number(row.to_factor) || 1;
      const baseRate = Number(row.rate);
      const spread = Number(row.spread) || 0;
      // Rate calculation with factors – e.g., 100 JPY with rate 0.75 and factors 100:1 → 0.75 * (1/100) = 0.0075 per JPY
      const finalRate = (baseRate * toFactor) / fromFactor + spread;

      // Cache with short TTL – 60 sec for frequent changes
      await cacheSet(cacheKey, { rate: finalRate, from_date: row.from_date, to_date: row.to_date }, 60);

      return {
        found: true,
        rate: finalRate,
        message: `Exchange rate ${fromCurr}→${toCurr} ${finalRate} valid for ${postDate} – rate_type ${rate_type} – from ${row.from_date} to ${row.to_date || 'NULL'} – factors ${fromFactor}:${toFactor} spread ${spread} – FEXC own IP alias OB08`,
      };
    }

    // Inverse fallback – try to_currency → from_currency and invert – e.g., have INR→USD but need USD→INR → 1/rate
    const inverseRes = await db.execute(sql`
      SELECT rate, from_date, to_date, rate_type, from_factor, to_factor, spread FROM fin_exchange_rate
      WHERE from_currency = ${toCurr} AND to_currency = ${fromCurr}
      AND from_date <= ${postDate}::date AND (to_date IS NULL OR to_date >= ${postDate}::date)
      AND (rate_type = ${rate_type} OR rate_type IS NULL)
      ORDER BY from_date DESC LIMIT 1
    `);

    if (inverseRes.rows.length > 0) {
      const row = inverseRes.rows[0] as any;
      const fromFactor = Number(row.from_factor) || 1;
      const toFactor = Number(row.to_factor) || 1;
      const baseRate = Number(row.rate);
      const spread = Number(row.spread) || 0;
      const directRate = (baseRate * toFactor) / fromFactor + spread;
      const inverseRate = directRate !== 0 ? 1 / directRate : 0;

      if (inverseRate !== 0) {
        await cacheSet(cacheKey, { rate: inverseRate, from_date: row.from_date, to_date: row.to_date }, 60);

        return {
          found: true,
          rate: inverseRate,
          message: `Exchange rate ${fromCurr}→${toCurr} via inverse ${toCurr}→${fromCurr} ${directRate} → inverse ${inverseRate} valid for ${postDate} – rate_type ${rate_type} – FEXC own IP alias OB08`,
        };
      }
    }

    // No rate found – fail with reason and available rates
    const availableRes = await db.execute(sql`
      SELECT from_currency, to_currency, rate, from_date, to_date, rate_type FROM fin_exchange_rate
      WHERE (from_currency = ${fromCurr} AND to_currency = ${toCurr}) OR (from_currency = ${toCurr} AND to_currency = ${fromCurr})
      ORDER BY from_date DESC LIMIT 10
    `);

    const availableRates = availableRes.rows as any[];

    return {
      found: false,
      message: `Exchange rate ${fromCurr}→${toCurr} not found for posting date ${postDate} – rate_type ${rate_type} – maintain via FEXC own IP (alias OB08) – from_currency ${fromCurr} to_currency ${toCurr} rate from_date to_date – e.g., ${fromCurr}→${toCurr} 83.5 from 2026-09-16 to 2026-09-30 – current rates: ${availableRates.map((r: any) => `${r.from_currency}→${r.to_currency} ${r.rate} valid ${r.from_date} to ${r.to_date || 'NULL'} type ${r.rate_type}`).join(', ') || 'none'} – no rate covers ${postDate} – please add rate for missing date range – industry standard – FEXC own IP alias OB08 – cache invalidated on update – KDM exchange diff at payment if rate changes`,
      available_rates: availableRates,
    };
  } catch (e: any) {
    return {
      found: false,
      message: `Exchange rate lookup failed: ${e.message} – maintain via FEXC own IP alias OB08`,
    };
  }
}

export async function invalidateExchangeRateCache() {
  await cacheDelPattern('ex:*');
}
