"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function PRPage() {
  const params = useParams();
  const companyCode = (params?.companyCode as string) || '1000';
  const [prs, setPrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    company_code: companyCode, plant_code: '', sloc_code: '', material_code: '', quantity: '', uom_code: 'KG',
    estimated_price: '', delivery_date: '', doc_date: '', purchasing_org_code: '', purchasing_group_code: '',
    account_assignment: 'K', cost_center_code: '', gl_account_code: '', tax_code: '', header_text: '', item_text: '',
  });

  async function load(){
    setLoading(true);
    try{
      const res = await fetch(`/api/pr?limit=200&companyCode=${companyCode}&search=${encodeURIComponent(search)}`).then(r=>r.json());
      setPrs(res.prs || []);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[companyCode]);
  useEffect(()=>{const t=setTimeout(load,300);return()=>clearTimeout(t);},[search]);

  const handleCreate = async ()=>{
    if(!form.material_code || !form.quantity){ setMsg('MATERIAL_CODE and QUANTITY required'); return; }
    const res = await fetch('/api/pr',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ ${res.prNumber || form.material_code} CREATED`); setShowCreate(false); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  if(loading) return <div className="p-6 font-mono text-xs">LOADING...</div>;

  return (
    <ModernModuleShell title="Purchase Requisitions" subtitle={`${prs.length} PRS`} code="PPRC" module="MM">
      <div className="max-w-[1600px] mx-auto p-0 space-y-3">
        {msg && <div className="bg-black text-white font-mono text-xs p-2">{msg}</div>}
        <div className="flex justify-between items-center">
          <div className="font-mono text-[11px] font-bold">PPRC PR_CREATE ME51N {prs.length} <input value={search} onChange={e=>setSearch(e.target.value)} className="ml-2 border border-black px-1 py-0.5 text-[11px] w-40" /></div>
          <div className="flex gap-1">
            <button onClick={()=>setShowCreate(!showCreate)} className="text-[11px] font-mono bg-black text-white border border-black px-3 py-1">CREATE</button>
            <button onClick={load} className="text-[11px] font-mono border border-black px-3 py-1 bg-white">REFRESH</button>
          </div>
        </div>

        {showCreate && (
          <div className="bg-white border border-black p-3 space-y-2">
            <div className="font-mono text-[11px] font-bold border-b border-black pb-1">PPRC CREATE API: POST /api/pr {`{company_code, material_code, quantity, uom_code, plant_code, sloc_code}`}</div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div><div className="text-[10px] text-zinc-500">COMPANY_CODE</div><input value={form.company_code} onChange={e=>setForm({...form,company_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">MATERIAL_CODE</div><input value={form.material_code} onChange={e=>setForm({...form,material_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">QUANTITY</div><input value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">UOM_CODE</div><input value={form.uom_code} onChange={e=>setForm({...form,uom_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">PLANT_CODE</div><input value={form.plant_code} onChange={e=>setForm({...form,plant_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">SLOC_CODE</div><input value={form.sloc_code} onChange={e=>setForm({...form,sloc_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">ESTIMATED_PRICE</div><input value={form.estimated_price} onChange={e=>setForm({...form,estimated_price:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">DELIVERY_DATE</div><input type="date" value={form.delivery_date} onChange={e=>setForm({...form,delivery_date:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">DOC_DATE</div><input type="date" value={form.doc_date} onChange={e=>setForm({...form,doc_date:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">PURCHASING_ORG_CODE</div><input value={form.purchasing_org_code} onChange={e=>setForm({...form,purchasing_org_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">PURCHASING_GROUP_CODE</div><input value={form.purchasing_group_code} onChange={e=>setForm({...form,purchasing_group_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">ACCOUNT_ASSIGNMENT</div><input value={form.account_assignment} onChange={e=>setForm({...form,account_assignment:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">COST_CENTER_CODE</div><input value={form.cost_center_code} onChange={e=>setForm({...form,cost_center_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">GL_ACCOUNT_CODE</div><input value={form.gl_account_code} onChange={e=>setForm({...form,gl_account_code:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
              <div><div className="text-[10px] text-zinc-500">TAX_CODE</div><input value={form.tax_code} onChange={e=>setForm({...form,tax_code:e.target.value.toUpperCase()})} className="w-full border border-black px-1 py-1 uppercase text-xs" /></div>
              <div className="col-span-3"><div className="text-[10px] text-zinc-500">HEADER_TEXT</div><input value={form.header_text} onChange={e=>setForm({...form,header_text:e.target.value})} className="w-full border border-black px-1 py-1 text-xs" /></div>
            </div>
            <button onClick={handleCreate} className="bg-black text-white font-mono text-[11px] px-3 py-1 w-full">CREATE PPRC</button>
          </div>
        )}

        <div className="grid gap-1">
          {prs.map((pr:any)=>(
            <div key={pr.id || pr.pr_number} className="bg-white border border-black p-2 font-mono text-[11px]">
              <div className="font-bold">{pr.pr_number || pr.id} | MATERIAL_CODE={pr.material_code} QUANTITY={pr.quantity} UOM_CODE={pr.uom_code} PLANT_CODE={pr.plant_code}</div>
            </div>
          ))}
        </div>
      </div>
    </ModernModuleShell>
  );
}
