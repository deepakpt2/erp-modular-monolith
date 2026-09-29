# Legal-Safe Redesign V2 – With Helper Codes Kept

User confirmed: **Helper codes (OX02, OX10, etc) to be kept as-is, and auto-generate for new functions.**

This updates V1 proposal.

## Decision Locked

- Helper codes: KEEP as-is in codebase, visible via badge, hidden via `NEXT_PUBLIC_SHOW_FUNCTION_CODE`. New functions will get auto-generated neutral codes like `ORG-PC-01` for Profit Unit, `ORG-PS-01` for Procurement Division, etc, but using same pattern as OX02.

## Remaining Decisions Needed Before Build (ask confirmation)

### 1. Rename Scope – Recommended: Foundation + 16 Org Elements Fully Legal-Safe

We will rewrite:

**Phase 1 – Foundation (must rename to avoid SAP table names):**
- `ent_client` → `core_tenant` (Tenant)
- `ent_company_code` → `org_legal_entity` (Legal Entity)
- `ent_plant` → `org_facility` (Facility)
- `ent_storage_location` → `org_inventory_location` (Inventory Location)
- `ent_material_master` → `prod_item` (Product Item)
- `ent_material_group` → `prod_category`
- `ent_material_plant` → `prod_facility_profile`
- `ent_material_sales` → `prod_commercial_profile`
- `ent_uom` → `core_unit_measure`
- `ent_currency` → `core_currency`
- `ent_business_partner` → `partner_account`
- `ent_batch` → `inv_lot`

**Phase 2 – Missing 16 Elements (new tables with safe names + helper codes):**
- Company → `org_company_group` – code `OX15` (Define Company Group) – helper code kept OX15
- Company Code already → `org_legal_entity` – code `OX02`
- Controlling Area (NEW) → `org_mgmt_control_area` – NEW code `OX06` (Define Management Control Area)
- Plant already → `org_facility` – `OX10`
- SLoc already → `org_inventory_location` – `OX09`
- Purch Org (NEW master) → `org_procurement_division` – `OX08`
- Purch Group (NEW master) → `org_buyer_team` – `OME4`
- Sales Org (NEW master) → `org_commercial_org` – `OVX2`
- Dist Channel (NEW) → `org_sales_channel` – `OVX1`
- Division (NEW) → `org_product_line` – `OVX5-DIV` (auto-gen)
- Profit Center (NEW) → `org_profit_unit` – NEW code `KE51` equivalent but neutral `ORG-PU-01`
- Cost Center (rename) → `org_cost_unit` – `KS01`
- Business Area (NEW) → `org_business_segment` – `ORG-BS-01`
- Warehouse Number (NEW) → `org_warehouse_site` – `ORG-WH-01`
- Shipping Point (NEW) → `org_dispatch_point` – `ORG-DP-01`

All new tables will have assignment tables for validation.

**Phase 3 – Financials (rename to avoid FI-CO pattern):**
- `fi_chart_of_accounts` → `fin_chart`
- `fi_gl_account` → `fin_ledger_account`
- `fi_document` → `fin_journal`
- `fi_document_line` → `fin_journal_line`
- `fi_tax_code` → `fin_tax_rule`
- `fi_cost_center` → `org_cost_unit` (already)
- `ent_credit_control_area` → `fin_credit_policy_area` – `OB45` kept
- `ent_fiscal_year_variant` → `fin_fiscal_calendar` – `OB29` kept
- etc.

This is **ALL tables rename** – most legally safe.

### 2. Enums – SAP codes removed

- `ROH/FERT/HALB` → `RAW/FINISHED/SEMI/PACK/NON_STOCK`
- `S/V` price_control → `STANDARD/MOVING_AVG`
- Keep DB enum names but values neutral.

### 3. API Routes

Proposed:
- Keep old routes as alias (for 1 release) + new neutral routes:
  - `/api/company-codes` → alias → `/api/legal-entities`
  - `/api/plants` → alias → `/api/facilities`
  - `/api/storage-locations` → alias → `/api/inventory-locations`
  - New: `/api/company-groups`, `/api/control-areas`, `/api/procurement-divisions`, `/api/buyer-teams`, `/api/commercial-orgs`, `/api/sales-channels`, `/api/product-lines`, `/api/profit-units`, `/api/cost-units`, `/api/business-segments`, `/api/warehouse-sites`, `/api/dispatch-points`

Old routes will internally use new tables, so no breakage.

### 4. Data Migration

Proposed: **Migrate existing data** – your current `1000 Main Company`, plants, slocs, etc will be copied to new tables with same codes (1000, etc) to preserve functionality. We will provide migration SQL `migrate_legal_safe.sql`.

### 5. UI Terminology

Proposed: **Neutral only** in UI (Legal Entity, Facility, Inventory Location, etc) but helper code badge still shows OX02, OX10, etc (as you want codes kept). No SAP terms like Company Code, Plant, SLoc in visible UI text – only in helper code badge.

### 6. Helper Code Generation for New Functions

New functions will get auto-generated codes:
- Profit Unit: `ORG-PU-01` (helper) – function: "Define Profit Unit"
- Business Segment: `ORG-BS-01`
- Warehouse Site: `ORG-WH-01`
- Dispatch Point: `ORG-DP-01`
- Company Group: `ORG-CG-01` but keep OX15 alias
- Management Control Area: `ORG-MC-01` (OX06)
- Procurement Division: `ORG-PD-01` (OX08)
- Buyer Team: `ORG-BT-01` (OME4)
- Commercial Org: `ORG-CO-01` (OVX2)
- Sales Channel: `ORG-SC-01` (OVX1)
- Product Line: `ORG-PL-01`

All added to `FUNCTIONS` array in `functions.ts` with `code` field kept.

## What Will Be Changed – Summary List

1. **Schema files:**
   - `src/modules/foundation/enterprise/infrastructure/schema.ts` – rewrite with `core_tenant`, `org_company_group`, `org_legal_entity`, `org_facility`, `org_inventory_location`, `prod_item`, `prod_category`, `prod_facility_profile`, `prod_commercial_profile`, `core_unit_measure`, `core_currency`, `partner_account`, `inv_lot`
   - `src/modules/foundation/enterprise/infrastructure/enterpriseConfigSchema.ts` – rename fiscal, posting, credit, etc to `fin_*`
   - `src/modules/fico/infrastructure/schema.ts` – rename `fi_*` to `fin_*` and `org_cost_unit`
   - New file `src/modules/foundation/enterprise/infrastructure/orgStructureSchema.ts` – all 16 org elements with safe names + assignment tables

2. **API routes:**
   - Update `/api/company-codes/route.ts` to use `org_legal_entity`
   - Update `/api/plants/route.ts` to use `org_facility` + `org_inventory_location`
   - Create 12 new API routes for new masters

3. **UI:**
   - `enterprise-structure/page.tsx` – rewrite to show 6 tabs: Company Group, Legal Entity, Facility & Inventory Location, Procurement, Commercial, Controlling – all neutral terms, helper code badges kept
   - `functions.ts` – add 12 new functions with helper codes, keep old OX* codes

4. **Build & Migration:**
   - Generate `drizzle/0000_legal_safe.sql` migration
   - Update all imports (approx 80 files)
   - Build check `npm run build`
   - Commit and push to GitHub `erp-modular-monolith`

## Confirmation Required

If you approve this V2 plan, I will start build immediately.

