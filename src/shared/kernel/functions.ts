/**
 * Function Mapping – New Short Intuitive Helper Code System – Own IP
 * Primary codes: 3-char short, intuitive, easy to type – e.g., LEC, FCC, POC, MTC
 * Old codes (OX02, MM01, ME21N, FND-LE-CR etc) kept as aliases for search
 * Function is destination, helper code is just identifier
 */

export const FUNCTION_MAP: Record<string, { desc: string; module: string; api?: string; configurable?: boolean; code?: string; helperCode?: string; aliases?: string[]; newCode?: string }> = {
  // Foundation – Enterprise Structure – Short 3-char Primary
  'CGC': { desc: 'Define Company Group – New Short Intuitive', module: 'Enterprise', api: '/api/company-groups', configurable: true, code: 'CGC', helperCode: 'CGC', aliases: ['FND-CG-CR', 'OX15', 'ORG-CG-01'], newCode: 'CGC' },
  'LEC': { desc: 'Define Legal Entity – Statutory Company – Former Company Code', module: 'Enterprise', api: '/api/legal-entities', configurable: true, code: 'LEC', helperCode: 'LEC', aliases: ['FND-LE-CR', 'OX02', 'ORG-LE-01'], newCode: 'LEC' },
  'CAC': { desc: 'Define Control Area – Former Controlling Area', module: 'Enterprise', api: '/api/control-areas', configurable: true, code: 'CAC', helperCode: 'CAC', aliases: ['FND-CA-CR', 'OX06'], newCode: 'CAC' },
  'FCC': { desc: 'Define Facility – Operational Site – Former Plant', module: 'Enterprise', api: '/api/facilities', configurable: true, code: 'FCC', helperCode: 'FCC', aliases: ['FND-FAC-CR', 'OX10', 'ORG-FAC-01'], newCode: 'FCC' },
  'ILC': { desc: 'Define Inventory Location – Storage Zone', module: 'MM', api: '/api/inventory-locations', configurable: true, code: 'ILC', helperCode: 'ILC', aliases: ['FND-IL-CR', 'OX09', 'ORG-IL-01'], newCode: 'ILC' },
  'PDC': { desc: 'Define Procurement Division – Former Purch Org', module: 'MM', api: '/api/procurement-divisions', configurable: true, code: 'PDC', helperCode: 'PDC', aliases: ['FND-PD-CR', 'OX08', 'ORG-PD-01'], newCode: 'PDC' },
  'BTC': { desc: 'Define Buyer Team – Former Purch Group', module: 'MM', api: '/api/buyer-teams', configurable: true, code: 'BTC', helperCode: 'BTC', aliases: ['FND-BT-CR', 'OME4', 'ORG-BT-01'], newCode: 'BTC' },
  'COC': { desc: 'Define Commercial Organization – Former Sales Org', module: 'SD', api: '/api/commercial-orgs', configurable: true, code: 'COC', helperCode: 'COC', aliases: ['FND-CO-CR', 'OVX2', 'ORG-CO-01'], newCode: 'COC' },
  'SCC': { desc: 'Define Sales Channel – Former Dist Channel', module: 'SD', api: '/api/sales-channels', configurable: true, code: 'SCC', helperCode: 'SCC', aliases: ['FND-SC-CR', 'OVX1', 'ORG-SC-01'], newCode: 'SCC' },
  'PLC': { desc: 'Define Product Line – Former Division', module: 'SD', api: '/api/product-lines', configurable: true, code: 'PLC', helperCode: 'PLC', aliases: ['FND-PL-CR', 'OVX5', 'ORG-PL-01'], newCode: 'PLC' },
  'PUC': { desc: 'Define Profit Unit – Former Profit Center', module: 'Enterprise', api: '/api/profit-units', configurable: true, code: 'PUC', helperCode: 'PUC', aliases: ['FND-PU-CR', 'KE51', 'ORG-PU-01'], newCode: 'PUC' },
  'CUC': { desc: 'Define Cost Unit – Former Cost Center', module: 'Enterprise', api: '/api/cost-units', configurable: true, code: 'CUC', helperCode: 'CUC', aliases: ['FND-CU-CR', 'CST-CU-CR', 'KS01', 'ORG-CU-01'], newCode: 'CUC' },
  'BSC': { desc: 'Define Business Segment – Former Business Area', module: 'Enterprise', api: '/api/business-segments', configurable: true, code: 'BSC', helperCode: 'BSC', aliases: ['FND-BS-CR', 'ORG-BS-01'], newCode: 'BSC' },
  'WHC': { desc: 'Define Warehouse Site – Former Warehouse Number', module: 'Enterprise', api: '/api/warehouse-sites', configurable: true, code: 'WHC', helperCode: 'WHC', aliases: ['FND-WH-CR', 'ORG-WH-01'], newCode: 'WHC' },
  'DPC': { desc: 'Define Dispatch Point – Former Shipping Point', module: 'Enterprise', api: '/api/dispatch-points', configurable: true, code: 'DPC', helperCode: 'DPC', aliases: ['FND-DP-CR', 'ORG-DP-01'], newCode: 'DPC' },

  // Financial – Short
  'CPC': { desc: 'Define Credit Policy Area – Former Credit Control Area', module: 'FICO', api: '/api/credit-policy-areas', configurable: true, code: 'CPC', helperCode: 'CPC', aliases: ['FIN-CP-CR', 'OB45'], newCode: 'CPC' },
  'FYC': { desc: 'Define Fiscal Calendar – Former Fiscal Year Variant', module: 'FICO', api: '/api/fiscal-calendars', configurable: true, code: 'FYC', helperCode: 'FYC', aliases: ['FIN-FC-CR', 'OB29'], newCode: 'FYC' },
  'PPC': { desc: 'Define Posting Calendar – Former Posting Period Variant', module: 'FICO', api: '/api/posting-calendars', configurable: true, code: 'PPC', helperCode: 'PPC', aliases: ['FIN-PC-CR', 'OBBO'], newCode: 'PPC' },
  'COA': { desc: 'Define Chart of Accounts – New Short', module: 'FICO', api: '/api/chart-of-accounts', configurable: true, code: 'COA', helperCode: 'COA', aliases: ['FIN-COA-CR', 'OB13'], newCode: 'COA' },
  'GLC': { desc: 'Create GL Account – New Short', module: 'FICO', api: '/api/gl-accounts', configurable: true, code: 'GLC', helperCode: 'GLC', aliases: ['FIN-GL-CR', 'FS00'], newCode: 'GLC' },
  'CYC': { desc: 'Define Currencies – Only INR default', module: 'FICO', api: '/api/currencies', configurable: true, code: 'CYC', helperCode: 'CYC', aliases: ['FIN-CUR-CR', 'OY03'], newCode: 'CYC' },
  'TXC': { desc: 'Define Tax Codes', module: 'FICO', api: '/api/tax-codes', configurable: true, code: 'TXC', helperCode: 'TXC', aliases: ['FIN-TX-CR', 'FTXP'], newCode: 'TXC' },

  // Foundation Material – Short
  'MTC': { desc: 'Create Material – New Short', module: 'Foundation', api: '/api/materials', configurable: true, code: 'MTC', helperCode: 'MTC', aliases: ['FND-MAT-CR', 'MM01'], newCode: 'MTC' },
  'UOC': { desc: 'Define Units of Measure', module: 'Foundation', api: '/api/uom', code: 'UOC', helperCode: 'UOC', aliases: ['FND-UOM-CR', 'CUNI'], newCode: 'UOC' },

  // MM – Procurement – Short
  'PRC': { desc: 'Create Purchase Requisition – New Short', module: 'MM', api: '/api/pr', code: 'PRC', helperCode: 'PRC', aliases: ['PUR-PR-CR', 'ME51N'], newCode: 'PRC' },
  'POC': { desc: 'Create Purchase Order – New Short', module: 'MM', api: '/api/po', code: 'POC', helperCode: 'POC', aliases: ['PUR-PO-CR', 'ME21N'], newCode: 'POC' },
  'GRC': { desc: 'Goods Receipt Post – New Short', module: 'MM', api: '/api/gr', code: 'GRC', helperCode: 'GRC', aliases: ['INV-GR-PS', 'MIGO'], newCode: 'GRC' },
  'IVC': { desc: 'Invoice Verification Post – New Short', module: 'MM', api: '/api/iv', code: 'IVC', helperCode: 'IVC', aliases: ['PUR-IV-PS', 'MIRO'], newCode: 'IVC' },

  // SD – Sales – Short
  'SOC': { desc: 'Create Sales Order – New Short', module: 'SD', api: '/api/sales-orders', code: 'SOC', helperCode: 'SOC', aliases: ['SAL-SO-CR', 'VA01'], newCode: 'SOC' },
  'DLC': { desc: 'Create Outbound Delivery – New Short', module: 'SD', api: '/api/delivery', code: 'DLC', helperCode: 'DLC', aliases: ['SAL-DL-CR', 'VL01N'], newCode: 'DLC' },
  'BLC': { desc: 'Create Billing Document – New Short', module: 'SD', api: '/api/billing', code: 'BLC', helperCode: 'BLC', aliases: ['SAL-BL-PS', 'VF01'], newCode: 'BLC' },

  // PP – Manufacturing – Short
  'BMC': { desc: 'Create BOM – New Short', module: 'PP', api: '/api/bom', code: 'BMC', helperCode: 'BMC', aliases: ['MFG-BOM-CR', 'CS01'], newCode: 'BMC' },
  'WCC': { desc: 'Create Work Center – New Short', module: 'PP', api: '/api/work-centers', code: 'WCC', helperCode: 'WCC', aliases: ['MFG-WC-CR', 'CR01'], newCode: 'WCC' },
  'RTC': { desc: 'Create Routing – New Short', module: 'PP', api: '/api/routings', code: 'RTC', helperCode: 'RTC', aliases: ['MFG-RTG-CR', 'CA01'], newCode: 'RTC' },

  // Legacy aliases kept for backward search – point to new short primary
  'OX15': { desc: 'Company Group – Alias for CGC', module: 'Enterprise', api: '/api/company-groups', code: 'OX15', helperCode: 'CGC', aliases: ['CGC'] },
  'OX02': { desc: 'Legal Entity – Alias for LEC', module: 'Enterprise', api: '/api/legal-entities', code: 'OX02', helperCode: 'LEC', aliases: ['LEC'] },
  'MM01': { desc: 'Material – Alias for MTC', module: 'Foundation', api: '/api/materials', code: 'MM01', helperCode: 'MTC', aliases: ['MTC'] },
  'ME21N': { desc: 'PO – Alias for POC', module: 'MM', api: '/api/po', code: 'ME21N', helperCode: 'POC', aliases: ['POC'] },
  'MIGO': { desc: 'GR – Alias for GRC', module: 'MM', api: '/api/gr', code: 'MIGO', helperCode: 'GRC', aliases: ['GRC'] },
};

export function getCodeForFunction(route: string): string {
  for (const [code, info] of Object.entries(FUNCTION_MAP)) {
    if (info.api && route.includes(info.api.replace('/api/', ''))) return code;
  }
  return 'MTC';
}

export function getAliasesForCode(code: string): string[] {
  const info = FUNCTION_MAP[code];
  return info?.aliases || [];
}
