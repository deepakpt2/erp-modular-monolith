# ERP Feature Tiers – No Dangling Fields Principle
**Date: 2026-09-29 | Rule: Every field added MUST be used downstream in posting/calculation/validation – no orphan UI**

> One-Code-One-Page enforced. When a feature is implemented, its usecase must be implemented in the same commit.

---

## TIER DEFINITIONS

| Tier | Label | Definition | Example of Failure if Missing |
|------|-------|------------|------------------------------|
| **T0** | **ABSOLUTELY REQUIRED – BLOCKING** | Without this, core document chain PR→PO→GR→IV→PAY→GL or SO→DL→PGI→BL→AR→GL or Prod Order→CONF→GR **cannot post or posts wrong GL**. System is broken. | Material without valuation class → OBYC cannot find BSX GL → GR fails. SO without pricing → no price. Delivery without PGI 601 → stock never reduces. |
| **T1** | **REQUIRED – STANDARD & COMPLIANCE** | System posts, but month-end close, audit, legal compliance, or SAP best practice fails. Credit exposure, tolerance, field status, reversals, FX valuation, cost rollup. | No tolerance check → overpay vendor by 100%. No credit check → sell to bankrupt customer. No field status → GL without cost center → CO reports wrong. |
| **T2** | **GOOD – OPERATIONAL EXCELLENCE** | Improves efficiency, automation, reporting. Manual workaround exists but painful. | No info record → every PO manual price. No source list → MRP cannot auto-source. No batch determination → manual batch entry. |
| **T3** | **ADVANCED – NICE TO HAVE** | Enterprise hardening, scale, analytics. | Asset accounting, dunning, batch jobs SM37, DMS attachments. |

---

## T0 – ABSOLUTELY REQUIRED – BLOCKING (Must implement first – no dangling)

### FOUNDATION

| Code | Feature | Usage Chain – End-to-End | Where Enforced | Dependencies | Dangling Check |
|------|---------|--------------------------|----------------|--------------|----------------|
| **EMTC-FULL** | Material Master Full Views – Accounting View: valuation_class (RAW/SEMI/FINISHED), price_control (S/V), moving_avg_price, standard_price, valuation_category | GR 101 needs valuation_class → OBYC BSX lookup → inventory GL debit. IV needs price_control to decide PRD price diff posting. Costing CK40N needs standard_price. | `POST /api/materials` saves fields, `POST /api/gr` reads material.valuation_class for OBYC, `POST /api/iv` reads price_control for PRD | EUOC UOM, EMTP type, FCOA chart | If valuation_class not used in GR → DANGLING – FORBIDDEN |
| **OMJJ** | Movement Types Config 101/102/122/161/261/262/309/551/601/602 | 101 GR, 102 GR reversal, 122 return to vendor, 261 GI to prod order (CO11N), 601 GI for sales (VL02N PGI). Each movement defines + / - stock, + / - value, account modifier. | `fin_movement_type` table, `POST /api/gr` checks movement_type, `POST /api/delivery` PGI uses 601, `POST /api/production-orders/confirm` uses 261 | EMTC valuation_class, OBYC | Field movement_type must affect stock qty + universal ledger – else dangling |
| **FCOA-FULL + FGLC** | Chart + GL Master with account type (S/D/K/M), P&L vs BS | All postings need GL account type to decide field status, open item management. | Already exists, but enforce account_type in posting | – | – |

### FICO

