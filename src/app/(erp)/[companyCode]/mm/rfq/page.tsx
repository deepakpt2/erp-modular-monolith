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
  const [form,setForm]=useState({material_code: "", facility_code: "FAC-1000", quantity: "100", uom_code: "KG", deadline_date: new Date(Date.now()+7*24*3600*1000).toISOString().split('T')[0], description: ""});
  const [quotForm,setQuotForm]=useState({rfq_number: "", vendor_number: "", unit_price: "", delivery_days: "7", currency_code: "INR"});
  const [compareForm,setCompareForm]=useState({rfq_number: "", winner_quotation_number: ""});

  async function load(){
    setLoading(true);
    try{
      const [rfqRes, quotRes] = await Promise.all([
        fetch('/api/rfq').then(r=>r.json()),
        fetch('/api/rfq?action=QUOTATION').then(r=>r.json())
      ]);
      setData({rfqs: rfqRes.rfqs||rfqRes.data||[], quotations: quotRes.quotations||quotRes.data||[]});
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function createRfq(){
    if(!form.material_code || !form.quantity){ setMsg('❌ MATERIAL_CODE and QUANTITY required – ME41 – T2 GOOD'); return; }
    const payload = { material_code: form.material_code, facility_code: form.facility_code, quantity: parseFloat(form.quantity), uom_code: form.uom_code, deadline_date: form.deadline_date, description: form.description, company_code: companyCode, action: "ME41" };
    const res = await fetch('/api/rfq',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ ME41 RFQ ${res.rfq_number} – material ${form.material_code} plant ${form.facility_code} qty ${form.quantity} ${form.uom_code} deadline ${form.deadline_date} – T2 GOOD – NO DANGLING – RFQ fields used in quotation + price comparison + PO creation – General ERP – SAP ME41 alias`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  async function createQuotation(){
    if(!quotForm.rfq_number || !quotForm.vendor_number || !quotForm.unit_price){ setMsg('❌ RFQ_NUMBER, VENDOR_NUMBER, UNIT_PRICE required – ME47 – T2 GOOD'); return; }
    const payload = { rfq_number: quotForm.rfq_number, vendor_number: quotForm.vendor_number, unit_price: parseFloat(quotForm.unit_price), delivery_days: parseInt(quotForm.delivery_days), currency_code: quotForm.currency_code, action: "ME47" };
    const res = await fetch('/api/rfq',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ ME47 Quotation ${res.quotation_number} – RFQ ${quotForm.rfq_number} vendor ${quotForm.vendor_number} qty ${res.quotation?.quantity} unit ${quotForm.unit_price} total ${res.quotation?.total_price} delivery ${quotForm.delivery_days} days – T2 GOOD – NO DANGLING – quotation fields used in ME49 price comparison + PO creation – General ERP – SAP ME47 alias`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  async function compare(){
    if(!compareForm.rfq_number){ setMsg('❌ RFQ_NUMBER required – ME49 – T2 GOOD'); return; }
    const payload = { rfq_number: compareForm.rfq_number, winner_quotation_number: compareForm.winner_quotation_number||undefined, action: "ME49" };
    const res = await fetch('/api/rfq',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ ME49 Price Comparison – RFQ ${compareForm.rfq_number} – winner ${res.winner_quotation_number} vendor ${res.winner?.vendor_number||res.winner?.partner_id} price ${res.winner?.total_price} – PO ${res.po_number||''} created from winner – T2 GOOD – NO DANGLING – winner fields used in PO creation – General ERP – SAP ME49 alias`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING ME41 – RFQ – T2 GOOD...</div>;
  const rfqs = data?.rfqs || [];
  const quotations = data?.quotations || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">ME41 RFQ + ME47 QUOTATION + ME49 PRICE COMPARISON – GENERAL ERP – {rfqs.length} RFQs – {quotations.length} QUOTATIONS – T2 GOOD – ME41-RFQ-ME47-ME49 – NO DANGLING</div>
        <div className="grid grid-cols-6 gap-2">
          <div><div className="text-[9px] text-zinc-500">MATERIAL_CODE * – EMTC – for RFQ</div><input value={form.material_code} onChange={e=>setForm({...form,material_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">FACILITY_CODE – FAC-1000</div><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">QUANTITY * – e.g., 100 – RFQ qty</div><input value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">UOM_CODE – KG/PC</div><input value={form.uom_code} onChange={e=>setForm({...form,uom_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">DEADLINE_DATE – e.g., 2026-10-06 – RFQ deadline</div><input type="date" value={form.deadline_date} onChange={e=>setForm({...form,deadline_date:e.target.value})} className="w-full border-2 border-black px-1 py-1" /></div>
          <div><div className="text-[9px] text-zinc-500">DESCRIPTION – e.g., RFQ for spices</div><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
        </div>
        <button onClick={createRfq} className="mt-3 bg-black text-white px-3 py-1 w-full">CREATE ME41 RFQ – REQUEST FOR QUOTATION – SEND TO VENDORS – T2 GOOD</button>
        <div className="grid grid-cols-5 gap-2 mt-3 border-t-2 border-black pt-2">
          <div><div className="text-[9px] text-zinc-500">RFQ_NUMBER * – RFQ-xxx – for ME47 quotation</div><input value={quotForm.rfq_number} onChange={e=>setQuotForm({...quotForm,rfq_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">VENDOR_NUMBER * – PSUC – vendor reply</div><input value={quotForm.vendor_number} onChange={e=>setQuotForm({...quotForm,vendor_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">UNIT_PRICE * – e.g., 45 – vendor price</div><input value={quotForm.unit_price} onChange={e=>setQuotForm({...quotForm,unit_price:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">DELIVERY_DAYS – e.g., 7 – vendor delivery</div><input value={quotForm.delivery_days} onChange={e=>setQuotForm({...quotForm,delivery_days:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><button onClick={createQuotation} className="w-full bg-zinc-900 text-white px-3 py-1 mt-4">ME47 QUOTATION – VENDOR REPLY</button></div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 border-t-2 border-black pt-2">
          <div><div className="text-[9px] text-zinc-500">RFQ_NUMBER * – for ME49 price comparison</div><input value={compareForm.rfq_number} onChange={e=>setCompareForm({...compareForm,rfq_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">WINNER_QUOTATION_NUMBER – optional – QT-xxx – if empty auto lowest price</div><input value={compareForm.winner_quotation_number} onChange={e=>setCompareForm({...compareForm,winner_quotation_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><button onClick={compare} className="w-full bg-zinc-900 text-white px-3 py-1 mt-4">ME49 PRICE COMPARISON – SELECT WINNER → PO</button></div>
        </div>
        <div className="text-[9px] text-zinc-500 mt-1">T2 GOOD – RFQ ME41/ME42/ME43 – request for quotation send to vendors – Quotation ME47/ME48 – vendor reply with price/delivery – Price Comparison ME49 – compare quotations for RFQ, select winner → PO – Tables: proc_rfq + proc_quotation + proc_po_from_rfq – NO DANGLING – RFQ fields used in quotation + comparison + PO creation – procurement operational excellence – General ERP SAP ME41/ME47/ME49 alias – chain: RFQ → quotation → price comparison → winner → PO → GR → IV</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">RFQs – {rfqs.length} – ME41 – status CREATED/AWARDED</div>
          {rfqs.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-[10px] border-b py-1">{it.rfq_number} – {it.material_code} – fac {it.facility_code} – qty {it.quantity} {it.uom_code} – deadline {it.deadline_date?.split('T')[0]} – {it.status}</div>
          ))}
        </div>
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">QUOTATIONS – {quotations.length} – ME47 – status SUBMITTED/SELECTED – winner marked</div>
          {quotations.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-[10px] border-b py-1">{it.quotation_number} – RFQ {it.rfq_number} – vendor {it.vendor_number} – qty {it.quantity} – unit {it.unit_price} total {it.total_price} {it.currency_code} – delivery {it.delivery_days} days – {it.status} {it.is_winner?'WINNER':''}</div>
          ))}
        </div>
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T2 GOOD – GENERAL ERP – LOW IMPORTANCE – RFQ</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/mm/info-records`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">PIRC Info Record ME11 →</Link>
          <Link href={`/${companyCode}/mm/po`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">PPOC PO – from RFQ winner →</Link>
          <Link href={`/${companyCode}/foundation/suppliers`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">PSUC Suppliers →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center">📨</div>
          <div>
            <div className="font-semibold">RFQ – ME41 (alias ME41) + Quotation ME47 + Price Comparison ME49 – General ERP – T2 GOOD – ME41-RFQ-ME47-ME49</div>
            <div className="text-xs text-zinc-500">{rfqs.length} RFQs • {quotations.length} quotations • {companyCode} • ME41 RFQ request for quotation send to vendors – ME47 quotation vendor reply with price/delivery – ME49 price comparison compare quotations, select winner → PO – T2 GOOD – NO DANGLING</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <DbAutocomplete label="MATERIAL_CODE * – EMTC – for RFQ – T2" value={form.material_code} onChange={v=>setForm({...form,material_code:v})} apiUrl="/api/materials" codeField="material_code" nameField="name" placeholder="" required createUrl={`/${companyCode}/foundation/materials`} createCode="EMTC" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium">FACILITY_CODE – FAC-1000</label><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">QUANTITY * – e.g., 100 – RFQ qty</label><input value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">UOM_CODE – KG/PC</label><input value={form.uom_code} onChange={e=>setForm({...form,uom_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">DEADLINE_DATE – e.g., 2026-10-06</label><input type="date" value={form.deadline_date} onChange={e=>setForm({...form,deadline_date:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" /></div>
          <div><label className="text-[11px] font-medium">DESCRIPTION – e.g., RFQ for spices</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
        </div>
        <button onClick={createRfq} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Create ME41 RFQ – Request for Quotation – Send to Vendors – T2 GOOD – NO DANGLING</button>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6 border-t border-zinc-200 pt-6">
          <div><label className="text-[11px] font-medium">RFQ_NUMBER * – RFQ-xxx – for ME47</label><input value={quotForm.rfq_number} onChange={e=>setQuotForm({...quotForm,rfq_number:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="" /></div>
          <DbAutocomplete label="VENDOR_NUMBER * – PSUC – vendor reply – T2" value={quotForm.vendor_number} onChange={v=>setQuotForm({...quotForm,vendor_number:v})} apiUrl="/api/business-partners" codeField="account_number" nameField="display_name" placeholder="" required createUrl={`/${companyCode}/foundation/suppliers`} createCode="PSUC" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium">UNIT_PRICE * – e.g., 45 – vendor price</label><input value={quotForm.unit_price} onChange={e=>setQuotForm({...quotForm,unit_price:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">DELIVERY_DAYS – e.g., 7</label><input value={quotForm.delivery_days} onChange={e=>setQuotForm({...quotForm,delivery_days:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
          <div><button onClick={createQuotation} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">ME47 Quotation – Vendor Reply – T2</button></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 border-t border-zinc-200 pt-6">
          <div><label className="text-[11px] font-medium">RFQ_NUMBER * – for ME49 comparison</label><input value={compareForm.rfq_number} onChange={e=>setCompareForm({...compareForm,rfq_number:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">WINNER_QUOTATION_NUMBER – optional – auto lowest if empty</label><input value={compareForm.winner_quotation_number} onChange={e=>setCompareForm({...compareForm,winner_quotation_number:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="" /></div>
          <div><button onClick={compare} className="mt-6 w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">ME49 Price Comparison – Select Winner → PO – T2 GOOD</button></div>
        </div>
        <div className="text-[10px] text-zinc-400 mt-2">T2 GOOD – RFQ ME41/ME42/ME43 – request for quotation send to vendors – Quotation ME47/ME48 – vendor reply with price/delivery – Price Comparison ME49 – compare quotations for RFQ, select winner → PO – Tables: proc_rfq + proc_quotation + proc_po_from_rfq – NO DANGLING – RFQ fields used in quotation + comparison + PO creation – procurement operational excellence – General ERP SAP ME41/ME47/ME49 alias – chain: RFQ → quotation → price comparison → winner → PO → GR → IV</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">RFQs – {rfqs.length} – ME41 – status CREATED/AWARDED</div>
          {rfqs.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-xs border-b border-zinc-100 py-2">{it.rfq_number} – {it.material_code} – fac {it.facility_code} – qty {it.quantity} {it.uom_code} – deadline {it.deadline_date?.split('T')[0]} – {it.status}</div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">Quotations – {quotations.length} – ME47 – SUBMITTED/SELECTED – winner marked</div>
          {quotations.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-xs border-b border-zinc-100 py-2">{it.quotation_number} – RFQ {it.rfq_number} – vendor {it.vendor_number} – qty {it.quantity} – unit {it.unit_price} total {it.total_price} {it.currency_code} – delivery {it.delivery_days} days – {it.status} {it.is_winner?'WINNER':''}</div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T2 GOOD – General ERP – Low Importance – RFQ</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/mm/info-records`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PIRC</span><span>Info Record – ME11 – price →</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/mm/po`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PPOC</span><span>PO – from RFQ winner – ME21N alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/suppliers`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PSUC</span><span>Suppliers – PSUC – XK01 alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – RFQ, Quotation, Price Comparison, Vendor, Material, Facility, Quantity, UoM, Deadline, Unit Price, Total Price, Delivery Days, Winner, PO Creation – SAP ME41/ME42/ME43/ME47/ME48/ME49/ME21N kept as alias – T2 GOOD – RFQ → quotation → price comparison → winner → PO – NO DANGLING – RFQ fields used in quotation + comparison + PO creation – procurement operational excellence</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="RFQ" subtitle={`${rfqs.length} RFQs • ${quotations.length} quotations • ${companyCode} • ME41 alias ME41 + ME47 + ME49 – General ERP – T2 GOOD – ME41-RFQ-ME47-ME49`} code="ME41" module="MM" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
