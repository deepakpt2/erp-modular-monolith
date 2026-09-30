"use client";
import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';

export interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'select' | 'autocomplete';
  options?: string[];
  apiUrl?: string;
  dataKey?: string;
  codeField?: string;
  createUrl?: string;
  createCode?: string;
  companyCode?: string;
  description?: string;
}

export interface SingleCodePageProps {
  code: string;
  sapAlias?: string;
  title: string;
  description: string;
  apiEndpoint: string;
  fields: FieldDef[];
  relatedLinks: { code: string; label: string; route: string; description: string; count?: number }[];
  initialForm: Record<string, any>;
}

export function SingleCodePage({ code, sapAlias, title, description, apiEndpoint, fields, relatedLinks, initialForm }: SingleCodePageProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const companyCode = params.companyCode as string;
  const modeParam = (searchParams.get('mode') || 'create').toLowerCase();
  // Per user: only 3 views needed – create, list, change – display is redundant, map display to list expanded
  const mode = modeParam === 'display' ? 'list' : modeParam; // display -> list
  const [uiMode, setUiMode] = useState<'modern'|'classic'>('modern');
  const [form, setForm] = useState<Record<string, any>>(initialForm);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [expandedItem, setExpandedItem] = useState<any | null>(null);
  const [listSearch, setListSearch] = useState('');
  const [changeSearch, setChangeSearch] = useState('');
  const [showListSuggestions, setShowListSuggestions] = useState(false);
  const [showChangeSuggestions, setShowChangeSuggestions] = useState(false);
  const listSearchRef = useRef<HTMLInputElement>(null);
  const changeSearchRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{
    try {
      const saved = localStorage.getItem('erp-ui-mode');
      if (saved) setUiMode(saved as any);
      const handler = (e:any)=>setUiMode(e.detail);
      window.addEventListener('erp-ui-mode-change', handler as any);
      return ()=>window.removeEventListener('erp-ui-mode-change', handler as any);
    } catch {}
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiEndpoint);
      const j = await res.json();
      const candidates = [
        j.data,
        j[code.toLowerCase()],
        j[code],
        j.companyGroups,
        j.legalEntities,
        j.facilities,
        j.materials,
        j.items,
        j.chartOfAccounts,
        j.glAccounts,
        j.charts,
        j.accounts,
        j.costCenters,
        j.profitCenters,
        j.companyCodes,
        j.plants,
        j.storageLocations,
        j.purchasingOrgs,
        j.uoms,
        j.currencies,
        j.taxCodes,
        j.customers,
        j.vendors,
        j.priceLists,
        j.warehouses,
        j.workCenters,
        j.routings,
        j.boms,
        j.productionOrders,
        j.salesOrders,
        j.purchaseOrders,
        j.inventory,
        j.stock,
        j.batches,
        j.roles,
        j.users,
        j.tenants,
        j.ledgers,
        j.documents,
        j.postingPeriods,
        j.numberRanges,
        j.toleranceGroups,
        j.autoAccounts,
        j.autoAccountDetermination,
        j.revenueAccounts,
        j.retainedEarnings,
        j.accountGroups,
        j.materialGroups,
        j.productGroups,
        j.salesOrgs,
        j.distributionChannels,
        j.divisions,
        j.shippingPoints,
        j.loadingPoints,
        j.transportationZones,
        j.routes,
        j.creditControlAreas,
        j.dunningAreas,
        j.fieldStatusVariants,
        j.postingKeys,
        j.documentTypes,
        j.paymentTerms,
        j.incoterms,
        j.outputTypes,
        j.pricingProcedures,
        j.conditionTypes,
      ];
      let data: any = null;
      for (const c of candidates) {
        if (Array.isArray(c) && c.length >= 0) {
          if (c.length > 0) { data = c; break; }
          if (!data) data = c;
        }
      }
      if (!data) {
        for (const k of Object.keys(j)) {
          if (Array.isArray(j[k]) && j[k].length > 0 && typeof j[k][0] === 'object') {
            if (k === 'erpDefaults') continue;
            data = j[k];
            break;
          }
        }
      }
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(()=>{ fetchItems(); }, [apiEndpoint]);

  useEffect(()=>{
    if (mode==='change' && selectedCode) {
      const found = items.find((it:any)=> (it.code||it.account_number||it.item_number) === selectedCode);
      if (found) {
        setForm({ ...initialForm, ...found });
      }
    }
    if (mode==='create') {
      setForm(initialForm);
    }
  }, [mode, selectedCode, items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      // Auto number from number ranges if item_number empty and code is material-related – SAP-like
      let payload: any = { ...form, company_code: companyCode };
      const needsAutoNumber = (code === 'EMTC' || apiEndpoint.includes('materials')) && !payload.item_number && !payload.code;
      if (needsAutoNumber) {
        try {
          // Try atomic next via /api/number-ranges/next?object_type=ITEM
          const nextRes = await fetch('/api/number-ranges/next?object_type=ITEM');
          const nextJson = await nextRes.json();
          if (nextJson.success && nextJson.document_number) {
            payload.item_number = nextJson.document_number;
            console.log(`Auto number atomic from ITEM range: ${payload.item_number}`);
          } else {
            // Fallback to fetching ranges list
            const nrRes = await fetch('/api/number-ranges');
            const nrJson = await nrRes.json();
            const ranges = nrJson.data || nrJson.numberRanges || [];
            const matRange = ranges.find((r:any)=> r.object_type === 'ITEM' || r.code?.includes('MAT') || r.code === 'MAT-01' || r.code === 'ITEM-01');
            if (matRange) {
              const nextNum = (matRange.current_number || matRange.from_number || 100000) + 1;
              const prefix = matRange.prefix || 'MAT-';
              payload.item_number = `${prefix}${nextNum}`;
              console.log(`Auto number from range ${matRange.code}: ${payload.item_number}`);
            }
          }
        } catch (nrErr) {
          console.warn('Number range auto failed:', nrErr);
        }
      }
      // Also support generic code auto-number if code field empty and api supports number ranges (e.g., PR, PO)
      if (!payload.code && (form as any).code === '' && code !== 'EMTC') {
        try {
          const objType = code.startsWith('P') ? 'PR' : code.startsWith('F') ? 'FI_DOC' : '';
          if (objType) {
            const nextRes = await fetch(`/api/number-ranges/next?object_type=${objType}`);
            const nextJson = await nextRes.json();
            if (nextJson.success) payload.code = nextJson.document_number;
          }
        } catch {}
      }

      const method = mode==='change' ? 'PUT' : 'POST';
      const res = await fetch(apiEndpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setMessage(`✅ ${title} ${payload.code || payload.item_number || payload.account_number} ${mode==='change'?'updated':'created'} – ${code}`);
      fetchItems();
      if (mode==='create') setForm(initialForm);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  const modern = uiMode==='modern';

  const renderField = (field: FieldDef) => {
    const value = form[field.key] || '';
    const isEmpty = !value;
    const borderColor = field.required && isEmpty ? 'border-yellow-300' : value ? 'border-green-400' : 'border-zinc-200';
    const inputPlaceholder = '';
    const selectPlaceholder = `Select ${field.label}`;
    
    if (field.type === 'autocomplete') {
      return (
        <DbAutocomplete
          key={field.key}
          label={`${field.label}${field.required?' *':''}`}
          apiUrl={field.apiUrl!}
          dataKey={field.dataKey!}
          codeField={field.codeField || 'code'}
          value={value}
          onChange={(v)=>setForm({ ...form, [field.key]: v })}
          placeholder={inputPlaceholder}
          required={field.required}
          createUrl={field.createUrl}
          createCode={field.createCode}
          companyCode={field.companyCode}
        />
      );
    }
    if (field.type === 'select' && field.options) {
      return (
        <div key={field.key} className="space-y-1">
          <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>{field.label}{field.required?' *':''}</label>
          <select value={value} onChange={e=>setForm({ ...form, [field.key]: e.target.value })} className={modern ? `w-full border-2 ${borderColor} rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10` : `w-full border px-2 py-1.5 text-xs`}>
            <option value="">{selectPlaceholder}</option>
            {field.options.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
          {field.description && <p className="text-[10px] text-zinc-400">{field.description}</p>}
        </div>
      );
    }
    if (field.type === 'textarea') {
      return (
        <div key={field.key} className="space-y-1">
          <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>{field.label}{field.required?' *':''}</label>
          <textarea value={value} onChange={e=>setForm({ ...form, [field.key]: e.target.value })} placeholder={inputPlaceholder} rows={3} className={modern ? `w-full border-2 ${borderColor} rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10` : `w-full border px-2 py-1.5 text-xs`} />
          {field.description && <p className="text-[10px] text-zinc-400">{field.description}</p>}
        </div>
      );
    }
    return (
      <div key={field.key} className="space-y-1">
        <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>{field.label}{field.required?' *':''}</label>
        <input value={value} onChange={e=>setForm({ ...form, [field.key]: e.target.value })} placeholder={inputPlaceholder} className={modern ? `w-full border-2 ${borderColor} rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10` : `w-full border px-2 py-1.5 text-xs`} />
        {field.description && <p className="text-[10px] text-zinc-400">{field.description}</p>}
      </div>
    );
  };

  // Filtered items for list and change based on search
  const filteredListItems = useMemo(()=>{
    if (!listSearch.trim()) return items;
    const q = listSearch.toLowerCase();
    return items.filter((it:any)=>{
      const codeVal = (it.code || it.account_number || it.item_number || '').toLowerCase();
      const nameVal = (it.name || it.description || it.legal_name || '').toLowerCase();
      return codeVal.includes(q) || nameVal.includes(q);
    });
  }, [items, listSearch]);

  const filteredChangeItems = useMemo(()=>{
    if (!changeSearch.trim()) return items.slice(0, 20); // Limit to 20 for performance when no search
    const q = changeSearch.toLowerCase();
    return items.filter((it:any)=>{
      const codeVal = (it.code || it.account_number || it.item_number || '').toLowerCase();
      const nameVal = (it.name || it.description || it.legal_name || '').toLowerCase();
      return codeVal.includes(q) || nameVal.includes(q);
    }).slice(0, 50); // Limit suggestions to 50
  }, [items, changeSearch]);

  const listSuggestions = useMemo(()=>{
    if (!listSearch.trim() || listSearch.length < 2) return [];
    const q = listSearch.toLowerCase();
    return items.filter((it:any)=>{
      const codeVal = (it.code || it.account_number || it.item_number || '').toLowerCase();
      const nameVal = (it.name || it.description || it.legal_name || '').toLowerCase();
      return codeVal.includes(q) || nameVal.includes(q);
    }).slice(0, 8);
  }, [items, listSearch]);

  return (
    <div className={modern ? "min-h-screen bg-[#fafaf9] p-6" : "min-h-screen bg-white p-4"}>
      <div className={modern ? "max-w-[1000px] mx-auto space-y-6" : "max-w-[900px] mx-auto space-y-4"}>
        {/* Header */}
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border-b pb-3"}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={modern ? "text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-black text-white" : "text-[10px] font-mono border px-2 py-0.5 bg-black text-white"}>{code}</span>
              {sapAlias && <span className={modern ? "text-[10px] font-mono px-2 py-1 rounded-full bg-zinc-100 border text-zinc-500" : "text-[9px] font-mono border px-1 bg-zinc-50"}>{sapAlias}</span>}
              <span className={modern ? "text-[11px] bg-zinc-100 border rounded-full px-2.5 py-1 text-zinc-600" : "text-[10px] border px-2 py-0.5"}>{items.length} records</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${companyCode}/navigator`} className={modern ? "px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50" : "border px-2 py-1 text-xs"}>🌳 Navigator</Link>
              <Link href={`/${companyCode}/foundation/enterprise-structure`} className={modern ? "px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50" : "border px-2 py-1 text-xs"}>Hub</Link>
            </div>
          </div>
          <h1 className={modern ? "text-xl font-bold mt-3 tracking-tight" : "text-lg font-bold mt-2"}>{title}</h1>
          <p className="text-sm text-zinc-500 mt-1">{description} – Company: <b>{companyCode}</b> – Strict ERP usage, no dummy – data used in transactions</p>
          
          {/* Mode Tabs – only 3: create, list, change – per user request display redundant */}
          <div className={modern ? "flex items-center gap-1 mt-4 bg-zinc-100 rounded-full p-1 w-fit" : "flex items-center gap-1 mt-3 border-b"}>
            {['create','list','change'].map(m=>{
              const isActive = mode===m;
              const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
              const finalHref = `${currentPath}?mode=${m}`;
              return (
                <Link key={m} href={finalHref} className={modern ? `px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isActive?'bg-black text-white':'hover:bg-white text-zinc-600'}` : `px-3 py-1 text-xs border-b-2 ${isActive?'border-black font-bold':'border-transparent text-zinc-500'}`}>
                  {m.charAt(0).toUpperCase()+m.slice(1)} {m==='list' ? `(${items.length})` : ''}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mode: List – with search suggestions and filter + expanded view */}
        {mode==='list' ? (
          <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-4" : "border p-3 space-y-3"}>
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <h3 className={modern ? "font-semibold text-sm" : "font-semibold text-xs"}>List – {filteredListItems.length} of {items.length} records</h3>
              <div className="relative w-full sm:w-[320px]">
                <input
                  ref={listSearchRef}
                  value={listSearch}
                  onChange={e=>{ setListSearch(e.target.value); setShowListSuggestions(true); }}
                  onFocus={()=>setShowListSuggestions(true)}
                  onBlur={()=>setTimeout(()=>setShowListSuggestions(false), 200)}
                  placeholder={`Search ${code}...`}
                  className={modern ? "w-full border-2 border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10" : "w-full border px-2 py-1.5 text-xs"}
                />
                {showListSuggestions && listSuggestions.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-lg border border-zinc-200 z-10 max-h-[200px] overflow-auto">
                    {listSuggestions.map((it:any, i:number)=>(
                      <button key={i} onMouseDown={()=>{ setListSearch(it.code||it.item_number||''); setShowListSuggestions(false); setExpandedItem(it); }} className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 flex items-center gap-2">
                        <span className="font-mono font-bold">{it.code || it.item_number}</span>
                        <span className="truncate">{it.name || it.description || ''}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {loading ? <p className="text-sm text-zinc-500">Loading…</p> : (
              <>
                <div className="overflow-auto">
                  <table className={modern ? "w-full text-sm" : "w-full text-xs"}>
                    <thead className={modern ? "text-[11px] text-zinc-500 border-b" : "text-[10px] text-zinc-500 border-b"}>
                      <tr><th className="text-left py-2">Code</th><th className="text-left py-2">Name</th><th className="text-left py-2">Details</th><th className="text-left py-2">Action</th></tr>
                    </thead>
                    <tbody>
                      {filteredListItems.map((it:any, i:number)=>(
                        <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer" onClick={()=>setExpandedItem(it)}>
                          <td className="py-2 font-mono text-xs">{it.code || it.account_number || it.item_number}</td>
                          <td className="py-2">{it.name || it.description || it.legal_name || ''}</td>
                          <td className="py-2 text-[11px] text-zinc-500 truncate max-w-[200px]">{Object.keys(it).slice(0,5).map(k=>`${k}:${String(it[k]).slice(0,20)}`).join(' ')}</td>
                          <td className="py-2"><span className="text-[11px] text-blue-600 hover:underline">View</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Expanded view – not editable, with link to edit */}
                {expandedItem && (
                  <div className={modern ? "mt-4 p-5 bg-zinc-50 rounded-2xl border border-zinc-200" : "mt-3 p-3 bg-zinc-50 border"}>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-sm">Expanded View – {expandedItem.code || expandedItem.item_number} – Not Editable</h4>
                      <div className="flex gap-2">
                        <Link href={`${typeof window !== 'undefined' ? window.location.pathname : ''}?mode=change`} onClick={()=>setSelectedCode(expandedItem.code || expandedItem.item_number)} className={modern ? "px-3 py-1 rounded-full bg-black text-white text-xs" : "border px-2 py-1 text-xs bg-black text-white"}>✏️ Edit – Go to Change</Link>
                        <button onClick={()=>setExpandedItem(null)} className={modern ? "px-3 py-1 rounded-full border text-xs" : "border px-2 py-1 text-xs"}>Close</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {Object.entries(expandedItem).map(([k,v])=>(
                        <div key={k} className="flex gap-2 border-b border-zinc-100 py-1">
                          <span className="font-medium text-zinc-600 min-w-[120px]">{k}:</span>
                          <span className="truncate">{String(v ?? '').slice(0,100)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : mode==='change' ? (
          <div className="space-y-4">
            {/* Selector for change – search with suggestions and filter, not full dropdown */}
            <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-5 space-y-3" : "border p-3 space-y-3"}>
              <label className={modern ? "text-xs font-medium" : "text-[11px] font-medium"}>Search {title} to Change – type to filter (not full dropdown – handles hundreds)</label>
              <div className="relative">
                <input
                  ref={changeSearchRef}
                  value={changeSearch}
                  onChange={e=>{ setChangeSearch(e.target.value); setShowChangeSuggestions(true); }}
                  onFocus={()=>setShowChangeSuggestions(true)}
                  onBlur={()=>setTimeout(()=>setShowChangeSuggestions(false), 200)}
                  placeholder={`Search ${code} – e.g., type code or name...`}
                  className={modern ? "w-full border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10" : "w-full border px-2 py-1.5 text-xs"}
                />
                {showChangeSuggestions && filteredChangeItems.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-lg border border-zinc-200 z-10 max-h-[300px] overflow-auto">
                    {filteredChangeItems.map((it:any, i:number)=>(
                      <button key={i} onMouseDown={()=>{ setSelectedCode(it.code||it.account_number||it.item_number||''); setChangeSearch(it.code||it.item_number||''); setShowChangeSuggestions(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 flex items-center gap-2">
                        <span className="font-mono font-bold text-[10px] bg-black text-white rounded px-1">{it.code||it.item_number}</span>
                        <span className="truncate flex-1">{it.name||it.description||''}</span>
                        <span className="text-[10px] text-zinc-400">{it.type||it.account_type||''}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedCode && <div className="text-[11px] text-zinc-500">Selected: <b>{selectedCode}</b> – <button onClick={()=>setSelectedCode('')} className="text-blue-600 hover:underline">Clear</button></div>}
            </div>
            {selectedCode && (
              <form onSubmit={handleSubmit} className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-4" : "border p-3 space-y-3"}>
                <h3 className={modern ? "font-semibold text-sm" : "font-semibold text-xs"}>Change {title} – {selectedCode}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map(renderField)}
                </div>
                <button type="submit" className={modern ? "px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-zinc-800" : "border px-4 py-1.5 text-xs bg-black text-white"}>Save {title}</button>
                {message && <div className={modern ? "text-xs p-3 rounded-xl border bg-zinc-50" : "text-[11px] border p-2"}>{message}</div>}
              </form>
            )}
            {!selectedCode && (
              <div className={modern ? "bg-zinc-50 rounded-2xl border border-zinc-200 p-6 text-center" : "border p-4 text-center bg-zinc-50"}>
                <p className="text-sm text-zinc-500">Type in search above to find {code} – shows suggestions (max 50) – handles hundreds of materials without full dropdown – per user request</p>
              </div>
            )}
          </div>
        ) : (
          /* Create mode – single form with auto number option */
          <form onSubmit={handleSubmit} className={modern ? "bg-white rounded-2xl shadow-lg border border-zinc-200 p-6 space-y-5" : "border p-4 space-y-3 bg-white"}>
            <div className="flex items-center justify-between">
              <h3 className={modern ? "font-semibold text-sm" : "font-semibold text-xs"}>Create {title} – {code}</h3>
              <div className="flex items-center gap-2">
                <span className={modern ? "text-[11px] text-zinc-400" : "text-[10px] text-zinc-400"}>Fields with * required – yellow empty, green valid</span>
                {(code === 'EMTC' || apiEndpoint.includes('materials')) && (
                  <span className="text-[10px] bg-blue-50 border border-blue-200 rounded-full px-2 py-1">Auto number from MAT-01 if blank – SAP-like</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(renderField)}
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className={modern ? "px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-zinc-800 shadow" : "border px-4 py-1.5 text-xs bg-black text-white"}>Create {title}</button>
              <span className="text-[11px] text-zinc-400">Code in heading badge – button short – auto number uses number range FNRC if enabled</span>
            </div>
            {message && <div className={modern ? "text-xs p-3 rounded-xl border bg-zinc-50 mt-3" : "text-[11px] border p-2"}>{message}</div>}
          </form>
        )}

        {/* Related Masters – low importance bottom */}
        <div className={modern ? "bg-zinc-50 rounded-2xl border border-zinc-200 p-4" : "border p-3 bg-zinc-50"}>
          <h4 className={modern ? "text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2" : "text-[10px] uppercase text-zinc-500 mb-1"}>Related Masters – auto from dependencies – low importance</h4>
          <div className="flex flex-wrap gap-2">
            {relatedLinks.map((link, i)=>(
              <Link key={i} href={`/${companyCode}${link.route}`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}>
                <span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">{link.code}</span>
                <span>{link.label}</span>
                <span className="text-zinc-400">→</span>
              </Link>
            ))}
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">These links help create necessary data needed in this form – e.g., if this form needs Company Group, create via ECGC first – data strictly used in practice</p>
        </div>

        {/* Existing records table – quick overview */}
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-5" : "border p-3"}>
          <h4 className={modern ? "font-medium text-sm mb-3" : "font-medium text-xs mb-2"}>Existing {title} – {items.length} (quick)</h4>
          {loading ? <p className="text-xs text-zinc-500">Loading…</p> : (
            <div className="overflow-auto max-h-[200px]">
              <table className="w-full text-xs">
                <thead className="text-[10px] text-zinc-500 border-b"><tr><th className="text-left py-1">Code</th><th className="text-left py-1">Name</th></tr></thead>
                <tbody>
                  {items.slice(0,10).map((it:any, i:number)=><tr key={i} className="border-b border-zinc-50"><td className="py-1 font-mono">{it.code||it.account_number||it.item_number}</td><td className="py-1">{it.name||it.description||''}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
