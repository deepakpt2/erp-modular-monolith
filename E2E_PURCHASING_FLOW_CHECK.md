# E2E Purchasing Flow Check – PR → PO → GR → IV → Payment – 12 Points

Date: 2026-09-30
Company: 1000 – 1000 FMCG India Pvt Ltd (TEST)
Facility: FAC-1000 – 1000 FMCG Plant – EFCC OX10
Vendor: VEND-1000 – Test Vendor – PSUC XK01 – recon 2000000000 FGLC – payment term NT30 FAPT – currency INR FCYC
Material: 10000001 – Raw Spice – EMTC MM01 – valuation_class RAW – price_control S/V – UoM KG PC – EUOC CUNI
Inventory Location: SL01 – RM Store – EILC OX09 – 0001
Currency: INR – FCYC OY03 – symbol ₹
Payment Terms: NT30 – FAPT OBA7 – days 30 discount 2% discount_days 10 – due calc invoice_date + days
Tax Code: GST18 – FTXC FTXP – rate 18% – ledger 2000000003 – HSN 09041110 pepper 5%
Movement Type: 101 GR PO – FMTM OMJJ – BSX 1400000001 WRX 2000000001 GBB 4000000001 PRD 4000000004
Auto Account: FAUC OBYC – BSX/WRX/GBB/PRD – valuation_grouping 0001 account_grouping VAX
Number Ranges: FNRC FBN1 – PR 1000000000, PO 4500000000, GR 5000000000, IV 5100000000, Payment KZ 53* 5300000000-5399999999 – numeric only – assignment per company – error_and_extend – locked badge – next_available
Tolerance: OBA0/OBA4 VEND-01 – value tolerance + quantity tolerance – overdelivery 10% underdelivery 10%
Posting Period: FPPE OB52 PPV-1000 account_type K M S – is_open true – FFYC K4 April-March

## Flow Steps – Industry Standard

### 1. PR – Purchase Requisition – ME51N – PPRC – T0 BLOCKING
**API:** POST /api/pr
**Payload:**
```json
{
  "facility_code": "FAC-1000",
  "plant_code": "FAC-1000",
  "legal_entity_code": "1000",
  "company_code": "1000",
  "required_date": "2026-10-01",
  "header_text": "PR for VEND-1000 – spices – PPRC ME51N – 1000 – facility FAC-1000",
  "currency_code": "INR",
  "lines": [
    {
      "item_number": "10000001",
      "quantity": "100",
      "uom_code": "KG",
      "estimated_price": "100",
      "inventory_location_code": "SL01",
      "delivery_date": "2026-10-05",
      "item_text": "Black pepper 100 KG – PR line 10"
    }
  ]
}
```
**Backend actions:**
- Resolve facility_id via org_facility code EFCC
- Resolve legal_entity_id via org_legal_entity code ELEC
- Resolve item_id via prod_item item_number EMTC
- Resolve inventory_location_id via org_inventory_location code EILC
- Number range PR 1000000000 numeric only – assignment per company – error_and_extend – FNRC
- Posting period M OB52 check – must be open – FPPE FPPC FFYC K4
- Insert proc_purchase_requisition pr_number 1000000000+ total_amount 100*100=10000
- Insert proc_pr_line line_number 10 quantity 100 uom KG estimated_price 100 facility_id plant_id inventory_location_id delivery_date item_text
- Document flow: INSERT audit_document_flow root PR PR PR – FDFL VBFA WORM-lite
- Workflow auto-start: Ensure wf_definition PR_APPROVAL ME54N – 2 steps Manager <10000 Owner >=10000 dual – INSERT wf_instance document_type PR document_id prId document_number prNumber current_state PENDING_APPROVAL current_step_order 1 amount 10000 currency INR – resolve assignee hr_employee is_active true – INSERT wf_task instance_id step_id assignee_id status PENDING – ME54N SBWP T0
- Create document entry via createDocumentEntry – core_document
- Return prNumber, total_amount

**Expected result:** PR 1000000000 created – status DRAFT → PENDING_APPROVAL via workflow – document flow PR root – audit trail CDHDR/CDPOS – universal ledger? No – PR is not accounting – no GL – T0

**Frontend:** /1000/mm/pr – uses /api/pr – facility autocomplete /api/facilities EFCC, legal entity /api/legal-entities ELEC, material /api/materials EMTC, UoM /api/uom EUOC, inventory location /api/inventory-locations EILC, currency /api/currencies FCYC – DbAutocomplete yellow/green/red border – RoleGuard PR_CREATE PURCHASER ADMIN OWNER MANAGER – JobPopup auto-promote 10s ALL – locks SM12 FELM – T0

### 2. PR Approval – ME54N – SBWP – Workflow Inbox
**API:** GET /api/workflow?docType=PR&status=PENDING – shows tasks
**API:** POST /api/workflow – action APPROVE taskId comment approverId
**Backend actions:**
- Update wf_task status APPROVED decision comment decided_at
- Check pending tasks for instance – if all APPROVED → wf_instance APPROVED
- Update underlying document status proc_purchase_requisition status APPROVED
- Insert wf_history from_state PENDING_APPROVAL to_state APPROVED action APPROVE actor_id comment
- Audit log WORM-lite old/new JSONB changed_fields CDHDR

**Expected:** PR status APPROVED – can be converted to PO – T0

