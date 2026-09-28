# All Implemented Functions – 90 total – For Search Alias Mapping

**Instruction:** You will give what to use for its search – e.g., for ME21N you might want search terms "create po, new po, po create" – Provide mapping per Function
**Current search:** Already supports partial match via token scoring, word boundary for short tokens PO/PR/GR, action synonyms CREATE/EDIT/DISPLAY, doc synonyms
**Next build:** Should work for partial match too (not exact match) – e.g., "crea po" should match "create po", "pur ord" should match purchase order etc – will implement fuzzy/partial

| Function | Description | Route | Module | Type | SubModule | Suggested Search Terms (you to define) |
|--------|-------------|-------|--------|------|-----------|----------------------------------------|
| ALB | Document Flow | /1000/audit/document-flow | AUDIT | DISPLAY | AUDIT-FLOW | |
| CA01 | Create Routing - Sequence of Manufacturing Steps | /1000/pp/routings | PP | CREATE | PP-RTG | |
| CA02 | Change Routing | /1000/pp/routings | PP | CHANGE | PP-RTG | |
| CA03 | Display Routing | /1000/pp/routings | PP | DISPLAY | PP-RTG | |
| CK40N | Costing Run | /1000/fico/costing-run?mode=run | FICO | POSTING | CO-PC | |
| CO01 | Create Production Order | /1000/pp/kitting?mode=create | PP | CREATE | PP | |
| CR01 | Create Work Center - Machine/Labor Capacity | /1000/pp/work-centers | PP | CREATE | PP-WC | |
| CR02 | Change Work Center | /1000/pp/work-centers | PP | CHANGE | PP-WC | |
| CR03 | Display Work Center | /1000/pp/work-centers | PP | DISPLAY | PP-WC | |
| CS01 | Create BOM - Bills of Material | /1000/pp/bom | PP | CREATE | PP-BOM | |
| CS02 | Change BOM | /1000/pp/bom | PP | CHANGE | PP-BOM | |
| CS03 | Display BOM | /1000/pp/bom | PP | DISPLAY | PP-BOM | |
| CUNI | Define Units of Measure - CUNI | /1000/foundation/uom | FOUNDATION | CREATE | MM-CFG | |
| F-53 | Vendor Payment KZ 53* 5300000000- | /1000/fico/payment | FICO | POSTING | FI-AP | |
| F110 | Automatic Payment Program – F110 |  |  |  |  | |
| FBN1 | Define Number Ranges 50-54 5000000000-5499999999 | /1000/fico/chart-of-accounts | FICO | CREATE | FI-NR | |
| FS00 | Create G/L Account Master 5000000001-5000000006 | /1000/fico/gl-accounts | FICO | CREATE | FI-GL | |
| FS01 | Create G/L Account |  |  |  |  | |
| FS02 | Change G/L Account – FS00 edit |  |  |  |  | |
| FS03 | Display G/L Account |  |  |  |  | |
| FSP0 | G/L Account in Chart of Accounts |  |  |  |  | |
| FTXP | Define Tax Codes GST0/5/12/18/28 IGST - VAT 5% included | /1000/fico/tax-codes | FICO | CREATE | FI-TAX | |
| KITTING | Kitting - Stocked K01/K02 | /1000/pp/kitting | PP | POSTING | PP-KIT | |
| KS01 | Create Cost Center KS-CC-01..05 | /1000/fico/cost-centers | FICO | CREATE | CO-CCA | |
| KS02 | Change Cost Center | /1000/fico/cost-centers | FICO | CHANGE | CO-CCA | |
| KS03 | Display Cost Center | /1000/fico/cost-centers | FICO | DISPLAY | CO-CCA | |
| KSB1 | Cost Center Actual Line Items | /1000/fico/cca-report | FICO | REPORT | CO-CCA | |
| KZ | Payment Document Type KZ 53* | /1000/fico/payment | FICO | POSTING | FI-AP | |
| MD01 | MRP Run - Material Requirements Planning | /1000/pp/mrp | PP | POSTING | PP-MRP | |
| MD04 | Stock/Requirements List - MRP Stock | /1000/pp/mrp | PP | DISPLAY | PP-MRP | |
| ME21N | Create Purchase Order | /1000/mm/po?mode=create | MM | CREATE | MM-PUR | |
| ME22N | Change PO | /1000/mm/po?mode=change | MM | CHANGE | MM-PUR | |
| ME23N | Display PO | /1000/mm/po?mode=display | MM | DISPLAY | MM-PUR | |
| ME27 | Create Stock Transport Order STO | /1000/mm/sto | MM | CREATE | MM-STO | |
| ME28 | Release PO | /1000/workflow/inbox?docType=PO | MM | POSTING | MM-PUR | |
| ME51N | Create Purchase Requisition | /1000/mm/pr?mode=create | MM | CREATE | MM-PUR | |
| ME52N | Change PR | /1000/mm/pr?mode=change | MM | CHANGE | MM-PUR | |
| ME53N | Display PR | /1000/mm/pr?mode=display | MM | DISPLAY | MM-PUR | |
| ME54N | Release PR | /1000/workflow/inbox?docType=PR | MM | POSTING | MM-PUR | |
| MI01 | Create Physical Inventory Doc | /1000/mm/physical-inventory?mode=create | MM | CREATE | MM-PI | |
| MI04 | Enter Count | /1000/mm/physical-inventory?mode=count | MM | CHANGE | MM-PI | |
| MI07 | Post Differences | /1000/mm/physical-inventory?mode=post | MM | POSTING | MM-PI | |
| MIGO | Goods Receipt 101 | /1000/mm/gr?mode=101 | MM | POSTING | MM-IM | |
| MIRO | Invoice Verification | /1000/mm/iv?mode=create | MM | POSTING | MM-IV | |
| MM01 | Create Material | /1000/foundation/materials?mode=create | FOUNDATION | CREATE | MM-MD | |
| MM02 | Change Material | /1000/foundation/materials?mode=change | FOUNDATION | CHANGE | MM-MD | |
| MM03 | Display Material | /1000/foundation/materials?mode=display | FOUNDATION | DISPLAY | MM-MD | |
| MM60 | Material Overview | /1000/foundation/materials?mode=list | FOUNDATION | REPORT | MM-MD | |
| MMBE | Stock Overview | /1000/foundation/stock | FOUNDATION | DISPLAY | MM-IM | |
| OB13 | Define Chart of Accounts KSCA | /1000/fico/chart-of-accounts | FICO | CREATE | FI-COA | |
| OB29 | Define Fiscal Year Variant K4 | /1000/fico/company-master | FICO | CREATE | FI-FYV | |
| OB37 | Assign Fiscal Year Variant to Company Code | /1000/fico/company-master | FICO | CHANGE | FI-FYV | |
| OB38 | Assign Company Code to Credit Control Area | /1000/fico/company-master | FICO | CHANGE | FI-COMP | |
| OB40 | Tax GL Accounts – OB40 |  |  |  |  | |
| OB45 | Define Credit Control Area | /1000/fico/company-master | FICO | CREATE | FI-COMP | |
| OB52 | Open Close Posting Periods OB52 | /1000/fico/posting-period | FICO | CHANGE | FI-PER | |
| OB53 | Define Retained Earnings Account 2500000001 | /1000/fico/chart-of-accounts | FICO | CREATE | FI-COA | |
| OB62 | Assign Company Code to Chart of Accounts | /1000/fico/chart-of-accounts | FICO | CHANGE | FI-COA | |
| OBA7 | Define Document Types KR/KG/KZ/RE/WE/WA/SA | /1000/fico/chart-of-accounts | FICO | CREATE | FI-DOC | |
| OBBO | Posting Period Variant OBBO | /1000/fico/posting-period | FICO | CREATE | FI-PER | |
| OBBP | Assign Posting Period Variant to Company Code | /1000/fico/company-master | FICO | CHANGE | FI-PPV | |
| OBD4 | Define Account Groups KASS/KLIA/KREV etc | /1000/fico/chart-of-accounts | FICO | CREATE | FI-COA | |
| OBYC | Auto Account Determination BSX/WRX/PRD/GBB/BSV | /1000/fico/gl-accounts | FICO | CREATE | FI-AUTO | |
| OME4 | Define Purchasing Group | /1000/foundation/enterprise-structure | FOUNDATION | CREATE | ENT-PGRP | |
| OMS2 | Define Material Types - OMS2 | /1000/foundation/material-types | FOUNDATION | CREATE | MM-CFG | |
| OMSF | Define Material Groups – FOOD/SPICE/OIL/PACK/FG – configurable |  |  |  |  | |
| OVX1 | Define Distribution Channel |  |  |  |  | |
| OVX2 | Define Sales Organization | /1000/foundation/enterprise-structure | FOUNDATION | CREATE | ENT-SORG | |
| OVX5 | Define Sales Organization |  |  |  |  | |
| OX02 | Define Company Code - Company Master | /1000/fico/company-master | FOUNDATION | CREATE | ENT-CC | |
| OX08 | Define Purchasing Organization | /1000/foundation/enterprise-structure | FOUNDATION | CREATE | ENT-PORG | |
| OX09 | Define Storage Location | /1000/foundation/enterprise-structure | FOUNDATION | CREATE | ENT-SLOC | |
| OX10 | Define Plant | /1000/foundation/enterprise-structure | FOUNDATION | CREATE | ENT-PLANT | |
| OX15 | Define Company | /1000/foundation/enterprise-structure | FOUNDATION | CREATE | ENT-COMP | |
| OX16 | Assign Company to Company Code | /1000/foundation/enterprise-structure | FOUNDATION | CHANGE | ENT-ASSIGN | |
| OX18 | Assign Plant to Company Code | /1000/foundation/enterprise-structure | FOUNDATION | CHANGE | ENT-ASSIGN | |
| OY03 | Define Currencies - Only INR default, OY03 | /1000/fico/currencies | FICO | CREATE | FI-CUR | |
| PA20 | Display HR Master Data – PA20 |  |  |  |  | |
| PA30 | Maintain HR Master | /1000/hr/payroll?mode=maintain | HR | CHANGE | HR-PA | |
| PC00 | Payroll Run | /1000/hr/payroll?mode=run | HR | POSTING | HR-PY | |
| PFCG | Role Maintenance – PFCG |  |  |  |  | |
| SBWP | Workflow Inbox - Approvals | /1000/workflow/inbox | FOUNDATION | REPORT | WF | |
| SM20 | Audit Log | /1000/audit/logs | AUDIT | REPORT | AUDIT-LOG | |
| SU01 | User Maintenance – SU01 |  |  |  |  | |
| VA01 | Create Sales Order | /1000/sales?mode=create | SD | CREATE | SD | |
| VA02 | Change Sales Order | /1000/sales?mode=change | SD | CHANGE | SD | |
| VA03 | Display Sales Order | /1000/sales?mode=display | SD | DISPLAY | SD | |
| VF01 | Create Billing Document - B2B AR | /1000/sd/billing | SD | POSTING | SD-BIL | |
| VL01N | Create Outbound Delivery - B2B Wholesale | /1000/sd/delivery | SD | CREATE | SD-DL | |
| VL10B | Process STO Delivery | /1000/mm/sto | MM | POSTING | MM-STO | |

