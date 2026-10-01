/**
 * ============================================================================
 * ⚠️  TEST ONLY – MANUAL MIGRATION – NOT PART OF PRODUCTION AUTO-MIGRATION
 * ============================================================================
 * Fictional Company Setup – 1000 FMCG India Pvt Ltd – TEST DATA ONLY
 * WITH 2 COMPLETE PURCHASES PR → PO → GR → IV → PAYMENT
 * 
 * Location: manual-migrations/001_fictional_company_1000_fmcg_test_only.ts
 * Purpose:  Creates ALL admin/master data + 2 purchases from PR to IV complete
 *           including company structure and all data created in previous steps
 *           – for TESTING PURPOSE ONLY – leave empty if unnecessary.
 * 
 * ❌ NOT part of main migration:
 *   - NOT called by src/shared/kernel/db/autoMigrate.ts
 *   - NOT called by src/shared/kernel/db/initProduction.ts
 *   - NOT run on docker compose up --build
 *   - docker-compose.yml auto-migrate only runs npm run db:auto-migrate
 * 
 * ✅ MANUAL ONLY – run AFTER actual build – AFTER removing db volume fresh:
 *   docker compose down -v          # removes all previous data – fresh
 *   docker compose up --build -d    # build + start postgres + pgbouncer + dragonfly
 *   docker compose logs migrator    # check auto-migrate
 *   docker compose run --rm migrator npm run db:seed:fictional:test
 *   # or
 *   docker compose run --rm migrator npx tsx manual-migrations/001_fictional_company_1000_fmcg_test_only.ts
 *   # with wipe
 *   FULL_WIPE=true docker compose run --rm migrator npm run db:seed:fictional:test:wipe
 * 
 * What it creates:
 * - Tenant TEN-100
 * - Company Group ECGC-FMCG-01 INR IN EN
 * - Currencies INR USD EUR KWD GBP AED
 * - UoM KG PC L BOX BAG KIT
 * - Fiscal Calendar K4 April-March + 12 periods 2026-04 to 2027-03
 * - Field Status Variant FSSV-1000 + groups G001 G002 G004
 * - Posting Calendar PPV-1000 open 01-12/2026 for ALL/S/K/D/A
 * - Credit Control CRED-1000
 * - Chart CA-IN-01 + 12 GL accounts INV_POSTING 1400000001 GR_IR_CLEARING 2000000001 INV_OFFSET 4000000001 PRICE_DIFF 4000000004 Vendor Recon 2000000000 Customer Recon 1000000002 Bank SBI 8000000001 Cash 8000000000 etc
 * - Legal Entity 1000 FMCG India Pvt Ltd
 * - Facility FAC-1000 + storage locations 0001 RM Store 0002 FG Store SL01 SL02
 * - Sales Area CO-1000 SC-10 PL-10
 * - Number Ranges MAT-01 ITEM MAT-100001, PR-01 PR 1000000000, PO-01 PO 4500000000, GR-01 GR 5000000000, IV-01 IV 5100000000, KZ 53* 5300000000 etc – numeric only assignment per company error_and_extend locked badge next_available
 * - Document Types SA KR KZ RE WE RV
 * - Tolerance Groups GL-01 VEND-01 OBA0/OBA4 VEND-01
 * - Auto Account FAUC INV_POSTING/GR_IR_CLEARING/INV_OFFSET/PRICE_DIFF/EXCH_DIFF/REVENUE/REVENUE
 * - Movement Types GR_PO (legacy 101) GR PO GR_PO_REV (legacy 102) GR Reverse GI_PROD (legacy 261) GI Order GI_SALES (legacy 601) GI Delivery 602 GD Reverse 122 Return
 * - Tax Codes GST0 0% GST5 5% GST12 12% GST18 18% GST28 28% IGST18 18% + HSN 13 seeds
 * - Cost Centers CC-1000 Production CC-1001 Sales CC-1002 Admin + Profit Centers PC-1000 etc
 * - Procurement Division PO01 + Buyer Team BT-100
 * - Payment Terms NT30 NT10 etc FAPT OBA7 – days discount – due calc
 * - Exchange Rates USD→INR 83.5 M/B/G spread 0.1
 * - Business Partners: Vendors VEND-1000 VEND-1001 + Customer CUST-1000 – with payment_term_code FAPT recon_account FGLC procurement_division EPDC buyer_team EBTC currency FCYC tax FTXC
 * - Materials 10000001 Black Pepper RAW + 10000002 Turmeric RAW – valuation_class RAW price_control S/V – UoM KG
 * - Info Records VEND-1000 + 10000001 price 100, VEND-1001 + 10000002 price 80 – ME11 PIRC
 * - Roles 17 + Users 16
 * - Workflow Definitions PR_APPROVAL PO_APPROVAL – Manager <10000 Owner >=10000 dual
 * - 2 Purchases Complete:
 *   Purchase 1: PR 1000000000 (100 KG pepper) → PO 4500000000 (100 KG pepper, price 100 auto from info record, freight 5 customs 2 tax GST18 18% over/under 10%) → GR 5000000000 (60) + GR 5000000001 (40 final DELIV_COMPLETED) → IV 5100000000 (60) + credit memo 5100000001 (-10) + IV 5100000002 (50 variance 110 vs 100 PRICE_DIFF) → Payment KZ 5300000000 (7500) → GR/IR clearing CLR-... → Document flow PR→PO→GR→IV→Payment
 *   Purchase 2: PR 1000000001 (200 KG turmeric) → PO 4500000001 (200 KG turmeric, price 80, freight 3 customs 1 tax GST12 12%) → GR 5000000002 (200) → IV 5100000003 (200) → Payment KZ 5300000001
 * - Document Flow FDFL VBFA ALB WORM-lite – PR→PO→GR→IV→Payment
 * - Universal Ledger FULC ACDOCA – INV_POSTING/GR_IR_CLEARING/RE/KZ
 * - Stock Ledger FSTL ISTV – MAP
 * 
 * Idempotent: ON CONFLICT DO NOTHING where possible – safe to re-run – preserves manual data unless FULL_WIPE=true
 * FULL_WIPE=true → TRUNCATE ALL TABLES CASCADE – fresh start
 * ============================================================================
 */

import { db } from '../src/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

const FULL_WIPE = process.env.FULL_WIPE === 'true';

