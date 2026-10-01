"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="ECOC"
      sapAlias="OVX2"
      title="Commercial Organization"
      description="Define Commercial Organization – sales organization corporate division entity commercial trade"
      apiEndpoint="/api/commercial-orgs"
      initialForm={{ code: '', name: '', legal_entity_code: '', currency_code: 'INR', description: '' }}
      fields={[
        { key: "code", label: "COMMERCIAL_ORG_CODE", required: true, placeholder: "" },
        { key: "name", label: "COMMERCIAL_ORG_NAME", required: true, placeholder: "" },
        { key: "legal_entity_code", label: "LEGAL_ENTITY_CODE", required: true, type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "", createUrl: "/foundation/legal-entities", createCode: "ELEC" },
        { key: "currency_code", label: "CURRENCY_CODE", type: "autocomplete", apiUrl: "/api/currencies", dataKey: "currencies", codeField: "code", placeholder: "", createUrl: "/fico/currencies", createCode: "FCYC" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "ELEC", label: "Legal Entity – required", route: "/foundation/legal-entities", description: "Legal Entity" },
        { code: "ESCC", label: "Sales Channel uses ECOC", route: "/foundation/sales-channels", description: "Sales Channel" },
      ]}
    />
  );
}