---

## How Search Currently Works (v3.1)

- Tokenizes query by spaces, uppercases
- Action synonyms: CREATE/NEW/ADD → CREATE, EDIT/CHANGE/UPDATE/MODIFY → CHANGE, DISPLAY/VIEW/SHOW → DISPLAY, POST/POSTING → POSTING
- Doc synonyms: PO → PO, PURCHASE ORDER, ME21N etc; PR → PR, PURCHASE REQUISITION; GR → GR, GOODS RECEIPT, MIGO, 101, WE; etc (see src/shared/lib/functions.ts)
- Word boundary for short tokens ≤2 chars (PO, PR, GR) to avoid false match POSTING contains PO
- Requires all tokens matched, scoring, sorted, 12 results max
- Fallback simple includes

## Next Build Requirement

- Search should NOT be exact match, should work for partial match too – e.g., "crea po" should match "create po", "pur ord" should match purchase order, "mat typ" should match material types etc – will implement fuzzy/partial like includes per token partial, Levenshtein or prefix matching

## Your Task

Fill last column "Suggested Search Terms" – for each Function, what terms should trigger it? Examples:
- ME21N: create po, new po, add po, po create, purchase order create, create purchase order
- ME22N: edit po, change po, update po, po change
- MIGO: create gr, goods receipt, gr posting, migo, 101, we, goods movement
- etc.

Return list, then next build will implement partial/fuzzy matching based on your terms.
