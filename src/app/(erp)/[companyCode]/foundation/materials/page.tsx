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
    item_number: '', description: '', description_long: '', type: 'RAW', base_uom: 'KG', category_code: '', group_code: '',
    shelf_life_days: '30', lot_control: 'BLOCKED', expiry_control: 'BLOCKED', valuation_class: 'RAW',
    weight: '', weight_unit: 'KG', volume: '', volume_unit: 'L', barcode: '', hsn_code: '',
    facility_code: '', inventory_location_code: '', procurement_division_code: '', buyer_team_code: '',
    commercial_org_code: '', sales_channel_code: '', product_line_code: '',
    moving_avg_price: '0', standard_price: '0', price_control: 'V',
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

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;

  return (
    <ModernModuleShell title="Products" subtitle={`${materials.length} ITEMS`} code="EMTC" module="FOUNDATION">
      <div className="max-w-[1600px] mx-auto p-0 space-y-3">
        {msg && <div className="bg-black text-white font-mono text-xs p-2">{msg}</div>}
        <div className="flex justify-between items-center">
          <div className="font-mono text-[11px] font-bold">EMTC PRODUCT_CREATE MM01 {materials.length} <input value={search} onChange={e=>setSearch(e.target.value)} className="ml-2 border border-black px-1 py-0.5 text-[11px] w-40" /></div>
          <div className="flex gap-1">
            <button onClick={()=>setShowAdd(!showAdd)} className="text-[11px] font-mono bg-black text-white border border-black px-3 py-1">CREATE</button>
            <button onClick={load} className="text-[11px] font-mono border border-black px-3 py-1 bg-white">REFRESH</button>
          </div>
        </div>

        {showAdd && (
          <form onSubmit={handleCreate} className="bg-white border border-black p-3 space-y-2">
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div><div className="text-[10px] text-zinc-500">ITEM_NUMBER</div><input required value={form.item_number} onChange={e=>setForm({...form, item_number:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input required value={form.description} onChange={e=>setForm({...form, description:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">TYPE</div><select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} className="w-full border border-black px-1 py-1 text-xs"><option>RAW</option><option>SEMI</option><option>FINISHED</option><option>TRADING</option><option>PACKAGING</option><option>CONSUMABLE</option><option>SERVICE</option></select></div>
              <div><div className="text-[10px] text-zinc-500">BASE_UOM</div><input value={form.base_uom} onChange={e=>setForm({...form, base_uom:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">CATEGORY_CODE</div><input value={form.category_code} onChange={e=>setForm({...form, category_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">GROUP_CODE</div><input value={form.group_code} onChange={e=>setForm({...form, group_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">SHELF_LIFE_DAYS</div><input value={form.shelf_life_days} onChange={e=>setForm({...form, shelf_life_days:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">LOT_CONTROL</div><select value={form.lot_control} onChange={e=>setForm({...form, lot_control:e.target.value})} className="w-full border border-black px-1 py-1 text-xs"><option>BLOCKED</option><option>WARNING</option><option>RESTRICTED_USE</option></select></div>
              <div><div className="text-[10px] text-zinc-500">EXPIRY_CONTROL</div><select value={form.expiry_control} onChange={e=>setForm({...form, expiry_control:e.target.value})} className="w-full border border-black px-1 py-1 text-xs"><option>BLOCKED</option><option>WARNING</option><option>RESTRICTED_USE</option></select></div>
              <div><div className="text-[10px] text-zinc-500">VALUATION_CLASS</div><input value={form.valuation_class} onChange={e=>setForm({...form, valuation_class:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">WEIGHT</div><input value={form.weight} onChange={e=>setForm({...form, weight:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">WEIGHT_UNIT</div><input value={form.weight_unit} onChange={e=>setForm({...form, weight_unit:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">VOLUME</div><input value={form.volume} onChange={e=>setForm({...form, volume:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">VOLUME_UNIT</div><input value={form.volume_unit} onChange={e=>setForm({...form, volume_unit:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">BARCODE</div><input value={form.barcode} onChange={e=>setForm({...form, barcode:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">HSN_CODE</div><input value={form.hsn_code} onChange={e=>setForm({...form, hsn_code:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">FACILITY_CODE</div><input value={form.facility_code} onChange={e=>setForm({...form, facility_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">INVENTORY_LOCATION_CODE</div><input value={form.inventory_location_code} onChange={e=>setForm({...form, inventory_location_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">DESCRIPTION_LONG</div><input value={form.description_long} onChange={e=>setForm({...form, description_long:e.target.value})} className="w-full border border-black px-1 py-1 text-xs col-span-3" /></div>
            </div>
            <button type="submit" className="bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE EMTC</button>
          </form>
        )}

        <div className="grid md:grid-cols-3 gap-2">
          {materials.map((m:any)=>(
            <div key={m.item_number || m.material_number} className="bg-white border border-black p-2 font-mono text-[11px]">
              <div className="font-bold">{m.item_number || m.material_number} | {m.description} | {m.type}</div>
              <div className="text-[10px] text-zinc-600">BASE_UOM={m.base_uom} VALUATION_CLASS={m.valuation_class} SHELF_LIFE_DAYS={m.shelf_life_days}</div>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
