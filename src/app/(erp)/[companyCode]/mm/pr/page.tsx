"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VirtualDataGrid } from '@/shared/ui/virtual-data-grid';
import { ColumnDef } from '@tanstack/react-table';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

const TABS = [
  { id: 'header', label: 'Header', tip: 'Company code, PR number, doc date, header text, currency, purch org/group' },
  { id: 'items', label: 'Items', tip: 'Material, qty, UoM, plant, SLoc, price, delivery date, acct assignment, ELIKZ' },
  { id: 'account', label: 'Account', tip: 'K cost center vs None inventory, GL, commitment PR→PO→GR/IV' },
  { id: 'delivery', label: 'Delivery', tip: 'Delivery date, GR time, tax code, GR/IR, ELIKZ' },
  { id: 'texts', label: 'Texts', tip: 'Header text, item text, delivery text' },
  { id: 'workflow', label: 'Workflow', tip: 'DRAFT→PENDING→Manager→Owner if >500 KWD/10000 INR→APPROVED→PO' },
];

const DETAIL_TOOLTIP = `ME51N/ME52N/ME53N/ME54N • ERP Views:
Header: Company code OX02, PR number 10* (1000000000-1999999999), doc date, header text, currency KWD/INR, purch org OX08, purch group OME4
Items: Line 10 material ROH qty/UoM plant KP01/1000 SLoc 0001/KS01 price delivery date acct K cost center ELIKZ
Item Detail: Material ROH qty/UoM plant/SLoc price delivery date K cost center KS-CC-01 GL 5000000001 commitment
Account: K cost center KS-CC-01 vs None inventory, cost center, GL, commitment PR→PO→GR/IV
Delivery/Invoice: Delivery date, GR time, tax V0/V1 GST FTXP, GR/IR WRX, ELIKZ
Texts: Header text FI, item text, delivery text
History: PO 45*, GR 101 WE 50* BSX/WRX, IV MIRO RE 51* RE+PRD, payment KZ 53*, flow PR→PO→GR→IV→Payment ALB
Workflow: DRAFT→PENDING→Manager→Owner if >500 KWD/10000 INR→APPROVED→Convert to PO ME21N`;

