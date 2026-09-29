# ERP Modular Monolith – Real Company Implementation & Role-Based Testing Guide
**Version: 2026-09-29 | Company: From Scratch | Users: ERP Admin → Accountant → Auditor | Material Flow: PR→IV with Different Uses | MM + SD with Corresponding Users | NO DANGLING**

> This guide replaces all fictional industry guides. Follow step-by-step from company creation to running with real users, real roles, real approval flows. Each section has Title, Code, Data to be entered (copyable).

---

## PHASE 0 – COMPANY CREATION FROM SCRATCH – ERP ADMIN – CORRECT ORDER – REQUIRED DATA BEFORE OB13/ELEC

> **Critical Order – per user report:** `credit_control_area: CRED-1000 didnt create before ob13` – `chart_of_accounts_code: CA-IN-01 fiscal_year_variant: K4 field_status_variant: FSSV-1000 posting_period_variant: PPV-1000 credit_control_area: CRED-1000` must exist BEFORE `ELEC` – and `FCOA OB13` needs `language: EN` – `ECGC` needs `currency_code: INR country_code: IN language: EN` – this section fixes order.

### Title: Create Tenant / Company Group
**Code:** `ECGC` – Company Group – `POST /api/company-groups` – alias `OX15`

**User:** `erp_admin` – Role: `ERP_ADMIN` – super admin – creates tenant

**Data to be entered – copyable – per guide needs currency_code, country_code, language EN:**
```
code: ECGC-FMCG-01
name: FMCG Group India
description: FMCG Group for Spices and Foods
currency_code: INR
country_code: IN
language: EN
tenant_code: TEN-100
```

**Steps:**
1. Login as `erp_admin` / password `Admin@123`
2. Navigate `/[companyCode]/foundation/company-groups?mode=create`
3. Enter above fields – currency_code INR was missing per report – now required – click Create
4. Verify GET `/api/company-groups` returns ECGC-FMCG-01 with currency_code INR country_code IN language EN

---

### Title: Create Currency INR
**Code:** `FCYC` – Currency – `OY03` – `POST /api/currencies`

**User:** `erp_admin`

**Data to be entered – copyable – required before ELEC:**
```
code: INR
name: Indian Rupee
decimal_places: 2
symbol: ₹
```

---

### Title: Create Fiscal Year Variant K4 – FROM_DATE TO_DATE EXPLAINED
**Code:** `FFYC` – Fiscal Calendar – `OB29` – `POST /api/fiscal-calendars`

**User:** `erp_admin`

**Question:** `what is from date and to date in Create Fiscal Calendar – FFYC, how would a fixed date with year work for it`

**Answer – Year-Independent Variant vs Fixed Date FY:**

- **Fiscal Calendar Variant (FFYC)** is **year-independent** template – defines **start_month, end_month, year_shift** – works for **any year**
- **K4** = April-March India: `start_month=4`, `end_month=3`, `year_shift` logic:
  - Posting `2026-05-15` → month 5 ≥ 4 → FY2026, Period 02 (May = 2nd month of K4)
  - Posting `2026-02-15` → month 2 < 4 → FY2025 (belongs to previous FY), Period 11 (Feb = 11th month of K4)
  - Posting `2027-05-15` → FY2027 P02 – same variant K4 works for FY2027 without new definition – **year-independent**
- **FROM_DATE / TO_DATE** are **optional** – fixed date for **initial FY definition** – e.g., FY2026 `2026-04-01` to `2027-03-31` – this defines one fiscal year instance, but variant K4 itself remains year-independent – you don't need to create K4 again for FY2027 – system calculates via `start_month/end_month`
- **How fixed date with year works:** If you enter `from_date: 2026-04-01 to_date: 2027-03-31`, it creates FY2026 definition. For FY2027, you would create `2027-04-01` to `2028-03-31` OR rely on variant logic – posting date `2027-05-15` automatically maps to FY2027 P02 via `start_month=4` – so fixed date is example FY, variant is template – **both work**
- **Implementation:** In our ERP, `from_date/to_date` optional – if not provided, system uses `start_month=4 end_month=3` to calculate FY/Period for any posting date – strict usage in ELEC fiscal calendar calculates FY/Period from posting date K4 `2026-05-15 → FY2026 P02`

**Data to be entered – copyable – fiscal_year_variant K4 must exist before ELEC – per guide – FROM_DATE TO_DATE OPTIONAL:**
```
code: K4
name: April-March Fiscal – India – K4
start_month: 4
end_month: 3
year_shift: 0
from_date: 2026-04-01  // Optional – fixed date for FY2026 – defines FY2026 April to March – variant still year-independent – how fixed date with year works: this is FY2026 instance, but K4 variant works for FY2027, FY2028 via start_month logic
to_date: 2027-03-31    // Optional – fixed date for FY2026 – if provided, must be after from_date – if not provided, system uses start_month/end_month for any year
description: Fiscal Year Variant K4 – April to March – 12 periods – India standard – year-independent – start_month 4 end_month 3 – from_date/to_date optional for FY2026 – required before ELEC
year_dependent: false
calendar_year: false
number_of_periods: 12
```

**Why before OB13/ELEC:** ELEC needs `fiscal_year_variant: K4` – calculates FY/Period from posting date – e.g., posting 2026-05-15 → FY2026 P02 – variant year-independent, fixed date is FY instance

---

### Title: Create Field Status Variant FSSV-1000
**Code:** `FSSV` – Field Status Variant – `OBC4` – `POST /api/field-status-variants`

**User:** `erp_admin`

**Data to be entered – copyable – field_status_variant FSSV-1000 must exist before ELEC:**
```
code: FSSV-1000
name: Field Status Variant 1000 – India
description: Field Status Variant for India – controls field status groups G001 etc – required before ELEC
```

**Why before OB13/ELEC:** ELEC needs `field_status_variant: FSSV-1000` – controls GL field status – per user report

---

### Title: Create Posting Period Variant PPV-1000
**Code:** `FPPC` – Posting Calendar – `OBBO` – `POST /api/posting-period-variants`

**User:** `erp_admin`

**Data to be entered – copyable – posting_period_variant PPV-1000 must exist before ELEC:**
```
code: PPV-1000
name: Posting Period Variant 1000 – India
description: Posting Period Variant PPV-1000 – groups company codes for OB52 open/close – required before ELEC
```

**Why before OB13/ELEC:** ELEC needs `posting_period_variant: PPV-1000` – per guide – controls OB52 posting period open/close

---

### Title: Create Credit Control Area CRED-1000 – MUST EXIST BEFORE OB13/ELEC
**Code:** `FCPC` – Credit Policy Area – `OB45` – `POST /api/credit-policy-areas`

**User:** `erp_admin`

**Data to be entered – copyable – credit_control_area CRED-1000 didnt create before OB13 – per user report – MUST CREATE BEFORE OB13/ELEC:**
```
code: CRED-1000
name: Credit Control India – Domestic
currency_code: INR
description: Credit Control Area CRED-1000 – credit_control_area per guide – must exist before OB13 and ELEC – OB45 – defines credit control boundary for customer credit FD32
```

**Why before OB13/ELEC:** Per user report `credit_control_area: CRED-1000 didnt create before ob13` – ELEC needs `credit_control_area: CRED-1000` – defines credit control – if not created, ELEC creation fails – create now – also used in FD32 customer credit master + OVA8 credit check on SO

---

### Title: Create Chart of Accounts CA-IN-01 with Language EN – OB13
**Code:** `FCOA` – Chart of Accounts – `OB13` – `POST /api/chart-of-accounts`

**User:** `erp_admin`

**Data to be entered – copyable – OB13 dont have language: EN to add – per user report – NOW HAS LANGUAGE:**
```
code: CA-IN-01
name: Chart of Accounts India
description: India Standard CoA – CA-IN-01 per guide
language: EN
```

**Steps:**
1. Navigate `/[companyCode]/fico/chart-of-accounts?mode=create`
2. Enter code CA-IN-01, name, language EN – **language field now added per report**
3. Create – verify GET `/api/chart-of-accounts` returns CA-IN-01 with language EN – existing count should be 1+ not 0 (fixed via merged fin_chart+fi_chart_of_accounts)
4. Related Masters bottom shows [FGLC GL Account uses CoA→OBYC Auto Account uses CoA→FFYC K4→FSSV FSSV-1000→FPPC PPV-1000→FCPC CRED-1000] – low importance but helps create necessary data

**Why before ELEC:** ELEC needs `chart_of_accounts_code: CA-IN-01` – must exist before Legal Entity – OB13 is prerequisite for ELEC

---

### Title: Create Legal Entity / Company Code – AFTER ALL DEPENDENCIES
**Code:** `ELEC` – Legal Entity – `OX02` – `POST /api/legal-entities` – alias `ELEC`

**User:** `erp_admin`

**Prerequisites – MUST EXIST BEFORE ELEC – per guide – correct order:**
- `ECGC-FMCG-01` with `currency_code INR country_code IN language EN`
- `INR` currency `FCYC`
- `K4` fiscal year variant `FFYC` – `fiscal_year_variant: K4`
- `FSSV-1000` field status variant – `field_status_variant: FSSV-1000`
- `PPV-1000` posting period variant `FPPC` – `posting_period_variant: PPV-1000`
- `CRED-1000` credit control area `FCPC OB45` – `credit_control_area: CRED-1000 didnt create before ob13` – now must exist
- `CA-IN-01` chart of accounts `FCOA OB13` with `language: EN` – `chart_of_accounts_code: CA-IN-01`

**Data to be entered – copyable – AFTER dependencies:**
```
code: 1000
name: FMCG India Pvt Ltd
company_group_code: ECGC-FMCG-01
country_code: IN
currency_code: INR
chart_of_accounts_code: CA-IN-01
fiscal_year_variant: K4
field_status_variant: FSSV-1000
posting_period_variant: PPV-1000
credit_control_area: CRED-1000
language: EN
```

**Steps:**
1. `/[companyCode]/foundation/legal-entities?mode=create`
2. Enter fields – all autocomplete now show CA-IN-01, K4, FSSV-1000, PPV-1000, CRED-1000 – select from list
3. Create – API auto-creates missing dependencies if not exist (downstream safe) but should exist per correct order – check OBYC will use chart CA-IN-01 for BSX/WRX

---

### Title: Create GL Accounts with Account Type + Field Status Group
**Code:** `FGLC` – GL Accounts – `FS00` – `POST /api/gl-accounts`

**User:** `erp_admin` + `accountant_gl` later

**Data to be entered – copyable – 8 mandatory GLs for NO DANGLING:**
```
1) BSX Inventory – RAW:
code: 1000000001
name: Inventory RAW
chart_code: CA-IN-01
account_type: S
pnl_bs: BS
field_status_group: G001

2) WRX GR/IR Clearing:
code: 2000000000
name: GR/IR Clearing
chart_code: CA-IN-01
account_type: S
pnl_bs: BS
field_status_group: G001

3) GBB Consumption Offset:
code: 4000000000
name: Consumption GBB
chart_code: CA-IN-01
account_type: S
pnl_bs: PL
field_status_group: G001

4) PRD Price Difference:
code: 4000000001
name: Price Difference PRD
chart_code: CA-IN-01
account_type: S
pnl_bs: PL
field_status_group: G001

5) KOFI Revenue Domestic:
code: 4000001000
name: Revenue Domestic
chart_code: CA-IN-01
account_type: S
pnl_bs: PL
field_status_group: G001

6) KDM Exchange Difference:
code: 4000002000
name: Exchange Difference KDM
chart_code: CA-IN-01
account_type: S
pnl_bs: PL
field_status_group: G001

7) Vendor Reconciliation K:
code: 2000000001
name: Vendor Reconciliation
chart_code: CA-IN-01
account_type: K
field_status_group: G001
open_item_managed: true

8) Customer Reconciliation D:
code: 1000000002
name: Customer Reconciliation
chart_code: CA-IN-01
account_type: D
field_status_group: G001
open_item_managed: true

9) Payroll Expense:
code: 6000000000
name: Payroll Expense
chart_code: CA-IN-01
account_type: S
pnl_bs: PL
field_status_group: G001

10) COGS:
code: 5000000000
name: COGS
chart_code: CA-IN-01
account_type: S
pnl_bs: PL
field_status_group: G001
```

