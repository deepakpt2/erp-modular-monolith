"use client";

import { use } from 'react';
import { SapAssignmentTable } from '@/shared/ui/sap-assignment-table';

export default function Page({ params }: { params: Promise<{ companyCode: string }> }) {
  const { companyCode } = use(params);

  return (
    <SapAssignmentTable
      code="OX01"
      sapAlias="OX01"
      title="Assign Purchasing Organization to Company Code"
      description="SAP Customizing Table (T024E): Assigns procurement organizations to company codes for centralized or plant-specific procurement."
      apiEndpoint="/api/assignments/purchasing-company-code"
      companyCode={companyCode}
      primaryKeys={["purchasing_org_code", "company_code"]}
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
          key: "company_code",
          label: "Company Code",
          type: "autocomplete",
          apiUrl: "/api/legal-entities",
          dataKey: "legalEntities",
          codeField: "code",
          required: true,
          readOnlyOnEdit: true,
          placeholder: "Select Company Code (OX02)"
        }
      ]}
      relatedLinks={[
        { code: "OX08", label: "Purchasing Org (EPDC)", route: "/foundation/procurement-divisions", description: "Define Purchasing Org" },
        { code: "OX02", label: "Company Code (ELEC)", route: "/foundation/legal-entities", description: "Define Company Code" }
      ]}
    />
  );
}
