"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';

const ALL_FIELDS = [
  'cost_center',
  'profit_center',
  'tax_code',
  'payment_term',
  'reference',
  'text',
  'assignment',
  'business_area',
  'trading_partner',
  'functional_area',
  'fund',
  'grant',
];

const STATUS_OPTIONS = [
  { value: 'R', label: 'R – Required' },
  { value: 'O', label: 'O – Optional' },
  { value: 'S', label: 'S – Suppressed' },
  { value: 'D', label: 'D – Display' },
];

export default function FieldStatusGroupsPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [uiMode, setUiMode] = useState<'modern'|'classic'>('modern');
  const [variantCode, setVariantCode] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [fieldStatuses, setFieldStatuses] = useState<Record<string, string>>({});
  const [existing, setExisting] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    try {
      const saved = localStorage.getItem('erp-ui-mode');
      if (saved) setUiMode(saved as any);
      const handler = (e:any)=>setUiMode(e.detail);
      window.addEventListener('erp-ui-mode-change', handler as any);
      return ()=>window.removeEventListener('erp-ui-mode-change', handler as any);
    } catch {}
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/field-status-groups');
      const j = await res.json();
      const rows = j.fieldStatusGroups || j.data || [];
      setExisting(rows);
      // If variant and group selected, populate fieldStatuses from existing
      const filtered = rows.filter((r:any)=> r.variant_code === variantCode && r.group_code === groupCode);
      const map: Record<string,string> = {};
      for (const r of filtered) {
        map[r.field_name] = r.status;
      }
      // Merge with defaults – keep existing selections if already set, else from DB
      setFieldStatuses(prev=>{
        const merged = { ...prev };
        for (const f of ALL_FIELDS) {
          if (filtered.find((r:any)=> r.field_name === f)) {
            merged[f] = filtered.find((r:any)=> r.field_name === f).status;
          } else if (!merged[f]) {
            merged[f] = 'O'; // default optional
          }
        }
        return merged;
      });
    } catch {}
    setLoading(false);
  };

  useEffect(()=>{ fetchGroups(); }, []);
  useEffect(()=>{ fetchGroups(); }, [variantCode, groupCode]);

  const handleSave = async () => {
    setMessage(null);
    setLoading(true);
    try {
      // Save each field status via API – bulk
      for (const fieldName of ALL_FIELDS) {
        const status = fieldStatuses[fieldName];
        if (!status) continue;
        // Only save if not default? Save all for clarity
        await fetch('/api/field-status-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variant_code: variantCode,
            group_code: groupCode,
            field_name: fieldName,
            status,
            description: `${groupName || groupCode} – ${fieldName} = ${status}`,
          }),
        });
      }
      setMessage(`✅ Field Status Group ${variantCode}/${groupCode} saved – ${ALL_FIELDS.length} fields – OBC5 – same structure as SAP – multiple FIELD_NAME per group in one save`);
      fetchGroups();
    } catch (e: any) {
      setMessage(`❌ ${e.message}`);
    }
    setLoading(false);
  };

  const modern = uiMode==='modern';

  return (
    <div className={modern ? "min-h-screen bg-[#fafaf9] p-6" : "min-h-screen bg-white p-4"}>
      <div className={modern ? "max-w-[1100px] mx-auto space-y-6" : "max-w-[1000px] mx-auto space-y-4"}>
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border-b pb-3"}>
          <div className="flex items-center gap-3">
            <span className={modern ? "text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-black text-white" : "text-[10px] font-mono border px-2 py-0.5 bg-black text-white"}>FFSG</span>
            <span className={modern ? "text-[10px] font-mono px-2 py-1 rounded-full bg-zinc-100 border text-zinc-500" : "text-[9px] font-mono border px-1 bg-zinc-50"}>FFSV</span>
            <span className={modern ? "text-[11px] bg-zinc-100 border rounded-full px-2.5 py-1 text-zinc-600" : "text-[10px] border px-2 py-0.5"}>{existing.length} records</span>
          </div>
          <h1 className={modern ? "text-xl font-bold mt-3 tracking-tight" : "text-lg font-bold mt-2"}>Field Status Groups – FFSG own IP – SAP Structure – Multiple Fields per Group</h1>
          <p className={modern ? "text-sm text-zinc-500 mt-1" : "text-xs text-zinc-500 mt-1"}>Define Field Status Groups – same structure as SAP – one group has multiple FIELD_NAME with status R/S/O/D – e.g., G001 expense: cost_center R, profit_center O, tax_code S – strict usage: cost center required for expense GL, suppressed for cash – per guide FFSV-1000 must exist before ELEC – Company: <b>{companyCode}</b></p>
        </div>

        <div className={modern ? "bg-white rounded-2xl shadow-lg border border-zinc-200 p-6 space-y-5" : "border p-4 space-y-3 bg-white"}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DbAutocomplete label="FIELD_STATUS_VARIANT_CODE * – FFSV own IP – must exist" value={variantCode} onChange={setVariantCode} apiUrl="/api/field-status-variants" dataKey="fieldStatusVariants" codeField="code" placeholder="" required createUrl={`/${companyCode}/fico/field-status-variants`} createCode="FFSV" companyCode={companyCode} />
            <div className="space-y-1">
              <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-medium"}>FIELD_STATUS_GROUP_CODE *</label>
              <input value={groupCode} onChange={e=>setGroupCode(e.target.value.toUpperCase())} placeholder="" className={modern ? "w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-[13px] h-[32px]" : "w-full border px-2 py-1.5 text-xs"} />
              <p className="text-[10px] text-zinc-400">Group code – e.g., G001 expense, G002 cash – same structure as SAP – one group multiple fields</p>
            </div>
            <div className="space-y-1">
              <label className={modern ? "text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "text-[11px] font-medium"}>GROUP_NAME</label>
              <input value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="" className={modern ? "w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-[13px] h-[32px]" : "w-full border px-2 py-1.5 text-xs"} />
            </div>
          </div>

          <div className={modern ? "border rounded-2xl overflow-hidden" : "border"}>
            <div className={modern ? "bg-zinc-50 px-4 py-2 text-[11px] font-medium uppercase tracking-widest text-zinc-600" : "bg-zinc-50 px-3 py-1 text-[10px] font-medium"}>Field Status Matrix – {variantCode && groupCode ? `Group ${variantCode}/${groupCode}` : 'Select Variant and Group'} – Multiple FIELD_NAME – R=Required S=Suppressed O=Optional D=Display</div>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead className={modern ? "bg-white text-[11px] text-zinc-500 border-b" : "bg-white text-[10px] text-zinc-500 border-b"}>
                  <tr>
                    <th className="text-left px-3 py-2">FIELD_NAME</th>
                    <th className="text-left px-3 py-2">STATUS</th>
                    <th className="text-left px-3 py-2">Description</th>
                    <th className="text-left px-3 py-2">Current DB</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_FIELDS.map(fieldName=>{
                    const currentStatus = fieldStatuses[fieldName] || 'O';
                    const existingRec = existing.find((r:any)=> r.variant_code===variantCode && r.group_code===groupCode && r.field_name===fieldName);
                    return (
                      <tr key={fieldName} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-3 py-2 font-mono text-[11px] font-bold">{fieldName}</td>
                        <td className="px-3 py-2">
                          <select value={currentStatus} onChange={e=>setFieldStatuses({...fieldStatuses, [fieldName]: e.target.value})} className={modern ? "border-2 border-zinc-200 rounded-full px-2.5 py-1 text-xs" : "border px-2 py-1 text-xs"}>
                            {STATUS_OPTIONS.map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-[10px] text-zinc-500">
                          {currentStatus==='R' ? 'Required – must have value – e.g., cost_center required for expense' : 
                           currentStatus==='S' ? 'Suppressed – must be empty – e.g., cost_center suppressed for cash' :
                           currentStatus==='O' ? 'Optional – can have value' : 'Display – display only'}
                        </td>
                        <td className="px-3 py-2 text-[10px] text-zinc-400">{existingRec ? `${existingRec.status} – in DB` : 'Not yet – default O'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={loading} className={modern ? "px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-zinc-800 shadow disabled:opacity-50" : "border px-4 py-1.5 text-xs bg-black text-white disabled:opacity-50"}>
              {loading ? 'Saving...' : `Save Field Status Group ${variantCode}/${groupCode} – ${ALL_FIELDS.length} Fields – FFSG own IP (alias OBC5)`}
            </button>
            <span className="text-[11px] text-zinc-400">Same structure as SAP – one group multiple FIELD_NAME – saves all fields at once – no need to add multiple times</span>
          </div>
          {message && <div className={modern ? "text-xs p-3 rounded-xl border bg-zinc-50 mt-3" : "text-[11px] border p-2"}>{message}</div>}
        </div>

        <div className={modern ? "bg-zinc-50 rounded-2xl border border-zinc-200 p-4" : "border p-3 bg-zinc-50"}>
          <h4 className={modern ? "text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2" : "text-[10px] uppercase text-zinc-500 mb-1"}>Related Masters – auto from dependencies – low importance</h4>
          <div className="flex flex-wrap gap-2">
            <Link href={`/${companyCode}/fico/field-status-variants`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FFSV</span><span>Field Status Variant – required – FFSV-1000 own IP must exist before ELEC</span><span className="text-zinc-400">→</span></Link>
            <Link href={`/${companyCode}/fico/gl-accounts`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">FGLC</span><span>GL Account uses Field Status – G001/G002</span><span className="text-zinc-400">→</span></Link>
            <Link href={`/${companyCode}/foundation/legal-entities`} className={modern ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-[11px] hover:border-zinc-300" : "inline-flex items-center gap-1 border px-2 py-1 text-[10px] bg-white"}><span className="font-mono font-bold text-[10px] px-1 py-0 rounded bg-black text-white">ELEC</span><span>Legal Entity uses FFSV-1000</span><span className="text-zinc-400">→</span></Link>
          </div>
        </div>

        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-5" : "border p-3"}>
          <h4 className={modern ? "font-medium text-sm mb-3" : "font-medium text-xs mb-2"}>Existing Field Status Groups – {existing.length}</h4>
          <div className="overflow-auto max-h-[300px]">
            <table className="w-full text-xs">
              <thead className="text-[10px] text-zinc-500 border-b"><tr><th className="text-left py-1">Variant</th><th className="text-left py-1">Group</th><th className="text-left py-1">Field</th><th className="text-left py-1">Status</th></tr></thead>
              <tbody>
                {existing.slice(0,50).map((it:any,i:number)=><tr key={i} className="border-b border-zinc-50"><td className="py-1 font-mono">{it.variant_code}</td><td className="py-1 font-mono">{it.group_code}</td><td className="py-1 font-mono">{it.field_name}</td><td className="py-1">{it.status}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
