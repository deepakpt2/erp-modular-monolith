/**
 * Frontend Page RBAC – sitewide – FRPC – industry standard ERP
 * Maps frontend ERP routes to required permission and roles per SAP standard
 * Used by client-layout to completely block view and show unauthorized message
 * If user came to a page not allowed, show unauthorized for this transaction, contact administrator
 * Also used by navigator to remove pages without permission
 * SAP standard parity – SoD segregation of duties
 */

export interface FrontendPermission {
  pattern: RegExp;
  permission: string;
  roles: string[];
  code: string;
  description: string;
}

export const FRONTEND_PERMISSIONS: FrontendPermission[] = [
  // ========== HR – sensitive – P_ORGIN/P_PCLX – HR only – SoD ==========
  { pattern: /\/hr\/payroll-run/, permission: 'PAYROLL_RUN', roles: ['HR', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'OWNER'], code: 'HPYC', description: 'Payroll Run – PC00_M99_CALC – HPYC – PAYROLL_RUN – HR only – not master data manager – SoD – sensitive salary' },
  { pattern: /\/hr\/payroll/, permission: 'EMPLOYEE_VIEW', roles: ['HR', 'HR_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], code: 'HHEC', description: 'HR Master – PA30 – HHEC – EMPLOYEE_VIEW – HR only – MDM cannot access – SoD – PII' },
  { pattern: /\/hr\/employees/, permission: 'EMPLOYEE_VIEW', roles: ['HR', 'HR_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], code: 'HHEC', description: 'Employee Master – PA30 – EMPLOYEE_VIEW – HR only' },
  { pattern: /\/hr\//, permission: 'EMPLOYEE_VIEW', roles: ['HR', 'HR_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], code: 'HHEC', description: 'HR module – PA30 – EMPLOYEE_VIEW – HR only' },

  // ========== ENTERPRISE STRUCTURE – IMG – OX02 – ADMIN only ==========
  { pattern: /\/foundation\/company-groups/, permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER'], code: 'ECGC', description: 'Company Group – OX02 – ECGC – ENTERPRISE_CONFIG – ADMIN only – enterprise structure' },
  { pattern: /\/foundation\/company-group-assignment/, permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER'], code: 'ECGA', description: 'Assign Company Group to Legal Entity – OX16 – ECGA – ENTERPRISE_CONFIG' },
  { pattern: /\/foundation\/legal-entities/, permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER'], code: 'ELEC', description: 'Legal Entity – OX02 – ELEC – ENTERPRISE_CONFIG – ADMIN only' },
  { pattern: /\/foundation\/facilities/, permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER'], code: 'EFCC', description: 'Facility – OX02 – EFCC – ENTERPRISE_CONFIG – ADMIN only – plant' },
  { pattern: /\/foundation\/inventory-locations/, permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'WAREHOUSE', 'MATERIAL_MANAGER'], code: 'EILC', description: 'Inventory Location – OX09 – EILC – ENTERPRISE_CONFIG – ADMIN/WAREHOUSE' },
  { pattern: /\/foundation\/procurement-divisions/, permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'PURCHASER'], code: 'EPDC', description: 'Procurement Division – EPDC – ENTERPRISE_CONFIG – ADMIN/PURCHASER' },
  { pattern: /\/foundation\/buying-teams/, permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'PURCHASER'], code: 'EBTC', description: 'Buyer Team – EBTC – ENTERPRISE_CONFIG – purchasing group' },
  { pattern: /\/foundation\/commercial-orgs/, permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'SALES'], code: 'ECOC', description: 'Commercial Org – ECOC – ENTERPRISE_CONFIG – sales org – ADMIN/SALES' },
  { pattern: /\/foundation\/sales-channels/, permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'SALES'], code: 'ESCC', description: 'Sales Channel – ESCC – ENTERPRISE_CONFIG – distribution channel' },
  { pattern: /\/foundation\/product-lines/, permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'MATERIAL_MANAGER', 'SALES'], code: 'EPLC', description: 'Product Line – EPLC – ENTERPRISE_CONFIG – division' },
  { pattern: /\/foundation\/commercial-units/, permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'], code: 'EPUC', description: 'Commercial Unit – EPUC – ENTERPRISE_CONFIG – profit center' },
  { pattern: /\/foundation\/commercial-unit-assign/, permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER'], code: 'ECUC', description: 'Commercial Unit Assignment – ECUC – ENTERPRISE_CONFIG – ADMIN only' },
  { pattern: /\/foundation\/profit-center-assign/, permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'], code: 'EBSC', description: 'Profit Center Assignment – EBSC – ENTERPRISE_CONFIG – ADMIN/ACCOUNTANT' },
  { pattern: /\/foundation\/warehouse-sites/, permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'WAREHOUSE'], code: 'EWSC', description: 'Warehouse Site – EWSC – ENTERPRISE_CONFIG – ADMIN/WAREHOUSE' },
  { pattern: /\/foundation\/distribution-paths/, permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'SALES'], code: 'EDPC', description: 'Distribution Path – EDPC – ENTERPRISE_CONFIG – ADMIN/SALES' },
  { pattern: /\/foundation\/credit-policy-areas/, permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'SALES', 'ACCOUNTANT'], code: 'FCPC', description: 'Credit Policy Area – FCPC – ENTERPRISE_CONFIG – credit control' },
  { pattern: /\/foundation\/enterprise-structure/, permission: 'ENTERPRISE_CONFIG_VIEW', roles: ['*'], code: 'ECAC', description: 'Enterprise Structure Overview – ECAC – view only – all authenticated' },

  // ========== FOUNDATION – MASTER DATA – MARA – MDM allowed ==========
  { pattern: /\/foundation\/materials/, permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'MANAGER', 'PURCHASER', 'WAREHOUSE', 'SALES', 'PRODUCTION'], code: 'EMTC', description: 'Product Master – MM01 – EMTC – MATERIAL_VIEW – MDM/MATERIAL_MANAGER allowed' },
  { pattern: /\/foundation\/material-types/, permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER'], code: 'EMTP', description: 'Product Types – OMS2 – EMTP – MATERIAL_CREATE – MDM allowed' },
  { pattern: /\/foundation\/material-categories/, permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER'], code: 'EMGC', description: 'Product Categories – EMGC – MATERIAL_CREATE – MDM allowed' },
  { pattern: /\/foundation\/uom/, permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'WAREHOUSE', 'PRODUCTION'], code: 'EUOC', description: 'UoM – CUNI – EUOC – MATERIAL_VIEW – MDM allowed' },
  { pattern: /\/foundation\/lots/, permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'WAREHOUSE', 'ADMIN', 'OWNER', 'PRODUCTION'], code: 'ELTC', description: 'Lot Management – ELTC – MATERIAL_VIEW – WAREHOUSE/MATERIAL_MANAGER – MDM NOT allowed' },
  { pattern: /\/foundation\/stock/, permission: 'MATERIAL_VIEW', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER', 'MATERIAL_MANAGER'], code: 'ISTV', description: 'Stock Overview – MMBE – ISTV – MATERIAL_VIEW – requires WAREHOUSE,ADMIN,OWNER,MANAGER,MATERIAL_MANAGER – MASTER_DATA_MANAGER alone NOT enough – per user error' },
  { pattern: /\/foundation\/partners/, permission: 'BP_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'SALES'], code: 'EPAC', description: 'Partner Account – BP – EPAC – BP_VIEW – MDM allowed basic' },
  { pattern: /\/foundation\/suppliers/, permission: 'VENDOR_VIEW', roles: ['PURCHASER', 'MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'], code: 'PSUC', description: 'Supplier – XK01 – PSUC – VENDOR_VIEW – MDM/PURCHASER allowed' },
  { pattern: /\/foundation\/customers/, permission: 'CUSTOMER_VIEW', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER', 'MASTER_DATA_MANAGER'], code: 'SCUC', description: 'Customer – XD01 – SCUC – CUSTOMER_VIEW – SAP standard V_KNA1 – basic MDM allowed, FULL Sales Area+Pricing+Credit requires SALES – SoD' },
  { pattern: /\/foundation\/partner-contacts/, permission: 'BP_VIEW', roles: ['SALES', 'PURCHASER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER'], code: 'EPCC', description: 'Partner Contact – EPCC – BP_VIEW – MDM allowed' },

  // ========== FICO – FI/CO – FS00/OBYC – ACCOUNTANT/ADMIN only ==========
  { pattern: /\/fico\/fiscal-calendars/, permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'FFYC', description: 'Fiscal Calendar – OB29 – FFYC – GL_VIEW – ACCOUNTANT/ADMIN only' },
  { pattern: /\/fico\/exchange-rates/, permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'FEXC', description: 'Exchange Rates – OB08 – FEXC – GL_VIEW – ACCOUNTANT/ADMIN only' },
  { pattern: /\/fico\/number-ranges/, permission: 'NUMBER_RANGE_MAINTAIN', roles: ['ADMIN', 'OWNER'], code: 'FNRC', description: 'Number Ranges – FBN1/SNRO – FNRC – NUMBER_RANGE_MAINTAIN – ADMIN only – S_NUMBER' },
  { pattern: /\/fico\/tax-groups/, permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'FTGC', description: 'Tax Groups – FTXP – FTGC – GL_VIEW – ACCOUNTANT/ADMIN only' },
  { pattern: /\/fico\/tax-codes/, permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'FTXC', description: 'Tax Codes – FTXP – FTXC – GL_VIEW – ACCOUNTANT/ADMIN only' },
  { pattern: /\/fico\/chart-of-accounts/, permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'FCOA', description: 'Chart of Accounts – OB13 – FCOA – GL_VIEW – ACCOUNTANT/ADMIN only' },
  { pattern: /\/fico\/gl-accounts/, permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER', 'AUDITOR'], code: 'FGLC', description: 'GL Accounts – FS00 – FGLC – GL_VIEW – ACCOUNTANT/ADMIN/MANAGER/AUDITOR view' },
  { pattern: /\/fico\/cost-centers/, permission: 'CCA_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER', 'HR'], code: 'FCCA', description: 'Cost Centers – KS01 – FCCA – CCA_VIEW – ACCOUNTANT/ADMIN/MANAGER/HR' },
  { pattern: /\/fico\/currencies/, permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'FCYC', description: 'Currencies – OY03 – FCYC – GL_VIEW – ACCOUNTANT/ADMIN only' },
  { pattern: /\/fico\/posting-period-variants/, permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'FPPC', description: 'Posting Period Variant – OBBO – FPPC – GL_POST – ACCOUNTANT/ADMIN only' },
  { pattern: /\/fico\/posting-periods/, permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'FPPE', description: 'Posting Period Control – OB52 – FPPE – GL_POST – ACCOUNTANT/ADMIN only' },
  { pattern: /\/fico\/field-status-variants/, permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'FFSV', description: 'Field Status Variant – OBC4 – FFSV – GL_POST – ACCOUNTANT/ADMIN only' },
  { pattern: /\/fico\/field-status-groups/, permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'FFSG', description: 'Field Status Groups – OBC4 – FFSG – GL_POST – ACCOUNTANT/ADMIN only' },
  { pattern: /\/fico\/tolerance-groups-gl/, permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'OBA0', description: 'Tolerance Groups GL – OBA0 – GL_POST – ACCOUNTANT/ADMIN only' },
  { pattern: /\/fico\/tolerance-groups-cv/, permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'OBA4', description: 'Tolerance Groups Customers/Vendors – OBA4 – GL_POST – ACCOUNTANT/ADMIN only' },
  { pattern: /\/fico\/document-types/, permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'OBA7', description: 'Document Types – OBA7 – GL_POST – ACCOUNTANT/ADMIN only' },
  { pattern: /\/fico\/auto-account-determination/, permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'FAUC', description: 'Auto Account Determination – FAUC (legacy OBYC) – GL_POST – ACCOUNTANT/ADMIN only – BSX/GBB' },
  { pattern: /\/fico\/payment-terms/, permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'FAPT', description: 'Payment Terms – OBB8 – FAPT – GL_VIEW – ACCOUNTANT/ADMIN only' },
  { pattern: /\/fico\/payment/, permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'FPYP', description: 'Payment Processing – F110 – FPYP – GL_POST – ACCOUNTANT/ADMIN only' },
  { pattern: /\/fico\/cca-report/, permission: 'CCA_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER'], code: 'CCUL', description: 'Cost Center Actuals – KSB1 – CCUL – CCA_VIEW – ACCOUNTANT/ADMIN/MANAGER' },
  { pattern: /\/fico\/costing-run/, permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'PRODUCTION'], code: 'CCRP', description: 'Product Costing Run – CK40N – CCRP – GL_POST – ACCOUNTANT/PRODUCTION' },
  { pattern: /\/fico\//, permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], code: 'FICO', description: 'FICO module – GL_VIEW – ACCOUNTANT/ADMIN only – fallback' },

  // ========== MM – ME51N/ME21N/MIGO/MIRO – PURCHASER/WAREHOUSE/ACCOUNTANT ==========
  { pattern: /\/mm\/pr/, permission: 'PR_VIEW', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER', 'WAREHOUSE', 'ACCOUNTANT'], code: 'PPRC', description: 'Purchase Requisition – ME51N – PPRC – PR_VIEW – PURCHASER only – MDM NOT allowed' },
  { pattern: /\/mm\/po/, permission: 'PO_VIEW', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER', 'WAREHOUSE', 'ACCOUNTANT'], code: 'PPOC', description: 'Purchase Order – ME21N – PPOC – PO_VIEW – PURCHASER only' },
  { pattern: /\/mm\/gr/, permission: 'GR_VIEW', roles: ['WAREHOUSE', 'PURCHASER', 'ADMIN', 'OWNER', 'MANAGER'], code: 'IGRC', description: 'Goods Receipt – MIGO 101 – IGRC – GR_VIEW – WAREHOUSE only – T0 BLOCKING' },
  { pattern: /\/mm\/gr-reversal/, permission: 'GR_POST', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], code: 'GRRE', description: 'GR Reversal – MIGO 102 – GRRE – GR_POST – WAREHOUSE only' },
  { pattern: /\/mm\/iv/, permission: 'IV_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER', 'PURCHASER'], code: 'PIVC', description: 'Invoice Verification – MIRO – PIVC – IV_VIEW – ACCOUNTANT only' },
  { pattern: /\/mm\/iv-reversal/, permission: 'IV_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER'], code: 'IVRE', description: 'Invoice Reversal – MR8M – IVRE – IV_POST – ACCOUNTANT only' },
  { pattern: /\/mm\/sto/, permission: 'PO_VIEW', roles: ['PURCHASER', 'WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], code: 'PSTC', description: 'Stock Transport Order – ME21N STO – PSTC – PO_VIEW – PURCHASER/WAREHOUSE' },
  { pattern: /\/mm\/sto-delivery/, permission: 'DELIVERY_CREATE', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], code: 'PSTD', description: 'STO Delivery – VL10B – PSTD – DELIVERY_CREATE – WAREHOUSE only' },
  { pattern: /\/mm\/physical-inventory/, permission: 'GR_VIEW', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], code: 'IPIC', description: 'Physical Inventory – MI01 – IPIC – GR_VIEW – WAREHOUSE only' },

  // ========== SD – VA01/VL01N/VF01 – SALES/WAREHOUSE/ACCOUNTANT ==========
  { pattern: /\/sales/, permission: 'SALES_VIEW', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT', 'WAREHOUSE'], code: 'SSOC', description: 'Sales Order – VA01 – SSOC – SALES_VIEW – SALES only – MDM NOT allowed' },
  { pattern: /\/sd\/delivery/, permission: 'DELIVERY_CREATE', roles: ['WAREHOUSE', 'SALES', 'ADMIN', 'OWNER', 'MANAGER'], code: 'SDLC', description: 'Outbound Deliveries – VL01N – SDLC – T0 BLOCKING – PGI 601 + COGS INV_OFFSET/INV_POSTING (legacy GBB/BSX) – DELIVERY_CREATE – SAP standard LE – V_LIKP_VST – requires WAREHOUSE,SALES – MASTER_DATA_MANAGER NOT allowed – SoD' },
  { pattern: /\/sd\/billing/, permission: 'BILLING_CREATE', roles: ['ACCOUNTANT', 'SALES', 'ADMIN', 'OWNER', 'MANAGER'], code: 'SBLC', description: 'Billing Document – VF01 – SBLC – BILLING_CREATE – SALES/ACCOUNTANT – MDM NOT allowed' },
  { pattern: /\/sd\/billing-reversal/, permission: 'BILLING_CREATE', roles: ['ACCOUNTANT', 'SALES', 'ADMIN', 'OWNER', 'MANAGER'], code: 'BLRE', description: 'Billing Reversal – VF11 – BLRE – BILLING_CREATE – SALES/ACCOUNTANT' },
  { pattern: /\/sd\/pricing-procedure/, permission: 'PRICING_MAINTAIN', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER'], code: 'PRIC', description: 'Pricing Procedure – VK11 – PRIC – PRICING_MAINTAIN – SALES only – V_KONH_VKS' },

  // ========== PP – CS01/CR01/CA01/CO01/MD01 – PRODUCTION ==========
  { pattern: /\/pp\/bom/, permission: 'BOM_VIEW', roles: ['MATERIAL_MANAGER', 'ADMIN', 'OWNER', 'MANAGER', 'PRODUCTION'], code: 'MBMC', description: 'BOM – CS01 – MBMC – BOM_VIEW – MATERIAL_MANAGER/PRODUCTION' },
  { pattern: /\/pp\/work-centers/, permission: 'WORKCENTER_VIEW', roles: ['PRODUCTION', 'ADMIN', 'OWNER', 'MANAGER'], code: 'MWCC', description: 'Work Center – CR01 – MWCC – WORKCENTER_VIEW – PRODUCTION only' },
  { pattern: /\/pp\/routings/, permission: 'ROUTING_VIEW', roles: ['PRODUCTION', 'ADMIN', 'OWNER', 'MANAGER'], code: 'MRTC', description: 'Routing – CA01 – MRTC – ROUTING_VIEW – PRODUCTION only' },
  { pattern: /\/pp\/production-orders/, permission: 'PROD_ORDER_VIEW', roles: ['PRODUCTION', 'ADMIN', 'OWNER', 'MANAGER'], code: 'MMOC', description: 'Production Order – CO01 – MMOC – PROD_ORDER_VIEW – PRODUCTION only' },
  { pattern: /\/pp\/mrp/, permission: 'MRP_RUN', roles: ['PRODUCTION', 'MATERIAL_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], code: 'MMRP', description: 'MRP Run – MD01 – MMRP – MRP_RUN – PRODUCTION/MATERIAL_MANAGER' },
  { pattern: /\/pp\/kitting/, permission: 'KITTING_VIEW', roles: ['PRODUCTION', 'WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], code: 'MKTC', description: 'Kitting – MKTC – KITTING_VIEW – PRODUCTION/WAREHOUSE' },
  { pattern: /\/pp\//, permission: 'PROD_ORDER_VIEW', roles: ['PRODUCTION', 'MATERIAL_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], code: 'PP', description: 'PP module – PROD_ORDER_VIEW – PRODUCTION' },

  // ========== SYSTEM – Admin only – SM37/SM12/SU01 ==========
  { pattern: /\/system\/jobs/, permission: 'ADMIN_ALL', roles: ['ADMIN', 'OWNER', 'MANAGER'], code: 'FBJM', description: 'Background Jobs – SM37 – FBJM – ADMIN_ALL – ADMIN/MANAGER' },
  { pattern: /\/system\/locks/, permission: 'ADMIN_ALL', roles: ['ADMIN', 'OWNER', 'MANAGER'], code: 'FELM', description: 'Locks – SM12 – FELM – ADMIN_ALL – ADMIN/MANAGER' },
  { pattern: /\/audit\/document-flow/, permission: 'AUDIT_VIEW', roles: ['ADMIN', 'OWNER', 'AUDITOR', 'MANAGER', 'ACCOUNTANT', 'PURCHASER', 'WAREHOUSE', 'SALES'], code: 'AFLW', description: 'Document Flow – AFLW – AUDIT_VIEW – display all – AUDITOR/MANAGER' },
  { pattern: /\/audit\/logs/, permission: 'AUDIT_VIEW', roles: ['ADMIN', 'OWNER', 'AUDITOR', 'MANAGER'], code: 'AALG', description: 'Audit Log – SM20 – AALG – AUDIT_VIEW – ADMIN/AUDITOR only' },
  { pattern: /\/workflow\/inbox/, permission: 'WORKFLOW_VIEW', roles: ['ADMIN', 'OWNER', 'MANAGER', 'PURCHASER', 'ACCOUNTANT', 'SALES', 'HR', 'WAREHOUSE', 'MATERIAL_MANAGER'], code: 'FWFL', description: 'Workflow Inbox – SWI1 – FWFL – WORKFLOW_VIEW – all approvers' },

  // ========== NAVIGATOR and docs – allow all authenticated – but filters children per RBAC ==========
  { pattern: /\/foundation\/users/, permission: 'USER_MANAGE', roles: ['ADMIN', 'OWNER', 'HR', 'MANAGER'], code: 'FUSC', description: 'User Maintenance – SU01 – FUSC – USER_MANAGE – ADMIN/HR/MANAGER only – MDM NOT allowed – SoD – Users – per error 403' },
  { pattern: /\/foundation\/roles/, permission: 'ROLE_MANAGE', roles: ['ADMIN', 'OWNER'], code: 'FROC', description: 'Role Maintenance – PFCG – FROC – ROLE_MANAGE – ADMIN only – S_USER_AGR' },
  { pattern: /\/foundation\/user-profile/, permission: 'MATERIAL_VIEW', roles: ['*'], code: 'SU01', description: 'User Profile – SU01 – My Profile – allow all authenticated – self' },
  { pattern: /\/system\/jobs/, permission: 'ADMIN_ALL', roles: ['ADMIN', 'OWNER', 'MANAGER', '*'], code: 'FBJM', description: 'Background Jobs – SM37 – FBJM – ADMIN_ALL – allow all for job indicator GET, but POST restricted – fix 403 for MDM' },
  { pattern: /\/system\/locks/, permission: 'ADMIN_ALL', roles: ['ADMIN', 'OWNER', 'MANAGER'], code: 'FELM', description: 'Locks – SM12 – FELM – ADMIN_ALL – ADMIN/MANAGER' },
  { pattern: /\/navigator/, permission: 'MATERIAL_VIEW', roles: ['*'], code: 'NAV', description: 'Navigator – allow all authenticated – but filters children via canUserAccessPage – pages without permission removed' },
  { pattern: /\/foundation\/codes/, permission: 'MATERIAL_VIEW', roles: ['*'], code: 'FDIR', description: 'Transaction Codes Directory – allow all authenticated' },
  { pattern: /\/foundation\/enterprise-structure/, permission: 'MATERIAL_VIEW', roles: ['*'], code: 'ECAC', description: 'Enterprise Structure Overview – ECAC – view only – allow all authenticated' },
];

export function getFrontendPermission(pathname: string): FrontendPermission | null {
  for (const fp of FRONTEND_PERMISSIONS) {
    if (fp.pattern.test(pathname)) {
      return fp;
    }
  }
  return null;
}
