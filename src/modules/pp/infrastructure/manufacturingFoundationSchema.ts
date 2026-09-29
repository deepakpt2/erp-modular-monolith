import { pgTable, varchar, boolean, timestamp, uuid, text, numeric, integer, pgEnum, uniqueIndex, index, jsonb } from 'drizzle-orm/pg-core';
import { orgLegalEntity, orgFacility, orgCostUnit } from '../../foundation/enterprise/infrastructure/orgStructureSchema';
import { prodItem } from '../../foundation/enterprise/infrastructure/productCatalogSchema';
import { invLot } from '../../foundation/enterprise/infrastructure/productCatalogSchema';

/**
 * Module 7 – PP Manufacturing – Legal-Safe Own IP
 * Replaces pp_* tables with mfg_* – legal-safe
 * Maps:
 * - pp_work_center → mfg_work_center – code WC-1000, name, facilityId was plant_id FAC-1000, costUnitId was cost_center ECUC, capacityPerHour, laborRatePerHour, machineRatePerHour, overheadRatePercent, setupTimeMinutes
 * - pp_routing_header → mfg_routing_header – routingNumber ROUTING-1001, itemId was material_id prod_item EMTC, facilityId was plant_id, bomHeaderId, description, status, version, lotSizeFrom/To, validFrom/To
 * - pp_routing_line → mfg_routing_line – routingHeaderId, operationNumber 0010/0020/0030, workCenterId, description Blending/Packing/QC, setupTimeMinutes, machineTimeMinutes, laborTimeMinutes, baseQuantity
 * - pp_bom_header → mfg_bom_header – bomNumber BOM-1001, itemId was material_id prod_item EMTC parent FERT/Kit, facilityId was plant_id, type STANDARD/KIT_STOCKED/KIT_PHANTOM, status DRAFT/ACTIVE/BLOCKED/EXPIRED, version, baseQuantity, baseUom, isPhantom, isKit, expiryRule MIN_COMPONENTS/FIXED_DAYS/MANUAL, fixedShelfLifeDays
 * - pp_bom_line → mfg_bom_line – bomHeaderId, lineNumber, componentItemId was component_material_id ROH, quantity, uomCode was uom EUOC, isBatchTracked, isPhantomExplode, scrapFactor, workCenterId
 * - pp_production_order → mfg_production_order – orderNumber MO-1000001 was number range, type STANDARD/KITTING/REWORK, itemId was material_id, facilityId was plant_id, bomHeaderId, workCenterId, quantityPlanned/Yield/Scrap/Rework, status CREATED/RELEASED/IN_PROCESS/CONFIRMED/CLOSED/CANCELLED, targetLotId was target_batch_id inv_lot ELTC, targetLotNumber was target_batch_number, targetExpiryDate MIN(component expiries), plannedStart/End, actualStart/End, plannedCost/actualCost, isKitting, kittingOrderId
 * - pp_production_order_component → mfg_production_order_component – productionOrderId, itemId was material_id ROH, lotId was batch_id ELTC, bomLineId, quantityRequired/Issued/Scrap, uomCode, isPhantom, isBackflushed
 * - pp_kitting_order → mfg_kitting_order – kittingNumber KIT-1000001, productionOrderId, kitItemId was kit_material_id, targetLotId, targetQuantity, minComponentExpiry, calculatedExpiry, k01MovementId/k02MovementId, status
 * - pp_mrp_run → mfg_mrp_run – mrpNumber MRP-1001, facilityId was plant_id, status DRAFT/RUNNING/COMPLETED/FAILED, planningHorizonDays, includeSafetyStock, includeSalesOrders, totalMaterials/Shortages/PrsGenerated/PlannedOrdersGenerated
 * - pp_mrp_element → mfg_mrp_element – mrpRunId, itemId was material_id, facilityId was plant_id, elementType STOCK/SAFETY_STOCK/SALES_ORDER/PR/PO/PLANNED_ORDER/PROD_ORDER/STO, elementNumber, quantity, availableQuantity, date, isShortage, generatedPrId, generatedPlannedOrderId
 * - pp_production_confirmation → mfg_production_confirmation – confirmationNumber CONF-1000001, productionOrderId, workCenterId, yieldQuantity, scrapQuantity, reworkQuantity, explodedComponents jsonb, postedAt, universalLedgerId was fi_document_id FULC
 * Sample: none – fresh empty per requirement, but prod_item, facility, UoM, etc kept
 * Helper codes: MBMC BOM Create (alias BMC, CS01, FIN-BOM-CR), MWCC Work Center Create (alias WCC, CR01), MRTC Routing Create (alias RTC, CA01), MPVC Production Version Create (alias PVC), MMOC Manufacturing Order Create (alias MOC, CO01), MMRP MRP Run (alias MRP, MD01)
 * 4-char MOOA: M=Manufacturing, BM=BOM, C=Create etc – module grouped intuitive, same length as CS01/CR01/CA01/CO01/MD01 but own IP
 */

