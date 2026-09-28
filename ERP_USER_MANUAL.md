# ERP Modular Monolith – Comprehensive User Manual
**Version:** 3.0 – Clean UI, Function Enforcement, Dedicated CUNI/OMS2, Secure Deletes
**For:** Manual Testing from Scratch – Single Admin User to Invoice Clear
**Covers:** Company Creation → Material → PR → PO → GR → IV → Payment Clearing + Sales + Production + HR + Audit
**Repo:** https://github.com/deepakpt2/erp-modular-monolith

---

## 1. Overview & What This ERP Does

This ERP is a modular monolith enterprise S/4HANA, covering:

- **FOUNDATION:** Enterprise Structure (Company, Company Code OX02, Plant OX10, SLoc OX09, Purch Org OX08, Sales Org), Material Types OMS2 (configurable ROH/HALB/FERT/HAWA/VERP/NLAG/DIEN), Units of Measure CUNI (dedicated page /foundation/uom – KG/G/L/ML/PC/BOX/PACK/KIT/M/TON configurable), Materials MM01/MM02/MM03 with 8 real ERP tabs, Stock MMBE
- **FICO:** Chart of Accounts OB13 (General CoA INT/KSCA/CAUS/GKR/YIN – ERP defaults kept), G/L Account Groups OBD4 configurable, G/L Accounts FS00 configurable with secure delete, Cost Centers KS01/KS02/KS03 with edit/delete secure (audit trail), Tax Codes FTXP (VAT 5% V5/A5 + GST5 5% India), Currencies OY03 (Only INR default, KWD/USD/EUR added by user), Posting Period Variant OBBO/OB52/OBBP configurable, Payment Processing F-53/KZ 53*, CCA Report KSB1, Costing Run CK40N
- **MM:** Purchase Requisition ME51N, Purchase Order ME21N/ME22N/ME23N, Goods Receipt MIGO 101/102 + 261/262, Invoice Verification MIRO 51 RE, Physical Inventory MI01/MI04/MI07, Stock Transport Order ME27
- **PP:** BOM CS01/CS02/CS03, Work Centers CR01/CR02/CR03, Routings CA01/CA02/CA03, MRP MD01/MD04, Kitting Stocked/Phantom
- **SD:** Sales Orders VA01/VA02/VA03 + POS Webhook `/api/sales/issue`, Delivery VL01N, Billing VF01
- **HR:** Employees PA30, Payroll PC00 – payroll uses `hr_employee.basic_salary` per employee (never hardcoded), 300 KWD test seed / 10000 INR mapped to cost center
- **AUDIT/WORKFLOW:** Document Flow ALB, Audit Logs SM20 WORM-lite, Workflow Inbox SBWP/ME54N/ME28
- **ADMIN:** User Management SU01, Roles & Permissions PFCG, My Profile & Password – username itself is dropdown button, shows username (email prefix if no username), not full email

**Key Principles:**
- Secure by default: `MVP_NO_AUTH=false` → all routes require login
- RBAC: `ent_role`, `ent_permission`, `ent_role_permission`, `ent_user_role`, `ent_user_permission`
- HR Manager can create users
- Only INR default per OY03 – all other currencies (KWD etc) must be added by user via OY03 UI /api/currencies
- General CoA and accounts available like ERP – INT, KSCA, CAUS, GKR, YIN – kept as ERP defaults – configurable via OB13/FS00
- From this point any function added with ERP Function code must be available in app too – enforced via `src/shared/kernel/function codes.ts` FUNCTION_MAP and `GET /api/function codes`
- Clean UI – no redundant `Secure – Blocked if has...` on buttons, no duplicated restriction text at bottom – error shown only when delete blocked: `Cannot delete – has employees/postings and cannot be deleted to maintain audit trail. Deactivated instead.`
- Side panel sections collapsible (localStorage `erp-nav-collapsed-groups` with ▶/▼), view preference (modern/classic) persisted `erp-home-view` – single view only, hover fix selected `bg-zinc-900 hover:bg-black` visible
- Function search palette hover fixed – selected stays `bg-zinc-900 text-white hover:bg-black`, unselected `hover:bg-zinc-100` visible

---

## 2. Prerequisites – Traefik + Docker

ERP runs behind Traefik with SSL at `er.deepakpt.com`, but works locally via Docker Compose without Traefik.

Requirements: Docker 24+, Compose v2, 4GB RAM, 10GB disk, ports 3000, 5432.

Traefik handles Host → erp:3000, auto SSL. For local test just `docker compose up`. Postgres volume `pgdata` persists DB. Delete volume to start from scratch.

Checklist:
- [ ] Docker: `docker --version`
- [ ] Git
- [ ] Ports free
- [ ] `.env` created

---

## 3. Fresh Deployment from Git – From Zero

