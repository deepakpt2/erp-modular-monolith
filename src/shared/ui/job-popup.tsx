"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type JobPopupProps = {
  jobId: string | null;
  isOpen: boolean;
  onClose: () => void;
  lastPage?: string; // redirect after close – last page or main
  title?: string;
};

export function JobPopup({ jobId, isOpen, onClose, lastPage, title }: JobPopupProps) {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen || !jobId) return;

    const fetchJob = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/jobs?limit=100`);
      if (!res.ok) {
        if (res.status === 403) {
          console.warn('Jobs popup fetch 403 – no permission – showing empty');
          return;
        }
      }
        const data = await res.json();
        const found = (data.jobs || data.data || []).find((j: any) => j.id === jobId);
        if (found) setJob(found);
        else {
          // Try direct fetch by id via query – fallback
          // Since GET doesn't support id filter, we rely on list
          // If not found, keep previous
        }
      } catch (e) {
        console.warn('JobPopup fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
    intervalRef.current = setInterval(fetchJob, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, jobId]);

  if (!isOpen) return null;

  const progress = job?.progress ?? 0;
  const status = job?.status || 'QUEUED';
  const steps: string[] = job?.steps || [];
  const currentStep = job?.current_step || 0;
  const stepDesc = job?.step_description || 'Waiting in queue – system busy – will start after current completes';
  const isCompleted = status === 'COMPLETED';
  const isFailed = status === 'FAILED';
  const isRunning = status === 'RUNNING';
  const isQueued = status === 'QUEUED';

  const handleClose = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onClose();
    // Redirect to last page or main – as per user request, closing redirects to last page as usual
    if (lastPage) {
      router.push(lastPage);
    } else {
      // Fallback to previous page via history or to navigator
      // Use localStorage lastPage if available
      const stored = typeof window !== 'undefined' ? localStorage.getItem('last_page') : null;
      if (stored) router.push(stored);
      else router.back();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-[560px] max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm flex items-center gap-2">
              {isRunning && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
              {isQueued && <span className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse" />}
              {isCompleted && <span className="w-2 h-2 bg-zinc-500 rounded-full" />}
              {isFailed && <span className="w-2 h-2 bg-red-500 rounded-full" />}
              {title || `${job?.job_type || 'Background Job'} – ${job?.id?.slice(0,8) || ''}`}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1 truncate">
              {job?.company_code ? `Company ${job.company_code} • ` : ''}Job {jobId?.slice(0,8)} • {status} • {progress}% • {isRunning ? 'Server working – green pulse – progress updating' : isQueued ? 'System busy – queued – will start after current – you can close, job continues' : isCompleted ? 'Completed – you can close and redirect to last page' : ''}
            </p>
          </div>
          <button onClick={handleClose} className="px-3 py-1.5 rounded-full border text-xs hover:bg-zinc-50 shrink-0">✕ Close → Last Page</button>
        </div>

        {/* Progress */}
        <div className="p-5 space-y-4 overflow-auto">
          <div className="space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="font-medium">{isRunning ? '⏳ Server working – processing...' : isQueued ? '⏳ Queued – system busy – will start after current completes – you can close, job continues in background' : isCompleted ? '✅ Completed – result available – you can close and go to last page' : isFailed ? '❌ Failed – check error' : 'Waiting'}</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
              <div className={`h-2.5 rounded-full transition-all duration-500 ${isFailed ? 'bg-red-500' : isCompleted ? 'bg-zinc-500' : 'bg-black'}`} style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[11px] text-zinc-600 bg-zinc-50 border rounded-xl p-2.5">
              <span className="font-medium">Current:</span> {stepDesc} {currentStep > 0 && job?.total_steps ? `(${currentStep}/${job.total_steps})` : ''}
            </p>
          </div>

          {/* Steps */}
          {steps.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Progress Steps – industry standard – shows if server working or hung</p>
              <div className="space-y-1">
                {steps.map((s: string, idx: number) => {
                  const stepNum = idx + 1;
                  const isDone = stepNum < currentStep;
                  const isCurrent = stepNum === currentStep;
                  return (
                    <div key={idx} className={`flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-full border ${isCurrent ? 'bg-black text-white border-black' : isDone ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-zinc-200 text-zinc-500'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-white text-black animate-pulse' : 'bg-zinc-100'}`}>
                        {isDone ? '✓' : stepNum}
                      </span>
                      <span className="truncate">{s}</span>
                      {isCurrent && <span className="ml-auto text-[10px] animate-pulse">● Working</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Result */}
          {job?.result && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-[11px]">
              <p className="font-bold text-blue-700">✅ Result – Document Created</p>
              <pre className="mt-1 whitespace-pre-wrap break-all text-[11px] bg-white border rounded-lg p-2">{JSON.stringify(job.result, null, 2)}</pre>
              {job.result.document_number && <p className="mt-2 font-mono font-bold">Doc: {job.result.document_number} – Next: {(parseInt(job.result.document_number)+1) || 'auto'} – Usage: check FNRC page</p>}
              {job.result.material_number && <p className="mt-2 font-mono font-bold">Material: {job.result.material_number} – Next: {(parseInt(job.result.material_number)+1) || 'auto'}</p>}
            </div>
          )}

          {job?.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-[11px]">
              <p className="font-bold text-red-700">❌ Error – Failed</p>
              <p className="mt-1 whitespace-pre-wrap">{job.error}</p>
              <p className="mt-2 text-[10px] text-zinc-500">If timeout or hung – check System Jobs page FBJM own IP (alias SM37) – progress stuck &gt;5 min indicates hung – you can cancel and retry – number range may have been consumed – check FNRC current</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-zinc-50 border rounded-xl p-3 text-[10px] text-zinc-600 space-y-1">
            <p><span className="font-bold">How it works:</span> First 10 sec direct with spinner timer – if takes &gt;10 sec auto-moved to background – popup shows steps – you can close → redirect to last page or main – job continues – header Jobs icon shows running/queued – no timeout for background – even minutes for payroll 1000 employees</p>
            <p><span className="font-bold">Double-entry protection:</span> If one user starts GR for PO 4500000001 and moved to background, lock PO 4500000001 – other users locked out – try after completion or 5 min inactivity – industry standard enqueue FELM own IP (alias SM12)</p>
            <p><span className="font-bold">Table locking:</span> Critical settings like number ranges – when editing, lock acquired – other users see 🔒 Locked by user@example.com – can edit after release or 5 min inactivity – heartbeat extends lock while typing</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-zinc-50 flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-2">
            <button onClick={handleClose} className="px-4 py-2 rounded-full bg-black text-white text-xs font-medium hover:bg-zinc-800">
              {isCompleted ? '✅ Close → Last Page (Completed)' : isRunning ? 'Close → Last Page – Job Continues in Background' : 'Close → Last Page'}
            </button>
            <a href={`/${job?.company_code || '1000'}/system/jobs`} className="px-4 py-2 rounded-full border bg-white text-xs hover:bg-zinc-50">📋 System Jobs FBJM</a>
            <a href={`/${job?.company_code || '1000'}/system/locks`} className="px-3 py-2 rounded-full border bg-white text-[11px] hover:bg-zinc-50">🔒 Locks FELM</a>
          </div>
          <span className="text-[10px] text-zinc-400">
            {loading ? 'Refreshing...' : `Updated every 2s – ${new Date().toLocaleTimeString()} – ${isRunning ? 'Server working – progress increasing = working, stuck >30s = may be hung' : ''}`}
          </span>
        </div>
      </div>
    </div>
  );
}

// Universal hook for auto-promote after 10 sec – for ALL processes
export function useAutoPromoteJob() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [lastPage, setLastPage] = useState<string>('');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lp = localStorage.getItem('last_page') || document.referrer || '';
      if (lp) setLastPage(lp);
    }
  }, []);

  const startElapsedTimer = () => {
    setElapsed(0);
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  const stopElapsedTimer = () => {
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // Core function – handles direct call with auto-promote after 10 sec to background for ALL processes
  const executeWithAutoPromote = async ({
    directFn,
    backgroundJobType,
    backgroundPayload,
    companyCode,
    lockObject,
    lockObjectId,
    onDirectSuccess,
    onBackgroundCreated,
  }: {
    directFn: () => Promise<any>; // Direct API call – e.g., fetch /api/gr
    backgroundJobType: string; // e.g., GR_CREATE, PO_CREATE, MATERIAL_CREATE, PAYROLL_RUN
    backgroundPayload: any; // Payload for background job if promoted
    companyCode?: string;
    lockObject?: string; // e.g., PO, NUMBER_RANGE, MATERIAL – for double-entry protection
    lockObjectId?: string; // e.g., PO number, range code
    onDirectSuccess?: (result: any) => void;
    onBackgroundCreated?: (jobId: string) => void;
  }) => {
    setIsSubmitting(true);
    startElapsedTimer();
    let promoted = false;

    // Set last page for redirect
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_page', window.location.pathname);
    }

    const controller = new AbortController();

    // Auto-promote timer – after 10 sec, move to background
    const promoteTimeout = setTimeout(async () => {
      promoted = true;
      controller.abort(); // Abort direct
      try {
        // Check lock before creating background job – double-entry protection
        if (lockObject && lockObjectId) {
          const lockCheck = await fetch('/api/locks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lock_object: lockObject, object_id: lockObjectId, locked_by: 'system', description: `Auto-promote check for ${backgroundJobType} ${lockObjectId}` }),
          });
          if (lockCheck.status === 423) {
            const lockData = await lockCheck.json();
            throw new Error(lockData.error || `🔒 Locked – ${lockObject} ${lockObjectId} locked by ${lockData.locked_by} – prevents double entry – try after 5 min or completion`);
          } else {
            // Release the check lock – will be re-acquired by job
            const ld = await lockCheck.json();
            if (ld.lock_id) await fetch(`/api/locks?id=${ld.lock_id}`, { method: 'DELETE' }).catch(() => {});
          }
        }

        const jobRes = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_type: backgroundJobType,
            payload: backgroundPayload,
            company_code: companyCode,
            lock_object: lockObject,
            lock_object_id: lockObjectId,
          }),
        });
        const jobData = await jobRes.json();
        if (!jobRes.ok) throw new Error(jobData.error || 'Failed to create background job');
        
        const newJobId = jobData.job_id || jobData.job?.id;
        setJobId(newJobId);
        setShowPopup(true);
        onBackgroundCreated?.(newJobId);
      } catch (e: any) {
        console.error('Auto-promote to background failed:', e.message);
        // Show error – user can retry – number range may have been consumed
        alert(`⚠️ Auto-promote to background failed: ${e.message} – if direct request was aborted, check System Jobs page or list if document created – number range may have been consumed – check FNRC current`);
      }
    }, 10000);

    timerRef.current = promoteTimeout as any;

    try {
      const result = await directFn();
      // Completed within 10 sec – direct success – no background needed
      if (!promoted) {
        clearTimeout(promoteTimeout);
        stopElapsedTimer();
        setIsSubmitting(false);
        onDirectSuccess?.(result);
        return { type: 'direct', result };
      } else {
        // Already promoted – direct result ignored – background job running
        return { type: 'background', jobId };
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        // Aborted due to promote – background job already created – keep submitting true until popup handles
        return { type: 'background', jobId };
      }
      clearTimeout(promoteTimeout);
      stopElapsedTimer();
      setIsSubmitting(false);
      throw e;
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setIsSubmitting(false);
    stopElapsedTimer();
    setJobId(null);
  };

  return {
    isSubmitting,
    setIsSubmitting,
    jobId,
    showPopup,
    setShowPopup,
    lastPage,
    elapsed,
    executeWithAutoPromote,
    closePopup,
    JobPopupComponent: () => (
      <JobPopup jobId={jobId} isOpen={showPopup} onClose={closePopup} lastPage={lastPage} title={jobId ? `Background Job – ${jobId.slice(0,8)} – Auto-promoted after 10 sec` : undefined} />
    ),
  };
}