export const mfgBomTypeEnum = pgEnum('mfg_bom_type', ['STANDARD', 'KIT_STOCKED', 'KIT_PHANTOM']);
export const mfgBomStatusEnum = pgEnum('mfg_bom_status', ['DRAFT', 'ACTIVE', 'BLOCKED', 'EXPIRED']);
export const mfgProdOrderTypeEnum = pgEnum('mfg_prod_order_type', ['STANDARD', 'KITTING', 'REWORK']);
export const mfgProdOrderStatusEnum = pgEnum('mfg_prod_order_status', ['CREATED', 'RELEASED', 'IN_PROCESS', 'CONFIRMED', 'CLOSED', 'CANCELLED']);
export const mfgRoutingStatusEnum = pgEnum('mfg_routing_status', ['DRAFT', 'ACTIVE', 'BLOCKED']);
export const mfgMrpRunStatusEnum = pgEnum('mfg_mrp_run_status', ['DRAFT', 'RUNNING', 'COMPLETED', 'FAILED']);
export const mfgMrpElementTypeEnum = pgEnum('mfg_mrp_element_type', ['STOCK', 'SAFETY_STOCK', 'SALES_ORDER', 'PR', 'PO', 'PLANNED_ORDER', 'PROD_ORDER', 'STO']);

