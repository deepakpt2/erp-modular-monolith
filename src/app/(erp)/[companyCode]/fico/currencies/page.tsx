"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function CurrenciesPage(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState<string|null>(null);
  const [form,setForm]=useState({code:'',name:'',decimal_places:'2',symbol:''});
  const [showForm,setShowForm]=useState(false);

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/currencies').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  const handleCreate = async () => {
    if(!(form as any).code||!(form as any).name){ setMsg('CODE and NAME required'); return; }
    const res = await fetch('/api/currencies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form, decimal_places: parseInt(form.decimal_places)})}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${res.currency.code} CREATED`); setShowForm(false); setForm({code:'',name:'',decimal_places:'2',symbol:''}); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  if(loading) return <div className="p-6">Loading...</div>;
  const currencies = data?.currencies||[];

  const modernContent = (
    <div className="space-y-6">
      {msg && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm">{msg}</div>}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Currencies <span className="ml-2 text-xs font-mono bg-zinc-100 border rounded-full px-2 py-0.5">{currencies.length} FCYC</span></h3>
        <div className="flex gap-2">
          <button onClick={()=>setShowForm(!showForm)} className="text-xs bg-zinc-900 text-white rounded-full px-4 py-2 hover:bg-black">+ Create FCYC</button>
          <button onClick={load} className="text-xs border border-zinc-200 rounded-full px-4 py-2 bg-white">Refresh</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="text-xs font-medium text-zinc-600">CODE</label><input value={(form as any).code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm uppercase focus:ring-2 focus:ring-black focus:outline-none" /></div>
            <div><label className="text-xs font-medium text-zinc-600">NAME</label><input value={(form as any).name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-black focus:outline-none" /></div>
            <div><label className="text-xs font-medium text-zinc-600">DECIMAL_PLACES</label><input value={form.decimal_places} onChange={e=>setForm({...form,decimal_places:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm" /></div>
            <div><label className="text-xs font-medium text-zinc-600">SYMBOL</label><input value={form.symbol} onChange={e=>setForm({...form,symbol:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm" /></div>
          </div>
          <button onClick={handleCreate} className="bg-zinc-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-black">Create FCYC</button>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        {currencies.map((c:any)=>(
          <div key={c.code} className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="font-mono font-bold bg-zinc-900 text-white rounded-full px-2.5 py-1 text-xs inline-block">{c.code}</div>
            <div className="mt-3 font-medium text-sm">{c.name}</div>
            <div className="text-xs text-zinc-500 mt-1">DECIMAL_PLACES {c.decimal_places} SYMBOL {c.symbol}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const classicContent = (
    <div className="font-mono text-[11px] space-y-2">
      <div className="font-bold border-b border-black pb-1">FCYC CURRENCY_CREATE {currencies.length} API: POST /api/currencies {`{code, name, decimal_places, symbol}`}</div>
      <div className="grid grid-cols-4 gap-2">
        <div><div className="text-[10px] text-zinc-500">CODE</div><input value={(form as any).code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
        <div><div className="text-[10px] text-zinc-500">NAME</div><input value={(form as any).name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
        <div><div className="text-[10px] text-zinc-500">DECIMAL_PLACES</div><input value={form.decimal_places} onChange={e=>setForm({...form,decimal_places:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
        <div><div className="text-[10px] text-zinc-500">SYMBOL</div><input value={form.symbol} onChange={e=>setForm({...form,symbol:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
      </div>
      <button onClick={handleCreate} className="bg-black text-white px-3 py-1 w-full">CREATE FCYC</button>
    </div>
  );

  return (
    <ModernModuleShell title="Currencies" subtitle={`${currencies.length} CURRENCIES`} code="FCYC" module="FICO" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
