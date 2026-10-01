import { pgTable, varchar, timestamp, uuid, text, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';

export const jobStatusEnum = pgEnum('job_status', ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']);
export const jobTypeEnum = pgEnum('job_type', ['PAYROLL_RUN', 'COSTING_RUN', 'MRP_RUN', 'BOM_ROLLUP', 'STOCK_REVAL', 'FI_CLOSE']);

export const entJobQueue = pgTable('core_job_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobType: jobTypeEnum('job_type').notNull(),
  payload: jsonb('payload').notNull(),
  status: jobStatusEnum('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  startedAt: timestamp('started_at'),
  finishedAt: timestamp('finished_at'),
  error: text('error'),
  result: jsonb('result'),
  createdBy: uuid('created_by'),
  companyCodeId: uuid('company_code_id'),
}, (t) => ({
  idxStatus: index('idx_job_status').on(t.status),
  idxType: index('idx_job_type').on(t.jobType),
  idxCreated: index('idx_job_created').on(t.createdAt),
}));
