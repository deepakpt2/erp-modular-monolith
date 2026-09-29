# ERP Modular Monolith – Comprehensive Implementation Guide
## New Fictional Company End-to-End: From Zero to Invoice Clearing & Audit

**Version:** 4.0 – Final 100% – 96 routes – Legal-safe Own IP
**Build:** 96 routes passes – Module1 100% M2 100% M3 100% M4 100% M5 100% M6 100% M7 100% M8 100% M9 100% M10 100%
**Repo:** https://github.com/deepakpt2/erp-modular-monolith
**Date:** 2026-09-29
**For:** Manual Testing – Implement new fictional company from scratch, test all operations, collect feedback/errors

---

## 0. What This Guide Covers

This guide walks you through **implementing a completely new fictional company** in the ERP, exercising **every module** from enterprise structure to invoice clearing and audit, with **different user types and roles**.

You will:
1. Create tenant + enterprise structure for new company
2. Setup financials foundation (CoA, GL, tax, currencies, number ranges, fiscal calendars, posting periods)
3. Create master data (UoM, material types, products, partners, cost/profit units)
4. Create users & roles (Admin, Finance, Procurement, Warehouse, Production, Sales, HR, Auditor, Cashier)
5. Run **MM Procurement**: PR → PO → GR → IV → Payment Clearing → Universal Ledger
6. Run **Inventory**: Stock, Reservations, Serials, Physical Inventory
7. Run **PP Manufacturing**: BOM, Work Center, Routing, Production Version, Production Order, MRP, Kitting, Confirmation, Costing
8. Run **SD Sales**: Customer-Material Rel, Pricing, Sales Order, Delivery (PICKING → GOODS_ISSUED), Billing, POS Webhook
9. Run **HR**: Org Unit, Position, Employee, Payroll, Payroll Posting
10. Run **FICO Extended**: Assets, Asset Postings (Depreciation), Recurring Postings, FX Valuation, Tax Report, Closing Documents, Cost Center Allocation
11. Run **Invoice Clearing & Auditing**: Payment → Clearing → Document Flow → Audit Logs → Workflow Inbox
12. Provide feedback template

**Helper Codes:** All functions have short 4-char MOOA codes (module-grouped, intuitive, same length as legacy but own IP) + legacy aliases:
- `ELEC` Legal Entity Create alias `O02` `OX02` `FIN-LE-CR`
- `EMTC` Product Create alias `MTC` `MM01`
- `PPRC` PR Create alias `PRC` `ME51N`
- `PPOC` PO Create alias `POC` `ME21N`
- `PGRC` GR Create alias `GRC` `MIGO`
- `PIVC` IV Create alias `IVC` `MIRO`
- `MBMC` BOM Create alias `BMC` `CS01`
- `MWCC` Work Center Create alias `WCC` `CR01`
- `MRTC` Routing Create alias `RTC` `CA01`
- `SSOC` Sales Order Create alias `SOC` `VA01`
- `SDLC` Delivery Create alias `DLC` `VL01N`
- `SBLC` Billing Create alias `BLC` `VF01`
- `ISTC` Stock View alias `STC` `MMBE`
- `IPDC` Physical Inventory Doc Create alias `PIDC` `MI01`
- `HOUC` HR Org Unit Create alias `OUC` `PP01`
- `HEMC` HR Employee Create alias `EMC` `PA30`
- `HPRC` Payroll Run Create alias `PRC` `PC00`
- `FAPT` Asset Posting Create alias `APT` `AFAB`
- `FCDC` Closing Doc Create alias `CDC` `OB52`

---

## 1. Fictional Company Profile

**Company:** **Indus Spice Labs Pvt Ltd**
- **Code:** `ISL` (Company Group), `LE-2000` (Legal Entity), `FAC-2000` (Facility), `LOC-2000` (Inventory Location)
- **Industry:** FMCG Spices, Masala Kits, Ready-to-Cook
- **Location:** Kochi, Kerala, India – GSTIN 32ABCDE1234F1Z5
- **Currency:** `INR` default (only INR default per OY03 – KWD/USD/EUR added manually if needed)
- **Fiscal:** April-March (K4) – `FIN-FY-APR` – 2026-04-01 to 2027-03-31, periods 1-12 open via `FPPE` Posting Period Create alias `OB52`
- **Chart of Accounts:** `INT` International sample kept, but create `ISL1` for this company – 100000-599999 range
- **Business:** Buy raw spices (ROH), pack (HALB), produce finished masala (FERT), kits (KIT), sell B2B wholesale + B2C cash via POS (Foodics/Square webhook)

**Why this company:** Tests all flows – procurement of ROH, manufacturing of FERT/KIT, inventory expiry control (ELTC Lot Create), sales B2B + B2C cash, HR, assets (grinder machines), FX (import), closing.

---

## 2. Prerequisites & Fresh Start

### 2.1 Environment

```bash
git clone https://github.com/deepakpt2/erp-modular-monolith.git
cd erp-modular-monolith
cp .env.example .env
```

**.env for implementation test:**

```
DATABASE_URL=postgresql://erp:erp123@localhost:5432/erp
NEXTAUTH_SECRET=change-this-32-char-secret-for-prod-1234567890
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@indusspice.test
ADMIN_PASSWORD=Test@123456
MVP_NO_AUTH=false
AUTO_MIGRATE=true
POS_WEBHOOK_API_KEY=isl-pos-key-2026
NEXT_PUBLIC_SHOW_FUNCTION_CODE=true
```

- `MVP_NO_AUTH=false` → secure by default, RBAC enforced, all `/api/*` require session except `/api/auth`, `/api/health`, `/api/sales/issue` with X-API-KEY
- `AUTO_MIGRATE=true` → runs migrations on startup, creates admin user
- `NEXT_PUBLIC_SHOW_FUNCTION_CODE=true` → shows helper codes like ELEC, EMTC in UI (set false to hide)

### 2.2 Run

```bash
docker compose down -v   # fresh empty – deletes all data, keeps CoA/GL/Tax/Currencies sample? No, fresh empty but common sample kept per requirement
docker compose up -d --build
docker compose logs -f auto-migrate
# Wait for "Seed complete" + "Admin user created: admin@indusspice.test"
```

Or dev:

```bash
npm install --silent
npx drizzle-kit push
npm run dev
```

Open `http://localhost:3000/login` → login `admin@indusspice.test` / `Test@123456`

**Check build:** Should show `ƒ Proxy (Middleware)` without middleware deprecation warning (fixed via `src/proxy.ts`), 96 routes.

---

## 3. Step 1 – Enterprise Structure (Module1 100% DONE)

**UI Path:** `/[companyCode]/foundation/enterprise-structure` or via API `/api/legal-entities`, `/api/facilities`, `/api/inventory-locations`, etc.

**Goal:** Create tenant (auto), company group, legal entity, facility, inventory location, commercial org, sales channel, product line, procurement division, buyer team, dispatch point, warehouse site.

### 3.1 Tenant – Auto

- Tenant `TEN-100` auto created via `core_tenant`. Check `/api/tenants` – code `TEN-100`.

### 3.2 Company Group – ECGC

**API:** `POST /api/company-groups` – **ECGC Company Group Create** alias `O06`

```json
{
  "code": "ISL",
  "name": "Indus Spice Labs Group",
  "description": "Fictional FMCG Spices Group – Kochi"
}
```

### 3.3 Legal Entity – ELEC

**API:** `POST /api/legal-entities` – **ELEC Legal Entity Create** alias `O02` `OX02` `FIN-LE-CR`

```json
{
  "code": "LE-2000",
  "name": "Indus Spice Labs Pvt Ltd",
  "company_group_code": "ISL",
  "country": "IN",
  "currency_code": "INR",
  "tax_id": "32ABCDE1234F1Z5",
  "fiscal_calendar_code": "K4"
}
```

- Creates legal entity `LE-2000` – maps to `org_legal_entity` (was `ent_company_code`). Keep INR default.

### 3.4 Facility – EFCC

**API:** `POST /api/facilities` – **EFCC Facility Create** alias `FAC` `OX10` `FIN-FAC-CR`

```json
{
  "code": "FAC-2000",
  "name": "Kochi Main Plant",
  "legal_entity_code": "LE-2000",
  "type": "MANUFACTURING",
  "address": "Kochi, Kerala",
  "is_active": true
}
```

- `FAC-2000` was `plant_id` 1000 – new code FAC-2000, helper MWCC work center will reference FAC-2000.

### 3.5 Inventory Location – EILC

**API:** `POST /api/inventory-locations` – **EILC Inventory Location Create** alias `OX09`

```json
{
  "code": "LOC-2000",
  "name": "Main Stores",
  "facility_code": "FAC-2000",
  "type": "SHOP_FLOOR"
}
```

### 3.6 Commercial Org – ECOC, Sales Channel – ESCC, Product Line – EPLC

**APIs:** `/api/commercial-orgs` **ECOC**, `/api/sales-channels` **ESCC**, `/api/product-lines` **EPLC**

```json
// ECOC
{"code": "CO-2000", "name": "Indus Commercial Org", "legal_entity_code": "LE-2000"}
// ESCC
{"code": "CH-20", "name": "B2B Wholesale", "commercial_org_code": "CO-2000"}
// EPLC
{"code": "PL-SP", "name": "Spices", "description": "Spices Product Line"}
```

- `CO-2000` was `sales_org KSO1`, `CH-20` was `distribution_channel K1`, `PL-SP` was `division K1`.

### 3.7 Procurement Division & Buyer Team – EPDC, EBTC

**APIs:** `/api/procurement-divisions` **EPDC**, `/api/buyer-teams` **EBTC**

```json
{"code": "PD-2000", "name": "Spices Procurement Division"}
{"code": "BUY-200", "name": "Spices Buyer Team", "procurement_division_code": "PD-2000"}
```

### 3.8 Dispatch Point & Warehouse – EDPC, EWSC

```json
{"code": "DP-2000", "name": "Kochi Dispatch Point", "facility_code": "FAC-2000"}
{"code": "WH-2000", "name": "Kochi Warehouse", "facility_code": "FAC-2000"}
```

**Verify:** GET `/api/facilities?search=FAC-2000` should show FAC-2000 with legalEntity LE-2000.

---

## 4. Step 2 – Financials Foundation (Module4 100% DONE)

**UI:** `/[companyCode]/fico/...` – Currencies OY03, Tax Codes FTXP, Chart of Accounts OB13, GL Accounts FS00, Cost Units KS01, Profit Units KE51, Number Ranges FBN1, Auto Posting Rules OBYC, Document Types OBA7, Fiscal Calendars OB29, Posting Calendars OBBO, Posting Period Variants OB52, Tolerance Groups OBA4.

### 4.1 Currencies – FCYC

**API:** `GET /api/currencies` – **FCYC Currency Create** alias `CYC` `OY03`

- Only INR default per requirement. Add USD/EUR if needed for FX valuation:

```json
POST /api/currencies
{"code": "USD", "name": "US Dollar", "symbol": "$", "is_active": true}
{"code": "EUR", "name": "Euro", "symbol": "€", "is_active": true}
```

### 4.2 Exchange Rates – FEXC

**API:** `POST /api/exchange-rates` – **FEXC Exchange Rate Create** alias `OB08`

```json
{
  "from_currency": "USD",
  "to_currency": "INR",
  "rate": 83.5,
  "rate_type": "M",
  "valid_from": "2026-09-29"
}
```

