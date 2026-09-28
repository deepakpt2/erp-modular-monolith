"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function CostCentersPage(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [form,setForm]=useState({code:'',name:'',company_code:companyCode});
  const [editForm,setEditForm]=useState({code:'',name:'',company_code:companyCode});
  const [editing,setEditing]=useState<any>(null);
  const [msg,setMsg]=useState('');

  async function load(){
    setLoading(true);
    try{
      const res = await fetch(`/api/cost-centers?companyCode=${companyCode}`).then(r=>r.json());
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[companyCode]);

  async function create(){
    setMsg('Creating...');
    try{
      const res = await fetch('/api/cost-centers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const j = await res.json();
      if(j.success){ setMsg(`✅ ${j.message}`); load(); setForm({code:'',name:'',company_code:companyCode}); } else setMsg(`❌ ${j.error}`);
    }catch(e:any){ setMsg(`❌ ${e.message}`); }
  }

  async function update(){
    if(!editing) return;
    setMsg('Updating...');
    try{
      const res = await fetch('/api/cost-centers',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editing.id, ...editForm})});
      const j = await res.json();
      if(j.success){ setMsg(`✅ ${j.message}`); setEditing(null); load(); } else setMsg(`❌ ${j.error}`);
    }catch(e:any){ setMsg(`❌ ${e.message}`); }
  }

  async function del(code:string){
    if(!confirm(`Delete cost center ${code}?`)) return;
    try{
      const res = await fetch(`/api/cost-centers?code=${code}`,{method:'DELETE'});
      const j = await res.json();
      if(j.success){ setMsg(`✅ ${j.message}`); load(); } else {
        // Show audit trail message when blocked
        const detail = j.empCount || j.postingCount ? ` (${j.empCount||0} employees, ${j.postingCount||0} postings)` : '';
        setMsg(`❌ ${j.error}${detail ? '' : ''} – Cannot be deleted to maintain audit trail.`);
        load();
      }
    }catch(e:any){ setMsg(`❌ ${e.message}`); }
  }

  if(loading) return <ModernModuleShell title="Cost Centers" subtitle={`Loading • ${companyCode}`} code="KS01" module="FICO"><div className="p-6">Loading cost centers...</div></ModernModuleShell>;
  const costCenters = data?.costCenters||[];

  return (
    <ModernModuleShell
      title={`Cost Centers • ${companyCode}`}
      subtitle={`${costCenters.length} Cost Centers`}
      code="KS01"
      module="FICO"
      kpis={[
        { label: 'Total', value: String(costCenters.length), icon: '🎯' },
        { label: 'Active', value: String(costCenters.filter((c:any)=>c.is_active).length), icon: '✅' },
        { label: 'Company', value: companyCode, icon: '🏢' },
      ]}
      tooltip={`KS01 Create, KS02 Change, KS03 Display Cost Center`}
    >
      <div className="space-y-4">
        {msg && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm">{msg}</div>}

        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-medium text-sm">Create Cost Center</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input placeholder="Code e.g. CC-KITCHEN-01" value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="border rounded-xl px-3 py-2 text-sm"/>
            <input placeholder="Name e.g. Main Kitchen" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="border rounded-xl px-3 py-2 text-sm col-span-2"/>
            <input placeholder={`Company ${companyCode}`} value={form.company_code} onChange={e=>setForm({...form,company_code:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
          </div>
          <div className="mt-3"><button onClick={create} className="bg-zinc-900 text-white rounded-xl px-4 py-2 text-sm hover:bg-black">Create</button></div>
        </div>

        {editing && (
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-medium text-sm">Edit {editing.code}</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="Code" value={editForm.code} onChange={e=>setEditForm({...editForm,code:e.target.value.toUpperCase()})} className="border rounded-xl px-3 py-2 text-sm"/>
              <input placeholder="Name" value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
              <input placeholder="Company" value={editForm.company_code} onChange={e=>setEditForm({...editForm,company_code:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={update} className="bg-zinc-900 text-white rounded-xl px-4 py-2 text-sm hover:bg-black">Save</button>
              <button onClick={()=>setEditing(null)} className="border rounded-xl px-4 py-2 text-sm hover:bg-zinc-50">Cancel</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {costCenters.length===0 && <div className="border rounded-xl p-4 bg-zinc-50 text-sm text-zinc-500 col-span-3">No cost centers – Create first via form above.</div>}
            {costCenters.map((c:any)=>(
              <div key={c.code} className="border rounded-xl p-4 bg-zinc-50 hover:bg-white transition-colors">
                <div className="flex justify-between items-start">
                  <span className="font-mono font-bold text-sm bg-zinc-900 text-white rounded-full px-2.5 py-0.5">{c.code}</span>
                  <span className={`text-[10px] rounded-full px-2 py-0.5 border ${c.is_active?'bg-green-50 border-green-200 text-green-700':'bg-red-50 border-red-200 text-red-700'}`}>{c.is_active?'Active':'Inactive'}</span>
                </div>
                <div className="mt-2 font-medium text-sm">{c.name}</div>
                <div className="text-xs text-zinc-500 mt-1">Company: {c.company_code} • {c.employee_count} employees • {c.posting_count} postings</div>
                <div className="mt-3 flex gap-2">
                  <button onClick={()=>{ setEditing(c); setEditForm({code:c.code, name:c.name, company_code:c.company_code}); }} className="text-xs border rounded-full px-3 py-1.5 bg-white hover:bg-zinc-900 hover:text-white transition-colors">Edit</button>
                  <button onClick={()=>del(c.code)} className="text-xs border border-zinc-200 rounded-full px-3 py-1.5 bg-white hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModernModuleShell>
  );
}
