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
    if(res.success){ setMsg(`✅ Material Type ${res.materialType.code} created – OMS2`); setShowForm(false); setForm({code:'',name:'',description:''}); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  const handleDelete = async (code:string) => {
    if(!confirm(`Delete material type ${code}?`)) return;
    const res = await fetch(`/api/material-types?code=${code}`,{method:'DELETE'}).then(r=>r.json());
    setMsg(res.success?`✅ ${res.message}`:`❌ ${res.error}`);
    load();
  };

  if(loading) return <div className="p-6">Loading material types OMS2...</div>;
  const types = data?.materialTypes||[];
  const inUse = data?.distinctInUse||[];

  return (
    <ModernModuleShell
      title="Material Types – OMS2"
      subtitle={`${types.length} Material Types`}
      code="OMS2"
      module="FOUNDATION"
      tooltip={`OMS2 Define Material Types – ERP OMS2 – Configurable material types: ROH Raw, HALB Semi-Finished, FERT Finished, HAWA Trading, VERP Packaging, NLAG Non-Stock, DIEN Service – each type controls valuation, price control, account determination. Code OMS2.`}
    >
      <div className="max-w-[1600px] mx-auto p-6 space-y-4">
        {msg && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm">{msg}</div>}

        <div className="flex justify-between items-center">
          <h3 className="font-medium">Material Types – {types.length}</h3>
          <div className="flex gap-2">
            <button onClick={()=>setShowForm(!showForm)} className="text-xs bg-black text-white rounded-full px-3 py-1.5">+ Create</button>
            <button onClick={load} className="text-xs border rounded-full px-3 py-1.5 bg-white">Refresh</button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white border rounded-2xl p-5 space-y-3">
            <div className="grid md:grid-cols-3 gap-3">
              <div><label className="text-xs text-zinc-500">Code * e.g., HAWA</label><input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} placeholder="ROH" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-zinc-500">Name *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Raw Material" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-zinc-500">Description</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Raw materials purchased" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
            </div>
            <button onClick={handleCreate} className="bg-black text-white rounded-full px-4 py-2 text-xs">Create</button>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {types.map((t:any)=>(
            <div key={t.code} className="bg-white border rounded-xl p-4">
              <div className="flex justify-between"><span className="font-medium">{t.code} – {t.name}</span><span className={`text-xs rounded-full px-2 py-0.5 border ${t.is_active?'bg-green-50 border-green-200':'bg-red-50 border-red-200'}`}>{t.is_active?'Active':'Inactive'}</span></div>
              <div className="text-xs text-zinc-500 mt-1">{t.description}</div>
              <div className="text-[11px] text-zinc-400 mt-1">In use: {inUse.find((u:any)=>u.code===t.code)?.count||0} materials</div>
              <button onClick={()=>handleDelete(t.code)} className="mt-2 text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button>
            </div>
          ))}
        </div>


      </div>
    </ModernModuleShell>
  );
}
