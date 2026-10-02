"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="ECAC"
      sapAlias="OX06 / OKKP"
      title="Controlling Area"
      description="Maintain Controlling Area – Management Accounting (CO) enterprise organizational unit. Configures Cross-Company-Code Cost Accounting, Currency Type, Fiscal Year Variant, Chart of Accounts, and Cost Center Standard Hierarchy."
      apiEndpoint="/api/control-areas"
      initialForm={{
        code: '',
        name: '',
        assignment_control: '2',
        currency_type: '10',
        currency_code: 'INR',
        chart_of_accounts_code: 'CA-IN-01',
        fiscal_year_variant: 'V3',
        cost_center_standard_hierarchy: '',
        description: ''
      }}
      fields={[
        {
          key: "code",
          label: "CONTROLLING_AREA_CODE",
          required: true,
          placeholder: "",
          description: "4-character Controlling Area code (e.g. 1000, CA01, AM01) – TKA01-KOKRS"
        },
        {
          key: "name",
          label: "CONTROLLING_AREA_NAME",
          required: true,
          placeholder: "",
          description: "Name of the Controlling Area – TKA01-BEZEI"
        },
        {
          key: "assignment_control",
          label: "CO_ASSIGNMENT_CONTROL",
          required: true,
          type: "select",
          options: [
            { value: "1", label: "1: Controlling Area same as Company Code (1:1)" },
            { value: "2", label: "2: Cross-Company-Code Cost Accounting (1:N)" }
          ],
          placeholder: "",
          description: "Assignment Control: Determines whether multiple company codes can be assigned to this controlling area (TKA01-KNTXT)"
        },
        {
          key: "currency_type",
          label: "CURRENCY_TYPE",
          required: true,
          type: "select",
          options: [
            { value: "10", label: "10: Company Code Currency" },
            { value: "20", label: "20: Controlling Area Currency" },
            { value: "30", label: "30: Group Currency" }
          ],
          placeholder: "",
          description: "Currency Type in Management Accounting: 10 = Company code currency, 20 = CO area currency, 30 = Group currency"
        },
        {
          key: "currency_code",
          label: "CURRENCY_CODE",
          required: true,
          type: "autocomplete",
          apiUrl: "/api/currencies",
          dataKey: "currencies",
          codeField: "code",
          placeholder: "",
          createUrl: "/fico/currencies",
          createCode: "FCYC",
          description: "Controlling Area Currency (e.g. INR, USD, EUR, KWD) – TKA01-WAERS"
        },
        {
          key: "chart_of_accounts_code",
          label: "CHART_OF_ACCOUNTS_CODE",
          type: "autocomplete",
          apiUrl: "/api/chart-of-accounts",
          dataKey: "chartOfAccounts",
          codeField: "code",
          placeholder: "",
          createUrl: "/fico/chart-of-accounts",
          createCode: "FCOA",
          description: "Operative Chart of Accounts for cost elements (e.g. CA-IN-01) – TKA01-KTOPL"
        },
        {
          key: "fiscal_year_variant",
          label: "FISCAL_YEAR_VARIANT",
          required: true,
          type: "autocomplete",
          apiUrl: "/api/fiscal-calendars",
          dataKey: "fiscalCalendars",
          codeField: "code",
          placeholder: "",
          createUrl: "/fico/fiscal-calendars",
          createCode: "FFYC",
          description: "Fiscal Year Variant for Management Accounting (e.g. V3, K4, V6, V9) – TKA01-PERIV"
        },
        {
          key: "cost_center_standard_hierarchy",
          label: "STANDARD_HIERARCHY",
          required: true,
          placeholder: "",
          description: "Cost Center Standard Hierarchy Top Node (e.g. AM01, HIER01, H1000) – TKA01-KHINR"
        },
        {
          key: "description",
          label: "DESCRIPTION",
          type: "textarea",
          placeholder: "",
          description: "Scope, business purpose, and notes for this Controlling Area"
        }
      ]}
      relatedLinks={[
        { code: "OX19", label: "Assign Company Code to Controlling Area (OX19)", route: "/fico/assignments/controlling-area", description: "Assign one or more Company Codes to this Controlling Area" },
        { code: "FCOA", label: "Chart of Accounts (OB13)", route: "/fico/chart-of-accounts", description: "Maintain Operative Chart of Accounts" },
        { code: "FFYC", label: "Fiscal Year Variant (OB29)", route: "/fico/fiscal-calendars", description: "Maintain Fiscal Calendar Variant (e.g. V3, K4)" },
        { code: "KS01", label: "Cost Center (KS01)", route: "/fico/cost-centers", description: "Create Cost Centers under Standard Hierarchy" },
        { code: "KE51", label: "Profit Center (KE51)", route: "/foundation/commercial-units", description: "Profit Centers grouped under Controlling Area" }
      ]}
    />
  );
}
