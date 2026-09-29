# SAP S/4HANA vs Current ERP – Gap Analysis
**Date: 2026-09-29 | Company: 1000 | Build: 170+ routes | 79+ dedicated pages | One-Code-One-Page enforced**

> Goal: List SAP standard features missing in currently implemented modules, with usage.

---

## 1. Overall Coverage

| Module | SAP Standard Scope | Current Status | Coverage |
|--------|-------------------|----------------|----------|
| **FOUNDATION / Enterprise Structure** | OX02, OX10, OX09, OMJJ, OMSY, Address, Number Ranges | OX15/ECGC, OX02/ELEC, OX10/EFCC, OX09/EILC, KSCA/FCOA, FBN1/FNRC implemented | ~75% |
| **FICO – Financial Accounting** | OBC4/OBC5, OBA0/OBA4, OBA7, OBYC, OB45, OB13, FS00, FBLxN, FB08, F.05, F110, F150, FI12, AS01, AFAB | Core masters done, postings partial | ~60% |
| **FICO – Controlling** | KS01, OKEON, KL01, KO01, KE51, KSU5, CK11N, CK40N, ML | KS01/CCUC, CK40N/CCRP, KSB1/CCUL done | ~40% |
| **MM – Procurement & Inventory** | MM01, ME11, ME01, ME51N, ME41, ME21N, MIGO, MIRO, MI01, MB21, MMBE, MD04 | MM01/EMTC basic, ME51N/PPRC, ME21N/PPOC, MIGO/IGRC 101, MIRO/PIVC, MI01/IPIC done | ~55% |
| **PP – Production** | CS01, CR01, CA01, MD01, CO01, CO11N, MD61, CM01 | CS01/MBMC, CR01/MWCC, CA01/MRTC, MD01/MMRP, CO01/MMOC (as kitting) done | ~45% |
| **SD – Sales** | XD01, VA01, VK11, VL01N, VF01, VKOA, OVA8, NACE | VA01/SSOC, VL01N/SDLC, VF01/SBLC, OB45/FCPC done | ~50% |
| **HR – HCM** | PA30, PA20, PA03, PE01, PC00, PP01, PT01 | PA30/HHEC, PA20/HHEV, PC00/HPYC basic | ~30% |
| **Workflow / Security / Audit** | SBWP, ME54N, ME28, SU01, PFCG, SM20, SWDD, SM37 | SBWP/FWFL, ME54N/PPRL, ME28/PPOR, SU01/FUSC, PFCG/FROC, SM20/AALG, ALB/AFLW done | ~60% |

---

## 2. Detailed Missing Features – By Module

### A. FOUNDATION / Enterprise Structure – MOOA E

| SAP Code / Feature | Usage – Why SAP has it | Current Status | Priority |
|--------------------|------------------------|----------------|----------|
| **OX06 Controlling Area ECAC + Assignment** | Defines controlling area boundary, fiscal year variant, currency, company codes assignment. Without it, CO postings (cost center, profit center) cannot be controlled cross-company. | Route exists `/foundation/commercial-orgs` but no assignment logic to legal entity, no currency check | HIGH |
| **OMJJ Movement Types Config** | Defines 101 GR, 102 GR reversal, 122 Return to vendor, 161 Returns, 261 GI to order, 601 GI to sales, 309 Transfer. Controls account determination, field status, reversal. | Only 101 hard-coded in IGRC. Missing 102/122/261/601 etc. | HIGH |
| **OMSY Number Range Groups – Material, PR, PO, GR** | SAP allows different number range intervals per group (e.g., RAW vs FINISHED). Current FNRC is single generic. | FNRC exists but not per object, no buffering | MEDIUM |
| **Enterprise Config – Plant Parameters (MMRV)** | MRP type, lot size, procurement type, special procurement, storage location MRP indicator. Controls how MRP behaves per plant/SLoc. | EFCC only code/name, no MRP parameters | HIGH |
| **Address Management + Partner Roles** | SAP stores street/city/country for legal entity, plant, vendor, customer. Needed for tax, output, shipping. | Only city/country in ELEC, no full address | MEDIUM |