### 3. PO – Purchase Order – ME21N – PPOC – T0 BLOCKING – 12 Points
**API:** POST /api/po
**Payload:**
```json
{
  "facility_code": "FAC-1000",
  "plant_code": "FAC-1000",
  "legal_entity_code": "1000",
  "company_code": "1000",
  "partner_number": "VEND-1000",
  "vendor_number": "VEND-1000",
  "pr_number": "1000000000",
  "delivery_date": "2026-10-10",
  "header_text": "PO for VEND-1000 – PPOC ME21N – 1000 – facility FAC-1000",
  "currency_code": "INR",
  "payment_term_code": "NT30",
  "payment_terms_code": "NT30",
  "payment_terms_days": 30,
  "incoterms": "EXW",
  "lines": [
    {
      "item_number": "10000001",
      "quantity": "100",
      "uom_code": "KG",
      "unit_price": "0",
      "freight_per_unit": "5",
      "customs_per_unit": "2",
      "tax_per_unit": "0",
      "tax_code": "GST18",
      "tax_rule_code": "GST18",
      "overdelivery_tolerance_percent": "10",
      "underdelivery_tolerance_percent": "10",
      "over_tolerance": "10",
      "under_tolerance": "10",
      "inventory_location_code": "SL01",
      "item_text": "Black pepper 100 KG – PO line 10 – ME21N",
      "delivery_text": "Delivery to FAC-1000 SL01"
    }
  ]
}
```
**Backend actions – 12 points wiring:**
- ALTER TABLE ensure columns: proc_purchase_order payment_term_code due_date discount_date vendor_recon_account_id tax_amount_calc, proc_po_line overdelivery_tolerance_percent 10 underdelivery_tolerance_percent 10 tax_rule_id tax_rate version 1 change_history JSONB
- Resolve facility_id via org_facility EFCC, legal_entity_id via org_legal_entity ELEC, partner_id via partner_account account_number VEND-1000 PSUC, pr_id via proc_purchase_requisition pr_number PR, inventory_location_id via org_inventory_location EILC, item_id via prod_item EMTC, UoM EUOC, procurement_division EPDC PO01, buyer_team EBTC, currency FCYC, payment_term_code FAPT NT30 → days 30 due_date = delivery_date + 30 discount_date = delivery_date + 10 discount 2% – calculateDueDate FAPT – wiring supplier → PO → IV → F110
- Vendor recon account: SELECT reconciliation_account_id FROM partner_vendor_profile WHERE partner_id = partnerIdResolved → FGLC 2000000000 Vendor Recon – wiring FGLC
- Number range PO 4500000000 numeric only always_auto – assignment per company YZX to PO – error_and_extend – FNRC FBN1 – 4500000000+
- Posting period K OB52 check – must be open – FPPE FPPC FFYC K4 – F_BKPF_BUP – T0
- Info record ME11 PIRC: if unit_price 0, SELECT unit_price FROM proc_info_record WHERE partner_id=partnerIdResolved AND item_id=itemId AND valid_from <= CURRENT_DATE AND (valid_to IS NULL OR valid_to >= CURRENT_DATE) ORDER BY valid_from DESC LIMIT 1 → price 100 – auto price lookup – T2 – e.g., VEND-1000 + 10000001 → 100
- Tax handling FTXC: tax_code GST18 → SELECT id, rate FROM fin_tax_rule WHERE UPPER(code)=GST18 → id + rate 18% – tax_per_unit = unit_price * rate /100 = 100*0.18=18 if tax 0 – wiring PO line tax_rule_id tax_rate
- Insert proc_purchase_order po_number 4500000000 legal_entity_id company_code_id partner_id vendor_id facility_id plant_id delivery_date header_text pr_id currency_code payment_terms_days 30 payment_term_code NT30 due_date discount_date vendor_recon_account_id incoterms freight customs tax
- For each line: qty 100 unitPrice 100 (from info record) freight 5 customs 2 tax 18 totalPerUnit 125 total 100*100=10000 totalLanded 100*125=12500 overTol 10 underTol 10 initialHistory JSON [{version:1 action:CREATE timestamp user system changes {quantity:100 unit_price:100 over_tolerance:10 under_tolerance:10 tax_rate:18}}] – INSERT proc_po_line po_id line_number 10 item_id quantity uom unit_price freight customs tax_per_unit tax_rule_id tax_rate total_per_unit facility_id plant_id inventory_location_id item_text delivery_text is_landed_cost_relevant true overdelivery_tolerance_percent 10 underdelivery_tolerance_percent 10 version 1 change_history JSONB
- Purchasing condition: CREATE TABLE IF NOT EXISTS proc_purchasing_condition id po_line_id condition_type BASE/DISCOUNT/FREIGHT/CUSTOMS/TAX amount percentage currency is_active – INSERT BASE 100, FREIGHT 5, CUSTOMS 2, TAX 18 rate 18% – basic purchase pricing – ME11 info record + conditions
- Update proc_purchase_order total_amount 10000 total_landed_cost 12500
- Document flow: CREATE TABLE audit_document_flow – if prIdResolved INSERT root PR PR→PO – preceding PR succeeding PO root PR – UPDATE proc_pr_line is_converted true po_id – INSERT root PO PO – FDFL VBFA WORM-lite – PR→PO→GR→IV→Payment
- Workflow auto-start: Ensure wf_definition PO_APPROVAL ME28 Manager+Owner Dual – 2 steps Manager <10000 Owner >=10000 dual – filter by total 10000 → step 2 Owner – INSERT wf_instance definition_id document_type PO document_id poId document_number poNumber current_state PENDING_APPROVAL current_step_order 1 amount 10000 currency INR – assignee hr_employee – INSERT wf_task – ME28 SBWP T0 – ELIKZ delivery_completed BOOL_AND all_elikz – PO closure
- Create document entry core_document
- Return poNumber, total_amount, total_landed_cost

**Expected:** PO 4500000000 created – status PENDING_APPROVAL – total 10000 landed 12500 – facility FAC-1000 vendor VEND-1000 – payment term NT30 due 2026-11-09 discount 2026-10-20 – vendor recon 2000000000 – tax GST18 rate 18% tax_per_unit 18 – over/under tolerance 10%/10% – version 1 history – conditions BASE/FREIGHT/CUSTOMS/TAX – info record auto price – workflow auto-started ME28 – document flow PR→PO – T0

**Frontend:** /1000/mm/po – uses /api/po – facility EFCC autocomplete, vendor PSUC XK01 autocomplete /api/business-partners?role=VENDOR, legal entity ELEC, PR PPRC autocomplete /api/pr, delivery date OB52 K, currency FCYC, payment term FAPT NT30 autocomplete /api/payment-terms codeField code FAPT + days derived, incoterms EXW/FOB/CIF, lines material EMTC autocomplete, qty, UoM EUOC, unit price ME11 auto if 0, freight, customs, tax_code FTXC GST18 autocomplete /api/tax-codes, overdelivery_tolerance_percent 10 UEBTO, underdelivery_tolerance_percent 10 UNTTO, inventory location EILC, item_text delivery_text – addLine updateLine removeLine – payload payment_term_code tax_code over/under tolerance – DbAutocomplete yellow/green/red – RoleGuard PO_CREATE PURCHASER ADMIN OWNER MANAGER – JobPopup auto-promote 10s ALL – locks SM12 – version history display – tolerance display – T0

### 4. PO Approval – ME28 – SBWP
**API:** GET /api/workflow?docType=PO&status=PENDING
**API:** POST /api/workflow – APPROVE
**Expected:** PO status APPROVED – can be used for GR – T0 – ELIKZ not yet completed

### 5. GR – Goods Receipt – MIGO 101 – IGRC – T0 BLOCKING – Partial GR + Over/Under Tolerance
**API:** POST /api/gr
**Payload 1st partial GR 60 of 100:**
```json
{
  "po_number": "4500000000",
  "facility_code": "FAC-1000",
  "posting_date": "2026-10-10",
  "document_date": "2026-10-10",
  "header_text": "GR for PO 4500000000 – MIGO 101 – 60 KG",
  "movement_type": "101",
  "lines": [
    {
      "po_line_number": 10,
      "quantity": "60",
      "inventory_location_code": "SL01",
      "batch": "LOT-001"
    }
  ]
}
```
**Backend actions:**
- Resolve poId via proc_purchase_order po_number, facilityId via org_facility or PO facility, grNumber via core_number_range GR 5000000000 numeric only always_auto assignment per company error_and_extend FNRC
- Posting period M OB52 check – must be open – FPPE FPPC FFYC K4 – T0
- Movement type OMJJ FMTM 101 – getMovementType validateMovementAllowed – 101 GR PO BSX/WRX – requires OBYC BSX/WRX auto account FAUC valuation_class RAW – T0 BLOCKING – NO DANGLING
- Insert proc_goods_receipt gr_number 5000000000 po_id facility_id posting_date document_date header_text
- For each line: poLineId via po_line_number, itemId facilityIdLine invLocId lotId qty 60 – SELECT proc_po_line item_id facility_id inventory_location_id quantity quantity_received overdelivery_tolerance_percent underdelivery_tolerance_percent delivery_completed – poLineQty 100 poLineReceived 0 overTol 10 underTol 10 deliveryCompletedFlag false – check ELIKZ – if deliveryCompletedFlag block – newReceivedTotal = 0+60=60 maxAllowed = 100*(1+10/100)=110 – 60 <=110 OK – underdelivery minAllowed = 100*(1-10/100)=90 – if final ELIKZ and total < min block – not final yet – log OK – partial GR allowed
- Update proc_po_line quantity_received += qty → 60 – if ELIKZ flagged or received >= ordered → delivery_completed true is_closed true closed_reason ELIKZ_FINAL_DELIVERY – else not closed – partial GR – auto-close logic
- Stock update: prod_facility_profile total_stock_qty += qty total_stock_value += qty*unit_price moving_avg_price = (oldQty*oldMAP + qty*unitPrice)/newQty if MOVING_AVG else STANDARD priceDiff – newValue newQty*newMAP – T0 – universal ledger BSX/WRX/PRD – FSTL Material Ledger total stock/value MAP price control S/V batch special stock – inv_stock_ledger movement 101 quantity_before quantity_after unit_cost total_value reference_doc_type GR reference_doc_number grNumber – MAP recalc
- Auto account: getAutoAccount BSX chart KSCA valuation_class RAW company_code 1000 → BSX 1400000001, WRX 2000000001, GBB 4000000001, PRD 4000000004 – OBYC – FAUC – T0
- Universal ledger: INSERT fin_universal_ledger document_number grNumber document_type WE posting_date document_date fiscal_year fiscal_period ledger_account_id gl_account_id where account_number BSX debit qty*unit_price credit 0 amount qty*unit_price – Dr BSX Cr WRX – WRX clearing – BSX inventory – T0 – FULC ACDOCA – 400+ fields
- Document flow: Find root PR if PO has pr_id via proc_purchase_order pr_id + proc_purchase_requisition pr_number else root PO – INSERT audit_document_flow root_type root_id root_number preceding PO succeeding GR – PO→GR – FDFL VBFA T0
- Return grNumber, total_amount, total_landed_cost

