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

  const [cgForm, setCgForm] = useState({ code: '', name: '', description: '', tenant_code: 'TEN-100' });
  const [leForm, setLeForm] = useState({
    code: '', name: '', company_group_code: '', currency_code: 'INR', country: 'IN', city: '',
    address: '', street: '', postal_code: '', region: '', tax_id: '', gst_number: '', pan: '', cin: '',
    phone: '', email: '', website: '', legal_form: '', registration_number: '', description: '',
    tenant_code: 'TEN-100', fiscal_calendar_code: 'K4'
  });
  const [caForm, setCaForm] = useState({ code: '', name: '', currency_code: 'INR', description: '', tenant_code: 'TEN-100' });
  const [facForm, setFacForm] = useState({ code: '', name: '', legal_entity_code: '', city: '', country: 'IN', address: '', description: '' });
  const [ilForm, setIlForm] = useState({ code: '', name: '', facility_code: '', location_type: 'PRIMARY', description: '' });
  const [pdForm, setPdForm] = useState({ code: '', name: '', description: '', tenant_code: 'TEN-100' });
  const [btForm, setBtForm] = useState({ code: '', name: '', procurement_division_code: '', email: '', phone: '' });
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
        { url: '/api/tenants', setter: setTenants },
        { url: '/api/company-groups', setter: setCompanyGroups },
        { url: '/api/legal-entities', setter: setLegalEntities },
        { url: '/api/control-areas', setter: setControlAreas },
        { url: '/api/facilities', setter: setFacilities },
        { url: '/api/inventory-locations', setter: setInventoryLocs },
        { url: '/api/procurement-divisions', setter: setProcDivs },
        { url: '/api/buyer-teams', setter: setBuyerTeams },
        { url: '/api/commercial-orgs', setter: setCommercialOrgs },
        { url: '/api/sales-channels', setter: setSalesChannels },
        { url: '/api/product-lines', setter: setProductLines },
        { url: '/api/profit-units', setter: setProfitUnits },
        { url: '/api/cost-units', setter: setCostUnits },
        { url: '/api/business-segments', setter: setBusinessSegments },
        { url: '/api/warehouse-sites', setter: setWarehouseSites },
        { url: '/api/dispatch-points', setter: setDispatchPoints },
        { url: '/api/credit-policy-areas', setter: setCreditPolicyAreas },
      ];
      const results = await Promise.all(endpoints.map(e => fetch(e.url).then(r => r.json()).catch(() => ({ data: [] }))));
      results.forEach((res, i) => {
        const data = res.data || [];
        endpoints[i].setter(Array.isArray(data) ? data : []);
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [companyCode]);

  const postData = async (url: string, body: any, successMsg: string) => {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json();
      if (res.ok) { setMessage(`✅ ${successMsg}: ${body.code}`); fetchAll(); return true; }
      else { setMessage(`❌ ${d.error || 'Failed'}`); return false; }
    } catch (e: any) { setMessage(`❌ ${e.message}`); return false; }
  };

  const deleteData = async (url: string, code: string) => {
    if (!confirm(`DELETE ${code}?`)) return;
    try {
      const res = await fetch(`${url}?code=${code}`, { method: 'DELETE' });
      const d = await res.json();
      if (res.ok) { setMessage(`✅ DELETED ${code}`); fetchAll(); }
      else setMessage(`❌ ${d.error}`);
    } catch (e: any) { setMessage(`❌ ${e.message}`); }
  };

  const tabs = [
    { id: 'company' as TabId, label: 'Company Group & Legal Entity', code: 'ECGC/ELEC' },
    { id: 'control' as TabId, label: 'Control Area & Credit Policy', code: 'ECAC/FCPC' },
    { id: 'facility' as TabId, label: 'Facility & Inventory Location', code: 'EFCC/EILC' },
    { id: 'procurement' as TabId, label: 'Procurement Division & Buyer Team', code: 'EPDC/EBTC' },
    { id: 'commercial' as TabId, label: 'Commercial Org & Channel & Product Line', code: 'ECOC/ESCC/EPLC' },
    { id: 'profit' as TabId, label: 'Profit & Cost & Segment & Warehouse & Dispatch', code: 'EPUC/ECUC/EBSC/EWHC/EDPC' },
  ];

  if (loading) return <div className="p-6">Loading enterprise structure...</div>;

  // MODERN – actually modern with better formatting, rounded-2xl, shadows, nice inputs
  const modernContent = (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`text-xs rounded-full px-4 py-2 border transition-all ${activeTab === t.id ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' : 'bg-white hover:bg-zinc-50 border-zinc-200'}`}>
            <span className="font-mono font-bold">{t.code}</span> <span className="ml-1">{t.label}</span>
          </button>
        ))}
      </div>

      {message && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm flex justify-between"><span>{message}</span><button onClick={() => setMessage(null)} className="text-zinc-400">✕</button></div>}

      {activeTab === 'company' && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Company Groups <span className="ml-2 text-xs font-mono bg-zinc-100 border rounded-full px-2 py-0.5">OX15 {companyGroups.length}</span></h3>
                <span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">ECGC</span>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[11px] text-zinc-500 font-medium">CODE</label><input value={cgForm.code} onChange={e => setCgForm({ ...cgForm, code: e.target.value.toUpperCase() })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black uppercase" /></div>
                  <div><label className="text-[11px] text-zinc-500 font-medium">TENANT_CODE</label><input value={cgForm.tenant_code} onChange={e => setCgForm({ ...cgForm, tenant_code: e.target.value.toUpperCase() })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black uppercase" /></div>
                  <div className="col-span-2"><label className="text-[11px] text-zinc-500 font-medium">NAME</label><input value={cgForm.name} onChange={e => setCgForm({ ...cgForm, name: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" /></div>
                  <div className="col-span-2"><label className="text-[11px] text-zinc-500 font-medium">DESCRIPTION</label><input value={cgForm.description} onChange={e => setCgForm({ ...cgForm, description: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" /></div>
                </div>
                <button onClick={() => postData('/api/company-groups', cgForm, 'COMPANY_GROUP CREATED')} className="w-full bg-zinc-900 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-black transition-colors">+ Create Company Group ECGC</button>
              </div>
              <div className="mt-5 space-y-2 max-h-[400px] overflow-auto">
                {companyGroups.map((cg: any) => (
                  <div key={cg.code} className="group border border-zinc-200 rounded-xl p-3 hover:border-zinc-900 hover:shadow-sm transition-all bg-zinc-50/50">
                    <div className="flex justify-between items-start"><div><div className="font-medium text-sm">{cg.code}</div><div className="text-xs text-zinc-600">{cg.name}</div><div className="text-[11px] text-zinc-400 mt-1">{cg.description}</div></div><button onClick={() => deleteData('/api/company-groups', cg.code)} className="opacity-0 group-hover:opacity-100 text-xs border border-red-200 text-red-600 rounded-full px-2.5 py-1 bg-white hover:bg-red-600 hover:text-white transition-all">Delete</button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold">Legal Entities <span className="ml-2 text-xs font-mono bg-zinc-100 border rounded-full px-2 py-0.5">OX02 {legalEntities.length}</span></h3>
                <span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">ELEC</span>
              </div>
              <div className="text-[11px] font-mono bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 mb-4 text-zinc-600">{`{ "code": "LE-2000", "name": "Indus Spice Labs", "company_group_code": "ISL", "currency_code": "INR", "tax_id": "32ABCDE1234F1Z5", "fiscal_calendar_code": "K4" }`}</div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-[11px] text-zinc-500 font-medium">CODE</label><input value={leForm.code} onChange={e => setLeForm({ ...leForm, code: e.target.value.toUpperCase() })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-black focus:outline-none" /></div>
                <div><label className="text-[11px] text-zinc-500 font-medium">NAME</label><input value={leForm.name} onChange={e => setLeForm({ ...leForm, name: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:outline-none" /></div>
                <div><label className="text-[11px] text-zinc-500 font-medium">COMPANY_GROUP_CODE</label><input value={leForm.company_group_code} onChange={e => setLeForm({ ...leForm, company_group_code: e.target.value.toUpperCase() })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-black focus:outline-none" /></div>
                <div><label className="text-[11px] text-zinc-500 font-medium">CURRENCY_CODE</label><input value={leForm.currency_code} onChange={e => setLeForm({ ...leForm, currency_code: e.target.value.toUpperCase() })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm uppercase" /></div>
                <div><label className="text-[11px] text-zinc-500 font-medium">COUNTRY</label><input value={leForm.country} onChange={e => setLeForm({ ...leForm, country: e.target.value.toUpperCase() })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm uppercase" /></div>
                <div><label className="text-[11px] text-zinc-500 font-medium">CITY</label><input value={leForm.city} onChange={e => setLeForm({ ...leForm, city: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm" /></div>
                <div><label className="text-[11px] text-zinc-500 font-medium">TAX_ID</label><input value={leForm.tax_id} onChange={e => setLeForm({ ...leForm, tax_id: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm" /></div>
                <div><label className="text-[11px] text-zinc-500 font-medium">GST_NUMBER</label><input value={leForm.gst_number} onChange={e => setLeForm({ ...leForm, gst_number: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm" /></div>
                <div><label className="text-[11px] text-zinc-500 font-medium">FISCAL_CALENDAR_CODE</label><input value={leForm.fiscal_calendar_code} onChange={e => setLeForm({ ...leForm, fiscal_calendar_code: e.target.value.toUpperCase() })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm uppercase" /></div>
                <div><label className="text-[11px] text-zinc-500 font-medium">ADDRESS</label><input value={leForm.address} onChange={e => setLeForm({ ...leForm, address: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm" /></div>
                <div><label className="text-[11px] text-zinc-500 font-medium">PHONE</label><input value={leForm.phone} onChange={e => setLeForm({ ...leForm, phone: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm" /></div>
                <div><label className="text-[11px] text-zinc-500 font-medium">EMAIL</label><input value={leForm.email} onChange={e => setLeForm({ ...leForm, email: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm" /></div>
                <div className="col-span-3"><label className="text-[11px] text-zinc-500 font-medium">DESCRIPTION</label><input value={leForm.description} onChange={e => setLeForm({ ...leForm, description: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm" /></div>
              </div>
              <button onClick={() => postData('/api/legal-entities', leForm, 'LEGAL_ENTITY CREATED')} className="mt-4 w-full bg-zinc-900 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-black transition-colors">+ Create Legal Entity ELEC LE-2000 ISL</button>
              <div className="mt-5 space-y-2 max-h-[400px] overflow-auto">
                {legalEntities.map((le: any) => (
                  <div key={le.code} className="group border border-zinc-200 rounded-xl p-3 hover:border-zinc-900 hover:shadow-sm transition-all bg-zinc-50/50">
                    <div className="flex justify-between"><div><div className="font-medium text-sm">{le.code} – {le.name}</div><div className="text-[11px] text-zinc-500 mt-1">{le.currency_code} • {le.city} • {le.country} • TAX_ID {le.tax_id} • FISCAL {le.fiscal_calendar_code || 'K4'}</div></div><button onClick={() => deleteData('/api/legal-entities', le.code)} className="opacity-0 group-hover:opacity-100 text-xs border border-red-200 text-red-600 rounded-full px-2.5 py-1 bg-white hover:bg-red-600 hover:text-white transition-all">Delete</button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'company' && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-12 text-center">
          <div className="text-sm font-medium">{tabs.find(t=>t.id===activeTab)?.code} {tabs.find(t=>t.id===activeTab)?.label}</div>
          <div className="text-xs text-zinc-500 mt-2">Modern view with better formatting – cards, rounded-2xl, shadows – classic keeps power-user no nonsense. Switch tabs to see Company Group & Legal Entity.</div>
          <button onClick={()=>setActiveTab('company')} className="mt-4 text-xs bg-black text-white rounded-full px-4 py-2">Go to ECGC/ELEC</button>
        </div>
      )}
    </div>
  );

  // CLASSIC – power-user no nonsense, exact field names, no placeholder, black borders, mono
  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      <div className="flex gap-1 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`text-[11px] px-2 py-1 border ${activeTab === t.id ? 'bg-black text-white border-black' : 'bg-white border-black'}`}>{t.code}</button>
        ))}
      </div>
      {activeTab === 'company' && (
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-5 bg-white border border-black p-2">
            <div className="font-bold border-b border-black pb-1 mb-2">ECGC COMPANY_GROUP_CREATE OX15 {companyGroups.length}</div>
            <div className="grid grid-cols-2 gap-2">
              <div><div className="text-[10px] text-zinc-500">CODE</div><input value={cgForm.code} onChange={e => setCgForm({ ...cgForm, code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">TENANT_CODE</div><input value={cgForm.tenant_code} onChange={e => setCgForm({ ...cgForm, tenant_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">NAME</div><input value={cgForm.name} onChange={e => setCgForm({ ...cgForm, name: e.target.value })} className="border border-black px-1 py-1 w-full text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={cgForm.description} onChange={e => setCgForm({ ...cgForm, description: e.target.value })} className="border border-black px-1 py-1 w-full text-xs" /></div>
            </div>
            <button onClick={() => postData('/api/company-groups', cgForm, 'COMPANY_GROUP CREATED')} className="mt-2 bg-black text-white px-2 py-1 w-full text-[11px]">CREATE ECGC</button>
            <div className="mt-2 space-y-1">{companyGroups.map((cg:any)=><div key={cg.code} className="border border-zinc-300 p-1 flex justify-between"><span>{cg.code} {cg.name}</span><button onClick={()=>deleteData('/api/company-groups',cg.code)} className="border border-red-600 text-red-600 px-1">DEL</button></div>)}</div>
          </div>
          <div className="col-span-7 bg-white border border-black p-2">
            <div className="font-bold border-b border-black pb-1 mb-2">ELEC LEGAL_ENTITY_CREATE OX02 {legalEntities.length} API: POST /api/legal-entities</div>
            <div className="text-[10px] bg-zinc-100 border border-zinc-300 p-1 mb-2">{`{ "code": "LE-2000", "company_group_code": "ISL", "currency_code": "INR", "tax_id": "32ABCDE1234F1Z5", "fiscal_calendar_code": "K4" }`}</div>
            <div className="grid grid-cols-3 gap-2">
              <div><div className="text-[10px] text-zinc-500">CODE</div><input value={leForm.code} onChange={e=>setLeForm({...leForm,code:e.target.value.toUpperCase()})} className="border border-black px-1 py-1 w-full uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">NAME</div><input value={leForm.name} onChange={e=>setLeForm({...leForm,name:e.target.value})} className="border border-black px-1 py-1 w-full text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">COMPANY_GROUP_CODE</div><input value={leForm.company_group_code} onChange={e=>setLeForm({...leForm,company_group_code:e.target.value.toUpperCase()})} className="border border-black px-1 py-1 w-full uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">CURRENCY_CODE</div><input value={leForm.currency_code} onChange={e=>setLeForm({...leForm,currency_code:e.target.value.toUpperCase()})} className="border border-black px-1 py-1 w-full uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">COUNTRY</div><input value={leForm.country} onChange={e=>setLeForm({...leForm,country:e.target.value.toUpperCase()})} className="border border-black px-1 py-1 w-full uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">CITY</div><input value={leForm.city} onChange={e=>setLeForm({...leForm,city:e.target.value})} className="border border-black px-1 py-1 w-full text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">TAX_ID</div><input value={leForm.tax_id} onChange={e=>setLeForm({...leForm,tax_id:e.target.value})} className="border border-black px-1 py-1 w-full text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">FISCAL_CALENDAR_CODE</div><input value={leForm.fiscal_calendar_code} onChange={e=>setLeForm({...leForm,fiscal_calendar_code:e.target.value.toUpperCase()})} className="border border-black px-1 py-1 w-full uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={leForm.description} onChange={e=>setLeForm({...leForm,description:e.target.value})} className="border border-black px-1 py-1 w-full text-xs" /></div>
            </div>
            <button onClick={() => postData('/api/legal-entities', leForm, 'LEGAL_ENTITY CREATED')} className="mt-2 bg-black text-white px-2 py-1 w-full text-[11px]">CREATE ELEC</button>
            <div className="mt-2 space-y-1 max-h-[300px] overflow-auto">{legalEntities.map((le:any)=><div key={le.code} className="border border-zinc-300 p-1"><div className="flex justify-between"><span className="font-bold">{le.code} {le.name}</span><button onClick={()=>deleteData('/api/legal-entities',le.code)} className="border border-red-600 text-red-600 px-1">DEL</button></div><div className="text-[10px]">CURRENCY_CODE={le.currency_code} COMPANY_GROUP_CODE={le.company_group_id} TAX_ID={le.tax_id} FISCAL_CALENDAR_CODE={le.fiscal_calendar_code}</div></div>)}</div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ModernModuleShell title="Enterprise Structure" subtitle={`${tenants.length} TENANTS ${companyGroups.length} COMPANY_GROUPS ${legalEntities.length} LEGAL_ENTITIES`} code="ELEC" module="FOUNDATION" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
