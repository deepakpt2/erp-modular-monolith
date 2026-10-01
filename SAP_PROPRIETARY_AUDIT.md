# SAP Proprietary Names Audit – DB + Codebase – Own IP Setup Proposal
**Date:** 2026-09-30
**Scope:** Full codebase src/ + drizzle/migrations – DB schema, enums, indexes, comments, API routes, UI pages
**Instruction:** Don't implement yet – show list – create own IP setup

---

## 1. Summary Counts (grep -rho)
- BSX: 279 occurrences (inventory posting)
- WRX: 251 (GR/IR clearing)
- GBB: 147 (offsetting)
- OB52: 136 (posting periods)
- OBYC: 135 (auto account determination)
- K4: 121 (fiscal year variant)
- PRD: 113 (price diff)
- MIGO: 104 (goods receipt t-code)
- ME21N: 96 (create PO t-code)
- F110: 85 (auto payment)
- MIRO: 78 (invoice verification)
- OX02: 77 (company code t-code)
- VKOA: 74 (revenue acct det)
- KOFI: 73
- ELIKZ: 66 (delivery completed)
- KOFK: 60
- KDM: 59
- ME51N: 54 (create PR)
- OMJJ: 46 (movement types)
- OX10: 42 (plant)
- F-53: 33 (vendor payment)
- ME28: 31 (PO release)
- FB05: 22 (post with clearing)
- F-44: 17
- MB51: 3, UNTTO/UEBTO: 2 each
- Total SAP-related tokens: 1248+ lines

---

## 2. Categories of SAP Proprietary Names Found

### A. SAP Transaction Codes (T-Codes) – SAP IP – Found in comments, UI, API messages
| SAP T-Code | Meaning (SAP) | Found In | Own IP (Existing in App) | Proposed Own IP (Final) |
|------------|---------------|----------|--------------------------|-------------------------|
| MIGO | Goods Movement (GR) | mm/gr/page.tsx, goodsReceiptService.ts, comments | IGRC (Inventory Goods Receipt) | GR_CREATE / IGRC – keep IGRC as own IP |
| MIRO | Invoice Verification | mm/iv/page.tsx, invoiceVerificationService.ts | PIVC (Purchase Invoice Verification) | IV_CREATE / PIVC – keep PIVC |
| ME21N | Create Purchase Order | mm/po/page.tsx, procurementFoundationSchema.ts | PPOC (Procurement PO Create) | PO_CREATE / PPOC |
| ME51N | Create Purchase Requisition | mm/pr/page.tsx | PPRC (Procurement PR Create) | PR_CREATE / PPRC |
| ME28 | Release PO | mm/po/page.tsx | – | PO_RELEASE |
| ME27 | Create STO | mm/sto/page.tsx, schema | PSTC (STO Create) | STO_CREATE / PSTC |
| MMBE | Stock Overview | mm/reports, inventory | – | STOCK_OVERVIEW / ISTV |
| MB51 | Material Document List | – | – | MAT_DOC_LIST |
| VL02N | Change Delivery | sd/delivery-change | – | DELIVERY_CHANGE / SDLC |
| VL10B | Delivery Due List | sto | – | DELIVERY_DUE |
| CO11N | Confirm Production Order | pp | – | PROD_CONFIRM |
| F-53 | Outgoing Payment (Vendor) | fico/payment | FPYP (Payment Proposal?) actually F-53 is manual payment | PAY_VENDOR / FPYP – keep FPYP as own IP for payment |
| F110 | Automatic Payment Program | fico/payment, payment-proposal | FPYP / FAPP | PAY_AUTO / FAPP |
| F-44 | Clear Vendor | fico | – | CLEAR_VENDOR |
| FB05 | Post with Clearing | fico | – | POST_CLEARING |
| OB52 | Posting Periods (FI) | fico/posting-periods, gr, iv | FPPE (Posting Period) / FPPC (Variant) | POST_PERIOD / FPPE – keep FPPE |
| OBYC | Automatic Account Determination | fico/auto-account-determination | FAUC (Auto Account) ? Actually FAUC is valuation class, OBYC is auto acct | AUTO_ACCT / FAUC – keep FAUC |
| OMJJ | Movement Types | fico/movement-types | FMTM (Movement Types) | MOVE_TYPE / FMTM – keep FMTM |
| OX02 | Company Code | foundation/legal-entities, enterprise-structure | ELEC (Legal Entity) / FCOM? | COMP_CODE / ELEC – keep ELEC |
| OX10 | Plant / Facility | foundation/facilities | EFCC (Facility) | PLANT / EFCC – keep EFCC |
| OX09 | Storage Location | foundation/inventory-locations | EILC (Inventory Location) | SLOC / EILC – keep EILC |
| OVX2 | Commercial Org? | foundation/commercial-orgs | ECOC | COMM_ORG / ECOC |
| FBN1 | Number Ranges | fico/number-ranges | FNRC | NUM_RANGE / FNRC – keep FNRC |
| OB13 | Chart of Accounts? | foundation/legal-entities | FCOA | COA / FCOA |
| OB29 | Fiscal Calendar? | fico/fiscal-calendars | FFYC | FISC_CAL / FFYC |
| OX06 | Controlling Area? | – | – | CTRL_AREA |
| OME4 | Purchasing Group? | – | – | PURCH_GROUP |
| OX08 | Purchasing Org? | – | – | PURCH_ORG |
| etc | | | | |

