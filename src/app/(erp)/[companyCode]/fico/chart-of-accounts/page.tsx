"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function ChartOfAccountsPage(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');
  const [form,setForm]=useState({code:'',name:'',description:''});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/chart-of-accounts').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!form.code || !form.name){ setMsg('CODE and NAME required'); return; }
    const res = await fetch('/api/chart-of-accounts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success || res.chartOfAccounts){ setMsg(`✅ ${form.code} CREATED`); load(); setForm({code:'',name:'',description:''}); }
    else setMsg(`❌ ${res.error}`);
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;
  const coas = data?.chartOfAccounts||[];

  return (
    <ModernModuleShell title="Chart of Accounts" subtitle={`${coas.length} COA`} code="FCOA" module="FICO">
      <div className="max-w-[1600px] mx-auto p-0 space-y-3">
        {msg && <div className="bg-black text-white font-mono text-xs p-2">{msg}</div>}
        <div className="bg-white border border-black p-3">
          <div className="font-mono text-[11px] font-bold border-b border-black pb-1 mb-2">FCOA CHART_OF_ACCOUNTS_CREATE OB13 {coas.length} API: POST /api/chart-of-accounts {`{code, name, description}`}</div>
          <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
            <div><div className="text-[10px] text-zinc-500">CODE</div><input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
            <div><div className="text-[10px] text-zinc-500">NAME</div><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
            <div><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
          </div>
          <button onClick={create} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE FCOA</button>
        </div>
        <div className="grid md:grid-cols-3 gap-2">
          {coas.map((c:any)=>(
            <div key={c.code} className="bg-white border border-black p-2 font-mono text-[11px]">
              <div className="font-bold">{c.code} | {c.name} | GL_COUNT={c.gl_count}</div>
              <div className="text-[10px] text-zinc-600">DESCRIPTION={c.description}</div>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
