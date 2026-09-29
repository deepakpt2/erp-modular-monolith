"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';

type FocusCode = 'OBBO' | 'OB52' | 'FFYC' | 'FEXC' | 'FNRC' | 'FTGC' | 'FCYC' | 'FCOA' | 'FGLC' | 'FTXC' | 'ALL';

export default function PostingPeriodPage(){
  const params = useParams();
  const searchParams = useSearchParams();
  const companyCode = params.companyCode as string;
  const focusParam = (searchParams.get('focus') || searchParams.get('code') || 'ALL').toUpperCase() as FocusCode;
  const [activeFocus, setActiveFocus] = useState<FocusCode>(focusParam as FocusCode);
  const [highlighted, setHighlighted] = useState<string | null>(focusParam !== 'ALL' ? focusParam : null);

  const [data,setData]=useState<any>(null);
  const [fiscalData,setFiscalData]=useState<any>(null);
  const [exchangeData,setExchangeData]=useState<any>(null);
  const [numberRangeData,setNumberRangeData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState<string|null>(null);
  const [form,setForm]=useState({code:'',name:''});
  const [fiscalForm,setFiscalForm]=useState({code:'',name:'',description:''});
  const [exchangeForm,setExchangeForm]=useState({from_currency:'INR',to_currency:'USD',rate:'',valid_from:''});
  const [showForm,setShowForm]=useState(false);

  async function load(){
    setLoading(true);
    try{
      const [ppRes, fiscalRes, exchRes, nrRes] = await Promise.all([
        fetch('/api/posting-period-variants').then(r=>r.json()).catch(()=>({})),
        fetch('/api/fiscal-calendars').then(r=>r.json()).catch(()=>({})),
        fetch('/api/exchange-rates').then(r=>r.json()).catch(()=>({})),
        fetch('/api/number-ranges').then(r=>r.json()).catch(()=>({})),
      ]);
      setData(ppRes);
      setFiscalData(fiscalRes);
      setExchangeData(exchRes);
      setNumberRangeData(nrRes);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  useEffect(()=>{
    if (focusParam && focusParam !== 'ALL') {
      setActiveFocus(focusParam as FocusCode);
      setHighlighted(focusParam);
      setTimeout(()=>{
        const el = document.getElementById(`form-${focusParam}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2','ring-black','ring-offset-2');
          setTimeout(()=>el.classList.remove('ring-2','ring-black','ring-offset-2'), 3000);
        }
      }, 600);
    }
  }, [focusParam]);

  const handleCreate = async () => {
    if(!(form as any).code||!(form as any).name){ setMsg('CODE and NAME required'); return; }
    const res = await fetch('/api/posting-period-variants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ Posting Period Variant ${res.variant.code} created – OBBO/FPPC`); setShowForm(false); setForm({code:'',name:''}); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  const handleCreateFiscal = async () => {
    if(!fiscalForm.code || !fiscalForm.name){ setMsg('FISCAL_CALENDAR_CODE and NAME required – FFYC'); return; }
    const res = await fetch('/api/fiscal-calendars',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fiscalForm)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ Fiscal Calendar ${res.fiscalCalendar.code} created – FFYC – now usable in ELEC`); setFiscalForm({code:'',name:'',description:''}); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  const handleCreateExchange = async () => {
    if(!exchangeForm.from_currency || !exchangeForm.to_currency || !exchangeForm.rate){ setMsg('FROM_CURRENCY, TO_CURRENCY, RATE required – FEXC'); return; }
    const res = await fetch('/api/exchange-rates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...exchangeForm, rate: parseFloat(exchangeForm.rate)})}).then(r=>r.json());
    if(res.success){ setMsg(`✅ Exchange Rate ${exchangeForm.from_currency}→${exchangeForm.to_currency} created – FEXC`); setExchangeForm({from_currency:'INR',to_currency:'USD',rate:'',valid_from:''}); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  const handleDelete = async (code:string) => {
    if(!confirm(`Delete posting period variant ${code}?`)) return;
    const res = await fetch(`/api/posting-period-variants?code=${code}`,{method:'DELETE'}).then(r=>r.json());
    setMsg(res.success?`✅ ${res.message}`:`❌ ${res.error}`);
    if(res.success) load();
  };

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;
  const variants = data?.postingPeriodVariants||[];
  const periods = data?.postingPeriods||[];
  const fiscalCalendars = fiscalData?.fiscalCalendars||fiscalData?.data||[];
  const exchangeRates = exchangeData?.data||exchangeData?.rates||[];
  const numberRanges = numberRangeData?.data||numberRangeData?.ranges||[];

  const codes = [
    { code: 'FFYC', label: 'Fiscal Calendar', desc: 'K4 April-March, V3 Calendar Year – used by ELEC – must exist before LE-2000', count: fiscalCalendars.length, api: '/api/fiscal-calendars' },
    { code: 'OBBO', label: 'Posting Period Variant', desc: 'FPPC – Define variant', count: variants.length, api: '/api/posting-period-variants' },
    { code: 'OB52', label: 'Posting Periods Open/Close', desc: 'FPPE – Open/close periods', count: periods.length, api: '/api/posting-period-variants' },
    { code: 'FEXC', label: 'Exchange Rates', desc: 'Currency conversion INR→USD etc', count: exchangeRates.length, api: '/api/exchange-rates' },
    { code: 'FNRC', label: 'Number Ranges', desc: 'FBN1 document numbers', count: numberRanges.length, api: '/api/number-ranges' },
    { code: 'FCYC', label: 'Currencies', desc: 'OY03 – INR default', count: 0, api: '/api/currencies', link: `/${companyCode}/fico/currencies` },
    { code: 'FCOA', label: 'Chart of Accounts', desc: 'OB13', count: 0, api: '/api/chart-of-accounts', link: `/${companyCode}/fico/chart-of-accounts` },
    { code: 'FGLC', label: 'G/L Accounts', desc: 'FS00', count: 0, api: '/api/gl-accounts', link: `/${companyCode}/fico/gl-accounts` },
    { code: 'FTXC', label: 'Tax Codes', desc: 'FTXP', count: 0, api: '/api/tax-codes', link: `/${companyCode}/fico/tax-codes` },
  ];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">FINANCIAL CONFIG – FFYC FEXC OBBO OB52 FNRC – ALL CODES MUST HAVE FORM</div>
        <div className="flex flex-wrap gap-1 mb-2">
          {codes.map(c=><button key={c.code} onClick={()=>{setActiveFocus(c.code as FocusCode); setHighlighted(c.code); document.getElementById(`form-${c.code}`)?.scrollIntoView({behavior:'smooth'});}} className={`border-2 border-black px-2 py-0.5 ${highlighted===c.code?'bg-black text-white':'bg-white'}`}>{c.code} {c.count}</button>)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><div className="text-[9px]">FFYC CODE *</div><input value={fiscalForm.code} onChange={e=>setFiscalForm({...fiscalForm,code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="FISCAL_CALENDAR_CODE" /></div>
          <div><div className="text-[9px]">FFYC NAME *</div><input value={fiscalForm.name} onChange={e=>setFiscalForm({...fiscalForm,name:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="NAME" /></div>
        </div>
        <button onClick={handleCreateFiscal} className="mt-2 bg-black text-white px-3 py-1 w-full">CREATE FFYC</button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div><div className="text-[9px]">CODE *</div><input value={(form as any).code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="CODE" /></div>
          <div><div className="text-[9px]">NAME *</div><input value={(form as any).name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="NAME" /></div>
        </div>
        <button onClick={handleCreate} className="mt-2 bg-black text-white px-3 py-1 w-full">CREATE OBBO/FPPC</button>
      </div>
      <div className="bg-white border-2 border-black p-2">
        <div className="font-bold">FISCAL CALENDARS FFYC {fiscalCalendars.length} – API POST /api/fiscal-calendars</div>
        {fiscalCalendars.map((fc:any)=><div key={fc.code} className="border border-black p-1 mt-1">{fc.code} – {fc.name}</div>)}
      </div>
      <div className="bg-white border-2 border-black p-2">
        <div className="font-bold">VARIANTS OBBO {variants.length}</div>
        {variants.map((v:any)=>(<div key={v.code} className="border border-black p-1 mt-1 flex justify-between"><span>{v.code} – {v.name}</span><button onClick={()=>handleDelete(v.code)} className="border border-black px-1 text-red-600">DEL</button></div>))}
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}

      {/* Quick code navigation – easy identification */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold">Financial Codes – Click to jump to form – Easy identification</div>
          <div className="text-[10px] text-zinc-400">All codes must have a form – user must find specific form for specific code</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {codes.map(c => (
            <button
              key={c.code}
              onClick={() => {
                setActiveFocus(c.code as FocusCode);
                setHighlighted(c.code);
                const el = document.getElementById(`form-${c.code}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('ring-2','ring-black','ring-offset-2');
                  setTimeout(()=>el.classList.remove('ring-2','ring-black','ring-offset-2'), 3000);
                }
              }}
              className={`group flex items-center gap-2 rounded-full px-4 py-2 border text-xs transition-all ${highlighted===c.code || activeFocus===c.code ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' : 'bg-white border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50'}`}
            >
              <span className="font-mono font-bold">{c.code}</span>
              <span className="hidden sm:inline text-[11px] opacity-70">{c.label}</span>
              <span className={`text-[9px] rounded-full px-1.5 py-0.5 ${highlighted===c.code ? 'bg-white text-black' : 'bg-zinc-100 text-zinc-600'}`}>{c.count}</span>
            </button>
          ))}
        </div>
        {highlighted && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="bg-black text-white rounded-full px-3 py-1">Focused: {highlighted} – {codes.find(c=>c.code===highlighted)?.label}</span>
            <span className="text-zinc-500">{codes.find(c=>c.code===highlighted)?.desc}</span>
            <button onClick={()=>{setHighlighted(null); setActiveFocus('ALL');}} className="ml-auto text-zinc-400 hover:text-black">Clear ✕</button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Financial Configuration – OBBO/OB52/FFYC/FEXC/FNRC – {variants.length + fiscalCalendars.length + exchangeRates.length} total</h3>
        <div className="flex gap-2">
          <button onClick={()=>setShowForm(!showForm)} className="text-xs bg-zinc-900 hover:bg-black text-white rounded-full px-4 py-2 transition-colors">+ Create Variant OBBO/FPPC</button>
          <button onClick={load} className="text-xs border border-zinc-200 bg-white hover:bg-zinc-50 rounded-full px-4 py-2 transition-colors">Refresh</button>
        </div>
      </div>

      {showForm && (
        <div id="form-OBBO" className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4 scroll-mt-24">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">📅</div>
            <div><div className="font-semibold">Create Variant – OBBO / FPPC</div><div className="text-xs text-zinc-500">CODE, NAME – Posting Period Variant</div></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">CODE *</label><input value={(form as any).code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} placeholder="CODE" className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black uppercase" /></div>
            <div><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">NAME *</label><input value={(form as any).name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="NAME" className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" /></div>
          </div>
          <button onClick={handleCreate} className="bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-2.5 text-sm font-medium transition-colors">Create Variant – OBBO</button>
        </div>
      )}

      {/* FFYC – Fiscal Calendar – critical missing form */}
      <div id="form-FFYC" className={`bg-white rounded-2xl border-2 shadow-sm p-6 scroll-mt-24 transition-all ${highlighted==='FFYC' ? 'border-black shadow-md' : 'border-zinc-200'}`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-mono font-bold text-xs">FFYC</div>
            <div>
              <div className="font-semibold flex items-center gap-2">Fiscal Calendars – FFYC <span className="text-[10px] bg-black text-white rounded-full px-2 py-0.5">OB29</span> <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5">MISSING FORM FIXED</span></div>
              <div className="text-xs text-zinc-500">{fiscalCalendars.length} calendars • API: POST /api/fiscal-calendars • Used by ELEC FISCAL_CALENDAR_CODE – must exist before Legal Entity</div>
            </div>
          </div>
          <div className="text-[10px] text-zinc-400">K4 April-March India, V3 Calendar Year, K1 Variant</div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">CODE *</label>
            <input value={fiscalForm.code} onChange={e=>setFiscalForm({...fiscalForm,code:e.target.value.toUpperCase()})} placeholder="FISCAL_CALENDAR_CODE – e.g., K4" className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black uppercase" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">NAME *</label>
            <input value={fiscalForm.name} onChange={e=>setFiscalForm({...fiscalForm,name:e.target.value})} placeholder="NAME – e.g., April-March Fiscal" className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">DESCRIPTION</label>
            <input value={fiscalForm.description} onChange={e=>setFiscalForm({...fiscalForm,description:e.target.value})} placeholder="DESCRIPTION" className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
        </div>
        <button onClick={handleCreateFiscal} className="w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Create Fiscal Calendar – FFYC</button>

        <div className="mt-6 grid md:grid-cols-3 gap-3">
          {fiscalCalendars.map((fc:any)=>(
            <div key={fc.code} className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 hover:border-zinc-900 hover:shadow-sm transition-all">
              <div className="flex justify-between items-start">
                <div className="font-mono font-bold text-sm">{fc.code}</div>
                <span className="text-[9px] bg-black text-white rounded-full px-2 py-0.5">FFYC</span>
              </div>
              <div className="text-xs text-zinc-600 mt-1">{fc.name}</div>
              <div className="text-[10px] text-zinc-400 mt-1">{fc.description || 'No description'}</div>
              <div className="mt-2 text-[10px] text-emerald-600">✓ Valid for ELEC FISCAL_CALENDAR_CODE</div>
            </div>
          ))}
          {fiscalCalendars.length===0 && (
            <div className="col-span-3 border border-dashed border-amber-300 bg-amber-50/50 rounded-xl p-6 text-center">
              <div className="text-sm text-amber-800 font-medium">No fiscal calendars – this was the bug! ELEC accepted K6 even though not in DB</div>
              <div className="text-xs text-zinc-600 mt-1">Create K4 (April-March), V3 (Calendar Year), K1 now – then ELEC autocomplete will only show valid values</div>
              <div className="mt-3 flex gap-2 justify-center">
                <button onClick={()=>setFiscalForm({code:'K4',name:'April-March Fiscal – India',description:'India FY April-March'})} className="text-xs bg-black text-white rounded-full px-3 py-1">Use K4</button>
                <button onClick={()=>setFiscalForm({code:'V3',name:'Calendar Year Jan-Dec',description:'Calendar Year'})} className="text-xs border rounded-full px-3 py-1 bg-white">Use V3</button>
                <button onClick={()=>setFiscalForm({code:'K1',name:'Calendar Year Variant',description:'Variant K1'})} className="text-xs border rounded-full px-3 py-1 bg-white">Use K1</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FEXC – Exchange Rates */}
      <div id="form-FEXC" className={`bg-white rounded-2xl border-2 shadow-sm p-6 scroll-mt-24 ${highlighted==='FEXC' ? 'border-black' : 'border-zinc-200'}`}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-xs">FEXC</div>
          <div>
            <div className="font-semibold">Exchange Rates – FEXC <span className="text-[10px] bg-zinc-100 border rounded-full px-2 py-0.5">{exchangeRates.length}</span></div>
            <div className="text-xs text-zinc-500">FROM_CURRENCY, TO_CURRENCY, RATE – autocomplete from DB</div>
          </div>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <DbAutocomplete label="FROM_CURRENCY *" value={exchangeForm.from_currency} onChange={v=>setExchangeForm({...exchangeForm,from_currency:v})} apiUrl="/api/currencies" dataKey="data" placeholder="FROM_CURRENCY" required createUrl={`/${companyCode}/fico/currencies`} createCode="FCYC" />
          <DbAutocomplete label="TO_CURRENCY *" value={exchangeForm.to_currency} onChange={v=>setExchangeForm({...exchangeForm,to_currency:v})} apiUrl="/api/currencies" dataKey="data" placeholder="TO_CURRENCY" required createUrl={`/${companyCode}/fico/currencies`} createCode="FCYC" />
          <div><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">RATE *</label><input value={exchangeForm.rate} onChange={e=>setExchangeForm({...exchangeForm,rate:e.target.value})} placeholder="RATE" className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" /></div>
          <div><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">VALID_FROM</label><input type="date" value={exchangeForm.valid_from} onChange={e=>setExchangeForm({...exchangeForm,valid_from:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" /></div>
        </div>
        <button onClick={handleCreateExchange} className="mt-4 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium">Create Exchange Rate – FEXC</button>
        <div className="mt-4 space-y-2 max-h-[200px] overflow-auto">
          {exchangeRates.map((er:any, idx:number)=>(
            <div key={idx} className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50 text-xs flex justify-between"><span>{er.from_currency} → {er.to_currency} = {er.rate}</span><span className="text-zinc-400">{er.valid_from || ''}</span></div>
          ))}
          {exchangeRates.length===0 && <div className="text-xs text-zinc-500 border border-dashed rounded-xl p-4 text-center">No exchange rates – create INR→USD etc via FEXC</div>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div id="form-OBBO" className={`bg-white rounded-2xl border-2 shadow-sm p-6 scroll-mt-24 ${highlighted==='OBBO' ? 'border-black' : 'border-zinc-200'}`}>
          <h4 className="font-semibold text-sm flex items-center gap-2">Variants OBBO/FPPC <span className="text-[10px] bg-black text-white rounded-full px-2 py-0.5">{variants.length}</span> <span className="text-[10px] bg-zinc-100 border rounded-full px-2 py-0.5">FPPC</span></h4>
          <div className="mt-4 space-y-2">
            {variants.map((v:any)=>(
              <div key={v.code} className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50 flex justify-between items-center hover:border-zinc-900 transition-colors">
                <div><div className="font-medium text-sm">{v.code} – {v.name}</div><div className="text-xs text-zinc-500">OBBO Variant – FPPC</div></div>
                <button onClick={()=>handleDelete(v.code)} className="text-xs border border-red-200 text-red-600 hover:bg-red-50 rounded-full px-3 py-1 bg-white transition-colors">Delete</button>
              </div>
            ))}
            {variants.length===0 && <div className="text-sm text-zinc-500 border border-dashed rounded-xl p-6 text-center">No variants – Create first via OBBO/FPPC</div>}
          </div>
        </div>
        <div id="form-OB52" className={`bg-white rounded-2xl border-2 shadow-sm p-6 scroll-mt-24 ${highlighted==='OB52' ? 'border-black' : 'border-zinc-200'}`}>
          <h4 className="font-semibold text-sm flex items-center gap-2">Open/Close Periods OB52/FPPE <span className="text-[10px] bg-black text-white rounded-full px-2 py-0.5">{periods.length}</span> <span className="text-[10px] bg-zinc-100 border rounded-full px-2 py-0.5">FPPE</span></h4>
          <div className="mt-4 space-y-2 max-h-[400px] overflow-auto">
            {periods.map((p:any)=>(
              <div key={p.id} className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50 flex justify-between text-xs hover:border-zinc-300 transition-colors"><span>{p.variant_code} – TYPE {p.account_type} – {p.from_period}/{p.from_year} → {p.to_period}/{p.to_year}</span></div>
            ))}
            {periods.length===0 && <div className="text-sm text-zinc-500 border border-dashed rounded-xl p-6 text-center">No periods – Fresh deployment</div>}
          </div>
          <div className="text-[11px] text-zinc-500 mt-3 bg-zinc-50 rounded-xl p-3">OB52 Open and Close Posting Periods – Account Types + (All), A Assets, D Customers, K Vendors, M Materials, S G/L – Real DB</div>
        </div>
      </div>

      <div id="form-FNRC" className={`bg-white rounded-2xl border-2 shadow-sm p-6 scroll-mt-24 ${highlighted==='FNRC' ? 'border-black' : 'border-zinc-200'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-mono text-[10px]">FNRC</div>
          <div>
            <div className="font-semibold text-sm">Number Ranges – FNRC – {numberRanges.length}</div>
            <div className="text-xs text-zinc-500">FBN1 – Document numbers – API /api/number-ranges</div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-2">
          {numberRanges.slice(0,9).map((nr:any, idx:number)=>(
            <div key={idx} className="border border-zinc-200 rounded-xl p-2 bg-zinc-50/50 text-xs"><div className="font-mono font-bold">{nr.object_type || nr.code}</div><div className="text-[11px] text-zinc-500">Current: {nr.current_number} Prefix: {nr.prefix}</div></div>
          ))}
          {numberRanges.length===0 && <div className="col-span-3 text-xs text-zinc-500 border border-dashed rounded-xl p-4 text-center">No number ranges – fresh deployment</div>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
        <h4 className="font-medium text-sm">Other Financial Codes – Direct Links – User must always find specific form for specific code</h4>
        <div className="mt-3 grid md:grid-cols-4 gap-2 text-xs">
          <a href={`/${companyCode}/fico/currencies`} className="border rounded-xl p-3 hover:border-black hover:bg-zinc-900 hover:text-white transition-colors"><div className="font-mono font-bold">FCYC / OY03</div><div className="text-[11px] opacity-70">Currencies – INR default</div></a>
          <a href={`/${companyCode}/fico/chart-of-accounts`} className="border rounded-xl p-3 hover:border-black hover:bg-zinc-900 hover:text-white transition-colors"><div className="font-mono font-bold">FCOA / OB13</div><div className="text-[11px] opacity-70">Chart of Accounts</div></a>
          <a href={`/${companyCode}/fico/gl-accounts`} className="border rounded-xl p-3 hover:border-black hover:bg-zinc-900 hover:text-white transition-colors"><div className="font-mono font-bold">FGLC / FS00</div><div className="text-[11px] opacity-70">G/L Accounts</div></a>
          <a href={`/${companyCode}/fico/tax-codes`} className="border rounded-xl p-3 hover:border-black hover:bg-zinc-900 hover:text-white transition-colors"><div className="font-mono font-bold">FTXC / FTXP</div><div className="text-[11px] opacity-70">Tax Codes</div></a>
          <a href={`/${companyCode}/fico/cost-centers`} className="border rounded-xl p-3 hover:border-black hover:bg-zinc-900 hover:text-white transition-colors"><div className="font-mono font-bold">FCCA / KS01</div><div className="text-[11px] opacity-70">Cost Centers</div></a>
          <a href={`/${companyCode}/foundation/enterprise-structure?focus=ECGC`} className="border rounded-xl p-3 hover:border-black hover:bg-zinc-900 hover:text-white transition-colors"><div className="font-mono font-bold">ECGC / OX15</div><div className="text-[11px] opacity-70">Company Group</div></a>
          <a href={`/${companyCode}/foundation/enterprise-structure?focus=ELEC`} className="border rounded-xl p-3 hover:border-black hover:bg-zinc-900 hover:text-white transition-colors"><div className="font-mono font-bold">ELEC / OX02</div><div className="text-[11px] opacity-70">Legal Entity LE-2000</div></a>
          <a href={`/${companyCode}/foundation/enterprise-structure?focus=FFYC`} className="border rounded-xl p-3 hover:border-black bg-black text-white"><div className="font-mono font-bold">FFYC / OB29</div><div className="text-[11px] opacity-70">Fiscal Calendar K4 – FIXED</div></a>
        </div>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Financial Configuration – Posting Period & Fiscal Calendar" subtitle={`${variants.length} Variants • ${periods.length} Periods • ${fiscalCalendars.length} Fiscal Calendars • ${exchangeRates.length} Exchange Rates • OBBO/OB52/FFYC/FEXC/FNRC`} code="FFYC" module="FICO" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
