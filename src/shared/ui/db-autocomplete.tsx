"use client";
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

interface DbAutocompleteProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  apiUrl: string;
  dataKey?: string;
  codeField?: string;
  nameField?: string;
  placeholder?: string;
  required?: boolean;
  createUrl?: string;
  createCode?: string;
  companyCode?: string;
  className?: string;
}

export function DbAutocomplete({
  label,
  value,
  onChange,
  apiUrl,
  dataKey,
  codeField = 'code',
  nameField = 'name',
  placeholder,
  required,
  createUrl,
  createCode,
  companyCode,
  className = '',
}: DbAutocompleteProps) {
  const [items, setItems] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 240 });
  const [mounted, setMounted] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const updatePosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 240)
      });
    }
  };

  useEffect(() => {
    if (showDropdown) {
      updatePosition();
      const handleScrollOrResize = () => {
        updatePosition();
      };
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [showDropdown]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let url = apiUrl;
        if (companyCode) {
          url += apiUrl.includes('?') ? `&companyCode=${companyCode}` : `?companyCode=${companyCode}`;
        }
        const res = await fetch(url).then(r => r.json()).catch(() => ({ data: [] }));
        let data: any[] = [];
        if (Array.isArray(res)) data = res;
        else if (res.data && Array.isArray(res.data)) data = res.data;
        else if (dataKey && res[dataKey] && Array.isArray(res[dataKey])) data = res[dataKey];
        else if (dataKey && res.data && res.data[dataKey] && Array.isArray(res.data[dataKey])) data = res.data[dataKey];
        else if (res.controlAreas) data = res.controlAreas;
        else if (res.legalEntities) data = res.legalEntities;
        else if (res.fiscalCalendars) data = res.fiscalCalendars;
        else if (res.currencies) data = res.currencies;
        else if (res.companyGroups) data = res.companyGroups;
        else if (res.items) data = res.items;
        else if (res.purchasing_orgs) data = res.purchasing_orgs;
        else if (res.data && res.data.purchasing_orgs) data = res.data.purchasing_orgs;
        else if (res.data && typeof res.data === 'object') {
          const nestedArray = Object.values(res.data).find(v => Array.isArray(v));
          if (nestedArray) data = nestedArray as any[];
          else {
            for (const v of Object.values(res.data)) {
              if (v && typeof v === 'object') {
                const inner = Object.values(v as any).find(x => Array.isArray(x));
                if (inner) { data = inner as any[]; break; }
              }
            }
          }
        }
        else {
          const firstArray = Object.values(res).find(v => Array.isArray(v));
          if (firstArray) data = firstArray as any[];
          else {
            for (const v of Object.values(res)) {
              if (v && typeof v === 'object') {
                const inner = Object.values(v as any).find(x => Array.isArray(x));
                if (inner) { data = inner as any[]; break; }
              }
            }
          }
        }
        setItems(data);
        setFiltered(data);
      } catch (e) {
        console.error(`Failed to fetch ${apiUrl}`, e);
      }
      setLoading(false);
    }
    fetchData();
  }, [apiUrl, dataKey, companyCode]);

  useEffect(() => {
    if (!inputValue) {
      setFiltered(items);
    } else {
      const lower = inputValue.toLowerCase();
      const f = items.filter(it => {
        const code = (it[codeField] || '').toString().toLowerCase();
        const name = (it[nameField] || '').toString().toLowerCase();
        return code.includes(lower) || name.includes(lower);
      });
      setFiltered(f);
    }
  }, [inputValue, items, codeField, nameField]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        wrapperRef.current && !wrapperRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exactMatch = items.some(it => (it[codeField] || '').toString().toUpperCase() === inputValue.toUpperCase());
  const isEmpty = !inputValue || inputValue.trim() === '';
  const isInvalid = !isEmpty && !exactMatch;

  let borderClass = 'border-zinc-200 bg-white focus:border-black focus:ring-1 focus:ring-black';
  if (isEmpty && required) {
    borderClass = 'border-zinc-300 bg-zinc-50 focus:border-black focus:ring-1 focus:ring-black';
  } else if (isInvalid) {
    borderClass = 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-1 focus:ring-red-200';
  } else if (exactMatch && !isEmpty) {
    borderClass = 'border-zinc-900 bg-white focus:border-black focus:ring-1 focus:ring-black';
  }

  const codeBadge = createCode || label.split('_')[0] || 'FORM';

  const dropdownMenu = showDropdown && mounted ? (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: `${dropdownPosition.top + 4}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        zIndex: 99999,
      }}
      className="bg-white border border-zinc-200 rounded-xl shadow-2xl max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-100"
    >
      {filtered.length > 0 ? (
        filtered.map((it, idx) => {
          const code = it[codeField] || '';
          const name = it[nameField] || '';
          const isSelected = code.toUpperCase() === inputValue.toUpperCase();
          return (
            <button
              key={`${code}-${idx}`}
              type="button"
              onClick={() => {
                setInputValue(code.toUpperCase());
                onChange(code.toUpperCase());
                setShowDropdown(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-zinc-900 hover:text-white flex justify-between items-center transition-colors border-b border-zinc-100 last:border-b-0 ${isSelected ? 'bg-zinc-900 text-white font-medium' : 'bg-white text-zinc-800'}`}
            >
              <span className="font-mono font-bold text-xs">{code}</span>
              <span className="text-xs truncate ml-2 opacity-80">{name}</span>
            </button>
          );
        })
      ) : (
        <div className="p-3.5 text-center">
          <div className="text-xs text-zinc-600 font-medium">Use {createCode || codeBadge} to add new {label.replace(' *','')}</div>
          <div className="text-[0.7rem] text-zinc-400 mt-1">No existing {label.replace(' *','')} matches "{inputValue}"</div>
          {createUrl && (
            <Link
              href={createUrl}
              className="mt-2 inline-flex text-xs bg-black text-white rounded-full px-3 py-1 items-center gap-1 hover:bg-zinc-800"
              onClick={() => setShowDropdown(false)}
            >
              + Create via {createCode || codeBadge} ↗
            </Link>
          )}
        </div>
      )}

      {isInvalid && (
        <div className="border-t border-zinc-200 p-2.5 bg-zinc-50">
          <div className="text-xs text-zinc-700 font-medium">Invalid – "{inputValue}" not found</div>
          <div className="text-[0.7rem] text-zinc-500 mt-0.5">Will be rejected – use {createCode || codeBadge} to add new</div>
          {createUrl && (
            <Link
              href={createUrl}
              className="mt-1.5 inline-flex text-xs bg-black text-white rounded-full px-3 py-1 items-center gap-1 hover:bg-zinc-800"
              onClick={() => setShowDropdown(false)}
            >
              + Add "{inputValue}" via {createCode || codeBadge} ↗
            </Link>
          )}
        </div>
      )}

      <div className="border-t border-zinc-100 p-2 bg-zinc-50 text-[0.65rem] text-zinc-400 flex justify-between uppercase tracking-wider">
        <span>{items.length} in DB • {filtered.length} filtered</span>
        <span className="font-mono">{codeBadge}</span>
      </div>
    </div>
  ) : null;

  return (
    <div ref={wrapperRef} className={`relative space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-medium tracking-wider flex items-center gap-1.5 uppercase">
          <span className="text-zinc-600">{label}</span>
          {required && <span className="text-red-500 font-bold">*</span>}
          <span className="text-[0.65rem] font-mono bg-zinc-900 text-white rounded-full px-1.5 py-0.5">{codeBadge}</span>
          {loading && <span className="text-[0.65rem] text-zinc-400 font-normal normal-case">loading</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          value={inputValue}
          onChange={e => {
            const v = e.target.value.toUpperCase();
            setInputValue(v);
            onChange(v);
            setShowDropdown(true);
            updatePosition();
          }}
          onFocus={() => {
            updatePosition();
            setShowDropdown(true);
          }}
          placeholder={placeholder || ''}
          className={`w-full border rounded-lg px-3 py-2 text-sm leading-relaxed focus:outline-none uppercase pr-8 transition-all placeholder:text-zinc-400 min-h-[2.5rem] ${borderClass}`}
        />
        <button
          type="button"
          onClick={() => {
            updatePosition();
            setShowDropdown(!showDropdown);
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black text-xs w-5 h-5 flex items-center justify-center"
        >
          ▼
        </button>
      </div>

      {mounted && typeof document !== 'undefined' && dropdownMenu ? createPortal(dropdownMenu, document.body) : null}
    </div>
  );
}
