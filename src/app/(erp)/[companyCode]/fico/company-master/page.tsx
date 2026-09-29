"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function Page(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');
  const [form,setForm]=useState({code: "", name: "", city: "", country: "", currency_code: "", coa_code: ""});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/company-codes').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!(form as any).code){ setMsg('CODE required'); return; }
    const payload = {...form, company_code: companyCode, companyCode};
    const res = await fetch('/api/company-codes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success || res.id || !res.error){ setMsg('✅ '+((form as any).code||(form as any).item_number||(form as any).account_number||(form as any).employee_number||(form as any).pr_number||(form as any).po_number||(form as any).bom_number||(form as any).order_number||'CREATED')+' CREATED'); load(); setForm({code: "", name: "", city: "", country: "", currency_code: "", coa_code: ""}); }
    else setMsg('❌ '+(res.error||'Failed'));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING OX02...</div>;
  const items = data?.data || data?.items || data?.materials || data?.partners || data?.users || data?.roles || data?.employees || data?.payrolls || data?.purchaseRequisitions || data?.purchaseOrders || data?.goodsReceipts || data?.invoices || data?.stos || data?.boms || data?.kittings || data?.mrp || data?.routings || data?.workCenters || data?.salesOrders || data?.billings || data?.deliveries || data?.physicalInventories || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">OX02 COMPANY MASTER CREATE – API: POST /api/company-codes [CODE, NAME, CITY, COUNTRY, CURRENCY_CODE, COA_CODE] – {Array.isArray(items)?items.length:0} RECORDS</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">CODE</div><input value={(form as any).code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="CODE" /></div>
          <div><div className="text-[9px] text-zinc-500">NAME</div><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border-2 border-black px-1 py-1 " placeholder="NAME" /></div>
          <div><div className="text-[9px] text-zinc-500">CITY</div><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="w-full border-2 border-black px-1 py-1 " placeholder="CITY" /></div>
          <div><div className="text-[9px] text-zinc-500">COUNTRY</div><input value={form.country} onChange={e=>setForm({...form,country:e.target.value})} className="w-full border-2 border-black px-1 py-1 " placeholder="COUNTRY" /></div>
          <div><div className="text-[9px] text-zinc-500">CURRENCY_CODE</div><input value={form.currency_code} onChange={e=>setForm({...form,currency_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="CURRENCY_CODE" /></div>
          <div><div className="text-[9px] text-zinc-500">COA_CODE</div><input value={form.coa_code} onChange={e=>setForm({...form,coa_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="COA_CODE" /></div>

        </div>
        <button onClick={create} className="mt-2 bg-black text-white px-3 py-1 w-full">CREATE OX02</button>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {(Array.isArray(items)?items:[]).slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2">
            <div className="font-bold">{(it.code||it.item_number||it.account_number||it.employee_number||it.pr_number||it.po_number||it.bom_number||it.order_number||it.name||JSON.stringify(it).slice(0,80))}</div>
            <div className="text-[10px] text-zinc-600">{Object.entries(it).slice(0,4).map(([k,v])=>k.toUpperCase()+'='+String(v)).join(' ')}</div>
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
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">📦</div>
          <div>
            <div className="font-semibold">Company Master – OX02</div>
            <div className="text-xs text-zinc-500">{Array.isArray(items)?items.length:0} records • COMPANY_CODE {companyCode} • API: POST /api/company-codes</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">CODE</label>
            <input value={(form as any).code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black uppercase" placeholder="CODE" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">NAME</label>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black " placeholder="NAME" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">CITY</label>
            <input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black " placeholder="CITY" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">COUNTRY</label>
            <input value={form.country} onChange={e=>setForm({...form,country:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black " placeholder="COUNTRY" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">CURRENCY_CODE</label>
            <input value={form.currency_code} onChange={e=>setForm({...form,currency_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black uppercase" placeholder="CURRENCY_CODE" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">COA_CODE</label>
            <input value={form.coa_code} onChange={e=>setForm({...form,coa_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black uppercase" placeholder="COA_CODE" />
          </div>

        </div>
        <button onClick={create} className="mt-5 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Create OX02</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {(Array.isArray(items)?items:[]).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start">
              <div className="font-semibold text-sm">{(it.code||it.item_number||it.account_number||it.employee_number||it.pr_number||it.po_number||it.bom_number||it.order_number||it.name||'RECORD '+(idx+1))}</div>
              <span className="text-[10px] bg-zinc-900 text-white rounded-full px-2 py-0.5">OX02</span>
            </div>
            <div className="mt-2 text-xs text-zinc-500 line-clamp-2">{Object.entries(it).slice(0,5).map(([k,v])=>`${k.toUpperCase()}: ${String(v)}`).join(' • ')}</div>
          </div>
        ))}
        {(!items || (Array.isArray(items) && items.length===0)) && (
          <div className="col-span-2 bg-white rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
            <div className="text-sm text-zinc-500">No records yet – create first via OX02</div>
            <div className="text-xs text-zinc-400 mt-1">COMPANY_CODE {companyCode} • Function is destination</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Company Master" subtitle={`${Array.isArray(items)?items.length:0} records • ${companyCode} • OX02`} code="OX02" module="FICO" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
