/**
 * Standard System Baseline Data (SAP Client 000 Standard Configuration)
 * 
 * In standard SAP (Client 000 baseline tables), these tables are pre-populated 
 * at the system level and do NOT belong to any specific company code. 
 * They are universal reference masters required for standard system operation:
 * 
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

export async function seedSapStandardBaseline(): Promise<void> {
  console.log('🏛️  Applying Standard Baseline Configuration (SAP Client 000 baseline)...');

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

    await db.execute(sql`
      INSERT INTO fin_fiscal_calendar (code, name, description, year_dependent, calendar_year, number_of_periods, is_active)
      VALUES
        ('K4', 'Calendar Year (Jan-Dec + 4 Special)', 'Standard calendar year: 12 posting periods + 4 special periods', false, true, 12, true),
        ('V3', 'April to March (Apr-Mar + 4 Special)', 'Standard UK / India fiscal year: April to March', false, false, 12, true),
        ('V6', 'July to June (Jul-Jun + 4 Special)', 'Standard Australia / Egypt fiscal year: July to June', false, false, 12, true),
        ('V9', 'October to September (Oct-Sep + 4 Special)', 'Standard US Federal fiscal year: October to September', false, false, 12, true)
      ON CONFLICT (code) DO NOTHING
    `).catch(async () => {
      await db.execute(sql`
        INSERT INTO fin_fiscal_calendar (code, name, description, year_dependent, calendar_year, number_of_periods, is_active)
        SELECT 'K4', 'Calendar Year (Jan-Dec + 4 Special)', 'Standard calendar year: 12 posting periods', false, true, 12, true
        WHERE NOT EXISTS (SELECT 1 FROM fin_fiscal_calendar WHERE code = 'K4')
      `);
      await db.execute(sql`
        INSERT INTO fin_fiscal_calendar (code, name, description, year_dependent, calendar_year, number_of_periods, is_active)
        SELECT 'V3', 'April to March (Apr-Mar + 4 Special)', 'Standard UK / India fiscal year: April to March', false, false, 12, true
        WHERE NOT EXISTS (SELECT 1 FROM fin_fiscal_calendar WHERE code = 'V3')
      `);
    });
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
      ON CONFLICT (variant_code, group_code, field_name) DO NOTHING
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

  console.log('🏛️  Baseline Configuration Complete – System ready for enterprise company creation.');
}
