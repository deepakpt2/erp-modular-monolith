"use client";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function EnterpriseConfigPage() {
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
        const res = await fetch(`/api/enterprise-config?companyCode=${companyCode}`).then(r=>r.json()).catch(()=>({}));
        setData(res);
      } catch {}
      setLoading(false);
    };
    load();
  }, [companyCode]);

  const modern = uiMode==='modern';

  const sections = [
    {
      title: 'Enterprise Structure – Company & Legal',
      icon: '🏢',
      items: [
        { code: 'ECGC', label: 'Company Group', route: '/foundation/company-groups', desc: 'Root parent – holding umbrella – e.g., CG-100 – used by Legal Entity' },
        { code: 'ELEC', label: 'Legal Entity', route: '/foundation/legal-entities', desc: 'Statutory company code – LE-1000 – uses Company Group, Currency, Fiscal Calendar K4, Posting Period Variant 1000 – strict: fiscal calendar calculates FY/Period, posting variant controls OB52' },
        { code: 'EFCC', label: 'Facility', route: '/foundation/facilities', desc: 'Operational site – FAC-1000 – uses Legal Entity – plant for production and inventory' },
        { code: 'EILC', label: 'Inventory Location', route: '/foundation/inventory-locations', desc: 'Storage zone – IL-1000 – uses Facility – bins racks inventory zones' },
        { code: 'EWSC', label: 'Warehouse Site', route: '/foundation/warehouse-sites', desc: 'Warehouse number – WS-100 – uses Facility' },
      ]
    },
    {
      title: 'Enterprise Structure – Procurement & Commercial',
      icon: '🛒',
      items: [
        { code: 'EPDC', label: 'Procurement Division', route: '/foundation/procurement-divisions', desc: 'Purchasing organization – PD-100 – vendor negotiation team' },
        { code: 'EBTC', label: 'Buyer Team', route: '/foundation/buying-teams', desc: 'Buyer group – BT-100 – uses Procurement Division' },
        { code: 'ECOC', label: 'Commercial Organization', route: '/foundation/commercial-orgs', desc: 'Sales organization – CO-1000 – uses Legal Entity' },
        { code: 'ESCC', label: 'Sales Channel', route: '/foundation/sales-channels', desc: 'Distribution channel – SC-10 – Wholesale/Retail' },
        { code: 'EPLC', label: 'Product Line', route: '/foundation/product-lines', desc: 'Product division – PL-100 – Spices' },
        { code: 'EPUC', label: 'Commercial Unit', route: '/foundation/commercial-units', desc: 'Profitability unit – CU-1000 – profit tracking' },
        { code: 'ECUC', label: 'Commercial Unit Assignment', route: '/foundation/commercial-unit-assign', desc: 'Assigns commercial unit to legal entity' },
        { code: 'EBSC', label: 'Profit Center Assignment', route: '/foundation/profit-center-assign', desc: 'Assigns profit center to legal entity and cost center' },
        { code: 'EDPC', label: 'Distribution Path', route: '/foundation/distribution-paths', desc: 'Sales channel + product line – determines pricing and delivery' },
        { code: 'FCPC', label: 'Credit Policy Area', route: '/foundation/credit-policy-areas', desc: 'Credit control – CPA-1000 – credit_limit risk_category – strict: credit check on SO exposure calc' },
      ]
    },
    {
      title: 'Financials – Master Data',
      icon: '💰',
      items: [
        { code: 'FFYC', label: 'Fiscal Calendar', route: '/fico/fiscal-calendars', desc: 'K4 April-March, V3 Calendar Year – FROM_DATE TO_DATE required – strict: calculates FY/Period from posting date 2026-05-15 K4 → FY2026 P02' },
        { code: 'FEXC', label: 'Exchange Rates', route: '/fico/exchange-rates', desc: 'From currency to currency rate – FROM_DATE TO_DATE – strict: converts foreign currency' },
        { code: 'FNRC', label: 'Number Ranges', route: '/fico/number-ranges', desc: 'Object type prefix current_number fiscal_year – atomic next – strict: generates unique doc numbers PR PO GR IV SO DL BL' },
        { code: 'FTGC', label: 'Tax Groups', route: '/fico/tax-groups', desc: 'Group code rate – GST 18% – groups tax codes' },
        { code: 'FTXC', label: 'Tax Codes', route: '/fico/tax-codes', desc: 'GST0/5/12/18/28 IGST VAT 5% – rate ledger_account_code – strict: calculates tax amount on PO/SO/Billing' },
        { code: 'FCOA', label: 'Chart of Accounts', route: '/fico/chart-of-accounts', desc: 'KSCA – general CoA – groups GL accounts' },
        { code: 'FGLC', label: 'GL Accounts', route: '/fico/gl-accounts', desc: 'Account_number coa_code account_type – 5000000001 inventory, 2000000001 GR/IR – strict: auto account INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX) uses GL, field status' },
        { code: 'FCCA', label: 'Cost Centers', route: '/fico/cost-centers', desc: 'Code company_code – KS-CC-01..05 – strict: cost center required for expense GL via field status OBC5' },
        { code: 'FCYC', label: 'Currencies', route: '/fico/currencies', desc: 'Code name symbol – only INR default – strict: used in legal entity, exchange rates' },
        { code: 'FPPC', label: 'Posting Period Variant', route: '/fico/posting-period-variants', desc: 'Code name – groups company codes for posting period control – strict: FPPE (legacy OB52) open/close per variant + account type' },
        { code: 'FPPE', label: 'Posting Period Control', route: '/fico/posting-periods', desc: 'Variant_code account_type +/A/D/K/M/S/V from_period from_year to_period to_year is_open – strict: rejects posting if period closed' },
      ]
    },
    {
      title: 'Financials – Strict Controls',
      icon: '🛡️',
      items: [
        { code: 'OBC4', label: 'Field Status Variant', route: '/fico/field-status-variants', desc: 'Code name – groups field status groups – e.g., 1000 Standard – strict: assigned to company code controls required/suppressed fields per GL' },
        { code: 'FFSG', label: 'Field Status Groups', route: '/fico/field-status-groups', desc: 'Variant_code group_code field_name cost_center/profit_center/tax_code status R/S/O/D – strict: cost center required for expense G001 suppressed for cash G002' },
        { code: 'OBA0', label: 'Tolerance Groups – GL', route: '/fico/tolerance-groups-gl', desc: 'Code name type GL lower_limit upper_limit – strict: allows small differences within tolerance' },
        { code: 'OBA4', label: 'Tolerance Groups – CV', route: '/fico/tolerance-groups-cv', desc: 'Code name type CUSTOMER/VENDOR – strict: if invoice 100 payment 99.90 within 100 allowed clearing' },
        { code: 'OBA7', label: 'Document Types', route: '/fico/document-types', desc: 'Code SA/KA/KG/RV/RE name number_range_code FK FNRC – strict: assigns number range per doc type' },
        { code: 'OBYC', label: 'Automatic Account Determination', route: '/fico/auto-account-determination', desc: 'Transaction_key INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX)/GBB/PRD chart_of_accounts valuation_class gl_account FK FGLC – strict: GR 101 auto posts BSX inventory debit WRX GR/IR credit – no dummy' },
        { code: 'FAPT', label: 'Payment Terms', route: '/fico/payment-terms', desc: 'Code NT30 name days discount_percent discount_days – strict: calculates due date posting date + days – used in PO/SO/IV/Billing' },
      ]
    },
  ];

  if (loading) return <div className="p-6 font-mono text-xs">LOADING ENTERPRISE CONFIG...</div>;

  return (
    <div className={modern ? "min-h-screen bg-[#fafaf9] p-6" : "min-h-screen bg-white p-4"}>
      <div className={modern ? "max-w-[1200px] mx-auto space-y-6" : "max-w-[1000px] mx-auto space-y-4"}>
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border-b pb-4"}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">📊</div>
              <div>
                <h1 className={modern ? "text-xl font-bold tracking-tight" : "text-lg font-bold"}>Enterprise Config Overview – One Code One Page Hub</h1>
                <p className="text-sm text-zinc-500">Company: <b>{companyCode}</b> – All enterprise structure & financial config – strict ERP usage no dummy – data strictly used in practice</p>
                <p className="text-[11px] text-zinc-400 mt-1">General ERP terminology – SAP aliases for search only – e.g., Posting Period Control not FPPE (legacy OB52), Automatic Account Determination not FAUC (legacy OBYC) – but FPPE (legacy OB52)/FAUC (legacy OBYC) kept as searchable alias</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${companyCode}/navigator`} className={modern ? "px-4 py-2 rounded-full border text-xs hover:bg-zinc-50" : "border px-3 py-1 text-xs"}>🌳 Navigator</Link>
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
          <h3 className={modern ? "font-semibold text-sm mb-2" : "font-semibold text-xs mb-1"}>Strict Usage – No Dummy – All Functions Used in Practice</h3>
          <ul className="text-xs text-zinc-300 space-y-1 list-disc pl-4 leading-relaxed">
            <li><b>Fiscal Calendar FFYC</b> calculates fiscal year/period from posting date – K4 April-March: 2026-05-15 → FY2026 Period 02 – used in posting period enforcement</li>
            <li><b>Posting Period Variant FPPC</b> groups company codes – <b>Posting Period Control FPPE</b> open/close per variant + account type +/A/D/K/M/S/V – rejects if closed – e.g., close 03/2026 open 04/2026</li>
            <li><b>Document Types OBA7</b> assigns number ranges – number range from doc type SA/KA/KG/RV not object type – strict</li>
            <li><b>Automatic Account Determination FAUC (legacy OBYC)</b> auto GL for goods movements – BSX inventory posting debit inventory on GR 101, WRX GR/IR clearing credit GR/IR on GR debit on IV – no manual GL – strict</li>
            <li><b>Tolerance Groups OBA0/OBA4</b> allows small differences within tolerance – e.g., invoice 100 payment 99.90 within 100 allowed clearing – strict</li>
            <li><b>Credit Policy Area FCPC OB45</b> credit_limit risk_category – <b>Credit Check</b> on SO – exposure from open SO + open Billing vs limit – blocks if exposure+new exceeds limit – strict</li>
            <li><b>Field Status Variant OBC4 / Groups OBC5</b> – field_name cost_center/profit_center/tax_code status R required S suppressed O optional D display – e.g., cost center required for expense G001 suppressed for cash G002 – validates on GL posting – strict</li>
            <li><b>Payment Terms FAPT</b> – NT30 Net 30, 2-10-N30 2% discount 10 days net 30 – calculates due date posting date + days – used in PO/SO/IV/Billing – strict</li>
            <li><b>Pricing Procedure PRIC</b> – condition types PR00 price, K007 discount, MWST tax – calculates net/discount/tax/total for SO/Billing – strict</li>
            <li><b>Production Order MMOC (legacy CO01)</b> – status CRTD created → REL released → CNF confirmed → TECO technically complete – CNF posts 261 component consumption GBB + 101 finished good receipt BSX with auto account – strict</li>
            <li><b>MRP Run MD01</b> – net requirements calculation – Demand Sales Orders – Supply Stock + PO + Production Orders = Net Requirement – if shortage generates PR – strict no dummy</li>
            <li>General ERP terminology – not SAP terminology – but SAP aliases kept for search – e.g., search FPPE (legacy OB52) finds Posting Period Control, search FAUC (legacy OBYC) finds Automatic Account Determination</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
