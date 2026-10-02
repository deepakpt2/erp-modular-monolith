"use client";

import { use } from 'react';
import { SapAssignmentTable } from '@/shared/ui/sap-assignment-table';

export default function Page({ params }: { params: Promise<{ companyCode: string }> }) {
  const { companyCode } = use(params);

  return (
    <SapAssignmentTable
      code="OX18"
      sapAlias="EFLA"
      title="Assign Plant to Company Code"
      description="Industry Standard Customizing: Connects physical manufacturing and logistics plants to statutory legal entities."
      apiEndpoint="/api/assignments/plant-company-code"
      companyCode={companyCode}
      primaryKeys={["company_code", "plant_code"]}
      columns={[
        {
          key: "company_code",
          label: "Company Code",
          type: "autocomplete",
          apiUrl: "/api/legal-entities",
          dataKey: "legalEntities",
          codeField: "code",
          required: true,
          readOnlyOnEdit: true,
          placeholder: "Select Company Code (OX02)"
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
        { code: "OX02", label: "Company Code (ELEC)", route: "/foundation/legal-entities", description: "Define Company Code" },
        { code: "OX10", label: "Plant / Facility (EFCC)", route: "/foundation/facilities", description: "Define Plant" },
        { code: "OX09", label: "Storage Locations (EILC)", route: "/foundation/inventory-locations", description: "Storage Locations" }
      ]}
    />
  );
}
