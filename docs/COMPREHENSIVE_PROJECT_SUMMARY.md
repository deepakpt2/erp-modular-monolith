# Comprehensive Project Documentation – Condensed from All Reports
**Date:** 2026-09-28
**Repo:** https://github.com/deepakpt2/erp-modular-monolith
**Main Manual:** ERP_USER_MANUAL.md v3.0 (kept separate)
**This file condenses all historical reports that were in workspace root and docs/ into one file**

---

## 1. Function Enforcement Rule (from docs/FUNCTION_ENFORCEMENT.md)

**Rule:** From this point any function you add to the app, if it has corresponding ERP Function code it should be available in app too

Enforced via:
- `src/shared/kernel/function codes.ts` FUNCTION_MAP – all function codes with desc, module, api, function code, configurable
- `src/shared/lib/function codes.ts` FUNCTIONS – UI command palette
- `GET /api/function codes` – lists all implemented, count, mandatory, enforcement checklist
- `src/shared/kernel/api-function code.ts` – withFunction codeMeta, requireFunction code, validateFunction codeExists
- `ModernModuleShell` – every page must use function code prop

Checklist for new function:
1. Add to FUNCTION_MAP with function code field
2. Add to FUNCTIONS UI with route
3. API GET returns function code, function codeDescription
4. UI uses ModernModuleShell function code prop
5. Verify via GET /api/function codes

Mandatory: OB13, FS00, OBD4, OB53, OBYC, OMS2, CUNI, MM01, OX02, OY03, FTXP, KS01, OBBO, OB52

---

## 2. E2E Validation Report (from E2E_VALIDATION_REPORT.md)

**Date:** 2026-09-28, Company KS01 INR + 1000 KWD Dual, Test Script test_e2e_full_flow.ts 65 checks PASS

All ERP view tabs now backed by backend DB, no dangling UI-only fields:

- PR ME51N: doc_date, purchasing_org KPO1 OX08, purchasing_group K01 OME4, delivery_date, account_assignment K/None, cost_center KS-CC-01, gl_account 5000000001 BSX, item_text, header_text, tax_code GST FTXP – Fixed schema mm_purchase_requisition + API /api/pr
- PO ME21N: doc_date, purch_org, purch_group, payment_terms 0001/0002, incoterms EXW/FOB/CIF, account_assignment, cost_center, gl_account, item_text, delivery_text, freight FRB1, customs ZCUS, total MAP, delivery_completed ELIKZ, is_closed – Fixed mm_purchase_order + /api/po
- Sales VA01: sales_org KSO1 OVX2, dist_channel K1/10/K2, division K1/00, sales_office, sales_group, customer_po_number, doc_date, pricing_date, req_delivery_date, shipping_point KP01, delivery_priority, delivery_block, route, incoterms, billing_type F2, billing_block, payment_terms, account_assignment_group 01, cost_center, profit_center, ship_to WE, bill_to RE, payer RG, item_category TAN, pricing PR00, tax GST – Fixed sd_sales_order + sd_sales_line + /api/sales-orders
- Delivery VL01N: shipping_point, delivery_priority, delivery_block, route, incoterms, picking_status, goods_movement_status – Fixed sd_delivery + /api/delivery
- Billing VF01: billing_type, billing_block, payment_terms, incoterms, pricing_date, account_assignment_group, cost_center, profit_center – Fixed sd_billing + /api/billing
- Company OX02 Legal: street, postal_code, region, gst_number, pan, cin, phone, email, website, legal_form – Already backed in /api/company-codes

Result: No mocks, all tabs backed by DB.

---

## 3. Enterprise Hardening Report (from ENTERPRISE_HARDENING_REPORT.md)

**Date:** 2026-09-28, Target 500 employees hierarchical, Build Next.js 16.3.6 40+ routes PASS, E2E 65 PASS

**Removed All Mock Fallbacks – Real DB Only:**
- Before APIs returned mock array on DB error hiding failures
- After: Return 500 {error, code: DB_ERROR} no mock – Fixed /api/pr, /api/po, /api/gr, /api/iv, /api/materials, /api/stock, /api/plants, /api/business-partners, /api/billing, /api/delivery, /api/kitting, /api/mrp, /api/routings, /api/work-centers, /api/sto, /api/workflow, /api/audit-logs, /api/document-flow, /api/cca-report, /api/sales-orders
- UI: Sales page fetches real /api/sales-orders not Array.from mock
- Enterprise Impact: Fail-fast, no silent mock

