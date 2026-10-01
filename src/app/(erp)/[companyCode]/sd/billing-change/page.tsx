"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function Page(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');
  const [form,setForm]=useState({billing_number: "", action: "VF02", payment_terms: "", billing_date: "", billing_type: "F2"});
  const [due,setDue]=useState<any[]>([]);

  async function load(){
    setLoading(true);
    try{
      const [billRes, dueRes] = await Promise.all([
        fetch('/api/billing').then(r=>r.json()),
        fetch('/api/billing/change?action=VF04').then(r=>r.json())
      ]);
      setData(billRes);
      setDue(dueRes.due_list || []);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function submit(){
    if(!form.billing_number && form.action !== 'VF04'){ setMsg('❌ BILLING_NUMBER required – VF02/VF11/G2/L2/RE – T1 REQUIRED'); return; }
    const payload = { billing_number: form.billing_number, action: form.action, payment_terms: form.payment_terms, billing_date: form.billing_date, billing_type: form.billing_type };
    const res = await fetch('/api/billing/change',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ ${form.action} – billing ${form.billing_number || res.billing_number} – ${res.message} – T1 REQUIRED – NO DANGLING – billing fields used in AR + FI + delivery – General ERP – SAP VF02/VF04/VF11/G2/L2/RE alias`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING VF02 – Billing Change – T1 REQUIRED...</div>;
  const billings = data?.billings || data?.data || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">VF02 CHANGE BILLING + VF04 DUE LIST + VF11 CANCEL + G2/L2/RE – GENERAL ERP – {billings.length} BILLINGS – {due.length} DUE – T1 REQUIRED – VF02-VF03-VF04-VF11-G2-L2-RE – NO DANGLING</div>
        <div className="grid grid-cols-5 gap-2">
          <div><div className="text-[9px] text-zinc-500">BILLING_NUMBER * – BL-xxx – for VF02/VF11/G2/L2/RE</div><input value={form.billing_number} onChange={e=>setForm({...form,billing_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">ACTION – VF02 Change, VF11 Cancel, G2 Credit Memo, L2 Debit Memo, RE Correction</div><select value={form.action} onChange={e=>setForm({...form,action:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>VF02</option><option>VF11</option><option>G2</option><option>L2</option><option>RE</option><option>VF04</option></select></div>
          <div><div className="text-[9px] text-zinc-500">PAYMENT_TERMS – e.g., NT30 – for VF02</div><input value={form.payment_terms} onChange={e=>setForm({...form,payment_terms:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">BILLING_DATE – e.g., 2026-09-30 – for VF02</div><input type="date" value={form.billing_date} onChange={e=>setForm({...form,billing_date:e.target.value})} className="w-full border-2 border-black px-1 py-1" /></div>
          <div><div className="text-[9px] text-zinc-500">BILLING_TYPE – F2 Invoice, G2 Credit Memo, L2 Debit Memo, RE Correction</div><select value={form.billing_type} onChange={e=>setForm({...form,billing_type:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>F2</option><option>G2</option><option>L2</option><option>RE</option></select></div>
        </div>
        <button onClick={submit} className="mt-3 bg-black text-white px-3 py-1 w-full">SUBMIT VF02 CHANGE / VF11 CANCEL / G2 L2 RE MEMO – T1 REQUIRED – BILLING CHANGE + CANCEL + MEMO</button>
        <div className="text-[9px] text-zinc-500 mt-1">T1 REQUIRED – VF02: Change billing doc – update payment terms, billing date – VF03: Display – GET /api/billing – VF04: Billing Due List – deliveries with PGI but not yet billed – VF11: Cancel Billing – reverse billing doc + FI reversal + restore delivery billing status – G2: Credit Memo, L2: Debit Memo, RE: Invoice correction – billing types – NO DANGLING – billing fields used in AR + FI + delivery – General ERP, SAP VF02/VF03/VF04/VF11/G2/L2/RE alias – chain: delivery GOODS_ISSUED → billing due VF04 → billing create SBLC (legacy VF01) → change VF02 → cancel VF11 → credit memo G2 / debit memo L2 / correction RE</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">BILLINGS – {billings.length} – SBLC – status CREATED/CANCELLED – F2/G2/L2/RE</div>
          {billings.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-[10px] border-b py-1">{it.billing_number} – delivery {it.delivery_number} – SO {it.sales_number} – {it.customer_number} – {it.total_amount} – {it.billing_type} – {it.status}</div>
          ))}
        </div>
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">DUE LIST VF04 – {due.length} – deliveries GOODS_ISSUED not yet billed – T1</div>
          {due.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-[10px] border-b py-1">{it.delivery_number} – SO {it.sales_number} – {it.customer_number} – qty {it.total_quantity} – {it.status} – billings {it.billing_count}</div>
          ))}
        </div>
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T1 REQUIRED – GENERAL ERP – LOW IMPORTANCE – BILLING</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/sd/delivery`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SDLC Delivery – PGI →</Link>
          <Link href={`/${companyCode}/sd/billing`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SBLC Billing Create SBLC (legacy VF01) →</Link>
          <Link href={`/${companyCode}/fico/universal-ledger`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FULC Universal Ledger – AR →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">🧾</div>
          <div>
            <div className="font-semibold">Billing Change – VF02 (alias VF02) + VF04 Due List + VF11 Cancel + G2/L2/RE – General ERP – T1 REQUIRED – VF02-VF03-VF04-VF11-G2-L2-RE</div>
            <div className="text-xs text-zinc-500">{billings.length} billings • {due.length} due • {companyCode} • VF02 change billing – payment terms, billing date – VF04 billing due list – deliveries PGI not yet billed – VF11 cancel billing – reverse FI + restore delivery – G2 Credit Memo, L2 Debit Memo, RE Correction – NO DANGLING</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div><label className="text-[11px] font-medium">BILLING_NUMBER * – BL-xxx – for VF02/VF11/G2/L2/RE</label><input value={form.billing_number} onChange={e=>setForm({...form,billing_number:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">ACTION – VF02/VF11/G2/L2/RE/VF04</label><select value={form.action} onChange={e=>setForm({...form,action:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]"><option>VF02</option><option>VF11</option><option>G2</option><option>L2</option><option>RE</option><option>VF04</option></select></div>
          <div><label className="text-[11px] font-medium">PAYMENT_TERMS – NT30 – for VF02</label><input value={form.payment_terms} onChange={e=>setForm({...form,payment_terms:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">BILLING_DATE – 2026-09-30 – for VF02</label><input type="date" value={form.billing_date} onChange={e=>setForm({...form,billing_date:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]" /></div>
          <div><label className="text-[11px] font-medium">BILLING_TYPE – F2/G2/L2/RE</label><select value={form.billing_type} onChange={e=>setForm({...form,billing_type:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]"><option>F2</option><option>G2</option><option>L2</option><option>RE</option></select></div>
        </div>
        <button onClick={submit} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 h-[32px] text-[13px] font-medium transition-colors">Submit VF02 Change / VF11 Cancel / G2 L2 RE Memo – T1 REQUIRED – Billing Change + Cancel + Memo – NO DANGLING</button>
        <div className="text-[10px] text-zinc-400 mt-2">T1 REQUIRED – VF02: Change billing doc – update payment terms, billing date – VF03: Display – GET /api/billing – VF04: Billing Due List – deliveries with PGI but not yet billed – VF11: Cancel Billing – reverse billing doc + FI reversal + restore delivery billing status – G2: Credit Memo, L2: Debit Memo, RE: Invoice correction – billing types – NO DANGLING – billing fields used in AR + FI + delivery – General ERP, SAP VF02/VF03/VF04/VF11/G2/L2/RE alias – chain: delivery GOODS_ISSUED → billing due VF04 → billing create SBLC (legacy VF01) → change VF02 → cancel VF11 → credit memo G2 / debit memo L2 / correction RE</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">Billings – {billings.length} – SBLC – status CREATED/CANCELLED – F2/G2/L2/RE</div>
          {billings.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-xs border-b border-zinc-100 py-2">{it.billing_number} – delivery {it.delivery_number} – SO {it.sales_number} – {it.customer_number} – {it.total_amount} – {it.billing_type} – {it.status}</div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">Due List VF04 – {due.length} – deliveries GOODS_ISSUED not yet billed</div>
          {due.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-xs border-b border-zinc-100 py-2">{it.delivery_number} – SO {it.sales_number} – {it.customer_number} – qty {it.total_quantity} – {it.status} – billings {it.billing_count}</div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T1 REQUIRED – General ERP – Low Importance – Billing</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/sd/delivery`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SDLC</span><span>Delivery – PGI – SDLC (legacy VL01N) alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/sd/billing`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SBLC</span><span>Billing Create – SBLC (legacy VF01) – FIN-BL-CR alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/universal-ledger`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FULC</span><span>Universal Ledger – AR – ACDOCA alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Billing Change, Billing Due List, Cancel Billing, Credit Memo, Debit Memo, Invoice Correction, Payment Terms, Billing Date, Billing Type – SAP VF02/VF03/VF04/VF11/G2/L2/RE/SBLC (legacy VF01) kept as alias – T1 REQUIRED – VF02 change, VF04 due list, VF11 cancel, G2 credit memo, L2 debit memo, RE correction – NO DANGLING – billing fields used in AR + FI + delivery</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Billing Change" subtitle={`${billings.length} billings • ${due.length} due • ${companyCode} • VF02 alias VF02 + VF04 + VF11 + G2/L2/RE – General ERP – T1 REQUIRED – VF02-VF03-VF04-VF11-G2-L2-RE`} code="VF02" module="SD" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
