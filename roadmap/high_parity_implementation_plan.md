# High Parity Implementation Plan – 18 Functions – Own Codes, SAP Codes Only Aliases

**Goal:** 100% parity or at least high parity (80-90%+) in all 18 sectors with own IP codes, SAP proprietary codes only as searchable aliases – search SAP code leads to own code – legal-safe own IP – industry standard term in commits, not in UI

**Date:** 2026-09-30
**Selected Option:** Implement all 18 to high parity at once – full roadmap

---

## 1. Own Codes – Primary, SAP Codes Only Aliases – Already Done + To Do

**Already Own IP Primary:**
- FMTM – Foundation Movement Type Master – alias OMJJ
- FRAD – Foundation Revenue Account Determination – alias VKOA
- FFSG – Foundation Field Status Group – alias OBC5
- FFSV – Foundation Field Status Variant – alias OBC4/FSSV
- FBJM – Foundation Background Job Monitor – alias SM37
- FELM – Foundation Enqueue Lock Monitor – alias SM12
- FNRC – Foundation Number Range Config – alias FBN1
- FEXC – Foundation Exchange Rate Config – alias OB08
- FAUC – Foundation Auto Account Config – alias OBYC
- FPPE – Foundation Posting Period – alias OB52
- FPPC – Foundation Posting Period Variant – alias OBBO
- FFYC – Foundation Fiscal Year Calendar – alias OB29
- FCOA – Foundation Chart of Accounts – alias OB13
- FCPC – Foundation Credit Control Area – alias OB45
- FFSV/FFSG – already own
- EMTC – Enterprise Material Type Create – alias MM01
- PPOC – Procurement PO Create – alias ME21N
- And all others – own IP primary

**To Ensure Own Codes for All 18 Functions – New Own Codes to Create:**

| SAP Code | Own Code | Description | Alias |
|----------|----------|-------------|-------|
| OX02, OX10, OX08, OX16, OB62, OB37, OBBO, OBC4 | FCRL – Foundation Company Relationship | Company/legal entity/company code relationships – company groups, legal entities, company codes, plants, business area, segment, sales org, purchasing org, controlling area, inter-company – own IP | OX02, OX10, OX08, OX16, OB62, OB37, OBBO, OBC4, FCRL |
| OB29 | FFYC – already own – Fiscal Year Calendar | Fiscal calendar K4 April-March, year-dependent, special periods 13-16, factory calendar – own IP | OB29, FFYC |
| OB52, OBBO | FPPE/FPPC – already own – Posting Periods/Variant | Posting periods open/close per company code, per account type A/D/K/M/S, from/to account range, authorization – own IP | OB52, OBBO, FPPE, FPPC |
| OB13 | FCOA – already own – Chart of Accounts | Chart of accounts CA-IN-01, chart type operational/group/country, account groups, retained earnings, FSSV assignment, length – own IP | OB13, FCOA |
| OBC4/OBC5 | FFSV/FFSG – already own – Field Status Variant/Groups | Field status variant FFSV-1000, groups G001/G002 with R/S/O/D, posting key field status, GL account group assignment, variant assignment to company code – own IP | OBC4, OBC5, FSSV, FFSV, FFSG |
| FBN1/SNRO | FNRC – already own – Number Ranges | Number ranges numeric only, 5-12 digit, assignment table XYZ→material, error_and_extend, usage %, locked badge, cache + pgbouncer – own IP | FBN1, SNRO, FNRC |
| OMJJ | FMTM – already own – Movement Types | Movement types 101/102/122/161/261/262/309/551/601/602/701/702, account grouping, valuation grouping, field selection, reason – own IP | OMJJ, FMTM |
| OBYC | FAUC – already own – Auto Account Determination | Auto account BSX/WRX/GBB/PRD/BSV/KDM/KOFI/KOFK + GBB groupings VAX/VAY/VBR/VBO/VKA, valuation grouping, account grouping – own IP | OBYC, FAUC |
| OB08 | FEXC – already own – Exchange Rates | Exchange rates from_currency to_currency rate from_date to_date, rate types M/B/G, spread, translation ratio, direct/indirect, integration into GR/billing/payment with KDM – own IP | OB08, FEXC |
| ACDOCA | FUNL – Foundation Universal Ledger – NEW OWN CODE | Universal ledger universal journal – 400+ fields, foreign/group currency, quantity/UOM, batch, business area, segment, functional area, partner, tax, doc number/line – own IP | ACDOCA, FUNL, FAGL |
| FBN1 | FNRC – already own – Document Numbering | Document numbering via number ranges – same as number ranges – own IP | FBN1, FNRC |
| Material Ledger | FSTL – Foundation Stock Ledger – NEW OWN CODE | Stock ledger material ledger – actual costing, price history, total stock/value, price control S/V, material ledger 3 currencies, batch/special stock – own IP | Material Ledger, FSTL |
| VBFA | FDFL – Foundation Document Flow – NEW OWN CODE | Document flow PR→PO→GR→IV→Payment, SO→Delivery→PGI→Billing→Payment – quantity/value flow, status, ELIKZ, icons, links – own IP | VBFA, FDFL, ALB, AFLW |
| SM37 | FBJM – already own – Background Job Framework | Background job monitor – queue, progress steps, no timeout, auto-promote after 10 sec for ALL, popup with redirect to last page, header icon, System Jobs page – own IP – better UX than SAP | SM37, FBJM |
| SM12 | FELM – already own – Enqueue Locks | Enqueue locks – double-entry protection, 5 min expiry, heartbeat, PO lock when GR background, number range lock when editing, 🔒 Locked badge – own IP | SM12, FELM |
| LUW | FTRB – Foundation Transaction Rollback – NEW OWN CODE | Transaction rollback/error handling – DB transaction BEGIN/COMMIT/ROLLBACK for all postings – e.g., GR posts stock ledger + universal ledger + MAP recalc + PO update ELIKZ – all in one transaction – if one fails, rollback all – no partial – own IP | LUW, FTRB |
| CDHDR/CDPOS | FAUD – Foundation Audit Trail – NEW OWN CODE | Audit trail for master and transactional changes – change docs CDHDR/CDPOS – who changed what when – old value/new value – user, timestamp – WORM-lite – own IP | CDHDR, CDPOS, SM20, FAUD, AALG |
| PFCG/SU01 | FRPC – Foundation Role/Permission Checks – NEW OWN CODE | Role/permission checks around financial postings – authorization objects for plant, movement, company code, GL, posting period, number range – checks in APIs – own IP | PFCG, SU01, FRPC, FUSC, FROC |

