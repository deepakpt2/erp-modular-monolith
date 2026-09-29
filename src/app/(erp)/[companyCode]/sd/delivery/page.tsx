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
  const [form,setForm]=useState({sales_order_number: "", facility_code: "", shipping_point: "DP-1000"});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/delivery').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!form.sales_order_number){ setMsg('❌ SALES_ORDER_NUMBER required – SSOC alias VA01 – General ERP Sales Order – must exist – T0 BLOCKING – delivery created from SO via copy control VTFL'); return; }
    const payload = {
      sales_order_number: form.sales_order_number,
      facility_code: form.facility_code,
      plant_code: form.facility_code,
      shipping_point: form.shipping_point,
      company_code: companyCode
    };
    // First try to find sales order id
    try{
      const soRes = await fetch(`/api/sales-orders?search=${form.sales_order_number}`).then(r=>r.json());
      const so = (soRes.salesOrders||soRes.data||[]).find((s:any)=>s.sales_number===form.sales_order_number.toUpperCase()) || (soRes.salesOrders||soRes.data||[])[0];
      if(so){
        const createPayload = {
          sales_order_id: so.id,
          facility_id: so.facility_id || so.plant_id,
          ship_to_partner_id: so.partner_id || so.customer_id,
          shipping_point: form.shipping_point,
          lines: (so.lines||[]).map((l:any)=>({
            sales_line_id: l.id,
            item_id: l.item_id || l.material_id,
            quantity: l.quantity,
            uom_code: l.uom_code || l.uom,
            facility_id: so.facility_id || so.plant_id
          }))
        };
        const res = await fetch('/api/delivery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(createPayload)}).then(r=>r.json());
        if(res.success){
          setMsg(`✅ Delivery ${res.deliveryNumber || res.delivery?.delivery_number} created from Sales Order ${form.sales_order_number} – SDLC alias VL01N – General ERP – ${so.lines?.length||0} lines copied via VTFL copy control – T0 BLOCKING – next: PGI 601 posts stock - MAP - COGS GBB/BSX via OBYC – NO DANGLING`);
          load();
          setForm({sales_order_number: "", facility_code: "", shipping_point: "DP-1000"});
        } else setMsg('❌ '+(res.error||JSON.stringify(res)));
        return;
      }
    }catch(e){ console.warn('SO lookup failed', e); }
    // Fallback simple
    const res = await fetch('/api/delivery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success || res.delivery){ setMsg(`✅ Delivery ${res.deliveryNumber||res.delivery?.delivery_number} created – SDLC alias VL01N – General ERP – T0 BLOCKING`); load(); } else setMsg('❌ '+(res.error||'Failed'));
  }

  async function pgi(delivery:any){
    const res = await fetch('/api/delivery',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({delivery_number: delivery.delivery_number, id: delivery.id, action: 'PGI', movement_type: '601'})}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ Delivery ${delivery.delivery_number} PGI 601 posted – SDLC alias VL02N – General ERP – T0 BLOCKING – stock ledger 601 qty - – COGS ${res.total_cogs} – GBB ${res.gbb || 'GBB via OBYC'} Dr COGS Cr Inventory BSX – valuation_class ${delivery.inventory_valuation_class||'FINISHED'} → OBYC GBB/BSX lookup → universal ledger – MAP used – movement OMJJ 601 validated – NO DANGLING – next: Billing SBLC VF01`);
      load();
    } else setMsg('❌ PGI Failed: '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING SDLC – Outbound Deliveries – General ERP alias VL01N – T0 BLOCKING – PGI 601 + COGS GBB/BSX...</div>;
  const items = data?.deliveries || data?.data || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">SDLC OUTBOUND DELIVERY CREATE – GENERAL ERP – ALIAS VL01N – {Array.isArray(items)?items.length:0} RECORDS – T0 BLOCKING – VL01N-PGI-601 + COGS GBB/BSX + STOCK-LEDGER + MAP + OMJJ</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">SALES_ORDER_NUMBER * (SSOC VA01) – General ERP Sales Order – required – copy control VTFL SO→DL – must exist</div><input value={form.sales_order_number} onChange={e=>setForm({...form,sales_order_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">FACILITY_CODE (EFCC) – General ERP Facility – alias Plant – auto from SO if blank</div><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">SHIPPING_POINT (EDPC KP01) – General ERP Dispatch Point – alias Shipping Point – DP-1000</div><input value={form.shipping_point} onChange={e=>setForm({...form,shipping_point:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
        </div>
        <button onClick={create} className="mt-2 bg-black text-white px-3 py-1 w-full">CREATE DELIVERY SDLC – ALIAS VL01N – FROM SO – VTFL COPY CONTROL – T0 BLOCKING</button>
        <div className="text-[9px] text-zinc-500 mt-1">T0 BLOCKING – Delivery created from Sales Order via copy control VTFL: SO lines → DL lines – shipping point DP-1000 – next: PGI 601 posts GI 601 stock - qty - value - MAP used – GBB COGS Dr + BSX inventory Cr via OBYC valuation_class FINISHED → GBB/BSX GL – universal ledger – OMJJ 601 validated – STOCK-LEDGER updated – NO DANGLING – General ERP, SAP VL01N/VL02N alias</div>
      </div>
      <div className="grid gap-2">
        {(Array.isArray(items)?items:[]).slice(0,30).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2">
            <div className="flex justify-between"><div className="font-bold">{it.delivery_number} – SO {it.sales_number} – {it.facility_code} – qty {it.total_quantity} – {it.status} – {it.line_count} lines</div><div className="flex gap-1">{(it.status==='DRAFT' || it.status==='PICKING' || it.status==='PICKED') && <button onClick={()=>pgi(it)} className="border-2 border-black px-2 bg-emerald-100">PGI 601 – COGS GBB/BSX</button>}{it.status==='GOODS_ISSUED' && <span className="border-2 border-black px-2 bg-zinc-900 text-white">PGI DONE – COGS POSTED</span>}</div></div>
            <div className="text-[10px] text-zinc-600">{it.lines?.map((l:any)=>`${l.item_number}:${l.quantity}`).join(' ')}</div>
            <div className="text-[9px] text-zinc-400">T0 BLOCKING – PGI 601: stock ledger 601 qty - MAP ${it.lines?.[0]?.moving_avg_price||''} – GBB/BSX via OBYC valuation_class → universal ledger Dr COGS Cr Inventory – OMJJ 601 – NO DANGLING</div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T0 BLOCKING – GENERAL ERP – LOW IMPORTANCE – SO→DL→PGI→BL</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/sales`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SSOC Sales Order – required SO → DL VTFL →</Link>
          <Link href={`/${companyCode}/foundation/facilities`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EFCC Facility →</Link>
          <Link href={`/${companyCode}/foundation/inventory-locations`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EILC Inventory Location →</Link>
          <Link href={`/${companyCode}/foundation/dispatch-points`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EDPC Dispatch Point DP-1000 →</Link>
          <Link href={`/${companyCode}/sd/billing`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SBLC Billing uses Delivery VTFL →</Link>
          <Link href={`/${companyCode}/fico/auto-account-determination`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">OBYC Auto Account GBB/BSX →</Link>
          <Link href={`/${companyCode}/fico/movement-types`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">OMJJ Movement 601 →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center">🚚</div>
          <div>
            <div className="font-semibold">Outbound Deliveries – SDLC (alias VL01N) – General ERP – T0 BLOCKING – PGI 601 + COGS GBB/BSX</div>
            <div className="text-xs text-zinc-500">{Array.isArray(items)?items.length:0} deliveries • {companyCode} • SDLC created from SO via VTFL → PGI 601 stock - MAP - COGS GBB/BSX via OBYC – STOCK-LEDGER – OMJJ – NO DANGLING</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DbAutocomplete label="SALES_ORDER_NUMBER * – SSOC – General ERP Sales Order – VA01 alias – required – VTFL copy control SO→DL" value={form.sales_order_number} onChange={v=>setForm({...form,sales_order_number:v})} apiUrl="/api/sales-orders" codeField="sales_number" nameField="customer_name" placeholder="" required createUrl={`/${companyCode}/sales`} createCode="SSOC" companyCode={companyCode} />
          <DbAutocomplete label="FACILITY_CODE – EFCC – General ERP Facility – alias Plant – auto from SO if blank" value={form.facility_code} onChange={v=>setForm({...form,facility_code:v})} apiUrl="/api/facilities" codeField="code" nameField="name" placeholder="" createUrl={`/${companyCode}/foundation/facilities`} createCode="EFCC" companyCode={companyCode} />
          <DbAutocomplete label="SHIPPING_POINT – EDPC – General ERP Dispatch Point – KP01 alias – DP-1000" value={form.shipping_point} onChange={v=>setForm({...form,shipping_point:v})} apiUrl="/api/dispatch-points" codeField="code" nameField="name" placeholder="" createUrl={`/${companyCode}/foundation/dispatch-points`} createCode="EDPC" companyCode={companyCode} />
        </div>
        <button onClick={create} className="mt-5 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Create Delivery SDLC – Alias VL01N – From Sales Order – VTFL Copy Control – T0 BLOCKING</button>
        <div className="text-[10px] text-zinc-400 mt-2">T0 BLOCKING – Delivery created from Sales Order via copy control VTFL: SO lines → DL lines – shipping point DP-1000 – next: PGI 601 posts GI 601 stock - qty - value - MAP used – GBB COGS Dr + BSX inventory Cr via OBYC valuation_class FINISHED → GBB/BSX GL – universal ledger – OMJJ 601 validated – STOCK-LEDGER updated – NO DANGLING – General ERP, SAP VL01N/VL02N alias – chain SO→DL→PGI→BL→AR→GL</div>
      </div>

      <div className="grid gap-4">
        {(Array.isArray(items)?items:[]).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-sm">{it.delivery_number} – SO {it.sales_number} – {it.facility_code} – qty {it.total_quantity} – <span className={`px-2 py-0.5 rounded-full text-[10px] ${it.status==='GOODS_ISSUED'?'bg-zinc-900 text-white':'bg-yellow-100'}`}>{it.status}</span> – {it.line_count} lines</div>
                <div className="text-xs text-zinc-500 mt-1">{it.lines?.slice(0,3).map((l:any)=>`${l.item_number}:${l.quantity}`).join(' • ')}</div>
                <div className="text-[10px] text-zinc-400 mt-1">T0 BLOCKING – PGI 601: stock ledger 601 qty - MAP – GBB/BSX via OBYC valuation_class → universal ledger Dr COGS Cr Inventory – OMJJ 601 – STOCK-LEDGER – NO DANGLING</div>
              </div>
              <div className="flex gap-2">
                {(it.status==='DRAFT' || it.status==='PICKING' || it.status==='PICKED') && <button onClick={()=>pgi(it)} className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs">PGI 601 – Post Goods Issue – COGS GBB/BSX</button>}
                {it.status==='GOODS_ISSUED' && <span className="px-4 py-2 rounded-full bg-zinc-900 text-white text-xs">PGI DONE – COGS POSTED – GBB/BSX</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T0 BLOCKING – General ERP – Low Importance – Auto from Dependencies – SO→DL→PGI→BL</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/sales`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SSOC</span><span>Sales Order – required SO→DL VTFL – VA01 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/facilities`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EFCC</span><span>Facility – alias Plant – OX10 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/dispatch-points`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EDPC</span><span>Dispatch Point – DP-1000 – KP01 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/sd/billing`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SBLC</span><span>Billing uses Delivery VTFL – VF01 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/auto-account-determination`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">OBYC</span><span>Auto Account GBB/BSX – COGS – valuation_class</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/movement-types`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">OMJJ</span><span>Movement 601 – GI for Sales – PGI</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Outbound Delivery, Sales Order, Facility, Dispatch Point, Product, Goods Issue, COGS, Auto Account Determination, Movement Type – SAP VL01N/VL02N/601/GBB/BSX kept as alias – T0 BLOCKING – Delivery created from SO via VTFL → PGI 601 stock - MAP - COGS GBB/BSX via OBYC valuation_class → universal ledger – STOCK-LEDGER – OMJJ – NO DANGLING – chain SO→DL→PGI→BL→AR→GL</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Outbound Deliveries" subtitle={`${Array.isArray(items)?items.length:0} deliveries • ${companyCode} • SDLC alias VL01N – General ERP – T0 BLOCKING – PGI 601 + COGS GBB/BSX`} code="SDLC" module="SD" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
