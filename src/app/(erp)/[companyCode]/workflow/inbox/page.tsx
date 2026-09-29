"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function Page(){
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/workflow?companyCode='+companyCode).then(r=>r.json()).catch(()=>({}));
      setData(res);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  if(loading) return <div className="p-6 font-mono text-xs">LOADING SBWP...</div>;
  const items = data?.data || data?.logs || data?.flows || data?.items || data?.report || data?.stock || data?.variants || data?.companyCodes || data?.inbox || data?.entries || [];

  const classicContent = (
    <div className="space-y-3 font-mono text-[11px]">
      {msg && <div className="bg-black text-white p-2">{msg}</div>}
      <div className="bg-white border-2 border-black p-3">
        <div className="font-bold border-b-2 border-black pb-1 mb-2">SBWP WORKFLOW INBOX – API: /api/workflow – {Array.isArray(items)?items.length:0} RECORDS</div>
        <div className="text-[10px]">COMPANY_CODE={companyCode} • Function is destination • Code is helper SBWP</div>
        <button onClick={load} className="mt-2 bg-black text-white px-3 py-1 w-full">REFRESH SBWP</button>
      </div>
      <div className="grid gap-2">
        {(Array.isArray(items) ? items : []).slice(0,20).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white border-2 border-black p-2"><pre className="whitespace-pre-wrap text-[10px]">{JSON.stringify(it,null,2)}</pre></div>
        ))}
        {(!items || (Array.isArray(items) && items.length===0)) && <div className="bg-[#ffffcc] border-2 border-black p-3">No data – Fresh deployment – COMPANY_CODE {companyCode}</div>}
      </div>
    </div>
  );

  const modernContent = (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {msg && <div className="rounded-2xl p-4 text-sm bg-zinc-900 text-white">{msg}</div>}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">📊</div>
            <div>
              <div className="font-semibold">Workflow Inbox – SBWP</div>
              <div className="text-xs text-zinc-500">{Array.isArray(items)?items.length:0} records • COMPANY_CODE {companyCode} • API: /api/workflow</div>
            </div>
          </div>
          <button onClick={load} className="text-xs border border-zinc-200 bg-white hover:bg-zinc-50 rounded-full px-4 py-2 transition-colors">Refresh</button>
        </div>
        <div className="mt-4 text-[11px] text-zinc-500 bg-zinc-50 rounded-xl p-3">Function is destination • Code SBWP is helper to identify function • Real DB data only.</div>
      </div>
      <div className="grid gap-3">
        {(Array.isArray(items) ? items : []).map((it:any, idx:number)=>(
          <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900 hover:shadow-sm transition-all">
            <pre className="text-xs whitespace-pre-wrap text-zinc-700">{JSON.stringify(it,null,2).slice(0,600)}</pre>
          </div>
        ))}
        {(!items || (Array.isArray(items) && items.length===0)) && (
          <div className="bg-white rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
            <div className="text-sm text-zinc-500">No data yet – Fresh deployment</div>
            <div className="text-xs text-zinc-400 mt-1">COMPANY_CODE {companyCode} • SBWP • Function Workflow Inbox</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ModernModuleShell title="Workflow Inbox" subtitle={`${Array.isArray(items)?items.length:0} records • ${companyCode} • SBWP`} code="SBWP" module="FOUNDATION" classicChildren={classicContent}>
      {modernContent}
    </ModernModuleShell>
  );
}
