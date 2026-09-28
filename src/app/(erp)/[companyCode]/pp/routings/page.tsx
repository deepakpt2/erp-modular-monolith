"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { VirtualDataGrid } from '@/shared/ui/virtual-data-grid';
import { ColumnDef } from '@tanstack/react-table';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function RoutingsPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [routings, setRoutings] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newRouting, setNewRouting] = useState({ materialId: '', plantId: '', bomHeaderId: '', description: '', operations: [{ operationNumber: 10, workCenterId: '', description: 'Blending', setupTimeMinutes: '10', machineTimeMinutes: '20', laborTimeMinutes: '20', baseQuantity: '1' }] as any[] });
  const [msg, setMsg] = useState('');
  const [source, setSource] = useState('db');

  async function load() {
    setLoading(true);
    try {
      const [routingRes, plantRes, matRes, wcRes, bomRes] = await Promise.all([
        fetch(`/api/routings?limit=100&search=${encodeURIComponent(search)}`).then(r=>r.json()),
        fetch(`/api/plants?companyCode=${companyCode}`).then(r=>r.json()),
        fetch(`/api/materials?limit=100`).then(r=>r.json()),
        fetch(`/api/work-centers?limit=100`).then(r=>r.json()).catch(()=>({workCenters:[]})),
        fetch(`/api/bom?limit=100`).then(r=>r.json()).catch(()=>({boms:[]})),
      ]);
      setRoutings(routingRes.routings || []);
      setPlants(plantRes.plants || []);
      setMaterials(matRes.materials || []);
      setWorkCenters(wcRes.workCenters || []);
      setBoms(bomRes.boms || []);
      setSource(routingRes.source || 'db');
      if (plantRes.plants?.length && !newRouting.plantId) setNewRouting(prev=>({...prev, plantId: plantRes.plants[0].id}));
      if (matRes.materials?.length && !newRouting.materialId) setNewRouting(prev=>({...prev, materialId: matRes.materials[0].id}));
      if (wcRes.workCenters?.length && !newRouting.operations[0].workCenterId) setNewRouting(prev=>({...prev, operations: prev.operations.map((op:any)=>({...op, workCenterId: wcRes.workCenters[0].id}))}));
    } catch(e){ console.error(e); }
    setLoading(false);
  }

  useEffect(()=>{ load(); },[companyCode]);
  useEffect(()=>{ const t=setTimeout(load,400); return()=>clearTimeout(t); },[search]);

  const handleCreateRouting = async () => {
    setMsg('Creating Routing CA01...');
    try {
      const res = await fetch('/api/routings', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          materialId: newRouting.materialId,
          plantId: newRouting.plantId,
          bomHeaderId: newRouting.bomHeaderId || null,
          description: newRouting.description,
          operations: newRouting.operations.filter((op:any)=>op.workCenterId).map((op:any)=>({
            operationNumber: op.operationNumber,
            workCenterId: op.workCenterId,
            description: op.description,
            setupTimeMinutes: parseInt(op.setupTimeMinutes||'0'),
            machineTimeMinutes: parseInt(op.machineTimeMinutes||'0'),
            laborTimeMinutes: parseInt(op.laborTimeMinutes||'0'),
            baseQuantity: op.baseQuantity,
          }))
        })
      }).then(r=>r.json());
      if (res.success) {
        setMsg(`✅ Routing ${res.routingNumber} created CA01 with ${newRouting.operations.length} operations • Source: ${source}`);
        setShowCreate(false);
        load();
      } else setMsg(`❌ ${res.error}`);
    } catch(e:any){ setMsg(`❌ ${e.message}`); }
  };

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    { accessorKey: 'routing_number', header: 'Routing Number', size: 130, cell: ({ getValue }) => <span className="font-bold font-mono text-blue-600">{getValue()}</span> },
    { accessorKey: 'material_number', header: 'Material FERT', size: 150 },
    { accessorKey: 'plant_code', header: 'Plant', size: 80 },
    { accessorKey: 'bom_number', header: 'BOM', size: 120 },
    { accessorKey: 'status', header: 'Status', size: 80, cell: ({ getValue }) => {
      const v=getValue(); const cls=v==='ACTIVE'?'bg-green-100':'bg-yellow-100';
      return <span className={`px-1 border text-[10px] ${cls}`}>{v}</span>;
    }},
    { accessorKey: 'operation_count', header: 'Operations', size: 80 },
    { accessorKey: 'total_time_minutes', header: 'Total Time min', size: 110 },
    { accessorKey: 'version', header: 'Version', size: 60 },
  ], []);

  const selected = selectedId ? routings.find((r:any)=>r.id===selectedId) : null;

  if (loading) return <div className="p-6">Loading Routings CA01 for {companyCode}...</div>;

  const modernContent = (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div><h2 className="text-lg font-semibold">Routings • {companyCode}</h2><p className="text-sm text-zinc-500">{routings.length} routings • CA01 Create, CA02 Change, CA03 Display • Define sequence of manufacturing steps with work center, setup/machine/labor times for product costing labor/overhead • Coupled: Material Master MM01 (ent_material_master FERT), Plant OX10 (ent_plant), BOM CS01 (pp_bom_header bom_header_id link for material+plant+version), Work Center CR01 (pp_work_center labor_rate_per_hour machine_rate_per_hour overhead_rate_percent setup_time_minutes), Costing CK40N (routing operations → labor/machine/overhead costs), Production Order CO01 (routing defines steps for prod order), MRP MD01 (routing for planned orders) • Company {companyCode} • Source: {source}</p></div>
        <div className="flex gap-2"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search routing/material" className="border rounded-full px-4 py-2 text-sm w-64" /><button onClick={()=>setShowCreate(true)} className="text-sm bg-black text-white rounded-full px-4 py-2">+ New Routing (CA01) {companyCode}</button></div>
      </div>

      {msg && <div className="mb-4 p-3 bg-zinc-900 text-white rounded-xl text-sm">{msg}</div>}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8"><div className="bg-white rounded-2xl border p-2"><VirtualDataGrid data={routings} columns={columns} height={500} rowHeight={32} selectedRowId={selectedId || undefined} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>setSelectedId(r.id)} /></div></div>
        <div className="col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border p-4 text-xs">
            <div className="font-medium">Routing Detail • Operations • Work Centers • {companyCode} • Backend {source}</div>
            {selected ? (
              <div className="mt-3 space-y-2">
                <div><b>{(selected as any).routing_number}</b> • {(selected as any).material_number} {(selected as any).material_description?.substring(0,20)} • Plant {(selected as any).plant_code} • BOM {(selected as any).bom_number||'None'} • Status {(selected as any).status} • Version {(selected as any).version} • Ops {(selected as any).operation_count} • Total Time {(selected as any).total_time_minutes} min</div>
                <div className="mt-2 border rounded-xl p-2 bg-zinc-50 max-h-[300px] overflow-auto">
                  <div className="font-bold">Operations • Sequence</div>
                  {(selected as any).operations?.map((op:any)=><div key={op.id} className="mt-1 border-b pb-1"><div className="flex justify-between"><span>{op.operation_number} {op.work_center_code} {op.description}</span><span>{op.setup_time_minutes} setup + {op.machine_time_minutes} machine + {op.labor_time_minutes} labor = {op.setup_time_minutes+op.machine_time_minutes+op.labor_time_minutes} min</span></div><div className="text-[10px] text-zinc-500">WC {op.work_center_name} capacity {op.capacity_per_hour}/h labor {op.labor_rate_per_hour} machine {op.machine_rate_per_hour} overhead {op.overhead_rate_percent}% • Base Qty {op.base_quantity}</div></div>)}
                </div>
                <div className="mt-3 p-2 bg-zinc-50 border rounded-xl text-[11px]">
                  <div className="font-bold">Product Costing with Routing:</div>
                  <div className="mt-1">Labor Cost = Σ (laborTime/60 * laborRate), Machine Cost = Σ (machineTime/60 * machineRate), Overhead = (material+labor+machine)*overheadRate%. Example: Blending 20 min labor @5 KWD/h = 1.67 KWD, 20 min machine @10 KWD/h = 3.33 KWD, QC 15 min labor @5 = 1.25 KWD, Packing 10 min labor @5 = 0.83 KWD + 15 min machine @10 = 2.5 KWD → Total labor 3.75 KWD + machine 5.83 KWD = 9.58 KWD + overhead 20% = 1.92 KWD → Total labor/overhead 11.5 KWD + material 0.644 KWD = 12.14 KWD Std Price.</div>
                </div>
              </div>
            ) : <div className="text-zinc-500 mt-2">Select routing row - shows operations sequence, work centers, setup/machine/labor times • Backend connected {source} • {companyCode}</div>}
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={()=>setShowCreate(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border w-full max-w-2xl p-6 max-h-[90vh] overflow-auto">
            <h3 className="font-semibold">Create Routing</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><label className="text-xs">Material FERT *</label><select value={newRouting.materialId} onChange={e=>setNewRouting({...newRouting, materialId: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select FERT</option>{materials.map((m:any)=><option key={m.id} value={m.id}>{m.material_number} {m.description}</option>)}</select></div>
              <div><label className="text-xs">Plant *</label><select value={newRouting.plantId} onChange={e=>setNewRouting({...newRouting, plantId: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select Plant</option>{plants.map((p:any)=><option key={p.id} value={p.id}>{p.code} {p.name}</option>)}</select></div>
              <div><label className="text-xs">BOM (optional)</label><select value={newRouting.bomHeaderId} onChange={e=>setNewRouting({...newRouting, bomHeaderId: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">None</option>{boms.map((b:any)=><option key={b.id} value={b.id}>{b.bom_number} {b.material_number}</option>)}</select></div>
              <div><label className="text-xs">Description</label><input value={newRouting.description} onChange={e=>setNewRouting({...newRouting, description: e.target.value})} placeholder="Garam Masala Routing" className="mt-1 w-full border rounded-xl px-3 py-2"/></div>
              <div className="col-span-2 border-t pt-3 mt-2">
                <div className="flex justify-between items-center"><label className="text-xs font-bold">Operations • Sequence of Manufacturing Steps</label><button onClick={()=>setNewRouting({...newRouting, operations: [...newRouting.operations, { operationNumber: (newRouting.operations.length+1)*10, workCenterId: workCenters[0]?.id||'', description: 'Operation', setupTimeMinutes: '5', machineTimeMinutes: '10', laborTimeMinutes: '10', baseQuantity: '1' }]})} className="text-xs border rounded-full px-2 py-1">+ Add Operation</button></div>
                {newRouting.operations.map((op:any, idx:number)=><div key={idx} className="mt-2 grid grid-cols-7 gap-1 items-center"><input value={op.operationNumber} onChange={e=>{ const ops=[...newRouting.operations]; ops[idx].operationNumber=parseInt(e.target.value); setNewRouting({...newRouting, operations: ops}); }} className="border rounded-xl px-2 py-2 text-xs" placeholder="Op No"/><select value={op.workCenterId} onChange={e=>{ const ops=[...newRouting.operations]; ops[idx].workCenterId=e.target.value; setNewRouting({...newRouting, operations: ops}); }} className="col-span-2 border rounded-xl px-2 py-2 text-xs"><option value="">Select WC</option>{workCenters.map((wc:any)=><option key={wc.id} value={wc.id}>{wc.code} {wc.name}</option>)}</select><input value={op.description} onChange={e=>{ const ops=[...newRouting.operations]; ops[idx].description=e.target.value; setNewRouting({...newRouting, operations: ops}); }} className="border rounded-xl px-2 py-2 text-xs" placeholder="Desc"/><input value={op.setupTimeMinutes} onChange={e=>{ const ops=[...newRouting.operations]; ops[idx].setupTimeMinutes=e.target.value; setNewRouting({...newRouting, operations: ops}); }} className="border rounded-xl px-2 py-2 text-xs" placeholder="Setup min"/><input value={op.machineTimeMinutes} onChange={e=>{ const ops=[...newRouting.operations]; ops[idx].machineTimeMinutes=e.target.value; setNewRouting({...newRouting, operations: ops}); }} className="border rounded-xl px-2 py-2 text-xs" placeholder="Machine min"/><input value={op.laborTimeMinutes} onChange={e=>{ const ops=[...newRouting.operations]; ops[idx].laborTimeMinutes=e.target.value; setNewRouting({...newRouting, operations: ops}); }} className="border rounded-xl px-2 py-2 text-xs" placeholder="Labor min"/></div>)}
              </div>
            </div>
            <div className="mt-6 flex gap-2"><button onClick={()=>setShowCreate(false)} className="flex-1 border rounded-full py-2.5">Cancel</button><button onClick={handleCreateRouting} className="flex-1 bg-black text-white rounded-full py-2.5">Create Routing • CA01 • {companyCode}</button></div>
            {msg && <div className="mt-3 text-xs p-2 bg-zinc-900 text-white rounded-xl">{msg}</div>}
          </div>
        </div>
      )}
    </div>
  );

  const classicContent = (
    <div className="font-mono text-[11px] bg-[#f5f5f0]">
      <div className="border border-[#808080] bg-[#f0f0f0] p-2"><div className="font-bold border-b border-[#808080] pb-1">CA01/CA02/CA03 Selection • Routings • {companyCode} • Operations • Work Centers • Backend {source}</div><div className="grid grid-cols-12 gap-1 items-center mt-2"><div className="col-span-2 text-right pr-2">Routing Number:</div><div className="col-span-3"><input value={search} onChange={e=>setSearch(e.target.value)} className="w-full border border-black bg-white h-5 px-1" placeholder="ROUTING-*" /></div><div className="col-span-2 text-right pr-2">Material:</div><div className="col-span-3"><input placeholder="FERT*" className="w-full border border-black bg-white h-5 px-1" /></div><div className="col-span-2"><button onClick={load} className="bg-[#d4d0c8] border border-[#404040] px-3 h-5">Execute F8 • {source}</button></div></div></div>
      <div className="mt-1 border border-black bg-white"><div className="bg-[#d4d0c8] border-b border-black px-2 h-6 flex items-center font-bold">Routing Table Control • {routings.length} entries • CA01/CA02/CA03 • Operations • Work Centers • {source} • {companyCode}</div><VirtualDataGrid data={routings} columns={columns} height={450} rowHeight={26} selectedRowId={selectedId || undefined} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>setSelectedId(r.id)} /></div>
    </div>
  );

  return (
    <ModernModuleShell title={`Routings ${companyCode}`} subtitle={`${companyCode}`} tooltip={`CA01/CA02/CA03 • Routings • Sequence of Manufacturing Steps • Work Centers • Labor/Overhead Costing • Backend Connected ${source} • ${companyCode}`} code="CA01" module="PP" kpis={[
      {label:'Total Routings', value: routings.length.toString(), icon:'📋'},
      {label:'Avg Ops', value: `${routings.length>0?(routings.reduce((s:any,r:any)=>s+parseInt(r.operation_count||0),0)/routings.length).toFixed(1):'0'}`, icon:'⚙️'},
      {label:'Source', value: source, icon:'🔗'},
      {label:'Company', value: companyCode, icon:'🏢'},
    ]}>
      {modernContent}
      <div className="mt-8 border-t pt-6"><div className="text-xs font-medium mb-3">Classic ERP GUI • CA01 • Functional • Backend Connected</div>{classicContent}</div>
    </ModernModuleShell>
  );
}
