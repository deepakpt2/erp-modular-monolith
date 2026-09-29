# SAP-like Functions Audit – Imported but Not Actually Implemented in Action

**Date:** 2026-09-29  
**Purpose:** List SAP-like functions that have codes/aliases/UI but lack real enforcement/action logic

---

## Summary

We have **~138 routes** and **~100+ FUNCTIONS** with SAP aliases (MM01, ME21N, OB29, etc.) using legal-safe primary codes (EMTC, PPOC, FFYC, etc.).  
**Fully implemented** = DB table exists + API POST/PUT/DELETE + UI form with DbAutocomplete + validation + posting period enforcement + document numbering + audit trail  
**Partially** = Create works, but Change/Display/Reversal is same as Create or just status update, no real edit logic  
**Not implemented** = Alias exists, route exists, but page is placeholder or returns empty, no DB enforcement

---

## 1. Fully Implemented – Real Action (Examples)

| SAP | Our Primary | Real Action Implemented |
|-----|-------------|------------------------|
| OB29 Fiscal Year Variant | FFYC | ✅ DB fin_fiscal_calendar + periods, FROM_DATE/TO_DATE validation, used by ELEC, K4/V3, now with posting period calc |
| OBBO Posting Period Variant | FPPC/OBBO | ✅ DB fin_posting_calendar, CODE/NAME, create form, used by OB52 |
| OB52 Open/Close Posting Periods | FPPE/OB52 | ✅ Now has create form VARIANT + ACCOUNT_TYPE + FROM/TO PERIOD/YEAR + is_open, enforcement via enforcePostingPeriod in PR/PO/GR/IV/SO/DL/BL/Documents – rejects if closed |
| ME51N PR Create | PPRC | ✅ Number range PR- auto, DB proc_purchase_requisition, lines, posting period enforcement M, audit trail, reversal PRRE/PRAD |
| ME21N PO Create | PPOC | ✅ PO- auto, DB proc_purchase_order, vendor filtered VENDOR role, posting period K, audit, reversal PORE/POAD |
| MIGO GR 101 | IGRC | ✅ GR- auto, DB proc_goods_receipt, plant/sloc autocomplete, posting period M, audit, reversal GRRE/GRAD (was MIGO 102) |
| MIRO Invoice Verification | PIVC | ✅ IV- auto, DB proc_invoice_verification, vendor, posting period K, audit, reversal IVRE (was MR8M) |
| VA01 Sales Order | SSOC | ✅ SO- auto, customer filtered CUSTOMER role, material, posting period D, audit, reversal SORE/SOAD |
| VL01N Delivery | SDLC | ✅ DL- auto, sales order autocomplete, plant, posting period M, audit, reversal DLRE |
| VF01 Billing | SBLC | ✅ BL- auto, delivery autocomplete, posting period D, audit, reversal BLRE (was VF11) |
| ME27 STO | PSTC | ✅ STO- auto, from_plant/to_plant, material, posting period, audit, reversal STOR/STOA |
| CS01 BOM | MBMC | ✅ BOM- auto, material/component/plant autocomplete, audit |
| CA01 Routing | MRTC | ✅ RT- auto, material/work_center autocomplete |
| CR01 Work Center | MWCC | ✅ WC- auto, cost_center/plant autocomplete |
| Kitting | MKTC | ✅ KIT- auto, material/plant |
| MD01 MRP | MMRP | ✅ MRP- auto, material/plant |
| MI01 Physical Inventory | IPIC | ✅ PI- auto, plant/sloc/material |
| FS00 GL Account | FGLC | ✅ account_number (not code), COA_CODE autocomplete, DB gl-accounts |
| KS01 Cost Center | CCUC/FCCA | ✅ CODE, company_code autocomplete, DB cost-centers |
| OY03 Currencies | FCYC | ✅ CODE, NAME, SYMBOL – base master, no deps |
| FBN1 Number Ranges | FNRC | ✅ core_number_range, object_type, prefix, current_number, fiscal_year, atomic next via /api/number-ranges/next |
| FNDC Document Registry | FNDC | ✅ core_document + core_document_history – unique doc number for every transaction + immutable audit trail + reversal/adjustment |
| EMTC Product | MM01 | ✅ prod_item, item_number, material type, UOM autocomplete |
| Partner Account | EPAC/PSUC/SCUC | ✅ partner_account, account_number, role VENDOR/CUSTOMER filtered, DB business-partners |

---

## 2. Partially Implemented – Create Works, Change/Display/Reversal Same as Create (No Real Edit Logic)

