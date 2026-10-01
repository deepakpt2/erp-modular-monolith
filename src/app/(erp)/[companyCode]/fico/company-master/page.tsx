"use client";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function CompanyMasterRedirectPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [uiMode, setUiMode] = useState<'modern'|'classic'>('modern');

  useEffect(()=>{
    try {
      const saved = localStorage.getItem('erp-ui-mode');
      if (saved) setUiMode(saved as any);
      const handler = (e:any)=>setUiMode(e.detail);
      window.addEventListener('erp-ui-mode-change', handler as any);
      return ()=>window.removeEventListener('erp-ui-mode-change', handler as any);
    } catch {}
  }, []);

  const modern = uiMode==='modern';

  return (
    <div className={modern ? "min-h-screen bg-[#fafaf9] p-6" : "min-h-screen bg-white p-4"}>
      <div className={modern ? "max-w-[800px] mx-auto space-y-6" : "max-w-[700px] mx-auto space-y-4"}>
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border-b pb-4"}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">🏢</div>
            <div>
              <h1 className={modern ? "text-xl font-bold tracking-tight" : "text-lg font-bold"}>Company Master – Redirect to Legal Entity – One Code One Page</h1>
              <p className="text-sm text-zinc-500">Company: <b>{companyCode}</b> – Previously ELEC (legacy OX02) Company Master – now dedicated page Legal Entity ELEC – strict ERP usage no dummy</p>
              <p className="text-[11px] text-zinc-400 mt-1">General ERP terminology – Legal Entity not Company Code – but ELEC (legacy OX02) kept as searchable alias – Navigator tree replaces sidebar</p>
            </div>
          </div>
        </div>

        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-4" : "border p-4 space-y-3 bg-white"}>
          <h3 className={modern ? "font-semibold text-sm" : "font-semibold text-xs"}>Company Master Moved to Dedicated Page – One Code One Page</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Previously company-master page had multiple forms – now split into dedicated page <b>Legal Entity ELEC ELEC (legacy OX02) → /foundation/legal-entities</b> with single form CODE* NAME* COMPANY_GROUP_CODE* FK ECGC CURRENCY_CODE* FK FCYC FISCAL_CALENDAR_CODE* FK FFYC POSTING_PERIOD_VARIANT_CODE* FK FPPC – strict usage: fiscal calendar calculates FY/Period from posting date K4 2026-05-15 → FY2026 P02, posting period variant controls posting period open/close – each page has single form with modes Create/Change/Display/List – border yellow empty green valid red invalid – short button Create Legal Entity – code in heading badge – bottom Related Masters low importance auto FK – e.g., ELEC page bottom shows ECGC, FCYC, FFYC, FPPC links – muted small – helps create necessary data – data strictly used in practice – no dummy – general ERP terminology – SAP aliases for search only – Navigator tree replaces sidebar.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/${companyCode}/foundation/legal-entities`} className={modern ? "px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-zinc-800" : "border px-4 py-1.5 text-xs bg-black text-white"}>Go to Legal Entity ELEC ELEC (legacy OX02) → /foundation/legal-entities</Link>
            <Link href={`/${companyCode}/foundation/company-groups`} className={modern ? "px-4 py-2 rounded-full border text-xs hover:bg-zinc-50" : "border px-3 py-1 text-xs"}>Company Group ECGC OX15</Link>
            <Link href={`/${companyCode}/navigator`} className={modern ? "px-4 py-2 rounded-full border text-xs hover:bg-zinc-50" : "border px-3 py-1 text-xs"}>🌳 Navigator</Link>
          </div>
        </div>

        <div className={modern ? "bg-zinc-50 rounded-2xl border border-zinc-200 p-4" : "border p-3 bg-zinc-50"}>
          <h4 className={modern ? "text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2" : "text-[10px] uppercase text-zinc-500 mb-1"}>Related Masters – auto from dependencies – low importance</h4>
          <div className="flex flex-wrap gap-2">
            <Link href={`/${companyCode}/foundation/company-groups`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}>
              <span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">ECGC</span>
              <span>Company Group – required</span>
              <span className="text-zinc-400">→</span>
            </Link>
            <Link href={`/${companyCode}/foundation/legal-entities`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}>
              <span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">ELEC</span>
              <span>Legal Entity – dedicated</span>
              <span className="text-zinc-400">→</span>
            </Link>
            <Link href={`/${companyCode}/fico/fiscal-calendars`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}>
              <span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FFYC</span>
              <span>Fiscal Calendar – required</span>
              <span className="text-zinc-400">→</span>
            </Link>
            <Link href={`/${companyCode}/fico/posting-period-variants`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}>
              <span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FPPC</span>
              <span>Posting Period Variant – required</span>
              <span className="text-zinc-400">→</span>
            </Link>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">These links help create necessary data needed in this form – data strictly used in practice – no dummy</p>
        </div>
      </div>
    </div>
  );
}
