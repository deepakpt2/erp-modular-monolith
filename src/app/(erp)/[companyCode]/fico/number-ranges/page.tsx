"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface NumberRange {
  id?: string;
  code: string;
  object_type: string;
  from_number: number;
  to_number: number;
  current_number: number;
  next_number?: number;
  fiscal_year?: number | null;
  description?: string;
  used_count?: number;
  usage_percent?: number;
  is_used?: boolean;
  is_locked?: boolean;
}

interface Assignment {
  id?: string;
  object_type: string;
  assignment_key: string;
  assignment_type: string;
  number_range_code: string;
  fiscal_year?: number | null;
  is_active?: boolean;
  description?: string;
  from_number?: number;
  to_number?: number;
  current_number?: number;
  next_number?: number;
  used_count?: number;
  usage_percent?: number;
  is_locked?: boolean;
}

const OBJECT_TYPES = ['ITEM','MATERIAL','PARTNER','LOT','PR','PO','GR','IV','SO','DL','BL','STO','PI','PROD_ORDER','MRP','FI_DOC','BILLING','DELIVERY','EMPLOYEE','ASSET_POSTING','CLOSING','FX_VALUATION','RESERVATION','SERIAL'];
const MATERIAL_TYPES = ['RAW','FINISHED','SEMI','TRADING','PACKAGING','CONSUMABLE','SERVICE'];
const ASSIGNMENT_TYPES = ['MATERIAL_TYPE','COMPANY_CODE','DOC_TYPE','PLANT'];

const DEFAULTS: Record<string, { from: number, to: number }> = {
  'ITEM': { from: 10000000, to: 19999999 },
  'MATERIAL': { from: 10000000, to: 19999999 },
  'PR': { from: 1000000000, to: 1999999999 },
  'PO': { from: 4500000000, to: 4599999999 },
  'GR': { from: 5000000000, to: 5099999999 },
  'IV': { from: 5100000000, to: 5199999999 },
  'SO': { from: 1000000000, to: 1999999999 },
  'DL': { from: 8000000000, to: 8099999999 },
  'BL': { from: 9000000000, to: 9099999999 },
  'FI_DOC': { from: 1000000000, to: 1999999999 },
  'BILLING': { from: 9000000000, to: 9099999999 },
  'DELIVERY': { from: 8000000000, to: 8099999999 },
  'PARTNER': { from: 100000, to: 199999 },
  'LOT': { from: 1000000000, to: 1999999999 },
};

