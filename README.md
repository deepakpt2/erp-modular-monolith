# ERP - Enterprise - Modular Monolith ERP
**Dual Company Code: 1000 KWD + KS01 INR Kerala Spices, Drizzle ORM, Postgres 16, Traefik, Next.js 16.3.6**

**MVP: No Auth Required** - All routes public via `MVP_NO_AUTH=true` in `.env`. Login page shows amber banner with "Continue to Dashboard (No Auth Required)" and Skip Login button. Set `MVP_NO_AUTH=false` to enforce login.

**Phases Complete:** Layer 0 Foundation + MM + PP + FICO + HR + SD + Physical Inventory + Costing + Payroll FI + CCA + Document Flow + Audit Log + **KS01 Kerala Spices Implementation per PDF Guide**

**Build Status:** PASS ✓ 24 routes + Middleware (Proxy), 101kB first load, virtualized high-density grids, Next 16.3.6, `src/middleware.ts` with MVP_NO_AUTH default true

**Live:** https://er.deepakpt.com/ - No auth required for MVP

**KS01 Kerala Spices & Exports Pvt Ltd (Per PDF Guide max llm V2.PDF):**
- Company Code KS01 INR GST 32AABCK1234M1Z5 Palakkad Plant KP01 SLocs KS01 Main Store KS02 Raw Material Store KS03 Finished Goods Store
- Purchasing Org KPO1 Group KPG Sales Org KSO1 Channel K1 Division K1 Business Areas KBA1/KBA2 Credit Control KS01
- Fiscal Variant K4 April-March India (OB29) Posting Variant KS01 (OBBO) Open Periods + A D K M S 1/2024-12/2025 (OB52)
- Doc Types KR KG KZ RE WE WA SA (OBA7) Number Ranges 50 5000000000-5099999999 WE/WA 51 5100000000-5199999999 KR/RE 52 5200000000-5299999999 KG 53 5300000000-5399999999 KZ 54 5400000000-5499999999 SA (FBN1)
- Chart KSCA Account Groups KASS/KLIA/KREV/KEXP/KMAT/KREC/KTAX/KCSH Retained Earnings 2500000001 G/L 5000000001 Raw Mat Stock 5000000002 FG Stock 5000000003 GR/IR Clearing 5000000004 Stock in Transit 5000000005 Price Diff 5000000006 Material Consumption (FS00)
- Materials 10 spices: KS-MAT-001 Black Pepper Whole 002 Cardamom Green 003 Turmeric Whole 004 Coriander 005 Chilli Whole 006 Pepper Powder 007 Turmeric Powder 008 Garam Masala 009 Chilli Powder 010 Export Pack 500g + vendors KS-V-001..003 customers KS-C-001..002
- Tax GST0/5/12/18/28 IGST0/5/18 INR 2 decimals Cost Centers KS-CC-01..05 Production/QC/Sales/Admin/Purchasing
- APIs support dynamic companyCode param KS01/1000/ALL, plant KP01/1000/1100, sloc KS01/KS02/KS03/0001-0005, currency INR/KWD
- Toggle via .env KSPL_ENABLED=true default, npm run db:seed:ks01, auto-migrate seeds KS01 always unless KSPL_ENABLED=false

**FMCG Sample Data Toggle (Small Production Company):**
- 23 materials: 10 ROH (Flour/Sugar/Oil/Milk/Cocoa/Salt/Baking Powder/Vanilla/Potato Flakes/Tomato Powder), 4 PACK (BOPP/Carton/Pouch/PET), 3 KIT (Dough Mix 10kg/Seasoning 5kg/Chips Base 20kg), 6 FERT (Chocolate Biscuit 100g/Vanilla/Chips Tomato 50g/Chips Salted/Mango Juice 250ml/Family Pack 500g)
- 5 vendors: Al Ghurair/Savola/Tetra Pak/Fonterra/Cargill, 4 customers: Carrefour/Lulu/Sultan/Talabat, 2 BOMs: Dough Mix phantom explode + Chocolate Biscuit, 5 stock batches B-FMCG-* with expiry 90-300d
- Toggle ON/OFF via: Dashboard amber section switch, Materials page switch, API POST /api/seed/fmcg {enabled:true/false}, CLI `npm run db:seed:fmcg` or `docker compose run --rm migrator npm run db:seed:fmcg`
- Turn ON for demo, OFF for clean production - deletes all FMCG-% materials, vendors, customers, BOMs, stock

---

## Architectural Decisions

### 1. Modular Monolith (Not Microservices)

**Why:**
- Strict data integrity: Goods Receipt must post stock row + FI document in one ACID transaction. No eventual consistency.
- Single Postgres DB guarantees joins across modules: `JOIN ent_plant + mm_purchase_order + fi_document`
- Minimal container footprint for single VPS/on-prem: 3 containers only (app, postgres, traefik) vs 10+ microservices
- Easier deployment, debugging, and transactional integrity for food service SME

**Enforcement:**
- Codebase segmented into isolated domains: `/src/modules/foundation`, `/hr`, `/mm`, `/pp`, `/fico`, `/sd`, `/audit`
- Dependency rule: `foundation → hr → mm → pp → fico → sd → audit` (nothing depends on audit, foundation depends on nothing)
- ESLint `no-restricted-imports`: `mm` cannot import from `pp` or `fico`, build fails
- Single DB but logically partitioned by prefix: `ent_`, `hr_`, `mm_`, `pp_`, `fi_`, `inv_`, `pi_`, `co_`, `sd_`, `audit_`, `wf_`, `dms_`

### 2. Drizzle ORM - Modular Schema Composition

**Why Chosen Over Prisma:**
- Prisma has single schema file, hard for modular monolith. Drizzle allows each module to export its tables in `infrastructure/schema.ts` and merge into one client in `src/shared/kernel/db/schema.ts`
- Better transactional control: `db.transaction()` with `SELECT FOR UPDATE`, `SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`
- SQL-like, closer to Postgres for complex queries (MAP recalculation, FIFO expiry, BOM explosion)
- Smaller bundle, no Rust engine

**Single Source of Truth:**
- `src/shared/kernel/db/schema.ts` re-exports all module schemas: `export * from '../../../modules/foundation/enterprise/infrastructure/schema'` etc
- Single `db` client from `src/shared/kernel/db/client.ts` with Pool max 20, `withTransaction()` and `withSerializableTransaction()` helpers
- Drizzle config: `drizzle.config.ts` schema points to single merged file, migrations in `drizzle/migrations`

### 3. Layer 0 Foundation - Absolute Foundational Requirements

**Built Before Any Transactional Modules:**

