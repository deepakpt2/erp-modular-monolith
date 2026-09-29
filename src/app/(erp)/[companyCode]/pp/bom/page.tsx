"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function BOMPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [boms, setBoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ material_code: '', plant_code: '', base_quantity: '1', base_uom_code: 'KG', component_material_code: '', component_quantity: '1' });

  async function load(){
    setLoading(true);
    try{
      const res = await fetch(`/api/bom?limit=200&search=${encodeURIComponent(search)}`).then(r=>r.json());
      setBoms(res.boms || []);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[companyCode]);
  useEffect(()=>{const t=setTimeout(load,300);return()=>clearTimeout(t);},[search]);

  const handleCreate = async ()=>{
    if(!form.material_code){ setMsg('MATERIAL_CODE required'); return; }
    const res = await fetch('/api/bom',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${form.material_code} BOM CREATED`); setShowCreate(false); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;

  return (
    <ModernModuleShell title="Bills of Material" subtitle={`${boms.length} BOMS`} code="MBMC" module="PP">
      <div className="max-w-[1600px] mx-auto p-0 space-y-3">
        {msg && <div className="bg-black text-white font-mono text-xs p-2">{msg}</div>}
        <div className="flex justify-between items-center">
          <div className="font-mono text-[11px] font-bold">MBMC BOM_CREATE CS01 {boms.length} <input value={search} onChange={e=>setSearch(e.target.value)} className="ml-2 border border-black px-1 py-0.5 text-[11px] w-40" /></div>
          <div className="flex gap-1">
            <button onClick={()=>setShowCreate(!showCreate)} className="text-[11px] font-mono bg-black text-white border border-black px-3 py-1">CREATE</button>
            <button onClick={load} className="text-[11px] font-mono border border-black px-3 py-1 bg-white">REFRESH</button>
          </div>
        </div>

        {showCreate && (
          <div className="bg-white border border-black p-3 space-y-2">
            <div className="font-mono text-[11px] font-bold border-b border-black pb-1">MBMC CREATE API: POST /api/bom {`{material_code, plant_code, base_quantity, component_material_code, component_quantity}`}</div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div><div className="text-[10px] text-zinc-500">MATERIAL_CODE</div><input value={form.material_code} onChange={e=>setForm({...form,material_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">PLANT_CODE</div><input value={form.plant_code} onChange={e=>setForm({...form,plant_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">BASE_QUANTITY</div><input value={form.base_quantity} onChange={e=>setForm({...form,base_quantity:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">BASE_UOM_CODE</div><input value={form.base_uom_code} onChange={e=>setForm({...form,base_uom_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">COMPONENT_MATERIAL_CODE</div><input value={form.component_material_code} onChange={e=>setForm({...form,component_material_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">COMPONENT_QUANTITY</div><input value={form.component_quantity} onChange={e=>setForm({...form,component_quantity:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
            </div>
            <button onClick={handleCreate} className="bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE MBMC</button>
          </div>
        )}

        <div className="grid gap-1">
          {boms.map((b:any)=>(
            <div key={b.id || b.bom_number} className="bg-white border border-black p-2 font-mono text-[11px]">
              <div className="font-bold">{b.bom_number || b.id} | MATERIAL_CODE={b.material_code} PLANT_CODE={b.plant_code}</div>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
