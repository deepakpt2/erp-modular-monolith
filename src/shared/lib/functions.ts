/**
 * Function Classification - ERP structure
 * Maps functions to routes, with module classification
 * Function is the destination (e.g., Create Purchase Order), code is just helper to identify function (e.g., ME21N is helper for Create Purchase Order)
 * Searching ME21N redirects to background function Create Purchase Order – ME21N is not target, function is target
 * MM01 now routes with ?mode=create to auto-open create form
 */

export interface FunctionCode {
  code: string;           // New intuitive helper code – primary, e.g., FND-LE-CR, PUR-PO-CR – own IP, not SAP
  aliases?: string[];     // Old SAP-like codes kept as searchable aliases, e.g., OX02, MM01, ME21N – helper to identify function, not destination
  description: string;    // Function name is destination – e.g., Create Purchase Order, Create Material, Goods Receipt
  route: string;          // Function route – destination of search
  module: 'MM' | 'PP' | 'SD' | 'FICO' | 'HR' | 'FOUNDATION' | 'AUDIT';
  subModule: string;
  type: 'CREATE' | 'CHANGE' | 'DISPLAY' | 'REPORT' | 'POSTING';
  classicName: string;
  keywords?: string;      // descriptive search terms for function search – function is destination
}

export const FUNCTIONS: FunctionCode[] = [
  { code: 'EMTC', aliases: ['MM01', 'FND-MAT-CR', 'MTC'], description: 'Create Product – Legal-safe own IP (was Create Material MM01) – prod_item', route: '/1000/foundation/materials', module: 'FOUNDATION', subModule: 'MM-MD', type: 'CREATE', classicName: 'Material Master Create', keywords: 'create material master product sku record, add warehouse item definitions catalogue mm-md prod_item item_number base_unit RAW FINISHED SEMI EMTC' },
  { code: 'EMTE', aliases: ['MM02', 'FND-MAT-CH', 'MTE'], description: 'Change Product – Legal-safe (was Change Material MM02) – prod_item', route: '/1000/foundation/materials?mode=change', module: 'FOUNDATION', subModule: 'MM-MD', type: 'CHANGE', classicName: 'Material Master Change', keywords: 'change material master product data specifications, update inventory item definitions prod_item EMTE' },
  { code: 'EMTV', aliases: ['MM03', 'FND-MAT-DP', 'MTV'], description: 'Display Product – Legal-safe (was Display Material MM03)', route: '/1000/foundation/materials?mode=display', module: 'FOUNDATION', subModule: 'MM-MD', type: 'DISPLAY', classicName: 'Material Master Display', keywords: 'display material master catalog record, view standard item structural properties data prod_item EMTV' },
  { code: 'ISTV', aliases: ['MMBE', 'INV-STK-DP', 'STV'], description: 'Stock Overview', route: '/1000/foundation/stock', module: 'FOUNDATION', subModule: 'MM-IM', type: 'DISPLAY', classicName: 'Stock Overview', keywords: 'stock overview warehouse location quantities, immediate inventory balances review mm-im' },
  { code: 'EMTL', aliases: ['MM60', 'FND-MAT-LS', 'MTL'], description: 'Product Overview List – Legal-safe (was Material Overview MM60) – prod_item list', route: '/1000/foundation/materials?mode=list', module: 'FOUNDATION', subModule: 'MM-MD', type: 'REPORT', classicName: 'Materials Overview', keywords: 'material overview inventory catalogue list, global master stock directory file index mm-md prod_item EMTL alias MM60' },

  { code: 'PPRC', aliases: ['ME51N', 'PUR-PR-CR', 'PRC'], description: 'Create Purchase Requisition', route: '/1000/mm/pr?mode=create', module: 'MM', subModule: 'MM-PUR', type: 'CREATE', classicName: 'PR Create', keywords: 'create purchase requisition pr, raise internal material demand indent' },
  { code: 'PPRE', aliases: ['ME52N', 'PUR-PR-CH', 'PRE'], description: 'Change PR', route: '/1000/mm/pr?mode=change', module: 'MM', subModule: 'MM-PUR', type: 'CHANGE', classicName: 'PR Change', keywords: 'change purchase requisition pr, modify internal department item request lines' },
  { code: 'PPRV', aliases: ['ME53N', 'PUR-PR-DP', 'PRV'], description: 'Display PR', route: '/1000/mm/pr?mode=display', module: 'MM', subModule: 'MM-PUR', type: 'DISPLAY', classicName: 'PR Display', keywords: 'display purchase requisition pr, review department supply requests tracking status' },
  { code: 'PPOC', aliases: ['ME21N', 'PUR-PO-CR', 'POC'], description: 'Create Purchase Order', route: '/1000/mm/po?mode=create', module: 'MM', subModule: 'MM-PUR', type: 'CREATE', classicName: 'PO Create', keywords: 'create purchase order po, raise vendor external procurement document' },
  { code: 'PPOE', aliases: ['ME22N', 'PUR-PO-CH', 'POE'], description: 'Change PO', route: '/1000/mm/po?mode=change', module: 'MM', subModule: 'MM-PUR', type: 'CHANGE', classicName: 'PO Change', keywords: 'change purchase order po, edit vendor procurement sheet, adjust supplier contract lines' },
  { code: 'PPOV', aliases: ['ME23N', 'PUR-PO-DP', 'POV'], description: 'Display PO', route: '/1000/mm/po?mode=display', module: 'MM', subModule: 'MM-PUR', type: 'DISPLAY', classicName: 'PO Display', keywords: 'display purchase order po, view supplier contract details, check raw material procurement' },

  { code: 'IGRC', aliases: ['MIGO', 'INV-GR-PS', 'GRC'], description: 'Goods Receipt 101', route: '/1000/mm/gr?mode=101', module: 'MM', subModule: 'MM-IM', type: 'POSTING', classicName: 'GR 101', keywords: 'goods receipt 101 gr posting, warehouse inbound intake entry, log inbound delivery note we' },
  { code: 'PIVC', aliases: ['MIRO', 'PUR-IV-PS', 'IVC'], description: 'Invoice Verification', route: '/1000/mm/iv?mode=create', module: 'MM', subModule: 'MM-IV', type: 'POSTING', classicName: 'IV MIRO', keywords: 'invoice verification logistics matching, vendor bill three way reconciliation audit' },
  { code: 'IPIC', aliases: ['MI01', 'INV-PI-CR', 'PIC'], description: 'Create Physical Inventory Doc', route: '/1000/mm/physical-inventory?mode=create', module: 'MM', subModule: 'MM-PI', type: 'CREATE', classicName: 'PI Create', keywords: 'create physical inventory count document, warehouse stock audit worksheet sheet' },
  { code: 'IPIE', aliases: ['MI04', 'INV-PI-CH', 'PIE'], description: 'Enter Count', route: '/1000/mm/physical-inventory?mode=count', module: 'MM', subModule: 'MM-PI', type: 'CHANGE', classicName: 'PI Enter Count', keywords: 'enter inventory count quantities, record physical stock verification values' },
  { code: 'IPIP', aliases: ['MI07', 'INV-PI-PS', 'PIP'], description: 'Post Differences', route: '/1000/mm/physical-inventory?mode=post', module: 'MM', subModule: 'MM-PI', type: 'POSTING', classicName: 'PI Post Diff', keywords: 'post physical inventory discrepancy adjustments, reconcile stock variance shrinkage losses' },

  { code: 'MMOC', aliases: ['CO01', 'MFG-ORD-CR', 'MOC'], description: 'Create Production Order', route: '/1000/pp/kitting?mode=create', module: 'PP', subModule: 'PP', type: 'CREATE', classicName: 'Prod Order Create', keywords: 'create production order, new manufacturing job, release assembly work order' },
  { code: 'MKTC', aliases: ['KITTING', 'MFG-KIT-PS', 'KTC'], description: 'Kitting - Stocked K01/K02', route: '/1000/pp/kitting', module: 'PP', subModule: 'PP-KIT', type: 'POSTING', classicName: 'Kitting Stocked', keywords: 'kitting stock assembly, k01 k02 raw component bundling, material pre-packaging issues' },

  { code: 'SSOC', aliases: ['VA01', 'SAL-SO-CR', 'SOC'], description: 'Create Sales Order', route: '/1000/sales?mode=create', module: 'SD', subModule: 'SD', type: 'CREATE', classicName: 'Sales Order Create', keywords: 'create sales order book customer pipeline commitment, register client product contract' },
  { code: 'SSOE', aliases: ['VA02', 'SAL-SO-CH', 'SOE'], description: 'Change Sales Order', route: '/1000/sales?mode=change', module: 'SD', subModule: 'SD', type: 'CHANGE', classicName: 'Sales Change', keywords: 'change sales order adjustment, edit customer shipment conditions, modify order items lines' },
  { code: 'SSOV', aliases: ['VA03', 'SAL-SO-DP', 'SOV'], description: 'Display Sales Order', route: '/1000/sales?mode=display', module: 'SD', subModule: 'SD', type: 'DISPLAY', classicName: 'Sales Display', keywords: 'display sales order registry tracking, look up client demand execution pipeline' },

  { code: 'HHEC', aliases: ['PA30', 'HRM-EMP-CH', 'HEC'], description: 'Maintain HR Master', route: '/1000/hr/payroll?mode=maintain', module: 'HR', subModule: 'HR-PA', type: 'CHANGE', classicName: 'HR Master', keywords: 'maintain employee profiles records data details files payroll update modifications' },
  { code: 'HHEV', aliases: ['PA20', 'HRM-EMP-DP', 'HEV'], description: 'Display HR Master Data', route: '/1000/hr/payroll?mode=display', module: 'HR', subModule: 'HR-PA', type: 'DISPLAY', classicName: 'HR Display', keywords: 'display employee identity profile master ledger data files payroll hr-pa' },
  { code: 'HPYC', aliases: ['PC00', 'HRM-PAY-PS', 'PYC'], description: 'Payroll Run', route: '/1000/hr/payroll?mode=run', module: 'HR', subModule: 'HR-PY', type: 'POSTING', classicName: 'Payroll Run', keywords: 'execute employee compensation payroll run processing, monthly wages disbursements slip posting' },

  { code: 'CCUL', aliases: ['KSB1', 'CST-CU-LS', 'CUL'], description: 'Cost Center Actual Line Items', route: '/1000/fico/cca-report', module: 'FICO', subModule: 'CO-CCA', type: 'REPORT', classicName: 'CCA Actuals', keywords: 'cost center actual expenditure line items ledger tracking overview statement reports' },
  { code: 'CCRP', aliases: ['CK40N', 'CST-COST-PS', 'CRP'], description: 'Costing Run', route: '/1000/fico/costing-run?mode=run', module: 'FICO', subModule: 'CO-PC', type: 'POSTING', classicName: 'Costing Run', keywords: 'product costing run evaluations, manufacturing cost estimate evaluations rollups co-pc' },

  // --- Enterprise Structure – New Intuitive System FND-* – old OX* kept as aliases ---
  { code: 'ECGA', aliases: ['OX16', 'FND-CG-LE-AS', 'CGA'], description: 'Assign Company Group to Legal Entity', route: '/1000/foundation/company-groups', module: 'FOUNDATION', subModule: 'ENT-ASSIGN', type: 'CHANGE', classicName: 'Assign Company Group to Legal Entity', keywords: 'assign company group legal framework subsidiary to root parent corporation entity matrix map' },
  { code: 'EFLA', aliases: ['OX18', 'FND-FAC-LE-AS', 'FLA'], description: 'Assign Facility to Legal Entity', route: '/1000/foundation/facilities', module: 'FOUNDATION', subModule: 'ENT-ASSIGN', type: 'CHANGE', classicName: 'Assign Facility to Legal Entity', keywords: 'assign facility production operations site infrastructure to primary legal entity map' },
  { code: 'ECSA', aliases: ['OVX5', 'FND-CO-SC-PL-AS', 'CSA'], description: 'Define Commercial Structure Assignment', route: '/1000/foundation/commercial-orgs', module: 'FOUNDATION', subModule: 'ENT-SORG', type: 'CREATE', classicName: 'Commercial Structure Assignment', keywords: 'define commercial organization channel product line assignment structures' },

  // --- Module 1 Legal-Safe Org Structure – New Intuitive Primary, old kept as alias ---
  { code: 'ECAC', aliases: ['OX06', 'FND-CA-CR', 'CAC'], description: 'Define Management Control Area', route: '/1000/foundation/commercial-orgs', module: 'FOUNDATION', subModule: 'ENT-CTRL', type: 'CREATE', classicName: 'Control Area OX06', keywords: 'define management control area cost controlling boundary, enterprise controlling structure setup ent-ctrl' },
  { code: 'ECGC', aliases: ['ORG-CG-01', 'OX15', 'FND-CG-CR', 'CGC'], description: 'Define Company Group', route: '/1000/foundation/company-groups', module: 'FOUNDATION', subModule: 'ENT-COMP', type: 'CREATE', classicName: 'Company Group Define', keywords: 'define company group enterprise holding umbrella corporation group structure org-cg' },
  { code: 'ELEC', aliases: ['ORG-LE-01', 'OX02', 'FND-LE-CR', 'LEC'], description: 'Define Legal Entity', route: '/1000/foundation/legal-entities', module: 'FOUNDATION', subModule: 'ENT-LE', type: 'CREATE', classicName: 'Legal Entity OX02', keywords: 'define legal entity statutory company code master legal corporate identity entity node structure org-le' },
  { code: 'EFCC', aliases: ['ORG-FAC-01', 'OX10', 'FND-FAC-CR', 'FCC'], description: 'Define Facility', route: '/1000/foundation/facilities', module: 'FOUNDATION', subModule: 'ENT-FAC', type: 'CREATE', classicName: 'Facility OX10', keywords: 'define facility operational site manufacturing plant distribution fulfillment physical hub structure org-fac' },
  { code: 'EILC', aliases: ['ORG-IL-01', 'OX09', 'FND-IL-CR', 'ILC'], description: 'Define Inventory Location', route: '/1000/foundation/inventory-locations', module: 'FOUNDATION', subModule: 'ENT-IL', type: 'CREATE', classicName: 'Inventory Location OX09', keywords: 'define inventory location storage zone bins racks inventory zones configuration org-il' },
  { code: 'EPDC', aliases: ['ORG-PD-01', 'OX08', 'FND-PD-CR', 'PDC'], description: 'Define Procurement Division', route: '/1000/foundation/procurement-divisions', module: 'FOUNDATION', subModule: 'ENT-PD', type: 'CREATE', classicName: 'Procurement Division OX08', keywords: 'define procurement division purchasing organization commercial vendor negotiation team unit setup org-pd' },
  { code: 'EBTC', aliases: ['ORG-BT-01', 'OME4', 'FND-BT-CR', 'BTC'], description: 'Define Buyer Team', route: '/1000/foundation/buying-teams', module: 'FOUNDATION', subModule: 'ENT-BT', type: 'CREATE', classicName: 'Buyer Team OME4', keywords: 'define buyer team procurement group buyer profile contact assignment team codes org-bt' },
  { code: 'ECOC', aliases: ['ORG-CO-01', 'OVX2', 'FND-CO-CR', 'COC'], description: 'Define Commercial Organization', route: '/1000/foundation/commercial-orgs', module: 'FOUNDATION', subModule: 'ENT-CO', type: 'CREATE', classicName: 'Commercial Org OVX2', keywords: 'define commercial organization sales organization corporate division entity commercial trade legal setup org-co' },
  { code: 'ESCC', aliases: ['ORG-SC-01', 'OVX1', 'FND-SC-CR', 'SCC'], description: 'Define Sales Channel', route: '/1000/foundation/sales-channels', module: 'FOUNDATION', subModule: 'ENT-SC', type: 'CREATE', classicName: 'Sales Channel OVX1', keywords: 'define sales channel distribution channel direct wholesale retail marketing pipelines layout org-sc' },
  { code: 'EPLC', aliases: ['ORG-PL-01', 'OVX5', 'FND-PL-CR', 'PLC'], description: 'Define Product Line', route: '/1000/foundation/product-lines', module: 'FOUNDATION', subModule: 'ENT-PL', type: 'CREATE', classicName: 'Product Line Division', keywords: 'define product line division commercial product division line category hierarchy org-pl' },
  { code: 'EPUC', aliases: ['ORG-PU-01', 'KE51', 'FND-PU-CR', 'PUC'], description: 'Define Profit Unit', route: '/1000/foundation/commercial-units', module: 'FOUNDATION', subModule: 'ENT-PU', type: 'CREATE', classicName: 'Profit Unit KE51', keywords: 'define profit unit profitability center enterprise profit tracking unit reporting org-pu' },
  { code: 'ECUC', aliases: ['ORG-CU-01', 'KS01', 'FND-CU-CR', 'CUC'], description: 'Define Cost Unit', route: '/1000/foundation/enterprise-structure?focus=ECUC', module: 'FOUNDATION', subModule: 'ENT-CU', type: 'CREATE', classicName: 'Cost Unit KS01', keywords: 'define cost unit cost center operational department allocation node management profiles org-cu' },
  { code: 'EBSC', aliases: ['ORG-BS-01', 'FND-BS-CR', 'BSC'], description: 'Define Business Segment', route: '/1000/foundation/enterprise-structure?focus=EBSC', module: 'FOUNDATION', subModule: 'ENT-BS', type: 'CREATE', classicName: 'Business Segment', keywords: 'define business segment reporting segment enterprise business area segment structure org-bs' },
  { code: 'EWHC', aliases: ['ORG-WH-01', 'FND-WH-CR', 'WHC'], description: 'Define Warehouse Site', route: '/1000/foundation/warehouse-sites', module: 'FOUNDATION', subModule: 'ENT-WH', type: 'CREATE', classicName: 'Warehouse Site', keywords: 'define warehouse site warehouse number storage facility warehouse zone bin location org-wh' },
  { code: 'EDPC', aliases: ['ORG-DP-01', 'FND-DP-CR', 'DPC'], description: 'Define Dispatch Point', route: '/1000/foundation/enterprise-structure?focus=EDPC', module: 'FOUNDATION', subModule: 'ENT-DP', type: 'CREATE', classicName: 'Dispatch Point Shipping', keywords: 'define dispatch point shipping point shipment origin loading group route logistics org-dp' },

  // --- Financial Config OB45/OB38/OB29/OB37/OBBO/OB52/OBBP ---
  { code: 'FCPC', aliases: ['OB45', 'FIN-CP-CR', 'CPC'], description: 'Define Credit Control Area', route: '/1000/foundation/credit-policy-areas', module: 'FICO', subModule: 'FI-COMP', type: 'CREATE', classicName: 'Credit Control Area', keywords: 'define commercial customer credit control boundary risk management area rules setup fi-comp' },
  { code: 'FLCA', aliases: ['OB38', 'FIN-LE-CP-AS', 'LCA'], description: 'Assign Company Code to Credit Control Area', route: '/1000/fico/company-master', module: 'FICO', subModule: 'FI-COMP', type: 'CHANGE', classicName: 'Assign CC->CCA', keywords: 'assign active legal company code transaction entity mapping to global risk management credit control' },
  { code: 'FFYC', aliases: ['OB29', 'FIN-FC-CR', 'FYC'], description: 'Define Fiscal Year Variant K4', route: '/1000/fico/fiscal-calendars', module: 'FICO', subModule: 'FI-FYV', type: 'CREATE', classicName: 'Fiscal Year Variant', keywords: 'define corporate fiscal year accounting variant periods timeline k4 calendar rules setup fi-fyv' },
  { code: 'FLFA', aliases: ['OB37', 'FIN-LE-FC-AS', 'LFA'], description: 'Assign Fiscal Year Variant to Company Code', route: '/1000/fico/company-master', module: 'FICO', subModule: 'FI-FYV', type: 'CHANGE', classicName: 'Assign FYV->CC', keywords: 'assign fiscal accounting year periods setup layout matrix mappings directly to company code' },
  { code: 'FLPA', aliases: ['OBBP', 'FIN-LE-PC-AS', 'LPA'], description: 'Assign Posting Period Variant to Company Code', route: '/1000/fico/company-master', module: 'FICO', subModule: 'FI-PPV', type: 'CHANGE', classicName: 'Assign PPV->CC', keywords: 'assign localized operational financial posting period variant settings block to specific company codes' },

  // --- Chart of Accounts OB13/OB62/OBD4/OB53/OBA7/FBN1/FS00 ---
  { code: 'FCOA', aliases: ['OB13', 'FIN-COA-CR', 'COA'], description: 'Define Chart of Accounts KSCA', route: '/1000/fico/chart-of-accounts', module: 'FICO', subModule: 'FI-COA', type: 'CREATE', classicName: 'Chart of Accounts', keywords: 'define chart of accounts operational ksca financial balance sheet structures map fi-coa' },
  { code: 'FLC2', aliases: ['OB62', 'FIN-LE-COA-AS', 'LCA2'], description: 'Assign Company Code to Chart of Accounts', route: '/1000/fico/chart-of-accounts', module: 'FICO', subModule: 'FI-COA', type: 'CHANGE', classicName: 'Assign CC->CoA', keywords: 'assign operational corporate company code asset entities mapping to universal chart of accounts' },
  { code: 'FAGC', aliases: ['OBD4', 'FIN-AG-CR', 'AGC'], description: 'Define Account Groups KASS/KLIA/KREV etc', route: '/1000/fico/chart-of-accounts', module: 'FICO', subModule: 'FI-COA', type: 'CREATE', classicName: 'Account Groups', keywords: 'define accounting general ledger group categories ranges classification codes kass klia krev' },
  { code: 'FREC', aliases: ['OB53', 'FIN-RE-CR', 'REC'], description: 'Define Retained Earnings Account 2500000001', route: '/1000/fico/chart-of-accounts', module: 'FICO', subModule: 'FI-COA', type: 'CREATE', classicName: 'Retained Earnings', keywords: 'define retained earnings surplus capital ledger roll over clearing account setups fi-coa' },
  { code: 'FDTC', aliases: ['OBA7', 'FIN-DT-CR', 'DTC'], description: 'Define Document Types KR/KG/KZ/RE/WE/WA/SA', route: '/1000/fico/document-types', module: 'FICO', subModule: 'FI-DOC', type: 'CREATE', classicName: 'Document Types', keywords: 'define ledger transaction document types mapping classification rules journal vouchers kr kg kz re we wa sa' },
  { code: 'FNRC', aliases: ['FBN1', 'FIN-NR-CR', 'NRC'], description: 'Define Number Ranges 50-54 5000000000-5499999999', route: '/1000/fico/number-ranges', module: 'FICO', subModule: 'FI-NR', type: 'CREATE', classicName: 'Number Ranges', keywords: 'define transaction document sequence number ranges counter increments configuration fi-nr' },
  { code: 'FGLC', aliases: ['FS00', 'FIN-GL-CR', 'GLC'], description: 'Create G/L Account Master 5000000001-5000000006', route: '/1000/fico/gl-accounts', module: 'FICO', subModule: 'FI-GL', type: 'CREATE', classicName: 'G/L Account Create', keywords: 'create general ledger gl account master setup chart entries definitions directory fi-gl' },
  { code: 'FGCA', aliases: ['FS01', 'FIN-GL-COA-CR', 'GCA'], description: 'Create G/L Account in Chart', route: '/1000/fico/gl-accounts', module: 'FICO', subModule: 'FI-GL', type: 'CREATE', classicName: 'G/L Chart Create', keywords: 'create financial general ledger chart accounts matrix framework asset liability setup' },
  { code: 'FGLE', aliases: ['FS02', 'FIN-GL-CH', 'GLE'], description: 'Change G/L Account', route: '/1000/fico/gl-accounts', module: 'FICO', subModule: 'FI-GL', type: 'CHANGE', classicName: 'G/L Account Change', keywords: 'change general ledger asset account fields structure definitions parameters edits' },
  { code: 'FGLV', aliases: ['FS03', 'FIN-GL-DP', 'GLV'], description: 'Display G/L Account', route: '/1000/fico/gl-accounts', module: 'FICO', subModule: 'FI-GL', type: 'DISPLAY', classicName: 'G/L Account Display', keywords: 'display operational general ledger account definitions metrics profile view summary' },
  { code: 'FGCV', aliases: ['FSP0', 'FIN-GL-COA-DP', 'GCV'], description: 'G/L Account in Chart of Accounts', route: '/1000/fico/chart-of-accounts', module: 'FICO', subModule: 'FI-GL', type: 'DISPLAY', classicName: 'G/L in Chart', keywords: 'local general ledger account parameters mapping within corporate unified chart structures' },
  { code: 'FAUC', aliases: ['OBYC', 'FIN-AUTO-CR', 'AUC'], description: 'Auto Account Determination BSX/WRX/PRD/GBB/BSV', route: '/1000/fico/auto-account-determination', module: 'FICO', subModule: 'FI-AUTO', type: 'CREATE', classicName: 'Auto Determination', keywords: 'automatic inventory gl account determination layout matrix setups rule clearing bsx wrx prd gbb bsv fi-auto' },

  // --- PP - BOM, Work Centers, Routings, MRP, STO ---
  { code: 'MBMC', aliases: ['CS01', 'MFG-BOM-CR', 'BMC'], description: 'Create BOM - Bills of Material', route: '/1000/pp/bom', module: 'PP', subModule: 'PP-BOM', type: 'CREATE', classicName: 'BOM Create CS01', keywords: 'create bill of materials bom, product structure design components, engineering recipe list' },
  { code: 'MBME', aliases: ['CS02', 'MFG-BOM-CH', 'BME'], description: 'Change BOM', route: '/1000/pp/bom', module: 'PP', subModule: 'PP-BOM', type: 'CHANGE', classicName: 'BOM Change CS02', keywords: 'change bill of materials bom, edit product structure parts, update engineering recipe' },
  { code: 'MBMV', aliases: ['CS03', 'MFG-BOM-DP', 'BMV'], description: 'Display BOM', route: '/1000/pp/bom', module: 'PP', subModule: 'PP-BOM', type: 'DISPLAY', classicName: 'BOM Display CS03', keywords: 'display bill of materials bom, view product assembly structure tree, look up parts recipe' },
  { code: 'MWCC', aliases: ['CR01', 'MFG-WC-CR', 'WCC'], description: 'Create Work Center - Machine/Labor Capacity', route: '/1000/pp/work-centers', module: 'PP', subModule: 'PP-WC', type: 'CREATE', classicName: 'Work Center CR01', keywords: 'create work center machine labor capacity, new assembly line plant floor resource' },
  { code: 'MWCE', aliases: ['CR02', 'MFG-WC-CH', 'WCE'], description: 'Change Work Center', route: '/1000/pp/work-centers', module: 'PP', subModule: 'PP-WC', type: 'CHANGE', classicName: 'Work Center CR02', keywords: 'change work center machine labor capacity, update factory floor resource station' },
  { code: 'MWCV', aliases: ['CR03', 'MFG-WC-DP', 'WCV'], description: 'Display Work Center', route: '/1000/pp/work-centers', module: 'PP', subModule: 'PP-WC', type: 'DISPLAY', classicName: 'Work Center CR03', keywords: 'display work center machine labor capacity, view production environment line resource' },
  { code: 'MRTC', aliases: ['CA01', 'MFG-RTG-CR', 'RTC'], description: 'Create Routing - Sequence of Manufacturing Steps', route: '/1000/pp/routings', module: 'PP', subModule: 'PP-RTG', type: 'CREATE', classicName: 'Routing CA01', keywords: 'create routing manufacturing steps, production operations sequence, process plan template' },
  { code: 'MRTE', aliases: ['CA02', 'MFG-RTG-CH', 'RTE'], description: 'Change Routing', route: '/1000/pp/routings', module: 'PP', subModule: 'PP-RTG', type: 'CHANGE', classicName: 'Routing CA02', keywords: 'change routing manufacturing steps, update production operations, edit process plan' },
  { code: 'MRTV', aliases: ['CA03', 'MFG-RTG-DP', 'RTV'], description: 'Display Routing', route: '/1000/pp/routings', module: 'PP', subModule: 'PP-RTG', type: 'DISPLAY', classicName: 'Routing CA03', keywords: 'display routing manufacturing steps, view production operations, look up process plan' },
  { code: 'MMRP', aliases: ['MD01', 'MFG-MRP-PS', 'MRP'], description: 'MRP Run - Material Requirements Planning', route: '/1000/pp/mrp', module: 'PP', subModule: 'PP-MRP', type: 'POSTING', classicName: 'MRP Run MD01', keywords: 'mrp run material requirements planning, demand forecasting engine, net requirements calculation' },
  { code: 'MMRV', aliases: ['MD04', 'MFG-MRP-DP', 'MRV'], description: 'Stock/Requirements List - MRP Stock', route: '/1000/pp/mrp', module: 'PP', subModule: 'PP-MRP', type: 'DISPLAY', classicName: 'Stock Req List MD04', keywords: 'stock requirements list, mrp dynamic availability view, material supply demand balance sheet' },
  { code: 'PSTC', aliases: ['ME27', 'PUR-STO-CR', 'STC'], description: 'Create Stock Transport Order STO', route: '/1000/mm/sto', module: 'MM', subModule: 'MM-STO', type: 'CREATE', classicName: 'STO Create ME27', keywords: 'create stock transport order sto, inter company site inventory transfer request' },
  { code: 'PSTD', aliases: ['VL10B', 'PUR-STO-DL-PS', 'STD'], description: 'Process STO Delivery', route: '/1000/mm/sto', module: 'MM', subModule: 'MM-STO', type: 'POSTING', classicName: 'STO Delivery VL10B', keywords: 'process stock transport delivery fulfillment, execute cross plant warehouse transfer orders' },
  { code: 'SDLC', aliases: ['VL01N', 'SAL-DL-CR', 'DLC'], description: 'Create Outbound Delivery - B2B Wholesale', route: '/1000/sd/delivery', module: 'SD', subModule: 'SD-DL', type: 'CREATE', classicName: 'Delivery VL01N', keywords: 'create outbound shipping delivery document, logistics b2b wholesale packing warehouse shipment' },
  { code: 'SBLC', aliases: ['VF01', 'SAL-BL-PS', 'BLC'], description: 'Create Billing Document - B2B AR', route: '/1000/sd/billing', module: 'SD', subModule: 'SD-BIL', type: 'POSTING', classicName: 'Billing VF01', keywords: 'create billing document commercial invoice, run customer accounting accounts receivable b2b ar' },

  // --- Cost Centers & Tax & Payment ---
  { code: 'CCUC', aliases: ['KS01', 'CST-CU-CR', 'CUC', 'CUC2'], description: 'Create Cost Center KS-CC-01..05', route: '/1000/fico/cost-centers', module: 'FICO', subModule: 'CO-CCA', type: 'CREATE', classicName: 'Cost Center Create', keywords: 'create cost center operational department allocation node management profiles co-cca' },
  { code: 'CCUE', aliases: ['KS02', 'CST-CU-CH', 'CUE'], description: 'Change Cost Center', route: '/1000/fico/cost-centers', module: 'FICO', subModule: 'CO-CCA', type: 'CHANGE', classicName: 'Cost Center Change KS02', keywords: 'change operational cost center parameters reporting allocations fields updates tracking' },
  { code: 'CCUV', aliases: ['KS03', 'CST-CU-DP', 'CUV'], description: 'Display Cost Center', route: '/1000/fico/cost-centers', module: 'FICO', subModule: 'CO-CCA', type: 'DISPLAY', classicName: 'Cost Center Display KS03', keywords: 'display department cost center ownership information boundaries evaluation tracking' },
  { code: 'FCYC', aliases: ['OY03', 'FIN-CUR-CR', 'CYC'], description: 'Define Currencies - Only INR default, OY03', route: '/1000/fico/currencies', module: 'FICO', subModule: 'FI-CUR', type: 'CREATE', classicName: 'Currencies OY03', keywords: 'define active monetary units transaction exchange currency lists baseline standard tracking inr default' },
  { code: 'EMTP', aliases: ['OMS2', 'FND-MT-CR', 'MTP'], description: 'Define Product Types – Legal-safe (was Define Material Types OMS2) – prod_item_type RAW/FINISHED/SEMI', route: '/1000/foundation/material-types', module: 'FOUNDATION', subModule: 'MM-CFG', type: 'CREATE', classicName: 'Material Types', keywords: 'define material types behavior configurations, raw materials semi finished packaging attributes prod_item_type RAW FINISHED SEMI TRADING PACKAGING CONSUMABLE SERVICE EMTP alias OMS2 ROH FERT HALB' },
  { code: 'EMGC', aliases: ['OMSF', 'FND-MG-CR', 'MGC'], description: 'Define Product Categories – Legal-safe (was Define Material Groups OMSF) – prod_category', route: '/1000/foundation/material-types', module: 'FOUNDATION', subModule: 'MM-CFG', type: 'CREATE', classicName: 'Material Groups', keywords: 'define material groupings classification hierarchy, food spice oil pack packaging structure prod_category EMGC' },
  { code: 'EUOC', aliases: ['CUNI', 'FND-UOM-CR', 'UOC'], description: 'Define Units of Measure – Legal-safe own IP (was CUNI) – core_unit_measure KG/L/PC/BOX sample kept', route: '/1000/foundation/uom', module: 'FOUNDATION', subModule: 'MM-CFG', type: 'CREATE', classicName: 'UoM CUNI', keywords: 'define global units of measure uom weight dimension metric conversion factors mm-cfg core_unit_measure EUOC alias CUNI KG L PC BOX' },
  { code: 'ELTC', aliases: ['MSC3N', 'FND-LOT-CR', 'LTC'], description: 'Define Lots – Legal-safe (was Batch) – inv_lot lot_number expiry_date', route: '/1000/foundation/inventory-locations', module: 'FOUNDATION', subModule: 'MM-CFG', type: 'CREATE', classicName: 'Lots ELTC', keywords: 'define lots batch numbers expiry manufacturing date inventory tracking inv_lot ELTC alias Batch' },
  // Module 3 – Partner – Legal-safe own IP – EPAC/SCUC/PSUC – 4-char MOOA E=Enterprise, PA=Partner Account, CU=Customer, SU=Supplier, C=Create
  { code: 'EPAC', aliases: ['PTNC', 'BPAC', 'BP01', 'FND-BP-CR', 'BP'], description: 'Create Partner Account – Legal-safe own IP (was Business Partner BP) – partner_account central master role VENDOR/CUSTOMER/BOTH', route: '/1000/foundation/partners', module: 'FOUNDATION', subModule: 'BP-MD', type: 'CREATE', classicName: 'Partner Account Create', keywords: 'create partner account business partner central master vendor customer both roles display name legal name gst pan tax id partner_account EPAC alias PTNC BP01' },
  { code: 'EPAE', aliases: ['BP02', 'FND-BP-CH', 'PAE'], description: 'Change Partner Account – Legal-safe (was Change Business Partner)', route: '/1000/foundation/partners?mode=change', module: 'FOUNDATION', subModule: 'BP-MD', type: 'CHANGE', classicName: 'Partner Account Change', keywords: 'change partner account business partner master data update partner_account EPAE' },
  { code: 'EPAV', aliases: ['BP03', 'FND-BP-DP', 'PAV'], description: 'Display Partner Account – Legal-safe (was Display Business Partner)', route: '/1000/foundation/partners?mode=display', module: 'FOUNDATION', subModule: 'BP-MD', type: 'DISPLAY', classicName: 'Partner Account Display', keywords: 'display partner account business partner master view partner_account EPAV' },
  { code: 'EPAL', aliases: ['BPAL', 'FND-BP-LS', 'PAL'], description: 'Partner Account Overview List – Legal-safe (was Business Partner List)', route: '/1000/foundation/partners', module: 'FOUNDATION', subModule: 'BP-MD', type: 'REPORT', classicName: 'Partner Overview', keywords: 'partner overview list business partner directory vendor customer both partner_account EPAL' },
  { code: 'PSUC', aliases: ['SUPC', 'VEND', 'XK01', 'ME01', 'FND-SU-CR', 'BP-SU'], description: 'Create Supplier – Legal-safe own IP (was Vendor Master XK01/ME01) – partner_account role VENDOR + partner_vendor_profile procurement view', route: '/1000/foundation/partners?role=VENDOR', module: 'FOUNDATION', subModule: 'BP-VENDOR', type: 'CREATE', classicName: 'Supplier Create', keywords: 'create supplier vendor master procurement partner_account role vendor partner_vendor_profile procurement division buyer team quality relevant PSUC alias SUPC XK01 ME01' },
  { code: 'PSUE', aliases: ['XK02', 'FND-SU-CH', 'SUE'], description: 'Change Supplier – Legal-safe (was Change Vendor XK02)', route: '/1000/foundation/partners?role=VENDOR&mode=change', module: 'FOUNDATION', subModule: 'BP-VENDOR', type: 'CHANGE', classicName: 'Supplier Change', keywords: 'change supplier vendor master procurement partner_vendor_profile PSUE' },
  { code: 'PSUV', aliases: ['XK03', 'FND-SU-DP', 'SUV'], description: 'Display Supplier – Legal-safe (was Display Vendor XK03)', route: '/1000/foundation/partners?role=VENDOR&mode=display', module: 'FOUNDATION', subModule: 'BP-VENDOR', type: 'DISPLAY', classicName: 'Supplier Display', keywords: 'display supplier vendor master view procurement PSUV' },
  { code: 'SCUC', aliases: ['CUCC', 'CUST', 'XD01', 'FND-CU-CR', 'BP-CU'], description: 'Create Customer – Legal-safe own IP (was Customer Master XD01) – partner_account role CUSTOMER + partner_customer_profile sales view', route: '/1000/foundation/partners?role=CUSTOMER', module: 'FOUNDATION', subModule: 'BP-CUSTOMER', type: 'CREATE', classicName: 'Customer Create', keywords: 'create customer master sales partner_account role customer partner_customer_profile commercial org sales channel product line credit policy SCUC alias CUCC XD01' },
  { code: 'SCUE', aliases: ['XD02', 'FND-CU-CH', 'CUE'], description: 'Change Customer – Legal-safe (was Change Customer XD02)', route: '/1000/foundation/partners?role=CUSTOMER&mode=change', module: 'FOUNDATION', subModule: 'BP-CUSTOMER', type: 'CHANGE', classicName: 'Customer Change', keywords: 'change customer master sales partner_customer_profile SCUE' },
  { code: 'SCUV', aliases: ['XD03', 'FND-CU-DP', 'CUV'], description: 'Display Customer – Legal-safe (was Display Customer XD03)', route: '/1000/foundation/partners?role=CUSTOMER&mode=display', module: 'FOUNDATION', subModule: 'BP-CUSTOMER', type: 'DISPLAY', classicName: 'Customer Display', keywords: 'display customer master sales view SCUV' },
  { code: 'EPCC', aliases: ['BPCC', 'FND-PC-CR', 'PCC'], description: 'Create Partner Contact – Legal-safe (new) – partner_contact multiple contacts per partner', route: '/1000/foundation/partners?tab=contacts', module: 'FOUNDATION', subModule: 'BP-CONTACT', type: 'CREATE', classicName: 'Partner Contact Create', keywords: 'create partner contact multiple contacts primary billing shipping purchasing sales technical finance partner_contact EPCC' },
  { code: 'FTXC', aliases: ['FTXP', 'FIN-TX-CR', 'TXC'], description: 'Define Tax Codes GST0/5/12/18/28 IGST - VAT 5% included', route: '/1000/fico/tax-codes', module: 'FICO', subModule: 'FI-TAX', type: 'CREATE', classicName: 'Tax Codes FTXP', keywords: 'define calculation tax codes rates percentage setups gst0 gst5 gst12 gst18 gst28 igst vat fi-tax' },
  { code: 'FTGC', aliases: ['OB40', 'FIN-TX-GL-CR', 'TGC'], description: 'Tax GL Accounts', route: '/1000/fico/tax-groups', module: 'FICO', subModule: 'FI-TAX', type: 'CREATE', classicName: 'Tax GL OB40', keywords: 'tax general ledger automatic accounts assignment matrix posting clearing accounts rules setup' },
  { code: 'FPPC', aliases: ['OBBO', 'FIN-PC-CR', 'PPC'], description: 'Posting Period Variant OBBO', route: '/1000/fico/posting-period-variants', module: 'FICO', subModule: 'FI-PER', type: 'CREATE', classicName: 'PP Variant OBBO', keywords: 'define accounting posting period variant structure groupings ledger framework templates fi-per' },
  { code: 'FPPE', aliases: ['OB52', 'FIN-PC-PS', 'PPE'], description: 'Open Close Posting Periods OB52', route: '/1000/fico/posting-periods', module: 'FICO', subModule: 'FI-PER', type: 'CHANGE', classicName: 'Posting Periods OB52', keywords: 'open close ledger posting period horizons monthly manual calendar lockout tracking fi-per' },
  { code: 'FPYP', aliases: ['F-53', 'FIN-AP-PAY-PS', 'PYP'], description: 'Vendor Payment KZ 53* 5300000000-', route: '/1000/fico/payment', module: 'FICO', subModule: 'FI-AP', type: 'POSTING', classicName: 'Vendor Payment F-53', keywords: 'vendor manual cash payment clearing post, outgoing settlement generation accounting kz fi-ap' },
  { code: 'FPYA', aliases: ['F110', 'FIN-AP-AUTO-PS', 'PYA'], description: 'Automatic Payment Program', route: '/1000/fico/payment', module: 'FICO', subModule: 'FI-AP', type: 'POSTING', classicName: 'Auto Payment F110', keywords: 'automatic payment batch settlement run, automated accounts payable processing wire ledger' },
  { code: 'FPYT', aliases: ['KZ', 'FIN-AP-DT-PS', 'PYT'], description: 'Payment Document Type KZ 53*', route: '/1000/fico/payment', module: 'FICO', subModule: 'FI-AP', type: 'POSTING', classicName: 'Payment KZ', keywords: 'accounts payable vendor payment document ledger journal entries voucher allocations types kz' },

  { code: 'FWFL', aliases: ['SBWP', 'FND-WF-LS', 'WFL'], description: 'Workflow Inbox - Approvals', route: '/1000/workflow/inbox', module: 'FOUNDATION', subModule: 'WF', type: 'REPORT', classicName: 'Workflow Inbox', keywords: 'workflow inbox approvals, task list, manager approval center, pending sign off requests' },
  { code: 'PPRL', aliases: ['ME54N', 'PUR-PR-RL', 'PRL'], description: 'Release PR', route: '/1000/workflow/inbox?docType=PR', module: 'MM', subModule: 'MM-PUR', type: 'POSTING', classicName: 'Release PR', keywords: 'release purchase requisition approval, authorize internal material requests tracker' },
  { code: 'PPOR', aliases: ['ME28', 'PUR-PO-RL', 'POR'], description: 'Release PO', route: '/1000/workflow/inbox?docType=PO', module: 'MM', subModule: 'MM-PUR', type: 'POSTING', classicName: 'Release PO', keywords: 'release purchase order approval, authorize pending vendor procurement, sign off po' },
  { code: 'AFLW', aliases: ['ALB', 'AUD-FLOW-DP', 'FLW'], description: 'Document Flow', route: '/1000/audit/document-flow', module: 'AUDIT', subModule: 'AUDIT-FLOW', type: 'DISPLAY', classicName: 'Document Flow', keywords: 'document flow tracking, audit trail history, transaction links, business object sequence' },
  { code: 'AALG', aliases: ['SM20', 'AUD-LOG-LS', 'ALG'], description: 'Audit Log', route: '/1000/audit/logs', module: 'AUDIT', subModule: 'AUDIT-LOG', type: 'REPORT', classicName: 'Audit Log', keywords: 'system audit log, security events, user activity tracking, electronic records tracking' },

  // --- Phase 0 T0 BLOCKING – OMJJ Movement Types + VKOA Revenue Account ---
  { code: 'OMJJ', aliases: ['FIN-MV-CR', 'MVC', 'MOVEMENT'], description: 'Define Movement Types 101/102/122/161/261/262/309/551/601/602/701/702 – OMJJ – T0 BLOCKING – stock +/- value +/- account modifier BSX/WRX/GBB/PRD/BSV – used in GR GI PGI PI', route: '/1000/fico/movement-types', module: 'FICO', subModule: 'FI-MV', type: 'CREATE', classicName: 'Movement Types OMJJ', keywords: 'movement types omjj 101 gr 102 reversal 122 return 261 gi prod order co11n 601 pgi sales vl02n 602 reverse pgi vl09 701 702 pi diff mi07 bsv bsx wrx gbb prd' },
  { code: 'VKOA', aliases: ['FIN-REV-CR', 'KOFI', 'KOFK', 'REVENUE'], description: 'Define Revenue Account Determination – VKOA – T0 BLOCKING – chart + sales org + customer group + material group + account assignment → GL KOFI/KOFK – used in billing VF01 – Dr AR Cr Revenue', route: '/1000/fico/revenue-accounts', module: 'FICO', subModule: 'FI-REV', type: 'CREATE', classicName: 'Revenue Account VKOA', keywords: 'revenue account determination vkoa kofi kofk chart sales org customer group material group account assignment gl revenue billing vf01' },

  // --- Admin / Security ---
  { code: 'FUSC', aliases: ['SU01', 'FND-USR-CR', 'USC'], description: 'User Maintenance', route: '/1000/admin/users', module: 'FOUNDATION', subModule: 'ADMIN', type: 'CREATE', classicName: 'User SU01', keywords: 'administrative user maintenance account profiles tracking reset credentials authorization access rules' },
  { code: 'FROC', aliases: ['PFCG', 'FND-ROL-CR', 'ROC'], description: 'Role Maintenance', route: '/1000/admin/roles', module: 'FOUNDATION', subModule: 'ADMIN', type: 'CREATE', classicName: 'Role PFCG', keywords: 'role maintenance profile governance security tracking matrix setup access permission paths' },
  { code: 'EWSC', aliases: ['EWSC'], description: 'Define EWSC – auto-generated', route: '/1000/foundation/warehouse-sites', module: 'FOUNDATION', subModule: 'ENT', type: 'CREATE', classicName: 'EWSC', keywords: 'ewsc' },
  { code: 'FEXC', aliases: ['FEXC'], description: 'Define FEXC – auto-generated', route: '/1000/fico/exchange-rates', module: 'FOUNDATION', subModule: 'ENT', type: 'CREATE', classicName: 'FEXC', keywords: 'fexc' },
  { code: 'FCCA', aliases: ['FCCA'], description: 'Define FCCA – auto-generated', route: '/1000/fico/cost-centers', module: 'FOUNDATION', subModule: 'ENT', type: 'CREATE', classicName: 'FCCA', keywords: 'fcca' },

];