| Code | Feature | Usage Chain | Where Enforced | Dependencies | Dangling Check |
|------|---------|-------------|----------------|--------------|----------------|
| **OBYC-FULL** | Auto Account Determination BSX/WRX/GBB/PRD/BSV/KDM + VKOA KOFI/KOFK | BSX inventory posting on GR 101, WRX GR/IR clearing, GBB offset for consumption (261), PRD price diff (PO price vs MAP), BSV inventory posting, KDM exchange diff, KOFI/KOFK revenue (VF01). Without this, GR/IV/DL/Billing cannot create FI doc. | `POST /api/gr` → lookup fin_auto_account where transaction_key=BSX/WRX + chart + valuation_class, `POST /api/iv` → PRD, `POST /api/delivery` PGI 601 → GBB+BSX, `POST /api/billing` → KOFI/KOFK revenue + MWST tax | EMTC-FULL valuation_class, FCOA, FTXC tax | If OBYC entry not used in universal ledger → DANGLING |
| **OBC4/OBC5-ENF** | Field Status Variant/Group Enforcement | Variant assigned to company code (FLFA), group assigned to GL account (FGLC). On every FI posting, check if cost center, profit center, text required/suppressed. Prevents incomplete docs. | New helper `enforceFieldStatus({ company_code, gl_account, posting_data })` called in `POST /api/universal-ledger`, `POST /api/gr`, `POST /api/billing`, `POST /api/payment` | FLFA, FGLC field_status_group, OBC4/OBC5 masters | If field_status_group field added to GL but not checked → DANGLING |
| **FDOC-TYPE + FBN1** | Document Types OBA7 + Number Ranges FBN1 enforcement | Every FI doc needs doc type SA/KR/KG/KZ/RE/WE/WA/RV + number range. Determines number, reversal, account types allowed. | `getNextDocumentNumber` already, but need doc type validation in FI posting | FNRC | Doc type must be validated in posting – else dangling |

### MM

| Code | Feature | Usage Chain | Where Enforced | Dependencies | Dangling Check |
|------|---------|-------------|----------------|--------------|----------------|
| **PR-PO-GR-IV-CHAIN-FULL** | PR→PO→GR→IV chain with ELIKZ delivery completed, GR/IR clearing, account assignment K | PR created → PO references PR → GR references PO (quantityReceived++), IV references GR (quantityInvoiced++), IV posts WRX clearing debit GR/IR credit vendor. ELIKZ closes PO. | `POST /api/po` updates PR, `POST /api/gr` updates PO line quantityReceived, posts BSX/WRX, `POST /api/iv` updates GR quantityInvoiced, posts WRX clearing + PRD if diff | EMTC-FULL, OMJJ, OBYC-FULL | If GR doesn't update PO quantityReceived → DANGLING |
| **STOCK-LEDGER** | Stock ledger with MAP recalculation, landed cost, quantity/value | GR 101 increases stock qty + value, recalculates MAP = (old qty*old MAP + GR qty*PO price)/new qty. GI 261/601 decreases qty. | `POST /api/gr` calls `updateStockLedger`, `POST /api/delivery` PGI calls decrease | EMTC-FULL | If MAP not updated → DANGLING |

### PP

| Code | Feature | Usage Chain | Where Enforced | Dependencies | Dangling Check |
|------|---------|-------------|----------------|--------------|----------------|
| **BOM-ROU-WC-LINK** | BOM CS01 + Work Center CR01 + Routing CA01 linked to Production Order CO01 | BOM explosion gives component list for CO01, Routing gives operation list, Work Center gives capacity + cost center for costing. Without this, CO01 cannot have components/operations. | `POST /api/bom` → `mfg_bom`, `POST /api/routings` → `mfg_routing` + operations, `POST /api/production-orders` → copies BOM components + routing operations into order | EMTC, MWCC, MRTC | If BOM not copied to prod order → DANGLING |
| **CO01-CONF-GI-GR** | Production Order Confirmation CO11N + GI 261 + GR 101 + Status REL/CNF/TECO/CLSD | Order REL → component availability check → CO11N confirmation posts GI 261 (GBB/BSX) + activity cost, GR 101 finished goods (BSX), status CNF/TECO. | `POST /api/production-orders/confirm` → posts 261 movement, updates order status, `POST /api/production-orders/gr` → posts 101 | BOM-ROU-WC-LINK, OMJJ, OBYC-FULL GBB/BSX | If confirmation doesn't post GI → DANGLING |

### SD

