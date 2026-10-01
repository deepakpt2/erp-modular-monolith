"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EMTP"
      sapAlias="OMS2"
      title="Product Types – Material/Product Type – RAW/FINISHED/SEMI"
      description="Define Product Types – material/product type – e.g., RAW raw materials ROH, FINISHED finished goods FERT, SEMI semi-finished HALB, TRADING trading goods HAWA, PACKAGING packaging VERP, CONSUMABLE consumables NLAG, SERVICE services DIEN – strict industry standard: determines valuation class for auto account determination BSX/WRX, number range assignment per material type, MRP, costing – e.g., RAW→MAT-RAW-01 10000-19999 valuation RAW→1400000001 BSX, FINISHED→MAT-FG-01 20000-29999 valuation FINISHED→1400000002 – T0 BLOCKING – NO DANGLING – own names – OMS2"
      apiEndpoint="/api/material-types"
      initialForm={{ 
        code: '', 
        name: '', 
        valuation_class: 'RAW',
        number_range_code: 'MAT-01',
        description: '' 
      }}
      fields={[
        { key: "code", label: "PRODUCT_TYPE_CODE", required: true, placeholder: "", description: "Product type code – e.g., RAW raw materials ROH, FINISHED finished goods FERT, SEMI semi-finished HALB, TRADING HAWA, PACKAGING VERP, CONSUMABLE NLAG, SERVICE DIEN – material/product type – industry standard – own name – EMTP – determines valuation class, number range assignment, MRP type, costing – e.g., RAW→MAT-RAW-01, FINISHED→MAT-FG-01 – T0" },
        { key: "name", label: "PRODUCT_TYPE_NAME", required: true, placeholder: "", description: "Product type name – e.g., Raw Materials – descriptive – used in material master" },
        { key: "valuation_class", label: "VALUATION_CLASS", placeholder: "", description: "Valuation class – e.g., RAW→1400000001 BSX inventory, FINISHED→1400000002 – valuation class – for auto account determination OBYC BSX/WRX – e.g., RAW→1400000001, FINISHED→1400000002 – industry standard – FAUC – T0 BLOCKING" },
        { key: "number_range_code", label: "NUMBER_RANGE_CODE", type: "autocomplete", apiUrl: "/api/number-ranges", dataKey: "numberRanges", codeField: "code", placeholder: "", createUrl: "/fico/number-ranges", createCode: "FNRC", description: "Number range code – e.g., MAT-01 ITEM range 10000001-19999999, MAT-RAW-01 10000-19999 for RAW, MAT-FG-01 20000-29999 for FINISHED – number range assignment per material type – explicit assignment table XYZ to material – industry standard – FNRC FBN1 – numeric only, locked if used, next_available, error_and_extend" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "", description: "Description – product type purpose – e.g., Raw materials for production – ROH – valuation RAW" },
      ]}
      relatedLinks={[
        { code: "EMTC", label: "Product Master – EMTC – uses Type – RAW/FINISHED – T0", route: "/foundation/materials", description: "Product – EMTC – type RAW/FINISHED/SEMI – determines valuation class BSX/WRX, number range MAT-01, MRP, costing – single source" },
        { code: "FAUC", label: "Auto Account Determination – OBYC – BSX/WRX – uses Valuation Class – RAW→1400000001", route: "/fico/auto-account-determination", description: "Auto Account – FAUC OBYC – BSX 1400000001 inventory, GBB VAX 5000000001 COGS, WRX GR/IR – valuation_class determines GL – T0" },
        { code: "FNRC", label: "Number Ranges – FBN1 – MAT-01 ITEM – assignment per material type – RAW→MAT-RAW-01", route: "/fico/number-ranges", description: "Number Ranges – FNRC FBN1 – numeric only, locked if used, next_available, assignment table per material type/company/doc type, error_and_extend" },
        { code: "FMTM", label: "Movement Types – OMJJ – 101/261/601 – uses valuation", route: "/fico/movement-types", description: "Movement Types – OMJJ – 101 GR PO BSX/WRX, 261 GI prod order GBB/BSX, 601 PGI sales GBB/BSX" },
        { code: "EMGC", label: "Product Categories – EMGC – groups products – CAT-SPICE", route: "/foundation/material-categories", description: "Product Categories – EMGC OMSF – classification hierarchy – e.g., food spice oil pack" },
        { code: "EUOC", label: "Base UoM – EUOC – KG/PC/BOX – CUNI", route: "/foundation/uom", description: "Base UoM – EUOC CUNI – KG/PC/BOX – base unit – used in material master" },
      ]}
    />
  );
}
