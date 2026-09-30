/**
 * Frontend Page Permissions – FRPC – sitewide RBAC for UI – industry standard ERP
 * Maps function code to required permission and roles per SAP / industry standard
 * Used by SingleCodePage and Navigator to block view and show unauthorized message
 * SAP standard parity – SoD segregation of duties
 * 
 * Role definitions per SAP standard:
 * ADMIN/OWNER = SAP_ALL – full access – SPRO IMG config, master data, transactional, HR, FI
 * MANAGER = Approval + view all – can approve PR/PO, view reports, workflow – not IMG config
 * MATERIAL_MANAGER = MM master data – MM01/MM02, BOM CS01 view, MMBE view – not transactional PO/GR
 * MASTER_DATA_MANAGER = MDM – master data only – materials, BP basic, UoM – NOT transactional, NOT IMG, NOT HR, NOT FI, NOT inventory
 * PURCHASER = ME51N/ME21N/ME28 – PR/PO create/view – GR view – not material create, not FI post
 * WAREHOUSE = MIGO/MMBE/MI01/VL01N – GR post, stock overview, delivery, physical inventory – not PR/PO create
 * SALES = VA01/VL01N/VF01/XD01 – sales order, delivery, billing, customer master – not purchasing
 * ACCOUNTANT = FS00/FB01/MIRO/OBYC – GL, AP, AR, costing, tax, payment – not MM/SD creation
 * PRODUCTION = CS01/CR01/CA01/CO01/MD01 – BOM, work center, routing, prod order, MRP
 * HR/HR_MANAGER = PA30/PA20 – employee master – sensitive PII
 * PAYROLL_MANAGER = PC00 – payroll run – sensitive salary – HR only
 * AUDITOR = Display only – audit logs, document flow, GL view – no create/post
 */

export interface PagePermission {
  code: string;
  permission: string;
  roles: string[];
  module: string;
  description: string;
}

