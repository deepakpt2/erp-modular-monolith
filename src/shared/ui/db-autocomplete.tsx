"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

interface DbAutocompleteProps {
  label: string; // e.g., FISCAL_CALENDAR_CODE
  value: string;
  onChange: (val: string) => void;
  apiUrl: string; // e.g., /api/fiscal-calendars
  dataKey?: string; // key in response that contains array, e.g., data, fiscalCalendars, currencies
  codeField?: string; // field to use as code, default 'code'
  nameField?: string; // field to show as name, default 'name'
  placeholder?: string;
  required?: boolean;
  createUrl?: string; // url to create new if not found, e.g., /1000/fico/posting-period?focus=FFYC
  createCode?: string; // code for creating new, e.g., FFYC
  companyCode?: string; // for filtering
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
        // Try various keys
        let data: any[] = [];
        if (Array.isArray(res)) data = res;
        else if (res.data && Array.isArray(res.data)) data = res.data;
        else if (dataKey && res[dataKey] && Array.isArray(res[dataKey])) data = res[dataKey];
        else if (res.fiscalCalendars) data = res.fiscalCalendars;
        else if (res.currencies) data = res.currencies;
        else if (res.companyGroups) data = res.companyGroups;
        else if (res.data && Array.isArray(res.data)) data = res.data;
        else if (res.items) data = res.items;
        else {
          // fallback: find first array in response
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

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <label className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
        {loading && <span className="text-[9px] text-zinc-400">(loading...)</span>}
        {!loading && <span className="text-[9px] text-zinc-400">({items.length} in DB)</span>}
      </label>
      <div className="relative mt-1">
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
          className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black uppercase pr-8 ${!exactMatch && inputValue ? 'border-amber-300 bg-amber-50/50' : 'border-zinc-200'}`}
        />
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black text-xs"
        >
          ▼
        </button>
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-zinc-200 rounded-xl shadow-lg max-h-[200px] overflow-auto">
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
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-900 hover:text-white flex justify-between items-center ${isSelected ? 'bg-zinc-900 text-white' : ''}`}
                >
                  <span className="font-mono font-bold">{code}</span>
                  <span className="text-[11px] truncate ml-2 opacity-70">{name}</span>
                </button>
              );
            })
          ) : (
            <div className="p-3 text-xs text-zinc-500 text-center">No matching {label} found</div>
          )}

          {!exactMatch && inputValue && (
            <div className="border-t border-zinc-100 p-2 bg-amber-50/50">
              <div className="text-[11px] text-amber-800 mb-1">"{inputValue}" not in DB – invalid will be rejected</div>
              {createUrl && (
                <Link
                  href={createUrl}
                  className="text-[11px] bg-black text-white rounded-full px-3 py-1 inline-flex items-center gap-1 hover:bg-zinc-800"
                  onClick={() => setShowDropdown(false)}
                >
                  + Create {inputValue} via {createCode || 'form'} ↗
                </Link>
              )}
              {!createUrl && (
                <div className="text-[10px] text-zinc-500">Create it first in {createCode || label} master</div>
              )}
            </div>
          )}

          <div className="border-t border-zinc-100 p-2 bg-zinc-50 text-[10px] text-zinc-400">
            {items.length} values from DB • Type to filter • Select to use
          </div>
        </div>
      )}

      {!exactMatch && inputValue && (
        <div className="mt-1 text-[10px] text-amber-600">⚠️ {label} "{inputValue}" not found in DB – will be rejected on save</div>
      )}
      {exactMatch && inputValue && (
        <div className="mt-1 text-[10px] text-emerald-600">✓ {label} "{inputValue}" valid – found in DB</div>
      )}
    </div>
  );
}