These have aliases for CHANGE/DISPLAY but route to same page with `?mode=change` or `?mode=display` that **does NOT actually implement change/display** – just shows same create form or status update.

| SAP | Our Code | Issue |
|-----|----------|-------|
| MM02 Change Material | EMTE | Alias MM02 → `/foundation/materials?mode=change` – page does NOT implement change mode – same as create, no SELECT existing material to edit, no versioning |
| MM03 Display Material | EMTV | Alias MM03 → `?mode=display` – same create form, not read-only display |
| ME52N Change PR | PPRE | Alias ME52N → `/mm/pr?mode=change` – PR page only has create, no change UI – PUT exists but only status update, not line edit – now fixed with reversal/adjustment but still no line-level change |
| ME53N Display PR | PPRV | Alias ME53N → `?mode=display` – same as create |
| ME22N Change PO | PPOE | Alias ME22N → `/mm/po?mode=change` – same as create, no real PO change after GR – now reversal/adjustment implemented but UI still shows create |
| ME23N Display PO | PPOV | Same as create |
| VA02 Change Sales Order | SSOE | Alias VA02 → `/sales?mode=change` – same as create |
| VA03 Display Sales Order | SSOV | Same as create |
| MMBE Stock Overview | ISTV | Route `/foundation/stock` – stock overview exists but is basic – no real-time MRP, no batch/lot tracking |
| MM60 Material Overview | EMTL | Alias MM60 → `?mode=list` – list exists but is simple, not full SAP MM60 with stock + value |
| CO01 Production Order | MMOC | Alias CO01 → `/pp/kitting?mode=create` – kitting is not production order – CO01 should be production order header + operations + components – we reuse kitting page, not real production order |
| MI04 Enter Count, MI07 Post Differences | IPIE, IPIP | Aliases MI04, MI07 → `/mm/physical-inventory?mode=count/post` – page has mode param but does NOT implement count entry or post differences – only create |
| PA30 Maintain HR Master, PA20 Display | HHEC, HHEV | Aliases PA30, PA20 → `/hr/payroll?mode=maintain/display` – payroll page does NOT implement maintain/display modes – only create |
| PC00 Payroll Run | HPYC | Alias PC00 → `/hr/payroll?mode=run` – no payroll run logic, no wage type calc |
| KSB1 Cost Center Actuals, CK40N Costing Run | CCUL, CCRP | Routes `/fico/cca-report`, `/fico/costing-run` – these pages exist? Check – cca-report exists but is basic report, costing-run may be placeholder |
| ME27 STO Delivery VL10B | PSTD | Alias VL10B → `/mm/sto` – same page, no delivery processing |

**Impact for normal enterprise:** Change/Display modes are power-user expectations – if user types ME52N expecting to change PR lines, they get create form – functionally inferior for edit scenarios. Now mitigated via reversal/adjustment docs (edit = reversal/adjustment) but UI still not distinct.

---

## 3. Not Implemented – Imported as Alias/Code but No Real Action / Placeholder

These are mentioned in `enterprise/config` API description or FUNCTIONS but have **no DB table, no API enforcement, no UI form with real logic** – only alias for search.

