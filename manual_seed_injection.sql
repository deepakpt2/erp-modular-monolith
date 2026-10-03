-- ==============================================================================
-- ERP MANUAL SEED INJECTION SCRIPT (Host / Debug Tool)
-- ==============================================================================
-- Can be executed from the host machine against PostgreSQL:
--
-- Example execution:
--   docker compose exec -T db psql -U erp_user -d erp_db < manual_seed_injection.sql
-- or:
--   psql -h localhost -p 5432 -U erp_user -d erp_db -f manual_seed_injection.sql
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- PRE-CHECK: Ensure baseline prerequisite tables exist
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core_tenant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(20) NOT NULL UNIQUE,
  name varchar(100) NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT NOW() NOT NULL,
  updated_at timestamp DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS org_company_group (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES core_tenant(id),
  code varchar(20) NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  currency_code varchar(3) DEFAULT 'INR',
  country_code varchar(2) DEFAULT 'IN',
  country varchar(2) DEFAULT 'IN',
  language varchar(10) DEFAULT 'EN',
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT NOW() NOT NULL,
  updated_at timestamp DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_org_company_group_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS org_legal_entity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES core_tenant(id),
  company_group_id uuid REFERENCES org_company_group(id),
  code varchar(20) NOT NULL,
  name varchar(100) NOT NULL,
  currency_code varchar(3) DEFAULT 'INR' NOT NULL,
  city varchar(100),
  country varchar(2) DEFAULT 'IN',
  country_code varchar(2) DEFAULT 'IN',
  address text,
  street varchar(200),
  postal_code varchar(20),
  region varchar(100),
  tax_id varchar(50),
  gst_number varchar(30),
  pan varchar(20),
  cin varchar(30),
  phone varchar(30),
  email varchar(100),
  website varchar(100),
  legal_form varchar(50),
  registration_number varchar(50),
  fiscal_calendar_code varchar(20) DEFAULT 'K4',
  fiscal_year_variant varchar(20) DEFAULT 'K4',
  chart_of_accounts_code varchar(20) DEFAULT 'CA-IN-01',
  field_status_variant varchar(20) DEFAULT 'FSSV-1000',
  posting_period_variant varchar(20) DEFAULT 'PPV-1000',
  credit_control_area varchar(20) DEFAULT 'CRED-1000',
  credit_policy_area_code varchar(20) DEFAULT 'CRED-1000',
  language varchar(10) DEFAULT 'EN',
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT NOW() NOT NULL,
  updated_at timestamp DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_org_legal_entity_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS org_mgmt_control_area (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES core_tenant(id),
  code varchar(20) NOT NULL,
  name varchar(100) NOT NULL,
  assignment_control varchar(1) DEFAULT '2' NOT NULL,
  currency_type varchar(10) DEFAULT '10' NOT NULL,
  currency_code varchar(3) DEFAULT 'INR' NOT NULL,
  chart_of_accounts_code varchar(20),
  fiscal_year_variant varchar(10) DEFAULT 'V3',
  cost_center_standard_hierarchy varchar(30),
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT NOW() NOT NULL,
  updated_at timestamp DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_org_control_area_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS org_facility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_entity_id uuid REFERENCES org_legal_entity(id),
  code varchar(20) NOT NULL UNIQUE,
  name varchar(100) NOT NULL,
  description text,
  address text,
  city varchar(100),
  country varchar(2),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT NOW() NOT NULL,
  updated_at timestamp DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS org_inventory_location (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES org_facility(id),
  code varchar(20) NOT NULL,
  name varchar(100) NOT NULL,
  location_type varchar(30) DEFAULT 'PRIMARY' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT NOW() NOT NULL,
  updated_at timestamp DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_org_inv_loc_facility_code UNIQUE (facility_id, code)
);

CREATE TABLE IF NOT EXISTS org_procurement_division (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES core_tenant(id),
  code varchar(20) NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT NOW() NOT NULL,
  updated_at timestamp DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_org_proc_div_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS org_commercial_org (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES core_tenant(id),
  legal_entity_id uuid REFERENCES org_legal_entity(id),
  code varchar(20) NOT NULL,
  name varchar(100) NOT NULL,
  currency_code varchar(3) DEFAULT 'INR' NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT NOW() NOT NULL,
  updated_at timestamp DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_org_commercial_org_tenant_code UNIQUE (tenant_id, code)
);

-- Central assignment schema tables
CREATE TABLE IF NOT EXISTS fin_company_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_code VARCHAR(20) NOT NULL UNIQUE,
  company_name VARCHAR(150),
  chart_of_accounts_code VARCHAR(20),
  country_chart_of_accounts_code VARCHAR(20),
  fiscal_year_variant_code VARCHAR(20),
  credit_control_area_code VARCHAR(20),
  posting_period_variant_code VARCHAR(20),
  field_status_variant_code VARCHAR(20),
  controlling_area_code VARCHAR(20),
  company_group_code VARCHAR(20),
  financial_mgmt_area_code VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_plant_company_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_code VARCHAR(20) NOT NULL,
  company_code VARCHAR(20) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plant_code, company_code)
);

CREATE TABLE IF NOT EXISTS org_purchasing_company_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchasing_org_code VARCHAR(20) NOT NULL,
  company_code VARCHAR(20) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(purchasing_org_code, company_code)
);

