"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EPCC"
      sapAlias="EPCC"
      title="Partner Contact"
      description="Create Partner Contact – multiple contacts per partner – primary billing shipping purchasing – strict usage: contact used in PO/SO communication"
      apiEndpoint="/api/partner-contacts"
      initialForm={{ partner_code: '', contact_name: '', email: '', phone: '', contact_type: 'PRIMARY', description: '' }}
      fields={[
        { key: "partner_code", label: "PARTNER_CODE", required: true, type: "autocomplete", apiUrl: "/api/business-partners", dataKey: "businessPartners", codeField: "account_number", placeholder: "", createUrl: "/foundation/partners", createCode: "EPAC", description: "Partner FK" },
        { key: "contact_name", label: "CONTACT_NAME", required: true, placeholder: "" },
        { key: "email", label: "EMAIL", placeholder: "" },
        { key: "phone", label: "PHONE", placeholder: "" },
        { key: "contact_type", label: "CONTACT_TYPE", type: "select", options: ['PRIMARY', 'BILLING', 'SHIPPING', 'PURCHASING', 'SALES', 'TECHNICAL', 'FINANCE'], placeholder: "" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "EPAC", label: "Partner Account – required", route: "/foundation/partners", description: "Partner" },
        { code: "PSUC", label: "Supplier", route: "/foundation/suppliers", description: "Supplier" },
        { code: "SCUC", label: "Customer", route: "/foundation/customers", description: "Customer" },
      ]}
    />
  );
}