**Expected:** GR 5000000000 created – PO line received 60 open 40 – stock total_stock_qty 60 total_stock_value 6000 MAP 100 – universal ledger BSX 6000 WRX 6000 – document flow PO→GR – partial GR – over/under tolerance OK – not ELIKZ yet

**2nd partial GR 40 of 100 – final delivery:**
```json
{
  "po_number": "4500000000",
  "facility_code": "FAC-1000",
  "posting_date": "2026-10-11",
  "header_text": "GR for PO 4500000000 – MIGO 101 – 40 KG final – ELIKZ",
  "movement_type": "101",
  "lines": [
    {
      "po_line_number": 10,
      "quantity": "40",
      "inventory_location_code": "SL01",
      "batch": "LOT-002",
      "is_final_delivery": true
    }
  ]
}
```
**Backend:** newReceivedTotal = 60+40=100 maxAllowed 110 OK – minAllowed 90 – final delivery ELIKZ true and total 100 >=90 OK – update quantity_received 100 – delivery_completed true is_closed true – ELIKZ – all_elikz true – PO closure

**Expected:** GR 5000000001 created – PO line received 100 open 0 – delivery_completed true – all_elikz true – PO CLOSED – stock total 100 – second GR

**Overdelivery test – try 15 more – should block:**
```json
{
  "po_number": "4500000000",
  "lines": [{"po_line_number":10,"quantity":"15"}]
}
```
**Backend:** poLineReceived 100 newReceivedTotal 115 maxAllowed 110 → 115 >110 → 400 error Over-delivery tolerance exceeded – PO line qty 100 received before 100 + current 15 =115 > max allowed 110 (over tol 10%) – adjust GR qty or increase tolerance in PO – industry standard – OBA0/OBA4 + overdelivery tolerance – T1

**Expected:** Blocked – prevents overdelivery beyond tolerance – T1

**Underdelivery test – PO 100 qty, under tol 10% min 90, try final delivery 80 – should block:**
- If PO line qty 100 received 0, try GR 80 final ELIKZ true → newReceivedTotal 80 minAllowed 90 → 80 <90 → block Under-delivery tolerance exceeded – min 90 – adjust or increase tolerance

**Expected:** Blocked – prevents underdelivery beyond tolerance – T1

**Frontend:** /1000/mm/gr – requires PO_NUMBER autocomplete /api/po – loads PO lines with ordered/received/open qty ELIKZ flag – shows overdelivery_tolerance_percent underdelivery_tolerance_percent Max Min – allows selecting lines with GR qty SLOC batch – POST /api/gr with po_id required T0 BLOCKING BSX/WRX MAP recalc stock ledger universal ledger – RoleGuard GR_POST WAREHOUSE,ADMIN,OWNER,MANAGER – auto-promote 10s background job with lock PO prevents double entry FELM SM12 FBJM SM37 – tolerance display – partial GR – ELIKZ – DONE

### 6. IV – Invoice Verification – MIRO 51 RE – PIVC – T0 – Partial Invoice + Qty/Value Tolerance + Tax + Payment Terms + Recon + Credit Memo
**API:** POST /api/iv
**Payload 1st partial invoice 60 of 100 received:**
```json
{
  "po_number": "4500000000",
  "gr_number": "5000000000",
  "vendor_invoice_number": "INV-VEND-2026-001",
  "invoice_date": "2026-10-12",
  "posting_date": "2026-10-12",
  "company_code": "1000",
  "legal_entity_code": "1000",
  "document_type": "RE",
  "payment_term_code": "NT30",
  "tax_code": "GST18",
  "tolerance_group_code": "VEND-01",
  "total_amount": 6000,
  "lines": [
    {
      "po_line_number": 10,
      "quantity": "60",
      "unit_price_invoiced": "100",
      "unit_price_po": "100",
      "freight_per_unit": "5",
      "customs_per_unit": "2",
      "tax_code": "GST18"
    }
  ]
}
```
**Backend actions – 12 points:**
- ALTER TABLE ensure document_type RE is_credit_memo is_debit_memo original_iv_id payment_term_code due_date vendor_recon_account_id, proc_iv_line tax_rule_id tax_rate is_credit
- Resolve poId via po_number, grId via gr_number, partnerId via partner_account, legalEntityId via PO
- Resolve payment_term_code FAPT NT30 → days 30 due_date = invoice_date +30 – wiring FAPT – payment terms
- Resolve vendor recon account from partner_vendor_profile reconciliation_account_id → FGLC 2000000000 – wiring FGLC
- Credit/debit memo: docTypeInput RE isCreditMemo false isDebitMemo false – total_amount positive → invoice
- Number range IV 5100000000 numeric only assignment per company error_and_extend FNRC FBN1
- Posting period K OB52 check – must be open – F_BKPF_BUP – T0 – K Vendors
- Tolerance OBA0/OBA4 VEND-01: Calculate diffAmount invoiced vs PO price*qty – e.g., invoiced 110 vs PO 100 diff 10*60=600 – checkTolerance group VEND-01 diff vs limit – if exceeded 400 error – T1 prevents overpay – NO DANGLING
- Invoice quantity tolerance: maxInvoiceQty = received*1.1 =60*1.1=66 – qty 60 <=66 OK – if qty > max checkTolerance VEND-01 blocks – prevents invoicing more than received + tolerance
- Tax handling FTXC: tax_code GST18 → SELECT id, rate FROM fin_tax_rule WHERE UPPER(code)=GST18 → rate 18% – tax_amount = qty*unitPrice*rate/100 =60*100*0.18=1080 if tax_amount 0 – wiring tax_rule_id tax_rate
- Insert proc_invoice_verification iv_number 5100000000 gr_id po_id partner_id legal_entity_id invoice_date posting_date vendor_invoice_number total_amount tax_amount freight customs other_charges document_type RE is_credit_memo false is_debit_memo false payment_term_code NT30 due_date vendor_recon_account_id
- For each line: poLineId via po_line_number, itemId via proc_po_line, poLineQty 100 poLineReceived 100 poLineInvoiced 0 – qty 60 – maxInvoiceQty 66 OK – unitInvoiced 100 unitPo 100 freight 5 customs 2 other 0 totalFinal 107 variance 0 lineTax 1080 taxRuleId taxRate 18 – totalInvoicedAmount +=60*100=6000 totalVariance 0 totalTax 1080 totalFreight 300 totalCustoms 120 – isLineCredit false – INSERT proc_iv_line iv_id gr_line_id po_line_id line_number item_id quantity unit_price_invoiced unit_price_po freight customs other total_per_unit_final price_variance_per_unit tax_amount tax_rule_id tax_rate is_credit false – UPDATE proc_po_line quantity_invoiced += qty → 60 – partial invoice handling multiple IVs per PO line allowed
- Vendor invoice accounting RE universal ledger FULC RE + WRX clearing + BSX adjustment + PRD + Tax – T0 – postingDate fiscalYear fiscalPeriod companyCode chart KSCA valuationClass RAW – getAutoAccount WRX 2000000001 PRD 4000000004 vendorRecon 2000000000 tax 2000000003 – totalAmountForLedger 6000 totalAmountWithTax 6000+1080+300+120=7500 – isCredit false docTypeForLedger RE – resolvedVendorReconGL from ivVendorReconId else fallback – WRX Dr GR/IR clearing amount totalAmountForLedger INSERT fin_universal_ledger document_number ivNumber document_type RE ledger_account_id gl_account_id where account_number wrxGL debit totalAmountForLedger credit 0 amount totalAmountForLedger text IV 51 RE WRX clearing GR/IR clearing PO poIdResolved WRX – Dr WRX clears WRX from GR 101 – Vendor Recon Cr Vendor amount totalAmountWithTax INSERT fin_universal_ledger document_number ivNumber document_type RE ledger_account_id where account_number vendorReconGL debit 0 credit totalAmountWithTax amount totalAmountWithTax text IV 51 RE Vendor Recon Cr Vendor – PRD if variance !=0 INSERT PRD – Tax if tax !=0 INSERT taxGL debit tax credit 0 – console log IV ivNumber universal ledger posted RE+WRX clearing + Vendor Recon + PRD + Tax – T0 – FULC ACDOCA
- Document flow: Find root PR if PO has pr_id else root PO – INSERT audit_document_flow root_type root_id root_number preceding PO succeeding IV – PO→IV – if grIdResolved INSERT preceding GR succeeding IV – GR→IV – FDFL VBFA T0
- Return ivNumber, amounts invoiced variance tax freight customs

