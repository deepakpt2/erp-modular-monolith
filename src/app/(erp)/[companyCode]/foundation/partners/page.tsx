"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { VirtualDataGrid } from '@/shared/ui/virtual-data-grid';
import { ColumnDef } from '@tanstack/react-table';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

const TABS = [
  { id: 'basic', label: 'Basic Data', code: 'EPAC', alias: 'PTNC, BP01', desc: 'Account number, display name, legal name, role VENDOR/CUSTOMER/BOTH, tax id, GST, PAN – legal-safe partner_account' },
  { id: 'vendor', label: 'Vendor Profile', code: 'PSUC', alias: 'SUPC, XK01, ME01', desc: 'Procurement view – payment terms, currency, procurement division, buyer team, quality relevant – partner_vendor_profile' },
  { id: 'customer', label: 'Customer Profile', code: 'SCUC', alias: 'CUCC, XD01', desc: 'Sales view – payment terms, currency, commercial org, sales channel, product line, credit policy – partner_customer_profile' },
  { id: 'contacts', label: 'Contacts', code: 'EPCC', alias: 'BPCC', desc: 'Multiple contacts per partner – PRIMARY/BILLING/SHIPPING/PURCHASING/SALES – partner_contact' },
  { id: 'facilities', label: 'Facility Assign', code: 'EPAC', alias: 'BP', desc: 'Facility assignment – which facilities partner can supply to / deliver from – partner_facility_assign' },
];

