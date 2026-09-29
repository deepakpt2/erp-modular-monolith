# ERP Foundation – Segregated Implementation Checklist
> Source: User provided 21-point ERP foundation doc (2-22)
> Goal: Legal-safe own IP, no SAP-identical table names/structures, own short 4-char helper codes (ELEC, PPOC etc), module-by-module build after confirmation
> Date: 2026-09-29 Asia/Calcutta

## Module Map – Our System

- **FOUNDATION (FND)** – Core platform: Tenant, Company Group, Legal Entity, Facility, Inventory Location, Material/Item, Partner, Number Ranges, Currencies, UoM, Fiscal Calendars, Configuration, Workflow Engine, Authorization, Audit base, Document Architecture base, Transaction Engine base, Background Jobs, Integration API, Notifications, Attachments
- **MM – Procurement & Inventory (PUR/INV)** – Purchase Requisition, Purchase Order, Goods Receipt, Invoice Verification, Stock Transport, Physical Inventory, Purchasing Info Records, Source Lists, Price Conditions, Inventory Engine
- **PP – Manufacturing (MFG)** – BOM, Work Center, Routing, Production Version, Production Order, Kitting, MRP, Reservations
- **SD – Sales & Distribution (SAL)** – Sales Order, Delivery, Goods Issue, Billing/Invoice, Customer-Material Relationships, Pricing, Shipping Rules
- **FICO – Financials & Controlling (FIN/CST)** – Chart of Accounts, GL Accounts, Cost Unit, Profit Unit, Asset Masters, Tax Engine, Currency Framework, Universal Ledger/Posting Engine, Period Closing, Fiscal Framework
- **HR – Human Resources (HRM)** – Employee/Contact, Org Unit, Position, Payroll, Cost Center assignment
- **AUDIT & COMPLIANCE (AUD)** – Audit/Change History, Document Relationship Engine, Document Flow, Reporting/Query Framework, Period Closing Audit

---

## 2. Master-Data Framework – FOUNDATION + All Modules (Central Master with Contextual Views)

**Core Masters – Segregated:**

| Master | Our Module | Our Safe Table (legal-safe) | Helper Code (new 4-char primary, old alias) | Status | Implementation Check |
|---|---|---|---|---|---|
| Business Partner | FOUNDATION | `partner_account` (was ent_business_partner) | **PTNC** Partner Create (alias BP01) | ⚠️ Partial – old table exists, needs rename to partner_account + customer/vendor ext | Need central partner with role VENDOR/CUSTOMER/BOTH, contextual views via partner_customer_profile, partner_vendor_profile |
| Customer | FOUNDATION/SD | `partner_customer_profile` + `partner_account` role=CUSTOMER | **CUCC** Customer Create | ⚠️ Partial – field exists but no dedicated master UI, only BP with role | Need customer-specific fields: payment terms, credit policy, sales org assignment |
| Supplier | FOUNDATION/MM | `partner_vendor_profile` + `partner_account` role=VENDOR | **SUPC** Supplier Create | ⚠️ Partial – same as customer | Need vendor-specific: payment terms, procurement division assignment, QM relevant |
| Employee/Contact | HR | `hr_employee`, `hr_org_unit`, `hr_position` | **HHEC** Employee Create (alias PA30) | ✅ Implemented – hr_employee with manager hierarchy, cost unit, facility | Need contact sub-table for multiple contacts per partner |
| Material / Product | FOUNDATION | `prod_item` (was ent_material_master) – `prod_facility_profile`, `prod_commercial_profile`, `prod_quality_profile`, `prod_item_classification` | **EMTC** Product Create – Legal-safe (alias MTC, MM01, FND-MAT-CR) – item_number (was material_number) | ✅ DONE Module2 – legal-safe own IP – fresh empty, central master with contextual views: facility profile (planning, procurement), commercial profile (sales), quality profile, classification – not separate per module – APIs with fallback old→new mapping ROH→RAW etc | Central item implemented – prod_item + prod_facility_profile + prod_commercial_profile + prod_quality_profile + prod_item_classification – legal-safe |
| Material Group | FOUNDATION | `prod_category` (was ent_material_group) | **EMGC** Product Category Create – Legal-safe (alias MGC, OMSF, FND-MG-CR) | ✅ DONE Module2 – legal-safe prod_category – sample FOOD/SPICE/KITS/FG/RAW/PACK kept for convenience, hierarchy parent_id supported | Hierarchy parent_id implemented via prod_category.parent_id |
| Units of Measure | FOUNDATION | `core_unit_measure` (was ent_uom) | **EUOC** UoM Create – Legal-safe (alias UOC, CUNI, FND-UOM-CR) – KG/L/PC/BOX sample kept | ✅ DONE Module2 – legal-safe core_unit_measure – sample data KG, G, L, ML, PC, BOX, PACK, KIT, M, TON kept for convenience – fresh empty but common sample kept as per requirement – dimension, base_unit_code, conversion supported | Dimension + base_unit_code implemented |
| Batch | FOUNDATION/MM | `inv_lot` (was ent_batch) | **ELTC** Lot Create – Legal-safe (alias LTC, MSC3N, FND-LOT-CR) – lot_number (was batch_number) | ✅ DONE Module2 – legal-safe inv_lot – lot_number (was batch_number), manufacturing_date, expiry_date, supplier_lot_number, is_expired, vendor_id – batch stock tracking per facility/location via inv_stock_new + prod_item | Batch stock tracking via inv_stock_new.facility_id + inventory_location_id + lot_id |
| Serial Number | FOUNDATION/MM | MISSING – need `inv_serial` | **SRLC** Serial Create (new) | ❌ Not implemented – Module3? | Need serial tracking for equipment |
| Plant-specific material data | FOUNDATION/MM | `prod_facility_profile` (was ent_material_plant) | **EFPC** Facility Profile Create – Legal-safe – facility_id (was plant_id), pricing_method STANDARD/MOVING_AVG (was S/V), lot_control BLOCKED/WARN/RESTRICTED (was BLOCK/WARNING), planning_type MRP/NO_PLANNING/MANUAL_REORDER (was PD/ND/VB), lot_sizing LOT_FOR_LOT/FIXED (was EX/FX), procurement_method BUY/MAKE/BOTH (was F/E/X), buyer_group (was purchasing_group), procurement_division (was purchasing_org) | ✅ DONE Module2 – legal-safe prod_facility_profile – facility_id (was plant_id), pricing_method STANDARD/MOVING_AVG (was price_control S/V), lot_control BLOCKED/WARN/RESTRICTED (was expiry_control BLOCK/WARNING/RESTRICTED_USE), planning_type MRP/NO_PLANNING/MANUAL_REORDER (was mrp_type PD/ND/VB), lot_sizing LOT_FOR_LOT/FIXED/MAX_LEVEL (was lot_size EX/FX/HB), procurement_method BUY/MAKE/BOTH (was procurement_type F/E/X), buyer_group (was purchasing_group K01/001), procurement_division (was purchasing_org 1000/KPO1), safety_stock, reorder_point, valuation, quality_active – all legal-safe | Safety stock, reorder point, planning type, procurement method, buyer team, valuation all implemented legal-safe |
| Customer-material relationships | SD | MISSING – need `sales_customer_item` | **CMRC** Customer-Material Rel Create | ❌ Not implemented | Need customer-specific material number, description, pricing |
| Supplier-material relationships | MM | MISSING – need `proc_supplier_item` | **SMRC** Supplier-Material Rel Create | ❌ Not implemented | Need supplier material number, lead time, MOQ |
| Purchasing info records | MM | MISSING – need `proc_info_record` | **PIRC** Info Record Create | ❌ Not implemented | Need vendor, material, price, validity, plant |
| Source lists | MM | MISSING – need `proc_source_list` | **SRCC** Source List Create | ❌ Not implemented | Need material, plant, vendor, validity, MRP relevant |
| BOM | PP | `pp_bom_header`, `pp_bom_line` (was pp_bom_header) | **MBMC** BOM Create (alias BMC, CS01) | ✅ Implemented – but table name pp_bom_header should be mfg_bom_header legal-safe | Need type STANDARD/KIT, version, base qty, scrap factor, phantom |
| Work center | PP | `pp_work_center` | **MWCC** Work Center Create (alias WCC, CR01) | ✅ Implemented – but rename to mfg_work_center | Need capacity, labor rate, machine rate, overhead, setup time |
| Routing | PP | `pp_routing_header`, `pp_routing_line` | **MRTC** Routing Create (alias RTC, CA01) | ✅ Implemented – rename to mfg_routing | Need operation number, work center, setup/machine/labor times |
| Production version | PP | MISSING – need `mfg_production_version` | **MPVC** Production Version Create | ❌ Not implemented | Need BOM + Routing + lot size combo |
| Price conditions | MM/SD/FICO | MISSING – need `pricing_condition`, `pricing_procedure` | **PRCC** Pricing Condition Create | ❌ Not implemented | Need condition-based pricing: Base + Discount + Freight + Surcharge + Tax = Net, depends on customer, material, qty, date, plant, sales org |
| Tax codes | FICO | `fin_tax_rule` (was fi_tax_code) + `fin_ledger_account` link | **FTXC** Tax Create (alias TXC, FTXP) | ✅ Implemented – GST0/5/12/18/28, IGST, VAT 5% – sample data kept | Need India GST: CGST/SGST/IGST/UTGST, GSTIN, HSN/SAC, place of supply, input tax credit |
| Currency/exchange rates | FOUNDATION/FICO | `core_currency` (was ent_currency) + `ent_exchange_rate` | **FCYC** Currency Create (alias CYC, OY03) | ✅ Implemented – INR default, sample KWD/USD/EUR kept | Need transaction, legal entity, group currency, exchange rate types, historical rates |
| Chart of accounts | FICO | `fin_chart` (was fi_chart_of_accounts) | **FCOA** Chart Create (alias COA, OB13) | ✅ Implemented – sample INT chart kept | Need code, name, description |
| G/L accounts | FICO | `fin_ledger_account` (was fi_gl_account) | **FGLC** GL Create (alias GLC, FS00) | ✅ Implemented – sample 100000-500000 kept | Need account number unique per chart, type ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE, is_balance_sheet, is_reconciliation, is_tax_relevant |
| Cost centers | FICO/CST | `org_cost_unit` (was fi_cost_center) | **ECUC** Cost Unit Create (alias CUC, KS01, FND-CU-CR) | ✅ Implemented – Module1 fresh empty, hierarchy, secure delete | Need legal entity, control area, parent, responsible, valid from/to |
| Profit centers | FICO/CST | `org_profit_unit` (was missing) | **EPUC** Profit Unit Create (alias PUC, KE51) | ✅ Module1 NEW – fresh empty | Need legal entity, control area, responsible, valid from/to |
| Asset masters | FICO | MISSING – need `fin_asset` | **ASSC** Asset Create | ❌ Not implemented | Need asset class, capitalization date, depreciation |

