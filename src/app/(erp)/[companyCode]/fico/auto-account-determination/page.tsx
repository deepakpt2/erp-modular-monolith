"use client";
import { SingleCodePage } from '@/shared/ui/single-code-page';

export default function Page() {
  return (
    <SingleCodePage
      code="FAUC"
      sapAlias="OBYC"
      title="Automatic Account Determination – Account Determination – BSX/WRX/GBB/PRD/BSV/FRE/ZOL/KDM/KOFI/KOFK"
      description="Define Automatic Account Determination – account determination – BSX inventory posting GR 101 stock +, WRX GR/IR clearing, GBB offsetting 261 GI prod order CO11N + 601 PGI sales VL02N COGS, PRD price diff PO vs MAP/Standard, BSV PI diff 701/702, FRE freight, ZOL customs, KDM exchange diff, KOFI/KOFK revenue VKOA billing – T0 BLOCKING – NO DANGLING – valuation grouping 0001, account grouping VAX/VAY/VBR/VBO/VKA, split valuation – strict industry standard: every goods movement posts FI via OBYC – used in GR, GI, PGI, PI, Billing – own names"
      apiEndpoint="/api/auto-account-determination"
      initialForm={{ 
        transaction_key: 'BSX', 
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
        { key: "transaction_key", label: "TRANSACTION_KEY", required: true, type: "select", options: ['BSX', 'WRX', 'GBB', 'PRD', 'BSV', 'FRE', 'ZOL', 'KDM', 'KOFI', 'KOFK', 'BSV', 'FR1', 'FR2', 'FR3', 'G00', 'PRD'], placeholder: "BSX", description: "Transaction key – BSX inventory posting GR 101 stock + BSX, WRX GR/IR clearing GR 101 credit GR/IR IV debit, GBB offset 261 GI prod order + 601 PGI sales COGS, PRD price diff PO vs MAP/Standard, BSV PI diff 701/702, FRE freight, ZOL customs, KDM exchange diff, KOFI/KOFK revenue VKOA billing – determines GL – used in universal ledger – industry standard – T0 BLOCKING" },
        { key: "chart_of_accounts_code", label: "CHART_OF_ACCOUNTS_CODE", required: true, type: "autocomplete", apiUrl: "/api/chart-of-accounts", dataKey: "chartOfAccounts", codeField: "code", placeholder: "CA-IN-01", createUrl: "/fico/chart-of-accounts", createCode: "FCOA", description: "Chart of accounts – e.g., CA-IN-01 – used with valuation_class to find GL – fallback if valuation_class blank – industry standard – FCOA OB13" },
        { key: "chart_of_accounts", label: "CHART_OF_ACCOUNTS_LEGACY", type: "autocomplete", apiUrl: "/api/chart-of-accounts", dataKey: "chartOfAccounts", codeField: "code", placeholder: "CA-IN-01", createUrl: "/fico/chart-of-accounts", createCode: "FCOA", description: "Legacy alias for chart_of_accounts_code – chart of accounts" },
        { key: "valuation_class", label: "VALUATION_CLASS", required: true, placeholder: "RAW", description: "Valuation class – RAW/FINISHED/SEMI/TRADING – links to material EMTC valuation_class – BSX RAW→1400000001, FINISHED→1400000002 – used in GR 101 OBYC lookup – if missing, GR cannot post – T0 BLOCKING – industry standard" },
        { key: "valuation_grouping_code", label: "VALUATION_GROUPING_CODE", placeholder: "0001", description: "Valuation grouping – e.g., 0001 – groups valuation areas – for large org multi-plant – valuation grouping 0001 – industry standard – OMWD – allows different GL per plant group" },
        { key: "account_grouping_code", label: "ACCOUNT_GROUPING_CODE", placeholder: "VAX", description: "Account grouping – e.g., VAX goods issue, VAY scrap, VBR internal, VBO consumption, VKA sales – for GBB – account grouping VAX/VAY/VBR/VBO/VKA – industry standard – OMJJ – determines GL per movement account modifier" },
        { key: "gl_account_number", label: "GL_ACCOUNT_NUMBER", required: true, type: "autocomplete", apiUrl: "/api/gl-accounts", dataKey: "glAccounts", codeField: "account_number", placeholder: "1400000001", createUrl: "/fico/gl-accounts", createCode: "FGLC", description: "GL account number – e.g., 1400000001 inventory BSX, 2000000001 GR/IR WRX, 5000000001 COGS GBB VAX – must exist via FGLC – strict usage auto GL – BSX inventory, WRX GR/IR, GBB COGS, KOFI revenue – industry standard – T0" },
        { key: "gl_account", label: "GL_ACCOUNT_LEGACY", type: "autocomplete", apiUrl: "/api/gl-accounts", dataKey: "glAccounts", codeField: "account_number", placeholder: "1400000001", createUrl: "/fico/gl-accounts", createCode: "FGLC", description: "Legacy alias for gl_account_number – GL account FK" },
        { key: "legal_entity_code", label: "LEGAL_ENTITY_CODE", type: "autocomplete", apiUrl: "/api/legal-entities", dataKey: "legalEntities", codeField: "code", placeholder: "1000", createUrl: "/foundation/legal-entities", createCode: "ELEC", description: "Legal entity – company code – e.g., 1000 – company-specific override – if blank, fallback to chart+valuation_class – industry standard – F_BKPF_BUK" },
        { key: "company_code", label: "COMPANY_CODE_LEGACY", placeholder: "1000", description: "Legacy alias for legal_entity_code – company code" },
        { key: "description", label: "DESCRIPTION", type: "textarea", placeholder: "Inventory posting raw materials – GR 101 stock + BSX – T0 – 1400000001", description: "Description – explains usage chain – e.g., BSX RAW 0001 VAX → 1400000001 inventory posting GR 101 – valuation grouping + account grouping + split valuation – industry standard" },
      ]}
      relatedLinks={[
        { code: "FGLC", label: "GL Account – required – BSX 1400000001, GBB VAX 5000000001, WRX – T0", route: "/fico/gl-accounts", description: "GL Account – BSX inventory 1400000001, WRX GR/IR 2000000001, GBB COGS VAX 5000000001, PRD price diff, KOFI revenue" },
        { code: "FCOA", label: "Chart of Accounts – CA-IN-01 – OPERATIONAL – AG01", route: "/fico/chart-of-accounts", description: "Chart – OPERATIONAL – AG01 Balance Sheet G001 1000000000-1999999999 retained 3200000000 FSSV" },
        { code: "EMTC", label: "Product Master – valuation_class → BSX – RAW/FINISHED", route: "/foundation/materials", description: "Material – valuation_class used in OBYC lookup – RAW→1400000001" },
        { code: "FMTM", label: "Movement Types – 101/261/601 – VAX 0001 – uses transaction_key", route: "/fico/movement-types", description: "OMJJ – movement 101 BSX/WRX, 261 GBB/BSX, 601 GBB/BSX – VAX – 0001 – batch required – SCRAP01" },
        { code: "IGRC", label: "Goods Receipt MIGO 101 – uses BSX/WRX – T0", route: "/mm/gr", description: "GR 101 – BSX 1400000001 debit inventory, WRX 2000000001 credit GR/IR, PRD price diff – MAP recalc – stock ledger FSTL" },
        { code: "SDLC", label: "Delivery VL01N – PGI 601 – uses GBB VAX 5000000001 COGS + BSX", route: "/sd/delivery", description: "Delivery PGI 601 – GBB COGS VAX + BSX – sales" },
        { code: "SBLC", label: "Billing VF01 – uses KOFI/KOFK revenue – VKOA", route: "/sd/billing", description: "Billing – KOFI/KOFK revenue via VKOA – account grouping" },
        { code: "IPIC", label: "Physical Inventory MI01 – uses BSV 701/702", route: "/mm/physical-inventory", description: "PI – BSV 701/702 – inventory difference" },
        { code: "MMOC", label: "Production Order CO01 – GI 261 – uses GBB", route: "/pp/production-orders", description: "Prod Order – GI 261 GBB – production order" },
        { code: "FUNL", label: "Universal Ledger – ACDOCA – 400+ fields – BSX/WRX", route: "/fico/universal-ledger", description: "Universal Ledger – posts BSX/WRX – foreign currency, qty/UOM, batch, business area" },
      ]}
    />
  );
}
