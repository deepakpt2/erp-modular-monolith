"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { VirtualDataGrid } from '@/shared/ui/virtual-data-grid';
import { ColumnDef } from '@tanstack/react-table';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

const TABS = [
  { id: 'basic1', label: 'Basic Data 1', code: 'EMTC', alias: 'MTC, MM01', desc: 'Item type, base unit, category, lot control, shelf life – legal-safe Basic 1 view (was Material type, UoM, group, batch)' },
  { id: 'basic2', label: 'Basic Data 2', code: 'EMTC', alias: 'MTC, MM01', desc: 'Weight, volume, barcode, long text, HSN code – legal-safe' },
  { id: 'commercial', label: 'Commercial 1/2', code: 'EMTC', alias: 'MM01 Sales', desc: 'Commercial org, sales channel, product line, tax, pricing – legal-safe (was Sales Org, channel, division)' },
  { id: 'procurement', label: 'Procurement', code: 'EMTC', alias: 'MM01 Purch', desc: 'Buyer group, procurement division, valuation class, landed cost – legal-safe (was Purch group, purch org)' },
  { id: 'planning', label: 'Planning 1-4', code: 'EMTC', alias: 'MM01 MRP', desc: 'Planning type, controller, lot sizing, safety stock, reorder point – legal-safe (was MRP type, controller, lot size)' },
  { id: 'facility', label: 'Facility/Location', code: 'EMTC', alias: 'MM01 Plant', desc: 'Facility, inventory location, safety stock, lot control, lot – legal-safe (was Plant, SLoc, batch)' },
  { id: 'accounting', label: 'Accounting 1/2', code: 'EMTC', alias: 'MM01 Acct', desc: 'Valuation class, pricing method STANDARD/MOVING_AVG, MAP, standard price, BSX/WRX – legal-safe (was price control V/S)' },
  { id: 'costing', label: 'Costing', code: 'EMTC', alias: 'MM01 Cost', desc: 'Costing lot size, overhead, cost unit – legal-safe (was cost center)' },
];