**Enterprise Config Tables – OB29/OBBO/OB52/OBC4/OBA0/OB45/OBA7/FBN1/OBYC:**
Created enterpriseConfigSchema.ts with 14 tables:
- ent_fiscal_year_variant OB29 K4 April-March + ent_fiscal_year_period 12 periods P1 Apr to P12 Mar year_shift
- ent_posting_period_variant OBBO KS01/1000 + ent_posting_period OB52 from/to period/year account_type +/A/D/K/M/S is_open
- ent_field_status_variant OBC4 KS01/1000 + ent_field_status_group G001 Material, G004 Sales, G005 Bank/Cash + ent_field_status field_name is_required/optional/suppressed
- ent_tolerance_group OBA0 GL + OBA4 Employee/Customer/Vendor/AP/AR amount_per_document amount_per_open_item cash_discount_per_line
- ent_credit_control_area OB45 KS01 INR / 1000 KWD + ent_credit_control_assignment OB38 company to credit area
- ent_document_type OBA7 KR Vendor Invoice 51 5100000000-5199999999, KG Credit Memo 52, KZ Payment 53, RE Invoice Gross 51, WE GR 50 5000000000-5099999999, WA GI 50, SA G/L 54 5400000000-5499999999, RV Billing, PR Payroll
- ent_approval_authority hierarchical matrix position_id doc_type PR/PO/PAYROLL min/max amount level LEVEL_1/2/3/4/OWNER/CFO/CEO requires_dual
- ent_role 12 roles ADMIN/OWNER/CFO/CEO/MANAGER/PURCHASER/WAREHOUSE/ACCOUNTANT/SALES/HR/AUDITOR/PRODUCTION + ent_permission 26 perms PR_CREATE/PO_APPROVE/GR_POST etc + ent_role_permission + ent_user_role user to role with company/plant scoping
- Migration 0004_bouncy_doctor_octopus.sql, auto-migrate

**Enterprise Validation Helpers – Real DB Checks:**
Created validation.ts with 6 functions: validateCompanyCode, validatePlant, validateMaterial, validateCostCenter, validateTaxCode, validatePostingPeriod – all real DB, no mocks

**HR – 500 Employees Hierarchical:**
- hr_org_unit hierarchical ROOT→EXEC/FIN/PUR/WH/PROD/SALES/HR/QA/MFG, hr_position CEO/CFO/COO/MGR/SR/JR is_manager/is_owner manager_id hierarchy CEO→MGR→SR→JR, cost_center KS-CC-01, plant KP01, RBAC roles, approval authority matrix LEVEL_1 up to 1000 INR, LEVEL_2 up to 10000, LEVEL_3 up to 50000, CFO up to 500k, CEO unlimited, dual for payroll

**Physical Inventory Blocking:**
- pi_document blocking active for 101/261/601 on SLoc, isMovementBlocked checks active PID

**Kitting:**
- Stocked K01/K02 + Phantom 261 dynamic explosion with circular detection, expiry min rule

---

## 4. Phase 7 Remediation Report (from PHASE_7_REMEDIATION_REPORT.md)

**Date:** 2026-09-28, 4 tasks COMPLETE, Build PASS 46 routes (new /api/jobs, /api/exchange-rates, /api/hr/employees, /api/hr/org-units, /api/hr/positions, /api/enterprise/config), E2E 65 PASS

**Task 1 Eradicate UI Mocks (6 pages fixed):**
- /audit/logs: Was Array.from 100 mock logs, now fetches POST /api/audit-logs real DB, empty state No records found
- /audit/document-flow: Was Array.from 20 mock flows, now fetches real /api/document-flow + /api/pr/po/gr/iv real DB, empty state
- /mm/pr, /mm/po, /foundation/materials, /foundation/stock, /sales: All removed mock Array.from, now real DB with empty states

**Task 2 Multi-Currency – Only INR Default:**
- OY03 Define Currencies – Only INR default seeded, KWD/USD/EUR added by user via POST /api/currencies
- ent_currency table code, name, decimal_places, symbol, is_active, created_at – seed only INR
- Exchange rates ent_exchange_rate from_currency to_currency rate valid_from – OB08
- Company Code currency_code FK to ent_currency
- FI postings use company currency, no hardcoded KWD
- UI /fico/currencies shows only INR default, + Create for KWD etc

**Task 3 Jobs & Exchange Rates:**
- /api/jobs – background jobs table, status, logs
- /api/exchange-rates – OB08, from/to, rate

**Task 4 HR Employees API:**
- /api/hr/employees, /api/hr/org-units, /api/hr/positions – hierarchical, manager_id, cost_center_id, plant_id

---

## 5. Security Fix Report (from SECURITY_FIX_REPORT.md)

**Date:** 2026-09-28, Issue Site fully open even MVP_NO_AUTH=false, Severity Critical, Commit a79587c

**Root Cause:**
- middleware.ts: const mvpNoAuth = process.env.MVP_NO_AUTH !== 'false';
- When undefined (not set or not inlined at build time) → undefined !== 'false' → true → OPEN insecure
- Next.js middleware env inlined at build time, if .env changes after build without rebuild, becomes undefined → fully open
- .env.example had MVP_NO_AUTH=true demo, docker-compose had ${MVP_NO_AUTH:-true} default true

**Fix:**
- Changed to const mvpNoAuth = process.env.MVP_NO_AUTH === 'true';
- Secure by default – only open when explicitly true
- Updated .env.example to MVP_NO_AUTH=false, docker-compose default false
- Added requireApiAuth helper in all APIs – checks session, returns 401 if not authenticated and MVP_NO_AUTH!=true
- UI: All APIs now secure, no mock fallback hiding auth

**Result:** Site secure by default, only open when MVP_NO_AUTH=true explicitly set.

---

## 6. Function Functionality (from FUNCTION_FUNCTIONALITY.md)

Full list – Enterprise S/4HANA – 57 routes:

