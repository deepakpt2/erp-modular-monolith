"use client";

import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function AccountGroupsPage({ defaultMode, codeOverride, titleOverride }: { defaultMode?: any; codeOverride?: string; titleOverride?: string } = {}) {
  return (
    <SingleCodePage
      code={codeOverride || "FAGC"}
      sapAlias="OBD4"
      title={titleOverride || "Account Groups – G/L Account Number Ranges"}
      description="Industry Standard Configuration: Defines Account Groups within a Chart of Accounts. Groups classify G/L accounts, control the account number interval (From Account to To Account), and determine field status rules when creating G/L master accounts."
      apiEndpoint="/api/account-groups"
      referenceConfig={{
        keyField: "code",
        displayField: "name",
        label: "Create with Reference – Copy Account Group",
        excludedFields: ["code", "id", "created_at", "updated_at"]
      }}
      defaultMode={defaultMode || "create"}
      initialForm={{
        chart_code: 'CA-IN-01',
        code: '',
        name: '',
        from_account: '',
        to_account: '',
        description: '',
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
          description: 'Chart of Accounts key to which this account group belongs'
        },
        {
          key: 'code',
          label: 'ACCOUNT_GROUP',
          required: true,
          placeholder: 'e.g. BS, CASH, MATL, REVN, EXPN',
          description: '4-character Account Group key'
        },
        {
          key: 'name',
          label: 'ACCOUNT_GROUP_NAME',
          required: true,
          placeholder: 'e.g. Balance Sheet Accounts',
          description: 'Name or description of the account group'
        },
        {
          key: 'from_account',
          label: 'FROM_ACCOUNT',
          required: true,
          placeholder: 'e.g. 100000',
          description: 'Lower limit of the G/L account number interval'
        },
        {
          key: 'to_account',
          label: 'TO_ACCOUNT',
          required: true,
          placeholder: 'e.g. 199999',
          description: 'Upper limit of the G/L account number interval'
        },
        {
          key: 'description',
          label: 'DESCRIPTION',
          type: 'textarea',
          placeholder: 'Optional accounting details or notes about accounts in this group',
          description: 'Detailed description for accounting administration'
        },
      ]}
      relatedLinks={[
        { code: 'FS00', label: 'G/L Master Accounts (FGLC)', route: '/fico/gl-accounts', description: 'Create and view G/L accounts using these account groups' },
        { code: 'OB13', label: 'Chart of Accounts (FCOA)', route: '/fico/chart-of-accounts', description: 'Define Chart of Accounts' },
        { code: 'OB62', label: 'Assign CoA to Company Code', route: '/fico/assignments/chart-of-accounts', description: 'Assign CoA' },
      ]}
    />
  );
}
