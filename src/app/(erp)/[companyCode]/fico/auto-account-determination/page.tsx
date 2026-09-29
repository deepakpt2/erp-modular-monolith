"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="OBYC"
      sapAlias="OBYC"
      title="Automatic Account Determination"
      description="Define Automatic Account Determination – defines GL account per transaction key BSX/WRX/GBB/PRD – strict usage: GR 101 auto posts BSX inventory debit, WRX GR/IR credit – no dummy"
      apiEndpoint="/api/auto-account-determination"
      initialForm={{ transaction_key: 'BSX', chart_of_accounts: 'KSCA', valuation_class: 'RAW', gl_account: '', company_code: '', description: '' }}
      fields={[
        { key: "transaction_key", label: "TRANSACTION_KEY", required: true, type: "select", options: ['BSX', 'WRX', 'GBB', 'PRD', 'BSV'], placeholder: "BSX", description: "BSX inventory posting, WRX GR/IR clearing, GBB offset, PRD price diff – strict usage" },
        { key: "chart_of_accounts", label: "CHART_OF_ACCOUNTS", required: true, placeholder: "KSCA", description: "Chart of accounts – e.g., KSCA" },
        { key: "valuation_class", label: "VALUATION_CLASS", placeholder: "RAW", description: "Valuation class – RAW/FINISHED/SEMI – links to material type" },
        { key: "gl_account", label: "GL_ACCOUNT", required: true, type: "autocomplete", apiUrl: "/api/gl-accounts", dataKey: "glAccounts", codeField: "account_number", placeholder: "5000000001", createUrl: "/fico/gl-accounts", createCode: "FGLC", description: "GL account FK – must exist via FGLC – strict usage auto GL" },
        { key: "company_code", label: "COMPANY_CODE", placeholder: "LE-1000", description: "Company code optional – for company-specific" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "Inventory posting raw materials" },
      ]}
      relatedLinks={[
        { code: "FGLC", label: "GL Account – required", route: "/fico/gl-accounts", description: "GL Account" },
        { code: "FCOA", label: "Chart of Accounts", route: "/fico/chart-of-accounts", description: "Chart" },
        { code: "IGRC", label: "Goods Receipt uses OBYC", route: "/mm/gr", description: "GR uses auto account" },
        { code: "PIVC", label: "Invoice Verification uses OBYC", route: "/mm/iv", description: "IV uses auto account" },
      ]}
    />
  );
}
