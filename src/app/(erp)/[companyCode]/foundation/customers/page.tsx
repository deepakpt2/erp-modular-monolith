"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';

export default function Page(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');
  const [form,setForm]=useState({account_number: "", display_name: "", legal_name: "", gst_number: "", pan: "", commercial_org_code: "CO-1000", sales_channel_code: "CH-10", product_line_code: "PL-00", credit_policy_area_code: "CPA-1000", payment_term_code: "NT30", price_group: "01", customer_group: "01", currency_code: "INR"});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/business-partners?role=CUSTOMER').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!form.account_number || !form.display_name){ setMsg('❌ CUSTOMER_CODE and CUSTOMER_NAME required – SCUC – General ERP Customer – XD01 alias – T0 BLOCKING'); return; }
    const payload = {
      account_number: form.account_number,
      display_name: form.display_name,
      legal_name: form.legal_name,
      gst_number: form.gst_number,
      pan_number: form.pan,
      role: "CUSTOMER",
      commercial_org_id: null,
      sales_channel_id: null,
      product_line_id: null,
      credit_policy_area_id: null,
      payment_terms_days: 30,
      price_group: form.price_group,
      customer_group: form.customer_group,
      currency_code: form.currency_code,
      company_code: companyCode
    };
    // Resolve commercial org, sales channel, product line, credit policy area ids if provided
    try{
      if(form.commercial_org_code){
        const r = await fetch(`/api/commercial-orgs?search=${form.commercial_org_code}`).then(r=>r.json());
        const org = (r.commercialOrgs||r.data||[]).find((o:any)=>o.code===form.commercial_org_code.toUpperCase());
        if(org) payload.commercial_org_id = org.id;
      }
      if(form.sales_channel_code){
        const r = await fetch(`/api/sales-channels?search=${form.sales_channel_code}`).then(r=>r.json());
        const ch = (r.salesChannels||r.data||[]).find((o:any)=>o.code===form.sales_channel_code.toUpperCase());
        if(ch) payload.sales_channel_id = ch.id;
      }
      if(form.product_line_code){
        const r = await fetch(`/api/product-lines?search=${form.product_line_code}`).then(r=>r.json());
        const pl = (r.productLines||r.data||[]).find((o:any)=>o.code===form.product_line_code.toUpperCase());
        if(pl) payload.product_line_id = pl.id;
      }
      if(form.credit_policy_area_code){
        const r = await fetch(`/api/credit-policy-areas?search=${form.credit_policy_area_code}`).then(r=>r.json());
        const cpa = (r.creditPolicyAreas||r.data||[]).find((o:any)=>o.code===form.credit_policy_area_code.toUpperCase());
        if(cpa) payload.credit_policy_area_id = cpa.id;
      }
    }catch(e){ console.warn('Resolve ids failed', e); }

    const res = await fetch('/api/business-partners',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success){
      setMsg(`✅ Customer ${form.account_number} ${form.display_name} created – SCUC alias XD01 – General ERP – T0 BLOCKING – SCUC-FULL sales area: commercial org ${form.commercial_org_code} (ECOC OVX2) + sales channel ${form.sales_channel_code} (ESCC OVTB) + product line ${form.product_line_code} (EPLC OVXA) + credit policy ${form.credit_policy_area_code} (FCPC OB45) + payment terms ${form.payment_term_code} (FAPT) + price group ${form.price_group} + customer group ${form.customer_group} – used in SO pricing procedure determination V/08: customer+sales area → procedure → access sequence V/07 → VK11 condition records PR00/K004/MWST → net value – credit check FD32 OVA8 exposure vs limit – partner functions SP/SH/BP/PY – NO DANGLING`);
      load();
      setForm({account_number: "", display_name: "", legal_name: "", gst_number: "", pan: "", commercial_org_code: "CO-1000", sales_channel_code: "CH-10", product_line_code: "PL-00", credit_policy_area_code: "CPA-1000", payment_term_code: "NT30", price_group: "01", customer_group: "01", currency_code: "INR"});
    } else setMsg('❌ '+(res.error||JSON.stringify(res)));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING SCUC – Customer – General ERP alias XD01 – T0 BLOCKING – SCUC-FULL sales area...</div>;
  const items = data?.businessPartners || data?.partners || data?.data || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">SCUC CUSTOMER CREATE – GENERAL ERP – ALIAS XD01 – {Array.isArray(items)?items.length:0} RECORDS – T0 BLOCKING – SCUC-FULL + SALES AREA + PARTNER FUNCTIONS + PRICING + CREDIT – NO DANGLING</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">CUSTOMER_CODE * (SCUC) – General ERP Customer – XD01 alias – must be unique</div><input value={form.account_number} onChange={e=>setForm({...form,account_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="CUST-1000" /></div>
          <div><div className="text-[9px] text-zinc-500">CUSTOMER_NAME * – General ERP Customer Name</div><input value={form.display_name} onChange={e=>setForm({...form,display_name:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="Retail Chain Ltd" /></div>
          <div><div className="text-[9px] text-zinc-500">LEGAL_NAME – General ERP Legal Name</div><input value={form.legal_name} onChange={e=>setForm({...form,legal_name:e.target.value})} className="w-full border-2 border-black px-1 py-1" placeholder="Retail Chain Pvt Ltd" /></div>
          <div><div className="text-[9px] text-zinc-500">GST_NUMBER – General ERP Tax ID – GSTIN</div><input value={form.gst_number} onChange={e=>setForm({...form,gst_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="GSTIN" /></div>
          <div><div className="text-[9px] text-zinc-500">PAN – General ERP PAN</div><input value={form.pan} onChange={e=>setForm({...form,pan:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="PAN" /></div>
          <div><div className="text-[9px] text-zinc-500">CURRENCY_CODE – General ERP Currency – INR</div><input value={form.currency_code} onChange={e=>setForm({...form,currency_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="INR" /></div>
          <div><div className="text-[9px] text-zinc-500">COMMERCIAL_ORG_CODE (ECOC OVX2) – General ERP Commercial Org – alias Sales Org – pricing procedure determination – required sales area</div><input value={form.commercial_org_code} onChange={e=>setForm({...form,commercial_org_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="CO-1000" /></div>
          <div><div className="text-[9px] text-zinc-500">SALES_CHANNEL_CODE (ESCC OVTB) – General ERP Sales Channel – alias Distribution Channel – required sales area</div><input value={form.sales_channel_code} onChange={e=>setForm({...form,sales_channel_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="CH-10" /></div>
          <div><div className="text-[9px] text-zinc-500">PRODUCT_LINE_CODE (EPLC OVXA) – General ERP Product Line – alias Division – required sales area – VKOA revenue account determination</div><input value={form.product_line_code} onChange={e=>setForm({...form,product_line_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="PL-00" /></div>
          <div><div className="text-[9px] text-zinc-500">CREDIT_POLICY_AREA_CODE (FCPC OB45) – General ERP Credit Policy Area – alias Credit Control Area – FD32 credit limit + OVA8 check – required</div><input value={form.credit_policy_area_code} onChange={e=>setForm({...form,credit_policy_area_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="CPA-1000" /></div>
          <div><div className="text-[9px] text-zinc-500">PAYMENT_TERM_CODE (FAPT) – General ERP Payment Terms – NT30 – due date calc</div><input value={form.payment_term_code} onChange={e=>setForm({...form,payment_term_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="NT30" /></div>
          <div><div className="text-[9px] text-zinc-500">PRICE_GROUP (SCUC) – 01 – General ERP Price Group – pricing procedure determination</div><input value={form.price_group} onChange={e=>setForm({...form,price_group:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="01" /></div>
        </div>
        <button onClick={create} className="mt-3 bg-black text-white px-3 py-1 w-full">CREATE CUSTOMER SCUC – ALIAS XD01 – GENERAL ERP – T0 BLOCKING – SCUC-FULL SALES AREA</button>
        <div className="text-[9px] text-zinc-500 mt-1">T0 BLOCKING – SCUC-FULL: Customer Master Sales Area (commercial org ECOC + sales channel ESCC + product line EPLC) defines pricing procedure V/08, shipping point DP-1000, credit control area FCPC OB45 – partner functions SP sold-to, SH ship-to, BP bill-to, PY payer – price group + customer group used in VK11 condition records + VKOA revenue account KOFI/KOFK – payment terms FAPT due date – NO DANGLING – General ERP, SAP XD01/OVX2/OVTB/OVXA/OB45 alias – used in SO VA01-FULL pricing + credit check FD32 OVA8</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {(Array.isArray(items)?items:[]).slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2">
            <div className="font-bold">{it.account_number || it.bp_number} – {it.display_name || it.name1} – {it.role} – {it.customer_currency || it.vendor_currency}</div>
            <div className="text-[10px] text-zinc-600">Sales Area: CO {it.commercial_org_id} + CH {it.sales_channel_id} + PL {it.product_line_id} – Credit {it.credit_policy_area_id} – Price Grp {it.price_group}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T0 BLOCKING – GENERAL ERP – LOW IMPORTANCE – SALES AREA + PRICING + CREDIT</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/foundation/commercial-orgs`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">ECOC Commercial Org – required sales area →</Link>
          <Link href={`/${companyCode}/foundation/sales-channels`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">ESCC Sales Channel – required →</Link>
          <Link href={`/${companyCode}/foundation/product-lines`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">EPLC Product Line – required VKOA →</Link>
          <Link href={`/${companyCode}/foundation/credit-policy-areas`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FCPC Credit Policy – FD32 OVA8 →</Link>
          <Link href={`/${companyCode}/fico/payment-terms`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FAPT Payment Terms →</Link>
          <Link href={`/${companyCode}/sales`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SSOC Sales Order uses Customer →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">👤</div>
          <div>
            <div className="font-semibold">Customer – SCUC (alias XD01) – General ERP – T0 BLOCKING – SCUC-FULL Sales Area + Partner + Pricing + Credit</div>
            <div className="text-xs text-zinc-500">{Array.isArray(items)?items.length:0} customers • {companyCode} • SCUC-FULL: sales area (ECOC+ESCC+EPLC) → pricing procedure V/08 → VK11 PR00/K004/MWST → credit FD32 OVA8 → SO VA01 – NO DANGLING</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">CUSTOMER_CODE * – SCUC – XD01 alias</label><input value={form.account_number} onChange={e=>setForm({...form,account_number:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="CUST-1000" /></div>
          <div><label className="text-[11px] font-medium">CUSTOMER_NAME * – General ERP</label><input value={form.display_name} onChange={e=>setForm({...form,display_name:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="Retail Chain Ltd" /></div>
          <div><label className="text-[11px] font-medium">LEGAL_NAME – General ERP</label><input value={form.legal_name} onChange={e=>setForm({...form,legal_name:e.target.value})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder="Retail Chain Pvt Ltd" /></div>
          <DbAutocomplete label="COMMERCIAL_ORG_CODE * – ECOC – OVX2 alias – pricing procedure determination – required sales area" value={form.commercial_org_code} onChange={v=>setForm({...form,commercial_org_code:v})} apiUrl="/api/commercial-orgs" codeField="code" nameField="name" placeholder="CO-1000" required createUrl={`/${companyCode}/foundation/commercial-orgs`} createCode="ECOC" companyCode={companyCode} />
          <DbAutocomplete label="SALES_CHANNEL_CODE * – ESCC – OVTB alias – required sales area" value={form.sales_channel_code} onChange={v=>setForm({...form,sales_channel_code:v})} apiUrl="/api/sales-channels" codeField="code" nameField="name" placeholder="CH-10" required createUrl={`/${companyCode}/foundation/sales-channels`} createCode="ESCC" companyCode={companyCode} />
          <DbAutocomplete label="PRODUCT_LINE_CODE * – EPLC – OVXA alias – required sales area – VKOA revenue account" value={form.product_line_code} onChange={v=>setForm({...form,product_line_code:v})} apiUrl="/api/product-lines" codeField="code" nameField="name" placeholder="PL-00" required createUrl={`/${companyCode}/foundation/product-lines`} createCode="EPLC" companyCode={companyCode} />
          <DbAutocomplete label="CREDIT_POLICY_AREA_CODE * – FCPC – OB45 alias – FD32 credit limit + OVA8 check – required" value={form.credit_policy_area_code} onChange={v=>setForm({...form,credit_policy_area_code:v})} apiUrl="/api/credit-policy-areas" codeField="code" nameField="name" placeholder="CPA-1000" required createUrl={`/${companyCode}/foundation/credit-policy-areas`} createCode="FCPC" companyCode={companyCode} />
          <DbAutocomplete label="PAYMENT_TERM_CODE – FAPT – NT30 – due date calc" value={form.payment_term_code} onChange={v=>setForm({...form,payment_term_code:v})} apiUrl="/api/payment-terms" codeField="code" nameField="name" placeholder="NT30" createUrl={`/${companyCode}/fico/payment-terms`} createCode="FAPT" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium">PRICE_GROUP – 01 – pricing procedure determination</label><input value={form.price_group} onChange={e=>setForm({...form,price_group:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="01" /></div>
          <div><label className="text-[11px] font-medium">CUSTOMER_GROUP – 01 – VKOA access</label><input value={form.customer_group} onChange={e=>setForm({...form,customer_group:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="01" /></div>
          <div><label className="text-[11px] font-medium">GST_NUMBER – GSTIN</label><input value={form.gst_number} onChange={e=>setForm({...form,gst_number:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="GSTIN" /></div>
          <div><label className="text-[11px] font-medium">CURRENCY_CODE – INR</label><input value={form.currency_code} onChange={e=>setForm({...form,currency_code:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm uppercase" placeholder="INR" /></div>
        </div>
        <button onClick={create} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Create Customer SCUC – Alias XD01 – General ERP – T0 BLOCKING – SCUC-FULL Sales Area</button>
        <div className="text-[10px] text-zinc-400 mt-2">T0 BLOCKING – SCUC-FULL: Customer Master Sales Area (commercial org ECOC OVX2 + sales channel ESCC OVTB + product line EPLC OVXA) defines pricing procedure V/08, shipping point DP-1000, credit control area FCPC OB45 – partner functions SP sold-to, SH ship-to, BP bill-to, PY payer – price group + customer group used in VK11 condition records PR00/K004/MWST + VKOA revenue account KOFI/KOFK – payment terms FAPT due date – NO DANGLING – General ERP, SAP XD01/OVX2/OVTB/OVXA/OB45 alias – used in SO VA01-FULL pricing + credit check FD32 OVA8</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(Array.isArray(items)?items:[]).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start"><div className="font-semibold text-sm">{it.account_number || it.bp_number} – {it.display_name || it.name1} – {it.role}</div><span className="text-[10px] bg-blue-600 text-white rounded-full px-2 py-0.5">SCUC</span></div>
            <div className="mt-2 text-xs text-zinc-500">Sales Area: CO {it.commercial_org_id} + CH {it.sales_channel_id} + PL {it.product_line_id} – Credit {it.credit_policy_area_id} – Price Grp {it.price_group} – Currency {it.customer_currency}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T0 BLOCKING – General ERP – Low Importance – Auto from Dependencies – Sales Area + Pricing + Credit</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/foundation/commercial-orgs`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">ECOC</span><span>Commercial Org – required sales area – OVX2 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/sales-channels`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">ESCC</span><span>Sales Channel – required – OVTB alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/product-lines`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">EPLC</span><span>Product Line – required VKOA – OVXA alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/credit-policy-areas`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FCPC</span><span>Credit Policy – FD32 OVA8 – OB45 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/payment-terms`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FAPT</span><span>Payment Terms – NT30</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/sales`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SSOC</span><span>Sales Order uses Customer – VA01 alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Customer, Commercial Org, Sales Channel, Product Line, Credit Policy Area, Payment Terms, Price Group, Customer Group – SAP XD01/OVX2/OVTB/OVXA/OB45/VK11/V/08/FD32/OVA8 kept as alias – T0 BLOCKING – SCUC-FULL sales area defines pricing procedure, shipping point, credit control – partner functions SP/SH/BP/PY – price group + customer group used in VK11 condition records + VKOA revenue account KOFI/KOFK – NO DANGLING</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Customer" subtitle={`${Array.isArray(items)?items.length:0} customers • ${companyCode} • SCUC alias XD01 – General ERP – T0 BLOCKING – SCUC-FULL Sales Area + Pricing + Credit`} code="SCUC" module="FOUNDATION" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
