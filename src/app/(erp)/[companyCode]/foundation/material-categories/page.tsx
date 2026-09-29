"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EMGC"
      sapAlias="OMSF"
      title="Product Categories"
      description="Define Product Categories – classification hierarchy – e.g., food spice oil pack – strict usage: groups products for reporting and pricing"
      apiEndpoint="/api/material-categories"
      initialForm={{ code: '', name: '', description: '' }}
      fields={[
        { key: "code", label: "PRODUCT_CATEGORY_CODE", required: true, placeholder: "CAT-SPICE" },
        { key: "name", label: "PRODUCT_CATEGORY_NAME", required: true, placeholder: "Spices" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "EMTC", label: "Product uses Category", route: "/foundation/materials", description: "Product" },
      ]}
    />
  );
}
