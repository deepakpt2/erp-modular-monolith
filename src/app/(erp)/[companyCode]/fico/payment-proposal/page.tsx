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
  const [form,setForm]=useState({company_code: "", payment_method: "BANK", house_bank: "SBI-001"});

  async function load(){
    setLoading(true);
    try{
      const [propRes, runRes] = await Promise.all([
        fetch('/api/payment/proposal').then(r=>r.json()),
        fetch('/api/payment/run').then(r=>r.json())
      ]);
      setData({proposals: propRes.proposals||[], due_items: propRes.due_items||[], runs: runRes.runs||[]});
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function createProposal(){
    const payload = {
      company_code: form.company_code || companyCode,
      payment_method: form.payment_method,
      house_bank: form.house_bank
    };
    const res = await fetch('/api/payment/proposal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ FPYA (legacy F110) Payment Proposal – ${res.proposal_count} vendors due – total ${res.total_amount} – company ${payload.company_code} – payment method ${form.payment_method} – house bank ${form.house_bank} – T1 REQUIRED – FPYA (legacy F110)-PROP – selects vendors due, checks payment method, bank, tolerance OBA4, payment terms FAPT, house bank FI12 – NO DANGLING – next: Payment Run FPYA (legacy F110)-RUN creates KZ docs Dr Vendor Cr Bank – DME file + advice`);
      load();
    } else setMsg('❌ '+(res.error||res.message||JSON.stringify(res)));
  }

  async function runPayment(){
    const payload = {
      company_code: form.company_code || companyCode
    };
    const res = await fetch('/api/payment/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ FPYA (legacy F110) Payment Run – ${res.run_count} payments posted – total ${res.total_amount} – company ${payload.company_code} – KZ docs ${res.run_numbers?.join(', ')} – T1 REQUIRED – FPYA (legacy F110)-RUN – creates payment docs KZ Dr Vendor Cr Bank, DME file, advice, clears AP open items, tolerance OBA4 checked, payment terms FAPT, house bank FI12 – NO DANGLING – AP automation – General ERP – SAP FPYA (legacy F110)/KZ alias`);
      load();
    } else setMsg('❌ '+(res.error||res.message||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING FPYA (legacy F110) – Payment Proposal + Run – T1 REQUIRED – Automatic Payment Program...</div>;
  const proposals = data?.proposals || [];
  const due_items = data?.due_items || [];
  const runs = data?.runs || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">FPYA (legacy F110) AUTOMATIC PAYMENT PROGRAM – PROPOSAL + RUN – GENERAL ERP – {proposals.length} PROPOSALS – {runs.length} RUNS – {due_items.length} DUE – T1 REQUIRED – FPYA (legacy F110)-FULL – NO DANGLING</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">COMPANY_CODE (ELEC ELEC (legacy OX02)) – General ERP Legal Entity – alias Company Code – defines variant</div><input value={form.company_code} onChange={e=>setForm({...form,company_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">PAYMENT_METHOD – BANK/CASH/CHEQUE – General ERP Payment Method – checks payment method per vendor</div><select value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>BANK</option><option>CASH</option><option>CHEQUE</option></select></div>
          <div><div className="text-[9px] text-zinc-500">HOUSE_BANK (FI12) – General ERP House Bank – e.g., SBI-001 – defines bank account for payment</div><input value={form.house_bank} onChange={e=>setForm({...form,house_bank:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={createProposal} className="flex-1 bg-black text-white px-3 py-1">PROPOSAL FPYA (legacy F110)-PROP – SELECT VENDORS DUE</button>
          <button onClick={runPayment} className="flex-1 bg-zinc-900 text-white px-3 py-1">RUN FPYA (legacy F110)-RUN – CREATE KZ PAYMENT DOCS</button>
        </div>
        <div className="text-[9px] text-zinc-500 mt-1">T1 REQUIRED – FPYA (legacy F110) Proposal: selects vendors due, checks payment method, bank, tolerance OBA4, payment terms FAPT, house bank FI12 – FPYA (legacy F110) Run: creates payment docs KZ Dr Vendor Cr Bank, DME file, advice, clears AP open items – tolerance OBA4 checked, payment terms FAPT, house bank FI12 – AP automation – T1 REQUIRED – NO DANGLING – payment fields used in FI posting – General ERP, SAP FPYA (legacy F110)/KZ/FI12/OBA4/FAPT alias</div>
      </div>
      <div className="grid md:grid-cols-3 gap-2">
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">DUE AP ITEMS – {due_items.length} – OPEN + due_date {'<='} today – FPYA (legacy F110) Proposal selects</div>
          {due_items.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-[10px] border-b py-1">{it.vendor_number} – {it.vendor_name} – inv {it.invoice_number} – {it.gross_amount} {it.currency} – due {it.due_date?.split('T')[0]}</div>
          ))}
        </div>
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">PROPOSALS – {proposals.length} – FPYA (legacy F110)-PROP – PROPOSED status – to be paid via RUN</div>
          {proposals.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-[10px] border-b py-1">{it.proposal_number} – {it.vendor_number} – {it.amount} {it.currency_code} – {it.payment_method} – {it.house_bank} – {it.status}</div>
          ))}
        </div>
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">RUNS – {runs.length} – FPYA (legacy F110)-RUN – POSTED – KZ docs Dr Vendor Cr Bank – DME file</div>
          {runs.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-[10px] border-b py-1">{it.run_number} – prop {it.proposal_number} – {it.amount} {it.currency_code} – {it.status} – DME {it.dme_file?.slice(0,50)}</div>
          ))}
        </div>
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T1 REQUIRED – GENERAL ERP – LOW IMPORTANCE – PAYMENT AUTOMATION</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/mm/iv`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">PIVC Invoice Verification – creates AP open →</Link>
          <Link href={`/${companyCode}/fico/tolerance-groups-cv`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">OBA4 Tolerance Vendor – checks overpay →</Link>
          <Link href={`/${companyCode}/fico/payment-terms`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FAPT Payment Terms – due date →</Link>
          <Link href={`/${companyCode}/fico/house-banks`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FI12 House Banks →</Link>
          <Link href={`/${companyCode}/fico/universal-ledger`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FULC Universal Ledger – KZ →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">💸</div>
          <div>
            <div className="font-semibold">Automatic Payment Program – FPYA (legacy F110) (alias FPYA (legacy F110)) – General ERP – T1 REQUIRED – FPYA (legacy F110)-FULL – Proposal + Run</div>
            <div className="text-xs text-zinc-500">{proposals.length} proposals • {runs.length} runs • {due_items.length} due • {companyCode} • FPYA (legacy F110) Proposal selects vendors due – checks payment method, bank, tolerance, payment terms, house bank – Run creates KZ docs Dr Vendor Cr Bank – DME file + advice – AP automation – NO DANGLING</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DbAutocomplete label="COMPANY_CODE – ELEC – Legal Entity – defines variant – OB52" value={form.company_code} onChange={v=>setForm({...form,company_code:v})} apiUrl="/api/company-codes" codeField="code" nameField="name" placeholder="" createUrl={`/${companyCode}/fico/company-master`} createCode="OX02" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium">PAYMENT_METHOD – BANK/CASH/CHEQUE – checks per vendor</label><select value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]"><option>BANK</option><option>CASH</option><option>CHEQUE</option></select></div>
          <div><label className="text-[11px] font-medium">HOUSE_BANK – FI12 – House Bank – e.g., SBI-001</label><input value={form.house_bank} onChange={e=>setForm({...form,house_bank:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={createProposal} className="flex-1 bg-zinc-900 hover:bg-black text-white rounded-full px-5 h-[32px] text-[13px] font-medium transition-colors">Proposal FPYA (legacy F110)-PROP – Select Vendors Due – Tolerance OBA4 + Payment Terms FAPT + House Bank FI12</button>
          <button onClick={runPayment} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-5 h-[32px] text-[13px] font-medium transition-colors">Run FPYA (legacy F110)-RUN – Create KZ Payment Docs – Dr Vendor Cr Bank – DME + Advice – T1</button>
        </div>
        <div className="text-[10px] text-zinc-400 mt-2">T1 REQUIRED – FPYA (legacy F110) Proposal: selects vendors due, checks payment method, bank, tolerance OBA4, payment terms FAPT, house bank FI12 – FPYA (legacy F110) Run: creates payment docs KZ Dr Vendor Cr Bank, DME file, advice, clears AP open items – tolerance OBA4 checked, payment terms FAPT, house bank FI12 – AP automation – T1 REQUIRED – NO DANGLING – payment fields used in FI posting – General ERP, SAP FPYA (legacy F110)/KZ/FI12/OBA4/FAPT alias – chain: AP open due → Proposal → Run → KZ doc → universal ledger → AP cleared</div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">Due AP Items – {due_items.length} – OPEN + due_date ≤ today</div>
          {due_items.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-xs border-b border-zinc-100 py-2">{it.vendor_number} – {it.vendor_name} – inv {it.invoice_number} – {it.gross_amount} {it.currency} – due {it.due_date?.split('T')[0]}</div>
          ))}
          {due_items.length===0 && <div className="text-xs text-zinc-400">No due items – all AP paid or not yet due</div>}
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">Proposals – {proposals.length} – FPYA (legacy F110)-PROP – PROPOSED</div>
          {proposals.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-xs border-b border-zinc-100 py-2">{it.proposal_number} – {it.vendor_number} – {it.amount} {it.currency_code} – {it.payment_method} – {it.house_bank} – {it.status}</div>
          ))}
          {proposals.length===0 && <div className="text-xs text-zinc-400">No proposals – run Proposal to select due vendors</div>}
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">Runs – {runs.length} – FPYA (legacy F110)-RUN – POSTED – KZ docs</div>
          {runs.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-xs border-b border-zinc-100 py-2">{it.run_number} – prop {it.proposal_number} – {it.amount} {it.currency_code} – {it.status}</div>
          ))}
          {runs.length===0 && <div className="text-xs text-zinc-400">No runs – run Payment Run to create KZ docs</div>}
        </div>
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T1 REQUIRED – General ERP – Low Importance – Payment Automation</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/mm/iv`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PIVC</span><span>Invoice Verification – creates AP open – PIVC (legacy MIRO) alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/tolerance-groups-cv`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">OBA4</span><span>Tolerance Vendor – checks overpay – OBA4 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/payment-terms`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FAPT</span><span>Payment Terms – due date – FAPT alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/universal-ledger`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FULC</span><span>Universal Ledger – KZ – ACDOCA alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Automatic Payment Program, Proposal, Payment Run, Vendor, AP Open Items, Due Date, Payment Method, House Bank, Tolerance, Payment Terms, DME File, Advice, KZ Document – SAP FPYA (legacy F110)/KZ/FI12/OBA4/FAPT kept as alias – T1 REQUIRED – FPYA (legacy F110) Proposal selects vendors due, checks payment method, bank, tolerance, payment terms, house bank – Run creates KZ docs Dr Vendor Cr Bank, DME file, advice, clears AP open items – NO DANGLING – AP automation</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Automatic Payment Program" subtitle={`${proposals.length} proposals • ${runs.length} runs • ${due_items.length} due • ${companyCode} • FPYA (legacy F110) alias FPYA (legacy F110) – General ERP – T1 REQUIRED – FPYA (legacy F110)-FULL`} code="F110" module="FICO" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
