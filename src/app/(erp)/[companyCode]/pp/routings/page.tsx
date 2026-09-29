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
  const [form,setForm]=useState({routing_number: "", material: "", operation: "", work_center: ""});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/routings').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!form.routing_number){ setMsg('ROUTING_NUMBER required'); return; }
    const payload = {...form, company_code: companyCode, companyCode};
    const res = await fetch('/api/routings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success || res.id || !res.error){ setMsg('✅ '+((form as any).code||(form as any).item_number||(form as any).account_number||(form as any).employee_number||(form as any).pr_number||(form as any).po_number||(form as any).bom_number||(form as any).order_number||'CREATED')+' CREATED'); load(); setForm({routing_number: "", material: "", operation: "", work_center: ""}); }
    else setMsg('❌ '+(res.error||'Failed'));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING CA01...</div>;
  const items = data?.data || data?.items || data?.materials || data?.partners || data?.users || data?.roles || data?.employees || data?.payrolls || data?.purchaseRequisitions || data?.purchaseOrders || data?.goodsReceipts || data?.invoices || data?.stos || data?.boms || data?.kittings || data?.mrp || data?.routings || data?.workCenters || data?.salesOrders || data?.billings || data?.deliveries || data?.physicalInventories || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">CA01 ROUTINGS CREATE – API: POST /api/routings [ROUTING_NUMBER, MATERIAL, OPERATION, WORK_CENTER] – {Array.isArray(items)?items.length:0} RECORDS</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">ROUTING_NUMBER</div><input value={form.routing_number} onChange={e=>setForm({...form,routing_number:e.target.value})} className="w-full border-2 border-black px-1 py-1 " placeholder="ROUTING_NUMBER" /></div>
          <div><div className="text-[9px] text-zinc-500">MATERIAL</div><input value={form.material} onChange={e=>setForm({...form,material:e.target.value})} className="w-full border-2 border-black px-1 py-1 " placeholder="MATERIAL" /></div>
          <div><div className="text-[9px] text-zinc-500">OPERATION</div><input value={form.operation} onChange={e=>setForm({...form,operation:e.target.value})} className="w-full border-2 border-black px-1 py-1 " placeholder="OPERATION" /></div>
          <div><div className="text-[9px] text-zinc-500">WORK_CENTER</div><input value={form.work_center} onChange={e=>setForm({...form,work_center:e.target.value})} className="w-full border-2 border-black px-1 py-1 " placeholder="WORK_CENTER" /></div>

        </div>
        <button onClick={create} className="mt-2 bg-black text-white px-3 py-1 w-full">CREATE CA01</button>
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
            <div className="font-semibold">Routings – CA01</div>
            <div className="text-xs text-zinc-500">{Array.isArray(items)?items.length:0} records • COMPANY_CODE {companyCode} • API: POST /api/routings</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">ROUTING_NUMBER</label>
            <input value={form.routing_number} onChange={e=>setForm({...form,routing_number:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black uppercase" placeholder="ROUTING_NUMBER" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">MATERIAL</label>
            <input value={form.material} onChange={e=>setForm({...form,material:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black " placeholder="MATERIAL" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">OPERATION</label>
            <input value={form.operation} onChange={e=>setForm({...form,operation:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black " placeholder="OPERATION" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">WORK_CENTER</label>
            <input value={form.work_center} onChange={e=>setForm({...form,work_center:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black " placeholder="WORK_CENTER" />
          </div>

        </div>
        <button onClick={create} className="mt-5 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Create CA01</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {(Array.isArray(items)?items:[]).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start">
              <div className="font-semibold text-sm">{(it.code||it.item_number||it.account_number||it.employee_number||it.pr_number||it.po_number||it.bom_number||it.order_number||it.name||'RECORD '+(idx+1))}</div>
              <span className="text-[10px] bg-zinc-900 text-white rounded-full px-2 py-0.5">CA01</span>
            </div>
            <div className="mt-2 text-xs text-zinc-500 line-clamp-2">{Object.entries(it).slice(0,5).map(([k,v])=>`${k.toUpperCase()}: ${String(v)}`).join(' • ')}</div>
          </div>
        ))}
        {(!items || (Array.isArray(items) && items.length===0)) && (
          <div className="col-span-2 bg-white rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
            <div className="text-sm text-zinc-500">No records yet – create first via CA01</div>
            <div className="text-xs text-zinc-400 mt-1">COMPANY_CODE {companyCode} • Function is destination</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Routings" subtitle={`${Array.isArray(items)?items.length:0} records • ${companyCode} • CA01`} code="CA01" module="PP" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
