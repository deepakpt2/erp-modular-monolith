import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
  permissions?: string[];
  employeeId?: string;
  companyCodeId?: string;
  plantId?: string;
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const res = await db.execute(sql`
      SELECT DISTINCT p.code
      FROM auth_user_role ur
      JOIN auth_role r ON ur.role_id = r.id
      JOIN auth_role_permission rp ON r.id = rp.role_id
      JOIN auth_permission p ON rp.permission_id = p.id
      WHERE ur.user_id = ${userId}
    `);
    return res.rows.map((r: any) => r.code);
  } catch (e) {
    console.warn('RBAC permission fetch failed:', (e as any).message);
    return [];
  }
}

export async function getUserRoles(userId: string): Promise<string[]> {
  try {
    const res = await db.execute(sql`
      SELECT DISTINCT r.code
      FROM auth_user_role ur
      JOIN auth_role r ON ur.role_id = r.id
      WHERE ur.user_id = ${userId}
    `);
    return res.rows.map((r: any) => r.code);
  } catch (e) {
    return [];
  }
}

export async function hasPermission(userId: string, permissionCode: string): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  if (perms.includes('ADMIN_ALL')) return true;
  return perms.includes(permissionCode);
}

export async function hasRole(userId: string, roleCode: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  if (roles.includes('ADMIN')) return true;
  return roles.includes(roleCode);
}

export async function canApproveDocument(userId: string, documentType: string, amount: number, currency: string = 'INR'): Promise<{ canApprove: boolean; level: string; reason?: string }> {
  try {
    // Get employee's position
    const empRes = await db.execute(sql`
      SELECT e.id, e.position_id, p.code as position_code, p.is_manager, p.is_owner
      FROM hr_employee e
      JOIN hr_position p ON e.position_id = p.id
      WHERE e.user_id = ${userId}
      LIMIT 1
    `);
    if (empRes.rows.length === 0) {
      return { canApprove: false, level: 'NONE', reason: 'No employee linked to user' };
    }
    const emp = empRes.rows[0] as any;

    // Check approval authority
    const authRes = await db.execute(sql`
      SELECT level, max_amount, requires_dual
      FROM ent_approval_authority
      WHERE position_id = ${emp.position_id}
        AND document_type = ${documentType}
        AND min_amount <= ${amount}
        AND max_amount >= ${amount}
      LIMIT 1
    `);

    if (authRes.rows.length === 0) {
      // Fallback: manager can approve up to 10000, owner unlimited
      if (emp.is_owner) return { canApprove: true, level: 'OWNER' };
      if (emp.is_manager && amount <= 10000) return { canApprove: true, level: 'LEVEL_2' };
      if (amount <= 1000) return { canApprove: true, level: 'LEVEL_1' };
      return { canApprove: false, level: 'NONE', reason: `No approval authority for ${documentType} amount ${amount}` };
    }

    const auth = authRes.rows[0] as any;
    return { canApprove: true, level: auth.level };
  } catch (e: any) {
    console.warn('Approval check failed:', e.message);
    return { canApprove: true, level: 'LEVEL_1' }; // Allow in setup mode
  }
}