export const MODULE_CLASSIFICATION = {
  FOUNDATION: { name: 'Foundation', color: 'bg-zinc-100', icon: '🏗️', description: 'Layer 0: Client, Company Code, Plant, SLoc, Material, Batch, Number Ranges - ERP core' },
  MM: { name: 'Materials Management', color: 'bg-blue-50', icon: '📦', description: 'PR to PO to GR to IV, ELIKZ, MAP landed, Physical Inventory - ERP MM' },
  PP: { name: 'Production Planning', color: 'bg-purple-50', icon: '🏭', description: 'BOM, Work Center, Production Order, Kitting Stocked/Phantom - ERP PP' },
  SD: { name: 'Sales & Distribution', color: 'bg-green-50', icon: '🛒', description: 'Sales Order B2B/B2C/POS Webhook, 601 GI, Revenue - ERP SD' },
  HR: { name: 'Human Resources', color: 'bg-orange-50', icon: '👥', description: 'Org Unit, Position, Employee, Payroll 300 KWD, FI - ERP HR' },
  FICO: { name: 'Financials & Controlling', color: 'bg-amber-50', icon: '💰', description: 'GL, AP, AR, CCA, Product Costing, MAP - ERP FICO' },
  AUDIT: { name: 'Audit & Compliance', color: 'bg-slate-50', icon: '🔍', description: 'Document Flow, Audit Log WORM-lite - ERP Audit' },
};

