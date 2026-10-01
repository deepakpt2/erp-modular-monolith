"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="OBA0"
      sapAlias="OBA0"
      title="Tolerance Groups – General Ledger"
      description="Define Tolerance Groups for General Ledger – defines tolerance for GL posting differences – strict usage: allows small differences within tolerance"
      apiEndpoint="/api/tolerance-groups"
      initialForm={{ code: '', name: '', type: 'GL', lower_limit: '0', upper_limit: '10000', description: '' }}
      fields={[
        { key: "code", label: "TOLERANCE_GROUP_CODE", required: true, placeholder: "", description: "Tolerance group code – e.g., GL-01" },
        { key: "name", label: "TOLERANCE_GROUP_NAME", required: true, placeholder: "" },
        { key: "type", label: "TYPE", type: "select", options: ['GL', 'EMPLOYEE', 'CUSTOMER', 'VENDOR', 'AP', 'AR'], placeholder: "", description: "Type – GL for general ledger" },
        { key: "lower_limit", label: "LOWER_LIMIT", placeholder: "", description: "Lower limit amount" },
        { key: "upper_limit", label: "UPPER_LIMIT", placeholder: "", description: "Upper limit – allows differences up to this" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "OBA4", label: "Tolerance Customer/Vendor", route: "/fico/tolerance-groups-cv", description: "Customer/Vendor tolerance" },
        { code: "FPYP", label: "Payment uses Tolerance", route: "/fico/payment", description: "Payment tolerance check" },
      ]}
    />
  );
}
