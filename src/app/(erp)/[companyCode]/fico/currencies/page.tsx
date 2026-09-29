"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FCYC"
      sapAlias="OY03"
      title="Currencies"
      description="Define Currencies – only INR default – code name symbol – strict usage: currency used in legal entity, exchange rates, pricing"
      apiEndpoint="/api/currencies"
      initialForm={{ code: '', name: '', symbol: '', description: '' }}
      fields={[
        { key: "code", label: "CURRENCY_CODE", required: true, placeholder: "INR" },
        { key: "name", label: "CURRENCY_NAME", required: true, placeholder: "Indian Rupee" },
        { key: "symbol", label: "CURRENCY_SYMBOL", placeholder: "₹" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "ELEC", label: "Legal Entity uses Currency", route: "/foundation/legal-entities", description: "Legal Entity" },
        { code: "FEXC", label: "Exchange Rates uses Currency", route: "/fico/exchange-rates", description: "Exchange Rates" },
      ]}
    />
  );
}