### 3.1 Clone & Env

```bash
git clone https://github.com/deepakpt2/erp-modular-monolith.git
cd erp-modular-monolith
cp .env.example .env
nano .env
```

**.env for scratch test (single admin):**
```
DATABASE_URL=postgresql://erp:erp123@localhost:5432/erp
NEXTAUTH_SECRET=your-32-char-secret-change-in-prod-123456
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@test.com
ADMIN_PASSWORD=Test@123456
MVP_NO_AUTH=false
AUTO_MIGRATE=true
KSPL_ENABLED=true
FMCG_SAMPLE_DATA_ENABLED=false
POS_WEBHOOK_API_KEY=test-webhook-key-123
```

`ADMIN_EMAIL` / `ADMIN_PASSWORD` creates first user on first `docker compose up` via `AUTO_MIGRATE=true`.

### 3.2 Run

```bash
docker compose up -d --build
docker compose logs -f auto-migrate
# Wait Seed complete + Admin user created
```

Or dev:
```bash
npm install
npm run db:push
npm run dev
```

Open `http://localhost:3000/login` → Login with admin@test.com / Test@123456

### 3.3 Delete All Data – Start from Scratch

```bash
docker compose down -v
docker compose up -d --build
# Only admin recreated
```

For this manual, assume full scratch – only admin user exists, no company, no materials.

---

## 4. Initial Login – Single Admin User

1. Go to `/login`
2. Email: `admin@test.com`, Password: `Test@123456`
3. Header now shows **username** (email prefix if no username) as button with avatar + ▼, not full email – hover shows dropdown with My Profile, Users, Roles, Sign Out – no separate ☰ button
4. Home header same – username button acts as dropdown, hover works
5. Go to `/1000/foundation/user-profile` – My Profile + Change Password

**Password change test:**
- Current: `Test@123456`, New: `NewTest@123`, Confirm same
- API: `POST /api/auth/change-password`
- Success → logout → login new

---

## 5. Enterprise Structure – Create Company from Scratch (OX15, OX02, OX10, OX09, OX08)

Path: `/1000/foundation/enterprise-structure` – Shows real DB values only, no hardcoded OX15/OX02 guide data. Blue dev box `Clean – No hardcoded...` removed.

### 5.1 Create Company (OX15)
- Code: `TEST`, Name: `Test Trading Pvt Ltd`, Country: `IN`, Currency: `INR`, City: `Kochi`

### 5.2 Create Company Code (OX02) – T001
- Code: `T001`, Name: `Test Company Code INR`, Company: `TEST`, City: `Kochi`, Country: `IN`, Currency: `INR`, Chart: `KSCA`, FY Variant: `K4` April-March, Posting Period Variant: `1000` or `KS01`, Credit Control Area: `T001`, GST: `32AAAAA0000A1Z5`, PAN, CIN

### 5.3 Create Plant (OX10)
- Code: `TP01`, Name: `Test Plant Kochi`, Company Code: `T001`, City: `Kochi`, Purch Org: `TPO1`, Sales Org: `TSO1`

### 5.4 Storage Locations (OX09)
- `T001` Main Store, `T002` Raw, `T003` FG – all Plant TP01

### 5.5 Purchasing Org & Group (OX08, OME4)
- Purch Org: `TPO1` – Company T001
- Purch Group: `TPG` – General
- Sales Org: `TSO1` – Company T001, Channel `T1`, Division `T1`

Result: Enterprise Structure complete – real DB counts shown, not hardcoded.

---

## 6. Financial Configuration – Chart, G/L, Cost Centers, Tax, Currencies, Posting Period

### 6.1 Chart of Accounts (OB13) – `/[companyCode]/fico/chart-of-accounts`
- General CoA available like ERP – INT, KSCA, CAUS, GKR, YIN – ERP defaults kept
- CoA configurable: Create new CoA or edit current – secure delete blocked if has G/L or postings, error shows audit trail message
- Clean UI: Buttons just `Edit`/`Delete`, no `Secure – Blocked if...` on button, no verbose bottom text
- Tabs: CoA, Account Groups, G/L Accounts – all from real DB

**Account Groups (OBD4):**
- `KASS` Assets, `KLIA` Liabilities, `KREV` Revenue, `KEXP` Expenses, `KMAT` Material Stock (5000000001-5000000006), `KREC` Recon, `KTAX` Tax, `KCSH` Cash – configurable via POST /api/account-groups, delete blocked if has G/L → error `Cannot delete – account group X has Y G/L accounts and cannot be deleted to maintain audit trail.`

