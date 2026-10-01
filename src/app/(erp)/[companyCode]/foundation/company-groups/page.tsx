"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function CompanyGroupsPage({ defaultMode }: { defaultMode?: any } = {}) {
  return (
    <SingleCodePage
      code="ECGC"
      sapAlias="OX15"
      title="Company Group"
      description="Define Company Group – enterprise holding umbrella corporation group structure – root parent, used by Legal Entity – per real guide needs currency_code INR, country_code IN, language EN"
      apiEndpoint="/api/company-groups"
      defaultMode={defaultMode || "list"}
      initialForm={{ code: '', name: '', description: '', tenant_code: 'TEN-100', currency_code: 'INR', country_code: 'IN', language: 'EN' }}
      fields={[
        { key: 'code', label: 'COMPANY_GROUP_CODE', required: true, placeholder: '', description: 'Unique code – e.g., ECGC-FMCG-01 – used as FK in Legal Entity – Title/Code/Data copyable' },
        { key: 'name', label: 'COMPANY_GROUP_NAME', required: true, placeholder: '', description: 'Name of company group – e.g., FMCG Group India' },
        { key: 'currency_code', label: 'CURRENCY_CODE', required: true, type: 'autocomplete', apiUrl: '/api/currencies', dataKey: 'currencies', codeField: 'code', placeholder: '', createUrl: '/fico/currencies', createCode: 'FCYC', description: 'Currency FK – must exist in Currencies master (e.g., INR, USD, EUR) – FCYC' },
        { key: 'country_code', label: 'COUNTRY_CODE', required: true, placeholder: '', description: 'Country – e.g., IN – ISO 2-letter country code' },
        { key: 'language', label: 'LANGUAGE', required: true, placeholder: '', description: 'Language – e.g., EN – per chart of accounts language requirement' },
        { key: 'description', label: 'DESCRIPTION', type: 'textarea', placeholder: '' },
        { key: 'tenant_code', label: 'TENANT_CODE', required: true, placeholder: '', description: 'Tenant code – default TEN-100' },
      ]}
      relatedLinks={[
        { code: 'ELEC', label: 'Legal Entity uses ECGC', route: '/foundation/legal-entities', description: 'Legal Entity requires Company Group – needs chart_of_accounts_code CA-IN-01, fiscal_year_variant K4, field_status_variant FFSV-1000, posting_period_variant PPV-1000, credit_control_area CRED-1000' },
        { code: 'FCOA', label: 'Chart of Accounts uses – CA-IN-01 must exist before ELEC', route: '/fico/chart-of-accounts', description: 'Create CA-IN-01 first – OB13' },
        { code: 'FFYC', label: 'Fiscal Year Variant K4 must exist before ELEC', route: '/fico/fiscal-calendars', description: 'Create K4 first' },
        { code: 'FFSV', label: 'Field Status Variant FFSV-1000', route: '/fico/field-status-variants', description: 'Create FFSV-1000 first' },
        { code: 'FPPC', label: 'Posting Period Variant PPV-1000', route: '/fico/posting-period-variants', description: 'Create PPV-1000 first' },
        { code: 'FCPC', label: 'Credit Control Area CRED-1000 – OB45', route: '/foundation/credit-policy-areas', description: 'Create CRED-1000 first – credit_control_area didnt create before OB13' },
        { code: 'ECAC', label: 'Enterprise Config', route: '/foundation/enterprise-structure', description: 'Overview hub' },
      ]}
    />
  );
}
