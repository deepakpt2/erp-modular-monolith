"use client";

import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FPPE"
      sapAlias="OB52"
      title="Posting Period Control – Open and Close Posting Periods"
      description="Standard Industry Customizing Table (T001B): Controls open and closed posting periods for each variant across account types (Normal Periods 1-12 and Special Closing Periods 13-16)."
      apiEndpoint="/api/posting-periods"
      initialForm={{
        variant_code: '',
        account_type: '+',
        from_account: '',
        to_account: 'ZZZZZZZZZZ',
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
        description: 'Standard 1-12 open periods'
      }}
      fields={[
        {
          key: "variant_code",
          label: "POSTING_PERIOD_VARIANT_CODE",
          required: true,
          type: "autocomplete",
          apiUrl: "/api/posting-period-variants",
          dataKey: "postingPeriodVariants",
          codeField: "code",
          placeholder: "e.g. 1000, KS01, AM01",
          createUrl: "/fico/posting-period-variants",
          createCode: "OBBO",
          description: "Posting Period Variant code (T001B-MANDT / OBBO / FPPC) assigned to Company Code in OBBP"
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
          description: "Account Type (T001B-KOART): + = All accounts (must be maintained first), A/D/K/M/S/V = Specific subledgers"
        },
        {
          key: "from_account",
          label: "FROM_ACCOUNT",
          placeholder: "Leave empty for all or specify e.g. 100000",
          description: "From G/L Account or Subledger range (T001B-VONAK) – leave blank to include starting accounts"
        },
        {
          key: "to_account",
          label: "TO_ACCOUNT",
          placeholder: "e.g. ZZZZZZZZZZ",
          description: "To G/L Account or Subledger range (T001B-BISAK) – default ZZZZZZZZZZ for upper limit"
        },
        {
          key: "from_period",
          label: "PERIOD_1_FROM_PERIOD",
          required: true,
          placeholder: "1",
          description: "Normal posting period interval 1: start period (T001B-FRPE1, usually 1)"
        },
        {
          key: "from_year",
          label: "PERIOD_1_FROM_YEAR",
          required: true,
          placeholder: "2026",
          description: "Normal posting period interval 1: start fiscal year (T001B-FRYE1)"
        },
        {
          key: "to_period",
          label: "PERIOD_1_TO_PERIOD",
          required: true,
          placeholder: "12",
          description: "Normal posting period interval 1: end period (T001B-TOPE1, usually 12)"
        },
        {
          key: "to_year",
          label: "PERIOD_1_TO_YEAR",
          required: true,
          placeholder: "2026",
          description: "Normal posting period interval 1: end fiscal year (T001B-TOYE1)"
        },
        {
          key: "from_period2",
          label: "PERIOD_2_SPECIAL_FROM_PERIOD",
          placeholder: "13",
          description: "Special closing period interval 2: start period (T001B-FRPE2, e.g. 13 for year-end adjustments)"
        },
        {
          key: "from_year2",
          label: "PERIOD_2_SPECIAL_FROM_YEAR",
          placeholder: "2026",
          description: "Special closing period interval 2: start fiscal year (T001B-FRYE2)"
        },
        {
          key: "to_period2",
          label: "PERIOD_2_SPECIAL_TO_PERIOD",
          placeholder: "16",
          description: "Special closing period interval 2: end period (T001B-TOPE2, e.g. 16 for audit adjustments)"
        },
        {
          key: "to_year2",
          label: "PERIOD_2_SPECIAL_TO_YEAR",
          placeholder: "2026",
          description: "Special closing period interval 2: end fiscal year (T001B-TOYE2)"
        },
        {
          key: "authorization_group",
          label: "AUTHORIZATION_GROUP",
          placeholder: "e.g. AUDIT, CLOSE",
          description: "Authorization Group for period opening/closing (T001B-BRGRU / F_BKPF_BUP) to restrict period 2 postings"
        },
        {
          key: "is_open",
          label: "IS_OPEN",
          required: true,
          type: "select",
          options: ["true", "false"],
          description: "Posting Status: true = OPEN for financial documents, false = CLOSED (T0 blocking rejection)"
        },
        {
          key: "description",
          label: "DESCRIPTION",
          type: "textarea",
          placeholder: "Audit/accounting rationale for this period authorization window",
          description: "Operational or audit note for accounting period control"
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
