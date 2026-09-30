"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';

type TabKey = 'basic' | 'purchasing' | 'mrp' | 'storage' | 'accounting' | 'costing';

const TABS: { key: TabKey; label: string; desc: string }[] = [
  { key: 'basic', label: 'Basic Data', desc: 'Client level – code, name, type, UoM, category, barcode, HSN – single source' },
  { key: 'purchasing', label: 'Purchasing', desc: 'Plant level – buyer group, procurement division, QM active' },
  { key: 'mrp', label: 'MRP', desc: 'MRP type, controller, lot sizing, safety stock, reorder point, procurement – single source' },
  { key: 'storage', label: 'Storage', desc: 'Facility extension MMSC + Kit & Lot/Batch & Expiry – all storage-related – single source' },
  { key: 'accounting', label: 'Accounting', desc: 'Valuation class BSX/WRX, price control, MAP/Standard, price unit – T0 BLOCKING' },
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem('erp-ui-mode');
      if (saved) setUiMode(saved as any);
      const handler = (e: any) => setUiMode(e.detail);
      window.addEventListener('erp-ui-mode-change', handler as any);
      return () => window.removeEventListener('erp-ui-mode-change', handler as any);
    } catch {}
  }, []);

  // Fetch next number preview for ITEM – shows what will be generated if blank
  useEffect(() => {
    if (mode !== 'create') return;
    const fetchNext = async () => {
      try {
        const res = await fetch('/api/number-ranges?limit=100');
        const j = await res.json();
        const ranges = j.data || j.numberRanges || [];
        const matRange = ranges.find((r: any) => r.object_type === 'ITEM' || r.code === 'MAT-01' || r.code === 'ITEM-01' || r.code?.includes('MAT'));
        if (matRange) {
          const next = (matRange.current_number || matRange.from_number || 100000) + 1;
          const prefix = matRange.prefix || 'MAT-';
          setNextNumberPreview(`${prefix}${next} (from ${matRange.code} ${prefix}${matRange.from_number}-${matRange.to_number})`);
        } else {
          setNextNumberPreview('No MAT-01/ITEM range found – will use MAT-{timestamp} fallback – create range via FNRC first for sequential');
        }
      } catch {
        setNextNumberPreview('Unable to fetch range – fallback timestamp will be used');
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
    if (!isFormValid) {
      const firstTabWithMissing = (Object.keys(missingPerTab) as TabKey[]).find(k => missingPerTab[k].length > 0);
      if (firstTabWithMissing) setActiveTab(firstTabWithMissing);
      setMessage(`❌ Fill required fields: ${Object.entries(missingPerTab).filter(([_, arr]) => arr.length).map(([tab, arr]) => `${tab.toUpperCase()}: ${arr.join(', ')}`).join(' | ')}`);
      return;
    }
    setMessage(null);
    try {
      let payload: any = { ...form, company_code: companyCode };
      payload.is_lot_managed = payload.is_lot_managed === 'true' || payload.is_lot_managed === true;
      payload.is_kit = payload.is_kit === 'true' || payload.is_kit === true;
      payload.is_phantom_kit = payload.is_phantom_kit === 'true' || payload.is_phantom_kit === true;
      payload.is_quality_active = payload.is_quality_active === 'true' || payload.is_quality_active === true;
      if (!payload.item_number && mode === 'create') {
        try {
          const nextRes = await fetch('/api/number-ranges/next?object_type=ITEM');
          const nextJson = await nextRes.json();
          if (nextJson.success && nextJson.document_number) payload.item_number = nextJson.document_number;
        } catch {}
      }
      payload.material_number = payload.item_number;
      payload.base_uom = payload.base_unit;
      payload.group_code = payload.category_code;
      payload.valuation_class = payload.inventory_valuation_class;
      payload.price_control = payload.pricing_method;
      payload.mrp_type = payload.planning_type;
      payload.mrp_controller = payload.planning_controller;
      payload.lot_size = payload.lot_sizing;
      payload.facility_codes = payload.facility_codes?.length ? payload.facility_codes : undefined;
      payload.plant_codes = payload.facility_codes;

      const method = mode === 'change' ? 'PUT' : 'POST';
      const res = await fetch('/api/materials', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setMessage(`✅ Product ${payload.item_number} ${mode === 'change' ? 'updated' : 'created'} – EMTC – Facilities: ${(payload.facility_codes || []).join(',') || 'default'}`);
      fetchItems();
      if (mode === 'create') setForm(initialForm);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
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
          <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>{label}{opts?.required ? ' *' : ''}</label>
          <select value={value} onChange={e => setForm({ ...form, [key]: e.target.value })} className={modern ? `w-full border-2 ${borderColor} rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 bg-white` : `w-full border px-2 py-1.5 text-xs ${opts?.required && isEmpty ? 'border-red-400' : ''}`}>
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
          <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>{label}{opts?.required ? ' *' : ''}</label>
          <textarea value={value} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder="" rows={3} className={modern ? `w-full border-2 ${borderColor} rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10` : `w-full border px-2 py-1.5 text-xs ${opts?.required && isEmpty ? 'border-red-400' : ''}`} />
          {opts?.desc && <p className="text-[10px] text-zinc-400">{opts.desc}</p>}
        </div>
      );
    }
    return (
      <div key={key} className="space-y-1">
        <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>{label}{opts?.required ? ' *' : ''}</label>
        <input value={value} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder="" className={modern ? `w-full border-2 ${borderColor} rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10` : `w-full border px-2 py-1.5 text-xs ${opts?.required && isEmpty ? 'border-red-400' : ''}`} />
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
                    <div className={modern ? "mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs" : "mb-2 p-2 border bg-blue-50 text-[11px]"}>
                      <span className="font-medium">Auto-number preview:</span> {nextNumberPreview} – Leave PRODUCT_CODE blank to use this, or type manual like <span className="font-mono">FG-001</span> / <span className="font-mono">RAW-1001</span>. Setup ranges via <Link href={`/${companyCode}/fico/number-ranges`} className="text-blue-600 underline">FNRC Number Ranges</Link> – create MAT-01 with object_type ITEM, prefix MAT-, from 100000.
                    </div>
                  )}
                  <div className={modern ? "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" : "grid grid-cols-2 gap-2 mt-2"}>
                    {renderInput('item_number', 'PRODUCT_CODE (Optional – auto if blank)', { desc: 'Leave blank → auto from MAT-01 / ITEM range (e.g., MAT-100001) – SAP-like – or enter manual FG-001 – optional, not required' })}
                  {renderInput('description', 'PRODUCT_NAME / DESCRIPTION', { required: true, desc: 'Short description – single source' })}
                  {renderInput('type', 'PRODUCT_TYPE', { required: true, options: ['RAW','FINISHED','SEMI','TRADING','PACKAGING','CONSUMABLE','SERVICE'], desc: 'RAW=ROH, FINISHED=FERT – single source' })}
                  <div className="space-y-1">
                    <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>BASE_UNIT *</label>
                    <DbAutocomplete label="" apiUrl="/api/uom" dataKey="uom" codeField="code" value={form.base_unit} onChange={v => setForm({ ...form, base_unit: v })} placeholder="" required createUrl="/foundation/uom" createCode="EUOC" companyCode={companyCode} />
                    <p className="text-[10px] text-zinc-400">Base unit FK – KG/PC/BOX via EUOC – single source</p>
                  </div>
                  <div className="space-y-1">
                    <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>PRODUCT_CATEGORY</label>
                    <DbAutocomplete label="" apiUrl="/api/material-categories" dataKey="materialCategories" codeField="code" value={form.category_code} onChange={v => setForm({ ...form, category_code: v })} placeholder="" createUrl="/foundation/material-categories" createCode="EMGC" companyCode={companyCode} />
                    <p className="text-[10px] text-zinc-400">Category FK – EMGC – single source</p>
                  </div>
                  {renderInput('barcode', 'BARCODE / EAN', { desc: 'For POS, GR scanning – single source in Basic only' })}
                  {renderInput('hsn_code', 'HSN_CODE', { desc: 'India GST HSN – FTXC – single source in Basic only' })}
                  {renderInput('description_long', 'DESCRIPTION_LONG', { type: 'textarea', desc: 'Long text for SO/PO print – single source' })}
                </div>
                </>
              )}
            </div>
          </div>
        );
      case 'purchasing':
        return (
          <div className="space-y-6">
            <div className={modern ? "bg-blue-50/50 rounded-xl p-4 border border-blue-100" : "border p-3"}>
              <h3 className={modern ? "font-semibold text-sm text-blue-900" : "font-bold text-xs"}>Purchasing View – Plant Dependent – Single Source</h3>
              <p className="text-[11px] text-zinc-500 mt-1">procurement_method & special_procurement moved to MRP tab only (SAP MRP2) to remove duplicate.</p>
              <div className={modern ? "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" : "grid grid-cols-2 gap-2 mt-2"}>
                {renderInput('purchasing_group', 'PURCHASING_GROUP', { desc: 'K01/001 – single source, buyer_group alias removed duplicate – use this only' })}
                {renderInput('buyer_group', 'BUYER_GROUP (alias)', { desc: 'BUY-001 – same as purchasing_group – kept for backward compat' })}
                {renderInput('procurement_division', 'PROCUREMENT_DIVISION', { desc: 'PD-1000 / KPO1 – single source' })}
                {renderInput('is_quality_active', 'IS_QUALITY_ACTIVE', { options: ['true','false'], desc: 'QM active for GR inspection – single source' })}
              </div>
            </div>
          </div>
        );
      case 'mrp':
        return (
          <div className="space-y-6">
            <div className={modern ? "bg-amber-50/50 rounded-xl p-4 border border-amber-100" : "border p-3"}>
              <h3 className={modern ? "font-semibold text-sm text-amber-900" : "font-bold text-xs"}>MRP View – Single Source for procurement</h3>
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
            <div className={modern ? "bg-emerald-50/50 rounded-xl p-4 border border-emerald-100" : "border p-3"}>
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCollapse('storage_plant')}>
                <h3 className={modern ? "font-semibold text-sm text-emerald-900" : "font-bold text-xs"}>Plant Extension – MMSC-like – Single Source</h3>
                <span className="text-xs">{collapsed['storage_plant'] ? '▶' : '▼'}</span>
              </div>
              {!collapsed['storage_plant'] && (
                <>
                  <p className="text-[11px] text-zinc-500 mt-1">Select facilities to extend material to. SAP: MM01 creates for one plant, MMSC extends.</p>
                  <div className="mt-4">
                    <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>FACILITY_CODES / PLANT_CODES * (Multi-select) – Single Source</label>
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

            <div className={modern ? "bg-emerald-50/50 rounded-xl p-4 border border-emerald-100" : "border p-3"}>
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCollapse('storage_kit_lot')}>
                <h3 className={modern ? "font-semibold text-sm text-emerald-900" : "font-bold text-xs"}>Kit & Lot / Batch & Expiry – Moved from Basic to Storage (per user – storage-related)</h3>
                <span className="text-xs">{collapsed['storage_kit_lot'] ? '▶' : '▼'}</span>
              </div>
              {!collapsed['storage_kit_lot'] && (
                <div className={modern ? "grid grid-cols-1 md:grid-cols-3 gap-4 mt-4" : "grid grid-cols-3 gap-2 mt-2"}>
                  {renderInput('is_kit', 'IS_KIT', { options: ['true','false'], desc: 'Is kit – for kitting orders – now in Storage' })}
                  {renderInput('is_phantom_kit', 'IS_PHANTOM_KIT', { options: ['true','false'], desc: 'Phantom kit – now in Storage' })}
                  {renderInput('landed_cost_scope', 'LANDED_COST_SCOPE', { options: ['NONE','FREIGHT','CUSTOMS','FREIGHT_CUSTOMS','ALL'], desc: 'Landed cost relevance – now in Storage' })}
                  {renderInput('is_lot_managed', 'IS_LOT_MANAGED', { options: ['true','false'], desc: 'Was is_batch_managed – MOVED from Basic to Storage per user – storage-related' })}
                  {renderInput('lot_control', 'LOT_CONTROL', { options: ['BLOCKED','WARN','RESTRICTED'], desc: 'Expiry control – MOVED to Storage' })}
                  {renderInput('shelf_life_days', 'SHELF_LIFE_DAYS', { desc: 'e.g., 30 – MOVED from Basic to Storage per user' })}
                </div>
              )}
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
                {renderInput('inventory_valuation_class', 'VALUATION_CLASS *', { required: true, options: ['RAW','FINISHED','SEMI','TRADING','PACKAGING','CONSUMABLE','SERVICE'], desc: 'Single source' })}
                {renderInput('pricing_method', 'PRICE_CONTROL *', { required: true, options: ['STANDARD','MOVING_AVG'], desc: 'Single source' })}
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
    <div className={modern ? "min-h-screen bg-[#fafaf9] p-6" : "min-h-screen bg-white p-4"}>
      <div className={modern ? "max-w-[1100px] mx-auto space-y-6" : "max-w-[1000px] mx-auto space-y-4"}>
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border-b pb-3"}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={modern ? "text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-black text-white" : "text-[10px] font-mono border px-2 py-0.5 bg-black text-white"}>EMTC</span>
              <span className={modern ? "text-[10px] font-mono px-2 py-1 rounded-full bg-zinc-100 border text-zinc-500" : "text-[9px] font-mono border px-1 bg-zinc-50"}>MM01</span>
              <span className={modern ? "text-[11px] bg-zinc-100 border rounded-full px-2.5 py-1 text-zinc-600" : "text-[10px] border px-2 py-0.5"}>{items.length} materials</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${companyCode}/navigator`} className={modern ? "px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50" : "border px-2 py-1 text-xs"}>🌳 Navigator</Link>
              <Link href={`/${companyCode}/foundation/enterprise-structure`} className={modern ? "px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50" : "border px-2 py-1 text-xs"}>Hub</Link>
            </div>
          </div>
          <h1 className={modern ? "text-xl font-bold mt-3 tracking-tight" : "text-lg font-bold mt-2"}>Product Master – Full Accounting & MRP Views</h1>
          <p className={modern ? "text-xs text-zinc-500 mt-1" : "text-[11px] text-zinc-500"}>Create Product – T0 BLOCKING – valuation_class determines BSX GL via OBYC – NO DANGLING – Auto number from MAT-01 if blank – Single source per field – Kit & Lot moved to Storage per user</p>
          <div className={modern ? "flex gap-2 mt-4" : "flex gap-1 mt-3"}>
            {(['create','list','change'] as const).map(m => (
              <Link key={m} href={`/${companyCode}/foundation/materials?mode=${m}`} className={modern ? `px-4 py-2 rounded-full text-xs font-medium border transition ${mode===m ? 'bg-black text-white border-black' : 'bg-white hover:bg-zinc-50'}` : `px-3 py-1 text-xs border ${mode===m ? 'bg-black text-white' : 'bg-white'}`}>{m.toUpperCase()}</Link>
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
                  <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} className={modern ? `relative px-4 py-2 rounded-full text-xs font-medium border whitespace-nowrap transition ${activeTab===t.key ? 'bg-black text-white border-black' : 'bg-zinc-50 hover:bg-zinc-100'}` : `relative px-3 py-1 text-xs border whitespace-nowrap ${activeTab===t.key ? 'bg-black text-white' : 'bg-white'}`}>
                    {t.label}
                    
                    {missing > 0 && <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] bg-red-500 text-white rounded-full px-1.5 border border-white shadow-sm" title={`Missing: ${missingPerTab[t.key].join(", ")}`}>{missing}</span>}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-zinc-400">{TABS.find(t=>t.key===activeTab)?.desc} {missingPerTab[activeTab].length > 0 && <span className="text-red-500">• Missing: {missingPerTab[activeTab].join(', ')}</span>}</p>
            {renderTabContent()}
            <div className="flex gap-2 pt-4 border-t items-center">
              <button type="submit" disabled={!isFormValid} className={modern ? `px-6 py-2.5 rounded-full text-sm font-medium transition ${isFormValid ? 'bg-black text-white hover:bg-zinc-800' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}` : `px-4 py-1.5 text-xs ${isFormValid ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}>Create Product</button>
              <button type="button" onClick={() => setForm(initialForm)} className={modern ? "px-4 py-2.5 rounded-full border text-sm" : "px-3 py-1.5 border text-xs"}>Clear</button>
              {!isFormValid && <span className="text-[11px] text-red-500">Fill required fields to activate – red dots show tabs with missing</span>}
            </div>
          </form>
        )}

        {mode === 'list' && (
          <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-4" : "border p-4 space-y-3"}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input value={listSearch} onChange={e => { setListSearch(e.target.value); setShowListSuggestions(true); }} onFocus={() => setShowListSuggestions(true)} onBlur={() => setTimeout(() => setShowListSuggestions(false), 200)} placeholder="Search by code or name" className={modern ? "w-full border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10" : "w-full border px-2 py-1.5 text-xs"} />
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
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 border">{it.valuation_class || it.inventory_valuation_class}</span>
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
              <input value={changeSearch} onChange={e => { setChangeSearch(e.target.value); setShowChangeSuggestions(true); }} onFocus={() => setShowChangeSuggestions(true)} onBlur={() => setTimeout(() => setShowChangeSuggestions(false), 200)} placeholder="Search material to change" className={modern ? "w-full border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10" : "w-full border px-2 py-1.5 text-xs"} />
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
                      <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} className={modern ? `relative px-4 py-2 rounded-full text-xs font-medium border whitespace-nowrap ${activeTab===t.key ? 'bg-black text-white border-black' : 'bg-zinc-50'}` : `relative px-3 py-1 text-xs border whitespace-nowrap ${activeTab===t.key ? 'bg-black text-white' : 'bg-white'}`}>
                        {t.label}
                        
                        {missing > 0 && <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] bg-red-500 text-white rounded-full px-1.5 border border-white shadow-sm" title={`Missing: ${missingPerTab[t.key].join(", ")}`}>{missing}</span>}
                      </button>
                    );
                  })}
                </div>
                {renderTabContent()}
                <div className="flex gap-2 pt-4 border-t items-center">
                  <button type="submit" disabled={!isFormValid} className={modern ? `px-6 py-2.5 rounded-full text-sm transition ${isFormValid ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}` : `px-4 py-1.5 text-xs ${isFormValid ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}>Update Product</button>
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
              { code: "OMJJ", label: "Movement Types", route: "/fico/movement-types" },
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
  );
}
