"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';
import { RoleGuard } from '@/shared/ui/role-guard';
import { useAutoPromoteJob } from '@/shared/ui/job-popup';

interface POLine {
  item_number: string;
  quantity: string;
  uom_code: string;
  unit_price: string;
  freight_per_unit: string;
  customs_per_unit: string;
  tax_per_unit: string;
  tax_code: string;
  overdelivery_tolerance_percent: string;
  underdelivery_tolerance_percent: string;
  inventory_location_code: string;
  item_text: string;
  delivery_text: string;
}

export default function Page(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');
  const [facilityCode, setFacilityCode] = useState('1000');
  const [legalEntityCode, setLegalEntityCode] = useState(companyCode);
  const [partnerNumber, setPartnerNumber] = useState('');
  const [prNumber, setPrNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [headerText, setHeaderText] = useState('');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [paymentTermsDays, setPaymentTermsDays] = useState('30');
  const [paymentTermCode, setPaymentTermCode] = useState('NT30');
  const [incoterms, setIncoterms] = useState('EXW');
  const [lines, setLines] = useState<POLine[]>([
    { item_number: '', quantity: '10', uom_code: 'PC', unit_price: '100', freight_per_unit: '0', customs_per_unit: '0', tax_per_unit: '0', tax_code: 'GST18', overdelivery_tolerance_percent: '10', underdelivery_tolerance_percent: '10', inventory_location_code: 'SL01', item_text: '', delivery_text: '' }
  ]);
  const { elapsed, executeWithAutoPromote, JobPopupComponent } = useAutoPromoteJob();

  async function load(){
    setLoading(true);
    try{
      const res = await fetch(`/api/po?limit=100&companyCode=${companyCode}`).then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[companyCode]);

  function addLine(){
    setLines([...lines, { item_number: '', quantity: '10', uom_code: 'PC', unit_price: '100', freight_per_unit: '0', customs_per_unit: '0', tax_per_unit: '0', tax_code: 'GST18', overdelivery_tolerance_percent: '10', underdelivery_tolerance_percent: '10', inventory_location_code: 'SL01', item_text: '', delivery_text: '' }]);
  }
  function updateLine(idx:number, field:keyof POLine, value:string){
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
      setMsg('❌ Facility required – EFCC OX10 – e.g., 1000 – plant – org_facility – T0 BLOCKING');
      return;
    }
    if(!partnerNumber){
      setMsg('❌ Vendor required – PSUC XK01 – partner_account – e.g., VEND-1000 – T0 BLOCKING – supplier master with currency_code FCYC payment_term_code FAPT reconciliation_account_code FGLC procurement_division_code EPDC buyer_team_code EBTC');
      return;
    }
    const filteredLines = lines.filter(l=>l.item_number && Number(l.quantity)>0);
    if(filteredLines.length===0){
      setMsg('❌ At least one line with material and quantity >0 required – EMTC MM01 – e.g., 10000001 MAT-SPICE-001 qty 10 PC price 100 – T0');
      return;
    }

    const payload = {
      facility_code: facilityCode,
      plant_code: facilityCode,
      legal_entity_code: legalEntityCode || companyCode,
      company_code: legalEntityCode || companyCode,
      partner_number: partnerNumber,
      vendor_number: partnerNumber,
      pr_number: prNumber || undefined,
      delivery_date: deliveryDate,
      header_text: headerText || `PO for ${partnerNumber} – PPOC ME21N – ${companyCode} – facility ${facilityCode}`,
      currency_code: currencyCode,
      currency: currencyCode,
      payment_terms_days: Number(paymentTermsDays) || 30,
      payment_term_code: paymentTermCode,
      payment_terms_code: paymentTermCode,
      incoterms: incoterms,
      lines: filteredLines.map((l,i)=>({
        item_number: l.item_number,
        quantity: Number(l.quantity),
        uom_code: l.uom_code || 'PC',
        uom: l.uom_code || 'PC',
        unit_price: Number(l.unit_price) || 0,
        freight_per_unit: Number(l.freight_per_unit) || 0,
        customs_per_unit: Number(l.customs_per_unit) || 0,
        tax_per_unit: Number(l.tax_per_unit) || 0,
        tax_code: l.tax_code,
        tax_rule_code: l.tax_code,
        overdelivery_tolerance_percent: Number(l.overdelivery_tolerance_percent) || 10,
        underdelivery_tolerance_percent: Number(l.underdelivery_tolerance_percent) || 10,
        over_tolerance: Number(l.overdelivery_tolerance_percent) || 10,
        under_tolerance: Number(l.underdelivery_tolerance_percent) || 10,
        inventory_location_code: l.inventory_location_code,
        sloc_id: l.inventory_location_code,
        item_text: l.item_text,
        delivery_text: l.delivery_text,
        line_number: (i+1)*10,
      })),
    };

    try{
      const result = await executeWithAutoPromote({
        directFn: async ()=>{
          const res = await fetch('/api/po', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j.error || `Failed ${res.status} – ${j.help || ''}`);
          return j;
        },
        backgroundJobType: 'PO_CREATE',
        backgroundPayload: payload,
        companyCode,
        lockObject: 'PO',
        lockObjectId: partnerNumber,
        onDirectSuccess: (j:any)=>{
          setMsg(`✅ PO ${j.poNumber || j.po?.po_number || 'created'} created – ${filteredLines.length} lines – Vendor ${partnerNumber} – Facility ${facilityCode} – Legal Entity ${legalEntityCode} – PPOC ME21N – posting period K OB52 checked – payment terms ${paymentTermsDays} days due calc FAPT – info record ME11 auto price lookup if unit_price 0 – number range PO 4500000000 numeric only always_auto – T0 BLOCKING – workflow will auto-start for approval ME28 if amount > threshold – ELIKZ delivery_completed flag`);
          load();
          // Auto-start workflow for approval ME28
          try{
            fetch('/api/workflow', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                documentType: 'PO',
                documentId: j.po?.id || j.poNumber,
                documentNumber: j.poNumber || j.po?.po_number,
                companyCodeId: null,
                requesterId: null,
                amount: filteredLines.reduce((sum,l)=>sum + Number(l.quantity)*Number(l.unit_price),0),
                currency: currencyCode,
              }),
            }).then(r=>r.json()).then(wf=>{
              if(wf.instanceId) setMsg(prev=>prev + ` – Workflow started ${wf.instanceId.slice(0,8)} – ${wf.stepsCreated} tasks – SBWP inbox – ME28 release – manager/owner dual if >10000`);
            }).catch(()=>{});
          }catch{}
          // Auto document flow PR→PO
          if(prNumber){
            try{
              fetch('/api/document-flow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  precedingDocType: 'PR',
                  precedingDocNumber: prNumber,
                  succeedingDocType: 'PO',
                  succeedingDocNumber: j.poNumber || j.po?.po_number,
                  rootDocType: 'PR',
                  rootDocNumber: prNumber,
                }),
              }).catch(()=>{});
            }catch{}
          }
          setLines([{ item_number: '', quantity: '10', uom_code: 'PC', unit_price: '100', freight_per_unit: '0', customs_per_unit: '0', tax_per_unit: '0', tax_code: 'GST18', overdelivery_tolerance_percent: '10', underdelivery_tolerance_percent: '10', inventory_location_code: 'SL01', item_text: '', delivery_text: '' }]);
          setHeaderText('');
          setPrNumber('');
        },
        onBackgroundCreated: (newJobId:string)=>{
          setMsg(`⏳ PO for ${partnerNumber} moved to background – job ${newJobId.slice(0,8)} – took >10 sec – popup shows steps – header Jobs icon shows – no timeout – SM37 – auto-promote 10s ALL`);
        },
      });
    }catch(err:any){
      setMsg(`❌ ${err.message} – check posting period OB52 open for account type K, facility EFCC exists, vendor PSUC exists, material EMTC exists, inventory location EILC exists, payment terms FAPT exists – T0 BLOCKING – NO DANGLING – info record ME11 if price 0`);
    }
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING ME21N – PPOC – fetching POs via /api/po – SAP standard – posting period K OB52 – number range PO 4500000000 numeric only always_auto – facility EFCC – vendor PSUC – material EMTC – info record ME11 – payment terms FAPT – org wiring...</div>;
  const items = data?.pos || data?.purchaseOrders || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">PPOC PURCHASE ORDERS – ME21N – {Array.isArray(items)?items.length:0} RECORDS – SAP STANDARD – POSTING PERIOD K – NUMBER RANGE PO 4500000000 – INFO RECORD ME11 – PAYMENT TERMS FAPT – ORG WIRED</div>
        <div className="bg-amber-50 border border-amber-300 p-2 mb-2 text-[10px]">
          <div className="font-bold">⚠️ SAP STANDARD – PPOC ME21N – T0 BLOCKING – ORG WIRED – INFO RECORD ME11</div>
          <div>• Facility EFCC OX10 required – e.g., 1000 – plant – org_facility – T0</div>
          <div>• Vendor PSUC XK01 required – e.g., VEND-1000 – partner_account – currency_code FCYC payment_term_code FAPT recon_account FGLC procurement_division EPDC buyer_team EBTC – T0</div>
          <div>• Material EMTC MM01 required – e.g., 10000001 MAT-SPICE-001 – prod_item – valuation_class RAW→1400000001 BSX – T0</div>
          <div>• Posting Period OB52 K must be open – else error – FPPE – F_BKPF_BUP – T0 – K Vendors</div>
          <div>• Number Range PO 4500000000 numeric only always_auto – assignment per company YZX to PO – error_and_extend – FNRC FBN1 – user cannot type random – PO 4500000000 PR 1000000000 GR 5000000000 always auto</div>
          <div>• Info Record ME11 – if unit_price 0, lookup proc_info_record vendor-material valid_from valid_to → auto price – T2 GOOD OPERATIONAL – e.g., vendor VEND-1000 material 10000001 price 100</div>
          <div>• Payment Terms FAPT – calculate due date from posting date + days – e.g., NT30 Net 30 – due_calc – e.g., posting 2026-05-15 + 30 days = 2026-06-14 due</div>
          <div>• Workflow auto-start ME28 – PO created → wf_instance PENDING_APPROVAL + wf_task PENDING for manager/owner → SBWP inbox → Approve → PO status APPROVED → can do GR IGRC MIGO 101 – auto-start if amount &gt; threshold – manager only &lt;10000 manager+owner dual &gt;10000</div>
          <div>• ELIKZ – delivery_completed flag – PO line delivery_completed true when fully received – BOOL_AND delivery_completed – all_elikz – T0 – controls PO closure</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">FACILITY * – EFCC OX10 – plant – 1000</div><input value={facilityCode} onChange={e=>setFacilityCode(e.target.value.toUpperCase())} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="1000" /></div>
          <div><div className="text-[9px] text-zinc-500">VENDOR * – PSUC XK01 – VEND-1000 – T0</div><input value={partnerNumber} onChange={e=>setPartnerNumber(e.target.value.toUpperCase())} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="VEND-1000" /></div>
          <div><div className="text-[9px] text-zinc-500">LEGAL_ENTITY * – ELEC OX02 – {companyCode}</div><input value={legalEntityCode} onChange={e=>setLegalEntityCode(e.target.value.toUpperCase())} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder={companyCode} /></div>
          <div><div className="text-[9px] text-zinc-500">PR_NUMBER – PPRC – optional – PR-10000001</div><input value={prNumber} onChange={e=>setPrNumber(e.target.value.toUpperCase())} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="PR-10000001" /></div>
          <div><div className="text-[9px] text-zinc-500">DELIVERY_DATE * – OB52</div><input type="date" value={deliveryDate} onChange={e=>setDeliveryDate(e.target.value)} className="w-full border-2 border-black px-1 py-1" /></div>
          <div><div className="text-[9px] text-zinc-500">CURRENCY – FCYC – INR</div><input value={currencyCode} onChange={e=>setCurrencyCode(e.target.value.toUpperCase())} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="INR" /></div>
          <div><div className="text-[9px] text-zinc-500">PAYMENT_TERM_CODE – FAPT – NT30 – due calc – wiring</div><input value={paymentTermCode} onChange={e=>setPaymentTermCode(e.target.value.toUpperCase())} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="NT30" /></div>
          <div><div className="text-[9px] text-zinc-500">PAYMENT_TERMS_DAYS – FAPT – 30 – derived from code NT30</div><input value={paymentTermsDays} onChange={e=>setPaymentTermsDays(e.target.value)} className="w-full border-2 border-black px-1 py-1" placeholder="30" /></div>
          <div><div className="text-[9px] text-zinc-500">INCOTERMS – EXW/FOB/CIF</div><input value={incoterms} onChange={e=>setIncoterms(e.target.value.toUpperCase())} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="EXW" /></div>
          <div className="col-span-1"><div className="text-[9px] text-zinc-500">HEADER_TEXT – BKTXT</div><input value={headerText} onChange={e=>setHeaderText(e.target.value)} className="w-full border-2 border-black px-1 py-1" placeholder={`PO for ${partnerNumber} – ME21N – ${companyCode}`} /></div>
        </div>
        <div className="mt-3 border-2 border-black p-2 bg-blue-50">
          <div className="font-bold">LINES – {lines.length} – Material + Qty + UoM + Price + Freight + Customs + Tax + TaxCode + OverTol + UnderTol + SLOC + Item Text – EMTC + EUOC + EILC + FCOC + FTXC – INFO RECORD ME11 – ORG WIRED – VERSION HISTORY</div>
          {lines.map((line, idx)=>(
            <div key={idx} className="flex gap-1 items-center border bg-white p-1 mt-1">
              <span className="font-bold">{(idx+1)*10}</span>
              <input value={line.item_number} onChange={e=>updateLine(idx,'item_number',e.target.value.toUpperCase())} className="w-[80px] border px-1 uppercase" placeholder="10000001" />
              <input value={line.quantity} onChange={e=>updateLine(idx,'quantity',e.target.value)} className="w-[40px] border px-1" placeholder="Qty" />
              <input value={line.uom_code} onChange={e=>updateLine(idx,'uom_code',e.target.value.toUpperCase())} className="w-[30px] border px-1 uppercase" placeholder="PC" />
              <input value={line.unit_price} onChange={e=>updateLine(idx,'unit_price',e.target.value)} className="w-[50px] border px-1" placeholder="Price" />
              <input value={line.freight_per_unit} onChange={e=>updateLine(idx,'freight_per_unit',e.target.value)} className="w-[40px] border px-1" placeholder="Freight" />
              <input value={line.customs_per_unit} onChange={e=>updateLine(idx,'customs_per_unit',e.target.value)} className="w-[40px] border px-1" placeholder="Customs" />
              <input value={line.tax_per_unit} onChange={e=>updateLine(idx,'tax_per_unit',e.target.value)} className="w-[30px] border px-1" placeholder="Tax" />
              <input value={line.tax_code} onChange={e=>updateLine(idx,'tax_code',e.target.value.toUpperCase())} className="w-[50px] border px-1 uppercase" placeholder="GST18" />
              <input value={line.overdelivery_tolerance_percent} onChange={e=>updateLine(idx,'overdelivery_tolerance_percent',e.target.value)} className="w-[35px] border px-1" placeholder="Over10%" />
              <input value={line.underdelivery_tolerance_percent} onChange={e=>updateLine(idx,'underdelivery_tolerance_percent',e.target.value)} className="w-[35px] border px-1" placeholder="Under10%" />
              <input value={line.inventory_location_code} onChange={e=>updateLine(idx,'inventory_location_code',e.target.value.toUpperCase())} className="w-[40px] border px-1 uppercase" placeholder="SL01" />
              <input value={line.item_text} onChange={e=>updateLine(idx,'item_text',e.target.value)} className="flex-1 border px-1" placeholder="Item text" />
              <button onClick={()=>removeLine(idx)} className="border bg-red-50 px-1">X</button>
            </div>
          ))}
          <button onClick={addLine} className="mt-1 border-2 border-black px-2 py-0.5 bg-white">+ ADD LINE</button>
          <div className="text-[9px] text-zinc-500 mt-1">Info Record ME11 – if unit_price 0, auto lookup proc_info_record vendor-material → price – T2 – e.g., VEND-1000 + 10000001 → 100 – landed cost total_per_unit = unit_price + freight + customs + tax – tax FTXC code GST18 rate lookup – overdelivery_tolerance_percent 10% underdelivery_tolerance_percent 10% – over/under delivery tolerance – version history CDHDR/CDPOS – purchasing conditions BASE/FREIGHT/CUSTOMS/TAX – payment terms FAPT NT30 due calc – recon account FGLC – PO changes/version history – partial GR/IV allowed – invoice qty/value tolerance OBA0/OBA4 VEND-01 – cancellation/reversal PORE/GRRE/IVRE – credit/debit memo RE_CREDIT – approval workflow SBWP ME28 – ELIKZ</div>
        </div>
        <button onClick={create} className="mt-2 bg-black text-white px-3 py-1 w-full">CREATE PO – ME21N – PPOC – T0 BLOCKING – POSTING PERIOD K – NUMBER RANGE PO 4500000000 – INFO RECORD ME11 – PAYMENT TERMS FAPT – WORKFLOW ME28 – ELIKZ – {elapsed>0?`${elapsed}s elapsed – after 10s auto background`:''}</button>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {(Array.isArray(items)?items:[]).slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2">
            <div className="font-bold">{it.po_number || it.code} – {it.status} – Vendor {it.vendor_name} – Facility {it.facility_code || it.plant_code} – {it.company_code}</div>
            <div className="text-[10px] text-zinc-600">Lines {it.line_count} – Ordered {it.total_ordered_qty} Received {it.total_received_qty} – Total {it.total_amount} {it.currency} – Delivery {it.delivery_date} – All ELIKZ {String(it.all_elikz)} – PR Ref {it.pr_ref}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <JobPopupComponent />
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : msg.startsWith('⏳') ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex gap-2">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="font-bold text-sm text-amber-800">SAP Standard – PPOC ME21N – T0 BLOCKING – Org Wired – Info Record ME11 – Payment Terms FAPT – Workflow ME28 – Fixed from dummy API</div>
            <div className="text-xs text-amber-700 mt-1 space-y-1">
              <div>• <b>Facility EFCC OX10</b> required – e.g., 1000 – plant – org_facility – T0 – was missing in old page that only asked VENDOR, PRODUCT, QUANTITY, PRICE, COMPANY_CODE – now fixed with full org wiring</div>
              <div>• <b>Vendor PSUC XK01</b> required – e.g., VEND-1000 – partner_account – currency_code FCYC INR payment_term_code FAPT NT30 recon_account FGLC 2000000000 procurement_division EPDC PO01 buyer_team EBTC BT-100 – T0 – supplier master</div>
              <div>• <b>Material EMTC MM01</b> required – e.g., 10000001 MAT-SPICE-001 – prod_item – valuation_class RAW→1400000001 BSX – T0 – determines BSX in GR</div>
              <div>• <b>Posting Period OB52 K</b> must be open for account type K Vendors – else error – FPPE – F_BKPF_BUP – T0 – K</div>
              <div>• <b>Number Range PO 4500000000</b> numeric only always_auto – assignment per company YZX to PO via assignment table – error_and_extend – FNRC FBN1 – user cannot type random – PO 4500000000 PR 1000000000 GR 5000000000 always auto – block_manual for PRODUCT_CODE always_auto for PO/PR/GR per user selection 2026-05-13</div>
              <div>• <b>Info Record ME11</b> – if unit_price 0, lookup proc_info_record vendor-material valid_from valid_to → auto price – T2 GOOD OPERATIONAL – e.g., VEND-1000 + 10000001 → 100 – used in PO – landed cost</div>
              <div>• <b>Payment Terms FAPT</b> – calculate due date from posting date + days – e.g., NT30 Net 30 – due_calc – posting 2026-05-15 + 30 days = 2026-06-14 due – discount_date – e.g., 2% 10 Net 30</div>
              <div>• <b>Workflow ME28 SBWP</b> – PO created → wf_instance PENDING_APPROVAL + wf_task PENDING for manager/owner → SBWP inbox → Approve → PO status APPROVED → can do GR IGRC MIGO 101 – auto-start if amount &gt; threshold – manager only &lt;10000 manager+owner dual &gt;10000 – dual approval</div>
              <div>• <b>ELIKZ</b> – delivery_completed flag – PO line delivery_completed true when fully received – BOOL_AND delivery_completed – all_elikz – T0 – controls PO closure – e.g., ordered 10 received 10 → ELIKZ true → PO CLOSED</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">🛒</div>
          <div>
            <div className="font-semibold">Purchase Orders – PPOC (alias ME21N) – SAP Standard – Org Wired – Info Record ME11 – Payment Terms FAPT – Workflow ME28 – ELIKZ</div>
            <div className="text-xs text-zinc-500">{Array.isArray(items)?items.length:0} POs • COMPANY_CODE {companyCode} • API: POST /api/po – facility EFCC + vendor PSUC + legal entity ELEC + material EMTC + inventory location EILC + UoM EUOC + currency FCYC + payment terms FAPT + info record ME11 + posting period K OB52 – T0 BLOCKING – number range PO 4500000000 – workflow SBWP – ELIKZ</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DbAutocomplete
            label="FACILITY * – EFCC OX10 – plant – 1000"
            value={facilityCode}
            onChange={v=>setFacilityCode(v)}
            apiUrl="/api/facilities"
            codeField="code"
            nameField="name"
            placeholder="1000"
            required
            createUrl={`/${companyCode}/foundation/facilities`}
            createCode="EFCC"
            companyCode={companyCode}
          />
          <DbAutocomplete
            label="VENDOR * – PSUC XK01 – VEND-1000 – T0 – supplier master"
            value={partnerNumber}
            onChange={v=>setPartnerNumber(v)}
            apiUrl="/api/business-partners?role=VENDOR"
            codeField="account_number"
            nameField="display_name"
            placeholder="VEND-1000"
            required
            createUrl={`/${companyCode}/foundation/suppliers`}
            createCode="PSUC"
            companyCode={companyCode}
          />
          <DbAutocomplete
            label="LEGAL_ENTITY * – ELEC OX02 – company code"
            value={legalEntityCode}
            onChange={v=>setLegalEntityCode(v)}
            apiUrl="/api/legal-entities"
            codeField="code"
            nameField="name"
            placeholder={companyCode}
            required
            createUrl={`/${companyCode}/foundation/legal-entities`}
            createCode="ELEC"
            companyCode={companyCode}
          />
          <DbAutocomplete
            label="PR_NUMBER – PPRC – optional – PR-10000001 – PR→PO"
            value={prNumber}
            onChange={v=>setPrNumber(v)}
            apiUrl="/api/pr"
            codeField="pr_number"
            nameField="pr_number"
            placeholder="PR-10000001"
            createUrl={`/${companyCode}/mm/pr`}
            createCode="PPRC"
            companyCode={companyCode}
          />
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">DELIVERY_DATE * – OB52 – F_BKPF_BUP</label>
            <input type="date" value={deliveryDate} onChange={e=>setDeliveryDate(e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          <DbAutocomplete
            label="CURRENCY – FCYC OY03 – INR"
            value={currencyCode}
            onChange={v=>setCurrencyCode(v)}
            apiUrl="/api/currencies"
            codeField="code"
            nameField="name"
            placeholder="INR"
            createUrl={`/${companyCode}/fico/currencies`}
            createCode="FCYC"
            companyCode={companyCode}
          />
          <DbAutocomplete
            label="PAYMENT_TERM_CODE – FAPT – NT30 – due date calc – payment terms – wiring to supplier + PO + IV + F110 – T0"
            value={paymentTermCode}
            onChange={v=>setPaymentTermCode(v)}
            apiUrl="/api/payment-terms"
            codeField="code"
            nameField="name"
            placeholder="NT30"
            createUrl={`/${companyCode}/fico/payment-terms`}
            createCode="FAPT"
            companyCode={companyCode}
          />
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">PAYMENT_TERMS_DAYS – FAPT – 30 – derived from code NT30 – due calc</label>
            <input value={paymentTermsDays} onChange={e=>setPaymentTermsDays(e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="30" />
            <p className="text-[10px] text-zinc-400 mt-1">FAPT – days derived from payment_term_code NT30 – due = posting + days – e.g., NT30 30 days due = posting +30 – discount if 2-10-N30 – wiring to fin_payment_term</p>
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">INCOTERMS – EXW/FOB/CIF – delivery terms – incoterms</label>
            <select value={incoterms} onChange={e=>setIncoterms(e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black">
              <option value="EXW">EXW – Ex Works</option>
              <option value="FOB">FOB – Free On Board</option>
              <option value="CIF">CIF – Cost Insurance Freight</option>
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">HEADER_TEXT – BKTXT</label>
            <input value={headerText} onChange={e=>setHeaderText(e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder={`PO for ${partnerNumber} – PPOC ME21N – ${companyCode} – facility ${facilityCode}`} />
          </div>
        </div>

        <div className="mt-6 border rounded-2xl p-4 bg-blue-50/50 border-blue-200">
          <div className="flex justify-between items-center mb-3">
            <div className="font-bold text-sm">Lines – {lines.length} – Material + Qty + UoM + Price + Freight + Customs + Tax + SLOC + Item Text + Delivery Text – EMTC + EUOC + EILC + FCOC + FTXC – Info Record ME11 – Org Wired – T0 – landed cost</div>
            <button onClick={addLine} className="px-3 py-1 rounded-full border bg-white text-xs hover:bg-zinc-50">+ Add Line</button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {lines.map((line, idx)=>(
              <div key={idx} className="border rounded-xl p-3 bg-white">
                <div className="flex gap-3 items-start">
                  <div className="font-mono font-bold text-sm mt-2">{(idx+1)*10}</div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-8 gap-3">
                    <DbAutocomplete
                      label="MATERIAL * – EMTC"
                      value={line.item_number}
                      onChange={v=>updateLine(idx,'item_number',v)}
                      apiUrl="/api/materials"
                      codeField="item_number"
                      nameField="description"
                      placeholder="10000001"
                      required
                      createUrl={`/${companyCode}/foundation/materials`}
                      createCode="EMTC"
                      companyCode={companyCode}
                    />
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase">Qty *</label>
                      <input value={line.quantity} onChange={e=>updateLine(idx,'quantity',e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-sm" placeholder="10" />
                    </div>
                    <DbAutocomplete
                      label="UoM – EUOC"
                      value={line.uom_code}
                      onChange={v=>updateLine(idx,'uom_code',v)}
                      apiUrl="/api/uom"
                      codeField="code"
                      nameField="name"
                      placeholder="PC"
                      createUrl={`/${companyCode}/foundation/uom`}
                      createCode="EUOC"
                      companyCode={companyCode}
                    />
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase">Unit Price – ME11 auto if 0</label>
                      <input value={line.unit_price} onChange={e=>updateLine(idx,'unit_price',e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-sm" placeholder="100" />
                      <p className="text-[9px] text-zinc-400">ME11 – if 0 auto lookup info record</p>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase">Freight /unit</label>
                      <input value={line.freight_per_unit} onChange={e=>updateLine(idx,'freight_per_unit',e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-sm" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase">Customs /unit</label>
                      <input value={line.customs_per_unit} onChange={e=>updateLine(idx,'customs_per_unit',e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-sm" placeholder="0" />
                    </div>
                    <DbAutocomplete
                      label="Tax Code – FTXC – GST18"
                      value={line.tax_code}
                      onChange={v=>updateLine(idx,'tax_code',v)}
                      apiUrl="/api/tax-codes"
                      codeField="code"
                      nameField="description"
                      placeholder="GST18"
                      createUrl={`/${companyCode}/fico/tax-codes`}
                      createCode="FTXC"
                      companyCode={companyCode}
                    />
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase">Over Tol % – overdelivery</label>
                      <input value={line.overdelivery_tolerance_percent} onChange={e=>updateLine(idx,'overdelivery_tolerance_percent',e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-sm" placeholder="10" />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase">Under Tol % – underdelivery</label>
                      <input value={line.underdelivery_tolerance_percent} onChange={e=>updateLine(idx,'underdelivery_tolerance_percent',e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-sm" placeholder="10" />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase">SLOC + Texts + Version History</label>
                      <div className="flex gap-1">
                        <input value={line.inventory_location_code} onChange={e=>updateLine(idx,'inventory_location_code',e.target.value.toUpperCase())} className="w-[60px] border rounded-lg px-2 py-1.5 text-sm uppercase" placeholder="SL01" />
                        <input value={line.item_text} onChange={e=>updateLine(idx,'item_text',e.target.value)} className="flex-1 border rounded-lg px-2 py-1.5 text-sm" placeholder="Item text" />
                        <button onClick={()=>removeLine(idx)} className="px-2 py-1 rounded-lg border bg-red-50 text-xs">X</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">Info Record ME11 – if unit_price 0, auto lookup proc_info_record vendor-material valid_from valid_to → price – T2 – e.g., VEND-1000 + 10000001 → 100 – used in PO – landed cost relevant – total_per_unit = unit_price + freight + customs + tax – total_amount sum qty*unit_price – total_landed_cost sum qty*total_per_unit – ELIKZ delivery_completed – BOOL_AND – all_elikz</p>
        </div>

        <button onClick={create} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">
          Create PO – ME21N – PPOC – T0 BLOCKING – Posting Period K OB52 – Number Range PO 4500000000 – Info Record ME11 – Payment Terms FAPT – Workflow ME28 – ELIKZ – {elapsed>0?`${elapsed}s elapsed – after 10s auto background`:''}
        </button>
        <p className="text-[10px] text-zinc-400 mt-2 text-center">PO requires facility EFCC + vendor PSUC + legal entity ELEC + material EMTC + inventory location EILC + UoM EUOC + currency FCYC + payment terms FAPT + info record ME11 + procurement division EPDC + buyer team EBTC – posting period K OB52 must be open – number range PO 4500000000 numeric only assignment per company error_and_extend – info record auto price if 0 – payment terms due calc – workflow auto-start ME28 SBWP – ELIKZ delivery_completed – flow PR→PO→GR→IV→Payment – T0 BLOCKING – NO DANGLING – org wired</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(Array.isArray(items)?items:[]).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start">
              <div className="font-semibold text-sm">{it.po_number || it.code} – {it.status} – Vendor {it.vendor_name} – Facility {it.facility_code || it.plant_code} – {it.company_code}</div>
              <span className="text-[10px] bg-zinc-900 text-white rounded-full px-2 py-0.5">ME21N</span>
            </div>
            <div className="mt-2 text-xs text-zinc-500">Lines {it.line_count} – Ordered {it.total_ordered_qty} Received {it.total_received_qty} Invoiced {it.total_invoiced_qty || 0} Open {(it.total_ordered_qty - (it.total_received_qty || 0))} – Total {it.total_amount} {it.currency} – Delivery {it.delivery_date} – All ELIKZ {String(it.all_elikz)} – PR Ref {it.pr_ref} – Payment Term {it.payment_term_code || 'NT30'} – Recon FGLC {it.vendor_recon_account_id ? 'wired' : 'default'} – Tax FTXC {it.tax_code || 'GST18'} – Version {it.version || 1}</div>
            <div className="mt-1 text-[10px] text-zinc-400">Version History ME22N CDHDR/CDPOS WORM-lite – {it.version ? `v${it.version}` : 'v1'} – {it.change_history ? JSON.stringify(it.change_history).slice(0,250) : 'Initial CREATE – change_history JSONB – version increment on change – audit trail – purchasing conditions BASE/FREIGHT/CUSTOMS/TAX – partial GR/IV – over/under tolerance 10%/10% – invoice tolerance OBA0/OBA4 VEND-01 – cancellation/reversal PORE/GRRE/IVRE – credit/debit memo RE_CREDIT – approval workflow SBWP'} – Partial GR MIGO 101 – Partial IV MIRO 51 RE – Over/Under Tolerance UEBTO/UNTTO – Invoice Qty/Value Tolerance OBA0/OBA4 – Cancellation/Reversal GRRE/IVRE/PORE – Credit/Debit Memo RE_CREDIT – Approval Workflow SBWP ME28</div>
            <div className="mt-2 flex gap-2 flex-wrap">
              <Link href={`/${companyCode}/mm/gr`} className="text-[11px] px-2 py-1 rounded-full border bg-zinc-50 hover:bg-zinc-100">IGRC GR for PO {it.po_number} → MIGO 101 – partial GR – over/under tolerance – ELIKZ</Link>
              <Link href={`/${companyCode}/mm/iv`} className="text-[11px] px-2 py-1 rounded-full border bg-zinc-50 hover:bg-zinc-100">PIVC IV for PO {it.po_number} → MIRO 51 RE – partial IV – qty/value tolerance – credit memo</Link>
              <Link href={`/${companyCode}/workflow/inbox`} className="text-[11px] px-2 py-1 rounded-full border bg-zinc-50 hover:bg-zinc-100">SBWP Release PO ME28 → Manager &lt;10000 Owner &gt;=10000 dual</Link>
              <Link href={`/${companyCode}/audit/document-flow?type=PO&id=${it.id}`} className="text-[11px] px-2 py-1 rounded-full border bg-zinc-50 hover:bg-zinc-100">FDFL Doc Flow VBFA → PR→PO→GR→IV→Payment – ALB – WORM-lite</Link>
            </div>
          </div>
        ))}
        {(!items || (Array.isArray(items) && items.length===0)) && (
          <div className="col-span-2 bg-white rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
            <div className="text-sm text-zinc-500">No PO yet – create first via ME21N – PPOC – requires facility + vendor + legal entity + material – org wired – posting period K OB52 – number range PO 4500000000 – info record ME11 – payment terms FAPT – workflow ME28 – ELIKZ</div>
            <div className="text-xs text-zinc-400 mt-1">COMPANY_CODE {companyCode} • Flow: PPRC ME51N PR → PPOC ME21N PO → IGRC MIGO 101 GR → PIVC MIRO IV → FPYP F110 Payment</div>
          </div>
        )}
      </div>

      <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related Masters – auto from dependencies – low importance – Org Wired</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/foundation/suppliers`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PSUC</span><span>Supplier – XK01 – required – T0 – vendor master – currency_code FCYC payment_term_code FAPT recon_account FGLC procurement_division EPDC buyer_team EBTC</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/materials`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EMTC</span><span>Material – MM01 – required – T0 – valuation_class BSX</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/facilities`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EFCC</span><span>Facility – OX10 – plant – required – T0</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/inventory-locations`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EILC</span><span>Inventory Location – OX09 – SLOC – SL01</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/mm/info-records`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">ME11</span><span>Info Records – vendor-material price – T2 – auto price if 0</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/payment-terms`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FAPT</span><span>Payment Terms – NT30 – due calc – payment_terms_days</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/mm/gr`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">IGRC</span><span>GR uses PO – MIGO 101 – IGRC – BSX/WRX – T0</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/workflow/inbox`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SBWP</span><span>Workflow Inbox – ME28 Release PO – approval – manager/owner dual</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/number-ranges`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FNRC</span><span>Number Ranges – FBN1 – PO 4500000000 – assignment per company – YZX to PO</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">Flow: PR (ME51N PPRC) → PO (ME21N PPOC) → GR (MIGO 101 IGRC) → IV (MIRO PIVC) → Payment (F110 FPYP) – industry standard MM – T0 BLOCKING – NO DANGLING – org wired – facility EFCC + vendor PSUC + legal entity ELEC + material EMTC + inventory location EILC + UoM EUOC + currency FCYC + payment terms FAPT + info record ME11 + procurement division EPDC + buyer team EBTC + cost center FCOC + GL FGLC + tax FTXC + movement type FMTM + auto account FAUC + number range FNRC + posting period FPPE + fiscal FFYC – ELIKZ delivery_completed – BOOL_AND – all_elikz – PO closure</p>
      </div>
    </div>
  );

  return (
    <RoleGuard requiredPermission="PO_CREATE" requiredRoles={['PURCHASER','ADMIN','OWNER','MANAGER']}>
      <ModernModuleShell title="Purchase Orders" subtitle={`${Array.isArray(items)?items.length:0} POs • ${companyCode} • ME21N – Org Wired – Info Record ME11 – Payment Terms FAPT – Posting Period K – Number Range PO 4500000000 – Workflow ME28 – ELIKZ`} code="PPOC" module="MM" classicChildren={classicContent}>
        {modernContent}
      </ModernModuleShell>
    </RoleGuard>
  );
}
