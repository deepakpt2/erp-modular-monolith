"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { VirtualDataGrid } from '@/shared/ui/virtual-data-grid';
import { ColumnDef } from '@tanstack/react-table';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function WorkCentersPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [wcs, setWcs] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newWC, setNewWC] = useState({ code: '', name: '', plantId: '', costCenterId: '', description: '', capacityPerHour: '10', laborRate: '5', machineRate: '10', overheadRate: '20' });
  const [msg, setMsg] = useState('');
  const [source, setSource] = useState('db');

  async function load() {
    setLoading(true);
    try {
      const [wcRes, plantRes, ccRes] = await Promise.all([
        fetch(`/api/work-centers?limit=100&search=${encodeURIComponent(search)}`).then(r=>r.json()),
        fetch(`/api/plants?companyCode=${companyCode}`).then(r=>r.json()),
        fetch(`/api/cost-centers?companyCode=${companyCode}`).then(r=>r.json()).catch(()=>({costCenters:[]})),
      ]);
      setWcs(wcRes.workCenters || []);
      setPlants(plantRes.plants || []);
      setCostCenters(ccRes.costCenters || []);
      setSource(wcRes.source || 'db');
      if (plantRes.plants?.length && !newWC.plantId) setNewWC(prev=>({...prev, plantId: plantRes.plants[0].id}));
      if (ccRes.costCenters?.length && !newWC.costCenterId) setNewWC(prev=>({...prev, costCenterId: ccRes.costCenters[0].id}));
    } catch(e){ console.error(e); }
    setLoading(false);
  }

  useEffect(()=>{ load(); },[companyCode]);
  useEffect(()=>{ const t=setTimeout(load,400); return()=>clearTimeout(t); },[search]);

  const handleCreateWC = async () => {
    setMsg('Creating Work Center CR01...');
    try {
      const res = await fetch('/api/work-centers', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          code: newWC.code || `WC-${Date.now().toString().slice(-6)}`,
          name: newWC.name,
          plantId: newWC.plantId,
          costCenterId: newWC.costCenterId || null,
          description: newWC.description,
          capacityPerHour: newWC.capacityPerHour,
          laborRate: newWC.laborRate,
          machineRate: newWC.machineRate,
          overheadRate: newWC.overheadRate,
        })
      }).then(r=>r.json());
      if (res.success) {
        setMsg(`✅ Work Center ${res.workCenter.code} created CR01 capacity ${newWC.capacityPerHour}/h labor ${newWC.laborRate} machine ${newWC.machineRate} overhead ${newWC.overheadRate}% • Source: ${source}`);
        setShowCreate(false);
        load();
      } else setMsg(`❌ ${res.error}`);
    } catch(e:any){ setMsg(`❌ ${e.message}`); }
  };

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    { accessorKey: 'code', header: 'Work Center', size: 140, cell: ({ getValue }) => <span className="font-bold font-mono text-blue-600">{getValue()}</span> },
    { accessorKey: 'name', header: 'Name', size: 200 },
    { accessorKey: 'plant_code', header: 'Plant', size: 80 },
    { accessorKey: 'cost_center_code', header: 'Cost Center', size: 120 },
    { accessorKey: 'capacity_per_hour', header: 'Capacity/h', size: 90 },
    { accessorKey: 'labor_rate', header: 'Labor Rate', size: 90, cell: ({ getValue }) => <span>{getValue()||'5'} {companyCode==='KS01'?'INR':'KWD'}/h</span> },
    { accessorKey: 'machine_rate', header: 'Machine Rate', size: 100, cell: ({ getValue }) => <span>{getValue()||'10'} {companyCode==='KS01'?'INR':'KWD'}/h</span> },
    { accessorKey: 'overhead_rate', header: 'Overhead %', size: 80 },
    { accessorKey: 'bom_line_count', header: 'BOM Lines', size: 80 },
    { accessorKey: 'routing_line_count', header: 'Routing Ops', size: 90 },
    { accessorKey: 'is_active', header: 'Active', size: 60, cell: ({ getValue }) => <span className={`px-1 border text-[10px] ${getValue()?'bg-green-100':'bg-red-100'}`}>{getValue()?'Yes':'No'}</span> },
  ], [companyCode]);

  const selected = selectedId ? wcs.find((w:any)=>w.id===selectedId) : null;

  if (loading) return <div className="p-6">Loading Work Centers CR01 for {companyCode}...</div>;

  const modernContent = (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div><h2 className="text-lg font-semibold">Work Centers • {companyCode}</h2><p className="text-sm text-zinc-500">{wcs.length} work centers • CR01 Create, CR02 Change, CR03 Display • Track machine/labor capacity and cost center, labor/machine rates for product costing labor/overhead - previously costing only material costs • Coupled: Cost Center KS01 (fi_cost_center salary expenses, CCA report), BOM CS01 (pp_bom_line work_center_id), Routing CA01 (pp_routing_line work_center_id setup/machine/labor times), Costing CK40N (laborCost = laborTime/60*laborRate, machineCost = machineTime/60*machineRate, overhead = (mat+labor+machine)*overhead%), Plant OX10 (ent_plant) • Company {companyCode} • Source: {source}</p></div>
        <div className="flex gap-2"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search WC" className="border rounded-full px-4 py-2 text-sm w-64" /><button onClick={()=>setShowCreate(true)} className="text-sm bg-black text-white rounded-full px-4 py-2">+ New Work Center (CR01) {companyCode}</button></div>
      </div>

      {msg && <div className="mb-4 p-3 bg-zinc-900 text-white rounded-xl text-sm">{msg}</div>}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8"><div className="bg-white rounded-2xl border p-2"><VirtualDataGrid data={wcs} columns={columns} height={500} rowHeight={32} selectedRowId={selectedId || undefined} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>setSelectedId(r.id)} /></div></div>
        <div className="col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border p-4 text-xs">
            <div className="font-medium">Work Center Detail • Capacity • Rates • {companyCode} • Backend {source}</div>
            {selected ? (
              <div className="mt-3 space-y-2">
                <div><b>{(selected as any).code}</b> • {(selected as any).name} • Plant {(selected as any).plant_code} {(selected as any).plant_name} • Cost Center {(selected as any).cost_center_code} {(selected as any).cost_center_name} • Capacity {(selected as any).capacity_per_hour}/h • Active {(selected as any).is_active?'Yes':'No'}</div>
                <div>Labor Rate: {(selected as any).labor_rate||'5'} {companyCode==='KS01'?'INR':'KWD'}/h • Machine Rate: {(selected as any).machine_rate||'10'} {companyCode==='KS01'?'INR':'KWD'}/h • Overhead: {(selected as any).overhead_rate||'20'}% • Setup {(selected as any).setup_time_minutes||0} min</div>
                <div>BOM Lines: {(selected as any).bom_line_count} • Routing Ops: {(selected as any).routing_line_count} • Description: {(selected as any).description}</div>
                <div className="mt-3 p-2 bg-zinc-50 border rounded-xl text-[11px]">
                  <div className="font-bold">Product Costing with Labor/Overhead:</div>
                  <div className="mt-1">Previously CK40N only material costs Σ MAP ROH, labor=0 overhead=0. Now with Work Centers: laborCost = Σ (laborTimeMinutes/60 * laborRatePerHour), machineCost = Σ (machineTimeMinutes/60 * machineRatePerHour), overhead = (material+ labor+ machine) * overheadRate%. Routing defines sequence of operations with work center, setup/machine/labor times for accurate product costing.</div>
                </div>
              </div>
            ) : <div className="text-zinc-500 mt-2">Select work center row - shows capacity, rates, cost center, BOM/routing usage • Backend connected {source} • {companyCode}</div>}
          </div>
          <div className="bg-white rounded-2xl border p-4 text-xs">
            <div className="font-medium text-sm">Details</div>
            <div className="mt-2 space-y-1 text-[11px]">
              <div>GET /api/work-centers?plantId and search - list work centers with plant_code, cost_center_code, bom_line_count, routing_line_count</div>
              <div>POST /api/work-centers code, name, plantId, costCenterId, description, capacityPerHour, laborRate, machineRate, overheadRate - CR01</div>
              <div>PUT id, action:SET_ACTIVE, isActive - CR02 active toggle</div>
              <div>PUT id, action:UPDATE_CAPACITY, capacityPerHour - CR02 capacity update</div>
              <div>Plants: {plants.map((p:any)=>p.code).join(', ')} - Cost Centers: {costCenters.slice(0,3).map((c:any)=>c.code).join(', ')}</div>
            </div>
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={()=>setShowCreate(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border w-full max-w-lg p-6">
            <h3 className="font-semibold">Create Work Center</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><label className="text-xs">Code *</label><input value={newWC.code} onChange={e=>setNewWC({...newWC, code: e.target.value})} placeholder={`WC-${companyCode}-01`} className="mt-1 w-full border rounded-xl px-3 py-2"/></div>
              <div><label className="text-xs">Name *</label><input value={newWC.name} onChange={e=>setNewWC({...newWC, name: e.target.value})} placeholder="Main Kitchen Work Center" className="mt-1 w-full border rounded-xl px-3 py-2"/></div>
              <div><label className="text-xs">Plant *</label><select value={newWC.plantId} onChange={e=>setNewWC({...newWC, plantId: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select Plant</option>{plants.map((p:any)=><option key={p.id} value={p.id}>{p.code} {p.name}</option>)}</select></div>
              <div><label className="text-xs">Cost Center</label><select value={newWC.costCenterId} onChange={e=>setNewWC({...newWC, costCenterId: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select Cost Center</option>{costCenters.map((c:any)=><option key={c.id} value={c.id}>{c.code} {c.name}</option>)}</select></div>
              <div><label className="text-xs">Capacity/h</label><input value={newWC.capacityPerHour} onChange={e=>setNewWC({...newWC, capacityPerHour: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="10"/></div>
              <div><label className="text-xs">Labor Rate {companyCode==='KS01'?'INR':'KWD'}/h</label><input value={newWC.laborRate} onChange={e=>setNewWC({...newWC, laborRate: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="5"/></div>
              <div><label className="text-xs">Machine Rate {companyCode==='KS01'?'INR':'KWD'}/h</label><input value={newWC.machineRate} onChange={e=>setNewWC({...newWC, machineRate: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="10"/></div>
              <div><label className="text-xs">Overhead %</label><input value={newWC.overheadRate} onChange={e=>setNewWC({...newWC, overheadRate: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="20"/></div>
              <div className="col-span-2"><label className="text-xs">Description</label><input value={newWC.description} onChange={e=>setNewWC({...newWC, description: e.target.value})} placeholder="Main kitchen work center for blending" className="mt-1 w-full border rounded-xl px-3 py-2"/></div>
            </div>
            <div className="mt-6 flex gap-2"><button onClick={()=>setShowCreate(false)} className="flex-1 border rounded-full py-2.5">Cancel</button><button onClick={handleCreateWC} className="flex-1 bg-black text-white rounded-full py-2.5">Create WC • CR01 • {companyCode}</button></div>
            {msg && <div className="mt-3 text-xs p-2 bg-zinc-900 text-white rounded-xl">{msg}</div>}
          </div>
        </div>
      )}
    </div>
  );

  const classicContent = (
    <div className="font-mono text-[11px] bg-[#f5f5f0]">
      <div className="border border-[#808080] bg-[#f0f0f0] p-2"><div className="font-bold border-b border-[#808080] pb-1">CR01/CR02/CR03 Selection • Work Centers • {companyCode} • Capacity • Rates • Backend {source}</div><div className="grid grid-cols-12 gap-1 items-center mt-2"><div className="col-span-2 text-right pr-2">Work Center:</div><div className="col-span-3"><input value={search} onChange={e=>setSearch(e.target.value)} className="w-full border border-black bg-white h-5 px-1" placeholder="WC-*" /></div><div className="col-span-2 text-right pr-2">Plant:</div><div className="col-span-3"><input placeholder="Plant*" className="w-full border border-black bg-white h-5 px-1" /></div><div className="col-span-2"><button onClick={load} className="bg-[#d4d0c8] border border-[#404040] px-3 h-5">Execute F8 • {source}</button></div></div></div>
      <div className="mt-1 border border-black bg-white"><div className="bg-[#d4d0c8] border-b border-black px-2 h-6 flex items-center font-bold">Work Center Table Control • {wcs.length} entries • CR01/CR02/CR03 • Capacity • Labor/Overhead • {source} • {companyCode}</div><VirtualDataGrid data={wcs} columns={columns} height={450} rowHeight={26} selectedRowId={selectedId || undefined} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>setSelectedId(r.id)} /></div>
    </div>
  );

  return (
    <ModernModuleShell title={`Work Centers ${companyCode}`} subtitle={`${companyCode}`} tooltip={`CR01/CR02/CR03 • Work Centers • Machine/Labor Capacity • Labor/Overhead Costing • Backend Connected ${source} • ${companyCode}`} code="CR01" module="PP" kpis={[
      {label:'Total WCs', value: wcs.length.toString(), icon:'🏭'},
      {label:'Active', value: wcs.filter((w:any)=>w.is_active).length.toString(), icon:'✅'},
      {label:'Avg Capacity', value: `${wcs.length>0?(wcs.reduce((s:any,w:any)=>s+parseFloat(w.capacity_per_hour||0),0)/wcs.length).toFixed(1):'0'}/h`, icon:'⚙️'},
      {label:'Source', value: source, icon:'🔗'},
    ]}>
      {modernContent}
      <div className="mt-8 border-t pt-6"><div className="text-xs font-medium mb-3">Classic ERP GUI • CR01 • Functional • Backend Connected</div>{classicContent}</div>
    </ModernModuleShell>
  );
}
