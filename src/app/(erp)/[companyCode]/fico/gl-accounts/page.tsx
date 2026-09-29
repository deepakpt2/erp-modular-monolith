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
    if(!(form as any).account_number || !(form as any).name || !(form as any).coa_code){ setMsg('COA_CODE, ACCOUNT_NUMBER, NAME required'); return; }
    const res = await fetch('/api/gl-accounts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${(form as any).account_number} CREATED`); load(); setForm({coa_code:'INT', account_number:'', name:'', account_type:'EXPENSE', is_balance_sheet:'false'}); }
    else setMsg(`❌ ${res.error}`);
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;
  const gls = data?.glAccounts||data?.ledgerAccounts||[];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">FGLC GL_ACCOUNT_CREATE FS00 {gls.length} API: POST /api/gl-accounts {`{coa_code, account_number, name, account_type, is_balance_sheet}`}</div>
        <div className="grid grid-cols-4 gap-2">
          <div><div className="text-[9px] text-zinc-500">COA_CODE</div><input value={(form as any).coa_code} onChange={e=>setForm({...form,coa_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="COA_CODE" /></div>
          <div><div className="text-[9px] text-zinc-500">ACCOUNT_NUMBER</div><input value={(form as any).account_number} onChange={e=>setForm({...form,account_number:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="ACCOUNT_NUMBER" /></div>
          <div><div className="text-[9px] text-zinc-500">NAME</div><input value={(form as any).name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="NAME" /></div>
          <div><div className="text-[9px] text-zinc-500">ACCOUNT_TYPE</div><select value={form.account_type} onChange={e=>setForm({...form,account_type:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>ASSET</option><option>LIABILITY</option><option>EXPENSE</option><option>REVENUE</option><option>EQUITY</option></select></div>
        </div>
        <button onClick={create} className="mt-2 bg-black text-white px-3 py-1 w-full">CREATE FGLC</button>
      </div>
      <div className="grid md:grid-cols-3 gap-2">
        {gls.map((g:any)=>(
          <div key={g.account_number} className="bg-white border-2 border-black p-2">
            <div className="font-bold">{g.account_number} | {g.name} | COA_CODE={g.coa_code}</div>
            <div className="text-[10px]">ACCOUNT_TYPE={g.account_type} IS_BALANCE_SHEET={String(g.is_balance_sheet)}</div>
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
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">📒</div>
          <div>
            <div className="font-semibold">Create G/L Account – FS00</div>
            <div className="text-xs text-zinc-500">FGLC • {gls.length} accounts • API: POST /api/gl-accounts</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">COA_CODE</label>
            <input value={(form as any).coa_code} onChange={e=>setForm({...form,coa_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black uppercase" placeholder="COA_CODE" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">ACCOUNT_NUMBER</label>
            <input value={(form as any).account_number} onChange={e=>setForm({...form,account_number:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black" placeholder="ACCOUNT_NUMBER" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">NAME</label>
            <input value={(form as any).name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black" placeholder="NAME" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">ACCOUNT_TYPE</label>
            <select value={form.account_type} onChange={e=>setForm({...form,account_type:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black">
              <option>ASSET</option><option>LIABILITY</option><option>EXPENSE</option><option>REVENUE</option><option>EQUITY</option>
            </select>
          </div>
        </div>
        <button onClick={create} className="mt-5 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Create G/L Account</button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {gls.map((g:any)=>(
          <div key={g.account_number} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start">
              <div className="font-semibold text-sm">{g.account_number} • {g.name}</div>
              <span className="text-[10px] bg-zinc-900 text-white rounded-full px-2 py-0.5">{g.account_type}</span>
            </div>
            <div className="mt-2 text-xs text-zinc-500">COA_CODE: {g.coa_code} • IS_BALANCE_SHEET: {String(g.is_balance_sheet)}</div>
          </div>
        ))}
        {gls.length===0 && <div className="col-span-3 bg-white rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">No G/L accounts yet – create first via FS00</div>}
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="G/L Accounts" subtitle={`${gls.length} G/L • FS00 • FGLC`} code="FS00" module="FICO" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
