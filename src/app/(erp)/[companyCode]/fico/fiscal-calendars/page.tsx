"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page({ defaultMode, codeOverride, titleOverride }: { defaultMode?: any; codeOverride?: string; titleOverride?: string } = {}) {
  return (
    <SingleCodePage
      defaultMode={defaultMode}
      code={codeOverride || "FFYC"}
      sapAlias="OB29"
      title={titleOverride || "Fiscal Year Variant"}
      description="Maintain Fiscal Year Variant (OB29) – configures posting periods (e.g. 12 normal periods), special periods (e.g. 4 for closing entries), calendar year vs non-calendar year (e.g. V3 April-March), and calendar month mapping with year shift (-1, 0, +1)."
      apiEndpoint="/api/fiscal-calendars"
      initialForm={{
        code: '',
        name: '',
        number_of_periods: '12',
        number_of_special_periods: '4',
        calendar_year: 'false',
        year_dependent: 'false',
        start_month: '4',
        end_month: '3',
        year_shift: '0',
        from_date: '',
        to_date: '',
        description: ''
      }}
      fields={[
        {
          key: "code",
          label: "FISCAL_YEAR_VARIANT_CODE",
          required: true,
          placeholder: "",
          description: "2-character Fiscal Year Variant key (e.g. K4 = Calendar year, V3 = April to March, V6 = July to June, V9 = Oct to Sep)"
        },
        {
          key: "name",
          label: "FISCAL_YEAR_VARIANT_NAME",
          required: true,
          placeholder: "",
          description: "Descriptive name for the Fiscal Year Variant"
        },
        {
          key: "number_of_periods",
          label: "NUMBER_OF_POSTING_PERIODS",
          required: true,
          placeholder: "12",
          description: "Number of regular posting periods per fiscal year (standard: 12)"
        },
        {
          key: "number_of_special_periods",
          label: "NUMBER_OF_SPECIAL_PERIODS",
          required: true,
          placeholder: "4",
          description: "Number of special periods for year-end audit and closing adjustments (standard: 4, e.g. periods 13-16)"
        },
        {
          key: "calendar_year",
          label: "CALENDAR_YEAR",
          required: true,
          type: "select",
          options: [
            { value: "true", label: "Yes (Jan 1 to Dec 31, e.g. K4)" },
            { value: "false", label: "No (Non-calendar year, e.g. V3, V6, V9)" }
          ],
          placeholder: "",
          description: "Set to Yes if fiscal year matches calendar year (Jan 1 to Dec 31)"
        },
        {
          key: "year_dependent",
          label: "YEAR_DEPENDENT",
          required: true,
          type: "select",
          options: [
            { value: "false", label: "No (Year-independent standard cycle)" },
            { value: "true", label: "Yes (Periods change per calendar year)" }
          ],
          placeholder: "",
          description: "Set to Yes only if period date boundaries vary year by year (e.g. 4-4-5 accounting)"
        },
        {
          key: "start_month",
          label: "START_CALENDAR_MONTH",
          placeholder: "4",
          description: "First calendar month of fiscal year: 1 = Jan (K4), 4 = April (V3), 7 = July (V6), 10 = Oct (V9)"
        },
        {
          key: "end_month",
          label: "END_CALENDAR_MONTH",
          placeholder: "3",
          description: "Last calendar month of fiscal year: 12 = Dec (K4), 3 = March (V3), 6 = June (V6), 9 = Sep (V9)"
        },
        {
          key: "year_shift",
          label: "YEAR_SHIFT",
          placeholder: "0",
          description: "Year shift for months falling into the following or preceding calendar year (-1, 0, +1)"
        },
        {
          key: "from_date",
          label: "INITIAL_FROM_DATE",
          placeholder: "YYYY-MM-DD",
          description: "Optional reference start date for current cycle (e.g. 2026-04-01)"
        },
        {
          key: "to_date",
          label: "INITIAL_TO_DATE",
          placeholder: "YYYY-MM-DD",
          description: "Optional reference end date for current cycle (e.g. 2027-03-31)"
        },
        {
          key: "description",
          label: "DESCRIPTION",
          type: "textarea",
          placeholder: "",
          description: "Statutory jurisdiction, accounting standards notes (GAAP / IFRS), and purpose"
        }
      ]}
      relatedLinks={[
        { code: "OB37", label: "Assign Company Code to Fiscal Year Variant (OB37)", route: "/fico/assignments/fiscal-year-variant", description: "Assign this Fiscal Calendar Variant to Company Codes" },
        { code: "OB52", label: "Posting Periods Open/Close (OB52)", route: "/fico/posting-periods", description: "Maintain open and closed posting periods per account type" },
        { code: "OBBO", label: "Posting Period Variant (OBBO)", route: "/fico/posting-period-variants", description: "Define Posting Period Variants" },
        { code: "OX06", label: "Controlling Area (OX06 / OKKP)", route: "/foundation/control-areas", description: "Assign Fiscal Year Variant to Controlling Area" }
      ]}
    />
  );
}
