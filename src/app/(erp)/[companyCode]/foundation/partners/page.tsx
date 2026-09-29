"use client";

import React, { useState, useEffect } from 'react';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    account_number: '', display_name: '', legal_name: '', role: 'VENDOR',
    email: '', phone: '', website: '', address_line1: '', city: '', region: '', postal_code: '', country: 'IN',
    gst_number: '', pan_number: '', tax_id: '',
    payment_terms_days: '30', currency_code: 'INR', procurement_division_code: '', buyer_team_code: '',
    customer_payment_terms_days: '0', commercial_org_code: '', credit_policy_area_code: '',
    contact_full_name: '', contact_email: '', contact_phone: '',
  });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/business-partners?limit=200&search=${encodeURIComponent(search)}`).then(r=>r.json());
      setPartners(res.partners || res.businessPartners || []);
    } catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);
  useEffect(()=>{const t=setTimeout(load,300);return()=>clearTimeout(t);},[search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!form.account_number || !form.display_name){ setMsg('ACCOUNT_NUMBER and DISPLAY_NAME required'); return; }
    const payload = { ...form, bp_number: form.account_number, name1: form.display_name, name2: form.legal_name, address: form.address_line1 };
    const res = await fetch('/api/business-partners',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${form.account_number} CREATED`); setShowAdd(false); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;

  return (
    <ModernModuleShell title="Business Partners" subtitle={`${partners.length} PARTNERS`} code="EPAC" module="FOUNDATION">
      <div className="max-w-[1600px] mx-auto p-0 space-y-3">
        {msg && <div className="bg-black text-white font-mono text-xs p-2">{msg}</div>}

        <div className="flex justify-between items-center">
          <div className="font-mono text-[11px] font-bold">EPAC PARTNER_CREATE BP01 {partners.length} <input value={search} onChange={e=>setSearch(e.target.value)} className="ml-2 border border-black px-1 py-0.5 text-[11px] w-40" /></div>
          <div className="flex gap-1">
            <button onClick={()=>setShowAdd(!showAdd)} className="text-[11px] font-mono bg-black text-white border border-black px-3 py-1">CREATE</button>
            <button onClick={load} className="text-[11px] font-mono border border-black px-3 py-1 bg-white">REFRESH</button>
          </div>
        </div>

        {showAdd && (
          <form onSubmit={handleCreate} className="bg-white border border-black p-3 space-y-2">
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div><div className="text-[10px] text-zinc-500">ACCOUNT_NUMBER</div><input required value={form.account_number} onChange={e=>setForm({...form, account_number:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">DISPLAY_NAME</div><input required value={form.display_name} onChange={e=>setForm({...form, display_name:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">LEGAL_NAME</div><input value={form.legal_name} onChange={e=>setForm({...form, legal_name:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">ROLE</div><select value={form.role} onChange={e=>setForm({...form, role:e.target.value})} className="w-full border border-black px-1 py-1 text-xs"><option>VENDOR</option><option>CUSTOMER</option><option>BOTH</option></select></div>
              <div><div className="text-[10px] text-zinc-500">EMAIL</div><input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">PHONE</div><input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">WEBSITE</div><input value={form.website} onChange={e=>setForm({...form, website:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">ADDRESS_LINE1</div><input value={form.address_line1} onChange={e=>setForm({...form, address_line1:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">CITY</div><input value={form.city} onChange={e=>setForm({...form, city:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">REGION</div><input value={form.region} onChange={e=>setForm({...form, region:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">POSTAL_CODE</div><input value={form.postal_code} onChange={e=>setForm({...form, postal_code:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">COUNTRY</div><input value={form.country} onChange={e=>setForm({...form, country:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 text-xs uppercase" /></div>
              <div><div className="text-[10px] text-zinc-500">GST_NUMBER</div><input value={form.gst_number} onChange={e=>setForm({...form, gst_number:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">PAN_NUMBER</div><input value={form.pan_number} onChange={e=>setForm({...form, pan_number:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">TAX_ID</div><input value={form.tax_id} onChange={e=>setForm({...form, tax_id:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">PAYMENT_TERMS_DAYS</div><input value={form.payment_terms_days} onChange={e=>setForm({...form, payment_terms_days:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">CURRENCY_CODE</div><input value={form.currency_code} onChange={e=>setForm({...form, currency_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 text-xs uppercase" /></div>
              <div><div className="text-[10px] text-zinc-500">PROCUREMENT_DIVISION_CODE</div><input value={form.procurement_division_code} onChange={e=>setForm({...form, procurement_division_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 text-xs uppercase" /></div>
              <div><div className="text-[10px] text-zinc-500">BUYER_TEAM_CODE</div><input value={form.buyer_team_code} onChange={e=>setForm({...form, buyer_team_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 text-xs uppercase" /></div>
              <div><div className="text-[10px] text-zinc-500">COMMERCIAL_ORG_CODE</div><input value={form.commercial_org_code} onChange={e=>setForm({...form, commercial_org_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 text-xs uppercase" /></div>
              <div><div className="text-[10px] text-zinc-500">CREDIT_POLICY_AREA_CODE</div><input value={form.credit_policy_area_code} onChange={e=>setForm({...form, credit_policy_area_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 text-xs uppercase" /></div>
            </div>
            <button type="submit" className="bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE EPAC</button>
          </form>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
          {partners.map((p:any)=>(
            <div key={p.account_number || p.bp_number} className="bg-white border border-black p-2 font-mono text-[11px]">
              <div className="font-bold">{p.account_number || p.bp_number} | {p.display_name || p.name1} | {p.role}</div>
              <div className="text-[10px] text-zinc-600">EMAIL={p.email} PHONE={p.phone} GST_NUMBER={p.gst_number} CITY={p.city}</div>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