**Note:** App already has own 4-char helper codes: PPRC, PPOC, IGRC, PIVC, FPYP, FNRC, FPPE, FMTM, FAUC, ELEC, EFCC, EILC, ECOC, EMTC, etc – these are own IP, same length as SAP T-codes but not SAP IP. SAP T-codes appear in comments, UI help text, error messages – need to replace with own IP in user-facing text, keep only in internal mapping table for reference if needed.

### B. SAP Movement Types – SAP Standard – Numeric Codes – Proprietary
| SAP Move Type | SAP Meaning | Found In | Own IP Code | Own IP Description |
|---------------|-------------|----------|-------------|--------------------|
| 101 | GR for PO | gr/page.tsx, movement-types, auto-account-determination, goodsReceiptService.ts | GR_PO / INBOUND_PO | Goods Receipt for Purchase Order – stock + value + |
| 102 | GR Reversal (for 101) | gr-reversal, movement-types | GR_PO_REV | GR Reversal |
| 103 | GR Blocked Stock | gr/page.tsx | GR_BLOCK | GR to Blocked Stock |
| 105 | Release Blocked Stock | – | GR_BLOCK_REL | Release Blocked |
| 122 | Return to Vendor | – | GR_RETURN | Return Delivery to Vendor |
| 124 | Return after GR? | – | GR_RETURN_POST | Return after posting |
| 261 | GI for Production Order (CO11N) | fico/auto-account-determination, pp | GI_PROD / ISSUE_PROD | Goods Issue for Production Order – stock - value - |
| 262 | GI Reversal for 261 | – | GI_PROD_REV | |
| 351 | Transfer Posting? | sto | TR_POST | Transfer Posting |
| 601 | PGI for Sales (VL02N) | auto-account-determination | GI_SALES / PGI_SALES | Goods Issue for Sales – COGS |
| 602 | PGI Reversal (VL09) | – | GI_SALES_REV | |
| 701 | PI Difference + | physical-inventory | PI_DIFF_PLUS | Physical Inventory Difference + |
| 702 | PI Difference - | – | PI_DIFF_MINUS | |
| etc | | | | |

**DB Impact:** movement-types table `code` column currently stores "101", "102" etc – SAP numeric – should be own IP like "GR_PO", "GR_REV" etc – but need mapping table to keep SAP compatibility if needed. Proposal: keep numeric as legacy alias, primary own IP code is GR_PO, etc, with `sap_alias` column for backward compat.

