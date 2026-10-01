/**
 * Layer 0 Seed - Single Client, One Company Code, KWD, Batch Managed
 * Plus KS01 - Kerala Spices & Exports Pvt Ltd per PDF guide
 */
import { db } from './client';
import { sql } from 'drizzle-orm';
import { seedKS01 } from './seedKS01';

export async function seedLayer0() {
  console.log('🌱 Starting Layer 0 seed...');

  // Env control: SEED_DEFAULT_COMPANY - if false, don't seed 1000 Main Company KWD (for SIT scratch)
  // Default true for backward compat, but for true scratch test set SEED_DEFAULT_COMPANY=false in .env
  const seedDefaultCompany = process.env.SEED_DEFAULT_COMPANY !== 'false'; // default true, set false to skip 1000
  const fmcgEnabled = process.env.FMCG_SAMPLE_DATA_ENABLED === 'true';

  // 1. Client
  await db.execute(sql`INSERT INTO core_tenant (code, name) VALUES ('100', 'Main Client') ON CONFLICT (code) DO NOTHING`);
  const clientRes = await db.execute(sql`SELECT id FROM core_tenant WHERE code = '100'`);
  const clientId = (clientRes.rows[0] as any).id;

  // 2. Company Code 1000 – only if SEED_DEFAULT_COMPANY != false – now INR default per user request, KWD has to be added by user
  let companyCodeId: string | null = null;
  if (seedDefaultCompany) {
    await db.execute(sql`INSERT INTO org_legal_entity (client_id, code, name, currency_code, city, country)
      VALUES (${clientId}, '1000', 'Main Company INR', 'INR', 'Kochi', 'IN')
      ON CONFLICT (code) DO UPDATE SET currency_code = 'INR', city = 'Kochi', country = 'IN'`);
    const ccRes = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code = '1000'`);
    companyCodeId = (ccRes.rows[0] as any).id;
    console.log(`   Seeded default company 1000 Main Company INR (SEED_DEFAULT_COMPANY=${seedDefaultCompany}) – only INR default, KWD has to be added by user via /api/currencies`);
  } else {
    console.log(`   Skipped default company 1000 (SEED_DEFAULT_COMPANY=false) – for SIT scratch, create your own T001 via UI`);
    // Try to get any existing company code for further seeding, or skip plant/material seeding if none
    const anyCc = await db.execute(sql`SELECT id FROM org_legal_entity LIMIT 1`);
    if (anyCc.rows.length > 0) companyCodeId = (anyCc.rows[0] as any).id;
  }

  // 3. Plants – only if companyCodeId exists
  if (!companyCodeId) {
    console.log('   No company code – skipping plants, SLocs, CoA assignment, cost centers, materials (true scratch mode)');
    // Still seed UoM, Currency, Material Groups, Chart of Accounts (standard CoA is ok per user)
  } else {
    await db.execute(sql`INSERT INTO org_facility (company_code_id, code, name, description)
      VALUES 
        (${companyCodeId}, '1000', 'Main Production Kitchen', 'Main kitchen and production facility'),
        (${companyCodeId}, '1100', 'Secondary Storage', 'Secondary storage and cold storage')
      ON CONFLICT (code) DO NOTHING`);
  }
  const plantRes = companyCodeId ? await db.execute(sql`SELECT id, code FROM org_facility WHERE company_code_id = ${companyCodeId}`) : { rows: [] };
  const mainPlant = plantRes.rows.find((r: any) => r.code === '1000') as any;
  const storagePlant = plantRes.rows.find((r: any) => r.code === '1100') as any;
  const mainPlantId = mainPlant?.id || (plantRes.rows[0] as any)?.id;
  const storagePlantId = storagePlant?.id || mainPlantId;

  // 4. Storage Locations
  await db.execute(sql`INSERT INTO org_inventory_location (plant_id, code, name, type)
    VALUES
      (${mainPlantId}, '0001', 'Main Store', 'MAIN'),
      (${mainPlantId}, '0002', 'Cold Storage', 'COLD'),
      (${mainPlantId}, '0003', 'Shop Floor', 'SHOP_FLOOR'),
      (${mainPlantId}, '0004', 'Returns', 'RETURNS'),
      (${mainPlantId}, '0005', 'Quality Inspection', 'QI')
    ON CONFLICT DO NOTHING`);

  // 5. UoM
  await db.execute(sql`INSERT INTO core_unit_measure (code, name, dimension)
    VALUES
      ('KG', 'Kilogram', 'WEIGHT'),
      ('G', 'Gram', 'WEIGHT'),
      ('L', 'Liter', 'VOLUME'),
      ('ML', 'Milliliter', 'VOLUME'),
      ('PC', 'Piece', 'QUANTITY'),
      ('BOX', 'Box', 'QUANTITY'),
      ('PACK', 'Pack', 'QUANTITY'),
      ('KIT', 'Kit', 'QUANTITY')
    ON CONFLICT (code) DO NOTHING`);

  // 6. Currency – only INR default per user request, all other currencies (like KWD) has to be added by user via /api/currencies
  await db.execute(sql`INSERT INTO core_currency (code, name, decimal_places, symbol)
    VALUES ('INR', 'Indian Rupee', 2, '₹')
    ON CONFLICT (code) DO UPDATE SET name = 'Indian Rupee', decimal_places = 2, symbol = '₹'`);
  console.log('   Currency INR seeded as default – only INR default, KWD and others must be added by user via POST /api/currencies – e.g., KWD, USD, EUR');

  // 7. Material Groups
  await db.execute(sql`INSERT INTO prod_category (code, name)
    VALUES
      ('FOOD', 'Food Ingredients'),
      ('BEV', 'Beverages'),
      ('PACK', 'Packaging'),
      ('KITS', 'Kits and Sub-assemblies'),
      ('MENU', 'Menu Items / Finished Goods'),
      ('SERV', 'Services')
    ON CONFLICT (code) DO NOTHING`);

  // 5b. Material Types - ERP OMS2 - configurable ROH/FERT/HALB etc
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS ent_material_type (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(20) UNIQUE NOT NULL, name VARCHAR(100) NOT NULL, description TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO ent_material_type (code, name, description) VALUES
      ('ROH', 'Raw Materials', 'Raw materials procured externally - OMS2'),
      ('HALB', 'Semi-Finished Goods', 'Semi-finished produced in-house - OMS2'),
      ('FERT', 'Finished Goods', 'Finished goods for sale - OMS2'),
      ('HAWA', 'Trading Goods', 'Trading goods for resale - OMS2'),
      ('VERP', 'Packaging Materials', 'Packaging materials - OMS2'),
      ('NLAG', 'Non-Stock Material', 'Non-stock consumables - OMS2'),
      ('DIEN', 'Services', 'Services - OMS2')
      ON CONFLICT (code) DO NOTHING`);
    console.log('   Material Types ROH/HALB/FERT/HAWA/VERP/NLAG/DIEN seeded - OMS2 configurable');
  } catch (e) { console.warn('Material type seed failed', e); }

  // 8. Chart of Accounts - ERP standard CoAs like in ERP: INT, KSCA, CAUS, GKR, YIN
  // Code OB13 - General CoA available like ERP defaults
  await db.execute(sql`INSERT INTO fin_chart (code, name, description)
    VALUES 
      ('INT', 'International CoA', 'ERP Standard International Chart - OB13 - General CoA for INT'),
      ('KSCA', 'Kerala Spices Chart', 'Kerala Spices Chart of Accounts - OB13 - General CoA for KS01/1000 - ERP-like custom'),
      ('CAUS', 'Chart of Accounts USA', 'ERP Standard US Chart - OB13 - General CoA USA - GAAP'),
      ('GKR', 'German Community Chart', 'ERP Standard German GKR Chart - OB13 - General CoA Germany'),
      ('YIN', 'Indian Chart', 'ERP Standard India Chart - OB13 - General CoA India GST')
    ON CONFLICT (code) DO NOTHING`);
  const coaRes = await db.execute(sql`SELECT id, code FROM fin_chart`);
  const coaMap = new Map((coaRes.rows as any[]).map((r:any)=>[r.code, r.id]));
  const coaId = coaMap.get('INT') || coaMap.get('KSCA');
  const kscaId = coaMap.get('KSCA');
  const causId = coaMap.get('CAUS');
  const gkrId = coaMap.get('GKR');
  const yinId = coaMap.get('YIN');

  if (companyCodeId && coaId) {
    await db.execute(sql`UPDATE org_legal_entity SET coa_id = ${coaId} WHERE id = ${companyCodeId}`);
  }

  // 8b. Account Groups OBD4 - ERP standard groups KASS/KLIA/KREV/KEXP/KMAT etc for each CoA
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fi_account_group (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), coa_id UUID REFERENCES fin_chart(id), code VARCHAR(10) NOT NULL, name VARCHAR(100), description TEXT, from_account VARCHAR(20), to_account VARCHAR(20), is_active BOOLEAN DEFAULT true, UNIQUE(coa_id, code))`);
    for (const [cId, cCode] of [[coaId,'INT'], [kscaId,'KSCA'], [causId,'CAUS'], [gkrId,'GKR'], [yinId,'YIN']] as any) {
      if (!cId) continue;
      await db.execute(sql`INSERT INTO fi_account_group (coa_id, code, name, description, from_account, to_account)
        VALUES
          (${cId}, 'KASS', 'Assets', 'Balance Sheet Assets - OBD4', '1000000000', '1999999999'),
          (${cId}, 'KLIA', 'Liabilities', 'Balance Sheet Liabilities - OBD4', '2000000000', '2999999999'),
          (${cId}, 'KREV', 'Revenue', 'P&L Revenue - OBD4', '3000000000', '3999999999'),
          (${cId}, 'KEXP', 'Expenses', 'P&L Expenses - OBD4', '4000000000', '4999999999'),
          (${cId}, 'KMAT', 'Material Stock', 'Material Stock Accounts - OBD4', '5000000000', '5999999999'),
          (${cId}, 'KREC', 'Reconciliation', 'Recon Accounts Customers/Vendors - OBD4', '6000000000', '6999999999'),
          (${cId}, 'KTAX', 'Tax Accounts', 'Tax Accounts Input/Output - OBD4', '7000000000', '7999999999'),
          (${cId}, 'KCSH', 'Cash/Bank', 'Cash and Bank Accounts - OBD4', '8000000000', '8999999999')
        ON CONFLICT DO NOTHING`);
    }
    console.log('   Account Groups KASS/KLIA/KREV/KEXP/KMAT/KREC/KTAX/KCSH seeded for INT/KSCA/CAUS/GKR/YIN - OBD4');
  } catch (e) { console.warn('Account group seed failed', e); }

  // 9. GL Accounts - standard CoA is ok per user, seed regardless of company - ERP-like defaults
  // INT - International standard
  if (coaId) {
    await db.execute(sql`INSERT INTO fin_ledger_account (coa_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant)
      VALUES
        (${coaId}, '100000', 'Inventory ROH', 'ASSET', true, false, false),
        (${coaId}, '100001', 'Inventory FERT', 'ASSET', true, false, false),
        (${coaId}, '100002', 'Inventory KITS', 'ASSET', true, false, false),
        (${coaId}, '100010', 'Cash on Hand', 'ASSET', true, false, false),
        (${coaId}, '100011', 'Cash - KNET', 'ASSET', true, false, false),
        (${coaId}, '120000', 'Accounts Receivable - Customers', 'ASSET', true, true, false),
        (${coaId}, '200000', 'GR/IR Clearing', 'LIABILITY', true, false, false),
        (${coaId}, '200001', 'Freight Clearing', 'LIABILITY', true, false, false),
        (${coaId}, '200002', 'Customs Clearing', 'LIABILITY', true, false, false),
        (${coaId}, '210000', 'Accounts Payable - Vendors', 'LIABILITY', true, true, false),
        (${coaId}, '210001', 'Salary Payable', 'LIABILITY', true, false, false),
        (${coaId}, '300000', 'COGS - Food', 'EXPENSE', false, false, false),
        (${coaId}, '300001', 'COGS - Kits', 'EXPENSE', false, false, false),
        (${coaId}, '310000', 'Price Difference - PRD', 'EXPENSE', false, false, false),
        (${coaId}, '400000', 'Revenue - Menu Sales', 'REVENUE', false, false, true),
        (${coaId}, '400001', 'Revenue - B2B Sales', 'REVENUE', false, false, true),
        (${coaId}, '500000', 'Salary Expense', 'EXPENSE', false, false, false),
        (${coaId}, '500001', 'Freight Expense', 'EXPENSE', false, false, false),
        (${coaId}, '500002', 'Customs Expense', 'EXPENSE', false, false, false),
        (${coaId}, '500005', 'Inventory Loss / Shrinkage', 'EXPENSE', false, false, false),
        (${coaId}, '400002', 'Inventory Gain', 'REVENUE', false, false, false),
        (${coaId}, '220000', 'Output Tax - VAT', 'LIABILITY', true, false, true),
        (${coaId}, '130000', 'Input Tax - VAT', 'ASSET', true, false, true),
        (${coaId}, '2500000001', 'Retained Earnings', 'LIABILITY', true, false, false)
      ON CONFLICT DO NOTHING`);
  }
  // KSCA - Kerala Spices - ERP-like with 5000000001 series - FS00 general CoA accounts
  if (kscaId) {
    await db.execute(sql`INSERT INTO fin_ledger_account (coa_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant)
      VALUES
        (${kscaId}, '5000000001', 'Raw Materials Stock', 'ASSET', true, false, false),
        (${kscaId}, '5000000002', 'Finished Goods Stock', 'ASSET', true, false, false),
        (${kscaId}, '5000000003', 'GR/IR Clearing Account', 'ASSET', true, false, false),
        (${kscaId}, '5000000004', 'Stock in Transit', 'ASSET', true, false, false),
        (${kscaId}, '5000000005', 'Price Difference Account', 'EXPENSE', false, false, false),
        (${kscaId}, '5000000006', 'Material Consumption', 'EXPENSE', false, false, false),
        (${kscaId}, '1000000000', 'Land & Buildings', 'ASSET', true, false, false),
        (${kscaId}, '1000000001', 'Plant & Machinery', 'ASSET', true, false, false),
        (${kscaId}, '2000000000', 'Vendor Reconciliation', 'LIABILITY', true, true, false),
        (${kscaId}, '2000000001', 'GST Payable', 'LIABILITY', true, false, true),
        (${kscaId}, '3000000000', 'Domestic Sales Revenue', 'REVENUE', false, false, true),
        (${kscaId}, '3000000001', 'Export Sales Revenue', 'REVENUE', false, false, false),
        (${kscaId}, '4000000000', 'Raw Material Consumption', 'EXPENSE', false, false, false),
        (${kscaId}, '4000000001', 'Salaries & Wages', 'EXPENSE', false, false, false),
        (${kscaId}, '6000000000', 'Customer Reconciliation', 'ASSET', true, true, false),
        (${kscaId}, '7000000000', 'Input GST - CGST', 'ASSET', true, false, true),
        (${kscaId}, '7000000001', 'Input GST - SGST', 'ASSET', true, false, true),
        (${kscaId}, '7000000002', 'Input GST - IGST', 'ASSET', true, false, true),
        (${kscaId}, '8000000000', 'Cash on Hand', 'ASSET', true, false, false),
        (${kscaId}, '8000000001', 'Bank - SBI', 'ASSET', true, false, false),
        (${kscaId}, '2500000001', 'Retained Earnings', 'LIABILITY', true, false, false)
      ON CONFLICT DO NOTHING`);
  }
  // CAUS - USA Chart - ERP standard similar to INT but US GAAP
  if (causId) {
    await db.execute(sql`INSERT INTO fin_ledger_account (coa_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant)
      VALUES
        (${causId}, '100000', 'Cash', 'ASSET', true, false, false),
        (${causId}, '120000', 'Accounts Receivable', 'ASSET', true, true, false),
        (${causId}, '140000', 'Inventory - Raw Materials', 'ASSET', true, false, false),
        (${causId}, '141000', 'Inventory - Finished Goods', 'ASSET', true, false, false),
        (${causId}, '200000', 'GR/IR Clearing', 'LIABILITY', true, false, false),
        (${causId}, '210000', 'Accounts Payable', 'LIABILITY', true, true, false),
        (${causId}, '300000', 'Sales Revenue', 'REVENUE', false, false, true),
        (${causId}, '400000', 'COGS', 'EXPENSE', false, false, false),
        (${causId}, '500000', 'Operating Expenses', 'EXPENSE', false, false, false),
        (${causId}, '2500000001', 'Retained Earnings', 'LIABILITY', true, false, false)
      ON CONFLICT DO NOTHING`);
  }
  // GKR - German Chart
  if (gkrId) {
    await db.execute(sql`INSERT INTO fin_ledger_account (coa_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant)
      VALUES
        (${gkrId}, '160000', 'Rohstoffe', 'ASSET', true, false, false),
        (${gkrId}, '220000', 'Fertige Erzeugnisse', 'ASSET', true, false, false),
        (${gkrId}, '180000', 'Bank', 'ASSET', true, false, false),
        (${gkrId}, '200000', 'Verbindlichkeiten', 'LIABILITY', true, true, false),
        (${gkrId}, '400000', 'Umsatzerlöse', 'REVENUE', false, false, true),
        (${gkrId}, '500000', 'Materialaufwand', 'EXPENSE', false, false, false),
        (${gkrId}, '2500000001', 'Gewinnvortrag', 'LIABILITY', true, false, false)
      ON CONFLICT DO NOTHING`);
  }
  // YIN - India Chart GST
  if (yinId) {
    await db.execute(sql`INSERT INTO fin_ledger_account (coa_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant)
      VALUES
        (${yinId}, '100000', 'Inventory Raw', 'ASSET', true, false, false),
        (${yinId}, '100001', 'Inventory Finished', 'ASSET', true, false, false),
        (${yinId}, '200000', 'GR/IR Clearing', 'LIABILITY', true, false, false),
        (${yinId}, '210000', 'Vendor Payable', 'LIABILITY', true, true, false),
        (${yinId}, '120000', 'Customer Receivable', 'ASSET', true, true, false),
        (${yinId}, '400000', 'Sales Domestic', 'REVENUE', false, false, true),
        (${yinId}, '400001', 'Sales Export', 'REVENUE', false, false, false),
        (${yinId}, '500000', 'COGS', 'EXPENSE', false, false, false),
        (${yinId}, '700000', 'CGST Input', 'ASSET', true, false, true),
        (${yinId}, '700001', 'SGST Input', 'ASSET', true, false, true),
        (${yinId}, '200001', 'CGST Payable', 'LIABILITY', true, false, true),
        (${yinId}, '200002', 'SGST Payable', 'LIABILITY', true, false, true),
        (${yinId}, '2500000001', 'Retained Earnings', 'LIABILITY', true, false, false)
      ON CONFLICT DO NOTHING`);
  }
  console.log('   GL Accounts seeded for INT/KSCA/CAUS/GKR/YIN - ERP-like defaults FS00 general CoA');

  // 10. Cost Centers - only if company exists, otherwise skip (user can create own)
  if (companyCodeId) {
    await db.execute(sql`INSERT INTO fin_cost_center (code, name, company_code_id)
      VALUES
        ('CC-KITCHEN-01', 'Main Kitchen', ${companyCodeId}),
        ('CC-COLD-01', 'Cold Storage', ${companyCodeId}),
        ('CC-SALES-01', 'Sales / Shop Floor', ${companyCodeId}),
        ('CC-ADMIN-01', 'Administration', ${companyCodeId}),
        ('CC-PURCH-01', 'Purchasing', ${companyCodeId})
      ON CONFLICT (code) DO NOTHING`);
  }

  // 11. Tax Codes – FTXP – VAT 5%, GST etc – configurable, general tax codes like ERP
  // ERP defaults: V0 Input 0%, V5 Input 5% VAT 5%, A0 Output 0%, A5 Output 5%, plus GST 5%/12%/18%/28% for India, plus IGST
  await db.execute(sql`INSERT INTO fin_tax_rule (code, description, rate, type)
    VALUES
      ('V0', 'Input Tax 0% – VAT 0% – FTXP – No VAT', 0, 'INPUT'),
      ('V5', 'Input Tax 5% – VAT 5% – FTXP – Kuwait/GCC VAT 5% Input – configurable', 5, 'INPUT'),
      ('V14', 'Input Tax 14% – VAT 14%', 14, 'INPUT'),
      ('V15', 'Input Tax 15% – VAT 15% – KSA VAT 15%', 15, 'INPUT'),
      ('A0', 'Output Tax 0% – VAT 0% – FTXP – No VAT Output', 0, 'OUTPUT'),
      ('A5', 'Output Tax 5% – VAT 5% – FTXP – VAT 5% Output – configurable', 5, 'OUTPUT'),
      ('A14', 'Output Tax 14%', 14, 'OUTPUT'),
      ('A15', 'Output Tax 15% – KSA VAT 15% Output', 15, 'OUTPUT'),
      ('GST0', 'GST 0% – India GST 0% – FTXP', 0, 'INPUT'),
      ('GST5', 'GST 5% Spices – India GST 5% – FTXP – VAT 5% equivalent – configurable', 5, 'INPUT'),
      ('GST12', 'GST 12% – FTXP', 12, 'INPUT'),
      ('GST18', 'GST 18% – FTXP', 18, 'INPUT'),
      ('GST28', 'GST 28% – FTXP', 28, 'INPUT'),
      ('IGST0', 'IGST 0% Export – FTXP', 0, 'OUTPUT'),
      ('IGST5', 'IGST 5% – FTXP – VAT 5% Output IGST', 5, 'OUTPUT'),
      ('IGST18', 'IGST 18% – FTXP', 18, 'OUTPUT')
    ON CONFLICT (code) DO NOTHING`);
  console.log('   Tax Codes V0/V5 VAT 5%/V14/V15/A0/A5 VAT 5% Output/GST0/GST5 5% Spices/GST12/GST18/GST28/IGST0/IGST5/IGST18 seeded – FTXP – configurable – VAT 5% included');

  // 12. Auto Account Determination
  const glRes = await db.execute(sql`SELECT id, account_number FROM fin_ledger_account WHERE coa_id = ${coaId}`);
  const glMap = new Map((glRes.rows as any[]).map((r: any) => [r.account_number, r.id]));

  const getGl = (num: string) => glMap.get(num);
  
  if (getGl('100000') && companyCodeId) {
    await db.execute(sql`INSERT INTO fin_auto_account (company_code_id, transaction_key, valuation_class, gl_account_id, description)
      VALUES
        (${companyCodeId}, 'INV_POSTING', 'ROH', ${getGl('100000')}, 'Inventory ROH'),
        (${companyCodeId}, 'INV_POSTING', 'FERT', ${getGl('100001')}, 'Inventory FERT'),
        (${companyCodeId}, 'INV_POSTING', 'KITS', ${getGl('100002')}, 'Inventory KITS'),
        (${companyCodeId}, 'GR_IR_CLEARING', 'ROH', ${getGl('200000')}, 'GR/IR ROH'),
        (${companyCodeId}, 'GR_IR_CLEARING', 'FERT', ${getGl('200000')}, 'GR/IR FERT'),
        (${companyCodeId}, 'GR_IR_CLEARING', 'KITS', ${getGl('200000')}, 'GR/IR KITS'),
        (${companyCodeId}, 'INV_OFFSET', 'ROH', ${getGl('300000')}, 'COGS ROH'),
        (${companyCodeId}, 'INV_OFFSET', 'FERT', ${getGl('300000')}, 'COGS FERT'),
        (${companyCodeId}, 'PRICE_DIFF', 'ROH', ${getGl('310000')}, 'Price Diff ROH'),
        (${companyCodeId}, 'PRICE_DIFF', 'FERT', ${getGl('310000')}, 'Price Diff FERT'),
        (${companyCodeId}, 'FREIGHT', 'ROH', ${getGl('200001')}, 'Freight Clearing'),
        (${companyCodeId}, 'CUSTOMS', 'ROH', ${getGl('200002')}, 'Customs Clearing')
      ON CONFLICT DO NOTHING`);
  }

  // 13. Number Ranges 2026 - only if company exists (standard CoA is ok, but number ranges need company)
  const year = new Date().getFullYear();
  if (companyCodeId) {
    await db.execute(sql`INSERT INTO core_number_range (object_type, company_code_id, year, prefix, from_number, to_number, current_number, is_active)
      VALUES
        ('MATERIAL', ${companyCodeId}, ${year}, 'MAT', 1000000000, 1999999999, 1000000000, true),
        ('BP', ${companyCodeId}, ${year}, 'BP', 100000, 999999, 100000, true),
        ('BATCH', ${companyCodeId}, ${year}, 'B', 1000000000, 1999999999, 1000000000, true),
        ('PI', ${companyCodeId}, ${year}, 'PI', 1000000000, 1999999999, 1000000000, true),
        ('COSTING_RUN', ${companyCodeId}, ${year}, 'COST', 100000, 999999, 100000, true),
        ('PR', ${companyCodeId}, ${year}, 'PR', 1000000000, 1999999999, 1000000000, true),
        ('PO', ${companyCodeId}, ${year}, '45', 450000000, 459999999, 450000000, true),
        ('GR', ${companyCodeId}, ${year}, '50', 500000000, 509999999, 500000000, true),
        ('IV', ${companyCodeId}, ${year}, '51', 510000000, 519999999, 510000000, true),
        ('PROD_ORDER', ${companyCodeId}, ${year}, '10', 1000000000, 1999999999, 1000000000, true),
        ('FI_DOC', ${companyCodeId}, ${year}, '', 1000000000, 1999999999, 1000000000, true),
        ('PAYROLL', ${companyCodeId}, ${year}, 'HR', 100000, 999999, 100000, true),
        ('KITTING_ORDER', ${companyCodeId}, ${year}, 'KIT', 100000, 999999, 100000, true),
        ('SALES_ORDER', ${companyCodeId}, ${year}, 'SO', 1000000000, 1999999999, 1000000000, true)
      ON CONFLICT DO NOTHING`);
  }

  // 14. Sample Materials with expiry control and kitting flags – only if FMCG enabled or company exists
  // For true SIT scratch (SEED_DEFAULT_COMPANY=false), skip materials – user creates own via UI
  if (!companyCodeId) {
    console.log('   Skipped sample materials – no company code (true scratch)');
  } else if (process.env.FMCG_SAMPLE_DATA_ENABLED !== 'true' && !seedDefaultCompany) {
    console.log('   Skipped sample materials – FMCG disabled and default company disabled (true scratch)');
  } else {
  const foodGroupRes = await db.execute(sql`SELECT id FROM prod_category WHERE code = 'FOOD'`);
  const kitsGroupRes = await db.execute(sql`SELECT id FROM prod_category WHERE code = 'KITS'`);
  const menuGroupRes = await db.execute(sql`SELECT id FROM prod_category WHERE code = 'MENU'`);
  const foodGroupId = (foodGroupRes.rows[0] as any).id;
  const kitsGroupId = (kitsGroupRes.rows[0] as any).id;
  const menuGroupId = (menuGroupRes.rows[0] as any).id;

  await db.execute(sql`INSERT INTO prod_item (material_number, type, group_id, base_uom, description, is_batch_managed, shelf_life_days, valuation_class, expiry_control, is_kit, is_phantom_kit, landed_cost_relevance)
    VALUES
      ('MAT-1000000001', 'ROH', ${foodGroupId}, 'KG', 'Chicken Breast Fresh', true, 5, 'ROH', 'BLOCK', false, false, 'ALL'),
      ('MAT-1000000002', 'ROH', ${foodGroupId}, 'KG', 'Rice Basmati', true, 365, 'ROH', 'WARNING', false, false, 'ALL'),
      ('MAT-1000000003', 'ROH', ${foodGroupId}, 'L', 'Cooking Oil', true, 180, 'ROH', 'WARNING', false, false, 'ALL'),
      ('MAT-1000000004', 'ROH', ${kitsGroupId}, 'KIT', 'Spice Kit - Shawarma', true, 30, 'KITS', 'BLOCK', true, false, 'ALL'),
      ('MAT-1000000005', 'ROH', ${kitsGroupId}, 'KIT', 'Sauce Kit - Garlic', true, 7, 'KITS', 'BLOCK', true, false, 'ALL'),
      ('MAT-1000000006', 'ROH', ${kitsGroupId}, 'KIT', 'Burger Kit Phantom', true, 2, 'KITS', 'BLOCK', false, true, 'NONE'),
      ('MAT-1000000007', 'FERT', ${menuGroupId}, 'PC', 'Chicken Shawarma Sandwich', false, 1, 'FERT', 'BLOCK', false, false, 'NONE'),
      ('MAT-1000000008', 'FERT', ${menuGroupId}, 'PC', 'Chicken Burger', false, 1, 'FERT', 'BLOCK', false, false, 'NONE')
    ON CONFLICT (material_number) DO NOTHING`);

  // Material Plant extensions
  const matRes = await db.execute(sql`SELECT id, material_number, type FROM prod_item`);
  for (const mat of matRes.rows as any[]) {
    const isFert = mat.type === 'FERT';
    const priceControl = isFert ? 'S' : 'V';
    await db.execute(sql`INSERT INTO prod_item_plant (material_id, plant_id, price_control, moving_avg_price, standard_price, total_stock_qty, total_stock_value)
      VALUES (${mat.id}, ${mainPlantId}, ${priceControl}, 0, 0, 0, 0)
      ON CONFLICT DO NOTHING`);
  }

  } // end materials conditional

  // 15. Work Centers – only if plant exists
  if (typeof mainPlantId !== 'undefined' && mainPlantId) {
    await db.execute(sql`INSERT INTO pp_work_center (code, name, plant_id, capacity_per_hour)
      VALUES
        ('WC-KITCHEN-01', 'Main Kitchen Station', ${mainPlantId}, 50),
        ('WC-COLD-01', 'Cold Prep Station', ${mainPlantId}, 30),
        ('WC-ASSEMBLY-01', 'Assembly Station', ${mainPlantId}, 100)
      ON CONFLICT (code) DO NOTHING`);
  }

  // 16. BOMs – only if materials and plant exist
  let matMap = new Map();
  let matRes: any = { rows: [] };
  try {
    matRes = await db.execute(sql`SELECT id, material_number, type FROM prod_item`);
    matMap = new Map((matRes.rows as any[]).map((r: any) => [r.material_number, r.id]));
  } catch { matRes = { rows: [] }; }
  
  const spiceKitId = matMap.get('MAT-1000000004');
  const shawarmaId = matMap.get('MAT-1000000007');
  const chickenId = matMap.get('MAT-1000000001');
  const riceId = matMap.get('MAT-1000000002');

  if (spiceKitId && chickenId && riceId && typeof mainPlantId !== 'undefined' && mainPlantId) {
    await db.execute(sql`INSERT INTO mfg_bom_header (bom_number, material_id, plant_id, type, status, base_quantity, base_uom, is_kit, is_phantom, expiry_rule)
      VALUES ('BOM-KIT-SPICE-01', ${spiceKitId}, ${mainPlantId}, 'KIT_STOCKED', 'ACTIVE', 1, 'KIT', true, false, 'MIN_COMPONENTS')
      ON CONFLICT (bom_number) DO NOTHING`);
    
    const bomRes = await db.execute(sql`SELECT id FROM mfg_bom_header WHERE bom_number = 'BOM-KIT-SPICE-01'`);
    if (bomRes.rows.length > 0) {
      const bomId = (bomRes.rows[0] as any).id;
      await db.execute(sql`INSERT INTO mfg_bom_line (bom_header_id, line_number, component_material_id, quantity, uom, is_batch_tracked)
        VALUES
          (${bomId}, 10, ${chickenId}, 0.05, 'KG', true),
          (${bomId}, 20, ${riceId}, 0.02, 'KG', true)
        ON CONFLICT DO NOTHING`);
    }
  }

  if (shawarmaId && spiceKitId && chickenId && riceId && typeof mainPlantId !== 'undefined' && mainPlantId) {
    await db.execute(sql`INSERT INTO mfg_bom_header (bom_number, material_id, plant_id, type, status, base_quantity, base_uom, is_kit, is_phantom)
      VALUES ('BOM-SHAWARMA-01', ${shawarmaId}, ${mainPlantId}, 'STANDARD', 'ACTIVE', 1, 'PC', false, false)
      ON CONFLICT (bom_number) DO NOTHING`);
    
    const bomRes = await db.execute(sql`SELECT id FROM mfg_bom_header WHERE bom_number = 'BOM-SHAWARMA-01'`);
    if (bomRes.rows.length > 0) {
      const bomId = (bomRes.rows[0] as any).id;
      await db.execute(sql`INSERT INTO mfg_bom_line (bom_header_id, line_number, component_material_id, quantity, uom, is_batch_tracked, is_phantom_explode)
        VALUES
          (${bomId}, 10, ${chickenId}, 0.15, 'KG', true, false),
          (${bomId}, 20, ${riceId}, 0.10, 'KG', true, false),
          (${bomId}, 30, ${spiceKitId}, 1, 'KIT', true, true)
        ON CONFLICT DO NOTHING`);
    }
  }

  // 17. Workflow Definitions
  await db.execute(sql`INSERT INTO wf_definition (code, name, document_type, is_active, description)
    VALUES
      ('PR_APPROVAL_STD', 'PR Standard Approval', 'PR', true, 'Manager approval, dual with owner if >500 KWD'),
      ('PO_APPROVAL_STD', 'PO Standard Approval', 'PO', true, 'Manager + Owner if >1000 KWD')
    ON CONFLICT (code) DO NOTHING`);

  const wfRes = await db.execute(sql`SELECT id, code FROM wf_definition`);
  const prWf = wfRes.rows.find((r: any) => r.code === 'PR_APPROVAL_STD');
  if (prWf) {
    await db.execute(sql`INSERT INTO wf_definition_step (definition_id, step_order, name, approver_type, min_amount, max_amount, requires_dual, is_owner_approval)
      VALUES
        (${prWf.id}, 1, 'Manager Approval', 'MANAGER', '0', '1000000', false, false),
        (${prWf.id}, 2, 'Owner Dual Approval >500 KWD', 'OWNER', '500', '1000000', true, true)
      ON CONFLICT DO NOTHING`);
  }

  // 18. HR Org Units, Positions, Employees with Cost Centers and 300 KWD salary (test seed requirement)
  await db.execute(sql`INSERT INTO hr_org_unit (code, name, plant_id, is_active)
    VALUES
      ('OU-KITCHEN', 'Kitchen Department', ${mainPlantId}, true),
      ('OU-SALES', 'Sales Department', ${mainPlantId}, true),
      ('OU-ADMIN', 'Administration', ${mainPlantId}, true)
    ON CONFLICT (code) DO NOTHING`);

  const ouRes = await db.execute(sql`SELECT id, code FROM hr_org_unit`);
  const kitchenOu = ouRes.rows.find((r: any) => r.code === 'OU-KITCHEN') as any;
  const salesOu = ouRes.rows.find((r: any) => r.code === 'OU-SALES') as any;
  const adminOu = ouRes.rows.find((r: any) => r.code === 'OU-ADMIN') as any;

  await db.execute(sql`INSERT INTO hr_position (code, name, org_unit_id, is_manager, is_owner, is_active)
    VALUES
      ('POS-CHEF', 'Head Chef', ${kitchenOu.id}, true, false, true),
      ('POS-COOK', 'Cook', ${kitchenOu.id}, false, false, true),
      ('POS-SALES-MGR', 'Sales Manager', ${salesOu.id}, true, false, true),
      ('POS-CASHIER', 'Cashier', ${salesOu.id}, false, false, true),
      ('POS-OWNER', 'Owner', ${adminOu.id}, true, true, true),
      ('POS-ADMIN', 'Admin Staff', ${adminOu.id}, false, false, true)
    ON CONFLICT (code) DO NOTHING`);

  const posRes = await db.execute(sql`SELECT id, code FROM hr_position`);
  const chefPos = posRes.rows.find((r: any) => r.code === 'POS-CHEF') as any;
  const cookPos = posRes.rows.find((r: any) => r.code === 'POS-COOK') as any;
  const salesMgrPos = posRes.rows.find((r: any) => r.code === 'POS-SALES-MGR') as any;
  const cashierPos = posRes.rows.find((r: any) => r.code === 'POS-CASHIER') as any;
  const ownerPos = posRes.rows.find((r: any) => r.code === 'POS-OWNER') as any;
  const adminPos = posRes.rows.find((r: any) => r.code === 'POS-ADMIN') as any;

  const ccRes2 = await db.execute(sql`SELECT id, code FROM fin_cost_center`);
  const kitchenCc = ccRes2.rows.find((r: any) => r.code === 'CC-KITCHEN-01') as any;
  const coldCc = ccRes2.rows.find((r: any) => r.code === 'CC-COLD-01') as any;
  const salesCc = ccRes2.rows.find((r: any) => r.code === 'CC-SALES-01') as any;
  const adminCc = ccRes2.rows.find((r: any) => r.code === 'CC-ADMIN-01') as any;

  // Create auth users first (for 1:1 employee-user) with password hashes
  // Skip employee/payroll seeding if no company (true scratch mode)
  if (!companyCodeId) {
    console.log('   Skipped employees/payroll – no company code (true scratch mode, SEED_DEFAULT_COMPANY=false)');
    console.log('✅ Layer 0 seed completed (minimal – standard CoA, UoM, currencies, tax codes only)');
    // Still seed KS01 if enabled
    try {
      if (process.env.KSPL_ENABLED !== 'false') {
        console.log('');
        console.log('🌶️  Seeding KS01 - Kerala Spices per PDF guide (KSPL_ENABLED != false)...');
        await seedKS01();
      }
    } catch (e) {
      console.warn('KS01 seed skipped/failed:', (e as any).message);
    }
    return;
  }

  // First user and password from env - ADMIN_EMAIL / ADMIN_PASSWORD or defaults
  const bcrypt = await import('bcryptjs');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@er.deepakpt.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'User@123456';
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const defaultHash = await bcrypt.hash(defaultPassword, 10);

  console.log(`🔐 Creating first admin user: ${adminEmail}`);

  // Ensure admin user exists with OWNER role
  await db.execute(sql`INSERT INTO auth_user (email, name, role, is_active, password_hash)
    VALUES (${adminEmail}, 'System Admin', 'OWNER', true, ${adminHash})
    ON CONFLICT (email) DO UPDATE SET password_hash = ${adminHash}, role = 'OWNER', is_active = true`);

  const userEmails = [
    'chef@erp.local', 'cook1@erp.local', 'cook2@erp.local', 'cook3@erp.local', 'cook4@erp.local',
    'salesmgr@erp.local', 'cashier1@erp.local', 'cashier2@erp.local', 'cashier3@erp.local',
    'owner@erp.local', 'admin1@erp.local', 'admin2@erp.local'
  ];

  // Add admin email to list if not already
  const allEmails = Array.from(new Set([adminEmail, ...userEmails]));

  for (const email of allEmails) {
    const isAdmin = email === adminEmail;
    const hash = isAdmin ? adminHash : defaultHash;
    const role = isAdmin ? 'OWNER' : (email === 'owner@erp.local' ? 'OWNER' : email.includes('admin') ? 'ADMIN' : 'USER');
    await db.execute(sql`INSERT INTO auth_user (email, name, role, is_active, password_hash)
      VALUES (${email}, ${email.split('@')[0]}, ${role}, true, ${hash})
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`);
  }

  const userRes = await db.execute(sql`SELECT id, email FROM auth_user WHERE email IN (${sql.join(allEmails.map(e => sql`${e}`), sql`, `)})`);
  const userMap = new Map((userRes.rows as any[]).map((r: any) => [r.email, r.id]));

  const employees = [
    { num: 'EMP-100', email: 'chef@erp.local', first: 'Ahmed', last: 'Ali', pos: chefPos.id, cc: kitchenCc.id, manager: null },
    { num: 'EMP-101', email: 'cook1@erp.local', first: 'Fatima', last: 'Noor', pos: cookPos.id, cc: kitchenCc.id, manager: 'EMP-100' },
    { num: 'EMP-102', email: 'cook2@erp.local', first: 'Mohammed', last: 'Khan', pos: cookPos.id, cc: kitchenCc.id, manager: 'EMP-100' },
    { num: 'EMP-103', email: 'cook3@erp.local', first: 'Sara', last: 'Ahmed', pos: cookPos.id, cc: kitchenCc.id, manager: 'EMP-100' },
    { num: 'EMP-104', email: 'cook4@erp.local', first: 'Omar', last: 'Hassan', pos: cookPos.id, cc: kitchenCc.id, manager: 'EMP-100' },
    { num: 'EMP-105', email: 'salesmgr@erp.local', first: 'Layla', last: 'Mahmoud', pos: salesMgrPos.id, cc: salesCc.id, manager: 'EMP-110' },
    { num: 'EMP-106', email: 'cashier1@erp.local', first: 'Youssef', last: 'Ibrahim', pos: cashierPos.id, cc: salesCc.id, manager: 'EMP-105' },
    { num: 'EMP-107', email: 'cashier2@erp.local', first: 'Noura', last: 'Salem', pos: cashierPos.id, cc: salesCc.id, manager: 'EMP-105' },
    { num: 'EMP-108', email: 'cashier3@erp.local', first: 'Khalid', last: 'Rashid', pos: cashierPos.id, cc: salesCc.id, manager: 'EMP-105' },
    { num: 'EMP-110', email: 'owner@erp.local', first: 'Aisha', last: 'Farah', pos: ownerPos.id, cc: adminCc.id, manager: null },
    { num: 'EMP-111', email: 'admin1@erp.local', first: 'Hassan', last: 'Tariq', pos: adminPos.id, cc: adminCc.id, manager: 'EMP-110' },
    { num: 'EMP-112', email: 'admin2@erp.local', first: 'Zainab', last: 'Yusuf', pos: adminPos.id, cc: adminCc.id, manager: 'EMP-110' },
  ];

  // First pass: create employees without manager – each employee different salary (not hardcoded 300)
  const salaryMap: Record<string, number> = {
    'EMP-100': 5000, // Purchaser
    'EMP-101': 3500,
    'EMP-102': 3000,
    'EMP-103': 2500,
    'EMP-104': 2500,
    'EMP-105': 4000, // Sales Mgr
    'EMP-106': 2000,
    'EMP-107': 2000,
    'EMP-108': 2000,
    'EMP-110': 10000, // Owner
    'EMP-111': 3500, // Admin
    'EMP-112': 3000,
  };
  for (const emp of employees) {
    const salary = salaryMap[emp.num] || 3000 + Math.floor(Math.random() * 2000); // varied
    await db.execute(sql`INSERT INTO hr_employee (employee_number, user_id, first_name, last_name, email, position_id, plant_id, company_code_id, cost_center_id, status, hire_date, basic_salary, currency, is_active)
      VALUES (${emp.num}, ${userMap.get(emp.email)}, ${emp.first}, ${emp.last}, ${emp.email}, ${emp.pos}, ${mainPlantId}, ${companyCodeId}, ${emp.cc}, 'ACTIVE', '2024-01-01', ${salary}, 'KWD', true)
      ON CONFLICT (employee_number) DO UPDATE SET basic_salary = ${salary}, cost_center_id = ${emp.cc}`);
  }

  // Second pass: set managers
  const empRes = await db.execute(sql`SELECT id, employee_number FROM hr_employee`);
  const empMap = new Map((empRes.rows as any[]).map((r: any) => [r.employee_number, r.id]));
  for (const emp of employees) {
    if (emp.manager) {
      const managerId = empMap.get(emp.manager);
      if (managerId) {
        await db.execute(sql`UPDATE hr_employee SET manager_id = ${managerId} WHERE employee_number = ${emp.num}`);
      }
    }
  }

  // 19. Payroll Run for 2026-09 with actual employee salaries (each different, not hardcoded 300)
  const payrollYear = '2026';
  const payrollMonth = '09';
  // Calculate total from actual salaries
  let totalGrossSeed = 0;
  for (const emp of employees) {
    totalGrossSeed += salaryMap[emp.num] || 3000;
  }
  await db.execute(sql`INSERT INTO hr_payroll_run (period_year, period_month, company_code_id, status, total_gross, total_deductions, total_net)
    VALUES (${payrollYear}, ${payrollMonth}, ${companyCodeId}, 'DRAFT', ${totalGrossSeed}, 0, ${totalGrossSeed})
    ON CONFLICT DO NOTHING`);

  const payrollRes = await db.execute(sql`SELECT id FROM hr_payroll_run WHERE period_year = ${payrollYear} AND period_month = ${payrollMonth} AND company_code_id = ${companyCodeId}`);
  if (payrollRes.rows.length > 0) {
    const payrollRunId = (payrollRes.rows[0] as any).id;
    // Create payroll lines with actual varied salaries
    for (const emp of employees) {
      const empId = empMap.get(emp.num);
      if (empId) {
        const sal = salaryMap[emp.num] || 3000;
        await db.execute(sql`INSERT INTO hr_payroll_line (payroll_run_id, employee_id, basic_salary, allowances, deductions, overtime, net_pay, cost_center_id, status)
          VALUES (${payrollRunId}, ${empId}, ${sal}, 0, 0, 0, ${sal}, ${emp.cc}, 'DRAFT')
          ON CONFLICT DO NOTHING`);
      }
    }
  }

  console.log('✅ Layer 0 + Phase 3 seed completed');
  console.log(`   Company Code: 1000 (${companyCodeId})`);
  try { console.log(`   Plants: Main ${mainPlantId}`); } catch {}
  try { console.log(`   Materials: ${matRes.rows.length} with expiry BLOCK/WARNING and kitting flags`); } catch { console.log('   Materials: skipped'); }
  console.log(`   BOMs: Stocked Kit (Spice) + Standard (Shawarma with phantom explode)`);
  console.log(`   Employees: 12 with varied salaries, cost centers Kitchen 5, Sales 4, Admin 3`);
  console.log(`   Payroll Run: 2026-09 DRAFT varied total – ready for approval → FI Dr Salary Expense (CC) Cr Payable`);

  // Also seed KS01 per PDF guide if enabled
  try {
    if (process.env.KSPL_ENABLED !== 'false') {
      console.log('');
      console.log('🌶️  Seeding KS01 - Kerala Spices per PDF guide (KSPL_ENABLED != false)...');
      await seedKS01();
    }
  } catch (e) {
    console.warn('KS01 seed skipped/failed in seedLayer0:', (e as any).message);
  }
}

export async function seedAll() {
  await seedLayer0();
  // seedLayer0 already calls seedKS01 if enabled, but call again for safety
  try {
    await seedKS01();
  } catch (e) {
    console.warn('seedKS01 second pass failed', e);
  }
}

if (require.main === module) {
  seedAll()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('❌ Seed failed:', e);
      process.exit(1);
    });
}
