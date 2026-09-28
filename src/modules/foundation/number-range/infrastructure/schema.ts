import { pgTable, varchar, integer, boolean, timestamp, uuid, pgEnum, uniqueIndex, bigint } from 'drizzle-orm/pg-core';

export const numberRangeObjectTypeEnum = pgEnum('nr_object_type', [
  'MATERIAL',
  'BP',
  'BATCH',
  'PR',
  'PO',
  'GR',
  'IV',
  'PROD_ORDER',
  'FI_DOC',
  'FI_DOC_50',
  'FI_DOC_51',
  'FI_DOC_52',
  'FI_DOC_53',
  'FI_DOC_54',
  'PAYROLL',
  'SALES_ORDER',
  'KITTING_ORDER',
  'PI',
  'COSTING_RUN'
]);

export const entNumberRange = pgTable('ent_number_range', {
  id: uuid('id').primaryKey().defaultRandom(),
  objectType: numberRangeObjectTypeEnum('object_type').notNull(),
  companyCodeId: uuid('company_code_id'), // Nullable for global ranges
  year: integer('year').notNull(), // e.g., 2026 for yearly reset
  prefix: varchar('prefix', { length: 10 }).notNull().default(''),
  fromNumber: bigint('from_number', { mode: 'number' }).notNull(),
  toNumber: bigint('to_number', { mode: 'number' }).notNull(),
  currentNumber: bigint('current_number', { mode: 'number' }).notNull().default(0),
  isBuffered: boolean('is_buffered').default(false).notNull(),
  bufferSize: integer('buffer_size').default(10),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueRange: uniqueIndex('uq_nr_obj_co_year').on(t.objectType, t.companyCodeId, t.year),
}));

export const entNumberRangeBuffer = pgTable('ent_number_range_buffer', {
  id: uuid('id').primaryKey().defaultRandom(),
  numberRangeId: uuid('number_range_id').notNull().references(() => entNumberRange.id),
  bufferedNumber: bigint('buffered_number', { mode: 'number' }).notNull(),
  isConsumed: boolean('is_consumed').default(false).notNull(),
  consumedAt: timestamp('consumed_at'),
  consumedByDoc: varchar('consumed_by_doc', { length: 50 }),
});
