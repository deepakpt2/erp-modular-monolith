"use client";

import { use } from 'react';
import { SapAssignmentTable } from '@/shared/ui/sap-assignment-table';

export default function Page({ params }: { params: Promise<{ companyCode: string }> }) {
  const { companyCode } = use(params);

  return (
    <SapAssignmentTable
      code="OX17"
      sapAlias="OX17"
      title="Assign Purchasing Organization to Plant"
      description="Industry Standard Customizing: Links purchasing organizations to physical receiving and manufacturing plants."
      apiEndpoint="/api/assignments/purchasing-plant"
      companyCode={companyCode}
      primaryKeys={["purchasing_org_code", "plant_code"]}
      columns={[
        {
          key: "purchasing_org_code",
          label: "Purchasing Org",
          type: "autocomplete",
          apiUrl: "/api/procurement-divisions",
          dataKey: "procurementDivisions",
          codeField: "code",
          required: true,
          readOnlyOnEdit: true,
          placeholder: "Select Purchasing Org (OX08)"
        },
        {
          key: "plant_code",
          label: "Plant / Facility",
          type: "autocomplete",
          apiUrl: "/api/facilities",
          dataKey: "facilities",
          codeField: "code",
          required: true,
          readOnlyOnEdit: true,
          placeholder: "Select Plant (OX10 / EFCC)"
        }
      ]}
      relatedLinks={[
        { code: "OX08", label: "Purchasing Org (EPDC)", route: "/foundation/procurement-divisions", description: "Define Purchasing Org" },
        { code: "OX10", label: "Plant / Facility (EFCC)", route: "/foundation/facilities", description: "Define Plant" }
      ]}
    />
  );
}
