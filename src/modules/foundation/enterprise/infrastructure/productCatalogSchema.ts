import { pgTable, varchar, boolean, timestamp, uuid, text, numeric, integer, pgEnum, uniqueIndex, index, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orgFacility } from './orgStructureSchema';

/**
 * Module 2 – Product Catalog – Legal-Safe Own IP
 * Replaces prod_item, prod_category, core_unit_measure, inv_lot etc
 * Fresh empty for items, but sample UoM, categories kept for convenience (KG, L, PC, BOX, FOOD, SPICE etc)
 * Helper codes: EMTC/EMTE/EMTV/EMTL (alias MTC, MM01, FND-MAT-CR), EMGC (alias OMSF), EUOC (alias CUNI), LTCC (alias Batch)
 * All tables use neutral naming: prod_*, core_*, inv_*
 * No SAP-identical codes: ROH->RAW, FERT->FINISHED, HALB->SEMI, S->STANDARD, V->MOVING_AVG, PD->MRP etc
 */

// Legal-safe enums – no SAP codes like ROH/FERT/S/V/PD
export const itemTypeEnum = pgEnum('prod_item_type_enum', ['RAW', 'FINISHED', 'SEMI', 'TRADING', 'PACKAGING', 'CONSUMABLE', 'SERVICE']);
export const pricingMethodEnum = pgEnum('prod_pricing_method', ['STANDARD', 'MOVING_AVG']);
export const lotControlEnum = pgEnum('prod_lot_control', ['BLOCKED', 'WARN', 'RESTRICTED']);
export const landedCostScopeEnum = pgEnum('prod_landed_cost_scope', ['NONE', 'FREIGHT', 'CUSTOMS', 'FREIGHT_CUSTOMS', 'ALL']);
export const planningTypeEnum = pgEnum('prod_planning_type', ['MRP', 'MANUAL_REORDER', 'NO_PLANNING', 'REORDER_POINT', 'FORECAST']);
export const lotSizingEnum = pgEnum('prod_lot_sizing', ['LOT_FOR_LOT', 'FIXED', 'MAX_LEVEL', 'REPLENISH']);
export const procurementMethodEnum = pgEnum('prod_procurement_method', ['BUY', 'MAKE', 'BOTH', 'TRANSFER']);

// Core Unit Measure – replaces core_unit_measure (CUNI) – sample data kept: KG, G, L, ML, PC, BOX, PACK, KIT, M, TON
export const coreUnitMeasure = pgTable('core_unit_measure', {
  code: varchar('code', { length: 20 }).primaryKey(), // KG, L, PC, BOX – not SAP MENGENEINHEIT
  name: varchar('name', { length: 100 }).notNull(), // Kilogram, Liter, Piece
  dimension: varchar('dimension', { length: 30 }), // WEIGHT, VOLUME, QUANTITY, LENGTH
  baseUnitCode: varchar('base_unit_code', { length: 20 }).references((): any => coreUnitMeasure.code),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Product Category – replaces prod_category (OMSF) – sample FOOD, SPICE, KITS, FG, RAW kept for convenience
export const prodCategory = pgTable('prod_category', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(), // FOOD, SPICE, KITS – neutral
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  parentId: uuid('parent_id').references((): any => prodCategory.id),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxParent: index('idx_prod_category_parent').on(t.parentId),
}));

