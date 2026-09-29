"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function TaxCodesPage(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');
  const [form,setForm]=useState({code:'',description:'',rate:'18',type:'INPUT',gst_type:'CGST',hsn_code:'', ledger_account_code:''});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/tax-codes').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!form.code){ setMsg('CODE required'); return; }
    const res = await fetch('/api/tax-codes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form, rate: parseFloat(form.rate)})}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${form.code} CREATED`); load(); setForm({code:'',description:'',rate:'18',type:'INPUT',gst_type:'CGST',hsn_code:'', ledger_account_code:''}); }
    else setMsg(`❌ ${res.error}`);
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;
  const taxes = data?.taxCodes||[];

  return (
    <ModernModuleShell title="Tax Codes" subtitle={`${taxes.length} TAX_CODES`} code="FTXC" module="FICO">
      <div className="max-w-[1600px] mx-auto p-0 space-y-3">
        {msg && <div className="bg-black text-white font-mono text-xs p-2">{msg}</div>}
        <div className="bg-white border border-black p-3">
          <div className="font-mono text-[11px] font-bold border-b border-black pb-1 mb-2">FTXC TAX_CREATE FTXP {taxes.length} API: POST /api/tax-codes {`{code, description, rate, type, gst_type, hsn_code}`}</div>
          <div className="grid grid-cols-4 gap-2 font-mono text-[11px]">
            <div><div className="text-[10px] text-zinc-500">CODE</div><input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
            <div><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
            <div><div className="text-[10px] text-zinc-500">RATE</div><input value={form.rate} onChange={e=>setForm({...form,rate:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
            <div><div className="text-[10px] text-zinc-500">TYPE</div><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full border border-black px-1 py-1 text-xs"><option>INPUT</option><option>OUTPUT</option></select></div>
            <div><div className="text-[10px] text-zinc-500">GST_TYPE</div><select value={form.gst_type} onChange={e=>setForm({...form,gst_type:e.target.value})} className="w-full border border-black px-1 py-1 text-xs"><option>CGST</option><option>SGST</option><option>IGST</option><option>UTGST</option><option>VAT</option></select></div>
            <div><div className="text-[10px] text-zinc-500">HSN_CODE</div><input value={form.hsn_code} onChange={e=>setForm({...form,hsn_code:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
            <div><div className="text-[10px] text-zinc-500">LEDGER_ACCOUNT_CODE</div><input value={form.ledger_account_code} onChange={e=>setForm({...form,ledger_account_code:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
          </div>
          <button onClick={create} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE FTXC</button>
        </div>
        <div className="grid md:grid-cols-3 gap-2">
          {taxes.map((t:any)=>(
            <div key={t.code} className="bg-white border border-black p-2 font-mono text-[11px]">
              <div className="font-bold">{t.code} | {t.description} | RATE={t.rate} TYPE={t.type} GST_TYPE={t.gst_type}</div>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