export const PERMISSIONS = {
  // MM – Materials Management – M_BEST_BSA/M_MSEG_BWA/M_RECH_BUK
  PR_CREATE: 'PR_CREATE',
  PR_APPROVE: 'PR_APPROVE',
  PR_VIEW: 'PR_VIEW',
  PO_CREATE: 'PO_CREATE',
  PO_APPROVE: 'PO_APPROVE',
  PO_VIEW: 'PO_VIEW',
  GR_POST: 'GR_POST',
  GR_VIEW: 'GR_VIEW',
  IV_POST: 'IV_POST',
  IV_VIEW: 'IV_VIEW',
  // SD – Sales & Distribution – V_VBAK_AAT/V_LIKP_VST/V_VBRK_FKA
  SALES_CREATE: 'SALES_CREATE',
  SALES_VIEW: 'SALES_VIEW',
  DELIVERY_CREATE: 'DELIVERY_CREATE',
  DELIVERY_VIEW: 'DELIVERY_VIEW',
  BILLING_CREATE: 'BILLING_CREATE',
  BILLING_VIEW: 'BILLING_VIEW',
  PRICING_MAINTAIN: 'PRICING_MAINTAIN',
  CUSTOMER_VIEW: 'CUSTOMER_VIEW',
  CUSTOMER_CREATE: 'CUSTOMER_CREATE',
  VENDOR_VIEW: 'VENDOR_VIEW',
  VENDOR_CREATE: 'VENDOR_CREATE',
  // FICO – Financials – F_BKPF_BUK/F_BKPF_KTO/F_BKPF_BUP
  GL_VIEW: 'GL_VIEW',
  GL_POST: 'GL_POST',
  CCA_VIEW: 'CCA_VIEW',
  CCA_POST: 'CCA_POST',
  // HR – P_ORGIN/P_PCLX
  PAYROLL_RUN: 'PAYROLL_RUN',
  PAYROLL_APPROVE: 'PAYROLL_APPROVE',
  EMPLOYEE_VIEW: 'EMPLOYEE_VIEW',
  EMPLOYEE_CREATE: 'EMPLOYEE_CREATE',
  // Foundation – MARA – M_MATE_MAR
  MATERIAL_CREATE: 'MATERIAL_CREATE',
  MATERIAL_VIEW: 'MATERIAL_VIEW',
  BOM_CREATE: 'BOM_CREATE',
  BOM_VIEW: 'BOM_VIEW',
  BP_VIEW: 'BP_VIEW',
  BP_CREATE: 'BP_CREATE',
  PLANT_VIEW: 'PLANT_VIEW',
  // Enterprise Structure – IMG – OX02
  ENTERPRISE_CONFIG: 'ENTERPRISE_CONFIG',
  ENTERPRISE_CONFIG_VIEW: 'ENTERPRISE_CONFIG_VIEW',
  // PP – Production – C_AFKO/C_ARPL
  WORKCENTER_VIEW: 'WORKCENTER_VIEW',
  WORKCENTER_CREATE: 'WORKCENTER_CREATE',
  ROUTING_VIEW: 'ROUTING_VIEW',
  ROUTING_CREATE: 'ROUTING_CREATE',
  PROD_ORDER_CREATE: 'PROD_ORDER_CREATE',
  PROD_ORDER_VIEW: 'PROD_ORDER_VIEW',
  MRP_RUN: 'MRP_RUN',
  KITTING_CREATE: 'KITTING_CREATE',
  KITTING_VIEW: 'KITTING_VIEW',
  // Number Range – S_NUMBER
  NUMBER_RANGE_MAINTAIN: 'NUMBER_RANGE_MAINTAIN',
  // Audit & Workflow
  AUDIT_VIEW: 'AUDIT_VIEW',
  WORKFLOW_VIEW: 'WORKFLOW_VIEW',
  WORKFLOW_APPROVE: 'WORKFLOW_APPROVE',
  // Admin – SU01/PFCG – S_USER_GRP/S_USER_AGR
  ADMIN_ALL: 'ADMIN_ALL',
  USER_MANAGE: 'USER_MANAGE',
  ROLE_MANAGE: 'ROLE_MANAGE',
};

export const ROLES = {
  // SAP standard composite roles – industry standard ERP
  ADMIN: 'ADMIN', // SAP_ALL – BASIS – full access – SPRO IMG
  OWNER: 'OWNER', // Business owner – full access except BASIS config
  MANAGER: 'MANAGER', // Approval + view all – workflow approval – not IMG config
  // Master Data
  MATERIAL_MANAGER: 'MATERIAL_MANAGER', // MM master data – MM01/MM02/CS01/MMBE view – not transactional PO/GR
  MASTER_DATA_MANAGER: 'MASTER_DATA_MANAGER', // MDM – master data only – materials, BP basic, UoM – NOT transactional, NOT IMG, NOT HR, NOT FI
  // MM – Purchasing
  PURCHASER: 'PURCHASER', // ME51N/ME21N/ME28 – PR/PO create/view – GR view – M_BEST_BSA
  WAREHOUSE: 'WAREHOUSE', // MIGO/MMBE/MI01/VL01N – GR post, stock overview, delivery – M_MSEG_BWA – WAREHOUSE/INVENTORY_MANAGER
  // SD – Sales
  SALES: 'SALES', // VA01/VL01N/VF01/XD01 – sales order, delivery, billing, customer – V_VBAK_AAT
  // FICO – Finance
  ACCOUNTANT: 'ACCOUNTANT', // FS00/FB01/MIRO/OBYC – GL, AP, AR, costing – F_BKPF_BUK – ACCOUNTANT/FINANCE
  // PP – Production
  PRODUCTION: 'PRODUCTION', // CS01/CR01/CA01/CO01/MD01 – BOM, work center, routing, prod order, MRP – PRODUCTION/PRODUCTION_MANAGER
  // HR – Human Resources
  HR: 'HR', // PA30/PA20 – employee master – P_ORGIN – HR/HR_MANAGER basic
  HR_MANAGER: 'HR_MANAGER', // PA30/PA20/PC00 view – HR manager – can view HR + approve
  PAYROLL_MANAGER: 'PAYROLL_MANAGER', // PC00 – payroll run – P_PCLX – sensitive salary – PAYROLL_MANAGER
  // Audit
  AUDITOR: 'AUDITOR', // Display only – SM20/SL G1 – audit logs, document flow, GL view – AUDITOR
};

/**
 * Industry standard role descriptions – SAP parity – for documentation and /admin/roles UI
 */
