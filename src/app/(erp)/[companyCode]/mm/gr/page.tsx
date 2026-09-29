"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function GRPage() {
  const params = useParams();
  const companyCode = (params?.companyCode as string) || '1000';
  const [grs, setGrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ po_code: '', plant_code: '', sloc_code: '', material_code: '', quantity: '', batch_number: '', uom_code: 'KG' });

  async function load(){
    setLoading(true);
    try{
      const res = await fetch(`/api/gr?limit=200&search=${encodeURIComponent(search)}`).then(r=>r.json());
      setGrs(res.grs || []);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[companyCode]);
  useEffect(()=>{const t=setTimeout(load,300);return()=>clearTimeout(t);},[search]);

  const handleCreate = async ()=>{
    if(!form.po_code || !form.quantity){ setMsg('PO_CODE and QUANTITY required'); return; }
    const res = await fetch('/api/gr',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${res.grNumber || form.po_code} CREATED`); setShowCreate(false); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;

  return (
    <ModernModuleShell title="Goods Receipt" subtitle={`${grs.length} GRS`} code="PGRC" module="MM">
      <div className="max-w-[1600px] mx-auto p-0 space-y-3">
        {msg && <div className="bg-black text-white font-mono text-xs p-2">{msg}</div>}
        <div className="flex justify-between items-center">
          <div className="font-mono text-[11px] font-bold">PGRC GR_CREATE MIGO {grs.length} <input value={search} onChange={e=>setSearch(e.target.value)} className="ml-2 border border-black px-1 py-0.5 text-[11px] w-40" /></div>
          <div className="flex gap-1">
            <button onClick={()=>setShowCreate(!showCreate)} className="text-[11px] font-mono bg-black text-white border border-black px-3 py-1">CREATE</button>
            <button onClick={load} className="text-[11px] font-mono border border-black px-3 py-1 bg-white">REFRESH</button>
          </div>
        </div>

        {showCreate && (
          <div className="bg-white border border-black p-3 space-y-2">
            <div className="font-mono text-[11px] font-bold border-b border-black pb-1">PGRC CREATE API: POST /api/gr {`{po_code, plant_code, sloc_code, material_code, quantity}`}</div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div><div className="text-[10px] text-zinc-500">PO_CODE</div><input value={form.po_code} onChange={e=>setForm({...form,po_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">PLANT_CODE</div><input value={form.plant_code} onChange={e=>setForm({...form,plant_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">SLOC_CODE</div><input value={form.sloc_code} onChange={e=>setForm({...form,sloc_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">MATERIAL_CODE</div><input value={form.material_code} onChange={e=>setForm({...form,material_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">QUANTITY</div><input value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">UOM_CODE</div><input value={form.uom_code} onChange={e=>setForm({...form,uom_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">BATCH_NUMBER</div><input value={form.batch_number} onChange={e=>setForm({...form,batch_number:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
            </div>
            <button onClick={handleCreate} className="bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE PGRC</button>
          </div>
        )}

        <div className="grid gap-1">
          {grs.map((g:any)=>(
            <div key={g.id || g.gr_number} className="bg-white border border-black p-2 font-mono text-[11px]">
              <div className="font-bold">{g.gr_number || g.id} | PO_CODE={g.po_number} PLANT_CODE={g.plant_code} QUANTITY={g.total_qty}</div>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
