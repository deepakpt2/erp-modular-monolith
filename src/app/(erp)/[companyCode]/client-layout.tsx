"use client";

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

// Helper code flag – code is just helper to identify function, function itself is destination
const SHOW_FUNCTION_CODE = process.env.NEXT_PUBLIC_SHOW_FUNCTION_CODE !== 'false';

const NAV_GROUPS = [
  {
    label: 'FOUNDATION - Enterprise Structure',
    icon: '🏢',
    items: [
      { code: 'OX15/OX02', label: 'Enterprise Structure', desc: 'Company, Company Code, Plant, SLoc – Function destination', href: '/foundation/enterprise-structure' },
      { code: 'OX02', label: 'Company Master', desc: 'Company Code Legal Details – Function', href: '/fico/company-master' },
      { code: 'OMS2', label: 'Material Types', desc: 'ROH/HALB/FERT – Configurable Function', href: '/foundation/material-types' },
      { code: 'CUNI', label: 'Units of Measure', desc: 'KG/PC/BOX – Configurable Function', href: '/foundation/uom' },
      { code: 'MM01', label: 'Materials', desc: 'Create/Change/Display Material – Function', href: '/foundation/materials' },
      { code: 'MMBE', label: 'Stock Overview', desc: 'Stock by Plant/SLoc/Batch – Function', href: '/foundation/stock' },
    ]
  },
  {
    label: 'FICO - Financials',
    icon: '💰',
    items: [
      { code: 'OB13', label: 'Chart of Accounts', desc: 'General CoA – Configurable Function', href: '/fico/chart-of-accounts' },
      { code: 'FS00', label: 'G/L Accounts', desc: 'G/L – Configurable Function', href: '/fico/gl-accounts' },
      { code: 'KS01', label: 'Cost Centers', desc: 'Cost Centers – Function', href: '/fico/cost-centers' },
      { code: 'FTXP', label: 'Tax Codes', desc: 'VAT 5% + GST – Configurable Function', href: '/fico/tax-codes' },
      { code: 'OY03', label: 'Currencies', desc: 'Only INR default – Function', href: '/fico/currencies' },
      { code: 'OBBO', label: 'Posting Period Variant', desc: 'OBBO/OB52/OBBP – Function', href: '/fico/posting-period' },
      { code: 'F-53/KZ', label: 'Payment Processing', desc: 'Vendor Payment – Function', href: '/fico/payment' },
      { code: 'KSB1', label: 'CCA Report', desc: 'Cost Center Actuals – Function', href: '/fico/cca-report' },
      { code: 'CK40N', label: 'Costing Run', desc: 'BOM Cost Rollup – Function', href: '/fico/costing-run' },
    ]
  },
  {
    label: 'MM - Materials Management',
    icon: '📦',
    items: [
      { code: 'ME51N', label: 'Purchase Requisitions', desc: 'Create/Change/Display PR – Function', href: '/mm/pr' },
      { code: 'ME21N', label: 'Purchase Orders', desc: 'Create PO – Function destination, ME21N is helper', href: '/mm/po' },
      { code: 'MIGO 101', label: 'Goods Receipts', desc: 'Create Goods Receipt – Function, MIGO helper', href: '/mm/gr' },
      { code: 'MIRO', label: 'Invoice Verification', desc: 'Invoice Verification – Function, MIRO helper', href: '/mm/iv' },
      { code: 'MI01', label: 'Physical Inventory', desc: 'Physical Inventory – Function', href: '/mm/physical-inventory' },
      { code: 'ME27', label: 'Stock Transport Orders', desc: 'Create STO – Function', href: '/mm/sto' },
    ]
  },
  {
    label: 'PP - Production Planning',
    icon: '🏭',
    items: [
      { code: 'CS01', label: 'BOM', desc: 'Create BOM – Function, CS01 helper', href: '/pp/bom' },
      { code: 'CR01', label: 'Work Centers', desc: 'Create Work Center – Function', href: '/pp/work-centers' },
      { code: 'CA01', label: 'Routings', desc: 'Create Routing – Function', href: '/pp/routings' },
      { code: 'MD01', label: 'MRP', desc: 'MRP Run – Function', href: '/pp/mrp' },
      { code: 'KITTING', label: 'Kitting', desc: 'Kitting Assembly – Function', href: '/pp/kitting' },
    ]
  },
  {
    label: 'SD - Sales & Distribution',
    icon: '🛒',
    items: [
      { code: 'VA01', label: 'Sales Orders', desc: 'Create Sales Order – Function, VA01 helper', href: '/sales' },
      { code: 'VL01N', label: 'Outbound Delivery', desc: 'Create Delivery – Function', href: '/sd/delivery' },
      { code: 'VF01', label: 'Billing', desc: 'Create Billing – Function', href: '/sd/billing' },
    ]
  },
  {
    label: 'HR / AUDIT / WORKFLOW',
    icon: '👥',
    items: [
      { code: 'PC00', label: 'Payroll', desc: 'Payroll Run – Function', href: '/hr/payroll' },
      { code: 'ALB', label: 'Document Flow', desc: 'Document Flow Tracking – Function, ALB helper', href: '/audit/document-flow' },
      { code: 'SM20', label: 'Audit Logs', desc: 'Audit Log – Function, SM20 helper', href: '/audit/logs' },
      { code: 'SBWP', label: 'Workflow Inbox', desc: 'Workflow Approvals – Function', href: '/workflow/inbox' },
    ]
  },
  {
    label: 'ADMIN - Users & Roles',
    icon: '🔐',
    items: [
      { code: 'SU01', label: 'My Profile', desc: 'Own profile – Function', href: '/foundation/user-profile' },
      { code: 'SU01', label: 'User Management', desc: 'Create users – Function', href: '/foundation/users' },
      { code: 'PFCG', label: 'Roles & Permissions', desc: 'Role definitions – Function', href: '/foundation/roles' },
    ]
  }
];