### C. SAP Account Determination Transaction Keys – SAP Proprietary (OBYC)
| SAP Key | SAP Meaning | Found In | Own IP Key | Own IP Description |
|---------|-------------|----------|------------|--------------------|
| BSX | Inventory Posting (GR) – stock + | auto-account-determination, gr, iv, schema | INV_POST / STOCK_POST | Inventory Posting – Dr Inventory |
| WRX | GR/IR Clearing | same | GRIR_CLEAR | GR/IR Clearing – Cr GR/IR on GR, Dr on IV |
| GBB | Offsetting Entry (GI) – 261, 601, etc | same | OFFSET / ISSUE_OFFSET | Offsetting – Cr Inventory on GI |
| PRD | Price Difference – PO vs MAP/Standard | invoiceVerificationService, schema | PRICE_DIFF | Price Difference – variance |
| BSV | Inventory Difference (PI) – 701/702 | movement-types | INV_DIFF | Inventory Difference |
| FRE | Freight (Landed Cost) | po, iv | FREIGHT | Freight |
| ZOL | Customs (Landed Cost) | po, iv | CUSTOMS | Customs |
| KDM | Exchange Rate Difference | fico | EXCH_DIFF | Exchange Difference |
| KOFI / KOFK | Revenue Account Determination (VKOA) – billing | sd/billing | REV_DET | Revenue Determination |
| VKOA | Revenue Account Determination T-Code | sd/billing | – | (T-Code) – own IP RBAC? |
| BSA etc | | | | |

**DB Impact:** `fin_auto_account_determination` table `transaction_key` column stores BSX, WRX, etc – SAP IP – should be own IP: INV_POST, GRIR_CLEAR, OFFSET, PRICE_DIFF, etc – with sap_alias column.

### D. SAP Field Names / Indicators – SAP Proprietary
| SAP Field | SAP Meaning | Found In | Own IP Field | Own IP Description |
|-----------|-------------|----------|--------------|--------------------|
| ELIKZ | Delivery Completed Indicator (PO line) | mmPurchaseOrder line, mmPoLine, index idx_po_line_elikz, goodsReceiptService.ts | delivery_completed (already own IP) but index name still elikz, comment still mentions ELIKZ | Keep column delivery_completed, rename index to idx_po_line_delivery_completed, remove ELIKZ from comments – use DELIV_COMPLETED as own IP code |
| UEBTO | Overdelivery Tolerance % | po line, pr? | overdelivery_tolerance_percent (already own IP) but comment mentions UEBTO | Keep column overdelivery_tolerance_percent, own IP OVER_TOL |
| UNTTO | Underdelivery Tolerance % | same | underdelivery_tolerance_percent | UNDER_TOL |
| K4 | Fiscal Year Variant (SAP) | fiscal-calendars, enterprise-config | – | FISC_VAR – keep K4 as example but own IP FFYC |
| K01, K02 etc | Account Groups? | – | – | – |

**DB Impact:** Column names already own IP (delivery_completed, overdelivery_tolerance_percent) – good – but indexes and comments still contain SAP names – need to rename indexes and clean comments.

### E. SAP Table Names in Comments – SAP Proprietary (Mentioned)
| SAP Table | SAP Meaning | Found In Comments | Own IP Table | Note |
|-----------|-------------|-------------------|--------------|------|
| MARA | Material Master General Data | schema comments | ent_material_master / mm_material | Already own IP table mm_material, ent_material_master – comment should not mention MARA |
| MARC | Material Master Plant Data | schema comments | mm_material_plant / ent_material_plant | Own IP |
| MSEG | Material Document Segment | gr, iv comments | mm_gr_line / mm_goods_receipt_line | Own IP |
| MKPF | Material Document Header | gr comments | mm_goods_receipt | Own IP |
| BKPF | Accounting Document Header | fi_document, universal ledger | fin_universal_ledger / fi_document | Own IP FULC |
| BSEG | Accounting Document Segment | same | fin_universal_ledger_line | Own IP |
| etc | | | | |

**DB Impact:** No SAP table names in actual DB – only in comments – need to clean comments.

### F. SAP Posting Keys, Document Types, etc
| SAP Term | Meaning | Found In | Own IP |
|----------|---------|----------|--------|
| 31, 40, 50 etc (posting keys) | Posting Keys | fico/posting-keys | Keep numeric but own IP POST_KEY |
| RE, KZ, etc (document types) | Document Types | fico/document-types | Own IP DOC_TYPE – e.g., INV_VENDOR, PAY_VENDOR |

### G. Other SAP Proprietary Terms in UI Messages
- "SAP standard", "SAP-like", "SAP standard requires PO", "T0 BLOCKING – SAP standard", "industry standard MM – SAP", etc – 100+ occurrences in UI pages – should be replaced with "industry standard" or "own IP standard" – already partially done per earlier instruction (UI does not need word SAP), but many still remain in code comments and messages.
- "ME21N", "MIGO 101", "MIRO", etc in user-facing messages – should be replaced with own IP codes: PPOC, IGRC, PIVC, etc – keep SAP alias only in tooltip if needed.

