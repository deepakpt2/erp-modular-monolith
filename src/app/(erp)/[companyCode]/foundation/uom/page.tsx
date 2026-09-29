"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function UomPage(){
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState<string|null>(null);
  const [form,setForm]=useState({code:'',name:'',dimension:'QUANTITY', base_uom_code:'', decimal_places:'0'});
  const [showForm,setShowForm]=useState(false);

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/uom').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  const handleCreate = async () => {
    if(!form.code||!form.name){ setMsg('CODE and NAME required'); return; }
    const res = await fetch('/api/uom',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${res.uom.code} CREATED`); setShowForm(false); setForm({code:'',name:'',dimension:'QUANTITY', base_uom_code:'', decimal_places:'0'}); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  if(loading) return <div className="p-6">Loading...</div>;
  const uoms = data?.uoms||[];
  const primaryCode = data?.code || 'EUOC';

  const modernContent = (
    <div className="space-y-6">
      {msg && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm">{msg}</div>}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Units of Measure <span className="ml-2 text-xs font-mono bg-zinc-100 border rounded-full px-2 py-0.5">{uoms.length} {primaryCode}</span></h3>
        <div className="flex gap-2">
          <button onClick={()=>setShowForm(!showForm)} className="text-xs bg-zinc-900 text-white rounded-full px-4 py-2 hover:bg-black">+ Create {primaryCode}</button>
          <button onClick={load} className="text-xs border rounded-full px-4 py-2 bg-white">Refresh</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div><label className="text-xs font-medium text-zinc-600">CODE</label><input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm uppercase focus:ring-2 focus:ring-black focus:outline-none" /></div>
            <div><label className="text-xs font-medium text-zinc-600">NAME</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-black focus:outline-none" /></div>
            <div><label className="text-xs font-medium text-zinc-600">DIMENSION</label><select value={form.dimension} onChange={e=>setForm({...form,dimension:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm"><option>QUANTITY</option><option>WEIGHT</option><option>VOLUME</option><option>LENGTH</option><option>TIME</option></select></div>
            <div><label className="text-xs font-medium text-zinc-600">BASE_UOM_CODE</label><input value={form.base_uom_code} onChange={e=>setForm({...form,base_uom_code:e.target.value.toUpperCase()})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm uppercase" /></div>
            <div><label className="text-xs font-medium text-zinc-600">DECIMAL_PLACES</label><input value={form.decimal_places} onChange={e=>setForm({...form,decimal_places:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm" /></div>
          </div>
          <button onClick={handleCreate} className="bg-zinc-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-black">Create {primaryCode}</button>
        </div>
      )}

      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
        {uoms.map((u:any)=>(
          <div key={u.code} className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between"><span className="font-mono font-bold bg-zinc-900 text-white rounded-full px-2.5 py-1 text-xs">{u.code}</span><span className="text-[10px] border rounded-full px-2 py-1">{u.is_active?'ACTIVE':'INACTIVE'}</span></div>
            <div className="mt-3 font-medium text-sm">{u.name}</div>
            <div className="text-xs text-zinc-500 mt-1">DIMENSION {u.dimension}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const classicContent = (
    <div className="font-mono text-[11px] space-y-2">
      <div className="font-bold border-b border-black pb-1">EUOC UOM_CREATE {uoms.length} API: POST /api/uom {`{code, name, dimension, base_uom_code, decimal_places}`}</div>
      <div className="grid grid-cols-3 gap-2">
        <div><div className="text-[10px] text-zinc-500">CODE</div><input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
        <div><div className="text-[10px] text-zinc-500">NAME</div><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
        <div><div className="text-[10px] text-zinc-500">DIMENSION</div><select value={form.dimension} onChange={e=>setForm({...form,dimension:e.target.value})} className="w-full border border-black px-1 py-1 text-xs"><option>QUANTITY</option><option>WEIGHT</option><option>VOLUME</option></select></div>
      </div>
      <button onClick={handleCreate} className="bg-black text-white px-3 py-1 w-full">CREATE EUOC</button>
    </div>
  );

  return (
    <ModernModuleShell title="Units of Measure" subtitle={`${uoms.length} UOMS`} code={primaryCode} module="FOUNDATION" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
