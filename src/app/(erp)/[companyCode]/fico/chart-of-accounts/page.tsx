"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function ChartOfAccountsPage(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState<'coa'|'groups'|'gl'>('coa');
  const [message,setMessage]=useState<string|null>(null);
  const [coaForm,setCoaForm]=useState({code:'',name:'',description:''});
  const [groupForm,setGroupForm]=useState({code:'',name:'',description:''});
  const [glForm,setGlForm]=useState({coa_code:'KSCA',account_number:'',name:'',account_type:'ASSET',account_group:'KMAT'});
  const [showCoaForm,setShowCoaForm]=useState(false);
  const [showGroupForm,setShowGroupForm]=useState(false);
  const [showGlForm,setShowGlForm]=useState(false);

  async function load(){
    setLoading(true);
    try{
      const [glRes, coaRes, groupRes] = await Promise.all([
        fetch(`/api/gl-accounts?companyCode=${companyCode}`).then(r=>r.json()).catch(()=>({glAccounts:[],charts:[]})),
        fetch(`/api/chart-of-accounts`).then(r=>r.json()).catch(()=>({chartOfAccounts:[]})),
        fetch(`/api/account-groups`).then(r=>r.json()).catch(()=>({accountGroups:[]})),
      ]);
      setData({ gl: glRes, coa: coaRes, groups: groupRes });
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[companyCode]);

  if(loading) return <div className="p-6">Loading Chart of Accounts...</div>;
  const charts = data?.coa?.chartOfAccounts || data?.gl?.charts || [];
  const glAccounts = data?.gl?.glAccounts||[];
  const accountGroups = data?.groups?.accountGroups || data?.gl?.accountGroups || [];

  const handleCreateCoa = async () => {
    if (!coaForm.code || !coaForm.name) { setMessage('Code and name required'); return; }
    const res = await fetch('/api/chart-of-accounts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(coaForm)}).then(r=>r.json());
    if (res.success) { setMessage(`✅ CoA ${res.coa.code} created – configurable`); setShowCoaForm(false); setCoaForm({code:'',name:'',description:''}); load(); }
    else setMessage(`❌ ${res.error}`);
  };

  const handleCreateGroup = async () => {
    if (!groupForm.code || !groupForm.name) { setMessage('Code and name required'); return; }
    const res = await fetch('/api/account-groups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(groupForm)}).then(r=>r.json());
    if (res.success) { setMessage(`✅ Account Group ${res.accountGroup.code} created – configurable`); setShowGroupForm(false); setGroupForm({code:'',name:'',description:''}); load(); }
    else setMessage(`❌ ${res.error}`);
  };

  const handleCreateGl = async () => {
    if (!glForm.coa_code || !glForm.account_number || !glForm.name) { setMessage('CoA, account number, name required'); return; }
    const res = await fetch('/api/gl-accounts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(glForm)}).then(r=>r.json());
    if (res.success) { setMessage(`✅ G/L ${res.glAccount.account_number} created in ${glForm.coa_code} – configurable`); setShowGlForm(false); setGlForm({coa_code:'KSCA',account_number:'',name:'',account_type:'ASSET',account_group:'KMAT'}); load(); }
    else setMessage(`❌ ${res.error}`);
  };

  const handleDeleteCoa = async (code:string) => {
    if (!confirm(`Delete CoA ${code}?`)) return;
    const res = await fetch(`/api/chart-of-accounts?code=${code}`,{method:'DELETE'}).then(r=>r.json());
    setMessage(res.success ? `✅ ${res.message}` : `❌ ${res.error}`);
    load();
  };

  const handleDeleteGroup = async (code:string) => {
    if (!confirm(`Delete Account Group ${code}?`)) return;
    const res = await fetch(`/api/account-groups?code=${code}`,{method:'DELETE'}).then(r=>r.json());
    setMessage(res.success ? `✅ ${res.message}` : `❌ ${res.error}`);
    load();
  };

  const handleDeleteGl = async (acc:string) => {
    if (!confirm(`Delete G/L ${acc}?`)) return;
    const res = await fetch(`/api/gl-accounts?account_number=${acc}`,{method:'DELETE'}).then(r=>r.json());
    setMessage(res.success ? `✅ ${res.message}` : `❌ ${res.error}`);
    load();
  };

  return (
    <ModernModuleShell
      title="Chart of Accounts & Financial Config"
      subtitle={`${charts.length} CoAs • ${accountGroups.length} Groups • ${glAccounts.length} G/L`}
      code="OB13"
      module="FICO"
      tooltip={`OB13 Chart of Accounts – Configurable: Add new CoA, edit current, add new Account Groups (OBD4), add new G/L Accounts (FS00). Standard CoA seeded is ok. Deletion blocked if has transactions for security – soft block instead.`}
    >
      <div className="max-w-[1600px] mx-auto p-6 space-y-4">
        {message && <div className="bg-zinc-900 text-white rounded-xl p-3 text-sm">{message}</div>}

        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>setTab('coa')} className={`text-xs rounded-full px-4 py-2 border ${tab==='coa'?'bg-black text-white':'bg-white'}`}>CoA {charts.length}</button>
          <button onClick={()=>setTab('groups')} className={`text-xs rounded-full px-4 py-2 border ${tab==='groups'?'bg-black text-white':'bg-white'}`}>Account Groups {accountGroups.length}</button>
          <button onClick={()=>setTab('gl')} className={`text-xs rounded-full px-4 py-2 border ${tab==='gl'?'bg-black text-white':'bg-white'}`}>G/L Accounts {glAccounts.length}</button>
          <button onClick={load} className="text-xs border rounded-full px-4 py-2 bg-white">Refresh</button>
        </div>

                {tab==='coa' && (
          <div className="bg-white border rounded-2xl p-5">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Charts of Accounts – Configurable – Add New CoA or Edit Current</h3>
              <button onClick={()=>setShowCoaForm(!showCoaForm)} className="text-xs bg-zinc-900 text-white rounded-full px-3 py-1.5">+ Create CoA</button>
            </div>
            {showCoaForm && (
              <div className="mt-4 border rounded-xl p-4 bg-zinc-50 space-y-3">
                <div className="grid md:grid-cols-3 gap-3">
                  <div><label className="text-xs text-zinc-500">Code * (e.g., KSCA, TEST)</label><input value={coaForm.code} onChange={e=>setCoaForm({...coaForm, code:e.target.value.toUpperCase()})} placeholder="KSCA" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
                  <div><label className="text-xs text-zinc-500">Name *</label><input value={coaForm.name} onChange={e=>setCoaForm({...coaForm, name:e.target.value})} placeholder="Kerala Spices Chart" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
                  <div><label className="text-xs text-zinc-500">Description</label><input value={coaForm.description} onChange={e=>setCoaForm({...coaForm, description:e.target.value})} placeholder="India Chart" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
                </div>
                <button onClick={handleCreateCoa} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs">Create CoA</button>
                <div className="text-[11px] text-zinc-500">API: POST /api/chart-of-accounts – CoA configurable, edit via PUT, delete blocked if has G/L or FI for security.</div>
              </div>
            )}
            <div className="mt-4 space-y-2">
              {charts.map((c:any)=>(
                <div key={c.code} className="border rounded-xl p-3 bg-zinc-50 flex justify-between items-center">
                  <div><div className="font-medium text-sm">{c.code} {c.name}</div><div className="text-xs text-zinc-500">{c.description} • {c.gl_count || 0} G/L accounts</div></div>
                  <div className="flex gap-1">
                    <button onClick={()=>{ setCoaForm({code:c.code, name:c.name, description:c.description||''}); setShowCoaForm(true); }} className="text-xs border rounded-full px-2 py-1 bg-white">Edit</button>
                    <button onClick={()=>handleDeleteCoa(c.code)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='groups' && (
          <div className="bg-white border rounded-2xl p-5">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Account Groups – Configurable (OBD4) – KASS/KLIA/KREV/KEXP/KMAT etc</h3>
              <button onClick={()=>setShowGroupForm(!showGroupForm)} className="text-xs bg-zinc-900 text-white rounded-full px-3 py-1.5">+ Create Group</button>
            </div>
            {showGroupForm && (
              <div className="mt-4 border rounded-xl p-4 bg-zinc-50 space-y-3">
                <div className="grid md:grid-cols-3 gap-3">
                  <div><label className="text-xs text-zinc-500">Code * (e.g., KASS)</label><input value={groupForm.code} onChange={e=>setGroupForm({...groupForm, code:e.target.value.toUpperCase()})} placeholder="KASS" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
                  <div><label className="text-xs text-zinc-500">Name *</label><input value={groupForm.name} onChange={e=>setGroupForm({...groupForm, name:e.target.value})} placeholder="Assets" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
                  <div><label className="text-xs text-zinc-500">Description</label><input value={groupForm.description} onChange={e=>setGroupForm({...groupForm, description:e.target.value})} placeholder="Balance Sheet Assets" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
                </div>
                <button onClick={handleCreateGroup} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs">Create Group</button>
                <div className="text-[11px] text-zinc-500">API: POST /api/account-groups – Account Groups configurable, used to group G/L accounts in FS00. Examples: KASS Assets, KMAT Material Stock, KREV Revenue.</div>
              </div>
            )}
            <div className="mt-4 grid md:grid-cols-2 gap-2">
              {accountGroups.map((g:any)=>(
                <div key={g.code} className="border rounded-xl p-3 bg-zinc-50 flex justify-between">
                  <div><div className="font-medium text-sm">{g.code} {g.name}</div><div className="text-xs text-zinc-500">{g.description}</div></div>
                  <button onClick={()=>handleDeleteGroup(g.code)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white self-center">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='gl' && (
          <div className="bg-white border rounded-2xl p-5">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">G/L Accounts FS00 – {glAccounts.length} – Configurable – Add/Edit/Delete with security check</h3>
              <button onClick={()=>setShowGlForm(!showGlForm)} className="text-xs bg-zinc-900 text-white rounded-full px-3 py-1.5">+ Create G/L</button>
            </div>
            {showGlForm && (
              <div className="mt-4 border rounded-xl p-4 bg-zinc-50 space-y-3">
                <div className="grid md:grid-cols-4 gap-3">
                  <div><label className="text-xs text-zinc-500">CoA *</label><select value={glForm.coa_code} onChange={e=>setGlForm({...glForm, coa_code:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1">{charts.map((c:any)=><option key={c.code} value={c.code}>{c.code}</option>)}</select></div>
                  <div><label className="text-xs text-zinc-500">Account Number *</label><input value={glForm.account_number} onChange={e=>setGlForm({...glForm, account_number:e.target.value})} placeholder="5000000007" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
                  <div><label className="text-xs text-zinc-500">Name *</label><input value={glForm.name} onChange={e=>setGlForm({...glForm, name:e.target.value})} placeholder="Raw Material Stock 2" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" /></div>
                  <div><label className="text-xs text-zinc-500">Type</label><select value={glForm.account_type} onChange={e=>setGlForm({...glForm, account_type:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1"><option>ASSET</option><option>LIABILITY</option><option>REVENUE</option><option>EXPENSE</option></select></div>
                  <div><label className="text-xs text-zinc-500">Account Group</label><select value={glForm.account_group} onChange={e=>setGlForm({...glForm, account_group:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1"><option value="">Select Group</option>{accountGroups.map((g:any)=><option key={g.code} value={g.code}>{g.code} – {g.name}</option>)}</select></div>
                </div>
                <button onClick={handleCreateGl} className="bg-zinc-900 text-white rounded-full px-4 py-2 text-xs">Create G/L</button>
                <div className="text-[11px] text-zinc-500">API: POST /api/gl-accounts – G/L configurable, edit via PUT, delete blocked if has FI postings (soft block is_blocked=true) for security – prevents orphaned BKPF/BSEG.</div>
              </div>
            )}
            <div className="mt-4 space-y-2 max-h-[600px] overflow-auto">
              {glAccounts.map((g:any)=>(
                <div key={g.id} className="border rounded-xl p-3 bg-zinc-50 flex justify-between">
                  <div><div className="font-medium text-sm">{g.account_number} {g.name}</div><div className="text-xs text-zinc-500 mt-1">{g.account_type} • CoA:{g.coa_code} • Blocked:{g.is_blocked?'Yes':'No'} • AutoDet:{g.auto_det_count}</div></div>
                  <button onClick={()=>handleDeleteGl(g.account_number)} className="text-xs border border-red-200 text-red-600 rounded-full px-2 py-1 bg-white self-center">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModernModuleShell>
  );
}
