"use client";

import { use } from 'react';
import { SapAssignmentTable } from '@/shared/ui/sap-assignment-table';

export default function Page({ params }: { params: Promise<{ companyCode: string }> }) {
  const { companyCode } = use(params);

  return (
    <SapAssignmentTable
      code="OX19"
      sapAlias="FCCA"
      title="Assign Company Code to Controlling Area"
      description="SAP Customizing Table (V_001_D): Connects legal entities to controlling areas for management accounting, cost center accounting, and internal orders."
      apiEndpoint="/api/assignments/controlling-area"
      companyCode={companyCode}
      primaryKeys={["company_code"]}
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
          key: "controlling_area_code",
          label: "Controlling Area",
          type: "autocomplete",
          apiUrl: "/api/control-areas",
          dataKey: "controlAreas",
          codeField: "code",
          required: true,
          placeholder: "Select CO Area (OX06 / ECAC)"
        }
      ]}
      relatedLinks={[
        { code: "OX02", label: "Company Code (ELEC)", route: "/foundation/legal-entities", description: "Define Company Code" },
        { code: "OX06", label: "Controlling Area", route: "/foundation/enterprise-config", description: "Define Controlling Area" }
      ]}
    />
  );
}
