"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page({ defaultMode, codeOverride, titleOverride }: { defaultMode?: any; codeOverride?: string; titleOverride?: string } = {}) {
  return (
    <SingleCodePage
      code={codeOverride || "FGLC"}
      sapAlias="FS00"
      title={titleOverride || "General Ledger Accounts – GL Master"}
      description="Create & Maintain G/L Account Master records – Chart of Accounts, Account Number, Account Group (dictating valid number ranges and statutory behavior), Balance Sheet vs. P&L, and Subledger Reconciliation controls."
      apiEndpoint="/api/gl-accounts"
      defaultMode={defaultMode || "create"}
      referenceConfig={{
        keyField: "account_number",
        displayField: "name",
        label: "Create with Reference – Copy GL Account (FS00)",
        excludedFields: ["account_number", "id", "created_at", "updated_at", "is_blocked"]
      }}
      initialForm={{ 
        coa_code: 'CA-IN-01', 
        account_group_code: '',
        account_number: '', 
        name: '', 
        account_type: 'INHERIT_FROM_GROUP',
        account_category: 'INHERIT_FROM_GROUP',
        is_balance_sheet: 'true',
        is_reconciliation: 'false',
        is_blocked: 'false',
        is_tax_relevant: 'false',
        description: '' 
      }}
      fields={[
        { 
          key: "coa_code", 
          label: "CHART_OF_ACCOUNTS_CODE", 
          required: true, 
          type: "autocomplete", 
          apiUrl: "/api/chart-of-accounts", 
          dataKey: "chartOfAccounts", 
          codeField: "code", 
          placeholder: "", 
          createUrl: "/fico/chart-of-accounts", 
          createCode: "FCOA", 
          description: "Chart of Accounts – e.g., CA-IN-01" 
        },
        { 
          key: "account_group_code", 
          label: "ACCOUNT_GROUP_CODE", 
          required: true, 
          type: "autocomplete", 
          apiUrl: "/api/account-groups", 
          dataKey: "accountGroups", 
          codeField: "code", 
          placeholder: "", 
          createUrl: "/fico/account-groups", 
          createCode: "FAGC", 
          description: "Account Group (FAGC / OBD4) – defines number interval and accounting classification (e.g., ASST, LIAB, EQTY, REVN, EXPN)" 
        },
        { 
          key: "account_number", 
          label: "GL_ACCOUNT_NUMBER", 
          required: true, 
          placeholder: "", 
          description: "GL Account Number – within the Account Group interval (e.g. 100000-199999 for ASST, 200000-299999 for LIAB)" 
        },
        { 
          key: "name", 
          label: "GL_ACCOUNT_NAME", 
          required: true, 
          placeholder: "", 
          description: "Descriptive name of the G/L account" 
        },
        { 
          key: "account_category", 
          label: "GL_ACCOUNT_CATEGORY", 
          type: "select", 
          options: [
            "INHERIT_FROM_GROUP",
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
          description: "Functional Account Category – automatically inherited from Account Group or set specifically" 
        },
        { 
          key: "account_type", 
          label: "ACCOUNT_TYPE", 
          type: "select", 
          options: ["INHERIT_FROM_GROUP", "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"], 
          placeholder: "", 
          description: "Financial statement classification – automatically inherited from Account Group" 
        },
        { 
          key: "is_balance_sheet", 
          label: "IS_BALANCE_SHEET", 
          type: "select", 
          options: ["true", "false"], 
          placeholder: "", 
          description: "Balance Sheet account flag – true for balance sheet items carried forward, false for P&L accounts closed to Retained Earnings" 
        },
        { 
          key: "is_reconciliation", 
          label: "IS_RECONCILIATION", 
          type: "select", 
          options: ["true", "false"], 
          placeholder: "", 
          description: "Subledger reconciliation anchor – true if automated subledger control account (e.g. AP, AR, Asset Accounting)" 
        },
        { 
          key: "is_blocked", 
          label: "IS_BLOCKED", 
          type: "select", 
          options: ["true", "false"], 
          placeholder: "", 
          description: "Blocked for posting – set true to prevent manual or automated postings" 
        },
        { 
          key: "is_tax_relevant", 
          label: "IS_TAX_RELEVANT", 
          type: "select", 
          options: ["true", "false"], 
          placeholder: "", 
          description: "Tax relevant flag – set true if relevant for input/output tax determination" 
        },
        { 
          key: "description", 
          label: "DESCRIPTION", 
          type: "textarea", 
          description: "Additional details about this account purpose and accounting guidelines" 
        },
      ]}
      relatedLinks={[
        { code: "FAGC", label: "Account Groups – OBD4", route: "/fico/account-groups", description: "Define GL account groups and number ranges" },
        { code: "FCOA", label: "Chart of Accounts – CA-IN-01", route: "/fico/chart-of-accounts", description: "Chart of Accounts Master – FCOA" },
        { code: "FAUC", label: "Auto Account Determination", route: "/fico/auto-account-determination", description: "Automated account determination for inventory, GR/IR, revenue, and variances" },
        { code: "FFSG", label: "Field Status Groups", route: "/fico/field-status-groups", description: "Posting key and field status variants" },
        { code: "FUNL", label: "Universal Ledger", route: "/fico/universal-ledger", description: "Single-source universal financial journal entries" },
        { code: "FSTL", label: "Stock Ledger", route: "/foundation/stock", description: "Stock inventory valuation and material movements" },
      ]}
    />
  );
}
