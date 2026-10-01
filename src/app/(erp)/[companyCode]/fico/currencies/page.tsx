"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FCYC"
      sapAlias="OY03"
      title="Currencies – Currency Master"
      description="Define Currencies – currency master – code, name, symbol, decimal places, is active – e.g., INR Indian Rupee ₹, USD US Dollar $, EUR Euro €, KWD Kuwaiti Dinar – strict industry standard: currency used in legal entity, company code, facility, partner (vendor/customer), PO, SO, IV, Billing, exchange rates – currency – financial – own names"
      apiEndpoint="/api/currencies"
      initialForm={{ code: '', name: '', symbol: '', decimal_places: '2', is_active: 'true', description: '' }}
      fields={[
        { key: "code", label: "CURRENCY_CODE", required: true, placeholder: "", description: "Currency code – e.g., INR Indian Rupee, USD US Dollar, EUR Euro, KWD Kuwaiti Dinar – ISO 4217 – 3-char – industry standard – own name – used in legal entity, partner, PO, SO, exchange rates – FCYC" },
        { key: "name", label: "CURRENCY_NAME", required: true, placeholder: "", description: "Currency name – e.g., Indian Rupee – descriptive" },
        { key: "symbol", label: "CURRENCY_SYMBOL", placeholder: "", description: "Currency symbol – e.g., ₹ for INR, $ for USD, € for EUR – used in display – industry standard" },
        { key: "decimal_places", label: "DECIMAL_PLACES", placeholder: "", description: "Decimal places – e.g., 2 for INR/USD/EUR, 3 for KWD, 0 for JPY – industry standard – controls amount formatting – e.g., INR 2 decimals 100.00, KWD 3 decimals 100.000, JPY 0 decimals 100" },
        { key: "is_active", label: "IS_ACTIVE", type: "select", options: ["true", "false"], placeholder: "", description: "Active – true if currency active for use – industry standard" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "", description: "Description – currency purpose – e.g., Indian Rupee for India" },
      ]}
      relatedLinks={[
        { code: "ELEC", label: "Legal Entity – company code – uses Currency – INR", route: "/foundation/legal-entities", description: "Legal Entity – LE-1000 – currency_code INR – company code" },
        { code: "EFCC", label: "Facility – plant – uses Currency via Legal Entity", route: "/foundation/facilities", description: "Facility – plant – FAC-1000 – currency via legal entity" },
        { code: "PSUC", label: "Supplier – vendor – uses Currency – INR/USD", route: "/foundation/suppliers", description: "Supplier – vendor master – currency_code INR – payment currency" },
        { code: "SCUC", label: "Customer – customer – uses Currency – INR", route: "/foundation/customers", description: "Customer – customer master – currency_code INR" },
        { code: "FEXC", label: "Exchange Rates – OB08 – M/B/G – uses Currency – USD→INR 83.5", route: "/fico/exchange-rates", description: "Exchange Rates – OB08 – rate types M/B/G, spread, translation ratio 100:1, direct/indirect, validity, inverse fallback, cache 60s dragonfly KDM – FEXC" },
        { code: "PPOC", label: "Purchase Order – PPOC (legacy ME21N) – uses Currency – PO currency", route: "/mm/po", description: "PO – currency from supplier or legal entity – PO currency" },
        { code: "VASL", label: "Sales Order – VA01 – uses Currency – SO currency", route: "/sd/sales-orders", description: "SO – currency from customer or commercial org" },
      ]}
    />
  );
}
