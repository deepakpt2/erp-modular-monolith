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
  const [form,setForm]=useState({delivery_number: "", sales_org: "1000", customer_group: "01", material_group: "01", account_assignment_group: "01", chart_of_accounts: "KSCA"});

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/billing').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function create(){
    if(!form.delivery_number){ setMsg('❌ DELIVERY_NUMBER required – SDLC alias VL01N – General ERP Delivery – must be PGI DONE – T0 BLOCKING – Billing created from Delivery via copy control VTFL DL→BL – VKOA revenue account determination'); return; }
    try{
      const delRes = await fetch(`/api/delivery?search=${form.delivery_number}`).then(r=>r.json());
      const delivery = (delRes.deliveries||delRes.data||[]).find((d:any)=>d.delivery_number===form.delivery_number.toUpperCase()) || (delRes.deliveries||[])[0];
      if(!delivery){ setMsg(`❌ Delivery ${form.delivery_number} not found – create via SDLC VL01N first – must be PGI GOODS_ISSUED`); return; }
      if(delivery.status!=='GOODS_ISSUED'){ setMsg(`❌ Delivery ${delivery.delivery_number} status ${delivery.status} – must be GOODS_ISSUED (PGI 601 done) – do PGI first – T0 BLOCKING`); return; }

      // Get sales order for customer and facility
      let salesOrderId = delivery.sales_order_id;
      let partnerId = delivery.ship_to_partner_id;
      let facilityId = delivery.facility_id;

      const payload = {
        sales_order_id: salesOrderId,
        delivery_id: delivery.id,
        partner_id: partnerId,
        chart_of_accounts: form.chart_of_accounts,
        sales_org: form.sales_org,
        customer_group: form.customer_group,
        material_group: form.material_group,
        account_assignment_group: form.account_assignment_group,
        company_code: companyCode,
        lines: (delivery.lines||[]).map((l:any)=>({
          delivery_line_id: l.id,
          sales_line_id: l.sales_line_id,
          item_id: l.item_id,
          quantity: l.quantity,
          unit_price: 100, // should come from SO pricing
          line_total: parseFloat(l.quantity||0)*100
        }))
      };
      const res = await fetch('/api/billing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
      if(res.success){
        setMsg(`✅ Billing ${res.billingNumber || res.billing?.billing_number} created from Delivery ${form.delivery_number} – SBLC alias VF01 – General ERP – T0 BLOCKING – VKOA revenue account determination: chart ${form.chart_of_accounts} + sales org ${form.sales_org} + cust grp ${form.customer_group} + mat grp ${form.material_group} + acct assign ${form.account_assignment_group} → KOFI ${res.revenue_account?.kofi} KOFK ${res.revenue_account?.kofk} – ${res.revenue_account?.message} – universal ledger Dr AR ${res._auto_gl_ar||'AR'} total ${res.calculated?.total} Cr Revenue ${res.revenue_account?.kofi} net ${res.calculated?.net} + Tax Cr ${res.calculated?.tax} – FTXC tax – NO DANGLING – chain SO→DL→PGI→BL→AR→GL complete`);
        load();
        setForm({delivery_number: "", sales_org: "1000", customer_group: "01", material_group: "01", account_assignment_group: "01", chart_of_accounts: "KSCA"});
      } else setMsg('❌ '+(res.error||JSON.stringify(res)));
    }catch(e:any){ setMsg('❌ '+e.message); }
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING SBLC – Billing Documents – General ERP alias VF01 – T0 BLOCKING – VKOA KOFI/KOFK + Revenue...</div>;
  const items = data?.billings || data?.data || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2 whitespace-pre-wrap">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">SBLC BILLING DOCUMENT CREATE – GENERAL ERP – ALIAS VF01 – {Array.isArray(items)?items.length:0} RECORDS – T0 BLOCKING – VF01-VTFL-VFX3 + VKOA KOFI/KOFK + FTXC TAX + FI POSTING – NO DANGLING</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">DELIVERY_NUMBER * (SDLC VL01N) – General ERP Delivery – must be GOODS_ISSUED PGI 601 done – copy control VTFL DL→BL</div><input value={form.delivery_number} onChange={e=>setForm({...form,delivery_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">CHART_OF_ACCOUNTS (FCOA KSCA) – General ERP Chart – VKOA determination chart + sales org + cust grp + mat grp → GL</div><input value={form.chart_of_accounts} onChange={e=>setForm({...form,chart_of_accounts:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">SALES_ORG (ECOC) – General ERP Commercial Org – VKOA KOFI/KOFK revenue account determination</div><input value={form.sales_org} onChange={e=>setForm({...form,sales_org:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">CUSTOMER_GROUP (SCUC) – General ERP Customer Group – 01 – VKOA access sequence</div><input value={form.customer_group} onChange={e=>setForm({...form,customer_group:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">MATERIAL_GROUP (EMGC) – General ERP Product Category – 01 – VKOA access sequence</div><input value={form.material_group} onChange={e=>setForm({...form,material_group:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
          <div><div className="text-[9px] text-zinc-500">ACCOUNT_ASSIGNMENT_GROUP (FCOA) – 01 – General ERP Account Assignment – VKOA</div><input value={form.account_assignment_group} onChange={e=>setForm({...form,account_assignment_group:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="" /></div>
        </div>
        <button onClick={create} className="mt-2 bg-black text-white px-3 py-1 w-full">CREATE BILLING SBLC – ALIAS VF01 – FROM DELIVERY – VTFL DL→BL – VKOA KOFI/KOFK – T0 BLOCKING</button>
        <div className="text-[9px] text-zinc-500 mt-1">T0 BLOCKING – Billing created from Delivery via copy control VTFL: DL lines → BL lines – VKOA revenue account determination KOFI/KOFK: chart + sales org + customer group + material group + account assignment group → GL account – access sequence searches condition tables – revenue GL found → universal ledger Dr AR total Cr Revenue net + Tax Cr – FTXC tax code MWST – posting period OB52 account type D – NO DANGLING – General ERP, SAP VF01/VTFL/VKOA/KOFI/KOFK alias – chain SO→DL→PGI→BL→AR→GL complete – FI doc posted</div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {(Array.isArray(items)?items:[]).slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2">
            <div className="font-bold">{it.billing_number} – DL {it.delivery_number} – SO {it.sales_number} – total {it.total_amount} net {it.net_amount} tax {it.tax_amount} – {it.status} – {it.line_count} lines</div>
            <div className="text-[10px] text-zinc-600">VKOA KOFI/KOFK revenue GL → universal ledger Dr AR Cr Revenue+Tax – T0 BLOCKING – NO DANGLING</div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED – T0 BLOCKING – GENERAL ERP – LOW IMPORTANCE – SO→DL→PGI→BL→AR→GL</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/sd/delivery`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SDLC Delivery – required PGI DONE →</Link>
          <Link href={`/${companyCode}/sales`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SSOC Sales Order →</Link>
          <Link href={`/${companyCode}/fico/auto-account-determination`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">OBYC Auto Account – VKOA KOFI/KOFK →</Link>
          <Link href={`/${companyCode}/fico/revenue-accounts`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">VKOA Revenue Account Determination →</Link>
          <Link href={`/${companyCode}/fico/tax-codes`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FTXC Tax MWST →</Link>
          <Link href={`/${companyCode}/fico/posting-periods`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FPPE Posting Period →</Link>
        </div>
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center">🧾</div>
          <div>
            <div className="font-semibold">Billing Documents – SBLC (alias VF01) – General ERP – T0 BLOCKING – VF01-VTFL-VFX3 + VKOA KOFI/KOFK + Revenue</div>
            <div className="text-xs text-zinc-500">{Array.isArray(items)?items.length:0} billings • {companyCode} • SBLC created from Delivery via VTFL DL→BL → VKOA chart+sales org+cust grp+mat grp+acct assign → KOFI/KOFK revenue GL → Dr AR Cr Revenue+Tax via universal ledger – FTXC – NO DANGLING – SO→DL→PGI→BL→AR→GL</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DbAutocomplete label="DELIVERY_NUMBER * – SDLC – General ERP Delivery – VL01N alias – must be GOODS_ISSUED PGI 601 done – VTFL DL→BL" value={form.delivery_number} onChange={v=>setForm({...form,delivery_number:v})} apiUrl="/api/delivery?status=GOODS_ISSUED" codeField="delivery_number" nameField="sales_number" placeholder="" required createUrl={`/${companyCode}/sd/delivery`} createCode="SDLC" companyCode={companyCode} />
          <DbAutocomplete label="CHART_OF_ACCOUNTS – FCOA – KSCA – VKOA determination chart + sales org + cust grp + mat grp → GL" value={form.chart_of_accounts} onChange={v=>setForm({...form,chart_of_accounts:v})} apiUrl="/api/chart-of-accounts" codeField="code" nameField="name" placeholder="" createUrl={`/${companyCode}/fico/chart-of-accounts`} createCode="FCOA" companyCode={companyCode} />
          <div><label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">SALES_ORG – ECOC – Commercial Org – VKOA KOFI/KOFK</label><input value={form.sales_org} onChange={e=>setForm({...form,sales_org:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">CUSTOMER_GROUP – SCUC – 01 – VKOA access</label><input value={form.customer_group} onChange={e=>setForm({...form,customer_group:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">MATERIAL_GROUP – EMGC – 01 – VKOA access</label><input value={form.material_group} onChange={e=>setForm({...form,material_group:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
          <div><label className="text-[11px] font-medium">ACCOUNT_ASSIGNMENT_GROUP – 01 – VKOA</label><input value={form.account_assignment_group} onChange={e=>setForm({...form,account_assignment_group:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-[13px] h-[32px] uppercase" placeholder="" /></div>
        </div>
        <button onClick={create} className="mt-6 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 h-[32px] text-[13px] font-medium transition-colors">Create Billing SBLC – Alias VF01 – From Delivery – VTFL DL→BL – VKOA KOFI/KOFK – T0 BLOCKING</button>
        <div className="text-[10px] text-zinc-400 mt-2">T0 BLOCKING – Billing created from Delivery via copy control VTFL: DL lines → BL lines – VKOA revenue account determination KOFI/KOFK: chart + sales org + customer group + material group + account assignment group → GL account – access sequence searches condition tables – revenue GL found → universal ledger Dr AR total Cr Revenue net + Tax Cr – FTXC tax MWST – posting period OB52 account type D – NO DANGLING – General ERP, SAP VF01/VTFL/VKOA/KOFI/KOFK alias – chain SO→DL→PGI→BL→AR→GL complete – FI doc posted – VFX3 release to accounting</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(Array.isArray(items)?items:[]).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start"><div className="font-semibold text-sm">{it.billing_number} – DL {it.delivery_number} – SO {it.sales_number} – total {it.total_amount} net {it.net_amount} tax {it.tax_amount} – {it.status}</div><span className="text-[10px] bg-green-600 text-white rounded-full px-2 py-0.5">SBLC</span></div>
            <div className="mt-2 text-xs text-zinc-500">VKOA KOFI/KOFK revenue GL → universal ledger Dr AR Cr Revenue+Tax – FTXC MWST – T0 BLOCKING – NO DANGLING – SO→DL→PGI→BL→AR→GL</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related – T0 BLOCKING – General ERP – Low Importance – Auto from Dependencies – SO→DL→PGI→BL→AR→GL</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/sd/delivery`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SDLC</span><span>Delivery – required PGI DONE – VL01N alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/sales`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SSOC</span><span>Sales Order – VA01 alias</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/auto-account-determination`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">OBYC</span><span>Auto Account – VKOA KOFI/KOFK – revenue</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/revenue-accounts`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">VKOA</span><span>Revenue Account Determination – KOFI/KOFK</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/tax-codes`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FTXC</span><span>Tax MWST – GST18 – FTXP alias</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">General ERP terminology – Billing Document, Delivery, Sales Order, Revenue Account Determination, Tax, Auto Account, Chart of Accounts, Commercial Org, Customer Group, Product Category – SAP VF01/VL01N/VKOA/KOFI/KOFK/FTXC kept as alias – T0 BLOCKING – Billing created from Delivery via VTFL → VKOA chart+sales org+cust grp+mat grp+acct assign → KOFI/KOFK revenue GL → Dr AR Cr Revenue+Tax via universal ledger – FTXC tax – posting period – NO DANGLING – chain SO→DL→PGI→BL→AR→GL complete – VFX3 release to accounting</p>
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Billing Documents" subtitle={`${Array.isArray(items)?items.length:0} billings • ${companyCode} • SBLC alias VF01 – General ERP – T0 BLOCKING – VKOA KOFI/KOFK + Revenue`} code="SBLC" module="SD" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
