# Planned Implementation – Strict SAP-like Functions + One Code One Page

**Date:** 2026-09-29  
**User Decisions:**
- All codes → own dedicated page (40+ pages)
- All areas strict SAP-like (FICO field status, tolerance, doc types, OBYC, credit, costing, MM MRP, SD pricing/credit, PP production order/costing, HR payroll)
- Single page per code with mode param (create/change/display) – e.g., /foundation/materials?mode=create, change, display – like SAP MM01/MM02/MM03
- Related links auto from FK, bottom of form, low importance
- Keep both Modern (rounded-2xl, shadows) and Classic (dense, power-user)
- Remove sidebar – use separate tree structure page – navigation via tree page + related links + search palette

---

## 1. Navigation Redesign – Remove Sidebar, Tree Page

**Current:** `client-layout.tsx` has sidebar with groups

**New:**
- Remove sidebar component
- Create `/[companyCode]/navigator` – Tree Structure page – shows all modules in tree
- Tree structure:
  ```
  ERP Modular Monolith
  ├─ FOUNDATION (FND)
  │  ├─ Enterprise Structure
  │  │  ├─ ECGC Company Group OX16
  │  │  ├─ ELEC Legal Entity OX02
  │  │  ├─ EFCC Facility OX18
  │  │  ├─ EILC Inventory Location
  │  │  ├─ EPDC Procurement Division
  │  │  ├─ EBTC Buying Team
  │  │  ├─ ECOC Commercial Org
  │  │  ├─ ESCC Sales Channel
  │  │  ├─ EPLC Product Line
  │  │  ├─ EPUC Commercial Unit
  │  │  ├─ ECUC Commercial Unit Assignment
  │  │  ├─ EBSC Profit Center Assignment
  │  │  ├─ EWSC Warehouse Site
  │  │  ├─ EDPC Distribution Path
  │  │  ├─ FCPC Credit Policy Area OB45
  │  │  └─ ECAC Enterprise Config
  │  ├─ Materials
  │  │  ├─ EMTC Product Create MM01
  │  │  ├─ EMTE Product Change MM02 (mode=change)
  │  │  ├─ EMTV Product Display MM03 (mode=display)
  │  │  ├─ EMTL Product List MM60 (mode=list)
  │  │  ├─ EMTP Product Types OMS2
  │  │  ├─ EMGC Product Categories OMSF
  │  │  ├─ EUOC UOM CUNI
  │  │  ├─ ELTC Lots/Batch MSC3N
  │  │  └─ ISTV Stock Overview MMBE
  │  └─ Partners
  │     ├─ EPAC Partner Account BP
  │     ├─ PSUC Supplier XK01
  │     ├─ SCUC Customer XD01
  │     └─ EPCC Partner Contact
  ├─ FICO
  │  ├─ FFYC Fiscal Calendar OB29 – FROM_DATE/TO_DATE
  │  ├─ FEXC Exchange Rates OB08 – FROM/TO CURRENCY + RATE
  │  ├─ FNRC Number Ranges FBN1 – OBJECT_TYPE, PREFIX, FISCAL_YEAR
  │  ├─ FTGC Tax Groups – GROUP_CODE, RATE
  │  ├─ FTXC Tax Codes FTXP – CODE, RATE, GL_ACCOUNT
  │  ├─ FCOA Chart of Accounts OB13 – CODE, NAME
  │  ├─ FGLC GL Accounts FS00 – ACCOUNT_NUMBER, COA_CODE
  │  ├─ FCCA Cost Centers KS01 – CODE, COMPANY_CODE
  │  ├─ FCYC Currencies OY03 – CODE, NAME
  │  ├─ FPPC/OBBO Posting Period Variant
  │  ├─ FPPE/OB52 Posting Period Open/Close
  │  ├─ OBC4 Field Status Variant – NEW – FIELD_STATUS_VARIANT
  │  ├─ OBC5 Field Status Groups – NEW – FIELD_STATUS_GROUP
  │  ├─ OBA0 Tolerance Groups GL – NEW
  │  ├─ OBA4 Tolerance Customer/Vendor – NEW
  │  ├─ OBA7 Document Types – NEW – DOC_TYPE, NUMBER_RANGE
  │  ├─ OBYC Auto Account Determination – NEW – TRANSACTION_KEY BSX/WRX
  │  ├─ FAPT Payment Terms – NEW
  │  └─ CCUL/CCRP Costing Reports
  ├─ MM
  │  ├─ PPRC PR Create ME51N
  │  ├─ PPRE PR Change ME52N (mode=change)
  │  ├─ PPRV PR Display ME53N (mode=display)
  │  ├─ PPOC PO Create ME21N
  │  ├─ PPOE PO Change ME22N
  │  ├─ PPOV PO Display ME23N
  │  ├─ IGRC GR 101 MIGO
  │  ├─ GRRE GR Reversal MIGO 102
  │  ├─ PIVC IV MIRO
  │  ├─ IVRE IV Reversal MR8M
  │  ├─ PSTC STO Create ME27
  │  ├─ PSTD STO Delivery VL10B
  │  ├─ IPIC PI Create MI01
  │  ├─ IPIE PI Count MI04
  │  └─ IPIP PI Post MI07
  ├─ SD
  │  ├─ SSOC SO Create VA01
  │  ├─ SSOE SO Change VA02
  │  ├─ SSOV SO Display VA03
  │  ├─ SDLC Delivery VL01N
  │  ├─ SBLC Billing VF01
  │  ├─ BLRE Billing Reversal VF11
  │  └─ Pricing Procedure – NEW – PRICING
  ├─ PP
  │  ├─ MBMC BOM CS01
  │  ├─ MRTC Routing CA01
  │  ├─ MWCC Work Center CR01
  │  ├─ MMOC Production Order CO01 – NEW strict
  │  ├─ MMRP MRP MD01 – NEW strict net calc
  │  └─ MKTC Kitting
  └─ HR
     ├─ HHEC HR Master PA30
     ├─ HHEV HR Display PA20
     └─ HPYC Payroll Run PC00 – NEW wage calc
  ```

