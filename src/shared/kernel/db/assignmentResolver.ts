/**
 * Assignment Resolver & Diagnostic Engine
 * 
 * In standard SAP SPRO Enterprise Structure, assignments are maintained in dedicated
 * assignment tables (OB62, OB37, OB38, OBBP, OBC5, OX19, OX18, OX10, OX17, OVX3, etc.).
 * 
 * This resolver reads assignments and produces clear, actionable business errors
 * with the exact transaction code and route needed to resolve missing configurations,
 * completely preventing unhandled database/SQL errors downstream in MM, SD, and FICO.
 */

import { db } from './client';
import { sql } from 'drizzle-orm';

export interface AssignmentDiagnostic {
  valid: boolean;
  code?: string; // e.g. 'OB62'
  message?: string;
  solution?: string;
  route?: string;
}

export async function ensureAssignmentSchema(): Promise<void> {
  try {
    // 1. Company Code assignments (OB62, OB37, OB38, OBBP, OBC5, OX19, OX16)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_company_assignment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_code VARCHAR(20) NOT NULL UNIQUE,
        company_name VARCHAR(150),
        chart_of_accounts_code VARCHAR(20),      -- OB62 (Operational CoA)
        country_chart_of_accounts_code VARCHAR(20), -- OB62 (Country CoA)
        fiscal_year_variant_code VARCHAR(20),    -- OB37 (FYV)
        credit_control_area_code VARCHAR(20),    -- OB38 (CCA)
        posting_period_variant_code VARCHAR(20), -- OBBP (PPV)
        field_status_variant_code VARCHAR(20),   -- OBC5 (FSV)
        controlling_area_code VARCHAR(20),       -- OX19 (CO Area)
        company_group_code VARCHAR(20),          -- OX16 (Company / Consolidation)
        financial_mgmt_area_code VARCHAR(20),    -- OB24 (FM Area)
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // 2. Plant (Facility) to Company Code (OX18)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS org_plant_company_assignment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plant_code VARCHAR(20) NOT NULL,
        company_code VARCHAR(20) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(plant_code, company_code)
      )
    `);

    // 3. Purchasing Org to Company Code (OX01 / OX10)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS org_purchasing_company_assignment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        purchasing_org_code VARCHAR(20) NOT NULL,
        company_code VARCHAR(20) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(purchasing_org_code, company_code)
      )
    `);

    // 4. Purchasing Org to Plant (OX17)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS org_purchasing_plant_assignment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        purchasing_org_code VARCHAR(20) NOT NULL,
        plant_code VARCHAR(20) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(purchasing_org_code, plant_code)
      )
    `);

    // 5. Sales Org to Company Code (OVX3)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS org_sales_company_assignment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sales_org_code VARCHAR(20) NOT NULL,
        company_code VARCHAR(20) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(sales_org_code, company_code)
      )
    `);

    // 6. Distribution Channel to Sales Org (OVX8)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS org_dist_channel_sales_assignment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sales_org_code VARCHAR(20) NOT NULL,
        distribution_channel_code VARCHAR(20) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(sales_org_code, distribution_channel_code)
      )
    `);

    // 7. Division to Sales Org (OVX6)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS org_division_sales_assignment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sales_org_code VARCHAR(20) NOT NULL,
        division_code VARCHAR(20) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(sales_org_code, division_code)
      )
    `);

    // 8. Controlling Area to Operating Concern (KE4K)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS co_controlling_operating_concern_assignment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        controlling_area_code VARCHAR(20) NOT NULL UNIQUE,
        operating_concern_code VARCHAR(20) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (e: any) {
    console.warn('Assignment schema ensure note:', e.message);
  }
}

/**
 * Resolves Chart of Accounts assigned to a Company Code (OB62)
 */
