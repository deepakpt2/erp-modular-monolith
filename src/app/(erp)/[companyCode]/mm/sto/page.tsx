"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function STOPage() {
  const params = useParams();
  const companyCode = (params?.companyCode as string) || '1000';
  const [stos, setStos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ supplying_plant_code: '', receiving_plant_code: '', material_code: '', quantity: '', uom_code: 'KG' });

  async function load(){
    setLoading(true);
    try{
      const res = await fetch(`/api/sto?limit=200&search=${encodeURIComponent(search)}`).then(r=>r.json());
      setStos(res.stos || []);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[companyCode]);
  useEffect(()=>{const t=setTimeout(load,300);return()=>clearTimeout(t);},[search]);

  const handleCreate = async ()=>{
    if(!form.supplying_plant_code || !form.material_code){ setMsg('SUPPLYING_PLANT_CODE and MATERIAL_CODE required'); return; }
    const res = await fetch('/api/sto',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${res.stoNumber || form.material_code} CREATED`); setShowCreate(false); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;

  return (
    <ModernModuleShell title="Stock Transport Orders" subtitle={`${stos.length} STOS`} code="PSTC" module="MM">
      <div className="max-w-[1600px] mx-auto p-0 space-y-3">
        {msg && <div className="bg-black text-white font-mono text-xs p-2">{msg}</div>}
        <div className="flex justify-between items-center">
          <div className="font-mono text-[11px] font-bold">PSTC STO_CREATE ME21N {stos.length} <input value={search} onChange={e=>setSearch(e.target.value)} className="ml-2 border border-black px-1 py-0.5 text-[11px] w-40" /></div>
          <div className="flex gap-1">
            <button onClick={()=>setShowCreate(!showCreate)} className="text-[11px] font-mono bg-black text-white border border-black px-3 py-1">CREATE</button>
            <button onClick={load} className="text-[11px] font-mono border border-black px-3 py-1 bg-white">REFRESH</button>
          </div>
        </div>

        {showCreate && (
          <div className="bg-white border border-black p-3 space-y-2">
            <div className="font-mono text-[11px] font-bold border-b border-black pb-1">PSTC CREATE API: POST /api/sto {`{supplying_plant_code, receiving_plant_code, material_code, quantity}`}</div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div><div className="text-[10px] text-zinc-500">SUPPLYING_PLANT_CODE</div><input value={form.supplying_plant_code} onChange={e=>setForm({...form,supplying_plant_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">RECEIVING_PLANT_CODE</div><input value={form.receiving_plant_code} onChange={e=>setForm({...form,receiving_plant_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">MATERIAL_CODE</div><input value={form.material_code} onChange={e=>setForm({...form,material_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">QUANTITY</div><input value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">UOM_CODE</div><input value={form.uom_code} onChange={e=>setForm({...form,uom_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
            </div>
            <button onClick={handleCreate} className="bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE PSTC</button>
          </div>
        )}

        <div className="grid gap-1">
          {stos.map((s:any)=>(
            <div key={s.id || s.sto_number} className="bg-white border border-black p-2 font-mono text-[11px]">
              <div className="font-bold">{s.sto_number || s.id} | SUPPLYING_PLANT_CODE={s.supplying_plant_code} RECEIVING_PLANT_CODE={s.receiving_plant_code} MATERIAL_CODE={s.material_code}</div>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
