"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';
import { canUserAccessPage, getPagePermission } from '@/shared/kernel/auth/pagePermissions';
import { IndustryDeletionGuardModal, DeletionDiagnostic } from '@/shared/ui/sap-deletion-guard-modal';

export interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'select' | 'autocomplete';
  options?: (string | { value: string; label: string })[];
  apiUrl?: string;
  dataKey?: string;
  codeField?: string;
  createUrl?: string;
  createCode?: string;
  companyCode?: string;
  description?: string;
}

export interface ReferenceConfig {
  sourceEndpoint?: string;
  keyField?: string;
  displayField?: string;
  excludedFields?: string[];
  fieldTransforms?: Record<string, (val: any, record: any) => any>;
  label?: string;
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
  defaultMode?: 'create' | 'list' | 'change';
  referenceConfig?: ReferenceConfig | boolean;
}

// Auto-classify fields into tabs if form is large
type TabDef = { key: string; label: string; desc: string; fields: FieldDef[] };

const TAB_RULES: { key: string; label: string; keywords: string[]; desc: string }[] = [
  { key: 'basic', label: 'Basic', keywords: ['code', 'name', 'description', 'type', 'category', 'group', 'item_number', 'material', 'product', 'title'], desc: 'Core identifiers' },
  { key: 'org', label: 'Org', keywords: ['tenant', 'legal_entity', 'company_group', 'company_code', 'facility', 'plant', 'sales_org', 'commercial_org', 'distribution', 'division', 'procurement_division', 'purchasing_org', 'sales_channel', 'product_line', 'business_segment', 'profit_center', 'cost_center', 'warehouse', 'shipping', 'loading', 'transportation', 'route', 'customer', 'vendor', 'partner'], desc: 'Organizational assignments' },
  { key: 'purchasing', label: 'Purchasing', keywords: ['purchasing_group', 'buyer_group', 'purchasing', 'buyer', 'procurement', 'source', 'quota', 'info_record', 'vendor'], desc: 'Purchasing data' },
  { key: 'mrp', label: 'MRP', keywords: ['mrp', 'planning', 'lot_size', 'lot_sizing', 'safety_stock', 'reorder', 'min_lot', 'max_lot', 'fixed_lot', 'mrp_controller', 'planning_controller'], desc: 'MRP & planning' },
  { key: 'storage', label: 'Storage', keywords: ['storage', 'sloc', 'inventory_location', 'lot', 'batch', 'expiry', 'shelf_life', 'kit', 'bin', 'stock'], desc: 'Storage, lot/batch, kit' },
  { key: 'accounting', label: 'Accounting', keywords: ['valuation_class', 'pricing_method', 'price_control', 'moving_avg', 'standard_price', 'gl_account', 'account_number', 'currency', 'chart_of_accounts', 'tax', 'account_group', 'posting', 'fiscal', 'credit', 'field_status', 'tolerance', 'document_type'], desc: 'Accounting & valuation' },
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
  TAB_RULES.forEach(r => tabsMap[r.key] = []);
  fields.forEach(f => {
    const lk = f.key.toLowerCase();
    let assigned = false;
    for (const rule of TAB_RULES) {
      if (rule.key === 'additional') continue;
      if (rule.key === 'basic' && tabsMap['basic'].length >= 6) continue;
      if (rule.keywords.some(kw => lk.includes(kw))) {
        tabsMap[rule.key].push(f);
        assigned = true;
        break;
      }
    }
    if (!assigned) tabsMap['additional'].push(f);
  });
  const result: TabDef[] = [];
  for (const rule of TAB_RULES) {
    const flds = tabsMap[rule.key];
    if (flds.length > 0) {
      result.push({ key: rule.key, label: rule.label, desc: rule.desc, fields: flds });
    }
  }
  if (result.length === 1 && fields.length > 8) {
    const half = Math.ceil(fields.length / 2);
    return [
      { key: 'basic', label: 'Basic', desc: 'Core fields', fields: fields.slice(0, half) },
      { key: 'additional', label: 'Additional', desc: 'Remaining fields', fields: fields.slice(half) },
    ];
  }
  return result.length ? result : [{ key: 'basic', label: 'General', desc: 'All fields', fields }];
}