**FOUNDATION – Enterprise Structure OX15→OX17:**
OX15 Define Company, OX02 Company Code T001, OX16 Assign Company to CC, OX10 Plant T001W, OX09 SLoc, OX08 Purch Org, OX18 Assign Plant to CC, OME4 Purch Group, OVX2 Sales Org, OVX1 Dist Channel, OVX2 Division

**Financial Config OB45/OB38/OB29/OB37/OBBO/OB52/OBBP:**
OB45 Credit Control Area, OB38 Assign CC to CCA, OB29 Fiscal Year Variant K4, OB37 Assign FYV to CC, OBBO Posting Period Variant, OB52 Open/Close Periods, OBBP Assign PPV to CC

**Chart OB13/OB62/OBD4/OB53/OBA7/FBN1/FS00/OBYC:**
OB13 Define Chart KSCA/INT/CAUS/GKR/YIN, OB62 Assign CC to CoA, OBD4 Account Groups KASS/KLIA/KREV/KEXP/KMAT/KREC/KTAX/KCSH, OB53 Retained Earnings 2500000001, OBA7 Document Types KR/KG/KZ/RE/WE/WA/SA, FBN1 Number Ranges 50-54 5000000000-5499999999, FS00 G/L Account Master 5000000001-5000000006 configurable secure delete, OBYC Auto Determination BSX/WRX/PRD/GBB/BSV

**PP – BOM, Work Centers, Routings, MRP, STO:**
CS01 Create BOM, CS02 Change, CS03 Display, CR01 Work Center Machine/Labor Capacity, CR02 Change, CR03 Display, CA01 Routing Sequence, CA02 Change, CA03 Display, MD01 MRP Run, MD04 Stock/Requirements List, ME27 STO, VL10B STO Delivery, VL01N Outbound Delivery B2B, VF01 Billing B2B AR

**Cost Centers & Tax & Payment:**
KS01 Create CC KS-CC-01..05, KS02 Change, KS03 Display, FTXP Tax Codes GST0/5/12/18/28 IGST, OB40 Tax GL, F-53 Vendor Payment KZ 53* 5300000000-, KZ Payment Doc Type, F110 Auto Payment, OY03 Currencies Only INR default, CUNI UoM KG/G/L/ML/PC/BOX/PACK/KIT/M/TON configurable dedicated page /foundation/uom, OMS2 Material Types ROH/HALB/FERT/HAWA/VERP/NLAG/DIEN configurable dedicated page

**MM – PR/PO/GR/IV:**
ME51N Create PR, ME52N Change, ME53N Display, ME21N Create PO 45*, ME22N Change, ME23N Display, MIGO GR 101/102 GI 261/262 50 WE/WA, MIRO IV 51 RE, MI01 Physical Inventory Doc, MI04 Enter Count, MI07 Post Differences

**SD:**
VA01 Create Sales Order, VA02 Change, VA03 Display, VL01N Delivery, VF01 Billing, Sales Issue Webhook /api/sales/issue with X-API-KEY

**HR:**
PA20 Display HR Master, PA30 Maintain HR Master, PC00 Payroll Run 300 KWD per employee basic_salary per employee never hardcoded

**System:**
SU01 User Maintenance, PFCG Role Maintenance, SM20 Audit Log, SBWP Workflow Inbox, ALB Document Flow, ME54N Release PR, ME28 Release PO, KSB1 Cost Center Actuals, CK40N Costing Run

Access via Dashboard /, Function Search Ctrl+K or /, Command Field Classic top gray bar, Sidebar /{companyCode}/..., Direct URL /{companyCode}/fico/company-master, Login /login enforced when MVP_NO_AUTH=false

---

## 7. Phase 1 Architecture Proposal (from docs/PHASE_1_ARCHITECTURE_PROPOSAL.md)

**Date:** Early phase, proposed modular monolith with layers:
- Layer 0 Foundation: Client, Company, Company Code, Plant, SLoc, Material, Batch, Number Ranges
- Layer 1 MM: PR to PO to GR to IV, ELIKZ, MAP landed
- Layer 2 PP: BOM, Work Center, Production Order, Kitting Stocked/Phantom
- Layer 3 SD: Sales Order B2B/B2C/POS Webhook, 601 GI, Revenue
- Layer 4 HR: Org Unit, Position, Employee, Payroll 300 KWD, FI
- Layer 5 FICO: GL, AP, AR, CCA, Product Costing, MAP
- Layer 6 Audit & Compliance: Document Flow, Audit Log WORM-lite

Tech: Next.js 14+ App Router, Drizzle ORM, Postgres, NextAuth, Tailwind, TanStack Table/Virtual, modular monolith with modules/foundation, modules/mm, modules/pp, modules/sd, modules/hr, modules/fico, shared/kernel/db, shared/ui

---

## 8. Phase 2 Acknowledgment – Partial GR & ELIKZ (from docs/PHASE_2_ACKNOWLEDGMENT.md)

**ERP ELIKZ Equivalent delivery_completed Indicator:**

Schema: mm_po_line.delivery_completed boolean default false, is_closed boolean, closed_reason varchar, closed_at, closed_by, Index idx_po_line_elikz