### B. FICO – Financial Accounting – MOOA F

| SAP Code | Usage | Current | Priority |
|----------|-------|---------|----------|
| **OBC4 Field Status Variant + OBC5 Groups – Enforcement** | Variant 1000 Standard groups control which GL fields are required/suppressed/optional (cost center, profit center, text). Your request: yes_calc strict. | Pages exist OBC4/OBC5 but **no enforcement in FI posting** – universal ledger posting does not check field status | **CRITICAL – Requested** |
| **OBA0 Tolerance Group GL + OBA4 CV – Enforcement** | GL tolerance: max open item per employee; CV tolerance: max payment difference, cash discount. Prevents posting if exceeded. | Pages exist OBA0/OBA4 but tolerance check not in MIRO/PIVC or FPYP payment | **CRITICAL** |
| **FBKP Posting Keys 40/50** | Defines debit/credit, account type (S/D/K/A), field status, reversal key. Core of FI document entry. | Missing entirely – we directly debit/credit without posting key | HIGH |
| **OBYC Auto Account Determination Full BSX/WRX/GBB/PRD/BSV/KDM** | BSX inventory posting, WRX GR/IR, GBB offsetting entry, PRD price diff, BSV inventory offset, KDM exchange diff. | Only BSX/WRX implemented in GR/IV. Missing GBB (consumption), PRD (price diff for MAP), BSV, KDM | **CRITICAL – Requested** |
| **OB40 Tax GL Accounts** | Automatic tax accounts – MWST output/input tax determined via tax code. | FTGC exists but not linked to tax procedure | HIGH |
| **FB08 Document Reversal + FBRA Reset Clearing + F.13 GR/IR Clearing** | Reversal with reason, reset clearing, automatic clearing of GR/IR account. Essential for month-end. | Only GR reversal page exists, no FI reversal logic with audit | HIGH |
| **F.05 / FAGL_FC_VAL Foreign Currency Valuation** | Revalues foreign currency open items at month-end using exchange rates, creates variance posting. | FFVC table exists, but no valuation run job, no exchange rate diff account | HIGH |
| **F110 Automatic Payment Program Full** | Proposal run (vendor selection, due date check, payment method), payment run (DME file, payment advice, posting KZ). | FPYA page exists but only manual payment, no proposal/payment medium | HIGH |
| **F150 Dunning** | Dunning levels, charges, dunning letters for overdue customer invoices. | Missing | MEDIUM |
| **FI12 House Banks + Bank Accounts** | Defines house bank, account ID, GL account, check lots, bank statement config. | Missing – payment currently no bank | HIGH |
| **Asset Accounting Full: AO90, AS01/02/03, AFAB, AW01N, ABUMN, ABAVN** | Asset classes → GL accounts, asset master with depreciation area, depreciation run AFAB monthly, asset explorer, transfer, retirement with gain/loss. | fin_asset_class exists, fin_asset + fin_asset_posting table exists, but no depreciation key AFAMA, no depreciation calculation, no AW01N explorer, no settlement | MEDIUM (if FMCG trading, low) |
| **FBL1N/FBL3N/FBL5N + FS10N + Universal Journal Reports** | Vendor/GL/Customer line item display, balance display. Core for accountants. | fin_universal_ledger exists but no FBLxN UI, no FS10N balance | HIGH |
| **Closing Cockpit: OBY6, F.16, FAGLGVTR, OB52 control** | Company code global parameters, balance carry forward, period close checklist, open/close posting periods per account type. | FPPE/OB52 open/close exists, but no account type specific (A/D/K/M/S), no carry forward | HIGH |

### C. FICO – Controlling – CO

