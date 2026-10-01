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
  const [form,setForm]=useState({delivery_number: "", action: "VL02N", picking_status: "PICKED", shipping_point: "", route: "", quantity_picked: ""});
  const [due,setDue]=useState<any[]>([]);

  async function load(){
    setLoading(true);
    try{
      const [delRes, dueRes] = await Promise.all([
        fetch('/api/delivery').then(r=>r.json()),
        fetch('/api/delivery/change?action=VL10C').then(r=>r.json())
      ]);
      setData(delRes);
      setDue(dueRes.due_list || []);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function submit(){
    if(!form.delivery_number){ setMsg('❌ DELIVERY_NUMBER required – SDLC (legacy VL02N)/VL09 – T1 REQUIRED'); return; }
    const payload = { delivery_number: form.delivery_number, action: form.action, picking_status: form.picking_status, shipping_point: form.shipping_point, route: form.route, quantity_picked: form.quantity_picked ? parseFloat(form.quantity_picked) : undefined };
    const res = await fetch('/api/delivery/change',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ ${form.action} – delivery ${form.delivery_number} – ${res.message} – T1 REQUIRED – NO DANGLING – delivery fields used in PGI + billing + stock – General ERP – SAP SDLC (legacy VL02N)/VL09/VL10C alias`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING SDLC (legacy VL02N) – Delivery Change – T1 REQUIRED...</div>;
  const deliveries = data?.deliveries || data?.data || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">SDLC (legacy VL02N) CHANGE DELIVERY + VL09 REVERSE GI + VL10C DUE LIST – GENERAL ERP – {deliveries.length} DELIVERIES – {due.length} DUE – T1 REQUIRED – SDLC (legacy VL02N)-VL03N-PICK-PACK-VL10C-VL09 – NO DANGLING</div>
        <div className="grid grid-cols-6 gap-2">
          <div><div className="text-[9px] text-zinc-500">DELIVERY_NUMBER * – DN-xxx – must exist</div><input value={form.delivery_number} onChange={e=>setForm({...form,delivery_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">ACTION – SDLC (legacy VL02N) Change or VL09 Reverse GI</div><select value={form.action} onChange={e=>setForm({...form,action:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>SDLC (legacy VL02N)</option><option>VL09</option></select></div>
          <div><div className="text-[9px] text-zinc-500">PICKING_STATUS – PICKED/NOT_PICKED</div><select value={form.picking_status} onChange={e=>setForm({...form,picking_status:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>PICKED</option><option>NOT_PICKED</option></select></div>
          <div><div className="text-[9px] text-zinc-500">SHIPPING_POINT – DP-1000 – KP01</div><input value={form.shipping_point} onChange={e=>setForm({...form,shipping_point:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">ROUTE – ROUTE-01 – KROUTE01</div><input value={form.route} onChange={e=>setForm({...form,route:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">QUANTITY_PICKED – e.g., 10 – for PICK</div><input value={form.quantity_picked} onChange={e=>setForm({...form,quantity_picked:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
        </div>
        <button onClick={submit} className="mt-3 bg-black text-white px-3 py-1 w-full">SUBMIT SDLC (legacy VL02N) CHANGE / VL09 REVERSE GI – T1 REQUIRED – PICK-PACK + REVERSE</button>
        <div className="text-[9px] text-zinc-500 mt-1">T1 REQUIRED – SDLC (legacy VL02N): Change delivery – update picking qty, batch, shipping point, route – VL03N: Display – already GET /api/delivery – VL10C: Delivery Due List – sales orders due for delivery – SO with status OPEN/CONFIRMED, delivery not yet created – VL09: Reverse Goods Issue – cancel PGI – reverse inventory + COGS posting – NO DANGLING – delivery fields used in PGI + billing + stock – General ERP, SAP SDLC (legacy VL02N)/VL03N/VL10C/VL09 alias – chain: SO → delivery due VL10C → delivery create SDLC (legacy VL01N) → change SDLC (legacy VL02N) → PICK/PACK → PGI SDLC (legacy VL02N) → reverse GI VL09</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">DELIVERIES – {deliveries.length} – SDLC – status DRAFT/PICKING/PICKED/GOODS_ISSUED</div>
          {deliveries.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-[10px] border-b py-1">{it.delivery_number} – SO {it.sales_number} – {it.customer_number} – qty {it.total_quantity} – {it.status} – ship {it.shipping_point} – route {it.route}</div>
          ))}
        </div>
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">DUE LIST VL10C – {due.length} – SO OPEN/CONFIRMED due for delivery – T1</div>
          {due.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-[10px] border-b py-1">{it.sales_number} – {it.customer_number} – {it.customer_name} – qty {it.total_quantity} – {it.status} – deliveries {it.delivery_count}</div>
          ))}
        </div>
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T1 REQUIRED – GENERAL ERP – LOW IMPORTANCE – DELIVERY</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/sd/delivery`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SDLC Delivery Create SDLC (legacy VL01N) →</Link>
          <Link href={`/${companyCode}/sd/billing`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SBLC Billing SBLC (legacy VF01) →</Link>
          <Link href={`/${companyCode}/foundation/inventory-locations`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EILC Inventory Locations →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center">🚚</div>
          <div>
            <div className="font-semibold">Delivery Change – SDLC (legacy VL02N) (alias SDLC (legacy VL02N)) + VL09 Reverse GI + VL10C Due List – General ERP – T1 REQUIRED – SDLC (legacy VL02N)-VL03N-PICK-PACK-VL10C-VL09</div>
            <div className="text-xs text-zinc-500">{deliveries.length} deliveries • {due.length} due • {companyCode} • SDLC (legacy VL02N) change delivery – picking qty, batch, shipping point, route – VL09 reverse GI – cancel PGI – reverse inventory + COGS – VL10C delivery due list – SO OPEN/CONFIRMED due – NO DANGLING</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div><label className="text-[11px] font-medium">DELIVERY_NUMBER * – DN-xxx</label><input value={form.delivery_number} onChange={e=>setForm({...form,delivery_number:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">ACTION – SDLC (legacy VL02N) Change or VL09 Reverse GI</label><select value={form.action} onChange={e=>setForm({...form,action:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]"><option>SDLC (legacy VL02N)</option><option>VL09</option></select></div>
          <div><label className="text-[11px] font-medium">PICKING_STATUS – PICKED</label><select value={form.picking_status} onChange={e=>setForm({...form,picking_status:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]"><option>PICKED</option><option>NOT_PICKED</option></select></div>
          <div><label className="text-[11px] font-medium">SHIPPING_POINT – DP-1000</label><input value={form.shipping_point} onChange={e=>setForm({...form,shipping_point:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">ROUTE – ROUTE-01</label><input value={form.route} onChange={e=>setForm({...form,route:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">QUANTITY_PICKED – e.g., 10</label><input value={form.quantity_picked} onChange={e=>setForm({...form,quantity_picked:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]" placeholder="" /></div>
        </div>
        <button onClick={submit} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 h-[32px] text-[13px] font-medium transition-colors">Submit SDLC (legacy VL02N) Change / VL09 Reverse GI – T1 REQUIRED – PICK-PACK + REVERSE – NO DANGLING</button>
        <div className="text-[10px] text-zinc-400 mt-2">T1 REQUIRED – SDLC (legacy VL02N): Change delivery – update picking qty, batch, shipping point, route – VL03N: Display – already GET /api/delivery – VL10C: Delivery Due List – sales orders due for delivery – SO with status OPEN/CONFIRMED, delivery not yet created – VL09: Reverse Goods Issue – cancel PGI – reverse inventory + COGS posting – NO DANGLING – delivery fields used in PGI + billing + stock – General ERP, SAP SDLC (legacy VL02N)/VL03N/VL10C/VL09 alias – chain: SO → delivery due VL10C → delivery create SDLC (legacy VL01N) → change SDLC (legacy VL02N) → PICK/PACK → PGI SDLC (legacy VL02N) → reverse GI VL09 → billing SBLC (legacy VF01)</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">Deliveries – {deliveries.length} – SDLC – status DRAFT/PICKING/PICKED/GOODS_ISSUED</div>
          {deliveries.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-xs border-b border-zinc-100 py-2">{it.delivery_number} – SO {it.sales_number} – {it.customer_number} – qty {it.total_quantity} – {it.status} – ship {it.shipping_point} – route {it.route}</div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">Due List VL10C – {due.length} – SO OPEN/CONFIRMED due for delivery</div>
          {due.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-xs border-b border-zinc-100 py-2">{it.sales_number} – {it.customer_number} – {it.customer_name} – qty {it.total_quantity} – {it.status} – deliveries {it.delivery_count}</div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T1 REQUIRED – General ERP – Low Importance – Delivery</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/sd/delivery`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SDLC</span><span>Delivery Create – SDLC (legacy VL01N) – FIN-DN-CR alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/sd/billing`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SBLC</span><span>Billing – SBLC (legacy VF01) – FIN-BL-CR alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/inventory-locations`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EILC</span><span>Inventory Locations – EILC – OMSL alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Delivery Change, Reverse Goods Issue, Delivery Due List, Picking, Packing, Goods Issue, Shipping Point, Route, Sales Order, Inventory – SAP SDLC (legacy VL02N)/VL03N/VL10C/VL09/SDLC (legacy VL01N) kept as alias – T1 REQUIRED – SDLC (legacy VL02N) change delivery, VL09 reverse GI, VL10C due list – NO DANGLING – delivery fields used in PGI + billing + stock</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Delivery Change" subtitle={`${deliveries.length} deliveries • ${due.length} due • ${companyCode} • SDLC (legacy VL02N) alias SDLC (legacy VL02N) + VL09 + VL10C – General ERP – T1 REQUIRED – SDLC (legacy VL02N)-VL03N-PICK-PACK-VL10C-VL09`} code="VL02N" module="SD" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
