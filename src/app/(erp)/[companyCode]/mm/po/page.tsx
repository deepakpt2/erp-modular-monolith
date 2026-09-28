"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VirtualDataGrid } from '@/shared/ui/virtual-data-grid';
import { ColumnDef } from '@tanstack/react-table';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

const TABS = [
  { id: 'header', label: 'Header', tip: 'Company, vendor, purch org/group, dates, payment terms, incoterms, currency' },
  { id: 'items', label: 'Items', tip: 'Material, qty/UoM, plant/SLoc, price, freight/customs MAP, ELIKZ' },
  { id: 'account', label: 'Account', tip: 'K cost center vs None inventory, GL, commitment PR→PO→GR/IV' },
  { id: 'conditions', label: 'Conditions', tip: 'PB00 gross, FRB1 freight, ZCUS customs, net MAP' },
  { id: 'delivery', label: 'Delivery', tip: 'Delivery date, GR time, tax, GR/IR, ELIKZ flag' },
  { id: 'texts', label: 'Texts', tip: 'Header, item, delivery texts' },
  { id: 'history', label: 'History', tip: 'GR 101, IV MIRO, payment, flow PR→PO→GR→IV' },
];

const DETAIL_TIP = `ME21N/ME22N/ME23N • ERP Views:
Header: Company code OX02, vendor BP recon 6000000000/200000, purch org OX08, purch group OME4, doc date, delivery date, payment terms 0001/0002, incoterms EXW/FOB/CIF, currency KWD/INR, PR ref, header text
Items: Line 10 material ROH qty/UoM plant/SLoc price freight/customs total per unit MAP ELIKZ
Item Detail: Material ROH qty/UoM plant/SLoc batch price freight/customs MAP tax V0/V1 account K cost center GL
Delivery/Invoice: Delivery date, GR time, tax, invoice receipt, GR/IR WRX, ELIKZ closes line final if received<ordered
Account: K cost center KS-CC-01 vs None inventory, GL BSX/GBB, commitment PR→PO→GR/IV
Conditions: PB00 gross, FRB1 freight, ZCUS customs, net price MAP
Texts: Header/item/delivery texts, info record
History: GR 101 WE 50* BSX/WRX, IV MIRO RE 51* RE+PRD, payment KZ 53*, flow PR→PO→GR→IV→Payment ALB, partial GR until ELIKZ`;

