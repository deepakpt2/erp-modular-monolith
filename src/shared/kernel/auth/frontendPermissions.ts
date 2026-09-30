/**
 * Frontend Page RBAC – sitewide – FRPC
 * Maps frontend ERP routes to required permission and roles
 * Used by client-layout to completely block view and show unauthorized message
 * If user came to a page not allowed, show unauthorized for this transaction, contact administrator
 * Also used by navigator to remove pages without permission
 */

export interface FrontendPermission {
  pattern: RegExp;
  permission: string;
  roles: string[];
  code: string;
  description: string;
}

export const FRONTEND_PERMISSIONS: FrontendPermission[] = [
  // HR – sensitive – only HR, ADMIN, OWNER
  { pattern: /\/hr\/payroll-run/, permission: 'PAYROLL_RUN', roles: ['HR', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'OWNER'], code: 'HPYC', description: 'Payroll Run – PC00 – PAYROLL_RUN – HR only – not master data manager – SoD' },
  { pattern: /\/hr\/payroll/, permission: 'EMPLOYEE_VIEW', roles: ['HR', 'HR_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], code: 'HHEC', description: 'HR Master – PA30 – EMPLOYEE_VIEW – HR only – MDM cannot access' },
  { pattern: /\/hr\/employees/, permission: 'EMPLOYEE_VIEW', roles: ['HR', 'HR_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], code: 'HHEC', description: 'Employee Master – PA30 – EMPLOYEE_VIEW' },
  { pattern: /\/hr\//, permission: 'EMPLOYEE_VIEW', roles: ['HR', 'HR_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], code: 'HHEC', description: 'HR module – EMPLOYEE_VIEW' },

  // FOUNDATION – Materials – MDM allowed, but Inventory requires WAREHOUSE/MATERIAL_MANAGER per error
  { pattern: /\/foundation\/materials/, permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'MANAGER', 'PURCHASER', 'WAREHOUSE', 'SALES'], code: 'EMTC', description: 'Product Master – MATERIAL_VIEW' },
  { pattern: /\/foundation\/material-types/, permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER'], code: 'EMTP', description: 'Product Types – MATERIAL_CREATE' },
  { pattern: /\/foundation\/material-categories/, permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER'], code: 'EMGC', description: 'Product Categories – MATERIAL_CREATE' },
  { pattern: /\/foundation\/stock/, permission: 'MATERIAL_VIEW', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER', 'MATERIAL_MANAGER'], code: 'ISTV', description: 'Stock Overview – ISTV – MATERIAL_VIEW – requires WAREHOUSE,ADMIN,OWNER,MANAGER,MATERIAL_MANAGER – MASTER_DATA_MANAGER alone not enough – per user error' },
  { pattern: /\/foundation\/uom/, permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'WAREHOUSE'], code: 'EUOC', description: 'UoM – MATERIAL_VIEW' },
  { pattern: /\/foundation\/lots/, permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'WAREHOUSE', 'ADMIN', 'OWNER'], code: 'ELTC', description: 'Lots – MATERIAL_VIEW' },
  { pattern: /\/foundation\/partners/, permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'SALES'], code: 'EPAC', description: 'Partner Account – MATERIAL_VIEW' },
  { pattern: /\/foundation\/suppliers/, permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER'], code: 'PSUC', description: 'Supplier – MATERIAL_VIEW' },
  { pattern: /\/foundation\/customers/, permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'SALES'], code: 'SCUC', description: 'Customer – MATERIAL_VIEW' },
  { pattern: /\/foundation\/company-groups/, permission: 'MATERIAL_CREATE', roles: ['ADMIN', 'OWNER', 'MATERIAL_MANAGER', 'MASTER_DATA_MANAGER'], code: 'ECGC', description: 'Company Group – MATERIAL_CREATE' },
  { pattern: /\/foundation\/legal-entities/, permission: 'MATERIAL_CREATE', roles: ['ADMIN', 'OWNER', 'MATERIAL_MANAGER'], code: 'ELEC', description: 'Legal Entity – MATERIAL_CREATE' },
  { pattern: /\/foundation\/facilities/, permission: 'MATERIAL_CREATE', roles: ['ADMIN', 'OWNER', 'MATERIAL_MANAGER'], code: 'EFCC', description: 'Facility – MATERIAL_CREATE' },
  { pattern: /\/foundation\/inventory-locations/, permission: 'MATERIAL_CREATE', roles: ['ADMIN', 'OWNER', 'MATERIAL_MANAGER', 'WAREHOUSE'], code: 'EILC', description: 'Inventory Location – MATERIAL_CREATE' },

  // MM
  { pattern: /\/mm\/pr/, permission: 'PR_VIEW', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER', 'WAREHOUSE'], code: 'PPRC', description: 'PR – PR_VIEW – Purchaser' },
  { pattern: /\/mm\/po/, permission: 'PO_VIEW', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER', 'WAREHOUSE'], code: 'PPOC', description: 'PO – PO_VIEW' },
  { pattern: /\/mm\/gr/, permission: 'GR_VIEW', roles: ['WAREHOUSE', 'PURCHASER', 'ADMIN', 'OWNER', 'MANAGER'], code: 'IGRC', description: 'GR – GR_VIEW – Warehouse' },
  { pattern: /\/mm\/iv/, permission: 'IV_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER', 'PURCHASER'], code: 'PIVC', description: 'IV – IV_VIEW' },
  { pattern: /\/mm\/sto/, permission: 'PO_VIEW', roles: ['PURCHASER', 'WAREHOUSE', 'ADMIN', 'OWNER'], code: 'PSTC', description: 'STO – PO_VIEW' },
  { pattern: /\/mm\/physical-inventory/, permission: 'GR_VIEW', roles: ['WAREHOUSE', 'ADMIN', 'OWNER'], code: 'IPIC', description: 'Physical Inventory – GR_VIEW' },

  // SD
  { pattern: /\/sales/, permission: 'SALES_VIEW', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER'], code: 'SSOC', description: 'Sales – SALES_VIEW' },
  { pattern: /\/sd\/delivery/, permission: 'DELIVERY_CREATE', roles: ['WAREHOUSE', 'SALES', 'ADMIN', 'OWNER'], code: 'SDLC', description: 'Delivery – DELIVERY_CREATE' },
  { pattern: /\/sd\/billing/, permission: 'BILLING_CREATE', roles: ['ACCOUNTANT', 'SALES', 'ADMIN', 'OWNER'], code: 'SBLC', description: 'Billing – BILLING_CREATE' },

  // FICO
  { pattern: /\/fico\/gl-accounts/, permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER', 'AUDITOR'], code: 'FGLC', description: 'GL Accounts – GL_VIEW' },
  { pattern: /\/fico\/chart-of-accounts/, permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'FCOA', description: 'Chart of Accounts – GL_VIEW' },
  { pattern: /\/fico\/cost-centers/, permission: 'CCA_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER', 'HR'], code: 'FCCA', description: 'Cost Centers – CCA_VIEW' },
  { pattern: /\/fico\/number-ranges/, permission: 'MATERIAL_CREATE', roles: ['ADMIN', 'OWNER', 'MATERIAL_MANAGER'], code: 'FNRC', description: 'Number Ranges – MATERIAL_CREATE' },
  { pattern: /\/fico\//, permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'FICO', description: 'FICO module – GL_VIEW – Accountant/Admin only' },

  // PP
  { pattern: /\/pp\/bom/, permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'ADMIN', 'OWNER', 'MANAGER', 'PRODUCTION'], code: 'MBMC', description: 'BOM – MATERIAL_VIEW' },
  { pattern: /\/pp\//, permission: 'MATERIAL_VIEW', roles: ['PRODUCTION', 'MATERIAL_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], code: 'PP', description: 'PP module – MATERIAL_VIEW' },

  // System – Admin only
  { pattern: /\/system\/jobs/, permission: 'ADMIN_ALL', roles: ['ADMIN', 'OWNER', 'MANAGER'], code: 'FBJM', description: 'Jobs – ADMIN_ALL' },
  { pattern: /\/system\/locks/, permission: 'ADMIN_ALL', roles: ['ADMIN', 'OWNER', 'MANAGER'], code: 'FELM', description: 'Locks – ADMIN_ALL' },
  { pattern: /\/audit\//, permission: 'ADMIN_ALL', roles: ['ADMIN', 'OWNER', 'AUDITOR', 'MANAGER'], code: 'AFLW', description: 'Audit – ADMIN_ALL' },

  // Navigator and docs – allow all authenticated
  { pattern: /\/navigator/, permission: 'MATERIAL_VIEW', roles: ['*'], code: 'NAV', description: 'Navigator – allow all authenticated – but filters children' },
  { pattern: /\/foundation\/enterprise-structure/, permission: 'MATERIAL_VIEW', roles: ['*'], code: 'ECAC', description: 'Enterprise Structure – allow all' },
];

export function getFrontendPermission(pathname: string): FrontendPermission | null {
  for (const fp of FRONTEND_PERMISSIONS) {
    if (fp.pattern.test(pathname)) {
      return fp;
    }
  }
  return null;
}
