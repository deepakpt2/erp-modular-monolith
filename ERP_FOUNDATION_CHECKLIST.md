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
| Material / Product | FOUNDATION | `prod_item` (was ent_material_master) – `prod_facility_profile`, `prod_commercial_profile` | **EMTC** Material Create (alias MTC, MM01, FND-MAT-CR) | ⚠️ Partial – old ent_material_master exists, new prod_item not yet migrated | Need central item with contextual views: facility profile (MRP, procurement), commercial profile (sales), quality profile, classification – not separate records per module |
| Material Group | FOUNDATION | `prod_category` (was ent_material_group) | **EMGC** Material Group Create (alias OMSF, FND-MG-CR) | ⚠️ Partial – old exists | Need hierarchy parent_id |
| Units of Measure | FOUNDATION | `core_unit_measure` (was ent_uom) | **EUOC** UoM Create (alias UOC, CUNI) | ✅ Implemented – but keep sample data KG/L/PC/BOX | Need dimension, base UoM, conversion |
| Batch | FOUNDATION/MM | `inv_lot` (was ent_batch) | **LTCC** Lot Create (alias Batch) | ✅ Implemented – batch with expiry, manufacturing date, vendor | Need batch stock tracking per facility/location |
| Serial Number | FOUNDATION/MM | MISSING – need `inv_serial` | **SRLC** Serial Create (new) | ❌ Not implemented | Need serial tracking for equipment |
| Plant-specific material data | FOUNDATION/MM | `prod_facility_profile` (was ent_material_plant) | **EFPC** Facility Profile Create | ⚠️ Partial – old ent_material_plant exists with fields purchasing_group, purchasing_org, valuation_class, mrp_type etc (SAP-like) – needs rename to planning_type, procurement_method etc | Need safety stock, reorder point, planning type, procurement method, buyer team, valuation |
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

## Summary – Implementation Check by Module

| Module | Total Points | Implemented | Partial | Missing | % Done |
|---|---|---|---|---|---|
| FOUNDATION (Core, Config, Workflow, Auth, Number Range, DMS, Jobs, API, Notifications) | 21 | 8 | 10 | 3 | 38% |
| MM – Procurement & Inventory | 10 | 4 | 3 | 3 | 40% |
| PP – Manufacturing | 6 | 3 | 1 | 2 | 50% |
| SD – Sales | 6 | 3 | 2 | 1 | 50% |
| FICO – Financials | 15 | 6 | 6 | 3 | 40% |
| HR | 3 | 2 | 1 | 0 | 66% |
| AUDIT | 5 | 3 | 1 | 1 | 60% |

**Overall: ~45% implemented, 35% partial, 20% missing – Module1 Enterprise Structure done with legal-safe tables + short 4-char codes, need to continue module-by-module.**

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

3. **Module-by-module order (proposed):**
   - Module1 DONE: Enterprise Structure – 16 org elements with legal-safe tables + 4-char codes ECGC/ELEC/EFCC/EILC etc
   - Module2 NEXT: Product Catalog – prod_item, prod_category, core_unit_measure, inv_lot – rename from ent_material_master etc, new codes EMTC/MTE/MTV/MTL (alias MTC) → final 4-char EMTC etc? Actually EMTC is already 4-char module grouped (E=Enterprise, MT=Material, C=Create) – keep
   - Module3: Partner – partner_account, partner_customer_profile, partner_vendor_profile – new codes PTNC, CUCC, SUPC
   - Module4: Number Ranges, Currencies, Fiscal Calendars – FNRC, FCYC, FFYC, FPPC
   - Module5: FICO – fin_chart, fin_ledger_account, org_cost_unit, org_profit_unit, fin_tax_rule – FCOA, FGLC, ECUC, EPUC, FTXC
   - Module6: MM – PR, PO, GR, IV, STO, PI – PPRC, PPOC, IGRC, PIVC, PSTC, IPIC
   - Module7: PP – BOM, Work Center, Routing, Production Order, MRP – MBMC, MWCC, MRTC, MMOC, MMRP
   - Module8: SD – SO, Delivery, Billing – SSOC, SDLC, SBLC
   - Module9: HR – Employee, Payroll – HHEC, HPYC
   - Module10: Audit/Workflow/DMS – AFLW, AALG, FWFL, DMCC

## Module 2 – Product Catalog – DONE ✅ – Legal-Safe Own IP – 2026-09-29

**Status: Implemented – Build 76 routes passes – Pushed? Pending**

