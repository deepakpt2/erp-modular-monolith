"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="EMTC"
      sapAlias="MM01"
      title="Product Master – Full Accounting & MRP Views"
      description="Create Product – product master SKU – Phase 0 T0 BLOCKING – valuation_class determines BSX GL via OBYC (GR 101), price_control determines PRD price diff, MAP/Standard Price used in stock ledger and costing CK40N – strict usage: used in PR PO GR IV SO DL BL BOM Routing Costing – NO DANGLING"
      apiEndpoint="/api/materials"
      initialForm={{
        item_number: '',
        name: '',
        base_unit: 'PC',
        material_type: 'FINISHED',
        category_code: '',
        description: '',
        // Phase 0 – Accounting View – T0 BLOCKING
        inventory_valuation_class: 'FINISHED',
        valuation_class: 'FINISHED',
        pricing_method: 'MOVING_AVG',
        price_control: 'MOVING_AVG',
        moving_avg_price: '0',
        standard_price: '0',
        // MRP View
        safety_stock: '0',
        reorder_point: '0',
        planning_type: 'MRP',
        lot_sizing: 'LOT_FOR_LOT',
        procurement_method: 'BUY',
        // Additional
        hsn_code: '',
        shelf_life_days: '30',
        is_lot_managed: 'true',
        barcode: '',
      }}
      fields={[
        { key: "item_number", label: "PRODUCT_CODE", required: true, placeholder: "MAT-1000", description: "Product code – item_number – e.g., MAT-1000 – unique – used in all transactions PR/PO/GR/SO/DL/BL" },
        { key: "name", label: "PRODUCT_NAME", required: true, placeholder: "Premium Spice Mix", description: "Product name – used in SO/PO display" },
        { key: "base_unit", label: "BASE_UNIT", required: true, type: "autocomplete", apiUrl: "/api/uom", dataKey: "uom", codeField: "code", placeholder: "PC", createUrl: "/foundation/uom", createCode: "EUOC", description: "Base unit FK – must exist via EUOC – KG/PC/BOX – used in all qty postings" },
        { key: "material_type", label: "PRODUCT_TYPE", required: true, type: "autocomplete", apiUrl: "/api/material-types", dataKey: "materialTypes", codeField: "code", placeholder: "FINISHED", createUrl: "/foundation/material-types", createCode: "EMTP", description: "Product type FK – RAW/FINISHED/SEMI – determines default valuation_class for auto account" },
        { key: "category_code", label: "PRODUCT_CATEGORY_CODE", type: "autocomplete", apiUrl: "/api/material-categories", dataKey: "materialCategories", codeField: "code", placeholder: "CAT-SPICE", createUrl: "/foundation/material-categories", createCode: "EMGC", description: "Product category FK" },
        // === T0 BLOCKING – Accounting View – NO DANGLING – Used in GR/IV/Billing ===
        { key: "inventory_valuation_class", label: "VALUATION_CLASS", required: true, type: "select", options: ["RAW", "FINISHED", "SEMI", "TRADING", "PACKAGING", "CONSUMABLE", "SERVICE"], placeholder: "FINISHED", description: "T0 BLOCKING – Determines BSX GL via OBYC – used in GR 101 posting – e.g., RAW→BSX KSCA RAW→5000000001, FINISHED→5000000002 – if missing, GR cannot post BSX" },
        { key: "valuation_class", label: "VALUATION_CLASS_LEGACY", type: "select", options: ["RAW", "FINISHED", "SEMI", "TRADING", "PACKAGING"], placeholder: "FINISHED", description: "Legacy alias for inventory_valuation_class – same value – ensures both new and old API accept" },
        { key: "pricing_method", label: "PRICE_CONTROL", required: true, type: "select", options: ["STANDARD", "MOVING_AVG"], placeholder: "MOVING_AVG", description: "T0 BLOCKING – S=Standard, V=Moving Avg – determines PRD price diff posting in IV – if S, standard_price used, diff → PRD; if V, MAP recalculated on GR – used in stock ledger MAP calc" },
        { key: "price_control", label: "PRICE_CONTROL_LEGACY", type: "select", options: ["STANDARD", "MOVING_AVG"], placeholder: "MOVING_AVG", description: "Legacy alias – same as pricing_method – S/V" },
        { key: "moving_avg_price", label: "MOVING_AVG_PRICE", required: true, placeholder: "0", description: "T0 BLOCKING – MAP – used in GR 101 stock ledger: new MAP = (old qty*old MAP + GR qty*PO price)/new qty – used in inventory valuation" },
        { key: "standard_price", label: "STANDARD_PRICE", required: true, placeholder: "0", description: "T0 BLOCKING – Standard Price – used when price_control=STANDARD, used in CK40N costing rollup, used in PRD price diff = (PO price - standard_price)*qty" },
        { key: "safety_stock", label: "SAFETY_STOCK", placeholder: "0", description: "MRP View – safety stock qty – used in MD04 net requirements calc: gross requirements - safety stock - stock = net requirements" },
        { key: "reorder_point", label: "REORDER_POINT", placeholder: "0", description: "MRP View – reorder point – used in reorder point planning: if stock < reorder point → create PR" },
        { key: "planning_type", label: "MRP_TYPE", type: "select", options: ["MRP", "MANUAL_REORDER", "NO_PLANNING", "REORDER_POINT", "FORECAST"], placeholder: "MRP", description: "MRP View – PD=MRP, VB=Manual Reorder, ND=No Planning – determines if MRP MD01 includes material" },
        { key: "lot_sizing", label: "LOT_SIZE", type: "select", options: ["LOT_FOR_LOT", "FIXED", "MAX_LEVEL", "REPLENISH"], placeholder: "LOT_FOR_LOT", description: "MRP View – EX=Lot-for-lot, FX=Fixed – determines procurement qty in MD01" },
        { key: "procurement_method", label: "PROCUREMENT_TYPE", type: "select", options: ["BUY", "MAKE", "BOTH", "TRANSFER"], placeholder: "BUY", description: "F=Buy, E=Make, X=Both – determines if MRP creates PR (Buy) or Planned Order (Make) – used in MD01" },
        { key: "hsn_code", label: "HSN_CODE", placeholder: "0908", description: "India GST HSN – used in tax determination FTXC – determines GST rate in billing" },
        { key: "shelf_life_days", label: "SHELF_LIFE_DAYS", placeholder: "30", description: "Expiry control – used in lot management ELTC – blocks GI if expired when lot_control=BLOCKED" },
        { key: "barcode", label: "BARCODE", placeholder: "890...", description: "EAN/barcode – used in POS webhook, goods receipt scanning" },
        { key: "description", label: "DESCRIPTION", type: "textarea", description: "Long description – used in SO/PO print" },
      ]}
      relatedLinks={[
        { code: "EMTP", label: "Product Types – required – determines valuation", route: "/foundation/material-types", description: "Product Type" },
        { code: "EUOC", label: "UOM – required – all qty", route: "/foundation/uom", description: "Units of Measure" },
        { code: "EMGC", label: "Product Categories", route: "/foundation/material-categories", description: "Categories" },
        { code: "OMJJ", label: "Movement Types – required for GR/GI", route: "/fico/movement-types", description: "OMJJ 101/261/601" },
        { code: "FAUC", label: "Auto Account OBYC – BSX/WRX/GBB/PRD – uses valuation_class", route: "/fico/auto-account-determination", description: "OBYC – BSX uses valuation_class" },
        { code: "PSUC", label: "Supplier – for PO price", route: "/foundation/suppliers", description: "Supplier" },
        { code: "MBMC", label: "BOM uses Product – costing", route: "/pp/bom", description: "BOM – uses standard_price for costing" },
        { code: "MRTC", label: "Routing uses Product – costing", route: "/pp/routings", description: "Routing – uses MAP for costing" },
        { code: "ISTV", label: "Stock Overview – shows MAP", route: "/foundation/stock", description: "Stock – shows MAP recalc" },
        { code: "CCRP", label: "Costing Run CK40N – uses standard_price", route: "/fico/costing-run", description: "CK40N – uses BOM+Routing+standard_price" },
      ]}
    />
  );
}