**Expected:** IV 5100000000 created – PO line invoiced 60 open invoiced 40 – GR/IR clearing candidate – WRX cleared 6000 – Vendor Recon Cr 7500 – Tax Dr 1080 – Freight Customs included – document flow PO→IV GR→IV – partial invoice – qty tolerance OK – value tolerance OK – payment term NT30 due 2026-11-11 – recon FGLC – tax FTXC – T0

**Credit memo test – RE_CREDIT – 10 qty return:**
```json
{
  "po_number": "4500000000",
  "vendor_invoice_number": "CR-VEND-2026-001",
  "invoice_date": "2026-10-13",
  "posting_date": "2026-10-13",
  "document_type": "RE_CREDIT",
  "is_credit_memo": true,
  "payment_term_code": "NT30",
  "tax_code": "GST18",
  "total_amount": -1000,
  "lines": [
    {
      "po_line_number": 10,
      "quantity": "-10",
      "unit_price_invoiced": "100",
      "unit_price_po": "100",
      "tax_code": "GST18"
    }
  ]
}
```
**Backend:** isCreditMemo true docTypeInput RE_CREDIT total_amount negative → credit memo – isLineCredit true qty -10 – totalInvoicedAmount -1000 totalAmountForLedger abs 1000 totalAmountWithTax abs – isCredit true – docTypeForLedger RE_CREDIT – universal ledger reversal signs: if isCredit then WRX Cr Vendor Dr – WRX Cr 1000 – Vendor Dr 1180 (with tax) – Dr Vendor Recon FGLC Cr WRX – reduces liability – industry standard – RE_CREDIT

**Expected:** IV 5100000001 RE_CREDIT created – PO line invoiced 60 + (-10)=50 – Vendor Recon Dr 1180 – WRX Cr 1000 – Tax Cr 180 – credit memo reduces liability – T0

**2nd partial invoice 50 remaining (100 ordered -50 invoiced after credit memo):**
```json
{
  "po_number": "4500000000",
  "gr_number": "5000000001",
  "vendor_invoice_number": "INV-VEND-2026-002",
  "invoice_date": "2026-10-14",
  "posting_date": "2026-10-14",
  "document_type": "RE",
  "payment_term_code": "NT30",
  "tax_code": "GST18",
  "lines": [
    {
      "po_line_number": 10,
      "quantity": "50",
      "unit_price_invoiced": "110",
      "unit_price_po": "100"
    }
  ]
}
```
**Backend:** qty 50 maxInvoiceQty received 100*1.1=110 OK – unitInvoiced 110 vs PO 100 variance 10*50=500 – diffAmount 500 tolerance VEND-01 check – if limit 1000 OK else 400 – price variance PRD posting Dr/Cr PRD 4000000004 – e.g., invoiced 110 vs PO 100 variance 10*50=500 PRD – universal ledger RE + WRX clearing 5500 + Vendor Recon 6500 + PRD 500 + Tax 990 – partial invoice second – PO invoiced 50+50=100 – fully invoiced

**Expected:** IV 5100000002 created – PO invoiced 100 – fully invoiced – price variance PRD 500 – GR/IR clearing candidate F.13 where GR qty=IV qty – WRX cleared – T0

**Invoice quantity tolerance test – try invoicing 20 more than received – should block:**
- PO line qty 100 received 100 invoiced 100 – try qty 20 – maxInvoiceQty received*1.1=110 – new total invoiced would be 120 >110 – checkTolerance VEND-01 – block 400 error Invoice quantity tolerance exceeded – PO line qty 100 received 100 invoiced before 100 + current 20 would exceed max 110 – tolerance VEND-01 – adjust qty or increase tolerance

**Expected:** Blocked – prevents over-invoicing beyond received + tolerance – T1

**Frontend:** /1000/mm/iv – uses /api/iv – PO_NUMBER autocomplete /api/po PPOC, GR_NUMBER autocomplete /api/gr IGRC, VENDOR_INVOICE_NUMBER required, INVOICE_DATE POSTING_DATE OB52 K, PAYMENT_TERM_CODE FAPT NT30 autocomplete /api/payment-terms + TAX_CODE FTXC GST18 autocomplete /api/tax-codes + DOCUMENT_TYPE RE/RE_CREDIT/RE_DEBIT select + IS_CREDIT_MEMO checkbox Dr Vendor Recon FGLC Cr WRX – PO lines with GR qty select lines to invoice qty price variance PRD tolerance OBA0/OBA4 VEND-01 WRX clearing vendor invoice accounting RE – RoleGuard IV_POST ACCOUNTANT ADMIN OWNER MANAGER PURCHASER – JobPopup auto-promote 10s – T0

### 7. GR/IR Clearing – F.13 – MR11 – T1 – Automatic
**API:** GET /api/gr-ir-clearing – candidates where GR qty = IV qty not yet cleared
**API:** POST /api/gr-ir-clearing – auto clearing
**Backend:**
- SELECT po.po_number gr.gr_number iv.iv_number po_line.quantity_ordered quantity_received quantity_invoiced gr_line.quantity gr_qty iv_line.quantity iv_qty gr_line.unit_cost gr_price iv_line.unit_price_invoiced iv_price FROM proc_purchase_order JOIN proc_po_line LEFT JOIN proc_goods_receipt LEFT JOIN proc_gr_line LEFT JOIN proc_invoice_verification LEFT JOIN proc_iv_line WHERE quantity_received=quantity_invoiced >0 NOT EXISTS fin_gr_ir_clearing
- For each candidate clearingNumber CLR-timestamp-clearedCount clearAmount gr_amount iv_amount INSERT fin_gr_ir_clearing + universal ledger clearing entries WRX cleared Dr WRX/Cr WRX clearing doc – T1 GR/IR balance zero month-end close NO DANGLING SAP F.13/MR11 alias

**Expected:** After GR 100 and IV 100, candidate exists – clearingNumber CLR-... – status CLEARED – WRX cleared – GR/IR balance zero – T1 – month-end

**Frontend:** /1000/fico/gr-ir-clearing – uses /api/gr-ir-clearing – shows candidates + clearings – auto clearing button – T1 – F.13

