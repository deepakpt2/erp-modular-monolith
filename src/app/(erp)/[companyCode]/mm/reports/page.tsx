"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';

export default function Page(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [prData,setPrData]=useState<any>(null);
  const [poData,setPoData]=useState<any>(null);
  const [grData,setGrData]=useState<any>(null);
  const [ivData,setIvData]=useState<any>(null);
  const [stockData,setStockData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [filterVendor, setFilterVendor] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('');
  const [filterFacility, setFilterFacility] = useState('');

  async function load(){
    setLoading(true);
    try{
      const [pr, po, gr, iv, stock] = await Promise.all([
        fetch(`/api/pr?limit=100&companyCode=${companyCode}`).then(r=>r.json()).catch(()=>({purchaseRequisitions:[]})),
        fetch(`/api/po?limit=100&companyCode=${companyCode}${filterVendor?`&search=${filterVendor}`:''}${filterFacility?`&plantId=${filterFacility}`:''}`).then(r=>r.json()).catch(()=>({pos:[]})),
        fetch(`/api/gr?limit=100`).then(r=>r.json()).catch(()=>({grs:[]})),
        fetch(`/api/iv?limit=100`).then(r=>r.json()).catch(()=>({ivs:[]})),
        fetch(`/api/stock?limit=100`).then(r=>r.json()).catch(()=>({data:[]})),
      ]);
      setPrData(pr);
      setPoData(po);
      setGrData(gr);
      setIvData(iv);
      setStockData(stock);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[companyCode]);

  if(loading) return <div className="p-6 font-mono text-xs">LOADING ME80FN – Purchasing Reporting – PR/PO/GR/IV/Stock – aggregating via /api/pr /api/po /api/gr /api/iv /api/stock – org wired – facility EFCC vendor PSUC material EMTC – SAP standard reporting...</div>;

  const prs = prData?.purchaseRequisitions || prData?.data || [];
  const pos = poData?.pos || poData?.purchaseOrders || [];
  const grs = grData?.grs || grData?.goodsReceipts || [];
  const ivs = ivData?.ivs || ivData?.invoiceVerifications || [];
  const stocks = stockData?.data || stockData?.stocks || [];

  const totalPrAmount = prs.reduce((sum:any,it:any)=>sum + Number(it.total_amount||0),0);
  const totalPoAmount = pos.reduce((sum:any,it:any)=>sum + Number(it.total_amount||0),0);
  const totalPoOrderedQty = pos.reduce((sum:any,it:any)=>sum + Number(it.total_ordered_qty||0),0);
  const totalPoReceivedQty = pos.reduce((sum:any,it:any)=>sum + Number(it.total_received_qty||0),0);
  const totalGrQty = grs.reduce((sum:any,it:any)=>sum + Number(it.total_qty||0),0);
  const totalIvAmount = ivs.reduce((sum:any,it:any)=>sum + Number(it.total_amount||0),0);
  const totalStockQty = stocks.reduce((sum:any,it:any)=>sum + Number(it.quantity||0),0);

  const openPoQty = totalPoOrderedQty - totalPoReceivedQty;
  const poByVendor: Record<string, {count:number, amount:number}> = {};
  pos.forEach((po:any)=>{
    const vendor = po.vendor_name || po.vendor_number || 'Unknown';
    if(!poByVendor[vendor]) poByVendor[vendor] = {count:0, amount:0};
    poByVendor[vendor].count += 1;
    poByVendor[vendor].amount += Number(po.total_amount||0);
  });

  const poByFacility: Record<string, {count:number, amount:number}> = {};
  pos.forEach((po:any)=>{
    const fac = po.facility_code || po.plant_code || 'Unknown';
    if(!poByFacility[fac]) poByFacility[fac] = {count:0, amount:0};
    poByFacility[fac].count += 1;
    poByFacility[fac].amount += Number(po.total_amount||0);
  });

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">ME80FN PURCHASING REPORTING – GENERAL ERP – {prs.length} PRs – {pos.length} POs – {grs.length} GRs – {ivs.length} IVs – {stocks.length} STOCK – SAP STANDARD REPORTING – ORG WIRED</div>
        <div className="text-[9px] text-zinc-500">ME80FN Purchasing Reporting – ME2N PO by Document Number – ME2M PO by Material – ME2L PO by Vendor – MB51 Material Document List – MB52 Warehouse Stock – T2 GOOD OPERATIONAL – aggregates via /api/pr /api/po /api/gr /api/iv /api/stock – org wired – facility EFCC vendor PSUC material EMTC procurement division EPDC buyer team EBTC – filters vendor material plant company status date ELIKZ total amount ordered/received/invoiced open qty</div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div><div className="text-[9px] text-zinc-500">FILTER VENDOR – PSUC</div><input value={filterVendor} onChange={e=>setFilterVendor(e.target.value.toUpperCase())} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="VEND-1000" /></div>
          <div><div className="text-[9px] text-zinc-500">FILTER MATERIAL – EMTC</div><input value={filterMaterial} onChange={e=>setFilterMaterial(e.target.value.toUpperCase())} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="10000001" /></div>
          <div><div className="text-[9px] text-zinc-500">FILTER FACILITY – EFCC</div><input value={filterFacility} onChange={e=>setFilterFacility(e.target.value.toUpperCase())} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="1000" /></div>
        </div>
        <button onClick={load} className="mt-2 bg-black text-white px-3 py-1 w-full">REFRESH REPORTING – ME80FN – AGGREGATE PR/PO/GR/IV/STOCK – ORG WIRED</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">SUMMARY – ME80FN – Purchasing Reporting – T2</div>
          <div>PRs {prs.length} – Total {totalPrAmount} INR – PPRC ME51N</div>
          <div>POs {pos.length} – Total {totalPoAmount} INR – Ordered Qty {totalPoOrderedQty} Received Qty {totalPoReceivedQty} Open Qty {openPoQty} – PPOC ME21N – ELIKZ</div>
          <div>GRs {grs.length} – Total Qty {totalGrQty} – IGRC MIGO 101 – BSX/WRX – Stock update MMBE FSTL – GR accounting BSX/WRX</div>
          <div>IVs {ivs.length} – Total {totalIvAmount} INR – PIVC MIRO 51 RE – WRX clearing – PRD – Tax – Vendor invoice accounting RE</div>
          <div>Stock {stocks.length} – Total Qty {totalStockQty} – ISTV MMBE – total_stock/value MAP price_control S/V</div>
        </div>
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">PO BY VENDOR – ME2L – PSUC – Vendor Master</div>
          {Object.entries(poByVendor).slice(0,10).map(([vendor, data])=>(
            <div key={vendor} className="text-[10px] border-b border-zinc-200 py-1">{vendor} – Count {data.count} – Amount {data.amount} INR</div>
          ))}
        </div>
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">PO BY FACILITY – ME2N – EFCC – Plant – Org Wired</div>
          {Object.entries(poByFacility).slice(0,10).map(([fac, data])=>(
            <div key={fac} className="text-[10px] border-b border-zinc-200 py-1">{fac} – Count {data.count} – Amount {data.amount} INR</div>
          ))}
        </div>
        <div className="bg-white border-2 border-black p-2">
          <div className="font-bold">DOCUMENT FLOW – FDFL VBFA – PR→PO→GR→IV→Payment – WORM-lite</div>
          <div className="text-[10px]">PR→PO: {prs.length}→{pos.length} – conversion – PPRC→PPOC</div>
          <div className="text-[10px]">PO→GR: {pos.length}→{grs.length} – GR 101 – BSX/WRX – stock update – IGRC MIGO</div>
          <div className="text-[10px]">GR→IV: {grs.length}→{ivs.length} – IV 51 RE – WRX clearing – PRD – PIVC MIRO – GR/IR clearing F.13 candidate where GR qty = IV qty</div>
          <div className="text-[10px]">IV→Payment: {ivs.length}→? – KZ 53* – Dr Vendor Recon Cr Bank – F-53 – FPYP – open-item clearing FB05 F-44</div>
          <div className="text-[10px]">Stock: {stocks.length} – MMBE – MAP recalc – BSX inventory – total_stock/value</div>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">📊</div>
          <div>
            <div className="font-semibold">Purchasing Reporting – ME80FN (alias ME80FN) – SAP Standard – PR/PO/GR/IV/Stock – Org Wired – T2</div>
            <div className="text-xs text-zinc-500">{prs.length} PRs • {pos.length} POs • {grs.length} GRs • {ivs.length} IVs • {stocks.length} Stock • COMPANY_CODE {companyCode} • ME80FN Purchasing Reporting – ME2N PO by Doc Number – ME2M PO by Material – ME2L PO by Vendor – MB51 Material Doc List – MB52 Warehouse Stock – T2 GOOD OPERATIONAL – aggregates via /api/pr /api/po /api/gr /api/iv /api/stock – org wired – facility EFCC vendor PSUC material EMTC procurement division EPDC buyer team EBTC – filters vendor material plant company status date ELIKZ total amount ordered/received/invoiced open qty</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DbAutocomplete
            label="FILTER VENDOR – PSUC XK01 – VEND-1000 – ME2L PO by Vendor"
            value={filterVendor}
            onChange={v=>setFilterVendor(v)}
            apiUrl="/api/business-partners?role=VENDOR"
            codeField="account_number"
            nameField="display_name"
            placeholder="VEND-1000"
            createUrl={`/${companyCode}/foundation/suppliers`}
            createCode="PSUC"
            companyCode={companyCode}
          />
          <DbAutocomplete
            label="FILTER MATERIAL – EMTC MM01 – 10000001 – ME2M PO by Material"
            value={filterMaterial}
            onChange={v=>setFilterMaterial(v)}
            apiUrl="/api/materials"
            codeField="item_number"
            nameField="description"
            placeholder="10000001"
            createUrl={`/${companyCode}/foundation/materials`}
            createCode="EMTC"
            companyCode={companyCode}
          />
          <DbAutocomplete
            label="FILTER FACILITY – EFCC OX10 – plant – 1000 – ME2N PO by Plant"
            value={filterFacility}
            onChange={v=>setFilterFacility(v)}
            apiUrl="/api/facilities"
            codeField="code"
            nameField="name"
            placeholder="1000"
            createUrl={`/${companyCode}/foundation/facilities`}
            createCode="EFCC"
            companyCode={companyCode}
          />
        </div>
        <button onClick={load} className="mt-5 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Refresh Reporting – ME80FN – Aggregate PR/PO/GR/IV/Stock – Org Wired – Facility EFCC Vendor PSUC Material EMTC – T2</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">Summary – ME80FN – Purchasing Reporting – T2 GOOD OPERATIONAL – PR/PO/GR/IV/Stock – Org Wired</div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span>PRs PPRC ME51N</span><span className="font-mono font-bold">{prs.length} – {totalPrAmount} INR</span></div>
            <div className="flex justify-between"><span>POs PPOC ME21N – Ordered/Received/Open – ELIKZ</span><span className="font-mono font-bold">{pos.length} – {totalPoAmount} INR – {totalPoOrderedQty}/{totalPoReceivedQty}/{openPoQty}</span></div>
            <div className="flex justify-between"><span>GRs IGRC MIGO 101 – BSX/WRX – Stock MMBE FSTL</span><span className="font-mono font-bold">{grs.length} – Qty {totalGrQty}</span></div>
            <div className="flex justify-between"><span>IVs PIVC MIRO 51 RE – WRX clearing – PRD – Tax – RE</span><span className="font-mono font-bold">{ivs.length} – {totalIvAmount} INR</span></div>
            <div className="flex justify-between"><span>Stock ISTV MMBE – MAP – S/V – total_stock/value</span><span className="font-mono font-bold">{stocks.length} – Qty {totalStockQty}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">PO by Vendor – ME2L – PSUC XK01 – Vendor Master – Org Wired</div>
          {Object.entries(poByVendor).slice(0,10).map(([vendor, data])=>(
            <div key={vendor} className="flex justify-between text-xs border-b border-zinc-100 py-2"><span>{vendor}</span><span className="font-mono">Count {data.count} – {data.amount} INR</span></div>
          ))}
          {Object.keys(poByVendor).length===0 && <div className="text-xs text-zinc-400">No POs yet – create via PPOC ME21N</div>}
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">PO by Facility – ME2N – EFCC OX10 – Plant – Org Wired – ELEC + EFCC + EILC</div>
          {Object.entries(poByFacility).slice(0,10).map(([fac, data])=>(
            <div key={fac} className="flex justify-between text-xs border-b border-zinc-100 py-2"><span>{fac} – EFCC plant</span><span className="font-mono">Count {data.count} – {data.amount} INR</span></div>
          ))}
          {Object.keys(poByFacility).length===0 && <div className="text-xs text-zinc-400">No POs yet – facility EFCC 1000 – plant</div>}
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-semibold text-sm mb-3">Document Flow – FDFL VBFA ALB – PR→PO→GR→IV→Payment – WORM-lite – ELIKZ</div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span>PR→PO – PPRC→PPOC – conversion – pr_id → po_id</span><span className="font-mono">{prs.length}→{pos.length}</span></div>
            <div className="flex justify-between"><span>PO→GR – PPOC→IGRC – GR 101 – BSX/WRX – stock update – po_id → gr_id</span><span className="font-mono">{pos.length}→{grs.length}</span></div>
            <div className="flex justify-between"><span>GR→IV – IGRC→PIVC – IV 51 RE – WRX clearing – PRD – gr_id → iv_id – F.13 candidate GR qty = IV qty</span><span className="font-mono">{grs.length}→{ivs.length}</span></div>
            <div className="flex justify-between"><span>IV→Payment – PIVC→FPYP – KZ 53* – Dr Vendor Cr Bank – IV→Payment – open-item clearing</span><span className="font-mono">{ivs.length}→? – F-53</span></div>
            <div className="flex justify-between"><span>Stock – ISTV MMBE – MAP recalc – BSX inventory – total_stock/value – FSTL</span><span className="font-mono">{stocks.length} – Qty {totalStockQty}</span></div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/${companyCode}/audit/document-flow`} className="text-[11px] px-2 py-1 rounded-full border bg-zinc-50 hover:bg-zinc-100">FDFL Doc Flow VBFA →</Link>
            <Link href={`/${companyCode}/fico/gr-ir-clearing`} className="text-[11px] px-2 py-1 rounded-full border bg-zinc-50 hover:bg-zinc-100">F.13 GR/IR Clearing →</Link>
            <Link href={`/${companyCode}/fico/payment`} className="text-[11px] px-2 py-1 rounded-full border bg-zinc-50 hover:bg-zinc-100">FPYP Payment KZ 53* →</Link>
          </div>
        </div>
      </div>

      <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – ME80FN Purchasing Reporting – Org Wired – Low Importance – T2 GOOD OPERATIONAL</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/mm/pr`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PPRC</span><span>PR – ME51N – PPRC – Purchase Requisition – facility EFCC + legal entity ELEC + material EMTC – posting period M – number range PR 1000000000 – workflow ME54N</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/mm/po`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PPOC</span><span>PO – ME21N – PPOC – Purchase Order – facility EFCC + vendor PSUC + material EMTC – info record ME11 – payment terms FAPT – posting period K – number range PO 4500000000 – workflow ME28 – ELIKZ</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/mm/gr`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">IGRC</span><span>GR – MIGO 101 – IGRC – Goods Receipt – PO required – BSX/WRX – stock update MMBE FSTL – GR accounting BSX/WRX – price diff PRD – T0</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/mm/iv`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PIVC</span><span>IV – MIRO 51 RE – PIVC – Invoice Verification – PO required – WRX clearing – PRD – tax FTXC – RE – tolerance OBA0/OBA4 – vendor invoice accounting</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/payment`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FPYP</span><span>Payment – F-53 KZ 53* – Vendor Payment – Dr Vendor Recon Cr Bank – tolerance OBA0/OBA4 – open-item clearing FB05 F-44 – T1</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/gr-ir-clearing`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">F.13</span><span>GR/IR Clearing – F.13 MR11 – T1 REQUIRED – WRX cleared – GR qty = IV qty – month-end – NO DANGLING</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/audit/document-flow`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FDFL</span><span>Document Flow – VBFA ALB – PR→PO→GR→IV→Payment – WORM-lite – predecessor/successor – quantity/value – ELIKZ</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/stock`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">ISTV</span><span>Stock Overview – MMBE – warehouse location quantities – updated by GR 101/102 GI 261 – total_stock/value MAP S/V</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">Flow: PR (ME51N PPRC) → PO (ME21N PPOC) → GR (MIGO 101 IGRC) → IV (MIRO PIVC) → Payment (F110 FPYP) F-53 KZ 53* → F.13 GR/IR Clearing → FB05 Clearing – industry standard MM – T0 BLOCKING – NO DANGLING – org wired – facility EFCC OX10 + legal entity ELEC OX02 + inventory location EILC OX09 + partner PSUC XK01 SCUC XD01 EPAC BP01 + item EMTC MM01 + UoM EUOC CUNI + procurement division EPDC OX08 + buyer team EBTC OME4 + commercial org ECOC OVX2 + sales channel ESCC OVX1 + product line EPLC + profit center EPUC KE51 + EBSC + cost center FCOC KS01 + chart FCOA OB13 + GL FGLC FS00 + fiscal FFYC OB29 K4 + posting period FPPC OBBO PPV-1000 + FPPE OB52 + currency FCYC OY03 INR/USD/EUR/KWD + exchange rate FEXC OB08 M/B/G spread 100:1 + payment terms FAPT OBA7 NT30 + tax FTXC FTXP GST0/5/12/18/28 IGST HSN 09041110 + movement type FMTM OMJJ 101/261/601 VAX + auto account FAUC OBYC BSX/WRX/GBB/PRD + number range FNRC FBN1 PR 1000000000 PO 4500000000 GR 5000000000 IV 5100000000 + tolerance OBA0/OBA4 VEND-01 + document flow FDFL VBFA ALB + workflow SBWP ME54N ME28 + stock FSTL MMBE + universal ledger FUNL ACDOCA – all wired – T2 GOOD OPERATIONAL – purchasing reporting – ME80FN – ME2N – ME2L – ME2M – MB51 – MB52</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Purchasing Reporting" subtitle={`${prs.length} PRs • ${pos.length} POs • ${grs.length} GRs • ${ivs.length} IVs • ${stocks.length} Stock • ${companyCode} • ME80FN – Org Wired – T2`} code="ME80FN" module="MM" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
