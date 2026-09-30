"use client";
import React, { useEffect, useState, useMemo } from 'react';
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
  steps?: string[];
  payload?: any;
  result?: any;
  error?: string;
  company_code?: string;
  created_by?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export default function SystemJobsPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [message, setMessage] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const fetchJobs = async () => {
    try {
      const statusQuery = filter === 'ALL' ? '' : `&status=${filter}`;
      const res = await fetch(`/api/jobs?company_code=${companyCode}&limit=100${statusQuery}`);
      const j = await res.json();
      setJobs(j.data || j.jobs || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 2000); // Poll every 2s – shows if server working or hung
    return () => clearInterval(interval);
  }, [filter, companyCode]);

  const stats = useMemo(() => {
    const running = jobs.filter(j => j.status === 'RUNNING').length;
    const queued = jobs.filter(j => j.status === 'QUEUED').length;
    const completed = jobs.filter(j => j.status === 'COMPLETED').length;
    const failed = jobs.filter(j => j.status === 'FAILED').length;
    return { running, queued, completed, failed, total: jobs.length };
  }, [jobs]);

  const handleCancel = async (id: string) => {
    if (!confirm(`Cancel job ${id}? If running, it will be marked cancelled and next queued job will start.`)) return;
    try {
      const res = await fetch(`/api/jobs?id=${id}&action=cancel`, { method: 'DELETE' });
      const j = await res.json();
      setMessage(j.message || 'Cancelled');
      fetchJobs();
    } catch (e: any) {
      setMessage(`❌ ${e.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete job ${id}?`)) return;
    try {
      const res = await fetch(`/api/jobs?id=${id}`, { method: 'DELETE' });
      const j = await res.json();
      setMessage(j.message || 'Deleted');
      fetchJobs();
    } catch (e: any) {
      setMessage(`❌ ${e.message}`);
    }
  };

  const handleCreateTestPayroll = async () => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_type: 'PAYROLL_RUN',
          company_code: companyCode,
          payload: { employee_count: 1000, company_code: companyCode, test: true, steps: ['Validating', 'Loading employees', 'Processing 1000 employees', 'Posting'] },
          created_by: 'user'
        })
      });
      const j = await res.json();
      setMessage(`✅ Test payroll job ${j.job_id} queued – 1000 employees – will take ~10-15 sec – you can close page – check header Jobs icon – background processing – no timeout`);
      fetchJobs();
    } catch (e: any) {
      setMessage(`❌ ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] p-6">
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-black text-white">SM37</span>
              <span className="text-[11px] bg-zinc-100 border rounded-full px-2.5 py-1">{jobs.length} jobs • {stats.running} running • {stats.queued} queued</span>
              {stats.running > 0 && <span className="text-[11px] bg-green-100 border border-green-300 rounded-full px-2.5 py-1 text-green-800 animate-pulse">● Server working – {stats.running} running</span>}
              {stats.queued > 0 && <span className="text-[11px] bg-amber-100 border border-amber-300 rounded-full px-2.5 py-1 text-amber-800">○ {stats.queued} queued – will start after current</span>}
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${companyCode}/navigator`} className="px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50">Navigator</Link>
              <button onClick={handleCreateTestPayroll} className="px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs">Test: Payroll 1000 employees (10-15 sec)</button>
              <button onClick={fetchJobs} className="px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50">Refresh – polls every 2s</button>
            </div>
          </div>
          <h1 className="text-xl font-bold mt-3">System Jobs – Background Job Queue – SM37</h1>
          <p className="text-sm text-zinc-500 mt-1">Company {companyCode} – background job system for long processes like payroll 1000 employees (minutes) – server does not timeout – user sees if server working or hung – progress steps – can close page, job continues – header Jobs icon shows running – queue keeps jobs in order – if system busy, new jobs stay QUEUED and start after current completes</p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <div className="text-[10px] uppercase text-green-700">Running – Server Working</div>
              <div className="text-lg font-bold text-green-800">{stats.running}</div>
              <div className="text-[11px] text-green-600">Progress updating every 2-3 sec – if stuck, server may be hung</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="text-[10px] uppercase text-amber-700">Queued – Waiting</div>
              <div className="text-lg font-bold text-amber-800">{stats.queued}</div>
              <div className="text-[11px] text-amber-600">System busy – will start after running completes – queue order</div>
            </div>
            <div className="bg-zinc-50 border rounded-xl p-3">
              <div className="text-[10px] uppercase text-zinc-500">Completed</div>
              <div className="text-lg font-bold">{stats.completed}</div>
              <div className="text-[11px] text-zinc-500">Finished – result available – can close page anytime</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="text-[10px] uppercase text-red-700">Failed / Timeout</div>
              <div className="text-lg font-bold text-red-800">{stats.failed}</div>
              <div className="text-[11px] text-red-600">Server hung or error – shows error – can retry</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="text-[10px] uppercase text-blue-700">No Timeout – Background</div>
              <div className="text-xs font-medium mt-1">Large payroll 1000 employees may take minutes – runs in background – no server timeout – user can close page – header Jobs icon shows progress – separate system job page shows queue</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-4 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium">Filter:</span>
          {['ALL','RUNNING','QUEUED','COMPLETED','FAILED'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs border ${filter===f ? 'bg-black text-white border-black' : 'bg-white hover:bg-zinc-50'}`}>{f} {f==='RUNNING' ? `(${stats.running})` : f==='QUEUED' ? `(${stats.queued})` : ''}</button>
          ))}
          <span className="ml-auto text-[11px] text-zinc-500">Polls every 2s – shows if server working (progress increasing) or hung (stuck at same %)</span>
        </div>

        {message && <div className="bg-white border rounded-xl p-3 text-xs">{message}</div>}

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
          <h3 className="font-semibold text-sm mb-4">Jobs – {jobs.length} – Background – No Timeout – Queue – Progress Steps – Can Close Page</h3>
          {loading ? <p className="text-sm text-zinc-500">Loading…</p> : (
            <div className="space-y-3 max-h-[800px] overflow-auto">
              {jobs.map((job) => (
                <div key={job.id} className={`border rounded-xl p-4 ${job.status==='RUNNING' ? 'bg-green-50/50 border-green-200' : job.status==='QUEUED' ? 'bg-amber-50/50 border-amber-200' : job.status==='FAILED' ? 'bg-red-50/50 border-red-200' : 'bg-white'}`}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] px-2 py-1 rounded-full font-bold border ${job.status==='RUNNING' ? 'bg-green-100 border-green-300 text-green-800 animate-pulse' : job.status==='QUEUED' ? 'bg-amber-100 border-amber-300 text-amber-800' : job.status==='COMPLETED' ? 'bg-zinc-900 text-white' : 'bg-red-100 border-red-300 text-red-800'}`}>
                          {job.status === 'RUNNING' ? '● RUNNING – server working – progress updating' : job.status === 'QUEUED' ? '○ QUEUED – system busy – will start after current – you can close page' : job.status}
                        </span>
                        <span className="font-mono text-xs font-bold">{job.job_type}</span>
                        <span className="text-[11px] text-zinc-500">{job.company_code || ''} • {new Date(job.created_at).toLocaleString()}</span>
                        {job.status==='RUNNING' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Server working" />}
                      </div>

                      <div className="mt-2">
                        <div className="text-xs font-medium">{job.step_description || 'Waiting...'}</div>
                        {job.steps && job.steps.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {job.steps.map((s, idx) => (
                              <span key={idx} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${idx < (job.current_step||0) ? 'bg-green-100 border-green-200 text-green-700' : idx === (job.current_step||0)-1 ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-500'}`}>
                                {idx < (job.current_step||0) ? '✓' : ''} {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-[8px] bg-zinc-200 rounded-full overflow-hidden max-w-[400px]">
                            <div className={`h-full transition-all duration-500 ${job.status==='RUNNING' ? 'bg-green-500' : job.status==='QUEUED' ? 'bg-amber-400' : job.status==='COMPLETED' ? 'bg-black' : 'bg-red-500'}`} style={{ width: `${job.progress || 0}%` }} />
                          </div>
                          <span className="text-xs font-mono font-bold">{job.progress}%</span>
                          {job.current_step && job.total_steps && <span className="text-[11px] text-zinc-500">{job.current_step}/{job.total_steps} steps</span>}
                        </div>
                        {job.status==='RUNNING' && (
                          <div className="mt-1 text-[11px] text-green-700">
                            Server working – progress updates every 2-3 sec – if stuck at same % for &gt;30 sec, server may be hung – check logs – you can cancel and retry – job continues even if you close page – header Jobs icon shows running
                          </div>
                        )}
                        {job.status==='QUEUED' && (
                          <div className="mt-1 text-[11px] text-amber-700">
                            Queued – system busy – will start after current RUNNING job completes – queue order – you can close page – job will start automatically – check header Jobs icon (⏳ {stats.running+stats.queued})
                          </div>
                        )}
                      </div>

                      {job.result && (
                        <div className="mt-3 p-2 bg-white rounded-lg border text-[11px]">
                          <div className="font-medium">Result:</div>
                          <pre className="mt-1 text-[10px] whitespace-pre-wrap break-all">{JSON.stringify(job.result, null, 2).slice(0, 1000)}</pre>
                        </div>
                      )}
                      {job.error && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700">
                          <div className="font-medium">Error – server may have hung or failed:</div>
                          <div className="mt-1">{job.error}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      {(job.status==='RUNNING' || job.status==='QUEUED') && <button onClick={() => handleCancel(job.id)} className="text-[11px] px-2.5 py-1 rounded-full border bg-white hover:bg-red-50 text-red-600">Cancel – will start next queued</button>}
                      <button onClick={() => setSelectedJob(selectedJob?.id===job.id ? null : job)} className="text-[11px] px-2.5 py-1 rounded-full border bg-white hover:bg-zinc-50">{selectedJob?.id===job.id ? 'Hide' : 'Details'}</button>
                      {(job.status==='COMPLETED' || job.status==='FAILED' || job.status==='CANCELLED') && <button onClick={() => handleDelete(job.id)} className="text-[11px] px-2.5 py-1 rounded-full border bg-white hover:bg-zinc-50 text-zinc-500">Delete</button>}
                    </div>
                  </div>

                  {selectedJob?.id === job.id && (
                    <div className="mt-3 p-3 bg-zinc-50 rounded-xl border text-[11px] space-y-2">
                      <div><b>ID:</b> {job.id}</div>
                      <div><b>Type:</b> {job.job_type}</div>
                      <div><b>Company:</b> {job.company_code}</div>
                      <div><b>Created:</b> {job.created_at} by {job.created_by}</div>
                      <div><b>Started:</b> {job.started_at || '-'}</div>
                      <div><b>Completed:</b> {job.completed_at || '-'}</div>
                      <div><b>Payload:</b> <pre className="text-[10px] bg-white border rounded p-2 mt-1 whitespace-pre-wrap break-all">{JSON.stringify(job.payload, null, 2).slice(0, 2000)}</pre></div>
                    </div>
                  )}
                </div>
              ))}
              {jobs.length===0 && <div className="text-center py-12 text-sm text-zinc-500">No jobs – system free – create test payroll 1000 employees via button above – it will run in background – no timeout – you can close page – header Jobs icon shows progress</div>}
            </div>
          )}
        </div>

        <div className="bg-zinc-50 rounded-2xl border p-4">
          <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium mb-2">How background job system works – no timeout – queue – progress – header icon</h4>
          <ul className="text-[11px] text-zinc-600 space-y-1 list-disc pl-4">
            <li><b>Asynchronous:</b> When you submit payroll for 1000 employees, API creates job with status QUEUED and returns jobId immediately – UI shows spinner and disables submit – prevents double click – server processes job in background – no timeout even if minutes</li>
            <li><b>Progress steps:</b> Job updates progress 0-100% + current_step + step_description – e.g., Payroll: Validating (10%) → Loading employees (20%) → Processing employee 500/1000 (60%) → Posting (90%) → Completed (100%) – UI polls every 2-3 sec and shows progress bar + steps</li>
            <li><b>Server working vs hung:</b> If progress increases every few seconds → server working – green pulse – if progress stuck at same % for &gt;30 sec → server may be hung – shows warning – you can cancel and retry – header Jobs icon shows running count + green dot if working</li>
            <li><b>Can close page:</b> Job continues even if you close page – background processing – check header Jobs icon (⏳) or System Jobs page for progress – result available when completed</li>
            <li><b>Queue:</b> If system busy (one RUNNING), new jobs stay QUEUED and start after current completes – queue order – e.g., Payroll 1000 running, then Material create queued → will start after payroll – header shows queued count</li>
            <li><b>System job page:</b> This page – SM37 – shows all jobs – RUNNING, QUEUED, COMPLETED, FAILED – progress, steps, result, error – cancel, delete – separate page per your request</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