Service GoodsReceiptService:
- Partial GR Flow: PO Line ordered 20kg Chicken received 0 open 20 OPEN, GR1 Receive 18kg short-shipment postMovement 101 +18kg UNRESTRICTED quantity_received=18 open=2 PARTIAL FI Dr Inventory BSX 54 KWD Cr GR/IR WRX 54 KWD ACID, Receiver toggles ELIKZ final setDeliveryCompleted(poLineId, true, SHORT_SHIPMENT_FINAL) sets delivery_completed=true is_closed=true closed_reason, logs audit short_qty 2kg, prevents further GRs if is_closed or delivery_completed throw No further receipts allowed, clears open commitment, PO header status FULLY_RECEIVED if all lines closed else PARTIALLY_RECEIVED
- UI /erp/[companyCode]/mm/po shows ELIKZ toggle, partial GR history

Also implemented: Batch management with expiry BLOCK/WARNING/RESTRICTED_USE, landed cost relevance ALL/NONE/FREIGHT_ONLY, MAP valuation with freight/customs included, account assignment K cost center + GL 5000000001 BSX

---

## 9. Phase 2 Update – Kitting, Sales, Expiry, Landed Cost (from docs/PHASE_2_UPDATE.md)

**Raw Material Kitting – Both Modes:**

Stocked Kits Make-to-Stock K01/K02 Movements:
- Material Master flags is_kit=true is_phantom_kit=false expiry_control landed_cost_relevance
- BOM Header type=KITS_STOCKED is_kit=true expiry_rule=MIN_COMPONENTS|FIXED_DAYS|MANUAL
- Kitting Order Flow: Explode BOM FIFO by expiry from inv_stock, minExpiry=MIN(component batch expiries), new batch KIT-{timestamp} expiry=minExpiry or fixed days, K01 Issue components negative qty from unrestricted, K02 Receipt kit batch total cost=sum(component MAP costs), Create pp_production_order type=KITTING + pp_kitting_order link
- Tables pp_bom_header, pp_bom_line, pp_production_order, pp_kitting_order, pp_work_center, Service KittingService.createStockedKit()

Phantom Kits Make-to-Order Dynamic Explosion at 261:
- Material Master is_phantom_kit=true, BOM Line is_phantom_explode=true triggers recursive explosion
- Production Confirmation Flow: explodeBom() recursively resolves phantom kits circular detection via visited Set, Issue all leaf components via 261 GI FIFO, Receipt FG via 453 Yield, Scrap via 551, Record exploded components in pp_production_confirmation.exploded_components JSONB for audit
- Service KittingService.confirmProductionWithPhantomExplosion() + explodeBom()

Sales:
- POS Webhook /api/sales/issue with X-API-KEY, SERIALIZABLE transaction to prevent race on same batch, auto 601 GI + FI Dr Cash / Cr Revenue immediate
- B2B Sales Order VA01 with partners WE ship_to, RE bill_to, RG payer, shipping_point, delivery_priority, etc.

Expiry:
- inv_stock batch_number, expiry_date, expiry_control BLOCK/WARNING/RESTRICTED_USE, check at GR and GI

Landed Cost:
- mm_po_line freight_per_unit FRB1, customs_per_unit ZCUS, total_per_unit MAP, include_in_valuation boolean, MAP recalc (old_qty*old_price + new_qty*(price+freight+customs))/total_qty

---

## 10. Phase 3 Acknowledgment – Payroll FI Integration & CCA (from docs/PHASE_3_ACKNOWLEDGMENT.md)

**Date:** 2026-09-28, Implemented Built Ready VPS Build PASS 12 routes

**Payroll FI Document Generation:**

Test Seed: 12 employees across 3 cost centers CC-KITCHEN-01 Main Kitchen 5 employees Head Chef+4 Cooks, CC-SALES-01 Sales 4 employees Sales Manager+3 Cashiers, CC-ADMIN-01 Administration 3 employees Owner+2 Admin, Each basic_salary=300 KWD exactly per requirement, Payroll Run 2026-09 DRAFT 12×300=3600 KWD total, Cost center strictly assigned per employee via hr_employee.cost_center_id

Service PayrollService in modules/hr/application/payrollService.ts:
- createPayrollRun(): Creates run DRAFT period_year/month company_code_id, fetches active employees with cost_center_id, creates lines basic_salary 300 KWD each, total_gross=total_net=3600 KWD Ready for approval
- approveAndPostFi(): Auto FI Generation Upon Approval: For each employee line, creates fi_document header doc_type HR, posting_date, company_code_id, total, lines: Dr Salary Expense 5000000001? Actually 500000 Salary Expense with cost_center_id, Cr Salaries Payable 210001, plus approval authority check, dual approval for payroll, audit log
- Payment Clearing: Dr Salaries Payable / Cr Bank 100010 / Cash 100010 – via /api/payroll/clearing

CCA Report:
- CostCenterReportService aggregates 3 sources UNION ALL: COGS MM/POS COGS movement 601 GBB account 300000/300001 fi_document_line cost_center_id doc_type RV/WE, Payroll HR Payroll Runs 300 KWD per employee mapped to department/cost center gl 500000 Salary Expense doc_type HR, Direct FI/AP Direct FI postings overhead/utilities outside MM gl expense type not COGS/Payroll doc_type SA, AP Invoices overhead posted directly against cost center doc_type RE
- Query GROUP BY cost_center_id, gl_account_id, period, hierarchical transform CC→GL, periodFiltering WHERE EXTRACT YEAR/MONTH FROM posting_date, hierarchicalGrouping Cost Center header row with +/− toggle GL children indented, virtualized flatRows
- UI VirtualDataGrid @tanstack/react-virtual + @tanstack/react-table 5 CC 6 GL 600+ tx aggregated, /api/cca-report

