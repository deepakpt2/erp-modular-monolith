"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FGLC"
      sapAlias="FS00"
      title="General Ledger Accounts"
      description="Create GL Account Master – account_number coa_code account_type – e.g., 5000000001 inventory, 2000000001 GR/IR – strict usage: auto account determination BSX/WRX uses GL, posting to GL, field status"
      apiEndpoint="/api/gl-accounts"
      initialForm={{ account_number: '', name: '', coa_code: 'KSCA', account_type: 'ASSET', description: '' }}
      fields={[
        { key: "account_number", label: "GL_ACCOUNT_NUMBER", required: true, placeholder: "5000000001", description: "GL account number – e.g., 5000000001 inventory, 2000000001 GR/IR, 4000000001 expense" },
        { key: "name", label: "GL_ACCOUNT_NAME", required: true, placeholder: "Inventory Raw Materials" },
        { key: "coa_code", label: "CHART_OF_ACCOUNTS_CODE", required: true, type: "autocomplete", apiUrl: "/api/chart-of-accounts", dataKey: "chartOfAccounts", codeField: "code", placeholder: "KSCA", createUrl: "/fico/chart-of-accounts", createCode: "FCOA", description: "Chart of accounts FK – must exist via FCOA" },
        { key: "account_type", label: "ACCOUNT_TYPE", type: "select", options: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'], placeholder: "ASSET", description: "Account type – determines field status" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "FCOA", label: "Chart of Accounts – required", route: "/fico/chart-of-accounts", description: "Chart" },
        { code: "OBYC", label: "Auto Account uses GL", route: "/fico/auto-account-determination", description: "Auto Account Determination" },
        { code: "FFSG", label: "Field Status Groups uses GL", route: "/fico/field-status-groups", description: "Field Status" },
      ]}
    />
  );
}
