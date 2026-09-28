import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { auth } from '@/auth';

/**
 * Roles & Permissions API
 * GET /api/roles - List roles with permissions
 * POST /api/roles - Create role (ADMIN)
 * PUT /api/roles - Update role permissions
 * 
 * Tables: ent_role, ent_permission, ent_role_permission
 * Access levels stored in:
 * - ent_role.code: ADMIN, OWNER, PURCHASER, WAREHOUSE, ACCOUNTANT, SALES, MANAGER, HR, AUDITOR, PRODUCTION, etc
 * - ent_permission.code: PR_CREATE, PR_APPROVE, PO_CREATE, PO_APPROVE, GR_POST, IV_POST, SALES_CREATE, BILLING_CREATE, etc + T-code mapping
 * - ent_role_permission: links role to permissions (which T-codes a role can access)
 * - ent_user_role: assigns role to user with company_code_id, plant_id, assigned_by
 * - auth_user.role: simple role for quick checks
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const includePermissions = searchParams.get('include') !== 'false';

  try {
    const rolesRes = await db.execute(sql`
      SELECT id, code, name, description, is_system, created_at FROM ent_role ORDER BY code
    `);

    let rolesWithPerms = rolesRes.rows;

    if (includePermissions) {
      rolesWithPerms = await Promise.all(rolesRes.rows.map(async (role: any) => {
        try {
          const permsRes = await db.execute(sql`
            SELECT p.id, p.code, p.name, p.module, p.description
            FROM ent_role_permission rp
            JOIN ent_permission p ON rp.permission_id = p.id
            WHERE rp.role_id = ${role.id}
            ORDER BY p.module, p.code
          `);
          const usersRes = await db.execute(sql`
            SELECT COUNT(*) as user_count FROM ent_user_role WHERE role_id = ${role.id}
          `);
          return {
            ...role,
            permissions: permsRes.rows,
            permission_count: permsRes.rows.length,
            user_count: (usersRes.rows[0] as any)?.user_count || 0,
          };
        } catch {
          return { ...role, permissions: [], permission_count: 0, user_count: 0 };
        }
      }));
    }

    // Also get all permissions for assignment UI
    const allPermsRes = await db.execute(sql`
      SELECT id, code, name, module, description FROM ent_permission ORDER BY module, code
    `).catch(() => ({ rows: [] }));

    return NextResponse.json({
      roles: rolesWithPerms,
      allPermissions: (allPermsRes as any).rows || [],
      count: rolesWithPerms.length,
      storage: {
        roles: 'ent_role table: code, name, description, is_system',
        permissions: 'ent_permission table: code (PR_CREATE, PO_APPROVE, etc), module (MM, SD, PP, FICO, HR), T-code mapping via code',
        rolePermissions: 'ent_role_permission table: role_id + permission_id (which T-codes a role can access)',
        userRoles: 'ent_user_role table: user_id + role_id + company_code_id + plant_id + assigned_by + assigned_at',
        simpleRole: 'auth_user.role field for quick checks: ADMIN, OWNER, USER, PURCHASER, etc',
      },
      functionMapping: 'T-code access controlled via permission code, e.g., ME51N requires PR_CREATE, ME21N requires PO_CREATE, MIGO requires GR_POST, VA01 requires SALES_CREATE, VF01 requires BILLING_CREATE',
    });
  } catch (e: any) {
    console.error('List roles failed:', e);
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const session = await auth();
  const currentRole = (session?.user as any)?.role;
  if (currentRole !== 'ADMIN' && currentRole !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden - ADMIN required to create roles' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { code, name, description, permissionIds } = body;

    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    const existing = await db.execute(sql`SELECT id FROM ent_role WHERE code = ${code} LIMIT 1`);
    if (existing.rows.length > 0) return NextResponse.json({ error: 'Role code already exists' }, { status: 400 });

    const roleRes = await db.execute(sql`
      INSERT INTO ent_role (code, name, description, is_system)
      VALUES (${code.toUpperCase()}, ${name}, ${description || null}, false)
      RETURNING id, code, name, description
    `);

    const roleId = (roleRes.rows[0] as any).id;

    if (permissionIds && Array.isArray(permissionIds)) {
      for (const permId of permissionIds) {
        try {
          await db.execute(sql`INSERT INTO ent_role_permission (role_id, permission_id) VALUES (${roleId}, ${permId})`);
        } catch {}
      }
    }

    return NextResponse.json({ success: true, role: roleRes.rows[0], message: `Role ${code} created` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const session = await auth();
  const currentRole = (session?.user as any)?.role;
  if (currentRole !== 'ADMIN' && currentRole !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden - ADMIN required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, permissionIds, action } = body;

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    if (action === 'SET_PERMISSIONS') {
      // Replace all permissions for role
      await db.execute(sql`DELETE FROM ent_role_permission WHERE role_id = ${id}`);
      if (permissionIds && Array.isArray(permissionIds)) {
        for (const permId of permissionIds) {
          await db.execute(sql`INSERT INTO ent_role_permission (role_id, permission_id) VALUES (${id}, ${permId}) ON CONFLICT DO NOTHING`);
        }
      }
      return NextResponse.json({ success: true, message: `Permissions set for role ${id}` });
    }

    return NextResponse.json({ error: 'Invalid action, use SET_PERMISSIONS' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