---

## 11. Phase 4 Acknowledgment – Physical Inventory & Product Cost Controlling (from docs/PHASE_4_ACKNOWLEDGMENT.md)

**Date:** 2026-09-28, Implemented Built Ready VPS Build PASS 14 routes

**Physical Inventory Documents PID:**

Schema physicalInventorySchema.ts:
- pi_document pi_number PI number range, company_code_id, plant_id, sloc_id, status CREATED/COUNT_ENTERED/POSTED/CANCELLED, posting_date, planned_count_date, header_text, is_blocking_active boolean default true, totals total_lines counted_lines total_system_qty total_counted_qty total_variance_qty total_variance_value fi_document_id created_by
- pi_line pi_document_id line_number material_id batch_id batch_number stock_status system_qty snapshot at creation system_value unit_cost MAP at creation counted_qty user entered variance_qty=counted-system variance_value=variance×MAP status PENDING/COUNTED/POSTED/BLOCKED is_counted stock_ledger_id expiry_date
- pi_count_entry Audit trail counts pi_line_id counted_qty counted_by counted_at notes
- Number Ranges Added PI and COSTING_RUN to nr_object_type enum seeded PI 1000000000-1999999999 COST 100000-999999
- GL Accounts Added 500005 Inventory Loss / Shrinkage Expense and 400002 Inventory Gain Revenue for variance posting

Service PhysicalInventoryService:
- createPid(): Generates pi_number PI{timestamp}, creates pi_document status CREATED is_blocking_active=true, gets system stock from inv_stock for plant+sloc (and materialIds if filtered) where quantity>0, for each stock creates pi_line system_qty=stock.quantity system_value=qty×MAP unit_cost=MAP moving_avg_price or standard_price expiry_date status PENDING, updates pi_document total_lines total_system_qty, Message PID created with X lines blocking active for 101/261/601 on SLoc
- Blocking Logic Prevent Moving-Target Counts: isMovementBlocked(tx, materialId, plantId, slocId, movementType): Only blocks 101 GR, 261 GI prod, 601 GI sales, K01/K02, 453, 551, Query SELECT d.id d.pi_number FROM pi_document d JOIN pi_line l WHERE d.plant_id=X AND d.sloc_id=Y AND status IN CREATED COUNT_ENTERED AND is_blocking_active=true AND l.material_id=Z LIMIT 1, returns blocking doc if exists, prevents movement if blocked
- enterCount(): For each line counted_qty, creates pi_count_entry audit, updates pi_line counted_qty variance_qty variance_value status COUNTED is_counted true, updates pi_document counted_lines total_counted_qty
- postDifferences(): For each line with variance, creates fi_document variance posting Dr/Cr Inventory Loss/Gain vs Stock, updates pi_line status POSTED, pi_document status POSTED is_blocking_active=false fi_document_id, message Posted with variance value

**Product Cost Controlling CO-PC:**

Schema costingRunSchema.ts:
- costing_run run_number, company_code_id, plant_id, costing_variant, status CREATED/RUNNING/COMPLETED/ERROR, total_materials, costed_materials, total_cost, created_by
- costing_run_line costing_run_id material_id plant_id quantity bom_id routing_id total_cost material_cost labor_cost overhead_cost status, cost_components JSONB
- work_center_formula formula for labor/machine/overhead rates

Service CostingRunService:
- runCosting(): For each FERT material with active BOM, explode BOM recursively phantom, get current MAP of ROH components, sum material_cost = Σ qty×MAP, get routing for material plant, for each operation work_center_id duration labor_rate machine_rate overhead_group overhead_rate, calculate labor_cost = duration×labor_rate, overhead_cost = labor_cost×overhead_rate, total_cost = material_cost+labor_cost+overhead_cost, update costing_run_line total_cost cost_components, update material master standard_price = total_cost/quantity, message Costing run completed with X materials costed

UI:
- /pp/bom, /pp/work-centers, /pp/routings, /pp/mrp, /mm/physical-inventory with blocking indicator, /fico/costing-run

---

## 12. First User & KS01 Implementation Guide (from docs/FIRST_USER.md & KS01_IMPLEMENTATION_GUIDE.md)

**First User:**
- ADMIN_EMAIL / ADMIN_PASSWORD from .env creates first user via AUTO_MIGRATE=true seed.ts
- No default creds in UI – only .env
- First user can create company, company code, plant, etc from scratch
- After first user, create additional users via /foundation/users – only ADMIN/OWNER/HR/MANAGER can create users (checked via auth_user.role OR ent_user_role)
- My Profile /foundation/user-profile shows own profile, change password via POST /api/auth/change-password currentPassword newPassword
- ADMIN can reset others via Users page Reset Password userId newPassword