**Enterprise Structure / Master Data:**
- `ent_client` (100), `ent_company_code` (1000 KWD), `ent_plant` (1000 Main Kitchen, 1100 Storage), `ent_storage_location` (0001 Main, 0002 Cold, 0003 Shop Floor, 0004 Returns, 0005 QI)
- `ent_business_partner` central with role VENDOR/CUSTOMER/BOTH + extensions `ent_bp_vendor_ext`, `ent_bp_customer_ext` (not separate vendor table)
- `ent_material_master` kernel (ID, base UoM, group, description, is_batch_managed true, shelfLifeDays, valuation_class, expiry_control BLOCK/WARN/RESTRICTED_USE, is_kit, is_phantom_kit, landed_cost_relevance) + `ent_material_plant` extension (price_control S Standard for FERT / V Moving Avg for ROH, MAP, standard_price, total_stock_qty, total_stock_value, total_landed_cost, last_gr_price, safety_stock, reorder_point, expiry_control_override)
- `ent_batch` (batch_number, material_id, plant_id, supplier_batch, manufacturing_date, expiry_date critical for perishables, is_expired, vendor_id, index on expiry)
- `ent_uom` (KG, L, PC, BOX, KIT), `ent_currency` (KWD decimal 3), `ent_material_group`, `ent_number_range` (object_type MATERIAL/BP/BATCH/PR/PO/GR/IV/PROD_ORDER/FI_DOC/PAYROLL/SALES_ORDER/KITTING_ORDER/PI/COSTING_RUN, company_code_id, year, prefix, from_number, to_number, current_number, buffered) + buffer table, `ent_number_range` with SELECT FOR UPDATE for audit-safe sequential numbers

**Central Workflow Engine:**
- `wf_definition` (code PR_APPROVAL, document_type PR, conditions JSON threshold), `wf_definition_step` (step_order, approver_type MANAGER/ROLE/USER/OWNER/COST_CENTER_OWNER, approver_role, min_amount, max_amount, requires_dual, is_owner_approval, slaHours)
- `wf_instance` (definition_id, document_type, document_id, document_number, company_code_id, current_state DRAFT/PENDING_APPROVAL/IN_APPROVAL/APPROVED/REJECTED, current_step_order, requester_id, amount), `wf_task` (instance_id, step_id, assignee_id employee, status PENDING/APPROVED/REJECTED/DELEGATED, decision, comment, delegatedTo), `wf_history` (from_state, to_state, actor, action SUBMIT/APPROVE/REJECT/ESCALATE)
- Flow: UI calls `PurchaseRequisitionService.create()` saves PR DRAFT, fires domain event PR_CREATED, workflow listener loads definition, reads HR hierarchy `hr_employee.reports_to`, creates instance + tasks for manager + owner if amount >500 KWD dual approval, PR status PENDING_APPROVAL, inbox shows task

**Document Management System (DMS):**
- `dms_document` (file_name, original_file_name, file_size, mime_type, storage_path /data/dms/2026/09/uuid.pdf, hash_sha256, uploaded_by, is_deleted), `dms_document_link` (polymorphic document_id, linked_table e.g., mm_purchase_order, linked_id, linked_doc_number, doc_category INVOICE/SPEC/CERT/GR/PO/OTHER)
- Storage abstracted to local volume `/data/dms` mounted to container, S3-compatible interface ready for MinIO swap, reusable component `<DocumentVault linkedTable="mm_purchase_order" linkedId={poId} />`

**Inventory State Mechanics:**
- `inv_stock` PK material_id, plant_id, sloc_id, batch_id, stock_status (UNRESTRICTED, QUALITY_INSPECTION, BLOCKED, RETURNS, IN_TRANSIT), quantity, reserved_qty, unique constraint on material+plant+sloc+batch+status
- `inv_stock_ledger` immutable WORM-like: movement_type 101 GR, 102 reversal, 122 return, 261 GI prod, 262 reversal, 311 transfer, 321 QI→Unrest, 322 QI→Blocked, 343 Blocked→Unrest, 344 Unrest→Blocked, 350 QI→Blocked scrap, 453 Yield, 551 Scrap/Spoilage, 561 Initial, 601 GI sales/POS, K01 Kitting consumption, K02 Kitting production, material_id, plant_id, sloc_id, batch_id, stock_status_from/to, quantity (positive receipt negative issue), quantity_before/after, unit_cost, total_value, total_value_before/after, reference_doc_type/number/id/line, posted_by, posted_at, header_text, is_reversed, reversal_of_id
- View `inv_unrestricted_stock` = WHERE status UNRESTRICTED AND qty>0 AND (batch expiry > now OR batch_id IS NULL) for PP consumption only, enforced at DB level not just UI
- All changes via `InventoryService.postMovement()` with SERIALIZABLE transaction, SELECT FOR UPDATE locking, MAP recalculation (Moving Average: (Total Value Before + Receipt Value + Landed)/ (Qty Before + Receipt Qty)), negative stock prevention, expiry blocking per material, physical inventory blocking

**Additional Foundation:**
- `ent_number_range` ERP-like buffered sequential integrity per doc type and year for audit
- `ent_uom`, `ent_currency` single KWD with 3 decimals

### 4. Core Modules

