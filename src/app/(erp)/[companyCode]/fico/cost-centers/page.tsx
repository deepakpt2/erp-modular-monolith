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
    if(!form.code || !form.name){ setMsg('CODE and NAME required'); return; }
    const res = await fetch('/api/cost-centers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${form.code} CREATED`); load(); setForm({code:'',name:'',company_code:companyCode, description:'', cost_unit_code:'', control_area_code:'', parent_code:''}); }
    else setMsg(`❌ ${res.error}`);
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;
  const costCenters = data?.costCenters||[];

  return (
    <ModernModuleShell title="Cost Centers" subtitle={`${costCenters.length} COST_CENTERS`} code="KS01" module="FICO">
      <div className="max-w-[1600px] mx-auto p-0 space-y-3">
        {msg && <div className="bg-black text-white font-mono text-xs p-2">{msg}</div>}
        <div className="bg-white border border-black p-3">
          <div className="font-mono text-[11px] font-bold border-b border-black pb-1 mb-2">KS01 COST_CENTER_CREATE {costCenters.length} API: POST /api/cost-centers {`{code, name, company_code}`}</div>
          <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
            <div><div className="text-[10px] text-zinc-500">CODE</div><input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
            <div><div className="text-[10px] text-zinc-500">NAME</div><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
            <div><div className="text-[10px] text-zinc-500">COMPANY_CODE</div><input value={form.company_code} onChange={e=>setForm({...form,company_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
            <div><div className="text-[10px] text-zinc-500">COST_UNIT_CODE</div><input value={form.cost_unit_code} onChange={e=>setForm({...form,cost_unit_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
            <div><div className="text-[10px] text-zinc-500">CONTROL_AREA_CODE</div><input value={form.control_area_code} onChange={e=>setForm({...form,control_area_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
            <div><div className="text-[10px] text-zinc-500">PARENT_CODE</div><input value={form.parent_code} onChange={e=>setForm({...form,parent_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
            <div className="col-span-3"><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
          </div>
          <button onClick={create} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE KS01</button>
        </div>
        <div className="grid md:grid-cols-3 gap-2">
          {costCenters.map((c:any)=>(
            <div key={c.code} className="bg-white border border-black p-2 font-mono text-[11px]">
              <div className="font-bold">{c.code} | {c.name} | COMPANY_CODE={c.company_code}</div>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
