import { pgTable, varchar, timestamp, uuid, jsonb, text, pgEnum, index } from 'drizzle-orm/pg-core';

export const auditActionEnum = pgEnum('audit_action', ['INSERT', 'UPDATE', 'DELETE', 'POST', 'REVERSE', 'APPROVE', 'REJECT']);

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: uuid('record_id').notNull(),
  recordNumber: varchar('record_number', { length: 50 }), // e.g., material number, PO number
  action: auditActionEnum('action').notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  changedFields: text('changed_fields').array(),
  changedBy: uuid('changed_by'),
  changedByEmail: varchar('changed_by_email', { length: 100 }),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
  companyCodeId: uuid('company_code_id'),
  transactionId: uuid('transaction_id'), // To group changes in one transaction
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  description: text('description'), // Human readable
}, (t) => ({
  idxTableRecord: index('idx_audit_table_record').on(t.tableName, t.recordId),
  idxChangedAt: index('idx_audit_changed_at').on(t.changedAt),
  idxChangedBy: index('idx_audit_changed_by').on(t.changedBy),
  idxTransaction: index('idx_audit_transaction').on(t.transactionId),
}));

// For financial document audit trail (document flow)
export const auditDocumentFlow = pgTable('audit_document_flow', {
  id: uuid('id').primaryKey().defaultRandom(),
  rootDocumentType: varchar('root_document_type', { length: 20 }).notNull(), // PR
  rootDocumentId: uuid('root_document_id').notNull(),
  rootDocumentNumber: varchar('root_document_number', { length: 50 }).notNull(),
  precedingDocType: varchar('preceding_doc_type', { length: 20 }),
  precedingDocId: uuid('preceding_doc_id'),
  precedingDocNumber: varchar('preceding_doc_number', { length: 50 }),
  succeedingDocType: varchar('succeeding_doc_type', { length: 20 }).notNull(),
  succeedingDocId: uuid('succeeding_doc_id').notNull(),
  succeedingDocNumber: varchar('succeeding_doc_number', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxRoot: index('idx_docflow_root').on(t.rootDocumentType, t.rootDocumentId),
  idxPreceding: index('idx_docflow_preceding').on(t.precedingDocType, t.precedingDocId),
  idxSucceeding: index('idx_docflow_succeeding').on(t.succeedingDocType, t.succeedingDocId),
}));