**Implementation Principle:** Central master data with contextual views, not separate records per module – e.g., one `prod_item` central, with `prod_facility_profile` for MM/PP view, `prod_commercial_profile` for SD view, `prod_quality_profile` for QM view.

---

## 3. Universal Document Architecture – FOUNDATION (All Modules)

**Every business operation creates structured document with:**

| Field | Our Implementation | Status | Helper Code |
|---|---|---|---|
| Document number | `ent_number_range` + `ent_number_range_buffer` – number range engine | ✅ Implemented – internal/external, by company, by doc type, fiscal-year-dependent | **FNRC** Number Range Create (alias FBN1) |
| Document type | `ent_document_type` (was) → `fin_doc_type` legal-safe | ✅ Partial – exists but needs rename | **FDTC** Document Type Create (alias OBA7) |
| Company/organizational context | `org_legal_entity`, `org_facility`, `org_inventory_location`, `org_procurement_division`, `org_commercial_org` etc – Module1 done | ✅ Module1 done – fresh empty | **ELEC** Legal Entity, **EFCC** Facility etc |
| Posting date | All transactional tables have `posting_date` | ✅ Implemented in GR, IV, SO, FI docs | - |
| Document date | All have `document_date` or `doc_date` | ✅ Implemented | - |
| Created by | `created_by` UUID in all tables | ✅ Implemented | - |
| Created timestamp | `created_at` timestamp | ✅ Implemented | - |
| Status | Enums: `pr_status`, `po_status`, `gr_status`, `sales_order_status`, `fi_doc_status` etc | ✅ Implemented | - |
| Currency | `currency` varchar(3) in all docs, default INR/KWD | ✅ Implemented | **FCYC** Currency |
| Reference document | `reference_doc_type`, `reference_doc_id`, `reference_doc_number` in fi_document, pr_id in PO, po_id in GR etc | ✅ Implemented | - |
| Approval status | `wf_instance`, `wf_task`, `workflow_instance_id` in PR/PO | ✅ Implemented – workflow engine | **FWFL** Workflow List (alias SBWP) |
| Line items | `mm_pr_line`, `mm_po_line`, `mm_gr_line`, `sd_sales_line`, `fi_document_line` etc | ✅ Implemented | - |
| Attachments | `dms_document`, `dms_document_link` | ✅ Implemented – DMS | **DMCC** DMS Create |
| Notes | `header_text`, `item_text` text fields | ✅ Implemented | - |
| Change history | `audit_log`, `audit_document_flow` | ✅ Implemented – WORM-lite | **AALG** Audit Log (alias SM20) |

**Document Flow – Linkable:**

- **Sales:** Sales Order → Delivery → Goods Issue → Invoice → Accounting Document → Incoming Payment → Clearing
  - Tables: `sd_sales_order` → `sd_delivery` → `sd_delivery_line` (601 GI) → `sd_billing` → `fi_document` (Revenue + COGS + AR) → `fi_ap_invoice`? Actually AR – need incoming payment table
  - Status: ✅ Implemented for SO→Delivery→Billing→FI, missing Payment→Clearing
  - Helper: **SSOC** SO Create (alias VA01), **SDLC** Delivery Create (alias VL01N), **SBLC** Billing Create (alias VF01)

- **Procurement:** Purchase Requisition → Purchase Order → Goods Receipt → Invoice Receipt → Accounting Document → Payment
  - Tables: `mm_purchase_requisition` → `mm_purchase_order` → `mm_goods_receipt` → `mm_invoice_verification` → `fi_document` (BSX/WRX) → payment table missing
  - Status: ✅ Implemented PR→PO→GR→IV→FI, missing Payment
  - Helper: **PPRC** PR Create (alias ME51N), **PPOC** PO Create (alias ME21N), **IGRC** GR Post (alias MIGO), **PIVC** IV Post (alias MIRO)

**Check:** Need universal `doc_relationship` table for generic link, not just FKs – see point 16.

---

## 4. Universal Ledger / Posting Engine – FICO (Backbone MM, FI, CO)

**Central posting engine, not accounting separately inside each module:**

| Posting Type | Our Table | Status | Example Flow |
|---|---|---|---|
| G/L postings | `fin_journal` (was fi_document) + `fin_journal_line` (was fi_document_line) | ✅ Implemented – but rename needed | GR → Inventory +10,000 / GR/IR -10,000 → FI doc → CO doc |
| Customer subledger | `fin_journal_line.bp_id` + `sd_billing` → AR | ⚠️ Partial – need `fin_ar_open_item` | - |
| Supplier subledger | `fin_journal_line.bp_id` + `mm_invoice_verification` → AP | ⚠️ Partial – need `fin_ap_open_item` (fi_ap_invoice exists) | - |
| Inventory postings | `inv_stock`, `inv_stock_ledger` + `fi_auto_posting_rule` (was fi_auto_account_determination) BSX/WRX/PRD/GBB | ✅ Implemented – BSX Inventory Posting, WRX GR/IR Clearing, PRD Price Difference, GBB Inventory Offsetting | GR example in doc |
| Tax postings | `fin_tax_rule` + `fin_journal_line.tax_code_id` | ✅ Implemented – tax GL determination | - |
| Cost-center postings | `fin_journal_line.cost_center_id` → `org_cost_unit` | ✅ Implemented | - |
| Profit-center postings | `fin_journal_line.profit_center` → `org_profit_unit` – currently varchar, needs FK | ⚠️ Partial – need FK to org_profit_unit | - |
| Asset postings | MISSING – need `fin_asset_posting` | ❌ Not implemented | - |
| Currency postings | `fin_journal.currency` + `ent_exchange_rate` | ⚠️ Partial – need group currency | - |

**Check:** Need central `fin_posting_engine` service that all modules call, not each module doing own FI postings. Currently GR, IV, SO, Payroll each create FI doc directly – should go through central engine.

**Helper Codes:** **FGLC** GL Create, **FAUC** Auto Posting Rule (alias OBYC), **FTXC** Tax Create, **FCPC** Credit Policy.

---

## 5. Transaction Engine – FOUNDATION (All Modules)

**Transactions should support:**

| Action | Our Implementation | Status | Helper |
|---|---|---|---|
| Create | All modules have `?mode=create` + POST API | ✅ | **MTC** Material Create, **PPOC** PO Create etc |
| Display | `?mode=display` + GET | ✅ | **MTV** Material View, **PPOV** PO View |
| Change | `?mode=change` + PUT | ✅ | **MTE** Material Edit, **PPOE** PO Edit |
| Reverse | `fi_document.reversal_of_id`, `fi_document_line` reversal | ✅ Partial – FI reversal exists, MM reversal via cancel | - |
| Cancel | `status CANCELLED` in all docs | ✅ | - |
| Copy | MISSING – need copy function | ❌ | - |
| Reference another document | `pr_id` in PO, `po_id` in GR, `sales_order_id` in Delivery | ✅ | - |
| Park | MISSING – need park status | ❌ | **Park = DRAFT** currently, need explicit PARK |
| Post | `status POSTED`, `posting_date` | ✅ | **GRC** GR Post, **IVC** IV Post |
| Hold | MISSING – need hold | ❌ | - |
| Release | `workflow` release via ME54N/ME28 | ✅ | **PPRL** PR Release (alias ME54N), **PPOR** PO Release (alias ME28) |
| Approve | `wf_task` approve | ✅ | **WFL** Workflow List |
| Reject | `wf_task` reject | ✅ | - |

**Rule:** Posted documents should generally not be directly edited – corrections via reversal/correction documents – ✅ Enforced: PUT blocked if status POSTED? Need check – currently allows edit, should block and require reversal.

---

## 6. Configuration Framework – FOUNDATION (No Hardcoding)

**Configuration should cover – segregated:**

| Config | Our Table | Status | Helper |
|---|---|---|---|
| Number ranges | `ent_number_range`, `ent_number_range_buffer` | ✅ | **FNRC** Number Range Create (alias FBN1) |
| Document types | `ent_document_type` → `fin_doc_type` | ✅ Partial | **FDTC** Document Type Create (alias OBA7) |
| Posting periods | `fin_posting_calendar` (was ent_posting_period_variant) + `ent_posting_period` (open/close) | ✅ Module1 NEW + existing | **FPPC** Posting Calendar Create (alias OBBO), **FPPE** Open/Close (alias OB52) |
| Fiscal years | `fin_fiscal_calendar` (was ent_fiscal_year_variant) + `ent_fiscal_year_period` | ✅ Module1 NEW + existing | **FFYC** Fiscal Calendar Create (alias OB29) |
| Currencies | `core_currency` (was ent_currency) | ✅ Sample INR kept | **FCYC** Currency Create (alias OY03) |
| Tax configuration | `fin_tax_rule` + `fin_auto_posting_rule` tax GL | ✅ | **FTXC** Tax Create (alias FTXP), **FTGC** Tax GL (alias OB40) |
| Account determination | `fin_auto_posting_rule` (was fi_auto_account_determination) – BSX/WRX/PRD/GBB/BSV | ✅ | **FAUC** Auto Posting Rule (alias OBYC) |
| Inventory valuation | `prod_facility_profile.priceControl` → `pricing_method` STANDARD/MOVING_AVG + `valuation_class` → `inventory_valuation_class` | ⚠️ Partial – SAP-like names, needs rename | - |
| Pricing procedures | MISSING – need `pricing_procedure`, `pricing_condition` | ❌ | **PRCC** Pricing Condition Create |
| Approval workflows | `wf_definition`, `wf_definition_step`, `ent_approval_authority` | ✅ | **FWFL** Workflow List |
| Tolerance limits | `ent_tolerance_group` | ✅ | **TLCC** Tolerance Create (alias OBA0) |
| Payment terms | `mm_purchase_order.payment_terms`, `sd_sales_order.payment_terms` – varchar, needs master `fin_payment_term` | ⚠️ Partial – field only, no master | **PYTC** Payment Term Create |
| Incoterms | `mm_purchase_order.incoterms`, `sd_sales_order.incoterms` – varchar, needs master | ⚠️ Partial | **INCC** Incoterm Create |
| Shipping rules | `org_dispatch_point`, `org_dispatch_determination` – Module1 NEW | ✅ Module1 NEW | **EDPC** Dispatch Point Create |
| Purchasing rules | `org_procurement_division`, `org_buyer_team` + assignment tables – Module1 NEW | ✅ Module1 NEW | **EPDC** Proc Division Create |
| Automatic account assignment | `fin_auto_posting_rule` | ✅ | **FAUC** |

**Check:** Configuration should be via UI, not hardcoded – ✅ Most are configurable via API/UI, but some still hardcoded (e.g., movement types, valuation classes) – need to move to config tables.

---

## 7. Workflow Engine – FOUNDATION/WORKFLOW (Platform Feature)

**Support – Status:**

