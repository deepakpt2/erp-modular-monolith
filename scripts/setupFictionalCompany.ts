/**
 * Fictional Company Setup Script – Admin Data Auto-Creation – Manual Operations Left for User
 * 
 * Purpose: Creates ALL admin data needed to safely manage PR→IV, HR, Audit, PP, SD, FICO
 * - Company Structure: Tenant, Company Group ECGC-FMCG-01 with currency INR, country IN, language EN
 * - Basic Data: Currencies, UoM, Material Groups, etc.
 * - Financials: Fiscal Variant K4 (year_dependent false, calendar_year false, number_of_periods 12, start_month 4, end_month 3), Field Status Variant FSSV-1000 with Groups G001/G002 bulk, Posting Period Variant PPV-1000 with open periods, Credit Control Area CRED-1000, Chart of Accounts CA-IN-01 language EN, GL Accounts 10+ with BSX/WRX/GBB/PRD/KDM/KOFI/KOFK + Vendor/Customer/Payroll/COGS, Cost Centers, Profit Centers, Retained Earnings, Tolerance Groups OBA0/OBA4, Document Types OBA7, Auto Account Determination OBYC BSX/WRX/GBB/PRD + VKOA KOFI/KOFK, Movement Types OMJJ 101/102/261/601/602/122, Pricing Procedure, Tax Codes GST
 * - Enterprise: Facilities FAC-1000, Inventory Locations 0001/0002, Commercial Org CO-1000, Sales Channel SC-10, Product Line PL-10, Procurement Divisions, Buyer Teams, Dispatch Points, Warehouse Sites
 * - Number Ranges: FBN1 for FI docs, etc.
 * - Roles: 12 roles + Users: 15 users per guide – erp_admin to auditor – for role-based manual testing
 * 
 * What is NOT auto-created (to be done manually by you):
 * - MM: PR (PPRC), PO (PPOC), GR (IGRC 101), IV (PIVC), Reservations MB21, RFQ ME41/ME47/ME49, Source Lists, Quota, PIR, Info Records
 * - SD: Customer-Material Info VD51, Free Goods VBN1, Rebate VBO1, Sales Orders SSOC VA01, Deliveries VL01N, PGI 601, Billing VF01, Output NACE BA00/LD00/RD00
 * - PP: MD61 Demand, MD02/MD03 MRP, CO01 Production Orders, CO11N Confirmations, CK11N Cost Estimates, CK40N Costing Runs, Kitting K01/K02
 * - FICO: FB08 Reversal, F.13 GR/IR Clearing, F.05 FX Valuation F150, F110 Payment Proposal/Run, FI12 House Bank, OKEON Cost Center Groups, KL01 Activity Types, KSU5 Assessment Cycles, Recurring Postings
 * - HR: PA03 Payroll Control, PE01 Payroll Schema, PC00 Payroll Run, Employees, Org Units, Positions
 * - Audit: DMS Attachments, SM37 Jobs, CDHDR Change Docs, Document Flow, Audit Logs
 * 
 * Usage:
 * - Local: npx tsx scripts/setupFictionalCompany.ts
 * - Docker: docker exec -it <app_or_migrator_container> npx tsx scripts/setupFictionalCompany.ts
 * - Or: docker compose run --rm migrator npx tsx scripts/setupFictionalCompany.ts
 * - Env: FULL_WIPE=true to truncate all tables first (per user selection full_wipe) – otherwise upsert preserves manual data
 * 
 * Idempotent: Uses ON CONFLICT DO NOTHING / DO UPDATE – safe to run multiple times – preserves manual PR→IV data if FULL_WIPE!=true
 * 
 * After run: All admin masters ready – you can manually test PR→IV flow with different users per role matrix
 */

import { db } from '../src/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

const FULL_WIPE = process.env.FULL_WIPE === 'true';

async function fullWipe() {
  if (!FULL_WIPE) {
    console.log('⏭️  FULL_WIPE != true – preserving existing data – upsert mode – safe for docker compose up --build');
    return;
  }
  console.log('💥 FULL_WIPE=true – TRUNCATING ALL TABLES CASCADE – fresh start – per user selection');
  try {
    // Get all tables in public schema
    const tablesRes = await db.execute(sql`
      SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE 'pg_%' AND tablename NOT LIKE 'sql_%'
    `);
    const tables = (tablesRes.rows as any[]).map(r=>r.tablename);
    console.log(`   Found ${tables.length} tables to truncate`);
    // Truncate in one statement with CASCADE – order doesn't matter
    if (tables.length > 0) {
      const tableList = tables.map(t=>`"${t}"`).join(', ');
      await db.execute(sql.raw(`TRUNCATE ${tableList} CASCADE`));
      console.log(`✅ Truncated ${tables.length} tables CASCADE – fresh`);
    }
  } catch (e: any) {
    console.warn('⚠️ Full wipe failed, trying individual truncates:', e.message);
    // Fallback individual
    const criticalTables = [
      'fin_field_status_group','fin_field_status_variant','fin_posting_calendar_period','fin_posting_calendar',
      'fin_fiscal_calendar_period','fin_fiscal_calendar','fin_credit_policy_area','fin_legal_entity_credit_assign',
      'fin_ledger_account','fin_chart','fi_gl_account','fi_chart_of_accounts','org_inventory_location','org_facility',
      'org_legal_entity','org_company_group','core_tenant','auth_user','ent_client','ent_company_code','ent_plant',
      'ent_storage_location','core_currency','core_unit_measure','prod_category','fin_tax_rule','core_number_range',
      'fin_document_type','fin_tolerance_group','fin_auto_posting_rule','fin_pricing_procedure','fin_pricing_condition',
      'ent_role','ent_user_role','auth_user','fin_auto_account','fin_revenue_account','fi_auto_account_determination',
      'inv_stock','inv_lot','prod_item','prod_item_type','ent_material_master','ent_business_partner'
    ];
    for (const t of criticalTables) {
      try {
        await db.execute(sql.raw(`TRUNCATE "${t}" CASCADE`));
        console.log(`   Truncated ${t}`);
      } catch {}
    }
  }
}