| SAP Code | Usage | Current | Priority |
|----------|-------|---------|----------|
| **OKEON Cost Center Groups + Cost Center Hierarchy** | Groups cost centers for reporting, allocations. | CCUC only flat list, no hierarchy | MEDIUM |
| **KL01 Activity Types + KP26 Planning** | Defines labor/machine hours, cost per activity, used in routing costing. | Missing | HIGH for PP costing |
| **KO01 Internal Orders + KOK5 Budget** | Tracks costs for projects/events, budget control. | Missing | MEDIUM |
| **KE51 Profit Center + KCH5N Hierarchy + KE52 Assignment** | Profit center master, hierarchy for reporting, assignment to cost center/material. | EPUC exists but no hierarchy, no assignment to cost center | MEDIUM |
| **KSU5/KSU1/KSV5 Assessment/Distribution/Settlement Cycles** | Allocates costs from sender cost center to receivers using tracing factors (stat key figures). | FCCA table exists but no cycle config UI | HIGH |
| **CK11N Cost Estimate + CK24 Price Update + CK40N Full Rollup** | CK11N creates product cost estimate from BOM+Routing, CK24 updates standard price, CK40N mass costing run. Your request: CK40N strict rollup. | CCRP/CK40N page exists but only basic cost rollup, no BOM explosion + routing + overhead | **CRITICAL** |
| **Material Ledger + Actual Costing CKMLCP** | Tracks actual costs with moving average, price differences, actual costing. | Missing – only MAP in prod_item | MEDIUM |
| **KK01 Statistical Key Figures** | Tracks metrics (headcount, sqm) for allocation base. | Missing | LOW |

### D. MM – Materials Management

| SAP Code | Usage | Current | Priority |
|----------|-------|---------|----------|
| **MM01 Full Views (MRP1-4, Purchasing, Accounting, Sales)** | MRP type, lot size, procurement type, valuation class, price control S/V, moving avg price. Without views, MRP and costing fail. | EMTC only item_number/name/base_unit/type/category – no MRP view, no accounting view | **CRITICAL** |
| **ME11/ME12/ME13 Info Record** | Vendor-material specific price, planned delivery time, tax, conditions. PO price determination uses it. | API `info-records` exists, UI missing, no price determination in PO | HIGH |
| **ME01/ME02/ME03 Source List + MEQ1 Quota Arrangement** | Defines allowed sources per material/plant, with validity, MRP relevant. Quota splits sourcing % between vendors. | API `source-lists` exists, UI missing | HIGH for MRP |
| **ME41/ME42/ME43 RFQ + ME47 Quotation + ME49 Price Comparison** | Request for quotation to vendors, maintain quotations, compare prices, select winner → PO. | Missing | MEDIUM |
| **PO Enhancements: Account Assignment (K/C/F), Delivery Costs, Conditions, ERS, Confirmation, Output** | K = cost center, C = sales order, F = production order – determines GL account via GB B. Delivery costs add freight to landed cost. Conditions for price. | PPOC only basic, no account assignment, no landed cost calc fully, no output NEU | HIGH |
| **Movement Types Full OMJJ: 102, 122, 161, 261, 262, 309, 551, 601, 602** | 102 reversal of 101, 122 return to vendor, 261 GI to production order, 601 GI for sales order (delivery PGI), 309 transfer material to material. | Only 101 implemented in IGRC/MIGO | **CRITICAL** |
| **MB21 Reservation + MB1A/MB1C/MB52 + MIGO 261/601** | Reservation for cost center/order, goods issue for sampling, warehouse stock report, PGI for sales. | Missing – STV stock overview only | HIGH |
| **MIRO Enhancements: Subsequent Debit/Credit, ERS MRRL, Consignment MRKO, GR/IR Clearing F.13** | Subsequent costs (freight invoice after GR), evaluated receipt settlement auto invoices, consignment settlement. | PIVC only basic tolerance check, WRX clearing basic | HIGH |
| **Physical Inventory Full: MI02/MI03/MI09/MI10/MI11, Cycle Counting MICN** | Change/display PI doc, enter count without doc, create list, recount, cycle counting by ABC class. | IPIC/IPIE/IPIP only create/count/post, no cycle, no recount | MEDIUM |
| **MRP Full: MD02/MD03 Single-Item, MD61 PIR, MRP Controller, Lot-Sizing, MD04 Pegging, MD05 MRP List** | Single-item MRP, planned independent requirements (forecast), exception messages (20 reschedule in, 10 bring forward), pegging links demand to supply. Your request: MD04 net calc strict. | MMRP/MD01 basic net calc exists but no gross-net logic with safety stock, no exception messages, no pegging | **CRITICAL** |
| **STO Enhancements: NL, Intercompany Billing IV, Pricing** | Stock Transport Order with delivery NL, picking, PGI 641, GR 101, intercompany billing IV with pricing, SD invoice. | PSTC/ME27 basic, PSTD/VL10B basic, no intercompany billing | MEDIUM |
| **Batch Management MSC3N + Batch Determination + Serial Numbers** | Batch where-used, shelf life, batch split in delivery, serial number tracking IQ01. | ELTC/lots basic, no batch determination, no serials | MEDIUM |

