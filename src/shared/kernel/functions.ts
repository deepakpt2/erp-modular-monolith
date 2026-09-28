/**
 * ERP Function Mapping – All functions have helper code to identify function
 * Function is destination (e.g., Create Purchase Order), code is just helper (e.g., ME21N is helper for Create Purchase Order)
 * Searching ME21N redirects to background function Create Purchase Order – code is not target, function is target
 * Like in ERP, keep defaults given by ERP similar in our app
 * General CoA and its corresponding accounts available like in ERP
 * 
 * RULE ENFORCED FROM NOW: From this point any function you add to the app, if it has corresponding helper code it should be available in app too
 * - Every new API must return helper code field and be added to FUNCTION_MAP
 * - Every new UI page must use ModernModuleShell with code prop (helper code)
 * - Check via GET /api/functions – lists all implemented functions with helper codes
 * - Function is destination, code is helper
 */

export const FUNCTION_MAP = {
  // Foundation / Enterprise Structure – OX, OY
  'OY03': { desc: 'Define Currencies – Only INR default, KWD/USD/EUR added by user – OY03', module: 'Enterprise', api: '/api/currencies', configurable: true, default: 'INR', helperCode: 'OY03' },
  'OX15': { desc: 'Company Code / Company – Enterprise Structure', module: 'Enterprise', api: '/api/company-codes', code: 'OX15' },
  'OX02': { desc: 'Define Company Code – T001 – Configurable: create/edit/delete, only INR default', module: 'Enterprise', api: '/api/company-codes', configurable: true, code: 'OX02' },
  'OX16': { desc: 'Assign Company to Company Code', module: 'Enterprise', api: '/api/company-codes', code: 'OX16' },
  'OX10': { desc: 'Define Plant – T001W – Configurable', module: 'Enterprise', api: '/api/plants', configurable: true, code: 'OX10' },
  'OX09': { desc: 'Define Storage Location – Configurable', module: 'MM', api: '/api/plants', configurable: true, code: 'OX09' },
  'OX08': { desc: 'Define Purchasing Organization – Configurable', module: 'MM', api: '/api/enterprise/config', configurable: true, code: 'OX08' },
  'OME4': { desc: 'Define Purchasing Group', module: 'MM', api: '/api/enterprise/config', configurable: true, code: 'OME4' },
  'OVX5': { desc: 'Define Sales Organization', module: 'SD', api: '/api/enterprise/config', configurable: true, code: 'OVX5' },
  'OVX1': { desc: 'Define Distribution Channel', module: 'SD', api: '/api/enterprise/config', configurable: true, code: 'OVX1' },
  'OVX2': { desc: 'Define Division', module: 'SD', api: '/api/enterprise/config', configurable: true, code: 'OVX2' },

  // FICO - Chart of Accounts - General CoA like ERP – OB13 is General CoA
  'OB13': { desc: 'Edit Chart of Accounts List – General CoA INT/KSCA/CAUS/GKR/YIN – ERP defaults kept – configurable', module: 'FICO', api: '/api/chart-of-accounts', configurable: true, erpDefaults: ['INT International', 'KSCA Kerala Spices', 'CAUS USA', 'GKR German', 'YIN India GST'], helperCode: 'OB13' },
  'OB62': { desc: 'Assign Company Code to Chart of Accounts', module: 'FICO', api: '/api/chart-of-accounts', code: 'OB62' },
  'OBD4': { desc: 'G/L Account Groups – KASS/KLIA/KREV/KEXP/KMAT/KREC/KTAX/KCSH – configurable OBD4', module: 'FICO', api: '/api/account-groups', configurable: true, helperCode: 'OBD4' },
  'OB53': { desc: 'Retained Earnings Account – 2500000001 – OB53', module: 'FICO', api: '/api/gl-accounts', helperCode: 'OB53' },
  'FS00': { desc: 'G/L Account Master – General CoA accounts – 5000000001-5000000006, 100000-500005, etc – configurable, secure delete', module: 'FICO', api: '/api/gl-accounts', configurable: true, secureDelete: 'Blocked if has FI postings – is_blocked=true', helperCode: 'FS00' },
  'FS01': { desc: 'Create G/L Account', module: 'FICO', api: '/api/gl-accounts', code: 'FS01' },
  'FS02': { desc: 'Change G/L Account – FS00 edit', module: 'FICO', api: '/api/gl-accounts', code: 'FS02' },
  'FS03': { desc: 'Display G/L Account', module: 'FICO', api: '/api/gl-accounts', code: 'FS03' },
  'FSP0': { desc: 'G/L Account in Chart of Accounts', module: 'FICO', api: '/api/gl-accounts', code: 'FSP0' },
  'OBYC': { desc: 'Automatic Posting – BSX Inventory Posting, WRX GR/IR, PRD Price Diff, GBB Consumption, BSV Transit, FRE/ZOL', module: 'FICO', api: '/api/gl-accounts', code: 'OBYC' },

  // FICO - Other – OBBO/OB52 posting periods, OY03 currencies already
  'OB29': { desc: 'Define Fiscal Year Variant – K4 April-March – OB29', module: 'FICO', api: '/api/company-codes', code: 'OB29' },
  'OB37': { desc: 'Assign Company Code to Fiscal Year Variant', module: 'FICO', api: '/api/company-codes', code: 'OB37' },
  'OBBO': { desc: 'Define Posting Period Variant – Configurable – OBBO', module: 'FICO', api: '/api/posting-period-variants', configurable: true, helperCode: 'OBBO' },
  'OB52': { desc: 'Open and Close Posting Periods – Configurable – OB52', module: 'FICO', api: '/api/posting-period-variants', configurable: true, helperCode: 'OB52' },
  'OBBP': { desc: 'Assign Posting Period Variant to Company Code – OBBP', module: 'FICO', api: '/api/posting-period-variants', code: 'OBBP' },
  'OBA7': { desc: 'Define Document Types – KR/KG/KZ/RE/WE/WA/SA – OBA7', module: 'FICO', api: '/api/chart-of-accounts', code: 'OBA7' },
  'FBN1': { desc: 'Number Ranges for FI Documents – 50-54 5000000000-5499999999 – FBN1', module: 'FICO', api: '/api/company-codes', code: 'FBN1' },
  'KS01': { desc: 'Create Cost Center – Configurable with edit/delete restrictions – KS01', module: 'FICO', api: '/api/cost-centers', configurable: true, helperCode: 'KS01' },
  'KS02': { desc: 'Change Cost Center – Edit with restrictions – KS02', module: 'FICO', api: '/api/cost-centers', code: 'KS02' },
  'KS03': { desc: 'Display Cost Center – KS03', module: 'FICO', api: '/api/cost-centers', code: 'KS03' },
  'KSB1': { desc: 'Cost Center Actuals Report – KSB1', module: 'FICO', api: '/api/cca-report', helperCode: 'KSB1' },
  'FTXP': { desc: 'Tax Codes – V0/V5 VAT 5%/A0/A5/GST5 5% – Input/Output – Configurable FTXP – VAT 5% included', module: 'FICO', api: '/api/tax-codes', configurable: true, helperCode: 'FTXP' },
  'OB40': { desc: 'Tax GL Accounts – OB40', module: 'FICO', api: '/api/tax-codes', code: 'OB40' },
  'F-53': { desc: 'Vendor Payment – F-53/KZ – 53*', module: 'FICO', api: '/api/payment', code: 'F-53' },
  'F110': { desc: 'Automatic Payment Program – F110', module: 'FICO', api: '/api/payment', code: 'F110' },

  // MM - Materials Management – OMS2, CUNI, etc.
  'OMS2': { desc: 'Define Material Types – ROH/HALB/FERT/HAWA/VERP/NLAG/DIEN – configurable OMS2', module: 'MM', api: '/api/material-types', configurable: true, erpDefaults: ['ROH Raw', 'HALB Semi-Finished', 'FERT Finished', 'HAWA Trading', 'VERP Packaging', 'NLAG Non-Stock'], helperCode: 'OMS2' },
  'CUNI': { desc: 'Units of Measurement – KG/G/L/ML/PC/BOX/PACK/KIT/M/TON – configurable CUNI', module: 'MM', api: '/api/uom', configurable: true, helperCode: 'CUNI' },
  'OMSF': { desc: 'Define Material Groups – FOOD/SPICE/OIL/PACK/FG – configurable', module: 'MM', api: '/api/materials', configurable: true, code: 'OMSF' },
  'MM01': { desc: 'Create Material – Actual ERP views Basic 1/2, Sales, Purch, MRP, Plant, Accounting, Costing – MM01', module: 'MM', api: '/api/materials', configurable: true, helperCode: 'MM01' },
  'MM02': { desc: 'Change Material – MM02', module: 'MM', api: '/api/materials', code: 'MM02' },
  'MM03': { desc: 'Display Material – MM03', module: 'MM', api: '/api/materials', code: 'MM03' },
  'MMBE': { desc: 'Stock Overview – MMBE', module: 'MM', api: '/api/stock', code: 'MMBE' },
  'MM60': { desc: 'Materials Overview – MM60', module: 'MM', api: '/api/materials', code: 'MM60' },

  // MM - Purchasing – ME51N etc.
  'ME51N': { desc: 'Create Purchase Requisition – ME51N', module: 'MM', api: '/api/pr', helperCode: 'ME51N' },
  'ME52N': { desc: 'Change PR – ME52N', module: 'MM', api: '/api/pr', code: 'ME52N' },
  'ME53N': { desc: 'Display PR – ME53N', module: 'MM', api: '/api/pr', code: 'ME53N' },
  'ME21N': { desc: 'Create Purchase Order – ME21N', module: 'MM', api: '/api/po', helperCode: 'ME21N' },
  'ME22N': { desc: 'Change PO – ME22N', module: 'MM', api: '/api/po', code: 'ME22N' },
  'ME23N': { desc: 'Display PO – ME23N', module: 'MM', api: '/api/po', code: 'ME23N' },
  'MIGO': { desc: 'Goods Movement – GR/Issue – 50 WE/WA – MIGO', module: 'MM', api: '/api/gr', helperCode: 'MIGO' },
  'MIRO': { desc: 'Enter Incoming Invoice – 51 RE – MIRO', module: 'MM', api: '/api/iv', helperCode: 'MIRO' },
  'MI01': { desc: 'Create Physical Inventory Document – MI01', module: 'MM', api: '/api/physical-inventory', code: 'MI01' },
  'ME27': { desc: 'Stock Transport Orders – STO – ME27', module: 'MM', api: '/api/sto', code: 'ME27' },

  // PP – Production
  'CS01': { desc: 'Create BOM – CS01', module: 'PP', api: '/api/bom', code: 'CS01' },
  'CS02': { desc: 'Change BOM – CS02', module: 'PP', api: '/api/bom', code: 'CS02' },
  'CS03': { desc: 'Display BOM – CS03', module: 'PP', api: '/api/bom', code: 'CS03' },
  'CR01': { desc: 'Create Work Center – CR01', module: 'PP', api: '/api/work-centers', code: 'CR01' },
  'CA01': { desc: 'Create Routing – CA01', module: 'PP', api: '/api/routings', code: 'CA01' },
  'MD01': { desc: 'MRP Run – MD01', module: 'PP', api: '/api/mrp', code: 'MD01' },
  'MD04': { desc: 'Stock/Requirements List – MRP – MD04', module: 'PP', api: '/api/mrp', code: 'MD04' },
  'CK40N': { desc: 'Costing Run – CK40N', module: 'PP', api: '/api/costing-run', helperCode: 'CK40N' },

  // SD – Sales
  'VA01': { desc: 'Create Sales Order – VA01', module: 'SD', api: '/api/sales-orders', helperCode: 'VA01' },
  'VA02': { desc: 'Change Sales Order – VA02', module: 'SD', api: '/api/sales-orders', code: 'VA02' },
  'VA03': { desc: 'Display Sales Order – VA03', module: 'SD', api: '/api/sales-orders', code: 'VA03' },
  'VL01N': { desc: 'Create Outbound Delivery – VL01N', module: 'SD', api: '/api/delivery', helperCode: 'VL01N' },
  'VF01': { desc: 'Create Billing – VF01', module: 'SD', api: '/api/billing', helperCode: 'VF01' },

  // HR
  'PA20': { desc: 'Display HR Master Data – PA20', module: 'HR', api: '/api/hr/employees', code: 'PA20' },
  'PA30': { desc: 'Maintain HR Master Data – PA30', module: 'HR', api: '/api/hr/employees', code: 'PA30' },
  'PC00': { desc: 'Payroll – PC00', module: 'HR', api: '/api/payroll', code: 'PC00' },

  // System
  'SU01': { desc: 'User Maintenance – SU01', module: 'ADMIN', api: '/api/users', helperCode: 'SU01' },
  'PFCG': { desc: 'Role Maintenance – PFCG', module: 'ADMIN', api: '/api/roles', helperCode: 'PFCG' },
  'SM20': { desc: 'Security Audit Log – SM20', module: 'ADMIN', api: '/api/audit-logs', helperCode: 'SM20' },
  'SBWP': { desc: 'Workflow Inbox – SBWP', module: 'ADMIN', api: '/api/workflow', helperCode: 'SBWP' },
};

