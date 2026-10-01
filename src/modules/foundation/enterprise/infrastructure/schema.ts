import { pgTable, varchar, text, boolean, timestamp, numeric, integer, jsonb, uuid, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const materialTypeEnum = pgEnum('material_type', ['ROH', 'FERT', 'DIEN', 'HALB', 'NLAG']);
export const priceControlEnum = pgEnum('price_control', ['S', 'V']); // S=Standard, V=Moving Avg
export const bpRoleEnum = pgEnum('bp_role', ['VENDOR', 'CUSTOMER', 'BOTH']);
export const slocTypeEnum = pgEnum('sloc_type', ['MAIN', 'COLD', 'SHOP_FLOOR', 'RETURNS', 'QI', 'BLOCKED', 'RAW', 'FG', 'PACK']);
export const expiryControlEnum = pgEnum('expiry_control', ['BLOCK', 'WARNING', 'RESTRICTED_USE']);
export const landedCostRelevanceEnum = pgEnum('landed_cost_relevance', ['NONE', 'FREIGHT', 'CUSTOMS', 'FREIGHT_CUSTOMS', 'ALL']);

// Client (Mandant) - Single for now but kept for ERP familiarity
export const entClient = pgTable('core_tenant', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 3 }).notNull().unique(), // e.g., '100'
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const entCompanyCode = pgTable('org_legal_entity', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => entClient.id),
  code: varchar('code', { length: 4 }).notNull().unique(), // e.g., '1000'
  name: varchar('name', { length: 100 }).notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull().default('KWD'),
  coaId: uuid('coa_id'), // FK to fin_chart, added later
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 2 }).default('KW'),
  // --- Legal Entity Details - Multi-plant tax compliance (GST across states) ---
  address: text('address'), // Full legal address: Plot 45 Industrial Estate Kalmandapam Palakkad 678001
  street: varchar('street', { length: 200 }), // Street/House number
  postalCode: varchar('postal_code', { length: 20 }), // PIN/ZIP 678001
  region: varchar('region', { length: 100 }), // State/Region: Kerala, Region 17
  taxId: varchar('tax_id', { length: 50 }), // GSTIN 32AABCK1234M1Z5 for KS01, VAT ID for 1000
  gstNumber: varchar('gst_number', { length: 30 }), // GST Number specific India
  pan: varchar('pan', { length: 20 }), // PAN AABCK1234M
  cin: varchar('cin', { length: 30 }), // CIN U15400KL2024PTC012345
  phone: varchar('phone', { length: 30 }), // +91-491-2555001
  email: varchar('email', { length: 100 }), // info@keralaspices.com
  website: varchar('website', { length: 100 }),
  legalForm: varchar('legal_form', { length: 50 }), // Pvt Ltd, LLC, GmbH
  registrationNumber: varchar('registration_number', { length: 50 }), // Company registration number
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const entPlant = pgTable('org_facility', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyCodeId: uuid('company_code_id').notNull().references(() => entCompanyCode.id),
  code: varchar('code', { length: 4 }).notNull().unique(), // e.g., '1000' main kitchen, '1100' storage
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  address: text('address'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const entStorageLocation = pgTable('org_inventory_location', {
  id: uuid('id').primaryKey().defaultRandom(),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  code: varchar('code', { length: 4 }).notNull(), // e.g., '0001' main, '0002' cold
  name: varchar('name', { length: 100 }).notNull(),
  type: slocTypeEnum('type').notNull().default('MAIN'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniquePlantSloc: uniqueIndex('uq_plant_sloc').on(t.plantId, t.code),
}));

export const entUom = pgTable('core_unit_measure', {
  code: varchar('code', { length: 10 }).primaryKey(), // KG, L, PC, BOX
  name: varchar('name', { length: 50 }).notNull(),
  dimension: varchar('dimension', { length: 20 }), // WEIGHT, VOLUME, QUANTITY
  baseUomCode: varchar('base_uom_code', { length: 10 }).references((): any => entUom.code),
  isActive: boolean('is_active').default(true).notNull(),
});

export const entCurrency = pgTable('core_currency', {
  code: varchar('code', { length: 3 }).primaryKey(), // KWD, USD
  name: varchar('name', { length: 50 }).notNull(),
  decimalPlaces: integer('decimal_places').notNull().default(3), // KWD = 3
  symbol: varchar('symbol', { length: 5 }),
});

export const entMaterialGroup = pgTable('prod_category', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  parentId: uuid('parent_id').references((): any => entMaterialGroup.id),
});

export const entMaterialMaster = pgTable('prod_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  materialNumber: varchar('material_number', { length: 20 }).notNull().unique(), // Number range
  type: materialTypeEnum('type').notNull(),
  groupId: uuid('group_id').references(() => entMaterialGroup.id),
  baseUom: varchar('base_uom', { length: 10 }).notNull().references(() => entUom.code),
  description: varchar('description', { length: 200 }).notNull(),
  descriptionLong: text('description_long'),
  isBatchManaged: boolean('is_batch_managed').notNull().default(true), // Critical for expiry
  isActive: boolean('is_active').default(true).notNull(),
  shelfLifeDays: integer('shelf_life_days'), // For perishables
  valuationClass: varchar('valuation_class', { length: 10 }).notNull().default('ROH'), // For FI auto determination
  // Expiry control - configurable per material
  expiryControl: expiryControlEnum('expiry_control').notNull().default('BLOCK'), // BLOCK=hard block, WARNING=allow with warning, RESTRICTED_USE=downgrade to restricted
  // Kitting flags
  isKit: boolean('is_kit').default(false).notNull(), // Stocked kit
  isPhantomKit: boolean('is_phantom_kit').default(false).notNull(), // Phantom kit
  // Landed cost relevance
  landedCostRelevance: landedCostRelevanceEnum('landed_cost_relevance').notNull().default('ALL'), // For MAP with freight/customs/tax
  isHazardous: boolean('is_hazardous').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxType: index('idx_mat_type').on(t.type),
  idxKit: index('idx_mat_kit').on(t.isKit, t.isPhantomKit),
}));