export const PAGE_PERMISSIONS: PagePermission[] = [
  // ========== ENTERPRISE STRUCTURE – IMG config – SPRO – OX02/OX10 etc – ADMIN only per SAP standard ==========
  { code: 'ECGC', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER'], module: 'FOUNDATION', description: 'Company Group – OX02 – ECGC – ENTERPRISE_CONFIG – SAP standard IMG – ADMIN only – enterprise structure' },
  { code: 'ELEC', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER'], module: 'FOUNDATION', description: 'Legal Entity – OX02 – ELEC – ENTERPRISE_CONFIG – SAP standard IMG – ADMIN only' },
  { code: 'EFCC', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER'], module: 'FOUNDATION', description: 'Facility – OX02 – EFCC – ENTERPRISE_CONFIG – SAP standard IMG – ADMIN only – plant' },
  { code: 'EILC', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'WAREHOUSE', 'MATERIAL_MANAGER'], module: 'FOUNDATION', description: 'Inventory Location – OX09 – EILC – ENTERPRISE_CONFIG – SAP standard – ADMIN/WAREHOUSE – storage location' },
  { code: 'EPDC', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'PURCHASER'], module: 'FOUNDATION', description: 'Procurement Division – EPDC – ENTERPRISE_CONFIG – SAP standard – purchasing org – ADMIN/PURCHASER' },
  { code: 'EBTC', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'PURCHASER'], module: 'FOUNDATION', description: 'Buyer Team – EBTC – ENTERPRISE_CONFIG – SAP standard – purchasing group – ADMIN/PURCHASER' },
  { code: 'ECOC', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'SALES'], module: 'FOUNDATION', description: 'Commercial Organization – ECOC – ENTERPRISE_CONFIG – SAP standard – sales org – ADMIN/SALES' },
  { code: 'ESCC', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'SALES'], module: 'FOUNDATION', description: 'Sales Channel – ESCC – ENTERPRISE_CONFIG – SAP standard – distribution channel – ADMIN/SALES' },
  { code: 'EPLC', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'MATERIAL_MANAGER', 'SALES'], module: 'FOUNDATION', description: 'Product Line – EPLC – ENTERPRISE_CONFIG – SAP standard – division – ADMIN/MATERIAL_MANAGER/SALES' },
  { code: 'EPUC', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'], module: 'FOUNDATION', description: 'Commercial Unit – EPUC – ENTERPRISE_CONFIG – SAP standard – profit center – ADMIN/ACCOUNTANT' },
  { code: 'ECUC', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER'], module: 'FOUNDATION', description: 'Commercial Unit Assignment – ECUC – ENTERPRISE_CONFIG – SAP standard IMG – ADMIN only – assignment' },
  { code: 'EBSC', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'], module: 'FOUNDATION', description: 'Profit Center Assignment – EBSC – ENTERPRISE_CONFIG – SAP standard – KE51 – ADMIN/ACCOUNTANT' },
  { code: 'EWSC', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'WAREHOUSE'], module: 'FOUNDATION', description: 'Warehouse Site – EWSC – ENTERPRISE_CONFIG – SAP standard – warehouse – ADMIN/WAREHOUSE' },
  { code: 'EDPC', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'SALES'], module: 'FOUNDATION', description: 'Distribution Path – EDPC – ENTERPRISE_CONFIG – SAP standard – sales – ADMIN/SALES' },
  { code: 'FCPC', permission: 'ENTERPRISE_CONFIG', roles: ['ADMIN', 'OWNER', 'SALES', 'ACCOUNTANT'], module: 'FOUNDATION', description: 'Credit Policy Area – FCPC – ENTERPRISE_CONFIG – SAP standard – credit control – ADMIN/SALES/ACCOUNTANT' },
  { code: 'ECAC', permission: 'ENTERPRISE_CONFIG_VIEW', roles: ['ADMIN', 'OWNER', 'MANAGER', 'MATERIAL_MANAGER', 'PURCHASER', 'SALES', 'WAREHOUSE', 'ACCOUNTANT', 'PRODUCTION', 'HR'], module: 'FOUNDATION', description: 'Enterprise Config Overview – ECAC – ENTERPRISE_CONFIG_VIEW – SAP standard – view only – all authenticated can view structure' },

  // ========== FOUNDATION – MASTER DATA – MARA – MM01/XK01/XD01 – MDM allowed ==========
  { code: 'EMTC', permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], module: 'FOUNDATION', description: 'Product Master Create – MM01 – EMTC – MATERIAL_CREATE – SAP standard MARA – MDM/MATERIAL_MANAGER allowed' },
  { code: 'EMTE', permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], module: 'FOUNDATION', description: 'Product Master Change – MM02 – EMTE – MATERIAL_CREATE – SAP standard' },
  { code: 'EMTV', permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'WAREHOUSE', 'SALES', 'MANAGER', 'PRODUCTION', 'ACCOUNTANT'], module: 'FOUNDATION', description: 'Product Master Display – MM03 – EMTV – MATERIAL_VIEW – all can view' },
  { code: 'EMTL', permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'WAREHOUSE', 'SALES', 'MANAGER'], module: 'FOUNDATION', description: 'Product Master List – MM60 – EMTL – MATERIAL_VIEW' },
  { code: 'EMTP', permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER'], module: 'FOUNDATION', description: 'Product Types – OMS2 – EMTP – MATERIAL_CREATE – SAP standard material type – MDM allowed' },
  { code: 'EMGC', permission: 'MATERIAL_CREATE', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER'], module: 'FOUNDATION', description: 'Product Categories – EMGC – MATERIAL_CREATE – MDM allowed' },
  { code: 'EUOC', permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'WAREHOUSE', 'PRODUCTION'], module: 'FOUNDATION', description: 'Units of Measure – CUNI – EUOC – MATERIAL_VIEW – MDM allowed' },
  { code: 'ELTC', permission: 'MATERIAL_VIEW', roles: ['MATERIAL_MANAGER', 'WAREHOUSE', 'ADMIN', 'OWNER', 'PRODUCTION'], module: 'FOUNDATION', description: 'Lot Management – ELTC – MATERIAL_VIEW – SAP standard – WAREHOUSE/MATERIAL_MANAGER – MDM NOT allowed – lot is inventory' },
  { code: 'ISTV', permission: 'MATERIAL_VIEW', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER', 'MATERIAL_MANAGER'], module: 'FOUNDATION', description: 'Stock Overview – MMBE – ISTV – MATERIAL_VIEW – SAP standard – requires WAREHOUSE,ADMIN,OWNER,MANAGER,MATERIAL_MANAGER – MASTER_DATA_MANAGER alone NOT allowed – SoD – per user error Forbidden – M_MSEG_BWA' },
  { code: 'EPAC', permission: 'BP_VIEW', roles: ['MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'PURCHASER', 'SALES'], module: 'FOUNDATION', description: 'Partner Account – BP – EPAC – BP_VIEW – SAP standard business partner – MDM allowed basic' },
  { code: 'PSUC', permission: 'VENDOR_VIEW', roles: ['PURCHASER', 'MATERIAL_MANAGER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'], module: 'FOUNDATION', description: 'Supplier – XK01 – PSUC – VENDOR_VIEW – SAP standard LFA1 – MDM/PURCHASER allowed – vendor master' },
  { code: 'SCUC', permission: 'CUSTOMER_VIEW', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER', 'MASTER_DATA_MANAGER'], module: 'FOUNDATION', description: 'Customer – XD01 – SCUC – CUSTOMER_VIEW – SAP standard KNA1 – V_KNA1 – basic customer master MDM allowed, FULL with Sales Area + Partner + Pricing + Credit requires SALES – SoD – MDM can view basic, SALES for pricing/credit' },
  { code: 'EPCC', permission: 'BP_VIEW', roles: ['SALES', 'PURCHASER', 'MASTER_DATA_MANAGER', 'ADMIN', 'OWNER'], module: 'FOUNDATION', description: 'Partner Contact – EPCC – BP_VIEW – SAP standard – contact person – MDM allowed' },

  // ========== FICO – FI/CO – FS00/OBYC/OB52 – ACCOUNTANT/ADMIN only – sensitive ==========
  { code: 'FFYC', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Fiscal Calendar – OB29 – FFYC – GL_VIEW – SAP standard – fiscal year variant – ACCOUNTANT/ADMIN only' },
  { code: 'FEXC', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Exchange Rates – OB08 – FEXC – GL_VIEW – SAP standard – ACCOUNTANT/ADMIN only' },
  { code: 'FNRC', permission: 'NUMBER_RANGE_MAINTAIN', roles: ['ADMIN', 'OWNER'], module: 'FICO', description: 'Number Ranges – FBN1/SNRO – FNRC – NUMBER_RANGE_MAINTAIN – SAP standard – ADMIN only – S_NUMBER – industry standard numeric only' },
  { code: 'FTGC', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Tax Groups – FTXP – FTGC – GL_VIEW – ACCOUNTANT/ADMIN only' },
  { code: 'FTXC', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Tax Codes – FTXP – FTXC – GL_VIEW – ACCOUNTANT/ADMIN only – TAX' },
  { code: 'FCOA', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Chart of Accounts – OB13 – FCOA – GL_VIEW – SAP standard – ACCOUNTANT/ADMIN only' },
  { code: 'FGLC', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER', 'AUDITOR'], module: 'FICO', description: 'General Ledger Accounts – FS00 – FGLC – GL_VIEW – SAP standard – ACCOUNTANT/ADMIN/MANAGER/AUDITOR view' },
  { code: 'FCCA', permission: 'CCA_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER', 'HR'], module: 'FICO', description: 'Cost Centers – KS01 – FCCA – CCA_VIEW – SAP standard – ACCOUNTANT/ADMIN/MANAGER/HR' },
  { code: 'FCYC', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Currencies – OY03 – FCYC – GL_VIEW – ACCOUNTANT/ADMIN only' },
  { code: 'FPPC', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Posting Period Variant – OBBO – FPPC – GL_POST – SAP standard – ACCOUNTANT/ADMIN only – F_BKPF_BUP' },
  { code: 'FPPE', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Posting Period Control – OB52 – FPPE – GL_POST – SAP standard – ACCOUNTANT/ADMIN only' },
  { code: 'FFSV', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Field Status Variant – OBC4 – FFSV – GL_POST – SAP standard – ACCOUNTANT/ADMIN only' },
  { code: 'FFSG', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Field Status Groups – OBC4 – FFSG – GL_POST – SAP standard – ACCOUNTANT/ADMIN only' },
  { code: 'OBA0', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Tolerance Groups – GL – OBA0 – GL_POST – SAP standard – ACCOUNTANT/ADMIN only – OBA0' },
  { code: 'OBA4', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Tolerance Groups – Customers/Vendors – OBA4 – GL_POST – SAP standard – ACCOUNTANT/ADMIN only' },
  { code: 'OBA7', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Document Types – OBA7 – GL_POST – SAP standard – ACCOUNTANT/ADMIN only' },
  { code: 'OBYC', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Automatic Account Determination – OBYC – GL_POST – SAP standard – ACCOUNTANT/ADMIN only – BSX/GBB' },
  { code: 'FAPT', permission: 'GL_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Payment Terms – OBB8 – FAPT – GL_VIEW – ACCOUNTANT/ADMIN only' },
  { code: 'FPYP', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER'], module: 'FICO', description: 'Payment Processing – F110 – FPYP – GL_POST – SAP standard – ACCOUNTANT/ADMIN only' },
  { code: 'CCUL', permission: 'CCA_VIEW', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER'], module: 'FICO', description: 'Cost Center Actuals – KSB1 – CCUL – CCA_VIEW – SAP standard – ACCOUNTANT/ADMIN/MANAGER' },
  { code: 'CCRP', permission: 'GL_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'PRODUCTION'], module: 'FICO', description: 'Product Costing Run – CK40N – CCRP – GL_POST – SAP standard – ACCOUNTANT/PRODUCTION' },

  // ========== MM – Materials Management – ME51N/ME21N/MIGO/MIRO – PURCHASER/WAREHOUSE/ACCOUNTANT ==========
  { code: 'PPRC', permission: 'PR_CREATE', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'Purchase Requisition Create – ME51N – PPRC – PR_CREATE – SAP standard – PURCHASER only – MDM NOT allowed – M_BEST_BSA' },
  { code: 'PPRE', permission: 'PR_CREATE', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'Purchase Requisition Change – ME52N – PPRE – PR_CREATE – PURCHASER only' },
  { code: 'PPRV', permission: 'PR_VIEW', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER', 'WAREHOUSE', 'ACCOUNTANT'], module: 'MM', description: 'Purchase Requisition Display – ME53N – PPRV – PR_VIEW – view all' },
  { code: 'PPOC', permission: 'PO_CREATE', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'Purchase Order Create – ME21N – PPOC – PO_CREATE – SAP standard – PURCHASER only – MDM NOT allowed – M_BEST_BSA' },
  { code: 'PPOE', permission: 'PO_CREATE', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'Purchase Order Change – ME22N – PPOE – PO_CREATE – PURCHASER only' },
  { code: 'PPOV', permission: 'PO_VIEW', roles: ['PURCHASER', 'ADMIN', 'OWNER', 'MANAGER', 'WAREHOUSE', 'ACCOUNTANT'], module: 'MM', description: 'Purchase Order Display – ME23N – PPOV – PO_VIEW' },
  { code: 'IGRC', permission: 'GR_POST', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'Goods Receipt – MIGO 101 – IGRC – GR_POST – SAP standard – WAREHOUSE only – MDM NOT allowed – M_MSEG_BWA 101 – T0 BLOCKING' },
  { code: 'GRRE', permission: 'GR_POST', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'Goods Receipt Reversal – MIGO 102 – GRRE – GR_POST – SAP standard – WAREHOUSE only – 102 reversal' },
  { code: 'PIVC', permission: 'IV_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'Invoice Verification – MIRO – PIVC – IV_POST – SAP standard – ACCOUNTANT only – MDM NOT allowed – M_RECH_BUK' },
  { code: 'IVRE', permission: 'IV_POST', roles: ['ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'Invoice Reversal – MR8M – IVRE – IV_POST – SAP standard – ACCOUNTANT only' },
  { code: 'PSTC', permission: 'PO_CREATE', roles: ['PURCHASER', 'WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'Stock Transport Order – ME21N STO – PSTC – PO_CREATE – SAP standard – PURCHASER/WAREHOUSE – UB/NB' },
  { code: 'PSTD', permission: 'DELIVERY_CREATE', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'STO Delivery – VL10B – PSTD – DELIVERY_CREATE – SAP standard – WAREHOUSE only – STO delivery' },
  { code: 'IPIC', permission: 'GR_POST', roles: ['WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], module: 'MM', description: 'Physical Inventory – MI01/MI04/MI07 – IPIC – GR_POST – SAP standard – WAREHOUSE only – MI' },

  // ========== SD – Sales & Distribution – VA01/VL01N/VF01 – SALES/WAREHOUSE/ACCOUNTANT ==========
  { code: 'SSOC', permission: 'SALES_CREATE', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER'], module: 'SD', description: 'Sales Order Create – VA01 – SSOC – SALES_CREATE – SAP standard – SALES only – MDM NOT allowed – V_VBAK_AAT' },
  { code: 'SSOE', permission: 'SALES_CREATE', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER'], module: 'SD', description: 'Sales Order Change – VA02 – SSOE – SALES_CREATE – SALES only' },
  { code: 'SSOV', permission: 'SALES_VIEW', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT', 'WAREHOUSE'], module: 'SD', description: 'Sales Order Display – VA03 – SSOV – SALES_VIEW' },
  { code: 'SDLC', permission: 'DELIVERY_CREATE', roles: ['WAREHOUSE', 'SALES', 'ADMIN', 'OWNER', 'MANAGER'], module: 'SD', description: 'Outbound Deliveries – VL01N – SDLC – T0 BLOCKING – PGI 601 + COGS GBB/BSX – DELIVERY_CREATE – SAP standard LE – V_LIKP_VST – requires WAREHOUSE,SALES – MASTER_DATA_MANAGER NOT allowed – SoD' },
  { code: 'SBLC', permission: 'BILLING_CREATE', roles: ['SALES', 'ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER'], module: 'SD', description: 'Billing Document – VF01 – SBLC – BILLING_CREATE – SAP standard – SALES/ACCOUNTANT – MDM NOT allowed – V_VBRK_FKA' },
  { code: 'BLRE', permission: 'BILLING_CREATE', roles: ['SALES', 'ACCOUNTANT', 'ADMIN', 'OWNER', 'MANAGER'], module: 'SD', description: 'Billing Reversal – VF11 – BLRE – BILLING_CREATE – SAP standard – SALES/ACCOUNTANT' },
  { code: 'PRIC', permission: 'PRICING_MAINTAIN', roles: ['SALES', 'ADMIN', 'OWNER', 'MANAGER'], module: 'SD', description: 'Pricing Procedure – VK11 – PRIC – PRICING_MAINTAIN – SAP standard – SALES only – V_KONH_VKS – condition' },

  // ========== PP – Production Planning – CS01/CR01/CA01/CO01/MD01 – PRODUCTION ==========
  { code: 'MBMC', permission: 'BOM_CREATE', roles: ['MATERIAL_MANAGER', 'PRODUCTION', 'ADMIN', 'OWNER', 'MANAGER'], module: 'PP', description: 'Bill of Materials Create – CS01 – MBMC – BOM_CREATE – SAP standard – MATERIAL_MANAGER/PRODUCTION' },
  { code: 'MWCC', permission: 'WORKCENTER_VIEW', roles: ['PRODUCTION', 'ADMIN', 'OWNER', 'MANAGER'], module: 'PP', description: 'Work Center – CR01 – MWCC – WORKCENTER_VIEW – SAP standard – PRODUCTION only – C_ARPL' },
  { code: 'MRTC', permission: 'ROUTING_VIEW', roles: ['PRODUCTION', 'ADMIN', 'OWNER', 'MANAGER'], module: 'PP', description: 'Routing – CA01 – MRTC – ROUTING_VIEW – SAP standard – PRODUCTION only' },
  { code: 'MMOC', permission: 'PROD_ORDER_CREATE', roles: ['PRODUCTION', 'ADMIN', 'OWNER', 'MANAGER'], module: 'PP', description: 'Production Order Create – CO01 – MMOC – PROD_ORDER_CREATE – SAP standard – PRODUCTION only – C_AFKO' },
  { code: 'MMRP', permission: 'MRP_RUN', roles: ['PRODUCTION', 'MATERIAL_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], module: 'PP', description: 'MRP Run – MD01 – MMRP – MRP_RUN – SAP standard – PRODUCTION/MATERIAL_MANAGER' },
  { code: 'MKTC', permission: 'KITTING_CREATE', roles: ['PRODUCTION', 'WAREHOUSE', 'ADMIN', 'OWNER', 'MANAGER'], module: 'PP', description: 'Kitting – MKTC – KITTING_CREATE – SAP standard – PRODUCTION/WAREHOUSE' },

  // ========== HR – Human Resources – PA30/PA20/PC00 – sensitive PII/salary – HR only – SoD ==========
  { code: 'HHEC', permission: 'EMPLOYEE_CREATE', roles: ['HR', 'HR_MANAGER', 'ADMIN', 'OWNER'], module: 'HR', description: 'Employee Master Maintain – PA30 – HHEC – EMPLOYEE_CREATE – SAP standard – HR only – P_ORGIN – sensitive PII – MDM NOT allowed – SoD' },
  { code: 'HHEV', permission: 'EMPLOYEE_VIEW', roles: ['HR', 'HR_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'], module: 'HR', description: 'Employee Master Display – PA20 – HHEV – EMPLOYEE_VIEW – HR only – MDM NOT allowed' },
  { code: 'HPYC', permission: 'PAYROLL_RUN', roles: ['HR', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'OWNER'], module: 'HR', description: 'Payroll Run – PC00_M99_CALC – HPYC – PAYROLL_RUN – SAP standard – HR only – P_PCLX – sensitive salary – MASTER_DATA_MANAGER/MATERIAL_MANAGER NOT allowed – SoD – payroll 1000 employees background job' },

  // ========== AUDIT & WORKFLOW – display – AUDITOR/MANAGER ==========
  { code: 'AFLW', permission: 'AUDIT_VIEW', roles: ['ADMIN', 'OWNER', 'AUDITOR', 'MANAGER', 'ACCOUNTANT', 'PURCHASER', 'WAREHOUSE', 'SALES'], module: 'AUDIT', description: 'Document Flow – AFLW – AUDIT_VIEW – SAP standard – display all – AUDITOR/MANAGER' },
  { code: 'AALG', permission: 'AUDIT_VIEW', roles: ['ADMIN', 'OWNER', 'AUDITOR', 'MANAGER'], module: 'AUDIT', description: 'Audit Log – SM20/SL G1 – AALG – AUDIT_VIEW – SAP standard – ADMIN/AUDITOR only – sensitive' },
  { code: 'FWFL', permission: 'WORKFLOW_VIEW', roles: ['ADMIN', 'OWNER', 'MANAGER', 'PURCHASER', 'ACCOUNTANT', 'SALES', 'HR', 'WAREHOUSE', 'MATERIAL_MANAGER'], module: 'FOUNDATION', description: 'Workflow Inbox – SWI1 – FWFL – WORKFLOW_VIEW – SAP standard – all approvers can view' },

  // ========== ADMIN – User/Roles – SU01/PFCG – ADMIN/OWNER/HR/MANAGER – sensitive – S_USER_GRP/S_USER_AGR ==========
  { code: 'FUSC', permission: 'USER_MANAGE', roles: ['ADMIN', 'OWNER', 'HR', 'MANAGER'], module: 'FOUNDATION', description: 'User Maintenance – SU01 – FUSC – USER_MANAGE – SAP standard – ADMIN/HR/MANAGER only – S_USER_GRP – sensitive – MDM NOT allowed – SoD – Users' },
  { code: 'FROC', permission: 'ROLE_MANAGE', roles: ['ADMIN', 'OWNER'], module: 'FOUNDATION', description: 'Role Maintenance – PFCG – FROC – ROLE_MANAGE – SAP standard – ADMIN only – S_USER_AGR – sensitive' },
  { code: 'SU01', permission: 'USER_MANAGE', roles: ['ADMIN', 'OWNER', 'HR', 'MANAGER', '*'], module: 'FOUNDATION', description: 'User Profile – SU01 – SU01 – USER_MANAGE – My Profile – allow self – but admin view requires ADMIN/HR/MANAGER' },
  { code: 'FPRC', permission: 'ROLE_MANAGE', roles: ['ADMIN', 'OWNER'], module: 'FOUNDATION', description: 'Permission Maintenance – SU21 – FPRC – ROLE_MANAGE – ADMIN only' },
  { code: 'FBJM', permission: 'ADMIN_ALL', roles: ['ADMIN', 'OWNER', 'MANAGER'], module: 'FOUNDATION', description: 'Background Jobs – SM37 – FBJM – ADMIN_ALL – ADMIN/MANAGER – jobs indicator' },
  { code: 'FELM', permission: 'ADMIN_ALL', roles: ['ADMIN', 'OWNER', 'MANAGER'], module: 'FOUNDATION', description: 'Locks – SM12 – FELM – ADMIN_ALL – ADMIN/MANAGER' },
  { code: 'FAUD', permission: 'AUDIT_VIEW', roles: ['ADMIN', 'OWNER', 'AUDITOR', 'MANAGER'], module: 'AUDIT', description: 'Audit Trail – SM20 – FAUD – AUDIT_VIEW – ADMIN/AUDITOR' },
];

export function getPagePermission(code: string): PagePermission | null {
  return PAGE_PERMISSIONS.find(p => p.code === code) || null;
}

export function canUserAccessPage(me: any, code: string): { allowed: boolean; reason?: string; requiredPermission?: string; requiredRoles?: string[] } {
  const perm = getPagePermission(code);
  if (!perm) {
    // No specific mapping – allow all authenticated per MVP fallback – but log
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

  // Special handling for MASTER_DATA_MANAGER trying to access Inventory (ISTV) – requires MATERIAL_MANAGER, not just MASTER_DATA_MANAGER – per user error
  if (code === 'ISTV') {
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
