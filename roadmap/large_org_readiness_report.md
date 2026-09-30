# Large Organisation Readiness Report – Multi-Sector, Multi-Plant, Multi-Product + Services, 1000s Employees

**Date:** 2026-09-30
**System:** ERP Modular Monolith – Own IP Codes – Industry Standard
**Aim:** Make system suitable for large organisation working in multiple sectors, each sector has multiple plants, each plant has multiple products and sometimes services, employees in range of thousands

---

## Executive Summary

**Overall Readiness: ~50-60% for core ERP, ~30-40% for large org scale**

- **Foundation + Number Ranges + Auto Account + Movement + Revenue + Exchange Rates – T0 BLOCKING:** 75-90% – almost full parity – own codes primary (FMTM alias OMJJ, FRAD alias VKOA, FFSG alias OBC5, FFSV alias OBC4/FSSV, FBJM alias SM37, FELM alias SM12, FNRC alias FBN1, FEXC alias OB08, FAUC alias OBYC, FPPE alias OB52) – SAP codes only as aliases – legal-safe own IP – pgbouncer 6432 pooling MAX_CLIENT_CONN 1000 DEFAULT_POOL_SIZE 25, dragonfly 6379 cache 256mb with invalidation, background jobs FBJM with queue and no timeout and auto-promote after 10 sec for ALL processes, locks FELM with 5 min expiry + heartbeat
- **MM Core (PR→PO→GR→IV + Stock + PI):** 60-65% – basic chain works – ELIKZ, MAP, BSX/WRX/GBB/PRD/BSV, posting period, stock ledger, universal ledger
- **PP Core (BOM/WC/Routing/Order/Kitting + Confirmation):** 55% – basic order + kitting + GI 261 + GR 101
- **SD Core (SO→Delivery→Billing + Revenue):** 50% – basic flow + FRAD revenue
- **FICO Prerequisites:** 70% – Chart, Field Status, Fiscal, Posting Period, GL – must exist before ELEC
- **HR (Org/Employee/Payroll):** 40% – basic org + payroll background job for 1000s
- **System (Jobs/Locks/Cache/Pooling):** 80% – own implementation with auto-promote + popup + redirect + 5 min expiry – better UX than industry standard for long processes

**Enough for small production company (biscuits, spices) – foundation + MM + SD + FICO basics work – advanced features (pricing, MRP detailed, WM, QM, asset accounting, detailed costing, credit management, inter-company, services) still missing for large org.**

---

## 1. Multi-Sector – Current Readiness 40%

### Large Org Requirement
Group like Kerala Spices Ltd has sectors: Spices, Food Processing, Trading, Services – each sector has multiple plants, each plant has multiple products/services – need sector-wise reporting, profit center, business area, company code grouping, consolidation, transfer pricing

### Our System – Implemented
- **Company Groups ECGC** – own IP – e.g., KSPL Group – can represent holding/group – sector grouping via company groups – route /foundation/company-groups
- **Legal Entities ELEC** – e.g., KSPL Spices Pvt Ltd, KSPL Foods Pvt Ltd – each sector can be legal entity – own IP – must have Field Status Variant FFSV-1000, Fiscal Calendar FFYC K4 April-March, Posting Period Variant FPPC PPV-1000, Chart of Accounts FCOA CA-IN-01, Credit Control Area FCPC CRED-1000 – T0 BLOCKING – ready
- **Company Codes ECOC** – e.g., 1000 Spices, 1100 Foods, 1200 Trading, 1300 Services – each sector can be company code – with chart, fiscal variant, posting period variant, field status variant – ready
- **Business Area / Profit Center** – we have profit centers, cost centers CCUC own IP alias KS01/KS02/KS03 – can be used for sector reporting – e.g., Profit Center SP01 Spices, FP01 Foods – cost center allocation – partially ready
- **Commercial Orgs ECOC** – sales org, distribution channel – for sector-wise sales – partially implemented
- **Enterprise Config** – assignments – company code to credit control area, controlling area – partially

