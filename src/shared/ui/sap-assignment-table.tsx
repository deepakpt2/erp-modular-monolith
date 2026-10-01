"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DbAutocomplete } from './db-autocomplete';

export interface ColumnDef {
  key: string;
  label: string;
  type?: 'text' | 'autocomplete';
  apiUrl?: string;
  dataKey?: string;
  codeField?: string;
  required?: boolean;
  readOnlyOnEdit?: boolean;
  placeholder?: string;
}

interface SapAssignmentTableProps {
  code: string;
  sapAlias: string;
  title: string;
  description: string;
  apiEndpoint: string;
  columns: ColumnDef[];
  primaryKeys: string[]; // e.g. ['company_code'] or ['plant_code', 'company_code']
  companyCode: string;
  relatedLinks?: { code: string; label: string; route: string; description?: string }[];
}

export function SapAssignmentTable({
  code,
  sapAlias,
  title,
  description,
  apiEndpoint,
  columns,
  primaryKeys,
  companyCode,
  relatedLinks = []
}: SapAssignmentTableProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRowForm, setNewRowForm] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiEndpoint);
      const json = await res.json();
      setItems(json.data || []);
    } catch (e: any) {
      setMessage({ type: 'error', text: `Failed to load data: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [apiEndpoint]);

  const handleStartEdit = (index: number) => {
    setEditingRowIndex(index);
    setEditForm({ ...items[index] });
    setIsAddingNew(false);
    setMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingRowIndex(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    setMessage(null);
    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');
      setMessage({ type: 'success', text: json.message || 'Assignment updated successfully.' });
      setEditingRowIndex(null);
      fetchItems();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  const handleAddNewRow = () => {
    const blank: Record<string, any> = {};
    columns.forEach(col => { blank[col.key] = ''; });
    setNewRowForm(blank);
    setIsAddingNew(true);
    setEditingRowIndex(null);
    setMessage(null);
  };

  const handleCancelNew = () => {
    setIsAddingNew(false);
    setNewRowForm({});
  };

  const handleSaveNew = async () => {
    setMessage(null);
    try {
      // Validate required
      for (const col of columns) {
        if (col.required && !newRowForm[col.key]) {
          setMessage({ type: 'error', text: `${col.label} is required.` });
          return;
        }
      }

      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRowForm)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save assignment');
      setMessage({ type: 'success', text: json.message || 'Assignment saved successfully.' });
      setIsAddingNew(false);
      setNewRowForm({});
      fetchItems();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  const handleDelete = async (row: any) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;
    setMessage(null);
    try {
      const params = new URLSearchParams();
      primaryKeys.forEach(k => {
        if (row[k]) params.append(k, row[k]);
      });

      const res = await fetch(`${apiEndpoint}?${params.toString()}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete assignment');
      setMessage({ type: 'success', text: json.message || 'Assignment removed.' });
      fetchItems();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] p-4 sm:p-6 text-zinc-900 font-sans">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header Bar */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-black text-white tracking-widest">{code}</span>
              {sapAlias && <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 font-medium">{sapAlias}</span>}
              <span className="text-xs bg-zinc-100 border border-zinc-200 rounded-full px-2.5 py-1 text-zinc-600 font-mono">{items.length} assigned</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${companyCode}/navigator`} className="h-7 px-3.5 rounded-full border border-zinc-200 text-xs bg-white hover:bg-zinc-50 inline-flex items-center font-medium">Navigator</Link>
              <Link href={`/${companyCode}/foundation/enterprise-structure`} className="h-7 px-3.5 rounded-full border border-zinc-200 text-xs bg-white hover:bg-zinc-50 inline-flex items-center font-medium">Overview Hub</Link>
            </div>
          </div>
          <h1 className="text-lg font-semibold mt-3 tracking-tight leading-snug">{title}</h1>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{description}</p>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`p-3 rounded-xl border text-xs ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* SAP Customizing Maintenance Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-500 font-medium uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  {columns.map(col => (
                    <th key={col.key} className="py-3 px-4">{col.label}</th>
                  ))}
                  <th className="py-3 px-4 text-right pr-6 w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length + 2} className="py-8 text-center text-zinc-400">Loading assignments…</td>
                  </tr>
                ) : items.length === 0 && !isAddingNew ? (
                  <tr>
                    <td colSpan={columns.length + 2} className="py-8 text-center text-zinc-400">No assignments configured yet. Click "Add Assignment" below.</td>
                  </tr>
                ) : (
                  items.map((row, idx) => {
                    const isEditing = editingRowIndex === idx;

                    if (isEditing) {
                      return (
                        <tr key={idx} className="bg-amber-50/40 transition">
                          <td className="py-2.5 px-4 text-center font-mono text-zinc-400">{idx + 1}</td>
                          {columns.map(col => (
                            <td key={col.key} className="py-2 px-3">
                              {col.readOnlyOnEdit ? (
                                <span className="font-mono font-medium px-2 py-1 text-zinc-700 bg-zinc-100 rounded">{editForm[col.key] || '—'}</span>
                              ) : col.type === 'autocomplete' && col.apiUrl ? (
                                <DbAutocomplete
                                  label={col.label}
                                  apiUrl={col.apiUrl}
                                  dataKey={col.dataKey || ''}
                                  codeField={col.codeField || 'code'}
                                  value={editForm[col.key] || ''}
                                  onChange={val => setEditForm({ ...editForm, [col.key]: val })}
                                  placeholder={col.placeholder || ''}
                                  className="w-full min-h-[2.25rem] text-xs"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={editForm[col.key] || ''}
                                  onChange={e => setEditForm({ ...editForm, [col.key]: e.target.value })}
                                  className="w-full border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-black"
                                />
                              )}
                            </td>
                          ))}
                          <td className="py-2.5 px-4 text-right pr-6 space-x-1.5 whitespace-nowrap">
                            <button onClick={handleSaveEdit} className="px-3 py-1 bg-black text-white rounded-full text-xs font-medium hover:bg-zinc-800 transition">Save</button>
                            <button onClick={handleCancelEdit} className="px-2.5 py-1 border border-zinc-300 text-zinc-600 rounded-full text-xs hover:bg-zinc-100 transition">Cancel</button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={idx} className="hover:bg-zinc-50/50 transition">
                        <td className="py-3 px-4 text-center font-mono text-zinc-400">{idx + 1}</td>
                        {columns.map(col => (
                          <td key={col.key} className="py-3 px-4 font-mono text-zinc-800">
                            {row[col.key] ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="font-semibold">{row[col.key]}</span>
                                {row[`${col.key.replace('_code', '')}_name`] && (
                                  <span className="text-zinc-500 font-sans text-xs">({row[`${col.key.replace('_code', '')}_name`]})</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-zinc-300">—</span>
                            )}
                          </td>
                        ))}
                        <td className="py-3 px-4 text-right pr-6 space-x-2 whitespace-nowrap">
                          <button onClick={() => handleStartEdit(idx)} className="text-xs text-zinc-600 hover:text-black font-medium hover:underline">Edit</button>
                          <button onClick={() => handleDelete(row)} className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline">Delete</button>
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Inline New Row */}
                {isAddingNew && (
                  <tr className="bg-emerald-50/40 border-t-2 border-emerald-300">
                    <td className="py-2.5 px-4 text-center text-xs text-emerald-600 font-bold">+</td>
                    {columns.map(col => (
                      <td key={col.key} className="py-2 px-3">
                        {col.type === 'autocomplete' && col.apiUrl ? (
                          <DbAutocomplete
                            label={col.label}
                            apiUrl={col.apiUrl}
                            dataKey={col.dataKey || ''}
                            codeField={col.codeField || 'code'}
                            value={newRowForm[col.key] || ''}
                            onChange={val => setNewRowForm({ ...newRowForm, [col.key]: val })}
                            placeholder={col.placeholder || `Select ${col.label}`}
                            className="w-full min-h-[2.25rem] text-xs"
                          />
                        ) : (
                          <input
                            type="text"
                            value={newRowForm[col.key] || ''}
                            onChange={e => setNewRowForm({ ...newRowForm, [col.key]: e.target.value })}
                            placeholder={col.placeholder || col.label}
                            className="w-full border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          />
                        )}
                      </td>
                    ))}
                    <td className="py-2.5 px-4 text-right pr-6 space-x-1.5 whitespace-nowrap">
                      <button onClick={handleSaveNew} className="px-3.5 py-1 bg-emerald-700 text-white rounded-full text-xs font-medium hover:bg-emerald-800 transition">Save Entry</button>
                      <button onClick={handleCancelNew} className="px-2.5 py-1 border border-zinc-300 text-zinc-600 rounded-full text-xs hover:bg-zinc-100 transition">Cancel</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Action: SAP New Entries / Add Assignment */}
          <div className="p-3.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
            <button
              onClick={handleAddNewRow}
              disabled={isAddingNew}
              className={`h-8 px-4 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition ${isAddingNew ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' : 'bg-black text-white hover:bg-zinc-800 shadow-sm'}`}
            >
              <span>+</span>
              <span>New Entries / Add Assignment</span>
            </button>
            <span className="text-xs text-zinc-400">Standard SAP Customizing Table Maintenance</span>
          </div>
        </div>

        {/* Related Masters Footer */}
        {relatedLinks.length > 0 && (
          <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
            <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-2.5">Related Configurations</h4>
            <div className="flex flex-wrap gap-2">
              {relatedLinks.map((link, i) => (
                <Link
                  key={i}
                  href={`/${companyCode}${link.route}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-zinc-200 text-xs hover:border-zinc-300 h-7"
                >
                  <span className="font-mono font-bold text-[0.65rem] px-1.5 py-0.5 rounded bg-black text-white">{link.code}</span>
                  <span>{link.label}</span>
                  <span className="text-zinc-400">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