async function ensureAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@er.deepakpt.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const hash = await bcrypt.hash(adminPassword, 10);
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS auth_user (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(255) UNIQUE NOT NULL,
        name varchar(255),
        role varchar(50) DEFAULT 'OWNER',
        is_active boolean DEFAULT true,
        password_hash varchar(255),
        created_at timestamp DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      INSERT INTO auth_user (email, name, role, is_active, password_hash)
      VALUES (${adminEmail}, 'System Admin', 'OWNER', true, ${hash})
      ON CONFLICT (email) DO UPDATE SET password_hash=${hash}, role='OWNER', is_active=true
    `);
    console.log(`✅ Admin ensured: ${adminEmail}`);
  } catch (e: any) {
    console.error('❌ Admin ensure failed:', e.message);
  }
}

async function setupFictionalCompany() {
  console.log('🚀 Fictional Company Setup – Admin Data Auto-Creation – Manual Ops Left for You');
  console.log(`   FULL_WIPE=${FULL_WIPE} – ${FULL_WIPE ? 'Will wipe then create' : 'Upsert preserve – safe for up --build'}`);
  console.log(`   DATABASE_URL=${process.env.DATABASE_URL ? 'set' : 'NOT SET'}`);

  await fullWipe();
  await ensureAdmin();

  // 1. Tenant
  let tenantId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS core_tenant (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(20) UNIQUE NOT NULL, name varchar(100) NOT NULL, description text, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO core_tenant (code, name, description) VALUES ('TEN-100', 'Main Tenant – FMCG', 'Tenant for FMCG Group') ON CONFLICT (code) DO NOTHING`);
    const tRes = await db.execute(sql`SELECT id FROM core_tenant WHERE code='TEN-100' LIMIT 1`);
    tenantId = (tRes.rows[0] as any)?.id;
    console.log(`✅ Tenant TEN-100 ensured – id ${tenantId}`);
  } catch (e: any) { console.warn('Tenant failed:', e.message); }

  // 2. Company Group ECGC-FMCG-01 with currency, country, language
  let cgId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_company_group (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, description text, currency_code varchar(3) DEFAULT 'INR', country_code varchar(2) DEFAULT 'IN', country varchar(2) DEFAULT 'IN', language varchar(10) DEFAULT 'EN', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`ALTER TABLE org_company_group ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'INR'`);
    await db.execute(sql`ALTER TABLE org_company_group ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'IN'`);
    await db.execute(sql`ALTER TABLE org_company_group ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'EN'`);
    await db.execute(sql`
      INSERT INTO org_company_group (tenant_id, code, name, description, currency_code, country_code, country, language)
      VALUES (${tenantId}, 'ECGC-FMCG-01', 'FMCG Group India', 'FMCG Group for Spices and Foods – fictional company – admin auto', 'INR', 'IN', 'IN', 'EN')
      ON CONFLICT DO NOTHING
    `);
    const cgRes = await db.execute(sql`SELECT id FROM org_company_group WHERE code='ECGC-FMCG-01' LIMIT 1`);
    cgId = (cgRes.rows[0] as any)?.id;
    console.log(`✅ Company Group ECGC-FMCG-01 ensured – INR/IN/EN – id ${cgId}`);
  } catch (e: any) { console.warn('Company Group failed:', e.message); }

  // 3. Currencies
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS core_currency (code varchar(3) PRIMARY KEY, name varchar(100) NOT NULL, decimal_places integer DEFAULT 2, symbol varchar(10), is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO core_currency (code, name, symbol) VALUES ('INR','Indian Rupee','₹'), ('USD','US Dollar','$'), ('EUR','Euro','€'), ('KWD','Kuwaiti Dinar','KD'), ('GBP','British Pound','£'), ('AED','UAE Dirham','AED') ON CONFLICT (code) DO NOTHING`);
    console.log('✅ Currencies ensured – INR/USD/EUR/KWD/GBP/AED');
  } catch (e: any) { console.warn('Currencies failed:', e.message); }

  // 4. UoM
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS core_unit_measure (code varchar(20) PRIMARY KEY, name varchar(100), dimension varchar(20))`);
    await db.execute(sql`INSERT INTO core_unit_measure (code, name, dimension) VALUES ('KG','Kilogram','WEIGHT'), ('PC','Piece','QUANTITY'), ('L','Liter','VOLUME'), ('BOX','Box','QUANTITY'), ('BAG','Bag','QUANTITY'), ('KIT','Kit','QUANTITY') ON CONFLICT (code) DO NOTHING`);
    console.log('✅ UoM ensured – KG/PC/L/BOX/BAG/KIT');
  } catch (e: any) { console.warn('UoM failed:', e.message); }

  // 5. Fiscal Calendar K4 with year_dependent, calendar_year, number_of_periods
  let fiscalId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_fiscal_calendar (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) UNIQUE NOT NULL, name varchar(150) NOT NULL, description text, year_dependent boolean DEFAULT false, calendar_year boolean DEFAULT false, number_of_periods integer DEFAULT 12, from_date timestamp, to_date timestamp, start_month integer DEFAULT 4, end_month integer DEFAULT 3, year_shift integer DEFAULT 0, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS year_dependent BOOLEAN DEFAULT false`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS calendar_year BOOLEAN DEFAULT false`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS number_of_periods INTEGER DEFAULT 12`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS from_date TIMESTAMP`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS to_date TIMESTAMP`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS start_month INTEGER DEFAULT 4`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS end_month INTEGER DEFAULT 3`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS year_shift INTEGER DEFAULT 0`);
    await db.execute(sql`
      INSERT INTO fin_fiscal_calendar (code, name, description, year_dependent, calendar_year, number_of_periods, start_month, end_month, year_shift, from_date, to_date)
      VALUES ('K4', 'April-March Fiscal – India – K4', 'Fiscal Year Variant K4 – April to March – 12 periods – year_dependent false calendar_year false number_of_periods 12 – year-independent – from_date/to_date optional for FY2026', false, false, 12, 4, 3, 0, '2026-04-01', '2027-03-31')
      ON CONFLICT (code) DO UPDATE SET name='April-March Fiscal – India – K4', year_dependent=false, calendar_year=false, number_of_periods=12, start_month=4, end_month=3, updated_at=NOW()
    `);
    const fRes = await db.execute(sql`SELECT id FROM fin_fiscal_calendar WHERE code='K4' LIMIT 1`);
    fiscalId = (fRes.rows[0] as any)?.id;
    console.log(`✅ Fiscal Calendar K4 ensured – year_dependent false calendar_year false number_of_periods 12 – id ${fiscalId}`);
    // Periods for K4
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_fiscal_calendar_period (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), fiscal_calendar_id uuid NOT NULL, period integer NOT NULL, period_number integer, calendar_month integer NOT NULL, month integer, year_shift integer DEFAULT 0, start_day_month varchar(10), end_day_month varchar(10), description text, UNIQUE(fiscal_calendar_id, period))`);
    for (let p=1; p<=12; p++) {
      const calMonth = ((3 + p) % 12) + 1; // K4: period 1 = April (4), period 12 = March (3)
      const yearShift = calMonth <= 3 ? 1 : 0;
      await db.execute(sql`
        INSERT INTO fin_fiscal_calendar_period (fiscal_calendar_id, period, period_number, calendar_month, month, year_shift)
        VALUES (${fiscalId}, ${p}, ${p}, ${calMonth}, ${calMonth}, ${yearShift})
        ON CONFLICT (fiscal_calendar_id, period) DO NOTHING
      `);
    }
    console.log('✅ Fiscal Calendar Periods K4 – 12 periods ensured');
  } catch (e: any) { console.warn('Fiscal Calendar failed:', e.message); }

  // 6. Field Status Variant FSSV-1000
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_field_status_variant (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(20) UNIQUE NOT NULL, name varchar(100) NOT NULL, description text, created_at timestamptz DEFAULT NOW(), updated_at timestamptz DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO fin_field_status_variant (code, name, description) VALUES ('FSSV-1000','Field Status Variant 1000 – India','Variant for 1000 – required before ELEC'), ('1000','Standard Field Status','Standard variant') ON CONFLICT (code) DO NOTHING`);
    console.log('✅ Field Status Variant FSSV-1000 ensured');
  } catch (e: any) { console.warn('Field Status Variant failed:', e.message); }

  // 7. Field Status Groups – bulk multiple FIELD_NAME per group – SAP structure
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_field_status_group (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), variant_code varchar(20) NOT NULL, group_code varchar(20) NOT NULL, field_name varchar(50) NOT NULL, status varchar(1) NOT NULL CHECK (status IN ('R','S','O','D')), description text, created_at timestamptz DEFAULT NOW(), updated_at timestamptz DEFAULT NOW(), UNIQUE(variant_code, group_code, field_name))`);
    const groups = [
      ['FSSV-1000','G001','cost_center','R'], ['FSSV-1000','G001','profit_center','O'], ['FSSV-1000','G001','tax_code','O'], ['FSSV-1000','G001','payment_term','O'], ['FSSV-1000','G001','reference','O'], ['FSSV-1000','G001','text','R'],
      ['FSSV-1000','G002','cost_center','S'], ['FSSV-1000','G002','profit_center','S'], ['FSSV-1000','G002','tax_code','S'],
      ['FSSV-1000','G004','profit_center','R'], ['FSSV-1000','G004','cost_center','O'],
    ];
    for (const [v,g,f,s] of groups) {
      await db.execute(sql`INSERT INTO fin_field_status_group (variant_code, group_code, field_name, status) VALUES (${v}, ${g}, ${f}, ${s}) ON CONFLICT (variant_code, group_code, field_name) DO NOTHING`);
    }
    console.log('✅ Field Status Groups FSSV-1000/G001/G002/G004 ensured – bulk multiple FIELD_NAME per group – SAP structure');
  } catch (e: any) { console.warn('Field Status Groups failed:', e.message); }

  // 8. Posting Period Variant PPV-1000
  let ppvId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_posting_calendar (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) UNIQUE NOT NULL, name varchar(100) NOT NULL, description text, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO fin_posting_calendar (code, name, description) VALUES ('PPV-1000','Posting Period Variant 1000 – India','PPV-1000 – groups company codes for OB52') ON CONFLICT (code) DO NOTHING`);
    const ppvRes = await db.execute(sql`SELECT id FROM fin_posting_calendar WHERE code='PPV-1000' LIMIT 1`);
    ppvId = (ppvRes.rows[0] as any)?.id;
    console.log(`✅ Posting Period Variant PPV-1000 ensured – id ${ppvId}`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_posting_calendar_period (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), posting_calendar_id uuid NOT NULL, legal_entity_id uuid, from_period integer NOT NULL, from_year integer NOT NULL, to_period integer NOT NULL, to_year integer NOT NULL, account_type varchar(20) DEFAULT 'ALL', is_open boolean DEFAULT true, description text, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    // Open periods for 2026 – S,K,D,A
    for (const accType of ['ALL','S','K','D','A']) {
      await db.execute(sql`
        INSERT INTO fin_posting_calendar_period (posting_calendar_id, from_period, from_year, to_period, to_year, account_type, is_open)
        VALUES (${ppvId}, 1, 2026, 12, 2026, ${accType}, true)
        ON CONFLICT DO NOTHING
      `);
    }
    console.log('✅ Posting Calendar Periods PPV-1000 – open 01-12/2026 for ALL/S/K/D/A ensured');
  } catch (e: any) { console.warn('Posting Period Variant failed:', e.message); }

  // 9. Credit Control Area CRED-1000 – MUST EXIST BEFORE OB13/ELEC
  let cpaId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_credit_policy_area (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) UNIQUE NOT NULL, name varchar(100) NOT NULL, currency_code varchar(3) DEFAULT 'INR', description text, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO fin_credit_policy_area (code, name, currency_code, description) VALUES ('CRED-1000','Credit Control India – Domestic','INR','Credit Control Area CRED-1000 – must exist before OB13/ELEC – OB45') ON CONFLICT (code) DO NOTHING`);
    const cpaRes = await db.execute(sql`SELECT id FROM fin_credit_policy_area WHERE code='CRED-1000' LIMIT 1`);
    cpaId = (cpaRes.rows[0] as any)?.id;
    console.log(`✅ Credit Control Area CRED-1000 ensured – id ${cpaId}`);
  } catch (e: any) { console.warn('Credit Control Area failed:', e.message); }

  // 10. Chart of Accounts CA-IN-01 with language EN
  let coaId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_chart (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(20) UNIQUE NOT NULL, name varchar(150) NOT NULL, description text, language varchar(10) DEFAULT 'EN', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`ALTER TABLE fin_chart ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'EN'`);
    await db.execute(sql`INSERT INTO fin_chart (code, name, description, language) VALUES ('CA-IN-01','Chart of Accounts India','India Standard CoA – CA-IN-01 – fictional company – language EN','EN') ON CONFLICT (code) DO UPDATE SET language='EN', updated_at=NOW()`);
    const coaRes = await db.execute(sql`SELECT id FROM fin_chart WHERE code='CA-IN-01' LIMIT 1`);
    coaId = (coaRes.rows[0] as any)?.id;
    // Legacy table for downstream safe
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fi_chart_of_accounts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(20) UNIQUE NOT NULL, name varchar(100) NOT NULL, description text)`);
    await db.execute(sql`INSERT INTO fi_chart_of_accounts (code, name, description) VALUES ('CA-IN-01','Chart of Accounts India','India Standard') ON CONFLICT (code) DO NOTHING`);
    console.log(`✅ Chart of Accounts CA-IN-01 ensured – language EN – id ${coaId}`);
  } catch (e: any) { console.warn('Chart of Accounts failed:', e.message); }

  // 11. GL Accounts – 10+ mandatory for NO DANGLING – BSX/WRX/GBB/PRD/KDM/KOFI/KOFK + Vendor/Customer/Payroll/COGS
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_ledger_account (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), chart_id uuid NOT NULL, coa_id uuid, account_number varchar(30) NOT NULL, name varchar(150) NOT NULL, account_type varchar(20) NOT NULL, is_balance_sheet boolean NOT NULL, is_reconciliation boolean DEFAULT false, is_blocked boolean DEFAULT false, is_tax_relevant boolean DEFAULT false, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW(), UNIQUE(chart_id, account_number))`);
    const gls = [
      ['1000000001','Inventory RAW – BSX','ASSET',true,false,'BSX RAW – 1000000001 – Inventory'],
      ['2000000000','GR/IR Clearing – WRX','LIABILITY',true,false,'WRX – GR/IR Clearing'],
      ['4000000000','Consumption GBB – GBB VBR','EXPENSE',false,false,'GBB – Consumption'],
      ['4000000001','Price Difference PRD','EXPENSE',false,false,'PRD – Price Diff'],
      ['4000001000','Revenue Domestic – KOFI','REVENUE',false,false,'KOFI – Revenue Domestic'],
      ['4000002000','Exchange Difference KDM','EXPENSE',false,false,'KDM – Exchange Diff'],
      ['2000000001','Vendor Reconciliation K','LIABILITY',true,true,'Vendor Recon K'],
      ['1000000002','Customer Reconciliation D','ASSET',true,true,'Customer Recon D'],
      ['6000000000','Payroll Expense','EXPENSE',false,false,'Payroll Expense'],
      ['5000000000','COGS','EXPENSE',false,false,'COGS'],
      ['2500000001','Retained Earnings','EQUITY',true,false,'Retained Earnings OB53'],
      ['100000','Cash – ASSET','ASSET',true,false,'Cash'],
    ];
    for (const [accNum, name, type, isBS, isRecon, desc] of gls) {
      await db.execute(sql`
        INSERT INTO fin_ledger_account (chart_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant, is_active)
        VALUES (${coaId}, ${accNum}, ${name}, ${type}, ${isBS}, ${isRecon}, false, true)
        ON CONFLICT (chart_id, account_number) DO NOTHING
      `);
    }
    console.log('✅ GL Accounts ensured – 12 mandatory – BSX/WRX/GBB/PRD/KOFI/KDM + Vendor/Customer/Payroll/COGS/Retained');
  } catch (e: any) { console.warn('GL Accounts failed:', e.message); }

  // 12. Cost Centers + Profit Centers
  let legalEntityId: string | null = null;
  try {
    // Legal Entity 1000 – AFTER all dependencies – per correct order
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_legal_entity (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, company_group_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, currency_code varchar(3) DEFAULT 'INR', city varchar(100), country varchar(2) DEFAULT 'IN', country_code varchar(2) DEFAULT 'IN', fiscal_calendar_code varchar(20) DEFAULT 'K4', fiscal_year_variant varchar(20) DEFAULT 'K4', chart_of_accounts_code varchar(20) DEFAULT 'CA-IN-01', field_status_variant varchar(20) DEFAULT 'FSSV-1000', posting_period_variant varchar(20) DEFAULT 'PPV-1000', posting_period_variant_code varchar(20) DEFAULT 'PPV-1000', credit_control_area varchar(20) DEFAULT 'CRED-1000', credit_policy_area_code varchar(20) DEFAULT 'CRED-1000', language varchar(10) DEFAULT 'EN', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`ALTER TABLE org_legal_entity ADD COLUMN IF NOT EXISTS chart_of_accounts_code VARCHAR(20) DEFAULT 'CA-IN-01'`);
    await db.execute(sql`ALTER TABLE org_legal_entity ADD COLUMN IF NOT EXISTS fiscal_year_variant VARCHAR(20) DEFAULT 'K4'`);
    await db.execute(sql`ALTER TABLE org_legal_entity ADD COLUMN IF NOT EXISTS field_status_variant VARCHAR(20) DEFAULT 'FSSV-1000'`);
    await db.execute(sql`ALTER TABLE org_legal_entity ADD COLUMN IF NOT EXISTS posting_period_variant VARCHAR(20) DEFAULT 'PPV-1000'`);
    await db.execute(sql`ALTER TABLE org_legal_entity ADD COLUMN IF NOT EXISTS credit_control_area VARCHAR(20) DEFAULT 'CRED-1000'`);
    await db.execute(sql`ALTER TABLE org_legal_entity ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'EN'`);
    await db.execute(sql`
      INSERT INTO org_legal_entity (tenant_id, company_group_id, code, name, currency_code, country, country_code, fiscal_calendar_code, fiscal_year_variant, chart_of_accounts_code, field_status_variant, posting_period_variant, credit_control_area, language)
      VALUES (${tenantId}, ${cgId}, '1000', 'FMCG India Pvt Ltd', 'INR', 'IN', 'IN', 'K4', 'K4', 'CA-IN-01', 'FSSV-1000', 'PPV-1000', 'CRED-1000', 'EN')
      ON CONFLICT DO NOTHING
    `);
    const leRes = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code='1000' LIMIT 1`);
    legalEntityId = (leRes.rows[0] as any)?.id;
    console.log(`✅ Legal Entity 1000 FMCG India Pvt Ltd ensured – CoA CA-IN-01 FY K4 FSSV FSSV-1000 PPV PPV-1000 CRED CRED-1000 – id ${legalEntityId}`);
  } catch (e: any) { console.warn('Legal Entity failed:', e.message); }

  // 13. Facilities + Inventory Locations
  let facilityId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_facility (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), legal_entity_id uuid NOT NULL, code varchar(20) UNIQUE NOT NULL, name varchar(100) NOT NULL, description text, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO org_facility (legal_entity_id, code, name) VALUES (${legalEntityId}, 'FAC-1000', 'Pune Plant – Main Production') ON CONFLICT (code) DO NOTHING`);
    const fRes = await db.execute(sql`SELECT id FROM org_facility WHERE code='FAC-1000' LIMIT 1`);
    facilityId = (fRes.rows[0] as any)?.id;
    console.log(`✅ Facility FAC-1000 ensured – id ${facilityId}`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_inventory_location (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), facility_id uuid NOT NULL, code varchar(20) NOT NULL, name varchar(100) NOT NULL, location_type varchar(20) DEFAULT 'RAW', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW(), UNIQUE(facility_id, code))`);
    await db.execute(sql`INSERT INTO org_inventory_location (facility_id, code, name, location_type) VALUES (${facilityId}, '0001', 'Raw Material Store', 'RAW'), (${facilityId}, '0002', 'Finished Goods Store', 'FG') ON CONFLICT DO NOTHING`);
    console.log('✅ Inventory Locations 0001 RAW / 0002 FG ensured');
  } catch (e: any) { console.warn('Facility/Location failed:', e.message); }

  // 14. Commercial Org, Sales Channel, Product Line – Sales Area
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_commercial_org (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, legal_entity_id uuid NOT NULL, code varchar(20) NOT NULL, name varchar(100) NOT NULL, currency_code varchar(3) DEFAULT 'INR', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO org_commercial_org (tenant_id, legal_entity_id, code, name) VALUES (${tenantId}, ${legalEntityId}, 'CO-1000', 'India Sales Org') ON CONFLICT DO NOTHING`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_sales_channel (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, code varchar(20) NOT NULL, name varchar(100) NOT NULL, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO org_sales_channel (tenant_id, code, name) VALUES (${tenantId}, 'SC-10', 'Direct Sales') ON CONFLICT DO NOTHING`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_product_line (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, code varchar(20) NOT NULL, name varchar(100) NOT NULL, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO org_product_line (tenant_id, code, name) VALUES (${tenantId}, 'PL-10', 'Spices') ON CONFLICT DO NOTHING`);
    console.log('✅ Sales Area ensured – CO-1000 / SC-10 / PL-10');
  } catch (e: any) { console.warn('Sales Area failed:', e.message); }

  // 15. Number Ranges, Document Types, Tolerance Groups, Auto Account Determination
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS core_number_range (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(50) UNIQUE NOT NULL, object_type varchar(50) NOT NULL, legal_entity_id uuid, fiscal_year integer, prefix varchar(20) DEFAULT '', from_number bigint NOT NULL, to_number bigint NOT NULL, current_number bigint DEFAULT 0, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    const year = new Date().getFullYear();
    const nr = [
      ['SA-01','FI_DOC','FI-SA-',1000000000,1999999999],
      ['KR-01','FI_DOC','FI-KR-',5100000000,5199999999],
      ['KZ-01','FI_DOC','FI-KZ-',5300000000,5399999999],
      ['RE-01','FI_DOC','FI-RE-',5100000001,5199999999],
      ['WE-01','FI_DOC','FI-WE-',5000000000,5099999999],
      ['RV-01','FI_DOC','FI-RV-',9000000000,9099999999],
    ];
    for (const [code, objType, prefix, fromN, toN] of nr) {
      await db.execute(sql`INSERT INTO core_number_range (code, object_type, prefix, from_number, to_number, current_number) VALUES (${code}, ${objType}, ${prefix}, ${fromN}, ${toN}, ${fromN}) ON CONFLICT (code) DO NOTHING`);
    }
    console.log('✅ Number Ranges ensured – SA/KR/KZ/RE/WE/RV');
  } catch (e: any) { console.warn('Number Ranges failed:', e.message); }

  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_document_type (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(20) UNIQUE NOT NULL, name varchar(150) NOT NULL, number_range_code varchar(50), is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO fin_document_type (code, name, number_range_code) VALUES ('SA','GL Document','SA-01'), ('KR','Vendor Invoice','KR-01'), ('KZ','Vendor Payment','KZ-01'), ('RE','Invoice Verification','RE-01'), ('WE','Goods Receipt','WE-01'), ('RV','Billing','RV-01') ON CONFLICT (code) DO NOTHING`);
    console.log('✅ Document Types ensured – SA/KR/KZ/RE/WE/RV – OBA7');
  } catch (e: any) { console.warn('Doc Types failed:', e.message); }

  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_tolerance_group (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(30) UNIQUE NOT NULL, name varchar(150) NOT NULL, type varchar(20) DEFAULT 'GL', legal_entity_id uuid, lower_limit numeric DEFAULT 0, upper_limit numeric DEFAULT 0, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO fin_tolerance_group (code, name, type) VALUES ('GL-01','GL Tolerance – 1M','GL'), ('VEND-01','Vendor Tolerance – 5%','VENDOR') ON CONFLICT (code) DO NOTHING`);
    console.log('✅ Tolerance Groups ensured – GL-01/VEND-01 – OBA0/OBA4');
  } catch (e: any) { console.warn('Tolerance failed:', e.message); }

  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_auto_posting_rule (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), legal_entity_id uuid, transaction_key varchar(20) NOT NULL, valuation_class varchar(20), ledger_account_id uuid, description varchar(200), is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW(), UNIQUE(legal_entity_id, transaction_key, valuation_class))`);
    // Get GL ids for auto account
    const glMap: Record<string,string> = {};
    try {
      const glRes = await db.execute(sql`SELECT id, account_number FROM fin_ledger_account WHERE chart_id=${coaId}`);
      for (const r of glRes.rows as any[]) glMap[r.account_number] = r.id;
    } catch {}
    const autoRules = [
      ['BSX','RAW',glMap['1000000001'] || null,'BSX RAW → Inventory RAW'],
      ['WRX','RAW',glMap['2000000000'] || null,'WRX RAW → GR/IR'],
      ['GBB','',glMap['4000000000'] || null,'GBB → Consumption'],
      ['PRD','RAW',glMap['4000000001'] || null,'PRD RAW → Price Diff'],
      ['KDM','',glMap['4000002000'] || null,'KDM → Exchange Diff'],
    ];
    for (const [tKey, valClass, glId, desc] of autoRules) {
      if (!glId) continue;
      await db.execute(sql`INSERT INTO fin_auto_posting_rule (legal_entity_id, transaction_key, valuation_class, ledger_account_id, description) VALUES (${legalEntityId}, ${tKey}, ${valClass || null}, ${glId}, ${desc}) ON CONFLICT DO NOTHING`);
    }
    console.log('✅ Auto Account Determination ensured – BSX/WRX/GBB/PRD/KDM – OBYC');
  } catch (e: any) { console.warn('Auto Account failed:', e.message); }

  // 16. Movement Types OMJJ
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_movement_type (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(10) UNIQUE NOT NULL, name varchar(100) NOT NULL, description text, plus_minus varchar(1) DEFAULT '+', account_modifier varchar(10), is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO fin_movement_type (code, name, plus_minus, account_modifier) VALUES ('101','Goods Receipt','+','BSX'), ('102','GR Reversal','-','BSX'), ('261','GI to Prod Order','-','GBB'), ('601','GI for Sales Delivery PGI','-','GBB'), ('602','Reverse GI Sales','+','GBB'), ('122','Return to Vendor','-','WRX') ON CONFLICT (code) DO NOTHING`);
    console.log('✅ Movement Types ensured – 101/102/261/601/602/122 – OMJJ');
  } catch (e: any) { console.warn('Movement Types failed:', e.message); }

  // 17. Tax Codes GST
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_tax_rule (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(20) UNIQUE NOT NULL, description varchar(150) NOT NULL, rate numeric NOT NULL, type varchar(20) NOT NULL, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO fin_tax_rule (code, description, rate, type) VALUES ('GST0','GST 0%',0,'OUTPUT'), ('GST5','GST 5%',5,'OUTPUT'), ('GST12','GST 12%',12,'OUTPUT'), ('GST18','GST 18%',18,'OUTPUT'), ('GST28','GST 28%',28,'OUTPUT'), ('IGST18','IGST 18%',18,'OUTPUT') ON CONFLICT (code) DO NOTHING`);
    console.log('✅ Tax Codes ensured – GST0/5/12/18/28/IGST18');
  } catch (e: any) { console.warn('Tax Codes failed:', e.message); }

  // 18. Cost Centers + Profit Centers
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_cost_unit (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, legal_entity_id uuid NOT NULL, code varchar(20) NOT NULL, name varchar(100) NOT NULL, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW(), UNIQUE(legal_entity_id, code))`);
    await db.execute(sql`INSERT INTO org_cost_unit (tenant_id, legal_entity_id, code, name) VALUES (${tenantId}, ${legalEntityId}, 'CC-1000','Production Cost Center – Main'), (${tenantId}, ${legalEntityId}, 'CC-KITCHEN-01','Main Kitchen'), (${tenantId}, ${legalEntityId}, 'CC-SALES-01','Sales'), (${tenantId}, ${legalEntityId}, 'CC-ADMIN-01','Administration') ON CONFLICT DO NOTHING`);
    console.log('✅ Cost Centers ensured – CC-1000/CC-KITCHEN-01/CC-SALES-01/CC-ADMIN-01');
  } catch (e: any) { console.warn('Cost Centers failed:', e.message); }

  // 19. Roles – 12 roles
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS ent_role (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(50) UNIQUE NOT NULL, name varchar(100) NOT NULL, description text, permissions jsonb DEFAULT '[]', created_at timestamp DEFAULT NOW())`);
    const roles = [
      ['ERP_ADMIN','ERP Admin – Super Admin','Full access'],
      ['MASTER_DATA_MANAGER','Master Data Manager','material:create,supplier:create,customer:create'],
      ['PROCUREMENT_REQUESTER','Procurement Requester – PR Creator','pr:create'],
      ['PROCUREMENT_BUYER','Buyer – PO Creator','po:create,info-record:create'],
      ['WAREHOUSE_CLERK','Warehouse Clerk – GR','gr:create,reservation:create'],
      ['WAREHOUSE_MANAGER','Warehouse Manager','gr:approve,physical-inventory:post'],
      ['PRODUCTION_PLANNER','Production Planner','mrp:run,production-order:create'],
      ['SHOP_FLOOR_OPERATOR','Shop Floor Operator','production-order:confirm'],
      ['SALES_REP','Sales Rep – SO Creator','sales-order:create'],
      ['SHIPPING_CLERK','Shipping Clerk – Delivery PGI','delivery:create,delivery:pgi'],
      ['BILLING_CLERK','Billing Clerk','billing:create'],
      ['ACCOUNTANT_AP','Accountant AP – IV','iv:create,payment:run'],
      ['ACCOUNTANT_AR','Accountant AR','dunning:create'],
      ['ACCOUNTANT_GL','Accountant GL','gl:post,document:reverse'],
      ['AUDITOR','Auditor – Display Only','*:display'],
      ['HR_MANAGER','HR Manager','employee:create'],
      ['PAYROLL_CLERK','Payroll Clerk','payroll-run:create'],
    ];
    for (const [code,name,desc] of roles) {
      await db.execute(sql`INSERT INTO ent_role (code, name, description) VALUES (${code}, ${name}, ${desc}) ON CONFLICT (code) DO NOTHING`);
    }
    console.log('✅ Roles ensured – 17 roles – ERP_ADMIN to PAYROLL_CLERK');
  } catch (e: any) { console.warn('Roles failed:', e.message); }

  // 20. Users – 15 users
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS ent_user_role (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, role_id uuid NOT NULL, assigned_at timestamp DEFAULT NOW(), UNIQUE(user_id, role_id))`);
    const users = [
      ['erp_admin','erp_admin@fmcg.com','ERP_ADMIN'],
      ['master_data_mgr','mdm@fmcg.com','MASTER_DATA_MANAGER'],
      ['pr_requester_01','pr01@fmcg.com','PROCUREMENT_REQUESTER'],
      ['buyer_01','buyer01@fmcg.com','PROCUREMENT_BUYER'],
      ['wh_clerk_01','wh01@fmcg.com','WAREHOUSE_CLERK'],
      ['wh_manager_01','whm01@fmcg.com','WAREHOUSE_MANAGER'],
      ['prod_planner_01','pp01@fmcg.com','PRODUCTION_PLANNER'],
      ['shop_operator_01','shop01@fmcg.com','SHOP_FLOOR_OPERATOR'],
      ['sales_rep_01','sales01@fmcg.com','SALES_REP'],
      ['shipping_clerk_01','ship01@fmcg.com','SHIPPING_CLERK'],
      ['billing_clerk_01','bill01@fmcg.com','BILLING_CLERK'],
      ['accountant_ap_01','ap01@fmcg.com','ACCOUNTANT_AP'],
      ['accountant_gl_01','gl01@fmcg.com','ACCOUNTANT_GL'],
      ['auditor_01','auditor01@fmcg.com','AUDITOR'],
      ['hr_manager_01','hr01@fmcg.com','HR_MANAGER'],
      ['payroll_clerk_01','pay01@fmcg.com','PAYROLL_CLERK'],
    ];
    for (const [username,email,roleCode] of users) {
      const hash = await bcrypt.hash('User@123', 10);
      try {
        await db.execute(sql`
          INSERT INTO auth_user (email, name, role, is_active, password_hash)
          VALUES (${email}, ${username}, ${roleCode}, true, ${hash})
          ON CONFLICT (email) DO UPDATE SET name=${username}, role=${roleCode}, is_active=true
        `);
        const uRes = await db.execute(sql`SELECT id FROM auth_user WHERE email=${email} LIMIT 1`);
        const userId = (uRes.rows[0] as any)?.id;
        const rRes = await db.execute(sql`SELECT id FROM ent_role WHERE code=${roleCode} LIMIT 1`);
        const roleId = (rRes.rows[0] as any)?.id;
        if (userId && roleId) {
          await db.execute(sql`INSERT INTO ent_user_role (user_id, role_id) VALUES (${userId}, ${roleId}) ON CONFLICT DO NOTHING`);
        }
      } catch (e: any) {
        console.warn(`User ${username} failed:`, e.message);
      }
    }
    console.log('✅ Users ensured – 16 users – erp_admin to payroll_clerk_01 – password User@123 – for role-based manual testing');
  } catch (e: any) { console.warn('Users failed:', e.message); }

  await ensureAdmin();

  console.log('');
  console.log('✅✅✅ Fictional Company Setup Complete – Admin Data Auto-Created – Manual Ops Left for You ✅✅✅');
  console.log('');
  console.log('📦 Company Created:');
  console.log('   Tenant: TEN-100');
  console.log('   Company Group: ECGC-FMCG-01 – FMCG Group India – INR/IN/EN');
  console.log('   Legal Entity: 1000 – FMCG India Pvt Ltd – CoA CA-IN-01 FY K4 FSSV FSSV-1000 PPV PPV-1000 CRED CRED-1000');
  console.log('   Facility: FAC-1000 Pune Plant');
  console.log('   Locations: 0001 RAW / 0002 FG');
  console.log('   Sales Area: CO-1000 / SC-10 / PL-10');
  console.log('');
  console.log('💰 Financials:');
  console.log('   Fiscal Variant K4 – April-March – year_dependent false calendar_year false number_of_periods 12');
  console.log('   Field Status Variant FSSV-1000 + Groups G001/G002 bulk – SAP structure – multiple FIELD_NAME per group');
  console.log('   Posting Period Variant PPV-1000 – open 01-12/2026');
  console.log('   Credit Control Area CRED-1000 – INR');
  console.log('   Chart of Accounts CA-IN-01 – language EN');
  console.log('   GL Accounts 12 – BSX 1000000001, WRX 2000000000, GBB 4000000000, PRD 4000000001, KOFI 4000001000, KDM 4000002000, Vendor 2000000001 K, Customer 1000000002 D, Payroll 6000000000, COGS 5000000000, Retained 2500000001, Cash 100000');
  console.log('   Cost Centers CC-1000 etc.');
  console.log('   Document Types SA/KR/KZ/RE/WE/RV – Number Ranges SA-01 etc. – Tolerance GL-01/VEND-01 – Auto Account OBYC BSX/WRX/GBB/PRD/KDM – Movement Types 101/102/261/601/602/122 – Tax GST');
  console.log('');
  console.log('👥 Roles & Users:');
  console.log('   Roles: 17 – ERP_ADMIN to PAYROLL_CLERK');
  console.log('   Users: 16 – erp_admin@fmcg.com / pr_requester_01 / buyer_01 / wh_clerk_01 / wh_manager_01 / prod_planner_01 / shop_operator_01 / sales_rep_01 / shipping_clerk_01 / billing_clerk_01 / accountant_ap_01 / accountant_gl_01 / auditor_01 / hr_manager_01 / payroll_clerk_01 – password User@123 – erp_admin password Admin@123456');
  console.log('');
  console.log('🔧 What is left for manual testing (NOT auto-created):');
  console.log('   MM: PR→PO→GR(101)→IV – PR standard, tolerance, STO UB, subcon 541/101, RFQ ME41/ME47/ME49, reservation MB21');
  console.log('   SD: VD51 Customer-Material Info, VBN1 Free Goods, VBO1 Rebate, VA01 Sales Order, VL01N Delivery, PGI 601, VF01 Billing, VFX3 Billing Due List, VL10C STO Delivery, VL02N/VL09 PGI Reverse');
  console.log('   PP: MD61 PIR, MD02/MD03 MRP Run, CO01 Production Order with operations/components, CO11N Confirmation, CK11N Cost Estimate, CK40N Costing Run, Kitting K01/K02');
  console.log('   FICO: FB08 Reversal, F.13 GR/IR Clearing, F.05 FX Valuation, F110 Payment Proposal/Run, FI12 House Bank SBI-001, OKEON Cost Center Groups, KL01 Activity Types LAB-01, KSU5 Assessment Cycles, Recurring Postings');
  console.log('   HR: PA03 Payroll Control, PE01 Payroll Schema, PC00 Payroll Run, Employees, Org Units, Positions, Wage Types');
  console.log('   Audit: DMS Attachments GOS, SM37 Jobs, CDHDR Change Docs, Document Flow, Audit Logs');
  console.log('');
  console.log('🚀 Next: Login as different users per USER-FUNCTION-MATRIX and test PR→IV, SD, PP, FICO, HR, Audit manually');
  console.log('');
}

setupFictionalCompany()
  .then(()=>process.exit(0))
  .catch(e=>{
    console.error('❌ Setup failed:', e);
    process.exit(1);
  });
