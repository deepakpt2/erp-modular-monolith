"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page({ defaultMode, codeOverride, titleOverride }: { defaultMode?: any; codeOverride?: string; titleOverride?: string } = {}) {
  return (
    <SingleCodePage
      defaultMode={defaultMode}
      code={codeOverride || "FCCA"}
      sapAlias="KS01"
      title={titleOverride || "Cost Units – Cost Centers"}
      description="Create Cost Unit – General ERP term Cost Unit, alias Cost Center KS01 – code + legal entity – e.g., CC-1000 – strict usage: cost unit required for expense GL via field status OBC5, actuals via CCA report KSB1, production order cost, payroll posting – T0 BLOCKING – NO DANGLING"
      apiEndpoint="/api/cost-centers"
      initialForm={{ code: '', name: '', company_code: '', legal_entity_code: '', control_area_code: '', description: '' }}
      fields={[
        { key: "code", label: "COST_UNIT_CODE", required: true, placeholder: "", description: "Cost Unit code – General ERP Cost Unit, alias Cost Center KS01 – e.g., CU-1000, CC-1000 – used as FK in expense postings, production orders, payroll – T0 BLOCKING" },
        { key: "name", label: "COST_UNIT_NAME", required: true, placeholder: "", description: "Cost Unit name – e.g., Production, Sales, Admin – used in CCA reporting" },
        { key: "legal_entity_code", label: "LEGAL_ENTITY_CODE", required: true, type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "", createUrl: "/foundation/legal-entities", createCode: "ELEC", description: "Legal Entity FK – company code – General ERP Legal Entity, alias Company Code OX02" },
        { key: "company_code", label: "COMPANY_CODE_LEGACY", type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "", createUrl: "/foundation/legal-entities", createCode: "ELEC", description: "Legacy alias for legal_entity_code" },
        { key: "control_area_code", label: "CONTROL_AREA_CODE", placeholder: "", description: "Management Control Area – General ERP Control Area, alias Controlling Area OX06 – groups cost units" },
        { key: "description", label: "DESCRIPTION", type: "textarea", description: "Description – used in reporting – cost unit purpose" },
      ]}
      relatedLinks={[
        { code: "ELEC", label: "Legal Entity – required – company code", route: "/foundation/legal-entities", description: "Legal Entity ELEC (legacy OX02) – required" },
        { code: "FFSG", label: "Field Status Groups – cost unit required", route: "/fico/field-status-groups", description: "Field Status OBC5 – cost unit field required/suppressed" },
        { code: "CCUL", label: "Cost Actuals Report – uses Cost Unit", route: "/fico/cca-report", description: "CCA Report KSB1 – actual line items per cost unit" },
        { code: "MMOC", label: "Manufacturing Order – uses Cost Unit", route: "/pp/production-orders", description: "Manufacturing Order MMOC (legacy CO01) – cost unit for costing" },
        { code: "HPYC", label: "Payroll Run – posts to Cost Unit", route: "/hr/payroll-run", description: "Payroll PC00 – salary expense to cost unit" },
      ]}
    />
  );
}