export const ROLE_DESCRIPTIONS: Record<string, { description: string; sapEquivalent: string; modules: string[]; sensitive: boolean }> = {
  ADMIN: { description: 'System Administrator – SAP_ALL – full access to all transactions including IMG config SPRO, master data, transactional, HR, FI – BASIS', sapEquivalent: 'SAP_ALL, SAP_NEW, S_A.SYSTEM', modules: ['FOUNDATION', 'MM', 'SD', 'FICO', 'PP', 'HR', 'AUDIT'], sensitive: true },
  OWNER: { description: 'Business Owner – full business access except BASIS config – can approve all, view all, manage users', sapEquivalent: 'S_A.CUSTOMER_OWNER', modules: ['FOUNDATION', 'MM', 'SD', 'FICO', 'PP', 'HR', 'AUDIT'], sensitive: true },
  MANAGER: { description: 'Manager – approval + view all – can approve PR/PO, workflow, view reports – not IMG config – SoD', sapEquivalent: 'S_A.MANAGER', modules: ['FOUNDATION', 'MM', 'SD', 'FICO', 'PP', 'HR'], sensitive: false },
  MATERIAL_MANAGER: { description: 'Material Manager – MM master data – MM01/MM02/MM03, BOM CS01 view, MMBE stock view – M_MATE_MAR – not transactional PO/GR – master data only', sapEquivalent: 'SAP_BR_MATERIAL_MANAGER, M_MATE_MAR', modules: ['FOUNDATION', 'PP'], sensitive: false },
  MASTER_DATA_MANAGER: { description: 'Master Data Manager – MDM – master data only – materials, BP basic, UoM, product types – NOT transactional (PR/PO/GR/Delivery/Billing), NOT IMG enterprise structure, NOT HR payroll, NOT FI posting – SoD – industry standard MDM', sapEquivalent: 'SAP_MD_MDM, M_MATE_MAR, V_KNA1 basic, LFA1 basic', modules: ['FOUNDATION'], sensitive: false },
  PURCHASER: { description: 'Purchaser – ME51N PR, ME21N PO, ME28 release, MIGO display – M_BEST_BSA – PR/PO create/view – GR view – not material create, not FI post – SoD', sapEquivalent: 'SAP_BR_PURCHASER, M_BEST_BSA, M_BEST_EKG', modules: ['MM'], sensitive: false },
  WAREHOUSE: { description: 'Warehouse Manager – MIGO 101/102 GR post/reversal, MMBE stock overview, MI01 physical inventory, VL01N outbound delivery, VL10B STO delivery – M_MSEG_BWA – WAREHOUSE/INVENTORY_MANAGER – not PR/PO create – SoD', sapEquivalent: 'SAP_BR_WAREHOUSE_CLERK, M_MSEG_BWA, V_LIKP_VST', modules: ['MM', 'SD'], sensitive: false },
  SALES: { description: 'Sales – VA01 sales order, VL01N outbound delivery, VF01 billing, XD01 customer master, VK11 pricing – V_VBAK_AAT/V_LIKP_VST/V_VBRK_FKA – SALES/SALES_MANAGER – not purchasing, not GR – SoD', sapEquivalent: 'SAP_BR_SALES_REP, V_VBAK_AAT, V_KNA1', modules: ['SD', 'FOUNDATION'], sensitive: false },
  ACCOUNTANT: { description: 'Accountant – FS00 GL, FB01 posting, MIRO invoice verification, OBYC auto account, OB52 posting period, F110 payment, KSB1 CCA report, CK40N costing – F_BKPF_BUK/F_BKPF_KTO – ACCOUNTANT/FINANCE – not MM/SD creation – SoD', sapEquivalent: 'SAP_BR_GL_ACCOUNTANT, F_BKPF_BUK, F_BKPF_KTO', modules: ['FICO', 'MM'], sensitive: true },
  PRODUCTION: { description: 'Production – CS01 BOM, CR01 work center, CA01 routing, CO01 production order, MD01 MRP, kitting – C_AFKO/C_ARPL – PRODUCTION/PRODUCTION_MANAGER – not purchasing, not sales – SoD', sapEquivalent: 'SAP_BR_PRODUCTION_PLANNER, C_AFKO, C_ARPL', modules: ['PP', 'FICO'], sensitive: false },
  HR: { description: 'HR – PA30 maintain HR master, PA20 display – P_ORGIN – employee master PII – HR only – MDM NOT allowed – SoD', sapEquivalent: 'SAP_BR_HR_MANAGER, P_ORGIN', modules: ['HR'], sensitive: true },
  HR_MANAGER: { description: 'HR Manager – PA30/PA20/PC00 view, org units, positions – P_ORGIN – HR manager – can view HR + approve + manage users – sensitive PII', sapEquivalent: 'SAP_BR_HR_MANAGER, P_ORGIN, P_PCLX display', modules: ['HR', 'FICO'], sensitive: true },
  PAYROLL_MANAGER: { description: 'Payroll Manager – PC00_M99_CALC payroll run, payroll approval – P_PCLX – sensitive salary data – HR only – MDM/MATERIAL_MANAGER NOT allowed – SoD – background job 1000 employees', sapEquivalent: 'SAP_BR_PAYROLL_MANAGER, P_PCLX', modules: ['HR'], sensitive: true },
  AUDITOR: { description: 'Auditor – display only – SM20 audit log, document flow, GL view, workflow inbox view – no create/post – AUDITOR – read-only', sapEquivalent: 'SAP_BR_AUDITOR, AUDIT_VIEW', modules: ['AUDIT', 'FICO'], sensitive: false },
};