### E. PP – Production Planning

| SAP Code | Usage | Current | Priority |
|----------|-------|---------|----------|
| **CS02/CS03/CS11/CS12/CS14/CS20 BOM** | Change/display BOM, BOM explosion, where-used, mass change. Needed for costing and MRP explosion. | MBMC/CS01 create only, no explosion | HIGH |
| **CR02/CR03/CR11 Work Center + Capacity** | Change/display work center, capacity planning, work center hierarchy, cost center link for costing. | MWCC/CR01 create only | HIGH |
| **CA02/CA03/CA11 Routing + Rate Routing CA21 + Reference Operation** | Change/display routing, routing with inspection, alternative sequences, rate routing for repetitive. | MRTC/CA01 create only | HIGH |
| **CO01/CO02/CO03/COHV/CO11N/CO15 Production Order Full** | Create/change/display production order, mass processing, confirmation (yield/scrap), goods movements 261/101, status REL/CNF/TECO/CLSD/DLV, availability check, costing, settlement KO88. Your request: CO01 strict with operations/components. | MMOC/CO01 as kitting only – no operations list, no components, no confirmation, no status management | **CRITICAL** |
| **MRP Conversion: MD04 Planned Order → PR/PO/Prod Order** | Convert planned order from MRP to procurement proposal. Core of MRP execution. | Missing – MMRV/MD04 display only | HIGH |
| **MD61/MD62 Demand Management + PIR Consumption** | Planned independent requirements (forecast) that drives MRP, consumption with sales orders. | Missing | HIGH |
| **Capacity Planning CM01/CM21 + Material Availability** | Checks work center capacity load, material availability for order. | Missing | MEDIUM |

### F. SD – Sales & Distribution

| SAP Code | Usage | Current | Priority |
|----------|-------|---------|----------|
| **XD02/VD02 Customer Master Sales Area + Partner Functions** | Sales org/dist channel/division view, partner functions SP ship-to, SH sold-to, BP bill-to, PY payer. Customer-material info VD51. | SCUC only basic partner_account, no sales area, no partner functions | HIGH |
| **VA01 Full: Item Categories TAN/TAP, Schedule Lines CP/CT, Copy Control VTAA, Incompleteness, ATP** | Item category determines pricing, delivery relevance, schedule line determines MRP, copy control from inquiry/quotation, incompleteness log blocks order, ATP checks stock. | SSOC/VA01 basic – SCUC required, EMTC, FCPC credit check basic, no item category, no ATP | **CRITICAL** |
| **VK11/VK12/VK13 Condition Records + V/07 Access Sequence + V/04 Tables + OVKK Determination** | Defines prices, discounts, freight per material/customer/sales org. Access sequence searches condition tables. Your request: pricing procedure strict. | Fin pricing condition tables exist, but no access sequence config, no condition record UI fully | **CRITICAL** |
| **VL01N Full: VL02N/VL03N, Picking VL06P, Packing, Batch Split, Route, Shipping Point, Due List VL10C** | Change/display delivery, picking with TO, packing into HU, batch determination, route determination, shipping point determination, delivery due list. | SDLC/VL01N basic – SSOC required, EFCC, no picking, no packing | HIGH |
| **VF01 Full: VF02/VF03, Billing Types F2/G2/L2/RE, VTFL/VTFA Copy Control, VF04 Due List, VKOA Revenue Account Determination, VFX3 Release to Accounting** | Billing type determines posting, copy control delivery→billing, revenue account determination via condition technique KOFI/KOFK (customer group/material group → GL), release to accounting creates FI document. Your request: VF01 strict. | SBLC/VF01 basic – SDLC required, SCUC, FAPT due date, FPPE posting period, FTXC tax calc, OBYC revenue basic – missing VKOA condition, no copy control, no VF04 | **CRITICAL** |
| **Credit Management: FD32/FD33 + OVA8 + Automatic Credit Check** | Credit master with limit, credit control area assignment, automatic credit check at sales order (static/dynamic), credit exposure update. Your request: credit check. | FCPC/OB45 credit policy areas exists, credit check in SSOC basic exposure calc, but no FD32 credit master per customer, no OVA8 config, no dynamic check | **CRITICAL** |
| **Output Determination NACE + Forms** | Output BA00 for sales order, LD00 for delivery, RD00 for billing – email/print. | Missing | MEDIUM |
| **Returns RE, Credit Memo G2, Debit Memo L2, Cancellation VF11** | Returns process with 651 movement, credit memo without delivery, debit memo. | Missing | MEDIUM |