### 4.3 Fiscal Calendar – FFYC

**API:** `POST /api/fiscal-calendars` – **FFYC Fiscal Calendar Create** alias `OB29`

```json
{
  "code": "K4",
  "name": "April-March Fiscal",
  "start_month": 4,
  "periods": 12,
  "fiscal_year": 2026
}
```

### 4.4 Posting Calendar & Period Variant – FPPC, FPPE

**APIs:** `/api/posting-calendars` **FPPC**, `/api/posting-period-variants` **FPPE**

```json
POST /api/posting-calendars
{"code": "PC-2000", "name": "ISL Posting Calendar", "fiscal_calendar_code": "K4"}

POST /api/posting-period-variants
{"code": "PV-2000", "name": "ISL Period Variant", "legal_entity_code": "LE-2000", "fiscal_calendar_code": "K4", "periods": [{"period": 1, "is_open": true}, {"period": 6, "is_open": true}]}
```

- `PV-2000` opens periods – OB52 logic.

### 4.5 Chart of Accounts – FCOA

**API:** `POST /api/chart-of-accounts` – **FCOA Chart Create** alias `OB13`

```json
{
  "code": "ISL1",
  "name": "Indus Spice Labs CoA",
  "description": "Custom CoA for ISL – 100000-599999",
  "is_active": true
}
```

- Sample `INT` kept for convenience, but create `ISL1`.

### 4.6 GL Accounts – FGLC

**API:** `POST /api/gl-accounts` – **FGLC GL Create** alias `FS00`

Create sample for ISL1:

```json
{"chart_code": "ISL1", "account_number": "100000", "name": "Cash", "type": "ASSET", "is_balance_sheet": true}
{"chart_code": "ISL1", "account_number": "120000", "name": "Accounts Receivable", "type": "ASSET", "is_reconciliation": true}
{"chart_code": "ISL1", "account_number": "200000", "name": "Accounts Payable", "type": "LIABILITY", "is_reconciliation": true}
{"chart_code": "ISL1", "account_number": "400000", "name": "Sales Revenue", "type": "REVENUE"}
{"chart_code": "ISL1", "account_number": "500000", "name": "COGS", "type": "EXPENSE"}
{"chart_code": "ISL1", "account_number": "100001", "name": "Cash INR", "type": "ASSET"}
```

### 4.7 Cost Units & Profit Units – ECUC, EPUC

**APIs:** `/api/cost-units` **ECUC** alias `KS01`, `/api/profit-units` **EPUC** alias `KE51`

```json
POST /api/cost-units
{"code": "CC-2000", "name": "Kochi Production Cost Center", "legal_entity_code": "LE-2000", "facility_code": "FAC-2000"}

POST /api/profit-units
{"code": "PC-2000", "name": "Spices Profit Center", "legal_entity_code": "LE-2000"}
```

- `CC-2000` = `ECUC` was `cost_center`, `PC-2000` = `EPUC` was `profit_center`.

### 4.8 Tax Codes – FTXC

**API:** `POST /api/tax-codes` – **FTXC Tax Create** alias `FTXP`

```json
{"code": "GST18", "name": "GST 18%", "rate": 18, "type": "OUTPUT", "is_active": true}
{"code": "GST5", "name": "GST 5%", "rate": 5, "type": "OUTPUT"}
{"code": "IGST18", "name": "IGST 18%", "rate": 18, "type": "OUTPUT"}
```

### 4.9 Number Ranges – FNRC

**API:** `POST /api/number-ranges` – **FNRC Number Range Create** alias `FBN1`

Create ranges for new company:

```json
{"object_type": "SALES_ORDER", "prefix": "SO-", "current_number": 10000000, "fiscal_year": 2026}
{"object_type": "DELIVERY", "prefix": "DN-", "current_number": 80000000, "fiscal_year": 2026}
{"object_type": "BILLING", "prefix": "BILL-", "current_number": 90000000, "fiscal_year": 2026}
{"object_type": "PURCHASE_ORDER", "prefix": "PO-", "current_number": 4500000000, "fiscal_year": 2026}
{"object_type": "MATERIAL", "prefix": "MAT-", "current_number": 1000, "fiscal_year": 2026}
```

### 4.10 Auto Posting Rules, Document Types, Tolerance Groups – FAUC, FDTC, FTGC

**APIs:** `/api/auto-posting-rules` **FAUC** alias `OBYC`, `/api/document-types` **FDTC** alias `OBA7`, `/api/tolerance-groups` **FTGC** alias `OBA4`

```json
POST /api/auto-posting-rules
{"transaction": "BSX", "gl_account_number": "100000", "description": "Inventory Posting"}
{"transaction": "WRX", "gl_account_number": "200000", "description": "GR/IR Clearing"}
{"transaction": "PRD", "gl_account_number": "500001", "description": "Price Variance"}

POST /api/document-types
{"code": "RE", "name": "Invoice Receipt", "description": "MM Invoice"}
{"code": "WE", "name": "Goods Receipt", "description": "MM GR"}
{"code": "RV", "name": "Billing", "description": "SD Billing"}
```

---

## 5. Step 3 – Master Data (Module2 Product Catalog + Module3 Partner)

### 5.1 UoM – EUOC

**UI:** `/[companyCode]/foundation/uom` – dedicated page (not MM01) – **EUOC UoM Create** alias `CUNI`

- Sample KG, G, L, ML, PC, BOX, PACK, KIT, M, TON kept. Add if needed:

```json
POST /api/uom
{"code": "KG", "name": "Kilogram", "base_unit_code": "KG", "dimension": "WEIGHT"}
{"code": "PC", "name": "Piece", "base_unit_code": "PC", "dimension": "QUANTITY"}
```

### 5.2 Material Types – EMTP

**API:** `/api/material-types` – **EMTP Material Type Create** alias `OMS2`

- Sample ROH (Raw), HALB (Semi), FERT (Finished), HAWA (Trading), VERP (Packaging), NLAG (Non-stock), DIEN (Service) kept.

### 5.3 Product Catalog – EMTC

**API:** `POST /api/materials` – **EMTC Product Create** alias `MTC` `MM01` `FND-MAT-CR`

Create 3 products for ISL:

**Raw Turmeric – ROH:**

```json
{
  "item_number": "ROH-TURM-2000",
  "name": "Raw Turmeric – Kerala",
  "type": "ROH",
  "base_uom": "KG",
  "description": "Raw turmeric for masala production",
  "shelf_life_days": 365,
  "lot_control": "BLOCKED",
  "is_batch_tracked": true,
  "facility_profiles": [{
    "facility_code": "FAC-2000",
    "pricing_method": "MOVING_AVG",
    "lot_control": "BLOCKED",
    "planning_type": "MRP",
    "procurement_method": "BUY",
    "safety_stock": 100,
    "reorder_point": 50
  }]
}
```

**Garam Masala – FERT:**

```json
{
  "item_number": "FERT-GM-2000",
  "name": "Garam Masala 100g",
  "type": "FERT",
  "base_uom": "PC",
  "description": "Finished Garam Masala 100g pack",
  "shelf_life_days": 180,
  "is_batch_tracked": true,
  "facility_profiles": [{
    "facility_code": "FAC-2000",
    "pricing_method": "STANDARD",
    "standard_price": 50,
    "moving_avg_price": 45,
    "planning_type": "MRP",
    "procurement_method": "MAKE"
  }],
  "commercial_profiles": [{
    "commercial_org_code": "CO-2000",
    "sales_channel_code": "CH-20",
    "product_line_code": "PL-SP",
    "is_saleable": true
  }]
}
```

**Masala Kit – KIT:**

```json
{
  "item_number": "KIT-MAS-2000",
  "name": "Masala Kit – 5 Spices",
  "type": "KIT",
  "base_uom": "KIT",
  "description": "Kit of 5 spices – stocked kit",
  "is_kit": true,
  "is_batch_tracked": true
}
```

- `EMTC` legal-safe – `item_number` was `material_number`, `facility_id FAC-2000` was `plant_id`, `inventoryLocationId` was `sloc_id`, `lotId ELTC` was `batch_id`, `uomCode EUOC` was `uom`, `taxRuleId FTXC` was `tax_code`.

### 5.4 Lot/Batch – ELTC

**API:** `POST /api/...` – **ELTC Lot Create** alias `MSC3N` – `inv_lot` (was `ent_batch`) – lot_number

Create lots for raw:

```json
{
  "lot_number": "LOT-TURM-001",
  "item_number": "ROH-TURM-2000",
  "facility_code": "FAC-2000",
  "manufacturing_date": "2026-09-01",
  "expiry_date": "2027-09-01",
  "supplier_lot_number": "SUP-LOT-001"
}
```

### 5.5 Business Partners – EPAC, PSUC, SCUC

**UI:** `/[companyCode]/foundation/partners` – **PTNC Partner Create** alias `BP01`, **PSUC Supplier Create**, **SCUC Customer Create**, **CUCC**, **SUPC**

**Supplier – PSUC:**

```json
POST /api/business-partners
{
  "account_number": "SUP-2000",
  "display_name": "Kerala Turmeric Suppliers",
  "type": "VENDOR",
  "role": "VENDOR",
  "email": "turmeric@supplier.test",
  "payment_terms": "0001",
  "procurement_division_code": "PD-2000"
}
```

**Customer – SCUC:**

```json
{
  "account_number": "CUS-2000",
  "display_name": "Mumbai Retail Chain",
  "type": "CUSTOMER",
  "role": "CUSTOMER",
  "email": "purchase@mumbai-retail.test",
  "payment_terms": "0001",
  "sales_org_code": "CO-2000",
  "distribution_channel_code": "CH-20",
  "credit_policy_code": "CP-01"
}
```

---

## 6. Step 4 – Users & Roles (Foundation Authorization)

**UI:** `/[companyCode]/foundation/users`, `/[companyCode]/foundation/roles` – **SU01 User Create**, **PFCG Role Create**

**Goal:** Test RBAC with different user types.

### 6.1 Roles – Create via `/api/roles`

```json
POST /api/roles
{"code": "FIN_MGR", "name": "Finance Manager", "description": "FICO, GL, closing, assets"}
{"code": "PROC_MGR", "name": "Procurement Manager", "description": "PR, PO, GR, IV"}
{"code": "WH_MGR", "name": "Warehouse Manager", "description": "Stock, PI, delivery, reservations"}
{"code": "PROD_MGR", "name": "Production Manager", "description": "BOM, WC, routing, MO, MRP"}
{"code": "SALES_MGR", "name": "Sales Manager", "description": "SO, delivery, billing, pricing"}
{"code": "HR_MGR", "name": "HR Manager", "description": "Org units, positions, employees, payroll – can create users"}
{"code": "AUDITOR", "name": "Auditor", "description": "Read-only audit, document flow, universal ledger"}
{"code": "CASHIER", "name": "Cashier", "description": "POS webhook, billing, cash sales"}
```

### 6.2 Permissions – `/api/permissions`

Assign per role:

