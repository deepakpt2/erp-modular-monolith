"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="SBLC-REV"
      sapAlias="VF11"
      title="Billing Reversals"
      description="Reverse Billing Document – VF11 – strict usage: reverses billing, reverses revenue and customer receivable"
      apiEndpoint="/api/billing-reversal"
      initialForm={{ original_billing_code: '', reason: '', posting_date: '' }}
      fields={[
        { key: "original_billing_code", label: "ORIGINAL_BILLING_CODE", required: true, placeholder: "" },
        { key: "reason", label: "REASON", required: true, placeholder: "" },
        { key: "posting_date", label: "POSTING_DATE", required: true, placeholder: "" },
      ]}
      relatedLinks={[
        { code: "SBLC", label: "Billing – original", route: "/sd/billing", description: "Billing VF01" },
      ]}
    />
  );
}