export const entMaterialPlant = pgTable('prod_item_plant', {
  id: uuid('id').primaryKey().defaultRandom(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  priceControl: priceControlEnum('price_control').notNull().default('V'), // ROH=V MAP, FERT=S Standard
  movingAvgPrice: numeric('moving_avg_price', { precision: 15, scale: 4 }).notNull().default('0'),
  standardPrice: numeric('standard_price', { precision: 15, scale: 4 }).notNull().default('0'),
  totalStockQty: numeric('total_stock_qty', { precision: 15, scale: 3 }).notNull().default('0'),
  totalStockValue: numeric('total_stock_value', { precision: 15, scale: 3 }).notNull().default('0'),
  // Landed cost tracking for MAP
  totalLandedCost: numeric('total_landed_cost', { precision: 15, scale: 3 }).notNull().default('0'),
  lastGrPrice: numeric('last_gr_price', { precision: 15, scale: 4 }).default('0'),
  lastGrLandedCost: numeric('last_gr_landed_cost', { precision: 15, scale: 4 }).default('0'),
  safetyStock: numeric('safety_stock', { precision: 15, scale: 3 }).default('0'),
  reorderPoint: numeric('reorder_point', { precision: 15, scale: 3 }).default('0'),
  isQmActive: boolean('is_qm_active').default(false).notNull(),
  // Expiry override at plant level
  expiryControlOverride: expiryControlEnum('expiry_control_override'),
  // --- MRP View - ERP MM01 MRP 1-4 ---
  mrpType: varchar('mrp_type', { length: 10 }).default('PD'), // PD, VB, ND, etc
  mrpController: varchar('mrp_controller', { length: 10 }), // 001, 002
  lotSize: varchar('lot_size', { length: 10 }).default('EX'), // EX, FX, etc
  minLotSize: numeric('min_lot_size', { precision: 15, scale: 3 }).default('0'),
  maxLotSize: numeric('max_lot_size', { precision: 15, scale: 3 }).default('0'),
  fixedLotSize: numeric('fixed_lot_size', { precision: 15, scale: 3 }).default('0'),
  procurementType: varchar('procurement_type', { length: 1 }).default('F'), // F=External, E=In-house
  specialProcurement: varchar('special_procurement', { length: 2 }), // 40=Stock Transfer, etc
  // --- Purchasing View ---
  purchasingGroup: varchar('purchasing_group', { length: 10 }), // K01, 001
  purchasingOrg: varchar('purchasing_org', { length: 10 }), // 1000, KPO1
  // --- Costing View ---
  costingLotSize: numeric('costing_lot_size', { precision: 15, scale: 3 }).default('1'),
  overheadGroup: varchar('overhead_group', { length: 10 }),
  // --- Accounting View extensions ---
  valuationClass: varchar('valuation_class', { length: 10 }), // ROH, FERT, etc for plant-level override
  priceUnit: integer('price_unit').default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueMatPlant: uniqueIndex('uq_mat_plant').on(t.materialId, t.plantId),
}));

// --- Material Sales View - ERP MM01 Sales Org Data ---
export const entMaterialSales = pgTable('ent_material_sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  salesOrg: varchar('sales_org', { length: 10 }).notNull(), // KSO1, 1000
  distributionChannel: varchar('distribution_channel', { length: 10 }).notNull().default('K1'), // K1, 10
  division: varchar('division', { length: 10 }).notNull().default('K1'), // K1, 00
  salesUom: varchar('sales_uom', { length: 10 }), // KG, PC, BOX
  salesGroup: varchar('sales_group', { length: 10 }),
  itemCategoryGroup: varchar('item_category_group', { length: 10 }).default('NORM'), // NORM, etc
  taxClassification: varchar('tax_classification', { length: 10 }).default('1'), // 0=Exempt, 1=Taxable GST 18%
  accountAssignmentGroup: varchar('account_assignment_group', { length: 10 }).default('01'),
  deliveringPlant: uuid('delivering_plant_id').references(() => entPlant.id),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueMatSalesOrg: uniqueIndex('uq_mat_sales_org').on(t.materialId, t.salesOrg, t.distributionChannel, t.division),
}));