### G. HR – Human Capital

| SAP Code | Usage | Current | Priority |
|----------|-------|---------|----------|
| **Infotypes Full: 0000 Actions, 0001 Org Assignment, 0002 Personal, 0006 Address, 0007 Planned Working Time, 0008 Basic Pay, 0009 Bank, 0014/0015 Payments, 2001 Absences** | Core HR master – each infotype stores specific data with validity. Without them, payroll cannot calculate. | HHEC/PA30 only basic employee master, no infotype structure | **CRITICAL** |
| **PP01 Org Management + O/S/C/P Objects** | Org units, positions, jobs, persons, relationships, reporting structure. | Missing | MEDIUM |
| **PA03 Payroll Control Record** | Controls payroll status: release for payroll, start payroll, corrections, exit. Prevents retro without control. | Missing – payroll run direct | HIGH |
| **PE01/PE02 Schema/Rules + Wage Types + PC00_M99_CIPE Posting** | Payroll schema defines calculation rules, wage types for basic pay, allowances, deductions, FI posting to cost center/GL. Your request: PC00 wage calc strict. | HPYC/PC00 basic wage calc, no schema, no wage type config, no FI posting | **CRITICAL** |
| **PT01 Time Management + RPTIME00 + Leave Quota** | Work schedules, time evaluation, absences, leave quota, overtime. | Missing | MEDIUM |

### H. Workflow / Security / Audit / Basis

| SAP Code | Usage | Current | Priority |
|----------|-------|---------|----------|
| **SWDD Workflow Builder + Agent Determination + Multi-Level Release Strategy** | Defines workflow for PR/PO/SO/IV with release codes, classification, amount thresholds, agent (manager) determination, escalation, email. | FWFL/SBWP inbox basic, PPRL/ME54N and PPOR/ME28 single level, no release strategy config, no escalation | HIGH |
| **Authorization Objects + Composite Roles + SU21/SU24** | Field-level auth (company code, plant, cost center), composite roles, auth object checks in APIs. | FROC/PFCG and FUSC/SU01 basic, RBAC table exists but no auth object checks | HIGH |
| **DMS + GOS + Attachments + Archiving** | Document management, generic object services, attachments to PR/PO/SO, archiving old docs. | Missing | MEDIUM |
| **SM37 Batch Jobs + Background Processing** | Schedules jobs for MRP MD01, costing CK40N, FX valuation, depreciation AFAB, payroll, dunning. | Job queue table exists, no SM37 UI | MEDIUM |
| **CDHDR/CDPOS Change Documents + Versioning** | Tracks master data changes with old/new values, audit trail for material, vendor, customer. | AALG/SM20 audit log for transactions, but no CDHDR for master data | MEDIUM |

---

## 3. Critical Gaps for Your Requested Strict Functions