- Navigator page has search filter, modern/classic toggle persisted via localStorage, tree expand/collapse
- Each code row shows: code badge, SAP alias, description, count, link to dedicated page
- Top bar: company code selector, modern/classic toggle, navigator link, search palette (CMD+K)

---

## 2. One Code One Page – Dedicated Pages List (40+)

### Foundation – Enterprise Structure (Currently 16 forms in one page – split)

| Code | SAP | Dedicated Page | FK Dependencies (Related Links auto) |
|------|-----|----------------|--------------------------------------|
| ECGC | OX16 | /foundation/company-groups | None – root |
| ELEC | OX02 | /foundation/legal-entities | ECGC Company Group, FCYC Currency, FFYC Fiscal Calendar, FPPC Posting Period Variant |
| EFCC | OX18 | /foundation/facilities | ELEC Legal Entity, FCYC Currency |
| EILC | - | /foundation/inventory-locations | EFCC Facility, ELEC Legal Entity |
| EPDC | - | /foundation/procurement-divisions | ELEC Legal Entity |
| EBTC | - | /foundation/buying-teams | EPDC Procurement Division |
| ECOC | - | /foundation/commercial-orgs | ELEC Legal Entity |
| ESCC | - | /foundation/sales-channels | ECOC Commercial Org |
| EPLC | - | /foundation/product-lines | ESCC Sales Channel |
| EPUC | - | /foundation/commercial-units | ECOC, ESCC, EPLC |
| ECUC | - | /foundation/commercial-unit-assign | EPUC, ELEC |
| EBSC | - | /foundation/profit-center-assign | ELEC, FCCA Cost Center |
| EWSC | - | /foundation/warehouse-sites | EFCC Facility, EILC Inventory Location |
| EDPC | - | /foundation/distribution-paths | ESCC, EPLC |
| FCPC | OB45 | /foundation/credit-policy-areas | ELEC Legal Entity – will add CREDIT_LIMIT, RISK_CATEGORY |
| ECAC | - | /foundation/enterprise-config | All above – overview |

Each page:
- Top: code badge ECGC + SAP alias OX16 + title + count (e.g., 3 Company Groups)
- Middle: single form – CODE*, NAME*, etc. – mode handling:
  - ?mode=create (default) – empty form, CREATE button
  - ?mode=change – DbAutocomplete to select existing code, form populated, SAVE button
  - ?mode=display – select + read-only display
  - ?mode=list – table list (for EMTL, etc.)
