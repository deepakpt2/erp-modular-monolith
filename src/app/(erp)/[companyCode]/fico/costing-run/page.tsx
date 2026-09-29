"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="CCRP"
      sapAlias="CK40N"
      title="Product Costing Run"
      description="Product Costing Run – BOM cost rollup recursive phantom async – calculates total cost of finished product based on moving average price of raw components in active BOM + labor cost + overhead – strict usage: costing run updates standard price of finished product in material master – uses BomCostingService with recursive explosion, scrap factor, phantom kits – no dummy"
      apiEndpoint="/api/costing-run"
      initialForm={{ plant_code: '', material_code: '', description: '' }}
      fields={[
        { key: "plant_code", label: "PLANT_CODE", required: true, type: "autocomplete", apiUrl: "/api/facilities", dataKey: "facilities", codeField: "code", placeholder: "FAC-1000", createUrl: "/foundation/facilities", createCode: "EFCC", description: "Plant code – facility where BOM is defined" },
        { key: "material_code", label: "MATERIAL_CODE", type: "autocomplete", apiUrl: "/api/materials", dataKey: "materials", codeField: "item_number", placeholder: "MAT-1000", createUrl: "/foundation/materials", createCode: "EMTC", description: "Material to cost – finished product – if empty costs all materials in plant" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "Costing run for April 2026" },
      ]}
      relatedLinks={[
        { code: "MBMC", label: "BOM – required", route: "/pp/bom", description: "BOM with components" },
        { code: "MWCC", label: "Work Center – labor cost", route: "/pp/work-centers", description: "Work Center with cost rate" },
        { code: "MRTC", label: "Routing – operations", route: "/pp/routings", description: "Routing with operations" },
        { code: "EMTC", label: "Material – finished product", route: "/foundation/materials", description: "Material" },
        { code: "EFCC", label: "Facility – plant", route: "/foundation/facilities", description: "Plant" },
      ]}
    />
  );
}
