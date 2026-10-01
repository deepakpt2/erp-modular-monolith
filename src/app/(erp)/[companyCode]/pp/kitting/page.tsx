"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="MKTC"
      sapAlias="KITTING"
      title="Kitting – Assembly"
      description="Kitting – Stocked K01/K02 – raw component bundling material pre-packaging – strict usage: kitting assembly consumes components produces kit"
      apiEndpoint="/api/kitting"
      initialForm={{ kit_material_code: '', component_material_code: '', quantity: '1', plant_code: '', description: '' }}
      fields={[
        { key: "kit_material_code", label: "KIT_PRODUCT_CODE", required: true, type: "autocomplete", apiUrl: "/api/materials", dataKey: "materials", codeField: "item_number", placeholder: "", createUrl: "/foundation/materials", createCode: "EMTC", description: "Kit material – finished kit" },
        { key: "component_material_code", label: "COMPONENT_PRODUCT_CODE", required: true, type: "autocomplete", apiUrl: "/api/materials", dataKey: "materials", codeField: "item_number", placeholder: "", createUrl: "/foundation/materials", createCode: "EMTC", description: "Component material – raw" },
        { key: "quantity", label: "QUANTITY", required: true, placeholder: "" },
        { key: "plant_code", label: "PLANT_CODE", type: "autocomplete", apiUrl: "/api/facilities", dataKey: "facilities", codeField: "code", placeholder: "", createUrl: "/foundation/facilities", createCode: "EFCC" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "EMTC", label: "Product – required", route: "/foundation/materials", description: "Material" },
        { code: "EFCC", label: "Facility – required", route: "/foundation/facilities", description: "Facility" },
      ]}
    />
  );
}