---

## 2. Implementation Details – To Reach High Parity (80-90%+)

### 2.1 Company/Legal Entity/Company Code Relationships – FCRL – Own IP – Target 85%

**Current:** ECGC company groups, ELEC legal entities, ECOC company codes, EFCC plants, EWHC/EWSC facilities, FCPC credit control area – basic relationships – company code → credit control area, → chart, → fiscal variant, → posting period variant, → field status variant

**To High Parity:**
- Add Business Area – table fin_business_area – code, name, company_code – assignment to company code and profit center – for sector reporting – e.g., BA01 Spices, BA02 Foods
- Add Segment – table fin_segment – code, name – for segment reporting – e.g., SEG01 Spices, SEG02 Foods – assignment to profit center
- Add Sales Org – table fin_sales_org – code, name, company_code – assignment to company code – for sector-wise sales – e.g., SO01 Spices Sales, SO02 Foods Sales
- Add Purchasing Org – table fin_purchasing_org – code, name, company_code – assignment to company code and plant – for sector-wise purchasing – e.g., PO01 Spices Purchasing
- Add Controlling Area – table fin_controlling_area – code, name – assignment to company code – e.g., CA01 Controlling – company code 1000→CA01, 1100→CA01
- Add Inter-company Relationships – table fin_intercompany – from_company_code, to_company_code, clearing_account – for STO and inter-company billing – e.g., 1000→1100 clearing 1600000001
- Add Company Code Assignments Enforcement – in GR, PO, SO, etc. – check if plant belongs to company code, if sales org belongs to company code, etc. – via postingPeriodHelpers
- Add Enterprise Config UI – /foundation/enterprise-config – show all assignments with validation – e.g., plant 1000 must belong to company code 1000, sales org 1000 must belong to company code 1000, etc.
- Add API /api/company-relationships – GET list, POST create assignment – with validation – no dangling

**Own Code:** FCRL – Foundation Company Relationship – alias OX02, OX10, OX08, OX16, OB62, OB37, OBBO, OBC4 – search SAP code leads to FCRL

### 2.2 Fiscal Calendar – FFYC – Own IP – Target 85%

**Current:** FFYC K4 April-March – fiscal_year_variant K4 – from_date, to_date, year_shift, periods 12 – table fin_fiscal_calendar – must exist before ELEC – T0

**To High Parity:**
- Add Year-Dependent Periods – table fin_fiscal_calendar_year – fiscal_year_variant, fiscal_year, period, from_date, to_date, year_shift, period_text – e.g., K4 2026 period 1 from 2026-04-01 to 2026-04-30, period 2 from 2026-05-01 to 2026-05-31, etc. – different dates per fiscal year
- Add Special Periods 13-16 – for year-end closing – e.g., period 13 from 2027-03-01 to 2027-03-31 for audit adjustments – table fin_fiscal_calendar_special – variant, fiscal_year, special_period, from_date, to_date
- Add Factory Calendar – table fin_factory_calendar – code, name, holidays – e.g., IN01 India – holidays list – assignment to plant – for MRP and delivery
- Add Period Texts – e.g., period 1 = April, period 2 = May, etc. – for K4 April-March
- Add Fiscal Year Variant Assignment Enforcement – in posting period check – check if posting date falls within fiscal year variant periods for company code
- Add API /api/fiscal-calendars/year – GET year-dependent, POST create year-dependent

**Own Code:** FFYC – already own – alias OB29 – search OB29 leads to FFYC

### 2.3 Posting Periods – FPPE/FPPC – Own IP – Target 85%

**Current:** FPPC PPV-1000 variant, FPPE posting periods – variant_code, from_period, to_period, from_year, to_year, open/closed – table fin_posting_period – must exist before ELEC – T0 – check in GR, IV, billing via postingPeriodHelpers

**To High Parity:**
- Add Account Type Specific – A assets, D customers, K vendors, M materials, S GL – table fin_posting_period now has account_type field – e.g., PPV-1000 A open 1-12 2026, D open 1-12 2026, K open 1-12 2026, M open 1-12 2026, S open 1-12 2026 – different open/close per account type
- Add From/To Account Range – from_account, to_account – e.g., PPV-1000 S open for GL 1000000000-1999999999 only, not for 2000000000-2999999999 – for controlling period open per GL range
- Add Authorization Group – authorization_group – e.g., AUTH01 – only users with AUTH01 can post in period – check in role/permission
- Add Special Periods 13-16 Handling – allow posting in special periods for year-end closing – e.g., period 13 open for audit adjustments only for users with special auth
- Add Posting Period Variant Assignment Enforcement – check if company code assigned to variant – via FCRL relationships
- Add API /api/posting-periods – already exists – extend with account_type, from_account, to_account, authorization_group

**Own Code:** FPPE/FPPC – already own – alias OB52/OBBO – search OB52/OBBO leads to FPPE/FPPC

### 2.4 Chart of Accounts – FCOA – Own IP – Target 85%

**Current:** FCOA CA-IN-01 – language EN – table fin_chart_of_accounts – must exist before ELEC – T0 – GL accounts FGLC alias FS00 – account_number, account_group, account_type, retained earnings, field status group FFSG