---

### Title: Create Facility / Plant
**Code:** `EFAC` – Facility – `OX10` – `POST /api/facilities`

**User:** `erp_admin`

**Data to be entered – copyable:**
```
code: FAC-1000
name: Pune Plant
legal_entity_code: 1000
company_group_code: ECGC-FMCG-01
city: Pune
country_code: IN
currency_code: INR
facility_type: PLANT
```

---

### Title: Create Inventory Location / Storage Location
**Code:** `EILC` – Inventory Location – `OMSL` – `POST /api/inventory-locations`

**User:** `erp_admin`

**Data to be entered – copyable:**
```
code: 0001
name: Raw Material Store
facility_code: FAC-1000
location_type: RAW
```

```
code: 0002
name: Finished Goods Store
facility_code: FAC-1000
location_type: FG
```

---

### Title: Create Commercial Org + Sales Channel + Product Line (Sales Area)
**Code:** `ECOC + ESCC + EPLC` – Commercial Org / Sales Channel / Product Line – `OVX5`

**User:** `erp_admin`

**Data to be entered – copyable:**
```
Commercial Org:
code: CO-1000
name: India Sales Org
legal_entity_code: 1000

Sales Channel:
code: SC-10
name: Direct Sales
description: Direct Channel

Product Line:
code: PL-10
name: Spices
description: Spices Product Line
```

---

### Title: Create Credit Control Area + Credit Policy
**Code:** `FCPC + OB45 + FD32` – Credit Control – `POST /api/credit-policy-areas`

**User:** `erp_admin`

**Data to be entered – copyable:**
```
Credit Control Area:
code: CRED-1000
name: India Credit Control
currency_code: INR

Credit Master (FD32) – per customer later:
customer_code: CUST-1001
credit_control_area: CRED-1000
credit_limit: 500000
risk_category: MEDIUM
```

---

### Title: Create Field Status Variant + Groups
**Code:** `OBC4 + OBC5` – Field Status – `POST /api/field-status-variants` + `/api/field-status-groups`

**User:** `erp_admin`

**Data to be entered – copyable:**
```
Field Status Variant:
code: FSSV-1000
name: India Field Status Variant
description: Variant for 1000

Field Status Group G001:
code: G001
name: Cost Center Required
variant_code: FSSV-1000
cost_center: required
profit_center: optional
text: required
```

---

### Title: Create Posting Period Variant + Periods
**Code:** `OB52 + OBBO` – Posting Period – `POST /api/posting-period-variants` + `/api/posting-periods`

**User:** `erp_admin`

**Data to be entered – copyable:**
```
Posting Period Variant:
code: PPV-1000
name: India Posting Period Variant

Posting Periods – open current period:
variant_code: PPV-1000
fiscal_year: 2026
period: 09
account_type: S
from_date: 2026-09-01
to_date: 2026-09-30
is_open: true

variant_code: PPV-1000
fiscal_year: 2026
period: 09
account_type: K
from_date: 2026-09-01
to_date: 2026-09-30
is_open: true

variant_code: PPV-1000
fiscal_year: 2026
period: 09
account_type: D
from_date: 2026-09-01
to_date: 2026-09-30
is_open: true
```

---

### Title: Create Document Types + Number Ranges
**Code:** `OBA7 + FBN1` – Document Types – `POST /api/document-types` + `/api/number-ranges`

**User:** `erp_admin`

**Data to be entered – copyable:**
```
Document Types:
code: SA
name: GL Document
number_range_code: SA-01

code: KR
name: Vendor Invoice
number_range_code: KR-01

code: KZ
name: Vendor Payment
number_range_code: KZ-01

code: RE
name: Invoice Verification
number_range_code: RE-01

code: WE
name: Goods Receipt
number_range_code: WE-01

code: RV
name: Billing
number_range_code: RV-01

Number Ranges:
object_type: SA
prefix: FI-SA-
current_number: 1000000000

object_type: KR
prefix: FI-KR-
current_number: 5100000000

object_type: KZ
prefix: FI-KZ-
current_number: 5300000000

object_type: RE
prefix: FI-RE-
current_number: 5100000001

object_type: WE
prefix: FI-WE-
current_number: 5000000000

object_type: RV
prefix: FI-RV-
current_number: 9000000000
```

---

### Title: Create Tolerance Groups GL + Vendor
**Code:** `OBA0 + OBA4` – Tolerance – `POST /api/tolerance-groups`

**User:** `erp_admin`

**Data to be entered – copyable:**
```
GL Tolerance OBA0:
company_code: 1000
group_code: GL-01
upper_limit_amount: 1000000
lower_limit_amount: 0
gain_loss_allowed: true

Vendor Tolerance OBA4:
company_code: 1000
group_code: VEND-01
vendor_number: VEND-1001
payment_diff_allowed: 5
payment_diff_percent: 5
cash_discount_allowed: 5
```

---

### Title: Create Auto Account Determination OBYC + VKOA
**Code:** `OBYC-FULL + VKOA` – Auto Account – `POST /api/auto-account-determination`

**User:** `erp_admin`

**Data to be entered – copyable – BSX/WRX/GBB/PRD/KDM + KOFI/KOFK:**
```
BSX RAW:
transaction_key: BSX
chart_code: CA-IN-01
valuation_class: RAW
valuation_modifier: 0001
gl_account: 1000000001

BSX FINISHED:
transaction_key: BSX
chart_code: CA-IN-01
valuation_class: FINISHED
gl_account: 1000000001

WRX GR/IR:
transaction_key: WRX
chart_code: CA-IN-01
valuation_class: RAW
gl_account: 2000000000

GBB Consumption:
transaction_key: GBB
chart_code: CA-IN-01
valuation_modifier: VBR
gl_account: 4000000000

PRD Price Diff:
transaction_key: PRD
chart_code: CA-IN-01
valuation_class: RAW
gl_account: 4000000001

KDM Exchange Diff:
transaction_key: KDM
chart_code: CA-IN-01
gl_account: 4000002000

KOFI Revenue Domestic:
transaction_key: KOFI
chart_code: CA-IN-01
sales_org: CO-1000
customer_group: 01
material_group: 01
account_assignment: 01
gl_account: 4000001000

KOFK Revenue Export:
transaction_key: KOFK
chart_code: CA-IN-01
sales_org: CO-1000
customer_group: 02
material_group: 01
account_assignment: 01
gl_account: 4000001000
```

---

### Title: Create Movement Types
**Code:** `OMJJ` – Movement Types – `POST /api/movement-types`

**User:** `erp_admin`

**Data to be entered – copyable:**
```
101: GR – Goods Receipt – +stock +value – BSX/WRX
code: 101
name: Goods Receipt
description: GR for PO
plus_minus: +
account_modifier: BSX

102: GR Reversal
code: 102
name: GR Reversal
plus_minus: -
account_modifier: BSX

261: GI to Prod Order
code: 261
name: GI to Production Order
plus_minus: -
account_modifier: GBB

601: GI for Sales Delivery PGI
code: 601
name: GI for Sales Delivery
plus_minus: -
account_modifier: GBB

602: Reverse GI Sales
code: 602
name: Reverse GI Sales
plus_minus: +
account_modifier: GBB

122: Return to Vendor
code: 122
name: Return to Vendor
plus_minus: -
account_modifier: WRX
```

---

## PHASE 1 – USER ONBOARDING & ROLES – FIRST STEP AFTER COMPANY CREATION – ERP ADMIN + HR MANAGER

> **YES – Guide includes who is the user doing specific functions and user creation/approval as FIRST STEP after company creation + basic data required – This Phase is mandatory before any master data or transactions – NO USER → NO FUNCTION TESTING**

### Title: Basic Data Required for User Creation – Before Any User Can Be Created
**Code:** `BASIC-DATA-FOR-USER` – Prerequisites – Must exist before user onboarding

**User:** `erp_admin` – ERP Admin creates basic data, then creates roles, then users

**Data to be entered – copyable – Basic Data Checklist Before User Creation:**
```
1. Company Group ECGC must exist:
code: ECGC-FMCG-01

2. Legal Entity / Company Code ELEC must exist:
code: 1000
company_group_code: ECGC-FMCG-01
chart_of_accounts_code: CA-IN-01
field_status_variant: FSSV-1000
posting_period_variant: PPV-1000
credit_control_area: CRED-1000

3. Chart of Accounts FCOA must exist:
code: CA-IN-01

4. Facility EFAC must exist:
code: FAC-1000
legal_entity_code: 1000

5. Cost Center ECUC must exist for payroll + reservation:
code: CC-1000
name: Production Cost Center
facility_code: FAC-1000

6. Profit Center PC-1000 must exist:
code: PC-1000
name: Production Profit Center
facility_code: FAC-1000

Without above 6, user creation fails – company_code 1000 must be valid, facility FAC-1000 must be valid for role assignment
```

### Title: Create Roles – First Step – Defines Who Can Do What
**Code:** `EROL` – Roles – `POST /api/roles`

**User:** `erp_admin` – ERP Admin creates roles – HR Manager approves roles

