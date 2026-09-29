"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function LegalEntitiesPage() {
  return (
    <SingleCodePage
      code="ELEC"
      sapAlias="OX02"
      title="Legal Entity"
      description="Define Legal Entity – statutory company code master – legal corporate identity – uses Company Group, Currency, Fiscal Calendar, Posting Period Variant – strict usage: posting period variant controls OB52 open/close, fiscal calendar calculates FY/Period from posting date"
      apiEndpoint="/api/legal-entities"
      initialForm={{
        code: '', name: '', company_group_code: '', currency_code: 'INR', country: 'IN', city: '',
        address: '', street: '', postal_code: '', region: '', tax_id: '', gst_number: '', pan: '', cin: '',
        phone: '', email: '', website: '', legal_form: '', registration_number: '', description: '',
        tenant_code: 'TEN-100', fiscal_calendar_code: 'K4', posting_period_variant_code: '1000'
      }}
      fields={[
        { key: 'code', label: 'LEGAL_ENTITY_CODE', required: true, placeholder: 'LE-1000', description: 'Unique legal entity code – e.g., LE-1000 – company code in ERP – used by Facility, Cost Center, etc.' },
        { key: 'name', label: 'LEGAL_ENTITY_NAME', required: true, placeholder: 'India Pvt Ltd', description: 'Legal name' },
        { key: 'company_group_code', label: 'COMPANY_GROUP_CODE', required: true, type: 'autocomplete', apiUrl: '/api/company-groups', dataKey: 'companyGroups', codeField: 'code', placeholder: 'CG-100', createUrl: '/foundation/company-groups', createCode: 'ECGC', description: 'Company Group FK – must exist via ECGC' },
        { key: 'currency_code', label: 'CURRENCY_CODE', required: true, type: 'autocomplete', apiUrl: '/api/currencies', dataKey: 'currencies', codeField: 'code', placeholder: 'INR', createUrl: '/fico/currencies', createCode: 'FCYC', description: 'Currency FK – OY03 – only INR default but can add' },
        { key: 'fiscal_calendar_code', label: 'FISCAL_CALENDAR_CODE', required: true, type: 'autocomplete', apiUrl: '/api/fiscal-calendars', dataKey: 'fiscalCalendars', codeField: 'code', placeholder: 'K4', createUrl: '/fico/fiscal-calendars', createCode: 'FFYC', description: 'Fiscal calendar – K4 April-March or V3 Calendar Year – calculates FY/Period from posting date – strict usage' },
        { key: 'posting_period_variant_code', label: 'POSTING_PERIOD_VARIANT_CODE', required: true, type: 'autocomplete', apiUrl: '/api/posting-period-variants', dataKey: 'postingPeriodVariants', codeField: 'code', placeholder: '1000', createUrl: '/fico/posting-period-variants', createCode: 'OBBO', description: 'Posting period variant – groups company codes for OB52 open/close – strict enforcement in GR/IR/Billing' },
        { key: 'country', label: 'COUNTRY', placeholder: 'IN', description: 'Country code' },
        { key: 'city', label: 'CITY', placeholder: 'Mumbai' },
        { key: 'tax_id', label: 'TAX_ID', placeholder: 'TAX123' },
        { key: 'gst_number', label: 'GST_NUMBER', placeholder: 'GSTIN' },
        { key: 'pan', label: 'PAN', placeholder: 'PAN' },
        { key: 'description', label: 'DESCRIPTION', type: 'textarea', placeholder: 'Legal entity description' },
      ]}
      relatedLinks={[
        { code: 'ECGC', label: 'Company Group – required', route: '/foundation/company-groups', description: 'Create Company Group first' },
        { code: 'FCYC', label: 'Currency – required', route: '/fico/currencies', description: 'Currency master OY03' },
        { code: 'FFYC', label: 'Fiscal Calendar – required', route: '/fico/fiscal-calendars', description: 'Fiscal calendar K4/V3 – calculates FY/Period' },
        { code: 'FPPC', label: 'Posting Period Variant – required', route: '/fico/posting-period-variants', description: 'Posting period variant OBBO – groups company codes' },
        { code: 'FPPE', label: 'Posting Period Control – OB52', route: '/fico/posting-periods', description: 'Open/close periods – enforcement' },
        { code: 'EFCC', label: 'Facility uses ELEC', route: '/foundation/facilities', description: 'Facility requires Legal Entity' },
        { code: 'FCCA', label: 'Cost Center uses ELEC', route: '/fico/cost-centers', description: 'Cost Center requires Legal Entity' },
      ]}
    />
  );
}