You explicitly requested these – current gaps:

1. **OBC4/OBC5 Field Status – NOT enforced** – FI posting via `fin_universal_ledger` does not check variant/group. Need to add validation in `enforcePostingPeriod` + new `enforceFieldStatus`.
2. **OBA0/OBA4 Tolerance – PARTIAL** – Pages exist but `proc_goods_receipt` and `sales_billing` do not call tolerance check. Need `enforceToleranceGroups`.
3. **OBYC BSX/WRX – PARTIAL** – Only BSX/WRX, missing GBB (consumption), PRD (price diff), BSV (inventory posting), KDM (exchange diff). Need to extend `fin_auto_account`.
4. **OB45 Credit Control – PARTIAL** – Exposure calc in sales order basic, but no FD32 limit per customer, no dynamic check on create. Need `enforceCreditCheck`.
5. **CK40N Costing Run – PARTIAL** – Basic cost rollup, no BOM explosion via `mfg_bom`, no routing cost via `mfg_routing` + work center formula + activity type.
6. **MD04/MD01 Net Requirements Calc – PARTIAL** – Basic stock - requirements, missing safety stock, lot-sizing, exception messages 10/20/30, pegging, low-level code.
7. **VA01 Pricing + Credit Check – PARTIAL** – Pricing procedure exists but no access sequence search, no VKOA revenue account determination, credit check only static.
8. **CO01 Production Order Strict – MISSING operations/components** – Current kitting only header, no operation list from routing, no component list from BOM, no status, no confirmation CO11N, no GI 261, GR 101.
9. **PC00 Payroll – PARTIAL** – Wage calc basic, missing infotypes, schema, control record, FI posting.

---

## 4. Recommended Implementation Priority (Next Phase)

**Phase 1 – Must for Strict Compliance (2-3 weeks):**
- OBC4/OBC5 enforcement in FI postings
- OBA0/OBA4 tolerance enforcement in IV, Payment, GR
- OBYC full keys GBB/PRD/BSV/KDM + VKOA revenue
- Movement Types OMJJ config + 102/122/261/601
- Material Master full views (MRP, Accounting)
- VA01 pricing access sequence + condition records VK11 + credit check FD32/OVA8
- CO01 with operations (from CA01 routing) + components (from CS01 BOM) + status + CO11N confirmation

**Phase 2 – Operational Completeness:**
- ME11 Info Record + ME01 Source List + MRP controller + MD02/MD03 + MD61 PIR
- VL01N picking/packing + VF01 copy control VTFL + VF04 due list + VFX3 release
- CK11N/CK24/CK40N full with BOM explosion + routing
- F110 full proposal/payment run + F.05 FX valuation + FB08 reversal
- PA03 control record + infotypes + PE01 schema

**Phase 3 – Enterprise Hardening:**
- OKEON hierarchy, KL01 activity types, KSU5 cycles, Material Ledger CKMLCP
- Batch management MSC3N + serial numbers + reservations MB21
- SWDD workflow builder + release strategy + NACE output + SM37 batch jobs

---

## 5. Current Implemented – What IS Working Strict

✅ Posting Period FPPE/OB52 `yes_enforce` – blocks posting if closed – implemented in PR/PO/GR/IV/SO/DL/BL via `enforcePostingPeriod`
✅ Fiscal Calendar FFYC K4 calc 2026-05-15 → FY2026 P02 – `getFiscalYearPeriodFromDate`
✅ One-Code-One-Page 79+ pages with `?mode=create/change/display/list` like MM01/MM02/MM03
✅ Related links low importance auto FK bottom
✅ Modern `rounded-2xl shadow` + Classic `border-2 border-black bg-[#ffffcc]` power-user
✅ Document Flow AFLW tracks PR→PO→GR→IV→PAY via reference
✅ Audit Log AALG WORM-lite immutable
✅ Navigator tree replaces sidebar

---

**Next Step:** If you want, I can start Phase 1 implementation – pick 3 features to start (e.g., OBC4 enforcement + OMJJ movement types + CO01 operations/components) – tell me priority.

