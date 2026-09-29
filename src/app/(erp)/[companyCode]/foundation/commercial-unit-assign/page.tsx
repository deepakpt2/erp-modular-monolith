"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="ECUC"
      sapAlias="ECUC"
      title="Commercial Unit Assignment"
      description="Define Commercial Unit Assignment – assigns commercial unit to legal entity – strict usage: profit reporting by commercial unit"
      apiEndpoint="/api/commercial-unit-assign"
      initialForm={{ commercial_unit_code: '', legal_entity_code: '', description: '' }}
      fields={[
        { key: "commercial_unit_code", label: "COMMERCIAL_UNIT_CODE", required: true, type: "autocomplete", apiUrl: "/api/profit-units", dataKey: "profitUnits", codeField: "code", placeholder: "CU-1000", createUrl: "/foundation/commercial-units", createCode: "EPUC", description: "Commercial Unit FK" },
        { key: "legal_entity_code", label: "LEGAL_ENTITY_CODE", required: true, type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "LE-1000", createUrl: "/foundation/legal-entities", createCode: "ELEC" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "EPUC", label: "Commercial Unit – required", route: "/foundation/commercial-units", description: "Commercial Unit" },
        { code: "ELEC", label: "Legal Entity – required", route: "/foundation/legal-entities", description: "Legal Entity" },
      ]}
    />
  );
}
