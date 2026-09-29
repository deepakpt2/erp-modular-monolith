"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EILC"
      sapAlias="OX09"
      title="Inventory Location"
      description="Define Inventory Location – storage zone bins racks inventory zones – uses Facility"
      apiEndpoint="/api/inventory-locations"
      initialForm={{ code: '', name: '', facility_code: '', location_type: 'PRIMARY', description: '' }}
      fields={[
        { key: "code", label: "INVENTORY_LOCATION_CODE", required: true, placeholder: "IL-1000" },
        { key: "name", label: "INVENTORY_LOCATION_NAME", required: true, placeholder: "Raw Material Store" },
        { key: "facility_code", label: "FACILITY_CODE", required: true, type: "autocomplete", apiUrl: "/api/facilities", dataKey: "facilities", codeField: "code", placeholder: "FAC-1000", createUrl: "/foundation/facilities", createCode: "EFCC" },
        { key: "location_type", label: "LOCATION_TYPE", type: "select", options: ['PRIMARY', 'SECONDARY', 'QUALITY', 'TRANSIT'], placeholder: "PRIMARY" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "EFCC", label: "Facility – required", route: "/foundation/facilities", description: "Facility" },
        { code: "ISTV", label: "Stock Overview uses EILC", route: "/foundation/stock", description: "Stock" },
      ]}
    />
  );
}