CREATE TABLE IF NOT EXISTS org_purchasing_plant_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchasing_org_code VARCHAR(20) NOT NULL,
  plant_code VARCHAR(20) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(purchasing_org_code, plant_code)
);

CREATE TABLE IF NOT EXISTS org_sales_company_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_org_code VARCHAR(20) NOT NULL,
  company_code VARCHAR(20) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sales_org_code, company_code)
);

CREATE TABLE IF NOT EXISTS fin_fiscal_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES core_tenant(id),
  code varchar(20) NOT NULL UNIQUE,
  name varchar(100) NOT NULL,
  description text,
  is_year_dependent boolean DEFAULT false NOT NULL,
  number_of_posting_periods integer DEFAULT 12 NOT NULL,
  number_of_special_periods integer DEFAULT 4 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS fin_posting_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES core_tenant(id),
  code varchar(20) NOT NULL UNIQUE,
  name varchar(100) NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT NOW() NOT NULL,
  updated_at timestamp DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fin_posting_calendar_period (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_calendar_id uuid REFERENCES fin_posting_calendar(id),
  variant_code varchar(20),
  account_type varchar(20) DEFAULT 'ALL' NOT NULL,
  from_period integer NOT NULL,
  from_year integer DEFAULT 2026,
  to_period integer NOT NULL,
  to_year integer DEFAULT 2026,
  is_open boolean DEFAULT true NOT NULL,
  description text,
  created_at timestamp DEFAULT NOW() NOT NULL,
  updated_at timestamp DEFAULT NOW() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_fin_posting_calendar_period_var ON fin_posting_calendar_period(posting_calendar_id, from_period, account_type);

CREATE TABLE IF NOT EXISTS fin_chart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(20) NOT NULL UNIQUE,
  name varchar(150) NOT NULL,
  description text,
  language varchar(10) DEFAULT 'EN' NOT NULL,
  gl_account_length integer DEFAULT 6 NOT NULL,
  controlling_integration varchar(20) DEFAULT 'MANUAL' NOT NULL,
  group_chart_of_accounts varchar(20),
  is_blocked boolean DEFAULT false NOT NULL,
  status varchar(20) DEFAULT 'ACTIVE' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT NOW() NOT NULL,
  updated_at timestamp DEFAULT NOW() NOT NULL
);

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
);

CREATE TABLE IF NOT EXISTS fin_retained_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id UUID REFERENCES fin_chart(id),
  chart_code VARCHAR(50),
  coa_id UUID,
  pl_account_type VARCHAR(10) DEFAULT 'X',
  account_number VARCHAR(30),
  retained_earnings_account VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE fin_retained_earnings ADD COLUMN IF NOT EXISTS chart_id UUID REFERENCES fin_chart(id);
