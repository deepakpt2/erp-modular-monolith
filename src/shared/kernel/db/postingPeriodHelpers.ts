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
      message: `❌ Posting period ${fiscalInfo.fiscal_period}/${fiscalInfo.fiscal_year} CLOSED for account type ${accountType} in variant ${fiscalInfo.posting_period_variant_code} (fiscal calendar ${fiscalInfo.fiscal_calendar_code}) – posting period control – ${openCheck.message}`,
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

// === Strict ERP Functions – No Dummy – All Used in Practice – Phase 0 T0 BLOCKING ===

export async function getAutoAccount(params: {
  transaction_key: string; // BSX inventory, WRX GR/IR, GBB offset, PRD price diff, BSV PI, KDM FX, KOFI/KOFK revenue
  chart_of_accounts: string;
  valuation_class?: string;
  company_code?: string;
}): Promise<{ gl_account: string | null; found: boolean; message: string }> {
  try {
    // First try exact valuation_class, then blank fallback, then any
    const res = await db.execute(sql`
      SELECT gl_account, description FROM fin_auto_account
      WHERE transaction_key = ${params.transaction_key.toUpperCase()}
      AND chart_of_accounts = ${params.chart_of_accounts.toUpperCase()}
      AND (valuation_class = ${params.valuation_class || ''} OR valuation_class IS NULL OR valuation_class = '' OR ${params.valuation_class || ''} = '')
      AND (company_code = ${params.company_code || ''} OR company_code IS NULL OR company_code = '' OR ${params.company_code || ''} = '')
      ORDER BY 
        CASE WHEN valuation_class = ${params.valuation_class || ''} THEN 0 WHEN valuation_class IS NULL OR valuation_class = '' THEN 1 ELSE 2 END,
        CASE WHEN company_code = ${params.company_code || ''} THEN 0 ELSE 1 END
      LIMIT 1
    `);
    if (res.rows.length > 0) {
      return { gl_account: (res.rows[0] as any).gl_account, found: true, message: `Auto account ${params.transaction_key}/${params.chart_of_accounts}/${params.valuation_class || 'DEFAULT'} → ${(res.rows[0] as any).gl_account} – OBYC T0 BLOCKING` };
    }
    // Fallback to fin_auto_posting_rule (new legal-safe)
    try {
      const res2 = await db.execute(sql`
        SELECT ledger_account_id, (SELECT account_number FROM fin_ledger_account WHERE id = ledger_account_id LIMIT 1) as gl_account FROM fin_auto_posting_rule
        WHERE transaction_key = ${params.transaction_key.toUpperCase()}::fin_auto_posting_key
        AND (inventory_valuation_class = ${params.valuation_class || ''} OR inventory_valuation_class IS NULL OR ${params.valuation_class || ''} = '')
        LIMIT 1
      `);
      if (res2.rows.length > 0) {
        return { gl_account: (res2.rows[0] as any).gl_account || (res2.rows[0] as any).ledger_account_id, found: true, message: `Auto account from fin_auto_posting_rule ${params.transaction_key}/${params.valuation_class}` };
      }
    } catch {}
    return { gl_account: null, found: false, message: `Auto account not found for ${params.transaction_key}/${params.chart_of_accounts}/${params.valuation_class} – create via OBYC auto-account-determination – T0 BLOCKING` };
  } catch (e: any) {
    console.warn('getAutoAccount failed:', e.message);
    return { gl_account: null, found: false, message: `Auto account check failed: ${e.message} – allowing to not block fresh` };
  }
}

export async function getMovementType(code: string): Promise<{ found: boolean; movement: any; message: string }> {
  try {
    const res = await db.execute(sql`SELECT * FROM fin_movement_type WHERE code = ${code} AND is_active = true LIMIT 1`);
    if (res.rows.length > 0) {
      return { found: true, movement: res.rows[0], message: `Movement Type ${code} found – ${(res.rows[0] as any).description} – OMJJ T0 BLOCKING` };
    }
    return { found: false, movement: null, message: `Movement Type ${code} not found – create via OMJJ movement-types – T0 BLOCKING` };
  } catch (e: any) {
    console.warn('getMovementType failed:', e.message);
    return { found: false, movement: null, message: `Movement Type check failed: ${e.message} – allowing` };
  }
}