**Data to be entered – copyable – 12 roles:**
```
ERP_ADMIN:
code: ERP_ADMIN
name: ERP Admin – Super Admin
description: Full access all modules
permissions: ["*"]

MASTER_DATA_MANAGER:
code: MASTER_DATA_MANAGER
name: Master Data Manager
permissions: ["material:create","material:change","supplier:create","customer:create","bom:create","routing:create","workcenter:create"]

PROCUREMENT_REQUESTER:
code: PROCUREMENT_REQUESTER
name: Procurement Requester – PR Creator
permissions: ["pr:create","pr:display"]

PROCUREMENT_BUYER:
code: PROCUREMENT_BUYER
name: Buyer – PO Creator + Info Record + Source List + RFQ
permissions: ["po:create","po:change","info-record:create","source-list:create","quota:create","rfq:create","quotation:create"]

WAREHOUSE_CLERK:
code: WAREHOUSE_CLERK
name: Warehouse Clerk – GR + Reservation + PI
permissions: ["gr:create","gr:display","reservation:create","physical-inventory:create","physical-inventory:count","stock:display"]

WAREHOUSE_MANAGER:
code: WAREHOUSE_MANAGER
name: Warehouse Manager – GR Approval + PI Posting
permissions: ["gr:approve","physical-inventory:post","stock:post"]

PRODUCTION_PLANNER:
code: PRODUCTION_PLANNER
name: Production Planner – MRP + PIR + Prod Order
permissions: ["mrp:run","pir:create","production-order:create","production-order:change","bom:display","routing:display"]

SHOP_FLOOR_OPERATOR:
code: SHOP_FLOOR_OPERATOR
name: Shop Floor Operator – Confirmation + GI/GR
permissions: ["production-order:confirm","production-order:gi","production-order:gr"]

SALES_REP:
code: SALES_REP
name: Sales Rep – Customer-Mat Info + SO Creator
permissions: ["sales-order:create","customer-material-info:create","free-goods:display"]

SHIPPING_CLERK:
code: SHIPPING_CLERK
name: Shipping Clerk – Delivery + PGI
permissions: ["delivery:create","delivery:change","delivery:pgi","delivery:reverse-pgi","delivery:due-list"]

BILLING_CLERK:
code: BILLING_CLERK
name: Billing Clerk – Billing + Credit Memo
permissions: ["billing:create","billing:change","billing:due-list","billing:cancel","credit-memo:create","output:determine"]

ACCOUNTANT_AP:
code: ACCOUNTANT_AP
name: Accountant AP – IV + Payment Proposal + Run + Tolerance
permissions: ["iv:create","payment:proposal","payment:run","tolerance:display","gr-ir-clearing:run"]

ACCOUNTANT_AR:
code: ACCOUNTANT_AR
name: Accountant AR – AR + Dunning + FX Valuation
permissions: ["ar:display","dunning:create","fx-valuation:run","credit:display"]

ACCOUNTANT_GL:
code: ACCOUNTANT_GL
name: Accountant GL – GL Posting + Field Status + Reversal + Costing + House Bank
permissions: ["gl:post","field-status:enforce","document:reverse","costing:run","cost-estimate:create","house-bank:create"]

COST_ACCOUNTANT:
code: COST_ACCOUNTANT
name: Cost Accountant – Cost Center Groups + Activity Types + Assessment Cycles
permissions: ["cost-center-group:create","activity-type:create","assessment-cycle:create","costing:run"]

AUDITOR:
code: AUDITOR
name: Auditor – Display Only + Change Docs + Audit Logs
permissions: ["*:display","change-doc:display","audit-log:display","universal-ledger:display"]

HR_MANAGER:
code: HR_MANAGER
name: HR Manager – Employee + Payroll Control + Schema
permissions: ["employee:create","payroll-control:create","payroll-schema:create"]

PAYROLL_CLERK:
code: PAYROLL_CLERK
name: Payroll Clerk – Payroll Run + FI Posting
permissions: ["payroll-run:create","payroll-fi-post:create"]
```

---

### Title: Create Users – Onboard as Needed for Each Function
**Code:** `EUSR` – Users – `POST /api/users`

**Data to be entered – copyable – 15 users:**
```
erp_admin:
username: erp_admin
email: erp_admin@fmcg.com
password: Admin@123
role_code: ERP_ADMIN
company_code: 1000

master_data_mgr:
username: master_data_mgr
email: mdm@fmcg.com
password: Mdm@123
role_code: MASTER_DATA_MANAGER
company_code: 1000

pr_requester_01:
username: pr_requester_01
email: pr01@fmcg.com
password: Pr@123
role_code: PROCUREMENT_REQUESTER
company_code: 1000

buyer_01:
username: buyer_01
email: buyer01@fmcg.com
password: Buyer@123
role_code: PROCUREMENT_BUYER
company_code: 1000

wh_clerk_01:
username: wh_clerk_01
email: wh01@fmcg.com
password: Wh@123
role_code: WAREHOUSE_CLERK
company_code: 1000

wh_manager_01:
username: wh_manager_01
email: whm01@fmcg.com
password: Whm@123
role_code: WAREHOUSE_MANAGER
company_code: 1000

prod_planner_01:
username: prod_planner_01
email: pp01@fmcg.com
password: Pp@123
role_code: PRODUCTION_PLANNER
company_code: 1000

shop_operator_01:
username: shop_operator_01
email: shop01@fmcg.com
password: Shop@123
role_code: SHOP_FLOOR_OPERATOR
company_code: 1000

sales_rep_01:
username: sales_rep_01
email: sales01@fmcg.com
password: Sales@123
role_code: SALES_REP
company_code: 1000

shipping_clerk_01:
username: shipping_clerk_01
email: ship01@fmcg.com
password: Ship@123
role_code: SHIPPING_CLERK
company_code: 1000

billing_clerk_01:
username: billing_clerk_01
email: bill01@fmcg.com
password: Bill@123
role_code: BILLING_CLERK
company_code: 1000

accountant_ap_01:
username: accountant_ap_01
email: ap01@fmcg.com
password: Ap@123
role_code: ACCOUNTANT_AP
company_code: 1000

accountant_ar_01:
username: accountant_ar_01
email: ar01@fmcg.com
password: Ar@123
role_code: ACCOUNTANT_AR
company_code: 1000

accountant_gl_01:
username: accountant_gl_01
email: gl01@fmcg.com
password: Gl@123
role_code: ACCOUNTANT_GL
company_code: 1000

auditor_01:
username: auditor_01
email: auditor01@fmcg.com
password: Audit@123
role_code: AUDITOR
company_code: 1000

hr_manager_01:
username: hr_manager_01
email: hr01@fmcg.com
password: Hr@123
role_code: HR_MANAGER
company_code: 1000

payroll_clerk_01:
username: payroll_clerk_01
email: pay01@fmcg.com
password: Pay@123
role_code: PAYROLL_CLERK
company_code: 1000
```

### Title: User Creation Approval Flow – First Step After Company Creation – Who Approves Users
**Code:** `EUSR-APPROVAL` – User Approval – `POST /api/users` + `POST /api/user-roles` + Workflow SWDD

**User:** `erp_admin` creates → `hr_manager_01` approves → `auditor_01` audits

**Data to be entered – copyable – User Approval Steps:**
```
Step 1 – ERP Admin creates role – EROL:
role_code: PROCUREMENT_REQUESTER
created_by: erp_admin
approved_by: hr_manager_01
status: ACTIVE

Step 2 – ERP Admin creates user – EUSR:
username: pr_requester_01
role_code: PROCUREMENT_REQUESTER
company_code: 1000
created_by: erp_admin
status: PENDING_APPROVAL

Step 3 – HR Manager approves user:
username: pr_requester_01
approved_by: hr_manager_01
status: ACTIVE
action: APPROVE

Step 4 – Auditor audits user creation – CDHDR:
object_type: USER
object_id: pr_requester_01
changed_by: hr_manager_01
field_name: status
old_value: PENDING_APPROVAL
new_value: ACTIVE

Without approval, user cannot login – SWDD workflow WF-USER-01 enforces approval for role assignment
```

### Title: WHO IS THE USER DOING SPECIFIC FUNCTIONS – Complete Mapping – Mandatory for Testing
**Code:** `USER-FUNCTION-MATRIX` – Matrix – Who does what – Must onboard users as needed for each function to test approval flow