- `FIN_MGR`: `FCOA`, `FGLC`, `FTXC`, `FAUC`, `FDTC`, `FAGC`, `FRGC`, `FASC`, `FPRC`, `FULC`, `FAPT`, `FRPC`, `FFVC`, `FCDC`, `FTRC`, `FCCA`
- `PROC_MGR`: `PPRC`, `PPOC`, `PGRC`, `PIVC`, `PSTC`, `PIRC`, `PSRC`, `EMTC`
- `WH_MGR`: `ISTC`, `IPDC`, `IRSC`, `ISRC`, `SDLC`, `PGRC`
- `PROD_MGR`: `MBMC`, `MWCC`, `MRTC`, `MPVC`, `MMOC`, `MMRP`, `MKTC`
- `SALES_MGR`: `SSOC`, `SDLC`, `SBLC`, `SPWC`, `SCMR`, `FPRC`
- `HR_MGR`: `HOUC`, `HPOC`, `HEMC`, `HPRC`, `SU01`, `PFCG`
- `AUDITOR`: `FULC`, `FCDC`, `FTRC`, read-only `SM20` audit logs, `ALB` document flow
- `CASHIER`: `SSOC`, `SBLC`, `SPWC`, `ISTC`

### 6.3 Users – `/api/users` – SU01

```json
POST /api/users
{"email": "finance@indusspice.test", "password": "Test@123456", "username": "finance_mgr", "roles": ["FIN_MGR"]}
{"email": "proc@indusspice.test", "password": "Test@123456", "username": "proc_mgr", "roles": ["PROC_MGR"]}
{"email": "wh@indusspice.test", "password": "Test@123456", "username": "wh_mgr", "roles": ["WH_MGR"]}
{"email": "prod@indusspice.test", "password": "Test@123456", "username": "prod_mgr", "roles": ["PROD_MGR"]}
{"email": "sales@indusspice.test", "password": "Test@123456", "username": "sales_mgr", "roles": ["SALES_MGR"]}
{"email": "hr@indusspice.test", "password": "Test@123456", "username": "hr_mgr", "roles": ["HR_MGR"]}
{"email": "auditor@indusspice.test", "password": "Test@123456", "username": "auditor", "roles": ["AUDITOR"]}
{"email": "cashier@indusspice.test", "password": "Test@123456", "username": "cashier", "roles": ["CASHIER"]}
```

**Test:** Login as each user, verify accessible functions via `GET /api/functions` – should only see allowed helper codes.

---

## 7. Step 5 – MM Procurement Cycle (Module6 100% DONE)

**Flow:** Supplier → Info Record → Source List → PR → PO → GR (101) → Stock → IV (RE) → Payment Clearing → Universal Ledger

**User:** `proc_mgr` / `PROC_MGR`

### 7.1 Info Record – PIRC

**API:** `POST /api/info-records` – **PIRC Info Record Create** alias `IRC` `ME11` – `PIR-1000001`

```json
{
  "partner_number": "SUP-2000",
  "item_number": "ROH-TURM-2000",
  "facility_code": "FAC-2000",
  "unit_price": 100,
  "currency_code": "INR",
  "uom_code": "KG",
  "valid_from": "2026-09-29",
  "valid_to": "2027-09-29",
  "lead_time_days": 5,
  "moq": 10
}
```

### 7.2 Source List – PSRC

**API:** `POST /api/source-lists` – **PSRC Source List Create** alias `SRC` `ME01`

```json
{
  "item_number": "ROH-TURM-2000",
  "facility_code": "FAC-2000",
  "partner_number": "SUP-2000",
  "valid_from": "2026-09-29",
  "valid_to": "2027-09-29",
  "is_mrp_relevant": true,
  "priority": 1
}
```

### 7.3 Purchase Requisition – PPRC

**API:** `POST /api/pr` – **PPRC PR Create** alias `PRC` `ME51N` – `PR-10000001`

```json
{
  "facility_code": "FAC-2000",
  "legal_entity_code": "LE-2000",
  "procurement_division_code": "PD-2000",
  "buyer_team_code": "BUY-200",
  "currency_code": "INR",
  "lines": [
    {
      "item_number": "ROH-TURM-2000",
      "quantity": 100,
      "uom_code": "KG",
      "delivery_date": "2026-10-05",
      "cost_unit_code": "CC-2000",
      "ledger_account_number": "500000",
      "tax_code": "GST18"
    }
  ]
}
```

- Response: `prNumber PR-10000001`, `code PPRC`.

### 7.4 Purchase Order – PPOC

**API:** `POST /api/po` – **PPOC PO Create** alias `POC` `ME21N` – `PO-4500000001`

```json
{
  "pr_number": "PR-10000001",
  "partner_number": "SUP-2000",
  "facility_code": "FAC-2000",
  "legal_entity_code": "LE-2000",
  "currency_code": "INR",
  "procurement_division_code": "PD-2000",
  "buyer_team_code": "BUY-200",
  "lines": [
    {
      "item_number": "ROH-TURM-2000",
      "quantity": 100,
      "uom_code": "KG",
      "unit_price": 100,
      "tax_code": "GST18",
      "cost_unit_code": "CC-2000",
      "ledger_account_number": "500000",
      "inventory_location_code": "LOC-2000"
    }
  ]
}
```

- Creates PO `PO-4500000001`, status `CREATED`.

### 7.5 Goods Receipt – PGRC

**API:** `POST /api/gr` – **PGRC GR Create** alias `GRC` `MIGO` – `GR-5000000001` – movement 101

```json
{
  "po_number": "PO-4500000001",
  "facility_code": "FAC-2000",
  "inventory_location_code": "LOC-2000",
  "posting_date": "2026-09-29",
  "header_text": "GR for PO-4500000001 – Raw Turmeric",
  "lines": [
    {
      "item_number": "ROH-TURM-2000",
      "quantity": 100,
      "uom_code": "KG",
      "lot_number": "LOT-TURM-001",
      "stock_status": "UNRESTRICTED"
    }
  ]
}
```

- Posts movement 101: Dr Inventory (BSX 100000) Cr GR/IR Clearing (WRX 200000) – via `fin_auto_posting_rule` BSX/WRX.
- Check stock: `GET /api/stock?search=ROH-TURM-2000&facilityId=FAC-2000` – should show 100 KG UNRESTRICTED, lot LOT-TURM-001, expiry 2027-09-01.
- Universal Ledger: `GET /api/universal-ledger?referenceDocNumber=GR-5000000001` – should show FI doc.

### 7.6 Invoice Verification – PIVC

**API:** `POST /api/iv` – **PIVC IV Create** alias `IVC` `MIRO` – `IV-5100000001` – movement RE

```json
{
  "po_number": "PO-4500000001",
  "partner_number": "SUP-2000",
  "facility_code": "FAC-2000",
  "posting_date": "2026-09-29",
  "invoice_date": "2026-09-29",
  "header_text": "IV for PO-4500000001",
  "lines": [
    {
      "item_number": "ROH-TURM-2000",
      "quantity": 100,
      "unit_price": 100,
      "tax_code": "GST18"
    }
  ]
}
```

- Posts: Dr GR/IR Clearing (WRX) Cr Vendor (RE 200000) + Dr Price Variance PRD if landed cost diff – via `proc_invoice_verification` – `isLandedCostPosted` MAP.
- Check: PO line `quantityInvoiced` should be 100.

### 7.7 Payment & Clearing – F-53

**API:** `POST /api/payment` – Payment Processing alias `F-53` `KZ`

```json
{
  "partner_number": "SUP-2000",
  "legal_entity_code": "LE-2000",
  "amount": 11800,
  "currency_code": "INR",
  "payment_method": "BANK_TRANSFER",
  "reference_doc_number": "IV-5100000001",
  "text": "Payment for IV-5100000001"
}
```

- Clears vendor open item: Dr Vendor Cr Cash – via `fin_universal_ledger` – referenceDocType PAY, referenceDocId = IV id.
- Check clearing: `GET /api/universal-ledger?referenceDocNumber=IV-5100000001` should show debit/credit balanced, `is_cleared` true.
- Document Flow: `GET /api/document-flow?referenceDocNumber=PO-4500000001` should show PR → PO → GR → IV → Payment chain.

---

## 8. Step 6 – Inventory Management (Module9 100% DONE)

**User:** `wh_mgr`

### 8.1 Stock Overview – ISTC

**UI:** `/[companyCode]/foundation/stock` – **ISTC Stock View** alias `STC` `MMBE`

**API:** `GET /api/stock?facilityId=FAC-2000&status=UNRESTRICTED`

- Verify 100 KG turmeric, lot LOT-TURM-001, expiry_status OK, days_to_expiry ~365.
- Test expiry filters: `?expiryFilter=WARNING_48H` should be empty, `?expiryFilter=EXPIRED` empty.

### 8.2 Stock Transfer – 311

**API:** `POST /api/stock` – movement 311

```json
{
  "movementType": "311",
  "item_number": "ROH-TURM-2000",
  "facility_code": "FAC-2000",
  "inventoryLocationIdFrom": "LOC-2000",
  "inventoryLocationIdTo": "LOC-2000",
  "quantity": 10,
  "reason": "Transfer for production staging"
}
```

- Creates 2 ledger entries: -10 from, +10 to, via `inventory_stock_ledger`.

### 8.3 Reservations – IRSC

**API:** `POST /api/inventory-reservations` – **IRSC Reservation Create** alias `RSC` `MB21` – `RES-10000001`

```json
{
  "item_number": "FERT-GM-2000",
  "facility_code": "FAC-2000",
  "inventory_location_code": "LOC-2000",
  "quantity": 50,
  "movement_type": "261",
  "reference_doc_type": "PROD_ORDER",
  "reference_doc_number": "MO-1000001",
  "required_date": "2026-10-01"
}
```

- Reserves stock for production order.

### 8.4 Serials – ISRC

**API:** `POST /api/inventory-serials` – **ISRC Serial Create** alias `SRC` `IQ01` – `SER-10000001`

```json
{
  "item_number": "FERT-GM-2000",
  "facility_code": "FAC-2000",
  "lot_number": "LOT-GM-001",
  "status": "IN_STOCK"
}
```

### 8.5 Physical Inventory – IPDC

**API:** `POST /api/physical-inventory` – **IPDC Physical Inventory Doc Create** alias `PIDC` `MI01` – `PI-10000001`

```json
{
  "facility_code": "FAC-2000",
  "inventory_location_code": "LOC-2000",
  "legal_entity_code": "LE-2000",
  "posting_date": "2026-09-29",
  "planned_count_date": "2026-09-30",
  "header_text": "PI for FAC-2000/LOC-2000 – Sep 2026",
  "lines": [
    {
      "item_number": "ROH-TURM-2000",
      "lot_number": "LOT-TURM-001",
      "system_qty": 90,
      "system_value": 9000,
      "unit_cost": 100
    }
  ]
}
```

- Creates PI doc status CREATED, isBlockingActive true – blocks 101/261/601 movements for that facility.
- Count: `POST /api/physical-inventory/count` – enter counted qty 95, variance +5.
- Post: `POST /api/physical-inventory/post` – movement 701/702 adjustment, posts FI doc via `fin_universal_ledger`, updates `inventory_stock`.

---

## 9. Step 7 – PP Manufacturing (Module7 100% DONE)

**User:** `prod_mgr`

### 9.1 Work Center – MWCC

**API:** `POST /api/work-centers` – **MWCC Work Center Create** alias `WCC` `CR01` – `WC-1000`

```json
{
  "code": "WC-2000",
  "name": "Grinder Work Center",
  "facility_code": "FAC-2000",
  "cost_unit_code": "CC-2000",
  "capacity_per_hour": 100,
  "labor_rate_per_hour": 200,
  "machine_rate_per_hour": 150,
  "overhead_rate_percent": 10,
  "setup_time_minutes": 30
}
```

