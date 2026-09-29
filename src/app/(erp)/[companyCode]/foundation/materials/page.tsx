"use client";
import React, { useState, useEffect } from 'react';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    item_number: '', description: '', type: 'RAW', base_uom: 'KG', category_code: '', group_code: '',
    shelf_life_days: '30', lot_control: 'BLOCKED', expiry_control: 'BLOCKED', valuation_class: 'RAW',
    weight: '', weight_unit: 'KG', barcode: '', hsn_code: '', facility_code: '',
  });

  async function load(){
    setLoading(true);
    try{
      const res = await fetch(`/api/materials?limit=200&search=${encodeURIComponent(search)}`).then(r=>r.json());
      setMaterials(res.materials || []);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);
  useEffect(()=>{const t=setTimeout(load,300);return()=>clearTimeout(t);},[search]);

  const handleCreate = async (e: React.FormEvent)=>{
    e.preventDefault();
    if(!form.item_number || !form.description){ setMsg('ITEM_NUMBER and DESCRIPTION required'); return; }
    const res = await fetch('/api/materials',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${form.item_number} CREATED`); setShowAdd(false); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  if(loading) return <div className="p-6">Loading...</div>;

  const modernContent = (
    <div className="space-y-6">
      {msg && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm">{msg}</div>}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Products <span className="ml-2 text-xs font-mono bg-zinc-100 border rounded-full px-2 py-0.5">{materials.length} EMTC</span> <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="ml-3 border border-zinc-200 rounded-full px-3 py-1.5 text-xs w-40 focus:outline-none focus:ring-2 focus:ring-black" /></h3>
        <div className="flex gap-2">
          <button onClick={()=>setShowAdd(!showAdd)} className="text-xs bg-zinc-900 text-white rounded-full px-4 py-2 hover:bg-black">+ Create EMTC</button>
          <button onClick={load} className="text-xs border border-zinc-200 rounded-full px-4 py-2 bg-white">Refresh</button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-xs font-medium text-zinc-600">ITEM_NUMBER</label><input required value={form.item_number} onChange={e=>setForm({...form, item_number:e.target.value.toUpperCase()})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm uppercase focus:ring-2 focus:ring-black focus:outline-none" /></div>
            <div><label className="text-xs font-medium text-zinc-600">DESCRIPTION</label><input required value={form.description} onChange={e=>setForm({...form, description:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-black focus:outline-none" /></div>
            <div><label className="text-xs font-medium text-zinc-600">TYPE</label><select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm"><option>RAW</option><option>SEMI</option><option>FINISHED</option><option>TRADING</option><option>PACKAGING</option></select></div>
            <div><label className="text-xs font-medium text-zinc-600">BASE_UOM</label><input value={form.base_uom} onChange={e=>setForm({...form, base_uom:e.target.value.toUpperCase()})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm uppercase" /></div>
            <div><label className="text-xs font-medium text-zinc-600">CATEGORY_CODE</label><input value={form.category_code} onChange={e=>setForm({...form, category_code:e.target.value.toUpperCase()})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm uppercase" /></div>
            <div><label className="text-xs font-medium text-zinc-600">VALUATION_CLASS</label><input value={form.valuation_class} onChange={e=>setForm({...form, valuation_class:e.target.value.toUpperCase()})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm uppercase" /></div>
            <div><label className="text-xs font-medium text-zinc-600">SHELF_LIFE_DAYS</label><input value={form.shelf_life_days} onChange={e=>setForm({...form, shelf_life_days:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm" /></div>
            <div><label className="text-xs font-medium text-zinc-600">FACILITY_CODE</label><input value={form.facility_code} onChange={e=>setForm({...form, facility_code:e.target.value.toUpperCase()})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm uppercase" /></div>
            <div><label className="text-xs font-medium text-zinc-600">HSN_CODE</label><input value={form.hsn_code} onChange={e=>setForm({...form, hsn_code:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm" /></div>
          </div>
          <button type="submit" className="w-full bg-zinc-900 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-black">Create EMTC</button>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((m:any)=>(
          <div key={m.item_number || m.material_number} className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="font-medium text-sm">{m.item_number || m.material_number} – {m.description}</div>
            <div className="text-xs text-zinc-500 mt-1">TYPE {m.type} • BASE_UOM {m.base_uom} • VALUATION_CLASS {m.valuation_class}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const classicContent = (
    <div className="font-mono text-[11px] space-y-2">
      <div className="font-bold border-b border-black pb-1">EMTC PRODUCT_CREATE {materials.length} API: POST /api/materials {`{item_number, description, type, base_uom}`}</div>
      <div className="grid grid-cols-3 gap-2">
        <div><div className="text-[10px] text-zinc-500">ITEM_NUMBER</div><input value={form.item_number} onChange={e=>setForm({...form,item_number:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
        <div><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
        <div><div className="text-[10px] text-zinc-500">TYPE</div><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full border border-black px-1 py-1 text-xs"><option>RAW</option><option>SEMI</option><option>FINISHED</option></select></div>
      </div>
      <button onClick={(e:any)=>handleCreate(e)} className="bg-black text-white px-3 py-1 w-full">CREATE EMTC</button>
    </div>
  );

  return (
    <ModernModuleShell title="Products" subtitle={`${materials.length} ITEMS`} code="EMTC" module="FOUNDATION" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
