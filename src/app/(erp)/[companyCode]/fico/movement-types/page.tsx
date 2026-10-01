"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FMTM"
      sapAlias="OMJJ"
      title="Movement Types – Goods Movements Config"
      description="Define Movement Types – FMTM own IP (alias FMTM (legacy OMJJ)) – T0 BLOCKING – 101 GR, 102 reversal, 122 return, 261 GI prod order (MMOC (legacy CO11N)), 601 PGI sales (SDLC (legacy VL02N)), 602 reversal PGI (VL09), 701/702 PI diff – determines stock +/- value +/- account modifier INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX)/GBB/PRD/BSV – strict usage: every goods movement must have movement type – NO DANGLING – used in GR, GI, PGI, PI, Scrap, Transfer"
      apiEndpoint="/api/movement-types"
      initialForm={{
        code: '',
        description: '',
        movement_indicator: '+',
        value_indicator: '+',
        transaction_key: 'INV_POSTING',
        reversal_code: '',
        allowed_for: 'GR',
      }}
      fields={[
        { key: "code", label: "MOVEMENT_TYPE_CODE", required: true, placeholder: "", description: "Movement Type Code – e.g., GR_PO GR for PO (legacy 101), GR_PO_REV reversal (legacy 102), GI_PROD GI prod order (legacy 261), GI_SALES PGI sales (legacy 601), GI_SALES_REV reversal PGI (legacy 602), PI_PLUS/PI_MINUS PI (legacy 701/702) – own IP with SAP aliases" },
        { key: "description", label: "DESCRIPTION", required: true, placeholder: "", description: "Description – explains stock/value impact and usage – e.g., 101 stock + value + INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX) used in GR" },
        { key: "movement_indicator", label: "STOCK_INDICATOR", required: true, type: "select", options: ["+", "-"], placeholder: "", description: "T0 BLOCKING – Stock Indicator – + increase stock, - decrease stock – determines inv_stock qty update – used in stock ledger" },
        { key: "value_indicator", label: "VALUE_INDICATOR", required: true, type: "select", options: ["+", "-", ""], placeholder: "", description: "T0 BLOCKING – Value Indicator – + increase value, - decrease value, blank no value – determines MAP recalc – used in stock ledger value" },
        { key: "transaction_key", label: "ACCOUNT_MODIFIER", required: true, type: "select", options: ["INV_POSTING", "GR_IR_CLEARING", "INV_OFFSET", "PRICE_DIFF", "INV_DIFF", "EXCH_DIFF", "REVENUE", "REVENUE"], placeholder: "", description: "T0 BLOCKING – Transaction Key / Account Modifier – INV_POSTING inventory posting (legacy BSX), GR_IR_CLEARING GR/IR (legacy WRX), INV_OFFSET offsetting COGS (legacy GBB), PRICE_DIFF price diff (legacy PRD), INV_DIFF PI diff (legacy BSV), EXCH_DIFF exchange diff (legacy KDM), REVENUE revenue (legacy KOFI/KOFK) – determines GL via FAUC (legacy FAUC (legacy OBYC)) – own IP with SAP aliases – used in universal ledger posting" },
        { key: "reversal_code", label: "REVERSAL_MOVEMENT", placeholder: "", description: "Reversal Movement – e.g., GR_PO reversal is GR_PO_REV (legacy 101→102), GI_PROD reversal GI_PROD_REV (legacy 261→262), GI_SALES reversal GI_SALES_REV (legacy 601→602) – own IP with SAP aliases – used in reversal logic" },
        { key: "allowed_for", label: "ALLOWED_FOR", required: true, type: "select", options: ["GR", "GI", "TRANSFER", "PI", "ALL"], placeholder: "", description: "Allowed for – GR goods receipt, GI goods issue, TRANSFER, PI physical inventory, ALL – controls where movement can be used – used in validation" },
      ]}
      relatedLinks={[
        { code: "EMTC", label: "Product Master – valuation_class used in INV_POSTING (legacy BSX)", route: "/foundation/materials", description: "Material – valuation_class → BSX GL" },
        { code: "FAUC", label: "Auto Account FAUC (legacy OBYC) – INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX)/GBB/PRD/BSV – uses transaction_key", route: "/fico/auto-account-determination", description: "FAUC (legacy OBYC) – transaction_key determines GL" },
        { code: "IGRC", label: "Goods Receipt IGRC (legacy IGRC (legacy MIGO)) – uses GR_PO/GR_PO_REV/GR_RETURN (legacy 101/102/122) – own IP", route: "/mm/gr", description: "GR – uses 101/102" },
        { code: "SDLC", label: "Delivery SDLC (legacy SDLC (legacy VL01N)) – PGI uses GI_SALES (legacy 601) – own IP", route: "/sd/delivery", description: "Delivery – PGI 601" },
        { code: "IPIC", label: "Physical Inventory IPIC (legacy MI01) – uses PI_PLUS/PI_MINUS (legacy 701/702) – own IP", route: "/mm/physical-inventory", description: "PI – 701/702" },
        { code: "MMOC", label: "Production Order MMOC (legacy MMOC (legacy CO01)) – GI uses GI_PROD (legacy 261) – own IP", route: "/pp/production-orders", description: "Prod Order – GI 261" },
        { code: "ISTV", label: "Stock Overview – shows stock +/-", route: "/foundation/stock", description: "Stock – movement impact" },
      ]}
    />
  );
}