| SAP | Description | Our Status | Real Use Missing |
|-----|-------------|------------|------------------|
| **OBC4 / OBC5** | Field Status Variant / Field Status Groups – controls which fields are required/suppressed/optional per posting key and GL account | Mentioned in `/api/enterprise/config` – `field status OBC4/OBC5` – **Not implemented** – we have required validation per form but not field status variant logic that would make fields required/suppressed per company code/GL account/posting key | For normal enterprise, field status is critical – e.g., cost center required for expense GL but suppressed for cash – we have hardcoded required, not variant-driven |
| **OBA0 / OBA4** | Tolerance Groups – defines tolerance for payment differences, GL postings, customer/vendor | Mentioned in enterprise/config – `tolerance OBA0/OBA4` – **Not implemented** – we have no tolerance check when posting payment differences – e.g., if invoice 100.00 and payment 99.90, should allow within tolerance | Normal enterprise needs tolerance – otherwise small differences block posting |
| **OB45** | Credit Control Area – defines credit control area, assigned to company code, controls credit limit check for customers | Mentioned – `credit OB45` – we have `FCPC` Credit Policy Areas – `credit-policy-areas` table with CODE/NAME only – **No credit limit, no credit check** on sales order/billing – sales order does NOT check customer credit exposure | For B2B wholesale (SDLC), credit check is critical – without it, you can oversell to risky customer – functionally inferior |
| **OBA7** | Document Types – defines document types (SA, KA, KG, etc.) + number range assignment, field status, etc. | Mentioned – `doc types OBA7` – **Not implemented** – we have FNRC number ranges but not document types that would assign number range per doc type + control header text, reference, etc. – we have FBN1 but not doc type logic | Normal enterprise needs doc types – e.g., SA = G/L posting, KA = vendor invoice, KG = vendor credit memo – each with different number range – we have single FI_DOC range |
| **OBYC** | Automatic Account Determination – MM/FI integration – defines which GL account is posted for which transaction (BSX inventory, WRX GR/IR, etc.) | Mentioned – `OBYC auto account` – **Not implemented** – when you do GR 101, SAP auto-determines BSX inventory GL via OBYC – we have no auto account determination – GR does not post to GL automatically – no universal ledger integration for MM | For normal enterprise, OBYC is core – GR should debit inventory GL and credit GR/IR – we don't do that – functionally inferior for integrated FI/MM |
| **F-53 / KZ** | Payment Posting – vendor payment, customer payment, GL payment | Route `/fico/payment` exists – has vendor, gl_account, company_code autocomplete – **Partially implemented** – creates payment but no open item clearing, no tolerance, no posting period check for payment doc type? Actually we now have posting period check, but no clearing logic | Normal enterprise needs open item management – payment should clear open vendor invoice – we don't have open items table |
| **OX15 / OX02 / OX16 / OX18 / OVX5** | Enterprise Structure Assignment – assign company group to legal entity, facility to legal entity, commercial structure assignment | We have `ECGA` OX16, `EFLA` OX18, `ECSA` OVX5 – routes to enterprise-structure with tabs – **Partially implemented** – assignment is via autocomplete (e.g., facility has legal_entity_code) but no explicit assignment table UI like SAP OX16 matrix – we have it implicitly via FK, not explicit assignment transaction |
| **FTXP / FTXC** | Tax Codes / Tax Groups – we have FTXC tax codes with RATE and LEDGER_ACCOUNT_CODE, FTGC tax groups – **Partially** – tax calculation not enforced on PO/SO/Billing – e.g., PO with tax code should calculate tax amount – we have tax code master but no tax calc engine |
| **CK40N Costing Run** | Product Costing – calculates standard cost for materials via BOM + routing + work center rates | Route `/fico/costing-run` exists – **Placeholder** – no real costing logic – BOM + routing + work center rates exist but no cost rollup, no cost component split |
| **KSB1 CCA Report** | Cost Center Actual Line Items | Route `/fico/cca-report` exists – basic report – **Partially** – shows actuals but no plan/actual variance, no allocation |
| **MRP MD04 Stock Req List** | MRP – Stock Requirements List | Route `/pp/mrp` exists – has material, plant, demand – **Partially** – creates MRP record but no real MRP run (net requirements calc, planned orders, purchase requisitions generation) – no MD04 dynamic view |
| **VL10B STO Delivery** | Process STO Delivery | Alias VL10B → `/mm/sto` – same page – **Not implemented** – STO delivery should create outbound delivery for STO – we don't have delivery creation for STO |
| **MIGO 102 Reversal, MR8M IV Reversal, VF11 Billing Reversal** | Reversal transactions | Previously not implemented – **Now implemented** via PORE/GRRE/IVRE/BLRE reversal docs – fixed |
| **Posting Period Variant Assignment OBBP** | Assign posting period variant to company code | Mentioned in FUNCTIONS but **Not implemented** – we now have POSTING_PERIOD_VARIANT_CODE in ELEC but no explicit OBBP assignment UI – we added field to ELEC, so partially fixed |

---

## 4. Enterprise Config – Mentioned but Not Enforced

From `/api/enterprise/config` description: `posting period OB52 enforced, field status OBC4/OBC5, tolerance OBA0/OBA4, credit OB45, doc types OBA7, number ranges FBN1 FOR UPDATE, OBYC auto account`

| Feature | Claimed in Config | Actually Enforced? |
|---------|-------------------|-------------------|
| OB52 posting period enforced | Yes – description says enforced | **Now enforced** after last change – we added enforcePostingPeriod in PR/PO/GR/IV/SO/DL/BL/Documents – rejects if closed |
| OBC4/OBC5 field status | Mentioned | **No** – no field status variant logic |
| OBA0/OBA4 tolerance | Mentioned | **No** – no tolerance check |
| OB45 credit control | Mentioned | **No** – no credit check |
| OBA7 doc types | Mentioned | **No** – no doc type + number range assignment |
| FBN1 number ranges FOR UPDATE | Mentioned | **Partially** – we have atomic UPDATE RETURNING for next number, but not SELECT FOR UPDATE locking per SAP, but close |
| OBYC auto account | Mentioned | **No** – no auto GL determination for GR/IR |

