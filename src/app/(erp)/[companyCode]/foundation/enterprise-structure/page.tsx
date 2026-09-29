"use client";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function EnterpriseStructureHubPage() {
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

  const sections = [
    {
      title: 'Company & Legal Structure',
      icon: '🏢',
      items: [
        { code: 'ECGC', label: 'Company Group', route: '/foundation/company-groups', desc: 'Root parent – holding umbrella – CG-100 – used by Legal Entity – strict: root of enterprise structure' },
        { code: 'ELEC', label: 'Legal Entity', route: '/foundation/legal-entities', desc: 'Statutory company code – LE-1000 – uses Company Group, Currency, Fiscal Calendar K4, Posting Period Variant 1000 – strict: fiscal calendar calculates FY/Period, posting variant controls posting period open/close' },
        { code: 'EFCC', label: 'Facility', route: '/foundation/facilities', desc: 'Operational site – FAC-1000 – uses Legal Entity – plant for production and inventory – strict: facility is plant' },
        { code: 'EILC', label: 'Inventory Location', route: '/foundation/inventory-locations', desc: 'Storage zone – IL-1000 – uses Facility – bins racks inventory zones – strict: stock per location' },
        { code: 'EWSC', label: 'Warehouse Site', route: '/foundation/warehouse-sites', desc: 'Warehouse number – WS-100 – uses Facility – warehouse zone bin location' },
      ]
    },
    {
      title: 'Procurement Structure',
      icon: '📦',
      items: [
        { code: 'EPDC', label: 'Procurement Division', route: '/foundation/procurement-divisions', desc: 'Purchasing organization – PD-100 – vendor negotiation team' },
        { code: 'EBTC', label: 'Buyer Team', route: '/foundation/buying-teams', desc: 'Buyer group – BT-100 – uses Procurement Division – buyer profile contact' },
        { code: 'PSUC', label: 'Supplier', route: '/foundation/suppliers', desc: 'Vendor master – SUP-1000 – partner_account role VENDOR + procurement view – strict: used in PO, GR, IV' },
      ]
    },
    {
      title: 'Commercial Structure',
      icon: '🛒',
      items: [
        { code: 'ECOC', label: 'Commercial Organization', route: '/foundation/commercial-orgs', desc: 'Sales organization – CO-1000 – uses Legal Entity' },
        { code: 'ESCC', label: 'Sales Channel', route: '/foundation/sales-channels', desc: 'Distribution channel – SC-10 – Wholesale/Retail' },
        { code: 'EPLC', label: 'Product Line', route: '/foundation/product-lines', desc: 'Product division – PL-100 – Spices' },
        { code: 'EPUC', label: 'Commercial Unit', route: '/foundation/commercial-units', desc: 'Profitability unit – CU-1000 – profit tracking' },
        { code: 'ECUC', label: 'Commercial Unit Assignment', route: '/foundation/commercial-unit-assign', desc: 'Assigns commercial unit to legal entity – strict: profit reporting by commercial unit' },
        { code: 'EBSC', label: 'Profit Center Assignment', route: '/foundation/profit-center-assign', desc: 'Assigns profit center to legal entity and cost center – strict: profit center reporting' },
        { code: 'EDPC', label: 'Distribution Path', route: '/foundation/distribution-paths', desc: 'Sales channel + product line – determines pricing and delivery – strict: pricing and delivery path' },
        { code: 'FCPC', label: 'Credit Policy Area', route: '/foundation/credit-policy-areas', desc: 'Credit control – CPA-1000 – credit_limit risk_category – strict: credit check on SO exposure calc – blocks if exposure+new exceeds limit' },
        { code: 'SCUC', label: 'Customer', route: '/foundation/customers', desc: 'Customer master – CUST-1000 – partner_account role CUSTOMER + sales view – strict: used in SO, Delivery, Billing – credit check, pricing, payment terms' },
      ]
    },
  ];

  return (
    <div className={modern ? "min-h-screen bg-[#fafaf9] p-6" : "min-h-screen bg-white p-4"}>
      <div className={modern ? "max-w-[1200px] mx-auto space-y-6" : "max-w-[1000px] mx-auto space-y-4"}>
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border-b pb-4"}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">🏢</div>
              <div>
                <h1 className={modern ? "text-xl font-bold tracking-tight" : "text-lg font-bold"}>Enterprise Structure Hub – One Code One Page Overview</h1>
                <p className="text-sm text-zinc-500">Company: <b>{companyCode}</b> – Previously 16 forms in one page with tabs – now split into dedicated pages – one code one page – strict ERP usage no dummy</p>
                <p className="text-[11px] text-zinc-400 mt-1">General ERP terminology – SAP aliases for search only – e.g., Company Group not OX15, Legal Entity not OX02, Facility not OX10 – but OX15/OX02/OX10 kept as searchable alias – Navigator tree replaces sidebar</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${companyCode}/navigator`} className={modern ? "px-4 py-2 rounded-full bg-black text-white text-xs" : "border px-3 py-1 text-xs bg-black text-white"}>🌳 Navigator – Tree Structure</Link>
              <Link href={`/${companyCode}/foundation/enterprise-config`} className={modern ? "px-4 py-2 rounded-full border text-xs hover:bg-zinc-50" : "border px-3 py-1 text-xs"}>Enterprise Config Hub</Link>
            </div>
          </div>
        </div>

        {sections.map((section, si)=>(
          <div key={si} className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden" : "border bg-white"}>
            <div className={modern ? "px-5 py-3.5 bg-zinc-50/80 border-b border-zinc-100 flex items-center gap-2" : "px-3 py-2 bg-zinc-100 border-b flex items-center gap-2"}>
              <span className="text-lg">{section.icon}</span>
              <span className={modern ? "font-semibold text-sm" : "font-semibold text-xs"}>{section.title}</span>
              <span className="ml-auto text-[11px] text-zinc-400">{section.items.length} functions</span>
            </div>
            <div className={modern ? "p-3 grid grid-cols-1 md:grid-cols-2 gap-2" : "p-2 space-y-1"}>
              {section.items.map((item, ii)=>(
                <Link key={ii} href={`/${companyCode}${item.route}`} className={modern ? "flex items-start gap-2.5 p-3 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200 group" : "flex items-start gap-2 p-2 hover:bg-zinc-50 border-b border-zinc-100"}>
                  <span className={modern ? "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black text-white shrink-0 mt-0.5" : "text-[9px] font-mono border px-1 bg-black text-white shrink-0"}>{item.code}</span>
                  <div className="min-w-0 flex-1">
                    <div className={modern ? "text-sm font-medium text-zinc-900 group-hover:text-black" : "text-xs font-medium"}>{item.label}</div>
                    <div className={modern ? "text-[11px] text-zinc-500 mt-0.5 leading-relaxed" : "text-[10px] text-zinc-500"}>{item.desc}</div>
                  </div>
                  <span className={modern ? "text-[10px] text-zinc-400 group-hover:text-zinc-900 mt-1" : "text-[10px] text-zinc-400"}>→</span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className={modern ? "bg-zinc-900 text-white rounded-2xl p-5" : "border p-3 bg-zinc-900 text-white"}>
          <h3 className={modern ? "font-semibold text-sm mb-2" : "font-semibold text-xs mb-1"}>One Code One Page – Strict ERP No Dummy – Previously Multiple Forms in One Page Now Dedicated</h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Previously enterprise-structure page had 16 forms with tabs company/control/facility/procurement/commercial/profit – functionally confusing – now split into dedicated pages – one code one page – e.g., ECGC Company Group → /foundation/company-groups with single form CODE* NAME* DESCRIPTION* TENANT_CODE* – ELEC Legal Entity → /foundation/legal-entities with CODE* NAME* COMPANY_GROUP_CODE* FK ECGC autocomplete CURRENCY_CODE* FK FCYC FISCAL_CALENDAR_CODE* FK FFYC POSTING_PERIOD_VARIANT_CODE* FK FPPC – strict usage: fiscal calendar calculates FY/Period from posting date K4 2026-05-15 → FY2026 P02, posting period variant controls OB52 open/close – EFCC Facility → /foundation/facilities with CODE* NAME* LEGAL_ENTITY_CODE* FK ELEC – etc. – each page has single form with modes Create/Change/Display/List – border yellow empty green valid red invalid – short button Create Company Group – code in heading badge – bottom Related Masters low importance auto FK – e.g., ELEC page bottom shows ECGC, FCYC, FFYC, FPPC links – muted small – helps create necessary data – data strictly used in practice – no dummy – general ERP terminology – SAP aliases for search only – Navigator tree replaces sidebar – no sidebar – tree is navigation.
          </p>
        </div>
      </div>
    </div>
  );
}