**To High Parity:**
- Add Chart Type – chart_type – operational, group, country – e.g., CA-IN-01 operational, CA-GRP group, CA-IN-CTRY country – table fin_chart_of_accounts now has chart_type
- Add Account Groups – table fin_account_group – code, name, field status group FFSG, number range – e.g., AG01 Balance Sheet, AG02 P&L, AG03 Assets – assignment to GL account – e.g., GL 1000000000-1999999999 → AG01, 3000000000-3999999999 → AG02
- Add Retained Earnings Account – retained_earnings_account – e.g., 3200000000 Retained Earnings – assignment to chart – for P&L closing
- Add Financial Statement Version Assignment – FSSV assignment to chart – table fin_fsv_assignment – chart, fsv_code – e.g., CA-IN-01 → FSSV-1000 – for BS/P&L reporting
- Add Length of GL Account Number – length – e.g., 10 digits – enforcement in GL account creation
- Add Chart Assignment to Company Code Enforcement – via FCRL – check if GL account belongs to chart assigned to company code – in posting
- Add Group Chart – group chart for consolidation – e.g., CA-GRP group chart – assignment to operational chart
- Add API /api/chart-of-accounts – already exists – extend with chart_type, account groups, retained earnings, FSSV assignment

**Own Code:** FCOA – already own – alias OB13 – search OB13 leads to FCOA

### 2.5 Field Status Variants/Groups – FFSV/FFSG – Own IP – Target 85%

**Current:** FFSV-1000 variant, FFSG groups G001 expense cost_center R, G002 cash cost_center S – variant_code, group_code, field_name, status R/S/O/D – table fin_field_status_group – multiple fields per group – same structure as SAP – saves all fields at once – matrix UI – related links – 12 fields – cost_center, profit_center, tax_code, payment_term, reference, text, assignment, business_area, trading_partner, functional_area, fund, grant

**To High Parity:**
- Add Posting Key Field Status – OBC7 – table fin_posting_key_field_status – posting_key, field_name, status R/S/O/D – e.g., posting key 40 Dr GL cost_center R, posting key 50 Cr GL cost_center S – for GL posting
- Add GL Account Group Assignment – OBD4 – table fin_gl_account_group_assignment – account_group, field_status_group – e.g., AG01 Balance Sheet → FFSG G001, AG02 P&L → FFSG G002 – assignment to GL account group
- Add Field Status Variant Assignment to Company Code – via FCRL – table fin_company_code now has field_status_variant field – enforcement – e.g., company code 1000 → FFSV-1000
- Add More Fields – 40+ fields – business_area, trading_partner, functional_area, fund, grant, cost_center, profit_center, tax_code, payment_term, reference, text, assignment, business_area, trading_partner, functional_area, fund, grant, plus 28 more – e.g., segment, business area, functional area, trading partner, etc.
- Add Field Status for Document Header vs Line Item – header field status vs line item field status – e.g., header reference R, line item text O
- Add API /api/field-status-variants and /api/field-status-groups – already exists – extend with posting key field status, GL account group assignment

**Own Code:** FFSV/FFSG – already own – alias OBC4/OBC5/FSSV – search OBC4/OBC5 leads to FFSV/FFSG

### 2.6 Number Ranges and Assignment Rules – FNRC – Own IP – Target 90% – Already High Parity

**Current:** FNRC numeric only, no prefix, 5-12 digit configurable via FROM/TO, current/next_available, used_count, locked badge, assignment table explicit XYZ→material, error_and_extend, usage % warning 80% amber 90% red, cache dragonfly + pgbouncer – almost full parity

**To High Parity – Already High – Minor Additions:**
- Add Year-Dependent Intervals – fiscal_year field – e.g., PO 1000 2026 4500000000-4599999999, PO 1000 2027 4500000000-4599999999 with current reset per year
- Add External Number Ranges – external flag – e.g., for manual document numbers – e.g., GR with external number from vendor delivery note
- Add Buffer – buffer flag – e.g., buffer 10 numbers in memory for performance – for high volume
- Add Number Range Groups – groups for assignment – e.g., group MAT for materials, group PO for POs
- Already high parity – 90% – not much to add

**Own Code:** FNRC – already own – alias FBN1/SNRO – search FBN1/SNRO leads to FNRC

### 2.7 Movement Types – FMTM – Own IP – Target 85%

**Current:** FMTM 101/102/122/161/261/262/309/551/601/602/701/702 – stock +/- value +/- account modifier BSX/WRX/GBB/PRD/BSV – table fin_movement_type – code, description, movement_indicator +/-, value_indicator +/-, transaction_key BSX/WRX/GBB/PRD/BSV/KDM/KOFI/KOFK, reversal_code, allowed_for GR/GI/TRANSFER/PI/ALL – T0 – checks in GR, delivery PGI, production confirmation, PI

**To High Parity:**
- Add All Movement Types – ensure all 101/102/122/161/261/262/309/551/601/602/701/702 plus 103/104/105/106/107/108/122/123/124/161/162/261/262/301/302/303/304/305/309/311/312/321/322/343/344/351/352/411/412/413/414/415/416/417/418/419/421/422/423/424/453/454/455/456/457/458/459/541/542/543/544/545/546/547/548/551/552/553/554/555/556/557/558/559/561/562/563/564/565/566/601/602/603/604/605/606/607/608/621/622/623/624/631/632/633/634/635/636/641/642/643/644/645/646/647/648/651/652/653/654/655/656/701/702/703/704/705/706/707/708/711/712/713/714/715/716/717/718/721/722/723/724/731/732/733/734/735/736/737/738/741/742/743/744/745/746/747/748/751/752/753/754/755/756/761/762/763/764/765/766/771/772/773/774/775/776/781/782/783/784/785/786/791/792/793/794/795/796/801/802/803/804/805/806/807/808/811/812/813/814/815/816/821/822/823/824/831/832/833/834/835/836/841/842/843/844/845/846/847/848/851/852/853/854/855/856/861/862/863/864/865/866/871/872/873/874/875/876/881/882/883/884/885/886/891/892/893/894/895/896 – but for high parity, at least ensure 101/102/122/161/261/262/309/551/601/602/701/702 plus 103/104/105/122/123/124/261/262/301/309/311/321/343/351/411/413/415/417/421/423/453/455/457/459/541/543/545/547/551/553/555/557/561/563/565/601/602/603/605/621/623/631/633/641/643/645/647/651/653/655/701/702/703/711/713/715/721/723/731/733/735/737/741/743/745/747/751/753/755/761/763/765/771/773/775/781/783/785/791/793/795/801/803/805/807/811/813/815/821/823/831/833/841/843/845/847/851/853/855/861/863/865/871/873/875/881/883/885/891/893/895 – for professional use, at least 20-30 common movement types
- Add Account Grouping – account_grouping – e.g., GBB with account groupings VAX/VAY/VBR/VBO/VKA/VKA/VKP – for COGS, revenue, etc. – table fin_movement_type now has account_grouping
- Add Valuation Grouping – valuation_grouping – e.g., 0001, 0002 – for different valuation areas – table fin_movement_type now has valuation_grouping
- Add Field Selection – field_selection – e.g., which fields required/suppressed per movement – e.g., batch required for 101, reason required for 551 scrap
- Add Reason for Movement – reason_code – e.g., scrap reason, return reason – table fin_movement_reason – code, description – assignment to movement type
- Add Special Stock Indicators – special_stock – e.g., K consignment, O consignment, E sales order stock, Q project stock – for special stock postings
- Add API /api/movement-types – already exists – extend with account_grouping, valuation_grouping, field_selection, reason, special_stock

