"use client";
import Link from 'next/link';
import { useState } from 'react';

const sections = [
  { id: 'overview', title: 'Overview & Architecture' },
  { id: 'enterprise', title: 'Enterprise Structure (OX15/OX02)' },
  { id: 'financials', title: 'Financials – FICO Config' },
  { id: 'master', title: 'Master Data' },
  { id: 'users', title: 'Users & Roles (SU01/PFCG)' },
  { id: 'mm', title: 'MM – Procurement' },
  { id: 'inventory', title: 'Inventory Management' },
  { id: 'pp', title: 'PP – Production' },
  { id: 'sd', title: 'SD – Sales & Distribution' },
  { id: 'hr', title: 'HR / Payroll' },
  { id: 'fico-ext', title: 'FICO Extended' },
  { id: 'audit', title: 'Auditing & Workflow' },
  { id: 'new-company', title: 'New Company Guide – ISL LE-2000' },
  { id: 'api', title: 'API & Field Mapping' },
  { id: 'deploy', title: 'Deployment & Middleware' },
];

export default function DocsPage() {
  const [active, setActive] = useState('overview');
  const [view, setView] = useState<'modern'|'classic'>('modern');

  if (view === 'classic') {
    return (
      <main className="min-h-screen bg-[#c0c0c0] font-mono text-[11px] p-0">
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between">
          <span>ERP Documentation – Modular Monolith – OX02 / OB13 / FS00</span>
          <button onClick={()=>setView('modern')} className="bg-white text-black px-2">Modern View</button>
        </div>
        <div className="flex">
          <aside className="w-[220px] bg-[#d4d0c8] border-r-2 border-black p-2 min-h-screen">
            {sections.map(s=>(
              <button key={s.id} onClick={()=>setActive(s.id)} className={`w-full text-left border border-black px-2 py-1 mb-1 ${active===s.id?'bg-black text-white':'bg-white'}`}>{s.title}</button>
            ))}
            <div className="mt-4 border-t-2 border-black pt-2 text-[9px]">
              <div>GitHub: deepakpt2/erp-modular-monolith</div>
              <div>© 2026 ERP Modular Monolith</div>
            </div>
          </aside>
          <div className="flex-1 p-4 bg-white">
            <DocContent active={active} classic />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafaf9] text-zinc-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-zinc-200">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold">E</Link>
            <div>
              <div className="font-semibold">Documentation</div>
              <div className="text-xs text-zinc-500">ERP Modular Monolith • Function is destination • Code is helper</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xs border rounded-full px-3 py-1.5 hover:bg-zinc-900 hover:text-white bg-white">Home</Link>
            <a href="https://github.com/deepakpt2/erp-modular-monolith" target="_blank" className="text-xs border rounded-full px-3 py-1.5 hover:bg-zinc-900 hover:text-white bg-white">GitHub ↗</a>
            <button onClick={()=>setView('classic')} className="text-xs border rounded-full px-3 py-1.5 hover:bg-zinc-100 bg-white">Classic</button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-8 flex gap-8">
        <aside className="w-[280px] shrink-0 sticky top-[88px] h-fit">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4">
            <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-3 font-semibold">Contents</div>
            <div className="space-y-1">
              {sections.map(s=>(
                <button key={s.id} onClick={()=>setActive(s.id)} className={`w-full text-left text-[13px] rounded-xl px-3 py-2 transition-colors ${active===s.id ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50 text-zinc-700'}`}>{s.title}</button>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-100 space-y-2">
              <a href="https://github.com/deepakpt2/erp-modular-monolith" target="_blank" className="flex items-center gap-2 text-xs text-zinc-600 hover:text-black">
                <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px]">GH</span> github.com/deepakpt2/erp-modular-monolith
              </a>
              <div className="text-[10px] text-zinc-400">© 2026 ERP Modular Monolith • MIT License</div>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
            <DocContent active={active} classic={false} />
          </div>

          <footer className="mt-8 border-t border-zinc-200 pt-6 flex flex-col sm:flex-row gap-3 justify-between items-center text-[11px] text-zinc-500">
            <div className="flex gap-3">
              <Link href="/" className="hover:text-black font-medium">Home</Link>
              <span className="text-zinc-300">|</span>
              <a href="https://github.com/deepakpt2/erp-modular-monolith" target="_blank" className="hover:text-black">GitHub ↗</a>
              <span className="text-zinc-300">|</span>
              <span>© 2026 ERP Modular Monolith</span>
            </div>
            <div className="text-[10px]">Built with Next.js • Drizzle • PostgreSQL • Tailwind</div>
          </footer>
        </div>
      </div>
    </main>
  );
}

function DocContent({ active, classic }: { active: string; classic: boolean }) {
  const cardClass = classic ? "border-2 border-black p-3 bg-[#ffffcc] mb-3" : "rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 mb-4";
  const codeClass = classic ? "bg-black text-white px-1" : "bg-zinc-900 text-white px-2 py-0.5 rounded-full text-[10px] font-mono";
  const h2Class = classic ? "font-bold text-[12px] mb-2 border-b border-black pb-1" : "font-semibold text-[16px] mb-3 tracking-tight";
  const h3Class = classic ? "font-bold mt-3 mb-1" : "font-medium text-[14px] mt-6 mb-2";
  const tableClass = classic ? "w-full border border-black text-[10px]" : "w-full text-[12px] border border-zinc-200 rounded-xl overflow-hidden";
  
  if (active === 'overview') {
    return (
      <div>
        <h1 className={classic ? "font-bold text-[14px] mb-2" : "text-3xl font-semibold tracking-tight mb-2"}>ERP Modular Monolith – Comprehensive Guide</h1>
        <p className={classic ? "mb-3" : "text-sm text-zinc-500 mb-6"}>Function is destination, code is helper to identify function. 96 routes, 100% coverage. Modular monolith with Next.js 14, Drizzle ORM, PostgreSQL.</p>

        <div className={cardClass}>
          <h2 className={h2Class}>Architecture Principles</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Function is destination</b> – OX02 is helper to find Company Master, not destination itself. Destination is function.</li>
            <li><b>Code is helper</b> – Show OX02 as small badge ↳ OX02, not primary title.</li>
            <li><b>Modular Monolith</b> – src/modules/pp, mm, sd, fico, foundation, hr, audit – each with api/ + ui/ + lib/.</li>
            <li><b>View Toggle</b> – Modern (rounded-2xl, shadows, nice inputs) vs Classic (mono, border-black, power-user no nonsense).</li>
            <li><b>API vs Form fields same</b> – Clean placeholders = field name not sample data. CODE not "e.g. 1000".</li>
          </ul>
        </div>

        <div className={cardClass}>
          <h2 className={h2Class}>Route Count – 96 Routes</h2>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>Foundation: enterprise-structure, company-master, material-types, uom, materials, stock, partners, enterprise-config, users, roles, user-profile</div>
            <div>FICO: chart-of-accounts, gl-accounts, cost-centers, tax-codes, currencies, posting-period, payment, cca-report, costing-run, company-master</div>
            <div>MM: pr, po, gr, iv, physical-inventory, sto</div>
            <div>PP: bom, work-centers, routings, mrp, kitting</div>
            <div>SD: sales, delivery, billing</div>
            <div>HR: payroll, employees</div>
            <div>Audit: logs, document-flow, inbox</div>
          </div>
        </div>
      </div>
    );
  }

  if (active === 'new-company') {
    return (
      <div>
        <h1 className={classic ? "font-bold text-[14px] mb-2" : "text-2xl font-semibold tracking-tight mb-2"}>New Company Guide – ISL LE-2000 FAC-2000</h1>
        <p className={classic ? "mb-3" : "text-sm text-zinc-500 mb-6"}>Step-by-step to create new company ISL with LE 2000, FAC 2000 covering all config from enterprise to audit.</p>

        <div className={cardClass}>
          <h2 className={h2Class}>Step 0 – Create Company Code (OX02 / Company Master)</h2>
          <div className="space-y-2 text-[12px]">
            <div><span className={codeClass}>OX02</span> <b>Function:</b> Company Master – Legal entity creation</div>
            <div className="font-mono bg-white border p-2 rounded-xl text-[11px]">
              CODE: 2000<br/>
              NAME: ISL – International Steel Ltd<br/>
              COMPANY_GROUP_CODE: ISL<br/>
              CURRENCY_CODE: INR (OY03 default)<br/>
              COA_CODE: 1000 (OB13)<br/>
              CITY: Mumbai, COUNTRY: IN<br/>
              PLANT: 2000 (FAC-2000)
            </div>
            <div>API: POST /api/company-codes {`{code:2000, name, currency_code:INR, coa_code:1000}`}</div>
          </div>
        </div>

        <div className={cardClass}>
          <h2 className={h2Class}>Step 1 – Enterprise Structure (ECGC/ELEC/EFCC/EILC/ECOC/ESCC/EPLC/EPDC/EBTC/EDPC/EWSC)</h2>
          <div className="grid grid-cols-1 gap-2 text-[12px]">
            <div><span className={codeClass}>ECGC</span> Company Group – ISL – International Steel Ltd Group</div>
            <div><span className={codeClass}>ELEC</span> Legal Entity – LE-2000 – ISL Legal Entity 2000 – COMPANY_CODE 2000</div>
            <div><span className={codeClass}>EFCC</span> Financial Company Code – 2000 – ISL Finance 2000 – linked to LE-2000</div>
            <div><span className={codeClass}>EILC</span> Inventory Location Code – FAC-2000 – Main Factory 2000</div>
            <div><span className={codeClass}>ECOC</span> Controlling Area – CO-2000 – Controlling 2000</div>
            <div><span className={codeClass}>ESCC</span> Sales Org – SO-2000 – Sales Org 2000</div>
            <div><span className={codeClass}>EPLC</span> Plant – 2000 – FAC-2000 – Mumbai Plant</div>
            <div><span className={codeClass}>EPDC</span> Purchasing Org – PO-2000 – Purchasing 2000</div>
            <div><span className={codeClass}>EBTC</span> Business Type – Manufacturing</div>
            <div><span className={codeClass}>EDPC</span> Distribution Channel – DC-2000</div>
            <div><span className={codeClass}>EWSC</span> Warehouse – WH-2000</div>
          </div>
          <div className="mt-3 text-[11px] bg-white border rounded-xl p-3">
            Order: Company Group → Legal Entity → Financial CC → Controlling Area → Plant → SLoc → Sales/Purchasing → Warehouse<br/>
            All via <b>/foundation/enterprise-structure</b> – OX15/OX02/OX10 helper codes, function is destination.
          </div>
        </div>

        <div className={cardClass}>
          <h2 className={h2Class}>Step 2 – Financials (FCYC/FEXC/FFYC/FPPC/FPPE/FCOA/FGLC/ECUC/EPUC/FTXC/FNRC/FTGC)</h2>
          <div className="space-y-1 text-[12px]">
            <div><span className={codeClass}>FCYC</span> Fiscal Year Variant – FY-2000 – April-March – OB29</div>
            <div><span className={codeClass}>FEXC</span> Exchange Rates – INR default – OY03</div>
            <div><span className={codeClass}>FFYC</span> Fiscal Year – 2026 – OPEN</div>
            <div><span className={codeClass}>FPPC</span> Posting Period Variant – PP-2000 – OBBO</div>
            <div><span className={codeClass}>FPPE</span> Posting Period Entries – OB52 – 01/2026 to 12/2026 OPEN</div>
            <div><span className={codeClass}>FCOA</span> Chart of Accounts – 1000 – INT – OB13</div>
            <div><span className={codeClass}>FGLC</span> G/L Accounts – FS00 – 100000 Cash, 400000 Revenue, etc – COMPANY_CODE 2000</div>
            <div><span className={codeClass}>ECUC</span> Currency Config – INR – OY03</div>
            <div><span className={codeClass}>EPUC</span> Payment Terms – 0001 – Immediate</div>
            <div><span className={codeClass}>FTXC</span> Tax Codes – FTXP – V0 0%, V1 5%, V2 12%, V3 18%</div>
            <div><span className={codeClass}>FNRC</span> Number Ranges – FBN1 – Document numbers</div>
            <div><span className={codeClass}>FTGC</span> Tax Group – TG-2000 – GST Group</div>
          </div>
        </div>

        <div className={cardClass}>
          <h2 className={h2Class}>Step 3 – Master Data (EUOC/EMTP/EMTC/ELTC/EPAC/PSUC/SCUC)</h2>
          <div className="space-y-1 text-[12px]">
            <div><span className={codeClass}>EUOC</span> UOM – CUNI – KG, PC, BOX, LTR, MTR – COMPANY_CODE 2000</div>
            <div><span className={codeClass}>EMTP</span> Material Types – OMS2 – ROH, HALB, FERT, HAWA</div>
            <div><span className={codeClass}>EMTC</span> Material Master – MM01 – ITEM_NUMBER, DESCRIPTION, TYPE, UOM, PLANT 2000</div>
            <div><span className={codeClass}>ELTC</span> Location Type – SLoc types</div>
            <div><span className={codeClass}>EPAC</span> Partner Roles – Vendor, Customer</div>
            <div><span className={codeClass}>PSUC</span> Partners – MM01 – ACCOUNT_NUMBER, DISPLAY_NAME, ROLE, COMPANY_CODE 2000</div>
            <div><span className={codeClass}>SCUC</span> Stock Categories – Unrestricted, Quality, Blocked</div>
          </div>
        </div>

        <div className={cardClass}>
          <h2 className={h2Class}>Step 4 – Remaining Steps Summary</h2>
          <div className="text-[12px] space-y-1">
            <div><span className={codeClass}>SU01/PFCG</span> Users & Roles – Create users, assign ADMIN/USER/ACCOUNTS roles</div>
            <div><span className={codeClass}>PPRC/PPOC/PGRC/PIVC/PSTC/PIRC/PSRC</span> MM – PR, PO, GR, IV, STO, Physical Inventory, Stock Overview</div>
            <div><span className={codeClass}>ISTC/IPDC/IRSC/ISRC</span> Inventory – Stock Transport, Physical Inventory</div>
            <div><span className={codeClass}>MBMC/MWCC/MRTC/MPVC/MMOC/MMRP/MKTC</span> PP – BOM, Work Centers, Routings, MRP, Kitting</div>
            <div><span className={codeClass}>SSOC/SDLC/SBLC/SPWC/SCMR</span> SD – Sales Orders, Delivery, Billing, Pricing</div>
            <div><span className={codeClass}>HOUC/HPOC/HEMC/HPRC</span> HR – Org Units, Positions, Employees, Payroll</div>
            <div><span className={codeClass}>FAPT/FRPC/FFVC/FCDC/FCCA/FTRC</span> FICO Extended – AP, AR, Cost Centers, etc</div>
            <div><span className={codeClass}>F-53/KZ</span> Payment – Vendor clearing</div>
            <div><span className={codeClass}>FULC/ALB/SM20/WORM-lite/SBWP</span> Audit – Logs, Document Flow, Workflow Inbox</div>
          </div>
        </div>
      </div>
    );
  }

  // Default content for other sections – condensed
  return (
    <div>
      <h1 className={classic ? "font-bold text-[14px] mb-2" : "text-2xl font-semibold tracking-tight mb-2"}>{sections.find(s=>s.id===active)?.title}</h1>
      <p className={classic ? "mb-3" : "text-sm text-zinc-500 mb-6"}>Detailed documentation for {active}. Function is destination, code is helper.</p>

      <div className={cardClass}>
        <h2 className={h2Class}>Function Details – {active.toUpperCase()}</h2>
        <div className="space-y-3 text-[12px]">
          {active === 'enterprise' && (
            <>
              <div><b>OX15/OX02/OX10</b> – Enterprise Structure – Company, Company Code, Plant, Storage Location. Destination function.</div>
              <div className="font-mono bg-white border rounded-xl p-3 text-[11px]">
                Table: ent_company_group (ECGC) → ent_legal_entity (ELEC) → ent_company_code (EFCC) → ent_plant (EPLC) → ent_storage_location<br/>
                Fields: CODE, NAME, COMPANY_GROUP_CODE, COMPANY_CODE, PLANT_CODE, CURRENCY_CODE – all uppercase, exact API match.
              </div>
              <div>Placeholders must be field name: CODE not "e.g. 1000" – clean power-user classic.</div>
            </>
          )}
          {active === 'financials' && (
            <>
              <div><b>OB13/FS00/KS01/FTXP/OY03/OBBO/F-53/KSB1/CK40N</b> – Financial config</div>
              <div>FCYC – Fiscal Year Variant – OB29 – YEAR_VARIANT, DESCRIPTION, PERIOD_COUNT</div>
              <div>FCOA – Chart of Accounts – OB13 – CODE, NAME, DESCRIPTION</div>
              <div>FGLC – G/L Accounts – FS00 – ACCOUNT_NUMBER, CHART_OF_ACCOUNTS_CODE, ACCOUNT_TYPE, COMPANY_CODE</div>
              <div>FTXC – Tax Codes – FTXP – TAX_CODE, RATE, DESCRIPTION, COMPANY_CODE</div>
            </>
          )}
          {active === 'master' && (
            <>
              <div>EUOC – UOM – CUNI – CODE, NAME, DIMENSION</div>
              <div>EMTP – Material Types – OMS2 – CODE, DESCRIPTION, NUMBER_RANGE</div>
              <div>EMTC – Materials – MM01 – ITEM_NUMBER, DESCRIPTION, TYPE, BASE_UOM, PLANT, COMPANY_CODE</div>
              <div>PSUC – Partners – ACCOUNT_NUMBER, DISPLAY_NAME, ROLE, COMPANY_CODE</div>
            </>
          )}
          {active === 'users' && (
            <>
              <div><b>SU01/PFCG</b> – User Management – USERNAME, EMAIL, ROLE, PASSWORD</div>
              <div>Roles: ADMIN (all), ACCOUNTS (FICO), MM (procurement), PP (production), SD (sales), HR, AUDITOR</div>
              <div>Auth via NextAuth – /api/auth – ensureAdmin resilient initProduction.</div>
            </>
          )}
          {active === 'mm' && (
            <>
              <div>PPRC – PR – ME51N – PR_NUMBER, MATERIAL, QUANTITY, PLANT, COMPANY_CODE</div>
              <div>PPOC – PO – ME21N – PO_NUMBER, VENDOR, MATERIAL, QUANTITY, PRICE, COMPANY_CODE</div>
              <div>PGRC – GR – MIGO 101 – MATERIAL, QUANTITY, PLANT, STORAGE_LOCATION</div>
              <div>PIVC – IV – MIRO – VENDOR, INVOICE_NUMBER, AMOUNT</div>
              <div>PSTC – STO – ME27 – FROM_PLANT, TO_PLANT, MATERIAL</div>
            </>
          )}
          {active === 'pp' && (
            <>
              <div>MBMC – BOM – CS01 – BOM_NUMBER, MATERIAL, COMPONENT, QUANTITY, PLANT</div>
              <div>MWCC – Work Centers – CR01 – WORK_CENTER_CODE, DESCRIPTION, COST_CENTER, PLANT</div>
              <div>MRTC – Routings – CA01 – ROUTING_NUMBER, MATERIAL, OPERATION, WORK_CENTER</div>
              <div>MMRP – MRP – MD01 – MATERIAL, PLANT, DEMAND</div>
              <div>MKTC – Kitting – KITTING – KIT_NUMBER, COMPONENTS</div>
            </>
          )}
          {active === 'sd' && (
            <>
              <div>SSOC – Sales Orders – VA01 – ORDER_NUMBER, CUSTOMER, MATERIAL, QUANTITY, COMPANY_CODE</div>
              <div>SDLC – Delivery – VL01N – DELIVERY_NUMBER, SALES_ORDER, PLANT</div>
              <div>SBLC – Billing – VF01 – BILLING_NUMBER, DELIVERY, AMOUNT</div>
            </>
          )}
          {active === 'hr' && (
            <>
              <div>HOUC – Org Units – Org structure</div>
              <div>HEMC – Employees – EMPLOYEE_NUMBER, NAME, POSITION, COMPANY_CODE</div>
              <div>HPRC – Payroll – PC00 – EMPLOYEE, PERIOD, AMOUNT, COMPANY_CODE</div>
            </>
          )}
          {active === 'fico-ext' && (
            <>
              <div>FAPT – AP – Vendor invoices, payments</div>
              <div>FRPC – AR – Customer invoices</div>
              <div>FCCA – Cost Centers – KS01 – CODE, NAME, COMPANY_CODE</div>
              <div>F-53/KZ – Payment – Vendor payment clearing – VENDOR, AMOUNT, GL_ACCOUNT</div>
            </>
          )}
          {active === 'audit' && (
            <>
              <div>FULC – Audit Logs – SM20 – USER, ACTION, TIMESTAMP, COMPANY_CODE</div>
              <div>ALB – Document Flow – Tracks PR→PO→GR→IV→Payment chain</div>
              <div>SBWP – Workflow Inbox – Approvals – DOCUMENT_TYPE, DOCUMENT_NUMBER, STATUS</div>
              <div>WORM-lite – Immutable logs via audit_log table</div>
            </>
          )}
          {active === 'api' && (
            <>
              <div><b>Rule:</b> API field names === Form field names === DB column names (snake lower, but UI shows UPPER_SNAKE).</div>
              <div>Example: Materials – ITEM_NUMBER not "Material Code", DESCRIPTION not "e.g. Steel Rod"</div>
              <div>Placeholder = field name: placeholder="ITEM_NUMBER" not placeholder="e.g. 1000"</div>
              <div>Modern: rounded-2xl, shadow-sm, focus:ring-2 ring-black, rounded-xl inputs, rounded-full buttons bg-zinc-900</div>
              <div>Classic: font-mono text-[11px], border-black, power-user no nonsense, exact field names</div>
            </>
          )}
          {active === 'deploy' && (
            <>
              <div>Middleware fixed via proxy.ts – Next.js 15 middleware renamed to proxy.</div>
              <div>Build: 96 routes – npx next build passes – proxy no warning.</div>
              <div>Deploy: Vercel / Docker – POST /api/company-codes to bootstrap – resilient initProduction.</div>
              <div>Auth: admin-first – ensureAdmin in autoMigrate – initProduction catches prod_item_type 42710 already exists.</div>
              <div>Env: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL</div>
            </>
          )}
          {!['enterprise','financials','master','users','mm','inventory','pp','sd','hr','fico-ext','audit','api','deploy'].includes(active) && (
            <div>Content for {active} – Function is destination, helper code identifies function. See New Company Guide for ISL LE-2000 FAC-2000 full flow.</div>
          )}
        </div>
      </div>

      <div className={cardClass}>
        <h2 className={h2Class}>GitHub & Copyright</h2>
        <div className="text-[12px] space-y-1">
          <div><b>GitHub:</b> <a href="https://github.com/deepakpt2/erp-modular-monolith" target="_blank" className="underline hover:text-black">https://github.com/deepakpt2/erp-modular-monolith</a></div>
          <div><b>Copyright:</b> © 2026 ERP Modular Monolith – MIT License</div>
          <div><b>Footer:</b> All pages include Documentation link + GitHub link + Copyright.</div>
          <div><b>Side Panel:</b> Fixed – collapsed w-[64px] with absolute -right-3 toggle button always visible – can enlarge again.</div>
        </div>
      </div>
    </div>
  );
}
