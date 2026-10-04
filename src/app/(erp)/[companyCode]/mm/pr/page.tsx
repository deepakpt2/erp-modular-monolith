"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';
import { RoleGuard } from '@/shared/ui/role-guard';
import { useAutoPromoteJob } from '@/shared/ui/job-popup';

interface PRLine {
  item_id?: string;
  item_number: string;
  quantity: string;
  uom_code: string;
  estimated_price: string;
  inventory_location_code: string;
  delivery_date: string;
  item_text: string;
}

export default function Page({ defaultMode }: { defaultMode?: any } = {}){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');
  const [facilityCode, setFacilityCode] = useState('');
  const [legalEntityCode, setLegalEntityCode] = useState(companyCode);
  const [requiredDate, setRequiredDate] = useState(new Date().toISOString().split('T')[0]);
  const [headerText, setHeaderText] = useState('');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [lines, setLines] = useState<PRLine[]>([
    { item_number: '', quantity: '10', uom_code: 'PC', estimated_price: '100', inventory_location_code: '', delivery_date: new Date().toISOString().split('T')[0], item_text: '' }
  ]);
  const [refPrNumber, setRefPrNumber] = useState<string>('');
  const [refQuery, setRefQuery] = useState('');
  const [showRefSuggestions, setShowRefSuggestions] = useState(false);

  function applyPrReference(sourcePr: any) {
    if (!sourcePr) return;
    setRefPrNumber(sourcePr.pr_number || sourcePr.id || '');
    if (sourcePr.facility_code || sourcePr.plant_code) setFacilityCode(sourcePr.facility_code || sourcePr.plant_code);
    if (sourcePr.legal_entity_code || sourcePr.company_code) setLegalEntityCode(sourcePr.legal_entity_code || sourcePr.company_code);
    if (sourcePr.currency_code || sourcePr.currency) setCurrencyCode(sourcePr.currency_code || sourcePr.currency);
    setHeaderText(sourcePr.header_text ? `${sourcePr.header_text} (Copy)` : `Copy of PR ${sourcePr.pr_number}`);

    const sourceLines = sourcePr.lines || sourcePr.items || [];
    if (Array.isArray(sourceLines) && sourceLines.length > 0) {
      setLines(sourceLines.map((l: any) => ({
        item_number: l.item_number || l.material_number || '',
        quantity: String(l.quantity || '10'),
        uom_code: l.uom_code || l.uom || 'PC',
        estimated_price: String(l.estimated_price || l.price || '100'),
        inventory_location_code: l.inventory_location_code || l.sloc_id || 'SL01',
        delivery_date: l.delivery_date || new Date().toISOString().split('T')[0],
        item_text: l.item_text || ''
      })));
    }
  }

  function clearPrReference() {
    setRefPrNumber('');
    setRefQuery('');
    setLines([{ item_number: '', quantity: '10', uom_code: 'PC', estimated_price: '100', inventory_location_code: '', delivery_date: new Date().toISOString().split('T')[0], item_text: '' }]);
    setHeaderText('');
  }
  const { elapsed, executeWithAutoPromote, JobPopupComponent } = useAutoPromoteJob();

  async function load(){
    setLoading(true);
    try{
      const res = await fetch(`/api/pr?limit=100&companyCode=${companyCode}`).then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{
    load();
    fetch(`/api/assignments/plant-company-code`).then(r=>r.json()).then(res=>{
      const matches = (res.data || []).filter((a: any)=>!companyCode || a.company_code?.toUpperCase() === companyCode?.toUpperCase());
      if (matches.length > 0 && !facilityCode) {
        setFacilityCode(matches[0].plant_code);
      }
    }).catch(()=>{});
  },[companyCode]);

  function addLine(){
    setLines([...lines, { item_number: '', quantity: '10', uom_code: 'PC', estimated_price: '100', inventory_location_code: '', delivery_date: new Date().toISOString().split('T')[0], item_text: '' }]);
  }
  function updateLine(idx:number, field:keyof PRLine, value:string){
    const newLines = [...lines];
    (newLines[idx] as any)[field] = value;
    setLines(newLines);
  }
  function removeLine(idx:number){
    if(lines.length===1) return;
    setLines(lines.filter((_,i)=>i!==idx));
  }

  async function create(){
    if(!facilityCode){
      setMsg('❌ Facility required – EFCC EFCC (legacy OX10) – e.g., 1000 – plant – org wiring – T0 BLOCKING');
      return;
    }
    const filteredLines = lines.filter(l=>l.item_number && Number(l.quantity)>0);
    if(filteredLines.length===0){
      setMsg('❌ At least one line with material and quantity >0 required – EMTC EMTC (legacy MM01) – e.g., 10000001 MAT-SPICE-001 qty 10 PC – T0');
      return;
    }

    const payload = {
      facility_code: facilityCode,
      plant_code: facilityCode,
      legal_entity_code: legalEntityCode || companyCode,
      company_code: legalEntityCode || companyCode,
      required_date: requiredDate,
      header_text: headerText || `PR for ${facilityCode} – PPRC PPRC (legacy ME51N) – ${companyCode}`,
      currency_code: currencyCode,
      currency: currencyCode,
      lines: filteredLines.map((l,i)=>({
        item_number: l.item_number,
        quantity: Number(l.quantity),
        uom_code: l.uom_code || 'PC',
        uom: l.uom_code || 'PC',
        estimated_price: Number(l.estimated_price) || 0,
        inventory_location_code: l.inventory_location_code,
        sloc_id: l.inventory_location_code,
        delivery_date: l.delivery_date,
        item_text: l.item_text,
        line_number: (i+1)*10,
      })),
    };

    try{
      const result = await executeWithAutoPromote({
        directFn: async ()=>{
          const res = await fetch('/api/pr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j.error || `Failed ${res.status} – ${j.help || ''}`);
          return j;
        },
        backgroundJobType: 'PR_CREATE',
        backgroundPayload: payload,
        companyCode,
        lockObject: 'PR',
        lockObjectId: facilityCode,
        onDirectSuccess: (j:any)=>{
          setMsg(`✅ PR ${j.prNumber || j.pr?.pr_number || 'created'} created – ${filteredLines.length} lines – Facility ${facilityCode} – Legal Entity ${legalEntityCode} – PPRC PPRC (legacy ME51N) – posting period M FPPE (legacy OB52) checked – number range PR 1000000000 numeric only – T0 BLOCKING – workflow will auto-start for approval PPRL (legacy ME54N) if amount > threshold`);
          load();
          // Auto-start workflow for approval PPRL (legacy ME54N)
          try{
            fetch('/api/workflow', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                documentType: 'PR',
                documentId: j.pr?.id || j.prNumber,
                documentNumber: j.prNumber || j.pr?.pr_number,
                companyCodeId: null,
                requesterId: null,
                amount: filteredLines.reduce((sum,l)=>sum + Number(l.quantity)*Number(l.estimated_price),0),
                currency: currencyCode,
              }),
            }).then(r=>r.json()).then(wf=>{
              if(wf.instanceId) setMsg(prev=>prev + ` – Workflow started ${wf.instanceId.slice(0,8)} – ${wf.stepsCreated} tasks – SBWP inbox – PPRL (legacy ME54N) release`);
            }).catch(()=>{});
          }catch{}
          setLines([{ item_number: '', quantity: '10', uom_code: 'PC', estimated_price: '100', inventory_location_code: '', delivery_date: new Date().toISOString().split('T')[0], item_text: '' }]);
          setHeaderText('');
        },
        onBackgroundCreated: (newJobId:string)=>{
          setMsg(`⏳ PR for ${facilityCode} moved to background – job ${newJobId.slice(0,8)} – took >10 sec – popup shows steps – header Jobs icon shows – no timeout – FBJM (legacy SM37) – auto-promote 10s ALL`);
        },
      });
    }catch(err:any){
      setMsg(`❌ ${err.message} – check posting period FPPE (legacy OB52) open for account type M, facility EFCC exists, material EMTC exists, inventory location EILC exists – T0 BLOCKING – NO DANGLING`);
    }
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING PPRC (legacy ME51N) – PPRC – fetching PRs via /api/pr – Industry standard – posting period M FPPE (legacy OB52) – number range PR 1000000000 – facility EFCC – material EMTC – org wiring...</div>;
  const items = data?.purchaseRequisitions || data?.data || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">PPRC PURCHASE REQUISITIONS – PPRC (legacy ME51N) – {Array.isArray(items)?items.length:0} RECORDS – INDUSTRY STANDARD – POSTING PERIOD M – NUMBER RANGE PR 1000000000 – ORG WIRED</div>
        <div className="bg-zinc-50 border border-zinc-300 p-2 mb-2 text-[10px]">
          <div className="font-bold">⚠️ INDUSTRY STANDARD – PPRC PPRC (legacy ME51N) – T0 BLOCKING – ORG WIRED</div>
          <div>• Facility EFCC EFCC (legacy OX10) required – e.g., 1000 – plant – org_facility – T0</div>
          <div>• Legal Entity ELEC ELEC (legacy OX02) required – e.g., {companyCode} – company code – org_legal_entity – T0</div>
          <div>• Material EMTC EMTC (legacy MM01) required – e.g., 10000001 MAT-SPICE-001 – prod_item – T0 – valuation_class determines BSX</div>
          <div>• Posting Period FPPE (legacy OB52) M must be open – else error – FPPE – F_BKPF_BUP – T0</div>
          <div>• Number Range PR 1000000000 numeric only – assignment per company – error_and_extend – FNRC FNRC (legacy FBN1) – always_auto</div>
          <div>• Workflow auto-start PPRL (legacy ME54N) – PR created → wf_instance PENDING_APPROVAL + wf_task PENDING for manager/owner → SBWP inbox → Approve → PR status APPROVED → can convert to PO PPOC PPOC (legacy ME21N)</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">FACILITY * – EFCC EFCC (legacy OX10) – plant – 1000</div><input value={facilityCode} onChange={e=>setFacilityCode(e.target.value.toUpperCase())} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">LEGAL_ENTITY * – ELEC ELEC (legacy OX02) – company code – {companyCode}</div><input value={legalEntityCode} onChange={e=>setLegalEntityCode(e.target.value.toUpperCase())} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">REQUIRED_DATE * – FPPE (legacy OB52)</div><input type="date" value={requiredDate} onChange={e=>setRequiredDate(e.target.value)} className="w-full border-2 border-black px-1 py-1" /></div>
          <div><div className="text-[9px] text-zinc-500">CURRENCY – FCYC FCYC (legacy OY03) – INR</div><input value={currencyCode} onChange={e=>setCurrencyCode(e.target.value.toUpperCase())} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div className="col-span-2"><div className="text-[9px] text-zinc-500">HEADER_TEXT – BKTXT</div><input value={headerText} onChange={e=>setHeaderText(e.target.value)} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
        </div>
        <div className="mt-3 border-2 border-black p-2 bg-zinc-50">
          <div className="font-bold">LINES – {lines.length} – Material + Qty + UoM + Price + SLOC + Delivery Date – EMTC + EUOC + EILC + FCOC + FTXC – ORG WIRED</div>
          {lines.map((line, idx)=>(
            <div key={idx} className="flex gap-1 items-center border bg-white p-1 mt-1">
              <span className="font-bold">{(idx+1)*10}</span>
              <input value={line.item_number} onChange={e=>updateLine(idx,'item_number',e.target.value.toUpperCase())} className="w-[100px] border px-1 uppercase" placeholder="" />
              <input value={line.quantity} onChange={e=>updateLine(idx,'quantity',e.target.value)} className="w-[50px] border px-1" placeholder="" />
              <input value={line.uom_code} onChange={e=>updateLine(idx,'uom_code',e.target.value.toUpperCase())} className="w-[40px] border px-1 uppercase" placeholder="" />
              <input value={line.estimated_price} onChange={e=>updateLine(idx,'estimated_price',e.target.value)} className="w-[60px] border px-1" placeholder="" />
              <input value={line.inventory_location_code} onChange={e=>updateLine(idx,'inventory_location_code',e.target.value.toUpperCase())} className="w-[60px] border px-1 uppercase" placeholder="" />
              <input type="date" value={line.delivery_date} onChange={e=>updateLine(idx,'delivery_date',e.target.value)} className="w-[110px] border px-1" />
              <input value={line.item_text} onChange={e=>updateLine(idx,'item_text',e.target.value)} className="flex-1 border px-1" placeholder="" />
              <button onClick={()=>removeLine(idx)} className="border bg-red-50 px-1">X</button>
            </div>
          ))}
          <button onClick={addLine} className="mt-1 border-2 border-black px-2 py-0.5 bg-white">+ ADD LINE</button>
        </div>
        <button onClick={create} className="mt-2 bg-black text-white px-3 py-1 w-full">CREATE PR – PPRC (legacy ME51N) – PPRC – T0 BLOCKING – POSTING PERIOD M – NUMBER RANGE PR 1000000000 – WORKFLOW PPRL (legacy ME54N) – {elapsed>0?`${elapsed}s elapsed – after 10s auto background`:''}</button>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {(Array.isArray(items)?items:[]).slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2">
            <div className="font-bold">{it.pr_number || it.code} – {it.status} – Facility {it.facility_code || it.plant_code} – {it.company_code}</div>
            <div className="text-[10px] text-zinc-600">{it.material_number || it.item_number} – Qty {it.quantity} {it.uom} – Price {it.estimated_price} – Total {it.total_amount} – {it.currency}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <JobPopupComponent />
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : msg.startsWith('⏳') ? 'bg-zinc-50 border border-zinc-200 text-zinc-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
        <div className="flex gap-2">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="font-bold text-sm text-zinc-800">SAP Standard – PPRC PPRC (legacy ME51N) – T0 BLOCKING – Org Wired – Workflow PPRL (legacy ME54N) – Fixed from dummy API</div>
            <div className="text-xs text-zinc-700 mt-1 space-y-1">
              <div>• <b>Facility EFCC EFCC (legacy OX10)</b> required – e.g., 1000 – plant – org_facility – T0 – was missing in old page that only asked PRODUCT, QUANTITY, FACILITY, COMPANY_CODE – now fixed with full org wiring</div>
              <div>• <b>Legal Entity ELEC ELEC (legacy OX02)</b> required – e.g., {companyCode} – company code – org_legal_entity – chart CA-IN-01 fiscal K4 posting PPV-1000 credit CRED-1000 – T0</div>
              <div>• <b>Material EMTC EMTC (legacy MM01)</b> required – e.g., 10000001 MAT-SPICE-001 – prod_item – valuation_class RAW→1400000001 BSX – T0 – determines BSX in GR</div>
              <div>• <b>Posting Period FPPE (legacy OB52) M</b> must be open for account type M – else error – FPPE – F_BKPF_BUP – T0 – posting period enforcement via enforcePostingPeriod</div>
              <div>• <b>Number Range PR 1000000000</b> numeric only – assignment per company – error_and_extend – FNRC FNRC (legacy FBN1) – always_auto – user cannot type random – PO 4500000000 PR 1000000000 GR 5000000000 always auto</div>
              <div>• <b>Workflow PPRL (legacy ME54N) SBWP</b> – PR created → wf_instance PENDING_APPROVAL + wf_task PENDING for manager/owner → SBWP inbox → Approve → PR status APPROVED → can convert to PO PPOC PPOC (legacy ME21N) – auto-start if amount &gt; threshold</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">📋</div>
          <div>
            <div className="font-semibold">Purchase Requisitions – PPRC (alias ME51N) – Industry Standard Flow</div>
            <div className="text-xs text-zinc-500">{Array.isArray(items)?items.length:0} PRs • COMPANY_CODE {companyCode} • API: POST /api/pr – facility EFCC + legal entity ELEC + material EMTC + inventory location EILC + UoM EUOC + currency FCYC – T0 BLOCKING – number range PR 1000000000 – workflow SBWP</div>
          </div>
        </div>

        {/* Create with Reference / Copy PR Banner */}
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <span className="text-sm">📋</span> Create with Reference – Copy Purchase Requisition (ME51N)
              </span>
              <span className="text-[11px] text-blue-700 hidden sm:inline">
                Clone Facility, Delivery Date, and Line Items from an existing Purchase Requisition
              </span>
            </div>
            {refPrNumber && (
              <button
                type="button"
                onClick={clearPrReference}
                className="text-xs px-2.5 py-0.5 rounded-full bg-white border border-blue-300 text-blue-800 hover:bg-blue-100 transition font-medium"
              >
                ✕ Clear Reference
              </button>
            )}
          </div>

          {refPrNumber ? (
            <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-blue-200">
              <div className="flex items-center gap-2 truncate">
                <span className="font-mono font-bold bg-blue-600 text-white px-2 py-0.5 rounded text-[11px]">
                  {refPrNumber}
                </span>
                <span className="font-medium truncate text-zinc-800">
                  {headerText}
                </span>
                <span className="text-[11px] text-zinc-500 hidden md:inline">
                  — {lines.length} lines copied into form below. Edit or submit to generate new sequential PR number.
                </span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={refQuery}
                    onChange={(e) => {
                      setRefQuery(e.target.value);
                      setShowRefSuggestions(true);
                    }}
                    onFocus={() => setShowRefSuggestions(true)}
                    placeholder={`Select template PR to copy from (${Array.isArray(items) ? items.length : 0} available)... `}
                    className="w-full border border-blue-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  />
                  {refQuery && (
                    <button
                      type="button"
                      onClick={() => setRefQuery('')}
                      className="absolute right-2 top-1.5 text-zinc-400 hover:text-zinc-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {Array.isArray(items) && items.length > 0 && (
                  <span className="text-[11px] text-blue-800 font-medium whitespace-nowrap hidden sm:inline">
                    {items.length} PRs in record
                  </span>
                )}
              </div>

              {showRefSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-blue-200 z-20 max-h-56 overflow-auto divide-y divide-zinc-100">
                  {(Array.isArray(items) ? items : [])
                    .filter((it: any) => {
                      if (!refQuery) return true;
                      const q = refQuery.toLowerCase();
                      const num = String(it.pr_number || it.id || '').toLowerCase();
                      const fac = String(it.facility_code || it.plant_code || '').toLowerCase();
                      const text = String(it.header_text || '').toLowerCase();
                      return num.includes(q) || fac.includes(q) || text.includes(q);
                    })
                    .slice(0, 15)
                    .map((it: any, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => {
                          applyPrReference(it);
                          setShowRefSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center justify-between gap-2 transition"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono font-bold bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded text-[11px]">
                            {it.pr_number || it.id}
                          </span>
                          <span className="font-mono text-zinc-600">{it.facility_code || it.plant_code}</span>
                          <span className="truncate text-zinc-900">{it.header_text || 'Purchase Requisition'}</span>
                          <span className="text-[10px] text-zinc-400">({it.lines?.length || it.line_count || 0} lines)</span>
                        </div>
                        <span className="text-[10px] text-blue-600 font-medium shrink-0 uppercase tracking-wider">Select & Copy →</span>
                      </button>
                    ))}
                  {(!items || items.length === 0) && (
                    <div className="p-3 text-center text-zinc-400 text-xs">No existing PRs available to reference.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DbAutocomplete
            label="FACILITY * – EFCC EFCC (legacy OX10) – plant – 1000"
            value={facilityCode}
            onChange={v=>setFacilityCode(v)}
            apiUrl="/api/facilities"
            codeField="code"
            nameField="name"
            placeholder=""
            required
            createUrl={`/${companyCode}/foundation/facilities`}
            createCode="EFCC"
            companyCode={companyCode}
          />
          <DbAutocomplete
            label="LEGAL_ENTITY * – ELEC ELEC (legacy OX02) – company code"
            value={legalEntityCode}
            onChange={v=>setLegalEntityCode(v)}
            apiUrl="/api/legal-entities"
            codeField="code"
            nameField="name"
            placeholder=""
            required
            createUrl={`/${companyCode}/foundation/legal-entities`}
            createCode="ELEC"
            companyCode={companyCode}
          />
          <div>
            <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">REQUIRED_DATE * – FPPE (legacy OB52) – F_BKPF_BUP</label>
            <input type="date" value={requiredDate} onChange={e=>setRequiredDate(e.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] focus:outline-none focus:ring-1 focus:ring-black focus:border-black" />
            <p className="text-[10px] text-zinc-400 mt-1">Posting period must be open for account type M – else error – FPPE</p>
          </div>
          <DbAutocomplete
            label="CURRENCY – FCYC FCYC (legacy OY03) – INR"
            value={currencyCode}
            onChange={v=>setCurrencyCode(v)}
            apiUrl="/api/currencies"
            codeField="code"
            nameField="name"
            placeholder=""
            createUrl={`/${companyCode}/fico/currencies`}
            createCode="FCYC"
            companyCode={companyCode}
          />
          <div className="md:col-span-4">
            <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">HEADER_TEXT – BKTXT</label>
            <input value={headerText} onChange={e=>setHeaderText(e.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] focus:outline-none focus:ring-1 focus:ring-black focus:border-black" placeholder="" />
          </div>
        </div>

        <div className="mt-6 border rounded-2xl p-4 bg-zinc-50/50 border-zinc-200">
          <div className="flex justify-between items-center mb-3">
            <div className="font-bold text-sm">Lines – {lines.length} – Material + Qty + UoM + Price + SLOC + Delivery Date – EMTC + EUOC + EILC + FCOC + FTXC – Org Wired – T0</div>
            <button onClick={addLine} className="px-3 py-1 rounded-full border bg-white text-xs hover:bg-zinc-50">+ Add Line</button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {lines.map((line, idx)=>(
              <div key={idx} className="border rounded-xl p-3 bg-white">
                <div className="flex gap-3 items-start">
                  <div className="font-mono font-bold text-sm mt-2">{(idx+1)*10}</div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-3">
                    <DbAutocomplete
                      label="MATERIAL * – EMTC"
                      value={line.item_number}
                      onChange={v=>updateLine(idx,'item_number',v)}
                      apiUrl="/api/materials"
                      codeField="item_number"
                      nameField="description"
                      placeholder=""
                      required
                      createUrl={`/${companyCode}/foundation/materials`}
                      createCode="EMTC"
                      companyCode={companyCode}
                    />
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase">Qty *</label>
                      <input value={line.quantity} onChange={e=>updateLine(idx,'quantity',e.target.value)} className="w-full border border-zinc-200 rounded-lg px-2 py-1 text-[12px] h-[28px]" placeholder="" />
                    </div>
                    <DbAutocomplete
                      label="UoM – EUOC"
                      value={line.uom_code}
                      onChange={v=>updateLine(idx,'uom_code',v)}
                      apiUrl="/api/uom"
                      codeField="code"
                      nameField="name"
                      placeholder=""
                      createUrl={`/${companyCode}/foundation/uom`}
                      createCode="EUOC"
                      companyCode={companyCode}
                    />
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase">Est Price</label>
                      <input value={line.estimated_price} onChange={e=>updateLine(idx,'estimated_price',e.target.value)} className="w-full border border-zinc-200 rounded-lg px-2 py-1 text-[12px] h-[28px]" placeholder="" />
                    </div>
                    <DbAutocomplete
                      label="SLOC – EILC"
                      value={line.inventory_location_code}
                      onChange={v=>updateLine(idx,'inventory_location_code',v)}
                      apiUrl="/api/inventory-locations"
                      codeField="code"
                      nameField="name"
                      placeholder=""
                      createUrl={`/${companyCode}/foundation/inventory-locations`}
                      createCode="EILC"
                      companyCode={companyCode}
                    />
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase">Delivery Date</label>
                      <input type="date" value={line.delivery_date} onChange={e=>updateLine(idx,'delivery_date',e.target.value)} className="w-full border border-zinc-200 rounded-lg px-2 py-1 text-[12px] h-[28px]" />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase">Item Text</label>
                      <div className="flex gap-1">
                        <input value={line.item_text} onChange={e=>updateLine(idx,'item_text',e.target.value)} className="flex-1 border border-zinc-200 rounded-lg px-2 py-1 text-[12px] h-[28px]" placeholder="" />
                        <button onClick={()=>removeLine(idx)} className="px-2 py-1 rounded-lg border bg-red-50 text-xs">X</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={create} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 h-[32px] text-[13px] font-medium transition-colors">
          Create PR – PPRC (legacy ME51N) – PPRC – T0 BLOCKING – Posting Period M FPPE (legacy OB52) – Number Range PR 1000000000 – Workflow PPRL (legacy ME54N) SBWP – {elapsed>0?`${elapsed}s elapsed – after 10s auto background`:''}
        </button>
        <p className="text-[10px] text-zinc-400 mt-2 text-center">PR requires facility EFCC + legal entity ELEC + material EMTC + inventory location EILC + UoM EUOC + currency FCYC – posting period M FPPE (legacy OB52) must be open – number range PR 1000000000 numeric only assignment per company error_and_extend – workflow auto-start PPRL (legacy ME54N) SBWP – flow PR→PO→GR→IV→Payment – T0 BLOCKING – NO DANGLING – org wired</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(Array.isArray(items)?items:[]).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start">
              <div className="font-semibold text-sm">{it.pr_number || it.code} – {it.status} – Facility {it.facility_code || it.plant_code} – {it.company_code}</div>
              <span className="text-[10px] bg-zinc-900 text-white rounded-full px-2 py-0.5">PPRC (legacy ME51N)</span>
            </div>
            <div className="mt-2 text-xs text-zinc-500">{it.material_number || it.item_number} – Qty {it.quantity} {it.uom} – Price {it.estimated_price} – Total {it.total_amount} – {it.currency} – Requester {it.requester_first_name}</div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  applyPrReference(it);
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="text-[11px] px-2.5 py-1 rounded-full border bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition"
                title="Copy PR lines into create form"
              >
                Copy As
              </button>
              <Link href={`/${companyCode}/mm/po`} className="text-[11px] px-2 py-1 rounded-full border bg-zinc-50 hover:bg-zinc-100">PPOC PO from PR →</Link>
              <Link href={`/${companyCode}/workflow/inbox`} className="text-[11px] px-2 py-1 rounded-full border bg-zinc-50 hover:bg-zinc-100">SBWP Release PR PPRL (legacy ME54N) →</Link>
            </div>
          </div>
        ))}
        {(!items || (Array.isArray(items) && items.length===0)) && (
          <div className="col-span-2 bg-white rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
            <div className="text-sm text-zinc-500">No PR yet – create first via PPRC (legacy ME51N) – PPRC – requires facility + legal entity + material – org wired – posting period M FPPE (legacy OB52) – number range PR 1000000000 – workflow PPRL (legacy ME54N)</div>
            <div className="text-xs text-zinc-400 mt-1">COMPANY_CODE {companyCode} • Flow: PPRC PPRC (legacy ME51N) PR → PPOC PPOC (legacy ME21N) PO → IGRC IGRC GR_PO (legacy IGRC (legacy MIGO) 101) GR → PIVC PIVC (legacy MIRO) IV → FPYP FPYA (legacy F110) Payment</div>
          </div>
        )}
      </div>

      <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related Masters – auto from dependencies – low importance – Org Wired</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/foundation/materials`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EMTC</span><span>Material – EMTC (legacy MM01) – required – T0 – valuation_class BSX</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/facilities`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EFCC</span><span>Facility – EFCC (legacy OX10) – plant – required – T0</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/inventory-locations`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EILC</span><span>Inventory Location – EILC (legacy OX09) – SLOC – SL01</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/uom`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EUOC</span><span>UoM – EUOC (legacy CUNI) – KG/PC/BOX – base UoM</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/currencies`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FCYC</span><span>Currency – FCYC (legacy OY03) – INR/USD/EUR/KWD – decimal_places</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/mm/po`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PPOC</span><span>PO uses PR – PPOC (legacy ME21N) – PPOC – ELIKZ</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/workflow/inbox`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SBWP</span><span>Workflow Inbox – PPRL (legacy ME54N) Release PR – approval</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/number-ranges`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FNRC</span><span>Number Ranges – FNRC (legacy FBN1) – PR 1000000000 – assignment per company</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">Flow: PR (PPRC (legacy ME51N) PPRC) → PO (PPOC (legacy ME21N) PPOC) → GR (IGRC GR_PO (legacy IGRC (legacy MIGO) 101) IGRC) → IV (PIVC (legacy MIRO) PIVC) → Payment (FPYA (legacy F110) FPYP) – industry standard MM – T0 BLOCKING – NO DANGLING – org wired – facility EFCC + legal entity ELEC + material EMTC + inventory location EILC + UoM EUOC + currency FCYC + procurement division EPDC + buyer team EBTC + cost center FCOC + GL FGLC + tax FTXC + movement type FMTM + auto account FAUC + number range FNRC + posting period FPPE + fiscal FFYC + payment terms FAPT</p>
      </div>
    </div>
  );

  return (
    <RoleGuard requiredPermission="PR_CREATE" requiredRoles={['PURCHASER','ADMIN','OWNER','MANAGER']}>
      <ModernModuleShell title="Purchase Requisitions" subtitle={`${Array.isArray(items)?items.length:0} PRs • ${companyCode} • PPRC (legacy ME51N) – Org Wired – Posting Period M – Number Range PR 1000000000 – Workflow PPRL (legacy ME54N)`} code="PPRC" module="MM" classicChildren={classicContent}>
        {modernContent}
      </ModernModuleShell>
    </RoleGuard>
  );
}
