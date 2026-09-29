"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FPPE"
      sapAlias="OB52"
      title="Posting Period Control"
      description="Open Close Posting Periods – defines which periods are open for which account types – strict usage: rejects posting if period closed – e.g., close 03/2026 open 04/2026"
      apiEndpoint="/api/posting-periods"
      initialForm={{ variant_code: '1000', account_type: '+', from_period: '1', from_year: '2026', to_period: '12', to_year: '2026', is_open: 'true', description: '' }}
      fields={[
        { key: "variant_code", label: "POSTING_PERIOD_VARIANT_CODE", required: true, type: "autocomplete", apiUrl: "/api/posting-period-variants", dataKey: "postingPeriodVariants", codeField: "code", placeholder: "1000", createUrl: "/fico/posting-period-variants", createCode: "FPPC", description: "Variant FK – must exist via OBBO" },
        { key: "account_type", label: "ACCOUNT_TYPE", required: true, type: "select", options: ['+', 'A', 'D', 'K', 'M', 'S', 'V'], placeholder: "+", description: "+ All, A Assets, D Customers, K Vendors, M Materials, S GL, V Contract – strict enforcement" },
        { key: "from_period", label: "FROM_PERIOD", required: true, placeholder: "1", description: "From period 1-12" },
        { key: "from_year", label: "FROM_YEAR", required: true, placeholder: "2026" },
        { key: "to_period", label: "TO_PERIOD", required: true, placeholder: "12" },
        { key: "to_year", label: "TO_YEAR", required: true, placeholder: "2026" },
        { key: "is_open", label: "IS_OPEN", type: "select", options: ['true', 'false'], placeholder: "true", description: "true open, false closed – strict enforcement rejects if closed" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "FPPC", label: "Posting Period Variant – required", route: "/fico/posting-period-variants", description: "Variant" },
        { code: "IGRC", label: "Goods Receipt checks OB52", route: "/mm/gr", description: "GR checks posting period" },
        { code: "PIVC", label: "Invoice Verification checks OB52", route: "/mm/iv", description: "IV checks" },
        { code: "SBLC", label: "Billing checks OB52", route: "/sd/billing", description: "Billing checks" },
      ]}
    />
  );
}
