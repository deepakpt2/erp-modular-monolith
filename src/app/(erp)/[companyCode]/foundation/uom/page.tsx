"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function UomPage(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState<string|null>(null);
  const [form,setForm]=useState({code:'',name:'',dimension:'QUANTITY'});
  const [showForm,setShowForm]=useState(false);

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/uom').then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  const handleCreate = async () => {
    if(!form.code||!form.name){ setMsg('Code and name required'); return; }
    const res = await fetch('/api/uom',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.success){ setMsg(`✅ UoM ${res.uom.code} created`); setShowForm(false); setForm({code:'',name:'',dimension:'QUANTITY'}); load(); }
    else setMsg(`❌ ${res.error}`);
  };

  const handleDelete = async (code:string) => {
    if(!confirm(`Delete UoM ${code}?`)) return;
    const res = await fetch(`/api/uom?code=${code}`,{method:'DELETE'}).then(r=>r.json());
    if(res.success && !res.softDeleted){
      setMsg(`✅ ${res.message}`);
    } else if(res.softDeleted){
      setMsg(`❌ ${res.message || `Cannot delete – UoM ${code} has materials and cannot be deleted to maintain audit trail. Deactivated instead.`}`);
    } else {
      setMsg(res.error ? `❌ ${res.error}` : `❌ ${res.message}`);
    }
    load();
  };

  if(loading) return <ModernModuleShell title="Units of Measure" subtitle="Loading..." code="CUNI" module="FOUNDATION"><div className="p-6">Loading UoM CUNI...</div></ModernModuleShell>;
  const uoms = data?.uoms||[];

  return (
    <ModernModuleShell
      title="Units of Measure – CUNI"
      subtitle={`${uoms.length} UoMs`}
      code="CUNI"
      module="FOUNDATION"
      kpis={[
        { label: 'Total', value: String(uoms.length), icon: '⚖️' },
        { label: 'Active', value: String(uoms.filter((u:any)=>u.is_active).length), icon: '✅' },
        { label: 'Function Code', value: 'CUNI', icon: '🏷️' },
      ]}
      tooltip={`CUNI Define Units of Measure – Configurable base UoM like KG, G, L, ML, PC, BOX, PACK, KIT, M, TON`}
    >
      <div className="space-y-4">
        {msg && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm">{msg}</div>}

        <div className="flex justify-between items-center">
          <h3 className="font-medium text-sm">Units of Measure – {uoms.length}</h3>
          <div className="flex gap-2">
            <button onClick={()=>setShowForm(!showForm)} className="text-xs bg-zinc-900 text-white rounded-full px-3 py-1.5 hover:bg-black">+ Create</button>
            <button onClick={load} className="text-xs border rounded-full px-3 py-1.5 bg-white hover:bg-zinc-50">Refresh</button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white border rounded-2xl p-5 space-y-3">
            <div className="grid md:grid-cols-3 gap-3">
              <div><label className="text-xs text-zinc-500">Code * e.g., KG</label><input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} placeholder="KG" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-zinc-500">Name *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Kilogram" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-zinc-500">Dimension</label><select value={form.dimension} onChange={e=>setForm({...form,dimension:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1"><option>QUANTITY</option><option>WEIGHT</option><option>VOLUME</option><option>LENGTH</option><option>TIME</option></select></div>
            </div>
            <button onClick={handleCreate} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs hover:bg-black">Create</button>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {uoms.map((u:any)=>(
            <div key={u.code} className="bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex justify-between"><span className="font-mono font-bold text-sm bg-zinc-900 text-white rounded-full px-2.5 py-0.5">{u.code}</span><span className={`text-[10px] rounded-full px-2 py-0.5 border ${u.is_active?'bg-green-50 border-green-200 text-green-700':'bg-red-50 border-red-200 text-red-700'}`}>{u.is_active?'Active':'Inactive'}</span></div>
              <div className="mt-2 font-medium text-sm">{u.name}</div>
              <div className="text-xs text-zinc-500 mt-1">{u.dimension}</div>
              <div className="mt-3 flex gap-2">
                <button onClick={()=>handleDelete(u.code)} className="text-xs border rounded-full px-3 py-1.5 bg-white hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors">Delete</button>
              </div>
            </div>
          ))}
          {uoms.length===0 && <div className="col-span-3 border rounded-xl p-8 text-center text-sm text-zinc-500 bg-zinc-50">No UoMs – Create first via + Create</div>}
        </div>
      </div>
    </ModernModuleShell>
  );
}
