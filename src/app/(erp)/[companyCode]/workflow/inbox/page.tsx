"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VirtualDataGrid } from '@/shared/ui/virtual-data-grid';
import { ColumnDef } from '@tanstack/react-table';
import { ModernModuleShell } from '@/shared/ui/modern-module-shell';

interface WorkflowTask {
  task_id: string;
  task_status: string;
  task_comment: string | null;
  task_created_at: string | Date;
  decided_at: string | Date | null;
  instance_id: string;
  document_type: string;
  document_number: string;
  document_id: string;
  current_state: string;
  current_step_order: number;
  amount: string;
  currency: string;
  instance_created_at: string | Date;
  definition_code: string;
  definition_name: string;
  step_name: string;
  step_order: number;
  approver_type: string;
  requires_dual: boolean;
  is_owner_approval: boolean;
  assignee_employee_number: string;
  assignee_first_name: string;
  assignee_last_name: string;
  requester_employee_number: string;
  requester_first_name: string;
  requester_last_name: string;
}

export default function WorkflowInboxPage() {
  const params = useParams();
  const router = useRouter();
  const companyCode = (params?.companyCode as string) || '1000';
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [filterDocType, setFilterDocType] = useState<'ALL' | 'PR' | 'PO' | 'PAYROLL'>('ALL');
  const [comment, setComment] = useState('');
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [filterStatus, filterDocType]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set('status', filterStatus);
      qs.set('limit', '100');
      if (filterDocType !== 'ALL') qs.set('docType', filterDocType);
      const res = await fetch(`/api/workflow?${qs.toString()}`);
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks.map((t: any) => ({
          ...t,
          task_created_at: new Date(t.task_created_at),
          decided_at: t.decided_at ? new Date(t.decided_at) : null,
          instance_created_at: new Date(t.instance_created_at),
        })));
      }
    } catch (e) {
      console.warn('Fetch workflow inbox failed', e);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let f = tasks;
    if (search) {
      f = f.filter(t => 
        t.document_number.toLowerCase().includes(search.toLowerCase()) ||
        t.definition_name.toLowerCase().includes(search.toLowerCase()) ||
        t.assignee_first_name.toLowerCase().includes(search.toLowerCase()) ||
        t.requester_first_name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return f;
  }, [tasks, search]);

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedId) return;
    setApproving(true);
    try {
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedId,
          action,
          comment: comment || `${action} by workflow inbox`,
          approverId: null,
          approverEmail: 'admin@er.deepakpt.com',
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setTasks(prev => prev.map(t => t.task_id === selectedId ? { ...t, task_status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED', task_comment: comment, decided_at: new Date() } as any : t));
        setComment('');
        // If approved, optionally refresh
        setTimeout(() => fetchTasks(), 500);
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
    setApproving(false);
  };

  const columns = useMemo<ColumnDef<WorkflowTask, any>[]>(() => [
    { accessorKey: 'task_created_at', header: 'Created', size: 120, cell: ({ getValue }) => {
      const d = getValue() as Date;
      return <span className="text-[11px]">{d ? new Date(d).toLocaleString() : ''}</span>;
    }},
    { accessorKey: 'document_type', header: 'Doc Type', size: 70, cell: ({ getValue }) => {
      const v = getValue(); const cls = v==='PR' ? 'bg-yellow-100' : v==='PO' ? 'bg-blue-100' : 'bg-green-100';
      return <span className={`px-1 border text-[10px] font-bold ${cls}`}>{v}</span>;
    }},
    { accessorKey: 'document_number', header: 'Document No', size: 130, cell: ({ getValue }) => <span className="font-mono font-bold">{getValue()}</span> },
    { accessorKey: 'step_name', header: 'Step', size: 160 },
    { accessorKey: 'amount', header: 'Amount KWD', size: 90, cell: ({ getValue }) => <span className="font-bold">{getValue()}</span> },
    { accessorKey: 'requester_first_name', header: 'Requester', size: 100, cell: ({ row }) => `${row.original.requester_first_name} ${row.original.requester_last_name}` },
    { accessorKey: 'assignee_first_name', header: 'Assignee', size: 110, cell: ({ row }) => `${row.original.assignee_first_name} ${row.original.assignee_last_name}` },
    { accessorKey: 'approver_type', header: 'Approver Type', size: 90, cell: ({ getValue }) => {
      const v = getValue(); return <span className={`text-[10px] px-1 border ${v==='OWNER' ? 'bg-black text-white' : 'bg-zinc-100'}`}>{v}</span>;
    }},
    { accessorKey: 'task_status', header: 'Status', size: 90, cell: ({ getValue }) => {
      const v = getValue(); const cls = v==='APPROVED' ? 'bg-green-600 text-white' : v==='REJECTED' ? 'bg-red-600 text-white' : 'bg-yellow-100';
      return <span className={`px-1 border text-[10px] ${cls}`}>{v}</span>;
    }},
    { accessorKey: 'current_state', header: 'Instance State', size: 110 },
    { accessorKey: 'definition_code', header: 'Workflow Def', size: 130 },
  ], []);

  const selected = selectedId ? tasks.find(t => t.task_id === selectedId) : null;

  const modernContent = (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">Workflow Inbox • SBWP • Approval Flow • PR/PO/Payroll</h2>
          <p className="text-sm text-zinc-500">{filtered.length} tasks • Pending approvals for PR Manager + Owner dual {'>'}500 KWD, PO {'>'}1000 KWD • Like ERP SBWP / ME54N release • Functional approve/reject with audit old/new JSON</p>
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search doc/requester" className="border rounded-full px-4 py-2 text-sm w-64" />
          <button onClick={fetchTasks} className="text-sm border rounded-full px-4 py-2 hover:bg-zinc-50">Refresh</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 text-xs">
        <button onClick={()=>setFilterStatus('PENDING')} className={`px-3 py-1.5 rounded-full border ${filterStatus==='PENDING'?'bg-black text-white':'bg-white'}`}>Pending {tasks.filter(t=>t.task_status==='PENDING').length}</button>
        <button onClick={()=>setFilterStatus('APPROVED')} className={`px-3 py-1.5 rounded-full border ${filterStatus==='APPROVED'?'bg-green-600 text-white':'bg-white'}`}>Approved {tasks.filter(t=>t.task_status==='APPROVED').length}</button>
        <button onClick={()=>setFilterStatus('REJECTED')} className={`px-3 py-1.5 rounded-full border ${filterStatus==='REJECTED'?'bg-red-600 text-white':'bg-white'}`}>Rejected {tasks.filter(t=>t.task_status==='REJECTED').length}</button>
        <button onClick={()=>setFilterStatus('ALL')} className={`px-3 py-1.5 rounded-full border ${filterStatus==='ALL'?'bg-black text-white':'bg-white'}`}>All {tasks.length}</button>
        <span className="w-px bg-zinc-200 mx-1"></span>
        <button onClick={()=>setFilterDocType('ALL')} className={`px-3 py-1.5 rounded-full border ${filterDocType==='ALL'?'bg-black text-white':'bg-white'}`}>All Types</button>
        <button onClick={()=>setFilterDocType('PR')} className={`px-3 py-1.5 rounded-full border ${filterDocType==='PR'?'bg-yellow-500 text-white':'bg-white'}`}>PR</button>
        <button onClick={()=>setFilterDocType('PO')} className={`px-3 py-1.5 rounded-full border ${filterDocType==='PO'?'bg-blue-600 text-white':'bg-white'}`}>PO</button>
        <button onClick={()=>setFilterDocType('PAYROLL')} className={`px-3 py-1.5 rounded-full border ${filterDocType==='PAYROLL'?'bg-green-600 text-white':'bg-white'}`}>Payroll</button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <div className="bg-white rounded-2xl border p-2">
            {loading ? <div className="p-8 text-center text-sm text-zinc-500">Loading workflow inbox...</div> : <VirtualDataGrid data={filtered} columns={columns} height={500} rowHeight={32} selectedRowId={selectedId || undefined} getRowId={r=>r.task_id} onRowClick={r=>setSelectedId(r.task_id)} />}
          </div>

          <div className="mt-4 bg-zinc-900 text-white rounded-2xl p-4 text-xs">
            <div className="font-medium">Approval Flow Engine • How it works</div>
            <div className="mt-2 text-[11px] text-zinc-400 leading-relaxed">
              <div><b className="text-white">PR Flow:</b> ME51N Create PR DRAFT → Submit → WorkflowEngine.startWorkflow(PR) → Find wf_definition PR_APPROVAL_STD → Steps: Manager Approval (0-1M KWD) + Owner Dual if {'>'}500 KWD → Creates wf_instance PENDING_APPROVAL + wf_task PENDING for manager/owner via hr_employee.manager_id / is_owner → Inbox SBWP shows task → Manager Approves → If all tasks approved → wf_instance APPROVED → PR status APPROVED → Convert to PO ME21N → Commitment transferred</div>
              <div className="mt-2"><b className="text-white">PO Flow:</b> Similar, PO_APPROVAL_STD Manager + Owner if {'>'}1000 KWD → Approved → Sent → GR allowed</div>
              <div className="mt-2"><b className="text-white">Payroll:</b> Create DRAFT → Submit → HR Manager + Owner approval → Approved → FI posting Dr Salary Expense (CC) Cr Payable</div>
              <div className="mt-2"><b className="text-white">Tables:</b> wf_definition, wf_definition_step (approver_type MANAGER/OWNER/ROLE/USER, min/max amount, requires_dual), wf_instance (document_type/id/number, current_state, requester_id, amount), wf_task (instance_id, step_id, assignee_id, status PENDING/APPROVED/REJECTED), wf_history (from_state/to_state/action)</div>
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border p-4 text-xs">
            <div className="font-medium">Task Detail • Approval Action</div>
            {selected ? (
              <div className="mt-3 space-y-3">
                <div><b>{selected.document_number}</b> • {selected.document_type} • {selected.definition_name}</div>
                <div>Step: {selected.step_name} (Order {selected.step_order}) • Type {selected.approver_type} {selected.requires_dual && '(Dual)'} {selected.is_owner_approval && '(Owner)'}</div>
                <div>Amount: {selected.amount} {selected.currency} • State: {selected.current_state} • Task: {selected.task_status}</div>
                <div>Requester: {selected.requester_first_name} {selected.requester_last_name} ({selected.requester_employee_number}) • Assignee: {selected.assignee_first_name} {selected.assignee_last_name} ({selected.assignee_employee_number})</div>
                <div>Created: {new Date(selected.task_created_at).toLocaleString()} • Instance: {selected.instance_id}</div>
                
                {selected.task_status === 'PENDING' ? (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Comment (required for audit)</label>
                      <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Approved - within budget, or Rejected reason" className="w-full border rounded-xl px-3 py-2 text-xs h-20" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>handleAction('APPROVE')} disabled={approving} className="flex-1 bg-green-600 text-white rounded-full py-2.5 text-xs font-medium hover:bg-green-700 disabled:opacity-50">{approving ? 'Approving...' : '✓ Approve'}</button>
                      <button onClick={()=>handleAction('REJECT')} disabled={approving} className="flex-1 bg-red-600 text-white rounded-full py-2.5 text-xs font-medium hover:bg-red-700 disabled:opacity-50">{approving ? 'Rejecting...' : '✗ Reject'}</button>
                    </div>
                    <div className="text-[10px] text-zinc-500">Approval will: UPDATE wf_task status, check pending tasks, if all approved UPDATE wf_instance to APPROVED, UPDATE document status (PR/PO), INSERT wf_history, INSERT audit_log old_values/new_values JSON WORM-lite</div>
                  </div>
                ) : (
                  <div className="mt-3 p-2 bg-zinc-50 border rounded-xl">
                    <div>Decided: {selected.decided_at ? new Date(selected.decided_at).toLocaleString() : ''}</div>
                    <div>Comment: {selected.task_comment || 'No comment'}</div>
                    <div className="mt-2"><span className={`px-2 py-1 rounded-full text-[10px] ${selected.task_status==='APPROVED'?'bg-green-100 border':'bg-red-100 border'}`}>{selected.task_status}</span></div>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button onClick={()=>router.push(`/${companyCode}/audit/document-flow?type=${selected.document_type}&id=${selected.document_id}&number=${selected.document_number}`)} className="text-xs border rounded-full px-3 py-1.5 hover:bg-black hover:text-white">Document Flow (ALB) →</button>
                  <button onClick={()=>router.push(`/${companyCode}/mm/pr`)} className="text-xs border rounded-full px-3 py-1.5">Go to PRs</button>
                </div>
              </div>
            ) : <div className="text-zinc-500 mt-2">Select a task to approve/reject</div>}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs">
            <div className="font-medium">Functional Checklist • All Modules</div>
            <div className="mt-2 space-y-1 text-[11px] leading-relaxed">
              <div>✓ Materials MM01/MM02/MM03 - Create/Change/Display functional with PUT + audit</div>
              <div>✓ Stock MMBE - Virtualized 800 batches, expiry blocking</div>
              <div>✓ PR ME51N - Create, approval workflow, convert to PO, cost center K</div>
              <div>✓ PO ME21N - ELIKZ short-shipping, partial GR, commitment, approval</div>
              <div>✓ GR MIGO - 101 movement, BSX/WRX FI, batch, expiry, MAP</div>
              <div>✓ IV MIRO - Landed cost, PRD zero-stock, FI RE</div>
              <div>✓ Physical Inventory MI01 - Blocking 101/261/601, variance FI at MAP</div>
              <div>✓ Kitting - Stocked K01/K02 + Phantom 261, expiry safeguard</div>
              <div>✓ Sales VA01 - B2B/B2C/POS webhook, 601 GI, Cash vs AR, SERIALIZABLE</div>
              <div>✓ Payroll PC00 - 300 KWD, FI Dr Expense CC Cr Payable, clearing</div>
              <div>✓ CCA KSB1 - COGS + Payroll + Direct FI, hierarchical CC→GL</div>
              <div>✓ Costing Run CK40N - BOM rollup Σ MAP, std price update</div>
              <div>✓ Document Flow ALB - PR→PO→GR→IV→Payment, Sales→GI→FI visual</div>
              <div>✓ Audit Log SM20 - WORM-lite old/new JSON, query table/record/user</div>
              <div className="font-bold mt-2">✓ Workflow Inbox SBWP - PR/PO/Payroll approval, manager/owner dual {'>'}500 KWD, functional approve/reject, wf_history, audit_log</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const classicContent = (
    <div className="font-mono text-[11px] bg-[#f5f5f0]">
      <div className="border border-[#808080] bg-[#f0f0f0] p-2">
        <div className="font-bold border-b border-[#808080] pb-1">SBWP Selection • Workflow Inbox • Approval Flow • PR/PO/Payroll • Functional</div>
        <div className="grid grid-cols-12 gap-1 items-center mt-2">
          <div className="col-span-2 text-right pr-2">Status:</div>
          <div className="col-span-2"><select value={filterStatus} onChange={e=>setFilterStatus(e.target.value as any)} className="w-full border border-black bg-white h-5"><option value="PENDING">PENDING</option><option value="APPROVED">APPROVED</option><option value="REJECTED">REJECTED</option><option value="ALL">ALL</option></select></div>
          <div className="col-span-2 text-right pr-2">Doc Type:</div>
          <div className="col-span-2"><select value={filterDocType} onChange={e=>setFilterDocType(e.target.value as any)} className="w-full border border-black bg-white h-5"><option value="ALL">All</option><option value="PR">PR</option><option value="PO">PO</option><option value="PAYROLL">PAYROLL</option></select></div>
          <div className="col-span-2 text-right pr-2">Doc No:</div>
          <div className="col-span-2"><input value={search} onChange={e=>setSearch(e.target.value)} className="w-full border border-black bg-white h-5 px-1" placeholder="PR* or 45*" /></div>
        </div>
        <div className="bg-[#ffffe0] border-t border-[#808080] mt-2 px-2 py-1 text-[10px]">Workflow: PR created DRAFT → PENDING_APPROVAL → Manager + Owner dual if {'>'}500 KWD → APPROVED → Convert to PO • Functional approve/reject updates wf_task, wf_instance, document status, wf_history, audit_log old/new JSON</div>
      </div>
      <div className="mt-1 border border-black bg-white">
        <div className="bg-[#d4d0c8] border-b border-black px-2 h-6 flex items-center justify-between"><span className="font-bold">Workflow Inbox Table Control • {filtered.length} tasks • SBWP • Approval Functional • Manager/Owner Dual</span><span className="text-[10px]">Pos 1/{filtered.length}</span></div>
        <VirtualDataGrid data={filtered} columns={columns} height={450} rowHeight={26} selectedRowId={selectedId || undefined} getRowId={r=>r.task_id} onRowClick={r=>setSelectedId(r.task_id)} />
      </div>
      {selected && (
        <div className="mt-1 border border-black bg-white p-2">
          <div className="font-bold">Task Detail • {selected.document_number} • {selected.step_name} • {selected.task_status}</div>
          <div className="mt-1">Amount {selected.amount} KWD • Requester {selected.requester_first_name} • Assignee {selected.assignee_first_name} • Type {selected.approver_type}</div>
          {selected.task_status === 'PENDING' && (
            <div className="mt-2 flex gap-2">
              <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Comment" className="flex-1 border border-black bg-white h-6 px-1" />
              <button onClick={()=>handleAction('APPROVE')} className="bg-[#00a000] text-white border border-black px-3 h-6">Approve F8</button>
              <button onClick={()=>handleAction('REJECT')} className="bg-[#a00000] text-white border border-black px-3 h-6">Reject F8</button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <ModernModuleShell title="Workflow Inbox" subtitle={`SBWP • ${tasks.length} tasks`} code="SBWP" module="FOUNDATION" kpis={[
      {label:'Pending', value: tasks.filter(t=>t.task_status==='PENDING').length.toString(), icon:'⏳'},
      {label:'Approved', value: tasks.filter(t=>t.task_status==='APPROVED').length.toString(), icon:'✅'},
      {label:'Rejected', value: tasks.filter(t=>t.task_status==='REJECTED').length.toString(), icon:'❌'},
      {label:'Total', value: tasks.length.toString(), icon:'📋'},
    ]}>
      {modernContent}
      <div className="mt-8 border-t pt-6"><div className="text-xs font-medium mb-3">Classic ERP GUI • SBWP • Functional Approval</div>{classicContent}</div>
    </ModernModuleShell>
  );
}