export default function PartnersPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const roleFilter = searchParams.get('role') || 'ALL';
  const tabParam = searchParams.get('tab') || 'basic';
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('db');
  const [showAdd, setShowAdd] = useState(mode === 'create');
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(tabParam);
  const [message, setMessage] = useState('');
  const [role, setRole] = useState(roleFilter !== 'ALL' ? roleFilter : 'VENDOR');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [procDivs, setProcDivs] = useState<any[]>([]);
  const [commercialOrgs, setCommercialOrgs] = useState<any[]>([]);

  const [form, setForm] = useState({
    account_number: '', bp_number: '', display_name: '', name1: '', legal_name: '', name2: '', role: roleFilter !== 'ALL' ? roleFilter : 'VENDOR',
    email: '', phone: '', alternate_phone: '', website: '',
    address_line1: '', address: '', city: '', region: '', postal_code: '', country: 'IN',
    gst_number: '', pan_number: '', tax_id: '',
    is_blocked: false, is_one_time: false,
    // Vendor
    payment_terms_days: '30', currency_code: 'INR', is_quality_relevant: false, is_qm_relevant: false, procurement_division_id: '', buyer_team_id: '',
    // Customer
    customer_payment_terms_days: '0', customer_currency_code: 'INR', commercial_org_id: '', sales_channel_id: '', product_line_id: '', credit_policy_area_id: '', price_group: '',
    // Contact
    contact_full_name: '', contact_email: '', contact_phone: '', contact_type: 'PRIMARY', contact_department: '',
  });

  async function load() {
    setLoading(true);
    try {
      const [partnerRes, facRes, procRes, commRes] = await Promise.all([
        fetch(`/api/business-partners?limit=200&search=${encodeURIComponent(search)}&role=${roleFilter}`).then(r=>r.json()),
        fetch(`/api/facilities?limit=100`).then(r=>r.json()).catch(()=>({data:[]})),
        fetch(`/api/procurement-divisions?limit=100`).then(r=>r.json()).catch(()=>({data:[]})),
        fetch(`/api/commercial-orgs?limit=100`).then(r=>r.json()).catch(()=>({data:[]})),
      ]);
      setPartners(partnerRes.partners || partnerRes.businessPartners || []);
      setFacilities(facRes.data || facRes.facilities || []);
      setProcDivs(procRes.data || []);
      setCommercialOrgs(commRes.data || []);
      setSource(partnerRes.source || 'db');
    } catch(e){ console.error(e); }
    setLoading(false);
  }

  useEffect(()=>{ load(); },[]);
  useEffect(()=>{ const t=setTimeout(load,400); return()=>clearTimeout(t); },[search, roleFilter]);
  useEffect(()=>{ setRole(roleFilter !== 'ALL' ? roleFilter : 'VENDOR'); },[roleFilter]);

  const filtered = useMemo(()=> partners, [partners]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        account_number: form.account_number || form.bp_number,
        display_name: form.display_name || form.name1,
        legal_name: form.legal_name || form.name2,
        address_line1: form.address_line1 || form.address,
        is_quality_relevant: form.is_quality_relevant || form.is_qm_relevant,
        contacts: form.contact_full_name ? [{ full_name: form.contact_full_name, email: form.contact_email, phone: form.contact_phone, contact_type: form.contact_type, department: form.contact_department, is_primary: true }] : [],
      };
      const res = await fetch('/api/business-partners', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }).then(r=>r.json());
      if (res.success) {
        setMessage(`✅ ${res.partner?.account_number || res.businessPartner?.bp_number || form.account_number} created – ${res.code} (alias ${res.aliasCodes?.join(', ')}) – ${form.display_name || form.name1} role ${form.role} – legal-safe ${res.legalSafe ? 'own IP' : 'legacy'}`);
        setShowAdd(false);
        load();
      } else setMessage(`❌ ${res.error}`);
    } catch(e:any){ setMessage(`❌ ${e.message}`); }
  };

  const handleDelete = async (p:any) => {
    const partner = p || selectedPartner;
    if (!partner) { setMessage('Select a partner first'); return; }
    const num = partner.account_number || partner.bp_number;
    if (!confirm(`Delete partner ${num}? – ${partner.display_name || partner.name1}`)) return;
    try {
      const res = await fetch(`/api/business-partners?account_number=${encodeURIComponent(num)}`,{method:'DELETE'}).then(r=>r.json());
      setMessage(res.success ? `✅ ${res.message}` : `❌ ${res.error || res.message}`);
      load();
    } catch(e:any){ setMessage(`❌ ${e.message}`); }
  };

  const columns = useMemo<ColumnDef<any, any>[]>(()=>[
    { accessorKey:'account_number', header:'Account No – EPAC', size:140, cell:({row}:any)=>{ const v=row.original.account_number||row.original.bp_number; return <span className="font-mono font-medium">{v}</span>; } },
    { accessorKey:'display_name', header:'Display Name', size:200, cell:({row}:any)=> row.original.display_name||row.original.name1 },
    { accessorKey:'role', header:'Role – EPAC', size:90, cell:({getValue})=>{ const v=getValue(); return <span className={`px-2 py-0.5 rounded-full border text-xs font-mono ${v==='VENDOR'?'bg-blue-50 border-blue-200':v==='CUSTOMER'?'bg-green-50 border-green-200':'bg-purple-50 border-purple-200'}`}>{v}</span>; }},
    { accessorKey:'city', header:'City', size:100 },
    { accessorKey:'gst_number', header:'GSTIN', size:120, cell:({getValue})=> <span className="font-mono text-xs">{getValue()||'-'}</span> },
    { accessorKey:'is_blocked', header:'Blocked', size:70, cell:({getValue})=> getValue() ? '🔴' : '✅' },
  ],[]);

  const currentTitle = mode === 'change' ? 'Change Partner' : mode === 'display' ? 'Display Partner' : mode === 'create' ? `Create ${roleFilter !== 'ALL' ? roleFilter : 'Partner'}` : roleFilter === 'VENDOR' ? 'Suppliers – PSUC' : roleFilter === 'CUSTOMER' ? 'Customers – SCUC' : 'Partner Accounts – EPAC';
  const currentCode = mode === 'change' ? 'EPAE' : mode === 'display' ? 'EPAV' : mode === 'create' ? (roleFilter === 'VENDOR' ? 'PSUC' : roleFilter === 'CUSTOMER' ? 'SCUC' : 'EPAC') : (roleFilter === 'VENDOR' ? 'PSUC' : roleFilter === 'CUSTOMER' ? 'SCUC' : 'EPAL');
  const aliasCodes = currentCode === 'PSUC' ? ['SUPC','XK01','ME01','FND-SU-CR'] : currentCode === 'SCUC' ? ['CUCC','XD01','FND-CU-CR'] : currentCode === 'EPAE' ? ['BP02','FND-BP-CH'] : currentCode === 'EPAV' ? ['BP03','FND-BP-DP'] : ['PTNC','BPAC','BP01','FND-BP-CR'];

  if (loading) return <div className="p-6 text-sm text-zinc-500">Loading partners EPAC (alias BP01)...</div>;

  return (
    <ModernModuleShell title={currentTitle} subtitle={`${filtered.length} partners • ${source} • Role:${roleFilter} – ${currentCode} (alias ${aliasCodes.join(', ')}) – legal-safe own IP – fresh empty, common sample CoA/GL/Tax/Currencies/UoM kept`} code={currentCode} module="FOUNDATION" tooltip={`EPAC Create Partner Account – Legal-safe own IP (was Business Partner BP) – Central master partner_account with role VENDOR/CUSTOMER/BOTH, contextual views: partner_vendor_profile procurement view (PSUC alias SUPC/XK01/ME01) with procurement_division (was purchasing_org), buyer_team (was purchasing_group), is_quality_relevant (was is_qm_relevant), partner_customer_profile sales view (SCUC alias CUCC/XD01) with commercial_org (was sales_org), sales_channel (was distribution_channel), product_line (was division), credit_policy_area (was credit_control_area). Partner contacts partner_contact multiple per partner PRIMARY/BILLING/SHIPPING/PURCHASING/SALES. Facility assignment partner_facility_assign. Fresh empty – no hardcoded KS-V-001 etc – common sample CoA/GL/Tax/Currencies/UoM kept. Code ${currentCode} primary alias ${aliasCodes.join(', ')} – 4-char MOOA E=Enterprise, PA=Partner Account, C=Create (EPAC), P=Procurement, SU=Supplier, C=Create (PSUC), S=Sales, CU=Customer, C=Create (SCUC) – same length as BP01/XK01/XD01 but own IP, module grouped, intuitive – both_exact search – helper codes kept as-is and auto-generate.`} kpis={[
      {label:'Total', value: partners.length.toString(), icon:'🤝'},
      {label:`Vendors ${'PSUC'}`, value: partners.filter((p:any)=>p.role==='VENDOR' || p.role==='BOTH').length.toString(), icon:'🏭'},
      {label:`Customers ${'SCUC'}`, value: partners.filter((p:any)=>p.role==='CUSTOMER' || p.role==='BOTH').length.toString(), icon:'🛒'},
    ]}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search partners EPAC alias BP01... (try VENDOR, CUSTOMER, GST)`} className="border rounded-full px-4 py-2 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-black" />
          <button onClick={load} className="text-xs border rounded-full px-3 py-2 hover:bg-zinc-50 bg-white">Refresh – {currentCode}</button>
          <div className="flex gap-1 border rounded-full p-1 bg-white">
            <a href="/1000/foundation/partners?role=ALL" className={`text-xs px-3 py-1 rounded-full ${roleFilter==='ALL'?'bg-black text-white':'hover:bg-zinc-50'}`}>ALL – EPAL</a>
            <a href="/1000/foundation/partners?role=VENDOR" className={`text-xs px-3 py-1 rounded-full ${roleFilter==='VENDOR'?'bg-blue-600 text-white':'hover:bg-zinc-50'}`}>VENDORS – PSUC alias SUPC/XK01</a>
            <a href="/1000/foundation/partners?role=CUSTOMER" className={`text-xs px-3 py-1 rounded-full ${roleFilter==='CUSTOMER'?'bg-green-600 text-white':'hover:bg-zinc-50'}`}>CUSTOMERS – SCUC alias CUCC/XD01</a>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>selectedPartner && handleDelete(selectedPartner)} className="text-xs border border-red-200 text-red-600 rounded-full px-3 py-2 bg-white">Delete – {currentCode}</button>
          <button onClick={()=>setShowAdd(true)} className="text-sm bg-black text-white rounded-full px-4 py-2">+ New {roleFilter !== 'ALL' ? roleFilter : 'Partner'} – {currentCode} (alias {aliasCodes[0]})</button>
        </div>
      </div>

      {message && <div className="mb-4 p-3 bg-zinc-900 text-white rounded-xl text-sm">{message}</div>}

      <div className="bg-white rounded-2xl border overflow-hidden">
        <VirtualDataGrid data={filtered} columns={columns} height={400} rowHeight={36} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>{ setSelectedPartner(r); }} />
      </div>
      {selectedPartner && <div className="mt-2 text-xs text-zinc-500">Selected: {selectedPartner.account_number||selectedPartner.bp_number} – {selectedPartner.display_name||selectedPartner.name1} – Role {selectedPartner.role} – GST {selectedPartner.gst_number||'-'} – <button onClick={()=>handleDelete(selectedPartner)} className="underline text-red-600">Delete – {currentCode}</button></div>}

      <div className="mt-3 bg-zinc-50 border rounded-xl p-3 text-[11px]">
        <div className="font-medium">Legal-Safe Mapping – Module 3 Partner – EPAC primary alias PTNC/BPAC/BP01/FND-BP-CR – fresh empty</div>
        <div className="mt-1 grid grid-cols-3 gap-2">
          <div>ent_business_partner → partner_account – bp_number → account_number</div>
          <div>name1 → display_name, name2 → legal_name</div>
          <div>address → address_line1, city, region, postal_code, country</div>
          <div>ent_bp_vendor_ext → partner_vendor_profile – bp_id → partner_id</div>
          <div>payment_terms_days, currency_code kept</div>
          <div>is_qm_relevant → is_quality_relevant – legal-safe</div>
          <div>purchasing_org → procurement_division_id – org_procurement_division</div>
          <div>purchasing_group → buyer_team_id – org_buyer_team</div>
          <div>ent_bp_customer_ext → partner_customer_profile</div>
          <div>sales_org → commercial_org_id – org_commercial_org</div>
          <div>distribution_channel → sales_channel_id – org_sales_channel</div>
          <div>division → product_line_id – org_product_line</div>
          <div>credit_control_area → credit_policy_area_id – fin_credit_policy_area</div>
          <div>partner_contact – NEW – multiple contacts per partner – PRIMARY/BILLING/SHIPPING/PURCHASING/SALES</div>
          <div>partner_facility_assign – NEW – facility assignment</div>
          <div>Fresh empty – no hardcoded KS-V-001 etc – common sample CoA/GL/Tax/Currencies/UoM kept – INR default</div>
        </div>
        <div className="mt-2 text-[11px] text-zinc-500">Helper codes: EPAC Partner Account Create (alias PTNC/BPAC/BP01/FND-BP-CR) – 4-char MOOA E=Enterprise, PA=Partner Account, C=Create – PSUC Supplier Create (alias SUPC/XK01/ME01) – P=Procurement, SU=Supplier, C=Create – SCUC Customer Create (alias CUCC/XD01/FND-CU-CR) – S=Sales, CU=Customer, C=Create – same length as BP01/XK01/XD01 but own IP, module grouped, intuitive.</div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={()=>setShowAdd(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border w-full max-w-5xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Create {form.role} • {currentCode} (alias {aliasCodes.join(', ')}) – Legal-safe own IP – was {form.role==='VENDOR'?'Vendor XK01/ME01':form.role==='CUSTOMER'?'Customer XD01':'Business Partner BP01'}</h3>
              <button onClick={()=>setShowAdd(false)} className="text-zinc-400 hover:text-black">✕</button>
            </div>
            <div className="mt-4 flex gap-1 flex-wrap">
              {TABS.map(tab=>(
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`text-xs px-3 py-1.5 rounded-full border ${activeTab===tab.id?'bg-black text-white border-black':'bg-zinc-50 border-zinc-200'}`} title={`${tab.desc} – alias ${tab.alias}`}><span className="font-mono">{tab.code}</span> {tab.label} <span className="text-[10px] text-zinc-400">({tab.alias})</span></button>
              ))}
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-sm">
              {activeTab==='basic' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Account Number – partner_account.account_number (was bp_number BP-V-10*) – Auto if blank? Manual for now</label><input required value={form.account_number || form.bp_number} onChange={e=>setForm({...form, account_number:e.target.value.toUpperCase(), bp_number:e.target.value.toUpperCase()})} placeholder="e.g., SUP-1001 alias BP-V-1001 or CUST-2001 alias BP-C-2001" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Role – partner_account.role VENDOR/CUSTOMER/BOTH (was bp_role)</label><select value={form.role} onChange={e=>setForm({...form, role:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>VENDOR – PSUC alias SUPC/XK01</option><option>CUSTOMER – SCUC alias CUCC/XD01</option><option>BOTH</option><option>EMPLOYEE</option><option>CONTACT</option></select></div>
                  <div><label className="text-xs text-zinc-500">Display Name – partner_account.display_name (was name1) – e.g., Malabar Spice Farms</label><input required value={form.display_name || form.name1} onChange={e=>setForm({...form, display_name:e.target.value, name1:e.target.value})} placeholder="Display name – legal-safe" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Legal Name – partner_account.legal_name (was name2)</label><input value={form.legal_name || form.name2} onChange={e=>setForm({...form, legal_name:e.target.value, name2:e.target.value})} placeholder="Legal name – e.g., Malabar Spice Farms Pvt Ltd" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Email – partner_account.email</label><input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="email@example.com" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Phone – partner_account.phone</label><input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="+91-..." className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">GST Number – partner_account.gst_number – India GSTIN (new) – e.g., 32AABCK1234M1Z5</label><input value={form.gst_number} onChange={e=>setForm({...form, gst_number:e.target.value})} placeholder="GSTIN – 32AABCK1234M1Z5" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">PAN Number – partner_account.pan_number – India PAN (new)</label><input value={form.pan_number} onChange={e=>setForm({...form, pan_number:e.target.value})} placeholder="PAN – AABCK1234M" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Tax ID – partner_account.tax_id – VAT ID etc</label><input value={form.tax_id} onChange={e=>setForm({...form, tax_id:e.target.value})} placeholder="Tax ID" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Website – partner_account.website</label><input value={form.website} onChange={e=>setForm({...form, website:e.target.value})} placeholder="https://..." className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div className="col-span-2"><label className="text-xs text-zinc-500">Address Line1 – partner_account.address_line1 (was address)</label><input value={form.address_line1 || form.address} onChange={e=>setForm({...form, address_line1:e.target.value, address:e.target.value})} placeholder="Plot 45, Industrial Estate" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">City – partner_account.city</label><input value={form.city} onChange={e=>setForm({...form, city:e.target.value})} placeholder="Kochi" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Region/State – partner_account.region</label><input value={form.region} onChange={e=>setForm({...form, region:e.target.value})} placeholder="Kerala" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Postal Code – partner_account.postal_code</label><input value={form.postal_code} onChange={e=>setForm({...form, postal_code:e.target.value})} placeholder="682001" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Country – partner_account.country IN default</label><input value={form.country} onChange={e=>setForm({...form, country:e.target.value})} placeholder="IN" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div className="col-span-2 flex gap-2 mt-2"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={form.is_blocked} onChange={e=>setForm({...form, is_blocked:e.target.checked})} /> Blocked</label><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={form.is_one_time} onChange={e=>setForm({...form, is_one_time:e.target.checked})} /> One-Time</label></div>
                </div>
              )}

              {activeTab==='vendor' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Payment Terms Days – partner_vendor_profile.payment_terms_days</label><input type="number" value={form.payment_terms_days} onChange={e=>setForm({...form, payment_terms_days:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="30" /></div>
                  <div><label className="text-xs text-zinc-500">Currency – partner_vendor_profile.currency_code INR default</label><input value={form.currency_code} onChange={e=>setForm({...form, currency_code:e.target.value})} placeholder="INR" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Procurement Division – procurement_division_id org_procurement_division.code PD-1000 (was purchasing_org 1000/KPO1)</label><select value={form.procurement_division_id} onChange={e=>setForm({...form, procurement_division_id:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select Procurement Division</option>{procDivs.map((d:any)=><option key={d.id} value={d.id}>{d.code} – {d.name}</option>)}</select></div>
                  <div><label className="text-xs text-zinc-500">Buyer Team – buyer_team_id org_buyer_team.code BUY-001 (was purchasing_group 001/K01)</label><input value={form.buyer_team_id} onChange={e=>setForm({...form, buyer_team_id:e.target.value})} placeholder="Buyer Team ID or code BUY-001" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div className="col-span-2"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={form.is_quality_relevant || form.is_qm_relevant} onChange={e=>setForm({...form, is_quality_relevant:e.target.checked, is_qm_relevant:e.target.checked})} /> Quality Relevant – partner_vendor_profile.is_quality_relevant (was is_qm_relevant)</label></div>
                </div>
              )}

              {activeTab==='customer' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Payment Terms Days – partner_customer_profile.payment_terms_days</label><input type="number" value={form.customer_payment_terms_days} onChange={e=>setForm({...form, customer_payment_terms_days:e.target.value})} placeholder="0" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Currency – partner_customer_profile.currency_code INR default</label><input value={form.customer_currency_code || form.currency_code} onChange={e=>setForm({...form, customer_currency_code:e.target.value, currency_code:e.target.value})} placeholder="INR" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Commercial Org – commercial_org_id org_commercial_org.code CO-1000 (was sales_org 1000/KSO1)</label><select value={form.commercial_org_id} onChange={e=>setForm({...form, commercial_org_id:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select Commercial Org</option>{commercialOrgs.map((c:any)=><option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}</select></div>
                  <div><label className="text-xs text-zinc-500">Credit Policy Area – credit_policy_area_id fin_credit_policy_area.code (was credit_control_area OB45)</label><input value={form.credit_policy_area_id} onChange={e=>setForm({...form, credit_policy_area_id:e.target.value})} placeholder="Credit Policy Area ID – e.g., CP-1000" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Price Group – partner_customer_profile.price_group</label><input value={form.price_group} onChange={e=>setForm({...form, price_group:e.target.value})} placeholder="Price group – e.g., PG-01" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                </div>
              )}

              {activeTab==='contacts' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Contact Full Name – partner_contact.full_name – e.g., Ramesh Kumar</label><input value={form.contact_full_name} onChange={e=>setForm({...form, contact_full_name:e.target.value})} placeholder="Full name" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Contact Type – partner_contact.contact_type PRIMARY/BILLING/SHIPPING/PURCHASING/SALES/TECHNICAL/FINANCE</label><select value={form.contact_type} onChange={e=>setForm({...form, contact_type:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>PRIMARY</option><option>BILLING</option><option>SHIPPING</option><option>PURCHASING</option><option>SALES</option><option>TECHNICAL</option><option>FINANCE</option></select></div>
                  <div><label className="text-xs text-zinc-500">Contact Email – partner_contact.email</label><input type="email" value={form.contact_email} onChange={e=>setForm({...form, contact_email:e.target.value})} placeholder="contact@example.com" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Contact Phone – partner_contact.phone</label><input value={form.contact_phone} onChange={e=>setForm({...form, contact_phone:e.target.value})} placeholder="+91-..." className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div className="col-span-2"><label className="text-xs text-zinc-500">Department – partner_contact.department</label><input value={form.contact_department} onChange={e=>setForm({...form, contact_department:e.target.value})} placeholder="Purchasing / Sales" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div className="col-span-2 text-[11px] text-zinc-500">Multiple contacts per partner – PRIMARY/BILLING/SHIPPING/PURCHASING/SALES – new table partner_contact – legal-safe own IP</div>
                </div>
              )}

              {activeTab==='facilities' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="text-xs text-zinc-500">Facility Assignment – partner_facility_assign – which facilities this partner can supply to / deliver from</label><select multiple className="mt-1 w-full border rounded-xl px-3 py-2 h-32">{facilities.map((f:any)=><option key={f.id} value={f.id}>{f.code} – {f.name}</option>)}</select><div className="text-[11px] text-zinc-500 mt-1">Hold Ctrl to select multiple facilities – org_facility.code FAC-1000 (was Plant 1000)</div></div>
                </div>
              )}

              <div className="col-span-2 flex gap-2 mt-6">
                <button type="button" onClick={()=>setShowAdd(false)} className="flex-1 border rounded-full py-2.5">Cancel – {currentCode}</button>
                <button type="submit" className="flex-1 bg-black text-white rounded-full py-2.5">Create Partner – {currentCode} (alias {aliasCodes.join(', ')}) – {activeTab} – legal-safe</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModernModuleShell>
  );
}
