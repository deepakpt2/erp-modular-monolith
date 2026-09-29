"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="IVRE"
      sapAlias="MR8M"
      title="Invoice Verification Reversal"
      description="Reverse Invoice Verification – MR8M – strict usage: reverses IV, posts opposite WRX/Vendor"
      apiEndpoint="/api/iv-reversal"
      initialForm={{ original_iv_code: '', reason: '', posting_date: '' }}
      fields={[
        { key: "original_iv_code", label: "ORIGINAL_IV_CODE", required: true, placeholder: "IV-5000000001" },
        { key: "reason", label: "REASON", required: true, placeholder: "Wrong amount" },
        { key: "posting_date", label: "POSTING_DATE", required: true, placeholder: "2026-05-15" },
      ]}
      relatedLinks={[
        { code: "PIVC", label: "Invoice Verification – original", route: "/mm/iv", description: "IV MIRO" },
      ]}
    />
  );
}
