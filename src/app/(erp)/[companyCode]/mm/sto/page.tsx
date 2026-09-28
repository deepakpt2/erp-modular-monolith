"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { VirtualDataGrid } from '@/shared/ui/virtual-data-grid';
import { ColumnDef } from '@tanstack/react-table';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function STOPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [stos, setStos] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSTO, setNewSTO] = useState({ supplyingPlantId: '', receivingPlantId: '', supplyingSlocId: '', receivingSlocId: '', type: 'TWO_STEP', freightCost: '50', materialId: '', quantity: '100', headerText: '' });
  const [msg, setMsg] = useState('');
  const [source, setSource] = useState('db');

  async function load() {
    setLoading(true);
    try {
      const [stoRes, plantRes, matRes] = await Promise.all([
        fetch(`/api/sto?limit=100&search=${encodeURIComponent(search)}`).then(r=>r.json()),
        fetch(`/api/plants?companyCode=${companyCode}`).then(r=>r.json()),
        fetch(`/api/materials?limit=100`).then(r=>r.json()),
      ]);
      setStos(stoRes.stos || []);
      setPlants(plantRes.plants || []);
      setMaterials(matRes.materials || []);
      setSource(stoRes.source || 'db');
      if (plantRes.plants?.length) {
        if (!newSTO.supplyingPlantId) setNewSTO(prev=>({...prev, supplyingPlantId: plantRes.plants[0].id}));
        if (!newSTO.receivingPlantId && plantRes.plants.length>1) setNewSTO(prev=>({...prev, receivingPlantId: plantRes.plants[1].id}));
        else if (!newSTO.receivingPlantId) setNewSTO(prev=>({...prev, receivingPlantId: plantRes.plants[0].id}));
      }
      if (matRes.materials?.length && !newSTO.materialId) setNewSTO(prev=>({...prev, materialId: matRes.materials[0].id}));
    } catch(e){ console.error(e); }
    setLoading(false);
  }

  useEffect(()=>{ load(); },[companyCode]);
  useEffect(()=>{ const t=setTimeout(load,400); return()=>clearTimeout(t); },[search]);

  const handleCreateSTO = async () => {
    setMsg('Creating STO ME27...');
    try {
      const res = await fetch('/api/sto', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          supplyingPlantId: newSTO.supplyingPlantId,
          receivingPlantId: newSTO.receivingPlantId,
          supplyingSlocId: newSTO.supplyingSlocId || null,
          receivingSlocId: newSTO.receivingSlocId || null,
          type: newSTO.type,
          freightCost: newSTO.freightCost,
          headerText: newSTO.headerText || `STO from ${newSTO.supplyingPlantId} to ${newSTO.receivingPlantId} via UI ME27`,
          lines: [{ materialId: newSTO.materialId, quantity: newSTO.quantity, uom: 'KG' }]
        })
      }).then(r=>r.json());
      if (res.success) {
        setMsg(`✅ STO ${res.stoNumber} created ME27 from ${newSTO.supplyingPlantId} to ${newSTO.receivingPlantId} freight ${newSTO.freightCost} • Source: ${source}`);
        setShowCreate(false);
        load();
      } else setMsg(`❌ ${res.error}`);
    } catch(e:any){ setMsg(`❌ ${e.message}`); }
  };

  const handleAction = async (id:string, action:string) => {
    try {
      const res = await fetch('/api/sto', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, action }) }).then(r=>r.json());
      if (res.success) { setMsg(`✅ STO ${id} ${action} → ${res.message}`); load(); } else setMsg(`❌ ${res.error}`);
    } catch(e:any){ setMsg(`❌ ${e.message}`); }
  };

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    { accessorKey: 'sto_number', header: 'STO Number 45*', size: 120, cell: ({ getValue }) => <span className="font-bold font-mono text-blue-600">{getValue()}</span> },
    { accessorKey: 'type', header: 'Type', size: 80, cell: ({ getValue }) => <span className={`px-1 border text-[10px] ${getValue()==='TWO_STEP'?'bg-blue-100':'bg-green-100'}`}>{getValue()}</span> },
    { accessorKey: 'supplying_plant_code', header: 'Supplying Plant', size: 120 },
    { accessorKey: 'receiving_plant_code', header: 'Receiving Plant', size: 120 },
    { accessorKey: 'status', header: 'Status', size: 120, cell: ({ getValue }) => {
      const v=getValue(); const cls=v==='FULLY_RECEIVED'?'bg-black text-white':v==='IN_TRANSIT'?'bg-yellow-100':v==='APPROVED'?'bg-green-100':'bg-zinc-100';
      return <span className={`px-1 border text-[10px] ${cls}`}>{v}</span>;
    }},
    { accessorKey: 'total_qty', header: 'Qty', size: 70 },
    { accessorKey: 'total_issued', header: 'Issued 351', size: 80 },
    { accessorKey: 'total_in_transit', header: 'In Transit', size: 90, cell: ({ getValue }) => <span className="font-bold text-orange-600">{getValue()}</span> },
    { accessorKey: 'total_received', header: 'Received 101', size: 90 },
    { accessorKey: 'freight_cost', header: 'Freight', size: 80 },
    { accessorKey: 'delivery_number', header: 'Delivery VL10B', size: 120 },
  ], []);

  const selected = selectedId ? stos.find((s:any)=>s.id===selectedId) : null;

  if (loading) return <div className="p-6">Loading STOs ME27 for {companyCode}...</div>;

  const modernContent = (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div><h2 className="text-lg font-semibold">Stock Transport Orders • {companyCode}</h2><p className="text-sm text-zinc-500">{stos.length} STOs • ME27 Create, MIGO 351 Issue (supplying plant → in-transit), MIGO 101 Receive (in-transit → receiving plant), VL10B Process Delivery • Formal STO process to move inventory between plants (e.g., main storage to production plant) with in-transit tracking and freight cost allocation • Coupled: Material Master MM01 (ent_material_master material_number MAP valuation), Plant OX10 (ent_plant supplying/receiving), SLoc OX09 (ent_storage_location supplying/receiving), Stock MMBE (inv_stock reduce supplying plant 351, increase receiving plant 101, in-transit virtual plant), Freight (freight_cost allocated to MAP at receiving plant for accurate COGS), Delivery VL10B (mm_stock_transport_order delivery_number links to outbound delivery for STO), PO ME21N (STO is like PO with supplying plant as vendor) • Company {companyCode} • Source: {source}</p></div>
        <div className="flex gap-2"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search STO/plant" className="border rounded-full px-4 py-2 text-sm w-64" /><button onClick={()=>setShowCreate(true)} className="text-sm bg-black text-white rounded-full px-4 py-2">+ New STO (ME27) {companyCode}</button></div>
      </div>

      {msg && <div className="mb-4 p-3 bg-zinc-900 text-white rounded-xl text-sm">{msg}</div>}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8"><div className="bg-white rounded-2xl border p-2"><VirtualDataGrid data={stos} columns={columns} height={500} rowHeight={32} selectedRowId={selectedId || undefined} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>setSelectedId(r.id)} /></div></div>
        <div className="col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border p-4 text-xs">
            <div className="font-medium">STO Detail • In-Transit • Freight • {companyCode} • Backend {source}</div>
            {selected ? (
              <div className="mt-3 space-y-2">
                <div><b>{(selected as any).sto_number}</b> • {(selected as any).type} • {(selected as any).supplying_plant_code} → {(selected as any).receiving_plant_code} • Status {(selected as any).status} • Freight {(selected as any).freight_cost} {(selected as any).currency} • Delivery {(selected as any).delivery_number||'None'}</div>
                <div>Lines: {(selected as any).line_count} • Qty {(selected as any).total_qty} • Issued 351 {(selected as any).total_issued} • In Transit {(selected as any).total_in_transit} • Received 101 {(selected as any).total_received}</div>
                <div className="mt-2 border rounded-xl p-2 bg-zinc-50 max-h-[200px] overflow-auto">
                  {(selected as any).lines?.map((l:any)=><div key={l.id} className="border-b pb-1 mt-1">{l.line_number} {l.material_number} {l.description?.substring(0,20)} {l.quantity} {l.uom} Issued {l.quantity_issued} Transit {l.quantity_in_transit} Received {l.quantity_received} Batch {l.batch_number} {l.is_closed?'Closed':''}</div>)}
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {(selected as any).status==='DRAFT' && <button onClick={()=>handleAction((selected as any).id, 'APPROVE')} className="text-xs bg-green-600 text-white rounded-full px-3 py-2">Approve STO →</button>}
                  {(selected as any).status==='APPROVED' && <button onClick={()=>handleAction((selected as any).id, 'ISSUE')} className="text-xs bg-yellow-600 text-white rounded-full px-3 py-2">Issue 351 → In Transit (MIGO 351)</button>}
                  {(selected as any).status==='IN_TRANSIT' && <button onClick={()=>handleAction((selected as any).id, 'RECEIVE')} className="text-xs bg-blue-600 text-white rounded-full px-3 py-2">Receive 101 → Receiving Plant (MIGO 101)</button>}
                  {(selected as any).status==='FULLY_RECEIVED' && <button onClick={()=>handleAction((selected as any).id, 'CLOSE')} className="text-xs bg-black text-white rounded-full px-3 py-2">Close STO →</button>}
                </div>
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px]">STO moves inventory between plants with in-transit tracking and freight cost allocation. Two-step: 351 Issue supplying plant → in-transit stock (virtual plant), 101 Receive in-transit → receiving plant. Freight cost allocated to material valuation MAP at receiving plant.</div>
              </div>
            ) : <div className="text-zinc-500 mt-2">Select STO row - shows in-transit, freight, issue/receive • Backend connected {source} • {companyCode}</div>}
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={()=>setShowCreate(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border w-full max-w-lg p-6">
            <h3 className="font-semibold">Create Stock Transport Order</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><label className="text-xs">Supplying Plant * (From)</label><select value={newSTO.supplyingPlantId} onChange={e=>setNewSTO({...newSTO, supplyingPlantId: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select Supplying Plant</option>{plants.map((p:any)=><option key={p.id} value={p.id}>{p.code} {p.name}</option>)}</select></div>
              <div><label className="text-xs">Receiving Plant * (To)</label><select value={newSTO.receivingPlantId} onChange={e=>setNewSTO({...newSTO, receivingPlantId: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select Receiving Plant</option>{plants.map((p:any)=><option key={p.id} value={p.id}>{p.code} {p.name}</option>)}</select></div>
              <div><label className="text-xs">Type</label><select value={newSTO.type} onChange={e=>setNewSTO({...newSTO, type: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="TWO_STEP">TWO_STEP (351 Issue + 101 Receive with In-Transit)</option><option value="ONE_STEP">ONE_STEP (301 Direct)</option></select></div>
              <div><label className="text-xs">Freight Cost {companyCode==='KS01'?'INR':'KWD'}</label><input value={newSTO.freightCost} onChange={e=>setNewSTO({...newSTO, freightCost: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="50"/></div>
              <div className="col-span-2"><label className="text-xs">Material *</label><select value={newSTO.materialId} onChange={e=>setNewSTO({...newSTO, materialId: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select Material</option>{materials.map((m:any)=><option key={m.id} value={m.id}>{m.material_number} {m.description}</option>)}</select></div>
              <div><label className="text-xs">Quantity</label><input value={newSTO.quantity} onChange={e=>setNewSTO({...newSTO, quantity: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="100"/></div>
              <div><label className="text-xs">Header Text</label><input value={newSTO.headerText} onChange={e=>setNewSTO({...newSTO, headerText: e.target.value})} placeholder={`STO for ${companyCode}`} className="mt-1 w-full border rounded-xl px-3 py-2"/></div>
            </div>
            <div className="mt-6 flex gap-2"><button onClick={()=>setShowCreate(false)} className="flex-1 border rounded-full py-2.5">Cancel</button><button onClick={handleCreateSTO} className="flex-1 bg-black text-white rounded-full py-2.5">Create STO • ME27 • {companyCode}</button></div>
            {msg && <div className="mt-3 text-xs p-2 bg-zinc-900 text-white rounded-xl">{msg}</div>}
          </div>
        </div>
      )}
    </div>
  );

  const classicContent = (
    <div className="font-mono text-[11px] bg-[#f5f5f0]">
      <div className="border border-[#808080] bg-[#f0f0f0] p-2"><div className="font-bold border-b border-[#808080] pb-1">ME27/MIGO/VL10B Selection • STO • {companyCode} • Multi-Plant Logistics • Backend {source}</div><div className="grid grid-cols-12 gap-1 items-center mt-2"><div className="col-span-2 text-right pr-2">STO Number:</div><div className="col-span-3"><input value={search} onChange={e=>setSearch(e.target.value)} className="w-full border border-black bg-white h-5 px-1" placeholder="45*" /></div><div className="col-span-2 text-right pr-2">Supplying Plant:</div><div className="col-span-3"><input placeholder="Plant*" className="w-full border border-black bg-white h-5 px-1" /></div><div className="col-span-2"><button onClick={load} className="bg-[#d4d0c8] border border-[#404040] px-3 h-5">Execute F8 • {source}</button></div></div></div>
      <div className="mt-1 border border-black bg-white"><div className="bg-[#d4d0c8] border-b border-black px-2 h-6 flex items-center font-bold">STO Table Control • {stos.length} entries • ME27/MIGO 351/101/VL10B • In-Transit • Freight • {source} • {companyCode}</div><VirtualDataGrid data={stos} columns={columns} height={450} rowHeight={26} selectedRowId={selectedId || undefined} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>setSelectedId(r.id)} /></div>
    </div>
  );

  return (
    <ModernModuleShell title={`Stock Transport Orders ${companyCode}`} subtitle={`${companyCode}`} tooltip={`ME27/MIGO 351/101/VL10B • Multi-Plant Logistics • In-Transit Tracking • Freight Allocation • Backend Connected ${source} • ${companyCode}`} code="ME27" module="MM" kpis={[
      {label:'Total STOs', value: stos.length.toString(), icon:'🚚'},
      {label:'In Transit', value: stos.filter((s:any)=>s.status==='IN_TRANSIT').length.toString(), icon:'⏳'},
      {label:'Fully Received', value: stos.filter((s:any)=>s.status==='FULLY_RECEIVED').length.toString(), icon:'✅'},
      {label:'Source', value: source, icon:'🔗'},
    ]}>
      {modernContent}
      <div className="mt-8 border-t pt-6"><div className="text-xs font-medium mb-3">Classic ERP GUI • ME27 • Functional • Backend Connected</div>{classicContent}</div>
    </ModernModuleShell>
  );
}
