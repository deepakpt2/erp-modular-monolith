/**
 * Sitewide RBAC Route Permissions – FRPC own IP – Foundation Role/Permission Checks
 * Implements authorization for ALL routes – industry standard – SoD segregation of duties
 * Master data manager cannot access HR payroll – only FOUNDATION permissions
 * HR cannot access MM purchasing unless granted – etc.
 * 
 * Mapping: API path pattern -> required permission per HTTP method
 * Used by requireApiAuth to auto-enforce RBAC sitewide – defense in depth
 */

export interface RoutePermission {
  pattern: RegExp;
  method: string | string[]; // GET, POST, PUT, DELETE, or * for all
  permission: string; // e.g., PAYROLL_RUN, MATERIAL_CREATE, PR_CREATE, etc.
  roles?: string[]; // allowed roles – e.g., ['HR', 'ADMIN', 'OWNER']
  description: string;
}

// Sitewide mapping – order matters – first match wins – specific before generic
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // HR – sensitive – only HR, ADMIN, OWNER
  { pattern: /^\/api\/payroll-run/, method: '*', permission: 'PAYROLL_RUN', roles: ['HR', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], description: 'Payroll Run – PC00 – PAYROLL_RUN – HR only – not master data manager' },
  { pattern: /^\/api\/payroll/, method: '*', permission: 'PAYROLL_RUN', roles: ['HR', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'OWNER'], description: 'Payroll – PC00 – PAYROLL_RUN – HR only' },
  { pattern: /^\/api\/hr\/employees/, method: ['GET'], permission: 'EMPLOYEE_VIEW', roles: ['HR', 'HR_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], description: 'HR Employees view – PA30 – EMPLOYEE_VIEW – HR only' },
  { pattern: /^\/api\/hr\/employees/, method: ['POST', 'PUT', 'DELETE'], permission: 'EMPLOYEE_CREATE', roles: ['HR', 'HR_MANAGER', 'ADMIN', 'OWNER'], description: 'HR Employees create – PA30 – EMPLOYEE_CREATE – HR only' },
  { pattern: /^\/api\/hr\/org-units/, method: '*', permission: 'EMPLOYEE_VIEW', roles: ['HR', 'ADMIN', 'OWNER', 'MANAGER'], description: 'HR Org Units – EMPLOYEE_VIEW' },
  { pattern: /^\/api\/hr\/positions/, method: '*', permission: 'EMPLOYEE_VIEW', roles: ['HR', 'ADMIN', 'OWNER', 'MANAGER'], description: 'HR Positions – EMPLOYEE_VIEW' },

  // MM – Purchasing
  { pattern: /^\/api\/pr/, method: ['GET'], permission: 'PR_VIEW', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER', 'WAREHOUSE'], description: 'PR View – ME51N – PR_VIEW' },
  { pattern: /^\/api\/pr/, method: ['POST'], permission: 'PR_CREATE', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER'], description: 'PR Create – ME51N – PR_CREATE' },
  { pattern: /^\/api\/pr/, method: ['PUT', 'DELETE'], permission: 'PR_APPROVE', roles: ['MANAGER', 'ADMIN', 'OWNER'], description: 'PR Approve/Change – PR_APPROVE' },

  { pattern: /^\/api\/po/, method: ['GET'], permission: 'PO_VIEW', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER', 'WAREHOUSE'], description: 'PO View – ME21N – PO_VIEW' },
  { pattern: /^\/api\/po/, method: ['POST'], permission: 'PO_CREATE', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER'], description: 'PO Create – ME21N – PO_CREATE' },
  { pattern: /^\/api\/po/, method: ['PUT', 'DELETE'], permission: 'PO_APPROVE', roles: ['MANAGER', 'ADMIN', 'OWNER'], description: 'PO Approve – ME28 – PO_APPROVE' },

  { pattern: /^\/api\/gr/, method: ['GET'], permission: 'GR_VIEW', roles: ['WAREHOUSE', 'PURCHASER', 'ADMIN', 'OWNER', 'MANAGER'], description: 'GR View – MIGO – GR_VIEW' },
  { pattern: /^\/api\/gr/, method: '*', permission: 'GR_POST', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], description: 'GR Post – MIGO 101 – GR_POST' },

  { pattern: /^\/api\/iv/, method: ['GET'], permission: 'IV_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER', 'PURCHASER'], description: 'IV View – MIRO – IV_VIEW' },
  { pattern: /^\/api\/iv/, method: '*', permission: 'IV_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER'], description: 'IV Post – MIRO – IV_POST' },

  { pattern: /^\/api\/sto/, method: '*', permission: 'PO_CREATE', roles: ['PURCHASER', 'WAREHOUSE', 'ADMIN', 'OWNER'], description: 'STO – Stock Transport Order – PO_CREATE' },
  { pattern: /^\/api\/physical-inventory/, method: '*', permission: 'GR_POST', roles: ['WAREHOUSE', 'ADMIN', 'OWNER'], description: 'Physical Inventory – MI01 – GR_POST' },

  // SD – Sales
  { pattern: /^\/api\/sales/, method: ['GET'], permission: 'SALES_VIEW', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER'], description: 'Sales View – VA01 – SALES_VIEW' },
  { pattern: /^\/api\/sales/, method: '*', permission: 'SALES_CREATE', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER'], description: 'Sales Create – VA01 – SALES_CREATE' },
  { pattern: /^\/api\/delivery/, method: '*', permission: 'DELIVERY_CREATE', roles: ['WAREHOUSE', 'SALES', 'ADMIN', 'OWNER', 'MANAGER'], description: 'Outbound Deliveries – VL01N – SDLC – T0 BLOCKING – PGI 601 + COGS GBB/BSX – DELIVERY_CREATE – SAP standard LE V_LIKP_VST – requires WAREHOUSE,SALES – MASTER_DATA_MANAGER NOT allowed – SoD' },
  { pattern: /^\/api\/billing/, method: '*', permission: 'BILLING_CREATE', roles: ['ACCOUNTANT', 'SALES', 'ADMIN', 'OWNER'], description: 'Billing – VF01 – BILLING_CREATE' },

  // FICO – Financials – sensitive GL postings
  { pattern: /^\/api\/gl-accounts/, method: ['GET'], permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER', 'AUDITOR'], description: 'GL Accounts view – FS00 – GL_VIEW' },
  { pattern: /^\/api\/gl-accounts/, method: ['POST', 'PUT', 'DELETE'], permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'GL Accounts create – FS00 – GL_POST – Accountant only' },

  { pattern: /^\/api\/chart-of-accounts/, method: '*', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Chart of Accounts – FCOA – GL_VIEW' },
  { pattern: /^\/api\/cost-centers/, method: ['GET'], permission: 'CCA_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER', 'HR'], description: 'Cost Centers view – FCCA – CCA_VIEW' },
  { pattern: /^\/api\/cost-centers/, method: '*', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Cost Centers create – GL_POST' },

  { pattern: /^\/api\/profit-units/, method: '*', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Profit Centers – GL_VIEW' },
  { pattern: /^\/api\/cost-units/, method: '*', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Cost Units – GL_VIEW' },

  { pattern: /^\/api\/auto-account-determination/, method: '*', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Auto Account – OBYC – GL_POST – Accountant only' },
  { pattern: /^\/api\/posting-period/, method: '*', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Posting Period – OB52 – GL_POST' },
  { pattern: /^\/api\/fiscal-calendars/, method: '*', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Fiscal Calendars – FFYC – GL_VIEW' },
  { pattern: /^\/api\/field-status/, method: '*', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Field Status – FFSV/FFSG – GL_POST' },
  { pattern: /^\/api\/tolerance-groups/, method: '*', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Tolerance Groups – OBA0/OBA4 – GL_POST' },
  { pattern: /^\/api\/document-types/, method: '*', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Document Types – OBA7 – GL_POST' },
  { pattern: /^\/api\/payment/, method: '*', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Payment – F-53 – GL_POST' },
  { pattern: /^\/api\/cca-report/, method: '*', permission: 'CCA_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER'], description: 'CCA Report – KSB1 – CCA_VIEW' },
  { pattern: /^\/api\/costing-run/, method: '*', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Costing Run – CK40N – GL_POST' },

  // FOUNDATION – Master Data – master data manager can access, but not HR
  { pattern: /^\/api\/materials/, method: ['GET'], permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'WAREHOUSE', 'SALES', 'MANAGER'], description: 'Materials view – MM01 – MATERIAL_VIEW – MDM allowed' },
  { pattern: /^\/api\/materials/, method: ['POST', 'PUT', 'DELETE'], permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], description: 'Materials create – MM01 – MATERIAL_CREATE – MDM allowed, HR not' },

  { pattern: /^\/api\/material-types/, method: '*', permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER'], description: 'Material Types – EMTP – MATERIAL_CREATE' },
  { pattern: /^\/api\/material-categories/, method: '*', permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER'], description: 'Material Categories – EMGC – MATERIAL_CREATE' },
  { pattern: /^\/api\/uom/, method: '*', permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'WAREHOUSE'], description: 'UoM – EUOC – MATERIAL_VIEW' },
  { pattern: /^\/api\/lots/, method: '*', permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'WAREHOUSE', 'ADMIN', 'OWNER'], description: 'Lots – MATERIAL_VIEW' },
  { pattern: /^\/api\/business-partners/, method: '*', permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'SALES'], description: 'Business Partners – MATERIAL_VIEW' },

  { pattern: /^\/api\/company-groups/, method: '*', permission: 'MATERIAL_CREATE', roles: ['ADMIN', 'OWNER'], description: 'Company Groups – OX02 – ECGC – MATERIAL_CREATE – SAP standard IMG – ADMIN only – MDM not allowed – enterprise structure' },
  { pattern: /^\/api\/legal-entities/, method: '*', permission: 'MATERIAL_CREATE', roles: ['ADMIN', 'OWNER'], description: 'Legal Entities – OX02 – ELEC – MATERIAL_CREATE – SAP standard IMG – ADMIN only' },
  { pattern: /^\/api\/facilities/, method: '*', permission: 'MATERIAL_CREATE', roles: ['ADMIN', 'OWNER'], description: 'Facilities – OX02 – EFCC – MATERIAL_CREATE – SAP standard IMG – ADMIN only' },
  { pattern: /^\/api\/company-codes/, method: '*', permission: 'MATERIAL_CREATE', roles: ['ADMIN', 'OWNER'], description: 'Company Codes – MATERIAL_CREATE – Admin only' },
  { pattern: /^\/api\/buyer-teams/, method: '*', permission: 'MATERIAL_VIEW', roles: ['ADMIN', 'OWNER', 'PURCHASER', 'MATERIAL_MANAGER'], description: 'Buyer Teams – EBTC – MATERIAL_VIEW' },
  { pattern: /^\/api\/commercial-orgs/, method: '*', permission: 'MATERIAL_VIEW', roles: ['ADMIN', 'OWNER', 'SALES', 'MATERIAL_MANAGER'], description: 'Commercial Orgs – EDPC – MATERIAL_VIEW' },
  { pattern: /^\/api\/company-relationships/, method: '*', permission: 'MATERIAL_VIEW', roles: ['ADMIN', 'OWNER', 'MATERIAL_MANAGER'], description: 'Company Relationships – FCRL – MATERIAL_VIEW' },

  // PP – Production
  { pattern: /^\/api\/bom/, method: '*', permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'ADMIN', 'OWNER', 'MANAGER', 'PRODUCTION'], description: 'BOM – CS01 – MATERIAL_CREATE' },
  { pattern: /^\/api\/production-orders/, method: '*', permission: 'MATERIAL_CREATE', roles: ['PRODUCTION', 'ADMIN', 'OWNER', 'MANAGER'], description: 'Production Orders – MATERIAL_CREATE' },
  { pattern: /^\/api\/work-centers/, method: '*', permission: 'MATERIAL_VIEW', roles: ['PRODUCTION', 'ADMIN', 'OWNER'], description: 'Work Centers – MATERIAL_VIEW' },
  { pattern: /^\/api\/mrp/, method: '*', permission: 'MATERIAL_CREATE', roles: ['PRODUCTION', 'MATERIAL_MANAGER', 'ADMIN', 'OWNER'], description: 'MRP – MATERIAL_CREATE' },
  { pattern: /^\/api\/kitting/, method: '*', permission: 'MATERIAL_CREATE', roles: ['PRODUCTION', 'WAREHOUSE', 'ADMIN', 'OWNER'], description: 'Kitting – MATERIAL_CREATE' },

  // Inventory
  { pattern: /^\/api\/customers/, method: '*', permission: 'CUSTOMER_VIEW', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER', 'MASTER_DATA_MANAGER'], description: 'Customers – XD01 – SCUC – CUSTOMER_VIEW – SAP standard V_KNA1 – basic MDM allowed, FULL Sales Area+Pricing+Credit requires SALES – SoD' },
  { pattern: /^\/api\/suppliers/, method: '*', permission: 'MATERIAL_VIEW', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER', 'MATERIAL_MANAGER', 'MASTER_DATA_MANAGER'], description: 'Suppliers – XK01 – PSUC – MATERIAL_VIEW – SAP standard – MDM allowed' },
  { pattern: /^\/api\/inventory/, method: '*', permission: 'MATERIAL_VIEW', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER', 'MATERIAL_MANAGER'], description: 'Inventory – MMBE – ISTV – MATERIAL_VIEW – SAP standard – requires WAREHOUSE,ADMIN,OWNER,MANAGER,MATERIAL_MANAGER – MASTER_DATA_MANAGER alone NOT allowed – per user error' },

  // Admin – only ADMIN, OWNER
  { pattern: /^\/api\/roles/, method: '*', permission: 'ROLE_MANAGE', roles: ['ADMIN', 'OWNER'], description: 'Roles – ADMIN only – ROLE_MANAGE' },
  { pattern: /^\/api\/permissions/, method: '*', permission: 'ROLE_MANAGE', roles: ['ADMIN', 'OWNER'], description: 'Permissions – ADMIN only' },
  { pattern: /^\/api\/users/, method: '*', permission: 'USER_MANAGE', roles: ['ADMIN', 'OWNER', 'HR', 'MANAGER'], description: 'Users – USER_MANAGE – Admin/HR/Manager' },
  { pattern: /^\/api\/user-roles/, method: '*', permission: 'ROLE_MANAGE', roles: ['ADMIN', 'OWNER', 'HR', 'MANAGER'], description: 'User Roles – ROLE_MANAGE' },
  { pattern: /^\/api\/user-permissions/, method: '*', permission: 'ROLE_MANAGE', roles: ['ADMIN', 'OWNER', 'HR', 'MANAGER'], description: 'User Permissions – ROLE_MANAGE' },
  { pattern: /^\/api\/authorizations/, method: '*', permission: 'ROLE_MANAGE', roles: ['ADMIN', 'OWNER'], description: 'Authorizations – FRPC – ADMIN only' },
  { pattern: /^\/api\/jobs/, method: '*', permission: 'ADMIN_ALL', roles: ['ADMIN', 'OWNER', 'MANAGER'], description: 'Jobs – FBJM – ADMIN_ALL' },
  { pattern: /^\/api\/locks/, method: '*', permission: 'ADMIN_ALL', roles: ['ADMIN', 'OWNER', 'MANAGER'], description: 'Locks – FELM – ADMIN_ALL' },
  { pattern: /^\/api\/audit-logs/, method: '*', permission: 'ADMIN_ALL', roles: ['ADMIN', 'OWNER', 'AUDITOR'], description: 'Audit Logs – FAUD – ADMIN_ALL' },
  { pattern: /^\/api\/documents/, method: '*', permission: 'MATERIAL_VIEW', roles: ['ADMIN', 'OWNER', 'MANAGER', 'AUDITOR', 'ACCOUNTANT', 'PURCHASER', 'WAREHOUSE'], description: 'Documents – FNDC – MATERIAL_VIEW' },
  { pattern: /^\/api\/number-ranges/, method: '*', permission: 'MATERIAL_CREATE', roles: ['ADMIN', 'OWNER', 'MATERIAL_MANAGER'], description: 'Number Ranges – FNRC – MATERIAL_CREATE – Admin/MDM only' },
  { pattern: /^\/api\/me/, method: '*', permission: 'MATERIAL_VIEW', roles: ['*'], description: 'Me – current user – allow all authenticated – for RoleGuard' },

  // Default – allow all authenticated for other routes (MVP fallback) – but log
  { pattern: /^\/api\/.*/, method: '*', permission: 'MATERIAL_VIEW', roles: ['*'], description: 'Default – allow all authenticated – MVP fallback – will be tightened' },
];

export function getRequiredPermissionForRoute(pathname: string, method: string): RoutePermission | null {
  for (const rp of ROUTE_PERMISSIONS) {
    if (rp.pattern.test(pathname)) {
      if (rp.method === '*' || (Array.isArray(rp.method) ? rp.method.includes(method) : rp.method === method)) {
        return rp;
      }
    }
  }
  return null;
}
