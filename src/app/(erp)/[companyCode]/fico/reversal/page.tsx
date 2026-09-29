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
  const [form,setForm]=useState({document_number: "", reversal_reason: "01", action: "REVERSE"});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/universal-ledger/reversal').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function reverse(){
    if(!form.document_number){ setMsg('❌ DOCUMENT_NUMBER required – FB08 – FI doc to reverse – T1 REQUIRED'); return; }
    const payload = {
      document_number: form.document_number,
      reversal_reason: form.reversal_reason,
      company_code: companyCode,
      action: form.action
    };
    const res = await fetch('/api/universal-ledger/reversal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ ${res.code} – ${res.message} – T1 REQUIRED – FB08 Reversal ${form.document_number} → ${res.reversal_document} reason ${form.reversal_reason} – creates reversal doc with opposite Dr/Cr, marks original as reversed, posts reversal to universal ledger – immutable audit trail – NO DANGLING – audit + trial balance – General ERP`);
      load();
      setForm({document_number: "", reversal_reason: "01", action: "REVERSE"});
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING FB08 – Document Reversal – T1 REQUIRED – FB08+FBRA+F.13...</div>;
  const reversals = data?.reversals || [];
  const resets = data?.resets || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">FB08 DOCUMENT REVERSAL + FBRA RESET CLEARING – GENERAL ERP – {reversals.length+resets.length} RECORDS – T1 REQUIRED – FB08-FBRA-F13 – REVERSAL + CLEARING RESET – NO DANGLING</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">DOCUMENT_NUMBER * (FULC) – General ERP FI doc to reverse – e.g., FI-1000000001 – must exist</div><input value={form.document_number} onChange={e=>setForm({...form,document_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">REVERSAL_REASON – 01 Reversal in current period, 02 Reversal in closed period – OBA7 reversal reason</div><select value={form.reversal_reason} onChange={e=>setForm({...form,reversal_reason:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>01</option><option>02</option><option>03</option></select></div>
          <div><div className="text-[9px] text-zinc-500">ACTION – REVERSE FB08 or RESET FBRA – FB08 reverses FI doc, FBRA resets clearing</div><select value={form.action} onChange={e=>setForm({...form,action:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>REVERSE</option><option>RESET</option></select></div>
        </div>
        <button onClick={reverse} className="mt-3 bg-black text-white px-3 py-1 w-full">REVERSE FB08 / RESET FBRA – T1 REQUIRED – REVERSAL + CLEARING RESET</button>
        <div className="text-[9px] text-zinc-500 mt-1">T1 REQUIRED – FB08: Reverses FI doc – creates reversal document with opposite debit/credit, marks original as reversed, posts reversal to universal ledger – FBRA: Resets clearing – resets cleared status of AR/AP open items, creates reversal of clearing doc – Used in month-end close + audit – T1 REQUIRED – NO DANGLING – reversal fields used in audit trail + trial balance – General ERP, SAP FB08/FBRA alias</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {reversals.slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2"><div className="font-bold">{it.reversal_number} – orig {it.original_document_number} – reason {it.reversal_reason} – {it.status}</div></div>
        ))}
        {resets.slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2"><div className="font-bold">{it.reset_number} – clearing {it.original_clearing_number} – reason {it.reversal_reason} – {it.status}</div></div>
        ))}
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T1 REQUIRED – GENERAL ERP – LOW IMPORTANCE – REVERSAL + CLEARING</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/fico/universal-ledger`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FULC Universal Ledger – original doc →</Link>
          <Link href={`/${companyCode}/fico/gr-ir-clearing`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">F.13 GR/IR Clearing →</Link>
          <Link href={`/${companyCode}/fico/document-types`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">OBA7 Document Types – reversal reason →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">↩️</div>
          <div>
            <div className="font-semibold">Document Reversal – FB08 (alias FB08) + FBRA Reset Clearing – General ERP – T1 REQUIRED – FB08-FBRA-F13</div>
            <div className="text-xs text-zinc-500">{reversals.length+resets.length} reversals/resets • {companyCode} • FB08 reverses FI doc with reversal reason – creates reversal doc opposite Dr/Cr – FBRA resets clearing – GR/IR clearing reset – month-end + audit – NO DANGLING</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DbAutocomplete label="DOCUMENT_NUMBER * – FULC – FI doc to reverse – must exist – FB08" value={form.document_number} onChange={v=>setForm({...form,document_number:v})} apiUrl="/api/universal-ledger" codeField="document_number" nameField="text" placeholder="" required createUrl={`/${companyCode}/fico/universal-ledger`} createCode="FULC" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium">REVERSAL_REASON – 01 current period, 02 closed period – OBA7</label><select value={form.reversal_reason} onChange={e=>setForm({...form,reversal_reason:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"><option>01</option><option>02</option><option>03</option></select></div>
          <div><label className="text-[11px] font-medium">ACTION – REVERSE FB08 or RESET FBRA</label><select value={form.action} onChange={e=>setForm({...form,action:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"><option>REVERSE</option><option>RESET</option></select></div>
        </div>
        <button onClick={reverse} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Reverse FB08 / Reset FBRA – T1 REQUIRED – Reversal + Clearing Reset – NO DANGLING</button>
        <div className="text-[10px] text-zinc-400 mt-2">T1 REQUIRED – FB08: Reverses FI doc – creates reversal document with opposite debit/credit, marks original as reversed, posts reversal to universal ledger – FBRA: Resets clearing – resets cleared status of AR/AP open items, creates reversal of clearing doc – Used in month-end close + audit – T1 REQUIRED – NO DANGLING – reversal fields used in audit trail + trial balance – General ERP, SAP FB08/FBRA alias – chain: original doc → reversal doc → audit trail</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {reversals.map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start"><div className="font-semibold text-sm">{it.reversal_number} – orig {it.original_document_number} – reason {it.reversal_reason} – {it.status}</div><span className="text-[10px] bg-zinc-900 text-white rounded-full px-2 py-0.5">FB08</span></div>
            <div className="mt-2 text-xs text-zinc-500">FB08 Reversal – {it.original_document_number} → {it.reversal_number} – immutable audit trail – NO DANGLING</div>
          </div>
        ))}
        {resets.map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start"><div className="font-semibold text-sm">{it.reset_number} – clearing {it.original_clearing_number} – reason {it.reversal_reason} – {it.status}</div><span className="text-[10px] bg-orange-600 text-white rounded-full px-2 py-0.5">FBRA</span></div>
            <div className="mt-2 text-xs text-zinc-500">FBRA Reset Clearing – {it.original_clearing_number} reset – open items reset – NO DANGLING</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T1 REQUIRED – General ERP – Low Importance – Reversal + Clearing</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/fico/universal-ledger`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FULC</span><span>Universal Ledger – original doc – ACDOCA alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/gr-ir-clearing`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">F.13</span><span>GR/IR Clearing – F.13 – MR11 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/document-types`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">OBA7</span><span>Document Types – reversal reason</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Document Reversal, Reset Clearing, GR/IR Clearing, Universal Ledger, Document Type, Reversal Reason – SAP FB08/FBRA/F.13/OBA7 kept as alias – T1 REQUIRED – FB08 reverses FI doc with opposite Dr/Cr + audit trail, FBRA resets clearing, F.13 auto clears GR/IR where GR qty = IV qty – month-end close – NO DANGLING – reversal fields used in audit trail + trial balance</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Document Reversal" subtitle={`${reversals.length+resets.length} reversals/resets • ${companyCode} • FB08 alias FB08 + FBRA – General ERP – T1 REQUIRED – FB08-FBRA-F13`} code="FB08" module="FICO" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