export default function MaterialsPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const [materials, setMaterials] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('db');
  const [showAdd, setShowAdd] = useState(mode === 'create');
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('basic1');
  const [message, setMessage] = useState('');
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeForm, setNewTypeForm] = useState({ code: '', name: '', description: '' });
  const [showNewUom, setShowNewUom] = useState(false);
  const [newUomForm, setNewUomForm] = useState({ code: '', name: '', dimension: 'QUANTITY' });
  const [form, setForm] = useState({
    item_number: '', material_number: '', description: '', description_long: '', type: 'RAW', base_unit: 'KG', base_uom: 'KG',
    category_code: 'FOOD', group_code: 'FOOD', shelf_life_days: 30, lot_control: 'BLOCKED', expiry_control: 'BLOCKED', is_kit: false, is_phantom_kit: false,
    inventory_valuation_class: 'RAW', valuation_class: 'RAW', is_hazardous: false, is_lot_managed: true, is_batch_managed: true, landed_cost_scope: 'ALL', landed_cost_relevance: 'ALL',
    commercial_org: 'CO-1000', sales_org: '1000', sales_channel: 'CH-10', distribution_channel: '10', product_line: 'PL-00', division: '00', commercial_unit: 'KG', sales_uom: 'KG',
    tax_classification: 'FULL', account_assignment_group: '01', item_category_group: 'STANDARD',
    buyer_group: 'BUY-001', purchasing_group: '001', procurement_division: 'PD-1000', purchasing_org: '1000', planning_type: 'MRP', mrp_type: 'MRP', planning_controller: 'CTRL-001', mrp_controller: '001',
    lot_sizing: 'LOT_FOR_LOT', lot_size: 'LOT_FOR_LOT', procurement_method: 'BUY', procurement_type: 'BUY', special_procurement_method: '', special_procurement: '', safety_stock: '10', reorder_point: '50',
    facility_id: '', plant_id: '', inventory_location_id: '', sloc_id: '', is_quality_active: false, qm_active: false, pricing_method: 'MOVING_AVG', price_control: 'MOVING_AVG', moving_avg_price: '0', standard_price: '0',
    price_unit: '1', costing_lot_size: '100', overhead_group: '', cost_unit: '', cost_center: '', profit_unit: '', profit_center: '',
    weight: '1', weight_unit: 'KG', volume: '1', volume_unit: 'L', barcode: '', ean: '', hsn_code: '',
  });

  async function load() {
    setLoading(true);
    try {
      const [matRes, facRes, typeRes, uomRes] = await Promise.all([
        fetch(`/api/materials?limit=200&search=${encodeURIComponent(search)}`).then(r=>r.json()),
        fetch(`/api/facilities?limit=100`).then(r=>r.json()).catch(()=>fetch(`/api/plants?limit=100`).then(r=>r.json()).catch(()=>({data:[],plants:[]}))),
        fetch(`/api/material-types`).then(r=>r.json()).catch(()=>({productTypes:[],materialTypes:[]})),
        fetch(`/api/uom`).then(r=>r.json()).catch(()=>({uoms:[]})),
      ]);
      setMaterials(matRes.materials || []);
      setFacilities(facRes.data || facRes.plants || []);
      setProductTypes(typeRes.productTypes || typeRes.materialTypes || [{code:'RAW',name:'Raw Material'},{code:'SEMI',name:'Semi-Finished'},{code:'FINISHED',name:'Finished'}]);
      setUoms(uomRes.uoms || [{code:'KG',name:'Kilogram'},{code:'PC',name:'Piece'}]);
      setSource(matRes.source || 'db');
    } catch(e){ console.error(e); }
    setLoading(false);
  }

  useEffect(()=>{ load(); },[]);
  useEffect(()=>{ const t=setTimeout(load,400); return()=>clearTimeout(t); },[search]);

  const filtered = useMemo(()=> materials, [materials]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/materials', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) }).then(r=>r.json());
      if (res.success) {
        setMessage(`✅ ${res.item?.item_number || res.material?.material_number || form.item_number || form.material_number} created – ${res.code || 'EMTC'} (alias ${res.aliasCodes?.join(', ') || 'MTC, MM01'}) – Type ${form.type} BaseUnit ${form.base_unit} – legal-safe ${res.legalSafe ? 'own IP' : 'legacy migrating'}`);
        setShowAdd(false);
        load();
      } else setMessage(`❌ ${res.error}`);
    } catch(e:any){ setMessage(`❌ ${e.message}`); }
  };

  const handleDeleteMaterial = async (mat:any) => {
    const m = mat || selectedMaterial;
    if (!m) { setMessage('Select a product first'); return; }
    const num = m.item_number || m.material_number;
    if (!confirm(`Delete product ${num}? – ${m.description}`)) return;
    try {
      const res = await fetch(`/api/materials?item_number=${encodeURIComponent(num)}`,{method:'DELETE'}).then(r=>r.json());
      setMessage(res.success ? `✅ ${res.message}` : `❌ ${res.error}`);
      load();
    } catch(e:any){ setMessage(`❌ ${e.message}`); }
  };

  const columns = useMemo<ColumnDef<any, any>[]>(()=>[
    { accessorKey:'item_number', header:'Item No – EMTC', size:140, cell:({row}:any)=>{ const v=row.original.item_number||row.original.material_number; return <span className="font-mono font-medium">{v}</span>; } },
    { accessorKey:'description', header:'Description', size:200 },
    { accessorKey:'type', header:'Type EMTP (alias OMS2)', size:90, cell:({getValue})=>{ const v=getValue(); return <span className="px-2 py-0.5 rounded-full border text-xs bg-zinc-50 font-mono">{v} <span className="text-zinc-400 text-[10px]">{v==='RAW'?'ROH':v==='FINISHED'?'FERT':v==='SEMI'?'HALB':''}</span></span>; }},
    { accessorKey:'base_unit', header:'Base Unit EUOC (alias CUNI)', size:80, cell:({row}:any)=>{ const v=row.original.base_unit||row.original.base_uom; return <span className="font-mono text-xs">{v}</span>; } },
    { accessorKey:'group_code', header:'Category', size:80, cell:({row}:any)=> row.original.group_code||'FOOD' },
    { accessorKey:'moving_avg_price', header:'MAP', size:80 },
    { accessorKey:'total_stock_qty', header:'Stock', size:80 },
  ],[]);

  const currentTitle = mode === 'change' ? 'Change Product' : mode === 'display' ? 'Display Product' : mode === 'create' ? 'Create Product' : 'Product Catalog – EMTC';
  const currentCode = mode === 'change' ? 'EMTE' : mode === 'display' ? 'EMTV' : mode === 'create' ? 'EMTC' : 'EMTL';
  const aliasCodes = mode === 'change' ? ['MTE','MM02'] : mode === 'display' ? ['MTV','MM03'] : mode === 'create' ? ['MTC','MM01','FND-MAT-CR'] : ['MTL','MM60'];

  if (loading) return <div className="p-6 text-sm text-zinc-500">Loading product catalog EMTC (alias MM01)...</div>;

  return (
    <ModernModuleShell title={currentTitle} subtitle={`${filtered.length} products • ${source} • Types:${productTypes.length} Units:${uoms.length} – ${currentCode} (alias ${aliasCodes.join(', ')}) – legal-safe own IP`} code={currentCode} module="FOUNDATION" tooltip={`EMTC Create Product – Legal-safe own IP (was MM01) – Actual implementation: Basic 1/2, Commercial 1/2 (was Sales Org), Procurement (was Purchasing), Planning 1-4 (was MRP 1-4), Facility/Location (was Plant/Storage), Accounting 1/2, Costing – each tab has real fields but legal-safe names: item_number (was material_number), base_unit (was base_uom), category (was group), is_lot_managed (was is_batch_managed), lot_control BLOCKED/WARN/RESTRICTED (was expiry_control BLOCK/WARNING/RESTRICTED_USE), pricing_method STANDARD/MOVING_AVG (was price_control S/V), planning_type MRP/MANUAL_REORDER/NO_PLANNING (was mrp_type PD/ND/VB), lot_sizing LOT_FOR_LOT/FIXED (was lot_size EX/FX), procurement_method BUY/MAKE/BOTH (was procurement_type F/E/X), buyer_group (was purchasing_group), procurement_division (was purchasing_org), commercial_org (was sales_org), sales_channel (was distribution_channel), product_line (was division), fulfilling_facility (was delivering_plant), quality_control_key (was qm_control_key), inspection_type RECEIPT (was 01), is_quality_active (was is_qm_active). Product Types EMTP configurable RAW/FINISHED/SEMI (was ROH/FERT/HALB OMS2), UoM EUOC configurable KG/L/PC/BOX (was CUNI). Code ${currentCode} primary alias ${aliasCodes.join(', ')} – 4-char MOOA E=Enterprise, MT=Material, C/E/V/L=Create/Edit/View/List – same length as MM01 but own IP, module grouped, intuitive – both_exact search, exact first partial then – helper codes kept as-is and auto-generate.`} kpis={[
      {label:'Total', value: materials.length.toString(), icon:'📦'},
      {label:`Types ${'EMTP'}`, value: productTypes.length.toString(), icon:'🏷️'},
      {label:`Units ${'EUOC'}`, value: uoms.length.toString(), icon:'⚖️'},
    ]}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search products EMTC alias MM01... (try RAW, FINISHED, KG, FOOD)`} className="border rounded-full px-4 py-2 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-black" />
          <button onClick={load} className="text-xs border rounded-full px-3 py-2 hover:bg-zinc-50 bg-white">Refresh – {currentCode}</button>
          <Link href="/1000/foundation/material-types" className="text-xs border rounded-full px-3 py-2 bg-white hover:bg-zinc-50">EMTP Product Types (alias OMS2) →</Link>
          <Link href="/1000/foundation/uom" className="text-xs border rounded-full px-3 py-2 bg-white hover:bg-zinc-50">EUOC Units (alias CUNI) →</Link>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>selectedMaterial && handleDeleteMaterial(selectedMaterial)} className="text-xs border border-red-200 text-red-600 rounded-full px-3 py-2 bg-white">Delete – {currentCode}</button>
          <button onClick={()=>setShowAdd(true)} className="text-sm bg-black text-white rounded-full px-4 py-2">+ New Product – {currentCode} (alias {aliasCodes[0]})</button>
        </div>
      </div>

      {message && <div className="mb-4 p-3 bg-zinc-900 text-white rounded-xl text-sm">{message}</div>}

      <div className="bg-white rounded-2xl border overflow-hidden">
        <VirtualDataGrid data={filtered} columns={columns} height={400} rowHeight={36} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>{ setSelectedMaterial(r); }} />
      </div>
      {selectedMaterial && <div className="mt-2 text-xs text-zinc-500">Selected: {selectedMaterial.item_number||selectedMaterial.material_number} – {selectedMaterial.description} – Type {selectedMaterial.type} (alias {selectedMaterial.type==='RAW'?'ROH':selectedMaterial.type==='FINISHED'?'FERT':selectedMaterial.type==='SEMI'?'HALB':''}) – <button onClick={()=>handleDeleteMaterial(selectedMaterial)} className="underline text-red-600">Delete – {currentCode}</button></div>}

      <div className="mt-3 bg-zinc-50 border rounded-xl p-3 text-[11px]">
        <div className="font-medium">Legal-Safe Mapping – Module 2 Product Catalog – EMTC primary alias MTC/MM01/FND-MAT-CR</div>
        <div className="mt-1 grid grid-cols-3 gap-2">
          <div>ent_material_master → prod_item – material_number → item_number</div>
          <div>ent_material_group → prod_category – group → category</div>
          <div>ent_uom → core_unit_measure – base_uom → base_unit – EUOC alias CUNI</div>
          <div>ent_material_type → prod_item_type – ROH→RAW, FERT→FINISHED, HALB→SEMI – EMTP alias OMS2</div>
          <div>ent_material_plant → prod_facility_profile – plant_id → facility_id</div>
          <div>ent_material_sales → prod_commercial_profile – sales_org → commercial_org</div>
          <div>price_control S/V → pricing_method STANDARD/MOVING_AVG</div>
          <div>expiry_control BLOCK/WARNING → lot_control BLOCKED/WARN</div>
          <div>mrp_type PD/ND/VB → planning_type MRP/NO_PLANNING/MANUAL_REORDER</div>
          <div>lot_size EX/FX → lot_sizing LOT_FOR_LOT/FIXED</div>
          <div>procurement_type F/E → procurement_method BUY/MAKE</div>
          <div>purchasing_group → buyer_group, purchasing_org → procurement_division</div>
          <div>ent_batch → inv_lot – batch_number → lot_number – LTCC alias Batch</div>
          <div>ent_material_classification → prod_item_classification</div>
          <div>ent_material_quality → prod_quality_profile – qm_control_key → quality_control_key</div>
          <div>Fresh empty for items, sample UoM/Category kept – INR default, sample data for convenience</div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={()=>setShowAdd(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border w-full max-w-5xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Create Product • {currentCode} (alias {aliasCodes.join(', ')}) – Legal-safe own IP – was MM01</h3>
              <button onClick={()=>setShowAdd(false)} className="text-zinc-400 hover:text-black">✕</button>
            </div>
            <div className="mt-4 flex gap-1 flex-wrap">
              {TABS.map(tab=>(
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`text-xs px-3 py-1.5 rounded-full border ${activeTab===tab.id?'bg-black text-white border-black':'bg-zinc-50 border-zinc-200'}`} title={`${tab.desc} – alias ${tab.alias}`}><span className="font-mono">{tab.code}</span> {tab.label} <span className="text-[10px] text-zinc-400">({tab.alias})</span></button>
              ))}
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-sm">
              {activeTab==='basic1' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Item Number – prod_item.item_number (was material_number MATNR) – Auto if blank</label><input value={form.item_number || form.material_number} onChange={e=>setForm({...form, item_number:e.target.value.toUpperCase(), material_number:e.target.value.toUpperCase()})} placeholder="Auto – ITEM-1000000010 (alias MAT-...)" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div>
                    <label className="text-xs text-zinc-500">Product Type – EMTP (alias MTP, OMS2) – Legal-safe RAW/FINISHED/SEMI (was ROH/FERT/HALB)</label>
                    <div className="flex gap-1 mt-1">
                      <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} className="w-full border rounded-xl px-3 py-2">
                        {productTypes.map((t:any)=><option key={t.code} value={t.code}>{t.code} – {t.name} {t.code==='RAW'?'(alias ROH)':t.code==='FINISHED'?'(alias FERT)':t.code==='SEMI'?'(alias HALB)':''}</option>)}
                      </select>
                      <button type="button" onClick={()=>setShowNewType(!showNewType)} className="border rounded-full px-2 text-xs whitespace-nowrap">+ EMTP New Type (alias OMS2)</button>
                    </div>
                    {showNewType && (
                      <div className="mt-2 border rounded-xl p-2 bg-zinc-50 space-y-2">
                        <input value={newTypeForm.code} onChange={e=>setNewTypeForm({...newTypeForm, code:e.target.value.toUpperCase()})} placeholder="Code e.g., RAW (alias ROH) – legal-safe" className="w-full border rounded-lg px-2 py-1 text-xs" />
                        <input value={newTypeForm.name} onChange={e=>setNewTypeForm({...newTypeForm, name:e.target.value})} placeholder="Name e.g., Raw Material" className="w-full border rounded-lg px-2 py-1 text-xs" />
                        <button type="button" onClick={async()=>{
                          const res=await fetch('/api/material-types',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newTypeForm)}).then(r=>r.json());
                          if(res.success){ setMessage(`✅ Product Type ${res.productType?.code || res.materialType.code} created – EMTP alias OMS2 – ${res.mapping||''}`); setShowNewType(false); load(); setForm({...form, type: res.productType?.code || res.materialType.code}); }
                          else setMessage(`❌ ${res.error}`);
                        }} className="w-full bg-black text-white rounded-full py-1 text-xs">Create Type – EMTP (alias OMS2)</button>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2"><label className="text-xs text-zinc-500">Description – prod_item.description (was MAKT)</label><input required value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Product description – legal-safe" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div>
                    <label className="text-xs text-zinc-500">Base Unit – EUOC (alias UOC, CUNI) – Legal-safe KG/L/PC/BOX (was Base UoM)</label>
                    <div className="flex gap-1 mt-1">
                      <select value={form.base_unit || form.base_uom} onChange={e=>setForm({...form, base_unit:e.target.value, base_uom:e.target.value})} className="w-full border rounded-xl px-3 py-2">
                        {uoms.map((u:any)=><option key={u.code} value={u.code}>{u.code} – {u.name}</option>)}
                      </select>
                      <button type="button" onClick={()=>setShowNewUom(!showNewUom)} className="border rounded-full px-2 text-xs">+ EUOC New Unit (alias CUNI)</button>
                    </div>
                    {showNewUom && (
                      <div className="mt-2 border rounded-xl p-2 bg-zinc-50 space-y-2">
                        <input value={newUomForm.code} onChange={e=>setNewUomForm({...newUomForm, code:e.target.value.toUpperCase()})} placeholder="Code e.g., M – legal-safe" className="w-full border rounded-lg px-2 py-1 text-xs" />
                        <input value={newUomForm.name} onChange={e=>setNewUomForm({...newUomForm, name:e.target.value})} placeholder="Name e.g., Meter" className="w-full border rounded-lg px-2 py-1 text-xs" />
                        <button type="button" onClick={async()=>{
                          const res=await fetch('/api/uom',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newUomForm)}).then(r=>r.json());
                          if(res.success){ setMessage(`✅ UoM ${res.uom.code} created – EUOC alias CUNI`); setShowNewUom(false); load(); setForm({...form, base_unit: res.uom.code, base_uom: res.uom.code}); }
                          else setMessage(`❌ ${res.error}`);
                        }} className="w-full bg-black text-white rounded-full py-1 text-xs">Create Unit – EUOC (alias CUNI)</button>
                      </div>
                    )}
                  </div>
                  <div><label className="text-xs text-zinc-500">Product Category – prod_category.code (was Material Group OMSF) – FOOD/SPICE/KITS sample kept</label><select value={form.category_code || form.group_code} onChange={e=>setForm({...form, category_code:e.target.value, group_code:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>FOOD</option><option>SPICE</option><option>KITS</option><option>FG</option><option>RAW</option><option>PACK</option></select></div>
                  <div><label className="text-xs text-zinc-500">Shelf Life Days – prod_item.shelf_life_days</label><input type="number" value={form.shelf_life_days} onChange={e=>setForm({...form, shelf_life_days: parseInt(e.target.value)||0})} className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Lot Control – prod_item.lot_control BLOCKED/WARN/RESTRICTED (was expiry_control BLOCK/WARNING/RESTRICTED_USE)</label><select value={form.lot_control || form.expiry_control} onChange={e=>setForm({...form, lot_control:e.target.value, expiry_control:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>BLOCKED – alias BLOCK</option><option>WARN – alias WARNING</option><option>RESTRICTED – alias RESTRICTED_USE</option></select></div>
                  <div className="flex gap-2 items-center mt-6"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={form.is_lot_managed || form.is_batch_managed} onChange={e=>setForm({...form, is_lot_managed:e.target.checked, is_batch_managed:e.target.checked})} /> Lot Managed (was Batch Managed)</label><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={form.is_hazardous} onChange={e=>setForm({...form, is_hazardous:e.target.checked})} /> Hazardous</label></div>
                  <div className="flex gap-2 items-center"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={form.is_kit} onChange={e=>setForm({...form, is_kit:e.target.checked})} /> Is Kit</label><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={form.is_phantom_kit} onChange={e=>setForm({...form, is_phantom_kit:e.target.checked})} /> Phantom Kit</label></div>
                  <div><label className="text-xs text-zinc-500">HSN Code – prod_item.hsn_code – India GST HSN/SAC (new)</label><input value={form.hsn_code} onChange={e=>setForm({...form, hsn_code:e.target.value})} placeholder="HSN e.g., 0910" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                </div>
              )}

              {activeTab==='basic2' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="text-xs text-zinc-500">Long Description – prod_item.description_long</label><textarea value={form.description_long} onChange={e=>setForm({...form, description_long:e.target.value})} placeholder="Long text for product – legal-safe" className="mt-1 w-full border rounded-xl px-3 py-2 h-20" /></div>
                  <div><label className="text-xs text-zinc-500">Weight – prod_item.weight</label><input value={form.weight} onChange={e=>setForm({...form, weight:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Weight Unit – EUOC</label><select value={form.weight_unit} onChange={e=>setForm({...form, weight_unit:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>KG</option><option>G</option><option>TON</option></select></div>
                  <div><label className="text-xs text-zinc-500">Volume – prod_item.volume</label><input value={form.volume} onChange={e=>setForm({...form, volume:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Volume Unit – EUOC</label><select value={form.volume_unit} onChange={e=>setForm({...form, volume_unit:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>L</option><option>ML</option><option>M3</option></select></div>
                  <div className="col-span-2"><label className="text-xs text-zinc-500">Barcode – prod_item.barcode (was EAN/UPC)</label><input value={form.barcode || form.ean} onChange={e=>setForm({...form, barcode:e.target.value, ean:e.target.value})} placeholder="Barcode – legal-safe" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                </div>
              )}

              {activeTab==='commercial' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Commercial Org – prod_commercial_profile.commercial_org (was Sales Organization VKORG) – CO-1000</label><input value={form.commercial_org || form.sales_org} onChange={e=>setForm({...form, commercial_org:e.target.value, sales_org:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="CO-1000 alias 1000" /></div>
                  <div><label className="text-xs text-zinc-500">Sales Channel – sales_channel CH-10 (was Distribution Channel VTWEG) – 10</label><input value={form.sales_channel || form.distribution_channel} onChange={e=>setForm({...form, sales_channel:e.target.value, distribution_channel:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="CH-10 alias 10" /></div>
                  <div><label className="text-xs text-zinc-500">Product Line – product_line PL-00 (was Division SPART) – 00</label><input value={form.product_line || form.division} onChange={e=>setForm({...form, product_line:e.target.value, division:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="PL-00 alias 00" /></div>
                  <div><label className="text-xs text-zinc-500">Commercial Unit – EUOC (was Sales UoM)</label><select value={form.commercial_unit || form.sales_uom} onChange={e=>setForm({...form, commercial_unit:e.target.value, sales_uom:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2">{uoms.map((u:any)=><option key={u.code} value={u.code}>{u.code}</option>)}</select></div>
                  <div><label className="text-xs text-zinc-500">Tax Classification – FULL/EXEMPT (was TATY 0/1)</label><input value={form.tax_classification} onChange={e=>setForm({...form, tax_classification:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="FULL – alias 1 Full tax" /></div>
                  <div><label className="text-xs text-zinc-500">Account Assignment Group – KTGRM</label><input value={form.account_assignment_group} onChange={e=>setForm({...form, account_assignment_group:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="01" /></div>
                  <div><label className="text-xs text-zinc-500">Item Category Group – STANDARD (was MTPOS NORM)</label><input value={form.item_category_group} onChange={e=>setForm({...form, item_category_group:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="STANDARD alias NORM" /></div>
                </div>
              )}

              {activeTab==='procurement' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Buyer Group – prod_facility_profile.buyer_group (was Purchasing Group EKGRP) – BUY-001 alias 001</label><input value={form.buyer_group || form.purchasing_group} onChange={e=>setForm({...form, buyer_group:e.target.value, purchasing_group:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="BUY-001 alias 001" /></div>
                  <div><label className="text-xs text-zinc-500">Procurement Division – procurement_division PD-1000 (was Purchasing Organization EKORG) – 1000</label><input value={form.procurement_division || form.purchasing_org} onChange={e=>setForm({...form, procurement_division:e.target.value, purchasing_org:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="PD-1000 alias 1000" /></div>
                  <div><label className="text-xs text-zinc-500">Inventory Valuation Class – RAW/FINISHED (was Valuation Class BKLAS ROH/FERT) – linked to BSX/WRX</label><input value={form.inventory_valuation_class || form.valuation_class} onChange={e=>setForm({...form, inventory_valuation_class:e.target.value, valuation_class:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="RAW alias ROH – linked to BSX/WRX" /></div>
                  <div><label className="text-xs text-zinc-500">Landed Cost Scope – ALL/NONE/FREIGHT (was Landed Cost Relevance)</label><select value={form.landed_cost_scope || form.landed_cost_relevance} onChange={e=>setForm({...form, landed_cost_scope:e.target.value, landed_cost_relevance:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>ALL</option><option>NONE</option><option>FREIGHT</option><option>CUSTOMS</option></select></div>
                </div>
              )}

              {activeTab==='planning' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Planning Type – prod_facility_profile.planning_type MRP/MANUAL_REORDER/NO_PLANNING (was MRP Type DISMM PD/ND/VB)</label><select value={form.planning_type || form.mrp_type} onChange={e=>setForm({...form, planning_type:e.target.value, mrp_type:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>MRP – alias PD</option><option>NO_PLANNING – alias ND</option><option>MANUAL_REORDER – alias VB</option><option>REORDER_POINT – alias VM</option></select></div>
                  <div><label className="text-xs text-zinc-500">Planning Controller – planning_controller CTRL-001 (was MRP Controller DISPO 001)</label><input value={form.planning_controller || form.mrp_controller} onChange={e=>setForm({...form, planning_controller:e.target.value, mrp_controller:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="CTRL-001 alias 001" /></div>
                  <div><label className="text-xs text-zinc-500">Lot Sizing – lot_sizing LOT_FOR_LOT/FIXED/MAX_LEVEL (was Lot Size DISLS EX/FX/HB)</label><select value={form.lot_sizing || form.lot_size} onChange={e=>setForm({...form, lot_sizing:e.target.value, lot_size:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>LOT_FOR_LOT – alias EX</option><option>FIXED – alias FX</option><option>MAX_LEVEL – alias HB</option></select></div>
                  <div><label className="text-xs text-zinc-500">Procurement Method – procurement_method BUY/MAKE/BOTH (was Procurement Type BESKZ F/E/X)</label><select value={form.procurement_method || form.procurement_type} onChange={e=>setForm({...form, procurement_method:e.target.value, procurement_type:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>BUY – alias F External</option><option>MAKE – alias E In-house</option><option>BOTH – alias X Both</option></select></div>
                  <div><label className="text-xs text-zinc-500">Safety Stock – safety_stock (was EISBE)</label><input value={form.safety_stock} onChange={e=>setForm({...form, safety_stock:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="10" /></div>
                  <div><label className="text-xs text-zinc-500">Reorder Point – reorder_point (was MINBE)</label><input value={form.reorder_point} onChange={e=>setForm({...form, reorder_point:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="50" /></div>
                </div>
              )}

              {activeTab==='facility' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Facility – org_facility.code FAC-1000 (was Plant WERKS OX10) – Real DB</label><select value={form.facility_id || form.plant_id} onChange={e=>setForm({...form, facility_id:e.target.value, plant_id:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select Facility – Real DB (alias Plant)</option>{facilities.map((p:any)=><option key={p.id} value={p.id}>{p.code} – {p.name}</option>)}</select></div>
                  <div><label className="text-xs text-zinc-500">Inventory Location – org_inventory_location.code (was Storage Location LGORT OX09)</label><input value={form.inventory_location_id || form.sloc_id} onChange={e=>setForm({...form, inventory_location_id:e.target.value, sloc_id:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="Inventory Location ID or code – alias SLoc" /></div>
                  <div className="col-span-2"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.is_quality_active || form.qm_active} onChange={e=>setForm({...form, is_quality_active:e.target.checked, qm_active:e.target.checked})} /> Quality Active – prod_quality_profile.is_quality_active (was QM Active – Quality Management)</label></div>
                </div>
              )}

              {activeTab==='accounting' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Pricing Method – pricing_method STANDARD/MOVING_AVG (was Price Control VPRSV V/S) – V=Moving Average MAP, S=Standard</label><select value={form.pricing_method || form.price_control} onChange={e=>setForm({...form, pricing_method:e.target.value, price_control:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="MOVING_AVG">MOVING_AVG – alias V Moving Average MAP</option><option value="STANDARD">STANDARD – alias S Standard Price</option></select></div>
                  <div><label className="text-xs text-zinc-500">Price Unit – price_unit (was PEINH)</label><input value={form.price_unit} onChange={e=>setForm({...form, price_unit:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="1" /></div>
                  <div><label className="text-xs text-zinc-500">Moving Avg Price – moving_avg_price VERPR MAP (was Moving Avg Price)</label><input value={form.moving_avg_price} onChange={e=>setForm({...form, moving_avg_price:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="0" /></div>
                  <div><label className="text-xs text-zinc-500">Standard Price – standard_price STPRS (was Standard Price)</label><input value={form.standard_price} onChange={e=>setForm({...form, standard_price:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="0" /></div>
                  <div className="col-span-2 text-[11px] text-zinc-500 mt-2">Accounting: Valuation class {form.inventory_valuation_class || form.valuation_class} linked to BSX {form.type} → GL, WRX GR/IR, PRD Price Diff, GBB Consumption – Code FAUC (alias OBYC) – Real FI posting – legal-safe own IP</div>
                </div>
              )}

              {activeTab==='costing' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Costing Lot Size – costing_lot_size LOSGR</label><input value={form.costing_lot_size} onChange={e=>setForm({...form, costing_lot_size:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="100" /></div>
                  <div><label className="text-xs text-zinc-500">Overhead Group – overhead_group</label><input value={form.overhead_group} onChange={e=>setForm({...form, overhead_group:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="Overhead key" /></div>
                  <div><label className="text-xs text-zinc-500">Cost Unit – org_cost_unit.code (was Cost Center KOSTL KS01) – ECUC alias CUC</label><input value={form.cost_unit || form.cost_center} onChange={e=>setForm({...form, cost_unit:e.target.value, cost_center:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="Cost unit code – alias CC-KITCHEN-01" /></div>
                  <div><label className="text-xs text-zinc-500">Profit Unit – org_profit_unit.code (was Profit Center PRCTR) – EPUC alias PUC</label><input value={form.profit_unit || form.profit_center} onChange={e=>setForm({...form, profit_unit:e.target.value, profit_center:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="Profit unit – alias PU" /></div>
                </div>
              )}

              <div className="col-span-2 flex gap-2 mt-6">
                <button type="button" onClick={()=>setShowAdd(false)} className="flex-1 border rounded-full py-2.5">Cancel – {currentCode}</button>
                <button type="submit" className="flex-1 bg-black text-white rounded-full py-2.5">Create Product – {currentCode} (alias {aliasCodes.join(', ')}) – {activeTab} – legal-safe</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModernModuleShell>
  );
}
