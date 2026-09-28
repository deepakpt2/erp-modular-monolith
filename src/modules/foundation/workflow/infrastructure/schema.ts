import { pgTable, varchar, integer, boolean, timestamp, uuid, text, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';

export const wfDocumentTypeEnum = pgEnum('wf_document_type', [
  'PR',
  'PO',
  'GR',
  'IV',
  'PROD_ORDER',
  'PAYROLL',
  'MATERIAL',
  'VENDOR'
]);

export const wfStateEnum = pgEnum('wf_state', [
  'DRAFT',
  'PENDING_APPROVAL',
  'IN_APPROVAL',
  'APPROVED',
  'REJECTED',
  'ESCALATED',
  'CANCELLED'
]);

export const wfTaskStatusEnum = pgEnum('wf_task_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'DELEGATED',
  'ESCALATED'
]);

export const wfApproverTypeEnum = pgEnum('wf_approver_type', [
  'MANAGER',
  'ROLE',
  'USER',
  'OWNER',
  'COST_CENTER_OWNER'
]);

export const wfDefinition = pgTable('wf_definition', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 30 }).notNull().unique(), // PR_APPROVAL_KWD
  name: varchar('name', { length: 100 }).notNull(),
  documentType: wfDocumentTypeEnum('document_type').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  description: text('description'),
  // Conditions as JSON: { "field": "total_amount", "operator": ">", "value": 100 }
  conditions: jsonb('conditions').$type<{
    field: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    value: any;
    logicalOp?: 'AND' | 'OR';
  }[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const wfDefinitionStep = pgTable('wf_definition_step', {
  id: uuid('id').primaryKey().defaultRandom(),
  definitionId: uuid('definition_id').notNull().references(() => wfDefinition.id, { onDelete: 'cascade' }),
  stepOrder: integer('step_order').notNull(), // 1,2,3
  name: varchar('name', { length: 100 }).notNull(), // Manager Approval, Owner Approval
  approverType: wfApproverTypeEnum('approver_type').notNull(),
  approverRole: varchar('approver_role', { length: 50 }), // e.g., 'PURCHASING_MANAGER', 'OWNER'
  approverUserId: uuid('approver_user_id'), // For fixed approver
  minAmount: varchar('min_amount', { length: 20 }), // numeric as string for precision
  maxAmount: varchar('max_amount', { length: 20 }),
  requiresDual: boolean('requires_dual').default(false).notNull(), // For KWD threshold dual approval
  isOwnerApproval: boolean('is_owner_approval').default(false).notNull(),
  slaHours: integer('sla_hours').default(48), // Escalation after
  canDelegate: boolean('can_delegate').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxDefOrder: index('idx_wf_step_def_order').on(t.definitionId, t.stepOrder),
}));

export const wfInstance = pgTable('wf_instance', {
  id: uuid('id').primaryKey().defaultRandom(),
  definitionId: uuid('definition_id').notNull().references(() => wfDefinition.id),
  documentType: wfDocumentTypeEnum('document_type').notNull(),
  documentId: uuid('document_id').notNull(),
  documentNumber: varchar('document_number', { length: 50 }).notNull(),
  companyCodeId: uuid('company_code_id'),
  currentState: wfStateEnum('current_state').notNull().default('PENDING_APPROVAL'),
  currentStepOrder: integer('current_step_order').notNull().default(1),
  requesterId: uuid('requester_id').notNull(), // employee/user who created doc
  amount: varchar('amount', { length: 20 }), // For threshold checks
  currency: varchar('currency', { length: 3 }).default('KWD'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxDoc: index('idx_wf_inst_doc').on(t.documentType, t.documentId),
  idxState: index('idx_wf_inst_state').on(t.currentState),
  idxRequester: index('idx_wf_inst_requester').on(t.requesterId),
}));

export const wfTask = pgTable('wf_task', {
  id: uuid('id').primaryKey().defaultRandom(),
  instanceId: uuid('instance_id').notNull().references(() => wfInstance.id, { onDelete: 'cascade' }),
  stepId: uuid('step_id').notNull().references(() => wfDefinitionStep.id),
  assigneeId: uuid('assignee_id').notNull(), // employee id
  status: wfTaskStatusEnum('status').notNull().default('PENDING'),
  decision: varchar('decision', { length: 20 }), // APPROVED, REJECTED
  comment: text('comment'),
  decidedAt: timestamp('decided_at'),
  delegatedToId: uuid('delegated_to_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxInstance: index('idx_wf_task_inst').on(t.instanceId),
  idxAssignee: index('idx_wf_task_assignee').on(t.assigneeId, t.status),
}));

export const wfHistory = pgTable('wf_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  instanceId: uuid('instance_id').notNull().references(() => wfInstance.id, { onDelete: 'cascade' }),
  fromState: wfStateEnum('from_state'),
  toState: wfStateEnum('to_state').notNull(),
  fromStep: integer('from_step'),
  toStep: integer('to_step'),
  actorId: uuid('actor_id'), // who performed transition
  action: varchar('action', { length: 50 }).notNull(), // SUBMIT, APPROVE, REJECT, ESCALATE
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