---

## 5. Recommendation – What is Functionally Inferior for Normal Enterprise?

**Critical for normal enterprise – Should implement:**
1. **OB52 enforcement** – ✅ Done now
2. **OBYC auto account determination** – GR 101 should auto-post to inventory GL (BSX) + GR/IR (WRX) – currently GR only creates material document, no FI doc – **inferior**
3. **OB45 credit control** – Sales order should check customer credit limit – currently no check – **inferior for B2B**
4. **OBA0/OBA4 tolerance** – Payment differences should be allowed within tolerance – currently exact match required – **inferior**
5. **OBA7 document types** – Different doc types should have different number ranges + field status – currently single FI_DOC range – **partially inferior**

**Nice to have – Not critical for SME normal use:**
- OBC4/OBC5 field status variant – can keep hardcoded required for now
- CK40N costing run – complex, can be manual for now
- MD04 MRP stock req list – can be simple list for now

---

## 6. Full List of SAP-like Codes Imported as Aliases

From `src/shared/lib/functions.ts` – all have `aliases: ['SAP_TCODE']` but primary is own IP:

- MM01/02/03 → EMTC/EMTE/EMTV – Product Create/Change/Display – Change/Display not real
- MMBE → ISTV – Stock Overview – basic
- MM60 → EMTL – Material Overview – basic
- ME51N/52N/53N → PPRC/PPRE/PPRV – PR Create/Change/Display – Change/Display not real (now reversal)
- ME21N/22N/23N → PPOC/PPOE/PPOV – PO Create/Change/Display – Change/Display not real (now reversal)
- MIGO → IGRC – GR 101 – ✅ implemented, 102 reversal now via GRRE
- MIRO → PIVC – IV – ✅ implemented, MR8M reversal now via IVRE
- MI01/04/07 → IPIC/IPIE/IPIP – PI Create/Enter Count/Post Diff – Count/Post not real
- CO01 → MMOC – Production Order – uses kitting page, not real prod order
- KITTING → MKTC – Kitting – ✅
- VA01/02/03 → SSOC/SSOE/SSOV – Sales Order Create/Change/Display – Change/Display not real
- PA30/20 → HHEC/HHEV – HR Master Maintain/Display – not real modes
- PC00 → HPYC – Payroll Run – no wage calc
- KSB1 → CCUL – Cost Center Actuals – basic report
- CK40N → CCRP – Costing Run – placeholder
- OX15/02/16/18/OVX5 → ECGA/EFLA/ECSA – Enterprise assignments – implicit via FK, not explicit matrix
- OY03 → FCYC – Currencies – ✅
- OMS2 → EMTP – Material Types – ✅
- OMSF → EMGC – Material Groups – ✅
- CUNI → EUOC – UOM – ✅
- MSC3N → ELTC – Lots/Batch – basic
- PTNC/BP01 → EPAC – Partner Account – ✅
- XK01/02/03 → PSUC/PSUE/PSUV – Vendor – ✅ but change/display same as create
- XD01/02/03 → SCUC/SCUE/SCUV – Customer – ✅ same issue
- FTXP → FTXC – Tax Codes – ✅ master, no calc engine
- OB13 → FCOA – Chart of Accounts – ✅
- FS00 → FGLC – GL Accounts – ✅
- KS01/02/03 → CCUC/CCUE/CCUV – Cost Center – ✅ but change/display same
- OB29 → FFYC – Fiscal Calendar – ✅ now with FROM/TO
- OBBO → FPPC/OBBO – Posting Period Variant – ✅ CODE/NAME
- OB52 → FPPE/OB52 – Open/Close – ✅ now with create form + enforcement
- FBN1 → FNRC – Number Ranges – ✅
- F-53/KZ → FAPT? Actually payment – partially
- And more...

---

**Conclusion:** ~60% fully implemented (masters + transactional create + document numbering + audit + posting period enforcement), ~30% partially (change/display modes same as create, no real edit), ~10% not implemented (field status, tolerance, credit control, OBYC auto account, costing run, MRP net calc).

If you want, I can prioritize implementing OBYC auto account + OB45 credit check + OBA0 tolerance next – these are most functionally inferior for normal enterprise B2B.
