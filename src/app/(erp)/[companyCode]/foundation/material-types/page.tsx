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
    if(!(form as any).code||!(form as any).name){ setMsg('CODE and NAME required'); return; }
    const res = await fetch('/api/material-types',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${res.productType?.code || res.materialType.code} CREATED`); setShowForm(false); setForm({code:'',name:'',description:''}); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  if(loading) return <div className="p-6">Loading...</div>;
  const types = data?.materialTypes||data?.productTypes||[];
  const primaryCode = data?.code || 'EMTP';

  const modernContent = (
    <div className="space-y-6">
      {msg && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm">{msg}</div>}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Product Types <span className="ml-2 text-xs font-mono bg-zinc-100 border rounded-full px-2 py-0.5">{types.length} {primaryCode}</span></h3>
        <div className="flex gap-2">
          <button onClick={()=>setShowForm(!showForm)} className="text-xs bg-zinc-900 text-white rounded-full px-4 py-2 hover:bg-black transition-colors">Create {primaryCode}</button>
          <button onClick={load} className="text-xs border border-zinc-200 rounded-full px-4 py-2 bg-white hover:bg-zinc-50">Refresh</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div><label className="text-xs font-medium text-zinc-600">CODE</label><input value={(form as any).code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black uppercase" /></div>
            <div><label className="text-xs font-medium text-zinc-600">NAME</label><input value={(form as any).name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" /></div>
            <div><label className="text-xs font-medium text-zinc-600">DESCRIPTION</label><input value={(form as any).description} onChange={e=>setForm({...form,description:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" /></div>
          </div>
          <button onClick={handleCreate} className="bg-zinc-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-black transition-colors">Create {primaryCode}</button>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {types.map((t:any)=>(
          <div key={t.code} className="group bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start"><div className="font-medium"><span className="font-mono bg-zinc-900 text-white px-2.5 py-1 rounded-full text-xs mr-2">{t.code}</span>{t.name}</div><span className={`text-[10px] rounded-full px-2 py-1 border ${t.is_active?'bg-green-50 border-green-200 text-green-700':'bg-red-50'}`}>{t.is_active?'ACTIVE':'INACTIVE'}</span></div>
            <div className="text-xs text-zinc-500 mt-2">{t.description}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const classicContent = (
    <div className="font-mono text-[11px] space-y-2">
      <div className="font-bold border-b border-black pb-1">EMTP PRODUCT_TYPE_CREATE {types.length} API: POST /api/material-types {`{code, name, description}`}</div>
      <div className="grid grid-cols-3 gap-2">
        <div><div className="text-[10px] text-zinc-500">CODE</div><input value={(form as any).code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
        <div><div className="text-[10px] text-zinc-500">NAME</div><input value={(form as any).name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
        <div><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={(form as any).description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
      </div>
      <button onClick={handleCreate} className="bg-black text-white px-3 py-1 w-full">CREATE</button>
      <div className="space-y-1">{types.map((t:any)=><div key={t.code} className="border border-black p-1"><span className="font-bold">{t.code} | {t.name}</span> DESCRIPTION={t.description}</div>)}</div>
    </div>
  );

  return (
    <ModernModuleShell title="Product Types" subtitle={`${types.length} PRODUCT_TYPES`} code={primaryCode} module="FOUNDATION" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
