"use client";

import { use } from 'react';
import { SapAssignmentTable } from '@/shared/ui/sap-assignment-table';

export default function Page({ params }: { params: Promise<{ companyCode: string }> }) {
  const { companyCode } = use(params);

  return (
    <SapAssignmentTable
      code="OB62"
      sapAlias="FLC2"
      title="Assign Company Code to Chart of Accounts"
      description="Industry Standard Customizing: Maps statutory company codes to an operational chart of accounts and optional country-specific chart of accounts."
      apiEndpoint="/api/assignments/coa"
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
          key: "chart_of_accounts_code",
          label: "Chart of Accounts (Operational)",
          type: "autocomplete",
          apiUrl: "/api/chart-of-accounts",
          dataKey: "chartOfAccounts",
          codeField: "code",
          required: true,
          placeholder: "Select CoA (OB13)"
        },
        {
          key: "country_chart_of_accounts_code",
          label: "Country Chart of Accounts (Optional)",
          type: "autocomplete",
          apiUrl: "/api/chart-of-accounts",
          dataKey: "chartOfAccounts",
          codeField: "code",
          required: false,
          placeholder: "Optional Country CoA"
        }
      ]}
      relatedLinks={[
        { code: "OX02", label: "Company Code (ELEC)", route: "/foundation/legal-entities", description: "Define Company Code" },
        { code: "OB13", label: "Chart of Accounts (FCOA)", route: "/fico/chart-of-accounts", description: "Define Chart of Accounts" },
        { code: "OBD4", label: "Account Groups (FAGC)", route: "/fico/account-groups", description: "Define Account Groups" }
      ]}
    />
  );
}
