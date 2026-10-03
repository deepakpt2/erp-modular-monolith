"use client";

import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function LegalEntitiesPage({
  defaultMode,
  codeOverride,
  titleOverride
}: {
  defaultMode?: any;
  codeOverride?: string;
  titleOverride?: string;
} = {}) {
  return (
    <SingleCodePage
      defaultMode={defaultMode}
      code={codeOverride || "ELEC"}
      sapAlias="OX02"
      title={titleOverride || "Legal Entity – Company Code"}
      description="Industry Standard Pure Definition (OX02 / ELEC): Define statutory Company Code with intrinsic attributes (Code, Name, Currency, Country, City, Language). In accordance with enterprise architectural standards, organizational assignments (Chart of Accounts, Fiscal Year Variant, Credit Control Area) are maintained exclusively in dedicated assignment transactions (e.g. OB62, OB37, OB38)."
      apiEndpoint="/api/legal-entities"
      initialForm={{
        code: '',
        name: '',
        currency_code: 'INR',
        country_code: 'IN',
        city: '',
        language: 'EN',
        address: '',
        street: '',
        postal_code: '',
        region: '',
        tax_id: '',
        gst_number: '',
        pan: '',
        cin: '',
        description: ''
      }}
      fields={[
        {
          key: 'code',
          label: 'COMPANY_CODE',
          required: true,
          placeholder: 'e.g. 1000, AM01',
          description: '4-character statutory Company Code (T001-BUKRS)'
        },
        {
          key: 'name',
          label: 'COMPANY_NAME',
          required: true,
          placeholder: 'e.g. Acme Consumer Products Ltd',
          description: 'Official corporate statutory legal name (T001-BUTXT)'
        },
        {
          key: 'currency_code',
          label: 'CURRENCY',
          required: true,
          type: 'autocomplete',
          apiUrl: '/api/currencies',
          dataKey: 'currencies',
          codeField: 'code',
          placeholder: 'Select local currency (e.g. INR, USD, EUR)',
          createUrl: '/fico/currencies',
          createCode: 'FCYC',
          description: 'Local statutory reporting currency (T001-WAERS)'
        },
        {
          key: 'country_code',
          label: 'COUNTRY',
          required: true,
          placeholder: 'e.g. IN, US, DE',
          description: 'Country ISO key for statutory reporting (T001-LAND1)'
        },
        {
          key: 'city',
          label: 'CITY',
          required: true,
          placeholder: 'e.g. Mumbai, New York',
          description: 'City of legal entity registration (T001-ORT01)'
        },
        {
          key: 'language',
          label: 'LANGUAGE',
          required: true,
          placeholder: 'e.g. EN, DE',
          description: 'System language for company documents (T001-SPRAS)'
        },
        {
          key: 'street',
          label: 'STREET_ADDRESS',
          placeholder: 'Registered office address',
          description: 'Street address'
        },
        {
          key: 'postal_code',
          label: 'POSTAL_CODE',
          placeholder: 'PIN / ZIP Code',
          description: 'Postal / ZIP code'
        },
        {
          key: 'region',
          label: 'STATE_REGION',
          placeholder: 'e.g. MH, CA, BY',
          description: 'State / Region code'
        },
        {
          key: 'tax_id',
          label: 'TAX_ID_VAT',
          placeholder: 'Corporate Tax / VAT ID',
          description: 'Tax identification number'
        },
        {
          key: 'gst_number',
          label: 'GST_NUMBER',
          placeholder: 'Goods & Services Tax Registration',
          description: 'GSTIN (India)'
        },
        {
          key: 'pan',
          label: 'PAN',
          placeholder: 'Permanent Account Number',
          description: 'PAN (India)'
        },
        {
          key: 'cin',
          label: 'CIN',
          placeholder: 'Corporate Identity Number',
          description: 'Registration / CIN'
        },
        {
          key: 'description',
          label: 'DESCRIPTION',
          type: 'textarea',
          placeholder: 'Operational or business notes',
          description: 'Explanatory notes'
        }
      ]}
      relatedLinks={[
        {
          code: 'OB62',
          label: 'Assign Chart of Accounts (COAA)',
          route: '/fico/chart-of-accounts-assignment',
          description: 'Assign Company Code to Chart of Accounts – OB62'
        },
        {
          code: 'OB37',
          label: 'Assign Fiscal Year Variant (FYVA)',
          route: '/fico/fiscal-year-variant-assignment',
          description: 'Assign Company Code to Fiscal Year Variant – OB37'
        },
        {
          code: 'OB38',
          label: 'Assign Credit Control Area (CCAA)',
          route: '/fico/credit-control-area-assignment',
          description: 'Assign Company Code to Credit Control Area – OB38'
        },
        {
          code: 'OBBP',
          label: 'Assign Posting Period Variant (PPVA)',
          route: '/fico/posting-period-variant-assignment',
          description: 'Assign Company Code to Posting Period Variant – OBBP'
        },
        {
          code: 'OBC5',
          label: 'Assign Field Status Variant (FSVA)',
          route: '/fico/field-status-variant-assignment',
          description: 'Assign Company Code to Field Status Variant – OBC5'
        },
        {
          code: 'OX16',
          label: 'Assign Company to Group (ECGA)',
          route: '/foundation/company-group-assignment',
          description: 'Assign Company Code to Company Group – OX16'
        }
      ]}
    />
  );
}