**Changes:**
- New legal-safe tables: `core_unit_measure` (was ent_uom) – sample KG/G/L/ML/PC/BOX/PACK/KIT/M/TON kept, `prod_category` (was ent_material_group) – sample FOOD/SPICE/KITS/FG/RAW/PACK kept, `prod_item` (was ent_material_master) – fresh empty, `prod_item_type` (was ent_material_type) – legal-safe RAW/FINISHED/SEMI/TRADING/PACKAGING/CONSUMABLE/SERVICE (was ROH/FERT/HALB/HAWA/VERP/NLAG/DIEN), `prod_facility_profile` (was ent_material_plant) – facility_id (was plant_id), pricing_method STANDARD/MOVING_AVG (was price_control S/V), lot_control BLOCKED/WARN/RESTRICTED (was expiry_control BLOCK/WARNING/RESTRICTED_USE), planning_type MRP/NO_PLANNING/MANUAL_REORDER (was mrp_type PD/ND/VB), lot_sizing LOT_FOR_LOT/FIXED/MAX_LEVEL (was lot_size EX/FX/HB), procurement_method BUY/MAKE/BOTH (was procurement_type F/E/X), buyer_group (was purchasing_group), procurement_division (was purchasing_org), `prod_commercial_profile` (was ent_material_sales) – commercial_org (was sales_org VKORG), sales_channel CH-10 (was distribution_channel VTWEG), product_line PL-00 (was division SPART), commercial_unit (was sales_uom), fulfilling_facility (was delivering_plant), `prod_item_classification` (was ent_material_classification), `prod_quality_profile` (was ent_material_quality) – quality_control_key QC-001 (was qm_control_key 0001), inspection_type RECEIPT (was 01), `inv_lot` (was ent_batch) – lot_number (was batch_number)
- Enums legal-safe: itemTypeEnum RAW/FINISHED/SEMI/TRADING/PACKAGING/CONSUMABLE/SERVICE (not ROH/FERT/HALB), pricingMethodEnum STANDARD/MOVING_AVG (not S/V), lotControlEnum BLOCKED/WARN/RESTRICTED (not BLOCK/WARNING/RESTRICTED_USE), planningTypeEnum MRP/MANUAL_REORDER/NO_PLANNING/REORDER_POINT (not PD/ND/VB/VM), lotSizingEnum LOT_FOR_LOT/FIXED/MAX_LEVEL (not EX/FX/HB), procurementMethodEnum BUY/MAKE/BOTH/TRANSFER (not F/E/X)
- APIs updated with fallback: `/api/materials` tries prod_item first, fallback ent_material_master – maps old values to new (ROH->RAW etc) and new to old for backward compat, `/api/uom` tries core_unit_measure first fallback ent_uom, `/api/material-types` tries prod_item_type first fallback ent_material_type – both_exact search – exact first partial then – helper codes kept as-is and auto-generate
- UI updated: materials page – title Product Catalog – EMTC (alias MTC, MM01, FND-MAT-CR) – 4-char MOOA E=Enterprise, MT=Material, C=Create – same length as MM01 but own IP, module grouped E=Enterprise, intuitive MT=Material, C=Create – tabs show EMTC alias MTC/MM01, fields show legal-safe names with alias muted secondary (e.g., Base Unit EUOC alias CUNI, Product Type EMTP alias OMS2 ROH→RAW, Lot Control BLOCKED alias BLOCK, Pricing Method MOVING_AVG alias V, Planning Type MRP alias PD, Lot Sizing LOT_FOR_LOT alias EX, Procurement Method BUY alias F, Buyer Group BUY-001 alias 001, Commercial Org CO-1000 alias 1000, Sales Channel CH-10 alias 10, Product Line PL-00 alias 00, Fulfilling Facility alias Delivering Plant, Quality Control Key QC-001 alias 0001, Barcode alias EAN, HSN Code new India GST), material-types page – title Product Types – EMTP (alias MTP, OMS2) – legal-safe RAW/FINISHED/SEMI (was ROH/FERT/HALB) with mapping table, uom page – title Units of Measure – EUOC (alias UOC, CUNI) – core_unit_measure sample kept – fresh empty but common sample kept as per requirement
- Helper codes: EMTC Create Product (alias MTC, MM01, FND-MAT-CR) primary black badge `↳ EMTC` + alias muted `MTC, MM01`, EMTE Edit, EMTV View, EMTL List, EMTP Product Type Create (alias MTP, OMS2, FND-MT-CR) – RAW/FINISHED/SEMI mapping, EMGC Product Category Create (alias MGC, OMSF), EUOC UoM Create (alias UOC, CUNI, FND-UOM-CR) – sample KG/L/PC/BOX kept, ELTC Lot Create (alias LTC, MSC3N, FND-LOT-CR) – inv_lot.lot_number
- Build: 76 routes passes
- Fresh empty for items, sample UoM/Category kept – INR default, CoA INT, GL 100000-500000, Tax GST0/5/12/18/28, Currencies INR, UoM KG/L/PC/BOX – as per requirement

**Awaiting user confirmation for Module3 – Partner (Business Partner, Customer, Supplier).**
