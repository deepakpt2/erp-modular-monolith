"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function IVPage() {
  const params = useParams();
  const companyCode = (params?.companyCode as string) || '1000';
  const [ivs, setIvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ po_code: '', gr_code: '', vendor_code: '', vendor_invoice_number: '', total_amount: '', freight_amount: '0', customs_amount: '0' });

  async function load(){
    setLoading(true);
    try{
      const res = await fetch(`/api/iv?limit=200&search=${encodeURIComponent(search)}`).then(r=>r.json());
      setIvs(res.ivs || []);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);
  useEffect(()=>{const t=setTimeout(load,300);return()=>clearTimeout(t);},[search]);

  const handleCreate = async ()=>{
    if(!form.po_code){ setMsg('PO_CODE required'); return; }
    const res = await fetch('/api/iv',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${res.ivNumber || form.po_code} CREATED`); setShowCreate(false); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;

  return (
    <ModernModuleShell title="Invoice Verification" subtitle={`${ivs.length} IVS`} code="PIVC" module="MM">
      <div className="max-w-[1600px] mx-auto p-0 space-y-3">
        {msg && <div className="bg-black text-white font-mono text-xs p-2">{msg}</div>}
        <div className="flex justify-between items-center">
          <div className="font-mono text-[11px] font-bold">PIVC IV_CREATE MIRO {ivs.length} <input value={search} onChange={e=>setSearch(e.target.value)} className="ml-2 border border-black px-1 py-0.5 text-[11px] w-40" /></div>
          <div className="flex gap-1">
            <button onClick={()=>setShowCreate(!showCreate)} className="text-[11px] font-mono bg-black text-white border border-black px-3 py-1">CREATE</button>
            <button onClick={load} className="text-[11px] font-mono border border-black px-3 py-1 bg-white">REFRESH</button>
          </div>
        </div>

        {showCreate && (
          <div className="bg-white border border-black p-3 space-y-2">
            <div className="font-mono text-[11px] font-bold border-b border-black pb-1">PIVC CREATE API: POST /api/iv {`{po_code, gr_code, vendor_code, vendor_invoice_number, total_amount}`}</div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div><div className="text-[10px] text-zinc-500">PO_CODE</div><input value={form.po_code} onChange={e=>setForm({...form,po_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">GR_CODE</div><input value={form.gr_code} onChange={e=>setForm({...form,gr_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">VENDOR_CODE</div><input value={form.vendor_code} onChange={e=>setForm({...form,vendor_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">VENDOR_INVOICE_NUMBER</div><input value={form.vendor_invoice_number} onChange={e=>setForm({...form,vendor_invoice_number:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">TOTAL_AMOUNT</div><input value={form.total_amount} onChange={e=>setForm({...form,total_amount:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">FREIGHT_AMOUNT</div><input value={form.freight_amount} onChange={e=>setForm({...form,freight_amount:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">CUSTOMS_AMOUNT</div><input value={form.customs_amount} onChange={e=>setForm({...form,customs_amount:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
            </div>
            <button onClick={handleCreate} className="bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE PIVC</button>
          </div>
        )}

        <div className="grid gap-1">
          {ivs.map((iv:any)=>(
            <div key={iv.id || iv.iv_number} className="bg-white border border-black p-2 font-mono text-[11px]">
              <div className="font-bold">{iv.iv_number || iv.id} | PO_CODE={iv.po_number} TOTAL_AMOUNT={iv.total_amount}</div>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
