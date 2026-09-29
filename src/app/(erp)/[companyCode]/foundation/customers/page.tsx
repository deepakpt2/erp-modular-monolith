"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="SCUC"
      sapAlias="XD01"
      title="Customer"
      description="Create Customer – customer master sales – partner_account role CUSTOMER + sales view – strict usage: used in SO, Delivery, Billing – credit check, pricing, payment terms"
      apiEndpoint="/api/business-partners"
      initialForm={{ account_number: '', legal_name: '', gst_number: '', pan: '', commercial_org_code: '', credit_policy_area_code: '', payment_term_code: '', description: '' }}
      fields={[
        { key: "account_number", label: "CUSTOMER_CODE", required: true, placeholder: "CUST-1000", description: "Customer code" },
        { key: "legal_name", label: "CUSTOMER_NAME", required: true, placeholder: "Retail Chain Ltd" },
        { key: "gst_number", label: "GST_NUMBER", placeholder: "GSTIN" },
        { key: "pan", label: "PAN", placeholder: "PAN" },
        { key: "commercial_org_code", label: "COMMERCIAL_ORG_CODE", type: "autocomplete", apiUrl: "/api/commercial-orgs", dataKey: "commercialOrgs", codeField: "code", placeholder: "CO-1000", createUrl: "/foundation/commercial-orgs", createCode: "ECOC" },
        { key: "credit_policy_area_code", label: "CREDIT_POLICY_AREA_CODE", type: "autocomplete", apiUrl: "/api/credit-policy-areas", dataKey: "creditPolicyAreas", codeField: "code", placeholder: "CPA-1000", createUrl: "/foundation/credit-policy-areas", createCode: "FCPC", description: "Credit policy – strict usage credit check on SO" },
        { key: "payment_term_code", label: "PAYMENT_TERM_CODE", type: "autocomplete", apiUrl: "/api/payment-terms", dataKey: "paymentTerms", codeField: "code", placeholder: "NT30", createUrl: "/fico/payment-terms", createCode: "FAPT" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "ECOC", label: "Commercial Org – required", route: "/foundation/commercial-orgs", description: "Commercial Org" },
        { code: "FCPC", label: "Credit Policy Area – required", route: "/foundation/credit-policy-areas", description: "Credit Policy" },
        { code: "FAPT", label: "Payment Terms", route: "/fico/payment-terms", description: "Payment Terms" },
        { code: "SSOC", label: "Sales Order uses Customer", route: "/sales", description: "SO" },
      ]}
    />
  );
}