### 6.2 G/L Accounts (FS00) – `/[companyCode]/fico/gl-accounts`
- Configurable: Edit name/type/block/group via PUT, delete blocked if FI postings → `Cannot delete – G/L X has Y postings and cannot be deleted to maintain audit trail. Blocked instead.`
- Clean UI: Search, list with selected `bg-zinc-900 hover:bg-black` visible, buttons `Edit`/`Delete` only, no blue `Configurable? Yes...` box
- Create via Chart of Accounts page → G/L tab → + Create
- Essential G/Ls: `5000000001` Raw Stock BSX, `5000000002` FG Stock, `5000000003` GR/IR WRX, `5000000004` Transit BSV, `5000000005` Price Diff PRD, `5000000006` Consumption GBB, `2000000000` Vendor Recon K, `1000000000` Customer Recon D, `8000000001` Bank, `2500000001` Retained Earnings OB53

### 6.3 Cost Centers (KS01/KS02/KS03) – `/[companyCode]/fico/cost-centers` – CLEANED
- **Before:** Buttons `Edit – KS02` `Delete – Secure – Blocked if has employees/postings` + bottom `Restriction: If has employees...`
- **Now:** Buttons just `Edit` / `Delete`, card shows `CC-KITCHEN-01 Active Main Kitchen Company: 1000 • 0 employees • 0 postings` – concise
- **Delete restriction:** If has employees or FI postings → soft `is_active=false`, not hard delete – same as GL/materials – error shown only when trying to delete: `Cannot delete – cost center CC-KITCHEN-01 has 1 employees and 2 postings and cannot be deleted to maintain audit trail. Deactivated instead.` – no permanent redundant text
- Create: `CC-KITCHEN-01` Main Kitchen, `CC-PROD-01` Production, etc.

### 6.4 Tax Codes (FTXP) – `/[companyCode]/fico/tax-codes`
- Clean: Buttons `Delete` only, confirm `Delete Tax Code V5?` – not `Blocked if has FI postings...`
- Error when blocked: `Cannot delete – tax code V5 has 3 postings and cannot be deleted to maintain audit trail. Deactivated instead.`
- VAT 5% V5 Input, A5 Output, GST5 5% Spices – India GST 5% equivalent – configurable, only error shows audit trail

### 6.5 Currencies (OY03) – `/[companyCode]/fico/currencies` – ONLY INR DEFAULT
- Only INR default seeded, KWD/USD/EUR must be added by user via POST /api/currencies – OY03 UI
- Clean: `+ Create` not `+ Create Currency OY03 – Only INR default...`, `Delete` not `Delete – Secure`, confirm `Delete currency KWD?`
- Error: `Cannot delete – currency KWD has 1 company codes and cannot be deleted to maintain audit trail. Deactivated instead.` – cannot delete last INR

### 6.6 Posting Period Variant (OBBO/OB52/OBBP) – `/[companyCode]/fico/posting-period` – CONFIGURABLE
- OBBO Define Variant, OB52 Open/Close Periods, OBBP Assign to Company Code – all configurable, real DB only
- Variants: `1000` Standard, `KS01` Kerala Spices – from `fi_posting_period_variant`
- Periods: Account Types `+` All, `A` Assets, `D` Customers, `K` Vendors, `M` Materials, `S` G/L – from `fi_posting_period`
- Create Variant: Code + Name, Delete checks periods

### 6.7 Material Types (OMS2) – `/[companyCode]/foundation/material-types` – DEDICATED PAGE
- Dedicated OMS2 page – not inside MM01 only – lists ROH/HALB/FERT/HAWA/VERP/NLAG/DIEN with in-use count
- Configurable: Create new type via + Create, delete blocked if has materials → `Cannot delete – material type ROH has 5 materials and cannot be deleted to maintain audit trail. Deactivated instead.`
- Clean: Buttons `Delete` only, not `Delete – Secure – Blocked if has materials`

### 6.8 Units of Measure (CUNI) – `/[companyCode]/foundation/uom` – DEDICATED PAGE – FIXED
- **Before:** CUNI showed MM01, href pointed to /foundation/materials
- **Now:** Dedicated CUNI page /foundation/uom – lists UoMs KG/G/L/ML/PC/BOX/PACK/KIT/M/TON from `ent_uom`, create new via + Create, delete blocked if has materials → audit trail error
- NAV updated: CUNI now points to /foundation/uom
- FUNCTION_CODE lib updated: CUNI route → /1000/foundation/uom

---

## 7. Master Data – Materials with 8 Real ERP Tabs

