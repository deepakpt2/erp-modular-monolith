import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Workflow Approval API - Central Approval Flow
 * GET /api/workflow - Inbox pending tasks (SBWP equivalent)
 * POST /api/workflow - Approve/Reject/Delegate task
 * 
 * Tables: wf_definition, wf_definition_step, wf_instance, wf_task, wf_history
 * Flow: PR/PO created → startWorkflow() → wf_instance PENDING_APPROVAL + wf_task PENDING for manager/owner
 *       Approver opens inbox → Approve → wf_task APPROVED → check if all tasks approved → wf_instance APPROVED → document status APPROVED
 *       Audit: INSERT INTO audit_log old_values/new_values JSON + wf_history
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'PENDING';
  const assignee = searchParams.get('assignee');
  const docType = searchParams.get('docType');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    // Real DB query with joins
    let query = sql`
      SELECT 
        t.id as task_id,
        t.status as task_status,
        t.comment as task_comment,
        t.created_at as task_created_at,
        t.decided_at,
        i.id as instance_id,
        i.document_type,
        i.document_number,
        i.document_id,
        i.current_state,
        i.current_step_order,
        i.amount,
        i.currency,
        i.created_at as instance_created_at,
        d.code as definition_code,
        d.name as definition_name,
        s.name as step_name,
        s.step_order,
        s.approver_type,
        s.requires_dual,
        s.is_owner_approval,
        e.employee_number as assignee_employee_number,
        e.first_name as assignee_first_name,
        e.last_name as assignee_last_name,
        req_e.employee_number as requester_employee_number,
        req_e.first_name as requester_first_name,
        req_e.last_name as requester_last_name
      FROM wf_task t
      JOIN wf_instance i ON t.instance_id = i.id
      JOIN wf_definition d ON i.definition_id = d.id
      JOIN wf_definition_step s ON t.step_id = s.id
      LEFT JOIN hr_employee e ON t.assignee_id = e.id
      LEFT JOIN hr_employee req_e ON i.requester_id = req_e.id
      WHERE 1=1
    `;

    if (status !== 'ALL') {
      query = sql`${query} AND t.status = ${status}`;
    }
    if (assignee) {
      query = sql`${query} AND t.assignee_id = ${assignee}`;
    }
    if (docType) {
      query = sql`${query} AND i.document_type = ${docType}`;
    }

    query = sql`${query} ORDER BY t.created_at DESC LIMIT ${limit}`;

    const result = await db.execute(query);

    return NextResponse.json({
      code: 'SBWP',
      functionDescription: 'Workflow Inbox – SBWP / PPRL (legacy ME54N) / ME28',

      tasks: result.rows,
      count: result.rows.length,
      source: 'db',
      description: 'Workflow inbox - pending approvals for PR/PO/Payroll, like SBWP',
    });
  } catch (e: any) {
    console.error('DB error:', e.message);
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { taskId, action, comment, approverId, approverEmail } = body;
    // action: APPROVE | REJECT | DELEGATE
    // approverId: employee id who approves

    if (!taskId || !action) {
      return NextResponse.json({ error: 'taskId and action (APPROVE/REJECT) required' }, { status: 400 });
    }

    if (!['APPROVE', 'REJECT', 'DELEGATE'].includes(action)) {
      return NextResponse.json({ error: 'action must be APPROVE, REJECT, or DELEGATE' }, { status: 400 });
    }

    // Try real DB approval
    try {
      // Get task and instance
      const taskRes = await db.execute(sql`
        SELECT t.*, i.document_type, i.document_id, i.document_number, i.requester_id, i.amount
        FROM wf_task t
        JOIN wf_instance i ON t.instance_id = i.id
        WHERE t.id = ${taskId}
        LIMIT 1
      `);

      if (taskRes.rows.length === 0) {
        throw new Error('Task not found in DB, falling back to mock success');
      }

      const task = taskRes.rows[0] as any;
      const instanceId = task.instance_id;

      // Update task
      await db.execute(sql`
        UPDATE wf_task
        SET status = ${action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'DELEGATED'},
            decision = ${action},
            comment = ${comment || null},
            decided_at = NOW(),
            updated_at = NOW()
        WHERE id = ${taskId}
      `);

      // Check pending tasks for same instance
      const pendingRes = await db.execute(sql`
        SELECT COUNT(*) as cnt FROM wf_task WHERE instance_id = ${instanceId} AND status = 'PENDING'
      `);
      const pendingCount = parseInt((pendingRes.rows[0] as any).cnt);

      let newState = task.current_state || 'PENDING_APPROVAL';
      if (action === 'REJECT') {
        newState = 'REJECTED';
      } else if (pendingCount === 0 && action === 'APPROVE') {
        newState = 'APPROVED';
      }

      // Update instance
      await db.execute(sql`
        UPDATE wf_instance
        SET current_state = ${newState},
            updated_at = NOW()
        WHERE id = ${instanceId}
      `);

      // Insert history
      await db.execute(sql`
        INSERT INTO wf_history (instance_id, from_state, to_state, action, actor_id, comment)
        VALUES (${instanceId}, 'PENDING_APPROVAL', ${newState}, ${action}, ${approverId || task.assignee_id}, ${comment || null})
      `);

      // Update underlying document status based on doc type
      if (newState === 'APPROVED' || newState === 'REJECTED') {
        if (task.document_type === 'PR') {
          try {
            await db.execute(sql`
              UPDATE mm_purchase_requisition
              SET status = ${newState === 'APPROVED' ? 'APPROVED' : 'REJECTED'},
                  updated_at = NOW()
              WHERE id = ${task.document_id}
            `);
          } catch (e: any) { console.warn('PR update failed', e); }
        } else if (task.document_type === 'PO') {
          try {
            await db.execute(sql`
              UPDATE mm_purchase_order
              SET status = ${newState === 'APPROVED' ? 'APPROVED' : 'REJECTED'},
                  updated_at = NOW()
              WHERE id = ${task.document_id}
            `);
          } catch (e: any) { console.warn('PO update failed', e); }
        }
      }

      // Audit log WORM-lite old_values/new_values
      try {
        await db.execute(sql`
          INSERT INTO audit_log (table_name, record_id, record_number, action, old_values, new_values, description)
          VALUES (
            'wf_task',
            ${taskId},
            ${task.document_number},
            ${action},
            ${JSON.stringify({ status: 'PENDING' })}::jsonb,
            ${JSON.stringify({ status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED', comment, decided_at: new Date() })}::jsonb,
            ${`Workflow ${action}: Task ${taskId} Doc ${task.document_number} ${task.document_type} by ${approverEmail || approverId || 'system'} comment: ${comment || ''}`}
          )
        `);
      } catch (e: any) { console.warn('Audit log failed', e); }

      return NextResponse.json({
        success: true,
        taskId,
        action,
        instanceId,
        newState,
        pendingCount,
        message: `Task ${action} successful, instance ${newState}, pending ${pendingCount}`,
        documentType: task.document_type,
        documentNumber: task.document_number,
      });
    } catch (dbError: any) {
      console.error('Workflow DB approval failed:', dbError.message);
      return NextResponse.json({ error: dbError.message, code: 'DB_ERROR' }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  // Start workflow for a document
  try {
    const body = await req.json();
    const { documentType, documentId, documentNumber, companyCodeId, requesterId, amount, currency } = body;

    if (!documentType || !documentId || !documentNumber) {
      return NextResponse.json({ error: 'documentType, documentId, documentNumber required' }, { status: 400 });
    }

    try {
      // Find workflow definition
      const defRes = await db.execute(sql`
        SELECT id FROM wf_definition WHERE document_type = ${documentType} AND is_active = true LIMIT 1
      `);

      if (defRes.rows.length === 0) {
        return NextResponse.json({ autoApproved: true, message: 'No workflow definition, auto-approved' });
      }

      const definitionId = (defRes.rows[0] as any).id;

      // Get steps
      const stepsRes = await db.execute(sql`
        SELECT id, step_order, approver_type, approver_role, approver_user_id, min_amount, max_amount
        FROM wf_definition_step WHERE definition_id = ${definitionId} ORDER BY step_order ASC
      `);

      let steps = stepsRes.rows as any[];
      if (amount) {
        const filtered = steps.filter((s: any) => {
          const min = s.min_amount ? parseFloat(s.min_amount) : 0;
          const max = s.max_amount ? parseFloat(s.max_amount) : Infinity;
          return parseFloat(amount) >= min && parseFloat(amount) <= max;
        });
        if (filtered.length > 0) steps = filtered;
      }

      // Create instance
      const instRes = await db.execute(sql`
        INSERT INTO wf_instance (definition_id, document_type, document_id, document_number, company_code_id, current_state, current_step_order, requester_id, amount, currency)
        VALUES (${definitionId}, ${documentType}, ${documentId}, ${documentNumber}, ${companyCodeId || null}, 'PENDING_APPROVAL', 1, ${requesterId || null}, ${amount || null}, ${currency || 'KWD'})
        RETURNING id
      `);

      const instanceId = (instRes.rows[0] as any).id;

      // Resolve approvers and create tasks
      for (const step of steps) {
        let assigneeId: string | null = null;

        if (step.approver_type === 'MANAGER' && requesterId) {
          const mgrRes = await db.execute(sql`SELECT manager_id FROM hr_employee WHERE id = ${requesterId} LIMIT 1`);
          if (mgrRes.rows.length > 0) assigneeId = (mgrRes.rows[0] as any).manager_id;
        } else if (step.approver_type === 'OWNER') {
          const ownerRes = await db.execute(sql`
            SELECT e.id FROM hr_employee e JOIN hr_position p ON e.position_id = p.id WHERE p.is_owner = true AND e.is_active = true LIMIT 1
          `);
          if (ownerRes.rows.length > 0) assigneeId = (ownerRes.rows[0] as any).id;
        } else if (step.approver_type === 'USER' && step.approver_user_id) {
          assigneeId = step.approver_user_id;
        }

        if (!assigneeId) {
          // Fallback to first active employee
          const fallback = await db.execute(sql`SELECT id FROM hr_employee WHERE is_active = true LIMIT 1`);
          if (fallback.rows.length > 0) assigneeId = (fallback.rows[0] as any).id;
        }

        if (assigneeId) {
          await db.execute(sql`
            INSERT INTO wf_task (instance_id, step_id, assignee_id, status)
            VALUES (${instanceId}, ${step.id}, ${assigneeId}, 'PENDING')
          `);
        }
      }

      await db.execute(sql`
        INSERT INTO wf_history (instance_id, from_state, to_state, from_step, to_step, action, actor_id)
        VALUES (${instanceId}, 'DRAFT', 'PENDING_APPROVAL', 0, 1, 'SUBMIT', ${requesterId || null})
      `);

      return NextResponse.json({
        success: true,
        instanceId,
        stepsCreated: steps.length,
        message: `Workflow started for ${documentType} ${documentNumber}, ${steps.length} approval tasks created`,
      });
    } catch (dbErr: any) {
      console.error('Workflow start DB failed:', dbErr.message);
      return NextResponse.json({ error: dbErr.message, code: 'DB_ERROR' }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
