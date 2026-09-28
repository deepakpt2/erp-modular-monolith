"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { VirtualDataGrid } from '@/shared/ui/virtual-data-grid';
import { ColumnDef } from '@tanstack/react-table';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

export default function BillingPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [billings, setBillings] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newBilling, setNewBilling] = useState({ salesOrderId: '', deliveryId: '' });
  const [msg, setMsg] = useState('');
  const [source, setSource] = useState('db');

  async function load() {
    setLoading(true);
    try {
      const [billRes, delRes] = await Promise.all([
        fetch(`/api/billing?limit=100&search=${encodeURIComponent(search)}`).then(r=>r.json()),
        fetch(`/api/delivery?limit=100`).then(r=>r.json()).catch(()=>({deliveries:[]})),
      ]);
      setBillings(billRes.billings || []);
      setDeliveries(delRes.deliveries || []);
      setSource(billRes.source || 'db');

      // Try to fetch sales orders via sales-orders API if exists
      try {
        const salesOrdersRes = await fetch(`/api/sales-orders?limit=50&companyCode=${companyCode}`).then(r=>r.json());
        if (salesOrdersRes.salesOrders) setSalesOrders(salesOrdersRes.salesOrders);
      } catch {}

      if (delRes.deliveries?.length && !newBilling.deliveryId) {
        const firstDel = delRes.deliveries.find((d:any)=>d.status==='GOODS_ISSUED') || delRes.deliveries[0];
        if (firstDel) setNewBilling({ salesOrderId: firstDel.sales_order_id, deliveryId: firstDel.id });
      }
    } catch(e){ console.error(e); }
    setLoading(false);
  }

  useEffect(()=>{ load(); },[companyCode]);
  useEffect(()=>{ const t=setTimeout(load,400); return()=>clearTimeout(t); },[search]);

  const handleCreateBilling = async () => {
    setMsg('Creating Billing VF01...');
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ salesOrderId: newBilling.salesOrderId, deliveryId: newBilling.deliveryId || null })
      }).then(r=>r.json());
      if (res.success) {
        setMsg(`✅ Billing ${res.billingNumber} created VF01 for SO ${newBilling.salesOrderId} Delivery ${newBilling.deliveryId||'None'} AR Dr AR Cr Revenue+Tax • Source: ${source}`);
        setShowCreate(false);
        load();
      } else setMsg(`❌ ${res.error}`);
    } catch(e:any){ setMsg(`❌ ${e.message}`); }
  };

  const handleCancel = async (id:string) => {
    try {
      const res = await fetch('/api/billing', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, action:'CANCEL' }) }).then(r=>r.json());
      if (res.success) { setMsg(`✅ Billing ${id} CANCELLED`); load(); } else setMsg(`❌ ${res.error}`);
    } catch(e:any){ setMsg(`❌ ${e.message}`); }
  };

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    { accessorKey: 'billing_number', header: 'Billing 90*', size: 120, cell: ({ getValue }) => <span className="font-bold font-mono text-blue-600">{getValue()}</span> },
    { accessorKey: 'type', header: 'Type', size: 60, cell: ({ getValue }) => <span className="px-1 border text-[10px] bg-zinc-100">{getValue()}</span> },
    { accessorKey: 'sales_number', header: 'Sales Order SO', size: 120 },
    { accessorKey: 'delivery_number', header: 'Delivery 80*', size: 120 },
    { accessorKey: 'customer_name', header: 'Customer', size: 150, cell: ({ getValue, row }) => <span>{getValue() || (row.original as any).customer_name1 || (row.original as any).customer_bp_number}</span> },
    { accessorKey: 'status', header: 'Status', size: 90, cell: ({ getValue }) => {
      const v=getValue(); const cls=v==='POSTED'?'bg-black text-white':v==='DRAFT'?'bg-yellow-100':'bg-red-100';
      return <span className={`px-1 border text-[10px] ${cls}`}>{v}</span>;
    }},
    { accessorKey: 'total_amount', header: `Total ${companyCode==='KS01'?'INR':'KWD'}`, size: 100, cell: ({ getValue }) => <span className="font-bold">{getValue()}</span> },
    { accessorKey: 'tax_amount', header: 'Tax', size: 80 },
    { accessorKey: 'net_amount', header: 'Net', size: 90 },
    { accessorKey: 'is_paid', header: 'Paid', size: 60, cell: ({ getValue }) => <span className={`px-1 border text-[10px] ${getValue()?'bg-green-100':'bg-red-100'}`}>{getValue()?'Yes':'No'}</span> },
  ], [companyCode]);

  const selected = selectedId ? billings.find((b:any)=>b.id===selectedId) : null;

  if (loading) return <div className="p-6">Loading Billings VF01 for {companyCode}...</div>;

  const modernContent = (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div><h2 className="text-lg font-semibold">Billing Documents • {companyCode}</h2><p className="text-sm text-zinc-500">{billings.length} billings • VF01 Create, VF02 Change, VF03 Display • B2B wholesale decouples: VA01 Order → VL01N Delivery picking → Goods Issue 601 → VF01 Billing triggers AR Dr AR 6000000000/120000 Cr Revenue 3000000000/400000 + Tax 2000000001 GST/220000 VAT • Coupled: Sales Order VA01 (sd_sales_order sales_number customer_name total_amount, sd_sales_line material_id qty unit_price cogs_per_unit), Delivery VL01N (sd_delivery delivery_number status GOODS_ISSUED required before billing, sd_delivery_line qtyIssued 601), Material Master MM01 (ent_material_master material_number), Customer BP (ent_business_partner bp_number name1 role CUSTOMER), FI AR (fi_document RV Dr AR 6000000000/120000 Cr Revenue 3000000000/400000 + Tax 2000000001 GST/220000 VAT, number range 54 5400000000-5499999999 SA, F-28 payment Dr Bank Cr AR), Payment F-28 (customer payment clearing), CCA Report (revenue by cost center) • Company {companyCode} • Source: {source}</p></div>
        <div className="flex gap-2"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search billing/SO/delivery/customer" className="border rounded-full px-4 py-2 text-sm w-64" /><button onClick={()=>setShowCreate(true)} className="text-sm bg-black text-white rounded-full px-4 py-2">+ New Billing (VF01) {companyCode}</button></div>
      </div>

      {msg && <div className="mb-4 p-3 bg-zinc-900 text-white rounded-xl text-sm">{msg}</div>}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8"><div className="bg-white rounded-2xl border p-2"><VirtualDataGrid data={billings} columns={columns} height={500} rowHeight={32} selectedRowId={selectedId || undefined} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>setSelectedId(r.id)} /></div></div>
        <div className="col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border p-4 text-xs">
            <div className="font-medium">Billing Detail • AR • Revenue • {companyCode} • Backend {source}</div>
            {selected ? (
              <div className="mt-3 space-y-2">
                <div><b>{(selected as any).billing_number}</b> • Type {(selected as any).type} • SO {(selected as any).sales_number} • Delivery {(selected as any).delivery_number||'None'} • Customer {(selected as any).customer_name||(selected as any).customer_name1} • Status {(selected as any).status} • Total {(selected as any).total_amount} {(selected as any).currency} • Tax {(selected as any).tax_amount} • Net {(selected as any).net_amount} • Paid {(selected as any).is_paid?'Yes':'No'}</div>
                <div className="mt-2 border rounded-xl p-2 bg-zinc-50 max-h-[200px] overflow-auto">
                  {(selected as any).lines?.map((l:any)=><div key={l.id} className="border-b pb-1 mt-1">{l.line_number} {l.material_number} {l.description?.substring(0,20)} {l.quantity} x {l.unit_price} = {l.line_total} Tax {l.tax_amount} COGS {l.cogs_per_unit}</div>)}
                </div>
                <div className="mt-3 p-2 bg-zinc-50 border rounded-xl text-[11px]">
                  <div className="font-bold">B2B Billing FI:</div>
                  <div className="mt-1">Dr AR {companyCode==='KS01'?'6000000000':'120000'} Cr Revenue {companyCode==='KS01'?'3000000000':'400000'} + Tax {companyCode==='KS01'?'2000000001 GST':'220000 VAT'} • Due Date + Payment Terms • F-28 Customer Payment Dr Bank Cr AR • Retail POS still immediate cash Dr Cash {companyCode==='KS01'?'8000000000':'100010'} Cr Revenue.</div>
                </div>
                <div className="mt-2 flex gap-2"><button onClick={()=>handleCancel((selected as any).id)} className="text-xs border rounded-full px-3 py-1.5">Cancel Billing →</button></div>
              </div>
            ) : <div className="text-zinc-500 mt-2">Select billing row - shows AR, revenue, tax, delivery, sales order • Backend connected {source} • {companyCode}</div>}
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={()=>setShowCreate(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border w-full max-w-lg p-6">
            <h3 className="font-semibold">Create Billing Document</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
              <div><label className="text-xs">Sales Order * (B2B)</label><select value={newBilling.salesOrderId} onChange={e=>setNewBilling({...newBilling, salesOrderId: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select Sales Order SO</option>{deliveries.map((d:any)=><option key={d.sales_order_id} value={d.sales_order_id}>{d.sales_number} {d.customer_name} {d.total_quantity} - Delivery {d.delivery_number} {d.status}</option>)}{billings.map((b:any)=><option key={b.sales_order_id} value={b.sales_order_id}>{b.sales_number} {b.customer_name} (from billing)</option>)}</select></div>
              <div><label className="text-xs">Delivery (optional but recommended B2B - must be GOODS_ISSUED)</label><select value={newBilling.deliveryId} onChange={e=>setNewBilling({...newBilling, deliveryId: e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">None - Direct Billing from SO</option>{deliveries.map((d:any)=><option key={d.id} value={d.id}>{d.delivery_number} {d.sales_number} {d.customer_name} {d.status} {d.total_quantity}</option>)}</select></div>
            </div>
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-xl text-[11px]">B2B: VA01 Order → VL01N Delivery GOODS_ISSUED 601 → VF01 Billing (this step) triggers AR Dr AR Cr Revenue+Tax. Delivery must be GOODS_ISSUED before billing. Retail POS still immediate billing via sales/issue webhook.</div>
            <div className="mt-6 flex gap-2"><button onClick={()=>setShowCreate(false)} className="flex-1 border rounded-full py-2.5">Cancel</button><button onClick={handleCreateBilling} className="flex-1 bg-black text-white rounded-full py-2.5">Create Billing • VF01 • {companyCode} • AR</button></div>
            {msg && <div className="mt-3 text-xs p-2 bg-zinc-900 text-white rounded-xl">{msg}</div>}
          </div>
        </div>
      )}
    </div>
  );

  const classicContent = (
    <div className="font-mono text-[11px] bg-[#f5f5f0]">
      <div className="border border-[#808080] bg-[#f0f0f0] p-2"><div className="font-bold border-b border-[#808080] pb-1">VF01/VF02/VF03 Selection • Billing • {companyCode} • B2B AR • Backend {source}</div><div className="grid grid-cols-12 gap-1 items-center mt-2"><div className="col-span-2 text-right pr-2">Billing Number:</div><div className="col-span-3"><input value={search} onChange={e=>setSearch(e.target.value)} className="w-full border border-black bg-white h-5 px-1" placeholder="90*" /></div><div className="col-span-2 text-right pr-2">Sales Order:</div><div className="col-span-3"><input placeholder="SO*" className="w-full border border-black bg-white h-5 px-1" /></div><div className="col-span-2"><button onClick={load} className="bg-[#d4d0c8] border border-[#404040] px-3 h-5">Execute F8 • {source}</button></div></div></div>
      <div className="mt-1 border border-black bg-white"><div className="bg-[#d4d0c8] border-b border-black px-2 h-6 flex items-center font-bold">Billing Table Control • {billings.length} entries • VF01/VF02/VF03 • B2B AR • Revenue • Tax • {source} • {companyCode}</div><VirtualDataGrid data={billings} columns={columns} height={450} rowHeight={26} selectedRowId={selectedId || undefined} getRowId={(r:any)=>r.id} onRowClick={(r:any)=>setSelectedId(r.id)} /></div>
    </div>
  );

  return (
    <ModernModuleShell title={`Billing ${companyCode}`} subtitle={`${companyCode}`} tooltip={`VF01/VF02/VF03 • B2B AR • Decoupled from Delivery • Revenue • Tax • Backend Connected ${source} • ${companyCode}`} code="VF01" module="SD" kpis={[
      {label:'Total Billings', value: billings.length.toString(), icon:'🧾'},
      {label:'Posted', value: billings.filter((b:any)=>b.status==='POSTED').length.toString(), icon:'✅'},
      {label:'Unpaid AR', value: billings.filter((b:any)=>!b.is_paid).length.toString(), icon:'💰'},
      {label:'Source', value: source, icon:'🔗'},
    ]}>
      {modernContent}
      <div className="mt-8 border-t pt-6"><div className="text-xs font-medium mb-3">Classic ERP GUI • VF01 • Functional • Backend Connected</div>{classicContent}</div>
    </ModernModuleShell>
  );
}