**KS01 Implementation Guide – Kerala Spices:**
- Company: Kerala Spices & Exports Pvt Ltd, Code KS01, Currency INR, City Palakkad, GST 32AABCK1234M1Z5, PAN AABCK1234M, CIN U15400KL2024PTC012345, Address Plot 45 Industrial Estate Kalmandapam 678001
- Company Code: KS01, Name Kerala Spices, Company KS01, Currency INR, Chart KSCA, FY Variant K4 April-March, Posting Period Variant KS01, Credit Control Area KS01
- Plant: KP01 Kerala Plant, Company KS01, City Palakkad, Purch Org KPO1, Sales Org KSO1
- SLocs: 0001 Main Store, 0002 Raw, 0003 FG
- Purch Org: KPO1, Purch Group: K01, Sales Org: KSO1, Dist Channel K1, Division K1
- Chart: KSCA Kerala Spices Chart, Account Groups KASS/KLIA/KREV/KEXP/KMAT/KREC/KTAX/KCSH, G/Ls 5000000001 Raw Stock KMAT BSX, 5000000002 FG Stock, 5000000003 GR/IR WRX, 5000000004 Transit BSV, 5000000005 Price Diff PRD, 5000000006 Consumption GBB, 2000000000 Vendor Recon K, 1000000000 Customer Recon D, 8000000001 Bank SBI, 2500000001 Retained Earnings OB53
- Cost Centers: KS-CC-01 Production, KS-CC-02 QC, KS-CC-03 Sales, KS-CC-04 Admin, KS-CC-05 Purchasing – each valid from 2024-04-01, group KS01
- Tax Codes: V0 0% Input, V5 5% VAT, A0 0% Output, A5 5% Output, GST0 0%, GST5 5% Spices VAT5 equivalent, GST12 12%, GST18 18%, GST28 28%, IGST0 0%, IGST5 5%, IGST18 18% – GL 130000 Input Tax, 220000 Output Tax, 7000000000 CGST
- Materials: ROH Black Pepper Raw 100 INR/KG ROH TP01, HALB Spice Mix Intermediate, FERT Pepper Powder 100g 150 INR, HAWA Trading, VERP Packaging, NLAG Non-Stock
- Vendors: V-001 Malabar Wayanad, Customers: C-001 Kochi Exports
- PR 1000000001, PO 4500000001, GR 5000000001/02, IV 5100000001, Payment 5300000001 53*, Sales 6000000001, Delivery VL01N, Billing VF01, Payroll 300 KWD per employee, CCA KSB1, Costing CK40N, Audit ALB SM20, Workflow SBWP

---

## 13. Layer 0 ERD (from docs/LAYER_0_ERD.md)

**Tables:**
- ent_client: id, code, name
- ent_company: id, code, name, country, currency, city, street, postal_code, region, language
- ent_company_code: id, code, name, company_id, city, country, currency_code FK ent_currency code, coa_id FK fi_chart_of_accounts, fiscal_year_variant, posting_period_variant, credit_control_area, gst_number, pan, cin, address, plant_count
- ent_plant: id, code, name, company_code_id, city, country, region, purchasing_org_id, sales_org_id
- ent_storage_location: id, code, plant_id, name, description
- ent_purchasing_org: id, code, name, company_code_id
- ent_purchasing_group: id, code, name, description
- ent_sales_org: id, code, name, company_code_id, distribution_channel, division
- ent_currency: id, code UNIQUE, name, decimal_places, symbol, is_active, created_at – Only INR default seeded, KWD added by user
- ent_material_type: id, code UNIQUE, name, description, is_active, created_at – ROH/HALB/FERT/HAWA/VERP/NLAG/DIEN configurable
- ent_uom: id, code UNIQUE, name, dimension, is_active, created_at – KG/G/L/ML/PC/BOX/PACK/KIT/M/TON configurable – dedicated CUNI page /foundation/uom
- ent_material_master: id, material_number UNIQUE, description, description_long, type FK ent_material_type code, base_uom FK ent_uom code, group_code, shelf_life_days, expiry_control BLOCK/WARNING/RESTRICTED_USE, is_kit, is_phantom_kit, valuation_class, is_hazardous, is_batch_managed, landed_cost_relevance ALL/NONE/FREIGHT_ONLY, sales_org, distribution_channel, division, sales_uom, tax_classification, account_assignment_group, item_category_group, purchasing_group, purchasing_org, mrp_type PD/ND/VB/VM, mrp_controller, lot_size EX/FX/HB, procurement_type F/E/X, special_procurement, safety_stock, reorder_point, plant_id, sloc_id, qm_active, price_control V/S, moving_avg_price VERPR MAP, standard_price STPRS, price_unit PEINH, costing_lot_size LOSGR, overhead_group, cost_center KOSTL, profit_center PRCTR, weight, weight_unit, volume, volume_unit, ean, is_active, created_at
- inv_stock: id, material_id, plant_id, sloc_id, batch_number, quantity, stock_status UNRESTRICTED/IN_TRANSIT/BLOCKED, expiry_date, moving_avg_price
- fi_chart_of_accounts: id, code UNIQUE, name, description
- fi_account_group: id, code UNIQUE, name, description, coa_id, from_account, to_account
- fi_gl_account: id, coa_id, account_number, name, account_type ASSET/LIABILITY/REVENUE/EXPENSE, is_balance_sheet, is_reconciliation, is_tax_relevant, is_blocked, account_group
- fi_cost_center: id, code UNIQUE, name, company_code_id, is_active, valid_from, valid_to – edit/delete secure checks hr_employee + fi_document_line soft is_active=false if transactions
- fi_tax_code: id, code UNIQUE, description, rate, type INPUT/OUTPUT, is_active, gl_account_id
- fi_document: id, document_number UNIQUE, doc_type KR/KG/KZ/RE/WE/WA/SA/RV/HR, company_code_id, posting_date, fiscal_year, fiscal_period, reference_doc_number, reference_doc_type PR/PO/GR/IV/SO/DO/BILL/PAYROLL, header_text, total_debit, total_credit, currency, status, created_by
- fi_document_line: id, fi_document_id, line_number, gl_account_id, cost_center_id, tax_code_id, material_id, plant_id, amount, debit_credit D/C, text, quantity, uom
- fi_auto_account_determination: id, company_code_id, transaction_key BSX/WRX/PRD/GBB/BSV/FRE/ZOL, valuation_class, gl_account_id, description
- fi_posting_period_variant: id, code UNIQUE, name, created_at – OBBO
- fi_posting_period: id, variant_code FK, account_type +/A/D/K/M/S, from_period/from_year to_period/to_year, from_period2/from_year2 to_period2/to_year2 – OB52
- hr_employee: id, employee_number UNIQUE, first_name, last_name, company_code_id, plant_id, position_id, cost_center_id, basic_salary per employee never hardcoded, is_active
- audit_log: id, table_name, record_id, action INSERT/UPDATE/DELETE, user_id, timestamp, old_values JSONB, new_values JSONB, changed_fields array, transaction_id, description – WORM-lite append-only

