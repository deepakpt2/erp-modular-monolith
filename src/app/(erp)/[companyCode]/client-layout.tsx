"use client";

import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { JobIndicator } from '@/shared/ui/job-indicator';
import { getFrontendPermission } from '@/shared/kernel/auth/frontendPermissions';
import { canUserAccessPage } from '@/shared/kernel/auth/pagePermissions';

const SHOW_FUNCTION_CODE = process.env.NEXT_PUBLIC_SHOW_FUNCTION_CODE !== 'false';

function UserMenu({ userEmail, userRole }: { userEmail?: string; userRole?: string }) {
  const [open, setOpen] = useState(false);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const showMenu = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    setOpen(true);
  };

  const hideMenu = () => {
    // Delay hide to allow moving to submenu block
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => {
      setOpen(false);
    }, 300); // 300ms delay per user request
  };

  const cancelHide = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  if (!userEmail) {
    return (
      <a href="/api/auth/signout" className="text-[11px] border rounded-full px-2.5 py-1 hover:bg-black hover:text-white transition-colors">Sign out</a>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={showMenu}
      onMouseLeave={hideMenu}
    >
      <div className="hidden sm:flex items-center gap-2 text-[11px] border rounded-full px-2.5 py-1 bg-zinc-900 text-white cursor-pointer select-none">
        <span className="font-medium truncate max-w-[120px]">{userEmail.split('@')[0]}</span>
        <span className="text-zinc-400">• {userRole || 'USER'}</span>
        <span className="ml-1 text-[10px]">▼</span>
      </div>

      {/* Submenu – stays on hover, hides after delay when move away from menu block */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[220px] bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden z-50"
          onMouseEnter={cancelHide}
          onMouseLeave={hideMenu}
        >
          <div className="p-3 border-b border-zinc-100">
            <div className="text-xs font-semibold truncate">{userEmail}</div>
            <div className="text-[10px] text-zinc-500">{userRole || 'USER'}</div>
          </div>
          <div className="p-1">
            <Link href={`/${containerRef.current?.closest('[data-company-code]')?.getAttribute('data-company-code') || ''}/navigator`} className="block px-3 py-2 text-xs hover:bg-zinc-50 rounded-xl">🌳 Navigator</Link>
            <Link href="/docs" className="block px-3 py-2 text-xs hover:bg-zinc-50 rounded-xl">📚 Documentation</Link>
            <a href="https://github.com/deepakpt2/erp-modular-monolith" target="_blank" className="block px-3 py-2 text-xs hover:bg-zinc-50 rounded-xl">💻 GitHub ↗</a>
          </div>
          <div className="p-1 border-t border-zinc-100">
            <a href="/api/auth/signout" className="block px-3 py-2 text-xs hover:bg-red-50 hover:text-red-600 rounded-xl">🚪 Sign out</a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompanyClientLayout({ children, companyCode, userEmail, userRole }: { children: React.ReactNode; companyCode: string; userEmail?: string; userRole?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [uiMode, setUiMode] = useState<'modern'|'classic'>(()=>{
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('erp-ui-mode') as any) || 'modern';
    }
    return 'modern';
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [me, setMe] = useState<any>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [rbacDenied, setRbacDenied] = useState<{ denied: boolean; reason?: string; requiredPermission?: string; requiredRoles?: string[]; code?: string } | null>(null);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const j = await res.json();
          setMe(j);
        }
      } catch {}
      setMeLoading(false);
    }
    fetchMe();
  }, []);

  useEffect(() => {
    if (meLoading || !me) return;
    if (!pathname) return;
    // Skip navigator and enterprise-structure – allow all, but navigator will filter children
    if (pathname.includes('/navigator') || pathname.includes('/enterprise-structure')) {
      setRbacDenied({ denied: false });
      return;
    }
    const fp = getFrontendPermission(pathname);
    if (!fp) {
      setRbacDenied({ denied: false });
      return;
    }
    // If roles contains *, allow all
    if (fp.roles.includes('*')) {
      setRbacDenied({ denied: false });
      return;
    }
    const isAdmin = me?.isAdmin || me?.roles?.includes('ADMIN') || me?.roles?.includes('OWNER') || me?.simpleRole === 'ADMIN' || me?.simpleRole === 'OWNER';
    if (isAdmin) {
      setRbacDenied({ denied: false });
      return;
    }
    // Check via canUserAccessPage if code exists, else check roles
    let allowed = false;
    // First check code-based permission if available
    if (fp.code) {
      const access = canUserAccessPage(me, fp.code);
      allowed = access.allowed;
      if (!allowed) {
        setRbacDenied({ denied: true, reason: access.reason, requiredPermission: access.requiredPermission, requiredRoles: access.requiredRoles, code: fp.code });
        return;
      }
    }
    // Also check roles
    const userRoles = me?.roles || [];
    const simpleRole = me?.simpleRole || '';
    const hasRole = fp.roles.some((r: string) => userRoles.includes(r) || simpleRole === r);
    const hasPerm = me?.permissions?.includes(fp.permission) || me?.permissions?.includes('ADMIN_ALL');
    if (hasRole || hasPerm) {
      allowed = true;
    }
    if (!allowed) {
      setRbacDenied({
        denied: true,
        reason: `Forbidden – requires permission ${fp.permission} – roles [${fp.roles.join(',')}] – current role ${simpleRole} roles [${userRoles.join(',')}] – ${fp.description} – SoD`,
        requiredPermission: fp.permission,
        requiredRoles: fp.roles,
        code: fp.code,
      });
    } else {
      setRbacDenied({ denied: false });
    }
  }, [pathname, me, meLoading]);

  useEffect(()=>{
    try {
      const saved = localStorage.getItem('erp-ui-mode');
      if (saved) setUiMode(saved as any);
    } catch {}
  }, []);

  useEffect(()=>{
    // Track last page for redirect after background job popup close – as per user request, closing redirects to last page as usual
    try {
      if (pathname && !pathname.includes('/system/jobs') && !pathname.includes('/system/locks')) {
        const last = localStorage.getItem('current_page');
        if (last && last !== pathname) localStorage.setItem('last_page', last);
        localStorage.setItem('current_page', pathname);
      }
    } catch {}
  }, [pathname]);

  const toggleMode = (m: 'modern'|'classic') => {
    setUiMode(m);
    try { localStorage.setItem('erp-ui-mode', m); } catch {}
    // dispatch event for pages listening
    try { window.dispatchEvent(new CustomEvent('erp-ui-mode-change', { detail: m })); } catch {}
  };

  useEffect(()=>{
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(o=>!o);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return ()=>window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col">
      {/* Top Bar – replaces sidebar – Tree Navigator + Search + Mode Toggle */}
      <header className="h-[56px] bg-white border-b border-zinc-200 flex items-center px-4 gap-3 sticky top-0 z-40">
        <Link href={`/${companyCode}/navigator`} className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-black">E</div>
          <div className="hidden sm:block">
            <div className="font-semibold text-sm leading-none">{companyCode} • ERP</div>
            <div className="text-[10px] text-zinc-500">Tree Navigator • Function is destination</div>
          </div>
        </Link>

        <div className="flex items-center gap-2 ml-2">
          <Link href={`/${companyCode}/navigator`} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${pathname.includes('/navigator') ? 'bg-black text-white border-black' : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200'}`}>
            🌳 Navigator
          </Link>
          <Link href="/" className="px-3 py-1.5 rounded-full text-xs border bg-white hover:bg-zinc-50">
            🏠 Dashboard
          </Link>
        </div>

        <div className="flex-1 flex justify-center px-4">
          <button onClick={()=>setSearchOpen(true)} className="w-full max-w-[420px] flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-zinc-50 hover:bg-white text-xs text-zinc-500">
            <span>🔍</span>
            <span className="flex-1 text-left">Search functions… (Ctrl+K)</span>
            <span className="text-[10px] border rounded px-1 bg-white">⌘K</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <JobIndicator />
          <div className="hidden md:flex items-center rounded-full border border-zinc-200 p-0.5 bg-zinc-50">
            <button onClick={()=>toggleMode('modern')} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${uiMode==='modern'?'bg-black text-white':'hover:bg-white text-zinc-600'}`}>Modern</button>
            <button onClick={()=>toggleMode('classic')} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${uiMode==='classic'?'bg-black text-white':'hover:bg-white text-zinc-600'}`}>Classic</button>
          </div>
          <UserMenu userEmail={userEmail} userRole={userRole} />
        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-[10vh] p-4" onClick={()=>setSearchOpen(false)}>
          <div className="w-full max-w-[640px] bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b">
              <span>🔍</span>
              <input autoFocus value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="" className="flex-1 outline-none text-sm" />
              <button onClick={()=>setSearchOpen(false)} className="text-xs border rounded-full px-2 py-1 hover:bg-zinc-50">Esc</button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-auto text-xs text-zinc-500">
              {searchQuery.trim().length < 2 ? (
                <div className="p-4 text-center">Type at least 2 characters – search uses FUNCTIONS list – e.g., EMTC (legacy MM01), PPOC (legacy ME21N), VA01, FFYC (legacy OB29), FPPC (legacy OBBO), FPPE (legacy OB52), FNRC (legacy FBN1), FGLC (legacy FS00)</div>
              ) : (
                <FunctionSearchResults query={searchQuery} companyCode={companyCode} onSelect={()=>setSearchOpen(false)} />
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col">
        {rbacDenied?.denied ? (
          <div className="min-h-[60vh] bg-[#fafaf9] p-6 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 max-w-[700px] w-full">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🔒</span>
                <div>
                  <h2 className="text-xl font-bold text-red-700">Unauthorised for this transaction – Contact Administrator</h2>
                  <p className="text-xs text-zinc-500 mt-1">FRPC Authorization – Code {rbacDenied.code} – {pathname} – sitewide RBAC – SoD segregation of duties – industry standard</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="text-sm font-mono font-bold text-red-800">{rbacDenied.reason}</div>
                <div className="text-xs text-zinc-600 mt-3">
                  <div>User: <b>{me?.email}</b> – simpleRole <b>{me?.simpleRole}</b> – roles [{me?.roles?.join(', ')}]</div>
                  <div className="mt-1">Required permission: <b>{rbacDenied.requiredPermission}</b> – required roles [{rbacDenied.requiredRoles?.join(', ')}]</div>
                  <div className="mt-2 text-[11px] text-zinc-500">If code is used show error message instead of formdata per your request – completely block view – master data manager cannot access HR payroll or Inventory if requires WAREHOUSE/MATERIAL_MANAGER – SoD – payroll sensitive salary data, inventory sensitive stock – only allowed roles can access – contact administrator to grant role via /admin/roles and /admin/authorizations – FRPC own IP alias FROC (legacy PFCG)/FUSC (legacy SU01) – industry standard</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px]">
                <div className="font-semibold">Why this transaction is blocked?</div>
                <div className="mt-1">• Transaction {rbacDenied.code} – {pathname} – requires permission {rbacDenied.requiredPermission} – user {me?.simpleRole} roles [{me?.roles?.join(', ')}] does not have it</div>
                <div>• Master data manager (MASTER_DATA_MANAGER) has only FOUNDATION permissions MATERIAL_CREATE/MATERIAL_VIEW – cannot access HR payroll (PAYROLL_RUN) or Inventory if requires WAREHOUSE/MATERIAL_MANAGER – SoD</div>
                <div>• If you came to a page that is not allowed, show this unauthorized message instead of form data – per your request – completely block view – remove pages without permission from navigator</div>
                <div className="mt-2">Contact administrator to assign role via POST /api/user-roles – e.g., assign HR role to access payroll, WAREHOUSE to access inventory, MATERIAL_MANAGER to access Inventory</div>
              </div>
              <div className="mt-6 flex gap-2">
                <Link href={`/${companyCode}/navigator`} className="px-4 py-2 rounded-full bg-black text-white text-xs">🌳 Navigator – only allowed pages shown (pages without permission removed)</Link>
                <a href="/login" className="px-4 py-2 rounded-full border text-xs bg-white hover:bg-zinc-50">Switch User</a>
              </div>
              <div className="mt-4 text-[10px] text-zinc-400">
                <div>Code {rbacDenied.code} – {pathname} – permission {rbacDenied.requiredPermission} – roles {rbacDenied.requiredRoles?.join(', ')}</div>
                <div>Current: {me?.email} – {me?.simpleRole} – [{me?.roles?.join(', ')}] – perms [{me?.permissions?.slice(0,5).join(', ')}...]</div>
                <div>Error shown instead of formdata per your request – if code is used show error message instead of formdata – completely block view – navigator removes pages without permission</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1">{children}</div>
        )}
        <footer className="border-t border-zinc-200 bg-white px-6 py-3 flex flex-col sm:flex-row gap-2 justify-between items-center text-[11px] text-zinc-500">
          <div className="flex gap-3 items-center">
            <Link href={`/${companyCode}/navigator`} className="hover:text-black font-medium">🌳 Navigator</Link>
            <span className="text-zinc-300">|</span>
            <Link href="/docs" className="hover:text-black font-medium">Documentation</Link>
            <span className="text-zinc-300">|</span>
            <a href="https://github.com/deepakpt2/erp-modular-monolith" target="_blank" rel="noopener noreferrer" className="hover:text-black flex items-center gap-1">
              <span>GitHub</span>
              <span className="text-[10px]">↗</span>
            </a>
            <span className="text-zinc-300">|</span>
            <Link href="/" className="hover:text-black">Home</Link>
          </div>
          <div className="text-[10px]">© 2026 ERP Modular Monolith • MIT License • Company: {companyCode}</div>
        </footer>
      </main>
    </div>
  );
}

function FunctionSearchResults({ query, companyCode, onSelect }: { query: string; companyCode: string; onSelect: ()=>void }) {
  const [results, setResults] = useState<any[]>([]);
  useEffect(()=>{
    let cancelled = false;
    (async ()=>{
      try {
        const mod = await import('@/shared/lib/functions');
        const res = mod.searchFunctions(query);
        if (!cancelled) setResults(res);
      } catch (e) {
        if (!cancelled) setResults([]);
      }
    })();
    return ()=>{ cancelled = true; };
  }, [query]);

  if (results.length===0) return <div className="p-4 text-center">No results for {query}</div>;
  return (
    <div className="space-y-1">
      {results.map((f:any)=>{
        const href = f.route.replace('/1000/', `/${companyCode}/`);
        return (
          <Link key={f.code} href={href} onClick={onSelect} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200">
            <span className="text-[10px] font-mono border rounded px-1.5 py-0.5 bg-zinc-900 text-white">{f.code}</span>
            {f.aliases?.[0] && <span className="text-[9px] font-mono border rounded px-1 bg-zinc-50 text-zinc-500">{f.aliases[0]}</span>}
            <span className="flex-1 font-medium text-zinc-900">{f.description}</span>
            <span className="text-[10px] text-zinc-400">{f.module}</span>
          </Link>
        );
      })}
    </div>
  );
}