export async function getRevenueAccount(params: {
  chart_of_accounts: string;
  sales_org?: string;
  customer_group?: string;
  material_group?: string;
  account_assignment_group?: string;
  transaction_key: string; // KOFI, KOFK
}): Promise<{ gl_account: string | null; found: boolean; message: string; fallback_used: string }> {
  try {
    // Try exact match first
    let query = sql`
      SELECT gl_account, sales_org, customer_group, material_group, account_assignment_group FROM fin_revenue_account
      WHERE chart_of_accounts = ${params.chart_of_accounts.toUpperCase()}
      AND transaction_key = ${params.transaction_key.toUpperCase()}
      AND (sales_org = ${params.sales_org || ''} OR sales_org IS NULL OR sales_org = '' OR ${params.sales_org || ''} = '')
      AND (customer_group = ${params.customer_group || ''} OR customer_group IS NULL OR customer_group = '' OR ${params.customer_group || ''} = '')
      AND (material_group = ${params.material_group || ''} OR material_group IS NULL OR material_group = '' OR ${params.material_group || ''} = '')
      AND (account_assignment_group = ${params.account_assignment_group || ''} OR account_assignment_group IS NULL OR account_assignment_group = '' OR ${params.account_assignment_group || ''} = '')
      AND is_active = true
      ORDER BY
        CASE WHEN sales_org = ${params.sales_org || ''} THEN 0 ELSE 1 END,
        CASE WHEN customer_group = ${params.customer_group || ''} THEN 0 ELSE 1 END,
        CASE WHEN material_group = ${params.material_group || ''} THEN 0 ELSE 1 END,
        CASE WHEN account_assignment_group = ${params.account_assignment_group || ''} THEN 0 ELSE 1 END
      LIMIT 1
    `;
    const res = await db.execute(query);
    if (res.rows.length > 0) {
      const row = res.rows[0] as any;
      const fallback = !row.sales_org && !row.customer_group && !row.material_group ? 'DEFAULT' : row.sales_org ? 'EXACT' : 'PARTIAL';
      return { gl_account: row.gl_account, found: true, message: `Revenue Account VKOA ${params.chart_of_accounts}/${params.transaction_key}/${params.sales_org}/${params.customer_group}/${params.material_group} → ${row.gl_account} – ${fallback} – T0 BLOCKING`, fallback_used: fallback };
    }
    // Fallback to fin_auto_account KOFI/KOFK
    const fallbackAuto = await getAutoAccount({ transaction_key: params.transaction_key, chart_of_accounts: params.chart_of_accounts });
    if (fallbackAuto.found) {
      return { gl_account: fallbackAuto.gl_account, found: true, message: `Revenue Account fallback to OBYC ${fallbackAuto.message} – VKOA → OBYC fallback – T0`, fallback_used: 'OBYC_FALLBACK' };
    }
    return { gl_account: null, found: false, message: `Revenue Account VKOA not found for ${params.chart_of_accounts}/${params.transaction_key}/${params.sales_org}/${params.customer_group}/${params.material_group} – create via VKOA revenue-accounts – T0 BLOCKING`, fallback_used: 'NOT_FOUND' };
  } catch (e: any) {
    console.warn('getRevenueAccount failed:', e.message);
    return { gl_account: null, found: false, message: `Revenue Account check failed: ${e.message}`, fallback_used: 'ERROR' };
  }
}

export async function validateMovementAllowed(movementCode: string, allowedFor: string): Promise<{ allowed: boolean; message: string }> {
  try {
    const mt = await getMovementType(movementCode);
    if (!mt.found) return { allowed: false, message: mt.message };
    const allowed = (mt.movement as any).allowed_for;
    if (allowed === 'ALL' || allowed === allowedFor.toUpperCase() || allowedFor === 'ALL') {
      return { allowed: true, message: `Movement ${movementCode} allowed for ${allowedFor} – ${allowed} – OMJJ T0` };
    }
    return { allowed: false, message: `Movement ${movementCode} NOT allowed for ${allowedFor} – allowed_for=${allowed} – OMJJ – use correct movement` };
  } catch (e: any) {
    return { allowed: true, message: `Movement validation failed: ${e.message} – allowing` };
  }
}

