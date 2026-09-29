"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FFYC"
      sapAlias="OB29"
      title="Fiscal Calendar"
      description="Define Fiscal Calendar – K4 April-March India, V3 Calendar Year Jan-Dec – FROM_DATE TO_DATE required – strict usage: calculates fiscal year/period from posting date – e.g., 2026-05-15 K4 → FY2026 P02"
      apiEndpoint="/api/fiscal-calendars"
      initialForm={{ code: '', name: '', from_date: '', to_date: '', start_month: '4', end_month: '3', year_shift: '0', description: '' }}
      fields={[
        { key: "code", label: "FISCAL_CALENDAR_CODE", required: true, placeholder: "K4", description: "Fiscal calendar code – K4 April-March, V3 Calendar Year" },
        { key: "name", label: "FISCAL_CALENDAR_NAME", required: true, placeholder: "April-March India" },
        { key: "from_date", label: "FROM_DATE", required: true, placeholder: "2026-04-01", description: "From date – e.g., 2026-04-01 for K4" },
        { key: "to_date", label: "TO_DATE", required: true, placeholder: "2027-03-31", description: "To date – e.g., 2027-03-31 for K4 – must be after from_date" },
        { key: "start_month", label: "START_MONTH", placeholder: "4", description: "Start month 1-12 – K4=4 April, V3=1 January" },
        { key: "end_month", label: "END_MONTH", placeholder: "3", description: "End month 1-12 – K4=3 March, V3=12 December" },
        { key: "year_shift", label: "YEAR_SHIFT", placeholder: "0", description: "Year shift – 0 for K4, 0 for V3" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "ELEC", label: "Legal Entity uses FFYC", route: "/foundation/legal-entities", description: "Legal Entity requires fiscal calendar" },
        { code: "FPPC", label: "Posting Period Variant", route: "/fico/posting-period-variants", description: "Posting Period Variant" },
        { code: "FPPE", label: "Posting Period Control", route: "/fico/posting-periods", description: "Posting Period Control" },
      ]}
    />
  );
}