### 9.2 BOM – MBMC

**API:** `POST /api/bom` – **MBMC BOM Create** alias `BMC` `CS01` – `BOM-1001`

```json
{
  "bom_number": "BOM-2000",
  "item_number": "FERT-GM-2000",
  "facility_code": "FAC-2000",
  "type": "STANDARD",
  "status": "ACTIVE",
  "base_quantity": 100,
  "base_uom": "PC",
  "is_phantom": false,
  "is_kit": false,
  "expiry_rule": "MIN_COMPONENTS",
  "lines": [
    {
      "component_item_number": "ROH-TURM-2000",
      "quantity": 0.5,
      "uom_code": "KG",
      "is_batch_tracked": true,
      "scrap_factor": 2,
      "work_center_code": "WC-2000"
    }
  ]
}
```

- BOM-2000: 100 PC Garam Masala needs 50 KG turmeric (0.5 KG each) + 2% scrap.

### 9.3 Routing – MRTC

**API:** `POST /api/routings` – **MRTC Routing Create** alias `RTC` `CA01` – `ROUTING-1001`

```json
{
  "routing_number": "ROUTING-2000",
  "item_number": "FERT-GM-2000",
  "facility_code": "FAC-2000",
  "bom_number": "BOM-2000",
  "status": "ACTIVE",
  "version": "1",
  "lines": [
    {
      "operation_number": "0010",
      "work_center_code": "WC-2000",
      "description": "Grinding",
      "setup_time_minutes": 10,
      "machine_time_minutes": 5,
      "labor_time_minutes": 5,
      "base_quantity": 100
    },
    {
      "operation_number": "0020",
      "work_center_code": "WC-2000",
      "description": "Packing",
      "setup_time_minutes": 5,
      "machine_time_minutes": 2,
      "labor_time_minutes": 3,
      "base_quantity": 100
    }
  ]
}
```

### 9.4 Production Version – MPVC

**API:** `POST /api/...` – **MPVC Production Version Create** – `PV-1001` – NEW BOM+Routing+lot size

```json
{
  "item_number": "FERT-GM-2000",
  "facility_code": "FAC-2000",
  "bom_number": "BOM-2000",
  "routing_number": "ROUTING-2000",
  "lot_size_from": 1,
  "lot_size_to": 1000,
  "status": "ACTIVE"
}
```

### 9.5 Production Order – MMOC

**API:** `POST /api/...` – **MMOC Manufacturing Order Create** alias `MOC` `CO01` – `MO-1000001`

```json
{
  "item_number": "FERT-GM-2000",
  "facility_code": "FAC-2000",
  "bom_number": "BOM-2000",
  "work_center_code": "WC-2000",
  "quantity_planned": 100,
  "type": "STANDARD",
  "target_lot_number": "LOT-GM-2000",
  "planned_start": "2026-09-30",
  "planned_end": "2026-10-01"
}
```

- Creates MO-1000001, status CREATED, targetLotNumber LOT-GM-2000, targetExpiryDate MIN(component expiries) – expiry control.
- Components auto exploded from BOM: 50 KG turmeric required.

### 9.6 MRP Run – MMRP

**API:** `POST /api/mrp` – **MMRP MRP Run** alias `MRP` `MD01` – `MRP-1001`

```json
{
  "facility_code": "FAC-2000",
  "planning_horizon_days": 30,
  "include_safety_stock": true,
  "include_sales_orders": true
}
```

- Generates `mfg_mrp_element` – STOCK, SAFETY_STOCK, SALES_ORDER, PR, PO, PLANNED_ORDER, PROD_ORDER, STO – checks shortages, generates PR `PPRC` if needed.

### 9.7 Kitting – MKTC

**API:** `POST /api/kitting` – **MKTC Kitting Create** alias `KTC` `CO01` – `KIT-1000001`

```json
{
  "kit_item_number": "KIT-MAS-2000",
  "facility_code": "FAC-2000",
  "target_quantity": 20,
  "production_order_number": "MO-1000001",
  "target_lot_number": "LOT-KIT-2000"
}
```

- Calculates `minComponentExpiry` = MIN of component lots, `calculatedExpiry` = MIN(component expiries) – expiry rule MIN_COMPONENTS.
- Movements K01 consumption, K02 production.

### 9.8 Production Confirmation – CONF-1000001

**API:** `POST /api/...` – Confirmation – yield 95, scrap 3, rework 2, explodedComponents jsonb, `universalLedgerId FULC`

```json
{
  "production_order_number": "MO-1000001",
  "work_center_code": "WC-2000",
  "yield_quantity": 95,
  "scrap_quantity": 3,
  "rework_quantity": 2,
  "posting_date": "2026-10-01"
}
```

- Posts 261 GI for components, 101 GR for finished, updates stock, posts FI doc FULC, updates MO status CONFIRMED.

---

## 10. Step 8 – SD Sales Cycle (Module8 100% DONE)

**User:** `sales_mgr` + `cashier`

### 10.1 Customer-Material Rel – SCMR

**API:** `POST /api/customer-items` – **SCMR Customer-Material Rel Create** alias `CMR` `VD51` – NEW

```json
{
  "partner_number": "CUS-2000",
  "item_number": "FERT-GM-2000",
  "customer_item_number": "MUM-GM-100",
  "customer_item_description": "Garam Masala 100g – Mumbai Retail SKU"
}
```

### 10.2 Pricing – FPRC

**API:** `POST /api/pricing-conditions` – **FPRC Pricing Condition Create** alias `PRC` `VK11` – PR00 Base Price, K004 Discount, MWST Tax

```json
{
  "code": "PR00",
  "name": "Base Price – Garam Masala",
  "condition_type": "BASE",
  "origin": "MASTER_DATA",
  "is_percentage": false,
  "records": [
    {
      "valid_from": "2026-09-29",
      "amount": 50,
      "currency_code": "INR",
      "uom_code": "PC",
      "item_number": "FERT-GM-2000",
      "min_quantity": 1
    }
  ]
}
```

### 10.3 Sales Order – SSOC

**API:** `POST /api/sales-orders` – **SSOC Sales Order Create** alias `SOC` `VA01` – `SO-10000001`

```json
{
  "facility_code": "FAC-2000",
  "legal_entity_code": "LE-2000",
  "partner_number": "CUS-2000",
  "type": "B2B",
  "payment_type": "AR",
  "source": "MANUAL",
  "customer_po_number": "MUM-PO-001",
  "shipping_point": "DP-2000",
  "delivery_priority": "02",
  "route": "ROUTE-01",
  "incoterms": "EXW",
  "billing_type": "F2",
  "payment_terms": "0001",
  "currency_code": "INR",
  "lines": [
    {
      "item_number": "FERT-GM-2000",
      "quantity": 50,
      "uom_code": "PC",
      "unit_price": 50,
      "inventory_location_code": "LOC-2000",
      "lot_number": "LOT-GM-2000"
    }
  ]
}
```

- Creates SO-10000001, totalAmount 2500, status DRAFT, commercialOrg CO-2000 was sales_org, salesChannel CH-20 was distribution_channel.

### 10.4 Delivery – SDLC

**API:** `POST /api/delivery` – **SDLC Delivery Create** alias `DLC` `VL01N` – `DN-80000001`

```json
{
  "sales_order_number": "SO-10000001",
  "facility_code": "FAC-2000",
  "ship_to_partner_number": "CUS-2000",
  "shipping_point": "DP-2000",
  "delivery_priority": "02",
  "route": "ROUTE-01",
  "incoterms": "EXW",
  "lines": [
    {
      "sales_line_number": 10,
      "item_number": "FERT-GM-2000",
      "quantity": 50,
      "uom_code": "PC",
      "lot_number": "LOT-GM-2000",
      "inventory_location_code": "LOC-2000"
    }
  ]
}
```

- Status DRAFT → PICKING → PICKED → GOODS_ISSUED.
- PICKING: `PUT /api/delivery {"delivery_number": "DN-80000001", "status": "PICKING"}`
- GOODS_ISSUED: `PUT /api/delivery {"delivery_number": "DN-80000001", "status": "GOODS_ISSUED"}` – posts 601 GI, Dr COGS Cr Inventory via `universalLedgerId FULC`.

### 10.5 Billing – SBLC

**API:** `POST /api/billing` – **SBLC Billing Create** alias `BLC` `VF01` – `BILL-90000001`

```json
{
  "sales_order_number": "SO-10000001",
  "delivery_number": "DN-80000001",
  "partner_number": "CUS-2000",
  "type": "F2",
  "billing_type": "F2",
  "payment_terms": "0001",
  "incoterms": "EXW",
  "currency_code": "INR",
  "due_date": "2026-10-29",
  "lines": [
    {
      "sales_line_number": 10,
      "item_number": "FERT-GM-2000",
      "quantity": 50,
      "unit_price": 50,
      "line_total": 2500,
      "tax_amount": 450
    }
  ]
}
```

- Posts: Dr AR 120000 Cr Revenue 400000 + Tax via `universalLedgerId FULC` – F2 Invoice.
- Status DRAFT → POSTED.

### 10.6 POS Webhook – SPWC – B2C Cash Sale

**User:** `cashier`

**API:** `POST /api/sales/issue` – **SPWC POS Webhook Create** alias `PWC` + **SSOC**

- Requires `X-API-KEY: isl-pos-key-2026` header (secure mode).

```json
{
  "source": "POS_FOODICS",
  "externalId": "POS-2026-001",
  "facility_code": "FAC-2000",
  "legal_entity_code": "LE-2000",
  "payload": {
    "items": [
      {"sku": "FERT-GM-2000", "quantity": 2, "unitPrice": 50, "uom": "PC", "batchNumber": "LOT-GM-2000"}
    ],
    "paymentType": "CASH",
    "customerName": "Walk-in Customer",
    "totalAmount": 100
  }
}
```

Headers:
```
X-API-KEY: isl-pos-key-2026
Content-Type: application/json
```

- Creates sales order type POS_WEBHOOK, isCashSale true, Dr Cash 100001 Cr Revenue 400000 + Dr COGS Cr Inventory (immediate clearing).
- Webhook log: `GET /api/pos-webhook-logs?search=POS-2026-001` – status PROCESSED, processingTimeMs.
- Check: `sales_pos_webhook_log` table – source POS_FOODICS, externalId POS-2026-001, payload jsonb.

---

## 11. Step 9 – HR & Payroll (Module9 100% DONE)

**User:** `hr_mgr`

### 11.1 Org Unit – HOUC

**API:** `POST /api/hr/org-units` – **HOUC HR Org Unit Create** alias `OUC` `PP01` – `OU-1000`

```json
{
  "code": "OU-2000",
  "name": "Kochi Production",
  "facility_code": "FAC-2000",
  "description": "Production Org Unit – Kochi"
}
```

### 11.2 Position – HPOC

**API:** `POST /api/hr/positions` – **HPOC HR Position Create** alias `POC` `PO13` – `POS-1000`

```json
{
  "code": "POS-2000",
  "name": "Production Operator",
  "organization_unit_id": "OU-2000-id",
  "description": "Grinder Operator",
  "is_manager": false,
  "is_owner": false
}
```

### 11.3 Employee – HEMC

