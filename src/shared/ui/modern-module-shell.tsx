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
      const code = cmd.trim().toUpperCase();
      const found = FUNCTIONS.find(t => t.code === code);
      if (found) {
        router.push(found.route);
      }
    }
  };

  if (view === 'classic') {
    return (
      <div className="min-h-screen bg-[#ededed] font-mono text-[12px] flex flex-col select-none">
        <div className="bg-[#d4d0c8] border-b border-[#808080] h-7 flex items-center px-1 gap-1">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold ml-1">Command:</span>
            <input
              value={cmd}
              onChange={e => setCmd(e.target.value.toUpperCase())}
              onKeyDown={handleCmdEnter}
              className="w-[90px] h-[20px] border border-black bg-white px-1 text-[11px] font-bold outline-none focus:border-[#000080]"
              title="Enter helper code to open function – e.g., ME21N opens Create Purchase Order, MM01 opens Create Material"
            />
            <button
              onClick={() => {
                const found = FUNCTIONS.find(t => t.code === cmd.trim().toUpperCase());
                if (found) router.push(found.route);
              }}
              className="h-[20px] w-[20px] border border-[#404040] bg-[#d4d0c8] text-[12px] flex items-center justify-center hover:bg-[#e8e8e8]"
              title="Open function via helper code"
            >↩</button>
          </div>

          <div className="w-px h-5 bg-[#a0a0a0] mx-2"></div>

          <div className="flex items-center gap-0.5">
            <button onClick={() => router.back()} className="h-6 px-2 border border-[#a0a0a0] bg-[#d4d0c8] text-[11px] flex items-center gap-1 hover:bg-[#e0e0e0]" title="Back F3">
              <span className="text-green-700 font-bold">◀</span> Back
            </button>
            <Link href="/" className="h-6 px-2 border border-[#a0a0a0] bg-[#d4d0c8] text-[11px] flex items-center gap-1 hover:bg-[#e0e0e0]">
              <span className="text-red-700">■</span> Exit
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] text-[#404040] mr-2">1000 • {module} • {new Date().toLocaleDateString()} • {isLoggedIn ? `${(session?.user as any)?.email} ${(session?.user as any)?.role || ''}` : 'GUEST'}</span>
            {isLoggedIn && <button onClick={()=>signOut({callbackUrl:'/login'})} className="h-6 px-2 border border-[#a0a0a0] bg-[#d4d0c8] text-[10px] hover:bg-[#e0e0e0]">Logout</button>}
            <button onClick={() => setView('modern')} className="h-6 px-3 border border-[#000080] bg-[#000080] text-white text-[11px] hover:bg-[#0000a0]">
              Modern
            </button>
          </div>
        </div>

        <div className="bg-[#000080] text-white h-6 flex items-center px-2 justify-between text-[12px] font-bold">
          <span>{title} - {subtitle} {SHOW_FUNCTION_CODE ? `(Helper: ${code})` : ''}</span>
          <span className="text-[10px] font-normal opacity-90">{moduleInfo.name} • Client 100 • Company 1000 KWD</span>
        </div>

        <div className="flex-1 bg-[#f5f5f0] p-0 overflow-auto">
          <div className="bg-[#f5f5f0] min-h-full">
            {kpis && kpis.length > 0 && (
              <div className="bg-[#d4d0c8] border-b border-[#808080] px-2 py-1 flex gap-2 text-[11px]">
                {kpis.map(k => (
                  <span key={k.label} className="border border-[#808080] bg-white px-2 py-0.5">
                    <span className="text-[#606060]">{k.label}:</span> <b>{k.value}</b>
                  </span>
                ))}
                <span className="ml-auto text-[10px] text-[#606060]">{SHOW_FUNCTION_CODE ? `Helper ${code} • ` : ''}{relatedFunctionInfo(code)} • Function is destination • Helper code identifies function • Tab/Enter • Ctrl+K</span>
              </div>
            )}
            <div className="p-1">
              {classicChildren || children}
            </div>
          </div>
        </div>

        <div className="bg-[#d4d0c8] border-t border-[#808080] h-5 flex items-center px-2 justify-between text-[10px]">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#00c000] border border-[#004000]"></span>
            <span>{title} ready • Helper {code} • Plant 1000 • SLoc 0001 • {new Date().toLocaleTimeString()} • {isLoggedIn ? (session?.user as any)?.email : 'GUEST'}</span>
          </span>
          <span className="flex gap-3">
            <span>INS</span>
            <span>1000 KWD</span>
            <span>{isLoggedIn ? (session?.user as any)?.role : 'GUEST'}</span>
          </span>
        </div>
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
                {SHOW_FUNCTION_CODE && <span className="text-[10px] bg-zinc-50 border border-zinc-200 text-zinc-500 rounded-full px-2 py-0.5" title="Helper code to identify function – function is the destination">↳ {code}</span>}
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
            <button onClick={() => setView('classic')} className="text-xs border rounded-full px-3 py-1.5 bg-[#000080] text-white hover:bg-[#0000a0] transition-colors">Classic</button>
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
    </div>
  );
}

function relatedFunctionInfo(code: string): string {
  const tc = FUNCTIONS.find(t => t.code === code);
  if (!tc) return '';
  return `${tc.subModule} ${tc.type} – Function is destination, ${code} is helper`;
}
