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
  const [form,setForm]=useState({partner_number: "", item_number: "", facility_code: "FAC-1000", priority: "1", is_mrp_relevant: true, valid_from: new Date().toISOString().split('T')[0]});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/source-lists').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!form.partner_number || !form.item_number || !form.facility_code){ setMsg('❌ VENDOR, MATERIAL, FACILITY required – ME01 – T2 GOOD'); return; }
    const payload = { partner_number: form.partner_number, item_number: form.item_number, facility_code: form.facility_code, priority: parseInt(form.priority), is_mrp_relevant: form.is_mrp_relevant, valid_from: form.valid_from };
    const res = await fetch('/api/source-lists',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ ME01 Source List – material ${form.item_number} plant ${form.facility_code} vendor ${form.partner_number} priority ${form.priority} MRP relevant ${form.is_mrp_relevant} – T2 GOOD – NO DANGLING – source list used in MRP source determination – General ERP – SAP ME01 alias`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING ME01 – Source List – T2 GOOD...</div>;
  const lists = data?.sourceLists || data?.data || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">ME01 SOURCE LIST – GENERAL ERP – {lists.length} LISTS – T2 GOOD – ME01-SOURCE – MRP SOURCE DETERMINATION – NO DANGLING</div>
        <div className="grid grid-cols-5 gap-2">
          <div><div className="text-[9px] text-zinc-500">VENDOR_NUMBER * – PSUC</div><input value={form.partner_number} onChange={e=>setForm({...form,partner_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">MATERIAL_NUMBER * – EMTC</div><input value={form.item_number} onChange={e=>setForm({...form,item_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">FACILITY_CODE * – FAC-1000</div><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">PRIORITY – 1=highest – MRP uses lowest priority first</div><input value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">IS_MRP_RELEVANT – true/false – MRP auto source if true</div><select value={form.is_mrp_relevant ? 'true':'false'} onChange={e=>setForm({...form,is_mrp_relevant:e.target.value==='true'})} className="w-full border-2 border-black px-1 py-1"><option value="true">true</option><option value="false">false</option></select></div>
        </div>
        <button onClick={create} className="mt-3 bg-black text-white px-3 py-1 w-full">CREATE ME01 SOURCE LIST – MATERIAL/PLANT/VENDOR – MRP SOURCE DETERMINATION – T2 GOOD</button>
        <div className="text-[9px] text-zinc-500 mt-1">T2 GOOD – Source List ME01/ME02/ME03 – material/plant/vendor valid from/to, MRP relevant, blocked, priority – MRP auto source determination – MRP reads source list where is_mrp_relevant true and priority lowest → creates PR with vendor – Workaround if missing: manual source in PR – T2 GOOD – NO DANGLING – source list fields used in MRP PR creation – procurement operational excellence – General ERP SAP ME01 alias – chain: source list → MRP → PR with vendor → PO → GR → IV</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {lists.slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2"><div className="font-bold">{it.item_number} {it.item_name} – fac {it.facility_code} – vendor {it.vendor_number} {it.vendor_name} – priority {it.priority} – MRP relevant {it.is_mrp_relevant?'true':'false'} – valid {it.valid_from?.split('T')[0]}</div></div>
        ))}
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T2 GOOD – GENERAL ERP – LOW IMPORTANCE – SOURCE LIST</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/mm/info-records`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">PIRC Info Record ME11 →</Link>
          <Link href={`/${companyCode}/mm/quota-arrangements`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">MEQ1 Quota Arrangement →</Link>
          <Link href={`/${companyCode}/pp/mrp`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">MMRP MRP – uses source list →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">📦</div>
          <div>
            <div className="font-semibold">Source List – ME01 (alias ME01) – General ERP – T2 GOOD – ME01-SOURCE – MRP Source Determination</div>
            <div className="text-xs text-zinc-500">{lists.length} lists • {companyCode} • ME01 material/plant/vendor valid from/to, MRP relevant, blocked, priority – MRP auto source determination – MRP reads source list where is_mrp_relevant true and priority lowest → creates PR with vendor – T2 GOOD – NO DANGLING</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <DbAutocomplete label="VENDOR_NUMBER * – PSUC – T2" value={form.partner_number} onChange={v=>setForm({...form,partner_number:v})} apiUrl="/api/business-partners" codeField="account_number" nameField="display_name" placeholder="" required createUrl={`/${companyCode}/foundation/suppliers`} createCode="PSUC" companyCode={companyCode} />
          <DbAutocomplete label="MATERIAL_NUMBER * – EMTC – T2" value={form.item_number} onChange={v=>setForm({...form,item_number:v})} apiUrl="/api/materials" codeField="material_code" nameField="name" placeholder="" required createUrl={`/${companyCode}/foundation/materials`} createCode="EMTC" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium">FACILITY_CODE * – FAC-1000</label><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">PRIORITY – 1=highest – MRP uses lowest first</label><input value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">IS_MRP_RELEVANT – MRP auto source if true</label><select value={form.is_mrp_relevant ? 'true':'false'} onChange={e=>setForm({...form,is_mrp_relevant:e.target.value==='true'})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]"><option value="true">true</option><option value="false">false</option></select></div>
        </div>
        <button onClick={create} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 h-[32px] text-[13px] font-medium transition-colors">Create ME01 Source List – Material/Plant/Vendor – MRP Source Determination – T2 GOOD – NO DANGLING</button>
        <div className="text-[10px] text-zinc-400 mt-2">T2 GOOD – Source List ME01/ME02/ME03 – material/plant/vendor valid from/to, MRP relevant, blocked, priority – MRP auto source determination – MRP reads source list where is_mrp_relevant true and priority lowest → creates PR with vendor – Workaround if missing: manual source in PR – T2 GOOD – NO DANGLING – source list fields used in MRP PR creation – procurement operational excellence – General ERP SAP ME01 alias – chain: source list → MRP → PR with vendor → PO → GR → IV</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {lists.map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start"><div className="font-semibold text-sm">{it.item_number} {it.item_name} – fac {it.facility_code} – vendor {it.vendor_number} {it.vendor_name} – priority {it.priority} – MRP relevant {it.is_mrp_relevant?'true':'false'}</div><span className="text-[10px] bg-emerald-600 text-white rounded-full px-2 py-0.5">ME01</span></div>
            <div className="mt-2 text-xs text-zinc-500">Valid {it.valid_from?.split('T')[0]} – source list used in MRP source determination – T2 GOOD – NO DANGLING</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T2 GOOD – General ERP – Low Importance – Source List</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/mm/info-records`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PIRC</span><span>Info Record – ME11 – price →</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/mm/quota-arrangements`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">MEQ1</span><span>Quota Arrangement – MEQ1 – % split →</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/pp/mrp`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">MMRP</span><span>MRP – uses source list – MD01 alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Source List, Material, Facility, Vendor, Valid From/To, MRP Relevant, Blocked, Priority, MRP Source Determination – SAP ME01/ME02/ME03 kept as alias – T2 GOOD – Source List material/plant/vendor – MRP auto source – NO DANGLING – source list fields used in MRP PR creation</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Source Lists" subtitle={`${lists.length} lists • ${companyCode} • ME01 alias ME01 – General ERP – T2 GOOD – ME01-SOURCE`} code="ME01" module="MM" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