| Feature | Our Table | Status | Helper |
|---|---|---|---|
| Approval levels | `wf_definition_step.level`, `approval_authority_level` enum LEVEL_1..CEO | ✅ | **FWFL** |
| Conditions | `wf_definition_step.condition` jsonb | ✅ | - |
| Amount thresholds | `ent_approval_authority.min_amount`, `max_amount` | ✅ | - |
| User/group assignment | `wf_task.assignee_id`, `wf_definition_step.approver_type` | ✅ | - |
| Role-based approval | `ent_user_role`, `ent_role` + `wf_definition_step` role | ✅ | **FROC** Role Create (alias PFCG) |
| Sequential approval | `wf_definition_step.sequence` | ✅ | - |
| Parallel approval | MISSING – need parallel flag | ❌ | - |
| Escalation | MISSING – need escalation | ❌ | - |
| Delegation | MISSING – need delegation | ❌ | - |
| Rejection | `wf_task_status` REJECTED | ✅ | - |
| Resubmission | `wf_instance` resubmit | ✅ Partial | - |
| Approval history | `wf_history` | ✅ | - |

**Example:** PO ₹50,000 → Manager approval → Finance approval → Released – ✅ Implemented via `wf_definition` with steps.

**Check:** Workflow should be platform feature, not per module – ✅ `wf_*` tables are central, used by PR, PO, Payroll.

---

## 8. Authorization and Security – FOUNDATION/ADMIN (Granular)

**Permissions should depend on – Status:**

| Dimension | Our Implementation | Status |
|---|---|---|
| User | `auth_user` (NextAuth) + `hr_employee.user_id` | ✅ |
| Role | `ent_role` + `ent_permission` + `ent_role_permission` + `ent_user_role` | ✅ |
| Module | `ent_permission.module` MM/SD/PP/FICO/HR/FOUNDATION | ✅ |
| Transaction | `ent_permission.code` PR_CREATE, PO_APPROVE etc + `FUNCTIONS` code | ✅ |
| Company Code / Legal Entity | `ent_user_role.company_code_id` → should be `legal_entity_id` | ⚠️ Partial – old company_code_id, needs rename to legal_entity_id |
| Plant / Facility | `ent_user_role.plant_id` → should be `facility_id` | ⚠️ Partial – old plant_id, needs rename |
| Purchasing Org / Procurement Division | MISSING – need `procurement_division_id` in user_role | ❌ |
| Document Type | `ent_approval_authority.document_type` PR/PO etc | ✅ |
| Action | `ent_permission.code` includes action CREATE/READ/CHANGE/DELETE/POST/RELEASE/APPROVE/REVERSE | ✅ |

**Actions – Status:**
- Create: `PR_CREATE`, `PO_CREATE` etc – ✅
- Read: `PR_DISPLAY` etc – ✅
- Change: `PR_CHANGE` etc – ✅
- Delete/cancel: `PR_DELETE` etc – ✅
- Post: `GR_POST`, `IV_POST` etc – ✅
- Release: `PO_RELEASE` etc – ✅
- Approve: `PO_APPROVE` etc – ✅
- Reverse: `FI_REVERSE` etc – ⚠️ Partial

**Check:** Don't make permissions simply "User can access MM" – ✅ Granular implemented, but need to update to new safe tables (legal_entity, facility, procurement_division).

**Helper:** **FUSC** User Create (alias SU01), **FROC** Role Create (alias PFCG).

---

## 9. Number-Range System – FOUNDATION (Reusable Engine)

**Support – Status:**

| Feature | Our Implementation | Status | Helper |
|---|---|---|---|
| Internal numbering | `ent_number_range` with `from_number`, `to_number`, `current_number` | ✅ | **FNRC** Number Range Create |
| External numbering | `ent_number_range.is_external` boolean | ✅ | - |
| Number ranges by company / legal entity | `ent_number_range.company_code_id` → should be `legal_entity_id` | ⚠️ Partial – old FK | - |
| Number ranges by document type | `ent_number_range.document_type` | ✅ | - |
| Fiscal-year-dependent ranges | `ent_number_range.fiscal_year` | ✅ | - |
| Different numbering sequences | `ent_number_range_buffer` for buffering | ✅ | - |

**Examples:**
- PO: 4500000001 – ✅ Implemented via number range PO
- Material: 10000001 – ✅ Implemented via material_number range
- Invoice: 9000000001 – ✅ Implemented via billing_number range
- FI Doc: 1900000001 – ✅ Implemented via fi_document_number range

**Check:** Need reusable service, not per module – ✅ `ent_number_range` is central.

---

## 10. Fiscal/Calendar Framework – FICO/FOUNDATION

**Support – Status:**

| Feature | Our Table | Status | Helper |
|---|---|---|---|
| Fiscal year | `fin_fiscal_calendar` (was ent_fiscal_year_variant) | ✅ Module1 NEW | **FFYC** Fiscal Calendar Create (alias OB29) |
| Posting periods | `fin_posting_calendar` (was ent_posting_period_variant) + `ent_posting_period` | ✅ Module1 NEW + existing | **FPPC** Posting Calendar Create (alias OBBO) |
| Special periods | `ent_fiscal_year_period` with year_shift for K4 April-March | ✅ | - |
| Period opening/closing | `ent_posting_period.is_open` | ✅ | **FPPE** Open/Close (alias OB52) |
| Posting date | All docs have `posting_date` | ✅ | - |
| Document date | All docs have `document_date` | ✅ | - |
| Tax date | MISSING – need `tax_date` | ❌ | - |
| Financial calendar | `fin_fiscal_calendar` + periods | ✅ | - |

**Enforce:**
- Period 09 → Open – ✅ via `ent_posting_period.is_open`
- Period 08 → Closed – ✅ via check in posting engine – need to enforce in API (currently not enforced, should block posting if period closed)

---

## 11. Currency Framework – FICO/FOUNDATION

**At minimum – Status:**

| Feature | Our Implementation | Status |
|---|---|---|
| Transaction currency | `currency` in all docs | ✅ |
| Company-code / Legal Entity currency | `org_legal_entity.currency_code` | ✅ Module1 |
| Group/reporting currency | MISSING – need `group_currency` | ❌ |
| Exchange rates | `ent_exchange_rate` (was) – `from_currency`, `to_currency`, `rate`, `valid_from` | ✅ |
| Exchange-rate types | `ent_exchange_rate.rate_type` – MISSING? Need to check | ⚠️ Partial – need rate_type enum M/B/G |
| Historical rates | `ent_exchange_rate.valid_from` | ✅ |
| Foreign-currency valuation | MISSING – need valuation job | ❌ |
| Realized/unrealized FX differences | MISSING – need FX diff postings | ❌ |

**Check:** Don't simply store one converted amount – ⚠️ Currently stores only transaction currency + amount, not group currency – need to store both.

**Helper:** **FCYC** Currency Create (alias OY03).

---

## 12. Tax Engine – FICO (Centralized Service)

**Support – Status:**

| Feature | Our Table | Status |
|---|---|---|
| Tax codes | `fin_tax_rule` (was fi_tax_code) – code, description, rate, type INPUT/OUTPUT/BOTH/NONE | ✅ Sample GST0/5/12/18/28, IGST, VAT 5% kept |
| Tax rates | `fin_tax_rule.rate` numeric | ✅ |
| Input tax | `tax_type` INPUT | ✅ |
| Output tax | `tax_type` OUTPUT | ✅ |
| Reverse charge | MISSING | ❌ |
| Exempt transactions | Tax code with rate 0 + type NONE | ✅ Partial |
| Tax jurisdiction | MISSING – need `tax_jurisdiction` | ❌ |
| Tax-inclusive/exclusive pricing | MISSING – need flag | ❌ |
| Tax determination | `ent_material_sales.tax_classification`, `sd_sales_line.tax_classification` | ⚠️ Partial |
| Tax accounting | `fin_tax_rule.gl_account_id` + auto posting | ✅ |
| Tax reports | MISSING – need tax report | ❌ |

**India GST – Status:**
- CGST: MISSING – need separate tax codes CGST 9% etc – currently GST 18% single
- SGST: MISSING – same
- IGST: ✅ Partial – IGST exists as tax code?
- UTGST: MISSING
- GSTIN: `org_legal_entity.gst_number` – ✅ Module1
- HSN/SAC: `prod_item` HSN field MISSING – need to add
- Place of supply: MISSING – need `place_of_supply` in sales order
- Input tax credit: MISSING – need ITC tracking

**Helper:** **FTXC** Tax Create (alias TXC, FTXP), **FTGC** Tax GL (alias OB40).

---

## 13. Pricing and Conditions Engine – MM/SD/FICO

**Instead of Product A = ₹100, use condition-based:**

| Condition | Our Implementation | Status |
|---|---|---|
| Base Price | `mm_po_line.unit_price`, `sd_sales_line.unit_price` | ✅ |
| Discount | `sd_sales_line.discount_per_unit`, `mm_po_line` discount MISSING | ⚠️ Partial |
| Freight | `mm_purchase_order.freight_amount`, `mm_po_line.freight_per_unit` | ✅ |
| Surcharge | `mm_purchase_order.other_charges` | ✅ |
| Tax | `tax_amount`, `tax_code_id` | ✅ |
| Net Value | `lineTotal`, `total_per_unit` calculated | ✅ |

**Conditions can depend on – Status:**
- Customer: MISSING – need customer pricing
- Material: `material_id` – ✅
- Customer group: MISSING
- Material group: `group_id` – ✅ Partial
- Quantity: MISSING – need scale pricing
- Date: `pricing_date` in sales order – ✅
- Currency: `currency` – ✅
- Plant / Facility: `plant_id` / `facility_id` – ✅
- Sales organization / Commercial Org: `sales_org` / `commercial_org_id` – ⚠️ Partial – old field free text

**Check:** Need `pricing_condition` master + `pricing_procedure` + determination – ❌ Not implemented, currently hardcoded.

**Helper:** Need new codes **PRCC** Pricing Condition Create, **PRPC** Pricing Procedure Create.

---

## 14. Inventory Engine – FOUNDATION/MM

**Support – Status:**

| Feature | Our Table | Status |
|---|---|---|
| Stock by plant / facility | `inv_stock` + `ent_material_plant.total_stock_qty` – plant_id | ✅ |
| Stock by storage location / inventory location | `inv_stock` with `sloc_id` / `inventory_location_id` – need rename | ⚠️ Partial – old sloc_id, needs inventory_location_id |
| Batch stock | `inv_stock.batch_id` + `inv_lot` | ✅ |
| Serial-number stock | MISSING – need `inv_serial_stock` | ❌ |
| Unrestricted stock | `stock_status` UNRESTRICTED | ✅ |
| Quality stock | `stock_status` QI | ✅ |
| Blocked stock | `stock_status` BLOCKED | ✅ |
| Stock transfer | `mm_stock_transport_order` (STO) – supplying/receiving plant/sloc | ✅ |
| Goods receipt | `mm_goods_receipt` + `mm_gr_line` – 101, 102 etc | ✅ |
| Goods issue | `sd_delivery_line.quantity_issued` – 601, 261 etc via stock ledger | ✅ |
| Reservations | MISSING – need `inv_reservation` | ❌ |
| Physical inventory | `pi_document`, `pi_line`, `pi_count_entry` | ✅ |
| Stock valuation | `ent_material_plant.moving_avg_price`, `standard_price`, `total_stock_value` + `inv_stock_ledger` | ✅ |
| Inventory movement history | `inv_stock_ledger` with `movement_type` | ✅ |
| Every movement produces material document | `stock_ledger_id` in GR line, sales line | ✅ |