### 7.1 Materials (MM01/MM02/MM03) – `/[companyCode]/foundation/materials`
- **Actual ERP implementation per tab:**
  - **Basic Data 1:** MATNR material number auto, Material Type OMS2 configurable + inline + New Type (ROH/HALB/FERT/HAWA/VERP/NLAG/DIEN), Base UoM CUNI configurable + inline + New UoM, Material Group OMSF (FOOD/SPICE/OIL/PACK/FG), Shelf Life, Batch Managed, Hazardous, Is Kit, Phantom Kit, Valuation Class BKLAS linked to BSX/WRX
  - **Basic Data 2:** Long text, Weight + unit, Volume + unit, EAN/UPC
  - **Sales:** Sales Org VKORG, Distribution Channel VTWEG, Division SPART, Sales UoM, Tax Classification TATY, Account Assignment Group KTGRM, Item Category Group MTPOS
  - **Purchasing:** Purchasing Group EKGRP, Purchasing Org EKORG, Valuation Class BKLAS, Landed Cost Relevance (BSX/WRX/PRD/GBB OBYC)
  - **MRP:** MRP Type DISMM PD/ND/VB/VM, MRP Controller DISPO, Lot Size DISLS EX/FX/HB, Procurement Type BESKZ F/E/X, Safety Stock EISBE, Reorder Point MINBE
  - **Plant/Storage:** Plant WERKS OX10 from real DB plants, Storage Location LGORT OX09, QM Active
  - **Accounting:** Price Control VPRSV V=MAP/S=Standard, Price Unit PEINH, Moving Avg VERPR MAP, Standard Price STPRS, BSX/WRX/PRD/GBB via OBYC
  - **Costing:** Costing Lot Size LOSGR, Overhead Group, Cost Center KOSTL KS01, Profit Center PRCTR
- **Clean UI:** Buttons `Delete` only, confirm `Delete material MAT-...?`, error audit trail, no `Secure – Blocked if Stock/PR/PO/GR/BOM`
- Search, VirtualDataGrid, selected material shows Delete

**Create ROH:**
- Material: `T-ROH-001` Black Pepper Raw, Type: `ROH`, UoM: `KG`, Group: `SPICE`, Valuation Class: `ROH`, Price Control: `V` MAP, Price: `100` INR, Plant: `TP01`, SLoc: `T001`, Batch Managed: Yes, Cost Center: `CC-KITCHEN-01`, GL: `5000000001`

### 7.2 Vendors & Customers
- Via `/api/business-partners` or Enterprise Config – create `T-V-001` Malabar Spices Supplier, `T-C-001` Kochi Exports

---

## 8. MM Flow – Full Test PR → PO → GR → IV → Payment Clearing

### 8.1 Purchase Requisition (ME51N) – `/[companyCode]/mm/pr`
- Company Code: `T001`, Plant: `TP01`, SLoc: `T001`, Type: `NB`, Currency: `INR`
- Item: Material `T-ROH-001` 100 KG, Price 100, Delivery +7d, Cost Center `CC-KITCHEN-01`, GL `5000000006`, Account Assignment `K`
- Save → PR `1000000001` (10*)

### 8.2 Purchase Order (ME21N) – `/[companyCode]/mm/po`
- Vendor: `T-V-001`, Purch Org: `TPO1`, Group: `TPG`, Currency: `INR`, Ref PR: `1000000001`
- Item: Material `T-ROH-001` 100 KG Net 100 Plant TP01 SLoc T001 Tax GST5, ELIKZ unchecked
- Save → PO `4500000001` (45*)

### 8.3 Goods Receipt (MIGO 101) – `/[companyCode]/mm/gr`
- First Partial 60 KG Batch BATCH-001 Expiry 2025-12-31 → GR `5000000001` (50* WE) FI Dr Stock 5000000001 6000 / Cr GR/IR 5000000003 6000 MAP 100
- Second 40 KG Batch BATCH-002 → GR `5000000002`, stock 100 KG
- Stock MMBE shows 100 KG, 2 batches

### 8.4 Invoice Verification (MIRO) – `/[companyCode]/mm/iv`
- PO: `4500000001`, Invoice Date Today, Ref `INV-T-V-001-001`, Gross 10500 (100*100 + 5% GST 500), Tax GST5
- Landed Costs: Freight 500, Customs 200 Include in valuation → MAP (10000+700)/100=107
- Post → IV `5100000001` (51* RE) FI Dr GR/IR 10000 / Dr GST Input 500 / Cr Vendor Recon 2000000000 10500, plus Stock +700 / Cr PRD 5000000005 if freight included
- Document Flow ALB shows PR→PO→GR→IV chain

### 8.5 Payment Processing (F-53/KZ) – `/[companyCode]/fico/payment` – Clear Invoice
- Vendor: `T-V-001`, Doc Type KZ, Number `5300000001` (53* 5300000000-5399999999), Posting Today, Amount 10500, Bank GL 8000000001 SBI, Ref Payment for INV
- Post → FI Dr Vendor Recon 2000000000 10500 / Cr Bank 8000000001 10500 – Vendor cleared, IV Paid
- Check GL 2000000000 balance 0
- **MM flow complete – Invoice Received Cleared**

---

## 9. PP Flow – BOM, Work Center, Routing, MRP, Kitting

