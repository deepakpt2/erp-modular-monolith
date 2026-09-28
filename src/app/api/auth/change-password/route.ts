import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { auth } from '@/auth';

/**
 * Change Password API
 * POST /api/auth/change-password
 * Body: { currentPassword, newPassword } for own password
 *       { userId, newPassword } for ADMIN resetting others
 * 
 * Who can change:
 * - User can change own password with currentPassword verification
 * - ADMIN/OWNER can reset any user's password without currentPassword
 */

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized - login required', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { currentPassword, newPassword, userId } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'newPassword required, min 6 chars' }, { status: 400 });
    }

    const currentUserId = (session.user as any).id;
    const currentUserRole = (session.user as any).role;
    const targetUserId = userId || currentUserId;
    const isOwn = targetUserId === currentUserId;

    // Get target user
    const userRes = await db.execute(sql`SELECT id, email, password_hash, role FROM auth_user WHERE id = ${targetUserId} LIMIT 1`);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const targetUser = userRes.rows[0] as any;

    if (isOwn) {
      // Own password change requires currentPassword
      if (!currentPassword) {
        return NextResponse.json({ error: 'currentPassword required for own password change' }, { status: 400 });
      }
      const isValid = await bcrypt.compare(currentPassword, targetUser.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: 'Current password incorrect' }, { status: 400 });
      }
    } else {
      // Resetting others password requires ADMIN/OWNER
      if (currentUserRole !== 'ADMIN' && currentUserRole !== 'OWNER') {
        // Check ent_user_role for ADMIN
        try {
          const adminCheck = await db.execute(sql`
            SELECT r.code FROM ent_user_role ur JOIN ent_role r ON ur.role_id = r.id WHERE ur.user_id = ${currentUserId} AND r.code IN ('ADMIN','OWNER') LIMIT 1
          `);
          if (adminCheck.rows.length === 0) {
            return NextResponse.json({ error: 'Forbidden - ADMIN required to reset others password' }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: 'Forbidden - ADMIN required' }, { status: 403 });
        }
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.execute(sql`UPDATE auth_user SET password_hash = ${newHash} WHERE id = ${targetUserId}`);

    // Audit log
    try {
      await db.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, description)
        VALUES ('auth_user', ${targetUserId}, ${targetUser.email}, 'UPDATE', ${`PASSWORD CHANGE: ${targetUser.email} by ${(session.user as any).email} ${isOwn ? '(own)' : '(admin reset)'}`})
      `);
    } catch {}

    return NextResponse.json({
      success: true,
      message: isOwn ? 'Password changed successfully' : `Password reset for ${targetUser.email}`,
    });
  } catch (e: any) {
    console.error('Change password failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/auth/change-password',
    description: 'Change own password or ADMIN reset others',
    whoCanChangeOwn: 'Any authenticated user with currentPassword',
    whoCanResetOthers: 'ADMIN or OWNER role (auth_user.role or ent_role ADMIN/OWNER)',
    bodyOwn: '{ currentPassword: "old", newPassword: "new123" }',
    bodyAdminReset: '{ userId: "uuid", newPassword: "new123" }',
    storage: 'auth_user.password_hash bcrypt',
    audit: 'Logged in audit_log table WORM-lite',
  });
}
