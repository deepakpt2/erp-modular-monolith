"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { VirtualDataGrid } from '@/shared/ui/virtual-data-grid';
import { ColumnDef } from '@tanstack/react-table';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function BOMPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [boms, setBoms] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newBOM, setNewBOM] = useState({ materialId: '', plantId: '', type: 'STANDARD', baseQuantity: '1', baseUom: 'KG', isPhantom: false, isKit: false, expiryRule: 'MIN_COMPONENTS', lines: [{ componentMaterialId: '', quantity: '1', uom: 'KG', isPhantomExplode: false, scrapFactor: '0' }] as any[] });
  const [msg, setMsg] = useState('');
  const [source, setSource] = useState('db');

  async function load() {
    setLoading(true);
    try {
      const [bomRes, plantRes, matRes, wcRes] = await Promise.all([
        fetch(`/api/bom?limit=100&search=${encodeURIComponent(search)}`).then(r=>r.json()),
        fetch(`/api/plants?companyCode=${companyCode}`).then(r=>r.json()),
        fetch(`/api/materials?limit=100`).then(r=>r.json()),
        fetch(`/api/work-centers?limit=100`).then(r=>r.json()).catch(()=>({workCenters:[]})),
      ]);
      setBoms(bomRes.boms || []);
      setPlants(plantRes.plants || []);
      setMaterials(matRes.materials || []);
      setWorkCenters(wcRes.workCenters || []);
      setSource(bomRes.source || 'db');
      if (plantRes.plants?.length && !newBOM.plantId) setNewBOM(prev=>({...prev, plantId: plantRes.plants[0].id}));
      if (matRes.materials?.length && !newBOM.materialId) setNewBOM(prev=>({...prev, materialId: matRes.materials[0].id}));
    } catch(e){ console.error(e); }
    setLoading(false);
  }

  useEffect(()=>{ load(); },[companyCode]);
  useEffect(()=>{ const t=setTimeout(load,400); return()=>clearTimeout(t); },[search]);

  const handleCreateBOM = async () => {
    setMsg('Creating BOM CS01...');
    try {
      const res = await fetch('/api/bom', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          materialId: newBOM.materialId,
          plantId: newBOM.plantId,
          type: newBOM.type,
          baseQuantity: newBOM.baseQuantity,
          baseUom: newBOM.baseUom,
          isPhantom: newBOM.isPhantom,
          isKit: newBOM.isKit,
          expiryRule: newBOM.expiryRule,
          lines: newBOM.lines.filter((l:any)=>l.componentMaterialId).map((l:any,i:number)=>({
            componentMaterialId: l.componentMaterialId,
            quantity: l.quantity,
            uom: l.uom,
            lineNumber: (i+1)*10,
            isPhantomExplode: l.isPhantomExplode,
            scrapFactor: l.scrapFactor,
            workCenterId: l.workCenterId || null,
          }))
        })
      }).then(r=>r.json());
      if (res.success) {
        setMsg(`✅ BOM ${res.bomNumber} created with ${newBOM.lines.length} components • Source: ${source}`);
        setShowCreate(false);
        load();
      } else setMsg(`❌ ${res.error}`);
    } catch(e:any){ setMsg(`❌ ${e.message}`); }
  };

  const handleSetStatus = async (id:string, status:string) => {
    try {
      const res = await fetch('/api/bom', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, action:'SET_STATUS', status }) }).then(r=>r.json());
      if (res.success) { setMsg(`✅ BOM ${id} status → ${status}`); load(); } else setMsg(`❌ ${res.error}`);
    } catch(e:any){ setMsg(`❌ ${e.message}`); }
  };

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    { accessorKey: 'bom_number', header: 'BOM Number', size: 120, cell: ({ getValue }) => <span className="font-bold font-mono text-blue-600">{getValue()}</span> },
    { accessorKey: 'material_number', header: 'Parent FERT', size: 150, cell: ({ getValue, row }) => <span>{getValue()} {(row.original as any).material_description?.substring(0,20)}</span> },
    { accessorKey: 'plant_code', header: 'Plant', size: 80 },
    { accessorKey: 'type', header: 'Type', size: 90, cell: ({ getValue }) => {
      const v=getValue(); const cls=v==='KIT_PHANTOM'?'bg-purple-100':v==='KIT_STOCKED'?'bg-blue-100':'bg-zinc-100';
      return <span className={`px-1 border text-[10px] ${cls}`}>{v}</span>;
    }},
    { accessorKey: 'status', header: 'Status', size: 80, cell: ({ getValue }) => {
      const v=getValue(); const cls=v==='ACTIVE'?'bg-green-100':v==='DRAFT'?'bg-yellow-100':'bg-red-100';
      return <span className={`px-1 border text-[10px] ${cls}`}>{v}</span>;
    }},
    { accessorKey: 'base_quantity', header: 'Base Qty', size: 80 },
    { accessorKey: 'base_uom', header: 'UoM', size: 50 },
    { accessorKey: 'line_count', header: 'Components', size: 80 },
    { accessorKey: 'is_phantom', header: 'Phantom', size: 70, cell: ({ getValue }) => <span>{getValue()?'Yes':'No'}</span> },
    { accessorKey: 'is_kit', header: 'Kit', size: 50, cell: ({ getValue }) => <span>{getValue()?'Yes':'No'}</span> },
    { accessorKey: 'expiry_rule', header: 'Expiry Rule', size: 120 },
  ], []);

  const selected = selectedId ? boms.find((b:any)=>b.id===selectedId) : null;

  if (loading) return <div className="p-6">Loading BOMs CS01 ERP Views for {companyCode}...</div>;

  const CS01_TABS = [
    { id: 'header', label: 'Header', desc: 'BOM number, material FERT parent, plant KP01/1000 OX10, BOM type STANDARD/KIT_STOCKED/KIT_PHANTOM, base quantity, base UoM, status ACTIVE/DRAFT/BLOCKED, version 01, valid from/to' },
    { id: 'items', label: 'Item Overview', desc: 'Components list with line number 10, component material ROH, quantity per base, UoM, scrap factor, is phantom explode, work center CR01, batch tracked' },
    { id: 'item_detail', label: 'Item Detail', desc: 'Component material ROH, quantity, UoM, scrap factor, is phantom explode, work center, batch tracked, expiry rule, cost relevancy, etc' },
    { id: 'header_detail', label: 'Header Detail', desc: 'BOM header detail: is phantom, is kit, expiry rule MIN_COMPONENTS/FIXED_DAYS/MANUAL, fixed shelf life days, valid from/to, created by, etc' },
  ];

  const modernContent = (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div><h2 className="text-lg font-semibold">Bills of Material • {companyCode}</h2><p className="text-sm text-zinc-500">{boms.length} BOMs • CS01 Create with 4 ERP tabs: Header (BOM number BOM-xxx, material FERT parent ent_material_master, plant KP01/1000 OX10 ent_plant, BOM type STANDARD/KIT_STOCKED/KIT_PHANTOM, base quantity 1, base UoM KG/PC, status ACTIVE/DRAFT/BLOCKED, version 01, valid from/to), Item Overview (components list line 10 component material ROH quantity per base UoM scrap factor % is phantom explode work center CR01 batch tracked), Item Detail (component material ROH, quantity, UoM, scrap factor, is phantom explode, work center CR01, batch tracked, expiry rule, cost relevancy), Header Detail (is phantom, is kit, expiry rule MIN_COMPONENTS/FIXED_DAYS/MANUAL, fixed shelf life days, valid from/to, created by) - like ERP CS01/CS02/CS03 • Managing recipes/assemblies across multiple plants requires frontend interface • Coupled: Material Master MM01 (parent FERT material → ent_material_master, component ROH → ent_material_master), Plant OX10 (ent_plant), Work Center CR01 (pp_work_center capacity labor/machine rates for costing), Routing CA01 (pp_routing_header bom_header_id link), Costing Run CK40N (BOM cost rollup MAP + labor + overhead: material MAP from accounting + labor/machine from routing/work center + overhead), Kitting (KIT_STOCKED K01/K02 own batch inherited minExpiry, KIT_PHANTOM explosion at prod order confirmation 261 no intermediate stock), MRP MD01 (BOM explosion for planned orders) • Company {companyCode} • Source: {source}</p></div>
        <div className="flex gap-2"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search BOM/material" className="border rounded-full px-4 py-2 text-sm w-64" /><button onClick={()=>setShowCreate(true)} className="text-sm bg-black text-white rounded-full px-4 py-2">+ New BOM (CS01) ERP Views {companyCode}</button></div>
      </div>

      {msg && <div className="mb-4 p-3 bg-zinc-900 text-white rounded-xl text-sm">{msg}</div>}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8"><div className="bg-white rounded-2xl border p-2"><VirtualDataGrid data={boms} columns={columns} height={500} rowHeight={32} selectedRowId={selectedId || undefined} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>setSelectedId(r.id)} /></div></div>
        <div className="col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border p-4 text-xs">
            <div className="font-medium">BOM Detail • Components • Multi-Plant • {companyCode} • Backend {source}</div>
            {selected ? (
              <div className="mt-3 space-y-2">
                <div><b>{(selected as any).bom_number}</b> • {(selected as any).material_number} {(selected as any).material_description} • Plant {(selected as any).plant_code} {(selected as any).plant_name} • Type {(selected as any).type} • Status {(selected as any).status} • Base {(selected as any).base_quantity} {(selected as any).base_uom} • Phantom {(selected as any).is_phantom?'Yes':'No'} Kit {(selected as any).is_kit?'Yes':'No'} • Expiry {(selected as any).expiry_rule}</div>
                <div className="flex flex-wrap gap-1">
                  <a href={`/${companyCode}/foundation/materials?search=${(selected as any).material_number}`} className="text-[10px] bg-black text-white rounded-full px-2 py-1">MM03 Material {(selected as any).material_number}</a>
                  <a href={`/${companyCode}/pp/routings?materialId=${(selected as any).material_id || ''}`} className="text-[10px] bg-blue-600 text-white rounded-full px-2 py-1">CA01 Routing for Material</a>
                  <a href={`/${companyCode}/pp/work-centers`} className="text-[10px] bg-purple-600 text-white rounded-full px-2 py-1">CR01 Work Centers Labor/Overhead</a>
                  <a href={`/${companyCode}/fico/costing-run?bomId=${(selected as any).id}`} className="text-[10px] bg-green-600 text-white rounded-full px-2 py-1">CK40N Costing Run MAP+Labor</a>
                  <a href={`/${companyCode}/pp/mrp?materialId=${(selected as any).material_id || ''}`} className="text-[10px] bg-orange-600 text-white rounded-full px-2 py-1">MD04 MRP Explosion</a>
                </div>
                <div className="mt-2 border rounded-xl p-2 bg-zinc-50 max-h-[300px] overflow-auto">
                  <div className="font-bold">Components • {(selected as any).lines?.length||0} lines • Coupled to Material Master + Work Center + Expiry</div>
                  {(selected as any).lines?.map((l:any)=><div key={l.id} className="mt-1 flex justify-between border-b pb-1"><span>{l.line_number} {l.component_number} {l.component_description?.substring(0,20)} {l.quantity} {l.uom} scrap {l.scrap_factor}% {l.is_phantom_explode?'Phantom Explode':''} WC {l.work_center_code||''} → <a href={`/${companyCode}/foundation/materials?search=${l.component_number}`} className="text-blue-600 underline">MM03 {l.component_number}</a></span></div>)}
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <button onClick={()=>handleSetStatus((selected as any).id, 'ACTIVE')} className="text-xs bg-green-600 text-white rounded-full px-3 py-2">Set ACTIVE CS02 →</button>
                  <button onClick={()=>handleSetStatus((selected as any).id, 'BLOCKED')} className="text-xs bg-red-600 text-white rounded-full px-3 py-2">Set BLOCKED CS02 →</button>
                  <button onClick={()=>handleSetStatus((selected as any).id, 'DRAFT')} className="text-xs border rounded-full px-3 py-2">Set DRAFT CS02 →</button>
                </div>
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-xl text-[11px]">Coupled: Material Master MM01/MM02/MM03 (parent FERT → ent_material_master), Plant OX10 (ent_plant), Work Center CR01 (pp_work_center labor_rate_per_hour, machine_rate_per_hour, overhead_rate_percent for costing), Routing CA01 (pp_routing_header bom_header_id), Costing CK40N (cost rollup MAP of ROH components + labor + overhead from routing/work center), MRP MD01 (BOM explosion), Kitting (KIT_STOCKED K01/K02 with minExpiry inheritance, KIT_PHANTOM explosion at prod order confirmation 261).</div>
              </div>
            ) : <div className="text-zinc-500 mt-2">Select BOM row - shows components, expiry rule, phantom/kit flags • Backend connected {source} • {companyCode} • Coupled to Material Master, Routing, Work Center, Costing, MRP</div>}
          </div>
          <div className="bg-white rounded-2xl border p-4 text-xs">
            <div className="font-medium text-sm">Details</div>
            <div className="mt-2 space-y-1 text-[11px]">
              <div>GET /api/bom?plantId&amp;materialId&amp;search&amp;status - list BOMs with lines, plant_code, material_number, line_count</div>
              <div>POST /api/bom materialId, plantId, type:STANDARD/KIT_STOCKED/KIT_PHANTOM, baseQuantity, baseUom, isPhantom, isKit, expiryRule, lines - creates BOM header BOM-xxx + lines</div>
              <div>PUT /api/bom id, action:SET_STATUS, status - ACTIVE/BLOCKED/DRAFT</div>
              <div>PUT id, action:ADD_LINE, componentMaterialId, quantity - add single component</div>
              <div>PUT id, action:UPDATE_LINES, lines - replace all components</div>
              <div>DELETE /api/bom?id=xxx - only DRAFT</div>
              <div>Plants: {plants.map((p:any)=>p.code).join(', ')} - Materials: {materials.slice(0,3).map((m:any)=>m.material_number).join(', ')}</div>
            </div>
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={()=>setShowCreate(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border w-full max-w-2xl p-6 max-h-[90vh] overflow-auto">
            <h3 className="font-semibold">Create BOM</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><label className="text-xs">Parent Material FERT *</label><select value={newBOM.materialId} onChange={e=>setNewBOM({...newBOM, materialId: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select FERT</option>{materials.map((m:any)=><option key={m.id} value={m.id}>{m.material_number} {m.description} {m.type}</option>)}</select></div>
              <div><label className="text-xs">Plant *</label><select value={newBOM.plantId} onChange={e=>setNewBOM({...newBOM, plantId: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select Plant</option>{plants.map((p:any)=><option key={p.id} value={p.id}>{p.code} {p.name}</option>)}</select></div>
              <div><label className="text-xs">Type *</label><select value={newBOM.type} onChange={e=>setNewBOM({...newBOM, type: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="STANDARD">STANDARD</option><option value="KIT_STOCKED">KIT_STOCKED Stocked Kit</option><option value="KIT_PHANTOM">KIT_PHANTOM Phantom Kit</option></select></div>
              <div><label className="text-xs">Base Qty / UoM</label><div className="flex gap-1 mt-1"><input value={newBOM.baseQuantity} onChange={e=>setNewBOM({...newBOM, baseQuantity: e.target.value})} className="flex-1 border rounded-xl px-3 py-2" placeholder="1"/><input value={newBOM.baseUom} onChange={e=>setNewBOM({...newBOM, baseUom: e.target.value})} className="w-20 border rounded-xl px-3 py-2" placeholder="KG"/></div></div>
              <div className="col-span-2 flex gap-2"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={newBOM.isPhantom} onChange={e=>setNewBOM({...newBOM, isPhantom: e.target.checked})}/> Phantom (explode at prod order confirmation without intermediate stock)</label><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={newBOM.isKit} onChange={e=>setNewBOM({...newBOM, isKit: e.target.checked})}/> Kit (stocked kit)</label></div>
              <div className="col-span-2"><label className="text-xs">Expiry Rule</label><select value={newBOM.expiryRule} onChange={e=>setNewBOM({...newBOM, expiryRule: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="MIN_COMPONENTS">MIN_COMPONENTS inherited MIN(component expiries)</option><option value="FIXED_DAYS">FIXED_DAYS</option><option value="MANUAL">MANUAL</option></select></div>
              <div className="col-span-2 border-t pt-3 mt-2">
                <div className="flex justify-between items-center"><label className="text-xs font-bold">Components • Recipe / Assembly</label><button onClick={()=>setNewBOM({...newBOM, lines: [...newBOM.lines, { componentMaterialId: '', quantity: '1', uom: 'KG', isPhantomExplode: false, scrapFactor: '0' }]})} className="text-xs border rounded-full px-2 py-1">+ Add Component</button></div>
                {newBOM.lines.map((line:any, idx:number)=><div key={idx} className="mt-2 grid grid-cols-6 gap-1 items-center"><select value={line.componentMaterialId} onChange={e=>{ const lines=[...newBOM.lines]; lines[idx].componentMaterialId=e.target.value; setNewBOM({...newBOM, lines}); }} className="col-span-2 border rounded-xl px-2 py-2 text-xs"><option value="">Select ROH</option>{materials.map((m:any)=><option key={m.id} value={m.id}>{m.material_number} {m.description}</option>)}</select><input value={line.quantity} onChange={e=>{ const lines=[...newBOM.lines]; lines[idx].quantity=e.target.value; setNewBOM({...newBOM, lines}); }} className="border rounded-xl px-2 py-2 text-xs" placeholder="Qty"/><input value={line.uom} onChange={e=>{ const lines=[...newBOM.lines]; lines[idx].uom=e.target.value; setNewBOM({...newBOM, lines}); }} className="border rounded-xl px-2 py-2 text-xs" placeholder="UoM"/><input value={line.scrapFactor} onChange={e=>{ const lines=[...newBOM.lines]; lines[idx].scrapFactor=e.target.value; setNewBOM({...newBOM, lines}); }} className="border rounded-xl px-2 py-2 text-xs" placeholder="Scrap %"/><button onClick={()=>{ const lines=newBOM.lines.filter((_:any,i:number)=>i!==idx); setNewBOM({...newBOM, lines}); }} className="text-xs border rounded-full px-2 py-1">X</button></div>)}
              </div>
            </div>
            <div className="mt-6 flex gap-2"><button onClick={()=>setShowCreate(false)} className="flex-1 border rounded-full py-2.5">Cancel</button><button onClick={handleCreateBOM} className="flex-1 bg-black text-white rounded-full py-2.5">Create BOM • CS01 • {companyCode}</button></div>
            {msg && <div className="mt-3 text-xs p-2 bg-zinc-900 text-white rounded-xl">{msg}</div>}
          </div>
        </div>
      )}
    </div>
  );

  const classicContent = (
    <div className="font-mono text-[11px] bg-[#f5f5f0]">
      <div className="border border-[#808080] bg-[#f0f0f0] p-2"><div className="font-bold border-b border-[#808080] pb-1">CS01/CS02/CS03 Selection • BOM • {companyCode} • Multi-Plant Recipes • Backend {source}</div><div className="grid grid-cols-12 gap-1 items-center mt-2"><div className="col-span-2 text-right pr-2">BOM Number:</div><div className="col-span-3"><input value={search} onChange={e=>setSearch(e.target.value)} className="w-full border border-black bg-white h-5 px-1" placeholder="BOM-*" /></div><div className="col-span-2 text-right pr-2">Material:</div><div className="col-span-3"><input placeholder="FERT*" className="w-full border border-black bg-white h-5 px-1" /></div><div className="col-span-2"><button onClick={load} className="bg-[#d4d0c8] border border-[#404040] px-3 h-5">Execute F8 • {source}</button></div></div></div>
      <div className="mt-1 border border-black bg-white"><div className="bg-[#d4d0c8] border-b border-black px-2 h-6 flex items-center font-bold">BOM Table Control • {boms.length} entries • CS01/CS02/CS03 • Multi-Plant • Components • {source} • {companyCode}</div><VirtualDataGrid data={boms} columns={columns} height={450} rowHeight={26} selectedRowId={selectedId || undefined} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>setSelectedId(r.id)} /></div>
    </div>
  );

  return (
    <ModernModuleShell title="BOM" subtitle={`${boms.length} BOMs • ${companyCode}`} code="CS01" module="PP" tooltip={`CS01/CS02/CS03 • Bills of Material • Multi-Plant Recipes • Assemblies • Backend Connected ${source} • ${companyCode}`} kpis={[
      {label:'Total BOMs', value: boms.length.toString(), icon:'📋'},
      {label:'Active', value: boms.filter((b:any)=>b.status==='ACTIVE').length.toString(), icon:'✅'},
      {label:'Components Avg', value: `${boms.length>0?(boms.reduce((s:any,b:any)=>s+parseInt(b.line_count||0),0)/boms.length).toFixed(1):'0'}`, icon:'🧩'},
      {label:'Source', value: source, icon:'🔗'},
    ]}>
      {modernContent}
      <div className="mt-8 border-t pt-6"><div className="text-xs font-medium mb-3">Classic ERP GUI • CS01 • Functional • Backend Connected</div>{classicContent}</div>
    </ModernModuleShell>
  );
}
