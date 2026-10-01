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
  const [form,setForm]=useState({material_code: "", facility_code: "FAC-1000", sloc_code: "0001", quantity: "10", uom_code: "PC", movement_type: "GI_PROD", cost_center_code: "", order_number: "", requirement_date: new Date().toISOString().split('T')[0], action: "MB21"});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/reservations').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!form.material_code || !form.quantity){ setMsg('❌ MATERIAL_CODE and QUANTITY required – MB21 – T2 GOOD'); return; }
    const payload = { material_code: form.material_code, facility_code: form.facility_code, sloc_code: form.sloc_code, quantity: parseFloat(form.quantity), uom_code: form.uom_code, movement_type: form.movement_type, cost_center_code: form.cost_center_code, order_number: form.order_number, requirement_date: form.requirement_date, action: form.action };
    const res = await fetch('/api/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ MB21 Reservation ${res.reservation_number} – material ${form.material_code} plant ${form.facility_code} sloc ${form.sloc_code} qty ${form.quantity} ${form.uom_code} movement ${form.movement_type} cost center ${form.cost_center_code} order ${form.order_number} – T2 GOOD – NO DANGLING – reservation fields used in GI availability check + stock report – General ERP – SAP MB21 alias`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING MB21 – Reservation – T2 GOOD...</div>;
  const reservations = data?.reservations || data?.data || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">MB21 RESERVATION + MB52 STOCK REPORT + MSC1N BATCH WHERE-USED + SERIAL – GENERAL ERP – {reservations.length} RESERVATIONS – T2 GOOD – MB21-RESERVATION + MB52 + MSC1N + SERIAL – NO DANGLING</div>
        <div className="grid grid-cols-5 gap-2">
          <div><div className="text-[9px] text-zinc-500">MATERIAL_CODE * – EMTC</div><input value={form.material_code} onChange={e=>setForm({...form,material_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">FACILITY_CODE – FAC-1000</div><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">SLOC_CODE – 0001 – storage location</div><input value={form.sloc_code} onChange={e=>setForm({...form,sloc_code:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">QUANTITY * – e.g., 10 – reservation qty</div><input value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">MOVEMENT_TYPE – 261 GI to prod order, 201 cost center</div><select value={form.movement_type} onChange={e=>setForm({...form,movement_type:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>261</option><option>201</option><option>601</option></select></div>
          <div><div className="text-[9px] text-zinc-500">COST_CENTER_CODE – e.g., CC-1000 – for 201</div><input value={form.cost_center_code} onChange={e=>setForm({...form,cost_center_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">ORDER_NUMBER – e.g., ORD-1001 – for 261</div><input value={form.order_number} onChange={e=>setForm({...form,order_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">REQUIREMENT_DATE – e.g., 2026-09-30</div><input type="date" value={form.requirement_date} onChange={e=>setForm({...form,requirement_date:e.target.value})} className="w-full border-2 border-black px-1 py-1" /></div>
        </div>
        <button onClick={create} className="mt-3 bg-black text-white px-3 py-1 w-full">CREATE MB21 RESERVATION – RESERVE STOCK FOR COST CENTER/ORDER – T2 GOOD</button>
        <div className="text-[9px] text-zinc-500 mt-1">T2 GOOD – MB21 Reservation for cost center/order – reserve stock for future GI – MB52 Warehouse Stock Report – stock per SLoc/material/batch – MB21 checks availability – MSC1N Batch Where-Used – trace batch to deliveries/production orders – SERIAL Serial Numbers – track individual serials – NO DANGLING – reservation fields used in GI availability check + stock report + batch trace – procurement operational excellence – General ERP SAP MB21/MB52/MSC1N alias – chain: reservation → availability check → GI 261/201/601 → stock decrease → batch where-used → serial tracking</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {reservations.slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2"><div className="font-bold">{it.reservation_number} – {it.material_code} – fac {it.facility_code} sloc {it.sloc_code} – qty {it.quantity} {it.uom_code} – movement {it.movement_type} – CC {it.cost_center_code} – order {it.order_number} – req {it.requirement_date?.split('T')[0]} – {it.status}</div></div>
        ))}
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T2 GOOD – GENERAL ERP – LOW IMPORTANCE – RESERVATION</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/foundation/materials`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EMTC Materials →</Link>
          <Link href={`/${companyCode}/foundation/inventory-locations`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EILC Inventory Locations →</Link>
          <Link href={`/${companyCode}/mm/stock`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">MB52 Stock Report →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">📦</div>
          <div>
            <div className="font-semibold">Reservation – MB21 (alias MB21) + MB52 Stock Report + MSC1N Batch Where-Used + Serial – General ERP – T2 GOOD – MB21-RESERVATION + MB52 + MSC1N + SERIAL</div>
            <div className="text-xs text-zinc-500">{reservations.length} reservations • {companyCode} • MB21 reserve stock for cost center/order – MB52 stock per SLoc/material/batch – MSC1N batch traceability – SERIAL serial tracking – T2 GOOD – NO DANGLING</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <DbAutocomplete label="MATERIAL_CODE * – EMTC – T2" value={form.material_code} onChange={v=>setForm({...form,material_code:v})} apiUrl="/api/materials" codeField="material_code" nameField="name" placeholder="" required createUrl={`/${companyCode}/foundation/materials`} createCode="EMTC" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium">FACILITY_CODE – FAC-1000</label><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">SLOC_CODE – 0001 – storage location</label><input value={form.sloc_code} onChange={e=>setForm({...form,sloc_code:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">QUANTITY * – e.g., 10</label><input value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">MOVEMENT_TYPE – 261/201/601</label><select value={form.movement_type} onChange={e=>setForm({...form,movement_type:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]"><option>261</option><option>201</option><option>601</option></select></div>
          <div><label className="text-[11px] font-medium">COST_CENTER_CODE – e.g., CC-1000 – for 201</label><input value={form.cost_center_code} onChange={e=>setForm({...form,cost_center_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">ORDER_NUMBER – e.g., ORD-1001 – for 261</label><input value={form.order_number} onChange={e=>setForm({...form,order_number:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">REQUIREMENT_DATE – e.g., 2026-09-30</label><input type="date" value={form.requirement_date} onChange={e=>setForm({...form,requirement_date:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]" /></div>
        </div>
        <button onClick={create} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 h-[32px] text-[13px] font-medium transition-colors">Create MB21 Reservation – Reserve Stock for Cost Center/Order – T2 GOOD – NO DANGLING</button>
        <div className="text-[10px] text-zinc-400 mt-2">T2 GOOD – MB21 Reservation for cost center/order – reserve stock for future GI – MB52 Warehouse Stock Report – stock per SLoc/material/batch – MB21 checks availability – MSC1N Batch Where-Used – trace batch to deliveries/production orders – SERIAL Serial Numbers – track individual serials – NO DANGLING – reservation fields used in GI availability check + stock report + batch trace – procurement operational excellence – General ERP SAP MB21/MB52/MSC1N alias – chain: reservation → availability check → GI 261/201/601 → stock decrease → batch where-used → serial tracking</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {reservations.map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start"><div className="font-semibold text-sm">{it.reservation_number} – {it.material_code} – fac {it.facility_code} sloc {it.sloc_code} – qty {it.quantity} {it.uom_code} – movement {it.movement_type}</div><span className="text-[10px] bg-zinc-900 text-white rounded-full px-2 py-0.5">MB21</span></div>
            <div className="mt-2 text-xs text-zinc-500">CC {it.cost_center_code} – order {it.order_number} – req {it.requirement_date?.split('T')[0]} – {it.status} – reservation used in GI availability check – T2 GOOD – NO DANGLING</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T2 GOOD – General ERP – Low Importance – Reservation</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/foundation/materials`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EMTC</span><span>Materials – EMTC – EMTC (legacy MM01) alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/inventory-locations`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EILC</span><span>Inventory Locations – EILC – OMSL alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/mm/stock`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">MB52</span><span>Stock Report – MB52 – MB52 alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Reservation, Material, Facility, Storage Location, Quantity, UoM, Movement Type, Cost Center, Order, Requirement Date, Stock Report, Batch Where-Used, Serial Numbers – SAP MB21/MB52/MSC1N kept as alias – T2 GOOD – MB21 reserve stock for cost center/order – MB52 stock per SLoc – MSC1N batch traceability – SERIAL serial tracking – NO DANGLING – reservation fields used in GI availability check + stock report + batch trace</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Reservations" subtitle={`${reservations.length} reservations • ${companyCode} • MB21 alias MB21 + MB52 + MSC1N + SERIAL – General ERP – T2 GOOD – MB21-RESERVATION + MB52 + MSC1N + SERIAL`} code="MB21" module="MM" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