### 9.1 BOM (CS01) – `/[companyCode]/pp/bom`
- Material: `T-FERT-001` Pepper Powder 100g, Plant: `TP01`, Usage: `1` Production, Base Qty 100 KG
- Components: `T-ROH-001` 90 KG SLoc T001, `T-ROH-002` 10 KG

### 9.2 Work Centers (CR01) – `/[companyCode]/pp/work-centers`
- Code: `WC-001` Grinding Machine, Plant TP01, Cost Center CC-KITCHEN-01, Capacity 100 KG/day, Labor 10 INR/hr, Machine 20

### 9.3 Routings (CA01) – `/[companyCode]/pp/routings`
- Material T-FERT-001 Plant TP01 Sequence 10 Cleaning, 20 Grinding WC-001, 30 Packing

### 9.4 MRP (MD01/MD04) – `/[companyCode]/pp/mrp`
- Run MRP for TP01 – generates PR for ROH if low

### 9.5 Kitting – `/[companyCode]/pp/kitting`
- Stocked Kit K01/K02: Production Order T-FERT-001 K01 issue 261, K02 receipt 101 inherits expiry min, flag <24h
- Phantom: Explosion at confirmation

---

## 10. SD Flow – Sales to Billing

### 10.1 Sales Order (VA01) – `/[companyCode]/sales`
- Customer T-C-001, Company T001, Sales Org TSO1, Channel T1, Division T1, Material T-FERT-001 Qty 10 Price 150 Tax GST18 → Sales 6000000001

**POS Webhook (Retail Cash):**
```bash
curl -X POST http://localhost:3000/api/sales/issue \
  -H "X-API-KEY: test-webhook-key-123" \
  -H "Content-Type: application/json" \
  -d '{"companyCode":"T001","plant":"TP01","material":"T-FERT-001","quantity":5,"batch":"BATCH-001","customer":"CASH","price":150,"paymentMethod":"CASH"}'
```
- Auto 601 GI + FI Dr Cash / Cr Revenue immediate, SERIALIZABLE to prevent race

### 10.2 Delivery (VL01N) – `/[companyCode]/sd/delivery`
- Sales 6000000001, Picking SLoc T001 Batch BATCH-001, GI 601 Qty 10

### 10.3 Billing (VF01) – `/[companyCode]/sd/billing`
- Delivery → Billing F2 Invoice Net 1500 + GST18% 270 = 1770 FI Dr AR 1000000000 1770 / Cr Revenue 1500 / Cr GST Output 270

---

## 11. HR – Employees & Payroll

### 11.1 Employees – `/[companyCode]/hr/employees`
- EMP-001 Ramesh Kumar, Company T001, Plant TP01, Position Production Operator, Cost Center CC-KITCHEN-01, Salary 30000 INR (payroll uses `hr_employee.basic_salary` per employee, never hardcoded)

### 11.2 Payroll (PC00) – `/[companyCode]/hr/payroll`
- Run Period 2024-05 Company T001, Amount 300 per employee (test seed 300 KWD / 10000 INR), Approve → Auto FI Dr Salary Expense CC-KITCHEN-01 / Cr Salaries Payable → Payment Clearing Dr Payable / Cr Bank

---

## 12. FICO – CCA, Costing Run

### 12.1 CCA Report (KSB1) – `/[companyCode]/fico/cca-report`
- Aggregates 3 sources by cost center: MM COGS 601 GBB, HR Payroll salary expense mapped to cost center, Direct FI/AP invoices
- Filter by Fiscal Period, virtualized grid, hierarchical CC→GL

### 12.2 Costing Run (CK40N) – `/[companyCode]/fico/costing-run`
- Calculates FERT total cost from current MAP of ROH in active BOM recursive phantom explosion: Example T-FERT-001 = 90*100 + 10*200 = 11000/100=110 INR/KG + Labor/Overhead from WC + Routing
- Updates Standard Price

---

## 13. Audit & Workflow

### 13.1 Document Flow (ALB) – `/[companyCode]/audit/document-flow`
- Enter doc number (PR, PO, GR, IV, Sales) → full chain PR→PO→GR→IV→Payment and Sales→Delivery→Billing
- Test PO 4500000001 → shows 2 GRs + IV + Payment

### 13.2 Audit Logs (SM20) – `/[companyCode]/audit/logs`
- WORM-lite old_values, new_values JSON, timestamp, user, filter by table/action

### 13.3 Workflow Inbox (SBWP) – `/[companyCode]/workflow/inbox`
- PR/PO/Payroll approvals – Manager approves if > threshold, PR >10000 needs Manager+Owner

---

## 14. User Management & RBAC – Full Guide

