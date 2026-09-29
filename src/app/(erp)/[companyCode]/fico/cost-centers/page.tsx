"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function CostCentersPage(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [form,setForm]=useState({code:'',name:'',company_code:companyCode, description:'', cost_unit_code:'', control_area_code:'', parent_code:''});
  const [msg,setMsg]=useState('');

  async function load(){
    setLoading(true);
    try{
      const res = await fetch(`/api/cost-centers?companyCode=${companyCode}`).then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[companyCode]);

  async function create(){
    if(!(form as any).code || !(form as any).name){ setMsg('CODE and NAME required'); return; }
    const res = await fetch('/api/cost-centers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${(form as any).code} CREATED`); load(); setForm({code:'',name:'',company_code:companyCode, description:'', cost_unit_code:'', control_area_code:'', parent_code:''}); }
    else setMsg(`❌ ${res.error}`);
  }

  if(loading) return <div className="p-6">Loading...</div>;
  const costCenters = data?.costCenters||[];

  const modernContent = (
    <div className="space-y-6">
      {msg && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm">{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <h3 className="font-semibold mb-4">Create Cost Center <span className="ml-2 text-xs font-mono bg-zinc-100 border rounded-full px-2 py-0.5">KS01 {costCenters.length}</span></h3>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="text-xs font-medium text-zinc-600">CODE</label><input value={(form as any).code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm uppercase focus:ring-2 focus:ring-black focus:outline-none" /></div>
          <div><label className="text-xs font-medium text-zinc-600">NAME</label><input value={(form as any).name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-black focus:outline-none" /></div>
          <div><label className="text-xs font-medium text-zinc-600">COMPANY_CODE</label><input value={(form as any).company_code} onChange={e=>setForm({...form,company_code:e.target.value.toUpperCase()})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm uppercase" /></div>
          <div><label className="text-xs font-medium text-zinc-600">COST_UNIT_CODE</label><input value={form.cost_unit_code} onChange={e=>setForm({...form,cost_unit_code:e.target.value.toUpperCase()})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm uppercase" /></div>
          <div><label className="text-xs font-medium text-zinc-600">CONTROL_AREA_CODE</label><input value={(form as any).control_area_code} onChange={e=>setForm({...form,control_area_code:e.target.value.toUpperCase()})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm uppercase" /></div>
          <div><label className="text-xs font-medium text-zinc-600">PARENT_CODE</label><input value={(form as any).parent_code} onChange={e=>setForm({...form,parent_code:e.target.value.toUpperCase()})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm uppercase" /></div>
          <div className="col-span-3"><label className="text-xs font-medium text-zinc-600">DESCRIPTION</label><input value={(form as any).description} onChange={e=>setForm({...form,description:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm" /></div>
        </div>
        <button onClick={create} className="mt-4 w-full bg-zinc-900 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-black">Create KS01</button>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {costCenters.map((c:any)=>(
          <div key={c.code} className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="font-medium text-sm">{c.code} – {c.name}</div>
            <div className="text-xs text-zinc-500 mt-1">COMPANY_CODE {c.company_code}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const classicContent = (
    <div className="font-mono text-[11px] space-y-2">
      <div className="font-bold border-b border-black pb-1">KS01 COST_CENTER_CREATE {costCenters.length} API: POST /api/cost-centers {`{code, name, company_code}`}</div>
      <div className="grid grid-cols-3 gap-2">
        <div><div className="text-[10px] text-zinc-500">CODE</div><input value={(form as any).code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
        <div><div className="text-[10px] text-zinc-500">NAME</div><input value={(form as any).name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
        <div><div className="text-[10px] text-zinc-500">COMPANY_CODE</div><input value={(form as any).company_code} onChange={e=>setForm({...form,company_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
      </div>
      <button onClick={create} className="bg-black text-white px-3 py-1 w-full">CREATE</button>
    </div>
  );

  return (
    <ModernModuleShell title="Cost Centers" subtitle={`${costCenters.length} COST_CENTERS`} code="KS01" module="FICO" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
