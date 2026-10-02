"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="ECOC"
      sapAlias="OVX2"
      title="Commercial Organization – Sales Organization"
      description="Define Commercial Organization / Sales Organization – enterprise organizational unit responsible for distributing goods and services, negotiating sales conditions, and product liability. Pure definition transaction (OVX2); assignment to Company Code is maintained separately in OVX3."
      apiEndpoint="/api/commercial-orgs"
      initialForm={{ 
        code: '', 
        name: '', 
        currency_code: 'INR', 
        description: '' 
      }}
      fields={[
        { 
          key: "code", 
          label: "COMMERCIAL_ORG_CODE", 
          required: true, 
          placeholder: "", 
          description: "4-character Sales Organization code (e.g. 1000, SO01, CO-1000) – TVKO-VKORG" 
        },
        { 
          key: "name", 
          label: "COMMERCIAL_ORG_NAME", 
          required: true, 
          placeholder: "", 
          description: "Name of the Sales Organization (e.g. Domestic Sales, Export Org) – TVKO-VTEXT" 
        },
        { 
          key: "currency_code", 
          label: "SALES_ORG_CURRENCY", 
          required: true, 
          type: "autocomplete", 
          apiUrl: "/api/currencies", 
          dataKey: "currencies", 
          codeField: "code", 
          placeholder: "", 
          createUrl: "/fico/currencies", 
          createCode: "FCYC", 
          description: "Sales Organization currency (e.g. INR, USD, EUR, KWD) – TVKO-WAERS" 
        },
        { 
          key: "description", 
          label: "DESCRIPTION", 
          type: "textarea", 
          placeholder: "", 
          description: "Operational scope, market regions, and notes" 
        },
      ]}
      relatedLinks={[
        { code: "OVX3", label: "Assign Sales Org to Company Code (OVX3)", route: "/sd/assignments/sales-org-company-code", description: "Connect this Sales Organization to a Legal Entity / Company Code" },
        { code: "OVX8", label: "Assign Distribution Channel to Sales Org (OVX8)", route: "/sd/assignments/channel-sales", description: "Assign Sales Channels (Distribution Channels) to this Sales Org" },
        { code: "OVX6", label: "Assign Division to Sales Org (OVX6)", route: "/sd/assignments/division-sales", description: "Assign Product Lines (Divisions) to this Sales Org" },
        { code: "ESCC", label: "Sales Channel / Distribution Channel (OVX1)", route: "/foundation/sales-channels", description: "Define Sales Channels" },
        { code: "EPLC", label: "Product Line / Division (OVX5)", route: "/foundation/product-lines", description: "Define Product Lines / Divisions" },
      ]}
    />
  );
}
