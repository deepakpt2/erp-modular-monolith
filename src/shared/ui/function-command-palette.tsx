"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FUNCTIONS, MODULE_CLASSIFICATION, searchFunctions } from '@/shared/lib/functions';

// Env flag to show/hide helper code badge – code is just a helper to identify function, not the destination
const SHOW_FUNCTION_CODE = process.env.NEXT_PUBLIC_SHOW_FUNCTION_CODE !== 'false';

export function FunctionCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  // Automatically reset search query and close palette on route transitions
  useEffect(() => {
    setOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, [pathname]);

  const results = useMemo(() => {
    if (!query) return FUNCTIONS.slice(0, 8);
    return searchFunctions(query);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === '/' && !open && (e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) setSelectedIndex(0);
  }, [query, open]);

  const handleSelect = (route: string) => {
    setOpen(false);
    setQuery('');
    setSelectedIndex(0);
    router.push(route);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs border border-zinc-200 rounded-full px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-500"
      >
        <span>🔍</span>
        <span className="hidden md:inline">Search function (Ctrl+K or /)</span>
        <span className="md:hidden">Search</span>
        <span className="ml-2 text-[10px] bg-zinc-100 border rounded px-1">⌘K</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)}></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl border w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b">
          <span className="text-zinc-400">🔍</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) handleSelect(results[selectedIndex].route);
              }
            }}
            placeholder="Search function: Create Purchase Order, Create Material, Goods Receipt, Document Flow... (helper: ME21N, MM01, MIGO also work)"
            className="flex-1 outline-none text-sm placeholder:text-zinc-400"
          />
          <button onClick={() => setOpen(false)} className="text-xs border rounded-full px-2 py-1">ESC</button>
        </div>

        <div className="max-h-80 overflow-auto p-2">
          <div className="text-[11px] text-zinc-500 px-3 py-2 uppercase tracking-widest">
            {query ? `${results.length} functions for "${query}" – function is the destination, code is just helper to identify` : 'All Functions – Search by function name like Create Purchase Order, Goods Receipt, Document Flow – helper codes like ME21N, MIGO also work'} 
          </div>
          
          {results.map((tc, idx) => {
            const modInfo = MODULE_CLASSIFICATION[tc.module];
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={tc.code}
                onClick={() => handleSelect(tc.route)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  isSelected
                    ? 'bg-zinc-900 text-white hover:bg-black hover:text-white'
                    : 'bg-white text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm ${isSelected ? 'bg-white/20 border-white/20 text-white' : modInfo.color + ' text-zinc-700'}`}>{modInfo.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Function is the destination, code is just helper – new intuitive primary, old alias secondary */}
                    <span className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-zinc-900'}`}>{tc.description}</span>
                    {SHOW_FUNCTION_CODE && (
                      <>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${isSelected ? 'bg-white text-black border-white' : 'bg-black text-white border-black'}`} title="New intuitive helper code – own IP, primary">↳ {tc.code}</span>
                        {tc.aliases && tc.aliases.length > 0 && (
                          <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${isSelected ? 'bg-white/10 border-white/20 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-400'}`} title={`Old codes kept as searchable alias: ${tc.aliases.join(', ')}`}>alias {tc.aliases.slice(0,2).join(', ')}</span>
                        )}
                      </>
                    )}
                  </div>
                  <div className={`text-xs mt-0.5 truncate ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {tc.module} • {tc.subModule} • {tc.type} • {tc.classicName}
                  </div>
                  {tc.keywords && (
                    <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-zinc-400' : 'text-zinc-400'}`}>
                      {tc.keywords.split(',').slice(0,2).join(', ')}
                    </div>
                  )}
                </div>
                <div className={`text-xs ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>→</div>
              </button>
            );
          })}

          {results.length === 0 && (
            <div className="p-8 text-center text-sm text-zinc-500">
              No functions found for "{query}"<br/>
              <span className="text-xs">Try function names like 'Create Purchase Order', 'Goods Receipt', 'Document Flow', 'Audit Log', 'Create Material' – helper codes like ME21N, MIGO, MM01, ALB also work for quick access</span>
            </div>
          )}
        </div>

        <div className="p-3 border-t bg-zinc-50 text-[11px] text-zinc-500 flex justify-between">
          <div className="flex gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Open function</span>
            <span>ESC Close</span>
          </div>
          <div>Function is destination • Code is helper • Press / or Ctrl+K</div>
        </div>
      </div>
    </div>
  );
}
