"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EPAC"
      sapAlias="BP01"
      title="Partner Account"
      description="Create Partner Account – central master role VENDOR/CUSTOMER/BOTH – display name legal name gst pan tax id – strict usage: central partner used by supplier and customer"
      apiEndpoint="/api/business-partners"
      initialForm={{ account_number: '', legal_name: '', display_name: '', role: 'VENDOR', gst_number: '', pan: '', description: '' }}
      fields={[
        { key: "account_number", label: "PARTNER_CODE", required: true, placeholder: "BP-1000", description: "Partner code – account_number" },
        { key: "legal_name", label: "LEGAL_NAME", required: true, placeholder: "ABC Traders Pvt Ltd" },
        { key: "display_name", label: "DISPLAY_NAME", placeholder: "ABC Traders" },
        { key: "role", label: "ROLE", required: true, type: "select", options: ['VENDOR', 'CUSTOMER', 'BOTH'], placeholder: "VENDOR", description: "Role – VENDOR for supplier, CUSTOMER for customer, BOTH for both" },
        { key: "gst_number", label: "GST_NUMBER", placeholder: "GSTIN" },
        { key: "pan", label: "PAN", placeholder: "PAN" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "PSUC", label: "Supplier uses Partner", route: "/foundation/suppliers", description: "Supplier requires partner role VENDOR" },
        { code: "SCUC", label: "Customer uses Partner", route: "/foundation/customers", description: "Customer requires role CUSTOMER" },
        { code: "EPCC", label: "Partner Contact uses Partner", route: "/foundation/partner-contacts", description: "Contact" },
      ]}
    />
  );
}
