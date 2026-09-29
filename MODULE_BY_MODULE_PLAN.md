# Module-by-Module Legal-Safe Rewrite Plan

User decisions:
- Helper codes kept as-is, auto-generate for new functions
- Module-by-module after confirmation
- Fresh empty DB, but keep common sample data: CoA, GL accounts, tax codes, currencies (INR default + sample), UoM, material types, number ranges
- User will audit functions per module

## Module Order Proposed

1. **FOUNDATION – Enterprise Structure** (16 org elements) – START HERE
2. FOUNDATION – Product Catalog (Item Master, Category, UoM, etc)
3. FOUNDATION – Partner (Business Partner / Vendor/Customer)
4. FOUNDATION – Number Ranges, Currencies, Inventory State
5. FICO – Chart of Accounts, GL, Cost Unit, Profit Unit, Tax, Fiscal Calendars
6. MM – Procurement (PR, PO, GR, IV, STO, Physical Inventory)
7. PP – Manufacturing (BOM, Work Center, Routing, Production Order, MRP, Kitting)
8. SD – Sales (Sales Order, Delivery, Billing, POS webhook)
9. HR – Org, Position, Employee, Payroll
10. AUDIT / WORKFLOW / DMS

---

## Module 1: FOUNDATION – Enterprise Structure (16 elements)

### Current State Audit

**Existing tables (risky names):**
- `ent_client` – SAP T000 Client
- `ent_company_code` – SAP T001 Company Code – OX02
- `ent_plant` – SAP T001W Plant – OX10
- `ent_storage_location` – SAP T001L SLoc – OX09
- `ent_credit_control_area` – SAP Credit Control Area OB45
- `ent_fiscal_year_variant` – OB29
- `ent_posting_period_variant` – OBBO

**Missing masters (only free-text fields now):**
- Company (umbrella)
- Controlling Area
- Purchasing Org / Group
- Sales Org / Dist Channel / Division
- Profit Center
- Business Area
- Warehouse Number
- Shipping Point

**Functions in this module (from functions.ts):**
- OX15 Define Company
- OX02 Define Company Code
- OX16 Assign Company to Company Code
- OX10 Define Plant
- OX09 Define Storage Location
- OX08 Define Purchasing Organization
- OX18 Assign Plant to Company Code
- OME4 Define Purchasing Group
- OVX2 Define Sales Organization
- OVX1 Define Distribution Channel
- OVX5 Define Sales Organization Structure
- OB45 Define Credit Control Area
- OB38 Assign Company Code to Credit Control Area
- OB29 Define Fiscal Year Variant K4
- OB37 Assign Fiscal Year Variant to Company Code
- OBBP Assign Posting Period Variant to Company Code
- Plus OY03 Currencies, CUNI UoM etc (overlap with product module)

**Issues:**
- No master tables for Purch Org, Purch Group, Sales Org, Dist Channel, Division – only varchar fields in `ent_material_plant` and `ent_material_sales`
- No Controlling Area, Profit Center, Business Area, Warehouse, Shipping Point tables
- No assignment validation (e.g., Plant must be assigned to Company Code – currently via FK but should be explicit assignment table for flexibility)
- SAP-identical table names

### Proposed New Design – Module 1 Only

**Keep sample data:** CoA, GL, Tax, Currencies, UoM will NOT be touched in this module – kept for convenience as you requested. Only enterprise org tables rewritten.

**New safe schema file:** `src/modules/foundation/enterprise/infrastructure/orgStructureSchema.ts`

#### New Tables – Legal-Safe Names