---

## 3. DB Schema Audit – Specific Tables/Columns/Indexes with SAP Names

**File: src/modules/mm/infrastructure/schema.ts**
- Table `mm_purchase_requisition` comment: "ME51N/ME52N/ME53N/ME54N" – SAP T-Codes – should be removed, use own IP PPRC.
- Table `mm_purchase_order` comment: "ME21N/ME22N/ME23N" – remove, use PPOC.
- Column `delivery_completed` – own IP good – but index `idx_po_line_elikz` – contains ELIKZ – SAP – rename to `idx_po_line_delivery_completed`
- Column `fiDocumentId` comment: "Auto BSX/WRX" – SAP keys – should be "Auto INV_POST/GRIR_CLEAR"
- Table `mm_goods_receipt` – comment? – uses 50* number – SAP-like but okay numeric.
- Table `mm_gr_line` – comment stock status – okay.
- Table `mm_stock_transport_order` comment: "ME27/MIGO/VL10B" – SAP – should be "PSTC/IGRC/SDLC"
- Columns `quantityIssued` comment "MIGO 351" – SAP move type – should be "TR_POST" or "GI_PROD"
- Columns `quantityReceived` comment "MIGO 101" – should be "GR_PO"

**File: src/modules/mm/infrastructure/procurementFoundationSchema.ts**
- Comment line 17: "mm_po_line → proc_po_line – ... deliveryCompleted was ELIKZ" – mentions ELIKZ – should be cleaned.
- Comment line 26: "Helper codes: PPRC PR Create (alias PRC, ME51N, FIN-PR-CR), PPOC PO Create (alias POC, ME21N, FIN-PO-CR), PGRC GR Create (alias GRC, MIGO, FIN-GR-CR), PIVC IV Create (alias IVC, MIRO, FIN-IV-CR), PSTC STO Create (alias STC, ME27), PIRC Info Record Create (alias IRC, ME11), PSRC Source List Create (alias SRC, ME01)" – contains SAP T-Codes ME51N, ME21N, MIGO, MIRO, ME27, ME11, ME01 – these are SAP – own IP already exists PPRC, PPOC, PGRC/IGRC, PIVC, PSTC, PIRC, PSRC – should keep own IP, move SAP aliases to separate mapping table not in primary comment, or keep only in alias list for reference but mark as legacy.
- Index `idx_proc_po_line_elikz` – contains ELIKZ – rename.
- Column `fiDocumentId` legacy alias comment "BSX/WRX" – replace.
- Column `quantityIssued` comment "MIGO 351" – replace.
- Column `quantityReceived` comment "MIGO 101" – replace.
- Column `universalLedgerId` comment "was fi_document_id – fin_universal_ledger FULC – RE + WRX clearing + BSX adjustment" – contains WRX, BSX – replace.

**File: src/modules/fico/infrastructure/schema.ts**
- Column `transactionKey` comment "BSX, WRX, GBB, PRD, BSA, etc" – SAP keys – should be own IP INV_POST, GRIR_CLEAR, OFFSET, PRICE_DIFF.
- Table `fin_auto_account_determination` – stores BSX, WRX, etc – SAP.

**File: src/modules/foundation/enterprise/infrastructure/productCatalogSchema.ts**
- Column `inventoryValuationClass` comment "was valuation_class – for FI auto determination BSX/WRX" – SAP – replace.

**File: src/modules/mm/application/goodsReceiptService.ts**
- Comments: "MIGO 101", "BSX/WRX", "ELIKZ", "ELIKZ set: short-shipment" – SAP – replace with own IP GR_PO, INV_POST/GRIR_CLEAR, DELIV_COMPLETED.

**File: src/modules/mm/application/invoiceVerificationService.ts**
- Comments: "PRD", "BSX", "WRX", "RE + WRX clearing + BSX adjustment" – SAP – replace.

