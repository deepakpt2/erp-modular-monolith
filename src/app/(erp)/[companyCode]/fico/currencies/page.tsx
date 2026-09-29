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
  const [form,setForm]=useState({code:'',name:'',decimal_places:'2',symbol:'', is_active:'true'});
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
    if(!form.code||!form.name){ setMsg('CODE and NAME required'); return; }
    const res = await fetch('/api/currencies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form, decimal_places: parseInt(form.decimal_places)})}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${res.currency.code} CREATED`); setShowForm(false); setForm({code:'',name:'',decimal_places:'2',symbol:'', is_active:'true'}); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;
  const currencies = data?.currencies||[];

  return (
    <ModernModuleShell title="Currencies" subtitle={`${currencies.length} CURRENCIES`} code="FCYC" module="FICO">
      <div className="max-w-[1600px] mx-auto p-0 space-y-3">
        {msg && <div className="bg-black text-white font-mono text-xs p-2">{msg}</div>}
        <div className="flex justify-between items-center">
          <div className="font-mono text-[11px] font-bold">FCYC CURRENCY_CREATE OY03 {currencies.length} API: POST /api/currencies {`{code, name, decimal_places, symbol}`}</div>
          <div className="flex gap-1">
            <button onClick={()=>setShowForm(!showForm)} className="text-[11px] font-mono bg-black text-white border border-black px-3 py-1">CREATE</button>
            <button onClick={load} className="text-[11px] font-mono border border-black px-3 py-1 bg-white">REFRESH</button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white border border-black p-3 space-y-2">
            <div className="grid md:grid-cols-4 gap-2 font-mono text-[11px]">
              <div><div className="text-[10px] text-zinc-500">CODE</div><input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">NAME</div><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">DECIMAL_PLACES</div><input value={form.decimal_places} onChange={e=>setForm({...form,decimal_places:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">SYMBOL</div><input value={form.symbol} onChange={e=>setForm({...form,symbol:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
            </div>
            <button onClick={handleCreate} className="bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE FCYC</button>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-2">
          {currencies.map((c:any)=>(
            <div key={c.code} className="bg-white border border-black p-2 font-mono text-[11px]">
              <div className="font-bold">{c.code} | {c.name} | SYMBOL={c.symbol} DECIMAL_PLACES={c.decimal_places}</div>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