ALTER TABLE fin_retained_earnings ADD COLUMN IF NOT EXISTS chart_code VARCHAR(50);
ALTER TABLE fin_retained_earnings ADD COLUMN IF NOT EXISTS coa_id UUID;
ALTER TABLE fin_retained_earnings ADD COLUMN IF NOT EXISTS pl_account_type VARCHAR(10) DEFAULT 'X';
ALTER TABLE fin_retained_earnings ADD COLUMN IF NOT EXISTS account_number VARCHAR(30);
ALTER TABLE fin_retained_earnings ADD COLUMN IF NOT EXISTS retained_earnings_account VARCHAR(50);
ALTER TABLE fin_retained_earnings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE fin_retained_earnings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
CREATE UNIQUE INDEX IF NOT EXISTS uq_fin_retained_chart_pl_account ON fin_retained_earnings (chart_id, pl_account_type);

CREATE TABLE IF NOT EXISTS core_number_range (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(50) NOT NULL DEFAULT '01',
  object_type varchar(50) NOT NULL,
  company_code varchar(20),
  plant_code varchar(20),
  controlling_area_code varchar(20),
  scope_level varchar(30) DEFAULT 'GLOBAL',
  legal_entity_id uuid REFERENCES org_legal_entity(id),
  company_code_id uuid,
  fiscal_year integer,
  year integer,
  prefix varchar(20) NOT NULL DEFAULT '',
  from_number bigint NOT NULL,
  to_number bigint NOT NULL,
  current_number bigint NOT NULL DEFAULT 0,
  description text,
  is_buffered boolean DEFAULT false NOT NULL,
  buffer_size integer DEFAULT 10,
  is_external boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT NOW() NOT NULL,
  updated_at timestamp DEFAULT NOW() NOT NULL
);

-- Ensure primary default tenant
INSERT INTO core_tenant (code, name, description)
VALUES ('DEFAULT', 'Default Enterprise Tenant', 'System Default Tenant')
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------------------------
-- STEP 1: Enterprise Structure - Financial Accounting (FI)
-- ------------------------------------------------------------------------------

-- 1. Define Company (OX15)
-- AMCO | Name: Aura Group India | Country: IN | Language: EN | Currency: INR
INSERT INTO org_company_group (tenant_id, code, name, country_code, country, currency_code, language, description)
SELECT 
  id, 
  'AMCO', 
  'Aura Group India', 
  'IN', 
  'IN', 
  'INR', 
  'EN', 
  'Aura Group India Trading Partner'