export default function NumberRangesPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [uiMode, setUiMode] = React.useState<'modern' | 'classic'>('modern');
  React.useEffect(()=>{ try{ const s=localStorage.getItem('erp-ui-mode'); if(s) setUiMode(s as any); const h=(e:any)=>setUiMode(e.detail); window.addEventListener('erp-ui-mode-change', h as any); return ()=>window.removeEventListener('erp-ui-mode-change', h as any);}catch{}},[]);
  const [ranges, setRanges] = useState<NumberRange[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ranges' | 'assignments'>('ranges');
  const [form, setForm] = useState<Partial<NumberRange>>({ code: '', object_type: 'ITEM', from_number: 10000000, to_number: 19999999, current_number: 10000000, fiscal_year: undefined, description: '' });
  const [assignForm, setAssignForm] = useState<Partial<Assignment>>({ object_type: 'ITEM', assignment_key: 'RAW', assignment_type: 'MATERIAL_TYPE', number_range_code: '', fiscal_year: undefined, description: '' });
  const [editing, setEditing] = useState<NumberRange | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const fetchRanges = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/number-ranges');
      const j = await res.json();
      const data = j.data || j.numberRanges || [];
      const enriched = data.map((r: any) => {
        const from = Number(r.from_number);
        const to = Number(r.to_number);
        const current = Number(r.current_number);
        const used = current - from;
        const total = to - from;
        const percent = total > 0 ? Math.round((used / total) * 100) : 0;
        return {
          ...r,
          from_number: from,
          to_number: to,
          current_number: current,
          next_number: current + 1,
          used_count: used,
          usage_percent: percent,
          is_used: current > from,
          is_locked: current > from,
        };
      });
      setRanges(enriched);

      // Fetch assignments
      try {
        const aRes = await fetch('/api/number-range-assignments');
        const aJ = await aRes.json();
        const aData = aJ.data || aJ.assignments || [];
        const aEnriched = aData.map((a: any) => {
          const from = Number(a.from_number || 0);
          const to = Number(a.to_number || 0);
          const current = Number(a.current_number || 0);
          const used = from ? current - from : 0;
          const total = to && from ? to - from : 0;
          const percent = total > 0 ? Math.round((used / total) * 100) : 0;
          return {
            ...a,
            from_number: from,
            to_number: to,
            current_number: current,
            next_number: current ? current + 1 : undefined,
            used_count: used,
            usage_percent: percent,
            is_locked: current > from,
          };
        });
        setAssignments(aEnriched);
      } catch {}
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchRanges(); }, []);

  useEffect(() => {
    if (form.object_type) {
      const def = DEFAULTS[form.object_type.toUpperCase()];
      if (def && !editing) {
        setForm(f => ({ ...f, from_number: def.from, to_number: def.to, current_number: def.from }));
      }
    }
  }, [form.object_type]);

  const filtered = useMemo(() => {
    if (!search.trim()) return ranges;
    const q = search.toLowerCase();
    return ranges.filter(r => r.code.toLowerCase().includes(q) || r.object_type.toLowerCase().includes(q) || String(r.fiscal_year || '').includes(q));
  }, [ranges, search]);

  const lockedCount = ranges.filter(r => r.is_locked).length;
  const totalUsed = ranges.reduce((acc, r) => acc + (r.used_count || 0), 0);
  const warningRanges = ranges.filter(r => (r.usage_percent || 0) >= 80);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const payload = {
        code: editing ? editing.code : form.code?.toUpperCase(),
        object_type: editing ? editing.object_type : form.object_type?.toUpperCase(),
        from_number: editing ? editing.from_number : form.from_number,
        to_number: form.to_number,
        current_number: editing ? undefined : form.current_number,
        fiscal_year: form.fiscal_year || null,
        description: form.description,
        prefix: '',
      };
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch('/api/number-ranges', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { id: editing.id, code: editing.code, to_number: form.to_number, description: form.description, fiscal_year: editing.fiscal_year } : payload) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setMessage(`✅ ${editing ? 'Updated' : 'Created'} ${j.numberRange?.code || payload.code} – next ${j.numberRange?.next_number || j.next_number || (Number(payload.current_number || 0)+1)}`);
      setShowForm(false);
      setEditing(null);
      setForm({ code: '', object_type: 'ITEM', from_number: 10000000, to_number: 19999999, current_number: 10000000, fiscal_year: undefined, description: '' });
      fetchRanges();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const payload = {
        object_type: assignForm.object_type?.toUpperCase(),
        assignment_key: assignForm.assignment_key?.toUpperCase(),
        assignment_type: assignForm.assignment_type?.toUpperCase(),
        number_range_code: assignForm.number_range_code?.toUpperCase(),
        fiscal_year: assignForm.fiscal_year || null,
        description: assignForm.description,
      };
      const res = await fetch('/api/number-range-assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setMessage(`✅ Assignment ${payload.object_type} ${payload.assignment_key} → ${payload.number_range_code} created – explicit XYZ to material / YZX to PO`);
      setShowAssignForm(false);
      setAssignForm({ object_type: 'ITEM', assignment_key: 'RAW', assignment_type: 'MATERIAL_TYPE', number_range_code: '', fiscal_year: undefined, description: '' });
      fetchRanges();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  const handleEdit = (r: NumberRange) => {
    if (r.is_locked) {
      setMessage(`🔒 Range ${r.code}${r.fiscal_year ? ` FY ${r.fiscal_year}` : ''} used ${r.used_count} times (current ${r.current_number} > from ${r.from_number}), locked – only to_number increase and description allowed. Next ${r.next_number} – ${r.usage_percent}% used.`);
    }
    setEditing(r);
    setForm({ code: r.code, object_type: r.object_type, from_number: r.from_number, to_number: r.to_number, current_number: r.current_number, fiscal_year: r.fiscal_year || undefined, description: r.description });
    setShowForm(true);
  };

  const handleDelete = async (r: NumberRange) => {
    if (r.is_locked) {
      setMessage(`🔒 Cannot delete ${r.code} – used ${r.used_count} times – next ${r.next_number} – ${r.usage_percent}% used – locked – keep for audit. Create new range ${r.code}-NEW instead.`);
      return;
    }
    if (!confirm(`Delete range ${r.code}${r.fiscal_year ? ` FY ${r.fiscal_year}` : ''}? Only allowed if not used.`)) return;
    try {
      const url = r.fiscal_year ? `/api/number-ranges?code=${r.code}&fiscal_year=${r.fiscal_year}` : `/api/number-ranges?code=${r.code}`;
      const res = await fetch(url, { method: 'DELETE' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setMessage(`✅ Deleted ${r.code}`);
      fetchRanges();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  const handleDeleteAssignment = async (a: Assignment) => {
    if (!confirm(`Delete assignment ${a.object_type} ${a.assignment_key} → ${a.number_range_code}?`)) return;
    try {
      const res = await fetch(`/api/number-range-assignments?id=${a.id}`, { method: 'DELETE' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setMessage(`✅ Deleted assignment ${a.object_type} ${a.assignment_key}`);
      fetchRanges();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className={uiMode==='modern' ? "min-h-screen bg-[#fafaf9] p-4" : "min-h-screen bg-white p-3 font-mono text-[11px]"}>
      <div className={uiMode==='modern' ? "max-w-[1300px] mx-auto space-y-4" : "max-w-[1200px] mx-auto space-y-3"}>
        {/* Header */}
        <div className={uiMode==='modern' ? "bg-white rounded-2xl border border-zinc-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]" : "bg-white border-2 border-black p-3"}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-black text-white">FNRC</span>
              <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-zinc-100 border text-zinc-500">FBN1</span>
              <span className="text-[11px] bg-zinc-100 border rounded-full px-2.5 py-1 text-zinc-600">{ranges.length} ranges • {lockedCount} locked 🔒 • {totalUsed} used • {assignments.length} assignments</span>
              {warningRanges.length > 0 && <span className="text-[11px] bg-zinc-100 border border-zinc-300 rounded-full px-2.5 py-1 text-zinc-800">⚠️ {warningRanges.length} ranges ≥80% used</span>}
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${companyCode}/navigator`} className="px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50">Navigator</Link>
              <button onClick={() => setActiveTab('ranges')} className={`px-3 py-1.5 rounded-full text-xs ${activeTab==='ranges' ? 'bg-black text-white' : 'border hover:bg-zinc-50'}`}>Ranges ({ranges.length})</button>
              <button onClick={() => setActiveTab('assignments')} className={`px-3 py-1.5 rounded-full text-xs ${activeTab==='assignments' ? 'bg-black text-white' : 'border hover:bg-zinc-50'}`}>Assignments ({assignments.length}) – XYZ to material</button>
              {activeTab==='ranges' && <button onClick={() => { setEditing(null); setForm({ code: '', object_type: 'ITEM', from_number: 10000000, to_number: 19999999, current_number: 10000000, fiscal_year: undefined, description: '' }); setShowForm(!showForm); }} className="px-4 py-1.5 rounded-full bg-black text-white text-xs">+ New Range</button>}
              {activeTab==='assignments' && <button onClick={() => setShowAssignForm(!showAssignForm)} className="px-4 py-1.5 rounded-full bg-black text-white text-xs">+ New Assignment – XYZ→Material</button>}
            </div>
          </div>
          <h1 className="text-xl font-bold mt-3 tracking-tight">Number Ranges – FNRC</h1>
          <p className="text-sm text-zinc-500 mt-1">Company {companyCode} – purely numeric intervals – From/To/Current – Next = Current+1 – Locked 🔒 if current &gt; from – Assignments link material type / company to specific range – e.g., RAW → MAT-RAW-01 (10000-19999), FINISHED → MAT-FG-01 (20000-29999), PO company 1000 → PO-01</p>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-zinc-50 rounded-xl border p-3">
              <div className="text-[10px] uppercase text-zinc-500">Numbering</div>
              <div className="text-xs font-medium mt-1">Purely numeric – no prefix – e.g., PO 4500000000, Material 10000001</div>
            </div>
            <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-3">
              <div className="text-[10px] uppercase text-zinc-900">Next Available</div>
              <div className="text-xs font-medium mt-1">Current+1 – e.g., current 4500000000 → next 4500000001 – shown in blue badge</div>
            </div>
            <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-3">
              <div className="text-[10px] uppercase text-zinc-700">Locked 🔒</div>
              <div className="text-xs font-medium mt-1">If used (current &gt; from), show 🔒 Locked + used count + % – no delete, only to_number increase</div>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-3">
              <div className="text-[10px] uppercase text-green-700">Assignments – XYZ→Material</div>
              <div className="text-xs font-medium mt-1">Explicit: RAW → MAT-RAW-01 (10000-19999), FINISHED → MAT-FG-01, PO 1000 → PO-01 – multiple ranges per type</div>
            </div>
          </div>

          {warningRanges.length > 0 && (
            <div className="mt-4 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
              <div className="text-xs font-bold text-zinc-800">⚠️ Usage Warning – {warningRanges.length} ranges ≥80% used – consider increasing to_number or creating new range</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {warningRanges.map(r => (
                  <span key={r.code} className={`text-[11px] px-2 py-1 rounded-full border ${ (r.usage_percent||0) >= 90 ? 'bg-red-100 border-red-300 text-red-800' : 'bg-zinc-100 border-zinc-300 text-zinc-800'}`}>
                    {r.code}: {r.usage_percent}% used – {r.current_number}/{r.to_number} – next {r.next_number} {r.is_locked ? '🔒' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-4 flex flex-wrap gap-3 justify-between items-center">
          <div className="flex items-center gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search code, object_type, fiscal_year..." className="w-[320px] border border-zinc-200 rounded-lg px-2.5 py-2 text-[13px] h-[32px] focus:outline-none focus:ring-1 focus:ring-black focus:border-black/10" />
            <span className="text-[11px] text-zinc-500">{activeTab==='ranges' ? `${filtered.length} of ${ranges.length}` : `${assignments.length} assignments`}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-1 rounded-full bg-green-100 border text-green-700">● Editable – not used</span>
            <span className="px-2 py-1 rounded-full bg-zinc-100 border border-zinc-300 text-zinc-800">🔒 Locked – used – only to↑</span>
            <span className="px-2 py-1 rounded-full bg-red-100 border border-red-300 text-red-800">≥90% – nearly exhausted</span>
          </div>
        </div>

        {activeTab === 'ranges' ? (
          <>
            {showForm && (
              <div className="bg-white rounded-2xl shadow-lg border border-zinc-200 p-6 space-y-4">
                <h3 className="font-semibold text-sm">{editing ? `Change ${editing.code}${editing.fiscal_year ? ` FY ${editing.fiscal_year}` : ''} ${editing.is_locked ? `– 🔒 Locked ${editing.usage_percent}% – only to_number increase` : ''}` : 'Create Number Range – Numeric Only – No Prefix – 5-digit to 12-digit configurable'}</h3>
                {editing?.is_locked && (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs">
                    <div className="font-medium text-zinc-800">🔒 Locked – used {editing.used_count} times (current {editing.current_number} &gt; from {editing.from_number}) – {editing.usage_percent}% used – Next {editing.next_number}</div>
                    <div className="text-zinc-700 mt-1">Cannot change code, object_type, from_number – only to_number increase and description allowed. Existing docs {editing.from_number}…{editing.current_number} already generated. To handle exhaustion, increase to_number (e.g., {editing.to_number} → {editing.to_number+10000}) or create new range {editing.code}-NEW and update assignment.</div>
                  </div>
                )}
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">CODE * {editing?.is_locked && <span className="text-amber-600">– locked</span>}</label>
                    <input value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} disabled={!!editing} placeholder="" className={`w-full border-2 rounded-lg px-2.5 py-2 text-[13px] h-[32px] ${editing ? 'bg-zinc-100 border-zinc-200' : 'border-zinc-200'}`} required={!editing} />
                    <p className="text-[10px] text-zinc-400">Unique code – e.g., MAT-RAW-01 for RAW 10000-19999, PO-01 for PO 4500000000-4599999999 – 5 to 12 digit via FROM/TO</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">OBJECT_TYPE * {editing?.is_locked && <span className="text-amber-600">– locked</span>}</label>
                    <select value={form.object_type || ''} onChange={e => setForm({ ...form, object_type: e.target.value })} disabled={!!editing} className={`w-full border-2 rounded-lg px-2.5 py-2 text-[13px] h-[32px] ${editing ? 'bg-zinc-100' : 'border-zinc-200 bg-white'}`} required>
                      <option value="">Select</option>
                      {OBJECT_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <p className="text-[10px] text-zinc-400">ITEM for material, PO/PR/GR/IV etc – purely numeric range</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">FROM_NUMBER * {editing?.is_locked && <span className="text-amber-600">– locked</span>}</label>
                    <input type="number" value={form.from_number || ''} onChange={e => setForm({ ...form, from_number: Number(e.target.value) })} disabled={!!editing?.is_locked} placeholder="" className={`w-full border-2 rounded-lg px-2.5 py-2 text-[13px] h-[32px] ${editing?.is_locked ? 'bg-zinc-100' : 'border-zinc-200'}`} required />
                    <p className="text-[10px] text-zinc-400">Start – numeric – 5-digit: 10000, 12-digit: 100000000000 – you set</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">TO_NUMBER * – {editing?.is_locked ? 'only increase allowed' : 'end'}</label>
                    <input type="number" value={form.to_number || ''} onChange={e => setForm({ ...form, to_number: Number(e.target.value) })} placeholder="" className="w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-[13px] h-[32px]" required />
                    <p className="text-[10px] text-zinc-400">End – must be ≥ current – only increase if locked – 5-digit: 99999, 12-digit: 999999999999 – next {editing ? editing.next_number : (form.current_number || 0)+1}</p>
                  </div>
                  {!editing && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">CURRENT_NUMBER – starts at FROM</label>
                      <input type="number" value={form.current_number || ''} onChange={e => setForm({ ...form, current_number: Number(e.target.value) })} placeholder="" className="w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-[13px] h-[32px]" />
                      <p className="text-[10px] text-zinc-400">Current = from initially – next = current+1</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">FISCAL_YEAR – optional – per code+year locking</label>
                    <input type="number" value={form.fiscal_year || ''} onChange={e => setForm({ ...form, fiscal_year: e.target.value ? Number(e.target.value) : undefined })} placeholder="" className="w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-[13px] h-[32px]" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">DESCRIPTION</label>
                    <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="" rows={2} className="w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-[13px] h-[32px]" />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-3">
                    <button type="submit" className="px-6 py-2.5 rounded-full bg-black text-white text-sm">{editing ? (editing.is_locked ? 'Save – only to_number increase 🔒' : 'Save') : 'Create Range – 5 to 12 digit configurable'}</button>
                    <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 rounded-full border text-xs">Cancel</button>
                  </div>
                </form>
                {message && <div className="text-xs p-3 rounded-xl border bg-zinc-50">{message}</div>}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-4">
              <h3 className="font-semibold text-sm">Ranges – {filtered.length} – Next Available + Locked + Usage % – 5 to 12 digit configurable</h3>
              {loading ? <p className="text-sm text-zinc-500">Loading…</p> : (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="text-[11px] text-zinc-500 border-b">
                      <tr>
                        <th className="text-left py-2">Code</th>
                        <th className="text-left py-2">Object Type</th>
                        <th className="text-left py-2">From</th>
                        <th className="text-left py-2">To</th>
                        <th className="text-left py-2">Current</th>
                        <th className="text-left py-2 bg-zinc-50 px-2">Next</th>
                        <th className="text-left py-2">FY</th>
                        <th className="text-left py-2">Used</th>
                        <th className="text-left py-2">Usage %</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, i) => (
                        <tr key={i} className={`border-b hover:bg-zinc-50 ${r.is_locked ? 'bg-zinc-50/30' : ''} ${(r.usage_percent||0) >= 90 ? 'bg-red-50/50' : (r.usage_percent||0) >= 80 ? 'bg-zinc-50/50' : ''}`}>
                          <td className="py-2 font-mono text-xs font-bold">{r.code}</td>
                          <td className="py-2"><span className="text-[11px] bg-black text-white rounded-full px-2 py-0.5">{r.object_type}</span></td>
                          <td className="py-2 font-mono text-xs">{r.from_number}</td>
                          <td className="py-2 font-mono text-xs">{r.to_number}</td>
                          <td className="py-2 font-mono text-xs">{r.current_number}</td>
                          <td className="py-2 font-mono text-xs font-bold bg-zinc-50 px-2 rounded">
                            <span className="bg-blue-600 text-white rounded-full px-2 py-0.5 text-[11px]">{r.next_number}</span>
                          </td>
                          <td className="py-2 text-xs">{r.fiscal_year || '-'}</td>
                          <td className="py-2 text-xs">{r.used_count}</td>
                          <td className="py-2">
                            <div className="flex items-center gap-1">
                              <div className="w-[40px] h-[6px] bg-zinc-200 rounded-full overflow-hidden">
                                <div className={`h-full ${(r.usage_percent||0) >= 90 ? 'bg-red-500' : (r.usage_percent||0) >= 80 ? 'bg-zinc-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, r.usage_percent||0)}%` }} />
                              </div>
                              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${ (r.usage_percent||0) >= 90 ? 'bg-red-100 text-red-800 border border-red-200' : (r.usage_percent||0) >= 80 ? 'bg-zinc-100 text-zinc-800 border border-zinc-200' : 'bg-zinc-100 text-zinc-600'}`}>{r.usage_percent}%</span>
                            </div>
                          </td>
                          <td className="py-2">
                            {r.is_locked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-300 text-zinc-800 text-[11px]">🔒 Locked – {r.used_count} used</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 border text-green-700 text-[11px]">● Editable</span>
                            )}
                            {(r.usage_percent||0) >= 90 && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 border border-red-300 text-red-700">⚠️ ≥90% – nearly exhausted</span>}
                            {(r.usage_percent||0) >= 80 && (r.usage_percent||0) < 90 && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-300 text-zinc-700">⚠️ ≥80%</span>}
                          </td>
                          <td className="py-2">
                            {r.is_locked ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] px-2 py-1 rounded-full bg-zinc-50 border text-zinc-700">No Delete – only to↑</span>
                                <button onClick={() => handleEdit(r)} className="text-[11px] px-2 py-1 rounded-full border bg-white hover:bg-zinc-50">Edit to↑</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleEdit(r)} className="text-[11px] px-2.5 py-1 rounded-full bg-black text-white">Edit</button>
                                <button onClick={() => handleDelete(r)} className="text-[11px] px-2.5 py-1 rounded-full border bg-white hover:bg-red-50 text-red-600">Delete</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {message && <div className="text-xs p-3 rounded-xl border bg-zinc-50 mt-3">{message}</div>}
            </div>
          </>
        ) : (
          <>
            {showAssignForm && (
              <div className="bg-white rounded-2xl shadow-lg border border-zinc-200 p-6 space-y-4">
                <h3 className="font-semibold text-sm">Create Assignment – Explicit XYZ to Material / YZX to PO – e.g., RAW → MAT-RAW-01 (10000-19999)</h3>
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs">
                  <div className="font-medium">How assignment works:</div>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px] text-zinc-700">
                    <li><b>Material:</b> object_type=ITEM, assignment_key=RAW (material type), number_range_code=MAT-RAW-01 (10000-19999) → when creating material of type RAW, system uses MAT-RAW-01 range → 10001, 10002…</li>
                    <li><b>PO:</b> object_type=PO, assignment_key=1000 (company code), number_range_code=PO-01 (4500000000-4599999999) → PO for company 1000 uses PO-01</li>
                    <li><b>Multiple ranges per type:</b> You can have MAT-RAW-01 (10000-19999) for RAW and MAT-FG-01 (20000-29999) for FINISHED – both ITEM type but different assignment_key</li>
                    <li><b>Exhaustion:</b> If MAT-RAW-01 exhausted (current 19999 &gt; to 19999), system errors – no auto fallback – you must increase to_number to 29999 or create MAT-RAW-02 (20000-29999) and update assignment RAW→MAT-RAW-02</li>
                  </ul>
                </div>
                <form onSubmit={handleCreateAssignment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">OBJECT_TYPE *</label>
                    <select value={assignForm.object_type || ''} onChange={e => setAssignForm({ ...assignForm, object_type: e.target.value })} className="w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-[13px] h-[32px] bg-white" required>
                      <option value="">Select</option>
                      {OBJECT_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">ASSIGNMENT_TYPE</label>
                    <select value={assignForm.assignment_type || ''} onChange={e => setAssignForm({ ...assignForm, assignment_type: e.target.value })} className="w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-[13px] h-[32px] bg-white">
                      {ASSIGNMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">ASSIGNMENT_KEY * – e.g., RAW, FINISHED, 1000, NB</label>
                    <input value={assignForm.assignment_key || ''} onChange={e => setAssignForm({ ...assignForm, assignment_key: e.target.value.toUpperCase() })} placeholder="" className="w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-[13px] h-[32px]" required list="assign-keys" />
                    <datalist id="assign-keys">
                      {MATERIAL_TYPES.map(m => <option key={m} value={m} />)}
                      <option value="1000" />
                      <option value="2000" />
                      <option value="NB" />
                    </datalist>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">NUMBER_RANGE_CODE * – must exist in Ranges tab</label>
                    <select value={assignForm.number_range_code || ''} onChange={e => setAssignForm({ ...assignForm, number_range_code: e.target.value })} className="w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-[13px] h-[32px] bg-white" required>
                      <option value="">Select range code – e.g., MAT-RAW-01</option>
                      {ranges.map(r => <option key={r.code} value={r.code}>{r.code} – {r.object_type} {r.from_number}-{r.to_number} next {r.next_number} {r.usage_percent}% used</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">FISCAL_YEAR – optional</label>
                    <input type="number" value={assignForm.fiscal_year || ''} onChange={e => setAssignForm({ ...assignForm, fiscal_year: e.target.value ? Number(e.target.value) : undefined })} placeholder="" className="w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-[13px] h-[32px]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">DESCRIPTION</label>
                    <input value={assignForm.description || ''} onChange={e => setAssignForm({ ...assignForm, description: e.target.value })} placeholder="" className="w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-[13px] h-[32px]" />
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <button type="submit" className="px-6 py-2.5 rounded-full bg-black text-white text-sm">Create Assignment – XYZ→Material</button>
                    <button type="button" onClick={() => setShowAssignForm(false)} className="px-4 py-2 rounded-full border text-xs">Cancel</button>
                  </div>
                </form>
                {message && <div className="text-xs p-3 rounded-xl border bg-zinc-50">{message}</div>}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-4">
              <h3 className="font-semibold text-sm">Assignments – {assignments.length} – Explicit XYZ to Material / YZX to PO – Multiple ranges per type</h3>
              {loading ? <p className="text-sm text-zinc-500">Loading…</p> : (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="text-[11px] text-zinc-500 border-b">
                      <tr>
                        <th className="text-left py-2">Object Type</th>
                        <th className="text-left py-2">Key (Material Type / Company)</th>
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Range Code →</th>
                        <th className="text-left py-2">From-To</th>
                        <th className="text-left py-2">Current</th>
                        <th className="text-left py-2">Next</th>
                        <th className="text-left py-2">Usage %</th>
                        <th className="text-left py-2">FY</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a, i) => (
                        <tr key={i} className={`border-b hover:bg-zinc-50 ${(a.usage_percent||0) >= 90 ? 'bg-red-50/50' : (a.usage_percent||0) >= 80 ? 'bg-zinc-50/50' : ''}`}>
                          <td className="py-2"><span className="text-[11px] bg-black text-white rounded-full px-2 py-0.5">{a.object_type}</span></td>
                          <td className="py-2 font-mono text-xs font-bold">{a.assignment_key}</td>
                          <td className="py-2 text-[11px]">{a.assignment_type}</td>
                          <td className="py-2 font-mono text-xs font-bold bg-zinc-50 px-2 rounded">{a.number_range_code}</td>
                          <td className="py-2 font-mono text-xs">{a.from_number ? `${a.from_number}-${a.to_number}` : '-'}</td>
                          <td className="py-2 font-mono text-xs">{a.current_number || '-'}</td>
                          <td className="py-2 font-mono text-xs"><span className="bg-blue-600 text-white rounded-full px-2 py-0.5 text-[11px]">{a.next_number || '-'}</span></td>
                          <td className="py-2">
                            {a.usage_percent !== undefined ? (
                              <div className="flex items-center gap-1">
                                <div className="w-[40px] h-[6px] bg-zinc-200 rounded-full overflow-hidden">
                                  <div className={`h-full ${(a.usage_percent||0) >= 90 ? 'bg-red-500' : (a.usage_percent||0) >= 80 ? 'bg-zinc-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, a.usage_percent||0)}%` }} />
                                </div>
                                <span className={`text-[11px] px-1 py-0.5 rounded-full ${ (a.usage_percent||0) >= 90 ? 'bg-red-100 text-red-800 border' : (a.usage_percent||0) >= 80 ? 'bg-zinc-100 text-zinc-800 border' : 'bg-zinc-100'}`}>{a.usage_percent}%</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="py-2 text-xs">{a.fiscal_year || '-'}</td>
                          <td className="py-2">
                            {a.is_locked ? <span className="text-[11px] px-2 py-1 rounded-full bg-zinc-100 border border-zinc-300 text-zinc-800">🔒 Locked – {a.used_count} used</span> : <span className="text-[11px] px-2 py-1 rounded-full bg-green-100 border text-green-700">● Active</span>}
                            {(a.usage_percent||0) >= 90 && <span className="ml-1 text-[10px] px-1 py-0.5 rounded-full bg-red-100 border border-red-300 text-red-700">⚠️ Exhausted soon</span>}
                          </td>
                          <td className="py-2">
                            <button onClick={() => handleDeleteAssignment(a)} className="text-[11px] px-2.5 py-1 rounded-full border bg-white hover:bg-red-50 text-red-600">Delete</button>
                          </td>
                        </tr>
                      ))}
                      {assignments.length === 0 && (
                        <tr><td colSpan={11} className="py-8 text-center text-xs text-zinc-500">No assignments yet – create explicit assignments: e.g., ITEM RAW → MAT-RAW-01 (10000-19999), ITEM FINISHED → MAT-FG-01 (20000-29999), PO 1000 → PO-01 – allows multiple ranges per type – 5 to 12 digit configurable</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {message && <div className="text-xs p-3 rounded-xl border bg-zinc-50 mt-3">{message}</div>}
            </div>

            <div className="bg-zinc-50 rounded-2xl border p-4">
              <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">How assignment works – 5 to 12 digit – exhaustion handling</h4>
              <ul className="text-[11px] text-zinc-600 space-y-1 list-disc pl-4">
                <li><b>XYZ to material:</b> Create range MAT-RAW-01 from 10000 to 19999 (5-digit) for RAW, MAT-FG-01 from 20000 to 29999 for FINISHED – both object_type ITEM – then assign via Assignments tab: ITEM RAW → MAT-RAW-01, ITEM FINISHED → MAT-FG-01 – when creating material type RAW, system uses MAT-RAW-01 → 10001, 10002…</li>
                <li><b>YZX to PO:</b> Create PO-01 4500000000-4599999999 (10-digit) for company 1000, PO-02 4600000000-4699999999 for company 2000 – assign: PO 1000 → PO-01, PO 2000 → PO-02</li>
                <li><b>5-digit to 12-digit configurable:</b> FROM/TO you set – e.g., FROM 10000 TO 99999 = 5-digit, FROM 100000000000 TO 999999999999 = 12-digit – system generates within interval – purely numeric – no prefix</li>
                <li><b>Exhaustion – error_and_extend:</b> If range exhausted (current &gt; to), API returns error – no auto fallback to another range – you must go to Ranges tab and increase to_number (allowed even if locked – e.g., 19999 → 29999) or create new range MAT-RAW-02 20000-29999 and update assignment RAW → MAT-RAW-02</li>
                <li><b>Usage warning:</b> Ranges ≥80% amber, ≥90% red – shown in table – proactive planning</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
