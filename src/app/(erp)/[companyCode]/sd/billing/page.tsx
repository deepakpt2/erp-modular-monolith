"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function BillingPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [billings, setBillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ delivery_code: '', billing_date: '', customer_code: '' });

  async function load(){
    setLoading(true);
    try{
      const res = await fetch(`/api/billing?limit=200&search=${encodeURIComponent(search)}`).then(r=>r.json());
      setBillings(res.billings || []);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[companyCode]);
  useEffect(()=>{const t=setTimeout(load,300);return()=>clearTimeout(t);},[search]);

  const handleCreate = async ()=>{
    if(!form.delivery_code){ setMsg('DELIVERY_CODE required'); return; }
    const res = await fetch('/api/billing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${res.billingNumber || form.delivery_code} CREATED`); setShowCreate(false); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;

  return (
    <ModernModuleShell title="Billing" subtitle={`${billings.length} BILLINGS`} code="SBLC" module="SD">
      <div className="max-w-[1600px] mx-auto p-0 space-y-3">
        {msg && <div className="bg-black text-white font-mono text-xs p-2">{msg}</div>}
        <div className="flex justify-between items-center">
          <div className="font-mono text-[11px] font-bold">SBLC BILLING_CREATE VF01 {billings.length} <input value={search} onChange={e=>setSearch(e.target.value)} className="ml-2 border border-black px-1 py-0.5 text-[11px] w-40" /></div>
          <div className="flex gap-1">
            <button onClick={()=>setShowCreate(!showCreate)} className="text-[11px] font-mono bg-black text-white border border-black px-3 py-1">CREATE</button>
            <button onClick={load} className="text-[11px] font-mono border border-black px-3 py-1 bg-white">REFRESH</button>
          </div>
        </div>

        {showCreate && (
          <div className="bg-white border border-black p-3 space-y-2">
            <div className="font-mono text-[11px] font-bold border-b border-black pb-1">SBLC CREATE API: POST /api/billing {`{delivery_code, billing_date, customer_code}`}</div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div><div className="text-[10px] text-zinc-500">DELIVERY_CODE</div><input value={form.delivery_code} onChange={e=>setForm({...form,delivery_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">CUSTOMER_CODE</div><input value={form.customer_code} onChange={e=>setForm({...form,customer_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">BILLING_DATE</div><input type="date" value={form.billing_date} onChange={e=>setForm({...form,billing_date:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
            </div>
            <button onClick={handleCreate} className="bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE SBLC</button>
          </div>
        )}

        <div className="grid gap-1">
          {billings.map((b:any)=>(
            <div key={b.id || b.billing_number} className="bg-white border border-black p-2 font-mono text-[11px]">
              <div className="font-bold">{b.billing_number || b.id} | DELIVERY_CODE={b.delivery_code} CUSTOMER_CODE={b.customer_code}</div>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