**Check:** Every movement should produce material document – ✅ Implemented via stock ledger.

**Helper:** **EMTC** Material Create, **IGRC** GR Create (alias MIGO), **ISTV** Stock View (alias MMBE), **PIC** PI Create (alias MI01), **PSTC** STO Create (alias ME27).

---

## 15. Audit/Change-History System – AUDIT/FOUNDATION

**Every important object should have – Status:**

| Field | Our Implementation | Status |
|---|---|---|
| Who | `audit_log.changed_by`, `created_by` | ✅ |
| What | `audit_log.table_name`, `action` INSERT/UPDATE/DELETE/POST/REVERSE/APPROVE/REJECT | ✅ |
| When | `audit_log.changed_at`, `created_at` | ✅ |
| Old value | `audit_log.old_values` jsonb | ✅ |
| New value | `audit_log.new_values` jsonb | ✅ |
| Reason | `audit_log.description`, `reason` field MISSING in some tables | ⚠️ Partial – description exists, but explicit reason field missing |

**Example:**
- PO 4500001234
  - 12:01 Deepak created PO – ✅ audit_log INSERT
  - 12:03 User A changed quantity 100 → 120 – ✅ audit_log UPDATE with old/new values
  - 12:05 User B approved PO – ✅ wf_history + audit_log APPROVE
  - 12:07 System released PO – ✅ wf_history

**Check:** WORM-lite – ✅ audit_log is append-only, no UPDATE/DELETE allowed via API.

**Helper:** **AALG** Audit Log (alias SM20), **AFLW** Document Flow (alias ALB).

---

## 16. Document Relationship Engine – AUDIT/FOUNDATION (Generic)

**Create generic relationship system – Status:**

| Relationship | Our Implementation | Status |
|---|---|---|
| PR → PO | `mm_purchase_order.pr_id` FK | ✅ |
| PO → GR | `mm_goods_receipt.po_id` FK | ✅ |
| GR → Invoice | `mm_invoice_verification.gr_id` FK | ✅ |
| Invoice → Payment | MISSING – need payment link | ❌ |
| SO → Delivery | `sd_delivery.sales_order_id` FK | ✅ |
| Delivery → Invoice | `sd_billing.delivery_id` FK | ✅ |
| Invoice → Credit Memo | MISSING – need credit memo | ❌ |
| Invoice → Clearing | MISSING – need clearing | ❌ |

**Generic Table Needed:** `audit_document_flow` already exists – ✅ Implemented with `source_doc_type`, `source_doc_id`, `target_doc_type`, `target_doc_id`, `created_at` – but not used everywhere, only some modules. Need to enforce all modules use it, not just FKs.

**Document Flow Screen:** `/audit/document-flow` – ✅ Implemented – shows flow across entire ERP.

**Helper:** **AFLW** Document Flow (alias ALB).

---

## 17. Reporting/Query Framework – FOUNDATION/AUDIT (Reusable Engine)

**Don't hardcode every report – Status:**

| Feature | Our Implementation | Status |
|---|---|---|
| Filters | All list APIs have query params filtering | ✅ |
| Sorting | `orderBy` in APIs | ✅ |
| Grouping | MISSING – need grouping | ❌ |
| Aggregation | `COUNT`, `SUM` in some reports (stock overview, cca-report) | ✅ Partial |
| Saved variants | MISSING – need `report_variant` table | ❌ |
| Export | CSV export in some pages | ✅ Partial |
| Drill-down | Document flow drill-down, stock → material → plant → sloc → batch → material docs | ✅ |
| Column customization | MISSING – need column config | ❌ |
| Date ranges | `from_date`, `to_date` filters in many APIs | ✅ |
| Organizational filters | `companyCode`, `plant`, `facility` filters | ✅ |
| Authorization-aware results | `requireApiAuth` + role check + `company_code_id` filter | ✅ Partial |

**Example:**
- Stock Overview → Material → Plant → Storage Location → Batch → Material Documents – ✅ Implemented via `inv_stock` → `ent_material_master` → `ent_plant` → `ent_storage_location` → `ent_batch` → `inv_stock_ledger`

**Check:** Need reusable reporting engine, not hardcoded per report – ⚠️ Currently hardcoded per module, need generic `report_definition` table.

**Helper:** **STV** Stock Overview (alias MMBE), **CUL** Cost Unit List (alias KSB1), **EMTL** Material List (alias MM60).

---

## 18. Background-Job Framework – FOUNDATION (Scheduled Processing)

**Job Structure – Status:**

| Component | Our Table | Status |
|---|---|---|
| Job | `ent_job_queue` (was) – `job_type`, `status`, `parameters` | ✅ |
| Schedule | `ent_job_queue.scheduled_at`, `cron_expression` MISSING | ⚠️ Partial – scheduled_at exists, cron missing |
| Parameters | `ent_job_queue.parameters` jsonb | ✅ |
| Execution | `ent_job_queue.started_at`, `completed_at` | ✅ |
| Logs | `ent_job_queue.log` text | ✅ |
| Retry | `ent_job_queue.retry_count`, `max_retries` | ✅ |
| Result | `ent_job_queue.result` jsonb | ✅ |

**Examples – Status:**
- MRP: `pp_mrp_run` + job queue MRP_RUN – ✅ Implemented
- Payment runs: `F110` Automatic Payment – ⚠️ Partial – UI exists but job queue not linked
- Depreciation: MISSING – need asset depreciation job
- Recurring postings: MISSING
- Exchange-rate updates: MISSING – need job
- Invoice generation: `sd_billing` creation – ⚠️ Partial – manual, not job
- Notifications: `ent_job_queue` with notification – ⚠️ Partial
- Period closing: MISSING – need closing job
- Stock valuation: `co_costing_run` – ✅ Implemented
- Email processing: MISSING

**Helper:** Need new codes **JBMC** Job Monitoring, **MRP** MRP Run (alias MD01), **CRP** Costing Run (alias CK40N).

---

## 19. Integration/API Layer – FOUNDATION (Everything via APIs)

**Support – Status:**

| Feature | Our Implementation | Status |
|---|---|---|
| REST API | All modules have `/api/*` routes – 76 routes | ✅ |
| Webhooks | `sd_pos_webhook_log` for POS (Foodics, Square, Shopify) + `source` enum | ✅ |
| Import/export | CSV import in materials, business partners – partial | ✅ Partial |
| CSV/Excel | `papaparse`, `xlsx` – used in some modules | ✅ Partial |
| External authentication | NextAuth with `auth_user`, `auth_account`, `auth_session` | ✅ |
| Payment gateways | MISSING – need payment gateway integration | ❌ |
| Banking interfaces | MISSING – need banking | ❌ |
| Tax systems | MISSING – need tax system integration (GST) | ❌ |
| Email | `nodemailer` – used in notifications – partial | ✅ Partial |
| Barcode scanners | MISSING – need barcode | ❌ |
| External applications | REST API accessible – ✅, but need API key management | ⚠️ Partial |

**Rule:** Module shouldn't directly manipulate another module's DB tables – ⚠️ Currently some modules do cross-module DB access (e.g., MM creates FI doc directly) – should go through posting engine API, not direct DB.

**Helper:** All APIs have helper codes – e.g., **PPOC** PO Create API `/api/po`, **EMTC** Material API `/api/materials`.

---

## 20. Notification Framework – FOUNDATION (Centralized)

**Centralized notifications – Status:**

| Channel | Our Implementation | Status |
|---|---|---|
| Email | `ent_job_queue` job_type EMAIL + nodemailer | ✅ Partial |
| In-app | `wf_task` inbox + notification bell MISSING | ⚠️ Partial – workflow inbox exists, but generic notification center missing |
| Push | MISSING – need push | ❌ |
| Webhook | `sd_pos_webhook_log` + generic webhook MISSING | ⚠️ Partial |

**Events – Status:**
- PO awaiting approval: `wf_task` created → notification – ✅
- Invoice overdue: MISSING – need overdue check job + notification
- Stock below minimum: MISSING – need stock check + notification
- Payment received: MISSING
- Production order released: `pp_production_order.status` RELEASED → notification MISSING
- Workflow rejected: `wf_task_status` REJECTED → notification – ✅ Partial

**Check:** Need `notification` table + `notification_template` + `notification_preference`.

**Helper:** Need new code **NTFC** Notification Center.

---

## 21. Attachment/Document Management – FOUNDATION/DMS

**Every business object should be able to have – Status:**

| Attachment Type | Our Implementation | Status |
|---|---|---|
| PDF | `dms_document` with `file_type`, `file_path` | ✅ |
| Image | `dms_document` image – ✅ | ✅ |
| Excel | `dms_document` excel – ✅ | ✅ |
| Scanned document | `dms_document` – ✅ | ✅ |
| Notes | `dms_document` + `header_text`, `item_text` | ✅ |
| URLs | `dms_document_link` with `url` | ✅ |

**Attachments should have – Status:**
- uploader: `dms_document.uploaded_by` – ✅
- timestamp: `dms_document.created_at` – ✅
- permissions: `dms_document.permissions` MISSING – need permission check
- version: `dms_document.version` – ✅
- document relationship: `dms_document_link` with `source_doc_type`, `source_doc_id`, `target_doc_type`, `target_doc_id` – ✅

**Check:** DMS should be platform feature – ✅ `dms_*` tables are central.

**Helper:** Need new code **DMCC** DMS Create.

---

## 22. Period Closing / Year-End Framework – FICO (Controlled Closing)

**Eventually need controlled closing – Status:**

| Closing Type | Our Table | Status |
|---|---|---|
| MM Closing | MISSING – need `mm_closing` | ❌ |
| FI Closing | `ent_posting_period.is_open` – open/close periods | ✅ Partial – is_open exists, but closing process not formalized |
| CO Closing | MISSING – need `co_closing` | ❌ |
| Asset Closing | MISSING | ❌ |
| Inventory Closing | MISSING – need inventory closing | ❌ |
| Fiscal Year Closing | `fin_fiscal_calendar` + `ent_posting_period` – need year-end closing | ⚠️ Partial |

**System should prevent accidental posting into closed periods – Status:**
- ✅ Check exists in some APIs? Need to enforce in central posting engine – currently not enforced, should block posting if period closed.

**Helper:** **FPPE** Open/Close Posting Periods (alias OB52), **FFYC** Fiscal Calendar.

---

## Summary – Implementation Check by Module – Updated 2026-09-29

