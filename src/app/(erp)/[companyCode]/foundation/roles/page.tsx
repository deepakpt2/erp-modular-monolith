"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

const TOOLTIP = `PFCG Role Maintenance • Roles, Permissions, T-code Access
Storage: ent_role (role definitions), ent_permission (PR_CREATE etc + Function mapping), ent_role_permission (role->permission), ent_user_role (user->role)
Who can set: ADMIN/OWNER only
How to give T-code: Assign role that has permission for that T-code via ent_role_permission. Example ME51N needs PR_CREATE.`;

interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  is_system: boolean;
  permissions: any[];
  permission_count: number;
  user_count: number;
}

interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string;
}

export default function RolesPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const { data: session } = useSession();
  const currentRole = (session?.user as any)?.role;
  const isAdmin = currentRole === 'ADMIN' || currentRole === 'OWNER';

  const [roles, setRoles] = useState<Role[]>([]);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [groupedPerms, setGroupedPerms] = useState<Record<string, Permission[]>>({});
  const [functionMap, setCodeMap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);

  const [newRole, setNewRole] = useState({ code: '', name: '', description: '' });
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/roles?include=true').then(r => r.json()),
        fetch('/api/permissions').then(r => r.json()),
      ]);
      if (rolesRes.roles) setRoles(rolesRes.roles);
      if (rolesRes.allPermissions) setAllPerms(rolesRes.allPermissions);
      if (permsRes.permissions) {
        setAllPerms(permsRes.permissions);
        setGroupedPerms(permsRes.grouped || {});
        setCodeMap(permsRes.functionMapping || []);
      } else if (rolesRes.allPermissions) {
        // fallback grouping
        const grouped: Record<string, any[]> = {};
        rolesRes.allPermissions.forEach((p: any) => {
          if (!grouped[p.module]) grouped[p.module] = [];
          grouped[p.module].push(p);
        });
        setGroupedPerms(grouped);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const selectRole = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermIds(role.permissions?.map((p: any) => p.id) || []);
  };

  const togglePerm = (permId: string) => {
    setSelectedPermIds(prev => prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]);
  };

  const savePermissions = async () => {
    if (!selectedRole || !isAdmin) return;
    try {
      const res = await fetch('/api/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedRole.id, action: 'SET_PERMISSIONS', permissionIds: selectedPermIds }),
      });
      const data = await res.json();
      setMessage({ type: res.ok ? 'success' : 'error', text: data.message || data.error });
      if (res.ok) load();
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
  };

  const createRole = async () => {
    if (!newRole.code || !newRole.name) { setMessage({ type: 'error', text: 'Code and name required' }); return; }
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newRole.code, name: newRole.name, description: newRole.description }),
      });
      const data = await res.json();
      setMessage({ type: res.ok ? 'success' : 'error', text: data.message || data.error });
      if (res.ok) { setShowCreate(false); setNewRole({ code: '', name: '', description: '' }); load(); }
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
  };

  return (
    <ModernModuleShell
      title="Roles & Permissions"
      subtitle={`${roles.length} roles • ${allPerms.length} permissions • ${companyCode} • PFCG`}
      code="PFCG"
      module="FOUNDATION"
      tooltip={TOOLTIP}
    >
      <div className="max-w-[1400px] mx-auto p-6 space-y-4">
        {!isAdmin && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            ⚠️ You are {currentRole}. Only ADMIN/OWNER can create roles and assign permissions. View only.
          </div>
        )}

        {message && (
          <div className={`p-3 rounded-xl border text-sm ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button onClick={load} className="border rounded-full px-4 py-2 text-sm hover:bg-zinc-50">Refresh</button>
          {isAdmin && <button onClick={() => setShowCreate(!showCreate)} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-sm">+ Create Role</button>}
          <a href={`/${companyCode}/foundation/users`} className="border rounded-full px-4 py-2 text-sm hover:bg-zinc-50">User Management (SU01)</a>
          <a href={`/${companyCode}/foundation/user-profile`} className="border rounded-full px-4 py-2 text-sm hover:bg-zinc-50">My Profile</a>
        </div>

        {showCreate && (
          <div className="bg-white border rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-sm">Create New Role (PFCG) - ADMIN only - Stored in ent_role table</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <div><label className="text-xs text-zinc-500">Code (e.g., PURCHASER, CUSTOM_ROLE)</label><input value={newRole.code} onChange={e => setNewRole({ ...newRole, code: e.target.value.toUpperCase() })} placeholder="CODE" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-zinc-500">Name</label><input value={newRole.name} onChange={e => setNewRole({ ...newRole, name: e.target.value })} placeholder="Role Name" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-zinc-500">Description</label><input value={newRole.description} onChange={e => setNewRole({ ...newRole, description: e.target.value })} placeholder="Description" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
            </div>
            <button onClick={createRole} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-sm">Create Role</button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Roles List */}
          <div className="bg-white border rounded-2xl p-4">
            <h3 className="font-semibold mb-3">Roles (ent_role) - {roles.length}</h3>
            <div className="space-y-2 max-h-[700px] overflow-auto">
              {loading ? <div className="text-sm text-zinc-500">Loading...</div> : roles.map(role => (
                <div key={role.id} onClick={() => selectRole(role)} className={`border rounded-xl p-3 cursor-pointer hover:bg-zinc-50 ${selectedRole?.id === role.id ? 'border-zinc-900 bg-zinc-50' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{role.code}</div>
                      <div className="text-xs text-zinc-500">{role.name}</div>
                      <div className="text-[11px] text-zinc-400 mt-1">{role.description || 'No description'}</div>
                    </div>
                    <div className="text-[10px] space-y-1 text-right">
                      <div className="bg-zinc-900 text-white rounded-full px-2 py-0.5">{role.permission_count || 0} perms</div>
                      <div className="bg-zinc-100 rounded-full px-2 py-0.5">{role.user_count || 0} users</div>
                      {role.is_system && <div className="bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">SYSTEM</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role Permissions */}
          <div className="bg-white border rounded-2xl p-4 lg:col-span-2">
            {selectedRole ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">{selectedRole.code} - {selectedRole.name} Permissions (ent_role_permission)</h3>
                  {isAdmin && <button onClick={savePermissions} className="bg-zinc-900 text-white rounded-full px-4 py-1.5 text-xs">Save Permissions</button>}
                </div>
                <div className="text-xs text-zinc-500 mb-3">Select permissions for this role. User gets T-codes via these permissions. Stored in ent_role_permission (role_id + permission_id).</div>

                <div className="grid md:grid-cols-2 gap-4 max-h-[600px] overflow-auto">
                  {Object.entries(groupedPerms).map(([module, perms]) => (
                    <div key={module} className="border rounded-xl p-3">
                      <div className="font-medium text-xs mb-2">{module} - {(perms as any[]).length} perms</div>
                      <div className="space-y-1.5">
                        {(perms as any[]).map((perm: any) => (
                          <label key={perm.id} className="flex items-start gap-2 text-xs cursor-pointer hover:bg-zinc-50 p-1 rounded">
                            <input type="checkbox" checked={selectedPermIds.includes(perm.id)} onChange={() => togglePerm(perm.id)} disabled={!isAdmin} className="mt-0.5" />
                            <div>
                              <div className="font-medium">{perm.code}</div>
                              <div className="text-[11px] text-zinc-500">{perm.name}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-zinc-50 rounded-xl text-xs">
                  <div className="font-medium mb-1">How to give permission to a user to a T-code? Example:</div>
                  <div className="text-zinc-600 space-y-1">
                    <div>• T-code ME51N (Create PR) requires permission PR_CREATE (module MM)</div>
                    <div>• To give ME51N to user john@co.com: Ensure role PURCHASER has PR_CREATE via this page (PFCG)</div>
                    <div>• Then assign PURCHASER role to user via /foundation/users → Assign Role or POST /api/user-roles {'{ userId, roleCode: PURCHASER }'}</div>
                    <div>• User now has T-code ME51N access via ent_user_role → ent_role → ent_role_permission → ent_permission PR_CREATE</div>
                    <div>• Similarly: ME21N → PO_CREATE, MIGO → GR_POST, MIRO → IV_POST, VA01 → SALES_CREATE, VF01 → BILLING_CREATE</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-zinc-500 py-20 text-sm">Select a role to view/edit permissions</div>
            )}
          </div>
        </div>

        {/* T-code Mapping */}
        <div className="bg-white border rounded-2xl p-4">
          <h3 className="font-semibold mb-3">🎫 T-code → Permission Mapping (How Function access is controlled)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 border-b">
                <tr><th className="text-left p-2">T-code</th><th className="text-left p-2">Description</th><th className="text-left p-2">Required Permission (ent_permission.code)</th><th className="text-left p-2">Module</th><th className="text-left p-2">Typical Role</th></tr>
              </thead>
              <tbody>
                {functionMap.length > 0 ? functionMap.map((m: any, i: number) => (
                  <tr key={i} className="border-b hover:bg-zinc-50"><td className="p-2 font-mono font-medium">{m.code}</td><td className="p-2">{m.desc}</td><td className="p-2"><span className="bg-zinc-900 text-white rounded-full px-2 py-0.5">{m.perm}</span></td><td className="p-2">{m.module}</td><td className="p-2 text-zinc-500">{m.module === 'MM' ? 'PURCHASER/WAREHOUSE' : m.module === 'SD' ? 'SALES' : m.module === 'FICO' ? 'ACCOUNTANT' : m.module === 'HR' ? 'HR' : 'ADMIN'}</td></tr>
                )) : (
                  <tr><td colSpan={5} className="p-4 text-center text-zinc-500">Loading Function mapping from /api/permissions...</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="text-[11px] text-zinc-500 mt-3">Storage: ent_permission.code defines Function access, ent_role_permission links role to permission, ent_user_role assigns role to user. To grant T-code: 1) Ensure permission exists, 2) Add permission to role via this page, 3) Assign role to user via Users page.</div>
        </div>

        <div className="bg-zinc-900 text-white rounded-2xl p-4 text-xs space-y-2">
          <div className="font-bold">🔐 Access Level Storage Summary</div>
          <div>• <b>ent_role</b>: id, code (ADMIN, OWNER, PURCHASER...), name, description, is_system</div>
          <div>• <b>ent_permission</b>: id, code (PR_CREATE...), module, name - Function mapping via code</div>
          <div>• <b>ent_role_permission</b>: role_id, permission_id - which T-codes a role can access</div>
          <div>• <b>ent_user_role</b>: user_id, role_id, company_code_id, plant_id, assigned_by, assigned_at - which roles user has</div>
          <div>• <b>auth_user.role</b>: simple string USER/ADMIN for quick middleware</div>
          <div className="pt-2 border-t border-zinc-700">Who can set: ADMIN/OWNER only. Where: /{companyCode}/foundation/roles (PFCG) for role→permission, /{companyCode}/foundation/users (SU01) for user→role. APIs: POST /api/roles, PUT /api/roles SET_PERMISSIONS, POST /api/user-roles</div>
        </div>
      </div>
    </ModernModuleShell>
  );
}
