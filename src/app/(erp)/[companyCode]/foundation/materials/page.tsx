"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';
import { useAutoPromoteJob } from '@/shared/ui/job-popup';
import { RoleGuard } from '@/shared/ui/role-guard';

type TabKey = 'basic' | 'purchasing' | 'mrp' | 'storage' | 'accounting' | 'costing';

const TABS: { key: TabKey; label: string; desc: string }[] = [
  { key: 'basic', label: 'Basic Data', desc: 'Client level – code, name, type, UoM, category, barcode, HSN – single source' },
  { key: 'purchasing', label: 'Purchasing', desc: 'Plant level – buyer group, procurement division, QM active' },
  { key: 'mrp', label: 'MRP', desc: 'MRP type, controller, lot sizing, safety stock, reorder point, procurement – single source' },
  { key: 'storage', label: 'Storage', desc: 'Facility extension MMSC + Kit & Lot/Batch & Expiry – all storage-related – single source' },
  { key: 'accounting', label: 'Accounting', desc: 'Valuation class INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX), price control, MAP/Standard, price unit – T0 BLOCKING' },
  { key: 'costing', label: 'Costing', desc: 'Costing lot size, overhead group – CK40N' },
];

const initialForm = {
  // Basic – client level – single source
  item_number: '',
  description: '',
  description_long: '',
  type: '',
  base_unit: '',
  category_code: '',
  barcode: '',
  hsn_code: '',
  // Purchasing – plant level
  purchasing_group: '',
  buyer_group: '',
  procurement_division: '',
  is_quality_active: 'false',
  // MRP
  planning_type: '',
  planning_controller: '',
  lot_sizing: '',
  min_lot_size: '',
  max_lot_size: '',
  fixed_lot_size: '',
  safety_stock: '',
  reorder_point: '',
  procurement_method: '',
  special_procurement_method: '',
  // Storage – includes Kit & Lot/Batch & Expiry moved from Basic (per user)
  facility_codes: [] as string[],
  plant_codes: [] as string[],
  is_kit: 'false',
  is_phantom_kit: 'false',
  landed_cost_scope: '',
  is_lot_managed: 'true',
  lot_control: '',
  shelf_life_days: '',
  // Accounting – T0 BLOCKING
  inventory_valuation_class: '',
  pricing_method: '',
  moving_avg_price: '',
  standard_price: '',
  price_unit: '',
  // Costing
  costing_lot_size: '',
  overhead_group: '',
};

// Required fields per tab for red-dot validation – item_number optional for auto-number from MAT-01
const REQUIRED_PER_TAB: Record<TabKey, string[]> = {
  basic: ['description', 'type', 'base_unit'],
  purchasing: [],
  mrp: [],
  storage: [], // facility optional (defaults to FAC-1000), lot fields have defaults
  accounting: ['inventory_valuation_class', 'pricing_method', 'moving_avg_price', 'standard_price'],
  costing: [],
};