export const GENERAL_COA_DEFAULTS = {
  INT: {
    code: 'OB13',
    name: 'International CoA',
    description: 'ERP Standard International Chart – General CoA available like in ERP',
    accounts: [
      { number: '100000', name: 'Inventory ROH', type: 'ASSET', helperCode: 'FS00', key: 'BSX ROH' },
      { number: '100001', name: 'Inventory FERT', type: 'ASSET', helperCode: 'FS00', key: 'BSX FERT' },
      { number: '200000', name: 'GR/IR Clearing', type: 'LIABILITY', helperCode: 'FS00', key: 'WRX' },
      { number: '210000', name: 'Accounts Payable', type: 'LIABILITY', helperCode: 'FS00', recon: 'K' },
      { number: '120000', name: 'Accounts Receivable', type: 'ASSET', helperCode: 'FS00', recon: 'D' },
      { number: '220000', name: 'Output Tax VAT', type: 'LIABILITY', helperCode: 'FS00' },
      { number: '2500000001', name: 'Retained Earnings', type: 'LIABILITY', helperCode: 'OB53' },
    ],
  },
  KSCA: {
    code: 'OB13',
    name: 'Kerala Spices Chart',
    description: 'Kerala Spices Chart – General CoA custom like ERP – 5000000001 series',
    accounts: [
      { number: '5000000001', name: 'Raw Materials Stock', type: 'ASSET', group: 'KMAT', helperCode: 'FS00', key: 'BSX ROH', obyc: 'BSX' },
      { number: '5000000002', name: 'Finished Goods Stock', type: 'ASSET', group: 'KMAT', helperCode: 'FS00', key: 'BSX FERT', obyc: 'BSX' },
      { number: '5000000003', name: 'GR/IR Clearing Account', type: 'ASSET', group: 'KMAT', helperCode: 'FS00', key: 'WRX', obyc: 'WRX', openItem: true },
      { number: '5000000004', name: 'Stock in Transit', type: 'ASSET', group: 'KMAT', helperCode: 'FS00', key: 'BSV', obyc: 'BSV' },
      { number: '5000000005', name: 'Price Difference Account', type: 'EXPENSE', group: 'KEXP', helperCode: 'FS00', key: 'PRD', obyc: 'PRD' },
      { number: '5000000006', name: 'Material Consumption', type: 'EXPENSE', group: 'KEXP', helperCode: 'FS00', key: 'GBB', obyc: 'GBB' },
      { number: '2500000001', name: 'Retained Earnings', type: 'LIABILITY', helperCode: 'OB53' },
      { number: '1000000000', name: 'Land & Buildings', type: 'ASSET', group: 'KASS', helperCode: 'FS00' },
      { number: '2000000000', name: 'Vendor Reconciliation', type: 'LIABILITY', group: 'KLIA', helperCode: 'FS00', recon: 'K' },
      { number: '3000000000', name: 'Domestic Sales Revenue', type: 'REVENUE', group: 'KREV', helperCode: 'FS00' },
      { number: '7000000000', name: 'Input GST CGST', type: 'ASSET', group: 'KTAX', helperCode: 'FS00' },
      { number: '8000000000', name: 'Cash on Hand', type: 'ASSET', group: 'KCSH', helperCode: 'FS00' },
    ],
  },
  CAUS: {
    code: 'OB13',
    name: 'Chart of Accounts USA',
    description: 'ERP Standard US Chart – GAAP – General CoA USA',
    accounts: [
      { number: '100000', name: 'Cash', type: 'ASSET', helperCode: 'FS00' },
      { number: '120000', name: 'Accounts Receivable', type: 'ASSET', helperCode: 'FS00', recon: 'D' },
      { number: '140000', name: 'Inventory Raw', type: 'ASSET', helperCode: 'FS00', key: 'BSX' },
      { number: '200000', name: 'GR/IR', type: 'LIABILITY', helperCode: 'FS00', key: 'WRX' },
      { number: '300000', name: 'Sales Revenue', type: 'REVENUE', helperCode: 'FS00' },
    ],
  },
  GKR: {
    code: 'OB13',
    name: 'German Community Chart',
    description: 'ERP Standard German GKR',
    accounts: [
      { number: '160000', name: 'Rohstoffe', type: 'ASSET', helperCode: 'FS00' },
      { number: '400000', name: 'Umsatzerlöse', type: 'REVENUE', helperCode: 'FS00' },
    ],
  },
  YIN: {
    code: 'OB13',
    name: 'Indian Chart GST',
    description: 'ERP Standard India – GST',
    accounts: [
      { number: '100000', name: 'Inventory Raw', type: 'ASSET', helperCode: 'FS00' },
      { number: '700000', name: 'CGST Input', type: 'ASSET', helperCode: 'FS00', group: 'KTAX' },
      { number: '200001', name: 'CGST Payable', type: 'LIABILITY', helperCode: 'FS00', group: 'KTAX' },
    ],
  },
};

