import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Posting Period & Fiscal Year Helpers – SAP-like OB29/OBBO/OB52 enforcement
 * Legal-safe own IP – FPPE/FPPC/FFYC
 * 
 * Functions:
 * - getFiscalYearPeriodFromDate(companyCode, postingDate): Calculates fiscal year and period from posting date via fiscal calendar
 * - isPostingPeriodOpen(variantCode, accountType, period, year): Checks if period is open in OB52
 * - enforcePostingPeriod(companyCode, postingDate, accountType): Full enforcement – returns error if closed
 */

export interface FiscalYearPeriod {
  fiscal_year: number;
  fiscal_period: number;
  fiscal_calendar_code: string;
  posting_period_variant_code: string;
  calendar_year: number;
  calendar_month: number;
}

export async function getFiscalCalendarForCompany(companyCode: string): Promise<{ fiscal_calendar_code: string; posting_period_variant_code: string; start_month: number; end_month: number; year_shift: number; from_date: string | null; to_date: string | null } | null> {
  try {
    // Try org_legal_entity with fiscal_calendar_code and posting_period_variant_code
    const res = await db.execute(sql`
      SELECT fiscal_calendar_code, posting_period_variant_code, 
             (SELECT start_month FROM fin_fiscal_calendar WHERE code = org_legal_entity.fiscal_calendar_code LIMIT 1) as start_month,
             (SELECT end_month FROM fin_fiscal_calendar WHERE code = org_legal_entity.fiscal_calendar_code LIMIT 1) as end_month,
             (SELECT year_shift FROM fin_fiscal_calendar WHERE code = org_legal_entity.fiscal_calendar_code LIMIT 1) as year_shift,
             (SELECT from_date FROM fin_fiscal_calendar WHERE code = org_legal_entity.fiscal_calendar_code LIMIT 1) as from_date,
             (SELECT to_date FROM fin_fiscal_calendar WHERE code = org_legal_entity.fiscal_calendar_code LIMIT 1) as to_date
      FROM org_legal_entity 
      WHERE code = ${companyCode} LIMIT 1
    `);
    if (res.rows.length > 0) {
      const row = res.rows[0] as any;
      return {
        fiscal_calendar_code: row.fiscal_calendar_code || 'K4',
        posting_period_variant_code: row.posting_period_variant_code || '1000',
        start_month: row.start_month || 4,
        end_month: row.end_month || 3,
        year_shift: row.year_shift || 0,
        from_date: row.from_date,
        to_date: row.to_date
      };
    }

    // Fallback: try ent_company_code
    try {
      const res2 = await db.execute(sql`SELECT fiscal_year_variant as fiscal_calendar_code FROM ent_company_code WHERE code = ${companyCode} LIMIT 1`);
      if (res2.rows.length > 0) {
        return {
          fiscal_calendar_code: (res2.rows[0] as any).fiscal_calendar_code || 'K4',
          posting_period_variant_code: '1000',
          start_month: 4,
          end_month: 3,
          year_shift: 0,
          from_date: null,
          to_date: null
        };
      }
    } catch {}

    // Default K4 April-March
    return {
      fiscal_calendar_code: 'K4',
      posting_period_variant_code: '1000',
      start_month: 4,
      end_month: 3,
      year_shift: 0,
      from_date: null,
      to_date: null
    };
  } catch (e: any) {
    console.warn('getFiscalCalendarForCompany failed:', e.message);
    return {
      fiscal_calendar_code: 'K4',
      posting_period_variant_code: '1000',
      start_month: 4,
      end_month: 3,
      year_shift: 0,
      from_date: null,
      to_date: null
    };
  }
}

export async function getFiscalYearPeriodFromDate(companyCode: string, postingDate: Date | string): Promise<FiscalYearPeriod> {
  const date = typeof postingDate === 'string' ? new Date(postingDate) : postingDate;
  const calendarYear = date.getFullYear();
  const calendarMonth = date.getMonth() + 1;

  const cal = await getFiscalCalendarForCompany(companyCode);
  const startMonth = cal?.start_month || 4; // K4 April

  // K4 logic: April-March India
  // If start_month = 4 (April), then:
  // Apr-Dec = same fiscal year, Jan-Mar = previous fiscal year? Actually for K4 April-March:
  // Posting date 2026-04-15 → FY 2026 Period 01
  // Posting date 2027-03-15 → FY 2026 Period 12
  // Posting date 2026-01-15 → FY 2025 Period 10 (Jan is 10th month of FY starting previous April)
  // V3 Calendar Year: Jan-Dec, start_month 1 → FY = calendar year, period = calendar month

  let fiscalYear: number;
  let fiscalPeriod: number;

  if (startMonth === 1) {
    // Calendar year V3
    fiscalYear = calendarYear;
    fiscalPeriod = calendarMonth;
  } else {
    // Non-calendar like K4 April-March
    if (calendarMonth >= startMonth) {
      // Apr-Dec belongs to same fiscal year
      fiscalYear = calendarYear;
      fiscalPeriod = calendarMonth - startMonth + 1;
    } else {
      // Jan-Mar belongs to previous fiscal year
      fiscalYear = calendarYear - 1;
      fiscalPeriod = calendarMonth + (12 - startMonth) + 1;
    }
  }

  return {
    fiscal_year: fiscalYear,
    fiscal_period: fiscalPeriod,
    fiscal_calendar_code: cal?.fiscal_calendar_code || 'K4',
    posting_period_variant_code: cal?.posting_period_variant_code || '1000',
    calendar_year: calendarYear,
    calendar_month: calendarMonth
  };
}

