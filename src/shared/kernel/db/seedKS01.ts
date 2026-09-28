/**
 * Kerala Spices & Exports Pvt Ltd - KS01 Implementation
 * Per PDF: Complete ERP S/4HANA Implementation Guide
 * Company Code KS01, Plant KP01, SLocs KS01/KS02/KS03, Purchasing KPO1/KPG, Sales KSO1/K1/K1
 * Fiscal Year K4 April-March India, Posting Period KS01, Doc Types KR/KG/KZ/RE/WE/WA/SA 50-54
 * Chart KSCA, G/L 5000000001-5000000006 etc, Currency INR, GST
 */

import { db } from './client';
import { sql } from 'drizzle-orm';

export async function seedKS01() {
  console.log('🌱 Starting KS01 - Kerala Spices & Exports seed per PDF guide...');

  // 1. Client (use existing 100 or create KS01 client)
  await db.execute(sql`INSERT INTO ent_client (code, name) VALUES ('100', 'Main Client') ON CONFLICT (code) DO NOTHING`);
  await db.execute(sql`INSERT INTO ent_client (code, name) VALUES ('KS01', 'Kerala Spices & Exports') ON CONFLICT (code) DO NOTHING`);
  const clientRes = await db.execute(sql`SELECT id FROM ent_client WHERE code = '100' LIMIT 1`);
  const clientId = (clientRes.rows[0] as any).id;

  // 2. Company Code KS01 - Kerala Spices & Exports Pvt Ltd, INR, Palakkad, India
  await db.execute(sql`
    INSERT INTO ent_company_code (client_id, code, name, currency_code, city, country, is_active)
    VALUES (${clientId}, 'KS01', 'Kerala Spices & Exports Pvt Ltd', 'INR', 'Palakkad', 'IN', true)
    ON CONFLICT (code) DO UPDATE SET name = 'Kerala Spices & Exports Pvt Ltd', currency_code = 'INR', city = 'Palakkad', country = 'IN'
  `);
  const ccRes = await db.execute(sql`SELECT id FROM ent_company_code WHERE code = 'KS01'`);
  const companyCodeId = (ccRes.rows[0] as any).id;
  console.log(`   Company Code KS01: ${companyCodeId}`);

  // 3. Currency INR
  await db.execute(sql`
    INSERT INTO ent_currency (code, name, decimal_places, symbol)
    VALUES ('INR', 'Indian Rupee', 2, '₹')
    ON CONFLICT (code) DO UPDATE SET name = 'Indian Rupee', decimal_places = 2, symbol = '₹'
  `);

  // 4. Fiscal Year Variant K4 April-March India (custom table if exists, else store in number range or config)
  // For our ERP, we store fiscal year variant as config in ent_number_range year logic + custom table
  // We'll create fiscal year variant config in a generic way via audit_log or dedicated table
  // For simplicity, create table if not exists and insert
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fi_fiscal_year_variant (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(10) UNIQUE NOT NULL,
        description VARCHAR(100),
        is_year_dependent BOOLEAN DEFAULT false,
        is_calendar_year BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fi_fiscal_year_period (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        variant_code VARCHAR(10) REFERENCES fi_fiscal_year_variant(code),
        period INTEGER NOT NULL,
        from_month INTEGER, from_day INTEGER, to_month INTEGER, to_day INTEGER
      )
    `);
    await db.execute(sql`
      INSERT INTO fi_fiscal_year_variant (code, description, is_year_dependent, is_calendar_year)
      VALUES ('K4', 'April - March India', false, false)
      ON CONFLICT (code) DO NOTHING
    `);
    // Periods April-March
    const periods = [
      [1,4,1,4,30], [2,5,1,5,31], [3,6,1,6,30], [4,7,1,7,31], [5,8,1,8,31], [6,9,1,9,30],
      [7,10,1,10,31], [8,11,1,11,30], [9,12,1,12,31], [10,1,1,1,31], [11,2,1,2,28], [12,3,1,3,31]
    ];
    for (const p of periods) {
      await db.execute(sql`
        INSERT INTO fi_fiscal_year_period (variant_code, period, from_month, from_day, to_month, to_day)
        VALUES ('K4', ${p[0]}, ${p[1]}, ${p[2]}, ${p[3]}, ${p[4]})
        ON CONFLICT DO NOTHING
      `);
    }
    console.log('   Fiscal Year Variant K4 April-March created');
  } catch (e) { console.warn('Fiscal year variant creation failed', e); }

  // 5. Posting Period Variant KS01
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fi_posting_period_variant (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      INSERT INTO fi_posting_period_variant (code, name)
      VALUES ('KS01', 'Kerala Spices Posting Period')
      ON CONFLICT (code) DO NOTHING
    `);
    // Open/Close periods OB52 - store in posting_period table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fi_posting_period (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        variant_code VARCHAR(10) REFERENCES fi_posting_period_variant(code),
        account_type VARCHAR(2) NOT NULL,
        from_period INTEGER, from_year INTEGER, to_period INTEGER, to_year INTEGER,
        from_period2 INTEGER, from_year2 INTEGER, to_period2 INTEGER, to_year2 INTEGER
      )
    `);
    const accountTypes = ['+', 'A', 'D', 'K', 'M', 'S'];
    for (const at of accountTypes) {
      await db.execute(sql`
        INSERT INTO fi_posting_period (variant_code, account_type, from_period, from_year, to_period, to_year, from_period2, from_year2, to_period2, to_year2)
        VALUES ('KS01', ${at}, 1, 2024, 12, 2025, 1, 2024, 12, 2025)
        ON CONFLICT DO NOTHING
      `);
    }
    console.log('   Posting Period Variant KS01 with open periods +/A/D/K/M/S');
  } catch (e) { console.warn('Posting period variant failed', e); }

  // 6. Credit Control Area KS01
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fi_credit_control_area (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(10) UNIQUE NOT NULL,
        description VARCHAR(100),
        currency VARCHAR(3),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      INSERT INTO fi_credit_control_area (code, description, currency)
      VALUES ('KS01', 'Kerala Spices Credit Control', 'INR')
      ON CONFLICT (code) DO NOTHING
    `);
  } catch (e) {}

  // 7. Plant KP01 Palakkad Spice Plant
  await db.execute(sql`
    INSERT INTO ent_plant (company_code_id, code, name, description, is_active)
    VALUES (${companyCodeId}, 'KP01', 'Palakkad Spice Plant', 'Kerala Spices Palakkad Plant - Plot No 45 Industrial Estate Kalmandapam PIN 678001', true)
    ON CONFLICT (code) DO UPDATE SET name = 'Palakkad Spice Plant', description = 'Kerala Spices Palakkad Plant', company_code_id = ${companyCodeId}
  `);
  const plantRes = await db.execute(sql`SELECT id FROM ent_plant WHERE code = 'KP01'`);
  const plantId = (plantRes.rows[0] as any).id;
  console.log(`   Plant KP01: ${plantId}`);

  // 8. Storage Locations KS01 Main Store, KS02 Raw Material Store, KS03 Finished Goods Store
  await db.execute(sql`
    INSERT INTO ent_storage_location (plant_id, code, name, type, is_active)
    VALUES
      (${plantId}, 'KS01', 'Main Store Palakkad', 'MAIN', true),
      (${plantId}, 'KS02', 'Raw Material Store', 'RAW', true),
      (${plantId}, 'KS03', 'Finished Goods Store', 'FG', true)
    ON CONFLICT DO NOTHING
  `);
  console.log('   SLocs KS01 Main Store, KS02 Raw Material Store, KS03 Finished Goods Store');

  // 9. Purchasing Organization KPO1
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS mm_purchasing_org (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(10) UNIQUE NOT NULL,
        description VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      INSERT INTO mm_purchasing_org (code, description)
      VALUES ('KPO1', 'Kerala Purchase Organization')
      ON CONFLICT (code) DO NOTHING
    `);
    // Purchasing Group KPG
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS mm_purchasing_group (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(10) UNIQUE NOT NULL,
        description VARCHAR(100),
        telephone VARCHAR(20),
        fax VARCHAR(20)
      )
    `);
    await db.execute(sql`
      INSERT INTO mm_purchasing_group (code, description, telephone, fax)
      VALUES ('KPG', 'Kerala Purchase Group', '491-2555001', '491-2555002')
      ON CONFLICT (code) DO NOTHING
    `);
    // Assign Plant to Company Code OX18 already via ent_plant.company_code_id
    // Assign Purch Org to Company Code OX01 and Plant OX17 - store in assignment table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS mm_purch_org_assignment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        purchasing_org_code VARCHAR(10),
        company_code_code VARCHAR(10),
        plant_code VARCHAR(10),
        is_standard BOOLEAN DEFAULT false
      )
    `);
    await db.execute(sql`
      INSERT INTO mm_purch_org_assignment (purchasing_org_code, company_code_code, plant_code, is_standard)
      VALUES ('KPO1', 'KS01', 'KP01', true)
      ON CONFLICT DO NOTHING
    `);
    console.log('   Purchasing Org KPO1, Group KPG, assigned to KS01/KP01 standard');
  } catch (e) { console.warn('Purch org failed', e); }

  // 10. Sales Organization KSO1, Distribution Channel K1, Division K1
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sd_sales_org (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(10) UNIQUE NOT NULL,
        description VARCHAR(100)
      )
    `);
    await db.execute(sql`INSERT INTO sd_sales_org (code, description) VALUES ('KSO1', 'Kerala Sales Org') ON CONFLICT (code) DO NOTHING`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sd_distribution_channel (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(10) UNIQUE NOT NULL,
        description VARCHAR(100)
      )
    `);
    await db.execute(sql`INSERT INTO sd_distribution_channel (code, description) VALUES ('K1', 'Direct Sales') ON CONFLICT (code) DO NOTHING`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sd_division (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(10) UNIQUE NOT NULL,
        description VARCHAR(100)
      )
    `);
    await db.execute(sql`INSERT INTO sd_division (code, description) VALUES ('K1', 'Spices Division') ON CONFLICT (code) DO NOTHING`);
    console.log('   Sales Org KSO1, Dist Channel K1, Division K1');
  } catch (e) {}

  // 11. Document Types KR/KG/KZ/RE/WE/WA/SA + Number Ranges 50-54
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fi_document_type (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(10) UNIQUE NOT NULL,
        description VARCHAR(100),
        number_range VARCHAR(10),
        account_types_allowed VARCHAR(50)
      )
    `);
    await db.execute(sql`
      INSERT INTO fi_document_type (code, description, number_range, account_types_allowed)
      VALUES
        ('KR', 'Vendor Invoice', '51', 'Vendor, G/L'),
        ('KG', 'Vendor Credit Memo', '52', 'Vendor, G/L'),
        ('KZ', 'Vendor Payment', '53', 'Vendor, G/L'),
        ('RE', 'Invoice - Gross', '51', 'Vendor, G/L, Asset'),
        ('WE', 'Goods Receipt', '50', 'Material, G/L'),
        ('WA', 'Goods Issue', '50', 'Material, G/L'),
        ('SA', 'G/L Account Document', '54', 'G/L Only')
      ON CONFLICT (code) DO NOTHING
    `);
  } catch (e) {}

  // Number Ranges 50-54 already exist as FI_DOC but we create specific for KS01
  const year = new Date().getFullYear();
  await db.execute(sql`
    INSERT INTO ent_number_range (object_type, company_code_id, year, prefix, from_number, to_number, current_number, is_active)
    VALUES
      ('FI_DOC_50', ${companyCodeId}, ${year}, '', 5000000000, 5099999999, 5000000000, true),
      ('FI_DOC_51', ${companyCodeId}, ${year}, '', 5100000000, 5199999999, 5100000000, true),
      ('FI_DOC_52', ${companyCodeId}, ${year}, '', 5200000000, 5299999999, 5200000000, true),
      ('FI_DOC_53', ${companyCodeId}, ${year}, '', 5300000000, 5399999999, 5300000000, true),
      ('FI_DOC_54', ${companyCodeId}, ${year}, '', 5400000000, 5499999999, 5400000000, true),
      ('MATERIAL', ${companyCodeId}, ${year}, 'MAT', 1000000000, 1999999999, 1000000000, true),
      ('BP', ${companyCodeId}, ${year}, 'BP', 100000, 999999, 100000, true),
      ('BATCH', ${companyCodeId}, ${year}, 'B', 1000000000, 1999999999, 1000000000, true),
      ('PR', ${companyCodeId}, ${year}, 'PR', 1000000000, 1999999999, 1000000000, true),
      ('PO', ${companyCodeId}, ${year}, '45', 450000000, 459999999, 450000000, true),
      ('GR', ${companyCodeId}, ${year}, '50', 500000000, 509999999, 500000000, true),
      ('IV', ${companyCodeId}, ${year}, '51', 510000000, 519999999, 510000000, true),
      ('SALES_ORDER', ${companyCodeId}, ${year}, 'SO', 1000000000, 1999999999, 1000000000, true),
      ('PI', ${companyCodeId}, ${year}, 'PI', 1000000000, 1999999999, 1000000000, true),
      ('KITTING_ORDER', ${companyCodeId}, ${year}, 'KIT', 100000, 999999, 100000, true)
    ON CONFLICT DO NOTHING
  `);
  console.log('   Number Ranges 50-54 (5000000000-5499999999) + PR/PO/GR/IV etc');

  // 12. Chart of Accounts KSCA
  await db.execute(sql`
    INSERT INTO fi_chart_of_accounts (code, name, description)
    VALUES ('KSCA', 'Kerala Spices Chart of Accounts', 'Kerala Spices & Exports Chart per PDF')
    ON CONFLICT (code) DO NOTHING
  `);
  const coaRes = await db.execute(sql`SELECT id FROM fi_chart_of_accounts WHERE code = 'KSCA'`);
  const coaId = (coaRes.rows[0] as any).id;
  await db.execute(sql`UPDATE ent_company_code SET coa_id = ${coaId} WHERE id = ${companyCodeId}`);

  // Account Groups KASS, KLIA, KREV, KEXP, KMAT, KREC, KTAX, KCSH
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fi_account_group (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        coa_id UUID REFERENCES fi_chart_of_accounts(id),
        code VARCHAR(10) NOT NULL,
        name VARCHAR(100),
        from_account VARCHAR(20),
        to_account VARCHAR(20),
        UNIQUE(coa_id, code)
      )
    `);
    await db.execute(sql`
      INSERT INTO fi_account_group (coa_id, code, name, from_account, to_account)
      VALUES
        (${coaId}, 'KASS', 'Assets', '1000000000', '1999999999'),
        (${coaId}, 'KLIA', 'Liabilities', '2000000000', '2999999999'),
        (${coaId}, 'KREV', 'Revenue', '3000000000', '3999999999'),
        (${coaId}, 'KEXP', 'Expenses', '4000000000', '4999999999'),
        (${coaId}, 'KMAT', 'Material Accounts', '5000000000', '5999999999'),
        (${coaId}, 'KREC', 'Reconciliation', '6000000000', '6999999999'),
        (${coaId}, 'KTAX', 'Tax Accounts', '7000000000', '7999999999'),
        (${coaId}, 'KCSH', 'Cash/Bank', '8000000000', '8999999999')
      ON CONFLICT DO NOTHING
    `);
  } catch (e) {}

  // 13. G/L Accounts per PDF Section 3.15
  await db.execute(sql`
    INSERT INTO fi_gl_account (coa_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant)
    VALUES
      (${coaId}, '5000000001', 'Raw Materials Stock', 'ASSET', true, false, false),
      (${coaId}, '5000000002', 'Finished Goods Stock', 'ASSET', true, false, false),
      (${coaId}, '5000000003', 'GR/IR Clearing Account', 'ASSET', true, false, false),
      (${coaId}, '5000000004', 'Stock in Transit', 'ASSET', true, false, false),
      (${coaId}, '5000000005', 'Price Difference Account', 'EXPENSE', false, false, false),
      (${coaId}, '5000000006', 'Material Consumption', 'EXPENSE', false, false, false),
      (${coaId}, '1000000000', 'Land & Buildings', 'ASSET', true, false, false),
      (${coaId}, '1000000001', 'Plant & Machinery', 'ASSET', true, false, false),
      (${coaId}, '2000000000', 'Vendor Reconciliation', 'LIABILITY', true, true, false),
      (${coaId}, '2000000001', 'GST Payable', 'LIABILITY', true, false, true),
      (${coaId}, '3000000000', 'Domestic Sales Revenue', 'REVENUE', false, false, true),
      (${coaId}, '3000000001', 'Export Sales Revenue', 'REVENUE', false, false, false),
      (${coaId}, '4000000000', 'Raw Material Consumption', 'EXPENSE', false, false, false),
      (${coaId}, '4000000001', 'Salaries & Wages', 'EXPENSE', false, false, false),
      (${coaId}, '6000000000', 'Customer Reconciliation', 'ASSET', true, true, false),
      (${coaId}, '7000000000', 'Input GST - CGST', 'ASSET', true, false, true),
      (${coaId}, '7000000001', 'Input GST - SGST', 'ASSET', true, false, true),
      (${coaId}, '7000000002', 'Input GST - IGST', 'ASSET', true, false, true),
      (${coaId}, '8000000000', 'Cash on Hand', 'ASSET', true, false, false),
      (${coaId}, '8000000001', 'Bank - SBI', 'ASSET', true, false, false),
      (${coaId}, '2500000001', 'Retained Earnings', 'LIABILITY', true, false, false)
    ON CONFLICT DO NOTHING
  `);
  console.log('   G/L Accounts 5000000001-5000000006 etc for KSCA');

  // 14. Cost Centers for KS01
  await db.execute(sql`
    INSERT INTO fi_cost_center (code, name, company_code_id)
    VALUES
      ('KS-CC-01', 'Production - Palakkad', ${companyCodeId}),
      ('KS-CC-02', 'Quality Control', ${companyCodeId}),
      ('KS-CC-03', 'Sales & Distribution', ${companyCodeId}),
      ('KS-CC-04', 'Administration', ${companyCodeId}),
      ('KS-CC-05', 'Purchasing', ${companyCodeId})
    ON CONFLICT (code) DO NOTHING
  `);

  // 15. Tax Codes GST India
  await db.execute(sql`
    INSERT INTO fi_tax_code (code, description, rate, type)
    VALUES
      ('GST0', 'GST 0%', 0, 'INPUT'),
      ('GST5', 'GST 5% Spices', 5, 'INPUT'),
      ('GST12', 'GST 12%', 12, 'INPUT'),
      ('GST18', 'GST 18%', 18, 'INPUT'),
      ('GST28', 'GST 28%', 28, 'INPUT'),
      ('IGST0', 'IGST 0% Export', 0, 'OUTPUT'),
      ('IGST5', 'IGST 5%', 5, 'OUTPUT'),
      ('IGST18', 'IGST 18%', 18, 'OUTPUT')
    ON CONFLICT (code) DO NOTHING
  `);

  // 16. UoM - ensure exists for KS01
  await db.execute(sql`
    INSERT INTO ent_uom (code, name, dimension)
    VALUES ('KG', 'Kilogram', 'WEIGHT'), ('G', 'Gram', 'WEIGHT'), ('PC', 'Piece', 'QUANTITY'), ('BOX', 'Box', 'QUANTITY'), ('PACK', 'Pack', 'QUANTITY')
    ON CONFLICT (code) DO NOTHING
  `);

  // Auto Account Determination for KS01 - per PDF Section 4 MM config OBYC equivalent
  // Map BSX/WRX/PRD/GBB to GL 5000000001 series
  try {
    const ksGlRes = await db.execute(sql`SELECT id, account_number FROM fi_gl_account WHERE coa_id = ${coaId}`);
    const ksGlMap = new Map((ksGlRes.rows as any[]).map((r: any) => [r.account_number, r.id]));
    const getKsGl = (num: string) => ksGlMap.get(num);
    if (getKsGl('5000000001')) {
      await db.execute(sql`
        INSERT INTO fi_auto_account_determination (company_code_id, transaction_key, valuation_class, gl_account_id, description)
        VALUES
          (${companyCodeId}, 'BSX', 'ROH', ${getKsGl('5000000001')}, 'Raw Materials Stock KS01'),
          (${companyCodeId}, 'BSX', 'FERT', ${getKsGl('5000000002')}, 'Finished Goods Stock KS01'),
          (${companyCodeId}, 'BSX', 'HALB', ${getKsGl('5000000001')}, 'Raw Mat Stock HALB KS01'),
          (${companyCodeId}, 'WRX', 'ROH', ${getKsGl('5000000003')}, 'GR/IR Clearing KS01 ROH'),
          (${companyCodeId}, 'WRX', 'FERT', ${getKsGl('5000000003')}, 'GR/IR Clearing KS01 FERT'),
          (${companyCodeId}, 'WRX', 'HALB', ${getKsGl('5000000003')}, 'GR/IR Clearing KS01 HALB'),
          (${companyCodeId}, 'PRD', 'ROH', ${getKsGl('5000000005')}, 'Price Diff KS01 ROH'),
          (${companyCodeId}, 'PRD', 'FERT', ${getKsGl('5000000005')}, 'Price Diff KS01 FERT'),
          (${companyCodeId}, 'GBB', 'ROH', ${getKsGl('5000000006')}, 'Material Consumption KS01'),
          (${companyCodeId}, 'GBB', 'FERT', ${getKsGl('4000000000')}, 'COGS FERT KS01'),
          (${companyCodeId}, 'BSV', 'ROH', ${getKsGl('5000000004')}, 'Stock in Transit KS01')
        ON CONFLICT DO NOTHING
      `);
      console.log('   Auto Account Determination BSX/WRX/PRD/GBB/BSV for KS01 mapped to 5000000001-5000000006');
    }
  } catch (e) { console.warn('Auto account determination KS01 failed', e); }

  // 17. Material Groups for Spices
  await db.execute(sql`
    INSERT INTO ent_material_group (code, name)
    VALUES
      ('SPICE_RAW', 'Raw Spices'),
      ('SPICE_POWDER', 'Spice Powders'),
      ('SPICE_BLEND', 'Spice Blends'),
      ('OIL', 'Essential Oils'),
      ('PACK', 'Packaging Materials'),
      ('FG', 'Finished Goods - Spices')
    ON CONFLICT (code) DO NOTHING
  `);

  // 18. Materials for Kerala Spices - as per spices business
  const spiceRawGroupRes = await db.execute(sql`SELECT id FROM ent_material_group WHERE code = 'SPICE_RAW'`);
  const spicePowderGroupRes = await db.execute(sql`SELECT id FROM ent_material_group WHERE code = 'SPICE_POWDER'`);
  const fgGroupRes = await db.execute(sql`SELECT id FROM ent_material_group WHERE code = 'FG'`);
  const spiceRawGroupId = (spiceRawGroupRes.rows[0] as any).id;
  const spicePowderGroupId = (spicePowderGroupRes.rows[0] as any).id;
  const fgGroupId = (fgGroupRes.rows[0] as any).id;

  const spicesMaterials = [
    { num: 'KS-MAT-001', desc: 'Black Pepper Whole - Raw', type: 'ROH', group: spiceRawGroupId, uom: 'KG', shelf: 365, valuation: 'ROH' },
    { num: 'KS-MAT-002', desc: 'Cardamom Green - Raw', type: 'ROH', group: spiceRawGroupId, uom: 'KG', shelf: 365, valuation: 'ROH' },
    { num: 'KS-MAT-003', desc: 'Turmeric Whole - Raw', type: 'ROH', group: spiceRawGroupId, uom: 'KG', shelf: 365, valuation: 'ROH' },
    { num: 'KS-MAT-004', desc: 'Coriander Seeds - Raw', type: 'ROH', group: spiceRawGroupId, uom: 'KG', shelf: 365, valuation: 'ROH' },
    { num: 'KS-MAT-005', desc: 'Chilli Whole - Raw', type: 'ROH', group: spiceRawGroupId, uom: 'KG', shelf: 365, valuation: 'ROH' },
    { num: 'KS-MAT-006', desc: 'Black Pepper Powder', type: 'HALB', group: spicePowderGroupId, uom: 'KG', shelf: 180, valuation: 'FERT' },
    { num: 'KS-MAT-007', desc: 'Turmeric Powder', type: 'HALB', group: spicePowderGroupId, uom: 'KG', shelf: 180, valuation: 'FERT' },
    { num: 'KS-MAT-008', desc: 'Garam Masala Blend', type: 'FERT', group: fgGroupId, uom: 'KG', shelf: 180, valuation: 'FERT' },
    { num: 'KS-MAT-009', desc: 'Chilli Powder', type: 'FERT', group: fgGroupId, uom: 'KG', shelf: 180, valuation: 'FERT' },
    { num: 'KS-MAT-010', desc: 'Spice Export Pack 500g', type: 'FERT', group: fgGroupId, uom: 'PC', shelf: 180, valuation: 'FERT' },
  ];

  for (const mat of spicesMaterials) {
    await db.execute(sql`
      INSERT INTO ent_material_master (material_number, type, group_id, base_uom, description, is_batch_managed, shelf_life_days, valuation_class, expiry_control, is_active)
      VALUES (${mat.num}, ${mat.type}, ${mat.group}, ${mat.uom}, ${mat.desc}, true, ${mat.shelf}, ${mat.valuation}, 'BLOCK', true)
      ON CONFLICT (material_number) DO UPDATE SET description = ${mat.desc}, type = ${mat.type}
    `);
    const matRes = await db.execute(sql`SELECT id FROM ent_material_master WHERE material_number = ${mat.num}`);
    const matId = (matRes.rows[0] as any).id;
    await db.execute(sql`
      INSERT INTO ent_material_plant (material_id, plant_id, price_control, moving_avg_price, standard_price, total_stock_qty, total_stock_value)
      VALUES (${matId}, ${plantId}, ${mat.type === 'FERT' || mat.type === 'HALB' ? 'S' : 'V'}, 0, 0, 0, 0)
      ON CONFLICT (material_id, plant_id) DO NOTHING
    `);
  }
  console.log('   Materials KS-MAT-001 to 010 - Black Pepper, Cardamom, Turmeric, etc');

  // 19. Business Partners - Vendors and Customers for Spices
  const vendors = [
    { num: 'KS-V-001', name: 'Malabar Spice Farms', type: 'VENDOR', city: 'Wayanad' },
    { num: 'KS-V-002', name: 'Idukki Cardamom Cooperative', type: 'VENDOR', city: 'Idukki' },
    { num: 'KS-V-003', name: 'Alleppey Turmeric Traders', type: 'VENDOR', city: 'Alappuzha' },
    { num: 'KS-C-001', name: 'Kochi Exports Ltd', type: 'CUSTOMER', city: 'Kochi' },
    { num: 'KS-C-002', name: 'Mumbai Spice Distributors', type: 'CUSTOMER', city: 'Mumbai' },
  ];
  for (const bp of vendors) {
    await db.execute(sql`
      INSERT INTO ent_business_partner (bp_number, name1, role, address, is_blocked, is_one_time)
      VALUES (${bp.num}, ${bp.name}, ${bp.type === 'VENDOR' ? 'VENDOR' : bp.type === 'CUSTOMER' ? 'CUSTOMER' : 'BOTH'}::bp_role, ${bp.city + ', IN'}, false, false)
      ON CONFLICT (bp_number) DO UPDATE SET name1 = ${bp.name}
    `);
  }
  console.log('   Business Partners - Vendors and Customers for KS01');

  // 20. Workflow Definitions for KS01
  await db.execute(sql`
    INSERT INTO wf_definition (code, name, document_type, is_active, description)
    VALUES
      ('KS01_PR_APPROVAL', 'KS01 PR Approval - Manager + Owner >10000 INR', 'PR', true, 'Kerala Spices PR approval, Manager + Owner dual >10000 INR'),
      ('KS01_PO_APPROVAL', 'KS01 PO Approval - Manager + Owner >50000 INR', 'PO', true, 'Kerala Spices PO approval, Manager + Owner >50000 INR')
    ON CONFLICT (code) DO NOTHING
  `);

  console.log('✅ KS01 - Kerala Spices & Exports seed completed');
  console.log(`   Company Code: KS01 (${companyCodeId}) - INR, GST, K4 April-March`);
  console.log(`   Plant: KP01 Palakkad Spice Plant (${plantId})`);
  console.log(`   SLocs: KS01 Main Store, KS02 Raw Material Store, KS03 Finished Goods Store`);
  console.log(`   Purch Org: KPO1, Group: KPG, Sales Org: KSO1, Channel: K1, Division: K1`);
  console.log(`   Chart: KSCA with G/L 5000000001-5000000006`);
  console.log(`   Materials: 10 spices materials KS-MAT-001 to 010`);
}

if (require.main === module) {
  seedKS01()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('❌ KS01 seed failed:', e);
      process.exit(1);
    });
}
