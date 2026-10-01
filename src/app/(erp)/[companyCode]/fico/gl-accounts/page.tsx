"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FGLC"
      sapAlias="FS00"
      title="General Ledger Accounts – GL Master"
      description="Create & Maintain GL Account Master – Chart of Accounts, Account Number, Primary/Secondary Cost Elements, Balance Sheet, Non-operating & Operating P&L, Retained Earnings, Subledger Reconciliation (AP/AR/Asset), GR/IR Clearing, and Bank Clearing accounts."
      apiEndpoint="/api/gl-accounts"
      defaultMode="list"
      initialForm={{ 
        account_number: '', 
        name: '', 
        coa_code: 'CA-IN-01', 
        account_type: 'ASSET',
        account_category: 'BALANCE_SHEET',
        is_balance_sheet: 'true',
        is_reconciliation: 'false',
        is_blocked: 'false',
        is_tax_relevant: 'false',
        account_group_code: 'G001',
        description: '' 
      }}
      fields={[
        { key: "account_number", label: "GL_ACCOUNT_NUMBER", required: true, placeholder: "", description: "GL account number – 10-digit numeric (e.g., 1400000001 Inventory, 2000000001 GR/IR, 2000000000 Vendor Recon, 4000000001 COGS, 8000000001 Bank)" },
        { key: "name", label: "GL_ACCOUNT_NAME", required: true, placeholder: "", description: "GL account name – e.g., Inventory Raw Materials, Trade Payables Recon, Outgoing Bank Clearing" },
        { key: "coa_code", label: "CHART_OF_ACCOUNTS_CODE", required: true, type: "autocomplete", apiUrl: "/api/chart-of-accounts", dataKey: "chartOfAccounts", codeField: "code", placeholder: "", createUrl: "/fico/chart-of-accounts", createCode: "FCOA", description: "Chart of Accounts – e.g., CA-IN-01" },
        { 
          key: "account_category", 
          label: "GL_ACCOUNT_CATEGORY", 
          required: true, 
          type: "select", 
          options: [
            "BALANCE_SHEET", 
            "NON_OPERATING_EXP_INC", 
            "OPERATING_EXP_INC", 
            "PRIMARY_COST_ELEMENT", 
            "SECONDARY_COST_ELEMENT", 
            "RETAINED_EARNINGS", 
            "RECONCILIATION", 
            "GR_IR_CLEARING", 
            "BANK_CLEARING"
          ], 
          description: "Functional Account Category: Balance Sheet (assets/liabilities/equity), Non-operating P&L, Operating P&L, Primary Cost Element (CO operational cost), Secondary Cost Element (internal CO allocation), Retained Earnings, Reconciliation (subledger anchor AP/AR/AA), GR/IR clearing, Bank clearing" 
        },
        { key: "account_type", label: "ACCOUNT_TYPE", required: true, type: "select", options: ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"], placeholder: "", description: "Financial statement classification – ASSET / LIABILITY / EQUITY / REVENUE / EXPENSE" },
        { key: "account_group_code", label: "ACCOUNT_GROUP_CODE", type: "autocomplete", apiUrl: "/api/account-groups", dataKey: "accountGroups", codeField: "code", placeholder: "", createUrl: "/fico/account-groups", createCode: "FAGC", description: "Account group – e.g., G001 Balance Sheet, G004 Sales, G005 Bank/Cash – defines number ranges and field status controls" },
        { key: "is_balance_sheet", label: "IS_BALANCE_SHEET", type: "select", options: ["true", "false"], placeholder: "", description: "Balance sheet account – true for balance sheet items carried forward, false for P&L accounts closed to Retained Earnings" },
        { key: "is_reconciliation", label: "IS_RECONCILIATION", type: "select", options: ["true", "false"], placeholder: "", description: "Subledger reconciliation anchor – true if automated subledger control account (e.g., Accounts Payable, Accounts Receivable, Asset Accounting)" },
        { key: "is_blocked", label: "IS_BLOCKED", type: "select", options: ["true", "false"], placeholder: "", description: "Blocked for posting – set true to prevent manual or automated postings" },
        { key: "is_tax_relevant", label: "IS_TAX_RELEVANT", type: "select", options: ["true", "false"], placeholder: "", description: "Tax relevant – set true if relevant for input/output tax determination" },
        { key: "description", label: "DESCRIPTION", type: "textarea", description: "Additional details about this account purpose and accounting guidelines" },
      ]}
      relatedLinks={[
        { code: "FAGC", label: "Account Groups – OBD4", route: "/fico/account-groups", description: "Define GL account groups and number ranges" },
        { code: "FCOA", label: "Chart of Accounts – CA-IN-01", route: "/fico/chart-of-accounts", description: "Chart of Accounts Master – FCOA (legacy OB13)" },
        { code: "FAUC", label: "Auto Account Determination", route: "/fico/auto-account-determination", description: "Automated account determination for inventory, GR/IR, revenue, and variances" },
        { code: "FFSG", label: "Field Status Groups", route: "/fico/field-status-groups", description: "Posting key and field status variants" },
        { code: "FUNL", label: "Universal Ledger", route: "/fico/universal-ledger", description: "Single-source universal financial journal entries" },
        { code: "FSTL", label: "Stock Ledger", route: "/foundation/stock", description: "Stock inventory valuation and material movements" },
      ]}
    />
  );
}
