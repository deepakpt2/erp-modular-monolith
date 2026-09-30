"use client";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function PostingPeriodHubPage() {
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
      title: 'Fiscal & Currency Management',
      icon: '📅',
      items: [
        { code: 'FFYC', label: 'Fiscal Calendar', route: '/fico/fiscal-calendars', desc: 'K4 April-March India, V3 Calendar Year Jan-Dec – FROM_DATE TO_DATE required – strict: calculates fiscal year/period from posting date 2026-05-15 K4 → FY2026 P02 – e.g., Apr-Dec same FY, Jan-Mar previous FY' },
        { code: 'FEXC', label: 'Exchange Rates', route: '/fico/exchange-rates', desc: 'From currency to currency rate – FROM_DATE TO_DATE – strict: converts foreign currency transactions – e.g., INR to USD 0.012' },
        { code: 'FCYC', label: 'Currencies', route: '/fico/currencies', desc: 'Code name symbol – only INR default – strict: used in legal entity, exchange rates, pricing' },
      ]
    },
    {
      title: 'Document Numbering & Tax',
      icon: '🔢',
      items: [
        { code: 'FNRC', label: 'Number Ranges', route: '/fico/number-ranges', desc: 'Code object_type PR/PO/GR/IV/SO/DL/BL/STO/PI/PROD/MRP/PAY/JRNL prefix current_number fiscal_year – atomic next via /api/number-ranges/next – strict: generates unique document numbers' },
        { code: 'FTGC', label: 'Tax Groups', route: '/fico/tax-groups', desc: 'Code name rate – GST 18% – groups tax codes for GL posting' },
        { code: 'FTXC', label: 'Tax Codes', route: '/fico/tax-codes', desc: 'GST0/5/12/18/28 IGST VAT 5% – rate ledger_account_code – strict: calculates tax amount on PO/SO/Billing – tax calc engine' },
      ]
    },
    {
      title: 'Posting Period Control – Strict',
      icon: '🛡️',
      items: [
        { code: 'FPPC', label: 'Posting Period Variant', route: '/fico/posting-period-variants', desc: 'Code name – groups company codes for posting period control – e.g., 1000 Standard – strict: OB52 open/close per variant + account type' },
        { code: 'FPPE', label: 'Posting Period Control', route: '/fico/posting-periods', desc: 'Variant_code account_type +/A/D/K/M/S/V from_period from_year to_period to_year is_open – strict: rejects posting if period closed – e.g., close 03/2026 open 04/2026 prevents back-posting – enforced in PR/PO/GR/IV/SO/DL/BL/Documents' },
      ]
    },
    {
      title: 'Financial Masters',
      icon: '💰',
      items: [
        { code: 'FCOA', label: 'Chart of Accounts', route: '/fico/chart-of-accounts', desc: 'Code name – KSCA – general CoA – groups GL accounts' },
        { code: 'FGLC', label: 'GL Accounts', route: '/fico/gl-accounts', desc: 'Account_number name coa_code account_type ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE – strict: auto account BSX/WRX uses GL, posting to GL, field status' },
        { code: 'FCCA', label: 'Cost Centers', route: '/fico/cost-centers', desc: 'Code name company_code – KS-CC-01..05 – strict: cost center required for expense GL via field status OBC5, actuals via CCA report' },
      ]
    },
    {
      title: 'Strict Controls – New',
      icon: '⚙️',
      items: [
        { code: 'OBC4', label: 'Field Status Variant', route: '/fico/field-status-variants', desc: 'Code name – groups field status groups – e.g., 1000 Standard – strict: assigned to company code controls required/suppressed fields per GL' },
        { code: 'FFSG', label: 'Field Status Groups', route: '/fico/field-status-groups', desc: 'Variant_code group_code field_name cost_center/profit_center/tax_code status R/S/O/D – strict: cost center required for expense G001 suppressed for cash G002' },
        { code: 'OBA0', label: 'Tolerance Groups – GL', route: '/fico/tolerance-groups-gl', desc: 'Code name type GL lower_limit upper_limit – strict: allows small differences within tolerance' },
        { code: 'OBA4', label: 'Tolerance Groups – CV', route: '/fico/tolerance-groups-cv', desc: 'Code name type CUSTOMER/VENDOR – strict: if invoice 100 payment 99.90 within 100 allowed clearing' },
        { code: 'OBA7', label: 'Document Types', route: '/fico/document-types', desc: 'Code SA/KA/KG/RV/RE name number_range_code FK FNRC – strict: assigns number range per doc type' },
        { code: 'OBYC', label: 'Automatic Account Determination', route: '/fico/auto-account-determination', desc: 'Transaction_key BSX/WRX/GBB/PRD chart_of_accounts valuation_class gl_account FK FGLC – strict: GR 101 auto posts BSX inventory debit WRX GR/IR credit – no dummy' },
        { code: 'FAPT', label: 'Payment Terms', route: '/fico/payment-terms', desc: 'Code NT30 name days discount_percent discount_days – strict: calculates due date posting date + days – used in PO/SO/IV/Billing' },
      ]
    },
  ];

  return (
    <div className={modern ? "min-h-screen bg-[#fafaf9] p-6" : "min-h-screen bg-white p-4"}>
      <div className={modern ? "max-w-[1200px] mx-auto space-y-6" : "max-w-[1000px] mx-auto space-y-4"}>
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border-b pb-4"}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">📊</div>
              <div>
                <h1 className={modern ? "text-xl font-bold tracking-tight" : "text-lg font-bold"}>Financial Configuration Hub – One Code One Page Overview</h1>
                <p className="text-sm text-zinc-500">Company: <b>{companyCode}</b> – Previously multiple forms in one page with focus param – now split into dedicated pages – one code one page – strict ERP usage no dummy</p>
                <p className="text-[11px] text-zinc-400 mt-1">General ERP terminology – SAP aliases for search only – e.g., Fiscal Calendar not OB29, Posting Period Variant not OBBO, Posting Period Control not OB52 – but OB29/OBBO/OB52 kept as searchable alias – Navigator tree replaces sidebar</p>
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
            Previously posting-period page had multiple forms with focus param – FFYC fiscal calendars, FEXC exchange rates, FNRC number ranges, FTGC tax groups, OBBO posting period variant, OB52 posting period control all in one page – functionally confusing – now split into dedicated pages – one code one page – e.g., FFYC Fiscal Calendar → /fico/fiscal-calendars with single form CODE* NAME* FROM_DATE* TO_DATE* START_MONTH* END_MONTH* YEAR_SHIFT* DESCRIPTION* – FROM_DATE TO_DATE required – strict usage calculates fiscal year/period from posting date K4 2026-05-15 → FY2026 P02 – FEXC Exchange Rates → /fico/exchange-rates with FROM_CURRENCY* TO_CURRENCY* RATE* FROM_DATE* TO_DATE* – strict usage converts foreign currency – FNRC Number Ranges → /fico/number-ranges with CODE* OBJECT_TYPE* PREFIX* CURRENT_NUMBER* FISCAL_YEAR* – atomic next via /api/number-ranges/next – strict usage generates unique document numbers – FTGC Tax Groups → /fico/tax-groups – FTXC Tax Codes → /fico/tax-codes with CODE* NAME* RATE* LEDGER_ACCOUNT_CODE* FK FGLC – strict usage calculates tax amount – FPPC Posting Period Variant → /fico/posting-period-variants with CODE* NAME* – groups company codes – FPPE Posting Period Control → /fico/posting-periods with VARIANT_CODE* FK FPPC ACCOUNT_TYPE* +/A/D/K/M/S/V FROM_PERIOD* FROM_YEAR* TO_PERIOD* TO_YEAR* IS_OPEN* – strict usage rejects posting if period closed – e.g., close 03/2026 open 04/2026 prevents back-posting – enforced in PR/PO/GR/IV/SO/DL/BL/Documents – each page has single form with modes Create/Change/Display/List – border yellow empty green valid red invalid – short button Create Fiscal Calendar – code in heading badge – bottom Related Masters low importance auto FK – e.g., ELEC page bottom shows ECGC, FCYC, FFYC, FPPC links – muted small – helps create necessary data – data strictly used in practice – no dummy – general ERP terminology – SAP aliases for search only – Navigator tree replaces sidebar – no sidebar – tree is navigation.
          </p>
        </div>
      </div>
    </div>
  );
}
