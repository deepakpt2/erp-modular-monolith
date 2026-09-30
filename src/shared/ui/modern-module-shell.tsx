"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { FUNCTIONS, MODULE_CLASSIFICATION } from '@/shared/lib/functions';
import { FunctionCommandPalette } from '@/shared/ui/function-command-palette';

const SHOW_FUNCTION_CODE = process.env.NEXT_PUBLIC_SHOW_FUNCTION_CODE !== 'false';

interface ModernModuleShellProps {
  title: string;
  subtitle: string;
  code: string;
  module: keyof typeof MODULE_CLASSIFICATION;
  children: React.ReactNode;
  classicChildren?: React.ReactNode;
  kpis?: { label: string; value: string; icon?: string }[];
  tooltip?: string;
}

export function ModernModuleShell({ title, subtitle, code, module, children, classicChildren, kpis, tooltip }: ModernModuleShellProps) {
  const [view, setView] = useState<'modern' | 'classic'>('modern');
  const [cmd, setCmd] = useState(code);
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated' && session?.user;
  const moduleInfo = MODULE_CLASSIFICATION[module];

  useEffect(() => {
    const saved = localStorage.getItem('erp-view-mode') as 'modern' | 'classic' | null;
    if (saved) setView(saved);
    // also listen for ui mode change from single-code-page
    const saved2 = localStorage.getItem('erp-ui-mode') as any;
    if (saved2) setView(saved2);
    const handler = (e: any) => setView(e.detail);
    window.addEventListener('erp-ui-mode-change', handler as any);
    window.addEventListener('erp-view-mode-change', handler as any);
    return () => {
      window.removeEventListener('erp-ui-mode-change', handler as any);
      window.removeEventListener('erp-view-mode-change', handler as any);
    };
  }, []);
  const setViewPersist = (v: 'modern' | 'classic') => {
    setView(v);
    localStorage.setItem('erp-view-mode', v);
    localStorage.setItem('erp-ui-mode', v);
    try { window.dispatchEvent(new CustomEvent('erp-ui-mode-change', { detail: v })); } catch {}
  };

  const handleCmdEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const c = cmd.trim().toUpperCase();
      const found = FUNCTIONS.find(t => t.code.toUpperCase() === c || (t.aliases && t.aliases.some(a => a.toUpperCase() === c)));
      if (found) {
        router.push(found.route);
      }
    }
  };

  if (view === 'classic') {
    return (
      <div className="min-h-screen bg-white text-black font-mono text-[11px] flex flex-col select-text">
        <div className="h-7 bg-black text-white flex items-center px-2 gap-2 border-b-2 border-black shrink-0">
          <span className="text-[10px] font-bold tracking-widest uppercase">CMD</span>
          <input value={cmd} onChange={e => setCmd(e.target.value.toUpperCase())} onKeyDown={handleCmdEnter} className="w-[80px] h-[20px] bg-black border-2 border-white text-white px-1 text-[10px] font-bold outline-none uppercase" placeholder={code} />
          <button onClick={() => { const c = cmd.trim().toUpperCase(); const found = FUNCTIONS.find(t => t.code.toUpperCase() === c || (t.aliases && t.aliases.some(a => a.toUpperCase() === c))); if (found) router.push(found.route); }} className="h-[20px] px-2 bg-white text-black border-2 border-black text-[10px] font-bold hover:bg-zinc-100">↵</button>
          <span className="w-px h-4 bg-white mx-1"></span>
          <span className="font-bold text-[11px] tracking-tight uppercase">{code}</span>
          <span className="text-white">|</span>
          <span className="text-[11px] truncate font-bold uppercase">{title}</span>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => router.back()} className="h-[20px] px-2 bg-black border-2 border-white text-[10px] font-bold uppercase hover:bg-zinc-900">BACK</button>
            <Link href="/" className="h-[20px] px-2 bg-black border-2 border-white text-[10px] font-bold uppercase hover:bg-zinc-900 flex items-center">HOME</Link>
            {isLoggedIn && <span className="ml-2 text-[9px] text-white hidden md:inline uppercase">{(session?.user as any)?.email?.split('@')[0]} {(session?.user as any)?.role}</span>}
            <button onClick={() => setViewPersist('modern')} className="ml-2 h-[20px] px-3 bg-white text-black text-[10px] font-bold uppercase hover:bg-zinc-100 border-2 border-black">MODERN</button>
          </div>
        </div>
        {kpis && kpis.length > 0 && (
          <div className="bg-white border-b-2 border-black px-2 py-1 flex gap-4 text-[10px] shrink-0 overflow-x-auto uppercase font-bold">
            {kpis.map(k => (
              <span key={k.label} className="whitespace-nowrap border-r-2 border-black pr-3 last:border-0">
                <span>{k.label}</span> <span className="font-bold">{k.value}</span>
              </span>
            ))}
          </div>
        )}
        <div className="flex-1 overflow-auto bg-white">
          <div className="min-h-full">
            <div className="classic-power p-0">{classicChildren || children}</div>
          </div>
        </div>
        <div className="h-6 bg-black text-white flex items-center px-2 justify-between text-[9px] shrink-0 gap-2 uppercase font-bold">
          <div className="flex gap-2 items-center">
            <span>{code} | READY</span>
            <span>|</span>
            <Link href="/docs" className="underline">DOCS</Link>
            <a href="https://github.com/deepakpt2/erp-modular-monolith" target="_blank" className="underline">GITHUB</a>
          </div>
          <div className="flex gap-2 items-center">
            <span>© 2026 ERP • MIT</span>
            <span>{new Date().toLocaleTimeString()} {isLoggedIn ? (session?.user as any)?.email : ''}</span>
          </div>
        </div>
        <style>{`
          .classic-power input, .classic-power select, .classic-power textarea {
            font-family: monospace;
            font-size: 11px;
            border: 2px solid #000;
            border-radius: 0;
            background: #fff;
            color: #000;
            height: 28px;
            padding: 2px 6px;
          }
          .classic-power textarea { height: auto; min-height: 56px; }
          .classic-power button {
            font-family: monospace;
            font-size: 10px;
            border-radius: 0;
            border: 2px solid #000;
            text-transform: uppercase;
            font-weight: bold;
          }
          .classic-power .rounded-full, .classic-power .rounded-xl, .classic-power .rounded-2xl, .classic-power .rounded-lg {
            border-radius: 0 !important;
          }
          .classic-power .shadow-sm, .classic-power .shadow, .classic-power .shadow-2xl, .classic-power .shadow-\\[0_1px_2px_rgba\\(0\\,0\\,0\\,0\\.04\\)\\] {
            box-shadow: none !important;
          }
          .classic-power .backdrop-blur { backdrop-filter: none !important; }
          .classic-power .bg-zinc-50, .classic-power .bg-\\[\\#fafaf9\\], .classic-power .bg-amber-50, .classic-power .bg-blue-50, .classic-power .bg-zinc-100 { background: #fff !important; }
          .classic-power .border-zinc-200, .classic-power .border-zinc-100 { border-color: #000 !important; border-width: 2px !important; }
          .classic-power [data-power-hide], .classic-power .power-hide, .classic-power .explanation, .classic-power .help-text { display: none !important; }
        `}</style>
      </div>
    );
  }

  // MODERN DESIGN A – Minimal Compact 32px – Linear/Notion – small fields, 11px uppercase labels, rounded-lg, light zinc borders, black button rounded-full
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-zinc-200">
        <div className="max-w-[1600px] mx-auto px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[12px]">←</Link>
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-[13px] ${moduleInfo.color}`}>{moduleInfo.icon}</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-[14px] tracking-tight">{title}</h1>
                {SHOW_FUNCTION_CODE && (
                  <>
                    <span className="text-[10px] bg-black text-white border border-black rounded-full px-2 py-0.5 font-mono">↳ {code}</span>
                    {(() => {
                      const f = FUNCTIONS.find(t => t.code === code);
                      return f?.aliases && f.aliases.length > 0 ? (
                        <span className="text-[9px] bg-zinc-100 border border-zinc-200 text-zinc-500 rounded-full px-2 py-0.5 font-mono">alias {f.aliases.slice(0,2).join(', ')}</span>
                      ) : null;
                    })()}
                  </>
                )}
                <span className="text-[10px] border border-zinc-200 rounded-full px-2 py-0.5 bg-zinc-50 font-mono">{module}</span>
                {tooltip && (
                  <div className="relative group">
                    <span className="w-4 h-4 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] text-zinc-500 cursor-help hover:bg-black hover:text-white transition">?</span>
                    <div className="absolute left-0 top-6 z-50 hidden group-hover:block w-[380px] bg-zinc-900 text-white text-[11px] leading-relaxed p-3 rounded-xl shadow-xl border border-zinc-700 whitespace-pre-wrap">
                      <div className="font-bold text-[12px] mb-1">{title} • {code}</div>
                      <div className="text-zinc-300 text-[11px]">{tooltip}</div>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 leading-tight">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <FunctionCommandPalette />
            {isLoggedIn ? (
              <div className="relative group">
                <button className="flex items-center gap-1.5 bg-black text-white rounded-full px-3 py-1 text-[11px] h-[28px] hover:bg-zinc-800 transition-colors">
                  <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center font-bold text-[10px]">{(() => { const u = session?.user as any; const dn = u?.name || u?.username || (u?.email ? u.email.split('@')[0] : 'U'); return (dn?.[0] || 'U').toUpperCase(); })()}</span>
                  <span className="max-w-[100px] truncate hidden md:inline text-[11px]">{(() => { const u = session?.user as any; return u?.name || u?.username || (u?.email ? u.email.split('@')[0] : 'User'); })()}</span>
                  <span className="text-[8px] opacity-70">▼</span>
                </button>
                <div className="absolute right-0 top-8 z-50 hidden group-hover:block w-60 bg-white border border-zinc-200 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-1.5">
                  <div className="p-2.5 border-b border-zinc-100 text-[11px]">
                    <div className="font-semibold text-[12px] truncate">{(() => { const u = session?.user as any; return u?.name || u?.username || (u?.email ? u.email.split('@')[0] : 'User'); })()}</div>
                    <div className="text-[10px] text-zinc-500 truncate mt-0.5">{(session?.user as any)?.email}</div>
                    <div className="mt-1 inline-flex text-[9px] bg-black text-white rounded-full px-2 py-0.5">{(session?.user as any)?.role || 'USER'}</div>
                  </div>
                  <div className="p-1 space-y-0.5">
                    <Link href="/1000/foundation/user-profile" className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-lg hover:bg-black hover:text-white text-zinc-700">👤 Profile</Link>
                    <Link href="/1000/foundation/users" className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-lg hover:bg-black hover:text-white text-zinc-700">👥 Users</Link>
                    <Link href="/1000/foundation/roles" className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-lg hover:bg-black hover:text-white text-zinc-700">🔐 Roles</Link>
                    <div className="border-t border-zinc-100 my-1"></div>
                    <button onClick={()=>signOut({callbackUrl:'/login'})} className="w-full flex items-center gap-2 text-left px-2.5 py-1.5 text-[11px] rounded-lg hover:bg-black hover:text-white text-zinc-700">🚪 Sign Out</button>
                  </div>
                </div>
              </div>
            ) : null}
            <button onClick={() => setViewPersist('classic')} className="text-[11px] border border-zinc-200 rounded-full px-3 py-1 h-[28px] bg-white hover:bg-zinc-50 transition-colors font-medium" title="Classic – Strict no nonsense monochrome">Classic</button>
            <Link href="/" className="text-[11px] bg-black text-white rounded-full px-3 py-1 h-[28px] hover:bg-zinc-800 transition-colors inline-flex items-center font-medium">Home</Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-5 py-4">
        {kpis && (
          <div className="grid grid-cols-4 gap-2.5 mb-4">
            {kpis.map(k => (
              <div key={k.label} className="bg-white rounded-2xl border border-zinc-200 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">{k.label}</div>
                <div className="mt-1 text-[15px] font-semibold flex items-center gap-1.5 tracking-tight"><span className="text-[13px]">{k.icon}</span>{k.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5">
          {children}
        </div>
      </div>

      <footer className="border-t border-zinc-200 bg-white mt-10">
        <div className="max-w-[1600px] mx-auto px-5 py-3 flex flex-col sm:flex-row gap-2 justify-between items-center text-[10px] text-zinc-500">
          <div className="flex gap-2 items-center">
            <Link href="/docs" className="hover:text-black font-medium">Docs</Link>
            <span className="text-zinc-300">|</span>
            <a href="https://github.com/deepakpt2/erp-modular-monolith" target="_blank" rel="noopener noreferrer" className="hover:text-black flex items-center gap-1">GitHub ↗</a>
            <span className="text-zinc-300">|</span>
            <Link href="/" className="hover:text-black">Home</Link>
            <span className="text-zinc-300">|</span>
            <span className="font-mono text-[9px]">{code}</span>
          </div>
          <div className="text-[9px] uppercase tracking-widest">© 2026 ERP Modular Monolith • MIT</div>
        </div>
      </footer>
    </div>
  );
}