**Data to be entered – copyable – Function → User → Role → Approval Required:**
```
MM – Material Flow PR→IV:

1. Create Material Master EMTC-FULL – MM01:
   User: master_data_mgr
   Role: MASTER_DATA_MANAGER
   Approval: None – master data manager creates directly
   Data: ITM-1001 RAW valuation_class RAW

2. Create Info Record ME11 PIRC – PO Auto Price:
   User: buyer_01
   Role: PROCUREMENT_BUYER
   Approval: None – buyer creates
   Data: SUP-1001 + ITM-1001 price 50

3. Create Source List ME01 PSRC – MRP Source:
   User: buyer_01
   Role: PROCUREMENT_BUYER
   Approval: None
   Data: SUP-1001 + ITM-1001 priority 1 MRP relevant true

4. Create Quota MEQ1 – % Split:
   User: buyer_01
   Role: PROCUREMENT_BUYER
   Approval: None – but total % ≤100 validated
   Data: ITM-1001 FAC-1000 SUP-1001 60% SUP-1002 40%

5. Create RFQ ME41 + Quotation ME47 + Comparison ME49:
   User: buyer_01 creates RFQ, vendor replies via quotation (simulated by buyer_01), buyer_01 selects winner ME49 → PO
   Role: PROCUREMENT_BUYER
   Approval: Procurement Manager approves RFQ >50000
   Data: RFQ-xxxx material ITM-1001 qty100, QT-xxxx vendor SUP-1001 price48, QT-xxxx vendor SUP-1002 price45 winner lowest

6. Create PR ME51N:
   User: pr_requester_01
   Role: PROCUREMENT_REQUESTER
   Approval: Warehouse Manager wh_manager_01 approves if amount >10000 – SWDD WF-PR-01
   Data: ITM-1001 qty100 plant FAC-1000 cost center CC-1000

7. Create PO ME21N – Uses Info Record Price if unit_price 0:
   User: buyer_01
   Role: PROCUREMENT_BUYER
   Approval: Procurement Manager approves if amount >50000 – SWDD WF-PO-01
   Data: SUP-1001 FAC-1000 lines ITM-1001 qty100 unit_price 0 auto 50 from ME11

8. GR 101 MIGO – Stock + MAP + BSX/WRX:
   User: wh_clerk_01 creates, wh_manager_01 approves/posts
   Role: WAREHOUSE_CLERK + WAREHOUSE_MANAGER
   Approval: WH Manager posts – checks posting period OB52 open + field status OBC4/OBC5 + tolerance OBA0
   Data: po_number qty100 batch BATCH-1001 sloc0001

9. IV MIRO – WRX Clearing + PRD + Tolerance OBA4:
   User: accountant_ap_01
   Role: ACCOUNTANT_AP
   Approval: accountant_gl_01 approves if diff >5% OBA4 VEND-01
   Data: po_number gr_number invoice INV-SUP-1001-001 gross5000 qty100 unit50

10. GR/IR Clearing F.13 CLR-* – WRX Zero:
    User: accountant_ap_01
    Role: ACCOUNTANT_AP
    Approval: None – auto
    Data: action auto clears where GR qty = IV qty

11. Payment Proposal F110-PROP + Run F110-RUN KZ + DME:
    User: accountant_ap_01 creates proposal, accountant_gl_01 approves, accountant_ap_01 runs
    Role: ACCOUNTANT_AP + ACCOUNTANT_GL
    Approval: GL approves proposal → AP runs
    Data: company 1000 BANK SBI-001 proposal_numbers KZ 53* Dr Vendor Cr Bank

12. Reservation MB21 + GI 261/201 – T2 GOOD:
    User: wh_clerk_01 creates reservation, prod_planner_01 uses for prod order, wh_clerk_01 GI
    Role: WAREHOUSE_CLERK + PRODUCTION_PLANNER
    Approval: WH Manager approves reservation >1000
    Data: material ITM-1001 facility FAC-1000 sloc0001 qty10 movement261 order ORD-1001 requirement 2026-09-30

13. Physical Inventory MI01+MI04+MI07+MICN – T2 GOOD:
    User: wh_clerk_01 creates + counts, wh_manager_01 posts
    Role: WAREHOUSE_CLERK + WAREHOUSE_MANAGER
    Approval: WH Manager posts variance
    Data: facility FAC-1000 sloc0001 planned 2026-09-30 lines ITM-1001 system100 counted98 variance2, MICN class A interval30

SD – Sales Flow:

14. Customer Master SCUC + Cust-Mat VD51 + Free Goods VBN1 + Rebate VBO1:
    User: master_data_mgr creates customer, sales_rep_01 creates cust-mat/free goods/rebate
    Role: MASTER_DATA_MANAGER + SALES_REP
    Approval: None
    Data: CUST-1001 Retail Chain sales org CO-1000 channel SC-10 product line PL-10 credit CRED-1000 limit500000, VD51 CUST-CHILLI-100G, VBN1 buy10 get1 free, VBO1 2% min volume1000

15. Pricing PP-1000 PR00 150 INR:
    User: master_data_mgr
    Role: MASTER_DATA_MANAGER
    Approval: None
    Data: condition PR00 material ITM-1003 sales org CO-1000 channel SC-10 amount150 INR

16. Sales Order VA01 – Pricing + Free Goods + Credit FD32/OVA8 + Output BA00:
    User: sales_rep_01 creates, accountant_ar_01 approves if credit exposure > limit
    Role: SALES_REP + ACCOUNTANT_AR
    Approval: Credit check FD32 exposure SO+DL+BL+AR vs limit500000 → if >limit block → AR approves
    Data: customer CUST-1001 sales org CO-1000 channel SC-10 product line PL-10 currency INR payment NT30 pricing PP-1000 credit CRED-1000 lines ITM-1003 qty10 PC plant FAC-1000 TAN

17. Delivery VL01N – Due VL10C + Change VL02N + PGI 601 + Reverse VL09:
    User: shipping_clerk_01 creates + change + PGI, wh_manager_01 approves PGI
    Role: SHIPPING_CLERK + WAREHOUSE_MANAGER
    Approval: WH Manager PGI posts COGS GBB/BSX
    Data: sales_order SO-xxx facility FAC-1000 shipping DP-1000 priority02 route ROUTE-01 EXW lines sales_line10 material ITM-1003 qty10 sloc0002 batch BATCH-1003, VL02N picking PICKED qty10, PGI 601 posting stock-10 FI Dr COGS5000000000 1000 Cr BSX1000000001 1000, VL09 reverse REV-GI-* restores stock

18. Billing VF01 – Due VF04 + Change VF02 + Cancel VF11 + G2/L2/RE + Output RD00:
    User: billing_clerk_01 creates/change/cancel/credit memo, accountant_gl_01 release VFX3
    Role: BILLING_CLERK + ACCOUNTANT_GL
    Approval: GL release to accounting posts AR + Revenue KOFI/KOFK
    Data: delivery DN-xxx typeF2 date2026-09-30 payment NT30 lines delivery_line10 material ITM-1003 qty10 unit150, release FI Dr Customer1000000002 1500 Cr Revenue KOFI4000001000 1500 via VKOA, VF02 change payment NT45, VF11 cancel REV-BL-* CANCELLED FI reversed delivery NOT_BILLED, G2 credit memo Dr Revenue Cr Customer, L2 debit Dr Customer Cr Revenue, RE returns movement651 stock+10 reverse revenue, Output RD00 email customer@retailchain.com

PP – Production:

19. PIR MD61 + MRP MD02/MD03 + List MD05 + Conversion MD12 + MMRP:
    User: prod_planner_01
    Role: PRODUCTION_PLANNER
    Approval: None – planner runs
    Data: MD61 material ITM-1003 facility FAC-1000 qty100 date2026-10-15 type LS version00, MD02 single-level Demand PIR+SO Supply Stock+PO Net shortage→Planned Order, MD03 multi-level BOM dependent ITM-1001/ITM-1002, MD05 list material ITM-1003, MD12 conversion planned_order_id target PR facility FAC-1000 → PR-MD12-*

20. Prod Order CO01 + Change CO02 + Mass COHV + Capacity CM01 + Confirmation CO11N + GI261 + GR101:
    User: prod_planner_01 create/change/mass/capacity, shop_operator_01 confirm
    Role: PRODUCTION_PLANNER + SHOP_FLOOR_OPERATOR
    Approval: Planner REL release – component availability check
    Data: CO01 material ITM-1003 plant FAC-1000 qty10 type PP01 start2026-09-30 end2026-10-01 copies BOM+Routing, CO02 status REL, CO11N operation0010 yield10 scrap0 activity LAB-01 posts GI261 Dr GBB Cr BSX component ITM-1001 1KG+ITM-1002 0.5KG stock decrease, GR101 finished ITM-1003 qty10 facility FAC-1000 sloc0002 Dr BSX Cr GBB stock+10, COHV mass TECO order_numbers, CM01 capacity WC-1001 capacity100

21. Costing CK11N + CK24 + CK40N:
    User: accountant_gl_01 + cost_accountant
    Role: ACCOUNTANT_GL + COST_ACCOUNTANT
    Approval: Cost Accountant approves release
    Data: CK11N material ITM-1003 facility FAC-1000 variant PPC1 base1 rollup ITM-1001 0.1*50=5 + ITM-1002 0.05*100=5 + labor WC-1001 5*10=50 total60 prev150 new60 diff-90, CK24 MARK CE-* MARKED, CK24 RELEASE updates std_price60, CK40N mass plant FAC-1000 type STANDARD description Monthly costing Sep2026 created_by accountant_gl_01 COSTxxx

FICO – Finance:

22. GL Posting SA – Field Status OBC4/OBC5:
    User: accountant_gl_01
    Role: ACCOUNTANT_GL
    Approval: None – but field status G001 cost_center required enforced – if missing error
    Data: SA company1000 posting2026-09-29 reference GL Posting Test lines gl_account1000000001 debit1000 cost_center CC-1000 profit_center PC-1000 text Inventory adjustment + gl_account4000000000 credit1000 cost_center CC-1000

23. Tolerance OBA0/OBA4 + Credit FD32/OVA8:
    User: accountant_gl_01 creates tolerance, accountant_ap_01 uses in IV/payment, accountant_ar_01 credit, sales_rep_01 SO credit check
    Role: ACCOUNTANT_GL + ACCOUNTANT_AP + ACCOUNTANT_AR + SALES_REP
    Approval: GL approves tolerance override, AR approves credit limit increase
    Data: GL tolerance company1000 group GL-01 upper1000000, Vendor tolerance company1000 group VEND-01 vendor SUP-1001 diff5%, Credit Master customer CUST-1001 credit CRED-1000 limit500000 risk MEDIUM, SO exposure 1500 vs limit OK

24. Reversal FB08 + Reset FBRA + Clearing F.13 + FX F.05 + Payment F110:
    User: accountant_gl_01 reversal, accountant_ap_01 clearing/payment, accountant_ar_01 FX
    Role: ACCOUNTANT_GL + ACCOUNTANT_AP + ACCOUNTANT_AR
    Approval: GL approves reversal reason 01
    Data: FB08 document FI-1000000001 reason01 action REVERSE REV-* opposite Dr/Cr is_reversed audit, FBRA reset CLR-* RST-*, F.13 auto CLR-* WRX zero, F.05 currency USD rate83.5 date2026-09-30 company1000 action RUN reads foreign open items variance KDM via OBYC posts FXV-* KDM, F110 Proposal company1000 BANK SBI-001 PROP-* + Run company1000 proposal_numbers KZ 53* Dr Vendor Cr Bank DME+advice AP PAID

25. House Bank FI12 + Dunning F150 + Groups OKEON + Activity KL01 + Cycles KSU5 + Workflow SWDD + DMS + Jobs SM37 + Change Docs CDHDR – T2 GOOD:
    User: accountant_gl_01 house bank, accountant_ar_01 dunning, cost_accountant groups/activity/cycles, erp_admin workflow, wh_clerk_01 DMS, erp_admin jobs, auditor_01 change docs
    Role: ACCOUNTANT_GL + ACCOUNTANT_AR + COST_ACCOUNTANT + ERP_ADMIN + WAREHOUSE_CLERK + AUDITOR
    Approval: GL approves house bank, AR approves dunning level
    Data: FI12 house_bank SBI-001 State Bank India account123456789001 GL8000000001 INR, F150 dunning CUST-1001 level1 amount1500 overdue10, OKEON group CC-GRP-01 Production Cost Centers CC-1000 CC-1001, KL01 activity LAB-01 Labor Hours CC CC-1000 price100 H, KSU5 cycle CYC-01 Production Overhead Allocation sender CC-1000 receiver CC-1001 allocation100%, SWDD workflow WF-PR-01 PR Approval >10000 doc type PR release_strategy threshold10000 approvers wh_manager_01 buyer_01, DMS attachment PO PO-xxx file PO_Attachment.pdf size102400, SM37 job MRP Daily Run type MRP SCHEDULED, CDHDR change doc MATERIAL ITM-1001 changed_by master_data_mgr field standard_price old50 new52

26. Payroll PA03 + PE01 + PC00 + FI Posting:
    User: hr_manager_01 control+schema, payroll_clerk_01 run, accountant_gl_01 FI posting
    Role: HR_MANAGER + PAYROLL_CLERK + ACCOUNTANT_GL
    Approval: HR Manager RELEASED status, GL approves FI posting
    Data: PA03 company1000 period2026-09 area01 status RELEASED, PE01 schema SCHEMA-01 Standard Payroll Schema wage_types 1000 2000 3000 calc steps CALC_BASIC CALC_ALLOWANCE CALC_GROSS CALC_DEDUCTIONS CALC_NET, Payroll Run period2026-09 employee EMP-1001 description Sep2026 Payroll company1000 gross basic30000 allowance5000 overtime2000 37000 deductions tax3000 insurance1000 4000 net33000, PC00 FI posting period2026-09 company1000 posts PAY-FI-* FI doc FI-PAY-* Dr Payroll Expense6000000000 37000 Cr Payable2000000001 33000

27. Audit – Display Only:
    User: auditor_01
    Role: AUDITOR
    Approval: None – display only + audit logs
    Data: Universal ledger FULC company1000 posting2026-09-01 to2026-09-30 check BSX/WRX/GBB/PRD/KDM/KOFI/KOFK trial balance zero, CDHDR MATERIAL ITM-1001 std_price 50→52 by master_data_mgr, Audit Logs PR by pr_requester_01 PO buyer_01 GR wh_clerk_01 IV accountant_ap_01 Payment accountant_ap_01 SO sales_rep_01 Delivery shipping_clerk_01 Billing billing_clerk_01 Prod Order prod_planner_01 Confirmation shop_operator_01
```

**Approval Flow Setup – Updated with Users:**
- PR approval: Requester `pr_requester_01` creates PR → Buyer `buyer_01` + Warehouse Manager `wh_manager_01` approves if amount > 10000 – SWDD WF-PR-01 – T2 GOOD
- PO approval: Buyer `buyer_01` creates PO → Procurement Manager (role PROCUREMENT_BUYER with approval permission) approves if amount > 50000 – SWDD WF-PO-01 – uses info record ME11 price if unit_price 0
- SO credit check: Sales Rep `sales_rep_01` creates SO → Credit exposure check FD32/OVA8 → If exposure > limit → Accountant AR `accountant_ar_01` approves or blocks – increases FD32 limit or OVA8 warning
- GR approval: Warehouse Clerk `wh_clerk_01` creates GR 101 → Warehouse Manager `wh_manager_01` posts if tolerance OBA0 ok + posting period OB52 open + field status OBC4/OBC5
- IV tolerance: Accountant AP `accountant_ap_01` creates IV → OBA4 tolerance check – if diff > 5% → block → Accountant GL `accountant_gl_01` approves override
- Delivery PGI: Shipping Clerk `shipping_clerk_01` picks → Warehouse Manager `wh_manager_01` PGI 601 → posts COGS GBB/BSX – batch where-used MSC1N + serial
- Billing release: Billing Clerk `billing_clerk_01` creates billing → Accountant GL `accountant_gl_01` release to accounting VFX3 → posts AR + Revenue KOFI/KOFK + output RD00 email
- Payment Proposal: Accountant AP `accountant_ap_01` runs F110-PROP → selects due vendors → Accountant GL `accountant_gl_01` approves → F110-RUN creates KZ + DME file + advice
- Prod Order: Production Planner `prod_planner_01` creates REL → Shop Operator `shop_operator_01` confirms CO11N GI 261 + GR 101 → Cost Accountant `cost_accountant` runs costing CK40N
- Payroll: HR Manager `hr_manager_01` releases PA03 control → Payroll Clerk `payroll_clerk_01` runs payroll → Accountant GL `accountant_gl_01` posts to FI PC00
- Audit: Auditor `auditor_01` displays universal ledger + change docs CDHDR + audit logs – display only – no create
- User Approval: ERP Admin `erp_admin` creates role EROL + user EUSR status PENDING_APPROVAL → HR Manager `hr_manager_01` approves status ACTIVE → Auditor `auditor_01` audits CDHDR change doc USER status PENDING→ACTIVE – SWDD WF-USER-01 enforces approval for role assignment – NO USER → NO FUNCTION TESTING – T2 GOOD

