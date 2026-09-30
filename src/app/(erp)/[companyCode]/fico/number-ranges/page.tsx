"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface NumberRange {
  id?: string;
  code: string;
  object_type: string;
  prefix?: string;
  from_number: number;
  to_number: number;
  current_number: number;
  next_number?: number;
  fiscal_year?: number | null;
  description?: string;
  used_count?: number;
  is_used?: boolean;
  is_locked?: boolean;
}

const OBJECT_TYPES = ['ITEM','MATERIAL','PARTNER','LOT','PR','PO','GR','IV','SO','DL','BL','STO','PI','PROD_ORDER','MRP','FI_DOC','BILLING','DELIVERY','EMPLOYEE','ASSET_POSTING','CLOSING','FX_VALUATION','RESERVATION','SERIAL'];

const SAP_DEFAULTS: Record<string, { from: number, to: number }> = {
  'ITEM': { from: 10000000, to: 19999999 },
  'MATERIAL': { from: 10000000, to: 19999999 },
  'MAT': { from: 10000000, to: 19999999 },
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
  const [ranges, setRanges] = useState<NumberRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<NumberRange>>({ code: '', object_type: 'ITEM', from_number: 10000000, to_number: 19999999, current_number: 10000000, fiscal_year: undefined, description: '' });
  const [editing, setEditing] = useState<NumberRange | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchRanges = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/number-ranges');
      const j = await res.json();
      const data = j.data || j.numberRanges || [];
      // Enrich
      const enriched = data.map((r: any) => ({
        ...r,
        from_number: Number(r.from_number),
        to_number: Number(r.to_number),
        current_number: Number(r.current_number),
        next_number: Number(r.current_number) + 1,
        used_count: Number(r.current_number) - Number(r.from_number),
        is_used: Number(r.current_number) > Number(r.from_number),
        is_locked: Number(r.current_number) > Number(r.from_number),
        prefix: '', // SAP standard – no prefix
      }));
      setRanges(enriched);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchRanges(); }, []);

  useEffect(() => {
    if (form.object_type) {
      const def = SAP_DEFAULTS[form.object_type.toUpperCase()];
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
        prefix: '', // SAP – no prefix
      };
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch('/api/number-ranges', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { id: editing.id, code: editing.code, to_number: form.to_number, description: form.description, fiscal_year: editing.fiscal_year } : payload) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setMessage(`✅ ${editing ? 'Updated' : 'Created'} ${j.numberRange?.code || payload.code} – next ${j.numberRange?.next_number || j.next_number || (Number(payload.current_number || 0)+1)} – SAP numeric`);
      setShowForm(false);
      setEditing(null);
      setForm({ code: '', object_type: 'ITEM', from_number: 10000000, to_number: 19999999, current_number: 10000000, fiscal_year: undefined, description: '' });
      fetchRanges();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  const handleEdit = (r: NumberRange) => {
    if (r.is_locked) {
      setMessage(`🔒 Range ${r.code}${r.fiscal_year ? ` FY ${r.fiscal_year}` : ''} already used ${r.used_count} times (current ${r.current_number} > from ${r.from_number}), locked – SAP-like – only to_number increase and description allowed. Next available ${r.next_number}.`);
    }
    setEditing(r);
    setForm({ code: r.code, object_type: r.object_type, from_number: r.from_number, to_number: r.to_number, current_number: r.current_number, fiscal_year: r.fiscal_year || undefined, description: r.description });
    setShowForm(true);
  };

  const handleDelete = async (r: NumberRange) => {
    if (r.is_locked) {
      setMessage(`🔒 Cannot delete ${r.code} – used ${r.used_count} times – next ${r.next_number} – SAP locked – keep for audit. Create new range ${r.code}-NEW instead.`);
      return;
    }
    if (!confirm(`Delete range ${r.code}${r.fiscal_year ? ` FY ${r.fiscal_year}` : ''}? Only allowed if not used (current == from).`)) return;
    try {
      const url = r.fiscal_year ? `/api/number-ranges?code=${r.code}&fiscal_year=${r.fiscal_year}` : `/api/number-ranges?code=${r.code}`;
      const res = await fetch(url, { method: 'DELETE' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setMessage(`✅ Deleted ${r.code} – was not used yet`);
      fetchRanges();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Header – SAP-like FBN1 */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-black text-white">FNRC</span>
              <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-zinc-100 border text-zinc-500">FBN1</span>
              <span className="text-[11px] bg-zinc-100 border rounded-full px-2.5 py-1 text-zinc-600">{ranges.length} ranges • {lockedCount} locked 🔒 • {totalUsed} numbers used</span>
              <span className="text-[10px] bg-green-50 border border-green-200 rounded-full px-2 py-1 text-green-700">SAP STANDARD – numeric – no prefix</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${companyCode}/navigator`} className="px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50">🌳 Navigator</Link>
              <Link href={`/${companyCode}/fico/document-types`} className="px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50">OBA7 Doc Types</Link>
              <button onClick={() => { setEditing(null); setForm({ code: '', object_type: 'ITEM', from_number: 10000000, to_number: 19999999, current_number: 10000000, fiscal_year: undefined, description: '' }); setShowForm(!showForm); }} className="px-4 py-1.5 rounded-full bg-black text-white text-xs font-medium">+ New Range</button>
            </div>
          </div>
          <h1 className="text-xl font-bold mt-3 tracking-tight">Number Ranges – FNRC (FBN1) – SAP Standard</h1>
          <p className="text-sm text-zinc-500 mt-1">Company <b>{companyCode}</b> – SAP standard purely numeric intervals – no prefix – From/To/Current numeric – Next available = Current+1 shown like SAP FBN1 – Locked 🔒 if current &gt; from – cannot edit/delete if used – per code+year locking</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-zinc-50 rounded-xl border p-3">
              <div className="text-[10px] uppercase text-zinc-500">SAP Numbering</div>
              <div className="text-xs font-medium mt-1">Purely numeric – no prefix – e.g., PO 4500000000 not PO-4500000000</div>
            </div>
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-3">
              <div className="text-[10px] uppercase text-blue-600">Next Available – SAP FBN1</div>
              <div className="text-xs font-medium mt-1">Current+1 displayed – e.g., current 4500000000 → next 4500000001 – like SAP</div>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-3">
              <div className="text-[10px] uppercase text-amber-700">Locked 🔒 Badge</div>
              <div className="text-xs font-medium mt-1">If used (current &gt; from), show 🔒 Locked + used count instead of Edit/Delete – SAP audit</div>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-3">
              <div className="text-[10px] uppercase text-green-700">Per Code+Year</div>
              <div className="text-xs font-medium mt-1">Lock per code+year – PO-01 FY2026 locked only if 2026 used – FY2025 still editable</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-4 flex flex-wrap gap-3 justify-between items-center">
          <div className="flex items-center gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search code, object_type, fiscal_year..." className="w-[320px] border-2 border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10" />
            <span className="text-[11px] text-zinc-500">{filtered.length} of {ranges.length}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-1 rounded-full bg-green-100 border text-green-700">● Editable – not used yet</span>
            <span className="px-2 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800">🔒 Locked – used – no edit/delete</span>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-zinc-200 p-6 space-y-4">
            <h3 className="font-semibold text-sm">{editing ? `Change ${editing.code}${editing.fiscal_year ? ` FY ${editing.fiscal_year}` : ''} ${editing.is_locked ? '– 🔒 Locked – only to_number increase allowed – SAP' : ''}` : 'Create Number Range – SAP Standard – Numeric Only – No Prefix'}</h3>
            {editing?.is_locked && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs">
                <div className="font-medium text-amber-800">🔒 Range Locked – SAP-like – already used {editing.used_count} times (current {editing.current_number} &gt; from {editing.from_number}) – Next available {editing.next_number}</div>
                <div className="text-amber-700 mt-1">Cannot change code, object_type, from_number – prefix not used in SAP – only to_number increase and description allowed. Existing docs {editing.from_number}…{editing.current_number} already generated. Create new range {editing.code}-NEW if need new interval.</div>
              </div>
            )}
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">NUMBER_RANGE_CODE * {editing?.is_locked && <span className="text-amber-600">– locked cannot change</span>}</label>
                <input value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} disabled={!!editing} placeholder="e.g., ITEM-01, PO-01, PR-01" className={`w-full border-2 rounded-xl px-3 py-2.5 text-sm ${editing ? 'bg-zinc-100 border-zinc-200 text-zinc-500' : 'border-zinc-200 focus:ring-2 focus:ring-black/10'}`} required={!editing} />
                <p className="text-[10px] text-zinc-400">SAP: code like ITEM-01, PO-01 – unique per interval</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">OBJECT_TYPE * {editing?.is_locked && <span className="text-amber-600">– locked</span>}</label>
                <select value={form.object_type || ''} onChange={e => setForm({ ...form, object_type: e.target.value })} disabled={!!editing} className={`w-full border-2 rounded-xl px-3 py-2.5 text-sm ${editing ? 'bg-zinc-100 border-zinc-200' : 'border-zinc-200 bg-white'}`} required>
                  <option value="">Select Object Type</option>
                  {OBJECT_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <p className="text-[10px] text-zinc-400">SAP: ITEM for material, PO/PR/GR/IV/SO etc – purely numeric range</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">FROM_NUMBER * {editing?.is_locked && <span className="text-amber-600">– locked cannot change</span>}</label>
                <input type="number" value={form.from_number || ''} onChange={e => setForm({ ...form, from_number: Number(e.target.value) })} disabled={!!editing?.is_locked} placeholder="e.g., 10000000" className={`w-full border-2 rounded-xl px-3 py-2.5 text-sm ${editing?.is_locked ? 'bg-zinc-100 border-zinc-200' : 'border-zinc-200'}`} required />
                <p className="text-[10px] text-zinc-400">SAP FBN1: start of interval – numeric only – no prefix</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">TO_NUMBER * – {editing?.is_locked ? 'only increase allowed – SAP' : 'end of interval'}</label>
                <input type="number" value={form.to_number || ''} onChange={e => setForm({ ...form, to_number: Number(e.target.value) })} placeholder="e.g., 19999999" className="w-full border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm" required />
                <p className="text-[10px] text-zinc-400">SAP: end of interval – must be &gt;= current – only increase if locked – next {editing ? editing.next_number : (form.current_number || 0)+1}</p>
              </div>
              {!editing && (
                <div className="space-y-1">
                  <label className="text-xs font-medium">CURRENT_NUMBER – starts at FROM</label>
                  <input type="number" value={form.current_number || ''} onChange={e => setForm({ ...form, current_number: Number(e.target.value) })} placeholder="e.g., 10000000" className="w-full border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm" />
                  <p className="text-[10px] text-zinc-400">SAP: current = from initially – next = current+1 = {Number(form.current_number||0)+1}</p>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium">FISCAL_YEAR – optional – per code+year locking</label>
                <input type="number" value={form.fiscal_year || ''} onChange={e => setForm({ ...form, fiscal_year: e.target.value ? Number(e.target.value) : undefined })} placeholder="e.g., 2026 – leave blank for year-independent" className="w-full border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm" />
                <p className="text-[10px] text-zinc-400">SAP: fiscal year dependent ranges – e.g., PO-01 FY2026 vs FY2025 – lock per year</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium">DESCRIPTION</label>
                <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g., Material numbering – SAP standard numeric 8-digit – no prefix" rows={2} className="w-full border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <button type="submit" className="px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-zinc-800">{editing ? (editing.is_locked ? 'Save – only to_number increase allowed 🔒' : 'Save Changes') : 'Create Range – SAP Numeric'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 rounded-full border text-xs">Cancel</button>
                {!editing && <span className="text-[11px] text-zinc-400">SAP standard – no prefix – purely numeric – next = current+1 displayed like FBN1</span>}
              </div>
            </form>
            {message && <div className="text-xs p-3 rounded-xl border bg-zinc-50">{message}</div>}
          </div>
        )}

        {/* Table – SAP-like FBN1 with next number and locked badge */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-4">
          <h3 className="font-semibold text-sm">Number Ranges – {filtered.length} – SAP FBN1 Style – Next Available + Locked Badge</h3>
          {loading ? <p className="text-sm text-zinc-500">Loading…</p> : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-[11px] text-zinc-500 border-b">
                  <tr>
                    <th className="text-left py-2">Range Code</th>
                    <th className="text-left py-2">Object Type</th>
                    <th className="text-left py-2">From</th>
                    <th className="text-left py-2">To</th>
                    <th className="text-left py-2">Current</th>
                    <th className="text-left py-2 bg-blue-50 px-2">Next Available – SAP FBN1</th>
                    <th className="text-left py-2">FY</th>
                    <th className="text-left py-2">Used</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={i} className={`border-b hover:bg-zinc-50 ${r.is_locked ? 'bg-amber-50/30' : ''}`}>
                      <td className="py-2 font-mono text-xs font-bold">{r.code}</td>
                      <td className="py-2"><span className="text-[11px] bg-black text-white rounded-full px-2 py-0.5">{r.object_type}</span></td>
                      <td className="py-2 font-mono text-xs">{r.from_number}</td>
                      <td className="py-2 font-mono text-xs">{r.to_number}</td>
                      <td className="py-2 font-mono text-xs">{r.current_number}</td>
                      <td className="py-2 font-mono text-xs font-bold bg-blue-50 px-2 rounded">
                        <span className="bg-blue-600 text-white rounded-full px-2 py-0.5 text-[11px]">{r.next_number}</span>
                        <span className="ml-1 text-[10px] text-blue-600">← SAP next</span>
                      </td>
                      <td className="py-2 text-xs">{r.fiscal_year || '-'}</td>
                      <td className="py-2 text-xs">{r.used_count} {r.used_count! > 0 ? `(${r.from_number}→${r.current_number})` : ''}</td>
                      <td className="py-2">
                        {r.is_locked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[11px] font-medium" title={`Used ${r.used_count} times – current ${r.current_number} > from ${r.from_number} – locked – SAP`}>
                            🔒 Locked – {r.used_count} used – next {r.next_number}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 border border-green-200 text-green-700 text-[11px]">● Editable – not used – next {r.next_number}</span>
                        )}
                      </td>
                      <td className="py-2">
                        {r.is_locked ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">🔒 No Edit/Delete – SAP audit – only to↑</span>
                            <button onClick={() => handleEdit(r)} className="text-[11px] px-2 py-1 rounded-full border bg-white hover:bg-amber-50" title="Only to_number increase allowed when locked">Edit to↑</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEdit(r)} className="text-[11px] px-2.5 py-1 rounded-full bg-black text-white hover:bg-zinc-800">Edit</button>
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

        <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
          <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">SAP Standard – FNRC/FBN1 – Implementation Notes</h4>
          <ul className="text-[11px] text-zinc-600 space-y-1 list-disc pl-4">
            <li><b>No prefix</b> – SAP FBN1/SNRO does not store prefix in number range – interval is purely numeric – e.g., PO 4500000000 not PO-4500000000 – document type may add prefix via config, but range itself numeric</li>
            <li><b>Next available number</b> – shown in FNRC page like SAP – Current+1 – e.g., current 4500000000 → next 4500000001 – highlighted in blue badge</li>
            <li><b>Locked badge 🔒</b> – instead of Edit/Delete buttons when used – if current &gt; from (e.g., 100002 &gt; 100000 → 2 used) → show 🔒 Locked – {used_count} used – next {next_number} – no delete, only to_number increase</li>
            <li><b>Per code+year locking</b> – PO-01 FY2026 locked only if 2026 used, FY2025 still editable – like SAP fiscal year dependent intervals</li>
            <li><b>Delete blocked if used</b> – SAP audit – keep for audit trail – create new range ITEM-02 instead of deleting used ITEM-01</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