### 14.1 Who Can Create Users
- Allowed: ADMIN, OWNER, HR, HR_MANAGER, MANAGER – checked via `auth_user.role` OR `ent_user_role` → `ent_role.code`
- Where: `/[companyCode]/foundation/users` → Create User
- API: `POST /api/users` `{email, name, password, role}`

### 14.2 Where Access Levels Stored
- `auth_user`: id, email, name, password_hash bcrypt, role, is_active
- `ent_role`: id, code ADMIN/PURCHASER/WAREHOUSE/SALES/ACCOUNTANT/HR, name
- `ent_permission`: id, code PO_CREATE/GR_POST/PR_CREATE, module MM/SD/FICO
- `ent_role_permission`: role_id + permission_id
- `ent_user_role`: user_id + role_id + company_code_id + plant_id + assigned_by
- `ent_user_permission`: user_id + permission_id + reason + expires_at – direct special

### 14.3 How to Give Permission to T-code
**Method 1 Role:** Roles page `/foundation/roles` → Select PURCHASER → Check PO_CREATE → Save PUT /api/roles → Users page → Assign Role user ramesh@test.com + PURCHASER → Assign POST /api/user-roles → User can ME21N

**Method 2 Direct Special:** Users page → Grant Direct Permission → user + PO_CREATE + Reason → Grant POST /api/user-permissions → expires optional → Revoke via ×

**T-code → Permission mapping:** ME51N PR_CREATE, ME21N PO_CREATE, MIGO GR_POST, MIRO IV_POST, VA01 SALES_CREATE, VL01N DELIVERY_CREATE, VF01 BILLING_CREATE, FS00 GL, KS01 CC, CUNI UoM, OMS2 Material Type, OY03 Currencies, OBBO Posting Period

### 14.4 Password Change
- Own: `/foundation/user-profile` → Current + New → POST /api/auth/change-password
- ADMIN reset others: Users page → Reset Password → user + New → POST /api/auth/change-password {userId, newPassword}

---

## 15. Full End-to-End Test Scenario – From Scratch to Invoice Clear

**Pre-steps:**
```bash
docker compose down -v
docker compose up -d --build
# Login admin@test.com / Test@123456
```

**Step 1 – Enterprise Structure (15 mins):**
- Company TEST Kochi, Company Code T001 INR, Plant TP01, SLocs T001/T002/T003, Purch Org TPO1 Group TPG Sales Org TSO1 – real DB counts shown

**Step 2 – Finance Config (15 mins):**
- Chart KSCA exists (INT/KSCA/CAUS/GKR/YIN ERP defaults), G/Ls 5000000001-5000000006, 2000000000 Vendor Recon, 1000000000 Customer Recon, 8000000001 Bank, Account Groups KASS/KLIA/KREV/KEXP/KMAT/KREC/KTAX/KCSH configurable, Cost Centers CC-KITCHEN-01 Main Kitchen etc – edit/delete secure audit trail, Tax Codes GST5 GST18 IGST18, Currencies OY03 Only INR default – add KWD via + Create, Posting Period Variant OBBO 1000/KS01 with periods +/A/D/K/M/S via OB52

**Step 3 – Master Data (15 mins):**
- Material Types OMS2 dedicated page /foundation/material-types – ROH/HALB/FERT/HAWA/VERP/NLAG configurable, UoM CUNI dedicated page /foundation/uom – KG/G/L/ML/PC/BOX/PACK/KIT/M/TON configurable, Materials MM01 8 tabs actual ERP fields – T-ROH-001 Black Pepper 100 INR ROH TP01, T-ROH-002 Cardamom 200 INR, T-FERT-001 Powder 150 INR FERT, Vendors T-V-001 Malabar, Customer T-C-001 Kochi Exports, Stock 0

**Step 4 – MM PR (2 mins):** ME51N → PR 1000000001 for T-ROH-001 100 KG Cost Center CC-KITCHEN-01

**Step 5 – PO (2 mins):** ME21N → PO 4500000001 vendor T-V-001 qty 100 price 100 tax GST5 plant TP01

**Step 6 – GR Partial (5 mins):** MIGO → GR 5000000001 60 KG BATCH-001 expiry 2025-12-31, stock MMBE 60 KG, GR 5000000002 40 KG BATCH-002 stock 100 KG MAP 100

**Step 7 – IV (3 mins):** MIRO → IV 5100000001 for PO 4500000001 amount 10000+GST500=10500 freight 500 included MAP 107, document flow ALB PR→PO→GR→IV chain

**Step 8 – Payment Clear (2 mins):** F-53/KZ → Payment 5300000001 vendor T-V-001 amount 10500 bank 8000000001, GL 2000000000 balance 0, MM flow complete Invoice Received Cleared

**Step 9 – SD (5 mins):** VA01 → Sales Order 6000000001 customer T-C-001 material T-FERT-001 qty10 price150 tax GST18, VL01N Delivery + GI 601, VF01 Billing 1770 AR 1000000000

