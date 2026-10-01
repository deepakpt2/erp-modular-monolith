"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EPAC"
      sapAlias="BP01"
      title="Partner Account – Central Business Partner"
      description="Create Partner Account – central business partner master – role VENDOR/CUSTOMER/BOTH/EMPLOYEE/CONTACT – display name legal name gst pan tax id email phone address currency – strict industry standard: central partner used by supplier (PSUC XK01) and customer (SCUC XD01) – contextual views vendor/customer – T0 BLOCKING – own names"
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
        alternate_phone: '',
        website: '',
        address_line1: '',
        address_line2: '',
        city: '',
        region: '',
        postal_code: '',
        country: 'IN',
        currency_code: 'INR',
        is_blocked: 'false',
        is_one_time: 'false',
        description: '' 
      }}
      fields={[
        { key: "account_number", label: "PARTNER_CODE", required: true, placeholder: "", description: "Partner code – unique – account_number – e.g., BP-1000 – central business partner number – industry standard – own name" },
        { key: "display_name", label: "DISPLAY_NAME", required: true, placeholder: "", description: "Display name – short – e.g., ABC Traders – used in PO, SO" },
        { key: "legal_name", label: "LEGAL_NAME", required: true, placeholder: "", description: "Legal registered name – full legal name" },
        { key: "role", label: "PARTNER_ROLE", required: true, type: "select", options: ["VENDOR", "CUSTOMER", "BOTH", "EMPLOYEE", "CONTACT"], placeholder: "", description: "Basic partner role – VENDOR for supplier, CUSTOMER for customer, BOTH for both, EMPLOYEE, CONTACT – industry standard – determines which profile (vendor/customer) is created" },
        { key: "gst_number", label: "GST_NUMBER", placeholder: "", description: "Tax information – GSTIN – India GST – tax info – industry standard – used in tax determination" },
        { key: "pan_number", label: "PAN_NUMBER", placeholder: "", description: "Tax info – PAN – India PAN – tax information" },
        { key: "tax_id", label: "TAX_ID", placeholder: "", description: "Tax ID – additional tax classification – e.g., VAT ID" },
        { key: "email", label: "EMAIL", placeholder: "", description: "Contact email – communication" },
        { key: "phone", label: "PHONE", placeholder: "", description: "Primary phone" },
        { key: "alternate_phone", label: "ALTERNATE_PHONE", placeholder: "", description: "Alternate phone" },
        { key: "website", label: "WEBSITE", placeholder: "", description: "Website" },
        { key: "address_line1", label: "ADDRESS_LINE1", placeholder: "", description: "Address line 1" },
        { key: "address_line2", label: "ADDRESS_LINE2", placeholder: "", description: "Address line 2" },
        { key: "city", label: "CITY", placeholder: "", description: "City" },
        { key: "region", label: "REGION_STATE", placeholder: "", description: "State/Region – e.g., Maharashtra – tax determination place of supply" },
        { key: "postal_code", label: "POSTAL_CODE", placeholder: "", description: "Postal code – PIN" },
        { key: "country", label: "COUNTRY", placeholder: "", description: "Country code – e.g., IN – ISO country" },
        { key: "currency_code", label: "CURRENCY_CODE", type: "autocomplete", apiUrl: "/api/currencies", dataKey: "currencies", codeField: "code", placeholder: "", createUrl: "/fico/currencies", createCode: "FCYC", description: "Currency – e.g., INR, USD – currency – industry standard – used in PO, SO, IV, Billing – payment currency" },
        { key: "is_blocked", label: "IS_BLOCKED", type: "select", options: ["true", "false"], placeholder: "", description: "Blocked – true if partner blocked for all transactions – industry standard" },
        { key: "is_one_time", label: "IS_ONE_TIME", type: "select", options: ["true", "false"], placeholder: "", description: "One-time partner – true if one-time vendor/customer – industry standard – e.g., CPD one-time" },
        { key: "description", label: "DESCRIPTION", type: "textarea", description: "Additional notes – partner description" },
      ]}
      relatedLinks={[
        { code: "PSUC", label: "Supplier – vendor – uses Partner role VENDOR", route: "/foundation/suppliers", description: "Supplier requires partner role VENDOR – procurement view – payment terms, currency, reconciliation account" },
        { code: "SCUC", label: "Customer – customer – uses Partner role CUSTOMER", route: "/foundation/customers", description: "Customer requires role CUSTOMER – sales view – sales org/channel, pricing, credit check" },
        { code: "EPCC", label: "Partner Contact – multiple contacts per partner", route: "/foundation/partner-contacts", description: "Contact – multiple contacts per partner – primary, billing, shipping" },
        { code: "FAPT", label: "Payment Terms – NT30", route: "/fico/payment-terms", description: "Payment Terms – due date calc" },
        { code: "FCYC", label: "Currency – INR/USD", route: "/fico/currencies", description: "Currency master" },
        { code: "FGLC", label: "GL Account – reconciliation account", route: "/fico/gl-accounts", description: "GL – reconciliation/control account – vendor/customer to GL" },
        { code: "FTXC", label: "Tax Code – GST", route: "/fico/tax-codes", description: "Tax classification – HSN, tax info" },
      ]}
    />
  );
}
