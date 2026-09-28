"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

const TOOLTIP = `SU01 User Management • Create users, assign roles, grant direct T-code permissions
Who can create: ADMIN, OWNER, HR, MANAGER (HR manager can create users)
Storage: auth_user + ent_user_role + ent_role + ent_user_permission (direct)
Special permission: Grant PO_CREATE to allow ME21N Create PO, GR_POST for MIGO GR`;

interface User {
  id: string;
  email: string;
  name: string;
  simple_role: string;
  is_active: boolean;
  created_at: string;
  employee_number: string;
  roles: string;
  role_names: string;
  detailed_roles: any[];
}

interface Role {
  id: string;
  code: string;
  name: string;
}

export default function UsersPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const { data: session } = useSession();
  const currentUserRole = (session?.user as any)?.role || 'USER';
  const allowedCreatorRoles = ['ADMIN', 'OWNER', 'HR', 'HR_MANAGER', 'MANAGER', 'HUMAN_RESOURCES'];
  const isPrivilegedBasic = allowedCreatorRoles.includes(currentUserRole);
  const [detailedCurrentRoles, setDetailedCurrentRoles] = useState<string[]>([]);
  const isPrivileged = isPrivilegedBasic || detailedCurrentRoles.some(r => allowedCreatorRoles.includes(r));

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '', roleCode: 'USER', isActive: true });

  const [assignUserId, setAssignUserId] = useState('');
  const [assignRoleCode, setAssignRoleCode] = useState('PURCHASER');

  const [resetUserId, setResetUserId] = useState('');
  const [resetPassword, setResetPassword] = useState('');

  const [directPerms, setDirectPerms] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantPermCode, setGrantPermCode] = useState('PO_CREATE');
  const [grantReason, setGrantReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, permsRes, directRes] = await Promise.all([
        fetch(`/api/users?search=${encodeURIComponent(search)}&limit=100`).then(r => r.json()),
        fetch('/api/roles?include=false').then(r => r.json()),
        fetch('/api/permissions').then(r => r.json()),
        fetch('/api/user-permissions').then(r => r.json()).catch(() => ({ directPermissions: [] })),
      ]);
      if (usersRes.users) setUsers(usersRes.users);
      if (rolesRes.roles) setRoles(rolesRes.roles);
      if (permsRes.permissions) setAllPermissions(permsRes.permissions);
      if (directRes.directPermissions) setDirectPerms(directRes.directPermissions);

      try {
        const curUserId = (session?.user as any)?.id;
        if (curUserId) {
          const urRes = await fetch(`/api/user-roles?userId=${curUserId}`).then(r => r.json());
          if (urRes.assignments) setDetailedCurrentRoles(urRes.assignments.map((a: any) => a.role_code));
        }
      } catch {}
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(load, 500); return () => clearTimeout(t); }, [search]);

  const createUser = async () => {
    if (!form.email || !form.password) {
      setMessage({ type: 'error', text: 'Email and password required' });
      return;
    }
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, name: form.name, password: form.password, role: form.roleCode, isActive: form.isActive }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setShowCreate(false);
        setForm({ email: '', name: '', password: '', roleCode: 'USER', isActive: true });
        load();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  const toggleActive = async (user: User) => {
    if (!isPrivileged) { setMessage({ type: 'error', text: 'ADMIN/HR/MANAGER required' }); return; }
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, action: 'TOGGLE_ACTIVE' }),
      });
      const data = await res.json();
      setMessage({ type: res.ok ? 'success' : 'error', text: data.message || data.error });
      if (res.ok) load();
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
  };

  const updateRole = async (userId: string, newRole: string) => {
    if (!isPrivileged) { setMessage({ type: 'error', text: 'ADMIN/HR/MANAGER required' }); return; }
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: newRole }),
      });
      const data = await res.json();
      setMessage({ type: res.ok ? 'success' : 'error', text: data.message || data.error });
      if (res.ok) load();
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
  };

  const assignRole = async () => {
    if (!assignUserId || !assignRoleCode) { setMessage({ type: 'error', text: 'User and role required' }); return; }
    try {
      const res = await fetch('/api/user-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: assignUserId, roleCode: assignRoleCode }),
      });
      const data = await res.json();
      setMessage({ type: res.ok ? 'success' : 'error', text: data.message || data.error });
      if (res.ok) load();
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
  };

  const resetPass = async () => {
    if (!resetUserId || !resetPassword) { setMessage({ type: 'error', text: 'User and new password required' }); return; }
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetUserId, newPassword: resetPassword }),
      });
      const data = await res.json();
      setMessage({ type: res.ok ? 'success' : 'error', text: data.message || data.error });
      if (res.ok) { setResetUserId(''); setResetPassword(''); }
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
  };

  const grantDirectPermission = async () => {
    if (!grantUserId || !grantPermCode) { setMessage({ type: 'error', text: 'User and permission required' }); return; }
    try {
      const res = await fetch('/api/user-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: grantUserId, permissionCode: grantPermCode, reason: grantReason || `Granted ${grantPermCode} to allow special T-code` }),
      });
      const data = await res.json();
      setMessage({ type: res.ok ? 'success' : 'error', text: data.message || data.error });
      if (res.ok) { setGrantReason(''); load(); }
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
  };

  const revokeDirectPermission = async (id: string) => {
    if (!confirm('Revoke this direct permission?')) return;
    try {
      const res = await fetch(`/api/user-permissions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      setMessage({ type: res.ok ? 'success' : 'error', text: data.message || data.error });
      if (res.ok) load();
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
  };

  const removeRoleAssignment = async (assignmentId: string) => {
    if (!isPrivileged) return;
    if (!confirm('Remove this role assignment?')) return;
    try {
      const res = await fetch(`/api/user-roles?id=${assignmentId}`, { method: 'DELETE' });
      const data = await res.json();
      setMessage({ type: res.ok ? 'success' : 'error', text: data.message || data.error });
      if (res.ok) load();
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
  };

  return (
    <ModernModuleShell
      title="User Management"
      subtitle={`${users.length} users • ${companyCode} • HR/Admin can create • SU01`}
      code="SU01"
      module="FOUNDATION"
      tooltip={TOOLTIP}
    >
      <div className="max-w-[1400px] mx-auto p-6 space-y-4">
        {!isPrivileged && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            ⚠️ You are {currentUserRole} {detailedCurrentRoles.length ? `(${detailedCurrentRoles.join(',')})` : ''}. Only ADMIN, OWNER, HR, MANAGER can create users and grant permissions. View only.
          </div>
        )}
        {isPrivileged && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
            ✅ You have user management rights as {currentUserRole} {detailedCurrentRoles.join(', ')} – you can create users, assign roles, grant special permissions like PO_CREATE (ME21N) or GR_POST (MIGO).
          </div>
        )}

        {message && (
          <div className={`p-3 rounded-xl border text-sm ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-center">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email, name..." className="border rounded-full px-4 py-2 text-sm w-64" />
          <button onClick={load} className="border rounded-full px-4 py-2 text-sm hover:bg-zinc-50">Refresh</button>
          {isPrivileged && <button onClick={() => setShowCreate(!showCreate)} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-sm">+ Create User</button>}
          <a href={`/${companyCode}/foundation/roles`} className="border rounded-full px-4 py-2 text-sm hover:bg-zinc-50">Roles (PFCG)</a>
          <a href={`/${companyCode}/foundation/user-profile`} className="border rounded-full px-4 py-2 text-sm hover:bg-zinc-50">My Profile</a>
        </div>

        {showCreate && isPrivileged && (
          <div className="bg-white border rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold">Create New User – Who: ADMIN, OWNER, HR, HR_MANAGER, MANAGER – Where: /foundation/users</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-zinc-500">Email *</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="user@company.com" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Password *</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="min 6 chars" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Role</label>
                <select value={form.roleCode} onChange={e => setForm({ ...form, roleCode: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm mt-1">
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OWNER">OWNER</option>
                  <option value="HR">HR</option>
                  <option value="HR_MANAGER">HR_MANAGER</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="PURCHASER">PURCHASER</option>
                  <option value="WAREHOUSE">WAREHOUSE</option>
                  <option value="ACCOUNTANT">ACCOUNTANT</option>
                  <option value="SALES">SALES</option>
                  <option value="PRODUCTION">PRODUCTION</option>
                  <option value="AUDITOR">AUDITOR</option>
                </select>
              </div>
            </div>
            <div className="text-xs text-zinc-500">Storage: auth_user table + ent_user_role. HR manager allowed. API: POST /api/users</div>
            <button onClick={createUser} className="bg-zinc-900 text-white rounded-full px-5 py-2 text-sm">Create User</button>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border rounded-2xl p-4">
            <h4 className="font-medium text-sm mb-2">🎫 Give Role for T-code Access (Role-based)</h4>
            <div className="text-xs text-zinc-500 mb-3">Example: ME21N Create PO needs PO_CREATE → Assign PURCHASER role which has PO_CREATE.</div>
            <div className="space-y-2">
              <select value={assignUserId} onChange={e => setAssignUserId(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm">
                <option value="">Select User</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.email} ({u.simple_role})</option>)}
              </select>
              <div className="flex gap-2">
                <select value={assignRoleCode} onChange={e => setAssignRoleCode(e.target.value)} className="border rounded-xl px-3 py-2 text-sm flex-1">
                  {roles.map(r => <option key={r.id} value={r.code}>{r.code} - {r.name}</option>)}
                </select>
                <button onClick={assignRole} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs">Assign Role</button>
              </div>
            </div>
            <div className="text-[11px] text-zinc-500 mt-2">Stored in ent_user_role. API: POST /api/user-roles</div>
          </div>

          <div className="bg-white border rounded-2xl p-4">
            <h4 className="font-medium text-sm mb-2">⭐ Give Special Permission (Direct)</h4>
            <div className="text-xs text-zinc-500 mb-3">Allow user to create PO or GR directly without role. Grants ent_user_permission.</div>
            <div className="space-y-2">
              <select value={grantUserId} onChange={e => setGrantUserId(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm">
                <option value="">Select User</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
              </select>
              <div className="flex gap-2">
                <select value={grantPermCode} onChange={e => setGrantPermCode(e.target.value)} className="border rounded-xl px-3 py-2 text-sm flex-1">
                  <option value="PO_CREATE">PO_CREATE – Create PO (ME21N)</option>
                  <option value="PO_APPROVE">PO_APPROVE – Approve PO (ME28)</option>
                  <option value="GR_POST">GR_POST – Goods Receipt (MIGO 101)</option>
                  <option value="IV_POST">IV_POST – Invoice (MIRO)</option>
                  <option value="PR_CREATE">PR_CREATE – Create PR (ME51N)</option>
                  <option value="PR_APPROVE">PR_APPROVE – Approve PR (ME54N)</option>
                  <option value="SALES_CREATE">SALES_CREATE – Sales (VA01)</option>
                  <option value="DELIVERY_CREATE">DELIVERY_CREATE – Delivery (VL01N)</option>
                  <option value="BILLING_CREATE">BILLING_CREATE – Billing (VF01)</option>
                  <option value="MATERIAL_CREATE">MATERIAL_CREATE – Material (MM01)</option>
                  <option value="PAYROLL_RUN">PAYROLL_RUN – Payroll</option>
                  <option value="GL_POST">GL_POST – G/L Post</option>
                  {allPermissions.map(p => <option key={p.id} value={p.code}>{p.code} – {p.name}</option>)}
                </select>
              </div>
              <input value={grantReason} onChange={e => setGrantReason(e.target.value)} placeholder="Reason (optional)" className="w-full border rounded-xl px-3 py-2 text-sm" />
              <button onClick={grantDirectPermission} className="w-full bg-zinc-900 text-white rounded-full px-4 py-2 text-xs">Grant Direct Permission</button>
            </div>
            <div className="text-[11px] text-zinc-500 mt-2">Stored in ent_user_permission. API: POST /api/user-permissions</div>
          </div>

          <div className="bg-white border rounded-2xl p-4">
            <h4 className="font-medium text-sm mb-2">🔑 Reset Password</h4>
            <div className="space-y-2">
              <select value={resetUserId} onChange={e => setResetUserId(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm">
                <option value="">Select User</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="New password" className="border rounded-xl px-3 py-2 text-sm flex-1" />
                <button onClick={resetPass} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs">Reset</button>
              </div>
            </div>
            <div className="text-[11px] text-zinc-500 mt-2">ADMIN/HR/MANAGER can reset others. API: POST /api/auth/change-password</div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl overflow-hidden">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-medium text-sm">Users ({users.length}) + Direct Permissions ({directPerms.length})</h3>
            <div className="text-xs text-zinc-500">HR manager can create users • Direct perms for special T-codes</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b text-xs text-zinc-500">
                <tr>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Simple Role</th>
                  <th className="text-left p-3">Roles (ent_user_role)</th>
                  <th className="text-left p-3">Direct Permissions (ent_user_permission)</th>
                  <th className="text-left p-3">Active</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-6 text-center text-zinc-500">Loading...</td></tr>
                ) : users.map(user => {
                  const userDirectPerms = directPerms.filter((dp: any) => dp.user_id === user.id);
                  return (
                    <tr key={user.id} className="border-b hover:bg-zinc-50">
                      <td className="p-3">
                        <div className="font-medium">{user.email}</div>
                        <div className="text-xs text-zinc-500">{user.name || '-'} • {new Date(user.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="p-3">
                        {isPrivileged ? (
                          <select value={user.simple_role} onChange={e => updateRole(user.id, e.target.value)} className="border rounded-full px-2 py-1 text-xs">
                            <option>USER</option><option>ADMIN</option><option>OWNER</option><option>HR</option><option>HR_MANAGER</option><option>MANAGER</option><option>PURCHASER</option><option>WAREHOUSE</option><option>ACCOUNTANT</option><option>SALES</option><option>PRODUCTION</option>
                          </select>
                        ) : (
                          <span className="bg-zinc-100 rounded-full px-2 py-0.5 text-xs">{user.simple_role}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="text-xs">{user.roles || '-'}</div>
                          {user.detailed_roles?.map((dr: any) => (
                            <div key={dr.id || dr.code} className="flex items-center gap-1 text-[11px] bg-zinc-50 rounded-full px-2 py-0.5 w-fit">
                              <span>{dr.code || dr.role_code}</span>
                              {isPrivileged && <button onClick={() => removeRoleAssignment(dr.id)} className="text-red-500 ml-1">×</button>}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {userDirectPerms.length === 0 ? <span className="text-xs text-zinc-400">No direct perms</span> : userDirectPerms.map((dp: any) => (
                            <div key={dp.id} className="flex items-center gap-1 text-[11px] bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 w-fit">
                              <span className="font-medium">{dp.permission_code}</span>
                              <span className="text-[10px] text-zinc-500">{dp.module}</span>
                              {isPrivileged && <button onClick={() => revokeDirectPermission(dp.id)} className="text-red-500 ml-1">×</button>}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="p-3">
                        {isPrivileged && <button onClick={() => toggleActive(user)} className="border rounded-full px-2 py-1 text-[11px] hover:bg-zinc-50">{user.is_active ? 'Deactivate' : 'Activate'}</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4">
          <h3 className="font-semibold mb-3">❓ How to give special permission like PO or GR?</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="border rounded-xl p-3">
              <div className="font-medium mb-2">Method 1: Role-based (recommended for groups)</div>
              <div className="text-xs text-zinc-600 space-y-1">
                <div>1. Go to Roles (PFCG) → Select PURCHASER role → Ensure PO_CREATE permission checked → Save</div>
                <div>2. In Users page → Assign Role → Select user + PURCHASER → Assign</div>
                <div>3. User now can ME21N Create PO via role PURCHASER → PO_CREATE</div>
                <div>4. Similarly WAREHOUSE role has GR_POST for MIGO GR</div>
              </div>
            </div>
            <div className="border rounded-xl p-3">
              <div className="font-medium mb-2">Method 2: Direct permission (special case for one user)</div>
              <div className="text-xs text-zinc-600 space-y-1">
                <div>1. In Users page → Grant Direct Permission section</div>
                <div>2. Select user + PO_CREATE (for PO) or GR_POST (for GR)</div>
                <div>3. Click Grant Direct Permission</div>
                <div>4. Stored in ent_user_permission table, bypasses role</div>
                <div>5. Example: Allow intern to create PO but not approve: grant PO_CREATE only, not PO_APPROVE</div>
                <div>6. Revoke via × button in Direct Permissions column</div>
              </div>
            </div>
            <div className="border rounded-xl p-3 md:col-span-2">
              <div className="font-medium mb-2">👥 Who can create users? HR Manager included</div>
              <div className="text-xs text-zinc-600 space-y-1">
                <div>• Allowed roles: ADMIN, OWNER, HR, HR_MANAGER, MANAGER, HUMAN_RESOURCES, PERSONNEL_ADMIN</div>
                <div>• Checked via auth_user.role OR ent_user_role JOIN ent_role</div>
                <div>• HR manager can: create users, assign roles, grant direct permissions, reset passwords, activate/deactivate</div>
                <div>• Only ADMIN/OWNER can create roles and manage role→permission mapping (PFCG)</div>
                <div>• Storage: auth_user (simple), ent_user_role (role assignment), ent_user_permission (direct special), ent_role, ent_permission, ent_role_permission</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModernModuleShell>
  );
}
