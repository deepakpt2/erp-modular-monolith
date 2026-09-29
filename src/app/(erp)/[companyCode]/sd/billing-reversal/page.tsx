"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="BLRE"
      sapAlias="VF11"
      title="Billing Reversal"
      description="Reverse Billing Document – VF11 – strict usage: reverses billing, reverses revenue and customer receivable"
      apiEndpoint="/api/billing-reversal"
      initialForm={{ original_billing_code: '', reason: '', posting_date: '' }}
      fields={[
        { key: "original_billing_code", label: "ORIGINAL_BILLING_CODE", required: true, placeholder: "BL-1000000001" },
        { key: "reason", label: "REASON", required: true, placeholder: "Wrong pricing" },
        { key: "posting_date", label: "POSTING_DATE", required: true, placeholder: "2026-05-15" },
      ]}
      relatedLinks={[
        { code: "SBLC", label: "Billing – original", route: "/sd/billing", description: "Billing VF01" },
      ]}
    />
  );
}