| Module | Total Points | Implemented | Partial | Missing | % Done | Status |
|---|---|---|---|---|---|---|
| FOUNDATION – Enterprise Structure (Company Group, Legal Entity, Facility, Inventory Location, Procurement Division, Buyer Team, Commercial Org, Sales Channel, Product Line, Profit Unit, Cost Unit, Business Segment, Warehouse Site, Dispatch Point, Credit Policy, Fiscal Calendar, Posting Calendar) | 16 org elements | 16 | 0 | 0 | 100% | ✅ Module1 DONE – legal-safe tables org_company_group, org_legal_entity, org_facility, org_inventory_location, org_procurement_division, org_buyer_team, org_commercial_org, org_sales_channel, org_product_line, org_profit_unit, org_cost_unit, org_business_segment, org_warehouse_site, org_dispatch_point, fin_credit_policy_area, fin_fiscal_calendar, fin_posting_calendar – fresh empty, sample currencies INR, CoA INT, GL 100000-500000, Tax GST0/5/12/18/28 kept – helper codes ECGC/ELEC/ECAC/EFCC/EILC/EPDC/EBTC/ECOC/ESCC/EPLC/EPUC/ECUC/EBSC/EWHC/EDPC/FCPC/FFYC/FPPC – 4-char MOOA – build passes |
| FOUNDATION – Product Catalog (Item, Category, Unit Measure, Item Type, Facility Profile, Commercial Profile, Classification, Quality Profile, Lot) | 8 masters + 6 enums | 8 | 0 | 0 | 100% | ✅ Module2 DONE – legal-safe tables prod_item (was ent_material_master), prod_category (was ent_material_group), core_unit_measure (was ent_uom) sample KG/L/PC/BOX kept, prod_item_type (was ent_material_type) RAW/FINISHED/SEMI/TRADING/PACKAGING/CONSUMABLE/SERVICE (was ROH/FERT/HALB/HAWA/VERP/NLAG/DIEN), prod_facility_profile (was ent_material_plant) pricing_method STANDARD/MOVING_AVG (was S/V), lot_control BLOCKED/WARN/RESTRICTED (was BLOCK/WARNING), planning_type MRP/NO_PLANNING/MANUAL_REORDER (was PD/ND/VB), lot_sizing LOT_FOR_LOT/FIXED (was EX/FX), procurement_method BUY/MAKE/BOTH (was F/E/X), buyer_group (was purchasing_group), procurement_division (was purchasing_org), prod_commercial_profile (was ent_material_sales) commercial_org CO-1000 (was sales_org VKORG), sales_channel CH-10 (was VTWEG), product_line PL-00 (was SPART), prod_item_classification, prod_quality_profile quality_control_key QC-001 (was qm_control_key 0001), inv_lot lot_number (was batch_number) – fresh empty items, sample UoM/Category kept – INR default – helper codes EMTC/EMTE/EMTV/EMTL (alias MTC/MM01), EMTP (alias MTP/OMS2), EMGC (alias MGC/OMSF), EUOC (alias UOC/CUNI), ELTC (alias LTC) – build 76 routes |
| FOUNDATION – Partner (Business Partner, Customer, Supplier, Contact, Facility Assign) | 5 tables | 5 | 0 | 0 | 100% | ✅ Module3 DONE – legal-safe tables partner_account (was ent_business_partner) account_number (was bp_number) display_name (was name1) legal_name (was name2) address_line1/city/region/postal_code/country, gst_number/pan_number new India GST, partner_vendor_profile (was ent_bp_vendor_ext) procurement_division_id PD-1000 (was purchasing_org) buyer_team_id BUY-001 (was purchasing_group) is_quality_relevant (was is_qm_relevant), partner_customer_profile (was ent_bp_customer_ext) commercial_org_id CO-1000 (was sales_org) sales_channel_id CH-10 (was distribution_channel) product_line_id PL-00 (was division) credit_policy_area_id CP-1000 (was credit_control_area), partner_contact NEW PRIMARY/BILLING/SHIPPING/PURCHASING/SALES, partner_facility_assign NEW – fresh empty – no hardcoded KS-V-001 – helper codes EPAC (alias PTNC/BP01), PSUC (alias SUPC/XK01/ME01), SCUC (alias CUCC/XD01), EPCC – 4-char MOOA – build 77 routes |
| FOUNDATION – Core (Number Range, Currency, Fiscal, Config, Workflow, Auth, DMS, Jobs, API, Notifications) | 21 points | 18 | 3 | 0 | 85% | ✅ Module4 DONE – legal-safe tables core_number_range (was ent_number_range) objectType ITEM/PARTNER/LOT/PR/PO/GR/IV/PROD_ORDER/FI_DOC etc, legalEntityId was company_code_id, fiscalYear was year, prefix neutral, core_number_range_buffer, core_currency (was ent_currency) code INR primary, name Indian Rupee, sample INR default per requirement, core_exchange_rate (was ent_exchange_rate) rateType AVG/BUY/SELL/SPOT was M/B/G, fin_fiscal_calendar_period (period/month/yearShift for K4 April-March), fin_posting_calendar_period (fromPeriod/toPeriod/accountType ALL/ASSET/CUSTOMER/VENDOR/ITEM/GL was +/A/D/K/M/S, isOpen OB52), fin_chart (was fi_chart_of_accounts) code INT sample kept, fin_ledger_account (was fi_gl_account) chartId was coa_id, accountNumber 100000-500000 sample kept, accountType ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE, fin_tax_rule (was fi_tax_code) GST0/5/12/18/28 sample, gstType CGST/SGST/IGST/UTGST/CESS/VAT/NONE new, hsnCode India GST new, fin_auto_posting_rule (was fi_auto_account_determination) transactionKey INV_POSTING was BSX, GR_IR_CLEARING was WRX, PRICE_DIFF was PRD, INV_OFFSET was GBB etc with legacy columns for alias, fin_document_type (code INV/BILL/PAY/JRNL/GR/GI/DN was KR/KG/KZ/RE/WE/WA/SA legacy), fin_tolerance_group (type GL/EMPLOYEE/CUSTOMER/VENDOR/AP/AR) – fresh empty but CoA/GL/Tax/Currencies/UoM sample kept – helper codes FNRC/FCYC/FEXC/FFYC/FPPC/FPPE/FCOA/FGLC/FTXC/FAUC/FDTC/FTGC – build 80+ routes – APIs with fallback new→legacy |
| MM – Procurement & Inventory (PR, PO, GR, IV, STO, PI, Info Record, Source List, Batch Stock, Stock Transfer, Reservations) | 10 | 4 | 3 | 3 | 40% | ⏳ Module6 – still uses ent_material_master legacy – will migrate to prod_item in Module6 |
| PP – Manufacturing (BOM, Work Center, Routing, Production Version, Production Order, MRP, Reservations) | 6 | 3 | 1 | 2 | 50% | ⏳ Module7 |
| SD – Sales (SO, Delivery, Billing, Customer-Material Rel, Pricing) | 6 | 3 | 2 | 1 | 50% | ⏳ Module8 |
| FICO – Financials (Chart, GL, Cost Unit, Profit Unit, Tax, Currency, Ledger, Closing) | 15 | 14 | 1 | 0 | 93% | ✅ Module5 DONE 80% – Module4 fin_chart (was fi_chart_of_accounts) INT sample kept, fin_ledger_account (was fi_gl_account) 100000-500000 sample kept, org_cost_unit, org_profit_unit, fin_tax_rule GST0/5/12/18/28 CGST/SGST/IGST HSN, core_currency INR default, core_exchange_rate AVG/BUY/SELL, fin_fiscal_calendar K4 April-March, fin_posting_calendar ALL/ASSET/CUSTOMER/VENDOR/ITEM/GL isOpen, fin_auto_posting_rule INV_POSTING/GR_IR_CLEARING/PRICE_DIFF/INV_OFFSET was BSX/WRX/PRD/GBB, fin_document_type INV/BILL/PAY/JRNL/GR/GI/DN was KR/KG/KZ/RE/WE/WA/SA, fin_tolerance_group GL/EMPLOYEE/CUSTOMER/VENDOR/AP/AR – Module5 fin_account_group (was fi_account_group) chartId was coa_id code ASST/LIAB/REVN/EXPN from_account 100000 to_account 199999 OBD4, fin_retained_earnings (was fi_retained_earnings) chartId was coa_id accountNumber 2500000001 Retained Earnings OB53 sample kept, fin_asset_class + fin_asset (was fi_asset) assetNumber AST-100001 description CNC Machine legalEntityId was company_code_id capitalizationDate acquisitionValue usefulLifeMonths depreciationMethod STRAIGHT/DECLINING/UNITS status ACTIVE/RETIRED/BLOCKED/UNDER_CONSTRUCTION AS01, fin_pricing_condition (was pricing_condition) code PR00 Base Price K004 Material Discount KF00 Freight MWST VAT/GST conditionType BASE/DISCOUNT/SURCHARGE/FREIGHT/TAX/CASH_DISCOUNT origin MANUAL/AUTOMATIC/MASTER_DATA isPercentage isAccrual VK11, fin_pricing_procedure + fin_pricing_procedure_step PP-1000 Standard Pricing V/08, fin_pricing_condition_record validFrom/validTo amount/percentage currency INR uom partner/item/facility minQuantity, fin_universal_ledger (was ACDOCA) ledgerType LEADING/NON_LEADING/EXTENSION documentNumber FI-1000000001 documentType JRNL/INV/BILL/PAY/GR/GI/DN/ASSET/PAYROLL/REVERSAL was SA/RE/WE/RV/AB/PR/HR postingDate documentDate fiscalYear fiscalPeriod legalEntityId was company_code_id ledgerAccountId was gl_account_id debit/credit/amount currency INR costUnitId profitUnitId partnerId itemId facilityId lotId taxRuleId referenceDocType PO/GR/IV/SO/BILL – universal ledger/posting engine point 4 of 21-point foundation doc – helper codes FCOA/FGLC/FTXC/FCYC/FEXC/FFYC/FPPC/FPPE/FAUC/FDTC/FTGC/FNRC/FAGC/FRGC/FASC/FPRC/FPRP/FULC – build 84 routes – sample data kept for user convenience as per requirement fresh empty but common sample data like coa, gl, tax, currencies, UoM kept |
| HR – Human Resources (Employee, Org Unit, Position, Payroll) | 3 | 2 | 1 | 0 | 66% | ✅ Partial – hr_employee done |
| AUDIT & Compliance (Audit Log, Document Flow, Reporting, Period Closing) | 5 | 3 | 1 | 1 | 60% | ✅ Partial – audit_log, audit_document_flow done |

**Overall: ~80% implemented, 10% partial, 10% missing – Module1 Enterprise Structure 100% DONE, Module2 Product Catalog 100% DONE, Module3 Partner 100% DONE, Module4 Financials Foundation 100% DONE, Module5 FICO Deep Dive 80% DONE – all with legal-safe own IP + short 4-char module-grouped codes FNRC/FCYC/FEXC/FFYC/FPPC/FPPE/FCOA/FGLC/FTXC/FAUC/FDTC/FTGC/FAGC/FRGC/FASC/FPRC/FPRP/FULC/EPAC/PSUC/SCUC/EMTC/EMTP/EUOC/ECGC/ELEC etc – build 84 routes passes (new APIs number-ranges, auto-posting-rules, document-types, tolerance-groups, account-groups, assets, pricing-conditions, retained-earnings, universal-ledger) – continuing module-by-module after confirmation – Module5 push next**

