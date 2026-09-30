import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Enterprise API Auth Guard - Defense in Depth
 * Even if middleware is bypassed, API routes enforce auth when MVP_NO_AUTH != 'true'
 * 
 * Usage in API route:
 *   const authCheck = await requireApiAuth(req);
 *   if (authCheck) return authCheck; // returns 401 response if unauthorized
 */

export async function requireApiAuth(req?: NextRequest): Promise<NextResponse | null> {
  const mvpNoAuth = process.env.MVP_NO_AUTH === 'true';
  
  // MVP open mode - allow all (demo only)
  if (mvpNoAuth) {
    return null;
  }

  // Secure mode - check session via Auth.js
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      // Also allow POS webhook with API key as fallback (system integration)
      if (req) {
        const pathname = new URL(req.url).pathname;
        if (pathname.startsWith('/api/sales/issue')) {
          const apiKey = req.headers.get('x-api-key');
          const expectedKey = process.env.POS_WEBHOOK_API_KEY || 'enterprise-pos-key-kspl-2024';
          if (apiKey && (apiKey === expectedKey || apiKey === process.env.NEXTAUTH_SECRET)) {
            return null; // valid API key, allow
          }
        }
      }
      
      return NextResponse.json(
        { 
          error: 'Unauthorized - login required',
          code: 'UNAUTHORIZED',
          hint: 'POST /api/auth/callback/credentials with email/password or set MVP_NO_AUTH=true for MVP'
        },
        { status: 401 }
      );
    }

    // Session valid - allow
    return null;
  } catch (e: any) {
    console.error('Auth check failed:', e.message);
    // In case of DB error during auth check, allow in setup mode but log
    // For production, should block - but for now allow to avoid lockout during migration
    if (process.env.NODE_ENV === 'development' || process.env.AUTO_MIGRATE === 'true') {
      console.warn('Auth DB error, allowing in setup mode');
      return null;
    }
    return NextResponse.json(
      { error: 'Auth check failed', code: 'AUTH_ERROR', details: e.message },
      { status: 401 }
    );
  }
}

/**
 * Check if current user has permission - for RBAC – industry standard FRPC
 * Strict for sensitive permissions like PAYROLL_RUN, EMPLOYEE_VIEW – SoD segregation of duties
 * Master data manager (MATERIAL_CREATE) cannot access HR Payroll – must have HR role or PAYROLL_RUN permission
 */
export async function requirePermission(permissionCode: string): Promise<NextResponse | null> {
  const mvpNoAuth = process.env.MVP_NO_AUTH === 'true';
  if (mvpNoAuth) return null;

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any)?.role;
  const userId = (session.user as any)?.id;

  // ADMIN, OWNER always allowed – industry standard super user
  if (userRole === 'ADMIN' || userRole === 'OWNER') {
    return null;
  }

  // For HR sensitive permissions, check simpleRole first – master data manager should NOT have PAYROLL_RUN
  const hrRoles = ['HR', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'OWNER', 'MANAGER'];
  const materialOnlyRoles = ['MASTER_DATA_MANAGER', 'MATERIAL_MANAGER', 'MDM', 'PURCHASER', 'WAREHOUSE', 'SALES'];

  if (permissionCode === 'PAYROLL_RUN' || permissionCode === 'PAYROLL_APPROVE') {
    // If user is master data manager only, deny
    if (materialOnlyRoles.includes(userRole) && !hrRoles.includes(userRole)) {
      return NextResponse.json(
        { 
          error: `Forbidden – master data manager role ${userRole} cannot access payroll – requires HR role or PAYROLL_RUN permission – SoD segregation of duties – industry standard`,
          code: 'FORBIDDEN',
          required: permissionCode,
          requiredRoles: hrRoles,
          currentRole: userRole,
          explanation: 'Payroll contains sensitive salary data – only HR, ADMIN, OWNER with PAYROLL_RUN can access – master data manager has only FOUNDATION permissions'
        },
        { status: 403 }
      );
    }
  }

  if (permissionCode === 'EMPLOYEE_VIEW' || permissionCode === 'EMPLOYEE_CREATE') {
    // Employee master also HR sensitive, but allow MANAGER as well for view
    if (materialOnlyRoles.includes(userRole) && !['HR','HR_MANAGER','ADMIN','OWNER','MANAGER','PAYROLL_MANAGER'].includes(userRole)) {
      // Still check detailed permissions – maybe user has HR permission via ent_user_role
      // Fall through to detailed check below – don't deny yet
    }
  }

  // Check detailed permissions via ent_user_role / ent_role_permission – FRPC
  try {
    const { hasPermission, getUserRoles } = await import('./rbac');
    if (userId) {
      const hasPerm = await hasPermission(userId, permissionCode);
      if (hasPerm) {
        return null; // has explicit permission
      }

      // Also check if user has HR role via detailed roles
      const roles = await getUserRoles(userId);
      const isHR = roles.some((r: string) => hrRoles.includes(r));
      const isAdmin = roles.includes('ADMIN') || roles.includes('OWNER') || roles.includes('ADMIN_ALL');

      if (isAdmin) return null;

      if ((permissionCode === 'PAYROLL_RUN' || permissionCode === 'EMPLOYEE_VIEW' || permissionCode === 'EMPLOYEE_CREATE') && isHR) {
        return null; // HR role allows HR perms
      }

      // For sensitive perms, if no explicit permission and not HR/Admin, deny
      if (['PAYROLL_RUN', 'PAYROLL_APPROVE', 'EMPLOYEE_VIEW', 'EMPLOYEE_CREATE'].includes(permissionCode)) {
        return NextResponse.json(
          { 
            error: `Forbidden – requires permission ${permissionCode} – user ${userId} role ${userRole} roles [${roles.join(',')}] does not have it – need HR role or ADMIN – FRPC`,
            code: 'FORBIDDEN',
            required: permissionCode,
            currentRoles: roles,
            currentSimpleRole: userRole,
            explanation: 'Master data manager cannot access HR – SoD – payroll sensitive'
          },
          { status: 403 }
        );
      }

      // For other perms, allow if ADMIN_ALL or hasPerm, else deny if strict?
      // For backward compat, allow non-sensitive perms if no roles assigned (MVP) – but log
      // For sensitive, we already denied above
      // For non-sensitive, check if user has no roles – allow for MVP
      if (roles.length === 0) {
        console.warn(`RBAC: User ${userId} has no roles – allowing ${permissionCode} for MVP – in production should deny`);
        return null;
      }

      // If we reach here for non-sensitive, deny
      if (!hasPerm) {
        return NextResponse.json(
          { error: `Forbidden – requires permission ${permissionCode}`, code: 'FORBIDDEN', currentRoles: roles },
          { status: 403 }
        );
      }
    }
  } catch (e: any) {
    console.warn('RBAC check failed:', (e as any).message);
    // For sensitive perms, deny on error – secure by default
    if (['PAYROLL_RUN', 'PAYROLL_APPROVE', 'EMPLOYEE_VIEW', 'EMPLOYEE_CREATE'].includes(permissionCode)) {
      return NextResponse.json(
        { error: `Forbidden – RBAC check failed for ${permissionCode} – secure by default – ${e.message}`, code: 'FORBIDDEN' },
        { status: 403 }
      );
    }
    // For non-sensitive, allow to avoid lockout
  }

  return null;
}