### Gaps for Large Org Multi-Sector
- Missing: Business Area assignment to company code, sector-wise financial statements, inter-company postings between sectors (company codes), transfer pricing, segment reporting, consolidation
- Need to implement: Business Area field to company code and profit center, Segment, Inter-company STO PSTD (Stock Transport Order), Inter-company billing, Inter-company clearing accounts
- Currently single company code flow works, multi-company code with inter-company not fully tested – need to add company code assignment to credit control area FCPC, controlling area, and inter-company clearing

### Readiness: 40% – basic sector grouping via company groups/legal entities/company codes works, but inter-company and consolidation missing

---

## 2. Multi-Plant – Current Readiness 75% – Good for Large Org

### Requirement
Each sector has multiple plants – e.g., Spices sector has Plant 1000 Palakkad, 1100 Kochi, 1200 Bangalore – each plant has multiple storage locations, production lines, warehouses

### Our System – Implemented
- **Plants EFCC** – own IP – e.g., 1000 Palakkad, 1100 Kochi – with address, GST, plant type – ready – /foundation/plants
- **Facilities/Warehouse Sites EWHC/EWSC** – own IP – e.g., WH01 Raw, WH02 Finished, WH03 Trading – each plant can have multiple facilities – ready
- **Storage Locations** – within plant – e.g., 1000/1100/1200 – ready
- **Material Master EMTC** – 6 tabs Basic/Purchasing/MRP/Storage/Accounting/Costing – single source – auto number via assignment MAT-RAW-01 10000-19999 RAW, MAT-FG-01 20000-29999 FINISHED – 5-12 digit configurable – usage % warning 80% amber 90% red – locked badge when used – cache dragonfly + pgbouncer – multi-plant create – `facility_codes` and `plant_codes` arrays – create product in multiple plants at once – facility profiles MMSC – e.g., Product 10001 created in Plant 1000 and 1100 with different MRP views – ready – T0 BLOCKING valuation_class → BSX via FAUC OBYC – industry standard
- **MRP per plant** – planning_type, planning_controller, lot_sizing, safety_stock, reorder_point per plant – MRP run MMRP MD01 – partially ready – background job queue FBJM own IP alias SM37
- **Stock Overview ISTV** – plant-wise stock – stock ledger – universal ledger – ready
- **Movement Types FMTM** – own IP alias OMJJ – 101 GR per plant, 261 GI per plant, 601 PGI per plant – stock +/- per plant – ready – defines stock +/- value +/- account modifier BSX/WRX/GBB/PRD/BSV – used in GR, GI, PGI, PI
- **Auto Account FAUC** – own IP alias OBYC – BSX inventory, WRX GR/IR, GBB offsetting COGS, PRD price diff, BSV PI diff – transaction_key determines GL – valuation_class → BSX

### Gaps
- Missing: Plant assignments to company code enforcement, MRP areas, production versions, capacity per plant, warehouse management WM with bins, quality management QM per plant, batch determination per plant, serial numbers
- For large org with 10 plants, current multi-plant create works, but advanced plant-specific procurement (special procurement method) and inter-plant STO needs more testing

### Readiness: 75% – multi-plant foundation good, supports 10 plants, each multiple facilities

---

## 3. Multi-Product + Services – Current Readiness 70% Products, 30% Services

### Requirement
Each plant has multiple products – e.g., Plant 1000 has 100 spices SKUs, Plant 1100 has 50 food SKUs – plus services like packaging service, logistics service, consulting – need product hierarchy, BOM, kitting, service master