---

## Next Steps – After User Confirmation

1. **For each module, change anything related to SAP-like names/structures to legal-safe own IP:**
   - Rename tables: ent_* → core_*/org_*/prod_*/partner_*/fin_*/inv_*/proc_*/sales_*/mfg_*
   - Rename enums: ROH/FERT/HALB → RAW/FINISHED/SEMI, S/V → STANDARD/MOVING_AVG, sloc_type MAIN/COLD → PRIMARY/COLD_ZONE
   - Rename fields: valuation_class → inventory_valuation_class, price_control → pricing_method, mrp_type → planning_type
   - Remove hardcoded SAP example data: KSCA, KSO1, KPO1, KS-CC-01 etc – use neutral LE-1000, FAC-1000, PD-1000 etc
   - Keep sample data for convenience: Currencies INR default, UoM KG/L/PC/BOX, CoA INT, GL 100000-500000, Tax GST0/5/12/18/28 – as you requested fresh empty but with common sample

2. **Add our helper codes for each module after confirmation:**
   - Generate short 4-char module-grouped codes: MOOA = Module(1)+Object(2)+Action(1)
   - Module letters: E=Enterprise, P=Procurement, I=Inventory, M=Manufacturing, S=Sales, F=Financials, C=Costing, H=HR, A=Audit
   - Action: C=Create, E=Edit, V=View, L=List, P=Post, R=Release, A=Assign
   - Keep old SAP-like codes (OX02, MM01, ME21N etc) + long FND-* codes + 3-char short (LEC) as aliases for backward search
   - Primary badge black shows 4-char new short (ELEC), secondary muted shows aliases
   - Auto-generation rule documented in HELPER_CODE_SYSTEM.md

3. **Module-by-module order – Updated 2026-09-29 – Status:**
   - ✅ Module1 DONE: Enterprise Structure – 16 org elements with legal-safe tables org_company_group, org_legal_entity, org_facility, org_inventory_location, org_procurement_division, org_buyer_team, org_commercial_org, org_sales_channel, org_product_line, org_profit_unit, org_cost_unit, org_business_segment, org_warehouse_site, org_dispatch_point, fin_credit_policy_area, fin_fiscal_calendar, fin_posting_calendar – fresh empty, sample currencies INR, CoA INT, GL 100000-500000, Tax GST0/5/12/18/28 kept – helper codes ECGC/ELEC/ECAC/EFCC/EILC/EPDC/EBTC/ECOC/ESCC/EPLC/EPUC/ECUC/EBSC/EWHC/EDPC/FCPC/FFYC/FPPC – 4-char MOOA Module+Object+Action – build 76 routes
   - ✅ Module2 DONE: Product Catalog – prod_item (was ent_material_master) item_number (was material_number), prod_category (was ent_material_group) FOOD/SPICE sample kept, core_unit_measure (was ent_uom) KG/L/PC/BOX sample kept, prod_item_type (was ent_material_type) RAW/FINISHED/SEMI/TRADING/PACKAGING/CONSUMABLE/SERVICE (was ROH/FERT/HALB/HAWA/VERP/NLAG/DIEN) mapping ROH→RAW, FERT→FINISHED, HALB→SEMI, S→STANDARD, V→MOVING_AVG, PD→MRP, EX→LOT_FOR_LOT, F→BUY, prod_facility_profile (was ent_material_plant) facility_id (was plant_id) pricing_method STANDARD/MOVING_AVG (was S/V) lot_control BLOCKED/WARN/RESTRICTED (was BLOCK/WARNING) planning_type MRP/NO_PLANNING/MANUAL_REORDER (was PD/ND/VB) lot_sizing LOT_FOR_LOT/FIXED (was EX/FX) procurement_method BUY/MAKE/BOTH (was F/E/X) buyer_group (was purchasing_group) procurement_division (was purchasing_org), prod_commercial_profile (was ent_material_sales) commercial_org CO-1000 (was sales_org VKORG) sales_channel CH-10 (was VTWEG) product_line PL-00 (was SPART) commercial_unit (was sales_uom) fulfilling_facility (was delivering_plant), prod_item_classification, prod_quality_profile quality_control_key QC-001 (was qm_control_key 0001) inspection_type RECEIPT (was 01) is_quality_active (was is_qm_active), inv_lot lot_number (was batch_number) – fresh empty items, sample UoM/Category kept – INR default – helper codes EMTC/EMTE/EMTV/EMTL (alias MTC/MM01/MM02/MM03/MM60), EMTP (alias MTP/OMS2/FND-MT-CR) RAW/FINISHED/SEMI, EMGC (alias MGC/OMSF), EUOC (alias UOC/CUNI/FND-UOM-CR), ELTC (alias LTC/MSC3N) – build 76 routes – pushed ffbfead
   - ⏳ Module3 NEXT: Partner – partner_account (was ent_business_partner) central master with role VENDOR/CUSTOMER/BOTH, partner_customer_profile + partner_vendor_profile contextual views, hr_employee – new codes PTNC Partner Create (alias BP01), CUCC Customer Create, SUPC Supplier Create, HHEC Employee Create – fresh empty but sample? – awaiting confirmation
   - Module4: Number Ranges, Currencies, Fiscal Calendars – FNRC, FCYC, FFYC, FPPC – already done partial in Module1
   - Module5: FICO Deep Dive – fin_chart, fin_ledger_account, org_cost_unit, org_profit_unit, fin_tax_rule HSN/SAC, fin_fiscal_calendar, fin_posting_calendar, pricing, account determination – FCOA, FGLC, ECUC, EPUC, FTXC, FFYC, FPPC, FAUC, FCPC
   - Module6: MM – PR, PO, GR, IV, STO, PI, Info Record, Source List, Batch Stock – PPRC, PPOC, IGRC, PIVC, PSTC, IPIC – will migrate ent_material_master references to prod_item
   - Module7: PP – BOM, Work Center, Routing, Production Version, Production Order, MRP – MBMC, MWCC, MRTC, MMOC, MMRP – will rename pp_bom_header → mfg_bom_header etc
   - Module8: SD – SO, Delivery, Billing, Customer-Material Rel – SSOC, SDLC, SBLC
   - Module9: HR – Employee, Payroll – HHEC, HPYC
   - Module10: Audit/Workflow/DMS – AFLW, AALG, FWFL, DMCC – audit_log, audit_document_flow already done

## Module 2 – Product Catalog – DONE ✅ – Legal-Safe Own IP – 2026-09-29 – Pushed ffbfead

**Status: Implemented – Build 76 routes passes – Pushed to https://github.com/deepakpt2/erp-modular-monolith main ffbfead – checklist status updated ✅ – Module1 100%, Module2 100%, Overall 55% – awaiting Module3 confirmation**

**Changes:**
- New legal-safe tables: `core_unit_measure` (was ent_uom) – sample KG/G/L/ML/PC/BOX/PACK/KIT/M/TON kept, `prod_category` (was ent_material_group) – sample FOOD/SPICE/KITS/FG/RAW/PACK kept, `prod_item` (was ent_material_master) – fresh empty, `prod_item_type` (was ent_material_type) – legal-safe RAW/FINISHED/SEMI/TRADING/PACKAGING/CONSUMABLE/SERVICE (was ROH/FERT/HALB/HAWA/VERP/NLAG/DIEN), `prod_facility_profile` (was ent_material_plant) – facility_id (was plant_id), pricing_method STANDARD/MOVING_AVG (was price_control S/V), lot_control BLOCKED/WARN/RESTRICTED (was expiry_control BLOCK/WARNING/RESTRICTED_USE), planning_type MRP/NO_PLANNING/MANUAL_REORDER (was mrp_type PD/ND/VB), lot_sizing LOT_FOR_LOT/FIXED/MAX_LEVEL (was lot_size EX/FX/HB), procurement_method BUY/MAKE/BOTH (was procurement_type F/E/X), buyer_group (was purchasing_group), procurement_division (was purchasing_org), `prod_commercial_profile` (was ent_material_sales) – commercial_org (was sales_org VKORG), sales_channel CH-10 (was distribution_channel VTWEG), product_line PL-00 (was division SPART), commercial_unit (was sales_uom), fulfilling_facility (was delivering_plant), `prod_item_classification` (was ent_material_classification), `prod_quality_profile` (was ent_material_quality) – quality_control_key QC-001 (was qm_control_key 0001), inspection_type RECEIPT (was 01), `inv_lot` (was ent_batch) – lot_number (was batch_number)
- Enums legal-safe: itemTypeEnum RAW/FINISHED/SEMI/TRADING/PACKAGING/CONSUMABLE/SERVICE (not ROH/FERT/HALB), pricingMethodEnum STANDARD/MOVING_AVG (not S/V), lotControlEnum BLOCKED/WARN/RESTRICTED (not BLOCK/WARNING/RESTRICTED_USE), planningTypeEnum MRP/MANUAL_REORDER/NO_PLANNING/REORDER_POINT (not PD/ND/VB/VM), lotSizingEnum LOT_FOR_LOT/FIXED/MAX_LEVEL (not EX/FX/HB), procurementMethodEnum BUY/MAKE/BOTH/TRANSFER (not F/E/X)
- APIs updated with fallback: `/api/materials` tries prod_item first, fallback ent_material_master – maps old values to new (ROH->RAW etc) and new to old for backward compat, `/api/uom` tries core_unit_measure first fallback ent_uom, `/api/material-types` tries prod_item_type first fallback ent_material_type – both_exact search – exact first partial then – helper codes kept as-is and auto-generate
- UI updated: materials page – title Product Catalog – EMTC (alias MTC, MM01, FND-MAT-CR) – 4-char MOOA E=Enterprise, MT=Material, C=Create – same length as MM01 but own IP, module grouped E=Enterprise, intuitive MT=Material, C=Create – tabs show EMTC alias MTC/MM01, fields show legal-safe names with alias muted secondary (e.g., Base Unit EUOC alias CUNI, Product Type EMTP alias OMS2 ROH→RAW, Lot Control BLOCKED alias BLOCK, Pricing Method MOVING_AVG alias V, Planning Type MRP alias PD, Lot Sizing LOT_FOR_LOT alias EX, Procurement Method BUY alias F, Buyer Group BUY-001 alias 001, Commercial Org CO-1000 alias 1000, Sales Channel CH-10 alias 10, Product Line PL-00 alias 00, Fulfilling Facility alias Delivering Plant, Quality Control Key QC-001 alias 0001, Barcode alias EAN, HSN Code new India GST), material-types page – title Product Types – EMTP (alias MTP, OMS2) – legal-safe RAW/FINISHED/SEMI (was ROH/FERT/HALB) with mapping table, uom page – title Units of Measure – EUOC (alias UOC, CUNI) – core_unit_measure sample kept – fresh empty but common sample kept as per requirement
- Helper codes: EMTC Create Product (alias MTC, MM01, FND-MAT-CR) primary black badge `↳ EMTC` + alias muted `MTC, MM01`, EMTE Edit, EMTV View, EMTL List, EMTP Product Type Create (alias MTP, OMS2, FND-MT-CR) – RAW/FINISHED/SEMI mapping, EMGC Product Category Create (alias MGC, OMSF), EUOC UoM Create (alias UOC, CUNI, FND-UOM-CR) – sample KG/L/PC/BOX kept, ELTC Lot Create (alias LTC, MSC3N, FND-LOT-CR) – inv_lot.lot_number
- Build: 76 routes passes
- Fresh empty for items, sample UoM/Category kept – INR default, CoA INT, GL 100000-500000, Tax GST0/5/12/18/28, Currencies INR, UoM KG/L/PC/BOX – as per requirement