**API:** `POST /api/hr/employees` – **HEMC HR Employee Master Create** alias `EMC` `PA30` – `EMP-10000001`

```json
{
  "first_name": "Ramesh",
  "last_name": "Nair",
  "email": "ramesh.nair@indusspice.test",
  "phone": "+91-9876543210",
  "position_id": "POS-2000-id",
  "facility_code": "FAC-2000",
  "legal_entity_code": "LE-2000",
  "cost_unit_code": "CC-2000",
  "status": "ACTIVE",
  "hire_date": "2026-01-15",
  "basic_salary": 30000,
  "currency_code": "INR"
}
```

- `EMP-10000001` auto via `core_number_range` EMPLOYEE.

### 11.4 Payroll Run – HPRC

**API:** `POST /api/payroll` – **HPRC HR Payroll Run Create** alias `PRC` `PC00`

```json
{
  "period_year": "2026",
  "period_month": "09",
  "legal_entity_code": "LE-2000",
  "lines": [
    {
      "employee_id": "EMP-2000-id",
      "basic_salary": 30000,
      "allowances": 5000,
      "deductions": 2000,
      "overtime": 1000,
      "cost_unit_code": "CC-2000"
    }
  ]
}
```

- Calculates totalGross 36000, totalDeductions 2000, totalNet 34000.
- Posting: `PUT /api/payroll {"id": "run-id", "status": "POSTED"}` – creates FI doc via `fin_universal_ledger` – Dr Salary Expense Cr Cash/Bank, costUnitId ECUC, universalLedgerId FULC.
- Check: `GET /api/universal-ledger?referenceDocType=PAYROLL`

---

## 12. Step 10 – FICO Extended & Closing (Module10 100% DONE – Completing Module5 to 100%)

**User:** `finance_mgr`

### 12.1 Asset Master – FASC

**API:** `POST /api/assets` – **FASC Asset Create** alias `ASC` `AS01` – `AST-100001`

```json
{
  "asset_number": "AST-2000",
  "description": "Spice Grinder Machine",
  "asset_class_code": "AST-1000",
  "legal_entity_code": "LE-2000",
  "cost_unit_code": "CC-2000",
  "profit_unit_code": "PC-2000",
  "gl_account_number": "100000",
  "capitalization_date": "2026-09-01",
  "acquisition_value": 500000,
  "useful_life_months": 60,
  "depreciation_method": "STRAIGHT",
  "status": "ACTIVE"
}
```

### 12.2 Asset Posting – FAPT – Depreciation

**API:** `POST /api/asset-postings` – **FAPT Asset Posting Create** alias `APT` `AFAB` – `AP-10000001`

```json
{
  "asset_id": "AST-2000-id",
  "posting_type": "DEPRECIATION",
  "posting_date": "2026-09-30",
  "period_year": 2026,
  "period_month": 9,
  "depreciation_amount": 8333.33,
  "accumulated_depreciation": 8333.33,
  "book_value": 491666.67,
  "currency_code": "INR",
  "text": "Sep 2026 Depreciation – Grinder"
}
```

- Posts: Dr Depreciation Expense Cr Accumulated Depreciation via `fin_universal_ledger`.

### 12.3 Recurring Posting – FRPC

**API:** `POST /api/recurring-postings` – **FRPC Recurring Posting Create** alias `RPC` `FBD1` – `REC-10000001`

```json
{
  "legal_entity_code": "LE-2000",
  "ledger_account_number": "500000",
  "amount": 10000,
  "currency_code": "INR",
  "frequency": "MONTHLY",
  "next_run_date": "2026-10-01",
  "description": "Monthly Rent – Kochi Plant",
  "template": "{\"debit\": \"500000\", \"credit\": \"100000\", \"text\": \"Rent\"}"
}
```

- Job queue will pick nextRunDate and post monthly via `core_job_queue`.

### 12.4 FX Valuation – FFVC

**API:** `POST /api/fx-valuations` – **FFVC FX Valuation Create** alias `FVC` `FAGL_FC_VAL` – `FXV-10000001`

```json
{
  "legal_entity_code": "LE-2000",
  "currency_code": "USD",
  "valuation_date": "2026-09-30",
  "exchange_rate": 83.5,
  "valuation_method": "BALANCE_SHEET",
  "total_foreign_amount": 1000,
  "total_local_amount": 83500,
  "variance_amount": 500,
  "text": "FX Valuation Sep 2026 – USD"
}
```

- Posts variance via `fin_universal_ledger` – Dr/Cr FX Difference.

### 12.5 Closing Documents – FCDC – Period Closing

**API:** `POST /api/closing-documents` – **FCDC Closing Document Create** alias `CDC` `OB52` – `CLOSE-10000001`

```json
{
  "legal_entity_code": "LE-2000",
  "fiscal_year": 2026,
  "fiscal_period": 9,
  "closing_type": "MM",
  "text": "MM Closing Sep 2026 – Kochi"
}
```

- Close MM: `PUT /api/closing-documents {"id": "close-id", "status": "CLOSED"}` – sets closedAt, blocks further MM postings for that period if `fin_posting_calendar_period` isOpen false.
- Repeat for `SD`, `FICO`, `CO`, `ASSET`, `INVENTORY`, `PAYROLL`, `ALL`.

### 12.6 Cost Center Allocation – FCCA

**API:** `POST /api/...` – **FCCA Cost Center Allocation Create** alias `CCA` – `ALLOC-10000001`

```json
{
  "from_cost_unit_code": "CC-2000",
  "to_cost_unit_code": "PC-2000",
  "amount": 5000,
  "currency_code": "INR",
  "allocation_type": "ASSESSMENT",
  "period_year": 2026,
  "period_month": 9,
  "text": "Allocation Production to Profit Center"
}
```

---

## 13. Step 11 – Invoice Clearing & Auditing

### 13.1 Payment Clearing – Already in 7.7

- After IV, payment clears vendor. Check `fin_universal_ledger` – `is_cleared` or `clearing_id`.

### 13.2 Billing Clearing – B2B AR

**API:** `POST /api/payment` – for customer billing `BILL-90000001`

```json
{
  "partner_number": "CUS-2000",
  "legal_entity_code": "LE-2000",
  "amount": 2950,
  "currency_code": "INR",
  "payment_method": "BANK_TRANSFER",
  "reference_doc_number": "BILL-90000001",
  "text": "Payment received for BILL-90000001"
}
```

- Dr Cash Cr AR – clears billing, sets `isPaid` true, `paidAt`.

### 13.3 Document Flow – ALB

**API:** `GET /api/document-flow?referenceDocNumber=PO-4500000001`

- Should show chain: PR-10000001 → PO-4500000001 → GR-5000000001 → IV-5100000001 → Payment
- For sales: SO-10000001 → DN-80000001 → BILL-90000001 → Payment

**UI:** `/[companyCode]/workflow/inbox` – SBWP – shows workflow tasks.

### 13.4 Audit Logs – SM20 – WORM-lite

**API:** `GET /api/audit-logs?search=PO-4500000001`

- Immutable ledger – `audit_log` table – records who created/updated/deleted, timestamp, old/new values.
- Check WORM: Try to delete audit log – should fail – `is_reversed` flag instead.

**UI:** `/[companyCode]/foundation/audit-logs`

### 13.5 Universal Ledger – ACDOCA Equivalent – FULC

**API:** `GET /api/universal-ledger?legalEntityCode=LE-2000&fiscalYear=2026`

- Shows all postings: GR BSX/WRX, IV RE, Payment KZ, Sales RV, Billing F2, Payroll, Asset Depreciation, FX Valuation, Closing.
- Filter by `ledgerAccountId`, `costUnitId ECUC`, `profitUnitId EPUC`, `partnerId`, `itemId EMTC`, `facilityId FAC-2000`.

### 13.6 Workflow – ME54N/ME28 – Approval

**API:** `GET /api/workflow?status=PENDING`

- PR/PO require approval if amount > tolerance – `fin_tolerance_group` FTGC alias OBA4.
- Approve: `PUT /api/workflow {"id": "wf-id", "action": "APPROVE"}` – moves PR status RELEASED.

---

## 14. Step 12 – Different User Types Testing Matrix

| User | Email | Role | Allowed Functions | Test Scenario |
|---|---|---|---|---|
| Admin | admin@indusspice.test | SYSTEM_ADMIN | All | Create enterprise structure, roles, users |
| Finance Manager | finance@indusspice.test | FIN_MGR | FCOA, FGLC, FTXC, FAUC, FDTC, FAGC, FRGC, FASC, FPRC, FULC, FAPT, FRPC, FFVC, FCDC, FTRC, FCCA | Create CoA, GL, tax, asset, depreciation, recurring, FX valuation, closing, cost allocation, universal ledger review, tax report |
| Procurement Manager | proc@indusspice.test | PROC_MGR | PPRC, PPOC, PGRC, PIVC, PSTC, PIRC, PSRC, EMTC | Create PR, PO, GR, IV, STO, info record, source list, product |
| Warehouse Manager | wh@indusspice.test | WH_MGR | ISTC, IPDC, IRSC, ISRC, SDLC, PGRC | Stock view, transfer 311, PI creation/count/post, reservations, serials, delivery picking/goods issue |
| Production Manager | prod@indusspice.test | PROD_MGR | MBMC, MWCC, MRTC, MPVC, MMOC, MMRP, MKTC | Create work center, BOM, routing, production version, MO, MRP run, kitting, confirmation |
| Sales Manager | sales@indusspice.test | SALES_MGR | SSOC, SDLC, SBLC, SPWC, SCMR, FPRC | Create customer-material rel, pricing, SO, delivery, billing, POS webhook |
| HR Manager | hr@indusspice.test | HR_MGR | HOUC, HPOC, HEMC, HPRC, SU01, PFCG | Create org unit, position, employee, payroll, create users (can create users) |
| Auditor | auditor@indusspice.test | AUDITOR | Read-only FULC, FCDC, FTRC, SM20, ALB | View audit logs, document flow, universal ledger, closing docs, tax reports – should NOT be able to create/post |
| Cashier | cashier@indusspice.test | CASHIER | SSOC, SBLC, SPWC, ISTC | POS webhook cash sale, billing, stock view |

**RBAC Test:**
- Login as `AUDITOR` → try `POST /api/po` → should get 403 Forbidden – RBAC enforced.
- Login as `CASHIER` → try `POST /api/bom` → 403.
- Login as `HR_MGR` → try `POST /api/users` → should succeed (HR can create users).
- Login as `PROC_MGR` → try `POST /api/users` → 403.

**Secure by Default Test:**
- Set `MVP_NO_AUTH=false` → without session, `GET /api/pr` → 401 Unauthorized.
- With `X-API-KEY: isl-pos-key-2026`, `POST /api/sales/issue` → should succeed even without session (POS webhook allowed).
- Set `MVP_NO_AUTH=true` → all routes public (demo only) – `X-Auth-Mode: MVP_NO_AUTH=true - OPEN`.

---

## 15. End-to-End Scenario – Day in Life of ISL