### Our System – Implemented – Products
- **Product Master EMTC** – 6 tabs – Basic Data (client level – code, name, type, UoM, category, barcode, HSN – single source), Purchasing (plant level – buyer group, procurement division, QM active), MRP (MRP type, controller, lot sizing, safety stock, reorder point, procurement), Storage (facility extension MMSC + Kit & Lot/Batch & Expiry – all storage-related – single source – per user request Kit & Lot moved to Storage), Accounting (valuation_class BSX/WRX, price control MAP/Standard, price unit – T0 BLOCKING), Costing (costing lot size, overhead group – CK40N)
- **Auto Number** – PRODUCT_CODE optional – leave blank for auto-number from MAT-01 / ITEM range (e.g., MAT-100001) industry standard SNRO/FBN1 – or enter manual FG-001 – system generates purely numeric via number range MAT-01/ITEM – blocked manual random 10 digits like 1234567890 – per user selection block_manual – always auto numeric only – no random entry allowed
- **Assignment Table** – core_number_range_assignment – explicit XYZ to material, YZX to PO – industry standard – e.g., ITEM RAW→MAT-RAW-01 10000-19999 (5-digit), ITEM FINISHED→MAT-FG-01 20000-29999, PO 1000→PO-01 4500000000-4599999999 – via assignment_key lookup in next API – exhaustion error_and_extend – if range exhausted error, admin must extend to_number or create new range and update assignment – no auto fallback
- **Product Types EMTP** – RAW, FINISHED, SEMI, TRADING, PACKAGING, CONSUMABLE, SERVICE – RAW/FINISHED/SEMI – own IP alias OMS2 – ROH/FERT/HALB – ready
- **Product Categories EMGC** – spices, oils, packs – hierarchy – own IP alias OMSF – ready
- **UOM EUOC** – KG/L/PC/BOX – core_unit_measure – own IP alias CUNI – ready
- **Lots ELTC** – batch/expiry – inv_lot lot_number expiry_date – own IP alias MSC3N – ready
- **BOM MBMC** – Bill of Materials – raw → finished – e.g., Finished 20001 has components Raw 10001 2kg + Pack 10002 1pc – multi-level – ready
- **Kitting MKTC** – K01/K02 stocked kits – e.g., gift pack – raw component bundling – ready
- **Search** – DB ILIKE currently – works for 1000s – meilisearch planned after debug for 10k+ SKUs – fast search

### Services – Gap
- Currently service master not fully separate – we use material type SERVICE but still creates inventory views – need to create service master with no inventory, only sales and accounting
- **Proposed Service Master:** Service 90001 Packing Service – no stock, only revenue GL via FRAD own IP alias VKOA – billing SBLC posts Dr AR Cr Revenue KOFI/KOFK – no GR – need to add service flag `is_service=true` and skip stock postings – skip stock ledger, only universal ledger revenue – add service category
- **Large org with 10k SKUs:** Our system with dragonfly cache for materials + pgbouncer pooling + pagination + search – can handle 10k SKUs – but need meilisearch for fast search (planned after debug) – current ILIKE works for 1000s but slow for 10k+ – need to add after business logic debug

### Readiness: 70% products – good, 30% services – needs service flag

---

## 4. Employees Thousands – Current Readiness 50%

### Requirement
1000s employees across sectors/plants – org structure, positions, payroll monthly, postings to FI, payslips, compliance, PF/ESI, tax

### Our System – Implemented
- **Org Units HHEC** – e.g., SP01 Spices Org, FD01 Foods Org – hierarchy – own IP – ready
- **Positions HHEV** – e.g., Manager, Operator – per org unit – ready
- **Employees** – employee master with org assignment, position, plant, company code – ready – can handle thousands – DB with indexes – table core_employee
- **Payroll HPYC** – payroll 1000 employees – background job FBJM own IP alias SM37 – auto-promote after 10 sec for ALL processes – first 10 sec direct with spinner timer, if >10 sec auto-moves to background – popup shows steps – user can close → redirect to last page as usual – job continues – header Jobs icon FBJM shows running/queued – no timeout – even minutes – queue if system busy – lock prevents double payroll for same period – System Jobs page FBJM shows progress per employee 500/1000 – 60% – if hung, progress stuck >5 min shows warning – can cancel – System Locks FELM own IP alias SM12 shows payroll lock – 5 min expiry + heartbeat – pgbouncer 6432 pooling MAX_CLIENT_CONN 1000 DEFAULT_POOL_SIZE 25 prevents too many connections – dragonfly 6379 cache 256mb for employee data – ready for thousands – table core_background_job with job_type PAYROLL_RUN, status QUEUED/RUNNING/COMPLETED/FAILED, progress 0-100, current_step/total_steps, step_description, steps jsonb, payload, result, error
- **Payroll Flow:** Validating payroll period and posting period → Checking number range assignments → Loading employee data → Processing employees (employee 1/1000, 2/1000…) → Calculating taxes and deductions → Posting to universal ledger → Generating payslips → Completed – progress updates every 100 employees – 10ms per employee = 10 sec for 1000 employees – can be minutes with real logic – no server timeout – industry standard queue – if RUNNING exists, new jobs stay QUEUED and start after completion
- **Posting to FI:** Payroll postings to universal ledger – BSX/WRX etc. – cost center allocation – partially ready

