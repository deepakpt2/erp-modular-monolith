"use client";

import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page({ defaultMode, codeOverride, titleOverride }: { defaultMode?: any; codeOverride?: string; titleOverride?: string } = {}) {
  return (
    <SingleCodePage
      defaultMode={defaultMode}
      code={codeOverride || "FCOA"}
      sapAlias="OB13"
      title={titleOverride || "Chart of Accounts"}
      description="Standard Industry Customizing Table (T004): Defines the organizational framework for the General Ledger. Controls the length of G/L account numbers, maintenance language, consolidation group chart of accounts, controlling integration, and posting block status."
      apiEndpoint="/api/chart-of-accounts"
      referenceConfig={{
        keyField: 'code',
        displayField: 'name',
        label: 'Create with Reference / Copy Chart of Accounts',
        fieldTransforms: {
          copy_from_coa: (val, record) => record.code || '',
        }
      }}
      initialForm={{
        code: '',
        name: '',
        language: 'EN',
        gl_account_length: '6',
        controlling_integration: 'MANUAL',
        group_chart_of_accounts: '',
        is_blocked: 'false',
        status: 'ACTIVE',
        copy_from_coa: '',
        description: ''
      }}
      fields={[
        {
          key: "code",
          label: "CHART_OF_ACCOUNTS",
          required: true,
          placeholder: "e.g. CA01, 1000, CA-IN-01",
          description: "4-character Chart of Accounts key (T004-KTOPL) – uniquely identifies the chart of accounts"
        },
        {
          key: "name",
          label: "CHART_OF_ACCOUNTS_NAME",
          required: true,
          placeholder: "e.g. Standard Operational Chart of Accounts",
          description: "Chart of Accounts description/name (T004T-KTPLT)"
        },
        {
          key: "language",
          label: "MAINTENANCE_LANGUAGE",
          required: true,
          type: "select",
          options: [
            "EN (English)",
            "DE (German)",
            "FR (French)",
            "ES (Spanish)",
            "JA (Japanese)",
            "HI (Hindi)"
          ],
          description: "Maintenance language (T004-SPRAS) – determines the primary language for account descriptions"
        },
        {
          key: "gl_account_length",
          label: "GL_ACCOUNT_NUMBER_LENGTH",
          required: true,
          placeholder: "6",
          description: "Length of G/L account numbers (T004-SAKNR) – valid range 1 to 10 digits (typically 6 in standard templates)"
        },
        {
          key: "controlling_integration",
          label: "CONTROLLING_INTEGRATION",
          required: true,
          type: "select",
          options: [
            "MANUAL (Manual creation of cost elements)",
            "AUTOMATIC (Automatic creation of cost elements)"
          ],
          description: "Integration with Controlling (T004-INTEG): Type 1 = Manual cost element creation, Type 2 = Automatic creation of primary/secondary cost elements"
        },
        {
          key: "group_chart_of_accounts",
          label: "GROUP_CHART_OF_ACCOUNTS",
          type: "autocomplete",
          apiUrl: "/api/chart-of-accounts",
          dataKey: "chartOfAccounts",
          codeField: "code",
          placeholder: "e.g. CONS, GRP01 (Optional)",
          description: "Group Chart of Accounts (T004-KONSZ) – used for consolidation reporting across multi-GAAP subsidiaries"
        },
        {
          key: "is_blocked",
          label: "POSTING_BLOCK",
          required: true,
          type: "select",
          options: ["false", "true"],
          description: "Chart of Accounts Blocked (T004-XSPER): If set to true, accounts in this chart cannot be created or maintained"
        },
        {
          key: "copy_from_coa",
          label: "COPY_FROM_TEMPLATE_COA",
          type: "autocomplete",
          apiUrl: "/api/chart-of-accounts",
          dataKey: "chartOfAccounts",
          codeField: "code",
          placeholder: "Select template (e.g. CA-IN-01) to duplicate accounts",
          description: "Optional: Replicates all G/L accounts from an existing template chart (e.g. CA-IN-01) into this new chart"
        },
        {
          key: "description",
          label: "DESCRIPTION",
          type: "textarea",
          placeholder: "Operational rationale or statutory accounting standards (e.g. IndAS / IFRS / US-GAAP)",
          description: "Detailed description of scope and GAAP standards for this chart"
        }
      ]}
      relatedLinks={[
        { code: "OB62", label: "Assign Company Code to CoA", route: "/fico/assignments/chart-of-accounts", description: "Assign Company Code" },
        { code: "FS00", label: "G/L Account Master (FGLC)", route: "/fico/gl-accounts", description: "Maintain G/L Accounts" },
        { code: "OBD4", label: "G/L Account Groups", route: "/fico/account-groups", description: "Define Account Groups" },
        { code: "OBYC", label: "Auto Account Determination", route: "/fico/auto-account-determination", description: "Account Determination" },
        { code: "OX02", label: "Company Code (ELEC)", route: "/foundation/legal-entities", description: "Company Codes" }
      ]}
    />
  );
}
