"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FEXC"
      sapAlias="OB08"
      title="Exchange Rates"
      description="Define Exchange Rates – from currency to currency rate – FROM_DATE TO_DATE – strict usage: converts foreign currency transactions – e.g., INR to USD rate"
      apiEndpoint="/api/exchange-rates"
      initialForm={{ from_currency: 'INR', to_currency: 'USD', rate: '0.012', from_date: '', to_date: '', description: '' }}
      fields={[
        { key: "from_currency", label: "FROM_CURRENCY", required: true, type: "autocomplete", apiUrl: "/api/currencies", dataKey: "currencies", codeField: "code", placeholder: "INR", createUrl: "/fico/currencies", createCode: "FCYC", description: "From currency – e.g., INR" },
        { key: "to_currency", label: "TO_CURRENCY", required: true, type: "autocomplete", apiUrl: "/api/currencies", dataKey: "currencies", codeField: "code", placeholder: "USD", createUrl: "/fico/currencies", createCode: "FCYC", description: "To currency – e.g., USD" },
        { key: "rate", label: "EXCHANGE_RATE", required: true, placeholder: "0.012", description: "Exchange rate – e.g., 1 INR = 0.012 USD" },
        { key: "from_date", label: "FROM_DATE", required: true, placeholder: "2026-01-01", description: "Valid from date" },
        { key: "to_date", label: "TO_DATE", placeholder: "2026-12-31", description: "Valid to date" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "FCYC", label: "Currency – required", route: "/fico/currencies", description: "Currency" },
        { code: "FEXC", label: "Exchange Rates – self", route: "/fico/exchange-rates", description: "Exchange Rates" },
      ]}
    />
  );
}
