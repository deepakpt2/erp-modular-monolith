"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Job {
  id: string;
  job_type: string;
  status: string;
  progress: number;
  current_step?: number;
  total_steps?: number;
  step_description?: string;
  company_code?: string;
  created_at?: string;
}

export function JobIndicator() {
  const params = useParams();
  const companyCode = (params?.companyCode as string) || '1000';
  const [jobs, setJobs] = useState<Job[]>([]);
  const [runningCount, setRunningCount] = useState(0);
  const [queuedCount, setQueuedCount] = useState(0);
  const [open, setOpen] = useState(false);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs?status=RUNNING,QUEUED&limit=10');
      if (!res.ok) {
        // Handle 403 gracefully – user may not have permission – don't crash – per console error /api/jobs 403
        if (res.status === 403) {
          // Silently ignore – user has no permission to view jobs – hide indicator or show 0
          setJobs([]);
          setRunningCount(0);
          setQueuedCount(0);
          return;
        }
        const txt = await res.text();
        console.warn('Job indicator fetch failed', res.status, txt.slice(0,100));
        return;
      }
      const j = await res.json();
      const data = j.data || j.jobs || [];
      setJobs(data);
      setRunningCount(j.running_count || data.filter((x: Job) => x.status === 'RUNNING').length);
      setQueuedCount(j.queued_count || data.filter((x: Job) => x.status === 'QUEUED').length);
    } catch (e) {
      // Ignore network errors – e.g., ERR_BLOCKED_BY_CLIENT from adblock
      console.warn('Job indicator fetch error – possibly blocked by client', (e as any)?.message);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000); // Poll every 3 sec – shows if server working or hung
    return () => clearInterval(interval);
  }, []);

  const showMenu = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    setOpen(true);
  };

  const hideMenu = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setOpen(false), 300);
  };

  const cancelHide = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
  };

  const totalActive = runningCount + queuedCount;

  return (
    <div className="relative" onMouseEnter={showMenu} onMouseLeave={hideMenu}>
      <button onClick={() => setOpen(!open)} className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${totalActive > 0 ? 'bg-zinc-50 border-zinc-300 text-zinc-800 animate-pulse' : 'bg-white border-zinc-200 hover:bg-zinc-50'}`}>
        <span className="text-[14px]">{totalActive > 0 ? '⏳' : '📋'}</span>
        <span className="hidden sm:inline">Jobs</span>
        {totalActive > 0 && (
          <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] bg-zinc-500 text-white rounded-full px-1.5 border border-white shadow-sm">
            {totalActive}
          </span>
        )}
        {runningCount > 0 && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Server working – running" />}
        {totalActive === 0 && <span className="w-2 h-2 bg-zinc-300 rounded-full" title="No active jobs" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden z-50" onMouseEnter={cancelHide} onMouseLeave={hideMenu}>
          <div className="p-3 border-b border-zinc-100 flex justify-between items-center">
            <div>
              <div className="text-xs font-semibold">Background Jobs – System Busy Indicator</div>
              <div className="text-[10px] text-zinc-500">{runningCount} running • {queuedCount} queued • Polls every 3s – shows if server working or hung • Auto-promote after 10s for ALL</div>
            </div>
            <div className="flex gap-1">
              <Link href={`/${companyCode}/system/locks`} className="text-[10px] px-2 py-1 rounded-full border bg-white hover:bg-zinc-50">🔒 FELM</Link>
              <Link href={`/${companyCode}/system/jobs`} className="text-[11px] px-2 py-1 rounded-full bg-black text-white">View All →</Link>
            </div>
          </div>

          <div className="max-h-[320px] overflow-auto">
            {jobs.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-xs text-zinc-500">No active jobs – system free</div>
                <div className="text-[10px] text-zinc-400 mt-1">When you submit payroll for 1000 employees, it runs in background – you can close page – check here or System Jobs page – if server hangs, progress stops – shows hung</div>
                <Link href={`/${companyCode}/system/jobs`} className="mt-3 inline-block text-[11px] px-3 py-1 rounded-full border hover:bg-zinc-50">Go to System Jobs – FBJM own IP</Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {jobs.map((job) => (
                  <div key={job.id} className="p-3 hover:bg-zinc-50">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${job.status === 'RUNNING' ? 'bg-green-100 border border-green-200 text-green-800' : 'bg-zinc-100 border border-zinc-200 text-zinc-800'}`}>
                            {job.status === 'RUNNING' ? '● RUNNING – server working' : '○ QUEUED – waiting, will start after current'}
                          </span>
                          <span className="text-[11px] font-mono font-bold truncate">{job.job_type}</span>
                        </div>
                        <div className="text-[11px] text-zinc-600 mt-1 truncate">{job.step_description || 'Waiting...'}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-[6px] bg-zinc-200 rounded-full overflow-hidden max-w-[180px]">
                            <div className={`h-full transition-all duration-500 ${job.status === 'RUNNING' ? 'bg-green-500' : 'bg-zinc-400'}`} style={{ width: `${job.progress || 0}%` }} />
                          </div>
                          <span className="text-[10px] font-mono">{job.progress}%</span>
                          {job.current_step && job.total_steps && <span className="text-[10px] text-zinc-400">{job.current_step}/{job.total_steps}</span>}
                        </div>
                      </div>
                      <div className="text-[10px] text-zinc-400">{job.company_code || ''}</div>
                    </div>
                    {job.status === 'RUNNING' && job.progress > 0 && job.progress < 100 && (
                      <div className="mt-1 text-[10px] text-green-600">Server working – progress updating every few seconds – if stuck at same % for long, server may be hung – check System Jobs page</div>
                    )}
                    {job.status === 'QUEUED' && (
                      <div className="mt-1 text-[10px] text-amber-600">Queued – system busy – will start after current completes – you can close page – job continues in background</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 bg-zinc-50 border-t border-zinc-100 text-[10px] text-zinc-500">
            <div>• Large process like payroll 1000 employees may take minutes – runs in background – no timeout – header icon shows running jobs</div>
            <div>• If progress stops updating for long, server may be hung – shows in System Jobs page – you can cancel and retry</div>
            <div>• You can close page – job continues – check System Jobs page for result – queue keeps jobs in order</div>
          </div>
        </div>
      )}
    </div>
  );
}