- Border colors: yellow empty, green valid, red invalid – via DbAutocomplete validation
- Bottom: Related Masters – auto from FK – e.g., ELEC page shows ECGC, FCYC, FFYC, FPPC links with code badges + "Create via ECGC" – low importance, small text, muted
- Modern: rounded-2xl, shadows, nice inputs, better spacing
- Classic: dense, power-user, no-nonsense, field names exact SAP-like, table list

### Foundation – Materials & Partners

| Code | SAP | Dedicated Page | FK |
|------|-----|----------------|----|
| EMTC | MM01 | /foundation/materials | EMTP Material Type, EUOC UOM, EMGC Category |
| EMTE | MM02 | /foundation/materials?mode=change | Same – change mode |
| EMTV | MM03 | /foundation/materials?mode=display | Display mode |
| EMTL | MM60 | /foundation/materials?mode=list | List mode |
| EMTP | OMS2 | /foundation/material-types | None |
| EMGC | OMSF | /foundation/material-categories | None |
| EUOC | CUNI | /foundation/uom | None |
| ELTC | MSC3N | /foundation/lots | EMTC Material, EFCC Facility |
| ISTV | MMBE | /foundation/stock | EMTC Material, EFCC Facility, EILC Location |
| EPAC | BP | /foundation/partners | None |
| PSUC | XK01 | /foundation/suppliers | EPAC Partner, EPDC Procurement Div |
| SCUC | XD01 | /foundation/customers | EPAC Partner, ECOC Commercial Org, FCPC Credit Policy |
| EPCC | - | /foundation/partner-contacts | EPAC Partner |

### FICO – Strict SAP-like

| Code | SAP | Dedicated Page | Strict Implementation Needed |
|------|-----|----------------|------------------------------|
| FFYC | OB29 | /fico/fiscal-calendars | Already FROM_DATE/TO_DATE, start_month/end_month/year_shift – keep |
| FEXC | OB08 | /fico/exchange-rates | Already FROM_CURR/TO_CURR/RATE/FROM_DATE/TO_DATE – keep |
| FNRC | FBN1 | /fico/number-ranges | Already OBJECT_TYPE/PREFIX/CURRENT/FISCAL_YEAR – add FOR UPDATE locking |
| FTGC | - | /fico/tax-groups | GROUP_CODE, RATE – keep |
| FTXC | FTXP | /fico/tax-codes | CODE, RATE, GL_ACCOUNT – add TAX_CALC engine used in PO/SO/BL |
| FCOA | OB13 | /fico/chart-of-accounts | CODE, NAME – keep |
| FGLC | FS00 | /fico/gl-accounts | ACCOUNT_NUMBER, COA_CODE, ACCOUNT_TYPE – keep |
| FCCA | KS01 | /fico/cost-centers | CODE, COMPANY_CODE – keep |
| FCYC | OY03 | /fico/currencies | CODE, NAME, SYMBOL – keep |
| FPPC | OBBO | /fico/posting-period-variants | CODE, NAME – keep |
| FPPE | OB52 | /fico/posting-periods | VARIANT_CODE, ACCOUNT_TYPE, FROM_PERIOD/YEAR, TO_PERIOD/YEAR, is_open – keep + enforcement done |
| **OBC4** | OBC4 | /fico/field-status-variants | **NEW** – VARIANT_CODE, NAME – controls field status per company code |
| **OBC5** | OBC5 | /fico/field-status-groups | **NEW** – GROUP_CODE, VARIANT_CODE, FIELD_NAME, STATUS (required/suppressed/optional/display) – e.g., cost center required for expense GL |
| **OBA0** | OBA0 | /fico/tolerance-groups-gl | **NEW** – GROUP_CODE, COMPANY_CODE, AMOUNT, PERCENT – tolerance for GL posting differences |
| **OBA4** | OBA4 | /fico/tolerance-groups-cv | **NEW** – GROUP_CODE, COMPANY_CODE, ACCOUNT_TYPE (D/K), AMOUNT, PERCENT – tolerance for customer/vendor payment differences |
| **OBA7** | OBA7 | /fico/document-types | **NEW** – DOC_TYPE (SA/KA/KG/etc), NAME, NUMBER_RANGE_CODE (FNRC), FIELD_STATUS_VARIANT, REVERSE_DOC_TYPE – e.g., SA → GL posting, KA → vendor invoice |
| **OBYC** | OBYC | /fico/auto-account-determination | **NEW** – TRANSACTION_KEY (BSX inventory, WRX GR/IR, GBB offset, etc), CHART_OF_ACCOUNTS, VALUATION_CLASS, GL_ACCOUNT – auto GL for GR 101: debit BSX, credit WRX |
| **FAPT** | - | /fico/payment-terms | **NEW** – CODE, NAME, DAYS, DISCOUNT_PERCENT, DISCOUNT_DAYS – used in PO/SO/IV/BL |
| CCUL | KSB1 | /fico/cca-report | Keep basic report |
| CCRP | CK40N | /fico/costing-run | **NEW strict** – cost rollup via BOM+Routing+Work Center rates |