**Relationships:** Company 1→N Company Code 1→N Plant 1→N SLoc, Company Code 1→N Cost Center, CoA 1→N GL Account, Material 1→N Stock, Cost Center 1→N Employee, Cost Center 1→N FI Document Line, etc.

---

## 14. Full Guide & Implementation Guide (from full_guide.txt & implementation_guide.txt)

**Fictional Company:** Kerala Spices & Exports Pvt Ltd, Location Palakkad Kerala 678001 India

**Company Master Data:** Company Name Kerala Spices & Exports Pvt Ltd, Short Name KSPL, Address Plot 45 Industrial Estate Kalmandapam, City Palakkad, District Palakkad, State Kerala, PIN 678001, Country IN, Currency INR, Language EN, GST 32AABCK1234M1Z5, PAN AABCK1234M, CIN U15400KL2024PTC012345, Phone +91-491-2555001

**Enterprise Structure:** Company Code KS01, Plant KP01, SLocs 0001 Main, 0002 Raw, 0003 FG, Purch Org KPO1, Purch Group K01, Sales Org KSO1, Dist Channel K1, Division K1

**Financial Config:** Chart KSCA, Account Groups KASS Assets 1000000000-1999999999, KLIA Liabilities 2000000000-2999999999, KREV Revenue 3000000000-3999999999, KEXP Expenses 4000000000-4999999999, KMAT Material Stock 5000000000-5999999999 5000000001 ROH 5000000002 FERT 5000000003 GR/IR WRX, KREC Recon 6000000000-6999999999, KTAX Tax 7000000000-7999999999, KCSH Cash 8000000000-8999999999, Retained Earnings 2500000001 OB53, Document Types KR Vendor Invoice 51 5100000000-5199999999, KG Credit Memo 52, KZ Payment 53 5300000000-5399999999, RE Invoice Gross 51, WE GR 50 5000000000-5099999999, WA GI 50, SA G/L 54 5400000000-5499999999, RV Billing, PR Payroll, Number Ranges 50-54, Auto Posting OBYC BSX Inventory Posting WRX GR/IR PRD Price Diff GBB Consumption BSV Transit FRE Freight ZOL Customs

**Master Data:** Materials ROH Raw Black Pepper Raw valuation BSX 5000000001, HALB Semi-Finished Spice Mix Intermediate, FERT Finished Pepper Powder 100g valuation BSX 5000000002, Vendors, Customers, etc.

**Transactional Processing:** PR ME51N, PO ME21N, GR MIGO 101, IV MIRO, Payment F-53 KZ, Sales VA01, Delivery VL01N, Billing VF01, Payroll PC00, etc.

---

## 15. Recent UI Fixes (v3.0) – From Cost Centers to All Masters

**Cost Centers CC-KITCHEN-01 Example:**
- Before: **CC-KITCHEN-01** Active Main Kitchen Company: 1000 • Employees: 0 • Postings: 0 Edit – KS02 Delete – Secure – Blocked if has employees/postings Restriction: If has employees or FI postings → soft is_active=false not hard delete – same as GL/materials – security on cost center – text too much on buttons and again explained on bottom – redundant
- After: **CC-KITCHEN-01** Active Main Kitchen Company: 1000 • 0 employees • 0 postings Edit Delete – clean, buttons only Edit/Delete, no redundant bottom text, error shown only when delete blocked: `Cannot delete – cost center CC-KITCHEN-01 has 1 employees and 2 postings and cannot be deleted to maintain audit trail. Deactivated instead.`

