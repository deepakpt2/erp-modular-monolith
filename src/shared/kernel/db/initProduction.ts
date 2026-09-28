/**
 * Production Minimal Init - WITHOUT demo data
 * Creates only essential foundation + first admin user
 * Use this in actual production instead of full seed.ts
 * 
 * Usage: npx tsx src/shared/kernel/db/initProduction.ts
 * Env: ADMIN_EMAIL, ADMIN_PASSWORD, POSTGRES_*, DATABASE_URL, DOMAIN
 */

import { db } from './client';
import { sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

async function initProduction() {
  console.log('🚀 Starting PRODUCTION minimal init (no demo data)...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@er.deepakpt.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'System Admin';

  // 1. Client
  await db.execute(sql`INSERT INTO ent_client (code, name) VALUES ('100', 'Main Client') ON CONFLICT (code) DO NOTHING`);
  const clientRes = await db.execute(sql`SELECT id FROM ent_client WHERE code = '100'`);
  const clientId = (clientRes.rows[0] as any).id;

  // 2. Company Code
  await db.execute(sql`INSERT INTO ent_company_code (client_id, code, name, currency_code, city, country)
    VALUES (${clientId}, '1000', 'Main Company KWD', 'KWD', 'Kuwait City', 'KW')
    ON CONFLICT (code) DO NOTHING`);
  const ccRes = await db.execute(sql`SELECT id FROM ent_company_code WHERE code = '1000'`);
  const companyCodeId = (ccRes.rows[0] as any).id;

  // 3. Chart of Accounts
  await db.execute(sql`INSERT INTO fi_chart_of_accounts (code, name, description)
    VALUES ('INT', 'International CoA', 'Global Chart of Accounts')
    ON CONFLICT (code) DO NOTHING`);
  const coaRes = await db.execute(sql`SELECT id FROM fi_chart_of_accounts WHERE code = 'INT'`);
  const coaId = (coaRes.rows[0] as any).id;
  await db.execute(sql`UPDATE ent_company_code SET coa_id = ${coaId} WHERE id = ${companyCodeId}`);

  // 4. Essential GL Accounts only (minimal for production)
  await db.execute(sql`INSERT INTO fi_gl_account (coa_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant)
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
      (${coaId}, '500000', 'Salary Expense', 'EXPENSE', false, false, false),
      (${coaId}, '500005', 'Inventory Loss / Shrinkage', 'EXPENSE', false, false, false),
      (${coaId}, '400002', 'Inventory Gain', 'REVENUE', false, false, false)
    ON CONFLICT DO NOTHING`);

  // 5. Cost Centers minimal
  await db.execute(sql`INSERT INTO fi_cost_center (code, name, company_code_id)
    VALUES
      ('CC-KITCHEN-01', 'Main Kitchen', ${companyCodeId}),
      ('CC-SALES-01', 'Sales', ${companyCodeId}),
      ('CC-ADMIN-01', 'Administration', ${companyCodeId})
    ON CONFLICT (code) DO NOTHING`);

  // 6. Plants
  await db.execute(sql`INSERT INTO ent_plant (company_code_id, code, name, description)
    VALUES (${companyCodeId}, '1000', 'Main Production Kitchen', 'Main kitchen')
    ON CONFLICT (code) DO NOTHING`);
  const plantRes = await db.execute(sql`SELECT id FROM ent_plant WHERE code = '1000'`);
  const plantId = (plantRes.rows[0] as any).id;

  // 7. Storage Locations
  await db.execute(sql`INSERT INTO ent_storage_location (plant_id, code, name, type)
    VALUES
      (${plantId}, '0001', 'Main Store', 'MAIN'),
      (${plantId}, '0002', 'Cold Storage', 'COLD'),
      (${plantId}, '0003', 'Shop Floor', 'SHOP_FLOOR')
    ON CONFLICT DO NOTHING`);

  // 8. UoM, Currency, Material Group
  await db.execute(sql`INSERT INTO ent_uom (code, name, dimension)
    VALUES ('KG','Kilogram','WEIGHT'), ('L','Liter','VOLUME'), ('PC','Piece','QUANTITY'), ('KIT','Kit','QUANTITY')
    ON CONFLICT (code) DO NOTHING`);
  await db.execute(sql`INSERT INTO ent_currency (code, name, decimal_places, symbol)
    VALUES ('KWD','Kuwaiti Dinar',3,'KD') ON CONFLICT (code) DO NOTHING`);
  await db.execute(sql`INSERT INTO ent_material_group (code, name)
    VALUES ('FOOD','Food'), ('KITS','Kits'), ('MENU','Menu Items'), ('PACK','Packaging'), ('BEV','Beverages')
    ON CONFLICT (code) DO NOTHING`);

  // 9. Tax Codes
  await db.execute(sql`INSERT INTO fi_tax_code (code, description, rate, type)
    VALUES ('V0','Input 0%',0,'INPUT'), ('V5','Input 5%',5,'INPUT'), ('A0','Output 0%',0,'OUTPUT'), ('A5','Output 5%',5,'OUTPUT')
    ON CONFLICT (code) DO NOTHING`);

  // 10. Number Ranges - must stay within INT4 max 2147483647
  const year = new Date().getFullYear();
  await db.execute(sql`INSERT INTO ent_number_range (object_type, company_code_id, year, prefix, from_number, to_number, current_number, is_active)
    VALUES
      ('MATERIAL', ${companyCodeId}, ${year}, 'MAT', 1000000000, 1999999999, 1000000000, true),
      ('BP', ${companyCodeId}, ${year}, 'BP', 100000, 999999, 100000, true),
      ('BATCH', ${companyCodeId}, ${year}, 'B', 1000000000, 1999999999, 1000000000, true),
      ('PR', ${companyCodeId}, ${year}, 'PR', 1000000000, 1999999999, 1000000000, true),
      ('PO', ${companyCodeId}, ${year}, '45', 450000000, 459999999, 450000000, true),
      ('GR', ${companyCodeId}, ${year}, '50', 500000000, 509999999, 500000000, true),
      ('IV', ${companyCodeId}, ${year}, '51', 510000000, 519999999, 510000000, true),
      ('FI_DOC', ${companyCodeId}, ${year}, '', 1000000000, 1999999999, 1000000000, true),
      ('SALES_ORDER', ${companyCodeId}, ${year}, 'SO', 1000000000, 1999999999, 1000000000, true),
      ('PI', ${companyCodeId}, ${year}, 'PI', 1000000000, 1999999999, 1000000000, true)
    ON CONFLICT DO NOTHING`);

  // 11. Auto Account Determination
  const glRes = await db.execute(sql`SELECT id, account_number FROM fi_gl_account WHERE coa_id = ${coaId}`);
  const glMap = new Map((glRes.rows as any[]).map((r: any) => [r.account_number, r.id]));
  const getGl = (num: string) => glMap.get(num);
  if (getGl('100000')) {
    await db.execute(sql`INSERT INTO fi_auto_account_determination (company_code_id, transaction_key, valuation_class, gl_account_id, description)
      VALUES
        (${companyCodeId}, 'BSX', 'ROH', ${getGl('100000')}, 'Inventory ROH'),
        (${companyCodeId}, 'BSX', 'FERT', ${getGl('100001')}, 'Inventory FERT'),
        (${companyCodeId}, 'WRX', 'ROH', ${getGl('200000')}, 'GR/IR ROH'),
        (${companyCodeId}, 'GBB', 'ROH', ${getGl('300000')}, 'COGS ROH'),
        (${companyCodeId}, 'PRD', 'ROH', ${getGl('310000')}, 'Price Diff ROH')
      ON CONFLICT DO NOTHING`);
  }

  // 12. First Admin User - THE ONLY USER IN PRODUCTION INIT
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

  console.log('');
  console.log('✅ PRODUCTION init complete (no demo data)');
  console.log(`   Client: 100, Company Code: 1000 KWD`);
  console.log(`   Plant: 1000 Main Kitchen, SLocs: 0001 Main, 0002 Cold, 0003 Shop Floor`);
  console.log(`   CoA: INT, GL Accounts: 13 essential, Cost Centers: 3`);
  console.log(`   Number Ranges: MATERIAL, BP, BATCH, PR, PO, GR, IV, FI_DOC, SALES_ORDER, PI`);
  console.log('');
  console.log(`🔐 First Admin User:`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Role: OWNER`);
  console.log(`   Login: https://${process.env.DOMAIN || 'er.deepakpt.com'}/login`);
  console.log('');
  console.log('   Next steps:');
  console.log('   1. Login with admin');
  console.log('   2. Create real materials, vendors, customers via UI');
  console.log('   3. Create employees and assign cost centers');
  console.log('   4. Change admin password immediately');
  console.log('   5. Delete .env demo passwords, set strong production passwords');
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