**Indexes with SAP names:**
- `idx_po_line_elikz` → `idx_po_line_delivery_completed`
- `idx_proc_po_line_elikz` → `idx_proc_po_line_delivery_completed`
- Possibly others with `bsx`, `wrx` in name – none found, but check.

**Enums with SAP-like values:**
- `pr_status`, `po_status`, `gr_status`, `iv_status` – own IP, okay, not SAP.
- Movement type codes stored as "101" etc – SAP numeric – should be own IP.

---

## 4. UI Pages Audit – SAP Names in User-Facing Text

**Files: mm/po, pr, gr, iv, payment, etc**
- Many messages contain "SAP standard MIGO 101 requires PO", "SAP standard", "MIGO 101", "MIRO", "ME21N", "ME51N", "OB52", "OBYC", "OMJJ", "BSX/WRX", "ELIKZ", "UEBTO/UNTTO", "K4", etc – these are SAP proprietary – should be replaced with own IP in UI, keep SAP alias only in tooltip or help if needed for migration, but per instruction UI does not need word SAP.
- Example GR page: "SAP STANDARD – MIGO 101 REQUIRES PO REFERENCE – T0 BLOCKING" → should be "Industry Standard – GR_PO Requires PO Reference – T0"
- Example PO page: "PPOC ME21N" – contains SAP T-Code ME21N – should be "PPOC PO_CREATE" – own IP only.
- Example IV page: "PIVC MIRO" – should be "PIVC IV_CREATE"
- Example auto-account-determination: "BSX inventory posting GR 101 stock +, WRX GR/IR clearing, GBB offsetting 261 GI prod order CO11N + 601 PGI sales VL02N COGS, PRD price diff" – all SAP keys and move types and T-Codes – should be own IP: "INV_POST inventory posting GR_PO stock +, GRIR_CLEAR GR/IR clearing, OFFSET offsetting GI_PROD prod order + GI_SALES sales COGS, PRICE_DIFF price diff"

**Count:** 1248+ occurrences of SAP terms in UI – need systematic replacement.

---

## 5. Own IP Setup Proposal – Mapping Table – Don't Implement Yet

### 5.1 Movement Types – Own IP Master Table (proposed)
Create table `own_movement_type` (code FMTM – already own IP):
| Own IP Code | Description | Stock + / - | Value + / - | Account Modifier (Own IP) | SAP Legacy Alias | Reversal Own IP |
|-------------|-------------|-------------|-------------|---------------------------|------------------|-----------------|
| GR_PO | Goods Receipt for Purchase Order | + | + | INV_POST / GRIR_CLEAR | 101 | GR_PO_REV |
| GR_PO_REV | GR Reversal for PO | - | - | INV_POST / GRIR_CLEAR | 102 | – |
| GR_BLOCK | GR to Blocked Stock | + (blocked) | + | INV_POST / GRIR_CLEAR | 103 | GR_BLOCK_REL |
| GR_BLOCK_REL | Release Blocked Stock | + (unrestricted) - (blocked) | 0 | – | 105 | – |
| GR_RETURN | Return to Vendor | - | - | INV_POST / GRIR_CLEAR | 122 / 124 | – |
| GI_PROD | Goods Issue for Production Order | - | - | OFFSET / INV_POST | 261 | GI_PROD_REV |
| GI_PROD_REV | GI Reversal Prod Order | + | + | OFFSET / INV_POST | 262 | – |
| GI_SALES | Goods Issue for Sales (PGI) | - | - | OFFSET / INV_POST (COGS) | 601 | GI_SALES_REV |
| GI_SALES_REV | GI Reversal Sales (VL09) | + | + | OFFSET / INV_POST | 602 | – |
| TR_POST | Transfer Posting | + / - | 0 | – | 351 / 311 etc | – |
| PI_DIFF_PLUS | Physical Inventory Difference + | + | + | INV_DIFF | 701 | – |
| PI_DIFF_MINUS | Physical Inventory Difference - | - | - | INV_DIFF | 702 | – |
| etc | | | | | | |

**DB Change:** `movement_types` table code column currently stores "101" – migrate to own IP codes GR_PO etc, add column `sap_legacy_code` for backward compat.