### Gaps for Large Org
- Missing: Time management, shift planning, benefits, loans, garnishment, detailed payroll schema with wage types, tax slabs, PF/ESI, compliance, posting to FI detailed with cost center allocation, payslip generation with PDF, employee self-service, recruitment, performance, org management detailed
- Need to optimize payroll to handle 5000 employees – current 10ms per employee = 50 sec for 5000 – need to optimize with bulk posting – background job handles no timeout, but need to test with 5000
- Need to scale payroll to handle multiple company codes, multiple payroll areas, retroactive accounting

### Readiness: 50% – payroll background job ready for thousands, but HR detailed missing

---

## 5. Industry Professional Flows – Ready for Use

### Flow 1 – Procure to Pay (P2P) – 65% Ready – Professional Use

**Steps:**
1. **PR PPRC** – Purchase Requisition – e.g., Plant 1000 needs 100kg Raw Spice – create PR – auto number PR 1000000000 via assignment – company_code 1000 – facility – account assignment – release via workflow FWFL inbox PPRL – own IP alias ME51N
2. **PO PPOC** – Purchase Order – convert PR→PO – auto number PO 4500000000 via assignment 1000→PO-01 – vendor from partner EPAC role VENDOR – info record – buyer group – plant 1000 – facility – pricing – release via PPOR alias ME28 – document flow AFLW – background job auto-promote after 10 sec if large PO 20 lines – lock PO when GR background – double-entry protection FELM – pgbouncer + dragonfly – own IP alias ME21N
3. **GR IGRC** – Goods Receipt 101 – MIGO – auto number GR 5000000000 via assignment – movement type FMTM own IP alias OMJJ 101 stock+ value+ BSX/WRX – auto account FAUC own IP alias OBYC BSX inventory Dr, WRX GR/IR Cr – valuation_class from material EMTC determines GL via OBYC – MAP recalc – stock ledger + universal ledger – posting period FPPE own IP alias OB52 check – ELIKZ – stock overview ISTV – background job FBJM auto-promote after 10 sec for large GR 20 lines – popup shows steps Validating → Assignment → Generating number → Creating → Posting → Completed – user can close → redirect to last page – job continues – header FBJM icon shows running/queued – no timeout – System Jobs FBJM – lock PO 4500000001 when GR background – other users locked out – 423 Locked – try after completion or 5 min – FELM – industry standard
4. **IV PIVC** – Invoice Verification MIRO – GR/IR clearing WRX – price diff PRD – KDM exchange diff if foreign currency – posting period – auto account – background job – document flow – own IP alias MIRO
5. **Payment FPYP** – Vendor Payment KZ – F-53 – clearing – auto – own IP

**Professional Use:** For large org with multiple plants, PR per plant, PO per plant, GR per plant with auto account and MAP – works – need pricing, output, batch, QM for full professional

### Flow 2 – Make to Stock (MTS) – 55% Ready

