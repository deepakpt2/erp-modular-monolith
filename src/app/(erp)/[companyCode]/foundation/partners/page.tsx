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
    commercial_org_code: '', credit_policy_area_code: '',
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

  if(loading) return <div className="p-6">Loading...</div>;

  const modernContent = (
    <div className="space-y-6">
      {msg && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm">{msg}</div>}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Business Partners <span className="ml-2 text-xs font-mono bg-zinc-100 border rounded-full px-2 py-0.5">{partners.length} EPAC</span> <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="ml-3 border border-zinc-200 rounded-full px-3 py-1.5 text-xs w-40 focus:outline-none focus:ring-2 focus:ring-black" /></h3>
        <div className="flex gap-2">
          <button onClick={()=>setShowAdd(!showAdd)} className="text-xs bg-zinc-900 text-white rounded-full px-4 py-2 hover:bg-black transition-colors">+ Create EPAC</button>
          <button onClick={load} className="text-xs border border-zinc-200 rounded-full px-4 py-2 bg-white hover:bg-zinc-50">Refresh</button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-xs font-medium text-zinc-600">ACCOUNT_NUMBER</label><input required value={form.account_number} onChange={e=>setForm({...form, account_number:e.target.value.toUpperCase()})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm uppercase focus:ring-2 focus:ring-black focus:outline-none" /></div>
            <div><label className="text-xs font-medium text-zinc-600">DISPLAY_NAME</label><input required value={form.display_name} onChange={e=>setForm({...form, display_name:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-black focus:outline-none" /></div>
            <div><label className="text-xs font-medium text-zinc-600">LEGAL_NAME</label><input value={form.legal_name} onChange={e=>setForm({...form, legal_name:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm" /></div>
            <div><label className="text-xs font-medium text-zinc-600">ROLE</label><select value={form.role} onChange={e=>setForm({...form, role:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm"><option>VENDOR</option><option>CUSTOMER</option><option>BOTH</option></select></div>
            <div><label className="text-xs font-medium text-zinc-600">EMAIL</label><input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm" /></div>
            <div><label className="text-xs font-medium text-zinc-600">PHONE</label><input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm" /></div>
            <div><label className="text-xs font-medium text-zinc-600">GST_NUMBER</label><input value={form.gst_number} onChange={e=>setForm({...form, gst_number:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm" /></div>
            <div><label className="text-xs font-medium text-zinc-600">CITY</label><input value={form.city} onChange={e=>setForm({...form, city:e.target.value})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm" /></div>
            <div><label className="text-xs font-medium text-zinc-600">COUNTRY</label><input value={form.country} onChange={e=>setForm({...form, country:e.target.value.toUpperCase()})} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm uppercase" /></div>
          </div>
          <button type="submit" className="w-full bg-zinc-900 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-black transition-colors">Create EPAC</button>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map((p:any)=>(
          <div key={p.account_number || p.bp_number} className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="font-medium text-sm">{p.account_number || p.bp_number} – {p.display_name || p.name1}</div>
            <div className="text-xs text-zinc-500 mt-1">{p.role} • {p.email} • {p.city}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const classicContent = (
    <div className="font-mono text-[11px] space-y-2">
      <div className="font-bold border-b border-black pb-1">EPAC PARTNER_CREATE {partners.length} API: POST /api/business-partners {`{account_number, display_name, role}`}</div>
      <div className="grid grid-cols-3 gap-2">
        <div><div className="text-[10px] text-zinc-500">ACCOUNT_NUMBER</div><input value={form.account_number} onChange={e=>setForm({...form,account_number:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
        <div><div className="text-[10px] text-zinc-500">DISPLAY_NAME</div><input value={form.display_name} onChange={e=>setForm({...form,display_name:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
        <div><div className="text-[10px] text-zinc-500">ROLE</div><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="w-full border border-black px-1 py-1 text-xs"><option>VENDOR</option><option>CUSTOMER</option><option>BOTH</option></select></div>
      </div>
      <button onClick={(e:any)=>handleCreate(e)} className="bg-black text-white px-3 py-1 w-full">CREATE EPAC</button>
    </div>
  );

  return (
    <ModernModuleShell title="Business Partners" subtitle={`${partners.length} PARTNERS`} code="EPAC" module="FOUNDATION" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
