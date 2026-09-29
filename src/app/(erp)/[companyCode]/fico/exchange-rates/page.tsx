"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';

export default function Page(){
  const params = useParams();
  const searchParams = useSearchParams();
  const companyCode = params.companyCode as string;
  const focus = searchParams.get('focus') || 'FEXC';
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');
  const [form,setForm]=useState({from_currency: "", to_currency: "", rate: "", valid_from: ""});
  const [highlighted,setHighlighted]=useState(focus);

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/exchange-rates').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!(form as any).from_currency){ setMsg('FROM_CURRENCY required'); return; }
    const payload = {...form, company_code: companyCode};
    const res = await fetch('/api/exchange-rates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success || res.id || !res.error){ setMsg('✅ '+((form as any).code||'CREATED')+' CREATED – FEXC'); load(); setForm({from_currency: "", to_currency: "", rate: "", valid_from: ""}); }
    else setMsg('❌ '+(res.error||'Failed'));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING FEXC...</div>;
  const items = data?.data || data?.fiscalCalendars || data?.rates || data?.ranges || data?.items || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">FEXC EXCHANGE RATES CREATE – API: POST /api/exchange-rates – {Array.isArray(items)?items.length:0} RECORDS – Currency conversion rates INR→USD etc – autocomplete from DB</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">FROM_CURRENCY</div><input value={(form as any).from_currency} onChange={e=>setForm({...form,from_currency:e.target.value})} className="w-full border-2 border-black px-1 py-1 " placeholder="FROM_CURRENCY" /></div>
          <div><div className="text-[9px] text-zinc-500">TO_CURRENCY</div><input value={(form as any).to_currency} onChange={e=>setForm({...form,to_currency:e.target.value})} className="w-full border-2 border-black px-1 py-1 " placeholder="TO_CURRENCY" /></div>
          <div><div className="text-[9px] text-zinc-500">RATE</div><input value={(form as any).rate} onChange={e=>setForm({...form,rate:e.target.value})} className="w-full border-2 border-black px-1 py-1 " placeholder="RATE" /></div>
          <div><div className="text-[9px] text-zinc-500">VALID_FROM</div><input value={(form as any).valid_from} onChange={e=>setForm({...form,valid_from:e.target.value})} className="w-full border-2 border-black px-1 py-1 " placeholder="VALID_FROM" /></div>
        </div>
        <button onClick={create} className="mt-2 bg-black text-white px-3 py-1 w-full">CREATE</button>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {(Array.isArray(items)?items:[]).slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2">
            <div className="font-bold">{it.code||it.object_type||JSON.stringify(it).slice(0,80)}</div>
            <div className="text-[10px]">{Object.entries(it).slice(0,4).map(([k,v])=>k.toUpperCase()+'='+String(v)).join(' ')}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}

      <div className="bg-white rounded-2xl border-2 border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-mono font-bold text-xs">FEXC</div>
          <div>
            <div className="font-semibold flex items-center gap-2">Exchange Rates – FEXC <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5">Previously missing – now has form</span></div>
            <div className="text-xs text-zinc-500">{Array.isArray(items)?items.length:0} records • COMPANY_CODE {companyCode} • API: POST /api/exchange-rates • Currency conversion rates INR→USD etc – autocomplete from DB</div>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-zinc-500 bg-zinc-50 rounded-xl p-3">
          All codes must have a form – user must always find specific form for specific code – FEXC now has dedicated form with easy identification via code badge and highlight. Autocomplete from DB only prevents invalid data like K6.
        </div>
      </div>

      <div id="form-FEXC" className="bg-white rounded-2xl border-2 border-black shadow-sm p-6 scroll-mt-24">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">📅</div>
          <div>
            <div className="font-semibold">Create Exchange Rates – FEXC</div>
            <div className="text-xs text-zinc-500">{Array.isArray(items)?items.length:0} records • Currency conversion rates INR→USD etc – autocomplete from DB</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DbAutocomplete
            label="FROM_CURRENCY *"
            value={(form as any).from_currency}
            onChange={v=>setForm({...form,from_currency:v})}
            apiUrl="/api/currencies"
            codeField="code"
            nameField="name"
            placeholder="FROM_CURRENCY"
            required
            createUrl={`/${companyCode}/fico/currencies`}
            createCode="FCYC"
            companyCode={companyCode}
          />
          <DbAutocomplete
            label="TO_CURRENCY *"
            value={(form as any).to_currency}
            onChange={v=>setForm({...form,to_currency:v})}
            apiUrl="/api/currencies"
            codeField="code"
            nameField="name"
            placeholder="TO_CURRENCY"
            required
            createUrl={`/${companyCode}/fico/currencies`}
            createCode="FCYC"
            companyCode={companyCode}
          />
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">RATE *</label>
            <input value={(form as any).rate} onChange={e=>setForm({...form,rate:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black uppercase" placeholder="RATE" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">VALID_FROM </label>
            <input value={(form as any).valid_from} onChange={e=>setForm({...form,valid_from:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black " placeholder="VALID_FROM" />
          </div>
        </div>
        <button onClick={create} className="mt-5 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Create FEXC</button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {(Array.isArray(items)?items:[]).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start">
              <div className="font-semibold text-sm">{it.code||it.object_type||'RECORD '+(idx+1)}</div>
              <span className="text-[10px] bg-zinc-900 text-white rounded-full px-2 py-0.5">FEXC</span>
            </div>
            <div className="mt-2 text-xs text-zinc-500">{Object.entries(it).slice(0,5).map(([k,v])=>`${k.toUpperCase()}: ${String(v)}`).join(' • ')}</div>
            <div className="mt-2 text-[10px] text-emerald-600">✓ Valid – exists in DB – autocomplete will show this</div>
          </div>
        ))}
        {(!items || items.length===0) && (
          <div className="col-span-3 bg-white rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
            <div className="text-sm text-zinc-500">No records yet – create first via FEXC</div>
            <div className="text-xs text-zinc-400 mt-1">COMPANY_CODE {companyCode} • Function is destination • Code is helper</div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-5">
        <div className="text-xs font-medium">Related Codes – Easy navigation</div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <a href={`/${companyCode}/fico/posting-period?focus=FEXC`} className="border rounded-full px-3 py-1 hover:bg-black hover:text-white">Posting Period – All Financial Codes</a>
          <a href={`/${companyCode}/foundation/enterprise-structure?focus=ELEC`} className="border rounded-full px-3 py-1 hover:bg-black hover:text-white">ELEC Legal Entity – uses FEXC if FFYC</a>
          <a href={`/${companyCode}/fico/currencies`} className="border rounded-full px-3 py-1 hover:bg-black hover:text-white">FCYC Currencies</a>
        </div>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Exchange Rates" subtitle={`${Array.isArray(items)?items.length:0} records • ${companyCode} • FEXC • Currency conversion rates INR→USD etc – autocomplete from DB`} code="FEXC" module="FICO" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