```sql
-- Core
core_tenant (id, code unique, name, created_at)
  Sample: TEN-100, Main Tenant (fresh empty will have 1 tenant as default)

-- Company Group (NEW, umbrella)
org_company_group (id, tenant_id FK, code unique per tenant, name, description, is_active)
  Helper: OX15 kept – function "Define Company Group"
  Sample: none (fresh empty)

-- Legal Entity (renamed from Company Code)
org_legal_entity (id, tenant_id, company_group_id FK nullable, code unique per tenant, name, currency_code FK core_currency, city, country, address, street, postal_code, region, tax_id, gst_number, pan, cin, phone, email, website, legal_form, registration_number, is_active)
  Helper: OX02 kept
  Sample: none (fresh empty – user creates)

-- Management Control Area (NEW)
org_mgmt_control_area (id, tenant_id, code unique, name, currency_code, description, is_active)
  Helper: NEW ORG-MC-01 auto-generated, plus OX06 alias "Define Management Control Area"
  Sample: none

-- Assignment: Legal Entity ↔ Control Area (1:1 enforced)
org_legal_entity_control_area_assign (id, legal_entity_id FK unique, control_area_id FK, assigned_at)
  Validation: 1 legal entity = 1 control area

-- Facility (renamed from Plant)
org_facility (id, legal_entity_id FK, code unique globally, name, description, address, is_active)
  Helper: OX10 kept
  Sample: none

-- Inventory Location (renamed from Storage Location)
org_inventory_location (id, facility_id FK, code, name, location_type enum: PRIMARY/COLD_ZONE/SHOP_FLOOR/RETURNS/QUALITY/BLOCKED/RAW_ZONE/FINISHED_ZONE/PACK_ZONE, is_active, unique facility+code)
  Helper: OX09 kept
  Sample: none

-- Procurement Division (NEW master for Purch Org)
org_procurement_division (id, tenant_id, code unique, name, legal_entity_id FK nullable, description, is_active)
  Helper: OX08 kept
  Sample: none

-- Procurement Division ↔ Legal Entity assign
org_proc_div_legal_assign (id, procurement_division_id, legal_entity_id, unique combo)

-- Procurement Division ↔ Facility assign
org_proc_div_facility_assign (id, procurement_division_id, facility_id, unique combo)

-- Buyer Team (NEW master for Purch Group)
org_buyer_team (id, procurement_division_id FK, code unique, name, email, phone, is_active)
  Helper: OME4 kept
  Sample: none

-- Commercial Org (NEW master for Sales Org)
org_commercial_org (id, tenant_id, legal_entity_id FK, code unique, name, currency_code, description, is_active)
  Helper: OVX2 kept
  Sample: none

-- Sales Channel (NEW for Dist Channel)
org_sales_channel (id, tenant_id, code unique, name, description, is_active)
  Helper: OVX1 kept
  Sample: Sample data kept? No – fresh empty but you said keep common sample – sales channels are org, so empty

-- Product Line (NEW for Division)
org_product_line (id, tenant_id, code unique, name, description, is_active)
  Helper: NEW ORG-PL-01 "Define Product Line"
  Sample: none

-- Commercial Org ↔ Sales Channel ↔ Product Line assignment (combined)
org_commercial_assign (id, commercial_org_id, sales_channel_id, product_line_id, unique combo)
  Validation: Sales Order must have valid combo

-- Profit Unit (NEW for Profit Center)
org_profit_unit (id, tenant_id, legal_entity_id FK, control_area_id FK, code unique per control area, name, responsible_id FK, valid_from, valid_to, is_active)
  Helper: NEW ORG-PU-01 "Define Profit Unit" (KE51 equivalent)
  Sample: none

-- Cost Unit (renamed from Cost Center)
org_cost_unit (id, tenant_id, legal_entity_id FK, control_area_id FK, parent_id self FK, code unique, name, responsible_id, valid_from, valid_to, is_active)
  Helper: KS01 kept
  Sample: none (fresh empty)

-- Business Segment (NEW for Business Area)
org_business_segment (id, tenant_id, code unique, name, description, is_active)
  Helper: NEW ORG-BS-01 "Define Business Segment"
  Sample: none

-- Warehouse Site (NEW for Warehouse Number)
org_warehouse_site (id, facility_id FK, code unique per facility, name, description, is_active)
  Helper: NEW ORG-WH-01 "Define Warehouse Site"
  Sample: none

-- Warehouse Zone (NEW)
org_warehouse_zone (id, warehouse_site_id FK, code, zone_type enum, is_active, unique site+code)

-- Warehouse Bin (NEW)
org_warehouse_bin (id, zone_id FK, code, aisle, rack, level, is_active, unique zone+code)

-- Inventory Location ↔ Warehouse Site assignment
org_inventory_warehouse_assign (id, inventory_location_id FK, warehouse_site_id FK)

-- Dispatch Point (NEW for Shipping Point)
org_dispatch_point (id, facility_id FK, code unique per facility, name, loading_group, route, description, is_active)
  Helper: NEW ORG-DP-01 "Define Dispatch Point"
  Sample: none

-- Dispatch Determination (NEW)
org_dispatch_determination (id, facility_id FK, sales_channel_id FK nullable, loading_group, dispatch_point_id FK, unique facility+channel+loading_group)

-- Keep existing but renamed:
fin_credit_policy_area (id, code unique, name, currency, is_active) – was ent_credit_control_area, helper OB45 kept
fin_fiscal_calendar (was ent_fiscal_year_variant) – OB29 kept
fin_posting_calendar (was ent_posting_period_variant) – OBBO kept
```

