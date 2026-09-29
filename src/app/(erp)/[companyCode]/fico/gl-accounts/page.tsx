"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function GlAccountsPage(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');
  const [form,setForm]=useState({coa_code:'INT', account_number:'', name:'', account_type:'EXPENSE', is_balance_sheet:'false'});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/gl-accounts').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!form.account_number || !form.name || !form.coa_code){ setMsg('COA_CODE, ACCOUNT_NUMBER, NAME required'); return; }
    const res = await fetch('/api/gl-accounts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${form.account_number} CREATED`); load(); setForm({coa_code:'INT', account_number:'', name:'', account_type:'EXPENSE', is_balance_sheet:'false'}); }
    else setMsg(`❌ ${res.error}`);
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;
  const gls = data?.glAccounts||data?.ledgerAccounts||[];

  return (
    <ModernModuleShell title="G/L Accounts" subtitle={`${gls.length} GL`} code="FGLC" module="FICO">
      <div className="max-w-[1600px] mx-auto p-0 space-y-3">
        {msg && <div className="bg-black text-white font-mono text-xs p-2">{msg}</div>}
        <div className="bg-white border border-black p-3">
          <div className="font-mono text-[11px] font-bold border-b border-black pb-1 mb-2">FGLC GL_ACCOUNT_CREATE FS00 {gls.length} API: POST /api/gl-accounts {`{coa_code, account_number, name, account_type}`}</div>
          <div className="grid grid-cols-4 gap-2 font-mono text-[11px]">
            <div><div className="text-[10px] text-zinc-500">COA_CODE</div><input value={form.coa_code} onChange={e=>setForm({...form,coa_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
            <div><div className="text-[10px] text-zinc-500">ACCOUNT_NUMBER</div><input value={form.account_number} onChange={e=>setForm({...form,account_number:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
            <div><div className="text-[10px] text-zinc-500">NAME</div><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
            <div><div className="text-[10px] text-zinc-500">ACCOUNT_TYPE</div><select value={form.account_type} onChange={e=>setForm({...form,account_type:e.target.value})} className="w-full border border-black px-1 py-1 text-xs"><option>ASSET</option><option>LIABILITY</option><option>EXPENSE</option><option>REVENUE</option><option>EQUITY</option></select></div>
          </div>
          <button onClick={create} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE FGLC</button>
        </div>
        <div className="grid md:grid-cols-3 gap-2">
          {gls.map((g:any)=>(
            <div key={g.account_number} className="bg-white border border-black p-2 font-mono text-[11px]">
              <div className="font-bold">{g.account_number} | {g.name} | COA_CODE={g.coa_code}</div>
              <div className="text-[10px] text-zinc-600">ACCOUNT_TYPE={g.account_type} IS_BALANCE_SHEET={String(g.is_balance_sheet)}</div>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