// Product Item Type – replaces ent_material_type (OMS2) – configurable: RAW/FINISHED/SEMI/TRADING/PACKAGING/CONSUMABLE/SERVICE
export const prodItemType = pgTable('prod_item_type', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(), // RAW, FINISHED, SEMI – legal-safe, not ROH/FERT/HALB
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Product Item – replaces prod_item (MM01) – central master with contextual views, not separate per module
export const prodItem = pgTable('prod_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemNumber: varchar('item_number', { length: 30 }).notNull().unique(), // was material_number – neutral item_number
  type: itemTypeEnum('type').notNull(), // RAW, FINISHED, SEMI – not ROH/FERT/HALB
  categoryId: uuid('category_id').references(() => prodCategory.id), // was group_id
  baseUnit: varchar('base_unit', { length: 20 }).notNull().references(() => coreUnitMeasure.code), // was base_uom
  description: varchar('description', { length: 200 }).notNull(),
  descriptionLong: text('description_long'),
  isLotManaged: boolean('is_lot_managed').notNull().default(true), // was is_batch_managed – lot managed for expiry
  isActive: boolean('is_active').default(true).notNull(),
  shelfLifeDays: integer('shelf_life_days'), // for perishables
  inventoryValuationClass: varchar('inventory_valuation_class', { length: 20 }).notNull().default('RAW'), // was valuation_class – for FI auto determination INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX)
  lotControl: lotControlEnum('lot_control').notNull().default('BLOCKED'), // was expiry_control BLOCK/WARNING/RESTRICTED_USE -> BLOCKED/WARN/RESTRICTED
  isKit: boolean('is_kit').default(false).notNull(),
  isPhantomKit: boolean('is_phantom_kit').default(false).notNull(),
  landedCostScope: landedCostScopeEnum('landed_cost_scope').notNull().default('ALL'), // was landed_cost_relevance
  isHazardous: boolean('is_hazardous').default(false).notNull(),
  // Additional neutral fields
  weight: numeric('weight', { precision: 15, scale: 3 }),
  weightUnit: varchar('weight_unit', { length: 20 }).references(() => coreUnitMeasure.code),
  volume: numeric('volume', { precision: 15, scale: 3 }),
  volumeUnit: varchar('volume_unit', { length: 20 }).references(() => coreUnitMeasure.code),
  barcode: varchar('barcode', { length: 50 }), // was EAN
  hsnCode: varchar('hsn_code', { length: 20 }), // India GST HSN/SAC – new
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxType: index('idx_prod_item_type').on(t.type),
  idxCategory: index('idx_prod_item_category').on(t.categoryId),
  idxKit: index('idx_prod_item_kit').on(t.isKit, t.isPhantomKit),
}));

// Product Facility Profile – replaces prod_item_plant – facility-specific data (MRP, purchasing, accounting, costing)
export const prodFacilityProfile = pgTable('prod_facility_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => prodItem.id),
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id
  pricingMethod: pricingMethodEnum('pricing_method').notNull().default('MOVING_AVG'), // was price_control S/V -> STANDARD/MOVING_AVG
  movingAvgPrice: numeric('moving_avg_price', { precision: 15, scale: 4 }).notNull().default('0'),
  standardPrice: numeric('standard_price', { precision: 15, scale: 4 }).notNull().default('0'),
  totalStockQty: numeric('total_stock_qty', { precision: 15, scale: 3 }).notNull().default('0'),
  totalStockValue: numeric('total_stock_value', { precision: 15, scale: 3 }).notNull().default('0'),
  totalLandedCost: numeric('total_landed_cost', { precision: 15, scale: 3 }).notNull().default('0'),
  lastReceiptPrice: numeric('last_receipt_price', { precision: 15, scale: 4 }).default('0'), // was last_gr_price
  lastReceiptLandedCost: numeric('last_receipt_landed_cost', { precision: 15, scale: 4 }).default('0'),
  safetyStock: numeric('safety_stock', { precision: 15, scale: 3 }).default('0'),
  reorderPoint: numeric('reorder_point', { precision: 15, scale: 3 }).default('0'),
  isQualityActive: boolean('is_quality_active').default(false).notNull(), // was is_qm_active
  lotControlOverride: lotControlEnum('lot_control_override'), // was expiry_control_override
  // MRP View – legal-safe names
  planningType: planningTypeEnum('planning_type').default('MRP'), // was mrp_type PD/VB/ND -> MRP/MANUAL_REORDER/NO_PLANNING
  planningController: varchar('planning_controller', { length: 20 }), // was mrp_controller 001
  lotSizing: lotSizingEnum('lot_sizing').default('LOT_FOR_LOT'), // was lot_size EX/FX/HB -> LOT_FOR_LOT/FIXED/MAX_LEVEL
  minLotSize: numeric('min_lot_size', { precision: 15, scale: 3 }).default('0'),
  maxLotSize: numeric('max_lot_size', { precision: 15, scale: 3 }).default('0'),
  fixedLotSize: numeric('fixed_lot_size', { precision: 15, scale: 3 }).default('0'),
  procurementMethod: procurementMethodEnum('procurement_method').default('BUY'), // was procurement_type F/E/X -> BUY/MAKE/BOTH
  specialProcurementMethod: varchar('special_procurement_method', { length: 10 }), // was special_procurement 40
  // Purchasing View
  buyerGroup: varchar('buyer_group', { length: 20 }), // was purchasing_group K01/001
  procurementDivision: varchar('procurement_division', { length: 20 }), // was purchasing_org 1000/KPO1
  // Costing View
  costingLotSize: numeric('costing_lot_size', { precision: 15, scale: 3 }).default('1'),
  overheadGroup: varchar('overhead_group', { length: 20 }),
  inventoryValuationClass: varchar('inventory_valuation_class', { length: 20 }), // plant-level override
  priceUnit: integer('price_unit').default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueItemFacility: uniqueIndex('uq_prod_item_facility').on(t.itemId, t.facilityId),
  idxFacility: index('idx_prod_facility_facility').on(t.facilityId),
}));

