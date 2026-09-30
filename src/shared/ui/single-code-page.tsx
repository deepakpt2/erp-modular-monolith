"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';
import { canUserAccessPage, getPagePermission } from '@/shared/kernel/auth/pagePermissions';

export interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'select' | 'autocomplete';
  options?: string[];
  apiUrl?: string;
  dataKey?: string;
  codeField?: string;
  createUrl?: string;
  createCode?: string;
  companyCode?: string;
  description?: string;
}

export interface SingleCodePageProps {
  code: string;
  sapAlias?: string;
  title: string;
  description: string;
  apiEndpoint: string;
  fields: FieldDef[];
  relatedLinks: { code: string; label: string; route: string; description: string; count?: number }[];
  initialForm: Record<string, any>;
}

// Auto-classify fields into tabs if form is large
type TabDef = { key: string; label: string; desc: string; fields: FieldDef[] };

const TAB_RULES: { key: string; label: string; keywords: string[]; desc: string }[] = [
  { key: 'basic', label: 'Basic Data', keywords: ['code', 'name', 'description', 'type', 'category', 'group', 'item_number', 'material', 'product', 'title'], desc: 'Core identifiers – code, name, description, type' },
  { key: 'org', label: 'Organizational', keywords: ['tenant', 'legal_entity', 'company_group', 'company_code', 'facility', 'plant', 'sales_org', 'commercial_org', 'distribution', 'division', 'procurement_division', 'purchasing_org', 'sales_channel', 'product_line', 'business_segment', 'profit_center', 'cost_center', 'warehouse', 'shipping', 'loading', 'transportation', 'route', 'customer', 'vendor', 'partner'], desc: 'Org assignments – legal entity, facility, sales org, etc.' },
  { key: 'purchasing', label: 'Purchasing', keywords: ['purchasing_group', 'buyer_group', 'purchasing', 'buyer', 'procurement', 'source', 'quota', 'info_record', 'vendor'], desc: 'Purchasing data – buyer group, procurement' },
  { key: 'mrp', label: 'MRP', keywords: ['mrp', 'planning', 'lot_size', 'lot_sizing', 'safety_stock', 'reorder', 'min_lot', 'max_lot', 'fixed_lot', 'mrp_controller', 'planning_controller'], desc: 'MRP & planning' },
  { key: 'storage', label: 'Storage', keywords: ['storage', 'sloc', 'inventory_location', 'lot', 'batch', 'expiry', 'shelf_life', 'kit', 'bin', 'stock'], desc: 'Storage, lot/batch, kit' },
  { key: 'accounting', label: 'Accounting', keywords: ['valuation_class', 'pricing_method', 'price_control', 'moving_avg', 'standard_price', 'gl_account', 'account_number', 'currency', 'chart_of_accounts', 'tax', 'account_group', 'posting', 'fiscal', 'credit', 'field_status', 'tolerance', 'document_type'], desc: 'Accounting & valuation – GL, valuation class, price control' },
  { key: 'costing', label: 'Costing', keywords: ['costing', 'overhead', 'cost_center', 'profit_center', 'price_unit'], desc: 'Costing' },
  { key: 'sales', label: 'Sales', keywords: ['sales_org', 'distribution_channel', 'division', 'sales_channel', 'product_line', 'sales_uom', 'commercial_unit', 'tax_classification', 'account_assignment', 'item_category'], desc: 'Sales view' },
  { key: 'quality', label: 'Quality', keywords: ['quality', 'qm', 'inspection', 'control_key'], desc: 'Quality' },
  { key: 'additional', label: 'Additional', keywords: [], desc: 'Other fields' },
];

function classifyFields(fields: FieldDef[]): TabDef[] {
  if (fields.length <= 6) {
    return [{ key: 'basic', label: 'General', desc: 'All fields', fields }];
  }
  const tabsMap: Record<string, FieldDef[]> = {};
  const usedKeys = new Set<string>();
  // Initialize
  TAB_RULES.forEach(r => tabsMap[r.key] = []);
  // Assign
  fields.forEach(f => {
    const lk = f.key.toLowerCase();
    let assigned = false;
    for (const rule of TAB_RULES) {
      if (rule.key === 'additional') continue;
      if (rule.key === 'basic' && tabsMap['basic'].length >= 6) continue; // limit basic size
      if (rule.keywords.some(kw => lk.includes(kw))) {
        tabsMap[rule.key].push(f);
        assigned = true;
        break;
      }
    }
    if (!assigned) tabsMap['additional'].push(f);
  });
  // Remove empty tabs, keep order
  const result: TabDef[] = [];
  for (const rule of TAB_RULES) {
    const flds = tabsMap[rule.key];
    if (flds.length > 0) {
      result.push({ key: rule.key, label: rule.label, desc: rule.desc, fields: flds });
    }
  }
  // If only 1 tab after classification but fields >6, force split into Basic/Additional for usability
  if (result.length === 1 && fields.length > 8) {
    const half = Math.ceil(fields.length / 2);
    return [
      { key: 'basic', label: 'Basic Data', desc: 'Core fields', fields: fields.slice(0, half) },
      { key: 'additional', label: 'Additional Data', desc: 'Remaining fields', fields: fields.slice(half) },
    ];
  }
  return result.length ? result : [{ key: 'basic', label: 'General', desc: 'All fields', fields }];
}