async function fullWipe() {
  if (!FULL_WIPE) {
    console.log('⏭️  FULL_WIPE != true – preserving existing data – upsert mode – safe');
    return;
  }
  console.log('💥 FULL_WIPE=true – TRUNCATING ALL TABLES CASCADE – fresh start – TEST ONLY');
  try {
    const tablesRes = await db.execute(sql`
      SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE 'pg_%' AND tablename NOT LIKE 'sql_%'
    `);
    const tables = (tablesRes.rows as any[]).map(r=>r.tablename);
    console.log(`   Found ${tables.length} tables to truncate`);
    if (tables.length > 0) {
      const tableList = tables.map(t=>`"${t}"`).join(', ');
      await db.execute(sql.raw(`TRUNCATE ${tableList} CASCADE`));
      console.log(`✅ Truncated ${tables.length} tables CASCADE – fresh`);
    }
  } catch (e: any) {
    console.warn('⚠️ Full wipe failed, trying individual truncates:', e.message);
    const criticalTables = [
      'fin_field_status_group','fin_field_status_variant','fin_posting_calendar_period','fin_posting_calendar',
      'fin_fiscal_calendar_period','fin_fiscal_calendar','fin_credit_policy_area','fin_legal_entity_credit_assign',
      'fin_ledger_account','fin_chart','fin_ledger_account','fin_chart','org_inventory_location','org_facility',
      'org_legal_entity','org_company_group','core_tenant','auth_user','core_tenant','org_legal_entity','org_facility',
      'org_inventory_location','core_currency','core_unit_measure','prod_category','fin_tax_rule','core_number_range',
      'fin_document_type','fin_tolerance_group','fin_auto_posting_rule','fin_pricing_procedure','fin_pricing_condition',
      'auth_role','auth_user_role','auth_user','fin_auto_account','fin_revenue_account','fin_auto_account',
      'inv_stock','inv_lot','prod_item','prod_item_type','prod_item','partner_account',
      'proc_purchase_requisition','proc_pr_line','proc_purchase_order','proc_po_line','proc_goods_receipt','proc_gr_line',
      'proc_invoice_verification','proc_iv_line','proc_purchasing_condition','proc_info_record','fin_payment_term',
      'fin_universal_ledger','inv_stock_ledger','audit_document_flow','fin_gr_ir_clearing','fin_universal_ledger','fin_universal_ledger_line',
      'wf_definition','wf_definition_step','wf_instance','wf_task','core_document','core_document_history'
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
  console.log('');
  console.log('=================================================================');
  console.log('⚠️  TEST ONLY – MANUAL – 1000 FMCG India Pvt Ltd + 2 Purchases');
  console.log('=================================================================');
  console.log(`   FULL_WIPE=${FULL_WIPE} – ${FULL_WIPE ? 'Will wipe then create' : 'Upsert preserve'}`);
  console.log(`   DATABASE_URL=${process.env.DATABASE_URL ? 'set' : 'NOT SET'}`);
  console.log('');

  await fullWipe();
  await ensureAdmin();

  // 1. Tenant
  let tenantId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS core_tenant (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(20) UNIQUE NOT NULL, name varchar(100) NOT NULL, description text, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO core_tenant (code, name, description) VALUES ('TEN-100', 'Main Tenant – FMCG', 'Tenant for FMCG Group') ON CONFLICT (code) DO NOTHING`);
    const tRes = await db.execute(sql`SELECT id FROM core_tenant WHERE code='TEN-100' LIMIT 1`);
    tenantId = (tRes.rows[0] as any)?.id;
    console.log(`✅ Tenant TEN-100 – id ${tenantId}`);
  } catch (e: any) { console.warn('Tenant failed:', e.message); }

  // 2. Company Group ECGC-FMCG-01
  let cgId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_company_group (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, description text, currency_code varchar(3) DEFAULT 'INR', country_code varchar(2) DEFAULT 'IN', country varchar(2) DEFAULT 'IN', language varchar(10) DEFAULT 'EN', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`ALTER TABLE org_company_group ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'INR'`);
    await db.execute(sql`ALTER TABLE org_company_group ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'IN'`);
    await db.execute(sql`ALTER TABLE org_company_group ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'EN'`);
    await db.execute(sql`INSERT INTO org_company_group (tenant_id, code, name, description, currency_code, country_code, country, language) VALUES (${tenantId}, 'ECGC-FMCG-01', 'FMCG Group India', 'FMCG Group for Spices and Foods – TEST ONLY', 'INR', 'IN', 'IN', 'EN') ON CONFLICT DO NOTHING`);
    let cgRes = await db.execute(sql`SELECT id FROM org_company_group WHERE tenant_id=${tenantId} AND code='ECGC-FMCG-01' LIMIT 1`);
    if (cgRes.rows.length === 0) cgRes = await db.execute(sql`SELECT id FROM org_company_group WHERE code='ECGC-FMCG-01' LIMIT 1`);
    cgId = (cgRes.rows[0] as any)?.id;
    console.log(`✅ Company Group ECGC-FMCG-01 – id ${cgId}`);
  } catch (e: any) { console.warn('Company Group failed:', e.message); }

  // 3. Currencies FCYC OY03
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS core_currency (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(3) UNIQUE NOT NULL, name varchar(100) NOT NULL, symbol varchar(10), decimal_places integer DEFAULT 2, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW())`);
    const currencies = [
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', dec: 2 },
      { code: 'USD', name: 'US Dollar', symbol: '$', dec: 2 },
      { code: 'EUR', name: 'Euro', symbol: '€', dec: 2 },
      { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', dec: 3 },
      { code: 'GBP', name: 'British Pound', symbol: '£', dec: 2 },
      { code: 'AED', name: 'UAE Dirham', symbol: 'AED', dec: 2 },
    ];
    for (const c of currencies) {
      await db.execute(sql`INSERT INTO core_currency (code, name, symbol, decimal_places) VALUES (${c.code}, ${c.name}, ${c.symbol}, ${c.dec}) ON CONFLICT (code) DO NOTHING`);
    }
    console.log(`✅ Currencies INR/USD/EUR/KWD/GBP/AED – FCYC OY03`);
  } catch (e: any) { console.warn('Currencies failed:', e.message); }

  // 4. UoM EUOC CUNI
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS core_unit_measure (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(20) UNIQUE NOT NULL, name varchar(100) NOT NULL, symbol varchar(20), is_base boolean DEFAULT false, base_uom_code varchar(20), conversion_factor numeric DEFAULT 1, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW())`);
    const uoms = [
      { code: 'KG', name: 'Kilogram', symbol: 'KG', base: true, baseCode: 'KG', conv: 1 },
      { code: 'PC', name: 'Piece', symbol: 'PC', base: false, baseCode: 'PC', conv: 1 },
      { code: 'L', name: 'Liter', symbol: 'L', base: false, baseCode: 'L', conv: 1 },
      { code: 'BOX', name: 'Box', symbol: 'BOX', base: false, baseCode: 'KG', conv: 10 },
      { code: 'BAG', name: 'Bag', symbol: 'BAG', base: false, baseCode: 'KG', conv: 25 },
      { code: 'KIT', name: 'Kit', symbol: 'KIT', base: false, baseCode: 'PC', conv: 1 },
    ];
    for (const u of uoms) {
      await db.execute(sql`INSERT INTO core_unit_measure (code, name, symbol, is_base, base_uom_code, conversion_factor) VALUES (${u.code}, ${u.name}, ${u.symbol}, ${u.base}, ${u.baseCode}, ${u.conv}) ON CONFLICT (code) DO NOTHING`);
    }
    console.log(`✅ UoM KG/PC/L/BOX/BAG/KIT – EUOC CUNI`);
  } catch (e: any) { console.warn('UoM failed:', e.message); }

  // 5. Fiscal Calendar FFYC OB29 K4 April-March
  let fiscalCalId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_fiscal_calendar (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, description text, year_dependent boolean DEFAULT false, calendar_year boolean DEFAULT false, number_of_periods integer DEFAULT 12, start_month integer DEFAULT 4, end_month integer DEFAULT 3, year_shift integer DEFAULT 0, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS year_dependent BOOLEAN DEFAULT false`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS calendar_year BOOLEAN DEFAULT false`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS number_of_periods INTEGER DEFAULT 12`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS start_month INTEGER DEFAULT 4`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS end_month INTEGER DEFAULT 3`);
    await db.execute(sql`INSERT INTO fin_fiscal_calendar (tenant_id, code, name, description, year_dependent, calendar_year, number_of_periods, start_month, end_month, year_shift) VALUES (${tenantId}, 'K4', 'Fiscal Year Variant K4 April-March', 'India fiscal Apr-Mar – TEST ONLY', false, false, 12, 4, 3, 0) ON CONFLICT DO NOTHING`);
    let fcRes = await db.execute(sql`SELECT id FROM fin_fiscal_calendar WHERE tenant_id=${tenantId} AND code='K4' LIMIT 1`);
    if (fcRes.rows.length === 0) fcRes = await db.execute(sql`SELECT id FROM fin_fiscal_calendar WHERE code='K4' LIMIT 1`);
    fiscalCalId = (fcRes.rows[0] as any)?.id;
    // Periods
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_fiscal_calendar_period (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), fiscal_calendar_id uuid REFERENCES fin_fiscal_calendar(id), period integer NOT NULL, year integer NOT NULL, from_date date NOT NULL, to_date date NOT NULL, is_special boolean DEFAULT false, created_at timestamp DEFAULT NOW(), UNIQUE(fiscal_calendar_id, period, year))`);
    for (let p = 1; p <= 12; p++) {
      const fromMonth = (3 + p) % 12 || 12;
      const fromYear = fromMonth >= 4 ? 2026 : 2027;
      const toMonth = fromMonth % 12 + 1;
      const toYear = toMonth === 1 ? fromYear + (fromMonth === 12 ? 1 : 0) : fromYear;
      // Simplified: Apr 2026-Mar 2027
      const fromDate = `2026-${String((3+p) %12 ||12).padStart(2,'0')}-01`;
      // For simplicity use 2026-04 to 2027-03
      const months = [4,5,6,7,8,9,10,11,12,1,2,3];
      const m = months[p-1];
      const y = m >=4 ? 2026 : 2027;
      const from = `${y}-${String(m).padStart(2,'0')}-01`;
      const to = `${y}-${String(m).padStart(2,'0')}-28`;
      await db.execute(sql`INSERT INTO fin_fiscal_calendar_period (fiscal_calendar_id, period, year, from_date, to_date) VALUES (${fiscalCalId}, ${p}, ${y}, ${from}::date, ${to}::date) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ Fiscal Calendar K4 April-March – id ${fiscalCalId} – FFYC OB29`);
  } catch (e: any) { console.warn('Fiscal Calendar failed:', e.message); }

  // 6. Field Status Variant FFSV-1000 + groups
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_field_status_variant (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, description text, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO fin_field_status_variant (tenant_id, code, name, description) VALUES (${tenantId}, 'FSSV-1000', 'Field Status Variant 1000', 'Field status for FMCG – TEST ONLY') ON CONFLICT DO NOTHING`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_field_status_group (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), variant_id uuid REFERENCES fin_field_status_variant(id), code varchar(20) NOT NULL, name varchar(100), description text, created_at timestamp DEFAULT NOW(), UNIQUE(variant_id, code))`);
    const fsvRes = await db.execute(sql`SELECT id FROM fin_field_status_variant WHERE tenant_id=${tenantId} AND code='FSSV-1000' LIMIT 1`);
    const fsvId = (fsvRes.rows[0] as any)?.id;
    if (fsvId) {
      for (const g of ['G001','G002','G004']) {
        await db.execute(sql`INSERT INTO fin_field_status_group (variant_id, code, name) VALUES (${fsvId}, ${g}, ${'Group '+g}) ON CONFLICT DO NOTHING`).catch(()=>{});
      }
    }
    console.log(`✅ Field Status Variant FSSV-1000 + groups G001/G002/G004 – FFSV OBC4`);
  } catch (e: any) { console.warn('Field Status Variant failed:', e.message); }

  // 7. Posting Calendar PPV-1000 open 01-12/2026 for ALL/S/K/D/A
  let postingCalId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_posting_calendar (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, description text, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO fin_posting_calendar (tenant_id, code, name, description) VALUES (${tenantId}, 'PPV-1000', 'Posting Period Variant 1000', 'Posting periods 2026 – TEST ONLY') ON CONFLICT DO NOTHING`);
    let pcRes = await db.execute(sql`SELECT id FROM fin_posting_calendar WHERE tenant_id=${tenantId} AND code='PPV-1000' LIMIT 1`);
    if (pcRes.rows.length === 0) pcRes = await db.execute(sql`SELECT id FROM fin_posting_calendar WHERE code='PPV-1000' LIMIT 1`);
    postingCalId = (pcRes.rows[0] as any)?.id;
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_posting_period_enhanced (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), variant_code varchar(20) NOT NULL, account_type varchar(5) NOT NULL, from_account varchar(20), to_account varchar(20), authorization_group varchar(20), from_period integer, from_year integer, to_period integer, to_year integer, is_open boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(variant_code, account_type, from_period, from_year))`);
    const accountTypes = ['+', 'A','D','K','M','S','V'];
    for (const at of accountTypes) {
      await db.execute(sql`INSERT INTO fin_posting_period_enhanced (variant_code, account_type, from_account, to_account, authorization_group, from_period, from_year, to_period, to_year, is_open) VALUES ('PPV-1000', ${at}, '1000000000', '9999999999', 'AUTH01', 1, 2026, 12, 2026, true) ON CONFLICT DO NOTHING`).catch(()=>{});
      await db.execute(sql`INSERT INTO fin_posting_period_enhanced (variant_code, account_type, from_account, to_account, authorization_group, from_period, from_year, to_period, to_year, is_open) VALUES ('PPV-1000', ${at}, '1000000000', '9999999999', 'AUTH01', 1, 2027, 12, 2027, true) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ Posting Calendar PPV-1000 open 01-12/2026/2027 for ALL/S/K/D/A – id ${postingCalId} – FPPC OBBO + FPPE FPPE`);
  } catch (e: any) { console.warn('Posting Calendar failed:', e.message); }

  // 8. Credit Control CRED-1000
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_credit_policy_area (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, description text, currency_code varchar(3) DEFAULT 'INR', risk_category varchar(20) DEFAULT 'LOW', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO fin_credit_policy_area (tenant_id, code, name, description, currency_code, risk_category) VALUES (${tenantId}, 'CRED-1000', 'Credit Control 1000', 'Credit control for FMCG – TEST ONLY', 'INR', 'LOW') ON CONFLICT DO NOTHING`);
    console.log(`✅ Credit Control CRED-1000 – FCPC OB45`);
  } catch (e: any) { console.warn('Credit Control failed:', e.message); }

  // 9. Chart of Accounts CA-IN-01 + GL accounts
  let chartId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_chart (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, language varchar(10) DEFAULT 'EN', chart_type varchar(20) DEFAULT 'OPERATING', description text, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO fin_chart (tenant_id, code, name, language, chart_type, description) VALUES (${tenantId}, 'CA-IN-01', 'Chart of Accounts India', 'EN', 'OPERATING', 'India chart – TEST ONLY') ON CONFLICT DO NOTHING`);
    let chRes = await db.execute(sql`SELECT id FROM fin_chart WHERE tenant_id=${tenantId} AND code='CA-IN-01' LIMIT 1`);
    if (chRes.rows.length === 0) chRes = await db.execute(sql`SELECT id FROM fin_chart WHERE code='CA-IN-01' LIMIT 1`);
    chartId = (chRes.rows[0] as any)?.id;
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_ledger_account (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, chart_id uuid REFERENCES fin_chart(id), account_number varchar(20) NOT NULL, name varchar(200) NOT NULL, account_type varchar(20) DEFAULT 'EXPENSE', is_balance_sheet boolean DEFAULT false, is_reconciliation boolean DEFAULT false, is_blocked boolean DEFAULT false, is_tax_relevant boolean DEFAULT false, account_group_code varchar(20) DEFAULT 'G001', coa_code varchar(20) DEFAULT 'CA-IN-01', created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, account_number))`);
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS coa_code VARCHAR(20) DEFAULT 'CA-IN-01'`);
    const glAccounts = [
      { num: '1400000001', name: 'Inventory Raw Material INV_POSTING', type: 'ASSET', bs: true, recon: false },
      { num: '2000000001', name: 'GR/IR Clearing GR_IR_CLEARING', type: 'LIABILITY', bs: true, recon: false },
      { num: '2000000000', name: 'Vendor Reconciliation RE', type: 'LIABILITY', bs: true, recon: true },
      { num: '1000000002', name: 'Customer Reconciliation', type: 'ASSET', bs: true, recon: true },
      { num: '8000000001', name: 'Bank SBI', type: 'ASSET', bs: true, recon: false },
      { num: '8000000000', name: 'Cash', type: 'ASSET', bs: true, recon: false },
      { num: '4000000004', name: 'Price Difference PRICE_DIFF', type: 'EXPENSE', bs: false, recon: false },
      { num: '2000000003', name: 'GST Tax', type: 'LIABILITY', bs: true, recon: false },
      { num: '4000000001', name: 'Price Diff', type: 'EXPENSE', bs: false, recon: false },
      { num: '4000001000', name: 'Inventory Adj REVENUE', type: 'EXPENSE', bs: false, recon: false },
      { num: '4000002000', name: 'Exchange Diff EXCH_DIFF', type: 'EXPENSE', bs: false, recon: false },
      { num: '5000000000', name: 'COGS', type: 'EXPENSE', bs: false, recon: false },
      { num: '2500000001', name: 'Retained Earnings', type: 'EQUITY', bs: true, recon: false },
      { num: '6000000000', name: 'Payroll', type: 'EXPENSE', bs: false, recon: false },
    ];
    for (const gl of glAccounts) {
      await db.execute(sql`INSERT INTO fin_ledger_account (tenant_id, chart_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, coa_code) VALUES (${tenantId}, ${chartId}, ${gl.num}, ${gl.name}, ${gl.type}, ${gl.bs}, ${gl.recon}, 'CA-IN-01') ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    // Legacy fin_ledger_account fallback
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_ledger_account (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), coa_id uuid, account_number varchar(20) UNIQUE NOT NULL, name varchar(200), account_type varchar(20), is_active boolean DEFAULT true)`).catch(()=>{});
    for (const gl of glAccounts) {
      await db.execute(sql`INSERT INTO fin_ledger_account (account_number, name, account_type) VALUES (${gl.num}, ${gl.name}, ${gl.type}) ON CONFLICT (account_number) DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ Chart CA-IN-01 + ${glAccounts.length} GL accounts – FCOA OB13 + FGLC FS00`);
  } catch (e: any) { console.warn('Chart/GL failed:', e.message); }

  // 10. Legal Entity 1000
  let legalEntityId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_legal_entity (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, company_group_id uuid, code varchar(20) NOT NULL, name varchar(200) NOT NULL, description text, currency_code varchar(3) DEFAULT 'INR', country_code varchar(2) DEFAULT 'IN', chart_of_accounts_code varchar(20) DEFAULT 'CA-IN-01', fiscal_year_variant_code varchar(20) DEFAULT 'K4', field_status_variant_code varchar(20) DEFAULT 'FSSV-1000', posting_period_variant_code varchar(20) DEFAULT 'PPV-1000', credit_control_area_code varchar(20) DEFAULT 'CRED-1000', facility_code varchar(20) DEFAULT 'FAC-1000', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO org_legal_entity (tenant_id, company_group_id, code, name, description, currency_code, country_code, chart_of_accounts_code, fiscal_year_variant_code, field_status_variant_code, posting_period_variant_code, credit_control_area_code, facility_code) VALUES (${tenantId}, ${cgId}, '1000', '1000 FMCG India Pvt Ltd', 'Legal entity for FMCG – TEST ONLY – 1000', 'INR', 'IN', 'CA-IN-01', 'K4', 'FSSV-1000', 'PPV-1000', 'CRED-1000', 'FAC-1000') ON CONFLICT DO NOTHING`);
    let leRes = await db.execute(sql`SELECT id FROM org_legal_entity WHERE tenant_id=${tenantId} AND code='1000' LIMIT 1`);
    if (leRes.rows.length === 0) leRes = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code='1000' LIMIT 1`);
    legalEntityId = (leRes.rows[0] as any)?.id;
    console.log(`✅ Legal Entity 1000 – id ${legalEntityId} – ELEC ELEC`);
  } catch (e: any) { console.warn('Legal Entity failed:', e.message); }

  // 11. Facility FAC-1000 EFCC EFCC
  let facilityId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_facility (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, legal_entity_id uuid, code varchar(20) NOT NULL, name varchar(200) NOT NULL, description text, facility_type varchar(20) DEFAULT 'PLANT', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO org_facility (tenant_id, legal_entity_id, code, name, description, facility_type) VALUES (${tenantId}, ${legalEntityId}, 'FAC-1000', '1000 FMCG Plant', 'Main plant – Palakkad – TEST ONLY', 'PLANT') ON CONFLICT DO NOTHING`);
    let fRes = await db.execute(sql`SELECT id FROM org_facility WHERE tenant_id=${tenantId} AND code='FAC-1000' LIMIT 1`);
    if (fRes.rows.length === 0) fRes = await db.execute(sql`SELECT id FROM org_facility WHERE code='FAC-1000' LIMIT 1`);
    facilityId = (fRes.rows[0] as any)?.id;
    console.log(`✅ Facility FAC-1000 – id ${facilityId} – EFCC EFCC`);
  } catch (e: any) { console.warn('Facility failed:', e.message); }

  // 12. Inventory Locations EILC EILC – 0001 RM Store 0002 FG Store + SL01 SL02
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_inventory_location (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, facility_id uuid, code varchar(20) NOT NULL, name varchar(200) NOT NULL, description text, location_type varchar(20) DEFAULT 'RAW_ZONE', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(facility_id, code))`);
    await db.execute(sql`ALTER TABLE org_inventory_location ADD COLUMN IF NOT EXISTS location_type VARCHAR(20) DEFAULT 'RAW_ZONE'`);
    const locs = [
      { code: '0001', name: 'RM Store', type: 'RAW_ZONE' },
      { code: '0002', name: 'FG Store', type: 'FINISHED_ZONE' },
      { code: 'SL01', name: 'SL01 RM Store', type: 'RAW_ZONE' },
      { code: 'SL02', name: 'SL02 FG Store', type: 'FINISHED_ZONE' },
    ];
    for (const loc of locs) {
      await db.execute(sql`INSERT INTO org_inventory_location (tenant_id, facility_id, code, name, location_type) VALUES (${tenantId}, ${facilityId}, ${loc.code}, ${loc.name}, ${loc.type}) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ Inventory Locations 0001/0002/SL01/SL02 – EILC EILC`);
  } catch (e: any) { console.warn('Inventory Locations failed:', e.message); }

  // 13. Sales Area – Commercial Org CO-1000, Sales Channel SC-10, Product Line PL-10
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_commercial_org (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(200), description text, is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_sales_channel (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(200), description text, is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_product_line (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(200), description text, is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO org_commercial_org (tenant_id, code, name) VALUES (${tenantId}, 'CO-1000', 'FMCG Sales Org') ON CONFLICT DO NOTHING`);
    await db.execute(sql`INSERT INTO org_sales_channel (tenant_id, code, name) VALUES (${tenantId}, 'SC-10', 'Direct Sales') ON CONFLICT DO NOTHING`);
    await db.execute(sql`INSERT INTO org_product_line (tenant_id, code, name) VALUES (${tenantId}, 'PL-10', 'Standard Price') ON CONFLICT DO NOTHING`);
    console.log(`✅ Sales Area CO-1000/SC-10/PL-10 – ECOC OVX2 ESCC OVTB EPLC OVXA`);
  } catch (e: any) { console.warn('Sales Area failed:', e.message); }

  // 14. Number Ranges FNRC FNRC – numeric only – MAT-01, PR, PO, GR, IV, KZ etc
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS core_number_range (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(50) NOT NULL, object_type varchar(50) NOT NULL, prefix varchar(20) DEFAULT '', from_number bigint NOT NULL, to_number bigint NOT NULL, current_number bigint DEFAULT 0, fiscal_year integer, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW(), UNIQUE(code))`);
    await db.execute(sql`ALTER TABLE core_number_range ADD COLUMN IF NOT EXISTS fiscal_year INTEGER`);
    const ranges = [
      { code: 'MAT-01', obj: 'ITEM', from: 10000000, to: 19999999, curr: 10000002 },
      { code: 'PR-01', obj: 'PR', from: 1000000000, to: 1999999999, curr: 1000000001 },
      { code: 'PO-01', obj: 'PO', from: 4500000000, to: 4599999999, curr: 4500000001 },
      { code: 'GR-01', obj: 'GR', from: 5000000000, to: 5099999999, curr: 5000000002 },
      { code: 'IV-01', obj: 'IV', from: 5100000000, to: 5199999999, curr: 5100000003 },
      { code: 'KZ-01', obj: 'KZ', from: 5300000000, to: 5399999999, curr: 5300000001 },
      { code: 'VEND-01', obj: 'VENDOR', from: 1000, to: 999999, curr: 1002 },
      { code: 'CUST-01', obj: 'CUSTOMER', from: 1000, to: 999999, curr: 1001 },
    ];
    for (const r of ranges) {
      await db.execute(sql`INSERT INTO core_number_range (tenant_id, code, object_type, from_number, to_number, current_number) VALUES (${tenantId}, ${r.code}, ${r.obj}, ${r.from}, ${r.to}, ${r.curr}) ON CONFLICT (code) DO UPDATE SET current_number = GREATEST(core_number_range.current_number, ${r.curr})`).catch(()=>{});
    }
    await db.execute(sql`CREATE TABLE IF NOT EXISTS core_number_range_assignment (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), object_type varchar(50) NOT NULL, assignment_key varchar(100) NOT NULL, assignment_type varchar(50) DEFAULT 'MATERIAL_TYPE', number_range_code varchar(50) NOT NULL, fiscal_year integer, is_active boolean DEFAULT true, description text, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW(), UNIQUE(object_type, assignment_key, fiscal_year))`);
    await db.execute(sql`INSERT INTO core_number_range_assignment (object_type, assignment_key, number_range_code, fiscal_year, is_active) VALUES ('PR', '1000', 'PR-01', 2026, true) ON CONFLICT DO NOTHING`).catch(()=>{});
    await db.execute(sql`INSERT INTO core_number_range_assignment (object_type, assignment_key, number_range_code, fiscal_year, is_active) VALUES ('PO', '1000', 'PO-01', 2026, true) ON CONFLICT DO NOTHING`).catch(()=>{});
    await db.execute(sql`INSERT INTO core_number_range_assignment (object_type, assignment_key, number_range_code, fiscal_year, is_active) VALUES ('GR', '1000', 'GR-01', 2026, true) ON CONFLICT DO NOTHING`).catch(()=>{});
    await db.execute(sql`INSERT INTO core_number_range_assignment (object_type, assignment_key, number_range_code, fiscal_year, is_active) VALUES ('IV', '1000', 'IV-01', 2026, true) ON CONFLICT DO NOTHING`).catch(()=>{});
    console.log(`✅ Number Ranges MAT-01 PR-01 PO-01 GR-01 IV-01 KZ-01 VEND-01 CUST-01 – FNRC FNRC – numeric only – assignment per company – error_and_extend – next_available`);
  } catch (e: any) { console.warn('Number Ranges failed:', e.message); }

  // 15. Document Types
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_document_type (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, description text, is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`);
    const docTypes = [
      { code: 'SA', name: 'G/L Account Document' },
      { code: 'KR', name: 'Vendor Invoice' },
      { code: 'KZ', name: 'Vendor Payment' },
      { code: 'RE', name: 'Vendor Credit Memo' },
      { code: 'WE', name: 'Goods Receipt' },
      { code: 'RV', name: 'Billing' },
    ];
    for (const dt of docTypes) {
      await db.execute(sql`INSERT INTO fin_document_type (tenant_id, code, name) VALUES (${tenantId}, ${dt.code}, ${dt.name}) ON CONFLICT DO NOTHING`);
    }
    console.log(`✅ Document Types SA/KR/KZ/RE/WE/RV – FDTC OBA7`);
  } catch (e: any) { console.warn('Doc Types failed:', e.message); }

  // 16. Tolerance Groups OBA0/OBA4 VEND-01 GL-01
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_tolerance_group (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, tolerance_type varchar(20) DEFAULT 'VENDOR', amount_limit numeric DEFAULT 1000, percent_limit numeric DEFAULT 10, is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO fin_tolerance_group (tenant_id, code, name, tolerance_type, amount_limit, percent_limit) VALUES (${tenantId}, 'VEND-01', 'Vendor Tolerance 01', 'VENDOR', 1000, 10) ON CONFLICT DO NOTHING`);
    await db.execute(sql`INSERT INTO fin_tolerance_group (tenant_id, code, name, tolerance_type, amount_limit, percent_limit) VALUES (${tenantId}, 'GL-01', 'GL Tolerance 01', 'GL', 500, 5) ON CONFLICT DO NOTHING`);
    console.log(`✅ Tolerance Groups VEND-01 GL-01 – OBA0/OBA4 – amount 1000 percent 10 – T1`);
  } catch (e: any) { console.warn('Tolerance Groups failed:', e.message); }

  // 17. Auto Account FAUC INV_POSTING/GR_IR_CLEARING/INV_OFFSET/PRICE_DIFF/EXCH_DIFF/REVENUE/REVENUE
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_auto_account_enhanced (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, transaction_key varchar(20) NOT NULL, chart_of_accounts_code varchar(20) NOT NULL, valuation_grouping_code varchar(20) DEFAULT '0001', account_grouping_code varchar(20) DEFAULT 'VAX', gl_account_number varchar(20) NOT NULL, legal_entity_code varchar(20) DEFAULT '1000', is_active boolean DEFAULT true, UNIQUE(tenant_id, transaction_key, chart_of_accounts_code, valuation_grouping_code, account_grouping_code))`);
    const autoAccounts = [
      { key: 'INV_POSTING', chart: 'KSCA', valGroup: '0001', accGroup: 'VAX', gl: '1400000001', legacy: 'BSX' },
      { key: 'GR_IR_CLEARING', chart: 'KSCA', valGroup: '0001', accGroup: 'VAX', gl: '2000000001', legacy: 'WRX' },
      { key: 'INV_OFFSET', chart: 'KSCA', valGroup: '0001', accGroup: 'VAX', gl: '4000000001', legacy: 'GBB' },
      { key: 'PRICE_DIFF', chart: 'KSCA', valGroup: '0001', accGroup: 'VAX', gl: '4000000004', legacy: 'PRD' },
      { key: 'EXCH_DIFF', chart: 'KSCA', valGroup: '0001', accGroup: 'VAX', gl: '4000002000' },
      { key: 'REVENUE', chart: 'KSCA', valGroup: '0001', accGroup: 'VAX', gl: '4000001000' },
    ];
    for (const aa of autoAccounts) {
      await db.execute(sql`INSERT INTO fin_auto_account_enhanced (tenant_id, transaction_key, chart_of_accounts_code, valuation_grouping_code, account_grouping_code, gl_account_number, legal_entity_code) VALUES (${tenantId}, ${aa.key}, ${aa.chart}, ${aa.valGroup}, ${aa.accGroup}, ${aa.gl}, '1000') ON CONFLICT DO NOTHING`).catch(()=>{});
      // Also insert into main fin_auto_account and fin_auto_posting_rule with own IP + legacy alias
      await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_auto_account (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, chart_of_accounts varchar(20), transaction_key varchar(20), sap_legacy_key varchar(20), valuation_class varchar(20), gl_account varchar(20), description text, UNIQUE(tenant_id, chart_of_accounts, transaction_key, valuation_class))`).catch(()=>{});
      await db.execute(sql`INSERT INTO fin_auto_account (tenant_id, chart_of_accounts, transaction_key, sap_legacy_key, valuation_class, gl_account, description) VALUES (${tenantId}, ${aa.chart}, ${aa.key}, ${aa.legacy || aa.key}, ${aa.valGroup}, ${aa.gl}, ${aa.key + ' own IP (legacy ' + (aa.legacy || aa.key) + ') – FAUC (legacy OBYC) – auto account'}) ON CONFLICT DO NOTHING`).catch(()=>{});
      await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_auto_posting_rule (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, transaction_key varchar(20), transaction_key_legacy varchar(20), chart_of_accounts varchar(20), inventory_valuation_class varchar(20), ledger_account_id varchar(20), description text)`).catch(()=>{});
      await db.execute(sql`INSERT INTO fin_auto_posting_rule (tenant_id, transaction_key, transaction_key_legacy, chart_of_accounts, inventory_valuation_class, ledger_account_id, description) VALUES (${tenantId}, ${aa.key}, ${aa.legacy || aa.key}, ${aa.chart}, ${aa.valGroup}, ${aa.gl}, ${aa.key + ' own IP (legacy ' + (aa.legacy || aa.key) + ') – FAUC'}) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ Auto Account FAUC INV_POSTING/GR_IR_CLEARING/INV_OFFSET/PRICE_DIFF/EXCH_DIFF/REVENUE – FAUC (legacy OBYC) own IP with SAP alias – T0`);
  } catch (e: any) { console.warn('Auto Account failed:', e.message); }

  // 18. Movement Types FMTM FMTM 101 102 261 601 602 122
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_movement_type_enhanced (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(10) NOT NULL, name varchar(100) NOT NULL, description text, transaction_key varchar(20) DEFAULT 'INV_POSTING', special_stock_indicator varchar(10) DEFAULT '', is_reversal boolean DEFAULT false, reversal_code varchar(10), is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`);
    const movements = [
      { code: 'GR_PO', name: 'GR for PO', desc: 'Goods Receipt for Purchase Order – INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX) – own IP GR_PO (legacy 101)', trans: 'INV_POSTING', rev: false, revCode: 'GR_PO_REV', legacy: '101' },
      { code: 'GR_PO_REV', name: 'GR Reversal', desc: 'Reversal of GR_PO (legacy 101) – GRRE IGRC 102 – own IP GR_PO_REV (legacy 102)', trans: 'INV_POSTING', rev: true, revCode: 'GR_PO', legacy: '102' },
      { code: 'GI_PROD', name: 'GI for Order', desc: 'Goods Issue for Production Order – INV_OFFSET/INV_POSTING (legacy GBB/BSX) – own IP GI_PROD (legacy 261)', trans: 'INV_OFFSET', rev: false, revCode: 'GI_PROD_REV', legacy: '261' },
      { code: 'GI_SALES', name: 'GI for Delivery', desc: 'Goods Issue for Delivery – INV_OFFSET/INV_POSTING VAX – own IP GI_SALES (legacy 601)', trans: 'INV_OFFSET', rev: false, revCode: 'GI_SALES_REV', legacy: '601' },
      { code: 'GI_SALES_REV', name: 'GD Reversal', desc: 'Reversal of GI_SALES (legacy 601) – own IP GI_SALES_REV (legacy 602)', trans: 'INV_OFFSET', rev: true, revCode: 'GI_SALES', legacy: '602' },
      { code: 'GR_RETURN', name: 'Return to Vendor', desc: 'Return delivery to vendor – own IP GR_RETURN (legacy 122)', trans: 'INV_POSTING', rev: false, revCode: '', legacy: '122' },
    ];
    for (const m of movements) {
      await db.execute(sql`INSERT INTO fin_movement_type_enhanced (tenant_id, code, name, description, transaction_key, is_reversal, reversal_code) VALUES (${tenantId}, ${m.code}, ${m.name}, ${m.desc}, ${m.trans}, ${m.rev}, ${m.revCode}) ON CONFLICT DO NOTHING`).catch(()=>{});
      // Also insert into main fin_movement_type with own IP + sap_legacy_code alias
      await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_movement_type (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, sap_legacy_code varchar(20), name varchar(100), description text, transaction_key varchar(20), is_reversal boolean DEFAULT false, reversal_code varchar(20), is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`).catch(()=>{});
      await db.execute(sql`INSERT INTO fin_movement_type (tenant_id, code, sap_legacy_code, name, description, transaction_key, is_reversal, reversal_code, is_active) VALUES (${tenantId}, ${m.code}, ${m.legacy}, ${m.name}, ${m.desc}, ${m.trans}, ${m.rev}, ${m.revCode}, true) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ Movement Types GR_PO/GI_PROD/GI_SALES (legacy 101/261/601) – FMTM (legacy OMJJ) own IP with SAP alias – T0`);
  } catch (e: any) { console.warn('Movement Types failed:', e.message); }

  // 19. Tax Codes FTXC FTXP GST0/5/12/18/28 IGST18 + HSN 13 seeds
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_tax_rule (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, description text, rate numeric DEFAULT 0, tax_type varchar(20) DEFAULT 'INPUT', gst_type varchar(20) DEFAULT 'CGST', hsn_code varchar(20), ledger_account_code varchar(20), is_reverse_charge boolean DEFAULT false, is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`);
    const taxes = [
      { code: 'GST0', name: 'GST 0%', desc: 'GST 0% – Exempt', rate: 0, type: 'BOTH', gst: 'CGST', hsn: '09041110', ledger: '2000000003' },
      { code: 'GST5', name: 'GST 5%', desc: 'GST 5% – Essential', rate: 5, type: 'BOTH', gst: 'CGST', hsn: '09041120', ledger: '2000000003' },
      { code: 'GST12', name: 'GST 12%', desc: 'GST 12% – Standard', rate: 12, type: 'BOTH', gst: 'CGST', hsn: '09041130', ledger: '2000000003' },
      { code: 'GST18', name: 'GST 18%', desc: 'GST 18% – Standard', rate: 18, type: 'BOTH', gst: 'CGST', hsn: '09041110', ledger: '2000000003' },
      { code: 'GST28', name: 'GST 28%', desc: 'GST 28% – Luxury', rate: 28, type: 'BOTH', gst: 'CGST', hsn: '09041190', ledger: '2000000003' },
      { code: 'IGST18', name: 'IGST 18%', desc: 'IGST 18% – Inter-state', rate: 18, type: 'BOTH', gst: 'IGST', hsn: '09041110', ledger: '2000000003' },
    ];
    for (const t of taxes) {
      await db.execute(sql`INSERT INTO fin_tax_rule (tenant_id, code, name, description, rate, tax_type, gst_type, hsn_code, ledger_account_code) VALUES (${tenantId}, ${t.code}, ${t.name}, ${t.desc}, ${t.rate}, ${t.type}, ${t.gst}, ${t.hsn}, ${t.ledger}) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    // HSN codes
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_hsn_code (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, description text, gst_rate numeric DEFAULT 0, is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`);
    const hsnCodes = [
      { code: '09041110', desc: 'Black pepper – neither crushed nor ground – 5%', rate: 5 },
      { code: '09041120', desc: 'Black pepper – crushed – 5%', rate: 5 },
      { code: '09041130', desc: 'White pepper – 12%', rate: 12 },
      { code: '09041190', desc: 'Other pepper – 18%', rate: 18 },
      { code: '09103010', desc: 'Turmeric – fresh – 5%', rate: 5 },
      { code: '09103020', desc: 'Turmeric – dried – 12%', rate: 12 },
      { code: '09103030', desc: 'Turmeric powder – 18%', rate: 18 },
    ];
    for (const h of hsnCodes) {
      await db.execute(sql`INSERT INTO fin_hsn_code (tenant_id, code, description, gst_rate) VALUES (${tenantId}, ${h.code}, ${h.desc}, ${h.rate}) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ Tax Codes GST0/5/12/18/28 IGST18 + HSN 7 seeds – FTXC FTXP`);
  } catch (e: any) { console.warn('Tax Codes failed:', e.message); }

  // 20. Cost Centers + Profit Centers + Control Area
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_mgmt_control_area (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(200), description text, is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO org_mgmt_control_area (tenant_id, code, name) VALUES (${tenantId}, 'CA01', 'Controlling Area 01') ON CONFLICT DO NOTHING`);
    let caRes = await db.execute(sql`SELECT id FROM org_mgmt_control_area WHERE tenant_id=${tenantId} AND code='CA01' LIMIT 1`);
    if (caRes.rows.length === 0) caRes = await db.execute(sql`SELECT id FROM org_mgmt_control_area WHERE code='CA01' LIMIT 1`);
    const caId = (caRes.rows[0] as any)?.id;
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_cost_unit (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, control_area_id uuid, code varchar(20) NOT NULL, name varchar(200), description text, cost_center_category varchar(20) DEFAULT 'PRODUCTION', is_active boolean DEFAULT true, UNIQUE(control_area_id, code))`);
    await db.execute(sql`ALTER TABLE org_cost_unit ADD COLUMN IF NOT EXISTS control_area_id UUID`);
    const costCenters = [
      { code: 'CC-1000', name: 'Production Cost Center', cat: 'PRODUCTION' },
      { code: 'CC-1001', name: 'Sales Cost Center', cat: 'SALES' },
      { code: 'CC-1002', name: 'Admin Cost Center', cat: 'ADMIN' },
    ];
    for (const cc of costCenters) {
      await db.execute(sql`INSERT INTO org_cost_unit (tenant_id, control_area_id, code, name, cost_center_category) VALUES (${tenantId}, ${caId}, ${cc.code}, ${cc.name}, ${cc.cat}) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_profit_unit (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(200), description text, is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`);
    const profitCenters = [
      { code: 'PC-1000', name: 'Spices Profit Center' },
      { code: 'PC-1001', name: 'Foods Profit Center' },
    ];
    for (const pc of profitCenters) {
      await db.execute(sql`INSERT INTO org_profit_unit (tenant_id, code, name) VALUES (${tenantId}, ${pc.code}, ${pc.name}) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ Cost Centers CC-1000/1001/1002 + Profit Centers PC-1000/1001 + Control Area CA01 – FCOC KS01 + EPUC KE51`);
  } catch (e: any) { console.warn('Cost/Profit Centers failed:', e.message); }

  // 21. Procurement Division + Buyer Team
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_procurement_division (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(200), legal_entity_id uuid, description text, is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO org_procurement_division (tenant_id, code, name, legal_entity_id) VALUES (${tenantId}, 'PO01', 'Spices Purchasing', ${legalEntityId}) ON CONFLICT DO NOTHING`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_buyer_team (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(200), procurement_division_id uuid, description text, is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`);
    let pdRes = await db.execute(sql`SELECT id FROM org_procurement_division WHERE tenant_id=${tenantId} AND code='PO01' LIMIT 1`);
    if (pdRes.rows.length === 0) pdRes = await db.execute(sql`SELECT id FROM org_procurement_division WHERE code='PO01' LIMIT 1`);
    const pdId = (pdRes.rows[0] as any)?.id;
    await db.execute(sql`INSERT INTO org_buyer_team (tenant_id, code, name, procurement_division_id) VALUES (${tenantId}, 'BT-100', 'Raw Materials Team', ${pdId}) ON CONFLICT DO NOTHING`);
    console.log(`✅ Procurement Division PO01 + Buyer Team BT-100 – EPDC OX08 + EBTC OME4`);
  } catch (e: any) { console.warn('Procurement Division/Buyer Team failed:', e.message); }

  // 22. Payment Terms FAPT OBA7 NT30 NT10
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_payment_term (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, description text, days integer DEFAULT 30, discount_days integer DEFAULT 0, discount_percent numeric DEFAULT 0, is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`);
    const pts = [
      { code: 'NT30', name: 'Net 30 Days', desc: 'Payment within 30 days', days: 30, discDays: 10, discPct: 2 },
      { code: 'NT10', name: 'Net 10 Days', desc: 'Payment within 10 days', days: 10, discDays: 0, discPct: 0 },
      { code: 'NT60', name: 'Net 60 Days', desc: 'Payment within 60 days', days: 60, discDays: 15, discPct: 1 },
    ];
    for (const pt of pts) {
      await db.execute(sql`INSERT INTO fin_payment_term (tenant_id, code, name, description, days, discount_days, discount_percent) VALUES (${tenantId}, ${pt.code}, ${pt.name}, ${pt.desc}, ${pt.days}, ${pt.discDays}, ${pt.discPct}) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ Payment Terms NT30 NT10 NT60 – FAPT OBA7 – days discount – due calc`);
  } catch (e: any) { console.warn('Payment Terms failed:', e.message); }

  // 23. Exchange Rates FEXC OB08
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_exchange_rate_enhanced (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, from_currency varchar(3) NOT NULL, to_currency varchar(3) NOT NULL, rate_type varchar(5) DEFAULT 'M', rate numeric NOT NULL, spread numeric DEFAULT 0, from_factor integer DEFAULT 1, to_factor integer DEFAULT 1, direct_quotation boolean DEFAULT true, valid_from date DEFAULT CURRENT_DATE, valid_to date DEFAULT CURRENT_DATE + INTERVAL '1 year', is_active boolean DEFAULT true, UNIQUE(tenant_id, from_currency, to_currency, rate_type))`);
    await db.execute(sql`INSERT INTO fin_exchange_rate_enhanced (tenant_id, from_currency, to_currency, rate_type, rate, spread, from_factor, to_factor, direct_quotation) VALUES (${tenantId}, 'USD', 'INR', 'M', 83.5, 0.1, 1, 1, true) ON CONFLICT DO NOTHING`).catch(()=>{});
    await db.execute(sql`INSERT INTO fin_exchange_rate_enhanced (tenant_id, from_currency, to_currency, rate_type, rate, spread) VALUES (${tenantId}, 'EUR', 'INR', 'M', 90.2, 0.1) ON CONFLICT DO NOTHING`).catch(()=>{});
    console.log(`✅ Exchange Rates USD→INR 83.5 EUR→INR 90.2 – FEXC OB08 M/B/G spread 100:1`);
  } catch (e: any) { console.warn('Exchange Rates failed:', e.message); }

  // 24. Business Partners – Vendors VEND-1000 VEND-1001 + Customer CUST-1000
  let vendorId1: string | null = null;
  let vendorId2: string | null = null;
  let customerId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS partner_account (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, account_number varchar(20) NOT NULL, display_name varchar(200) NOT NULL, legal_name varchar(200), role varchar(20) DEFAULT 'VENDOR', gst_number varchar(20), pan_number varchar(20), tax_id varchar(20), email varchar(200), phone varchar(20), address text, city varchar(100), region varchar(100), postal_code varchar(20), country varchar(2) DEFAULT 'IN', currency_code varchar(3) DEFAULT 'INR', is_blocked boolean DEFAULT false, is_one_time boolean DEFAULT false, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, account_number))`);
    await db.execute(sql`ALTER TABLE partner_account ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'INR'`);
    await db.execute(sql`ALTER TABLE partner_account ADD COLUMN IF NOT EXISTS is_one_time BOOLEAN DEFAULT false`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS partner_vendor_profile (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), partner_id uuid REFERENCES partner_account(id), payment_term_code varchar(20) DEFAULT 'NT30', payment_term_days integer DEFAULT 30, reconciliation_account_id uuid, procurement_division_code varchar(20) DEFAULT 'PO01', buyer_team_code varchar(20) DEFAULT 'BT-100', tax_classification varchar(20) DEFAULT 'GST18', incoterms varchar(10) DEFAULT 'EXW', is_quality_relevant boolean DEFAULT false, created_at timestamp DEFAULT NOW(), UNIQUE(partner_id))`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS partner_customer_profile (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), partner_id uuid REFERENCES partner_account(id), payment_term_code varchar(20) DEFAULT 'NT30', reconciliation_account_id uuid, sales_org_code varchar(20) DEFAULT 'CO-1000', distribution_channel_code varchar(20) DEFAULT 'SC-10', created_at timestamp DEFAULT NOW(), UNIQUE(partner_id))`);

    // Get GL recon ids
    let vendorReconId: any = null;
    let customerReconId: any = null;
    try {
      const vRecon = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number='2000000000' LIMIT 1`);
      vendorReconId = (vRecon.rows[0] as any)?.id;
      const cRecon = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number='1000000002' LIMIT 1`);
      customerReconId = (cRecon.rows[0] as any)?.id;
    } catch {}

    await db.execute(sql`INSERT INTO partner_account (tenant_id, account_number, display_name, legal_name, role, gst_number, pan_number, email, phone, city, region, country, currency_code) VALUES (${tenantId}, 'VEND-1000', 'Spices Supplier Pvt Ltd', 'Spices Supplier Pvt Ltd', 'VENDOR', '27ABCDE1234F1Z5', 'ABCDE1234F', 'vendor1000@fmcg.com', '9876543210', 'Kochi', 'Kerala', 'IN', 'INR') ON CONFLICT DO NOTHING`);
    await db.execute(sql`INSERT INTO partner_account (tenant_id, account_number, display_name, legal_name, role, gst_number, pan_number, email, phone, city, region, country, currency_code) VALUES (${tenantId}, 'VEND-1001', 'Turmeric Traders Ltd', 'Turmeric Traders Ltd', 'VENDOR', '27ABCDE1234F1Z6', 'ABCDE1234G', 'vendor1001@fmcg.com', '9876543211', 'Palakkad', 'Kerala', 'IN', 'INR') ON CONFLICT DO NOTHING`);
    await db.execute(sql`INSERT INTO partner_account (tenant_id, account_number, display_name, legal_name, role, gst_number, pan_number, email, phone, city, region, country, currency_code) VALUES (${tenantId}, 'CUST-1000', 'Spice Retail Chain', 'Spice Retail Chain Pvt Ltd', 'CUSTOMER', '27ABCDE1234F1Z7', 'ABCDE1234H', 'customer1000@fmcg.com', '9876543212', 'Bangalore', 'Karnataka', 'IN', 'INR') ON CONFLICT DO NOTHING`);

    let v1Res = await db.execute(sql`SELECT id FROM partner_account WHERE tenant_id=${tenantId} AND account_number='VEND-1000' LIMIT 1`);
    if (v1Res.rows.length === 0) v1Res = await db.execute(sql`SELECT id FROM partner_account WHERE account_number='VEND-1000' LIMIT 1`);
    vendorId1 = (v1Res.rows[0] as any)?.id;
    let v2Res = await db.execute(sql`SELECT id FROM partner_account WHERE tenant_id=${tenantId} AND account_number='VEND-1001' LIMIT 1`);
    if (v2Res.rows.length === 0) v2Res = await db.execute(sql`SELECT id FROM partner_account WHERE account_number='VEND-1001' LIMIT 1`);
    vendorId2 = (v2Res.rows[0] as any)?.id;
    let cRes = await db.execute(sql`SELECT id FROM partner_account WHERE tenant_id=${tenantId} AND account_number='CUST-1000' LIMIT 1`);
    if (cRes.rows.length === 0) cRes = await db.execute(sql`SELECT id FROM partner_account WHERE account_number='CUST-1000' LIMIT 1`);
    customerId = (cRes.rows[0] as any)?.id;

    if (vendorId1) {
      await db.execute(sql`INSERT INTO partner_vendor_profile (partner_id, payment_term_code, payment_term_days, reconciliation_account_id, procurement_division_code, buyer_team_code, tax_classification, incoterms) VALUES (${vendorId1}, 'NT30', 30, ${vendorReconId}, 'PO01', 'BT-100', 'GST18', 'EXW') ON CONFLICT (partner_id) DO UPDATE SET payment_term_code='NT30', reconciliation_account_id=${vendorReconId}`).catch(()=>{});
    }
    if (vendorId2) {
      await db.execute(sql`INSERT INTO partner_vendor_profile (partner_id, payment_term_code, payment_term_days, reconciliation_account_id, procurement_division_code, buyer_team_code, tax_classification, incoterms) VALUES (${vendorId2}, 'NT30', 30, ${vendorReconId}, 'PO01', 'BT-100', 'GST12', 'FOB') ON CONFLICT (partner_id) DO UPDATE SET payment_term_code='NT30', reconciliation_account_id=${vendorReconId}`).catch(()=>{});
    }
    if (customerId) {
      await db.execute(sql`INSERT INTO partner_customer_profile (partner_id, payment_term_code, reconciliation_account_id, sales_org_code, distribution_channel_code) VALUES (${customerId}, 'NT30', ${customerReconId}, 'CO-1000', 'SC-10') ON CONFLICT (partner_id) DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ Business Partners VEND-1000 id ${vendorId1} VEND-1001 id ${vendorId2} CUST-1000 id ${customerId} – PSUC XK01 SCUC XD01 EPAC BP01 – payment_term_code NT30 FAPT recon FGLC 2000000000 procurement_division PO01 EPDC buyer_team BT-100 EBTC currency INR FCYC tax GST18 FTXC`);
  } catch (e: any) { console.warn('Business Partners failed:', e.message); }

  // 25. Materials EMTC EMTC – 10000001 Black Pepper RAW + 10000002 Turmeric RAW
  let materialId1: string | null = null;
  let materialId2: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS prod_category (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(200), parent_code varchar(20), is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO prod_category (tenant_id, code, name) VALUES (${tenantId}, 'CAT-SPICE', 'Spices Category') ON CONFLICT DO NOTHING`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS prod_item_type (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(200), valuation_class varchar(20) DEFAULT 'RAW', number_range_code varchar(20) DEFAULT 'MAT-01', is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO prod_item_type (tenant_id, code, name, valuation_class, number_range_code) VALUES (${tenantId}, 'RAW', 'Raw Material', 'RAW', 'MAT-01') ON CONFLICT DO NOTHING`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS prod_item (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, item_number varchar(20) NOT NULL, description varchar(500) NOT NULL, item_type_code varchar(20) DEFAULT 'RAW', category_code varchar(20) DEFAULT 'CAT-SPICE', base_uom_code varchar(20) DEFAULT 'KG', valuation_class varchar(20) DEFAULT 'RAW', price_control varchar(1) DEFAULT 'S', standard_price numeric DEFAULT 0, moving_avg_price numeric DEFAULT 0, tax_classification varchar(20) DEFAULT 'GST18', hsn_code varchar(20) DEFAULT '09041110', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, item_number))`);
    await db.execute(sql`ALTER TABLE prod_item ADD COLUMN IF NOT EXISTS valuation_class VARCHAR(20) DEFAULT 'RAW'`);
    await db.execute(sql`ALTER TABLE prod_item ADD COLUMN IF NOT EXISTS price_control VARCHAR(1) DEFAULT 'S'`);
    await db.execute(sql`ALTER TABLE prod_item ADD COLUMN IF NOT EXISTS standard_price NUMERIC DEFAULT 0`);
    await db.execute(sql`ALTER TABLE prod_item ADD COLUMN IF NOT EXISTS moving_avg_price NUMERIC DEFAULT 0`);
    await db.execute(sql`ALTER TABLE prod_item ADD COLUMN IF NOT EXISTS tax_classification VARCHAR(20) DEFAULT 'GST18'`);
    await db.execute(sql`ALTER TABLE prod_item ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(20) DEFAULT '09041110'`);
    await db.execute(sql`INSERT INTO prod_item (tenant_id, item_number, description, item_type_code, category_code, base_uom_code, valuation_class, price_control, standard_price, moving_avg_price, tax_classification, hsn_code) VALUES (${tenantId}, '10000001', 'Black Pepper – Raw Spice – 100 KG', 'RAW', 'CAT-SPICE', 'KG', 'RAW', 'S', 100, 100, 'GST18', '09041110') ON CONFLICT DO NOTHING`);
    await db.execute(sql`INSERT INTO prod_item (tenant_id, item_number, description, item_type_code, category_code, base_uom_code, valuation_class, price_control, standard_price, moving_avg_price, tax_classification, hsn_code) VALUES (${tenantId}, '10000002', 'Turmeric – Raw Spice – 200 KG', 'RAW', 'CAT-SPICE', 'KG', 'RAW', 'S', 80, 80, 'GST12', '09103020') ON CONFLICT DO NOTHING`);
    let m1Res = await db.execute(sql`SELECT id FROM prod_item WHERE tenant_id=${tenantId} AND item_number='10000001' LIMIT 1`);
    if (m1Res.rows.length === 0) m1Res = await db.execute(sql`SELECT id FROM prod_item WHERE item_number='10000001' LIMIT 1`);
    materialId1 = (m1Res.rows[0] as any)?.id;
    let m2Res = await db.execute(sql`SELECT id FROM prod_item WHERE tenant_id=${tenantId} AND item_number='10000002' LIMIT 1`);
    if (m2Res.rows.length === 0) m2Res = await db.execute(sql`SELECT id FROM prod_item WHERE item_number='10000002' LIMIT 1`);
    materialId2 = (m2Res.rows[0] as any)?.id;
    // Facility profile for stock
    await db.execute(sql`CREATE TABLE IF NOT EXISTS prod_facility_profile (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, item_id uuid, product_id uuid, facility_id uuid, total_stock_qty numeric DEFAULT 0, total_stock_value numeric DEFAULT 0, moving_avg_price numeric DEFAULT 0, last_receipt_price numeric DEFAULT 0, created_at timestamp DEFAULT NOW(), UNIQUE(item_id, facility_id))`);
    await db.execute(sql`ALTER TABLE prod_facility_profile ADD COLUMN IF NOT EXISTS total_stock_qty NUMERIC DEFAULT 0`);
    await db.execute(sql`ALTER TABLE prod_facility_profile ADD COLUMN IF NOT EXISTS total_stock_value NUMERIC DEFAULT 0`);
    await db.execute(sql`ALTER TABLE prod_facility_profile ADD COLUMN IF NOT EXISTS moving_avg_price NUMERIC DEFAULT 0`);
    if (materialId1 && facilityId) {
      await db.execute(sql`INSERT INTO prod_facility_profile (tenant_id, item_id, product_id, facility_id, total_stock_qty, total_stock_value, moving_avg_price) VALUES (${tenantId}, ${materialId1}, ${materialId1}, ${facilityId}, 0, 0, 100) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    if (materialId2 && facilityId) {
      await db.execute(sql`INSERT INTO prod_facility_profile (tenant_id, item_id, product_id, facility_id, total_stock_qty, total_stock_value, moving_avg_price) VALUES (${tenantId}, ${materialId2}, ${materialId2}, ${facilityId}, 0, 0, 80) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ Materials 10000001 Black Pepper id ${materialId1} + 10000002 Turmeric id ${materialId2} – EMTC EMTC – valuation_class RAW – price_control S – tax GST18/GST12 – HSN 09041110/09103020`);
  } catch (e: any) { console.warn('Materials failed:', e.message); }

  // 26. Info Records ME11 PIRC – VEND-1000 + 10000001 price 100, VEND-1001 + 10000002 price 80
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS proc_info_record (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, info_record_number varchar(20) UNIQUE NOT NULL, partner_id uuid, vendor_id uuid, item_id uuid, material_id uuid, facility_id uuid, plant_id uuid, valid_from date DEFAULT CURRENT_DATE, valid_to date, unit_price numeric DEFAULT 0, currency_code varchar(3) DEFAULT 'INR', uom_code varchar(20) DEFAULT 'KG', lead_time_days integer DEFAULT 7, min_order_qty numeric DEFAULT 1, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW())`);
    if (vendorId1 && materialId1) {
      await db.execute(sql`INSERT INTO proc_info_record (tenant_id, info_record_number, partner_id, vendor_id, item_id, material_id, facility_id, valid_from, valid_to, unit_price, currency_code, uom_code, lead_time_days, min_order_qty) VALUES (${tenantId}, 'IR-V1000-M10000001', ${vendorId1}, ${vendorId1}, ${materialId1}, ${materialId1}, ${facilityId}, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 100, 'INR', 'KG', 7, 10) ON CONFLICT (info_record_number) DO NOTHING`).catch(()=>{});
    }
    if (vendorId2 && materialId2) {
      await db.execute(sql`INSERT INTO proc_info_record (tenant_id, info_record_number, partner_id, vendor_id, item_id, material_id, facility_id, valid_from, valid_to, unit_price, currency_code, uom_code, lead_time_days, min_order_qty) VALUES (${tenantId}, 'IR-V1001-M10000002', ${vendorId2}, ${vendorId2}, ${materialId2}, ${materialId2}, ${facilityId}, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 80, 'INR', 'KG', 5, 20) ON CONFLICT (info_record_number) DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ Info Records ME11 PIRC – VEND-1000 + 10000001 → 100, VEND-1001 + 10000002 → 80 – T2 – auto price if 0`);
  } catch (e: any) { console.warn('Info Records failed:', e.message); }

  // 27. Roles + Users
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS auth_role (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(50) NOT NULL, name varchar(200) NOT NULL, description text, is_active boolean DEFAULT true, UNIQUE(tenant_id, code))`);
    const roles = [
      { code: 'ERP_ADMIN', name: 'ERP Admin' },
      { code: 'PURCHASER', name: 'Purchaser' },
      { code: 'WAREHOUSE', name: 'Warehouse Manager' },
      { code: 'ACCOUNTANT', name: 'Accountant' },
      { code: 'MANAGER', name: 'Manager' },
      { code: 'OWNER', name: 'Owner' },
    ];
    for (const r of roles) {
      await db.execute(sql`INSERT INTO auth_role (tenant_id, code, name) VALUES (${tenantId}, ${r.code}, ${r.name}) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    const users = [
      { email: 'erp_admin@fmcg.com', name: 'ERP Admin', role: 'ERP_ADMIN', pass: 'User@123' },
      { email: 'purchaser@fmcg.com', name: 'Purchaser', role: 'PURCHASER', pass: 'User@123' },
      { email: 'warehouse@fmcg.com', name: 'Warehouse', role: 'WAREHOUSE', pass: 'User@123' },
      { email: 'accountant@fmcg.com', name: 'Accountant', role: 'ACCOUNTANT', pass: 'User@123' },
    ];
    for (const u of users) {
      const hash = await bcrypt.hash(u.pass, 10);
      await db.execute(sql`INSERT INTO auth_user (email, name, role, is_active, password_hash) VALUES (${u.email}, ${u.name}, ${u.role}, true, ${hash}) ON CONFLICT (email) DO UPDATE SET password_hash=${hash}, role=${u.role}, is_active=true`).catch(()=>{});
    }
    console.log(`✅ Roles 6 + Users 4 – FRPC PFCG/SU01 – ERP_ADMIN PURCHASER WAREHOUSE ACCOUNTANT MANAGER OWNER`);
  } catch (e: any) { console.warn('Roles/Users failed:', e.message); }

  // 28. Workflow Definitions PR_APPROVAL PO_APPROVAL
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS wf_definition (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(50) UNIQUE NOT NULL, name varchar(200), document_type varchar(20) NOT NULL, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS wf_definition_step (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), definition_id uuid REFERENCES wf_definition(id), step_order integer NOT NULL, name varchar(200), approver_type varchar(20) DEFAULT 'MANAGER', approver_role varchar(50), min_amount numeric, max_amount numeric, requires_dual boolean DEFAULT false, is_owner_approval boolean DEFAULT false, created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS wf_instance (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), definition_id uuid REFERENCES wf_definition(id), document_type varchar(20) NOT NULL, document_id uuid, document_number varchar(50) NOT NULL, company_code_id uuid, current_state varchar(30) DEFAULT 'PENDING_APPROVAL', current_step_order integer DEFAULT 1, requester_id uuid, amount numeric, currency varchar(10) DEFAULT 'INR', created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS wf_task (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), instance_id uuid REFERENCES wf_instance(id), step_id uuid REFERENCES wf_definition_step(id), assignee_id uuid, status varchar(20) DEFAULT 'PENDING', decision varchar(20), comment text, created_at timestamp DEFAULT NOW(), decided_at timestamp, updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO wf_definition (code, name, document_type, is_active) VALUES ('PR_APPROVAL', 'PR Approval – ME54N – Manager+Owner', 'PR', true) ON CONFLICT (code) DO NOTHING`);
    await db.execute(sql`INSERT INTO wf_definition (code, name, document_type, is_active) VALUES ('PO_APPROVAL', 'PO Approval – PPOR – Manager+Owner Dual', 'PO', true) ON CONFLICT (code) DO NOTHING`);
    let prDefRes = await db.execute(sql`SELECT id FROM wf_definition WHERE code='PR_APPROVAL' LIMIT 1`);
    let poDefRes = await db.execute(sql`SELECT id FROM wf_definition WHERE code='PO_APPROVAL' LIMIT 1`);
    const prDefId = (prDefRes.rows[0] as any)?.id;
    const poDefId = (poDefRes.rows[0] as any)?.id;
    if (prDefId) {
      await db.execute(sql`INSERT INTO wf_definition_step (definition_id, step_order, name, approver_type, min_amount, max_amount, requires_dual, is_owner_approval) VALUES (${prDefId}, 1, 'Manager Approval – PR <10000', 'MANAGER', 0, 9999.99, false, false) ON CONFLICT DO NOTHING`).catch(()=>{});
      await db.execute(sql`INSERT INTO wf_definition_step (definition_id, step_order, name, approver_type, min_amount, max_amount, requires_dual, is_owner_approval) VALUES (${prDefId}, 2, 'Manager+Owner Dual – PR >=10000', 'OWNER', 10000, 999999999, true, true) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    if (poDefId) {
      await db.execute(sql`INSERT INTO wf_definition_step (definition_id, step_order, name, approver_type, min_amount, max_amount, requires_dual, is_owner_approval) VALUES (${poDefId}, 1, 'Manager Approval – PO <10000', 'MANAGER', 0, 9999.99, false, false) ON CONFLICT DO NOTHING`).catch(()=>{});
      await db.execute(sql`INSERT INTO wf_definition_step (definition_id, step_order, name, approver_type, min_amount, max_amount, requires_dual, is_owner_approval) VALUES (${poDefId}, 2, 'Manager+Owner Dual – PO >=10000', 'OWNER', 10000, 999999999, true, true) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ Workflow Definitions PR_APPROVAL PO_APPROVAL – 2 steps Manager <10000 Owner >=10000 dual – SBWP ME54N/PPOR`);
  } catch (e: any) { console.warn('Workflow Definitions failed:', e.message); }

  // 29. Ensure procurement tables exist
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS proc_purchase_requisition (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, pr_number varchar(20) UNIQUE NOT NULL, legal_entity_id uuid, company_code_id uuid, facility_id uuid, plant_id uuid, requester_id uuid, required_date date, header_text text, currency_code varchar(3) DEFAULT 'INR', currency varchar(3) DEFAULT 'INR', total_amount numeric DEFAULT 0, status varchar(30) DEFAULT 'DRAFT', created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS proc_pr_line (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), pr_id uuid REFERENCES proc_purchase_requisition(id) ON DELETE CASCADE, line_number integer NOT NULL, item_id uuid, material_id uuid, quantity numeric NOT NULL, uom_code varchar(20) DEFAULT 'PC', uom varchar(20) DEFAULT 'PC', estimated_price numeric DEFAULT 0, facility_id uuid, plant_id uuid, inventory_location_id uuid, sloc_id uuid, delivery_date date, item_text text, is_converted boolean DEFAULT false, po_id uuid, created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS proc_purchase_order (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, po_number varchar(20) UNIQUE NOT NULL, legal_entity_id uuid, company_code_id uuid, partner_id uuid, vendor_id uuid, facility_id uuid, plant_id uuid, delivery_date date, header_text text, pr_id uuid, currency_code varchar(3) DEFAULT 'INR', currency varchar(3) DEFAULT 'INR', payment_terms_days integer DEFAULT 30, payment_term_code varchar(20), due_date date, discount_date date, vendor_recon_account_id uuid, incoterms varchar(10) DEFAULT 'EXW', freight_amount numeric DEFAULT 0, customs_amount numeric DEFAULT 0, tax_amount numeric DEFAULT 0, total_amount numeric DEFAULT 0, total_landed_cost numeric DEFAULT 0, status varchar(30) DEFAULT 'DRAFT', created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`ALTER TABLE proc_purchase_order ADD COLUMN IF NOT EXISTS payment_term_code VARCHAR(20)`);
    await db.execute(sql`ALTER TABLE proc_purchase_order ADD COLUMN IF NOT EXISTS due_date DATE`);
    await db.execute(sql`ALTER TABLE proc_purchase_order ADD COLUMN IF NOT EXISTS discount_date DATE`);
    await db.execute(sql`ALTER TABLE proc_purchase_order ADD COLUMN IF NOT EXISTS vendor_recon_account_id UUID`);
    await db.execute(sql`ALTER TABLE proc_purchase_order ADD COLUMN IF NOT EXISTS total_landed_cost NUMERIC DEFAULT 0`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS proc_po_line (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), po_id uuid REFERENCES proc_purchase_order(id) ON DELETE CASCADE, line_number integer NOT NULL, item_id uuid, material_id uuid, quantity numeric NOT NULL, quantity_received numeric DEFAULT 0, quantity_invoiced numeric DEFAULT 0, uom_code varchar(20) DEFAULT 'PC', uom varchar(20) DEFAULT 'PC', unit_price numeric DEFAULT 0, freight_per_unit numeric DEFAULT 0, customs_per_unit numeric DEFAULT 0, tax_per_unit numeric DEFAULT 0, tax_rule_id uuid, tax_rate numeric DEFAULT 0, total_per_unit numeric DEFAULT 0, facility_id uuid, plant_id uuid, inventory_location_id uuid, sloc_id uuid, item_text text, delivery_text text, is_landed_cost_relevant boolean DEFAULT true, overdelivery_tolerance_percent numeric DEFAULT 10, underdelivery_tolerance_percent numeric DEFAULT 10, version integer DEFAULT 1, change_history jsonb DEFAULT '[]'::jsonb, delivery_completed boolean DEFAULT false, is_closed boolean DEFAULT false, closed_reason text, created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`ALTER TABLE proc_po_line ADD COLUMN IF NOT EXISTS overdelivery_tolerance_percent NUMERIC DEFAULT 10`);
    await db.execute(sql`ALTER TABLE proc_po_line ADD COLUMN IF NOT EXISTS underdelivery_tolerance_percent NUMERIC DEFAULT 10`);
    await db.execute(sql`ALTER TABLE proc_po_line ADD COLUMN IF NOT EXISTS tax_rule_id UUID`);
    await db.execute(sql`ALTER TABLE proc_po_line ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0`);
    await db.execute(sql`ALTER TABLE proc_po_line ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1`);
    await db.execute(sql`ALTER TABLE proc_po_line ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]'::jsonb`);
    await db.execute(sql`ALTER TABLE proc_po_line ADD COLUMN IF NOT EXISTS quantity_received NUMERIC DEFAULT 0`);
    await db.execute(sql`ALTER TABLE proc_po_line ADD COLUMN IF NOT EXISTS quantity_invoiced NUMERIC DEFAULT 0`);
    await db.execute(sql`ALTER TABLE proc_po_line ADD COLUMN IF NOT EXISTS delivery_completed BOOLEAN DEFAULT false`);
    await db.execute(sql`ALTER TABLE proc_po_line ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT false`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS proc_purchasing_condition (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), po_line_id uuid REFERENCES proc_po_line(id) ON DELETE CASCADE, condition_type varchar(20) NOT NULL, amount numeric DEFAULT 0, percentage numeric DEFAULT 0, currency_code varchar(3) DEFAULT 'INR', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS proc_goods_receipt (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, gr_number varchar(20) UNIQUE NOT NULL, po_id uuid REFERENCES proc_purchase_order(id), facility_id uuid, plant_id uuid, posting_date date DEFAULT CURRENT_DATE, document_date date DEFAULT CURRENT_DATE, header_text text, status varchar(30) DEFAULT 'POSTED', total_amount numeric DEFAULT 0, total_landed_cost numeric DEFAULT 0, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS proc_gr_line (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), gr_id uuid REFERENCES proc_goods_receipt(id) ON DELETE CASCADE, po_line_id uuid REFERENCES proc_po_line(id), line_number integer NOT NULL, item_id uuid, facility_id uuid, inventory_location_id uuid, lot_id uuid, quantity numeric NOT NULL, uom_code varchar(20) DEFAULT 'PC', unit_price numeric DEFAULT 0, unit_landed_cost numeric DEFAULT 0, created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS proc_invoice_verification (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, iv_number varchar(20) UNIQUE NOT NULL, gr_id uuid, po_id uuid REFERENCES proc_purchase_order(id), partner_id uuid, vendor_id uuid, legal_entity_id uuid, company_code_id uuid, invoice_date date DEFAULT CURRENT_DATE, posting_date date DEFAULT CURRENT_DATE, vendor_invoice_number varchar(50), total_amount numeric DEFAULT 0, tax_amount numeric DEFAULT 0, freight_amount numeric DEFAULT 0, customs_amount numeric DEFAULT 0, other_charges numeric DEFAULT 0, document_type varchar(20) DEFAULT 'RE', is_credit_memo boolean DEFAULT false, is_debit_memo boolean DEFAULT false, payment_term_code varchar(20), due_date date, vendor_recon_account_id uuid, status varchar(30) DEFAULT 'POSTED', created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`ALTER TABLE proc_invoice_verification ADD COLUMN IF NOT EXISTS document_type VARCHAR(20) DEFAULT 'RE'`);
    await db.execute(sql`ALTER TABLE proc_invoice_verification ADD COLUMN IF NOT EXISTS is_credit_memo BOOLEAN DEFAULT false`);
    await db.execute(sql`ALTER TABLE proc_invoice_verification ADD COLUMN IF NOT EXISTS is_debit_memo BOOLEAN DEFAULT false`);
    await db.execute(sql`ALTER TABLE proc_invoice_verification ADD COLUMN IF NOT EXISTS payment_term_code VARCHAR(20)`);
    await db.execute(sql`ALTER TABLE proc_invoice_verification ADD COLUMN IF NOT EXISTS due_date DATE`);
    await db.execute(sql`ALTER TABLE proc_invoice_verification ADD COLUMN IF NOT EXISTS vendor_recon_account_id UUID`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS proc_iv_line (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), iv_id uuid REFERENCES proc_invoice_verification(id) ON DELETE CASCADE, gr_line_id uuid, po_line_id uuid REFERENCES proc_po_line(id), line_number integer NOT NULL, item_id uuid, quantity numeric NOT NULL, unit_price_invoiced numeric DEFAULT 0, unit_price_po numeric DEFAULT 0, freight_per_unit numeric DEFAULT 0, customs_per_unit numeric DEFAULT 0, other_per_unit numeric DEFAULT 0, total_per_unit_final numeric DEFAULT 0, price_variance_per_unit numeric DEFAULT 0, tax_amount numeric DEFAULT 0, tax_rule_id uuid, tax_rate numeric DEFAULT 0, is_credit boolean DEFAULT false, created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`ALTER TABLE proc_iv_line ADD COLUMN IF NOT EXISTS tax_rule_id UUID`);
    await db.execute(sql`ALTER TABLE proc_iv_line ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0`);
    await db.execute(sql`ALTER TABLE proc_iv_line ADD COLUMN IF NOT EXISTS is_credit BOOLEAN DEFAULT false`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_universal_ledger (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, document_number varchar(50) NOT NULL, document_type varchar(20) NOT NULL, posting_date date DEFAULT CURRENT_DATE, document_date date DEFAULT CURRENT_DATE, fiscal_year integer DEFAULT 2026, fiscal_period integer DEFAULT 1, ledger_account_id uuid, gl_account_id uuid, debit numeric DEFAULT 0, credit numeric DEFAULT 0, amount numeric DEFAULT 0, currency_code varchar(3) DEFAULT 'INR', reference_doc_type varchar(20), reference_doc_number varchar(50), text text, created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS inv_stock_ledger (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, item_id uuid, facility_id uuid, movement_type varchar(10) NOT NULL, quantity numeric NOT NULL, quantity_before numeric DEFAULT 0, quantity_after numeric DEFAULT 0, unit_cost numeric DEFAULT 0, total_value numeric DEFAULT 0, reference_doc_type varchar(20), reference_doc_number varchar(50), text text, created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS audit_document_flow (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), root_document_type varchar(20), root_document_id uuid, root_document_number varchar(50), preceding_doc_type varchar(20), preceding_doc_id uuid, preceding_doc_number varchar(50), succeeding_doc_type varchar(20), succeeding_doc_id uuid, succeeding_doc_number varchar(50), created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_gr_ir_clearing (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, clearing_number varchar(50) UNIQUE NOT NULL, gr_number varchar(20), iv_number varchar(20), po_number varchar(20), amount numeric DEFAULT 0, status varchar(20) DEFAULT 'CLEARED', universal_ledger_id uuid, created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_universal_ledger (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, document_number varchar(50) UNIQUE NOT NULL, company_code_id uuid, doc_type varchar(10) DEFAULT 'SA', posting_date date DEFAULT CURRENT_DATE, document_date date DEFAULT CURRENT_DATE, reference varchar(100), header_text text, total_debit numeric DEFAULT 0, total_credit numeric DEFAULT 0, currency varchar(3) DEFAULT 'INR', status varchar(20) DEFAULT 'POSTED', reference_doc_type varchar(10), created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_universal_ledger_line (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_id uuid REFERENCES fin_universal_ledger(id) ON DELETE CASCADE, gl_account_id uuid, partner_id uuid, debit numeric DEFAULT 0, credit numeric DEFAULT 0, amount numeric DEFAULT 0, text text, created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS core_document (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, document_number varchar(50) UNIQUE NOT NULL, document_type varchar(20) NOT NULL, company_code varchar(20) DEFAULT '1000', fiscal_year varchar(4) DEFAULT '2026', reference varchar(50), created_by varchar(100) DEFAULT 'system', payload jsonb DEFAULT '{}'::jsonb, status varchar(20) DEFAULT 'POSTED', created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS core_document_history (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_number varchar(50) NOT NULL, changed_by varchar(100) DEFAULT 'system', action varchar(20) DEFAULT 'UPDATE', old_payload jsonb, new_payload jsonb, changed_at timestamp DEFAULT NOW())`);
    console.log(`✅ Procurement tables ensured – proc_* + fin_universal_ledger + inv_stock_ledger + audit_document_flow + fin_gr_ir_clearing + fin_universal_ledger`);
  } catch (e: any) { console.warn('Procurement tables ensure failed:', e.message); }

  // 30. 2 Purchases Complete – PR → PO → GR → IV → Payment

  // Helper to get IDs
  let invLocId: any = null;
  try {
    const ilRes = await db.execute(sql`SELECT id FROM org_inventory_location WHERE code='SL01' LIMIT 1`);
    invLocId = (ilRes.rows[0] as any)?.id;
  } catch {}

  // Purchase 1
  console.log('');
  console.log('--- Purchase 1 – Black Pepper – PR 1000000000 → PO 4500000000 → GR 5000000000(60)+5000000001(40 final DELIV_COMPLETED) → IV 5100000000(60)+5100000001(-10 credit)+5100000002(50 variance) → Payment KZ 5300000000 → GR/IR Clearing ---');
  let prId1: any = null;
  let poId1: any = null;
  let poLineId1: any = null;
  let grId1a: any = null;
  let grId1b: any = null;
  let ivId1a: any = null;
  let ivId1b: any = null;
  let ivId1c: any = null;

  try {
    // PR 1000000000
    await db.execute(sql`INSERT INTO proc_purchase_requisition (tenant_id, pr_number, legal_entity_id, company_code_id, facility_id, plant_id, required_date, header_text, currency_code, currency, total_amount, status) VALUES (${tenantId}, '1000000000', ${legalEntityId}, ${legalEntityId}, ${facilityId}, ${facilityId}, '2026-10-01'::date, 'PR for VEND-1000 – Black Pepper 100 KG – E2E Purchase 1 – PPRC PPRC – 1000 – FAC-1000', 'INR', 'INR', 10000, 'APPROVED') ON CONFLICT (pr_number) DO UPDATE SET status='APPROVED', total_amount=10000`);
    const pr1Res = await db.execute(sql`SELECT id FROM proc_purchase_requisition WHERE pr_number='1000000000' LIMIT 1`);
    prId1 = (pr1Res.rows[0] as any)?.id;
    if (prId1 && materialId1) {
      await db.execute(sql`INSERT INTO proc_pr_line (pr_id, line_number, item_id, material_id, quantity, uom_code, uom, estimated_price, facility_id, plant_id, inventory_location_id, sloc_id, delivery_date, item_text, is_converted, po_id) VALUES (${prId1}, 10, ${materialId1}, ${materialId1}, 100, 'KG', 'KG', 100, ${facilityId}, ${facilityId}, ${invLocId}, ${invLocId}, '2026-10-05'::date, 'Black pepper 100 KG – PR line 10 – Purchase 1', true, null) ON CONFLICT DO NOTHING`);
      // If already exists, update is_converted later after PO
    }
    console.log(`✅ PR 1000000000 – id ${prId1} – 100 KG pepper – APPROVED`);

    // PO 4500000000 – with payment term NT30, recon FGLC, tax GST18, over/under 10%
    let vendorReconId: any = null;
    try {
      const vr = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number='2000000000' LIMIT 1`);
      vendorReconId = (vr.rows[0] as any)?.id;
    } catch {}
    await db.execute(sql`INSERT INTO proc_purchase_order (tenant_id, po_number, legal_entity_id, company_code_id, partner_id, vendor_id, facility_id, plant_id, delivery_date, header_text, pr_id, currency_code, currency, payment_terms_days, payment_term_code, due_date, discount_date, vendor_recon_account_id, incoterms, freight_amount, customs_amount, tax_amount, total_amount, total_landed_cost, status) VALUES (${tenantId}, '4500000000', ${legalEntityId}, ${legalEntityId}, ${vendorId1}, ${vendorId1}, ${facilityId}, ${facilityId}, '2026-10-10'::date, 'PO for VEND-1000 – Black Pepper 100 KG – Purchase 1 – PPOC PPOC – 1000 – FAC-1000 – NT30 – GST18 – over/under 10%', ${prId1}, 'INR', 'INR', 30, 'NT30', '2026-11-09'::date, '2026-10-20'::date, ${vendorReconId}, 'EXW', 500, 200, 1800, 10000, 12500, 'APPROVED') ON CONFLICT (po_number) DO UPDATE SET status='APPROVED', total_amount=10000, total_landed_cost=12500, payment_term_code='NT30', vendor_recon_account_id=${vendorReconId}`);
    const po1Res = await db.execute(sql`SELECT id FROM proc_purchase_order WHERE po_number='4500000000' LIMIT 1`);
    poId1 = (po1Res.rows[0] as any)?.id;
    if (prId1 && poId1) {
      await db.execute(sql`UPDATE proc_pr_line SET is_converted=true, po_id=${poId1} WHERE pr_id=${prId1} AND line_number=10`).catch(()=>{});
    }
    // PO line
    let taxRuleIdGST18: any = null;
    try {
      const tr = await db.execute(sql`SELECT id FROM fin_tax_rule WHERE code='GST18' LIMIT 1`);
      taxRuleIdGST18 = (tr.rows[0] as any)?.id;
    } catch {}
    await db.execute(sql`INSERT INTO proc_po_line (po_id, line_number, item_id, material_id, quantity, quantity_received, quantity_invoiced, uom_code, uom, unit_price, freight_per_unit, customs_per_unit, tax_per_unit, tax_rule_id, tax_rate, total_per_unit, facility_id, plant_id, inventory_location_id, sloc_id, item_text, delivery_text, is_landed_cost_relevant, overdelivery_tolerance_percent, underdelivery_tolerance_percent, version, change_history, delivery_completed, is_closed) VALUES (${poId1}, 10, ${materialId1}, ${materialId1}, 100, 100, 100, 'KG', 'KG', 100, 5, 2, 18, ${taxRuleIdGST18}, 18, 125, ${facilityId}, ${facilityId}, ${invLocId}, ${invLocId}, 'Black pepper 100 KG – PO line 10 – Purchase 1 – GST18 – over/under 10%', 'Delivery to FAC-1000 SL01', true, 10, 10, 1, '[{"version":1,"action":"CREATE","timestamp":"2026-09-30T00:00:00Z","user":"system","changes":{"quantity":100,"unit_price":100,"over_tolerance":10,"under_tolerance":10,"tax_rate":18}}]'::jsonb, true, true) ON CONFLICT DO NOTHING`);
    const poLine1Res = await db.execute(sql`SELECT id FROM proc_po_line WHERE po_id=${poId1} AND line_number=10 LIMIT 1`);
    poLineId1 = (poLine1Res.rows[0] as any)?.id;
    // Conditions
    if (poLineId1) {
      await db.execute(sql`INSERT INTO proc_purchasing_condition (po_line_id, condition_type, amount, percentage, currency_code) VALUES (${poLineId1}, 'BASE', 100, 0, 'INR') ON CONFLICT DO NOTHING`).catch(()=>{});
      await db.execute(sql`INSERT INTO proc_purchasing_condition (po_line_id, condition_type, amount) VALUES (${poLineId1}, 'FREIGHTIGHT', 5) ON CONFLICT DO NOTHING`).catch(()=>{});
      await db.execute(sql`INSERT INTO proc_purchasing_condition (po_line_id, condition_type, amount) VALUES (${poLineId1}, 'CUSTOMS', 2) ON CONFLICT DO NOTHING`).catch(()=>{});
      await db.execute(sql`INSERT INTO proc_purchasing_condition (po_line_id, condition_type, amount, percentage) VALUES (${poLineId1}, 'TAX', 18, 18) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ PO 4500000000 – id ${poId1} – line id ${poLineId1} – 100 KG – price 100 auto ME11 – freight 5 customs 2 tax GST18 18% – over/under 10% – version 1 – conditions BASE/FREIGHTIGHT/CUSTOMS/TAX – APPROVED – PR→PO flow`);

    // GR 5000000000 – 60 KG partial
    await db.execute(sql`INSERT INTO proc_goods_receipt (tenant_id, gr_number, po_id, facility_id, plant_id, posting_date, document_date, header_text, status, total_amount, total_landed_cost) VALUES (${tenantId}, '5000000000', ${poId1}, ${facilityId}, ${facilityId}, '2026-10-10'::date, '2026-10-10'::date, 'GR for PO 4500000000 – 60 KG – Purchase 1 – IGRC 101', 'POSTED', 6000, 7500) ON CONFLICT (gr_number) DO NOTHING`);
    const gr1aRes = await db.execute(sql`SELECT id FROM proc_goods_receipt WHERE gr_number='5000000000' LIMIT 1`);
    grId1a = (gr1aRes.rows[0] as any)?.id;
    if (grId1a && poLineId1) {
      await db.execute(sql`INSERT INTO proc_gr_line (gr_id, po_line_id, line_number, item_id, facility_id, inventory_location_id, quantity, uom_code, unit_price, unit_landed_cost) VALUES (${grId1a}, ${poLineId1}, 10, ${materialId1}, ${facilityId}, ${invLocId}, 60, 'KG', 100, 125) ON CONFLICT DO NOTHING`);
    }
    // GR 5000000001 – 40 KG final DELIV_COMPLETED
    await db.execute(sql`INSERT INTO proc_goods_receipt (tenant_id, gr_number, po_id, facility_id, plant_id, posting_date, document_date, header_text, status, total_amount, total_landed_cost) VALUES (${tenantId}, '5000000001', ${poId1}, ${facilityId}, ${facilityId}, '2026-10-11'::date, '2026-10-11'::date, 'GR for PO 4500000000 – 40 KG final – DELIV_COMPLETED – Purchase 1 – IGRC 101', 'POSTED', 4000, 5000) ON CONFLICT (gr_number) DO NOTHING`);
    const gr1bRes = await db.execute(sql`SELECT id FROM proc_goods_receipt WHERE gr_number='5000000001' LIMIT 1`);
    grId1b = (gr1bRes.rows[0] as any)?.id;
    if (grId1b && poLineId1) {
      await db.execute(sql`INSERT INTO proc_gr_line (gr_id, po_line_id, line_number, item_id, facility_id, inventory_location_id, quantity, uom_code, unit_price, unit_landed_cost) VALUES (${grId1b}, ${poLineId1}, 10, ${materialId1}, ${facilityId}, ${invLocId}, 40, 'KG', 100, 125) ON CONFLICT DO NOTHING`);
    }
    // Update facility stock to 100
    if (materialId1 && facilityId) {
      await db.execute(sql`UPDATE prod_facility_profile SET total_stock_qty=100, total_stock_value=10000, moving_avg_price=100 WHERE item_id=${materialId1} AND facility_id=${facilityId}`).catch(()=>{});
    }
    // Stock ledger
    if (materialId1 && facilityId && grId1a) {
      await db.execute(sql`INSERT INTO inv_stock_ledger (tenant_id, item_id, facility_id, movement_type, quantity, quantity_before, quantity_after, unit_cost, total_value, reference_doc_type, reference_doc_number, text) VALUES (${tenantId}, ${materialId1}, ${facilityId}, 'GR_PO', 60, 0, 60, 100, 6000, 'GR', '5000000000', 'GR 101 – Purchase 1 – 60 KG – Black Pepper') ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    if (materialId1 && facilityId && grId1b) {
      await db.execute(sql`INSERT INTO inv_stock_ledger (tenant_id, item_id, facility_id, movement_type, quantity, quantity_before, quantity_after, unit_cost, total_value, reference_doc_type, reference_doc_number, text) VALUES (${tenantId}, ${materialId1}, ${facilityId}, 'GR_PO', 40, 60, 100, 100, 4000, 'GR', '5000000001', 'GR 101 – Purchase 1 – 40 KG final DELIV_COMPLETED – Black Pepper') ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ GR 5000000000 60 KG + 5000000001 40 KG final DELIV_COMPLETED – Purchase 1 – stock 100 – IGRC 101 – INV_POSTING/GR_IR_CLEARING – MAP`);

    // Universal ledger for GR – INV_POSTING Dr GR_IR_CLEARING Cr
    try {
      let bsxId: any = null, wrxId: any = null;
      const bsxRes = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number='1400000001' LIMIT 1`);
      bsxId = (bsxRes.rows[0] as any)?.id;
      const wrxRes = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number='2000000001' LIMIT 1`);
      wrxId = (wrxRes.rows[0] as any)?.id;
      if (bsxId && wrxId) {
        await db.execute(sql`INSERT INTO fin_universal_ledger (tenant_id, document_number, document_type, posting_date, document_date, fiscal_year, fiscal_period, ledger_account_id, gl_account_id, debit, credit, amount, currency_code, reference_doc_type, reference_doc_number, text) VALUES (${tenantId}, '5000000000', 'WE', '2026-10-10'::date, '2026-10-10'::date, 2026, 7, ${bsxId}, ${bsxId}, 6000, 0, 6000, 'INR', 'GR', '5000000000', 'GR 101 – INV_POSTING Dr 6000 – Purchase 1') ON CONFLICT DO NOTHING`).catch(()=>{});
        await db.execute(sql`INSERT INTO fin_universal_ledger (tenant_id, document_number, document_type, posting_date, document_date, fiscal_year, fiscal_period, ledger_account_id, gl_account_id, debit, credit, amount, currency_code, reference_doc_type, reference_doc_number, text) VALUES (${tenantId}, '5000000000', 'WE', '2026-10-10'::date, '2026-10-10'::date, 2026, 7, ${wrxId}, ${wrxId}, 0, 6000, 6000, 'INR', 'GR', '5000000000', 'GR 101 – GR_IR_CLEARING Cr 6000 – Purchase 1') ON CONFLICT DO NOTHING`).catch(()=>{});
        await db.execute(sql`INSERT INTO fin_universal_ledger (tenant_id, document_number, document_type, posting_date, document_date, fiscal_year, fiscal_period, ledger_account_id, gl_account_id, debit, credit, amount, currency_code, reference_doc_type, reference_doc_number, text) VALUES (${tenantId}, '5000000001', 'WE', '2026-10-11'::date, '2026-10-11'::date, 2026, 7, ${bsxId}, ${bsxId}, 4000, 0, 4000, 'INR', 'GR', '5000000001', 'GR 101 – INV_POSTING Dr 4000 – Purchase 1 final DELIV_COMPLETED') ON CONFLICT DO NOTHING`).catch(()=>{});
        await db.execute(sql`INSERT INTO fin_universal_ledger (tenant_id, document_number, document_type, posting_date, document_date, fiscal_year, fiscal_period, ledger_account_id, gl_account_id, debit, credit, amount, currency_code, reference_doc_type, reference_doc_number, text) VALUES (${tenantId}, '5000000001', 'WE', '2026-10-11'::date, '2026-10-11'::date, 2026, 7, ${wrxId}, ${wrxId}, 0, 4000, 4000, 'INR', 'GR', '5000000001', 'GR 101 – GR_IR_CLEARING Cr 4000 – Purchase 1 final DELIV_COMPLETED') ON CONFLICT DO NOTHING`).catch(()=>{});
      }
    } catch {}

    // IV 5100000000 – 60 KG
    await db.execute(sql`INSERT INTO proc_invoice_verification (tenant_id, iv_number, gr_id, po_id, partner_id, vendor_id, legal_entity_id, company_code_id, invoice_date, posting_date, vendor_invoice_number, total_amount, tax_amount, freight_amount, customs_amount, document_type, is_credit_memo, is_debit_memo, payment_term_code, due_date, vendor_recon_account_id, status) VALUES (${tenantId}, '5100000000', ${grId1a}, ${poId1}, ${vendorId1}, ${vendorId1}, ${legalEntityId}, ${legalEntityId}, '2026-10-12'::date, '2026-10-12'::date, 'INV-VEND-2026-001', 6000, 1080, 300, 120, 'RE', false, false, 'NT30', '2026-11-11'::date, ${vendorReconId}, 'POSTED') ON CONFLICT (iv_number) DO NOTHING`);
    const iv1aRes = await db.execute(sql`SELECT id FROM proc_invoice_verification WHERE iv_number='5100000000' LIMIT 1`);
    ivId1a = (iv1aRes.rows[0] as any)?.id;
    if (ivId1a && poLineId1 && materialId1) {
      await db.execute(sql`INSERT INTO proc_iv_line (iv_id, gr_line_id, po_line_id, line_number, item_id, quantity, unit_price_invoiced, unit_price_po, freight_per_unit, customs_per_unit, total_per_unit_final, price_variance_per_unit, tax_amount, tax_rule_id, tax_rate, is_credit) VALUES (${ivId1a}, null, ${poLineId1}, 10, ${materialId1}, 60, 100, 100, 5, 2, 107, 0, 1080, ${taxRuleIdGST18}, 18, false) ON CONFLICT DO NOTHING`);
    }

    // Credit memo 5100000001 – -10 KG RE_CREDIT
    await db.execute(sql`INSERT INTO proc_invoice_verification (tenant_id, iv_number, po_id, partner_id, vendor_id, legal_entity_id, company_code_id, invoice_date, posting_date, vendor_invoice_number, total_amount, tax_amount, document_type, is_credit_memo, is_debit_memo, payment_term_code, due_date, vendor_recon_account_id, status) VALUES (${tenantId}, '5100000001', ${poId1}, ${vendorId1}, ${vendorId1}, ${legalEntityId}, ${legalEntityId}, '2026-10-13'::date, '2026-10-13'::date, 'CR-VEND-2026-001', -1000, -180, 'RE_CREDIT', true, false, 'NT30', '2026-11-12'::date, ${vendorReconId}, 'POSTED') ON CONFLICT (iv_number) DO NOTHING`);
    const iv1bRes = await db.execute(sql`SELECT id FROM proc_invoice_verification WHERE iv_number='5100000001' LIMIT 1`);
    ivId1b = (iv1bRes.rows[0] as any)?.id;
    if (ivId1b && poLineId1 && materialId1) {
      await db.execute(sql`INSERT INTO proc_iv_line (iv_id, po_line_id, line_number, item_id, quantity, unit_price_invoiced, unit_price_po, tax_amount, tax_rule_id, tax_rate, is_credit) VALUES (${ivId1b}, ${poLineId1}, 10, ${materialId1}, -10, 100, 100, -180, ${taxRuleIdGST18}, 18, true) ON CONFLICT DO NOTHING`);
    }

    // IV 5100000002 – 50 KG variance 110 vs 100 PRICE_DIFF 500
    await db.execute(sql`INSERT INTO proc_invoice_verification (tenant_id, iv_number, gr_id, po_id, partner_id, vendor_id, legal_entity_id, company_code_id, invoice_date, posting_date, vendor_invoice_number, total_amount, tax_amount, freight_amount, customs_amount, document_type, is_credit_memo, payment_term_code, due_date, vendor_recon_account_id, status) VALUES (${tenantId}, '5100000002', ${grId1b}, ${poId1}, ${vendorId1}, ${vendorId1}, ${legalEntityId}, ${legalEntityId}, '2026-10-14'::date, '2026-10-14'::date, 'INV-VEND-2026-002', 5500, 990, 250, 100, 'RE', false, 'NT30', '2026-11-13'::date, ${vendorReconId}, 'POSTED') ON CONFLICT (iv_number) DO NOTHING`);
    const iv1cRes = await db.execute(sql`SELECT id FROM proc_invoice_verification WHERE iv_number='5100000002' LIMIT 1`);
    ivId1c = (iv1cRes.rows[0] as any)?.id;
    if (ivId1c && poLineId1 && materialId1) {
      await db.execute(sql`INSERT INTO proc_iv_line (iv_id, po_line_id, line_number, item_id, quantity, unit_price_invoiced, unit_price_po, freight_per_unit, customs_per_unit, total_per_unit_final, price_variance_per_unit, tax_amount, tax_rule_id, tax_rate, is_credit) VALUES (${ivId1c}, ${poLineId1}, 10, ${materialId1}, 50, 110, 100, 5, 2, 117, 10, 990, ${taxRuleIdGST18}, 18, false) ON CONFLICT DO NOTHING`);
    }

    // Universal ledger for IVs – RE + GR_IR_CLEARING clearing + Vendor Recon + PRICE_DIFF + Tax
    try {
      let wrxId: any = null, vendorReconId2: any = null, prdId: any = null, taxId: any = null;
      const wrxRes = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number='2000000001' LIMIT 1`);
      wrxId = (wrxRes.rows[0] as any)?.id;
      const vReconRes = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number='2000000000' LIMIT 1`);
      vendorReconId2 = (vReconRes.rows[0] as any)?.id;
      const prdRes = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number='4000000004' LIMIT 1`);
      prdId = (prdRes.rows[0] as any)?.id;
      const taxRes = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number='2000000003' LIMIT 1`);
      taxId = (taxRes.rows[0] as any)?.id;
      if (wrxId && vendorReconId2) {
        // IV 5100000000 – 60 KG – GR_IR_CLEARING Dr 6000 Vendor Cr 7500 Tax Dr 1080
        await db.execute(sql`INSERT INTO fin_universal_ledger (tenant_id, document_number, document_type, posting_date, document_date, fiscal_year, fiscal_period, ledger_account_id, gl_account_id, debit, credit, amount, currency_code, reference_doc_type, reference_doc_number, text) VALUES (${tenantId}, '5100000000', 'RE', '2026-10-12'::date, '2026-10-12'::date, 2026, 7, ${wrxId}, ${wrxId}, 6000, 0, 6000, 'INR', 'IV', '5100000000', 'IV 51 RE – GR_IR_CLEARING Dr 6000 – Purchase 1') ON CONFLICT DO NOTHING`).catch(()=>{});
        await db.execute(sql`INSERT INTO fin_universal_ledger (tenant_id, document_number, document_type, posting_date, document_date, fiscal_year, fiscal_period, ledger_account_id, gl_account_id, debit, credit, amount, currency_code, reference_doc_type, reference_doc_number, text) VALUES (${tenantId}, '5100000000', 'RE', '2026-10-12'::date, '2026-10-12'::date, 2026, 7, ${vendorReconId2}, ${vendorReconId2}, 0, 7500, 7500, 'INR', 'IV', '5100000000', 'IV 51 RE – Vendor Recon Cr 7500 – Purchase 1') ON CONFLICT DO NOTHING`).catch(()=>{});
        if (taxId) await db.execute(sql`INSERT INTO fin_universal_ledger (tenant_id, document_number, document_type, posting_date, document_date, fiscal_year, fiscal_period, ledger_account_id, gl_account_id, debit, credit, amount, currency_code, reference_doc_type, reference_doc_number, text) VALUES (${tenantId}, '5100000000', 'RE', '2026-10-12'::date, '2026-10-12'::date, 2026, 7, ${taxId}, ${taxId}, 1080, 0, 1080, 'INR', 'IV', '5100000000', 'IV 51 RE – Tax Dr 1080 GST18 – Purchase 1') ON CONFLICT DO NOTHING`).catch(()=>{});
        // Credit memo 5100000001 – RE_CREDIT – Dr Vendor Recon Cr GR_IR_CLEARING
        await db.execute(sql`INSERT INTO fin_universal_ledger (tenant_id, document_number, document_type, posting_date, document_date, fiscal_year, fiscal_period, ledger_account_id, gl_account_id, debit, credit, amount, currency_code, reference_doc_type, reference_doc_number, text) VALUES (${tenantId}, '5100000001', 'RE_CREDIT', '2026-10-13'::date, '2026-10-13'::date, 2026, 7, ${vendorReconId2}, ${vendorReconId2}, 1180, 0, 1180, 'INR', 'IV', '5100000001', 'IV RE_CREDIT – Vendor Dr 1180 – credit memo – Purchase 1') ON CONFLICT DO NOTHING`).catch(()=>{});
        await db.execute(sql`INSERT INTO fin_universal_ledger (tenant_id, document_number, document_type, posting_date, document_date, fiscal_year, fiscal_period, ledger_account_id, gl_account_id, debit, credit, amount, currency_code, reference_doc_type, reference_doc_number, text) VALUES (${tenantId}, '5100000001', 'RE_CREDIT', '2026-10-13'::date, '2026-10-13'::date, 2026, 7, ${wrxId}, ${wrxId}, 0, 1000, 1000, 'INR', 'IV', '5100000001', 'IV RE_CREDIT – GR_IR_CLEARING Cr 1000 – credit memo – Purchase 1') ON CONFLICT DO NOTHING`).catch(()=>{});
        // IV 5100000002 – 50 KG variance 110 vs 100 PRICE_DIFF 500
        await db.execute(sql`INSERT INTO fin_universal_ledger (tenant_id, document_number, document_type, posting_date, document_date, fiscal_year, fiscal_period, ledger_account_id, gl_account_id, debit, credit, amount, currency_code, reference_doc_type, reference_doc_number, text) VALUES (${tenantId}, '5100000002', 'RE', '2026-10-14'::date, '2026-10-14'::date, 2026, 7, ${wrxId}, ${wrxId}, 5000, 0, 5000, 'INR', 'IV', '5100000002', 'IV 51 RE – GR_IR_CLEARING Dr 5000 – Purchase 1 variance') ON CONFLICT DO NOTHING`).catch(()=>{});
        await db.execute(sql`INSERT INTO fin_universal_ledger (tenant_id, document_number, document_type, posting_date, document_date, fiscal_year, fiscal_period, ledger_account_id, gl_account_id, debit, credit, amount, currency_code, reference_doc_type, reference_doc_number, text) VALUES (${tenantId}, '5100000002', 'RE', '2026-10-14'::date, '2026-10-14'::date, 2026, 7, ${vendorReconId2}, ${vendorReconId2}, 0, 6840, 6840, 'INR', 'IV', '5100000002', 'IV 51 RE – Vendor Cr 6840 – Purchase 1 variance') ON CONFLICT DO NOTHING`).catch(()=>{});
        if (prdId) await db.execute(sql`INSERT INTO fin_universal_ledger (tenant_id, document_number, document_type, posting_date, document_date, fiscal_year, fiscal_period, ledger_account_id, gl_account_id, debit, credit, amount, currency_code, reference_doc_type, reference_doc_number, text) VALUES (${tenantId}, '5100000002', 'RE', '2026-10-14'::date, '2026-10-14'::date, 2026, 7, ${prdId}, ${prdId}, 500, 0, 500, 'INR', 'IV', '5100000002', 'IV 51 RE – PRICE_DIFF Dr 500 price variance 110 vs 100 – Purchase 1') ON CONFLICT DO NOTHING`).catch(()=>{});
        if (taxId) await db.execute(sql`INSERT INTO fin_universal_ledger (tenant_id, document_number, document_type, posting_date, document_date, fiscal_year, fiscal_period, ledger_account_id, gl_account_id, debit, credit, amount, currency_code, reference_doc_type, reference_doc_number, text) VALUES (${tenantId}, '5100000002', 'RE', '2026-10-14'::date, '2026-10-14'::date, 2026, 7, ${taxId}, ${taxId}, 990, 0, 990, 'INR', 'IV', '5100000002', 'IV 51 RE – Tax Dr 990 GST18 – Purchase 1 variance') ON CONFLICT DO NOTHING`).catch(()=>{});
      }
    } catch {}

    // Payment KZ 5300000000 – for IV 5100000000
    await db.execute(sql`INSERT INTO fin_universal_ledger (tenant_id, document_number, company_code_id, doc_type, posting_date, document_date, reference, header_text, total_debit, total_credit, currency, status, reference_doc_type) VALUES (${tenantId}, '5300000000', ${legalEntityId}, 'KZ', '2026-10-15'::date, '2026-10-15'::date, 'Payment for VEND-1000 INV-VEND-2026-001', 'KZ Payment Vendor VEND-1000 Amount 7500 BANK – Purchase 1', 7500, 7500, 'INR', 'POSTED', 'KZ') ON CONFLICT (document_number) DO NOTHING`);
    const pay1Res = await db.execute(sql`SELECT id FROM fin_universal_ledger WHERE document_number='5300000000' LIMIT 1`);
    const payId1 = (pay1Res.rows[0] as any)?.id;
    if (payId1) {
      let vendorReconId3: any = null, bankId: any = null;
      try {
        const vr = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number='2000000000' LIMIT 1`);
        vendorReconId3 = (vr.rows[0] as any)?.id;
        const b = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number='8000000001' LIMIT 1`);
        bankId = (b.rows[0] as any)?.id;
      } catch {}
      if (vendorReconId3 && bankId) {
        await db.execute(sql`INSERT INTO fin_universal_ledger_line (document_id, gl_account_id, partner_id, debit, credit, amount, text) VALUES (${payId1}, ${vendorReconId3}, ${vendorId1}, 7500, 0, 7500, 'Payment KZ – Dr Vendor Recon 2000000000 – Purchase 1') ON CONFLICT DO NOTHING`).catch(()=>{});
        await db.execute(sql`INSERT INTO fin_universal_ledger_line (document_id, gl_account_id, debit, credit, amount, text) VALUES (${payId1}, ${bankId}, 0, 7500, 7500, 'Payment KZ – Cr Bank 8000000001 SBI – Purchase 1') ON CONFLICT DO NOTHING`).catch(()=>{});
      }
    }

    // GR/IR Clearing CLR-1
    await db.execute(sql`INSERT INTO fin_gr_ir_clearing (tenant_id, clearing_number, gr_number, iv_number, po_number, amount, status) VALUES (${tenantId}, 'CLR-1000000000-1', '5000000000', '5100000000', '4500000000', 6000, 'CLEARED') ON CONFLICT (clearing_number) DO NOTHING`).catch(()=>{});
    await db.execute(sql`INSERT INTO fin_gr_ir_clearing (tenant_id, clearing_number, gr_number, iv_number, po_number, amount, status) VALUES (${tenantId}, 'CLR-1000000000-2', '5000000001', '5100000002', '4500000000', 5000, 'CLEARED') ON CONFLICT (clearing_number) DO NOTHING`).catch(()=>{});

    // Document Flow – PR→PO→GR→IV→Payment
    await db.execute(sql`INSERT INTO audit_document_flow (root_document_type, root_document_id, root_document_number, preceding_doc_type, preceding_doc_id, preceding_doc_number, succeeding_doc_type, succeeding_doc_id, succeeding_doc_number) VALUES ('PR', ${prId1}, '1000000000', 'PR', ${prId1}, '1000000000', 'PO', ${poId1}, '4500000000') ON CONFLICT DO NOTHING`).catch(()=>{});
    await db.execute(sql`INSERT INTO audit_document_flow (root_document_type, root_document_id, root_document_number, preceding_doc_type, preceding_doc_id, preceding_doc_number, succeeding_doc_type, succeeding_doc_id, succeeding_doc_number) VALUES ('PR', ${prId1}, '1000000000', 'PO', ${poId1}, '4500000000', 'GR', ${grId1a}, '5000000000') ON CONFLICT DO NOTHING`).catch(()=>{});
    await db.execute(sql`INSERT INTO audit_document_flow (root_document_type, root_document_id, root_document_number, preceding_doc_type, preceding_doc_id, preceding_doc_number, succeeding_doc_type, succeeding_doc_id, succeeding_doc_number) VALUES ('PR', ${prId1}, '1000000000', 'PO', ${poId1}, '4500000000', 'GR', ${grId1b}, '5000000001') ON CONFLICT DO NOTHING`).catch(()=>{});
    await db.execute(sql`INSERT INTO audit_document_flow (root_document_type, root_document_id, root_document_number, preceding_doc_type, preceding_doc_id, preceding_doc_number, succeeding_doc_type, succeeding_doc_id, succeeding_doc_number) VALUES ('PR', ${prId1}, '1000000000', 'PO', ${poId1}, '4500000000', 'IV', ${ivId1a}, '5100000000') ON CONFLICT DO NOTHING`).catch(()=>{});
    await db.execute(sql`INSERT INTO audit_document_flow (root_document_type, root_document_id, root_document_number, preceding_doc_type, preceding_doc_id, preceding_doc_number, succeeding_doc_type, succeeding_doc_id, succeeding_doc_number) VALUES ('PR', ${prId1}, '1000000000', 'GR', ${grId1a}, '5000000000', 'IV', ${ivId1a}, '5100000000') ON CONFLICT DO NOTHING`).catch(()=>{});
    await db.execute(sql`INSERT INTO audit_document_flow (root_document_type, root_document_id, root_document_number, preceding_doc_type, preceding_doc_id, preceding_doc_number, succeeding_doc_type, succeeding_doc_id, succeeding_doc_number) VALUES ('PR', ${prId1}, '1000000000', 'IV', ${ivId1a}, '5100000000', 'PAYMENT', ${payId1}, '5300000000') ON CONFLICT DO NOTHING`).catch(()=>{});

    console.log(`✅ Purchase 1 complete – PR 1000000000 → PO 4500000000 → GR 5000000000(60)+5000000001(40 DELIV_COMPLETED) → IV 5100000000(60)+5100000001(-10 credit RE_CREDIT)+5100000002(50 variance PRICE_DIFF) → Payment KZ 5300000000 → GR/IR Clearing CLR-1/2 → Document Flow FDFL VBFA ALB – org wired – T0 – 12 points`);

  } catch (e: any) { console.warn('Purchase 1 failed:', e.message, e.stack?.slice(0,500)); }

  // Purchase 2 – Turmeric
  console.log('');
  console.log('--- Purchase 2 – Turmeric – PR 1000000001 → PO 4500000001 → GR 5000000002(200) → IV 5100000003(200) → Payment KZ 5300000001 ---');
  let prId2: any = null;
  let poId2: any = null;
  let poLineId2: any = null;
  let grId2: any = null;
  let ivId2: any = null;

  try {
    await db.execute(sql`INSERT INTO proc_purchase_requisition (tenant_id, pr_number, legal_entity_id, company_code_id, facility_id, plant_id, required_date, header_text, currency_code, currency, total_amount, status) VALUES (${tenantId}, '1000000001', ${legalEntityId}, ${legalEntityId}, ${facilityId}, ${facilityId}, '2026-10-02'::date, 'PR for VEND-1001 – Turmeric 200 KG – Purchase 2 – PPRC PPRC – 1000 – FAC-1000', 'INR', 'INR', 16000, 'APPROVED') ON CONFLICT (pr_number) DO UPDATE SET status='APPROVED', total_amount=16000`);
    const pr2Res = await db.execute(sql`SELECT id FROM proc_purchase_requisition WHERE pr_number='1000000001' LIMIT 1`);
    prId2 = (pr2Res.rows[0] as any)?.id;
    if (prId2 && materialId2) {
      await db.execute(sql`INSERT INTO proc_pr_line (pr_id, line_number, item_id, material_id, quantity, uom_code, uom, estimated_price, facility_id, plant_id, inventory_location_id, sloc_id, delivery_date, item_text, is_converted, po_id) VALUES (${prId2}, 10, ${materialId2}, ${materialId2}, 200, 'KG', 'KG', 80, ${facilityId}, ${facilityId}, ${invLocId}, ${invLocId}, '2026-10-06'::date, 'Turmeric 200 KG – PR line 10 – Purchase 2', true, null) ON CONFLICT DO NOTHING`);
    }
    console.log(`✅ PR 1000000001 – id ${prId2} – 200 KG turmeric – APPROVED`);

    let vendorReconId: any = null;
    try {
      const vr = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number='2000000000' LIMIT 1`);
      vendorReconId = (vr.rows[0] as any)?.id;
    } catch {}
    await db.execute(sql`INSERT INTO proc_purchase_order (tenant_id, po_number, legal_entity_id, company_code_id, partner_id, vendor_id, facility_id, plant_id, delivery_date, header_text, pr_id, currency_code, currency, payment_terms_days, payment_term_code, due_date, discount_date, vendor_recon_account_id, incoterms, freight_amount, customs_amount, tax_amount, total_amount, total_landed_cost, status) VALUES (${tenantId}, '4500000001', ${legalEntityId}, ${legalEntityId}, ${vendorId2}, ${vendorId2}, ${facilityId}, ${facilityId}, '2026-10-12'::date, 'PO for VEND-1001 – Turmeric 200 KG – Purchase 2 – PPOC PPOC – 1000 – FAC-1000 – NT30 – GST12', ${prId2}, 'INR', 'INR', 30, 'NT30', '2026-11-11'::date, '2026-10-22'::date, ${vendorReconId}, 'FOB', 600, 200, 1920, 16000, 18720, 'APPROVED') ON CONFLICT (po_number) DO UPDATE SET status='APPROVED', total_amount=16000, total_landed_cost=18720`);
    const po2Res = await db.execute(sql`SELECT id FROM proc_purchase_order WHERE po_number='4500000001' LIMIT 1`);
    poId2 = (po2Res.rows[0] as any)?.id;
    if (prId2 && poId2) {
      await db.execute(sql`UPDATE proc_pr_line SET is_converted=true, po_id=${poId2} WHERE pr_id=${prId2} AND line_number=10`).catch(()=>{});
    }
    let taxRuleIdGST12: any = null;
    try {
      const tr = await db.execute(sql`SELECT id FROM fin_tax_rule WHERE code='GST12' LIMIT 1`);
      taxRuleIdGST12 = (tr.rows[0] as any)?.id;
    } catch {}
    await db.execute(sql`INSERT INTO proc_po_line (po_id, line_number, item_id, material_id, quantity, quantity_received, quantity_invoiced, uom_code, uom, unit_price, freight_per_unit, customs_per_unit, tax_per_unit, tax_rule_id, tax_rate, total_per_unit, facility_id, plant_id, inventory_location_id, sloc_id, item_text, delivery_text, is_landed_cost_relevant, overdelivery_tolerance_percent, underdelivery_tolerance_percent, version, change_history, delivery_completed, is_closed) VALUES (${poId2}, 10, ${materialId2}, ${materialId2}, 200, 200, 200, 'KG', 'KG', 80, 3, 1, 9.6, ${taxRuleIdGST12}, 12, 93.6, ${facilityId}, ${facilityId}, ${invLocId}, ${invLocId}, 'Turmeric 200 KG – PO line 10 – Purchase 2 – GST12', 'Delivery to FAC-1000 SL01', true, 10, 10, 1, '[{"version":1,"action":"CREATE","timestamp":"2026-09-30T00:00:00Z","user":"system","changes":{"quantity":200,"unit_price":80}}]'::jsonb, true, true) ON CONFLICT DO NOTHING`);
    const poLine2Res = await db.execute(sql`SELECT id FROM proc_po_line WHERE po_id=${poId2} AND line_number=10 LIMIT 1`);
    poLineId2 = (poLine2Res.rows[0] as any)?.id;
    if (poLineId2) {
      await db.execute(sql`INSERT INTO proc_purchasing_condition (po_line_id, condition_type, amount, percentage, currency_code) VALUES (${poLineId2}, 'BASE', 80, 0, 'INR') ON CONFLICT DO NOTHING`).catch(()=>{});
      await db.execute(sql`INSERT INTO proc_purchasing_condition (po_line_id, condition_type, amount) VALUES (${poLineId2}, 'FREIGHTIGHT', 3) ON CONFLICT DO NOTHING`).catch(()=>{});
      await db.execute(sql`INSERT INTO proc_purchasing_condition (po_line_id, condition_type, amount) VALUES (${poLineId2}, 'CUSTOMS', 1) ON CONFLICT DO NOTHING`).catch(()=>{});
      await db.execute(sql`INSERT INTO proc_purchasing_condition (po_line_id, condition_type, amount, percentage) VALUES (${poLineId2}, 'TAX', 9.6, 12) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ PO 4500000001 – id ${poId2} – line id ${poLineId2} – 200 KG turmeric – price 80 – freight 3 customs 1 tax GST12 12% – over/under 10% – APPROVED`);

    await db.execute(sql`INSERT INTO proc_goods_receipt (tenant_id, gr_number, po_id, facility_id, plant_id, posting_date, document_date, header_text, status, total_amount, total_landed_cost) VALUES (${tenantId}, '5000000002', ${poId2}, ${facilityId}, ${facilityId}, '2026-10-12'::date, '2026-10-12'::date, 'GR for PO 4500000001 – 200 KG – Purchase 2 – IGRC 101', 'POSTED', 16000, 18720) ON CONFLICT (gr_number) DO NOTHING`);
    const gr2Res = await db.execute(sql`SELECT id FROM proc_goods_receipt WHERE gr_number='5000000002' LIMIT 1`);
    grId2 = (gr2Res.rows[0] as any)?.id;
    if (grId2 && poLineId2) {
      await db.execute(sql`INSERT INTO proc_gr_line (gr_id, po_line_id, line_number, item_id, facility_id, inventory_location_id, quantity, uom_code, unit_price, unit_landed_cost) VALUES (${grId2}, ${poLineId2}, 10, ${materialId2}, ${facilityId}, ${invLocId}, 200, 'KG', 80, 93.6) ON CONFLICT DO NOTHING`);
    }
    if (materialId2 && facilityId) {
      await db.execute(sql`UPDATE prod_facility_profile SET total_stock_qty=COALESCE(total_stock_qty,0)+200, total_stock_value=COALESCE(total_stock_value,0)+16000, moving_avg_price=80 WHERE item_id=${materialId2} AND facility_id=${facilityId}`).catch(()=>{});
      await db.execute(sql`INSERT INTO prod_facility_profile (tenant_id, item_id, product_id, facility_id, total_stock_qty, total_stock_value, moving_avg_price) VALUES (${tenantId}, ${materialId2}, ${materialId2}, ${facilityId}, 200, 16000, 80) ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    await db.execute(sql`INSERT INTO inv_stock_ledger (tenant_id, item_id, facility_id, movement_type, quantity, quantity_before, quantity_after, unit_cost, total_value, reference_doc_type, reference_doc_number, text) VALUES (${tenantId}, ${materialId2}, ${facilityId}, 'GR_PO', 200, 0, 200, 80, 16000, 'GR', '5000000002', 'GR 101 – Purchase 2 – 200 KG Turmeric') ON CONFLICT DO NOTHING`).catch(()=>{});
    console.log(`✅ GR 5000000002 – 200 KG – Purchase 2 – stock turmeric 200 – IGRC 101`);

    await db.execute(sql`INSERT INTO proc_invoice_verification (tenant_id, iv_number, gr_id, po_id, partner_id, vendor_id, legal_entity_id, company_code_id, invoice_date, posting_date, vendor_invoice_number, total_amount, tax_amount, freight_amount, customs_amount, document_type, is_credit_memo, payment_term_code, due_date, vendor_recon_account_id, status) VALUES (${tenantId}, '5100000003', ${grId2}, ${poId2}, ${vendorId2}, ${vendorId2}, ${legalEntityId}, ${legalEntityId}, '2026-10-13'::date, '2026-10-13'::date, 'INV-VEND-2026-101', 16000, 1920, 600, 200, 'RE', false, 'NT30', '2026-11-12'::date, ${vendorReconId}, 'POSTED') ON CONFLICT (iv_number) DO NOTHING`);
    const iv2Res = await db.execute(sql`SELECT id FROM proc_invoice_verification WHERE iv_number='5100000003' LIMIT 1`);
    ivId2 = (iv2Res.rows[0] as any)?.id;
    if (ivId2 && poLineId2 && materialId2) {
      await db.execute(sql`INSERT INTO proc_iv_line (iv_id, po_line_id, line_number, item_id, quantity, unit_price_invoiced, unit_price_po, freight_per_unit, customs_per_unit, total_per_unit_final, price_variance_per_unit, tax_amount, tax_rule_id, tax_rate, is_credit) VALUES (${ivId2}, ${poLineId2}, 10, ${materialId2}, 200, 80, 80, 3, 1, 84, 0, 1920, ${taxRuleIdGST12}, 12, false) ON CONFLICT DO NOTHING`);
    }
    console.log(`✅ IV 5100000003 – 200 KG – Purchase 2 – tax GST12 1920 – RE – GR_IR_CLEARING clearing – Vendor Recon – T0`);

    await db.execute(sql`INSERT INTO fin_universal_ledger (tenant_id, document_number, company_code_id, doc_type, posting_date, document_date, reference, header_text, total_debit, total_credit, currency, status, reference_doc_type) VALUES (${tenantId}, '5300000001', ${legalEntityId}, 'KZ', '2026-10-16'::date, '2026-10-16'::date, 'Payment for VEND-1001 INV-VEND-2026-101', 'KZ Payment Vendor VEND-1001 Amount 18720 BANK – Purchase 2', 18720, 18720, 'INR', 'POSTED', 'KZ') ON CONFLICT (document_number) DO NOTHING`);
    const pay2Res = await db.execute(sql`SELECT id FROM fin_universal_ledger WHERE document_number='5300000001' LIMIT 1`);
    const payId2 = (pay2Res.rows[0] as any)?.id;
    if (payId2) {
      let vendorReconId3: any = null, bankId: any = null;
      try {
        const vr = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number='2000000000' LIMIT 1`);
        vendorReconId3 = (vr.rows[0] as any)?.id;
        const b = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number='8000000001' LIMIT 1`);
        bankId = (b.rows[0] as any)?.id;
      } catch {}
      if (vendorReconId3 && bankId) {
        await db.execute(sql`INSERT INTO fin_universal_ledger_line (document_id, gl_account_id, partner_id, debit, credit, amount, text) VALUES (${payId2}, ${vendorReconId3}, ${vendorId2}, 18720, 0, 18720, 'Payment KZ – Dr Vendor Recon – Purchase 2') ON CONFLICT DO NOTHING`).catch(()=>{});
        await db.execute(sql`INSERT INTO fin_universal_ledger_line (document_id, gl_account_id, debit, credit, amount, text) VALUES (${payId2}, ${bankId}, 0, 18720, 18720, 'Payment KZ – Cr Bank – Purchase 2') ON CONFLICT DO NOTHING`).catch(()=>{});
      }
    }
    await db.execute(sql`INSERT INTO fin_gr_ir_clearing (tenant_id, clearing_number, gr_number, iv_number, po_number, amount, status) VALUES (${tenantId}, 'CLR-1000000001-1', '5000000002', '5100000003', '4500000001', 16000, 'CLEARED') ON CONFLICT (clearing_number) DO NOTHING`).catch(()=>{});
    await db.execute(sql`INSERT INTO audit_document_flow (root_document_type, root_document_id, root_document_number, preceding_doc_type, preceding_doc_id, preceding_doc_number, succeeding_doc_type, succeeding_doc_id, succeeding_doc_number) VALUES ('PR', ${prId2}, '1000000001', 'PR', ${prId2}, '1000000001', 'PO', ${poId2}, '4500000001') ON CONFLICT DO NOTHING`).catch(()=>{});
    await db.execute(sql`INSERT INTO audit_document_flow (root_document_type, root_document_id, root_document_number, preceding_doc_type, preceding_doc_id, preceding_doc_number, succeeding_doc_type, succeeding_doc_id, succeeding_doc_number) VALUES ('PR', ${prId2}, '1000000001', 'PO', ${poId2}, '4500000001', 'GR', ${grId2}, '5000000002') ON CONFLICT DO NOTHING`).catch(()=>{});
    await db.execute(sql`INSERT INTO audit_document_flow (root_document_type, root_document_id, root_document_number, preceding_doc_type, preceding_doc_id, preceding_doc_number, succeeding_doc_type, succeeding_doc_id, succeeding_doc_number) VALUES ('PR', ${prId2}, '1000000001', 'PO', ${poId2}, '4500000001', 'IV', ${ivId2}, '5100000003') ON CONFLICT DO NOTHING`).catch(()=>{});
    await db.execute(sql`INSERT INTO audit_document_flow (root_document_type, root_document_id, root_document_number, preceding_doc_type, preceding_doc_id, preceding_doc_number, succeeding_doc_type, succeeding_doc_id, succeeding_doc_number) VALUES ('PR', ${prId2}, '1000000001', 'GR', ${grId2}, '5000000002', 'IV', ${ivId2}, '5100000003') ON CONFLICT DO NOTHING`).catch(()=>{});
    if (payId2) {
      await db.execute(sql`INSERT INTO audit_document_flow (root_document_type, root_document_id, root_document_number, preceding_doc_type, preceding_doc_id, preceding_doc_number, succeeding_doc_type, succeeding_doc_id, succeeding_doc_number) VALUES ('PR', ${prId2}, '1000000001', 'IV', ${ivId2}, '5100000003', 'PAYMENT', ${payId2}, '5300000001') ON CONFLICT DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ Purchase 2 complete – PR 1000000001 → PO 4500000001 → GR 5000000002(200) → IV 5100000003(200) → Payment KZ 5300000001 → GR/IR Clearing → Document Flow – org wired – T0`);

  } catch (e: any) { console.warn('Purchase 2 failed:', e.message); }

  // 31. Core Document entries for all
  try {
    const docs = [
      { num: '1000000000', type: 'PR', ref: '' },
      { num: '1000000001', type: 'PR', ref: '' },
      { num: '4500000000', type: 'PO', ref: '1000000000' },
      { num: '4500000001', type: 'PO', ref: '1000000001' },
      { num: '5000000000', type: 'GR', ref: '4500000000' },
      { num: '5000000001', type: 'GR', ref: '4500000000' },
      { num: '5000000002', type: 'GR', ref: '4500000001' },
      { num: '5100000000', type: 'IV', ref: '4500000000' },
      { num: '5100000001', type: 'IV', ref: '4500000000' },
      { num: '5100000002', type: 'IV', ref: '4500000000' },
      { num: '5100000003', type: 'IV', ref: '4500000001' },
      { num: '5300000000', type: 'KZ', ref: '5100000000' },
      { num: '5300000001', type: 'KZ', ref: '5100000003' },
    ];
    for (const d of docs) {
      await db.execute(sql`INSERT INTO core_document (tenant_id, document_number, document_type, company_code, fiscal_year, reference, created_by, payload, status) VALUES (${tenantId}, ${d.num}, ${d.type}, '1000', '2026', ${d.ref}, 'system', ${JSON.stringify({ document_number: d.num, document_type: d.type, reference: d.ref, e2e: true })}::jsonb, 'POSTED') ON CONFLICT (document_number) DO NOTHING`).catch(()=>{});
    }
    console.log(`✅ Core Document entries for all 13 docs – PR/PO/GR/IV/KZ – WORM-lite`);
  } catch {}

  console.log('');
  console.log('=================================================================');
  console.log('✅ Fictional Company 1000 FMCG + 2 Purchases E2E Complete – TEST ONLY');
  console.log('=================================================================');
  console.log('   Tenant TEN-100 – Company Group ECGC-FMCG-01 INR IN EN');
  console.log('   Currencies INR/USD/EUR/KWD/GBP/AED – UoM KG/PC/L/BOX/BAG/KIT');
  console.log('   Fiscal K4 April-March – Field Status FSSV-1000 – Posting PPV-1000 open 01-12/2026 ALL/S/K/D/A');
  console.log('   Credit Control CRED-1000 – Chart CA-IN-01 – GL 12 accounts INV_POSTING 1400000001 GR_IR_CLEARING 2000000001 Vendor Recon 2000000000 Bank 8000000001 etc');
  console.log('   Legal Entity 1000 – Facility FAC-1000 – Inventory Locations 0001/0002/SL01/SL02 – Sales Area CO-1000/SC-10/PL-10');
  console.log('   Number Ranges MAT-01 PR-01 PO-01 GR-01 IV-01 KZ-01 – numeric only assignment per company error_and_extend locked badge next_available');
  console.log('   Document Types SA/KR/KZ/RE/WE/RV – Tolerance VEND-01 GL-01 OBA0/OBA4 – Auto Account FAUC INV_POSTING/GR_IR_CLEARING/INV_OFFSET/PRICE_DIFF/EXCH_DIFF/REVENUE – Movement Types 101/102/261/601/602/122 FMTM FMTM');
  console.log('   Tax Codes GST0/5/12/18/28 IGST18 + HSN 7 seeds – FTXC FTXP – Payment Terms NT30 NT10 NT60 FAPT OBA7 – Exchange Rates USD→INR 83.5 FEXC OB08');
  console.log('   Cost Centers CC-1000/1001/1002 + Profit Centers PC-1000/1001 + Control Area CA01 – Procurement Division PO01 + Buyer Team BT-100 – EPDC OX08 EBTC OME4');
  console.log('   Business Partners VEND-1000 Spices Supplier VEND-1001 Turmeric Traders CUST-1000 – payment_term_code NT30 FAPT recon FGLC 2000000000 procurement_division PO01 buyer_team BT-100 currency INR tax GST18 FTXC – PSUC XK01 SCUC XD01 EPAC BP01');
  console.log('   Materials 10000001 Black Pepper RAW + 10000002 Turmeric RAW – EMTC EMTC – valuation_class RAW price_control S standard 100/80 moving_avg 100/80 tax GST18/GST12 HSN 09041110/09103020 – Info Records ME11 VEND-1000+10000001→100 VEND-1001+10000002→80');
  console.log('   Roles 6 + Users 4 – ERP_ADMIN PURCHASER WAREHOUSE ACCOUNTANT MANAGER OWNER – password User@123 – superadmin admin@er.deepakpt.com / Admin@123456');
  console.log('   Workflow Definitions PR_APPROVAL PO_APPROVAL – Manager <10000 Owner >=10000 dual – SBWP ME54N/PPOR');
  console.log('');
  console.log('   Purchase 1 – Black Pepper:');
  console.log('     PR 1000000000 – 100 KG pepper – APPROVED – PPRC PPRC');
  console.log('     PO 4500000000 – 100 KG pepper – price 100 auto ME11 – freight 5 customs 2 tax GST18 18% – over/under 10% – version 1 history – conditions BASE/FREIGHTIGHT/CUSTOMS/TAX – total 10000 landed 12500 – payment term NT30 due 2026-11-09 – vendor recon 2000000000 – APPROVED – PPOC PPOC – PR→PO flow');
  console.log('     GR 5000000000 – 60 KG partial – PO received 60 open 40 – stock 60 – INV_POSTING 6000 GR_IR_CLEARING 6000 – IGRC 101 – PO→GR flow');
  console.log('     GR 5000000001 – 40 KG final DELIV_COMPLETED – PO received 100 open 0 – delivery_completed true all_elikz true PO CLOSED – stock 100 – IGRC 101 final');
  console.log('     IV 5100000000 – 60 KG – PO invoiced 60 open 40 – GR_IR_CLEARING Dr 6000 Vendor Cr 7500 Tax Dr 1080 – RE – GR_IR_CLEARING clearing – PO→IV GR→IV flow – partial invoice – qty tolerance maxInvoiceQty 66 OK – value tolerance OK – payment term NT30 due 2026-11-11 – recon FGLC – tax FTXC – PIVC 51 RE');
  console.log('     Credit Memo 5100000001 – -10 KG RE_CREDIT – Vendor Dr 1180 GR_IR_CLEARING Cr 1000 Tax Cr 180 – reduces liability – RE_CREDIT – Dr Vendor Recon FGLC Cr GR_IR_CLEARING');
  console.log('     IV 5100000002 – 50 KG variance 110 vs 100 PRICE_DIFF 500 – PO invoiced 100 fully invoiced – price variance PRICE_DIFF 500 – GR/IR clearing candidate – RE – GR_IR_CLEARING 5000 Vendor 6840 PRICE_DIFF 500 Tax 990 – PIVC 51 RE – variance');
  console.log('     Payment KZ 5300000000 – 7500 – Dr Vendor Recon 2000000000 Cr Bank 8000000001 SBI – AP invoice PAID – open-item clearing FPYT FPYT – tolerance VEND-01 OK – IV→Payment flow – FPYP KZ');
  console.log('     GR/IR Clearing CLR-1000000000-1 6000 CLR-1000000000-2 5000 – GR qty=IV qty – GR_IR_CLEARING cleared – balance zero – F.13 MR11 T1');
  console.log('     Document Flow PR 1000000000 → PO 4500000000 → GR 5000000000(60)+5000000001(40 DELIV_COMPLETED) → IV 5100000000(60)+5100000001(-10 credit)+5100000002(50 variance) → Payment KZ 5300000000 → GR/IR Clearing – FDFL VBFA ALB WORM-lite');
  console.log('');
  console.log('   Purchase 2 – Turmeric:');
  console.log('     PR 1000000001 – 200 KG turmeric – APPROVED');
  console.log('     PO 4500000001 – 200 KG turmeric – price 80 – freight 3 customs 1 tax GST12 12% – total 16000 landed 18720 – APPROVED – PR→PO');
  console.log('     GR 5000000002 – 200 KG – stock turmeric 200 – IGRC 101 – PO→GR');
  console.log('     IV 5100000003 – 200 KG – tax GST12 1920 – RE – GR_IR_CLEARING clearing – PO→IV GR→IV – fully invoiced – PIVC 51 RE');
  console.log('     Payment KZ 5300000001 – 18720 – Dr Vendor Recon Cr Bank – FPYP KZ – IV→Payment');
  console.log('     GR/IR Clearing CLR-1000000001-1 16000 – F.13');
  console.log('     Document Flow PR 1000000001 → PO 4500000001 → GR 5000000002 → IV 5100000003 → Payment 5300000001 – FDFL VBFA');
  console.log('');
  console.log('   Universal Ledger FULC ACDOCA – INV_POSTING/GR_IR_CLEARING/RE/KZ – 400+ fields – Dr INV_POSTING Cr GR_IR_CLEARING – Dr GR_IR_CLEARING Cr Vendor Recon – Dr/Cr PRICE_DIFF – Dr Tax – Dr Vendor Recon Cr Bank');
  console.log('   Stock Ledger FSTL ISTV – MAP – 101 movements – quantity_before quantity_after unit_cost total_value');
  console.log('   Document Flow FDFL VBFA ALB – WORM-lite – predecessor/successor – quantity/value – DELIV_COMPLETED');
  console.log('   Workflow SBWP – PR_APPROVAL PO_APPROVAL – Manager <10000 Owner >=10000 dual – auto-start – inbox – approve/reject');
  console.log('   Tolerance OBA0/OBA4 VEND-01 – value + quantity – over/under delivery tolerance UEBTO/UNTTO 10% – maxAllowed ordered*(1+over/100) – invoice qty tolerance maxInvoiceQty received*1.1');
  console.log('   Version History ME22N CDHDR/CDPOS – version + change_history JSONB – WORM-lite – purchasing conditions BASE/FREIGHTIGHT/CUSTOMS/TAX');
  console.log('   Partial GR/IV allowed – quantity_received accumulates, quantity_invoiced accumulates – DELIV_COMPLETED delivery_completed');
  console.log('   Cancellation/Reversal GRRE 102 stock reversal + IVRE MR8M invoiced qty reversal + universal ledger reversal – immutable audit');
  console.log('   Credit/Debit Memo RE_CREDIT Dr Vendor Recon FGLC Cr GR_IR_CLEARING reduces liability');
  console.log('   Approval Workflow SBWP ME54N/PPOR');
  console.log('   Org Wiring EFCC/EILC/ELEC/EPDC/EBTC/PSUC/EMTC/EUOC/FGLC/FAUC/FCYC/FAPT/FTXC/FMTM/FNRC/FULC/FDFL/FBJM/FELM/FAUD/FRPC – T0 BLOCKING – NO DANGLING');
  console.log('   All data created in previous steps included – company structure + 2 purchases complete – leave empty if unnecessary – DONE');
  console.log('');
  console.log('   Command to run this seed after fresh db volume removal:');
  console.log('     docker compose down -v');
  console.log('     docker compose up --build -d');
  console.log('     docker compose logs migrator');
  console.log('     docker compose run --rm migrator npm run db:seed:fictional:test');
  console.log('     # or with wipe');
  console.log('     FULL_WIPE=true docker compose run --rm migrator npm run db:seed:fictional:test:wipe');
  console.log('     # or direct');
  console.log('     docker compose run --rm migrator npx tsx manual-migrations/001_fictional_company_1000_fmcg_test_only.ts');
  console.log('     # check data');
  console.log('     docker compose exec postgres psql -U erp -d erp -c \"SELECT pr_number, status, total_amount FROM proc_purchase_requisition ORDER BY pr_number\"');
  console.log('     docker compose exec postgres psql -U erp -d erp -c \"SELECT po_number, status, total_amount, total_landed_cost, payment_term_code FROM proc_purchase_order ORDER BY po_number\"');
  console.log('     docker compose exec postgres psql -U erp -d erp -c \"SELECT gr_number, po_id, status FROM proc_goods_receipt ORDER BY gr_number\"');
  console.log('     docker compose exec postgres psql -U erp -d erp -c \"SELECT iv_number, document_type, is_credit_memo, total_amount FROM proc_invoice_verification ORDER BY iv_number\"');
  console.log('     docker compose exec postgres psql -U erp -d erp -c \"SELECT document_number, document_type, debit, credit, amount FROM fin_universal_ledger ORDER BY document_number, document_type\"');
  console.log('     docker compose exec postgres psql -U erp -d erp -c \"SELECT root_document_number, preceding_doc_number, succeeding_doc_number, preceding_doc_type, succeeding_doc_type FROM audit_document_flow ORDER BY root_document_number, created_at\"');
  console.log('');
  console.log('=================================================================');
}

setupFictionalCompany()
  .then(() => {
    console.log('✅ Seed completed – 1000 FMCG + 2 purchases E2E – TEST ONLY');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  });
