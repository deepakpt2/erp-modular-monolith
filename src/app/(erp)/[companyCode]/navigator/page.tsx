"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { FUNCTIONS, MODULE_CLASSIFICATION } from '@/shared/lib/functions';
import { canUserAccessPage } from '@/shared/kernel/auth/pagePermissions';

type TreeNode = {
  label: string;
  icon?: string;
  code?: string;
  route?: string;
  count?: number;
  children?: TreeNode[];
  module?: string;
};

export default function NavigatorPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [uiMode, setUiMode] = useState<'modern'|'classic'>('modern');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [me, setMe] = useState<any>(null);
  const [meLoading, setMeLoading] = useState(true);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const j = await res.json();
          setMe(j);
        }
      } catch {}
      setMeLoading(false);
    }
    fetchMe();
  }, []);

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
    // Try to fetch counts for major masters – best effort
    const fetchCounts = async () => {
      try {
        const apis = [
          { key: 'ECGC', url: `/api/company-groups?company_code=${companyCode}` },
          { key: 'ELEC', url: `/api/legal-entities?company_code=${companyCode}` },
          { key: 'EFCC', url: `/api/facilities?company_code=${companyCode}` },
          { key: 'EMTC', url: `/api/materials?company_code=${companyCode}` },
          { key: 'PSUC', url: `/api/business-partners?role=VENDOR&company_code=${companyCode}` },
          { key: 'SCUC', url: `/api/business-partners?role=CUSTOMER&company_code=${companyCode}` },
        ];
        const res: Record<string, number> = {};
        for (const a of apis) {
          try {
            const r = await fetch(a.url);
            if (r.ok) {
              const j = await r.json();
              if (Array.isArray(j)) res[a.key] = j.length;
              else if (j.data) res[a.key] = j.data.length;
              else if (j.count) res[a.key] = j.count;
            }
          } catch {}
        }
        setCounts(res);
      } catch {}
    };
    fetchCounts();
  }, [companyCode]);

  const toggle = (path: string) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // Build tree structure – strict ERP terminology, no SAP jargon in labels, but keep aliases for search
  // Sitewide RBAC – filter based on role – master data manager cannot see HR payroll – SoD – FRPC
  const tree: TreeNode[] = useMemo(()=>{
    const isAdmin = me?.isAdmin;
    const isHR = me?.isHR;
    const canAccessPayroll = me?.canAccessPayroll ?? true; // default true while loading
    const canAccessMaterial = me?.canAccessMaterial ?? true;
    const roles = me?.roles || [];
    const simpleRole = me?.simpleRole || '';

    // Helper to check if user can access module
    const canAccessModule = (module: string) => {
      if (meLoading) return true; // show all while loading
      if (isAdmin) return true;
      if (module === 'HR') return canAccessPayroll || isHR || roles.includes('HR') || roles.includes('HR_MANAGER');
      if (module === 'FOUNDATION') return true; // foundation allowed for all authenticated – MDM needs it
      if (module === 'MM') return canAccessMaterial || roles.includes('PURCHASER') || roles.includes('WAREHOUSE') || roles.includes('MATERIAL_MANAGER') || roles.includes('MASTER_DATA_MANAGER') || simpleRole === 'MASTER_DATA_MANAGER';
      if (module === 'FICO') return roles.includes('ACCOUNTANT') || roles.includes('ADMIN') || isAdmin || simpleRole === 'ACCOUNTANT';
      if (module === 'SD') return roles.includes('SALES') || isAdmin;
      if (module === 'PP') return roles.includes('PRODUCTION') || roles.includes('MATERIAL_MANAGER') || isAdmin;
      return true;
    };

    return [
    {
      label: 'Foundation – Enterprise Structure',
      icon: '🏢',
      module: 'FOUNDATION',
      children: [
        { label: 'Company Group – Create', code: 'ECGC', route: `/foundation/company-groups`, count: counts['ECGC'] },
        { label: 'Company Group – Change', code: 'ECGE', route: `/foundation/company-groups/change` },
        { label: 'Company Group – Display', code: 'ECGV', route: `/foundation/company-groups/display` },
        { label: 'Company Group – List', code: 'ECGL', route: `/foundation/company-groups/list` },
        { label: 'Legal Entity – Create', code: 'ELEC', route: `/foundation/legal-entities`, count: counts['ELEC'] },
        { label: 'Legal Entity – Change', code: 'ELEE', route: `/foundation/legal-entities/change` },
        { label: 'Legal Entity – Display', code: 'ELEV', route: `/foundation/legal-entities/display` },
        { label: 'Legal Entity – List', code: 'ELEL', route: `/foundation/legal-entities/list` },
        { label: 'Facility', code: 'EFCC', route: `/foundation/facilities`, count: counts['EFCC'] },
        { label: 'Inventory Location', code: 'EILC', route: `/foundation/inventory-locations` },
        { label: 'Procurement Division', code: 'EPDC', route: `/foundation/procurement-divisions` },
        { label: 'Buyer Team', code: 'EBTC', route: `/foundation/buying-teams` },
        { label: 'Commercial Organization', code: 'ECOC', route: `/foundation/commercial-orgs` },
        { label: 'Sales Channel', code: 'ESCC', route: `/foundation/sales-channels` },
        { label: 'Product Line', code: 'EPLC', route: `/foundation/product-lines` },
        { label: 'Commercial Unit', code: 'EPUC', route: `/foundation/commercial-units` },
        { label: 'Commercial Unit Assignment', code: 'ECUC', route: `/foundation/commercial-unit-assign` },
        { label: 'Profit Center Assignment', code: 'EBSC', route: `/foundation/profit-center-assign` },
        { label: 'Warehouse Site', code: 'EWSC', route: `/foundation/warehouse-sites` },
        { label: 'Distribution Path', code: 'EDPC', route: `/foundation/distribution-paths` },
        { label: 'Credit Policy Area', code: 'FCPC', route: `/foundation/credit-policy-areas` },
        { label: 'Enterprise Config Overview', code: 'ECAC', route: `/foundation/enterprise-structure` },
      ]
    },
    {
      label: 'Foundation – Materials & Partners',
      icon: '📦',
      module: 'FOUNDATION',
      children: [
        { label: 'Product Master – Create', code: 'EMTC', route: `/foundation/materials`, count: counts['EMTC'] },
        { label: 'Product Master – Change', code: 'EMTE', route: `/foundation/materials/change` },
        { label: 'Product Master – Display', code: 'EMTV', route: `/foundation/materials/display` },
        { label: 'Product Master – List', code: 'EMTL', route: `/foundation/materials/list` },
        { label: 'Product Types', code: 'EMTP', route: `/foundation/material-types` },
        { label: 'Product Categories', code: 'EMGC', route: `/foundation/material-categories` },
        { label: 'Units of Measure', code: 'EUOC', route: `/foundation/uom` },
        { label: 'Lot Management', code: 'ELTC', route: `/foundation/lots` },
        { label: 'Stock Overview', code: 'ISTV', route: `/foundation/stock` },
        { label: 'Partner Account', code: 'EPAC', route: `/foundation/partners` },
        { label: 'Supplier', code: 'PSUC', route: `/foundation/suppliers`, count: counts['PSUC'] },
        { label: 'Customer', code: 'SCUC', route: `/foundation/customers`, count: counts['SCUC'] },
        { label: 'Partner Contact', code: 'EPCC', route: `/foundation/partner-contacts` },
      ]
    },
    {
      label: 'Financials – Master Data',
      icon: '💰',
      module: 'FICO',
      children: [
        { label: 'Fiscal Calendar', code: 'FFYC', route: `/fico/fiscal-calendars` },
        { label: 'Exchange Rates', code: 'FEXC', route: `/fico/exchange-rates` },
        { label: 'Number Ranges', code: 'FNRC', route: `/fico/number-ranges` },
        { label: 'Tax Groups', code: 'FTGC', route: `/fico/tax-groups` },
        { label: 'Tax Codes', code: 'FTXC', route: `/fico/tax-codes` },
        { label: 'Chart of Accounts – Create', code: 'FCOA', route: `/fico/chart-of-accounts` },
        { label: 'Chart of Accounts – Change', code: 'FCOE', route: `/fico/chart-of-accounts/change` },
        { label: 'Chart of Accounts – Display', code: 'FCOV', route: `/fico/chart-of-accounts/display` },
        { label: 'Chart of Accounts – List', code: 'FCOL', route: `/fico/chart-of-accounts/list` },
        { label: 'Account Groups – Create', code: 'FAGC', route: `/fico/account-groups` },
        { label: 'Account Groups – Change', code: 'FAGE', route: `/fico/account-groups/change` },
        { label: 'Account Groups – Display', code: 'FAGV', route: `/fico/account-groups/display` },
        { label: 'Account Groups – List', code: 'FAGL', route: `/fico/account-groups/list` },
        { label: 'General Ledger Accounts – Create', code: 'FGLC', route: `/fico/gl-accounts` },
        { label: 'General Ledger Accounts – Change', code: 'FGLE', route: `/fico/gl-accounts/change` },
        { label: 'General Ledger Accounts – Display', code: 'FGLV', route: `/fico/gl-accounts/display` },
        { label: 'General Ledger Accounts – List', code: 'FGLS', route: `/fico/gl-accounts/list` },
        { label: 'Cost Centers – Create', code: 'CCUC', route: `/fico/cost-centers` },
        { label: 'Cost Centers – Change', code: 'CCUE', route: `/fico/cost-centers/change` },
        { label: 'Cost Centers – Display', code: 'CCUD', route: `/fico/cost-centers/display` },
        { label: 'Cost Centers – List', code: 'CCUS', route: `/fico/cost-centers/list` },
        { label: 'Currencies', code: 'FCYC', route: `/fico/currencies` },
        { label: 'Posting Period Variant', code: 'FPPC', route: `/fico/posting-period-variants` },
        { label: 'Posting Period Control', code: 'FPPE', route: `/fico/posting-periods` },
        { label: 'Document Reversal (FB08)', code: 'FREV', route: `/fico/reversal` },
        { label: 'GR/IR Clearing (F.13)', code: 'FGIC', route: `/fico/gr-ir-clearing` },
        { label: 'FX Valuation (F.05)', code: 'FFXV', route: `/fico/fx-valuation` },
        { label: 'Customer Credit (FD32)', code: 'FD32', route: `/fico/customer-credit` },
      ]
    },
    {
      label: 'Financials – Strict Controls (New)',
      icon: '🛡️',
      module: 'FICO',
      children: [
        { label: 'Field Status Variant', code: 'FFSV', route: `/fico/field-status-variants` },
        { label: 'Field Status Groups', code: 'FFSG', route: `/fico/field-status-groups` },
        { label: 'Tolerance Groups – General Ledger', code: 'OBA0', route: `/fico/tolerance-groups-gl` },
        { label: 'Tolerance Groups – Customers/Vendors', code: 'OBA4', route: `/fico/tolerance-groups-cv` },
        { label: 'Document Types', code: 'OBA7', route: `/fico/document-types` },
        { label: 'Automatic Account Determination', code: 'OBYC', route: `/fico/auto-account-determination` },
        { label: 'Payment Terms', code: 'FAPT', route: `/fico/payment-terms` },
        { label: 'Payment Processing', code: 'FPYP', route: `/fico/payment` },
        { label: 'Cost Center Actuals', code: 'CCUL', route: `/fico/cca-report` },
        { label: 'Product Costing Run', code: 'CCRP', route: `/fico/costing-run` },
      ]
    },
    {
      label: 'Materials Management',
      icon: '📥',
      module: 'MM',
      children: [
        { label: 'Purchase Requisition', code: 'PPRC', route: `/mm/pr` },
        { label: 'Purchase Order', code: 'PPOC', route: `/mm/po` },
        { label: 'Goods Receipt', code: 'IGRC', route: `/mm/gr` },
        { label: 'Goods Receipt Reversal', code: 'IGRR', route: `/mm/gr-reversal` },
        { label: 'Invoice Verification', code: 'PIVC', route: `/mm/iv` },
        { label: 'Invoice Reversal', code: 'PIVR', route: `/mm/iv-reversal` },
        { label: 'Purchasing Info Records', code: 'PIRX', route: `/mm/info-records` },
        { label: 'Source Lists', code: 'PSLX', route: `/mm/source-lists` },
        { label: 'Quota Arrangements', code: 'PQAX', route: `/mm/quota-arrangements` },
        { label: 'Request for Quotation (RFQ)', code: 'PRFQ', route: `/mm/rfq` },
        { label: 'Material Reservations', code: 'PRES', route: `/mm/reservations` },
        { label: 'Purchasing Spend Reports', code: 'PRPT', route: `/mm/reports` },
        { label: 'Stock Transport Order', code: 'PSTC', route: `/mm/sto` },
        { label: 'STO Delivery', code: 'PSTX', route: `/mm/sto-delivery` },
        { label: 'Physical Inventory', code: 'IPIC', route: `/mm/physical-inventory` },
      ]
    },
    {
      label: 'Sales & Distribution',
      icon: '🛒',
      module: 'SD',
      children: [
        { label: 'Sales Order', code: 'SSOC', route: `/sales` },
        { label: 'Outbound Delivery', code: 'SDLC', route: `/sd/delivery` },
        { label: 'Outbound Delivery Change', code: 'SDLE', route: `/sd/delivery-change` },
        { label: 'Billing Document', code: 'SBLC', route: `/sd/billing` },
        { label: 'Billing Change', code: 'SBLE', route: `/sd/billing-change` },
        { label: 'Billing Reversal', code: 'SBLR', route: `/sd/billing-reversal` },
        { label: 'Pricing Procedure', code: 'SPRC', route: `/sd/pricing-procedure` },
      ]
    },
    {
      label: 'Production Planning',
      icon: '🏭',
      module: 'PP',
      children: [
        { label: 'Bill of Materials', code: 'MBMC', route: `/pp/bom` },
        { label: 'Work Center', code: 'MWCC', route: `/pp/work-centers` },
        { label: 'Routing', code: 'MRTC', route: `/pp/routings` },
        { label: 'Production Order', code: 'MMPO', route: `/pp/production-orders` },
        { label: 'Product Cost Estimate', code: 'PCST', route: `/pp/cost-estimate` },
        { label: 'Planned Independent Req (PIR)', code: 'MPIR', route: `/pp/pir` },
        { label: 'MRP Run', code: 'MMRP', route: `/pp/mrp` },
        { label: 'Kitting', code: 'MKTC', route: `/pp/kitting` },
      ]
    },
    {
      label: 'Human Resources & Compliance',
      icon: '👥',
      module: 'HR',
      children: [
        { label: 'Employee Master Directory', code: 'HEMP', route: `/hr/employees` },
        { label: 'Employee Master Maintain', code: 'HHEC', route: `/hr/payroll` },
        { label: 'Payroll Control Record', code: 'HPAC', route: `/hr/payroll-control` },
        { label: 'Payroll Run', code: 'HPAY', route: `/hr/payroll-run` },
        { label: 'Document Flow', code: 'AFLW', route: `/audit/document-flow` },
        { label: 'Audit Log', code: 'AALG', route: `/audit/logs` },
        { label: 'Workflow Inbox', code: 'FWFL', route: `/workflow/inbox` },
      ]
    },
  ]; }, [counts, me, meLoading]);

  const filteredTree = useMemo(()=>{
    // First filter by RBAC module access – sitewide – remove pages without permission from navigator per user request
    let rbacFiltered = tree.map(group => {
      if (meLoading) return group;
      if (me?.isAdmin) return group;
      // Filter children based on page permission – canUserAccessPage
      const filteredChildren = group.children?.filter(child => {
        if (!child.code) return true; // no code, allow
        const access = canUserAccessPage(me, child.code);
        return access.allowed;
      });
      return { ...group, children: filteredChildren };
    }).filter(group => {
      // Remove groups with no children after RBAC filter – per user request, remove pages without permission from navigator
      if (meLoading) return true;
      if (me?.isAdmin) return true;
      const module = group.module || 'FOUNDATION';
      // HR module only for HR/Admin – hide entirely for MDM
      if (module === 'HR' && !me?.canAccessPayroll && !me?.isHR && !me?.isAdmin) {
        return false;
      }
      // If group has no children after filtering, hide it – per user request
      if (!group.children || group.children.length === 0) {
        return false;
      }
      return true;
    });

    if (!search.trim()) return rbacFiltered;
    const q = search.toLowerCase();
    return rbacFiltered.map(group=>{
      const matchedChildren = group.children?.filter(c=>
        c.label.toLowerCase().includes(q) ||
        c.code?.toLowerCase().includes(q) ||
        FUNCTIONS.find(f=>f.code===c.code)?.aliases?.some(a=>a.toLowerCase().includes(q)) ||
        FUNCTIONS.find(f=>f.code===c.code)?.description.toLowerCase().includes(q)
      );
      if (matchedChildren && matchedChildren.length>0) {
        return { ...group, children: matchedChildren };
      }
      if (group.label.toLowerCase().includes(q)) return group;
      return null;
    }).filter(Boolean) as TreeNode[];
  }, [tree, search, me]);

  const modern = uiMode==='modern';

  return (
    <div className={modern ? "min-h-screen bg-[#fafaf9] p-6" : "min-h-screen bg-white p-4"}>
      <div className={modern ? "max-w-[1200px] mx-auto space-y-6" : "max-w-[1000px] mx-auto space-y-4"}>
        {/* Header */}
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border-b pb-4"}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className={modern ? "text-2xl font-bold tracking-tight" : "text-xl font-bold"}>🌳 ERP Navigator – Tree Structure</h1>
              <p className="text-sm text-zinc-500 mt-1">One code = one page – strict ERP terminology – all functions used in practice, no dummy – Company: <b>{companyCode}</b></p>
              <p className="text-[11px] text-zinc-400 mt-1">Modern/Classic persisted via localStorage • Related links at bottom of each form • No sidebar – tree is navigation</p>
            </div>
            <div className="flex items-center gap-2">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="" className={modern ? "border border-zinc-200 rounded-full px-4 py-2 text-sm w-[260px] focus:outline-none focus:ring-1 focus:ring-black focus:border-black/10" : "border px-3 py-1.5 text-sm w-[220px]"} />
              <Link href="/" className={modern ? "px-4 py-2 rounded-full border text-xs hover:bg-zinc-50" : "border px-3 py-1 text-xs"}>🏠 Dashboard</Link>
            </div>
          </div>
        </div>

        {/* Tree */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTree.map((group, gi)=>{
            const groupPath = `g-${gi}`;
            const isExpanded = expanded[groupPath] !== false; // default expanded
            return (
              <div key={groupPath} className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden" : "border bg-white"}>
                <button onClick={()=>toggle(groupPath)} className={modern ? "w-full flex items-center gap-2 px-5 py-3.5 bg-zinc-50/80 hover:bg-zinc-50 border-b border-zinc-100 text-left" : "w-full flex items-center gap-2 px-3 py-2 bg-zinc-100 text-left border-b"}>
                  <span className="text-lg">{group.icon}</span>
                  <span className={modern ? "font-semibold text-sm" : "font-semibold text-xs"}>{group.label}</span>
                  <span className="ml-auto text-[11px] text-zinc-400">{group.children?.length} functions • {isExpanded?'▼':'▶'}</span>
                </button>
                {isExpanded && (
                  <div className={modern ? "p-2 space-y-1" : "p-1 space-y-0.5"}>
                    {group.children?.map((node, ni)=>{
                      const func = FUNCTIONS.find(f=>f.code===node.code);
                      const alias = func?.aliases?.[0] || '';
                      const href = `/${companyCode}${node.route}`;
                      return (
                        <Link key={`${groupPath}-${ni}`} href={href} className={modern ? "flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200 group" : "flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-50 border-b border-zinc-100 text-xs"}>
                          <span className={modern ? "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black text-white shrink-0" : "text-[9px] font-mono border px-1 bg-black text-white shrink-0"}>{node.code}</span>
                          {alias && <span className={modern ? "text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-100 border text-zinc-500 shrink-0" : "text-[8px] font-mono border px-1 bg-zinc-50 text-zinc-500 shrink-0"}>{alias}</span>}
                          <span className={modern ? "flex-1 text-sm font-medium text-zinc-900 group-hover:text-black truncate" : "flex-1 font-medium truncate"}>{node.label}</span>
                          {node.count !== undefined && <span className={modern ? "text-[11px] bg-zinc-100 border rounded-full px-2 py-0.5 text-zinc-600" : "text-[10px] border px-1 bg-zinc-50"}>{node.count}</span>}
                          <span className={modern ? "text-[10px] text-zinc-400 group-hover:text-zinc-900" : "text-[10px] text-zinc-400"}>→</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-5" : "border p-3 bg-zinc-50"}>
          <h3 className={modern ? "font-semibold text-sm mb-2" : "font-semibold text-xs mb-1"}>Strict Usage – No Dummy</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            All functions listed are strictly used in practice: Posting period control FPPE (legacy OB52) enforced in GR/IR/Billing – rejects if closed. Fiscal calendar FFYC calculates fiscal year/period from posting date (K4 April-March). Document types OBA7 assigns number ranges. Automatic account determination FAUC (legacy OBYC) posts INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX) automatically for goods movements. Tolerance OBA0/OBA4 allows small differences. Credit control OB45 checks customer credit exposure on sales order. Field status OBC4/OBC5 requires cost center for expense accounts. Pricing calculates tax and discounts. MRP net calculation creates planned orders. Production order MMOC (legacy CO01) consumes BOM and routing. Payroll run calculates wage types. No dummy – if enterprise uses feature, app uses same manner, but with general ERP terminology.
          </p>
        </div>
      </div>
    </div>
  );
}
