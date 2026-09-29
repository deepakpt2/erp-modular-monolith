"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="GRRE"
      sapAlias="MIGO 102"
      title="Goods Receipt Reversal"
      description="Reverse Goods Receipt – 102 movement – strict usage: reverses GR 101, posts opposite BSX/WRX, requires posting period open"
      apiEndpoint="/api/gr-reversal"
      initialForm={{ original_gr_code: '', reason: '', posting_date: '' }}
      fields={[
        { key: "original_gr_code", label: "ORIGINAL_GR_CODE", required: true, placeholder: "GR-5000000001", description: "Original GR to reverse" },
        { key: "reason", label: "REASON", required: true, placeholder: "Wrong quantity" },
        { key: "posting_date", label: "POSTING_DATE", required: true, placeholder: "2026-05-15", description: "Posting date – must be in open period" },
      ]}
      relatedLinks={[
        { code: "IGRC", label: "Goods Receipt – original", route: "/mm/gr", description: "GR 101" },
        { code: "FPPE", label: "Posting Period Control", route: "/fico/posting-periods", description: "Must be open" },
      ]}
    />
  );
}
