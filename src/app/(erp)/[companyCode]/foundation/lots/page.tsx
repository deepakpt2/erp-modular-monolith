"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="ELTC"
      sapAlias="MSC3N"
      title="Lot Management"
      description="Define Lots – batch numbers expiry manufacturing date inventory tracking – strict usage: lot tracked in stock and GR"
      apiEndpoint="/api/lots"
      initialForm={{ lot_number: '', material_code: '', facility_code: '', expiry_date: '', manufacturing_date: '', description: '' }}
      fields={[
        { key: "lot_number", label: "LOT_NUMBER", required: true, placeholder: "LOT-1000", description: "Lot number – batch" },
        { key: "material_code", label: "MATERIAL_CODE", required: true, type: "autocomplete", apiUrl: "/api/materials", dataKey: "materials", codeField: "item_number", placeholder: "MAT-1000", createUrl: "/foundation/materials", createCode: "EMTC" },
        { key: "facility_code", label: "FACILITY_CODE", type: "autocomplete", apiUrl: "/api/facilities", dataKey: "facilities", codeField: "code", placeholder: "FAC-1000", createUrl: "/foundation/facilities", createCode: "EFCC" },
        { key: "expiry_date", label: "EXPIRY_DATE", placeholder: "2027-05-15", description: "Expiry date" },
        { key: "manufacturing_date", label: "MANUFACTURING_DATE", placeholder: "2026-05-15" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "EMTC", label: "Material – required", route: "/foundation/materials", description: "Material" },
        { code: "EFCC", label: "Facility – required", route: "/foundation/facilities", description: "Facility" },
        { code: "ISTV", label: "Stock uses Lot", route: "/foundation/stock", description: "Stock" },
      ]}
    />
  );
}
