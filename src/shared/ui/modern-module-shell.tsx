"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { FUNCTIONS, MODULE_CLASSIFICATION } from '@/shared/lib/functions';
import { FunctionCommandPalette } from '@/shared/ui/function-command-palette';

// Helper code flag – code is just helper to identify function, function is the destination
const SHOW_FUNCTION_CODE = process.env.NEXT_PUBLIC_SHOW_FUNCTION_CODE !== 'false';

interface ModernModuleShellProps {
  title: string; // Function name is the destination, e.g., Create Purchase Order
  subtitle: string;
  code: string; // Helper code to identify function, e.g., ME21N – not the destination itself
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
    // POWER USER CLASSIC – No-nonsense, only required data and fields, exact names, no explanations
    // Keep name Classic, but advanced user version – no visual distractions, no wording, no tooltips
    return (
      <div className="min-h-screen bg-white text-black font-mono text-[12px] flex flex-col select-text">
        {/* Top – dense, only cmd + code + title + actions – no explanations */}
        <div className="h-8 bg-black text-white flex items-center px-2 gap-2 border-b border-black shrink-0">
          <span className="text-[11px] font-bold tracking-widest">CMD</span>
          <input
            value={cmd}
            onChange={e => setCmd(e.target.value.toUpperCase())}
            onKeyDown={handleCmdEnter}
            className="w-[88px] h-[20px] bg-zinc-900 border border-zinc-700 text-white px-1 text-[11px] font-bold outline-none focus:border-white uppercase"
            placeholder={code}
          />
          <button
            onClick={() => {
              const c = cmd.trim().toUpperCase();
              const found = FUNCTIONS.find(t => t.code.toUpperCase() === c || (t.aliases && t.aliases.some(a => a.toUpperCase() === c)));
              if (found) router.push(found.route);
            }}
            className="h-[20px] px-2 bg-zinc-800 border border-zinc-700 text-[11px] hover:bg-zinc-700"
          >↵</button>

          <span className="w-px h-4 bg-zinc-700 mx-1"></span>

          <span className="font-bold text-[12px] tracking-tight">{code}</span>
          <span className="text-zinc-500">|</span>
          <span className="text-[12px] truncate font-medium">{title}</span>

          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => router.back()} className="h-[20px] px-2 bg-zinc-900 border border-zinc-800 text-[11px] hover:bg-zinc-800">BACK</button>
            <Link href="/" className="h-[20px] px-2 bg-zinc-900 border border-zinc-800 text-[11px] hover:bg-zinc-800 flex items-center">HOME</Link>
            {isLoggedIn && (
              <span className="ml-2 text-[10px] text-zinc-400 hidden md:inline">
                {(session?.user as any)?.email?.split('@')[0]} {(session?.user as any)?.role}
              </span>
            )}
            <button onClick={() => setView('modern')} className="ml-2 h-[20px] px-3 bg-white text-black text-[11px] font-bold hover:bg-zinc-200">
              MODERN
            </button>
          </div>
        </div>

        {/* KPI – exact names only, no icons, no explanations, no wording */}
        {kpis && kpis.length > 0 && (
          <div className="bg-zinc-50 border-b border-zinc-200 px-2 py-1 flex gap-4 text-[11px] shrink-0 overflow-x-auto">
            {kpis.map(k => (
              <span key={k.label} className="whitespace-nowrap">
                <span className="text-zinc-500">{k.label}</span> <span className="font-bold">{k.value}</span>
              </span>
            ))}
          </div>
        )}

