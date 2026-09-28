"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { VirtualDataGrid } from '@/shared/ui/virtual-data-grid';
import { ColumnDef } from '@tanstack/react-table';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

const TABS = [
  { id: 'basic1', label: 'Basic Data 1', code: 'MM01', desc: 'Material type, UoM, group, batch, shelf life – ERP Basic 1 view' },
  { id: 'basic2', label: 'Basic Data 2', code: 'MM01', desc: 'Weight, volume, EAN, long text' },
  { id: 'sales', label: 'Sales Org 1/2', code: 'MM01', desc: 'Sales org, channel, division, tax, pricing' },
  { id: 'purchasing', label: 'Purchasing', code: 'MM01', desc: 'Purch group, purch org, valuation class, landed cost' },
  { id: 'mrp', label: 'MRP 1-4', code: 'MM01', desc: 'MRP type, controller, lot size, safety stock, reorder point' },
  { id: 'plant', label: 'Plant/Storage', code: 'MM01', desc: 'Plant, SLoc, safety stock, expiry, batch' },
  { id: 'accounting', label: 'Accounting 1/2', code: 'MM01', desc: 'Valuation class, price control V/S, MAP, standard price, BSX/WRX' },
  { id: 'costing', label: 'Costing', code: 'MM01', desc: 'Costing lot size, overhead, cost center' },
];

