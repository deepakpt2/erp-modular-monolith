"use client";

import { use } from 'react';
import { SapAssignmentTable } from '@/shared/ui/sap-assignment-table';

export default function Page({ params }: { params: Promise<{ companyCode: string }> }) {
  const { companyCode } = use(params);

  return (
    <SapAssignmentTable
      code="OVX8"
      sapAlias="OVX8"
      title="Assign Distribution Channel to Sales Organization"
      description="Industry Standard Customizing: Assigns wholesale, retail, or direct distribution channels to sales organizations."
      apiEndpoint="/api/assignments/channel-sales"
      companyCode={companyCode}
      primaryKeys={["sales_org_code", "distribution_channel_code"]}
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
          key: "distribution_channel_code",
          label: "Distribution Channel",
          type: "autocomplete",
          apiUrl: "/api/sales-channels",
          dataKey: "salesChannels",
          codeField: "code",
          required: true,
          readOnlyOnEdit: true,
          placeholder: "Select Channel (OVXI / ESCC)"
        }
      ]}
      relatedLinks={[
        { code: "OVX5", label: "Sales Org (ECOC)", route: "/foundation/commercial-orgs", description: "Define Sales Org" },
        { code: "OVXI", label: "Distribution Channel (ESCC)", route: "/foundation/sales-channels", description: "Define Channel" }
      ]}
    />
  );
}