**HR (Depends only on foundation):**
- `hr_org_unit` (code, name, parent_id hierarchy, plant_id), `hr_position` (code, name, org_unit_id, is_manager, is_owner for dual approval), `hr_employee` (employee_number, user_id 1:1 with auth_user, first_name, last_name, email, position_id, manager_id self-ref reporting hierarchy, plant_id, company_code_id, cost_center_id, status ACTIVE/ON_LEAVE/TERMINATED/PROBATION, hire_date, basic_salary 300 KWD test seed, currency KWD, is_active)
- `hr_payroll_run` (period_year, period_month, company_code_id, status DRAFT/POSTED/PAID/CANCELLED, total_gross, total_deductions, total_net, fi_document_id, posted_at, posted_by), `hr_payroll_line` (payroll_run_id, employee_id, basic_salary, allowances, deductions, overtime, net_pay, cost_center_id, status)
- Payroll FI: Dr Salary Expense 500000 per cost_center_id (employee's CC) Cr Salaries Payable 210001 Liability, balanced BKPF/BSEG, then clearing Dr Payable Cr Bank/Cash 100010

**MM - Materials Management (Depends on foundation + hr):**
- `mm_purchase_requisition` (pr_number, company_code_id, plant_id, requester_id, status DRAFT/PENDING_APPROVAL/APPROVED/REJECTED/CONVERTED_TO_PO, total_amount, currency KWD, required_date, workflow_instance_id), `mm_pr_line` (pr_id, line_number, material_id, quantity, uom, estimated_price, plant_id, sloc_id, is_converted, po_id)
- `mm_purchase_order` (po_number 45*, company_code_id, vendor_id BP, plant_id, status DRAFT/PENDING_APPROVAL/APPROVED/SENT/PARTIALLY_RECEIVED/FULLY_RECEIVED/CLOSED/CANCELLED, total_amount, total_landed_cost freight+customs+tax, currency, payment_terms, delivery_date, workflow_instance_id, pr_id, freight_amount, customs_amount, other_charges, tax_amount), `mm_po_line` (po_id, line_number, material_id, quantity, quantity_received, quantity_invoiced, uom, unit_price, freight_per_unit, customs_per_unit, tax_per_unit, total_per_unit = unit+freight+customs+tax, plant_id, sloc_id, tax_code_id, is_landed_cost_relevant, delivery_completed ELIKZ boolean, is_closed, closed_reason SHORT_SHIPMENT_FINAL, closed_at, closed_by)
- `mm_goods_receipt` (gr_number 50*, po_id, company_code_id, plant_id, status DRAFT/POSTED/CANCELLED, posting_date, document_date, header_text, total_amount, total_landed_cost provisional, fi_document_id BSX/WRX), `mm_gr_line` (gr_id, po_line_id, line_number, material_id, plant_id, sloc_id, batch_id, batch_number, quantity, uom, unit_price PO price, unit_landed_cost freight/customs per unit at GR, total_value qty×(price+landed), stock_status UNRESTRICTED/QI/BLOCKED, expiry_date, stock_ledger_id)
- `mm_invoice_verification` (iv_number 51*, gr_id, po_id, vendor_id, company_code_id, status DRAFT/POSTED/BLOCKED/CANCELLED, invoice_date, posting_date, vendor_invoice_number, total_amount, tax_amount, freight_amount, customs_amount, other_charges, total_landed_cost final, price_variance difference PO vs Invoice, fi_document_id RE+WRX clearing+BSX adjustment, ap_invoice_id, is_landed_cost_posted), `mm_iv_line` (iv_id, gr_line_id, po_line_id, line_number, material_id, quantity, unit_price_invoiced final, unit_price_po, freight_per_unit final, customs_per_unit, other_per_unit, total_per_unit_final final for MAP, price_variance_per_unit, tax_code_id, tax_amount)
- Flow: PR→PO→GR→IV simplified, RFQ bypassed MVP, material types ROH (MAP V) + FERT (Standard S) + DIEN, batch managed expiry, valuation MAP for ROH smooth cost fluctuations Standard for FERT, landed costs freight/customs/non-recoverable tax inclusion into MAP at GR provisional final at IV, zero-stock variance routing to PRD account 310000 prevents absurd unit cost spikes when only fractional qty remains, partial GRs multiple 101 per PO line until ELIKZ delivery_completed flag closes line even if received<ordered short-shipment final, clears open commitment
- Services: `GoodsReceiptService.createGoodsReceipt()` with SELECT FOR UPDATE on PO line, checks delivery_completed/is_closed error if closed, updates quantity_received, sets ELIKZ if isFinalDelivery, updates PO header status PARTIALLY/FULLY_RECEIVED, creates FI doc WE Dr Inventory BSX Cr GR/IR WRX ACID, `setDeliveryCompleted()` toggles ELIKZ with audit short_qty, `InvoiceVerificationService.postInvoiceVerification()` MAP adjustment with landed costs, price variance → PRD if zero-stock

**PP - Production Planning (Depends on foundation+hr+mm):**
- `pp_work_center` (code WC-KITCHEN-01, name, plant_id, cost_center_id, capacity_per_hour)
- `pp_bom_header` (bom_number, material_id parent FERT or Kit, plant_id, type STANDARD/KIT_STOCKED/KIT_PHANTOM, status DRAFT/ACTIVE/BLOCKED/EXPIRED, version, base_quantity 1 FERT = X ROH, base_uom, is_phantom true explode at prod order confirmation without intermediate stock, is_kit true stocked kit, valid_from/to, expiry_rule MIN_COMPONENTS/FIXED_DAYS/MANUAL, fixed_shelf_life_days), `pp_bom_line` (bom_header_id, line_number, component_material_id ROH, quantity per base, uom, is_batch_tracked, is_phantom_explode recursive, scrap_factor %, work_center_id)
- `pp_production_order` (order_number 10*, type STANDARD/KITTING/REWORK, material_id FERT or Stocked Kit, plant_id, bom_header_id, work_center_id, quantity_planned, quantity_yield, quantity_scrap, quantity_rework, status CREATED/RELEASED/IN_PROCESS/CONFIRMED/CLOSED/CANCELLED, target_batch_id, target_batch_number, target_expiry_date MIN(component expiries), planned_start/end, actual_start/end, planned_cost, actual_cost, is_kitting, kitting_order_id self-ref)
- `pp_production_order_component` (production_order_id, material_id ROH, batch_id FIFO expiry, bom_line_id, quantity_required, quantity_issued, quantity_scrap, uom, is_phantom, is_backflushed)
- `pp_kitting_order` (kitting_number KIT range, production_order_id, kit_material_id Stocked Kit, target_batch_id new batch for kit, target_quantity, min_component_expiry MIN, calculated_expiry MIN or FIXED, k01_movement_id consumption, k02_movement_id production, status)
- `pp_production_confirmation` (confirmation_number, production_order_id, work_center_id, yield_quantity, scrap_quantity, rework_quantity, exploded_components JSONB phantom exploded, posted_at, posted_by, fi_document_id)
- Manufacturing type Process/Repetitive hybrid, strict BOMs convert raw material kits into finished menu items, BOMs + basic Work Centers required, complex Routings/Production Versions deferred, manual Production Orders tied to daily sales/demand sufficient, full MRP run not required Phase 1, shop floor confirmations critical for Yield/Scrap waste/spoilage for cost controlling
- Kitting: Both Stocked Kits Make-to-Stock K01/K02 build sub-assemblies held in inventory with own batch numbers inherited expiry MIN(components) and Phantom Kits Make-to-Order dynamic explosion at Production Order confirmation 261 without intermediate stock
- Services: `KittingService.explodeBom()` recursive with visited Set circular detection, `createStockedKit()` FIFO by expiry, minExpiry MIN, batch KIT-xxx expiry MIN, K01 consumption K02 production cost Σ MAP, `confirmProductionWithPhantomExplosion()` issues leaf ROH via 261, receipt FERT via 453 Yield, scrap via 551, record exploded JSON
- UI Safeguards: KittingPreview highlights minExpiry, <24h red-600 animate-pulse critical DO NOT produce, <48h orange-400 warning consume quickly, operator sees bottleneck before K01/K02 commit

**FICO - Financials & Controlling (Depends on foundation+hr+mm+pp):**
- `fi_chart_of_accounts` (INT), `fi_gl_account` (coa_id, account_number 100000 Inventory ROH, 100001 FERT, 100002 KITS, 100010 Cash, 100011 KNET, 120000 AR recon, 200000 GR/IR WRX, 200001 Freight Clearing, 200002 Customs Clearing, 210000 AP recon, 210001 Salary Payable, 300000 COGS Food GBB, 300001 COGS Kits, 310000 Price Difference PRD, 400000 Revenue Menu, 400001 Revenue B2B, 500000 Salary Expense, 500001 Freight Expense, 500002 Customs Expense, 500005 Inventory Loss/Shrinkage, 400002 Inventory Gain, 220000 Output Tax, 130000 Input Tax, account_type ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE, is_balance_sheet, is_reconciliation, is_blocked, is_tax_relevant)
- `fi_cost_center` (code CC-KITCHEN-01, CC-COLD-01, CC-SALES-01, CC-ADMIN-01, CC-PURCH-01, company_code_id, parent_id, responsible_employee_id, is_active), `fi_tax_code` (code V0/V5 input, A0/A5 output, rate 5%, type INPUT/OUTPUT/BOTH/NONE, gl_account_id tax GL), `fi_auto_account_determination` (company_code_id, transaction_key BSX/WRX/GBB/PRD/FRE/ZOL/BSA, valuation_class ROH/FERT/KITS, gl_account_id, unique company+key+val_class)
- `fi_document` header BKPF: document_number number range FI_DOC, company_code_id, doc_type SA/RE/WE/RV/AB/PR/HR, posting_date, document_date, reference, header_text, total_debit, total_credit balanced, currency KWD, status DRAFT/POSTED/REVERSED/CANCELLED, reversal_of_id, reference_doc_type GR/IV/PROD/PAYROLL/SALES_ORDER/PI, reference_doc_id/number, created_by
- `fi_document_line` BSEG: fi_document_id, line_number 10,20,30, gl_account_id, cost_center_id, tax_code_id, debit, credit, tax_amount, text, material_id, quantity, bp_id Vendor/Customer, dueDate
- `fi_ap_invoice` (invoice_number vendor invoice no, fi_document_id, vendor_id, company_code_id, posting_date, invoice_date, due_date, gross_amount, tax_amount, net_amount, currency, status OPEN/PARTIALLY_PAID/PAID/OVERDUE/BLOCKED, gr_id)
- Scope GL, AP, AR, CCA core, one global CoA, no parallel ledgers single company, strict automatic account determination BSX/WRX mandatory every MM goods movement impacts valuation auto generates balanced FI doc, cost centers required departmental/station-level expenses, basic input/output tax codes
- Services: PayrollService FI Dr Expense per CC Cr Payable 3600 balanced BKPF/BSEG, clearing Dr Payable Cr Bank/Cash, CostCenterReportService UNION ALL 3 sources COGS GBB + Payroll 300×12 + Direct FI/AP overhead GROUP BY CC, GL, period hierarchical CC→GL +/− toggle period filter Year/Month

**SD - Sales & Distribution (New Module for Sales Integration):**
- `sd_sales_order` (sales_number SO range, type B2B/B2C_CASH/B2C_CARD/POS_WEBHOOK/ECOM, status DRAFT/CONFIRMED/PARTIALLY_ISSUED/FULLY_ISSUED/INVOICED/CANCELLED, company_code_id, plant_id, customer_id BP optional for cash, customer_name walk-in, payment_type CASH/CARD/KNET/AR/ONLINE, is_cash_sale true Dr Cash Cr Revenue vs false Dr AR Cr Revenue, source MANUAL/POS_FOODICS/POS_SQUARE/ECOM_SHOPIFY/ECOM_WOOCOM/API, external_id POS external order ID, external_payload JSONB original webhook, order_date, posting_date, required_date, total_amount, tax_amount, discount_amount, net_amount, currency KWD, fi_document_id Revenue+COGS+AR/Cash, due_date, is_paid, paid_at, created_by)
- `sd_sales_line` (sales_order_id, line_number, material_id FERT, plant_id, sloc_id, batch_id, batch_number, quantity, quantity_issued, uom, unit_price, discount_per_unit, tax_code_id, tax_rate, line_total, cogs_per_unit MAP or Standard at issue time, total_cogs, stock_ledger_id, expiry_date, is_expiry_blocked, expiry_warning)
- `sd_pos_webhook_log` (source, external_id, payload JSONB, headers JSONB, sales_order_id, status PENDING/PROCESSED/FAILED, error_message, processing_time_ms, created_at)
- Both manual Sales Order UI for B2B and universal webhook POST /api/sales/issue for POS/ecom, financial flow both cash immediate clearing Dr Cash/Cr Revenue for webhook retail and AR Dr AR/Cr Revenue for manual invoices, expiry blocking configurable at Material Master BLOCK hard block on GI when expired vs WARNING vs RESTRICTED_USE manual downgrade to restricted use, MAP with landed costs freight/customs/non-recoverable taxes inclusion at IV or GR for accurate COGS
- Service SalesService with withSerializableTransaction() SET TRANSACTION ISOLATION LEVEL SERIALIZABLE for high-volume POS concurrency prevents race on inventory when multiple POS orders hit same FERT batch concurrently peak hours, createSalesOrder, issueSalesOrder 601 GI + FI atomic, handlePosWebhook universal

**Physical Inventory (MM-IM) Phase 4:**
- `pi_document` (pi_number PI range, company_code_id, plant_id, sloc_id, status CREATED/COUNT_ENTERED/POSTED/CANCELLED, posting_date, planned_count_date, header_text, is_blocking_active true, totals total_lines, counted_lines, system_qty, counted_qty, variance_qty, variance_value, fi_document_id, created_by), `pi_line` (pi_document_id, line_number, material_id, batch_id, batch_number, stock_status, system_qty snapshot, system_value, unit_cost MAP at creation, counted_qty, variance_qty counted-system, variance_value variance×MAP, status PENDING/COUNTED/POSTED/BLOCKED, is_counted, stock_ledger_id, expiry_date), `pi_count_entry` audit counted_qty, counted_by, counted_at, notes
- Workflow Create PID → Enter Count → Post Differences, when PID active for SLoc+Material temporarily block 101/261/601 movements to prevent moving-target counts via InventoryService check SELECT pi_number FROM pi_document JOIN pi_line WHERE plant+sloc+material AND status CREATED/COUNT_ENTERED AND blocking active, variance posting auto FI: missing shrinkage Dr Inventory Loss/Shrinkage 500005 Expense Cr Inventory Asset 100000 at MAP, surplus Dr Inventory Asset Cr Gain 400002 at MAP
- Service PhysicalInventoryService createPid snapshot + block, isMovementBlocked, enterCount rapid keyboard Tab/Arrow, postDifferences FI variance + release blocking
- UI high-density count sheet @tanstack/react-virtual 300 batches → 17 DOM, keyboard Tab/Arrow rapid entry down countedQty column yellow-100 input, real-time variance System vs Counted before commit, totals live, status SHRINKAGE red-600 SURPLUS green-600

**Product Cost Controlling (CO-PC) Phase 4:**
- `co_costing_run` (run_number COST range, type STANDARD/SIMULATION, status DRAFT/RUNNING/COMPLETED/FAILED/CANCELLED, plant_id, costing_date, totals total_materials, total_costed, total_value), `co_costing_run_line` (costing_run_id, material_id FERT, bom_header_id active BOM, total_cost, material_cost Σ MAP, labor_cost, overhead_cost, previous_standard_price, new_standard_price, price_difference, bom_explosion JSONB components with materialNumber, description, quantity, uom, unitCost MAP, totalCost, isPhantom, level, is_updated)
- Service BomCostingService calculateBomCost recursive phantom explosion visited Set circular detection, getCostRollup total cost Σ MAP×qty, executeCostingRun updates Standard Price of FERT in Material Master ent_material_plant.standard_price based on calculation, type STANDARD updates vs SIMULATION preview only
- UI costing-run with virtualized FERT materials 3 rows, BOM explosion Level 0+1 phantom, cost Σ MAP, prev 0.500→new 0.644 diff +0.144, STANDARD updates std price for accurate COGS

**Audit (Depends on all, nothing depends on audit):**
- `audit_log` (table_name, record_id, record_number, action INSERT/UPDATE/DELETE/POST/REVERSE/APPROVE/REJECT, old_values jsonb, new_values jsonb, changed_fields text[], changed_by, changed_by_email, changed_at, company_code_id, transaction_id group changes in one transaction, ip_address, user_agent, description human readable) WORM-lite append-only, captures old_data new_data JSON for critical state changes across fi_document, inv_stock, pi_document, mm_purchase_order
- `audit_document_flow` (root_document_type/id/number, preceding_doc_type/id/number, succeeding_doc_type/id/number, created_at) for document flow chain PR→PO→GR→IV→Payment Clearing and Sales→GI→FI, append-only preserves chain even if doc deleted, totalDocuments, totalValue
- Services: DocumentFlowService getDocumentFlow traverses backwards audit_document_flow to find root PR/Sales Order then forward chain via flow table + direct FK PR→PO via pr_id, PO→GR via po_id, PO→IV via po_id, GR→IV via gr_id, Sales→GI via ledger, Sales→FI via fi_document_id, PI→FI via fi_document_id, builds tree nodes with level, parentId, children, flatten for totals, getMockFlow for demo, createFlowLink called during transactional postings INSERT INTO audit_document_flow ON CONFLICT DO NOTHING
- AuditLogService logChange INSERT INTO audit_log with old_values::jsonb new_values::jsonb changed_fields, calculateChangedFields, specific loggers logFiDocumentChange, logInvStockChange, logPiDocumentChange, logPurchaseOrderChange with table-specific description, queryAuditLogs WHERE table_name=X AND record_id=Y AND changed_by=Z AND action AND fromDate/toDate ORDER BY changed_at DESC LIMIT/OFFSET, getMockAuditLogs 500 entries for demo

**Document Flow UI:**
- `/audit/document-flow` visual tree mapping with color coding: PR yellow-200, PO blue-200, GR green-200, IV purple-200, FI black white, Sales orange-200, GI green-100, PI red-100, icons 📝📋📦🧾💰🛒📤📊, level, parentId, children, amount, posting_date, reference, totalDocuments, totalValue, flow type toggle PR→PO→GR→IV→Payment vs POS Sales→GI→FI, implementation explanation, ERP ALB equivalent, Document Flow button on PO/Sales Order navigates to flow

**Audit Log UI:**
- `/audit/logs` centralized virtualized grid 500 entries @tanstack/react-virtual 500→22 DOM, filters table_name dropdown fi_document/inv_stock/pi_document/mm_purchase_order/mm_goods_receipt/sd_sales_order/hr_payroll_run, action dropdown INSERT/UPDATE/POST/APPROVE/REJECT, search record_id/doc number, search user_id/email, shows timestamp, table badge black for FI green for stock red for PI blue for PO, doc number bold, action badge POST black INSERT green UPDATE yellow APPROVE blue, user email, description truncate, changed_fields, record_id, detail panel old_data JSON red and new_data JSON green with changed_fields yellow-100, WORM-lite properties append-only old/new JSON for critical tables fi_document BKPF/BSEG, inv_stock quantity status, pi_document status variance, mm_purchase_order status total ELIKZ

---

## Deployment - Minimal Footprint Production

### Prerequisites Fresh Linux VPS (Ubuntu 22.04)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# Logout and login again for docker group

# Install Node.js 20 (for local build if needed, not required for Docker)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
docker --version
docker-compose --version
node -v
npm -v
```

### Clone and Deploy (Fresh VPS - Automated via .env)

```bash
# Clone repo (or upload files to VPS)
git clone https://github.com/deepakpt2/erp-modular-monolith.git erp-modular-monolith
cd erp-modular-monolith

# Create env file from example
cp .env.example .env
# Edit .env with production secrets
nano .env
# REQUIRED - set strong values:
# POSTGRES_PASSWORD=change-me-strong
# DATABASE_URL=postgres://postgres:change-me-strong@postgres:5432/erp
# NEXTAUTH_SECRET=your-super-secret-32-char-minimum-key-change-me-in-production
# NEXTAUTH_URL=https://er.deepakpt.com
# MVP_NO_AUTH=true  # No auth required for MVP - all routes public
# AUTO_MIGRATE=true # Auto runs db:push + init-prod on startup, no manual steps
# FMCG_SAMPLE_DATA_ENABLED=false # true for demo 23 materials, false for clean production
# ADMIN_EMAIL=admin@er.deepakpt.com
# ADMIN_PASSWORD=Admin@123456
# DOMAIN=er.deepakpt.com

# Build and start - auto-migrate container runs automatically
docker compose up -d --build

# What happens automatically (because AUTO_MIGRATE=true):
# 1. postgres starts and becomes healthy
# 2. auto-migrate runs: drizzle-kit push --force (creates all tables)
# 3. npm run db:auto-migrate reads .env:
#    - creates client 100, company code 1000 KWD, CoA INT, 13 GL, 3 CC, plant 1000, 3 SLocs, UoM, currency, tax codes, number ranges
#    - creates admin user from ADMIN_EMAIL/ADMIN_PASSWORD
#    - if FMCG_SAMPLE_DATA_ENABLED=true, seeds 23 materials, 5 vendors, 4 customers, 2 BOMs, 5 batches
# 4. app starts on 3000 via Traefik on 80 (Host rule from DOMAIN env)

# Check status
docker compose ps
# Should show:
# - postgres:16-alpine healthy on 5432
# - auto-migrate: exited successfully
# - app: Next.js standalone on 3000

# View logs
docker compose logs -f app
docker compose logs auto-migrate
docker compose logs -f postgres

# Check Traefik dashboard (if external traefik with proxy network)
# http://your-vps-ip:8080/dashboard/
# App: https://er.deepakpt.com/ -> No auth required, Skip Login -> Dashboard

# Manual steps if AUTO_MIGRATE=false:
# docker compose run --rm migrator npm run db:push
# docker compose run --rm migrator npm run db:init-prod  # foundation + admin
# docker compose run --rm migrator npm run db:create-admin # admin only
# docker compose run --rm migrator npm run db:seed # full demo 12 users + payroll 3600 KWD
# docker compose run --rm migrator npm run db:seed:fmcg # 23 FMCG materials toggle
```

### Database Schema Push and Seed

```bash
# Option 1: Inside app container (production)
docker-compose exec app npx drizzle-kit push
docker-compose exec app npx tsx src/shared/kernel/db/seed.ts

# Option 2: From host if Node.js installed and DATABASE_URL points to localhost:5432
npm install
npm run db:push
# This pushes all schemas:
# - ent_client, ent_company_code, ent_plant, ent_storage_location, ent_uom, ent_currency, ent_material_group, ent_material_master (expiry_control BLOCK/WARN/RESTRICTED_USE, is_kit, is_phantom_kit, landed_cost_relevance), ent_material_plant (price_control S/V, MAP, standard_price, total_landed_cost, expiry_control_override), ent_batch (expiry_date, is_expired), ent_business_partner, ent_bp_vendor_ext, ent_bp_customer_ext
# - ent_number_range (MATERIAL, BP, BATCH, PR, PO, GR, IV, PROD_ORDER, FI_DOC, PAYROLL, SALES_ORDER, KITTING_ORDER, PI, COSTING_RUN) + buffer
# - inv_stock unique mat/plant/sloc/batch/status, inv_stock_ledger immutable 101/102/122/261/262/311/321/322/343/344/350/453/551/561/601/K01/K02
# - dms_document, dms_document_link
# - wf_definition, wf_definition_step, wf_instance, wf_task, wf_history
# - hr_org_unit, hr_position, hr_employee (1:1 user, manager_id hierarchy, cost_center_id, basic_salary 300 KWD), hr_payroll_run, hr_payroll_line
# - fi_chart_of_accounts, fi_gl_account (100000 ROH, 100001 FERT, 100002 KITS, 100010 Cash, 100011 KNET, 120000 AR, 200000 GR/IR WRX, 200001 Freight, 200002 Customs, 210000 AP, 210001 Salary Payable, 300000 COGS GBB, 300001 COGS Kits, 310000 PRD, 400000 Revenue Menu, 400001 Revenue B2B, 500000 Salary Expense, 500001 Freight, 500002 Customs, 500005 Loss/Shrinkage, 400002 Gain, 220000 Output Tax, 130000 Input Tax), fi_cost_center, fi_tax_code, fi_auto_account_determination (BSX/WRX/GBB/PRD/FRE/ZOL), fi_document BKPF, fi_document_line BSEG, fi_ap_invoice
# - mm_purchase_requisition, mm_pr_line, mm_purchase_order, mm_po_line (delivery_completed ELIKZ, is_closed, closed_reason SHORT_SHIPMENT_FINAL), mm_goods_receipt, mm_gr_line (unit_landed_cost, stock_status), mm_invoice_verification (freight/customs/other final, price_variance, is_landed_cost_posted), mm_iv_line
# - pp_work_center, pp_bom_header (type KIT_STOCKED/KIT_PHANTOM/STANDARD, is_kit, is_phantom, expiry_rule MIN_COMPONENTS/FIXED_DAYS/MANUAL), pp_bom_line (is_phantom_explode, scrap_factor), pp_production_order, pp_production_order_component, pp_kitting_order (K01/K02, min_expiry), pp_production_confirmation (yield, scrap, exploded_components JSONB)
# - co_costing_run, co_costing_run_line (total_cost, material_cost, prev/new std price, bom_explosion JSONB)
# - sd_sales_order (type B2B/B2C_CASH/POS_WEBHOOK/ECOM, payment_type CASH/CARD/KNET/AR/ONLINE, is_cash_sale, source MANUAL/POS_FOODICS/POS_SQUARE/ECOM_SHOPIFY/ECOM_WOOCOM/API, external_id, external_payload JSONB, fi_document_id), sd_sales_line (cogs_per_unit MAP, expiry flags), sd_pos_webhook_log
# - pi_document (pi_number PI range, plant_id, sloc_id, status CREATED/COUNT_ENTERED/POSTED/CANCELLED, is_blocking_active, totals), pi_line (system_qty snapshot, counted_qty, variance_qty, variance_value, unit_cost MAP), pi_count_entry
# - audit_log (table_name, record_id, record_number, action INSERT/UPDATE/POST/APPROVE, old_values jsonb, new_values jsonb, changed_fields, changed_by, transaction_id, description) WORM-lite, audit_document_flow (root_type/id/number, preceding_type/id/number, succeeding_type/id/number)
# - auth_user, auth_account, auth_session, auth_verificationToken (NextAuth v5)

# Seed data
npm run db:seed
# Or directly:
npx tsx src/shared/kernel/db/seed.ts
# Seeds:
# - Client 100, Company Code 1000 KWD Kuwait City, CoA INT, Plants 1000 Main Kitchen + 1100 Storage, SLocs 0001 Main 0002 Cold 0003 Shop Floor 0004 Returns 0005 QI
# - UoM KG/G/L/ML/PC/BOX/PACK/KIT, Currency KWD 3 decimals, Material Groups FOOD/BEV/PACK/KITS/MENU/SERV
# - Chart of Accounts INT, GL Accounts 23 including 100000 BSX ROH, 200000 WRX GR/IR, 300000 GBB COGS, 310000 PRD Price Diff, 500000 Salary Expense, 210001 Payable, 500005 Loss/Shrinkage, 400002 Gain
# - Cost Centers CC-KITCHEN-01 Main Kitchen, CC-COLD-01 Cold Storage, CC-SALES-01 Sales, CC-ADMIN-01 Admin, CC-PURCH-01 Purchasing
# - Tax Codes V0/V5 input, A0/A5 output 5%
# - Auto Determination BSX/WRX/GBB/PRD/FRE/ZOL for ROH/FERT/KITS
# - Number Ranges 14 types for current year: MATERIAL MAT 1000000000-1999999999, BP 100000-999999, BATCH B, PR, PO 45 4500000000-4599999999, GR 50 5000000000-5099999999, IV 51 5100000000-5199999999, PROD_ORDER 10 1000000000-1999999999, FI_DOC, PAYROLL HR, KITTING_ORDER KIT, SALES_ORDER SO, PI PI, COSTING_RUN COST
# - Materials 8 with expiry_control BLOCK/WARN/RESTRICTED_USE, is_kit, is_phantom_kit, landed_cost_relevance ALL/NONE, shelfLifeDays 1-365:
#   MAT-1000000001 Chicken Breast Fresh ROH KG 5d BLOCK, MAT-1000000002 Rice Basmati ROH KG 365d WARNING, MAT-1000000003 Cooking Oil ROH L 180d WARNING, MAT-1000000004 Spice Kit Shawarma ROH KIT 30d BLOCK is_kit true KIT_STOCKED, MAT-1000000005 Sauce Kit Garlic ROH KIT 7d BLOCK is_kit true, MAT-1000000006 Burger Kit Phantom ROH KIT 2d BLOCK is_phantom_kit true, MAT-1000000007 Chicken Shawarma Sandwich FERT PC 1d BLOCK, MAT-1000000008 Chicken Burger FERT PC 1d BLOCK
# - Material Plant extensions price_control V MAP for ROH S Standard for FERT, MAP 0, std 0, qty 0 value 0
# - Work Centers WC-KITCHEN-01 Main Kitchen 50/h, WC-COLD-01 Cold Prep 30/h, WC-ASSEMBLY-01 Assembly 100/h
# - BOMs: BOM-KIT-SPICE-01 Spice Kit Stocked Kit 1 KIT = 0.05kg Chicken + 0.02kg Rice expiry_rule MIN_COMPONENTS, BOM-SHAWARMA-01 Shawarma 1 PC = 0.15kg Chicken + 0.10kg Rice + 1x Spice Kit phantom explode true
# - Workflow Definitions PR_APPROVAL_STD Manager + Owner dual >500 KWD, PO_APPROVAL_STD Manager + Owner >1000 KWD, steps with approver_type MANAGER/OWNER min/max amount requires_dual is_owner_approval
# - HR Org Units OU-KITCHEN, OU-SALES, OU-ADMIN, Positions POS-CHEF Head Chef manager, POS-COOK Cook, POS-SALES-MGR Sales Manager, POS-CASHIER Cashier, POS-OWNER Owner is_owner true, POS-ADMIN Admin
# - Auth Users 12: chef@erp.local, cook1-4, salesmgr, cashier1-3, owner, admin1-2
# - Employees 12 with 1:1 user, employee_number EMP-100 to EMP-112, first/last names, position_id, plant_id 1000, company_code_id 1000, cost_center_id Kitchen 5 Sales 4 Admin 3, manager_id hierarchy Chef→Cooks, SalesMgr→Cashiers, Owner→Admins+SalesMgr+Chef, status ACTIVE, hire_date 2024-01-01, basic_salary 300 KWD exactly per Phase 3 requirement, currency KWD
# - Payroll Run 2026-09 DRAFT 12×300=3600 KWD total_gross 3600 total_net 3600, lines DRAFT 300 each with cost_center_id
# - No stock yet (0 qty) - will be created via GR, Kitting, PI, etc

# Verify seed
docker-compose exec postgres psql -U postgres -d erp -c "SELECT code, name FROM ent_company_code; SELECT code, name FROM ent_plant; SELECT material_number, description, expiry_control, is_kit, is_phantom_kit FROM ent_material_master LIMIT 8; SELECT employee_number, first_name, cost_center_id, basic_salary FROM hr_employee; SELECT period_year, period_month, status, total_net FROM hr_payroll_run;"
```

### Access Application

```bash
# App runs on port 3000 via Traefik on 80
# http://your-vps-ip/ → ERP Modular Monolith
# http://your-vps-ip:8080/dashboard/ → Traefik dashboard

# Local dev without Docker
npm install
npm run dev
# http://localhost:3000

# Build for production
npm run build
npm run start
```

### Environment Variables

```env
# .env
DATABASE_URL=postgres://postgres:postgres@postgres:5432/erp
NEXTAUTH_SECRET=your-super-secret-32-char-minimum-key-change-me-in-production
NEXTAUTH_URL=https://your-domain.com
DMS_STORAGE_PATH=/data/dms
```

### Traefik Routing

- `docker-compose.yml` labels: `traefik.enable=true`, `traefik.http.routers.erp.rule=Host(`your-domain.com`)`, `traefik.http.services.erp.loadbalancer.server.port=3000`
- For local: `Host(`localhost`)` routes to app
- For production with domain: Change rule to `Host(`erp.your-domain.com`)` and add TLS certresolver
- Traefik dashboard on 8080 (insecure true for dev, secure with auth in prod)

### Volumes

- `postgres_data:/var/lib/postgresql/data` - DB persistence
- `dms_data:/data/dms` - PDFs/invoices/specs attachments, mapped to app container /data/dms, local volume storage, no OCR, standard PDF/image linking

### Security & RBAC

- NextAuth v5 with email/password + bcryptjs, auth_user table with role ADMIN/USER/PURCHASER/WAREHOUSE/PRODUCTION/FINANCE/OWNER/AUDITOR, is_active
- RBAC guard in `shared/kernel/auth` - check role before server actions
- No LDAP/AD/SAML for MVP, email/password + RBAC strict as per requirements
- Password hash stored in auth_user.password_hash

### UI Design Philosophy

- T-codes not required, focus on functional exactness, strict transactional integrity, data-dense UI
- Experienced ERP user intuitive: Document Flow like ALB, ELIKZ like ERP, BSX/WRX auto determination, MAP, batch expiry, number ranges
- High-density Excel-like grids: TanStack Table + @tanstack/react-virtual for virtualization, 500-800 rows → 22 DOM nodes, keyboard navigable ↑↓ Enter Tab PgUp/PgDn, monospace 11px, border black, Excel-like
- For 100k stock entries: same DOM, no lag, virtualization critical for perishable batches and daily sales rows

### Testing the Full Flow

**MM Flow PR→PO→GR→IV with ELIKZ Short-Shipping:**
1. Create PR 20kg Chicken via /mm/pr → workflow Manager+Owner >500 KWD → APPROVED → Convert to PO 4500000001
2. PO line ordered 20 received 0 open 20 OPEN
3. GR 5000000001 partial 18kg short-shipment → 101 movement +18kg UNRESTRICTED batch B-xxx expiry, PO line ordered 20 received 18 open 2 PARTIAL, FI WE Dr Inventory BSX 54 Cr GR/IR WRX 54
4. Toggle ELIKZ delivery_completed=true SHORT_SHIPMENT_FINAL → PO line ordered 20 received 18 open 2 but CLOSED_SHORT, no further GR, open commitment 2 cleared, audit short_qty 2, PO header FULLY_RECEIVED if all lines closed
5. IV 5100000001 final landed cost freight 0.6 customs 0.3 = 3.4 final vs 3.0 provisional, variance 0.4×18=7.2, if stock 118 exists new MAP (254+7.2)/118=2.213, if stock 0 variance → PRD 310000 prevents absurd spike

**Kitting Flow:**
- Stocked Kit: BOM-KIT-SPICE-01 Spice Kit 1 KIT = 0.05kg Chicken + 0.02kg Rice, FIFO by expiry, minExpiry MIN, batch KIT-xxx expiry MIN, K01 consumption K02 production cost Σ MAP, UI safeguards <24h red pulse critical <48h orange warning
- Phantom Kit: BOM-SHAWARMA-01 Shawarma 1 PC = 0.15kg Chicken + 0.10kg Rice + 1x Spice Kit phantom explode true → recursive explode to 2kg Chicken total, confirmation 261 GI leaf ROH, 453 Yield FERT, record exploded JSON

**Sales Flow POS Webhook SERIALIZABLE:**
- POST /api/sales/issue {source: POS_FOODICS, externalId: FOODICS-123, payload: {items: [{sku: MAT-1000000007, quantity: 2, unitPrice: 1.5}], paymentType: CASH}} → Maps SKU→material, creates sales order SOxxx type POS_WEBHOOK is_cash_sale true, auto 601 GI -2 FERT FIFO expiry, COGS MAP, FI Dr Cash 100010 Cr Revenue 400000 + Dr COGS 300000 Cr Inventory 100001 immediate clearing, logs webhook, SERIALIZABLE prevents race same batch peak hours

**Physical Inventory PID:**
- Create PID Plant 1000 SLoc 0002 Cold Storage snapshot 300 lines systemQty + MAP, blocking active for 101/261/601, enter count Tab/Arrow rapid entry yellow-100 input, real-time variance, post differences variance FI Dr Loss 500005 Cr Inventory 100000 at MAP for shrinkage -2kg @6.25=12.5 KWD or Dr Inventory Cr Gain 400002 for surplus, release blocking

**Costing Run:**
- GET /api/costing-run?materialId=FERT&plantId=1000 calculates 0.644 KWD = Σ ROH MAP×qty, POST /api/costing-run plant 1000 type STANDARD updates std price 0.500→0.644 in material master for accurate COGS

**Payroll FI 300 KWD:**
- Create payroll run 2026-09 DRAFT 12×300=3600 KWD, approve → FI BKPF/BSEG Dr Salary Expense 500000 per CC Kitchen 1500 Sales 1200 Admin 900 Cr Payable 210001 3600 balanced, clearing Dr Payable Cr Bank 100010 3600 PAID

**CCA Report:**
- Aggregates 3 sources by cost_center: COGS GBB 300000/300001 movement 601 RV/WE, Payroll 500000 doc_type HR 300×12=3600, Direct FI/AP overhead SA/RE/AB, UNION ALL GROUP BY CC, GL, period, hierarchical CC→GL +/− toggle, period filter Year/Month 2026-09, virtualized

**Document Flow:**
- PR1000000001 → PO 4500000001 → GR 5000000001 (material doc) + FI-WE FI1000000001 → IV 5100000001 + FI-RE FI1000000002 → Payment Clearing FI-PAYMENT FI1000000003
- Sales SO1000000001 → GI-601 MATDOC-5000000002 → FI-RV FI1000000004 Revenue/Cash
- Visual tree with level, parentId, children, color coding, icons, amount, posting date, Document Flow button on PO/Sales Order

**Audit Log WORM-lite:**
- Captures old_data new_data JSON for fi_document, inv_stock, pi_document, mm_purchase_order, append-only, query by table_name, record_id, user_id, virtualized 500 rows → 22 DOM, old JSON red new JSON green

---

## Final Handover Polish

**All Phases Complete:**
- Layer 0: Enterprise Structure, Workflow Engine, DMS, Inventory State Mechanics, Number Ranges, UoM/Currency
- Phase 2: MM PR→PO→GR→IV with ELIKZ short-shipping, landed cost MAP + PRD zero-stock, partial GRs, high-density virtualization, kitting stocked K01/K02 + phantom 261 with safeguards <24h/<48h and circular detection, sales manual + webhook POST /api/sales/issue Cash vs AR routing SERIALIZABLE concurrency
- Phase 3: Payroll FI 300 KWD test seed Dr Expense per CC Cr Payable + clearing Dr Payable Cr Bank, CCA engine aggregates COGS + Payroll + Direct FI/AP hierarchical CC→GL period filter
- Phase 4: Physical Inventory PID Create→Count→Post blocking 101/261/601 variance FI Loss/Shrinkage at MAP + release blocking, count sheet virtualized keyboard Tab/Arrow rapid entry real-time variance, BOM Cost Rollup Σ MAP×qty phantom recursive + Costing Run updates Std Price
- Phase 5: Document Flow unified chain PR→PO→GR→IV→Payment and Sales→GI→FI visual mapping, Audit Log WORM-lite old/new JSON for critical tables fi_document/inv_stock/pi_document/mm_purchase_order, centralized virtualized grid query by table/record/user, README deployment readiness

**Deployment Ready for Fresh Linux VPS with Docker Compose + DB Seed**

**Next Steps for Production:**
- Add TLS via Traefik certresolver Let's Encrypt
- Add auth for Traefik dashboard
- Implement retry with exponential backoff for SERIALIZABLE serialization failures
- Add nightly job for expired batch detection is_expired=true + move BLOCK to BLOCKED
- Add email notifications for workflow approvals
- Add S3/MinIO for DMS instead of local volume for multi-instance
- Add Row-Level Security (RLS) for Company Code isolation if multi-company needed later

**Contact:** For issues, check docker-compose logs -f app, postgres logs, Traefik dashboard :8080, and audit_log table for troubleshooting.

**License:** Private - Single installation for one operating group as per scope.

---

**End of README - Modular Monolith ERP Ready for Deployment**