**Day 1 – Setup (Admin):**
1. Login admin@indusspice.test
2. Create company group ISL (ECGC)
3. Create legal entity LE-2000 (ELEC)
4. Create facility FAC-2000 (EFCC), location LOC-2000 (EILC), commercial org CO-2000 (ECOC), sales channel CH-20 (ESCC), product line PL-SP (EPLC), procurement division PD-2000 (EPDC), buyer team BUY-200 (EBTC), dispatch point DP-2000 (EDPC)
5. Create currencies USD/EUR (FCYC), exchange rates (FEXC), fiscal calendar K4 (FFYC), posting calendar PC-2000 (FPPC), period variant PV-2000 open Sep (FPPE)
6. Create CoA ISL1 (FCOA), GL accounts 100000-500000 (FGLC), cost unit CC-2000 (ECUC), profit unit PC-2000 (EPUC), tax codes GST18 (FTXC), number ranges (FNRC), auto posting rules BSX/WRX/PRD (FAUC), doc types RE/WE/RV (FDTC), tolerance groups (FTGC)
7. Create UoM KG/PC (EUOC), material types (EMTP), products ROH-TURM-2000, FERT-GM-2000, KIT-MAS-2000 (EMTC), lot LOT-TURM-001 (ELTC), partners SUP-2000 (PSUC) and CUS-2000 (SCUC)
8. Create roles FIN_MGR, PROC_MGR, etc (PFCG), permissions, users (SU01)

**Day 2 – Procurement (proc_mgr):**
1. Create info record PIRC for SUP-2000 + ROH-TURM-2000, 100 INR/KG
2. Create source list PSRC MRP relevant
3. Create PR PPRC for 100 KG turmeric
4. Create PO PPOC from PR
5. Post GR PGRC 101 – 100 KG – check stock ISTC – 100 KG UNRESTRICTED
6. Post IV PIVC RE – 100 KG @100 + GST18
7. Post payment F-53 – clear vendor – check document flow ALB – PR→PO→GR→IV→Payment, check universal ledger FULC, audit logs SM20

**Day 3 – Manufacturing (prod_mgr + wh_mgr):**
1. Create work center WC-2000 MWCC
2. Create BOM BOM-2000 MBMC – FERT-GM-2000 needs 0.5 KG ROH-TURM-2000
3. Create routing ROUTING-2000 MRTC – 0010 Grinding, 0020 Packing
4. Create production version MPVC
5. Create production order MO-1000001 MMOC for 100 PC – components exploded 50 KG turmeric
6. Run MRP MMRP MD01 – check shortages, generated PRs
7. Create reservation IRSC for MO
8. Confirm production CONF-1000001 – yield 95, scrap 3 – posts 261 GI for turmeric, 101 GR for garam masala – check stock: turmeric 50 KG left (100-50), garam masala 95 PC new
9. Create kitting order MKTC for KIT-MAS-2000 – 20 kits – check minComponentExpiry

**Day 4 – Sales (sales_mgr + cashier + wh_mgr):**
1. Create customer-material rel SCMR – CUS-2000 + FERT-GM-2000 = MUM-GM-100
2. Create pricing FPRC PR00 50 INR/PC
3. Create sales order SSOC SO-10000001 for 50 PC FERT-GM-2000 to CUS-2000 – B2B AR
4. Create delivery SDLC DN-80000001 – PICKING → PICKED → GOODS_ISSUED – posts 601 GI – Dr COGS Cr Inventory – check stock: garam masala 45 PC left (95-50)
5. Create billing SBLC BILL-90000001 F2 – Dr AR Cr Revenue + Tax – check universal ledger
6. POS cash sale SPWC via `/api/sales/issue` with X-API-KEY – 2 PC – Dr Cash Cr Revenue – immediate clearing – check stock: 43 PC left, webhook log PWC PROCESSED
7. Post customer payment – clear AR – Dr Cash Cr AR – check billing isPaid true

**Day 5 – HR (hr_mgr):**
1. Create org unit OU-2000 HOUC
2. Create position POS-2000 HPOC
3. Create employee Ramesh Nair HEMC EMP-10000001 – basic 30000 INR
4. Create payroll run HPRC for Sep 2026 – 1 employee – totalNet 34000 – POSTED – posts FI doc via FULC – check universal ledger PAYROLL

**Day 6 – Finance Closing (finance_mgr):**
1. Create asset AST-2000 FASC – Grinder 500000 INR, 60 months, STRAIGHT
2. Post depreciation FAPT – 8333.33 Sep – check book value 491666.67 – FI posting via FULC
3. Create recurring posting FRPC – Rent 10000 MONTHLY – nextRun 2026-10-01
4. Post FX valuation FFVC – USD 1000 @83.5 – variance 500 – FI posting
5. Create closing docs FCDC – MM, SD, FICO, CO, ASSET, INVENTORY, PAYROLL, ALL for fiscalYear 2026 period 9 – status OPEN → CLOSED → LOCKED – test that after CLOSED, further postings for that period are blocked if posting calendar isOpen false
6. Post cost center allocation FCCA – 5000 from CC-2000 to PC-2000 – ASSESSMENT
7. Create tax report FTRC – GST 18% – totalTaxable 2500, totalTax 450 – status DRAFT → SUBMITTED → PAID

**Day 7 – Audit (auditor):**
1. Login auditor@indusspice.test
2. View universal ledger FULC – filter by LE-2000, fiscalYear 2026 – verify all postings balanced debit=credit
3. View document flow ALB for PO-4500000001 and SO-10000001 – verify chains
4. View audit logs SM20 – filter by table `proc_purchase_order`, `sales_order`, `inventory_stock` – verify WORM-lite – cannot delete logs
5. View closing docs FCDC – verify all closed
6. View workflow inbox SBWP – pending approvals
7. Export reports – trial balance, stock valuation, sales register, purchase register, payroll register

---

## 16. API Quick Reference – Curl Examples

**Auth:** Login first to get session cookie, or use `MVP_NO_AUTH=true` for open mode. For POS webhook, use `X-API-KEY`.

```bash
# Login to get cookie (if MVP_NO_AUTH=false)
curl -c cookies.txt -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@indusspice.test","password":"Test@123456"}'

# Use cookie for subsequent calls
curl -b cookies.txt http://localhost:3000/api/pr?limit=10

# POS webhook with API key (no session needed)
curl -X POST http://localhost:3000/api/sales/issue \
  -H "X-API-KEY: isl-pos-key-2026" \
  -H "Content-Type: application/json" \
  -d '{"source":"POS_FOODICS","externalId":"POS-001","facility_code":"FAC-2000","legal_entity_code":"LE-2000","payload":{"items":[{"sku":"FERT-GM-2000","quantity":2,"unitPrice":50}],"paymentType":"CASH","customerName":"Walk-in"}}'

# Create Legal Entity
curl -b cookies.txt -X POST http://localhost:3000/api/legal-entities \
  -H "Content-Type: application/json" \
  -d '{"code":"LE-2000","name":"Indus Spice Labs Pvt Ltd","company_group_code":"ISL","country":"IN","currency_code":"INR"}'

# Create Product
curl -b cookies.txt -X POST http://localhost:3000/api/materials \
  -H "Content-Type: application/json" \
  -d '{"item_number":"ROH-TURM-2000","name":"Raw Turmeric","type":"ROH","base_uom":"KG"}'

# Create PR
curl -b cookies.txt -X POST http://localhost:3000/api/pr \
  -H "Content-Type: application/json" \
  -d '{"facility_code":"FAC-2000","legal_entity_code":"LE-2000","lines":[{"item_number":"ROH-TURM-2000","quantity":100,"uom_code":"KG"}]}'

# Stock view
curl -b cookies.txt "http://localhost:3000/api/stock?facilityId=FAC-2000&search=ROH-TURM"

# Sales Order
curl -b cookies.txt -X POST http://localhost:3000/api/sales-orders \
  -H "Content-Type: application/json" \
  -d '{"facility_code":"FAC-2000","partner_number":"CUS-2000","type":"B2B","payment_type":"AR","lines":[{"item_number":"FERT-GM-2000","quantity":50,"unit_price":50}]}'

# Universal Ledger
curl -b cookies.txt "http://localhost:3000/api/universal-ledger?legalEntityCode=LE-2000&limit=20"

# Audit Logs
curl -b cookies.txt "http://localhost:3000/api/audit-logs?search=PO-4500000001"
```

---

## 17. UI Navigation Paths

