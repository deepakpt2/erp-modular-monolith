"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function UomPage(){
  const params = useParams();
  const companyCode = params.companyCode as string;
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

  const handleDelete = async (code:string) => {
    if(!confirm(`DELETE ${code}?`)) return;
    const res = await fetch(`/api/uom?code=${code}`,{method:'DELETE'}).then(r=>r.json());
    setMsg(res.success?`✅ ${res.message}`:`❌ ${res.error || res.message}`);
    load();
  };

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;
  const uoms = data?.uoms||[];
  const primaryCode = data?.code || 'EUOC';

  return (
    <ModernModuleShell
      title={`Units of Measure`}
      subtitle={`${uoms.length} UOMS`}
      code={primaryCode}
      module="FOUNDATION"
    >
      <div className="max-w-[1600px] mx-auto p-0 space-y-3">
        {msg && <div className="bg-black text-white font-mono text-xs p-2">{msg}</div>}

        <div className="flex justify-between items-center">
          <div className="font-mono text-[11px] font-bold">EUOC UOM_CREATE CUNI {uoms.length}</div>
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
              <div><div className="text-[10px] text-zinc-500">DIMENSION</div><select value={form.dimension} onChange={e=>setForm({...form,dimension:e.target.value})} className="w-full border border-black px-1 py-1 text-xs"><option>QUANTITY</option><option>WEIGHT</option><option>VOLUME</option><option>LENGTH</option><option>TIME</option></select></div>
              <div><div className="text-[10px] text-zinc-500">BASE_UOM_CODE</div><input value={form.base_uom_code} onChange={e=>setForm({...form,base_uom_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 text-xs uppercase" /></div>
              <div><div className="text-[10px] text-zinc-500">DECIMAL_PLACES</div><input value={form.decimal_places} onChange={e=>setForm({...form,decimal_places:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
            </div>
            <button onClick={handleCreate} className="bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE EUOC</button>
          </div>
        )}

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-2">
          {uoms.map((u:any)=>(
            <div key={u.code} className="bg-white border border-black p-2 font-mono text-[11px]">
              <div className="flex justify-between"><span className="font-bold">{u.code} | {u.name}</span><span className="text-[10px] border border-black px-1">{u.is_active?'ACTIVE':'INACTIVE'}</span></div>
              <div className="text-[10px] text-zinc-600 mt-1">DIMENSION={u.dimension} BASE_UOM_CODE={u.base_uom_code||''} DECIMAL_PLACES={u.decimal_places||0}</div>
              <button onClick={()=>handleDelete(u.code)} className="mt-1 border border-red-600 text-red-600 px-1 text-[10px]">DEL</button>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
