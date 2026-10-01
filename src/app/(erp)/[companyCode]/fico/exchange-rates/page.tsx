"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FEXC"
      sapAlias="OB08"
      title="Exchange Rates – Currency Exchange Rates – M/B/G"
      description="Define Exchange Rates – currency exchange rates – from currency to currency, rate type M/B/G, rate, spread, translation ratio 100:1, direct/indirect quotation, validity from/to date, inverse fallback, cache 60s dragonfly – e.g., USD→INR 83.5 M average 83.6 B buying spread 0.1, JPY→USD 0.0075 100:1 (100 JPY = 0.75 USD) – strict industry standard: converts foreign currency transactions – KDM fail with reason and available rates – financial – own names"
      apiEndpoint="/api/exchange-rates"
      initialForm={{ 
        from_currency: 'USD', 
        to_currency: 'INR', 
        rate_type: 'M',
        rate: '83.5', 
        spread: '0.1',
        from_factor: '1',
        to_factor: '1',
        direct_quotation: 'true',
        from_date: '2026-01-01', 
        to_date: '2026-12-31', 
        description: 'USD→INR 83.5 M average – direct quotation – 1 USD = 83.5 INR' 
      }}
      fields={[
        { key: "from_currency", label: "FROM_CURRENCY", required: true, type: "autocomplete", apiUrl: "/api/currencies", dataKey: "currencies", codeField: "code", placeholder: "", createUrl: "/fico/currencies", createCode: "FCYC", description: "From currency – e.g., USD – from currency – industry standard – FCYC" },
        { key: "to_currency", label: "TO_CURRENCY", required: true, type: "autocomplete", apiUrl: "/api/currencies", dataKey: "currencies", codeField: "code", placeholder: "", createUrl: "/fico/currencies", createCode: "FCYC", description: "To currency – e.g., INR – to currency – industry standard" },
        { key: "rate_type", label: "RATE_TYPE", required: true, type: "select", options: ["M", "B", "G"], placeholder: "", description: "Rate type – M Average (standard), B Buying, G Selling – e.g., M average 83.5, B buying 83.6 with spread 0.1 – industry standard – OB08 – F_EXC_RATE – M/B/G" },
        { key: "rate", label: "EXCHANGE_RATE", required: true, placeholder: "", description: "Exchange rate – e.g., 83.5 – 1 USD = 83.5 INR – rate – industry standard – e.g., USD→INR 83.5 M, JPY→USD 0.0075" },
        { key: "spread", label: "SPREAD", placeholder: "", description: "Spread – e.g., 0.1 – difference between buying and selling – B = M + spread/2, G = M - spread/2 – industry standard – e.g., M 83.5 spread 0.1 → B 83.6 buying, G 83.4 selling" },
        { key: "from_factor", label: "FROM_FACTOR", placeholder: "", description: "Translation ratio from factor – e.g., 1 – from factor – for ratio 100:1 – e.g., JPY→USD 0.0075 with 100:1 ratio 100 JPY = 0.75 USD – from_factor 100 to_factor 1 – industry standard – translation ratio" },
        { key: "to_factor", label: "TO_FACTOR", placeholder: "", description: "Translation ratio to factor – e.g., 1 – to factor – e.g., 100:1 ratio – from_factor 100 to_factor 1 – industry standard" },
        { key: "direct_quotation", label: "DIRECT_QUOTATION", type: "select", options: ["true", "false"], placeholder: "", description: "Direct quotation – true if direct (1 FROM = rate TO), false if indirect (1 TO = rate FROM) – e.g., USD→INR direct true 1 USD = 83.5 INR, indirect false 1 INR = 0.012 USD – industry standard – direct/indirect" },
        { key: "from_date", label: "VALID_FROM_DATE", required: true, placeholder: "", description: "Valid from date – e.g., 2026-01-01 – validity – from date – industry standard – validity – exchange rate valid from/to" },
        { key: "to_date", label: "VALID_TO_DATE", required: true, placeholder: "", description: "Valid to date – e.g., 2026-12-31 – validity – to date – industry standard – if posting date not in validity, inverse fallback or KDM fail" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "", description: "Description – e.g., USD→INR 83.5 M average – direct quotation – spread 0.1 – translation ratio 100:1 – inverse fallback – cache 60s dragonfly – KDM" },
      ]}
      relatedLinks={[
        { code: "FCYC", label: "Currency – INR/USD/EUR/KWD – required – FCYC", route: "/fico/currencies", description: "Currency – INR Indian Rupee ₹, USD US Dollar $, EUR Euro €, KWD Kuwaiti Dinar – currency master" },
        { code: "FEXC", label: "Exchange Rates – self – M/B/G – spread 0.1 – 100:1", route: "/fico/exchange-rates", description: "Exchange Rates – M/B/G, spread, translation ratio, direct/indirect, validity, inverse fallback, cache 60s, KDM" },
        { code: "FUNL", label: "Universal Ledger – ACDOCA – foreign currency – uses exchange rates", route: "/fico/universal-ledger", description: "Universal Ledger – 400+ fields – foreign currency USD 1000, company currency INR 83500 – BSX – uses exchange rates for translation" },
        { code: "FSTL", label: "Stock Ledger – material ledger – 3 currencies – uses exchange rates", route: "/foundation/stock", description: "Stock Ledger – total stock/value, MAP, S/V, batch, 3 currencies" },
      ]}
    />
  );
}
