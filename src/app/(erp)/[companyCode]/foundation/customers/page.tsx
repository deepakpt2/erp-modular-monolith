"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="SCUC"
      sapAlias="XD01"
      title="Customer – Customer Master"
      description="Create Customer – customer master sales – central partner_account role CUSTOMER + sales view – strict industry standard: used in SO, Delivery, Billing – sales organisation/channel, pricing, credit check, payment terms, currency, tax info, reconciliation account – T0 BLOCKING – NO DANGLING – own names"
      apiEndpoint="/api/business-partners"
      initialForm={{ 
        account_number: '', 
        display_name: '',
        legal_name: '', 
        role: 'CUSTOMER',
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
        payment_terms_days: '0',
        reconciliation_account_code: '',
        commercial_org_code: 'CO-1000',
        sales_channel_code: 'CH-10',
        product_line_code: 'PL-00',
        credit_policy_area_code: 'CPA-1000',
        price_group: '01',
        customer_group: '01',
        tax_classification: 'TAXABLE',
        account_assignment_group: '01',
        is_blocked: 'false',
        description: '' 
      }}
      fields={[
        { key: "account_number", label: "CUSTOMER_CODE", required: true, placeholder: "", description: "Customer code – unique – account_number – e.g., CUS-1000 – industry standard customer number – own name" },
        { key: "display_name", label: "CUSTOMER_NAME", required: true, placeholder: "", description: "Customer display name – short" },
        { key: "legal_name", label: "LEGAL_NAME", placeholder: "", description: "Legal registered name" },
        { key: "role", label: "PARTNER_ROLE", required: true, type: "select", options: ["CUSTOMER", "BOTH"], placeholder: "", description: "Basic partner role – CUSTOMER for customer, BOTH for both – industry standard" },
        { key: "gst_number", label: "GST_NUMBER", placeholder: "", description: "Tax information – GSTIN – tax info – industry standard" },
        { key: "pan_number", label: "PAN_NUMBER", placeholder: "", description: "Tax info – PAN" },
        { key: "tax_id", label: "TAX_ID", placeholder: "", description: "Tax ID – additional tax classification" },
        { key: "email", label: "EMAIL", placeholder: "", description: "Contact email" },
        { key: "phone", label: "PHONE", placeholder: "", description: "Contact phone" },
        { key: "address_line1", label: "ADDRESS", placeholder: "", description: "Address line" },
        { key: "city", label: "CITY", placeholder: "", description: "City" },
        { key: "region", label: "REGION_STATE", placeholder: "", description: "State/Region" },
        { key: "postal_code", label: "POSTAL_CODE", placeholder: "", description: "Postal code" },
        { key: "country", label: "COUNTRY", placeholder: "", description: "Country code" },
        { key: "currency_code", label: "CURRENCY_CODE", required: true, type: "autocomplete", apiUrl: "/api/currencies", dataKey: "currencies", codeField: "code", placeholder: "", createUrl: "/fico/currencies", createCode: "FCYC", description: "Currency – e.g., INR, USD – currency – industry standard – used in SO, Billing" },
        { key: "payment_term_code", label: "PAYMENT_TERM_CODE", required: true, type: "autocomplete", apiUrl: "/api/payment-terms", dataKey: "paymentTerms", codeField: "code", placeholder: "", createUrl: "/fico/payment-terms", createCode: "FAPT", description: "Payment terms – e.g., NT30 Net 30 – payment terms – due date calc – used in SO, Billing, aging" },
        { key: "payment_terms_days", label: "PAYMENT_TERMS_DAYS", placeholder: "", description: "Payment terms days – numeric" },
        { key: "reconciliation_account_code", label: "RECONCILIATION_ACCOUNT", type: "autocomplete", apiUrl: "/api/gl-accounts", dataKey: "glAccounts", codeField: "account_number", placeholder: "", createUrl: "/fico/gl-accounts", createCode: "FGLC", description: "Reconciliation/control account – e.g., 100000 Customer Reconciliation – GL account – control account – industry standard – customer subledger to GL – T0" },
        { key: "commercial_org_code", label: "COMMERCIAL_ORG_CODE", required: true, type: "autocomplete", apiUrl: "/api/commercial-orgs", dataKey: "commercialOrgs", codeField: "code", placeholder: "", createUrl: "/foundation/commercial-orgs", createCode: "ECOC", description: "Sales organisation – commercial org – e.g., CO-1000 India Sales – industry standard – org assignment – sales org – OVX2 – pricing procedure determination" },
        { key: "sales_channel_code", label: "SALES_CHANNEL_CODE", required: true, type: "autocomplete", apiUrl: "/api/sales-channels", dataKey: "salesChannels", codeField: "code", placeholder: "", createUrl: "/foundation/sales-channels", createCode: "ESCC", description: "Sales channel – distribution channel – e.g., CH-10 Direct – industry standard – sales area – OVTB" },
        { key: "product_line_code", label: "PRODUCT_LINE_CODE", required: true, type: "autocomplete", apiUrl: "/api/product-lines", dataKey: "productLines", codeField: "code", placeholder: "", createUrl: "/foundation/product-lines", createCode: "EPLC", description: "Product line – division – e.g., PL-00 Standard – industry standard – sales area – OVXA – revenue account determination VKOA" },
        { key: "credit_policy_area_code", label: "CREDIT_POLICY_AREA_CODE", required: true, type: "autocomplete", apiUrl: "/api/credit-policy-areas", dataKey: "creditPolicyAreas", codeField: "code", placeholder: "", createUrl: "/foundation/credit-policy-areas", createCode: "FCPC", description: "Credit policy area – credit control area – e.g., CPA-1000 – FCPC OB45 – credit check FD32 OVA8 exposure vs limit – industry standard – sales" },
        { key: "price_group", label: "PRICE_GROUP", placeholder: "", description: "Price group – e.g., 01 – pricing procedure determination – used in VK11 condition records" },
        { key: "customer_group", label: "CUSTOMER_GROUP", placeholder: "", description: "Customer group – e.g., 01 – pricing, account determination" },
        { key: "tax_classification", label: "TAX_CLASSIFICATION", type: "select", options: ["TAXABLE", "EXEMPT", "REVERSE_CHARGE"], placeholder: "", description: "Tax classification – TAXABLE/EXEMPT – tax info – used in tax determination" },
        { key: "account_assignment_group", label: "ACCOUNT_ASSIGNMENT_GROUP", placeholder: "", description: "Account assignment group – e.g., 01 – revenue account determination VKOA – KOFI/KOFK" },
        { key: "is_blocked", label: "IS_BLOCKED", type: "select", options: ["true", "false"], placeholder: "", description: "Blocked – true if customer blocked for sales – credit check" },
        { key: "description", label: "DESCRIPTION", type: "textarea", description: "Additional notes" },
      ]}
      relatedLinks={[
        { code: "ECOC", label: "Commercial Org – sales org – OVX2 – required", route: "/foundation/commercial-orgs", description: "Commercial Organization – sales org" },
        { code: "ESCC", label: "Sales Channel – distribution channel – OVTB – required", route: "/foundation/sales-channels", description: "Sales Channel" },
        { code: "EPLC", label: "Product Line – division – OVXA – required", route: "/foundation/product-lines", description: "Product Line – division" },
        { code: "FCPC", label: "Credit Policy Area – credit control – OB45 – required", route: "/foundation/credit-policy-areas", description: "Credit Policy Area – credit check FD32 OVA8" },
        { code: "FAPT", label: "Payment Terms – NT30 – due date calc", route: "/fico/payment-terms", description: "Payment Terms" },
        { code: "FCYC", label: "Currency – INR/USD", route: "/fico/currencies", description: "Currency master" },
        { code: "FGLC", label: "GL Account – reconciliation – control", route: "/fico/gl-accounts", description: "GL – reconciliation account" },
        { code: "FTXC", label: "Tax Code – GST", route: "/fico/tax-codes", description: "Tax classification" },
        { code: "VASL", label: "Sales Order uses Customer – VA01", route: "/sd/sales-orders", description: "SO – uses customer" },
        { code: "EPAC", label: "Partner Account – central", route: "/foundation/partners", description: "Central partner master" },
      ]}
    />
  );
}
