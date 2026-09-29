"use client";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function DocumentFlowPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [uiMode, setUiMode] = useState<'modern'|'classic'>('modern');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchDoc, setSearchDoc] = useState('');

  useEffect(()=>{
    try {
      const saved = localStorage.getItem('erp-ui-mode');
      if (saved) setUiMode(saved as any);
      const handler = (e:any)=>setUiMode(e.detail);
      window.addEventListener('erp-ui-mode-change', handler as any);
      return ()=>window.removeEventListener('erp-ui-mode-change', handler as any);
    } catch {}
  }, []);

  const load = async (docNumber?: string) => {
    setLoading(true);
    try {
      const url = docNumber ? `/api/document-flow?document_number=${docNumber}&company_code=${companyCode}` : `/api/document-flow?company_code=${companyCode}`;
      const res = await fetch(url).then(r=>r.json()).catch(()=>({}));
      setData(res);
    } catch {}
    setLoading(false);
  };

  useEffect(()=>{ load(); }, [companyCode]);

  const modern = uiMode==='modern';

  const items = data?.data || data?.flows || data?.items || data?.documents || [];

  return (
    <div className={modern ? "min-h-screen bg-[#fafaf9] p-6" : "min-h-screen bg-white p-4"}>
      <div className={modern ? "max-w-[1000px] mx-auto space-y-6" : "max-w-[900px] mx-auto space-y-4"}>
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border-b pb-4"}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">🔗</div>
              <div>
                <h1 className={modern ? "text-xl font-bold tracking-tight" : "text-lg font-bold"}>Document Flow – ALB – AFLW – Document Tracking</h1>
                <p className="text-sm text-zinc-500">Company: <b>{companyCode}</b> – Document flow tracking – audit trail history – transaction links – business object sequence – e.g., PR → PO → GR → IV → Payment – strict usage: shows linked documents for a transaction</p>
                <p className="text-[11px] text-zinc-400 mt-1">General ERP terminology – Document Flow not ALB – but ALB kept as searchable alias – Navigator tree replaces sidebar – one code one page</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${companyCode}/navigator`} className={modern ? "px-4 py-2 rounded-full border text-xs hover:bg-zinc-50" : "border px-3 py-1 text-xs"}>🌳 Navigator</Link>
              <Link href={`/${companyCode}/audit/logs`} className={modern ? "px-4 py-2 rounded-full border text-xs hover:bg-zinc-50" : "border px-3 py-1 text-xs"}>Audit Logs</Link>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input value={searchDoc} onChange={e=>setSearchDoc(e.target.value)} placeholder="Enter document number e.g., PR-5000000001, PO-5000000001, GR-5000000001 to see flow" className={modern ? "flex-1 border border-zinc-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10" : "flex-1 border px-3 py-1.5 text-xs"} />
            <button onClick={()=>load(searchDoc)} className={modern ? "px-4 py-2 rounded-full bg-black text-white text-xs" : "border px-3 py-1 text-xs bg-black text-white"}>Search Flow</button>
          </div>
        </div>

        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border p-3"}>
          <h3 className={modern ? "font-semibold text-sm mb-3" : "font-semibold text-xs mb-2"}>Document Flow – {Array.isArray(items)?items.length:0} linked documents – e.g., PR → PO → GR → IV</h3>
          {loading ? <p className="text-sm text-zinc-500">Loading…</p> : Array.isArray(items) && items.length>0 ? (
            <div className="space-y-3">
              {items.slice(0,30).map((it:any, i:number)=>(
                <div key={i} className={modern ? "border rounded-xl p-4 flex items-center gap-3" : "border p-2 flex items-center gap-2"}>
                  <span className={modern ? "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black text-white" : "text-[9px] font-mono border px-1 bg-black text-white"}>{it.document_type || it.type}</span>
                  <span className={modern ? "font-mono text-sm" : "font-mono text-xs"}>{it.document_number || it.number}</span>
                  <span className="text-zinc-400">→</span>
                  <span className={modern ? "text-sm text-zinc-600" : "text-xs text-zinc-600"}>{it.status} {it.posting_date || ''}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-4">
                <span>Flow:</span>
                <span className="font-mono">PR-5000000001 → PO-5000000001 → GR-5000000001 → IV-5000000001 → PAY-5000000001</span>
              </div>
            </div>
          ) : (
            <div className={modern ? "bg-zinc-50 rounded-xl p-4 text-sm text-zinc-500" : "bg-zinc-50 border p-3 text-xs"}>No document flow – Fresh deployment – enter document number to see flow – e.g., PR-5000000001 shows linked PO, GR, IV, Payment – every business transaction creates distinct document number via FNRC number ranges + immutable audit trail via core_document + core_document_history – strict no dummy – e.g., PR Create → PO Create (reference PR) → GR 101 (reference PO) → IV MIRO (reference GR+PO) → Payment F-53 (reference IV) – flow tracked via reference and payload – strict ERP usage</div>
          )}
        </div>

        <div className={modern ? "bg-zinc-50 rounded-2xl border border-zinc-200 p-4" : "border p-3 bg-zinc-50"}>
          <h4 className={modern ? "text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2" : "text-[10px] uppercase text-zinc-500 mb-1"}>Related Masters – auto from dependencies – low importance</h4>
          <div className="flex flex-wrap gap-2">
            <Link href={`/${companyCode}/mm/pr`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}>
              <span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PPRC</span>
              <span>PR – start of flow</span>
              <span className="text-zinc-400">→</span>
            </Link>
            <Link href={`/${companyCode}/mm/po`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}>
              <span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PPOC</span>
              <span>PO – linked to PR</span>
              <span className="text-zinc-400">→</span>
            </Link>
            <Link href={`/${companyCode}/mm/gr`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}>
              <span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">IGRC</span>
              <span>GR – linked to PO</span>
              <span className="text-zinc-400">→</span>
            </Link>
            <Link href={`/${companyCode}/mm/iv`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}>
              <span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">PIVC</span>
              <span>IV – linked to GR+PO</span>
              <span className="text-zinc-400">→</span>
            </Link>
            <Link href={`/${companyCode}/fico/payment`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}>
              <span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FPYP</span>
              <span>Payment – linked to IV</span>
              <span className="text-zinc-400">→</span>
            </Link>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">These links help understand document flow – data strictly used in practice – no dummy – PR → PO → GR → IV → Payment flow tracked via reference and payload – immutable audit trail</p>
        </div>
      </div>
    </div>
  );
}