**Own Code:** FMTM – already own – alias OMJJ – search OMJJ leads to FMTM

### 2.8 Automatic Account Determination – FAUC – Own IP – Target 85%

**Current:** FAUC BSX/WRX/GBB/PRD/BSV/KDM/KOFI/KOFK – chart + valuation_class + account_grouping → GL – table fin_auto_account – chart_of_accounts, transaction_key, valuation_class, account_grouping, gl_account – T0 – checks in GR, GI, PGI, PI, billing

**To High Parity:**
- Add All Transaction Keys – ensure all BSX, WRX, GBB, PRD, BSV, KDM, KOFI, KOFK, GBB with groupings, BSX, WRX, GBB, PRD, BSV, KDM, KOFI, KOFK, plus GBB with VAX/VAY/VBR/VBO/VKA/VKA/VKP, PRD with VAY/VBR/VKA, etc. – plus 30+ transaction keys – e.g., BSX, WRX, GBB, PRD, BSV, KDM, KOFI, KOFK, GBB, BSX, WRX, GBB, PRD, BSV, KDM, KOFI, KOFK, plus KON, etc. – for high parity, at least ensure BSX, WRX, GBB with VAX/VAY/VBR/VBO/VKA/VKA/VKP, PRD with VAY/VBR/VKA, BSV with VAY/VBR, KDM, KOFI, KOFK, plus GBB with 10+ groupings
- Add Valuation Grouping – valuation_grouping – e.g., 0001 – for different valuation areas – table fin_auto_account now has valuation_grouping
- Add Account Grouping Detailed – account_grouping – e.g., GBB with VAX (Goods issue), VAY (Goods issue for sales order), VBR (Consumption for sales order), VBO (Consumption for sales order), VKA (Sales order), VKP (Project), etc. – for COGS, revenue, etc.
- Add Account Assignment – account_assignment – e.g., for GBB, account assignment per sales order, project, cost center
- Add Split Valuation – split valuation – e.g., material with split valuation – valuation type – for different valuation per batch
- Add API /api/auto-account-determination – already exists – extend with valuation_grouping, account_grouping detailed, account assignment, split valuation

**Own Code:** FAUC – already own – alias OBYC – search OBYC leads to FAUC

### 2.9 Exchange Rates – FEXC – Own IP – Target 85%

**Current:** FEXC from_currency to_currency rate from_date to_date – validity dates – frequent changes via new records – historical rate lookup – cache dragonfly with invalidation – inverse fallback 1/rate – fail with reason if no rate for posting date – KDM exchange diff at payment – basic

**To High Parity:**
- Add Rate Types – rate_type – M average, B bank buying, G bank selling, P bank selling, etc. – table fin_exchange_rate now has rate_type – e.g., M for average, B for buying, G for selling – for different purposes – e.g., GR uses M, payment uses B/G
- Add Spread – spread – e.g., for bank buying/selling spread – for exchange rate with spread
- Add Translation Ratio – from_factor, to_factor – e.g., 100 JPY = 0.75 USD – from_factor 100, to_factor 1, rate 0.75 – for currencies with different ratio – e.g., JPY with 100:1
- Add Direct/Indirect Quotation – direct/indirect – e.g., direct quotation USD→INR 83.5, indirect INR→USD 0.012 – for different quotation methods
- Add Exchange Rate Type Assignment to Company Code – via FCRL – table fin_company_code now has exchange_rate_type – e.g., company code 1000 → rate type M
- Add Daily Feed Integration – API to fetch RBI rates daily and update via POST /api/exchange-rates – with from_date = today
- Add Integration into GR/Billing/Payment Posting – helper getExchangeRate(from, to, postingDate, rateType) in postingPeriodHelpers – used in POST /api/gr, /api/billing, /api/payment – with KDM posting for exchange diff – e.g., invoice booked at 83.5, payment at 84.0 → diff 0.5*1000 = 500 INR → Dr/Cr KDM
- Add API /api/exchange-rates – already exists – extend with rate_type, spread, from_factor, to_factor, direct/indirect

**Own Code:** FEXC – already own – alias OB08 – search OB08 leads to FEXC

### 2.10 Universal Ledger – FUNL – NEW OWN CODE – Target 85%

**Current:** fin_universal_ledger – universal journal – all postings – company_code, fiscal_year, posting_date, account, amount, currency, transaction_key, movement_type, material, plant, cost_center, profit_center – basic – /fico/universal-ledger

