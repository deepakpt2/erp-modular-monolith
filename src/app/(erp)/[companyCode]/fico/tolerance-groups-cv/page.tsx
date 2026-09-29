"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="OBA4"
      sapAlias="OBA4"
      title="Tolerance Groups – Customers/Vendors"
      description="Define Tolerance Groups for Customers/Vendors – defines tolerance for payment differences – strict usage: if invoice 100 and payment 99.90 within tolerance, allow clearing"
      apiEndpoint="/api/tolerance-groups"
      initialForm={{ code: '', name: '', type: 'VENDOR', lower_limit: '0', upper_limit: '100', description: '' }}
      fields={[
        { key: "code", label: "TOLERANCE_GROUP_CODE", required: true, placeholder: "VEND-01" },
        { key: "name", label: "TOLERANCE_GROUP_NAME", required: true, placeholder: "Vendor Tolerance 100" },
        { key: "type", label: "TYPE", type: "select", options: ['CUSTOMER', 'VENDOR', 'AP', 'AR'], placeholder: "VENDOR", description: "CUSTOMER for AR, VENDOR for AP" },
        { key: "lower_limit", label: "LOWER_LIMIT", placeholder: "0" },
        { key: "upper_limit", label: "UPPER_LIMIT", placeholder: "100", description: "Allows payment differences up to 100" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "OBA0", label: "Tolerance GL", route: "/fico/tolerance-groups-gl", description: "GL tolerance" },
        { code: "FPYP", label: "Payment", route: "/fico/payment", description: "Payment" },
      ]}
    />
  );
}
