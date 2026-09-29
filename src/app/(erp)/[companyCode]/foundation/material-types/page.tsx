"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EMTP"
      sapAlias="OMS2"
      title="Product Types"
      description="Define Product Types – RAW/FINISHED/SEMI/TRADING/PACKAGING/CONSUMABLE/SERVICE – e.g., ROH raw, FERT finished, HALB semi – strict usage: determines valuation class for auto account BSX/WRX"
      apiEndpoint="/api/material-types"
      initialForm={{ code: '', name: '', description: '' }}
      fields={[
        { key: "code", label: "PRODUCT_TYPE_CODE", required: true, placeholder: "RAW", description: "Product type code – RAW/FINISHED/SEMI/TRADING/PACKAGING/CONSUMABLE/SERVICE – determines valuation class" },
        { key: "name", label: "PRODUCT_TYPE_NAME", required: true, placeholder: "Raw Materials" },
        { key: "description", label: "DESCRIPTION", type: "textarea" },
      ]}
      relatedLinks={[
        { code: "EMTC", label: "Product uses Type", route: "/foundation/materials", description: "Product requires type" },
        { code: "OBYC", label: "Auto Account uses Valuation Class", route: "/fico/auto-account-determination", description: "Auto account BSX/WRX per valuation class" },
      ]}
    />
  );
}
