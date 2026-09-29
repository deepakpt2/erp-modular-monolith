"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="OMJJ"
      sapAlias="OMJJ"
      title="Movement Types – Goods Movements Config"
      description="Define Movement Types – OMJJ – T0 BLOCKING – 101 GR, 102 reversal, 122 return, 261 GI prod order (CO11N), 601 PGI sales (VL02N), 602 reversal PGI (VL09), 701/702 PI diff – determines stock +/- value +/- account modifier BSX/WRX/GBB/PRD/BSV – strict usage: every goods movement must have movement type – NO DANGLING – used in GR, GI, PGI, PI, Scrap, Transfer"
      apiEndpoint="/api/movement-types"
      initialForm={{
        code: '',
        description: '',
        movement_indicator: '+',
        value_indicator: '+',
        transaction_key: 'BSX',
        reversal_code: '',
        allowed_for: 'GR',
      }}
      fields={[
        { key: "code", label: "MOVEMENT_TYPE_CODE", required: true, placeholder: "101", description: "Movement Type Code – e.g., 101 GR for PO, 102 reversal, 261 GI prod order, 601 PGI sales, 602 reversal PGI, 701/702 PI – SAP standard" },
        { key: "description", label: "DESCRIPTION", required: true, placeholder: "Goods Receipt for Purchase Order – GR 101 – stock + value +", description: "Description – explains stock/value impact and usage – e.g., 101 stock + value + BSX/WRX used in GR" },
        { key: "movement_indicator", label: "STOCK_INDICATOR", required: true, type: "select", options: ["+", "-"], placeholder: "+", description: "T0 BLOCKING – Stock Indicator – + increase stock, - decrease stock – determines inv_stock qty update – used in stock ledger" },
        { key: "value_indicator", label: "VALUE_INDICATOR", required: true, type: "select", options: ["+", "-", ""], placeholder: "+", description: "T0 BLOCKING – Value Indicator – + increase value, - decrease value, blank no value – determines MAP recalc – used in stock ledger value" },
        { key: "transaction_key", label: "ACCOUNT_MODIFIER", required: true, type: "select", options: ["BSX", "WRX", "GBB", "PRD", "BSV", "KDM", "KOFI", "KOFK"], placeholder: "BSX", description: "T0 BLOCKING – Transaction Key / Account Modifier – BSX inventory posting, WRX GR/IR, GBB offsetting (COGS), PRD price diff, BSV PI diff, KDM exchange diff, KOFI/KOFK revenue – determines GL via OBYC – used in universal ledger posting" },
        { key: "reversal_code", label: "REVERSAL_MOVEMENT", placeholder: "102", description: "Reversal Movement – e.g., 101 reversal is 102, 261 reversal 262, 601 reversal 602 – used in reversal logic – GR reversal, PGI reversal VL09" },
        { key: "allowed_for", label: "ALLOWED_FOR", required: true, type: "select", options: ["GR", "GI", "TRANSFER", "PI", "ALL"], placeholder: "GR", description: "Allowed for – GR goods receipt, GI goods issue, TRANSFER, PI physical inventory, ALL – controls where movement can be used – used in validation" },
      ]}
      relatedLinks={[
        { code: "EMTC", label: "Product Master – valuation_class used in BSX", route: "/foundation/materials", description: "Material – valuation_class → BSX GL" },
        { code: "FAUC", label: "Auto Account OBYC – BSX/WRX/GBB/PRD/BSV – uses transaction_key", route: "/fico/auto-account-determination", description: "OBYC – transaction_key determines GL" },
        { code: "IGRC", label: "Goods Receipt MIGO – uses 101/102/122", route: "/mm/gr", description: "GR – uses 101/102" },
        { code: "SDLC", label: "Delivery VL01N – PGI uses 601", route: "/sd/delivery", description: "Delivery – PGI 601" },
        { code: "IPIC", label: "Physical Inventory MI01 – uses 701/702", route: "/mm/physical-inventory", description: "PI – 701/702" },
        { code: "MMOC", label: "Production Order CO01 – GI uses 261", route: "/pp/production-orders", description: "Prod Order – GI 261" },
        { code: "ISTV", label: "Stock Overview – shows stock +/-", route: "/foundation/stock", description: "Stock – movement impact" },
      ]}
    />
  );
}
