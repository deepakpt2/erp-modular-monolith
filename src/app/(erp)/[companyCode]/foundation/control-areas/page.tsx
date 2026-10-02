"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="ECAC"
      sapAlias="OX06"
      title="Management Control Area"
      description="Define Management Control Area – operational boundary for management accounting, cost center accounting, profit center accounting, and product costing – former Controlling Area OX06"
      apiEndpoint="/api/control-areas"
      initialForm={{ code: '', name: '', currency_code: 'INR', description: '' }}
      fields={[
        { key: "code", label: "CONTROL_AREA_CODE", required: true, placeholder: "", description: "Control Area identifier – e.g. CA01, 1000 – primary management accounting boundary" },
        { key: "name", label: "CONTROL_AREA_NAME", required: true, placeholder: "", description: "Controlling Area description – e.g. Controlling Area India" },
        { key: "currency_code", label: "CURRENCY_CODE", required: true, type: "autocomplete", apiUrl: "/api/currencies", dataKey: "currencies", codeField: "code", placeholder: "", createUrl: "/fico/currencies", createCode: "FCYC", description: "Controlling Area currency – management accounting base currency" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "", description: "Detailed description and operational scope" },
      ]}
      relatedLinks={[
        { code: "FCCA_ASSIGN", label: "Assign Company Code to Controlling Area (OX19)", route: "/fico/assignments/controlling-area", description: "Customizing table assigning Legal Entities to Controlling Area" },
        { code: "ELEC", label: "Legal Entity (OX02)", route: "/foundation/legal-entities", description: "Company Code / Legal Entity definition" },
        { code: "FCOC", label: "Cost Center (KS01)", route: "/fico/cost-centers", description: "Cost Center requires valid Control Area" },
        { code: "EPUC", label: "Profit Center (KE51)", route: "/foundation/commercial-units", description: "Profit Unit / Profit Center requires valid Control Area" },
      ]}
    />
  );
}