**Similar cleaned across all masters:**
- Currencies OY03: Delete – Secure → Delete, Create Currency – OY03 – Only INR default... → Create, confirm simplified Delete currency KWD?
- Material Types OMS2: Delete – Secure – Blocked if has materials → Delete, + Create Material Type OMS2 → + Create, bottom ERP explanation box removed
- G/L FS00: Edit Selected (FS00) → Edit, Delete (secure) → Delete, blue Configurable box removed, API doc line removed
- Tax Codes FTXP: Delete (secure – blocked if FI postings) → Delete, + Create Tax Code (FTXP) → + Create, blue VAT box removed, subtitle simplified
- Chart OB13: Confirms Delete CoA X? Blocked... → Delete CoA X?, blue Function Mapping box removed, subtitle simplified
- Materials MM01: Delete Selected – Secure → Delete, Delete (secure) → Delete, + New Material MM01 → + New Material, confirm simplified Delete material MAT-...?
- Posting Period OBBO: Delete – Secure → Delete
- Account Groups OBD4: Error has G/L accounts – delete G/Ls first → Cannot delete – account group X has Y G/L accounts and cannot be deleted to maintain audit trail.
- All APIs updated: gl-accounts, currencies, material-types, tax-codes, materials, account-groups, chart-of-accounts, cost-centers, uom – all return Cannot delete – ... has ... and cannot be deleted to maintain audit trail. Deactivated instead. with code HAS_TRANSACTIONS and 400, UI reloads even on error to show Inactive

**Header:**
- Before: Separate black pill email + hamburger ☰ button for dropdown, full email shown, hover not working
- After: Username itself is dropdown button with avatar + username (email prefix if no username) + ▼, shows username not full email, hover group-hover:block works, dropdown shows display name, email small, role badge, My Profile, Users, Roles, Sign Out with hover:bg-zinc-900 hover:text-white visible, same fix on home page client-page.tsx, sidebar shows username prefix

**Function Palette:**
- Before: Selected bg-zinc-900 text-white hover:bg-zinc-50 → on hover bg white text white invisible
- After: Selected bg-zinc-900 text-white hover:bg-black hover:text-white, unselected bg-white text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900 visible, onMouseEnter updates selectedIndex

**CUNI:**
- Before: CUNI shows MM01 not uom configure – NAV href /foundation/materials, lib/function codes route /foundation/materials
- After: Dedicated CUNI page /foundation/uom with create/delete, NAV href /foundation/uom, lib/function codes route /1000/foundation/uom, API DELETE audit trail error

**Side Panel:**
- Collapsible sections with ▶/▼ persisted localStorage erp-nav-collapsed-groups toggleGroup, view preference localStorage erp-home-view single view only, hover fix selected bg-zinc-900 hover:bg-black visible, home cleaned neutral text

---

## 16. Current Build & Routes

**Build:** Next.js 16.3.6 Turbopack, 57+ routes PASS (now 58 with /foundation/uom)

Routes:
- / , /login, /_not-found
- /[companyCode]/audit/document-flow, /audit/logs
- /[companyCode]/fico/cca-report, /chart-of-accounts, /company-master, /cost-centers, /costing-run, /currencies OY03, /gl-accounts FS00, /payment F-53, /posting-period OBBO/OB52, /tax-codes FTXP
- /[companyCode]/foundation/enterprise-config, /enterprise-structure, /material-types OMS2, /materials MM01, /uom CUNI (NEW), /roles, /stock MMBE, /user-profile, /users
- /[companyCode]/hr/employees, /payroll PC00
- /[companyCode]/mm/gr MIGO, /iv MIRO, /physical-inventory MI01, /po ME21N, /pr ME51N, /sto ME27
- /[companyCode]/pp/bom CS01, /kitting, /mrp MD01/MD04, /routings CA01, /work-centers CR01
- /[companyCode]/sales VA01, /sd/billing VF01, /delivery VL01N, /workflow/inbox SBWP
- /api/* – all 40+ APIs with function code field, secure auth, audit trail deletes

---

## 17. How to Use This Condensed File

This file is the **single source of truth for historical reports** – all previous individual report files have been deleted after condensing.

Keep only:
- README.md – project overview
- ERP_USER_MANUAL.md – full guided walkthrough v3.0 (main manual)
- LICENSE
- This file – docs/COMPREHENSIVE_PROJECT_SUMMARY.md – condensed history
- Source code in src/

Delete:
- E2E_VALIDATION_REPORT.md
- ENTERPRISE_HARDENING_REPORT.md
- PHASE_7_REMEDIATION_REPORT.md
- SECURITY_FIX_REPORT.md
- FUNCTION_FUNCTIONALITY.md
- docs/FIRST_USER.md, KS01_IMPLEMENTATION_GUIDE.md, LAYER_0_ERD.md, PHASE_1_ARCHITECTURE_PROPOSAL.md, PHASE_2_ACKNOWLEDGMENT.md, PHASE_2_UPDATE.md, PHASE_3_ACKNOWLEDGMENT.md, PHASE_4_ACKNOWLEDGMENT.md, FUNCTION_ENFORCEMENT.md (now included above)
- full_guide.txt, implementation_guide.txt, test_e2e_full_flow.ts (test script – logic summarized above)

**End of Condensed Documentation**