**Step 10 – PP (5 mins):** CS01 BOM for T-FERT-001 90 KG T-ROH-001 +10 KG T-ROH-002, CR01 WC-001, CA01 Routing, Kitting Stocked Kit

**Step 11 – HR (3 mins):** Create employee EMP-001 Ramesh cost center CC-KITCHEN-01 salary from hr_employee.basic_salary, PC00 Payroll run 300 per employee → FI Dr Salary Expense CC-KITCHEN-01 / Cr Payable → Clearing Dr Payable / Cr Bank

**Step 12 – FICO Reports (2 mins):** KSB1 CCA Report T-CC-01 has COGS+Payroll, CK40N Costing Run T-FERT-001 cost 110 INR+overhead

**Step 13 – Audit (2 mins):** ALB Document Flow PO 4500000001, SM20 Audit Logs filter mm_po, SBWP Workflow Inbox approve PR

**Step 14 – RBAC Test (5 mins):** Create user purchaser@test.com Test@123 role PURCHASER via Users page, Assign role PURCHASER → has PO_CREATE, Login as purchaser → ME21N works, MIRO fails if no IV_POST, Grant direct GR_POST → MIGO works, password change via My Profile, header shows username not full email, username button dropdown hover works, Function palette hover visible

**Full test done – from scratch company creation to invoice clear + sales + HR + audit – all clean UI, no redundant Secure/Blocked texts, errors only on blocked delete with audit trail.**

---

## 16. Troubleshooting

- Login fails: Check .env ADMIN_EMAIL/PASSWORD, logs auto-migrate, MVP_NO_AUTH=false
- No company codes: Run `npm run db:seed:ks01` or create via Enterprise Structure – page shows real DB, not hardcoded
- GR fails blocking: Check Physical Inventory active for SLoc+Material – PID blocks 101/261/601
- POS webhook 401: Need X-API-KEY: POS_WEBHOOK_API_KEY, or MVP_NO_AUTH=true for demo
- Stock not showing: Check Plant/SLoc, batch expiry not BLOCKED
- Permission denied: Check ent_user_role, user needs role with permission, check /api/permissions mapping, FUNCTION_MAP enforcement via /api/function codes
- Delete blocked: Expected – has transactions cannot be deleted to maintain audit trail, deactivated instead (is_active=false) – same for cost centers, GL, currencies, material types, UoM, tax codes, account groups
- CUNI shows MM01: Fixed – now dedicated /foundation/uom page, NAV updated
- Header username full email: Fixed – now username (email prefix if no username) button with dropdown, hover works, Function palette hover visible

---

## 17. Appendix – T-code List & Dummy Data Reference

**T-codes – All functions have corresponding Function code available in app – enforced via FUNCTION_MAP and /api/function codes:**

- OX15 Company, OX02 Company Code T001, OX10 Plant T001W, OX09 SLoc, OX08 Purch Org, OME4 Purch Group, OVX5 Sales Org, OVX1 Dist Channel, OVX2 Division
- OB13 Chart – General CoA INT/KSCA/CAUS/GKR/YIN ERP defaults kept, OB62 Assign CoA to CC, OBD4 Account Groups KASS/KLIA/KREV/KEXP/KMAT/KREC/KTAX/KCSH configurable, OB53 Retained Earnings 2500000001, FS00 G/L Master configurable secure delete, FSP0 G/L in CoA, OBYC Auto Posting BSX/WRX/PRD/GBB/BSV/FRE/ZOL
- OB29 Fiscal Year Variant K4 April-March, OB37 Assign FYV to CC, OBBO Define Posting Period Variant configurable, OB52 Open/Close Periods configurable, OBBP Assign PPV to CC, OBA7 Document Types KR/KG/KZ/RE/WE/WA/SA, FBN1 Number Ranges 50-54 5000000000-5499999999
- KS01 Create Cost Center configurable edit/delete secure audit trail, KS02 Change, KS03 Display, KSB1 CCA Report, FTXP Tax Codes V0/V5/A0/A5/GST0/5/12/18/28 IGST VAT5 included, OB40 Tax GL, F-53 Vendor Payment KZ 53* 5300000000-5399999999, F110 Auto Payment, OY03 Define Currencies Only INR default KWD added by user
- OMS2 Define Material Types ROH/HALB/FERT/HAWA/VERP/NLAG/DIEN configurable, CUNI Units KG/G/L/ML/PC/BOX/PACK/KIT/M/TON configurable dedicated page /foundation/uom, OMSF Material Groups, MM01 Create Material 8 tabs actual ERP, MM02 Change, MM03 Display, MMBE Stock Overview, MM60 Materials Overview
- ME51N PR Create, ME52N Change, ME53N Display, ME21N PO Create, ME22N Change, ME23N Display, MIGO Goods Movement GR 101/102 GI 261/262 50 WE/WA, MIRO Invoice Verification 51 RE, MI01 Physical Inventory Doc, MI04 Enter Count, MI07 Post Differences, ME27 STO, VL10B STO Delivery
- CS01 BOM Create, CS02 Change, CS03 Display, CR01 Work Center Create, CR02 Change, CR03 Display, CA01 Routing Create, CA02 Change, CA03 Display, MD01 MRP Run, MD04 Stock/Requirements List, CK40N Costing Run
- VA01 Sales Order Create, VA02 Change, VA03 Display, VL01N Outbound Delivery Create, VF01 Billing Create
- PA20 Display HR Master, PA30 Maintain HR Master, PC00 Payroll Run, SU01 User Maintenance, PFCG Role Maintenance, SM20 Security Audit Log, SBWP Workflow Inbox, ALB Document Flow, ME54N Release PR, ME28 Release PO