FROM core_tenant WHERE code = 'DEFAULT'
ON CONFLICT (tenant_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  country_code = EXCLUDED.country_code,
  country = EXCLUDED.country,
  currency_code = EXCLUDED.currency_code,
  language = EXCLUDED.language,
  updated_at = NOW();

-- 2. Define Company Code (OX02)
-- AM01 | Name: Aura Manufacturing Inc. | City: Mumbai | Country: IN | Currency: INR | Language: EN
INSERT INTO org_legal_entity (
  tenant_id, 
  company_group_id, 
  code, 
  name, 
  city, 
  country, 
  country_code, 
  currency_code, 
  language,
  description
)
SELECT 
  t.id,
  cg.id,
  'AM01',
  'Aura Manufacturing Inc.',
  'Mumbai',
  'IN',
  'IN',
  'INR',
  'EN',
  'Aura Manufacturing Inc. Company Code'
FROM core_tenant t
LEFT JOIN org_company_group cg ON cg.code = 'AMCO' AND cg.tenant_id = t.id
WHERE t.code = 'DEFAULT'
ON CONFLICT (tenant_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  country_code = EXCLUDED.country_code,
  currency_code = EXCLUDED.currency_code,
  language = EXCLUDED.language,
  company_group_id = EXCLUDED.company_group_id,
  updated_at = NOW();

-- ------------------------------------------------------------------------------
-- STEP 2: Enterprise Structure - Controlling (CO)
-- ------------------------------------------------------------------------------

-- 1. Maintain Controlling Area (OKKP)
-- AM01 | Name: Aura Controlling Area | Assignment Control: 1 | Currency Type: 10 | Currency: INR | FYV: V3 | Std Hierarchy: AM01
INSERT INTO org_mgmt_control_area (
  tenant_id,
  code,
  name,
  assignment_control,
  currency_type,
  currency_code,
  fiscal_year_variant,
  cost_center_standard_hierarchy,
  description
)
SELECT 
  id,
  'AM01',
  'Aura Controlling Area',
  '1',
  '10',
  'INR',
  'V3',
  'AM01',
  'Controlling Area for Aura Group'
FROM core_tenant WHERE code = 'DEFAULT'
ON CONFLICT (tenant_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  assignment_control = EXCLUDED.assignment_control,
  currency_type = EXCLUDED.currency_type,
  currency_code = EXCLUDED.currency_code,
  fiscal_year_variant = EXCLUDED.fiscal_year_variant,
  cost_center_standard_hierarchy = EXCLUDED.cost_center_standard_hierarchy,
  updated_at = NOW();

-- ------------------------------------------------------------------------------
-- STEP 3: Enterprise Structure - Logistics (MM)
-- ------------------------------------------------------------------------------

-- 1. Define Plant (OX10)
-- Plant: P001 | Name: Aura Manufacturing Plant | Country: IN | Region: 29 | Language: EN
INSERT INTO org_facility (code, name, country, city, description)
VALUES ('P001', 'Aura Manufacturing Plant', 'IN', 'Mumbai', 'Plant P001')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  country = EXCLUDED.country,
  city = EXCLUDED.city,
  updated_at = NOW();

-- 2. Define Storage Locations (OX09)
-- Plant P001 -> RM01 (Raw Materials Store) & FG01 (Finished Goods Store)
INSERT INTO org_inventory_location (facility_id, code, name, location_type)
SELECT f.id, 'RM01', 'Raw Materials Store', 'PRIMARY'
FROM org_facility f WHERE f.code = 'P001'
ON CONFLICT (facility_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

INSERT INTO org_inventory_location (facility_id, code, name, location_type)
SELECT f.id, 'FG01', 'Finished Goods Store', 'PRIMARY'
FROM org_facility f WHERE f.code = 'P001'
ON CONFLICT (facility_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- ------------------------------------------------------------------------------
-- STEP 4: Enterprise Structure - Purchasing & Sales
-- ------------------------------------------------------------------------------

-- 1. Define Purchasing Organization (OX08)
-- Purch. Org: P001 | Description: Aura Purchasing Org
INSERT INTO org_procurement_division (tenant_id, code, name, description)
SELECT id, 'P001', 'Aura Purchasing Org', 'Purchasing Organization P001'
FROM core_tenant WHERE code = 'DEFAULT'
ON CONFLICT (tenant_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 2. Define Sales Organization (OVX5 / OVX2)
-- Sales Org: S001 | Name: Aura Sales Org | Currency: INR
INSERT INTO org_commercial_org (tenant_id, code, name, currency_code, description)
SELECT id, 'S001', 'Aura Sales Org', 'INR', 'Sales Organization S001'
FROM core_tenant WHERE code = 'DEFAULT'
ON CONFLICT (tenant_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  currency_code = EXCLUDED.currency_code,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ------------------------------------------------------------------------------
-- STEP 5: Enterprise Structure - Assignments
-- ------------------------------------------------------------------------------

-- Ensure Company Code Assignment row exists
INSERT INTO fin_company_assignment (company_code, company_name, updated_at)
VALUES ('AM01', 'Aura Manufacturing Inc.', NOW())
ON CONFLICT (company_code) DO NOTHING;

-- 1. Assign Company Code to Controlling Area (OKKS / OKKP / OX19)
UPDATE fin_company_assignment
SET controlling_area_code = 'AM01', updated_at = NOW()
WHERE company_code = 'AM01';

-- 2. Assign Plant to Company Code (OX18)
INSERT INTO org_plant_company_assignment (plant_code, company_code, description, updated_at)
VALUES ('P001', 'AM01', 'Plant P001 to Company Code AM01', NOW())
ON CONFLICT (plant_code, company_code) DO UPDATE SET
  updated_at = NOW();

-- Also set foreign key reference on org_facility if applicable
UPDATE org_facility f
SET legal_entity_id = le.id
FROM org_legal_entity le
WHERE f.code = 'P001' AND le.code = 'AM01';

-- 3. Assign Purch. Org to Company Code (OX01)
INSERT INTO org_purchasing_company_assignment (purchasing_org_code, company_code, description, updated_at)
VALUES ('P001', 'AM01', 'Purchasing Org P001 to Company Code AM01', NOW())
ON CONFLICT (purchasing_org_code, company_code) DO UPDATE SET
  updated_at = NOW();

-- 4. Assign Purch. Org to Plant (OX17)
INSERT INTO org_purchasing_plant_assignment (purchasing_org_code, plant_code, description, updated_at)
VALUES ('P001', 'P001', 'Purchasing Org P001 to Plant P001', NOW())
ON CONFLICT (purchasing_org_code, plant_code) DO UPDATE SET
  updated_at = NOW();

-- 5. Assign Sales Org to Company Code (OVX3)
INSERT INTO org_sales_company_assignment (sales_org_code, company_code, description, updated_at)
VALUES ('S001', 'AM01', 'Sales Org S001 to Company Code AM01', NOW())
ON CONFLICT (sales_org_code, company_code) DO UPDATE SET
  updated_at = NOW();

-- ------------------------------------------------------------------------------
-- STEP 6: FI Global Settings (Fiscal Year & Posting Periods)
-- ------------------------------------------------------------------------------

-- Ensure Fiscal Year Variant V3 exists
INSERT INTO fin_fiscal_calendar (code, name, description, is_year_dependent, number_of_posting_periods, number_of_special_periods)
VALUES ('V3', 'April to March (4 Special Periods)', 'Standard Indian Fiscal Year (V3)', false, 12, 4)
ON CONFLICT (code) DO NOTHING;

-- Assign Fiscal Year Variant (OB37)
UPDATE fin_company_assignment
SET fiscal_year_variant_code = 'V3', updated_at = NOW()
WHERE company_code = 'AM01';

UPDATE org_legal_entity
SET fiscal_calendar_code = 'V3', fiscal_year_variant = 'V3', updated_at = NOW()
WHERE code = 'AM01';

-- Define Posting Period Variant (OBBO)
INSERT INTO fin_posting_calendar (code, name, description, updated_at)
VALUES ('AM01', 'Posting Period Variant for Aura', 'Posting Period Variant AM01', NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Assign Posting Period Variant (OBBP)
UPDATE fin_company_assignment
SET posting_period_variant_code = 'AM01', updated_at = NOW()
WHERE company_code = 'AM01';

UPDATE org_legal_entity
SET posting_period_variant = 'AM01', updated_at = NOW()
WHERE code = 'AM01';

-- Open and Close Posting Periods (OB52)
-- Variant: AM01 | Account Type: ALL (+) | Period 1: 1 / 2026 to 12 / 2026
DO $$
DECLARE
  v_cal_id uuid;
BEGIN
  SELECT id INTO v_cal_id FROM fin_posting_calendar WHERE code = 'AM01' LIMIT 1;
  IF v_cal_id IS NOT NULL THEN
    INSERT INTO fin_posting_calendar_period (
      posting_calendar_id, 
      variant_code, 
      account_type, 
      from_period, 
      from_year, 
      to_period, 
      to_year, 
      is_open, 
      description
    )
    VALUES (
      v_cal_id, 
      'AM01', 
      'ALL', 
      1, 
      2026, 
      12, 
      2026, 
      true, 
      'Open period 1/2026 to 12/2026 for AM01'
    )
    ON CONFLICT (posting_calendar_id, from_period, account_type) DO UPDATE SET
      from_year = EXCLUDED.from_year,
      to_period = EXCLUDED.to_period,
      to_year = EXCLUDED.to_year,
      is_open = EXCLUDED.is_open,
      updated_at = NOW();
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- STEP 7: G/L Prerequisites (Chart of Accounts & Account Groups)
-- ------------------------------------------------------------------------------

-- 1. Define Chart of Accounts (OB13)
-- Chrt/Accts: AMCO | Description: Aura Chart of Accounts | Language: EN | Length: 4
INSERT INTO fin_chart (code, name, description, language, gl_account_length)
VALUES ('AMCO', 'Aura Chart of Accounts', 'Aura Chart of Accounts', 'EN', 4)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  language = EXCLUDED.language,
  gl_account_length = EXCLUDED.gl_account_length,
  updated_at = NOW();

-- 2. Assign CoA to Company Code (OB62 / OBOB)
UPDATE fin_company_assignment
SET chart_of_accounts_code = 'AMCO', updated_at = NOW()
WHERE company_code = 'AM01';

UPDATE org_legal_entity
SET chart_of_accounts_code = 'AMCO', updated_at = NOW()
WHERE code = 'AM01';

-- 3. Define Account Groups (OBD4)
-- Under CoA AMCO:
-- ASET | Assets | 1000 to 1999
-- LIAB | Liabilities | 2000 to 2999
-- EQTY | Equity | 3000 to 3999
-- REVE | Revenue | 4000 to 4999
-- EXPN | Expenses | 5000 to 5999
DO $$
DECLARE
  v_chart_id uuid;
BEGIN
  SELECT id INTO v_chart_id FROM fin_chart WHERE code = 'AMCO' LIMIT 1;
  IF v_chart_id IS NOT NULL THEN
    INSERT INTO fin_account_group (chart_id, coa_id, code, name, from_account, to_account, account_type, account_category)
    VALUES 
      (v_chart_id, v_chart_id, 'ASET', 'Assets', '1000', '1999', 'ASSET', 'BALANCE_SHEET'),
      (v_chart_id, v_chart_id, 'LIAB', 'Liabilities', '2000', '2999', 'LIABILITY', 'BALANCE_SHEET'),
      (v_chart_id, v_chart_id, 'EQTY', 'Equity', '3000', '3999', 'EQUITY', 'BALANCE_SHEET'),
      (v_chart_id, v_chart_id, 'REVE', 'Revenue', '4000', '4999', 'REVENUE', 'OPERATING_EXP_INC'),
      (v_chart_id, v_chart_id, 'EXPN', 'Expenses', '5000', '5999', 'EXPENSE', 'OPERATING_EXP_INC')
    ON CONFLICT (chart_id, code) DO UPDATE SET
      name = EXCLUDED.name,
      from_account = EXCLUDED.from_account,
      to_account = EXCLUDED.to_account,
      account_type = EXCLUDED.account_type,
      account_category = EXCLUDED.account_category,
      updated_at = NOW();
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- STEP 8: Retained Earnings & Document Number Ranges
-- ------------------------------------------------------------------------------

-- 1. Define Retained Earnings Account (OB53)
-- CoA: AMCO | P&L Account Type: X | Account: 3000
DO $$
DECLARE
  v_chart_id uuid;
BEGIN
  SELECT id INTO v_chart_id FROM fin_chart WHERE code = 'AMCO' LIMIT 1;
  IF v_chart_id IS NOT NULL THEN
    INSERT INTO fin_retained_earnings (chart_id, chart_code, coa_id, pl_account_type, account_number, retained_earnings_account, description)
    VALUES (v_chart_id, 'AMCO', v_chart_id, 'X', '3000', '3000', 'Retained Earnings Balance Account for AMCO')
    ON CONFLICT (chart_id, pl_account_type) DO UPDATE SET
      chart_code = EXCLUDED.chart_code,
      account_number = EXCLUDED.account_number,
      retained_earnings_account = EXCLUDED.retained_earnings_account,
      description = EXCLUDED.description;
  END IF;
END $$;

-- 2. Define Document Number Ranges (FI) (FBN1)
-- Company Code: AM01 | Interval No: 01 | Year: 2026 | From: 0000000001 | To: 0009999999
DELETE FROM core_number_range 
WHERE object_type = 'FI_DOC' 
  AND company_code = 'AM01' 
  AND code = '01' 
  AND fiscal_year = 2026;

INSERT INTO core_number_range (
  code,
  object_type,
  company_code,
  scope_level,
  fiscal_year,
  year,
  prefix,
  from_number,
  to_number,
  current_number,
  description
)
VALUES (
  '01',
  'FI_DOC',
  'AM01',
  'COMPANY_CODE',
  2026,
  2026,
  '',
  1,
  9999999,
  0,
  'FI Accounting Documents for AM01 FY2026'
);

COMMIT;