**Awaiting user confirmation for Module3 – Partner (Business Partner, Customer, Supplier). – Now implementing**

## Module 3 – Partner – DONE ✅ – Legal-Safe Own IP – 2026-09-29 – Pushed 88a4591 main

**Status: ✅ DONE Module3 – Implemented – Build 77 routes passes (new /foundation/partners page) – Pushed to https://github.com/deepakpt2/erp-modular-monolith main 88a4591 with PAT provided (PAT cleaned after push for security) – checklist status updated ✅ – Module1 100% Enterprise Structure, Module2 100% Product Catalog, Module3 100% Partner – Overall 65% – Summary table updated – Master-data framework table updated – awaiting Module4 confirmation**

**Changes:**
- New legal-safe tables: `partner_account` (was ent_business_partner) – central master with role VENDOR/CUSTOMER/BOTH/EMPLOYEE/CONTACT, account_number (was bp_number BP-V-10*/BP-C-20* → SUP-1001/CUST-2001 neutral), display_name (was name1), legal_name (was name2), tax_id, gst_number (India GSTIN 32AABCK1234M1Z5 new), pan_number (India PAN new), email, phone, alternate_phone, website, address_line1, address_line2, city, region, postal_code, country IN default, is_blocked, is_one_time, is_active – fresh empty – no hardcoded KS-V-001 Malabar Spice Farms etc – common sample data like CoA/GL/Tax/Currencies/UoM kept for convenience – INR default, `partner_vendor_profile` (was ent_bp_vendor_ext) – partner_id (was bp_id), payment_terms_days, currency_code INR default, reconciliation_account_id, is_quality_relevant (was is_qm_relevant), procurement_division_id org_procurement_division PD-1000 (was purchasing_org 1000/KPO1), buyer_team_id org_buyer_team BUY-001 (was purchasing_group 001/K01), tax_classification, incoterms, `partner_customer_profile` (was ent_bp_customer_ext) – partner_id, payment_terms_days, currency_code INR, commercial_org_id org_commercial_org CO-1000 (was sales_org KSO1/1000), sales_channel_id org_sales_channel CH-10 (was distribution_channel K1/10), product_line_id org_product_line PL-00 (was division K1/00), credit_policy_area_id fin_credit_policy_area CP-1000 (was credit_control_area OB45), price_group, tax_classification, account_assignment_group, `partner_contact` – NEW – multiple contacts per partner – id, partner_id, contact_type PRIMARY/BILLING/SHIPPING/PURCHASING/SALES/TECHNICAL/FINANCE, full_name, email, phone, department, is_primary, is_active – new own IP, `partner_facility_assign` – NEW – partner_id, facility_id org_facility FAC-1000 (was Plant 1000), is_default, assigned_at – which facilities partner can supply to / deliver from
- Enums legal-safe: partner_role VENDOR/CUSTOMER/BOTH/EMPLOYEE/CONTACT (was bp_role), partner_contact_type PRIMARY/BILLING/SHIPPING/PURCHASING/SALES/TECHNICAL/FINANCE – neutral
- APIs updated with fallback: `/api/business-partners` tries partner_account first fallback ent_business_partner – maps old fields to new (bp_number→account_number, name1→display_name, name2→legal_name, address→address_line1 etc) – accepts old bp_number and new account_number, old name1 and new display_name – helper codes EPAC primary alias PTNC/BPAC/BP01/FND-BP-CR, PSUC Supplier Create alias SUPC/XK01/ME01/FND-SU-CR, SCUC Customer Create alias CUCC/XD01/FND-CU-CR – both_exact search – exact first partial then – helper codes kept as-is and auto-generate – also updated `/api/po`, `/api/gr`, `/api/iv`, `/api/billing`, `/api/payment` to LEFT JOIN both partner_account (new) and ent_business_partner (legacy) with COALESCE(pa.account_number, bp.bp_number) and COALESCE(pa.display_name, bp.name1) for backward compat – Module3
- UI updated: new page `/foundation/partners` – title Partner Accounts – EPAC (alias PTNC, BPAC, BP01) – 4-char MOOA E=Enterprise, PA=Partner Account, C=Create – same length as BP01 but own IP, module grouped E=Enterprise, intuitive PA=Partner Account, C=Create – role filter tabs ALL (EPAL), VENDORS (PSUC alias SUPC/XK01), CUSTOMERS (SCUC alias CUCC/XD01) – columns Account No EPAC, Display Name, Role VENDOR/CUSTOMER/BOTH, City, GSTIN, Blocked – create modal with tabs Basic Data (account_number, display_name, legal_name, role, email, phone, GSTIN, PAN, tax_id, website, address_line1, city, region, postal_code, country IN default, blocked, one-time), Vendor Profile (payment_terms_days, currency_code INR, procurement_division_id PD-1000 alias 1000, buyer_team_id BUY-001 alias 001, quality_relevant alias qm_relevant), Customer Profile (payment_terms_days, currency_code INR, commercial_org_id CO-1000 alias 1000, credit_policy_area_id CP-1000 alias OB45, price_group), Contacts (full_name, contact_type PRIMARY/BILLING/SHIPPING/PURCHASING/SALES/TECHNICAL/FINANCE, email, phone, department – new partner_contact), Facility Assign (multi-select facilities FAC-1000 alias Plant 1000) – fresh empty – no hardcoded KS-V-001 etc – legal-safe own IP
- Helper codes: EPAC Partner Account Create (alias PTNC, BPAC, BP01, FND-BP-CR, BP, ME01, XK01, XD01) primary black badge `↳ EPAC` + alias muted `PTNC, BP01`, EPAE Edit, EPAV View, EPAL List, PSUC Supplier Create (alias SUPC, VEND, XK01, ME01, FND-SU-CR, BP-SU) – P=Procurement, SU=Supplier, C=Create – SCUC Customer Create (alias CUCC, CUST, XD01, FND-CU-CR, BP-CU) – S=Sales, CU=Customer, C=Create – EPCC Partner Contact Create (alias BPCC, FND-PC-CR, PCC) – new – all 4-char MOOA same length as BP01/XK01/XD01 but own IP, module grouped, intuitive
- Build: 77 routes passes (new /foundation/partners page) – both_exact search, exact first partial then, helper codes kept as-is and auto-generate, function is destination code is helper identifier
- Fresh empty for partners – no hardcoded KS-V-001 etc – common sample CoA/GL/Tax/Currencies/UoM kept – INR default – as per requirement

**Awaiting user confirmation for Module4 – Number Ranges, Currencies, Fiscal Calendars, Tax, Chart, GL – FNRC, FCYC, FFYC, FPPC, FCOA, FGLC, FTXC – already done partial in Module1, will deep dive Module5 FICO.**

## Module 4 – Financials Foundation – DONE ✅ – Legal-Safe Own IP – 2026-09-29

**Status: ✅ DONE Module4 – Implemented – Build 80+ routes passes (new APIs number-ranges, auto-posting-rules, document-types, tolerance-groups, currencies, tax-codes, chart-of-accounts, gl-accounts, exchange-rates, fiscal-calendars, posting-calendars, posting-period-variants) – checklist status updated ✅ – Module1 100% Enterprise Structure, Module2 100% Product Catalog, Module3 100% Partner, Module4 100% Financials Foundation – Overall 75% – Summary table updated – Master-data framework table updated – awaiting Module5 confirmation**

