"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EPUC"
      sapAlias="KE51"
      title="Profit Units – Commercial Units"
      description="Define Profit Unit – General ERP term Profit Unit, alias Profit Center KE51, Commercial Unit – profitability unit – enterprise profit tracking – reporting by profit unit – strict usage: assigned to cost unit, product, sales order, billing – profit reporting – T0 BLOCKING"
      apiEndpoint="/api/profit-units"
      referenceConfig={{
        keyField: "code",
        displayField: "name",
        label: "Create with Reference – Copy Profit Center / Unit (KE51)",
        excludedFields: ["code", "id", "created_at", "updated_at"]
      }}
      initialForm={{ code: '', name: '', legal_entity_code: '', control_area_code: '', description: '' }}
      fields={[
        { key: "code", label: "PROFIT_UNIT_CODE", required: true, placeholder: "", description: "Profit Unit code – General ERP Profit Unit, alias Profit Center KE51, Commercial Unit – e.g., PU-1000 – used in profit reporting – T0" },
        { key: "name", label: "PROFIT_UNIT_NAME", required: true, placeholder: "", description: "Profit Unit name – e.g., Mumbai, Production, Sales – used in reporting" },
        { key: "legal_entity_code", label: "LEGAL_ENTITY_CODE", type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "", createUrl: "/foundation/legal-entities", createCode: "ELEC", description: "Legal Entity FK – General ERP Legal Entity, alias Company Code OX02" },
        { key: "control_area_code", label: "CONTROL_AREA_CODE", placeholder: "", description: "Management Control Area – General ERP Control Area, alias Controlling Area OX06" },
        { key: "description", label: "DESCRIPTION", type: "textarea", description: "Description – profit unit purpose" },
      ]}
      relatedLinks={[
        { code: "ELEC", label: "Legal Entity – required", route: "/foundation/legal-entities", description: "Legal Entity OX02" },
        { code: "FCCA", label: "Cost Unit – assigned to Profit Unit", route: "/fico/cost-centers", description: "Cost Unit KS01" },
        { code: "ECUC", label: "Commercial Unit Assignment – profit reporting", route: "/foundation/commercial-unit-assign", description: "Assignment – profit unit to legal entity" },
      ]}
    />
  );
}
