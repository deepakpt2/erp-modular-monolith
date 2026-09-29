# ERP Modular Monolith – Implementation & Testing Guide (UI Only)

**Date:** 2026-09-29  
**Mode:** Modern (rounded-2xl) / Classic (power-user) – mode persists via localStorage `erp-view-mode`  
**Company Code for testing:** `1000` or `KS01` – use in URL `/{companyCode}/...`

This guide lists **exact order to create masters** – a field that requires data from another table must be created first. All foreign key fields now use **DbAutocomplete from DB only** – border turns **yellow** when required empty, **green** when valid, **red** when illegal. Label shows **CODE badge** (e.g., ECGC) not count. Dropdown shows `Use ECGC to add new COMPANY_GROUP_CODE` when no match.

---

## 0. Pre-check – Empty DB

- Login → Home shows modules: FOUNDATION, FICO, MM, SD, PP, HR
- All counts should be 0 initially
- Classic/Modern toggle persists across pages (localStorage)

---

## Phase 1 – Foundation – Must be first

### 1. Currencies – FCYC – `/1000/fico/currencies`
**Dependencies:** None – base master  
**Values:**
- CODE: `INR`, NAME: `Indian Rupee`, SYMBOL: `₹`
- CODE: `USD`, NAME: `US Dollar`, SYMBOL: `$`
- CODE: `EUR`, NAME: `Euro`, SYMBOL: `€`
- CODE: `KWD`, NAME: `Kuwaiti Dinar`
- CODE: `AED`, NAME: `UAE Dirham`
**UI:** Input CODE (uppercase), NAME, SYMBOL → **Create Currency** (button short, code badge FCYC in heading)

### 2. Fiscal Calendars – FFYC – `/1000/fico/fiscal-calendars` (also `/1000/fico/posting-period?focus=FFYC`)
**Dependencies:** None – must exist before ELEC  
**Values:**
- CODE: `K4`, NAME: `April-March India`, DESCRIPTION: `Apr 01 – Mar 31 India fiscal`
- CODE: `V3`, NAME: `Calendar Year`, DESCRIPTION: `Jan 01 – Dec 31`
- CODE: `K1`, NAME: `Jan-Dec Variant`
**UI:** Autocomplete not needed (master). If you try ELEC with `K6` invalid, border red + error `Valid: K4, V3, K1`

### 3. Company Groups – ECGC – `/1000/foundation/enterprise-structure` Tab: Company Group & Legal Entity → Form ECGC
**Dependencies:** TENANT_CODE = `TEN-100` (default tenant from `/api/tenants` – autocomplete TENANT_CODE badge TENANT)  
**Values:**
- CODE: `ISL`, NAME: `Indus Spice Labs Group`, TENANT_CODE: `TEN-100` (select from dropdown – green border when valid), DESCRIPTION: `Parent group`
- CODE: `GRP1`, NAME: `Group One`, TENANT_CODE: `TEN-100`
**UI:** CODE * yellow if empty → type ISL → dropdown shows ISL if exists, else `Use ECGC to add new COMPANY_GROUP` → **Create Company Group** (short button)

### 4. Legal Entities – ELEC – Same page Tab Company
**Dependencies:** COMPANY_GROUP_CODE from ECGC, CURRENCY_CODE from FCYC, FISCAL_CALENDAR_CODE from FFYC, COUNTRY from `/api/countries`  
**Values:**
- CODE: `LE-2000`, NAME: `Indus Spice Labs`, COMPANY_GROUP_CODE: `ISL` (autocomplete – must select existing ISL, border green when valid, red if K6 or XYZ invalid), CURRENCY_CODE: `INR` (autocomplete FCYC), COUNTRY: `IN` (autocomplete COUNTRY badge COUNTRY – shows IN India), CITY: `Kochi`, FISCAL_CALENDAR_CODE: `K4` (autocomplete FFYC – must be K4/V3/K1, red if K6), TAX_ID: `GSTIN123`, DESCRIPTION: `Main legal entity`
**Test invalid:** Type COMPANY_GROUP_CODE `XYZ` → border red + dropdown `Invalid – XYZ not found – Use ECGC to add new COMPANY_GROUP_CODE` + button `+ Add XYZ via ECGC` → save rejected 400
**Button:** `Create Legal Entity` (code ELEC in heading badge)

