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
    if(!form.code||!form.name){ setMsg('Code and name required'); return; }
    const res = await fetch('/api/currencies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form, decimal_places: parseInt(form.decimal_places)})}).then(r=>r.json());
    if(res.success){ setMsg(`✅ Currency ${res.currency.code} created – OY03 – Only INR default, ${res.currency.code} added by user`); setShowForm(false); setForm({code:'',name:'',decimal_places:'2',symbol:''}); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  const handleDelete = async (code:string) => {
    if(!confirm(`Delete currency ${code}?`)) return;
    const res = await fetch(`/api/currencies?code=${code}`,{method:'DELETE'}).then(r=>r.json());
    setMsg(res.success?`✅ ${res.message}`:`❌ ${res.error}`);
    load();
  };

  if(loading) return <div className="p-6">Loading currencies OY03...</div>;
  const currencies = data?.currencies||[];

  return (
    <ModernModuleShell
      title="Currencies – OY03"
      subtitle={`${currencies.length} Currencies`}
      code="OY03"
      module="FICO"
      tooltip={`OY03 Define Currencies – Only INR default per requirement, all other currencies like KWD must be added by user via POST /api/currencies. Configurable.`}
    >
      <div className="max-w-[1600px] mx-auto p-6 space-y-4">
        {msg && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm">{msg}</div>}

        <div className="flex justify-between items-center">
          <h3 className="font-medium">Currencies – {currencies.length}</h3>
          <div className="flex gap-2">
            <button onClick={()=>setShowForm(!showForm)} className="text-xs bg-black text-white rounded-full px-3 py-1.5">+ Create</button>
            <button onClick={load} className="text-xs border rounded-full px-3 py-1.5 bg-white">Refresh</button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white border rounded-2xl p-5 space-y-3">
            <div className="grid md:grid-cols-4 gap-3">
              <div><label className="text-xs text-zinc-500">Code * e.g., KWD</label><input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} placeholder="KWD" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-zinc-500">Name *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Kuwaiti Dinar" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-zinc-500">Decimals</label><input type="number" value={form.decimal_places} onChange={e=>setForm({...form,decimal_places:e.target.value})} placeholder="2" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-zinc-500">Symbol</label><input value={form.symbol} onChange={e=>setForm({...form,symbol:e.target.value})} placeholder="KD" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
            </div>
            <button onClick={handleCreate} className="bg-black text-white rounded-full px-4 py-2 text-xs">Create</button>
          </div>
        )}

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
          {currencies.map((c:any)=>(
            <div key={c.code} className={`border rounded-xl p-4 ${c.code==='INR'?'bg-green-50 border-green-200':'bg-white'}`}>
              <div className="flex justify-between"><span className="font-medium">{c.code} – {c.name} {c.symbol}</span><span className={`text-xs rounded-full px-2 py-0.5 border ${c.is_active?'bg-green-50 border-green-200':'bg-red-50'}`}>{c.is_active?'Active':'Inactive'}</span></div>
              <div className="text-xs text-zinc-500 mt-1">Decimals: {c.decimal_places} • {c.symbol||''}</div>
              <button onClick={()=>handleDelete(c.code)} className="mt-2 text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