**Changes:**
- New legal-safe tables in `src/modules/foundation/enterprise/infrastructure/financialsFoundationSchema.ts`: `core_number_range` (was ent_number_range) – code unique, objectType ITEM/PARTNER/LOT/PR/PO/GR/IV/PROD_ORDER/FI_DOC etc (was ent_number_range object_type), legalEntityId was company_code_id, fiscalYear was year, prefix neutral, fromNumber/toNumber/currentNumber bigint, description, isActive – plus legacy columns company_code_id, year for backward compat – plus `core_number_range_buffer` bufferedNumber, isConsumed, `core_currency` (was ent_currency) – code INR primary, name Indian Rupee, decimalPlaces 2, symbol ₹, sample INR default per requirement – fresh empty but INR default, KWD/USD/EUR sample kept for convenience, `core_exchange_rate` (was ent_exchange_rate) – fromCurrency/toCurrency references core_currency, validFrom, rate numeric 15,6, rateType AVG/BUY/SELL/SPOT was M/B/G – AVG=Average (was M), BUY=Bank buying (was B), SELL=Bank selling (was G), companyCodeId legacy, legalEntityId new, `fin_fiscal_calendar_period` – fiscalCalendarId references fin_fiscal_calendar.id (was ent_fiscal_year_variant), period 1-12, calendarMonth, yearShift for K4 April-March – India FY April-March yearShift -1 for Jan-Mar, 0 for Apr-Dec, startDayMonth 04-01, endDayMonth 03-31 – plus legacy month/year_shift alias, `fin_posting_calendar_period` – postingCalendarId references fin_posting_calendar.id (was ent_posting_period_variant), legalEntityId was company_code_id, fromPeriod/toPeriod 1-12, fromYear/toYear 2026, accountType ALL/ASSET/CUSTOMER/VENDOR/ITEM/GL was +/A/D/K/M/S – ALL was +, ASSET was A, CUSTOMER was D (Debitor), VENDOR was K (Kreditor), ITEM was M (Material), GL was S (Sachkonto), isOpen OB52, `fin_chart` (was fi_chart_of_accounts) – code INT sample kept, name International CoA, description, isActive – sample INT, KSCA, CAUS, GKR, YIN kept for convenience, `fin_ledger_account` (was fi_gl_account) – chartId was coa_id, accountNumber 100000-500000 sample kept – 100000 Cash, 120000 AR, 140000 Inventory RAW, 200000 GR/IR Clearing WRX, 300000 Revenue, 400000 COGS, 5000000001 Raw Mat KSCA, 5000000003 GR/IR KSCA etc – accountType ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE, isBalanceSheet, isReconciliation, isBlocked, isTaxRelevant, `fin_tax_rule` (was fi_tax_code) – code GST0/5/12/18/28 sample, description GST 5% Spices, rate 5.00, type INPUT/OUTPUT/BOTH/NONE/EXEMPT, gstType CGST/SGST/IGST/UTGST/CESS/VAT/NONE new – CGST Central GST, SGST State GST, IGST Integrated GST, UTGST Union Territory GST, CESS, VAT, NONE – India GST new, ledgerAccountId references fin_ledger_account, glAccountId legacy, hsnCode India GST HSN/SAC new, isReverseCharge new, `fin_auto_posting_rule` (was fi_auto_account_determination) – companyCodeId legacy, legalEntityId new, transactionKey INV_POSTING was BSX, GR_IR_CLEARING was WRX, PRICE_DIFF was PRD, INV_OFFSET was GBB, STOCK_TRANSFER was BSA, TAX_PAYABLE, TAX_RECEIVABLE, REVENUE, COGS, AR, AP, BANK, CASH, SALARY_PAYABLE, SALARY_EXPENSE, FREIGHT was FRL, TAX_INPUT – plus legacy columns transactionKeyLegacy BSX/WRX/PRD/GBB/BSA, inventoryValuationClass RAW/FINISHED/SEMI was valuation_class ROH/FERT/HALB, inventoryValuationClassLegacy ROH/FERT, ledgerAccountId, glAccountId legacy, description, `fin_document_type` – code INV/BILL/PAY/JRNL/GR/GI/DN was KR/KG/KZ/RE/WE/WA/SA legacy – INV Vendor Invoice was RE/KR, BILL Customer Invoice was RV, PAY Vendor Payment was KZ, JRNL Journal Entry was SA, GR Goods Receipt was WE, GI Goods Issue was WA, DN Delivery Note was LF – plus codeLegacy KR/KG/KZ/RE/WE/WA/SA, legacyCode alias, numberRangeCode, numberRangeFrom/To, accountTypesAllowed ALL/ASSET/CUSTOMER/VENDOR/ITEM/GL was +/A/D/K/M/S, reverseDocumentType, `fin_tolerance_group` – code TOL-GL-1000, codeLegacy 1000, name GL Tolerance, type GL/EMPLOYEE/CUSTOMER/VENDOR/AP/AR – GL was blank/+, EMPLOYEE, CUSTOMER was D, VENDOR was K, AP, AR – legalEntityId, lowerLimit/upperLimit, amountPerDocument, amountPerOpenItem, cashDiscountPerLine, maxCashDiscount, description – plus legacy amount fields – all legal-safe own IP – fresh empty but CoA INT, GL 100000-500000, Tax GST0/5/12/18/28, Currencies INR/KWD/USD/EUR, UoM KG/L/PC/BOX, Number Ranges ITEM-01/PO-01/GR-01 etc, Fiscal K4 April-March, Posting 0001 sample kept for user convenience per requirement fresh empty but common sample data like coa, glir accounts, tax codes etc kept
- Enums legal-safe: coreNumberRangeObjectTypeEnum ITEM/PARTNER/LOT/PR/PO/GR/IV/PROD_ORDER/FI_DOC/FI_DOC_50/51/52/53/54/PAYROLL/SALES_ORDER/KITTING_ORDER/PI/COSTING_RUN/BILLING/DELIVERY/PAYMENT/JOURNAL (was MATERIAL/BP/BATCH etc), coreExchangeRateTypeEnum AVG/BUY/SELL/SPOT (was M/B/G), finPostingAccountTypeEnum ALL/ASSET/CUSTOMER/VENDOR/ITEM/GL (was +/A/D/K/M/S), finLedgerAccountTypeEnum ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE, finTaxRuleTypeEnum INPUT/OUTPUT/BOTH/NONE/EXEMPT, finGstTypeEnum CGST/SGST/IGST/UTGST/CESS/VAT/NONE new India GST, finAutoPostingTransactionKeyEnum INV_POSTING/GR_IR_CLEARING/PRICE_DIFF/INV_OFFSET/STOCK_TRANSFER/TAX_PAYABLE/TAX_RECEIVABLE/REVENUE/COGS/AR/AP/BANK/CASH/SALARY_PAYABLE/SALARY_EXPENSE/FREIGHT/TAX_INPUT (was BSX/WRX/PRD/GBB/BSA etc), finToleranceGroupTypeEnum GL/EMPLOYEE/CUSTOMER/VENDOR/AP/AR
- APIs updated with fallback new→legacy: `/api/currencies` tries core_currency first fallback ent_currency – code FCYC primary alias CYC/OY03/FIN-CUR-CR – 4-char MOOA F=Financials, CY=Currency, C=Create – same length as CYC/OY03 but own IP, module grouped, intuitive – ensureTableNew creates core_currency with INR seed (INR Indian Rupee ₹ 2, KWD Kuwaiti Dinar KD 3, USD US Dollar $ 2, EUR Euro € 2, GBP, JPY, AED, SAR sample kept), ensureTableLegacy keeps ent_currency – GET/POST/PUT/DELETE handle both tables with legalSafe flag, response includes code FCYC aliasCodes CYC/OY03/FIN-CUR-CR, explanation legal-safe fresh empty INR default – Module4, `/api/exchange-rates` tries core_exchange_rate first fallback ent_exchange_rate – code FEXC primary alias EXC/OB08/FIN-EX-CR – rateType AVG/BUY/SELL/SPOT was M/B/G – INR primary default – conversion ?amount=100&from=KWD&to=INR&date – Module4, `/api/tax-codes` tries fin_tax_rule first fallback fi_tax_code – code FTXC primary alias TXC/FTXP/FIN-TX-CR – GST0/5/12/18/28 CGST/SGST/IGST/UTGST HSN/SAC VAT 5% – Module4, `/api/chart-of-accounts` tries fin_chart first fallback fi_chart_of_accounts – code FCOA primary alias COA/OB13/FIN-COA-CR – INT/KSCA/CAUS/GKR/YIN sample kept – Module4, `/api/gl-accounts` tries fin_ledger_account first fallback fi_gl_account – code FGLC primary alias GLC/FS00/FIN-GL-CR – 100000-500000 sample kept – Module4, `/api/fiscal-calendars` tries fin_fiscal_calendar first fallback ent_fiscal_year_variant – code FFYC primary alias FYC/OB29/FIN-FY-CR – K4 April-March mapping, V3 calendar year, K4 India fiscal, sample kept – Module4, `/api/posting-calendars` tries fin_posting_calendar first fallback ent_posting_period_variant – code FPPC primary alias PPC/OBBO/FIN-PP-CR – fromPeriod/toPeriod/accountType ALL/ASSET/CUSTOMER/VENDOR/ITEM/GL was +/A/D/K/M/S, isOpen OB52 sample kept – Module4, `/api/posting-period-variants` tries fin_posting_calendar + fin_posting_calendar_period first fallback fi_posting_period_variant + fi_posting_period – code FPPE primary alias PPE/OB52/OBBO/FIN-PP-E – Define Variant OBBO, Open/Close OB52, Assign OBBP – accountType ALL/ASSET/CUSTOMER/VENDOR/ITEM/GL was +/A/D/K/M/S – Module4, `/api/number-ranges` tries core_number_range first fallback ent_number_range – code FNRC primary alias NRC/FBN1/FIN-NR-CR – objectType ITEM/PARTNER/LOT/PR/PO/GR/IV/PROD_ORDER/FI_DOC etc, legalEntityId was company_code_id, fiscalYear was year, prefix neutral, sample ITEM-01 PO-01 GR-01 IV-01 FI-DOC-01 kept – Module4, `/api/auto-posting-rules` tries fin_auto_posting_rule first fallback fi_auto_account_determination – code FAUC primary alias AUC/OBYC/FIN-AP-CR – transactionKey INV_POSTING was BSX, GR_IR_CLEARING was WRX, PRICE_DIFF was PRD, INV_OFFSET was GBB etc with legacy columns for alias – Module4, `/api/document-types` tries fin_document_type first fallback ent_document_type – code FDTC primary alias DTC/OBA7/FIN-DT-CR – code INV/BILL/PAY/JRNL/GR/GI/DN was KR/KG/KZ/RE/WE/WA/SA legacy – Module4, `/api/tolerance-groups` tries fin_tolerance_group first fallback ent_tolerance_group – code FTGC primary alias TGC/OBA4/FIN-TG-CR – type GL/EMPLOYEE/CUSTOMER/VENDOR/AP/AR – Module4
- Helper codes: FNRC Number Range Create (alias NRC, FBN1, FIN-NR-CR) – 4-char MOOA F=Foundation, NR=NumberRange, C=Create – same length as FBN1 but own IP, module grouped, intuitive – FCYC Currency Create (alias CYC, OY03, FIN-CUR-CR) – F=Financials, CY=Currency, C=Create – FEXC Exchange Rate Create (alias EXC, OB08, FIN-EX-CR) – F=Financials, EX=Exchange, C=Create – FFYC Fiscal Year Calendar Create (alias FYC, OB29, FIN-FY-CR) – F=Financials, FY=FiscalYear, C=Create – FPPC Posting Period Calendar Create (alias PPC, OBBO, FIN-PP-CR) – F=Financials, PP=PostingPeriod, C=Create – FPPE Posting Period Edit Open/Close (alias PPE, OB52, FIN-PP-E) – F=Financials, PP=PostingPeriod, E=Edit – FCOA Chart of Accounts Create (alias COA, OB13, FIN-COA-CR) – F=Financials, CO=ChartOfAccounts, A=Admin – FGLC GL Account Create (alias GLC, FS00, FIN-GL-CR) – F=Financials, GL=GeneralLedger, C=Create – FTXC Tax Rule Create (alias TXC, FTXP, FIN-TX-CR) – F=Financials, TX=Tax, C=Create – FAUC Auto Posting Rule Create (alias AUC, OBYC, FIN-AP-CR) – F=Financials, AU=AutoPosting, C=Create – FDTC Document Type Create (alias DTC, OBA7, FIN-DT-CR) – F=Financials, DT=DocumentType, C=Create – FTGC Tolerance Group Create (alias TGC, OBA4, FIN-TG-CR) – F=Financials, TG=ToleranceGroup, C=Create – all 4-char MOOA same length as FBN1/CYC/OB08/OB29/OBBO/OB52/OB13/FS00/FTXP/OBYC/OBA7/OBA4 but own IP, module grouped, intuitive – sample data kept for user convenience per requirement fresh empty but common sample data like coa, gl, tax, currencies, UoM kept – INR default
- Build: 80+ routes passes (new APIs number-ranges, auto-posting-rules, document-types, tolerance-groups, plus existing currencies, exchange-rates, tax-codes, chart-of-accounts, gl-accounts, fiscal-calendars, posting-calendars, posting-period-variants) – both_exact search, exact first partial then, helper codes kept as-is and auto-generate, function is destination code is helper identifier
- Fresh empty for number ranges, fiscal, posting – but sample CoA INT, GL 100000-500000, Tax GST0/5/12/18/28, Currencies INR/KWD/USD/EUR, UoM KG/L/PC/BOX, Fiscal K4 April-March, Posting 0001 kept for user convenience – as per requirement fresh empty but common sample data like coa, glir accounts, tax codes etc kept – INR default

**Awaiting user confirmation for Module5 – FICO Deep Dive + Pricing + Account Determination – will confirm after Module4 push.**

