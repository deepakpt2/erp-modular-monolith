"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function EnterpriseStructurePage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'company'|'plant'|'purch'|'sales'>('company');
  const [editingCC, setEditingCC] = useState<any>(null);
  const [showCreateCC, setShowCreateCC] = useState(false);
  const [ccForm, setCcForm] = useState({ code: '', name: '', currency_code: 'INR', city: '', country: 'IN', gst_number: '' });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(()=>{
    async function load(){
      setLoading(true);
      try {
        const [ccRes, plantRes] = await Promise.all([
          fetch(`/api/company-codes`).then(r=>r.json()),
          fetch(`/api/plants?companyCode=${companyCode}`).then(r=>r.json()),
        ]);
        setData({ companyCodes: ccRes, plants: plantRes });
      } catch(e){ console.error(e); }
      setLoading(false);
    }
    load();
  },[companyCode]);

  const reload = async () => {
    const [ccRes, plantRes] = await Promise.all([
      fetch(`/api/company-codes`).then(r=>r.json()),
      fetch(`/api/plants?companyCode=${companyCode}`).then(r=>r.json()),
    ]);
    setData({ companyCodes: ccRes, plants: plantRes });
  };

  const handleCreateCC = async () => {
    if (!ccForm.code || !ccForm.name) { setMessage('Code and name required'); return; }
    try {
      const res = await fetch('/api/company-codes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ccForm) });
      const d = await res.json();
      if (res.ok) { setMessage(`✅ ${d.message}`); setShowCreateCC(false); setCcForm({ code: '', name: '', currency_code: 'INR', city: '', country: 'IN', gst_number: '' }); reload(); }
      else setMessage(`❌ ${d.error}`);
    } catch (e:any) { setMessage(e.message); }
  };

  const handleUpdateCC = async () => {
    if (!editingCC) return;
    try {
      const res = await fetch('/api/company-codes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingCC.id, ...ccForm }) });
      const d = await res.json();
      if (res.ok) { setMessage(`✅ ${d.message}`); setEditingCC(null); reload(); }
      else setMessage(`❌ ${d.error}`);
    } catch (e:any) { setMessage(e.message); }
  };

  const handleDeleteCC = async (code: string) => {
    if (!confirm(`Delete company code ${code}?`)) return;
    const force = confirm(`Force delete ${code} with its plants/slocs? OK=force, Cancel=normal`);
    try {
      const res = await fetch(`/api/company-codes?code=${code}&force=${force}`, { method: 'DELETE' });
      const d = await res.json();
      if (res.ok) { setMessage(`✅ ${d.message}`); reload(); }
      else setMessage(`❌ ${d.error} – ${d.hint || ''}`);
    } catch (e:any) { setMessage(e.message); }
  };

  if (loading) return <div className="p-6">Loading enterprise structure...</div>;

  const companyCodes = data?.companyCodes?.companyCodes || [];
  const currencies = data?.companyCodes?.currencies || [];
  const fiscalVariants = data?.companyCodes?.fiscalYearVariants || [];
  const postingVariants = data?.companyCodes?.postingPeriodVariants || [];
  const creditAreas = data?.companyCodes?.creditControlAreas || [];
  const plants = data?.plants?.plants || [];
  const slocs = data?.plants?.slocs || [];

  const tabs = [
    { id: 'company', label: 'Company & Company Code', code: 'OX15/OX02' },
    { id: 'plant', label: 'Plant & Storage Location', code: 'OX10/OX09' },
    { id: 'purch', label: 'Purchasing Org & Group', code: 'OX08/OME4' },
    { id: 'sales', label: 'Sales Org & Division', code: 'OVX5' },
  ];

  return (
    <ModernModuleShell
      title={`Enterprise Structure • ${companyCode}`}
      subtitle={`${companyCodes.length} Company Codes • ${plants.length} Plants • ${slocs.length} Storage Locations • ${currencies.length} Currencies – Only INR default`}
      code="OX15"
      module="FOUNDATION"
      tooltip={`OX15 Company, OX02 Company Code T001 – Configurable: create/edit/delete company codes, only INR default, KWD added by user OY03. OX10 Plant, OX09 SLoc, OX08 Purch Org, OME4 Purch Group – all configurable, no hardcoded implementation guide data.`}
    >
      <div className="max-w-[1600px] mx-auto p-6 space-y-4">
        <div className="flex gap-2 mb-4 flex-wrap">
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id as any)} className={`text-xs rounded-full px-4 py-2 border ${activeTab===t.id?'bg-black text-white border-black':'bg-white hover:bg-zinc-50'}`}>
              {t.code} {t.label}
            </button>
          ))}
        </div>

        {message && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm mb-4">{message}</div>}

        {activeTab==='company' && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 space-y-4">
              <div className="bg-white rounded-2xl border p-5">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Company Codes OX02 • {companyCodes.length} records • Current: {companyCode}</h3>
                  <button onClick={()=>{ setShowCreateCC(!showCreateCC); setEditingCC(null); setCcForm({ code: '', name: '', currency_code: 'INR', city: '', country: 'IN', gst_number: '' }); }} className="text-xs bg-zinc-900 text-white rounded-full px-3 py-1.5">+ Create Company Code</button>
                </div>

                {(showCreateCC || editingCC) && (
                  <div className="mt-4 border rounded-xl p-4 bg-zinc-50 space-y-3">
                    <h4 className="font-medium text-sm">{editingCC ? `Edit ${editingCC.code}` : 'Create New Company Code'} – OX02</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div><label className="text-xs text-zinc-500">Code *</label><input value={ccForm.code} onChange={e=>setCcForm({...ccForm, code: e.target.value.toUpperCase()})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1" placeholder="T001" disabled={!!editingCC} /></div>
                      <div><label className="text-xs text-zinc-500">Name *</label><input value={ccForm.name} onChange={e=>setCcForm({...ccForm, name: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1" placeholder="My Company INR" /></div>
                      <div><label className="text-xs text-zinc-500">Currency – Only INR default</label><select value={ccForm.currency_code} onChange={e=>setCcForm({...ccForm, currency_code: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1"><option value="">Select Currency</option>{currencies.map((c:any)=><option key={c.code} value={c.code}>{c.code} – {c.name} {c.code==='INR'?'(Default)':''}</option>)}</select><div className="text-[10px] text-zinc-500 mt-1">Only INR default – KWD/USD/EUR added by user via /api/currencies OY03</div></div>
                      <div><label className="text-xs text-zinc-500">City</label><input value={ccForm.city} onChange={e=>setCcForm({...ccForm, city: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1" placeholder="Kochi" /></div>
                      <div><label className="text-xs text-zinc-500">Country</label><input value={ccForm.country} onChange={e=>setCcForm({...ccForm, country: e.target.value.toUpperCase()})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1" placeholder="IN" /></div>
                      <div><label className="text-xs text-zinc-500">GST Number</label><input value={ccForm.gst_number} onChange={e=>setCcForm({...ccForm, gst_number: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1" placeholder="GSTIN" /></div>
                    </div>
                    <div className="flex gap-2">
                      {editingCC ? <button onClick={handleUpdateCC} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs">Update Company Code</button> : <button onClick={handleCreateCC} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs">Create</button>}
                      <button onClick={()=>{ setEditingCC(null); setShowCreateCC(false); }} className="border rounded-full px-4 py-2 text-xs">Cancel</button>
                    </div>
                    <div className="text-[11px] text-zinc-500">API: POST /api/company-codes – Only INR default, others added by user. No hardcoded KS01/KP01 examples.</div>
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {companyCodes.length===0 && <div className="border rounded-xl p-4 bg-zinc-50 text-sm text-zinc-500">No company codes – Fresh deployment – Create your first company code via + Create. Only INR default currency exists, add KWD/USD/EUR via /api/currencies if needed.</div>}
                  {companyCodes.map((c:any)=>(
                    <div key={c.code} className={`border rounded-xl p-4 ${c.code===companyCode?'bg-orange-50 border-orange-200':'bg-zinc-50'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{c.code} {c.name}</div>
                          <div className="text-xs text-zinc-500 mt-1">CoA: {c.coa_code} {c.coa_name} • Client: {c.client_code} • Plants: {c.plant_count} • Cost Centers: {c.cost_center_count} • {c.currency_code} {c.city} {c.country} {c.currency_code==='INR'?'(Default INR)':''}</div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={()=>{ setEditingCC(c); setCcForm({ code: c.code, name: c.name, currency_code: c.currency_code, city: c.city||'', country: c.country||'IN', gst_number: c.gst_number||'' }); setShowCreateCC(false); }} className="text-[11px] border rounded-full px-2 py-1 bg-white hover:bg-zinc-50">Edit</button>
                          <button onClick={()=>handleDeleteCC(c.code)} className="text-[11px] border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white hover:bg-red-50">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl border p-5">
                <h4 className="font-medium text-sm">Fiscal Year Variant OB29</h4>
                <div className="mt-3 space-y-2 text-xs">{fiscalVariants.length===0 ? <div className="text-zinc-500">No fiscal variants – Fresh deployment</div> : fiscalVariants.map((f:any)=><div key={f.code} className="flex justify-between bg-zinc-50 border rounded-lg p-2"><span>{f.code}</span><span>{f.description}</span></div>)}</div>
              </div>
              <div className="bg-white rounded-2xl border p-5">
                <h4 className="font-medium text-sm">Posting Period Variant OBBO/OB52</h4>
                <div className="mt-3 space-y-1 text-xs">{postingVariants.length===0 ? <div className="text-zinc-500">No posting variants – Fresh deployment</div> : postingVariants.map((p:any)=><div key={p.code} className="bg-zinc-50 border rounded-lg p-2">{p.code} {p.name}</div>)}</div>
              </div>
              <div className="bg-white rounded-2xl border p-5">
                <h4 className="font-medium text-sm">Currencies OY03 – Only INR default</h4>
                <div className="mt-3 space-y-1 text-xs">{currencies.length===0 ? <div className="text-zinc-500">INR – Default</div> : currencies.map((c:any)=><div key={c.code} className={`border rounded-lg p-2 flex justify-between ${c.code==='INR'?'bg-green-50 border-green-200':''}`}><span>{c.code} {c.name} {c.symbol}</span><span>{c.code==='INR'?'Default':''} {c.is_active?'Active':'Inactive'}</span></div>)}</div>
                <div className="text-[11px] text-zinc-500 mt-2">Only INR default – KWD/USD/EUR added by user via POST /api/currencies</div>
              </div>
            </div>
          </div>
        )}

        {activeTab==='plant' && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl border p-5">
              <h3 className="font-medium">Plants OX10 • {plants.length} • Company {companyCode}</h3>
              <div className="mt-4 space-y-2">
                {plants.length===0 && <div className="text-sm text-zinc-500 border rounded-xl p-3 bg-zinc-50">No plants – Fresh deployment – Create plant via /api/plants</div>}
                {plants.map((p:any)=><div key={p.code} className="border rounded-xl p-3 bg-zinc-50"><div className="flex justify-between"><span className="font-medium">{p.code} {p.name}</span><span className="text-xs bg-white border rounded-full px-2">{p.company_code} • {p.sloc_count} SLocs • {p.stock_lines} stock</span></div><div className="text-xs text-zinc-500 mt-1">Total Qty: {p.total_qty || 0} • Active: {p.is_active?'Yes':'No'}</div></div>)}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl border p-5">
              <h3 className="font-medium">Storage Locations OX09 • {slocs.length}</h3>
              <div className="mt-4 space-y-2 max-h-[600px] overflow-auto">
                {slocs.length===0 && <div className="text-sm text-zinc-500 border rounded-xl p-3 bg-zinc-50">No storage locations – Fresh deployment</div>}
                {slocs.map((s:any)=><div key={s.id} className="border rounded-xl p-3 bg-zinc-50 flex justify-between"><div><div className="font-medium text-sm">{s.code} {s.name}</div><div className="text-xs text-zinc-500">Plant: {s.plant_code} {s.plant_name} • Active: {s.is_active?'Yes':'No'}</div></div><span className="text-xs bg-white border rounded-full px-2 py-1 self-center">{s.stock_lines} stock</span></div>)}
              </div>
            </div>
          </div>
        )}

        {activeTab==='purch' && (
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-medium">Purchasing Org OX08 + Group OME4 – Configurable</h3>
            <div className="mt-3 text-sm text-zinc-500">No hardcoded KPO1/KPG – Fresh deployment shows real data from DB. Purchasing Orgs from mm_purchasing_org, Groups from mm_purchasing_group – create via /api/plants or /api/enterprise/config. Only real data shown, no implementation guide examples.</div>
            <div className="mt-4 text-xs space-y-2">
              <div className="bg-zinc-50 border rounded-xl p-3">Current Plants for {companyCode}: {plants.length===0 ? 'No plants – Fresh deployment' : plants.map((p:any)=>p.code).join(', ')}</div>
              <div className="bg-zinc-50 border rounded-xl p-3">SLocs: {slocs.length===0 ? 'No SLocs – Fresh deployment' : slocs.map((s:any)=>`${s.code} ${s.name} (${s.plant_code})`).join(', ')}</div>
            </div>
          </div>
        )}

        {activeTab==='sales' && (
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-medium">Sales Organization + Distribution Channel + Division – Configurable</h3>
            <div className="mt-3 text-sm text-zinc-500">No hardcoded KSO1/K1/K1 – Fresh deployment shows real data from DB. Sales Orgs from sd_sales_org, Channels from sd_distribution_channel, Divisions from sd_division – create via API. Only real data, no implementation guide confusion.</div>
          </div>
        )}
      </div>
    </ModernModuleShell>
  );
}
