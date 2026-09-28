"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VirtualDataGrid } from '@/shared/ui/virtual-data-grid';
import { ColumnDef } from '@tanstack/react-table';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

const TABS = [
  { id: 'header', label: 'Header', tip: 'Sales org, channel, division, customer, dates' },
  { id: 'items', label: 'Items', tip: 'Material, qty/UoM, plant/SLoc/batch, price' },
  { id: 'partners', label: 'Partners', tip: 'Sold-to, ship-to, bill-to, payer' },
  { id: 'delivery', label: 'Delivery', tip: 'Shipping point, priority, route, dates' },
  { id: 'billing', label: 'Billing', tip: 'Billing type F2, payment terms, net/tax/total' },
];

const DETAIL_TIP = `VA01/VA02/VA03 • ERP Views:
Header: Sales org KSO1, dist channel K1, division K1, sales office, sales group, PO number, doc date, pricing date, req delivery date, sold-to
Items: Line 10 material FERT qty/UoM plant/SLoc/batch item cat TAN price net value delivery status
Item Detail: Material, qty/UoM, plant/SLoc/batch FIFO expiry, item cat TAN, net value, tax, schedule lines ATP, account assignment
Partners: Sold-to AG, ship-to WE, bill-to RE, payer RG
Conditions: PR00 price, K004 discount, MWST GST 18%
Delivery: Shipping point KP01, delivery priority 02, block, route, incoterms, req date, plant/SLoc
Billing: Billing type F2, block, payment terms 0001/0002, incoterms, billing date, net/tax/total
Accounting: Acct assignment 01, cost center KS-CC-03, profit center, GL revenue, tax GST, COGS GBB
Status: Overall, delivery, billing, credit, flow VA01→VL01N→VF01→FI
Multi-Plant • B2B/B2C/POS Webhook • 601 GI • Cash vs AR • SERIALIZABLE`;