| Code | Feature | Usage Chain | Where Enforced | Dependencies | Dangling Check |
|------|---------|-------------|----------------|--------------|----------------|
| **SCUC-FULL + PARTNER** | Customer Master Sales Area + Partner Functions SP/SH/BP/PY | Sales area (commercial org + sales channel + product line) defines pricing procedure, shipping point, credit control area. Partner functions determine ship-to, bill-to. | `POST /api/business-partners` sales view, `POST /api/sales-orders` validates sales area + partners | ECOC, ESCC, EPLC, FCPC | If sales area not used in pricing determination → DANGLING |
| **VA01-FULL + PRICING** | Sales Order Full + Pricing Procedure V/08 + Condition Records VK11 + Access Sequence V/07 | Pricing procedure determination: customer + sales area → procedure, access sequence searches condition tables (material/customer) → finds PR00 base price, discounts. Net value calculated. | `POST /api/sales-orders` → `determinePricingProcedure()` → `searchConditionRecords()` → calculates lineTotal, `fin_pricing_condition_record` | SCUC-FULL, EMTC, FCPC, FTXC | If PR00 record not used in SO price → DANGLING |
| **VKOA** | Revenue Account Determination KOFI/KOFK | Billing needs to find revenue GL via condition technique: chart + sales org + customer group + material group + account assignment group → GL account. | `POST /api/billing` → `determineRevenueAccount()` → OBYC KOFI/KOFK lookup → posts Dr AR Cr Revenue + Tax | FCOA, SCUC, EMTC, FTXC, OBYC-FULL | If VKOA not used in billing FI doc → DANGLING |
| **VL01N-PGI-601** | Delivery + PGI 601 + COGS Posting GBB/BSX | Delivery created from SO, picking, then PGI posts GI 601: stock decrease, COGS posting Dr COGS (GBB) Cr Inventory (BSX) via OBYC. | `POST /api/delivery` → `POST /api/delivery/pgi` → movement 601 + universal ledger GBB/BSX | OMJJ, OBYC-FULL GBB/BSX, STOCK-LEDGER | If PGI doesn't post COGS → DANGLING |
| **VF01-VTFL-VFX3** | Billing + Copy Control + Release to Accounting | Billing created from delivery (copy control VTFL: delivery → billing, item categories), pricing copied, then VFX3 release posts Dr AR Cr Revenue + Tax + COGS already posted. | `POST /api/billing` → copy from delivery, `POST /api/billing/release` → posts FI doc via VKOA + FTXC | VL01N-PGI-601, VKOA | If billing release doesn't post FI → DANGLING |

### HR (Minimal for FMCG)

| Code | Feature | Usage Chain | Where Enforced | Dependencies |
|------|---------|-------------|----------------|--------------|
| **PA30-INFOTYPES** | Infotypes 0001 Org Assignment, 0002 Personal, 0007 Work Time, 0008 Basic Pay | Basic Pay 0008 → wage types → payroll run PC00 → FI posting to cost center | `hr_employee` + `hr_infotype` tables, `POST /api/payroll-run` reads infotypes | ECUC cost center |

---

## T1 – REQUIRED – STANDARD & COMPLIANCE (System works but audit/month-end fails)

