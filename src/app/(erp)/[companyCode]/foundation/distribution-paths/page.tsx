"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EDPC"
      sapAlias="EDPC"
      title="Distribution Path"
      description="Define Distribution Path – sales channel + product line combination – strict usage: determines pricing and delivery path"
      apiEndpoint="/api/distribution-paths"
      initialForm={{ code: '', name: '', sales_channel_code: '', product_line_code: '', description: '' }}
      fields={[
        { key: "code", label: "DISTRIBUTION_PATH_CODE", required: true, placeholder: "DP-100" },
        { key: "name", label: "DISTRIBUTION_PATH_NAME", required: true, placeholder: "Wholesale Spices" },
        { key: "sales_channel_code", label: "SALES_CHANNEL_CODE", required: true, type: "autocomplete", apiUrl: "/api/sales-channels", dataKey: "salesChannels", codeField: "code", placeholder: "SC-10", createUrl: "/foundation/sales-channels", createCode: "ESCC" },
        { key: "product_line_code", label: "PRODUCT_LINE_CODE", required: true, type: "autocomplete", apiUrl: "/api/product-lines", dataKey: "productLines", codeField: "code", placeholder: "PL-100", createUrl: "/foundation/product-lines", createCode: "EPLC" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "ESCC", label: "Sales Channel – required", route: "/foundation/sales-channels", description: "Sales Channel" },
        { code: "EPLC", label: "Product Line – required", route: "/foundation/product-lines", description: "Product Line" },
      ]}
    />
  );
}
