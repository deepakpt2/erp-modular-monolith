import { pgTable, varchar, numeric, timestamp, uuid, pgEnum, text, index, uniqueIndex, integer } from 'drizzle-orm/pg-core';
import { entMaterialMaster, entPlant, entStorageLocation, entBatch } from '../../enterprise/infrastructure/schema';

export const stockStatusEnum = pgEnum('stock_status', [
  'UNRESTRICTED',
  'QUALITY_INSPECTION',
  'BLOCKED',
  'RETURNS',
  'IN_TRANSIT'
]);

export const movementTypeEnum = pgEnum('movement_type', [
  '101', // GR for PO
  '102', // GR reversal
  '122', // Return to vendor
  '261', // GI for production order
  '262', // GI reversal
  '311', // Transfer plant to plant
  '321', // QI -> Unrestricted
  '322', // QI -> Blocked
  '343', // Blocked -> Unrestricted
  '344', // Unrestricted -> Blocked
  '350', // QI -> Blocked (scrap)
  '453', // Yield from production
  '551', // Scrap / Spoilage
  '561', // Initial stock upload
  '601', // GI for sales / POS
  'K01', // Kitting consumption
  'K02', // Kitting production
]);

export const invStock = pgTable('inv_stock', {
  id: uuid('id').primaryKey().defaultRandom(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  slocId: uuid('sloc_id').notNull().references(() => entStorageLocation.id),
  batchId: uuid('batch_id').references(() => entBatch.id), // Nullable for non-batch materials
  stockStatus: stockStatusEnum('stock_status').notNull().default('UNRESTRICTED'),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull().default('0'),
  reservedQty: numeric('reserved_qty', { precision: 15, scale: 3 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueStock: uniqueIndex('uq_stock_mat_plant_sloc_batch_status').on(t.materialId, t.plantId, t.slocId, t.batchId, t.stockStatus),
  idxMaterialPlant: index('idx_stock_mat_plant').on(t.materialId, t.plantId),
  idxBatch: index('idx_stock_batch').on(t.batchId),
  idxStatus: index('idx_stock_status').on(t.stockStatus),
}));

// Immutable ledger - WORM-like for audit
export const invStockLedger = pgTable('inv_stock_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  movementType: movementTypeEnum('movement_type').notNull(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  slocId: uuid('sloc_id').notNull().references(() => entStorageLocation.id),
  batchId: uuid('batch_id').references(() => entBatch.id),
  stockStatusFrom: stockStatusEnum('stock_status_from'),
  stockStatusTo: stockStatusEnum('stock_status_to').notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(), // Positive = receipt, Negative = issue
  quantityBefore: numeric('quantity_before', { precision: 15, scale: 3 }).notNull(),
  quantityAfter: numeric('quantity_after', { precision: 15, scale: 3 }).notNull(),
  // Valuation
  unitCost: numeric('unit_cost', { precision: 15, scale: 4 }).notNull().default('0'),
  totalValue: numeric('total_value', { precision: 15, scale: 3 }).notNull().default('0'),
  totalValueBefore: numeric('total_value_before', { precision: 15, scale: 3 }).notNull().default('0'),
  totalValueAfter: numeric('total_value_after', { precision: 15, scale: 3 }).notNull().default('0'),
  // Reference
  referenceDocType: varchar('reference_doc_type', { length: 20 }).notNull(), // PO, PROD_ORDER, SALES
  referenceDocId: uuid('reference_doc_id'),
  referenceDocNumber: varchar('reference_doc_number', { length: 30 }),
  referenceDocLine: integer('reference_doc_line'),
  // Audit
  postedBy: uuid('posted_by'), // FK to user
  postedAt: timestamp('posted_at').defaultNow().notNull(),
  headerText: text('header_text'),
  isReversed: varchar('is_reversed', { length: 1 }).default('N'),
  reversalOfId: uuid('reversal_of_id').references((): any => invStockLedger.id),
}, (t) => ({
  idxMatPlantDate: index('idx_ledger_mat_plant_date').on(t.materialId, t.plantId, t.postedAt),
  idxRefDoc: index('idx_ledger_ref_doc').on(t.referenceDocType, t.referenceDocNumber),
  idxMovement: index('idx_ledger_movement').on(t.movementType),
}));

// View for PP consumption - only unrestricted
// This will be created as a real SQL view in migration, but we document here
// CREATE VIEW inv_unrestricted_stock AS SELECT * FROM inv_stock WHERE stock_status='UNRESTRICTED' AND quantity > 0 AND (batch expiry > now OR batch_id IS NULL)
