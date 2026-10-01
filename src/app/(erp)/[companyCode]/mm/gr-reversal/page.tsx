"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="IGRC-REV"
      sapAlias="IGRC (legacy MIGO) 102"
      title="Inventory Receipt Reversals"
      description="Reverse Inventory Receipt – 102 movement – strict usage: reverses GR 101, posts opposite INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX), requires posting period open"
      apiEndpoint="/api/gr-reversal"
      initialForm={{ original_gr_code: '', reason: '', posting_date: '' }}
      fields={[
        { key: "original_gr_code", label: "ORIGINAL_GR_CODE", required: true, placeholder: "", description: "Original GR to reverse" },
        { key: "reason", label: "REASON", required: true, placeholder: "" },
        { key: "posting_date", label: "POSTING_DATE", required: true, placeholder: "", description: "Posting date – must be in open period" },
      ]}
      relatedLinks={[
        { code: "IGRC", label: "Inventory Receipt – original", route: "/mm/gr", description: "GR 101" },
        { code: "FPPE", label: "Posting Period Control", route: "/fico/posting-periods", description: "Must be open" },
      ]}
    />
  );
}
