import { pgTable, varchar, boolean, timestamp, uuid, text, numeric, pgEnum, integer, index, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';
import { entMaterialMaster, entPlant } from '../../foundation/enterprise/infrastructure/schema';

export const bomTypeEnum = pgEnum('bom_type', ['STANDARD', 'KIT_STOCKED', 'KIT_PHANTOM']);
export const bomStatusEnum = pgEnum('bom_status', ['DRAFT', 'ACTIVE', 'BLOCKED', 'EXPIRED']);
export const prodOrderTypeEnum = pgEnum('prod_order_type', ['STANDARD', 'KITTING', 'REWORK']);
export const prodOrderStatusEnum = pgEnum('prod_order_status', ['CREATED', 'RELEASED', 'IN_PROCESS', 'CONFIRMED', 'CLOSED', 'CANCELLED']);

export const ppWorkCenter = pgTable('pp_work_center', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(), // e.g., WC-KITCHEN-01
  name: varchar('name', { length: 100 }).notNull(),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  costCenterId: uuid('cost_center_id'), // FK to fin_cost_center
  description: text('description'),
  capacityPerHour: numeric('capacity_per_hour', { precision: 10, scale: 2 }).default('0'),
  // --- Costing rates for labor/overhead - previously costing only material costs ---
  laborRatePerHour: numeric('labor_rate_per_hour', { precision: 15, scale: 4 }).default('0'), // e.g., 5 KWD/h labor
  machineRatePerHour: numeric('machine_rate_per_hour', { precision: 15, scale: 4 }).default('0'), // e.g., 10 KWD/h machine
  overheadRatePercent: numeric('overhead_rate_percent', { precision: 5, scale: 2 }).default('0'), // e.g., 20% overhead
  setupTimeMinutes: integer('setup_time_minutes').default(0), // Setup time per order
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Routings - CA01/CA02/CA03 - Sequence of manufacturing steps ---
export const routingStatusEnum = pgEnum('routing_status', ['DRAFT', 'ACTIVE', 'BLOCKED']);
export const ppRoutingHeader = pgTable('pp_routing_header', {
  id: uuid('id').primaryKey().defaultRandom(),
  routingNumber: varchar('routing_number', { length: 30 }).notNull().unique(), // ROUTING-xxx
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id), // FERT material
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  bomHeaderId: uuid('bom_header_id').references(() => ppBomHeader.id), // Optional link to BOM
  description: varchar('description', { length: 200 }),
  status: routingStatusEnum('status').notNull().default('ACTIVE'),
  version: varchar('version', { length: 10 }).notNull().default('01'),
  lotSizeFrom: numeric('lot_size_from', { precision: 15, scale: 3 }).default('1'),
  lotSizeTo: numeric('lot_size_to', { precision: 15, scale: 3 }).default('999999'),
  validFrom: timestamp('valid_from').defaultNow().notNull(),
  validTo: timestamp('valid_to'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxMaterialPlant: index('idx_routing_mat_plant').on(t.materialId, t.plantId),
  uniqueMatPlantVer: uniqueIndex('uq_routing_mat_plant_ver').on(t.materialId, t.plantId, t.version),
}));

export const ppRoutingLine = pgTable('pp_routing_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  routingHeaderId: uuid('routing_header_id').notNull().references(() => ppRoutingHeader.id, { onDelete: 'cascade' }),
  operationNumber: integer('operation_number').notNull(), // 0010, 0020, 0030 sequence
  workCenterId: uuid('work_center_id').notNull().references(() => ppWorkCenter.id),
  description: varchar('description', { length: 200 }), // e.g., Blending, Packing, QC
  // Times for costing
  setupTimeMinutes: integer('setup_time_minutes').notNull().default(0), // Setup per order
  machineTimeMinutes: integer('machine_time_minutes').notNull().default(0), // Machine time per base qty
  laborTimeMinutes: integer('labor_time_minutes').notNull().default(0), // Labor time per base qty
  // Costing
  baseQuantity: numeric('base_quantity', { precision: 15, scale: 3 }).notNull().default('1'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxRouting: index('idx_routing_line_header').on(t.routingHeaderId),
  uniqueRoutingOp: uniqueIndex('uq_routing_op').on(t.routingHeaderId, t.operationNumber),
}));

