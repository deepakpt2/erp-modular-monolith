import { pgTable, varchar, integer, boolean, timestamp, uuid, pgEnum, bigint, text } from 'drizzle-orm/pg-core';

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

export const entNumberRange = pgTable('core_number_range', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().default('01'),
  objectType: varchar('object_type', { length: 50 }).notNull(),
  companyCode: varchar('company_code', { length: 20 }),
  plantCode: varchar('plant_code', { length: 20 }),
  controllingAreaCode: varchar('controlling_area_code', { length: 20 }),
  scopeLevel: varchar('scope_level', { length: 30 }).default('GLOBAL'),
  companyCodeId: uuid('company_code_id'),
  fiscalYear: integer('fiscal_year'),
  year: integer('year'),
  prefix: varchar('prefix', { length: 20 }).notNull().default(''),
  fromNumber: bigint('from_number', { mode: 'number' }).notNull(),
  toNumber: bigint('to_number', { mode: 'number' }).notNull(),
  currentNumber: bigint('current_number', { mode: 'number' }).notNull().default(0),
  description: text('description'),
  isBuffered: boolean('is_buffered').default(false).notNull(),
  bufferSize: integer('buffer_size').default(10),
  isExternal: boolean('is_external').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const entNumberRangeBuffer = pgTable('core_number_range_buffer', {
  id: uuid('id').primaryKey().defaultRandom(),
  numberRangeId: uuid('number_range_id').notNull().references(() => entNumberRange.id),
  bufferedNumber: bigint('buffered_number', { mode: 'number' }).notNull(),
  isConsumed: boolean('is_consumed').default(false).notNull(),
  consumedAt: timestamp('consumed_at'),
  consumedByDoc: varchar('consumed_by_doc', { length: 50 }),
});
