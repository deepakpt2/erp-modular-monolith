"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EBTC"
      sapAlias="OME4"
      title="Buyer Team"
      description="Define Buyer Team – procurement group buyer profile contact assignment"
      apiEndpoint="/api/buyer-teams"
      initialForm={{ code: '', name: '', procurement_division_code: '', email: '', phone: '' }}
      fields={[
        { key: "code", label: "BUYER_TEAM_CODE", required: true, placeholder: "" },
        { key: "name", label: "BUYER_TEAM_NAME", required: true, placeholder: "" },
        { key: "procurement_division_code", label: "PROCUREMENT_DIVISION_CODE", required: true, type: "autocomplete", apiUrl: "/api/procurement-divisions", dataKey: "procurementDivisions", codeField: "code", placeholder: "", createUrl: "/foundation/procurement-divisions", createCode: "EPDC" },
        { key: "email", label: "EMAIL", placeholder: "" },
        { key: "phone", label: "PHONE", placeholder: "" },
      ]}
      relatedLinks={[
        { code: "EPDC", label: "Procurement Division – required", route: "/foundation/procurement-divisions", description: "Procurement Division" },
      ]}
    />
  );
}
