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

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/gr-ir-clearing').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function clearAll(){
    const res = await fetch('/api/gr-ir-clearing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ F.13 GR/IR Clearing – ${res.cleared_count} documents cleared – total ${res.total_amount} – T1 REQUIRED – GR/IR account WRX balance zero after clearing – month-end close – NO DANGLING – GR qty = IV qty cleared – WRX cleared – universal ledger clearing entries posted – General ERP`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING F.13 – GR/IR Clearing – T1 REQUIRED – GR/IR Clearing...</div>;
  const clearings = data?.clearings || data?.data || [];
  const candidates = data?.candidates || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">F.13 GR/IR CLEARING – GENERAL ERP – {clearings.length} CLEARED – {candidates.length} CANDIDATES – T1 REQUIRED – FB08-FBRA-F13 – GR/IR CLEARING – NO DANGLING</div>
        <div className="text-[9px] text-zinc-500">F.13 – Automatic Clearing of GR/IR account – where GR qty = IV qty, clears WRX account – Without clearing, GR/IR balance never zero – audit fail – month-end requires clearing – T1 REQUIRED – NO DANGLING – GR/IR balance zero after clearing</div>
        <button onClick={clearAll} className="mt-3 bg-black text-white px-3 py-1 w-full">RUN F.13 AUTO CLEARING – CLEAR ALL CANDIDATES WHERE GR QTY = IV QTY – T1 REQUIRED</button>
        <div className="text-[9px] text-zinc-500 mt-1">T1 REQUIRED – Reads proc_goods_receipt + proc_invoice_verification where quantityReceived == quantityInvoiced and GR/IR not yet cleared – Posts clearing document: Dr WRX / Cr WRX clearing – creates clearing doc – Updates GR and IV status to CLEARED, creates universal ledger clearing entries – Used in month-end close – T1 REQUIRED – NO DANGLING – GR/IR balance zero after clearing – General ERP, SAP F.13/MR11 alias</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">CANDIDATES FOR CLEARING – {candidates.length} – GR qty = IV qty – not yet cleared</div>
          {candidates.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-[10px] border-b border-zinc-200 py-1">{it.po_number} – GR {it.gr_number} qty {it.quantity_received} – IV {it.iv_number} qty {it.quantity_invoiced} – amount {it.gr_amount || it.iv_amount}</div>
          ))}
        </div>
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">CLEARED – {clearings.length} – F.13 – WRX cleared</div>
          {clearings.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-[10px] border-b border-zinc-200 py-1">{it.clearing_number} – GR {it.gr_number} + IV {it.iv_number} PO {it.po_number} amount {it.amount} – {it.status}</div>
          ))}
        </div>
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T1 REQUIRED – GENERAL ERP – LOW IMPORTANCE – GR/IR CLEARING</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/mm/gr`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">IGRC Inventory Receipt GR 101 – creates WRX →</Link>
          <Link href={`/${companyCode}/mm/iv`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">PIVC Invoice Verification – clears WRX →</Link>
          <Link href={`/${companyCode}/fico/reversal`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FB08 Reversal + FBRA Reset →</Link>
          <Link href={`/${companyCode}/fico/universal-ledger`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FULC Universal Ledger – WRX →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">🧹</div>
          <div>
            <div className="font-semibold">GR/IR Clearing – F.13 (alias F.13) – General ERP – T1 REQUIRED – FB08-FBRA-F13</div>
            <div className="text-xs text-zinc-500">{clearings.length} cleared • {candidates.length} candidates • {companyCode} • F.13 auto clears GR/IR where GR qty = IV qty – clears WRX – month-end close – NO DANGLING – GR/IR balance zero</div>
          </div>
        </div>
        <div className="text-[11px] text-zinc-500 mb-4">F.13 – Automatic Clearing of GR/IR account – where GR qty = IV qty, clears WRX account – Without clearing, GR/IR balance never zero – audit fail – month-end requires clearing – T1 REQUIRED – NO DANGLING – GR/IR balance zero after clearing – General ERP, SAP F.13/MR11 alias</div>
        <button onClick={clearAll} className="w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 h-[32px] text-[13px] font-medium transition-colors">Run F.13 Auto Clearing – Clear All Candidates Where GR Qty = IV Qty – T1 REQUIRED – NO DANGLING</button>
        <div className="text-[10px] text-zinc-400 mt-2">T1 REQUIRED – Reads proc_goods_receipt + proc_invoice_verification where quantityReceived == quantityInvoiced and GR/IR not yet cleared – Posts clearing document: Dr WRX / Cr WRX clearing – creates clearing doc – Updates GR and IV status to CLEARED, creates universal ledger clearing entries – Used in month-end close – T1 REQUIRED – NO DANGLING – GR/IR balance zero after clearing</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">Candidates for Clearing – {candidates.length} – GR qty = IV qty – not yet cleared</div>
          {candidates.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-xs border-b border-zinc-100 py-2">{it.po_number} – GR {it.gr_number} qty {it.quantity_received} – IV {it.iv_number} qty {it.quantity_invoiced} – amount {it.gr_amount || it.iv_amount}</div>
          ))}
          {candidates.length===0 && <div className="text-xs text-zinc-400">No candidates – all GR/IR already cleared or GR qty != IV qty</div>}
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">Cleared – {clearings.length} – F.13 – WRX cleared – month-end</div>
          {clearings.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-xs border-b border-zinc-100 py-2">{it.clearing_number} – GR {it.gr_number} + IV {it.iv_number} PO {it.po_number} amount {it.amount} – {it.status}</div>
          ))}
          {clearings.length===0 && <div className="text-xs text-zinc-400">No cleared yet – run F.13 auto clearing</div>}
        </div>
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T1 REQUIRED – General ERP – Low Importance – GR/IR Clearing</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/mm/gr`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">IGRC</span><span>Inventory Receipt GR 101 – creates WRX – MIGO alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/mm/iv`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PIVC</span><span>Invoice Verification – clears WRX – MIRO alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/reversal`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FB08</span><span>Reversal + FBRA Reset – FB08/FBRA alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/universal-ledger`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FULC</span><span>Universal Ledger – WRX – ACDOCA alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – GR/IR Clearing, Inventory Receipt, Invoice Verification, Universal Ledger, WRX GR/IR Clearing, Clearing Document – SAP F.13/MR11/MIGO/MIRO/WRX kept as alias – T1 REQUIRED – F.13 auto clears GR/IR where GR qty = IV qty – clears WRX – month-end close – NO DANGLING – GR/IR balance zero after clearing – audit + trial balance</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="GR/IR Clearing" subtitle={`${clearings.length} cleared • ${candidates.length} candidates • ${companyCode} • F.13 alias F.13 – General ERP – T1 REQUIRED – FB08-FBRA-F13`} code="F.13" module="FICO" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
