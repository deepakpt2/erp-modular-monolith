"use client";

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { FunctionCommandPalette } from '@/shared/ui/function-command-palette';

const defaultKpis = [
  { label: 'Total Stock Value', value: '0 INR', change: 'Fresh', icon: '💎' },
  { label: 'Companies', value: '0 Companies', change: 'Fresh deployment', icon: '🏢' },
  { label: 'Sales Today', value: '0 INR', change: 'Fresh', icon: '💵' },
  { label: 'Currencies', value: 'INR Default', change: 'OY03', icon: '💱' },
];

export default function Home() {
  const [view, setView] = useState<'modern' | 'classic'>('modern');
  useEffect(()=>{
    try {
      const saved = localStorage.getItem('erp-home-view');
      if (saved==='modern'||saved==='classic') setView(saved as any);
    } catch {}
  },[]);
  const setViewPersist = (v:'modern'|'classic') => {
    setView(v);
    try { localStorage.setItem('erp-home-view', v); } catch {}
  };
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated' && session?.user;
  const [kpis, setKpis] = useState(defaultKpis);
  const [realCompanies, setRealCompanies] = useState<string>('Loading...');
  const [companyList, setCompanyList] = useState<any[]>([]);
  const [enterpriseModules, setEnterpriseModules] = useState<any[]>([]);

  useEffect(() => {
    async function loadKpis() {
      try {
        const [ccRes, stockRes, salesRes, curRes] = await Promise.all([
          fetch('/api/company-codes').then(r=>r.json()).catch(()=>({companyCodes:[]})),
          fetch('/api/stock?limit=1').then(r=>r.json()).catch(()=>({totalValue:0})),
          fetch('/api/sales-orders?limit=1').then(r=>r.json()).catch(()=>({salesToday:0, total:0})),
          fetch('/api/currencies').then(r=>r.json()).catch(()=>({currencies:[{code:'INR'}]})),
        ]);
        const companies = ccRes.companyCodes || [];
        const companyCount = companies.length;
        const companyNames = companies.map((c:any)=>`${c.code} ${c.currency_code}`).join(' + ') || '0 Companies';
        const currencies = curRes.currencies || [{code:'INR'}];
        const currencyList = currencies.map((c:any)=>c.code).join(' + ') || 'INR';
        let stockValue = '0 INR';
        if (stockRes.totalValue && stockRes.totalValue > 0) {
          stockValue = `${stockRes.totalValue} ${stockRes.currency||'INR'}`;
        } else if (stockRes.stock && stockRes.stock.length > 0) {
          stockValue = `${stockRes.stock.length} items`;
        }
        let salesToday = '0 INR';
        if (salesRes.salesToday && salesRes.salesToday > 0) {
          salesToday = `${salesRes.salesToday} ${salesRes.currency||'INR'}`;
        } else if (salesRes.total && salesRes.total > 0) {
          salesToday = `${salesRes.total} total`;
        }

        setRealCompanies(companyNames);
        setCompanyList(companies);
        setKpis([
          { label: 'Total Stock Value', value: stockValue, change: `${stockRes.count||0} batches`, icon: '💎' },
          { label: 'Companies', value: companyNames, change: `${companyCount} Companies – ${currencyList}`, icon: '🏢' },
          { label: 'Sales Today', value: salesToday, change: companyCount===0 ? 'No sales yet' : 'Live', icon: '💵' },
          { label: 'Currencies', value: `${currencyList}`, change: `${currencies.length} Currencies`, icon: '💱' },
        ]);

        const firstCompany = companies[0]?.code || '1000';
        const dynamicEnterprise = [
          { href: `/${firstCompany}/foundation/enterprise-structure`, icon: '🏢', title: 'Enterprise Structure', desc: `Company, Company Code, Plant, SLoc`, color: 'bg-slate-50 border-slate-300', count: `${companyCount} Companies`, code: 'OX15/ELEC (legacy OX02)/OX10', company: 'ALL' },
          { href: `/${firstCompany}/fico/company-master`, icon: '🏛️', title: 'Company Master Data', desc: `Company Code Legal Details`, color: 'bg-zinc-50 border-zinc-300', count: `${companyCount} Companies`, code: 'OX02', company: 'ALL' },
          { href: `/${firstCompany}/fico/chart-of-accounts`, icon: '📚', title: 'Chart of Accounts', desc: `General CoA – Accounts`, color: 'bg-indigo-50 border-indigo-300', count: 'OB13', code: 'FCOA (legacy OB13)/FS00', company: 'ALL' },
          { href: `/${firstCompany}/fico/gl-accounts`, icon: '📒', title: 'G/L Accounts', desc: `G/L Accounts – Configurable`, color: 'bg-purple-50 border-purple-300', count: 'FS00', code: 'FS00', company: 'ALL' },
          { href: `/${firstCompany}/fico/cost-centers`, icon: '🎯', title: 'Cost Centers', desc: `Cost Centers – Configurable`, color: 'bg-cyan-50 border-cyan-300', count: 'KS01', code: 'KS01', company: 'ALL' },
          { href: `/${firstCompany}/fico/tax-codes`, icon: '🧾', title: 'Tax Codes', desc: `Tax Codes – VAT/GST`, color: 'bg-zinc-50 border-zinc-300', count: 'FTXP', code: 'FTXP', company: 'ALL' },
          { href: `/${firstCompany}/foundation/enterprise-config`, icon: '⚙️', title: 'Enterprise Config', desc: `Fiscal, Posting Periods, Currencies`, color: 'bg-zinc-50 border-zinc-300', count: 'Config', code: 'FFYC (legacy OB29)/OY03', company: 'ALL' },
        ];
        setEnterpriseModules(dynamicEnterprise);
      } catch (e) {
        console.error('KPI load failed', e);
        setKpis(defaultKpis);
      }
    }
    loadKpis();
  }, []);

  if (view === 'classic') {
    return (
      <main className="min-h-screen bg-[#c0c0c0] p-0 font-mono text-[11px]">
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between text-[11px]">
          <span>ERP Modular Monolith – {realCompanies}</span>
          <span>System: {realCompanies} • {kpis[3]?.value}</span>
        </div>
        <div className="bg-[#d4d0c8] border-b-2 border-black px-2 py-1 flex justify-between">
          <div>
            <span className="font-bold">ERP01 – Main Dashboard</span>
            <span className="ml-4">{isLoggedIn ? `• ${(session?.user as any)?.email} ${(session?.user as any)?.role}` : ''}</span>
          </div>
          <div className="flex gap-1 items-center">
            {isLoggedIn ? (
              <>
                <span className="bg-black text-white px-2 py-0.5">{(session?.user as any)?.email} {(session?.user as any)?.role}</span>
                <button onClick={()=>signOut({callbackUrl:'/login'})} className="bg-[#d4d0c8] border border-black px-2 shadow-[1px_1px_0px_black]">Logout</button>
              </>
            ) : (
              <Link href="/login" className="bg-[#d4d0c8] border border-black px-2 shadow-[1px_1px_0px_black]">Sign in</Link>
            )}
            <button onClick={() => setViewPersist('modern')} className="bg-[#d4d0c8] border border-black px-2 shadow-[1px_1px_0px_black]">✨ Modern View</button>
          </div>
        </div>

        <div className="p-2">
          <div className="bg-[#ffffcc] border border-black p-2 mb-2">
            <div className="font-bold">OPERATIONS DASHBOARD</div>
            <div className="mt-1 leading-tight">
              {kpis.map(k=>`${k.label}: ${k.value}`).join(' • ')}
            </div>
          </div>

          <div className="bg-white border-2 border-black p-2 mb-2">
            <h2 className="font-bold text-[11px] mb-2">ENTERPRISE STRUCTURE • FINANCIALS</h2>
            <div className="grid grid-cols-4 gap-1">
              {enterpriseModules.map(m => (
                <Link key={m.href} href={m.href} className="border border-black p-1 bg-[#e0e7ff] hover:bg-[#000080] hover:text-white">
                  <div className="font-bold">{m.code} - {m.title}</div>
                  <div className="text-[9px] mt-1">{m.desc}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white border-2 border-black p-2">
            <h2 className="font-bold text-[11px] mb-2">COMPANIES – {companyList.length}</h2>
            <div className="grid grid-cols-2 gap-1">
              {companyList.map((c:any)=>(
                <div key={c.code} className="border border-black p-1 bg-[#d4d0c8]">
                  <div className="font-bold">{c.code} – {c.name} – {c.currency_code}</div>
                  <div className="text-[9px] mt-1">{c.city} {c.country} • CoA {c.coa_code} • Plants {c.plant_count}</div>
                </div>
              ))}
              {companyList.length===0 && <div className="border border-black p-1 bg-[#ffffcc]">No companies – Create via Enterprise Structure ELEC (legacy OX02)</div>}
            </div>
          </div>

          <div className="mt-2 bg-[#c0c0c0] border border-black p-1">
            Status: Ready • {kpis[3]?.value}
          </div>
          <div className="mt-4 border-t-2 border-black pt-2 flex justify-between text-[10px]">
            <div className="flex gap-2">
              <Link href="/docs" className="underline hover:bg-black hover:text-white px-1">Documentation</Link>
              <a href="https://github.com/deepakpt2/erp-modular-monolith" target="_blank" className="underline hover:bg-black hover:text-white px-1">GitHub ↗</a>
            </div>
            <div>© 2026 ERP Modular Monolith • MIT</div>
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
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold">E</div>
            <div>
              <div className="font-semibold">ERP Modular Monolith</div>
              <div className="text-xs text-zinc-500">{realCompanies}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FunctionCommandPalette />
            {isLoggedIn ? (
              <div className="relative group">
                <button className="flex items-center gap-2 bg-zinc-900 text-white rounded-full px-3 py-1.5 text-[11px] hover:bg-black transition-colors">
                  <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center font-bold text-[10px]">{(() => { const u = session?.user as any; const dn = u?.name || u?.username || (u?.email ? u.email.split('@')[0] : 'U'); return (dn?.[0] || 'U').toUpperCase(); })()}</span>
                  <span className="max-w-[120px] truncate hidden md:inline">{(() => { const u = session?.user as any; return u?.name || u?.username || (u?.email ? u.email.split('@')[0] : 'User'); })()}</span>
                  <span className="text-[8px] opacity-70">▼</span>
                </button>
                <div className="absolute right-0 top-9 z-50 hidden group-hover:block w-64 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-2">
                  <div className="p-3 border-b border-zinc-100 text-xs">
                    <div className="font-semibold text-sm truncate text-zinc-900">{(() => { const u = session?.user as any; return u?.name || u?.username || (u?.email ? u.email.split('@')[0] : 'User'); })()}</div>
                    <div className="text-[11px] text-zinc-500 truncate mt-0.5">{(session?.user as any)?.email}</div>
                    <div className="mt-1 inline-flex text-[10px] bg-zinc-900 text-white rounded-full px-2 py-0.5">{(session?.user as any)?.role || 'USER'}</div>
                  </div>
                  <div className="p-1.5 space-y-1">
                    <Link href="/1000/foundation/user-profile" className="flex items-center gap-2 px-3 py-2.5 text-xs rounded-xl hover:bg-zinc-900 hover:text-white text-zinc-700 transition-colors">👤 My Profile</Link>
                    <Link href="/1000/foundation/users" className="flex items-center gap-2 px-3 py-2.5 text-xs rounded-xl hover:bg-zinc-900 hover:text-white text-zinc-700 transition-colors">👥 Users</Link>
                    <Link href="/1000/foundation/roles" className="flex items-center gap-2 px-3 py-2.5 text-xs rounded-xl hover:bg-zinc-900 hover:text-white text-zinc-700 transition-colors">🔐 Roles</Link>
                    <div className="border-t border-zinc-100 my-1"></div>
                    <button onClick={()=>signOut({callbackUrl:'/login'})} className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-xs rounded-xl hover:bg-red-600 hover:text-white text-red-600 transition-colors">🚪 Sign Out</button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/login" className="text-xs border rounded-full px-3 py-1.5 hover:bg-zinc-900 hover:text-white bg-white transition-colors">Sign in</Link>
            )}
            <button onClick={()=>setViewPersist('classic')} className="text-xs border rounded-full px-3 py-1.5 hover:bg-zinc-100 bg-white transition-colors">Old Style</button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Operations Dashboard</h2>
            <p className="text-sm text-zinc-500 mt-1">Real data from database</p>
          </div>
          <div className="flex gap-2">
            <span className="text-xs text-zinc-400 self-center">View:</span>
            <button className="text-xs bg-black text-white rounded-full px-3 py-1">Modern</button>
            <button onClick={() => setViewPersist('classic')} className="text-xs border rounded-full px-3 py-1 hover:bg-white">Old Style</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {kpis.map(k => (
            <div key={k.label} className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="text-[11px] tracking-widest text-zinc-500 uppercase">{k.label}</div>
                <div className="text-lg">{k.icon}</div>
              </div>
              <div className="mt-3 text-2xl font-semibold">{k.value}</div>
              <div className="mt-1 text-xs text-zinc-500">{k.change}</div>
            </div>
          ))}
        </div>

        <div className="mb-8 bg-white border rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">🏢</div>
            <div>
              <div className="font-medium text-sm">Operations Overview</div>
              <div className="text-xs text-zinc-500 mt-0.5">{kpis[3]?.value}</div>
            </div>
          </div>
          {companyList.length===0 && <div className="mt-3 text-xs bg-zinc-50 border border-yellow-200 rounded-xl p-3">Fresh deployment – No companies yet – Create your first company code via Enterprise Structure.</div>}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Enterprise Structure • Financial Config</h3>
              <div className="text-xs text-zinc-500">{enterpriseModules.length} modules</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
              {enterpriseModules.map(m => (
                <Link key={m.href} href={m.href} className={`group bg-white rounded-2xl border-2 p-3 hover:shadow-md transition-all hover:-translate-y-0.5 ${m.color}`}>
                  <div className="flex justify-between items-start">
                    <div className="w-8 h-8 rounded-xl bg-white border flex items-center justify-center text-base shadow-sm">{m.icon}</div>
                    <span className="text-[9px] bg-black text-white rounded-full px-1.5 py-0.5">{m.code}</span>
                  </div>
                  <div className="mt-2 font-medium text-[13px]">{m.title}</div>
                  <div className="mt-1 text-[11px] text-zinc-500 leading-tight">{m.desc}</div>
                  <div className="mt-1 text-[9px] text-zinc-400">{m.count}</div>
                </Link>
              ))}
            </div>

            {companyList.length>0 && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Companies – {companyList.length} Companies</h3>
                  <div className="text-xs text-zinc-500">{companyList.map((c:any)=>c.code).join(', ')}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {companyList.map((c:any)=>(
                    <div key={c.code} className="bg-white rounded-2xl border p-4">
                      <div className="font-medium text-sm">{c.code} – {c.name} – {c.currency_code}</div>
                      <div className="text-xs text-zinc-500 mt-1">{c.city} {c.country} • CoA {c.coa_code} • Plants {c.plant_count}</div>
                      <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                        <Link href={`/${c.code}/foundation/materials`} className="border rounded-full px-2 py-1 bg-zinc-50 hover:bg-zinc-100 text-center">Materials</Link>
                        <Link href={`/${c.code}/foundation/stock`} className="border rounded-full px-2 py-1 bg-zinc-50 hover:bg-zinc-100 text-center">Stock</Link>
                        <Link href={`/${c.code}/mm/pr`} className="border rounded-full px-2 py-1 bg-zinc-50 hover:bg-zinc-100 text-center">PR</Link>
                        <Link href={`/${c.code}/mm/po`} className="border rounded-full px-2 py-1 bg-zinc-50 hover:bg-zinc-100 text-center">PO</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-zinc-200 bg-white mt-12">
        <div className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col sm:flex-row gap-3 justify-between items-center text-[11px] text-zinc-500">
          <div className="flex gap-4 items-center">
            <Link href="/docs" className="hover:text-black font-medium flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[9px]">📄</span> Documentation</Link>
            <span className="text-zinc-300">|</span>
            <a href="https://github.com/deepakpt2/erp-modular-monolith" target="_blank" rel="noopener noreferrer" className="hover:text-black flex items-center gap-1 font-medium">GitHub <span className="text-[10px]">↗</span></a>
            <span className="text-zinc-300">|</span>
            <Link href="/" className="hover:text-black">Home</Link>
          </div>
          <div className="text-[10px] text-zinc-400">© 2026 ERP Modular Monolith • MIT License • Function is destination • Code is helper</div>
        </div>
      </footer>
    </main>
  );
}
