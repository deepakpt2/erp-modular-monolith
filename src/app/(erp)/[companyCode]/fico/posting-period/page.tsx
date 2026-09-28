"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function PostingPeriodPage(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState<string|null>(null);
  const [form,setForm]=useState({code:'',name:''});
  const [showForm,setShowForm]=useState(false);

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/posting-period-variants').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  const handleCreate = async () => {
    if(!form.code||!form.name){ setMsg('Code and name required'); return; }
    const res = await fetch('/api/posting-period-variants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ Posting Period Variant ${res.variant.code} created – OBBO/OB52`); setShowForm(false); setForm({code:'',name:''}); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  const handleDelete = async (code:string) => {
    if(!confirm(`Delete posting period variant ${code}?`)) return;
    const res = await fetch(`/api/posting-period-variants?code=${code}`,{method:'DELETE'}).then(r=>r.json());
    setMsg(res.success?`✅ ${res.message}`:`❌ ${res.error}`);
    if(res.success) load();
  };

  if(loading) return <div className="p-6">Loading posting period variants OBBO/OB52...</div>;
  const variants = data?.postingPeriodVariants||[];
  const periods = data?.postingPeriods||[];

  return (
    <ModernModuleShell
      title="Posting Period Variant – OBBO/OB52"
      subtitle={`${variants.length} Variants • ${periods.length} Periods • OBBO/OB52/OBBP – Configurable`}
      code="OBBO"
      module="FICO"
      tooltip={`OBBO Define Posting Period Variant, OB52 Open and Close Posting Periods, OBBP Assign Variant to Company Code – Configurable – Real DB data only.`}
    >
      <div className="max-w-[1600px] mx-auto p-6 space-y-4">
        {msg && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm">{msg}</div>}

        <div className="flex justify-between items-center">
          <h3 className="font-medium">Posting Period Variants OBBO – {variants.length}</h3>
          <div className="flex gap-2">
            <button onClick={()=>setShowForm(!showForm)} className="text-xs bg-black text-white rounded-full px-3 py-1.5">+ Create Variant OBBO</button>
            <button onClick={load} className="text-xs border rounded-full px-3 py-1.5 bg-white">Refresh</button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white border rounded-2xl p-5 space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div><label className="text-xs text-zinc-500">Code * e.g., 1000</label><input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} placeholder="1000" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-zinc-500">Name *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Standard Posting Variant" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
            </div>
            <button onClick={handleCreate} className="bg-black text-white rounded-full px-4 py-2 text-xs">Create Variant – OBBO</button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-2xl p-5">
            <h4 className="font-medium text-sm">Variants OBBO – {variants.length}</h4>
            <div className="mt-3 space-y-2">
              {variants.map((v:any)=>(
                <div key={v.code} className="border rounded-xl p-3 bg-zinc-50 flex justify-between">
                  <div><div className="font-medium text-sm">{v.code} – {v.name}</div><div className="text-xs text-zinc-500">OBBO Variant</div></div>
                  <button onClick={()=>handleDelete(v.code)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white self-center">Delete</button>
                </div>
              ))}
              {variants.length===0 && <div className="text-sm text-zinc-500">No variants – Fresh deployment – Create first via + Create</div>}
            </div>
          </div>
          <div className="bg-white border rounded-2xl p-5">
            <h4 className="font-medium text-sm">Open/Close Periods OB52 – {periods.length}</h4>
            <div className="mt-3 space-y-1 max-h-[400px] overflow-auto text-xs">
              {periods.map((p:any)=>(
                <div key={p.id} className="border rounded-lg p-2 bg-zinc-50 flex justify-between"><span>{p.variant_code} – Type {p.account_type} – {p.from_period}/{p.from_year} → {p.to_period}/{p.to_year}</span></div>
              ))}
              {periods.length===0 && <div className="text-zinc-500">No periods – Fresh deployment</div>}
            </div>
            <div className="text-[11px] text-zinc-500 mt-2">OB52 Open and Close Posting Periods – Account Types + (All), A Assets, D Customers, K Vendors, M Materials, S G/L – Real DB</div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <h4 className="font-medium text-sm">OBBP – Assign Posting Period Variant to Company Code – Real DB</h4>
          <div className="mt-2 text-xs text-zinc-500">OBBP assignment stored via company code – Posting period checks via OB52 in FI postings – No hardcoded guide data – Only real DB data.</div>
        </div>
      </div>
    </ModernModuleShell>
  );
}
