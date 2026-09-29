"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="MRTC"
      sapAlias="CA01"
      title="Routing"
      description="Create Routing – Sequence of Manufacturing Steps – production operations sequence process plan template – strict usage: production order uses routing operations, work center per operation"
      apiEndpoint="/api/routings"
      initialForm={{ code: '', material_code: '', plant_code: '', description: '' }}
      fields={[
        { key: "code", label: "ROUTING_CODE", required: true, placeholder: "RT-1000" },
        { key: "material_code", label: "MATERIAL_CODE", required: true, type: "autocomplete", apiUrl: "/api/materials", dataKey: "materials", codeField: "item_number", placeholder: "MAT-1000", createUrl: "/foundation/materials", createCode: "EMTC" },
        { key: "plant_code", label: "PLANT_CODE", required: true, type: "autocomplete", apiUrl: "/api/facilities", dataKey: "facilities", codeField: "code", placeholder: "FAC-1000", createUrl: "/foundation/facilities", createCode: "EFCC" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "EMTC", label: "Material – required", route: "/foundation/materials", description: "Material" },
        { code: "EFCC", label: "Facility – required", route: "/foundation/facilities", description: "Facility" },
        { code: "MWCC", label: "Work Center uses Routing", route: "/pp/work-centers", description: "Work Center" },
        { code: "MMOC", label: "Production Order uses Routing", route: "/pp/production-orders", description: "Production Order" },
      ]}
    />
  );
}
