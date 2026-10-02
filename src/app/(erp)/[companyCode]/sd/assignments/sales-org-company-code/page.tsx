"use client";

import { use } from 'react';
import { SapAssignmentTable } from '@/shared/ui/sap-assignment-table';

export default function Page({ params }: { params: Promise<{ companyCode: string }> }) {
  const { companyCode } = use(params);

  return (
    <SapAssignmentTable
      code="OVX3"
      sapAlias="OVX3"
      title="Assign Sales Organization to Company Code"
      description="Industry Standard Customizing: Connects commercial sales organizations to legal entities for invoicing and revenue recognition."
      apiEndpoint="/api/assignments/sales-company-code"
      companyCode={companyCode}
      primaryKeys={["sales_org_code", "company_code"]}
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
        { code: "OVX5", label: "Sales Org (ECOC)", route: "/foundation/commercial-orgs", description: "Define Sales Org" },
        { code: "OX02", label: "Company Code (ELEC)", route: "/foundation/legal-entities", description: "Define Company Code" }
      ]}
    />
  );
}