- **Enterprise Structure:** `/LE-2000/foundation/enterprise-structure` – tabs: Company Groups ECGC, Legal Entities ELEC, Facilities EFCC, Inventory Locations EILC, Commercial Orgs ECOC, Sales Channels ESCC, Product Lines EPLC, Procurement Divisions EPDC, Buyer Teams EBTC, Dispatch Points EDPC, Warehouse Sites EWSC
- **UoM:** `/LE-2000/foundation/uom` – dedicated CUNI page – EUOC
- **Material Types:** `/LE-2000/foundation/material-types` – EMTP – OMS2
- **Products:** `/LE-2000/foundation/materials` – EMTC – MM01 – 8 tabs: Basic, Facility Profile, Commercial Profile, Quality, Classification, Accounting, etc
- **Partners:** `/LE-2000/foundation/partners` – PTNC – BP01 – tabs: All, Customers SCUC, Suppliers PSUC, Employees HEMC
- **Currencies:** `/LE-2000/fico/currencies` – FCYC – OY03 – INR default
- **Tax Codes:** `/LE-2000/fico/tax-codes` – FTXC – FTXP
- **Chart of Accounts:** `/LE-2000/fico/chart-of-accounts` – FCOA – OB13
- **GL Accounts:** `/LE-2000/fico/gl-accounts` – FGLC – FS00 – secure delete
- **Cost Units:** `/LE-2000/fico/cost-centers` – ECUC – KS01 – edit/delete only, no KS02/Secure/Blocked text, error on delete if has postings
- **Profit Units:** `/LE-2000/fico/profit-centers` – EPUC – KE51
- **Number Ranges:** `/LE-2000/foundation/number-ranges` – FNRC – FBN1
- **Auto Posting Rules:** `/LE-2000/fico/auto-posting-rules` – FAUC – OBYC – BSX/WRX/PRD
- **Document Types:** `/LE-2000/fico/document-types` – FDTC – OBA7 – RE/WE/RV
- **Fiscal Calendars:** `/LE-2000/fico/fiscal-calendars` – FFYC – OB29 – K4
- **Posting Calendars:** `/LE-2000/fico/posting-calendars` – FPPC – OBBO
- **Posting Period Variants:** `/LE-2000/fico/posting-period-variants` – FPPE – OB52
- **Account Groups:** `/LE-2000/fico/account-groups` – FAGC – OBD4
- **Retained Earnings:** `/LE-2000/fico/retained-earnings` – FRGC – OB53
- **Assets:** `/LE-2000/fico/assets` – FASC – AS01
- **Asset Postings:** `/LE-2000/fico/asset-postings` – FAPT – AFAB
- **Pricing Conditions:** `/LE-2000/fico/pricing-conditions` – FPRC – VK11 – PR00/K004/KF00/MWST
- **Universal Ledger:** `/LE-2000/fico/universal-ledger` – FULC – ACDOCA – leading/non-leading, fiscalYear/Period, cost/profit/partner/item/facility/lot/tax dimensions
- **Recurring Postings:** `/LE-2000/fico/recurring-postings` – FRPC – FBD1
- **FX Valuations:** `/LE-2000/fico/fx-valuations` – FFVC – FAGL_FC_VAL
- **Tax Reports:** `/LE-2000/fico/tax-reports` – FTRC
- **Closing Documents:** `/LE-2000/fico/closing-documents` – FCDC – OB52 – MM/SD/FICO/CO/ASSET/INVENTORY/PAYROLL/ALL – OPEN/CLOSED/LOCKED
- **Cost Center Allocations:** `/LE-2000/fico/cost-allocations` – FCCA – KSB1
- **PR:** `/LE-2000/mm/pr` – PPRC – ME51N
- **PO:** `/LE-2000/mm/po` – PPOC – ME21N
- **GR:** `/LE-2000/mm/gr` – PGRC – MIGO – 101/102/122/261/262/311/321 etc
- **IV:** `/LE-2000/mm/iv` – PIVC – MIRO – RE
- **STO:** `/LE-2000/mm/sto` – PSTC – ME27 – ONE_STEP/TWO_STEP
- **Info Records:** `/LE-2000/mm/info-records` – PIRC – ME11 – PIR-1000001
- **Source Lists:** `/LE-2000/mm/source-lists` – PSRC – ME01
- **Physical Inventory:** `/LE-2000/mm/physical-inventory` – IPDC – MI01/MI04/MI07 – CREATED/COUNT_ENTERED/POSTED/CANCELLED
- **Stock:** `/LE-2000/foundation/stock` – ISTC – MMBE – multi-facility, lot, expiry warnings <24h red animate-pulse critical, <48h orange warning
- **Reservations:** `/LE-2000/mm/reservations` – IRSC – MB21 – RES-10000001
- **Serials:** `/LE-2000/mm/serials` – ISRC – IQ01 – SER-10000001
- **BOM:** `/LE-2000/pp/bom` – MBMC – CS01 – BOM-1001
- **Work Centers:** `/LE-2000/pp/work-centers` – MWCC – CR01 – WC-1000
- **Routings:** `/LE-2000/pp/routings` – MRTC – CA01 – ROUTING-1001
- **MRP:** `/LE-2000/pp/mrp` – MMRP – MD01 – MRP-1001
- **Kitting:** `/LE-2000/pp/kitting` – MKTC – KIT-1000001
- **Sales Orders:** `/LE-2000/sd/sales-orders` – SSOC – VA01 – SO-10000001
- **Delivery:** `/LE-2000/sd/delivery` – SDLC – VL01N – DN-80000001 – DRAFT/PICKING/PICKED/GOODS_ISSUED
- **Billing:** `/LE-2000/sd/billing` – SBLC – VF01 – BILL-90000001 – DRAFT/POSTED/CANCELLED – F2/F1/CREDIT/DEBIT
- **Customer Items:** `/LE-2000/sd/customer-items` – SCMR – VD51
- **POS Webhook Logs:** `/LE-2000/sd/pos-webhook-logs` – SPWC – PWC
- **HR Org Units:** `/LE-2000/hr/org-units` – HOUC – PP01 – OU-1000
- **HR Positions:** `/LE-2000/hr/positions` – HPOC – PO13 – POS-1000
- **HR Employees:** `/LE-2000/hr/employees` – HEMC – PA30 – EMP-10000001
- **Payroll:** `/LE-2000/hr/payroll` – HPRC – PC00 – 2026-09
- **Users:** `/LE-2000/foundation/users` – SU01 – username dropdown shows username (email prefix if no username), not full email
- **Roles:** `/LE-2000/foundation/roles` – PFCG
- **Audit Logs:** `/LE-2000/foundation/audit-logs` – SM20 – WORM-lite
- **Document Flow:** `/LE-2000/foundation/document-flow` – ALB – PR→PO→GR→IV→Payment, SO→DN→BILL→Payment
- **Workflow Inbox:** `/LE-2000/workflow/inbox` – SBWP – ME54N/ME28
- **Functions:** `/api/functions` – shows all helper codes + aliases + descriptions – search palette – selected stays bg-zinc-900 hover:bg-black, unselected hover:bg-zinc-100

---

## 18. Testing Checklist – Tick After Each Step

### Foundation
- [ ] Tenant TEN-100 exists
- [ ] Company Group ISL created ECGC
- [ ] Legal Entity LE-2000 created ELEC – INR default
- [ ] Facility FAC-2000 created EFCC
- [ ] Inventory Location LOC-2000 created EILC
- [ ] Commercial Org CO-2000 ECOC, Sales Channel CH-20 ESCC, Product Line PL-SP EPLC, Procurement Division PD-2000 EPDC, Buyer Team BUY-200 EBTC, Dispatch Point DP-2000 EDPC, Warehouse WH-2000 EWSC
- [ ] Currencies – INR default, USD/EUR added FCYC OY03
- [ ] Exchange Rates USD→INR 83.5 FEXC OB08
- [ ] Fiscal Calendar K4 FFYC OB29
- [ ] Posting Calendar PC-2000 FPPC OBBO + Period Variant PV-2000 open Sep FPPE OB52
- [ ] Chart of Accounts ISL1 FCOA OB13 + GL accounts 100000-500000 FGLC FS00
- [ ] Cost Unit CC-2000 ECUC KS01 + Profit Unit PC-2000 EPUC KE51 – edit/delete only, no Secure/Blocked text, error on delete with audit trail message
- [ ] Tax Codes GST18 FTXC FTXP
- [ ] Number Ranges FNRC FBN1 – SO-, DN-, BILL-, PO-, MAT-, PI-, EMP-, AP-, REC-, FXV-, CLOSE-, RES-, SER-
- [ ] Auto Posting Rules BSX/WRX/PRD FAUC OBYC
- [ ] Document Types RE/WE/RV FDTC OBA7
- [ ] Tolerance Groups FTGC OBA4
- [ ] Account Groups FAGC OBD4, Retained Earnings FRGC OB53

### Master Data
- [ ] UoM KG/PC EUOC CUNI – dedicated /foundation/uom page, NAV and lib/tcodes updated – shows mm01 not uom configure fixed
- [ ] Material Types ROH/HALB/FERT EMTP OMS2
- [ ] Products ROH-TURM-2000, FERT-GM-2000, KIT-MAS-2000 EMTC MM01 – 8 tabs, facility profile FAC-2000, commercial profile CO-2000/CH-20/PL-SP, lot_control BLOCKED, pricing_method MOVING_AVG/STANDARD
- [ ] Lot LOT-TURM-001 ELTC MSC3N – lot_number, expiry_date
- [ ] Partners SUP-2000 PSUC + CUS-2000 SCUC – EPAC PTNC BP01 – role VENDOR/CUSTOMER

### Users & Roles
- [ ] Roles FIN_MGR, PROC_MGR, WH_MGR, PROD_MGR, SALES_MGR, HR_MGR, AUDITOR, CASHIER created PFCG
- [ ] Users finance@, proc@, wh@, prod@, sales@, hr@, auditor@, cashier@ created SU01 – username dropdown shows username not full email
- [ ] RBAC tested – AUDITOR cannot POST /api/po (403), CASHIER cannot POST /api/bom (403), HR_MGR can create users, PROC_MGR cannot create users (403)
- [ ] Secure by default – MVP_NO_AUTH=false → /api/pr without session → 401, with X-API-KEY for /api/sales/issue → success

### MM Procurement
- [ ] Info Record PIRC PIR-1000001 – SUP-2000 + ROH-TURM-2000 – 100 INR/KG – facility FAC-2000
- [ ] Source List PSRC – MRP relevant
- [ ] PR PPRC PR-10000001 – 100 KG – FAC-2000 – CC-2000
- [ ] PO PPOC PO-4500000001 – from PR – SUP-2000 – 100 KG @100 – LOC-2000
- [ ] GR PGRC GR-5000000001 – 101 – 100 KG LOT-TURM-001 – stock ISTC shows 100 KG UNRESTRICTED – BSX/WRX posting via FAUC – universal ledger FULC shows FI doc
- [ ] IV PIVC IV-5100000001 – RE – 100 KG – tax GST18 – WRX clearing + RE posting – PO quantityInvoiced 100
- [ ] Payment F-53 – 11800 INR – clears vendor – Dr Vendor Cr Cash – document flow ALB shows PR→PO→GR→IV→Payment – universal ledger shows clearing

### Inventory
- [ ] Stock ISTC – GET /api/stock?facilityId=FAC-2000 – 100 KG turmeric, expiry OK
- [ ] Transfer 311 – 10 KG – 2 ledger entries – inventory_stock_ledger
- [ ] Reservation IRSC RES-10000001 – 50 PC FERT-GM-2000 for MO-1000001
- [ ] Serial ISRC SER-10000001 – FERT-GM-2000 – IN_STOCK
- [ ] Physical Inventory IPDC PI-10000001 – FAC-2000/LOC-2000 – system 90 counted 95 variance +5 – COUNT_ENTERED → POSTED – 701/702 adjustment – FI posting – isBlockingActive blocks 101/261/601 when COUNT_ENTERED

### PP Manufacturing
- [ ] Work Center WC-2000 MWCC – FAC-2000 – CC-2000 – capacity 100/h – labor 200/h – machine 150/h – overhead 10% – setup 30m
- [ ] BOM BOM-2000 MBMC – FERT-GM-2000 needs 0.5 KG ROH-TURM-2000 – scrap 2% – work center WC-2000 – type STANDARD – status ACTIVE – base 100 PC – expiryRule MIN_COMPONENTS
- [ ] Routing ROUTING-2000 MRTC – 0010 Grinding 10/5/5, 0020 Packing 5/2/3 – work center WC-2000 – base 100
- [ ] Production Version MPVC PV-1001 – BOM-2000 + ROUTING-2000 + lot 1-1000
- [ ] Production Order MMOC MO-1000001 – 100 PC FERT-GM-2000 – FAC-2000 – BOM-2000 – WC-2000 – target lot LOT-GM-2000 – planned 2026-09-30 to 2026-10-01 – status CREATED – components exploded 50 KG turmeric – targetExpiryDate MIN(component expiries)
- [ ] MRP MMRP MRP-1001 – FAC-2000 – horizon 30 – safetyStock true – salesOrders true – elements STOCK/SAFETY_STOCK/SALES_ORDER/PR/PO/PLANNED_ORDER/PROD_ORDER/STO – shortages → generated PR PPRC
- [ ] Kitting MKTC KIT-1000001 – KIT-MAS-2000 – 20 kits – minComponentExpiry calculatedExpiry – K01/K02 movements
- [ ] Confirmation CONF-1000001 – MO-1000001 – WC-2000 – yield 95 scrap 3 rework 2 – posts 261 GI for turmeric, 101 GR for garam masala – stock: turmeric 50 left, garam masala 95 new – FI posting FULC – MO status CONFIRMED