        {/* Content – no nonsense, only required fields, exact names, no explanations */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="min-h-full">
            {/* 
              Classic = power user advanced version:
              - No subtitles
              - No tooltips
              - No explanatory paragraphs
              - Only exact field names
              - Dense tables/forms
              - Children should provide minimal UI – but if they contain explanations, they are still shown; 
                future classicChildren should be built with only required fields.
              - We wrap with class classic-power to allow CSS overrides: hide .power-hide, .explanation, etc.
            */}
            <div className="classic-power p-0">
              {classicChildren || children}
            </div>
          </div>
        </div>

        {/* Footer – minimal, exact only */}
        <div className="h-6 bg-black text-white flex items-center px-2 justify-between text-[10px] shrink-0 gap-2">
          <div className="flex gap-2 items-center">
            <span>{code} | READY</span>
            <span className="text-zinc-600">|</span>
            <Link href="/docs" className="hover:text-white underline">DOCS</Link>
            <a href="https://github.com/deepakpt2/erp-modular-monolith" target="_blank" className="hover:text-white underline">GITHUB</a>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-zinc-500">© 2026 ERP Modular Monolith • MIT</span>
            <span className="text-zinc-400">{new Date().toLocaleTimeString()} {isLoggedIn ? (session?.user as any)?.email : ''}</span>
          </div>
        </div>

        <style>{`
          .classic-power input, .classic-power select, .classic-power textarea {
            font-family: monospace;
            font-size: 12px;
            border: 1px solid #000;
            border-radius: 0;
            background: #fff;
          }
          .classic-power button {
            font-family: monospace;
            font-size: 11px;
            border-radius: 0;
          }
          .classic-power .rounded-full, .classic-power .rounded-xl, .classic-power .rounded-2xl {
            border-radius: 0 !important;
          }
          .classic-power .shadow-sm, .classic-power .shadow, .classic-power .shadow-2xl {
            box-shadow: none !important;
          }
          .classic-power .backdrop-blur {
            backdrop-filter: none !important;
          }
          /* Hide explanatory elements in classic power mode – they have data-power-hide or class explanation */
          .classic-power [data-power-hide],
          .classic-power .power-hide,
          .classic-power .explanation,
          .classic-power .help-text {
            display: none !important;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-zinc-200">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center">←</Link>
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${moduleInfo.color}`}>{moduleInfo.icon}</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold">{title}</h1>
                {SHOW_FUNCTION_CODE && (
                  <>
                    <span className="text-[10px] bg-black text-white border border-black rounded-full px-2 py-0.5" title="New intuitive helper code – own IP, primary">↳ {code}</span>
                    {(() => {
                      const f = FUNCTIONS.find(t => t.code === code);
                      return f?.aliases && f.aliases.length > 0 ? (
                        <span className="text-[9px] bg-zinc-100 border border-zinc-200 text-zinc-400 rounded-full px-2 py-0.5" title={`Alias: ${f.aliases.join(', ')}`}>alias {f.aliases.slice(0,2).join(', ')}</span>
                      ) : null;
                    })()}
                  </>
                )}
                <span className="text-[10px] border rounded-full px-2 py-0.5">{module}</span>
                {tooltip && (
                  <div className="relative group">
                    <span className="w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[11px] text-zinc-500 cursor-help hover:bg-zinc-900 hover:text-white transition">?</span>
                    <div className="absolute left-0 top-7 z-50 hidden group-hover:block w-[420px] bg-zinc-900 text-white text-[11px] leading-relaxed p-4 rounded-xl shadow-2xl border border-zinc-700 whitespace-pre-wrap">
                      <div className="font-bold text-xs mb-2">{title} • Details {SHOW_FUNCTION_CODE ? `(Helper: ${code})` : ''}</div>
                      <div className="text-zinc-300">{tooltip}</div>
                      <div className="mt-2 text-[10px] text-zinc-400">Function is destination • Helper code {code} identifies function</div>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-500">{subtitle} {SHOW_FUNCTION_CODE ? `• Helper ${code} identifies function` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FunctionCommandPalette />
            {isLoggedIn ? (
              <div className="relative group">
                <button className="flex items-center gap-2 bg-zinc-900 text-white rounded-full px-3 py-1.5 text-[11px] hover:bg-black transition-colors">
                  <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center font-bold text-[10px]">{(() => { const u = session?.user as any; const dn = u?.name || u?.username || (u?.email ? u.email.split('@')[0] : 'U'); return (dn?.[0] || 'U').toUpperCase(); })()}</span>
                  <span className="max-w-[120px] truncate hidden md:inline">{(() => { const u = session?.user as any; return u?.name || u?.username || (u?.email ? u.email.split('@')[0] : 'User'); })()}</span>
                  <span className="text-[8px] opacity-70">▼</span>
                </button>
                <div className="absolute right-0 top-9 z-50 hidden group-hover:block w-64 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-2">
                  <div className="p-3 border-b border-zinc-100 text-xs">
                    <div className="font-semibold text-sm truncate text-zinc-900">{(() => { const u = session?.user as any; return u?.name || u?.username || (u?.email ? u.email.split('@')[0] : 'User'); })()}</div>
                    <div className="text-[11px] text-zinc-500 truncate mt-0.5">{(session?.user as any)?.email}</div>
                    <div className="mt-1 inline-flex text-[10px] bg-zinc-900 text-white rounded-full px-2 py-0.5">{(session?.user as any)?.role || 'USER'}</div>
                  </div>
                  <div className="p-1.5 space-y-1">
                    <Link href="/1000/foundation/user-profile" className="flex items-center gap-2 px-3 py-2.5 text-xs rounded-xl hover:bg-zinc-900 hover:text-white text-zinc-700 transition-colors">👤 My Profile</Link>
                    <Link href="/1000/foundation/users" className="flex items-center gap-2 px-3 py-2.5 text-xs rounded-xl hover:bg-zinc-900 hover:text-white text-zinc-700 transition-colors">👥 Users (ADMIN)</Link>
                    <Link href="/1000/foundation/roles" className="flex items-center gap-2 px-3 py-2.5 text-xs rounded-xl hover:bg-zinc-900 hover:text-white text-zinc-700 transition-colors">🔐 Roles</Link>
                    <div className="border-t border-zinc-100 my-1"></div>
                    <button onClick={()=>signOut({callbackUrl:'/login'})} className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-xs rounded-xl hover:bg-red-600 hover:text-white text-red-600 transition-colors">🚪 Sign Out</button>
                  </div>
                </div>
              </div>
            ) : null}
            <button onClick={() => setView('classic')} className="text-xs border rounded-full px-3 py-1.5 bg-black text-white hover:bg-zinc-800 transition-colors" title="Classic – Power user, no nonsense, only required fields, exact names">Classic</button>
            <Link href="/" className="text-xs bg-zinc-900 text-white rounded-full px-3 py-1.5 hover:bg-black transition-colors">Home</Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {kpis && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {kpis.map(k => (
              <div key={k.label} className="bg-white rounded-2xl border p-4">
                <div className="text-[11px] text-zinc-500 uppercase tracking-widest">{k.label}</div>
                <div className="mt-2 text-xl font-semibold flex items-center gap-2"><span>{k.icon}</span>{k.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border shadow-sm p-6">
          {children}
        </div>
      </div>

      <footer className="border-t border-zinc-200 bg-white mt-12">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col sm:flex-row gap-2 justify-between items-center text-[11px] text-zinc-500">
          <div className="flex gap-3 items-center">
            <Link href="/docs" className="hover:text-black font-medium">Documentation</Link>
            <span className="text-zinc-300">|</span>
            <a href="https://github.com/deepakpt2/erp-modular-monolith" target="_blank" rel="noopener noreferrer" className="hover:text-black flex items-center gap-1">GitHub <span className="text-[10px]">↗</span></a>
            <span className="text-zinc-300">|</span>
            <Link href="/" className="hover:text-black">Home</Link>
            <span className="text-zinc-300">|</span>
            <span className="text-[10px]">{code} • Function is destination</span>
          </div>
          <div className="text-[10px]">© 2026 ERP Modular Monolith • MIT License</div>
        </div>
      </footer>
    </div>
  );
}
