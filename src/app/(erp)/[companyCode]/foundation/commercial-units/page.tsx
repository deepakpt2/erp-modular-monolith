"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EPUC"
      sapAlias="KE51"
      title="Commercial Unit"
      description="Define Commercial Unit – profitability unit enterprise profit tracking unit reporting"
      apiEndpoint="/api/profit-units"
      initialForm={{ code: '', name: '', legal_entity_code: '', control_area_code: '', description: '' }}
      fields={[
        { key: "code", label: "COMMERCIAL_UNIT_CODE", required: true, placeholder: "CU-1000" },
        { key: "name", label: "COMMERCIAL_UNIT_NAME", required: true, placeholder: "Mumbai Profit Unit" },
        { key: "legal_entity_code", label: "LEGAL_ENTITY_CODE", type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "LE-1000", createUrl: "/foundation/legal-entities", createCode: "ELEC" },
        { key: "control_area_code", label: "CONTROL_AREA_CODE", placeholder: "CA-1000" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "ELEC", label: "Legal Entity – required", route: "/foundation/legal-entities", description: "Legal Entity" },
        { code: "ECUC", label: "Commercial Unit Assignment", route: "/foundation/commercial-unit-assign", description: "Assignment" },
      ]}
    />
  );
}
