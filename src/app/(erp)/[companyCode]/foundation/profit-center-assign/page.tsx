"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EBSC"
      sapAlias="EBSC"
      title="Profit Center Assignment"
      description="Define Profit Center Assignment – assigns profit center to legal entity and cost center – strict usage: profit center reporting"
      apiEndpoint="/api/profit-center-assign"
      initialForm={{ profit_center_code: '', legal_entity_code: '', cost_center_code: '', description: '' }}
      fields={[
        { key: "profit_center_code", label: "PROFIT_CENTER_CODE", required: true, placeholder: "PC-1000" },
        { key: "legal_entity_code", label: "LEGAL_ENTITY_CODE", required: true, type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "LE-1000", createUrl: "/foundation/legal-entities", createCode: "ELEC" },
        { key: "cost_center_code", label: "COST_CENTER_CODE", type: "autocomplete", apiUrl: "/api/cost-centers", dataKey: "costCenters", codeField: "code", placeholder: "CC-1000", createUrl: "/fico/cost-centers", createCode: "FCCA" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "ELEC", label: "Legal Entity – required", route: "/foundation/legal-entities", description: "Legal Entity" },
        { code: "FCCA", label: "Cost Center – required", route: "/fico/cost-centers", description: "Cost Center" },
      ]}
    />
  );
}
