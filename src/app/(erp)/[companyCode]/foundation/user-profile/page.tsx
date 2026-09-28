"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

const TOOLTIP = `SU01 User Master • Own Profile + Password Change
Storage: auth_user table password_hash bcrypt
Who can change own: Any logged user with currentPassword verification
Who can reset others: ADMIN/OWNER role via /foundation/users
Tables: auth_user (id,email,name,role,is_active,password_hash), ent_user_role, ent_role
Audit: audit_log table logs password changes`;

export default function UserProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const companyCode = params.companyCode as string;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);

  useEffect(() => {
    if (session?.user) {
      fetch(`/api/users?search=${encodeURIComponent((session.user as any).email || '')}`)
        .then(r => r.json())
        .then(data => {
          if (data.users && data.users.length > 0) setUserDetails(data.users[0]);
        })
        .catch(() => {});
    }
  }, [session]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setMessage({ type: 'error', text: 'Current and new password required' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password min 6 chars' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModernModuleShell
      title="My Profile & Password"
      subtitle={`${session?.user?.email || 'Loading'} • ${companyCode} • Change own password`}
      code="SU01"
      module="FOUNDATION"
      tooltip={TOOLTIP}
    >
      <div className="max-w-[1000px] mx-auto p-6 space-y-6">
        {message && (
          <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <h2 className="font-semibold mb-4">👤 My Profile (SU01)</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-zinc-500">Email</span>
                <span className="font-medium">{(session?.user as any)?.email || '-'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-zinc-500">Name</span>
                <span className="font-medium">{(session?.user as any)?.name || session?.user?.email || '-'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-zinc-500">Simple Role (auth_user.role)</span>
                <span className="bg-zinc-900 text-white rounded-full px-2 py-0.5 text-xs">{(session?.user as any)?.role || 'USER'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-zinc-500">User ID</span>
                <span className="font-mono text-xs">{(session?.user as any)?.id || '-'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-zinc-500">Company Code</span>
                <span>{companyCode}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-zinc-500">Employee No</span>
                <span>{userDetails?.employee_number || 'Not linked'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-zinc-500">Position</span>
                <span>{userDetails?.position_code || userDetails?.position_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Detailed Roles (ent_user_role)</span>
                <span className="text-xs max-w-[200px] text-right">{userDetails?.roles || (session?.user as any)?.role || 'USER'}</span>
              </div>
            </div>

            <div className="mt-6 p-3 bg-zinc-50 rounded-xl text-xs">
              <div className="font-medium mb-1">Where is access level stored?</div>
              <div className="text-zinc-600 space-y-1">
                <div>• <b>auth_user.role</b>: Simple role USER/ADMIN/OWNER for quick middleware check</div>
                <div>• <b>ent_role</b>: Role definitions ADMIN, PURCHASER, WAREHOUSE, SALES, ACCOUNTANT, MANAGER, HR, AUDITOR</div>
                <div>• <b>ent_permission</b>: Permissions PR_CREATE, PO_APPROVE, GR_POST, etc + Function mapping</div>
                <div>• <b>ent_role_permission</b>: Which permissions a role has</div>
                <div>• <b>ent_user_role</b>: User → Role with company_code_id, plant_id, assigned_by</div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <h2 className="font-semibold mb-4">🔐 Change My Password</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full mt-1 border border-zinc-200 rounded-xl px-3 py-2 text-sm"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">New Password (min 6 chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full mt-1 border border-zinc-200 rounded-xl px-3 py-2 text-sm"
                  placeholder="New password"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full mt-1 border border-zinc-200 rounded-xl px-3 py-2 text-sm"
                  placeholder="Confirm new password"
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full bg-zinc-900 text-white rounded-xl py-2.5 text-sm hover:bg-black disabled:opacity-50"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
              <div className="text-[11px] text-zinc-500">
                API: POST /api/auth/change-password {'{ currentPassword, newPassword }'}<br />
                Storage: auth_user.password_hash bcrypt<br />
                Audit: audit_log table
              </div>
            </div>
          </div>
        </div>

        {/* Who can do what */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">❓ FAQ - User Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="border rounded-xl p-4">
              <div className="font-medium mb-2">🔑 How user changes password?</div>
              <div className="text-zinc-600 text-xs space-y-1">
                <div>1. Go to My Profile / SU01 / User dropdown → My Profile</div>
                <div>2. Enter currentPassword + newPassword</div>
                <div>3. POST /api/auth/change-password verifies bcrypt current hash</div>
                <div>4. Updates auth_user.password_hash with new bcrypt hash</div>
                <div>5. Audit logged in audit_log table</div>
                <div className="mt-2 font-medium">Self-service allowed for own account only</div>
              </div>
            </div>
            <div className="border rounded-xl p-4">
              <div className="font-medium mb-2">👑 Who can set access level?</div>
              <div className="text-zinc-600 text-xs space-y-1">
                <div>• Only <b>ADMIN</b> or <b>OWNER</b> role can set access levels</div>
                <div>• Checked via auth_user.role or ent_role ADMIN/OWNER in ent_user_role</div>
                <div>• Location: <b>/{companyCode}/foundation/users</b> and <b>/roles</b></div>
                <div>• API: POST /api/user-roles {'{ userId, roleCode }'}</div>
                <div>• Also PUT /api/users for simple role change</div>
              </div>
            </div>
            <div className="border rounded-xl p-4">
              <div className="font-medium mb-2">🔐 Where are access levels stored?</div>
              <div className="text-zinc-600 text-xs space-y-1">
                <div>• <b>ent_role</b>: id, code (ADMIN, PURCHASER...), name, is_system</div>
                <div>• <b>ent_permission</b>: id, code (PR_CREATE...), module, name</div>
                <div>• <b>ent_role_permission</b>: role_id, permission_id (role→T-code)</div>
                <div>• <b>ent_user_role</b>: user_id, role_id, company_code_id, plant_id, assigned_by, assigned_at</div>
                <div>• <b>auth_user.role</b>: simple string USER/ADMIN for middleware quick check</div>
              </div>
            </div>
            <div className="border rounded-xl p-4">
              <div className="font-medium mb-2">🎫 How to give permission to T-code?</div>
              <div className="text-zinc-600 text-xs space-y-1">
                <div>• T-code mapped to permission code, e.g., ME51N → PR_CREATE</div>
                <div>• Create role (e.g., PURCHASER) with permissions via /foundation/roles</div>
                <div>• Assign role to user via POST /api/user-roles or Users page</div>
                <div>• User gets T-codes via ent_role_permission → ent_permission</div>
                <div>• Example: Give ME51N: assign PURCHASER role which has PR_CREATE</div>
                <div>• Check mapping at /api/permissions</div>
              </div>
            </div>
            <div className="border rounded-xl p-4 md:col-span-2">
              <div className="font-medium mb-2">👥 Who makes new user and where?</div>
              <div className="text-zinc-600 text-xs space-y-1">
                <div>• Only <b>ADMIN/OWNER</b> can create new users</div>
                <div>• Location: <b>/{companyCode}/foundation/users → Create User</b></div>
                <div>• API: POST /api/users {'{ email, name, password, role, roleIds }'}</div>
                <div>• Creates auth_user with bcrypt password_hash + optional ent_user_role assignments</div>
                <div>• Can link to hr_employee via employeeId, set company_code_id, plant_id</div>
                <div>• Audit logged in audit_log table</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-xs border border-red-200 text-red-600 rounded-full px-4 py-2 hover:bg-red-50">Sign Out</button>
          <a href={`/${companyCode}/foundation/users`} className="text-xs border rounded-full px-4 py-2 hover:bg-zinc-50">Go to User Management (ADMIN)</a>
          <a href={`/${companyCode}/foundation/roles`} className="text-xs border rounded-full px-4 py-2 hover:bg-zinc-50">Go to Roles & Permissions</a>
        </div>
      </div>
    </ModernModuleShell>
  );
}