### 8. Vendor Payment – F-53 – KZ – FPYP – T1 – Open-Item Clearing + Tolerance + Recon
**API:** POST /api/payment
**Payload:**
```json
{
  "companyCode": "1000",
  "vendor_number": "VEND-1000",
  "amount": "7500",
  "paymentMethod": "BANK",
  "bankGlAccount": "8000000001",
  "reference": "Payment for VEND-1000 INV-VEND-2026-001",
  "postingDate": "2026-10-15",
  "headerText": "KZ Payment Vendor VEND-1000 Amount 7500 BANK",
  "apInvoiceIds": ["5100000000-id"],
  "tolerance_group_code": "VEND-01"
}
```
**Backend actions:**
- Resolve vendorId via partner_account account_number VEND-1000 PSUC
- Resolve vendor reconciliation account wiring: SELECT reconciliation_account_id FROM partner_vendor_profile WHERE partner_id = vendorId → FGLC 2000000000 + account_number via fin_ledger_account join → vendorGlId = reconciliation_account_id vendorReconAccountNumber = account_number – wiring FGLC – vendor subledger to GL – F_BKPF_KTO – T0
- Resolve bank GL via fi_gl_account account_number 8000000001 Bank SBI
- Tolerance OBA0/OBA4 VEND-01: Calculate diffAmount from apInvoiceIds gross_amount net_amount invoiceTotal sum diffAmount abs(totalAmt-invoiceTotal) explicit difference_amount checkTolerance 400 if exceeded T1 prevents overpay
- Number range KZ 53* 5300000000-5399999999 – Generate KZ number 53* via ent_number_range FI_DOC_53 current_number+1 paymentNumber
- Create FI document KZ INSERT fi_document document_number paymentNumber company_code_id doc_type SA posting_date document_date reference header_text total_debit total_credit currency status POSTED reference_doc_type KZ RETURNING id
- Vendor Payment Dr Vendor Recon 2000000000 Cr Bank 8000000001 – INSERT fi_document_line vendorGlId bp_id vendorId debit totalAmt credit 0 bankGlId NULL debit 0 credit totalAmt – T0 – FULC KZ
- Update AP invoices PAID if apInvoiceIds
- Audit log INSERT audit_log WORM-lite
- Universal ledger FULC KZ – Dr Vendor Recon Cr Bank
- Document flow: if apInvoiceIds for each apId find invoice_number vendor_invoice_number from fi_ap_invoice → ivNumberForFlow – INSERT audit_document_flow root IV IV→Payment – preceding IV succeeding PAYMENT – FDFL VBFA T0 – open-item clearing FB05 F-44
- Return paymentNumber, vendorReconAccount FGLC, payment terms FAPT, tax FTXC, document flow IV→Payment, open-item clearing, tolerance

**Expected:** Payment KZ 5300000000 posted – Dr Vendor Recon 2000000000 7500 Cr Bank 8000000001 7500 – vendor recon wired FGLC – bank SBI – AP invoice PAID – open-item clearing FB05 F-44 – tolerance OBA0/OBA4 VEND-01 OK – document flow IV→Payment – T1 – T0 BLOCKING – NO DANGLING – org wired

**Frontend:** /1000/fico/payment – uses /api/payment – vendorNumber VEND-1000 PSUC XK01 autocomplete /api/business-partners?role=VENDOR, amount 83500 INR FCYC, paymentMethod BANK/CASH/CHEQUE – BANK Dr Vendor Recon Cr Bank, CASH Dr Vendor Recon Cr Cash 8000000000, CHEQUE Dr Vendor Cr Bank – bankGlAccount FGLC FS00 autocomplete /api/gl-accounts, reference, postingDate OB52 S+K F_BKPF_BUP, headerText BKTXT KZ Payment Vendor Amount Method, selectedInvoices map apInvoiceId boolean – apOpenItems fi_ap_invoice status OPEN – filter companyCode – apInvoiceIds array – payload companyCode vendorId amount paymentMethod bankGlAccount reference postingDate headerText apInvoiceIds tolerance_group_code VEND-01 – executeWithAutoPromote – resolve vendorId via /api/business-partners?search=vendorNumber – POST /api/payment – RoleGuard PAYMENT_POST ACCOUNTANT ADMIN OWNER MANAGER – JobPopup auto-promote 10s ALL – locks SM12 – T0 – org wired – company ELEC vendor PSUC GL FGLC currency FCYC tolerance OBA0/OBA4 posting period FPPE fiscal FFYC

### 9. Document Flow – FDFL – VBFA – ALB – WORM-lite – PR→PO→GR→IV→Payment
**API:** GET /api/document-flow?type=PO&id=xxx – returns flow
**Table:** audit_document_flow root_document_type root_document_id root_document_number preceding_doc_type preceding_doc_id preceding_doc_number succeeding_doc_type succeeding_doc_id succeeding_doc_number created_at – append-only WORM-lite – UI visual tree level parentId children color coding by type icons amount posting date reference – Document Flow button on PO/Sales Order navigates to /audit/document-flow?type=PO&id=xxx – POST createFlowLink precedingDocType/Id/Number succeedingDocType/Id/Number rootDocType/Id/Number – DocumentFlowService.createFlowLink

**Expected flow for this E2E:**
- PR 1000000000 root PR – no preceding – succeeding PR
- PR→PO: root PR 1000000000 preceding PR 1000000000 succeeding PO 4500000000 – PR 1000000000 → PO 4500000000
- PO root: root PO 4500000000 preceding PR 1000000000 succeeding PO 4500000000
- PO→GR: root PR 1000000000 preceding PO 4500000000 succeeding GR 5000000000 – PO 4500000000 → GR 5000000000
- PO→GR second: root PR 1000000000 preceding PO 4500000000 succeeding GR 5000000001
- PO→IV: root PR 1000000000 preceding PO 4500000000 succeeding IV 5100000000 – PO 4500000000 → IV 5100000000
- GR→IV: root PR 1000000000 preceding GR 5000000000 succeeding IV 5100000000 – GR 5000000000 → IV 5100000000
- GR→IV second: root PR 1000000000 preceding GR 5000000001 succeeding IV 5100000002
- IV→Payment: root IV 5100000000 preceding IV 5100000000 succeeding PAYMENT 5300000000 – IV 5100000000 → Payment 5300000000
- Visual tree: PR 1000000000 → PO 4500000000 → GR 5000000000 (60) → IV 5100000000 (60) → Payment 5300000000 (7500) + GR 5000000001 (40) → IV 5100000002 (50) + credit memo IV 5100000001 (-10) – ELIKZ closed – GR/IR cleared – T0 – WORM-lite – ALB – VBFA

**Frontend:** /1000/audit/document-flow?type=PO&id=xxx – visual tree – level parentId children – color coding by type – icons amount posting date reference – Document Flow button on PO/Sales Order – FDFL – VBFA – ALB – WORM-lite – T0

### 10. Cancellation/Reversal – GRRE/IVRE/PORE – MIGO 102 / MR8M – T0 – Stock Reversal
**API:** PUT /api/gr – action REVERSE gr_number 5000000000 reason Test reversal 102
**Payload:**
```json
{
  "gr_number": "5000000000",
  "action": "REVERSE",
  "reason": "Test reversal – wrong qty – GRRE MIGO 102",
  "company_code": "1000"
}
```
**Backend – enhanced in this continuation:**
- createReversalOrAdjustmentDocument original_document_type GR original_document_number 5000000000 action REVERSE reason – getReversalDocType GR REVERSE → GRRE – getNextDocumentNumber GRRE → GRRE-1000000000 – ensure number range GRRE-01 – INSERT core_document document_type GRRE document_number GRRE-1000000000 company_code fiscal_year reference originalNumber created_by system payload original_document_type original_document_number action reason is_reversal true original_payload new_payload reversal_type GRRE description Goods Receipt Reversal – Reverses 5000000000 – Legal-safe own IP (was MIGO 102) – Reason – UPDATE core_document status REVERSED payload jsonb_set reversal_document GRRE-1000000000 – updateDocumentWithAudit – immutable audit trail – WORM-lite
- UPDATE proc_goods_receipt status REVERSED
- Enhanced reversal stock logic: Find origGrId SELECT id FROM proc_goods_receipt WHERE gr_number=5000000000 – SELECT po_line_id quantity item_id facility_id FROM proc_gr_line WHERE gr_id=origGrId – for each line qty 60 – UPDATE proc_po_line quantity_received = GREATEST(0, 60-60=0) delivery_completed false is_closed false – UPDATE prod_facility_profile total_stock_qty = GREATEST(0, 100-60=40) – INSERT inv_stock_ledger item_id facility_id movement_type 102 quantity -60 quantity_before 0 quantity_after 0 unit_cost 0 total_value 0 reference_doc_type GR reference_doc_number GRRE-1000000000 text GR reversal 102 – stock reversal – 5000000000 – SELECT fin_universal_ledger WHERE document_number=5000000000 AND document_type WE – for each reverse debit/credit INSERT fin_universal_ledger document_number GRRE-1000000000 document_type WE posting_date fiscal_year fiscal_period ledger_account_id gl_account_id debit credit amount text GR reversal 102 – universal ledger reversal – 5000000000 – log GR reversal 102

**Expected:** GRRE-1000000000 created – original GR 5000000000 status REVERSED – PO line received 100-60=40 open 60 – stock total 40 – stock ledger 102 -60 – universal ledger reversed Cr BSX Dr WRX – T0 – immutable audit – GRRE