// Work Center – legal-safe mfg_work_center – MWCC
export const mfgWorkCenter = pgTable('mfg_work_center', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(), // WC-1000 – neutral, was WC-KITCHEN-01
  name: varchar('name', { length: 100 }).notNull(),
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id – FAC-1000
  plantId: uuid('plant_id'), // legacy alias
  costUnitId: uuid('cost_unit_id').references(() => orgCostUnit.id), // was cost_center_id – ECUC
  costCenterId: uuid('cost_center_id'), // legacy alias
  description: text('description'),
  capacityPerHour: numeric('capacity_per_hour', { precision: 10, scale: 2 }).default('0'),
  laborRatePerHour: numeric('labor_rate_per_hour', { precision: 15, scale: 4 }).default('0'), // e.g., 500 INR/h labor
  machineRatePerHour: numeric('machine_rate_per_hour', { precision: 15, scale: 4 }).default('0'), // e.g., 1000 INR/h machine
  overheadRatePercent: numeric('overhead_rate_percent', { precision: 5, scale: 2 }).default('0'), // e.g., 20% overhead
  setupTimeMinutes: integer('setup_time_minutes').default(0),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Routing Header – legal-safe mfg_routing_header – MRTC
export const mfgRoutingHeader = pgTable('mfg_routing_header', {
  id: uuid('id').primaryKey().defaultRandom(),
  routingNumber: varchar('routing_number', { length: 30 }).notNull().unique(), // ROUTING-1001
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // was material_id – FERT – EMTC
  materialId: uuid('material_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id
  plantId: uuid('plant_id'), // legacy alias
  bomHeaderId: uuid('bom_header_id').references(() => mfgBomHeader.id), // optional link to BOM
  description: varchar('description', { length: 200 }),
  status: mfgRoutingStatusEnum('status').notNull().default('ACTIVE'),
  version: varchar('version', { length: 10 }).notNull().default('01'),
  lotSizeFrom: numeric('lot_size_from', { precision: 15, scale: 3 }).default('1'),
  lotSizeTo: numeric('lot_size_to', { precision: 15, scale: 3 }).default('999999'),
  validFrom: timestamp('valid_from').defaultNow().notNull(),
  validTo: timestamp('valid_to'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxItemFacility: index('idx_mfg_routing_item_facility').on(t.itemId, t.facilityId),
  uniqueItemFacilityVer: uniqueIndex('uq_mfg_routing_item_fac_ver').on(t.itemId, t.facilityId, t.version),
}));

// Routing Line – legal-safe mfg_routing_line
export const mfgRoutingLine = pgTable('mfg_routing_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  routingHeaderId: uuid('routing_header_id').notNull().references(() => mfgRoutingHeader.id, { onDelete: 'cascade' }),
  operationNumber: integer('operation_number').notNull(), // 0010, 0020, 0030
  workCenterId: uuid('work_center_id').notNull().references(() => mfgWorkCenter.id),
  description: varchar('description', { length: 200 }), // Blending, Packing, QC
  setupTimeMinutes: integer('setup_time_minutes').notNull().default(0),
  machineTimeMinutes: integer('machine_time_minutes').notNull().default(0),
  laborTimeMinutes: integer('labor_time_minutes').notNull().default(0),
  baseQuantity: numeric('base_quantity', { precision: 15, scale: 3 }).notNull().default('1'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxRouting: index('idx_mfg_routing_line_header').on(t.routingHeaderId),
  uniqueRoutingOp: uniqueIndex('uq_mfg_routing_op').on(t.routingHeaderId, t.operationNumber),
}));

// BOM Header – legal-safe mfg_bom_header – MBMC
export const mfgBomHeader = pgTable('mfg_bom_header', {
  id: uuid('id').primaryKey().defaultRandom(),
  bomNumber: varchar('bom_number', { length: 30 }).notNull().unique(), // BOM-1001
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // parent FERT or Kit – EMTC
  materialId: uuid('material_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id
  plantId: uuid('plant_id'), // legacy alias
  type: mfgBomTypeEnum('type').notNull().default('STANDARD'),
  status: mfgBomStatusEnum('status').notNull().default('ACTIVE'),
  version: varchar('version', { length: 10 }).notNull().default('01'),
  baseQuantity: numeric('base_quantity', { precision: 15, scale: 3 }).notNull().default('1'),
  baseUom: varchar('base_uom', { length: 10 }).notNull(), // KG, PC – EUOC
  isPhantom: boolean('is_phantom').default(false).notNull(),
  isKit: boolean('is_kit').default(false).notNull(),
  validFrom: timestamp('valid_from').notNull().defaultNow(),
  validTo: timestamp('valid_to'),
  expiryRule: varchar('expiry_rule', { length: 20 }).notNull().default('MIN_COMPONENTS'), // MIN_COMPONENTS, FIXED_DAYS, MANUAL
  fixedShelfLifeDays: integer('fixed_shelf_life_days'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxItemFacility: index('idx_mfg_bom_item_fac').on(t.itemId, t.facilityId),
  uniqueItemFacilityVersion: uniqueIndex('uq_mfg_bom_item_fac_ver').on(t.itemId, t.facilityId, t.version),
}));

// BOM Line – legal-safe mfg_bom_line
export const mfgBomLine = pgTable('mfg_bom_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  bomHeaderId: uuid('bom_header_id').notNull().references(() => mfgBomHeader.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  componentItemId: uuid('component_item_id').notNull().references(() => prodItem.id), // was component_material_id ROH
  componentMaterialId: uuid('component_material_id'), // legacy alias
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  uomCode: varchar('uom_code', { length: 10 }).notNull(), // KG, PC – EUOC
  uom: varchar('uom', { length: 10 }), // legacy alias
  isBatchTracked: boolean('is_batch_tracked').default(true).notNull(), // is lot tracked – ELTC
  isPhantomExplode: boolean('is_phantom_explode').default(false).notNull(),
  scrapFactor: numeric('scrap_factor', { precision: 5, scale: 2 }).default('0'),
  workCenterId: uuid('work_center_id').references(() => mfgWorkCenter.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxBomHeader: index('idx_mfg_bom_line_header').on(t.bomHeaderId),
  uniqueBomLine: uniqueIndex('uq_mfg_bom_line').on(t.bomHeaderId, t.lineNumber),
  idxComponent: index('idx_mfg_bom_line_component').on(t.componentItemId),
}));

// Production Order – legal-safe mfg_production_order – MMOC
export const mfgProductionOrder = pgTable('mfg_production_order', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: varchar('order_number', { length: 20 }).notNull().unique(), // MO-1000001 – neutral, was number range
  type: mfgProdOrderTypeEnum('type').notNull().default('STANDARD'),
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // what to produce FERT or Stocked Kit – EMTC
  materialId: uuid('material_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id
  plantId: uuid('plant_id'), // legacy alias
  bomHeaderId: uuid('bom_header_id').references(() => mfgBomHeader.id),
  workCenterId: uuid('work_center_id').references(() => mfgWorkCenter.id),
  quantityPlanned: numeric('quantity_planned', { precision: 15, scale: 3 }).notNull(),
  quantityYield: numeric('quantity_yield', { precision: 15, scale: 3 }).notNull().default('0'),
  quantityScrap: numeric('quantity_scrap', { precision: 15, scale: 3 }).notNull().default('0'),
  quantityRework: numeric('quantity_rework', { precision: 15, scale: 3 }).notNull().default('0'),
  status: mfgProdOrderStatusEnum('status').notNull().default('CREATED'),
  targetLotId: uuid('target_lot_id').references(() => invLot.id), // was target_batch_id – ELTC
  targetBatchId: uuid('target_batch_id'), // legacy alias
  targetLotNumber: varchar('target_lot_number', { length: 30 }), // was target_batch_number – ELTC lot_number
  targetBatchNumber: varchar('target_batch_number', { length: 30 }), // legacy alias
  targetExpiryDate: timestamp('target_expiry_date'), // MIN(component expiries)
  plannedStart: timestamp('planned_start'),
  plannedEnd: timestamp('planned_end'),
  actualStart: timestamp('actual_start'),
  actualEnd: timestamp('actual_end'),
  plannedCost: numeric('planned_cost', { precision: 15, scale: 3 }).default('0'),
  actualCost: numeric('actual_cost', { precision: 15, scale: 3 }).default('0'),
  isKitting: boolean('is_kitting').default(false).notNull(),
  kittingOrderId: uuid('kitting_order_id').references((): any => mfgProductionOrder.id),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxItemFacility: index('idx_mfg_prod_order_item_fac').on(t.itemId, t.facilityId),
  idxStatus: index('idx_mfg_prod_order_status').on(t.status),
  idxType: index('idx_mfg_prod_order_type').on(t.type),
}));

