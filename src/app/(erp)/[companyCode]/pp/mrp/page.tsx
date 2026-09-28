"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { VirtualDataGrid } from '@/shared/ui/virtual-data-grid';
import { ColumnDef } from '@tanstack/react-table';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function MRPPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [mrpRuns, setMrpRuns] = useState<any[]>([]);
  const [mrpElements, setMrpElements] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newMRP, setNewMRP] = useState({ plantId: '', planningHorizonDays: '30', includeSafetyStock: true, includeSalesOrders: true });
  const [msg, setMsg] = useState('');
  const [source, setSource] = useState('db');

  async function loadRuns() {
    setLoading(true);
    try {
      const [mrpRes, plantRes] = await Promise.all([
        fetch(`/api/mrp?limit=100`).then(r=>r.json()),
        fetch(`/api/plants?companyCode=${companyCode}`).then(r=>r.json()),
      ]);
      setMrpRuns(mrpRes.mrpRuns || []);
      setPlants(plantRes.plants || []);
      setSource(mrpRes.source || 'db');
      if (plantRes.plants?.length && !newMRP.plantId) setNewMRP(prev=>({...prev, plantId: plantRes.plants[0].id}));
      if (mrpRes.mrpRuns?.length && !selectedRunId) {
        setSelectedRunId(mrpRes.mrpRuns[0].id);
        loadElements(mrpRes.mrpRuns[0].id);
      }
    } catch(e){ console.error(e); }
    setLoading(false);
  }

  async function loadElements(mrpRunId: string) {
    try {
      const res = await fetch(`/api/mrp?mrpRunId=${mrpRunId}`).then(r=>r.json());
      setMrpElements(res.mrpElements || []);
    } catch(e){ console.error(e); }
  }

  useEffect(()=>{ loadRuns(); },[companyCode]);

  const handleRunMRP = async () => {
    setMsg('Running MRP MD01...');
    try {
      const res = await fetch('/api/mrp', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          plantId: newMRP.plantId,
          planningHorizonDays: parseInt(newMRP.planningHorizonDays),
          includeSafetyStock: newMRP.includeSafetyStock,
          includeSalesOrders: newMRP.includeSalesOrders,
        })
      }).then(r=>r.json());
      if (res.success) {
        setMsg(`✅ MRP Run ${res.mrpNumber} completed MD01: ${res.message} • Source: ${source}`);
        setShowCreate(false);
        loadRuns();
      } else setMsg(`❌ ${res.error}`);
    } catch(e:any){ setMsg(`❌ ${e.message}`); }
  };

  const runColumns = useMemo<ColumnDef<any, any>[]>(() => [
    { accessorKey: 'mrp_number', header: 'MRP Number', size: 120, cell: ({ getValue }) => <span className="font-bold font-mono text-blue-600">{getValue()}</span> },
    { accessorKey: 'plant_code', header: 'Plant', size: 80 },
    { accessorKey: 'status', header: 'Status', size: 90, cell: ({ getValue }) => {
      const v=getValue(); const cls=v==='COMPLETED'?'bg-black text-white':v==='RUNNING'?'bg-yellow-100':'bg-zinc-100';
      return <span className={`px-1 border text-[10px] ${cls}`}>{v}</span>;
    }},
    { accessorKey: 'total_materials', header: 'Materials', size: 80 },
    { accessorKey: 'total_shortages', header: 'Shortages', size: 80, cell: ({ getValue }) => <span className="font-bold text-red-600">{getValue()}</span> },
    { accessorKey: 'total_prs_generated', header: 'PRs Generated', size: 110, cell: ({ getValue }) => <span className="font-bold text-green-600">{getValue()}</span> },
    { accessorKey: 'total_planned_orders_generated', header: 'Planned Orders', size: 110 },
    { accessorKey: 'planning_horizon_days', header: 'Horizon Days', size: 90 },
  ], []);

  const elementColumns = useMemo<ColumnDef<any, any>[]>(() => [
    { accessorKey: 'material_number', header: 'Material', size: 130, cell: ({ getValue, row }) => <span className="font-mono">{getValue()} {(row.original as any).description?.substring(0,15)}</span> },
    { accessorKey: 'plant_code', header: 'Plant', size: 60 },
    { accessorKey: 'element_type', header: 'Element Type', size: 110, cell: ({ getValue }) => {
      const v=getValue(); const cls=v==='STOCK'?'bg-green-100':v==='SALES_ORDER'?'bg-red-100':v==='PR'?'bg-blue-100':v==='SAFETY_STOCK'?'bg-yellow-100':'bg-zinc-100';
      return <span className={`px-1 border text-[10px] ${cls}`}>{v}</span>;
    }},
    { accessorKey: 'element_number', header: 'Element Number', size: 120 },
    { accessorKey: 'quantity', header: 'Qty', size: 80, cell: ({ getValue }) => {
      const v=parseFloat(getValue()); return <span className={v<0?'text-red-600':'text-green-600'}>{getValue()}</span>;
    }},
    { accessorKey: 'available_quantity', header: 'Available Qty', size: 100 },
    { accessorKey: 'date', header: 'Date', size: 100, cell: ({ getValue }) => <span className="text-[11px]">{new Date(getValue()).toLocaleDateString()}</span> },
    { accessorKey: 'is_shortage', header: 'Shortage', size: 70, cell: ({ getValue }) => <span className={`px-1 border text-[10px] ${getValue()?'bg-red-600 text-white':'bg-zinc-100'}`}>{getValue()?'YES':'No'}</span> },
    { accessorKey: 'generated_pr_number', header: 'Generated PR', size: 120, cell: ({ getValue }) => getValue() ? <span className="font-bold text-green-600">{getValue()}</span> : <span className="text-zinc-400">-</span> },
  ], []);

  const selectedRun = selectedRunId ? mrpRuns.find((r:any)=>r.id===selectedRunId) : null;

  if (loading) return <div className="p-6">Loading MRP Runs MD01 for {companyCode}...</div>;

  const modernContent = (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div><h2 className="text-lg font-semibold">MRP • {companyCode}</h2><p className="text-sm text-zinc-500">{mrpRuns.length} MRP runs • MD01 MRP Run analyzes stock levels across plants and generates PRs/Planned Orders based on sales demand and safety stock, MD04 Stock/Requirements List shows stock, safety stock, sales orders, PRs, planned orders, shortages • Coupled: Material Master MM01 (ent_material_master material_number), Material Plant ent_material_plant (safety_stock, reorder_point, total_stock_qty, moving_avg_price), Sales Orders VA01 (sd_sales_order + sd_sales_line demand qty - qty_issued), Purchase Requisitions ME51N (mm_purchase_requisition + mm_pr_line supply), Stock MMBE (inv_stock), BOM CS01 (explosion for planned orders), Routing CA01 (planned order routing), PR auto-generation links to ME51N/ME54N workflow • Company {companyCode} • Source: {source}</p></div>
        <div className="flex gap-2"><button onClick={()=>setShowCreate(true)} className="text-sm bg-black text-white rounded-full px-4 py-2">+ Run MRP (MD01) {companyCode}</button><button onClick={loadRuns} className="text-sm border rounded-full px-4 py-2">Refresh • {source}</button></div>
      </div>

      {msg && <div className="mb-4 p-3 bg-zinc-900 text-white rounded-xl text-sm">{msg}</div>}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5"><div className="bg-white rounded-2xl border p-2"><div className="font-medium text-xs p-2">MRP Runs MD01 • {mrpRuns.length} runs</div><VirtualDataGrid data={mrpRuns} columns={runColumns} height={250} rowHeight={32} selectedRowId={selectedRunId || undefined} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>{ setSelectedRunId(r.id); loadElements(r.id); }} /></div>
          <div className="mt-4 bg-white rounded-2xl border p-2"><div className="font-medium text-xs p-2">Stock/Requirements List MD04 • {mrpElements.length} elements • Shortages {mrpElements.filter((e:any)=>e.is_shortage).length} • PRs Generated {selectedRun?.total_prs_generated||0}</div><VirtualDataGrid data={mrpElements} columns={elementColumns} height={300} rowHeight={28} selectedRowId={selectedElementId || undefined} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>setSelectedElementId(r.id)} /></div>
        </div>
        <div className="col-span-7 space-y-3">
          <div className="bg-white rounded-2xl border p-4 text-xs">
            <div className="font-medium">MRP Detail • Stock/Requirements • Shortages • PR Generation • {companyCode} • Backend {source}</div>
            {selectedRun ? (
              <div className="mt-3 space-y-2">
                <div><b>{(selectedRun as any).mrp_number}</b> • Plant {(selectedRun as any).plant_code} {(selectedRun as any).plant_name} • Status {(selectedRun as any).status} • Horizon {(selectedRun as any).planning_horizon_days} days • Safety {(selectedRun as any).include_safety_stock?'Yes':'No'} • Sales Orders {(selectedRun as any).include_sales_orders?'Yes':'No'}</div>
                <div>Materials: {(selectedRun as any).total_materials} • Shortages: {(selectedRun as any).total_shortages} • PRs Generated: {(selectedRun as any).total_prs_generated} • Planned Orders: {(selectedRun as any).total_planned_orders_generated} • Created {(selectedRun as any).created_at ? new Date((selectedRun as any).created_at).toLocaleString() : ''}</div>
                <div className="mt-3 p-2 bg-zinc-50 border rounded-xl text-[11px]">
                  <div className="font-bold">MRP Logic MD01:</div>
                  <div className="mt-1">For each material in plant: safety_stock, reorder_point, total_stock_qty from ent_material_plant. Sales demand = SUM(sd_sales_line quantity - quantity_issued) where sales order status DRAFT/CONFIRMED/PARTIALLY_ISSUED and plant = MRP plant and date within planning horizon. Existing supply = SUM(mm_pr_line quantity) where PR status DRAFT/PENDING_APPROVAL/APPROVED. Available = stock - demand + supply. If available &lt; safety_stock or &lt; reorder_point → shortage → generate PR shortageQty = safety_stock - available or reorder_point - available, PR number PRxxx, company_code_id from plant, requester first hr_employee, header_text MRP Generated PR for material shortage. Insert pp_mrp_element for STOCK, SAFETY_STOCK, SALES_ORDER, PR, and generated PR with generated_pr_id. Update pp_mrp_run totals. MD04 shows elements ordered by material/date with available running.</div>
                </div>
                <div className="mt-2 border rounded-xl p-2 bg-zinc-50 max-h-[200px] overflow-auto">
                  <div className="font-bold">Shortages • PRs Generated</div>
                  {mrpElements.filter((e:any)=>e.is_shortage).map((e:any)=><div key={e.id} className="mt-1 text-red-600">{e.material_number} {e.description?.substring(0,20)} {e.element_type} {e.quantity} Available {e.available_quantity} Shortage YES → PR {e.generated_pr_number||'Generated'}</div>)}
                  {mrpElements.filter((e:any)=>e.generated_pr_number).map((e:any)=><div key={e.id} className="mt-1 text-green-600">PR Generated: {e.generated_pr_number} for {e.material_number} qty {e.quantity}</div>)}
                </div>
              </div>
            ) : <div className="text-zinc-500 mt-2">Select MRP run row - shows stock/requirements list MD04, shortages, PRs generated • Backend connected {source} • {companyCode}</div>}
          </div>
          <div className="bg-zinc-900 text-white rounded-2xl p-4 text-xs"><div className="font-medium text-sm">Details</div><div className="mt-2 text-[11px] text-zinc-400">GET /api/mrp?plantId - list MRP runs MD01, GET /api/mrp?mrpRunId=xxx - MD04 stock/requirements list with elements STOCK, SAFETY_STOCK, SALES_ORDER, PR, PLANNED_ORDER, shortage flag, generated_pr_id. POST /api/mrp plantId, planningHorizonDays, includeSafetyStock, includeSalesOrders - MD01 runs MRP, analyzes ent_material_plant safety_stock/reorder_point/total_stock_qty, sd_sales_line demand, mm_pr_line supply, calculates available, generates PRs for shortages. Multi-plant via plantId.</div></div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={()=>setShowCreate(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border w-full max-w-lg p-6">
            <h3 className="font-semibold">Run MRP • MD01 • {companyCode} • Functional • Backend Connected {source}</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><label className="text-xs">Plant *</label><select value={newMRP.plantId} onChange={e=>setNewMRP({...newMRP, plantId: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select Plant</option>{plants.map((p:any)=><option key={p.id} value={p.id}>{p.code} {p.name}</option>)}</select></div>
              <div><label className="text-xs">Planning Horizon Days</label><input value={newMRP.planningHorizonDays} onChange={e=>setNewMRP({...newMRP, planningHorizonDays: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="30"/></div>
              <div className="col-span-2 flex gap-2"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={newMRP.includeSafetyStock} onChange={e=>setNewMRP({...newMRP, includeSafetyStock: e.target.checked})}/> Include Safety Stock</label><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={newMRP.includeSalesOrders} onChange={e=>setNewMRP({...newMRP, includeSalesOrders: e.target.checked})}/> Include Sales Orders Demand</label></div>
            </div>
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px]">MRP analyzes stock levels across plants and generates PRs/Planned Orders based on sales demand and safety stock. For each material: stock - sales demand + existing PR supply = available. If available &lt; safety_stock or reorder_point → shortage → auto-generate PR.</div>
            <div className="mt-6 flex gap-2"><button onClick={()=>setShowCreate(false)} className="flex-1 border rounded-full py-2.5">Cancel</button><button onClick={handleRunMRP} className="flex-1 bg-black text-white rounded-full py-2.5">Run MRP • MD01 • {companyCode}</button></div>
            {msg && <div className="mt-3 text-xs p-2 bg-zinc-900 text-white rounded-xl">{msg}</div>}
          </div>
        </div>
      )}
    </div>
  );

  const classicContent = (
    <div className="font-mono text-[11px] bg-[#f5f5f0]">
      <div className="border border-[#808080] bg-[#f0f0f0] p-2"><div className="font-bold border-b border-[#808080] pb-1">MD01/MD04 Selection • MRP • {companyCode} • Stock/Requirements • Backend {source}</div><div className="grid grid-cols-12 gap-1 items-center mt-2"><div className="col-span-2 text-right pr-2">Plant:</div><div className="col-span-3"><select value={newMRP.plantId} onChange={e=>setNewMRP({...newMRP, plantId: e.target.value})} className="w-full border border-black bg-white h-5"><option value="">Select Plant</option>{plants.map((p:any)=><option key={p.id} value={p.id}>{p.code} {p.name}</option>)}</select></div><div className="col-span-2 text-right pr-2">Horizon Days:</div><div className="col-span-2"><input value={newMRP.planningHorizonDays} onChange={e=>setNewMRP({...newMRP, planningHorizonDays: e.target.value})} className="w-full border border-black bg-white h-5 px-1" placeholder="30"/></div><div className="col-span-3"><button onClick={handleRunMRP} className="bg-[#000080] text-white border border-black px-2 h-5">Run MD01 F5</button><button onClick={loadRuns} className="bg-[#d4d0c8] border border-[#404040] px-2 h-5 ml-1">Execute F8 • {source}</button></div></div></div>
      <div className="mt-1 border border-black bg-white"><div className="bg-[#d4d0c8] border-b border-black px-2 h-6 flex items-center font-bold">MRP Runs Table Control • {mrpRuns.length} runs • MD01/MD04 • Stock/Requirements • Shortages • PR Generation • {source} • {companyCode}</div><VirtualDataGrid data={mrpRuns} columns={runColumns} height={200} rowHeight={26} selectedRowId={selectedRunId || undefined} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>{ setSelectedRunId(r.id); loadElements(r.id); }} /></div>
      <div className="mt-1 border border-black bg-white"><div className="bg-[#d4d0c8] border-b border-black px-2 h-6 flex items-center font-bold">Stock/Requirements List MD04 • {mrpElements.length} elements • {source} • {companyCode}</div><VirtualDataGrid data={mrpElements} columns={elementColumns} height={300} rowHeight={24} selectedRowId={selectedElementId || undefined} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>setSelectedElementId(r.id)} /></div>
    </div>
  );

  return (
    <ModernModuleShell title={`MRP ${companyCode}`} subtitle={`${companyCode}`} tooltip={`MD01/MD04 • Material Requirements Planning • Multi-Plant • Stock/Requirements • Auto PR Generation • Backend Connected ${source} • ${companyCode}`} code="MD01" module="PP" kpis={[
      {label:'Total MRP Runs', value: mrpRuns.length.toString(), icon:'📋'},
      {label:'Shortages', value: mrpRuns.reduce((s:any,r:any)=>s+parseInt(r.total_shortages||0),0).toString(), icon:'⚠️'},
      {label:'PRs Generated', value: mrpRuns.reduce((s:any,r:any)=>s+parseInt(r.total_prs_generated||0),0).toString(), icon:'📝'},
      {label:'Source', value: source, icon:'🔗'},
    ]}>
      {modernContent}
      <div className="mt-8 border-t pt-6"><div className="text-xs font-medium mb-3">Classic ERP GUI • MD01/MD04 • Functional • Backend Connected</div>{classicContent}</div>
    </ModernModuleShell>
  );
}