**Steps:**
1. **BOM MBMC** – Bill of Materials – e.g., Finished 20001 has components Raw 10001 2kg + Pack 10002 1pc – multi-level – own IP alias CS01
2. **Work Center MWCC** – Machine/Labor – capacity – own IP alias CR01
3. **Routing MRTC** – Sequence – e.g., Mixing → Packing – own IP alias CA01
4. **Production Order MMOC** – CO01 – create order – auto number – BOM explosion – component availability check – reservation – release – status REL → CONF – own IP alias CO01
5. **Confirmation CO11N** – GI 261 component consumption GBB/BSX – GR 101 finished receipt BSX – valuation_class – MAP – movement FMTM – auto account FAUC – universal ledger – background job – T0 BLOCKING – NO DANGLING – document flow – industry standard

**Professional Use:** For large org with multiple plants each multiple products, BOM per product, work center per plant, routing per product, production order per plant – basic order + kitting + confirmation works – need MRP detailed MD01/MD04, capacity planning, shop floor, variant config, costing CK40N detailed for full professional

### Flow 3 – Order to Cash (O2C) – 50% Ready

**Steps:**
1. **SO SSOC** – Sales Order VA01 – auto number SO 1000000000 – customer from partner EPAC role CUSTOMER – plant 1000 – material 20001 – pricing – availability check – credit check FCPC own IP alias OB45 – document flow – own IP alias VA01
2. **Delivery SDLC** – Outbound Delivery VL01N – auto number DL 8000000000 – picking – PGI 601 stock- value- GBB/BSX – movement FMTM 601 – auto account FAUC – stock ledger – universal ledger – posting period – background job – own IP alias VL01N
3. **Billing SBLC** – Billing VF01 – auto number BL 9000000000 – revenue account FRAD own IP alias VKOA – chart KSCA + sales org 1000 + cust group 01 + mat group 01 → GL KOFI/KOFK 3000000001 – Dr AR Cr Revenue – pricing – output – background job – document flow – own IP alias VF01
4. **Exchange Rates FEXC** – own IP alias OB08 – if SO currency USD, company INR – lookup rate valid for posting date – if not found, fail with reason "Exchange rate USD→INR not found for 2026-09-20 – maintain via FEXC own IP alias OB08 – from_currency USD to_currency INR rate from_date to_date – e.g., USD→INR 83.5 from 2026-09-16 to 2026-09-30 – current rates: ..." – inverse fallback 1/rate – cache dragonfly with invalidation – KDM exchange diff at payment – industry standard – validity dates from_date/to_date – frequent changes handled via new records with new from_date – historical postings use historical rate valid for posting date – no retroactive change

**Professional Use:** For large org multi-sector multi-plant, SO per sector/plant, delivery per plant, billing with revenue account determination FRAD – basic flow works – need pricing conditions, output determination, credit management, availability ATP, partner/text determination, billing plans, returns, contracts for full professional

### Flow 4 – Record to Report (R2R) – 70% Ready

**Steps:**
1. **GL Accounts FGLC** – Chart FCOA own IP alias OB13 CA-IN-01, Field Status Variant FFSV own IP alias OBC4/FSSV FFSV-1000, Field Status Groups FFSG own IP alias OBC5 G001 expense cost_center R, Fiscal Calendar FFYC own IP alias OB29 K4 April-March, Posting Period Variant FPPC own IP alias OBBO PPV-1000, Posting Periods FPPE own IP alias OB52 – T0 BLOCKING – must exist before ELEC – GL account create with field status group – e.g., 5000000001 Raw Material Consumption – cost center required
2. **Auto Account FAUC** – own IP alias OBYC – BSX inventory, WRX GR/IR, GBB offsetting COGS, PRD price diff, BSV PI diff, KDM exchange diff, KOFI/KOFK revenue – transaction_key determines GL – valuation_class → BSX – e.g., material 10001 valuation_class 3000 → BSX GL 1400000001
3. **Movement Types FMTM** – own IP alias OMJJ – 101/261/601 etc. – stock +/- value +/- account modifier BSX/WRX/GBB/PRD/BSV
4. **Revenue Account FRAD** – own IP alias VKOA – chart + sales org + cust group + mat group → GL KOFI/KOFK – used in billing
5. **Number Ranges FNRC** – own IP alias FBN1 – assignment table core_number_range_assignment – explicit XYZ to material (RAW→MAT-RAW-01 10000-19999) and YZX to PO (1000→PO-01) – error_and_extend – usage % warning 80% amber 90% red – locked badge when used – cache dragonfly + pgbouncer – industry standard
6. **Exchange Rates FEXC** – own IP alias OB08 – validity dates – frequent changes – cache with invalidation – KDM – industry standard
7. **Universal Ledger** – all postings go to universal ledger – BSX/WRX/GBB/PRD/BSV/KDM/KOFI/KOFK – for reporting – trial balance, P&L, BS – table fin_universal_ledger
8. **Currencies FCYC** – own IP alias OY03 – INR default – only INR default per user

