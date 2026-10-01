"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EFCC"
      sapAlias="OX10"
      title="Facility"
      description="Define Facility – operational site manufacturing plant distribution fulfillment physical hub – uses Legal Entity"
      apiEndpoint="/api/facilities"
      initialForm={{ code: '', name: '', legal_entity_code: '', city: '', country: 'IN', address: '', description: '' }}
      fields={[
        { key: "code", label: "FACILITY_CODE", required: true, placeholder: "", description: "Facility code – e.g., FAC-1000" },
        { key: "name", label: "FACILITY_NAME", required: true, placeholder: "" },
        { key: "legal_entity_code", label: "LEGAL_ENTITY_CODE", required: true, type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "", createUrl: "/foundation/legal-entities", createCode: "ELEC", description: "Legal Entity FK – must exist via ELEC" },
        { key: "city", label: "CITY", placeholder: "" },
        { key: "country", label: "COUNTRY", placeholder: "" },
        { key: "address", label: "ADDRESS", type: "textarea", placeholder: "" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "" },
      ]}
      relatedLinks={[
        { code: "ELEC", label: "Legal Entity – required", route: "/foundation/legal-entities", description: "Legal Entity" },
        { code: "EILC", label: "Inventory Location uses EFCC", route: "/foundation/inventory-locations", description: "Inventory Location requires Facility" },
        { code: "EWSC", label: "Warehouse Site uses EFCC", route: "/foundation/warehouse-sites", description: "Warehouse Site" },
      ]}
    />
  );
}
