"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FGLC"
      sapAlias="FS00"
      title="General Ledger Accounts – GL Master"
      description="Create GL Account Master – chart of accounts, account number, account type, balance sheet, reconciliation, tax relevant, blocked – e.g., 1400000001 inventory BSX, 2000000001 GR/IR WRX, 5000000001 COGS GBB – strict industry standard: auto account determination OBYC BSX/WRX uses GL, posting to GL, field status variant FFSV, universal ledger FUNL – T0 BLOCKING – NO DANGLING – own names"
      apiEndpoint="/api/gl-accounts"
      initialForm={{ 
        account_number: '', 
        name: '', 
        coa_code: 'CA-IN-01', 
        chart_code: 'CA-IN-01',
        account_type: 'ASSET', 
        is_balance_sheet: 'true',
        is_reconciliation: 'false',
        is_blocked: 'false',
        is_tax_relevant: 'false',
        account_group_code: 'G001',
        description: '' 
      }}
      fields={[
        { key: "account_number", label: "GL_ACCOUNT_NUMBER", required: true, placeholder: "1400000001", description: "GL account number – e.g., 1400000001 inventory BSX, 2000000001 GR/IR WRX, 5000000001 COGS GBB VAX, 1000000001 cash – industry standard – 10-digit numeric – own name – T0" },
        { key: "name", label: "GL_ACCOUNT_NAME", required: true, placeholder: "Inventory – Raw Materials – BSX", description: "GL account name – e.g., Inventory Raw Materials – descriptive" },
        { key: "coa_code", label: "CHART_OF_ACCOUNTS_CODE", required: true, type: "autocomplete", apiUrl: "/api/chart-of-accounts", dataKey: "chartOfAccounts", codeField: "code", placeholder: "CA-IN-01", createUrl: "/fico/chart-of-accounts", createCode: "FCOA", description: "Chart of accounts – e.g., CA-IN-01 – must exist via FCOA OB13 – chart type OPERATIONAL – industry standard – own name" },
        { key: "chart_code", label: "CHART_CODE_LEGACY", type: "autocomplete", apiUrl: "/api/chart-of-accounts", dataKey: "chartOfAccounts", codeField: "code", placeholder: "CA-IN-01", createUrl: "/fico/chart-of-accounts", createCode: "FCOA", description: "Legacy alias for coa_code – chart of accounts" },
        { key: "account_type", label: "ACCOUNT_TYPE", required: true, type: "select", options: ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"], placeholder: "ASSET", description: "Account type – ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE – determines balance sheet vs P&L, field status group, open item management – industry standard" },
        { key: "is_balance_sheet", label: "IS_BALANCE_SHEET", type: "select", options: ["true", "false"], placeholder: "true", description: "Balance sheet account – true if BS (1000000000-3999999999), false if P&L (4000000000-9999999999) – industry standard – used in financial statements FSSV" },
        { key: "is_reconciliation", label: "IS_RECONCILIATION", type: "select", options: ["true", "false"], placeholder: "false", description: "Reconciliation account – true if subledger reconciliation – e.g., 200000 Vendor Recon K, 100000 Customer Recon D – vendor/customer to GL – control account – industry standard – F_BKPF_KTO" },
        { key: "is_blocked", label: "IS_BLOCKED", type: "select", options: ["true", "false"], placeholder: "false", description: "Blocked – true if account blocked for posting – industry standard – prevents posting to blocked account – OB52-like" },
        { key: "is_tax_relevant", label: "IS_TAX_RELEVANT", type: "select", options: ["true", "false"], placeholder: "false", description: "Tax relevant – true if account relevant for tax – e.g., revenue, expense – tax calculation – industry standard" },
        { key: "account_group_code", label: "ACCOUNT_GROUP_CODE", type: "autocomplete", apiUrl: "/api/account-groups", dataKey: "accountGroups", codeField: "code", placeholder: "G001", createUrl: "/fico/chart-of-accounts", createCode: "FCOA", description: "Account group – e.g., G001 Balance Sheet, G004 Sales, G005 Bank/Cash – field status group assignment – AG01→G001 – FFSG – industry standard – determines field status variant" },
        { key: "description", label: "DESCRIPTION", type: "textarea", description: "Additional description – GL account purpose – e.g., Inventory for raw materials – BSX" },
      ]}
      relatedLinks={[
        { code: "FCOA", label: "Chart of Accounts – CA-IN-01 – required – OB13", route: "/fico/chart-of-accounts", description: "Chart – OPERATIONAL – AG01 – retained earnings 3200000000 – FSSV assignment" },
        { code: "FAUC", label: "Auto Account Determination – OBYC – BSX/WRX/GBB – uses GL", route: "/fico/auto-account-determination", description: "Auto Account – BSX 1400000001 inventory, GBB VAX 5000000001 COGS, WRX GR/IR – T0 BLOCKING" },
        { code: "FFSG", label: "Field Status Groups – OBC4 – posting key 40 cost_center R + AG01→G001", route: "/fico/field-status-groups", description: "Field Status Group – determines field status variant – AG01→G001" },
        { code: "FFSV", label: "Field Status Variant – 1000→FFSV-1000 – 40+ fields", route: "/fico/field-status-variants", description: "Field Status Variant – assignment 1000→FFSV-1000" },
        { code: "FUNL", label: "Universal Ledger – ACDOCA – 400+ fields – posts to GL", route: "/fico/universal-ledger", description: "Universal Ledger – posts BSX/WRX – foreign currency, qty/UOM, batch, business area" },
        { code: "FSTL", label: "Stock Ledger – material ledger – actual costing – uses GL BSX", route: "/foundation/stock", description: "Stock Ledger – total stock/value, MAP, S/V, batch" },
      ]}
    />
  );
}