### SD Sales
- [ ] Customer-Material Rel SCMR – CUS-2000 + FERT-GM-2000 = MUM-GM-100 – VD51
- [ ] Pricing FPRC – PR00 50 INR/PC – K004 Discount, KF00 Freight, MWST Tax – conditionType BASE/DISCOUNT/SURCHARGE/FREIGHT/TAX – origin MANUAL/AUTOMATIC/MASTER_DATA – isPercentage – pricing engine Base+Discount+Freight+Surcharge+Tax=Net
- [ ] Sales Order SSOC SO-10000001 – FAC-2000 – LE-2000 – CUS-2000 – B2B AR – MANUAL – PO MUM-PO-001 – DP-2000 – 02 – ROUTE-01 – EXW – F2 – 0001 – INR – 50 PC @50 – commercialOrg CO-2000 was sales_org, salesChannel CH-20 was distribution_channel, productLine PL-SP was division
- [ ] Delivery SDLC DN-80000001 – SO-10000001 – FAC-2000 – shipTo CUS-2000 – DP-2000 – DRAFT → PICKING → PICKED → GOODS_ISSUED – 601 GI – Dr COGS Cr Inventory – stock 45 left
- [ ] Billing SBLC BILL-90000001 – SO-10000001 + DN-80000001 – CUS-2000 – F2 – 50 PC – 2500 + tax 450 – Dr AR Cr Revenue+Tax – status DRAFT → POSTED – currency INR was KWD
- [ ] POS Webhook SPWC – Foodics – POS-2026-001 – 2 PC cash – X-API-KEY isl-pos-key-2026 – Dr Cash Cr Revenue – immediate clearing – stock 43 left – webhook log PWC PROCESSED
- [ ] Customer Payment – clear AR – Dr Cash Cr AR – BILL isPaid true – dueDate, paidAt

### HR
- [ ] Org Unit OU-2000 HOUC – FAC-2000 – PP01
- [ ] Position POS-2000 HPOC – OU-2000 – PO13 – isManager false
- [ ] Employee Ramesh Nair HEMC EMP-10000001 – POS-2000 – FAC-2000 – LE-2000 – CC-2000 – ACTIVE – hire 2026-01-15 – basic 30000 INR – currency INR was KWD – PA30
- [ ] Payroll Run HPRC – 2026-09 – LE-2000 – 1 employee – gross 36000 deductions 2000 net 34000 – DRAFT → POSTED → PAID – FI posting via FULC – Dr Salary Expense Cr Cash – costUnit ECUC

### FICO Extended & Closing
- [ ] Asset AST-2000 FASC – Grinder – class AST-1000 – LE-2000 – CC-2000 – PC-2000 – GL 100000 – capitalization 2026-09-01 – acquisition 500000 – useful 60 – STRAIGHT – ACTIVE – AS01
- [ ] Asset Posting FAPT AP-10000001 – AST-2000 – DEPRECIATION – 2026-09-30 – 2026-9 – 8333.33 – accumulated 8333.33 – book 491666.67 – INR – FI posting – AFAB
- [ ] Recurring Posting FRPC REC-10000001 – LE-2000 – GL 500000 – 10000 INR – MONTHLY – nextRun 2026-10-01 – FBD1
- [ ] FX Valuation FFVC FXV-10000001 – LE-2000 – USD – 2026-09-30 – 83.5 – BALANCE_SHEET – foreign 1000 local 83500 variance 500 – DRAFT → POSTED – FAGL_FC_VAL
- [ ] Closing Docs FCDC CLOSE-10000001 – LE-2000 – fiscalYear 2026 period 9 – closingType MM/SD/FICO/CO/ASSET/INVENTORY/PAYROLL/ALL – OPEN → CLOSED → LOCKED – OB52 – test blocking after CLOSED
- [ ] Cost Center Allocation FCCA ALLOC-10000001 – from CC-2000 to PC-2000 – 5000 INR – ASSESSMENT – 2026-9 – KSB1
- [ ] Tax Report FTRC TAXR-10000001 – LE-2000 – 2026-9 – taxRule GST18 – taxable 2500 tax 450 – DRAFT → SUBMITTED → PAID

### Invoice Clearing & Auditing
- [ ] Payment clearing – vendor IV-5100000001 cleared, customer BILL-90000001 cleared – universal ledger FULC shows clearing
- [ ] Document Flow ALB – PO-4500000001 chain PR→PO→GR→IV→Payment, SO-10000001 chain SO→DN→BILL→Payment – GET /api/document-flow
- [ ] Audit Logs SM20 – GET /api/audit-logs?search=PO-4500000001 – immutable WORM-lite – cannot delete, is_reversed flag
- [ ] Universal Ledger FULC – GET /api/universal-ledger?legalEntityCode=LE-2000&fiscalYear=2026 – all postings balanced, dimensions cost/profit/partner/item/facility/lot/tax
- [ ] Workflow SBWP – GET /api/workflow?status=PENDING – PR/PO approval ME54N/ME28 – approve → status RELEASED
- [ ] Function Search – palette – search ELEC, PPOC, MBMC, SSOC, ISTC, HOUC, FAPT – should redirect to background function (function is destination, code is helper identifier) – both_exact search, exact first partial then
- [ ] Build – 96 routes – no middleware deprecation warning – shows ƒ Proxy (Middleware) – src/proxy.ts migrated from middleware.ts

---

## 19. Feedback & Error Reporting Template

After manual testing, provide feedback in this format:

```
**Tester:** [Your Name] – [Role Tested – e.g., PROC_MGR]
**Date:** 2026-09-29
**Company Tested:** LE-2000 Indus Spice Labs Pvt Ltd

**Scenario:** [e.g., Create PO PPOC]
**Steps:**
1. Login as proc@indusspice.test
2. POST /api/po with ...
**Expected:** PO-4500000001 created, status CREATED
**Actual:** [What happened]
**Error Message:** [Copy exact error, e.g., 500, 400, 403, etc]
**Screenshots:** [Attach if UI]
**Helper Code Used:** PPOC / ME21N
**API:** /api/po
**Facility:** FAC-2000
**Item:** ROH-TURM-2000
**Legal Entity:** LE-2000
**Currency:** INR
**Severity:** [Critical / Major / Minor / Enhancement]
**Module:** [MM / PP / SD / FICO / HR / Inventory / Foundation]
**Build Routes:** 96
**Additional Notes:** [Anything else]

**Feedback for Guide:** [Was guide clear? What was missing?]
```

**Collect all errors and send – I will fix module-by-module after your confirmation.**

---

## 20. Known Legal-Safe Mappings – For Debugging

| Legacy (Old) | New Legal-Safe | Code | Helper Code | Notes |
|---|---|---|---|---|
| ent_company_code | org_legal_entity | LE-2000 | ELEC O02 | LE-1000 was 1000, LE-2000 new |
| ent_plant | org_facility | FAC-2000 | EFCC OX10 | FAC-1000 was 1000, FAC-2000 new |
| ent_storage_location | org_inventory_location | LOC-2000 | EILC OX09 | LOC was sloc |
| ent_material_master | prod_item | ROH-TURM-2000 | EMTC MM01 | item_number was material_number, ROH→RAW but kept ROH for convenience |
| ent_batch | inv_lot | LOT-TURM-001 | ELTC MSC3N | lot_number was batch_number |
| ent_business_partner | partner_account | SUP-2000 / CUS-2000 | PSUC/SCUC BP01 | role VENDOR/CUSTOMER |
| ent_uom | core_unit_measure | KG/PC | EUOC CUNI | dedicated /foundation/uom page |
| ent_currency | core_currency | INR | FCYC OY03 | Only INR default |
| fi_gl_account | fin_ledger_account | 100000 | FGLC FS00 | chart_id was coa_id |
| fi_cost_center | org_cost_unit | CC-2000 | ECUC KS01 | costUnitId was cost_center_id, INR/h |
| fi_document | fin_universal_journal | FI-1000000001 | FULC ACDOCA | universalLedgerId was fi_document_id |
| mm_purchase_requisition | proc_purchase_requisition | PR-10000001 | PPRC ME51N | facilityId was plant_id, INR default was KWD |
| mm_purchase_order | proc_purchase_order | PO-4500000001 | PPOC ME21N | partnerId PSUC was vendor_id, facilityId FAC-1000 |
| mm_goods_receipt | proc_goods_receipt | GR-5000000001 | PGRC MIGO | lotId ELTC was batch_id, stockStatus UNRESTRICTED/QUALITY_INSPECTION |
| mm_invoice_verification | proc_invoice_verification | IV-5100000001 | PIVC MIRO | partnerId PSUC, priceVariance PRD MAP |
| sd_sales_order | sales_order | SO-10000001 | SSOC VA01 | partnerId SCUC was customer_id, facilityId FAC-1000, currencyCode INR was KWD, commercialOrgId CO-2000 was sales_org |
| sd_delivery | sales_delivery | DN-80000001 | SDLC VL01N | shipToPartnerId SCUC was ship_to_customer_id, facilityId FAC-1000 |
| sd_billing | sales_billing | BILL-90000001 | SBLC VF01 | partnerId SCUC, currencyCode INR was KWD, Dr AR Cr Revenue+Tax |
| inv_stock | inventory_stock | - | ISTC MMBE | itemId EMTC was material_id, facilityId FAC-1000 was plant_id, inventoryLocationId was sloc_id, lotId ELTC was batch_id |
| pi_document | inventory_physical_document | PI-10000001 | IPDC MI01 | facilityId FAC-1000 was plant_id, inventoryLocationId was sloc_id, universalLedgerId FULC was fi_document_id |
| hr_org_unit | hr_organization_unit | OU-2000 | HOUC PP01 | facilityId FAC-1000 was plant_id |
| hr_employee | hr_employee_master | EMP-10000001 | HEMC PA30 | facilityId FAC-1000, legalEntityId LE-1000 was company_code_id, costUnitId ECUC was cost_center_id, currencyCode INR was KWD |
| fin_asset | fin_asset | AST-2000 | FASC AS01 | legalEntityId LE-1000 was company_code_id |
| fin_asset_posting | fin_asset_posting | AP-10000001 | FAPT AFAB | NEW – was MISSING |
| - | fin_recurring_posting | REC-10000001 | FRPC FBD1 | NEW – was MISSING |
| - | fin_fx_valuation | FXV-10000001 | FFVC FAGL_FC_VAL | NEW – was MISSING |
| - | fin_closing_document | CLOSE-10000001 | FCDC OB52 | NEW – was MISSING |

---

## 21. Final Notes

- **Fresh empty per requirement** – No hardcoded data for PR/PO/GR/IV/STO/BOM/Routing/MO/MRP/Kitting/SO/Delivery/Billing/PI/Reservations/Serials/HR/Payroll/Asset Postings/Recurring/FX/Closing – but common sample CoA, GL, Tax, Currencies, UoM, Number Ranges kept for user convenience – INR default.
- **Helper codes kept as-is and auto-generate** – 4-char MOOA – module grouped intuitive – same length as legacy but own IP – function is destination, code is helper identifier – searching tcode redirects to background function.
- **Search:** both_exact – keep existing code search plus new descriptive terms – exact first, partial then.
- **Cost Center UI:** Buttons just Edit/Delete, no KS02/Secure/Blocked text, no bottom Restriction div, error shown only on delete attempt with audit trail message.
- **CUNI shows mm01 not uom configure** – fixed via dedicated /foundation/uom page, NAV and lib/tcodes updated.
- **Remove all mentions of SAP from workspace everywhere** – done – selected option everywhere.
- **T-Code badge:** Kept but hide via .env NEXT_PUBLIC_SHOW_FUNCTION_CODE=false – future special name to be discussed.
- **Middleware deprecation:** Fixed via src/proxy.ts migration from middleware.ts for Next.js 16 – build shows ƒ Proxy (Middleware) without warning.
- **GitHub:** https://github.com/deepakpt2/erp-modular-monolith – main branch – latest commit c55df02 – 96 routes – build passes via `npm install --silent && npx next build`.

**END OF GUIDE – Implement ISL fictional company, test all flows, provide feedback/errors – I will fix module-by-module after your confirmation.**

