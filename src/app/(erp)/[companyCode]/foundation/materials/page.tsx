"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EMTC"
      sapAlias="MM01"
      title="Product Master"
      description="Create Product – product master SKU record – item_number base_unit RAW FINISHED SEMI – strict usage: used in PR PO GR IV SO DL BL BOM Routing – auto account valuation class"
      apiEndpoint="/api/materials"
      initialForm={{ item_number: '', name: '', base_unit: 'PC', material_type: 'FINISHED', category_code: '', description: '' }}
      fields={[
        { key: "item_number", label: "PRODUCT_CODE", required: true, placeholder: "MAT-1000", description: "Product code – item_number – e.g., MAT-1000 – unique" },
        { key: "name", label: "PRODUCT_NAME", required: true, placeholder: "Premium Spice Mix" },
        { key: "base_unit", label: "BASE_UNIT", required: true, type: "autocomplete", apiUrl: "/api/uom", dataKey: "uom", codeField: "code", placeholder: "PC", createUrl: "/foundation/uom", createCode: "EUOC", description: "Base unit FK – must exist via EUOC – KG/PC/BOX" },
        { key: "material_type", label: "PRODUCT_TYPE", required: true, type: "autocomplete", apiUrl: "/api/material-types", dataKey: "materialTypes", codeField: "code", placeholder: "FINISHED", createUrl: "/foundation/material-types", createCode: "EMTP", description: "Product type FK – RAW/FINISHED/SEMI – determines valuation class for auto account" },
        { key: "category_code", label: "PRODUCT_CATEGORY_CODE", type: "autocomplete", apiUrl: "/api/material-categories", dataKey: "materialCategories", codeField: "code", placeholder: "CAT-SPICE", createUrl: "/foundation/material-categories", createCode: "EMGC", description: "Product category FK" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "EMTP", label: "Product Types – required", route: "/foundation/material-types", description: "Product Type" },
        { code: "EUOC", label: "UOM – required", route: "/foundation/uom", description: "Units of Measure" },
        { code: "EMGC", label: "Product Categories", route: "/foundation/material-categories", description: "Categories" },
        { code: "PSUC", label: "Supplier – for PO", route: "/foundation/suppliers", description: "Supplier" },
        { code: "MBMC", label: "BOM uses Product", route: "/pp/bom", description: "BOM" },
        { code: "MRTC", label: "Routing uses Product", route: "/pp/routings", description: "Routing" },
        { code: "ISTV", label: "Stock Overview", route: "/foundation/stock", description: "Stock" },
      ]}
    />
  );
}
