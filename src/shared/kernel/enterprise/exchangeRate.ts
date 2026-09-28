import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Multi-Currency Exchange Rates - TCURR Equivalent
 * Table: ent_exchange_rate (from_currency, to_currency, valid_from, rate, rateType)
 * Supports KWD <-> INR, USD <-> KWD/INR, EUR <-> KWD/INR etc
 */

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  validFrom: Date;
  rate: number;
  rateType: string;
}

export async function getExchangeRate(fromCurrency: string, toCurrency: string, postingDate: Date, rateType: string = 'M'): Promise<number> {
  if (fromCurrency === toCurrency) return 1.0;

  try {
    // Try direct rate fromCurrency -> toCurrency where valid_from <= postingDate ORDER BY valid_from DESC
    const directRes = await db.execute(sql`
      SELECT rate, valid_from
      FROM ent_exchange_rate
      WHERE from_currency = ${fromCurrency}
        AND to_currency = ${toCurrency}
        AND rate_type = ${rateType}
        AND valid_from <= ${postingDate}
      ORDER BY valid_from DESC
      LIMIT 1
    `);

    if (directRes.rows.length > 0) {
      return parseFloat((directRes.rows[0] as any).rate);
    }

    // Try inverse rate toCurrency -> fromCurrency, then invert
    const inverseRes = await db.execute(sql`
      SELECT rate, valid_from
      FROM ent_exchange_rate
      WHERE from_currency = ${toCurrency}
        AND to_currency = ${fromCurrency}
        AND rate_type = ${rateType}
        AND valid_from <= ${postingDate}
      ORDER BY valid_from DESC
      LIMIT 1
    `);

    if (inverseRes.rows.length > 0) {
      const inverseRate = parseFloat((inverseRes.rows[0] as any).rate);
      if (inverseRate !== 0) return 1.0 / inverseRate;
    }

    // Try via USD as intermediate: from -> USD -> to
    // For example KWD->INR via USD: KWD->USD then USD->INR
    const viaUsd1 = await db.execute(sql`
      SELECT rate FROM ent_exchange_rate
      WHERE from_currency = ${fromCurrency} AND to_currency = 'USD' AND valid_from <= ${postingDate}
      ORDER BY valid_from DESC LIMIT 1
    `);
    const viaUsd2 = await db.execute(sql`
      SELECT rate FROM ent_exchange_rate
      WHERE from_currency = 'USD' AND to_currency = ${toCurrency} AND valid_from <= ${postingDate}
      ORDER BY valid_from DESC LIMIT 1
    `);
    if (viaUsd1.rows.length > 0 && viaUsd2.rows.length > 0) {
      const r1 = parseFloat((viaUsd1.rows[0] as any).rate);
      const r2 = parseFloat((viaUsd2.rows[0] as any).rate);
      return r1 * r2;
    }

    // Fallback hardcoded rates for KSPL setup
    const fallbackRates: Record<string, Record<string, number>> = {
      'KWD': { 'INR': 270.0, 'USD': 3.25, 'EUR': 3.0 },
      'INR': { 'KWD': 0.0037, 'USD': 0.012, 'EUR': 0.011 },
      'USD': { 'KWD': 0.307, 'INR': 83.0, 'EUR': 0.92 },
      'EUR': { 'KWD': 0.333, 'INR': 90.0, 'USD': 1.08 },
    };

    if (fallbackRates[fromCurrency]?.[toCurrency]) {
      console.warn(`Using fallback exchange rate ${fromCurrency}->${toCurrency}: ${fallbackRates[fromCurrency][toCurrency]} for ${postingDate.toISOString()}`);
      return fallbackRates[fromCurrency][toCurrency];
    }

    console.warn(`No exchange rate found for ${fromCurrency}->${toCurrency} on ${postingDate.toISOString()}, using 1.0`);
    return 1.0;
  } catch (e: any) {
    console.warn(`Exchange rate lookup failed for ${fromCurrency}->${toCurrency}, using fallback:`, e.message);
    const fallbackRates: Record<string, Record<string, number>> = {
      'KWD': { 'INR': 270.0, 'USD': 3.25 },
      'INR': { 'KWD': 0.0037, 'USD': 0.012 },
      'USD': { 'KWD': 0.307, 'INR': 83.0 },
    };
    return fallbackRates[fromCurrency]?.[toCurrency] || 1.0;
  }
}

