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
    if(!(form as any).code){ setMsg('CODE required'); return; }
    const res = await fetch('/api/tax-codes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form, rate: parseFloat(form.rate)})}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${(form as any).code} CREATED`); load(); setForm({code:'',description:'',rate:'18',type:'INPUT',gst_type:'CGST',hsn_code:'', ledger_account_code:''}); }
    else setMsg(`❌ ${res.error}`);
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;
  const taxes = data?.taxCodes||[];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">FTXC TAX_CREATE FTXP {taxes.length} API: POST /api/tax-codes {`{code, description, rate, type, gst_type, hsn_code, ledger_account_code}`}</div>
        <div className="grid grid-cols-4 gap-2">
          <div><div className="text-[9px] text-zinc-500">CODE</div><input value={(form as any).code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="CODE" /></div>
          <div><div className="text-[9px] text-zinc-500">DESCRIPTION</div><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="DESCRIPTION" /></div>
          <div><div className="text-[9px] text-zinc-500">RATE</div><input value={form.rate} onChange={e=>setForm({...form,rate:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="RATE" /></div>
          <div><div className="text-[9px] text-zinc-500">TYPE</div><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>INPUT</option><option>OUTPUT</option></select></div>
          <div><div className="text-[9px] text-zinc-500">GST_TYPE</div><select value={form.gst_type} onChange={e=>setForm({...form,gst_type:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>CGST</option><option>SGST</option><option>IGST</option><option>UTGST</option><option>VAT</option></select></div>
          <div><div className="text-[9px] text-zinc-500">HSN_CODE</div><input value={form.hsn_code} onChange={e=>setForm({...form,hsn_code:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="HSN_CODE" /></div>
          <div><div className="text-[9px] text-zinc-500">LEDGER_ACCOUNT_CODE</div><input value={form.ledger_account_code} onChange={e=>setForm({...form,ledger_account_code:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="LEDGER_ACCOUNT_CODE" /></div>
        </div>
        <button onClick={create} className="mt-2 bg-black text-white px-3 py-1 w-full">CREATE FTXC</button>
      </div>
      <div className="grid md:grid-cols-3 gap-2">
        {taxes.map((t:any)=>(
          <div key={t.code} className="bg-white border-2 border-black p-2">
            <div className="font-bold">{t.code} | {t.description} | RATE={t.rate} TYPE={t.type} GST_TYPE={t.gst_type}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">🧾</div>
          <div>
            <div className="font-semibold">Create Tax Code – FTXP</div>
            <div className="text-xs text-zinc-500">FTXC • {taxes.length} codes • API: POST /api/tax-codes</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">CODE</label><input value={(form as any).code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black uppercase" placeholder="CODE" /></div>
          <div><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">DESCRIPTION</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="DESCRIPTION" /></div>
          <div><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">RATE</label><input value={form.rate} onChange={e=>setForm({...form,rate:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="RATE" /></div>
          <div><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">TYPE</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"><option>INPUT</option><option>OUTPUT</option></select></div>
          <div><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">GST_TYPE</label><select value={form.gst_type} onChange={e=>setForm({...form,gst_type:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"><option>CGST</option><option>SGST</option><option>IGST</option><option>UTGST</option><option>VAT</option></select></div>
          <div><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">HSN_CODE</label><input value={form.hsn_code} onChange={e=>setForm({...form,hsn_code:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="HSN_CODE" /></div>
          <div><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">LEDGER_ACCOUNT_CODE</label><input value={form.ledger_account_code} onChange={e=>setForm({...form,ledger_account_code:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="LEDGER_ACCOUNT_CODE" /></div>
        </div>
        <button onClick={create} className="mt-5 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Create Tax Code</button>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {taxes.map((t:any)=>(
          <div key={t.code} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between"><div className="font-semibold text-sm">{t.code} • {t.description}</div><span className="text-[10px] bg-zinc-900 text-white rounded-full px-2 py-0.5">{t.rate}%</span></div>
            <div className="mt-2 text-xs text-zinc-500">TYPE: {t.type} • GST_TYPE: {t.gst_type} • HSN: {t.hsn_code}</div>
          </div>
        ))}
        {taxes.length===0 && <div className="col-span-3 bg-white rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">No tax codes – create first via FTXP</div>}
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Tax Codes" subtitle={`${taxes.length} TAX_CODES • FTXP`} code="FTXP" module="FICO" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
