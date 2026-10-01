import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { auth } from '@/auth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { getUserPermissions, getUserRoles } from '@/shared/kernel/auth/rbac';

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role || 'USER';
    const email = session?.user?.email;

    let roles: string[] = [];
    let permissions: string[] = [];

    if (userId) {
      try {
        roles = await getUserRoles(userId);
      } catch {}
      try {
        permissions = await getUserPermissions(userId);
      } catch {}
    }

    // Also get detailed roles from auth_user_role
    let detailedRoles: any[] = [];
    try {
      if (userId) {
        const res = await db.execute(sql`
          SELECT r.code, r.name FROM auth_user_role ur JOIN auth_role r ON ur.role_id = r.id WHERE ur.user_id = ${userId}
        `);
        detailedRoles = res.rows;
        // Merge into roles
        for (const r of res.rows as any[]) {
          if (!roles.includes(r.code)) roles.push(r.code);
        }
      }
    } catch {}

    // Determine if master data manager
    const isMasterDataManager = roles.includes('MASTER_DATA_MANAGER') || roles.includes('MATERIAL_MANAGER') || roles.includes('MDM') || userRole === 'MASTER_DATA_MANAGER' || permissions.includes('MATERIAL_CREATE') && !permissions.includes('PAYROLL_RUN');

    const isHR = roles.includes('HR') || roles.includes('HR_MANAGER') || roles.includes('PAYROLL_MANAGER') || userRole === 'HR' || permissions.includes('PAYROLL_RUN') || permissions.includes('EMPLOYEE_VIEW');

    const isAdmin = roles.includes('ADMIN') || roles.includes('OWNER') || userRole === 'ADMIN' || userRole === 'OWNER' || permissions.includes('ADMIN_ALL');

    return NextResponse.json({
      userId,
      email,
      simpleRole: userRole,
      roles,
      detailedRoles,
      permissions,
      isAdmin,
      isHR,
      isMasterDataManager,
      canAccessPayroll: isAdmin || isHR,
      canAccessHRMaster: isAdmin || isHR,
      canAccessMaterial: isAdmin || roles.includes('MATERIAL_MANAGER') || roles.includes('MASTER_DATA_MANAGER') || permissions.includes('MATERIAL_CREATE') || permissions.includes('MATERIAL_VIEW'),
      message: `User ${email} role ${userRole} roles ${roles.join(',')} perms ${permissions.length} – canAccessPayroll=${isAdmin || isHR} canAccessMaterial=${true} – industry standard RBAC`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
