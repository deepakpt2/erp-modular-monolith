"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';

export default function Page({ defaultMode, codeOverride, titleOverride }: { defaultMode?: any; codeOverride?: string; titleOverride?: string } = {}){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');
  const [header,setHeader]=useState({product_code: "", facility_code: "", base_quantity: "1", description: ""});
  const [components,setComponents]=useState<any[]>([{component_code: "", quantity: "1", uom_code: "PC"}]);

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/bom').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!header.product_code || !header.facility_code){ setMsg('❌ PRODUCT_CODE and FACILITY_CODE required – General ERP Product + Facility – alias Material/Plant'); return; }
    const payload = {
      item_number: header.product_code,
      facility_code: header.facility_code,
      base_quantity: header.base_quantity,
      description: header.description,
      lines: components.filter(c=>c.component_code).map((c,i)=>({
        component_number: c.component_code,
        quantity: c.quantity,
        uom_code: c.uom_code,
        line_number: (i+1)*10
      })),
      company_code: companyCode
    };
    const res = await fetch('/api/bom',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success || res.bom){
      setMsg(`✅ BOM ${res.bomNumber || res.bom?.bom_number} created – MBMC (alias CS01) – ${components.filter(c=>c.component_code).length} components – T0 BLOCKING – used in Manufacturing Order MMOC components copy – NO DANGLING`);
      load();
      setHeader({product_code: "", facility_code: "", base_quantity: "1", description: ""});
      setComponents([{component_code: "", quantity: "1", uom_code: "PC"}]);
    } else setMsg('❌ '+(res.error||'Failed'));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING MBMC – Bill of Materials – General ERP – alias CS01...</div>;
  const items = data?.boms || data?.data || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">MBMC BILL OF MATERIALS CREATE – GENERAL ERP – ALIAS CS01 – {Array.isArray(items)?items.length:0} RECORDS – T0 BLOCKING – COMPONENTS COPY TO MANUFACTURING ORDER</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">PRODUCT_CODE * (DB: EMTC) – General ERP Product, alias Material</div><input value={header.product_code} onChange={e=>setHeader({...header,product_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">FACILITY_CODE * (DB: EFCC) – General ERP Facility, alias Plant</div><input value={header.facility_code} onChange={e=>setHeader({...header,facility_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">BASE_QUANTITY – General ERP Base Qty</div><input value={header.base_quantity} onChange={e=>setHeader({...header,base_quantity:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div className="col-span-3"><div className="text-[9px] text-zinc-500">DESCRIPTION – General ERP</div><input value={header.description} onChange={e=>setHeader({...header,description:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
        </div>
        <div className="mt-3 border-2 border-black p-2">
          <div className="font-bold text-[10px]">COMPONENTS – T0 BLOCKING – Used in Manufacturing Order – General ERP Product Components, alias BOM Components</div>
          {components.map((c,idx)=>(
            <div key={idx} className="grid grid-cols-3 gap-2 mt-2">
              <input value={c.component_code} onChange={e=>{const n=[...components]; n[idx].component_code=e.target.value.toUpperCase(); setComponents(n);}} className="border-2 border-black px-1 py-1 uppercase" placeholder="" />
              <input value={c.quantity} onChange={e=>{const n=[...components]; n[idx].quantity=e.target.value; setComponents(n);}} className="border-2 border-black px-1 py-1" placeholder="" />
              <div className="flex gap-1"><input value={c.uom_code} onChange={e=>{const n=[...components]; n[idx].uom_code=e.target.value.toUpperCase(); setComponents(n);}} className="border-2 border-black px-1 py-1 w-full uppercase" placeholder="" /><button onClick={()=>setComponents(components.filter((_,i)=>i!==idx))} className="border-2 border-black px-2 bg-red-50">X</button></div>
            </div>
          ))}
          <button onClick={()=>setComponents([...components,{component_code: "", quantity: "1", uom_code: "PC"}])} className="mt-2 border-2 border-black px-3 py-1 bg-zinc-100">+ ADD COMPONENT</button>
        </div>
        <button onClick={create} className="mt-3 bg-black text-white px-3 py-1 w-full">CREATE BOM MBMC – ALIAS CS01 – GENERAL ERP</button>
        <div className="text-[9px] text-zinc-500 mt-1">T0 BLOCKING – BOM components copied to Manufacturing Order MMOC (alias MMOC (legacy CO01)) on creation – NO DANGLING – used in costing CK40N + MRP explosion MD01</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {(Array.isArray(items)?items:[]).slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2">
            <div className="font-bold">{it.bom_number} – {it.material_number || it.item_number} – {it.facility_code} – {it.line_count || it.lines?.length || 0} comps</div>
            <div className="text-[10px] text-zinc-600">{it.lines?.map((l:any)=>`${l.component_number || l.component_material_id}:${l.quantity}`).join(' ') || ''}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T0 BLOCKING – GENERAL ERP – LOW IMPORTANCE</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/foundation/materials`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EMTC Product – header – required →</Link>
          <Link href={`/${companyCode}/foundation/materials`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EMTC Product – component – required →</Link>
          <Link href={`/${companyCode}/foundation/facilities`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EFCC Facility – required →</Link>
          <Link href={`/${companyCode}/pp/work-centers`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">MWCC Work Center →</Link>
          <Link href={`/${companyCode}/pp/production-orders`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">MMOC Manufacturing Order uses BOM →</Link>
          <Link href={`/${companyCode}/fico/costing-run`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">CCRP Costing Run uses BOM →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">📋</div>
          <div>
            <div className="font-semibold">Bill of Materials – MBMC (alias CS01) – General ERP</div>
            <div className="text-xs text-zinc-500">{Array.isArray(items)?items.length:0} BOMs • {companyCode} • T0 BLOCKING – Components → Manufacturing Order MMOC – NO DANGLING</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DbAutocomplete label="PRODUCT_CODE * – General ERP Product, alias Material" value={header.product_code} onChange={v=>setHeader({...header,product_code:v})} apiUrl="/api/materials" codeField="item_number" nameField="description" placeholder="" required createUrl={`/${companyCode}/foundation/materials`} createCode="EMTC" companyCode={companyCode} />
          <DbAutocomplete label="FACILITY_CODE * – General ERP Facility, alias Plant" value={header.facility_code} onChange={v=>setHeader({...header,facility_code:v})} apiUrl="/api/facilities" codeField="code" nameField="name" placeholder="" required createUrl={`/${companyCode}/foundation/facilities`} createCode="EFCC" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">BASE_QUANTITY * – General ERP</label><input value={header.base_quantity} onChange={e=>setHeader({...header,base_quantity:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] focus:outline-none focus:ring-1 focus:ring-black focus:border-black focus:border-black" placeholder="" /></div>
        </div>
        <div className="mt-4"><label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">DESCRIPTION – General ERP</label><input value={header.description} onChange={e=>setHeader({...header,description:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]" placeholder="" /></div>

        <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
          <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-3">Components – T0 BLOCKING – General ERP Product Components – Copied to Manufacturing Order MMOC – NO DANGLING – Used in MRP explosion + Costing CK40N</h4>
          {components.map((c,idx)=>(
            <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 bg-white rounded-xl border p-3">
              <DbAutocomplete label={`COMPONENT ${idx+1} * – Product`} value={c.component_code} onChange={v=>{const n=[...components]; n[idx].component_code=v; setComponents(n);}} apiUrl="/api/materials" codeField="item_number" nameField="description" placeholder="" required createUrl={`/${companyCode}/foundation/materials`} createCode="EMTC" companyCode={companyCode} />
              <div><label className="text-[11px] font-medium">QUANTITY *</label><input value={c.quantity} onChange={e=>{const n=[...components]; n[idx].quantity=e.target.value; setComponents(n);}} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]" placeholder="" /></div>
              <div className="flex gap-2"><div className="flex-1"><label className="text-[11px] font-medium">UOM</label><input value={c.uom_code} onChange={e=>{const n=[...components]; n[idx].uom_code=e.target.value.toUpperCase(); setComponents(n);}} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div><button onClick={()=>setComponents(components.filter((_,i)=>i!==idx))} className="mt-6 h-10 px-3 rounded-xl border bg-red-50 text-xs">Remove</button></div>
            </div>
          ))}
          <button onClick={()=>setComponents([...components,{component_code: "", quantity: "1", uom_code: "PC"}])} className="mt-4 px-4 py-2 rounded-full border bg-white text-xs hover:bg-zinc-50">+ Add Component – General ERP</button>
        </div>

        <button onClick={create} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 h-[32px] text-[13px] font-medium transition-colors">Create Bill of Materials MBMC – Alias CS01 – General ERP – T0 BLOCKING</button>
        <div className="text-[10px] text-zinc-400 mt-2">T0 BLOCKING – BOM components copied to Manufacturing Order MMOC (alias MMOC (legacy CO01)) on creation – used in MRP MD01 explosion + costing CK40N – NO DANGLING – General ERP terminology, SAP CS01 kept as alias</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(Array.isArray(items)?items:[]).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start"><div className="font-semibold text-sm">{it.bom_number} – {it.material_number || it.item_number} – {it.facility_code} – {it.line_count || it.lines?.length || 0} comps</div><span className="text-[10px] bg-purple-600 text-white rounded-full px-2 py-0.5">MBMC</span></div>
            <div className="mt-2 text-xs text-zinc-500">{it.lines?.slice(0,5).map((l:any)=>`${l.component_number || 'COMP'}:${l.quantity}${l.uom || ''}`).join(' • ')}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T0 BLOCKING – General ERP – Low Importance – Auto from Dependencies</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/foundation/materials`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EMTC</span><span>Product – header – required</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/materials`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EMTC</span><span>Product – component – required</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/facilities`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EFCC</span><span>Facility – required</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/pp/work-centers`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">MWCC</span><span>Work Center</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/pp/production-orders`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">MMOC</span><span>Manufacturing Order uses BOM</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/costing-run`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">CCRP</span><span>Costing Run uses BOM</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Bill of Materials, Product, Facility – SAP CS01 kept as searchable alias – T0 BLOCKING – NO DANGLING – components used in Manufacturing Order + MRP + Costing</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title={titleOverride || "Bill of Materials"} subtitle={`${Array.isArray(items)?items.length:0} BOMs • ${companyCode} • MBMC alias CS01 – General ERP – T0 BLOCKING`} code={codeOverride || "MBMC"} module="PP" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
