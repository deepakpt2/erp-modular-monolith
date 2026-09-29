"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';
export default function Page() {
  return (
    <SingleCodePage
      code="FFYC"
      sapAlias="OB29"
      title="Fiscal Calendar"
      description="Define Fiscal Calendar – K4 April-March India, V3 Calendar Year Jan-Dec – FROM_DATE TO_DATE optional – variant is year-independent – K4 works for any year via START_MONTH=4 END_MONTH=3 – year_dependent, calendar_year, number_of_periods per guide – strict usage: calculates fiscal year/period from posting date – e.g., 2026-05-15 K4 → FY2026 P02"
      apiEndpoint="/api/fiscal-calendars"
      initialForm={{ code: '', name: '', from_date: '', to_date: '', start_month: '4', end_month: '3', year_shift: '0', year_dependent: 'false', calendar_year: 'false', number_of_periods: '12', description: '' }}
      fields={[
        { key: "code", label: "FISCAL_CALENDAR_CODE", required: true, placeholder: "K4", description: "Fiscal calendar code – K4 April-March, V3 Calendar Year – variant is year-independent" },
        { key: "name", label: "FISCAL_CALENDAR_NAME", required: true, placeholder: "April-March India – K4" },
        { key: "start_month", label: "START_MONTH", required: true, placeholder: "4", description: "Start month 1-12 – K4=4 April, V3=1 January – year-independent" },
        { key: "end_month", label: "END_MONTH", required: true, placeholder: "3", description: "End month 1-12 – K4=3 March, V3=12 December" },
        { key: "year_shift", label: "YEAR_SHIFT", placeholder: "0", description: "Year shift – 0 for K4 Apr-Dec same FY, -1 for Jan-Mar previous FY" },
        { key: "year_dependent", label: "YEAR_DEPENDENT", required: true, type: 'select', options: ['true','false'], placeholder: "Select year_dependent", description: "Year dependent – false per guide – K4 not year dependent – variant works for any year – was missing in form per report" },
        { key: "calendar_year", label: "CALENDAR_YEAR", required: true, type: 'select', options: ['true','false'], placeholder: "Select calendar_year", description: "Calendar year – false per guide – K4 April-March not calendar year – V3 true – was missing in form" },
        { key: "number_of_periods", label: "NUMBER_OF_PERIODS", required: true, placeholder: "12", description: "Number of periods – 12 per guide – 12 months – was missing in form per report" },
        { key: "from_date", label: "FROM_DATE – Optional FY2026", placeholder: "2026-04-01", description: "Optional – fixed date for initial FY e.g., FY2026 2026-04-01 – variant still works for any year via start_month/end_month" },
        { key: "to_date", label: "TO_DATE – Optional FY2026", placeholder: "2027-03-31", description: "Optional – fixed date for initial FY e.g., FY2026 2027-03-31 – must be after from_date" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "K4 April-March India – year_dependent false calendar_year false number_of_periods 12 – year-independent" },
      ]}
      relatedLinks={[
        { code: "ELEC", label: "Legal Entity uses FFYC – K4", route: "/foundation/legal-entities", description: "Legal Entity requires fiscal calendar – K4 – fiscal_year_variant" },
        { code: "FCOA", label: "Chart of Accounts CA-IN-01", route: "/fico/chart-of-accounts", description: "Chart of Accounts must exist before ELEC – CA-IN-01 language EN" },
        { code: "FPPC", label: "Posting Period Variant PPV-1000", route: "/fico/posting-period-variants", description: "Posting Period Variant – must exist before ELEC" },
        { code: "FCPC", label: "Credit Control Area CRED-1000", route: "/foundation/credit-policy-areas", description: "Credit Control Area must exist before OB13/ELEC" },
      ]}
    />
  );
}