### MM – Strict

| Code | SAP | Dedicated Page | Strict Implementation |
|------|-----|----------------|----------------------|
| PPRC | ME51N | /mm/pr | Keep + posting period M + field status OBC4 + tolerance |
| PPRE | ME52N | /mm/pr?mode=change | Change mode – edit lines if not yet ordered |
| PPRV | ME53N | /mm/pr?mode=display | Display mode – read-only |
| PPOC | ME21N | /mm/po | Keep + posting period K + OBC4 + tolerance + pricing + OBYC? |
| PPOE | ME22N | /mm/po?mode=change | Change mode – editable until GR |
| PPOV | ME23N | /mm/po?mode=display | Display |
| IGRC | MIGO 101 | /mm/gr | Keep + posting period M + OBYC auto GL BSX/WRX + document type |
| GRRE | MIGO 102 | /mm/gr-reversal | Reversal 102 – keep |
| PIVC | MIRO | /mm/iv | Keep + posting period K + OBA4 tolerance + OBYC |
| IVRE | MR8M | /mm/iv-reversal | Reversal MR8M – keep |
| PSTC | ME27 | /mm/sto | Keep + OBYC for STO |
| PSTD | VL10B | /mm/sto-delivery | **NEW** – delivery for STO – create outbound delivery for STO |
| IPIC | MI01 | /mm/physical-inventory | Keep |
| IPIE | MI04 | /mm/physical-inventory?mode=count | **NEW** – enter count |
| IPIP | MI07 | /mm/physical-inventory?mode=post | **NEW** – post differences + OBYC |

### SD – Strict

| Code | SAP | Dedicated Page | Strict Implementation |
|------|-----|----------------|----------------------|
| SSOC | VA01 | /sales | Keep + posting period D + OB45 credit check + pricing + OBA7 doc type |
| SSOE | VA02 | /sales?mode=change | Change mode |
| SSOV | VA03 | /sales?mode=display | Display |
| SDLC | VL01N | /sd/delivery | Keep + posting period M + OBYC |
| SBLC | VF01 | /sd/billing | Keep + posting period D + OB45 credit + pricing + tax calc + OBYC |
| BLRE | VF11 | /sd/billing-reversal | Reversal – keep |
| **PRIC** | - | /sd/pricing-procedure | **NEW** – CONDITION_TYPE, SEQUENCE, GL_ACCOUNT – pricing for SO/BL |

### PP – Strict

| Code | SAP | Dedicated Page | Strict Implementation |
|------|-----|----------------|----------------------|
| MBMC | CS01 | /pp/bom | Keep |
| MRTC | CA01 | /pp/routings | Keep |
| MWCC | CR01 | /pp/work-centers | Keep + cost rate |
| **MMOC** | CO01 | /pp/production-orders | **NEW strict** – production order header + operations from routing + components from BOM + status (CRTD/REL/CNF) |
| **MMRP** | MD01 | /pp/mrp | **NEW strict** – net requirements calc: demand (SO) – supply (stock, PO, prod order) = planned order/PR |
| MKTC | KITTING | /pp/kitting | Keep |

### HR – Strict

| Code | SAP | Dedicated Page | Strict Implementation |
|------|-----|----------------|----------------------|
| HHEC | PA30 | /hr/payroll?mode=maintain | Maintain – keep |
| HHEV | PA20 | /hr/payroll?mode=display | Display |
| **HPYC** | PC00 | /hr/payroll-run | **NEW** – wage type calc, deductions, net pay |

---

## 3. Page Template – One Code One Form

**For each dedicated page, template:**

