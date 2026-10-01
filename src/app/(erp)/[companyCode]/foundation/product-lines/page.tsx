"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EPLC"
      sapAlias="OVX5"
      title="Product Line"
      description="Define Product Line – division commercial product division line category hierarchy"
      apiEndpoint="/api/product-lines"
      initialForm={{ code: '', name: '', description: '' }}
      fields={[
        { key: "code", label: "PRODUCT_LINE_CODE", required: true, placeholder: "" },
        { key: "name", label: "PRODUCT_LINE_NAME", required: true, placeholder: "" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "ESCC", label: "Sales Channel – required", route: "/foundation/sales-channels", description: "Sales Channel" },
        { code: "EPUC", label: "Commercial Unit uses EPLC", route: "/foundation/commercial-units", description: "Commercial Unit" },
      ]}
    />
  );
}
