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
  const [form,setForm]=useState({customer_code: "", credit_policy_area_code: "CPA-1000", credit_limit: "1000000", risk_category: "LOW"});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/credit-policy-areas').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!form.customer_code || !form.credit_policy_area_code){ setMsg('❌ CUSTOMER_CODE and CREDIT_POLICY_AREA_CODE required – FD32 – General ERP Customer Credit Master – T1 REQUIRED – credit limit checked on SO'); return; }
    const payload = {
      code: form.credit_policy_area_code,
      name: `Credit Area ${form.credit_policy_area_code}`,
      customer_code: form.customer_code,
      credit_limit: form.credit_limit,
      risk_category: form.risk_category,
      company_code: companyCode
    };
    const res = await fetch('/api/credit-policy-areas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ Credit Master FD32 for customer ${form.customer_code} in policy area ${form.credit_policy_area_code} created – limit ${form.credit_limit} risk ${form.risk_category} – T1 REQUIRED – FD32 + OVA8 – NO DANGLING – used in SO credit check: exposure = open SO ${res.exposure||'calc'} + delivery + billing + AR vs limit ${form.credit_limit} → block/warning – prevents selling to bankrupt customer – General ERP`);
      load();
      setForm({customer_code: "", credit_policy_area_code: "CPA-1000", credit_limit: "1000000", risk_category: "LOW"});
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING FD32 – Customer Credit Master – General ERP – T1 REQUIRED – Credit Check...</div>;
  const policyAreas = data?.creditPolicyAreas || data?.data || [];
  const creditMasters = data?.creditMasters || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">FD32 CUSTOMER CREDIT MASTER CREATE – GENERAL ERP – ALIAS FD32 – {creditMasters.length} RECORDS – T1 REQUIRED – FD32 + OVA8 + OB45 – CREDIT LIMIT CHECK ON SO – NO DANGLING</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">CUSTOMER_CODE * (SCUC XD01) – General ERP Customer – must exist – FD32 credit master per credit control area</div><input value={form.customer_code} onChange={e=>setForm({...form,customer_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">CREDIT_POLICY_AREA_CODE * (FCPC OB45) – General ERP Credit Policy Area – alias Credit Control Area – defines credit control boundary</div><input value={form.credit_policy_area_code} onChange={e=>setForm({...form,credit_policy_area_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">CREDIT_LIMIT * – General ERP Credit Limit – e.g., 1000000 – FD32 – used in SO credit check exposure vs limit</div><input value={form.credit_limit} onChange={e=>setForm({...form,credit_limit:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">RISK_CATEGORY – LOW/MEDIUM/HIGH – General ERP Risk Category – determines block/warning – OVA8 reaction A warning B error C block</div><select value={form.risk_category} onChange={e=>setForm({...form,risk_category:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></div>
        </div>
        <button onClick={create} className="mt-3 bg-black text-white px-3 py-1 w-full">CREATE CREDIT MASTER FD32 – T1 REQUIRED – CREDIT CHECK ON SO – NO DANGLING</button>
        <div className="text-[9px] text-zinc-500 mt-1">T1 REQUIRED – FD32 Customer Credit Master: customer_code + credit_policy_area_code → credit_limit + risk_category + credit_exposure – OVA8 automatic credit check: static/dynamic, reaction A warning B error C block – SO creation checks exposure = open SO + open delivery + open billing + open AR (universal ledger) vs limit → block/warning – prevents selling to bankrupt customer – NO DANGLING – General ERP, SAP FD32/OB45/OVA8 alias – used in VA01-FULL pricing + credit check</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {creditMasters.slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2">
            <div className="font-bold">{it.customer_code} – {it.credit_policy_area_code} – limit {it.credit_limit} – risk {it.risk_category} – exposure {it.credit_exposure}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T1 REQUIRED – GENERAL ERP – LOW IMPORTANCE – CREDIT CHECK</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/foundation/customers`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SCUC Customer – required →</Link>
          <Link href={`/${companyCode}/foundation/credit-policy-areas`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FCPC Credit Policy Area OB45 – required →</Link>
          <Link href={`/${companyCode}/sales`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SSOC Sales Order checks FD32 →</Link>
          <Link href={`/${companyCode}/sd/delivery`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SDLC Delivery exposure →</Link>
          <Link href={`/${companyCode}/sd/billing`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SBLC Billing exposure →</Link>
          <Link href={`/${companyCode}/fico/universal-ledger`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FULC AR exposure →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center">💳</div>
          <div>
            <div className="font-semibold">Customer Credit Master – FD32 (alias FD32) – General ERP – T1 REQUIRED – FD32 + OVA8 + OB45 – Credit Check</div>
            <div className="text-xs text-zinc-500">{creditMasters.length} credit masters • {policyAreas.length} policy areas • {companyCode} • FD32 credit limit per customer+credit control area – OVA8 automatic credit check static/dynamic reaction A/B/C – SO VA01 checks exposure vs limit – NO DANGLING – prevents bankrupt sales</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DbAutocomplete label="CUSTOMER_CODE * – SCUC – General ERP Customer – XD01 alias – must exist – FD32" value={form.customer_code} onChange={v=>setForm({...form,customer_code:v})} apiUrl="/api/business-partners?role=CUSTOMER" codeField="account_number" nameField="display_name" placeholder="" required createUrl={`/${companyCode}/foundation/customers`} createCode="SCUC" companyCode={companyCode} />
          <DbAutocomplete label="CREDIT_POLICY_AREA_CODE * – FCPC – OB45 alias – Credit Control Area – defines boundary" value={form.credit_policy_area_code} onChange={v=>setForm({...form,credit_policy_area_code:v})} apiUrl="/api/credit-policy-areas" codeField="code" nameField="name" placeholder="" required createUrl={`/${companyCode}/foundation/credit-policy-areas`} createCode="FCPC" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">CREDIT_LIMIT * – FD32 – 1000000 – used in SO credit check exposure vs limit</label><input value={form.credit_limit} onChange={e=>setForm({...form,credit_limit:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">RISK_CATEGORY – LOW/MEDIUM/HIGH – OVA8 reaction</label><select value={form.risk_category} onChange={e=>setForm({...form,risk_category:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></div>
        </div>
        <button onClick={create} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Create Credit Master FD32 – T1 REQUIRED – Credit Check OVA8 – NO DANGLING</button>
        <div className="text-[10px] text-zinc-400 mt-2">T1 REQUIRED – FD32 Customer Credit Master: customer_code + credit_policy_area_code → credit_limit + risk_category + credit_exposure – OVA8 automatic credit check: static/dynamic, reaction A warning B error C block – SO creation checks exposure = open SO + open delivery + open billing + open AR (universal ledger) vs limit → block/warning – prevents selling to bankrupt customer – NO DANGLING – General ERP, SAP FD32/OB45/OVA8 alias – used in VA01-FULL pricing + credit check</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {creditMasters.map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start"><div className="font-semibold text-sm">{it.customer_code} – {it.credit_policy_area_code} – limit {it.credit_limit} – risk {it.risk_category} – exposure {it.credit_exposure}</div><span className="text-[10px] bg-red-600 text-white rounded-full px-2 py-0.5">FD32</span></div>
            <div className="mt-2 text-xs text-zinc-500">T1 REQUIRED – FD32 credit master – exposure = SO+DL+BL+AR vs limit – OVA8 reaction – NO DANGLING</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T1 REQUIRED – General ERP – Low Importance – Credit Check</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/foundation/customers`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SCUC</span><span>Customer – required – XD01 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/credit-policy-areas`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FCPC</span><span>Credit Policy Area – OB45 alias – required</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/sales`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SSOC</span><span>Sales Order checks FD32 OVA8 – VA01 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/sd/delivery`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SDLC</span><span>Delivery exposure – VL01N alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/sd/billing`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SBLC</span><span>Billing exposure – VF01 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/universal-ledger`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FULC</span><span>AR exposure – ACDOCA alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Customer Credit Master, Credit Policy Area, Credit Control Area, Credit Limit, Risk Category, Exposure, Sales Order, Delivery, Billing, AR – SAP FD32/OB45/OVA8/FD32/VA01/VL01N/VF01 kept as alias – T1 REQUIRED – FD32 credit master per customer+credit control area – OVA8 automatic credit check static/dynamic reaction A warning B error C block – SO VA01 checks exposure = open SO+delivery+billing+AR vs limit – NO DANGLING – prevents selling to bankrupt customer</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Customer Credit Master" subtitle={`${creditMasters.length} credit masters • ${policyAreas.length} policy areas • ${companyCode} • FD32 alias FD32 – General ERP – T1 REQUIRED – FD32 + OVA8 + OB45`} code="FD32" module="FICO" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