| Code | Feature | Usage Chain – Why Required | Where Enforced | Tier Reason |
|------|---------|----------------------------|----------------|-------------|
| **OBA0/OBA4-ENF** | Tolerance Groups GL + Customer/Vendor Enforcement | GL tolerance: employee max posting amount, CV tolerance: payment difference + cash discount. Prevents fraud/overpay. IV checks if invoice price diff > tolerance → block. Payment checks if overpay > tolerance → block. | `enforceToleranceGroups({ company_code, gl_account, partner, amount, type })` in `POST /api/iv`, `POST /api/payment` | Without it, can overpay vendor 100% – compliance fail |
| **FD32-CREDIT** | Customer Credit Master + OVA8 + Dynamic Credit Check | FD32 defines credit limit, risk category per customer + credit control area. OVA8 defines automatic credit check (static/dynamic). SO creation checks exposure = open SO + open delivery + open billing + open AR vs limit → block/warning. | `POST /api/sales-orders` → `checkCredit({ customer, credit_control_area, net_value })` → reads `fin_credit_master` + calculates exposure from sales_order + delivery + billing + universal_ledger | Without it, sell to bankrupt customer – required |
| **FB08-FBRA-F13** | Document Reversal + Reset Clearing + GR/IR Clearing | FB08 reverses FI doc with reversal reason, FBRA resets clearing, F.13 auto clears GR/IR account where GR qty = IV qty. Month-end requires clearing. | `POST /api/universal-ledger/reversal` → creates reversal doc with `is_reversed`, `POST /api/gr-ir-clearing` | Without clearing, GR/IR balance never zero – audit fail |
| **F110-FULL** | Automatic Payment Program Proposal + Payment Run | Proposal: selects vendors due, checks payment method, bank, tolerance. Payment: creates payment docs KZ, DME file, advice. | `POST /api/payment/proposal` + `POST /api/payment/run` | Required for AP automation |
| **F.05-FX-VAL** | Foreign Currency Valuation Run | At month-end, revalues foreign currency open items using exchange rates, posts variance to KDM account. | `POST /api/fx-valuations/run` → reads open items in foreign currency, calculates variance, posts via OBYC KDM | Required for month-end |
| **CK11N-CK24-CK40N-FULL** | Product Costing Full: BOM Explosion + Routing + Overhead + Price Update | CK11N cost estimate: explodes BOM (components), routing (operations * activity type rate), overhead. CK24 updates standard price in material master. CK40N mass run. | `POST /api/costing-run` → `explodeBOM()`, `calculateRoutingCost()`, `applyOverhead()` → updates `prod_item.standard_price` | Required for inventory valuation |
| **MD02-MD03-MD61-PIR-CONSUMP** | Single-Item MRP + PIR + Consumption | MD02 multi-level MRP for one material, MD61 PIR forecast, consumption of PIR by SO. Exception messages reschedule. | `POST /api/mrp` single-item, `POST /api/pir` + consumption logic in SO | Required for planning |
| **VL02N-VL03N + PICK-PACK + VL10C + VL09** | Delivery Change/Display + Picking + Packing + Due List + Reverse PGI | Picking VL06P creates TO, packing into HU, due list VL10C creates deliveries due, VL09 reverses PGI 602. | `POST /api/delivery/picking`, `POST /api/delivery/packing`, `GET /api/delivery/due-list`, `POST /api/delivery/reverse-pgi` | Required for warehouse ops |
| **VF02/VF03/VF04/VF11 + G2/L2/RE** | Billing Change/Display + Due List + Cancellation + Credit/Debit Memo + Returns | VF04 billing due list creates billing from deliveries, VF11 cancels billing (reverses FI), G2 credit memo without delivery, RE returns with 651 movement. | `GET /api/billing/due-list`, `POST /api/billing/cancel`, `POST /api/billing/credit-memo` | Required for SD completeness |
| **PA03-CTRL + PE01-SCHEMA + PC00-FI-POST** | Payroll Control Record + Schema/Rules + FI Posting | PA03 controls release for payroll, start payroll, corrections, exit. Schema defines wage type calculation, FI posting PC00_M99_CIPE posts to cost center/GL. | `POST /api/payroll/control-record`, `POST /api/payroll/schema`, `POST /api/payroll-run/post-to-fi` | Required for HR payroll compliance |

---

## T2 – GOOD – OPERATIONAL EXCELLENCE (Manual workaround exists)

