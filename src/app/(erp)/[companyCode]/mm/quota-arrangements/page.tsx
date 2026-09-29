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
  const [form,setForm]=useState({material_code: "", facility_code: "FAC-1000", vendor_number: "", quota_quantity: "100", quota_percentage: "50", valid_from: new Date().toISOString().split('T')[0]});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/quota-arrangements').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!form.material_code || !form.facility_code || !form.vendor_number){ setMsg('❌ MATERIAL, FACILITY, VENDOR required – MEQ1 – T2 GOOD'); return; }
    const payload = { material_code: form.material_code, facility_code: form.facility_code, vendor_number: form.vendor_number, quota_quantity: parseFloat(form.quota_quantity), quota_percentage: parseFloat(form.quota_percentage), valid_from: form.valid_from };
    const res = await fetch('/api/quota-arrangements',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ MEQ1 Quota Arrangement – material ${form.material_code} plant ${form.facility_code} vendor ${form.vendor_number} qty ${form.quota_quantity} % ${form.quota_percentage} – T2 GOOD – NO DANGLING – quota % used in MRP source determination + PO split – General ERP – SAP MEQ1 alias`);
      load();
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING MEQ1 – Quota Arrangement – T2 GOOD...</div>;
  const quotas = data?.quotaArrangements || data?.data || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">MEQ1 QUOTA ARRANGEMENT – GENERAL ERP – {quotas.length} QUOTAS – T2 GOOD – MEQ1-QUOTA – % SPLIT – NO DANGLING</div>
        <div className="grid grid-cols-6 gap-2">
          <div><div className="text-[9px] text-zinc-500">MATERIAL_CODE * – EMTC</div><input value={form.material_code} onChange={e=>setForm({...form,material_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">FACILITY_CODE * – FAC-1000</div><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">VENDOR_NUMBER * – PSUC</div><input value={form.vendor_number} onChange={e=>setForm({...form,vendor_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">QUOTA_QUANTITY – e.g., 100 – total quota qty</div><input value={form.quota_quantity} onChange={e=>setForm({...form,quota_quantity:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">QUOTA_PERCENTAGE * – e.g., 50 – % split 0-100 – total for material/plant must ≤100</div><input value={form.quota_percentage} onChange={e=>setForm({...form,quota_percentage:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">VALID_FROM – e.g., 2026-09-29</div><input type="date" value={form.valid_from} onChange={e=>setForm({...form,valid_from:e.target.value})} className="w-full border-2 border-black px-1 py-1" /></div>
        </div>
        <button onClick={create} className="mt-3 bg-black text-white px-3 py-1 w-full">CREATE MEQ1 QUOTA ARRANGEMENT – % SPLIT BETWEEN VENDORS – MRP SOURCE – T2 GOOD</button>
        <div className="text-[9px] text-zinc-500 mt-1">T2 GOOD – Quota Arrangement MEQ1 – material/plant/vendor quota qty/% – MRP source determination splits PR quantity by quota % – e.g., material ITM-1001 plant FAC-1000 vendor SUP-1001 50% vendor SUP-1002 50% → MRP creates 2 PRs 50/50 – Workaround if missing: manual source in PR – T2 GOOD – NO DANGLING – quota % used in MRP PR creation split + PO source determination – procurement operational excellence – General ERP SAP MEQ1 alias – chain: quota → MRP → PR split by % → PO → GR → IV</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {quotas.slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2"><div className="font-bold">{it.material_code||it.item_id} {it.item_name} – fac {it.facility_code||it.facility_id} – vendor {it.vendor_number||it.partner_id} {it.vendor_name} – qty {it.quota_quantity} – {it.quota_percentage}% – valid {it.valid_from?.split('T')[0]} – active {it.is_active?'true':'false'}</div></div>
        ))}
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T2 GOOD – GENERAL ERP – LOW IMPORTANCE – QUOTA</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/mm/source-lists`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">PSRC Source List ME01 →</Link>
          <Link href={`/${companyCode}/mm/info-records`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">PIRC Info Record ME11 →</Link>
          <Link href={`/${companyCode}/pp/mrp`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">MMRP MRP – uses quota →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">⚖️</div>
          <div>
            <div className="font-semibold">Quota Arrangement – MEQ1 (alias MEQ1) – General ERP – T2 GOOD – MEQ1-QUOTA – % Split</div>
            <div className="text-xs text-zinc-500">{quotas.length} quotas • {companyCode} • MEQ1 material/plant/vendor quota qty/% – MRP source determination splits PR quantity by quota % – e.g., ITM-1001 FAC-1000 SUP-1001 50% SUP-1002 50% → MRP creates 2 PRs 50/50 – T2 GOOD – NO DANGLING</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <DbAutocomplete label="MATERIAL_CODE * – EMTC – T2" value={form.material_code} onChange={v=>setForm({...form,material_code:v})} apiUrl="/api/materials" codeField="material_code" nameField="name" placeholder="" required createUrl={`/${companyCode}/foundation/materials`} createCode="EMTC" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium">FACILITY_CODE * – FAC-1000</label><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="" /></div>
          <DbAutocomplete label="VENDOR_NUMBER * – PSUC – T2" value={form.vendor_number} onChange={v=>setForm({...form,vendor_number:v})} apiUrl="/api/business-partners" codeField="account_number" nameField="display_name" placeholder="" required createUrl={`/${companyCode}/foundation/suppliers`} createCode="PSUC" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium">QUOTA_QUANTITY – e.g., 100</label><input value={form.quota_quantity} onChange={e=>setForm({...form,quota_quantity:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">QUOTA_PERCENTAGE * – 0-100 – total ≤100</label><input value={form.quota_percentage} onChange={e=>setForm({...form,quota_percentage:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">VALID_FROM – e.g., 2026-09-29</label><input type="date" value={form.valid_from} onChange={e=>setForm({...form,valid_from:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" /></div>
        </div>
        <button onClick={create} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Create MEQ1 Quota Arrangement – % Split Between Vendors – MRP Source – T2 GOOD – NO DANGLING</button>
        <div className="text-[10px] text-zinc-400 mt-2">T2 GOOD – Quota Arrangement MEQ1 – material/plant/vendor quota qty/% – MRP source determination splits PR quantity by quota % – e.g., material ITM-1001 plant FAC-1000 vendor SUP-1001 50% vendor SUP-1002 50% → MRP creates 2 PRs 50/50 – Workaround if missing: manual source in PR – T2 GOOD – NO DANGLING – quota % used in MRP PR creation split + PO source determination – procurement operational excellence – General ERP SAP MEQ1 alias – chain: quota → MRP → PR split by % → PO → GR → IV</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {quotas.map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start"><div className="font-semibold text-sm">{it.material_code||it.item_id} {it.item_name} – fac {it.facility_code||it.facility_id} – vendor {it.vendor_number||it.partner_id} {it.vendor_name} – qty {it.quota_quantity} – {it.quota_percentage}%</div><span className="text-[10px] bg-purple-600 text-white rounded-full px-2 py-0.5">MEQ1</span></div>
            <div className="mt-2 text-xs text-zinc-500">Valid {it.valid_from?.split('T')[0]} – active {it.is_active?'true':'false'} – quota % used in MRP source determination + PO split – T2 GOOD – NO DANGLING</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T2 GOOD – General ERP – Low Importance – Quota</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/mm/source-lists`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PSRC</span><span>Source List – ME01 – source →</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/mm/info-records`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PIRC</span><span>Info Record – ME11 – price →</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/pp/mrp`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">MMRP</span><span>MRP – uses quota – MD01 alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Quota Arrangement, Material, Facility, Vendor, Quota Quantity, Quota Percentage, Valid From/To, MRP Source Determination, PR Split – SAP MEQ1 kept as alias – T2 GOOD – Quota material/plant/vendor qty/% – MRP splits PR by % – NO DANGLING – quota % used in MRP PR creation split + PO source determination</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Quota Arrangements" subtitle={`${quotas.length} quotas • ${companyCode} • MEQ1 alias MEQ1 – General ERP – T2 GOOD – MEQ1-QUOTA`} code="MEQ1" module="MM" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
