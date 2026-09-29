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
  { code: 'MTC', aliases: ['MM01', 'FND-MAT-CR'], description: 'Create Material', route: '/1000/foundation/materials?mode=create', module: 'FOUNDATION', subModule: 'MM-MD', type: 'CREATE', classicName: 'Material Master Create', keywords: 'create material master product sku record, add warehouse item definitions catalogue mm-md' },
  { code: 'MTE', aliases: ['MM02', 'FND-MAT-CH'], description: 'Change Material', route: '/1000/foundation/materials?mode=change', module: 'FOUNDATION', subModule: 'MM-MD', type: 'CHANGE', classicName: 'Material Master Change', keywords: 'change material master product data specifications, update inventory item definitions' },
  { code: 'MTV', aliases: ['MM03', 'FND-MAT-DP'], description: 'Display Material', route: '/1000/foundation/materials?mode=display', module: 'FOUNDATION', subModule: 'MM-MD', type: 'DISPLAY', classicName: 'Material Master Display', keywords: 'display material master catalog record, view standard item structural properties data' },
  { code: 'STV', aliases: ['MMBE', 'INV-STK-DP'], description: 'Stock Overview', route: '/1000/foundation/stock', module: 'FOUNDATION', subModule: 'MM-IM', type: 'DISPLAY', classicName: 'Stock Overview', keywords: 'stock overview warehouse location quantities, immediate inventory balances review mm-im' },
  { code: 'MTL', aliases: ['MM60', 'FND-MAT-LS'], description: 'Material Overview', route: '/1000/foundation/materials?mode=list', module: 'FOUNDATION', subModule: 'MM-MD', type: 'REPORT', classicName: 'Materials Overview', keywords: 'material overview inventory catalogue list, global master stock directory file index mm-md' },

  { code: 'PRC', aliases: ['ME51N', 'PUR-PR-CR'], description: 'Create Purchase Requisition', route: '/1000/mm/pr?mode=create', module: 'MM', subModule: 'MM-PUR', type: 'CREATE', classicName: 'PR Create', keywords: 'create purchase requisition pr, raise internal material demand indent' },
  { code: 'PRE', aliases: ['ME52N', 'PUR-PR-CH'], description: 'Change PR', route: '/1000/mm/pr?mode=change', module: 'MM', subModule: 'MM-PUR', type: 'CHANGE', classicName: 'PR Change', keywords: 'change purchase requisition pr, modify internal department item request lines' },
  { code: 'PRV', aliases: ['ME53N', 'PUR-PR-DP'], description: 'Display PR', route: '/1000/mm/pr?mode=display', module: 'MM', subModule: 'MM-PUR', type: 'DISPLAY', classicName: 'PR Display', keywords: 'display purchase requisition pr, review department supply requests tracking status' },
  { code: 'POC', aliases: ['ME21N', 'PUR-PO-CR'], description: 'Create Purchase Order', route: '/1000/mm/po?mode=create', module: 'MM', subModule: 'MM-PUR', type: 'CREATE', classicName: 'PO Create', keywords: 'create purchase order po, raise vendor external procurement document' },
  { code: 'POE', aliases: ['ME22N', 'PUR-PO-CH'], description: 'Change PO', route: '/1000/mm/po?mode=change', module: 'MM', subModule: 'MM-PUR', type: 'CHANGE', classicName: 'PO Change', keywords: 'change purchase order po, edit vendor procurement sheet, adjust supplier contract lines' },
  { code: 'POV', aliases: ['ME23N', 'PUR-PO-DP'], description: 'Display PO', route: '/1000/mm/po?mode=display', module: 'MM', subModule: 'MM-PUR', type: 'DISPLAY', classicName: 'PO Display', keywords: 'display purchase order po, view supplier contract details, check raw material procurement' },

  { code: 'GRC', aliases: ['MIGO', 'INV-GR-PS'], description: 'Goods Receipt 101', route: '/1000/mm/gr?mode=101', module: 'MM', subModule: 'MM-IM', type: 'POSTING', classicName: 'GR 101', keywords: 'goods receipt 101 gr posting, warehouse inbound intake entry, log inbound delivery note we' },
  { code: 'IVC', aliases: ['MIRO', 'PUR-IV-PS'], description: 'Invoice Verification', route: '/1000/mm/iv?mode=create', module: 'MM', subModule: 'MM-IV', type: 'POSTING', classicName: 'IV MIRO', keywords: 'invoice verification logistics matching, vendor bill three way reconciliation audit' },
  { code: 'PIC', aliases: ['MI01', 'INV-PI-CR'], description: 'Create Physical Inventory Doc', route: '/1000/mm/physical-inventory?mode=create', module: 'MM', subModule: 'MM-PI', type: 'CREATE', classicName: 'PI Create', keywords: 'create physical inventory count document, warehouse stock audit worksheet sheet' },
  { code: 'PIE', aliases: ['MI04', 'INV-PI-CH'], description: 'Enter Count', route: '/1000/mm/physical-inventory?mode=count', module: 'MM', subModule: 'MM-PI', type: 'CHANGE', classicName: 'PI Enter Count', keywords: 'enter inventory count quantities, record physical stock verification values' },
  { code: 'PIP', aliases: ['MI07', 'INV-PI-PS'], description: 'Post Differences', route: '/1000/mm/physical-inventory?mode=post', module: 'MM', subModule: 'MM-PI', type: 'POSTING', classicName: 'PI Post Diff', keywords: 'post physical inventory discrepancy adjustments, reconcile stock variance shrinkage losses' },

  { code: 'MOC', aliases: ['CO01', 'MFG-ORD-CR'], description: 'Create Production Order', route: '/1000/pp/kitting?mode=create', module: 'PP', subModule: 'PP', type: 'CREATE', classicName: 'Prod Order Create', keywords: 'create production order, new manufacturing job, release assembly work order' },
  { code: 'KTC', aliases: ['KITTING', 'MFG-KIT-PS'], description: 'Kitting - Stocked K01/K02', route: '/1000/pp/kitting', module: 'PP', subModule: 'PP-KIT', type: 'POSTING', classicName: 'Kitting Stocked', keywords: 'kitting stock assembly, k01 k02 raw component bundling, material pre-packaging issues' },

  { code: 'SOC', aliases: ['VA01', 'SAL-SO-CR'], description: 'Create Sales Order', route: '/1000/sales?mode=create', module: 'SD', subModule: 'SD', type: 'CREATE', classicName: 'Sales Order Create', keywords: 'create sales order book customer pipeline commitment, register client product contract' },
  { code: 'SOE', aliases: ['VA02', 'SAL-SO-CH'], description: 'Change Sales Order', route: '/1000/sales?mode=change', module: 'SD', subModule: 'SD', type: 'CHANGE', classicName: 'Sales Change', keywords: 'change sales order adjustment, edit customer shipment conditions, modify order items lines' },
  { code: 'SOV', aliases: ['VA03', 'SAL-SO-DP'], description: 'Display Sales Order', route: '/1000/sales?mode=display', module: 'SD', subModule: 'SD', type: 'DISPLAY', classicName: 'Sales Display', keywords: 'display sales order registry tracking, look up client demand execution pipeline' },

  { code: 'HEC', aliases: ['PA30', 'HRM-EMP-CH'], description: 'Maintain HR Master', route: '/1000/hr/payroll?mode=maintain', module: 'HR', subModule: 'HR-PA', type: 'CHANGE', classicName: 'HR Master', keywords: 'maintain employee profiles records data details files payroll update modifications' },
  { code: 'HEV', aliases: ['PA20', 'HRM-EMP-DP'], description: 'Display HR Master Data', route: '/1000/hr/payroll?mode=display', module: 'HR', subModule: 'HR-PA', type: 'DISPLAY', classicName: 'HR Display', keywords: 'display employee identity profile master ledger data files payroll hr-pa' },
  { code: 'PYC', aliases: ['PC00', 'HRM-PAY-PS'], description: 'Payroll Run', route: '/1000/hr/payroll?mode=run', module: 'HR', subModule: 'HR-PY', type: 'POSTING', classicName: 'Payroll Run', keywords: 'execute employee compensation payroll run processing, monthly wages disbursements slip posting' },

  { code: 'CUL', aliases: ['KSB1', 'CST-CU-LS'], description: 'Cost Center Actual Line Items', route: '/1000/fico/cca-report', module: 'FICO', subModule: 'CO-CCA', type: 'REPORT', classicName: 'CCA Actuals', keywords: 'cost center actual expenditure line items ledger tracking overview statement reports' },
  { code: 'CRP', aliases: ['CK40N', 'CST-COST-PS'], description: 'Costing Run', route: '/1000/fico/costing-run?mode=run', module: 'FICO', subModule: 'CO-PC', type: 'POSTING', classicName: 'Costing Run', keywords: 'product costing run evaluations, manufacturing cost estimate evaluations rollups co-pc' },

  // --- Enterprise Structure – New Intuitive System FND-* – old OX* kept as aliases ---
  { code: 'CGA', aliases: ['OX16', 'FND-CG-LE-AS'], description: 'Assign Company Group to Legal Entity', route: '/1000/foundation/enterprise-structure?tab=company', module: 'FOUNDATION', subModule: 'ENT-ASSIGN', type: 'CHANGE', classicName: 'Assign Company Group to Legal Entity', keywords: 'assign company group legal framework subsidiary to root parent corporation entity matrix map' },
  { code: 'FLA', aliases: ['OX18', 'FND-FAC-LE-AS'], description: 'Assign Facility to Legal Entity', route: '/1000/foundation/enterprise-structure?tab=facility', module: 'FOUNDATION', subModule: 'ENT-ASSIGN', type: 'CHANGE', classicName: 'Assign Facility to Legal Entity', keywords: 'assign facility production operations site infrastructure to primary legal entity map' },
  { code: 'CSA', aliases: ['OVX5', 'FND-CO-SC-PL-AS'], description: 'Define Commercial Structure Assignment', route: '/1000/foundation/enterprise-structure?tab=commercial', module: 'FOUNDATION', subModule: 'ENT-SORG', type: 'CREATE', classicName: 'Commercial Structure Assignment', keywords: 'define commercial organization channel product line assignment structures' },

  // --- Module 1 Legal-Safe Org Structure – New Intuitive Primary, old kept as alias ---
  { code: 'CAC', aliases: ['OX06', 'FND-CA-CR'], description: 'Define Management Control Area', route: '/1000/foundation/enterprise-structure?tab=control-area', module: 'FOUNDATION', subModule: 'ENT-CTRL', type: 'CREATE', classicName: 'Control Area OX06', keywords: 'define management control area cost controlling boundary, enterprise controlling structure setup ent-ctrl' },
  { code: 'CGC', aliases: ['ORG-CG-01', 'OX15', 'FND-CG-CR'], description: 'Define Company Group', route: '/1000/foundation/enterprise-structure?tab=company-group', module: 'FOUNDATION', subModule: 'ENT-COMP', type: 'CREATE', classicName: 'Company Group Define', keywords: 'define company group enterprise holding umbrella corporation group structure org-cg' },
  { code: 'LEC', aliases: ['ORG-LE-01', 'OX02', 'FND-LE-CR'], description: 'Define Legal Entity', route: '/1000/foundation/enterprise-structure?tab=legal-entity', module: 'FOUNDATION', subModule: 'ENT-LE', type: 'CREATE', classicName: 'Legal Entity OX02', keywords: 'define legal entity statutory company code master legal corporate identity entity node structure org-le' },
  { code: 'FCC', aliases: ['ORG-FAC-01', 'OX10', 'FND-FAC-CR'], description: 'Define Facility', route: '/1000/foundation/enterprise-structure?tab=facility', module: 'FOUNDATION', subModule: 'ENT-FAC', type: 'CREATE', classicName: 'Facility OX10', keywords: 'define facility operational site manufacturing plant distribution fulfillment physical hub structure org-fac' },
  { code: 'ILC', aliases: ['ORG-IL-01', 'OX09', 'FND-IL-CR'], description: 'Define Inventory Location', route: '/1000/foundation/enterprise-structure?tab=inventory-location', module: 'FOUNDATION', subModule: 'ENT-IL', type: 'CREATE', classicName: 'Inventory Location OX09', keywords: 'define inventory location storage zone bins racks inventory zones configuration org-il' },
  { code: 'PDC', aliases: ['ORG-PD-01', 'OX08', 'FND-PD-CR'], description: 'Define Procurement Division', route: '/1000/foundation/enterprise-structure?tab=procurement', module: 'FOUNDATION', subModule: 'ENT-PD', type: 'CREATE', classicName: 'Procurement Division OX08', keywords: 'define procurement division purchasing organization commercial vendor negotiation team unit setup org-pd' },
  { code: 'BTC', aliases: ['ORG-BT-01', 'OME4', 'FND-BT-CR'], description: 'Define Buyer Team', route: '/1000/foundation/enterprise-structure?tab=procurement', module: 'FOUNDATION', subModule: 'ENT-BT', type: 'CREATE', classicName: 'Buyer Team OME4', keywords: 'define buyer team procurement group buyer profile contact assignment team codes org-bt' },
  { code: 'COC', aliases: ['ORG-CO-01', 'OVX2', 'FND-CO-CR'], description: 'Define Commercial Organization', route: '/1000/foundation/enterprise-structure?tab=commercial', module: 'FOUNDATION', subModule: 'ENT-CO', type: 'CREATE', classicName: 'Commercial Org OVX2', keywords: 'define commercial organization sales organization corporate division entity commercial trade legal setup org-co' },
  { code: 'SCC', aliases: ['ORG-SC-01', 'OVX1', 'FND-SC-CR'], description: 'Define Sales Channel', route: '/1000/foundation/enterprise-structure?tab=commercial', module: 'FOUNDATION', subModule: 'ENT-SC', type: 'CREATE', classicName: 'Sales Channel OVX1', keywords: 'define sales channel distribution channel direct wholesale retail marketing pipelines layout org-sc' },
  { code: 'PLC', aliases: ['ORG-PL-01', 'OVX5', 'FND-PL-CR'], description: 'Define Product Line', route: '/1000/foundation/enterprise-structure?tab=commercial', module: 'FOUNDATION', subModule: 'ENT-PL', type: 'CREATE', classicName: 'Product Line Division', keywords: 'define product line division commercial product division line category hierarchy org-pl' },
  { code: 'PUC', aliases: ['ORG-PU-01', 'KE51', 'FND-PU-CR'], description: 'Define Profit Unit', route: '/1000/foundation/enterprise-structure?tab=profit', module: 'FOUNDATION', subModule: 'ENT-PU', type: 'CREATE', classicName: 'Profit Unit KE51', keywords: 'define profit unit profitability center enterprise profit tracking unit reporting org-pu' },
  { code: 'CUC', aliases: ['ORG-CU-01', 'KS01', 'FND-CU-CR'], description: 'Define Cost Unit', route: '/1000/foundation/enterprise-structure?tab=cost', module: 'FOUNDATION', subModule: 'ENT-CU', type: 'CREATE', classicName: 'Cost Unit KS01', keywords: 'define cost unit cost center operational department allocation node management profiles org-cu' },
  { code: 'BSC', aliases: ['ORG-BS-01', 'FND-BS-CR'], description: 'Define Business Segment', route: '/1000/foundation/enterprise-structure?tab=segment', module: 'FOUNDATION', subModule: 'ENT-BS', type: 'CREATE', classicName: 'Business Segment', keywords: 'define business segment reporting segment enterprise business area segment structure org-bs' },
  { code: 'WHC', aliases: ['ORG-WH-01', 'FND-WH-CR'], description: 'Define Warehouse Site', route: '/1000/foundation/enterprise-structure?tab=warehouse', module: 'FOUNDATION', subModule: 'ENT-WH', type: 'CREATE', classicName: 'Warehouse Site', keywords: 'define warehouse site warehouse number storage facility warehouse zone bin location org-wh' },
  { code: 'DPC', aliases: ['ORG-DP-01', 'FND-DP-CR'], description: 'Define Dispatch Point', route: '/1000/foundation/enterprise-structure?tab=dispatch', module: 'FOUNDATION', subModule: 'ENT-DP', type: 'CREATE', classicName: 'Dispatch Point Shipping', keywords: 'define dispatch point shipping point shipment origin loading group route logistics org-dp' },

  // --- Financial Config OB45/OB38/OB29/OB37/OBBO/OB52/OBBP ---
  { code: 'CPC', aliases: ['OB45', 'FIN-CP-CR'], description: 'Define Credit Control Area', route: '/1000/fico/company-master', module: 'FICO', subModule: 'FI-COMP', type: 'CREATE', classicName: 'Credit Control Area', keywords: 'define commercial customer credit control boundary risk management area rules setup fi-comp' },
  { code: 'LCA', aliases: ['OB38', 'FIN-LE-CP-AS'], description: 'Assign Company Code to Credit Control Area', route: '/1000/fico/company-master', module: 'FICO', subModule: 'FI-COMP', type: 'CHANGE', classicName: 'Assign CC->CCA', keywords: 'assign active legal company code transaction entity mapping to global risk management credit control' },
  { code: 'FYC', aliases: ['OB29', 'FIN-FC-CR'], description: 'Define Fiscal Year Variant K4', route: '/1000/fico/company-master', module: 'FICO', subModule: 'FI-FYV', type: 'CREATE', classicName: 'Fiscal Year Variant', keywords: 'define corporate fiscal year accounting variant periods timeline k4 calendar rules setup fi-fyv' },
  { code: 'LFA', aliases: ['OB37', 'FIN-LE-FC-AS'], description: 'Assign Fiscal Year Variant to Company Code', route: '/1000/fico/company-master', module: 'FICO', subModule: 'FI-FYV', type: 'CHANGE', classicName: 'Assign FYV->CC', keywords: 'assign fiscal accounting year periods setup layout matrix mappings directly to company code' },
  { code: 'LPA', aliases: ['OBBP', 'FIN-LE-PC-AS'], description: 'Assign Posting Period Variant to Company Code', route: '/1000/fico/company-master', module: 'FICO', subModule: 'FI-PPV', type: 'CHANGE', classicName: 'Assign PPV->CC', keywords: 'assign localized operational financial posting period variant settings block to specific company codes' },

  // --- Chart of Accounts OB13/OB62/OBD4/OB53/OBA7/FBN1/FS00 ---
  { code: 'COA', aliases: ['OB13', 'FIN-COA-CR'], description: 'Define Chart of Accounts KSCA', route: '/1000/fico/chart-of-accounts', module: 'FICO', subModule: 'FI-COA', type: 'CREATE', classicName: 'Chart of Accounts', keywords: 'define chart of accounts operational ksca financial balance sheet structures map fi-coa' },
  { code: 'LCA2', aliases: ['OB62', 'FIN-LE-COA-AS'], description: 'Assign Company Code to Chart of Accounts', route: '/1000/fico/chart-of-accounts', module: 'FICO', subModule: 'FI-COA', type: 'CHANGE', classicName: 'Assign CC->CoA', keywords: 'assign operational corporate company code asset entities mapping to universal chart of accounts' },
  { code: 'AGC', aliases: ['OBD4', 'FIN-AG-CR'], description: 'Define Account Groups KASS/KLIA/KREV etc', route: '/1000/fico/chart-of-accounts', module: 'FICO', subModule: 'FI-COA', type: 'CREATE', classicName: 'Account Groups', keywords: 'define accounting general ledger group categories ranges classification codes kass klia krev' },
  { code: 'REC', aliases: ['OB53', 'FIN-RE-CR'], description: 'Define Retained Earnings Account 2500000001', route: '/1000/fico/chart-of-accounts', module: 'FICO', subModule: 'FI-COA', type: 'CREATE', classicName: 'Retained Earnings', keywords: 'define retained earnings surplus capital ledger roll over clearing account setups fi-coa' },
  { code: 'DTC', aliases: ['OBA7', 'FIN-DT-CR'], description: 'Define Document Types KR/KG/KZ/RE/WE/WA/SA', route: '/1000/fico/chart-of-accounts', module: 'FICO', subModule: 'FI-DOC', type: 'CREATE', classicName: 'Document Types', keywords: 'define ledger transaction document types mapping classification rules journal vouchers kr kg kz re we wa sa' },
  { code: 'NRC', aliases: ['FBN1', 'FIN-NR-CR'], description: 'Define Number Ranges 50-54 5000000000-5499999999', route: '/1000/fico/chart-of-accounts', module: 'FICO', subModule: 'FI-NR', type: 'CREATE', classicName: 'Number Ranges', keywords: 'define transaction document sequence number ranges counter increments configuration fi-nr' },
  { code: 'GLC', aliases: ['FS00', 'FIN-GL-CR'], description: 'Create G/L Account Master 5000000001-5000000006', route: '/1000/fico/gl-accounts', module: 'FICO', subModule: 'FI-GL', type: 'CREATE', classicName: 'G/L Account Create', keywords: 'create general ledger gl account master setup chart entries definitions directory fi-gl' },
  { code: 'GCA', aliases: ['FS01', 'FIN-GL-COA-CR'], description: 'Create G/L Account in Chart', route: '/1000/fico/gl-accounts', module: 'FICO', subModule: 'FI-GL', type: 'CREATE', classicName: 'G/L Chart Create', keywords: 'create financial general ledger chart accounts matrix framework asset liability setup' },
  { code: 'GLE', aliases: ['FS02', 'FIN-GL-CH'], description: 'Change G/L Account', route: '/1000/fico/gl-accounts', module: 'FICO', subModule: 'FI-GL', type: 'CHANGE', classicName: 'G/L Account Change', keywords: 'change general ledger asset account fields structure definitions parameters edits' },
  { code: 'GLV', aliases: ['FS03', 'FIN-GL-DP'], description: 'Display G/L Account', route: '/1000/fico/gl-accounts', module: 'FICO', subModule: 'FI-GL', type: 'DISPLAY', classicName: 'G/L Account Display', keywords: 'display operational general ledger account definitions metrics profile view summary' },
  { code: 'GCV', aliases: ['FSP0', 'FIN-GL-COA-DP'], description: 'G/L Account in Chart of Accounts', route: '/1000/fico/chart-of-accounts', module: 'FICO', subModule: 'FI-GL', type: 'DISPLAY', classicName: 'G/L in Chart', keywords: 'local general ledger account parameters mapping within corporate unified chart structures' },
  { code: 'AUC', aliases: ['OBYC', 'FIN-AUTO-CR'], description: 'Auto Account Determination BSX/WRX/PRD/GBB/BSV', route: '/1000/fico/gl-accounts', module: 'FICO', subModule: 'FI-AUTO', type: 'CREATE', classicName: 'Auto Determination', keywords: 'automatic inventory gl account determination layout matrix setups rule clearing bsx wrx prd gbb bsv fi-auto' },

  // --- PP - BOM, Work Centers, Routings, MRP, STO ---
  { code: 'BMC', aliases: ['CS01', 'MFG-BOM-CR'], description: 'Create BOM - Bills of Material', route: '/1000/pp/bom', module: 'PP', subModule: 'PP-BOM', type: 'CREATE', classicName: 'BOM Create CS01', keywords: 'create bill of materials bom, product structure design components, engineering recipe list' },
  { code: 'BME', aliases: ['CS02', 'MFG-BOM-CH'], description: 'Change BOM', route: '/1000/pp/bom', module: 'PP', subModule: 'PP-BOM', type: 'CHANGE', classicName: 'BOM Change CS02', keywords: 'change bill of materials bom, edit product structure parts, update engineering recipe' },
  { code: 'BMV', aliases: ['CS03', 'MFG-BOM-DP'], description: 'Display BOM', route: '/1000/pp/bom', module: 'PP', subModule: 'PP-BOM', type: 'DISPLAY', classicName: 'BOM Display CS03', keywords: 'display bill of materials bom, view product assembly structure tree, look up parts recipe' },
  { code: 'WCC', aliases: ['CR01', 'MFG-WC-CR'], description: 'Create Work Center - Machine/Labor Capacity', route: '/1000/pp/work-centers', module: 'PP', subModule: 'PP-WC', type: 'CREATE', classicName: 'Work Center CR01', keywords: 'create work center machine labor capacity, new assembly line plant floor resource' },
  { code: 'WCE', aliases: ['CR02', 'MFG-WC-CH'], description: 'Change Work Center', route: '/1000/pp/work-centers', module: 'PP', subModule: 'PP-WC', type: 'CHANGE', classicName: 'Work Center CR02', keywords: 'change work center machine labor capacity, update factory floor resource station' },
  { code: 'WCV', aliases: ['CR03', 'MFG-WC-DP'], description: 'Display Work Center', route: '/1000/pp/work-centers', module: 'PP', subModule: 'PP-WC', type: 'DISPLAY', classicName: 'Work Center CR03', keywords: 'display work center machine labor capacity, view production environment line resource' },
  { code: 'RTC', aliases: ['CA01', 'MFG-RTG-CR'], description: 'Create Routing - Sequence of Manufacturing Steps', route: '/1000/pp/routings', module: 'PP', subModule: 'PP-RTG', type: 'CREATE', classicName: 'Routing CA01', keywords: 'create routing manufacturing steps, production operations sequence, process plan template' },
  { code: 'RTE', aliases: ['CA02', 'MFG-RTG-CH'], description: 'Change Routing', route: '/1000/pp/routings', module: 'PP', subModule: 'PP-RTG', type: 'CHANGE', classicName: 'Routing CA02', keywords: 'change routing manufacturing steps, update production operations, edit process plan' },
  { code: 'RTV', aliases: ['CA03', 'MFG-RTG-DP'], description: 'Display Routing', route: '/1000/pp/routings', module: 'PP', subModule: 'PP-RTG', type: 'DISPLAY', classicName: 'Routing CA03', keywords: 'display routing manufacturing steps, view production operations, look up process plan' },
  { code: 'MRP', aliases: ['MD01', 'MFG-MRP-PS'], description: 'MRP Run - Material Requirements Planning', route: '/1000/pp/mrp', module: 'PP', subModule: 'PP-MRP', type: 'POSTING', classicName: 'MRP Run MD01', keywords: 'mrp run material requirements planning, demand forecasting engine, net requirements calculation' },
  { code: 'MRV', aliases: ['MD04', 'MFG-MRP-DP'], description: 'Stock/Requirements List - MRP Stock', route: '/1000/pp/mrp', module: 'PP', subModule: 'PP-MRP', type: 'DISPLAY', classicName: 'Stock Req List MD04', keywords: 'stock requirements list, mrp dynamic availability view, material supply demand balance sheet' },
  { code: 'STC', aliases: ['ME27', 'PUR-STO-CR'], description: 'Create Stock Transport Order STO', route: '/1000/mm/sto', module: 'MM', subModule: 'MM-STO', type: 'CREATE', classicName: 'STO Create ME27', keywords: 'create stock transport order sto, inter company site inventory transfer request' },
  { code: 'STD', aliases: ['VL10B', 'PUR-STO-DL-PS'], description: 'Process STO Delivery', route: '/1000/mm/sto', module: 'MM', subModule: 'MM-STO', type: 'POSTING', classicName: 'STO Delivery VL10B', keywords: 'process stock transport delivery fulfillment, execute cross plant warehouse transfer orders' },
  { code: 'DLC', aliases: ['VL01N', 'SAL-DL-CR'], description: 'Create Outbound Delivery - B2B Wholesale', route: '/1000/sd/delivery', module: 'SD', subModule: 'SD-DL', type: 'CREATE', classicName: 'Delivery VL01N', keywords: 'create outbound shipping delivery document, logistics b2b wholesale packing warehouse shipment' },
  { code: 'BLC', aliases: ['VF01', 'SAL-BL-PS'], description: 'Create Billing Document - B2B AR', route: '/1000/sd/billing', module: 'SD', subModule: 'SD-BIL', type: 'POSTING', classicName: 'Billing VF01', keywords: 'create billing document commercial invoice, run customer accounting accounts receivable b2b ar' },

  // --- Cost Centers & Tax & Payment ---
  { code: 'CUC2', aliases: ['KS01', 'CST-CU-CR', 'CUC'], description: 'Create Cost Center KS-CC-01..05', route: '/1000/fico/cost-centers', module: 'FICO', subModule: 'CO-CCA', type: 'CREATE', classicName: 'Cost Center Create', keywords: 'create cost center operational department allocation node management profiles co-cca' },
  { code: 'CUE', aliases: ['KS02', 'CST-CU-CH'], description: 'Change Cost Center', route: '/1000/fico/cost-centers', module: 'FICO', subModule: 'CO-CCA', type: 'CHANGE', classicName: 'Cost Center Change KS02', keywords: 'change operational cost center parameters reporting allocations fields updates tracking' },
  { code: 'CUV', aliases: ['KS03', 'CST-CU-DP'], description: 'Display Cost Center', route: '/1000/fico/cost-centers', module: 'FICO', subModule: 'CO-CCA', type: 'DISPLAY', classicName: 'Cost Center Display KS03', keywords: 'display department cost center ownership information boundaries evaluation tracking' },
  { code: 'CYC', aliases: ['OY03', 'FIN-CUR-CR'], description: 'Define Currencies - Only INR default, OY03', route: '/1000/fico/currencies', module: 'FICO', subModule: 'FI-CUR', type: 'CREATE', classicName: 'Currencies OY03', keywords: 'define active monetary units transaction exchange currency lists baseline standard tracking inr default' },
  { code: 'MTP', aliases: ['OMS2', 'FND-MT-CR'], description: 'Define Material Types', route: '/1000/foundation/material-types', module: 'FOUNDATION', subModule: 'MM-CFG', type: 'CREATE', classicName: 'Material Types', keywords: 'define material types behavior configurations, raw materials semi finished packaging attributes' },
  { code: 'MGC', aliases: ['OMSF', 'FND-MG-CR'], description: 'Define Material Groups', route: '/1000/foundation/material-types', module: 'FOUNDATION', subModule: 'MM-CFG', type: 'CREATE', classicName: 'Material Groups', keywords: 'define material groupings classification hierarchy, food spice oil pack packaging structure' },
  { code: 'UOC', aliases: ['CUNI', 'FND-UOM-CR'], description: 'Define Units of Measure - CUNI', route: '/1000/foundation/uom', module: 'FOUNDATION', subModule: 'MM-CFG', type: 'CREATE', classicName: 'UoM CUNI', keywords: 'define global units of measure uom weight dimension metric conversion factors mm-cfg' },
  { code: 'TXC', aliases: ['FTXP', 'FIN-TX-CR'], description: 'Define Tax Codes GST0/5/12/18/28 IGST - VAT 5% included', route: '/1000/fico/tax-codes', module: 'FICO', subModule: 'FI-TAX', type: 'CREATE', classicName: 'Tax Codes FTXP', keywords: 'define calculation tax codes rates percentage setups gst0 gst5 gst12 gst18 gst28 igst vat fi-tax' },
  { code: 'TGC', aliases: ['OB40', 'FIN-TX-GL-CR'], description: 'Tax GL Accounts', route: '/1000/fico/tax-codes', module: 'FICO', subModule: 'FI-TAX', type: 'CREATE', classicName: 'Tax GL OB40', keywords: 'tax general ledger automatic accounts assignment matrix posting clearing accounts rules setup' },
  { code: 'PPC', aliases: ['OBBO', 'FIN-PC-CR'], description: 'Posting Period Variant OBBO', route: '/1000/fico/posting-period', module: 'FICO', subModule: 'FI-PER', type: 'CREATE', classicName: 'PP Variant OBBO', keywords: 'define accounting posting period variant structure groupings ledger framework templates fi-per' },
  { code: 'PPE', aliases: ['OB52', 'FIN-PC-PS'], description: 'Open Close Posting Periods OB52', route: '/1000/fico/posting-period', module: 'FICO', subModule: 'FI-PER', type: 'CHANGE', classicName: 'Posting Periods OB52', keywords: 'open close ledger posting period horizons monthly manual calendar lockout tracking fi-per' },
  { code: 'PYP', aliases: ['F-53', 'FIN-AP-PAY-PS'], description: 'Vendor Payment KZ 53* 5300000000-', route: '/1000/fico/payment', module: 'FICO', subModule: 'FI-AP', type: 'POSTING', classicName: 'Vendor Payment F-53', keywords: 'vendor manual cash payment clearing post, outgoing settlement generation accounting kz fi-ap' },
  { code: 'PYA', aliases: ['F110', 'FIN-AP-AUTO-PS'], description: 'Automatic Payment Program', route: '/1000/fico/payment', module: 'FICO', subModule: 'FI-AP', type: 'POSTING', classicName: 'Auto Payment F110', keywords: 'automatic payment batch settlement run, automated accounts payable processing wire ledger' },
  { code: 'PYT', aliases: ['KZ', 'FIN-AP-DT-PS'], description: 'Payment Document Type KZ 53*', route: '/1000/fico/payment', module: 'FICO', subModule: 'FI-AP', type: 'POSTING', classicName: 'Payment KZ', keywords: 'accounts payable vendor payment document ledger journal entries voucher allocations types kz' },

  { code: 'WFL', aliases: ['SBWP', 'FND-WF-LS'], description: 'Workflow Inbox - Approvals', route: '/1000/workflow/inbox', module: 'FOUNDATION', subModule: 'WF', type: 'REPORT', classicName: 'Workflow Inbox', keywords: 'workflow inbox approvals, task list, manager approval center, pending sign off requests' },
  { code: 'PRL', aliases: ['ME54N', 'PUR-PR-RL'], description: 'Release PR', route: '/1000/workflow/inbox?docType=PR', module: 'MM', subModule: 'MM-PUR', type: 'POSTING', classicName: 'Release PR', keywords: 'release purchase requisition approval, authorize internal material requests tracker' },
  { code: 'POR', aliases: ['ME28', 'PUR-PO-RL'], description: 'Release PO', route: '/1000/workflow/inbox?docType=PO', module: 'MM', subModule: 'MM-PUR', type: 'POSTING', classicName: 'Release PO', keywords: 'release purchase order approval, authorize pending vendor procurement, sign off po' },
  { code: 'FLW', aliases: ['ALB', 'AUD-FLOW-DP'], description: 'Document Flow', route: '/1000/audit/document-flow', module: 'AUDIT', subModule: 'AUDIT-FLOW', type: 'DISPLAY', classicName: 'Document Flow', keywords: 'document flow tracking, audit trail history, transaction links, business object sequence' },
  { code: 'ALG', aliases: ['SM20', 'AUD-LOG-LS'], description: 'Audit Log', route: '/1000/audit/logs', module: 'AUDIT', subModule: 'AUDIT-LOG', type: 'REPORT', classicName: 'Audit Log', keywords: 'system audit log, security events, user activity tracking, electronic records tracking' },

  // --- Admin / Security ---
  { code: 'USC', aliases: ['SU01', 'FND-USR-CR'], description: 'User Maintenance', route: '/1000/admin/users', module: 'FOUNDATION', subModule: 'ADMIN', type: 'CREATE', classicName: 'User SU01', keywords: 'administrative user maintenance account profiles tracking reset credentials authorization access rules' },
  { code: 'ROC', aliases: ['PFCG', 'FND-ROL-CR'], description: 'Role Maintenance', route: '/1000/admin/roles', module: 'FOUNDATION', subModule: 'ADMIN', type: 'CREATE', classicName: 'Role PFCG', keywords: 'role maintenance profile governance security tracking matrix setup access permission paths' },
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