```
Top Bar:
- Breadcrumb: Navigator > FOUNDATION > Company Groups
- Code Badge: ECGC (yellow) + SAP Alias OX16 (gray) + Count Badge 3
- Title: Company Groups
- Mode Tabs: Create | Change | Display | List (if applicable) – activeTab switching works in both Modern/Classic
- Modern/Classic Toggle – persisted localStorage

Middle – Single Form:
- Modern:
  - Card rounded-2xl shadow-lg p-6
  - Inputs with border-2: yellow-300 empty, green-400 valid, red-400 invalid
  - Labels with * required, tooltip with SAP-like description
  - DbAutocomplete with code badge, validation, createUrl
  - Buttons short: "Create Company Group" (not "Create Company Group ECGC") – code in heading badge
  - Better spacing, grid cols 2 for form, responsive
- Classic:
  - Dense, power-user, no-nonsense
  - Field names exact SAP-like (COMPANY_GROUP_CODE, etc.)
  - Table list below form
  - No rounded, minimal shadows

Bottom – Related Masters (low importance):
- Section title: Related Masters – muted text sm
- Auto from FK dependencies:
  - For ELEC: Company Group ECGC (OX16) – 3 groups – Create via ECGC → /foundation/company-groups
  - Currency FCYC (OY03) – 1 currency INR – Create via FCYC → /fico/currencies
  - Fiscal Calendar FFYC (OB29) – K4, V3 – Create via FFYC → /fico/fiscal-calendars
  - Posting Period Variant FPPC (OBBO) – 1000 – Create via OBBO → /fico/posting-period-variants
- Links: code badge + count + arrow, small, not prominent
- Also manual curated: e.g., Material page also links to BOM CS01, Routing CA01, Stock MMBE

Footer:
- Generic © 2026 ERP Modular Monolith • MIT – no personal name
```

---

## 4. Strict SAP-like Functions Implementation – Phased

### Phase 1 – FICO Core (Most Inferior)

1. **OBA7 Document Types**
   - Table: fi_document_type – code (SA/KA/KG/SD etc), name, number_range_code (FK FNRC), field_status_variant, reverse_doc_type
   - API: /api/document-types – CRUD
   - Enforcement: When creating document, validate doc_type exists, get number range from doc_type, not from object_type
   - UI: /fico/document-types – CODE*, NAME*, NUMBER_RANGE_CODE* (DbAutocomplete FNRC), FIELD_STATUS_VARIANT, REVERSE_DOC_TYPE

2. **OBYC Auto Account Determination**
   - Table: fi_auto_account – transaction_key (BSX inventory, WRX GR/IR, GBB offset, etc), chart_of_accounts, valuation_class, gl_account, company_code
   - API: /api/auto-accounts – CRUD
   - Enforcement: In GR 101 – when posting, auto-create FI doc: debit BSX inventory GL (from OBYC via material valuation class + chart), credit WRX GR/IR GL
   - In IV – debit WRX GR/IR, credit vendor
   - In Billing – debit customer, credit revenue
   - UI: /fico/auto-account-determination – TRANSACTION_KEY*, COA_CODE*, VALUATION_CLASS, GL_ACCOUNT* (DbAutocomplete FGLC)

3. **OBA0/OBA4 Tolerance**
   - Tables: fi_tolerance_group_gl, fi_tolerance_group_cv – group_code, company_code, amount, percent, account_type
   - API: /api/tolerance-groups – CRUD
   - Enforcement: In IV – if invoice amount vs PO amount difference within tolerance, allow posting
   - In Payment – if payment vs open invoice difference within tolerance, allow clearing
   - UI: /fico/tolerance-groups-gl, /fico/tolerance-groups-cv

4. **OB45 Credit Control**
   - Table: Enhance fcpc / credit-policy-areas – add credit_limit, risk_category, currency
   - Table: customer_credit – customer_code, credit_policy_area, credit_limit, credit_exposure, risk
   - API: /api/customer-credit – CRUD + exposure calc
   - Enforcement: In SO Create – check customer credit exposure + new order value vs credit limit – if exceeds, block or warning per risk category
   - UI: /foundation/credit-policy-areas – add CREDIT_LIMIT, RISK_CATEGORY, CURRENCY