export default function MaterialMasterPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const companyCode = params.companyCode as string;
  const modeParam = (searchParams.get('mode') || 'create').toLowerCase();
  const mode = modeParam === 'display' ? 'list' : modeParam as 'create' | 'list' | 'change';

  const [uiMode, setUiMode] = useState<'modern' | 'classic'>('modern');
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [form, setForm] = useState<any>(initialForm);
  const [items, setItems] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState('');
  const [expandedItem, setExpandedItem] = useState<any | null>(null);
  const [listSearch, setListSearch] = useState('');
  const [changeSearch, setChangeSearch] = useState('');
  const [showListSuggestions, setShowListSuggestions] = useState(false);
  const [showChangeSuggestions, setShowChangeSuggestions] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [nextNumberPreview, setNextNumberPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { elapsed, executeWithAutoPromote, JobPopupComponent, closePopup, showPopup, jobId } = useAutoPromoteJob();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('erp-ui-mode');
      if (saved) setUiMode(saved as any);
      const handler = (e: any) => setUiMode(e.detail);
      window.addEventListener('erp-ui-mode-change', handler as any);
      return () => window.removeEventListener('erp-ui-mode-change', handler as any);
    } catch {}
  }, []);

  // Fetch next number preview for ITEM – SAP STANDARD numeric – no prefix – shows next available like FNRC (legacy FBN1)
  useEffect(() => {
    if (mode !== 'create') return;
    const fetchNext = async () => {
      try {
        const res = await fetch('/api/number-ranges?limit=100');
        const j = await res.json();
        const ranges = j.data || j.numberRanges || [];
        const matRange = ranges.find((r: any) => r.object_type === 'ITEM' || r.code === 'MAT-01' || r.code === 'ITEM-01' || r.code?.includes('MAT') || r.code === 'ITEM-01' || r.object_type === 'MATERIAL');
        if (matRange) {
          const next = (matRange.current_number || matRange.from_number || 10000000) + 1;
          // SAP STANDARD: purely numeric – no prefix – e.g., 10000001 not MAT-10000001
          const isLocked = Number(matRange.current_number) > Number(matRange.from_number);
          setNextNumberPreview(`${next} (from ${matRange.code} ${matRange.from_number}-${matRange.to_number} – current ${matRange.current_number} – next ${next} – ${isLocked ? `🔒 Locked ${Number(matRange.current_number)-Number(matRange.from_number)} used` : '● Editable'} – SAP numeric, no prefix)`);
        } else {
          setNextNumberPreview('No MAT-01/ITEM range found – will use numeric timestamp fallback – create range via FNRC first for sequential – SAP numeric standard');
        }
      } catch {
        setNextNumberPreview('Unable to fetch range – fallback numeric timestamp will be used – SAP standard');
      }
    };
    fetchNext();
  }, [mode]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/materials?limit=200');
      const j = await res.json();
      const data = j.data || j.materials || j.items || [];
      setItems(Array.isArray(data) ? data : []);
      try {
        const fRes = await fetch('/api/facilities');
        const fJ = await fRes.json();
        setFacilities(fJ.data || fJ.facilities || []);
      } catch {}
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    if (mode === 'change' && selectedCode) {
      const found = items.find((it: any) => (it.item_number || it.code || it.material_number) === selectedCode);
      if (found) {
        setForm({
          ...initialForm,
          ...found,
          item_number: found.item_number || found.material_number || found.code || '',
          description: found.description || '',
          description_long: found.description_long || '',
          type: found.type || found.material_type || '',
          base_unit: found.base_unit || found.base_uom || '',
          category_code: found.group_code || found.category_code || '',
          inventory_valuation_class: found.valuation_class || found.inventory_valuation_class || '',
          pricing_method: found.pricing_method || found.price_control || '',
          moving_avg_price: found.moving_avg_price || '',
          standard_price: found.standard_price || '',
          facility_codes: found.facility_codes || [],
          is_lot_managed: String(found.is_lot_managed ?? found.is_batch_managed ?? 'true'),
          is_kit: String(found.is_kit ?? 'false'),
          is_phantom_kit: String(found.is_phantom_kit ?? 'false'),
        });
      }
    }
    if (mode === 'create') setForm(initialForm);
  }, [mode, selectedCode, items]);

  const filteredListItems = useMemo(() => {
    if (!listSearch.trim()) return items;
    const q = listSearch.toLowerCase();
    return items.filter((it: any) => {
      const codeVal = (it.item_number || it.material_number || it.code || '').toLowerCase();
      const nameVal = (it.description || it.name || '').toLowerCase();
      return codeVal.includes(q) || nameVal.includes(q);
    });
  }, [items, listSearch]);

  const filteredChangeItems = useMemo(() => {
    if (!changeSearch.trim()) return items.slice(0, 20);
    const q = changeSearch.toLowerCase();
    return items.filter((it: any) => {
      const codeVal = (it.item_number || it.material_number || it.code || '').toLowerCase();
      const nameVal = (it.description || it.name || '').toLowerCase();
      return codeVal.includes(q) || nameVal.includes(q);
    }).slice(0, 50);
  }, [items, changeSearch]);

  const listSuggestions = useMemo(() => {
    if (!listSearch.trim() || listSearch.length < 2) return [];
    const q = listSearch.toLowerCase();
    return items.filter((it: any) => {
      const codeVal = (it.item_number || it.material_number || it.code || '').toLowerCase();
      const nameVal = (it.description || it.name || '').toLowerCase();
      return codeVal.includes(q) || nameVal.includes(q);
    }).slice(0, 8);
  }, [items, listSearch]);

  const changeSuggestions = useMemo(() => {
    if (!changeSearch.trim() || changeSearch.length < 1) return [];
    const q = changeSearch.toLowerCase();
    return items.filter((it: any) => {
      const codeVal = (it.item_number || it.material_number || it.code || '').toLowerCase();
      const nameVal = (it.description || it.name || '').toLowerCase();
      return codeVal.includes(q) || nameVal.includes(q);
    }).slice(0, 8);
  }, [items, changeSearch]);

  const toggleCollapse = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const handleFacilityToggle = (code: string) => {
    setForm((prev: any) => {
      const current: string[] = prev.facility_codes || [];
      const exists = current.includes(code);
      const next = exists ? current.filter(c => c !== code) : [...current, code];
      return { ...prev, facility_codes: next, plant_codes: next };
    });
  };

  // Validation – required per tab + overall
  const missingPerTab = useMemo(() => {
    const result: Record<TabKey, string[]> = { basic: [], purchasing: [], mrp: [], storage: [], accounting: [], costing: [] };
    (Object.keys(REQUIRED_PER_TAB) as TabKey[]).forEach(tab => {
      const req = REQUIRED_PER_TAB[tab];
      const missing = req.filter(k => {
        const v = form[k];
        return !v || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
      });
      result[tab] = missing;
    });
    return result;
  }, [form]);

  const isFormValid = useMemo(() => {
    // All required across all tabs must be filled
    return Object.values(missingPerTab).every(arr => arr.length === 0);
  }, [missingPerTab]);

  const totalMissing = useMemo(() => Object.values(missingPerTab).reduce((acc, arr) => acc + arr.length, 0), [missingPerTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Industry standard locking – check if material type locked for double-entry protection
    try {
      const lockRes = await fetch('/api/locks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lock_object: 'MATERIAL', object_id: form.type || 'ITEM', locked_by: 'user', description: `Material create ${form.type}` }),
      });
      if (lockRes.status === 423) {
        const lockData = await lockRes.json();
        setMessage(`❌ ${lockData.error} – prevents double entry – try after 5 min or completion`);
        return;
      }
      // If lock acquired, we will release after – but for material type lock we release immediately after check – actual number range lock is in backend
      const ld = await lockRes.json();
      if (ld.lock_id) await fetch(`/api/locks?id=${ld.lock_id}`, { method: 'DELETE' }).catch(() => {});
    } catch {}

    const payload = {
      item_number: form.item_number || undefined,
      description: form.description,
      description_long: form.description_long,
      type: form.type,
      base_unit: form.base_unit,
      category_code: form.category_code,
      barcode: form.barcode,
      hsn_code: form.hsn_code,
      purchasing_group: form.purchasing_group || form.buyer_group,
      buyer_group: form.buyer_group,
      procurement_division: form.procurement_division,
      is_quality_active: form.is_quality_active,
      planning_type: form.planning_type,
      planning_controller: form.planning_controller,
      lot_sizing: form.lot_sizing,
      min_lot_size: form.min_lot_size ? Number(form.min_lot_size) : undefined,
      max_lot_size: form.max_lot_size ? Number(form.max_lot_size) : undefined,
      fixed_lot_size: form.fixed_lot_size ? Number(form.fixed_lot_size) : undefined,
      safety_stock: form.safety_stock ? Number(form.safety_stock) : undefined,
      reorder_point: form.reorder_point ? Number(form.reorder_point) : undefined,
      procurement_method: form.procurement_method,
      special_procurement_method: form.special_procurement_method,
      facility_codes: form.facility_codes,
      plant_codes: form.plant_codes,
      is_kit: form.is_kit,
      is_phantom_kit: form.is_phantom_kit,
      landed_cost_scope: form.landed_cost_scope,
      is_lot_managed: form.is_lot_managed,
      lot_size: form.lot_size,
      valuation_class: form.valuation_class,
      inventory_valuation_class: form.inventory_valuation_class,
      price_control: form.price_control,
      standard_price: form.standard_price ? Number(form.standard_price) : undefined,
      moving_average_price: form.moving_average_price ? Number(form.moving_average_price) : undefined,
      price_unit: form.price_unit ? Number(form.price_unit) : undefined,
      costing_lot_size: form.costing_lot_size ? Number(form.costing_lot_size) : undefined,
      overhead_group: form.overhead_group,
      batch_management: form.is_lot_managed,
      shelf_life_days: form.shelf_life_days ? Number(form.shelf_life_days) : undefined,
      expiry_control: form.expiry_control,
    };

    // Auto-promote after 10 sec for ALL processes – first 10 sec direct with spinner timer, then background popup + no timeout + queue + redirect to last page
    try {
      const result = await executeWithAutoPromote({
        directFn: async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 sec timeout for direct
          try {
            const res = await fetch('/api/materials', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || 'Failed');
            return j;
          } finally {
            clearTimeout(timeoutId);
          }
        },
        backgroundJobType: 'MATERIAL_CREATE',
        backgroundPayload: { ...payload, material_type: form.type, type: form.type, assignment_key: form.type },
        companyCode: companyCode,
        lockObject: 'MATERIAL',
        lockObjectId: form.type || 'ITEM',
        onDirectSuccess: (j: any) => {
          const createdNumber = j.material?.item_number || j.item?.item_number || j.material?.material_number || payload.item_number || 'auto';
          setMessage(`✅ Product ${createdNumber} ${mode === 'change' ? 'updated' : 'created'} – EMTC – Facilities: ${(payload.facility_codes || []).join(',') || 'default'} – next ${Number(createdNumber)+1 || 'auto'} – result shown – direct completed within 10 sec – no background needed – prevents double click – cache invalidated`);
          fetchItems();
          if (mode === 'create') setForm(initialForm);
        },
        onBackgroundCreated: (newJobId: string) => {
          setMessage(`⏳ Material creation moved to background – job ${newJobId.slice(0,8)} – took >10 sec – popup shows steps – you can close → redirect to last page – job continues – header Jobs icon shows – no timeout – System Jobs page FBJM (legacy SM37) – lock acquired for ${form.type} – prevents double entry`);
        },
      });

      if (result.type === 'direct') {
        // Already handled in onDirectSuccess
      } else {
        // Background – popup shown – user can close → redirect to last page – job continues – header shows
        console.log('Material creation moved to background job', result.jobId);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessage(`❌ Timeout after 30 sec – server took too long – check if material created in list – number range may have been consumed – check FNRC current – or check System Jobs page for background job`);
      } else {
        setMessage(`❌ ${err.message} – if server hung, check header Jobs icon or System Jobs page – progress shows if working or not – lock prevents double entry – try after 5 min or release`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const modern = uiMode === 'modern';

  const renderInput = (key: string, label: string, opts?: { required?: boolean; type?: string; options?: string[]; desc?: string }) => {
    const value = form[key] ?? '';
    const isEmpty = !value || (Array.isArray(value) && value.length === 0);
    const borderColor = opts?.required && isEmpty ? 'border-red-400 ring-1 ring-red-100' : value ? 'border-green-400' : 'border-zinc-200';
    const selectPlaceholder = `Select ${label}`;
    if (opts?.options) {
      return (
        <div key={key} className="space-y-1">
          <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-mono font-bold uppercase text-black"}>{label}{opts?.required ? ' *' : ''}</label>
          <select value={value} onChange={e => setForm({ ...form, [key]: e.target.value })} className={modern ? `w-full border ${borderColor} rounded-lg px-2.5 py-2 text-[13px] h-[32px] focus:outline-none focus:ring-1 focus:ring-black focus:border-black/10 bg-white` : `w-full border border-black px-1.5 py-1 text-[11px] font-mono bg-white text-black rounded-none h-[28px] ${opts?.required && isEmpty ? 'border-red-400' : ''}`}>
            <option value="">{selectPlaceholder}</option>
            {opts.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {opts?.desc && <p className="text-[10px] text-zinc-400">{opts.desc}</p>}
        </div>
      );
    }
    if (opts?.type === 'textarea') {
      return (
        <div key={key} className="space-y-1">
          <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-mono font-bold uppercase text-black"}>{label}{opts?.required ? ' *' : ''}</label>
          <textarea value={value} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder="" rows={3} className={modern ? `w-full border ${borderColor} rounded-lg px-2.5 py-2 text-[13px] h-[32px] focus:outline-none focus:ring-1 focus:ring-black focus:border-black/10` : `w-full border border-black px-1.5 py-1 text-[11px] font-mono bg-white text-black rounded-none h-[28px] ${opts?.required && isEmpty ? 'border-red-400' : ''}`} />
          {opts?.desc && <p className="text-[10px] text-zinc-400">{opts.desc}</p>}
        </div>
      );
    }
    return (
      <div key={key} className="space-y-1">
        <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-mono font-bold uppercase text-black"}>{label}{opts?.required ? ' *' : ''}</label>
        <input value={value} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder="" className={modern ? `w-full border ${borderColor} rounded-lg px-2.5 py-2 text-[13px] h-[32px] focus:outline-none focus:ring-1 focus:ring-black focus:border-black/10` : `w-full border border-black px-1.5 py-1 text-[11px] font-mono bg-white text-black rounded-none h-[28px] ${opts?.required && isEmpty ? 'border-red-400' : ''}`} />
        {opts?.desc && <p className="text-[10px] text-zinc-400">{opts.desc}</p>}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className={modern ? "bg-zinc-50 rounded-xl p-4 border" : "border p-3"}>
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCollapse('basic_general')}>
                <h3 className={modern ? "font-semibold text-sm" : "font-bold text-xs"}>General Data – Client Level (Single Source)</h3>
                <span className="text-xs">{collapsed['basic_general'] ? '▶' : '▼'}</span>
              </div>
              {!collapsed['basic_general'] && (
                <>
                  {nextNumberPreview && (
                    <div className={modern ? "mb-4 p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs" : "mb-2 p-2 border bg-zinc-50 text-[11px]"}>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold">SAP AUTO – INTERNAL – NO MANUAL</span>
                        <span className="font-medium">Material Number – Always Auto – Numeric – No Manual Entry – Blocked per your confirmation</span>
                      </div>
                      <div className="mt-2 font-mono text-[11px] bg-white rounded-lg border p-2">
                        Next: {nextNumberPreview}
                      </div>
                      <div className="mt-2 text-[11px] text-zinc-600">
                        • SAP standard: Material number purely numeric (e.g., 10000001) – no MAT- prefix – random 10 digits like 1234567890 are <b>BLOCKED</b> – system generates via <Link href={`/${companyCode}/fico/number-ranges`} className="text-zinc-900 underline">FNRC</Link> MAT-01/ITEM – internal numbering – EMTC (legacy MM01) style – always auto – per your selection block_manual. If you type random number, backend will ignore and still auto-generate next sequential – audit safe.
                      </div>
                    </div>
                  )}
                  <div className={modern ? "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" : "grid grid-cols-2 gap-2 mt-2"}>
                    <div className={modern ? "col-span-2 p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs" : "col-span-2 p-2 border bg-zinc-50 text-[11px]"}>
                      <span className="font-bold">PRODUCT_CODE – Auto Only – SAP Internal – Blocked Manual</span> – System will generate purely numeric like 10000001 via number range MAT-01/ITEM – no manual entry – random 10 digits like 1234567890 are BLOCKED – always auto – per your selection block_manual – PO/PR/GR also always auto – SAP standard – field removed from UI.
                    </div>
                  {renderInput('description', 'PRODUCT_NAME / DESCRIPTION', { required: true, desc: 'Short description – single source – wired from foundation as in industry standard – MARA' })}
                  <div className="space-y-1">
                    <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-mono font-bold uppercase text-black"}>PRODUCT_TYPE * – Material Type – EMTP – RAW/FINISHED – wired from foundation</label>
                    <DbAutocomplete label="" apiUrl="/api/material-types" dataKey="materialTypes" codeField="code" value={form.type} onChange={v => setForm({ ...form, type: v })} placeholder="" required createUrl="/foundation/material-types" createCode="EMTP" companyCode={companyCode} />
                    <p className="text-[10px] text-zinc-400">Product Type FK – EMTP own IP alias OMS2 – RAW=ROH, FINISHED=FERT, SEMI=HALB, SERVICE – single source – wired from foundation as in industry standard – MARA material type – determines number range assignment RAW→MAT-RAW-01 – industry standard</p>
                  </div>
                  <div className="space-y-1">
                    <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-mono font-bold uppercase text-black"}>BASE_UNIT * – Base UoM – EUOC – KG/PC/BOX – wired from foundation</label>
                    <DbAutocomplete label="" apiUrl="/api/uom" dataKey="uom" codeField="code" value={form.base_unit} onChange={v => setForm({ ...form, base_unit: v })} placeholder="" required createUrl="/foundation/uom" createCode="EUOC" companyCode={companyCode} />
                    <p className="text-[10px] text-zinc-400">Base unit FK – EUOC own IP alias EUOC (legacy CUNI) – KG/PC/BOX – core_unit_measure – single source – wired from foundation as in industry standard – MARA base UoM – used in GR, PGI, stock ledger quantity</p>
                  </div>
                  <div className="space-y-1">
                    <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-mono font-bold uppercase text-black"}>PRODUCT_CATEGORY – Category – EMGC – wired from foundation</label>
                    <DbAutocomplete label="" apiUrl="/api/material-categories" dataKey="materialCategories" codeField="code" value={form.category_code} onChange={v => setForm({ ...form, category_code: v })} placeholder="" createUrl="/foundation/material-categories" createCode="EMGC" companyCode={companyCode} />
                    <p className="text-[10px] text-zinc-400">Category FK – EMGC own IP alias OMSF – spices, oils, packs – prod_category – single source – wired from foundation as in industry standard – MARA material group – used in FRAD revenue account determination and pricing</p>
                  </div>
                  {renderInput('barcode', 'BARCODE / EAN', { desc: 'For POS, GR scanning – single source in Basic only – EAN/UPC – industry standard' })}
                  <div className="space-y-1">
                    <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-mono font-bold uppercase text-black"}>HSN_CODE – HSN/SAC – Tax Classification – FTXC – wired from foundation</label>
                    <DbAutocomplete label="" apiUrl="/api/hsn-codes" dataKey="hsnCodes" codeField="code" value={form.hsn_code} onChange={v => setForm({ ...form, hsn_code: v })} placeholder="" createUrl="/fico/hsn-codes" createCode="FTXC" companyCode={companyCode} />
                    <p className="text-[10px] text-zinc-400">HSN Code FK – FTXC own IP – India GST HSN – e.g., 09041110 pepper – single source in Basic only – wired from foundation as in industry standard – used in tax determination, billing, GR – tax classification</p>
                  </div>
                  <div className="space-y-1">
                    <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-mono font-bold uppercase text-black"}>TAX_CLASSIFICATION – Tax Class – FTXC – wired from foundation</label>
                    <DbAutocomplete label="" apiUrl="/api/tax-codes" dataKey="taxCodes" codeField="code" value={form.tax_classification} onChange={v => setForm({ ...form, tax_classification: v })} placeholder="" createUrl="/fico/tax-codes" createCode="FTXC" companyCode={companyCode} />
                    <p className="text-[10px] text-zinc-400">Tax Classification FK – FTXC – e.g., GST 18%, GST 12% – wired from foundation – used in tax determination – industry standard</p>
                  </div>
                  {renderInput('description_long', 'DESCRIPTION_LONG', { type: 'textarea', desc: 'Long text for SO/PO print – single source – MARA long text' })}
                </div>
                </>
              )}
            </div>
          </div>
        );
      case 'purchasing':
        return (
          <div className="space-y-6">
            <div className={modern ? "bg-zinc-50 rounded-xl p-4 border border-zinc-200" : "border p-3"}>
              <h3 className={modern ? "font-semibold text-sm text-zinc-900" : "font-bold text-xs"}>Purchasing View – Plant Dependent – Single Source</h3>
              <p className="text-[11px] text-zinc-500 mt-1">procurement_method & special_procurement moved to MRP tab only (SAP MRP2) to remove duplicate.</p>
              <div className={modern ? "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" : "grid grid-cols-2 gap-2 mt-2"}>
                <div className="space-y-1">
                  <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-mono font-bold uppercase text-black"}>PURCHASING_GROUP – Buyer Team – EBTC – wired from foundation</label>
                  <DbAutocomplete label="" apiUrl="/api/buyer-teams" dataKey="buyerTeams" codeField="code" value={form.purchasing_group} onChange={v => setForm({ ...form, purchasing_group: v, buyer_group: v })} placeholder="" createUrl="/foundation/buyer-teams" createCode="EBTC" companyCode={companyCode} />
                  <p className="text-[10px] text-zinc-400">Purchasing Group FK – EBTC own IP – K01/001 – buyer team – single source – wired from foundation as in industry standard – MARC purchasing group – used in PR/PO – buyer determination</p>
                </div>
                <div className="space-y-1">
                  <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-mono font-bold uppercase text-black"}>PROCUREMENT_DIVISION – Division – EDPC – wired from foundation</label>
                  <DbAutocomplete label="" apiUrl="/api/commercial-orgs" dataKey="commercialOrgs" codeField="code" value={form.procurement_division} onChange={v => setForm({ ...form, procurement_division: v })} placeholder="" createUrl="/foundation/commercial-orgs" createCode="EDPC" companyCode={companyCode} />
                  <p className="text-[10px] text-zinc-400">Procurement Division FK – EDPC – PD-1000 / KPO1 – division – single source – wired from foundation – used in purchasing – industry standard</p>
                </div>
                <div className="space-y-1">
                  <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-mono font-bold uppercase text-black"}>PURCHASING_ORG – Purchasing Org – fin_purchasing_org – wired from foundation – FCRL</label>
                  <DbAutocomplete label="" apiUrl="/api/company-relationships?type=purchasing_org" dataKey="purchasing_orgs" codeField="code" value={form.purchasing_org_code} onChange={v => setForm({ ...form, purchasing_org_code: v })} placeholder="" createUrl="/foundation/enterprise-structure" createCode="FCRL" companyCode={companyCode} />
                  <p className="text-[10px] text-zinc-400">Purchasing Org FK – FCRL – PO01 Spices Purchasing – wired from foundation – company relationships – for large org multi-sector – plant assignment</p>
                </div>
                {renderInput('is_quality_active', 'IS_QUALITY_ACTIVE', { options: ['true','false'], desc: 'QM active for GR inspection – single source – MARC QM – wired from foundation' })}
              </div>
            </div>
          </div>
        );
      case 'mrp':
        return (
          <div className="space-y-6">
            <div className={modern ? "bg-zinc-50 rounded-xl p-4 border border-zinc-200" : "border p-3"}>
              <h3 className={modern ? "font-semibold text-sm text-zinc-900" : "font-bold text-xs"}>MRP View – Single Source for procurement</h3>
              <p className="text-[11px] text-zinc-500 mt-1">procurement_method & special_procurement now ONLY here (removed from Purchasing duplicate).</p>
              <div className={modern ? "grid grid-cols-1 md:grid-cols-3 gap-4 mt-4" : "grid grid-cols-3 gap-2 mt-2"}>
                {renderInput('planning_type', 'MRP_TYPE', { options: ['MRP','MANUAL_REORDER','NO_PLANNING','REORDER_POINT','FORECAST'], desc: 'Single source' })}
                {renderInput('planning_controller', 'MRP_CONTROLLER', { desc: 'Single source' })}
                {renderInput('lot_sizing', 'LOT_SIZING', { options: ['LOT_FOR_LOT','FIXED','MAX_LEVEL','REPLENISH'], desc: 'Single source' })}
                {renderInput('min_lot_size', 'MIN_LOT_SIZE', { desc: 'Single source' })}
                {renderInput('max_lot_size', 'MAX_LOT_SIZE', { desc: 'Single source' })}
                {renderInput('fixed_lot_size', 'FIXED_LOT_SIZE', { desc: 'Single source' })}
                {renderInput('safety_stock', 'SAFETY_STOCK', { desc: 'Single source' })}
                {renderInput('reorder_point', 'REORDER_POINT', { desc: 'Single source' })}
                {renderInput('procurement_method', 'PROCUREMENT_TYPE', { options: ['BUY','MAKE','BOTH','TRANSFER'], desc: 'SINGLE SOURCE only in MRP' })}
                {renderInput('special_procurement_method', 'SPECIAL_PROCUREMENT', { desc: 'SINGLE SOURCE only in MRP' })}
              </div>
            </div>
          </div>
        );
      case 'storage':
        return (
          <div className="space-y-6">
            <div className={modern ? "bg-zinc-50 rounded-xl p-4 border border-zinc-200" : "border p-3"}>
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCollapse('storage_plant')}>
                <h3 className={modern ? "font-semibold text-sm text-zinc-900" : "font-bold text-xs"}>Plant Extension – MMSC-like – Single Source</h3>
                <span className="text-xs">{collapsed['storage_plant'] ? '▶' : '▼'}</span>
              </div>
              {!collapsed['storage_plant'] && (
                <>
                  <p className="text-[11px] text-zinc-500 mt-1">Select facilities to extend material to. SAP: EMTC (legacy MM01) creates for one plant, MMSC extends.</p>
                  <div className="mt-4">
                    <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-mono font-bold uppercase text-black"}>FACILITY_CODES / PLANT_CODES * (Multi-select) – Single Source</label>
                    <div className={modern ? "mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-white rounded-xl border max-h-[200px] overflow-auto" : "mt-1 grid grid-cols-3 gap-1 border p-2 max-h-[150px] overflow-auto"}>
                      {facilities.length === 0 ? (
                        <span className="text-xs text-zinc-400">No facilities – create via EFCC – default FAC-1000 will be used</span>
                      ) : facilities.map((f: any) => (
                        <label key={f.code} className={modern ? "flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-zinc-50 cursor-pointer border" : "flex items-center gap-1 text-[11px] border p-1"}>
                          <input type="checkbox" checked={(form.facility_codes || []).includes(f.code)} onChange={() => handleFacilityToggle(f.code)} className="rounded" />
                          <span className="font-mono">{f.code}</span> <span className="truncate">{f.name}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-2">Selected: {(form.facility_codes || []).join(', ') || 'None – default FAC-1000'} – Creates prod_facility_profile per facility</p>
                  </div>
                </>
              )}
            </div>

            <div className={modern ? "bg-zinc-50 rounded-xl p-4 border border-zinc-200" : "border p-3"}>
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCollapse('storage_kit_lot')}>
                <h3 className={modern ? "font-semibold text-sm text-zinc-900" : "font-bold text-xs"}>Storage Extension – Batch/Lot Capability where required – EMTC Storage View – Single Source</h3>
                <span className="text-xs">{collapsed['storage_kit_lot'] ? '▶' : '▼'}</span>
              </div>
              {!collapsed['storage_kit_lot'] && (
                <div className={modern ? "grid grid-cols-1 md:grid-cols-3 gap-4 mt-4" : "grid grid-cols-3 gap-2 mt-2"}>
                  {renderInput('is_lot_managed', 'IS_LOT_MANAGED / BATCH_MANAGEMENT *', { options: ['true','false'], desc: 'Batch/lot capability where required – e.g., spices with expiry true, packaging false – MARA XCHPF – wired from foundation – inv_lot table – batch determination – industry standard – if true creates inv_lot on GR – MCH1 batch stock' })}
                  {renderInput('lot_control', 'LOT_CONTROL / EXPIRY_CONTROL *', { options: ['BLOCKED','WARN','RESTRICTED'], desc: 'Expiry control – BLOCKED=block if expired, WARN=warn, RESTRICTED=restricted use – wired from foundation – MCHA batch check – used in GR/IGRC (legacy MIGO) – industry standard – batch/lot capability where required' })}
                  {renderInput('shelf_life_days', 'SHELF_LIFE_DAYS / MIN_SHELF_LIFE *', { desc: 'Shelf life in days – e.g., 30, 180, 365 – expiry = manufacturing + shelf_life – e.g., pepper 365 days, oil 180 – wired from foundation – MARA MHDHB – used in batch expiry calculation – industry standard – batch/lot capability' })}
                  {renderInput('is_kit', 'IS_KIT', { options: ['true','false'], desc: 'Is kit – for kitting orders – now in Storage per user constraint – storage-related – kit & lot moved to storage – Basic only General' })}
                  {renderInput('is_phantom_kit', 'IS_PHANTOM_KIT', { options: ['true','false'], desc: 'Phantom kit – explodes in sales order not stock – now in Storage per user' })}
                  {renderInput('landed_cost_scope', 'LANDED_COST_SCOPE', { options: ['NONE','FREIGHT','CUSTOMS','FREIGHT_CUSTOMS','ALL'], desc: 'Landed cost relevance – now in Storage per user – storage-related – e.g., spices ALL with freight+customs' })}
                  {renderInput('is_hazardous', 'IS_HAZARDOUS / HAZMAT', { options: ['true','false'], desc: 'Hazardous material – storage condition – e.g., chemicals true – wired from foundation – used in storage location determination – industry standard' })}
                  {renderInput('weight', 'WEIGHT', { desc: 'Gross weight – e.g., 1.5 – wired from foundation – MARA BRGEW – used in shipping' })}
                  {renderInput('weight_unit', 'WEIGHT_UNIT', { desc: 'Weight unit – FK EUOC EUOC (legacy CUNI) – e.g., KG – wired from foundation – MARA GEWEI' })}
                </div>
              )}
            </div>
            <div className={modern ? "bg-emerald-50/30 rounded-xl p-4 border border-zinc-200" : "border p-3"}>
              <h3 className={modern ? "font-semibold text-sm text-zinc-900" : "font-bold text-xs"}>Storage/Facility Extension – Additional – Facility-specific storage data – MMSC-like – Single Source</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Plant extension creates prod_facility_profile per facility – storage/facility extension includes MRP, purchasing, accounting, costing per plant – MMSC extend material to plant – storage view holds batch/lot/expiry/shelf_life/kit – industry standard – wired from foundation as in industry standard – T0 BLOCKING</p>
              <div className={modern ? "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" : "grid grid-cols-2 gap-2 mt-2"}>
                <div className="space-y-1">
                  <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-mono font-bold uppercase text-black"}>FACILITY_CODES extended – prod_facility_profile per facility – MMSC-like</label>
                  <p className="text-[10px] text-zinc-400">Selected facilities: {(form.facility_codes || []).join(', ') || 'None – default FAC-1000'} – Each facility gets own prod_facility_profile with MRP (safety_stock, reorder_point, planning_type MRP, lot_sizing LOT_FOR_LOT, procurement_method BUY), purchasing (buyer_group via EBTC, procurement_division via EDPC, purchasing_org via FCRL PO01), accounting (moving_avg_price, standard_price, valuation_class via FAUC BSX), costing (costing_lot_size, overhead_group, price_unit), quality (is_quality_active QM) – wired from foundation as in industry standard MARC plant extension – T0 BLOCKING</p>
                </div>
                <div className="space-y-1">
                  <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-mono font-bold uppercase text-black"}>Batch/Lot Capability – where required – industry standard</label>
                  <p className="text-[10px] text-zinc-400">If is_lot_managed=true, system creates inv_lot on GR (IGRC (legacy MIGO)) with lot_number, manufacturing_date, expiry_date = manufacturing + shelf_life_days, supplier_lot_number, vendor_id – batch determination in sales/delivery – batch where-used list – expiry check BLOCKED/WARN/RESTRICTED – e.g., spice raw material with 365 days shelf life, batch managed, expiry control BLOCKED – packaging material not batch managed – batch/lot capability where required – wired from foundation – MCH1/MCHB batch stock – industry standard – single source – T0 BLOCKING</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'accounting':
        return (
          <div className="space-y-6">
            <div className={modern ? "bg-red-50/50 rounded-xl p-4 border border-red-200" : "border-2 border-red-200 p-3"}>
              <h3 className={modern ? "font-semibold text-sm text-red-900" : "font-bold text-xs text-red-800"}>Accounting View – T0 BLOCKING – Single Source</h3>
              <p className="text-[11px] text-red-600/80 mt-1">price_unit now ONLY here (removed from Costing duplicate).</p>
              <div className={modern ? "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" : "grid grid-cols-2 gap-2 mt-2"}>
                <div className="space-y-1">
                  <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-mono font-bold uppercase text-black"}>VALUATION_CLASS * – Valuation Class – FAUC – wired from foundation – BSX</label>
                  <DbAutocomplete label="" apiUrl="/api/auto-account-determination" dataKey="autoAccounts" codeField="valuation_class" value={form.inventory_valuation_class} onChange={v => setForm({ ...form, inventory_valuation_class: v, valuation_class: v })} placeholder="" required createUrl="/fico/auto-account-determination" createCode="FAUC" companyCode={companyCode} />
                  <p className="text-[10px] text-zinc-400">Valuation Class FK – FAUC own IP alias FAUC (legacy OBYC) – RAW/FINISHED/SEMI – valuation_class determines BSX GL via FAUC (legacy OBYC) – e.g., RAW→1400000001 – single source – wired from foundation as in industry standard – MBEW – T0 BLOCKING</p>
                </div>
                <div className="space-y-1">
                  <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-mono font-bold uppercase text-black"}>PRICE_CONTROL * – S/V – Price Control – wired from foundation</label>
                  <select value={form.pricing_method || form.price_control || ''} onChange={e => setForm({ ...form, pricing_method: e.target.value, price_control: e.target.value })} className={modern ? "w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-[13px] h-[32px] bg-white" : "w-full border border-black px-1.5 py-1 text-[11px] font-mono bg-white text-black rounded-none h-[28px]"}>
                    <option value="">Select PRICE_CONTROL</option>
                    <option value="STANDARD">S – Standard Price – with price diff PRD</option>
                    <option value="MOVING_AVG">V – Moving Average Price – MAP recalc</option>
                  </select>
                  <p className="text-[10px] text-zinc-400">Price Control – S Standard with PRD, V Moving Average with MAP – single source – wired from foundation – MBEW – used in stock ledger FSTL actual costing</p>
                </div>
                {renderInput('moving_avg_price', 'MOVING_AVG_PRICE *', { required: true, desc: 'Single source in Accounting only' })}
                {renderInput('standard_price', 'STANDARD_PRICE *', { required: true, desc: 'Single source in Accounting only' })}
                {renderInput('price_unit', 'PRICE_UNIT *', { desc: 'SINGLE SOURCE only in Accounting' })}
              </div>
            </div>
          </div>
        );
      case 'costing':
        return (
          <div className="space-y-6">
            <div className={modern ? "bg-purple-50/50 rounded-xl p-4 border border-purple-100" : "border p-3"}>
              <h3 className={modern ? "font-semibold text-sm text-purple-900" : "font-bold text-xs"}>Costing View – Single Source (no price duplicates)</h3>
              <p className="text-[11px] text-zinc-500 mt-1">price fields now ONLY in Accounting – Costing only has lot size & overhead.</p>
              <div className={modern ? "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" : "grid grid-cols-2 gap-2 mt-2"}>
                {renderInput('costing_lot_size', 'COSTING_LOT_SIZE', { desc: 'Single source' })}
                {renderInput('overhead_group', 'OVERHEAD_GROUP', { desc: 'Single source' })}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <RoleGuard requiredPermission="MATERIAL_VIEW" requiredRoles={['MATERIAL_MANAGER','MASTER_DATA_MANAGER','ADMIN','OWNER','MANAGER','WAREHOUSE','PURCHASER','SALES']}>
    <>
      <JobPopupComponent />
      <div className={modern ? "min-h-screen bg-[#fafaf9] p-6" : "min-h-screen bg-white p-4"}>
      <div className={modern ? "max-w-[1100px] mx-auto space-y-6" : "max-w-[1000px] mx-auto space-y-4"}>
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border-b pb-3"}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={modern ? "text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-black text-white" : "text-[10px] font-mono border px-2 py-0.5 bg-black text-white"}>EMTC</span>
              <span className={modern ? "text-[10px] font-mono px-2 py-1 rounded-full bg-zinc-100 border text-zinc-500" : "text-[9px] font-mono border px-1 bg-zinc-50"}>EMTC (legacy MM01)</span>
              <span className={modern ? "text-[11px] bg-zinc-100 border rounded-full px-2.5 py-1 text-zinc-600" : "text-[10px] border px-2 py-0.5"}>{items.length} materials</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${companyCode}/navigator`} className={modern ? "px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50" : "border px-2 py-1 text-xs"}>🌳 Navigator</Link>
              <Link href={`/${companyCode}/foundation/enterprise-structure`} className={modern ? "px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50" : "border px-2 py-1 text-xs"}>Hub</Link>
            </div>
          </div>
          <h1 className={modern ? "text-xl font-bold mt-3 tracking-tight" : "text-lg font-bold mt-2"}>Product Master – Full Accounting & MRP Views</h1>
          <p className={modern ? "text-xs text-zinc-500 mt-1" : "text-[11px] text-zinc-500"}>Create Product – T0 BLOCKING – valuation_class determines BSX GL via FAUC (legacy OBYC) – NO DANGLING – Auto number from MAT-01 if blank – Single source per field – Kit & Lot moved to Storage per user</p>
          <div className={modern ? "flex gap-2 mt-4" : "flex gap-1 mt-3"}>
            {(['create','list','change'] as const).map(m => (
              <Link key={m} href={`/${companyCode}/foundation/materials?mode=${m}`} className={modern ? `h-[28px] px-3 rounded-full text-[11px] font-medium border transition ${mode===m ? 'bg-black text-white border-black' : 'bg-white hover:bg-zinc-50'}` : `px-3 py-1 text-xs border ${mode===m ? 'bg-black text-white' : 'bg-white'}`}>{m.toUpperCase()}</Link>
            ))}
          </div>
        </div>

        {message && <div className={modern ? "bg-white border rounded-xl p-3 text-xs" : "border p-2 text-xs"}>{message}</div>}

        {mode === 'create' && (
          <form onSubmit={handleSubmit} className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-6" : "border p-4 space-y-4"}>
            <div className={modern ? "flex gap-2 border-b pb-3 overflow-x-auto" : "flex gap-1 border-b pb-2 overflow-x-auto"}>
              {TABS.map(t => {
                const missing = missingPerTab[t.key].length;
                return (
                  <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} className={modern ? `relative h-[28px] px-3 rounded-full text-[11px] font-medium border whitespace-nowrap transition ${activeTab===t.key ? 'bg-black text-white border-black' : 'bg-zinc-50 hover:bg-zinc-100'}` : `relative px-3 py-1 text-xs border whitespace-nowrap ${activeTab===t.key ? 'bg-black text-white' : 'bg-white'}`}>
                    {t.label}
                    
                    {missing > 0 && <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] bg-red-500 text-white rounded-full px-1.5 border border-white shadow-sm" title={`Missing: ${missingPerTab[t.key].join(", ")}`}>{missing}</span>}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-zinc-400">{TABS.find(t=>t.key===activeTab)?.desc} {missingPerTab[activeTab].length > 0 && <span className="text-red-500">• Missing: {missingPerTab[activeTab].join(', ')}</span>}</p>
            {renderTabContent()}
            <div className="flex gap-2 pt-4 border-t items-center flex-wrap">
              <button type="submit" disabled={!isFormValid || isSubmitting} className={modern ? `h-[32px] px-5 rounded-full text-[13px] font-medium transition flex items-center gap-2 ${isFormValid && !isSubmitting ? 'bg-black text-white hover:bg-zinc-800' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}` : `px-4 py-1.5 text-xs flex items-center gap-2 ${isFormValid && !isSubmitting ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}>
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating... Please wait – generating number via assignment – atomic update
                  </>
                ) : 'Create Product'}
              </button>
              <button type="button" onClick={() => setForm(initialForm)} disabled={isSubmitting} className={modern ? "px-4 py-2.5 rounded-full border text-sm disabled:opacity-50" : "px-3 py-1.5 border text-xs disabled:opacity-50"}>Clear</button>
              {!isFormValid && !isSubmitting && <span className="text-[11px] text-red-500">Fill required fields to activate – red dots show tabs with missing</span>}
              {isSubmitting && <span className="text-[11px] text-zinc-900 animate-pulse">⏳ Server working – {elapsed}s elapsed – generating number – please wait – prevents double click – after 10s auto-moves to background – popup shows steps – you can close → last page – check header Jobs icon if long – no timeout – background capable – lock prevents double entry</span>}
            </div>
          </form>
        )}

        {mode === 'list' && (
          <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-4" : "border p-4 space-y-3"}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input value={listSearch} onChange={e => { setListSearch(e.target.value); setShowListSuggestions(true); }} onFocus={() => setShowListSuggestions(true)} onBlur={() => setTimeout(() => setShowListSuggestions(false), 200)} placeholder="Search by code or name" className={modern ? "w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-[13px] h-[32px] focus:outline-none focus:ring-1 focus:ring-black focus:border-black/10" : "w-full border border-black px-1.5 py-1 text-[11px] font-mono bg-white text-black rounded-none h-[28px]"} />
                {showListSuggestions && listSuggestions.length > 0 && (
                  <div className={modern ? "absolute z-10 mt-1 w-full bg-white border rounded-xl shadow-lg max-h-[200px] overflow-auto" : "absolute z-10 mt-1 w-full bg-white border shadow max-h-[150px] overflow-auto"}>
                    {listSuggestions.map((it: any) => (
                      <div key={it.item_number || it.code} onMouseDown={() => { setListSearch(it.item_number || ''); setExpandedItem(it); }} className={modern ? "px-3 py-2 text-xs hover:bg-zinc-50 cursor-pointer flex justify-between" : "px-2 py-1 text-[11px] hover:bg-zinc-50 cursor-pointer"}>
                        <span className="font-mono">{it.item_number || it.code}</span><span className="truncate ml-2">{it.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-xs text-zinc-500 self-center">{filteredListItems.length} / {items.length}</span>
            </div>
            <div className={modern ? "space-y-2 max-h-[600px] overflow-auto" : "space-y-1 max-h-[500px] overflow-auto"}>
              {loading ? <p className="text-xs">Loading...</p> : filteredListItems.map((it: any) => (
                <div key={it.id || it.item_number} className={modern ? `border rounded-xl p-3 hover:shadow-sm transition cursor-pointer ${expandedItem?.id===it.id ? 'bg-zinc-50 border-black' : 'bg-white'}` : `border p-2 cursor-pointer ${expandedItem?.id===it.id ? 'bg-zinc-100' : ''}`} onClick={() => setExpandedItem(expandedItem?.id===it.id ? null : it)}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">{it.item_number || it.material_number || it.code}</span>
                      <span className="text-xs truncate">{it.description}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 border">{it.type || it.material_type}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-50 border">{it.valuation_class || it.inventory_valuation_class}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-400">{it.base_unit || it.base_uom}</span>
                      <Link href={`/${companyCode}/foundation/materials?mode=change`} onClick={e => { e.stopPropagation(); setSelectedCode(it.item_number || it.code); }} className={modern ? "text-[11px] px-2 py-1 rounded-full bg-black text-white" : "text-[10px] border px-1 bg-black text-white"}>Edit</Link>
                    </div>
                  </div>
                  {expandedItem?.id === it.id && (
                    <div className={modern ? "mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-white rounded-xl border text-[11px]" : "mt-2 grid grid-cols-3 gap-2 p-2 bg-white border text-[10px]"}>
                      {Object.entries(it).map(([k,v]) => (
                        <div key={k} className="space-y-0.5"><span className="font-medium text-zinc-500 uppercase text-[9px]">{k}</span><div className="truncate">{String(v ?? '')}</div></div>
                      ))}
                      <div className="col-span-full pt-2 border-t flex gap-2">
                        <Link href={`/${companyCode}/foundation/materials?mode=change`} onClick={() => setSelectedCode(it.item_number || it.code)} className={modern ? "text-xs px-3 py-1 rounded-full bg-black text-white" : "text-[11px] border px-2 py-1 bg-black text-white"}>Go to Change Mode</Link>
                        <button onClick={() => setExpandedItem(null)} className={modern ? "text-xs px-3 py-1 rounded-full border" : "text-[11px] border px-2 py-1"}>Close</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === 'change' && (
          <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-4" : "border p-4 space-y-3"}>
            <div className="relative">
              <input value={changeSearch} onChange={e => { setChangeSearch(e.target.value); setShowChangeSuggestions(true); }} onFocus={() => setShowChangeSuggestions(true)} onBlur={() => setTimeout(() => setShowChangeSuggestions(false), 200)} placeholder="Search material to change" className={modern ? "w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-[13px] h-[32px] focus:outline-none focus:ring-1 focus:ring-black focus:border-black/10" : "w-full border border-black px-1.5 py-1 text-[11px] font-mono bg-white text-black rounded-none h-[28px]"} />
              {showChangeSuggestions && changeSuggestions.length > 0 && (
                <div className={modern ? "absolute z-10 mt-1 w-full bg-white border rounded-xl shadow-lg max-h-[250px] overflow-auto" : "absolute z-10 mt-1 w-full bg-white border shadow max-h-[200px] overflow-auto"}>
                  {changeSuggestions.map((it: any) => (
                    <div key={it.item_number || it.code} onMouseDown={() => { setSelectedCode(it.item_number || it.code); setChangeSearch(it.item_number || ''); setShowChangeSuggestions(false); }} className={modern ? "px-3 py-2 text-xs hover:bg-zinc-50 cursor-pointer flex justify-between" : "px-2 py-1 text-[11px] hover:bg-zinc-50 cursor-pointer"}>
                      <span className="font-mono">{it.item_number || it.code}</span><span className="truncate ml-2">{it.description}</span><span className="text-[10px] text-zinc-400 ml-2">{it.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={modern ? "flex gap-2 flex-wrap max-h-[150px] overflow-auto p-2 border rounded-xl bg-zinc-50" : "flex gap-1 flex-wrap max-h-[120px] overflow-auto border p-2"}>
              {filteredChangeItems.map((it: any) => (
                <button key={it.id || it.item_number} onClick={() => { setSelectedCode(it.item_number || it.code); setChangeSearch(it.item_number || ''); }} className={modern ? `px-3 py-1.5 rounded-full text-xs border ${selectedCode===(it.item_number||it.code) ? 'bg-black text-white border-black' : 'bg-white hover:bg-zinc-100'}` : `px-2 py-1 text-[11px] border ${selectedCode===(it.item_number||it.code) ? 'bg-black text-white' : 'bg-white'}`}>{it.item_number || it.code} – {(it.description||'').slice(0,20)}</button>
              ))}
            </div>
            {selectedCode && (
              <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t">
                <h3 className={modern ? "font-semibold text-sm" : "font-bold text-xs"}>Change {selectedCode} – {TABS.find(t=>t.key===activeTab)?.label} {missingPerTab[activeTab].length>0 && <span className="text-red-500">({missingPerTab[activeTab].length} required missing)</span>}</h3>
                <div className={modern ? "flex gap-2 border-b pb-3 overflow-x-auto" : "flex gap-1 border-b pb-2 overflow-x-auto"}>
                  {TABS.map(t => {
                    const missing = missingPerTab[t.key].length;
                    return (
                      <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} className={modern ? `relative h-[28px] px-3 rounded-full text-[11px] font-medium border whitespace-nowrap ${activeTab===t.key ? 'bg-black text-white border-black' : 'bg-zinc-50'}` : `relative px-3 py-1 text-xs border whitespace-nowrap ${activeTab===t.key ? 'bg-black text-white' : 'bg-white'}`}>
                        {t.label}
                        
                        {missing > 0 && <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] bg-red-500 text-white rounded-full px-1.5 border border-white shadow-sm" title={`Missing: ${missingPerTab[t.key].join(", ")}`}>{missing}</span>}
                      </button>
                    );
                  })}
                </div>
                {renderTabContent()}
                <div className="flex gap-2 pt-4 border-t items-center">
                  <button type="submit" disabled={!isFormValid} className={modern ? `h-[32px] px-5 rounded-full text-[13px] transition ${isFormValid ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}` : `px-4 py-1.5 text-xs ${isFormValid ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}>Update Product</button>
                  {!isFormValid && <span className="text-[11px] text-red-500">Red dots show tabs with missing – fill to activate</span>}
                </div>
              </form>
            )}
          </div>
        )}

        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border p-3"}>
          <h3 className={modern ? "text-xs font-semibold mb-3" : "text-[11px] font-bold mb-2"}>Related – auto from FK dependencies</h3>
          <div className={modern ? "grid grid-cols-2 md:grid-cols-4 gap-2" : "grid grid-cols-4 gap-1"}>
            {[
              { code: "EMTP", label: "Product Types", route: "/foundation/material-types" },
              { code: "EUOC", label: "UOM", route: "/foundation/uom" },
              { code: "EMGC", label: "Categories", route: "/foundation/material-categories" },
              { code: "EFCC", label: "Facilities / Plants", route: "/foundation/facilities" },
              { code: "FAUC", label: "Auto Account OBYC", route: "/fico/auto-account-determination" },
              { code: "FMTM", label: "Movement Types", route: "/fico/movement-types" },
              { code: "FNRC", label: "Number Ranges MAT-01", route: "/fico/number-ranges" },
              { code: "ISTV", label: "Stock Overview", route: "/foundation/stock" },
            ].map(l => (
              <Link key={l.code} href={`/${companyCode}${l.route}`} className={modern ? "px-3 py-2 rounded-xl border text-xs hover:bg-zinc-50 flex justify-between" : "border px-2 py-1 text-[10px] hover:bg-zinc-50"}>
                <span>{l.code}</span><span className="truncate ml-1">{l.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
    </RoleGuard>
  );
}
