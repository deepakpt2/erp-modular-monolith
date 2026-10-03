"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface NumberRangeItem {
  id: string;
  code: string;
  object_type: string;
  scope_level?: string;
  from_number: number | string;
  to_number: number | string;
  current_number: number | string;
  is_external?: boolean;
  description?: string;
  next_number?: number;
  used_count?: number;
  is_locked?: boolean;
}

export default function PurchasingNumberRangesPage() {
  const params = useParams();
  const companyCode = (params?.companyCode as string) || '1000';

  const [ranges, setRanges] = useState<NumberRangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'INTERVAL' | 'POLICY'>('INTERVAL');

  const [form, setForm] = useState({
    code: '',
    object_type: 'PO',
    scope_level: 'GLOBAL',
    from_number: '',
    to_number: '',
    current_number: '',
    is_external: false,
    description: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const fetchRanges = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/number-ranges?scope_level=GLOBAL`);
      const data = await res.json();
      if (res.ok) {
        // Filter to purchasing objects (PO, PR, RFQ, CONTRACT)
        const allList: NumberRangeItem[] = data.numberRanges || data.data || [];
        const purList = allList.filter((r) => 
          ['PO', 'PR', 'RFQ', 'CONTRACT', 'PURCHASING'].includes(String(r.object_type).toUpperCase()) ||
          (!r.object_type?.includes('FI_DOC') && !r.object_type?.includes('SO') && !r.object_type?.includes('MATERIAL') && r.scope_level === 'GLOBAL')
        );
        setRanges(purList);
      } else {
        setError(data.error || 'Failed to load purchasing number ranges.');
      }
    } catch (e: any) {
      setError(e.message || 'Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanges();
  }, []);

  const calculateExhaustion = (r: NumberRangeItem) => {
    const from = Number(r.from_number) || 0;
    const to = Number(r.to_number) || 0;
    const current = Number(r.current_number) || from;
    const total = to - from + 1;
    const consumed = Math.max(0, current - from);
    const pct = total > 0 ? Math.min(100, Math.round((consumed / total) * 100)) : 0;
    const remaining = Math.max(0, to - current);

    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXHAUSTED' = 'HEALTHY';
    if (pct >= 100) status = 'EXHAUSTED';
    else if (pct >= 90) status = 'CRITICAL';
    else if (pct >= 75) status = 'WARNING';

    return { total, consumed, pct, remaining, status };
  };

  const metrics = useMemo(() => {
    let healthy = 0;
    let warning = 0;
    let critical = 0;
    let exhausted = 0;

    ranges.forEach((r) => {
      const { status } = calculateExhaustion(r);
      if (status === 'HEALTHY') healthy++;
      else if (status === 'WARNING') warning++;
      else if (status === 'CRITICAL') critical++;
      else if (status === 'EXHAUSTED') exhausted++;
    });

    return { total: ranges.length, healthy, warning, critical, exhausted };
  }, [ranges]);

  const filteredRanges = useMemo(() => {
    return ranges.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        r.code.toLowerCase().includes(q) ||
        r.object_type.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q);

      const { status } = calculateExhaustion(r);
      const matchStatus = statusFilter === 'ALL' || status === statusFilter;
      const matchType = typeFilter === 'ALL' || r.object_type === typeFilter;

      return matchQuery && matchStatus && matchType;
    });
  }, [ranges, searchQuery, statusFilter, typeFilter]);

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setForm({
      code: '',
      object_type: 'PO',
      scope_level: 'GLOBAL',
      from_number: '4500000000',
      to_number: '4599999999',
      current_number: '4500000000',
      is_external: false,
      description: 'Standard Purchase Orders (NB)'
    });
    setActiveTab('INTERVAL');
    setShowModal(true);
  };

  const handleOpenEdit = (r: NumberRangeItem) => {
    setIsEditMode(true);
    setForm({
      code: r.code,
      object_type: r.object_type,
      scope_level: r.scope_level || 'GLOBAL',
      from_number: String(r.from_number),
      to_number: String(r.to_number),
      current_number: String(r.current_number),
      is_external: Boolean(r.is_external),
      description: r.description || ''
    });
    setActiveTab('INTERVAL');
    setShowModal(true);
  };

  const handleQuickExpand = async (r: NumberRangeItem) => {
    const newTo = Number(r.to_number) + 100000;
    try {
      const res = await fetch('/api/number-ranges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: r.code,
          object_type: r.object_type,
          scope_level: 'GLOBAL',
          to_number: newTo,
          description: r.description
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Extended interval ${r.code} upper bound to ${newTo}.`);
        fetchRanges();
      } else {
        setError(data.error || 'Failed to expand upper bound.');
      }
    } catch (e: any) {
      setError(e.message || 'Error updating interval.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        object_type: form.object_type,
        scope_level: 'GLOBAL',
        from_number: Number(form.from_number),
        to_number: Number(form.to_number),
        current_number: Number(form.current_number || form.from_number),
        is_external: form.is_external,
        description: form.description
      };

      const res = await fetch('/api/number-ranges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save purchasing number range.');
      }

      setSuccessMsg(`Purchasing Number Range ${payload.code} saved successfully.`);
      setShowModal(false);
      fetchRanges();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
              <Link href={`/${companyCode}/navigator`} className="hover:text-sky-400 transition-colors">
                SPRO Customizing
              </Link>
              <span>/</span>
              <span>Materials Management</span>
              <span>/</span>
              <span>Purchasing</span>
              <span>/</span>
              <span className="text-amber-400 font-semibold">OMH6 / OMH7</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>Define Number Ranges for Purchasing</span>
              <span className="text-xs font-mono bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.5 rounded">
                PNRC / OMH6
              </span>
              <span className="text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                Global (Client-Wide)
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Standard Procurement Configuration: Number ranges for Purchase Orders, Requisitions, RFQs, and Contracts are defined at the Global (Client) level and assigned to purchasing document types in OMEC.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded shadow flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Interval</span>
            </button>
            <Link
              href={`/${companyCode}/fico/document-types`}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded border border-slate-700 transition-colors"
            >
              Document Types
            </Link>
          </div>
        </div>

        {/* Global Scope Notice Card */}
        <div className="bg-sky-950/40 border border-sky-800/60 rounded-lg p-4 text-xs text-sky-200 flex items-start gap-3">
          <div className="p-1.5 bg-sky-900/60 rounded text-sky-400 mt-0.5 font-bold">ℹ️</div>
          <div className="space-y-1">
            <div className="font-semibold text-white">Why are purchasing number ranges independent of Company Code?</div>
            <div className="text-slate-300 leading-relaxed">
              In standard enterprise architecture, Purchasing Organizations execute strategic procurement contracts across multiple legal entities and plants. As a result, document sequences for Purchase Orders (<code className="text-amber-300">45xxxxxxx</code>) and Purchase Requisitions (<code className="text-amber-300">10xxxxxxx</code>) are managed globally to ensure uninterrupted cross-company purchasing workflows.
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div
            onClick={() => setStatusFilter('ALL')}
            className={`cursor-pointer p-4 rounded-lg border transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 border-sky-500 shadow-md'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">All Intervals</div>
            <div className="text-2xl font-bold text-white mt-1">{metrics.total}</div>
            <div className="text-[11px] text-slate-500 mt-1">Purchasing sequences</div>
          </div>

          <div
            onClick={() => setStatusFilter('HEALTHY')}
            className={`cursor-pointer p-4 rounded-lg border transition-all ${
              statusFilter === 'HEALTHY'
                ? 'bg-emerald-950/40 border-emerald-500'
                : 'bg-slate-900/80 border-slate-800 hover:border-emerald-800/40'
            }`}
          >
            <div className="text-xs uppercase tracking-wider text-emerald-400 font-medium">Healthy (&lt;75%)</div>
            <div className="text-2xl font-bold text-emerald-300 mt-1">{metrics.healthy}</div>
            <div className="text-[11px] text-emerald-500/80 mt-1">Sufficient capacity</div>
          </div>

          <div
            onClick={() => setStatusFilter('WARNING')}
            className={`cursor-pointer p-4 rounded-lg border transition-all ${
              statusFilter === 'WARNING'
                ? 'bg-amber-950/40 border-amber-500'
                : 'bg-slate-900/80 border-slate-800 hover:border-amber-800/40'
            }`}
          >
            <div className="text-xs uppercase tracking-wider text-amber-400 font-medium">Warning (75-89%)</div>
            <div className="text-2xl font-bold text-amber-300 mt-1">{metrics.warning}</div>
            <div className="text-[11px] text-amber-500/80 mt-1">Plan extension</div>
          </div>

          <div
            onClick={() => setStatusFilter('CRITICAL')}
            className={`cursor-pointer p-4 rounded-lg border transition-all ${
              statusFilter === 'CRITICAL'
                ? 'bg-orange-950/40 border-orange-500'
                : 'bg-slate-900/80 border-slate-800 hover:border-orange-800/40'
            }`}
          >
            <div className="text-xs uppercase tracking-wider text-orange-400 font-medium">Critical (≥90%)</div>
            <div className="text-2xl font-bold text-orange-300 mt-1">{metrics.critical}</div>
            <div className="text-[11px] text-orange-500/80 mt-1">Action required</div>
          </div>

          <div
            onClick={() => setStatusFilter('EXHAUSTED')}
            className={`cursor-pointer p-4 rounded-lg border transition-all ${
              statusFilter === 'EXHAUSTED'
                ? 'bg-rose-950/40 border-rose-500'
                : 'bg-slate-900/80 border-slate-800 hover:border-rose-800/40'
            }`}
          >
            <div className="text-xs uppercase tracking-wider text-rose-400 font-medium">Exhausted</div>
            <div className="text-2xl font-bold text-rose-300 mt-1">{metrics.exhausted}</div>
            <div className="text-[11px] text-rose-500/80 mt-1">Postings blocked</div>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 bg-rose-950/50 border border-rose-700 text-rose-200 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-xs underline ml-4 hover:text-white">Dismiss</button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-950/50 border border-emerald-700 text-emerald-200 rounded-lg text-sm flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="text-xs underline ml-4 hover:text-white">Dismiss</button>
          </div>
        )}

        {/* Controls Bar */}
        <div className="bg-slate-800/70 p-4 rounded-lg border border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
            <div className="relative flex items-center flex-1 max-w-md">
              <input
              type="text"
              placeholder="Filter by interval No, object type, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded pl-3 pr-8 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-white text-xs font-bold p-1"
                  title="Clear Search"
                >
                  ✕
                </button>
              )}
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Purchasing Objects</option>
              <option value="PO">Purchase Order (PO)</option>
              <option value="PR">Purchase Requisition (PR)</option>
              <option value="RFQ">Request for Quotation (RFQ)</option>
              <option value="CONTRACT">Contract (Outline Agreement)</option>
            </select>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Showing {filteredRanges.length} of {ranges.length} intervals
          </div>
        </div>

        {/* Table View */}
        <div className="bg-slate-800/40 rounded-lg border border-slate-700 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-800/90 text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Object Type</th>
                  <th className="py-3 px-4">From Number</th>
                  <th className="py-3 px-4">To Number</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Remaining / Usage</th>
                  <th className="py-3 px-4 text-center">Ext</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">Loading purchasing intervals...</td>
                  </tr>
                ) : filteredRanges.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      No purchasing intervals found. Click &quot;New Interval&quot; to configure standard procurement numbering.
                    </td>
                  </tr>
                ) : (
                  filteredRanges.map((r) => {
                    const { pct, remaining, status } = calculateExhaustion(r);
                    const isUsed = Number(r.current_number) > Number(r.from_number);

                    return (
                      <tr key={r.id || r.code} className="hover:bg-slate-750/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-700 text-sky-300 rounded font-mono text-xs">
                            {r.code}
                          </span>
                          {isUsed && (
                            <span title="Interval in active use – start locked" className="text-amber-400 text-xs">
                              🔒
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                            {r.object_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{r.from_number}</td>
                        <td className="py-3 px-4 text-slate-300">{r.to_number}</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">{r.current_number}</td>
                        <td className="py-3 px-4 min-w-[180px]">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span>{pct}%</span>
                            <span>{remaining.toLocaleString()} left</span>
                          </div>
                          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                status === 'EXHAUSTED'
                                  ? 'bg-rose-500'
                                  : status === 'CRITICAL'
                                  ? 'bg-orange-500'
                                  : status === 'WARNING'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {r.is_external ? (
                            <span className="text-amber-400 font-bold">X</span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-sans text-xs max-w-xs truncate">
                          {r.description || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(r)}
                              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded transition-colors"
                            >
                              Edit
                            </button>
                            {isUsed && (
                              <button
                                onClick={() => handleQuickExpand(r)}
                                title="Expand upper limit by +100,000"
                                className="px-2 py-1 bg-sky-900/60 hover:bg-sky-800 text-sky-200 text-xs rounded border border-sky-700 transition-colors"
                              >
                                +Expand
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create / Edit Purchasing Number Range */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden my-8">
              <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{isEditMode ? 'Maintain Purchasing Interval' : 'Create Purchasing Number Range'}</span>
                    <span className="text-xs font-mono bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.5 rounded">
                      OMH6
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Client-wide numeric range for procurement documents
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-800 px-6 bg-slate-850">
                <button
                  type="button"
                  onClick={() => setActiveTab('INTERVAL')}
                  className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === 'INTERVAL'
                      ? 'border-sky-500 text-sky-400 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Interval Boundaries
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('POLICY')}
                  className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === 'POLICY'
                      ? 'border-sky-500 text-sky-400 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Procurement Scoping & Policy
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {activeTab === 'INTERVAL' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1">
                          Interval No. <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          disabled={isEditMode}
                          placeholder="e.g. 01, 10, 45"
                          value={form.code}
                          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white uppercase font-mono disabled:opacity-50"
                          required
                        />
                        <span className="text-[10px] text-slate-500">2-character interval identifier</span>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1">
                          Object Type <span className="text-rose-400">*</span>
                        </label>
                        <select
                          disabled={isEditMode}
                          value={form.object_type}
                          onChange={(e) => setForm({ ...form, object_type: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono disabled:opacity-50"
                        >
                          <option value="PO">Purchase Order (PO)</option>
                          <option value="PR">Purchase Requisition (PR)</option>
                          <option value="RFQ">Request for Quotation (RFQ)</option>
                          <option value="CONTRACT">Contract (Outline Agreement)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1">
                          From Number <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          value={form.from_number}
                          onChange={(e) => setForm({ ...form, from_number: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono"
                          required
                        />
                        <span className="text-[10px] text-slate-500">Standard PO starts at 4500000000</span>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1">
                          To Number <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          value={form.to_number}
                          onChange={(e) => setForm({ ...form, to_number: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono"
                          required
                        />
                        <span className="text-[10px] text-slate-500">Upper limit boundary</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1">
                          Current Counter Status
                        </label>
                        <input
                          type="number"
                          value={form.current_number}
                          onChange={(e) => setForm({ ...form, current_number: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono"
                        />
                        <span className="text-[10px] text-slate-500">Defaults to From Number for new ranges</span>
                      </div>

                      <div className="flex flex-col justify-center">
                        <label className="flex items-center gap-2 cursor-pointer pt-3">
                          <input
                            type="checkbox"
                            checked={form.is_external}
                            onChange={(e) => setForm({ ...form, is_external: e.target.checked })}
                            className="rounded border-slate-700 bg-slate-800 text-sky-500 w-4 h-4"
                          />
                          <span className="text-xs font-mono text-slate-300">External Numbering (EXT)</span>
                        </label>
                        <span className="text-[10px] text-slate-500 mt-1">Manual document number entry by buyer</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Description</label>
                      <input
                        type="text"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="e.g. Standard PO interval for domestic purchases"
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-800 rounded border border-slate-700 space-y-2 text-xs">
                      <div className="font-semibold text-white">Scoping Rule: Client-Wide Numbering</div>
                      <p className="text-slate-300 leading-relaxed">
                        Purchasing document number ranges are client-wide. You do not bind these intervals to individual company codes or plants at creation time.
                      </p>
                      <p className="text-slate-300 leading-relaxed">
                        To activate this interval for transactions, navigate to <strong className="text-sky-400">Purchasing Document Types (OMEC)</strong> and assign this interval number to the document type (e.g. <code className="text-amber-300">NB</code> Standard PO, <code className="text-amber-300">UB</code> Stock Transport Order).
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !form.code || !form.from_number || !form.to_number}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded shadow disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
