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
  const [form,setForm]=useState({material_code: "", facility_code: "FAC-1000", costing_variant: "PPC1", action: "CK11N"});
  const [markForm,setMarkForm]=useState({estimate_number: "", action: "MARK"});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/cost-estimate').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function createEstimate(){
    if(!form.material_code){ setMsg('❌ MATERIAL_CODE required – CK11N – T1 REQUIRED'); return; }
    const payload = { material_code: form.material_code, facility_code: form.facility_code, costing_variant: form.costing_variant, company_code: companyCode, action: form.action };
    const res = await fetch('/api/cost-estimate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ CK11N Cost Estimate ${res.estimate_number} – material ${form.material_code} plant ${form.facility_code} – total ${res.costEstimate?.total_cost||res.rollup?.totalCost} material ${res.rollup?.materialCost} prev ${res.rollup?.previousPrice} new ${res.rollup?.totalCost} diff ${res.rollup?.totalCost - (res.rollup?.previousPrice||0)} – T1 REQUIRED – NO DANGLING – cost fields used in CK24 price update + FI valuation – General ERP – SAP CK11N/CK24/CK40N alias`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  async function markRelease(){
    if(!markForm.estimate_number){ setMsg('❌ ESTIMATE_NUMBER required – CK24 – T1 REQUIRED'); return; }
    const payload = { estimate_number: markForm.estimate_number, action: markForm.action };
    const res = await fetch('/api/cost-estimate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ CK24 ${markForm.action} – estimate ${markForm.estimate_number} – ${res.message} – T1 REQUIRED – NO DANGLING – price fields used in FI valuation – General ERP`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING CK11N – Cost Estimate – T1 REQUIRED...</div>;
  const estimates = data?.costEstimates || data?.data || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">CK11N CREATE MATERIAL COST ESTIMATE + CK24 MARK/RELEASE – GENERAL ERP – {estimates.length} ESTIMATES – T1 REQUIRED – CK11N-CK24-CK40N – COSTING RUN – NO DANGLING</div>
        <div className="grid grid-cols-4 gap-2">
          <div><div className="text-[9px] text-zinc-500">MATERIAL_CODE * (EMTC) – General ERP Item – FERT to cost – must exist</div><input value={form.material_code} onChange={e=>setForm({...form,material_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">FACILITY_CODE – FAC-1000 – General ERP Facility – plant</div><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">COSTING_VARIANT – PPC1 – costing variant</div><select value={form.costing_variant} onChange={e=>setForm({...form,costing_variant:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>PPC1</option><option>PPC2</option></select></div>
          <div><div className="text-[9px] text-zinc-500">ACTION – CK11N create estimate</div><select value={form.action} onChange={e=>setForm({...form,action:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>CK11N</option></select></div>
        </div>
        <button onClick={createEstimate} className="mt-3 bg-black text-white px-3 py-1 w-full">CREATE CK11N COST ESTIMATE – BOM EXPLOSION + COST ROLLUP – T1 REQUIRED</button>
        <div className="grid grid-cols-3 gap-2 mt-3 border-t-2 border-black pt-2">
          <div><div className="text-[9px] text-zinc-500">ESTIMATE_NUMBER * – CE-xxx – for CK24 MARK/RELEASE</div><input value={markForm.estimate_number} onChange={e=>setMarkForm({...markForm,estimate_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">ACTION – MARK or RELEASE – CK24</div><select value={markForm.action} onChange={e=>setMarkForm({...markForm,action:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>MARK</option><option>RELEASE</option></select></div>
          <div><button onClick={markRelease} className="w-full bg-zinc-900 text-white px-3 py-1 mt-4">CK24 MARK/RELEASE – UPDATE STD PRICE</button></div>
        </div>
        <div className="text-[9px] text-zinc-500 mt-1">T1 REQUIRED – CK11N: Create cost estimate for single material – BOM explosion + cost rollup – no update yet – CK24: Mark cost estimate + release – updates standard price in material plant – CK40N already exists – costing run for multiple materials – Tables: co_cost_estimate (CK11N) + co_costing_run (CK40N) – NO DANGLING – cost estimate fields used in CK24 price update + FI posting + material valuation – General ERP, SAP CK11N/CK24/CK40N alias – chain: BOM → cost rollup → estimate → marking → std price update → FI valuation</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {estimates.slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2"><div className="font-bold">{it.estimate_number} – {it.material_code||it.material_id} – plant {it.facility_code||it.facility_id} – total {it.total_cost} material {it.material_cost} prev {it.previous_price} new {it.new_price} diff {it.price_difference} – {it.status} {it.marked?'MARKED':''} {it.released?'RELEASED':''}</div></div>
        ))}
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T1 REQUIRED – GENERAL ERP – LOW IMPORTANCE – COSTING</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/foundation/materials`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EMTC Materials – FERT/ROH →</Link>
          <Link href={`/${companyCode}/pp/bom`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EBOM BOM – components →</Link>
          <Link href={`/${companyCode}/pp/costing-run`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">CK40N Costing Run →</Link>
          <Link href={`/${companyCode}/fico/universal-ledger`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FULC Universal Ledger – valuation →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">💰</div>
          <div>
            <div className="font-semibold">Material Cost Estimate – CK11N (alias CK11N) + CK24 Mark/Release – General ERP – T1 REQUIRED – CK11N-CK24-CK40N</div>
            <div className="text-xs text-zinc-500">{estimates.length} estimates • {companyCode} • CK11N creates cost estimate via BOM explosion + cost rollup – CK24 marking + price update – updates std price – NO DANGLING – cost fields used in FI valuation</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DbAutocomplete label="MATERIAL_CODE * – EMTC – FERT to cost – T1" value={form.material_code} onChange={v=>setForm({...form,material_code:v})} apiUrl="/api/materials" codeField="material_code" nameField="name" placeholder="" required createUrl={`/${companyCode}/foundation/materials`} createCode="EMTC" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium">FACILITY_CODE – FAC-1000 – plant</label><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">COSTING_VARIANT – PPC1</label><select value={form.costing_variant} onChange={e=>setForm({...form,costing_variant:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"><option>PPC1</option><option>PPC2</option></select></div>
          <div><label className="text-[11px] font-medium">ACTION – CK11N create estimate</label><select value={form.action} onChange={e=>setForm({...form,action:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"><option>CK11N</option></select></div>
        </div>
        <button onClick={createEstimate} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Create CK11N Cost Estimate – BOM Explosion + Cost Rollup – T1 REQUIRED – NO DANGLING</button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 border-t border-zinc-200 pt-6">
          <div><label className="text-[11px] font-medium">ESTIMATE_NUMBER * – CE-xxx – for CK24 MARK/RELEASE</label><input value={markForm.estimate_number} onChange={e=>setMarkForm({...markForm,estimate_number:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">ACTION – MARK or RELEASE – CK24</label><select value={markForm.action} onChange={e=>setMarkForm({...markForm,action:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"><option>MARK</option><option>RELEASE</option></select></div>
          <div><button onClick={markRelease} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">CK24 Mark/Release – Update Std Price – T1</button></div>
        </div>
        <div className="text-[10px] text-zinc-400 mt-2">T1 REQUIRED – CK11N: Create cost estimate for single material – BOM explosion + cost rollup – no update yet – CK24: Mark cost estimate + release – updates standard price in material plant – CK40N already exists – costing run for multiple materials – Tables: co_cost_estimate (CK11N) + co_costing_run (CK40N) – NO DANGLING – cost estimate fields used in CK24 price update + FI posting + material valuation – General ERP, SAP CK11N/CK24/CK40N alias – chain: BOM → cost rollup → estimate → marking → std price update → FI valuation</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {estimates.map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start"><div className="font-semibold text-sm">{it.estimate_number} – {it.material_code||it.material_id} – plant {it.facility_code||it.facility_id} – total {it.total_cost} – {it.status}</div><span className="text-[10px] bg-zinc-900 text-white rounded-full px-2 py-0.5">{it.status}</span></div>
            <div className="mt-2 text-xs text-zinc-500">Material {it.material_cost} prev {it.previous_price} new {it.new_price} diff {it.price_difference} – {it.marked?'MARKED':''} {it.released?'RELEASED':''} – BOM explosion → cost rollup – T1 – NO DANGLING</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T1 REQUIRED – General ERP – Low Importance – Costing</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/foundation/materials`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EMTC</span><span>Materials – FERT/ROH – MM01 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/pp/bom`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EBOM</span><span>BOM – components – CS01 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/pp/costing-run`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">CK40N</span><span>Costing Run – CK40N – cost rollup all FERT</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/universal-ledger`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FULC</span><span>Universal Ledger – valuation – ACDOCA alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Material Cost Estimate, BOM Explosion, Cost Rollup, Marking, Price Update, Standard Price, Material Valuation, Costing Run – SAP CK11N/CK24/CK40N/CS01/MM01 kept as alias – T1 REQUIRED – CK11N creates cost estimate via BOM explosion + cost rollup, CK24 marking + price update – updates std price – NO DANGLING – cost fields used in FI valuation – costing run chain: BOM → cost rollup → estimate → marking → std price update → FI valuation</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Cost Estimate" subtitle={`${estimates.length} estimates • ${companyCode} • CK11N alias CK11N + CK24 – General ERP – T1 REQUIRED – CK11N-CK24-CK40N`} code="CK11N" module="PP" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