---

## PHASE 2 – MASTER DATA CREATION – MASTER_DATA_MANAGER

### Title: Create Material Types
**Code:** `EMTP` – Material Types – `OMS2`

**User:** `master_data_mgr`

**Data to be entered – copyable:**
```
code: ROH
name: Raw Material
description: Raw materials for production

code: HALB
name: Semi-Finished
description: Semi-finished goods

code: FERT
name: Finished Goods
description: Finished goods for sale
```

---

### Title: Create UOM
**Code:** `EUOC` – UOM – `CUNI`

**User:** `master_data_mgr`

**Data to be entered – copyable:**
```
code: KG
name: Kilogram
description: Kilogram

code: PC
name: Piece
description: Piece

code: L
name: Liter
description: Liter
```

---

### Title: Create Material Master – Full Views – EMTC-FULL
**Code:** `EMTC` – Material Master – `MM01` – `POST /api/materials`

**User:** `master_data_mgr`

**Data to be entered – copyable – 3 materials for flow:**
```
RAW – Spices:
material_code: ITM-1001
name: Chilli Powder RAW
material_type: ROH
uom_code: KG
valuation_class: RAW
price_control: S
standard_price: 50
moving_avg_price: 50
valuation_category: RAW
plant_code: FAC-1000
profit_center: PC-1000

SEMI – Spice Mix:
material_code: ITM-1002
name: Spice Mix SEMI
material_type: HALB
uom_code: KG
valuation_class: SEMI
price_control: S
standard_price: 100
moving_avg_price: 100
plant_code: FAC-1000

FERT – Finished Pack:
material_code: ITM-1003
name: Chilli Pack 100g FERT
material_type: FERT
uom_code: PC
valuation_class: FINISHED
price_control: S
standard_price: 150
moving_avg_price: 150
plant_code: FAC-1000
```

**Dangling Check:** valuation_class RAW → OBYC BSX lookup → GR posts 1000000001 – if not, fail

---

### Title: Create Supplier / Vendor Master
**Code:** `PSUC` – Supplier – `XK01` – `POST /api/business-partners`

**User:** `master_data_mgr`

**Data to be entered – copyable:**
```
account_number: SUP-1001
display_name: Spice Supplier Pvt Ltd
partner_type: VENDOR
company_code: 1000
purchase_org_code: PO-1000
payment_terms: NT30
tolerance_group: VEND-01
bank_account: 1234567890
ifsc: SBIN0001234
currency_code: INR
```

```
account_number: SUP-1002
display_name: Packaging Supplier Ltd
partner_type: VENDOR
company_code: 1000
purchase_org_code: PO-1000
payment_terms: NT30
tolerance_group: VEND-01
currency_code: INR
```

---

### Title: Create Customer Master – Sales Area + Partner Functions
**Code:** `SCUC` – Customer – `XD01` – `POST /api/business-partners`

**User:** `master_data_mgr`

**Data to be entered – copyable:**
```
account_number: CUST-1001
display_name: Retail Chain Mumbai
partner_type: CUSTOMER
company_code: 1000
sales_org_code: CO-1000
sales_channel_code: SC-10
product_line_code: PL-10
customer_group: 01
price_group: 01
credit_control_area: CRED-1000
credit_limit: 500000
payment_terms: NT30
shipping_condition: 01
partner_functions: SP/SH/BP/PY all CUST-1001
currency_code: INR
```

---

### Title: Create BOM – EBOM
**Code:** `EBOM` – BOM – `CS01` – `POST /api/bom`

**User:** `master_data_mgr`

**Data to be entered – copyable:**
```
BOM Header:
parent_material_code: ITM-1003
plant_code: FAC-1000
base_quantity: 1
uom_code: PC
status: ACTIVE

BOM Lines:
line 10:
component_material_code: ITM-1001
quantity: 0.1
uom_code: KG
scrap_percent: 2

line 20:
component_material_code: ITM-1002
quantity: 0.05
uom_code: KG
scrap_percent: 1
```

---

### Title: Create Work Center
**Code:** `MWCC` – Work Center – `CR01` – `POST /api/work-centers`

**User:** `master_data_mgr`

**Data to be entered – copyable:**
```
code: WC-1001
name: Packing Line 1
facility_code: FAC-1000
cost_center_code: CC-1000
capacity: 100
uom_code: PC
activity_type: LAB-01
```

---

### Title: Create Routing
**Code:** `MRTC` – Routing – `CA01` – `POST /api/routings`

**User:** `master_data_mgr`

**Data to be entered – copyable:**
```
routing_number: RT-1001
material_code: ITM-1003
plant_code: FAC-1000
status: ACTIVE
operations:
  op 10:
    operation_number: 0010
    work_center_code: WC-1001
    description: Packing
    setup_time: 10
    machine_time: 5
    labor_time: 5
    base_quantity: 1
```

---

### Title: Create Info Record – ME11 – T2 GOOD
**Code:** `PIRC` – Info Record – `ME11` – `POST /api/info-records`

**User:** `buyer_01`

**Data to be entered – copyable:**
```
partner_number: SUP-1001
item_number: ITM-1001
facility_code: FAC-1000
unit_price: 50
currency_code: INR
uom_code: KG
lead_time_days: 7
min_order_qty: 10
valid_from: 2026-09-29
```

**Usage:** PO price auto if PO unit_price 0 → lookup info record → 50 INR/KG

---

### Title: Create Source List – ME01 – T2 GOOD
**Code:** `PSRC` – Source List – `ME01` – `POST /api/source-lists`

**User:** `buyer_01`

**Data to be entered – copyable:**
```
partner_number: SUP-1001
item_number: ITM-1001
facility_code: FAC-1000
priority: 1
is_mrp_relevant: true
valid_from: 2026-09-29
```

---

### Title: Create Quota Arrangement – MEQ1 – T2 GOOD
**Code:** `MEQ1` – Quota – `POST /api/quota-arrangements`

**User:** `buyer_01`

**Data to be entered – copyable:**
```
material_code: ITM-1001
facility_code: FAC-1000
vendor_number: SUP-1001
quota_quantity: 100
quota_percentage: 60
valid_from: 2026-09-29

material_code: ITM-1001
facility_code: FAC-1000
vendor_number: SUP-1002
quota_quantity: 100
quota_percentage: 40
valid_from: 2026-09-29
```

**Usage:** MRP splits PR qty 60/40 between SUP-1001/SUP-1002

---

### Title: Create Customer-Material Info + Free Goods + Rebate – VD51/VBN1/VBO1 – T2 GOOD
**Code:** `VD51/VBN1/VBO1` – `POST /api/customer-material-info`

**User:** `sales_rep_01`

**Data to be entered – copyable:**
```
VD51:
customer_number: CUST-1001
material_code: ITM-1003
customer_material_number: CUST-CHILLI-100G
customer_material_description: Chilli Pack 100g – Retail Chain Special

VBN1 Free Goods:
action: VBN1
material_code: ITM-1003
min_quantity: 10
free_material_code: ITM-1003
free_quantity: 1
valid_from: 2026-09-29
valid_to: 2026-12-31

VBO1 Rebate:
action: VBO1
customer_number: CUST-1001
material_code: ITM-1003
rebate_percentage: 2
min_volume: 1000
valid_from: 2026-09-29
valid_to: 2026-12-31
```

---

## PHASE 3 – MATERIAL FLOW PR→IV WITH DIFFERENT USES – PROCUREMENT + WAREHOUSE + ACCOUNTING

### Title: Flow 1 – Standard PR→PO→GR→IV→PAY – ROH
**Code:** `PR-PO-GR-IV-CHAIN-FULL` – `ME51N-ME21N-MIGO-MIRO-F110`

**Users:**
- PR: `pr_requester_01` – PROCUREMENT_REQUESTER
- PO: `buyer_01` – PROCUREMENT_BUYER
- GR: `wh_clerk_01` → `wh_manager_01` approval
- IV: `accountant_ap_01` – ACCOUNTANT_AP – tolerance OBA4 check
- PAY: `accountant_ap_01` + `accountant_gl_01` approval

**Data to be entered – copyable – PR:**

**Step 1 – Create PR – ME51N – `POST /api/pr`**
```
User: pr_requester_01
material_code: ITM-1001
plant_code: FAC-1000
quantity: 100
uom_code: KG
delivery_date: 2026-10-06
account_assignment: K
cost_center_code: CC-1000
text: PR for Chilli Powder – Standard Flow
```

**Approval:** Warehouse Manager approves if amount > 10000 – workflow SWDD

**Step 2 – Create PO from PR – ME21N – `POST /api/po`**
```
User: buyer_01
partner_number: SUP-1001
facility_code: FAC-1000
delivery_date: 2026-10-06
currency_code: INR
payment_terms_days: 30
pr_id: <PR id from step 1>
lines:
  - item_number: ITM-1001
    quantity: 100
    uom_code: KG
    unit_price: 0  # 0 → auto from info record ME11 → 50 INR – T2 GOOD – NO DANGLING
    plant_code: FAC-1000
    inventory_location_code: 0001
```

**Expected:** PO total 100*50=5000 INR – uses info record price – if info record not found, manual price required

**Step 3 – GR 101 – MIGO – `POST /api/gr`**
```
User: wh_clerk_01
po_number: <PO number from step 2>
movement_type: 101
facility_code: FAC-1000
inventory_location_code: 0001
lines:
  - item_number: ITM-1001
    quantity: 100
    uom_code: KG
    batch_number: BATCH-1001
```

**Posting:** 
- Stock: +100 KG ITM-1001 sloc 0001
- MAP recalc: (old qty*old MAP + 100*50)/new qty
- FI: Dr BSX 1000000001 5000 Cr WRX 2000000000 5000 – via OBYC BSX RAW + WRX – universal ledger FULC

**Approval:** `wh_manager_01` posts – checks posting period OB52 open, field status OBC4/OBC5

**Step 4 – IV – MIRO – `POST /api/iv`**
```
User: accountant_ap_01
po_number: <PO number>
gr_number: <GR number>
invoice_number: INV-SUP-1001-001
invoice_date: 2026-09-29
gross_amount: 5000
currency_code: INR
lines:
  - item_number: ITM-1001
    quantity: 100
    unit_price: 50
```

**Posting:**
- Checks tolerance OBA4 VEND-01 – payment diff allowed 5% – if gross_amount diff >5% vs PO → block
- FI: Dr WRX 2000000000 5000 Cr Vendor Reconciliation 2000000001 5000 – via OBYC WRX
- If price diff vs MAP → PRD posting Dr/Cr PRD 4000000001
- Updates GR quantityInvoiced, PO ELIKZ if fully invoiced

