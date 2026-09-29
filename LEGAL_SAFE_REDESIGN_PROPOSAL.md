# Legal-Safe Enterprise Structure Redesign – Confirmation Required

> Goal: Functionally similar to ERP but **no SAP-identical table names, structures, or terminology** to avoid trademark/copyright risk.
> Current build: `0cf6b07` on `erp-modular-monolith` – 57 routes passing, but names like `ent_company_code`, `ent_plant`, `fi_cost_center`, `ent_material_master` partially mirror SAP concepts (T001, T001W, MARA, CSKS). We will rewrite with neutral domain language.

## 1. Audit – Risky Current Names

| Current Table | SAP Equivalent | Risk Level | Why Risky |
|---|---|---|---|
| `ent_client` | T000 Client / Mandant | HIGH | SAP core term "Client/Mandant" |
| `ent_company_code` | T001 Company Code | HIGH | Exact SAP term + OX02 |
| `ent_plant` | T001W Plant | HIGH | Exact SAP term + OX10 |
| `ent_storage_location` | T001L Storage Location | HIGH | Exact SAP term + OX09 |
| `ent_material_master` | MARA Material Master | MEDIUM-HIGH | "Material Master" is SAP trademarked flow MM01 |
| `ent_material_plant` | MARC Plant Data | MEDIUM | SAP plant-level material view |
| `ent_material_sales` | MVKE Sales Data | MEDIUM | Sales org/dist channel/division |
| `fi_cost_center` | CSKS Cost Center | MEDIUM | Generic accounting but SAP KS01 |
| `ent_uom` | T006 UoM | LOW | Generic but CUNI is SAP code |
| `ent_currency` | TCURC Currency | LOW | Generic |
| `fi_chart_of_accounts` | T004 Chart of Accounts | LOW-MEDIUM | Generic but OB13 |
| `fi_gl_account` | SKA1/SKB1 GL | LOW | Generic |
| `ent_business_partner` | BUT000 Business Partner | MEDIUM | SAP BP term |
| `ent_batch` | MCHA Batch | LOW | Generic |
| `mm_purchase_requisition` etc | EBAN/PR | LOW | Generic but ME51N etc are SAP helper codes (already removed) |
| Enums `material_type ROH/FERT/HALB` | SAP MTART | HIGH | Exact SAP material type codes |
| Fields `valuation_class`, `price_control S/V`, `mrp_type PD` | SAP | HIGH | SAP valuation & MRP terminology |

## 2. Proposed Neutral Naming Convention

Use domain prefixes, no SAP codes in table names:

- `core_` – platform foundation: `core_tenant`, `core_currency`, `core_unit_of_measure`, `core_number_sequence`
- `org_` – organizational hierarchy (all 16 elements): `org_company_group`, `org_legal_entity`, `org_facility`, `org_inventory_location`, `org_procurement_division`, `org_buyer_team`, `org_commercial_org`, `org_sales_channel`, `org_product_line`, `org_management_area`, `org_profit_unit`, `org_cost_unit`, `org_business_segment`, `org_warehouse_site`, `org_dispatch_point`
- `prod_` – product catalog: `prod_item`, `prod_category`, `prod_facility_profile`, `prod_commercial_profile`
- `partner_` – external parties: `partner_account`, `partner_customer_ext`, `partner_vendor_ext`
- `fin_` – financials: `fin_chart`, `fin_account`, `fin_journal`, `fin_journal_line`, `fin_tax_rule`, `fin_cost_tracking`
- `proc_` – procurement, `inv_` – inventory, `sales_` – sales, `mfg_` – manufacturing

All `ent_`, `fi_`, `mm_`, `sd_`, `pp_` prefixes will be **removed** to break SAP module pattern.

## 3. Full Mapping – Old → New (What Will Change)

### A. Foundation – 16 Org Elements (your list)

