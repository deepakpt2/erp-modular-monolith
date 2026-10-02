/**
 * Function Classification - ERP structure
 * Maps functions to routes, with module classification
 * Function is the destination (e.g., Create Purchase Order), code is just helper to identify function (e.g., PPOC (legacy ME21N) is helper for Create Purchase Order – own IP with SAP alias)
 * Searching PPOC (legacy ME21N) redirects – own IP with SAP alias – to background function Create Purchase Order – ME21N is not target, function is target
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
  { code: 'EMTE', aliases: ['MM02', 'FND-MAT-CH', 'MTE'], description: 'Change Product – Legal-safe (was Change Material MM02) – prod_item', route: '/1000/foundation/materials/change', module: 'FOUNDATION', subModule: 'MM-MD', type: 'CHANGE', classicName: 'Material Master Change', keywords: 'change material master product data specifications, update inventory item definitions prod_item EMTE' },
  { code: 'EMTV', aliases: ['MM03', 'FND-MAT-DP', 'MTV'], description: 'Display Product – Legal-safe (was Display Material MM03)', route: '/1000/foundation/materials/display', module: 'FOUNDATION', subModule: 'MM-MD', type: 'DISPLAY', classicName: 'Material Master Display', keywords: 'display material master catalog record, view standard item structural properties data prod_item EMTV' },
  { code: 'ISTV', aliases: ['MMBE', 'INV-STK-DP', 'STV'], description: 'Stock Overview', route: '/1000/foundation/stock', module: 'FOUNDATION', subModule: 'MM-IM', type: 'DISPLAY', classicName: 'Stock Overview', keywords: 'stock overview warehouse location quantities, immediate inventory balances review mm-im' },
  { code: 'EMTL', aliases: ['MM60', 'FND-MAT-LS', 'MTL'], description: 'Product Overview List – Legal-safe (was Material Overview MM60) – prod_item list', route: '/1000/foundation/materials/list', module: 'FOUNDATION', subModule: 'MM-MD', type: 'REPORT', classicName: 'Materials Overview', keywords: 'material overview inventory catalogue list, global master stock directory file index mm-md prod_item EMTL alias MM60' },

  { code: 'PPRC', aliases: ['ME51N', 'PUR-PR-CR', 'PRC'], description: 'Create Purchase Requisition', route: '/1000/mm/pr?mode=create', module: 'MM', subModule: 'MM-PUR', type: 'CREATE', classicName: 'PR Create', keywords: 'create purchase requisition pr, raise internal material demand indent' },
  { code: 'PPRE', aliases: ['ME52N', 'PUR-PR-CH', 'PRE'], description: 'Change PR', route: '/1000/mm/pr/change', module: 'MM', subModule: 'MM-PUR', type: 'CHANGE', classicName: 'PR Change', keywords: 'change purchase requisition pr, modify internal department item request lines' },
  { code: 'PPRV', aliases: ['ME53N', 'PUR-PR-DP', 'PRV'], description: 'Display PR', route: '/1000/mm/pr/display', module: 'MM', subModule: 'MM-PUR', type: 'DISPLAY', classicName: 'PR Display', keywords: 'display purchase requisition pr, review department supply requests tracking status' },
  { code: 'PPOC', aliases: ['ME21N', 'PUR-PO-CR', 'POC'], description: 'Create Purchase Order', route: '/1000/mm/po?mode=create', module: 'MM', subModule: 'MM-PUR', type: 'CREATE', classicName: 'PO Create', keywords: 'create purchase order po, raise vendor external procurement document' },
  { code: 'PPOE', aliases: ['ME22N', 'PUR-PO-CH', 'POE'], description: 'Change PO', route: '/1000/mm/po/change', module: 'MM', subModule: 'MM-PUR', type: 'CHANGE', classicName: 'PO Change', keywords: 'change purchase order po, edit vendor procurement sheet, adjust supplier contract lines' },
  { code: 'PPOV', aliases: ['ME23N', 'PUR-PO-DP', 'POV'], description: 'Display PO', route: '/1000/mm/po/display', module: 'MM', subModule: 'MM-PUR', type: 'DISPLAY', classicName: 'PO Display', keywords: 'display purchase order po, view supplier contract details, check raw material procurement' },

  { code: 'IGRC', aliases: ['MIGO', 'INV-GR-PS', 'GRC'], description: 'Goods Receipt 101', route: '/1000/mm/gr?mode=101', module: 'MM', subModule: 'MM-IM', type: 'POSTING', classicName: 'GR 101', keywords: 'goods receipt 101 gr posting, warehouse inbound intake entry, log inbound delivery note we' },
  { code: 'PIVC', aliases: ['MIRO', 'PUR-IV-PS', 'IVC'], description: 'Invoice Verification', route: '/1000/mm/iv?mode=create', module: 'MM', subModule: 'MM-IV', type: 'POSTING', classicName: 'IV MIRO', keywords: 'invoice verification logistics matching, vendor bill three way reconciliation audit' },
  { code: 'IPIC', aliases: ['MI01', 'INV-PI-CR', 'PIC'], description: 'Create Physical Inventory Doc', route: '/1000/mm/physical-inventory?mode=create', module: 'MM', subModule: 'MM-PI', type: 'CREATE', classicName: 'PI Create', keywords: 'create physical inventory count document, warehouse stock audit worksheet sheet' },
  { code: 'IPIE', aliases: ['MI04', 'INV-PI-CH', 'PIE'], description: 'Enter Count', route: '/1000/mm/physical-inventory?mode=count', module: 'MM', subModule: 'MM-PI', type: 'CHANGE', classicName: 'PI Enter Count', keywords: 'enter inventory count quantities, record physical stock verification values' },
  { code: 'IPIP', aliases: ['MI07', 'INV-PI-PS', 'PIP'], description: 'Post Differences', route: '/1000/mm/physical-inventory?mode=post', module: 'MM', subModule: 'MM-PI', type: 'POSTING', classicName: 'PI Post Diff', keywords: 'post physical inventory discrepancy adjustments, reconcile stock variance shrinkage losses' },

  { code: 'MMOC', aliases: ['CO01', 'MFG-ORD-CR', 'MOC'], description: 'Create Production Order', route: '/1000/pp/kitting?mode=create', module: 'PP', subModule: 'PP', type: 'CREATE', classicName: 'Prod Order Create', keywords: 'create production order, new manufacturing job, release assembly work order' },
  { code: 'MKTC', aliases: ['KITTING', 'MFG-KIT-PS', 'KTC'], description: 'Kitting - Stocked K01/K02', route: '/1000/pp/kitting', module: 'PP', subModule: 'PP-KIT', type: 'POSTING', classicName: 'Kitting Stocked', keywords: 'kitting stock assembly, k01 k02 raw component bundling, material pre-packaging issues' },

  { code: 'SSOC', aliases: ['VA01', 'SAL-SO-CR', 'SOC'], description: 'Create Sales Order', route: '/1000/sales?mode=create', module: 'SD', subModule: 'SD', type: 'CREATE', classicName: 'Sales Order Create', keywords: 'create sales order book customer pipeline commitment, register client product contract' },
  { code: 'SSOE', aliases: ['VA02', 'SAL-SO-CH', 'SOE'], description: 'Change Sales Order', route: '/1000/sales/change', module: 'SD', subModule: 'SD', type: 'CHANGE', classicName: 'Sales Change', keywords: 'change sales order adjustment, edit customer shipment conditions, modify order items lines' },
  { code: 'SSOV', aliases: ['VA03', 'SAL-SO-DP', 'SOV'], description: 'Display Sales Order', route: '/1000/sales/display', module: 'SD', subModule: 'SD', type: 'DISPLAY', classicName: 'Sales Display', keywords: 'display sales order registry tracking, look up client demand execution pipeline' },

  { code: 'HHEC', aliases: ['PA30', 'HRM-EMP-CH', 'HEC'], description: 'Maintain HR Master', route: '/1000/hr/payroll?mode=maintain', module: 'HR', subModule: 'HR-PA', type: 'CHANGE', classicName: 'HR Master', keywords: 'maintain employee profiles records data details files payroll update modifications' },
  { code: 'HHEV', aliases: ['PA20', 'HRM-EMP-DP', 'HEV'], description: 'Display HR Master Data', route: '/1000/hr/payroll?mode=display', module: 'HR', subModule: 'HR-PA', type: 'DISPLAY', classicName: 'HR Display', keywords: 'display employee identity profile master ledger data files payroll hr-pa' },
  { code: 'HPYC', aliases: ['PC00', 'HRM-PAY-PS', 'PYC'], description: 'Payroll Run', route: '/1000/hr/payroll?mode=run', module: 'HR', subModule: 'HR-PY', type: 'POSTING', classicName: 'Payroll Run', keywords: 'execute employee compensation payroll run processing, monthly wages disbursements slip posting' },

  { code: 'CCUL', aliases: ['KSB1', 'CST-CU-LS', 'CUL'], description: 'Cost Center Actual Line Items', route: '/1000/fico/cca-report', module: 'FICO', subModule: 'CO-CCA', type: 'REPORT', classicName: 'CCA Actuals', keywords: 'cost center actual expenditure line items ledger tracking overview statement reports' },
  { code: 'CCRP', aliases: ['CK40N', 'CST-COST-PS', 'CRP'], description: 'Costing Run', route: '/1000/fico/costing-run?mode=run', module: 'FICO', subModule: 'CO-PC', type: 'POSTING', classicName: 'Costing Run', keywords: 'product costing run evaluations, manufacturing cost estimate evaluations rollups co-pc' },

  // --- Enterprise Structure – New Intuitive System FND-* – old OX* kept as aliases ---
  { code: 'ECGA', aliases: ['OX16', 'FND-CG-LE-AS', 'CGA'], description: 'Assign Company Group to Legal Entity (OX16)', route: '/1000/foundation/company-group-assignment', module: 'FOUNDATION', subModule: 'ENT-ASSIGN', type: 'CHANGE', classicName: 'Assign Company Group to Legal Entity', keywords: 'assign company group legal framework subsidiary to root parent corporation entity matrix map ox16 ecga' },
  { code: 'EFLA', aliases: ['OX18', 'FND-FAC-LE-AS', 'FLA'], description: 'Assign Plant to Company Code (OX18)', route: '/1000/mm/assignments/plant-company-code', module: 'MM', subModule: 'MM-PUR', type: 'CHANGE', classicName: 'Assign Plant->CC', keywords: 'assign facility plant production operations site infrastructure to primary legal entity company code map ox18' },
  { code: 'EPCA', aliases: ['OX01', 'OX10', 'FND-PO-LE-AS'], description: 'Assign Purchasing Org to Company Code (OX01)', route: '/1000/mm/assignments/purchasing-org-company-code', module: 'MM', subModule: 'MM-PUR', type: 'CHANGE', classicName: 'Assign POrg->CC', keywords: 'assign purchasing organization procurement division to company code ox01 ox10' },
  { code: 'EPPA', aliases: ['OX17', 'FND-PO-PL-AS'], description: 'Assign Purchasing Org to Plant (OX17)', route: '/1000/mm/assignments/purchasing-org-plant', module: 'MM', subModule: 'MM-PUR', type: 'CHANGE', classicName: 'Assign POrg->Plant', keywords: 'assign purchasing organization procurement to plant facility ox17' },
  { code: 'ESCA', aliases: ['OVX3', 'FND-SO-LE-AS'], description: 'Assign Sales Org to Company Code (OVX3)', route: '/1000/sd/assignments/sales-org-company-code', module: 'SD', subModule: 'SD-MD', type: 'CHANGE', classicName: 'Assign SOrg->CC', keywords: 'assign sales organization commercial organization to company code ovx3' },
  { code: 'EDSA', aliases: ['OVX6', 'FND-DIV-SO-AS'], description: 'Assign Division to Sales Org (OVX6)', route: '/1000/sd/assignments/division-sales', module: 'SD', subModule: 'SD-MD', type: 'CHANGE', classicName: 'Assign Division->SOrg', keywords: 'assign division product line to sales organization commercial unit ovx6' },
  { code: 'ECSA_ASSIGN', aliases: ['OVX8', 'FND-DC-SO-AS'], description: 'Assign Distribution Channel to Sales Org (OVX8)', route: '/1000/sd/assignments/channel-sales', module: 'SD', subModule: 'SD-MD', type: 'CHANGE', classicName: 'Assign DistChannel->SOrg', keywords: 'assign distribution channel sales channel to sales organization commercial unit ovx8' },
  { code: 'ECSA', aliases: ['OVX5', 'FND-CO-SC-PL-AS', 'CSA'], description: 'Define Commercial Structure Assignment', route: '/1000/foundation/commercial-orgs', module: 'FOUNDATION', subModule: 'ENT-SORG', type: 'CREATE', classicName: 'Commercial Structure Assignment', keywords: 'define commercial organization channel product line assignment structures' },

  // --- Module 1 Legal-Safe Org Structure – New Intuitive Primary, old kept as alias ---
  { code: 'ECAC', aliases: ['OX06', 'OKKP', 'OKPP', 'FND-CA-CR', 'CAC'], description: 'Maintain Controlling Area', route: '/1000/foundation/control-areas', module: 'FICO', subModule: 'CO-OM', type: 'CREATE', classicName: 'Controlling Area OX06 / OKKP', keywords: 'define maintain controlling area cross company code cost accounting currency type fiscal year variant standard hierarchy okkp okpp ox06 tka01' },
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
  { code: 'FLCA', aliases: ['OB38', 'FIN-LE-CP-AS', 'LCA'], description: 'Assign Company Code to Credit Control Area (OB38)', route: '/1000/fico/assignments/credit-control-area', module: 'FICO', subModule: 'FI-COMP', type: 'CHANGE', classicName: 'Assign CC->CCA', keywords: 'assign active legal company code transaction entity mapping to global risk management credit control ob38' },
  { code: 'FFYC', aliases: ['OB29', 'FIN-FC-CR', 'FYC'], description: 'Define Fiscal Year Variant', route: '/1000/fico/fiscal-calendars', module: 'FICO', subModule: 'FI-FYV', type: 'CREATE', classicName: 'Fiscal Year Variant Create', keywords: 'define corporate fiscal year accounting variant periods timeline k4 v3 calendar rules setup fi-fyv' },
  { code: 'FFYE', aliases: ['OB29-CHANGE', 'FYE'], description: 'Change Fiscal Year Variant', route: '/1000/fico/fiscal-calendars/change', module: 'FICO', subModule: 'FI-FYV', type: 'CHANGE', classicName: 'Fiscal Year Variant Change', keywords: 'change edit modify fiscal year accounting variant periods k4 v3' },
  { code: 'FFYV', aliases: ['OB29-DISPLAY', 'FYV'], description: 'Display Fiscal Year Variant', route: '/1000/fico/fiscal-calendars/display', module: 'FICO', subModule: 'FI-FYV', type: 'DISPLAY', classicName: 'Fiscal Year Variant Display', keywords: 'display view fiscal year accounting variant periods k4 v3' },
  { code: 'FFYL', aliases: ['OB29-LIST', 'FYL'], description: 'Fiscal Year Variant List', route: '/1000/fico/fiscal-calendars/list', module: 'FICO', subModule: 'FI-FYV', type: 'DISPLAY', classicName: 'Fiscal Year Variant List', keywords: 'list all fiscal year accounting variants periods k4 v3' },
  { code: 'FLFA', aliases: ['OB37', 'FIN-LE-FC-AS', 'LFA'], description: 'Assign Fiscal Year Variant to Company Code (OB37)', route: '/1000/fico/assignments/fiscal-year-variant', module: 'FICO', subModule: 'FI-FYV', type: 'CHANGE', classicName: 'Assign FYV->CC', keywords: 'assign fiscal accounting year periods setup layout matrix mappings directly to company code ob37' },
  { code: 'FLPA', aliases: ['OBBP', 'FIN-LE-PC-AS', 'LPA'], description: 'Assign Posting Period Variant to Company Code (OBBP)', route: '/1000/fico/assignments/posting-period-variant', module: 'FICO', subModule: 'FI-PPV', type: 'CHANGE', classicName: 'Assign PPV->CC', keywords: 'assign localized operational financial posting period variant settings block to specific company codes obbp' },
  { code: 'FFSA', aliases: ['OBC5', 'FIN-LE-FS-AS', 'FSA'], description: 'Assign Field Status Variant to Company Code (OBC5)', route: '/1000/fico/assignments/field-status-variant', module: 'FICO', subModule: 'FI-GL', type: 'CHANGE', classicName: 'Assign FSV->CC', keywords: 'assign field status variant to company code obc5 ffsa' },
  { code: 'FCCA_ASSIGN', aliases: ['OX19', 'FIN-LE-CO-AS'], description: 'Assign Company Code to Controlling Area (OX19)', route: '/1000/fico/assignments/controlling-area', module: 'FICO', subModule: 'CO-CCA', type: 'CHANGE', classicName: 'Assign CC->CO Area', keywords: 'assign company code controlling area ox19 fcca' },

  // --- Chart of Accounts OB13/OB62/OBD4/OB53/OBA7/FBN1/FS00 ---
  { code: 'FCOA', aliases: ['OB13', 'FIN-COA-CR', 'COA'], description: 'Define Chart of Accounts KSCA', route: '/1000/fico/chart-of-accounts', module: 'FICO', subModule: 'FI-COA', type: 'CREATE', classicName: 'Chart of Accounts', keywords: 'define chart of accounts operational ksca financial balance sheet structures map fi-coa' },
  { code: 'FLC2', aliases: ['OB62', 'FIN-LE-COA-AS', 'LCA2'], description: 'Assign Company Code to Chart of Accounts (OB62)', route: '/1000/fico/assignments/chart-of-accounts', module: 'FICO', subModule: 'FI-COA', type: 'CHANGE', classicName: 'Assign CC->CoA', keywords: 'assign operational corporate company code asset entities mapping to universal chart of accounts ob62' },
  { code: 'FAGC', aliases: ['OBD4', 'FIN-AG-CR', 'AGC'], description: 'Define Account Groups – classify GL accounts & ranges', route: '/1000/fico/account-groups', module: 'FICO', subModule: 'FI-COA', type: 'CREATE', classicName: 'Account Groups', keywords: 'define accounting general ledger group categories ranges classification codes kass klia krev obd4' },
  { code: 'FREC', aliases: ['OB53', 'FIN-RE-CR', 'REC'], description: 'Define Retained Earnings Account 2500000001', route: '/1000/fico/gl-accounts', module: 'FICO', subModule: 'FI-COA', type: 'CREATE', classicName: 'Retained Earnings', keywords: 'define retained earnings surplus capital ledger roll over clearing account setups fi-coa' },
  { code: 'FDTC', aliases: ['OBA7', 'FIN-DT-CR', 'DTC'], description: 'Define Document Types KR/KG/KZ/RE/WE/WA/SA', route: '/1000/fico/document-types', module: 'FICO', subModule: 'FI-DOC', type: 'CREATE', classicName: 'Document Types', keywords: 'define ledger transaction document types mapping classification rules journal vouchers kr kg kz re we wa sa' },
  { code: 'FNRC', aliases: ['FBN1', 'FIN-NR-CR', 'NRC'], description: 'Define Number Ranges 50-54 5000000000-5499999999', route: '/1000/fico/number-ranges', module: 'FICO', subModule: 'FI-NR', type: 'CREATE', classicName: 'Number Ranges', keywords: 'define transaction document sequence number ranges counter increments configuration fi-nr' },
  { code: 'FGLC', aliases: ['FS00', 'FIN-GL-CR', 'GLC'], description: 'Create G/L Account Master 5000000001-5000000006', route: '/1000/fico/gl-accounts', module: 'FICO', subModule: 'FI-GL', type: 'CREATE', classicName: 'G/L Account Create', keywords: 'create general ledger gl account master setup chart entries definitions directory fi-gl' },
  { code: 'FGCA', aliases: ['FS01', 'FIN-GL-COA-CR', 'GCA'], description: 'Create G/L Account in Chart', route: '/1000/fico/gl-accounts', module: 'FICO', subModule: 'FI-GL', type: 'CREATE', classicName: 'G/L Chart Create', keywords: 'create financial general ledger chart accounts matrix framework asset liability setup' },
  { code: 'FGLE', aliases: ['FS02', 'FIN-GL-CH', 'GLE'], description: 'Change G/L Account', route: '/1000/fico/gl-accounts/change', module: 'FICO', subModule: 'FI-GL', type: 'CHANGE', classicName: 'G/L Account Change', keywords: 'change general ledger asset account fields structure definitions parameters edits' },
  { code: 'FGLV', aliases: ['FS03', 'FIN-GL-DP', 'GLV'], description: 'Display G/L Account', route: '/1000/fico/gl-accounts/display', module: 'FICO', subModule: 'FI-GL', type: 'DISPLAY', classicName: 'G/L Account Display', keywords: 'display operational general ledger account definitions metrics profile view summary' },
  { code: 'FGCV', aliases: ['FSP0', 'FIN-GL-COA-DP', 'GCV'], description: 'G/L Account in Chart of Accounts', route: '/1000/fico/chart-of-accounts', module: 'FICO', subModule: 'FI-GL', type: 'DISPLAY', classicName: 'G/L in Chart', keywords: 'local general ledger account parameters mapping within corporate unified chart structures' },
  { code: 'FAUC', aliases: ['OBYC', 'FIN-AUTO-CR', 'AUC'], description: 'Auto Account Determination INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX)/PRD/GBB/BSV', route: '/1000/fico/auto-account-determination', module: 'FICO', subModule: 'FI-AUTO', type: 'CREATE', classicName: 'Auto Determination', keywords: 'automatic inventory gl account determination layout matrix setups rule clearing bsx wrx prd gbb bsv fi-auto' },

  // --- PP - BOM, Work Centers, Routings, MRP, STO ---
  { code: 'MBMC', aliases: ['CS01', 'MFG-BOM-CR', 'BMC'], description: 'Create BOM - Bills of Material', route: '/1000/pp/bom', module: 'PP', subModule: 'PP-BOM', type: 'CREATE', classicName: 'BOM Create CS01', keywords: 'create bill of materials bom, product structure design components, engineering recipe list' },
  { code: 'MBME', aliases: ['CS02', 'MFG-BOM-CH', 'BME'], description: 'Change BOM', route: '/1000/pp/bom/change', module: 'PP', subModule: 'PP-BOM', type: 'CHANGE', classicName: 'BOM Change CS02', keywords: 'change bill of materials bom, edit product structure parts, update engineering recipe' },
  { code: 'MBMV', aliases: ['CS03', 'MFG-BOM-DP', 'BMV'], description: 'Display BOM', route: '/1000/pp/bom/display', module: 'PP', subModule: 'PP-BOM', type: 'DISPLAY', classicName: 'BOM Display CS03', keywords: 'display bill of materials bom, view product assembly structure tree, look up parts recipe' },
  { code: 'MWCC', aliases: ['CR01', 'MFG-WC-CR', 'WCC'], description: 'Create Work Center - Machine/Labor Capacity', route: '/1000/pp/work-centers', module: 'PP', subModule: 'PP-WC', type: 'CREATE', classicName: 'Work Center CR01', keywords: 'create work center machine labor capacity, new assembly line plant floor resource' },
  { code: 'MWCE', aliases: ['CR02', 'MFG-WC-CH', 'WCE'], description: 'Change Work Center', route: '/1000/pp/work-centers/change', module: 'PP', subModule: 'PP-WC', type: 'CHANGE', classicName: 'Work Center CR02', keywords: 'change work center machine labor capacity, update factory floor resource station' },
  { code: 'MWCV', aliases: ['CR03', 'MFG-WC-DP', 'WCV'], description: 'Display Work Center', route: '/1000/pp/work-centers/display', module: 'PP', subModule: 'PP-WC', type: 'DISPLAY', classicName: 'Work Center CR03', keywords: 'display work center machine labor capacity, view production environment line resource' },
  { code: 'MRTC', aliases: ['CA01', 'MFG-RTG-CR', 'RTC'], description: 'Create Routing - Sequence of Manufacturing Steps', route: '/1000/pp/routings', module: 'PP', subModule: 'PP-RTG', type: 'CREATE', classicName: 'Routing CA01', keywords: 'create routing manufacturing steps, production operations sequence, process plan template' },
  { code: 'MRTE', aliases: ['CA02', 'MFG-RTG-CH', 'RTE'], description: 'Change Routing', route: '/1000/pp/routings/change', module: 'PP', subModule: 'PP-RTG', type: 'CHANGE', classicName: 'Routing CA02', keywords: 'change routing manufacturing steps, update production operations, edit process plan' },
  { code: 'MRTV', aliases: ['CA03', 'MFG-RTG-DP', 'RTV'], description: 'Display Routing', route: '/1000/pp/routings/display', module: 'PP', subModule: 'PP-RTG', type: 'DISPLAY', classicName: 'Routing CA03', keywords: 'display routing manufacturing steps, view production operations, look up process plan' },
  { code: 'MMRP', aliases: ['MD01', 'MFG-MRP-PS', 'MRP'], description: 'MRP Run - Material Requirements Planning', route: '/1000/pp/mrp', module: 'PP', subModule: 'PP-MRP', type: 'POSTING', classicName: 'MRP Run MD01', keywords: 'mrp run material requirements planning, demand forecasting engine, net requirements calculation' },
  { code: 'MMRV', aliases: ['MD04', 'MFG-MRP-DP', 'MRV'], description: 'Stock/Requirements List - MRP Stock', route: '/1000/pp/mrp', module: 'PP', subModule: 'PP-MRP', type: 'DISPLAY', classicName: 'Stock Req List MD04', keywords: 'stock requirements list, mrp dynamic availability view, material supply demand balance sheet' },
  { code: 'PSTC', aliases: ['ME27', 'PUR-STO-CR', 'STC'], description: 'Create Stock Transport Order STO', route: '/1000/mm/sto', module: 'MM', subModule: 'MM-STO', type: 'CREATE', classicName: 'STO Create ME27', keywords: 'create stock transport order sto, inter company site inventory transfer request' },
  { code: 'PSTD', aliases: ['VL10B', 'PUR-STO-DL-PS', 'STD'], description: 'Process STO Delivery', route: '/1000/mm/sto', module: 'MM', subModule: 'MM-STO', type: 'POSTING', classicName: 'STO Delivery VL10B', keywords: 'process stock transport delivery fulfillment, execute cross plant warehouse transfer orders' },
  { code: 'SDLC', aliases: ['VL01N', 'SAL-DL-CR', 'DLC'], description: 'Create Outbound Delivery - B2B Wholesale', route: '/1000/sd/delivery', module: 'SD', subModule: 'SD-DL', type: 'CREATE', classicName: 'Delivery VL01N', keywords: 'create outbound shipping delivery document, logistics b2b wholesale packing warehouse shipment' },
  { code: 'SBLC', aliases: ['VF01', 'SAL-BL-PS', 'BLC'], description: 'Create Billing Document - B2B AR', route: '/1000/sd/billing', module: 'SD', subModule: 'SD-BIL', type: 'POSTING', classicName: 'Billing VF01', keywords: 'create billing document commercial invoice, run customer accounting accounts receivable b2b ar' },

  // --- Cost Centers & Tax & Payment ---
  { code: 'CCUC', aliases: ['KS01', 'CST-CU-CR', 'CUC', 'CUC2'], description: 'Create Cost Center KS-CC-01..05', route: '/1000/fico/cost-centers', module: 'FICO', subModule: 'CO-CCA', type: 'CREATE', classicName: 'Cost Center Create', keywords: 'create cost center operational department allocation node management profiles co-cca' },
  { code: 'CCUE', aliases: ['KS02', 'CST-CU-CH', 'CUE'], description: 'Change Cost Center', route: '/1000/fico/cost-centers/change', module: 'FICO', subModule: 'CO-CCA', type: 'CHANGE', classicName: 'Cost Center Change KS02', keywords: 'change operational cost center parameters reporting allocations fields updates tracking' },
  { code: 'CCUV', aliases: ['KS03', 'CST-CU-DP', 'CUV'], description: 'Display Cost Center', route: '/1000/fico/cost-centers', module: 'FICO', subModule: 'CO-CCA', type: 'DISPLAY', classicName: 'Cost Center Display KS03', keywords: 'display department cost center ownership information boundaries evaluation tracking' },
  { code: 'FCYC', aliases: ['OY03', 'FIN-CUR-CR', 'CYC'], description: 'Define Currencies - Only INR default, OY03', route: '/1000/fico/currencies', module: 'FICO', subModule: 'FI-CUR', type: 'CREATE', classicName: 'Currencies OY03', keywords: 'define active monetary units transaction exchange currency lists baseline standard tracking inr default' },
  { code: 'EMTP', aliases: ['OMS2', 'FND-MT-CR', 'MTP'], description: 'Define Product Types – Legal-safe (was Define Material Types OMS2) – prod_item_type RAW/FINISHED/SEMI', route: '/1000/foundation/material-types', module: 'FOUNDATION', subModule: 'MM-CFG', type: 'CREATE', classicName: 'Material Types', keywords: 'define material types behavior configurations, raw materials semi finished packaging attributes prod_item_type RAW FINISHED SEMI TRADING PACKAGING CONSUMABLE SERVICE EMTP alias OMS2 ROH FERT HALB' },
  { code: 'EMGC', aliases: ['OMSF', 'FND-MG-CR', 'MGC'], description: 'Define Product Categories – prod_category', route: '/1000/foundation/material-categories', module: 'FOUNDATION', subModule: 'MM-CFG', type: 'CREATE', classicName: 'Product Categories OMSF', keywords: 'define product categories material groups prod_category emgc omsf' },
  { code: 'EUOC', aliases: ['CUNI', 'FND-UOM-CR', 'UOC'], description: 'Define Units of Measure – Legal-safe own IP (was CUNI) – core_unit_measure KG/L/PC/BOX sample kept', route: '/1000/foundation/uom', module: 'FOUNDATION', subModule: 'MM-CFG', type: 'CREATE', classicName: 'UoM CUNI', keywords: 'define global units of measure uom weight dimension metric conversion factors mm-cfg core_unit_measure EUOC alias CUNI KG L PC BOX' },
  { code: 'ELTC', aliases: ['MSC1N', 'MSC3N', 'FND-LOT-CR', 'LTC'], description: 'Define Lots & Batches – inv_lot lot_number expiry_date', route: '/1000/foundation/lots', module: 'FOUNDATION', subModule: 'MM-IM', type: 'CREATE', classicName: 'Lot Management', keywords: 'define lots batch management inventory expiry date inv_lot eltc' },
  // Module 3 – Partner – Legal-safe own IP – EPAC/SCUC/PSUC – 4-char MOOA E=Enterprise, PA=Partner Account, CU=Customer, SU=Supplier, C=Create
  { code: 'EPAC', aliases: ['PTNC', 'BPAC', 'BP01', 'FND-BP-CR', 'BP'], description: 'Create Partner Account – Legal-safe own IP (was Business Partner BP) – partner_account central master role VENDOR/CUSTOMER/BOTH', route: '/1000/foundation/partners', module: 'FOUNDATION', subModule: 'BP-MD', type: 'CREATE', classicName: 'Partner Account Create', keywords: 'create partner account business partner central master vendor customer both roles display name legal name gst pan tax id partner_account EPAC alias PTNC BP01' },
  { code: 'EPAE', aliases: ['BP02', 'FND-BP-CH', 'PAE'], description: 'Change Partner Account – Legal-safe (was Change Business Partner)', route: '/1000/foundation/partners?mode=change', module: 'FOUNDATION', subModule: 'BP-MD', type: 'CHANGE', classicName: 'Partner Account Change', keywords: 'change partner account business partner master data update partner_account EPAE' },
  { code: 'EPAV', aliases: ['BP03', 'FND-BP-DP', 'PAV'], description: 'Display Partner Account – Legal-safe (was Display Business Partner)', route: '/1000/foundation/partners?mode=display', module: 'FOUNDATION', subModule: 'BP-MD', type: 'DISPLAY', classicName: 'Partner Account Display', keywords: 'display partner account business partner master view partner_account EPAV' },
  { code: 'EPAL', aliases: ['BPAL', 'FND-BP-LS', 'PAL'], description: 'Partner Account Overview List – Legal-safe (was Business Partner List)', route: '/1000/foundation/partners', module: 'FOUNDATION', subModule: 'BP-MD', type: 'REPORT', classicName: 'Partner Overview', keywords: 'partner overview list business partner directory vendor customer both partner_account EPAL' },
  { code: 'PSUC', aliases: ['SUPC', 'VEND', 'XK01', 'ME01', 'FND-SU-CR', 'BP-SU'], description: 'Create Supplier – Legal-safe own IP (was Vendor Master XK01/ME01) – partner_account role VENDOR + partner_vendor_profile procurement view', route: '/1000/foundation/suppliers', module: 'FOUNDATION', subModule: 'BP-VENDOR', type: 'CREATE', classicName: 'Supplier Create', keywords: 'create supplier vendor master procurement partner_account role vendor partner_vendor_profile procurement division buyer team quality relevant PSUC alias SUPC XK01 ME01' },
  { code: 'PSUE', aliases: ['XK02', 'FND-SU-CH', 'SUE'], description: 'Change Supplier – Legal-safe (was Change Vendor XK02)', route: '/1000/foundation/partners?role=VENDOR&mode=change', module: 'FOUNDATION', subModule: 'BP-VENDOR', type: 'CHANGE', classicName: 'Supplier Change', keywords: 'change supplier vendor master procurement partner_vendor_profile PSUE' },
  { code: 'PSUV', aliases: ['XK03', 'FND-SU-DP', 'SUV'], description: 'Display Supplier – Legal-safe (was Display Vendor XK03)', route: '/1000/foundation/partners?role=VENDOR&mode=display', module: 'FOUNDATION', subModule: 'BP-VENDOR', type: 'DISPLAY', classicName: 'Supplier Display', keywords: 'display supplier vendor master view procurement PSUV' },
  { code: 'SCUC', aliases: ['CUCC', 'CUST', 'XD01', 'FND-CU-CR', 'BP-CU'], description: 'Create Customer – Legal-safe own IP (was Customer Master XD01) – partner_account role CUSTOMER + partner_customer_profile sales view', route: '/1000/foundation/customers', module: 'FOUNDATION', subModule: 'BP-CUSTOMER', type: 'CREATE', classicName: 'Customer Create', keywords: 'create customer master sales partner_account role customer partner_customer_profile commercial org sales channel product line credit policy SCUC alias CUCC XD01' },
  { code: 'SCUE', aliases: ['XD02', 'FND-CU-CH', 'CUE'], description: 'Change Customer – Legal-safe (was Change Customer XD02)', route: '/1000/foundation/partners?role=CUSTOMER&mode=change', module: 'FOUNDATION', subModule: 'BP-CUSTOMER', type: 'CHANGE', classicName: 'Customer Change', keywords: 'change customer master sales partner_customer_profile SCUE' },
  { code: 'SCUV', aliases: ['XD03', 'FND-CU-DP', 'CUV'], description: 'Display Customer – Legal-safe (was Display Customer XD03)', route: '/1000/foundation/partners?role=CUSTOMER&mode=display', module: 'FOUNDATION', subModule: 'BP-CUSTOMER', type: 'DISPLAY', classicName: 'Customer Display', keywords: 'display customer master sales view SCUV' },
  { code: 'EPCC', aliases: ['VAP1', 'FND-BP-CNT', 'PCC'], description: 'Define Partner Contacts', route: '/1000/foundation/partner-contacts', module: 'FOUNDATION', subModule: 'SD-MD', type: 'CREATE', classicName: 'Partner Contacts VAP1', keywords: 'partner contacts person vap1 customer vendor contact epcc' },
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

  // --- Phase 0 T0 BLOCKING – FMTM Movement Types + FRAD Revenue Account – own IP codes, SAP codes as aliases only ---
  { code: 'FMTM', aliases: ['OMJJ', 'FIN-MV-CR', 'MVC', 'MOVEMENT'], description: 'Define Movement Types 101/102/122/161/261/262/309/551/601/602/701/702 – FMTM – T0 BLOCKING – stock +/- value +/- account modifier INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX)/GBB/PRD/BSV – used in GR GI PGI PI – own IP', route: '/1000/fico/movement-types', module: 'FICO', subModule: 'FI-MV', type: 'CREATE', classicName: 'Movement Types FMTM', keywords: 'movement types fmtm omjj 101 gr 102 reversal 122 return 261 gi prod order co11n 601 pgi sales vl02n 602 reverse pgi vl09 701 702 pi diff mi07 bsv bsx wrx gbb prd' },
  { code: 'FRAD', aliases: ['VKOA', 'FIN-REV-CR', 'REVENUE', 'REVENUE', 'REVENUE'], description: 'Define Revenue Account Determination – FRAD – T0 BLOCKING – chart + sales org + customer group + material group + account assignment → GL KOFI/KOFK – used in billing VF01 – Dr AR Cr Revenue – own IP', route: '/1000/fico/revenue-accounts', module: 'FICO', subModule: 'FI-REV', type: 'CREATE', classicName: 'Revenue Account FRAD', keywords: 'revenue account determination frad vkoa kofi kofk chart sales org customer group material group account assignment gl revenue billing vf01' },

  // --- Phase 0 Prerequisites – Field Status, Fiscal, Posting, Credit – Must exist before OB13/ELEC – own IP codes ---
  { code: 'FFSV', aliases: ['FSSV', 'OBC4', 'FIN-FS-VAR-CR', 'FSV'], description: 'Create Field Status Variant – FFSV-1000 – OBC4 – must exist before ELEC – controls field status groups – own IP', route: '/1000/fico/field-status-variants', module: 'FICO', subModule: 'FI-GL', type: 'CREATE', classicName: 'Field Status Variant FFSV', keywords: 'field status variant ffsv fssv obc4 ffsv-1000 create field status variant groups required suppressed gl account posting key controls required before elec legal entity' },
  { code: 'FFSG', aliases: ['OBC5', 'FIN-FS-GRP-CR', 'FSG'], description: 'Create Field Status Groups – FFSG – groups fields per variant FFSV-1000 – G001 etc – own IP', route: '/1000/fico/field-status-groups', module: 'FICO', subModule: 'FI-GL', type: 'CREATE', classicName: 'Field Status Groups FFSG', keywords: 'field status groups ffsg obc5 fssv g001 create groups fields required suppressed' },
  { code: 'FFYC', aliases: ['OB29', 'FIN-FY-CR', 'FYC'], description: 'Create Fiscal Calendar – K4 April-March – FFYC – OB29 – fiscal_year_variant K4 must exist before ELEC', route: '/1000/fico/fiscal-calendars', module: 'FICO', subModule: 'FI-PER', type: 'CREATE', classicName: 'Fiscal Calendar OB29', keywords: 'fiscal calendar ffyc ob29 k4 april march fiscal year variant k4 v3 create fiscal calendar year dependent calendar year number of periods from_date to_date start_month end_month year_shift' },
  { code: 'FPPC', aliases: ['OBBO', 'FIN-PP-VAR-CR', 'PPV'], description: 'Create Posting Period Variant – PPV-1000 – OBBO – posting_period_variant must exist before ELEC', route: '/1000/fico/posting-period-variants', module: 'FICO', subModule: 'FI-PER', type: 'CREATE', classicName: 'Posting Period Variant OBBO', keywords: 'posting period variant ppc obbo ppv-1000 create posting period variant groups company codes ob52' },
  { code: 'FCPC', aliases: ['OB45', 'FIN-CC-CR', 'CPA', 'CRED'], description: 'Create Credit Control Area – CRED-1000 – FCPC – OB45 – credit_control_area must exist before OB13/ELEC – defines credit boundary', route: '/1000/foundation/credit-policy-areas', module: 'FICO', subModule: 'FI-AR', type: 'CREATE', classicName: 'Credit Control Area OB45', keywords: 'credit control area cred-1000 fcpc ob45 cpa credit policy area create credit control must exist before ob13 elec' },
  { code: 'FCOA', aliases: ['OB13', 'FIN-COA-CR', 'COA'], description: 'Create Chart of Accounts – CA-IN-01 – FCOA – OB13 – language EN – chart_of_accounts_code must exist before ELEC', route: '/1000/fico/chart-of-accounts', module: 'FICO', subModule: 'FI-GL', type: 'CREATE', classicName: 'Chart of Accounts OB13', keywords: 'chart of accounts fcoa ob13 ca-in-01 create chart of accounts language en coa kscA int' },

  // --- Admin / Security ---
  { code: 'FUSC', aliases: ['SU01', 'FND-USR-CR', 'USC'], description: 'User Maintenance', route: '/1000/foundation/users', module: 'FOUNDATION', subModule: 'ADMIN', type: 'CREATE', classicName: 'User SU01', keywords: 'administrative user maintenance account profiles tracking reset credentials authorization access rules' },
  { code: 'FROC', aliases: ['PFCG', 'FND-ROL-CR', 'ROC'], description: 'Role Maintenance', route: '/1000/foundation/roles', module: 'FOUNDATION', subModule: 'ADMIN', type: 'CREATE', classicName: 'Role PFCG', keywords: 'role maintenance profile governance security tracking matrix setup access permission paths' },
  { code: 'FBJM', aliases: ['SM37', 'FND-BJM-LS', 'BJM'], description: 'Background Job Monitor – System Jobs – own IP (alias SM37) – shows RUNNING/QUEUED/COMPLETED/FAILED – progress steps – no timeout – header Jobs icon – queue – industry standard', route: '/1000/system/jobs', module: 'FOUNDATION', subModule: 'ADMIN', type: 'REPORT', classicName: 'Background Job Monitor FBJM', keywords: 'background job monitor system jobs queue running queued completed failed progress steps no timeout header icon sm37 fbjm bjm jobs' },
  { code: 'FELM', aliases: ['SM12', 'FND-ELM-LS', 'ELM'], description: 'Enqueue Lock Monitor – Locks – own IP (alias SM12) – shows active locks – prevents double entry – GR for PO locked when background job running – number range locked when editing – 5 min expiry – industry standard', route: '/1000/system/locks', module: 'FOUNDATION', subModule: 'ADMIN', type: 'REPORT', classicName: 'Enqueue Lock Monitor FELM', keywords: 'enqueue lock monitor locks active double entry prevention gr po locked background job number range locked editing 5 min expiry sm12 felm elm locks' },
  { code: 'EWSC', aliases: ['EWSC'], description: 'Define EWSC – auto-generated', route: '/1000/foundation/warehouse-sites', module: 'FOUNDATION', subModule: 'ENT', type: 'CREATE', classicName: 'EWSC', keywords: 'ewsc' },
  { code: 'FEXC', aliases: ['OB08', 'FIN-EXC-CR', 'EXC'], description: 'Define Exchange Rates – FEXC own IP (alias OB08) – from_currency to_currency rate from_date to_date – industry standard – converts foreign currency transactions – e.g., INR to USD – used in GR/IR, billing, payment', route: '/1000/fico/exchange-rates', module: 'FICO', subModule: 'FI-CUR', type: 'CREATE', classicName: 'Exchange Rates FEXC', keywords: 'exchange rates fexc ob08 from_currency to_currency rate from_date to_date currency conversion foreign currency INR USD EUR' },
  { code: 'FCCA', aliases: ['FCCA'], description: 'Define FCCA – auto-generated', route: '/1000/fico/cost-centers', module: 'FOUNDATION', subModule: 'ENT', type: 'CREATE', classicName: 'FCCA', keywords: 'fcca' },

  // --- FICO Master & Operations Dedicated Subroutes ---
  { code: 'FAGE', aliases: ['OBD4-CH', 'FIN-AG-CH'], description: 'Create/Change Account Group', route: '/1000/fico/account-groups/change', module: 'FICO', subModule: 'FI-COA', type: 'CHANGE', classicName: 'Create/Change Account Group', keywords: 'change gl account groups number ranges obd4 fage' },
  { code: 'FAGV', aliases: ['OBD4-DP', 'FIN-AG-DP'], description: 'Display Account Group', route: '/1000/fico/account-groups/display', module: 'FICO', subModule: 'FI-COA', type: 'DISPLAY', classicName: 'Account Group Display', keywords: 'display gl account groups number ranges obd4 fagv' },
  { code: 'FAGL', aliases: ['OBD4-LS', 'FIN-AG-LS'], description: 'Account Groups List', route: '/1000/fico/account-groups/list', module: 'FICO', subModule: 'FI-COA', type: 'REPORT', classicName: 'Account Groups List', keywords: 'list gl account groups overview obd4 fagl' },

  { code: 'FCOE', aliases: ['OB13-CH', 'FIN-COA-CH'], description: 'Change Chart of Accounts', route: '/1000/fico/chart-of-accounts/change', module: 'FICO', subModule: 'FI-COA', type: 'CHANGE', classicName: 'Chart of Accounts Change', keywords: 'change chart of accounts ob13 fcoe' },
  { code: 'FCOV', aliases: ['OB13-DP', 'FIN-COA-DP'], description: 'Display Chart of Accounts', route: '/1000/fico/chart-of-accounts/display', module: 'FICO', subModule: 'FI-COA', type: 'DISPLAY', classicName: 'Chart of Accounts Display', keywords: 'display chart of accounts ob13 fcov' },
  { code: 'FCOL', aliases: ['OB13-LS', 'FIN-COA-LS'], description: 'Chart of Accounts List', route: '/1000/fico/chart-of-accounts/list', module: 'FICO', subModule: 'FI-COA', type: 'REPORT', classicName: 'Chart of Accounts List', keywords: 'list chart of accounts overview ob13 fcol' },

  { code: 'CCUD', aliases: ['KS03', 'CST-CU-DP'], description: 'Display Cost Center', route: '/1000/fico/cost-centers/display', module: 'FICO', subModule: 'CO-CCA', type: 'DISPLAY', classicName: 'Cost Center Display KS03', keywords: 'display department cost center ownership information boundaries ccud' },
  { code: 'CCUS', aliases: ['KS13', 'CST-CU-LS'], description: 'Cost Centers Directory List', route: '/1000/fico/cost-centers/list', module: 'FICO', subModule: 'CO-CCA', type: 'REPORT', classicName: 'Cost Centers List KS13', keywords: 'list cost centers overview directory ccus ks13' },

  { code: 'FGLS', aliases: ['FS00-LS', 'FIN-GL-LS'], description: 'GL Accounts Directory List', route: '/1000/fico/gl-accounts/list', module: 'FICO', subModule: 'FI-GL', type: 'REPORT', classicName: 'GL Accounts List', keywords: 'list gl accounts master directory overview fgls' },

  { code: 'FD32', aliases: ['FD32', 'FIN-CR-MGT'], description: 'Customer Credit Master', route: '/1000/fico/customer-credit', module: 'FICO', subModule: 'FI-AR', type: 'CHANGE', classicName: 'Customer Credit Master FD32', keywords: 'customer credit limit exposure fd32' },
  { code: 'FFXV', aliases: ['F.05', 'FAGL_FC_VAL', 'FIN-FX-VAL'], description: 'Foreign Exchange Valuation', route: '/1000/fico/fx-valuation', module: 'FICO', subModule: 'FI-GL', type: 'POSTING', classicName: 'FX Valuation F.05', keywords: 'foreign currency revaluation fx valuation f.05 fagl_fc_val' },
  { code: 'FGIC', aliases: ['F.13', 'MR11', 'FIN-GRIR-CLR'], description: 'Automated GR/IR Clearing', route: '/1000/fico/gr-ir-clearing', module: 'FICO', subModule: 'FI-GL', type: 'POSTING', classicName: 'GR/IR Clearing F.13', keywords: 'gr ir clearing automatic account maintenance f.13 mr11' },
  { code: 'FPPR', aliases: ['F110-PR', 'FIN-PAY-PROP'], description: 'Payment Proposal & Execution', route: '/1000/fico/payment-proposal', module: 'FICO', subModule: 'FI-AP', type: 'POSTING', classicName: 'Payment Proposal F110', keywords: 'automatic payment run proposal f110 payment execution' },
  { code: 'FAPT', aliases: ['OBB8', 'FIN-PAY-TRM'], description: 'Payment Terms Definition', route: '/1000/fico/payment-terms', module: 'FICO', subModule: 'FI-AP', type: 'CREATE', classicName: 'Payment Terms OBB8', keywords: 'define payment terms cash discount obb8 fait' },
  { code: 'FREV', aliases: ['FB08', 'FBRA', 'FIN-DOC-REV'], description: 'Document Reversal & Reset Clearing', route: '/1000/fico/reversal', module: 'FICO', subModule: 'FI-GL', type: 'POSTING', classicName: 'Document Reversal FB08', keywords: 'financial document reversal reset clearing fbra fb08 frev' },
  { code: 'FTGL', aliases: ['OBA0', 'FIN-TOL-GL'], description: 'Tolerance Groups – General Ledger', route: '/1000/fico/tolerance-groups-gl', module: 'FICO', subModule: 'FI-GL', type: 'CREATE', classicName: 'GL Tolerance Groups OBA0', keywords: 'define tolerance groups general ledger accounts oba0 ftgl' },
  { code: 'FTCV', aliases: ['OBA4', 'FIN-TOL-CV'], description: 'Tolerance Groups – Customers/Vendors', route: '/1000/fico/tolerance-groups-cv', module: 'FICO', subModule: 'FI-AR', type: 'CREATE', classicName: 'BP Tolerance Groups OBA4', keywords: 'define tolerance groups business partners customers vendors oba4 ftcv' },

  // --- Foundation Subroutes & Operations ---
  { code: 'ECGE', aliases: ['OX15-CH', 'FND-CG-CH'], description: 'Change Company Group', route: '/1000/foundation/company-groups/change', module: 'FOUNDATION', subModule: 'ENT-CG', type: 'CHANGE', classicName: 'Company Group Change', keywords: 'change company group enterprise ox15 ecge' },
  { code: 'ECGV', aliases: ['OX15-DP', 'FND-CG-DP'], description: 'Display Company Group', route: '/1000/foundation/company-groups/display', module: 'FOUNDATION', subModule: 'ENT-CG', type: 'DISPLAY', classicName: 'Company Group Display', keywords: 'display company group enterprise ox15 ecgv' },
  { code: 'ECGL', aliases: ['OX15-LS', 'FND-CG-LS'], description: 'Company Groups List', route: '/1000/foundation/company-groups/list', module: 'FOUNDATION', subModule: 'ENT-CG', type: 'REPORT', classicName: 'Company Groups List', keywords: 'list company groups enterprise ox15 ecgl' },

  { code: 'ELEE', aliases: ['OX02-CH', 'FND-LE-CH'], description: 'Change Legal Entity', route: '/1000/foundation/legal-entities/change', module: 'FOUNDATION', subModule: 'ENT-LE', type: 'CHANGE', classicName: 'Legal Entity Change', keywords: 'change legal entity statutory company code ox02 elee' },
  { code: 'ELEV', aliases: ['OX02-DP', 'FND-LE-DP'], description: 'Display Legal Entity', route: '/1000/foundation/legal-entities/display', module: 'FOUNDATION', subModule: 'ENT-LE', type: 'DISPLAY', classicName: 'Legal Entity Display', keywords: 'display legal entity statutory company code ox02 elev' },
  { code: 'ELEL', aliases: ['OX02-LS', 'FND-LE-LS'], description: 'Legal Entities List', route: '/1000/foundation/legal-entities/list', module: 'FOUNDATION', subModule: 'ENT-LE', type: 'REPORT', classicName: 'Legal Entities List', keywords: 'list legal entities company codes ox02 elel' },

  { code: 'EDPP', aliases: ['OVXD', 'FND-DP-PATH'], description: 'Distribution Paths', route: '/1000/foundation/distribution-paths', module: 'FOUNDATION', subModule: 'SD-CFG', type: 'CREATE', classicName: 'Distribution Paths OVXD', keywords: 'distribution paths channels logistics sales routes ovxd edpp' },
  { code: 'ECUA', aliases: ['OVX5-AS', 'FND-CU-AS'], description: 'Commercial Unit Assignment', route: '/1000/foundation/commercial-unit-assign', module: 'FOUNDATION', subModule: 'ENT-CU', type: 'CHANGE', classicName: 'Commercial Unit Assignment', keywords: 'commercial unit assignment profit center enterprise ovx5 ecua' },
  { code: 'EBSA', aliases: ['KE51-AS', 'FND-PC-AS'], description: 'Profit Center Assignment', route: '/1000/foundation/profit-center-assign', module: 'FOUNDATION', subModule: 'ENT-PC', type: 'CHANGE', classicName: 'Profit Center Assignment', keywords: 'profit center assignment plant legal entity ke51 ebsa' },
  { code: 'SUPF', aliases: ['SU3', 'FND-USR-PRF'], description: 'User Profile & Defaults', route: '/1000/foundation/user-profile', module: 'FOUNDATION', subModule: 'ADMIN', type: 'CHANGE', classicName: 'User Profile SU3', keywords: 'user profile defaults parameters personal settings su3 su01 supf' },

  // --- MM Purchasing & Inventory Subroutes ---
  { code: 'PPRM', aliases: ['ME5A', 'PUR-PR-LS'], description: 'Purchase Requisitions List', route: '/1000/mm/pr/list', module: 'MM', subModule: 'MM-PUR', type: 'REPORT', classicName: 'PR List ME5A', keywords: 'list purchase requisitions overview me5a pprm' },
  { code: 'PPOM', aliases: ['ME2N', 'PUR-PO-LS'], description: 'Purchase Orders List', route: '/1000/mm/po/list', module: 'MM', subModule: 'MM-PUR', type: 'REPORT', classicName: 'PO List ME2N', keywords: 'list purchase orders overview me2n ppom' },

  { code: 'IGRR', aliases: ['MIGO-102', 'PUR-GR-REV'], description: 'Goods Receipt Reversal (102)', route: '/1000/mm/gr-reversal', module: 'MM', subModule: 'MM-IM', type: 'POSTING', classicName: 'GR Reversal 102', keywords: 'goods receipt reversal 102 movement cancellation migo igrr' },
  { code: 'PIVR', aliases: ['MR8M', 'PUR-IV-REV'], description: 'Invoice Verification Reversal', route: '/1000/mm/iv-reversal', module: 'MM', subModule: 'MM-LIV', type: 'POSTING', classicName: 'Invoice Reversal MR8M', keywords: 'invoice verification reversal cancellation mr8m pivr' },
  { code: 'PIRX', aliases: ['ME11', 'ME12', 'PUR-INF-CR'], description: 'Purchasing Info Records', route: '/1000/mm/info-records', module: 'MM', subModule: 'MM-PUR', type: 'CREATE', classicName: 'Info Records ME11', keywords: 'purchasing info records vendor material prices conditions me11 me12 me13 pirx' },
  { code: 'PSLX', aliases: ['ME01', 'ME03', 'PUR-SRC-CR'], description: 'Purchasing Source Lists', route: '/1000/mm/source-lists', module: 'MM', subModule: 'MM-PUR', type: 'CREATE', classicName: 'Source Lists ME01', keywords: 'source lists approved vendors determination me01 me03 pslx' },
  { code: 'PQAX', aliases: ['MEQ1', 'MEQ3', 'PUR-QTA-CR'], description: 'Quota Arrangements', route: '/1000/mm/quota-arrangements', module: 'MM', subModule: 'MM-PUR', type: 'CREATE', classicName: 'Quota Arrangements MEQ1', keywords: 'quota arrangements supplier split allocations meq1 meq3 pqax' },
  { code: 'PRFQ', aliases: ['ME41', 'ME42', 'PUR-RFQ-CR'], description: 'Request for Quotation (RFQ)', route: '/1000/mm/rfq', module: 'MM', subModule: 'MM-PUR', type: 'CREATE', classicName: 'RFQ Create ME41', keywords: 'request for quotation rfq vendor quotation me41 me42 prfq' },
  { code: 'PRES', aliases: ['MB21', 'MB22', 'INV-RES-CR'], description: 'Material Stock Reservations', route: '/1000/mm/reservations', module: 'MM', subModule: 'MM-IM', type: 'CREATE', classicName: 'Stock Reservations MB21', keywords: 'stock reservations material reservation mb21 mb22 mb23 pres' },
  { code: 'PRPT', aliases: ['ME80FN', 'PUR-RPT-LS'], description: 'Purchasing Spend & Line Reporting', route: '/1000/mm/reports', module: 'MM', subModule: 'MM-PUR', type: 'REPORT', classicName: 'Purchasing Reports ME80FN', keywords: 'purchasing reporting spend analysis line items me80fn prpt' },
  { code: 'PSTX', aliases: ['VL10B', 'PUR-STO-DL'], description: 'Stock Transport Shipments', route: '/1000/mm/sto-delivery', module: 'MM', subModule: 'MM-STO', type: 'POSTING', classicName: 'STO Delivery VL10B', keywords: 'sto delivery stock transport outbound delivery shipments vl10b pstx' },

  // --- Sales Subroutes & Pages ---
  { code: 'SSOL', aliases: ['VA05', 'SAL-SO-LS'], description: 'Sales Orders List', route: '/1000/sales/list', module: 'SD', subModule: 'SD-SLS', type: 'REPORT', classicName: 'Sales Orders List VA05', keywords: 'list sales orders overview va05 ssol' },
  { code: 'SDLE', aliases: ['VL02N', 'SAL-DL-CH'], description: 'Outbound Delivery Change & PGI', route: '/1000/sd/delivery-change', module: 'SD', subModule: 'SD-SHP', type: 'CHANGE', classicName: 'Delivery Change VL02N', keywords: 'change delivery post goods issue pgi vl02n sdle' },
  { code: 'SBLE', aliases: ['VF02', 'SAL-BL-CH'], description: 'Billing Document Change', route: '/1000/sd/billing-change', module: 'SD', subModule: 'SD-BIL', type: 'CHANGE', classicName: 'Billing Change VF02', keywords: 'change billing document invoice vf02 sble' },
  { code: 'SBLR', aliases: ['VF11', 'SAL-BL-REV'], description: 'Billing Document Reversal', route: '/1000/sd/billing-reversal', module: 'SD', subModule: 'SD-BIL', type: 'POSTING', classicName: 'Billing Reversal VF11', keywords: 'cancel billing document reversal invoice credit vf11 sblr' },
  { code: 'SPRC', aliases: ['V/08', 'SAL-PRC-PRC'], description: 'Pricing Condition Procedures', route: '/1000/sd/pricing-procedure', module: 'SD', subModule: 'SD-PRC', type: 'CREATE', classicName: 'Pricing Procedures V/08', keywords: 'pricing procedure conditions calculation schema v08 sprc' },

  // --- PP Subroutes & Pages ---
  { code: 'MBML', aliases: ['CS11', 'MFG-BOM-LS'], description: 'BOM Multi-Level Explosion List', route: '/1000/pp/bom/list', module: 'PP', subModule: 'PP-BOM', type: 'REPORT', classicName: 'BOM Explosion CS11', keywords: 'bill of materials list explosion cs11 cs12 mbml' },
  { code: 'MRTL', aliases: ['CA11', 'MFG-RTG-LS'], description: 'Routings Directory List', route: '/1000/pp/routings/list', module: 'PP', subModule: 'PP-RTG', type: 'REPORT', classicName: 'Routings List CA11', keywords: 'routings list manufacturing operations ca11 ca12 mrtl' },
  { code: 'MWCL', aliases: ['CR05', 'MFG-WC-LS'], description: 'Work Centers Directory List', route: '/1000/pp/work-centers/list', module: 'PP', subModule: 'PP-WC', type: 'REPORT', classicName: 'Work Centers List CR05', keywords: 'work centers list plant capacity resources cr05 mwcl' },
  { code: 'MMPO', aliases: ['CO01', 'CO02', 'MFG-ORD-MGT'], description: 'Manufacturing & Production Orders', route: '/1000/pp/production-orders', module: 'PP', subModule: 'PP-SFC', type: 'CREATE', classicName: 'Production Orders CO01', keywords: 'production orders shop floor control release confirm co01 co02 co03 mmpo' },
  { code: 'PCST', aliases: ['CK11N', 'CK24', 'MFG-CST-EST'], description: 'Product Standard Cost Estimate', route: '/1000/pp/cost-estimate', module: 'PP', subModule: 'PP-PC', type: 'CREATE', classicName: 'Cost Estimate CK11N', keywords: 'product cost estimate standard cost valuation bom routing ck11n ck24 pcst' },
  { code: 'MPIR', aliases: ['MD61', 'MD62', 'MFG-DEM-PIR'], description: 'Planned Independent Requirements (PIR)', route: '/1000/pp/pir', module: 'PP', subModule: 'PP-MRP', type: 'CREATE', classicName: 'PIR Demand MD61', keywords: 'planned independent requirements demand management forecast md61 md62 mpir' },

  // --- HR Pages ---
  { code: 'HEMP', aliases: ['PA30', 'HRM-EMP-DIR'], description: 'Employee Master Directory', route: '/1000/hr/employees', module: 'HR', subModule: 'HR-PA', type: 'CREATE', classicName: 'Employee Directory PA30', keywords: 'employee master directory personnel administration pa30 pa20 hemp' },
  { code: 'HPAC', aliases: ['PA03', 'HRM-PAY-CTL'], description: 'Payroll Control Record', route: '/1000/hr/payroll-control', module: 'HR', subModule: 'HR-PY', type: 'CHANGE', classicName: 'Payroll Control PA03', keywords: 'payroll control record release exit check pa03 hpac' },
  { code: 'HPAY', aliases: ['PC00', 'HRM-PAY-RUN'], description: 'Payroll Calculation Run', route: '/1000/hr/payroll-run', module: 'HR', subModule: 'HR-PY', type: 'POSTING', classicName: 'Payroll Run PC00', keywords: 'execute payroll calculation salary disbursements pc00 hpay' },

  // --- Hub & Overview Direct Navigators ---
  { code: 'FCHB', aliases: ['FIN-HUB', 'FICO-HUB'], description: 'Financial Configuration Hub', route: '/1000/fico/posting-period', module: 'FICO', subModule: 'FI-CFG', type: 'REPORT', classicName: 'Financial Hub', keywords: 'financial configuration hub overview posting period fiscal tax general ledger fchb' },
  { code: 'ECHB', aliases: ['ENT-HUB', 'FND-HUB'], description: 'Enterprise Configuration Hub', route: '/1000/foundation/enterprise-config', module: 'FOUNDATION', subModule: 'ENT-CFG', type: 'REPORT', classicName: 'Enterprise Hub', keywords: 'enterprise structure configuration hub overview company plant org echb' },
  { code: 'NAVI', aliases: ['TREE', 'ERP-TREE', 'NAV'], description: 'Enterprise Function Tree Navigator', route: '/1000/navigator', module: 'FOUNDATION', subModule: 'ADMIN', type: 'REPORT', classicName: 'ERP Navigator', keywords: 'tree structure navigator all transaction codes directory erp navi' },
  { code: 'FDIR', aliases: ['CODES', 'TCODES', 'SM01'], description: 'Transaction Codes & Functions Directory', route: '/1000/foundation/codes', module: 'FOUNDATION', subModule: 'ADMIN', type: 'REPORT', classicName: 'Transaction Code Directory', keywords: 'all transaction codes sap equivalent directory list map fdir sm01' },
];

export const MODULE_CLASSIFICATION = {
  FOUNDATION: { name: 'Foundation', color: 'bg-zinc-100', icon: '🏗️', description: 'Layer 0: Client, Company Code, Plant, SLoc, Material, Batch, Number Ranges - ERP core' },
  MM: { name: 'Materials Management', color: 'bg-blue-50', icon: '📦', description: 'PR to PO to GR to IV, DELIV_COMPLETED (legacy ELIKZ), MAP landed, Physical Inventory - ERP MM' },
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
    GR: ['GR', 'GOODS RECEIPT', 'GOODS MOVEMENT', 'MIGO', 'RECEIPT', 'GR_PO', 'WE'],
    GI: ['GI', 'GOODS ISSUE', 'ISSUE', 'MIGO', 'GI_PROD', 'GI_SALES', 'WA'],
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
    POSTINGPERIOD: ['POSTING PERIOD', 'OBBO', 'OB52', 'OBBP', 'FLPA', 'PERIOD'],
    FIELDSTATUS: ['FIELD STATUS', 'OBC4', 'OBC5', 'FFSA', 'FFSV'],
    ASSIGNMENT: ['ASSIGNMENT', 'ASSIGN', 'FLC2', 'FLFA', 'FLCA', 'FLPA', 'FFSA', 'FCCA_ASSIGN', 'EFLA', 'EPCA', 'EPPA', 'ESCA', 'EDSA', 'ECSA_ASSIGN', 'ECGA'],
    PAYMENT: ['PAYMENT', 'F-53', 'KZ', 'F110', 'VENDOR PAYMENT'],
    PAYROLL: ['PAYROLL', 'PC00', 'PA30', 'PA20', 'HR'],
    COMPANY: ['COMPANY', 'OX15', 'OX02', 'COMPANY CODE', 'ENTERPRISE', 'ELEC', 'ECGC', 'ECGA'],
    PLANT: ['PLANT', 'OX10', 'OX09', 'OX18', 'OX17', 'EFLA', 'EPPA', 'EFCC', 'SLOC', 'STORAGE LOCATION'],
    SALESORG: ['SALES ORG', 'OVX3', 'OVX6', 'OVX8', 'ESCA', 'EDSA', 'ECSA_ASSIGN', 'ECOC'],
    PURCHASINGORG: ['PURCHASING ORG', 'OX01', 'OX10', 'OX17', 'EPCA', 'EPPA', 'EPDC'],
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
    if (tc.code === 'IGRC') expanded += ' GR GOODS RECEIPT GOODS MOVEMENT RECEIPT WE WA GI GOODS ISSUE';
    if (tc.code === 'PIVC') expanded += ' IV INVOICE VERIFICATION INVOICE RE';
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
