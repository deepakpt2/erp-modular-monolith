"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="PSUC"
      sapAlias="XK01"
      title="Supplier – Vendor Master"
      description="Create Supplier – vendor master procurement – central partner_account role VENDOR + procurement view – strict industry standard: used in PO, GR, IV – payment terms due date calc, currency, tax info, reconciliation account, purchasing org/group – T0 BLOCKING – NO DANGLING – own names"
      apiEndpoint="/api/business-partners"
      initialForm={{ 
        account_number: '', 
        display_name: '',
        legal_name: '', 
        role: 'VENDOR',
        gst_number: '', 
        pan_number: '',
        tax_id: '',
        email: '',
        phone: '',
        address_line1: '',
        city: '',
        region: '',
        postal_code: '',
        country: 'IN',
        currency_code: 'INR',
        payment_term_code: 'NT30',
        payment_terms_days: '30',
        reconciliation_account_code: '',
        procurement_division_code: '', 
        buyer_team_code: '',
        tax_classification: 'TAXABLE',
        incoterms: 'EXW',
        is_quality_relevant: 'false',
        is_blocked: 'false',
        description: '' 
      }}
      fields={[
        { key: "account_number", label: "SUPPLIER_CODE", required: true, placeholder: "SUP-1000", description: "Supplier code – unique – account_number – e.g., SUP-1000 – industry standard vendor number – own name" },
        { key: "display_name", label: "SUPPLIER_NAME", required: true, placeholder: "ABC Traders Pvt Ltd", description: "Supplier display name – short – e.g., ABC Traders" },
        { key: "legal_name", label: "LEGAL_NAME", placeholder: "ABC Traders Private Limited", description: "Legal registered name" },
        { key: "role", label: "PARTNER_ROLE", required: true, type: "select", options: ["VENDOR", "BOTH"], placeholder: "VENDOR", description: "Basic partner role – VENDOR for supplier, BOTH for vendor+customer – industry standard" },
        { key: "gst_number", label: "GST_NUMBER", placeholder: "27ABCDE1234F1Z5", description: "Tax information – GSTIN – India GST – tax info – industry standard" },
        { key: "pan_number", label: "PAN_NUMBER", placeholder: "ABCDE1234F", description: "Tax info – PAN – India PAN" },
        { key: "tax_id", label: "TAX_ID", placeholder: "TAX-001", description: "Tax ID – additional tax classification" },
        { key: "email", label: "EMAIL", placeholder: "vendor@company.com", description: "Contact email" },
        { key: "phone", label: "PHONE", placeholder: "+91-...", description: "Contact phone" },
        { key: "address_line1", label: "ADDRESS", placeholder: "Street, Building", description: "Address line" },
        { key: "city", label: "CITY", placeholder: "Mumbai", description: "City" },
        { key: "region", label: "REGION_STATE", placeholder: "Maharashtra", description: "State/Region" },
        { key: "postal_code", label: "POSTAL_CODE", placeholder: "400001", description: "Postal code" },
        { key: "country", label: "COUNTRY", placeholder: "IN", description: "Country code – IN" },
        { key: "currency_code", label: "CURRENCY_CODE", required: true, type: "autocomplete", apiUrl: "/api/currencies", dataKey: "currencies", codeField: "code", placeholder: "INR", createUrl: "/fico/currencies", createCode: "FCYC", description: "Currency – e.g., INR, USD – currency – industry standard – used in PO, IV – payment currency" },
        { key: "payment_term_code", label: "PAYMENT_TERM_CODE", required: true, type: "autocomplete", apiUrl: "/api/payment-terms", dataKey: "paymentTerms", codeField: "code", placeholder: "NT30", createUrl: "/fico/payment-terms", createCode: "FAPT", description: "Payment terms – e.g., NT30 Net 30 Days, 2-10-N30 – payment terms – strict usage due date = posting date + days – used in PO, IV, aging, cash flow – industry standard" },
        { key: "payment_terms_days", label: "PAYMENT_TERMS_DAYS", placeholder: "30", description: "Payment terms days – numeric – e.g., 30 – derived from payment term code – due date calc" },
        { key: "reconciliation_account_code", label: "RECONCILIATION_ACCOUNT", type: "autocomplete", apiUrl: "/api/gl-accounts", dataKey: "glAccounts", codeField: "account_number", placeholder: "200000", createUrl: "/fico/gl-accounts", createCode: "FGLC", description: "Reconciliation/control account – e.g., 200000 Vendor Reconciliation – GL account – control account – industry standard – vendor subledger to GL – F_BKPF_KTO – T0 BLOCKING" },
        { key: "procurement_division_code", label: "PROCUREMENT_DIVISION_CODE", type: "autocomplete", apiUrl: "/api/procurement-divisions", dataKey: "procurementDivisions", codeField: "code", placeholder: "PD-100", createUrl: "/foundation/procurement-divisions", createCode: "EPDC", description: "Purchasing organisation – procurement division – e.g., PD-100 – industry standard – org assignment – plant to purchasing org" },
        { key: "buyer_team_code", label: "BUYER_TEAM_CODE", type: "autocomplete", apiUrl: "/api/buyer-teams", dataKey: "buyerTeams", codeField: "code", placeholder: "BT-100", createUrl: "/foundation/buying-teams", createCode: "EBTC", description: "Purchasing group – buyer team – e.g., BT-100 Raw Materials Team – industry standard – buyer determination in PR/PO" },
        { key: "tax_classification", label: "TAX_CLASSIFICATION", type: "select", options: ["TAXABLE", "EXEMPT", "REVERSE_CHARGE"], placeholder: "TAXABLE", description: "Tax classification – TAXABLE/EXEMPT/REVERSE_CHARGE – tax info – industry standard – used in tax determination" },
        { key: "incoterms", label: "INCOTERMS", type: "select", options: ["EXW", "FOB", "CIF", "DDP", "DAP"], placeholder: "EXW", description: "Incoterms – EXW/FOB/CIF/DDP – delivery terms – industry standard – used in PO" },
        { key: "is_quality_relevant", label: "IS_QUALITY_RELEVANT", type: "select", options: ["true", "false"], placeholder: "false", description: "Quality relevant – true if GR needs QM inspection – industry standard" },
        { key: "is_blocked", label: "IS_BLOCKED", type: "select", options: ["true", "false"], placeholder: "false", description: "Blocked – true if supplier blocked for purchasing – industry standard" },
        { key: "description", label: "DESCRIPTION", type: "textarea", description: "Additional notes" },
      ]}
      relatedLinks={[
        { code: "EPDC", label: "Procurement Division – purchasing org – required", route: "/foundation/procurement-divisions", description: "Purchasing organisation – procurement division" },
        { code: "EBTC", label: "Buyer Team – purchasing group – required", route: "/foundation/buying-teams", description: "Buyer Team – purchasing group" },
        { code: "FAPT", label: "Payment Terms – NT30 – due date calc", route: "/fico/payment-terms", description: "Payment Terms – defines due date" },
        { code: "FCYC", label: "Currency – INR/USD", route: "/fico/currencies", description: "Currency master" },
        { code: "FGLC", label: "GL Account – reconciliation account – control", route: "/fico/gl-accounts", description: "GL – reconciliation/control account" },
        { code: "FTXC", label: "Tax Code – GST", route: "/fico/tax-codes", description: "Tax classification" },
        { code: "PPOC", label: "Purchase Order uses Supplier – ME21N", route: "/mm/po", description: "PO – uses supplier" },
        { code: "EPAC", label: "Partner Account – central", route: "/foundation/partners", description: "Central partner master" },
      ]}
    />
  );
}