export default function MaterialsPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const [materials, setMaterials] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('db');
  const [showAdd, setShowAdd] = useState(mode === 'create');
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('basic1');
  const [message, setMessage] = useState('');
  const [materialTypes, setMaterialTypes] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeForm, setNewTypeForm] = useState({ code: '', name: '', description: '' });
  const [showNewUom, setShowNewUom] = useState(false);
  const [newUomForm, setNewUomForm] = useState({ code: '', name: '', dimension: 'QUANTITY' });
  const [form, setForm] = useState({
    material_number: '', description: '', description_long: '', type: 'ROH', base_uom: 'KG',
    group_code: 'FOOD', shelf_life_days: 30, expiry_control: 'BLOCK', is_kit: false, is_phantom_kit: false,
    valuation_class: 'ROH', is_hazardous: false, is_batch_managed: true, landed_cost_relevance: 'ALL',
    sales_org: '1000', distribution_channel: '10', division: '00', sales_uom: 'KG',
    tax_classification: '1', account_assignment_group: '01', item_category_group: 'NORM',
    purchasing_group: '001', purchasing_org: '1000', mrp_type: 'PD', mrp_controller: '001',
    lot_size: 'EX', procurement_type: 'F', special_procurement: '', safety_stock: '10', reorder_point: '50',
    plant_id: '', sloc_id: '', qm_active: false, price_control: 'V', moving_avg_price: '0', standard_price: '0',
    price_unit: '1', costing_lot_size: '100', overhead_group: '', cost_center: '', profit_center: '',
    weight: '1', weight_unit: 'KG', volume: '1', volume_unit: 'L', ean: '',
  });

  async function load() {
    setLoading(true);
    try {
      const [matRes, plantRes, typeRes, uomRes] = await Promise.all([
        fetch(`/api/materials?limit=200&search=${encodeURIComponent(search)}`).then(r=>r.json()),
        fetch(`/api/plants?limit=100`).then(r=>r.json()).catch(()=>({plants:[]})),
        fetch(`/api/material-types`).then(r=>r.json()).catch(()=>({materialTypes:[]})),
        fetch(`/api/uom`).then(r=>r.json()).catch(()=>({uoms:[]})),
      ]);
      setMaterials(matRes.materials || []);
      setPlants(plantRes.plants || []);
      setMaterialTypes(typeRes.materialTypes || [{code:'ROH',name:'Raw Material'},{code:'HALB',name:'Semi-Finished'},{code:'FERT',name:'Finished'}]);
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
        setMessage(`✅ ${res.material_number} created – MM01 – Type ${form.type} UoM ${form.base_uom}`);
        setShowAdd(false);
        load();
      } else setMessage(`❌ ${res.error}`);
    } catch(e:any){ setMessage(`❌ ${e.message}`); }
  };

  const handleDeleteMaterial = async (mat:any) => {
    const m = mat || selectedMaterial;
    if (!m) { setMessage('Select a material first'); return; }
    if (!confirm(`Delete material ${m.material_number}?`)) return;
    try {
      const res = await fetch(`/api/materials?material_number=${encodeURIComponent(m.material_number)}`,{method:'DELETE'}).then(r=>r.json());
      setMessage(res.success ? `✅ ${res.message}` : `❌ ${res.error}`);
      load();
    } catch(e:any){ setMessage(`❌ ${e.message}`); }
  };

  const columns = useMemo<ColumnDef<any, any>[]>(()=>[
    { accessorKey:'material_number', header:'Material No', size:140, cell:({getValue})=><span className="font-mono font-medium">{getValue()}</span> },
    { accessorKey:'description', header:'Description', size:200 },
    { accessorKey:'type', header:'Type OMS2', size:70, cell:({getValue})=>{ const v=getValue(); return <span className="px-2 py-0.5 rounded-full border text-xs bg-zinc-50">{v}</span>; }},
    { accessorKey:'base_uom', header:'UoM CUNI', size:60 },
    { accessorKey:'group_code', header:'Group', size:80 },
    { accessorKey:'moving_avg_price', header:'MAP', size:80 },
    { accessorKey:'total_stock_qty', header:'Stock', size:80 },
  ],[]);

  const currentTitle = mode === 'change' ? 'Change Material' : mode === 'display' ? 'Display Material' : mode === 'create' ? 'Create Material' : 'Materials';
  const currentCode = mode === 'change' ? 'MM02' : mode === 'display' ? 'MM03' : 'MM01';

  if (loading) return <div className="p-6 text-sm text-zinc-500">Loading materials...</div>;

  return (
    <ModernModuleShell title={currentTitle} subtitle={`${filtered.length} materials • ${source} • Types:${materialTypes.length} UoMs:${uoms.length} – MM01/MM02/MM03 – OMS2/CUNI`} code={currentCode} module="FOUNDATION" tooltip={`MM01 Create Material – Actual ERP implementation: Basic 1/2, Sales Org, Purchasing, MRP 1-4, Plant/Storage, Accounting 1/2, Costing – each tab has real ERP fields. Material Types OMS2 configurable, UoM CUNI configurable. Code MM01/MM02/MM03, OMS2, CUNI.`} kpis={[
      {label:'Total', value: materials.length.toString(), icon:'📦'},
      {label:'Types OMS2', value: materialTypes.length.toString(), icon:'🏷️'},
      {label:'UoMs CUNI', value: uoms.length.toString(), icon:'⚖️'},
    ]}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search materials..." className="border rounded-full px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-black" />
          <button onClick={load} className="text-xs border rounded-full px-3 py-2 hover:bg-zinc-50 bg-white">Refresh</button>
          <Link href="/1000/foundation/material-types" className="text-xs border rounded-full px-3 py-2 bg-white hover:bg-zinc-50">OMS2 Material Types →</Link>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>selectedMaterial && handleDeleteMaterial(selectedMaterial)} className="text-xs border border-red-200 text-red-600 rounded-full px-3 py-2 bg-white">Delete</button>
          <button onClick={()=>setShowAdd(true)} className="text-sm bg-black text-white rounded-full px-4 py-2">+ New Material</button>
        </div>
      </div>

      {message && <div className="mb-4 p-3 bg-zinc-900 text-white rounded-xl text-sm">{message}</div>}

      <div className="bg-white rounded-2xl border overflow-hidden">
        <VirtualDataGrid data={filtered} columns={columns} height={400} rowHeight={36} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>{ setSelectedMaterial(r); }} />
      </div>
      {selectedMaterial && <div className="mt-2 text-xs text-zinc-500">Selected: {selectedMaterial.material_number} – {selectedMaterial.description} – <button onClick={()=>handleDeleteMaterial(selectedMaterial)} className="underline text-red-600">Delete</button></div>}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={()=>setShowAdd(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border w-full max-w-4xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Create Material • MM01 – Actual ERP Implementation</h3>
              <button onClick={()=>setShowAdd(false)} className="text-zinc-400 hover:text-black">✕</button>
            </div>
            <div className="mt-4 flex gap-1 flex-wrap">
              {TABS.map(tab=>(
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`text-xs px-3 py-1.5 rounded-full border ${activeTab===tab.id?'bg-black text-white border-black':'bg-zinc-50 border-zinc-200'}`} title={tab.desc}>{tab.label}</button>
              ))}
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-sm">
              {activeTab==='basic1' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Material Number (MATNR) – Auto if blank</label><input value={form.material_number} onChange={e=>setForm({...form, material_number:e.target.value.toUpperCase()})} placeholder="Auto – MAT-1000000010" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div>
                    <label className="text-xs text-zinc-500">Material Type – OMS2 – Configurable</label>
                    <div className="flex gap-1 mt-1">
                      <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} className="w-full border rounded-xl px-3 py-2">
                        {materialTypes.map((t:any)=><option key={t.code} value={t.code}>{t.code} – {t.name}</option>)}
                      </select>
                      <button type="button" onClick={()=>setShowNewType(!showNewType)} className="border rounded-full px-2 text-xs whitespace-nowrap">+ OMS2 New Type</button>
                    </div>
                    {showNewType && (
                      <div className="mt-2 border rounded-xl p-2 bg-zinc-50 space-y-2">
                        <input value={newTypeForm.code} onChange={e=>setNewTypeForm({...newTypeForm, code:e.target.value.toUpperCase()})} placeholder="Code e.g., HAWA" className="w-full border rounded-lg px-2 py-1 text-xs" />
                        <input value={newTypeForm.name} onChange={e=>setNewTypeForm({...newTypeForm, name:e.target.value})} placeholder="Name e.g., Trading Goods" className="w-full border rounded-lg px-2 py-1 text-xs" />
                        <button type="button" onClick={async()=>{
                          const res=await fetch('/api/material-types',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newTypeForm)}).then(r=>r.json());
                          if(res.success){ setMessage(`✅ Material Type ${res.materialType.code} created – OMS2`); setShowNewType(false); load(); setForm({...form, type: res.materialType.code}); }
                          else setMessage(`❌ ${res.error}`);
                        }} className="w-full bg-black text-white rounded-full py-1 text-xs">Create Type – OMS2</button>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2"><label className="text-xs text-zinc-500">Description – MAKT</label><input required value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Material description" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div>
                    <label className="text-xs text-zinc-500">Base UoM – CUNI – Configurable</label>
                    <div className="flex gap-1 mt-1">
                      <select value={form.base_uom} onChange={e=>setForm({...form, base_uom:e.target.value})} className="w-full border rounded-xl px-3 py-2">
                        {uoms.map((u:any)=><option key={u.code} value={u.code}>{u.code} – {u.name}</option>)}
                      </select>
                      <button type="button" onClick={()=>setShowNewUom(!showNewUom)} className="border rounded-full px-2 text-xs">+ CUNI New UoM</button>
                    </div>
                    {showNewUom && (
                      <div className="mt-2 border rounded-xl p-2 bg-zinc-50 space-y-2">
                        <input value={newUomForm.code} onChange={e=>setNewUomForm({...newUomForm, code:e.target.value.toUpperCase()})} placeholder="Code e.g., M" className="w-full border rounded-lg px-2 py-1 text-xs" />
                        <input value={newUomForm.name} onChange={e=>setNewUomForm({...newUomForm, name:e.target.value})} placeholder="Name e.g., Meter" className="w-full border rounded-lg px-2 py-1 text-xs" />
                        <button type="button" onClick={async()=>{
                          const res=await fetch('/api/uom',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newUomForm)}).then(r=>r.json());
                          if(res.success){ setMessage(`✅ UoM ${res.uom.code} created – CUNI`); setShowNewUom(false); load(); setForm({...form, base_uom: res.uom.code}); }
                          else setMessage(`❌ ${res.error}`);
                        }} className="w-full bg-black text-white rounded-full py-1 text-xs">Create UoM – CUNI</button>
                      </div>
                    )}
                  </div>
                  <div><label className="text-xs text-zinc-500">Material Group – OMSF</label><select value={form.group_code} onChange={e=>setForm({...form, group_code:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>FOOD</option><option>SPICE</option><option>KITS</option><option>FG</option><option>RAW</option></select></div>
                  <div><label className="text-xs text-zinc-500">Shelf Life Days</label><input type="number" value={form.shelf_life_days} onChange={e=>setForm({...form, shelf_life_days: parseInt(e.target.value)||0})} className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Expiry Control</label><select value={form.expiry_control} onChange={e=>setForm({...form, expiry_control:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>BLOCK</option><option>WARNING</option><option>RESTRICTED_USE</option></select></div>
                  <div className="flex gap-2 items-center mt-6"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={form.is_batch_managed} onChange={e=>setForm({...form, is_batch_managed:e.target.checked})} /> Batch Managed</label><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={form.is_hazardous} onChange={e=>setForm({...form, is_hazardous:e.target.checked})} /> Hazardous</label></div>
                  <div className="flex gap-2 items-center"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={form.is_kit} onChange={e=>setForm({...form, is_kit:e.target.checked})} /> Is Kit</label><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={form.is_phantom_kit} onChange={e=>setForm({...form, is_phantom_kit:e.target.checked})} /> Phantom Kit</label></div>
                </div>
              )}

              {activeTab==='basic2' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="text-xs text-zinc-500">Long Description</label><textarea value={form.description_long} onChange={e=>setForm({...form, description_long:e.target.value})} placeholder="Long text for material" className="mt-1 w-full border rounded-xl px-3 py-2 h-20" /></div>
                  <div><label className="text-xs text-zinc-500">Weight</label><input value={form.weight} onChange={e=>setForm({...form, weight:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Weight Unit</label><select value={form.weight_unit} onChange={e=>setForm({...form, weight_unit:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>KG</option><option>G</option><option>TON</option></select></div>
                  <div><label className="text-xs text-zinc-500">Volume</label><input value={form.volume} onChange={e=>setForm({...form, volume:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Volume Unit</label><select value={form.volume_unit} onChange={e=>setForm({...form, volume_unit:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>L</option><option>ML</option><option>M3</option></select></div>
                  <div className="col-span-2"><label className="text-xs text-zinc-500">EAN/UPC</label><input value={form.ean} onChange={e=>setForm({...form, ean:e.target.value})} placeholder="Barcode" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                </div>
              )}

              {activeTab==='sales' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Sales Organization – VKORG</label><input value={form.sales_org} onChange={e=>setForm({...form, sales_org:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="1000" /></div>
                  <div><label className="text-xs text-zinc-500">Distribution Channel – VTWEG</label><input value={form.distribution_channel} onChange={e=>setForm({...form, distribution_channel:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="10" /></div>
                  <div><label className="text-xs text-zinc-500">Division – SPART</label><input value={form.division} onChange={e=>setForm({...form, division:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="00" /></div>
                  <div><label className="text-xs text-zinc-500">Sales UoM</label><select value={form.sales_uom} onChange={e=>setForm({...form, sales_uom:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2">{uoms.map((u:any)=><option key={u.code} value={u.code}>{u.code}</option>)}</select></div>
                  <div><label className="text-xs text-zinc-500">Tax Classification – TATY</label><input value={form.tax_classification} onChange={e=>setForm({...form, tax_classification:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="1 – Full tax" /></div>
                  <div><label className="text-xs text-zinc-500">Account Assignment Group – KTGRM</label><input value={form.account_assignment_group} onChange={e=>setForm({...form, account_assignment_group:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="01" /></div>
                  <div><label className="text-xs text-zinc-500">Item Category Group – MTPOS</label><input value={form.item_category_group} onChange={e=>setForm({...form, item_category_group:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="NORM" /></div>
                </div>
              )}

              {activeTab==='purchasing' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Purchasing Group – EKGRP</label><input value={form.purchasing_group} onChange={e=>setForm({...form, purchasing_group:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="001" /></div>
                  <div><label className="text-xs text-zinc-500">Purchasing Organization – EKORG</label><input value={form.purchasing_org} onChange={e=>setForm({...form, purchasing_org:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="1000" /></div>
                  <div><label className="text-xs text-zinc-500">Valuation Class – BKLAS</label><input value={form.valuation_class} onChange={e=>setForm({...form, valuation_class:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="ROH – linked to BSX/WRX" /></div>
                  <div><label className="text-xs text-zinc-500">Landed Cost Relevance</label><select value={form.landed_cost_relevance} onChange={e=>setForm({...form, landed_cost_relevance:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>ALL</option><option>NONE</option><option>FREIGHT_ONLY</option></select></div>
                </div>
              )}

              {activeTab==='mrp' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">MRP Type – DISMM</label><select value={form.mrp_type} onChange={e=>setForm({...form, mrp_type:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>PD – MRP</option><option>ND – No MRP</option><option>VB – Manual reorder</option><option>VM – Auto reorder</option></select></div>
                  <div><label className="text-xs text-zinc-500">MRP Controller – DISPO</label><input value={form.mrp_controller} onChange={e=>setForm({...form, mrp_controller:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="001" /></div>
                  <div><label className="text-xs text-zinc-500">Lot Size – DISLS</label><select value={form.lot_size} onChange={e=>setForm({...form, lot_size:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>EX – Lot-for-lot</option><option>FX – Fixed</option><option>HB – Replenish to max</option></select></div>
                  <div><label className="text-xs text-zinc-500">Procurement Type – BESKZ</label><select value={form.procurement_type} onChange={e=>setForm({...form, procurement_type:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>F – External procurement</option><option>E – In-house production</option><option>X – Both</option></select></div>
                  <div><label className="text-xs text-zinc-500">Safety Stock – EISBE</label><input value={form.safety_stock} onChange={e=>setForm({...form, safety_stock:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="10" /></div>
                  <div><label className="text-xs text-zinc-500">Reorder Point – MINBE</label><input value={form.reorder_point} onChange={e=>setForm({...form, reorder_point:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="50" /></div>
                </div>
              )}

              {activeTab==='plant' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Plant – WERKS – OX10</label><select value={form.plant_id} onChange={e=>setForm({...form, plant_id:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select Plant – Real DB</option>{plants.map((p:any)=><option key={p.id} value={p.id}>{p.code} – {p.name}</option>)}</select></div>
                  <div><label className="text-xs text-zinc-500">Storage Location – LGORT – OX09</label><input value={form.sloc_id} onChange={e=>setForm({...form, sloc_id:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="SLoc ID or code" /></div>
                  <div className="col-span-2"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.qm_active} onChange={e=>setForm({...form, qm_active:e.target.checked})} /> QM Active – Quality Management</label></div>
                </div>
              )}

              {activeTab==='accounting' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Price Control – VPRSV</label><select value={form.price_control} onChange={e=>setForm({...form, price_control:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="V">V – Moving Average MAP</option><option value="S">S – Standard Price</option></select></div>
                  <div><label className="text-xs text-zinc-500">Price Unit – PEINH</label><input value={form.price_unit} onChange={e=>setForm({...form, price_unit:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="1" /></div>
                  <div><label className="text-xs text-zinc-500">Moving Avg Price – VERPR – MAP</label><input value={form.moving_avg_price} onChange={e=>setForm({...form, moving_avg_price:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="0" /></div>
                  <div><label className="text-xs text-zinc-500">Standard Price – STPRS</label><input value={form.standard_price} onChange={e=>setForm({...form, standard_price:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="0" /></div>
                  <div className="col-span-2 text-[11px] text-zinc-500 mt-2">Accounting: Valuation class {form.valuation_class} linked to BSX {form.type} → GL, WRX GR/IR, PRD Price Diff, GBB Consumption – Code OBYC – Real FI posting</div>
                </div>
              )}

              {activeTab==='costing' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-zinc-500">Costing Lot Size – LOSGR</label><input value={form.costing_lot_size} onChange={e=>setForm({...form, costing_lot_size:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="100" /></div>
                  <div><label className="text-xs text-zinc-500">Overhead Group</label><input value={form.overhead_group} onChange={e=>setForm({...form, overhead_group:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="Overhead key" /></div>
                  <div><label className="text-xs text-zinc-500">Cost Center – KOSTL – KS01</label><input value={form.cost_center} onChange={e=>setForm({...form, cost_center:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="Cost center code" /></div>
                  <div><label className="text-xs text-zinc-500">Profit Center – PRCTR</label><input value={form.profit_center} onChange={e=>setForm({...form, profit_center:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="Profit center" /></div>
                </div>
              )}

              <div className="col-span-2 flex gap-2 mt-6">
                <button type="button" onClick={()=>setShowAdd(false)} className="flex-1 border rounded-full py-2.5">Cancel</button>
                <button type="submit" className="flex-1 bg-black text-white rounded-full py-2.5">Create Material – MM01 – {activeTab}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModernModuleShell>
  );
}
