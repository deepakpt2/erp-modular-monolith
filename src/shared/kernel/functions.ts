/**
 * ERP Function Mapping – All functions have helper code to identify function
 * Function is destination (e.g., Create Purchase Order), code is just helper (e.g., PUR-PO-CR primary, alias ME21N)
 * New intuitive system: MODULE-OBJECT-ACTION – own IP, not SAP
 * Old SAP-like codes kept as alias for search compatibility
 * Searching alias (e.g., OX02, ME21N) redirects to background function with new primary code
 */

export const FUNCTION_MAP: Record<string, { desc: string; module: string; api?: string; configurable?: boolean; code?: string; helperCode?: string; aliases?: string[]; newCode?: string }> = {
  // Foundation – Enterprise Structure – New Intuitive Primary FND-*
  'FND-CG-CR': { desc: 'Define Company Group – Enterprise Structure – New Intuitive', module: 'Enterprise', api: '/api/company-groups', configurable: true, code: 'FND-CG-CR', helperCode: 'FND-CG-CR', aliases: ['OX15', 'ORG-CG-01'], newCode: 'FND-CG-CR' },
  'FND-LE-CR': { desc: 'Define Legal Entity – Statutory Company – Former Company Code T001 – Configurable', module: 'Enterprise', api: '/api/legal-entities', configurable: true, code: 'FND-LE-CR', helperCode: 'FND-LE-CR', aliases: ['OX02', 'ORG-LE-01'], newCode: 'FND-LE-CR' },
  'FND-CA-CR': { desc: 'Define Management Control Area – Former Controlling Area', module: 'Enterprise', api: '/api/control-areas', configurable: true, code: 'FND-CA-CR', helperCode: 'FND-CA-CR', aliases: ['OX06', 'ORG-MC-01'], newCode: 'FND-CA-CR' },
  'FND-FAC-CR': { desc: 'Define Facility – Operational Site – Former Plant T001W – Configurable', module: 'Enterprise', api: '/api/facilities', configurable: true, code: 'FND-FAC-CR', helperCode: 'FND-FAC-CR', aliases: ['OX10', 'ORG-FAC-01'], newCode: 'FND-FAC-CR' },
  'FND-IL-CR': { desc: 'Define Inventory Location – Storage Zone – Former Storage Location', module: 'MM', api: '/api/inventory-locations', configurable: true, code: 'FND-IL-CR', helperCode: 'FND-IL-CR', aliases: ['OX09', 'ORG-IL-01'], newCode: 'FND-IL-CR' },
  'FND-PD-CR': { desc: 'Define Procurement Division – Former Purchasing Organization – Configurable', module: 'MM', api: '/api/procurement-divisions', configurable: true, code: 'FND-PD-CR', helperCode: 'FND-PD-CR', aliases: ['OX08', 'ORG-PD-01'], newCode: 'FND-PD-CR' },
  'FND-BT-CR': { desc: 'Define Buyer Team – Former Purchasing Group', module: 'MM', api: '/api/buyer-teams', configurable: true, code: 'FND-BT-CR', helperCode: 'FND-BT-CR', aliases: ['OME4', 'ORG-BT-01'], newCode: 'FND-BT-CR' },
  'FND-CO-CR': { desc: 'Define Commercial Organization – Former Sales Organization', module: 'SD', api: '/api/commercial-orgs', configurable: true, code: 'FND-CO-CR', helperCode: 'FND-CO-CR', aliases: ['OVX2', 'ORG-CO-01'], newCode: 'FND-CO-CR' },
  'FND-SC-CR': { desc: 'Define Sales Channel – Former Distribution Channel', module: 'SD', api: '/api/sales-channels', configurable: true, code: 'FND-SC-CR', helperCode: 'FND-SC-CR', aliases: ['OVX1', 'ORG-SC-01'], newCode: 'FND-SC-CR' },
  'FND-PL-CR': { desc: 'Define Product Line – Former Division', module: 'SD', api: '/api/product-lines', configurable: true, code: 'FND-PL-CR', helperCode: 'FND-PL-CR', aliases: ['OVX5', 'ORG-PL-01'], newCode: 'FND-PL-CR' },
  'FND-PU-CR': { desc: 'Define Profit Unit – Former Profit Center', module: 'Enterprise', api: '/api/profit-units', configurable: true, code: 'FND-PU-CR', helperCode: 'FND-PU-CR', aliases: ['KE51', 'ORG-PU-01'], newCode: 'FND-PU-CR' },
  'FND-CU-CR': { desc: 'Define Cost Unit – Former Cost Center', module: 'Enterprise', api: '/api/cost-units', configurable: true, code: 'FND-CU-CR', helperCode: 'FND-CU-CR', aliases: ['KS01', 'ORG-CU-01'], newCode: 'FND-CU-CR' },
  'FND-BS-CR': { desc: 'Define Business Segment – Former Business Area', module: 'Enterprise', api: '/api/business-segments', configurable: true, code: 'FND-BS-CR', helperCode: 'FND-BS-CR', aliases: ['ORG-BS-01'], newCode: 'FND-BS-CR' },
  'FND-WH-CR': { desc: 'Define Warehouse Site – Former Warehouse Number', module: 'Enterprise', api: '/api/warehouse-sites', configurable: true, code: 'FND-WH-CR', helperCode: 'FND-WH-CR', aliases: ['ORG-WH-01'], newCode: 'FND-WH-CR' },
  'FND-DP-CR': { desc: 'Define Dispatch Point – Former Shipping Point', module: 'Enterprise', api: '/api/dispatch-points', configurable: true, code: 'FND-DP-CR', helperCode: 'FND-DP-CR', aliases: ['ORG-DP-01'], newCode: 'FND-DP-CR' },

  // Legacy aliases kept for backward search – point to new primary
  'OX15': { desc: 'Define Company Group – Alias for FND-CG-CR', module: 'Enterprise', api: '/api/company-groups', code: 'OX15', helperCode: 'FND-CG-CR', aliases: ['FND-CG-CR'] },
  'OX02': { desc: 'Define Legal Entity – Alias for FND-LE-CR', module: 'Enterprise', api: '/api/legal-entities', code: 'OX02', helperCode: 'FND-LE-CR', aliases: ['FND-LE-CR'] },
  'OX10': { desc: 'Define Facility – Alias for FND-FAC-CR', module: 'Enterprise', api: '/api/facilities', code: 'OX10', helperCode: 'FND-FAC-CR', aliases: ['FND-FAC-CR'] },
  'OX09': { desc: 'Define Inventory Location – Alias for FND-IL-CR', module: 'MM', api: '/api/inventory-locations', code: 'OX09', helperCode: 'FND-IL-CR', aliases: ['FND-IL-CR'] },
  'OX08': { desc: 'Define Procurement Division – Alias for FND-PD-CR', module: 'MM', api: '/api/procurement-divisions', code: 'OX08', helperCode: 'FND-PD-CR', aliases: ['FND-PD-CR'] },
  'OME4': { desc: 'Define Buyer Team – Alias for FND-BT-CR', module: 'MM', api: '/api/buyer-teams', code: 'OME4', helperCode: 'FND-BT-CR', aliases: ['FND-BT-CR'] },
  'OVX2': { desc: 'Define Commercial Org – Alias for FND-CO-CR', module: 'SD', api: '/api/commercial-orgs', code: 'OVX2', helperCode: 'FND-CO-CR', aliases: ['FND-CO-CR'] },
  'OVX1': { desc: 'Define Sales Channel – Alias for FND-SC-CR', module: 'SD', api: '/api/sales-channels', code: 'OVX1', helperCode: 'FND-SC-CR', aliases: ['FND-SC-CR'] },

  // FICO - Chart of Accounts - New Intuitive
  'FIN-COA-CR': { desc: 'Define Chart of Accounts – New Intuitive', module: 'FICO', api: '/api/chart-of-accounts', configurable: true, code: 'FIN-COA-CR', helperCode: 'FIN-COA-CR', aliases: ['OB13'], newCode: 'FIN-COA-CR' },
  'FIN-GL-CR': { desc: 'Create GL Account – New Intuitive', module: 'FICO', api: '/api/gl-accounts', configurable: true, code: 'FIN-GL-CR', helperCode: 'FIN-GL-CR', aliases: ['FS00'], newCode: 'FIN-GL-CR' },
  'FIN-CP-CR': { desc: 'Define Credit Policy Area – Former Credit Control Area', module: 'FICO', api: '/api/credit-policy-areas', configurable: true, code: 'FIN-CP-CR', helperCode: 'FIN-CP-CR', aliases: ['OB45'], newCode: 'FIN-CP-CR' },
  'FIN-FC-CR': { desc: 'Define Fiscal Calendar – Former Fiscal Year Variant', module: 'FICO', api: '/api/fiscal-calendars', configurable: true, code: 'FIN-FC-CR', helperCode: 'FIN-FC-CR', aliases: ['OB29'], newCode: 'FIN-FC-CR' },
  'FIN-PC-CR': { desc: 'Define Posting Calendar – Former Posting Period Variant', module: 'FICO', api: '/api/posting-calendars', configurable: true, code: 'FIN-PC-CR', helperCode: 'FIN-PC-CR', aliases: ['OBBO'], newCode: 'FIN-PC-CR' },
  'FIN-CUR-CR': { desc: 'Define Currencies – Only INR default', module: 'FICO', api: '/api/currencies', configurable: true, code: 'FIN-CUR-CR', helperCode: 'FIN-CUR-CR', aliases: ['OY03'], newCode: 'FIN-CUR-CR' },
  'FIN-TX-CR': { desc: 'Define Tax Codes', module: 'FICO', api: '/api/tax-codes', configurable: true, code: 'FIN-TX-CR', helperCode: 'FIN-TX-CR', aliases: ['FTXP'], newCode: 'FIN-TX-CR' },

  // Foundation Material – New Intuitive
  'FND-MAT-CR': { desc: 'Create Material – New Intuitive', module: 'Foundation', api: '/api/materials', configurable: true, code: 'FND-MAT-CR', helperCode: 'FND-MAT-CR', aliases: ['MM01'], newCode: 'FND-MAT-CR' },
  'FND-MAT-CH': { desc: 'Change Material', module: 'Foundation', api: '/api/materials', code: 'FND-MAT-CH', helperCode: 'FND-MAT-CH', aliases: ['MM02'] },
  'FND-MAT-DP': { desc: 'Display Material', module: 'Foundation', api: '/api/materials', code: 'FND-MAT-DP', helperCode: 'FND-MAT-DP', aliases: ['MM03'] },
  'FND-UOM-CR': { desc: 'Define Units of Measure', module: 'Foundation', api: '/api/uom', code: 'FND-UOM-CR', helperCode: 'FND-UOM-CR', aliases: ['CUNI'] },

  // MM – Procurement – New Intuitive
  'PUR-PR-CR': { desc: 'Create Purchase Requisition – New Intuitive', module: 'MM', api: '/api/pr', code: 'PUR-PR-CR', helperCode: 'PUR-PR-CR', aliases: ['ME51N'], newCode: 'PUR-PR-CR' },
  'PUR-PO-CR': { desc: 'Create Purchase Order – New Intuitive', module: 'MM', api: '/api/po', code: 'PUR-PO-CR', helperCode: 'PUR-PO-CR', aliases: ['ME21N'], newCode: 'PUR-PO-CR' },
  'INV-GR-PS': { desc: 'Goods Receipt Post – New Intuitive', module: 'MM', api: '/api/gr', code: 'INV-GR-PS', helperCode: 'INV-GR-PS', aliases: ['MIGO'], newCode: 'INV-GR-PS' },
  'PUR-IV-PS': { desc: 'Invoice Verification Post – New Intuitive', module: 'MM', api: '/api/iv', code: 'PUR-IV-PS', helperCode: 'PUR-IV-PS', aliases: ['MIRO'], newCode: 'PUR-IV-PS' },

  // SD – Sales – New Intuitive
  'SAL-SO-CR': { desc: 'Create Sales Order – New Intuitive', module: 'SD', api: '/api/sales-orders', code: 'SAL-SO-CR', helperCode: 'SAL-SO-CR', aliases: ['VA01'], newCode: 'SAL-SO-CR' },
  'SAL-DL-CR': { desc: 'Create Outbound Delivery – New Intuitive', module: 'SD', api: '/api/delivery', code: 'SAL-DL-CR', helperCode: 'SAL-DL-CR', aliases: ['VL01N'], newCode: 'SAL-DL-CR' },
  'SAL-BL-PS': { desc: 'Create Billing Document – New Intuitive', module: 'SD', api: '/api/billing', code: 'SAL-BL-PS', helperCode: 'SAL-BL-PS', aliases: ['VF01'], newCode: 'SAL-BL-PS' },

  // PP – Manufacturing – New Intuitive
  'MFG-BOM-CR': { desc: 'Create BOM – New Intuitive', module: 'PP', api: '/api/bom', code: 'MFG-BOM-CR', helperCode: 'MFG-BOM-CR', aliases: ['CS01'], newCode: 'MFG-BOM-CR' },
  'MFG-WC-CR': { desc: 'Create Work Center – New Intuitive', module: 'PP', api: '/api/work-centers', code: 'MFG-WC-CR', helperCode: 'MFG-WC-CR', aliases: ['CR01'], newCode: 'MFG-WC-CR' },
  'MFG-RTG-CR': { desc: 'Create Routing – New Intuitive', module: 'PP', api: '/api/routings', code: 'MFG-RTG-CR', helperCode: 'MFG-RTG-CR', aliases: ['CA01'], newCode: 'MFG-RTG-CR' },
};

export function getCodeForFunction(route: string): string {
  // Find function by route and return new intuitive code
  for (const [code, info] of Object.entries(FUNCTION_MAP)) {
    if (info.api && route.includes(info.api.replace('/api/', ''))) return code;
  }
  return 'FND-UNKNOWN';
}

export function getAliasesForCode(code: string): string[] {
  const info = FUNCTION_MAP[code];
  return info?.aliases || [];
}
