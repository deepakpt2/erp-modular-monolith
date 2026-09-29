"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="MBMC"
      sapAlias="CS01"
      title="Bill of Materials"
      description="Create BOM – Bills of Material – product structure design components engineering recipe – strict usage: production order consumes BOM components"
      apiEndpoint="/api/bom"
      initialForm={{ code: '', material_code: '', plant_code: '', quantity: '1', description: '' }}
      fields={[
        { key: "code", label: "BOM_CODE", required: true, placeholder: "BOM-1000" },
        { key: "material_code", label: "MATERIAL_CODE", required: true, type: "autocomplete", apiUrl: "/api/materials", dataKey: "materials", codeField: "item_number", placeholder: "MAT-1000", createUrl: "/foundation/materials", createCode: "EMTC", description: "Material to produce – header material" },
        { key: "plant_code", label: "PLANT_CODE", required: true, type: "autocomplete", apiUrl: "/api/facilities", dataKey: "facilities", codeField: "code", placeholder: "FAC-1000", createUrl: "/foundation/facilities", createCode: "EFCC" },
        { key: "quantity", label: "BASE_QUANTITY", placeholder: "1", description: "Base quantity – e.g., 1 unit of header material" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "EMTC", label: "Material – required", route: "/foundation/materials", description: "Material" },
        { code: "EFCC", label: "Facility – required", route: "/foundation/facilities", description: "Plant" },
        { code: "MMOC", label: "Production Order uses BOM", route: "/pp/production-orders", description: "Production Order" },
      ]}
    />
  );
}