export function getFunctionByRoute(route: string): FunctionCode[] {
  const base = route.split('?')[0];
  const last = base.split('/').pop() || '';
  return FUNCTIONS.filter(t => t.route.split('?')[0].includes(last) || t.route === route);
}

export function searchFunctions(query: string): FunctionCode[] {
  const raw = query.trim().toUpperCase();
  if (!raw) return FUNCTIONS.slice(0, 8);

  const tokens = raw.split(/\s+/).filter(Boolean);

  // Exact code match first – if query equals a code exactly, return it first
  const exactCodeMatch = FUNCTIONS.find(t => t.code.toUpperCase() === raw || (t.aliases && t.aliases.some(a => a.toUpperCase() === raw)));
  const exactMatches: FunctionCode[] = exactCodeMatch ? [exactCodeMatch] : [];

  const typeSynonyms: Record<string, string> = {
    CREATE: 'CREATE',
    NEW: 'CREATE',
    ADD: 'CREATE',
    EDIT: 'CHANGE',
    CHANGE: 'CHANGE',
    UPDATE: 'CHANGE',
    MODIFY: 'CHANGE',
    DISPLAY: 'DISPLAY',
    VIEW: 'DISPLAY',
    SHOW: 'DISPLAY',
    POST: 'POSTING',
    POSTING: 'POSTING',
    REPORT: 'REPORT',
  };

  const docSynonyms: Record<string, string[]> = {
    PO: ['PO', 'PURCHASE ORDER', 'ME21N', 'ME22N', 'ME23N', 'ME28'],
    PR: ['PR', 'PURCHASE REQUISITION', 'REQUISITION', 'ME51N', 'ME52N', 'ME53N', 'ME54N'],
    GR: ['GR', 'GOODS RECEIPT', 'GOODS MOVEMENT', 'MIGO', 'RECEIPT', '101', 'WE'],
    GI: ['GI', 'GOODS ISSUE', 'ISSUE', 'MIGO', '261', '601', 'WA'],
    IV: ['IV', 'INVOICE VERIFICATION', 'INVOICE', 'MIRO', 'RE', '51'],
    SO: ['SO', 'SALES ORDER', 'SALES', 'VA01', 'VA02', 'VA03'],
    DELIVERY: ['DELIVERY', 'DO', 'VL01N', 'VL02N', 'VL03N', 'OUTBOUND DELIVERY'],
    BILLING: ['BILLING', 'BILL', 'VF01', 'VF02', 'VF03', 'INVOICE'],
    MATERIAL: ['MATERIAL', 'MAT', 'MM01', 'MM02', 'MM03', 'MMBE', 'MM60'],
    BOM: ['BOM', 'CS01', 'CS02', 'CS03', 'BILL OF MATERIAL'],
    WORKCENTER: ['WORK CENTER', 'WORKCENTER', 'WC', 'CR01', 'CR02', 'CR03'],
    ROUTING: ['ROUTING', 'CA01', 'CA02', 'CA03'],
    MRP: ['MRP', 'MD01', 'MD04'],
    KITTING: ['KITTING', 'KIT', 'CO01'],
    STO: ['STO', 'STOCK TRANSPORT', 'ME27', 'VL10B'],
    PHYSICAL: ['PHYSICAL', 'PI', 'MI01', 'MI04', 'MI07', 'INVENTORY'],
    COSTCENTER: ['COST CENTER', 'CC', 'KS01', 'KS02', 'KS03', 'KSB1'],
    GL: ['GL', 'FS00', 'FS01', 'FS02', 'FS03', 'G/L'],
    COA: ['COA', 'CHART', 'OB13', 'OB62', 'OBD4', 'OB53'],
    TAX: ['TAX', 'FTXP', 'VAT', 'GST', 'OB40'],
    CURRENCY: ['CURRENCY', 'CURRENCIES', 'OY03', 'INR', 'KWD', 'USD'],
    UOM: ['UOM', 'CUNI', 'UNIT', 'UNITS', 'KG', 'MEASURE'],
    MATERIALTYPE: ['MATERIAL TYPE', 'OMS2', 'ROH', 'HALB', 'FERT', 'HAWA'],
    POSTINGPERIOD: ['POSTING PERIOD', 'OBBO', 'OB52', 'OBBP', 'PERIOD'],
    PAYMENT: ['PAYMENT', 'F-53', 'KZ', 'F110', 'VENDOR PAYMENT'],
    PAYROLL: ['PAYROLL', 'PC00', 'PA30', 'PA20', 'HR'],
    COMPANY: ['COMPANY', 'OX15', 'OX02', 'COMPANY CODE', 'ENTERPRISE'],
    PLANT: ['PLANT', 'OX10', 'OX09', 'SLOC', 'STORAGE LOCATION'],
    AUDIT: ['AUDIT', 'SM20', 'ALB', 'DOCUMENT FLOW', 'LOG'],
    WORKFLOW: ['WORKFLOW', 'SBWP', 'APPROVAL', 'INBOX'],
    USER: ['USER', 'SU01', 'PROFILE', 'USERS'],
    ROLE: ['ROLE', 'PFCG', 'PERMISSION', 'ROLES'],
    COSTING: ['COSTING', 'CK40N', 'COST'],
  };

  const variantToCanonical: Record<string, string[]> = {};
  for (const [canonical, variants] of Object.entries(docSynonyms)) {
    for (const v of variants) {
      const key = v.toUpperCase();
      if (!variantToCanonical[key]) variantToCanonical[key] = [];
      variantToCanonical[key].push(canonical);
    }
  }

  function containsTokenExact(text: string, token: string): boolean {
    if (token.length <= 2) {
      const words = text.split(/[^A-Z0-9-]+/);
      if (words.includes(token)) return true;
      return false;
    }
    return text.includes(token);
  }

  function containsTokenPartial(text: string, token: string): boolean {
    // Partial: token is substring of any word, or any word is substring of token, for len >=3
    if (token.length < 3) return false;
    const words = text.split(/[^A-Z0-9-]+/).filter(Boolean);
    for (const w of words) {
      if (w.length < 3) continue;
      if (w.includes(token) || token.includes(w)) return true;
      // prefix match: e.g., CREA matches CREATE
      if (w.startsWith(token) || token.startsWith(w)) return true;
    }
    return text.includes(token);
  }

  // Known codes set for exact-code handling – if token is a known code, don't expand via MATERIAL etc.
  const knownCodesSet = new Set(FUNCTIONS.flatMap(t => [t.code, ...(t.aliases || [])]).map(c => c.toUpperCase()));

  const scored = FUNCTIONS.map(tc => {
    const aliasStr = (tc.aliases || []).join(' ').toUpperCase();
    const searchable = `${tc.code} ${aliasStr} ${tc.description} ${tc.classicName} ${tc.module} ${tc.subModule} ${tc.type} ${tc.route} ${tc.keywords || ''}`.toUpperCase();
    let expanded = searchable;
    if (tc.code.startsWith('ME21') || tc.code.startsWith('ME22') || tc.code.startsWith('ME23')) expanded += ' PO PURCHASE ORDER';
    if (tc.code.startsWith('ME51') || tc.code.startsWith('ME52') || tc.code.startsWith('ME53')) expanded += ' PR PURCHASE REQUISITION REQUISITION';
    if (tc.code === 'MIGO') expanded += ' GR GOODS RECEIPT GOODS MOVEMENT RECEIPT WE WA GI GOODS ISSUE';
    if (tc.code === 'MIRO') expanded += ' IV INVOICE VERIFICATION INVOICE RE';
    if (tc.code.startsWith('VA0')) expanded += ' SO SALES ORDER SALES';
    if (tc.code === 'VL01N') expanded += ' DELIVERY DO OUTBOUND DELIVERY';
    if (tc.code === 'VF01') expanded += ' BILLING BILL INVOICE';
    if (tc.code.startsWith('MM0')) expanded += ' MATERIAL MAT';
    if (tc.code.startsWith('CS0')) expanded += ' BOM BILL OF MATERIAL';
    if (tc.code.startsWith('CR0')) expanded += ' WORK CENTER WORKCENTER WC';
    if (tc.code.startsWith('CA0')) expanded += ' ROUTING';
    if (tc.code.startsWith('KS0') || tc.code === 'KSB1') expanded += ' COST CENTER CC';
    if (tc.code === 'FS00') expanded += ' GL G/L ACCOUNT';
    if (tc.code === 'CUNI') expanded += ' UOM UNIT UNITS MEASURE';
    if (tc.code === 'OMS2') expanded += ' MATERIAL TYPE ROH HALB FERT';
    if (tc.code === 'OY03') expanded += ' CURRENCY CURRENCIES';
    if (tc.code === 'FTXP') expanded += ' TAX VAT GST';
    if (tc.code === 'OBBO' || tc.code === 'OB52') expanded += ' POSTING PERIOD PERIOD';

    let totalScore = 0;
    let allTokensMatched = true;
    let exactCount = 0;
    let partialCount = 0;

    for (const token of tokens) {
      let tokenScore = 0;
      let isExact = false;
      let isPartial = false;
      const isKnownCodeToken = knownCodesSet.has(token);
      const mappedType = typeSynonyms[token];
      if (mappedType && !isKnownCodeToken) {
        if (tc.type === mappedType) { tokenScore += 10; isExact = true; }
        if (containsTokenExact(expanded, token)) { tokenScore += 5; isExact = true; }
        else if (containsTokenPartial(expanded, token)) { tokenScore += 3; isPartial = true; }
        if (token === 'CREATE' && tc.type === 'POSTING' && (containsTokenExact(expanded, 'GR') || containsTokenExact(expanded, 'IV') || expanded.includes('BILLING') || expanded.includes('PAYMENT'))) {
          tokenScore += 4; isExact = true;
        }
      } else {
        if (containsTokenExact(expanded, token)) {
          tokenScore += 10; isExact = true;
        } else if (containsTokenPartial(expanded, token)) {
          // For known code tokens, only allow partial if code itself contains token or vice versa, not generic partial
          if (isKnownCodeToken) {
            // Only match if tc.code contains token or token contains tc.code (e.g., MM01 matches MM01, MM0, etc)
            if (tc.code.toUpperCase().includes(token) || token.includes(tc.code.toUpperCase())) {
              tokenScore += 6; isPartial = true;
            }
          } else {
            tokenScore += 6; isPartial = true;
          }
        } else if (!isKnownCodeToken) {
          // Only use synonym expansion for non-code tokens – strict exact matching to avoid PO matching PR via shared PURCHASE word
          const canonicals = variantToCanonical[token];
          if (canonicals) {
            for (const can of canonicals) {
              const syns = docSynonyms[can] || [];
              for (const syn of syns) {
                // Only exact word/phrase match for synonyms – no partial that causes PO to match PR via PURCHASE
                if (containsTokenExact(expanded, syn)) {
                  tokenScore += 8; isExact = true; break;
                }
              }
              if (tokenScore > 0) break;
            }
          }
          if (tokenScore === 0 && token.length >= 3) {
            // Fuzzy for longer tokens: allow if synonym contains token as whole word and expanded contains synonym exactly
            for (const [can, syns] of Object.entries(docSynonyms)) {
              for (const syn of syns) {
                if (syn.length <= 2) continue;
                // Require synonym contains token as separate word or prefix, and expanded contains synonym exactly
                const synWords = syn.split(/[^A-Z0-9]+/);
                const tokenIsWordInSyn = synWords.includes(token) || synWords.some(w => w.startsWith(token) && w.length >= 3);
                if (tokenIsWordInSyn && containsTokenExact(expanded, syn)) {
                  tokenScore += 5; isExact = true; break;
                }
                // Also allow token contains syn as phrase prefix for partial like "pur ord" -> "purchase order"
                if (token.length >= 4 && syn.length >= 4) {
                  const tokenWords = token.split(/[^A-Z0-9]+/);
                  // Check if all token words are prefixes of syn words
                  if (tokenWords.length > 0 && tokenWords.every(tw => synWords.some(sw => sw.startsWith(tw)))) {
                    if (containsTokenExact(expanded, syn)) {
                      tokenScore += 3; isPartial = true; break;
                    }
                  }
                }
              }
              if (tokenScore > 0) break;
            }
          }
        }
      }
      if (tokenScore === 0) allTokensMatched = false;
      else {
        if (isExact) exactCount++;
        if (isPartial) partialCount++;
      }
      totalScore += tokenScore;
    }

    // Boost if all tokens exact
    if (allTokensMatched && exactCount === tokens.length) totalScore += 20;
    else if (allTokensMatched) totalScore += 5;

    return { tc, score: totalScore, allMatched: allTokensMatched, exactCount, partialCount };
  })
    .filter(item => item.score > 0 && item.allMatched && !exactMatches.some(em => em.code === item.tc.code))
    .sort((a, b) => {
      // exact matches first, then partial, then score
      if (b.exactCount !== a.exactCount) return b.exactCount - a.exactCount;
      if (a.partialCount !== b.partialCount) return a.partialCount - b.partialCount;
      return b.score - a.score;
    })
    .map(item => item.tc)
    .slice(0, 12 - exactMatches.length);

  const combined = [...exactMatches, ...scored];
  if (combined.length === 0) {
    // Fallback simple includes for longer queries – partial also allowed
    const fallback = FUNCTIONS.filter(t => {
      const hay = `${t.code} ${t.description} ${t.classicName} ${t.module} ${t.keywords || ''}`.toUpperCase();
      return tokens.every(tok => hay.includes(tok) || hay.split(/[^A-Z0-9]+/).some(w => w.includes(tok) || tok.includes(w)));
    }).slice(0, 10);
    return fallback;
  }

  return combined;
}
