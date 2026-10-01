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
  const [form,setForm]=useState({partner_number: "", item_number: "", facility_code: "FAC-1000", unit_price: "", currency_code: "INR", uom_code: "KG", lead_time_days: "7", min_order_qty: "10", valid_from: new Date().toISOString().split('T')[0]});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/info-records').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!form.partner_number || !form.item_number){ setMsg('❌ VENDOR_NUMBER and MATERIAL_NUMBER required – ME11 – T2 GOOD'); return; }
    const payload = { partner_number: form.partner_number, item_number: form.item_number, facility_code: form.facility_code, unit_price: parseFloat(form.unit_price||'0'), currency_code: form.currency_code, uom_code: form.uom_code, lead_time_days: parseInt(form.lead_time_days||'7'), min_order_qty: parseFloat(form.min_order_qty||'0'), valid_from: form.valid_from };
    const res = await fetch('/api/info-records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ ME11 Info Record ${res.infoRecordNumber} – vendor ${form.partner_number} material ${form.item_number} plant ${form.facility_code} price ${form.unit_price} ${form.currency_code}/${form.uom_code} lead ${form.lead_time_days} days MOQ ${form.min_order_qty} – T2 GOOD – NO DANGLING – info record price auto used in PO creation – General ERP – SAP ME11 alias`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING ME11 – Info Record – T2 GOOD...</div>;
  const records = data?.infoRecords || data?.data || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">ME11 INFO RECORD – GENERAL ERP – {records.length} RECORDS – T2 GOOD – ME11-INFO-REC – PO AUTO PRICE – NO DANGLING</div>
        <div className="grid grid-cols-4 gap-2">
          <div><div className="text-[9px] text-zinc-500">VENDOR_NUMBER * – PSUC – must exist</div><input value={form.partner_number} onChange={e=>setForm({...form,partner_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">MATERIAL_NUMBER * – EMTC – must exist</div><input value={form.item_number} onChange={e=>setForm({...form,item_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">FACILITY_CODE – FAC-1000</div><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">UNIT_PRICE * – e.g., 50 – auto used in PO if PO price 0</div><input value={form.unit_price} onChange={e=>setForm({...form,unit_price:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">CURRENCY_CODE – INR default</div><input value={form.currency_code} onChange={e=>setForm({...form,currency_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">UOM_CODE – KG/PC – EUOC</div><input value={form.uom_code} onChange={e=>setForm({...form,uom_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">LEAD_TIME_DAYS – e.g., 7 – planned delivery time</div><input value={form.lead_time_days} onChange={e=>setForm({...form,lead_time_days:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">MIN_ORDER_QTY – MOQ – e.g., 10</div><input value={form.min_order_qty} onChange={e=>setForm({...form,min_order_qty:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
        </div>
        <button onClick={create} className="mt-3 bg-black text-white px-3 py-1 w-full">CREATE ME11 INFO RECORD – VENDOR-MATERIAL PRICE + LEAD TIME + MOQ – T2 GOOD</button>
        <div className="text-[9px] text-zinc-500 mt-1">T2 GOOD – Info Record ME11/ME12/ME13 – vendor-material price, planned delivery time – PO price auto from info record if PO unit_price 0 – else manual – Workaround if missing: manual PO price entry – T2 GOOD – NO DANGLING – info record price used in PO creation – procurement operational excellence – General ERP SAP ME11 alias – chain: info record → PO auto price → GR → IV → FI</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {records.slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2"><div className="font-bold">{it.info_record_number} – {it.vendor_number} {it.vendor_name} – {it.item_number} {it.item_name} – fac {it.facility_code} – {it.unit_price} {it.currency_code}/{it.uom_code} – lead {it.lead_time_days} days – MOQ {it.min_order_qty} – valid {it.valid_from?.split('T')[0]}</div></div>
        ))}
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T2 GOOD – GENERAL ERP – LOW IMPORTANCE – INFO RECORD</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/foundation/suppliers`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">PSUC Suppliers →</Link>
          <Link href={`/${companyCode}/foundation/materials`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EMTC Materials →</Link>
          <Link href={`/${companyCode}/mm/po`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">PPOC PO – uses info record price →</Link>
          <Link href={`/${companyCode}/mm/source-lists`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">PSRC Source List ME01 →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">📋</div>
          <div>
            <div className="font-semibold">Info Record – ME11 (alias ME11) – General ERP – T2 GOOD – ME11-INFO-REC – PO Auto Price</div>
            <div className="text-xs text-zinc-500">{records.length} records • {companyCode} • ME11 vendor-material price + lead time + MOQ – PO price auto from info record if PO unit_price 0 – T2 GOOD – NO DANGLING – price used in PO creation</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DbAutocomplete label="VENDOR_NUMBER * – PSUC – must exist – T2" value={form.partner_number} onChange={v=>setForm({...form,partner_number:v})} apiUrl="/api/business-partners" codeField="account_number" nameField="display_name" placeholder="" required createUrl={`/${companyCode}/foundation/suppliers`} createCode="PSUC" companyCode={companyCode} />
          <DbAutocomplete label="MATERIAL_NUMBER * – EMTC – must exist – T2" value={form.item_number} onChange={v=>setForm({...form,item_number:v})} apiUrl="/api/materials" codeField="material_code" nameField="name" placeholder="" required createUrl={`/${companyCode}/foundation/materials`} createCode="EMTC" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium">FACILITY_CODE – FAC-1000</label><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">UNIT_PRICE * – e.g., 50 – auto used in PO if 0</label><input value={form.unit_price} onChange={e=>setForm({...form,unit_price:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">CURRENCY_CODE – INR default</label><input value={form.currency_code} onChange={e=>setForm({...form,currency_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">UOM_CODE – KG/PC – EUOC</label><input value={form.uom_code} onChange={e=>setForm({...form,uom_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">LEAD_TIME_DAYS – e.g., 7 – planned delivery</label><input value={form.lead_time_days} onChange={e=>setForm({...form,lead_time_days:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">MIN_ORDER_QTY – MOQ – e.g., 10</label><input value={form.min_order_qty} onChange={e=>setForm({...form,min_order_qty:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]" placeholder="" /></div>
        </div>
        <button onClick={create} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 h-[32px] text-[13px] font-medium transition-colors">Create ME11 Info Record – Vendor-Material Price + Lead Time + MOQ – T2 GOOD – NO DANGLING</button>
        <div className="text-[10px] text-zinc-400 mt-2">T2 GOOD – Info Record ME11/ME12/ME13 – vendor-material price, planned delivery time – PO price auto from info record if PO unit_price 0 – else manual – Workaround if missing: manual PO price entry – T2 GOOD – NO DANGLING – info record price used in PO creation – procurement operational excellence – General ERP SAP ME11 alias – chain: info record → PO auto price → GR → IV → FI – info record fields used in PO price determination</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {records.map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start"><div className="font-semibold text-sm">{it.info_record_number} – {it.vendor_number} {it.vendor_name} – {it.item_number} {it.item_name} – fac {it.facility_code} – {it.unit_price} {it.currency_code}/{it.uom_code} – lead {it.lead_time_days} days – MOQ {it.min_order_qty}</div><span className="text-[10px] bg-blue-600 text-white rounded-full px-2 py-0.5">ME11</span></div>
            <div className="mt-2 text-xs text-zinc-500">Valid {it.valid_from?.split('T')[0]} – price auto used in PO if PO price 0 – T2 GOOD – NO DANGLING</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T2 GOOD – General ERP – Low Importance – Info Record</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/foundation/suppliers`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PSUC</span><span>Suppliers – PSUC – XK01 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/materials`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EMTC</span><span>Materials – EMTC – EMTC (legacy MM01) alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/mm/po`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PPOC</span><span>PO – uses info record price – PPOC (legacy ME21N) alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/mm/source-lists`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PSRC</span><span>Source List – ME01 – PSRC alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Info Record, Vendor, Material, Facility, Unit Price, Currency, UoM, Lead Time, MOQ, Valid From/To, PO Auto Price – SAP ME11/ME12/ME13/ME01/PPOC (legacy ME21N) kept as alias – T2 GOOD – Info Record vendor-material price + lead time + MOQ – PO price auto from info record – NO DANGLING – price used in PO creation – procurement operational excellence</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Info Records" subtitle={`${records.length} records • ${companyCode} • ME11 alias ME11 – General ERP – T2 GOOD – ME11-INFO-REC`} code="ME11" module="MM" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