5. **OBC4/OBC5 Field Status**
   - Tables: fi_field_status_variant, fi_field_status_group – variant_code, group_code, field_name, status (R required, S suppressed, O optional, D display)
   - API: /api/field-status – CRUD
   - Enforcement: In GL posting – if GL account has field status group that requires cost center, validate cost center present
   - In Document posting – check field status per doc type + GL account
   - UI: /fico/field-status-variants, /fico/field-status-groups

### Phase 2 – MM/SD/PP Strict

6. **Pricing Procedure (SD/MM)**
   - Table: sd_pricing_procedure – condition_type (PR00 price, K007 discount, etc), sequence, calculation, GL account
   - Enforcement: In SO/PO – calculate pricing based on condition types
   - UI: /sd/pricing-procedure

7. **Production Order CO01 Strict**
   - Table: pp_production_order – order_number, material_code, plant, quantity, status (CRTD/REL/CNF/TECO), routing_code, bom_code
   - Enforcement: Create production order from planned order, release, confirm operations, goods movement 261/101
   - UI: /pp/production-orders – dedicated page with operations + components

8. **MRP MD01 Strict Net Calc**
   - Table: pp_mrp_run – material, plant, demand (SO), supply (stock, PO, prod order), net requirement, planned order
   - Enforcement: MRP run calculates net requirements and creates planned orders/PRs
   - UI: /pp/mrp – MRP run + stock req list MD04

9. **STO Delivery VL10B**
   - Table: mm_sto_delivery – delivery_number, sto_number, from_plant, to_plant, material, quantity
   - Enforcement: Process STO delivery – creates outbound delivery for STO
   - UI: /mm/sto-delivery – dedicated

10. **Physical Inventory Count/Post**
    - Tables: mm_physical_inventory_count, mm_physical_inventory_post
    - Enforcement: MI04 enter count, MI07 post differences + OBYC
    - UI: /mm/physical-inventory?mode=count/post – now real forms

### Phase 3 – HR + Costing

11. **Payroll Run PC00**
    - Table: hr_payroll_run – employee, wage_type, amount, deduction, net
    - Enforcement: Payroll run calculates gross/net via wage types
    - UI: /hr/payroll-run

12. **Costing Run CK40N**
    - Table: co_costing_run – material, bom, routing, work center rate, cost component
    - Enforcement: Cost rollup via BOM + routing + work center
    - UI: /fico/costing-run – strict

---

## 5. File Structure – New Pages

