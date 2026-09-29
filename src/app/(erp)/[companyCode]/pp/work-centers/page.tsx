"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="MWCC"
      sapAlias="CR01"
      title="Work Center"
      description="Create Work Center – Machine/Labor Capacity – assembly line plant floor resource – strict usage: routing operation uses work center, costing run uses work center rate"
      apiEndpoint="/api/work-centers"
      initialForm={{ code: '', name: '', facility_code: '', cost_center_code: '', capacity: '100', cost_rate: '100', description: '' }}
      fields={[
        { key: "code", label: "WORK_CENTER_CODE", required: true, placeholder: "WC-1000" },
        { key: "name", label: "WORK_CENTER_NAME", required: true, placeholder: "Assembly Line 1" },
        { key: "facility_code", label: "FACILITY_CODE", required: true, type: "autocomplete", apiUrl: "/api/facilities", dataKey: "facilities", codeField: "code", placeholder: "FAC-1000", createUrl: "/foundation/facilities", createCode: "EFCC" },
        { key: "cost_center_code", label: "COST_CENTER_CODE", type: "autocomplete", apiUrl: "/api/cost-centers", dataKey: "costCenters", codeField: "code", placeholder: "CC-1000", createUrl: "/fico/cost-centers", createCode: "FCCA", description: "Cost center for work center costing" },
        { key: "capacity", label: "CAPACITY", placeholder: "100", description: "Capacity – e.g., 100 units per day" },
        { key: "cost_rate", label: "COST_RATE", placeholder: "100", description: "Cost rate per hour – used in costing run CK40N" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "EFCC", label: "Facility – required", route: "/foundation/facilities", description: "Facility" },
        { code: "FCCA", label: "Cost Center – required", route: "/fico/cost-centers", description: "Cost Center" },
        { code: "MRTC", label: "Routing uses Work Center", route: "/pp/routings", description: "Routing" },
        { code: "CCRP", label: "Costing Run uses Work Center", route: "/fico/costing-run", description: "Costing Run" },
      ]}
    />
  );
}
