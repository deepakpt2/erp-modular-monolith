"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LocksPage({ params }: { params: { companyCode: string } }) {
  const companyCode = params.companyCode;
  const [locks, setLocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');
  const [modern] = useState(true);

  const fetchLocks = async () => {
    setLoading(true);
    try {
      const url = filter === 'ACTIVE' ? '/api/locks?active=true' : filter === 'EXPIRED' ? '/api/locks?active=false' : '/api/locks';
      const res = await fetch(url);
      const data = await res.json();
      setLocks(data.locks || data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocks();
    const id = setInterval(fetchLocks, 3000);
    return () => clearInterval(id);
  }, [filter]);

  const releaseLock = async (lock: any) => {
    if (!confirm(`Release lock ${lock.lock_object} ${lock.object_id} locked by ${lock.locked_by}? Other users can then edit.`)) return;
    await fetch(`/api/locks?id=${lock.id}`, { method: 'DELETE' });
    fetchLocks();
  };

  const cleanupExpired = async () => {
    await fetch('/api/locks', { method: 'DELETE' });
    fetchLocks();
  };

  return (
    <div className={modern ? "min-h-screen bg-[#fafaf9] p-6" : "min-h-screen bg-white p-4"}>
      <div className={modern ? "max-w-[1200px] mx-auto space-y-6" : "max-w-[1000px] mx-auto space-y-4"}>
        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border-b pb-3"}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className={modern ? "text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-black text-white" : "text-[10px] font-mono border px-2 py-0.5 bg-black text-white"}>SM12</span>
              <span className={modern ? "text-[10px] font-mono px-2 py-1 rounded-full bg-zinc-100 border" : "text-[9px] font-mono border px-1 bg-zinc-50"}>ENQUEUE</span>
              <span className={modern ? "text-[11px] bg-zinc-100 border rounded-full px-2.5 py-1" : "text-[10px] border px-2 py-0.5"}>{locks.length} locks</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${companyCode}/system/jobs`} className={modern ? "px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50" : "border px-2 py-1 text-xs"}>📋 Jobs SM37</Link>
              <Link href={`/${companyCode}/navigator`} className={modern ? "px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50" : "border px-2 py-1 text-xs"}>🌳 Navigator</Link>
            </div>
          </div>
          <h1 className={modern ? "text-xl font-bold mt-3 tracking-tight" : "text-lg font-bold mt-2"}>Enqueue Locks – SM12 – Double-Entry Protection</h1>
          <p className={modern ? "text-xs text-zinc-500 mt-1" : "text-[11px] text-zinc-500"}>
            Prevents double entry – e.g., one user starts GR for PO 4500000001 and moved to background, lock PO 4500000001 – other users locked out – must wait until completion or 5 min inactivity – critical settings like number ranges locked when editing – other users see 🔒 Locked – can edit after release or 5 min expiry – industry standard enqueue/dequeue – heartbeat extends lock while typing – auto-expire after 5 min if user closes browser
          </p>
          <div className={modern ? "flex gap-2 mt-4 flex-wrap" : "flex gap-1 mt-3 flex-wrap"}>
            {(['ALL','ACTIVE','EXPIRED'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={modern ? `px-4 py-2 rounded-full text-xs font-medium border transition ${filter===f ? 'bg-black text-white border-black' : 'bg-white hover:bg-zinc-50'}` : `px-3 py-1 text-xs border ${filter===f ? 'bg-black text-white' : 'bg-white'}`}>{f}</button>
            ))}
            <button onClick={fetchLocks} className={modern ? "px-4 py-2 rounded-full border text-xs bg-white hover:bg-zinc-50" : "px-3 py-1 border text-xs"}>🔄 Refresh</button>
            <button onClick={cleanupExpired} className={modern ? "px-4 py-2 rounded-full border text-xs bg-white hover:bg-zinc-50" : "px-3 py-1 border text-xs"}>🧹 Cleanup Expired (5 min)</button>
          </div>
        </div>

        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-4" : "border p-4 space-y-3"}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="border rounded-xl p-3 bg-zinc-50">
              <p className="font-bold">Active Locks</p>
              <p className="text-[11px] text-zinc-500 mt-1">Prevent double entry – GR for PO, number range edit, etc. – other users blocked – 5 min expiry</p>
              <p className="text-lg font-mono font-bold mt-2">{locks.filter((l:any)=>l.is_active && new Date(l.expires_at) > new Date()).length}</p>
            </div>
            <div className="border rounded-xl p-3 bg-amber-50">
              <p className="font-bold">Queued Jobs with Locks</p>
              <p className="text-[11px] text-zinc-500 mt-1">Background jobs with locks – e.g., GR for PO – lock released on COMPLETED/FAILED</p>
              <p className="text-lg font-mono font-bold mt-2">{locks.filter((l:any)=>l.job_id && l.is_active).length}</p>
            </div>
            <div className="border rounded-xl p-3 bg-blue-50">
              <p className="font-bold">How Lock Works</p>
              <p className="text-[10px] text-zinc-600 mt-1">1. User starts edit → POST /api/locks → acquire lock expires 5 min<br/>2. Other user tries same → 423 Locked by X – try after 5 min<br/>3. Heartbeat PUT every 1 min extends while typing<br/>4. On Save/Cancel/Close or job completion → DELETE lock → table released</p>
            </div>
            <div className="border rounded-xl p-3 bg-green-50">
              <p className="font-bold">Double-Entry Protection</p>
              <p className="text-[10px] text-zinc-600 mt-1">GR for PO 4500000001 background → lock PO 4500000001 → other user cannot create GR for same PO → prevents duplicate stock + ledger → must wait completion<br/>Number range MAT-RAW-01 editing → lock → other cannot edit → prevents lost update</p>
            </div>
          </div>

          <div className={modern ? "space-y-2 max-h-[600px] overflow-auto" : "space-y-1 max-h-[500px] overflow-auto"}>
            {loading ? <p className="text-xs">Loading locks...</p> : locks.length === 0 ? <p className="text-xs text-zinc-400">No locks – system free – no double-entry protection active</p> : locks.map((lock: any) => {
              const isActive = lock.is_active && new Date(lock.expires_at) > new Date();
              const expiresIn = Math.max(0, Math.round((new Date(lock.expires_at).getTime() - Date.now())/1000));
              return (
                <div key={lock.id} className={modern ? `border rounded-xl p-3 ${isActive ? 'bg-white border-amber-200' : 'bg-zinc-50 opacity-60'}` : `border p-2 ${isActive ? 'bg-white' : 'bg-zinc-50 opacity-60'}`}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-amber-500 text-white' : 'bg-zinc-200'}`}>{isActive ? '🔒 ACTIVE' : '🔓 EXPIRED/RELEASED'}</span>
                        <span className="font-mono text-xs font-bold">{lock.lock_object} {lock.object_id}</span>
                        {lock.table_name && <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 border">{lock.table_name}</span>}
                        {lock.job_id && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 border text-blue-700">Job {lock.job_id.slice(0,8)}</span>}
                      </div>
                      <p className="text-[11px] mt-1">Locked by <span className="font-bold">{lock.locked_by}</span> since {new Date(lock.locked_at).toLocaleString()} – expires {new Date(lock.expires_at).toLocaleString()} – in {expiresIn}s ({Math.floor(expiresIn/60)}m {expiresIn%60}s) – 5 min inactivity auto-expire</p>
                      {lock.description && <p className="text-[10px] text-zinc-500 mt-1 truncate">{lock.description}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {isActive && <button onClick={() => releaseLock(lock)} className={modern ? "px-3 py-1.5 rounded-full bg-black text-white text-[11px]" : "px-2 py-1 border bg-black text-white text-[10px]"}>Release – Table Released</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={modern ? "bg-white rounded-2xl shadow-sm border border-zinc-200 p-6" : "border p-4"}>
          <h3 className="font-bold text-xs">Industry Standard – SM12 Enqueue – Implementation Details</h3>
          <ul className="text-[11px] text-zinc-600 mt-2 space-y-1 list-disc ml-4">
            <li><span className="font-bold">Table:</span> core_enqueue_lock – lock_object, object_id, table_name, locked_by, locked_at, expires_at (NOW+5min), is_active, job_id, description – indexes on object_id, active, expires, job</li>
            <li><span className="font-bold">Enqueue:</span> POST /api/locks – body lock_object, object_id, locked_by – checks if already locked and not expired – if locked by other → 423 Locked – other users must wait – if same user → extend 5 min</li>
            <li><span className="font-bold">Heartbeat:</span> PUT /api/locks with heartbeat – extends expiry on activity – frontend calls every 1 min while user typing – prevents expiry while active</li>
            <li><span className="font-bold">Dequeue:</span> DELETE /api/locks?id= – release on Save/Cancel/Close or job COMPLETED/FAILED – table released – other users can now edit</li>
            <li><span className="font-bold">Auto-expire:</span> 5 min inactivity – expires_at &lt; NOW() → is_active=false – cleanup via GET or DELETE without id – prevents dead locks if user closes browser</li>
            <li><span className="font-bold">Background jobs:</span> When job RUNNING for PO 4500000001, acquire lock PO 4500000001 with job_id – release on COMPLETED/FAILED – other users cannot create GR for same PO – prevents double entry – double stock – double ledger</li>
            <li><span className="font-bold">Critical settings:</span> Number range MAT-RAW-01, company codes, facilities – when editing, lock acquired – other users see 🔒 Locked badge – can edit after release or 5 min – authority check still required</li>
            <li><span className="font-bold">Containers:</span> pgbouncer (6432) transaction pooling – MAX_CLIENT_CONN 1000, DEFAULT_POOL_SIZE 25 – prevents too many connections – ERP has many concurrent DB calls – dragonfly (6379) cache – maxmemory 256mb – for number ranges, materials – cache wrapper with invalidation on update – industry standard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
