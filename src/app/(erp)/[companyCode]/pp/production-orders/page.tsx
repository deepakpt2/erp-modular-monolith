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
  const [form,setForm]=useState({product_code: "", facility_code: "", quantity: "10", bom_code: "", routing_code: ""});
  const [selectedOrder,setSelectedOrder]=useState<any>(null);

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/production-orders').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!form.product_code || !form.facility_code || !form.quantity){ setMsg('❌ PRODUCT_CODE, FACILITY_CODE, QUANTITY required – General ERP – alias Material/Plant/Qty – T0 BLOCKING'); return; }
    const payload = {
      material_code: form.product_code,
      plant_code: form.facility_code,
      quantity: form.quantity,
      bom_code: form.bom_code,
      routing_code: form.routing_code,
      company_code: companyCode
    };
    const res = await fetch('/api/production-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ Manufacturing Order ${res.order_number} created – MMOC alias CO01 – General ERP – ${res.bom_components||0} comps copied from BOM MBMC, ${res.routing_operations||0} ops from Routing MRTC – T0 BLOCKING – NO DANGLING – status CREATED → REL → CNF posts GI 261 GBB/BSX + GR 101 BSX via OBYC + OMJJ`);
      load();
      setForm({product_code: "", facility_code: "", quantity: "10", bom_code: "", routing_code: ""});
    } else setMsg('❌ '+(res.error||'Failed'));
  }

  async function transition(order:any, newStatus:string){
    const res = await fetch('/api/production-orders',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({order_number: order.order_number, status: newStatus})}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ ${res.message} – MMOC – General ERP – ${newStatus === 'CONFIRMED' ? 'GI 261 component consumption GBB/BSX + GR 101 finished receipt BSX posted via OBYC – valuation_class used – MAP – movement OMJJ – NO DANGLING' : newStatus === 'RELEASED' ? 'Component availability checked – reservation created – T0' : ''}`);
      load();
    } else setMsg('❌ '+(res.error||'Failed'));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING MMOC – Manufacturing Orders – General ERP alias CO01 – T0 BLOCKING – BOM-ROU-WC-LINK...</div>;
  const items = data?.data || data?.productionOrders || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">MMOC MANUFACTURING ORDER CREATE – GENERAL ERP – ALIAS CO01 – {Array.isArray(items)?items.length:0} RECORDS – T0 BLOCKING – BOM-ROU-WC-LINK – NO DANGLING</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">PRODUCT_CODE * (EMTC) – General ERP Product – alias Material – must exist</div><input value={form.product_code} onChange={e=>setForm({...form,product_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="FG-1000 – FERT finished" /></div>
          <div><div className="text-[9px] text-zinc-500">FACILITY_CODE * (EFCC) – General ERP Facility – alias Plant – must exist</div><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="FAC-1000 – FACILITY" /></div>
          <div><div className="text-[9px] text-zinc-500">QUANTITY * – General ERP Planned Qty</div><input value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="10" /></div>
          <div><div className="text-[9px] text-zinc-500">BOM_CODE – MBMC alias CS01 – General ERP Bill of Materials – auto found by Product+Facility if blank</div><input value={form.bom_code} onChange={e=>setForm({...form,bom_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="BOM-1001 – optional – auto" /></div>
          <div><div className="text-[9px] text-zinc-500">ROUTING_CODE – MRTC alias CA01 – General ERP Manufacturing Routing – auto found if blank</div><input value={form.routing_code} onChange={e=>setForm({...form,routing_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="ROUTING-1001 – optional – auto" /></div>
          <div className="flex items-end"><button onClick={create} className="bg-black text-white px-3 py-1 w-full h-7">CREATE MMOC – CO01 – GENERAL ERP – T0</button></div>
        </div>
        <div className="text-[9px] text-zinc-500 mt-1">T0 BLOCKING – MMOC copies BOM MBMC components → mfg_production_order_component – used in GI 261 GBB/BSX – copies Routing MRTC operations → capacity + confirmation – GR 101 BSX finished receipt – OBYC BSX/GBB + OMJJ 261/101 + valuation_class + MAP – NO DANGLING</div>
      </div>
      <div className="grid gap-2">
        {(Array.isArray(items)?items:[]).slice(0,30).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2">
            <div className="flex justify-between"><div className="font-bold">{it.order_number} – {it.material_code} – {it.facility_code || it.plant_code} – qty {it.quantity_planned || it.quantity} – {it.status} – {it.component_count || it.components?.length || 0} comps</div><div className="flex gap-1">{it.status==='CREATED' && <button onClick={()=>transition(it,'RELEASED')} className="border-2 border-black px-2 bg-yellow-100">REL</button>}{it.status==='RELEASED' && <button onClick={()=>transition(it,'CONFIRMED')} className="border-2 border-black px-2 bg-emerald-100">CNF – GI261+GR101</button>}{it.status==='CONFIRMED' && <button onClick={()=>transition(it,'CLOSED')} className="border-2 border-black px-2 bg-zinc-100">TECO</button>}</div></div>
            <div className="text-[10px] text-zinc-600 mt-1">{it.components?.map((c:any)=>`${c.component_number}:${c.quantity_required}`).join(' ')}</div>
            <div className="text-[9px] text-zinc-400">BOM {it.bom_number} – valuation_class {it.inventory_valuation_class} – OBYC BSX/GBB lookup uses valuation_class – MAP – movement OMJJ 261 GI + 101 GR – universal ledger – T0 BLOCKING</div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T0 BLOCKING – GENERAL ERP – LOW IMPORTANCE – BOM-ROU-WC-LINK</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/foundation/materials`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EMTC Product – required header →</Link>
          <Link href={`/${companyCode}/foundation/materials`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EMTC Product – components →</Link>
          <Link href={`/${companyCode}/foundation/facilities`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EFCC Facility – required →</Link>
          <Link href={`/${companyCode}/pp/bom`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">MBMC BOM – required components copy →</Link>
          <Link href={`/${companyCode}/pp/routings`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">MRTC Routing – required operations →</Link>
          <Link href={`/${companyCode}/pp/work-centers`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">MWCC Work Center →</Link>
          <Link href={`/${companyCode}/mm/gr`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">IGRC Inventory Receipt 101 →</Link>
          <Link href={`/${companyCode}/mm/gr`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">IGRC GI 261 →</Link>
          <Link href={`/${companyCode}/fico/obyc`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">OBYC Auto Account BSX/GBB →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">🏭</div>
          <div>
            <div className="font-semibold">Manufacturing Orders – MMOC (alias CO01) – General ERP – T0 BLOCKING – BOM-ROU-WC-LINK</div>
            <div className="text-xs text-zinc-500">{Array.isArray(items)?items.length:0} orders • {companyCode} • MMOC copies BOM MBMC + Routing MRTC → GI 261 GBB/BSX + GR 101 BSX via OBYC + OMJJ + valuation_class + MAP – NO DANGLING</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <DbAutocomplete label="PRODUCT_CODE * – General ERP Product – EMTC – FERT" value={form.product_code} onChange={v=>setForm({...form,product_code:v})} apiUrl="/api/materials" codeField="item_number" nameField="description" placeholder="FG-1000 – finished" required createUrl={`/${companyCode}/foundation/materials`} createCode="EMTC" companyCode={companyCode} />
          <DbAutocomplete label="FACILITY_CODE * – General ERP Facility – EFCC – alias Plant" value={form.facility_code} onChange={v=>setForm({...form,facility_code:v})} apiUrl="/api/facilities" codeField="code" nameField="name" placeholder="FAC-1000" required createUrl={`/${companyCode}/foundation/facilities`} createCode="EFCC" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">QUANTITY * – General ERP Planned Qty</label><input value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="10" /></div>
          <DbAutocomplete label="BOM_CODE – MBMC alias CS01 – auto if blank" value={form.bom_code} onChange={v=>setForm({...form,bom_code:v})} apiUrl="/api/bom" codeField="bom_number" nameField="material_number" placeholder="BOM-1001 – auto found" createUrl={`/${companyCode}/pp/bom`} createCode="MBMC" companyCode={companyCode} />
          <DbAutocomplete label="ROUTING_CODE – MRTC alias CA01 – auto if blank" value={form.routing_code} onChange={v=>setForm({...form,routing_code:v})} apiUrl="/api/routings" codeField="routing_number" nameField="material_number" placeholder="ROUTING-1001 – auto" createUrl={`/${companyCode}/pp/routings`} createCode="MRTC" companyCode={companyCode} />
        </div>
        <button onClick={create} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Create Manufacturing Order MMOC – Alias CO01 – General ERP – T0 BLOCKING – BOM+Routing Copy</button>
        <div className="text-[10px] text-zinc-400 mt-2">T0 BLOCKING – MMOC copies BOM MBMC components → mfg_production_order_component – used in GI 261 GBB/BSX – copies Routing MRTC operations → capacity + confirmation CO11N – GR 101 BSX finished receipt – OBYC BSX/GBB uses valuation_class EMTC-FULL – OMJJ 261/101 + MAP + universal ledger – NO DANGLING – General ERP, SAP CO01 alias</div>
      </div>

      <div className="grid gap-4">
        {(Array.isArray(items)?items:[]).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-sm">{it.order_number} – {it.material_code} – {it.facility_code || it.plant_code} – qty {it.quantity_planned || it.quantity} – <span className={`px-2 py-0.5 rounded-full text-[10px] ${it.status==='CREATED'?'bg-zinc-100':it.status==='RELEASED'?'bg-yellow-100':it.status==='CONFIRMED'?'bg-emerald-100':'bg-zinc-900 text-white'}`}>{it.status}</span> – {it.component_count || it.components?.length || 0} comps</div>
                <div className="text-xs text-zinc-500 mt-1">BOM {it.bom_number} – valuation_class {it.inventory_valuation_class} – OBYC BSX/GBB lookup uses valuation_class – MAP – T0 BLOCKING</div>
                <div className="text-xs text-zinc-500 mt-1">{it.components?.slice(0,5).map((c:any)=>`${c.component_number}:${c.quantity_required}${c.uom_code}`).join(' • ')}</div>
              </div>
              <div className="flex gap-2">
                {it.status==='CREATED' && <button onClick={()=>transition(it,'RELEASED')} className="px-3 py-1.5 rounded-full bg-yellow-500 text-white text-xs">REL – Release – Availability Check</button>}
                {it.status==='RELEASED' && <button onClick={()=>transition(it,'CONFIRMED')} className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs">CNF – Confirm – GI 261 + GR 101 – CO11N</button>}
                {it.status==='CONFIRMED' && <button onClick={()=>transition(it,'CLOSED')} className="px-3 py-1.5 rounded-full bg-zinc-900 text-white text-xs">TECO – Technically Complete</button>}
              </div>
            </div>
            <div className="text-[10px] text-zinc-400 mt-2">MMOC – T0 BLOCKING – GI 261 component consumption GBB/BSX via OBYC – GR 101 finished receipt BSX via OBYC – valuation_class {it.inventory_valuation_class} – movement OMJJ 261/101 – MAP – universal ledger – NO DANGLING – General ERP</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T0 BLOCKING – General ERP – Low Importance – Auto from Dependencies – BOM-ROU-WC-LINK</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/foundation/materials`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EMTC</span><span>Product – required header</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/materials`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EMTC</span><span>Product – components – required</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/facilities`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EFCC</span><span>Facility – required</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/pp/bom`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">MBMC</span><span>BOM – required – components copy – CS01 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/pp/routings`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">MRTC</span><span>Routing – required – operations – CA01 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/pp/work-centers`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">MWCC</span><span>Work Center – CR01 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/mm/gr`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">IGRC</span><span>Inventory Receipt 101 – MIGO alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/obyc`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">OBYC</span><span>Auto Account BSX/GBB – uses valuation_class</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Manufacturing Order, Product, Facility, Bill of Materials, Routing, Work Center, Inventory Receipt/Issue, Auto Account Determination – SAP CO01/CS01/CA01/CR01/MIGO kept as alias – T0 BLOCKING – BOM components + Routing operations copied to Manufacturing Order – NO DANGLING – GI 261 GBB/BSX + GR 101 BSX via OBYC + OMJJ + valuation_class + MAP + universal ledger</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Manufacturing Orders" subtitle={`${Array.isArray(items)?items.length:0} orders • ${companyCode} • MMOC alias CO01 – General ERP – T0 BLOCKING – BOM-ROU-WC-LINK – NO DANGLING`} code="MMOC" module="PP" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