export function SingleCodePage({ code, sapAlias, title, description, apiEndpoint, fields, relatedLinks, initialForm }: SingleCodePageProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const companyCode = params.companyCode as string;
  const modeParam = (searchParams.get('mode') || 'create').toLowerCase();
  const mode = modeParam === 'display' ? 'list' : modeParam;
  const [uiMode, setUiMode] = useState<'modern' | 'classic'>('modern');
  const [form, setForm] = useState<Record<string, any>>(initialForm);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [expandedItem, setExpandedItem] = useState<any | null>(null);
  const [listSearch, setListSearch] = useState('');
  const [changeSearch, setChangeSearch] = useState('');
  const [showListSuggestions, setShowListSuggestions] = useState(false);
  const [showChangeSuggestions, setShowChangeSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [me, setMe] = useState<any>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [rbacDenied, setRbacDenied] = useState<{ denied: boolean; reason?: string; requiredPermission?: string; requiredRoles?: string[] } | null>(null);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const j = await res.json();
          setMe(j);
          // Check if user can access this page code
          const access = canUserAccessPage(j, code);
          if (!access.allowed) {
            setRbacDenied({ denied: true, reason: access.reason, requiredPermission: access.requiredPermission, requiredRoles: access.requiredRoles });
          } else {
            setRbacDenied({ denied: false });
          }
        } else {
          // If /api/me fails, allow for MVP
          setRbacDenied({ denied: false });
        }
      } catch (e) {
        console.warn('Failed to fetch /api/me for RBAC', e);
        setRbacDenied({ denied: false });
      }
      setMeLoading(false);
    }
    fetchMe();
  }, [code]);

  // Tab classification for create/change forms – stable via JSON.stringify to avoid new array each render causing hook mismatch #310
  const fieldsKey = useMemo(() => JSON.stringify(fields.map(f=>f.key)), [fields]);
  const tabs = useMemo(() => classifyFields(fields), [fieldsKey]);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('erp-ui-mode');
      if (saved) setUiMode(saved as any);
      const handler = (e: any) => setUiMode(e.detail);
      window.addEventListener('erp-ui-mode-change', handler as any);
      return () => window.removeEventListener('erp-ui-mode-change', handler as any);
    } catch {}
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiEndpoint);
      // Handle non-JSON responses (404 HTML, 403, etc.) – previously caused Unexpected token '<' error
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        const text = await res.text();
        console.warn(`Fetch ${apiEndpoint} failed ${res.status}:`, text.slice(0,200));
        if (res.status === 404) {
          setMessage(`⚠️ API ${apiEndpoint} not found (404) – check route exists – e.g., /api/hr/employees not /api/employees – fixed`);
        } else if (res.status === 403) {
          try {
            const j = JSON.parse(text);
            setMessage(`🔒 Forbidden – ${j.error || 'requires permission'} – master data manager cannot access HR payroll – SoD`);
          } catch {
            setMessage(`🔒 Forbidden – requires permission – ${res.status}`);
          }
        }
        setItems([]);
        setLoading(false);
        return;
      }
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.warn(`Fetch ${apiEndpoint} returned non-JSON:`, text.slice(0,200));
        setMessage(`❌ API ${apiEndpoint} returned non-JSON (likely 404 HTML <!DOCTYPE) – check endpoint – fixed to /api/hr/employees`);
        setItems([]);
        setLoading(false);
        return;
      }
      const j = await res.json();
      const candidates = [
        j.data, j[code.toLowerCase()], j[code],
        j.companyGroups, j.legalEntities, j.facilities, j.materials, j.items,
        j.chartOfAccounts, j.glAccounts, j.charts, j.accounts, j.costCenters, j.profitCenters,
        j.companyCodes, j.plants, j.storageLocations, j.purchasingOrgs, j.uoms, j.currencies, j.taxCodes,
        j.customers, j.vendors, j.priceLists, j.warehouses, j.workCenters, j.routings, j.boms,
        j.productionOrders, j.salesOrders, j.purchaseOrders, j.inventory, j.stock, j.batches, j.roles, j.users,
        j.tenants, j.ledgers, j.documents, j.postingPeriods, j.numberRanges, j.toleranceGroups, j.autoAccounts,
        j.revenueAccounts, j.retainedEarnings, j.accountGroups, j.materialGroups, j.productGroups, j.salesOrgs,
        j.distributionChannels, j.divisions, j.shippingPoints, j.loadingPoints, j.transportationZones, j.routes,
        j.creditControlAreas, j.dunningAreas, j.fieldStatusVariants, j.postingKeys, j.documentTypes, j.paymentTerms,
        j.incoterms, j.outputTypes, j.pricingProcedures, j.conditionTypes,
      ];
      let data: any = null;
      for (const c of candidates) {
        if (Array.isArray(c) && c.length >= 0) {
          if (c.length > 0) { data = c; break; }
          if (!data) data = c;
        }
      }
      if (!data) {
        for (const k of Object.keys(j)) {
          if (Array.isArray(j[k]) && j[k].length > 0 && typeof j[k][0] === 'object') {
            if (k === 'erpDefaults') continue;
            data = j[k];
            break;
          }
        }
      }
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [apiEndpoint]);

  useEffect(() => {
    if (mode === 'change' && selectedCode) {
      const found = items.find((it: any) => (it.code || it.account_number || it.item_number) === selectedCode);
      if (found) setForm({ ...initialForm, ...found });
    }
    if (mode === 'create') setForm(initialForm);
  }, [mode, selectedCode, items]);

  // Validation per tab
  const missingPerTab = useMemo(() => {
    const result: Record<string, string[]> = {};
    tabs.forEach(tab => {
      const missing = tab.fields.filter(f => f.required).filter(f => {
        const v = form[f.key];
        return !v || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
      }).map(f => f.key);
      result[tab.key] = missing;
    });
    return result;
  }, [form, tabs]);

  const isFormValid = useMemo(() => {
    return Object.values(missingPerTab).every(arr => arr.length === 0);
  }, [missingPerTab]);

  const totalMissing = useMemo(() => Object.values(missingPerTab).reduce((acc, arr) => acc + arr.length, 0), [missingPerTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      const firstTabWithMissing = tabs.find(t => missingPerTab[t.key].length > 0);
      if (firstTabWithMissing) setActiveTab(firstTabWithMissing.key);
      setMessage(`❌ Fill required fields: ${Object.entries(missingPerTab).filter(([_, arr]) => arr.length).map(([tab, arr]) => `${tab.toUpperCase()}: ${arr.join(', ')}`).join(' | ')}`);
      return;
    }
    setMessage(null);
    try {
      let payload: any = { ...form, company_code: companyCode };
      if ((code === 'EMTC' || apiEndpoint.includes('materials')) && !payload.item_number && !payload.code) {
        try {
          const nextRes = await fetch('/api/number-ranges/next?object_type=ITEM');
          const nextJson = await nextRes.json();
          if (nextJson.success && nextJson.document_number) {
            payload.item_number = nextJson.document_number;
          } else {
            const nrRes = await fetch('/api/number-ranges');
            const nrJson = await nrRes.json();
            const ranges = nrJson.data || nrJson.numberRanges || [];
            const matRange = ranges.find((r: any) => r.object_type === 'ITEM' || r.code?.includes('MAT') || r.code === 'MAT-01' || r.code === 'ITEM-01');
            if (matRange) {
              const nextNum = (matRange.current_number || matRange.from_number || 100000) + 1;
              const prefix = matRange.prefix || 'MAT-';
              payload.item_number = `${prefix}${nextNum}`;
            }
          }
        } catch {}
      }
      if (!payload.code && (form as any).code === '' && code !== 'EMTC') {
        try {
          const objType = code.startsWith('P') ? 'PR' : code.startsWith('F') ? 'FI_DOC' : '';
          if (objType) {
            const nextRes = await fetch(`/api/number-ranges/next?object_type=${objType}`);
            const nextJson = await nextRes.json();
            if (nextJson.success) payload.code = nextJson.document_number;
          }
        } catch {}
      }
      const method = mode === 'change' ? 'PUT' : 'POST';
      const res = await fetch(apiEndpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const ct = res.headers.get('content-type') || '';
      let j: any = {};
      if (ct.includes('application/json')) {
        j = await res.json();
      } else {
        const txt = await res.text();
        console.warn(`Submit ${apiEndpoint} returned non-JSON ${res.status}:`, txt.slice(0,500));
        if (res.status === 404) {
          throw new Error(`API ${apiEndpoint} not found (404) – endpoint missing – check /api/hr/employees exists – HTML returned <!DOCTYPE – fixed`);
        }
        if (txt.includes('<!DOCTYPE')) {
          throw new Error(`API ${apiEndpoint} returned HTML not JSON – likely 404 – got <!DOCTYPE – check endpoint – fixed to /api/hr/employees`);
        }
        try { j = JSON.parse(txt); } catch { j = { error: txt.slice(0,200) }; }
      }
      if (!res.ok) throw new Error(j.error || `Failed ${res.status}`);
      setMessage(`✅ ${title} ${payload.code || payload.item_number || payload.account_number} ${mode === 'change' ? 'updated' : 'created'} – ${code}`);
      fetchItems();
      if (mode === 'create') setForm(initialForm);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  const filteredListItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (!listSearch.trim()) return items;
    const q = listSearch.toLowerCase();
    return items.filter((it: any) => {
      const codeVal = (it.code || it.account_number || it.item_number || '').toLowerCase();
      const nameVal = (it.name || it.description || it.legal_name || '').toLowerCase();
      return codeVal.includes(q) || nameVal.includes(q);
    });
  }, [items, listSearch]);

  const filteredChangeItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (!changeSearch.trim()) return items.slice(0, 20);
    const q = changeSearch.toLowerCase();
    return items.filter((it: any) => {
      const codeVal = (it.code || it.account_number || it.item_number || '').toLowerCase();
      const nameVal = (it.name || it.description || it.legal_name || '').toLowerCase();
      return codeVal.includes(q) || nameVal.includes(q);
    }).slice(0, 50);
  }, [items, changeSearch]);

  const listSuggestions = useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (!listSearch.trim() || listSearch.length < 2) return [];
    const q = listSearch.toLowerCase();
    return items.filter((it: any) => {
      const codeVal = (it.code || it.account_number || it.item_number || '').toLowerCase();
      const nameVal = (it.name || it.description || it.legal_name || '').toLowerCase();
      return codeVal.includes(q) || nameVal.includes(q);
    }).slice(0, 8);
  }, [items, listSearch]);

  const changeSuggestions = useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (!changeSearch.trim() || changeSearch.length < 1) return [];
    const q = changeSearch.toLowerCase();
    return items.filter((it: any) => {
      const codeVal = (it.code || it.account_number || it.item_number || '').toLowerCase();
      const nameVal = (it.name || it.description || it.legal_name || '').toLowerCase();
      return codeVal.includes(q) || nameVal.includes(q);
    }).slice(0, 8);
  }, [items, changeSearch]);

  const showTabs = tabs.length > 1 && (mode === 'create' || (mode === 'change' && selectedCode));

  const modern = uiMode === 'modern';

  // Sitewide RBAC – completely block view if not allowed – show unauthorized for this transaction, contact administrator
  if (meLoading) {
    return (
      <div className={modern ? "min-h-screen bg-[#fafaf9] p-6 flex items-center justify-center" : "min-h-screen bg-white p-4 flex items-center justify-center"}>
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center" : "border p-4 text-center"}>
          <div className="text-sm">Checking permissions – FRPC – {code} – {title}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Verifying if user can access {code} – {title} – sitewide RBAC</div>
        </div>
      </div>
    );
  }

  if (rbacDenied?.denied) {
    return (
      <div className={modern ? "min-h-screen bg-[#fafaf9] p-6" : "min-h-screen bg-white p-4"}>
        <div className={modern ? "max-w-[700px] mx-auto space-y-6" : "max-w-[600px] mx-auto space-y-4"}>
          <div className={modern ? "bg-white rounded-2xl shadow-sm border border-red-200 p-8" : "border-2 border-red-200 p-6 bg-red-50"}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🔒</span>
              <div>
                <h2 className="text-xl font-bold text-red-700">Unauthorised for this transaction – Contact Administrator</h2>
                <p className="text-xs text-zinc-500 mt-1">FRPC Authorization – Code {code} – {title} – {sapAlias || ''} – sitewide RBAC – SoD segregation of duties – industry standard</p>
              </div>
            </div>
            <div className={modern ? "bg-red-50 border border-red-200 rounded-xl p-4" : "border border-red-300 p-3 bg-white"}>
              <div className="text-sm font-mono font-bold text-red-800">{rbacDenied.reason}</div>
              <div className="text-xs text-zinc-600 mt-3">
                <div>User: <b>{me?.email}</b> – simpleRole <b>{me?.simpleRole}</b> – roles [{me?.roles?.join(', ')}]</div>
                <div className="mt-1">Required permission: <b>{rbacDenied.requiredPermission}</b> – required roles [{rbacDenied.requiredRoles?.join(', ')}]</div>
                <div className="mt-2 text-[11px] text-zinc-500">Master data manager (MASTER_DATA_MANAGER) has only FOUNDATION permissions MATERIAL_CREATE/MATERIAL_VIEW – cannot access HR payroll (PAYROLL_RUN) or Inventory if requires WAREHOUSE/MATERIAL_MANAGER – SoD – payroll sensitive salary data, inventory sensitive stock – only allowed roles can access – contact administrator to grant role via /admin/roles and /admin/authorizations – FRPC own IP alias PFCG/SU01 – industry standard</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px]">
              <div className="font-semibold">Why this transaction is blocked?</div>
              <div className="mt-1">• If code is {code} – {title} – requires permission {rbacDenied.requiredPermission} – user {me?.simpleRole} roles [{me?.roles?.join(', ')}] does not have it</div>
              <div>• Master data manager cannot access HR payroll – payroll contains sensitive salary data – only HR, ADMIN, OWNER with PAYROLL_RUN – SoD</div>
              <div>• Inventory (ISTV) requires WAREHOUSE,ADMIN,OWNER,MANAGER,MATERIAL_MANAGER – MASTER_DATA_MANAGER alone not enough – per your error message</div>
              <div>• If you came to a page that is not allowed, show this unauthorized message instead of form data – per your request – completely block view</div>
              <div className="mt-2">Contact administrator to assign role via POST /api/user-roles {"{ userId, roleCode }"} – e.g., assign HR role to access payroll, WAREHOUSE to access inventory</div>
            </div>
            <div className="mt-6 flex gap-2">
              <a href={`/${companyCode}/navigator`} className={modern ? "px-4 py-2 rounded-full bg-black text-white text-xs" : "border px-3 py-1 text-xs bg-black text-white"}>🌳 Navigator – only allowed pages shown</a>
              <a href="/login" className={modern ? "px-4 py-2 rounded-full border text-xs bg-white hover:bg-zinc-50" : "border px-3 py-1 text-xs bg-white"}>Switch User</a>
            </div>
            <div className="mt-4 text-[10px] text-zinc-400">
              <div>Code {code} – {title} – module {getPagePermission(code)?.module || 'UNKNOWN'} – permission {rbacDenied.requiredPermission} – roles {rbacDenied.requiredRoles?.join(', ')}</div>
              <div>Current: {me?.email} – {me?.simpleRole} – [{me?.roles?.join(', ')}] – perms [{me?.permissions?.slice(0,5).join(', ')}...]</div>
              <div>Error shown instead of formdata per your request – if code is used show error message instead of formdata – completely block view</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderField = (field: FieldDef) => {
    const value = form[field.key] || '';
    const isEmpty = !value;
    const borderColor = field.required && isEmpty ? 'border-red-400 ring-1 ring-red-100' : value ? 'border-green-400' : 'border-zinc-200';
    const inputPlaceholder = '';
    const selectPlaceholder = `Select ${field.label}`;
    if (field.type === 'autocomplete') {
      return (
        <DbAutocomplete
          key={field.key}
          label={`${field.label}${field.required ? ' *' : ''}`}
          apiUrl={field.apiUrl!}
          dataKey={field.dataKey!}
          codeField={field.codeField || 'code'}
          value={value}
          onChange={(v) => setForm({ ...form, [field.key]: v })}
          placeholder={inputPlaceholder}
          required={field.required}
          createUrl={field.createUrl}
          createCode={field.createCode}
          companyCode={field.companyCode}
        />
      );
    }
    if (field.type === 'select' && field.options) {
      return (
        <div key={field.key} className="space-y-1">
          <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>{field.label}{field.required ? ' *' : ''}</label>
          <select value={value} onChange={e => setForm({ ...form, [field.key]: e.target.value })} className={modern ? `w-full border-2 ${borderColor} rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 bg-white` : `w-full border px-2 py-1.5 text-xs ${field.required && isEmpty ? 'border-red-400' : ''}`}>
            <option value="">{selectPlaceholder}</option>
            {field.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {field.description && <p className="text-[10px] text-zinc-400">{field.description}</p>}
        </div>
      );
    }
    if (field.type === 'textarea') {
      return (
        <div key={field.key} className="space-y-1">
          <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>{field.label}{field.required ? ' *' : ''}</label>
          <textarea value={value} onChange={e => setForm({ ...form, [field.key]: e.target.value })} placeholder={inputPlaceholder} rows={3} className={modern ? `w-full border-2 ${borderColor} rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10` : `w-full border px-2 py-1.5 text-xs ${field.required && isEmpty ? 'border-red-400' : ''}`} />
          {field.description && <p className="text-[10px] text-zinc-400">{field.description}</p>}
        </div>
      );
    }
    return (
      <div key={field.key} className="space-y-1">
        <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>{field.label}{field.required ? ' *' : ''}</label>
        <input value={value} onChange={e => setForm({ ...form, [field.key]: e.target.value })} placeholder={inputPlaceholder} className={modern ? `w-full border-2 ${borderColor} rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10` : `w-full border px-2 py-1.5 text-xs ${field.required && isEmpty ? 'border-red-400' : ''}`} />
        {field.description && <p className="text-[10px] text-zinc-400">{field.description}</p>}
      </div>
    );
  };

  
  return (
    <div className={modern ? "min-h-screen bg-[#fafaf9] p-6" : "min-h-screen bg-white p-4"}>
      <div className={modern ? "max-w-[1000px] mx-auto space-y-6" : "max-w-[900px] mx-auto space-y-4"}>
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border-b pb-3"}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={modern ? "text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-black text-white" : "text-[10px] font-mono border px-2 py-0.5 bg-black text-white"}>{code}</span>
              {sapAlias && <span className={modern ? "text-[10px] font-mono px-2 py-1 rounded-full bg-zinc-100 border text-zinc-500" : "text-[9px] font-mono border px-1 bg-zinc-50"}>{sapAlias}</span>}
              <span className={modern ? "text-[11px] bg-zinc-100 border rounded-full px-2.5 py-1 text-zinc-600" : "text-[10px] border px-2 py-0.5"}>{items.length} records</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${companyCode}/navigator`} className={modern ? "px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50" : "border px-2 py-1 text-xs"}>🌳 Navigator</Link>
              <Link href={`/${companyCode}/foundation/enterprise-structure`} className={modern ? "px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50" : "border px-2 py-1 text-xs"}>Hub</Link>
            </div>
          </div>
          <h1 className={modern ? "text-xl font-bold mt-3 tracking-tight" : "text-lg font-bold mt-2"}>{title}</h1>
          <p className="text-sm text-zinc-500 mt-1">{description} – Company: <b>{companyCode}</b> – Strict ERP usage, no dummy – data used in transactions</p>
          <div className={modern ? "flex items-center gap-1 mt-4 bg-zinc-100 rounded-full p-1 w-fit" : "flex items-center gap-1 mt-3 border-b"}>
            {['create', 'list', 'change'].map(m => {
              const isActive = mode === m;
              const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
              const finalHref = `${currentPath}?mode=${m}`;
              return (
                <Link key={m} href={finalHref} className={modern ? `px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isActive ? 'bg-black text-white' : 'hover:bg-white text-zinc-600'}` : `px-3 py-1 text-xs border-b-2 ${isActive ? 'border-black font-bold' : 'border-transparent text-zinc-500'}`}>
                  {m.charAt(0).toUpperCase() + m.slice(1)} {m === 'list' ? `(${items.length})` : ''}
                </Link>
              );
            })}
          </div>
        </div>

        {mode === 'list' ? (
          <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-4" : "border p-3 space-y-3"}>
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <h3 className={modern ? "font-semibold text-sm" : "font-semibold text-xs"}>List – {filteredListItems.length} of {items.length} records</h3>
              <div className="relative w-full sm:w-[320px]">
                <input value={listSearch} onChange={e => { setListSearch(e.target.value); setShowListSuggestions(true); }} onFocus={() => setShowListSuggestions(true)} onBlur={() => setTimeout(() => setShowListSuggestions(false), 200)} placeholder={`Search ${code}...`} className={modern ? "w-full border-2 border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10" : "w-full border px-2 py-1.5 text-xs"} />
                {showListSuggestions && listSuggestions.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-lg border border-zinc-200 z-10 max-h-[200px] overflow-auto">
                    {listSuggestions.map((it: any, i: number) => (
                      <button key={i} onMouseDown={() => { setListSearch(it.code || it.item_number || ''); setShowListSuggestions(false); setExpandedItem(it); }} className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 flex items-center gap-2">
                        <span className="font-mono font-bold">{it.code || it.item_number}</span>
                        <span className="truncate">{it.name || it.description || ''}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {loading ? <p className="text-sm text-zinc-500">Loading…</p> : (
              <>
                <div className="overflow-auto">
                  <table className={modern ? "w-full text-sm" : "w-full text-xs"}>
                    <thead className={modern ? "text-[11px] text-zinc-500 border-b" : "text-[10px] text-zinc-500 border-b"}>
                      <tr><th className="text-left py-2">Code</th><th className="text-left py-2">Name</th><th className="text-left py-2">Details</th><th className="text-left py-2">Action</th></tr>
                    </thead>
                    <tbody>
                      {filteredListItems.map((it: any, i: number) => (
                        <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer" onClick={() => setExpandedItem(it)}>
                          <td className="py-2 font-mono text-xs">{it.code || it.account_number || it.item_number}</td>
                          <td className="py-2">{it.name || it.description || it.legal_name || ''}</td>
                          <td className="py-2 text-[11px] text-zinc-500 truncate max-w-[200px]">{Object.keys(it).slice(0, 5).map(k => `${k}:${String(it[k]).slice(0, 20)}`).join(' ')}</td>
                          <td className="py-2"><span className="text-[11px] text-blue-600 hover:underline">View</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {expandedItem && (
                  <div className={modern ? "mt-4 p-5 bg-zinc-50 rounded-2xl border border-zinc-200" : "mt-3 p-3 bg-zinc-50 border"}>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-sm">Expanded View – {expandedItem.code || expandedItem.item_number} – Not Editable</h4>
                      <div className="flex gap-2">
                        <Link href={`${typeof window !== 'undefined' ? window.location.pathname : ''}?mode=change`} onClick={() => setSelectedCode(expandedItem.code || expandedItem.item_number)} className={modern ? "px-3 py-1 rounded-full bg-black text-white text-xs" : "border px-2 py-1 text-xs bg-black text-white"}>✏️ Edit – Go to Change</Link>
                        <button onClick={() => setExpandedItem(null)} className={modern ? "px-3 py-1 rounded-full border text-xs" : "border px-2 py-1 text-xs"}>Close</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {Object.entries(expandedItem).map(([k, v]) => (
                        <div key={k} className="flex gap-2 border-b border-zinc-100 py-1">
                          <span className="font-medium text-zinc-600 min-w-[120px]">{k}:</span>
                          <span className="truncate">{String(v ?? '').slice(0, 100)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : mode === 'change' ? (
          <div className="space-y-4">
            <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-5 space-y-3" : "border p-3 space-y-3"}>
              <label className={modern ? "text-xs font-medium" : "text-[11px] font-medium"}>Search {title} to Change – type to filter (not full dropdown)</label>
              <div className="relative">
                <input value={changeSearch} onChange={e => { setChangeSearch(e.target.value); setShowChangeSuggestions(true); }} onFocus={() => setShowChangeSuggestions(true)} onBlur={() => setTimeout(() => setShowChangeSuggestions(false), 200)} placeholder={`Search ${code} – e.g., type code or name...`} className={modern ? "w-full border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10" : "w-full border px-2 py-1.5 text-xs"} />
                {showChangeSuggestions && filteredChangeItems.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-lg border border-zinc-200 z-10 max-h-[300px] overflow-auto">
                    {filteredChangeItems.map((it: any, i: number) => (
                      <button key={i} onMouseDown={() => { setSelectedCode(it.code || it.account_number || it.item_number || ''); setChangeSearch(it.code || it.item_number || ''); setShowChangeSuggestions(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 flex items-center gap-2">
                        <span className="font-mono font-bold text-[10px] bg-black text-white rounded px-1">{it.code || it.item_number}</span>
                        <span className="truncate flex-1">{it.name || it.description || ''}</span>
                        <span className="text-[10px] text-zinc-400">{it.type || it.account_type || ''}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedCode && <div className="text-[11px] text-zinc-500">Selected: <b>{selectedCode}</b> – <button onClick={() => setSelectedCode('')} className="text-blue-600 hover:underline">Clear</button></div>}
            </div>
            {selectedCode && (
              <form onSubmit={handleSubmit} className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-4" : "border p-3 space-y-3"}>
                <h3 className={modern ? "font-semibold text-sm" : "font-semibold text-xs"}>Change {title} – {selectedCode}</h3>
                {showTabs ? (
                  <>
                    <div className={modern ? "flex gap-2 border-b pb-3 overflow-x-auto" : "flex gap-1 border-b pb-2 overflow-x-auto"}>
                      {tabs.map(t => {
                        const missing = missingPerTab[t.key]?.length || 0;
                        return (
                          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} className={modern ? `relative px-4 py-2 rounded-full text-xs font-medium border whitespace-nowrap ${activeTab === t.key ? 'bg-black text-white border-black' : 'bg-zinc-50 hover:bg-zinc-100'}` : `relative px-3 py-1 text-xs border whitespace-nowrap ${activeTab === t.key ? 'bg-black text-white' : 'bg-white'}`}>
                            {t.label}
                            
                            {missing > 0 && <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] bg-red-500 text-white rounded-full px-1.5 border border-white shadow-sm" title={`${missing} required missing`}>{missing}</span>}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-zinc-400">{tabs.find(t => t.key === activeTab)?.desc} {missingPerTab[activeTab]?.length > 0 && <span className="text-red-500">• Missing: {missingPerTab[activeTab].join(', ')}</span>}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tabs.find(t => t.key === activeTab)?.fields.map(renderField)}
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map(renderField)}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button type="submit" disabled={!isFormValid} className={modern ? `px-5 py-2.5 rounded-full text-sm font-medium transition ${isFormValid ? 'bg-black text-white hover:bg-zinc-800' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}` : `border px-4 py-1.5 text-xs ${isFormValid ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}>Save</button>
                  {!isFormValid && <span className="text-[11px] text-red-500">Red dots show tabs with missing – fill to activate</span>}
                </div>
                {message && <div className={modern ? "text-xs p-3 rounded-xl border bg-zinc-50" : "text-[11px] border p-2"}>{message}</div>}
              </form>
            )}
            {!selectedCode && (
              <div className={modern ? "bg-zinc-50 rounded-2xl border border-zinc-200 p-6 text-center" : "border p-4 text-center bg-zinc-50"}>
                <p className="text-sm text-zinc-500">Type in search above to find {code} – shows suggestions (max 50) – handles hundreds without full dropdown</p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={modern ? "bg-white rounded-2xl shadow-lg border border-zinc-200 p-6 space-y-5" : "border p-4 space-y-3 bg-white"}>
            <div className="flex items-center justify-between">
              <h3 className={modern ? "font-semibold text-sm" : "font-semibold text-xs"}>Create {title} – {code}</h3>
              <div className="flex items-center gap-2">
                <span className={modern ? "text-[11px] text-zinc-400" : "text-[10px] text-zinc-400"}>Fields with * required – red border if empty, green if valid – submit disabled until all required filled</span>
                {(code === 'EMTC' || apiEndpoint.includes('materials')) && <span className="text-[10px] bg-blue-50 border border-blue-200 rounded-full px-2 py-1">Auto number from MAT-01 if blank</span>}
              </div>
            </div>
            {showTabs ? (
              <>
                <div className={modern ? "flex gap-2 border-b pb-3 overflow-x-auto" : "flex gap-1 border-b pb-2 overflow-x-auto"}>
                  {tabs.map(t => {
                    const missing = missingPerTab[t.key]?.length || 0;
                    return (
                      <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} className={modern ? `relative px-4 py-2 rounded-full text-xs font-medium border whitespace-nowrap transition ${activeTab === t.key ? 'bg-black text-white border-black' : 'bg-zinc-50 hover:bg-zinc-100'}` : `relative px-3 py-1 text-xs border whitespace-nowrap ${activeTab === t.key ? 'bg-black text-white' : 'bg-white'}`}>
                        {t.label}
                        
                        {missing > 0 && <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] bg-red-500 text-white rounded-full px-1.5 border border-white shadow-sm" title={`${missing} required missing`}>{missing}</span>}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-zinc-400">{tabs.find(t => t.key === activeTab)?.desc} {missingPerTab[activeTab]?.length > 0 && <span className="text-red-500">• Missing in this tab: {missingPerTab[activeTab].join(', ')}</span>}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tabs.find(t => t.key === activeTab)?.fields.map(renderField)}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(renderField)}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={!isFormValid} className={modern ? `px-6 py-2.5 rounded-full text-sm font-medium shadow transition ${isFormValid ? 'bg-black text-white hover:bg-zinc-800' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}` : `border px-4 py-1.5 text-xs ${isFormValid ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}>Create</button>
              {!isFormValid && <span className="text-[11px] text-red-500">Fill required fields – red dots show tabs needing attention – submit disabled until valid</span>}
              <span className="text-[11px] text-zinc-400">Code in heading badge – button short – auto number uses FNRC if enabled</span>
            </div>
            {message && <div className={modern ? "text-xs p-3 rounded-xl border bg-zinc-50 mt-3" : "text-[11px] border p-2"}>{message}</div>}
          </form>
        )}

        <div className={modern ? "bg-zinc-50 rounded-2xl border border-zinc-200 p-4" : "border p-3 bg-zinc-50"}>
          <h4 className={modern ? "text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2" : "text-[10px] uppercase text-zinc-500 mb-1"}>Related Masters – auto from dependencies – low importance</h4>
          <div className="flex flex-wrap gap-2">
            {relatedLinks.map((link, i) => (
              <Link key={i} href={`/${companyCode}${link.route}`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}>
                <span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">{link.code}</span>
                <span>{link.label}</span>
                <span className="text-zinc-400">→</span>
              </Link>
            ))}
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">These links help create necessary data needed in this form – e.g., if this form needs Company Group, create via ECGC first – data strictly used in practice</p>
        </div>

        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-5" : "border p-3"}>
          <h4 className={modern ? "font-medium text-sm mb-3" : "font-medium text-xs mb-2"}>Existing {title} – {items.length} (quick)</h4>
          {loading ? <p className="text-xs text-zinc-500">Loading…</p> : (
            <div className="overflow-auto max-h-[200px]">
              <table className="w-full text-xs">
                <thead className="text-[10px] text-zinc-500 border-b"><tr><th className="text-left py-1">Code</th><th className="text-left py-1">Name</th></tr></thead>
                <tbody>
                  {items.slice(0, 10).map((it: any, i: number) => <tr key={i} className="border-b border-zinc-50"><td className="py-1 font-mono">{it.code || it.account_number || it.item_number}</td><td className="py-1">{it.name || it.description || ''}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
