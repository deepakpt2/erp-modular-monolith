"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="PSUC"
      sapAlias="XK01"
      title="Supplier"
      description="Create Supplier – vendor master procurement – partner_account role VENDOR + procurement view – strict usage: used in PO, GR, IV – credit check, payment terms"
      apiEndpoint="/api/business-partners"
      initialForm={{ account_number: '', legal_name: '', gst_number: '', pan: '', procurement_division_code: '', payment_term_code: '', description: '' }}
      fields={[
        { key: "account_number", label: "SUPPLIER_CODE", required: true, placeholder: "SUP-1000", description: "Supplier code – account_number" },
        { key: "legal_name", label: "SUPPLIER_NAME", required: true, placeholder: "ABC Traders" },
        { key: "gst_number", label: "GST_NUMBER", placeholder: "GSTIN" },
        { key: "pan", label: "PAN", placeholder: "PAN" },
        { key: "procurement_division_code", label: "PROCUREMENT_DIVISION_CODE", type: "autocomplete", apiUrl: "/api/procurement-divisions", dataKey: "procurementDivisions", codeField: "code", placeholder: "PD-100", createUrl: "/foundation/procurement-divisions", createCode: "EPDC" },
        { key: "payment_term_code", label: "PAYMENT_TERM_CODE", type: "autocomplete", apiUrl: "/api/payment-terms", dataKey: "paymentTerms", codeField: "code", placeholder: "NT30", createUrl: "/fico/payment-terms", createCode: "FAPT", description: "Payment term – strict usage due date calc" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "EPDC", label: "Procurement Division – required", route: "/foundation/procurement-divisions", description: "Procurement Division" },
        { code: "FAPT", label: "Payment Terms", route: "/fico/payment-terms", description: "Payment Terms" },
        { code: "PPOC", label: "Purchase Order uses Supplier", route: "/mm/po", description: "PO" },
      ]}
    />
  );
}