| # | Your Requirement | Current Table | New Safe Table | New Safe Name in UI | Relationship & Validation (Legal-Safe) |
|---|------------------|---------------|----------------|---------------------|----------------------------------------|
| 1 | Client/Tenant | `ent_client` (code 3) | `core_tenant` | Tenant / Platform Root | Root. `core_tenant.code` unique 3-10 chars. Validation: cannot delete if legal entities exist. Renamed from Client/Mandant. |
| 2 | Company | MISSING (logical) | `org_company_group` | Company Group / Enterprise Group | Umbrella holding. `code, name, tenant_id → core_tenant.id`. 1:N legal entities. Validation: unique code per tenant. |
| 3 | Company Code | `ent_company_code` | `org_legal_entity` | Legal Entity / Statutory Company | Legal entity with tax compliance. `tenant_id, company_group_id, currency_code, tax_id, gst, pan, cin, address`. Unique code per tenant. Child of Company Group. Parent of facilities & cost units. Validation: GSTIN format if IN, cannot delete if facilities/transactions exist. |
| 4 | Controlling Area | MISSING | `org_management_control_area` | Management Control Area | CO equivalent but renamed. `code, name, currency, tenant_id`. Assignment `org_legal_entity_control_area_assign (legal_entity_id, control_area_id)` – 1 legal entity = 1 control area (enforced). Cost units & profit units must belong to same control area as legal entity. |
| 5 | Plant | `ent_plant` | `org_facility` | Facility / Operational Site | Former Plant. `legal_entity_id → org_legal_entity.id`, `code unique`, `address`. Validation: must belong to active legal entity, cannot delete if inventory locations / stock / item profiles exist. |
| 6 | SLoc | `ent_storage_location` | `org_inventory_location` | Inventory Location / Storage Zone | Former SLoc. `facility_id → org_facility.id`, `code` unique per facility, `location_type` enum: MAIN/COLD/FLOOR/RETURNS/QC/BLOCKED/RAW/FINISHED/PACK (renamed from sloc_type). Validation: unique per facility. |
| 7 | PurchOrg | MISSING field only | `org_procurement_division` | Procurement Division | Master table. `code, name, legal_entity_id`. Assignment tables: `proc_division_facility_assign`, `proc_division_legal_entity_assign`. Validation: PR/PO procurement_division must be assigned to facility. |
| 8 | PurchGroup | MISSING field only | `org_buyer_team` | Buyer Team / Procurement Group | Master. `code, name, procurement_division_id`. Validation: Buyer team must belong to procurement division. |
| 9 | SalesOrg | MISSING field only | `org_commercial_org` | Commercial Organization / Sales Unit | Master. `code, name, legal_entity_id, currency`. Assignment to channel & product line. |
| 10 | DistChannel | MISSING field only | `org_sales_channel` | Sales Channel / Distribution Path | Master. `code, name`. Assignment `commercial_org_sales_channel_assign`. |
| 11 | Division | MISSING field only | `org_product_line` | Product Line / Commercial Division | Master. `code, name`. Assignment `commercial_org_product_line_assign` + combined `commercial_org_channel_line_assign (commercial_org_id, sales_channel_id, product_line_id)` – must be valid for sales order. |
| 12 | ProfitCenter | MISSING | `org_profit_unit` | Profit Unit / Profitability Center | `code, name, legal_entity_id, control_area_id, valid_from/to, responsible_id`. Assignment to cost units, facilities, items. Validation: must be same control area as legal entity. |
| 13 | CostCenter | `fi_cost_center` | `org_cost_unit` | Cost Unit / Cost Tracking Center | Renamed from cost_center. `code unique, name, legal_entity_id, control_area_id, parent_id self, responsible_id, valid_from/to`. Hierarchy validation: parent must be same legal entity & control area. Secure delete: if has employees/journal lines → deactivate not delete. |
| 14 | BusinessArea | MISSING | `org_business_segment` | Business Segment / Reporting Segment | `code, name, description`. Assignment to facility, cost unit, profit unit, journal line for segment reporting. |
| 15 | Warehouse/Warehouse Number | MISSING | `org_warehouse_site` | Warehouse Site | WM level. `code, name, facility_id`. Child: `org_warehouse_zone (zone_type)`, `org_warehouse_bin`. Inventory location assigned to warehouse site. |
| 16 | ShippingPoint | MISSING | `org_dispatch_point` | Dispatch Point / Shipment Origin | `code, name, facility_id, loading_group, route`. Determination rule table `org_dispatch_determination (facility_id, sales_channel_id, loading_group, dispatch_point_id)`. Validation: Delivery must have valid dispatch point for facility. |