export default function CompanyClientLayout({ children, companyCode, userEmail, userRole }: { children: React.ReactNode; companyCode: string; userEmail?: string; userRole?: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('erp-nav-collapsed-groups');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {};
  });

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = { ...prev, [label]: !prev[label] };
      try { localStorage.setItem('erp-nav-collapsed-groups', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('erp-nav-collapsed-groups');
      if (saved) setCollapsedGroups(JSON.parse(saved));
    } catch {}
  }, []);

  return (
    <div className="flex min-h-screen bg-[#fafaf9]">
      <aside className={`${collapsed ? 'w-[60px]' : 'w-[280px]'} bg-white border-r border-zinc-200 flex flex-col transition-all duration-200 shrink-0`}>
        <div className="h-[64px] border-b border-zinc-200 flex items-center px-4 gap-3">
          <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-black shrink-0">E</div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{companyCode} • ERP</div>
              <div className="text-[11px] text-zinc-500">Function is destination</div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-zinc-400 hover:text-black text-xs">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-2 space-y-4">
          {!collapsed && (
            <>
              <Link href="/" className="flex items-center gap-2 text-xs border rounded-xl px-3 py-2 hover:bg-zinc-50">
                <span>🏠</span> Dashboard • All Companies
              </Link>
              {userEmail && (
                <div className="bg-zinc-900 text-white rounded-xl p-2 text-[11px]">
                  <div className="font-medium truncate">{(() => { const email = userEmail || ''; return email.includes('@') ? email.split('@')[0] : email; })()}</div>
                  <div className="text-zinc-400 truncate text-[10px]">{userEmail}</div>
                  <div className="text-zinc-400 mt-0.5">{userRole || 'USER'} • Secure</div>
                  <a href="/api/auth/signout" className="mt-1 inline-block text-[10px] border border-zinc-700 rounded-full px-2 py-0.5 hover:bg-black hover:text-white transition-colors">Sign out</a>
                </div>
              )}
            </>
          )}

          {NAV_GROUPS.map(group => {
            const isGroupCollapsed = !!collapsedGroups[group.label];
            return (
            <div key={group.label}>
              {!collapsed && (
                <button onClick={()=>toggleGroup(group.label)} className="w-full text-[10px] uppercase tracking-widest text-zinc-500 px-2 py-1 flex items-center gap-1 hover:text-black hover:bg-zinc-50 rounded-lg">
                  <span>{group.icon}</span> <span className="flex-1 text-left">{group.label}</span> <span className="text-[10px]">{isGroupCollapsed?'▶':'▼'}</span>
                </button>
              )}
              {(!isGroupCollapsed || collapsed) && (
              <div className="space-y-0.5 mt-1">
                {group.items.map(item => {
                  const fullHref = `/${companyCode}${item.href}`;
                  const isActive = pathname === fullHref || pathname.startsWith(fullHref + '?');
                  return (
                    <Link
                      key={fullHref}
                      href={fullHref}
                      title={`Function: ${item.label} – ${item.desc} – Helper code ${item.code} identifies function, function is destination`}
                      className={`flex items-center gap-2 px-2 py-2 rounded-xl text-xs ${isActive ? 'bg-zinc-900 text-white hover:bg-black' : 'hover:bg-zinc-50 hover:text-black bg-white text-zinc-700'} ${collapsed ? 'justify-center' : ''}`}
                    >
                      {/* Function is destination, helper code is secondary */}
                      {!collapsed && (
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate flex items-center gap-1.5">
                            <span>{item.label}</span>
                            {SHOW_FUNCTION_CODE && (
                              <span className={`text-[9px] font-mono px-1 py-0 rounded border ${isActive ? 'bg-white/20 border-white/20 text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`} title="Helper code to identify function">↳ {item.code.split('/')[0]}</span>
                            )}
                          </div>
                          <div className={`text-[10px] truncate ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>{item.desc}</div>
                        </div>
                      )}
                      {collapsed && SHOW_FUNCTION_CODE && (
                        <span className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded shrink-0 ${isActive ? 'bg-white text-black' : 'bg-zinc-100 text-zinc-500 border'}`} title={`Helper ${item.code} → ${item.label}`}>{item.code.split('/')[0]}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
              )}
            </div>
          )})}
        </div>

        <div className="p-2 border-t border-zinc-200">
          {!collapsed ? (
            <div className="text-[11px] text-zinc-500 space-y-1">
              <div>Company: <b>{companyCode}</b></div>
              <div className="text-[10px]">Function is destination • Code is helper</div>
              <div>Search: Press <kbd className="border rounded px-1">Ctrl+K</kbd> – search function name</div>
              <div>Helper OX02 → Company Master</div>
            </div>
          ) : (
            <div className="text-center text-[10px] text-zinc-400">Func</div>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
