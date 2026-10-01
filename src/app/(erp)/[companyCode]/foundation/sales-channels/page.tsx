"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="ESCC"
      sapAlias="OVX1"
      title="Sales Channel"
      description="Define Sales Channel – distribution channel direct wholesale retail marketing pipelines"
      apiEndpoint="/api/sales-channels"
      initialForm={{ code: '', name: '', description: '' }}
      fields={[
        { key: "code", label: "SALES_CHANNEL_CODE", required: true, placeholder: "" },
        { key: "name", label: "SALES_CHANNEL_NAME", required: true, placeholder: "" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "ECOC", label: "Commercial Org – required", route: "/foundation/commercial-orgs", description: "Commercial Org" },
        { code: "EPLC", label: "Product Line uses ESCC", route: "/foundation/product-lines", description: "Product Line" },
      ]}
    />
  );
}