**Check enforcement:** `GET /api/function codes` → lists all with implemented:true, availableInApp:true, count, mandatory list, generalCoA, currencies only INR, postingPeriod OBBO/OB52, materialTypes OMS2, uom CUNI, costCenters KS01 secure

**UI Fixes Summary (v3.0):**
- Cost Centers: Edit – KS02 / Delete – Secure – Blocked... → Edit / Delete, removed bottom Restriction text, error only on blocked delete with audit trail
- Similar cleaned: Currencies Delete – Secure → Delete, Material Types Delete – Secure – Blocked... → Delete, G/L Delete (secure) → Delete, Tax Codes Delete (secure – blocked...) → Delete, Chart of Accounts blue Function Mapping box removed, Materials Delete Selected – Secure → Delete
- Header: Separate ☰ button removed, username itself is dropdown button, shows username (email prefix if no username) not full email, hover works, Function palette hover white-on-white fixed to hover:bg-black visible
- CUNI: Was showing MM01, now dedicated /foundation/uom page with create/delete
- Side panel: Collapsible sections with ▶/▼ persisted erp-nav-collapsed-groups, view preference persisted erp-home-view single view only
- Posting Period: OBBO/OB52/OBBP UI configurable real DB, Currencies OY03 UI only INR default, Material Types OMS2 page, UoM CUNI page

**Dummy Data Quick Reference:**
- Company Code: T001 Test INR, 1000 KWD, KS01 INR Kerala Spices – company 1000 Main Company KWD present without demodata – edit/delete allowed but blocked if has transactions
- Plant: TP01 Test Plant, 1000, KP01
- SLoc: T001 Main, T002 Raw, T003 FG
- Material: T-ROH-001 Black Pepper 100 INR/KG ROH, T-FERT-001 Powder 150 INR FERT, Material Types configurable via OMS2, UoM via CUNI KG/PC/BOX
- Vendor: T-V-001 Malabar Wayanad
- Customer: T-C-001 Kochi Exports
- PR: 1000000001, PO: 4500000001, GR: 5000000001/02, IV: 5100000001, Payment: 5300000001 53*, Sales: 6000000001, Delivery VL01N, Billing VF01
- Cost Center: CC-KITCHEN-01 Main Kitchen – Active, Company 1000, 0 employees 0 postings – Edit/Delete secure audit trail, GL: 5000000001 Stock BSX, 5000000003 GR/IR WRX, 2000000000 Vendor Recon K, 8000000001 Bank SBI
- Tax: V5 5% VAT, A5 5% Output, GST5 5% Spices VAT5 equivalent, GST18 18%
- Currencies: Only INR default, KWD added by user via OY03 POST /api/currencies
- Posting Period: Variant 1000 Standard, KS01 Kerala Spices, Account Types + A D K M S, periods 1/2024→12/2026
- User: admin@test.com / Test@123456 ADMIN, purchaser@test.com PURCHASER – header shows username not email, dropdown via username button

**Security Note:** All dummy data for testing only. No real GST/PAN/CIN. Change .env secrets in production. UI clean – no hardcoded implementation guide data OX15/OX02/OX16/OX03/OB45/OB38/OX10/OX09/OX08/KPO1/KSO1/K1 etc shown – only real DB values. Payroll never hardcoded, uses hr_employee.basic_salary per employee. Company 1000 KWD present without demodata – has edit/delete with secure restrictions. Standard CoA and foundation details OK to seed. Deleting master with transactions security problem – blocked hard delete, soft is_active=false or is_blocked=true to maintain audit trail.

---

**End of Manual v3.0 – All recent changes reflected – Full guided walkthrough from company creation to invoice clearing with clean UI, Function enforcement, dedicated CUNI/OMS2 pages, secure deletes with audit trail message only on error.**
