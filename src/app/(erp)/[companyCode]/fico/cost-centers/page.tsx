"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FCCA"
      sapAlias="KS01"
      title="Cost Centers"
      description="Create Cost Center – code company_code – e.g., KS-CC-01..05 – strict usage: cost center required for expense GL via field status OBC5, actuals via CCA report"
      apiEndpoint="/api/cost-centers"
      initialForm={{ code: '', name: '', company_code: '', description: '' }}
      fields={[
        { key: "code", label: "COST_CENTER_CODE", required: true, placeholder: "CC-1000" },
        { key: "name", label: "COST_CENTER_NAME", required: true, placeholder: "Production Cost Center" },
        { key: "company_code", label: "LEGAL_ENTITY_CODE", required: true, type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "LE-1000", createUrl: "/foundation/legal-entities", createCode: "ELEC", description: "Legal Entity FK – company code" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "ELEC", label: "Legal Entity – required", route: "/foundation/legal-entities", description: "Legal Entity" },
        { code: "OBC5", label: "Field Status Groups – cost center required", route: "/fico/field-status-groups", description: "Field Status" },
        { code: "CCUL", label: "CCA Report uses Cost Center", route: "/fico/cca-report", description: "CCA Report" },
      ]}
    />
  );
}
