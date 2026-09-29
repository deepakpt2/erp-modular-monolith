"use client";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function WorkflowInboxPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [uiMode, setUiMode] = useState<'modern'|'classic'>('modern');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    try {
      const saved = localStorage.getItem('erp-ui-mode');
      if (saved) setUiMode(saved as any);
      const handler = (e:any)=>setUiMode(e.detail);
      window.addEventListener('erp-ui-mode-change', handler as any);
      return ()=>window.removeEventListener('erp-ui-mode-change', handler as any);
    } catch {}
  }, []);

  useEffect(()=>{
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/workflow?company_code=${companyCode}`).then(r=>r.json()).catch(()=>({}));
        setData(res);
      } catch {}
      setLoading(false);
    };
    load();
  }, [companyCode]);

  const modern = uiMode==='modern';

  if (loading) return <div className="p-6 font-mono text-xs">LOADING WORKFLOW INBOX...</div>;

  const items = data?.data || data?.inbox || data?.items || [];

  return (
    <div className={modern ? "min-h-screen bg-[#fafaf9] p-6" : "min-h-screen bg-white p-4"}>
      <div className={modern ? "max-w-[1000px] mx-auto space-y-6" : "max-w-[900px] mx-auto space-y-4"}>
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border-b pb-4"}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">📥</div>
              <div>
                <h1 className={modern ? "text-xl font-bold tracking-tight" : "text-lg font-bold"}>Workflow Inbox – Approvals – FWFL SBWP</h1>
                <p className="text-sm text-zinc-500">Company: <b>{companyCode}</b> – Workflow approvals – task list – manager approval center – pending sign off requests – strict usage: PR/PO release via workflow</p>
                <p className="text-[11px] text-zinc-400 mt-1">General ERP terminology – Workflow Inbox not SBWP – but SBWP kept as searchable alias – Navigator tree replaces sidebar – one code one page</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${companyCode}/navigator`} className={modern ? "px-4 py-2 rounded-full border text-xs hover:bg-zinc-50" : "border px-3 py-1 text-xs"}>🌳 Navigator</Link>
            </div>
          </div>
          <div className={modern ? "flex items-center gap-1 mt-4 bg-zinc-100 rounded-full p-1 w-fit" : "flex items-center gap-1 mt-3 border-b"}>
            {['create','change','display','list'].map(m=>{
              const isActive = m==='list';
              return (
                <span key={m} className={modern ? `px-3 py-1.5 rounded-full text-xs font-medium ${isActive?'bg-black text-white':'text-zinc-600'}` : `px-3 py-1 text-xs ${isActive?'border-b-2 border-black font-bold':'text-zinc-500'}`}>
                  {m.charAt(0).toUpperCase()+m.slice(1)}
                </span>
              );
            })}
          </div>
        </div>

        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border p-3"}>
          <h3 className={modern ? "font-semibold text-sm mb-3" : "font-semibold text-xs mb-2"}>Workflow Inbox – {Array.isArray(items)?items.length:0} pending approvals</h3>
          {Array.isArray(items) && items.length>0 ? (
            <div className="space-y-2">
              {items.slice(0,20).map((it:any, i:number)=>(
                <div key={i} className={modern ? "border rounded-xl p-3 text-sm" : "border p-2 text-xs"}>
                  <div className="font-medium">{it.document_type} {it.document_number} – {it.status}</div>
                  <div className="text-[11px] text-zinc-500">{it.description || JSON.stringify(it).slice(0,100)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className={modern ? "bg-zinc-50 rounded-xl p-4 text-sm text-zinc-500" : "bg-zinc-50 border p-3 text-xs"}>No pending approvals – Fresh deployment – PR/PO release via workflow – e.g., PR created → workflow inbox for manager approval → release</div>
          )}
        </div>

        <div className={modern ? "bg-zinc-50 rounded-2xl border border-zinc-200 p-4" : "border p-3 bg-zinc-50"}>
          <h4 className={modern ? "text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2" : "text-[10px] uppercase text-zinc-500 mb-1"}>Related Masters – auto from dependencies – low importance</h4>
          <div className="flex flex-wrap gap-2">
            <Link href={`/${companyCode}/mm/pr`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}>
              <span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PPRC</span>
              <span>PR – requires release</span>
              <span className="text-zinc-400">→</span>
            </Link>
            <Link href={`/${companyCode}/mm/po`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}>
              <span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PPOC</span>
              <span>PO – requires release</span>
              <span className="text-zinc-400">→</span>
            </Link>
            <Link href={`/${companyCode}/foundation/roles`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}>
              <span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FROC</span>
              <span>Roles – approval authority</span>
              <span className="text-zinc-400">→</span>
            </Link>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">These links help create necessary data needed in this form – data strictly used in practice – no dummy – workflow inbox shows pending approvals for PR/PO release</p>
        </div>
      </div>
    </div>
  );
}
