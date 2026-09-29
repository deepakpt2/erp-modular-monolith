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
  const [header,setHeader]=useState({product_code: "", facility_code: "", description: "", bom_code: ""});
  const [operations,setOperations]=useState<any[]>([{operation_number: "0010", work_center_code: "", description: "Blending", setup_time: "10", machine_time: "30", labor_time: "30"}]);

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/routings').then(r=>r.json());
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
      description: header.description,
      bom_number: header.bom_code,
      operations: operations.filter(o=>o.work_center_code || o.description).map(o=>({
        operation_number: o.operation_number,
        work_center_code: o.work_center_code,
        description: o.description,
        setup_time_minutes: parseInt(o.setup_time||'0'),
        machine_time_minutes: parseInt(o.machine_time||'0'),
        labor_time_minutes: parseInt(o.labor_time||'0'),
        base_quantity: 1
      })),
      company_code: companyCode
    };
    const res = await fetch('/api/routings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success || res.routing){
      setMsg(`✅ Routing ${res.routingNumber || res.routing?.routing_number} created – MRTC (alias CA01) – ${operations.length} operations – T0 BLOCKING – operations copied to Manufacturing Order MMOC – NO DANGLING – General ERP`);
      load();
      setHeader({product_code: "", facility_code: "", description: "", bom_code: ""});
      setOperations([{operation_number: "0010", work_center_code: "", description: "Blending", setup_time: "10", machine_time: "30", labor_time: "30"}]);
    } else setMsg('❌ '+(res.error||'Failed'));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING MRTC – Manufacturing Routing – General ERP – alias CA01 – T0 BLOCKING...</div>;
  const items = data?.routings || data?.data || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">MRTC MANUFACTURING ROUTING CREATE – GENERAL ERP – ALIAS CA01 – {Array.isArray(items)?items.length:0} RECORDS – T0 BLOCKING – OPERATIONS → MANUFACTURING ORDER</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">PRODUCT_CODE * (DB: EMTC) – General ERP Product</div><input value={header.product_code} onChange={e=>setHeader({...header,product_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">FACILITY_CODE * (DB: EFCC) – General ERP Facility</div><input value={header.facility_code} onChange={e=>setHeader({...header,facility_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">BOM_CODE – General ERP Bill of Materials, alias CS01</div><input value={header.bom_code} onChange={e=>setHeader({...header,bom_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div className="col-span-3"><div className="text-[9px] text-zinc-500">DESCRIPTION – General ERP</div><input value={header.description} onChange={e=>setHeader({...header,description:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
        </div>
        <div className="mt-3 border-2 border-black p-2">
          <div className="font-bold text-[10px]">OPERATIONS – T0 BLOCKING – General ERP Manufacturing Steps – Copied to Manufacturing Order MMOC – NO DANGLING</div>
          {operations.map((op,idx)=>(
            <div key={idx} className="grid grid-cols-6 gap-1 mt-2">
              <input value={op.operation_number} onChange={e=>{const n=[...operations]; n[idx].operation_number=e.target.value; setOperations(n);}} className="border-2 border-black px-1 py-1" placeholder="" />
              <input value={op.work_center_code} onChange={e=>{const n=[...operations]; n[idx].work_center_code=e.target.value.toUpperCase(); setOperations(n);}} className="border-2 border-black px-1 py-1 uppercase" placeholder="" />
              <input value={op.description} onChange={e=>{const n=[...operations]; n[idx].description=e.target.value; setOperations(n);}} className="border-2 border-black px-1 py-1" placeholder="" />
              <input value={op.setup_time} onChange={e=>{const n=[...operations]; n[idx].setup_time=e.target.value; setOperations(n);}} className="border-2 border-black px-1 py-1" placeholder="" />
              <input value={op.machine_time} onChange={e=>{const n=[...operations]; n[idx].machine_time=e.target.value; setOperations(n);}} className="border-2 border-black px-1 py-1" placeholder="" />
              <div className="flex gap-1"><input value={op.labor_time} onChange={e=>{const n=[...operations]; n[idx].labor_time=e.target.value; setOperations(n);}} className="border-2 border-black px-1 py-1 w-full" placeholder="" /><button onClick={()=>setOperations(operations.filter((_,i)=>i!==idx))} className="border-2 border-black px-1 bg-red-50">X</button></div>
            </div>
          ))}
          <button onClick={()=>setOperations([...operations,{operation_number: String((operations.length+1)*10).padStart(4,'0'), work_center_code: "", description: "", setup_time: "10", machine_time: "30", labor_time: "30"}])} className="mt-2 border-2 border-black px-3 py-1 bg-zinc-100">+ ADD OPERATION</button>
        </div>
        <button onClick={create} className="mt-3 bg-black text-white px-3 py-1 w-full">CREATE ROUTING MRTC – ALIAS CA01 – GENERAL ERP – T0 BLOCKING</button>
        <div className="text-[9px] text-zinc-500 mt-1">T0 BLOCKING – Routing operations copied to Manufacturing Order MMOC (alias CO01) on creation – NO DANGLING – used in capacity CM01 + costing CK40N + confirmation CO11N</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {(Array.isArray(items)?items:[]).slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2">
            <div className="font-bold">{it.routing_number} – {it.material_number || it.item_number} – {it.facility_code} – {it.operation_count || it.operations?.length || 0} ops</div>
            <div className="text-[10px] text-zinc-600">{it.operations?.map((o:any)=>`${o.operation_number}:${o.work_center_code}:${o.description}`).join(' ') || ''}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T0 BLOCKING – GENERAL ERP – LOW IMPORTANCE</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/foundation/materials`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EMTC Product – required →</Link>
          <Link href={`/${companyCode}/foundation/facilities`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EFCC Facility – required →</Link>
          <Link href={`/${companyCode}/pp/work-centers`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">MWCC Work Center – required per operation →</Link>
          <Link href={`/${companyCode}/pp/bom`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">MBMC BOM – links routing →</Link>
          <Link href={`/${companyCode}/pp/production-orders`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">MMOC Manufacturing Order uses Routing →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">🔄</div>
          <div>
            <div className="font-semibold">Manufacturing Routing – MRTC (alias CA01) – General ERP</div>
            <div className="text-xs text-zinc-500">{Array.isArray(items)?items.length:0} routings • {companyCode} • T0 BLOCKING – Operations → Manufacturing Order MMOC – NO DANGLING</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DbAutocomplete label="PRODUCT_CODE * – General ERP Product" value={header.product_code} onChange={v=>setHeader({...header,product_code:v})} apiUrl="/api/materials" codeField="item_number" nameField="description" placeholder="" required createUrl={`/${companyCode}/foundation/materials`} createCode="EMTC" companyCode={companyCode} />
          <DbAutocomplete label="FACILITY_CODE * – General ERP Facility" value={header.facility_code} onChange={v=>setHeader({...header,facility_code:v})} apiUrl="/api/facilities" codeField="code" nameField="name" placeholder="" required createUrl={`/${companyCode}/foundation/facilities`} createCode="EFCC" companyCode={companyCode} />
          <DbAutocomplete label="BOM_CODE – Links BOM+Routing – General ERP" value={header.bom_code} onChange={v=>setHeader({...header,bom_code:v})} apiUrl="/api/bom" codeField="bom_number" nameField="material_number" placeholder="" createUrl={`/${companyCode}/pp/bom`} createCode="MBMC" companyCode={companyCode} />
        </div>
        <div className="mt-4"><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">DESCRIPTION – General ERP</label><input value={header.description} onChange={e=>setHeader({...header,description:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>

        <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
          <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-3">Operations – T0 BLOCKING – General ERP Manufacturing Steps – Copied to Manufacturing Order – NO DANGLING – Used in Capacity + Costing + Confirmation CO11N</h4>
          {operations.map((op,idx)=>(
            <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-3 bg-white rounded-xl border p-3">
              <div><label className="text-[11px] font-medium">OP No *</label><input value={op.operation_number} onChange={e=>{const n=[...operations]; n[idx].operation_number=e.target.value; setOperations(n);}} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
              <DbAutocomplete label={`Work Center * – MWCC`} value={op.work_center_code} onChange={v=>{const n=[...operations]; n[idx].work_center_code=v; setOperations(n);}} apiUrl="/api/work-centers" codeField="code" nameField="name" placeholder="" required createUrl={`/${companyCode}/pp/work-centers`} createCode="MWCC" companyCode={companyCode} />
              <div><label className="text-[11px] font-medium">Description</label><input value={op.description} onChange={e=>{const n=[...operations]; n[idx].description=e.target.value; setOperations(n);}} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
              <div><label className="text-[11px] font-medium">Setup min</label><input value={op.setup_time} onChange={e=>{const n=[...operations]; n[idx].setup_time=e.target.value; setOperations(n);}} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
              <div><label className="text-[11px] font-medium">Machine min</label><input value={op.machine_time} onChange={e=>{const n=[...operations]; n[idx].machine_time=e.target.value; setOperations(n);}} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
              <div className="flex gap-2"><div className="flex-1"><label className="text-[11px] font-medium">Labor min</label><input value={op.labor_time} onChange={e=>{const n=[...operations]; n[idx].labor_time=e.target.value; setOperations(n);}} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div><button onClick={()=>setOperations(operations.filter((_,i)=>i!==idx))} className="mt-6 h-10 px-3 rounded-xl border bg-red-50 text-xs">Remove</button></div>
            </div>
          ))}
          <button onClick={()=>setOperations([...operations,{operation_number: String((operations.length+1)*10).padStart(4,'0'), work_center_code: "", description: "", setup_time: "10", machine_time: "30", labor_time: "30"}])} className="mt-4 px-4 py-2 rounded-full border bg-white text-xs hover:bg-zinc-50">+ Add Operation – General ERP – alias CA02 operation</button>
        </div>

        <button onClick={create} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Create Manufacturing Routing MRTC – Alias CA01 – General ERP – T0 BLOCKING</button>
        <div className="text-[10px] text-zinc-400 mt-2">T0 BLOCKING – Routing operations copied to Manufacturing Order MMOC (alias CO01) on creation – used in capacity CM01 + costing CK40N + confirmation CO11N – NO DANGLING – General ERP terminology, SAP CA01 kept as alias</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(Array.isArray(items)?items:[]).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start"><div className="font-semibold text-sm">{it.routing_number} – {it.material_number || it.item_number} – {it.facility_code} – {it.operation_count || it.operations?.length || 0} ops</div><span className="text-[10px] bg-purple-600 text-white rounded-full px-2 py-0.5">MRTC</span></div>
            <div className="mt-2 text-xs text-zinc-500">{it.operations?.slice(0,3).map((o:any)=>`${o.operation_number}:${o.work_center_code}:${o.description} (${o.machine_time_minutes||0}m)`).join(' • ')}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T0 BLOCKING – General ERP – Low Importance</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/foundation/materials`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EMTC</span><span>Product – required</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/facilities`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EFCC</span><span>Facility – required</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/pp/work-centers`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">MWCC</span><span>Work Center – required per op</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/pp/bom`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">MBMC</span><span>BOM – links routing</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/pp/production-orders`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">MMOC</span><span>Manufacturing Order uses Routing</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Manufacturing Routing, Product, Facility, Work Center, Operation – SAP CA01 kept as alias – T0 BLOCKING – NO DANGLING – operations used in Manufacturing Order + Capacity + Costing</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Manufacturing Routings" subtitle={`${Array.isArray(items)?items.length:0} routings • ${companyCode} • MRTC alias CA01 – General ERP – T0 BLOCKING`} code="MRTC" module="PP" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