export default function PRPage() {
  const params = useParams();
  const router = useRouter();
  const companyCode = (params?.companyCode as string) || '1000';
  const [prs, setPrs] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [slocs, setSlocs] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('header');
  const [newPR, setNewPR] = useState({ 
    materialId: '', quantity: '100', uom: 'KG', plantId: '', slocId: '',
    estimatedPrice: '2.500',
    deliveryDate: new Date(Date.now()+7*24*3600000).toISOString().split('T')[0],
    docDate: new Date().toISOString().split('T')[0],
    purchasingOrg: '1000', purchasingGroup: '001',
    accountAssignment: 'K', costCenter: 'KS-CC-01', glAccount: '5000000001', taxCode: 'V0',
    headerText: '', itemText: '',
  });
  const [msg, setMsg] = useState('');
  const [source, setSource] = useState('db');

  async function load() {
    setLoading(true);
    try {
      const [prRes, plantRes, matRes] = await Promise.all([
        fetch(`/api/pr?limit=200&companyCode=${companyCode}&search=${encodeURIComponent(search)}`).then(r=>r.json()),
        fetch(`/api/plants?companyCode=${companyCode}`).then(r=>r.json()),
        fetch(`/api/materials?limit=100`).then(r=>r.json()),
      ]);
      setPrs(prRes.prs || []);
      setPlants(plantRes.plants || []);
      setSlocs(plantRes.slocs || []);
      setMaterials(matRes.materials || []);
      setSource(prRes.source || 'db');
      if (plantRes.plants?.length && !newPR.plantId) setNewPR(prev=>({...prev, plantId: plantRes.plants[0].id}));
      if (matRes.materials?.length && !newPR.materialId) setNewPR(prev=>({...prev, materialId: matRes.materials[0].id}));
    } catch(e){ console.error(e); }
    setLoading(false);
  }

  useEffect(()=>{ load(); },[companyCode]);
  useEffect(()=>{ const t=setTimeout(load,400); return()=>clearTimeout(t); },[search]);

  const filtered = useMemo(() => prs, [prs]);

  const handleCreatePR = async () => {
    setMsg('Creating PR...');
    try {
      const res = await fetch('/api/pr', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          companyCode, plantId: newPR.plantId,
          headerText: newPR.headerText || `PR for ${companyCode}`,
          itemText: newPR.itemText,
          purchasingOrg: newPR.purchasingOrg, purchasingGroup: newPR.purchasingGroup,
          docDate: newPR.docDate, deliveryDate: newPR.deliveryDate,
          lines: [{
            materialId: newPR.materialId, quantity: newPR.quantity, uom: newPR.uom,
            estimatedPrice: newPR.estimatedPrice, plantId: newPR.plantId, slocId: newPR.slocId || null,
            deliveryDate: newPR.deliveryDate, accountAssignment: newPR.accountAssignment,
            costCenter: newPR.costCenter, glAccount: newPR.glAccount, taxCode: newPR.taxCode,
          }]
        })
      }).then(r=>r.json());
      if (res.success) {
        setMsg(`✅ PR ${res.prNumber} created • ${res.totalAmount} ${companyCode==='KS01'?'INR':'KWD'}`);
        setShowCreate(false);
        load();
      } else setMsg(`❌ ${res.error}`);
    } catch(e:any){ setMsg(`❌ ${e.message}`); }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch('/api/pr', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, action:'APPROVE' }) }).then(r=>r.json());
      if (res.success) { setMsg(`✅ ${res.prNumber} APPROVED`); load(); } else setMsg(`❌ ${res.error}`);
    } catch(e:any){ setMsg(`❌ ${e.message}`); }
  };

  const handleConvertToPO = (id: string) => {
    const pr = prs.find((p:any)=>p.id===id);
    if (!pr) return;
    if (pr.status !== 'APPROVED') { alert(`PR must be APPROVED. Current: ${pr.status}`); return; }
    router.push(`/${companyCode}/mm/po?prRef=${pr.pr_number||pr.prNumber}&prId=${id}`);
  };

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    { accessorKey: 'pr_number', header: 'PR Number', size: 120, cell: ({ getValue, row }:any) => <span className="font-mono font-medium text-blue-600">{getValue()||row.original.prNumber}</span> },
    { accessorKey: 'material_number', header: 'Material', size: 140, cell: ({ getValue, row }:any) => <span className="truncate">{getValue()||row.original.material_description||'N/A'}</span> },
    { accessorKey: 'quantity', header: 'Qty', size: 70 },
    { accessorKey: 'plant_code', header: 'Plant', size: 70, cell: ({ getValue, row }:any) => <span>{getValue()||row.original.plant||'-'}</span> },
    { accessorKey: 'total_amount', header: 'Total', size: 90, cell: ({ getValue, row }:any) => <span className="font-medium">{getValue()||row.original.totalAmount||'0'}</span> },
    { accessorKey: 'status', header: 'Status', size: 110, cell: ({ getValue }) => {
      const v=getValue(); const cls=v==='APPROVED'?'bg-green-50 text-green-700 border-green-200':v==='PENDING_APPROVAL'?'bg-amber-50 text-amber-700 border-amber-200':'bg-zinc-50 text-zinc-600 border-zinc-200';
      return <span className={`px-2 py-0.5 rounded-full border text-[11px] ${cls}`}>{v}</span>;
    }},
    { accessorKey: 'created_at', header: 'Date', size: 90, cell: ({ getValue }) => <span className="text-zinc-500">{getValue()?.substring(0,10)||''}</span> },
  ], []);

  const selected = selectedId ? prs.find((p:any) => p.id === selectedId) : null;

  if (loading) return <div className="p-6 text-sm text-zinc-500">Loading PRs...</div>;

  return (
    <ModernModuleShell 
      title="Purchase Requisitions" 
      subtitle={`${filtered.length} PRs • ${companyCode} • ${source}`} 
      code="ME51N" 
      module="MM" 
      tooltip={DETAIL_TOOLTIP}
      kpis={[
        {label:'Total', value: prs.length.toString(), icon:'📝'},
        {label:'Pending', value: prs.filter((p:any)=>p.status==='PENDING_APPROVAL').length.toString(), icon:'⏳'},
        {label:'Approved', value: prs.filter((p:any)=>p.status==='APPROVED').length.toString(), icon:'✅'},
      ]}>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search PR..." className="border rounded-full px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-black" />
          <button onClick={load} className="text-xs border rounded-full px-3 py-2 hover:bg-zinc-50">Refresh</button>
        </div>
        <button onClick={()=>setShowCreate(true)} className="text-sm bg-black text-white rounded-full px-4 py-2 hover:bg-zinc-800">+ New PR</button>
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
            <div className="font-medium text-sm">PR Detail</div>
            {selected ? (
              <div className="mt-3 space-y-2 text-sm">
                <div className="font-mono font-medium">{(selected as any).pr_number||(selected as any).prNumber}</div>
                <div className="text-zinc-600 text-xs">{(selected as any).material_number||(selected as any).material_description} • {(selected as any).quantity} {(selected as any).uom}</div>
                <div className="text-xs"><span className="text-zinc-500">Plant:</span> {(selected as any).plant_code||'-'} / {(selected as any).sloc_code||'-'} • <span className="text-zinc-500">Total:</span> {(selected as any).total_amount}</div>
                <div className="text-xs"><span className="text-zinc-500">Status:</span> <span className="font-medium">{(selected as any).status}</span></div>
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>handleApprove((selected as any).id)} className="text-xs bg-green-600 text-white rounded-full px-3 py-1.5 hover:bg-green-700">Approve</button>
                  <button onClick={()=>handleConvertToPO((selected as any).id)} className="text-xs bg-black text-white rounded-full px-3 py-1.5">To PO</button>
                </div>
                <div className="flex gap-2 mt-2">
                  <a href={`/${companyCode}/audit/document-flow?type=PR&id=${(selected as any).id}`} className="text-[11px] border rounded-full px-2 py-1 hover:bg-white">Doc Flow</a>
                  <a href={`/${companyCode}/mm/po?prId=${(selected as any).id}`} className="text-[11px] border rounded-full px-2 py-1 hover:bg-white">Create PO</a>
                </div>
              </div>
            ) : <div className="text-zinc-400 text-xs mt-2">Select a PR row to view details</div>}
          </div>
          <div className="bg-white rounded-2xl border p-4">
            <div className="font-medium text-xs">Quick Actions</div>
            <div className="mt-2 space-y-1.5 text-xs">
              <button onClick={()=>router.push(`/${companyCode}/workflow/inbox`)} className="w-full text-left border rounded-xl px-3 py-2 hover:bg-zinc-50">Workflow Inbox →</button>
              <button onClick={()=>router.push(`/${companyCode}/mm/po`)} className="w-full text-left border rounded-xl px-3 py-2 hover:bg-zinc-50">Purchase Orders →</button>
            </div>
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={()=>setShowCreate(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border w-full max-w-3xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">New Purchase Requisition</h3>
              <button onClick={()=>setShowCreate(false)} className="text-zinc-400 hover:text-black">✕</button>
            </div>
            <div className="mt-4 flex gap-1 flex-wrap">
              {TABS.map(tab=>(
                <div key={tab.id} className="relative group">
                  <button onClick={()=>setActiveTab(tab.id)} className={`text-xs px-3 py-1.5 rounded-full border ${activeTab===tab.id?'bg-black text-white border-black':'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'}`}>{tab.label}</button>
                  <div className="absolute left-0 top-8 z-10 hidden group-hover:block w-64 bg-zinc-900 text-white text-[11px] p-2 rounded-lg shadow-xl">{tab.tip}</div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              {activeTab==='header' && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><label className="text-xs text-zinc-500">Company Code</label><input value={companyCode} readOnly className="mt-1 w-full border bg-zinc-50 rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Doc Date</label><input type="date" value={newPR.docDate} onChange={e=>setNewPR({...newPR, docDate:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Purch Org</label><select value={newPR.purchasingOrg} onChange={e=>setNewPR({...newPR, purchasingOrg:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>1000</option><option>KPO1</option></select></div>
                  <div><label className="text-xs text-zinc-500">Purch Group</label><select value={newPR.purchasingGroup} onChange={e=>setNewPR({...newPR, purchasingGroup:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>001</option><option>K01</option></select></div>
                  <div className="col-span-2"><label className="text-xs text-zinc-500">Header Text</label><input value={newPR.headerText} onChange={e=>setNewPR({...newPR, headerText:e.target.value})} placeholder="Purpose..." className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                </div>
              )}
              {activeTab==='items' && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2"><label className="text-xs text-zinc-500">Material</label><select value={newPR.materialId} onChange={e=>setNewPR({...newPR, materialId:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select</option>{materials.map((m:any)=><option key={m.id} value={m.id}>{m.material_number} {m.description}</option>)}</select></div>
                  <div><label className="text-xs text-zinc-500">Qty</label><input value={newPR.quantity} onChange={e=>setNewPR({...newPR, quantity:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">UoM</label><select value={newPR.uom} onChange={e=>setNewPR({...newPR, uom:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option>KG</option><option>L</option><option>PC</option><option>BOX</option></select></div>
                  <div><label className="text-xs text-zinc-500">Plant</label><select value={newPR.plantId} onChange={e=>setNewPR({...newPR, plantId:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select</option>{plants.map((p:any)=><option key={p.id} value={p.id}>{p.code} {p.name}</option>)}</select></div>
                  <div><label className="text-xs text-zinc-500">SLoc</label><select value={newPR.slocId} onChange={e=>setNewPR({...newPR, slocId:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select</option>{slocs.map((s:any)=><option key={s.id} value={s.id}>{s.code} {s.name}</option>)}</select></div>
                  <div><label className="text-xs text-zinc-500">Price</label><input value={newPR.estimatedPrice} onChange={e=>setNewPR({...newPR, estimatedPrice:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                  <div><label className="text-xs text-zinc-500">Delivery Date</label><input type="date" value={newPR.deliveryDate} onChange={e=>setNewPR({...newPR, deliveryDate:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
                </div>
              )}
              {(activeTab==='account' || activeTab==='delivery' || activeTab==='texts' || activeTab==='workflow') && (
                <div className="text-xs text-zinc-500 p-4 bg-zinc-50 rounded-xl border">
                  {TABS.find(t=>t.id===activeTab)?.tip} - configured via backend defaults.
                  {activeTab==='account' && <div className="mt-2 grid grid-cols-2 gap-2"><div>Cost Center: KS-CC-01</div><div>GL: 5000000001</div></div>}
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={()=>setShowCreate(false)} className="flex-1 border rounded-full py-2.5 text-sm">Cancel</button>
              <button onClick={handleCreatePR} className="flex-1 bg-black text-white rounded-full py-2.5 text-sm">Create PR</button>
            </div>
          </div>
        </div>
      )}
    </ModernModuleShell>
  );
}
