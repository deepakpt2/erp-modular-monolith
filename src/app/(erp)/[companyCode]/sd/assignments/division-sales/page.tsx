"use client";

import { use } from 'react';
import { SapAssignmentTable } from '@/shared/ui/sap-assignment-table';

export default function Page({ params }: { params: Promise<{ companyCode: string }> }) {
  const { companyCode } = use(params);

  return (
    <SapAssignmentTable
      code="OVX6"
      sapAlias="OVX6"
      title="Assign Division to Sales Organization"
      description="SAP Customizing Table (TVKOS): Assigns product line divisions to sales organizations for sales area determination."
      apiEndpoint="/api/assignments/division-sales"
      companyCode={companyCode}
      primaryKeys={["sales_org_code", "division_code"]}
      columns={[
        {
          key: "sales_org_code",
          label: "Sales Org",
          type: "autocomplete",
          apiUrl: "/api/commercial-orgs",
          dataKey: "commercialOrgs",
          codeField: "code",
          required: true,
          readOnlyOnEdit: true,
          placeholder: "Select Sales Org (OVX5 / ECOC)"
        },
        {
          key: "division_code",
          label: "Division / Product Line",
          type: "autocomplete",
          apiUrl: "/api/product-lines",
          dataKey: "productLines",
          codeField: "code",
          required: true,
          readOnlyOnEdit: true,
          placeholder: "Select Division (OVXB / EPLC)"
        }
      ]}
      relatedLinks={[
        { code: "OVX5", label: "Sales Org (ECOC)", route: "/foundation/commercial-orgs", description: "Define Sales Org" },
        { code: "OVXB", label: "Division (EPLC)", route: "/foundation/product-lines", description: "Define Division" }
      ]}
    />
  );
}
