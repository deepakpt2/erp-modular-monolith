"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function EnterpriseConfigPage() {
  const params = useParams();
  const companyCode = (params?.companyCode as string) || 'KS01';
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fiscal');

  useEffect(() => { fetchConfig(); }, [companyCode]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/enterprise/config?companyCode=${companyCode}`);
      const data = await res.json();
      if (!data.error) setConfig(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const tabs = [
    { id: 'fiscal', label: 'OB29 Fiscal K4', desc: 'Fiscal Year Variant K4 April-March' },
    { id: 'posting', label: 'OBBO/OB52 Posting', desc: 'Posting Period Variant + Open Periods' },
    { id: 'field', label: 'OBC4/OBC5 Field Status', desc: 'Field Status Groups G001/G004/G005' },
    { id: 'tolerance', label: 'OBA0/OBA4 Tolerance', desc: 'Tolerance Groups GL/Employee/Customer/Vendor' },
    { id: 'credit', label: 'OB45/OB38 Credit', desc: 'Credit Control Area + Assignment' },
    { id: 'doctype', label: 'OBA7 Doc Types', desc: 'Document Types KR/KG/KZ/RE/WE/WA/SA/RV/PR' },
    { id: 'number', label: 'FBN1 Number Ranges', desc: 'Number Ranges 50-54 + FOR UPDATE locking' },
    { id: 'auto', label: 'OBYC Auto Account', desc: 'Auto Account Determination BSX/WRX/PRD/GBB/BSV' },
    { id: 'currency', label: 'OY03 Currencies', desc: 'Currencies – Only INR default, KWD/USD/EUR added by user' },
    { id: 'approval', label: 'Approval Authority', desc: 'Hierarchical Approval Matrix 500 employees' },
    { id: 'rbac', label: 'RBAC Roles', desc: 'Roles & Permissions for 10% app access' },
  ];

  if (loading) return <div className="p-6">Loading Enterprise Config OB29/OBBO/OB52/OBC4/OBA0/OB45/OBA7/FBN1/OBYC for {companyCode}...</div>;

  const renderContent = () => {
    if (!config) return <div className="p-4 text-sm">No config - run seed-enterprise-500.ts</div>;
    switch(activeTab) {
      case 'fiscal':
        return (
          <div className="space-y-3">
            <h3 className="font-medium">Fiscal Year Variants OB29 - K4 April-March</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {config.fiscal?.variants?.map((v: any) => (
                <div key={v.id} className="border rounded-xl p-3 bg-white">
                  <div className="font-bold">{v.code} - {v.description}</div>
                  <div>Periods: {v.number_of_periods} | Calendar: {v.calendar_year ? 'Yes' : 'No'} | Year Dependent: {v.year_dependent ? 'Yes' : 'No'}</div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-sm">Periods for K4</h4>
              <div className="grid grid-cols-6 gap-1 text-[11px] mt-2">
                {config.fiscal?.periods?.filter((p: any) => p.variant_code === 'K4').map((p: any) => (
                  <div key={p.id} className="border rounded-lg p-2 bg-zinc-50">
                    <div>P{p.period} M{p.month} {p.start_date}-{p.end_date} Shift {p.year_shift}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[11px] bg-blue-50 border border-blue-200 rounded-xl p-2">K4 April-March India: P1 Apr 04-01/04-30, P2 May, P3 Jun, P4 Jul, P5 Aug, P6 Sep, P7 Oct, P8 Nov, P9 Dec, P10 Jan (shift -1), P11 Feb, P12 Mar</div>
            </div>
          </div>
        );
      case 'posting':
        return (
          <div className="space-y-3">
            <h3 className="font-medium">Posting Period Variants OBBO + OB52 Open Periods</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {config.posting?.variants?.map((v: any) => (
                <div key={v.id} className="border rounded-xl p-3 bg-white"><b>{v.code}</b> {v.name}</div>
              ))}
            </div>
            <div className="mt-3 space-y-1 text-[11px] max-h-96 overflow-auto">
              {config.posting?.periods?.map((p: any) => (
                <div key={p.id} className="border rounded-lg p-2 bg-white flex justify-between">
                  <span>{p.variant_code} {p.company_code} {p.from_period}/{p.from_year} to {p.to_period}/{p.to_year} Type {p.account_type} {p.is_open ? 'OPEN' : 'CLOSED'}</span>
                  <span className={p.is_open ? 'bg-green-100 px-1' : 'bg-red-100 px-1'}>{p.is_open ? 'OPEN' : 'CLOSED'}</span>
                </div>
              ))}
            </div>
            <div className="text-[11px] bg-yellow-50 border border-yellow-200 rounded-xl p-2">OB52 enforced in API via validatePostingPeriod() - blocks posting if period closed. Account Types: + All, A Assets, D Customers, K Vendors, M Materials, S G/L. Open 1/2024-12/2026.</div>
          </div>
        );
      case 'field':
        return (
          <div className="space-y-3">
            <h3 className="font-medium">Field Status Variant OBC4/OBC5 - G001/G004/G005</h3>
            <div className="text-xs space-y-2">
              {config.fieldStatus?.groups?.map((g: any) => (
                <div key={g.id} className="border rounded-xl p-3 bg-white">
                  <div className="font-bold">{g.variant_code} {g.code} {g.name}</div>
                  <div className="mt-1">
                    {config.fieldStatus?.fields?.filter((f: any) => f.group_code === g.code).map((f: any) => (
                      <span key={f.id} className="inline-block border rounded-full px-2 py-0.5 mr-1 mb-1 bg-zinc-50">{f.field_name} {f.is_required ? 'REQ' : f.is_optional ? 'OPT' : ''} {f.is_suppressed ? 'SUPP' : ''}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[11px] bg-zinc-50 border rounded-xl p-2">OBC4 Define Field Status Variants, OBC5 Assign to Company Code. G001 Material Management requires cost_center, tax_code. G004 Sales requires tax_code. Validation via validateFieldStatus() in API layer.</div>
          </div>
        );
      case 'tolerance':
        return (
          <div className="space-y-3">
            <h3 className="font-medium">Tolerance Groups OBA0 GL / OBA4 Employee/Customer/Vendor</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {config.tolerance?.groups?.map((t: any) => (
                <div key={t.id} className="border rounded-xl p-3 bg-white">
                  <div className="font-bold">{t.code} {t.name} Type {t.type}</div>
                  <div>Doc Max: {t.amount_per_document} | Open Item: {t.amount_per_open_item} | Cash Disc: {t.cash_discount_per_line}%</div>
                </div>
              ))}
            </div>
            <div className="text-[11px] bg-orange-50 border border-orange-200 rounded-xl p-2">OBA0 G/L tolerance 1000/KS01: max doc 100k/500k INR. OBA4 employee tolerance 99,999,999 cash disc 10% diff 100 INR. Enforced via validateTolerance() in GR/PO/Sales APIs.</div>
          </div>
        );
      case 'credit':
        return (
          <div className="space-y-3">
            <h3 className="font-medium">Credit Control Area OB45 + Assignment OB38</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {config.credit?.areas?.map((a: any) => (
                <div key={a.id} className="border rounded-xl p-3 bg-white"><b>{a.code}</b> {a.name} {a.currency}</div>
              ))}
            </div>
            <div className="mt-2 text-xs">
              {config.credit?.assignments?.map((ass: any, i: number) => (
                <div key={i} className="border rounded-lg p-2 bg-white mb-1">Company {ass.company_code} to Credit Control {ass.credit_code}</div>
              ))}
            </div>
            <div className="text-[11px] bg-blue-50 border border-blue-200 rounded-xl p-2">OB45 Define Credit Control Area KS01 INR / 1000 KWD, OB38 Assign Company Code to Credit Control Area. Credit check via checkCreditLimit() in Sales API blocks when exposure exceeds limit.</div>
          </div>
        );
      case 'doctype':
        return (
          <div className="space-y-3">
            <h3 className="font-medium">Document Types OBA7 - KR/KG/KZ/RE/WE/WA/SA/RV/PR</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {config.documentTypes?.types?.map((dt: any) => (
                <div key={dt.id} className="border rounded-xl p-3 bg-white">
                  <div className="font-bold">{dt.code} {dt.name}</div>
                  <div>Range {dt.number_range_from}-{dt.number_range_to} Reverse {dt.reverse_doc_type} Allowed {dt.account_types_allowed}</div>
                </div>
              ))}
            </div>
            <div className="text-[11px] bg-zinc-50 border rounded-xl p-2">OBA7 : KR 51 Vendor Invoice 5100000000-5199999999, KG 52 Credit Memo, KZ 53 Payment, RE 51 Invoice Gross, WE 50 Goods Receipt 5000000000-5099999999, WA 50 Goods Issue, SA 54 G/L 5400000000-5499999999, RV Billing, PR Payroll.</div>
          </div>
        );
      case 'number':
        return (
          <div className="space-y-3">
            <h3 className="font-medium">Number Ranges FBN1 50-54 5000000000-5499999999 + FOR UPDATE Locking</h3>
            <div className="text-[11px] max-h-96 overflow-auto space-y-1">
              {config.numberRanges?.ranges?.slice(0, 50).map((nr: any) => (
                <div key={nr.id} className="border rounded-lg p-2 bg-white flex justify-between">
                  <span>{nr.object_type} {nr.company_code || 'ALL'} Year {nr.year} {nr.prefix}{nr.current_number} Range {nr.from_number}-{nr.to_number}</span>
                  <span className="bg-black text-white px-1 rounded">FOR UPDATE</span>
                </div>
              ))}
            </div>
            <div className="text-[11px] bg-black text-white rounded-xl p-2">Enterprise secure number ranges via getNextNumberForUpdate() using SELECT FOR UPDATE - prevents duplicates under concurrent load. Critical for GR 50*, IV 51*, FI 50-54, PO 45*, PR 10*, Sales 80*, Billing 90*.</div>
          </div>
        );
      case 'currency':
        return (
          <div className="space-y-3">
            <h3 className="font-medium">Currencies OY03 – Only INR default, KWD/USD/EUR added by user</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs">
              <b>Only INR default</b> per user request – all other currencies like KWD, USD, EUR, SAR must be added by user via POST /api/currencies – Code OY03 – configurable. ERP defaults: INR ₹ default, KWD KD added by user, USD $, EUR €, SAR SR.
              <div className="mt-2 flex gap-2 flex-wrap">
                <span className="bg-green-100 border border-green-300 rounded-full px-2 py-1">INR ₹ – Default – only INR default</span>
                <span className="bg-white border rounded-full px-2 py-1">KWD KD – Add by user – not default</span>
                <span className="bg-white border rounded-full px-2 py-1">USD $ – Add by user</span>
                <span className="bg-white border rounded-full px-2 py-1">EUR € – Add by user</span>
              </div>
              <div className="mt-2 text-[11px]">API: GET /api/currencies – returns currencies, defaultCurrency INR. POST {`{code:KWD, name:Kuwaiti Dinar, decimal_places:3, symbol:KD}`} – adds KWD by user. PUT edit, DELETE soft if company codes use it.</div>
            </div>
            <div className="text-[11px] max-h-96 overflow-auto space-y-1">
              {(config?.currencies||[]).map((cur:any)=>(
                <div key={cur.code} className={`border rounded-lg p-2 ${cur.code==='INR'?'bg-green-50 border-green-200':'bg-white'}`}>
                  <b>{cur.code}</b> {cur.name} {cur.symbol} – Decimals {cur.decimal_places} – Active {cur.is_active?'Yes':'No'} {cur.code==='INR'?'– Default – only INR default':'(Added by user)'}
                </div>
              ))}
              {(!config?.currencies || config?.currencies.length===0) && (
                <div className="border rounded-lg p-2 bg-white">INR – Indian Rupee – 2 decimals ₹ – Default – only INR default – KWD has to be added by user via POST /api/currencies</div>
              )}
            </div>
          </div>
        );
      case 'auto':
        return (
          <div className="space-y-3">
            <h3 className="font-medium">Auto Account Determination OBYC - BSX/WRX/PRD/GBB/BSV/FRE/ZOL</h3>
            <div className="text-[11px] max-h-96 overflow-auto space-y-1">
              {config.autoAccount?.determinations?.map((aad: any) => (
                <div key={aad.id} className="border rounded-lg p-2 bg-white">
                  {aad.company_code} {aad.transaction_key} {aad.valuation_class} to {aad.account_number} {aad.gl_name}
                </div>
              ))}
            </div>
            <div className="text-[11px] bg-green-50 border border-green-200 rounded-xl p-2">OBYC: BSX ROHto5000000001 FERTto5000000002, WRXto5000000003 GR/IR, PRDto5000000005 Price Diff, GBB ROHto5000000006 Consumption COGS 601, BSVto5000000004 Stock in Transit, FRE/ZOL freight/customs MAP. Now table-driven via fi_auto_account_determination, not hardcoded.</div>
          </div>
        );
      case 'approval':
        return (
          <div className="space-y-3">
            <h3 className="font-medium">Approval Authority Matrix - Hierarchical 500 Employees</h3>
            <div className="text-[11px] max-h-96 overflow-auto space-y-1">
              {config.approvalAuthority?.authorities?.map((aa: any) => (
                <div key={aa.id} className="border rounded-lg p-2 bg-white flex justify-between">
                  <span>{aa.position_code} {aa.position_name} Doc {aa.document_type} {aa.min_amount}-{aa.max_amount} {aa.currency} Level {aa.level} {aa.requires_dual ? 'DUAL' : ''}</span>
                </div>
              ))}
            </div>
            <div className="text-[11px] bg-purple-50 border border-purple-200 rounded-xl p-2">Hierarchical approval: LEVEL_1 Jr up to 1000 INR, LEVEL_2 Sr up to 10000, LEVEL_3 Mgr up to 50000, CFO up to 500k, CEO unlimited, OWNER unlimited. Dual approval for payroll. Workflow filters steps by amount authority. 500 employees, 50 with app access, manager chain CEOtoMGRtoSRtoJR.</div>
          </div>
        );
      case 'rbac':
        return (
          <div className="space-y-3">
            <h3 className="font-medium">RBAC Roles & Permissions - 500 Employees 10% App Access</h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {config.rbac?.roles?.map((r: any) => (
                <div key={r.id} className="border rounded-xl p-3 bg-white">
                  <div className="font-bold">{r.code} {r.name} {r.is_system ? 'SYSTEM' : ''}</div>
                  <div className="mt-1 text-[11px]">
                    Perms: {config.rbac?.rolePermissions?.filter((rp: any) => rp.role_code === r.code).map((rp: any) => rp.permission_code).join(', ') || 'ADMIN_ALL'}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <h4 className="font-medium text-sm">Permissions</h4>
              <div className="grid grid-cols-4 gap-1 text-[10px] mt-2">
                {config.rbac?.permissions?.map((p: any) => (
                  <div key={p.id} className="border rounded-lg p-2 bg-zinc-50">{p.module} {p.code}</div>
                ))}
              </div>
            </div>
            <div className="text-[11px] bg-amber-50 border border-amber-200 rounded-xl p-2">Medium enterprise: 500 employees total, only ~50 have app access (10%). Roles: ADMIN, OWNER, CFO, CEO, MANAGER, PURCHASER, WAREHOUSE, ACCOUNTANT, SALES, HR, AUDITOR, PRODUCTION. RBAC enforced in middleware when MVP_NO_AUTH=false, permissions checked via hasPermission() in API layer.</div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <ModernModuleShell title="Enterprise Config - OB29/OBBO/OB52/OBC4/OBA0/OB45/OBA7/FBN1/OBYC - Real DB" subtitle={`OB29 • ${companyCode}`} code="OB29" module="FOUNDATION" tooltip={`Company ${companyCode} • Fiscal K4 April-March OB29, Posting OBBO/OB52, Field Status OBC4/OBC5 G001/G004/G005, Tolerance OBA0/OBA4, Credit OB45/OB38, Doc Types OBA7 KR/KG/KZ/RE/WE/WA/SA/RV/PR, Number Ranges FBN1 50-54 FOR UPDATE, Auto Account OBYC BSX/WRX/PRD/GBB/BSV/FRE/ZOL, Approval Authority Hierarchical 500 employees, RBAC 10% app access • No mocks • Real DB`} kpis={[
      {label:'Fiscal Variants', value: config?.fiscal?.variants?.length?.toString() || '0', icon:'📅'},
      {label:'Posting Periods', value: config?.posting?.periods?.length?.toString() || '0', icon:'🔓'},
      {label:'Roles', value: config?.rbac?.roles?.length?.toString() || '0', icon:'👥'},
      {label:'Approval Rules', value: config?.approvalAuthority?.authorities?.length?.toString() || '0', icon:'✅'},
    ]}>
      <div className="flex gap-1 flex-wrap mb-4 border-b pb-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`text-[11px] px-3 py-1.5 rounded-full border ${activeTab===tab.id?'bg-black text-white border-black':'bg-zinc-50 border-zinc-200'}`} title={tab.desc}>{tab.label}</button>
        ))}
      </div>
      {renderContent()}
    </ModernModuleShell>
  );
}
