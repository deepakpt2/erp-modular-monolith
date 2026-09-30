/**
 * ============================================================================
 * ⚠️  TEST ONLY – MANUAL MIGRATION – NOT PART OF PRODUCTION AUTO-MIGRATION
 * ============================================================================
 * Fictional Company Setup – 1000 FMCG India Pvt Ltd – TEST DATA ONLY
 * 
 * Location: manual-migrations/001_fictional_company_1000_fmcg_test_only.ts
 * Purpose:  Creates ALL admin/master data needed to test PR→IV, HR, Audit,
 *           PP, SD, FICO manually – for TESTING PURPOSE ONLY.
 * 
 * ❌ NOT part of main migration:
 *   - NOT called by src/shared/kernel/db/autoMigrate.ts
 *   - NOT called by src/shared/kernel/db/initProduction.ts
 *   - NOT run on docker compose up --build
 *   - docker-compose.yml auto-migrate only runs npm run db:auto-migrate
 * 
 * ✅ MANUAL ONLY – run AFTER actual build:
 *   docker compose run --rm migrator npm run db:seed:fictional:test
 *   docker compose run --rm migrator npx tsx manual-migrations/001_fictional_company_1000_fmcg_test_only.ts
 *   docker exec -it <migrator> npx tsx manual-migrations/001_fictional_company_1000_fmcg_test_only.ts
 *   FULL_WIPE=true docker compose run --rm migrator npm run db:seed:fictional:test:wipe
 * 
 * Fixes applied after first run failures (user log):
 * - fin_fiscal_calendar requires tenant_id NOT NULL + unique (tenant_id, code) not code alone – fixed SELECT then INSERT with tenant_id
 * - fin_posting_calendar same – requires tenant_id
 * - fin_credit_policy_area same – requires tenant_id
 * - org_inventory_location location_type enum RAW_ZONE/FINISHED_ZONE not RAW/FG – fixed + unique (facility_id, code)
 * - org_cost_unit requires controlAreaId NOT NULL + unique (controlAreaId, code) – now creates org_mgmt_control_area first
 * - fin_auto_posting_rule transactionKey enum INV_POSTING/GR_IR_CLEARING/PRICE_DIFF/INV_OFFSET not BSX/WRX/GBB/PRD/KDM – fixed mapping + fallback to fi_auto_account_determination legacy
 * 
 * Idempotent: ON CONFLICT DO NOTHING where possible – safe to re-run – preserves manual PR→IV data unless FULL_WIPE=true
 * FULL_WIPE=true → TRUNCATE ALL TABLES CASCADE – fresh start
 * ============================================================================
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
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@deepakpt.com';
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
    console.error('❌ Admin ensure failed:', e.message, e.cause || '');
  }
}

async function setupFictionalCompany() {
  console.log('');
  console.log('=================================================================');
  console.log('⚠️  TEST ONLY – MANUAL MIGRATION – 1000 FMCG India Pvt Ltd – FIXED');
  console.log('=================================================================');
  console.log('   This is NOT part of auto-migrate / initProduction');
  console.log('   Run AFTER actual build: docker compose run --rm migrator');
  console.log(`   FULL_WIPE=${FULL_WIPE} – ${FULL_WIPE ? 'Will wipe then create' : 'Upsert preserve – safe'}`);
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
    console.log(`✅ Tenant TEN-100 ensured – id ${tenantId}`);
  } catch (e: any) { console.warn('Tenant failed:', e.message, e.cause || ''); }

  // 2. Company Group ECGC-FMCG-01
  let cgId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_company_group (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, description text, currency_code varchar(3) DEFAULT 'INR', country_code varchar(2) DEFAULT 'IN', country varchar(2) DEFAULT 'IN', language varchar(10) DEFAULT 'EN', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`ALTER TABLE org_company_group ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'INR'`);
    await db.execute(sql`ALTER TABLE org_company_group ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'IN'`);
    await db.execute(sql`ALTER TABLE org_company_group ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'EN'`);
    await db.execute(sql`
      INSERT INTO org_company_group (tenant_id, code, name, description, currency_code, country_code, country, language)
      VALUES (${tenantId}, 'ECGC-FMCG-01', 'FMCG Group India', 'FMCG Group for Spices and Foods – fictional company – TEST ONLY – admin auto', 'INR', 'IN', 'IN', 'EN')
      ON CONFLICT DO NOTHING
    `);
    // Try select by tenant + code, fallback by code alone
    let cgRes = await db.execute(sql`SELECT id FROM org_company_group WHERE tenant_id=${tenantId} AND code='ECGC-FMCG-01' LIMIT 1`);
    if (cgRes.rows.length === 0) cgRes = await db.execute(sql`SELECT id FROM org_company_group WHERE code='ECGC-FMCG-01' LIMIT 1`);
    cgId = (cgRes.rows[0] as any)?.id;
    console.log(`✅ Company Group ECGC-FMCG-01 ensured – INR/IN/EN – id ${cgId}`);
  } catch (e: any) { console.warn('Company Group failed:', e.message, e.cause || ''); }

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

  // 5. Fiscal Calendar K4 – FIXED: requires tenant_id, unique (tenant_id, code)
  let fiscalId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_fiscal_calendar (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(150) NOT NULL, description text, year_dependent boolean DEFAULT false, calendar_year boolean DEFAULT false, number_of_periods integer DEFAULT 12, from_date timestamp, to_date timestamp, start_month integer DEFAULT 4, end_month integer DEFAULT 3, year_shift integer DEFAULT 0, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS year_dependent BOOLEAN DEFAULT false`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS calendar_year BOOLEAN DEFAULT false`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS number_of_periods INTEGER DEFAULT 12`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS from_date TIMESTAMP`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS to_date TIMESTAMP`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS start_month INTEGER DEFAULT 4`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS end_month INTEGER DEFAULT 3`);
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS year_shift INTEGER DEFAULT 0`);

    // Robust upsert: SELECT first, then INSERT or UPDATE – avoids ON CONFLICT (code) failing when unique is (tenant_id, code)
    const existingFiscal = await db.execute(sql`SELECT id FROM fin_fiscal_calendar WHERE tenant_id=${tenantId} AND code='K4' LIMIT 1`);
    if (existingFiscal.rows.length > 0) {
      fiscalId = (existingFiscal.rows[0] as any).id;
      await db.execute(sql`
        UPDATE fin_fiscal_calendar SET 
          name='April-March Fiscal – India – K4', 
          description='Fiscal Year Variant K4 – April to March – 12 periods – year_dependent false calendar_year false number_of_periods 12 – TEST ONLY – FIXED',
          year_dependent=false, calendar_year=false, number_of_periods=12, start_month=4, end_month=3, year_shift=0,
          from_date='2026-04-01'::timestamp, to_date='2027-03-31'::timestamp, updated_at=NOW()
        WHERE id=${fiscalId}
      `);
      console.log(`✅ Fiscal Calendar K4 updated – year_dependent false calendar_year false number_of_periods 12 – id ${fiscalId}`);
    } else {
      // Try also by code alone for legacy
      const existingByCode = await db.execute(sql`SELECT id, tenant_id FROM fin_fiscal_calendar WHERE code='K4' LIMIT 1`);
      if (existingByCode.rows.length > 0) {
        fiscalId = (existingByCode.rows[0] as any).id;
        await db.execute(sql`
          UPDATE fin_fiscal_calendar SET 
            tenant_id=COALESCE(tenant_id, ${tenantId}),
            name='April-March Fiscal – India – K4',
            year_dependent=false, calendar_year=false, number_of_periods=12, start_month=4, end_month=3, year_shift=0,
            from_date='2026-04-01'::timestamp, to_date='2027-03-31'::timestamp, updated_at=NOW()
          WHERE id=${fiscalId}
        `);
        console.log(`✅ Fiscal Calendar K4 updated (legacy by code) – id ${fiscalId}`);
      } else {
        const ins = await db.execute(sql`
          INSERT INTO fin_fiscal_calendar (tenant_id, code, name, description, year_dependent, calendar_year, number_of_periods, start_month, end_month, year_shift, from_date, to_date)
          VALUES (${tenantId}, 'K4', 'April-March Fiscal – India – K4', 'Fiscal Year Variant K4 – April to March – 12 periods – year_dependent false calendar_year false number_of_periods 12 – TEST ONLY – FIXED', false, false, 12, 4, 3, 0, '2026-04-01'::timestamp, '2027-03-31'::timestamp)
          ON CONFLICT (tenant_id, code) DO UPDATE SET name='April-March Fiscal – India – K4', year_dependent=false, calendar_year=false, number_of_periods=12, start_month=4, end_month=3, updated_at=NOW()
          RETURNING id
        `);
        fiscalId = (ins.rows[0] as any)?.id || null;
        if (!fiscalId) {
          const sel = await db.execute(sql`SELECT id FROM fin_fiscal_calendar WHERE tenant_id=${tenantId} AND code='K4' LIMIT 1`);
          fiscalId = (sel.rows[0] as any)?.id;
        }
        console.log(`✅ Fiscal Calendar K4 ensured – year_dependent false calendar_year false number_of_periods 12 – id ${fiscalId}`);
      }
    }

    // Periods for K4
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_fiscal_calendar_period (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), fiscal_calendar_id uuid NOT NULL, period integer NOT NULL, period_number integer, calendar_month integer NOT NULL, month integer, year_shift integer DEFAULT 0, start_day_month varchar(10), end_day_month varchar(10), description text, UNIQUE(fiscal_calendar_id, period))`);
    if (fiscalId) {
      for (let p=1; p<=12; p++) {
        const calMonth = ((3 + p) % 12) + 1;
        const yearShift = calMonth <= 3 ? 1 : 0;
        await db.execute(sql`
          INSERT INTO fin_fiscal_calendar_period (fiscal_calendar_id, period, period_number, calendar_month, month, year_shift)
          VALUES (${fiscalId}, ${p}, ${p}, ${calMonth}, ${calMonth}, ${yearShift})
          ON CONFLICT (fiscal_calendar_id, period) DO NOTHING
        `);
      }
      console.log('✅ Fiscal Calendar Periods K4 – 12 periods ensured');
    }
  } catch (e: any) { console.warn('Fiscal Calendar failed:', e.message, e.cause || ''); }

  // 6. Field Status Variant FSSV-1000
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_field_status_variant (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(20) UNIQUE NOT NULL, name varchar(100) NOT NULL, description text, created_at timestamptz DEFAULT NOW(), updated_at timestamptz DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO fin_field_status_variant (code, name, description) VALUES ('FSSV-1000','Field Status Variant 1000 – India','Variant for 1000 – required before ELEC – TEST ONLY – FIXED'), ('1000','Standard Field Status','Standard variant') ON CONFLICT (code) DO NOTHING`);
    console.log('✅ Field Status Variant FSSV-1000 ensured');
  } catch (e: any) { console.warn('Field Status Variant failed:', e.message); }

  // 7. Field Status Groups
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
    console.log('✅ Field Status Groups FSSV-1000/G001/G002/G004 ensured');
  } catch (e: any) { console.warn('Field Status Groups failed:', e.message); }

  // 8. Posting Period Variant PPV-1000 – FIXED: requires tenant_id
  let ppvId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_posting_calendar (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, description text, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    const existingPPV = await db.execute(sql`SELECT id FROM fin_posting_calendar WHERE tenant_id=${tenantId} AND code='PPV-1000' LIMIT 1`);
    if (existingPPV.rows.length > 0) {
      ppvId = (existingPPV.rows[0] as any).id;
      console.log(`✅ Posting Period Variant PPV-1000 exists – id ${ppvId}`);
    } else {
      const existingByCode = await db.execute(sql`SELECT id FROM fin_posting_calendar WHERE code='PPV-1000' LIMIT 1`);
      if (existingByCode.rows.length > 0) {
        ppvId = (existingByCode.rows[0] as any).id;
        await db.execute(sql`UPDATE fin_posting_calendar SET tenant_id=COALESCE(tenant_id, ${tenantId}) WHERE id=${ppvId}`);
        console.log(`✅ Posting Period Variant PPV-1000 updated (legacy) – id ${ppvId}`);
      } else {
        const ins = await db.execute(sql`
          INSERT INTO fin_posting_calendar (tenant_id, code, name, description)
          VALUES (${tenantId}, 'PPV-1000','Posting Period Variant 1000 – India','PPV-1000 – groups company codes for OB52 – TEST ONLY – FIXED')
          ON CONFLICT (tenant_id, code) DO NOTHING
          RETURNING id
        `);
        ppvId = (ins.rows[0] as any)?.id || null;
        if (!ppvId) {
          const sel = await db.execute(sql`SELECT id FROM fin_posting_calendar WHERE tenant_id=${tenantId} AND code='PPV-1000' LIMIT 1`);
          ppvId = (sel.rows[0] as any)?.id;
        }
        console.log(`✅ Posting Period Variant PPV-1000 ensured – id ${ppvId}`);
      }
    }

    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_posting_calendar_period (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), posting_calendar_id uuid NOT NULL, legal_entity_id uuid, from_period integer NOT NULL, from_year integer NOT NULL, to_period integer NOT NULL, to_year integer NOT NULL, account_type varchar(20) DEFAULT 'ALL', is_open boolean DEFAULT true, description text, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    if (ppvId) {
      for (const accType of ['ALL','S','K','D','A']) {
        // Check if period already exists for this account type
        const exists = await db.execute(sql`SELECT id FROM fin_posting_calendar_period WHERE posting_calendar_id=${ppvId} AND from_period=1 AND from_year=2026 AND to_period=12 AND to_year=2026 AND account_type=${accType} LIMIT 1`);
        if (exists.rows.length === 0) {
          await db.execute(sql`
            INSERT INTO fin_posting_calendar_period (posting_calendar_id, from_period, from_year, to_period, to_year, account_type, is_open)
            VALUES (${ppvId}, 1, 2026, 12, 2026, ${accType}::fin_posting_account_type, true)
          `);
        }
      }
      console.log('✅ Posting Calendar Periods PPV-1000 – open 01-12/2026 ensured');
    }
  } catch (e: any) { console.warn('Posting Period Variant failed:', e.message, e.cause || ''); }

  // 9. Credit Control Area CRED-1000 – FIXED: requires tenant_id
  let cpaId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_credit_policy_area (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, currency_code varchar(3) DEFAULT 'INR', description text, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    const existingCPA = await db.execute(sql`SELECT id FROM fin_credit_policy_area WHERE tenant_id=${tenantId} AND code='CRED-1000' LIMIT 1`);
    if (existingCPA.rows.length > 0) {
      cpaId = (existingCPA.rows[0] as any).id;
      console.log(`✅ Credit Control Area CRED-1000 exists – id ${cpaId}`);
    } else {
      const existingByCode = await db.execute(sql`SELECT id FROM fin_credit_policy_area WHERE code='CRED-1000' LIMIT 1`);
      if (existingByCode.rows.length > 0) {
        cpaId = (existingByCode.rows[0] as any).id;
        await db.execute(sql`UPDATE fin_credit_policy_area SET tenant_id=COALESCE(tenant_id, ${tenantId}) WHERE id=${cpaId}`);
        console.log(`✅ Credit Control Area CRED-1000 updated (legacy) – id ${cpaId}`);
      } else {
        const ins = await db.execute(sql`
          INSERT INTO fin_credit_policy_area (tenant_id, code, name, currency_code, description)
          VALUES (${tenantId}, 'CRED-1000','Credit Control India – Domestic','INR','Credit Control Area CRED-1000 – TEST ONLY – FIXED')
          ON CONFLICT (tenant_id, code) DO NOTHING
          RETURNING id
        `);
        cpaId = (ins.rows[0] as any)?.id || null;
        if (!cpaId) {
          const sel = await db.execute(sql`SELECT id FROM fin_credit_policy_area WHERE tenant_id=${tenantId} AND code='CRED-1000' LIMIT 1`);
          cpaId = (sel.rows[0] as any)?.id;
        }
        console.log(`✅ Credit Control Area CRED-1000 ensured – id ${cpaId}`);
      }
    }
  } catch (e: any) { console.warn('Credit Control Area failed:', e.message, e.cause || ''); }

  // 10. Chart of Accounts CA-IN-01
  let coaId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_chart (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(20) UNIQUE NOT NULL, name varchar(150) NOT NULL, description text, language varchar(10) DEFAULT 'EN', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`ALTER TABLE fin_chart ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'EN'`);
    await db.execute(sql`INSERT INTO fin_chart (code, name, description, language) VALUES ('CA-IN-01','Chart of Accounts India','India Standard CoA – CA-IN-01 – TEST ONLY – language EN','EN') ON CONFLICT (code) DO UPDATE SET language='EN', updated_at=NOW()`);
    const coaRes = await db.execute(sql`SELECT id FROM fin_chart WHERE code='CA-IN-01' LIMIT 1`);
    coaId = (coaRes.rows[0] as any)?.id;
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fi_chart_of_accounts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(20) UNIQUE NOT NULL, name varchar(100) NOT NULL, description text)`);
    await db.execute(sql`INSERT INTO fi_chart_of_accounts (code, name, description) VALUES ('CA-IN-01','Chart of Accounts India','India Standard') ON CONFLICT (code) DO NOTHING`);
    console.log(`✅ Chart of Accounts CA-IN-01 ensured – language EN – id ${coaId}`);
  } catch (e: any) { console.warn('Chart of Accounts failed:', e.message); }

  // 11. GL Accounts
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_ledger_account (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), chart_id uuid NOT NULL, coa_id uuid, account_number varchar(30) NOT NULL, name varchar(150) NOT NULL, account_type varchar(20) NOT NULL, is_balance_sheet boolean NOT NULL, is_reconciliation boolean DEFAULT false, is_blocked boolean DEFAULT false, is_tax_relevant boolean DEFAULT false, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW(), UNIQUE(chart_id, account_number))`);
    const gls = [
      ['1000000001','Inventory RAW – BSX','ASSET',true,false],
      ['2000000000','GR/IR Clearing – WRX','LIABILITY',true,false],
      ['4000000000','Consumption GBB – GBB VBR','EXPENSE',false,false],
      ['4000000001','Price Difference PRD','EXPENSE',false,false],
      ['4000001000','Revenue Domestic – KOFI','REVENUE',false,false],
      ['4000002000','Exchange Difference KDM','EXPENSE',false,false],
      ['2000000001','Vendor Reconciliation K','LIABILITY',true,true],
      ['1000000002','Customer Reconciliation D','ASSET',true,true],
      ['6000000000','Payroll Expense','EXPENSE',false,false],
      ['5000000000','COGS','EXPENSE',false,false],
      ['2500000001','Retained Earnings','EQUITY',true,false],
      ['100000','Cash – ASSET','ASSET',true,false],
    ];
    for (const [accNum, name, type, isBS, isRecon] of gls) {
      await db.execute(sql`
        INSERT INTO fin_ledger_account (chart_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant, is_active)
        VALUES (${coaId}, ${accNum}, ${name}, ${type}, ${isBS}, ${isRecon}, false, true)
        ON CONFLICT (chart_id, account_number) DO NOTHING
      `);
    }
    console.log('✅ GL Accounts ensured – 12 mandatory');
  } catch (e: any) { console.warn('GL Accounts failed:', e.message); }

  // 12. Management Control Area – needed for Cost Centers
  let controlAreaId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_mgmt_control_area (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, currency_code varchar(3) DEFAULT 'INR', description text, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    const existingCA = await db.execute(sql`SELECT id FROM org_mgmt_control_area WHERE tenant_id=${tenantId} AND code='CA-1000' LIMIT 1`);
    if (existingCA.rows.length > 0) {
      controlAreaId = (existingCA.rows[0] as any).id;
    } else {
      const ins = await db.execute(sql`
        INSERT INTO org_mgmt_control_area (tenant_id, code, name, currency_code, description)
        VALUES (${tenantId}, 'CA-1000', 'Controlling Area 1000 – FMCG – TEST ONLY', 'INR', 'Controlling Area for 1000 – needed for Cost Centers')
        ON CONFLICT (tenant_id, code) DO NOTHING
        RETURNING id
      `);
      controlAreaId = (ins.rows[0] as any)?.id || null;
      if (!controlAreaId) {
        const sel = await db.execute(sql`SELECT id FROM org_mgmt_control_area WHERE tenant_id=${tenantId} AND code='CA-1000' LIMIT 1`);
        controlAreaId = (sel.rows[0] as any)?.id;
      }
    }
    console.log(`✅ Controlling Area CA-1000 ensured – id ${controlAreaId} – needed for Cost Centers`);
  } catch (e: any) { console.warn('Controlling Area failed:', e.message, e.cause || ''); }

  // 13. Legal Entity 1000
  let legalEntityId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_legal_entity (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, company_group_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, currency_code varchar(3) DEFAULT 'INR', city varchar(100), country varchar(2) DEFAULT 'IN', country_code varchar(2) DEFAULT 'IN', fiscal_calendar_code varchar(20) DEFAULT 'K4', fiscal_year_variant varchar(20) DEFAULT 'K4', chart_of_accounts_code varchar(20) DEFAULT 'CA-IN-01', field_status_variant varchar(20) DEFAULT 'FSSV-1000', posting_period_variant varchar(20) DEFAULT 'PPV-1000', posting_period_variant_code varchar(20) DEFAULT 'PPV-1000', credit_control_area varchar(20) DEFAULT 'CRED-1000', credit_policy_area_code varchar(20) DEFAULT 'CRED-1000', language varchar(10) DEFAULT 'EN', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO org_legal_entity (tenant_id, company_group_id, code, name, currency_code, country, country_code, fiscal_calendar_code, fiscal_year_variant, chart_of_accounts_code, field_status_variant, posting_period_variant, credit_control_area, language)
      VALUES (${tenantId}, ${cgId}, '1000', 'FMCG India Pvt Ltd', 'INR', 'IN', 'IN', 'K4', 'K4', 'CA-IN-01', 'FSSV-1000', 'PPV-1000', 'CRED-1000', 'EN')
      ON CONFLICT DO NOTHING
    `);
    const leRes = await db.execute(sql`SELECT id FROM org_legal_entity WHERE tenant_id=${tenantId} AND code='1000' LIMIT 1`);
    if (leRes.rows.length > 0) legalEntityId = (leRes.rows[0] as any).id;
    else {
      const leRes2 = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code='1000' LIMIT 1`);
      legalEntityId = (leRes2.rows[0] as any)?.id;
    }
    console.log(`✅ Legal Entity 1000 FMCG India Pvt Ltd ensured – id ${legalEntityId}`);
  } catch (e: any) { console.warn('Legal Entity failed:', e.message, e.cause || ''); }

  // 14. Facilities + Locations – FIXED: location_type enum
  let facilityId: string | null = null;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_facility (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), legal_entity_id uuid NOT NULL, code varchar(20) UNIQUE NOT NULL, name varchar(100) NOT NULL, description text, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO org_facility (legal_entity_id, code, name) VALUES (${legalEntityId}, 'FAC-1000', 'Pune Plant – Main Production – TEST ONLY – FIXED') ON CONFLICT (code) DO NOTHING`);
    const fRes = await db.execute(sql`SELECT id FROM org_facility WHERE code='FAC-1000' LIMIT 1`);
    facilityId = (fRes.rows[0] as any)?.id;
    console.log(`✅ Facility FAC-1000 ensured – id ${facilityId}`);

    // Check enum values for org_location_type
    try {
      const enumRes = await db.execute(sql`SELECT unnest(enum_range(NULL::org_location_type)) as val`);
      console.log(`   org_location_type enum values: ${(enumRes.rows as any[]).map(r=>r.val).join(', ')}`);
    } catch {}

    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_inventory_location (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), facility_id uuid NOT NULL, code varchar(20) NOT NULL, name varchar(100) NOT NULL, location_type varchar(20) DEFAULT 'PRIMARY', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW(), UNIQUE(facility_id, code))`);
    // FIXED: Use valid enum values RAW_ZONE and FINISHED_ZONE instead of RAW/FG
    const locs = [
      ['0001', 'Raw Material Store', 'RAW_ZONE'],
      ['0002', 'Finished Goods Store', 'FINISHED_ZONE'],
    ];
    for (const [code, name, locType] of locs) {
      const exists = await db.execute(sql`SELECT id FROM org_inventory_location WHERE facility_id=${facilityId} AND code=${code} LIMIT 1`);
      if (exists.rows.length === 0) {
        await db.execute(sql`
          INSERT INTO org_inventory_location (facility_id, code, name, location_type)
          VALUES (${facilityId}, ${code}, ${name}, ${locType}::org_location_type)
        `);
      }
    }
    console.log('✅ Inventory Locations 0001 RAW_ZONE / 0002 FINISHED_ZONE ensured – FIXED enum');
  } catch (e: any) { console.warn('Facility/Location failed:', e.message, e.cause || ''); }

  // 15. Sales Area
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_commercial_org (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, legal_entity_id uuid NOT NULL, code varchar(20) NOT NULL, name varchar(100) NOT NULL, currency_code varchar(3) DEFAULT 'INR', is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO org_commercial_org (tenant_id, legal_entity_id, code, name) VALUES (${tenantId}, ${legalEntityId}, 'CO-1000', 'India Sales Org') ON CONFLICT DO NOTHING`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_sales_channel (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, code varchar(20) NOT NULL, name varchar(100) NOT NULL, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO org_sales_channel (tenant_id, code, name) VALUES (${tenantId}, 'SC-10', 'Direct Sales') ON CONFLICT DO NOTHING`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_product_line (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, code varchar(20) NOT NULL, name varchar(100) NOT NULL, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
    await db.execute(sql`INSERT INTO org_product_line (tenant_id, code, name) VALUES (${tenantId}, 'PL-10', 'Spices') ON CONFLICT DO NOTHING`);
    console.log('✅ Sales Area ensured – CO-1000 / SC-10 / PL-10');
  } catch (e: any) { console.warn('Sales Area failed:', e.message); }

  // 16. Number Ranges, Doc Types, Tolerance
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS core_number_range (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(50) UNIQUE NOT NULL, object_type varchar(50) NOT NULL, legal_entity_id uuid, fiscal_year integer, prefix varchar(20) DEFAULT '', from_number bigint NOT NULL, to_number bigint NOT NULL, current_number bigint DEFAULT 0, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    const nr = [
      ['SA-01','FI_DOC','FI-SA-',1000000000,1999999999],
      ['KR-01','FI_DOC','FI-KR-',5100000000,5199999999],
      ['KZ-01','FI_DOC','FI-KZ-',5300000000,5399999999],
      ['RE-01','FI_DOC','FI-RE-',5100000001,5199999999],
      ['WE-01','FI_DOC','FI-WE-',5000000000,5099999999],
      ['RV-01','FI_DOC','FI-RV-',9000000000,9099999999],
    ];
    for (const [code, objType, prefix, fromN, toN] of nr) {
      await db.execute(sql`INSERT INTO core_number_range (code, object_type, prefix, from_number, to_number, current_number) VALUES (${code}, ${objType}::core_nr_object_type, ${prefix}, ${fromN}, ${toN}, ${fromN}) ON CONFLICT (code) DO NOTHING`);
    }
    console.log('✅ Number Ranges ensured');
  } catch (e: any) { console.warn('Number Ranges failed:', e.message, e.cause || ''); }

  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_document_type (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(20) UNIQUE NOT NULL, name varchar(150) NOT NULL, number_range_code varchar(50), is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO fin_document_type (code, name, number_range_code) VALUES ('SA','GL Document','SA-01'), ('KR','Vendor Invoice','KR-01'), ('KZ','Vendor Payment','KZ-01'), ('RE','Invoice Verification','RE-01'), ('WE','Goods Receipt','WE-01'), ('RV','Billing','RV-01') ON CONFLICT (code) DO NOTHING`);
    console.log('✅ Document Types ensured');
  } catch (e: any) { console.warn('Doc Types failed:', e.message); }

  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_tolerance_group (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(30) UNIQUE NOT NULL, name varchar(150) NOT NULL, type varchar(20) DEFAULT 'GL', legal_entity_id uuid, lower_limit numeric DEFAULT 0, upper_limit numeric DEFAULT 0, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO fin_tolerance_group (code, name, type) VALUES ('GL-01','GL Tolerance – 1M','GL'), ('VEND-01','Vendor Tolerance – 5%','VENDOR') ON CONFLICT (code) DO NOTHING`);
    console.log('✅ Tolerance Groups ensured');
  } catch (e: any) { console.warn('Tolerance failed:', e.message); }

  // 17. Auto Account Determination – FIXED: use correct enum INV_POSTING etc + fallback to legacy fi_auto_account_determination
  try {
    // Check what enum values exist
    try {
      const enumRes = await db.execute(sql`SELECT unnest(enum_range(NULL::fin_auto_posting_key)) as val`);
      console.log(`   fin_auto_posting_key enum values: ${(enumRes.rows as any[]).map(r=>r.val).join(', ')}`);
    } catch {}

    const glMap: Record<string,string> = {};
    try {
      const glRes = await db.execute(sql`SELECT id, account_number FROM fin_ledger_account WHERE chart_id=${coaId}`);
      for (const r of glRes.rows as any[]) glMap[r.account_number] = r.id;
    } catch {}

    // Mapping: BSX -> INV_POSTING, WRX -> GR_IR_CLEARING, GBB -> INV_OFFSET, PRD -> PRICE_DIFF, KDM -> FREIGHT or TAX? Use FREIGHT for KDM as fallback
    const autoRules = [
      ['INV_POSTING','RAW',glMap['1000000001'] || null,'BSX RAW → Inventory RAW – TEST – FIXED – INV_POSTING'],
      ['GR_IR_CLEARING','RAW',glMap['2000000000'] || null,'WRX RAW → GR/IR – TEST – FIXED – GR_IR_CLEARING'],
      ['INV_OFFSET','',glMap['4000000000'] || null,'GBB → Consumption – TEST – FIXED – INV_OFFSET'],
      ['PRICE_DIFF','RAW',glMap['4000000001'] || null,'PRD RAW → Price Diff – TEST – FIXED – PRICE_DIFF'],
      ['FREIGHT','',glMap['4000002000'] || null,'KDM → Exchange Diff – TEST – FIXED – FREIGHT as KDM fallback'],
    ];

    // Try new table fin_auto_posting_rule first
    let newTableWorks = true;
    try {
      await db.execute(sql`SELECT 1 FROM fin_auto_posting_rule LIMIT 1`);
    } catch {
      newTableWorks = false;
      console.log('   fin_auto_posting_rule table not found – will try legacy fi_auto_account_determination');
    }

    if (newTableWorks) {
      for (const [tKey, valClass, glId, desc] of autoRules) {
        if (!glId) {
          console.warn(`   Skip auto rule ${tKey} – GL not found`);
          continue;
        }
        try {
          // Check if exists
          const exists = await db.execute(sql`SELECT id FROM fin_auto_posting_rule WHERE legal_entity_id=${legalEntityId} AND transaction_key=${tKey}::fin_auto_posting_key AND COALESCE(inventory_valuation_class,'')=COALESCE(${valClass || null},'') LIMIT 1`);
          if (exists.rows.length === 0) {
            await db.execute(sql`
              INSERT INTO fin_auto_posting_rule (legal_entity_id, transaction_key, inventory_valuation_class, ledger_account_id, description)
              VALUES (${legalEntityId}, ${tKey}::fin_auto_posting_key, ${valClass || null}, ${glId}, ${desc})
            `);
            console.log(`   Inserted auto rule ${tKey} -> ${glId}`);
          } else {
            console.log(`   Auto rule ${tKey} exists – skip`);
          }
        } catch (inner: any) {
          console.warn(`   Auto rule ${tKey} failed:`, inner.message, inner.cause || '');
          // Try without legal_entity_id unique – maybe company_code_id needed
          try {
            await db.execute(sql`
              INSERT INTO fin_auto_posting_rule (legal_entity_id, transaction_key, inventory_valuation_class, ledger_account_id, description)
              VALUES (${legalEntityId}, ${tKey}::fin_auto_posting_key, ${valClass || null}, ${glId}, ${desc})
              ON CONFLICT DO NOTHING
            `);
          } catch {}
        }
      }
      console.log('✅ Auto Account Determination ensured – FIXED – INV_POSTING/GR_IR_CLEARING/INV_OFFSET/PRICE_DIFF/FREIGHT – OBYC mapping');
    } else {
      // Legacy table fi_auto_account_determination with BSX/WRX/GBB/PRD/KDM directly
      try {
        await db.execute(sql`CREATE TABLE IF NOT EXISTS fi_auto_account_determination (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_code_id uuid, transaction_key varchar(10) NOT NULL, valuation_class varchar(20), gl_account_id uuid, description text, UNIQUE(company_code_id, transaction_key, valuation_class))`);
        const legacyRules = [
          ['BSX','RAW',glMap['1000000001'] || null,'BSX RAW → Inventory RAW – TEST – LEGACY'],
          ['WRX','RAW',glMap['2000000000'] || null,'WRX RAW → GR/IR – TEST – LEGACY'],
          ['GBB','',glMap['4000000000'] || null,'GBB → Consumption – TEST – LEGACY'],
          ['PRD','RAW',glMap['4000000001'] || null,'PRD RAW → Price Diff – TEST – LEGACY'],
          ['KDM','',glMap['4000002000'] || null,'KDM → Exchange Diff – TEST – LEGACY'],
        ];
        for (const [tKey, valClass, glId, desc] of legacyRules) {
          if (!glId) continue;
          await db.execute(sql`
            INSERT INTO fi_auto_account_determination (company_code_id, transaction_key, valuation_class, gl_account_id, description)
            VALUES (${legalEntityId}, ${tKey}, ${valClass || null}, ${glId}, ${desc})
            ON CONFLICT DO NOTHING
          `);
        }
        console.log('✅ Auto Account Determination ensured – LEGACY table fi_auto_account_determination – BSX/WRX/GBB/PRD/KDM');
      } catch (e: any) {
        console.warn('Legacy auto account also failed:', e.message);
      }
    }
  } catch (e: any) { console.warn('Auto Account failed:', e.message, e.cause || ''); }

  // 18. Movement Types
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_movement_type (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(10) UNIQUE NOT NULL, name varchar(100) NOT NULL, description text, plus_minus varchar(1) DEFAULT '+', account_modifier varchar(10), is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO fin_movement_type (code, name, plus_minus, account_modifier) VALUES ('101','Goods Receipt','+','BSX'), ('102','GR Reversal','-','BSX'), ('261','GI to Prod Order','-','GBB'), ('601','GI for Sales Delivery PGI','-','GBB'), ('602','Reverse GI Sales','+','GBB'), ('122','Return to Vendor','-','WRX') ON CONFLICT (code) DO NOTHING`);
    console.log('✅ Movement Types ensured – 101/102/261/601/602/122');
  } catch (e: any) { console.warn('Movement Types failed:', e.message); }

  // 19. Tax Codes
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_tax_rule (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(20) UNIQUE NOT NULL, description varchar(150) NOT NULL, rate numeric NOT NULL, type varchar(20) NOT NULL, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO fin_tax_rule (code, description, rate, type) VALUES ('GST0','GST 0%',0,'OUTPUT'), ('GST5','GST 5%',5,'OUTPUT'), ('GST12','GST 12%',12,'OUTPUT'), ('GST18','GST 18%',18,'OUTPUT'), ('GST28','GST 28%',28,'OUTPUT'), ('IGST18','IGST 18%',18,'OUTPUT') ON CONFLICT (code) DO NOTHING`);
    console.log('✅ Tax Codes ensured');
  } catch (e: any) { console.warn('Tax Codes failed:', e.message); }

  // 20. Cost Centers – FIXED: requires controlAreaId
  try {
    // Ensure org_cost_unit table exists with required columns
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_cost_unit (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, legal_entity_id uuid NOT NULL, control_area_id uuid NOT NULL, parent_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, description text, responsible_id uuid, valid_from timestamp DEFAULT NOW(), valid_to timestamp, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW(), UNIQUE(control_area_id, code))`);

    if (!controlAreaId) {
      console.warn('   No controlAreaId – cannot create cost centers – trying to find existing');
      const caRes = await db.execute(sql`SELECT id FROM org_mgmt_control_area WHERE tenant_id=${tenantId} LIMIT 1`);
      controlAreaId = (caRes.rows[0] as any)?.id || null;
    }

    if (controlAreaId && tenantId && legalEntityId) {
      const costCenters = [
        ['CC-1000','Production Cost Center – Main'],
        ['CC-KITCHEN-01','Main Kitchen'],
        ['CC-SALES-01','Sales'],
        ['CC-ADMIN-01','Administration'],
      ];
      for (const [code, name] of costCenters) {
        const exists = await db.execute(sql`SELECT id FROM org_cost_unit WHERE control_area_id=${controlAreaId} AND code=${code} LIMIT 1`);
        if (exists.rows.length === 0) {
          await db.execute(sql`
            INSERT INTO org_cost_unit (tenant_id, legal_entity_id, control_area_id, code, name)
            VALUES (${tenantId}, ${legalEntityId}, ${controlAreaId}, ${code}, ${name})
          `);
          console.log(`   Inserted cost center ${code}`);
        } else {
          console.log(`   Cost center ${code} exists – skip`);
        }
      }
      console.log('✅ Cost Centers ensured – FIXED – with controlAreaId CA-1000');
    } else {
      console.warn('   Missing tenantId/legalEntityId/controlAreaId – cannot create cost centers');
    }
  } catch (e: any) { console.warn('Cost Centers failed:', e.message, e.cause || ''); }

  // 21. Roles
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS ent_role (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(50) UNIQUE NOT NULL, name varchar(100) NOT NULL, description text, permissions jsonb DEFAULT '[]', created_at timestamp DEFAULT NOW())`);
    const roles = [
      ['ERP_ADMIN','ERP Admin – Super Admin','Full access – TEST – FIXED'],
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
    console.log('✅ Roles ensured – 17 roles');
  } catch (e: any) { console.warn('Roles failed:', e.message); }

  // 22. Users
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
    console.log('✅ Users ensured – 16 users – password User@123');
  } catch (e: any) { console.warn('Users failed:', e.message); }

  await ensureAdmin();

  console.log('');
  console.log('✅✅✅ TEST ONLY – Fictional Company Setup Complete – FIXED ✅✅✅');
  console.log('   NOT part of production auto-migration – manual after build only');
  console.log('   Tenant: TEN-100, CG: ECGC-FMCG-01 INR/IN/EN, Legal: 1000 FMCG India Pvt Ltd');
  console.log('   Facility: FAC-1000, Locations: 0001/0002 (RAW_ZONE/FINISHED_ZONE), Sales: CO-1000/SC-10/PL-10');
  console.log('   K4 Apr-Mar year_dependent false calendar_year false 12 periods, FSSV-1000, PPV-1000, CRED-1000, CA-IN-01 EN');
  console.log('   12 GLs BSX/WRX/GBB/PRD/KOFI/KDM etc, 17 roles, 16 users, Controlling Area CA-1000, Cost Centers CC-1000 etc');
  console.log('   Auto Accounts: INV_POSTING/GR_IR_CLEARING/INV_OFFSET/PRICE_DIFF/FREIGHT (BSX/WRX/GBB/PRD/KDM mapping) – FIXED');
  console.log('   Next: Login as different users and test PR→IV, SD, PP, FICO, HR, Audit manually');
  console.log('');
}

setupFictionalCompany()
  .then(()=>process.exit(0))
  .catch(e=>{
    console.error('❌ Setup failed:', e);
    process.exit(1);
  });
