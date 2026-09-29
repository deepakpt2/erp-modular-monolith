"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function POPage() {
  const params = useParams();
  const companyCode = (params?.companyCode as string) || '1000';
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    company_code: companyCode, vendor_code: '', plant_code: '', material_code: '', quantity: '', uom_code: 'KG',
    unit_price: '', freight_per_unit: '0', customs_per_unit: '0', tax_code: 'V0', delivery_date: '', doc_date: '',
    purchasing_org_code: '', purchasing_group_code: '', account_assignment: 'K', cost_center_code: '', gl_account_code: '', header_text: '', currency_code: 'INR',
  });

  async function load(){
    setLoading(true);
    try{
      const res = await fetch(`/api/po?limit=200&companyCode=${companyCode}&search=${encodeURIComponent(search)}`).then(r=>r.json());
      setPos(res.pos || []);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[companyCode]);
  useEffect(()=>{const t=setTimeout(load,300);return()=>clearTimeout(t);},[search]);

  const handleCreate = async ()=>{
    if(!form.vendor_code || !form.material_code){ setMsg('VENDOR_CODE and MATERIAL_CODE required'); return; }
    const res = await fetch('/api/po',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${res.poNumber || form.material_code} CREATED`); setShowCreate(false); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;

  return (
    <ModernModuleShell title="Purchase Orders" subtitle={`${pos.length} POS`} code="PPOC" module="MM">
      <div className="max-w-[1600px] mx-auto p-0 space-y-3">
        {msg && <div className="bg-black text-white font-mono text-xs p-2">{msg}</div>}
        <div className="flex justify-between items-center">
          <div className="font-mono text-[11px] font-bold">PPOC PO_CREATE ME21N {pos.length} <input value={search} onChange={e=>setSearch(e.target.value)} className="ml-2 border border-black px-1 py-0.5 text-[11px] w-40" /></div>
          <div className="flex gap-1">
            <button onClick={()=>setShowCreate(!showCreate)} className="text-[11px] font-mono bg-black text-white border border-black px-3 py-1">CREATE</button>
            <button onClick={load} className="text-[11px] font-mono border border-black px-3 py-1 bg-white">REFRESH</button>
          </div>
        </div>

        {showCreate && (
          <div className="bg-white border border-black p-3 space-y-2">
            <div className="font-mono text-[11px] font-bold border-b border-black pb-1">PPOC CREATE API: POST /api/po {`{company_code, vendor_code, material_code, quantity, uom_code}`}</div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div><div className="text-[10px] text-zinc-500">COMPANY_CODE</div><input value={form.company_code} onChange={e=>setForm({...form,company_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">VENDOR_CODE</div><input value={form.vendor_code} onChange={e=>setForm({...form,vendor_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">MATERIAL_CODE</div><input value={form.material_code} onChange={e=>setForm({...form,material_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">QUANTITY</div><input value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">UOM_CODE</div><input value={form.uom_code} onChange={e=>setForm({...form,uom_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">PLANT_CODE</div><input value={form.plant_code} onChange={e=>setForm({...form,plant_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">UNIT_PRICE</div><input value={form.unit_price} onChange={e=>setForm({...form,unit_price:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">CURRENCY_CODE</div><input value={form.currency_code} onChange={e=>setForm({...form,currency_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">TAX_CODE</div><input value={form.tax_code} onChange={e=>setForm({...form,tax_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
            </div>
            <button onClick={handleCreate} className="bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE PPOC</button>
          </div>
        )}

        <div className="grid gap-1">
          {pos.map((po:any)=>(
            <div key={po.id || po.po_number} className="bg-white border border-black p-2 font-mono text-[11px]">
              <div className="font-bold">{po.po_number || po.id} | VENDOR_CODE={po.vendor_code} MATERIAL_CODE={po.material_code} QUANTITY={po.quantity}</div>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
