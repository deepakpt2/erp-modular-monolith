"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="MMOC"
      sapAlias="CO01"
      title="Production Order"
      description="Create Production Order – strict usage: production order header + operations from routing + components from BOM + status CRTD/REL/CNF/TECO – consumes material, produces finished good"
      apiEndpoint="/api/production-orders"
      initialForm={{ material_code: '', plant_code: '', quantity: '', routing_code: '', bom_code: '', status: 'CRTD', posting_date: '' }}
      fields={[
        { key: "material_code", label: "MATERIAL_CODE", required: true, type: "autocomplete", apiUrl: "/api/materials", dataKey: "materials", codeField: "item_number", placeholder: "MAT-1000", createUrl: "/foundation/materials", createCode: "EMTC", description: "Material to produce – must exist via EMTC" },
        { key: "plant_code", label: "PLANT_CODE", required: true, type: "autocomplete", apiUrl: "/api/facilities", dataKey: "facilities", codeField: "code", placeholder: "FAC-1000", createUrl: "/foundation/facilities", createCode: "EFCC" },
        { key: "quantity", label: "QUANTITY", required: true, placeholder: "100", description: "Quantity to produce" },
        { key: "routing_code", label: "ROUTING_CODE", type: "autocomplete", apiUrl: "/api/routings", dataKey: "routings", codeField: "code", placeholder: "RT-1000", createUrl: "/pp/routings", createCode: "MRTC", description: "Routing – sequence of operations" },
        { key: "bom_code", label: "BOM_CODE", type: "autocomplete", apiUrl: "/api/bom", dataKey: "boms", codeField: "code", placeholder: "BOM-1000", createUrl: "/pp/bom", createCode: "MBMC", description: "BOM – components" },
        { key: "status", label: "STATUS", type: "select", options: ['CRTD', 'REL', 'CNF', 'TECO'], placeholder: "CRTD", description: "CRTD created, REL released, CNF confirmed, TECO technically complete" },
        { key: "posting_date", label: "POSTING_DATE", placeholder: "2026-05-15" },
      ]}
      relatedLinks={[
        { code: "EMTC", label: "Material – required", route: "/foundation/materials", description: "Material" },
        { code: "EFCC", label: "Facility – required", route: "/foundation/facilities", description: "Plant" },
        { code: "MRTC", label: "Routing – required", route: "/pp/routings", description: "Routing" },
        { code: "MBMC", label: "BOM – required", route: "/pp/bom", description: "BOM" },
        { code: "MWCC", label: "Work Center", route: "/pp/work-centers", description: "Work Center" },
      ]}
    />
  );
}
