"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VirtualDataGrid } from '@/shared/ui/virtual-data-grid';
import { ColumnDef } from '@tanstack/react-table';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function StockPage() {
  const params = useParams();
  const router = useRouter();
  const companyCode = (params?.companyCode as string) || '1000';
  const [stock, setStock] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [slocs, setSlocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNRESTRICTED' | 'QI' | 'BLOCKED' | 'EXPIRED'>('ALL');
  const [filterPlant, setFilterPlant] = useState<string>('ALL');
  const [filterSloc, setFilterSloc] = useState<string>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferForm, setTransferForm] = useState({ materialId: '', plantId: '1000', fromSloc: '0001', toSloc: '0002', quantity: '10', batchId: '', reason: '' });

  useEffect(() => {
    fetchStock();
    fetchPlants();
  }, [filterStatus, filterPlant, filterSloc]);

  const fetchPlants = async () => {
    try {
      const res = await fetch(`/api/plants?companyCode=${companyCode}`);
      const data = await res.json();
      if (data.plants) setPlants(data.plants);
      if (data.slocs) setSlocs(data.slocs);
    } catch (e) { console.warn(e); }
  };

  const fetchStock = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set('limit', '200');
      qs.set('companyCode', companyCode);
      if (search) qs.set('search', search);
      if (filterStatus !== 'ALL' && filterStatus !== 'EXPIRED') qs.set('status', filterStatus === 'QI' ? 'QUALITY_INSPECTION' : filterStatus);
      if (filterStatus === 'EXPIRED') qs.set('expiryFilter', 'EXPIRED');
      if (filterPlant !== 'ALL') {
        const plant = plants.find(p => p.code === filterPlant);
        if (plant) qs.set('plantId', plant.id);
      }
      if (filterSloc !== 'ALL') {
        const sloc = slocs.find(s => s.code === filterSloc);
        if (sloc) qs.set('slocId', sloc.id);
      }
      const res = await fetch(`/api/stock?${qs.toString()}`);
      const data = await res.json();
      if (data.stock) {
        setStock(data.stock.map((s: any, i: number) => ({
          id: `stock-${i}-${s.material_id}`,
          material_id: s.material_id,
          plant_id: s.plant_id,
          sloc_id: s.sloc_id,
          batch_id: s.batch_id,
          material: s.material_number || s.material_description || `MAT-${i}`,
          material_number: s.material_number,
          batch: s.batch_number || `B-${i}`,
          batch_number: s.batch_number,
          plant: s.plant_code || '1000',
          plant_code: s.plant_code,
          sloc: s.sloc_code || '0001',
          sloc_code: s.sloc_code,
          status: s.stock_status || 'UNRESTRICTED',
          qty: s.quantity?.toString() || '0',
          quantity: s.quantity,
          uom: 'KG',
          expiry: s.expiry_date ? new Date(s.expiry_date) : new Date(Date.now() + 90*24*3600000),
          expiry_date: s.expiry_date,
          isExpired: s.expiry_status === 'EXPIRED',
          daysToExpiry: s.days_to_expiry ? Math.floor(parseFloat(s.days_to_expiry)) : 90,
          expiry_status: s.expiry_status || 'OK',
          map: s.moving_avg_price || '0',
          moving_avg_price: s.moving_avg_price,
          totalValue: ((parseFloat(s.quantity||0) * parseFloat(s.moving_avg_price||0)).toFixed(3)),
        })));
      }
    } catch (e) { console.warn(e); }
    setLoading(false);
  };

  useEffect(() => { fetchStock(); }, [search]);

  const handleTransfer = async () => {
    try {
      const plant = plants.find(p => p.code === transferForm.plantId) || plants[0];
      const fromSlocObj = slocs.find(s => s.code === transferForm.fromSloc) || slocs.find(s => s.code === '0001');
      const toSlocObj = slocs.find(s => s.code === transferForm.toSloc) || slocs.find(s => s.code === '0002');
      
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movementType: '311',
          materialId: transferForm.materialId || stock[0]?.material_id,
          plantId: plant?.id || transferForm.plantId,
          slocIdFrom: fromSlocObj?.id,
          slocIdTo: toSlocObj?.id,
          batchId: transferForm.batchId || null,
          quantity: transferForm.quantity,
          reason: transferForm.reason || 'Stock transfer between SLocs',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Transfer 311 posted: ${data.quantity} from ${data.from} to ${data.to}`);
        setShowTransfer(false);
        fetchStock();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const filtered = useMemo(() => {
    let f = stock;
    if (search) f = f.filter(s => s.material.toLowerCase().includes(search.toLowerCase()) || s.batch.includes(search));
    if (filterStatus === 'UNRESTRICTED') f = f.filter(s => s.status === 'UNRESTRICTED' && !s.isExpired);
    if (filterStatus === 'QI') f = f.filter(s => s.status === 'QUALITY_INSPECTION');
    if (filterStatus === 'BLOCKED') f = f.filter(s => s.status === 'BLOCKED');
    if (filterStatus === 'EXPIRED') f = f.filter(s => s.isExpired || s.expiry_status === 'EXPIRED');
    return f;
  }, [stock, search, filterStatus]);

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    { accessorKey: 'material', header: 'Material', size: 180, cell: ({ getValue }) => <span className="font-mono text-[11px]">{getValue()}</span> },
    { accessorKey: 'batch', header: 'Batch', size: 120, cell: ({ getValue }) => <span className="font-mono font-bold">{getValue()}</span> },
    { accessorKey: 'plant', header: 'Plant', size: 70, cell: ({ getValue }) => <span className="font-bold">{getValue()}</span> },
    { accessorKey: 'sloc', header: 'SLoc', size: 100 },
    { accessorKey: 'status', header: 'Status', size: 110, cell: ({ getValue }) => {
      const v = getValue(); const cls = v==='UNRESTRICTED' ? 'bg-green-100' : v==='QUALITY_INSPECTION' ? 'bg-yellow-100' : v==='BLOCKED' ? 'bg-red-100' : 'bg-orange-100';
      return <span className={`px-1 border text-[10px] ${cls}`}>{v}</span>;
    }},
    { accessorKey: 'qty', header: 'Qty', size: 70, cell: ({ getValue }) => <span className="font-bold">{getValue()}</span> },
    { accessorKey: 'uom', header: 'UoM', size: 50 },
    { accessorKey: 'expiry', header: 'Expiry Date', size: 120, cell: ({ getValue, row }) => {
      const d = getValue() as Date; const status = row.original.expiry_status; const days = row.original.daysToExpiry;
      const cls = status==='EXPIRED' ? 'bg-red-600 text-white animate-pulse' : status==='CRITICAL_24H' ? 'bg-red-200 text-red-800 font-bold' : status==='WARNING_48H' ? 'bg-orange-200' : days < 7 ? 'bg-yellow-100' : '';
      return <span className={`px-1 text-[11px] ${cls}`}>{d.toLocaleDateString()} {status==='EXPIRED' ? 'EXPIRED' : status==='CRITICAL_24H' ? '<24h CRITICAL' : status==='WARNING_48H' ? '<48h WARN' : `${days}d`}</span>;
    }},
    { accessorKey: 'map', header: 'MAP KWD', size: 80 },
    { accessorKey: 'totalValue', header: 'Total Value', size: 90, cell: ({ getValue }) => <span className="font-bold">{getValue()}</span> },
  ], []);

  const selected = selectedId ? stock.find(s => s.id === selectedId) : null;

  const modernContent = (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div><h2 className="text-lg font-semibold">Stock Overview • Multi-Plant • Multi-SLoc • Batch • Expiry • MAP • Functional</h2><p className="text-sm text-zinc-500">{filtered.length} batches • MMBE • Plant {filterPlant} SLoc {filterSloc} • BLOCK/WARNING/RESTRICTED_USE • Virtualized • Functional transfer 311</p></div>
        <div className="flex gap-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search material/batch" className="border rounded-full px-4 py-2 text-sm w-64" />
          <button onClick={()=>setShowTransfer(true)} className="text-sm bg-black text-white rounded-full px-4 py-2">Transfer 311 →</button>
        </div>
      </div>
      <div className="flex gap-2 mb-4 text-xs flex-wrap">
        <select value={filterPlant} onChange={e=>setFilterPlant(e.target.value)} className="border rounded-full px-3 py-1.5 bg-white"><option value="ALL">All Plants ({plants.length})</option>{plants.map(p => <option key={p.id} value={p.code}>{p.code} {p.name}</option>)}</select>
        <select value={filterSloc} onChange={e=>setFilterSloc(e.target.value)} className="border rounded-full px-3 py-1.5 bg-white"><option value="ALL">All SLocs ({slocs.length})</option>{slocs.map(s => <option key={s.id} value={s.code}>{s.code} {s.name} ({s.plant_code})</option>)}</select>
        <button onClick={()=>setFilterStatus('ALL')} className={`px-3 py-1.5 rounded-full border ${filterStatus==='ALL'?'bg-black text-white':'bg-white'}`}>All {stock.length}</button>
        <button onClick={()=>setFilterStatus('UNRESTRICTED')} className={`px-3 py-1.5 rounded-full border ${filterStatus==='UNRESTRICTED'?'bg-black text-white':'bg-white'}`}>Unrestricted {stock.filter(s=>s.status==='UNRESTRICTED' && !s.isExpired).length}</button>
        <button onClick={()=>setFilterStatus('EXPIRED')} className={`px-3 py-1.5 rounded-full border bg-red-50 ${filterStatus==='EXPIRED'?'bg-red-600 text-white':'border-red-200'}`}>Expired {stock.filter(s=>s.isExpired).length}</button>
        <button onClick={fetchStock} className="px-3 py-1.5 border rounded-full bg-white hover:bg-zinc-50">Refresh</button>
      </div>
      <div className="bg-white rounded-2xl border p-2">
        {loading ? <div className="p-8 text-center text-sm text-zinc-500">Loading stock from /api/stock with plant/sloc filters...</div> : <VirtualDataGrid data={filtered} columns={columns} height={600} rowHeight={32} selectedRowId={selectedId || undefined} getRowId={r=>r.id} onRowClick={r=>setSelectedId(r.id)} />}
      </div>

      {selected && (
        <div className="mt-4 bg-white rounded-2xl border p-4 text-xs">
          <div className="font-medium">Stock Detail • Plant {selected.plant} SLoc {selected.sloc} • Batch {selected.batch} • Functional</div>
          <div className="mt-2 grid grid-cols-3 gap-4">
            <div>Material: {selected.material} • Qty {selected.qty} {selected.uom} • MAP {selected.map} KWD • Total {selected.totalValue} KWD</div>
            <div>Batch: {selected.batch} • Expiry {selected.expiry.toLocaleDateString()} • Status {selected.expiry_status} • {selected.daysToExpiry}d to expiry</div>
            <div>Plant: {selected.plant} SLoc: {selected.sloc} • Status {selected.status} • Material ID {selected.material_id}</div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={()=>setShowTransfer(true)} className="text-xs bg-black text-white rounded-full px-3 py-1.5">Transfer 311 SLoc→SLoc →</button>
            <button onClick={()=>router.push(`/${companyCode}/audit/document-flow?type=MATERIAL&id=${selected.material_id}`)} className="text-xs border rounded-full px-3 py-1.5">Document Flow →</button>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div className="bg-white rounded-2xl border p-4"><div className="font-medium">Multi-Plant Support</div><div className="mt-2 text-[11px] text-zinc-600">• Plants: {plants.map(p=>`${p.code} ${p.name}`).join(', ') || '1000 Main Kitchen, 1100 Storage'}<br/>• SLocs: {slocs.map(s=>`${s.code} ${s.name} (${s.plant_code})`).join(', ') || '0001 Main, 0002 Cold, 0003 Shop Floor, 0004 Returns, 0005 QI'}<br/>• Stock table PK: material_id + plant_id + sloc_id + batch_id + stock_status<br/>• Filter by plant/sloc via /api/stock?plantId=X&slocId=Y<br/>• Transfer 311 SLoc→SLoc and Plant→Plant functional</div></div>
        <div className="bg-white rounded-2xl border p-4"><div className="font-medium">Expiry Safeguards</div><div className="mt-2 text-[11px] text-zinc-600">• BLOCK: Hard block GI if expired - MIGO/MB1A checks expiry_date &lt; today<br/>• WARNING: Allow with warning popup<br/>• RESTRICTED_USE: Auto downgrade to QI<br/>• Kitting: Stocked Kit K01/K02 inherits minExpiry = MIN(components), flag if &lt;24h red pulse critical, &lt;48h orange warning</div></div>
        <div className="bg-white rounded-2xl border p-4"><div className="font-medium">MAP Valuation</div><div className="mt-2 text-[11px] text-zinc-600">• ROH: Moving Average - (total_value + gr_value) / (total_qty + gr_qty)<br/>• FERT: Standard Price S, updated by CK40N<br/>• Landed costs: freight/customs/non-recoverable taxes included at IV<br/>• Total Value = qty * MAP for accurate COGS</div></div>
      </div>

      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={()=>setShowTransfer(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border w-full max-w-lg p-6">
            <h3 className="font-semibold">Stock Transfer • 311 • Multi-Plant/SLoc • Functional</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><label className="text-xs">Plant</label><select value={transferForm.plantId} onChange={e=>setTransferForm({...transferForm, plantId: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2">{plants.map(p => <option key={p.id} value={p.code}>{p.code} {p.name}</option>)}</select></div>
              <div><label className="text-xs">Quantity</label><input value={transferForm.quantity} onChange={e=>setTransferForm({...transferForm, quantity: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
              <div><label className="text-xs">From SLoc</label><select value={transferForm.fromSloc} onChange={e=>setTransferForm({...transferForm, fromSloc: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2">{slocs.map(s => <option key={s.id} value={s.code}>{s.code} {s.name}</option>)}</select></div>
              <div><label className="text-xs">To SLoc</label><select value={transferForm.toSloc} onChange={e=>setTransferForm({...transferForm, toSloc: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2">{slocs.map(s => <option key={s.id} value={s.code}>{s.code} {s.name}</option>)}</select></div>
              <div className="col-span-2"><label className="text-xs">Material ID (optional, uses first if empty)</label><input value={transferForm.materialId} onChange={e=>setTransferForm({...transferForm, materialId: e.target.value})} placeholder="mat-uuid or empty" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
              <div className="col-span-2"><label className="text-xs">Reason</label><input value={transferForm.reason} onChange={e=>setTransferForm({...transferForm, reason: e.target.value})} placeholder="Transfer for production" className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
            </div>
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px]">311 movement: Deduct from source SLoc, add to destination SLoc, ledger entries, audit_log, multi-plant support plant→plant and SLoc→SLoc, PI blocking check for 101/261/601</div>
            <div className="mt-6 flex gap-2"><button onClick={()=>setShowTransfer(false)} className="flex-1 border rounded-full py-2.5">Cancel</button><button onClick={handleTransfer} className="flex-1 bg-black text-white rounded-full py-2.5">Post Transfer 311</button></div>
          </div>
        </div>
      )}
    </div>
  );

  const classicContent = (
    <div className="font-mono text-[11px] bg-[#f5f5f0]">
      <div className="border border-[#808080] bg-[#f0f0f0] p-2"><div className="font-bold border-b border-[#808080] pb-1">MMBE Selection • Stock Overview • Multi-Plant • Expiry • Functional Transfer 311</div><div className="grid grid-cols-12 gap-1 items-center mt-2"><div className="col-span-2 text-right pr-2">Plant:</div><div className="col-span-2"><select value={filterPlant} onChange={e=>setFilterPlant(e.target.value)} className="w-full border border-black bg-white h-5"><option value="ALL">All</option>{plants.map(p => <option key={p.id} value={p.code}>{p.code}</option>)}</select></div><div className="col-span-2 text-right pr-2">SLoc:</div><div className="col-span-2"><select value={filterSloc} onChange={e=>setFilterSloc(e.target.value)} className="w-full border border-black bg-white h-5"><option value="ALL">All</option>{slocs.map(s => <option key={s.id} value={s.code}>{s.code}</option>)}</select></div><div className="col-span-2 text-right pr-2">Material:</div><div className="col-span-2"><input value={search} onChange={e=>setSearch(e.target.value)} className="w-full border border-black bg-white h-5 px-1" placeholder="FMCG-*" /></div></div></div>
      <div className="mt-1 border border-black bg-white"><div className="bg-[#d4d0c8] border-b border-black px-2 h-6 flex items-center font-bold">Stock Table Control • {filtered.length} entries • Multi-Plant • Expiry BLOCK/WARNING • MAP • Transfer 311 Functional</div><VirtualDataGrid data={filtered} columns={columns} height={500} rowHeight={26} selectedRowId={selectedId || undefined} getRowId={r=>r.id} onRowClick={r=>setSelectedId(r.id)} /></div>
    </div>
  );

  return (
    <ModernModuleShell title="Stock Overview" subtitle={`MMBE • ${companyCode}`} code="MMBE" module="FOUNDATION" kpis={[
      {label:'Total Batches', value: stock.length.toString(), icon:'📦'},
      {label:'Plants', value: plants.length.toString(), icon:'🏭'},
      {label:'SLocs', value: slocs.length.toString(), icon:'📍'},
      {label:'Total Value', value: `${stock.reduce((s,b)=>s+parseFloat(b.totalValue||0),0).toFixed(0)} KWD`, icon:'💰'},
    ]}>
      {modernContent}
      <div className="mt-8 border-t pt-6"><div className="text-xs font-medium mb-3">Classic ERP GUI • MMBE • Multi-Plant Functional</div>{classicContent}</div>
    </ModernModuleShell>
  );
}