// --- Material Classification - ERP MM01 Classification View ---
export const entMaterialClassification = pgTable('ent_material_classification', {
  id: uuid('id').primaryKey().defaultRandom(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  classType: varchar('class_type', { length: 10 }).notNull().default('001'), // 001=Batch, 023=Material
  className: varchar('class_name', { length: 50 }).notNull(), // SPICE_GRADE, ORGANIC_CERT
  characteristic: varchar('characteristic', { length: 100 }).notNull(), // GRADE, COLOR, ORIGIN
  value: varchar('value', { length: 200 }).notNull(), // Grade A, Red, Kerala
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxMaterial: index('idx_mat_class_mat').on(t.materialId),
}));

// --- Material Quality - ERP MM01 Quality Management View ---
export const entMaterialQuality = pgTable('ent_material_quality', {
  id: uuid('id').primaryKey().defaultRandom(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  qmControlKey: varchar('qm_control_key', { length: 10 }).default('0001'), // QM control key
  inspectionType: varchar('inspection_type', { length: 10 }).default('01'), // 01=Goods Receipt, etc
  inspectionInterval: integer('inspection_interval').default(0),
  isQmActive: boolean('is_qm_active').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueMatPlantQm: uniqueIndex('uq_mat_plant_qm').on(t.materialId, t.plantId),
}));

export const entBatch = pgTable('inv_lot', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchNumber: varchar('batch_number', { length: 30 }).notNull(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  supplierBatchNumber: varchar('supplier_batch_number', { length: 50 }),
  manufacturingDate: timestamp('manufacturing_date'),
  expiryDate: timestamp('expiry_date'), // CRITICAL for perishables
  isExpired: boolean('is_expired').default(false).notNull(),
  vendorId: uuid('vendor_id').references(() => entBusinessPartner.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueBatchMatPlant: uniqueIndex('uq_batch_mat_plant').on(t.batchNumber, t.materialId, t.plantId),
  idxExpiry: index('idx_batch_expiry').on(t.expiryDate),
}));

export const entBusinessPartner = pgTable('partner_account', {
  id: uuid('id').primaryKey().defaultRandom(),
  bpNumber: varchar('bp_number', { length: 20 }).notNull().unique(),
  role: bpRoleEnum('role').notNull(),
  name1: varchar('name1', { length: 100 }).notNull(),
  name2: varchar('name2', { length: 100 }),
  taxId: varchar('tax_id', { length: 30 }),
  email: varchar('email', { length: 100 }),
  phone: varchar('phone', { length: 30 }),
  address: text('address'),
  isBlocked: boolean('is_blocked').default(false).notNull(),
  isOneTime: boolean('is_one_time').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const entBpVendorExt = pgTable('partner_vendor_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  bpId: uuid('bp_id').notNull().unique().references(() => entBusinessPartner.id),
  paymentTermsDays: integer('payment_terms_days').default(30),
  currencyCode: varchar('currency_code', { length: 3 }).references(() => entCurrency.code),
  reconciliationAccountId: uuid('reconciliation_account_id'), // FK to GL later
  isQmRelevant: boolean('is_qm_relevant').default(false),
});

export const entBpCustomerExt = pgTable('partner_customer_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  bpId: uuid('bp_id').notNull().unique().references(() => entBusinessPartner.id),
  paymentTermsDays: integer('payment_terms_days').default(0),
  currencyCode: varchar('currency_code', { length: 3 }).references(() => entCurrency.code),
  reconciliationAccountId: uuid('reconciliation_account_id'),
});

// Relations
export const entCompanyCodeRelations = relations(entCompanyCode, ({ many }) => ({
  plants: many(entPlant),
}));

export const entPlantRelations = relations(entPlant, ({ one, many }) => ({
  companyCode: one(entCompanyCode, { fields: [entPlant.companyCodeId], references: [entCompanyCode.id] }),
  storageLocations: many(entStorageLocation),
  materialPlants: many(entMaterialPlant),
}));

export const entMaterialMasterRelations = relations(entMaterialMaster, ({ one, many }) => ({
  group: one(entMaterialGroup, { fields: [entMaterialMaster.groupId], references: [entMaterialGroup.id] }),
  plants: many(entMaterialPlant),
  batches: many(entBatch),
}));

export const entMaterialPlantRelations = relations(entMaterialPlant, ({ one }) => ({
  material: one(entMaterialMaster, { fields: [entMaterialPlant.materialId], references: [entMaterialMaster.id] }),
  plant: one(entPlant, { fields: [entMaterialPlant.plantId], references: [entPlant.id] }),
}));
