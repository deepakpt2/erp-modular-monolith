/**
 * Function Mapping – New Short Intuitive Helper Code System – Own IP
 * Primary codes: 3-char short, intuitive, easy to type – e.g., LEC, FCC, POC, MTC
 * Old codes (OX02, MM01, ME21N, FND-LE-CR etc) kept as aliases for search
 * Function is destination, helper code is just identifier
 */

export const FUNCTION_MAP: Record<string, { desc: string; module: string; api?: string; configurable?: boolean; code?: string; helperCode?: string; aliases?: string[]; newCode?: string }> = {
  // Foundation – Enterprise Structure – Short 3-char Primary
  'ECGC': { desc: 'Define Company Group – New Short Intuitive', module: 'Enterprise', api: '/api/company-groups', configurable: true, code: 'ECGC', helperCode: 'ECGC', aliases: ['FND-CG-CR', 'OX15', 'ORG-CG-01', 'CGC'], newCode: 'CGC' },
  'ELEC': { desc: 'Define Legal Entity – Statutory Company – Former Company Code', module: 'Enterprise', api: '/api/legal-entities', configurable: true, code: 'ELEC', helperCode: 'ELEC', aliases: ['FND-LE-CR', 'OX02', 'ORG-LE-01', 'LEC'], newCode: 'LEC' },
  'ECAC': { desc: 'Define Control Area – Former Controlling Area', module: 'Enterprise', api: '/api/control-areas', configurable: true, code: 'ECAC', helperCode: 'ECAC', aliases: ['FND-CA-CR', 'OX06', 'CAC'], newCode: 'CAC' },
  'EFCC': { desc: 'Define Facility – Operational Site – Former Plant', module: 'Enterprise', api: '/api/facilities', configurable: true, code: 'EFCC', helperCode: 'EFCC', aliases: ['FND-FAC-CR', 'OX10', 'ORG-FAC-01', 'FCC'], newCode: 'FCC' },
  'EILC': { desc: 'Define Inventory Location – Storage Zone', module: 'MM', api: '/api/inventory-locations', configurable: true, code: 'EILC', helperCode: 'EILC', aliases: ['FND-IL-CR', 'OX09', 'ORG-IL-01', 'ILC'], newCode: 'ILC' },
  'EPDC': { desc: 'Define Procurement Division – Former Purch Org', module: 'MM', api: '/api/procurement-divisions', configurable: true, code: 'EPDC', helperCode: 'EPDC', aliases: ['FND-PD-CR', 'OX08', 'ORG-PD-01', 'PDC'], newCode: 'PDC' },
  'EBTC': { desc: 'Define Buyer Team – Former Purch Group', module: 'MM', api: '/api/buyer-teams', configurable: true, code: 'EBTC', helperCode: 'EBTC', aliases: ['FND-BT-CR', 'OME4', 'ORG-BT-01', 'BTC'], newCode: 'BTC' },
  'ECOC': { desc: 'Define Commercial Organization – Former Sales Org', module: 'SD', api: '/api/commercial-orgs', configurable: true, code: 'ECOC', helperCode: 'ECOC', aliases: ['FND-CO-CR', 'OVX2', 'ORG-CO-01', 'COC'], newCode: 'COC' },
  'ESCC': { desc: 'Define Sales Channel – Former Dist Channel', module: 'SD', api: '/api/sales-channels', configurable: true, code: 'ESCC', helperCode: 'ESCC', aliases: ['FND-SC-CR', 'OVX1', 'ORG-SC-01', 'SCC'], newCode: 'SCC' },
  'EPLC': { desc: 'Define Product Line – Former Division', module: 'SD', api: '/api/product-lines', configurable: true, code: 'EPLC', helperCode: 'EPLC', aliases: ['FND-PL-CR', 'OVX5', 'ORG-PL-01', 'PLC'], newCode: 'PLC' },
  'EPUC': { desc: 'Define Profit Unit – Former Profit Center', module: 'Enterprise', api: '/api/profit-units', configurable: true, code: 'EPUC', helperCode: 'EPUC', aliases: ['FND-PU-CR', 'KE51', 'ORG-PU-01', 'PUC'], newCode: 'PUC' },
  'ECUC': { desc: 'Define Cost Unit – Former Cost Center', module: 'Enterprise', api: '/api/cost-units', configurable: true, code: 'ECUC', helperCode: 'ECUC', aliases: ['FND-CU-CR', 'CST-CU-CR', 'KS01', 'ORG-CU-01', 'CUC'], newCode: 'CUC' },
  'EBSC': { desc: 'Define Business Segment – Former Business Area', module: 'Enterprise', api: '/api/business-segments', configurable: true, code: 'EBSC', helperCode: 'EBSC', aliases: ['FND-BS-CR', 'ORG-BS-01', 'BSC'], newCode: 'BSC' },
  'EWHC': { desc: 'Define Warehouse Site – Former Warehouse Number', module: 'Enterprise', api: '/api/warehouse-sites', configurable: true, code: 'EWHC', helperCode: 'EWHC', aliases: ['FND-WH-CR', 'ORG-WH-01', 'WHC'], newCode: 'WHC' },
  'EDPC': { desc: 'Define Dispatch Point – Former Shipping Point', module: 'Enterprise', api: '/api/dispatch-points', configurable: true, code: 'EDPC', helperCode: 'EDPC', aliases: ['FND-DP-CR', 'ORG-DP-01', 'DPC'], newCode: 'DPC' },

  // Financial – Short
  'FCPC': { desc: 'Define Credit Policy Area – Former Credit Control Area', module: 'FICO', api: '/api/credit-policy-areas', configurable: true, code: 'FCPC', helperCode: 'FCPC', aliases: ['FIN-CP-CR', 'OB45', 'CPC'], newCode: 'CPC' },
  'FFYC': { desc: 'Define Fiscal Calendar – Former Fiscal Year Variant', module: 'FICO', api: '/api/fiscal-calendars', configurable: true, code: 'FFYC', helperCode: 'FFYC', aliases: ['FIN-FC-CR', 'OB29', 'FYC'], newCode: 'FYC' },
  'FPPC': { desc: 'Define Posting Calendar – Former Posting Period Variant', module: 'FICO', api: '/api/posting-calendars', configurable: true, code: 'FPPC', helperCode: 'FPPC', aliases: ['FIN-PC-CR', 'OBBO', 'PPC'], newCode: 'PPC' },
  'FCOA': { desc: 'Define Chart of Accounts – New Short', module: 'FICO', api: '/api/chart-of-accounts', configurable: true, code: 'FCOA', helperCode: 'FCOA', aliases: ['FIN-COA-CR', 'OB13', 'COA'], newCode: 'COA' },
  'FGLC': { desc: 'Create GL Account – New Short', module: 'FICO', api: '/api/gl-accounts', configurable: true, code: 'FGLC', helperCode: 'FGLC', aliases: ['FIN-GL-CR', 'FS00', 'GLC'], newCode: 'GLC' },
  'FCYC': { desc: 'Define Currencies – Only INR default', module: 'FICO', api: '/api/currencies', configurable: true, code: 'FCYC', helperCode: 'FCYC', aliases: ['FIN-CUR-CR', 'OY03', 'CYC'], newCode: 'CYC' },
  'FTXC': { desc: 'Define Tax Codes', module: 'FICO', api: '/api/tax-codes', configurable: true, code: 'FTXC', helperCode: 'FTXC', aliases: ['FIN-TX-CR', 'FTXP', 'TXC'], newCode: 'TXC' },

  // Foundation Material – Short
  'EMTC': { desc: 'Create Material – New Short', module: 'Foundation', api: '/api/materials', configurable: true, code: 'EMTC', helperCode: 'EMTC', aliases: ['FND-MAT-CR', 'MM01', 'MTC'], newCode: 'MTC' },
  'EUOC': { desc: 'Define Units of Measure', module: 'Foundation', api: '/api/uom', code: 'EUOC', helperCode: 'EUOC', aliases: ['FND-UOM-CR', 'CUNI', 'UOC'], newCode: 'UOC' },

  // MM – Procurement – Short
  'PPRC': { desc: 'Create Purchase Requisition – New Short', module: 'MM', api: '/api/pr', code: 'PPRC', helperCode: 'PPRC', aliases: ['PUR-PR-CR', 'ME51N', 'PRC'], newCode: 'PRC' },
  'PPOC': { desc: 'Create Purchase Order – New Short', module: 'MM', api: '/api/po', code: 'PPOC', helperCode: 'PPOC', aliases: ['PUR-PO-CR', 'ME21N', 'POC'], newCode: 'POC' },
  'IGRC': { desc: 'Goods Receipt Post – New Short', module: 'MM', api: '/api/gr', code: 'IGRC', helperCode: 'IGRC', aliases: ['INV-GR-PS', 'MIGO', 'GRC'], newCode: 'GRC' },
  'PIVC': { desc: 'Invoice Verification Post – New Short', module: 'MM', api: '/api/iv', code: 'PIVC', helperCode: 'PIVC', aliases: ['PUR-IV-PS', 'MIRO', 'IVC'], newCode: 'IVC' },

  // SD – Sales – Short
  'SSOC': { desc: 'Create Sales Order – New Short', module: 'SD', api: '/api/sales-orders', code: 'SSOC', helperCode: 'SSOC', aliases: ['SAL-SO-CR', 'VA01', 'SOC'], newCode: 'SOC' },
  'SDLC': { desc: 'Create Outbound Delivery – New Short', module: 'SD', api: '/api/delivery', code: 'SDLC', helperCode: 'SDLC', aliases: ['SAL-DL-CR', 'VL01N', 'DLC'], newCode: 'DLC' },
  'SBLC': { desc: 'Create Billing Document – New Short', module: 'SD', api: '/api/billing', code: 'SBLC', helperCode: 'SBLC', aliases: ['SAL-BL-PS', 'VF01', 'BLC'], newCode: 'BLC' },

  // PP – Manufacturing – Short
  'MBMC': { desc: 'Create BOM – New Short', module: 'PP', api: '/api/bom', code: 'MBMC', helperCode: 'MBMC', aliases: ['MFG-BOM-CR', 'CS01', 'BMC'], newCode: 'BMC' },
  'MWCC': { desc: 'Create Work Center – New Short', module: 'PP', api: '/api/work-centers', code: 'MWCC', helperCode: 'MWCC', aliases: ['MFG-WC-CR', 'CR01', 'WCC'], newCode: 'WCC' },
  'MRTC': { desc: 'Create Routing – New Short', module: 'PP', api: '/api/routings', code: 'MRTC', helperCode: 'MRTC', aliases: ['MFG-RTG-CR', 'CA01', 'RTC'], newCode: 'RTC' },
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