### 5.2 Account Determination Keys – Own IP
Create table `own_account_determination_key` (code FAUC? Actually FAUC is valuation class, but own IP for auto acct is AUTO_ACCT):
| Own IP Key | Description | SAP Legacy Key | GL Impact | Used In |
|------------|-------------|----------------|-----------|---------|
| INV_POST | Inventory Posting – stock + | BSX | Dr Inventory | GR_PO |
| GRIR_CLEAR | GR/IR Clearing | WRX | Cr GR/IR on GR, Dr on IV | GR_PO, IV |
| OFFSET | Offsetting Entry – GI | GBB | Cr Inventory on GI, Dr COGS etc | GI_PROD, GI_SALES |
| PRICE_DIFF | Price Difference – PO vs MAP/Standard | PRD | Dr/Cr Price Diff | IV variance |
| INV_DIFF | Inventory Difference – PI | BSV | Dr/Cr Inv Diff | PI |
| FREIGHT | Freight – Landed Cost | FRE / FR1 etc | Dr Inventory / Cr Freight Clearing | PO, GR, IV |
| CUSTOMS | Customs – Landed Cost | ZOL | Dr Inventory / Cr Customs Clearing | PO, GR, IV |
| EXCH_DIFF | Exchange Rate Difference | KDM | Dr/Cr Exch Diff | FI |
| REV_DET | Revenue Determination | KOFI/KOFK | Cr Revenue | Billing |
| etc | | | | |

**DB Change:** `fin_auto_account_determination.transaction_key` currently BSX, WRX etc – migrate to INV_POST, GRIR_CLEAR etc, add `sap_legacy_key` column.

### 5.3 Field Indicators – Own IP
| Own IP Field | Description | SAP Legacy Field | DB Column (Already Own IP) | Index Rename |
|--------------|-------------|------------------|----------------------------|--------------|
| DELIV_COMPLETED | Delivery Completed – final flag – no further GR | ELIKZ | delivery_completed | idx_po_line_elikz → idx_po_line_delivery_completed, idx_proc_po_line_elikz → idx_proc_po_line_delivery_completed |
| OVER_TOL | Overdelivery Tolerance % | UEBTO | overdelivery_tolerance_percent | – |
| UNDER_TOL | Underdelivery Tolerance % | UNTTO | underdelivery_tolerance_percent | – |

### 5.4 Transaction Codes – Own IP Helper Codes (Already Existing – 4-char)
App already has own IP helper codes – these are own IP, not SAP – but SAP aliases still in comments/UI:
| Own IP Code | Own IP Title | SAP Legacy T-Code | SAP Meaning | Module | Route |
|-------------|--------------|-------------------|-------------|--------|-------|
| PPRC | Purchase Requisition Create | ME51N | Create PR | MM | /mm/pr |
| PPOC | Purchase Order Create | ME21N | Create PO | MM | /mm/po |
| IGRC / PGRC | Inventory Goods Receipt Create | MIGO | Goods Movement | MM | /mm/gr |
| PIVC | Purchase Invoice Verification Create | MIRO | Invoice Verification | MM | /mm/iv |
| PSTC | Stock Transport Order Create | ME27 | Create STO | MM | /mm/sto |
| PIRC | Purchase Info Record Create | ME11 | Create Info Record | MM | /mm/info-records |
| PSRC | Source List Create | ME01 | Create Source List | MM | /mm/source-lists |
| FPYP / FAPP | Payment Proposal / Payment | F110 / F-53 | Auto Payment / Vendor Payment | FI | /fico/payment |
| FNRC | Number Range | FBN1 | Number Ranges | FI | /fico/number-ranges |
| FPPE | Posting Period | OB52 | Posting Periods | FI | /fico/posting-periods |
| FMTM | Movement Type | OMJJ | Movement Types | FI | /fico/movement-types |
| FAUC | Auto Account Determination | OBYC | Auto Account | FI | /fico/auto-account-determination |
| ELEC | Legal Entity | OX02 | Company Code | Foundation | /foundation/legal-entities |
| EFCC | Facility / Plant | OX10 | Plant | Foundation | /foundation/facilities |
| EILC | Inventory Location / SLOC | OX09 | Storage Location | Foundation | /foundation/inventory-locations |
| EMTC | Material Master | MM01 / MM02 | Material Master | Foundation | /foundation/materials |
| etc | | | | | |

