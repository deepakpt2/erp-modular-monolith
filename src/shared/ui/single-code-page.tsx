"use client";
import React, { useEffect, useState } from 'react';
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
  code: string; // ECGC
  sapAlias?: string; // OX16
  title: string; // Company Group
  description: string; // Define Company Group
  apiEndpoint: string; // /api/company-groups
  fields: FieldDef[];
  relatedLinks: { code: string; label: string; route: string; description: string; count?: number }[];
  initialForm: Record<string, any>;
}

export function SingleCodePage({ code, sapAlias, title, description, apiEndpoint, fields, relatedLinks, initialForm }: SingleCodePageProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const companyCode = params.companyCode as string;
  const mode = (searchParams.get('mode') || 'create').toLowerCase(); // create/change/display/list
  const [uiMode, setUiMode] = useState<'modern'|'classic'>('modern');
  const [form, setForm] = useState<Record<string, any>>(initialForm);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string>('');

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
      // Robust – handle many API shapes: data, chartOfAccounts, glAccounts, companyGroups, etc.
      const candidates = [
        j.data,
        j[code.toLowerCase()],
        j[code], // exact code
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
          // Prefer non-empty, but accept empty if nothing else
          if (c.length > 0) { data = c; break; }
          if (!data) data = c;
        }
      }
      // Fallback – find first array value in response object
      if (!data) {
        for (const k of Object.keys(j)) {
          if (Array.isArray(j[k]) && j[k].length > 0 && typeof j[k][0] === 'object') {
            // Skip erpDefaults which is sample, not actual data
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
    if ((mode==='change' || mode==='display') && selectedCode) {
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
      const method = mode==='change' ? 'PUT' : 'POST';
      const res = await fetch(apiEndpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, company_code: companyCode }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setMessage(`✅ ${title} ${form.code} ${mode==='change'?'updated':'created'} – ${code}`);
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
    // Per user rule: if form has formlabel, dont use placeholder, if label not present, label should be placeholder, never sample value
    // Fix double entry in dropdown: placeholder should NOT be same as actual option – use empty + Select {label}, not sample like K4, CA-IN-01, false
    const inputPlaceholder = ''; // No placeholder when label exists – per rule – never sample value
    const selectPlaceholder = `Select ${field.label}`; // Distinct – prevents double entry
    
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
          
          {/* Mode Tabs */}
          <div className={modern ? "flex items-center gap-1 mt-4 bg-zinc-100 rounded-full p-1 w-fit" : "flex items-center gap-1 mt-3 border-b"}>
            {['create','change','display','list'].map(m=>{
              const isActive = mode===m;
              const href = `/${companyCode}/${apiEndpoint.includes('company-groups')?'foundation/company-groups': apiEndpoint.includes('legal-entities')?'foundation/legal-entities': apiEndpoint.includes('facilities')?'foundation/facilities': apiEndpoint.includes('materials')?'foundation/materials': apiEndpoint.includes('fiscal-calendars')?'fico/fiscal-calendars': apiEndpoint.includes('exchange-rates')?'fico/exchange-rates': apiEndpoint.includes('number-ranges')?'fico/number-ranges': apiEndpoint.includes('tax-groups')?'fico/tax-groups': apiEndpoint.includes('tax-codes')?'fico/tax-codes': apiEndpoint.includes('chart-of-accounts')?'fico/chart-of-accounts': apiEndpoint.includes('gl-accounts')?'fico/gl-accounts': apiEndpoint.includes('cost-centers')?'fico/cost-centers': apiEndpoint.includes('currencies')?'fico/currencies': apiEndpoint.includes('posting-period-variants')?'fico/posting-period-variants': apiEndpoint.includes('posting-periods')?'fico/posting-periods': ''}?mode=${m}`;
              // For generic, use current path with mode
              const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
              const finalHref = `${currentPath}?mode=${m}`;
              return (
                <Link key={m} href={finalHref} className={modern ? `px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isActive?'bg-black text-white':'hover:bg-white text-zinc-600'}` : `px-3 py-1 text-xs border-b-2 ${isActive?'border-black font-bold':'border-transparent text-zinc-500'}`}>
                  {m.charAt(0).toUpperCase()+m.slice(1)}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mode: List */}
        {mode==='list' ? (
          <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border p-3"}>
            <h3 className={modern ? "font-semibold text-sm mb-3" : "font-semibold text-xs mb-2"}>List – {items.length} records</h3>
            {loading ? <p className="text-sm text-zinc-500">Loading…</p> : (
              <div className="overflow-auto">
                <table className={modern ? "w-full text-sm" : "w-full text-xs"}>
                  <thead className={modern ? "text-[11px] text-zinc-500 border-b" : "text-[10px] text-zinc-500 border-b"}>
                    <tr><th className="text-left py-2">Code</th><th className="text-left py-2">Name</th><th className="text-left py-2">Details</th></tr>
                  </thead>
                  <tbody>
                    {items.map((it:any, i:number)=>(
                      <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="py-2 font-mono text-xs">{it.code || it.account_number || it.item_number}</td>
                        <td className="py-2">{it.name || it.description || it.legal_name || ''}</td>
                        <td className="py-2 text-[11px] text-zinc-500 truncate max-w-[300px]">{JSON.stringify(it).slice(0,120)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : mode==='change' || mode==='display' ? (
          <div className="space-y-4">
            {/* Selector for change/display */}
            <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-5" : "border p-3"}>
              <label className={modern ? "text-xs font-medium" : "text-[11px] font-medium"}>Select {title} to {mode}</label>
              <select value={selectedCode} onChange={e=>setSelectedCode(e.target.value)} className={modern ? "mt-2 w-full border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm" : "mt-1 w-full border px-2 py-1.5 text-xs"}>
                <option value="">Select {code}</option>
                {items.map((it:any)=><option key={it.code||it.account_number||it.item_number} value={it.code||it.account_number||it.item_number}>{it.code||it.account_number||it.item_number} – {it.name||it.description||''}</option>)}
              </select>
            </div>
            {selectedCode && (
              <form onSubmit={handleSubmit} className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-4" : "border p-3 space-y-3"}>
                <h3 className={modern ? "font-semibold text-sm" : "font-semibold text-xs"}>{mode==='change'?'Change':'Display'} {title} – {selectedCode}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map(renderField)}
                </div>
                {mode==='change' && (
                  <button type="submit" className={modern ? "px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-zinc-800" : "border px-4 py-1.5 text-xs bg-black text-white"}>Save {title}</button>
                )}
                {message && <div className={modern ? "text-xs p-3 rounded-xl border bg-zinc-50" : "text-[11px] border p-2"}>{message}</div>}
              </form>
            )}
          </div>
        ) : (
          /* Create mode – single form */
          <form onSubmit={handleSubmit} className={modern ? "bg-white rounded-2xl shadow-lg border border-zinc-200 p-6 space-y-5" : "border p-4 space-y-3 bg-white"}>
            <div className="flex items-center justify-between">
              <h3 className={modern ? "font-semibold text-sm" : "font-semibold text-xs"}>Create {title} – {code}</h3>
              <span className={modern ? "text-[11px] text-zinc-400" : "text-[10px] text-zinc-400"}>Fields with * required – border yellow empty, green valid</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(renderField)}
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className={modern ? "px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-zinc-800 shadow" : "border px-4 py-1.5 text-xs bg-black text-white"}>Create {title}</button>
              <span className="text-[11px] text-zinc-400">Code in heading badge – button short</span>
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

        {/* Existing records table */}
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-5" : "border p-3"}>
          <h4 className={modern ? "font-medium text-sm mb-3" : "font-medium text-xs mb-2"}>Existing {title} – {items.length}</h4>
          {loading ? <p className="text-xs text-zinc-500">Loading…</p> : (
            <div className="overflow-auto max-h-[300px]">
              <table className="w-full text-xs">
                <thead className="text-[10px] text-zinc-500 border-b"><tr><th className="text-left py-1">Code</th><th className="text-left py-1">Name</th></tr></thead>
                <tbody>
                  {items.slice(0,20).map((it:any, i:number)=><tr key={i} className="border-b border-zinc-50"><td className="py-1 font-mono">{it.code||it.account_number||it.item_number}</td><td className="py-1">{it.name||it.description||''}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
