"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="OBYC"
      sapAlias="OBYC"
      title="Automatic Account Determination – Full BSX/WRX/GBB/PRD/BSV/KDM/KOFI/KOFK"
      description="Define Automatic Account Determination – OBYC + VKOA – T0 BLOCKING – BSX inventory posting (GR 101 stock +), WRX GR/IR clearing (GR 101 credit GR/IR, IV debit), GBB offsetting (261 GI prod order CO11N, 601 PGI sales VL02N COGS), PRD price diff (PO vs MAP/Standard), BSV PI diff 701/702, KDM exchange diff, KOFI/KOFK revenue (VF01 billing – chart + sales org + customer group + material group → GL) – strict usage: every goods movement posts FI via OBYC – NO DANGLING – used in GR, GI, PGI, PI, Billing"
      apiEndpoint="/api/auto-account-determination"
      initialForm={{ transaction_key: 'BSX', chart_of_accounts: 'KSCA', valuation_class: 'RAW', gl_account: '', company_code: '', description: '' }}
      fields={[
        { key: "transaction_key", label: "TRANSACTION_KEY", required: true, type: "select", options: ['BSX', 'WRX', 'GBB', 'PRD', 'BSV', 'KDM', 'KOFI', 'KOFK'], placeholder: "BSX", description: "T0 BLOCKING – BSX inventory posting GR 101 stock +, WRX GR/IR clearing, GBB offset 261 GI prod order + 601 PGI sales COGS, PRD price diff, BSV PI diff 701/702, KDM exchange diff, KOFI/KOFK revenue VKOA billing – determines GL – used in universal ledger" },
        { key: "chart_of_accounts", label: "CHART_OF_ACCOUNTS", required: true, placeholder: "KSCA", description: "Chart of accounts – e.g., KSCA – used with valuation_class to find GL – fallback if valuation_class blank" },
        { key: "valuation_class", label: "VALUATION_CLASS", required: true, placeholder: "RAW", description: "T0 BLOCKING – Valuation class – RAW/FINISHED/SEMI/TRADING – links to material EMTC valuation_class – BSX RAW→5000000001, FINISHED→5000000002 – used in GR 101 OBYC lookup – if missing, GR cannot post" },
        { key: "gl_account", label: "GL_ACCOUNT", required: true, type: "autocomplete", apiUrl: "/api/gl-accounts", dataKey: "glAccounts", codeField: "account_number", placeholder: "5000000001", createUrl: "/fico/gl-accounts", createCode: "FGLC", description: "GL account FK – must exist via FGLC – strict usage auto GL – BSX inventory, WRX GR/IR, GBB COGS, KOFI revenue" },
        { key: "company_code", label: "COMPANY_CODE", placeholder: "LE-1000", description: "Company code optional – for company-specific override – if blank, fallback to chart+valuation_class" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "Inventory posting raw materials – GR 101 stock + BSX – T0", description: "Description – explains usage chain – e.g., BSX RAW → inventory posting GR 101" },
      ]}
      relatedLinks={[
        { code: "FGLC", label: "GL Account – required – BSX/WRX/GBB/KOFI", route: "/fico/gl-accounts", description: "GL Account – BSX inventory, WRX GR/IR, GBB COGS, KOFI revenue" },
        { code: "FCOA", label: "Chart of Accounts – KSCA", route: "/fico/chart-of-accounts", description: "Chart KSCA" },
        { code: "EMTC", label: "Product Master – valuation_class → BSX", route: "/foundation/materials", description: "Material – valuation_class used in OBYC lookup" },
        { code: "OMJJ", label: "Movement Types – 101/261/601 – uses transaction_key", route: "/fico/movement-types", description: "OMJJ – movement → transaction_key → GL" },
        { code: "IGRC", label: "Goods Receipt MIGO 101 – uses BSX/WRX", route: "/mm/gr", description: "GR 101 – BSX/WRX via OBYC" },
        { code: "SDLC", label: "Delivery VL01N – PGI 601 – uses GBB/BSX", route: "/sd/delivery", description: "Delivery PGI 601 – GBB COGS + BSX" },
        { code: "SBLC", label: "Billing VF01 – uses KOFI/KOFK revenue", route: "/sd/billing", description: "Billing – KOFI/KOFK revenue via VKOA" },
        { code: "IPIC", label: "Physical Inventory MI01 – uses BSV 701/702", route: "/mm/physical-inventory", description: "PI – BSV" },
        { code: "MMOC", label: "Production Order CO01 – GI 261 – uses GBB", route: "/pp/production-orders", description: "Prod Order – GI 261 GBB" },
      ]}
    />
  );
}