export async function isPostingPeriodOpen(variantCode: string, accountType: string, period: number, year: number): Promise<{ open: boolean; message?: string; variant_exists: boolean }> {
  try {
    // Try fin_posting_calendar_period first
    const res = await db.execute(sql`
      SELECT is_open, from_period, to_period, from_year, to_year, account_type
      FROM fin_posting_calendar_period p
      JOIN fin_posting_calendar c ON p.posting_calendar_id = c.id
      WHERE c.code = ${variantCode.toUpperCase()}
      AND (p.account_type = ${accountType}::fin_posting_account_type OR p.account_type = 'ALL'::fin_posting_account_type OR p.account_type = '+'::fin_posting_account_type)
      AND ${period} BETWEEN p.from_period AND p.to_period
      AND (${year} BETWEEN COALESCE(p.from_year, ${year}) AND COALESCE(p.to_year, ${year}) OR p.from_year IS NULL)
      ORDER BY 
        CASE WHEN p.account_type = ${accountType}::fin_posting_account_type THEN 0 ELSE 1 END,
        p.from_period DESC
      LIMIT 1
    `);

    if (res.rows.length > 0) {
      const row = res.rows[0] as any;
      return {
        open: row.is_open === true || row.is_open === 't',
        message: row.is_open ? `Period ${period}/${year} open for ${accountType} in variant ${variantCode}` : `Period ${period}/${year} CLOSED for ${accountType} in variant ${variantCode} – OB52`,
        variant_exists: true
      };
    }

    // Fallback to legacy fi_posting_period
    try {
      const legacyRes = await db.execute(sql`
        SELECT * FROM fi_posting_period
        WHERE variant_code = ${variantCode.toUpperCase()}
        AND (account_type = ${accountType} OR account_type = '+' OR account_type = 'ALL')
        AND ${period} BETWEEN from_period AND to_period
        AND ${year} BETWEEN from_year AND to_year
        LIMIT 1
      `);
      if (legacyRes.rows.length > 0) {
        return {
          open: true, // Legacy table doesn't have is_open, assume open if record exists
          message: `Period ${period}/${year} found open (legacy) for ${accountType} in ${variantCode}`,
          variant_exists: true
        };
      }
    } catch {}

    // If no record found, check if variant exists at all
    const varCheck = await db.execute(sql`SELECT id FROM fin_posting_calendar WHERE code = ${variantCode.toUpperCase()} LIMIT 1`);
    if (varCheck.rows.length === 0) {
      const varCheck2 = await db.execute(sql`SELECT id FROM fi_posting_period_variant WHERE code = ${variantCode.toUpperCase()} LIMIT 1`);
      if (varCheck2.rows.length === 0) {
        return {
          open: true, // If variant doesn't exist, allow posting – don't block fresh deployments
          message: `Variant ${variantCode} not found – allowing posting (fresh deployment) – create variant via OBBO`,
          variant_exists: false
        };
      }
    }

    // Variant exists but no open period record for this period/year/account type → closed
    return {
      open: false,
      message: `Posting period ${period}/${year} NOT open for account type ${accountType} in variant ${variantCode} – OB52 – Create open period via POST /api/posting-period-variants with variant_code=${variantCode}, account_type=${accountType}, from_period=${period}, from_year=${year}, to_period=${period}, to_year=${year}, is_open=true`,
      variant_exists: true
    };
  } catch (e: any) {
    console.warn('isPostingPeriodOpen failed:', e.message);
    // On error, allow posting to not block fresh deployments
    return {
      open: true,
      message: `Posting period check failed (${e.message}) – allowing posting to not block – OB52`,
      variant_exists: false
    };
  }
}

export async function enforcePostingPeriod(params: {
  company_code: string;
  posting_date: Date | string;
  account_type?: string; // +, A, D, K, M, S, V, ALL
}): Promise<{ allowed: boolean; fiscal_year: number; fiscal_period: number; message: string; variant_code: string }> {
  const accountType = params.account_type || '+';
  const fiscalInfo = await getFiscalYearPeriodFromDate(params.company_code, params.posting_date);
  
  const openCheck = await isPostingPeriodOpen(fiscalInfo.posting_period_variant_code, accountType, fiscalInfo.fiscal_period, fiscalInfo.fiscal_year);

  if (!openCheck.open && openCheck.variant_exists) {
    return {
      allowed: false,
      fiscal_year: fiscalInfo.fiscal_year,
      fiscal_period: fiscalInfo.fiscal_period,
      message: `❌ Posting period ${fiscalInfo.fiscal_period}/${fiscalInfo.fiscal_year} CLOSED for account type ${accountType} in variant ${fiscalInfo.posting_period_variant_code} (fiscal calendar ${fiscalInfo.fiscal_calendar_code}) – OB52 – ${openCheck.message}`,
      variant_code: fiscalInfo.posting_period_variant_code
    };
  }

  return {
    allowed: true,
    fiscal_year: fiscalInfo.fiscal_year,
    fiscal_period: fiscalInfo.fiscal_period,
    message: `✅ Posting period ${fiscalInfo.fiscal_period}/${fiscalInfo.fiscal_year} OPEN for ${accountType} – variant ${fiscalInfo.posting_period_variant_code}, fiscal ${fiscalInfo.fiscal_calendar_code} – ${openCheck.message}`,
    variant_code: fiscalInfo.posting_period_variant_code
  };
}
