import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { auth } from '@/auth';

/**
 * User Management API - Enterprise Secure
 * GET /api/users - List users with roles
 * POST /api/users - Create new user (ADMIN only)
 * PUT /api/users - Update user role, active status, reset password
 * 
 * Tables: auth_user, auth_user_role, auth_role, hr_employee
 * Access: ADMIN role or ADMIN_ALL permission required for write operations
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let query = sql`
      SELECT 
        u.id, u.email, u.name, u.role as simple_role, u.is_active, u.created_at,
        e.employee_number, e.first_name, e.last_name,
        p.code as position_code, p.name as position_name,
        cc.code as company_code,
        plant.code as plant_code,
        STRING_AGG(DISTINCT r.code, ', ') as roles,
        STRING_AGG(DISTINCT r.name, ', ') as role_names
      FROM auth_user u
      LEFT JOIN hr_employee emp ON emp.user_id = u.id
      LEFT JOIN hr_employee e ON e.user_id = u.id
      LEFT JOIN hr_position p ON e.position_id = p.id
      LEFT JOIN org_legal_entity cc ON e.company_code_id = cc.id
      LEFT JOIN org_facility plant ON e.plant_id = plant.id
      LEFT JOIN auth_user_role ur ON ur.user_id = u.id
      LEFT JOIN auth_role r ON ur.role_id = r.id
      WHERE 1=1
    `;

    if (search) {
      query = sql`${query} AND (u.email ILIKE ${`%${search}%`} OR u.name ILIKE ${`%${search}%`} OR e.employee_number ILIKE ${`%${search}%`})`;
    }

    query = sql`${query} GROUP BY u.id, u.email, u.name, u.role, u.is_active, u.created_at, e.employee_number, e.first_name, e.last_name, p.code, p.name, cc.code, plant.code ORDER BY u.created_at DESC LIMIT ${limit}`;

    const result = await db.execute(query);

    // Also get detailed roles per user
    const usersWithRoles = await Promise.all(result.rows.map(async (user: any) => {
      try {
        const rolesRes = await db.execute(sql`
          SELECT r.id, r.code, r.name, ur.company_code_id, ur.plant_id, cc.code as company_code, pl.code as plant_code
          FROM auth_user_role ur
          JOIN auth_role r ON ur.role_id = r.id
          LEFT JOIN org_legal_entity cc ON ur.company_code_id = cc.id
          LEFT JOIN org_facility pl ON ur.plant_id = pl.id
          WHERE ur.user_id = ${user.id}
        `);
        return { ...user, detailed_roles: rolesRes.rows };
      } catch {
        return { ...user, detailed_roles: [] };
      }
    }));

    return NextResponse.json({
      code: 'SU01',
      functionDescription: 'User Maintenance – SU01',

      users: usersWithRoles,
      count: usersWithRoles.length,
      source: 'db',
      rbac: 'auth_user + auth_user_role + auth_role + hr_employee + hr_position',
      hint: 'Simple role in auth_user.role, granular roles in auth_user_role'
    });
  } catch (e: any) {
    console.error('List users failed:', e);
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
  }
}

function canCreateUsers(role: string, detailedRoles: string[] = []): boolean {
  const allowed = ['ADMIN', 'OWNER', 'HR', 'HR_MANAGER', 'MANAGER', 'HUMAN_RESOURCES', 'PERSONNEL_ADMIN'];
  if (allowed.includes(role)) return true;
  return detailedRoles.some(r => allowed.includes(r));
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  // ADMIN, OWNER, HR, MANAGER can create users
  const session = await auth();
  const currentUserRole = (session?.user as any)?.role || 'USER';
  const currentUserId = (session?.user as any)?.id;

  let detailedRoles: string[] = [];
  try {
    if (currentUserId) {
      const roleRes = await db.execute(sql`
        SELECT r.code FROM auth_user_role ur JOIN auth_role r ON ur.role_id = r.id WHERE ur.user_id = ${currentUserId}
      `);
      detailedRoles = roleRes.rows.map((r: any) => r.code);
    }
  } catch {}

  if (!canCreateUsers(currentUserRole, detailedRoles)) {
    return NextResponse.json({ error: 'Forbidden - ADMIN, OWNER, HR, MANAGER required to create users', code: 'FORBIDDEN', whereStored: 'auth_user_role + auth_role', allowedRoles: ['ADMIN','OWNER','HR','HR_MANAGER','MANAGER'] }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, name, password, role, isActive, employeeId, companyCodeId, plantId, roleIds } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 });
    }

    // Check if user exists
    const existing = await db.execute(sql`SELECT id FROM auth_user WHERE email = ${email} LIMIT 1`);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userRes = await db.execute(sql`
      INSERT INTO auth_user (email, name, password_hash, role, is_active)
      VALUES (${email}, ${name || null}, ${passwordHash}, ${role || 'USER'}, ${isActive !== false})
      RETURNING id, email, name, role, is_active, created_at
    `);

    const userId = (userRes.rows[0] as any).id;

    // Link to employee if provided
    if (employeeId) {
      try {
        await db.execute(sql`UPDATE hr_employee SET user_id = ${userId} WHERE id = ${employeeId}`);
      } catch (e: any) { console.warn('Link employee failed', e); }
    }

    // Assign roles if provided
    if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
      for (const roleId of roleIds) {
        try {
          await db.execute(sql`
            INSERT INTO auth_user_role (user_id, role_id, company_code_id, plant_id, assigned_by)
            VALUES (${userId}, ${roleId}, ${companyCodeId || null}, ${plantId || null}, ${(session?.user as any)?.id || null})
          `);
        } catch (e: any) { console.warn('Assign role failed', e); }
      }
    } else if (role) {
      // Auto-assign role by code
      try {
        const roleRes = await db.execute(sql`SELECT id FROM auth_role WHERE code = ${role} LIMIT 1`);
        if (roleRes.rows.length > 0) {
          const roleId = (roleRes.rows[0] as any).id;
          await db.execute(sql`
            INSERT INTO auth_user_role (user_id, role_id, company_code_id, plant_id, assigned_by)
            VALUES (${userId}, ${roleId}, ${companyCodeId || null}, ${plantId || null}, ${(session?.user as any)?.id || null})
          `);
        }
      } catch (e: any) { console.warn('Auto assign role failed', e); }
    }

    // Audit log
    try {
      await db.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description)
        VALUES ('auth_user', ${userId}, ${email}, 'INSERT', ${JSON.stringify({ email, name, role })}::jsonb, ${`USER CREATE: ${email} role ${role} by ${(session?.user as any)?.email}`})
      `);
    } catch {}

    return NextResponse.json({
      success: true,
      user: userRes.rows[0],
      message: `User ${email} created with role ${role}`,
    });
  } catch (e: any) {
    console.error('Create user failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const session = await auth();
  const currentUserRole = (session?.user as any)?.role || 'USER';
  const currentUserId = (session?.user as any)?.id;

  let detailedRoles: string[] = [];
  try {
    if (currentUserId) {
      const roleRes = await db.execute(sql`SELECT r.code FROM auth_user_role ur JOIN auth_role r ON ur.role_id = r.id WHERE ur.user_id = ${currentUserId}`);
      detailedRoles = roleRes.rows.map((r: any) => r.code);
    }
  } catch {}

  const isPrivileged = canCreateUsers(currentUserRole, detailedRoles);

  try {
    const body = await req.json();
    const { id, name, role, isActive, password, action } = body;

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    // Get existing user
    const existingRes = await db.execute(sql`SELECT * FROM auth_user WHERE id = ${id} LIMIT 1`);
    if (existingRes.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const existing = existingRes.rows[0] as any;

    // Action: RESET_PASSWORD, TOGGLE_ACTIVE, UPDATE_ROLE, UPDATE_PROFILE
    if (action === 'RESET_PASSWORD') {
      // Only privileged can reset others, user can reset own
      const isOwn = (session?.user as any)?.id === id;
      if (!isOwn && !isPrivileged) {
        return NextResponse.json({ error: 'Forbidden - ADMIN/HR/MANAGER required to reset others password' }, { status: 403 });
      }
      if (!password) return NextResponse.json({ error: 'password required for reset' }, { status: 400 });
      const hash = await bcrypt.hash(password, 10);
      await db.execute(sql`UPDATE auth_user SET password_hash = ${hash} WHERE id = ${id}`);
      return NextResponse.json({ success: true, message: `Password reset for ${existing.email}` });
    }

    if (action === 'TOGGLE_ACTIVE') {
      if (!isPrivileged) {
        return NextResponse.json({ error: 'Forbidden - ADMIN/HR/MANAGER required' }, { status: 403 });
      }
      await db.execute(sql`UPDATE auth_user SET is_active = ${!existing.is_active} WHERE id = ${id}`);
      return NextResponse.json({ success: true, message: `User ${existing.email} ${!existing.is_active ? 'activated' : 'deactivated'}` });
    }

    // Update profile
    let updates: string[] = [];

    if (name !== undefined) {
      await db.execute(sql`UPDATE auth_user SET name = ${name} WHERE id = ${id}`);
      updates.push('name');
    }
    if (role !== undefined) {
      if (!isPrivileged) {
        return NextResponse.json({ error: 'Forbidden - ADMIN/HR/MANAGER required to change role' }, { status: 403 });
      }
      await db.execute(sql`UPDATE auth_user SET role = ${role} WHERE id = ${id}`);
      updates.push('role');
    }
    if (isActive !== undefined) {
      if (!isPrivileged) {
        return NextResponse.json({ error: 'Forbidden - ADMIN/HR/MANAGER required' }, { status: 403 });
      }
      await db.execute(sql`UPDATE auth_user SET is_active = ${isActive} WHERE id = ${id}`);
      updates.push('is_active');
    }

    // Audit log
    try {
      await db.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, old_values, new_values, description)
        VALUES ('auth_user', ${id}, ${existing.email}, 'UPDATE', ${JSON.stringify(existing)}::jsonb, ${JSON.stringify(body)}::jsonb, ${`USER UPDATE: ${existing.email} ${updates.join(',')} by ${(session?.user as any)?.email}`})
      `);
    } catch {}

    return NextResponse.json({ success: true, message: `User ${existing.email} updated: ${updates.join(', ')}` });
  } catch (e: any) {
    console.error('Update user failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