### B. Product / Material – Rename to avoid MARA

| Current | New Safe | Notes |
|---|---|---|
| `ent_material_master` | `prod_item` | Item / Product Master, not Material Master. Fields: `item_number` not material_number, `item_type` enum: RAW, FINISHED, SEMI, PACK, NON_STOCK (not ROH/FERT/HALB/NLAG/DIEN), `valuation_method` S/V renamed to `pricing_method STANDARD/MOVING_AVG`, `inventory_valuation_class` not valuation_class, `batch_managed` kept generic |
| `ent_material_group` | `prod_category` | Category hierarchy, not Material Group |
| `ent_material_plant` | `prod_facility_profile` | Facility-specific profile: `item_id, facility_id, planning_type (not mrp_type), procurement_method (not procurement_type), buyer_team_id, procurement_division_id, safety_stock, reorder_point, pricing_method` |
| `ent_material_sales` | `prod_commercial_profile` | `item_id, commercial_org_id, sales_channel_id, product_line_id, delivering_facility_id` – FKs to new masters not free text |
| `ent_material_classification` | `prod_item_attribute` | Generic attributes |
| `ent_material_quality` | `prod_quality_profile` | |
| `ent_batch` | `inv_batch_lot` | Batch lot, generic |
| `ent_uom` | `core_unit_of_measure` | Generic, not CUNI |
| `ent_currency` | `core_currency` | |
| `ent_business_partner` | `partner_account` | External partner account, not Business Partner |
| `ent_bp_vendor_ext` | `partner_vendor_profile` | |
| `ent_bp_customer_ext` | `partner_customer_profile` | |

### C. Financials – Rename to break FI-CO pattern

| Current | New Safe |
|---|---|
| `fi_chart_of_accounts` | `fin_chart` |
| `fi_gl_account` | `fin_ledger_account` |
| `fi_cost_center` | `org_cost_unit` (already) |
| `fi_tax_code` | `fin_tax_rule` |
| `fi_document` | `fin_journal` |
| `fi_document_line` | `fin_journal_line` |
| `fi_auto_account_determination` | `fin_auto_posting_rule` (BSX/WRX/PRD → internal codes INVENTORY_POSTING/GR_CLEARING/PRICE_DIFF) |
| `ent_credit_control_area` | `fin_credit_policy_area` (not credit control area) |
| `ent_fiscal_year_variant` | `fin_fiscal_calendar` |
| `ent_posting_period_variant` | `fin_posting_calendar` |

### D. Enums – SAP codes removed

- `material_type ROH/FERT/HALB/DIEN/NLAG` → `item_type RAW/FINISHED/SEMI/PACK/NON_STOCK/SERVICE`
- `price_control S/V` → `pricing_method STANDARD/MOVING_AVG`
- `sloc_type MAIN/COLD/...` → `location_type PRIMARY/COLD_ZONE/SHOP_FLOOR/RETURNS/QUALITY/BLOCKED/RAW_ZONE/FINISHED_ZONE/PACK_ZONE`
- `movement_type 101/102/261/262/301...` → `inventory_movement_type RECEIPT/CANCEL_RECEIPT/ISSUE/CANCEL_ISSUE/TRANSFER...` (keep numeric only as internal seq, not as business key)
- `sales_org KSO1` example data removed – use neutral codes like `COM-1000`, `CH-DIRECT`, `PL-SPICE`