**Professional Use:** For large org, R2R is core – GL, auto account, movement, revenue, number ranges, exchange rates – T0 BLOCKING – almost full parity – ready for professional use – need Financial Statement Version, posting keys, tax codes detailed, document types, tolerance groups, dunning, house banks for full

### Flow 5 – HR + Payroll – 40% Ready

**Steps:**
1. **Org/Position/Employee** – HHEC/HHEV – multi-sector org – e.g., Spices Org with 500 employees, Foods Org with 300 – org units, positions, employee master with org assignment, position, plant, company code – table core_employee
2. **Payroll HPYC** – monthly payroll run for 1000s employees – background job FBJM – auto-promote after 10 sec for ALL processes – first 10 sec direct with spinner timer, if >10 sec auto background popup with progress steps – user can close → redirect to last page as usual – job continues – header Jobs icon FBJM shows running/queued – no timeout – even minutes – queue if system busy – lock prevents double payroll for same period – System Jobs page FBJM shows progress per employee 500/1000 – 60% – if hung, progress stuck >5 min shows warning – can cancel – System Locks FELM shows payroll lock – 5 min expiry + heartbeat – pgbouncer 6432 pooling prevents too many connections – dragonfly 6379 cache for employee data – ready for thousands – table core_background_job
3. **Posting to FI** – payroll postings to universal ledger – BSX/WRX etc. – cost center allocation – partially ready

**Professional Use:** For large org with 1000s employees, org structure and payroll background job works – need time management, shift planning, benefits, loans, garnishment, detailed payroll schema with wage types, tax slabs, PF/ESI, compliance, posting to FI detailed with cost center allocation, payslip PDF, ESS, recruitment, performance for full professional

### Flow 6 – System – Jobs/Locks/Cache/Pooling – 80% Ready – Better than Industry Standard for UX

