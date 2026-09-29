"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';

export default function Page(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');
  const [form,setForm]=useState({currency_code: "USD", exchange_rate: "83.5", valuation_date: new Date().toISOString().split('T')[0]});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/fx-valuations').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function runValuation(){
    if(!form.currency_code){ setMsg('❌ CURRENCY_CODE required – F.05 – foreign currency USD/EUR – T1 REQUIRED'); return; }
    const payload = {
      currency_code: form.currency_code,
      exchange_rate: form.exchange_rate,
      valuation_date: form.valuation_date,
      company_code: companyCode,
      action: 'RUN',
      run: true
    };
    const res = await fetch('/api/fx-valuations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ F.05 FX Valuation Run – ${form.currency_code} rate ${res.exchange_rate} – ${res.open_items_count} open items foreign ${res.total_foreign_amount} local new ${res.total_local_new} variance ${res.variance_amount} – KDM ${res.kdm_account} via OBYC – T1 REQUIRED – month-end revaluation – NO DANGLING – variance posted to universal ledger KDM exchange diff – General ERP – SAP F.05/FAGL_FC_VAL/KDM alias`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING F.05 – FX Valuation – T1 REQUIRED – Foreign Currency Valuation...</div>;
  const items = data?.fxValuations || data?.data || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">F.05 FX VALUATION RUN – GENERAL ERP – {Array.isArray(items)?items.length:0} RECORDS – T1 REQUIRED – F.05-FX-VAL + KDM + OBYC – FOREIGN CURRENCY VALUATION – NO DANGLING</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">CURRENCY_CODE * (FCYC) – General ERP Currency – foreign USD/EUR – to be revalued – must exist</div><input value={form.currency_code} onChange={e=>setForm({...form,currency_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="USD – foreign currency" /></div>
          <div><div className="text-[9px] text-zinc-500">EXCHANGE_RATE – General ERP Exchange Rate – e.g., 83.5 USD→INR – from exchange rates or manual – used for revaluation</div><input value={form.exchange_rate} onChange={e=>setForm({...form,exchange_rate:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="83.5 – USD→INR" /></div>
          <div><div className="text-[9px] text-zinc-500">VALUATION_DATE – General ERP Valuation Date – month-end date – e.g., 2026-09-30</div><input type="date" value={form.valuation_date} onChange={e=>setForm({...form,valuation_date:e.target.value})} className="w-full border-2 border-black px-1 py-1" /></div>
        </div>
        <button onClick={runValuation} className="mt-3 bg-black text-white px-3 py-1 w-full">RUN F.05 FX VALUATION – REVALUE FOREIGN CURRENCY OPEN ITEMS – KDM VIA OBYC – T1 REQUIRED</button>
        <div className="text-[9px] text-zinc-500 mt-1">T1 REQUIRED – F.05: Foreign Currency Valuation Run – At month-end, revalues foreign currency open items using exchange rates, posts variance to KDM account – Reads fin_universal_ledger where currency_code = foreign and is_reversed false – calculates totalForeign, totalLocalOld, totalLocalNew = totalForeign * exchangeRate, variance = new - old – gets KDM account via OBYC auto account lookup KDM + chart + valuation_class – posts variance to universal ledger KDM exchange diff – T1 REQUIRED – NO DANGLING – KDM fields used in FI posting – month-end close – General ERP, SAP F.05/FAGL_FC_VAL/KDM alias</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {(Array.isArray(items)?items:[]).slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2">
            <div className="font-bold">{it.valuation_number} – {it.currency_code} rate {it.exchange_rate} – foreign {it.total_foreign_amount} local {it.total_local_amount} variance {it.variance_amount} – {it.status}</div>
            <div className="text-[10px] text-zinc-600">KDM {it.kdm_account||''} via OBYC – T1 – variance posted to universal ledger</div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T1 REQUIRED – GENERAL ERP – LOW IMPORTANCE – FX VALUATION</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/fico/currencies`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FCYC Currencies – USD/EUR →</Link>
          <Link href={`/${companyCode}/fico/exchange-rates`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FEXR Exchange Rates →</Link>
          <Link href={`/${companyCode}/fico/auto-account-determination`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">OBYC Auto Account KDM →</Link>
          <Link href={`/${companyCode}/fico/universal-ledger`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FULC Universal Ledger – KDM →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">💱</div>
          <div>
            <div className="font-semibold">FX Valuation – F.05 (alias F.05) – General ERP – T1 REQUIRED – F.05-FX-VAL + KDM + OBYC</div>
            <div className="text-xs text-zinc-500">{Array.isArray(items)?items.length:0} valuations • {companyCode} • F.05 month-end revalues foreign currency open items using exchange rates, posts variance to KDM via OBYC – NO DANGLING – KDM exchange diff</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DbAutocomplete label="CURRENCY_CODE * – FCYC – foreign USD/EUR – to be revalued – T1" value={form.currency_code} onChange={v=>setForm({...form,currency_code:v})} apiUrl="/api/currencies" codeField="code" nameField="name" placeholder="USD – foreign" required createUrl={`/${companyCode}/fico/currencies`} createCode="FCYC" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium">EXCHANGE_RATE – USD→INR – e.g., 83.5 – from exchange rates</label><input value={form.exchange_rate} onChange={e=>setForm({...form,exchange_rate:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="83.5" /></div>
          <div><label className="text-[11px] font-medium">VALUATION_DATE – month-end – e.g., 2026-09-30</label><input type="date" value={form.valuation_date} onChange={e=>setForm({...form,valuation_date:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" /></div>
        </div>
        <button onClick={runValuation} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Run F.05 FX Valuation – Revalue Foreign Currency Open Items – KDM via OBYC – T1 REQUIRED</button>
        <div className="text-[10px] text-zinc-400 mt-2">T1 REQUIRED – F.05: Foreign Currency Valuation Run – At month-end, revalues foreign currency open items using exchange rates, posts variance to KDM account – Reads fin_universal_ledger where currency_code = foreign and is_reversed false – calculates totalForeign, totalLocalOld, totalLocalNew = totalForeign * exchangeRate, variance = new - old – gets KDM account via OBYC auto account lookup KDM + chart + valuation_class – posts variance to universal ledger KDM exchange diff – T1 REQUIRED – NO DANGLING – KDM fields used in FI posting – month-end close – General ERP, SAP F.05/FAGL_FC_VAL/KDM alias – chain: open items foreign → exchange rate → variance → KDM → universal ledger</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(Array.isArray(items)?items:[]).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start"><div className="font-semibold text-sm">{it.valuation_number} – {it.currency_code} rate {it.exchange_rate} – foreign {it.total_foreign_amount} local {it.total_local_amount} variance {it.variance_amount} – {it.status}</div><span className="text-[10px] bg-purple-600 text-white rounded-full px-2 py-0.5">F.05</span></div>
            <div className="mt-2 text-xs text-zinc-500">KDM via OBYC – T1 – variance posted to universal ledger – {it.text}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T1 REQUIRED – General ERP – Low Importance – FX Valuation</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/fico/currencies`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FCYC</span><span>Currencies – USD/EUR – FCYC</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/exchange-rates`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FEXR</span><span>Exchange Rates – FEXR</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/auto-account-determination`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">OBYC</span><span>Auto Account KDM – exchange diff</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/universal-ledger`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FULC</span><span>Universal Ledger – KDM – ACDOCA alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – FX Valuation, Currency, Exchange Rate, Auto Account, Universal Ledger, KDM Exchange Difference – SAP F.05/FAGL_FC_VAL/KDM/FCYC/FEXR/OBYC kept as alias – T1 REQUIRED – F.05 month-end revalues foreign currency open items using exchange rates, posts variance to KDM via OBYC – NO DANGLING – KDM fields used in FI posting – month-end close</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="FX Valuation" subtitle={`${Array.isArray(items)?items.length:0} valuations • ${companyCode} • F.05 alias F.05 – General ERP – T1 REQUIRED – F.05-FX-VAL + KDM + OBYC`} code="F.05" module="FICO" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
