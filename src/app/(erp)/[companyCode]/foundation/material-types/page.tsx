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
    if(!form.code||!form.name){ setMsg('CODE and NAME required'); return; }
    const res = await fetch('/api/material-types',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${res.productType?.code || res.materialType.code} CREATED`); setShowForm(false); setForm({code:'',name:'',description:''}); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  const handleDelete = async (code:string) => {
    if(!confirm(`DELETE ${code}?`)) return;
    const res = await fetch(`/api/material-types?code=${code}`,{method:'DELETE'}).then(r=>r.json());
    setMsg(res.success?`✅ ${res.message}`:`❌ ${res.error}`);
    load();
  };

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;
  const types = data?.materialTypes||data?.productTypes||[];
  const primaryCode = data?.code || 'EMTP';

  return (
    <ModernModuleShell
      title={`Product Types`}
      subtitle={`${types.length} PRODUCT_TYPES`}
      code={primaryCode}
      module="FOUNDATION"
    >
      <div className="max-w-[1600px] mx-auto p-0 space-y-3">
        {msg && <div className="bg-black text-white font-mono text-xs p-2">{msg}</div>}

        <div className="flex justify-between items-center">
          <div className="font-mono text-[11px] font-bold">EMTP PRODUCT_TYPE_CREATE OMS2 {types.length}</div>
          <div className="flex gap-1">
            <button onClick={()=>setShowForm(!showForm)} className="text-[11px] font-mono bg-black text-white border border-black px-3 py-1">CREATE</button>
            <button onClick={load} className="text-[11px] font-mono border border-black px-3 py-1 bg-white">REFRESH</button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white border border-black p-3 space-y-2">
            <div className="grid md:grid-cols-3 gap-2 font-mono text-[11px]">
              <div><div className="text-[10px] text-zinc-500">CODE</div><input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 text-xs uppercase" /></div>
              <div><div className="text-[10px] text-zinc-500">NAME</div><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
            </div>
            <button onClick={handleCreate} className="bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE EMTP</button>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
          {types.map((t:any)=>(
            <div key={t.code} className="bg-white border border-black p-2 font-mono text-[11px]">
              <div className="flex justify-between"><span className="font-bold">{t.code} | {t.name}</span><span className="text-[10px] border border-black px-1">{t.is_active?'ACTIVE':'INACTIVE'}</span></div>
              <div className="text-[10px] text-zinc-600 mt-1">DESCRIPTION={t.description}</div>
              <button onClick={()=>handleDelete(t.code)} className="mt-1 border border-red-600 text-red-600 px-1 text-[10px]">DEL</button>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