export default function SalesPage() {
  const params = useParams();
  const router = useRouter();
  const companyCode = (params?.companyCode as string) || '1000';
  const [sales, setSales] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterCash, setFilterCash] = useState<'ALL' | 'CASH' | 'AR'>('ALL');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('header');
  const [newSale, setNewSale] = useState({ 
    material: 'MAT-1000000007 Chicken Shawarma', materialId: '', qty: '2', uom: 'PC',
    unitPrice: '1.500', paymentType: 'CASH', customer: 'Walk-in', customerId: '',
    plant: '1000', plantId: '', sloc: '0001', batch: '', salesOrg: 'KSO1', distChannel: 'K1', division: 'K1',
  });
  const [msg, setMsg] = useState('');
  const [source, setSource] = useState('db');

  async function load() {
    setLoading(true);
    try {
      const [salesRes, plantRes, matRes, bpRes] = await Promise.all([
        fetch(`/api/sales-orders?limit=200&companyCode=${companyCode}&search=${encodeURIComponent(search)}`).then(r=>r.json()).catch(()=>({salesOrders:[]})),
        fetch(`/api/plants?companyCode=${companyCode}`).then(r=>r.json()),
        fetch(`/api/materials?limit=100`).then(r=>r.json()),
        fetch(`/api/business-partners?role=CUSTOMER&limit=100`).then(r=>r.json()).catch(()=>({businessPartners:[]})),
      ]);
      setSales(salesRes.salesOrders || salesRes.sales || []);
      setPlants(plantRes.plants || []);
      setMaterials(matRes.materials || []);
      setCustomers(bpRes.businessPartners || []);
      setSource(salesRes.source || 'db');
      if (plantRes.plants?.length && !newSale.plantId) setNewSale(prev=>({...prev, plantId: plantRes.plants[0].id, plant: plantRes.plants[0].code}));
      if (matRes.materials?.length && !newSale.materialId) setNewSale(prev=>({...prev, materialId: matRes.materials[0].id}));
    } catch(e){ console.error(e); }
    setLoading(false);
  }

  useEffect(()=>{ load(); },[companyCode]);
  useEffect(()=>{ const t=setTimeout(load,400); return()=>clearTimeout(t); },[search]);

  const filtered = useMemo(() => {
    let f = sales;
    if (filterCash !== 'ALL') f = f.filter((s:any)=> (s.payment_type||s.paymentType||'').toUpperCase()===filterCash);
    return f;
  }, [sales, filterCash]);

  const handleCreateSale = async () => {
    setMsg('Creating sales order...');
    try {
      const res = await fetch('/api/sales-orders', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          companyCode, plantId: newSale.plantId, materialId: newSale.materialId,
          quantity: newSale.qty, uom: newSale.uom, unitPrice: newSale.unitPrice,
          paymentType: newSale.paymentType, customerId: newSale.customerId || null,
          salesOrg: newSale.salesOrg, distChannel: newSale.distChannel, division: newSale.division,
        })
      }).then(r=>r.json());
      if (res.success) {
        setMsg(`✅ Sales ${res.salesNumber} created`);
        setShowCreate(false);
        load();
      } else setMsg(`❌ ${res.error}`);
    } catch(e:any){ setMsg(`❌ ${e.message}`); }
  };

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    { accessorKey: 'sales_number', header: 'Sales #', size: 120, cell: ({ getValue, row }:any) => <span className="font-mono font-medium text-blue-600">{getValue()||row.original.salesNumber||'-'}</span> },
    { accessorKey: 'material_number', header: 'Material', size: 130, cell: ({ getValue }) => <span className="truncate">{getValue()||'-'}</span> },
    { accessorKey: 'quantity', header: 'Qty', size: 70 },
    { accessorKey: 'plant_code', header: 'Plant', size: 70 },
    { accessorKey: 'payment_type', header: 'Pay Type', size: 80, cell: ({ getValue }) => {
      const v=(getValue()||'').toUpperCase(); const cls=v==='CASH'?'bg-green-50 text-green-700 border-green-200':'bg-blue-50 text-blue-700 border-blue-200';
      return <span className={`px-2 py-0.5 rounded-full border text-[11px] ${cls}`}>{v||'CASH'}</span>;
    }},
    { accessorKey: 'total_amount', header: 'Total', size: 90, cell: ({ getValue }) => <span className="font-medium">{getValue()||'-'}</span> },
    { accessorKey: 'status', header: 'Status', size: 90 },
  ], []);

  const selected = selectedId ? sales.find((s:any)=>s.id===selectedId) : null;

  if (loading) return <div className="p-6 text-sm text-zinc-500">Loading sales...</div>;

  return (
    <ModernModuleShell title="Sales Orders" subtitle={`${filtered.length} orders • ${companyCode} • ${source}`} code="VA01" module="SD" tooltip={DETAIL_TIP} kpis={[
      {label:'Total', value: sales.length.toString(), icon:'🛒'},
      {label:'Cash', value: sales.filter((s:any)=>(s.payment_type||'').toUpperCase()==='CASH').length.toString(), icon:'💵'},
      {label:'AR', value: sales.filter((s:any)=>(s.payment_type||'').toUpperCase()==='AR').length.toString(), icon:'🧾'},
    ]}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search sales..." className="border rounded-full px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-black" />
          <select value={filterCash} onChange={e=>setFilterCash(e.target.value as any)} className="border rounded-full px-3 py-2 text-xs">
            <option value="ALL">All</option><option value="CASH">Cash</option><option value="AR">AR</option>
          </select>
          <button onClick={load} className="text-xs border rounded-full px-3 py-2 hover:bg-zinc-50">Refresh</button>
        </div>
        <button onClick={()=>setShowCreate(true)} className="text-sm bg-black text-white rounded-full px-4 py-2">+ New Sale</button>
      </div>

      {msg && <div className="mb-4 p-3 bg-zinc-900 text-white rounded-xl text-sm">{msg}</div>}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <div className="bg-white rounded-2xl border overflow-hidden">
            <VirtualDataGrid data={filtered} columns={columns} height={500} rowHeight={36} selectedRowId={selectedId || undefined} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>setSelectedId(r.id)} />
          </div>
        </div>
        <div className="col-span-4 space-y-3">
          <div className="bg-zinc-50 rounded-2xl border p-4">
            <div className="font-medium text-sm">Sale Detail</div>
            {selected ? (
              <div className="mt-3 space-y-2 text-sm">
                <div className="font-mono font-medium">{(selected as any).sales_number||(selected as any).salesNumber}</div>
                <div className="text-xs text-zinc-600">{(selected as any).material_number} • {(selected as any).quantity} {(selected as any).uom} • {(selected as any).plant_code}</div>
                <div className="text-xs"><span className="text-zinc-500">Pay:</span> {(selected as any).payment_type} • <span className="text-zinc-500">Total:</span> {(selected as any).total_amount}</div>
                <div className="flex gap-2 mt-3">
                  <a href={`/${companyCode}/sd/delivery?salesId=${(selected as any).id}`} className="text-xs bg-black text-white rounded-full px-3 py-1.5">Delivery</a>
                  <a href={`/${companyCode}/audit/document-flow?type=Sales&id=${(selected as any).id}`} className="text-xs border rounded-full px-3 py-1.5">Doc Flow</a>
                </div>
              </div>
            ) : <div className="text-zinc-400 text-xs mt-2">Select a sale row</div>}
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={()=>setShowCreate(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border w-full max-w-2xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">New Sales Order</h3>
              <button onClick={()=>setShowCreate(false)} className="text-zinc-400 hover:text-black">✕</button>
            </div>
            <div className="mt-4 flex gap-1 flex-wrap">
              {TABS.map(tab=>(
                <div key={tab.id} className="relative group">
                  <button onClick={()=>setActiveTab(tab.id)} className={`text-xs px-3 py-1.5 rounded-full border ${activeTab===tab.id?'bg-black text-white border-black':'bg-zinc-50 border-zinc-200'}`}>{tab.label}</button>
                  <div className="absolute left-0 top-8 z-10 hidden group-hover:block w-64 bg-zinc-900 text-white text-[11px] p-2 rounded-lg shadow-xl">{tab.tip}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><label className="text-xs text-zinc-500">Material</label><select value={newSale.materialId} onChange={e=>setNewSale({...newSale, materialId:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select</option>{materials.map((m:any)=><option key={m.id} value={m.id}>{m.material_number} {m.description}</option>)}</select></div>
              <div><label className="text-xs text-zinc-500">Qty</label><input value={newSale.qty} onChange={e=>setNewSale({...newSale, qty:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
              <div><label className="text-xs text-zinc-500">Plant</label><select value={newSale.plantId} onChange={e=>setNewSale({...newSale, plantId:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select</option>{plants.map((p:any)=><option key={p.id} value={p.id}>{p.code}</option>)}</select></div>
              <div><label className="text-xs text-zinc-500">Pay Type</label><select value={newSale.paymentType} onChange={e=>setNewSale({...newSale, paymentType:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>CASH</option><option>AR</option><option>CARD</option></select></div>
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={()=>setShowCreate(false)} className="flex-1 border rounded-full py-2.5 text-sm">Cancel</button>
              <button onClick={handleCreateSale} className="flex-1 bg-black text-white rounded-full py-2.5 text-sm">Create Sale</button>
            </div>
          </div>
        </div>
      )}
    </ModernModuleShell>
  );
}
