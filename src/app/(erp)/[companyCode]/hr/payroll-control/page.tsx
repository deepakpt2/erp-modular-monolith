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
  const [form,setForm]=useState({company_code: "", payroll_period: new Date().toISOString().slice(0,7), payroll_area: "01", status: "OPEN", action: "PA03"});
  const [schemaForm,setSchemaForm]=useState({schema_code: "", schema_name: "", description: "", wage_types: "1000,2000,3000", calculation_steps: "CALC_GROSS,CALC_DEDUCTIONS,CALC_NET"});
  const [postingForm,setPostingForm]=useState({payroll_period: new Date().toISOString().slice(0,7), action: "PC00"});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/payroll/control').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function submitControl(){
    const payload = { company_code: form.company_code || companyCode, payroll_period: form.payroll_period, payroll_area: form.payroll_area, status: form.status, action: form.action };
    const res = await fetch('/api/payroll/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ PA03 Control Record – company ${payload.company_code} area ${payload.payroll_area} period ${payload.payroll_period} status ${payload.status} – T1 REQUIRED – NO DANGLING – controls payroll period status Released/Exit – fields used in payroll run – General ERP – SAP PA03/PE01/PC00 alias`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  async function submitSchema(){
    if(!schemaForm.schema_code || !schemaForm.schema_name){ setMsg('❌ SCHEMA_CODE and SCHEMA_NAME required – PE01 – T1 REQUIRED'); return; }
    const payload = { schema_code: schemaForm.schema_code, schema_name: schemaForm.schema_name, description: schemaForm.description, wage_types: schemaForm.wage_types.split(',').map((s:string)=>s.trim()), calculation_steps: schemaForm.calculation_steps.split(',').map((s:string)=>s.trim()), action: "PE01", status: "ACTIVE" };
    const res = await fetch('/api/payroll/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ PE01 Payroll Schema ${schemaForm.schema_code} – ${schemaForm.schema_name} – wage_types ${schemaForm.wage_types} – T1 REQUIRED – NO DANGLING – schema fields used in payroll calculation – wage type calculation engine – General ERP`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  async function submitPosting(){
    const payload = { payroll_period: postingForm.payroll_period, action: "PC00", company_code: companyCode };
    const res = await fetch('/api/payroll/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ PC00 Payroll Posting to FI – posting ${res.posting_number} – FI doc ${res.fi_document_number} – gross ${res.payroll_run?.total_gross} deductions ${res.payroll_run?.total_deductions} net ${res.payroll_run?.total_net} – Dr Payroll Expense Cr Payable – T1 REQUIRED – NO DANGLING – FI posting fields used in cost center actuals + GL – General ERP – SAP PA03/PE01/PC00 alias`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING PA03 – Payroll Control – T1 REQUIRED...</div>;
  const controls = data?.control_records || [];
  const schemas = data?.schemas || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">PA03 CONTROL RECORD + PE01 SCHEMA + PC00 FI POSTING – GENERAL ERP – {controls.length} CONTROLS – {schemas.length} SCHEMAS – T1 REQUIRED – PA03-CTRL+PE01-SCHEMA+PC00-FI-POST – NO DANGLING</div>
        <div className="grid grid-cols-5 gap-2">
          <div><div className="text-[9px] text-zinc-500">COMPANY_CODE * – ELEC – Legal Entity</div><input value={form.company_code} onChange={e=>setForm({...form,company_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">PAYROLL_PERIOD * – YYYY-MM – e.g., 2026-09</div><input value={form.payroll_period} onChange={e=>setForm({...form,payroll_period:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">PAYROLL_AREA – 01 – payroll area</div><input value={form.payroll_area} onChange={e=>setForm({...form,payroll_area:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">STATUS – OPEN/RELEASED/EXIT – control record status</div><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full border-2 border-black px-1 py-1"><option>OPEN</option><option>RELEASED</option><option>EXIT</option></select></div>
          <div><button onClick={submitControl} className="w-full bg-black text-white px-3 py-1 mt-4">PA03 CONTROL RECORD</button></div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3 border-t-2 border-black pt-2">
          <div><div className="text-[9px] text-zinc-500">SCHEMA_CODE * – PE01 – e.g., SCHEMA-01</div><input value={schemaForm.schema_code} onChange={e=>setSchemaForm({...schemaForm,schema_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">SCHEMA_NAME * – e.g., Standard Payroll Schema</div><input value={schemaForm.schema_name} onChange={e=>setSchemaForm({...schemaForm,schema_name:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">WAGE_TYPES – comma separated – e.g., 1000,2000,3000 – 1000 basic, 2000 allowance, 3000 deduction</div><input value={schemaForm.wage_types} onChange={e=>setSchemaForm({...schemaForm,wage_types:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><button onClick={submitSchema} className="w-full bg-zinc-900 text-white px-3 py-1 mt-4">PE01 SCHEMA – WAGE TYPE CALC</button></div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 border-t-2 border-black pt-2">
          <div><div className="text-[9px] text-zinc-500">PAYROLL_PERIOD * – YYYY-MM – for PC00 FI Posting – e.g., 2026-09</div><input value={postingForm.payroll_period} onChange={e=>setPostingForm({...postingForm,payroll_period:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><button onClick={submitPosting} className="w-full bg-zinc-900 text-white px-3 py-1 mt-4">PC00 FI POSTING – POST PAYROLL TO FI – Dr Expense Cr Payable</button></div>
        </div>
        <div className="text-[9px] text-zinc-500 mt-1">T1 REQUIRED – PA03: Payroll Control Record – controls payroll period, status (Released, Exit, etc.) – PE01: Payroll Schema – wage type calculation schema – defines calculation steps – PC00: Payroll Posting to FI – posts payroll results to FI via automatic account determination – Tables: hr_payroll_control + hr_payroll_schema + hr_payroll_fi_posting + hr_payroll_run_new + fin_universal_ledger – NO DANGLING – control record fields used in payroll run + FI posting – General ERP, SAP PA03/PE01/PC00 alias – chain: control record PA03 → schema PE01 → payroll run PC00 calculation → FI posting PC00 Dr Expense Cr Payable → cost center actuals + GL</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">CONTROL RECORDS – {controls.length} – PA03 – company/area/period/status</div>
          {controls.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-[10px] border-b py-1">{it.company_code} – area {it.payroll_area} – period {it.payroll_period} – {it.period_year}-{it.period_month} – {it.status}</div>
          ))}
        </div>
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">SCHEMAS – {schemas.length} – PE01 – schema_code/name/wage_types/calc steps</div>
          {schemas.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-[10px] border-b py-1">{it.schema_code} – {it.schema_name} – wage_types {JSON.stringify(it.wage_types).slice(0,100)} – {it.status}</div>
          ))}
        </div>
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T1 REQUIRED – GENERAL ERP – LOW IMPORTANCE – PAYROLL</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/hr/employees`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EHRS Employees →</Link>
          <Link href={`/${companyCode}/hr/payroll-run`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">HPRC Payroll Run →</Link>
          <Link href={`/${companyCode}/fico/universal-ledger`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FULC Universal Ledger – FI posting →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">👥</div>
          <div>
            <div className="font-semibold">Payroll Control – PA03 (alias PA03) + PE01 Schema + PC00 FI Posting – General ERP – T1 REQUIRED – PA03-CTRL+PE01-SCHEMA+PC00-FI-POST</div>
            <div className="text-xs text-zinc-500">{controls.length} controls • {schemas.length} schemas • {companyCode} • PA03 controls payroll period status Released/Exit – PE01 defines wage type calculation schema – PC00 posts payroll to FI Dr Expense Cr Payable via auto account – NO DANGLING – control record fields used in payroll run + FI posting</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div><label className="text-[11px] font-medium">COMPANY_CODE * – ELEC – Legal Entity</label><input value={form.company_code} onChange={e=>setForm({...form,company_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">PAYROLL_PERIOD * – YYYY-MM – e.g., 2026-09</label><input value={form.payroll_period} onChange={e=>setForm({...form,payroll_period:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">PAYROLL_AREA – 01</label><input value={form.payroll_area} onChange={e=>setForm({...form,payroll_area:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">STATUS – OPEN/RELEASED/EXIT</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"><option>OPEN</option><option>RELEASED</option><option>EXIT</option></select></div>
          <div><button onClick={submitControl} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">PA03 Control Record – T1</button></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 border-t border-zinc-200 pt-6">
          <div><label className="text-[11px] font-medium">SCHEMA_CODE * – PE01 – e.g., SCHEMA-01</label><input value={schemaForm.schema_code} onChange={e=>setSchemaForm({...schemaForm,schema_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">SCHEMA_NAME * – e.g., Standard Payroll Schema</label><input value={schemaForm.schema_name} onChange={e=>setSchemaForm({...schemaForm,schema_name:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">WAGE_TYPES – comma – 1000 basic, 2000 allowance, 3000 deduction</label><input value={schemaForm.wage_types} onChange={e=>setSchemaForm({...schemaForm,wage_types:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
          <div><button onClick={submitSchema} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">PE01 Schema – Wage Type Calc – T1</button></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 border-t border-zinc-200 pt-6">
          <div><label className="text-[11px] font-medium">PAYROLL_PERIOD * – YYYY-MM – for PC00 FI Posting</label><input value={postingForm.payroll_period} onChange={e=>setPostingForm({...postingForm,payroll_period:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
          <div><button onClick={submitPosting} className="mt-6 w-full bg-teal-600 hover:bg-teal-700 text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">PC00 FI Posting – Post Payroll to FI – Dr Expense Cr Payable – T1</button></div>
        </div>
        <div className="text-[10px] text-zinc-400 mt-2">T1 REQUIRED – PA03: Payroll Control Record – controls payroll period, status (Released, Exit, etc.) – PE01: Payroll Schema – wage type calculation schema – defines calculation steps – PC00: Payroll Posting to FI – posts payroll results to FI via automatic account determination – Tables: hr_payroll_control + hr_payroll_schema + hr_payroll_fi_posting + hr_payroll_run_new + fin_universal_ledger – NO DANGLING – control record fields used in payroll run + FI posting – General ERP, SAP PA03/PE01/PC00 alias – chain: control record PA03 → schema PE01 → payroll run PC00 calculation → FI posting PC00 Dr Expense Cr Payable → cost center actuals + GL</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">Control Records – {controls.length} – PA03 – company/area/period/status</div>
          {controls.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-xs border-b border-zinc-100 py-2">{it.company_code} – area {it.payroll_area} – period {it.payroll_period} – {it.period_year}-{it.period_month} – {it.status}</div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">Schemas – {schemas.length} – PE01 – schema_code/name/wage_types/calc steps</div>
          {schemas.slice(0,20).map((it:any, idx:number)=>(
            <div key={idx} className="text-xs border-b border-zinc-100 py-2">{it.schema_code} – {it.schema_name} – wage_types {JSON.stringify(it.wage_types).slice(0,100)} – {it.status}</div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T1 REQUIRED – General ERP – Low Importance – Payroll</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/hr/employees`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EHRS</span><span>Employees – EHRS – PA20 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/hr/payroll-run`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">HPRC</span><span>Payroll Run – HPRC – PC00 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/universal-ledger`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FULC</span><span>Universal Ledger – FI posting – ACDOCA alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Payroll Control Record, Payroll Schema, Wage Type, Calculation Steps, FI Posting, Payroll Expense, Payable, Cost Center Actuals – SAP PA03/PE01/PC00 kept as alias – T1 REQUIRED – PA03 controls payroll period status Released/Exit, PE01 defines wage type calculation schema, PC00 posts payroll to FI Dr Expense Cr Payable via auto account – NO DANGLING – control record fields used in payroll run + FI posting</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Payroll Control" subtitle={`${controls.length} controls • ${schemas.length} schemas • ${companyCode} • PA03 alias PA03 + PE01 + PC00 – General ERP – T1 REQUIRED – PA03-CTRL+PE01-SCHEMA+PC00-FI-POST`} code="PA03" module="HR" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
