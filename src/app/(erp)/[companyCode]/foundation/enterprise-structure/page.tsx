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

  // Data states
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

  // Forms – exact field names as API, no placeholder sample data – power user no nonsense
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
        const data = res.data || res.companyGroups || res.legalEntities || res.facilities || res.inventoryLocations || res.procurementDivisions || res.buyerTeams || res.commercialOrgs || res.salesChannels || res.productLines || res.profitUnits || res.costUnits || res.businessSegments || res.warehouseSites || res.dispatchPoints || res.creditPolicyAreas || [];
        const arr = Array.isArray(data) ? data : (Array.isArray(res) ? res : []);
        endpoints[i].setter(arr);
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
    { id: 'company' as TabId, label: 'ECGC/ELEC', codes: 'Company Group / Legal Entity' },
    { id: 'control' as TabId, label: 'ECAC/FCPC', codes: 'Control Area / Credit Policy' },
    { id: 'facility' as TabId, label: 'EFCC/EILC', codes: 'Facility / Inventory Location' },
    { id: 'procurement' as TabId, label: 'EPDC/EBTC', codes: 'Proc Division / Buyer Team' },
    { id: 'commercial' as TabId, label: 'ECOC/ESCC/EPLC', codes: 'Commercial Org / Channel / Product Line' },
    { id: 'profit' as TabId, label: 'EPUC/ECUC/EBSC/EWHC/EDPC', codes: 'Profit / Cost / Segment / Warehouse / Dispatch' },
  ];

  if (loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;

  return (
    <ModernModuleShell
      title={`Enterprise Structure`}
      subtitle={`${tenants.length} TENANTS ${companyGroups.length} COMPANY_GROUPS ${legalEntities.length} LEGAL_ENTITIES ${facilities.length} FACILITIES ${inventoryLocs.length} INV_LOCATIONS`}
      code="ELEC"
      module="FOUNDATION"
      tooltip={`ECGC Company Group, ELEC Legal Entity, ECAC Control Area, EFCC Facility, EILC Inventory Location`}
    >
      <div className="max-w-[1700px] mx-auto p-0 space-y-3">
        <div className="flex gap-1 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`text-[11px] font-mono px-3 py-1.5 border ${activeTab === t.id ? 'bg-black text-white border-black' : 'bg-white hover:bg-zinc-50 border-zinc-300'}`}>
              {t.label} {t.codes}
            </button>
          ))}
        </div>

        {message && <div className="bg-black text-white font-mono text-xs p-2 flex justify-between"><span>{message}</span><button onClick={() => setMessage(null)} className="text-zinc-400">✕</button></div>}

        {activeTab === 'company' && (
          <div className="grid grid-cols-12 gap-4">
            {/* ECGC – Company Group – exact fields, no placeholder sample data */}
            <div className="col-span-12 lg:col-span-5 bg-white border border-black p-3">
              <div className="font-mono text-[11px] font-bold border-b border-black pb-1 mb-2">ECGC COMPANY_GROUP_CREATE OX15 ORG-CG-01 {companyGroups.length}</div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div><div className="text-[10px] text-zinc-500">CODE</div><input value={cgForm.code} onChange={e => setCgForm({ ...cgForm, code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 text-xs w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">NAME</div><input value={cgForm.name} onChange={e => setCgForm({ ...cgForm, name: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">TENANT_CODE</div><input value={cgForm.tenant_code} onChange={e => setCgForm({ ...cgForm, tenant_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 text-xs w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={cgForm.description} onChange={e => setCgForm({ ...cgForm, description: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
              </div>
              <button onClick={() => postData('/api/company-groups', cgForm, 'COMPANY_GROUP CREATED')} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE ECGC</button>

              <div className="mt-3 border-t border-zinc-200 pt-2 space-y-1 max-h-[400px] overflow-auto">
                {companyGroups.map((cg: any) => (
                  <div key={cg.code} className="border border-zinc-300 p-1 flex justify-between font-mono text-[11px]">
                    <span>{cg.code} | {cg.name} | {cg.description || ''}</span>
                    <button onClick={() => deleteData('/api/company-groups', cg.code)} className="border border-red-600 text-red-600 px-1">DEL</button>
                  </div>
                ))}
              </div>
            </div>

            {/* ELEC – Legal Entity – all API fields, exact field names, no placeholder */}
            <div className="col-span-12 lg:col-span-7 bg-white border border-black p-3">
              <div className="font-mono text-[11px] font-bold border-b border-black pb-1 mb-2">ELEC LEGAL_ENTITY_CREATE OX02 ORG-LE-01 {legalEntities.length} API: POST /api/legal-entities</div>
              <div className="font-mono text-[10px] bg-zinc-100 border border-zinc-300 p-1 mb-2">
                {`{ "code": "LE-2000", "name": "Indus Spice Labs Pvt Ltd", "company_group_code": "ISL", "country": "IN", "currency_code": "INR", "tax_id": "32ABCDE1234F1Z5", "fiscal_calendar_code": "K4" }`}
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div><div className="text-[10px] text-zinc-500">CODE</div><input value={leForm.code} onChange={e => setLeForm({ ...leForm, code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 text-xs w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">NAME</div><input value={leForm.name} onChange={e => setLeForm({ ...leForm, name: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">COMPANY_GROUP_CODE</div><input value={leForm.company_group_code} onChange={e => setLeForm({ ...leForm, company_group_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 text-xs w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">CURRENCY_CODE</div><input value={leForm.currency_code} onChange={e => setLeForm({ ...leForm, currency_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 text-xs w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">COUNTRY</div><input value={leForm.country} onChange={e => setLeForm({ ...leForm, country: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 text-xs w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">CITY</div><input value={leForm.city} onChange={e => setLeForm({ ...leForm, city: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">ADDRESS</div><input value={leForm.address} onChange={e => setLeForm({ ...leForm, address: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">STREET</div><input value={leForm.street} onChange={e => setLeForm({ ...leForm, street: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">POSTAL_CODE</div><input value={leForm.postal_code} onChange={e => setLeForm({ ...leForm, postal_code: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">REGION</div><input value={leForm.region} onChange={e => setLeForm({ ...leForm, region: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">TAX_ID</div><input value={leForm.tax_id} onChange={e => setLeForm({ ...leForm, tax_id: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">GST_NUMBER</div><input value={leForm.gst_number} onChange={e => setLeForm({ ...leForm, gst_number: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">PAN</div><input value={leForm.pan} onChange={e => setLeForm({ ...leForm, pan: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">CIN</div><input value={leForm.cin} onChange={e => setLeForm({ ...leForm, cin: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">PHONE</div><input value={leForm.phone} onChange={e => setLeForm({ ...leForm, phone: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">EMAIL</div><input value={leForm.email} onChange={e => setLeForm({ ...leForm, email: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">WEBSITE</div><input value={leForm.website} onChange={e => setLeForm({ ...leForm, website: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">LEGAL_FORM</div><input value={leForm.legal_form} onChange={e => setLeForm({ ...leForm, legal_form: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">REGISTRATION_NUMBER</div><input value={leForm.registration_number} onChange={e => setLeForm({ ...leForm, registration_number: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">FISCAL_CALENDAR_CODE</div><input value={leForm.fiscal_calendar_code} onChange={e => setLeForm({ ...leForm, fiscal_calendar_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 text-xs w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">TENANT_CODE</div><input value={leForm.tenant_code} onChange={e => setLeForm({ ...leForm, tenant_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 text-xs w-full uppercase" /></div>
                <div className="col-span-3"><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={leForm.description} onChange={e => setLeForm({ ...leForm, description: e.target.value })} className="border border-black px-1 py-1 text-xs w-full" /></div>
              </div>
              <button onClick={() => postData('/api/legal-entities', leForm, 'LEGAL_ENTITY CREATED')} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE ELEC</button>

              <div className="mt-3 border-t border-zinc-200 pt-2 space-y-1 max-h-[400px] overflow-auto">
                {legalEntities.map((le: any) => (
                  <div key={le.code} className="border border-zinc-300 p-1 font-mono text-[11px]">
                    <div className="flex justify-between"><span className="font-bold">{le.code} | {le.name}</span><button onClick={() => deleteData('/api/legal-entities', le.code)} className="border border-red-600 text-red-600 px-1">DEL</button></div>
                    <div className="text-[10px] text-zinc-600">COMPANY_GROUP_CODE={le.company_group_id || ''} CURRENCY_CODE={le.currency_code} COUNTRY={le.country} CITY={le.city} TAX_ID={le.tax_id} GST_NUMBER={le.gst_number} FISCAL_CALENDAR_CODE={le.fiscal_calendar_code || 'K4'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12 bg-white border border-black p-2 font-mono text-[11px]">
              <div className="font-bold">TENANTS {tenants.length}</div>
              <div className="flex gap-2 mt-1 flex-wrap">{tenants.map((t: any) => <span key={t.code} className="border border-black px-2 py-0.5">{t.code} {t.name}</span>)}</div>
            </div>
          </div>
        )}

        {activeTab === 'control' && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-6 bg-white border border-black p-3">
              <div className="font-mono text-[11px] font-bold border-b border-black pb-1 mb-2">ECAC CONTROL_AREA_CREATE OX06 {controlAreas.length}</div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div><div className="text-[10px] text-zinc-500">CODE</div><input value={caForm.code} onChange={e => setCaForm({ ...caForm, code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">NAME</div><input value={caForm.name} onChange={e => setCaForm({ ...caForm, name: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">CURRENCY_CODE</div><input value={caForm.currency_code} onChange={e => setCaForm({ ...caForm, currency_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">TENANT_CODE</div><input value={caForm.tenant_code} onChange={e => setCaForm({ ...caForm, tenant_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div className="col-span-2"><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={caForm.description} onChange={e => setCaForm({ ...caForm, description: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
              </div>
              <button onClick={() => postData('/api/control-areas', caForm, 'CONTROL_AREA CREATED')} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE ECAC</button>
              <div className="mt-2 space-y-1">{controlAreas.map((ca: any) => <div key={ca.code} className="border border-zinc-300 p-1 flex justify-between font-mono text-[11px]"><span>{ca.code} {ca.name} {ca.currency_code}</span><button onClick={() => deleteData('/api/control-areas', ca.code)} className="border border-red-600 text-red-600 px-1">DEL</button></div>)}</div>
            </div>
            <div className="col-span-12 lg:col-span-6 bg-white border border-black p-3">
              <div className="font-mono text-[11px] font-bold">FCPC CREDIT_POLICY_AREA OB45 {creditPolicyAreas.length}</div>
              <div className="mt-2 space-y-1">{creditPolicyAreas.map((c: any) => <div key={c.code} className="border border-zinc-300 p-1 font-mono text-[11px]">{c.code} {c.name} {c.currency_code}</div>)}</div>
            </div>
          </div>
        )}

        {activeTab === 'facility' && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-6 bg-white border border-black p-3">
              <div className="font-mono text-[11px] font-bold border-b border-black pb-1 mb-2">EFCC FACILITY_CREATE OX10 {facilities.length}</div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div><div className="text-[10px] text-zinc-500">CODE</div><input value={facForm.code} onChange={e => setFacForm({ ...facForm, code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">NAME</div><input value={facForm.name} onChange={e => setFacForm({ ...facForm, name: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">LEGAL_ENTITY_CODE</div><input value={facForm.legal_entity_code} onChange={e => setFacForm({ ...facForm, legal_entity_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">CITY</div><input value={facForm.city} onChange={e => setFacForm({ ...facForm, city: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">COUNTRY</div><input value={facForm.country} onChange={e => setFacForm({ ...facForm, country: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">ADDRESS</div><input value={facForm.address} onChange={e => setFacForm({ ...facForm, address: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                <div className="col-span-2"><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={facForm.description} onChange={e => setFacForm({ ...facForm, description: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
              </div>
              <button onClick={() => postData('/api/facilities', facForm, 'FACILITY CREATED')} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE EFCC</button>
              <div className="mt-2 space-y-1 max-h-[400px] overflow-auto">{facilities.map((f: any) => <div key={f.code} className="border border-zinc-300 p-1 flex justify-between font-mono text-[11px]"><span>{f.code} {f.name}</span><button onClick={() => deleteData('/api/facilities', f.code)} className="border border-red-600 text-red-600 px-1">DEL</button></div>)}</div>
            </div>
            <div className="col-span-12 lg:col-span-6 bg-white border border-black p-3">
              <div className="font-mono text-[11px] font-bold border-b border-black pb-1 mb-2">EILC INVENTORY_LOCATION_CREATE OX09 {inventoryLocs.length}</div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div><div className="text-[10px] text-zinc-500">CODE</div><input value={ilForm.code} onChange={e => setIlForm({ ...ilForm, code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">NAME</div><input value={ilForm.name} onChange={e => setIlForm({ ...ilForm, name: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">FACILITY_CODE</div><input value={ilForm.facility_code} onChange={e => setIlForm({ ...ilForm, facility_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">LOCATION_TYPE</div><select value={ilForm.location_type} onChange={e => setIlForm({ ...ilForm, location_type: e.target.value })} className="border border-black px-1 py-1 w-full"><option>PRIMARY</option><option>COLD_ZONE</option><option>SHOP_FLOOR</option><option>RETURNS</option><option>QUALITY</option><option>BLOCKED</option><option>RAW_ZONE</option><option>FINISHED_ZONE</option><option>PACK_ZONE</option></select></div>
                <div className="col-span-2"><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={ilForm.description} onChange={e => setIlForm({ ...ilForm, description: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
              </div>
              <button onClick={() => postData('/api/inventory-locations', ilForm, 'INV_LOCATION CREATED')} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE EILC</button>
              <div className="mt-2 space-y-1">{inventoryLocs.map((il: any) => <div key={il.code} className="border border-zinc-300 p-1 flex justify-between font-mono text-[11px]"><span>{il.code} {il.name} {il.location_type}</span><button onClick={() => deleteData('/api/inventory-locations', il.code)} className="border border-red-600 text-red-600 px-1">DEL</button></div>)}</div>
            </div>
          </div>
        )}

        {activeTab === 'procurement' && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-6 bg-white border border-black p-3">
              <div className="font-mono text-[11px] font-bold">EPDC PROCUREMENT_DIVISION_CREATE OX08 {procDivs.length}</div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] mt-2">
                <div><div className="text-[10px] text-zinc-500">CODE</div><input value={pdForm.code} onChange={e => setPdForm({ ...pdForm, code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">NAME</div><input value={pdForm.name} onChange={e => setPdForm({ ...pdForm, name: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">TENANT_CODE</div><input value={pdForm.tenant_code} onChange={e => setPdForm({ ...pdForm, tenant_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={pdForm.description} onChange={e => setPdForm({ ...pdForm, description: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
              </div>
              <button onClick={() => postData('/api/procurement-divisions', pdForm, 'PROC_DIV CREATED')} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE EPDC</button>
              <div className="mt-2 space-y-1">{procDivs.map((pd: any) => <div key={pd.code} className="border border-zinc-300 p-1 flex justify-between font-mono text-[11px]"><span>{pd.code} {pd.name}</span><button onClick={() => deleteData('/api/procurement-divisions', pd.code)} className="border border-red-600 text-red-600 px-1">DEL</button></div>)}</div>
            </div>
            <div className="col-span-12 lg:col-span-6 bg-white border border-black p-3">
              <div className="font-mono text-[11px] font-bold">EBTC BUYER_TEAM_CREATE OME4 {buyerTeams.length}</div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] mt-2">
                <div><div className="text-[10px] text-zinc-500">CODE</div><input value={btForm.code} onChange={e => setBtForm({ ...btForm, code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">NAME</div><input value={btForm.name} onChange={e => setBtForm({ ...btForm, name: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">PROCUREMENT_DIVISION_CODE</div><input value={btForm.procurement_division_code} onChange={e => setBtForm({ ...btForm, procurement_division_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">EMAIL</div><input value={btForm.email} onChange={e => setBtForm({ ...btForm, email: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">PHONE</div><input value={btForm.phone} onChange={e => setBtForm({ ...btForm, phone: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
              </div>
              <button onClick={() => postData('/api/buyer-teams', btForm, 'BUYER_TEAM CREATED')} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE EBTC</button>
              <div className="mt-2 space-y-1">{buyerTeams.map((bt: any) => <div key={bt.code} className="border border-zinc-300 p-1 flex justify-between font-mono text-[11px]"><span>{bt.code} {bt.name}</span><button onClick={() => deleteData('/api/buyer-teams', bt.code)} className="border border-red-600 text-red-600 px-1">DEL</button></div>)}</div>
            </div>
          </div>
        )}

        {activeTab === 'commercial' && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4 bg-white border border-black p-3">
              <div className="font-mono text-[11px] font-bold">ECOC COMMERCIAL_ORG_CREATE {commercialOrgs.length}</div>
              <div className="grid gap-2 font-mono text-[11px] mt-2">
                <div><div className="text-[10px] text-zinc-500">CODE</div><input value={coForm.code} onChange={e => setCoForm({ ...coForm, code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">NAME</div><input value={coForm.name} onChange={e => setCoForm({ ...coForm, name: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">LEGAL_ENTITY_CODE</div><input value={coForm.legal_entity_code} onChange={e => setCoForm({ ...coForm, legal_entity_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">CURRENCY_CODE</div><input value={coForm.currency_code} onChange={e => setCoForm({ ...coForm, currency_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={coForm.description} onChange={e => setCoForm({ ...coForm, description: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
              </div>
              <button onClick={() => postData('/api/commercial-orgs', coForm, 'COMMERCIAL_ORG CREATED')} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE ECOC</button>
              <div className="mt-2 space-y-1">{commercialOrgs.map((co: any) => <div key={co.code} className="border border-zinc-300 p-1 flex justify-between font-mono text-[11px]"><span>{co.code} {co.name}</span><button onClick={() => deleteData('/api/commercial-orgs', co.code)} className="border border-red-600 text-red-600 px-1">DEL</button></div>)}</div>
            </div>
            <div className="col-span-4 bg-white border border-black p-3">
              <div className="font-mono text-[11px] font-bold">ESCC SALES_CHANNEL_CREATE {salesChannels.length}</div>
              <div className="grid gap-2 font-mono text-[11px] mt-2">
                <div><div className="text-[10px] text-zinc-500">CODE</div><input value={scForm.code} onChange={e => setScForm({ ...scForm, code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">NAME</div><input value={scForm.name} onChange={e => setScForm({ ...scForm, name: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={scForm.description} onChange={e => setScForm({ ...scForm, description: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
              </div>
              <button onClick={() => postData('/api/sales-channels', scForm, 'SALES_CHANNEL CREATED')} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE ESCC</button>
              <div className="mt-2 space-y-1">{salesChannels.map((sc: any) => <div key={sc.code} className="border border-zinc-300 p-1 flex justify-between font-mono text-[11px]"><span>{sc.code} {sc.name}</span><button onClick={() => deleteData('/api/sales-channels', sc.code)} className="border border-red-600 text-red-600 px-1">DEL</button></div>)}</div>
            </div>
            <div className="col-span-4 bg-white border border-black p-3">
              <div className="font-mono text-[11px] font-bold">EPLC PRODUCT_LINE_CREATE {productLines.length}</div>
              <div className="grid gap-2 font-mono text-[11px] mt-2">
                <div><div className="text-[10px] text-zinc-500">CODE</div><input value={plForm.code} onChange={e => setPlForm({ ...plForm, code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">NAME</div><input value={plForm.name} onChange={e => setPlForm({ ...plForm, name: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={plForm.description} onChange={e => setPlForm({ ...plForm, description: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
              </div>
              <button onClick={() => postData('/api/product-lines', plForm, 'PRODUCT_LINE CREATED')} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE EPLC</button>
              <div className="mt-2 space-y-1">{productLines.map((pl: any) => <div key={pl.code} className="border border-zinc-300 p-1 flex justify-between font-mono text-[11px]"><span>{pl.code} {pl.name}</span><button onClick={() => deleteData('/api/product-lines', pl.code)} className="border border-red-600 text-red-600 px-1">DEL</button></div>)}</div>
            </div>
          </div>
        )}

        {activeTab === 'profit' && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4 bg-white border border-black p-3">
              <div className="font-mono text-[11px] font-bold">EPUC PROFIT_UNIT_CREATE {profitUnits.length}</div>
              <div className="grid gap-2 font-mono text-[11px] mt-2">
                <div><div className="text-[10px] text-zinc-500">CODE</div><input value={puForm.code} onChange={e => setPuForm({ ...puForm, code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">NAME</div><input value={puForm.name} onChange={e => setPuForm({ ...puForm, name: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">LEGAL_ENTITY_CODE</div><input value={puForm.legal_entity_code} onChange={e => setPuForm({ ...puForm, legal_entity_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">CONTROL_AREA_CODE</div><input value={puForm.control_area_code} onChange={e => setPuForm({ ...puForm, control_area_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={puForm.description} onChange={e => setPuForm({ ...puForm, description: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
              </div>
              <button onClick={() => postData('/api/profit-units', puForm, 'PROFIT_UNIT CREATED')} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE EPUC</button>
              <div className="mt-2 space-y-1">{profitUnits.map((pu: any) => <div key={pu.code} className="border border-zinc-300 p-1 flex justify-between font-mono text-[11px]"><span>{pu.code} {pu.name}</span><button onClick={() => deleteData('/api/profit-units', pu.code)} className="border border-red-600 text-red-600 px-1">DEL</button></div>)}</div>
            </div>
            <div className="col-span-4 bg-white border border-black p-3">
              <div className="font-mono text-[11px] font-bold">ECUC COST_UNIT_CREATE KS01 {costUnits.length}</div>
              <div className="grid gap-2 font-mono text-[11px] mt-2">
                <div><div className="text-[10px] text-zinc-500">CODE</div><input value={cuForm.code} onChange={e => setCuForm({ ...cuForm, code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">NAME</div><input value={cuForm.name} onChange={e => setCuForm({ ...cuForm, name: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                <div><div className="text-[10px] text-zinc-500">LEGAL_ENTITY_CODE</div><input value={cuForm.legal_entity_code} onChange={e => setCuForm({ ...cuForm, legal_entity_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">CONTROL_AREA_CODE</div><input value={cuForm.control_area_code} onChange={e => setCuForm({ ...cuForm, control_area_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">PARENT_CODE</div><input value={cuForm.parent_code} onChange={e => setCuForm({ ...cuForm, parent_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                <div><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={cuForm.description} onChange={e => setCuForm({ ...cuForm, description: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
              </div>
              <button onClick={() => postData('/api/cost-units', cuForm, 'COST_UNIT CREATED')} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE ECUC</button>
              <div className="mt-2 space-y-1">{costUnits.map((cu: any) => <div key={cu.code} className="border border-zinc-300 p-1 flex justify-between font-mono text-[11px]"><span>{cu.code} {cu.name}</span><button onClick={() => deleteData('/api/cost-units', cu.code)} className="border border-red-600 text-red-600 px-1">DEL</button></div>)}</div>
            </div>
            <div className="col-span-4 space-y-3">
              <div className="bg-white border border-black p-2">
                <div className="font-mono text-[11px] font-bold">EBSC BUSINESS_SEGMENT_CREATE {businessSegments.length}</div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] mt-2">
                  <div><div className="text-[10px] text-zinc-500">CODE</div><input value={bsForm.code} onChange={e => setBsForm({ ...bsForm, code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                  <div><div className="text-[10px] text-zinc-500">NAME</div><input value={bsForm.name} onChange={e => setBsForm({ ...bsForm, name: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                </div>
                <button onClick={() => postData('/api/business-segments', bsForm, 'BUSINESS_SEGMENT CREATED')} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE EBSC</button>
                <div className="mt-2 space-y-1">{businessSegments.map((bs: any) => <div key={bs.code} className="border border-zinc-300 p-1 flex justify-between font-mono text-[11px]"><span>{bs.code} {bs.name}</span><button onClick={() => deleteData('/api/business-segments', bs.code)} className="border border-red-600 text-red-600 px-1">DEL</button></div>)}</div>
              </div>
              <div className="bg-white border border-black p-2">
                <div className="font-mono text-[11px] font-bold">EWHC WAREHOUSE_SITE_CREATE {warehouseSites.length}</div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] mt-2">
                  <div><div className="text-[10px] text-zinc-500">CODE</div><input value={whForm.code} onChange={e => setWhForm({ ...whForm, code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                  <div><div className="text-[10px] text-zinc-500">FACILITY_CODE</div><input value={whForm.facility_code} onChange={e => setWhForm({ ...whForm, facility_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                  <div className="col-span-2"><div className="text-[10px] text-zinc-500">NAME</div><input value={whForm.name} onChange={e => setWhForm({ ...whForm, name: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                  <div className="col-span-2"><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={whForm.description} onChange={e => setWhForm({ ...whForm, description: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                </div>
                <button onClick={() => postData('/api/warehouse-sites', whForm, 'WAREHOUSE_SITE CREATED')} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE EWHC</button>
                <div className="mt-2 space-y-1">{warehouseSites.map((wh: any) => <div key={wh.code} className="border border-zinc-300 p-1 flex justify-between font-mono text-[11px]"><span>{wh.code} {wh.name}</span><button onClick={() => deleteData('/api/warehouse-sites', wh.code)} className="border border-red-600 text-red-600 px-1">DEL</button></div>)}</div>
              </div>
              <div className="bg-white border border-black p-2">
                <div className="font-mono text-[11px] font-bold">EDPC DISPATCH_POINT_CREATE {dispatchPoints.length}</div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] mt-2">
                  <div><div className="text-[10px] text-zinc-500">CODE</div><input value={dpForm.code} onChange={e => setDpForm({ ...dpForm, code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                  <div><div className="text-[10px] text-zinc-500">FACILITY_CODE</div><input value={dpForm.facility_code} onChange={e => setDpForm({ ...dpForm, facility_code: e.target.value.toUpperCase() })} className="border border-black px-1 py-1 w-full uppercase" /></div>
                  <div><div className="text-[10px] text-zinc-500">NAME</div><input value={dpForm.name} onChange={e => setDpForm({ ...dpForm, name: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                  <div><div className="text-[10px] text-zinc-500">LOADING_GROUP</div><select value={dpForm.loading_group} onChange={e => setDpForm({ ...dpForm, loading_group: e.target.value })} className="border border-black px-1 py-1 w-full"><option>FORKLIFT</option><option>MANUAL</option><option>CRANE</option><option>CONVEYOR</option></select></div>
                  <div><div className="text-[10px] text-zinc-500">ROUTE</div><input value={dpForm.route} onChange={e => setDpForm({ ...dpForm, route: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                  <div><div className="text-[10px] text-zinc-500">DESCRIPTION</div><input value={dpForm.description} onChange={e => setDpForm({ ...dpForm, description: e.target.value })} className="border border-black px-1 py-1 w-full" /></div>
                </div>
                <button onClick={() => postData('/api/dispatch-points', dpForm, 'DISPATCH_POINT CREATED')} className="mt-2 bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE EDPC</button>
                <div className="mt-2 space-y-1">{dispatchPoints.map((dp: any) => <div key={dp.code} className="border border-zinc-300 p-1 flex justify-between font-mono text-[11px]"><span>{dp.code} {dp.name} {dp.loading_group}</span><button onClick={() => deleteData('/api/dispatch-points', dp.code)} className="border border-red-600 text-red-600 px-1">DEL</button></div>)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModernModuleShell>
  );
}