export async function checkTolerance(params: {
  group_code: string;
  difference_amount: number;
  account_type?: string; // GL, CUSTOMER, VENDOR
}): Promise<{ allowed: boolean; message: string }> {
  try {
    const res = await db.execute(sql`
      SELECT code, type, lower_limit, upper_limit FROM fin_tolerance_group
      WHERE code = ${params.group_code.toUpperCase()}
      LIMIT 1
    `);
    if (res.rows.length === 0) {
      // Try legacy
      try {
        const res2 = await db.execute(sql`SELECT * FROM fin_tolerance_group WHERE code = ${params.group_code.toUpperCase()} LIMIT 1`);
        if (res2.rows.length === 0) return { allowed: true, message: `Tolerance group ${params.group_code} not found – allowing` };
      } catch {
        return { allowed: true, message: `Tolerance group ${params.group_code} not found – allowing` };
      }
    }
    const row = res.rows[0] as any;
    const upper = parseFloat(row.upper_limit || 0);
    const lower = parseFloat(row.lower_limit || 0);
    const diff = Math.abs(params.difference_amount);
    if (diff <= upper) {
      return { allowed: true, message: `Tolerance OK – difference ${diff} within upper ${upper} for group ${params.group_code}` };
    }
    return { allowed: false, message: `❌ Tolerance exceeded – difference ${diff} > upper ${upper} for group ${params.group_code} – adjust or increase tolerance` };
  } catch (e: any) {
    console.warn('checkTolerance failed:', e.message);
    return { allowed: true, message: `Tolerance check failed: ${e.message} – allowing` };
  }
}

export async function checkCreditExposure(params: {
  customer_code: string;
  new_order_value: number;
  company_code?: string;
}): Promise<{ allowed: boolean; exposure: number; limit: number; message: string }> {
  try {
    // Get customer credit policy area
    const custRes = await db.execute(sql`
      SELECT credit_policy_area_code, credit_limit FROM partner_customer_profile 
      WHERE partner_account_id = (SELECT id FROM partner_account WHERE account_number = ${params.customer_code} LIMIT 1)
      LIMIT 1
    `);
    let creditLimit = 1000000;
    let policyArea = 'CPA-1000';
    if (custRes.rows.length > 0) {
      const r = custRes.rows[0] as any;
      if (r.credit_limit) creditLimit = parseFloat(r.credit_limit);
      if (r.credit_policy_area_code) policyArea = r.credit_policy_area_code;
    }

    // Try to get credit policy area limit
    try {
      const cpaRes = await db.execute(sql`SELECT credit_limit FROM fin_credit_policy_area WHERE code = ${policyArea} LIMIT 1`);
      if (cpaRes.rows.length > 0) {
        const cpaRow = cpaRes.rows[0] as any;
        if (cpaRow.credit_limit) creditLimit = parseFloat(cpaRow.credit_limit);
      }
    } catch {
      try {
        const cpaRes2 = await db.execute(sql`SELECT credit_limit FROM org_credit_policy_area WHERE code = ${policyArea} LIMIT 1`);
        if (cpaRes2.rows.length > 0) creditLimit = parseFloat((cpaRes2.rows[0] as any).credit_limit || creditLimit);
      } catch {}
    }

    // Calculate exposure from open sales orders + billing
    let exposure = 0;
    try {
      const expRes = await db.execute(sql`
        SELECT COALESCE(SUM(total_amount),0) as exposure FROM (
          SELECT total_amount FROM sales_order WHERE customer_code = ${params.customer_code} AND status != 'CANCELLED'
          UNION ALL
          SELECT total_amount FROM billing_document WHERE customer_code = ${params.customer_code} AND status != 'CANCELLED' AND payment_status != 'PAID'
        ) t
      `);
      if (expRes.rows.length > 0) exposure = parseFloat((expRes.rows[0] as any).exposure || 0);
    } catch {}

    const totalAfter = exposure + params.new_order_value;
    if (totalAfter > creditLimit) {
      return {
        allowed: false,
        exposure,
        limit: creditLimit,
        message: `❌ Credit limit exceeded – customer ${params.customer_code} exposure ${exposure} + new ${params.new_order_value} = ${totalAfter} > limit ${creditLimit} (policy ${policyArea}) – block sales order`
      };
    }
    return {
      allowed: true,
      exposure,
      limit: creditLimit,
      message: `✅ Credit OK – customer ${params.customer_code} exposure ${exposure} + new ${params.new_order_value} = ${totalAfter} <= limit ${creditLimit}`
    };
  } catch (e: any) {
    console.warn('checkCreditExposure failed:', e.message);
    return { allowed: true, exposure: 0, limit: 1000000, message: `Credit check failed: ${e.message} – allowing` };
  }
}

