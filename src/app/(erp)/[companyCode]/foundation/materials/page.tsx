"use client";
import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';

type TabKey = 'basic' | 'purchasing' | 'mrp' | 'storage' | 'accounting' | 'costing';

const TABS: { key: TabKey; label: string; desc: string }[] = [
  { key: 'basic', label: 'Basic Data', desc: 'Client level – item_number, description, type, UoM, category, lot/expiry' },
  { key: 'purchasing', label: 'Purchasing', desc: 'Plant level – buyer group, procurement division, procurement method' },
  { key: 'mrp', label: 'MRP', desc: 'MRP type, controller, lot sizing, safety stock, reorder point' },
  { key: 'storage', label: 'Storage', desc: 'Facility extension, inventory location, storage conditions' },
  { key: 'accounting', label: 'Accounting', desc: 'Valuation class BSX/WRX, price control, MAP/Standard price – T0 BLOCKING' },
  { key: 'costing', label: 'Costing', desc: 'Costing lot size, overhead group, price unit – CK40N' },
];

const initialForm = {
  // Basic
  item_number: '',
  description: '',
  description_long: '',
  type: '',
  base_unit: '',
  category_code: '',
  is_lot_managed: 'true',
  shelf_life_days: '',
  lot_control: '',
  barcode: '',
  hsn_code: '',
  is_kit: 'false',
  is_phantom_kit: 'false',
  landed_cost_scope: '',
  // Purchasing
  purchasing_group: '',
  buyer_group: '',
  procurement_division: '',
  purchasing_org: '',
  procurement_method: '',
  special_procurement_method: '',
  // MRP
  planning_type: '',
  mrp_type: '',
  planning_controller: '',
  mrp_controller: '',
  lot_sizing: '',
  lot_size: '',
  min_lot_size: '',
  max_lot_size: '',
  fixed_lot_size: '',
  safety_stock: '',
  reorder_point: '',
  // Storage – facility multi
  facility_codes: [] as string[],
  plant_codes: [] as string[],
  // Accounting
  inventory_valuation_class: '',
  valuation_class: '',
  pricing_method: '',
  price_control: '',
  moving_avg_price: '',
  standard_price: '',
  price_unit: '',
  // Costing
  costing_lot_size: '',
  overhead_group: '',
  is_quality_active: 'false',
  is_qm_active: '',
};