**Steps:**
1. **Background Jobs FBJM** – own IP alias SM37 – queue if busy, progress steps, no timeout, auto-promote after 10 sec for ALL processes – first 10 sec direct with spinner timer + elapsed timer + prevent double click + show result with doc number + next + usage %, if >10 sec auto background popup with progress steps Validating → Assignment → Generating number → Creating → Posting → Completed – user can close → redirect to last page as usual – job continues – header Jobs icon FBJM shows running/queued with green pulse if RUNNING (server working), amber if QUEUED (system busy, will start after current), dropdown with progress bars, step_description, queue explanation, link to System Jobs – polls every 2-3 sec shows if server working or hung – progress stuck >30s may be hung – System Jobs page FBJM – SM37 page polling every 2 sec, stats running/queued/completed/failed, filter, cancel/delete, test payroll 1000 button, steps display, progress bar, result/error, explains no timeout, can close page, queue – industry standard
2. **Enqueue Locks FELM** – own IP alias SM12 – double-entry protection – if one user starts GR for PO 4500000001 and moved to background, lock PO 4500000001 – other users locked out – 423 Locked – try after completion or 5 min inactivity – critical settings like number ranges locked when editing – other users see 🔒 Locked by user@example.com – can edit after release or 5 min expiry – heartbeat extends lock while typing – auto-expire after 5 min if closes browser – SM12 page shows all active locks – FELM own IP – table core_enqueue_lock – lock_object, object_id, table_name, locked_by, locked_at, expires_at (NOW+5min), is_active, job_id, description – API /api/locks – POST acquire, PUT heartbeat, DELETE release, GET list – industry standard SM12 enqueue/dequeue
3. **PGBouncer** – 6432 transaction pooling – MAX_CLIENT_CONN 1000, DEFAULT_POOL_SIZE 25, RESERVE_POOL_SIZE 5, MAX_DB_CONNECTIONS 50 – prevents too many connections – ERP has many concurrent DB calls – payroll 1000 employees, GR 20 lines – docker-compose container pgbouncer – depends_on postgres healthy – network internal – env DATABASES_HOST postgres, POOL_MODE transaction
4. **Dragonfly** – 6379 cache – drop-in Redis replacement – faster, lower memory – same API – maxmemory 256mb – proactor_threads 1 – volume dragonfly_data – healthcheck redis-cli ping – docker-compose container dragonfly – cache wrapper src/shared/kernel/cache/client.ts – get/set/del, TTL, invalidation on update, fallback to memory if redis not available – cache keys nr:CODE, nra:OBJECT:KEY, nr_next:CODE:YEAR, mat:CODE, comp:CODE, fac:CODE – invalidateNumberRangeCache on current_number increment – industry standard – improves payroll 1000 employees from 3000 DB queries to 3 DB + 2997 cache
5. **Auto-Promote Hook** – useAutoPromoteJob – universal for ALL processes – not limited to GR/payroll – first 10 sec direct with spinner timer + elapsed timer + prevent double click, if >10 sec auto-moves to background – popup shows steps – user can close → redirect to last page as usual – job continues – header FBJM icon – no timeout – even minutes – lock prevents double entry – heartbeat – industry standard – src/shared/ui/job-popup.tsx – JobPopup component + useAutoPromoteJob hook

**Professional Use:** For large org with 1000s users, 10 plants, 10k materials, 1000s employees payroll, system needs pooling, cache, background jobs, locks – our implementation with pgbouncer + dragonfly + FBJM + FELM + auto-promote is ready and better UX than industry standard for long processes – missing job scheduling cron, job logs, system logs – but core ready

---

## 6. Gaps for Large Organisation – Roadmap to 80%+

### Immediate – To Reach 80% for Large Org

1. **Multi-Sector:**
   - Implement Business Area, Segment, Inter-company STO PSTD and billing, company code assignments to controlling area, credit control area, consolidation
   - Add business area field to company code and profit center
   - Add inter-company clearing accounts
   - Test multi-company code with inter-company postings

2. **Services:**
   - Add service master flag `is_service=true` – skip stock ledger, only revenue account FRAD – billing only – no GR
   - Add service category – e.g., Packing Service, Logistics Service
   - Add service procurement – service PO, service entry sheet

3. **Multi-Plant Scale:**
   - Test with 10 plants, 10k SKUs – add meilisearch after debug for fast search – currently ILIKE slow for 10k – add after business logic debug
   - Add WM bins, QM inspection lots, batch determination per plant, serial numbers
   - Add MRP areas, production versions, capacity per plant

4. **Employees Thousands:**
   - Optimize payroll to handle 5000 employees – bulk posting, not per employee 10ms – add wage types, tax, PF/ESI, detailed posting with cost center allocation
   - Add payslip PDF generation
   - Add time management, shift planning, ESS, recruitment

5. **Performance:**
   - Already have pgbouncer + dragonfly + FBJM + FELM + auto-promote
   - Need to load test with 100 concurrent users, 10 plants, 10k materials, 1000 employees payroll
   - Add meilisearch for fast search after debug – for 100k+ records – typo-tolerant, instant search – indexing on create/update

6. **Advanced Flows:**
   - Pricing conditions, output determination, credit management, availability ATP, partner/text determination, billing plans, returns, contracts – for SD full professional
   - MRP detailed MD01/MD04, capacity planning, shop floor, variant config, costing CK40N detailed, overhead, variance – for PP full professional
   - Asset accounting, dunning F150, house banks FI12, tax, tolerance groups – for FICO full professional
   - WM/TR, reservation, batch, serial, QM – for MM full professional