// BOM Header - supports both stocked and phantom kits - increased to 30 for FMCG codes
export const ppBomHeader = pgTable('mfg_bom_header', {
  id: uuid('id').primaryKey().defaultRandom(),
  bomNumber: varchar('bom_number', { length: 30 }).notNull().unique(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id), // Parent material (FERT or Kit)
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  type: bomTypeEnum('type').notNull().default('STANDARD'),
  status: bomStatusEnum('status').notNull().default('ACTIVE'),
  version: varchar('version', { length: 10 }).notNull().default('01'),
  baseQuantity: numeric('base_quantity', { precision: 15, scale: 3 }).notNull().default('1'), // e.g., 1 FERT = X ROH
  baseUom: varchar('base_uom', { length: 10 }).notNull(),
  isPhantom: boolean('is_phantom').default(false).notNull(), // If true, explode at prod order confirmation without intermediate stock
  isKit: boolean('is_kit').default(false).notNull(), // If true, this is a stocked kit
  validFrom: timestamp('valid_from').notNull().defaultNow(),
  validTo: timestamp('valid_to'),
  // For stocked kits: inherited expiry logic
  expiryRule: varchar('expiry_rule', { length: 20 }).notNull().default('MIN_COMPONENTS'), // MIN_COMPONENTS, FIXED_DAYS, MANUAL
  fixedShelfLifeDays: integer('fixed_shelf_life_days'), // If FIXED_DAYS
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxMaterialPlant: index('idx_bom_mat_plant').on(t.materialId, t.plantId),
  uniqueMatPlantVersion: uniqueIndex('uq_bom_mat_plant_ver').on(t.materialId, t.plantId, t.version),
}));

export const ppBomLine = pgTable('mfg_bom_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  bomHeaderId: uuid('bom_header_id').notNull().references(() => ppBomHeader.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  componentMaterialId: uuid('component_material_id').notNull().references(() => entMaterialMaster.id), // ROH
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(), // Qty per baseQuantity
  uom: varchar('uom', { length: 10 }).notNull(),
  isBatchTracked: boolean('is_batch_tracked').default(true).notNull(),
  isPhantomExplode: boolean('is_phantom_explode').default(false).notNull(), // If component itself is phantom kit, explode recursively
  scrapFactor: numeric('scrap_factor', { precision: 5, scale: 2 }).default('0'), // % scrap allowance
  workCenterId: uuid('work_center_id').references(() => ppWorkCenter.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxBomHeader: index('idx_bom_line_header').on(t.bomHeaderId),
  uniqueBomLine: uniqueIndex('uq_bom_line').on(t.bomHeaderId, t.lineNumber),
}));

// Production Order - supports standard, kitting, and rework
export const ppProductionOrder = pgTable('pp_production_order', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: varchar('order_number', { length: 20 }).notNull().unique(), // Number range
  type: prodOrderTypeEnum('type').notNull().default('STANDARD'),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id), // What to produce (FERT or Stocked Kit)
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  bomHeaderId: uuid('bom_header_id').references(() => ppBomHeader.id),
  workCenterId: uuid('work_center_id').references(() => ppWorkCenter.id),
  quantityPlanned: numeric('quantity_planned', { precision: 15, scale: 3 }).notNull(),
  quantityYield: numeric('quantity_yield', { precision: 15, scale: 3 }).notNull().default('0'),
  quantityScrap: numeric('quantity_scrap', { precision: 15, scale: 3 }).notNull().default('0'),
  quantityRework: numeric('quantity_rework', { precision: 15, scale: 3 }).notNull().default('0'),
  status: prodOrderStatusEnum('status').notNull().default('CREATED'),
  // For stocked kits: batch to be created
  targetBatchId: uuid('target_batch_id'), // FK to inv_lot
  targetBatchNumber: varchar('target_batch_number', { length: 30 }),
  targetExpiryDate: timestamp('target_expiry_date'), // Calculated as MIN(component expiries)
  plannedStart: timestamp('planned_start'),
  plannedEnd: timestamp('planned_end'),
  actualStart: timestamp('actual_start'),
  actualEnd: timestamp('actual_end'),
  // Cost tracking
  plannedCost: numeric('planned_cost', { precision: 15, scale: 3 }).default('0'),
  actualCost: numeric('actual_cost', { precision: 15, scale: 3 }).default('0'),
  // For kitting: K01/K02 movements
  isKitting: boolean('is_kitting').default(false).notNull(),
  kittingOrderId: uuid('kitting_order_id').references((): any => ppProductionOrder.id), // Self ref for sub-kitting
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxMaterialPlant: index('idx_prod_order_mat_plant').on(t.materialId, t.plantId),
  idxStatus: index('idx_prod_order_status').on(t.status),
  idxType: index('idx_prod_order_type').on(t.type),
}));

export const ppProductionOrderComponent = pgTable('pp_production_order_component', {
  id: uuid('id').primaryKey().defaultRandom(),
  productionOrderId: uuid('production_order_id').notNull().references(() => ppProductionOrder.id, { onDelete: 'cascade' }),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id), // ROH component
  batchId: uuid('batch_id'), // Specific batch issued (FIFO by expiry)
  bomLineId: uuid('bom_line_id').references(() => ppBomLine.id),
  quantityRequired: numeric('quantity_required', { precision: 15, scale: 3 }).notNull(),
  quantityIssued: numeric('quantity_issued', { precision: 15, scale: 3 }).notNull().default('0'),
  quantityScrap: numeric('quantity_scrap', { precision: 15, scale: 3 }).notNull().default('0'),
  uom: varchar('uom', { length: 10 }).notNull(),
  isPhantom: boolean('is_phantom').default(false).notNull(), // If this component is phantom kit, explode
  isBackflushed: boolean('is_backflushed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxProdOrder: index('idx_prod_comp_order').on(t.productionOrderId),
  idxMaterial: index('idx_prod_comp_mat').on(t.materialId),
}));