#### Assignment & Validation Rules – Module 1

- Tenant is root – cannot delete if any org exists
- Company Group 1:N Legal Entities – unique code per tenant
- Legal Entity 1:1 Control Area – enforced via unique legal_entity_id in assign table
- Facility belongs to Legal Entity – FK, cannot delete if inventory locations / warehouse sites / stock exist
- Inventory Location unique per Facility, belongs to Facility
- Procurement Division assigned to Legal Entity and Facility via assign tables – PR/PO validation (future MM module) will check assignment
- Buyer Team belongs to Procurement Division
- Commercial Org belongs to Legal Entity – Sales Channel and Product Line assigned via commercial_assign – Sales Order validation (future SD module) will check combo exists
- Profit Unit & Cost Unit must share same Control Area as Legal Entity – validation in API
- Cost Unit hierarchy – parent must be same Legal Entity & Control Area
- Warehouse Site belongs to Facility – Inventory Location can be assigned to Warehouse Site
- Dispatch Point belongs to Facility – determination via sales_channel + loading_group

#### API Routes – Module 1

**New neutral routes (fresh):**
- `/api/tenants` – core_tenant
- `/api/company-groups` – org_company_group – OX15
- `/api/legal-entities` – org_legal_entity – OX02
- `/api/control-areas` – org_mgmt_control_area – OX06
- `/api/facilities` – org_facility – OX10
- `/api/inventory-locations` – org_inventory_location – OX09
- `/api/procurement-divisions` – org_procurement_division – OX08
- `/api/buyer-teams` – org_buyer_team – OME4
- `/api/commercial-orgs` – org_commercial_org – OVX2
- `/api/sales-channels` – org_sales_channel – OVX1
- `/api/product-lines` – org_product_line – ORG-PL-01
- `/api/profit-units` – org_profit_unit – ORG-PU-01
- `/api/cost-units` – org_cost_unit – KS01
- `/api/business-segments` – org_business_segment – ORG-BS-01
- `/api/warehouse-sites` – org_warehouse_site – ORG-WH-01
- `/api/dispatch-points` – org_dispatch_point – ORG-DP-01
- `/api/credit-policy-areas` – fin_credit_policy_area – OB45 (kept)

**Old routes kept as alias for 1 release (to avoid break):**
- `/api/company-codes` → forwards to `/api/legal-entities`
- `/api/plants` → forwards to `/api/facilities`

#### UI – Module 1

- Rewrite `enterprise-structure/page.tsx` with 6 tabs:
  1. Company Group & Legal Entity (OX15/OX02)
  2. Control Area & Assignment (OX06/OB45)
  3. Facility & Inventory Location (OX10/OX09)
  4. Procurement Division & Buyer Team (OX08/OME4)
  5. Commercial Org, Sales Channel, Product Line (OVX2/OVX1/ORG-PL-01)
  6. Profit Unit, Cost Unit, Business Segment, Warehouse, Dispatch (KS01/ORG-PU-01/ORG-BS-01/ORG-WH-01/ORG-DP-01)

