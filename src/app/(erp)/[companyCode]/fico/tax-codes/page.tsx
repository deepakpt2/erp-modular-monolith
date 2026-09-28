"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function TaxCodesPage(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState<string|null>(null);
  const [form,setForm]=useState({code:'',description:'',rate:'5',type:'INPUT',gl_account_number:''});
  const [showForm,setShowForm]=useState(false);

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/tax-codes').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  if(loading) return <div className="p-6">Loading tax codes FTXP...</div>;
  const taxCodes = data?.taxCodes||[];
  const erpDefaults = data?.erpDefaults||[];

  const handleCreate = async () => {
    if (!form.code || !form.description || form.rate==='') { setMessage('Code, description, rate required'); return; }
    const res = await fetch('/api/tax-codes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form, rate: parseFloat(form.rate)})}).then(r=>r.json());
    if (res.success) { setMessage(`✅ Tax Code ${res.taxCode.code} ${form.rate}% created – FTXP configurable – VAT 5% etc`); setShowForm(false); setForm({code:'',description:'',rate:'5',type:'INPUT',gl_account_number:''}); load(); }
    else setMessage(`❌ ${res.error}`);
  };

  const handleDelete = async (code:string) => {
    if (!confirm(`Delete Tax Code ${code}?`)) return;
    const res = await fetch(`/api/tax-codes?code=${code}`,{method:'DELETE'}).then(r=>r.json());
    setMessage(res.success ? `✅ ${res.message}` : `❌ ${res.error}`);
    load();
  };

  return (
    <ModernModuleShell
      title="Tax Codes FTXP"
      subtitle={`${taxCodes.length} Tax Codes`}
      code="FTXP"
      module="FICO"
      tooltip={`FTXP Tax Codes – VAT 5% V5 Input 5% A5 Output 5% – Kuwait/GCC VAT 5%, KSA VAT 15%, GST India 5% spices GST5, 12%, 18%, 28%, IGST – Configurable: add new tax code via POST, edit via PUT, delete blocked if has FI postings for security (soft is_active=false). ERP defaults kept like ERP: V0/V5/A0/A5 + GST.`}
      kpis={[
        {label:'Total', value: taxCodes.length.toString(), icon:'🧾'},
        {label:'VAT 5%', value: taxCodes.filter((t:any)=>t.rate==5).length.toString(), icon:'💰'},
        {label:'GST', value: taxCodes.filter((t:any)=>t.code.startsWith('GST')||t.code.startsWith('IGST')).length.toString(), icon:'🇮🇳'},
      ]}
    >
      <div className="max-w-[1600px] mx-auto p-6 space-y-4">
        {message && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm">{message}</div>}

                <div className="flex justify-between items-center">
          <h3 className="font-medium">Tax Codes – {taxCodes.length}</h3>
          <div className="flex gap-2">
            <button onClick={()=>setShowForm(!showForm)} className="text-xs bg-zinc-900 text-white rounded-full px-3 py-1.5">+ Create</button>
            <button onClick={load} className="text-xs border rounded-full px-3 py-1.5 bg-white">Refresh</button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white border rounded-2xl p-5 space-y-3">
            <div className="grid md:grid-cols-5 gap-3">
              <div><label className="text-xs text-zinc-500">Code * e.g., V5</label><input value={form.code} onChange={e=>setForm({...form, code:e.target.value.toUpperCase()})} placeholder="V5" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-zinc-500">Description *</label><input value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Input Tax 5% VAT 5%" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-zinc-500">Rate % * e.g., 5</label><input type="number" value={form.rate} onChange={e=>setForm({...form, rate:e.target.value})} placeholder="5" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-zinc-500">Type</label><select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1"><option>INPUT</option><option>OUTPUT</option></select></div>
              <div><label className="text-xs text-zinc-500">GL Account e.g., 130000</label><input value={form.gl_account_number} onChange={e=>setForm({...form, gl_account_number:e.target.value})} placeholder="130000" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
            </div>
            <button onClick={handleCreate} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs">Create</button>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {taxCodes.map((t:any)=>(
            <div key={t.code} className={`border rounded-xl p-4 ${t.rate==5?'bg-yellow-50 border-yellow-200':'bg-white'}`}>
              <div className="flex justify-between"><span className="font-medium">{t.code} {t.description}</span><span className={`text-xs border rounded-full px-2 py-0.5 ${t.rate==5?'bg-yellow-200 border-yellow-300':'bg-white'}`}>{t.rate}% {t.type}</span></div>
              <div className="text-xs text-zinc-500 mt-1">G/L: {t.account_number||'Not assigned'} {t.gl_name||''} • Active: {t.is_active?'Yes':'No'}</div>
              <div className="text-[11px] text-zinc-400 mt-1">{t.code.startsWith('GST')?'INR GST – VAT 5% equivalent if 5%':t.code.startsWith('IGST')?'IGST Export':'KWD VAT – VAT 5% if V5/A5'} • Used in PO lines tax_code_id, IV tax_amount, Sales FI GST Payable</div>
              <button onClick={()=>handleDelete(t.code)} className="mt-2 text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button>
            </div>
          ))}
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <h4 className="font-medium text-sm">ERP Defaults – General Tax Codes like in ERP – FTXP – VAT 5% included</h4>
          <div className="mt-3 grid md:grid-cols-2 gap-2 text-xs">
            {erpDefaults.map((s:any)=><div key={s.code} className="bg-zinc-50 border rounded-xl p-3"><b>{s.code}</b> {s.description} – {s.rate}% {s.type} – Code {s.code} – GL {s.gl||''} {s.note||''}</div>)}
          </div>
          <div className="mt-3 text-[11px] text-zinc-500">Tax codes seeded: V0 0% Input, V5 5% VAT 5% Input – Kuwait/GCC VAT 5% – configurable, V14/V15 14%/15% KSA VAT, A0 0% Output, A5 5% VAT 5% Output, GST0 0%, GST5 5% Spices VAT 5% equivalent, GST12/18/28, IGST0/5/18 – all like ERP FTXP. You can add new like V10 10% VAT, etc via + Create.</div>
        </div>
      </div>
    </ModernModuleShell>
  );
}
