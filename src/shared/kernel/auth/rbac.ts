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
      FROM ent_user_role ur
      JOIN ent_role r ON ur.role_id = r.id
      JOIN ent_role_permission rp ON r.id = rp.role_id
      JOIN ent_permission p ON rp.permission_id = p.id
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
      FROM ent_user_role ur
      JOIN ent_role r ON ur.role_id = r.id
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
  // MM
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
  // SD
  SALES_CREATE: 'SALES_CREATE',
  SALES_VIEW: 'SALES_VIEW',
  DELIVERY_CREATE: 'DELIVERY_CREATE',
  BILLING_CREATE: 'BILLING_CREATE',
  // FICO
  GL_VIEW: 'GL_VIEW',
  GL_POST: 'GL_POST',
  CCA_VIEW: 'CCA_VIEW',
  PAYROLL_RUN: 'PAYROLL_RUN',
  PAYROLL_APPROVE: 'PAYROLL_APPROVE',
  // Foundation
  MATERIAL_CREATE: 'MATERIAL_CREATE',
  MATERIAL_VIEW: 'MATERIAL_VIEW',
  PLANT_VIEW: 'PLANT_VIEW',
  // HR
  EMPLOYEE_VIEW: 'EMPLOYEE_VIEW',
  EMPLOYEE_CREATE: 'EMPLOYEE_CREATE',
  // Admin
  ADMIN_ALL: 'ADMIN_ALL',
  USER_MANAGE: 'USER_MANAGE',
  ROLE_MANAGE: 'ROLE_MANAGE',
};

export const ROLES = {
  ADMIN: 'ADMIN',
  PURCHASER: 'PURCHASER',
  WAREHOUSE: 'WAREHOUSE',
  ACCOUNTANT: 'ACCOUNTANT',
  SALES: 'SALES',
  MANAGER: 'MANAGER',
  OWNER: 'OWNER',
  HR: 'HR',
  AUDITOR: 'AUDITOR',
};