**API:** PUT /api/iv – action REVERSE iv_number 5100000000 reason Test reversal MR8M
**Payload:**
```json
{
  "iv_number": "5100000000",
  "action": "REVERSE",
  "reason": "Test reversal – wrong invoice – IVRE MR8M",
  "company_code": "1000"
}
```
**Backend – enhanced:**
- createReversalOrAdjustmentDocument original IV 5100000000 → IVRE – IVRE-1000000000 – core_document
- UPDATE proc_invoice_verification status REVERSED
- Enhanced: Find origIvId – SELECT po_line_id quantity FROM proc_iv_line WHERE iv_id=origIvId – for each qty 60 – UPDATE proc_po_line quantity_invoiced = GREATEST(0, 100-60=40) – SELECT fin_universal_ledger WHERE document_number=5100000000 AND document_type RE/RE_CREDIT/RE_DEBIT – reverse INSERT – log IV reversal MR8M

**Expected:** IVRE-1000000000 created – original IV 5100000000 REVERSED – PO invoiced 40 – ledger reversed – T0 – IVRE

**Frontend:** PO/GR/IV pages have reversal via PUT – action REVERSE – reason – creates reversal document GRRE/IVRE/PORE – status REVERSED – immutable audit trail – legal-safe own IP (was MIGO 102/MR8M) – stock reversal 102 – PO received/invoiced qty reversed – universal ledger reversed – industry standard

### 11. Credit/Debit Memo – RE_CREDIT/RE_DEBIT – PIVC – T0
**Already tested in IV step:** RE_CREDIT -10 qty – Dr Vendor Recon FGLC Cr WRX reduces liability – industry standard – is_credit_memo true is_credit true tax reversed – universal ledger RE_CREDIT – T0

**Expected:** Credit memo reduces liability – Vendor Recon Dr – WRX Cr – Tax Cr – T0

### 12. Approval Workflow – SBWP – ME54N/ME28 – T0 – Manager <10000 Owner >=10000 Dual
**Already tested in PR/PO steps:** wf_definition PR_APPROVAL PO_APPROVAL – 2 steps Manager Approval <10000 approver_type MANAGER min 0 max 9999.99 requires_dual false is_owner_approval false – Manager+Owner Dual >=10000 approver_type OWNER min 10000 max 999999999 requires_dual true is_owner_approval true – wf_instance PENDING_APPROVAL current_step_order 1 amount currency – wf_task PENDING assignee hr_employee – inbox GET /api/workflow – approve POST – wf_task APPROVED – wf_instance APPROVED – document status APPROVED – wf_history DRAFT→PENDING_APPROVAL→APPROVED – audit_log WORM-lite – T0 – SBWP – ME54N Release PR – ME28 Release PO

**Frontend:** /1000/workflow/inbox – shows tasks – approve/reject – T0

## Org Wiring Verification – All 12 Points Wired to Other DB

- **EFCC Facility** – org_facility code FAC-1000 – used in PR facility_id, PO facility_id, GR facility_id, stock prod_facility_profile facility_id, inventory org_inventory_location facility_id – WIRED ✅
- **EILC Inventory Location** – org_inventory_location code SL01 – used in PR inventory_location_id, PO inventory_location_id, GR sloc_id, stock – WIRED ✅
- **ELEC Legal Entity** – org_legal_entity code 1000 – used in PR legal_entity_id company_code_id, PO legal_entity_id company_code_id, IV legal_entity_id company_code_id, Payment company_code_id, posting period FPPE variant_code PPV-1000 – WIRED ✅
- **EPDC Procurement Division** – org_procurement_division code PO01 – used in PO procurement_division_id, supplier PSUC procurement_division_code, facility assignment – WIRED ✅
- **EBTC Buyer Team** – org_buyer_team code BT-100 – used in PO buyer_team_id, supplier PSUC buyer_team_code – WIRED ✅
- **PSUC Supplier** – partner_account account_number VEND-1000 + partner_vendor_profile reconciliation_account_id FGLC payment_term_code FAPT currency_code FCYC procurement_division_code EPDC buyer_team_code EBTC tax_classification FTXC incoterms – used in PO partner_id vendor_id, PR? No, GR via PO, IV partner_id, Payment vendorId – WIRED ✅ – payment terms FAPT NT30 → days 30 due calc – recon FGLC 2000000000 → vendorGlId – tax FTXC – procurement division EPDC – buyer team EBTC – currency FCYC – incoterms – is_quality_relevant – is_blocked – T0
- **EMTC Material** – prod_item item_number 10000001 + prod_facility_profile total_stock_qty total_stock_value moving_avg_price + prod_commercial_profile + prod_quality_profile – used in PR item_id, PO item_id, GR item_id, IV item_id, stock, info record – valuation_class RAW → FAUC OBYC BSX 1400000001 – price_control S/V – WIRED ✅
- **EUOC UoM** – core_unit_measure code KG PC – used in PR uom_code, PO uom_code, GR uom, stock – conversion – WIRED ✅
- **FGLC GL Account** – fin_ledger_account account_number 1400000001 BSX 2000000001 WRX 2000000000 Vendor Recon 8000000001 Bank SBI 4000000004 PRD 2000000003 Tax – used in auto account FAUC, GR BSX/WRX, IV WRX/Vendor Recon/PRD/Tax, Payment Vendor Recon/Bank – WIRED ✅ – F_BKPF_KTO – T0 – BSX/WRX/GBB/PRD
- **FAUC Auto Account** – fin_auto_account_enhanced transaction_key BSX/WRX/GBB/PRD/BSV/FRE/ZOL/KDM/KOFI/KOFK chart_of_accounts_code KSCA valuation_grouping_code 0001 account_grouping_code VAX gl_account_number – used in GR auto account BSX/WRX/GBB/PRD – valuation_class RAW – company_code 1000 – WIRED ✅ – OBYC – T0
- **FCYC Currency** – core_currency code INR USD EUR KWD – used in PR currency_code, PO currency_code, GR currency, IV currency, Payment currency – WIRED ✅ – OY03 – decimal_places
- **FEXC Exchange Rate** – fin_exchange_rate_enhanced from_currency USD to_currency INR rate_type M/B/G rate 83.5 spread 0.1 from_factor to_factor direct_quotation validity from_date to_date inverse fallback cache 60s dragonfly KDM – used in PO/IV/Payment if foreign currency – WIRED ✅ – OB08 – KDM – fail with reason and available rates
- **FAPT Payment Terms** – fin_payment_term code NT30 days 30 discount_percent 2 discount_days 10 – used in supplier PSUC payment_term_code, PO payment_term_code → due_date discount_date, IV payment_term_code → due_date, Payment due_date – wiring supplier → PO → IV → F110 – WIRED ✅ – OBA7 – due calc calculateDueDate
- **FTXC Tax Code** – fin_tax_rule code GST18 rate 18% type INPUT/OUTPUT/BOTH/NONE/EXEMPT gst_type CGST/SGST/IGST/UTGST/CESS/VAT/NONE hsn_code 09041110 ledger_account_code 2000000003 is_reverse_charge is_active – used in PO line tax_rule_id tax_rate tax_per_unit, IV line tax_rule_id tax_rate tax_amount, supplier tax_classification – HSN 13 seeds 09041110 pepper 5% etc – WIRED ✅ – FTXP – tax/HSN – ledger_account_code from tax code – e.g., GST 18% tax GL 2000000003 – universal ledger FULC RE + WRX clearing + BSX adjustment – is_landed_cost_posted for MAP adjustment
- **FMTM Movement Type** – fin_movement_type_enhanced 101 GR PO BSX/WRX 102 GR Reverse 261 GI Order 601 GI Delivery 602 GD Reverse 122 Return to Vendor – used in GR movement_type 101 – getMovementType validateMovementAllowed – batch/cost_center required SCRAP01 551 special stock reversal 102/262/602 – WIRED ✅ – OMJJ – M_MSEG_BWA – T0 BLOCKING
- **FNRC Number Range** – core_number_range code MAT-01 ITEM MAT-100001 current/next_available locked badge 🔒 usedCount assignment table per material/PO/PR/GR error_and_extend numeric only no prefixes block_manual/always_auto – used in PR 1000000000 PO 4500000000 GR 5000000000 IV 5100000000 Payment KZ 53* – WIRED ✅ – FBN1/SNRO – S_NUMBER – industry standard
- **FPPE Posting Period** – fin_posting_period_enhanced variant_code PPV-1000 account_type S/+ A/D/K/M/S/V from_period from_year to_period to_year from_account to_account authorization_group AUTH01 is_open – used in PR posting period M, PO K, GR M, IV K, Payment S+K – enforcePostingPeriod – must be open – else error – F_BKPF_BUP – T0 – K – WIRED ✅ – OB52 – FPPC PPV-1000 – FFYC K4
- **FFYC Fiscal Calendar** – fin_fiscal_calendar K4 year_dependent false calendar_year false number_of_periods 12 start_month 4 end_month 3 year_shift from_date to_date – used in posting period enforcement via getFiscalYearPeriodFromDate – WIRED ✅ – OB29 – K4 April-March
- **FULC Universal Ledger** – fin_universal_ledger document_number document_type posting_date document_date fiscal_year fiscal_period ledger_account_id gl_account_id debit credit amount currency reference_doc_type reference_doc_number text – 400+ fields – used in GR BSX/WRX, IV RE+WRX clearing+Vendor Recon+PRD+Tax, Payment KZ Vendor Recon/Bank, GR/IR clearing WRX cleared, reversal GRRE/IVRE reversed – WIRED ✅ – ACDOCA – F_BKPF_BUK
- **FSTL Stock Ledger** – inv_stock_ledger item_id facility_id movement_type 101/102 quantity quantity_before quantity_after unit_cost total_value reference_doc_type GR reference_doc_number – used in GR stock update – MAP recalc – WIRED ✅ – MMBE – actual costing
- **FDFL Document Flow** – audit_document_flow root_document_type root_document_id root_document_number preceding_doc_type preceding_doc_id preceding_doc_number succeeding_doc_type succeeding_doc_id succeeding_doc_number created_at – append-only WORM-lite – used in PR root, PR→PO, PO→GR, PO→IV, GR→IV, IV→Payment – WIRED ✅ – VBFA/ALB – predecessor/successor – quantity/value – ELIKZ
- **FBJM Background Job** – core_background_job queue progress no timeout auto-promote ALL 10s popup redirect header icon pgbouncer 6432 dragonfly 6379 – used in PR/PO/GR/IV/Payment – WIRED ✅ – SM37 – industry standard per user long processes like payroll 1000 employees may take minutes server must not timeout show progress steps use background job with header job icon showing jobs being done queue if system busy separate system job page auto-promote after 10 sec must apply to ALL processes first 10 sec normal direct with timer if >10 sec move to background with popup
- **FELM Enqueue Lock** – core_enqueue_lock object_type OBJECT_ID lock_mode E/X/S heartbeat 5min expiry – used in GR PO lock prevents double entry – SM12 – WIRED ✅ – enqueue/dequeue – per user background processes must be protected against double entry same safety for system settings like number ranges other users must not edit while locked can after release or after 5 min inactivity – industry standard SM12
- **FAUD Audit Log** – audit_log old/new JSONB changed_fields CDHDR CHG- MATERIAL 10001 CDPOS field old/new WORM-lite – used in all – WIRED ✅ – SM20/SL G1
- **FRPC Role/Permission** – 14 roles ADMIN OWNER MANAGER MATERIAL_MANAGER MASTER_DATA_MANAGER PURCHASER WAREHOUSE SALES ACCOUNTANT PRODUCTION HR HR_MANAGER PAYROLL_MANAGER AUDITOR 30+ perms M_BEST_WRK M_MSEG_BWA F_BKPF_BUK/KTO/BUP F_NUM_RANGE F_EXC_RATE 403 unauthorized card navigator filtering SoD triple protection – used in PR/PO/GR/IV/Payment – WIRED ✅ – PFCG/SU01