export default function MaterialMasterPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
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
      const res = await fetch('/api/materials?limit=200');
      const j = await res.json();
      const data = j.data || j.materials || j.items || [];
      setItems(Array.isArray(data) ? data : []);
      // facilities
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      let payload: any = { ...form, company_code: companyCode };

      // Normalize booleans
      payload.is_lot_managed = payload.is_lot_managed === 'true' || payload.is_lot_managed === true;
      payload.is_kit = payload.is_kit === 'true' || payload.is_kit === true;
      payload.is_phantom_kit = payload.is_phantom_kit === 'true' || payload.is_phantom_kit === true;
      payload.is_quality_active = payload.is_quality_active === 'true' || payload.is_quality_active === true;

      // Auto-number if blank – SAP-like
      if (!payload.item_number && mode === 'create') {
        try {
          const nextRes = await fetch('/api/number-ranges/next?object_type=ITEM');
          const nextJson = await nextRes.json();
          if (nextJson.success && nextJson.document_number) {
            payload.item_number = nextJson.document_number;
          }
        } catch {}
      }

      // Map legacy names to new API expects
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

  const renderInput = (key: string, label: string, opts?: { required?: boolean; type?: string; options?: string[]; placeholder?: string; desc?: string }) => {
    const value = form[key] ?? '';
    const isEmpty = !value || (Array.isArray(value) && value.length === 0);
    const borderColor = opts?.required && isEmpty ? 'border-yellow-300' : value ? 'border-green-400' : 'border-zinc-200';
    const selectPlaceholder = `Select ${label}`;

    if (opts?.options) {
      return (
        <div key={key} className="space-y-1">
          <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>{label}{opts?.required ? ' *' : ''}</label>
          <select value={value} onChange={e => setForm({ ...form, [key]: e.target.value })} className={modern ? `w-full border-2 ${borderColor} rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 bg-white` : `w-full border px-2 py-1.5 text-xs`}>
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
          <textarea value={value} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder="" rows={3} className={modern ? `w-full border-2 ${borderColor} rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10` : `w-full border px-2 py-1.5 text-xs`} />
          {opts?.desc && <p className="text-[10px] text-zinc-400">{opts.desc}</p>}
        </div>
      );
    }
    return (
      <div key={key} className="space-y-1">
        <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>{label}{opts?.required ? ' *' : ''}</label>
        <input value={value} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder="" className={modern ? `w-full border-2 ${borderColor} rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10` : `w-full border px-2 py-1.5 text-xs`} />
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
                <h3 className={modern ? "font-semibold text-sm" : "font-bold text-xs"}>General Data – Client Level</h3>
                <span className="text-xs">{collapsed['basic_general'] ? '▶' : '▼'}</span>
              </div>
              {!collapsed['basic_general'] && (
                <div className={modern ? "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" : "grid grid-cols-2 gap-2 mt-2"}>
                  {renderInput('item_number', 'PRODUCT_CODE', { required: true, desc: 'item_number – auto from MAT-01 / ITEM range if blank – SAP-like' })}
                  {renderInput('description', 'PRODUCT_NAME / DESCRIPTION', { required: true, desc: 'Short description – used in SO/PO' })}
                  {renderInput('type', 'PRODUCT_TYPE', { required: true, options: ['RAW','FINISHED','SEMI','TRADING','PACKAGING','CONSUMABLE','SERVICE'], desc: 'RAW=ROH, FINISHED=FERT, SEMI=HALB – legal-safe' })}
                  <div className="space-y-1">
                    <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>BASE_UNIT *</label>
                    <DbAutocomplete label="" apiUrl="/api/uom" dataKey="uom" codeField="code" value={form.base_unit} onChange={v => setForm({ ...form, base_unit: v })} placeholder="" required createUrl="/foundation/uom" createCode="EUOC" companyCode={companyCode} />
                    <p className="text-[10px] text-zinc-400">Base unit FK – KG/PC/BOX via EUOC</p>
                  </div>
                  <div className="space-y-1">
                    <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>PRODUCT_CATEGORY</label>
                    <DbAutocomplete label="" apiUrl="/api/material-categories" dataKey="materialCategories" codeField="code" value={form.category_code} onChange={v => setForm({ ...form, category_code: v })} placeholder="" createUrl="/foundation/material-categories" createCode="EMGC" companyCode={companyCode} />
                    <p className="text-[10px] text-zinc-400">Category FK – EMGC</p>
                  </div>
                  {renderInput('description_long', 'DESCRIPTION_LONG', { type: 'textarea', desc: 'Long text for SO/PO print' })}
                </div>
              )}
            </div>

            <div className={modern ? "bg-zinc-50 rounded-xl p-4 border" : "border p-3"}>
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCollapse('basic_lot')}>
                <h3 className={modern ? "font-semibold text-sm" : "font-bold text-xs"}>Lot / Batch & Expiry</h3>
                <span className="text-xs">{collapsed['basic_lot'] ? '▶' : '▼'}</span>
              </div>
              {!collapsed['basic_lot'] && (
                <div className={modern ? "grid grid-cols-1 md:grid-cols-3 gap-4 mt-4" : "grid grid-cols-3 gap-2 mt-2"}>
                  {renderInput('is_lot_managed', 'IS_LOT_MANAGED', { options: ['true','false'], desc: 'Was is_batch_managed – true for expiry tracking' })}
                  {renderInput('shelf_life_days', 'SHELF_LIFE_DAYS', { desc: 'e.g., 30 – used in lot expiry calc' })}
                  {renderInput('lot_control', 'LOT_CONTROL', { options: ['BLOCKED','WARN','RESTRICTED'], desc: 'Expiry control – BLOCKED blocks GI if expired' })}
                  {renderInput('barcode', 'BARCODE / EAN', { desc: 'For POS, GR scanning' })}
                  {renderInput('hsn_code', 'HSN_CODE', { desc: 'India GST HSN – FTXC tax determination' })}
                  {renderInput('landed_cost_scope', 'LANDED_COST_SCOPE', { options: ['NONE','FREIGHT','CUSTOMS','FREIGHT_CUSTOMS','ALL'], desc: 'Landed cost relevance' })}
                </div>
              )}
            </div>
          </div>
        );
      case 'purchasing':
        return (
          <div className="space-y-6">
            <div className={modern ? "bg-blue-50/50 rounded-xl p-4 border border-blue-100" : "border p-3"}>
              <h3 className={modern ? "font-semibold text-sm text-blue-900" : "font-bold text-xs"}>Purchasing View – Plant Dependent</h3>
              <p className="text-[11px] text-zinc-500 mt-1">These fields are stored in prod_facility_profile – per facility. Used in PR/PO creation.</p>
              <div className={modern ? "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" : "grid grid-cols-2 gap-2 mt-2"}>
                {renderInput('purchasing_group', 'PURCHASING_GROUP / BUYER_GROUP', { desc: 'K01/001 – buyer group – was purchasing_group' })}
                {renderInput('buyer_group', 'BUYER_GROUP', { desc: 'BUY-001 – alias for purchasing_group' })}
                {renderInput('procurement_division', 'PROCUREMENT_DIVISION / PURCHASING_ORG', { desc: 'PD-1000 / KPO1 – purchasing org' })}
                {renderInput('procurement_method', 'PROCUREMENT_TYPE', { options: ['BUY','MAKE','BOTH','TRANSFER'], desc: 'F=Buy, E=Make, X=Both – determines MRP creates PR or Planned Order' })}
                {renderInput('special_procurement_method', 'SPECIAL_PROCUREMENT', { desc: '40 = stock transfer, etc.' })}
                {renderInput('is_quality_active', 'IS_QUALITY_ACTIVE / QM_ACTIVE', { options: ['true','false'], desc: 'QM active for GR inspection' })}
              </div>
            </div>
          </div>
        );
      case 'mrp':
        return (
          <div className="space-y-6">
            <div className={modern ? "bg-amber-50/50 rounded-xl p-4 border border-amber-100" : "border p-3"}>
              <h3 className={modern ? "font-semibold text-sm text-amber-900" : "font-bold text-xs"}>MRP View – MRP1 to MRP4</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Used in MD01 MRP run, MD04 stock/requirements list.</p>
              <div className={modern ? "grid grid-cols-1 md:grid-cols-3 gap-4 mt-4" : "grid grid-cols-3 gap-2 mt-2"}>
                {renderInput('planning_type', 'MRP_TYPE / PLANNING_TYPE', { options: ['MRP','MANUAL_REORDER','NO_PLANNING','REORDER_POINT','FORECAST'], desc: 'PD=MRP, VB=Manual, ND=No Planning' })}
                {renderInput('planning_controller', 'MRP_CONTROLLER / PLANNING_CONTROLLER', { desc: 'CTRL-001 – MRP controller' })}
                {renderInput('lot_sizing', 'LOT_SIZE / LOT_SIZING', { options: ['LOT_FOR_LOT','FIXED','MAX_LEVEL','REPLENISH'], desc: 'EX=Lot-for-lot, FX=Fixed' })}
                {renderInput('min_lot_size', 'MIN_LOT_SIZE', { desc: 'Minimum procurement qty' })}
                {renderInput('max_lot_size', 'MAX_LOT_SIZE', { desc: 'Maximum procurement qty' })}
                {renderInput('fixed_lot_size', 'FIXED_LOT_SIZE', { desc: 'Fixed lot qty if lot_sizing=FIXED' })}
                {renderInput('safety_stock', 'SAFETY_STOCK', { desc: 'Safety stock – MD04 net req = gross - safety - stock' })}
                {renderInput('reorder_point', 'REORDER_POINT', { desc: 'If stock < reorder point → PR' })}
                {renderInput('procurement_method', 'PROCUREMENT_METHOD_MRP', { options: ['BUY','MAKE','BOTH'], desc: 'Duplicate for MRP view' })}
              </div>
            </div>
          </div>
        );
      case 'storage':
        return (
          <div className="space-y-6">
            <div className={modern ? "bg-emerald-50/50 rounded-xl p-4 border border-emerald-100" : "border p-3"}>
              <h3 className={modern ? "font-semibold text-sm text-emerald-900" : "font-bold text-xs"}>Storage View + Plant Extension – MMSC-like</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Select facilities to extend material to. SAP: MM01 creates for one plant, MMSC extends to others. Here multi-select in one save.</p>
              
              <div className="mt-4">
                <label className={modern ? "text-xs font-medium text-zinc-700" : "text-[11px] font-medium"}>FACILITY_CODES / PLANT_CODES * (Multi-select – like MMSC)</label>
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
                <p className="text-[10px] text-zinc-400 mt-2">Selected: {(form.facility_codes || []).join(', ') || 'None – will default to FAC-1000 / first facility'} – Creates prod_facility_profile per facility</p>
              </div>

              <div className={modern ? "grid grid-cols-1 md:grid-cols-2 gap-4 mt-6" : "grid grid-cols-2 gap-2 mt-4"}>
                {renderInput('shelf_life_days', 'SHELF_LIFE (Storage)', { desc: 'Storage shelf life override' })}
                {renderInput('is_lot_managed', 'STORAGE LOT MANAGED', { options: ['true','false'], desc: 'Lot managed at storage level' })}
              </div>
            </div>
          </div>
        );
      case 'accounting':
        return (
          <div className="space-y-6">
            <div className={modern ? "bg-red-50/50 rounded-xl p-4 border border-red-200" : "border-2 border-red-200 p-3"}>
              <h3 className={modern ? "font-semibold text-sm text-red-900" : "font-bold text-xs text-red-800"}>Accounting View – T0 BLOCKING – BSX/WRX/PRD</h3>
              <p className="text-[11px] text-red-600/80 mt-1">⚠️ T0 BLOCKING – valuation_class determines BSX GL via OBYC (GR 101), price_control determines PRD price diff. If missing, GR cannot post.</p>
              <div className={modern ? "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" : "grid grid-cols-2 gap-2 mt-2"}>
                {renderInput('inventory_valuation_class', 'VALUATION_CLASS *', { required: true, options: ['RAW','FINISHED','SEMI','TRADING','PACKAGING','CONSUMABLE','SERVICE'], desc: 'Determines BSX GL – RAW→5000000001, FINISHED→5000000002 via OBYC' })}
                {renderInput('pricing_method', 'PRICE_CONTROL *', { required: true, options: ['STANDARD','MOVING_AVG'], desc: 'S=Standard (PRD diff), V=Moving Avg (MAP recalc on GR)' })}
                {renderInput('moving_avg_price', 'MOVING_AVG_PRICE *', { required: true, desc: 'MAP – (old qty*old MAP + GR qty*PO price)/new qty – T0' })}
                {renderInput('standard_price', 'STANDARD_PRICE *', { required: true, desc: 'Standard – used when price_control=STANDARD, diff → PRD' })}
                {renderInput('price_unit', 'PRICE_UNIT', { desc: 'Price unit – e.g., 1, 1000 – for costing' })}
              </div>
            </div>
          </div>
        );
      case 'costing':
        return (
          <div className="space-y-6">
            <div className={modern ? "bg-purple-50/50 rounded-xl p-4 border border-purple-100" : "border p-3"}>
              <h3 className={modern ? "font-semibold text-sm text-purple-900" : "font-bold text-xs"}>Costing View – CK40N, CK11N</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Used in product costing, BOM+Routing rollup.</p>
              <div className={modern ? "grid grid-cols-1 md:grid-cols-3 gap-4 mt-4" : "grid grid-cols-3 gap-2 mt-2"}>
                {renderInput('costing_lot_size', 'COSTING_LOT_SIZE', { desc: 'Lot size for costing – e.g., 1, 100' })}
                {renderInput('overhead_group', 'OVERHEAD_GROUP', { desc: 'Overhead group for costing' })}
                {renderInput('price_unit', 'PRICE_UNIT_COSTING', { desc: 'Price unit for costing' })}
                {renderInput('standard_price', 'STANDARD_PRICE_COSTING', { desc: 'Standard price for costing rollup' })}
                {renderInput('moving_avg_price', 'MOVING_AVG_COSTING', { desc: 'MAP for costing' })}
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
        {/* Header */}
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
          <p className={modern ? "text-xs text-zinc-500 mt-1" : "text-[11px] text-zinc-500"}>Create Product – product master SKU – Phase 0 T0 BLOCKING – valuation_class determines BSX GL via OBYC (GR 101), price_control determines PRD price diff – strict usage: used in PR PO GR IV SO DL BL BOM Routing Costing – NO DANGLING – Auto number from MAT-01 range if blank</p>
          
          {/* Mode Tabs */}
          <div className={modern ? "flex gap-2 mt-4" : "flex gap-1 mt-3"}>
            {(['create','list','change'] as const).map(m => (
              <Link key={m} href={`/${companyCode}/foundation/materials?mode=${m}`} className={modern ? `px-4 py-2 rounded-full text-xs font-medium border transition ${mode===m ? 'bg-black text-white border-black' : 'bg-white hover:bg-zinc-50'}` : `px-3 py-1 text-xs border ${mode===m ? 'bg-black text-white' : 'bg-white'}`}>{m.toUpperCase()}</Link>
            ))}
          </div>
        </div>

        {message && <div className={modern ? "bg-white border rounded-xl p-3 text-xs" : "border p-2 text-xs"}>{message}</div>}

        {/* CREATE MODE */}
        {mode === 'create' && (
          <form onSubmit={handleSubmit} className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-6" : "border p-4 space-y-4"}>
            {/* View Tabs */}
            <div className={modern ? "flex gap-2 border-b pb-3 overflow-x-auto" : "flex gap-1 border-b pb-2 overflow-x-auto"}>
              {TABS.map(t => (
                <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} className={modern ? `px-4 py-2 rounded-full text-xs font-medium border whitespace-nowrap transition ${activeTab===t.key ? 'bg-black text-white border-black' : 'bg-zinc-50 hover:bg-zinc-100'}` : `px-3 py-1 text-xs border whitespace-nowrap ${activeTab===t.key ? 'bg-black text-white' : 'bg-white'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-zinc-400">{TABS.find(t=>t.key===activeTab)?.desc}</p>

            {renderTabContent()}

            <div className="flex gap-2 pt-4 border-t">
              <button type="submit" className={modern ? "px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-zinc-800" : "px-4 py-1.5 bg-black text-white text-xs"}>Create Product – EMTC</button>
              <button type="button" onClick={() => setForm(initialForm)} className={modern ? "px-4 py-2.5 rounded-full border text-sm" : "px-3 py-1.5 border text-xs"}>Clear</button>
              <span className="text-[10px] text-zinc-400 self-center">Auto number from MAT-01 if PRODUCT_CODE blank – facilities: {(form.facility_codes||[]).length || 'default FAC-1000'}</span>
            </div>
          </form>
        )}

        {/* LIST MODE */}
        {mode === 'list' && (
          <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-4" : "border p-4 space-y-3"}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input value={listSearch} onChange={e => { setListSearch(e.target.value); setShowListSuggestions(true); }} onFocus={() => setShowListSuggestions(true)} onBlur={() => setTimeout(() => setShowListSuggestions(false), 200)} placeholder="Search by code or name – e.g., MAT-1000, Spice" className={modern ? "w-full border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10" : "w-full border px-2 py-1.5 text-xs"} />
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

        {/* CHANGE MODE */}
        {mode === 'change' && (
          <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-4" : "border p-4 space-y-3"}>
            <div className="relative">
              <input value={changeSearch} onChange={e => { setChangeSearch(e.target.value); setShowChangeSuggestions(true); }} onFocus={() => setShowChangeSuggestions(true)} onBlur={() => setTimeout(() => setShowChangeSuggestions(false), 200)} placeholder="Search material to change – e.g., MAT-1000 – shows 20 max, filter as you type" className={modern ? "w-full border-2 border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10" : "w-full border px-2 py-1.5 text-xs"} />
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
                <h3 className={modern ? "font-semibold text-sm" : "font-bold text-xs"}>Change {selectedCode} – {TABS.find(t=>t.key===activeTab)?.label}</h3>
                <div className={modern ? "flex gap-2 border-b pb-3 overflow-x-auto" : "flex gap-1 border-b pb-2 overflow-x-auto"}>
                  {TABS.map(t => (
                    <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} className={modern ? `px-4 py-2 rounded-full text-xs font-medium border whitespace-nowrap ${activeTab===t.key ? 'bg-black text-white border-black' : 'bg-zinc-50'}` : `px-3 py-1 text-xs border whitespace-nowrap ${activeTab===t.key ? 'bg-black text-white' : 'bg-white'}`}>{t.label}</button>
                  ))}
                </div>
                {renderTabContent()}
                <div className="flex gap-2 pt-4 border-t">
                  <button type="submit" className={modern ? "px-6 py-2.5 rounded-full bg-black text-white text-sm" : "px-4 py-1.5 bg-black text-white text-xs"}>Update Product – {selectedCode}</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Related Links */}
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