export function SingleCodePage({ code, sapAlias, title, description, apiEndpoint, fields, relatedLinks, initialForm, defaultMode, referenceConfig }: SingleCodePageProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const companyCode = params.companyCode as string;
  const modeParam = (searchParams.get('mode') || defaultMode || 'create').toLowerCase();
  const mode = modeParam === 'display' ? 'list' : modeParam;
  const querySelected = searchParams.get('selected');
  const [uiMode, setUiMode] = useState<'modern' | 'classic'>('modern');
  const [referenceRecord, setReferenceRecord] = useState<any | null>(null);
  const [referenceQuery, setReferenceQuery] = useState('');
  const [showRefSuggestions, setShowRefSuggestions] = useState(false);
  const [form, setForm] = useState<Record<string, any>>(initialForm);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string>(querySelected || '');
  const [expandedItem, setExpandedItem] = useState<any | null>(null);
  const [listSearch, setListSearch] = useState('');
  const [changeSearch, setChangeSearch] = useState('');
  const [showListSuggestions, setShowListSuggestions] = useState(false);
  const [showChangeSuggestions, setShowChangeSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [me, setMe] = useState<any>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [rbacDenied, setRbacDenied] = useState<{ denied: boolean; reason?: string; requiredPermission?: string; requiredRoles?: string[] } | null>(null);
  const [deletionDiagnostic, setDeletionDiagnostic] = useState<DeletionDiagnostic | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const j = await res.json();
          setMe(j);
          const access = canUserAccessPage(j, code);
          if (!access.allowed) {
            setRbacDenied({ denied: true, reason: access.reason, requiredPermission: access.requiredPermission, requiredRoles: access.requiredRoles });
          } else {
            setRbacDenied({ denied: false });
          }
        } else {
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


  const resolvedRefConfig = useMemo<ReferenceConfig | null>(() => {
    if (!referenceConfig) return null;
    if (typeof referenceConfig === 'boolean') {
      return {
        keyField: code === 'EMTC' ? 'item_number' : (code === 'FGLC' || code === 'FS00') ? 'account_number' : (code === 'EPAC' || code === 'PSUC' || code === 'SCUC') ? 'account_number' : 'code',
        displayField: (code === 'EMTC' || code === 'materials') ? 'description' : (code === 'EPAC' || code === 'PSUC' || code === 'SCUC') ? 'display_name' : 'name',
        excludedFields: ['id', 'created_at', 'updated_at', 'uuid', 'is_blocked', 'is_deactivated', 'deletion_flag', 'current_number'],
      };
    }
    return {
      keyField: referenceConfig.keyField || (code === 'EMTC' ? 'item_number' : (code === 'FGLC' || code === 'FS00') ? 'account_number' : (code === 'EPAC' || code === 'PSUC' || code === 'SCUC') ? 'account_number' : 'code'),
      displayField: referenceConfig.displayField || ((code === 'EMTC' || code === 'materials') ? 'description' : (code === 'EPAC' || code === 'PSUC' || code === 'SCUC') ? 'display_name' : 'name'),
      excludedFields: referenceConfig.excludedFields || ['id', 'created_at', 'updated_at', 'uuid', 'is_blocked', 'is_deactivated', 'deletion_flag', 'current_number'],
      fieldTransforms: referenceConfig.fieldTransforms,
      sourceEndpoint: referenceConfig.sourceEndpoint,
      label: referenceConfig.label,
    };
  }, [referenceConfig, code]);

  const applyReference = (record: any) => {
    if (!record) return;
    const keyField = resolvedRefConfig?.keyField || 'code';
    const excluded = new Set([
      keyField,
      'id',
      'created_at',
      'updated_at',
      'uuid',
      'is_blocked',
      'is_deactivated',
      'deletion_flag',
      'current_number',
      ...(resolvedRefConfig?.excludedFields || [])
    ]);

    const newFormData: Record<string, any> = { ...initialForm };
    Object.keys(record).forEach(k => {
      if (!excluded.has(k) && k in initialForm) {
        let val = record[k];
        if (resolvedRefConfig?.fieldTransforms && resolvedRefConfig.fieldTransforms[k]) {
          val = resolvedRefConfig.fieldTransforms[k](val, record);
        }
        newFormData[k] = val ?? initialForm[k];
      }
    });

    // Suffix (Copy) to name or description if available
    if (newFormData.name && typeof newFormData.name === 'string') {
      newFormData.name = `${newFormData.name} (Copy)`;
    } else if (newFormData.description && typeof newFormData.description === 'string' && !newFormData.description.includes('(Copy)')) {
      newFormData.description = `${newFormData.description} (Copy)`;
    } else if (newFormData.display_name && typeof newFormData.display_name === 'string') {
      newFormData.display_name = `${newFormData.display_name} (Copy)`;
    }

    setReferenceRecord(record);
    setForm(newFormData);
  };

  const clearReference = () => {
    setReferenceRecord(null);
    setReferenceQuery('');
    setForm(initialForm);
  };

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
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        const text = await res.text();
        console.warn(`Fetch ${apiEndpoint} failed ${res.status}:`, text.slice(0,200));
        if (res.status === 404) {
          setMessage(`⚠️ API ${apiEndpoint} not found (404)`);
        } else if (res.status === 403) {
          try {
            const j = JSON.parse(text);
            setMessage(`🔒 Forbidden – ${j.error || 'requires permission'}`);
          } catch {
            setMessage(`🔒 Forbidden – ${res.status}`);
          }
        }
        setItems([]);
        setLoading(false);
        return;
      }
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.warn(`Fetch ${apiEndpoint} returned non-JSON:`, text.slice(0,200));
        setMessage(`❌ API ${apiEndpoint} returned non-JSON`);
        setItems([]);
        setLoading(false);
        return;
      }
      const j = await res.json();
      const candidates = [
        j.data, j.postingPeriodVariants, j.postingCalendars, j[code.toLowerCase()], j[code],
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
      if (found) {
        // Overlay found item fields on top of initialForm
        const merged: Record<string, any> = { ...initialForm, ...found };
        // Ensure string conversion and normalize boolean values
        Object.keys(found).forEach(k => {
          if (found[k] !== undefined && found[k] !== null) {
            merged[k] = typeof found[k] === 'boolean' ? String(found[k]) : found[k];
          }
        });
        setForm(merged);
      }
    }
    if (mode === 'create') setForm(initialForm);
  }, [mode, selectedCode, items]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      const firstTabWithMissing = tabs.find(t => missingPerTab[t.key].length > 0);
      if (firstTabWithMissing) setActiveTab(firstTabWithMissing.key);
      setMessage(`❌ Fill required: ${Object.entries(missingPerTab).filter(([_, arr]) => arr.length).map(([tab, arr]) => `${tab.toUpperCase()}: ${arr.join(', ')}`).join(' | ')}`);
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
              payload.item_number = `${nextNum}`;
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
          throw new Error(`API ${apiEndpoint} not found (404)`);
        }
        if (txt.includes('<!DOCTYPE')) {
          throw new Error(`API ${apiEndpoint} returned HTML not JSON`);
        }
        try { j = JSON.parse(txt); } catch { j = { error: txt.slice(0,200) }; }
      }
      if (!res.ok) {
        const errorDetail = j.detail || j.message || j.error || `HTTP ${res.status}`;
        const fullErr = j.query ? `${errorDetail} | Query: ${j.query}` : errorDetail;
        throw new Error(fullErr);
      }
      setMessage(`✅ ${title} ${payload.code || payload.item_number || payload.account_number} ${mode === 'change' ? 'updated' : 'created'} – ${code}`);
      fetchItems();
      if (mode === 'create') setForm(initialForm);
    } catch (err: any) {
      console.error('Submit error details:', err);
      setMessage(`❌ ${err.message}`);
    }
  };

  const handleDelete = async (targetCodeOrId: string, itemRecord?: any) => {
    if (!targetCodeOrId) return;
    const confirmMsg = `Are you sure you want to delete ${title} [${targetCodeOrId}]? Industry standard safety checks will verify there are no active dependencies or postings.`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeleting(true);
    setMessage(null);
    try {
      // Build delete query params
      const params = new URLSearchParams();
      if (itemRecord?.id) params.set('id', itemRecord.id);
      if (itemRecord?.account_number) params.set('account_number', itemRecord.account_number);
      else if (itemRecord?.code) params.set('code', itemRecord.code);
      else if (targetCodeOrId.includes('-') || targetCodeOrId.length > 10) params.set('id', targetCodeOrId);
      else params.set('code', targetCodeOrId);

      if (itemRecord?.coa_code) params.set('coa_code', itemRecord.coa_code);

      const res = await fetch(`${apiEndpoint}?${params.toString()}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.diagnostic) {
          // Trigger diagnostic error modal
          setDeletionDiagnostic(data.diagnostic);
          setMessage(`❌ Deletion blocked: ${data.error}`);
          return;
        }
        throw new Error(data.error || `Deletion failed (${res.status})`);
      }

      setMessage(`✅ ${title} ${targetCodeOrId} deleted successfully.`);
      setSelectedCode('');
      setExpandedItem(null);
      fetchItems();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setIsDeleting(false);
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

  if (meLoading) {
    return (
      <div className={modern ? "min-h-screen bg-[#fafaf9] p-4 flex items-center justify-center" : "min-h-screen bg-white p-3 flex items-center justify-center font-mono text-xs"}>
        <div className={modern ? "bg-white rounded-2xl border border-zinc-200 p-6 text-center shadow-sm" : "border-2 border-black p-4 bg-white text-center"}>
          <div className={modern ? "text-sm font-medium" : "font-bold uppercase text-xs"}>Checking permissions – {code} – {title}</div>
          <div className={modern ? "text-xs text-zinc-500 mt-1" : "text-[0.65rem] mt-1"}>Verifying access {code}</div>
        </div>
      </div>
    );
  }

  if (rbacDenied?.denied) {
    return (
      <div className={modern ? "min-h-screen bg-[#fafaf9] p-4" : "min-h-screen bg-white p-3 font-mono text-xs"}>
        <div className={modern ? "max-w-2xl mx-auto space-y-4" : "max-w-xl mx-auto space-y-3"}>
          <div className={modern ? "bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm" : "border-2 border-black p-4 bg-white"}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🔒</span>
              <div>
                <h2 className={modern ? "text-base font-semibold tracking-tight" : "text-sm font-bold uppercase"}>Unauthorised – Contact Administrator</h2>
                <p className={modern ? "text-xs text-zinc-500 mt-0.5" : "text-[0.65rem] mt-0.5"}>{code} – {title} – {sapAlias || ''}</p>
              </div>
            </div>
            <div className={modern ? "bg-zinc-50 border border-zinc-200 rounded-xl p-3" : "border-2 border-black p-2 bg-white"}>
              <div className={modern ? "text-sm font-mono font-bold" : "font-bold uppercase text-xs"}>{rbacDenied.reason}</div>
              <div className={modern ? "text-xs text-zinc-600 mt-2 space-y-1" : "text-[0.65rem] mt-2 space-y-1"}>
                <div>User: <b>{me?.email}</b> – <b>{me?.simpleRole}</b></div>
                <div>Required: <b>{rbacDenied.requiredPermission}</b> – [{rbacDenied.requiredRoles?.join(', ')}]</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link href={`/${companyCode}/navigator`} className={modern ? "h-9 px-4 rounded-full bg-black text-white text-sm font-medium inline-flex items-center hover:bg-zinc-800" : "border-2 border-black px-3 py-1 text-xs bg-black text-white uppercase font-bold"}>Navigator</Link>
              <Link href="/login" className={modern ? "h-9 px-4 rounded-full border border-zinc-200 text-sm bg-white hover:bg-zinc-50 inline-flex items-center" : "border-2 border-black px-3 py-1 text-xs bg-white uppercase"}>Switch User</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderField = (field: FieldDef) => {
    const value = form[field.key] || '';
    const isEmpty = !value;
    const modernBorder = field.required && isEmpty ? 'border-zinc-300 bg-zinc-50' : value ? 'border-zinc-900 bg-white' : 'border-zinc-200 bg-white';
    const classicBorder = field.required && isEmpty ? 'border-black bg-zinc-50' : 'border-black bg-white';

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
          placeholder=""
          required={field.required}
          createUrl={field.createUrl}
          createCode={field.createCode}
          companyCode={field.companyCode}
        />
      );
    }
    if (field.type === 'select' && field.options) {
      return (
        <div key={field.key} className="space-y-1.5">
          <label className={modern ? "text-xs font-medium uppercase tracking-wider text-zinc-600 block" : "text-xs font-mono font-bold uppercase text-black block"}>{field.label}{field.required ? ' *' : ''}</label>
          <select value={value} onChange={e => setForm({ ...form, [field.key]: e.target.value })} className={modern ? `w-full border ${modernBorder} rounded-lg px-3 py-2 text-sm leading-relaxed min-h-[2.5rem] focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white transition-all` : `w-full border-2 ${classicBorder} px-2 py-1.5 text-xs font-mono bg-white text-black rounded-none focus:outline-none min-h-[2.25rem]`}>
            <option value="">{`Select ${field.label}`}</option>
            {field.options.map(o => {
              const val = typeof o === 'string' ? o : o.value;
              const lbl = typeof o === 'string' ? o : o.label;
              return <option key={val} value={val}>{lbl}</option>;
            })}
          </select>
          {field.description && <p className={modern ? "text-xs text-zinc-400 leading-normal" : "text-[0.65rem] font-mono text-black leading-normal"}>{field.description}</p>}
        </div>
      );
    }
    if (field.type === 'textarea') {
      return (
        <div key={field.key} className="space-y-1.5 md:col-span-2">
          <label className={modern ? "text-xs font-medium uppercase tracking-wider text-zinc-600 block" : "text-xs font-mono font-bold uppercase text-black block"}>{field.label}{field.required ? ' *' : ''}</label>
          <textarea value={value} onChange={e => setForm({ ...form, [field.key]: e.target.value })} placeholder="" rows={3} className={modern ? `w-full border ${modernBorder} rounded-lg p-3 text-sm leading-relaxed min-h-[5rem] focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white transition-all placeholder:text-zinc-400 resize-y` : `w-full border-2 ${classicBorder} p-2 text-xs font-mono bg-white text-black rounded-none focus:outline-none resize-y min-h-[4.5rem]`}/>
          {field.description && <p className={modern ? "text-xs text-zinc-400 leading-normal" : "text-[0.65rem] font-mono text-black leading-normal"}>{field.description}</p>}
        </div>
      );
    }
    return (
      <div key={field.key} className="space-y-1.5">
        <label className={modern ? "text-xs font-medium uppercase tracking-wider text-zinc-600 block" : "text-xs font-mono font-bold uppercase text-black block"}>{field.label}{field.required ? ' *' : ''}</label>
        <input value={value} onChange={e => setForm({ ...form, [field.key]: e.target.value })} placeholder="" className={modern ? `w-full border ${modernBorder} rounded-lg px-3 py-2 text-sm leading-relaxed min-h-[2.5rem] focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white transition-all placeholder:text-zinc-400` : `w-full border-2 ${classicBorder} px-2 py-1.5 text-xs font-mono bg-white text-black rounded-none focus:outline-none min-h-[2.25rem]`} />
        {field.description && <p className={modern ? "text-xs text-zinc-400 leading-normal" : "text-[0.65rem] font-mono text-black leading-normal"}>{field.description}</p>}
      </div>
    );
  };

  return (
    <div className={modern ? "min-h-screen bg-[#fafaf9] p-4 sm:p-6" : "min-h-screen bg-white p-3 font-mono text-xs"}>
      <div className={modern ? "max-w-5xl mx-auto space-y-5" : "max-w-4xl mx-auto space-y-4"}>
        {/* Header */}
        <div className={modern ? "bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm" : "border-2 border-black p-3 bg-white"}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={modern ? "text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-black text-white tracking-widest" : "text-xs font-mono border-2 border-black px-2 py-0.5 bg-black text-white font-bold uppercase"}>{code}</span>
              {sapAlias && <span className={modern ? "text-xs font-mono px-2 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-500" : "text-xs font-mono border-2 border-black px-1 bg-white text-black uppercase"}>{sapAlias}</span>}
              <span className={modern ? "text-xs bg-zinc-100 border border-zinc-200 rounded-full px-2.5 py-1 text-zinc-600 font-mono" : "text-xs border-2 border-black px-2 py-0.5 bg-white text-black"}>{items.length} records</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Link href={`/${companyCode}/navigator`} className={modern ? "h-7 px-3 rounded-full border border-zinc-200 text-xs bg-white hover:bg-zinc-50 inline-flex items-center font-medium" : "border-2 border-black px-2 py-1 text-xs bg-white uppercase font-bold"}>Navigator</Link>
              <Link href={`/${companyCode}/foundation/enterprise-structure`} className={modern ? "h-7 px-3 rounded-full border border-zinc-200 text-xs bg-white hover:bg-zinc-50 inline-flex items-center" : "border-2 border-black px-2 py-1 text-xs bg-white uppercase"}>Hub</Link>
            </div>
          </div>
          <h1 className={modern ? "text-lg font-semibold mt-3 tracking-tight leading-snug" : "text-sm font-bold mt-2 uppercase leading-snug"}>{title}</h1>
          <p className={modern ? "text-xs text-zinc-500 mt-1 leading-relaxed" : "text-xs text-black mt-1 leading-relaxed"}>{description} – <b>{companyCode}</b></p>
          {/* Mode switch */}
          <div className={modern ? "flex items-center gap-1 mt-3 bg-zinc-100 rounded-full p-1 w-fit" : "flex items-center gap-0 mt-3 border-2 border-black w-fit"}>
            {['create', 'list', 'change'].map(m => {
              const isActive = mode === m;
              const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
              const finalHref = `${currentPath}?mode=${m}`;
              return (
                <Link key={m} href={finalHref} className={modern ? `px-3 py-1 rounded-full text-xs font-medium transition-colors h-6 inline-flex items-center ${isActive ? 'bg-black text-white' : 'text-zinc-600 hover:bg-white'}` : `px-3 py-1 text-xs font-bold uppercase border-r-2 border-black last:border-r-0 ${isActive ? 'bg-black text-white' : 'bg-white text-black hover:bg-zinc-100'}`}>
                  {m.charAt(0).toUpperCase() + m.slice(1)} {m === 'list' ? `(${items.length})` : ''}
                </Link>
              );
            })}
          </div>
        </div>

        {mode === 'list' ? (
          <div className={modern ? "bg-white rounded-2xl border border-zinc-200 p-5 space-y-3 shadow-sm" : "border-2 border-black p-3 space-y-3 bg-white"}>
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
              <h3 className={modern ? "font-semibold text-sm" : "font-bold text-xs uppercase"}>List – {filteredListItems.length} of {items.length}</h3>
              <div className="relative w-full sm:w-72">
                <div className="relative flex items-center w-full">
                  <input value={listSearch} onChange={e => { setListSearch(e.target.value); setShowListSuggestions(true); }} onFocus={() => setShowListSuggestions(true)} onBlur={() => setTimeout(() => setShowListSuggestions(false), 200)} placeholder={`Search ${code}...`} className={modern ? "w-full border border-zinc-200 rounded-lg pl-3 pr-8 py-2 text-sm leading-relaxed min-h-[2.5rem] focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white" : "w-full border-2 border-black pl-2 pr-7 py-1 text-xs font-mono bg-white text-black rounded-none min-h-[2.25rem] focus:outline-none"} />
                  {listSearch && (
                    <button
                      type="button"
                      onClick={() => setListSearch('')}
                      className="absolute right-2.5 text-zinc-400 hover:text-zinc-700 text-xs font-bold p-1"
                      title="Clear Search"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {showListSuggestions && listSuggestions.length > 0 && (
                  <div className={modern ? "absolute top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-zinc-200 z-10 max-h-48 overflow-auto" : "absolute top-full mt-1 w-full bg-white border-2 border-black z-10 max-h-48 overflow-auto"}>
                    {listSuggestions.map((it: any, i: number) => (
                      <button key={i} onMouseDown={() => { setListSearch(it.code || it.item_number || ''); setShowListSuggestions(false); setExpandedItem(it); }} className={modern ? "w-full text-left px-3 py-2 text-xs hover:bg-zinc-900 hover:text-white flex items-center gap-2" : "w-full text-left px-2 py-1 text-xs font-mono hover:bg-black hover:text-white flex items-center gap-2 border-b border-black last:border-0"}>
                        <span className="font-mono font-bold">{it.code || it.item_number}</span>
                        <span className="truncate">{it.name || it.description || ''}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {loading ? <p className={modern ? "text-sm text-zinc-500" : "text-xs"}>Loading…</p> : (
              <>
                <div className="overflow-auto">
                  <table className={modern ? "w-full text-xs" : "w-full text-xs font-mono border-2 border-black"}>
                    <thead className={modern ? "text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-100" : "text-xs uppercase font-bold border-b-2 border-black bg-white"}>
                      <tr><th className="text-left py-2 font-medium">Code</th><th className="text-left py-2 font-medium">Name</th><th className="text-left py-2 font-medium">Details</th><th className="text-left py-2 font-medium">Action</th></tr>
                    </thead>
                    <tbody>
                      {filteredListItems.map((it: any, i: number) => {
                        const itemKey = it.id || it.account_number || it.code || it.item_number || `row-${i}`;
                        const expandedKey = expandedItem ? (expandedItem.id || expandedItem.account_number || expandedItem.code || expandedItem.item_number) : null;
                        const isExpanded = !!expandedKey && expandedKey === itemKey;
                        return (
                          <React.Fragment key={i}>
                            <tr
                              className={modern ? `border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer ${isExpanded ? 'bg-zinc-50' : ''}` : `border-b border-black hover:bg-zinc-50 cursor-pointer ${isExpanded ? 'bg-zinc-100' : ''}`}
                              onClick={() => setExpandedItem(isExpanded ? null : it)}
                            >
                              <td className="py-2.5 font-mono text-xs font-semibold">{it.code || it.account_number || it.item_number}</td>
                              <td className="py-2.5 text-xs font-medium text-zinc-800">{it.name || it.description || it.legal_name || ''}</td>
                              <td className="py-2.5 text-xs text-zinc-500 truncate max-w-xs">{Object.keys(it).slice(0, 3).map(k => `${k}:${String(it[k]).slice(0, 15)}`).join(' ')}</td>
                              <td className="py-2.5"><span className={modern ? "text-xs text-zinc-900 font-medium hover:underline" : "text-xs font-bold underline uppercase"}>{isExpanded ? 'Hide' : 'View'}</span></td>
                            </tr>
                            {isExpanded && (
                              <tr className={modern ? "bg-zinc-50 border-b border-zinc-200" : "bg-zinc-50 border-b-2 border-black"}>
                                <td colSpan={4} className="p-3">
                                  <div className={modern ? "p-4 bg-white rounded-xl border border-zinc-200 shadow-sm" : "p-2 bg-white border border-black"}>
                                    <div className="flex justify-between items-start mb-2">
                                      <h4 className={modern ? "font-semibold text-sm" : "font-bold text-xs uppercase"}>View Details – {it.code || it.account_number || it.item_number}</h4>
                                      <div className="flex gap-1.5">
                                                                                {resolvedRefConfig && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              applyReference(it);
                                              const currentPath = typeof window !== 'undefined' ? window.location.pathname.replace(/\/(list|change|display)$/, '') : '';
                                              if (typeof window !== 'undefined') {
                                                window.history.pushState({}, '', `${currentPath}?mode=create`);
                                              }
                                              const modeButtons = document.querySelectorAll('a[href*="mode=create"]');
                                              if (modeButtons.length > 0) {
                                                (modeButtons[0] as HTMLElement).click();
                                              }
                                            }}
                                            className={modern ? "h-7 px-3 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs inline-flex items-center font-medium transition" : "border-2 border-black px-2 py-0.5 text-xs bg-blue-100 text-black uppercase font-bold"}
                                            title="Create new record using this master record as template"
                                          >
                                            Copy As
                                          </button>
                                        )}
                                        <Link
                                          href={`${typeof window !== 'undefined' ? (window.location.pathname.replace(/\/(list|change|display)$/, '') + '/change') : ''}?selected=${encodeURIComponent(it.code || it.account_number || it.item_number || '')}`}
                                          onClick={() => setSelectedCode(it.code || it.account_number || it.item_number)}
                                          className={modern ? "h-7 px-3 rounded-full bg-black text-white text-xs inline-flex items-center font-medium hover:bg-zinc-800" : "border-2 border-black px-2 py-0.5 text-xs bg-black text-white uppercase font-bold"}
                                        >
                                          Edit
                                        </Link>
                                        <button
                                          type="button"
                                          disabled={isDeleting}
                                          onClick={(e) => { e.stopPropagation(); handleDelete(it.code || it.account_number || it.item_number, it); }}
                                          className={modern ? "h-7 px-3 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs inline-flex items-center font-medium transition disabled:opacity-50" : "border-2 border-red-600 px-2 py-0.5 text-xs bg-red-600 text-white uppercase font-bold"}
                                        >
                                          Delete
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); setExpandedItem(null); }}
                                          className={modern ? "h-7 px-3 rounded-full border border-zinc-200 text-xs bg-white inline-flex items-center hover:bg-zinc-50" : "border-2 border-black px-2 py-0.5 text-xs bg-white uppercase font-bold"}
                                        >
                                          Close
                                        </button>
                                      </div>
                                    </div>
                                    <div className={modern ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs" : "grid grid-cols-1 md:grid-cols-2 gap-1 text-xs font-mono"}>
                                      {Object.entries(it).filter(([k]) => k !== 'periods').map(([k, v]) => (
                                        <div key={k} className={modern ? "flex gap-2 border-b border-zinc-100 py-1.5" : "flex gap-2 border-b border-black py-1"}>
                                          <span className={modern ? "font-medium text-zinc-500 min-w-24 text-[0.7rem] uppercase tracking-wider" : "font-bold min-w-20 uppercase"}>{k}:</span>
                                          <span className="truncate text-xs font-mono">{String(v ?? '').slice(0, 80)}</span>
                                        </div>
                                      ))}
                                    </div>

                                    {Array.isArray(it.periods) && it.periods.length > 0 && (
                                      <div className="mt-4 pt-3 border-t border-zinc-200">
                                        <div className="flex items-center justify-between mb-2">
                                          <h5 className={modern ? "font-semibold text-xs text-zinc-700 uppercase tracking-wider" : "font-bold text-xs uppercase"}>
                                            Posting Periods & Calendar Month Mappings (OB29 / T009B)
                                          </h5>
                                          <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-mono">
                                            {it.periods.length} Periods ({it.number_of_periods || 12} Normal + {it.number_of_special_periods || 4} Special)
                                          </span>
                                        </div>
                                        <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
                                          <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium uppercase text-[10px] tracking-wider">
                                                <th className="py-2 px-3">Period</th>
                                                <th className="py-2 px-3">Calendar Month</th>
                                                <th className="py-2 px-3">Month Name</th>
                                                <th className="py-2 px-3 text-center">Year Shift</th>
                                                <th className="py-2 px-3">Description</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100 font-mono text-xs">
                                              {it.periods.map((p: any, idx: number) => {
                                                const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                                const mName = p.month_name || monthNames[p.calendar_month] || `Month ${p.calendar_month}`;
                                                return (
                                                  <tr key={idx} className="hover:bg-zinc-50/75 transition">
                                                    <td className="py-1.5 px-3 font-bold text-zinc-800">Period {p.period}</td>
                                                    <td className="py-1.5 px-3 text-zinc-600">{p.calendar_month}</td>
                                                    <td className="py-1.5 px-3 font-sans text-zinc-700 font-medium">{mName}</td>
                                                    <td className="py-1.5 px-3 text-center font-bold">
                                                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${p.year_shift < 0 ? 'bg-amber-100 text-amber-800' : p.year_shift > 0 ? 'bg-blue-100 text-blue-800' : 'bg-zinc-100 text-zinc-600'}`}>
                                                        {p.year_shift > 0 ? `+${p.year_shift}` : p.year_shift}
                                                      </span>
                                                    </td>
                                                    <td className="py-1.5 px-3 font-sans text-zinc-500 text-[11px]">{p.description || `Period ${p.period} (${mName})`}</td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ) : mode === 'change' ? (
          <div className="space-y-4">
            <div className={modern ? "bg-white rounded-2xl border border-zinc-200 p-4 space-y-2 shadow-sm" : "border-2 border-black p-3 space-y-2 bg-white"}>
              <label className={modern ? "text-xs font-medium uppercase tracking-wider text-zinc-600 block" : "text-xs font-bold uppercase block"}>Search {title} to Change</label>
              <div className="relative">
                <div className="relative flex items-center">
                  <input value={changeSearch} onChange={e => { setChangeSearch(e.target.value); setShowChangeSuggestions(true); }} onFocus={() => setShowChangeSuggestions(true)} onBlur={() => setTimeout(() => setShowChangeSuggestions(false), 200)} placeholder={`Search ${code}...`} className={modern ? "w-full border border-zinc-200 rounded-lg pl-3 pr-8 py-2 text-sm leading-relaxed min-h-[2.5rem] focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white" : "w-full border-2 border-black pl-2 pr-7 py-1.5 text-xs font-mono bg-white text-black rounded-none min-h-[2.25rem]"} />
                  {changeSearch && (
                    <button
                      type="button"
                      onClick={() => { setChangeSearch(''); setSelectedCode(''); }}
                      className="absolute right-2.5 text-zinc-400 hover:text-zinc-700 text-xs font-bold p-1"
                      title="Clear Search"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {showChangeSuggestions && filteredChangeItems.length > 0 && (
                  <div className={modern ? "absolute top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-zinc-200 z-10 max-h-60 overflow-auto" : "absolute top-full mt-1 w-full bg-white border-2 border-black z-10 max-h-60 overflow-auto"}>
                    {filteredChangeItems.map((it: any, i: number) => (
                      <button key={i} onMouseDown={() => { setSelectedCode(it.code || it.account_number || it.item_number || ''); setChangeSearch(it.code || it.item_number || ''); setShowChangeSuggestions(false); }} className={modern ? "w-full text-left px-3 py-2 text-xs hover:bg-zinc-900 hover:text-white flex items-center gap-2" : "w-full text-left px-2 py-1 text-xs font-mono hover:bg-black hover:text-white flex items-center gap-2 border-b border-black"}>
                        <span className={modern ? "font-mono font-bold text-xs bg-black text-white rounded px-1.5 py-0.5" : "font-bold border border-black px-1 bg-black text-white"}>{it.code || it.item_number}</span>
                        <span className="truncate flex-1">{it.name || it.description || ''}</span>
                        <span className="text-xs opacity-60">{it.type || it.account_type || ''}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedCode && <div className={modern ? "text-xs text-zinc-500" : "text-xs"}>Selected: <b>{selectedCode}</b> – <button onClick={() => setSelectedCode('')} className={modern ? "text-zinc-900 underline" : "underline font-bold"}>Clear</button></div>}
            </div>
            {selectedCode && (
              <form onSubmit={handleSubmit} className={modern ? "bg-white rounded-2xl border border-zinc-200 p-5 space-y-4 shadow-sm" : "border-2 border-black p-3 space-y-3 bg-white"}>
                <h3 className={modern ? "font-semibold text-sm" : "font-bold text-xs uppercase"}>Change {title} – {selectedCode}</h3>
                {showTabs ? (
                  <>
                    <div className={modern ? "flex gap-1.5 bg-zinc-100 rounded-full p-1 w-fit overflow-x-auto" : "flex gap-0 border-2 border-black w-fit overflow-x-auto"}>
                      {tabs.map(t => {
                        const missing = missingPerTab[t.key]?.length || 0;
                        return (
                          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} className={modern ? `relative px-3.5 py-1 rounded-full text-xs font-medium whitespace-nowrap h-7 inline-flex items-center gap-1.5 transition-colors ${activeTab === t.key ? 'bg-black text-white' : 'text-zinc-600 hover:bg-white'}` : `relative px-3 py-1 text-xs font-bold uppercase whitespace-nowrap border-r-2 border-black last:border-r-0 ${activeTab === t.key ? 'bg-black text-white' : 'bg-white text-black'}`}>
                            {t.label}
                            {missing > 0 && <span className={modern ? "ml-1 inline-flex items-center justify-center min-w-4 h-4 text-[0.65rem] bg-red-500 text-white rounded-full px-1" : "ml-1 inline-flex min-w-3.5 h-3.5 text-[0.65rem] bg-black text-white px-1 border border-white"} title={`${missing} missing`}>{missing}</span>}
                          </button>
                        );
                      })}
                    </div>
                    <p className={modern ? "text-xs text-zinc-400" : "text-xs text-black"}>{tabs.find(t => t.key === activeTab)?.desc} {missingPerTab[activeTab]?.length > 0 && <span className="text-red-500">• Missing: {missingPerTab[activeTab].join(', ')}</span>}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tabs.find(t => t.key === activeTab)?.fields.map(renderField)}
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map(renderField)}
                  </div>
                )}
                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" disabled={!isFormValid} className={modern ? `h-9 px-5 rounded-full text-sm font-medium transition ${isFormValid ? 'bg-black text-white hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'}` : `border-2 border-black px-3 py-1 text-xs font-bold uppercase ${isFormValid ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}>Submit</button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDelete(selectedCode, form)}
                    className={modern ? "h-9 px-4 rounded-full text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition disabled:opacity-50" : "border-2 border-red-600 px-3 py-1 text-xs font-bold uppercase bg-red-600 text-white"}
                  >
                    Delete {code}
                  </button>
                  {!isFormValid && <span className={modern ? "text-xs text-zinc-500" : "text-xs text-black"}>Fill required – red dots show tabs needing attention</span>}
                </div>
                {message && <div className={modern ? "text-xs p-3 rounded-lg border border-zinc-200 bg-zinc-50" : "text-xs border-2 border-black p-2 bg-white"}>{message}</div>}
              </form>
            )}
            {!selectedCode && (
              <div className={modern ? "bg-zinc-50 rounded-2xl border border-zinc-200 p-6 text-center" : "border-2 border-black p-4 text-center bg-white"}>
                <p className={modern ? "text-xs text-zinc-500" : "text-xs"}>Type in search above to find {code} – max 50 suggestions</p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={modern ? "bg-white rounded-2xl border border-zinc-200 p-5 space-y-4 shadow-sm" : "border-2 border-black p-3 space-y-3 bg-white"}>
            <div className="flex items-center justify-between">
              <h3 className={modern ? "font-semibold text-sm" : "font-bold text-xs uppercase"}>Create {title} – {code}</h3>
              <div className="flex items-center gap-2">
                <span className={modern ? "text-xs text-zinc-400 hidden sm:inline" : "text-xs hidden sm:inline"}>* required – submit disabled until valid</span>
                {(code === 'EMTC' || apiEndpoint.includes('materials')) && <span className={modern ? "text-xs bg-zinc-100 border border-zinc-200 rounded-full px-2.5 py-0.5 font-mono" : "text-xs border-2 border-black px-1 bg-white uppercase"}>Auto MAT-01 if blank</span>}
              </div>
            </div>

            {resolvedRefConfig && (
              <div className={modern ? "rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-2.5 text-xs" : "border-2 border-black p-2 bg-blue-50 space-y-2 text-xs"}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                      <span className="text-sm">📋</span> {resolvedRefConfig.label || "Create with Reference / Copy As"}
                    </span>
                    <span className="text-[11px] text-blue-700 hidden sm:inline">
                      Clone attributes from an existing master record
                    </span>
                  </div>
                  {referenceRecord && (
                    <button
                      type="button"
                      onClick={clearReference}
                      className={modern ? "text-xs px-2.5 py-0.5 rounded-full bg-white border border-blue-300 text-blue-800 hover:bg-blue-100 transition font-medium" : "border border-black px-2 py-0.5 text-xs bg-white text-black uppercase font-bold"}
                    >
                      ✕ Clear Reference
                    </button>
                  )}
                </div>

                {referenceRecord ? (
                  <div className={modern ? "flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-blue-200" : "flex items-center justify-between bg-white border border-black p-2"}>
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold bg-blue-600 text-white px-2 py-0.5 rounded text-[11px]">
                        {referenceRecord[resolvedRefConfig.keyField || 'code'] || referenceRecord.code || referenceRecord.account_number || referenceRecord.item_number}
                      </span>
                      <span className="font-medium truncate text-zinc-800">
                        {referenceRecord[resolvedRefConfig.displayField || 'name'] || referenceRecord.name || referenceRecord.description || referenceRecord.display_name}
                      </span>
                      <span className="text-[11px] text-zinc-500 hidden md:inline">
                        — attributes copied into form below. Specify unique identifier to save.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={referenceQuery}
                          onChange={(e) => {
                            setReferenceQuery(e.target.value);
                            setShowRefSuggestions(true);
                          }}
                          onFocus={() => setShowRefSuggestions(true)}
                          placeholder={`Select template record to copy from (${items.length} available)... `}
                          className={modern ? "w-full border border-blue-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" : "w-full border-2 border-black px-2 py-1 text-xs font-mono bg-white"}
                        />
                        {referenceQuery && (
                          <button
                            type="button"
                            onClick={() => { setReferenceQuery(''); }}
                            className="absolute right-2 top-1.5 text-zinc-400 hover:text-zinc-600 text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {items.length > 0 && (
                        <span className="text-[11px] text-blue-800 font-medium whitespace-nowrap hidden sm:inline">
                          {items.length} records in catalog
                        </span>
                      )}
                    </div>

                    {showRefSuggestions && (
                      <div className={modern ? "absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-blue-200 z-20 max-h-56 overflow-auto divide-y divide-zinc-100" : "absolute top-full left-0 right-0 mt-1 bg-white border-2 border-black z-20 max-h-52 overflow-auto"}>
                        {items
                          .filter((it: any) => {
                            if (!referenceQuery) return true;
                            const q = referenceQuery.toLowerCase();
                            const codeVal = String(it[resolvedRefConfig.keyField || 'code'] || it.code || it.account_number || it.item_number || '').toLowerCase();
                            const nameVal = String(it[resolvedRefConfig.displayField || 'name'] || it.name || it.description || it.display_name || '').toLowerCase();
                            return codeVal.includes(q) || nameVal.includes(q);
                          })
                          .slice(0, 15)
                          .map((it: any, i: number) => {
                            const recKey = it[resolvedRefConfig.keyField || 'code'] || it.code || it.account_number || it.item_number;
                            const recName = it[resolvedRefConfig.displayField || 'name'] || it.name || it.description || it.display_name || '';
                            return (
                              <button
                                key={i}
                                type="button"
                                onMouseDown={() => {
                                  applyReference(it);
                                  setShowRefSuggestions(false);
                                }}
                                className={modern ? "w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center justify-between gap-2 transition" : "w-full text-left px-2 py-1 text-xs font-mono hover:bg-black hover:text-white flex items-center justify-between gap-2 border-b border-black last:border-0"}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="font-mono font-bold bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded text-[11px]">{recKey}</span>
                                  <span className="truncate text-zinc-900">{recName}</span>
                                </div>
                                <span className="text-[10px] text-blue-600 font-medium shrink-0 uppercase tracking-wider">Select & Copy →</span>
                              </button>
                            );
                          })}
                        {items.length === 0 && (
                          <div className="p-3 text-center text-zinc-400 text-xs">No records available to reference yet.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {showTabs ? (
              <>
                <div className={modern ? "flex gap-1.5 bg-zinc-100 rounded-full p-1 w-fit overflow-x-auto" : "flex gap-0 border-2 border-black w-fit overflow-x-auto"}>
                  {tabs.map(t => {
                    const missing = missingPerTab[t.key]?.length || 0;
                    return (
                      <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} className={modern ? `relative px-3.5 py-1 rounded-full text-xs font-medium whitespace-nowrap h-7 inline-flex items-center gap-1.5 transition-colors ${activeTab === t.key ? 'bg-black text-white' : 'text-zinc-600 hover:bg-white'}` : `relative px-3 py-1 text-xs font-bold uppercase whitespace-nowrap border-r-2 border-black last:border-r-0 ${activeTab === t.key ? 'bg-black text-white' : 'bg-white text-black'}`}>
                        {t.label}
                        {missing > 0 && <span className={modern ? "ml-1 inline-flex items-center justify-center min-w-4 h-4 text-[0.65rem] bg-red-500 text-white rounded-full px-1" : "ml-1 inline-flex min-w-3.5 h-3.5 text-[0.65rem] bg-black text-white px-1 border border-white"} title={`${missing} missing`}>{missing}</span>}
                      </button>
                    );
                  })}
                </div>
                <p className={modern ? "text-xs text-zinc-400" : "text-xs text-black"}>{tabs.find(t => t.key === activeTab)?.desc} {missingPerTab[activeTab]?.length > 0 && <span className="text-red-500">• Missing: {missingPerTab[activeTab].join(', ')}</span>}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tabs.find(t => t.key === activeTab)?.fields.map(renderField)}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(renderField)}
              </div>
            )}
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={!isFormValid} className={modern ? `h-9 px-5 rounded-full text-sm font-medium shadow-sm transition ${isFormValid ? 'bg-black text-white hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'}` : `border-2 border-black px-4 py-1.5 text-xs font-bold uppercase ${isFormValid ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}>Submit</button>
              {!isFormValid && <span className={modern ? "text-xs text-zinc-500" : "text-xs text-black"}>Red dots show tabs needing attention</span>}
            </div>
            {message && <div className={modern ? "text-xs p-3 rounded-lg border border-zinc-200 bg-zinc-50 mt-2" : "text-xs border-2 border-black p-2 bg-white"}>{message}</div>}
          </form>
        )}

        <div className={modern ? "bg-zinc-50 rounded-2xl border border-zinc-200 p-4" : "border-2 border-black p-2.5 bg-white"}>
          <h4 className={modern ? "text-xs uppercase tracking-wider text-zinc-500 font-medium mb-2.5" : "text-xs uppercase font-bold mb-1"}>Related Masters</h4>
          <div className="flex flex-wrap gap-2">
            {relatedLinks.map((link, i) => (
              <Link key={i} href={`/${companyCode}${link.route}`} className={modern ? "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-zinc-200 text-xs hover:border-zinc-300 h-7" : "inline-flex items-center gap-1 border-2 border-black px-2 py-1 text-xs bg-white uppercase font-bold"}>
                <span className={modern ? "font-mono font-bold text-[0.65rem] px-1.5 py-0.5 rounded bg-black text-white" : "font-bold text-[0.65rem] px-1 bg-black text-white"}>{link.code}</span>
                <span>{link.label}</span>
                <span className={modern ? "text-zinc-400" : "text-black"}>→</span>
              </Link>
            ))}
          </div>
        </div>

        <div className={modern ? "bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm" : "border-2 border-black p-2.5 bg-white"}>
          <h4 className={modern ? "font-medium text-xs mb-2.5 uppercase tracking-wider text-zinc-600" : "font-bold text-xs uppercase mb-1"}>Existing – {items.length}</h4>
          {loading ? <p className={modern ? "text-xs text-zinc-500" : "text-xs"}>Loading…</p> : (
            <div className="overflow-auto max-h-44">
              <table className={modern ? "w-full text-xs" : "w-full text-xs font-mono border-2 border-black"}>
                <thead className={modern ? "text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-100" : "text-xs uppercase font-bold border-b-2 border-black"}><tr><th className="text-left py-1.5 font-medium">Code</th><th className="text-left py-1.5 font-medium">Name</th></tr></thead>
                <tbody>
                  {items.slice(0, 10).map((it: any, i: number) => <tr key={i} className={modern ? "border-b border-zinc-50" : "border-b border-black"}><td className="py-2 font-mono text-xs">{it.code || it.account_number || it.item_number}</td><td className="py-2 text-xs">{it.name || it.description || ''}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <IndustryDeletionGuardModal
        isOpen={!!deletionDiagnostic}
        onClose={() => setDeletionDiagnostic(null)}
        diagnostic={deletionDiagnostic}
        onDeactivateSuccess={() => {
          fetchItems();
          setMessage(`✅ Deactivation/block successfully applied.`);
        }}
      />
    </div>
  );
}

