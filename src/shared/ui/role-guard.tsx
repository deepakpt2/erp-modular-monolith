"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface RoleGuardProps {
  requiredPermission?: string; // e.g., PAYROLL_RUN, EMPLOYEE_VIEW
  requiredRoles?: string[]; // e.g., ['HR', 'ADMIN', 'OWNER']
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ requiredPermission, requiredRoles, children, fallback }: RoleGuardProps) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [me, setMe] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/me');
        const j = await res.json();
        if (!res.ok) {
          setError(j.error || 'Failed to check permissions');
          setLoading(false);
          return;
        }
        setMe(j);

        // Admin always allowed
        if (j.isAdmin) {
          setAllowed(true);
          setLoading(false);
          return;
        }

        // Check required roles
        if (requiredRoles && requiredRoles.length > 0) {
          const hasRole = requiredRoles.some((r: string) => 
            j.roles?.includes(r) || j.simpleRole === r || j.detailedRoles?.some((dr: any) => dr.code === r)
          );
          if (hasRole) {
            setAllowed(true);
            setLoading(false);
            return;
          }
        }

        // Check required permission
        if (requiredPermission) {
          const hasPerm = j.permissions?.includes(requiredPermission) || j.permissions?.includes('ADMIN_ALL');
          // Also check via canAccess flags
          if (requiredPermission === 'PAYROLL_RUN' && j.canAccessPayroll) {
            setAllowed(true);
            setLoading(false);
            return;
          }
          if (requiredPermission === 'EMPLOYEE_VIEW' && (j.canAccessHRMaster || j.canAccessPayroll)) {
            setAllowed(true);
            setLoading(false);
            return;
          }
          if (hasPerm) {
            setAllowed(true);
            setLoading(false);
            return;
          }
          // If no explicit permission but isHR and asking for HR perms, allow
          if ((requiredPermission === 'PAYROLL_RUN' || requiredPermission === 'EMPLOYEE_VIEW') && j.isHR) {
            setAllowed(true);
            setLoading(false);
            return;
          }
        }

        // If no specific requirement, allow
        if (!requiredPermission && (!requiredRoles || requiredRoles.length === 0)) {
          setAllowed(true);
        } else {
          setAllowed(false);
        }
        setLoading(false);
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
      }
    }
    check();
  }, [requiredPermission, requiredRoles]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center">
          <div className="text-sm">Checking permissions...</div>
          <div className="text-[11px] text-zinc-500 mt-1">RBAC FRPC – verifying {requiredPermission || requiredRoles?.join(',')}</div>
        </div>
      </div>
    );
  }

  if (!allowed) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="min-h-screen bg-[#fafaf9] p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 max-w-[500px] w-full">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔒</span>
            <h2 className="text-lg font-bold">Access Denied – FRPC Authorization</h2>
          </div>
          <p className="text-sm text-zinc-600">User <b>{me?.email}</b> role <b>{me?.simpleRole}</b> roles [{me?.roles?.join(', ')}] does not have permission <b>{requiredPermission}</b> {requiredRoles ? `or roles [${requiredRoles.join(', ')}]` : ''}</p>
          <p className="text-xs text-zinc-500 mt-3">Master Data Manager (MATERIAL_CREATE, MATERIAL_VIEW) cannot access HR Payroll – industry standard – payroll requires PAYROLL_RUN permission and HR role – FRPC own IP alias PFCG – authorization objects F_BKPF_BUK company code, etc.</p>
          <div className="mt-4 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px]">
            <div className="font-semibold">Why master data manager cannot access /1000/hr/payroll?</div>
            <div className="mt-1">Payroll contains sensitive salary data – basic_salary, gross/net pay, deductions – only HR, ADMIN, OWNER roles with PAYROLL_RUN permission can access – master data manager role has only FOUNDATION permissions (MATERIAL_CREATE) – not HR – industry standard segregation of duties – SoD – prevents fraud – master data manager should not see payroll.</div>
          </div>
          <div className="mt-4 flex gap-2">
            <Link href="/1000/navigator" className="px-4 py-2 rounded-full bg-black text-white text-xs">🌳 Navigator</Link>
            <Link href="/1000/foundation/materials" className="px-4 py-2 rounded-full border text-xs">📦 Materials – allowed for MDM</Link>
          </div>
          <div className="mt-4 text-[10px] text-zinc-400">
            <div>Current user: {me?.email} – simpleRole {me?.simpleRole} – roles {me?.roles?.join(', ')} – permissions {me?.permissions?.slice(0,5).join(', ')}...</div>
            <div>Required: {requiredPermission} {requiredRoles?.join(', ')}</div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