### 5. Control Areas – ECOC – Tab Control Area & Credit Policy → Form ECOC
**Dependencies:** CURRENCY_CODE from FCYC  
**Values:** CODE: `CA-1000`, NAME: `Control Area 1000`, CURRENCY_CODE: `INR` (autocomplete FCYC)

### 6. Credit Policy Areas – FCPC – Same tab
**Dependencies:** None  
**Values:** CODE: `CP-01`, NAME: `Credit Policy 01`

---

## Phase 2 – Facility & Logistics

### 7. Facilities – EFCC – Tab Facility & Inventory & Warehouse & Dispatch → Form EFCC
**Dependencies:** LEGAL_ENTITY_CODE from ELEC  
**Values:** CODE: `FAC-2000`, NAME: `Main Plant`, LEGAL_ENTITY_CODE: `LE-2000` (autocomplete ELEC – green if valid), CITY: `Kochi`, COUNTRY: `IN`

### 8. Inventory Locations – EILC – Same tab → Form EILC
**Dependencies:** FACILITY_CODE from EFCC  
**Values:** CODE: `IL-100`, NAME: `Raw Store`, FACILITY_CODE: `FAC-2000` (autocomplete EFCC)

### 9. Warehouse Sites – EWSC – Same tab → Form EWSC
**Dependencies:** FACILITY_CODE from EFCC  
**Values:** CODE: `WH-2000`, NAME: `Main Warehouse`, FACILITY_CODE: `FAC-2000`

### 10. Dispatch Points – EDPC – Same tab (if visible)
**Dependencies:** FACILITY_CODE  
**Values:** CODE: `DP-01`, NAME: `Dispatch 01`, FACILITY_CODE: `FAC-2000`, LOADING_GROUP: `FORKLIFT`

### 11. Procurement Divisions – EPDC – Tab Procurement Division & Buyer Team → Form EPDC
**Dependencies:** TENANT_CODE `TEN-100`  
**Values:** CODE: `PD-100`, NAME: `Procurement Division 100`, TENANT_CODE: `TEN-100`

### 12. Buyer Teams – EBTC – Same tab → Form EBTC
**Dependencies:** PROCUREMENT_DIVISION_CODE from EPDC  
**Values:** CODE: `BT-10`, NAME: `Buyer Team 10`, PROCUREMENT_DIVISION_CODE: `PD-100` (autocomplete EPDC)

### 13. Commercial Orgs – ECOC – Tab Commercial Org & Sales Channel & Product Line → Form ECOC
**Dependencies:** LEGAL_ENTITY_CODE from ELEC  
**Values:** CODE: `SO-2000`, NAME: `Sales Org 2000`, LEGAL_ENTITY_CODE: `LE-2000`

### 14. Sales Channels – ESCC – Same tab → Form ESCC
**Dependencies:** None  
**Values:** CODE: `SC-10`, NAME: `Direct Sales`

### 15. Product Lines – EPLC – Same tab → Form EPLC
**Dependencies:** None  
**Values:** CODE: `PL-01`, NAME: `Spices`

### 16. Profit Units – EPUC – Tab Profit & Cost & Segment → Form EPUC
**Dependencies:** LEGAL_ENTITY_CODE from ELEC, CONTROL_AREA_CODE from ECOC  
**Values:** CODE: `PU-100`, NAME: `Profit Unit 100`, LEGAL_ENTITY_CODE: `LE-2000`, CONTROL_AREA_CODE: `CA-1000`