### Long Term – To Reach 90%+ for Large Org

- **Inter-company:** STO, billing, clearing, transfer pricing, consolidation, segment reporting
- **Services:** Service master, service procurement, service entry, service billing
- **Multi-plant:** WM, QM, batch, serial, MRP areas, capacity, production versions
- **HR:** Time, benefits, recruitment, performance, ESS, detailed payroll schema
- **System:** Job scheduling cron, job logs ST22, system logs SM21, RZ10 params, meilisearch, bullmq for robust queue (needs redis, we already have dragonfly – can add after debug), monitoring, alerting

---

## 7. Conclusion

**Current System:** ~50-60% ready for core ERP – foundation + MM + SD + FICO basics work – T0 BLOCKING fully covered with own IP codes – own codes primary, SAP codes only as aliases – legal-safe – pgbouncer + dragonfly + FBJM + FELM + auto-promote + popup + redirect + double-entry protection + 5 min expiry – industry standard – suitable for small production company (biscuits, spices) with single sector, 1-2 plants, 100s products, 100s employees

**For Large Organisation Multi-Sector Multi-Plant Multi-Product + Services + 1000s Employees:** ~30-40% ready – multi-plant foundation good (75%), multi-product good (70%), multi-sector basic (40%), services low (30%), employees payroll background job ready (50%) but HR detailed missing – need to add inter-company, services, meilisearch, detailed HR/payroll, WM/QM, pricing/output, credit management, capacity, costing detailed to reach 80%+ for large org professional use – roadmap above

**Flows for Industry Professional Use:** P2P (PR→PO→GR→IV→Payment) 65% ready, MTS (BOM→WC→Routing→Order→Confirmation→GR) 55% ready, O2C (SO→Delivery→PGI→Billing + FRAD revenue + FEXC exchange rates) 50% ready, R2R (GL + FAUC auto account + FMTM movement + FRAD revenue + FNRC number ranges + FEXC exchange rates + universal ledger) 70% ready, HR + Payroll 40% ready, System (FBJM jobs + FELM locks + pgbouncer + dragonfly + auto-promote) 80% ready – all with own IP codes, SAP codes only as aliases – legal-safe – industry standard term used in commits, not in UI per user instruction

---

## 8. Own Codes – Legal-Safe – Primary, SAP Codes Only Aliases

- **FMTM** – Foundation Movement Type Master – own IP – alias OMJJ – was OMJJ as primary, now FMTM primary
- **FRAD** – Foundation Revenue Account Determination – own IP – alias VKOA – was VKOA primary, now FRAD primary
- **FFSG** – Foundation Field Status Group – own IP – alias OBC5 – was OBC5 primary, now FFSG primary
- **FFSV** – Foundation Field Status Variant – own IP – alias OBC4/FSSV – was FSSV primary, now FFSV primary
- **FBJM** – Foundation Background Job Monitor – own IP – alias SM37 – was SM37 primary, now FBJM primary
- **FELM** – Foundation Enqueue Lock Monitor – own IP – alias SM12 – was SM12 primary, now FELM primary
- **FNRC** – Foundation Number Range Config – own IP – alias FBN1 – FBN1 only alias
- **FEXC** – Foundation Exchange Rate Config – own IP – alias OB08 – OB08 only alias
- **FAUC** – Foundation Auto Account Config – own IP – alias OBYC – OBYC only alias
- **FPPE** – Foundation Posting Period – own IP – alias OB52 – OB52 only alias
- **EMTC** – Enterprise Material Type Create – own IP – alias MM01 – MM01 only alias
- **PPOC** – Procurement Purchase Order Create – own IP – alias ME21N – ME21N only alias
- **And all others – own IP primary, SAP codes only searchable aliases – function is destination, code is helper – searching ME21N redirects to background function Create Purchase Order – ME21N is not target, function is target – per user instruction UI without SAP/industry standard words, commits use industry standard term**

---

**Report Generated:** 2026-09-30 – Perintalmanna, Kerala, IN – Roadmap folder – large_org_readiness_report.md