export function getCodeForFunction(fn: string) {
  return FUNCTION_MAP[fn as keyof typeof FUNCTION_MAP];
}

// Enforcement helpers – from this point any function you add must have code available in app
export function validateCodeExists(code: string): boolean {
  return !!FUNCTION_MAP[code as keyof typeof FUNCTION_MAP];
}

export function assertCodeForNewFunction(code: string, description: string, api: string) {
  if (!validateCodeExists(code)) {
    console.warn(`⚠️ New function ${code} – ${description} – API ${api} – not in FUNCTION_MAP – Adding to map required! Rule: From this point any function you add to the app, if it has corresponding ERP Code it should be available in app too`);
    // In dev, you should add it to FUNCTION_MAP
    return false;
  }
  return true;
}

export function getAllFunctions() {
  return Object.entries(FUNCTION_MAP).map(([code, info]) => {
    const { code: _ignore, ...rest } = info as any;
    return { code: code, ...rest };
  });
}

export function getFunctionsByModule(module: string) {
  return getAllFunctions().filter(t => t.module === module);
}

// List of mandatory ERP functions that must always be available like in ERP – General CoA, etc.
export const MANDATORY_CODES = ['OB13', 'FS00', 'OBD4', 'OB53', 'OBYC', 'OMS2', 'CUNI', 'MM01', 'OX02', 'OY03', 'FTXP', 'KS01', 'OBBO', 'OB52'];