export async function convertCurrency(amount: number, fromCurrency: string, toCurrency: string, postingDate: Date, rateType: string = 'M'): Promise<{ convertedAmount: number; rate: number; fromCurrency: string; toCurrency: string }> {
  if (fromCurrency === toCurrency) {
    return { convertedAmount: amount, rate: 1.0, fromCurrency, toCurrency };
  }

  const rate = await getExchangeRate(fromCurrency, toCurrency, postingDate, rateType);
  const convertedAmount = amount * rate;

  return { convertedAmount, rate, fromCurrency, toCurrency };
}

// Helper for FI document creation with multi-currency
export async function createFiDocumentWithCurrency(params: {
  companyCodeId: string;
  companyCurrency: string; // Base currency of company code
  docType: string;
  postingDate: Date;
  documentDate: Date;
  totalAmount: number;
  transactionCurrency: string; // Currency of transaction (e.g., USD invoice)
  reference?: string;
  headerText?: string;
  referenceDocType?: string;
  referenceDocId?: string;
  referenceDocNumber?: string;
  tx: any; // Drizzle transaction
}): Promise<{ fiDocumentId: string; documentNumber: string; convertedAmount: number; rate: number }> {
  const { companyCodeId, companyCurrency, docType, postingDate, documentDate, totalAmount, transactionCurrency, reference, headerText, referenceDocType, referenceDocId, referenceDocNumber, tx } = params;

  // Convert to company code base currency if different
  let convertedAmount = totalAmount;
  let rate = 1.0;
  if (transactionCurrency !== companyCurrency) {
    const conv = await convertCurrency(totalAmount, transactionCurrency, companyCurrency, postingDate);
    convertedAmount = conv.convertedAmount;
    rate = conv.rate;
  }

  // Get next FI doc number with FOR UPDATE locking
  const year = postingDate.getFullYear();
  const fiNumRes = await tx.execute(sql`
    SELECT id, prefix, current_number, from_number, to_number
    FROM ent_number_range
    WHERE object_type = 'FI_DOC'
      AND (company_code_id = ${companyCodeId} OR company_code_id IS NULL)
      AND year = ${year}
    ORDER BY company_code_id DESC NULLS LAST
    FOR UPDATE
    LIMIT 1
  `);

  let docNumber = `FI${1000000000 + Date.now() % 1000000000}`;
  if (fiNumRes.rows.length > 0) {
    const row = fiNumRes.rows[0] as any;
    const current = parseInt(row.current_number) + 1;
    docNumber = `${row.prefix || 'FI'}${current}`;
    await tx.execute(sql`UPDATE ent_number_range SET current_number = ${current} WHERE id = ${row.id}`);
  }

  const fiRes = await tx.execute(sql`
    INSERT INTO fi_document (document_number, company_code_id, doc_type, posting_date, document_date, reference, header_text, total_debit, total_credit, currency, status, reference_doc_type, reference_doc_id, reference_doc_number)
    VALUES (${docNumber}, ${companyCodeId}, ${docType}, ${postingDate}, ${documentDate}, ${reference || null}, ${headerText || null}, ${convertedAmount}, ${convertedAmount}, ${companyCurrency}, 'POSTED', ${referenceDocType || null}, ${referenceDocId || null}, ${referenceDocNumber || null})
    RETURNING id, document_number
  `);

  const fiDocumentId = (fiRes.rows[0] as any).id;

  // Log conversion in audit if cross-currency
  if (transactionCurrency !== companyCurrency) {
    await tx.execute(sql`
      INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description)
      VALUES ('fi_document', ${fiDocumentId}, ${docNumber}, 'INSERT', ${JSON.stringify({ originalAmount: totalAmount, originalCurrency: transactionCurrency, convertedAmount, companyCurrency, rate, postingDate })}::jsonb, ${`FI Cross-Currency: ${totalAmount} ${transactionCurrency} -> ${convertedAmount.toFixed(3)} ${companyCurrency} @ rate ${rate} on ${postingDate.toISOString().substring(0,10)} Doc ${docNumber}`})
    `).catch(()=>{});
  }

  return { fiDocumentId, documentNumber: docNumber, convertedAmount, rate };
}