**Proposal:** Keep own IP codes as primary – 4-char – in UI, DB, API. SAP T-Codes move to `sap_legacy_alias` column in `functions` table or mapping table `sap_tcode_mapping` for migration reference only – not shown in primary UI, only in tooltip or docs if needed. Remove SAP T-Codes from user-facing labels, keep only own IP.

### 5.5 Posting Keys, Document Types – Own IP
| Own IP | SAP Legacy | Meaning |
|--------|------------|---------|
| DOC_TYPE_INV_VENDOR | RE | Vendor Invoice – MIRO |
| DOC_TYPE_PAY_VENDOR | KZ / ZP | Vendor Payment – F-53 |
| etc | | |

### 5.6 Table/Column Comments Cleanup
- Remove all mentions of MARA, MARC, MSEG, MKPF, BKPF, BSEG from comments – replace with own IP table names: ent_material_master, mm_goods_receipt, mm_gr_line, fin_universal_ledger, etc.
- Remove "SAP standard", "SAP-like", "SAP standard requires" from UI messages – replace with "Industry standard" or "Own IP standard" or just description without SAP word – per earlier instruction UI does not need word SAP.
- Keep "industry standard" in commits/docs as replacement for SAP.

---

## 6. Implementation Plan (Don't Implement Yet – For Future)

1. **DB Migration – Movement Types:**
   - Create new table `own_movement_type` or alter `movement_types`:
     - Add columns: `own_code` (GR_PO), `sap_legacy_code` (101), `description`, `stock_indicator`, `value_indicator`, `account_modifier` (INV_POST etc), `reversal_code` (GR_PO_REV)
   - Migrate existing data: 101 → GR_PO, 102 → GR_PO_REV, etc.
   - Update foreign keys in `mm_goods_receipt`, `mm_gr_line`, etc to use own_code.

2. **DB Migration – Account Determination Keys:**
   - Alter `fin_auto_account_determination`:
     - Add `own_transaction_key` (INV_POST), `sap_legacy_key` (BSX)
     - Migrate BSX → INV_POST, WRX → GRIR_CLEAR, GBB → OFFSET, PRD → PRICE_DIFF, BSV → INV_DIFF, FRE → FREIGHT, ZOL → CUSTOMS, KDM → EXCH_DIFF, KOFI/KOFK → REV_DET
   - Update all references in services: goodsReceiptService, invoiceVerificationService, etc to use own keys.

3. **DB Migration – Indexes:**
   - Rename `idx_po_line_elikz` → `idx_po_line_delivery_completed`
   - Rename `idx_proc_po_line_elikz` → `idx_proc_po_line_delivery_completed`
   - Check for other indexes with SAP names.

4. **Codebase – Comments & Messages:**
   - Search and replace in all src files:
     - "MIGO 101" → "GR_PO (legacy 101)"
     - "BSX/WRX" → "INV_POST/GRIR_CLEAR (legacy BSX/WRX)"
     - "ELIKZ" → "DELIV_COMPLETED (legacy ELIKZ)"
     - "ME21N" → "PPOC (legacy ME21N)"
     - "ME51N" → "PPRC (legacy ME51N)"
     - "MIRO" → "PIVC (legacy MIRO)"
     - "MIGO" → "IGRC (legacy MIGO)"
     - "OB52" → "FPPE (legacy OB52)"
     - "OBYC" → "FAUC (legacy OBYC)"
     - "OMJJ" → "FMTM (legacy OMJJ)"
     - "OX02" → "ELEC (legacy OX02)"
     - "OX10" → "EFCC (legacy OX10)"
     - etc.
   - Ensure UI does not show SAP T-Codes as primary – only own IP codes.

5. **Functions Table – Own IP Mapping:**
   - Table `functions` already has `code` (own IP) and `aliases` (includes SAP T-Codes?) – ensure aliases contain SAP T-Codes as legacy, but primary code is own IP.
   - Add column `sap_legacy_tcode` for explicit mapping.

6. **Documentation:**
   - Create `OWN_IP_MAPPING.md` (or add to PROJECT_LOG) with full mapping table SAP → Own IP – for future reference and migration.

7. **Testing:**
   - After migration, test E2E flow: PR → PO → GR → IV → Payment – using own IP codes – ensure no regression.

---

