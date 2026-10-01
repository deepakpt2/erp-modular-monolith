"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="PSTD"
      sapAlias="VL10B"
      title="Stock Transport Shipments"
      description="Process STO Delivery – creates outbound delivery for STO – strict usage: STO requires delivery before GR"
      apiEndpoint="/api/sto-delivery"
      initialForm={{ sto_code: '', delivery_quantity: '', posting_date: '' }}
      fields={[
        { key: "sto_code", label: "STO_CODE", required: true, type: "autocomplete", apiUrl: "/api/sto", dataKey: "sto", codeField: "code", placeholder: "", createUrl: "/mm/sto", createCode: "PSTC", description: "STO to deliver" },
        { key: "delivery_quantity", label: "DELIVERY_QUANTITY", required: true, placeholder: "", description: "Quantity to deliver" },
        { key: "posting_date", label: "POSTING_DATE", required: true, placeholder: "" },
      ]}
      relatedLinks={[
        { code: "PSTC", label: "STO – required", route: "/mm/sto", description: "STO" },
        { code: "SDLC", label: "Delivery", route: "/sd/delivery", description: "Delivery" },
      ]}
    />
  );
}