```
src/app/(erp)/[companyCode]/
├─ navigator/page.tsx – Tree structure, no sidebar
├─ foundation/
│  ├─ company-groups/page.tsx – ECGC OX16
│  ├─ legal-entities/page.tsx – ELEC OX02
│  ├─ facilities/page.tsx – EFCC OX18
│  ├─ inventory-locations/page.tsx – EILC
│  ├─ procurement-divisions/page.tsx – EPDC
│  ├─ buying-teams/page.tsx – EBTC
│  ├─ commercial-orgs/page.tsx – ECOC
│  ├─ sales-channels/page.tsx – ESCC
│  ├─ product-lines/page.tsx – EPLC
│  ├─ commercial-units/page.tsx – EPUC
│  ├─ commercial-unit-assign/page.tsx – ECUC
│  ├─ profit-center-assign/page.tsx – EBSC
│  ├─ warehouse-sites/page.tsx – EWSC
│  ├─ distribution-paths/page.tsx – EDPC
│  ├─ credit-policy-areas/page.tsx – FCPC OB45 – add credit limit
│  ├─ enterprise-config/page.tsx – ECAC – overview with links
│  ├─ materials/page.tsx – EMTC/MM01 + modes change/display/list
│  ├─ material-types/page.tsx – EMTP/OMS2
│  ├─ material-categories/page.tsx – EMGC/OMSF
│  ├─ uom/page.tsx – EUOC/CUNI
│  ├─ lots/page.tsx – ELTC/MSC3N
│  ├─ stock/page.tsx – ISTV/MMBE
│  ├─ partners/page.tsx – EPAC/BP
│  ├─ suppliers/page.tsx – PSUC/XK01
│  ├─ customers/page.tsx – SCUC/XD01
│  └─ partner-contacts/page.tsx – EPCC
├─ fico/
│  ├─ fiscal-calendars/page.tsx – FFYC/OB29
│  ├─ exchange-rates/page.tsx – FEXC/OB08
│  ├─ number-ranges/page.tsx – FNRC/FBN1
│  ├─ tax-groups/page.tsx – FTGC
│  ├─ tax-codes/page.tsx – FTXC/FTXP
│  ├─ chart-of-accounts/page.tsx – FCOA/OB13
│  ├─ gl-accounts/page.tsx – FGLC/FS00
│  ├─ cost-centers/page.tsx – FCCA/KS01
│  ├─ currencies/page.tsx – FCYC/OY03
│  ├─ posting-period-variants/page.tsx – FPPC/OBBO
│  ├─ posting-periods/page.tsx – FPPE/OB52
│  ├─ field-status-variants/page.tsx – OBC4 – NEW
│  ├─ field-status-groups/page.tsx – OBC5 – NEW
│  ├─ tolerance-groups-gl/page.tsx – OBA0 – NEW
│  ├─ tolerance-groups-cv/page.tsx – OBA4 – NEW
│  ├─ document-types/page.tsx – OBA7 – NEW
│  ├─ auto-account-determination/page.tsx – OBYC – NEW
│  ├─ payment-terms/page.tsx – FAPT – NEW
│  ├─ cca-report/page.tsx – CCUL/KSB1
│  └─ costing-run/page.tsx – CCRP/CK40N – strict
├─ mm/
│  ├─ pr/page.tsx – PPRC/ME51N + modes
│  ├─ po/page.tsx – PPOC/ME21N + modes
│  ├─ gr/page.tsx – IGRC/MIGO 101 + modes
│  ├─ gr-reversal/page.tsx – GRRE/MIGO 102
│  ├─ iv/page.tsx – PIVC/MIRO + modes
│  ├─ iv-reversal/page.tsx – IVRE/MR8M
│  ├─ sto/page.tsx – PSTC/ME27
│  ├─ sto-delivery/page.tsx – PSTD/VL10B – NEW
│  └─ physical-inventory/page.tsx – IPIC/MI01 + modes count/post
├─ sales/
│  └─ page.tsx – SSOC/VA01 + modes
├─ sd/
│  ├─ delivery/page.tsx – SDLC/VL01N
│  ├─ billing/page.tsx – SBLC/VF01
│  ├─ billing-reversal/page.tsx – BLRE/VF11
│  └─ pricing-procedure/page.tsx – NEW
├─ pp/
│  ├─ bom/page.tsx – MBMC/CS01
│  ├─ routings/page.tsx – MRTC/CA01
│  ├─ work-centers/page.tsx – MWCC/CR01
│  ├─ production-orders/page.tsx – MMOC/CO01 – NEW strict
│  ├─ mrp/page.tsx – MMRP/MD01 – NEW strict
│  └─ kitting/page.tsx – MKTC
└─ hr/
   ├─ payroll/page.tsx – HHEC/PA30 + modes
   └─ payroll-run/page.tsx – HPYC/PC00 – NEW strict
```

---

## 6. Implementation Steps

1. **Remove sidebar** – edit client-layout.tsx – remove sidebar, add top bar with Navigator link + company code + modern/classic toggle
2. **Create navigator page** – /[companyCode]/navigator – tree structure with all codes, search, counts from APIs
3. **Split enterprise-structure page** – create 15 dedicated pages from enterprise-structure – each with single form – keep enterprise-structure as hub that redirects to navigator or shows overview with links
4. **Update FUNCTIONS** – route field to point to dedicated pages, not hub with tab
5. **Create new FICO strict pages** – OBC4, OBC5, OBA0, OBA4, OBA7, OBYC, FAPT – with APIs and tables
6. **Enforce strict logic** – OBYC auto GL in GR/IV/BL, OB45 credit check in SO, OBA0 tolerance in payment, OBA7 doc type number range, OBC4 field status in GL posting
7. **Split MM/SD/PP pages** – ensure each has mode handling create/change/display/list – not just create
8. **Build and push** – each phase build passes

---

## 7. Open Questions Resolved

- All codes separate page – yes, 40+ pages
- All areas strict – yes, phased FICO first
- Single page with modes – yes, ?mode=create/change/display/list – classic tabs work
- Related links auto FK bottom low importance – yes
- Modern/Classic both – yes, persisted localStorage
- Remove sidebar, tree page – yes, navigator page replaces sidebar

---

**Next: Start coding – Phase 0: Remove sidebar + Create navigator tree page**
