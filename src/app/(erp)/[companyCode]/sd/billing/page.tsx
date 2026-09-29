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
  const [form,setForm]=useState({delivery_number: "", amount: "", company_code: ""});

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
    if(!(form as any).delivery_number){ setMsg('DELIVERY_NUMBER required'); return; }
    const payload = {...form, company_code: companyCode, companyCode};
    const res = await fetch('/api/billing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(res.success || res.id || !res.error){ setMsg('✅ '+((form as any).code||(form as any).item_number||(form as any).account_number||(form as any).employee_number||(form as any).pr_number||(form as any).po_number||(form as any).bom_number||(form as any).order_number||'CREATED')+' CREATED'); load(); setForm({delivery_number: "", amount: "", company_code: ""}); }
    else setMsg('❌ '+(res.error||'Failed'));
  }

  if(loading) return <div className="p-6 font-mono text-xs">LOADING VF01...</div>;
  const items = data?.data || data?.items || data?.materials || data?.partners || data?.users || data?.roles || data?.employees || data?.payrolls || data?.purchaseRequisitions || data?.purchaseOrders || data?.goodsReceipts || data?.invoices || data?.stos || data?.boms || data?.kittings || data?.mrp || data?.routings || data?.workCenters || data?.salesOrders || data?.billings || data?.deliveries || data?.physicalInventories || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">VF01 BILLING CREATE – API: POST /api/billing [DELIVERY_NUMBER, AMOUNT, COMPANY_CODE] – {Array.isArray(items)?items.length:0} RECORDS</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[9px] text-zinc-500">DELIVERY_NUMBER * (DB: VL01N)</div><input value={(form as any).delivery_number} onChange={e=>setForm({...form,delivery_number:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="DELIVERY_NUMBER" /></div>
          <div><div className="text-[9px] text-zinc-500">AMOUNT</div><input value={(form as any).amount} onChange={e=>setForm({...form,amount:e.target.value})} className="w-full border-2 border-black px-1 py-1 " placeholder="AMOUNT" /></div>
          <div><div className="text-[9px] text-zinc-500">COMPANY_CODE * (DB: OX02)</div><input value={(form as any).company_code} onChange={e=>setForm({...form,company_code:e.target.value.toUpperCase()})} className="w-full border-2 border-black px-1 py-1 uppercase" placeholder="COMPANY_CODE" /></div>
        </div>
        <button onClick={create} className="mt-2 bg-black text-white px-3 py-1 w-full">CREATE</button>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {(Array.isArray(items)?items:[]).slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2">
            <div className="font-bold">{(it.code||it.item_number||it.account_number||it.employee_number||it.pr_number||it.po_number||it.bom_number||it.order_number||it.name||JSON.stringify(it).slice(0,80))}</div>
            <div className="text-[10px] text-zinc-600">{Object.entries(it).slice(0,4).map(([k,v])=>k.toUpperCase()+'='+String(v)).join(' ')}</div>
          </div>
        ))}
      </div>
          <div className="mt-4 border-2 border-black p-2 bg-[#ffffcc]">
        <div className="font-bold text-[10px]">RELATED MASTERS – AUTO – LOW IMPORTANCE</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Link href={`/${companyCode}/sd/delivery`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SDLC Delivery – required →</Link>
          <Link href={`/${companyCode}/foundation/customers`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">SCUC Customer →</Link>
          <Link href={`/${companyCode}/fico/payment-terms`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FAPT Payment Terms →</Link>
          <Link href={`/${companyCode}/fico/tax-codes`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FTXC Tax Codes →</Link>
          <Link href={`/${companyCode}/fico/posting-periods`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">FPPE Posting Period Control →</Link>
          <Link href={`/${companyCode}/fico/auto-account-determination`} className="border-2 border-black px-1 py-0.5 text-[9px] bg-white">OBYC Auto Account →</Link>
        </div>
      </div>

</div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className={`rounded-2xl p-4 text-sm ${msg.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">📦</div>
          <div>
            <div className="font-semibold">Billing – VF01</div>
            <div className="text-xs text-zinc-500">{Array.isArray(items)?items.length:0} records • COMPANY_CODE {companyCode} • API: POST /api/billing</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DbAutocomplete
            label="DELIVERY_NUMBER *"
            value={(form as any).delivery_number}
            onChange={v=>setForm({...form,delivery_number:v})}
            apiUrl="/api/delivery"
            codeField="delivery_number"
            nameField="name"
            placeholder="DELIVERY_NUMBER"
            required
            createUrl={`/${companyCode}/sd/delivery`}
            createCode="VL01N"
            companyCode={companyCode}
          />
          <div>
            <label className="text-[11px] font-medium text-zinc-700 uppercase tracking-widest">AMOUNT *</label>
            <input value={(form as any).amount} onChange={e=>setForm({...form,amount:e.target.value.toUpperCase()})} className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black uppercase" placeholder="AMOUNT" />
          </div>
          <DbAutocomplete
            label="COMPANY_CODE *"
            value={(form as any).company_code}
            onChange={v=>setForm({...form,company_code:v})}
            apiUrl="/api/company-codes"
            codeField="code"
            nameField="name"
            placeholder="COMPANY_CODE"
            required
            createUrl={`/${companyCode}/fico/company-master`}
            createCode="OX02"
            companyCode={companyCode}
          />
        </div>
        <button onClick={create} className="mt-5 w-full bg-zinc-900 hover:bg-black text-white rounded-full px-5 py-3 text-sm font-medium transition-colors">Create VF01</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {(Array.isArray(items)?items:[]).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start">
              <div className="font-semibold text-sm">{(it.code||it.item_number||it.account_number||it.employee_number||it.pr_number||it.po_number||it.bom_number||it.order_number||it.name||'RECORD '+(idx+1))}</div>
              <span className="text-[10px] bg-zinc-900 text-white rounded-full px-2 py-0.5">VF01</span>
            </div>
            <div className="mt-2 text-xs text-zinc-500 line-clamp-2">{Object.entries(it).slice(0,5).map(([k,v])=>`${k.toUpperCase()}: ${String(v)}`).join(' • ')}</div>
          </div>
        ))}
        {(!items || (Array.isArray(items) && items.length===0)) && (
          <div className="col-span-2 bg-white rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
            <div className="text-sm text-zinc-500">No records yet – create first via VF01</div>
            <div className="text-xs text-zinc-400 mt-1">COMPANY_CODE {companyCode} • Function is destination</div>
          </div>
        )}
      </div>
          <div className="mt-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Related Masters – auto from dependencies – low importance</h4>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${companyCode}/sd/delivery`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SDLC</span><span>Delivery – required</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/foundation/customers`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">SCUC</span><span>Customer</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/payment-terms`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FAPT</span><span>Payment Terms</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/tax-codes`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FTXC</span><span>Tax Codes</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/posting-periods`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FPPE</span><span>Posting Period Control</span><span className="text-zinc-400">→</span></Link>
          <Link href={`/${companyCode}/fico/auto-account-determination`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300"><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">OBYC</span><span>Auto Account</span><span className="text-zinc-400">→</span></Link>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">These links help create necessary data needed in this form – data strictly used in practice – no dummy</p>
      </div>

</div>
  );

  return (
    <ModernModuleShell title="Billing" subtitle={`${Array.isArray(items)?items.length:0} records • ${companyCode} • VF01`} code="VF01" module="SD" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
