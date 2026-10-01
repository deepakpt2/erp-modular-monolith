"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EMGC"
      sapAlias="OMSF"
      title="Product Categories – Material Category – Hierarchy"
      description="Define Product Categories – material/product category – classification hierarchy – e.g., CAT-SPICE Spices, CAT-OIL Oils, CAT-PACK Packaging, CAT-FG Finished Goods, CAT-RAW Raw Materials – strict industry standard: groups products for reporting, pricing, account determination, MRP – e.g., spices category used in revenue account determination VKOA KOFI/KOFK – category – own names – OMSF"
      apiEndpoint="/api/material-categories"
      initialForm={{ code: '', name: '', parent_code: '', description: '' }}
      fields={[
        { key: "code", label: "PRODUCT_CATEGORY_CODE", required: true, placeholder: "", description: "Product category code – e.g., CAT-SPICE Spices, CAT-OIL Oils, CAT-PACK Packaging, CAT-FG Finished Goods, CAT-RAW Raw – category – industry standard – own name – EMGC – groups products – used in reporting, pricing, account determination" },
        { key: "name", label: "PRODUCT_CATEGORY_NAME", required: true, placeholder: "", description: "Product category name – e.g., Spices – descriptive – used in material master" },
        { key: "parent_code", label: "PARENT_CATEGORY_CODE", type: "autocomplete", apiUrl: "/api/material-categories", dataKey: "materialCategories", codeField: "code", placeholder: "", createUrl: "/foundation/material-categories", createCode: "EMGC", description: "Parent category code – e.g., CAT-FOOD Food – hierarchy – parent_id – e.g., CAT-SPICE child of CAT-FOOD – classification hierarchy – industry standard – prod_category.parent_id" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "", description: "Description – category purpose – e.g., Spices for raw materials" },
      ]}
      relatedLinks={[
        { code: "EMTC", label: "Product Master – EMTC – uses Category – CAT-SPICE – T0", route: "/foundation/materials", description: "Product – EMTC – category_code CAT-SPICE – groups products – used in FRAD revenue account determination and pricing" },
        { code: "EMTP", label: "Product Types – EMTP – RAW/FINISHED/SEMI – OMS2", route: "/foundation/material-types", description: "Product Types – RAW/FINISHED/SEMI – determines valuation class" },
        { code: "EUOC", label: "Base UoM – EUOC – KG/PC/BOX – CUNI", route: "/foundation/uom", description: "Base UoM – EUOC EUOC (legacy CUNI) – KG/PC/BOX" },
        { code: "FAUC", label: "Auto Account – VKOA revenue – uses category – KOFI/KOFK", route: "/fico/auto-account-determination", description: "Auto Account – VKOA – revenue account determination – chart + sales org + customer group + material group → GL – KOFI/KOFK" },
      ]}
    />
  );
}