// Production Order Component – legal-safe mfg_production_order_component
export const mfgProductionOrderComponent = pgTable('mfg_production_order_component', {
  id: uuid('id').primaryKey().defaultRandom(),
  productionOrderId: uuid('production_order_id').notNull().references(() => mfgProductionOrder.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // was material_id ROH
  materialId: uuid('material_id'), // legacy alias
  lotId: uuid('lot_id').references(() => invLot.id), // was batch_id – ELTC
  batchId: uuid('batch_id'), // legacy alias
  bomLineId: uuid('bom_line_id').references(() => mfgBomLine.id),
  quantityRequired: numeric('quantity_required', { precision: 15, scale: 3 }).notNull(),
  quantityIssued: numeric('quantity_issued', { precision: 15, scale: 3 }).notNull().default('0'),
  quantityScrap: numeric('quantity_scrap', { precision: 15, scale: 3 }).notNull().default('0'),
  uomCode: varchar('uom_code', { length: 10 }).notNull(), // KG, PC – EUOC
  uom: varchar('uom', { length: 10 }), // legacy alias
  isPhantom: boolean('is_phantom').default(false).notNull(),
  isBackflushed: boolean('is_backflushed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxProdOrder: index('idx_mfg_prod_comp_order').on(t.productionOrderId),
  idxItem: index('idx_mfg_prod_comp_item').on(t.itemId),
}));

// Kitting Order – legal-safe mfg_kitting_order
export const mfgKittingOrder = pgTable('mfg_kitting_order', {
  id: uuid('id').primaryKey().defaultRandom(),
  kittingNumber: varchar('kitting_number', { length: 20 }).notNull().unique(), // KIT-1000001
  productionOrderId: uuid('production_order_id').notNull().references(() => mfgProductionOrder.id),
  kitItemId: uuid('kit_item_id').notNull().references(() => prodItem.id), // was kit_material_id – stocked kit
  kitMaterialId: uuid('kit_material_id'), // legacy alias
  targetLotId: uuid('target_lot_id').notNull().references(() => invLot.id), // new lot for kit – ELTC
  targetBatchId: uuid('target_batch_id'), // legacy alias
  targetQuantity: numeric('target_quantity', { precision: 15, scale: 3 }).notNull(),
  minComponentExpiry: timestamp('min_component_expiry'),
  calculatedExpiry: timestamp('calculated_expiry'),
  k01MovementId: uuid('k01_movement_id'),
  k02MovementId: uuid('k02_movement_id'),
  status: mfgProdOrderStatusEnum('status').notNull().default('CREATED'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// MRP Run – legal-safe mfg_mrp_run – MMRP
export const mfgMrpRun = pgTable('mfg_mrp_run', {
  id: uuid('id').primaryKey().defaultRandom(),
  mrpNumber: varchar('mrp_number', { length: 20 }).notNull().unique(), // MRP-1001
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id
  plantId: uuid('plant_id'), // legacy alias
  status: mfgMrpRunStatusEnum('status').notNull().default('DRAFT'),
  planningHorizonDays: integer('planning_horizon_days').default(30),
  includeSafetyStock: boolean('include_safety_stock').default(true).notNull(),
  includeSalesOrders: boolean('include_sales_orders').default(true).notNull(),
  totalMaterials: integer('total_materials').default(0),
  totalShortages: integer('total_shortages').default(0),
  totalPrsGenerated: integer('total_prs_generated').default(0),
  totalPlannedOrdersGenerated: integer('total_planned_orders_generated').default(0),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (t) => ({
  idxFacility: index('idx_mfg_mrp_run_facility').on(t.facilityId),
  idxStatus: index('idx_mfg_mrp_run_status').on(t.status),
}));

// MRP Element – legal-safe mfg_mrp_element
export const mfgMrpElement = pgTable('mfg_mrp_element', {
  id: uuid('id').primaryKey().defaultRandom(),
  mrpRunId: uuid('mrp_run_id').notNull().references(() => mfgMrpRun.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // was material_id
  materialId: uuid('material_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id
  plantId: uuid('plant_id'), // legacy alias
  elementType: mfgMrpElementTypeEnum('element_type').notNull(), // STOCK/SAFETY_STOCK/SALES_ORDER/PR/PO/PLANNED_ORDER/PROD_ORDER/STO
  elementNumber: varchar('element_number', { length: 30 }),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  availableQuantity: numeric('available_quantity', { precision: 15, scale: 3 }).default('0'),
  date: timestamp('date').notNull(),
  isShortage: boolean('is_shortage').default(false).notNull(),
  generatedPrId: uuid('generated_pr_id'), // proc_purchase_requisition
  generatedPlannedOrderId: uuid('generated_planned_order_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxMrpRun: index('idx_mfg_mrp_element_run').on(t.mrpRunId),
  idxItemFacility: index('idx_mfg_mrp_element_item_fac').on(t.itemId, t.facilityId),
}));

// Production Confirmation – legal-safe mfg_production_confirmation
export const mfgProductionConfirmation = pgTable('mfg_production_confirmation', {
  id: uuid('id').primaryKey().defaultRandom(),
  confirmationNumber: varchar('confirmation_number', { length: 20 }).notNull().unique(), // CONF-1000001
  productionOrderId: uuid('production_order_id').notNull().references(() => mfgProductionOrder.id),
  workCenterId: uuid('work_center_id').references(() => mfgWorkCenter.id),
  yieldQuantity: numeric('yield_quantity', { precision: 15, scale: 3 }).notNull(),
  scrapQuantity: numeric('scrap_quantity', { precision: 15, scale: 3 }).notNull().default('0'),
  reworkQuantity: numeric('rework_quantity', { precision: 15, scale: 3 }).notNull().default('0'),
  explodedComponents: jsonb('exploded_components').$type<{
    itemId: string;
    materialId?: string;
    lotId?: string;
    batchId?: string;
    quantity: number;
    isPhantom: boolean;
  }[]>(),
  postedAt: timestamp('posted_at').defaultNow().notNull(),
  postedBy: uuid('posted_by'),
  universalLedgerId: uuid('universal_ledger_id'), // was fi_document_id – FULC
  fiDocumentId: uuid('fi_document_id'), // legacy alias
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Production Version – NEW – legal-safe mfg_production_version – MPVC – BOM + Routing + lot size combo
export const mfgProductionVersion = pgTable('mfg_production_version', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(), // PV-1001
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // FERT
  materialId: uuid('material_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // plant
  plantId: uuid('plant_id'), // legacy alias
  bomHeaderId: uuid('bom_header_id').notNull().references(() => mfgBomHeader.id),
  routingHeaderId: uuid('routing_header_id').notNull().references(() => mfgRoutingHeader.id),
  lotSizeFrom: numeric('lot_size_from', { precision: 15, scale: 3 }).default('1'),
  lotSizeTo: numeric('lot_size_to', { precision: 15, scale: 3 }).default('999999'),
  isActive: boolean('is_active').default(true).notNull(),
  validFrom: timestamp('valid_from').defaultNow().notNull(),
  validTo: timestamp('valid_to'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxItemFacility: index('idx_mfg_prod_ver_item_fac').on(t.itemId, t.facilityId),
  uniqueItemFacility: uniqueIndex('uq_mfg_prod_ver_item_fac').on(t.itemId, t.facilityId, t.code),
}));
