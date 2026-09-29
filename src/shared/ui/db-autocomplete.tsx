"use client";
import React, { useEffect, useState, useRef } from 'react';
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
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

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
        else if (res.fiscalCalendars) data = res.fiscalCalendars;
        else if (res.currencies) data = res.currencies;
        else if (res.companyGroups) data = res.companyGroups;
        else if (res.items) data = res.items;
        else {
          const firstArray = Object.values(res).find(v => Array.isArray(v));
          if (firstArray) data = firstArray as any[];
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
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exactMatch = items.some(it => (it[codeField] || '').toString().toUpperCase() === inputValue.toUpperCase());
  const isEmpty = !inputValue || inputValue.trim() === '';
  const isInvalid = !isEmpty && !exactMatch;

  // Border color logic: green valid, red invalid, yellow required empty, default zinc
  let borderClass = 'border-zinc-200 bg-white';
  if (isEmpty && required) {
    borderClass = 'border-amber-300 bg-amber-50/30 focus:border-amber-400 focus:ring-amber-200';
  } else if (isInvalid) {
    borderClass = 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-200';
  } else if (exactMatch && !isEmpty) {
    borderClass = 'border-emerald-400 bg-emerald-50/20 focus:border-emerald-500 focus:ring-emerald-200';
  }

  // Label badge shows createCode instead of count
  const codeBadge = createCode || label.split('_')[0] || 'FORM';

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <label className="text-[11px] font-medium tracking-widest flex items-center gap-1.5">
        <span className="text-zinc-700 uppercase">{label}</span>
        {required && <span className="text-red-500">*</span>}
        <span className="text-[9px] font-mono bg-zinc-900 text-white rounded-full px-1.5 py-0.5">{codeBadge}</span>
        {loading && <span className="text-[9px] text-zinc-400 font-normal">loading</span>}
      </label>
      <div className="relative mt-1.5">
        <input
          value={inputValue}
          onChange={e => {
            const v = e.target.value.toUpperCase();
            setInputValue(v);
            onChange(v);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder || label}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 uppercase pr-8 transition-colors ${borderClass}`}
        />
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black text-[10px]"
        >
          ▼
        </button>
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-zinc-200 rounded-xl shadow-xl max-h-[220px] overflow-auto">
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
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-900 hover:text-white flex justify-between items-center transition-colors ${isSelected ? 'bg-zinc-900 text-white' : 'bg-white'}`}
                >
                  <span className="font-mono font-bold">{code}</span>
                  <span className="text-[11px] truncate ml-2 opacity-70">{name}</span>
                </button>
              );
            })
          ) : (
            <div className="p-3 text-center">
              <div className="text-xs text-zinc-600 font-medium">Use {createCode || codeBadge} to add new {label.replace(' *','')}</div>
              <div className="text-[11px] text-zinc-400 mt-1">No existing {label.replace(' *','')} matches "{inputValue}"</div>
              {createUrl && (
                <Link
                  href={createUrl}
                  className="mt-2 inline-flex text-[11px] bg-black text-white rounded-full px-3 py-1.5 items-center gap-1 hover:bg-zinc-800"
                  onClick={() => setShowDropdown(false)}
                >
                  + Create via {createCode || codeBadge} ↗
                </Link>
              )}
            </div>
          )}

          {isInvalid && (
            <div className="border-t border-red-100 p-2.5 bg-red-50/80">
              <div className="text-[11px] text-red-700 font-medium">Invalid – "{inputValue}" not found in DB</div>
              <div className="text-[10px] text-red-600/80 mt-0.5">Will be rejected on save – use {createCode || codeBadge} to add new {label.replace(' *','')}</div>
              {createUrl && (
                <Link
                  href={createUrl}
                  className="mt-1.5 inline-flex text-[11px] bg-red-600 text-white rounded-full px-3 py-1 items-center gap-1 hover:bg-red-700"
                  onClick={() => setShowDropdown(false)}
                >
                  + Add "{inputValue}" via {createCode || codeBadge} ↗
                </Link>
              )}
            </div>
          )}

          <div className="border-t border-zinc-100 p-2 bg-zinc-50 text-[10px] text-zinc-400 flex justify-between">
            <span>{items.length} in DB • {filtered.length} filtered</span>
            <span className="font-mono">{codeBadge}</span>
          </div>
        </div>
      )}
    </div>
  );
}