**To High Parity:**
- Add 400+ Fields – like SAP ACDOCA – company_code, fiscal_year, posting_date, account, amount in company code currency + foreign currency + group currency, transaction_key, movement_type, material, plant, storage loc, batch, cost_center, profit_center, segment, business area, functional area, partner, tax code, quantity, UOM, document number, line item, document type, posting key, reference, assignment, text, etc. – table fin_universal_ledger now has 400+ fields – e.g., amount_company_currency, amount_foreign_currency, amount_group_currency, quantity, uom, batch, storage_loc, business_area, segment, functional_area, partner, tax_code, doc_number, line_item, doc_type, posting_key, reference, assignment, text, etc.
- Add Foreign/Group Currency – amount_foreign_currency, foreign_currency, amount_group_currency, group_currency – for foreign currency postings – e.g., GR in USD 1000, company currency INR 83500, group currency EUR 900
- Add Quantity/UOM – quantity, uom – e.g., GR 100kg, PGI 50pc – for stock postings
- Add Batch – batch – e.g., lot_number – for batch-specific postings
- Add Business Area, Segment, Functional Area – business_area, segment, functional_area – e.g., BA01 Spices, SEG01 Spices, FA01 Production – for sector reporting
- Add Partner – partner – e.g., vendor/customer – for AR/AP postings
- Add Tax – tax_code – e.g., GST 18% – for tax postings
- Add Doc Number/Line – doc_number, line_item – e.g., GR 5000000001 line 1 – for document flow
- Add Extension Fields – extension fields for custom – e.g., custom field 1, 2, etc.
- Add Real-time Reporting with CDS Views – views for trial balance, P&L, BS – e.g., view fin_universal_ledger_trial_balance – company_code, fiscal_year, account, amount – group by
- Add API /api/universal-ledger – already exists – extend with 400+ fields

**Own Code:** FUNL – Foundation Universal Ledger – NEW OWN CODE – alias ACDOCA, FAGL – search ACDOCA/FAGL leads to FUNL

### 2.11 Document Numbering – FNRC – Own IP – Target 90% – Already High Parity

**Current:** FNRC numeric only, assignment table, error_and_extend, usage %, locked badge, cache + pgbouncer – almost full parity – same as number ranges

**To High Parity – Already High – Minor Additions:**
- Same as number ranges – year-dependent, external, buffer, groups – already high parity – 90%

**Own Code:** FNRC – already own – alias FBN1/SNRO – search FBN1/SNRO leads to FNRC

### 2.12 Stock Ledger – FSTL – NEW OWN CODE – Target 85%

**Current:** inv_stock_ledger – stock ledger – material, plant, storage loc, batch, movement_type, quantity, value, posting_date, document number – table – /foundation/stock – ISTV stock overview – stock +/- via movement FMTM – value +/- via transaction_key – MAP recalc – universal ledger BSX/WRX – T0

**To High Parity:**
- Add Actual Costing – actual costing – price history, total stock/value, price control S/V, MAP/Standard, price unit, total stock, total value, moving average price recalc, actual costing, price differences PRD, exchange differences KDM – table fin_stock_ledger now has price_control, standard_price, moving_average_price, total_stock, total_value, price_differences, exchange_differences
- Add Price History – table fin_price_history – material, plant, posting_date, price, price_control, total_stock, total_value – for MAP history
- Add Total Stock/Value – total_stock, total_value – for material/plant – e.g., material 10001 plant 1000 total stock 1000kg, total value INR 83500, MAP = total_value/total_stock = 83.5
- Add Price Control S/V – price_control – S Standard, V Moving Average – for material valuation – e.g., S with standard price 80, V with MAP recalc
- Add Material Ledger with 3 Currencies – company code currency, foreign currency, group currency – for actual costing with 3 currencies
- Add Batch-Specific Stock – batch – e.g., lot_number – for batch-specific stock and value
- Add Special Stock – special_stock – e.g., K consignment, O consignment, E sales order stock, Q project stock – for special stock postings
- Add API /api/stock-ledger – already exists via /api/stock – extend with actual costing, price history, total stock/value, price control, material ledger 3 currencies, batch/special stock

**Own Code:** FSTL – Foundation Stock Ledger – NEW OWN CODE – alias Material Ledger – search Material Ledger leads to FSTL

### 2.13 Document Flow – FDFL – NEW OWN CODE – Target 85%

**Current:** AFLW own IP alias ALB – Document Flow – tracks PR→PO→GR→IV→Payment, SO→Delivery→PGI→Billing→Payment – table fin_document_flow – predecessor_doc, successor_doc, doc_type, company_code, posting_date – /audit/document-flow – own IP – shows chain – e.g., PR 1000000000 → PO 4500000001 → GR 5000000001 → IV 5100000001 – status

**To High Parity:**
- Add Quantity/Value Flow – quantity, value – e.g., PR 100kg → PO 100kg → GR 100kg → IV 100kg – quantity flow – value flow – e.g., PO value INR 83500 → GR value INR 83500 → IV value INR 83500
- Add Status – status – e.g., open, closed, ELIKZ – for each document – e.g., PO with ELIKZ true = delivery completed, GR with ELIKZ false = open
- Add ELIKZ – delivery completed indicator – e.g., PO with ELIKZ true means no more GR expected – for PO
- Add Icons – icons per doc type – e.g., PR icon 📋, PO icon 📦, GR icon 📥, IV icon 🧾, Delivery icon 🚚, PGI icon 📤, Billing icon 💰 – for UI
- Add Links – link to display document – e.g., click PR 1000000000 → /mm/pr?mode=display&code=1000000000 – for navigation
- Add More Doc Types – batch flow, serial flow, invoice flow, payment flow, etc. – e.g., GR→Batch, Delivery→Serial, Billing→Payment
- Add API /api/document-flow – already exists via /api/audit/document-flow – extend with quantity/value flow, status, ELIKZ, icons, links

**Own Code:** FDFL – Foundation Document Flow – NEW OWN CODE – alias VBFA, ALB, AFLW – search VBFA/ALB leads to FDFL

### 2.14 Background-Job Framework – FBJM – Own IP – Target 90% – Already High Parity – Even Better UX

