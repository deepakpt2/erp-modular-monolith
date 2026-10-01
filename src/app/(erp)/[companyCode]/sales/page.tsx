"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';

export default function Page({ defaultMode }: { defaultMode?: any } = {}){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');
  const [form,setForm]=useState({customer_code: "", facility_code: "", commercial_org_code: "CO-1000", sales_channel_code: "CH-10", product_line_code: "PL-00", pricing_procedure: "ZPR00", customer_po: ""});
  const [lines,setLines]=useState<any[]>([{product_code: "", quantity: "10", unit_price: "100", uom_code: "PC", discount_percent: "0", tax_code: "GST18"}]);

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/sales-orders').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!form.customer_code){ setMsg('❌ CUSTOMER_CODE required – SCUC – General ERP Customer – alias XD01 – T0 BLOCKING – sales area required'); return; }
    if(!form.facility_code){ setMsg('❌ FACILITY_CODE required – EFCC – General ERP Facility – alias Plant'); return; }
    const payload = {
      customer_code: form.customer_code,
      partner_code: form.customer_code,
      facility_code: form.facility_code,
      plant_code: form.facility_code,
      commercial_org_code: form.commercial_org_code,
      sales_org: form.commercial_org_code,
      sales_channel_code: form.sales_channel_code,
      distribution_channel: form.sales_channel_code,
      product_line_code: form.product_line_code,
      division: form.product_line_code,
      customer_po_number: form.customer_po,
      company_code: companyCode,
      items: lines.filter(l=>l.product_code).map((l,i)=>({
        item_number: l.product_code,
        quantity: l.quantity,
        unit_price: l.unit_price,
        uom_code: l.uom_code,
        discount_percent: l.discount_percent,
        tax_code: l.tax_code,
        line_number: (i+1)*10
      }))
    };
    const res = await fetch('/api/sales-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ Sales Order ${res.salesNumber || res.salesOrder?.sales_number} created – SSOC alias VA01 – General ERP – ${lines.filter(l=>l.product_code).length} lines – Pricing PR00 ${res._calculated_net ? `net ${res._calculated_net} tax ${res._calculated_tax} total ${res._calculated_total}` : ''} – T0 BLOCKING – uses VK11 condition records PR00 base price, K004 discount, MWST tax – pricing procedure ${form.pricing_procedure} determination: customer+sales area → procedure → access sequence V/07 → condition records – NO DANGLING – next: Delivery SDLC SDLC (legacy VL01N) → PGI 601 INV_OFFSET/INV_POSTING (legacy GBB/BSX) → Billing SBLC SBLC (legacy VF01) VKOA KOFI/KOFK`);
      load();
      setLines([{product_code: "", quantity: "10", unit_price: "100", uom_code: "PC", discount_percent: "0", tax_code: "GST18"}]);
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING SSOC – Sales Orders – General ERP alias VA01 – T0 BLOCKING – Pricing VK11 + Sales Area SCUC-FULL...</div>;
  const items = data?.salesOrders || data?.data || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">SSOC SALES ORDER CREATE – GENERAL ERP – ALIAS VA01 – {Array.isArray(items)?items.length:0} RECORDS – T0 BLOCKING – SCUC-FULL + PRICING VK11 + VKOA – NO DANGLING</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">CUSTOMER_CODE * (SCUC XD01) – General ERP Customer – sales area required – pricing, credit check, payment terms</div><input value={form.customer_code} onChange={e=>setForm({...form,customer_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">FACILITY_CODE * (EFCC EFCC (legacy OX10)) – General ERP Facility – alias Plant – shipping point DP-1000 derived</div><input value={form.facility_code} onChange={e=>setForm({...form,facility_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">CUSTOMER_PO – General ERP Customer Purchase Order reference</div><input value={form.customer_po} onChange={e=>setForm({...form,customer_po:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">COMMERCIAL_ORG_CODE (ECOC OVX2) – General ERP Commercial Org – alias Sales Org – pricing procedure determination</div><input value={form.commercial_org_code} onChange={e=>setForm({...form,commercial_org_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">SALES_CHANNEL_CODE (ESCC OVTB) – General ERP Sales Channel – alias Distribution Channel</div><input value={form.sales_channel_code} onChange={e=>setForm({...form,sales_channel_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">PRODUCT_LINE_CODE (EPLC OVXA) – General ERP Product Line – alias Division – revenue account determination VKOA</div><input value={form.product_line_code} onChange={e=>setForm({...form,product_line_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
        </div>
        <div className="mt-3 border-2 border-black p-2">
          <div className="font-bold text-[10px]">LINES – T0 BLOCKING – General ERP Product Lines – Pricing VK11 PR00 base price + K004 discount + MWST tax – Access Sequence V/07 searches condition tables material/customer – net value calculated – NO DANGLING</div>
          {lines.map((l,idx)=>(
            <div key={idx} className="grid grid-cols-6 gap-1 mt-2">
              <input value={l.product_code} onChange={e=>{const n=[...lines]; n[idx].product_code=e.target.value.toUpperCase(); setLines(n);}} className="border-2 border-black px-1 py-1 uppercase" placeholder="" />
              <input value={l.quantity} onChange={e=>{const n=[...lines]; n[idx].quantity=e.target.value; setLines(n);}} className="border-2 border-black px-1 py-1" placeholder="" />
              <input value={l.unit_price} onChange={e=>{const n=[...lines]; n[idx].unit_price=e.target.value; setLines(n);}} className="border-2 border-black px-1 py-1" placeholder="" />
              <input value={l.discount_percent} onChange={e=>{const n=[...lines]; n[idx].discount_percent=e.target.value; setLines(n);}} className="border-2 border-black px-1 py-1" placeholder="" />
              <input value={l.tax_code} onChange={e=>{const n=[...lines]; n[idx].tax_code=e.target.value.toUpperCase(); setLines(n);}} className="border-2 border-black px-1 py-1 uppercase" placeholder="" />
              <div className="flex gap-1"><input value={l.uom_code} onChange={e=>{const n=[...lines]; n[idx].uom_code=e.target.value.toUpperCase(); setLines(n);}} className="border-2 border-black px-1 py-1 w-full uppercase" placeholder="" /><button onClick={()=>setLines(lines.filter((_,i)=>i!==idx))} className="border-2 border-black px-2 bg-red-50">X</button></div>
            </div>
          ))}
          <button onClick={()=>setLines([...lines,{product_code: "", quantity: "10", unit_price: "100", uom_code: "PC", discount_percent: "0", tax_code: "GST18"}])} className="mt-2 border-2 border-black px-3 py-1 bg-zinc-100">+ ADD LINE – PRICING VK11</button>
        </div>
        <button onClick={create} className="mt-3 bg-black text-white px-3 py-1 w-full">CREATE SALES ORDER SSOC – ALIAS VA01 – GENERAL ERP – T0 BLOCKING – PRICING VK11 + CREDIT CHECK OB45</button>
        <div className="text-[9px] text-zinc-500 mt-1">T0 BLOCKING – SO pricing procedure V/08 determination: customer + commercial org + sales channel + product line → procedure ZPR00 → access sequence V/07 searches condition tables (material/customer) → PR00 base price, K004 discount, MWST tax – net value = qty*(price-discount)+tax – used in credit check FD32 OVA8 exposure = open SO + delivery + billing + AR vs limit – posting period FPPE (legacy OB52) account type D – NO DANGLING – General ERP, SAP VA01 alias</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {(Array.isArray(items)?items:[]).slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2">
            <div className="font-bold">{it.sales_number} – {it.customer_number || it.customer_name} – {it.facility_code || it.plant_code} – total {it.total_amount} – {it.status} – {it.line_count} lines</div>
            <div className="text-[10px] text-zinc-600">{it.lines?.map((l:any)=>`${l.item_number || l.material_number}:${l.quantity}x${l.unit_price}`).join(' ')}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T0 BLOCKING – GENERAL ERP – LOW IMPORTANCE – SALES AREA + PRICING + CREDIT</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/foundation/customers`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SCUC Customer – sales area required →</Link>
          <Link href={`/${companyCode}/foundation/commercial-orgs`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">ECOC Commercial Org – pricing procedure →</Link>
          <Link href={`/${companyCode}/foundation/sales-channels`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">ESCC Sales Channel →</Link>
          <Link href={`/${companyCode}/foundation/product-lines`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EPLC Product Line – VKOA →</Link>
          <Link href={`/${companyCode}/foundation/materials`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EMTC Product – required line →</Link>
          <Link href={`/${companyCode}/sd/pricing-procedure`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FPRP Pricing Procedure V/08 →</Link>
          <Link href={`/${companyCode}/fico/tax-codes`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FTXC Tax MWST →</Link>
          <Link href={`/${companyCode}/foundation/credit-policy-areas`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FCPC Credit Policy – FD32 →</Link>
          <Link href={`/${companyCode}/sd/delivery`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SDLC Delivery uses SO →</Link>
          <Link href={`/${companyCode}/sd/billing`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SBLC Billing uses Delivery →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">🛒</div>
          <div>
            <div className="font-semibold">Sales Orders – SSOC (alias VA01) – General ERP – T0 BLOCKING – SCUC-FULL + PRICING VK11</div>
            <div className="text-xs text-zinc-500">{Array.isArray(items)?items.length:0} orders • {companyCode} • SSOC uses sales area (ECOC+ESCC+EPLC) → pricing procedure V/08 → VK11 condition records PR00/K004/MWST → net value → credit check FD32 OVA8 – NO DANGLING</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DbAutocomplete label="CUSTOMER_CODE * – SCUC – General ERP Customer – XD01 alias – sales area + credit + pricing" value={form.customer_code} onChange={v=>setForm({...form,customer_code:v})} apiUrl="/api/business-partners?role=CUSTOMER" codeField="account_number" nameField="display_name" placeholder="" required createUrl={`/${companyCode}/foundation/customers`} createCode="SCUC" companyCode={companyCode} />
          <DbAutocomplete label="FACILITY_CODE * – EFCC – General ERP Facility – alias Plant – shipping point" value={form.facility_code} onChange={v=>setForm({...form,facility_code:v})} apiUrl="/api/facilities" codeField="code" nameField="name" placeholder="" required createUrl={`/${companyCode}/foundation/facilities`} createCode="EFCC" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">CUSTOMER_PO – General ERP Customer PO ref</label><input value={form.customer_po} onChange={e=>setForm({...form,customer_po:e.target.value})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]" placeholder="" /></div>
          <DbAutocomplete label="COMMERCIAL_ORG_CODE – ECOC – General ERP Commercial Org – OVX2 alias – pricing procedure determination" value={form.commercial_org_code} onChange={v=>setForm({...form,commercial_org_code:v})} apiUrl="/api/commercial-orgs" codeField="code" nameField="name" placeholder="" createUrl={`/${companyCode}/foundation/commercial-orgs`} createCode="ECOC" companyCode={companyCode} />
          <DbAutocomplete label="SALES_CHANNEL_CODE – ESCC – General ERP Sales Channel – OVTB alias" value={form.sales_channel_code} onChange={v=>setForm({...form,sales_channel_code:v})} apiUrl="/api/sales-channels" codeField="code" nameField="name" placeholder="" createUrl={`/${companyCode}/foundation/sales-channels`} createCode="ESCC" companyCode={companyCode} />
          <DbAutocomplete label="PRODUCT_LINE_CODE – EPLC – General ERP Product Line – OVXA alias – VKOA revenue account determination" value={form.product_line_code} onChange={v=>setForm({...form,product_line_code:v})} apiUrl="/api/product-lines" codeField="code" nameField="name" placeholder="" createUrl={`/${companyCode}/foundation/product-lines`} createCode="EPLC" companyCode={companyCode} />
        </div>

        <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
          <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-3">Lines – T0 BLOCKING – General ERP Product Lines – Pricing VK11 PR00 base price + K004 discount + MWST tax – Access Sequence V/07 – Net value = qty*(price-discount)+tax – NO DANGLING – Used in Delivery + Billing + Credit Exposure</h4>
          {lines.map((l,idx)=>(
            <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-3 bg-white rounded-xl border p-3">
              <DbAutocomplete label={`Product ${idx+1} * – EMTC`} value={l.product_code} onChange={v=>{const n=[...lines]; n[idx].product_code=v; setLines(n);}} apiUrl="/api/materials" codeField="item_number" nameField="description" placeholder="" required createUrl={`/${companyCode}/foundation/materials`} createCode="EMTC" companyCode={companyCode} />
              <div><label className="text-[11px] font-medium">Quantity *</label><input value={l.quantity} onChange={e=>{const n=[...lines]; n[idx].quantity=e.target.value; setLines(n);}} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]" placeholder="" /></div>
              <div><label className="text-[11px] font-medium">Unit Price – PR00 VK11</label><input value={l.unit_price} onChange={e=>{const n=[...lines]; n[idx].unit_price=e.target.value; setLines(n);}} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]" placeholder="" /></div>
              <div><label className="text-[11px] font-medium">Discount % – K004</label><input value={l.discount_percent} onChange={e=>{const n=[...lines]; n[idx].discount_percent=e.target.value; setLines(n);}} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px]" placeholder="" /></div>
              <div><label className="text-[11px] font-medium">Tax Code – MWST</label><input value={l.tax_code} onChange={e=>{const n=[...lines]; n[idx].tax_code=e.target.value.toUpperCase(); setLines(n);}} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
              <div className="flex gap-2"><div className="flex-1"><label className="text-[11px] font-medium">UOM – EUOC</label><input value={l.uom_code} onChange={e=>{const n=[...lines]; n[idx].uom_code=e.target.value.toUpperCase(); setLines(n);}} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div><button onClick={()=>setLines(lines.filter((_,i)=>i!==idx))} className="mt-6 h-10 px-3 rounded-xl border bg-red-50 text-xs">Remove</button></div>
            </div>
          ))}
          <button onClick={()=>setLines([...lines,{product_code: "", quantity: "10", unit_price: "100", uom_code: "PC", discount_percent: "0", tax_code: "GST18"}])} className="mt-4 px-4 py-2 rounded-full border bg-white text-xs hover:bg-zinc-50">+ Add Line – Pricing VK11 PR00/K004/MWST</button>
        </div>

        <button onClick={create} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 h-[32px] text-[13px] font-medium transition-colors">Create Sales Order SSOC – Alias VA01 – General ERP – T0 BLOCKING – Pricing VK11 + Credit OB45</button>
        <div className="text-[10px] text-zinc-400 mt-2">T0 BLOCKING – SO pricing procedure V/08 determination: customer + commercial org + sales channel + product line → procedure ZPR00 → access sequence V/07 searches condition tables (material/customer) → PR00 base price, K004 discount, MWST tax – net value calculated – used in credit check FD32 OVA8 exposure = open SO + delivery + billing + AR vs limit – posting period FPPE (legacy OB52) account type D – NO DANGLING – General ERP, SAP VA01 alias – next: Delivery SDLC SDLC (legacy VL01N) PGI 601 INV_OFFSET/INV_POSTING (legacy GBB/BSX) COGS + Billing SBLC SBLC (legacy VF01) VKOA KOFI/KOFK revenue</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(Array.isArray(items)?items:[]).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start"><div className="font-semibold text-sm">{it.sales_number} – {it.customer_number || it.customer_name} – {it.facility_code} – total {it.total_amount} – {it.status} – {it.line_count} lines</div><span className="text-[10px] bg-blue-600 text-white rounded-full px-2 py-0.5">SSOC</span></div>
            <div className="mt-2 text-xs text-zinc-500">{it.lines?.slice(0,3).map((l:any)=>`${l.item_number}:${l.quantity}x${l.unit_price}=${l.line_total}`).join(' • ')}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T0 BLOCKING – General ERP – Low Importance – Auto from Dependencies – Sales Area + Pricing + Credit</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/foundation/customers`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SCUC</span><span>Customer – sales area required – XD01 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/commercial-orgs`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">ECOC</span><span>Commercial Org – pricing procedure – OVX2 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/sales-channels`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">ESCC</span><span>Sales Channel – OVTB alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/product-lines`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EPLC</span><span>Product Line – VKOA revenue – OVXA alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/materials`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EMTC</span><span>Product – required line – OMS2 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/sd/pricing-procedure`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FPRP</span><span>Pricing Procedure V/08 – ZPR00</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/tax-codes`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FTXC</span><span>Tax MWST – GST18</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/credit-policy-areas`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FCPC</span><span>Credit Policy – FD32 OVA8 – OB45 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/sd/delivery`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SDLC</span><span>Delivery uses SO – SDLC (legacy VL01N) alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/sd/billing`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SBLC</span><span>Billing uses Delivery – SBLC (legacy VF01) alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Sales Order, Customer, Facility, Commercial Org, Sales Channel, Product Line, Product, Pricing Condition, Tax – SAP VA01/XD01/OVX2/OVTB/OVXA/VK11/V/08 kept as alias – T0 BLOCKING – pricing procedure determination → access sequence → condition records PR00/K004/MWST → net value → credit check FD32 OVA8 → delivery → billing – NO DANGLING</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Sales Orders" subtitle={`${Array.isArray(items)?items.length:0} orders • ${companyCode} • SSOC alias VA01 – General ERP – T0 BLOCKING – SCUC-FULL + PRICING VK11 + CREDIT`} code="SSOC" module="SD" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
