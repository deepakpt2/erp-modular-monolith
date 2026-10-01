"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FUNCTIONS, MODULE_CLASSIFICATION, FunctionCode } from '@/shared/lib/functions';

export default function TransactionCodesDirectoryPage() {
  const params = useParams();
  const companyCode = (params?.companyCode as string) || '1000';

  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');

  const filteredFunctions = useMemo(() => {
    return FUNCTIONS.filter((fn) => {
      const matchModule = selectedModule === 'ALL' || fn.module === selectedModule;
      if (!matchModule) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const codeMatch = fn.code.toLowerCase().includes(q);
      const aliasMatch = fn.aliases?.some((a) => a.toLowerCase().includes(q));
      const descMatch = fn.description.toLowerCase().includes(q);
      const classicMatch = fn.classicName?.toLowerCase().includes(q);
      const subModMatch = fn.subModule?.toLowerCase().includes(q);

      return codeMatch || aliasMatch || descMatch || classicMatch || subModMatch;
    });
  }, [search, selectedModule]);

  const moduleList = useMemo(() => {
    const mods = new Set<string>();
    FUNCTIONS.forEach((fn) => mods.add(fn.module));
    return ['ALL', ...Array.from(mods).sort()];
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-zinc-900 text-white px-2 py-0.5 rounded">FDIR</span>
            <span className="text-xs text-zinc-500 font-mono">/ Directory</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mt-1">Transaction Codes Directory</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Full directory of implemented Transaction Codes, legacy/industry standard aliases, modules, and business functions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-extrabold text-zinc-900">{filteredFunctions.length}</div>
            <div className="text-[11px] text-zinc-400 uppercase tracking-wider">Functions</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-2.5 text-zinc-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by code (e.g. FAGC, EMTC), legacy alias (e.g. OBD4, MM01), or function title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Module filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {moduleList.map((mod) => (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedModule === mod
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Codes */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-700 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-28">Own IP Code</th>
                <th className="py-3 px-4 w-44">Legacy / Alias</th>
                <th className="py-3 px-4 w-28">Module</th>
                <th className="py-3 px-4">Function & Description</th>
                <th className="py-3 px-4 w-28">Action Type</th>
                <th className="py-3 px-4 w-24 text-right">Direct Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal">
              {filteredFunctions.map((fn: FunctionCode) => {
                const targetUrl = fn.route.replace('/1000/', `/${companyCode}/`);
                const modMeta = MODULE_CLASSIFICATION[fn.module] || { color: 'bg-zinc-100 text-zinc-700', icon: '📄' };

                return (
                  <tr key={fn.code} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 align-top">
                      <span className="font-mono font-bold text-xs bg-zinc-900 text-white px-2 py-0.5 rounded shadow-sm inline-block">
                        {fn.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="flex flex-wrap gap-1">
                        {fn.aliases && fn.aliases.length > 0 ? (
                          fn.aliases.map((al, idx) => (
                            <span
                              key={idx}
                              className="font-mono text-[11px] bg-zinc-100 border border-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded"
                            >
                              {al}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-400 text-xs italic">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border border-transparent ${modMeta.color}`}>
                        <span>{modMeta.icon}</span>
                        <span>{fn.module}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="font-semibold text-zinc-900 text-sm">
                        {fn.description}
                      </div>
                      {fn.classicName && (
                        <div className="text-xs text-zinc-500 mt-0.5">
                          Standard Name: <span className="font-medium text-zinc-700">{fn.classicName}</span>
                        </div>
                      )}
                      {fn.subModule && (
                        <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                          Sub-module: {fn.subModule}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <span className="text-[11px] font-mono px-2 py-0.5 bg-zinc-100 rounded text-zinc-600 border border-zinc-200">
                        {fn.type || 'PAGE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-top text-right">
                      <Link
                        href={targetUrl}
                        className="inline-flex items-center gap-1 text-xs font-medium text-zinc-900 hover:text-blue-600 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded transition-colors"
                      >
                        Open ↗
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {filteredFunctions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No transaction codes matched your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
