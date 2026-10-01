"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EWSC"
      sapAlias=""
      title="Warehouse Site"
      description="Define Warehouse Site – warehouse number storage facility warehouse zone bin location – uses Facility"
      apiEndpoint="/api/warehouse-sites"
      initialForm={{ code: '', name: '', facility_code: '', description: '' }}
      fields={[
        { key: "code", label: "WAREHOUSE_SITE_CODE", required: true, placeholder: "" },
        { key: "name", label: "WAREHOUSE_SITE_NAME", required: true, placeholder: "" },
        { key: "facility_code", label: "FACILITY_CODE", required: true, type: "autocomplete", apiUrl: "/api/facilities", dataKey: "facilities", codeField: "code", placeholder: "", createUrl: "/foundation/facilities", createCode: "EFCC" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "EFCC", label: "Facility – required", route: "/foundation/facilities", description: "Facility" },
      ]}
    />
  );
}
