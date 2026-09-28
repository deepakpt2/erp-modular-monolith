import { pgTable, varchar, boolean, timestamp, uuid, text, numeric, pgEnum, integer, index, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';
import { entMaterialMaster, entPlant } from '../../foundation/enterprise/infrastructure/schema';

export const costingRunStatusEnum = pgEnum('costing_run_status', ['DRAFT', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']);
export const costingRunTypeEnum = pgEnum('costing_run_type', ['STANDARD', 'SIMULATION']);

export const coCostingRun = pgTable('co_costing_run', {
  id: uuid('id').primaryKey().defaultRandom(),
  runNumber: varchar('run_number', { length: 20 }).notNull().unique(),
  type: costingRunTypeEnum('type').notNull().default('STANDARD'),
  status: costingRunStatusEnum('status').notNull().default('DRAFT'),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  costingDate: timestamp('costing_date').notNull().defaultNow(),
  description: text('description'),
  // Totals
  totalMaterials: integer('total_materials').notNull().default(0),
  totalCosted: integer('total_costed').notNull().default(0),
  totalValue: numeric('total_value', { precision: 15, scale: 3 }).default('0'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (t) => ({
  idxPlant: index('idx_costing_run_plant').on(t.plantId),
  idxStatus: index('idx_costing_run_status').on(t.status),
}));

export const coCostingRunLine = pgTable('co_costing_run_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  costingRunId: uuid('costing_run_id').notNull().references(() => coCostingRun.id, { onDelete: 'cascade' }),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  bomHeaderId: uuid('bom_header_id'), // Active BOM used
  // Costs
  totalCost: numeric('total_cost', { precision: 15, scale: 4 }).notNull().default('0'),
  materialCost: numeric('material_cost', { precision: 15, scale: 4 }).notNull().default('0'), // Sum of components MAP
  laborCost: numeric('labor_cost', { precision: 15, scale: 4 }).notNull().default('0'),
  overheadCost: numeric('overhead_cost', { precision: 15, scale: 4 }).notNull().default('0'),
  // Previous and new standard price
  previousStandardPrice: numeric('previous_standard_price', { precision: 15, scale: 4 }).notNull().default('0'),
  newStandardPrice: numeric('new_standard_price', { precision: 15, scale: 4 }).notNull().default('0'),
  priceDifference: numeric('price_difference', { precision: 15, scale: 4 }).notNull().default('0'),
  // BOM explosion details JSON
  bomExplosion: jsonb('bom_explosion').$type<{
    componentMaterialId: string;
    materialNumber: string;
    description: string;
    quantity: number;
    uom: string;
    unitCost: number; // MAP
    totalCost: number;
    isPhantom: boolean;
    level: number;
  }[]>(),
  // Status
  isUpdated: boolean('is_updated').default(false).notNull(), // If true, standard price updated in material master
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxRun: index('idx_costing_line_run').on(t.costingRunId),
  idxMaterial: index('idx_costing_line_mat').on(t.materialId),
  uniqueRunMaterial: uniqueIndex('uq_costing_run_mat').on(t.costingRunId, t.materialId),
}));
