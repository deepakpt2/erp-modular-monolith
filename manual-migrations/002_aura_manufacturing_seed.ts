/**
 * ============================================================================
 * Enterprise Seed Runner – Aura Group & Aura Manufacturing (AM01)
 * ============================================================================
 * Purpose: Automated, idempotent TypeScript seed script for Steps 1 through 8.
 * Run inside container using the migrator service:
 *   docker compose run --rm migrator npm run db:seed:aura
 */

import { db } from '../src/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { ensureAssignmentSchema } from '../src/shared/kernel/db/assignmentResolver';
import { seedIndustryStandardBaseline } from '../src/shared/kernel/db/standardSystemDefaults';

export async function seedAuraManufacturing() {
  console.log('🚀 Starting Aura Manufacturing (AM01) Enterprise Seed...');

  // 0. Ensure foundation baseline tables & assignments exist
  await seedIndustryStandardBaseline();
  await ensureAssignmentSchema();

  // 1. Ensure Default Tenant
  const tenantRes = await db.execute(sql`
    INSERT INTO core_tenant (code, name, description)
    VALUES ('DEFAULT', 'Default Enterprise Tenant', 'System Default Tenant')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `);
  const tenantId = (tenantRes.rows[0] as any).id;

  // --------------------------------------------------------------------------
  // STEP 1: Enterprise Structure – Financial Accounting (FI)
  // --------------------------------------------------------------------------
  console.log('📌 [Step 1] FI Structure: Company AMCO & Company Code AM01...');
  
  // OX15: Define Company (AMCO)
  const groupRes = await db.execute(sql`
    INSERT INTO org_company_group (tenant_id, code, name, country_code, country, currency_code, language, description)
    VALUES (${tenantId}, 'AMCO', 'Aura Group India', 'IN', 'IN', 'INR', 'EN', 'Aura Group India Trading Partner')
    ON CONFLICT (tenant_id, code) DO UPDATE SET
      name = EXCLUDED.name,
      country_code = EXCLUDED.country_code,
      country = EXCLUDED.country,
      currency_code = EXCLUDED.currency_code,
      language = EXCLUDED.language,
      updated_at = NOW()
    RETURNING id
  `);
  const companyGroupId = (groupRes.rows[0] as any).id;

  // OX02: Define Company Code (AM01)
  const leRes = await db.execute(sql`
    INSERT INTO org_legal_entity (
      tenant_id, company_group_id, code, name, city, country, country_code, currency_code, language, description
    )
    VALUES (
      ${tenantId}, ${companyGroupId}, 'AM01', 'Aura Manufacturing Inc.', 'Mumbai', 'IN', 'IN', 'INR', 'EN', 'Aura Manufacturing Inc. Company Code'
    )
    ON CONFLICT (tenant_id, code) DO UPDATE SET
      name = EXCLUDED.name,
      city = EXCLUDED.city,
      country = EXCLUDED.country,
      country_code = EXCLUDED.country_code,
      currency_code = EXCLUDED.currency_code,
      language = EXCLUDED.language,
      company_group_id = EXCLUDED.company_group_id,
      updated_at = NOW()
    RETURNING id
  `);
  const legalEntityId = (leRes.rows[0] as any).id;

  // --------------------------------------------------------------------------
  // STEP 2: Enterprise Structure – Controlling (CO)
  // --------------------------------------------------------------------------
  console.log('📌 [Step 2] CO Structure: Controlling Area AM01...');

  // OKKP: Maintain Controlling Area (AM01)
  await db.execute(sql`
    INSERT INTO org_mgmt_control_area (
      tenant_id, code, name, assignment_control, currency_type, currency_code, fiscal_year_variant, cost_center_standard_hierarchy, description
    )
    VALUES (
      ${tenantId}, 'AM01', 'Aura Controlling Area', '1', '10', 'INR', 'V3', 'AM01', 'Controlling Area for Aura Group'
    )
    ON CONFLICT (tenant_id, code) DO UPDATE SET
      name = EXCLUDED.name,
      assignment_control = EXCLUDED.assignment_control,
      currency_type = EXCLUDED.currency_type,
      currency_code = EXCLUDED.currency_code,
      fiscal_year_variant = EXCLUDED.fiscal_year_variant,
      cost_center_standard_hierarchy = EXCLUDED.cost_center_standard_hierarchy,
      updated_at = NOW()
  `);

  // --------------------------------------------------------------------------
  // STEP 3: Enterprise Structure – Logistics (MM)
  // --------------------------------------------------------------------------
  console.log('📌 [Step 3] MM Structure: Plant P001 & Storage Locations (RM01, FG01)...');

  // OX10: Define Plant (P001)
  const plantRes = await db.execute(sql`
    INSERT INTO org_facility (code, name, country, city, description, legal_entity_id)
    VALUES ('P001', 'Aura Manufacturing Plant', 'IN', 'Mumbai', 'Plant P001', ${legalEntityId})
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      country = EXCLUDED.country,
      city = EXCLUDED.city,
      legal_entity_id = EXCLUDED.legal_entity_id,
      updated_at = NOW()
    RETURNING id
  `);
  const facilityId = (plantRes.rows[0] as any).id;

  // OX09: Define Storage Locations (RM01 & FG01)
  await db.execute(sql`
    INSERT INTO org_inventory_location (facility_id, code, name, location_type)
    VALUES 
      (${facilityId}, 'RM01', 'Raw Materials Store', 'PRIMARY'),
      (${facilityId}, 'FG01', 'Finished Goods Store', 'PRIMARY')
    ON CONFLICT (facility_id, code) DO UPDATE SET
      name = EXCLUDED.name,
      updated_at = NOW()
  `);

  // --------------------------------------------------------------------------
  // STEP 4: Enterprise Structure – Purchasing & Sales
  // --------------------------------------------------------------------------
  console.log('📌 [Step 4] Purchasing Org P001 & Sales Org S001...');

  // OX08: Define Purchasing Organization (P001)
  await db.execute(sql`
    INSERT INTO org_procurement_division (tenant_id, code, name, description)
    VALUES (${tenantId}, 'P001', 'Aura Purchasing Org', 'Purchasing Organization P001')
    ON CONFLICT (tenant_id, code) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      updated_at = NOW()
  `);

  // OVX5 / OVX2: Define Sales Organization (S001)
  await db.execute(sql`
    INSERT INTO org_commercial_org (tenant_id, code, name, currency_code, description, legal_entity_id)
    VALUES (${tenantId}, 'S001', 'Aura Sales Org', 'INR', 'Sales Organization S001', ${legalEntityId})
    ON CONFLICT (tenant_id, code) DO UPDATE SET
      name = EXCLUDED.name,
      currency_code = EXCLUDED.currency_code,
      description = EXCLUDED.description,
      legal_entity_id = EXCLUDED.legal_entity_id,
      updated_at = NOW()
  `);

  // --------------------------------------------------------------------------
  // STEP 5: Enterprise Structure – Assignments
  // --------------------------------------------------------------------------
  console.log('📌 [Step 5] Organizational Assignments (OX19, OX18, OX01, OX17, OVX3)...');

  // Ensure fin_company_assignment
  await db.execute(sql`
    INSERT INTO fin_company_assignment (company_code, company_name, controlling_area_code, updated_at)
    VALUES ('AM01', 'Aura Manufacturing Inc.', 'AM01', NOW())
    ON CONFLICT (company_code) DO UPDATE SET
      controlling_area_code = 'AM01',
      updated_at = NOW()
  `);

  // OX18: Plant P001 -> Company Code AM01
  await db.execute(sql`
    INSERT INTO org_plant_company_assignment (plant_code, company_code, description, updated_at)
    VALUES ('P001', 'AM01', 'Plant P001 to Company Code AM01', NOW())
    ON CONFLICT (plant_code, company_code) DO UPDATE SET updated_at = NOW()
  `);

  // OX01: Purch Org P001 -> Company Code AM01
  await db.execute(sql`
    INSERT INTO org_purchasing_company_assignment (purchasing_org_code, company_code, description, updated_at)
    VALUES ('P001', 'AM01', 'Purchasing Org P001 to Company Code AM01', NOW())
    ON CONFLICT (purchasing_org_code, company_code) DO UPDATE SET updated_at = NOW()
  `);

  // OX17: Purch Org P001 -> Plant P001
  await db.execute(sql`
    INSERT INTO org_purchasing_plant_assignment (purchasing_org_code, plant_code, description, updated_at)
    VALUES ('P001', 'P001', 'Purchasing Org P001 to Plant P001', NOW())
    ON CONFLICT (purchasing_org_code, plant_code) DO UPDATE SET updated_at = NOW()
  `);

  // OVX3: Sales Org S001 -> Company Code AM01
  await db.execute(sql`
    INSERT INTO org_sales_company_assignment (sales_org_code, company_code, description, updated_at)
    VALUES ('S001', 'AM01', 'Sales Org S001 to Company Code AM01', NOW())
    ON CONFLICT (sales_org_code, company_code) DO UPDATE SET updated_at = NOW()
  `);

  // --------------------------------------------------------------------------
  // STEP 6: FI Global Settings (Fiscal Year & Posting Periods)
  // --------------------------------------------------------------------------
  console.log('📌 [Step 6] FI Settings: FYV V3, PPV AM01, OB52 Periods...');

  // OB29: Fiscal Year Variant V3
  const fyvCheck = await db.execute(sql`SELECT id FROM fin_fiscal_calendar WHERE UPPER(code) = 'V3' LIMIT 1`);
  if (fyvCheck.rows.length === 0) {
    await db.execute(sql`
      INSERT INTO fin_fiscal_calendar (code, name, description, year_dependent, calendar_year, number_of_periods, number_of_special_periods)
      VALUES ('V3', 'April to March (4 Special Periods)', 'Standard Indian Fiscal Year (V3)', false, false, 12, 4)
    `);
  }

  // OB37: Assign FYV to AM01
  await db.execute(sql`
    UPDATE fin_company_assignment SET fiscal_year_variant_code = 'V3', updated_at = NOW() WHERE company_code = 'AM01';
    UPDATE org_legal_entity SET fiscal_calendar_code = 'V3', fiscal_year_variant = 'V3', updated_at = NOW() WHERE code = 'AM01';
  `);

  // OBBO: Define Posting Period Variant (AM01)
  const ppvCheck = await db.execute(sql`SELECT id FROM fin_posting_calendar WHERE UPPER(code) = 'AM01' LIMIT 1`);
  let ppvId: string;
  if (ppvCheck.rows.length === 0) {
    const ppvIns = await db.execute(sql`
      INSERT INTO fin_posting_calendar (code, name, description)
      VALUES ('AM01', 'Posting Period Variant for Aura', 'Posting Period Variant AM01')
      RETURNING id
    `);
    ppvId = (ppvIns.rows[0] as any).id;
  } else {
    ppvId = (ppvCheck.rows[0] as any).id;
  }

  // OBBP: Assign PPV to AM01
  await db.execute(sql`
    UPDATE fin_company_assignment SET posting_period_variant_code = 'AM01', updated_at = NOW() WHERE company_code = 'AM01';
    UPDATE org_legal_entity SET posting_period_variant = 'AM01', updated_at = NOW() WHERE code = 'AM01';
  `);

  // OB52: Open Posting Period (1/2026 to 12/2026 for ALL)
  await db.execute(sql`
    DELETE FROM fin_posting_calendar_period WHERE posting_calendar_id = ${ppvId} AND from_period = 1 AND account_type = 'ALL';
    INSERT INTO fin_posting_calendar_period (
      posting_calendar_id, variant_code, account_type, from_period, from_year, to_period, to_year, is_open, description
    )
    VALUES (
      ${ppvId}, 'AM01', 'ALL', 1, 2026, 12, 2026, true, 'Open period 1/2026 to 12/2026 for AM01'
    );
  `);

  // --------------------------------------------------------------------------
  // STEP 7: G/L Prerequisites (Chart of Accounts & Account Groups)
  // --------------------------------------------------------------------------
  console.log('📌 [Step 7] Chart of Accounts AMCO & Account Groups (ASET, LIAB, EQTY, REVE, EXPN)...');

  // OB13: Define Chart of Accounts (AMCO)
  const chartCheck = await db.execute(sql`SELECT id FROM fin_chart WHERE UPPER(code) = 'AMCO' LIMIT 1`);
  let chartId: string;
  if (chartCheck.rows.length === 0) {
    const chartIns = await db.execute(sql`
      INSERT INTO fin_chart (code, name, description, language, gl_account_length)
      VALUES ('AMCO', 'Aura Chart of Accounts', 'Aura Chart of Accounts', 'EN', 4)
      RETURNING id
    `);
    chartId = (chartIns.rows[0] as any).id;
  } else {
    chartId = (chartCheck.rows[0] as any).id;
    await db.execute(sql`UPDATE fin_chart SET gl_account_length = 4 WHERE id = ${chartId}`);
  }

  // OB62 / OBOB: Assign CoA to Company Code AM01
  await db.execute(sql`
    UPDATE fin_company_assignment SET chart_of_accounts_code = 'AMCO', updated_at = NOW() WHERE company_code = 'AM01';
    UPDATE org_legal_entity SET chart_of_accounts_code = 'AMCO', updated_at = NOW() WHERE code = 'AM01';
  `);

  // OBD4: Define Account Groups
  const groups = [
    { code: 'ASET', name: 'Assets', from: '1000', to: '1999', type: 'ASSET', cat: 'BALANCE_SHEET' },
    { code: 'LIAB', name: 'Liabilities', from: '2000', to: '2999', type: 'LIABILITY', cat: 'BALANCE_SHEET' },
    { code: 'EQTY', name: 'Equity', from: '3000', to: '3999', type: 'EQUITY', cat: 'BALANCE_SHEET' },
    { code: 'REVE', name: 'Revenue', from: '4000', to: '4999', type: 'REVENUE', cat: 'OPERATING_EXP_INC' },
    { code: 'EXPN', name: 'Expenses', from: '5000', to: '5999', type: 'EXPENSE', cat: 'OPERATING_EXP_INC' },
  ];

  for (const g of groups) {
    await db.execute(sql`
      DELETE FROM fin_account_group WHERE chart_id = ${chartId} AND UPPER(code) = ${g.code};
      INSERT INTO fin_account_group (chart_id, coa_id, code, name, from_account, to_account, account_type, account_category)
      VALUES (${chartId}, ${chartId}, ${g.code}, ${g.name}, ${g.from}, ${g.to}, ${g.type}, ${g.cat});
    `);
  }

  // --------------------------------------------------------------------------
  // STEP 8: Retained Earnings & Document Number Ranges
  // --------------------------------------------------------------------------
  console.log('📌 [Step 8] Retained Earnings (AMCO/X/3000) & FI Number Range (AM01/01/2026)...');

  // OB53: Define Retained Earnings Account
  await db.execute(sql`
    DELETE FROM fin_retained_earnings WHERE chart_id = ${chartId} AND pl_account_type = 'X';
    INSERT INTO fin_retained_earnings (chart_id, coa_id, pl_account_type, account_number, description)
    VALUES (${chartId}, ${chartId}, 'X', '3000', 'Retained Earnings Balance Account for AMCO');
  `);

  // FBN1: Document Number Ranges
  await db.execute(sql`
    DELETE FROM core_number_range 
    WHERE object_type = 'FI_DOC' AND UPPER(company_code) = 'AM01' AND code = '01' AND fiscal_year = 2026;

    INSERT INTO core_number_range (
      code, object_type, company_code, scope_level, fiscal_year, year, prefix, from_number, to_number, current_number, description
    )
    VALUES (
      '01', 'FI_DOC', 'AM01', 'COMPANY_CODE', 2026, 2026, '', 1, 9999999, 0, 'FI Accounting Documents for AM01 FY2026'
    );
  `);

  console.log('=================================================================');
  console.log('✅ Aura Manufacturing (AM01) Enterprise Seed COMPLETED Successfully!');
  console.log('=================================================================');
}

if (require.main === module) {
  seedAuraManufacturing()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seed execution failed:', err);
      process.exit(1);
    });
}
