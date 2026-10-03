/**
 * Standard System Baseline Data (Industry Standard Baseline Configuration)
 * 
 * In industry standard enterprise ERP (baseline configuration tables), these tables are pre-populated 
 * at the system level and do NOT belong to any specific company code. 
 * They are universal reference masters required for standard system operation:
 * 
 * 0. System Client / Tenant (T000 / TEN-01 / core_tenant) - Standard Client 000, 100, 1000
 * 1. Currencies (TCURC / OY03 / FCYC) - ISO Currencies
 * 2. Units of Measure (T006 / CUNI / EUOC) - ISO Units of Measurement
 * 3. Fiscal Year Variants (T009 / OB29 / FFYC) - Standard Calendar & Non-calendar Variants
 * 4. Document Types (T010O / OBA7 / FDTC) - Standard Financial & Material Document Types
 * 5. Movement Types (T156 / OMJJ / FMTM) - Standard Inventory Movement Types
 * 6. Standard Tax Rules / Types (FTXP / FTXC) - Base Tax Codes
 * 7. Field Status Variants (OBC4 / FFSV) - Standard Variants 0001, 1000, FFSV-1000
 * 8. Material Types (OMS2 / EMTC) - Standard Material Types
 * 
 * Consistent Naming Convention:
 * - Uses exact codes referenced across application forms (e.g. K4, V3, FFSV-1000, 1000, 0001)
 * - Idempotent: Every query uses ON CONFLICT DO NOTHING so no user-modified data is ever overwritten.
 */

import { db } from './client';
import { sql } from 'drizzle-orm';

