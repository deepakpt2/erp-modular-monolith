"use client";

import { use } from 'react';
import { SapAssignmentTable } from '@/shared/ui/sap-assignment-table';

export default function Page({ params }: { params: Promise<{ companyCode: string }> }) {
  const { companyCode } = use(params);

  return (
    <SapAssignmentTable
      code="OB38"
      sapAlias="FLCA"
      title="Assign Company Code to Credit Control Area"
      description="Industry Standard Customizing: Links company codes to central credit control areas for customer credit exposure management."
      apiEndpoint="/api/assignments/cca"
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
          key: "credit_control_area_code",
          label: "Credit Control Area",
          type: "autocomplete",
          apiUrl: "/api/credit-policy-areas",
          dataKey: "creditPolicyAreas",
          codeField: "code",
          required: true,
          placeholder: "Select CCA (OB45 / FCPC)"
        }
      ]}
      relatedLinks={[
        { code: "OX02", label: "Company Code (ELEC)", route: "/foundation/legal-entities", description: "Define Company Code" },
        { code: "OB45", label: "Credit Control Area (FCPC)", route: "/foundation/credit-policy-areas", description: "Define Credit Control Area" }
      ]}
    />
  );
}
