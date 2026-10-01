"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function AccountGroupsPage({ defaultMode, codeOverride, titleOverride }: { defaultMode?: any; codeOverride?: string; titleOverride?: string } = {}) {
  return (
    <SingleCodePage
      code={codeOverride || "FAGC"}
      sapAlias="OBD4"
      title={titleOverride || "Account Groups – GL Account Categories"}
      description="Define Account Groups – classify GL accounts by category, specify number ranges (from_account to to_account), and assign field status controls. Groups include Balance Sheet, Non-operating P&L, Operating P&L, Primary & Secondary Cost Elements, Retained Earnings, Reconciliation, GR/IR, and Bank Clearing."
      apiEndpoint="/api/account-groups"
      defaultMode={defaultMode || "list"}
      initialForm={{
        code: '',
        name: '',
        chart_code: 'CA-IN-01',
        coa_code: 'CA-IN-01',
        from_account: '',
        to_account: '',
        description: '',
      }}
      fields={[
        { key: 'code', label: 'ACCOUNT_GROUP_CODE', required: true, placeholder: '', description: 'Unique account group code – e.g., G001, BS, RECON, GRIR, CASH' },
        { key: 'name', label: 'ACCOUNT_GROUP_NAME', required: true, placeholder: '', description: 'Descriptive name – e.g., Balance Sheet Accounts, Vendor Reconciliation, GR/IR Clearing' },
        { key: 'chart_code', label: 'CHART_OF_ACCOUNTS_CODE', required: true, type: 'autocomplete', apiUrl: '/api/chart-of-accounts', dataKey: 'chartOfAccounts', codeField: 'code', placeholder: '', createUrl: '/fico/chart-of-accounts', createCode: 'FCOA', description: 'Chart of Accounts – e.g., CA-IN-01' },
        { key: 'from_account', label: 'FROM_ACCOUNT', required: true, placeholder: '', description: 'Starting GL account number in this range – e.g., 1000000000' },
        { key: 'to_account', label: 'TO_ACCOUNT', required: true, placeholder: '', description: 'Ending GL account number in this range – e.g., 1999999999' },
        { key: 'description', label: 'DESCRIPTION', type: 'textarea', placeholder: '', description: 'Details about accounts classified in this group' },
      ]}
      relatedLinks={[
        { code: 'FGLC', label: 'GL Master Accounts', route: '/fico/gl-accounts', description: 'Create and view GL accounts using these account groups' },
        { code: 'FCOA', label: 'Chart of Accounts', route: '/fico/chart-of-accounts', description: 'Define Chart of Accounts' },
        { code: 'FFSG', label: 'Field Status Groups', route: '/fico/field-status-groups', description: 'Assign field status rules' },
      ]}
    />
  );
}
