"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';

type TabId = 'company' | 'control' | 'facility' | 'procurement' | 'commercial' | 'profit';

export default function EnterpriseStructurePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const companyCode = params.companyCode as string;
  const focusCode = searchParams.get('focus') || searchParams.get('code');
  const [activeTab, setActiveTab] = useState<TabId>('company');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [highlightedForm, setHighlightedForm] = useState<string | null>(null);

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
  const [fiscalCalendars, setFiscalCalendars] = useState<any[]>([]);

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
  const [cpaForm, setCpaForm] = useState({ code: '', name: '', description: '' });

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
        { url: '/api/fiscal-calendars', setter: setFiscalCalendars },
      ];
      const results = await Promise.all(endpoints.map(e => fetch(e.url).then(r => r.json()).catch(() => ({ data: [] }))));
      results.forEach((res, i) => {
        const data = res.data || res.fiscalCalendars || [];
        endpoints[i].setter(Array.isArray(data) ? data : []);
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [companyCode]);

  useEffect(() => {
    if (focusCode) {
      const code = focusCode.toUpperCase();
      setHighlightedForm(code);
      if (['ECGC', 'ELEC', 'FFYC'].includes(code)) setActiveTab('company');
      if (['ECAC', 'FCPC'].includes(code)) setActiveTab('control');
      if (['EFCC', 'EILC', 'EWSC', 'EDPC'].includes(code)) setActiveTab('facility');
      if (['EPDC', 'EBTC'].includes(code)) setActiveTab('procurement');
      if (['ECOC', 'ESCC', 'EPLC'].includes(code)) setActiveTab('commercial');
      if (['EPUC', 'ECUC', 'EBSC', 'EWHC', 'EDPC', 'EDPC'].includes(code)) setActiveTab('profit');
      setTimeout(() => {
        const el = document.getElementById(`form-${code}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-black', 'ring-offset-2');
          setTimeout(() => el.classList.remove('ring-2', 'ring-black', 'ring-offset-2'), 3000);
        }
      }, 500);
    }
  }, [focusCode]);

  const postData = async (url: string, body: any, successMsg: string) => {
    if (url === '/api/legal-entities') {
      const cgExists = companyGroups.some(cg => cg.code === body.company_group_code);
      const fiscalExists = fiscalCalendars.some(fc => fc.code === body.fiscal_calendar_code);
      if (body.company_group_code && !cgExists) {
        setMessage(`❌ COMPANY_GROUP_CODE ${body.company_group_code} not found in DB – create it first via ECGC`);
        return false;
      }
      if (body.fiscal_calendar_code && !fiscalExists) {
        setMessage(`❌ FISCAL_CALENDAR_CODE ${body.fiscal_calendar_code} not found in DB – create it first via FFYC. Valid: ${fiscalCalendars.map(f=>f.code).join(', ') || 'K4, V3, K1'}`);
        return false;
      }
      if (!body.code || !body.name || !body.company_group_code || !body.currency_code || !body.fiscal_calendar_code) {
        setMessage(`❌ Required: CODE, NAME, COMPANY_GROUP_CODE, CURRENCY_CODE, FISCAL_CALENDAR_CODE`);
        return false;
      }
    }
    // Generic required validation
    if (!body.code || !body.name) {
      if (url !== '/api/buyer-teams' && url !== '/api/dispatch-points') {
        // buyer team and dispatch have different required but check code
        if (!body.code) {
          setMessage(`❌ CODE required`);
          return false;
        }
      }
    }
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
    { id: 'company' as TabId, label: 'Company Group & Legal Entity & Fiscal Calendar', code: 'ECGC/ELEC/FFYC', desc: 'ECGC Company Group, ELEC Legal Entity LE-2000, FFYC Fiscal Calendar K4' },
    { id: 'control' as TabId, label: 'Control Area & Credit Policy', code: 'ECOC/ECAC/FCPC', desc: 'ECOC Control Area, FCPC Credit Policy' },
    { id: 'facility' as TabId, label: 'Facility & Inventory & Warehouse & Dispatch', code: 'EFCC/EILC/EWSC/EDPC', desc: 'EFCC Facility FAC-2000, EILC Inventory Loc, EWSC Warehouse WH-2000, EDPC Dispatch' },
    { id: 'procurement' as TabId, label: 'Procurement Division & Buyer Team', code: 'EPDC/EBTC', desc: 'EPDC Proc Division, EBTC Buyer Team' },
    { id: 'commercial' as TabId, label: 'Commercial Org & Sales Channel & Product Line', code: 'ECOC/ESCC/EPLC', desc: 'ECOC Commercial Org SO-2000, ESCC Sales Channel, EPLC Product Line' },
    { id: 'profit' as TabId, label: 'Profit & Cost & Segment', code: 'EPUC/ECUC/EBSC', desc: 'EPUC Profit Unit, ECUC Cost Unit, EBSC Business Segment' },
  ];

  const allCodes = ['ECGC','ELEC','FFYC','EFCC','EILC','ECOC','ESCC','EPLC','EPDC','EBTC','EDPC','EWSC','EPUC','ECUC','EBSC','FCPC','ECAC'];

  if (loading) return <div className="p-6">Loading enterprise structure...</div>;

  const modernContent = (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4">
        <div className="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold mb-2">Quick Code Navigation – Click code to jump to its form – Easy identification</div>
        <div className="flex flex-wrap gap-1.5">
          {allCodes.map(c => (
            <button
              key={c}
              onClick={() => {
                setHighlightedForm(c);
                const el = document.getElementById(`form-${c}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('ring-2','ring-black');
                  setTimeout(()=>el.classList.remove('ring-2','ring-black'),2000);
                }
                if (['ECGC','ELEC','FFYC'].includes(c)) setActiveTab('company');
                if (['ECAC','FCPC','ECOC'].includes(c)) setActiveTab('control');
                if (['EFCC','EILC','EWSC','EDPC'].includes(c)) setActiveTab('facility');
                if (['EPDC','EBTC'].includes(c)) setActiveTab('procurement');
                if (['ECOC','ESCC','EPLC'].includes(c)) setActiveTab('commercial');
                if (['EPUC','ECUC','EBSC'].includes(c)) setActiveTab('profit');
              }}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all ${highlightedForm===c ? 'bg-black text-white border-black' : 'bg-white border-zinc-200 hover:border-black hover:bg-zinc-900 hover:text-white'}`}
            >
              {c}
            </button>
          ))}
        </div>
        {focusCode && <div className="mt-2 text-xs bg-black text-white rounded-full px-3 py-1 inline-block">Focused: {focusCode} – form highlighted</div>}
      </div>

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
            <div id="form-ECGC" className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 scroll-mt-24">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Company Groups <span className="ml-2 text-xs font-mono bg-zinc-100 border rounded-full px-2 py-0.5">OX15 {companyGroups.length}</span></h3>
                <span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">ECGC</span>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[11px] text-zinc-500 font-medium">CODE *</label><input value={cgForm.code} onChange={e => setCgForm({ ...cgForm, code: e.target.value.toUpperCase() })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black uppercase" placeholder="CODE" /></div>
                  <div><label className="text-[11px] text-zinc-500 font-medium">TENANT_CODE *</label><input value={cgForm.tenant_code} onChange={e => setCgForm({ ...cgForm, tenant_code: e.target.value.toUpperCase() })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black uppercase" placeholder="TENANT_CODE" /></div>
                  <div className="col-span-2"><label className="text-[11px] text-zinc-500 font-medium">NAME *</label><input value={cgForm.name} onChange={e => setCgForm({ ...cgForm, name: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="NAME" /></div>
                  <div className="col-span-2"><label className="text-[11px] text-zinc-500 font-medium">DESCRIPTION</label><input value={cgForm.description} onChange={e => setCgForm({ ...cgForm, description: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="DESCRIPTION" /></div>
                </div>
                <button onClick={() => postData('/api/company-groups', cgForm, 'COMPANY_GROUP CREATED')} className="w-full bg-zinc-900 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-black transition-colors">+ Create Company Group ECGC</button>
              </div>
              <div className="mt-5 space-y-2 max-h-[400px] overflow-auto">
                {companyGroups.map((cg: any) => (
                  <div key={cg.code} className="group border border-zinc-200 rounded-xl p-3 hover:border-zinc-900 hover:shadow-sm transition-all bg-zinc-50/50">
                    <div className="flex justify-between items-start"><div><div className="font-medium text-sm">{cg.code}</div><div className="text-xs text-zinc-600">{cg.name}</div></div><button onClick={() => deleteData('/api/company-groups', cg.code)} className="opacity-0 group-hover:opacity-100 text-xs border border-red-200 text-red-600 rounded-full px-2.5 py-1 bg-white hover:bg-red-600 hover:text-white transition-all">Delete</button></div>
                  </div>
                ))}
              </div>
            </div>

            <div id="form-FFYC" className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 scroll-mt-24">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Fiscal Calendars <span className="ml-2 text-xs font-mono bg-zinc-100 border rounded-full px-2 py-0.5">FFYC {fiscalCalendars.length}</span></h3>
                <span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">FFYC</span>
              </div>
              <div className="text-[11px] text-zinc-500 bg-zinc-50 rounded-xl p-3 mb-3">FFYC – Fiscal Calendar – K4 April-March, V3 Calendar Year – used by ELEC – must exist before Legal Entity</div>
              <div className="grid grid-cols-2 gap-2">
                {fiscalCalendars.map((fc:any)=>(
                  <div key={fc.code} className="border border-zinc-200 rounded-xl p-2 bg-zinc-50/50">
                    <div className="font-mono font-bold text-xs">{fc.code}</div>
                    <div className="text-[11px] text-zinc-600">{fc.name}</div>
                  </div>
                ))}
                {fiscalCalendars.length===0 && <div className="col-span-2 text-xs text-zinc-500 border border-dashed rounded-xl p-3 text-center">No fiscal calendars – create K4, V3, K1 via POST /api/fiscal-calendars or via Posting Period page FFYC section</div>}
              </div>
              <a href={`/${companyCode}/fico/posting-period?focus=FFYC`} className="mt-3 inline-flex text-xs bg-zinc-900 text-white rounded-full px-4 py-2 hover:bg-black">Manage FFYC in Posting Period page ↗</a>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7 space-y-4">
            <div id="form-ELEC" className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 scroll-mt-24">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold">Legal Entities <span className="ml-2 text-xs font-mono bg-zinc-100 border rounded-full px-2 py-0.5">OX02 {legalEntities.length}</span></h3>
                <span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">ELEC</span>
              </div>
              <div className="text-[11px] font-mono bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 mb-4 text-zinc-600">{`{ "code": "LE-2000", "name": "Indus Spice Labs", "company_group_code": "ISL", "currency_code": "INR", "fiscal_calendar_code": "K4" }`}</div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-[11px] text-zinc-500 font-medium">CODE *</label><input value={leForm.code} onChange={e => setLeForm({ ...leForm, code: e.target.value.toUpperCase() })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-black focus:outline-none" placeholder="CODE" /></div>
                <div><label className="text-[11px] text-zinc-500 font-medium">NAME *</label><input value={leForm.name} onChange={e => setLeForm({ ...leForm, name: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:outline-none" placeholder="NAME" /></div>
                <DbAutocomplete label="COMPANY_GROUP_CODE *" value={leForm.company_group_code} onChange={v => setLeForm({ ...leForm, company_group_code: v })} apiUrl="/api/company-groups" dataKey="data" codeField="code" nameField="name" placeholder="COMPANY_GROUP_CODE" required createUrl={`/${companyCode}/foundation/enterprise-structure?focus=ECGC`} createCode="ECGC" />
                <DbAutocomplete label="CURRENCY_CODE *" value={leForm.currency_code} onChange={v => setLeForm({ ...leForm, currency_code: v })} apiUrl="/api/currencies" dataKey="data" codeField="code" nameField="name" placeholder="CURRENCY_CODE" required createUrl={`/${companyCode}/fico/currencies`} createCode="FCYC" />
                <div><label className="text-[11px] text-zinc-500 font-medium">COUNTRY *</label><input value={leForm.country} onChange={e => setLeForm({ ...leForm, country: e.target.value.toUpperCase() })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm uppercase" placeholder="COUNTRY" /></div>
                <div><label className="text-[11px] text-zinc-500 font-medium">CITY</label><input value={leForm.city} onChange={e => setLeForm({ ...leForm, city: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm" placeholder="CITY" /></div>
                <div><label className="text-[11px] text-zinc-500 font-medium">TAX_ID</label><input value={leForm.tax_id} onChange={e => setLeForm({ ...leForm, tax_id: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm" placeholder="TAX_ID" /></div>
                <div><label className="text-[11px] text-zinc-500 font-medium">GST_NUMBER</label><input value={leForm.gst_number} onChange={e => setLeForm({ ...leForm, gst_number: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm" placeholder="GST_NUMBER" /></div>
                <DbAutocomplete label="FISCAL_CALENDAR_CODE *" value={leForm.fiscal_calendar_code} onChange={v => setLeForm({ ...leForm, fiscal_calendar_code: v })} apiUrl="/api/fiscal-calendars" dataKey="fiscalCalendars" codeField="code" nameField="name" placeholder="FISCAL_CALENDAR_CODE" required createUrl={`/${companyCode}/fico/posting-period?focus=FFYC`} createCode="FFYC" />
                <div className="col-span-3"><label className="text-[11px] text-zinc-500 font-medium">DESCRIPTION</label><input value={leForm.description} onChange={e => setLeForm({ ...leForm, description: e.target.value })} className="mt-1 w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm" placeholder="DESCRIPTION" /></div>
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

      {activeTab === 'control' && (
        <div className="grid grid-cols-12 gap-6">
          <div id="form-ECOC" className="col-span-6 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 scroll-mt-24">
            <div className="flex justify-between mb-4"><h3 className="font-semibold">Control Areas – ECOC/ECAC {controlAreas.length}</h3><span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">ECOC</span></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] text-zinc-500">CODE *</label><input value={caForm.code} onChange={e=>setCaForm({...caForm,code:e.target.value.toUpperCase()})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm uppercase" placeholder="CODE" /></div>
              <DbAutocomplete label="CURRENCY_CODE *" value={caForm.currency_code} onChange={v=>setCaForm({...caForm,currency_code:v})} apiUrl="/api/currencies" placeholder="CURRENCY_CODE" required createUrl={`/${companyCode}/fico/currencies`} createCode="FCYC" />
              <div className="col-span-2"><label className="text-[11px] text-zinc-500">NAME *</label><input value={caForm.name} onChange={e=>setCaForm({...caForm,name:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" placeholder="NAME" /></div>
            </div>
            <button onClick={()=>postData('/api/control-areas',caForm,'CONTROL_AREA CREATED')} className="mt-3 w-full bg-zinc-900 text-white rounded-xl py-2.5 text-sm">+ Create Control Area ECOC</button>
            <div className="mt-4 space-y-2 max-h-[300px] overflow-auto">{controlAreas.map((ca:any)=><div key={ca.code} className="border rounded-xl p-2 flex justify-between"><span>{ca.code} – {ca.name}</span><button onClick={()=>deleteData('/api/control-areas',ca.code)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 bg-white">Del</button></div>)}</div>
          </div>
          <div id="form-FCPC" className="col-span-6 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 scroll-mt-24">
            <div className="flex justify-between mb-4"><h3 className="font-semibold">Credit Policy Areas – FCPC {creditPolicyAreas.length}</h3><span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">FCPC</span></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] text-zinc-500">CODE *</label><input value={cpaForm.code} onChange={e=>setCpaForm({...cpaForm,code:e.target.value.toUpperCase()})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm uppercase" placeholder="CODE" /></div>
              <div><label className="text-[11px] text-zinc-500">NAME *</label><input value={cpaForm.name} onChange={e=>setCpaForm({...cpaForm,name:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" placeholder="NAME" /></div>
            </div>
            <button onClick={()=>postData('/api/credit-policy-areas',cpaForm,'CREDIT_POLICY CREATED')} className="mt-3 w-full bg-zinc-900 text-white rounded-xl py-2.5 text-sm">+ Create FCPC</button>
            <div className="mt-4 space-y-2">{creditPolicyAreas.map((c:any)=><div key={c.code} className="border rounded-xl p-2 flex justify-between"><span>{c.code}</span><button onClick={()=>deleteData('/api/credit-policy-areas',c.code)} className="text-xs border rounded-full px-2">Del</button></div>)}</div>
          </div>
        </div>
      )}

      {activeTab === 'facility' && (
        <div className="grid grid-cols-12 gap-6">
          <div id="form-EFCC" className="col-span-6 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 scroll-mt-24">
            <div className="flex justify-between mb-4"><h3 className="font-semibold">Facilities – EFCC {facilities.length}</h3><span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">EFCC</span></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] text-zinc-500">CODE *</label><input value={facForm.code} onChange={e=>setFacForm({...facForm,code:e.target.value.toUpperCase()})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm uppercase" placeholder="CODE" /></div>
              <DbAutocomplete label="LEGAL_ENTITY_CODE *" value={facForm.legal_entity_code} onChange={v=>setFacForm({...facForm,legal_entity_code:v})} apiUrl="/api/legal-entities" placeholder="LEGAL_ENTITY_CODE" required createUrl={`/${companyCode}/foundation/enterprise-structure?focus=ELEC`} createCode="ELEC" />
              <div className="col-span-2"><label className="text-[11px] text-zinc-500">NAME *</label><input value={facForm.name} onChange={e=>setFacForm({...facForm,name:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" placeholder="NAME" /></div>
            </div>
            <button onClick={()=>postData('/api/facilities',facForm,'FACILITY CREATED')} className="mt-3 w-full bg-zinc-900 text-white rounded-xl py-2.5 text-sm">+ Create Facility EFCC FAC-2000</button>
            <div className="mt-4 space-y-2 max-h-[300px] overflow-auto">{facilities.map((f:any)=><div key={f.code} className="border rounded-xl p-2 flex justify-between"><span>{f.code} – {f.name}</span><button onClick={()=>deleteData('/api/facilities',f.code)} className="text-xs border rounded-full px-2">Del</button></div>)}</div>
          </div>
          <div className="col-span-6 space-y-4">
            <div id="form-EILC" className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 scroll-mt-24">
              <div className="flex justify-between mb-4"><h3 className="font-semibold">Inventory Locs – EILC {inventoryLocs.length}</h3><span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">EILC</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-zinc-500">CODE *</label><input value={ilForm.code} onChange={e=>setIlForm({...ilForm,code:e.target.value.toUpperCase()})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm uppercase" placeholder="CODE" /></div>
                <DbAutocomplete label="FACILITY_CODE *" value={ilForm.facility_code} onChange={v=>setIlForm({...ilForm,facility_code:v})} apiUrl="/api/facilities" placeholder="FACILITY_CODE" required createUrl={`/${companyCode}/foundation/enterprise-structure?focus=EFCC`} createCode="EFCC" />
                <div className="col-span-2"><label className="text-[11px] text-zinc-500">NAME *</label><input value={ilForm.name} onChange={e=>setIlForm({...ilForm,name:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" placeholder="NAME" /></div>
              </div>
              <button onClick={()=>postData('/api/inventory-locations',ilForm,'INVENTORY_LOC CREATED')} className="mt-3 w-full bg-zinc-900 text-white rounded-xl py-2.5 text-sm">+ Create EILC</button>
              <div className="mt-4 space-y-2 max-h-[200px] overflow-auto">{inventoryLocs.map((il:any)=><div key={il.code} className="border rounded-xl p-2 flex justify-between text-xs"><span>{il.code} – {il.facility_id}</span><button onClick={()=>deleteData('/api/inventory-locations',il.code)} className="border rounded-full px-2">Del</button></div>)}</div>
            </div>
            <div id="form-EWSC" className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 scroll-mt-24">
              <div className="flex justify-between mb-4"><h3 className="font-semibold">Warehouse Sites – EWSC {warehouseSites.length}</h3><span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">EWSC</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-zinc-500">CODE *</label><input value={whForm.code} onChange={e=>setWhForm({...whForm,code:e.target.value.toUpperCase()})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm uppercase" placeholder="CODE" /></div>
                <DbAutocomplete label="FACILITY_CODE *" value={whForm.facility_code} onChange={v=>setWhForm({...whForm,facility_code:v})} apiUrl="/api/facilities" placeholder="FACILITY_CODE" required createCode="EFCC" />
                <div className="col-span-2"><label className="text-[11px] text-zinc-500">NAME *</label><input value={whForm.name} onChange={e=>setWhForm({...whForm,name:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" placeholder="NAME" /></div>
              </div>
              <button onClick={()=>postData('/api/warehouse-sites',whForm,'WAREHOUSE CREATED')} className="mt-3 w-full bg-zinc-900 text-white rounded-xl py-2.5 text-sm">+ Create EWSC WH-2000</button>
              <div className="mt-4 space-y-2">{warehouseSites.map((w:any)=><div key={w.code} className="border rounded-xl p-2 flex justify-between text-xs"><span>{w.code}</span><button onClick={()=>deleteData('/api/warehouse-sites',w.code)} className="border rounded-full px-2">Del</button></div>)}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'procurement' && (
        <div className="grid grid-cols-12 gap-6">
          <div id="form-EPDC" className="col-span-6 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 scroll-mt-24">
            <div className="flex justify-between mb-4"><h3 className="font-semibold">Proc Divisions – EPDC {procDivs.length}</h3><span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">EPDC</span></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] text-zinc-500">CODE *</label><input value={pdForm.code} onChange={e=>setPdForm({...pdForm,code:e.target.value.toUpperCase()})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm uppercase" placeholder="CODE" /></div>
              <div><label className="text-[11px] text-zinc-500">NAME *</label><input value={pdForm.name} onChange={e=>setPdForm({...pdForm,name:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" placeholder="NAME" /></div>
            </div>
            <button onClick={()=>postData('/api/procurement-divisions',pdForm,'PROC_DIV CREATED')} className="mt-3 w-full bg-zinc-900 text-white rounded-xl py-2.5 text-sm">+ Create EPDC</button>
            <div className="mt-4 space-y-2">{procDivs.map((p:any)=><div key={p.code} className="border rounded-xl p-2 flex justify-between"><span>{p.code}</span><button onClick={()=>deleteData('/api/procurement-divisions',p.code)} className="text-xs border rounded-full px-2">Del</button></div>)}</div>
          </div>
          <div id="form-EBTC" className="col-span-6 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 scroll-mt-24">
            <div className="flex justify-between mb-4"><h3 className="font-semibold">Buyer Teams – EBTC {buyerTeams.length}</h3><span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">EBTC</span></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] text-zinc-500">CODE *</label><input value={btForm.code} onChange={e=>setBtForm({...btForm,code:e.target.value.toUpperCase()})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm uppercase" placeholder="CODE" /></div>
              <DbAutocomplete label="PROCUREMENT_DIVISION_CODE *" value={btForm.procurement_division_code} onChange={v=>setBtForm({...btForm,procurement_division_code:v})} apiUrl="/api/procurement-divisions" placeholder="PROCUREMENT_DIVISION_CODE" required createCode="EPDC" />
              <div className="col-span-2"><label className="text-[11px] text-zinc-500">NAME *</label><input value={btForm.name} onChange={e=>setBtForm({...btForm,name:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" placeholder="NAME" /></div>
            </div>
            <button onClick={()=>postData('/api/buyer-teams',btForm,'BUYER_TEAM CREATED')} className="mt-3 w-full bg-zinc-900 text-white rounded-xl py-2.5 text-sm">+ Create EBTC</button>
            <div className="mt-4 space-y-2">{buyerTeams.map((b:any)=><div key={b.code} className="border rounded-xl p-2 flex justify-between"><span>{b.code}</span><button onClick={()=>deleteData('/api/buyer-teams',b.code)} className="text-xs border rounded-full px-2">Del</button></div>)}</div>
          </div>
        </div>
      )}

      {activeTab === 'commercial' && (
        <div className="grid grid-cols-12 gap-6">
          <div id="form-ECOC" className="col-span-6 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 scroll-mt-24">
            <div className="flex justify-between mb-4"><h3 className="font-semibold">Commercial Orgs – ECOC {commercialOrgs.length}</h3><span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">ECOC</span></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] text-zinc-500">CODE *</label><input value={coForm.code} onChange={e=>setCoForm({...coForm,code:e.target.value.toUpperCase()})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm uppercase" placeholder="CODE" /></div>
              <DbAutocomplete label="LEGAL_ENTITY_CODE *" value={coForm.legal_entity_code} onChange={v=>setCoForm({...coForm,legal_entity_code:v})} apiUrl="/api/legal-entities" placeholder="LEGAL_ENTITY_CODE" required createCode="ELEC" />
              <div className="col-span-2"><label className="text-[11px] text-zinc-500">NAME *</label><input value={coForm.name} onChange={e=>setCoForm({...coForm,name:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" placeholder="NAME" /></div>
            </div>
            <button onClick={()=>postData('/api/commercial-orgs',coForm,'COMMERCIAL_ORG CREATED')} className="mt-3 w-full bg-zinc-900 text-white rounded-xl py-2.5 text-sm">+ Create ECOC SO-2000</button>
            <div className="mt-4 space-y-2">{commercialOrgs.map((c:any)=><div key={c.code} className="border rounded-xl p-2 flex justify-between"><span>{c.code}</span><button onClick={()=>deleteData('/api/commercial-orgs',c.code)} className="text-xs border rounded-full px-2">Del</button></div>)}</div>
          </div>
          <div className="col-span-6 space-y-4">
            <div id="form-ESCC" className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 scroll-mt-24">
              <div className="flex justify-between mb-4"><h3 className="font-semibold">Sales Channels – ESCC {salesChannels.length}</h3><span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">ESCC</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-zinc-500">CODE *</label><input value={scForm.code} onChange={e=>setScForm({...scForm,code:e.target.value.toUpperCase()})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm uppercase" placeholder="CODE" /></div>
                <div><label className="text-[11px] text-zinc-500">NAME *</label><input value={scForm.name} onChange={e=>setScForm({...scForm,name:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" placeholder="NAME" /></div>
              </div>
              <button onClick={()=>postData('/api/sales-channels',scForm,'SALES_CHANNEL CREATED')} className="mt-3 w-full bg-zinc-900 text-white rounded-xl py-2.5 text-sm">+ Create ESCC</button>
              <div className="mt-4 space-y-2">{salesChannels.map((s:any)=><div key={s.code} className="border rounded-xl p-2 flex justify-between"><span>{s.code}</span><button onClick={()=>deleteData('/api/sales-channels',s.code)} className="text-xs border rounded-full px-2">Del</button></div>)}</div>
            </div>
            <div id="form-EPLC" className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 scroll-mt-24">
              <div className="flex justify-between mb-4"><h3 className="font-semibold">Product Lines – EPLC {productLines.length}</h3><span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">EPLC</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-zinc-500">CODE *</label><input value={plForm.code} onChange={e=>setPlForm({...plForm,code:e.target.value.toUpperCase()})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm uppercase" placeholder="CODE" /></div>
                <div><label className="text-[11px] text-zinc-500">NAME *</label><input value={plForm.name} onChange={e=>setPlForm({...plForm,name:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" placeholder="NAME" /></div>
              </div>
              <button onClick={()=>postData('/api/product-lines',plForm,'PRODUCT_LINE CREATED')} className="mt-3 w-full bg-zinc-900 text-white rounded-xl py-2.5 text-sm">+ Create EPLC</button>
              <div className="mt-4 space-y-2">{productLines.map((p:any)=><div key={p.code} className="border rounded-xl p-2 flex justify-between"><span>{p.code}</span><button onClick={()=>deleteData('/api/product-lines',p.code)} className="text-xs border rounded-full px-2">Del</button></div>)}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profit' && (
        <div className="grid grid-cols-12 gap-6">
          <div id="form-EPUC" className="col-span-6 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 scroll-mt-24">
            <div className="flex justify-between mb-4"><h3 className="font-semibold">Profit Units – EPUC {profitUnits.length}</h3><span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">EPUC</span></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] text-zinc-500">CODE *</label><input value={puForm.code} onChange={e=>setPuForm({...puForm,code:e.target.value.toUpperCase()})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm uppercase" placeholder="CODE" /></div>
              <DbAutocomplete label="LEGAL_ENTITY_CODE *" value={puForm.legal_entity_code} onChange={v=>setPuForm({...puForm,legal_entity_code:v})} apiUrl="/api/legal-entities" placeholder="LEGAL_ENTITY_CODE" required createCode="ELEC" />
              <DbAutocomplete label="CONTROL_AREA_CODE *" value={puForm.control_area_code} onChange={v=>setPuForm({...puForm,control_area_code:v})} apiUrl="/api/control-areas" placeholder="CONTROL_AREA_CODE" required createCode="ECOC" />
              <div><label className="text-[11px] text-zinc-500">NAME *</label><input value={puForm.name} onChange={e=>setPuForm({...puForm,name:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" placeholder="NAME" /></div>
            </div>
            <button onClick={()=>postData('/api/profit-units',puForm,'PROFIT_UNIT CREATED')} className="mt-3 w-full bg-zinc-900 text-white rounded-xl py-2.5 text-sm">+ Create EPUC</button>
            <div className="mt-4 space-y-2">{profitUnits.map((p:any)=><div key={p.code} className="border rounded-xl p-2 flex justify-between"><span>{p.code}</span><button onClick={()=>deleteData('/api/profit-units',p.code)} className="text-xs border rounded-full px-2">Del</button></div>)}</div>
          </div>
          <div className="col-span-6 space-y-4">
            <div id="form-ECUC" className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 scroll-mt-24">
              <div className="flex justify-between mb-4"><h3 className="font-semibold">Cost Units – ECUC {costUnits.length}</h3><span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">ECUC</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-zinc-500">CODE *</label><input value={cuForm.code} onChange={e=>setCuForm({...cuForm,code:e.target.value.toUpperCase()})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm uppercase" placeholder="CODE" /></div>
                <DbAutocomplete label="CONTROL_AREA_CODE *" value={cuForm.control_area_code} onChange={v=>setCuForm({...cuForm,control_area_code:v})} apiUrl="/api/control-areas" placeholder="CONTROL_AREA_CODE" required createCode="ECOC" />
                <div className="col-span-2"><label className="text-[11px] text-zinc-500">NAME *</label><input value={cuForm.name} onChange={e=>setCuForm({...cuForm,name:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" placeholder="NAME" /></div>
              </div>
              <button onClick={()=>postData('/api/cost-units',cuForm,'COST_UNIT CREATED')} className="mt-3 w-full bg-zinc-900 text-white rounded-xl py-2.5 text-sm">+ Create ECUC</button>
              <div className="mt-4 space-y-2">{costUnits.map((c:any)=><div key={c.code} className="border rounded-xl p-2 flex justify-between"><span>{c.code}</span><button onClick={()=>deleteData('/api/cost-units',c.code)} className="text-xs border rounded-full px-2">Del</button></div>)}</div>
            </div>
            <div id="form-EBSC" className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 scroll-mt-24">
              <div className="flex justify-between mb-4"><h3 className="font-semibold">Business Segments – EBSC {businessSegments.length}</h3><span className="text-[10px] font-mono bg-black text-white rounded-full px-2 py-0.5">EBSC</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-zinc-500">CODE *</label><input value={bsForm.code} onChange={e=>setBsForm({...bsForm,code:e.target.value.toUpperCase()})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm uppercase" placeholder="CODE" /></div>
                <div><label className="text-[11px] text-zinc-500">NAME *</label><input value={bsForm.name} onChange={e=>setBsForm({...bsForm,name:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" placeholder="NAME" /></div>
              </div>
              <button onClick={()=>postData('/api/business-segments',bsForm,'SEGMENT CREATED')} className="mt-3 w-full bg-zinc-900 text-white rounded-xl py-2.5 text-sm">+ Create EBSC</button>
              <div className="mt-4 space-y-2">{businessSegments.map((b:any)=><div key={b.code} className="border rounded-xl p-2 flex justify-between"><span>{b.code}</span><button onClick={()=>deleteData('/api/business-segments',b.code)} className="text-xs border rounded-full px-2">Del</button></div>)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      <div className="flex gap-1 flex-wrap">
        {allCodes.map(c=><button key={c} onClick={()=>{setHighlightedForm(c); document.getElementById(`form-${c}`)?.scrollIntoView({behavior:'smooth'});}} className={`border-2 border-black px-2 py-0.5 ${highlightedForm===c?'bg-black text-white':'bg-white'}`}>{c}</button>)}
      </div>
      <div className="bg-white border-2 border-black p-2">
        <div className="font-bold">ENTERPRISE STRUCTURE – ALL CODES – DB VALIDATION – AUTOCOMPLETE ONLY</div>
        <div className="text-[9px]">FFYC fiscal calendars {fiscalCalendars.length}: {fiscalCalendars.map(f=>f.code).join(', ')} – ELEC requires valid FISCAL_CALENDAR_CODE from DB only – autocomplete prevents K6 invalid</div>
        <div className="text-[9px]">ECGC {companyGroups.length} – ELEC {legalEntities.length} – EFCC {facilities.length} – EILC {inventoryLocs.length} – ECOC {commercialOrgs.length} – ESCC {salesChannels.length} – EPLC {productLines.length} – EPDC {procDivs.length} – EBTC {buyerTeams.length} – EDPC {dispatchPoints.length} – EWSC {warehouseSites.length} – EPUC {profitUnits.length} – ECUC {costUnits.length}</div>
      </div>
      <div className="bg-white border-2 border-black p-2">
        <div className="font-bold">ELEC LEGAL_ENTITY_CREATE – VALIDATION – COMPANY_GROUP_CODE must exist in ECGC, FISCAL_CALENDAR_CODE must exist in FFYC, CURRENCY_CODE must exist in FCYC</div>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <div><div className="text-[9px]">CODE *</div><input value={leForm.code} onChange={e=>setLeForm({...leForm,code:e.target.value.toUpperCase()})} className="border-2 border-black px-1 py-1 w-full uppercase" placeholder="CODE" /></div>
          <div><div className="text-[9px]">COMPANY_GROUP_CODE *</div><input value={leForm.company_group_code} onChange={e=>setLeForm({...leForm,company_group_code:e.target.value.toUpperCase()})} className="border-2 border-black px-1 py-1 w-full uppercase" placeholder="COMPANY_GROUP_CODE" /></div>
          <div><div className="text-[9px]">FISCAL_CALENDAR_CODE *</div><input value={leForm.fiscal_calendar_code} onChange={e=>setLeForm({...leForm,fiscal_calendar_code:e.target.value.toUpperCase()})} className="border-2 border-black px-1 py-1 w-full uppercase" placeholder="FISCAL_CALENDAR_CODE" /></div>
        </div>
        <div className="text-[9px] mt-1">DB Validation active – K6 invalid will be rejected – use autocomplete from DB only – create FFYC first via posting-period?focus=FFYC</div>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Enterprise Structure" subtitle={`${companyGroups.length} COMPANY_GROUPS ${legalEntities.length} LEGAL_ENTITIES ${fiscalCalendars.length} FISCAL_CALENDARS ${facilities.length} FACILITIES`} code="ELEC" module="FOUNDATION" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
