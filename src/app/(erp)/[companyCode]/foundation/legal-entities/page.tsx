"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';
export default function LegalEntitiesPage({ defaultMode }: { defaultMode?: any } = {}) {
  return (
    <SingleCodePage
      defaultMode={defaultMode}
      code="ELEC"
      sapAlias="OX02"
      title="Legal Entity"
      description="Define Legal Entity – statutory company code – needs chart_of_accounts_code CA-IN-01, fiscal_year_variant K4, field_status_variant FFSV-1000, posting_period_variant PPV-1000, credit_control_area CRED-1000 – per real guide – posting period variant controls FPPE (legacy OB52) open/close, fiscal calendar calculates FY/Period"
      apiEndpoint="/api/legal-entities"
      initialForm={{
        code: '', name: '', company_group_code: '', currency_code: 'INR', country_code: 'IN', country: 'IN', city: '',
        address: '', street: '', postal_code: '', region: '', tax_id: '', gst_number: '', pan: '', cin: '',
        phone: '', email: '', website: '', legal_form: '', registration_number: '', description: '',
        tenant_code: 'TEN-100', fiscal_calendar_code: 'K4', fiscal_year_variant: 'K4', chart_of_accounts_code: 'CA-IN-01', field_status_variant: 'FFSV-1000', posting_period_variant: 'PPV-1000', posting_period_variant_code: 'PPV-1000', credit_control_area: 'CRED-1000', language: 'EN'
      }}
      fields={[
        { key: 'code', label: 'LEGAL_ENTITY_CODE', required: true, placeholder: '', description: 'Unique legal entity code – e.g., 1000 per guide – company code in ERP – used by Facility, Cost Center' },
        { key: 'name', label: 'LEGAL_ENTITY_NAME', required: true, placeholder: '', description: 'Legal name – e.g., FMCG India Pvt Ltd' },
        { key: 'company_group_code', label: 'COMPANY_GROUP_CODE', required: true, type: 'autocomplete', apiUrl: '/api/company-groups', dataKey: 'companyGroups', codeField: 'code', placeholder: '', createUrl: '/foundation/company-groups', createCode: 'ECGC', description: 'Company Group FK – must exist via ECGC – ECGC-FMCG-01' },
        { key: 'currency_code', label: 'CURRENCY_CODE', required: true, type: 'autocomplete', apiUrl: '/api/currencies', dataKey: 'currencies', codeField: 'code', placeholder: '', createUrl: '/fico/currencies', createCode: 'FCYC', description: 'Currency FK – INR' },
        { key: 'country_code', label: 'COUNTRY_CODE', required: true, placeholder: '', description: 'Country – IN per guide' },
        { key: 'chart_of_accounts_code', label: 'CHART_OF_ACCOUNTS_CODE', required: true, type: 'autocomplete', apiUrl: '/api/chart-of-accounts', dataKey: 'chartOfAccounts', codeField: 'code', placeholder: '', createUrl: '/fico/chart-of-accounts', createCode: 'FCOA', description: 'Chart of Accounts – CA-IN-01 per guide – must exist before ELEC – OB13' },
        { key: 'fiscal_year_variant', label: 'FISCAL_YEAR_VARIANT', required: true, type: 'autocomplete', apiUrl: '/api/fiscal-calendars', dataKey: 'fiscalCalendars', codeField: 'code', placeholder: '', createUrl: '/fico/fiscal-calendars', createCode: 'FFYC', description: 'Fiscal Year Variant – K4 per guide – fiscal_year_variant K4 – calculates FY/Period' },
        { key: 'field_status_variant', label: 'FIELD_STATUS_VARIANT', required: true, placeholder: '', description: 'Field Status Variant – FFSV-1000 per guide' },
        { key: 'posting_period_variant', label: 'POSTING_PERIOD_VARIANT', required: true, type: 'autocomplete', apiUrl: '/api/posting-period-variants', dataKey: 'postingPeriodVariants', codeField: 'code', placeholder: '', createUrl: '/fico/posting-period-variants', createCode: 'FPPC', description: 'Posting Period Variant – PPV-1000 per guide – posting_period_variant PPV-1000' },
        { key: 'credit_control_area', label: 'CREDIT_CONTROL_AREA', required: true, type: 'autocomplete', apiUrl: '/api/credit-policy-areas', dataKey: 'creditPolicyAreas', codeField: 'code', placeholder: '', createUrl: '/foundation/credit-policy-areas', createCode: 'FCPC', description: 'Credit Control Area – CRED-1000 per guide – credit_control_area CRED-1000 didnt create before FCOA (legacy OB13) – must exist – OB45' },
        { key: 'language', label: 'LANGUAGE', required: true, placeholder: '', description: 'Language – EN per guide – FCOA (legacy OB13) language' },
        { key: 'city', label: 'CITY', placeholder: '' },
        { key: 'tax_id', label: 'TAX_ID', placeholder: '' },
        { key: 'gst_number', label: 'GST_NUMBER', placeholder: '' },
        { key: 'pan', label: 'PAN', placeholder: '' },
        { key: 'description', label: 'DESCRIPTION', type: 'textarea', placeholder: '' },
      ]}
      relatedLinks={[
        { code: 'ECGC', label: 'Company Group – required', route: '/foundation/company-groups', description: 'Create ECGC-FMCG-01 first – needs currency_code INR, country_code IN, language EN' },
        { code: 'FCOA', label: 'Chart of Accounts CA-IN-01 – must exist before ELEC', route: '/fico/chart-of-accounts', description: 'Create CA-IN-01 with language EN before ELEC – OB13' },
        { code: 'FFYC', label: 'Fiscal Year Variant K4', route: '/fico/fiscal-calendars', description: 'Create K4 before ELEC – fiscal_year_variant' },
        { code: 'FFSV', label: 'Field Status Variant FFSV-1000', route: '/fico/field-status-variants', description: 'Create FFSV-1000 before ELEC' },
        { code: 'FPPC', label: 'Posting Period Variant PPV-1000', route: '/fico/posting-period-variants', description: 'Create PPV-1000 before ELEC' },
        { code: 'FCPC', label: 'Credit Control Area CRED-1000 – OB45', route: '/foundation/credit-policy-areas', description: 'Create CRED-1000 before FCOA (legacy OB13)/ELEC – credit_control_area didnt create before ob13' },
        { code: 'FCYC', label: 'Currency – required', route: '/fico/currencies', description: 'Currency master OY03' },
        { code: 'EFCC', label: 'Facility uses ELEC', route: '/foundation/facilities', description: 'Facility requires Legal Entity' },
      ]}
    />
  );
}