export async function resolveChartOfAccounts(companyCode: string): Promise<{
  chart_of_accounts_code: string | null;
  diagnostic: AssignmentDiagnostic;
}> {
  await ensureAssignmentSchema();
  try {
    const res = await db.execute(sql`
      SELECT chart_of_accounts_code 
      FROM fin_company_assignment 
      WHERE UPPER(company_code) = ${companyCode.toUpperCase().trim()} 
      LIMIT 1
    `);

    const coa = (res.rows[0] as any)?.chart_of_accounts_code;
    if (coa) {
      return { chart_of_accounts_code: coa, diagnostic: { valid: true } };
    }

    // Fallback: check direct column on org_legal_entity
    const leRes = await db.execute(sql`
      SELECT chart_of_accounts_code 
      FROM org_legal_entity 
      WHERE UPPER(code) = ${companyCode.toUpperCase().trim()} 
      LIMIT 1
    `);
    const leCoa = (leRes.rows[0] as any)?.chart_of_accounts_code;
    if (leCoa) {
      return { chart_of_accounts_code: leCoa, diagnostic: { valid: true } };
    }

    return {
      chart_of_accounts_code: null,
      diagnostic: {
        valid: false,
        code: 'OB62',
        message: `Company Code '${companyCode}' has not been assigned to a Chart of Accounts.`,
        solution: `Use transaction OB62 (Assign Company Code to Chart of Accounts) to assign an operational Chart of Accounts to ${companyCode}.`,
        route: `/${companyCode}/fico/assignments/chart-of-accounts`
      }
    };
  } catch (e: any) {
    return {
      chart_of_accounts_code: null,
      diagnostic: {
        valid: false,
        code: 'OB62',
        message: `Error verifying Chart of Accounts assignment for ${companyCode}: ${e.message}`,
        solution: `Verify assignment in transaction OB62.`,
        route: `/${companyCode}/fico/assignments/chart-of-accounts`
      }
    };
  }
}

/**
 * Resolves Fiscal Year Variant assigned to a Company Code (OB37)
 */
export async function resolveFiscalYearVariant(companyCode: string): Promise<{
  fiscal_year_variant_code: string | null;
  diagnostic: AssignmentDiagnostic;
}> {
  await ensureAssignmentSchema();
  try {
    const res = await db.execute(sql`
      SELECT fiscal_year_variant_code 
      FROM fin_company_assignment 
      WHERE UPPER(company_code) = ${companyCode.toUpperCase().trim()} 
      LIMIT 1
    `);

    const fyv = (res.rows[0] as any)?.fiscal_year_variant_code;
    if (fyv) {
      return { fiscal_year_variant_code: fyv, diagnostic: { valid: true } };
    }

    const leRes = await db.execute(sql`
      SELECT fiscal_calendar_code as fyv 
      FROM org_legal_entity 
      WHERE UPPER(code) = ${companyCode.toUpperCase().trim()} 
      LIMIT 1
    `);
    const leFyv = (leRes.rows[0] as any)?.fyv;
    if (leFyv) {
      return { fiscal_year_variant_code: leFyv, diagnostic: { valid: true } };
    }

    return {
      fiscal_year_variant_code: null,
      diagnostic: {
        valid: false,
        code: 'OB37',
        message: `Company Code '${companyCode}' is not assigned to a Fiscal Year Variant.`,
        solution: `Assign a Fiscal Year Variant (e.g. K4 or V3) to Company Code ${companyCode} in transaction OB37.`,
        route: `/${companyCode}/fico/assignments/fiscal-year-variant`
      }
    };
  } catch (e: any) {
    return {
      fiscal_year_variant_code: null,
      diagnostic: {
        valid: false,
        code: 'OB37',
        message: `Error verifying Fiscal Year Variant for ${companyCode}: ${e.message}`,
        solution: `Verify assignment in transaction OB37.`,
        route: `/${companyCode}/fico/assignments/fiscal-year-variant`
      }
    };
  }
}

/**
 * Resolves Plant to Company Code assignment (OX18)
 */
export async function resolvePlantAssignment(plantCode: string, companyCode: string): Promise<AssignmentDiagnostic> {
  await ensureAssignmentSchema();
  try {
    const res = await db.execute(sql`
      SELECT id FROM org_plant_company_assignment 
      WHERE UPPER(plant_code) = ${plantCode.toUpperCase().trim()} 
        AND UPPER(company_code) = ${companyCode.toUpperCase().trim()}
      LIMIT 1
    `);

    if (res.rows.length > 0) {
      return { valid: true };
    }

    // Direct check if facility has legal_entity_id matching companyCode
    const facRes = await db.execute(sql`
      SELECT f.id 
      FROM org_facility f
      JOIN org_legal_entity le ON f.legal_entity_id = le.id
      WHERE UPPER(f.code) = ${plantCode.toUpperCase().trim()} 
        AND UPPER(le.code) = ${companyCode.toUpperCase().trim()}
      LIMIT 1
    `);
    if (facRes.rows.length > 0) {
      return { valid: true };
    }

    return {
      valid: false,
      code: 'OX18',
      message: `Plant '${plantCode}' is not assigned to Company Code '${companyCode}'.`,
      solution: `Link Plant ${plantCode} to Company Code ${companyCode} using transaction OX18 (Assign Plant to Company Code).`,
      route: `/${companyCode}/mm/assignments/plant-company-code`
    };
  } catch (e: any) {
    return {
      valid: false,
      code: 'OX18',
      message: `Error verifying Plant assignment: ${e.message}`,
      solution: `Check OX18 assignment table.`,
      route: `/${companyCode}/mm/assignments/plant-company-code`
    };
  }
}