- All labels neutral: "Legal Entity" not "Company Code", "Facility" not "Plant", "Inventory Location" not "Storage Location", etc.
- Helper code badges kept: OX02, OX10, etc shown via `NEXT_PUBLIC_SHOW_FUNCTION_CODE`
- Fresh empty: No company codes, no plants, no slocs – user creates via + Create buttons
- Sample data kept: Currencies (INR default), UoM, CoA, GL, Tax Codes will still show in dropdowns (from other modules, not touched)

#### Functions.ts – Module 1

Keep existing OX* codes, add new:

```ts
{ code: 'OX15', description: 'Define Company Group', route: '/1000/foundation/enterprise-structure?tab=company-group', ... },
{ code: 'OX06', description: 'Define Management Control Area', route: '/1000/foundation/enterprise-structure?tab=control-area', ... },
{ code: 'ORG-PU-01', description: 'Define Profit Unit', route: '/1000/foundation/enterprise-structure?tab=profit', ... },
{ code: 'ORG-BS-01', description: 'Define Business Segment', ... },
{ code: 'ORG-WH-01', description: 'Define Warehouse Site', ... },
{ code: 'ORG-DP-01', description: 'Define Dispatch Point', ... },
{ code: 'ORG-PL-01', description: 'Define Product Line', ... },
```

Helper codes auto-generated as you requested.

#### Sample Data – Fresh Empty + Common Kept

- **Will be empty (fresh):** core_tenant will have 1 default TEN-100, but org_company_group, org_legal_entity, org_facility, org_inventory_location, org_procurement_division, org_buyer_team, org_commercial_org, org_sales_channel, org_product_line, org_profit_unit, org_cost_unit, org_business_segment, org_warehouse_site, org_dispatch_point – all empty, user creates.

- **Will be kept (common sample for convenience):**
  - `core_currency`: INR (default), plus sample KWD, USD, EUR if you want (we keep existing)
  - `core_unit_measure`: KG, L, PC, BOX, etc
  - `fin_chart`: INT chart of accounts sample
  - `fin_ledger_account`: 100000-500000 sample GL accounts (if exists)
  - `fin_tax_rule`: GST0/5/12/18/28, IGST, VAT 5% etc
  - `core_number_sequence`: number ranges for PR, PO, GR, etc

#### Migration – Fresh Empty

- Drop old tables? No – we will create new tables alongside, then after confirmation drop old in next module? For fresh empty you said fresh empty – so we can:
  - Create new tables with new names
  - NOT migrate old data (fresh)
  - Keep old tables for 1 release but mark deprecated, then remove in final clean
  - Or directly rename? Safer to create new and leave old, then UI uses new – old data not visible, fresh empty achieved.

For Module 1, we will:
- Create new file `orgStructureSchema.ts` with all new tables
- Keep old `schema.ts` and `enterpriseConfigSchema.ts` for other modules (until they are rewritten)
- Update `enterprise-structure` API and UI to use new tables only
- Old `ent_company_code`, `ent_plant`, `ent_storage_location` remain in DB but not used by new UI (fresh empty)

#### Build Steps – Module 1 Only

1. Create `src/modules/foundation/enterprise/infrastructure/orgStructureSchema.ts` with all new safe tables + enums
2. Update `src/shared/kernel/db/schema.ts` to export new tables
3. Create 16 new API routes under `src/app/api/` (company-groups, legal-entities, etc)
4. Rewrite `src/app/(erp)/[companyCode]/foundation/enterprise-structure/page.tsx` with 6 tabs, neutral terms, helper badges kept
5. Update `src/shared/lib/functions.ts` – add 7 new functions with auto codes
6. Keep sample data seed script for currencies, UoM, CoA, GL, tax codes
7. `npm run build` – must pass
8. Commit `feat: Module1 legal-safe enterprise structure – fresh empty with safe names, helper codes kept` and push to GitHub

### Confirmation Needed for Module 1

Approve Module 1 build as per above?