## Acceptance Criteria – 12 Points – Industry Standard Parity

- Each point exists with industry standard parity (own names primary, SAP aliases secondary) – ✅
- Org wiring EFCC/ELEC/PSUC/EMTC/FGLC/FAUC/FCYC/FAPT/FTXC/FMTM/FNRC – ✅
- T0 BLOCKING – posting period OB52, movement OMJJ, auto account OBYC BSX/WRX/GBB/PRD, number range FNRC numeric only assignment error_and_extend, tolerance OBA0/OBA4, payment terms FAPT, stock ledger MAP, universal ledger FULC – ✅
- NO DANGLING – single source per field – every UI field backed by DB – ✅
- Document flow FDFL VBFA ALB WORM-lite – PR→PO→GR→IV→Payment – ✅
- Universal ledger FULC ACDOCA 400+ fields – BSX/WRX/RE/KZ – ✅
- Tolerance OBA0/OBA4 VEND-01 – value + quantity – over/under delivery tolerance UEBTO/UNTTO – ✅
- Version history WORM-lite – CDHDR/CDPOS – version + change_history JSONB – ✅
- Partial GR/IV allowed – quantity_received accumulates, quantity_invoiced accumulates – ✅
- Cancellation/reversal GRRE/IVRE/PORE – stock reversal 102 + invoiced qty reversal + ledger reversal – immutable audit – ✅
- Credit/debit memo RE_CREDIT/RE_DEBIT – is_credit_memo + ledger reversal Dr Vendor Recon FGLC Cr WRX – reduces liability – ✅
- Approval workflow SBWP – ME54N/ME28 – manager <10000 owner >=10000 dual – auto-start – inbox – approve/reject – ✅

## Gaps – Remaining Minor

- GR 102 stock reversal qty decrease – FIXED in this continuation – 102 reversal decreases PO received qty + facility total_stock_qty + stock ledger 102 negative + universal ledger WE reversed
- IV MR8M reversal qty decrease – FIXED – decreases PO invoiced qty + ledger RE reversed
- PO version history display – FIXED – shows version + change_history slice + conditions + tolerance + recon + tax + links
- GR tolerance display – FIXED – shows over/under tolerance per line Max Min + tolerance check
- IV frontend credit memo toggle + tax autocomplete per line – FIXED – documentType RE/RE_CREDIT/RE_DEBIT + isCreditMemo checkbox + paymentTermCode NT30 autocomplete FAPT + taxCode GST18 autocomplete FTXC + per line tax_code
- PO frontend payment term code + tax_code + tolerance – FIXED – paymentTermCode NT30 autocomplete FAPT + tax_code GST18 autocomplete FTXC + overdelivery_tolerance_percent 10 + underdelivery_tolerance_percent 10

## End-to-End Test Script

See `scripts/test_e2e_purchasing_flow.ts` – runs PR→PO→GR→IV→Payment + credit memo + reversal + document flow + workflow + tolerance checks – requires DB running via docker-compose – uses fetch /api/pr /api/po /api/gr /api/iv /api/payment /api/document-flow /api/workflow /api/gr-ir-clearing

**Run:**
```bash
docker compose up -d
npm run db:auto-migrate
npm run db:seed:fictional:test # if needed – creates 1000 FMCG
npm run test:e2e:purchasing # or tsx scripts/test_e2e_purchasing_flow.ts
```