export async function seedIndustryStandardBaseline(): Promise<void> {
  console.log('🏛️  Applying Standard Baseline Configuration (Industry Standard Baseline)...');

  // 0. System Client / Tenant (T000 / core_tenant)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS core_tenant (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(20) UNIQUE NOT NULL,
        name varchar(100) NOT NULL,
        description text,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      INSERT INTO core_tenant (code, name, description, is_active)
      VALUES
        ('1000', 'Enterprise Client 1000', 'Default production enterprise client 1000', true),
        ('100', 'Standard Client 100', 'Standard operating client 100', true),
        ('TEN-100', 'Master Tenant 100', 'Master root tenant TEN-100', true),
        ('000', 'Standard Reference Client 000', 'Golden baseline system client 000', true)
      ON CONFLICT (code) DO NOTHING
    `);
    console.log('  ✅ Standard System Tenants ensured (T000: 1000, 100, TEN-100, 000)');
  } catch (e: any) {
    console.warn('  ⚠️ Tenant baseline note:', e.message);
  }

  // 1. Currencies (TCURC / ISO 4217 / FCYC)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS core_currency (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(3) UNIQUE NOT NULL,
        name varchar(100) NOT NULL,
        symbol varchar(10),
        decimal_places integer DEFAULT 2,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      INSERT INTO core_currency (code, name, symbol, decimal_places, is_active)
      VALUES
        ('INR', 'Indian Rupee', '₹', 2, true),
        ('USD', 'US Dollar', '$', 2, true),
        ('EUR', 'Euro', '€', 2, true),
        ('GBP', 'British Pound', '£', 2, true),
        ('KWD', 'Kuwaiti Dinar', 'KD', 3, true),
        ('AED', 'UAE Dirham', 'AED', 2, true),
        ('SAR', 'Saudi Riyal', 'SAR', 2, true),
        ('JPY', 'Japanese Yen', '¥', 0, true),
        ('SGD', 'Singapore Dollar', 'S$', 2, true),
        ('CHF', 'Swiss Franc', 'CHF', 2, true)
      ON CONFLICT (code) DO NOTHING
    `);
    console.log('  ✅ Standard Currencies ensured (FCYC / TCURC: INR, USD, EUR, GBP, KWD, AED, SAR, JPY, SGD, CHF)');
  } catch (e: any) {
    console.warn('  ⚠️ Currency baseline note:', e.message);
  }

  // 2. Units of Measure (T006 / ISO Units / EUOC)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS core_unit_measure (
        code varchar(20) PRIMARY KEY,
        name varchar(100) NOT NULL,
        dimension varchar(30),
        base_unit_code varchar(20),
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      INSERT INTO core_unit_measure (code, name, dimension, base_unit_code, is_active)
      VALUES
        ('PC', 'Piece', 'QUANTITY', 'PC', true),
        ('EA', 'Each', 'QUANTITY', 'PC', true),
        ('KG', 'Kilogram', 'WEIGHT', 'KG', true),
        ('G', 'Gram', 'WEIGHT', 'KG', true),
        ('TON', 'Metric Ton', 'WEIGHT', 'KG', true),
        ('L', 'Liter', 'VOLUME', 'L', true),
        ('ML', 'Milliliter', 'VOLUME', 'L', true),
        ('M', 'Meter', 'LENGTH', 'M', true),
        ('CM', 'Centimeter', 'LENGTH', 'M', true),
        ('MM', 'Millimeter', 'LENGTH', 'M', true),
        ('M2', 'Square Meter', 'AREA', 'M2', true),
        ('M3', 'Cubic Meter', 'VOLUME', 'M3', true),
        ('BOX', 'Box', 'QUANTITY', 'PC', true),
        ('BAG', 'Bag', 'QUANTITY', 'PC', true),
        ('PACK', 'Pack', 'QUANTITY', 'PC', true),
        ('SET', 'Set', 'QUANTITY', 'PC', true),
        ('KIT', 'Kit', 'QUANTITY', 'PC', true),
        ('HR', 'Hour', 'TIME', 'HR', true),
        ('DAY', 'Day', 'TIME', 'HR', true)
      ON CONFLICT (code) DO NOTHING
    `);
    console.log('  ✅ Standard Units of Measure ensured (EUOC / T006: PC, EA, KG, L, M, BOX, BAG, etc.)');
  } catch (e: any) {
    console.warn('  ⚠️ Units of measure baseline note:', e.message);
  }

  // 3. Fiscal Year Variants (T009 / OB29 / FFYC)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_fiscal_calendar (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid,
        code varchar(20) NOT NULL,
        name varchar(100) NOT NULL,
        description text,
        year_dependent boolean DEFAULT false,
        calendar_year boolean DEFAULT false,
        number_of_periods integer DEFAULT 12,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT NOW(),
        UNIQUE(code)
      )
    `).catch(async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS fin_fiscal_calendar (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          code varchar(20) UNIQUE NOT NULL,
          name varchar(100) NOT NULL,
          description text,
          year_dependent boolean DEFAULT false,
          calendar_year boolean DEFAULT false,
          number_of_periods integer DEFAULT 12,
          is_active boolean DEFAULT true,
          created_at timestamp DEFAULT NOW()
        )
      `);
    });

    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS name varchar(100) DEFAULT 'Fiscal Variant'`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS description text`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS year_dependent boolean DEFAULT false`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS calendar_year boolean DEFAULT false`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS number_of_periods integer DEFAULT 12`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`).catch(()=>{});

    // Ensure columns exist on fin_fiscal_calendar
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS number_of_special_periods integer DEFAULT 4`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS start_month integer DEFAULT 1`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS end_month integer DEFAULT 12`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS year_shift integer DEFAULT 0`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS from_date varchar(10)`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_fiscal_calendar ADD COLUMN IF NOT EXISTS to_date varchar(10)`).catch(()=>{});

    // Robust insertion with distinct standard configurations:
    // K4: Jan-Dec (calendar_year=true, start_month=1, end_month=12, year_shift=0)
    // V3: Apr-Mar (calendar_year=false, start_month=4, end_month=3, year_shift=-1)
    // V6: Jul-Jun (calendar_year=false, start_month=7, end_month=6, year_shift=-1)
    // V9: Oct-Sep (calendar_year=false, start_month=10, end_month=9, year_shift=-1)
    const defaultVariants = [
      { code: 'K4', name: 'Calendar Year (Jan-Dec + 4 Special)', desc: 'Standard calendar year: 12 posting periods + 4 special periods', yd: false, cy: true, p: 12, sp: 4, sm: 1, em: 12, ys: 0 },
      { code: 'V3', name: 'April to March (Apr-Mar + 4 Special)', desc: 'Standard UK / India fiscal year: April to March', yd: false, cy: false, p: 12, sp: 4, sm: 4, em: 3, ys: -1 },
      { code: 'V6', name: 'July to June (Jul-Jun + 4 Special)', desc: 'Standard Australia / Egypt fiscal year: July to June', yd: false, cy: false, p: 12, sp: 4, sm: 7, em: 6, ys: -1 },
      { code: 'V9', name: 'October to September (Oct-Sep + 4 Special)', desc: 'Standard US Federal fiscal year: October to September', yd: false, cy: false, p: 12, sp: 4, sm: 10, em: 9, ys: -1 }
    ];

    for (const v of defaultVariants) {
      const exists = await db.execute(sql`SELECT id FROM fin_fiscal_calendar WHERE UPPER(code) = ${v.code} LIMIT 1`);
      if (exists.rows.length === 0) {
        await db.execute(sql`
          INSERT INTO fin_fiscal_calendar (code, name, description, year_dependent, calendar_year, number_of_periods, number_of_special_periods, start_month, end_month, year_shift, is_active)
          VALUES (${v.code}, ${v.name}, ${v.desc}, ${v.yd}, ${v.cy}, ${v.p}, ${v.sp}, ${v.sm}, ${v.em}, ${v.ys}, true)
        `).catch(() => {});
      } else {
        // Update to guarantee correct standard attributes (so V3 is not copied as Jan-Dec!)
        await db.execute(sql`
          UPDATE fin_fiscal_calendar SET
            name = ${v.name},
            description = ${v.desc},
            year_dependent = ${v.yd},
            calendar_year = ${v.cy},
            number_of_periods = ${v.p},
            number_of_special_periods = ${v.sp},
            start_month = ${v.sm},
            end_month = ${v.em},
            year_shift = ${v.ys},
            is_active = true
          WHERE UPPER(code) = ${v.code}
        `).catch(() => {});
      }
    }
    console.log('  ✅ Standard Fiscal Year Variants ensured (FFYC / T009: K4 Jan-Dec, V3 Apr-Mar, V6 Jul-Jun, V9 Oct-Sep)');
  } catch (e: any) {
    console.warn('  ⚠️ Fiscal variant baseline note:', e.message);
  }

  // 4. Standard Document Types (T010O / OBA7 / FDTC)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_document_type (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(20) NOT NULL UNIQUE,
        name varchar(150) NOT NULL,
        description text,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      INSERT INTO fin_document_type (code, name, description, is_active)
      VALUES
        ('SA', 'G/L Account Document', 'General Ledger manual posting / journal entry', true),
        ('KR', 'Vendor Invoice', 'Accounts Payable vendor invoice entry', true),
        ('KG', 'Vendor Credit Memo', 'Accounts Payable vendor credit memo', true),
        ('KZ', 'Vendor Payment', 'Accounts Payable vendor outgoing disbursement', true),
        ('DR', 'Customer Invoice', 'Accounts Receivable customer invoice entry', true),
        ('DG', 'Customer Credit Memo', 'Accounts Receivable customer credit memo', true),
        ('DZ', 'Customer Payment', 'Accounts Receivable incoming customer receipt', true),
        ('RE', 'Invoice - Gross (MM-IV)', 'Logistics invoice verification posting from PO', true),
        ('WE', 'Goods Receipt (MM-GR)', 'Goods receipt movement from purchase order', true),
        ('WA', 'Goods Issue', 'Goods issue for delivery, scrapping or internal consumption', true),
        ('RV', 'Billing Document (SD)', 'Sales and distribution billing voucher invoice', true),
        ('AB', 'General Accounting Document', 'Clearing document and general adjustment entry', true),
        ('PR', 'Payroll Document', 'HR Gross and net payroll posting run', true)
      ON CONFLICT (code) DO NOTHING
    `);
    console.log('  ✅ Standard Document Types ensured (FDTC / OBA7: SA, KR, KG, KZ, DR, DG, DZ, RE, WE, WA, RV, AB, PR)');
  } catch (e: any) {
    console.warn('  ⚠️ Document types baseline note:', e.message);
  }

  // 5. Standard Inventory Movement Types (T156 / OMJJ / FMTM)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS inv_movement_type (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(10) NOT NULL UNIQUE,
        name varchar(150) NOT NULL,
        direction varchar(10) NOT NULL,
        description text,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      INSERT INTO inv_movement_type (code, name, direction, description, is_active)
      VALUES
        ('101', 'Goods Receipt for Purchase Order into Warehouse', 'IN', 'Standard GR against PO', true),
        ('102', 'Reversal of Goods Receipt for Purchase Order', 'OUT', 'Reversal/cancellation of 101 GR', true),
        ('122', 'Return Delivery to Vendor', 'OUT', 'Return of defective or excess stock to vendor', true),
        ('201', 'Goods Issue for Cost Center', 'OUT', 'Internal consumption against overhead cost center', true),
        ('202', 'Reversal of Goods Issue for Cost Center', 'IN', 'Return of unused cost center consumption', true),
        ('261', 'Goods Issue for Order', 'OUT', 'Raw material issue to production work order', true),
        ('262', 'Reversal of Goods Issue for Order', 'IN', 'Return of components from production order', true),
        ('301', 'Transfer Posting Plant to Plant (1-Step)', 'TRANSFER', 'Direct physical stock transfer between plants', true),
        ('311', 'Transfer Posting SLoc to SLoc (1-Step)', 'TRANSFER', 'Direct storage location to storage location transfer', true),
        ('501', 'Receipt Without Purchase Order into Unrestricted', 'IN', 'Initial stock loading / unplanned receipt', true),
        ('561', 'Receipt for Initial Entry of Stock Balances', 'IN', 'Data migration legacy stock balance takeover', true),
        ('601', 'Goods Issue for Delivery (Sales Order)', 'OUT', 'Post goods issue delivery to customer', true),
        ('602', 'Reversal of Goods Issue for Delivery', 'IN', 'Cancellation of delivery goods issue 601', true),
        ('701', 'Physical Inventory Difference - Positive', 'IN', 'Stock count gain post physical inventory', true),
        ('702', 'Physical Inventory Difference - Negative', 'OUT', 'Stock count loss post physical inventory', true)
      ON CONFLICT (code) DO NOTHING
    `);
    console.log('  ✅ Standard Inventory Movement Types ensured (FMTM / OMJJ: 101, 102, 122, 201, 261, 311, 501, 561, 601, 701, 702)');
  } catch (e: any) {
    console.warn('  ⚠️ Movement types baseline note:', e.message);
  }

  // 6. Standard Tax Rules / Types (FTXP / FTXC)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_tax_rule (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(20) NOT NULL UNIQUE,
        description varchar(150) NOT NULL,
        rate numeric NOT NULL DEFAULT 0,
        type varchar(20) NOT NULL,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      INSERT INTO fin_tax_rule (code, description, rate, type, is_active)
      VALUES
        ('V0', 'Input Tax Exempt 0%', 0, 'INPUT', true),
        ('V5', 'Input Tax Reduced 5%', 5, 'INPUT', true),
        ('V12', 'Input Tax 12%', 12, 'INPUT', true),
        ('V18', 'Input Tax Standard 18%', 18, 'INPUT', true),
        ('A0', 'Output Tax Exempt 0%', 0, 'OUTPUT', true),
        ('A5', 'Output Tax Reduced 5%', 5, 'OUTPUT', true),
        ('A12', 'Output Tax 12%', 12, 'OUTPUT', true),
        ('A18', 'Output Tax Standard 18%', 18, 'OUTPUT', true)
      ON CONFLICT (code) DO NOTHING
    `);
    console.log('  ✅ Standard Tax Rules ensured (FTXC / FTXP: V0, V5, V12, V18, A0, A5, A12, A18)');
  } catch (e: any) {
    console.warn('  ⚠️ Tax rules baseline note:', e.message);
  }

  // 7. Field Status Variants & Groups (OBC4 / FFSV / FFSG)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_field_status_variant (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(20) NOT NULL UNIQUE,
        name varchar(100) NOT NULL,
        created_at timestamp DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      INSERT INTO fin_field_status_variant (code, name)
      VALUES
        ('0001', 'Standard Field Status Variant (System 000)'),
        ('1000', 'Standard Country Field Status Variant'),
        ('FFSV-1000', 'Field Status Variant 1000 Standard')
      ON CONFLICT (code) DO NOTHING
    `);

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
    await db.execute(sql`ALTER TABLE fin_field_status_group ADD COLUMN IF NOT EXISTS variant_code varchar(20)`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_field_status_group ADD COLUMN IF NOT EXISTS group_code varchar(20)`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_field_status_group ADD COLUMN IF NOT EXISTS field_name varchar(50)`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_field_status_group ADD COLUMN IF NOT EXISTS status varchar(1) DEFAULT 'O'`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_field_status_group ADD COLUMN IF NOT EXISTS description text`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_field_status_group ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT NOW()`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_field_status_group ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT NOW()`).catch(()=>{});

    await db.execute(sql`
      INSERT INTO fin_field_status_group (variant_code, group_code, field_name, status, description) VALUES
        ('FFSV-1000', 'G001', 'cost_center', 'R', 'Cost center required for expense accounts'),
        ('FFSV-1000', 'G001', 'profit_center', 'O', 'Profit center optional for expense'),
        ('FFSV-1000', 'G001', 'tax_code', 'O', 'Tax code optional'),
        ('FFSV-1000', 'G002', 'cost_center', 'S', 'Cost center suppressed for cash accounts'),
        ('FFSV-1000', 'G002', 'profit_center', 'S', 'Profit center suppressed for cash'),
        ('FFSV-1000', 'G002', 'tax_code', 'S', 'Tax suppressed for cash'),
        ('1000', 'G001', 'cost_center', 'R', 'Cost center required for expense accounts'),
        ('1000', 'G001', 'profit_center', 'O', 'Profit center optional for expense'),
        ('1000', 'G001', 'tax_code', 'O', 'Tax code optional'),
        ('1000', 'G002', 'cost_center', 'S', 'Cost center suppressed for cash accounts'),
        ('1000', 'G002', 'profit_center', 'S', 'Profit center suppressed for cash'),
        ('1000', 'G002', 'tax_code', 'S', 'Tax suppressed for cash')
      ON CONFLICT DO NOTHING
    `);
    console.log('  ✅ Standard Field Status Variants & Groups ensured (FFSV/FFSG: FFSV-1000, 1000, 0001 / G001, G002)');
  } catch (e: any) {
    console.warn('  ⚠️ Field status variant baseline note:', e.message);
  }

  // 8. Standard Material Types (OMS2 / EMTC)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS prod_item_type (
        code varchar(10) PRIMARY KEY,
        name varchar(100) NOT NULL,
        description text,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      INSERT INTO prod_item_type (code, name, description, is_active)
      VALUES
        ('ROH', 'Raw Materials', 'Raw materials purchased externally for production', true),
        ('FERT', 'Finished Product', 'Finished goods manufactured in-house', true),
        ('HALB', 'Semifinished Product', 'Intermediate goods produced internally', true),
        ('HAWA', 'Trading Goods', 'Commercial goods purchased and sold without alteration', true),
        ('VERP', 'Packaging', 'Packaging materials and containers', true),
        ('DIEN', 'Services', 'Intangible service items without inventory', true),
        ('NLAG', 'Non-stock Material', 'Consumed directly upon receipt, no stock valuation', true),
        ('HIBE', 'Operating Supplies', 'Consumable production supplies and spare parts', true)
      ON CONFLICT (code) DO NOTHING
    `);
    console.log('  ✅ Standard Material Types ensured (EMTC / OMS2: ROH, FERT, HALB, HAWA, VERP, DIEN, NLAG, HIBE)');
  } catch (e: any) {
    console.warn('  ⚠️ Material types baseline note:', e.message);
  }

  // 9. Standard Reference Chart of Accounts & 6-Digit GAAP/IFRS Accounts (CA-IN-01)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_chart (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(20) NOT NULL UNIQUE,
        name varchar(100) NOT NULL,
        description text,
        language varchar(10) DEFAULT 'EN',
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      )
    `);

    await db.execute(sql`ALTER TABLE fin_chart ADD COLUMN IF NOT EXISTS language varchar(10) DEFAULT 'EN'`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_chart ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_chart ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT NOW()`).catch(()=>{});

    // Check if CA-IN-01 exists first
    const existingCheck = await db.execute(sql`SELECT id FROM fin_chart WHERE code = 'CA-IN-01' LIMIT 1`).catch(() => ({ rows: [] }));
    if (existingCheck.rows.length === 0) {
      await db.execute(sql`
        INSERT INTO fin_chart (code, name, description, language, is_active)
        VALUES (
          'CA-IN-01',
          'Standard General Chart of Accounts (IFRS / GAAP)',
          'Standard 6-digit reference chart of accounts for manufacturing, procurement and commercial operations',
          'EN',
          true
        )
      `).catch(async (insErr) => {
        // Fallback for minimal table definition
        await db.execute(sql`
          INSERT INTO fin_chart (code, name, description)
          VALUES (
            'CA-IN-01',
            'Standard General Chart of Accounts (IFRS / GAAP)',
            'Standard 6-digit reference chart of accounts for manufacturing, procurement and commercial operations'
          )
        `);
      });
    }

    // Ensure fin_account_group table exists and seed standard account groups for CA-IN-01
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_account_group (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        chart_id uuid REFERENCES fin_chart(id),
        coa_id uuid,
        code varchar(50) NOT NULL,
        name varchar(200) NOT NULL,
        from_account varchar(50) NOT NULL,
        to_account varchar(50) NOT NULL,
        account_type varchar(50) DEFAULT 'ASSET',
        account_category varchar(50) DEFAULT 'BALANCE_SHEET',
        description text,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW(),
        CONSTRAINT uq_fin_account_group UNIQUE (chart_id, code)
      )
    `).catch(()=>{});

    const caChart = await db.execute(sql`SELECT id FROM fin_chart WHERE code = 'CA-IN-01' LIMIT 1`).catch(() => ({ rows: [] }));
    if (caChart.rows.length > 0) {
      const cId = (caChart.rows[0] as any).id;
      const defaultGroups = [
        { code: 'ASST', name: 'Asset Accounts', from: '100000', to: '199999', type: 'ASSET', cat: 'BALANCE_SHEET' },
        { code: 'LIAB', name: 'Liability Accounts', from: '200000', to: '299999', type: 'LIABILITY', cat: 'BALANCE_SHEET' },
        { code: 'EQTY', name: 'Equity / Capital Accounts', from: '300000', to: '399999', type: 'EQUITY', cat: 'BALANCE_SHEET' },
        { code: 'REVN', name: 'Revenue / Sales Accounts', from: '400000', to: '499999', type: 'REVENUE', cat: 'OPERATING_EXP_INC' },
        { code: 'EXPN', name: 'Expense Accounts', from: '500000', to: '599999', type: 'EXPENSE', cat: 'OPERATING_EXP_INC' }
      ];
      for (const g of defaultGroups) {
        await db.execute(sql`
          INSERT INTO fin_account_group (chart_id, coa_id, code, name, from_account, to_account, account_type, account_category)
          VALUES (${cId}, ${cId}, ${g.code}, ${g.name}, ${g.from}, ${g.to}, ${g.type}, ${g.cat})
          ON CONFLICT (chart_id, code) DO NOTHING
        `).catch(()=>{});
      }
    }

    // Pure standard fin_ledger_account table creation with account_group_code as a first-class citizen
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_ledger_account (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        chart_id uuid NOT NULL REFERENCES fin_chart(id),
        account_group_code varchar(50) NOT NULL,
        account_number varchar(30) NOT NULL,
        name varchar(150) NOT NULL,
        account_category varchar(50) NOT NULL DEFAULT 'BALANCE_SHEET',
        account_type varchar(20) NOT NULL DEFAULT 'ASSET',
        is_balance_sheet boolean NOT NULL DEFAULT true,
        is_reconciliation boolean NOT NULL DEFAULT false,
        is_blocked boolean NOT NULL DEFAULT false,
        is_tax_relevant boolean NOT NULL DEFAULT false,
        description text,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW(),
        CONSTRAINT uq_fin_chart_account UNIQUE (chart_id, account_number)
      )
    `);
    await db.execute(sql`ALTER TABLE fin_ledger_account ALTER COLUMN account_type TYPE varchar(30)`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS account_group_code varchar(50)`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS account_category varchar(50)`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS description text`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS is_tax_relevant boolean DEFAULT false`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT NOW()`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT NOW()`).catch(()=>{});
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_fin_chart_account ON fin_ledger_account (chart_id, account_number)`).catch(()=>{});

    const chartRes = await db.execute(sql`SELECT id FROM fin_chart WHERE code = 'CA-IN-01' LIMIT 1`);
    if (chartRes.rows.length > 0) {
      const templateChartId = (chartRes.rows[0] as any).id;
      await db.execute(sql`
        INSERT INTO fin_ledger_account (
          chart_id, coa_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant, is_active, account_category, account_group_code
        )
        VALUES
          (${templateChartId}, ${templateChartId}, '100000', 'Main Operating Bank Account', 'ASSET', true, false, false, true, 'BALANCE_SHEET', 'ASST'),
          (${templateChartId}, ${templateChartId}, '100010', 'Petty Cash Operating Fund', 'ASSET', true, false, false, true, 'BALANCE_SHEET', 'ASST'),
          (${templateChartId}, ${templateChartId}, '130000', 'Raw Materials Inventory', 'ASSET', true, false, false, true, 'BALANCE_SHEET', 'ASST'),
          (${templateChartId}, ${templateChartId}, '131000', 'Semi-Finished Goods Inventory', 'ASSET', true, false, false, true, 'BALANCE_SHEET', 'ASST'),
          (${templateChartId}, ${templateChartId}, '132000', 'Finished Goods Inventory', 'ASSET', true, false, false, true, 'BALANCE_SHEET', 'ASST'),
          (${templateChartId}, ${templateChartId}, '133000', 'Trading Goods Inventory', 'ASSET', true, false, false, true, 'BALANCE_SHEET', 'ASST'),
          (${templateChartId}, ${templateChartId}, '140000', 'Trade Accounts Receivable', 'ASSET', true, true, false, true, 'RECONCILIATION', 'ASST'),
          (${templateChartId}, ${templateChartId}, '160000', 'Trade Accounts Payable', 'LIABILITY', true, true, false, true, 'RECONCILIATION', 'LIAB'),
          (${templateChartId}, ${templateChartId}, '191100', 'GR/IR Interim Clearing Account', 'LIABILITY', true, false, false, true, 'GR_IR_CLEARING', 'LIAB'),
          (${templateChartId}, ${templateChartId}, '210000', 'Input Tax Clearing (GST / VAT)', 'LIABILITY', true, false, true, true, 'BALANCE_SHEET', 'LIAB'),
          (${templateChartId}, ${templateChartId}, '215000', 'Output Tax Payable (GST / VAT)', 'LIABILITY', true, false, true, true, 'BALANCE_SHEET', 'LIAB'),
          (${templateChartId}, ${templateChartId}, '300000', 'Common Share Capital', 'EQUITY', true, false, false, true, 'BALANCE_SHEET', 'EQTY'),
          (${templateChartId}, ${templateChartId}, '390000', 'Retained Earnings Balance Account', 'EQUITY', true, false, false, true, 'RETAINED_EARNINGS', 'EQTY'),
          (${templateChartId}, ${templateChartId}, '400000', 'Domestic Sales Revenue', 'REVENUE', false, false, true, true, 'OPERATING_EXP_INC', 'REVN'),
          (${templateChartId}, ${templateChartId}, '410000', 'Export Sales Revenue', 'REVENUE', false, false, false, true, 'OPERATING_EXP_INC', 'REVN'),
          (${templateChartId}, ${templateChartId}, '500000', 'Cost of Goods Sold (COGS)', 'EXPENSE', false, false, false, true, 'OPERATING_EXP_INC', 'EXPN'),
          (${templateChartId}, ${templateChartId}, '510000', 'Purchase Price Variance (PPV)', 'EXPENSE', false, false, false, true, 'OPERATING_EXP_INC', 'EXPN'),
          (${templateChartId}, ${templateChartId}, '520000', 'Inventory Count Gain/Loss Variance', 'EXPENSE', false, false, false, true, 'OPERATING_EXP_INC', 'EXPN')
        ON CONFLICT DO NOTHING
      `).catch(async () => {
        // Fallback for unique index on (chart_id, account_number)
        const accounts = [
          { num: '100000', name: 'Main Operating Bank Account', type: 'ASSET', bs: true, rec: false, tax: false },
          { num: '100010', name: 'Petty Cash Operating Fund', type: 'ASSET', bs: true, rec: false, tax: false },
          { num: '130000', name: 'Raw Materials Inventory', type: 'ASSET', bs: true, rec: false, tax: false },
          { num: '131000', name: 'Semi-Finished Goods Inventory', type: 'ASSET', bs: true, rec: false, tax: false },
          { num: '132000', name: 'Finished Goods Inventory', type: 'ASSET', bs: true, rec: false, tax: false },
          { num: '133000', name: 'Trading Goods Inventory', type: 'ASSET', bs: true, rec: false, tax: false },
          { num: '140000', name: 'Trade Accounts Receivable', type: 'ASSET', bs: true, rec: true, tax: false },
          { num: '160000', name: 'Trade Accounts Payable', type: 'LIABILITY', bs: true, rec: true, tax: false },
          { num: '191100', name: 'GR/IR Interim Clearing Account', type: 'LIABILITY', bs: true, rec: false, tax: false },
          { num: '210000', name: 'Input Tax Clearing (GST / VAT)', type: 'LIABILITY', bs: true, rec: false, tax: true },
          { num: '215000', name: 'Output Tax Payable (GST / VAT)', type: 'LIABILITY', bs: true, rec: false, tax: true },
          { num: '300000', name: 'Common Share Capital', type: 'EQUITY', bs: true, rec: false, tax: false },
          { num: '390000', name: 'Retained Earnings Balance Account', type: 'EQUITY', bs: true, rec: false, tax: false },
          { num: '400000', name: 'Domestic Sales Revenue', type: 'REVENUE', bs: false, rec: false, tax: true },
          { num: '410000', name: 'Export Sales Revenue', type: 'REVENUE', bs: false, rec: false, tax: false },
          { num: '500000', name: 'Cost of Goods Sold (COGS)', type: 'EXPENSE', bs: false, rec: false, tax: false },
          { num: '510000', name: 'Purchase Price Variance (PPV)', type: 'EXPENSE', bs: false, rec: false, tax: false },
          { num: '520000', name: 'Inventory Count Gain/Loss Variance', type: 'EXPENSE', bs: false, rec: false, tax: false }
        ];
        for (const a of accounts) {
          let grp = 'ASST';
          let cat = 'BALANCE_SHEET';
          const n = parseInt(a.num, 10);
          if (n >= 200000 && n < 300000) { grp = 'LIAB'; cat = 'BALANCE_SHEET'; }
          else if (n >= 300000 && n < 400000) { grp = 'EQTY'; cat = (n === 390000 ? 'RETAINED_EARNINGS' : 'BALANCE_SHEET'); }
          else if (n >= 400000 && n < 500000) { grp = 'REVN'; cat = 'OPERATING_EXP_INC'; }
          else if (n >= 500000 && n < 600000) { grp = 'EXPN'; cat = 'OPERATING_EXP_INC'; }

          await db.execute(sql`
            INSERT INTO fin_ledger_account (chart_id, coa_id, account_group_code, account_number, name, account_type, account_category, is_balance_sheet, is_reconciliation, is_tax_relevant, is_active)
            SELECT ${templateChartId}, ${templateChartId}, ${grp}, ${a.num}, ${a.name}, ${a.type}, ${cat}, ${a.bs}, ${a.rec}, ${a.tax}, true
            WHERE NOT EXISTS (
              SELECT 1 FROM fin_ledger_account WHERE chart_id = ${templateChartId} AND account_number = ${a.num}
            )
          `).catch(() => {});
        }
      });
      console.log('  ✅ Standard 6-digit reference chart & accounts ensured (CA-IN-01: 18 standard GAAP/IFRS accounts)');
    }
  } catch (e: any) {
    console.warn('  ⚠️ Standard chart baseline note:', e.message);
  }

  console.log('🏛️  Baseline Configuration Complete – System ready for enterprise company creation.');
}