**Current:** FBJM own IP alias SM37 – Background Job Monitor – System Jobs – table core_background_job – job_type PAYROLL_RUN, MATERIAL_CREATE, PO_CREATE, PR_CREATE, GR_CREATE, etc. – status QUEUED/RUNNING/COMPLETED/FAILED/CANCELLED – progress 0-100, current_step/total_steps, step_description, steps jsonb, payload, result, error, company_code, created_by, lock_object, lock_object_id – queue if RUNNING exists, keep QUEUED and start after one completes via setTimeout processNextJob – processors for PAYROLL_RUN 1000 employees steps Validating→Loading→Processing employee X/Y with 10ms per employee ~10-15 sec progress updates, MATERIAL_CREATE, PO/PR/GR_CREATE – GET ?status=RUNNING,QUEUED, POST queue, PUT progress, DELETE cancel – header JobIndicator polling /api/jobs?status=RUNNING,QUEUED every 3s shows ⏳ count, green pulse if RUNNING (server working), dropdown with progress bars, step_description, queue explanation, link to System Jobs – System Jobs page FBJM own IP alias SM37 – SM37 page polling every 2s, stats running/queued/completed/failed, filter, cancel/delete, test payroll 1000 button, steps display, progress bar, result/error, explains no timeout, can close page, queue – auto-promote after 10 sec for ALL processes – first 10 sec direct with spinner timer + elapsed timer + prevent double click + show result with doc number + next + usage %, if >10 sec auto background popup with progress steps – user can close → redirect to last page as usual – job continues – header FBJM icon – no timeout – even minutes – universal hook useAutoPromoteJob – src/shared/ui/job-popup.tsx – JobPopup component + useAutoPromoteJob hook – industry standard – better UX than SAP

**To High Parity – Already High – Minor Additions:**
- Add Cron Scheduling – cron – e.g., payroll run every month 1st at 2am – table core_background_job now has cron field – e.g., cron "0 2 1 * *" – for scheduling
- Add Job Dependencies – dependencies – e.g., job B starts after job A completes – table core_background_job now has dependencies field – e.g., job B depends on job A
- Add Spool – spool – e.g., job output spool – table core_background_job now has spool field – for job logs
- Add Job Logs Detailed – job logs – e.g., detailed logs per step – table core_background_job_log – job_id, step, message, timestamp – for debugging
- Add Batch Job with Variant – variant – e.g., payroll variant with parameters – table core_background_job now has variant field
- Already high parity – 85% – even better UX – not much to add

**Own Code:** FBJM – already own – alias SM37 – search SM37 leads to FBJM

### 2.15 Enqueue Locks – FELM – Own IP – Target 85% – Already High Parity

**Current:** FELM own IP alias SM12 – Enqueue Locks – Double-Entry Protection – table core_enqueue_lock – lock_object PO, NUMBER_RANGE, MATERIAL, GR, etc. – object_id 4500000001, MAT-RAW-01 – table_name, locked_by, locked_at, expires_at NOW+5min, is_active, job_id, description – API /api/locks – POST acquire – checks if already locked and not expired – if locked by other → 423 Locked – other users must wait – if same user → extend 5 min – PUT heartbeat – extends expiry on activity every 1 min while typing – DELETE release – on Save/Cancel/Close or job COMPLETED/FAILED – table released – auto-expire after 5 min inactivity – expires_at < NOW() → is_active=false – cleanup via GET or DELETE – background jobs – when job RUNNING for PO 4500000001, acquire lock PO 4500000001 with job_id – release on COMPLETED/FAILED – other users cannot create GR for same PO – prevents double entry – double stock – double ledger – critical settings – number range MAT-RAW-01, company codes, facilities – when editing, lock acquired – other users see 🔒 Locked by user@example.com – can edit after release or 5 min – heartbeat – SM12 page FELM own IP alias SM12 – shows all active locks – Object, ID, Table, Locked By, Since, Expires In, Job ID, Action Release – admin force release – industry standard SM12 enqueue/dequeue

**To High Parity – Already High – Minor Additions:**
- Add Lock Modes – lock_mode – E exclusive, X exclusive, S shared – e.g., PO lock E exclusive – only one user can edit, number range lock E exclusive, material lock S shared – for different lock modes
- Add Lock with Argument – lock_argument – e.g., lock PO 4500000001 with argument line 10 – for line-level locking
- Add Deadlock Detection – deadlock detection – e.g., if two users lock each other's objects, detect deadlock and release one – for preventing deadlock
- Add Enqueue Work Process – enqueue work process – e.g., separate process for enqueue – for scalability
- Already high parity – 80% – not much to add

**Own Code:** FELM – already own – alias SM12 – search SM12 leads to FELM

### 2.16 Transaction Rollback/Error Handling – FTRB – NEW OWN CODE – Target 85% – CRITICAL – Currently 30% – Lagging

**Current:** Try/catch in APIs – e.g., GR route – if movement type not found → 400 error – if posting period closed → 400 error – if auto account not found → 400 error – if number range exhausted → 400 error_and_extend – if exchange rate not found → 400 error with reason and suggestion – if lock → 423 Locked – if validation fails → 400 – but no explicit DB transaction rollback with BEGIN/COMMIT/ROLLBACK – each UPDATE is separate – if GR fails after stock ledger but before universal ledger, partial posting possible – no LUW

**To High Parity – CRITICAL:**
- Add DB Transaction with BEGIN/COMMIT/ROLLBACK – for all postings – e.g., GR posts stock ledger + universal ledger + MAP recalc + PO update ELIKZ – all in one transaction – if one fails, rollback all – no partial – use `db.transaction` or `BEGIN` – e.g., `await db.execute(sql`BEGIN`); try { await db.execute(... stock ledger); await db.execute(... universal ledger); await db.execute(... MAP recalc); await db.execute(... PO update); await db.execute(sql`COMMIT`); } catch (e) { await db.execute(sql`ROLLBACK`); throw e; }`
- Add LUW – Logical Unit of Work – e.g., GR LUW includes stock ledger, universal ledger, MAP, PO update – all in one LUW – if any fails, rollback LUW – for consistency
- Add Error Handling with MESSAGE – e.g., error with code, message, suggestion – e.g., `Number range MAT-RAW-01 exhausted – current 19999 > to 19999 – cannot generate – go to Number Ranges and increase to_number to 29999 or create new range MAT-RAW-02 and update assignment – No auto fallback`
- Add BAPI with Rollback – e.g., BAPI for GR with rollback – for external integration
- Add API /api/transaction-rollback – for testing rollback – e.g., POST with fail flag to test rollback