| Code | Feature | Usage Chain | Workaround if Missing |
|------|---------|-------------|-----------------------|
| **ME11-INFO-REC** | Info Record ME11/ME12/ME13 – vendor-material price, planned delivery time | PO price auto from info record, else manual. | Manual PO price entry |
| **ME01-SOURCE + MEQ1-QUOTA** | Source List + Quota Arrangement – MRP source determination, % split | MRP auto source, quota splits between vendors | Manual source in PR |
| **ME41-RFQ-ME47-ME49** | RFQ + Quotation + Price Comparison | Competitive bidding, winner → PO | Manual comparison Excel |
| **MB21-RESERVATION + MB52 + MSC1N + SERIAL** | Reservation, Warehouse Stock Report, Batch Where-Used, Serial Numbers | MB21 reserves for cost center/order, MB52 stock per SLoc, MSC1N batch traceability | Manual reservation |
| **MI02/03/09/10/11 + MICN CYCLE** | PI Change/Display, Count without doc, List, Recount, Cycle Counting | Cycle counting ABC class | Manual full PI |
| **CS02/03/11/12/14/20 BOM** | BOM Change/Display, Explosion, Where-Used, Mass Change | Where-used for engineering change | Manual search |
| **CR02/03/11 + CA02/03** | Work Center/Capacity + Routing Change/Display | Change display | Only create works |
| **CO02/03/COHV/CM01** | Prod Order Change/Display, Mass Processing, Capacity Planning | Mass TECO, capacity leveling | Manual one by one |
| **MD05-MRP-LIST + MD12-PLANNED-ORDER** | MRP List, Planned Order Conversion | MRP list static, planned order → PR/PO/Prod Order conversion | Manual conversion |
| **VD51-CUST-MAT-INFO + FREE-GOODS + REBATE** | Customer-Material Info, Free Goods VBN1, Rebate VBO1 | Customer-specific material description, free goods determination | Manual |
| **NACE-OUTPUT + FORMS** | Output Determination BA00/LD00/RD00 | Email/print SO/DL/Billing | Manual email |
| **F150-DUNNING + FI12-HOUSE-BANK** | Dunning, House Banks | Dunning letters, bank config | Manual letters |
| **OKEON-GROUPS + KL01-ACT-TYPE + KSU5-CYCLES** | Cost Center Groups, Activity Types, Assessment Cycles | Reporting groups, labor/machine cost, allocations | Flat cost centers |
| **SWDD-WORKFLOW-BUILDER + RELEASE-STRATEGY** | Workflow Builder, Multi-Level Release with Classification | PR/PO amount thresholds, manager determination | Single level approval |
| **DMS-GOS-ATTACH + SM37-JOBS + CDHDR** | DMS Attachments, Batch Jobs, Change Docs | Attachments to docs, background MRP/costing, audit trail for masters | No attachments |

---

## T3 – ADVANCED – NICE TO HAVE

| Code | Feature | Usage |
|------|---------|-------|
| **AS01-AO90-AFAB-AW01N-ABUMN** | Asset Accounting Full | Asset master, class-GL, depreciation run, explorer, transfer, retirement – for companies with fixed assets |
| **ML-CKMLCP** | Material Ledger + Actual Costing | Actual costing with price differences – for manufacturing with actual costing |
| **PP-DS + SOP + MPS** | Production Detailed Scheduling, Sales & Operations Planning, Master Production Scheduling | Advanced planning |
| **QM + PM + WM + EWM** | Quality Management, Plant Maintenance, Warehouse Management, Extended WM | Separate modules |
| **ESS/MSS + BENEFITS** | Employee Self Service, Manager Self Service, Benefits | HR portal |
| **ARCHIVING + GDPR + E-INVOICE** | Archiving old docs, GDPR deletion, e-invoice compliance | Legal |

---

## IMPLEMENTATION SEQUENCE – NO DANGLING GUARANTEE

**Phase 0 – Foundation Fix (1 week) – Must first, else everything dangling:**
1. EMTC-FULL – Add valuation_class, price_control, MAP, standard_price to material master + UI + API
2. OMJJ – Create fin_movement_type table + UI + enforcement in GR/Delivery/Prod Order
3. OBYC-FULL + VKOA – Extend auto account to GBB/PRD/BSV/KDM + KOFI/KOFK + UI
   - **Dangling check:** EMTC valuation_class used in OBYC lookup in GR → passes

