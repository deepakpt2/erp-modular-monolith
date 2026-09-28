"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function GLAccountsPage(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [selectedGL,setSelectedGL]=useState<any>(null);
  const [message,setMessage]=useState<string|null>(null);
  const [editForm,setEditForm]=useState({name:'',account_type:'ASSET',is_blocked:false,account_group:''});
  const [showEdit,setShowEdit]=useState(false);

  async function load(){
    setLoading(true);
    try{
      const res = await fetch(`/api/gl-accounts?companyCode=${companyCode}&search=${search}`).then(r=>r.json());
      setData(res);
      if (res.glAccounts?.length && !selectedGL) setSelectedGL(res.glAccounts[0]);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[companyCode]);
  useEffect(()=>{const t=setTimeout(()=>load(),300);return()=>clearTimeout(t);},[search]);

  if(loading) return <div className="p-6 text-sm text-zinc-500">Loading G/L accounts...</div>;
  const glAccounts = data?.glAccounts||[];
  const accountGroups = data?.accountGroups||[];

  const handleEdit = async () => {
    if (!selectedGL) return;
    const res = await fetch('/api/gl-accounts',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({account_number:selectedGL.account_number, ...editForm})}).then(r=>r.json());
    if (res.success) { setMessage(`✅ G/L ${selectedGL.account_number} updated – configurable`); setShowEdit(false); load(); setSelectedGL(res.glAccount); }
    else setMessage(`❌ ${res.error}`);
  };

  const handleDelete = async () => {
    if (!selectedGL) return;
    if (!confirm(`Delete G/L ${selectedGL.account_number}?`)) return;
    const res = await fetch(`/api/gl-accounts?account_number=${selectedGL.account_number}`,{method:'DELETE'}).then(r=>r.json());
    setMessage(res.success ? `✅ ${res.message}` : `❌ ${res.error}`);
    load();
    if (res.success) setSelectedGL(null);
  };

  const openEdit = () => {
    if (!selectedGL) return;
    setEditForm({name:selectedGL.name, account_type:selectedGL.account_type, is_blocked:selectedGL.is_blocked, account_group:selectedGL.account_group||''});
    setShowEdit(true);
  };

  return (
    <ModernModuleShell title="G/L Accounts" subtitle={`${glAccounts.length} accounts • ${companyCode} • Configurable`} code="FS00" module="FICO" tooltip={`FS00 G/L Accounts – Configurable: Add new via Chart of Accounts page, edit current via PUT, delete blocked if has FI postings for security – soft block is_blocked=true. Account Groups configurable via /api/account-groups. CoA configurable via /api/chart-of-accounts. Standard CoA seeded is ok.`} kpis={[
      {label:'Total', value: glAccounts.length.toString(), icon:'📒'},
      {label:'CoA', value: 'KSCA', icon:'📚'},
      {label:'Groups', value: accountGroups.length.toString(), icon:'🏷️'},
    ]}>
      {message && <div className="mb-4 bg-zinc-900 text-white rounded-xl p-3 text-sm">{message}</div>}
      <div className="flex justify-between items-center mb-4">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search G/L..." className="border rounded-full px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-black" />
        <div className="flex gap-2">
          <button onClick={openEdit} className="text-xs bg-zinc-900 text-white rounded-full px-3 py-2">Edit</button>
          <button onClick={handleDelete} className="text-xs border border-red-200 text-red-600 rounded-full px-3 py-2 bg-white">Delete</button>
          <button onClick={load} className="text-xs border rounded-full px-3 py-2 hover:bg-zinc-50 bg-white">Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5">
          <div className="bg-white rounded-2xl border divide-y max-h-[600px] overflow-auto">
            {glAccounts.map((g:any)=>(
              <div key={g.id} onClick={()=>setSelectedGL(g)} className={`p-3 cursor-pointer ${selectedGL?.id===g.id?'bg-zinc-900 text-white hover:bg-black':'hover:bg-zinc-50 bg-white text-zinc-700'}`}>
                <div className="font-mono font-medium text-sm">{g.account_number} {g.is_blocked?'(Blocked)':''}</div>
                <div className={`text-xs ${selectedGL?.id===g.id?'text-zinc-300':'text-zinc-500'}`}>{g.name} • {g.account_type} • {g.coa_code}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-7">
          {selectedGL ? (
            <div className="bg-white rounded-2xl border p-5">
              <h4 className="font-medium">{selectedGL.account_number} {selectedGL.name}</h4>
              <div className="mt-3 text-xs space-y-1">
                <div><b>Type:</b> {selectedGL.account_type}</div>
                <div><b>CoA:</b> {selectedGL.coa_code}</div>
                <div><b>Group:</b> {selectedGL.account_group || '–'}</div>
                <div><b>Blocked:</b> {selectedGL.is_blocked?'Yes':'No'}</div>
                <div><b>Balance Sheet:</b> {selectedGL.is_balance_sheet?'Yes':'No'}</div>
                <div><b>Auto Det Count:</b> {selectedGL.auto_det_count || 0}</div>
              </div>
              {showEdit && (
                <div className="mt-4 border rounded-xl p-3 bg-zinc-50 space-y-2">
                  <div><label className="text-xs text-zinc-500">Name</label><input value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
                  <div><label className="text-xs text-zinc-500">Type</label><select value={editForm.account_type} onChange={e=>setEditForm({...editForm, account_type:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1"><option>ASSET</option><option>LIABILITY</option><option>REVENUE</option><option>EXPENSE</option></select></div>
                  <div><label className="text-xs text-zinc-500">Account Group</label><select value={editForm.account_group} onChange={e=>setEditForm({...editForm, account_group:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1"><option value="">–</option>{accountGroups.map((ag:any)=><option key={ag.code} value={ag.code}>{ag.code} – {ag.name}</option>)}</select></div>
                  <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.is_blocked} onChange={e=>setEditForm({...editForm, is_blocked:e.target.checked})} /><label className="text-xs">Blocked</label></div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={()=>setShowEdit(false)} className="flex-1 border rounded-full py-2 text-xs">Cancel</button>
                    <button onClick={handleEdit} className="flex-1 bg-black text-white rounded-full py-2 text-xs">Save (PUT /api/gl-accounts)</button>
                  </div>
                </div>
              )}
            </div>
          ) : <div className="bg-white rounded-2xl border p-5 text-sm text-zinc-500">Select a G/L account</div>}
        </div>
      </div>
    </ModernModuleShell>
  );
}