**Own Code:** FTRB – Foundation Transaction Rollback – NEW OWN CODE – alias LUW – search LUW leads to FTRB

### 2.17 Audit Trail for Master and Transactional Changes – FAUD – NEW OWN CODE – Target 85% – CRITICAL – Currently 30% – Lagging

**Current:** Audit log table? We have AALG own IP alias SM20 – Audit Log – /audit/logs – shows system audit log, security events, user activity – but master changes (material create/change, number range change) and transactional changes (GR, PO, etc.) audit trail not fully implemented – we have document flow AFLW but not change docs CDHDR/CDPOS – no WORM-lite – no who changed what when – partially

**To High Parity – CRITICAL for Compliance:**
- Add Change Docs CDHDR/CDPOS – change docs – table fin_change_doc_header – CDHDR – object_type, object_id, change_number, user, timestamp, transaction – e.g., MATERIAL 10001 change 1 by user1 at 2026-09-30 10:00:00 via EMTE
- Add Change Docs Items – table fin_change_doc_item – CDPOS – change_number, field_name, old_value, new_value – e.g., change 1 field description old "Spice" new "Premium Spice", field valuation_class old "3000" new "3001"
- Add WORM-lite – Write Once Read Many – e.g., change docs cannot be deleted or changed – only inserted – for audit compliance
- Add Who Changed What When – for all master and transactional changes – e.g., material create/change, number range change, GR, PO, SO, etc. – with old/new value, user, timestamp
- Add Audit Trail for Financial Postings – e.g., GL account posting, auto account determination, movement type, etc. – with old/new value
- Add API /api/audit-trail – GET list, POST create change doc – with old/new value
- Add UI /audit/change-docs – shows change docs with old/new value, user, timestamp – filter by object_type, object_id, user, date

**Own Code:** FAUD – Foundation Audit Trail – NEW OWN CODE – alias CDHDR/CDPOS/SM20 – search CDHDR/CDPOS/SM20 leads to FAUD

### 2.18 Role/Permission Checks Around Financial Postings – FRPC – NEW OWN CODE – Target 85% – CRITICAL – Currently 35% – Lagging

**Current:** Roles FROC own IP alias PFCG – Role Maintenance – /admin/roles – users FUSC own IP alias SU01 – User Maintenance – /admin/users – roles with permissions – e.g., can create PO, can post GR, can edit number ranges – but financial posting permission checks around OBYC, movement types, posting periods, GL accounts not fully enforced – e.g., any user can post GR 101 even if not authorized for plant 1000 or movement 101 or GL 1400000001 – no authorization object check – partially

**To High Parity – CRITICAL for Large Org with 1000s Employees:**
- Add Authorization Objects – e.g., M_MATE_MAT material type, M_MATE_WGR material group, M_BEST_BSA purchasing document type, M_BEST_WRK plant, F_BKPF_BUK company code, F_BKPF_KOA account type, F_BKPF_KTO GL account, etc. – table fin_authorization_object – code, description – e.g., M_BEST_WRK plant authorization, F_BKPF_BUK company code authorization
- Add Role/Authorization Assignment – table fin_role_authorization – role, authorization_object, field, value – e.g., role PURCHASER with M_BEST_WRK plant 1000, 1100 – can only create PO for plant 1000, 1100 – role ACCOUNTANT with F_BKPF_BUK company code 1000 – can only post for company code 1000
- Add User/Role Assignment – table fin_user_role – user, role – e.g., user1 with role PURCHASER, role ACCOUNTANT
- Add Permission Checks in APIs – in POST /api/gr, check if user authorized for plant 1000, movement 101, company code 1000, GL 1400000001 – via helper checkAuthorization(user, authorization_object, field, value) – e.g., checkAuthorization(user, 'M_BEST_WRK', 'plant', '1000') – if not authorized → 403 Forbidden with reason "User not authorized for plant 1000 – need role with M_BEST_WRK plant 1000"
- Add Posting Period Authorization – check if user authorized to open/close posting periods – e.g., only users with role POSTING_PERIOD_ADMIN can open/close periods via FPPE
- Add Number Range Authorization – check if user authorized to edit number ranges – e.g., only users with role NUMBER_RANGE_ADMIN can edit FNRC
- Add GL Account Authorization – check if user authorized to post to GL account – e.g., only users with role GL_POSTING with F_BKPF_KTO GL 1400000001 can post to GL 1400000001
- Add API /api/authorizations – GET list, POST create authorization – with role, object, field, value
- Add UI /admin/authorizations – shows authorizations with role, object, field, value – for admin

**Own Code:** FRPC – Foundation Role/Permission Checks – NEW OWN CODE – alias PFCG/SU01 – search PFCG/SU01 leads to FRPC

---

## 3. Implementation Order – Prioritized

**Phase 1 – Critical Lagging – For Large Org – Immediate:**

1. **FTRB – Transaction Rollback/Error Handling – 30% → 85% – CRITICAL** – Add DB transaction BEGIN/COMMIT/ROLLBACK for all postings – GR, IV, billing, payroll – no partial – LUW
2. **FAUD – Audit Trail – 30% → 85% – CRITICAL for Compliance** – Add CDHDR/CDPOS change docs with old/new value, user, timestamp, WORM-lite
3. **FRPC – Role/Permission Checks – 35% → 85% – CRITICAL for 1000s Employees** – Add authorization objects for plant, movement, company code, GL, posting period, number range – checks in APIs – 403 if not authorized
4. **FCRL – Company Relationships – 40% → 85%** – Add business area, segment, sales org, purchasing org, controlling area, inter-company, assignments enforcement
5. **FUNL – Universal Ledger – 40% → 85%** – Add 400+ fields, foreign/group currency, quantity/UOM, batch, business area, segment, functional area, partner, tax, doc number/line, extension fields, CDS views
6. **FEXC – Exchange Rates Integration – 50% → 85%** – Add rate types M/B/G, spread, translation ratio, direct/indirect, integration into GR/billing/payment with KDM, daily feed

