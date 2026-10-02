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
      referenceConfig={{
        keyField: "code",
        displayField: "name",
        label: "Create with Reference – Copy Account Group (OBD4)",
        excludedFields: ["code", "id", "created_at", "updated_at"]
      }}
      defaultMode={defaultMode || "create"}
      initialForm={{
        code: '',
        name: '',
        chart_code: 'CA-IN-01',
        coa_code: 'CA-IN-01',
        from_account: '',
        to_account: '',
        account_type: 'ASSET',
        account_category: 'BALANCE_SHEET',
        description: '',
      }}
      fields={[
        { key: 'code', label: 'ACCOUNT_GROUP_CODE', required: true, placeholder: '', description: 'Unique account group code – e.g., G001, BS, RECON, GRIR, CASH' },
        { key: 'name', label: 'ACCOUNT_GROUP_NAME', required: true, placeholder: '', description: 'Descriptive name – e.g., Balance Sheet Accounts, Vendor Reconciliation, GR/IR Clearing' },
        { key: 'chart_code', label: 'CHART_OF_ACCOUNTS_CODE', required: true, type: 'autocomplete', apiUrl: '/api/chart-of-accounts', dataKey: 'chartOfAccounts', codeField: 'code', placeholder: '', createUrl: '/fico/chart-of-accounts', createCode: 'FCOA', description: 'Chart of Accounts – e.g., CA-IN-01' },
        {
          key: 'account_type',
          label: 'ACCOUNT_TYPE',
          required: true,
          type: 'select',
          options: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'],
          description: 'Financial statement classification – ASSET / LIABILITY / EQUITY / REVENUE / EXPENSE'
        },
        {
          key: 'account_category',
          label: 'GL_ACCOUNT_CATEGORY',
          required: true,
          type: 'select',
          options: [
            'BALANCE_SHEET',
            'NON_OPERATING_EXP_INC',
            'OPERATING_EXP_INC',
            'PRIMARY_COST_ELEMENT',
            'SECONDARY_COST_ELEMENT',
            'RETAINED_EARNINGS',
            'RECONCILIATION',
            'GR_IR_CLEARING',
            'BANK_CLEARING'
          ],
          description: 'SAP-standard GL category: Balance Sheet (X), Non-operating P&L (N), Primary Costs (P), Secondary Costs (S), Cash / Bank (C), etc. Fixed to this account group.'
        },
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
