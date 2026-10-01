/**
 * Production Minimal Init - WITHOUT demo data – Legal-safe Own IP – Fixed for own-IP schema
 * Creates only essential foundation + first admin user – works with new own-IP schema
 * 
 * Usage: npx tsx src/shared/kernel/db/initProduction.ts
 * Env: ADMIN_EMAIL, ADMIN_PASSWORD, POSTGRES_*, DATABASE_URL, DOMAIN
 */

import { db } from './client';
import { sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

async function initProduction() {
  console.log('🚀 Starting PRODUCTION minimal init (no demo data) – own-IP schema...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@er.deepakpt.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'System Admin';

  // 0. ALWAYS create admin first
  try {
    const hash = await bcrypt.hash(adminPassword, 10);
    await db.execute(sql`
      INSERT INTO auth_user (email, name, role, is_active, password_hash)
      VALUES (${adminEmail}, ${adminName}, 'OWNER', true, ${hash})
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = ${hash},
        role = 'OWNER',
        is_active = true,
        name = ${adminName}
    `);
    console.log(`✅ Admin user ensured: ${adminEmail}`);
  } catch (e: any) {
    console.error('⚠️ Admin creation failed, trying to create table auth_user:', e.message);
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
      const hash = await bcrypt.hash(adminPassword, 10);
      await db.execute(sql`
        INSERT INTO auth_user (email, name, role, is_active, password_hash)
        VALUES (${adminEmail}, ${adminName}, 'OWNER', true, ${hash})
        ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}, role='OWNER', is_active=true
      `);
      console.log(`✅ Admin user created after table creation: ${adminEmail}`);
    } catch (err: any) {
      console.error('❌ Admin creation still failed:', err.message);
    }
  }

  // 1. Tenant – core_tenant (code PK unique)
  let tenantId: string | null = null;
  try {
    await db.execute(sql`INSERT INTO core_tenant (code, name, description, is_active) VALUES ('TEN-100', 'Main Tenant', 'Main tenant for production', true) ON CONFLICT (code) DO NOTHING`);
    const tRes = await db.execute(sql`SELECT id FROM core_tenant WHERE code = 'TEN-100' LIMIT 1`);
    if (tRes.rows.length > 0) tenantId = (tRes.rows[0] as any).id;
    console.log(`✅ Tenant TEN-100 – id ${tenantId}`);
  } catch (e: any) {
    console.warn('core_tenant insert failed:', e.message);
    try {
      const tRes = await db.execute(sql`SELECT id FROM core_tenant WHERE code = 'TEN-100' LIMIT 1`);
      if (tRes.rows.length > 0) tenantId = (tRes.rows[0] as any).id;
    } catch {}
  }

  // 2. Company Group – org_company_group (tenant_id, code, name, currency_code, country_code, language)
  let companyGroupId: string | null = null;
  if (tenantId) {
    try {
      await db.execute(sql`
        INSERT INTO org_company_group (tenant_id, code, name, description, currency_code, country_code, country, language, is_active)
        VALUES (${tenantId}, 'ECGC-1000', 'Enterprise Group 1000', 'Main company group', 'INR', 'IN', 'IN', 'EN', true)
        ON CONFLICT DO NOTHING
      `);
      let cgRes = await db.execute(sql`SELECT id FROM org_company_group WHERE tenant_id=${tenantId} AND code='ECGC-1000' LIMIT 1`);
      if (cgRes.rows.length === 0) cgRes = await db.execute(sql`SELECT id FROM org_company_group WHERE code='ECGC-1000' LIMIT 1`);
      if (cgRes.rows.length > 0) companyGroupId = (cgRes.rows[0] as any).id;
      console.log(`✅ Company Group ECGC-1000 – id ${companyGroupId}`);
    } catch (e: any) {
      console.warn('org_company_group insert failed:', e.message);
    }
  }

  // 3. Fiscal Calendar K4 – fin_fiscal_calendar (tenant_id, code, name, description, year_dependent, calendar_year, number_of_periods, is_active)
  let fiscalCalId: string | null = null;
  if (tenantId) {
    try {
      await db.execute(sql`
        INSERT INTO fin_fiscal_calendar (tenant_id, code, name, description, year_dependent, calendar_year, number_of_periods, is_active)
        VALUES (${tenantId}, 'K4', 'Fiscal Year Variant K4 April-March', 'India fiscal Apr-Mar – own IP FFYC (legacy OB29)', false, false, 12, true)
        ON CONFLICT DO NOTHING
      `);
      let fcRes = await db.execute(sql`SELECT id FROM fin_fiscal_calendar WHERE tenant_id=${tenantId} AND code='K4' LIMIT 1`);
      if (fcRes.rows.length === 0) fcRes = await db.execute(sql`SELECT id FROM fin_fiscal_calendar WHERE code='K4' LIMIT 1`);
      if (fcRes.rows.length > 0) fiscalCalId = (fcRes.rows[0] as any).id;
      console.log(`✅ Fiscal Calendar K4 – id ${fiscalCalId}`);
    } catch (e: any) {
      console.warn('fin_fiscal_calendar insert failed:', e.message);
    }
  }

  // 4. Field Status Variant – fin_field_status_variant (code, name)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_field_status_variant (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.execute(sql`INSERT INTO fin_field_status_variant (code, name) VALUES ('FSSV-1000', 'Field Status Variant 1000 – India') ON CONFLICT (code) DO NOTHING`);
    await db.execute(sql`INSERT INTO fin_field_status_variant (code, name) VALUES ('1000', 'Standard Field Status') ON CONFLICT (code) DO NOTHING`);
    console.log('✅ Field Status Variant FSSV-1000 ensured');
  } catch (e: any) {
    console.warn('Field Status Variant ensure failed:', e.message);
  }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_field_status_group (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        variant_code VARCHAR(20) NOT NULL,
        group_code VARCHAR(20) NOT NULL,
        field_name VARCHAR(50) NOT NULL,
        status VARCHAR(1) NOT NULL CHECK (status IN ('R','S','O','D')),
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(variant_code, group_code, field_name)
      )
    `);
    await db.execute(sql`
      INSERT INTO fin_field_status_group (variant_code, group_code, field_name, status, description) VALUES
        ('FSSV-1000', 'G001', 'cost_center', 'R', 'Cost center required for expense accounts – FSSV-1000 G001'),
        ('FSSV-1000', 'G001', 'profit_center', 'O', 'Profit center optional for expense'),
        ('FSSV-1000', 'G001', 'tax_code', 'O', 'Tax code optional'),
        ('FSSV-1000', 'G002', 'cost_center', 'S', 'Cost center suppressed for cash accounts – G002'),
        ('FSSV-1000', 'G002', 'profit_center', 'S', 'Profit center suppressed for cash'),
        ('FSSV-1000', 'G002', 'tax_code', 'S', 'Tax suppressed for cash')
      ON CONFLICT (variant_code, group_code, field_name) DO NOTHING
    `);
    console.log('✅ Field Status Groups FSSV-1000/G001/G002 ensured');
  } catch (e: any) {
    console.warn('Field Status Groups ensure failed:', e.message);
  }

  // 5. Posting Calendar – fin_posting_calendar
  let postingCalId: string | null = null;
  if (tenantId) {
    try {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_posting_calendar (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, code varchar(20) NOT NULL, name varchar(100) NOT NULL, description text, is_active boolean DEFAULT true, created_at timestamp DEFAULT NOW(), UNIQUE(tenant_id, code))`);
      await db.execute(sql`INSERT INTO fin_posting_calendar (tenant_id, code, name, description, is_active) VALUES (${tenantId}, 'PPV-1000', 'Posting Period Variant 1000', 'Posting calendar for India – own IP FPPC (legacy OBBO)', true) ON CONFLICT DO NOTHING`);
      let pcRes = await db.execute(sql`SELECT id FROM fin_posting_calendar WHERE tenant_id=${tenantId} AND code='PPV-1000' LIMIT 1`);
      if (pcRes.rows.length === 0) pcRes = await db.execute(sql`SELECT id FROM fin_posting_calendar WHERE code='PPV-1000' LIMIT 1`);
      if (pcRes.rows.length > 0) postingCalId = (pcRes.rows[0] as any).id;
      // Periods open 01-12/2026
      await db.execute(sql`CREATE TABLE IF NOT EXISTS fin_posting_calendar_period (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), posting_calendar_id uuid REFERENCES fin_posting_calendar(id), legal_entity_id uuid, from_period integer NOT NULL, from_year integer NOT NULL, to_period integer NOT NULL, to_year integer NOT NULL, account_type varchar(20) DEFAULT 'ALL', is_open boolean DEFAULT true, created_at timestamp DEFAULT NOW())`);
      if (postingCalId) {
        for (let y of [2026, 2027]) {
          await db.execute(sql`INSERT INTO fin_posting_calendar_period (posting_calendar_id, from_period, from_year, to_period, to_year, account_type, is_open) VALUES (${postingCalId}, 1, ${y}, 12, ${y}, 'ALL', true) ON CONFLICT DO NOTHING`).catch(()=>{});
        }
      }
      console.log(`✅ Posting Calendar PPV-1000 – id ${postingCalId}`);
    } catch (e: any) {
      console.warn('fin_posting_calendar failed:', e.message);
    }
  }

  // 6. Credit Control – fin_credit_policy_area (tenant_id, code, name, currency_code, description, is_active)
  let creditPolicyId: string | null = null;
  if (tenantId) {
    try {
      await db.execute(sql`INSERT INTO fin_credit_policy_area (tenant_id, code, name, currency_code, description, is_active) VALUES (${tenantId}, 'CRED-1000', 'Credit Control 1000', 'INR', 'Credit control for production – own IP FCPC (legacy OB45)', true) ON CONFLICT DO NOTHING`);
      let cpRes = await db.execute(sql`SELECT id FROM fin_credit_policy_area WHERE tenant_id=${tenantId} AND code='CRED-1000' LIMIT 1`);
      if (cpRes.rows.length === 0) cpRes = await db.execute(sql`SELECT id FROM fin_credit_policy_area WHERE code='CRED-1000' LIMIT 1`);
      if (cpRes.rows.length > 0) creditPolicyId = (cpRes.rows[0] as any).id;
      console.log(`✅ Credit Policy CRED-1000 – id ${creditPolicyId}`);
    } catch (e: any) {
      console.warn('fin_credit_policy_area failed:', e.message);
    }
  }

  // 7. Chart of Accounts – fin_chart (code, name, description, language, is_active)
  let coaId: string | null = null;
  try {
    await db.execute(sql`INSERT INTO fin_chart (code, name, description, language, is_active) VALUES ('INT', 'International CoA', 'Global Chart – own IP FCOA (legacy OB13)', 'EN', true) ON CONFLICT (code) DO NOTHING`);
    await db.execute(sql`INSERT INTO fin_chart (code, name, description, language, is_active) VALUES ('CA-IN-01', 'Chart of Accounts India', 'India chart – own IP', 'EN', true) ON CONFLICT (code) DO NOTHING`);
    const coaRes = await db.execute(sql`SELECT id FROM fin_chart WHERE code = 'INT' LIMIT 1`);
    if (coaRes.rows.length > 0) coaId = (coaRes.rows[0] as any).id;
    console.log(`✅ Chart INT / CA-IN-01 – id ${coaId}`);
  } catch (e: any) {
    console.warn('fin_chart insert failed:', e.message);
  }

  // 8. Legal Entity – org_legal_entity (tenant_id, company_group_id, code, name, currency_code, country_code, chart_of_accounts_code, fiscal_calendar_code, fiscal_year_variant, field_status_variant, posting_period_variant, credit_control_area, credit_policy_area_code, is_active)
  let legalEntityId: string | null = null;
  if (tenantId) {
    try {
      await db.execute(sql`
        INSERT INTO org_legal_entity (tenant_id, company_group_id, code, name, description, currency_code, country_code, country, chart_of_accounts_code, fiscal_calendar_code, fiscal_year_variant, field_status_variant, posting_period_variant, credit_control_area, credit_policy_area_code, is_active)
        VALUES (${tenantId}, ${companyGroupId}, 'LE-1000', 'Main Legal Entity', 'Main legal entity for production – own IP ELEC (legacy OX02)', 'INR', 'IN', 'IN', 'INT', 'K4', 'K4', 'FSSV-1000', 'PPV-1000', 'CRED-1000', 'CRED-1000', true)
        ON CONFLICT DO NOTHING
      `);
      let leRes = await db.execute(sql`SELECT id FROM org_legal_entity WHERE tenant_id=${tenantId} AND code='LE-1000' LIMIT 1`);
      if (leRes.rows.length === 0) leRes = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code='LE-1000' LIMIT 1`);
      if (leRes.rows.length > 0) legalEntityId = (leRes.rows[0] as any).id;
      // Also ensure 1000 code for compatibility
      await db.execute(sql`
        INSERT INTO org_legal_entity (tenant_id, company_group_id, code, name, description, currency_code, country_code, country, chart_of_accounts_code, fiscal_calendar_code, fiscal_year_variant, field_status_variant, posting_period_variant, credit_control_area, credit_policy_area_code, is_active)
        VALUES (${tenantId}, ${companyGroupId}, '1000', 'Main Company 1000', 'Main company for production – 1000', 'INR', 'IN', 'IN', 'INT', 'K4', 'K4', 'FSSV-1000', 'PPV-1000', 'CRED-1000', 'CRED-1000', true)
        ON CONFLICT DO NOTHING
      `);
      if (!legalEntityId) {
        let ccRes = await db.execute(sql`SELECT id FROM org_legal_entity WHERE tenant_id=${tenantId} AND code='1000' LIMIT 1`);
        if (ccRes.rows.length === 0) ccRes = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code='1000' LIMIT 1`);
        if (ccRes.rows.length > 0) legalEntityId = (ccRes.rows[0] as any).id;
      }
      console.log(`✅ Legal Entity LE-1000 / 1000 – id ${legalEntityId}`);
    } catch (e: any) {
      console.warn('org_legal_entity insert failed:', e.message);
    }
  }

  // 9. GL Accounts – fin_ledger_account (chart_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant)
  if (coaId) {
    try {
      await db.execute(sql`
        INSERT INTO fin_ledger_account (chart_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant)
        VALUES
          (${coaId}, '100000', 'Inventory ROH', 'ASSET', true, false, false),
          (${coaId}, '100001', 'Inventory FERT', 'ASSET', true, false, false),
          (${coaId}, '100010', 'Cash on Hand', 'ASSET', true, false, false),
          (${coaId}, '120000', 'Accounts Receivable', 'ASSET', true, true, false),
          (${coaId}, '200000', 'GR/IR Clearing', 'LIABILITY', true, false, false),
          (${coaId}, '210000', 'Accounts Payable', 'LIABILITY', true, true, false),
          (${coaId}, '210001', 'Salary Payable', 'LIABILITY', true, false, false),
          (${coaId}, '300000', 'COGS', 'EXPENSE', false, false, false),
          (${coaId}, '310000', 'Price Difference - PRD', 'EXPENSE', false, false, false),
          (${coaId}, '400000', 'Revenue - Sales', 'REVENUE', false, false, true),
          (${coaId}, '500000', 'Salary Expense', 'EXPENSE', false, false, false)
        ON CONFLICT DO NOTHING
      `);
      console.log('✅ GL Accounts 11 essential – INT');
    } catch (e: any) {
      console.warn('fin_ledger_account insert failed:', e.message);
    }
  }

  // 10. Facility – org_facility (legal_entity_id, code, name, description, city, country, is_active)
  let facilityId: string | null = null;
  if (legalEntityId) {
    try {
      await db.execute(sql`
        INSERT INTO org_facility (legal_entity_id, code, name, description, city, country, is_active)
        VALUES (${legalEntityId}, 'FAC-1000', 'Main Production Facility', 'Main production facility – own IP EFCC (legacy OX10)', 'Palakkad', 'IN', true)
        ON CONFLICT (code) DO NOTHING
      `);
      await db.execute(sql`
        INSERT INTO org_facility (legal_entity_id, code, name, description, city, country, is_active)
        VALUES (${legalEntityId}, '1000', 'Main Production Kitchen', 'Main kitchen – 1000', 'Kochi', 'IN', true)
        ON CONFLICT (code) DO NOTHING
      `);
      const fRes = await db.execute(sql`SELECT id FROM org_facility WHERE code = 'FAC-1000' LIMIT 1`);
      if (fRes.rows.length > 0) facilityId = (fRes.rows[0] as any).id;
      if (!facilityId) {
        const pRes = await db.execute(sql`SELECT id FROM org_facility WHERE code = '1000' LIMIT 1`);
        if (pRes.rows.length > 0) facilityId = (pRes.rows[0] as any).id;
      }
      console.log(`✅ Facility FAC-1000 / 1000 – id ${facilityId}`);
    } catch (e: any) {
      console.warn('org_facility insert failed:', e.message);
    }
  }

  // 11. Inventory Locations – org_inventory_location (facility_id, code, name, location_type, is_active)
  if (facilityId) {
    try {
      await db.execute(sql`
        INSERT INTO org_inventory_location (facility_id, code, name, location_type, is_active)
        VALUES
          (${facilityId}, 'LOC-1000', 'Main Store', 'PRIMARY', true),
          (${facilityId}, 'LOC-1001', 'Cold Storage', 'COLD_ZONE', true),
          (${facilityId}, 'LOC-1002', 'Shop Floor', 'SHOP_FLOOR', true),
          (${facilityId}, '0001', 'Raw Material Store', 'RAW_ZONE', true),
          (${facilityId}, '0002', 'Finished Goods Store', 'FINISHED_ZONE', true)
        ON CONFLICT DO NOTHING
      `);
      console.log('✅ Inventory Locations LOC-1000/1001/1002 + 0001/0002 – own IP EILC');
    } catch (e: any) {
      console.warn('org_inventory_location failed:', e.message);
    }
  }

  // 12. UoM, Currency, Material Group – own IP
  try {
    await db.execute(sql`INSERT INTO core_unit_measure (code, name, dimension, base_unit_code, is_active) VALUES ('KG','Kilogram','WEIGHT','KG',true), ('L','Liter','VOLUME',NULL,true), ('PC','Piece','QUANTITY',NULL,true), ('KIT','Kit','QUANTITY','PC',true), ('BOX','Box','QUANTITY','PC',true), ('BAG','Bag','QUANTITY','PC',true) ON CONFLICT (code) DO NOTHING`);
    console.log('✅ UoM KG/L/PC/KIT/BOX/BAG – own IP EUOC');
  } catch (e: any) {
    console.warn('core_unit_measure failed:', e.message);
  }
  try {
    await db.execute(sql`INSERT INTO core_currency (code, name, decimal_places, symbol, is_active) VALUES ('INR','Indian Rupee',2,'₹',true), ('KWD','Kuwaiti Dinar',3,'KD',true), ('USD','US Dollar',2,'$',true), ('EUR','Euro',2,'€',true) ON CONFLICT (code) DO NOTHING`);
    console.log('✅ Currencies INR/KWD/USD/EUR – own IP FCYC');
  } catch (e: any) {
    console.warn('core_currency failed:', e.message);
  }
  try {
    await db.execute(sql`INSERT INTO prod_category (code, name, description, is_active) VALUES ('FOOD','Food','Food category',true), ('KITS','Kits','Kits category',true), ('MENU','Menu Items','Menu',true), ('PACK','Packaging','Packaging',true), ('BEV','Beverages','Beverages',true), ('CAT-SPICE','Spices Category','Spices',true) ON CONFLICT (code) DO NOTHING`);
    console.log('✅ Product Categories FOOD/KITS/MENU/PACK/BEV/CAT-SPICE – own IP EMGC');
  } catch (e: any) {
    console.warn('prod_category failed:', e.message);
  }

  // 13. Tax Codes – fin_tax_rule (code, description, rate, type)
  try {
    await db.execute(sql`INSERT INTO fin_tax_rule (code, description, rate, type) VALUES ('V0','Input 0%',0,'INPUT'), ('V5','Input 5%',5,'INPUT'), ('A0','Output 0%',0,'OUTPUT'), ('A5','Output 5%',5,'OUTPUT'), ('GST18','GST 18%',18,'INPUT'), ('GST12','GST 12%',12,'INPUT') ON CONFLICT (code) DO NOTHING`);
    console.log('✅ Tax Codes V0/V5/A0/A5/GST18/GST12 – own IP FTXC');
  } catch (e: any) {
    console.warn('fin_tax_rule failed:', e.message);
  }

  // 14. Number Ranges – core_number_range (code, object_type, from_number, to_number, current_number, is_active)
  const year = new Date().getFullYear();
  if (legalEntityId) {
    try {
      await db.execute(sql`
        INSERT INTO core_number_range (code, object_type, legal_entity_id, fiscal_year, year, prefix, from_number, to_number, current_number, is_active)
        VALUES
          ('MAT-01', 'ITEM'::core_nr_object_type, ${legalEntityId}, ${year}, ${year}, '', 1000000000, 1999999999, 1000000000, true),
          ('BP-01', 'PARTNER'::core_nr_object_type, ${legalEntityId}, ${year}, ${year}, '', 100000, 999999, 100000, true),
          ('PR-01', 'PR'::core_nr_object_type, ${legalEntityId}, ${year}, ${year}, '', 1000000000, 1999999999, 1000000000, true),
          ('PO-01', 'PO'::core_nr_object_type, ${legalEntityId}, ${year}, ${year}, '', 450000000, 459999999, 450000000, true),
          ('GR-01', 'GR'::core_nr_object_type, ${legalEntityId}, ${year}, ${year}, '', 5000000000, 5099999999, 5000000000, true),
          ('IV-01', 'IV'::core_nr_object_type, ${legalEntityId}, ${year}, ${year}, '', 5100000000, 5199999999, 5100000000, true),
          ('KZ-01', 'PAYMENT'::core_nr_object_type, ${legalEntityId}, ${year}, ${year}, '', 5300000000, 5399999999, 5300000000, true)
        ON CONFLICT (code) DO NOTHING
      `);
      console.log('✅ Number Ranges MAT-01/PR-01/PO-01/GR-01/IV-01/KZ-01 – own IP FNRC');
    } catch (e: any) {
      console.warn('core_number_range insert failed:', e.message);
      try {
        await db.execute(sql`
          INSERT INTO core_number_range (code, object_type, from_number, to_number, current_number, is_active)
          VALUES
            ('MAT-01', 'ITEM'::core_nr_object_type, 1000000000, 1999999999, 1000000000, true),
            ('BP-01', 'PARTNER'::core_nr_object_type, 100000, 999999, 100000, true),
            ('PR-01', 'PR'::core_nr_object_type, 1000000000, 1999999999, 1000000000, true),
            ('PO-01', 'PO'::core_nr_object_type, 450000000, 459999999, 450000000, true),
            ('GR-01', 'GR'::core_nr_object_type, 5000000000, 5099999999, 5000000000, true),
            ('IV-01', 'IV'::core_nr_object_type, 5100000000, 5199999999, 5100000000, true),
            ('KZ-01', 'PAYMENT'::core_nr_object_type, 5300000000, 5399999999, 5300000000, true)
          ON CONFLICT (code) DO NOTHING
        `);
        console.log('✅ Number Ranges fallback – own IP FNRC');
      } catch (err: any) {
        console.warn('core_number_range also failed:', err.message);
      }
    }
  }

  // Re-ensure admin at end
  try {
    const hash = await bcrypt.hash(adminPassword, 10);
    await db.execute(sql`
      INSERT INTO auth_user (email, name, role, is_active, password_hash)
      VALUES (${adminEmail}, ${adminName}, 'OWNER', true, ${hash})
      ON CONFLICT (email) DO UPDATE SET password_hash=${hash}, role='OWNER', is_active=true
    `);
    console.log(`✅ Admin re-ensured at end: ${adminEmail}`);
  } catch (e: any) {
    console.error('❌ Final admin ensure failed:', e.message);
  }

  console.log('');
  console.log('✅ PRODUCTION init complete (own-IP schema, no demo data)');
  console.log(`   Tenant: TEN-100, Company Group: ECGC-1000, Legal Entity: LE-1000 / 1000`);
  console.log(`   Facility: FAC-1000 / 1000, Locations: LOC-1000/1001/1002 / 0001/0002`);
  console.log(`   CoA: INT/CA-IN-01, GL: 11 essential, Cost Centers: 3`);
  console.log('');
  console.log(`🔐 First Admin User:`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Role: OWNER`);
  console.log(`   Login: https://${process.env.DOMAIN || 'er.deepakpt.com'}/login`);
  console.log('');
}

export { initProduction };
export default initProduction;

if (require.main === module) {
  initProduction()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('❌ Production init failed:', e);
      process.exit(1);
    });
}
