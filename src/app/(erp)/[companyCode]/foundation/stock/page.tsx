"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="ISTV"
      sapAlias="MMBE"
      title="Stock Overview"
      description="Stock Overview – warehouse location quantities immediate inventory balances – strict usage: shows stock per material/facility/location/lot – updated by GR 101/102 GI 261"
      apiEndpoint="/api/stock"
      initialForm={{ material_code: '', facility_code: '', location_code: '', lot_number: '', quantity: '' }}
      fields={[
        { key: "material_code", label: "MATERIAL_CODE", type: "autocomplete", apiUrl: "/api/materials", dataKey: "materials", codeField: "item_number", placeholder: "", createUrl: "/foundation/materials", createCode: "EMTC" },
        { key: "facility_code", label: "FACILITY_CODE", type: "autocomplete", apiUrl: "/api/facilities", dataKey: "facilities", codeField: "code", placeholder: "", createUrl: "/foundation/facilities", createCode: "EFCC" },
        { key: "location_code", label: "INVENTORY_LOCATION_CODE", type: "autocomplete", apiUrl: "/api/inventory-locations", dataKey: "inventoryLocations", codeField: "code", placeholder: "", createUrl: "/foundation/inventory-locations", createCode: "EILC" },
        { key: "lot_number", label: "LOT_NUMBER", type: "autocomplete", apiUrl: "/api/lots", dataKey: "lots", codeField: "lot_number", placeholder: "", createUrl: "/foundation/lots", createCode: "ELTC" },
        { key: "quantity", label: "QUANTITY", placeholder: "" },
      ]}
      relatedLinks={[
        { code: "EMTC", label: "Material – required", route: "/foundation/materials", description: "Material" },
        { code: "EFCC", label: "Facility – required", route: "/foundation/facilities", description: "Facility" },
        { code: "EILC", label: "Inventory Location", route: "/foundation/inventory-locations", description: "Inventory Location" },
        { code: "ELTC", label: "Lot", route: "/foundation/lots", description: "Lot" },
        { code: "IGRC", label: "Goods Receipt updates Stock", route: "/mm/gr", description: "GR 101" },
      ]}
    />
  );
}
