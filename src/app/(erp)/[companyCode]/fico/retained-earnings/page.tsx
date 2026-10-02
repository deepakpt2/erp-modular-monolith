"use client";

import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function RetainedEarningsPage({ defaultMode, codeOverride, titleOverride }: { defaultMode?: any; codeOverride?: string; titleOverride?: string } = {}) {
  return (
    <SingleCodePage
      code={codeOverride || "FREC"}
      sapAlias="OB53"
      title={titleOverride || "Define Retained Earnings Account"}
      description="Industry Standard Configuration: Determines the Retained Earnings balance sheet equity account for each Chart of Accounts and P&L statement account type (typically 'X'). At fiscal year-end closing, the balance of all P&L accounts is automatically carried forward to this retained earnings account."
      apiEndpoint="/api/retained-earnings"
      referenceConfig={{
        keyField: "account_number",
        displayField: "account_number",
        label: "Create with Reference – Copy Retained Earnings Account",
        excludedFields: ["id", "created_at", "updated_at"]
      }}
      defaultMode={defaultMode || "create"}
      initialForm={{
        chart_code: 'CA-IN-01',
        pl_account_type: 'X',
        account_number: '',
        description: 'Retained Earnings / Surplus Account',
      }}
      fields={[
        {
          key: 'chart_code',
          label: 'CHART_OF_ACCOUNTS',
          required: true,
          type: 'autocomplete',
          apiUrl: '/api/chart-of-accounts',
          dataKey: 'chartOfAccounts',
          codeField: 'code',
          placeholder: 'e.g. CA-IN-01, 1000',
          createUrl: '/fico/chart-of-accounts',
          createCode: 'FCOA',
          description: 'Chart of Accounts key for which the retained earnings account is assigned'
        },
        {
          key: 'pl_account_type',
          label: 'PL_STATEMENT_ACCOUNT_TYPE',
          required: true,
          placeholder: 'X',
          description: 'P&L Statement Account Type (usually X for general P&L roll-over)'
        },
        {
          key: 'account_number',
          label: 'RETAINED_EARNINGS_ACCOUNT',
          required: true,
          type: 'autocomplete',
          apiUrl: '/api/gl-accounts',
          dataKey: 'glAccounts',
          codeField: 'account_number',
          placeholder: 'e.g. 2500000001, 280000, 100020',
          createUrl: '/fico/gl-accounts',
          createCode: 'FS00',
          description: 'Equity balance sheet G/L account where net income/loss is carried forward'
        },
        {
          key: 'description',
          label: 'DESCRIPTION',
          type: 'textarea',
          placeholder: 'Optional notes regarding annual balance carry-forward and statutory reserves',
          description: 'Operational explanation or reserve category details'
        },
      ]}
      relatedLinks={[
        { code: 'OB13', label: 'Chart of Accounts (FCOA)', route: '/fico/chart-of-accounts', description: 'Maintain Chart of Accounts' },
        { code: 'FS00', label: 'G/L Master Accounts (FGLC)', route: '/fico/gl-accounts', description: 'Create and view G/L Accounts' },
        { code: 'OB62', label: 'Assign CoA to Company Code', route: '/fico/assignments/chart-of-accounts', description: 'Assign CoA' },
        { code: 'OB52', label: 'Posting Period Control (FPPE)', route: '/fico/posting-periods', description: 'Year-End Closing Periods' },
      ]}
    />
  );
}
