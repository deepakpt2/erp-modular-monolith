"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';
export default function Page() {
  return (
    <SingleCodePage
      code="FFYC"
      sapAlias="OB29"
      title="Fiscal Calendar"
      description="Define Fiscal Calendar – K4 April-March India, V3 Calendar Year Jan-Dec – FROM_DATE TO_DATE optional – variant is year-independent – K4 works for any year via START_MONTH=4 END_MONTH=3 – from_date/to_date only for initial FY definition e.g., FY2026 2026-04-01 to 2027-03-31 – strict usage: calculates fiscal year/period from posting date – e.g., 2026-05-15 K4 → FY2026 P02 – fixed date with year works as example FY, variant logic uses start_month/end_month/year_shift for any year"
      apiEndpoint="/api/fiscal-calendars"
      initialForm={{ code: '', name: '', from_date: '', to_date: '', start_month: '4', end_month: '3', year_shift: '0', description: '' }}
      fields={[
        { key: "code", label: "FISCAL_CALENDAR_CODE", required: true, placeholder: "K4", description: "Fiscal calendar code – K4 April-March, V3 Calendar Year – variant is year-independent – works for any year – e.g., K4" },
        { key: "name", label: "FISCAL_CALENDAR_NAME", required: true, placeholder: "April-March India – K4" },
        { key: "start_month", label: "START_MONTH", required: true, placeholder: "4", description: "Start month 1-12 – K4=4 April, V3=1 January – defines variant independent of year – e.g., K4 April start – year-independent logic" },
        { key: "end_month", label: "END_MONTH", required: true, placeholder: "3", description: "End month 1-12 – K4=3 March, V3=12 December – variant template – year-independent" },
        { key: "year_shift", label: "YEAR_SHIFT", placeholder: "0", description: "Year shift – 0 for K4 Apr-Dec same FY, -1 for Jan-Mar previous FY – e.g., posting 2026-02-15 K4 → FY2025 because Jan-Mar belongs to previous FY – handles fixed date with year" },
        { key: "from_date", label: "FROM_DATE – Optional FY2026", placeholder: "2026-04-01", description: "Optional – fixed date for initial FY e.g., FY2026 2026-04-01 – if fixed year, variant still works for any year via start_month/end_month – e.g., K4 2026-04-01 to 2027-03-31 defines FY2026, but posting 2027-05-15 auto calculates FY2027 P02 via start_month logic – so fixed date is just example FY, variant is year-independent – answers 'how would a fixed date with year work for it'" },
        { key: "to_date", label: "TO_DATE – Optional FY2026", placeholder: "2027-03-31", description: "Optional – fixed date for initial FY e.g., FY2026 2027-03-31 – must be after from_date – if not provided, system uses start_month/end_month to calculate FY for any posting date – year-independent variant" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "K4 April-March India – year-independent – works for FY2026, FY2027, etc. via start_month=4 end_month=3 – from_date/to_date optional for FY2026 definition – fixed date with year works as example FY" },
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
