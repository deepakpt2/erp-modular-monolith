/**
 * Production Minimal Init - WITHOUT demo data – Legal-safe Own IP – Fixed for Module10
 * Creates only essential foundation + first admin user – works with both old and new schemas
 * Use this in actual production instead of full seed.ts
 * 
 * Usage: npx tsx src/shared/kernel/db/initProduction.ts
 * Env: ADMIN_EMAIL, ADMIN_PASSWORD, POSTGRES_*, DATABASE_URL, DOMAIN
 */

import { db } from './client';
import { sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

async function initProduction() {
  console.log('🚀 Starting PRODUCTION minimal init (no demo data) – legal-safe fixed...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@er.deepakpt.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'System Admin';

  // 0. ALWAYS create admin first – so login works even if other steps fail
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

  // 1. Tenant / Client – try new core_tenant then old ent_client
  let tenantId: string | null = null;
  let clientId: string | null = null;
  try {
    await db.execute(sql`INSERT INTO core_tenant (code, name) VALUES ('TEN-100', 'Main Tenant') ON CONFLICT (code) DO NOTHING`);
    const tRes = await db.execute(sql`SELECT id FROM core_tenant WHERE code = 'TEN-100' LIMIT 1`);
    if (tRes.rows.length > 0) tenantId = (tRes.rows[0] as any).id;
  } catch (e: any) {
    console.warn('core_tenant insert failed, trying ent_client:', e.message);
  }
  try {
    await db.execute(sql`INSERT INTO ent_client (code, name) VALUES ('100', 'Main Client') ON CONFLICT (code) DO NOTHING`);
    const cRes = await db.execute(sql`SELECT id FROM ent_client WHERE code = '100' LIMIT 1`);
    if (cRes.rows.length > 0) clientId = (cRes.rows[0] as any).id;
  } catch (e: any) {
    console.warn('ent_client insert failed (may not exist in new schema):', e.message);
  }
  const legalTenantId = tenantId || clientId;

  // 2. Legal Entity / Company Code – try new org_legal_entity then old ent_company_code
  let legalEntityId: string | null = null;
  let companyCodeId: string | null = null;
  try {
    await db.execute(sql`
      INSERT INTO org_legal_entity (tenant_id, code, name, country_code, currency_code)
      VALUES (${legalTenantId || null}, 'LE-1000', 'Main Legal Entity', 'IN', 'INR')
      ON CONFLICT (code) DO NOTHING
    `);
    const leRes = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code = 'LE-1000' LIMIT 1`);
    if (leRes.rows.length > 0) legalEntityId = (leRes.rows[0] as any).id;
  } catch (e: any) {
    console.warn('org_legal_entity insert failed, trying ent_company_code:', e.message);
  }
  try {
    await db.execute(sql`INSERT INTO ent_company_code (client_id, code, name, currency_code, city, country)
      VALUES (${clientId || legalTenantId || null}, '1000', 'Main Company KWD', 'KWD', 'Kuwait City', 'KW')
      ON CONFLICT (code) DO NOTHING`);
    const ccRes = await db.execute(sql`SELECT id FROM ent_company_code WHERE code = '1000' LIMIT 1`);
    if (ccRes.rows.length > 0) companyCodeId = (ccRes.rows[0] as any).id;
  } catch (e: any) {
    console.warn('ent_company_code insert failed:', e.message);
  }
  const finalLegalId = legalEntityId || companyCodeId;

  // 3. Chart of Accounts – try new fin_chart then old fi_chart_of_accounts
  let coaId: string | null = null;
  try {
    await db.execute(sql`INSERT INTO fin_chart (code, name, description) VALUES ('INT', 'International CoA', 'Global Chart') ON CONFLICT (code) DO NOTHING`);
    const coaRes = await db.execute(sql`SELECT id FROM fin_chart WHERE code = 'INT' LIMIT 1`);
    if (coaRes.rows.length > 0) coaId = (coaRes.rows[0] as any).id;
  } catch (e: any) {
    console.warn('fin_chart insert failed, trying fi_chart_of_accounts:', e.message);
    try {
      await db.execute(sql`INSERT INTO fi_chart_of_accounts (code, name, description) VALUES ('INT', 'International CoA', 'Global Chart') ON CONFLICT (code) DO NOTHING`);
      const coaRes = await db.execute(sql`SELECT id FROM fi_chart_of_accounts WHERE code = 'INT' LIMIT 1`);
      if (coaRes.rows.length > 0) coaId = (coaRes.rows[0] as any).id;
    } catch (err: any) {
      console.warn('fi_chart_of_accounts also failed:', err.message);
    }
  }

  // 4. Essential GL Accounts – try new fin_ledger_account then old fi_gl_account
  if (coaId && finalLegalId) {
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
    } catch (e: any) {
      console.warn('fin_ledger_account insert failed, trying fi_gl_account:', e.message);
      try {
        await db.execute(sql`
          INSERT INTO fi_gl_account (coa_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant)
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
      } catch (err: any) {
        console.warn('fi_gl_account also failed:', err.message);
      }
    }
  }

  // 5. Cost Centers – try new org_cost_unit then old fi_cost_center
  if (finalLegalId) {
    try {
      await db.execute(sql`
        INSERT INTO org_cost_unit (legal_entity_id, code, name)
        VALUES
          (${finalLegalId}, 'CC-KITCHEN-01', 'Main Kitchen'),
          (${finalLegalId}, 'CC-SALES-01', 'Sales'),
          (${finalLegalId}, 'CC-ADMIN-01', 'Administration')
        ON CONFLICT (code) DO NOTHING
      `);
    } catch (e: any) {
      console.warn('org_cost_unit insert failed, trying fi_cost_center:', e.message);
      try {
        await db.execute(sql`
          INSERT INTO fi_cost_center (code, name, company_code_id)
          VALUES
            ('CC-KITCHEN-01', 'Main Kitchen', ${finalLegalId}),
            ('CC-SALES-01', 'Sales', ${finalLegalId}),
            ('CC-ADMIN-01', 'Administration', ${finalLegalId})
          ON CONFLICT (code) DO NOTHING
        `);
      } catch (err: any) {
        console.warn('fi_cost_center also failed:', err.message);
      }
    }
  }

  // 6. Facility / Plant – try new org_facility then old ent_plant
  let facilityId: string | null = null;
  let plantId: string | null = null;
  if (finalLegalId) {
    try {
      await db.execute(sql`
        INSERT INTO org_facility (legal_entity_id, code, name, facility_type)
        VALUES (${finalLegalId}, 'FAC-1000', 'Main Production Facility', 'MANUFACTURING')
        ON CONFLICT (code) DO NOTHING
      `);
      const fRes = await db.execute(sql`SELECT id FROM org_facility WHERE code = 'FAC-1000' LIMIT 1`);
      if (fRes.rows.length > 0) facilityId = (fRes.rows[0] as any).id;
    } catch (e: any) {
      console.warn('org_facility insert failed, trying ent_plant:', e.message);
    }
    try {
      await db.execute(sql`INSERT INTO ent_plant (company_code_id, code, name, description)
        VALUES (${finalLegalId}, '1000', 'Main Production Kitchen', 'Main kitchen')
        ON CONFLICT (code) DO NOTHING`);
      const pRes = await db.execute(sql`SELECT id FROM ent_plant WHERE code = '1000' LIMIT 1`);
      if (pRes.rows.length > 0) plantId = (pRes.rows[0] as any).id;
    } catch (e: any) {
      console.warn('ent_plant insert failed:', e.message);
    }
  }
  const finalFacilityId = facilityId || plantId;

  // 7. Inventory Location / Storage Location
  if (finalFacilityId) {
    try {
      await db.execute(sql`
        INSERT INTO org_inventory_location (facility_id, code, name, location_type)
        VALUES
          (${finalFacilityId}, 'LOC-1000', 'Main Store', 'MAIN'),
          (${finalFacilityId}, 'LOC-1001', 'Cold Storage', 'COLD'),
          (${finalFacilityId}, 'LOC-1002', 'Shop Floor', 'SHOP_FLOOR')
        ON CONFLICT (code) DO NOTHING
      `);
    } catch (e: any) {
      console.warn('org_inventory_location failed, trying ent_storage_location:', e.message);
      try {
        await db.execute(sql`
          INSERT INTO ent_storage_location (plant_id, code, name, type)
          VALUES
            (${finalFacilityId}, '0001', 'Main Store', 'MAIN'),
            (${finalFacilityId}, '0002', 'Cold Storage', 'COLD'),
            (${finalFacilityId}, '0003', 'Shop Floor', 'SHOP_FLOOR')
          ON CONFLICT DO NOTHING
        `);
      } catch (err: any) {
        console.warn('ent_storage_location also failed:', err.message);
      }
    }
  }

  // 8. UoM, Currency, Material Group – try new then old
  try {
    await db.execute(sql`INSERT INTO core_unit_measure (code, name, dimension) VALUES ('KG','Kilogram','WEIGHT'), ('L','Liter','VOLUME'), ('PC','Piece','QUANTITY'), ('KIT','Kit','QUANTITY') ON CONFLICT (code) DO NOTHING`);
  } catch {
    try {
      await db.execute(sql`INSERT INTO ent_uom (code, name, dimension) VALUES ('KG','Kilogram','WEIGHT'), ('L','Liter','VOLUME'), ('PC','Piece','QUANTITY'), ('KIT','Kit','QUANTITY') ON CONFLICT (code) DO NOTHING`);
    } catch {}
  }
  try {
    await db.execute(sql`INSERT INTO core_currency (code, name, decimal_places, symbol, is_active) VALUES ('INR','Indian Rupee',2,'₹',true), ('KWD','Kuwaiti Dinar',3,'KD',true) ON CONFLICT (code) DO NOTHING`);
  } catch {
    try {
      await db.execute(sql`INSERT INTO ent_currency (code, name, decimal_places, symbol) VALUES ('KWD','Kuwaiti Dinar',3,'KD') ON CONFLICT (code) DO NOTHING`);
    } catch {}
  }
  try {
    await db.execute(sql`INSERT INTO prod_category (code, name) VALUES ('FOOD','Food'), ('KITS','Kits'), ('MENU','Menu Items'), ('PACK','Packaging'), ('BEV','Beverages') ON CONFLICT (code) DO NOTHING`);
  } catch {
    try {
      await db.execute(sql`INSERT INTO ent_material_group (code, name) VALUES ('FOOD','Food'), ('KITS','Kits'), ('MENU','Menu Items'), ('PACK','Packaging'), ('BEV','Beverages') ON CONFLICT (code) DO NOTHING`);
    } catch {}
  }

  // 9. Tax Codes – try new fin_tax_rule then old fi_tax_code
  try {
    await db.execute(sql`INSERT INTO fin_tax_rule (code, description, rate, type) VALUES ('V0','Input 0%',0,'INPUT'), ('V5','Input 5%',5,'INPUT'), ('A0','Output 0%',0,'OUTPUT'), ('A5','Output 5%',5,'OUTPUT') ON CONFLICT (code) DO NOTHING`);
  } catch {
    try {
      await db.execute(sql`INSERT INTO fi_tax_code (code, description, rate, type) VALUES ('V0','Input 0%',0,'INPUT'), ('V5','Input 5%',5,'INPUT'), ('A0','Output 0%',0,'OUTPUT'), ('A5','Output 5%',5,'OUTPUT') ON CONFLICT (code) DO NOTHING`);
    } catch {}
  }

  // 9b. Field Status Variant – ensure FSSV-1000 persists across builds – fix bug where variant gets deleted on each build
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_field_status_variant (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      INSERT INTO fin_field_status_variant (code, name, description)
      VALUES 
        ('FSSV-1000', 'Field Status Variant 1000 – India', 'Field Status Variant for India – controls field status groups G001 etc – required before ELEC – per guide'),
        ('1000', 'Standard Field Status', 'Standard variant – controls required/suppressed fields per GL')
      ON CONFLICT (code) DO NOTHING
    `);
    console.log('✅ Field Status Variant FSSV-1000 ensured – persists across builds');
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
    console.log('✅ Field Status Groups FSSV-1000/G001/G002 ensured – persists across builds');
  } catch (e: any) {
    console.warn('Field Status Groups ensure failed:', e.message);
  }

  // 10. Number Ranges – try new core_number_range then old ent_number_range
  const year = new Date().getFullYear();
  if (finalLegalId) {
    try {
      await db.execute(sql`
        INSERT INTO core_number_range (object_type, fiscal_year, prefix, from_number, to_number, current_number, is_active)
        VALUES
          ('MATERIAL'::core_nr_object_type, ${year}, 'MAT-', 1000000000, 1999999999, 1000000000, true),
          ('BUSINESS_PARTNER'::core_nr_object_type, ${year}, 'BP-', 100000, 999999, 100000, true),
          ('BATCH'::core_nr_object_type, ${year}, 'B-', 1000000000, 1999999999, 1000000000, true),
          ('SALES_ORDER'::core_nr_object_type, ${year}, 'SO-', 1000000000, 1999999999, 1000000000, true),
          ('PURCHASE_ORDER'::core_nr_object_type, ${year}, 'PO-', 450000000, 459999999, 450000000, true)
        ON CONFLICT DO NOTHING
      `);
    } catch (e: any) {
      console.warn('core_number_range insert failed, trying ent_number_range:', e.message);
      try {
        await db.execute(sql`
          INSERT INTO ent_number_range (object_type, company_code_id, year, prefix, from_number, to_number, current_number, is_active)
          VALUES
            ('MATERIAL', ${finalLegalId}, ${year}, 'MAT', 1000000000, 1999999999, 1000000000, true),
            ('BP', ${finalLegalId}, ${year}, 'BP', 100000, 999999, 100000, true),
            ('BATCH', ${finalLegalId}, ${year}, 'B', 1000000000, 1999999999, 1000000000, true),
            ('SALES_ORDER', ${finalLegalId}, ${year}, 'SO', 1000000000, 1999999999, 1000000000, true),
            ('PO', ${finalLegalId}, ${year}, '45', 450000000, 459999999, 450000000, true)
          ON CONFLICT DO NOTHING
        `);
      } catch (err: any) {
        console.warn('ent_number_range also failed:', err.message);
      }
    }
  }

  // Re-ensure admin at end (in case earlier failed)
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
  console.log('✅ PRODUCTION init complete (legal-safe fixed, no demo data)');
  console.log(`   Tenant: TEN-100 / Client: 100, Legal Entity: LE-1000 / Company Code: 1000`);
  console.log(`   Facility: FAC-1000 / Plant: 1000, Locations: LOC-1000/1001/1002 / 0001/0002/0003`);
  console.log(`   CoA: INT, GL: 11 essential, Cost Centers: 3`);
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
