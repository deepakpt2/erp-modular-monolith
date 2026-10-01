"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FPPC"
      sapAlias="OBBO"
      title="Posting Period Variant"
      description="Define Posting Period Variant – groups company codes for posting period control – e.g., 1000 Standard – strict usage: OB52 open/close per variant + account type"
      apiEndpoint="/api/posting-period-variants"
      initialForm={{ code: '', name: '', description: '' }}
      fields={[
        { key: "code", label: "POSTING_PERIOD_VARIANT_CODE", required: true, placeholder: "", description: "Variant code – e.g., 1000 Standard" },
        { key: "name", label: "POSTING_PERIOD_VARIANT_NAME", required: true, placeholder: "" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "ELEC", label: "Legal Entity uses Variant", route: "/foundation/legal-entities", description: "Legal Entity requires variant" },
        { code: "FPPE", label: "Posting Period Control uses Variant", route: "/fico/posting-periods", description: "Posting Period Control" },
      ]}
    />
  );
}
