import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { auth } from '@/auth';

/**
 * User-Role Assignment API
 * POST /api/user-roles - Assign role to user
 * DELETE /api/user-roles - Remove role from user
 * 
 * Who can set access level:
 * - Only ADMIN or OWNER can assign roles
 * - Access levels stored in 4 tables:
 *   1. auth_role: role definitions (ADMIN, PURCHASER, etc)
 *   2. auth_permission: permission definitions (PR_CREATE, etc)
 *   3. auth_role_permission: which permissions a role has (T-code access)
 *   4. auth_user_role: which roles a user has (user_id, role_id, company_code_id, plant_id)
 *   5. auth_user.role: simple role field for quick middleware checks
 */

function canAssignRoles(role: string, detailedRoles: string[] = []): boolean {
  const allowed = ['ADMIN', 'OWNER', 'HR', 'HR_MANAGER', 'MANAGER', 'HUMAN_RESOURCES'];
  if (allowed.includes(role)) return true;
  return detailedRoles.some(r => allowed.includes(r));
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const session = await auth();
  const currentRole = (session?.user as any)?.role || 'USER';
  const currentUserId = (session?.user as any)?.id;

  let detailedRoles: string[] = [];
  try {
    const roleRes = await db.execute(sql`SELECT r.code FROM auth_user_role ur JOIN auth_role r ON ur.role_id = r.id WHERE ur.user_id = ${currentUserId}`);
    detailedRoles = roleRes.rows.map((r: any) => r.code);
  } catch {}

  if (!canAssignRoles(currentRole, detailedRoles)) {
    return NextResponse.json({ error: 'Forbidden - ADMIN, OWNER, HR, MANAGER required to assign roles', code: 'FORBIDDEN', whereStored: 'auth_user_role + auth_role', allowedRoles: ['ADMIN','OWNER','HR','MANAGER'] }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, roleId, companyCodeId, plantId, roleCode } = body;

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    let finalRoleId = roleId;

    if (roleCode && !roleId) {
      const roleRes = await db.execute(sql`SELECT id FROM auth_role WHERE code = ${roleCode} LIMIT 1`);
      if (roleRes.rows.length === 0) return NextResponse.json({ error: `Role ${roleCode} not found` }, { status: 404 });
      finalRoleId = (roleRes.rows[0] as any).id;
    }

    if (!finalRoleId) return NextResponse.json({ error: 'roleId or roleCode required' }, { status: 400 });

    // Check if already assigned
    const existing = await db.execute(sql`
      SELECT id FROM auth_user_role WHERE user_id = ${userId} AND role_id = ${finalRoleId} LIMIT 1
    `);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Role already assigned to user' }, { status: 400 });
    }

    await db.execute(sql`
      INSERT INTO auth_user_role (user_id, role_id, company_code_id, plant_id, assigned_by)
      VALUES (${userId}, ${finalRoleId}, ${companyCodeId || null}, ${plantId || null}, ${currentUserId})
    `);

    // Also update simple role in auth_user for quick checks if roleCode provided
    if (roleCode) {
      try {
        await db.execute(sql`UPDATE auth_user SET role = ${roleCode} WHERE id = ${userId}`);
      } catch {}
    }

    // Get role and user info
    const infoRes = await db.execute(sql`
      SELECT u.email, r.code as role_code, r.name as role_name FROM auth_user u, auth_role r WHERE u.id = ${userId} AND r.id = ${finalRoleId}
    `);

    // Audit
    try {
      const info = infoRes.rows[0] as any;
      await db.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, description)
        VALUES ('auth_user_role', ${userId}, ${info?.email || userId}, 'INSERT', ${`ROLE ASSIGN: ${info?.email} -> ${info?.role_code} by ${(session?.user as any).email}`})
      `);
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Role ${(infoRes.rows[0] as any)?.role_code} assigned to ${(infoRes.rows[0] as any)?.email}`,
      assigned: { userId, roleId: finalRoleId, companyCodeId, plantId, assignedBy: currentUserId },
      whereStored: 'auth_user_role table with user_id, role_id, company_code_id, plant_id, assigned_by, assigned_at',
      functionAccess: 'User now gets T-codes via permissions in auth_role_permission for this role',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const session = await auth();
  const currentRole = (session?.user as any)?.role || 'USER';
  const currentUserId = (session?.user as any)?.id;

  let detailedRoles: string[] = [];
  try {
    const roleRes = await db.execute(sql`SELECT r.code FROM auth_user_role ur JOIN auth_role r ON ur.role_id = r.id WHERE ur.user_id = ${currentUserId}`);
    detailedRoles = roleRes.rows.map((r: any) => r.code);
  } catch {}

  if (!canAssignRoles(currentRole, detailedRoles)) {
    return NextResponse.json({ error: 'Forbidden - ADMIN/HR/MANAGER required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const roleId = searchParams.get('roleId');
    const assignmentId = searchParams.get('id');

    if (assignmentId) {
      await db.execute(sql`DELETE FROM auth_user_role WHERE id = ${assignmentId}`);
      return NextResponse.json({ success: true, message: 'Role assignment removed' });
    }

    if (!userId || !roleId) return NextResponse.json({ error: 'userId and roleId or id required' }, { status: 400 });

    await db.execute(sql`DELETE FROM auth_user_role WHERE user_id = ${userId} AND role_id = ${roleId}`);

    return NextResponse.json({ success: true, message: 'Role removed from user' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  try {
    let query = sql`
      SELECT ur.id, ur.user_id, ur.role_id, ur.company_code_id, ur.plant_id, ur.assigned_at,
             u.email, r.code as role_code, r.name as role_name, cc.code as company_code, p.code as plant_code,
             assigner.email as assigned_by_email
      FROM auth_user_role ur
      JOIN auth_user u ON ur.user_id = u.id
      JOIN auth_role r ON ur.role_id = r.id
      LEFT JOIN org_legal_entity cc ON ur.company_code_id = cc.id
      LEFT JOIN org_facility p ON ur.plant_id = p.id
      LEFT JOIN auth_user assigner ON ur.assigned_by = assigner.id
    `;
    if (userId) {
      query = sql`${query} WHERE ur.user_id = ${userId}`;
    }
    query = sql`${query} ORDER BY ur.assigned_at DESC`;

    const res = await db.execute(query);
    return NextResponse.json({ assignments: res.rows, count: res.rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
