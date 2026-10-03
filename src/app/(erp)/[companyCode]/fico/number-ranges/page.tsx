"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DbAutocomplete } from '@/shared/ui/db-autocomplete';

interface NumberRange {
  id?: string;
  code: string;
  object_type: string;
  company_code?: string;
  fiscal_year?: number | null;
  from_number: number;
  to_number: number;
  current_number: number;
  next_number?: number;
  remaining_count?: number;
  capacity?: number;
  usage_percent?: number;
  exhaustion_status?: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXHAUSTED';
  is_external?: boolean;
  is_buffered?: boolean;
  description?: string;
  used_count?: number;
  is_used?: boolean;
  is_locked?: boolean;
}



export default function NumberRangesPage() {
  const params = useParams();
  const companyCode = (params.companyCode as string) || '1000';

  const [ranges, setRanges] = useState<NumberRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterObj, setFilterObj] = useState('ALL');
  const [filterExhaustion, setFilterExhaustion] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NumberRange | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Form state conforming strictly to FBN1 / NRIV
  const [form, setForm] = useState<{
    code: string;
    company_code: string;
    fiscal_year: string;
    object_type: string;
    from_number: string;
    to_number: string;
    current_number: string;
    is_external: boolean;
    description: string;
  }>({
    code: '',
    company_code: '',
    fiscal_year: '2026',
    object_type: 'FI_DOC',
    from_number: '0100000000',
    to_number: '0199999999',
    current_number: '0100000000',
    is_external: false,
    description: '',
  });

  const fetchRanges = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/number-ranges');
      const j = await res.json();
      const list = j.data || j.numberRanges || [];
      setRanges(Array.isArray(list) ? list : []);
    } catch (e: any) {
      console.error(e);
      setRanges([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRanges();
  }, []);

  const filtered = useMemo(() => {
    return ranges.filter(r => {
      const matchesSearch = !search ||
        (r.code || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.object_type || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(search.toLowerCase()) ||
        String(r.fiscal_year || '').includes(search) ||
        (r.company_code || '').toLowerCase().includes(search.toLowerCase());

      const matchesObj = true;
      const matchesExhaustion = filterExhaustion === 'ALL' || r.exhaustion_status === filterExhaustion;

      return matchesSearch && matchesObj && matchesExhaustion;
    });
  }, [ranges, search, filterExhaustion]);

  // Exhaustion metrics
  const exhaustedCount = ranges.filter(r => r.exhaustion_status === 'EXHAUSTED').length;
  const criticalCount = ranges.filter(r => r.exhaustion_status === 'CRITICAL').length;
  const warningCount = ranges.filter(r => r.exhaustion_status === 'WARNING').length;
  const healthyCount = ranges.filter(r => r.exhaustion_status === 'HEALTHY' || !r.exhaustion_status).length;

  const handleEdit = (r: NumberRange) => {
    setEditing(r);
    setForm({
      code: r.code,
      company_code: r.company_code || companyCode,
      fiscal_year: r.fiscal_year ? String(r.fiscal_year) : '',
      object_type: r.object_type || 'FI_DOC',
      from_number: String(r.from_number),
      to_number: String(r.to_number),
      current_number: String(r.current_number),
      is_external: !!r.is_external,
      description: r.description || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const fromNum = parseInt(form.from_number, 10);
    const toNum = parseInt(form.to_number, 10);
    const currNum = parseInt(form.current_number || form.from_number, 10);
    const fYear = form.fiscal_year ? parseInt(form.fiscal_year, 10) : null;

    if (isNaN(fromNum) || isNaN(toNum)) {
      setMessage('❌ From Number and To Number must be numeric values.');
      return;
    }

    if (toNum < fromNum) {
      setMessage('❌ To Number cannot be less than From Number.');
      return;
    }

    const payload = {
      code: form.code.toUpperCase().trim(),
      company_code: form.company_code.toUpperCase().trim(),
      fiscal_year: fYear,
      object_type: form.object_type.toUpperCase().trim(),
      from_number: fromNum,
      to_number: toNum,
      current_number: currNum,
      is_external: form.is_external,
      description: form.description,
    };

    try {
      const res = await fetch('/api/number-ranges', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save number range');

      setMessage(`✅ Number range ${payload.code} ${editing ? 'updated' : 'created'} successfully.`);
      setShowForm(false);
      setEditing(null);
      fetchRanges();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  const handleDelete = async (r: NumberRange) => {
    if (r.is_locked || (r.used_count || 0) > 0) {
      setMessage(`🔒 Range ${r.code} has already been used (${r.used_count} numbers consumed). Deletion is blocked to preserve statutory document continuity.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete unused number range ${r.code}?`)) return;

    try {
      const res = await fetch(`/api/number-ranges?id=${r.id || r.code}&code=${r.code}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      setMessage(`✅ Number range ${r.code} deleted.`);
      fetchRanges();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] p-4 sm:p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-black text-white tracking-widest">FNRC</span>
              <span className="text-xs font-mono px-2 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-500">FBN1</span>
              <span className="text-xs bg-zinc-100 border border-zinc-200 rounded-full px-2.5 py-1 text-zinc-600 font-mono">{ranges.length} ranges</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Link href={`/${companyCode}/navigator`} className="h-7 px-3 rounded-full border border-zinc-200 text-xs bg-white hover:bg-zinc-50 inline-flex items-center font-medium">Navigator</Link>
              <Link href={`/${companyCode}/fico/document-types`} className="h-7 px-3 rounded-full border border-zinc-200 text-xs bg-white hover:bg-zinc-50 inline-flex items-center">Doc Types</Link>
            </div>
          </div>
          <h1 className="text-lg font-semibold mt-3 tracking-tight">Number Range Intervals – Accounting Documents</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Industry Standard Configuration: Maintain number range intervals for accounting documents and transaction objects. Controls sequential numbering, fiscal year dependency, and internal vs. external numbering.
          </p>

          {/* Quick Metrics Bar with Live Exhaustion Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-zinc-100">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider">Healthy (&lt;75%)</div>
              <div className="text-xl font-bold font-mono text-emerald-900 mt-1">{healthyCount}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Ample capacity remaining</div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[11px] font-medium text-amber-800 uppercase tracking-wider">Warning (75%–89%)</div>
              <div className="text-xl font-bold font-mono text-amber-900 mt-1">{warningCount}</div>
              <div className="text-[10px] text-amber-600 mt-0.5">Plan expansion or new FY</div>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[11px] font-medium text-orange-800 uppercase tracking-wider">Critical (≥90%)</div>
              <div className="text-xl font-bold font-mono text-orange-900 mt-1">{criticalCount}</div>
              <div className="text-[10px] text-orange-600 mt-0.5">Near exhaustion threshold</div>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[11px] font-medium text-rose-800 uppercase tracking-wider">Exhausted (100%)</div>
              <div className="text-xl font-bold font-mono text-rose-900 mt-1">{exhaustedCount}</div>
              <div className="text-[10px] text-rose-600 mt-0.5">Postings blocked if hit</div>
            </div>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter by Range No, FY, or Company Code..."
                className="border border-zinc-200 rounded-lg pl-3 pr-8 py-1.5 text-xs w-64 focus:outline-none focus:ring-1 focus:ring-black"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 text-zinc-400 hover:text-zinc-700 text-xs font-bold p-1"
                  title="Clear Search"
                >
                  ✕
                </button>
              )}
            </div>
            
            <select
              value={filterExhaustion}
              onChange={e => setFilterExhaustion(e.target.value)}
              className="border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none"
            >
              <option value="ALL">All Exhaustion States</option>
              <option value="HEALTHY">Healthy Only</option>
              <option value="WARNING">Warning (≥75%)</option>
              <option value="CRITICAL">Critical (≥90%)</option>
              <option value="EXHAUSTED">Exhausted</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm({
                code: '',
                company_code: '',
                fiscal_year: '2026',
                object_type: 'FI_DOC',
                from_number: '',
                to_number: '',
                current_number: '',
                is_external: false,
                description: '',
              });
              setShowForm(!showForm);
            }}
            className="h-8 px-4 rounded-full bg-black text-white text-xs font-medium hover:bg-zinc-800 transition inline-flex items-center justify-center shrink-0"
          >
            {showForm ? 'Close Form' : '+ Add Number Range'}
          </button>
        </div>

        {/* Modal / Inline Standard Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-semibold text-sm">
                {editing ? `Edit Number Range Interval – ${editing.code}` : 'Maintain Number Range Interval'}
              </h3>
              <span className="text-xs text-zinc-400 font-mono">Standard Specification</span>
            </div>

            {editing?.is_locked && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                <div className="font-bold">🔒 Range in Active Consumption ({editing.used_count} numbers used)</div>
                <div>In accordance with standard accounting control rules, the starting number, object type, and company code are locked. You may increase the upper limit (To Number) or update notes.</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-600 block">
                  NUMBER_RANGE_NO * {editing && <span className="text-zinc-400 font-normal">(Locked)</span>}
                </label>
                <input
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  disabled={!!editing}
                  placeholder="e.g. 01, 10, 50, RE"
                  className={`w-full border rounded-lg px-3 py-2 text-sm min-h-[2.5rem] focus:outline-none uppercase ${editing ? 'bg-zinc-100 border-zinc-200' : 'border-zinc-200 focus:border-black'}`}
                  required
                />
                <p className="text-[11px] text-zinc-400">2-character interval identifier (e.g. 01 for General Journal)</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-600 block">
                  COMPANY_CODE
                </label>
                <DbAutocomplete
                  label=""
                  apiUrl="/api/legal-entities"
                  dataKey="legalEntities"
                  codeField="code"
                  value={form.company_code}
                  onChange={v => setForm({ ...form, company_code: v })}
                  placeholder="Select Company Code"
                  className="w-full"
                />
                <p className="text-[11px] text-zinc-400">Optional: binds interval to specific statutory legal entity</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-600 block">
                  FISCAL_YEAR
                </label>
                <input
                  type="number"
                  value={form.fiscal_year}
                  onChange={e => setForm({ ...form, fiscal_year: e.target.value })}
                  placeholder="e.g. 2026 or 9999"
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm min-h-[2.5rem] focus:outline-none focus:border-black"
                />
                <p className="text-[11px] text-zinc-400">Leave blank or 9999 for non-year-dependent cumulative numbering</p>
              </div>

              

              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-600 block">
                  FROM_NUMBER * {editing?.is_locked && <span className="text-zinc-400 font-normal">(Locked)</span>}
                </label>
                <input
                  value={form.from_number}
                  onChange={e => setForm({ ...form, from_number: e.target.value })}
                  disabled={!!editing?.is_locked}
                  placeholder="e.g. 0100000000"
                  className={`w-full border rounded-lg px-3 py-2 text-sm font-mono min-h-[2.5rem] focus:outline-none ${editing?.is_locked ? 'bg-zinc-100 border-zinc-200' : 'border-zinc-200 focus:border-black'}`}
                  required
                />
                <p className="text-[11px] text-zinc-400">Starting numeric boundary (10-digit standard)</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-600 block">
                  TO_NUMBER * {editing?.is_locked && <span className="text-emerald-600 font-normal">(Expandable)</span>}
                </label>
                <input
                  value={form.to_number}
                  onChange={e => setForm({ ...form, to_number: e.target.value })}
                  placeholder="e.g. 0199999999"
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono min-h-[2.5rem] focus:outline-none focus:border-black"
                  required
                />
                <p className="text-[11px] text-zinc-400">Ending numeric boundary – can be increased when near exhaustion</p>
              </div>

              {!editing && (
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-zinc-600 block">
                    CURRENT_STATUS (Initial Number)
                  </label>
                  <input
                    value={form.current_number}
                    onChange={e => setForm({ ...form, current_number: e.target.value })}
                    placeholder="Defaults to From Number"
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono min-h-[2.5rem] focus:outline-none focus:border-black"
                  />
                  <p className="text-[11px] text-zinc-400">Starting counter status – leave blank to start at From Number</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-600 block">
                  NUMBERING_TYPE (EXT)
                </label>
                <select
                  value={form.is_external ? 'true' : 'false'}
                  onChange={e => setForm({ ...form, is_external: e.target.value === 'true' })}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm min-h-[2.5rem] focus:outline-none bg-white focus:border-black"
                >
                  <option value="false">Internal (System Generated)</option>
                  <option value="true">External (Manual Document Numbering)</option>
                </select>
                <p className="text-[11px] text-zinc-400">External requires manual entry on transaction posting</p>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-600 block">
                  DESCRIPTION
                </label>
                <input
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. General Ledger Postings (SA) for Fiscal Year 2026"
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm min-h-[2.5rem] focus:outline-none focus:border-black"
                />
              </div>

              <div className="md:col-span-3 flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="h-9 px-6 rounded-full bg-black text-white text-xs font-medium hover:bg-zinc-800 transition"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="h-9 px-4 rounded-full border border-zinc-200 text-xs font-medium hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {message && (
          <div className="text-xs p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800">
            {message}
          </div>
        )}

        {/* Master Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Number Range Intervals ({filtered.length})</h3>
            <span className="text-xs text-zinc-400">FBN1 / NRIV Parity</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-400">Loading number range intervals...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">No number ranges found. Click "+ Add Number Range" to create one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50/75 border-b border-zinc-200 text-zinc-500 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">No.</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">FY</th>
                    <th className="py-2.5 px-3">From Number</th>
                    <th className="py-2.5 px-3">To Number</th>
                    <th className="py-2.5 px-3">Current Status</th>
                    <th className="py-2.5 px-3">Ext</th>
                    <th className="py-2.5 px-3">Exhaustion Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtered.map((r, idx) => {
                    const usagePct = r.usage_percent || 0;
                    const isExhausted = r.exhaustion_status === 'EXHAUSTED';
                    const isCritical = r.exhaustion_status === 'CRITICAL';
                    const isWarning = r.exhaustion_status === 'WARNING';

                    let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    let barColor = 'bg-emerald-500';
                    if (isExhausted) {
                      badgeColor = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
                      barColor = 'bg-rose-600';
                    } else if (isCritical) {
                      badgeColor = 'bg-orange-100 text-orange-800 border-orange-300 font-medium';
                      barColor = 'bg-orange-500';
                    } else if (isWarning) {
                      badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
                      barColor = 'bg-amber-500';
                    }

                    return (
                      <tr key={r.id || `${r.code}-${idx}`} className="hover:bg-zinc-50/75 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-zinc-900">{r.code}</td>
                        <td className="py-2.5 px-3 font-mono text-zinc-600">{r.company_code || 'ALL'}</td>
                        <td className="py-2.5 px-3 font-mono text-zinc-600">{r.fiscal_year || '9999'}</td>
                        
                        <td className="py-2.5 px-3 font-mono text-zinc-600">{r.from_number}</td>
                        <td className="py-2.5 px-3 font-mono text-zinc-600">{r.to_number}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-zinc-900">
                          {r.current_number || r.from_number}
                          {r.is_used && <span className="ml-1 text-[10px] text-zinc-400" title="Consumed numbers">({r.used_count})</span>}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {r.is_external ? (
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[10px]" title="External numbering">X</span>
                          ) : (
                            <span className="text-zinc-300 font-mono">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="space-y-1 min-w-[140px]">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] ${badgeColor}`}>
                                {isExhausted ? '100% EXHAUSTED' : isCritical ? `CRITICAL (${usagePct}%)` : isWarning ? `WARNING (${usagePct}%)` : `HEALTHY (${usagePct}%)`}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {r.remaining_count !== undefined ? `${r.remaining_count.toLocaleString()} left` : ''}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${barColor} transition-all duration-300`}
                                style={{ width: `${Math.min(usagePct, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEdit(r)}
                              className="px-2.5 py-1 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-[11px] font-medium"
                            >
                              {r.is_locked ? 'Expand' : 'Edit'}
                            </button>
                            {!r.is_locked && (r.used_count || 0) === 0 && (
                              <button
                                type="button"
                                onClick={() => handleDelete(r)}
                                className="px-2 py-1 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px]"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
