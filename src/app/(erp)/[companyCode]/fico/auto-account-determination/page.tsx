"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FAUC"
      sapAlias="OBYC"
      title="Automatic Account Determination – Account Determination – INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX)/GBB/PRD/BSV/FRE/ZOL/KDM/KOFI/KOFK"
      description="Define Automatic Account Determination – FAUC own IP (alias FAUC (legacy OBYC)) – account determination – INV_POSTING inventory posting GR_PO (legacy 101 BSX) stock +, GR_IR_CLEARING GR/IR clearing (legacy WRX), INV_OFFSET offsetting GI_PROD (legacy 261 GBB) prod order + GI_SALES (legacy 601) PGI sales COGS, PRICE_DIFF price diff (legacy PRD) PO vs MAP/Standard, INV_DIFF PI diff (legacy BSV) PI_PLUS 701/PI_MINUS 702, FREIGHT freight (legacy FRE), CUSTOMS customs (legacy ZOL), EXCH_DIFF exchange diff (legacy KDM), REVENUE revenue (legacy KOFI/KOFK) VKOA billing – T0 BLOCKING – NO DANGLING – own IP with SAP aliases – valuation grouping 0001, account grouping VAX/VAY/VBR/VBO/VKA – every goods movement posts FI via FAUC – used in GR, GI, PGI, PI, Billing"
      apiEndpoint="/api/auto-account-determination"
      initialForm={{ 
        transaction_key: 'INV_POSTING', 
        chart_of_accounts_code: 'CA-IN-01',
        chart_of_accounts: 'CA-IN-01', 
        valuation_class: 'RAW', 
        valuation_grouping_code: '0001',
        account_grouping_code: 'VAX',
        gl_account_number: '',
        gl_account: '', 
        company_code: '', 
        legal_entity_code: '1000',
        description: '' 
      }}
      fields={[
        { key: "transaction_key", label: "TRANSACTION_KEY", required: true, type: "select", options: ['INV_POSTING', 'GR_IR_CLEARING', 'INV_OFFSET', 'PRICE_DIFF', 'INV_DIFF', 'FREIGHT', 'CUSTOMS', 'EXCH_DIFF', 'REVENUE', 'REVENUE', 'INV_DIFF', 'FR1', 'FR2', 'FR3', 'G00', 'PRICE_DIFF'], placeholder: "", description: "Transaction key – INV_POSTING inventory posting GR_PO (legacy 101 BSX) stock + INV_POSTING, GR_IR_CLEARING GR/IR clearing (legacy WRX) GR_PO credit GR/IR IV debit, INV_OFFSET offset (legacy GBB) GI_PROD (legacy 261) prod order + GI_SALES (legacy 601) PGI sales COGS, PRICE_DIFF price diff (legacy PRD) PO vs MAP/Standard, INV_DIFF PI diff (legacy BSV) PI_PLUS 701/PI_MINUS 702, FREIGHT freight (legacy FRE), CUSTOMS customs (legacy ZOL), EXCH_DIFF exchange diff (legacy KDM), REVENUE revenue (legacy KOFI/KOFK) VKOA billing – determines GL – used in universal ledger – own IP with SAP aliases – T0 BLOCKING" },
        { key: "chart_of_accounts_code", label: "CHART_OF_ACCOUNTS_CODE", required: true, type: "autocomplete", apiUrl: "/api/chart-of-accounts", dataKey: "chartOfAccounts", codeField: "code", placeholder: "", createUrl: "/fico/chart-of-accounts", createCode: "FCOA", description: "Chart of accounts – e.g., CA-IN-01 – used with valuation_class to find GL – fallback if valuation_class blank – industry standard – FCOA OB13" },
        { key: "chart_of_accounts", label: "CHART_OF_ACCOUNTS_LEGACY", type: "autocomplete", apiUrl: "/api/chart-of-accounts", dataKey: "chartOfAccounts", codeField: "code", placeholder: "", createUrl: "/fico/chart-of-accounts", createCode: "FCOA", description: "Legacy alias for chart_of_accounts_code – chart of accounts" },
        { key: "valuation_class", label: "VALUATION_CLASS", required: true, placeholder: "", description: "Valuation class – RAW/FINISHED/SEMI/TRADING – links to material EMTC valuation_class – INV_POSTING (legacy BSX) RAW→1400000001, FINISHED→1400000002 – used in GR_PO (legacy 101) FAUC (legacy FAUC (legacy OBYC)) lookup – if missing, GR cannot post – T0 BLOCKING – own IP" },
        { key: "valuation_grouping_code", label: "VALUATION_GROUPING_CODE", placeholder: "", description: "Valuation grouping – e.g., 0001 – groups valuation areas – for large org multi-plant – valuation grouping 0001 – industry standard – OMWD – allows different GL per plant group" },
        { key: "account_grouping_code", label: "ACCOUNT_GROUPING_CODE", placeholder: "", description: "Account grouping – e.g., VAX goods issue, VAY scrap, VBR internal, VBO consumption, VKA sales – for GBB – account grouping VAX/VAY/VBR/VBO/VKA – industry standard – FMTM (legacy OMJJ) – determines GL per movement account modifier" },
        { key: "gl_account_number", label: "GL_ACCOUNT_NUMBER", required: true, type: "autocomplete", apiUrl: "/api/gl-accounts", dataKey: "glAccounts", codeField: "account_number", placeholder: "", createUrl: "/fico/gl-accounts", createCode: "FGLC", description: "GL account number – e.g., 1400000001 inventory BSX, 2000000001 GR/IR WRX, 5000000001 COGS GBB VAX – must exist via FGLC – strict usage auto GL – BSX inventory, WRX GR/IR, GBB COGS, KOFI revenue – industry standard – T0" },
        { key: "gl_account", label: "GL_ACCOUNT_LEGACY", type: "autocomplete", apiUrl: "/api/gl-accounts", dataKey: "glAccounts", codeField: "account_number", placeholder: "", createUrl: "/fico/gl-accounts", createCode: "FGLC", description: "Legacy alias for gl_account_number – GL account FK" },
        { key: "legal_entity_code", label: "LEGAL_ENTITY_CODE", type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "", createUrl: "/foundation/legal-entities", createCode: "ELEC", description: "Legal entity – company code – e.g., 1000 – company-specific override – if blank, fallback to chart+valuation_class – industry standard – F_BKPF_BUK" },
        { key: "company_code", label: "COMPANY_CODE_LEGACY", placeholder: "", description: "Legacy alias for legal_entity_code – company code" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "", description: "Description – explains usage chain – e.g., INV_POSTING (legacy BSX) RAW 0001 VAX → 1400000001 inventory posting GR_PO (legacy 101) – valuation grouping + account grouping + split valuation – own IP" },
      ]}
      relatedLinks={[
        { code: "FGLC", label: "GL Account – required – INV_POSTING (legacy BSX) 1400000001, INV_OFFSET (legacy GBB) VAX 5000000001, GRIR_CLEAR (legacy WRX) – T0 – own IP", route: "/fico/gl-accounts", description: "GL Account – INV_POSTING (legacy BSX) inventory 1400000001, GRIR_CLEAR (legacy WRX) GR/IR 2000000001, INV_OFFSET (legacy GBB) COGS VAX 5000000001, PRICE_DIFF (legacy PRD) price diff, REVENUE (legacy KOFI) revenue – own IP" },
        { code: "FCOA", label: "Chart of Accounts – CA-IN-01 – OPERATIONAL – AG01", route: "/fico/chart-of-accounts", description: "Chart – OPERATIONAL – AG01 Balance Sheet G001 1000000000-1999999999 retained 3200000000 FSSV" },
        { code: "EMTC", label: "Product Master – valuation_class → BSX – RAW/FINISHED", route: "/foundation/materials", description: "Material – valuation_class used in FAUC (legacy OBYC) lookup – RAW→1400000001" },
        { code: "FMTM", label: "Movement Types – GR_PO/GI_PROD/GI_SALES (legacy 101/261/601) – VAX 0001 – uses transaction_key – own IP", route: "/fico/movement-types", description: "FMTM (legacy OMJJ) – movement 101 INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX), 261 INV_OFFSET/INV_POSTING (legacy GBB/BSX), 601 INV_OFFSET/INV_POSTING (legacy GBB/BSX) – VAX – 0001 – batch required – SCRAP01" },
        { code: "IGRC", label: "Goods Receipt IGRC GR_PO (legacy IGRC (legacy MIGO) 101) – uses INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX) – T0", route: "/mm/gr", description: "GR_PO (legacy 101) – INV_POSTING (legacy BSX) 1400000001 debit inventory, GRIR_CLEAR (legacy WRX) 2000000001 credit GR/IR, PRICE_DIFF (legacy PRD) price diff – MAP recalc – stock ledger – own IP" },
        { code: "SDLC", label: "Delivery SDLC (legacy SDLC (legacy VL01N)) – PGI GI_SALES (legacy 601) – uses INV_OFFSET (legacy GBB) VAX 5000000001 COGS + INV_POSTING (legacy BSX) – own IP", route: "/sd/delivery", description: "Delivery PGI 601 – GBB COGS VAX + BSX – sales" },
        { code: "SBLC", label: "Billing SBLC (legacy SBLC (legacy VF01)) – uses REVENUE (legacy KOFI/KOFK) revenue – VKOA – own IP", route: "/sd/billing", description: "Billing – KOFI/KOFK revenue via VKOA – account grouping" },
        { code: "IPIC", label: "Physical Inventory IPIC (legacy MI01) – uses INV_DIFF (legacy BSV) PI_PLUS 701/PI_MINUS 702 – own IP", route: "/mm/physical-inventory", description: "PI – BSV 701/702 – inventory difference" },
        { code: "MMOC", label: "Production Order MMOC (legacy MMOC (legacy CO01)) – GI GI_PROD (legacy 261) – uses INV_OFFSET (legacy GBB) – own IP", route: "/pp/production-orders", description: "Prod Order – GI 261 GBB – production order" },
        { code: "FUNL", label: "Universal Ledger – ACDOCA – 400+ fields – INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX)", route: "/fico/universal-ledger", description: "Universal Ledger – posts INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX) – foreign currency, qty/UOM, batch, business area" },
      ]}
    />
  );
}
