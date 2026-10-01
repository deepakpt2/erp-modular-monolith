import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { auth } from '@/auth';

/**
 * Direct User Permissions API - Special permissions to a user
 * POST /api/user-permissions - Grant direct permission to user (e.g., allow user to create PO, GR)
 * DELETE /api/user-permissions - Revoke direct permission
 * GET /api/user-permissions - List direct permissions
 * 
 * This allows granting special permissions without role, e.g., allow user to create PO (PO_CREATE) or GR (GR_POST)
 * Storage: ent_user_permission table (created if not exists)
 * - id, user_id, permission_id, company_code_id, plant_id, granted_by, granted_at, expires_at, reason
 * 
 * Who can grant: ADMIN, OWNER, HR, MANAGER
 */

async function ensureTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ent_user_permission (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
        permission_id UUID NOT NULL REFERENCES auth_permission(id) ON DELETE CASCADE,
        company_code_id UUID REFERENCES org_legal_entity(id),
        plant_id UUID REFERENCES org_facility(id),
        granted_by UUID REFERENCES auth_user(id),
        granted_at TIMESTAMP DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMP,
        reason TEXT,
        UNIQUE(user_id, permission_id, company_code_id)
      );
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_permission_user ON ent_user_permission(user_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_permission_perm ON ent_user_permission(permission_id);`);
  } catch (e: any) {
    console.warn('ensure ent_user_permission table failed', e);
  }
}

function canManageUsers(currentRole: string, detailedRoles?: string[]): boolean {
  const allowed = ['ADMIN', 'OWNER', 'HR', 'HR_MANAGER', 'MANAGER', 'HUMAN_RESOURCES'];
  if (allowed.includes(currentRole)) return true;
  if (detailedRoles && detailedRoles.some(r => allowed.includes(r))) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTable();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  try {
    let query = sql`
      SELECT up.id, up.user_id, up.permission_id, up.company_code_id, up.plant_id, up.granted_at, up.expires_at, up.reason,
             u.email as user_email, p.code as permission_code, p.name as permission_name, p.module,
             cc.code as company_code, pl.code as plant_code,
             granter.email as granted_by_email
      FROM ent_user_permission up
      JOIN auth_user u ON up.user_id = u.id
      JOIN auth_permission p ON up.permission_id = p.id
      LEFT JOIN org_legal_entity cc ON up.company_code_id = cc.id
      LEFT JOIN org_facility pl ON up.plant_id = pl.id
      LEFT JOIN auth_user granter ON up.granted_by = granter.id
    `;
    if (userId) {
      query = sql`${query} WHERE up.user_id = ${userId}`;
    }
    query = sql`${query} ORDER BY up.granted_at DESC`;

    const res = await db.execute(query);
    return NextResponse.json({
      code: 'PFCG',
      functionDescription: 'Role Permissions – PFCG',

      directPermissions: res.rows,
      count: res.rows.length,
      explanation: 'Direct user permissions allow special access like PO_CREATE, GR_POST without role. Example: Grant PO_CREATE to user to allow PPOC (legacy ME21N) Create PO.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTable();

  const session = await auth();
  const currentUserId = (session?.user as any)?.id;
  const currentRole = (session?.user as any)?.role || 'USER';

  // Check detailed roles
  let detailedRoles: string[] = [];
  try {
    const roleRes = await db.execute(sql`
      SELECT r.code FROM auth_user_role ur JOIN auth_role r ON ur.role_id = r.id WHERE ur.user_id = ${currentUserId}
    `);
    detailedRoles = roleRes.rows.map((r: any) => r.code);
  } catch {}

  if (!canManageUsers(currentRole, detailedRoles)) {
    return NextResponse.json({ error: 'Forbidden - ADMIN, OWNER, HR, MANAGER required to grant permissions', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, permissionId, permissionCode, companyCodeId, plantId, reason, expiresAt } = body;

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    let finalPermId = permissionId;
    if (permissionCode && !permissionId) {
      const permRes = await db.execute(sql`SELECT id FROM auth_permission WHERE code = ${permissionCode} LIMIT 1`);
      if (permRes.rows.length === 0) return NextResponse.json({ error: `Permission ${permissionCode} not found` }, { status: 404 });
      finalPermId = (permRes.rows[0] as any).id;
    }

    if (!finalPermId) return NextResponse.json({ error: 'permissionId or permissionCode required' }, { status: 400 });

    // Check if already exists
    const existing = await db.execute(sql`
      SELECT id FROM ent_user_permission WHERE user_id = ${userId} AND permission_id = ${finalPermId} AND COALESCE(company_code_id::text,'') = COALESCE(${companyCodeId || null}::text,'') LIMIT 1
    `);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Permission already granted to user' }, { status: 400 });
    }

    await db.execute(sql`
      INSERT INTO ent_user_permission (user_id, permission_id, company_code_id, plant_id, granted_by, reason, expires_at)
      VALUES (${userId}, ${finalPermId}, ${companyCodeId || null}, ${plantId || null}, ${currentUserId}, ${reason || null}, ${expiresAt || null})
    `);

    // Get info
    const infoRes = await db.execute(sql`
      SELECT u.email, p.code as perm_code FROM auth_user u, auth_permission p WHERE u.id = ${userId} AND p.id = ${finalPermId}
    `);
    const info = infoRes.rows[0] as any;

    // Audit
    try {
      await db.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, description)
        VALUES ('ent_user_permission', ${userId}, ${info?.email || userId}, 'INSERT', ${`PERMISSION GRANT: ${info?.email} -> ${info?.perm_code} by ${(session?.user as any).email} reason: ${reason || ''}`})
      `);
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Permission ${info?.perm_code} granted to ${info?.email}`,
      example: 'User can now create PO if PO_CREATE granted, or GR if GR_POST granted',
      storage: 'ent_user_permission table',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTable();

  const session = await auth();
  const currentRole = (session?.user as any)?.role || 'USER';
  const currentUserId = (session?.user as any)?.id;

  let detailedRoles: string[] = [];
  try {
    const roleRes = await db.execute(sql`SELECT r.code FROM auth_user_role ur JOIN auth_role r ON ur.role_id = r.id WHERE ur.user_id = ${currentUserId}`);
    detailedRoles = roleRes.rows.map((r: any) => r.code);
  } catch {}

  if (!canManageUsers(currentRole, detailedRoles)) {
    return NextResponse.json({ error: 'Forbidden - ADMIN/HR/MANAGER required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const permissionId = searchParams.get('permissionId');

    if (id) {
      await db.execute(sql`DELETE FROM ent_user_permission WHERE id = ${id}`);
      return NextResponse.json({ success: true, message: 'Direct permission revoked' });
    }

    if (userId && permissionId) {
      await db.execute(sql`DELETE FROM ent_user_permission WHERE user_id = ${userId} AND permission_id = ${permissionId}`);
      return NextResponse.json({ success: true, message: 'Direct permission revoked' });
    }

    return NextResponse.json({ error: 'id or userId+permissionId required' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
