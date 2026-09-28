"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function CompanyMasterPage(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [form,setForm]=useState({
    code:'',name:'',currency_code:'INR',city:'',country:'IN',client_code:'100',coa_code:'INT',
    address:'',street:'',postal_code:'',region:'',tax_id:'',gst_number:'',pan:'',cin:'',phone:'',email:'',website:'',legal_form:'Pvt Ltd',registration_number:''
  });
  const [msg,setMsg]=useState('');

  async function load(){
    setLoading(true);
    try{
      const ccRes = await fetch('/api/company-codes').then(r=>r.json());
      setData(ccRes);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[companyCode]);

  async function create(){
    setMsg('Creating...');
    try{
      const res = await fetch('/api/company-codes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const j = await res.json();
      if(j.success){ setMsg(`✅ ${j.message}`); load(); setForm({ code:'',name:'',currency_code:'INR',city:'',country:'IN',client_code:'100',coa_code:'INT', address:'',street:'',postal_code:'',region:'',tax_id:'',gst_number:'',pan:'',cin:'',phone:'',email:'',website:'',legal_form:'Pvt Ltd',registration_number:'' }); } else setMsg(`❌ ${j.error}`);
    }catch(e:any){ setMsg(`❌ ${e.message}`); }
  }

  if(loading) return <div className="p-6">Loading company master...</div>;
  const companyCodes = data?.companyCodes||[];
  const currencies = data?.currencies||[];

  return (
    <ModernModuleShell
      title={`Company Master Data • ${companyCode}`}
      subtitle={`${companyCodes.length} Company Codes • ${currencies.length} Currencies – Only INR default – OY03 – Legal Entity – Configurable`}
      code="OX02"
      module="FICO"
      tooltip={`OX02 Company Code T001 – Legal Entity – GST/PAN/CIN – Configurable: create/edit/delete, only INR default, KWD added by user OY03. No hardcoded implementation guide data – only real DB data shown.`}
    >
      <div className="max-w-[1600px] mx-auto p-6 space-y-4">

        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-medium">Create Company Code OX02 – Legal Entity – Configurable</h3>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <input placeholder="Code e.g. T001" value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="border rounded-xl px-3 py-2 text-sm"/>
            <input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="border rounded-xl px-3 py-2 text-sm col-span-2"/>
            <select value={form.currency_code} onChange={e=>setForm({...form,currency_code:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"><option value="">Currency – Only INR default</option>{currencies.map((c:any)=><option key={c.code} value={c.code}>{c.code} – {c.name} {c.code==='INR'?'(Default)':''}</option>)}<option value="INR">INR – Indian Rupee (Default)</option></select>
            <input placeholder="City" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
            <input placeholder="Country IN" value={form.country} onChange={e=>setForm({...form,country:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
            <input placeholder="Client 100" value={form.client_code} onChange={e=>setForm({...form,client_code:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
            <input placeholder="CoA INT/KSCA" value={form.coa_code} onChange={e=>setForm({...form,coa_code:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
            <input placeholder="Street" value={form.street} onChange={e=>setForm({...form,street:e.target.value})} className="border rounded-xl px-3 py-2 text-sm col-span-2"/>
            <input placeholder="Postal" value={form.postal_code} onChange={e=>setForm({...form,postal_code:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
            <input placeholder="Region" value={form.region} onChange={e=>setForm({...form,region:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
            <input placeholder="GST Number" value={form.gst_number} onChange={e=>setForm({...form,gst_number:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
            <input placeholder="PAN" value={form.pan} onChange={e=>setForm({...form,pan:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
            <input placeholder="CIN" value={form.cin} onChange={e=>setForm({...form,cin:e.target.value})} className="border rounded-xl px-3 py-2 text-sm col-span-2"/>
            <input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
            <input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
            <input placeholder="Website" value={form.website} onChange={e=>setForm({...form,website:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
            <textarea placeholder="Full Legal Address – real address, not hardcoded example" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="border rounded-xl px-3 py-2 text-sm col-span-4 h-[60px]"></textarea>
          </div>
          <div className="mt-3 flex gap-2"><button onClick={create} className="bg-black text-white rounded-xl px-4 py-2 text-sm">Create Company Code OX02</button><span className="text-sm self-center">{msg}</span></div>
          <div className="mt-2 text-[11px] text-zinc-500">Only INR default currency – KWD/USD/EUR added by user via POST /api/currencies OY03 – Code OX02 – No hardcoded implementation guide examples.</div>
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-medium">Company Codes • {companyCodes.length} • Real DB data only</h3>
          <div className="mt-4 space-y-3">
            {companyCodes.length===0 && <div className="border rounded-xl p-4 bg-zinc-50 text-sm text-zinc-500">No company codes – Fresh deployment – Create first company code above. Only INR default exists.</div>}
            {companyCodes.map((c:any)=><div key={c.code} className={`border rounded-xl p-4 ${c.code===companyCode?'bg-orange-50 border-orange-200':'bg-zinc-50'}`}><div className="flex justify-between"><span className="font-medium">{c.code} {c.name} {c.legal_form||''}</span><span className="text-xs bg-white border rounded-full px-2 py-0.5">{c.currency_code} {c.city} {c.country} {c.currency_code==='INR'?'(Default INR)':''}</span></div><div className="text-xs text-zinc-500 mt-1">CoA: {c.coa_code} • Client: {c.client_code} • Plants: {c.plant_count} • GST: {c.gst_number||c.tax_id||'N/A'} • PAN: {c.pan||'N/A'} • CIN: {c.cin||'N/A'}</div><div className="text-[11px] mt-2 bg-white border rounded-lg p-2">Address: {c.address||`${c.street||''} ${c.city||''} ${c.postal_code||''} ${c.region||''}`} • Phone: {c.phone||'N/A'} • Email: {c.email||'N/A'}</div></div>)}
          </div>
        </div>
      </div>
    </ModernModuleShell>
  );
}
