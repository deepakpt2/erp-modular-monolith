"use client";

import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

const SHOW_FUNCTION_CODE = process.env.NEXT_PUBLIC_SHOW_FUNCTION_CODE !== 'false';

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

  useEffect(()=>{
    try {
      const saved = localStorage.getItem('erp-ui-mode');
      if (saved) setUiMode(saved as any);
    } catch {}
  }, []);

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
          <div className="hidden md:flex items-center rounded-full border border-zinc-200 p-0.5 bg-zinc-50">
            <button onClick={()=>toggleMode('modern')} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${uiMode==='modern'?'bg-black text-white':'hover:bg-white text-zinc-600'}`}>Modern</button>
            <button onClick={()=>toggleMode('classic')} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${uiMode==='classic'?'bg-black text-white':'hover:bg-white text-zinc-600'}`}>Classic</button>
          </div>
          {userEmail && (
            <div className="hidden sm:flex items-center gap-2 text-[11px] border rounded-full px-2.5 py-1 bg-zinc-900 text-white">
              <span className="font-medium truncate max-w-[120px]">{userEmail.split('@')[0]}</span>
              <span className="text-zinc-400">• {userRole || 'USER'}</span>
            </div>
          )}
          <a href="/api/auth/signout" className="text-[11px] border rounded-full px-2.5 py-1 hover:bg-black hover:text-white transition-colors">Sign out</a>
        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-[10vh] p-4" onClick={()=>setSearchOpen(false)}>
          <div className="w-full max-w-[640px] bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b">
              <span>🔍</span>
              <input autoFocus value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Type function code e.g., MM01, ME21N, OB29, or name e.g., Create Material…" className="flex-1 outline-none text-sm" />
              <button onClick={()=>setSearchOpen(false)} className="text-xs border rounded-full px-2 py-1 hover:bg-zinc-50">Esc</button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-auto text-xs text-zinc-500">
              {searchQuery.trim().length < 2 ? (
                <div className="p-4 text-center">Type at least 2 characters – search uses FUNCTIONS list – e.g., MM01, ME21N, VA01, OB29, OBBO, OB52, FBN1, FS00</div>
              ) : (
                <FunctionSearchResults query={searchQuery} companyCode={companyCode} onSelect={()=>setSearchOpen(false)} />
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1">{children}</div>
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

