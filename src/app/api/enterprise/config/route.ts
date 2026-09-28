import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Enterprise Config API - Real DB - No Mocks
 * GET /api/enterprise/config - Returns all enterprise config: fiscal year variant K4, posting periods OB52, field status OBC4/OBC5, tolerance OBA0/OBA4, credit control OB45, doc types OBA7, approval authority, roles, permissions
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyCode = searchParams.get('companyCode') || 'KS01';

    const companyRes = await db.execute(sql`SELECT id FROM ent_company_code WHERE code = ${companyCode} LIMIT 1`);
    const companyId = (companyRes.rows[0] as any)?.id;

    // Fiscal Year Variant K4
    const fiscalVariants = await db.execute(sql`SELECT * FROM ent_fiscal_year_variant ORDER BY code`);
    const fiscalPeriods = await db.execute(sql`
      SELECT fyp.*, fyv.code as variant_code 
      FROM ent_fiscal_year_period fyp 
      JOIN ent_fiscal_year_variant fyv ON fyp.variant_id = fyv.id 
      ORDER BY fyv.code, fyp.period
    `);

    // Posting Period Variant OBBO + OB52
    const postingVariants = await db.execute(sql`SELECT * FROM ent_posting_period_variant ORDER BY code`);
    const postingPeriods = await db.execute(sql`
      SELECT pp.*, ppv.code as variant_code, cc.code as company_code
      FROM ent_posting_period pp
      JOIN ent_posting_period_variant ppv ON pp.variant_id = ppv.id
      LEFT JOIN ent_company_code cc ON pp.company_code_id = cc.id
      WHERE pp.company_code_id = ${companyId} OR ${companyId} IS NULL
      ORDER BY ppv.code, pp.from_year, pp.from_period
    `);

    // Field Status OBC4/OBC5
    const fieldStatusVariants = await db.execute(sql`SELECT * FROM ent_field_status_variant ORDER BY code`);
    const fieldStatusGroups = await db.execute(sql`
      SELECT fsg.*, fsv.code as variant_code
      FROM ent_field_status_group fsg
      JOIN ent_field_status_variant fsv ON fsg.variant_id = fsv.id
      ORDER BY fsv.code, fsg.code
    `);
    const fieldStatuses = await db.execute(sql`
      SELECT fs.*, fsg.code as group_code, fsv.code as variant_code
      FROM ent_field_status fs
      JOIN ent_field_status_group fsg ON fs.group_id = fsg.id
      JOIN ent_field_status_variant fsv ON fsg.variant_id = fsv.id
      ORDER BY fsv.code, fsg.code, fs.field_name
    `);

    // Tolerance OBA0/OBA4
    const tolerances = await db.execute(sql`SELECT * FROM ent_tolerance_group ORDER BY code`);

    // Credit Control OB45/OB38
    const creditControlAreas = await db.execute(sql`SELECT * FROM ent_credit_control_area ORDER BY code`);
    const creditAssignments = await db.execute(sql`
      SELECT cca.code as credit_code, cc.code as company_code
      FROM ent_credit_control_assignment cca_assign
      JOIN ent_credit_control_area cca ON cca_assign.credit_control_area_id = cca.id
      JOIN ent_company_code cc ON cca_assign.company_code_id = cc.id
    `);

    // Document Types OBA7
    const docTypes = await db.execute(sql`SELECT * FROM ent_document_type ORDER BY code`);

    // Approval Authority
    const approvalAuth = await db.execute(sql`
      SELECT aa.*, p.code as position_code, p.name as position_name
      FROM ent_approval_authority aa
      JOIN hr_position p ON aa.position_id = p.id
      ORDER BY p.code, aa.document_type, aa.min_amount
    `);

    // Roles & Permissions
    const roles = await db.execute(sql`SELECT * FROM ent_role ORDER BY code`);
    const permissions = await db.execute(sql`SELECT * FROM ent_permission ORDER BY module, code`);
    const rolePerms = await db.execute(sql`
      SELECT r.code as role_code, p.code as permission_code, p.module
      FROM ent_role_permission rp
      JOIN ent_role r ON rp.role_id = r.id
      JOIN ent_permission p ON rp.permission_id = p.id
      ORDER BY r.code, p.code
    `);

    // Org Units & Positions hierarchical
    const orgUnits = await db.execute(sql`SELECT * FROM hr_org_unit ORDER BY code`);
    const positions = await db.execute(sql`
      SELECT p.*, ou.code as org_unit_code, ou.name as org_unit_name
      FROM hr_position p
      JOIN hr_org_unit ou ON p.org_unit_id = ou.id
      ORDER BY ou.code, p.code
    `);

    // Number Ranges FBN1
    const numberRanges = await db.execute(sql`
      SELECT nr.*, cc.code as company_code
      FROM ent_number_range nr
      LEFT JOIN ent_company_code cc ON nr.company_code_id = cc.id
      ORDER BY nr.object_type, nr.year
    `);

    // Auto Account Determination OBYC
    const autoAccounts = await db.execute(sql`
      SELECT aad.*, gl.account_number, gl.name as gl_name, cc.code as company_code
      FROM fi_auto_account_determination aad
      JOIN fi_gl_account gl ON aad.gl_account_id = gl.id
      JOIN ent_company_code cc ON aad.company_code_id = cc.id
      ORDER BY cc.code, aad.transaction_key, aad.valuation_class
    `);

    // Currencies OY03 – Only INR default, KWD etc added by user
    let currencies: any[] = [];
    try {
      const cur = await db.execute(sql`SELECT id, code, name, decimal_places, symbol, is_active FROM ent_currency ORDER BY code`);
      currencies = cur.rows;
    } catch {}

    return NextResponse.json({
      companyCode,
      companyId,
      currencies: currencies,
      defaultCurrency: 'INR',
      currencyInfo: 'Only INR default per user request – all other currencies like KWD, USD, EUR must be added by user via POST /api/currencies – Code OY03 – configurable',
      fiscal: {
        variants: fiscalVariants.rows,
        periods: fiscalPeriods.rows,
        k4Description: 'K4 April-March India: P1 Apr, P2 May, P3 Jun, P4 Jul, P5 Aug, P6 Sep, P7 Oct, P8 Nov, P9 Dec, P10 Jan, P11 Feb, P12 Mar',
      },
      posting: {
        variants: postingVariants.rows,
        periods: postingPeriods.rows,
        description: 'OBBO Posting Period Variant KS01 + OB52 Open Periods 1/2024-12/2026 +ADKMS Account Types',
      },
      fieldStatus: {
        variants: fieldStatusVariants.rows,
        groups: fieldStatusGroups.rows,
        fields: fieldStatuses.rows,
        description: 'OBC4 Define Field Status Variants, OBC5 Assign to Company Code, G001 Material Management, G004 Sales, G005 Bank/Cash',
      },
      tolerance: {
        groups: tolerances.rows,
        description: 'OBA0 G/L Tolerance, OBA4 Employee/Customer/Vendor Tolerance',
      },
      credit: {
        areas: creditControlAreas.rows,
        assignments: creditAssignments.rows,
        description: 'OB45 Credit Control Area KS01 INR, OB38 Assign Company Code KS01 to Credit Control Area',
      },
      documentTypes: {
        types: docTypes.rows,
        description: 'OBA7 Document Types KR Vendor Invoice 51, KG Credit Memo 52, KZ Payment 53, RE Invoice Gross 51, WE Goods Receipt 50, WA Goods Issue 50, SA G/L 54, RV Billing, PR Payroll',
      },
      approvalAuthority: {
        authorities: approvalAuth.rows,
        description: 'Approval Authority Matrix hierarchical: LEVEL_1 up to 1000, LEVEL_2 up to 10000, LEVEL_3 up to 50000, CFO up to 500000, CEO unlimited, OWNER unlimited, dual approval for payroll',
      },
      rbac: {
        roles: roles.rows,
        permissions: permissions.rows,
        rolePermissions: rolePerms.rows,
        description: 'RBAC for 500 employees: ADMIN, OWNER, CFO, CEO, MANAGER, PURCHASER, WAREHOUSE, ACCOUNTANT, SALES, HR, AUDITOR, PRODUCTION - only 10% have app access',
      },
      orgStructure: {
        orgUnits: orgUnits.rows,
        positions: positions.rows,
        description: 'Hierarchical Org Units: ROOT -> EXEC, FIN, PUR, WH, PROD, SALES, HR, QA, MFG - Positions: CEO, CFO, COO, MGR, SR, JR with manager hierarchy',
      },
      numberRanges: {
        ranges: numberRanges.rows,
        description: 'FBN1 Number Ranges 50-54 5000000000-5499999999: 50 WE/WA, 51 KR/RE, 52 KG, 53 KZ, 54 SA + PR, PO, GR, IV, SALES_ORDER, etc with FOR UPDATE locking',
      },
      autoAccount: {
        determinations: autoAccounts.rows,
        description: 'OBYC Auto Account Determination BSX Inventory Posting ROH->5000000001 FERT->5000000002, WRX GR/IR 5000000003, PRD Price Diff 5000000005, GBB Consumption 5000000006, BSV Stock in Transit 5000000004, FRE/ZOL Freight/Customs MAP',
      },
      source: 'db',
      enterprise: 'Medium enterprise 500 employees, hierarchical, authority flow, RBAC, posting period OB52 enforced, field status OBC4/OBC5, tolerance OBA0/OBA4, credit OB45, doc types OBA7, number ranges FBN1 FOR UPDATE, OBYC auto account',
    });
  } catch (e: any) {
    console.error('Enterprise config fetch failed:', e.message);
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
  }
}
