/**
 * Frontend Page Permissions – FRPC – sitewide RBAC for UI
 * Maps function code to required permission and roles
 * Used by SingleCodePage and Navigator to block view and show unauthorized message
 */

export interface PagePermission {
  code: string;
  permission: string;
  roles: string[];
  module: string;
  description: string;
}

// Mapping from function code to permission – same as API routePermissions but for UI codes
export const PAGE_PERMISSIONS: PagePermission[] = [
  // FOUNDATION – MDM can access, but not HR
  { code: 'EMTC', permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], module: 'FOUNDATION', description: 'Create Product – MM01 – MATERIAL_CREATE' },
  { code: 'EMTE', permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], module: 'FOUNDATION', description: 'Change Product – MATERIAL_CREATE' },
  { code: 'EMTV', permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'WAREHOUSE', 'SALES', 'MANAGER'], module: 'FOUNDATION', description: 'Display Product – MATERIAL_VIEW' },
  { code: 'EMTL', permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'WAREHOUSE', 'SALES', 'MANAGER'], module: 'FOUNDATION', description: 'Product List – MATERIAL_VIEW' },
  { code: 'EMTP', permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER'], module: 'FOUNDATION', description: 'Product Types – MATERIAL_CREATE' },
  { code: 'EMGC', permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER'], module: 'FOUNDATION', description: 'Product Categories – MATERIAL_CREATE' },
  { code: 'EUOC', permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'WAREHOUSE'], module: 'FOUNDATION', description: 'UoM – MATERIAL_VIEW' },
  { code: 'ELTC', permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'WAREHOUSE', 'ADMIN', 'OWNER'], module: 'FOUNDATION', description: 'Lot Management – MATERIAL_VIEW' },
  { code: 'ISTV', permission: 'MATERIAL_VIEW', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER', 'MATERIAL_MANAGER'], module: 'FOUNDATION', description: 'Stock Overview – ISTV – MMBE – MATERIAL_VIEW – SAP standard – requires WAREHOUSE,ADMIN,OWNER,MANAGER,MATERIAL_MANAGER – MASTER_DATA_MANAGER alone not enough – SoD – per user error Forbidden' },
  { code: 'EPAC', permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'SALES'], module: 'FOUNDATION', description: 'Partner Account – MATERIAL_VIEW' },
  { code: 'PSUC', permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER'], module: 'FOUNDATION', description: 'Supplier – MATERIAL_VIEW' },
  { code: 'SCUC', permission: 'CUSTOMER_VIEW', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER', 'MASTER_DATA_MANAGER'], module: 'FOUNDATION', description: 'Customer – XD01 – CUSTOMER_VIEW – SAP standard – V_KNA1 – basic customer master MDM allowed, but FULL with Sales Area + Partner + Pricing + Credit requires SALES – SoD – MDM can view basic, SALES for pricing/credit' },

  // Enterprise Structure – foundation
  { code: 'ECGC', permission: 'MATERIAL_CREATE', roles: ['ADMIN', 'OWNER'], module: 'FOUNDATION', description: 'Company Group – OX02 – MATERIAL_CREATE – SAP standard IMG – ADMIN only – MDM not allowed – enterprise structure' },
  { code: 'ELEC', permission: 'MATERIAL_CREATE', roles: ['ADMIN', 'OWNER'], module: 'FOUNDATION', description: 'Legal Entity – OX02 – MATERIAL_CREATE – SAP standard IMG – ADMIN only' },
  { code: 'EFCC', permission: 'MATERIAL_CREATE', roles: ['ADMIN', 'OWNER'], module: 'FOUNDATION', description: 'Facility – OX02 – MATERIAL_CREATE – SAP standard IMG – ADMIN only' },
  { code: 'EILC', permission: 'MATERIAL_CREATE', roles: ['ADMIN', 'OWNER', 'MATERIAL_MANAGER', 'WAREHOUSE'], module: 'FOUNDATION', description: 'Inventory Location – OX09 – MATERIAL_CREATE – SAP standard – ADMIN/WAREHOUSE' },
  { code: 'EPDC', permission: 'MATERIAL_VIEW', roles: ['ADMIN', 'OWNER', 'PURCHASER', 'MATERIAL_MANAGER'], module: 'FOUNDATION', description: 'Procurement Division – MATERIAL_VIEW' },
  { code: 'EBTC', permission: 'MATERIAL_VIEW', roles: ['ADMIN', 'OWNER', 'PURCHASER', 'MATERIAL_MANAGER'], module: 'FOUNDATION', description: 'Buyer Team – MATERIAL_VIEW' },
  { code: 'ECOC', permission: 'MATERIAL_VIEW', roles: ['ADMIN', 'OWNER', 'SALES', 'MATERIAL_MANAGER'], module: 'FOUNDATION', description: 'Commercial Org – MATERIAL_VIEW' },
  { code: 'ESCC', permission: 'MATERIAL_VIEW', roles: ['ADMIN', 'OWNER', 'SALES', 'MATERIAL_MANAGER'], module: 'FOUNDATION', description: 'Sales Channel – MATERIAL_VIEW' },
  { code: 'EPLC', permission: 'MATERIAL_VIEW', roles: ['ADMIN', 'OWNER', 'SALES', 'MATERIAL_MANAGER'], module: 'FOUNDATION', description: 'Product Line – MATERIAL_VIEW' },
  { code: 'EPUC', permission: 'MATERIAL_VIEW', roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'MATERIAL_MANAGER'], module: 'FOUNDATION', description: 'Profit Unit – MATERIAL_VIEW' },

  // MM
  { code: 'PPRC', permission: 'PR_CREATE', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'Create PR – PR_CREATE' },
  { code: 'PPRE', permission: 'PR_CREATE', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'Change PR – PR_CREATE' },
  { code: 'PPRV', permission: 'PR_VIEW', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER', 'WAREHOUSE'], module: 'MM', description: 'Display PR – PR_VIEW' },
  { code: 'PPOC', permission: 'PO_CREATE', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'Create PO – PO_CREATE' },
  { code: 'PPOE', permission: 'PO_CREATE', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'Change PO – PO_CREATE' },
  { code: 'PPOV', permission: 'PO_VIEW', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER', 'WAREHOUSE'], module: 'MM', description: 'Display PO – PO_VIEW' },
  { code: 'IGRC', permission: 'GR_POST', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'Goods Receipt – GR_POST' },
  { code: 'PIVC', permission: 'IV_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'Invoice Verification – IV_POST' },
  { code: 'IPIC', permission: 'GR_POST', roles: ['WAREHOUSE', 'ADMIN', 'OWNER'], module: 'MM', description: 'Physical Inventory – GR_POST' },

  // SD
  { code: 'SDLC', permission: 'DELIVERY_CREATE', roles: ['WAREHOUSE', 'SALES', 'ADMIN', 'OWNER', 'MANAGER'], module: 'SD', description: 'Outbound Deliveries – VL01N – SDLC – General ERP – T0 BLOCKING – PGI 601 + COGS GBB/BSX – DELIVERY_CREATE – SAP standard LE – V_LIKP – requires WAREHOUSE,SALES – MASTER_DATA_MANAGER NOT allowed – SoD' },
  { code: 'SBLC', permission: 'BILLING_CREATE', roles: ['SALES', 'ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER'], module: 'SD', description: 'Billing – VF01 – SBLC – BILLING_CREATE – SAP standard – requires SALES,ACCOUNTANT – MDM not allowed – SoD' },
  { code: 'SSOC', permission: 'SALES_CREATE', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER'], module: 'SD', description: 'Create Sales Order – SALES_CREATE' },
  { code: 'SSOE', permission: 'SALES_CREATE', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER'], module: 'SD', description: 'Change Sales Order – SALES_CREATE' },
  { code: 'SSOV', permission: 'SALES_VIEW', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER'], module: 'SD', description: 'Display Sales Order – SALES_VIEW' },

  // PP
  { code: 'MBMC', permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'ADMIN', 'OWNER', 'MANAGER', 'PRODUCTION'], module: 'PP', description: 'Create BOM – MATERIAL_CREATE' },
  { code: 'MWCC', permission: 'MATERIAL_VIEW', roles: ['PRODUCTION', 'ADMIN', 'OWNER'], module: 'PP', description: 'Work Center – MATERIAL_VIEW' },
  { code: 'MRTC', permission: 'MATERIAL_VIEW', roles: ['PRODUCTION', 'ADMIN', 'OWNER'], module: 'PP', description: 'Routing – MATERIAL_VIEW' },
  { code: 'MMOC', permission: 'MATERIAL_CREATE', roles: ['PRODUCTION', 'ADMIN', 'OWNER', 'MANAGER'], module: 'PP', description: 'Production Order – MATERIAL_CREATE' },
  { code: 'MMRP', permission: 'MATERIAL_CREATE', roles: ['PRODUCTION', 'MATERIAL_MANAGER', 'ADMIN', 'OWNER'], module: 'PP', description: 'MRP Run – MATERIAL_CREATE' },
  { code: 'MKTC', permission: 'MATERIAL_CREATE', roles: ['PRODUCTION', 'WAREHOUSE', 'ADMIN', 'OWNER'], module: 'PP', description: 'Kitting – MATERIAL_CREATE' },

  // FICO
  { code: 'FFYC', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Fiscal Calendar – GL_VIEW' },
  { code: 'FEXC', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Exchange Rates – GL_VIEW' },
  { code: 'FNRC', permission: 'MATERIAL_CREATE', roles: ['ADMIN', 'OWNER', 'MATERIAL_MANAGER'], module: 'FICO', description: 'Number Ranges – MATERIAL_CREATE' },
  { code: 'FTGC', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Tax Groups – GL_VIEW' },
  { code: 'FTXC', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Tax Codes – GL_VIEW' },
  { code: 'FCOA', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Chart of Accounts – GL_VIEW' },
  { code: 'FGLC', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER', 'AUDITOR'], module: 'FICO', description: 'G/L Account – GL_VIEW' },
  { code: 'FCCA', permission: 'CCA_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER', 'HR'], module: 'FICO', description: 'Cost Centers – CCA_VIEW' },
  { code: 'FCYC', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Currencies – GL_VIEW' },
  { code: 'FPPC', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Posting Period Variant – GL_POST' },
  { code: 'FPPE', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Posting Period Control – GL_POST' },
  { code: 'FFSV', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Field Status Variant – GL_POST' },
  { code: 'FFSG', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Field Status Groups – GL_POST' },
  { code: 'FAPT', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Payment Terms – GL_VIEW' },
  { code: 'FPYP', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Payment Processing – GL_POST' },
  { code: 'CCUL', permission: 'CCA_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER'], module: 'FICO', description: 'CCA Report – CCA_VIEW' },
  { code: 'CCRP', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Costing Run – GL_POST' },

  // HR – sensitive
  { code: 'HHEC', permission: 'EMPLOYEE_CREATE', roles: ['HR', 'HR_MANAGER', 'ADMIN', 'OWNER'], module: 'HR', description: 'Maintain HR Master – PA30 – EMPLOYEE_CREATE – HR only' },
  { code: 'HHEV', permission: 'EMPLOYEE_VIEW', roles: ['HR', 'HR_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], module: 'HR', description: 'Display HR Master – PA20 – EMPLOYEE_VIEW – HR only' },
  { code: 'HPYC', permission: 'PAYROLL_RUN', roles: ['HR', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'OWNER'], module: 'HR', description: 'Payroll Run – PC00 – PAYROLL_RUN – HR only – not master data manager' },

  // AUDIT
  { code: 'AFLW', permission: 'ADMIN_ALL', roles: ['ADMIN', 'OWNER', 'AUDITOR', 'MANAGER'], module: 'AUDIT', description: 'Document Flow – ADMIN_ALL' },
  { code: 'AALG', permission: 'ADMIN_ALL', roles: ['ADMIN', 'OWNER', 'AUDITOR'], module: 'AUDIT', description: 'Audit Log – ADMIN_ALL' },
  { code: 'FWFL', permission: 'PR_VIEW', roles: ['ADMIN', 'OWNER', 'MANAGER', 'PURCHASER', 'ACCOUNTANT', 'SALES', 'HR'], module: 'FOUNDATION', description: 'Workflow Inbox – PR_VIEW' },
];

export function getPagePermission(code: string): PagePermission | null {
  return PAGE_PERMISSIONS.find(p => p.code === code) || null;
}

export function canUserAccessPage(me: any, code: string): { allowed: boolean; reason?: string; requiredPermission?: string; requiredRoles?: string[] } {
  const perm = getPagePermission(code);
  if (!perm) {
    // No specific mapping – allow all authenticated
    return { allowed: true };
  }

  const isAdmin = me?.isAdmin || me?.roles?.includes('ADMIN') || me?.roles?.includes('OWNER') || me?.simpleRole === 'ADMIN' || me?.simpleRole === 'OWNER';
  if (isAdmin) return { allowed: true };

  const userRoles: string[] = me?.roles || [];
  const simpleRole = me?.simpleRole || '';

  // Check if user has required role
  const hasRole = perm.roles.some(r => userRoles.includes(r) || simpleRole === r);

  // Check permission
  const hasPerm = me?.permissions?.includes(perm.permission) || me?.permissions?.includes('ADMIN_ALL');

  // Special handling for MASTER_DATA_MANAGER trying to access Inventory (ISTV) – requires MATERIAL_MANAGER, not just MASTER_DATA_MANAGER
  if (code === 'ISTV') {
    // Inventory Stock Overview – requires WAREHOUSE,ADMIN,OWNER,MANAGER,MATERIAL_MANAGER – per error message, MASTER_DATA_MANAGER alone not enough
    const allowedForISTV = ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER', 'MATERIAL_MANAGER'];
    const hasISTVRole = allowedForISTV.some(r => userRoles.includes(r) || simpleRole === r);
    if (!hasISTVRole && !hasPerm) {
      return {
        allowed: false,
        reason: `Forbidden – requires permission ${perm.permission} – roles [${allowedForISTV.join(',')}] – current role ${simpleRole} roles [${userRoles.join(',')}] – ${perm.description} – SoD`,
        requiredPermission: perm.permission,
        requiredRoles: allowedForISTV,
      };
    }
    return { allowed: true };
  }

  if (hasRole || hasPerm) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Forbidden – requires permission ${perm.permission} – roles [${perm.roles.join(',')}] – current role ${simpleRole} roles [${userRoles.join(',')}] – ${perm.description} – SoD`,
    requiredPermission: perm.permission,
    requiredRoles: perm.roles,
  };
}