// Kitting Order specific - extends production order for stocked kits
export const ppKittingOrder = pgTable('pp_kitting_order', {
  id: uuid('id').primaryKey().defaultRandom(),
  kittingNumber: varchar('kitting_number', { length: 20 }).notNull().unique(), // KIT number range
  productionOrderId: uuid('production_order_id').notNull().references(() => ppProductionOrder.id),
  kitMaterialId: uuid('kit_material_id').notNull().references(() => entMaterialMaster.id), // Stocked kit material
  targetBatchId: uuid('target_batch_id').notNull(), // New batch for kit
  targetQuantity: numeric('target_quantity', { precision: 15, scale: 3 }).notNull(),
  // Expiry inheritance
  minComponentExpiry: timestamp('min_component_expiry'), // Calculated MIN expiry
  calculatedExpiry: timestamp('calculated_expiry'), // MIN or FIXED
  // Movements
  k01MovementId: uuid('k01_movement_id'), // Consumption
  k02MovementId: uuid('k02_movement_id'), // Production
  status: prodOrderStatusEnum('status').notNull().default('CREATED'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- MRP - Material Requirements Planning MD01/MD04 ---
export const mrpRunStatusEnum = pgEnum('mrp_run_status', ['DRAFT', 'RUNNING', 'COMPLETED', 'FAILED']);
export const mrpElementTypeEnum = pgEnum('mrp_element_type', ['STOCK', 'SAFETY_STOCK', 'SALES_ORDER', 'PR', 'PO', 'PLANNED_ORDER', 'PROD_ORDER', 'STO']);
export const ppMrpRun = pgTable('pp_mrp_run', {
  id: uuid('id').primaryKey().defaultRandom(),
  mrpNumber: varchar('mrp_number', { length: 20 }).notNull().unique(), // MRP-xxx
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  status: mrpRunStatusEnum('status').notNull().default('DRAFT'),
  // Parameters
  planningHorizonDays: integer('planning_horizon_days').default(30),
  includeSafetyStock: boolean('include_safety_stock').default(true).notNull(),
  includeSalesOrders: boolean('include_sales_orders').default(true).notNull(),
  // Results
  totalMaterials: integer('total_materials').default(0),
  totalShortages: integer('total_shortages').default(0),
  totalPrsGenerated: integer('total_prs_generated').default(0),
  totalPlannedOrdersGenerated: integer('total_planned_orders_generated').default(0),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (t) => ({
  idxPlant: index('idx_mrp_run_plant').on(t.plantId),
  idxStatus: index('idx_mrp_run_status').on(t.status),
}));

export const ppMrpElement = pgTable('pp_mrp_element', {
  id: uuid('id').primaryKey().defaultRandom(),
  mrpRunId: uuid('mrp_run_id').notNull().references(() => ppMrpRun.id, { onDelete: 'cascade' }),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  elementType: mrpElementTypeEnum('element_type').notNull(),
  elementNumber: varchar('element_number', { length: 30 }), // e.g., SO number, PR number, Stock
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(), // Positive = receipt, Negative = requirement
  availableQuantity: numeric('available_quantity', { precision: 15, scale: 3 }).default('0'), // Running available
  date: timestamp('date').notNull(),
  isShortage: boolean('is_shortage').default(false).notNull(),
  // Generated
  generatedPrId: uuid('generated_pr_id'), // If shortage, PR generated
  generatedPlannedOrderId: uuid('generated_planned_order_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxMrpRun: index('idx_mrp_element_run').on(t.mrpRunId),
  idxMaterialPlant: index('idx_mrp_element_mat_plant').on(t.materialId, t.plantId),
}));

// Production Confirmation - Yield and Scrap tracking for cost controlling
export const ppProductionConfirmation = pgTable('pp_production_confirmation', {
  id: uuid('id').primaryKey().defaultRandom(),
  confirmationNumber: varchar('confirmation_number', { length: 20 }).notNull().unique(),
  productionOrderId: uuid('production_order_id').notNull().references(() => ppProductionOrder.id),
  workCenterId: uuid('work_center_id').references(() => ppWorkCenter.id),
  yieldQuantity: numeric('yield_quantity', { precision: 15, scale: 3 }).notNull(),
  scrapQuantity: numeric('scrap_quantity', { precision: 15, scale: 3 }).notNull().default('0'),
  reworkQuantity: numeric('rework_quantity', { precision: 15, scale: 3 }).notNull().default('0'),
  // For phantom kits: exploded components consumed
  explodedComponents: jsonb('exploded_components').$type<{
    materialId: string;
    batchId?: string;
    quantity: number;
    isPhantom: boolean;
  }[]>(),
  postedAt: timestamp('posted_at').defaultNow().notNull(),
  postedBy: uuid('posted_by'),
  // FI integration
  fiDocumentId: uuid('fi_document_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
