"use client";

import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FPPE"
      sapAlias="OB52"
      title="Posting Period Control – Open and Close Posting Periods"
      description="Industry Standard Configuration: Controls open and closed posting periods for each variant across account types (+, A, D, K, M, S, V) for Period 1 (Normal 1-12) and Period 2 (Special 13-16)."
      apiEndpoint="/api/posting-periods"
      initialForm={{
        variant_code: '',
        account_type: '+',
        from_account: '',
        to_account: '',
        from_period: '1',
        from_year: '2026',
        to_period: '12',
        to_year: '2026',
        from_period2: '13',
        from_year2: '2026',
        to_period2: '16',
        to_year2: '2026',
        authorization_group: '',
        is_open: 'true',
        description: ''
      }}
      fields={[
        {
          key: "variant_code",
          label: "POSTING_PERIOD_VARIANT",
          required: true,
          type: "autocomplete",
          apiUrl: "/api/posting-period-variants",
          dataKey: "postingPeriodVariants",
          codeField: "code",
          placeholder: "e.g. 1000, KS01, AM01",
          createUrl: "/fico/posting-period-variants",
          createCode: "OBBO",
          description: "Posting Period Variant code "
        },
        {
          key: "account_type",
          label: "ACCOUNT_TYPE",
          required: true,
          type: "select",
          options: [
            "+ (Valid for all account types)",
            "A (Assets)",
            "D (Customers)",
            "K (Vendors)",
            "M (Materials)",
            "S (G/L Accounts)",
            "V (Contract Accounts)"
          ],
          description: "Account Type: + must be maintained first for all accounts, followed by specific subledgers"
        },
        {
          key: "from_account",
          label: "FROM_ACCOUNT",
          placeholder: "e.g. 100000 (leave blank for all accounts)",
          description: "From G/L Account or Subledger range – leave blank to include starting accounts"
        },
        {
          key: "to_account",
          label: "TO_ACCOUNT",
          placeholder: "e.g. 999999 (leave blank for all accounts)",
          description: "To G/L Account or Subledger range – leave blank to include all ending accounts"
        },
        {
          key: "from_period",
          label: "PERIOD_1_FROM_PERIOD",
          required: true,
          placeholder: "1",
          description: "Interval 1: Normal posting start period "
        },
        {
          key: "from_year",
          label: "PERIOD_1_FROM_YEAR",
          required: true,
          placeholder: "2026",
          description: "Interval 1: Normal posting start fiscal year"
        },
        {
          key: "to_period",
          label: "PERIOD_1_TO_PERIOD",
          required: true,
          placeholder: "12",
          description: "Interval 1: Normal posting end period "
        },
        {
          key: "to_year",
          label: "PERIOD_1_TO_YEAR",
          required: true,
          placeholder: "2026",
          description: "Interval 1: Normal posting end fiscal year"
        },
        {
          key: "from_period2",
          label: "PERIOD_2_SPECIAL_FROM_PERIOD",
          placeholder: "13",
          description: "Interval 2: Special closing start period "
        },
        {
          key: "from_year2",
          label: "PERIOD_2_SPECIAL_FROM_YEAR",
          placeholder: "2026",
          description: "Interval 2: Special closing start fiscal year"
        },
        {
          key: "to_period2",
          label: "PERIOD_2_SPECIAL_TO_PERIOD",
          placeholder: "16",
          description: "Interval 2: Special closing end period "
        },
        {
          key: "to_year2",
          label: "PERIOD_2_SPECIAL_TO_YEAR",
          placeholder: "2026",
          description: "Interval 2: Special closing end fiscal year"
        },
        {
          key: "authorization_group",
          label: "AUTHORIZATION_GROUP",
          placeholder: "e.g. AUDIT, CLOSE",
          description: "Authorization Group for period opening/closing to restrict special period postings"
        },
        {
          key: "is_open",
          label: "POSTING_STATUS",
          required: true,
          type: "select",
          options: ["true", "false"],
          description: "Posting Status: true = OPEN for financial documents, false = CLOSED (blocks postings)"
        },
        {
          key: "description",
          label: "DESCRIPTION",
          type: "textarea",
          placeholder: "Operational rationale or business note for this period rule",
          description: "Notes or description for this period authorization rule"
        }
      ]}
      relatedLinks={[
        { code: "OBBO", label: "Define Posting Period Variant (FPPC)", route: "/fico/posting-period-variants", description: "Define Variant" },
        { code: "OBBP", label: "Assign Company Code to Variant", route: "/fico/assignments/posting-period-variant", description: "Assign Company Code" },
        { code: "OB29", label: "Fiscal Year Variant (FFYC)", route: "/fico/fiscal-calendars", description: "Define Fiscal Year Periods" },
        { code: "FB01", label: "Post General Journal", route: "/fico/journal-entries", description: "Document Postings" }
      ]}
    />
  );
}