### 17. Cost Units – ECUC – Same tab → Form ECUC
**Dependencies:** CONTROL_AREA_CODE  
**Values:** CODE: `CU-100`, NAME: `Cost Unit 100`, CONTROL_AREA_CODE: `CA-1000`, PARENT_CODE: (optional, autocomplete ECUC)

### 18. Business Segments – EBSC – Same tab → Form EBSC
**Dependencies:** None  
**Values:** CODE: `BS-01`, NAME: `Segment 01`

---

## Phase 3 – Financials (FICO)

### 19. Chart of Accounts – FCOA – `/1000/fico/chart-of-accounts`
**Dependencies:** None  
**Values:** CODE: `INT`, NAME: `International COA`

### 20. GL Accounts – FGLC – `/1000/fico/gl-accounts`
**Dependencies:** COA_CODE from FCOA  
**Values:** ACCOUNT_NUMBER: `100000`, NAME: `Cash`, COA_CODE: `INT` (autocomplete FCOA), ACCOUNT_TYPE: `ASST`
- `200000` Liabilities, `300000` Revenue, `400000` Expenses

### 21. Cost Centers – FCCA – `/1000/fico/cost-centers`
**Dependencies:** COMPANY_CODE (OX02) – use `1000` or `KS01` from company-codes  
**Values:** CODE: `CC-1000`, NAME: `Cost Center 1000`, COMPANY_CODE: `1000`

### 22. Tax Groups – FTGC – `/1000/fico/tax-groups`
**Dependencies:** None  
**Values:** CODE: `TG-01`, NAME: `GST 18%`

### 23. Tax Codes – FTXC – `/1000/fico/tax-codes`
**Dependencies:** GL_ACCOUNT uses account_number (e.g., `100000`) – autocomplete shows account_number + name  
**Values:** CODE: `TX-01`, NAME: `GST 18%`, RATE: `18`, LEDGER_ACCOUNT_CODE: `100000` (autocomplete FGLC – codeField account_number)

### 24. Exchange Rates – FEXC – `/1000/fico/exchange-rates`
**Dependencies:** FROM_CURRENCY, TO_CURRENCY from FCYC  
**Values:** FROM_CURRENCY: `INR` (autocomplete FCYC), TO_CURRENCY: `USD` (autocomplete FCYC), RATE: `0.012`, VALID_FROM: `2026-01-01`

### 25. Number Ranges – FNRC – `/1000/fico/number-ranges`
**Dependencies:** None  
**Values:** OBJECT_TYPE: `FBN1`, CURRENT_NUMBER: `1000`, PREFIX: `INV-`

### 26. Company Master – OX02 – `/1000/fico/company-master`
**Dependencies:** CURRENCY_CODE from FCYC, COA_CODE from FCOA  
**Values:** CODE: `1000`, NAME: `Company 1000`, CURRENCY_CODE: `INR`, COA_CODE: `INT`

---

## Phase 4 – Materials & Procurement (MM)

### 27. Material Types – EMTP – `/1000/foundation/material-types`
**Values:** CODE: `RAW`, NAME: `Raw Material`

### 28. UOM – EUOC – `/1000/foundation/uom`
**Values:** CODE: `KG`, NAME: `Kilogram`

### 29. Materials – EMTC – `/1000/foundation/materials`
**Dependencies:** MATERIAL_TYPE (EMTP), BASE_UOM (EUOC)  
**Values:** ITEM_NUMBER: `MAT-001`, DESCRIPTION: `Chili Powder`, MATERIAL_TYPE: `RAW`, BASE_UOM: `KG`

### 30. Business Partners – Vendors/Customers – `/1000/foundation/partners`
**Dependencies:** None – but ROLE matters for filtering  
**Values Vendor:** ACCOUNT_NUMBER: `VEND-100`, DISPLAY_NAME: `Vendor 100`, ROLE: `VENDOR`  
**Values Customer:** ACCOUNT_NUMBER: `CUST-100`, DISPLAY_NAME: `Customer 100`, ROLE: `CUSTOMER`

