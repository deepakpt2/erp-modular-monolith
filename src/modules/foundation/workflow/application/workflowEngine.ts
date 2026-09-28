/**
 * Central Workflow Engine - State Machine Interceptor
 * Checks HR hierarchy and routes documents through approval states
 */
import { db, withTransaction } from '@/shared/kernel/db/client';

export interface WorkflowTrigger {
  documentType: 'PR' | 'PO' | 'GR' | 'IV' | 'PROD_ORDER' | 'PAYROLL' | 'MATERIAL' | 'VENDOR';
  documentId: string;
  documentNumber: string;
  companyCodeId: string;
  requesterId: string; // employee id
  amount?: number;
  currency?: string;
}

export class WorkflowEngine {
  /**
   * Triggered after document save (e.g., PR creation)
   * Finds applicable workflow definition and creates instance + tasks
   */
  static async startWorkflow(trigger: WorkflowTrigger) {
    return withTransaction(async (tx) => {
      // 1. Find active workflow definition for document type
      const defResult = await tx.execute(`
        SELECT id, code, name
        FROM wf_definition
        WHERE document_type = $1 AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1
      ` as any);

      if (!defResult.rows || defResult.rows.length === 0) {
        // No workflow defined = auto approve
        return { autoApproved: true };
      }

      const definition = defResult.rows[0] as any;

      // 2. Get steps for definition
      const stepsResult = await tx.execute(`
        SELECT id, step_order, approver_type, approver_role, approver_user_id, min_amount, max_amount, requires_dual, is_owner_approval
        FROM wf_definition_step
        WHERE definition_id = $1
        ORDER BY step_order ASC
      ` as any);

      const steps = stepsResult.rows as any[];

      // 3. Filter steps by amount threshold (value-based matrix)
      let applicableSteps = steps;
      if (trigger.amount) {
        applicableSteps = steps.filter((s) => {
          const min = s.min_amount ? parseFloat(s.min_amount) : 0;
          const max = s.max_amount ? parseFloat(s.max_amount) : Infinity;
          return trigger.amount! >= min && trigger.amount! <= max;
        });
        if (applicableSteps.length === 0) applicableSteps = steps; // Fallback to all if no threshold match
      }

      // 4. Resolve approvers via HR hierarchy
      const instanceResult = await tx.execute(`
        INSERT INTO wf_instance (definition_id, document_type, document_id, document_number, company_code_id, current_state, current_step_order, requester_id, amount, currency)
        VALUES ($1,$2,$3,$4,$5,'PENDING_APPROVAL', $6, $7, $8, $9)
        RETURNING id
      ` as any);

      const instanceId = (instanceResult.rows[0] as any).id;

      for (const step of applicableSteps) {
        let assigneeId: string | null = null;

        if (step.approver_type === 'MANAGER') {
          // Get manager of requester
          const mgrResult = await tx.execute(`
            SELECT manager_id FROM hr_employee WHERE id = $1
          ` as any);
          assigneeId = (mgrResult.rows[0] as any)?.manager_id || null;
        } else if (step.approver_type === 'OWNER') {
          // Find owner position
          const ownerResult = await tx.execute(`
            SELECT e.id
            FROM hr_employee e
            JOIN hr_position p ON e.position_id = p.id
            WHERE p.is_owner = true AND e.is_active = true
            LIMIT 1
          ` as any);
          assigneeId = (ownerResult.rows[0] as any)?.id || null;
        } else if (step.approver_type === 'USER' && step.approver_user_id) {
          assigneeId = step.approver_user_id;
        } else if (step.approver_type === 'ROLE' && step.approver_role) {
          // Find first employee with role (simplified - in real would check user roles)
          const roleResult = await tx.execute(`
            SELECT e.id
            FROM hr_employee e
            JOIN auth_user u ON e.user_id = u.id
            WHERE u.role = $1 AND e.is_active = true
            LIMIT 1
          ` as any);
          assigneeId = (roleResult.rows[0] as any)?.id || null;
        }

        if (!assigneeId) continue; // Skip if no assignee found

        await tx.execute(`
          INSERT INTO wf_task (instance_id, step_id, assignee_id, status)
          VALUES ($1,$2,$3,'PENDING')
        ` as any);
      }

      await tx.execute(`
        INSERT INTO wf_history (instance_id, from_state, to_state, from_step, to_step, action, actor_id)
        VALUES ($1, 'DRAFT', 'PENDING_APPROVAL', 0, 1, 'SUBMIT', $2)
      ` as any);

      return { instanceId, autoApproved: false, stepsCreated: applicableSteps.length };
    });
  }

  static async approveTask(taskId: string, approverEmployeeId: string, comment?: string) {
    return withTransaction(async (tx) => {
      await tx.execute(`
        UPDATE wf_task
        SET status = 'APPROVED', decision = 'APPROVED', comment = $1, decided_at = NOW(), updated_at = NOW()
        WHERE id = $2
      ` as any);

      // Check if all tasks for current step are approved
      const pendingResult = await tx.execute(`
        SELECT COUNT(*) as count
        FROM wf_task t
        JOIN wf_instance i ON t.instance_id = i.id
        WHERE i.id = (SELECT instance_id FROM wf_task WHERE id = $1)
          AND t.status = 'PENDING'
      ` as any);

      const pendingCount = parseInt((pendingResult.rows[0] as any).count);

      if (pendingCount === 0) {
        // Move to next step or complete
        await tx.execute(`
          UPDATE wf_instance
          SET current_state = 'APPROVED', updated_at = NOW()
          WHERE id = (SELECT instance_id FROM wf_task WHERE id = $1)
        ` as any);

        await tx.execute(`
          INSERT INTO wf_history (instance_id, from_state, to_state, action, actor_id, comment)
          VALUES ((SELECT instance_id FROM wf_task WHERE id = $1), 'PENDING_APPROVAL', 'APPROVED', 'APPROVE', $2, $3)
        ` as any);
      }

      return { approved: true };
    });
  }
}