## 7. Full List of SAP Proprietary Names Found (Raw)

**From grep -rhoE:**
- BSX (279), WRX (251), GBB (147), OB52 (136), OBYC (135), K4 (121), PRD (113), MIGO (104), ME21N (96), F110 (85), MIRO (78), OX02 (77), VKOA (74), KOFI (73), ELIKZ (66), KOFK (60), KDM (59), ME51N (54), OMJJ (46), OX10 (42), F-53 (33), ME28 (31), FB05 (22), F-44 (17), MB51 (3), UNTTO (2), UEBTO (2)

**Additional from case-insensitive:**
- iDoc (139) – SAP IDoc – should be own IP DOC_EXCHANGE?
- BKPF (43), BSEG (5), MARA (6), MARC (16), MSEG (13), MKPF (4) – SAP table names in comments.

**Movement Type Numbers:**
- 101, 102, 103, 105, 122, 124, 261, 262, 351, 601, 602, 701, 702 – found in movement-types page, auto-account-determination, gr, iv, po, etc – these are SAP standard movement type numbers.

**Other SAP Terms in UI:**
- "SAP standard", "SAP-like", "SAP standard requires PO", "T0 BLOCKING – SAP standard", "industry standard MM – SAP", "SAP standard MIGO reference", "SAP standard – MIGO 101 Requires PO", etc – 100+ occurrences.

---

## 8. Own IP Setup – Final Proposed Codes (Summary)

**Movement Types Own IP (FMTM):**
- GR_PO, GR_PO_REV, GR_BLOCK, GR_BLOCK_REL, GR_RETURN, GI_PROD, GI_PROD_REV, GI_SALES, GI_SALES_REV, TR_POST, PI_DIFF_PLUS, PI_DIFF_MINUS

**Account Determination Own IP (FAUC):**
- INV_POST (was BSX), GRIR_CLEAR (was WRX), OFFSET (was GBB), PRICE_DIFF (was PRD), INV_DIFF (was BSV), FREIGHT (was FRE), CUSTOMS (was ZOL), EXCH_DIFF (was KDM), REV_DET (was KOFI/KOFK)

**Field Indicators Own IP:**
- DELIV_COMPLETED (was ELIKZ), OVER_TOL (was UEBTO), UNDER_TOL (was UNTTO)

**Transaction Codes Own IP (Helper Codes – 4-char – Already Existing):**
- PPRC (PR Create) – legacy ME51N
- PPOC (PO Create) – legacy ME21N
- IGRC (GR Create) – legacy MIGO
- PIVC (IV Create) – legacy MIRO
- PSTC (STO Create) – legacy ME27
- FPYP (Payment) – legacy F-53 / F110
- FNRC (Number Range) – legacy FBN1
- FPPE (Posting Period) – legacy OB52
- FMTM (Movement Type) – legacy OMJJ
- FAUC (Auto Account) – legacy OBYC
- ELEC (Legal Entity) – legacy OX02
- EFCC (Facility/Plant) – legacy OX10
- EILC (Inventory Location) – legacy OX09
- EMTC (Material) – legacy MM01
- etc – full list in FUNCTIONS table.

**DB Tables Own IP (Already Own IP – No SAP Table Names in Actual DB):**
- mm_purchase_requisition, mm_purchase_order, mm_po_line, mm_goods_receipt, mm_gr_line, mm_invoice, mm_invoice_line, fin_universal_ledger, fin_universal_ledger_line, etc – already own IP – good – only comments contain SAP table names – need cleanup.

---

## 9. Next Steps (Don't Implement Yet)

- Review this audit with owner.
- Confirm own IP codes for movement types and account determination keys – approve mapping table.
- Create migration scripts for DB – movement_types code and fin_auto_account_determination transaction_key – with sap_legacy columns.
- Rename indexes with SAP names.
- Clean comments and UI messages – replace SAP T-Codes and SAP terms with own IP, keep SAP legacy in alias/tooltip if needed for migration.
- Update FUNCTIONS table to ensure primary code is own IP, aliases include SAP T-Codes as legacy.
- Test E2E flow after migration.
- Update PROJECT_LOG.md with own IP mapping – Section 9.

---

**End of Audit – Ready for Review – No Implementation Done Yet**