## 4. New Tables to Create (for missing elements)

Will create 12 new tables + 7 assignment tables:

- `org_company_group`, `org_management_control_area`, `org_legal_entity_control_area_assign`
- `org_procurement_division`, `org_procurement_division_legal_entity_assign`, `org_procurement_division_facility_assign`
- `org_buyer_team`
- `org_commercial_org`, `org_sales_channel`, `org_product_line`, `org_commercial_channel_line_assign`
- `org_profit_unit`, `org_business_segment`
- `org_warehouse_site`, `org_warehouse_zone`, `org_warehouse_bin`
- `org_dispatch_point`, `org_dispatch_determination`
- Also: `core_tenant` replaces `ent_client`, `org_legal_entity` replaces `ent_company_code`

All will have `code unique per tenant/legal_entity`, `is_active`, `created_at`, `updated_at`, proper FK indexes.

## 5. Migration Strategy – What Will Break

- **DB Migration:** Need to create new tables, migrate data from old tables (ent_client → core_tenant, ent_company_code → org_legal_entity etc), then drop old after verification. Will provide SQL migration file `drizzle/migrate_legal_safe.sql`.
- **Code Changes:** ~80 files reference `entCompanyCode`, `entPlant`, etc. All imports will be updated to new names. API routes `/api/company-codes`, `/api/plants` will be kept for backward compat but internally use new tables (or renamed to `/api/legal-entities`, `/api/facilities` with alias).
- **UI:** Enterprise Structure page will show new terminology: "Legal Entity" not "Company Code", "Facility" not "Plant", "Inventory Location" not "Storage Location", etc. Helper codes like OX02 will be removed entirely (function is destination).
- **Search:** Functions.ts will be updated: codes like OX02, OX10, KS01 will be removed – functions become "Define Legal Entity", "Define Facility", etc.

## 6. Validation Rules – Will Add

- Tenant must exist before any org.
- Company Group 1:N Legal Entities (unique code per tenant).
- Legal Entity 1:1 Management Control Area (enforced via assignment table + check).
- Facility must belong to Legal Entity, code unique globally.
- Inventory Location unique per Facility.
- Procurement Division assigned to Legal Entity and Facility – PR/PO validation will check assignment.
- Buyer Team belongs to Procurement Division.
- Commercial Org assigned to Legal Entity – Sales Order must have valid Commercial Org + Sales Channel + Product Line combo via `commercial_org_channel_line_assign`.
- Profit Unit & Cost Unit must share same Control Area as Legal Entity.
- Warehouse Site belongs to Facility, Inventory Location assigned to Warehouse Site.
- Dispatch Point belongs to Facility, determination via channel + loading group.

## 7. What We Need Confirmation For

Before building, confirm:

1. Are you OK with **renaming all tables** as per mapping above (breaking change requiring migration)?
2. Should we **keep old API routes as alias** or break and use new routes `/api/legal-entities`, `/api/facilities`, `/api/inventory-locations`, etc?
3. Should UI terminology be fully neutral (Legal Entity, Facility, etc) or keep dual labels for transition (e.g., "Legal Entity (formerly Company Code)")?
4. Do you want **migration script to preserve existing data** (1000, KS01, etc) or fresh start with empty legal-safe tables?
5. Should we also rename `FUNCTIONS` helper codes (OX02 etc) to neutral codes like `ORG-LE-01` or remove codes entirely (function is destination philosophy)?

---

**Next Steps if Approved:**

- Generate new schema file `src/shared/kernel/db/legalSafeSchema.ts` with all 16 elements + renamed product/fin tables
- Create migration SQL
- Update all API routes, UI pages, and functions.ts
- Run build + push to GitHub `erp-modular-monolith` as clean commit (no SAP terms in history)
- Provide updated status table

Please confirm via options below.
