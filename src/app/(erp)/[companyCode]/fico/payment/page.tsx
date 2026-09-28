"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function PaymentPage(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [form,setForm]=useState({companyCode:companyCode, vendorId:'', customerId:'', amount:'', paymentMethod:'BANK', bankGlAccount:'', reference:'', postingDate:'', headerText:'', apInvoiceIds:[] as string[]});
  const [msg,setMsg]=useState('');

  async function load(){
    setLoading(true);
    try{
      const payRes = await fetch(`/api/payment?companyCode=${companyCode}`).then(r=>r.json());
      setData(payRes);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[companyCode]);
  useEffect(()=>{setForm(f=>({...f,companyCode}));},[companyCode]);

  async function postPayment(){
    setMsg('Posting payment KZ F-53...');
    try{
      const res = await fetch('/api/payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form, amount: parseFloat(form.amount)})});
      const j = await res.json();
      if(j.success){ setMsg(`✅ ${j.message} - Payment ${j.paymentNumber} ${j.amount} ${j.currency}`); load(); } else setMsg(`❌ ${j.error}`);
    }catch(e:any){ setMsg(`❌ ${e.message}`); }
  }

  if(loading) return <ModernModuleShell title="Payment Processing" subtitle={`Loading F-53 KZ • ${companyCode}`} code="F-53" module="FICO"><div className="p-6">Loading payment processing F-53 KZ 53*...</div></ModernModuleShell>;
  const payments = data?.payments||[];
  const apOpen = data?.apOpenItems||[];
  const ks01 = data?.ks01||'';

  const modernContent = (
    <>
        <div className="bg-white rounded-2xl border p-5 mb-6">
          <h3 className="font-medium">Post Vendor Payment KZ F-53 • 53* 5300000000-5399999999 • Function F-53</h3>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <input placeholder="Company KS01/1000" value={form.companyCode} onChange={e=>setForm({...form,companyCode:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
            <input placeholder="Vendor ID" value={form.vendorId} onChange={e=>setForm({...form,vendorId:e.target.value})} className="border rounded-xl px-3 py-2 text-sm col-span-2"/>
            <input placeholder="Amount" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
            <select value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"><option value="BANK">BANK</option><option value="CASH">CASH</option><option value="CHEQUE">CHEQUE</option></select>
            <input placeholder="Bank GL 8000000001" value={form.bankGlAccount} onChange={e=>setForm({...form,bankGlAccount:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
            <input placeholder="Reference" value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
            <input placeholder="Header Text" value={form.headerText} onChange={e=>setForm({...form,headerText:e.target.value})} className="border rounded-xl px-3 py-2 text-sm col-span-2"/>
          </div>
          <div className="mt-3 flex gap-2"><button onClick={postPayment} className="bg-black text-white rounded-xl px-4 py-2 text-sm">Post Payment KZ F-53 • 53*</button><span className="text-sm self-center">{msg}</span></div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-zinc-50 border rounded-xl p-3"><b>Vendor Payment KZ 53*</b> Dr Vendor Recon 2000000000 Cr Bank 8000000001 / Cash 8000000000 • 53* 5300000000-5399999999</div>
            <div className="bg-zinc-50 border rounded-xl p-3"><b>Customer Payment DZ</b> Dr Bank Cr Customer Recon 6000000000 • Function F-28</div>
            <div className="bg-zinc-50 border rounded-xl p-3"><b>Payroll Payment ZP</b> Dr Salaries Payable 210001 Cr Bank 100010 / Cash 100010</div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl border p-5">
            <h3 className="font-medium">AP Open Items • {apOpen.length} • Company {companyCode}</h3>
            <div className="mt-4 space-y-2 max-h-[600px] overflow-auto">
              {apOpen.length===0 && <div className="text-sm text-zinc-500 p-4 border rounded-xl bg-zinc-50">No open AP invoices for {companyCode}. Create IV via MIRO then pay via KZ F-53 here.</div>}
              {apOpen.map((ap:any)=>(
                <div key={ap.id} className="border rounded-xl p-3 bg-zinc-50">
                  <div className="flex justify-between"><span className="font-medium text-sm">{ap.invoice_number} {ap.vendor_number} {ap.vendor_name}</span><span className="text-xs bg-white border rounded-full px-2 py-0.5">{ap.currency} {ap.gross_amount}</span></div>
                  <div className="text-xs text-zinc-500 mt-1">Net: {ap.net_amount} • Due: {ap.due_date?.substring(0,10)} • Status: {ap.status}</div>
                  <div className="mt-2 flex gap-2"><button onClick={()=>setForm({...form, vendorId: ap.vendor_id, amount: ap.gross_amount, reference: ap.invoice_number, apInvoiceIds: [ap.id]})} className="text-xs bg-black text-white rounded-full px-3 py-1">Select for Payment KZ</button></div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl border p-5">
            <h3 className="font-medium">Payment Documents KZ 53* • {payments.length} • Company {companyCode}</h3>
            <div className="mt-4 space-y-2 max-h-[600px] overflow-auto">
              {payments.map((p:any)=>(
                <div key={p.id} className="border rounded-xl p-3 bg-zinc-50">
                  <div className="flex justify-between"><span className="font-medium text-sm">{p.document_number} {p.doc_type} {p.reference_doc_type}</span><span className="text-xs bg-white border rounded-full px-2 py-0.5">{p.currency} {p.total_debit}</span></div>
                  <div className="text-xs text-zinc-500 mt-1">Posting: {p.posting_date?.substring(0,10)} • Ref: {p.reference_doc_number} • Lines: {p.line_count} • Status: {p.status}</div>
                  <div className="text-xs mt-1">{p.header_text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
    </>
  );

  const classicContent = (
    <>
          <div className="bg-white border-2 border-black p-2 mb-2">
            <div className="font-bold">Post Vendor Payment KZ F-53 - 53* - Company {companyCode}</div>
            <div className="flex gap-1 mt-1 flex-wrap">
              <input placeholder="Company KS01" value={form.companyCode} onChange={e=>setForm({...form,companyCode:e.target.value})} className="border border-black px-1 w-16"/>
              <input placeholder="Vendor ID" value={form.vendorId} onChange={e=>setForm({...form,vendorId:e.target.value})} className="border border-black px-1 w-24"/>
              <input placeholder="Amount" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="border border-black px-1 w-20"/>
              <select value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})} className="border border-black px-1"><option>BANK</option><option>CASH</option><option>CHEQUE</option></select>
              <input placeholder="Bank GL" value={form.bankGlAccount} onChange={e=>setForm({...form,bankGlAccount:e.target.value})} className="border border-black px-1 w-24"/>
              <input placeholder="Reference" value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})} className="border border-black px-1 w-24"/>
              <button onClick={postPayment} className="border border-black bg-[#d4d0c8] px-2">Post KZ F-53</button><span>{msg}</span>
            </div>
          </div>
          <div className="bg-white border-2 border-black p-2 mb-2">
            <div className="font-bold">AP Open Items - {apOpen.length} - Company {companyCode}</div>
            <table className="w-full border border-black mt-1"><thead><tr className="bg-[#d4d0c8]"><th className="border border-black px-1">Invoice No</th><th className="border border-black px-1">Vendor</th><th className="border border-black px-1">Amount</th><th className="border border-black px-1">Currency</th><th className="border border-black px-1">Due</th><th className="border border-black px-1">Status</th></tr></thead><tbody>{apOpen.map((ap:any)=><tr key={ap.id}><td className="border border-black px-1">{ap.invoice_number}</td><td className="border border-black px-1">{ap.vendor_number} {ap.vendor_name}</td><td className="border border-black px-1">{ap.gross_amount}</td><td className="border border-black px-1">{ap.currency}</td><td className="border border-black px-1">{ap.due_date?.substring(0,10)}</td><td className="border border-black px-1">{ap.status}</td></tr>)}</tbody></table>
          </div>
          <div className="bg-white border-2 border-black p-2">
            <div className="font-bold">Payment Documents KZ 53* - {payments.length}</div>
            <table className="w-full border border-black mt-1"><thead><tr className="bg-[#d4d0c8]"><th className="border border-black px-1">Doc No</th><th className="border border-black px-1">Type</th><th className="border border-black px-1">Posting Date</th><th className="border border-black px-1">Amount</th><th className="border border-black px-1">Currency</th></tr></thead><tbody>{payments.map((p:any)=><tr key={p.id}><td className="border border-black px-1">{p.document_number}</td><td className="border border-black px-1">{p.doc_type}</td><td className="border border-black px-1">{p.posting_date?.substring(0,10)}</td><td className="border border-black px-1">{p.total_debit}</td><td className="border border-black px-1">{p.currency}</td></tr>)}</tbody></table>
          </div>
    </>
  );

  return (
    <ModernModuleShell
      title="Payment Processing"
      subtitle={`F-53 Vendor Payment KZ 53* 5300000000-5399999999 • ${companyCode} • ${ks01}`}
      code="F-53"
      module="FICO"
      kpis={[
        { label: 'AP Open', value: String(apOpen.length), icon: '📥' },
        { label: 'Payments KZ', value: String(payments.length), icon: '💸' },
        { label: 'Company', value: companyCode, icon: '🏢' },
      ]}
      tooltip={`F-53 Vendor Payment – Doc Type KZ 53* Number Range 5300000000-5399999999
Flow: IV RE 51* creates AP Open Item Vendor Recon 2000000000
Payment KZ 53* Dr Vendor Recon Cr Bank 8000000001 SBI / Cash 8000000000
Payroll ZP Dr Salaries Payable 210001 Cr Bank/Cash
Customer DZ Dr Bank Cr Customer Recon 6000000000
Secure: Only INR default per OY03, KWD added by user via OY03
FUNCTION_MAP enforcement: This function available as F-53 – any new function with ERP code must be in app too`}
      classicChildren={classicContent}
    >
      {modernContent}
    </ModernModuleShell>
  );
}