**Phase 2 – Moderate Lagging – To High Parity:**

7. **FSTL – Stock Ledger – 50% → 85%** – Add actual costing, price history, total stock/value, price control S/V, material ledger 3 currencies, batch/special stock
8. **FDFL – Document Flow – 50% → 85%** – Add quantity/value flow, status, ELIKZ, icons, links, more doc types
9. **FFYC – Fiscal Calendar – 60% → 85%** – Add year-dependent periods, special periods 13-16, factory calendar, period texts
10. **FPPE/FPPC – Posting Periods – 60% → 85%** – Add account type specific A/D/K/M/S, from/to account range, authorization group, special periods
11. **FCOA – Chart of Accounts – 60% → 85%** – Add chart type, account groups, retained earnings, FSSV assignment, length, group chart
12. **FFSV/FFSG – Field Status – 70% → 85%** – Add posting key field status, GL account group assignment, variant assignment to company code, more fields 40+
13. **FMTM – Movement Types – 65% → 85%** – Add all movement types 101/102/122/161/261/262/309/551/601/602/701/702 plus 20-30 common, account grouping, valuation grouping, field selection, reason, special stock
14. **FAUC – Auto Account – 65% → 85%** – Add all transaction keys BSX/WRX/GBB/PRD/BSV/KDM/KOFI/KOFK + GBB groupings VAX/VAY/VBR/VBO/VKA, valuation grouping, account grouping detailed, split valuation

**Phase 3 – Already High Parity – Minor Additions to Reach 90%+:**

15. **FNRC – Number Ranges – 90% – Already High – Minor: year-dependent, external, buffer, groups**
16. **FUNL Document Numbering – 90% – Already High – Same as number ranges**
17. **FBJM – Background Jobs – 85% – Already High + Better UX – Minor: cron, dependencies, spool, logs, variant**
18. **FELM – Enqueue Locks – 80% – Already High – Minor: lock modes E/X/S, lock argument, deadlock detection**

---

## 4. Own Codes – Legal-Safe – All 18 Functions

| Function | Own Code | SAP Alias | Search SAP → Own |
|----------|----------|-----------|------------------|
| Company Relationships | FCRL | OX02, OX10, OX08, OX16, OB62, OB37, OBBO, OBC4 | Search OX02 → FCRL |
| Fiscal Calendar | FFYC | OB29 | Search OB29 → FFYC |
| Posting Periods | FPPE/FPPC | OB52/OBBO | Search OB52/OBBO → FPPE/FPPC |
| Chart of Accounts | FCOA | OB13 | Search OB13 → FCOA |
| Field Status Variant | FFSV | OBC4, FSSV | Search OBC4/FSSV → FFSV |
| Field Status Groups | FFSG | OBC5 | Search OBC5 → FFSG |
| Number Ranges | FNRC | FBN1, SNRO | Search FBN1/SNRO → FNRC |
| Movement Types | FMTM | OMJJ | Search OMJJ → FMTM |
| Auto Account | FAUC | OBYC | Search OBYC → FAUC |
| Exchange Rates | FEXC | OB08 | Search OB08 → FEXC |
| Universal Ledger | FUNL | ACDOCA, FAGL | Search ACDOCA/FAGL → FUNL |
| Document Numbering | FNRC | FBN1 | Search FBN1 → FNRC |
| Stock Ledger | FSTL | Material Ledger | Search Material Ledger → FSTL |
| Document Flow | FDFL | VBFA, ALB, AFLW | Search VBFA/ALB → FDFL |
| Background Jobs | FBJM | SM37 | Search SM37 → FBJM |
| Enqueue Locks | FELM | SM12 | Search SM12 → FELM |
| Transaction Rollback | FTRB | LUW | Search LUW → FTRB |
| Audit Trail | FAUD | CDHDR, CDPOS, SM20 | Search CDHDR/CDPOS/SM20 → FAUD |
| Role/Permission | FRPC | PFCG, SU01 | Search PFCG/SU01 → FRPC |

**All own IP primary, SAP codes only as searchable aliases – function is destination, code is helper – searching ME21N redirects to background function Create Purchase Order – ME21N is not target, function is target – per user instruction UI without SAP/industry standard words, commits use industry standard term – legal-safe own IP**

---

## 5. Next Steps

1. **Start with Phase 1 Critical:** FTRB transaction rollback, FAUD audit trail, FRPC role/permission, FCRL company relationships, FUNL universal ledger, FEXC exchange rates integration
2. **Implement DB transaction helper** – `src/shared/kernel/db/transaction.ts` – with BEGIN/COMMIT/ROLLBACK
3. **Implement audit trail tables** – fin_change_doc_header (CDHDR), fin_change_doc_item (CDPOS) – with old/new value, user, timestamp, WORM-lite
4. **Implement authorization objects** – fin_authorization_object, fin_role_authorization, fin_user_role – with checks in APIs
5. **Implement company relationships** – business area, segment, sales org, purchasing org, controlling area, inter-company
6. **Implement universal ledger with 400+ fields**
7. **Integrate exchange rates into postings with KDM**
8. **Then Phase 2 moderate lagging to high parity**
9. **Then Phase 3 already high parity minor additions to 90%+**
10. **Commit each with industry standard term, push to GitHub with PAT from .env.local – .env.local ignored via .gitignore – safe**

**Goal: 100% parity or at least high parity (80-90%+) in all 18 sectors with own codes, SAP codes only as aliases – suitable for large organisation multi-sector multi-plant multi-product + services + 1000s employees – industry professional use**

---

**Report Generated:** 2026-09-30 – Roadmap folder – high_parity_implementation_plan.md