**Step 5 – GR/IR Clearing – F.13 – `POST /api/gr-ir-clearing`**
```
User: accountant_ap_01
action: auto – clears where quantity_received=quantity_invoiced
```

**Expected:** Clearing CLR-* – WRX balance zero – month-end close

**Step 6 – Payment Proposal + Run – F110 – `POST /api/payment/proposal` + `/api/payment/run`**
```
User: accountant_ap_01

Proposal:
company_code: 1000
payment_method: BANK
house_bank: SBI-001

Run:
company_code: 1000
proposal_numbers: [<PROP numbers>]
```

**Posting:**
- Proposal selects AP due OPEN due_date<=today – checks payment method, bank, tolerance OBA4, payment terms FAPT, house bank FI12
- Run creates KZ doc 53* – Dr Vendor 2000000001 5000 Cr Bank 8000000001 5000 – via GL accounts – DME file + advice – updates AP PAID – proposal PAID

**End-to-End Check:**
- Stock +100 KG
- Universal ledger: BSX Dr 5000, WRX Dr 5000 Cr 5000 cleared, Vendor Cr 5000 Dr 5000 cleared after payment, Bank Cr 5000
- PO status CLOSED ELIKZ true

---

### Title: Flow 2 – PR→PO→GR→IV with Tolerance Overpay Block – OBA4-ENF
**Code:** `OBA4-ENF` – Tolerance – `POST /api/iv` with diff

**Users:** `accountant_ap_01` + `accountant_gl_01` approver

**Data to be entered – copyable – IV with overpay:**
```
po_number: <PO from flow 1>
gr_number: <GR from flow 1>
invoice_number: INV-SUP-1001-002
gross_amount: 6000  # 20% over PO 5000 – exceeds VEND-01 5% → block
```

**Expected:** Error `Tolerance exceeded – payment diff allowed 5% – OBA4-ENF – block` – Accountant GL must approve via override or adjust tolerance group

**Fix:**
```
Update tolerance group VEND-01 payment_diff_percent: 25
Then retry IV
```

---

### Title: Flow 3 – Stock Transport Order STO – Cross-Plant
**Code:** `STO` – Stock Transport – `ME21N + VL10B + MIGO`

**Users:** `buyer_01` + `wh_clerk_01`

**Data to be entered – copyable:**
```
STO PO:
partner_number: FAC-1000  # supplying plant as vendor
facility_code: FAC-1000
receiving_facility_code: FAC-1000-02  # second plant – create FAC-1000-02 first
item_number: ITM-1001
quantity: 50
unit_price: 50
document_type: UB  # STO type

Delivery for STO:
sto_number: <STO PO number>
facility_code: FAC-1000

GR for STO:
sto_number: <STO PO>
movement_type: 101
facility_code: FAC-1000-02
```

---

### Title: Flow 4 – Subcontracting – Component to Vendor + GR Finished
**Code:** `SUBCON` – Subcontracting – `ME21N + MIGO 541 + 101`

**Users:** `buyer_01` + `wh_clerk_01`

**Data to be entered – copyable:**
```
PO Subcontracting:
partner_number: SUP-1001
facility_code: FAC-1000
item_number: ITM-1003  # FERT subcontracted
quantity: 10
unit_price: 150
document_type: SC
components:
  - component_material_code: ITM-1001
    quantity: 1  # 0.1 KG *10 =1 KG issued to vendor

GI to Vendor 541:
po_number: <Subcon PO>
movement_type: 541
item_number: ITM-1001
quantity: 1

GR Subcontracting 101:
po_number: <Subcon PO>
movement_type: 101
item_number: ITM-1003
quantity: 10
```

---

### Title: Flow 5 – RFQ → Quotation → Price Comparison → PO – ME41/ME47/ME49 – T2 GOOD
**Code:** `ME41-RFQ-ME47-ME49` – `POST /api/rfq`

**Users:** `buyer_01`

**Data to be entered – copyable:**
```
ME41 RFQ:
material_code: ITM-1001
facility_code: FAC-1000
quantity: 100
uom_code: KG
deadline_date: 2026-10-06
description: RFQ for Chilli Powder

ME47 Quotation 1 – SUP-1001:
rfq_number: RFQ-xxxxxx
vendor_number: SUP-1001
unit_price: 48
delivery_days: 7
currency_code: INR

ME47 Quotation 2 – SUP-1002:
rfq_number: RFQ-xxxxxx
vendor_number: SUP-1002
unit_price: 45
delivery_days: 10
currency_code: INR

ME49 Price Comparison – Select Winner:
rfq_number: RFQ-xxxxxx
winner_quotation_number: QT-xxxxxx  # lowest price SUP-1002 45*100=4500
# or leave empty – auto lowest price
```

**Result:** PO-RFQ-* created from winner – vendor SUP-1002 price 45 – T2 GOOD – NO DANGLING – winner used in PO

---

### Title: Flow 6 – Reservation + GI – MB21 + MB1A 261/201 – T2 GOOD
**Code:** `MB21-RESERVATION` – `POST /api/reservations`

**Users:** `wh_clerk_01` + `prod_planner_01`

**Data to be entered – copyable:**
```
MB21 Reservation for Prod Order:
material_code: ITM-1001
facility_code: FAC-1000
sloc_code: 0001
quantity: 10
uom_code: KG
movement_type: 261
order_number: ORD-1001
requirement_date: 2026-09-30

GI 261 against reservation:
reservation_number: RES-xxxxxx
movement_type: 261
quantity: 10
```

**Usage:** Reservation reserves stock – availability check – GI posts GBB/BSX – batch where-used MSC1N + serial tracking

---

## PHASE 4 – MM FLOWS WITH CORRESPONDING USERS – T2 GOOD

### Title: Info Record Update – ME12 – Change Price
**Code:** `ME12` – Info Record Change – `PUT /api/info-records`

**User:** `buyer_01`

**Data to be entered – copyable:**
```
info_record_number: PIR-xxxxxxxxxx
unit_price: 52
valid_from: 2026-10-01
```

---

### Title: Source List Priority Change – ME02
**Code:** `ME02` – Source List Change – `PUT /api/source-lists`

**User:** `buyer_01`

**Data to be entered – copyable:**
```
id: <source list id>
priority: 2
is_mrp_relevant: true
```

---

### Title: Quota Arrangement Update – MEQ2
**Code:** `MEQ2` – Quota Change – `POST /api/quota-arrangements` same material/plant/vendor new %

**User:** `buyer_01`

**Data to be entered – copyable:**
```
material_code: ITM-1001
facility_code: FAC-1000
vendor_number: SUP-1001
quota_quantity: 120
quota_percentage: 70
valid_from: 2026-10-01
```

**Validation:** Total % for ITM-1001/FAC-1000 must ≤100 – existing SUP-1002 40% + new 70% =110% → error – adjust to 60/40

---

### Title: Physical Inventory – MI01 Create + MI04 Count + MI07 Post + MI02 Change + MICN Cycle – T2 GOOD
**Code:** `MI01-MI04-MI07-MI02-MICN` – `POST /api/physical-inventory` + `/api/inventory/cycle-count`

**Users:** `wh_clerk_01` count + `wh_manager_01` post

**Data to be entered – copyable:**
```
MI01 Create PI Doc:
facility_code: FAC-1000
inventory_location_code: 0001
planned_count_date: 2026-09-30
header_text: PI for RAW store
lines:
  - item_number: ITM-1001
    system_qty: 100
    uom_code: KG

MICN Cycle Counting – ABC:
action: MICN
material_code: ITM-1001
facility_code: FAC-1000
abc_class: A
cycle_count_interval: 30

MI04 Count:
pi_number: PI-xxxxxxxx
lines:
  - item_number: ITM-1001
    counted_qty: 98
    variance_reason: 2 KG damaged

MI07 Post:
pi_number: PI-xxxxxxxx
posting_date: 2026-09-30

MI10 List Differences:
action: DIFF

MI11 Recount:
action: RECOUNT
pi_number: PI-xxxxxxxx
recount_reason: Variance 2 KG – recount requested
```

---

## PHASE 5 – SD FLOWS WITH CORRESPONDING USERS – T2 GOOD

### Title: Pricing Procedure + Condition Records – VK11 – T0 BLOCKING
**Code:** `V/08 + VK11` – Pricing – `POST /api/pricing-conditions`

**User:** `master_data_mgr`

**Data to be entered – copyable:**
```
Pricing Procedure:
code: PP-1000
name: India Standard Pricing
description: Standard pricing with PR00 base + discounts

Condition Record PR00 Base Price:
condition_type: PR00
material_code: ITM-1003
sales_org_code: CO-1000
sales_channel_code: SC-10
valid_from: 2026-09-29
valid_to: 2026-12-31
amount: 150
currency_code: INR
uom_code: PC
```

---

### Title: Sales Order Full – VA01 – with Credit Check FD32/OVA8 + Free Goods VBN1 + Cust-Mat VD51
**Code:** `VA01-FULL` – Sales Order – `POST /api/sales-orders`

**User:** `sales_rep_01` – SALES_REP – credit check by `accountant_ar_01`

**Data to be entered – copyable:**
```
customer_number: CUST-1001
sales_org_code: CO-1000
sales_channel_code: SC-10
product_line_code: PL-10
currency_code: INR
payment_terms: NT30
pricing_procedure: PP-1000
credit_control_area: CRED-1000
lines:
  - material_code: ITM-1003
    quantity: 10
    uom_code: PC
    plant_code: FAC-1000
    item_category: TAN
```

**Flow:**
- Pricing determination: customer + sales area → PP-1000 → access sequence → PR00 150 INR → line total 1500
- Free goods VBN1: buy 10 get 1 free → auto creates free item 1 PC ITM-1003
- Cust-Mat VD51: customer material number CUST-CHILLI-100G description Retail Chain Special → used in SO print
- Credit check: exposure = open SO 1500 + open delivery 0 + open billing 0 + open AR 0 =1500 vs limit 500000 → OK – if exposure > limit → block → Accountant AR approves via FD32 credit_limit increase or OVA8 warning
- Output BA00: NACE BA00 for SO → email to customer

**Approval:** If credit exposure > limit → `accountant_ar_01` must increase FD32 credit_limit or approve SO via release

---

### Title: Delivery Create – VL01N – Due List VL10C + Change VL02N + Picking/Packing + PGI 601 + Reverse GI VL09
**Code:** `VL01N-PGI-601 + VL02N + VL10C + VL09` – `POST /api/delivery` + `/api/delivery/change`

**Users:** `shipping_clerk_01` + `wh_manager_01`

**Data to be entered – copyable:**
```
VL10C Due List – Check SO due:
action: DUE
# GET /api/delivery/change?action=VL10C – shows SO OPEN/CONFIRMED due

VL01N Delivery Create:
sales_order_number: SO-xxxxxxxx
facility_code: FAC-1000
shipping_point: DP-1000
delivery_priority: 02
route: ROUTE-01
incoterms: EXW
lines:
  - sales_line_number: 10
    material_code: ITM-1003
    quantity: 10
    uom_code: PC
    inventory_location_code: 0002
    batch_number: BATCH-1003

VL02N Change Delivery – Picking:
delivery_number: DN-xxxxxxxx
action: VL02N
picking_status: PICKED
quantity_picked: 10
shipping_point: DP-1000
route: ROUTE-01

PGI 601 – Post Goods Issue:
delivery_number: DN-xxxxxxxx
movement_type: 601
posting_date: 2026-09-30

Posting:
- Stock: -10 PC ITM-1003 sloc 0002
- FI: Dr COGS 5000000000 1000 (10*100 MAP) Cr BSX 1000000001 1000 – via OBYC GBB/BSX – universal ledger
- Delivery status GOODS_ISSUED

VL09 Reverse GI – if needed:
delivery_number: DN-xxxxxxxx
action: VL09
reversal_reason: Wrong picking – reverse GI
# Restores stock +10, reverses COGS, creates REV-GI-*
```

