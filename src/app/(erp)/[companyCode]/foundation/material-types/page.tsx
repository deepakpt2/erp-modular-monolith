"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function MaterialTypesPage(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState<string|null>(null);
  const [form,setForm]=useState({code:'',name:'',description:''});
  const [showForm,setShowForm]=useState(false);

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/material-types').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  const handleCreate = async () => {
    if(!form.code||!form.name){ setMsg('Code and name required'); return; }
    const res = await fetch('/api/material-types',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ Product Type ${res.productType?.code || res.materialType.code} created – EMTP (alias ${res.aliasCodes || 'MTP, OMS2'}) – legal-safe ${res.mapping || ''}`); setShowForm(false); setForm({code:'',name:'',description:''}); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  const handleDelete = async (code:string) => {
    if(!confirm(`Delete product type ${code}?`)) return;
    const res = await fetch(`/api/material-types?code=${code}`,{method:'DELETE'}).then(r=>r.json());
    setMsg(res.success?`✅ ${res.message}`:`❌ ${res.error}`);
    load();
  };

  if(loading) return <div className="p-6">Loading product types EMTP...</div>;
  const types = data?.materialTypes||data?.productTypes||[];
  const inUse = data?.distinctInUse||[];
  const primaryCode = data?.code || 'EMTP';
  const aliasCodes = data?.aliasCodes || ['MTP','OMS2','FND-MT-CR'];

  return (
    <ModernModuleShell
      title={`Product Types – ${primaryCode} (alias ${aliasCodes.join(', ')})`}
      subtitle={`${types.length} Product Types – legal-safe own IP – fresh empty but sample types kept for convenience`}
      code={primaryCode}
      module="FOUNDATION"
      tooltip={`EMTP Define Product Types – Legal-safe own IP (was OMS2) – Configurable product types: RAW (was ROH) Raw, SEMI (was HALB) Semi-Finished, FINISHED (was FERT) Finished, TRADING (was HAWA) Trading, PACKAGING (was VERP) Packaging, CONSUMABLE (was NLAG) Non-Stock, SERVICE (was DIEN) Service – each type controls valuation, pricing method, account determination. New primary EMTP alias MTP/OMS2/FND-MT-CR – 4-char MOOA: E=Enterprise, MT=Material Type? Actually MP=Material Product, TY=Type? We use EMTP – E=Enterprise, MT=Material Type, P=Profile? For simplicity EMTP = Enterprise Material Type Profile. Mapping ROH->RAW, FERT->FINISHED, HALB->SEMI, S->STANDARD, V->MOVING_AVG. Code EMTP primary, OMS2 secondary muted.`}
    >
      <div className="max-w-[1600px] mx-auto p-6 space-y-4">
        {msg && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm">{msg}</div>}

        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">Product Types – {types.length} – <span className="font-mono bg-black text-white px-2 py-0.5 rounded-full text-xs">↳ {primaryCode}</span> <span className="text-zinc-400 text-xs">alias {aliasCodes.join(', ')}</span></h3>
            <div className="text-xs text-zinc-500 mt-1">Legal-safe: RAW/FINISHED/SEMI/TRADING/PACKAGING/CONSUMABLE/SERVICE (was ROH/FERT/HALB/HAWA/VERP/NLAG/DIEN) – mapping kept for backward search</div>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setShowForm(!showForm)} className="text-xs bg-black text-white rounded-full px-3 py-1.5">+ Create – {primaryCode}</button>
            <button onClick={load} className="text-xs border rounded-full px-3 py-1.5 bg-white">Refresh</button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white border rounded-2xl p-5 space-y-3">
            <div className="grid md:grid-cols-3 gap-3">
              <div><label className="text-xs text-zinc-500">Code * e.g., RAW (alias ROH) – legal-safe</label><input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} placeholder="RAW – legal-safe, old ROH also accepted" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-zinc-500">Name *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Raw Material" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-zinc-500">Description</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Raw materials purchased – legal-safe" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
            </div>
            <div className="text-[11px] text-zinc-500">Legal-safe codes: RAW (was ROH), FINISHED (was FERT), SEMI (was HALB), TRADING (was HAWA), PACKAGING (was VERP), CONSUMABLE (was NLAG), SERVICE (was DIEN) – old codes mapped automatically</div>
            <button onClick={handleCreate} className="bg-black text-white rounded-full px-4 py-2 text-xs">Create – {primaryCode}</button>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {types.map((t:any)=>(
            <div key={t.code} className="bg-white border rounded-xl p-4">
              <div className="flex justify-between"><span className="font-medium"><span className="font-mono bg-zinc-900 text-white px-2 py-0.5 rounded-full text-xs mr-1">{t.code}</span> {t.name}</span><span className={`text-xs rounded-full px-2 py-0.5 border ${t.is_active?'bg-green-50 border-green-200':'bg-red-50 border-red-200'}`}>{t.is_active?'Active':'Inactive'}</span></div>
              <div className="text-xs text-zinc-500 mt-1">{t.description}</div>
              <div className="text-[11px] text-zinc-400 mt-1">In use: {inUse.find((u:any)=>u.code===t.code || (u.code==='ROH' && t.code==='RAW') || (u.code==='FERT' && t.code==='FINISHED') || (u.code==='HALB' && t.code==='SEMI'))?.count||0} items</div>
              <div className="text-[10px] text-zinc-400 mt-1">Alias: {t.code==='RAW'?'ROH':t.code==='FINISHED'?'FERT':t.code==='SEMI'?'HALB':t.code==='TRADING'?'HAWA':t.code==='PACKAGING'?'VERP':t.code==='CONSUMABLE'?'NLAG':t.code==='SERVICE'?'DIEN':''} – old SAP-like code for search</div>
              <button onClick={()=>handleDelete(t.code)} className="mt-2 text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button>
            </div>
          ))}
        </div>

        <div className="bg-zinc-50 border rounded-xl p-4 text-xs">
          <div className="font-medium">Module 2 – Product Catalog – Legal-Safe Mapping</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div>ROH → RAW – Raw Material</div>
            <div>FERT → FINISHED – Finished Goods</div>
            <div>HALB → SEMI – Semi-Finished</div>
            <div>HAWA → TRADING – Trading Goods</div>
            <div>VERP → PACKAGING – Packaging</div>
            <div>NLAG → CONSUMABLE – Non-Stock</div>
            <div>DIEN → SERVICE – Service</div>
            <div>S → STANDARD – Standard Price</div>
            <div>V → MOVING_AVG – Moving Average</div>
            <div>PD → MRP – MRP Type</div>
            <div>EX → LOT_FOR_LOT – Lot Size</div>
            <div>F → BUY – Procurement Type External</div>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500">New primary code EMTP (E=Enterprise, MT=Material Type, P=Profile) – 4-char MOOA same length as OX02 – alias MTP/OMS2/FND-MT-CR kept for backward search – both_exact search – exact first, partial then – helper codes kept as-is and auto-generate when new functions implemented.</div>
        </div>
      </div>
    </ModernModuleShell>
  );
}