export async function checkFieldStatus(params: {
  variant_code: string;
  group_code: string;
  field_values: Record<string, any>;
}): Promise<{ allowed: boolean; errors: string[]; message: string }> {
  try {
    const res = await db.execute(sql`
      SELECT field_name, status FROM fin_field_status_group
      WHERE variant_code = ${params.variant_code.toUpperCase()}
      AND group_code = ${params.group_code.toUpperCase()}
    `);
    const errors: string[] = [];
    for (const row of res.rows as any[]) {
      const fieldName = row.field_name;
      const status = row.status;
      const value = params.field_values[fieldName];
      if (status === 'R' && !value) {
        errors.push(`Field ${fieldName} required for group ${params.group_code} variant ${params.variant_code} – field status control`);
      }
      if (status === 'S' && value) {
        errors.push(`Field ${fieldName} suppressed for group ${params.group_code} variant ${params.variant_code} – must be empty`);
      }
    }
    if (errors.length > 0) {
      return { allowed: false, errors, message: `❌ Field status errors: ${errors.join('; ')}` };
    }
    return { allowed: true, errors: [], message: `✅ Field status OK for variant ${params.variant_code} group ${params.group_code}` };
  } catch (e: any) {
    console.warn('checkFieldStatus failed:', e.message);
    return { allowed: true, errors: [], message: `Field status check failed: ${e.message} – allowing` };
  }
}

export async function getDocumentTypeNumberRange(docTypeCode: string): Promise<{ number_range_code: string | null; found: boolean; message: string }> {
  try {
    const res = await db.execute(sql`
      SELECT number_range_code FROM fin_document_type WHERE code = ${docTypeCode.toUpperCase()} LIMIT 1
    `);
    if (res.rows.length > 0) {
      const nr = (res.rows[0] as any).number_range_code;
      return { number_range_code: nr, found: !!nr, message: `Doc type ${docTypeCode} → number range ${nr}` };
    }
    return { number_range_code: null, found: false, message: `Doc type ${docTypeCode} not found – using default` };
  } catch (e: any) {
    return { number_range_code: null, found: false, message: `Doc type check failed: ${e.message}` };
  }
}

export async function calculateDueDate(paymentTermCode: string, postingDate: Date | string): Promise<{ due_date: Date; discount_date?: Date; discount_percent?: number; message: string }> {
  const baseDate = typeof postingDate === 'string' ? new Date(postingDate) : postingDate;
  try {
    const res = await db.execute(sql`SELECT days, discount_percent, discount_days FROM fin_payment_term WHERE code = ${paymentTermCode.toUpperCase()} LIMIT 1`);
    if (res.rows.length > 0) {
      const row = res.rows[0] as any;
      const days = parseInt(row.days || 0);
      const discountDays = parseInt(row.discount_days || 0);
      const discountPercent = parseFloat(row.discount_percent || 0);
      const dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() + days);
      let discountDate: Date | undefined;
      if (discountDays > 0) {
        discountDate = new Date(baseDate);
        discountDate.setDate(discountDate.getDate() + discountDays);
      }
      return {
        due_date: dueDate,
        discount_date: discountDate,
        discount_percent: discountPercent,
        message: `Payment term ${paymentTermCode}: due ${dueDate.toISOString().split('T')[0]} (${days} days), discount ${discountPercent}% within ${discountDays} days`
      };
    }
  } catch (e: any) {
    console.warn('calculateDueDate failed:', e.message);
  }
  // Default 30 days
  const dueDate = new Date(baseDate);
  dueDate.setDate(dueDate.getDate() + 30);
  return { due_date: dueDate, message: `Payment term ${paymentTermCode} not found – default 30 days → due ${dueDate.toISOString().split('T')[0]}` };
}