---

### Title: Billing Create – VF01 – Due List VF04 + Change VF02 + Cancel VF11 + Credit Memo G2 + Debit Memo L2 + Returns RE + Output RD00
**Code:** `VF01-VTFL-VFX3 + VF02 + VF04 + VF11 + G2/L2/RE` – `POST /api/billing` + `/api/billing/change`

**Users:** `billing_clerk_01` + `accountant_gl_01` release

**Data to be entered – copyable:**
```
VF04 Billing Due List:
action: DUE
# GET /api/billing/change?action=VF04 – deliveries GOODS_ISSUED not yet billed

VF01 Billing Create:
delivery_number: DN-xxxxxxxx
billing_type: F2
billing_date: 2026-09-30
payment_terms: NT30
lines:
  - delivery_line_number: 10
    material_code: ITM-1003
    quantity: 10
    unit_price: 150

Posting – VFX3 Release to Accounting:
billing_number: BL-xxxxxxxx
action: RELEASE

FI:
- Dr Customer Reconciliation 1000000002 1500 + Tax
- Cr Revenue KOFI 4000001000 1500 – via VKOA KOFI + MWST tax – universal ledger
- COGS already posted at PGI

VF02 Change Billing:
billing_number: BL-xxxxxxxx
action: VF02
payment_terms: NT45
billing_date: 2026-09-30

VF11 Cancel Billing:
billing_number: BL-xxxxxxxx
action: VF11
reversal_reason: Wrong price – cancel billing
# Status CANCELLED, FI reversed, delivery billing_status NOT_BILLED, REV-BL-*

G2 Credit Memo – without delivery:
billing_number: BL-xxxxxxxx  # original billing
action: G2
billing_type: G2
# Creates G2-xxxxxx credit memo – Dr Revenue Cr Customer – AR credit

L2 Debit Memo:
billing_number: BL-xxxxxxxx
action: L2
billing_type: L2
# Creates L2-xxxxxx debit memo – Dr Customer Cr Revenue

RE Returns:
billing_number: BL-xxxxxxxx
action: RE
billing_type: RE
# Creates RE-xxxxxx returns – movement 651 – stock +10, reverse revenue

Output RD00:
output_type: RD00
document_type: BILLING
document_number: BL-xxxxxxxx
medium: EMAIL
recipient_email: customer@retailchain.com
form_name: FORM-BILLING-01
```

---

## PHASE 6 – PP FLOWS – PRODUCTION PLANNER + SHOP FLOOR + COST ACCOUNTANT

### Title: PIR + MRP Single-Item – MD61 + MD02/MD03 + MD05/MD12 + MMRP
**Code:** `MD61-MD02-MD03-MD05-MD12-MMRP` – `POST /api/pir` + `/api/mrp` + `/api/mrp/list`

**User:** `prod_planner_01`

**Data to be entered – copyable:**
```
MD61 PIR – Forecast:
material_code: ITM-1003
facility_code: FAC-1000
planned_quantity: 100
requirement_date: 2026-10-15
requirement_type: LS
version: 00

MD02 Single-Level MRP:
action: MD02
material_code: ITM-1003
facility_code: FAC-1000
# Demand PIR+SO, Supply Stock+PO, Net Demand-Supply, shortage → Planned Order

MD03 Multi-Level MRP – explodes BOM:
action: MD03
material_code: ITM-1003
facility_code: FAC-1000
# Creates dependent requirements for ITM-1001, ITM-1002

MD05 MRP List:
action: MRP_LIST
material_code: ITM-1003

MD12 Planned Order Conversion:
action: CONVERT
planned_order_id: <MRP element id>
target_type: PR
facility_code: FAC-1000
# Converts planned order → PR PR-MD12-* or Prod Order PROD-MD12-*
```

---

### Title: Production Order – CO01 + Change CO02 + Mass COHV + Capacity CM01 + Confirmation CO11N + GI 261 + GR 101
**Code:** `CO01-CONF-GI-GR + CO02 + COHV + CM01` – `POST /api/production-orders` + `/api/mrp/list`

**Users:** `prod_planner_01` create/change + `shop_operator_01` confirm

**Data to be entered – copyable:**
```
CO01 Create Prod Order – copies BOM + Routing:
material_code: ITM-1003
plant_code: FAC-1000
quantity: 10
uom_code: PC
order_type: PP01
basic_start_date: 2026-09-30
basic_end_date: 2026-10-01
# System copies BOM components ITM-1001 0.1KG*10=1KG + ITM-1002 0.05KG*10=0.5KG + Routing operations WC-1001

CO02 Change Prod Order:
production_order_number: ORD-xxxxxxxx
status: REL
# REL – Released – component availability check

CO11N Confirmation + GI 261:
production_order_number: ORD-xxxxxxxx
operation_number: 0010
yield_quantity: 10
scrap_quantity: 0
activity_type: LAB-01
# Posts GI 261: Dr GBB 4000000000 Cr BSX 1000000001 – component consumption ITM-1001 1KG + ITM-1002 0.5KG – stock decrease – via OMJJ 261 + OBYC GBB/BSX

GR 101 Finished Goods:
production_order_number: ORD-xxxxxxxx
movement_type: 101
material_code: ITM-1003
quantity: 10
uom_code: PC
facility_code: FAC-1000
inventory_location_code: 0002
# Posts GR 101: Dr BSX 1000000001 Cr GBB 4000000000 – finished goods receipt – stock +10 PC

COHV Mass TECO:
action: MASS_TECO
order_numbers: ["ORD-xxxx1","ORD-xxxx2"]
# Status TECO – Technically Completed

CM01 Capacity Planning:
action: CAPACITY
# GET /api/mrp/list?action=CM01 – work center WC-1001 capacity 100 PC – leveling
```

---

### Title: Costing – CK11N Create Estimate + CK24 Mark/Release + CK40N Mass Run – T1 REQUIRED
**Code:** `CK11N-CK24-CK40N` – `POST /api/cost-estimate` + `/api/costing-run`

**Users:** `accountant_gl_01` + `cost_accountant`

**Data to be entered – copyable:**
```
CK11N Create Cost Estimate – BOM explosion + Routing cost:
material_code: ITM-1003
facility_code: FAC-1000
costing_variant: PPC1
base_quantity: 1
# Rollup: ITM-1001 0.1KG*50=5 + ITM-1002 0.05KG*100=5 + labor WC-1001 5*10=50 → total 60 – prev std 150 new 60 diff -90

CK24 Mark:
estimate_number: CE-xxxxxxxx
action: MARK
# Status MARKED

CK24 Release – Update Std Price:
estimate_number: CE-xxxxxxxx
action: RELEASE
# Updates ent_material_plant standard_price = 60 – FI valuation new price

CK40N Mass Costing Run – all FERT:
plant_id: FAC-1000
type: STANDARD
description: Monthly costing run Sep 2026
created_by: accountant_gl_01
# Creates COSTxxx run, lines with total_cost, material_cost, prev/new std price, diff, bom_explosion JSONB – if STANDARD updates std prices
```

---

## PHASE 7 – FICO FLOWS – ACCOUNTANT + AUDITOR

### Title: GL Posting – SA – Field Status OBC4/OBC5 Enforcement – T0 BLOCKING
**Code:** `SA` – GL Document – `POST /api/universal-ledger`

**User:** `accountant_gl_01`

**Data to be entered – copyable:**
```
document_type: SA
company_code: 1000
posting_date: 2026-09-29
reference: GL Posting Test
lines:
  - gl_account: 1000000001
    debit_amount: 1000
    credit_amount: 0
    cost_center: CC-1000
    profit_center: PC-1000
    text: Inventory adjustment – cost center required – OBC4/OBC5 enforcement
  - gl_account: 4000000000
    debit_amount: 0
    credit_amount: 1000
    cost_center: CC-1000
    text: Consumption
```

**Enforcement:** Field status group G001 cost_center required – if missing → error – OBC4/OBC5-ENF – T0 BLOCKING

---

### Title: Tolerance Groups – OBA0/OBA4 – IV/Payment Block – T1 REQUIRED
**Code:** `OBA0/OBA4-ENF` – `POST /api/tolerance-groups` + IV/payment check

**User:** `accountant_gl_01` + `accountant_ap_01`

**Data to be entered – copyable:**
```
GL Tolerance:
company_code: 1000
group_code: GL-01
upper_limit_amount: 1000000

Vendor Tolerance:
company_code: 1000
group_code: VEND-01
vendor_number: SUP-1001
payment_diff_allowed: 5
payment_diff_percent: 5
```

**Usage:** IV checks if invoice diff > tolerance → block, Payment checks if overpay > tolerance → block

---

### Title: Credit Master + Credit Check – FD32 + OVA8 – T1 REQUIRED
**Code:** `FD32-CREDIT + OVA8` – `POST /api/credit-policy-areas` + SO check

**User:** `accountant_ar_01` + `sales_rep_01`

**Data to be entered – copyable:**
```
Credit Master:
customer_code: CUST-1001
credit_control_area: CRED-1000
credit_limit: 500000
risk_category: MEDIUM

SO Credit Check – exposure calc:
customer_number: CUST-1001
# Exposure = open SO 1500 + open delivery 0 + open billing 0 + open AR 0 =1500 vs limit 500000 → OK
# If exposure > limit → SO blocked – OVA8 – needs approval
```

---

### Title: Document Reversal + Reset Clearing + GR/IR Clearing – FB08/FBRA/F.13 – T1 REQUIRED
**Code:** `FB08-FBRA-F.13` – `POST /api/universal-ledger/reversal` + `/api/gr-ir-clearing`

**User:** `accountant_gl_01` + `accountant_ap_01`

**Data to be entered – copyable:**
```
FB08 Reversal:
document_number: FI-1000000001
reversal_reason: 01
action: REVERSE
# Creates REV-* reversal doc opposite Dr/Cr, marks original is_reversed true – audit trail

FBRA Reset Clearing:
original_clearing_number: CLR-xxxxxxxx
action: RESET
# Creates RST-* resets GR/IR clearing

F.13 GR/IR Clearing – Auto:
# POST /api/gr-ir-clearing auto mode – clears where GR qty = IV qty – CLR-* – WRX balance zero – month-end close
```

---

### Title: FX Valuation – F.05 – KDM via OBYC – T1 REQUIRED
**Code:** `F.05-FX-VAL` – `POST /api/fx-valuations` action RUN

**User:** `accountant_ar_01`

**Data to be entered – copyable:**
```
currency_code: USD
exchange_rate: 83.5
valuation_date: 2026-09-30
company_code: 1000
action: RUN
# Reads fin_universal_ledger currency_code=USD is_reversed false – totalForeign*rate - old = variance – KDM account via OBYC KDM – posts variance to universal ledger KDM – FXV-* – month-end revaluation
```

---

### Title: Automatic Payment Program – F110 Proposal + Run – KZ + DME – T1 REQUIRED
**Code:** `F110-FULL` – `POST /api/payment/proposal` + `/api/payment/run`

**User:** `accountant_ap_01`

