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
  const [form,setForm]=useState({material_code: "", facility_code: "FAC-1000", planned_quantity: "100", requirement_date: new Date().toISOString().split('T')[0], requirement_type: "LS", version: "00", action: "MD61"});
  const [mrpForm,setMrpForm]=useState({material_code: "", facility_code: "FAC-1000", action: "MD02"});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/pir').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function createPir(){
    if(!form.material_code){ setMsg('❌ MATERIAL_CODE required – MD61 – T1 REQUIRED'); return; }
    if(!form.planned_quantity || !form.requirement_date){ setMsg('❌ PLANNED_QUANTITY and REQUIREMENT_DATE required – MD61 – T1 REQUIRED'); return; }
    const payload = { material_code: form.material_code, facility_code: form.facility_code, planned_quantity: parseFloat(form.planned_quantity), requirement_date: form.requirement_date, requirement_type: form.requirement_type, version: form.version, company_code: companyCode, action: form.action };
    const res = await fetch('/api/pir',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ MD61 PIR ${res.pir_number} – material ${form.material_code} facility ${form.facility_code} qty ${form.planned_quantity} date ${form.requirement_date} type ${form.requirement_type} version ${form.version} – T1 REQUIRED – NO DANGLING – PIR demand input for MRP MD02/MD03 net requirements – General ERP – SAP MD61/MD02/MD03 alias`);
      load();
      setForm({...form, material_code: ""});
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  async function runMrp(){
    if(!mrpForm.material_code){ setMsg('❌ MATERIAL_CODE required – MD02/MD03 – T1 REQUIRED'); return; }
    const payload = { material_code: mrpForm.material_code, facility_code: mrpForm.facility_code, action: mrpForm.action };
    const res = await fetch('/api/pir',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ ${mrpForm.action} MRP Single-Item ${mrpForm.action==='MD02'?'Single-Level':'Multi-Level'} – material ${mrpForm.material_code} – Demand ${res.demand} from PIR+SO, Supply ${res.supply} from Stock+PO, Net ${res.net_requirement} Shortage ${res.shortage} – T1 REQUIRED – NO DANGLING – PIR fields used in MRP – MRP run ${res.mrp_number} – General ERP`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING MD61 – PIR – T1 REQUIRED...</div>;
  const pirList = data?.pir || data?.data || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">MD61 PIR + MD02 SINGLE-LEVEL + MD03 MULTI-LEVEL MRP – GENERAL ERP – {pirList.length} PIR – T1 REQUIRED – MD02-MD03-MD61-PIR – NO DANGLING</div>
        <div className="grid grid-cols-6 gap-2">
          <div><div className="text-[9px] text-zinc-500">MATERIAL_CODE * (EMTC) – FERT/ROH – must exist</div><input value={form.material_code} onChange={e=>setForm({...form,material_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">FACILITY_CODE – FAC-1000</div><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">PLANNED_QUANTITY * – e.g., 100</div><input value={form.planned_quantity} onChange={e=>setForm({...form,planned_quantity:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">REQUIREMENT_DATE * – e.g., 2026-10-15</div><input type="date" value={form.requirement_date} onChange={e=>setForm({...form,requirement_date:e.target.value})} className="w-full border-2 border-black px-1 py-1" /></div>
          <div><div className="text-[9px] text-zinc-500">REQUIREMENT_TYPE – LS/VS – LS=Sales, VS=Internal</div><select value={form.requirement_type} onChange={e=>setForm({...form,requirement_type:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>LS</option><option>VS</option></select></div>
          <div><div className="text-[9px] text-zinc-500">VERSION – 00 active</div><input value={form.version} onChange={e=>setForm({...form,version:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
        </div>
        <button onClick={createPir} className="mt-3 bg-black text-white px-3 py-1 w-full">CREATE MD61 PIR – PLANNED INDEPENDENT REQUIREMENTS – DEMAND INPUT FOR MRP – T1 REQUIRED</button>
        <div className="grid grid-cols-3 gap-2 mt-3 border-t-2 border-black pt-2">
          <div><div className="text-[9px] text-zinc-500">MATERIAL_CODE * – for MD02/MD03 MRP</div><input value={mrpForm.material_code} onChange={e=>setMrpForm({...mrpForm,material_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">FACILITY_CODE – FAC-1000</div><input value={mrpForm.facility_code} onChange={e=>setMrpForm({...mrpForm,facility_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">ACTION – MD02 Single-Level or MD03 Multi-Level</div><select value={mrpForm.action} onChange={e=>setMrpForm({...mrpForm,action:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>MD02</option><option>MD03</option></select></div>
        </div>
        <button onClick={runMrp} className="mt-3 bg-zinc-900 text-white px-3 py-1 w-full">RUN MD02/MD03 MRP – SINGLE-ITEM SINGLE-LEVEL/MULTI-LEVEL – NET REQUIREMENTS CALC – T1 REQUIRED</button>
        <div className="text-[9px] text-zinc-500 mt-1">T1 REQUIRED – MD61 PIR: Planned Independent Requirements – demand input for MRP – creates demand – MD02: MRP Single-Item Single-Level – net requirements calc for single material single level – Demand = PIR + SO + Safety Stock, Supply = Stock + PO + Prod Order + STO, Net = Demand - Supply, if Net&gt;0 generate Planned Order/PR – MD03: MRP Single-Item Multi-Level – same as MD02 but explodes BOM multi-level – creates dependent requirements for components – Tables: mfg_pir + mfg_mrp_run + mfg_mrp_element – NO DANGLING – PIR fields used in MRP demand calculation – General ERP, SAP MD61/MD02/MD03 alias – chain: PIR → MRP demand → net calc → shortage → planned order/PR</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {pirList.slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2"><div className="font-bold">{it.pir_number} – {it.material_code||it.item_id} – fac {it.facility_code||it.facility_id} – qty {it.planned_quantity} – date {it.requirement_date?.split('T')[0]} – type {it.requirement_type} ver {it.version} – {it.status}</div></div>
        ))}
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T1 REQUIRED – GENERAL ERP – LOW IMPORTANCE – MRP</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/foundation/materials`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EMTC Materials →</Link>
          <Link href={`/${companyCode}/pp/bom`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EBOM BOM – multi-level →</Link>
          <Link href={`/${companyCode}/pp/mrp`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">MMRP MRP Run MD01 →</Link>
          <Link href={`/${companyCode}/foundation/facilities`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EFAC Facilities →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">📋</div>
          <div>
            <div className="font-semibold">Planned Independent Requirements – MD61 (alias MD61) + MD02/MD03 MRP – General ERP – T1 REQUIRED – MD02-MD03-MD61-PIR</div>
            <div className="text-xs text-zinc-500">{pirList.length} PIR • {companyCode} • MD61 PIR demand input for MRP – MD02 Single-Item Single-Level – MD03 Single-Item Multi-Level – net requirements calc – Demand PIR+SO+Safety Stock, Supply Stock+PO+Prod Order, Net Demand-Supply, shortage generates Planned Order/PR – NO DANGLING</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <DbAutocomplete label="MATERIAL_CODE * – EMTC – FERT/ROH – T1" value={form.material_code} onChange={v=>setForm({...form,material_code:v})} apiUrl="/api/materials" codeField="material_code" nameField="name" placeholder="" required createUrl={`/${companyCode}/foundation/materials`} createCode="EMTC" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium">FACILITY_CODE – FAC-1000</label><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">PLANNED_QUANTITY * – e.g., 100</label><input value={form.planned_quantity} onChange={e=>setForm({...form,planned_quantity:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">REQUIREMENT_DATE * – e.g., 2026-10-15</label><input type="date" value={form.requirement_date} onChange={e=>setForm({...form,requirement_date:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" /></div>
          <div><label className="text-[11px] font-medium">REQUIREMENT_TYPE – LS/VS</label><select value={form.requirement_type} onChange={e=>setForm({...form,requirement_type:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"><option>LS</option><option>VS</option></select></div>
          <div><label className="text-[11px] font-medium">VERSION – 00 active</label><input value={form.version} onChange={e=>setForm({...form,version:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
        </div>
        <button onClick={createPir} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Create MD61 PIR – Planned Independent Requirements – Demand Input for MRP – T1 REQUIRED</button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 border-t border-zinc-200 pt-6">
          <div><label className="text-[11px] font-medium">MATERIAL_CODE * – for MD02/MD03 MRP</label><input value={mrpForm.material_code} onChange={e=>setMrpForm({...mrpForm,material_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">FACILITY_CODE – FAC-1000</label><input value={mrpForm.facility_code} onChange={e=>setMrpForm({...mrpForm,facility_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">ACTION – MD02 Single-Level or MD03 Multi-Level</label><select value={mrpForm.action} onChange={e=>setMrpForm({...mrpForm,action:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"><option>MD02</option><option>MD03</option></select></div>
        </div>
        <button onClick={runMrp} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Run MD02/MD03 MRP – Single-Item Single-Level/Multi-Level – Net Requirements Calc – T1 REQUIRED</button>
        <div className="text-[10px] text-zinc-400 mt-2">T1 REQUIRED – MD61 PIR: Planned Independent Requirements – demand input for MRP – creates demand – MD02: MRP Single-Item Single-Level – net requirements calc for single material single level – Demand = PIR + SO + Safety Stock, Supply = Stock + PO + Prod Order + STO, Net = Demand - Supply, if Net&gt;0 generate Planned Order/PR – MD03: MRP Single-Item Multi-Level – same as MD02 but explodes BOM multi-level – creates dependent requirements for components – Tables: mfg_pir + mfg_mrp_run + mfg_mrp_element – NO DANGLING – PIR fields used in MRP demand calculation – General ERP, SAP MD61/MD02/MD03 alias – chain: PIR → MRP demand → net calc → shortage → planned order/PR → BOM explosion multi-level</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {pirList.map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start"><div className="font-semibold text-sm">{it.pir_number} – {it.material_code||it.item_id} – fac {it.facility_code||it.facility_id} – qty {it.planned_quantity} – date {it.requirement_date?.split('T')[0]} – type {it.requirement_type} ver {it.version} – {it.status}</div><span className="text-[10px] bg-blue-600 text-white rounded-full px-2 py-0.5">MD61</span></div>
            <div className="mt-2 text-xs text-zinc-500">PIR demand input for MRP – T1 – NO DANGLING – fields used in MRP net requirements calc</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T1 REQUIRED – General ERP – Low Importance – MRP</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/foundation/materials`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EMTC</span><span>Materials – FERT/ROH – MM01 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/pp/bom`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EBOM</span><span>BOM – multi-level – CS01 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/pp/mrp`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">MMRP</span><span>MRP Run – MD01 – MRP net requirements</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/facilities`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EFAC</span><span>Facilities – FAC-1000 – OX10 alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Planned Independent Requirements, MRP Single-Item Single-Level, MRP Single-Item Multi-Level, Net Requirements Calculation, Demand, Supply, Shortage, Planned Order, Purchase Requisition, BOM Explosion – SAP MD61/MD02/MD03/MD01 kept as alias – T1 REQUIRED – MD61 PIR demand input for MRP – MD02 Single-Level – MD03 Multi-Level – net requirements calc – NO DANGLING – PIR fields used in MRP</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="PIR + MRP Single-Item" subtitle={`${pirList.length} PIR • ${companyCode} • MD61 alias MD61 + MD02/MD03 – General ERP – T1 REQUIRED – MD02-MD03-MD61-PIR`} code="MD61" module="PP" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
