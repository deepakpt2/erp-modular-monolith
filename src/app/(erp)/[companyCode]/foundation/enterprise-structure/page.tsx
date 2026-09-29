"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

type TabId = 'company' | 'control' | 'facility' | 'procurement' | 'commercial' | 'profit';

export default function EnterpriseStructurePage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [activeTab, setActiveTab] = useState<TabId>('company');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Data states – fresh empty Module 1
  const [tenants, setTenants] = useState<any[]>([]);
  const [companyGroups, setCompanyGroups] = useState<any[]>([]);
  const [legalEntities, setLegalEntities] = useState<any[]>([]);
  const [controlAreas, setControlAreas] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [inventoryLocs, setInventoryLocs] = useState<any[]>([]);
  const [procDivs, setProcDivs] = useState<any[]>([]);
  const [buyerTeams, setBuyerTeams] = useState<any[]>([]);
  const [commercialOrgs, setCommercialOrgs] = useState<any[]>([]);
  const [salesChannels, setSalesChannels] = useState<any[]>([]);
  const [productLines, setProductLines] = useState<any[]>([]);
  const [profitUnits, setProfitUnits] = useState<any[]>([]);
  const [costUnits, setCostUnits] = useState<any[]>([]);
  const [businessSegments, setBusinessSegments] = useState<any[]>([]);
  const [warehouseSites, setWarehouseSites] = useState<any[]>([]);
  const [dispatchPoints, setDispatchPoints] = useState<any[]>([]);
  const [creditPolicyAreas, setCreditPolicyAreas] = useState<any[]>([]);

  // Forms
  const [cgForm, setCgForm] = useState({ code: '', name: '', description: '' });
  const [leForm, setLeForm] = useState({ code: '', name: '', currency_code: 'INR', city: '', country: 'IN', description: '' });
  const [caForm, setCaForm] = useState({ code: '', name: '', currency_code: 'INR', description: '' });
  const [facForm, setFacForm] = useState({ code: '', name: '', legal_entity_code: '', description: '' });
  const [ilForm, setIlForm] = useState({ code: '', name: '', facility_code: '', location_type: 'PRIMARY' });
  const [pdForm, setPdForm] = useState({ code: '', name: '', description: '' });
  const [btForm, setBtForm] = useState({ code: '', name: '', procurement_division_code: '', email: '' });
  const [coForm, setCoForm] = useState({ code: '', name: '', legal_entity_code: '', currency_code: 'INR', description: '' });
  const [scForm, setScForm] = useState({ code: '', name: '', description: '' });
  const [plForm, setPlForm] = useState({ code: '', name: '', description: '' });
  const [puForm, setPuForm] = useState({ code: '', name: '', legal_entity_code: '', control_area_code: '', description: '' });
  const [cuForm, setCuForm] = useState({ code: '', name: '', legal_entity_code: '', control_area_code: '', parent_code: '', description: '' });
  const [bsForm, setBsForm] = useState({ code: '', name: '', description: '' });
  const [whForm, setWhForm] = useState({ code: '', name: '', facility_code: '', description: '' });
  const [dpForm, setDpForm] = useState({ code: '', name: '', facility_code: '', loading_group: 'FORKLIFT', route: '', description: '' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const endpoints = [
        { url: '/api/tenants', setter: setTenants, key: 'data' },
        { url: '/api/company-groups', setter: setCompanyGroups, key: 'data' },
        { url: '/api/legal-entities', setter: setLegalEntities, key: 'data' },
        { url: '/api/control-areas', setter: setControlAreas, key: 'data' },
        { url: '/api/facilities', setter: setFacilities, key: 'data' },
        { url: '/api/inventory-locations', setter: setInventoryLocs, key: 'data' },
        { url: '/api/procurement-divisions', setter: setProcDivs, key: 'data' },
        { url: '/api/buyer-teams', setter: setBuyerTeams, key: 'data' },
        { url: '/api/commercial-orgs', setter: setCommercialOrgs, key: 'data' },
        { url: '/api/sales-channels', setter: setSalesChannels, key: 'data' },
        { url: '/api/product-lines', setter: setProductLines, key: 'data' },
        { url: '/api/profit-units', setter: setProfitUnits, key: 'data' },
        { url: '/api/cost-units', setter: setCostUnits, key: 'data' },
        { url: '/api/business-segments', setter: setBusinessSegments, key: 'data' },
        { url: '/api/warehouse-sites', setter: setWarehouseSites, key: 'data' },
        { url: '/api/dispatch-points', setter: setDispatchPoints, key: 'data' },
        { url: '/api/credit-policy-areas', setter: setCreditPolicyAreas, key: 'data' },
      ];
      const results = await Promise.all(endpoints.map(e => fetch(e.url).then(r => r.json()).catch(() => ({ data: [] }))));
      results.forEach((res, i) => {
        const ep = endpoints[i];
        const data = res.data || res[ep.key.replace('-', '')] || res[Object.keys(res).find(k => Array.isArray(res[k])) || 'data'] || [];
        ep.setter(Array.isArray(data) ? data : []);
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [companyCode]);

  const postData = async (url: string, body: any, successMsg: string) => {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json();
      if (res.ok) { setMessage(`✅ ${successMsg}: ${d.message || body.code}`); fetchAll(); return true; }
      else { setMessage(`❌ ${d.error || 'Failed'}`); return false; }
    } catch (e: any) { setMessage(`❌ ${e.message}`); return false; }
  };

  const deleteData = async (url: string, code: string) => {
    if (!confirm(`Delete ${code}?`)) return;
    try {
      const res = await fetch(`${url}?code=${code}`, { method: 'DELETE' });
      const d = await res.json();
      if (res.ok) { setMessage(`✅ Deleted ${code}`); fetchAll(); }
      else setMessage(`❌ ${d.error}`);
    } catch (e: any) { setMessage(`❌ ${e.message}`); }
  };

  const tabs = [
    { id: 'company' as TabId, label: 'Company Group & Legal Entity', codes: 'OX15/OX02 ORG-CG-01/ORG-LE-01' },
    { id: 'control' as TabId, label: 'Control Area & Credit Policy', codes: 'OX06/OB45 ORG-MC-01' },
    { id: 'facility' as TabId, label: 'Facility & Inventory Location', codes: 'OX10/OX09 ORG-FAC-01/ORG-IL-01' },
    { id: 'procurement' as TabId, label: 'Procurement Division & Buyer Team', codes: 'OX08/OME4 ORG-PD-01/ORG-BT-01' },
    { id: 'commercial' as TabId, label: 'Commercial Org, Channel, Product Line', codes: 'OVX2/OVX1/ORG-PL-01' },
    { id: 'profit' as TabId, label: 'Profit, Cost, Segment, Warehouse, Dispatch', codes: 'KS01/ORG-PU-01/ORG-BS-01/ORG-WH-01/ORG-DP-01' },
  ];

  if (loading) return <div className="p-6">Loading legal-safe enterprise structure – fresh empty Module 1...</div>;

  return (
    <ModernModuleShell
      title={`Enterprise Structure • ${companyCode} – Legal-Safe Module 1`}
      subtitle={`Fresh empty – ${tenants.length} Tenants • ${companyGroups.length} Company Groups • ${legalEntities.length} Legal Entities • ${facilities.length} Facilities • ${inventoryLocs.length} Inventory Locations • ${procDivs.length} Proc Divs • ${commercialOrgs.length} Commercial Orgs – Sample data kept: Currencies, UoM, CoA, GL, Tax`}
      code="OX15"
      module="FOUNDATION"
      tooltip={`Module 1 Legal-Safe – OX15 Company Group, OX02 Legal Entity (formerly Company Code), OX06 Control Area, OX10 Facility (Plant), OX09 Inventory Location (SLoc), OX08 Procurement Division (Purch Org), OME4 Buyer Team (Purch Group), OVX2 Commercial Org (Sales Org), OVX1 Sales Channel (Dist Channel), ORG-PL-01 Product Line (Division), ORG-PU-01 Profit Unit (Profit Center), KS01 Cost Unit (Cost Center), ORG-BS-01 Business Segment, ORG-WH-01 Warehouse Site, ORG-DP-01 Dispatch Point – helper codes kept as-is, neutral names for legal safety`}
    >
      <div className="max-w-[1700px] mx-auto p-6 space-y-4">
        <div className="flex gap-2 mb-4 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`text-xs rounded-full px-4 py-2 border ${activeTab === t.id ? 'bg-black text-white border-black' : 'bg-white hover:bg-zinc-50'}`}>
              {t.codes} {t.label}
            </button>
          ))}
        </div>

        {message && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm mb-4 flex justify-between"><span>{message}</span><button onClick={() => setMessage(null)} className="text-zinc-400">✕</button></div>}

        {activeTab === 'company' && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-6 space-y-4">
              <div className="bg-white rounded-2xl border p-5">
                <h3 className="font-medium">Company Groups OX15 ORG-CG-01 • {companyGroups.length} records – Fresh empty</h3>
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <input value={cgForm.code} onChange={e => setCgForm({ ...cgForm, code: e.target.value.toUpperCase() })} placeholder="Code CG-1000" className="border rounded-xl px-3 py-2 text-sm" />
                    <input value={cgForm.name} onChange={e => setCgForm({ ...cgForm, name: e.target.value })} placeholder="Name" className="border rounded-xl px-3 py-2 text-sm" />
                    <button onClick={() => postData('/api/company-groups', cgForm, 'Company Group created')} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs">+ Create CG</button>
                  </div>
                  {companyGroups.length === 0 && <div className="text-sm text-zinc-500 border rounded-xl p-3 bg-zinc-50">No company groups – Fresh empty Module 1 – Create your first company group</div>}
                  {companyGroups.map((cg: any) => (
                    <div key={cg.id || cg.code} className="border rounded-xl p-3 bg-zinc-50 flex justify-between">
                      <div><div className="font-medium text-sm">{cg.code} {cg.name}</div><div className="text-xs text-zinc-500">{cg.description || 'No description'}</div></div>
                      <button onClick={() => deleteData('/api/company-groups', cg.code)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-6 space-y-4">
              <div className="bg-white rounded-2xl border p-5">
                <h3 className="font-medium">Legal Entities OX02 ORG-LE-01 • {legalEntities.length} records – Fresh empty (formerly Company Code)</h3>
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <input value={leForm.code} onChange={e => setLeForm({ ...leForm, code: e.target.value.toUpperCase() })} placeholder="LE-1000" className="border rounded-xl px-3 py-2 text-sm" />
                    <input value={leForm.name} onChange={e => setLeForm({ ...leForm, name: e.target.value })} placeholder="Name" className="border rounded-xl px-3 py-2 text-sm" />
                    <input value={leForm.currency_code} onChange={e => setLeForm({ ...leForm, currency_code: e.target.value.toUpperCase() })} placeholder="INR" className="border rounded-xl px-3 py-2 text-sm" />
                    <input value={leForm.city} onChange={e => setLeForm({ ...leForm, city: e.target.value })} placeholder="City" className="border rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <input value={leForm.description} onChange={e => setLeForm({ ...leForm, description: e.target.value })} placeholder="Description" className="border rounded-xl px-3 py-2 text-sm flex-1" />
                    <button onClick={() => postData('/api/legal-entities', leForm, 'Legal Entity created')} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs">+ Create Legal Entity OX02</button>
                  </div>
                  {legalEntities.length === 0 && <div className="text-sm text-zinc-500 border rounded-xl p-3 bg-zinc-50">No legal entities – Fresh empty – Create LE-1000, LE-2000 etc. Sample data kept: Currencies INR default, UoM, CoA, GL, Tax Codes remain available for other modules.</div>}
                  {legalEntities.map((le: any) => (
                    <div key={le.id || le.code} className="border rounded-xl p-3 bg-zinc-50">
                      <div className="flex justify-between"><span className="font-medium text-sm">{le.code} {le.name}</span><button onClick={() => deleteData('/api/legal-entities', le.code)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button></div>
                      <div className="text-xs text-zinc-500 mt-1">{le.currency_code} {le.city} {le.country} {le.description}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border p-5">
                <h4 className="font-medium text-sm">Tenants TEN-01 • {tenants.length}</h4>
                <div className="mt-2 text-xs text-zinc-500">Fresh empty Module 1 – 1 default tenant TEN-100 auto-created on first POST. Old ent_client remains deprecated.</div>
                <div className="mt-3 space-y-2">{tenants.map((t: any) => <div key={t.code} className="border rounded-lg p-2 bg-zinc-50 text-sm">{t.code} {t.name}</div>)}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'control' && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl border p-5">
              <h3 className="font-medium">Management Control Areas OX06 ORG-MC-01 • {controlAreas.length} – NEW (formerly Controlling Area)</h3>
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <input value={caForm.code} onChange={e => setCaForm({ ...caForm, code: e.target.value.toUpperCase() })} placeholder="CA-1000" className="border rounded-xl px-3 py-2 text-sm" />
                  <input value={caForm.name} onChange={e => setCaForm({ ...caForm, name: e.target.value })} placeholder="Name" className="border rounded-xl px-3 py-2 text-sm" />
                  <button onClick={() => postData('/api/control-areas', caForm, 'Control Area created')} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs">+ Create Control Area OX06</button>
                </div>
                {controlAreas.length === 0 && <div className="text-sm text-zinc-500 border rounded-xl p-3 bg-zinc-50">No control areas – Fresh empty – NEW table org_mgmt_control_area. Legal Entity 1:1 Control Area via org_legal_entity_control_area_assign. Validation: Cost Unit & Profit Unit must share same Control Area as Legal Entity.</div>}
                {controlAreas.map((ca: any) => <div key={ca.code} className="border rounded-xl p-3 bg-zinc-50 flex justify-between"><span className="text-sm font-medium">{ca.code} {ca.name} {ca.currency_code}</span><button onClick={() => deleteData('/api/control-areas', ca.code)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button></div>)}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl border p-5">
              <h3 className="font-medium">Credit Policy Areas OB45 • {creditPolicyAreas.length} – renamed from Credit Control Area</h3>
              <div className="mt-4 text-xs text-zinc-500">fin_credit_policy_area – helper OB45 kept. Assignment to Legal Entity via fin_legal_entity_credit_assign (OB38).</div>
              <div className="mt-3 space-y-2">{creditPolicyAreas.map((c: any) => <div key={c.code} className="border rounded-lg p-2 bg-zinc-50 text-sm">{c.code} {c.name} {c.currency_code}</div>)}</div>
            </div>
          </div>
        )}

        {activeTab === 'facility' && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl border p-5">
              <h3 className="font-medium">Facilities OX10 ORG-FAC-01 • {facilities.length} – Fresh empty (formerly Plant)</h3>
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <input value={facForm.code} onChange={e => setFacForm({ ...facForm, code: e.target.value.toUpperCase() })} placeholder="FAC-1000" className="border rounded-xl px-3 py-2 text-sm" />
                  <input value={facForm.name} onChange={e => setFacForm({ ...facForm, name: e.target.value })} placeholder="Name" className="border rounded-xl px-3 py-2 text-sm" />
                  <input value={facForm.legal_entity_code} onChange={e => setFacForm({ ...facForm, legal_entity_code: e.target.value.toUpperCase() })} placeholder="LE Code LE-1000" className="border rounded-xl px-3 py-2 text-sm" />
                </div>
                <button onClick={() => postData('/api/facilities', facForm, 'Facility created')} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs">+ Create Facility OX10</button>
                {facilities.length === 0 && <div className="text-sm text-zinc-500 border rounded-xl p-3 bg-zinc-50">No facilities – Fresh empty – Create facility with Legal Entity code. Validation: Facility must belong to active Legal Entity, cannot delete if inventory locations / warehouse sites / stock exist.</div>}
                {facilities.map((f: any) => <div key={f.code} className="border rounded-xl p-3 bg-zinc-50 flex justify-between"><div><div className="text-sm font-medium">{f.code} {f.name}</div><div className="text-xs text-zinc-500">Legal Entity: {f.legal_entity_id?.slice(0, 8)} {f.description}</div></div><button onClick={() => deleteData('/api/facilities', f.code)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button></div>)}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl border p-5">
              <h3 className="font-medium">Inventory Locations OX09 ORG-IL-01 • {inventoryLocs.length} – Fresh empty (formerly Storage Location)</h3>
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <input value={ilForm.code} onChange={e => setIlForm({ ...ilForm, code: e.target.value.toUpperCase() })} placeholder="IL-0001" className="border rounded-xl px-3 py-2 text-sm" />
                  <input value={ilForm.name} onChange={e => setIlForm({ ...ilForm, name: e.target.value })} placeholder="Name" className="border rounded-xl px-3 py-2 text-sm" />
                  <input value={ilForm.facility_code} onChange={e => setIlForm({ ...ilForm, facility_code: e.target.value.toUpperCase() })} placeholder="FAC Code" className="border rounded-xl px-3 py-2 text-sm" />
                </div>
                <div className="flex gap-2">
                  <select value={ilForm.location_type} onChange={e => setIlForm({ ...ilForm, location_type: e.target.value })} className="border rounded-xl px-3 py-2 text-sm flex-1">
                    <option value="PRIMARY">PRIMARY</option><option value="COLD_ZONE">COLD_ZONE</option><option value="SHOP_FLOOR">SHOP_FLOOR</option><option value="RETURNS">RETURNS</option><option value="QUALITY">QUALITY</option><option value="BLOCKED">BLOCKED</option><option value="RAW_ZONE">RAW_ZONE</option><option value="FINISHED_ZONE">FINISHED_ZONE</option><option value="PACK_ZONE">PACK_ZONE</option>
                  </select>
                  <button onClick={() => postData('/api/inventory-locations', ilForm, 'Inventory Location created')} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs">+ Create Location OX09</button>
                </div>
                {inventoryLocs.length === 0 && <div className="text-sm text-zinc-500 border rounded-xl p-3 bg-zinc-50">No inventory locations – Fresh empty – location_type enum neutral: PRIMARY/COLD_ZONE/SHOP_FLOOR etc (not MAIN/COLD).</div>}
                {inventoryLocs.map((il: any) => <div key={il.code} className="border rounded-xl p-3 bg-zinc-50 flex justify-between"><span className="text-sm">{il.code} {il.name} {il.location_type}</span><button onClick={() => deleteData('/api/inventory-locations', il.code)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button></div>)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'procurement' && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl border p-5">
              <h3 className="font-medium">Procurement Divisions OX08 ORG-PD-01 • {procDivs.length} – NEW master (formerly Purchasing Organization)</h3>
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <input value={pdForm.code} onChange={e => setPdForm({ ...pdForm, code: e.target.value.toUpperCase() })} placeholder="PD-1000" className="border rounded-xl px-3 py-2 text-sm" />
                  <input value={pdForm.name} onChange={e => setPdForm({ ...pdForm, name: e.target.value })} placeholder="Name" className="border rounded-xl px-3 py-2 text-sm" />
                  <button onClick={() => postData('/api/procurement-divisions', pdForm, 'Procurement Division created')} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs">+ Create PD OX08</button>
                </div>
                {procDivs.length === 0 && <div className="text-sm text-zinc-500 border rounded-xl p-3 bg-zinc-50">No procurement divisions – Fresh empty – NEW master org_procurement_division. Assignment to Legal Entity & Facility via org_proc_div_legal_assign & org_proc_div_facility_assign. PR/PO validation will check assignment (future MM module).</div>}
                {procDivs.map((pd: any) => <div key={pd.code} className="border rounded-xl p-3 bg-zinc-50 flex justify-between"><span className="text-sm font-medium">{pd.code} {pd.name}</span><button onClick={() => deleteData('/api/procurement-divisions', pd.code)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button></div>)}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl border p-5">
              <h3 className="font-medium">Buyer Teams OME4 ORG-BT-01 • {buyerTeams.length} – NEW master (formerly Purchasing Group)</h3>
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <input value={btForm.code} onChange={e => setBtForm({ ...btForm, code: e.target.value.toUpperCase() })} placeholder="BT-001" className="border rounded-xl px-3 py-2 text-sm" />
                  <input value={btForm.name} onChange={e => setBtForm({ ...btForm, name: e.target.value })} placeholder="Name" className="border rounded-xl px-3 py-2 text-sm" />
                  <input value={btForm.procurement_division_code} onChange={e => setBtForm({ ...btForm, procurement_division_code: e.target.value.toUpperCase() })} placeholder="PD Code" className="border rounded-xl px-3 py-2 text-sm" />
                </div>
                <button onClick={() => postData('/api/buyer-teams', btForm, 'Buyer Team created')} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs">+ Create Buyer Team OME4</button>
                {buyerTeams.length === 0 && <div className="text-sm text-zinc-500 border rounded-xl p-3 bg-zinc-50">No buyer teams – Fresh empty – NEW master org_buyer_team. Must belong to Procurement Division.</div>}
                {buyerTeams.map((bt: any) => <div key={bt.code} className="border rounded-xl p-3 bg-zinc-50 flex justify-between"><span className="text-sm">{bt.code} {bt.name} {bt.email}</span><button onClick={() => deleteData('/api/buyer-teams', bt.code)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button></div>)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'commercial' && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border p-5">
              <h3 className="font-medium">Commercial Orgs OVX2 ORG-CO-01 • {commercialOrgs.length} – NEW master (formerly Sales Organization)</h3>
              <div className="mt-4 space-y-3">
                <input value={coForm.code} onChange={e => setCoForm({ ...coForm, code: e.target.value.toUpperCase() })} placeholder="CO-1000" className="border rounded-xl px-3 py-2 text-sm w-full" />
                <input value={coForm.name} onChange={e => setCoForm({ ...coForm, name: e.target.value })} placeholder="Name" className="border rounded-xl px-3 py-2 text-sm w-full" />
                <input value={coForm.legal_entity_code} onChange={e => setCoForm({ ...coForm, legal_entity_code: e.target.value.toUpperCase() })} placeholder="LE Code" className="border rounded-xl px-3 py-2 text-sm w-full" />
                <button onClick={() => postData('/api/commercial-orgs', coForm, 'Commercial Org created')} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs w-full">+ Create Commercial Org OVX2</button>
                {commercialOrgs.map((co: any) => <div key={co.code} className="border rounded-xl p-3 bg-zinc-50 flex justify-between mt-2"><span className="text-sm">{co.code} {co.name}</span><button onClick={() => deleteData('/api/commercial-orgs', co.code)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button></div>)}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border p-5">
              <h3 className="font-medium">Sales Channels OVX1 ORG-SC-01 • {salesChannels.length} – NEW master (formerly Distribution Channel)</h3>
              <div className="mt-4 space-y-3">
                <input value={scForm.code} onChange={e => setScForm({ ...scForm, code: e.target.value.toUpperCase() })} placeholder="SC-DIRECT" className="border rounded-xl px-3 py-2 text-sm w-full" />
                <input value={scForm.name} onChange={e => setScForm({ ...scForm, name: e.target.value })} placeholder="Name" className="border rounded-xl px-3 py-2 text-sm w-full" />
                <button onClick={() => postData('/api/sales-channels', scForm, 'Sales Channel created')} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs w-full">+ Create Channel OVX1</button>
                {salesChannels.map((sc: any) => <div key={sc.code} className="border rounded-xl p-3 bg-zinc-50 flex justify-between mt-2"><span className="text-sm">{sc.code} {sc.name}</span><button onClick={() => deleteData('/api/sales-channels', sc.code)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button></div>)}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border p-5">
              <h3 className="font-medium">Product Lines ORG-PL-01 • {productLines.length} – NEW master (formerly Division)</h3>
              <div className="mt-4 space-y-3">
                <input value={plForm.code} onChange={e => setPlForm({ ...plForm, code: e.target.value.toUpperCase() })} placeholder="PL-SPICE" className="border rounded-xl px-3 py-2 text-sm w-full" />
                <input value={plForm.name} onChange={e => setPlForm({ ...plForm, name: e.target.value })} placeholder="Name" className="border rounded-xl px-3 py-2 text-sm w-full" />
                <button onClick={() => postData('/api/product-lines', plForm, 'Product Line created')} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs w-full">+ Create Product Line ORG-PL-01</button>
                <div className="text-xs text-zinc-500">Assignment via org_commercial_assign – Commercial Org + Sales Channel + Product Line must be valid combo for Sales Order (future SD module).</div>
                {productLines.map((pl: any) => <div key={pl.code} className="border rounded-xl p-3 bg-zinc-50 flex justify-between mt-2"><span className="text-sm">{pl.code} {pl.name}</span><button onClick={() => deleteData('/api/product-lines', pl.code)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button></div>)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profit' && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border p-5">
              <h3 className="font-medium">Profit Units ORG-PU-01 • {profitUnits.length} – NEW (formerly Profit Center)</h3>
              <div className="mt-4 space-y-2">
                <input value={puForm.code} onChange={e => setPuForm({ ...puForm, code: e.target.value.toUpperCase() })} placeholder="PU-1000" className="border rounded-xl px-3 py-2 text-sm w-full" />
                <input value={puForm.name} onChange={e => setPuForm({ ...puForm, name: e.target.value })} placeholder="Name" className="border rounded-xl px-3 py-2 text-sm w-full" />
                <input value={puForm.legal_entity_code} onChange={e => setPuForm({ ...puForm, legal_entity_code: e.target.value.toUpperCase() })} placeholder="LE Code" className="border rounded-xl px-3 py-2 text-sm w-full" />
                <input value={puForm.control_area_code} onChange={e => setPuForm({ ...puForm, control_area_code: e.target.value.toUpperCase() })} placeholder="Control Area Code" className="border rounded-xl px-3 py-2 text-sm w-full" />
                <button onClick={() => postData('/api/profit-units', puForm, 'Profit Unit created')} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs w-full">+ Create Profit Unit ORG-PU-01</button>
                {profitUnits.map((pu: any) => <div key={pu.code} className="border rounded-xl p-3 bg-zinc-50 flex justify-between mt-2"><span className="text-sm">{pu.code} {pu.name}</span><button onClick={() => deleteData('/api/profit-units', pu.code)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button></div>)}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border p-5">
              <h3 className="font-medium">Cost Units KS01 ORG-CU-01 • {costUnits.length} – renamed from Cost Center</h3>
              <div className="mt-4 space-y-2">
                <input value={cuForm.code} onChange={e => setCuForm({ ...cuForm, code: e.target.value.toUpperCase() })} placeholder="CU-1000" className="border rounded-xl px-3 py-2 text-sm w-full" />
                <input value={cuForm.name} onChange={e => setCuForm({ ...cuForm, name: e.target.value })} placeholder="Name" className="border rounded-xl px-3 py-2 text-sm w-full" />
                <input value={cuForm.legal_entity_code} onChange={e => setCuForm({ ...cuForm, legal_entity_code: e.target.value.toUpperCase() })} placeholder="LE Code" className="border rounded-xl px-3 py-2 text-sm w-full" />
                <input value={cuForm.control_area_code} onChange={e => setCuForm({ ...cuForm, control_area_code: e.target.value.toUpperCase() })} placeholder="Control Area Code" className="border rounded-xl px-3 py-2 text-sm w-full" />
                <button onClick={() => postData('/api/cost-units', cuForm, 'Cost Unit created')} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs w-full">+ Create Cost Unit KS01</button>
                <div className="text-xs text-zinc-500">Validation: must share same Control Area as Legal Entity. Parent must be same LE & CA. Secure delete: if has employees/journal lines → deactivate not delete (audit trail).</div>
                {costUnits.map((cu: any) => <div key={cu.code} className="border rounded-xl p-3 bg-zinc-50 flex justify-between mt-2"><span className="text-sm">{cu.code} {cu.name}</span><button onClick={() => deleteData('/api/cost-units', cu.code)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button></div>)}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl border p-5">
                <h3 className="font-medium">Business Segments ORG-BS-01 • {businessSegments.length} – NEW (formerly Business Area)</h3>
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2"><input value={bsForm.code} onChange={e => setBsForm({ ...bsForm, code: e.target.value.toUpperCase() })} placeholder="BS-1000" className="border rounded-xl px-3 py-2 text-sm" /><input value={bsForm.name} onChange={e => setBsForm({ ...bsForm, name: e.target.value })} placeholder="Name" className="border rounded-xl px-3 py-2 text-sm" /></div>
                  <button onClick={() => postData('/api/business-segments', bsForm, 'Business Segment created')} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs w-full">+ Create BS ORG-BS-01</button>
                  {businessSegments.map((bs: any) => <div key={bs.code} className="border rounded-lg p-2 bg-zinc-50 text-sm flex justify-between"><span>{bs.code} {bs.name}</span><button onClick={() => deleteData('/api/business-segments', bs.code)} className="text-xs text-red-600">Delete</button></div>)}
                </div>
              </div>
              <div className="bg-white rounded-2xl border p-5">
                <h3 className="font-medium">Warehouse Sites ORG-WH-01 • {warehouseSites.length} – NEW (formerly Warehouse Number)</h3>
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2"><input value={whForm.code} onChange={e => setWhForm({ ...whForm, code: e.target.value.toUpperCase() })} placeholder="WH-1000" className="border rounded-xl px-3 py-2 text-sm" /><input value={whForm.facility_code} onChange={e => setWhForm({ ...whForm, facility_code: e.target.value.toUpperCase() })} placeholder="FAC Code" className="border rounded-xl px-3 py-2 text-sm" /></div>
                  <input value={whForm.name} onChange={e => setWhForm({ ...whForm, name: e.target.value })} placeholder="Name" className="border rounded-xl px-3 py-2 text-sm w-full" />
                  <button onClick={() => postData('/api/warehouse-sites', whForm, 'Warehouse Site created')} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs w-full">+ Create WH ORG-WH-01</button>
                  {warehouseSites.map((wh: any) => <div key={wh.code} className="border rounded-lg p-2 bg-zinc-50 text-sm flex justify-between"><span>{wh.code} {wh.name}</span><button onClick={() => deleteData('/api/warehouse-sites', wh.code)} className="text-xs text-red-600">Delete</button></div>)}
                </div>
              </div>
              <div className="bg-white rounded-2xl border p-5">
                <h3 className="font-medium">Dispatch Points ORG-DP-01 • {dispatchPoints.length} – NEW (formerly Shipping Point)</h3>
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2"><input value={dpForm.code} onChange={e => setDpForm({ ...dpForm, code: e.target.value.toUpperCase() })} placeholder="DP-1000" className="border rounded-xl px-3 py-2 text-sm" /><input value={dpForm.facility_code} onChange={e => setDpForm({ ...dpForm, facility_code: e.target.value.toUpperCase() })} placeholder="FAC Code" className="border rounded-xl px-3 py-2 text-sm" /></div>
                  <input value={dpForm.name} onChange={e => setDpForm({ ...dpForm, name: e.target.value })} placeholder="Name" className="border rounded-xl px-3 py-2 text-sm w-full" />
                  <button onClick={() => postData('/api/dispatch-points', dpForm, 'Dispatch Point created')} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs w-full">+ Create DP ORG-DP-01</button>
                  <div className="text-xs text-zinc-500">Determination via org_dispatch_determination: facility + sales_channel + loading_group → dispatch_point. Delivery must have valid dispatch point for facility.</div>
                  {dispatchPoints.map((dp: any) => <div key={dp.code} className="border rounded-lg p-2 bg-zinc-50 text-sm flex justify-between"><span>{dp.code} {dp.name} {dp.loading_group}</span><button onClick={() => deleteData('/api/dispatch-points', dp.code)} className="text-xs text-red-600">Delete</button></div>)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModernModuleShell>
  );
}