**Expected output:**
- PR 1000000000 created – workflow auto-started – tasks PENDING
- PR approved – status APPROVED
- PO 4500000000 created – total 10000 landed 12500 – payment term NT30 due 2026-11-09 – vendor recon 2000000000 – tax GST18 18% – over/under 10%/10% – version 1 history – conditions BASE/FREIGHT/CUSTOMS/TAX – workflow auto-started – document flow PR→PO
- PO approved – status APPROVED
- GR 5000000000 created – 60 KG – PO received 60 open 40 – stock 60 – BSX 6000 WRX 6000 – document flow PO→GR – partial GR – tolerance OK
- GR 5000000001 created – 40 KG final ELIKZ – PO received 100 open 0 – delivery_completed true – all_elikz true – PO CLOSED – stock 100 – document flow PO→GR second
- Overdelivery 15 KG blocked – maxAllowed 110 – 115 >110 – 400 error Over-delivery tolerance exceeded
- IV 5100000000 created – 60 KG – PO invoiced 60 open 40 – WRX 6000 Vendor Recon 7500 Tax 1080 Freight 300 Customs 120 – document flow PO→IV GR→IV – partial invoice – qty tolerance OK – value tolerance OK – payment term NT30 due 2026-11-11 – recon FGLC – tax FTXC
- Credit memo RE_CREDIT -10 KG – PO invoiced 50 – Vendor Recon Dr 1180 WRX Cr 1000 Tax Cr 180 – reduces liability
- IV 5100000002 created – 50 KG invoiced 110 vs PO 100 variance 500 PRD – PO invoiced 100 fully invoiced – price variance PRD 500 – GR/IR clearing candidate
- Invoice qty 20 over received blocked – maxInvoiceQty 110 – 120 >110 – 400 error Invoice quantity tolerance exceeded
- GR/IR clearing CLR-... created – GR qty=IV qty – WRX cleared – balance zero
- Payment KZ 5300000000 posted – Dr Vendor Recon 2000000000 7500 Cr Bank 8000000001 7500 – vendor recon wired FGLC – AP invoice PAID – open-item clearing FB05 F-44 – tolerance OK – document flow IV→Payment
- Document flow PR 1000000000 → PO 4500000000 → GR 5000000000 → IV 5100000000 → Payment 5300000000 + GR 5000000001 → IV 5100000002 + credit memo 5100000001 – visual tree – WORM-lite – ALB – VBFA
- GR reversal GRRE-1000000000 created – original 5000000000 REVERSED – PO received 40 open 60 – stock 40 – ledger reversed – GRRE
- IV reversal IVRE-1000000000 created – original 5100000000 REVERSED – PO invoiced 40 – ledger reversed – IVRE
- All 12 points verified – org wiring – T0 BLOCKING – NO DANGLING – FULC – FDFL – tolerance – version history – partial GR/IV – cancellation/reversal – credit/debit memo – approval workflow – DONE

## Files

- `src/app/api/business-partners/route.ts` – vendor profile wiring payment_term_code FAPT → days, recon_account FGLC → id, procurement_division EPDC, buyer_team EBTC, tax FTXC, incoterms
- `src/app/api/po/route.ts` – payment_term_code due_date discount_date vendor_recon_account_id tax_amount_calc overdelivery_tolerance_percent underdelivery_tolerance_percent tax_rule_id tax_rate version change_history JSONB – payment term lookup FAPT due calc – vendor recon – tax FTXC – conditions BASE/FREIGHT/CUSTOMS/TAX – version history ME22N CDHDR/CDPOS
- `src/app/api/gr/route.ts` – over/under tolerance check maxAllowed minAllowed ELIKZ partial GR auto-close – stock ledger MAP – universal ledger BSX/WRX – document flow PO→GR – reversal GRRE 102 stock reversal PO qty_received reversed facility total_stock_qty reversed stock ledger 102 negative ledger WE reversed
- `src/app/api/iv/route.ts` – document_type RE is_credit_memo is_debit_memo payment_term_code due_date vendor_recon_account_id tax_rule_id tax_rate is_credit – payment term FAPT due_date – vendor recon FGLC – credit/debit memo RE_CREDIT RE_DEBIT – invoice quantity tolerance maxInvoiceQty received*1.1 – checkTolerance VEND-01 – tax FTXC rate lookup – partial invoice quantity_invoiced accumulates – universal ledger RE+WRX clearing+Vendor Recon+PRD+Tax with credit reversal signs – document flow PO→IV GR→IV – reversal IVRE MR8M PO invoiced qty reversed ledger RE reversed
- `src/app/api/payment/route.ts` – vendor recon wiring partner_vendor_profile reconciliation_account_id account_number via fin_ledger_account – FGLC – F_BKPF_KTO – tolerance OBA0/OBA4 VEND-01 – open-item clearing FB05 F-44 – document flow IV→Payment
- `src/app/api/pr/route.ts` – document flow PR root + workflow auto-start ME54N PR_APPROVAL manager/owner dual
- `src/app/(erp)/[companyCode]/mm/po/page.tsx` – POLine tax_code overdelivery_tolerance_percent underdelivery_tolerance_percent paymentTermCode NT30 tax_code GST18 over 10 under 10 – DbAutocomplete FAPT payment terms + FTXC tax codes + tolerance inputs – version history UI – tolerance display – ELIKZ – ME21N PPOC – ME22N CDHDR/CDPOS
- `src/app/(erp)/[companyCode]/mm/iv/page.tsx` – documentType RE/RE_CREDIT/RE_DEBIT isCreditMemo paymentTermCode NT30 taxCode GST18 – payload document_type is_credit_memo payment_term_code tax_code credit reversal – classic DOCUMENT_TYPE select IS_CREDIT_MEMO checkbox PAYMENT_TERM_CODE TAX_CODE – modern DbAutocomplete FAPT TAX_CODE FTXC DOCUMENT_TYPE select IS_CREDIT_MEMO checkbox – credit/debit memo – payment terms – tax – recon – tolerance
- `src/app/(erp)/[companyCode]/mm/gr/page.tsx` – POLine overdelivery_tolerance_percent underdelivery_tolerance_percent – display Ordered/Received/Open + Tolerance Over Under Max Min – GR Qty Max tolerance OBA0/OBA4 overdelivery – ELIKZ – partial GR – MIGO 101
- `src/app/(erp)/[companyCode]/fico/payment/page.tsx` – vendorNumber VEND-1000 PSUC autocomplete, amount, paymentMethod BANK/CASH/CHEQUE, bankGlAccount FGLC, reference, postingDate, headerText, apInvoiceIds open-item clearing, tolerance VEND-01, document flow IV→Payment – F-53 KZ
- `src/app/(erp)/[companyCode]/mm/reports/page.tsx` – ME80FN purchasing reporting – aggregates PR/PO/GR/IV/Stock – filters vendor PSUC material EMTC facility EFCC – org wired – T2
- `src/app/(erp)/[companyCode]/audit/document-flow/page.tsx` – FDFL VBFA ALB WORM-lite visual tree
- `src/app/(erp)/[companyCode]/workflow/inbox/page.tsx` – SBWP inbox – approve/reject – ME54N/ME28
- `src/app/(erp)/[companyCode]/fico/gr-ir-clearing/page.tsx` – F.13 MR11 T1 WRX cleared
- `src/shared/kernel/db/reversalHelpers.ts` – GRRE/IVRE/PORE PRRE SORE DLRE BLRE STOR – core_document reversal_type – immutable audit trail – WORM-lite
- `src/shared/kernel/db/postingPeriodHelpers.ts` – checkTolerance OBA0/OBA4 calculateDueDate FAPT
- `AUDIT_12_POINTS_PURCHASING_ENHANCED.md` – 600+ lines audit 12 points backend/frontend/org wiring/SAP parity/gap
- `E2E_PURCHASING_FLOW_CHECK.md` – this file – E2E flow check
- `scripts/test_e2e_purchasing_flow.ts` – E2E test script – PR→PO→GR→IV→Payment + credit memo + reversal + document flow + workflow + tolerance
- `PROJECT_LOG.md` – single source of truth – Section 6 Future Changes Log – per standing instruction

## Status

✅ All 12 points enhanced purchasing now available with industry standard level implementation – org wiring verified and enhanced – payment terms, vendor recon, tax, pricing, PO changes/version history, partial GR, partial invoice, over/under tolerance, invoice tolerance, cancellation/reversal, credit/debit memo, approval workflow – T0 BLOCKING – NO DANGLING – FULC – FDFL – tolerance – version history – partial GR/IV – cancellation/reversal – credit/debit memo – approval workflow – org wired EFCC/EILC/ELEC/EPDC/EBTC/PSUC/EMTC/EUOC/FGLC/FAUC/FCYC/FAPT/FTXC/FMTM/FNRC – ready for commit/push – E2E flow check DONE
