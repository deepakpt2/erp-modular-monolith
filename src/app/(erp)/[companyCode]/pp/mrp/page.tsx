"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="MMRP"
      sapAlias="MD01"
      title="Requirements Planning"
      description="MRP Run – Material Requirements Planning – demand forecasting engine net requirements calculation – strict usage: SO demand – supply stock PO prod order = planned order/PR – no dummy"
      apiEndpoint="/api/mrp"
      initialForm={{ material_code: '', plant_code: '', demand_quantity: '', description: '' }}
      fields={[
        { key: "material_code", label: "PRODUCT_CODE", required: true, type: "autocomplete", apiUrl: "/api/materials", dataKey: "materials", codeField: "item_number", placeholder: "", createUrl: "/foundation/materials", createCode: "EMTC", description: "Material to plan – net requirements" },
        { key: "plant_code", label: "PLANT_CODE", required: true, type: "autocomplete", apiUrl: "/api/facilities", dataKey: "facilities", codeField: "code", placeholder: "", createUrl: "/foundation/facilities", createCode: "EFCC" },
        { key: "demand_quantity", label: "DEMAND_QUANTITY", placeholder: "", description: "Demand quantity – e.g., from SO" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "EMTC", label: "Product – required", route: "/foundation/materials", description: "Material" },
        { code: "EFCC", label: "Facility – required", route: "/foundation/facilities", description: "Facility" },
        { code: "SSOC", label: "Sales Order creates Demand", route: "/sales", description: "SO demand" },
        { code: "PPRC", label: "PR created by MRP", route: "/mm/pr", description: "Purchase Request" },
        { code: "MMOC", label: "Production Order created by MRP", route: "/pp/production-orders", description: "Production Order" },
      ]}
    />
  );
}
