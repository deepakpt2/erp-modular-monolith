"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function PostingPeriodPage(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState<string|null>(null);
  const [form,setForm]=useState({code:'',name:''});
  const [showForm,setShowForm]=useState(false);

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/posting-period-variants').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  const handleCreate = async () => {
    if(!(form as any).code||!form.name){ setMsg('CODE and NAME required'); return; }
    const res = await fetch('/api/posting-period-variants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ Posting Period Variant ${res.variant.code} created – OBBO/OB52`); setShowForm(false); setForm({code:'',name:''}); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  const handleDelete = async (code:string) => {
    if(!confirm(`Delete posting period variant ${code}?`)) return;
    const res = await fetch(`/api/posting-period-variants?code=${code}`,{method:'DELETE'}).then(r=>r.json());
    setMsg(res.success?`✅ ${res.message}`:`❌ ${res.error}`);
    if(res.success) load();
  };

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;
  const variants = data?.postingPeriodVariants||[];
  const periods = data?.postingPeriods||[];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">OBBO POSTING_PERIOD_VARIANT_CREATE {variants.length} API: POST /api/posting-period-variants {`{code, name}`}</div>
        <div className="grid grid-cols-2 gap-2">
          <div><div className="text-[9px]">CODE</div><input value={(form as any).code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="CODE" /></div>
          <div><div className="text-[9px]">NAME</div><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="NAME" /></div>
        </div>
        <button onClick={handleCreate} className="mt-2 bg-black text-white px-3 py-1 w-full">CREATE OBBO</button>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">VARIANTS OBBO {variants.length}</div>
          {variants.map((v:any)=>(<div key={v.code} className="border border-black p-1 mt-1 flex justify-between"><span>{v.code} – {v.name}</span><button onClick={()=>handleDelete(v.code)} className="border border-black px-1 text-red-600">DEL</button></div>))}
        </div>
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">PERIODS OB52 {periods.length}</div>
          {periods.map((p:any)=>(<div key={p.id} className="border border-black p-1 mt-1">{p.variant_code} – TYPE {p.account_type} – {p.from_period}/{p.from_year} → {p.to_period}/{p.to_year}</div>))}
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}

      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Posting Period Variants OBBO – {variants.length} • Periods OB52 – {periods.length}</h3>
        <div className="flex gap-2">
          <button onClick={()=>setShowForm(!showForm)} className="text-xs bg-zinc-900 hover:bg-black text-white rounded-full px-4 py-2 transition-colors">+ Create Variant OBBO</button>
          <button onClick={load} className="text-xs border border-zinc-200 bg-white hover:bg-zinc-50 rounded-full px-4 py-2 transition-colors">Refresh</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">📅</div>
            <div><div className="font-semibold">Create Variant – OBBO</div><div className="text-xs text-zinc-500">CODE, NAME</div></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">CODE</label><input value={(form as any).code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} placeholder="CODE" className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black uppercase" /></div>
            <div><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">NAME</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="NAME" className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" /></div>
          </div>
          <button onClick={handleCreate} className="bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-2.5 text-sm font-medium transition-colors">Create Variant – OBBO</button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <h4 className="font-semibold text-sm">Variants OBBO – {variants.length}</h4>
          <div className="mt-4 space-y-2">
            {variants.map((v:any)=>(
              <div key={v.code} className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50 flex justify-between items-center hover:border-zinc-900 transition-colors">
                <div><div className="font-medium text-sm">{v.code} – {v.name}</div><div className="text-xs text-zinc-500">OBBO Variant</div></div>
                <button onClick={()=>handleDelete(v.code)} className="text-xs border border-red-200 text-red-600 hover:bg-red-50 rounded-full px-3 py-1 bg-white transition-colors">Delete</button>
              </div>
            ))}
            {variants.length===0 && <div className="text-sm text-zinc-500 border border-dashed rounded-xl p-6 text-center">No variants – Create first via OBBO</div>}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <h4 className="font-semibold text-sm">Open/Close Periods OB52 – {periods.length}</h4>
          <div className="mt-4 space-y-2 max-h-[400px] overflow-auto">
            {periods.map((p:any)=>(
              <div key={p.id} className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50 flex justify-between text-xs hover:border-zinc-300 transition-colors"><span>{p.variant_code} – TYPE {p.account_type} – {p.from_period}/{p.from_year} → {p.to_period}/{p.to_year}</span></div>
            ))}
            {periods.length===0 && <div className="text-sm text-zinc-500 border border-dashed rounded-xl p-6 text-center">No periods – Fresh deployment</div>}
          </div>
          <div className="text-[11px] text-zinc-500 mt-3 bg-zinc-50 rounded-xl p-3">OB52 Open and Close Posting Periods – Account Types + (All), A Assets, D Customers, K Vendors, M Materials, S G/L – Real DB</div>
        </div>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Posting Period Variant – OBBO/OB52" subtitle={`${variants.length} Variants • ${periods.length} Periods • OBBO/OB52/OBBP`} code="OBBO" module="FICO" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
