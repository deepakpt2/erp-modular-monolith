import { pgTable, varchar, boolean, timestamp, uuid, text, numeric, pgEnum, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { entMaterialMaster, entPlant, entStorageLocation, entBatch } from '../../enterprise/infrastructure/schema';

export const piStatusEnum = pgEnum('pi_status', ['CREATED', 'COUNT_ENTERED', 'POSTED', 'CANCELLED']);
export const piLineStatusEnum = pgEnum('pi_line_status', ['PENDING', 'COUNTED', 'POSTED', 'BLOCKED']);

export const piDocument = pgTable('pi_document', {
  id: uuid('id').primaryKey().defaultRandom(),
  piNumber: varchar('pi_number', { length: 20 }).notNull().unique(), // Number range PI
  companyCodeId: uuid('company_code_id').notNull(),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  slocId: uuid('sloc_id').notNull().references(() => entStorageLocation.id),
  status: piStatusEnum('status').notNull().default('CREATED'),
  postingDate: timestamp('posting_date').notNull(),
  plannedCountDate: timestamp('planned_count_date').notNull(),
  headerText: text('header_text'),
  // Blocking flag - when active, block 101/261/601 for materials in this PID
  isBlockingActive: boolean('is_blocking_active').notNull().default(true),
  // Totals
  totalLines: integer('total_lines').notNull().default(0),
  countedLines: integer('counted_lines').notNull().default(0),
  totalSystemQty: numeric('total_system_qty', { precision: 15, scale: 3 }).default('0'),
  totalCountedQty: numeric('total_counted_qty', { precision: 15, scale: 3 }).default('0'),
  totalVarianceQty: numeric('total_variance_qty', { precision: 15, scale: 3 }).default('0'),
  totalVarianceValue: numeric('total_variance_value', { precision: 15, scale: 3 }).default('0'),
  fiDocumentId: uuid('fi_document_id'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxPlantSloc: index('idx_pi_plant_sloc').on(t.plantId, t.slocId),
  idxStatus: index('idx_pi_status').on(t.status),
  idxPostingDate: index('idx_pi_posting_date').on(t.postingDate),
}));

export const piLine = pgTable('pi_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  piDocumentId: uuid('pi_document_id').notNull().references(() => piDocument.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  batchId: uuid('batch_id').references(() => entBatch.id),
  batchNumber: varchar('batch_number', { length: 30 }),
  stockStatus: varchar('stock_status', { length: 20 }).notNull().default('UNRESTRICTED'),
  // System qty at time of PID creation (snapshot)
  systemQty: numeric('system_qty', { precision: 15, scale: 3 }).notNull(),
  systemValue: numeric('system_value', { precision: 15, scale: 3 }).notNull().default('0'),
  unitCost: numeric('unit_cost', { precision: 15, scale: 4 }).notNull().default('0'), // MAP at creation
  // Counted qty entered by user
  countedQty: numeric('counted_qty', { precision: 15, scale: 3 }),
  // Variance calculated
  varianceQty: numeric('variance_qty', { precision: 15, scale: 3 }),
  varianceValue: numeric('variance_value', { precision: 15, scale: 3 }),
  // Status
  status: piLineStatusEnum('status').notNull().default('PENDING'),
  isCounted: boolean('is_counted').default(false).notNull(),
  // Ledger links for posting
  stockLedgerId: uuid('stock_ledger_id'),
  // Expiry for display
  expiryDate: timestamp('expiry_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxPiDoc: index('idx_pi_line_doc').on(t.piDocumentId),
  idxMaterial: index('idx_pi_line_mat').on(t.materialId),
  uniquePiLine: uniqueIndex('uq_pi_line').on(t.piDocumentId, t.lineNumber),
}));

// For audit trail of counts (multiple counts per line if needed)
export const piCountEntry = pgTable('pi_count_entry', {
  id: uuid('id').primaryKey().defaultRandom(),
  piLineId: uuid('pi_line_id').notNull().references(() => piLine.id, { onDelete: 'cascade' }),
  countedQty: numeric('counted_qty', { precision: 15, scale: 3 }).notNull(),
  countedBy: uuid('counted_by'),
  countedAt: timestamp('counted_at').defaultNow().notNull(),
  notes: text('notes'),
}, (t) => ({
  idxPiLine: index('idx_pi_count_line').on(t.piLineId),
}));