export default function POPage() {
  const params = useParams();
  const router = useRouter();
  const companyCode = (params?.companyCode as string) || '1000';
  const [pos, setPos] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [slocs, setSlocs] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [prs, setPrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('header');
  const [newPO, setNewPO] = useState({ 
    vendorId: '', vendorName: '', plantId: '', slocId: '', materialId: '',
    quantity: '100', uom: 'KG', unitPrice: '2.5', freightPerUnit: '0.1', customsPerUnit: '0.05',
    taxCode: 'V0', deliveryDate: new Date(Date.now()+7*24*3600000).toISOString().split('T')[0],
    docDate: new Date().toISOString().split('T')[0], paymentTerms: '0001', incoterms: 'EXW',
    purchasingOrg: '1000', purchasingGroup: '001', accountAssignment: 'K', costCenter: 'KS-CC-01',
    glAccount: '5000000001', headerText: '', itemText: '', prId: '', currency: companyCode==='KS01'?'INR':'KWD',
  });
  const [msg, setMsg] = useState('');
  const [source, setSource] = useState('db');
  const [vendors, setVendors] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    try {
      const [poRes, plantRes, matRes, prRes, bpRes] = await Promise.all([
        fetch(`/api/po?limit=200&companyCode=${companyCode}&search=${encodeURIComponent(search)}`).then(r=>r.json()),
        fetch(`/api/plants?companyCode=${companyCode}`).then(r=>r.json()),
        fetch(`/api/materials?limit=100`).then(r=>r.json()),
        fetch(`/api/pr?limit=100&companyCode=${companyCode}`).then(r=>r.json()),
        fetch(`/api/business-partners?role=VENDOR&limit=100`).then(r=>r.json()).catch(()=>({businessPartners:[]})),
      ]);
      setPos(poRes.pos || []);
      setPlants(plantRes.plants || []);
      setSlocs(plantRes.slocs || []);
      setMaterials(matRes.materials || []);
      setPrs(prRes.prs || []);
      setSource(poRes.source || 'db');
      const vendorMap = new Map();
      (bpRes.businessPartners||[]).forEach((bp:any)=> vendorMap.set(bp.id, { id: bp.id, name: bp.name1||bp.name||'Vendor', bp_number: bp.bp_number }));
      (poRes.pos||[]).forEach((p:any)=>{ if (p.vendor_id && !vendorMap.has(p.vendor_id)) vendorMap.set(p.vendor_id, { id: p.vendor_id, name: p.vendor_name||'Vendor', bp_number: p.vendor_number }); });
      if (companyCode==='KS01' && vendorMap.size===0) {
        vendorMap.set('KS-V-001', { id: 'KS-V-001', name: 'Malabar Spice Farms', bp_number: 'KS-V-001' });
      }
      setVendors(Array.from(vendorMap.values()));
      if (plantRes.plants?.length && !newPO.plantId) setNewPO(prev=>({...prev, plantId: plantRes.plants[0].id}));
      if (matRes.materials?.length && !newPO.materialId) setNewPO(prev=>({...prev, materialId: matRes.materials[0].id}));
      if (vendorMap.size>0 && !newPO.vendorId) {
        const first = Array.from(vendorMap.values())[0] as any;
        setNewPO(prev=>({...prev, vendorId: first.id, vendorName: first.name}));
      }
    } catch(e){ console.error(e); }
    setLoading(false);
  }

  useEffect(()=>{ load(); },[companyCode]);
  useEffect(()=>{ const t=setTimeout(load,400); return()=>clearTimeout(t); },[search]);

  const filtered = useMemo(()=> pos, [pos]);

  const handleCreatePO = async () => {
    setMsg('Creating PO...');
    try {
      const res = await fetch('/api/po', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          companyCode, vendorId: newPO.vendorId, plantId: newPO.plantId,
          headerText: newPO.headerText || `PO for ${companyCode}`,
          itemText: newPO.itemText,
          freightAmount: (parseFloat(newPO.freightPerUnit||'0')*parseFloat(newPO.quantity||'0')).toString(),
          customsAmount: (parseFloat(newPO.customsPerUnit||'0')*parseFloat(newPO.quantity||'0')).toString(),
          prId: newPO.prId || null, purchasingOrg: newPO.purchasingOrg, purchasingGroup: newPO.purchasingGroup,
          paymentTerms: newPO.paymentTerms, incoterms: newPO.incoterms, docDate: newPO.docDate,
          deliveryDate: newPO.deliveryDate, currency: newPO.currency,
          lines: [{
            materialId: newPO.materialId, quantity: newPO.quantity, uom: newPO.uom,
            unitPrice: newPO.unitPrice, freightPerUnit: newPO.freightPerUnit, customsPerUnit: newPO.customsPerUnit,
            plantId: newPO.plantId, slocId: newPO.slocId || null, taxCode: newPO.taxCode,
            accountAssignment: newPO.accountAssignment, costCenter: newPO.costCenter, glAccount: newPO.glAccount,
          }]
        })
      }).then(r=>r.json());
      if (res.success) {
        setMsg(`✅ PO ${res.poNumber} created • ${res.totalAmount} ${newPO.currency}`);
        setShowCreate(false);
        load();
      } else setMsg(`❌ ${res.error}`);
    } catch(e:any){ setMsg(`❌ ${e.message}`); }
  };

  const handleApprove = async (id:string) => {
    try {
      const res = await fetch('/api/po', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, action:'APPROVE' }) }).then(r=>r.json());
      if (res.success) { setMsg(`✅ PO ${res.poNumber} APPROVED`); load(); } else setMsg(`❌ ${res.error}`);
    } catch(e:any){ setMsg(`❌ ${e.message}`); }
  };

  const handleELIKZ = async (poId:string) => {
    try {
      const res = await fetch('/api/po', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: poId, action:'SET_ELIKZ_AUTO', deliveryCompleted: true, reason: 'SHORT_SHIPMENT_FINAL' }) }).then(r=>r.json());
      if (res.success) { setMsg(`✅ ELIKZ set for PO ${res.poNumber}`); load(); } else setMsg(`❌ ${res.error}`);
    } catch(e:any){ setMsg(`❌ ${e.message}`); }
  };

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    { accessorKey: 'po_number', header: 'PO Number', size: 120, cell: ({ getValue }) => <span className="font-mono font-medium text-blue-600">{getValue()}</span> },
    { accessorKey: 'vendor_name', header: 'Vendor', size: 130, cell: ({ getValue }) => <span className="truncate">{getValue()||'-'}</span> },
    { accessorKey: 'plant_code', header: 'Plant', size: 70 },
    { accessorKey: 'total_amount', header: 'Total', size: 90, cell: ({ getValue }) => <span className="font-medium">{getValue()}</span> },
    { accessorKey: 'status', header: 'Status', size: 100, cell: ({ getValue }) => {
      const v=getValue(); const cls=v==='APPROVED'?'bg-green-50 text-green-700 border-green-200':'bg-zinc-50 text-zinc-600 border-zinc-200';
      return <span className={`px-2 py-0.5 rounded-full border text-[11px] ${cls}`}>{v}</span>;
    }},
    { accessorKey: 'all_elikz', header: 'ELIKZ', size: 70, cell: ({ getValue }) => <span className={`px-2 py-0.5 rounded-full border text-[11px] ${getValue()?'bg-black text-white':'bg-zinc-50'}`}>{getValue()?'Closed':'Open'}</span> },
  ], []);

  const selected = selectedId ? pos.find((p:any)=>p.id===selectedId) : null;

  if (loading) return <div className="p-6 text-sm text-zinc-500">Loading POs...</div>;

  return (
    <ModernModuleShell title="Purchase Orders" subtitle={`${filtered.length} POs • ${companyCode} • ${source}`} code="ME21N" module="MM" tooltip={DETAIL_TIP} kpis={[
      {label:'Total', value: pos.length.toString(), icon:'📋'},
      {label:'Approved', value: pos.filter((p:any)=>p.status==='APPROVED').length.toString(), icon:'✅'},
      {label:'Closed', value: pos.filter((p:any)=>p.all_elikz).length.toString(), icon:'🔒'},
    ]}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search PO..." className="border rounded-full px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-black" />
          <button onClick={load} className="text-xs border rounded-full px-3 py-2 hover:bg-zinc-50">Refresh</button>
        </div>
        <button onClick={()=>setShowCreate(true)} className="text-sm bg-black text-white rounded-full px-4 py-2">+ New PO</button>
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
            <div className="font-medium text-sm">PO Detail</div>
            {selected ? (
              <div className="mt-3 space-y-2 text-sm">
                <div className="font-mono font-medium">{(selected as any).po_number}</div>
                <div className="text-xs text-zinc-600">{(selected as any).vendor_name} • {(selected as any).plant_code} • {(selected as any).total_amount} {(selected as any).currency}</div>
                <div className="text-xs"><span className="text-zinc-500">Status:</span> {(selected as any).status} • ELIKZ: {(selected as any).all_elikz?'Closed':'Open'}</div>
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>handleApprove((selected as any).id)} className="text-xs bg-green-600 text-white rounded-full px-3 py-1.5">Approve</button>
                  <button onClick={()=>handleELIKZ((selected as any).id)} className="text-xs bg-black text-white rounded-full px-3 py-1.5">ELIKZ</button>
                </div>
                <div className="flex gap-2 mt-2">
                  <a href={`/${companyCode}/mm/gr?poId=${(selected as any).id}`} className="text-[11px] border rounded-full px-2 py-1 hover:bg-white">GR</a>
                  <a href={`/${companyCode}/audit/document-flow?type=PO&id=${(selected as any).id}`} className="text-[11px] border rounded-full px-2 py-1 hover:bg-white">Doc Flow</a>
                </div>
              </div>
            ) : <div className="text-zinc-400 text-xs mt-2">Select a PO row</div>}
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={()=>setShowCreate(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border w-full max-w-3xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">New Purchase Order</h3>
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
              <div><label className="text-xs text-zinc-500">Vendor</label><select value={newPO.vendorId} onChange={e=>{ const v=vendors.find((x:any)=>x.id===e.target.value); setNewPO({...newPO, vendorId:e.target.value, vendorName:v?v.name:''}); }} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select</option>{vendors.map((v:any)=><option key={v.id} value={v.id}>{v.bp_number} {v.name}</option>)}</select></div>
              <div><label className="text-xs text-zinc-500">Material</label><select value={newPO.materialId} onChange={e=>setNewPO({...newPO, materialId:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select</option>{materials.map((m:any)=><option key={m.id} value={m.id}>{m.material_number} {m.description}</option>)}</select></div>
              <div><label className="text-xs text-zinc-500">Qty</label><input value={newPO.quantity} onChange={e=>setNewPO({...newPO, quantity:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
              <div><label className="text-xs text-zinc-500">Price</label><input value={newPO.unitPrice} onChange={e=>setNewPO({...newPO, unitPrice:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
              <div><label className="text-xs text-zinc-500">Plant</label><select value={newPO.plantId} onChange={e=>setNewPO({...newPO, plantId:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2"><option value="">Select</option>{plants.map((p:any)=><option key={p.id} value={p.id}>{p.code}</option>)}</select></div>
              <div><label className="text-xs text-zinc-500">Delivery Date</label><input type="date" value={newPO.deliveryDate} onChange={e=>setNewPO({...newPO, deliveryDate:e.target.value})} className="mt-1 w-full border rounded-xl px-3 py-2" /></div>
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={()=>setShowCreate(false)} className="flex-1 border rounded-full py-2.5 text-sm">Cancel</button>
              <button onClick={handleCreatePO} className="flex-1 bg-black text-white rounded-full py-2.5 text-sm">Create PO</button>
            </div>
          </div>
        </div>
      )}
    </ModernModuleShell>
  );
}