### 31. Purchase Requisitions – PPRC (ME51N) – `/1000/mm/pr`
**Dependencies:** MATERIAL (item_number MAT-001), PLANT (FAC-2000), COMPANY_CODE (1000)  
**Values:** MATERIAL: `MAT-001` (autocomplete EMTC codeField item_number), PLANT: `FAC-2000` (autocomplete EFCC), QUANTITY: `100`, COMPANY_CODE: `1000`

### 32. Purchase Orders – PPOC (ME21N) – `/1000/mm/po`
**Dependencies:** VENDOR (account_number VEND-100 – filtered by ROLE=VENDOR), MATERIAL, COMPANY_CODE  
**Values:** VENDOR: `VEND-100` (autocomplete shows only VENDOR role), MATERIAL: `MAT-001`, QUANTITY: `100`, PRICE: `50`, COMPANY_CODE: `1000`

### 33. Goods Receipts – IGRC (MIGO) – `/1000/mm/gr`
**Dependencies:** MATERIAL, PLANT, STORAGE_LOCATION (IL-100)  
**Values:** MATERIAL: `MAT-001`, PLANT: `FAC-2000`, STORAGE_LOCATION: `IL-100` (autocomplete EILC)

### 34. Invoice Verification – PIVC (MIRO) – `/1000/mm/iv`
**Dependencies:** VENDOR  
**Values:** VENDOR: `VEND-100`, INVOICE_NUMBER: `INV-001`, AMOUNT: `5000`, COMPANY_CODE: `1000`

### 35. STO – PSTC (ME27) – `/1000/mm/sto`
**Dependencies:** FROM_PLANT, TO_PLANT, MATERIAL  
**Values:** FROM_PLANT: `FAC-2000`, TO_PLANT: `FAC-2000`, MATERIAL: `MAT-001`, QUANTITY: `50`

### 36. Physical Inventory – IPIC (MI01) – `/1000/mm/physical-inventory`
**Dependencies:** PLANT, STORAGE_LOCATION, MATERIAL  
**Values:** PLANT: `FAC-2000`, STORAGE_LOCATION: `IL-100`, MATERIAL: `MAT-001`, QUANTITY: `95`

---

## Phase 5 – Production (PP)

### 37. Work Centers – MWCC (CR01) – `/1000/pp/work-centers`
**Dependencies:** COST_CENTER (CC-1000), PLANT (FAC-2000)  
**Values:** CODE: `WC-100`, DESCRIPTION: `Work Center 100`, COST_CENTER: `CC-1000` (autocomplete FCCA), PLANT: `FAC-2000`

### 38. BOM – MBMC (CS01) – `/1000/pp/bom`
**Dependencies:** MATERIAL (MAT-001), COMPONENT (MAT-001 or another), PLANT  
**Values:** BOM_NUMBER: `BOM-001`, MATERIAL: `MAT-001`, COMPONENT: `MAT-001`, QUANTITY: `1`, PLANT: `FAC-2000`

### 39. Routings – MRTC (CA01) – `/1000/pp/routings`
**Dependencies:** MATERIAL, WORK_CENTER  
**Values:** ROUTING_NUMBER: `RT-001`, MATERIAL: `MAT-001`, OPERATION: `10`, WORK_CENTER: `WC-100`

### 40. Kitting – MKTC – `/1000/pp/kitting`
**Dependencies:** MATERIAL, PLANT  
**Values:** KIT_NUMBER: `KIT-001`, MATERIAL: `MAT-001`, QUANTITY: `1`, PLANT: `FAC-2000`

### 41. MRP – MMRP (MD01) – `/1000/pp/mrp`
**Dependencies:** MATERIAL, PLANT  
**Values:** MATERIAL: `MAT-001`, PLANT: `FAC-2000`, DEMAND: `100`