**Phase 1 – T0 Blocking – Core Chains (2 weeks):**
4. BOM-ROU-WC-LINK + CO01-CONF-GI-GR – Prod order with components/operations + confirmation + GI 261 + GR 101
   - Uses: BOM, Routing, Work Center, OMJJ 261/101, OBYC GBB/BSX, STOCK-LEDGER MAP
5. SCUC-FULL + VA01-FULL + PRICING VK11 + VKOA – Customer sales area + SO pricing + revenue account
   - Uses: VK11 records → SO price, VKOA → billing FI
6. VL01N-PGI-601 + VF01-VTFL-VFX3 – Delivery PGI + COGS + Billing + FI
   - Uses: OMJJ 601, OBYC GBB/BSX, VKOA, FTXC tax, STOCK-LEDGER
7. OBC4/OBC5-ENF + FDOC-TYPE – Field status enforcement in all FI postings
   - Uses: OBC4/OBC5 masters → FI posting validation

**Phase 2 – T1 Required – Compliance (2 weeks):**
8. OBA0/OBA4-ENF + FD32-CREDIT + OVA8 – Tolerance + Credit Check
   - Uses: tolerance masters → IV/Payment block, credit master → SO block
9. FB08-FBRA-F13 + F.05-FX-VAL + F110-FULL – Reversal, GR/IR clearing, FX valuation, auto payment
10. CK11N-CK24-CK40N-FULL + MD02-MD03-MD61 – Costing full + MRP single-item + PIR
11. VL02N-PICK-PACK-VL10C-VL09 + VF02-VF04-VF11-G2-L2-RE + PA03-PE01-PC00-FI-POST
   - Uses: picking → delivery, due lists, cancellation reverses FI

**Phase 3 – T2 Good – Operational (2 weeks):**
12. ME11-INFO-REC + ME01-SOURCE + MEQ1-QUOTA + ME41-RFQ
13. MB21-RESERVATION + MB52 + MI02-CYCLE + CS02-BOM-EXPL + CR02-WC + CA02-ROUT
14. CO02-COHV-CM01 + MD05-MD12 + VD51-FREE-GOODS + NACE-OUTPUT + OKEON-KL01-KSU5 + SWDD-RELEASE + DMS-SM37-CDHDR

**Phase 4 – T3 Advanced – Optional**

---

## DANGLING FIELD PREVENTION RULES

**Rule 1:** Every new field in SingleCodePage must have:
- `apiUrl` FK autocomplete + `createUrl` link (related masters)
- Enforcement in downstream API (e.g., valuation_class → OBYC lookup)
- Test: Create material with valuation_class=RAW → GR 101 → check universal ledger has BSX GL from OBYC RAW → if not, fail build

**Rule 2:** No form field without `description` explaining downstream usage
- Example: `valuation_class: "Determines BSX GL via OBYC – used in GR 101 posting – BSX RAW → 1000000001"`

**Rule 3:** Commit must include:
- Master page (SingleCodePage)
- Enforcement API change
- Integration test (e.g., create SO → delivery → PGI → billing → FI doc exists)

**Rule 4:** Related links low importance but must be **required** for creation
- Example: EMTC page shows EMTP (required), EUOC (required), PSUC (for PO) – all with create links

---

## NEXT STEP – Pick Phase 0

Do you want to start with **Phase 0 – EMTC-FULL + OMJJ + OBYC-FULL + VKOA** (3 features, no dangling, unlocks all T0)?

This will make:
- Material Master has valuation_class, price_control, MAP
- Movement Types 101/102/122/261/601 configurable
- Auto Account BSX/WRX/GBB/PRD/BSV/KDM + Revenue KOFI/KOFK working end-to-end: GR posts BSX/WRX, PGI posts GBB/BSX, Billing posts revenue

Reply: **"Start Phase 0"** to proceed.
