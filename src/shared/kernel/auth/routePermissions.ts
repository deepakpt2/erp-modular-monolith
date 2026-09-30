/**
 * Sitewide RBAC Route Permissions – FRPC own IP – Foundation Role/Permission Checks
 * Implements authorization for ALL API routes – industry standard ERP – SAP standard parity
 * Master data manager cannot access HR payroll – only FOUNDATION permissions – SoD
 * HR cannot access MM purchasing unless granted – etc.
 * 
 * SAP standard authorization objects mapping:
 * M_MATE_MAR – material master – MATERIAL_CREATE/VIEW
 * M_BEST_BSA – purchasing – PR_CREATE/PO_CREATE
 * M_MSEG_BWA – goods movement – GR_POST 101/102
 * M_RECH_BUK – invoice verification – IV_POST
 * V_VBAK_AAT – sales order – SALES_CREATE
 * V_LIKP_VST – delivery – DELIVERY_CREATE
 * V_VBRK_FKA – billing – BILLING_CREATE
 * F_BKPF_BUK – company code – GL_POST
 * F_BKPF_KTO – GL account – GL_VIEW
 * P_ORGIN – HR org – EMPLOYEE_VIEW/CREATE
 * P_PCLX – payroll cluster – PAYROLL_RUN
 * etc.
 * 
 * Mapping: API path pattern -> required permission per HTTP method
 * Used by requireApiAuth to auto-enforce RBAC sitewide – defense in depth
 * Industry standard – SoD segregation of duties
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
  // ========== HR – sensitive – P_ORGIN/P_PCLX – HR only – SoD ==========
  { pattern: /^\/api\/payroll-run/, method: '*', permission: 'PAYROLL_RUN', roles: ['HR', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'OWNER'], description: 'Payroll Run – PC00_M99_CALC – PAYROLL_RUN – HR only – not master data manager – SoD – sensitive salary – 1000 employees background job' },
  { pattern: /^\/api\/payroll/, method: '*', permission: 'PAYROLL_RUN', roles: ['HR', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'OWNER'], description: 'Payroll – PC00 – PAYROLL_RUN – HR only – sensitive' },
  { pattern: /^\/api\/hr\/employees/, method: ['GET'], permission: 'EMPLOYEE_VIEW', roles: ['HR', 'HR_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], description: 'HR Employees view – PA20 – EMPLOYEE_VIEW – HR only – P_ORGIN – MDM NOT allowed' },
  { pattern: /^\/api\/hr\/employees/, method: ['POST', 'PUT', 'DELETE'], permission: 'EMPLOYEE_CREATE', roles: ['HR', 'HR_MANAGER', 'ADMIN', 'OWNER'], description: 'HR Employees create – PA30 – EMPLOYEE_CREATE – HR only – P_ORGIN – MDM NOT allowed' },
  { pattern: /^\/api\/hr\/org-units/, method: '*', permission: 'EMPLOYEE_VIEW', roles: ['HR', 'ADMIN', 'OWNER', 'MANAGER'], description: 'HR Org Units – EMPLOYEE_VIEW – HR only' },
  { pattern: /^\/api\/hr\/positions/, method: '*', permission: 'EMPLOYEE_VIEW', roles: ['HR', 'ADMIN', 'OWNER', 'MANAGER'], description: 'HR Positions – EMPLOYEE_VIEW – HR only' },

  // ========== MM – Purchasing – M_BEST_BSA – PURCHASER only ==========
  { pattern: /^\/api\/pr/, method: ['GET'], permission: 'PR_VIEW', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER', 'WAREHOUSE', 'ACCOUNTANT'], description: 'PR View – ME53N – PR_VIEW – PURCHASER view – MDM NOT allowed' },
  { pattern: /^\/api\/pr/, method: ['POST'], permission: 'PR_CREATE', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER'], description: 'PR Create – ME51N – PR_CREATE – PURCHASER only – M_BEST_BSA – MDM NOT allowed' },
  { pattern: /^\/api\/pr/, method: ['PUT', 'DELETE'], permission: 'PR_APPROVE', roles: ['MANAGER', 'ADMIN', 'OWNER'], description: 'PR Approve/Change – ME52N/ME54N – PR_APPROVE – MANAGER only' },

  { pattern: /^\/api\/po/, method: ['GET'], permission: 'PO_VIEW', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER', 'WAREHOUSE', 'ACCOUNTANT'], description: 'PO View – ME23N – PO_VIEW' },
  { pattern: /^\/api\/po/, method: ['POST'], permission: 'PO_CREATE', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER'], description: 'PO Create – ME21N – PO_CREATE – PURCHASER only – M_BEST_BSA' },
  { pattern: /^\/api\/po/, method: ['PUT', 'DELETE'], permission: 'PO_APPROVE', roles: ['MANAGER', 'ADMIN', 'OWNER'], description: 'PO Approve – ME28 – PO_APPROVE – MANAGER only' },

  { pattern: /^\/api\/gr/, method: ['GET'], permission: 'GR_VIEW', roles: ['WAREHOUSE', 'PURCHASER', 'ADMIN', 'OWNER', 'MANAGER'], description: 'GR View – MIGO display – GR_VIEW – WAREHOUSE/PURCHASER' },
  { pattern: /^\/api\/gr/, method: '*', permission: 'GR_POST', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], description: 'GR Post – MIGO 101 – GR_POST – WAREHOUSE only – M_MSEG_BWA 101 – MDM NOT allowed – T0 BLOCKING' },

  { pattern: /^\/api\/iv/, method: ['GET'], permission: 'IV_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER', 'PURCHASER'], description: 'IV View – MIRO display – IV_VIEW' },
  { pattern: /^\/api\/iv/, method: '*', permission: 'IV_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER'], description: 'IV Post – MIRO – IV_POST – ACCOUNTANT only – M_RECH_BUK – MDM NOT allowed' },

  { pattern: /^\/api\/sto/, method: '*', permission: 'PO_CREATE', roles: ['PURCHASER', 'WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], description: 'STO – Stock Transport Order – ME21N UB/NB – PO_CREATE – PURCHASER/WAREHOUSE' },
  { pattern: /^\/api\/physical-inventory/, method: '*', permission: 'GR_POST', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], description: 'Physical Inventory – MI01/MI04/MI07 – GR_POST – WAREHOUSE only' },

  // ========== SD – Sales – V_VBAK_AAT/V_LIKP_VST/V_VBRK_FKA – SALES/WAREHOUSE/ACCOUNTANT ==========
  { pattern: /^\/api\/sales/, method: ['GET'], permission: 'SALES_VIEW', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT', 'WAREHOUSE'], description: 'Sales View – VA03 – SALES_VIEW – SALES only – MDM NOT allowed' },
  { pattern: /^\/api\/sales/, method: '*', permission: 'SALES_CREATE', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER'], description: 'Sales Create – VA01 – SALES_CREATE – SALES only – V_VBAK_AAT – MDM NOT allowed' },
  { pattern: /^\/api\/delivery/, method: '*', permission: 'DELIVERY_CREATE', roles: ['WAREHOUSE', 'SALES', 'ADMIN', 'OWNER', 'MANAGER'], description: 'Outbound Deliveries – VL01N – SDLC – T0 BLOCKING – PGI 601 + COGS GBB/BSX – DELIVERY_CREATE – SAP standard LE V_LIKP_VST – requires WAREHOUSE,SALES – MASTER_DATA_MANAGER NOT allowed – SoD' },
  { pattern: /^\/api\/billing/, method: '*', permission: 'BILLING_CREATE', roles: ['ACCOUNTANT', 'SALES', 'ADMIN', 'OWNER', 'MANAGER'], description: 'Billing – VF01 – SBLC – BILLING_CREATE – SALES/ACCOUNTANT – MDM NOT allowed – V_VBRK_FKA' },

  // ========== FICO – Financials – F_BKPF_BUK/F_BKPF_KTO – ACCOUNTANT/ADMIN only ==========
  { pattern: /^\/api\/gl-accounts/, method: ['GET'], permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER', 'AUDITOR'], description: 'GL Accounts view – FS00 – GL_VIEW – ACCOUNTANT/ADMIN/MANAGER/AUDITOR view' },
  { pattern: /^\/api\/gl-accounts/, method: ['POST', 'PUT', 'DELETE'], permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'GL Accounts create – FS00 – GL_POST – ACCOUNTANT only – F_BKPF_KTO' },

  { pattern: /^\/api\/chart-of-accounts/, method: '*', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Chart of Accounts – FCOA – OB13 – GL_VIEW – ACCOUNTANT/ADMIN only' },
  { pattern: /^\/api\/cost-centers/, method: ['GET'], permission: 'CCA_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER', 'HR'], description: 'Cost Centers view – KS01 – FCCA – CCA_VIEW' },
  { pattern: /^\/api\/cost-centers/, method: '*', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Cost Centers create – KS01 – GL_POST – ACCOUNTANT only' },

  { pattern: /^\/api\/profit-units/, method: '*', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Profit Centers – KE51 – GL_VIEW – ACCOUNTANT/ADMIN only' },
  { pattern: /^\/api\/cost-units/, method: '*', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Cost Units – GL_VIEW – ACCOUNTANT/ADMIN only' },

  { pattern: /^\/api\/auto-account-determination/, method: '*', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Auto Account – OBYC – GL_POST – ACCOUNTANT only – BSX/GBB – sensitive' },
  { pattern: /^\/api\/posting-period/, method: '*', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Posting Period – OB52/OBBO – GL_POST – ACCOUNTANT only – F_BKPF_BUP' },
  { pattern: /^\/api\/fiscal-calendars/, method: '*', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Fiscal Calendars – OB29 – FFYC – GL_VIEW – ACCOUNTANT/ADMIN only' },
  { pattern: /^\/api\/field-status/, method: '*', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Field Status – OBC4 – FFSV/FFSG – GL_POST – ACCOUNTANT/ADMIN only' },
  { pattern: /^\/api\/tolerance-groups/, method: '*', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Tolerance Groups – OBA0/OBA4 – GL_POST – ACCOUNTANT/ADMIN only' },
  { pattern: /^\/api\/document-types/, method: '*', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Document Types – OBA7 – GL_POST – ACCOUNTANT/ADMIN only' },
  { pattern: /^\/api\/payment/, method: '*', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Payment – F-53/F110 – GL_POST – ACCOUNTANT only' },
  { pattern: /^\/api\/cca-report/, method: '*', permission: 'CCA_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER'], description: 'CCA Report – KSB1 – CCA_VIEW – ACCOUNTANT/ADMIN/MANAGER' },
  { pattern: /^\/api\/costing-run/, method: '*', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'PRODUCTION'], description: 'Costing Run – CK40N – GL_POST – ACCOUNTANT/PRODUCTION' },
  { pattern: /^\/api\/tax-groups/, method: '*', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Tax Groups – FTXP – FTGC – GL_VIEW – ACCOUNTANT/ADMIN only' },
  { pattern: /^\/api\/tax-codes/, method: '*', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Tax Codes – FTXP – FTXC – GL_VIEW – ACCOUNTANT/ADMIN only' },
  { pattern: /^\/api\/currencies/, method: '*', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Currencies – OY03 – FCYC – GL_VIEW – ACCOUNTANT/ADMIN only' },
  { pattern: /^\/api\/exchange-rates/, method: '*', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], description: 'Exchange Rates – OB08 – FEXC – GL_VIEW – ACCOUNTANT/ADMIN only' },

  // ========== FOUNDATION – Master Data – M_MATE_MAR/V_KNA1/LFA1 – MDM allowed – SAP standard ==========
  { pattern: /^\/api\/materials/, method: ['GET'], permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'WAREHOUSE', 'SALES', 'MANAGER', 'PRODUCTION', 'ACCOUNTANT'], description: 'Materials view – MM03 – MATERIAL_VIEW – MDM allowed – all can view' },
  { pattern: /^\/api\/materials/, method: ['POST', 'PUT', 'DELETE'], permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], description: 'Materials create – MM01/MM02 – MATERIAL_CREATE – MDM/MATERIAL_MANAGER allowed – HR NOT allowed – M_MATE_MAR' },

  { pattern: /^\/api\/material-types/, method: '*', permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER'], description: 'Material Types – OMS2 – EMTP – MATERIAL_CREATE – MDM allowed' },
  { pattern: /^\/api\/material-categories/, method: '*', permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER'], description: 'Material Categories – EMGC – MATERIAL_CREATE – MDM allowed' },
  { pattern: /^\/api\/uom/, method: '*', permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'WAREHOUSE', 'PRODUCTION'], description: 'UoM – CUNI – EUOC – MATERIAL_VIEW – MDM allowed' },
  { pattern: /^\/api\/lots/, method: '*', permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'WAREHOUSE', 'ADMIN', 'OWNER', 'PRODUCTION'], description: 'Lots – MSC1N – ELTC – MATERIAL_VIEW – WAREHOUSE/MATERIAL_MANAGER – MDM NOT allowed – lot is inventory' },
  { pattern: /^\/api\/business-partners/, method: '*', permission: 'BP_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'SALES'], description: 'Business Partners – BP – EPAC – BP_VIEW – MDM allowed basic' },
  { pattern: /^\/api\/customers/, method: '*', permission: 'CUSTOMER_VIEW', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER', 'MASTER_DATA_MANAGER'], description: 'Customers – XD01 – SCUC – CUSTOMER_VIEW – SAP standard V_KNA1 – basic MDM allowed, FULL Sales Area+Pricing+Credit requires SALES – SoD' },
  { pattern: /^\/api\/suppliers/, method: '*', permission: 'VENDOR_VIEW', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER', 'MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ACCOUNTANT'], description: 'Suppliers – XK01 – PSUC – VENDOR_VIEW – SAP standard LFA1 – MDM/PURCHASER allowed' },

  { pattern: /^\/api\/company-groups/, method: '*', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER'], description: 'Company Groups – OX02 – ECGC – ENTERPRISE_CONFIG – ADMIN only – enterprise structure – MDM NOT allowed' },
  { pattern: /^\/api\/legal-entities/, method: '*', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER'], description: 'Legal Entities – OX02 – ELEC – ENTERPRISE_CONFIG – ADMIN only – MDM NOT allowed' },
  { pattern: /^\/api\/facilities/, method: '*', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER'], description: 'Facilities – OX02 – EFCC – ENTERPRISE_CONFIG – ADMIN only – plant – MDM NOT allowed' },
  { pattern: /^\/api\/company-codes/, method: '*', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER'], description: 'Company Codes – OX02 – MATERIAL_CREATE – ADMIN only – MDM NOT allowed' },
  { pattern: /^\/api\/buyer-teams/, method: '*', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'PURCHASER'], description: 'Buyer Teams – EBTC – ENTERPRISE_CONFIG – purchasing group – ADMIN/PURCHASER – MDM NOT allowed per SAP IMG' },
  { pattern: /^\/api\/commercial-orgs/, method: '*', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'SALES'], description: 'Commercial Orgs – EDPC – ECOC – ENTERPRISE_CONFIG – sales org – ADMIN/SALES' },
  { pattern: /^\/api\/company-relationships/, method: '*', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER'], description: 'Company Relationships – FCRL – ENTERPRISE_CONFIG – ADMIN only' },

  // ========== PP – Production – C_AFKO/C_ARPL – PRODUCTION only ==========
  { pattern: /^\/api\/bom/, method: '*', permission: 'BOM_VIEW', roles: ['MATERIAL_MANAGER', 'ADMIN', 'OWNER', 'MANAGER', 'PRODUCTION'], description: 'BOM – CS01 – MBMC – BOM_VIEW – MATERIAL_MANAGER/PRODUCTION' },
  { pattern: /^\/api\/production-orders/, method: '*', permission: 'PROD_ORDER_CREATE', roles: ['PRODUCTION', 'ADMIN', 'OWNER', 'MANAGER'], description: 'Production Orders – CO01 – MMOC – PROD_ORDER_CREATE – PRODUCTION only – MDM NOT allowed' },
  { pattern: /^\/api\/work-centers/, method: '*', permission: 'WORKCENTER_VIEW', roles: ['PRODUCTION', 'ADMIN', 'OWNER', 'MANAGER'], description: 'Work Centers – CR01 – MWCC – WORKCENTER_VIEW – PRODUCTION only' },
  { pattern: /^\/api\/routings/, method: '*', permission: 'ROUTING_VIEW', roles: ['PRODUCTION', 'ADMIN', 'OWNER', 'MANAGER'], description: 'Routings – CA01 – MRTC – ROUTING_VIEW – PRODUCTION only' },
  { pattern: /^\/api\/mrp/, method: '*', permission: 'MRP_RUN', roles: ['PRODUCTION', 'MATERIAL_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], description: 'MRP – MD01 – MMRP – MRP_RUN – PRODUCTION/MATERIAL_MANAGER' },
  { pattern: /^\/api\/kitting/, method: '*', permission: 'KITTING_CREATE', roles: ['PRODUCTION', 'WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], description: 'Kitting – MKTC – KITTING_CREATE – PRODUCTION/WAREHOUSE' },

  // ========== Inventory – M_MSEG_BWA – WAREHOUSE only – MDM NOT allowed ==========
  { pattern: /^\/api\/inventory/, method: '*', permission: 'MATERIAL_VIEW', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER', 'MATERIAL_MANAGER'], description: 'Inventory – MMBE – ISTV – MATERIAL_VIEW – SAP standard – requires WAREHOUSE,ADMIN,OWNER,MANAGER,MATERIAL_MANAGER – MASTER_DATA_MANAGER alone NOT allowed – per user error Forbidden' },

  // ========== Admin – SU01/PFCG – ADMIN/OWNER only ==========
  { pattern: /^\/api\/roles/, method: '*', permission: 'ROLE_MANAGE', roles: ['ADMIN', 'OWNER'], description: 'Roles – PFCG – ROLE_MANAGE – ADMIN only – S_USER_AGR' },
  { pattern: /^\/api\/permissions/, method: '*', permission: 'ROLE_MANAGE', roles: ['ADMIN', 'OWNER'], description: 'Permissions – PFCG – ROLE_MANAGE – ADMIN only' },
  { pattern: /^\/api\/users/, method: '*', permission: 'USER_MANAGE', roles: ['ADMIN', 'OWNER', 'HR', 'MANAGER'], description: 'Users – SU01 – USER_MANAGE – Admin/HR/Manager – S_USER_GRP' },
  { pattern: /^\/api\/user-roles/, method: '*', permission: 'ROLE_MANAGE', roles: ['ADMIN', 'OWNER', 'HR', 'MANAGER'], description: 'User Roles – PFCG – ROLE_MANAGE – ADMIN/HR/MANAGER' },
  { pattern: /^\/api\/user-permissions/, method: '*', permission: 'ROLE_MANAGE', roles: ['ADMIN', 'OWNER', 'HR', 'MANAGER'], description: 'User Permissions – PFCG – ROLE_MANAGE' },
  { pattern: /^\/api\/authorizations/, method: '*', permission: 'ROLE_MANAGE', roles: ['ADMIN', 'OWNER'], description: 'Authorizations – FRPC – SU21 – ROLE_MANAGE – ADMIN only' },
  { pattern: /^\/api\/jobs/, method: '*', permission: 'ADMIN_ALL', roles: ['ADMIN', 'OWNER', 'MANAGER'], description: 'Jobs – SM37 – FBJM – ADMIN_ALL – ADMIN/MANAGER' },
  { pattern: /^\/api\/locks/, method: '*', permission: 'ADMIN_ALL', roles: ['ADMIN', 'OWNER', 'MANAGER'], description: 'Locks – SM12 – FELM – ADMIN_ALL – ADMIN/MANAGER' },
  { pattern: /^\/api\/audit-logs/, method: '*', permission: 'AUDIT_VIEW', roles: ['ADMIN', 'OWNER', 'AUDITOR', 'MANAGER'], description: 'Audit Logs – SM20 – FAUD – AUDIT_VIEW – ADMIN/AUDITOR/MANAGER' },
  { pattern: /^\/api\/documents/, method: '*', permission: 'MATERIAL_VIEW', roles: ['ADMIN', 'OWNER', 'MANAGER', 'AUDITOR', 'ACCOUNTANT', 'PURCHASER', 'WAREHOUSE', 'SALES'], description: 'Documents – FNDC – MATERIAL_VIEW – display all – AUDITOR' },
  { pattern: /^\/api\/number-ranges/, method: '*', permission: 'NUMBER_RANGE_MAINTAIN', roles: ['ADMIN', 'OWNER'], description: 'Number Ranges – FBN1/SNRO – FNRC – NUMBER_RANGE_MAINTAIN – ADMIN only – S_NUMBER – industry standard numeric only – locked if used' },
  { pattern: /^\/api\/me/, method: '*', permission: 'MATERIAL_VIEW', roles: ['*'], description: 'Me – current user – SU53 – allow all authenticated – for RoleGuard and client-layout RBAC check' },

  // ========== Default – allow all authenticated for other routes (MVP fallback) – but will be tightened per industry standard ==========
  { pattern: /^\/api\/.*/, method: '*', permission: 'MATERIAL_VIEW', roles: ['*'], description: 'Default – allow all authenticated – MVP fallback – will be tightened per SAP standard' },
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