**Data to be entered – copyable:**
```
Proposal F110-PROP:
company_code: 1000
payment_method: BANK
house_bank: SBI-001
# Selects AP due OPEN due_date<=today – checks payment method, bank, tolerance OBA4, payment terms FAPT, house bank FI12 – creates PROP-*

Run F110-RUN:
company_code: 1000
proposal_numbers: ["PROP-xxxx1","PROP-xxxx2"]
# Creates KZ docs 53* Dr Vendor 2000000001 Cr Bank 8000000001 – DME file + advice – clears AP – AP PAID
```

---

### Title: House Bank + Dunning + Cost Center Groups + Activity Types + Assessment Cycles + Workflow + DMS + Jobs + Change Docs – T2 GOOD
**Code:** `FI12 + F150 + OKEON + KL01 + KSU5 + SWDD + DMS + SM37 + CDHDR` – `POST /api/dunning`

**Users:** `accountant_gl_01` + `accountant_ar_01` + `cost_accountant` + `erp_admin` + `auditor_01`

**Data to be entered – copyable:**
```
FI12 House Bank:
action: HOUSE_BANK
house_bank_code: SBI-001
bank_name: State Bank of India
account_number: 123456789001
gl_account: 8000000001
currency_code: INR

F150 Dunning:
action: DUNNING
customer_number: CUST-1001
dunning_level: 1
dunning_amount: 1500
overdue_days: 10

OKEON Cost Center Group:
action: COST_CENTER_GROUP
group_code: CC-GRP-01
group_name: Production Cost Centers
cost_centers: ["CC-1000","CC-1001"]

KL01 Activity Type:
action: ACTIVITY_TYPE
activity_type_code: LAB-01
activity_type_name: Labor Hours
cost_center_code: CC-1000
price_per_unit: 100
uom_code: H

KSU5 Assessment Cycle:
action: CYCLE
cycle_code: CYC-01
cycle_name: Production Overhead Allocation
sender_cost_centers: ["CC-1000"]
receiver_cost_centers: ["CC-1001"]
allocation_percentage: 100

SWDD Workflow – PR Approval:
action: WORKFLOW
workflow_code: WF-PR-01
workflow_name: PR Approval >10000
document_type: PR
release_strategy: {"threshold":10000,"approvers":["wh_manager_01","buyer_01"]}

DMS Attachment:
action: ATTACH
document_type: PO
document_number: PO-xxxxxxxx
file_name: PO_Attachment.pdf
file_size: 102400
mime_type: application/pdf

SM37 Job – Background MRP:
action: JOB
job_name: MRP Daily Run
job_type: MRP

CDHDR Change Doc – Audit:
action: CHANGE_DOC
object_type: MATERIAL
object_id: ITM-1001
changed_by: master_data_mgr
field_name: standard_price
old_value: 50
new_value: 52
```

---

### Title: Payroll Control + Schema + Run + FI Posting – PA03 + PE01 + PC00 – T1 REQUIRED + T2 GOOD
**Code:** `PA03-CTRL + PE01-SCHEMA + PC00-FI-POST` – `POST /api/payroll/control` + `/api/payroll-run`

**Users:** `hr_manager_01` + `payroll_clerk_01` + `accountant_gl_01`

**Data to be entered – copyable:**
```
PA03 Control Record:
company_code: 1000
payroll_period: 2026-09
payroll_area: 01
status: RELEASED

PE01 Schema:
action: PE01
schema_code: SCHEMA-01
schema_name: Standard Payroll Schema
description: Basic + Allowance – Deductions
wage_types: ["1000","2000","3000"]
calculation_steps: ["CALC_BASIC","CALC_ALLOWANCE","CALC_GROSS","CALC_DEDUCTIONS","CALC_NET"]

Payroll Run – PC00 Calc:
payroll_period: 2026-09
employee_code: EMP-1001
description: Sep 2026 Payroll
company_code: 1000
# Calculates gross = basic 30000 + allowance 5000 + overtime 2000 =37000, deductions tax 3000 + insurance 1000 =4000, net 33000

PC00 FI Posting:
action: PC00
payroll_period: 2026-09
company_code: 1000
# Posts PAY-FI-* – FI doc FI-PAY-* Dr Payroll Expense 6000000000 37000 Cr Payable 2000000001 33000 + Deductions Cr – via auto account – cost center actuals
```

---

## PHASE 8 – AUDIT & FINAL CHECKS – AUDITOR

### Title: Auditor Display – Universal Ledger + Change Docs + Audit Logs
**Code:** `FULC + CDHDR + AUDIT` – `GET /api/universal-ledger` + `/api/dunning?action=CHANGE_DOC`

**User:** `auditor_01`

**Data to be entered – copyable – display only:**
```
Universal Ledger – ACDOCA:
company_code: 1000
posting_date_from: 2026-09-01
posting_date_to: 2026-09-30
# Check: BSX/WRX/GBB/PRD/KDM/KOFI/KOFK all posted – trial balance zero – GR/IR WRX zero after F.13 – FX variance KDM posted – COGS GBB/BSX – Revenue KOFI – Vendor/Customer open items cleared after F110

Change Docs CDHDR:
object_type: MATERIAL
object_id: ITM-1001
# Check: standard_price change 50→52 by master_data_mgr – audit trail

Audit Logs:
# Check: PR created by pr_requester_01, PO by buyer_01, GR by wh_clerk_01, IV by accountant_ap_01, Payment by accountant_ap_01, SO by sales_rep_01, Delivery by shipping_clerk_01, Billing by billing_clerk_01, Prod Order by prod_planner_01, Confirmation by shop_operator_01
```

**Final Validation – NO DANGLING Checklist:**
- [ ] EMTC valuation_class used in OBYC BSX lookup in GR → PASS
- [ ] OMJJ movement_type affects stock qty + universal ledger → PASS
- [ ] OBYC BSX/WRX/GBB/PRD/KDM + VKOA KOFI/KOFK used in GR/PGI/Billing/FX → PASS
- [ ] OBC4/OBC5 field_status_group checked in FI posting → PASS
- [ ] OBA7 doc types + FBN1 number ranges validated → PASS
- [ ] PR→PO→GR→IV chain updates quantityReceived/quantityInvoiced + ELIKZ → PASS
- [ ] STOCK-LEDGER MAP recalculated on GR 101 → PASS
- [ ] BOM-ROU-WC-LINK copied to Prod Order → PASS
- [ ] CO01-CONF-GI-GR posts GI 261 GBB/BSX + GR 101 BSX → PASS
- [ ] SCUC sales area + partner functions used in SO → PASS
- [ ] VA01 pricing PR00 used in SO net value → PASS
- [ ] VKOA revenue account used in billing FI → PASS
- [ ] VL01N-PGI-601 posts COGS GBB/BSX + stock decrease → PASS
- [ ] VF01-VTFL-VFX3 billing release posts AR + Revenue → PASS
- [ ] OBA0/OBA4 tolerance checked in IV/payment → PASS
- [ ] FD32 credit limit + OVA8 exposure SO+DL+BL+AR checked in SO → PASS
- [ ] FB08 reversal creates REV-* opposite Dr/Cr + is_reversed → PASS
- [ ] F.13 GR/IR clearing CLR-* WRX zero → PASS
- [ ] F110 proposal PROP-* + run KZ 53* Dr Vendor Cr Bank DME → PASS
- [ ] F.05 FX valuation FXV-* KDM variance → PASS
- [ ] CK11N cost estimate CE-* BOM explosion → CK24 MARK/RELEASE updates std price → CK40N mass → PASS
- [ ] MD61 PIR + MD02/MD03 MRP net calc + MD05 list + MD12 conversion → PASS
- [ ] VL02N change + VL10C due list + VL09 reverse GI REV-GI-* → PASS
- [ ] VF02 change + VF04 due list + VF11 cancel REV-BL-* + G2/L2/RE memo → PASS
- [ ] PA03 control + PE01 schema + PC00 payroll run + FI posting PAY-FI-* → PASS
- [ ] ME11 info record price auto used in PO when unit_price 0 → PASS
- [ ] ME01 source list priority used in MRP source determination → PASS
- [ ] MEQ1 quota % total ≤100 used in MRP PR split → PASS
- [ ] ME41 RFQ → ME47 quotation → ME49 winner → PO-RFQ-* → PASS
- [ ] MB21 reservation RES-* used in GI availability → PASS
- [ ] MB52 stock report per SLoc → PASS
- [ ] MSC1N batch where-used trace → PASS
- [ ] SERIAL tracking → PASS
- [ ] MICN ABC class used in PI frequency → PASS
- [ ] CS02 BOM change + CS20 mass change used in prod order/costing/MRP → PASS
- [ ] VD51 cust-mat info used in SO description, VBN1 free goods buy X get Y, VBO1 rebate accrual → PASS
- [ ] NACE BA00/LD00/RD00 output used in email/print → PASS
- [ ] F150 dunning used in AR collection, FI12 house bank used in F110 → PASS
- [ ] OKEON groups used in reporting, KL01 activity used in routing/costing, KSU5 cycles used in allocation → PASS
- [ ] SWDD workflow release strategy used in approval → PASS
- [ ] DMS attachments, SM37 jobs, CDHDR change docs audit → PASS

**If all PASS → System is production-ready – T0+T1+T2 GOOD – NO DANGLING – Ready for UAT → T3 future**

---

## APPENDIX – COPYABLE USER LOGIN MATRIX

```
ERP Admin – Full Access:
username: erp_admin
password: Admin@123
role: ERP_ADMIN
url: /login
company_code: 1000

Master Data Manager:
username: master_data_mgr
password: Mdm@123
role: MASTER_DATA_MANAGER

Procurement Requester:
username: pr_requester_01
password: Pr@123
role: PROCUREMENT_REQUESTER

Buyer:
username: buyer_01
password: Buyer@123
role: PROCUREMENT_BUYER

Warehouse Clerk:
username: wh_clerk_01
password: Wh@123
role: WAREHOUSE_CLERK

Warehouse Manager:
username: wh_manager_01
password: Whm@123
role: WAREHOUSE_MANAGER

Production Planner:
username: prod_planner_01
password: Pp@123
role: PRODUCTION_PLANNER

Shop Floor Operator:
username: shop_operator_01
password: Shop@123
role: SHOP_FLOOR_OPERATOR

Sales Rep:
username: sales_rep_01
password: Sales@123
role: SALES_REP

Shipping Clerk:
username: shipping_clerk_01
password: Ship@123
role: SHIPPING_CLERK

Billing Clerk:
username: billing_clerk_01
password: Bill@123
role: BILLING_CLERK

Accountant AP:
username: accountant_ap_01
password: Ap@123
role: ACCOUNTANT_AP

Accountant AR:
username: accountant_ar_01
password: Ar@123
role: ACCOUNTANT_AR

Accountant GL:
username: accountant_gl_01
password: Gl@123
role: ACCOUNTANT_GL

Auditor:
username: auditor_01
password: Audit@123
role: AUDITOR

HR Manager:
username: hr_manager_01
password: Hr@123
role: HR_MANAGER

Payroll Clerk:
username: payroll_clerk_01
password: Pay@123
role: PAYROLL_CLERK
```

---

**End of Guide – Replace previous fictional industry guide with this real company flow – Title, Code, Data to be entered copyable – Users onboarded as needed for each function + approval flow – Material flow PR→IV with different uses – MM + SD with corresponding users – T0+T1+T2 – NO DANGLING – Ready for debugging/testing – T3 future**

© 2026 ERP Modular Monolith • MIT