// Product Commercial Profile – replaces ent_material_sales – sales org data
export const prodCommercialProfile = pgTable('prod_commercial_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // was material_id
  commercialOrg: varchar('commercial_org', { length: 20 }).notNull(), // was sales_org KSO1/1000
  salesChannel: varchar('sales_channel', { length: 20 }).notNull().default('CH-10'), // was distribution_channel K1/10
  productLine: varchar('product_line', { length: 20 }).notNull().default('PL-00'), // was division K1/00
  commercialUnit: varchar('commercial_unit', { length: 20 }).references(() => coreUnitMeasure.code), // was sales_uom
  salesGroup: varchar('sales_group', { length: 20 }),
  itemCategoryGroup: varchar('item_category_group', { length: 20 }).default('STANDARD'), // was NORM
  taxClassification: varchar('tax_classification', { length: 20 }).default('FULL'), // was 0/1 -> EXEMPT/FULL
  accountAssignmentGroup: varchar('account_assignment_group', { length: 20 }).default('01'),
  fulfillingFacilityId: uuid('fulfilling_facility_id').references(() => orgFacility.id), // was delivering_plant_id
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueItemOrgChannelLine: uniqueIndex('uq_prod_commercial_org').on(t.itemId, t.commercialOrg, t.salesChannel, t.productLine),
}));

// Product Item Classification – replaces ent_material_classification
export const prodItemClassification = pgTable('prod_item_classification', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => prodItem.id),
  classType: varchar('class_type', { length: 20 }).notNull().default('BATCH'), // was 001 -> BATCH, 023 -> MATERIAL
  className: varchar('class_name', { length: 100 }).notNull(),
  characteristic: varchar('characteristic', { length: 100 }).notNull(),
  value: varchar('value', { length: 200 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxItem: index('idx_prod_class_item').on(t.itemId),
}));

// Product Quality Profile – replaces ent_material_quality
export const prodQualityProfile = pgTable('prod_quality_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => prodItem.id),
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id),
  qualityControlKey: varchar('quality_control_key', { length: 20 }).default('QC-001'), // was qm_control_key 0001
  inspectionType: varchar('inspection_type', { length: 20 }).default('RECEIPT'), // was 01 -> RECEIPT
  inspectionInterval: integer('inspection_interval').default(0),
  isQualityActive: boolean('is_quality_active').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueItemFacility: uniqueIndex('uq_prod_quality_item_facility').on(t.itemId, t.facilityId),
}));

// Inventory Lot – replaces inv_lot – lot tracking for expiry, manufacturing date
export const invLot = pgTable('inv_lot', {
  id: uuid('id').primaryKey().defaultRandom(),
  lotNumber: varchar('lot_number', { length: 30 }).notNull(), // was batch_number
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // was material_id
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id
  supplierLotNumber: varchar('supplier_lot_number', { length: 50 }),
  manufacturingDate: timestamp('manufacturing_date'),
  expiryDate: timestamp('expiry_date'),
  isExpired: boolean('is_expired').default(false).notNull(),
  vendorId: uuid('vendor_id'), // FK to partner_account – not enforced for now
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueLotItemFacility: uniqueIndex('uq_inv_lot_item_facility').on(t.lotNumber, t.itemId, t.facilityId),
  idxExpiry: index('idx_inv_lot_expiry').on(t.expiryDate),
  idxItem: index('idx_inv_lot_item').on(t.itemId),
}));

// Relations – legal-safe
export const prodItemRelations = relations(prodItem, ({ one, many }) => ({
  category: one(prodCategory, { fields: [prodItem.categoryId], references: [prodCategory.id] }),
  facilityProfiles: many(prodFacilityProfile),
  commercialProfiles: many(prodCommercialProfile),
  classifications: many(prodItemClassification),
  qualityProfiles: many(prodQualityProfile),
  lots: many(invLot),
}));

export const prodFacilityProfileRelations = relations(prodFacilityProfile, ({ one }) => ({
  item: one(prodItem, { fields: [prodFacilityProfile.itemId], references: [prodItem.id] }),
  facility: one(orgFacility, { fields: [prodFacilityProfile.facilityId], references: [orgFacility.id] }),
}));

export const prodCategoryRelations = relations(prodCategory, ({ one, many }) => ({
  parent: one(prodCategory, { fields: [prodCategory.parentId], references: [prodCategory.id] }),
  children: many(prodCategory),
  items: many(prodItem),
}));