---

## Phase 6 – Sales (SD)

### 42. Sales Orders – SSOC (VA01) – `/1000/sales`
**Dependencies:** CUSTOMER (CUST-100 filtered ROLE=CUSTOMER), MATERIAL, COMPANY_CODE  
**Values:** CUSTOMER: `CUST-100` (autocomplete filtered CUSTOMER), MATERIAL: `MAT-001`, QUANTITY: `10`, COMPANY_CODE: `1000`

### 43. Delivery – SDLC (VL01N) – `/1000/sd/delivery`
**Dependencies:** SALES_ORDER (order_number from SSOC), PLANT, MATERIAL  
**Values:** SALES_ORDER: `SO-001` (autocomplete VA01 order_number), PLANT: `FAC-2000`, MATERIAL: `MAT-001`, QUANTITY: `10`

### 44. Billing – SBLC (VF01) – `/1000/sd/billing`
**Dependencies:** DELIVERY_NUMBER from SDLC  
**Values:** DELIVERY_NUMBER: `DL-001` (autocomplete VL01N), AMOUNT: `5000`, COMPANY_CODE: `1000`

---

## Phase 7 – HR

### 45. Employees – HEMC – `/1000/hr/employees`
**Dependencies:** COMPANY_CODE  
**Values:** EMPLOYEE_NUMBER: `EMP-001`, NAME: `John Doe`, COMPANY_CODE: `1000`, POSITION: `Manager`

### 46. Payroll – HPRC – `/1000/hr/payroll`
**Dependencies:** EMPLOYEE_NUMBER, COMPANY_CODE  
**Values:** EMPLOYEE_NUMBER: `EMP-001` (autocomplete HEMC), COMPANY_CODE: `1000`, AMOUNT: `50000`

---

## UI Behavior Checklist

- **Border colors:** Empty required = yellow `border-amber-300`, valid = green `border-emerald-400`, invalid = red `border-red-400`
- **Label badge:** Shows CODE to add value (e.g., `ECGC`, `FFYC`) not `(12 in DB)`
- **Dropdown empty:** Shows `Use ECGC to add new COMPANY_GROUP_CODE` + `+ Create via ECGC`
- **Dropdown invalid:** Red box `Invalid – XYZ not found – Use ECGC to add new COMPANY_GROUP_CODE`
- **Button text:** Short – `Create Company Group`, `Create Legal Entity`, `Create Facility`, `Create` – code already in heading badge
- **Classic tabs:** Tabs now work in classic mode – click `ECGC/ELEC`, `EFCC/EILC`, etc. – state `activeTab` shared, border-2 black style
- **Mode persistence:** `localStorage.setItem('erp-view-mode', view)` – switching Modern/Classic persists across page navigation

---

## Quick Test Script (copy values)

1. FCYC: INR, USD
2. FFYC: K4 April-March, V3 Calendar
3. ECGC: ISL + TEN-100
4. ELEC: LE-2000 + ISL + INR + IN + K4
5. ECOC: CA-1000 + INR
6. EFCC: FAC-2000 + LE-2000
7. EILC: IL-100 + FAC-2000
8. EPDC: PD-100 + TEN-100
9. EBTC: BT-10 + PD-100
10. ECOC commercial: SO-2000 + LE-2000
11. ESCC: SC-10, EPLC: PL-01
12. EPUC: PU-100 + LE-2000 + CA-1000
13. ECUC: CU-100 + CA-1000
14. FCOA: INT
15. FGLC: 100000 Cash + INT
16. EMTC: MAT-001 + RAW + KG
17. Partners: VEND-100 VENDOR, CUST-100 CUSTOMER
18. PPRC: MAT-001 + FAC-2000 + 100 + 1000
19. PPOC: VEND-100 + MAT-001 + 1000
20. SSOC: CUST-100 + MAT-001 + 1000

If any autocomplete shows red border, create the missing master first per dependency list above.
