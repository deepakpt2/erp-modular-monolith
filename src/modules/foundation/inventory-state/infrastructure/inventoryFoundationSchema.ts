import { pgTable, varchar, boolean, timestamp, uuid, text, numeric, pgEnum, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { orgFacility, orgInventoryLocation, orgLegalEntity, orgCostUnit } from '../../enterprise/infrastructure/orgStructureSchema';
import { prodItem } from '../../enterprise/infrastructure/productCatalogSchema';
import { invLot } from '../../enterprise/infrastructure/productCatalogSchema';
import { coreCurrency } from '../../enterprise/infrastructure/financialsFoundationSchema';

/**
 * Module 9 – Inventory Foundation – Legal-Safe Own IP
 * Replaces inv_stock + inv_stock_ledger + pi_* with inventory_* – legal-safe
 * Maps:
 * - inv_stock → inventory_stock – materialId EMTC was material_id, facilityId FAC-1000 was plant_id, inventoryLocationId was sloc_id, lotId ELTC was batch_id, stockStatus UNRESTRICTED/QUALITY_INSPECTION/BLOCKED/RETURNS/IN_TRANSIT, quantity, reservedQty, isBlocked
 * - inv_stock_ledger → inventory_stock_ledger – movementType 101/102/122/261/262/311/321/322/343/344/350/453/551/561/601/K01/K02, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, inventoryLocationId was sloc_id, lotId ELTC was batch_id, stockStatusFrom/To, quantity, quantityBefore/After, unitCost, totalValue, totalValueBefore/After, referenceDocType PO/PROD_ORDER/SALES, referenceDocId, referenceDocNumber, postedBy, headerText, isReversed, reversalOfId
 * - pi_document → inventory_physical_document – piNumber PI-10000001 was number range PI, legalEntityId was company_code_id, facilityId FAC-1000 was plant_id, inventoryLocationId was sloc_id, status CREATED/COUNT_ENTERED/POSTED/CANCELLED, postingDate, plannedCountDate, headerText, isBlockingActive, totalLines/countedLines, totalSystemQty/totalCountedQty/totalVarianceQty/totalVarianceValue, universalLedgerId FULC was fi_document_id
 * - pi_line → inventory_physical_line – physicalDocumentId, lineNumber, itemId EMTC was material_id, lotId ELTC was batch_id, lotNumber was batch_number, stockStatus UNRESTRICTED, systemQty systemValue unitCost MAP, countedQty, varianceQty varianceValue, status PENDING/COUNTED/POSTED/BLOCKED, isCounted, stockLedgerId, expiryDate
 * - pi_count_entry → inventory_physical_count_entry – physicalLineId, countedQty, countedBy, countedAt, notes
 * - NEW: inventory_reservation – reservationNumber RES-10000001, itemId EMTC, facilityId FAC-1000, inventoryLocationId, lotId ELTC, quantity, reservedQuantity, movementType 261/262/601, referenceDocType SALES_ORDER/PROD_ORDER, referenceDocId, requiredDate, isActive
 * - NEW: inventory_serial – serialNumber SER-10000001, itemId EMTC, facilityId FAC-1000, lotId ELTC, status IN_STOCK/ISSUED/BLOCKED, location
 * Sample: none – fresh empty per requirement but prod_item/facility/UoM kept
 * Helper codes: ISTC Stock Track Create (alias STC), ISLC Stock Ledger Create (alias SLC), IPDC Physical Inventory Doc Create (alias PIDC, MI01), IPLC Physical Inventory Line Create, IRSC Reservation Create (alias RSC, MB21), ISRC Serial Create (alias SRC)
 * 4-char MOOA: I=Inventory, ST=Stock, C=Create etc – module grouped intuitive
 */

export const inventoryStockStatusEnum = pgEnum('inventory_stock_status_new', ['UNRESTRICTED', 'QUALITY_INSPECTION', 'BLOCKED', 'RETURNS', 'IN_TRANSIT']);
export const inventoryMovementTypeEnum = pgEnum('inventory_movement_type_new', [
  'GR_PO', // GR for PO
  'GR_PO_REV', // GR reversal
  'GR_RETURN', // Return to vendor
  'GI_PROD', // GI for production order
  'GI_PROD_REV', // GI reversal
  '311', // Transfer facility to facility
  '321', // QI -> Unrestricted
  '322', // QI -> Blocked
  '343', // Blocked -> Unrestricted
  '344', // Unrestricted -> Blocked
  '350', // QI -> Blocked scrap
  '453', // Yield from production
  'GI_SCRAP', // Scrap / Spoilage
  'INIT_STOCK', // Initial stock upload
  'GI_SALES', // GI for sales / POS
  'K01', // Kitting consumption
  'K02', // Kitting production
  'PI_PLUS', // Physical inventory adjustment +
  'PI_MINUS', // Physical inventory adjustment -
]);
export const inventoryPhysicalStatusEnum = pgEnum('inventory_physical_status_new', ['CREATED', 'COUNT_ENTERED', 'POSTED', 'CANCELLED']);
export const inventoryPhysicalLineStatusEnum = pgEnum('inventory_physical_line_status_new', ['PENDING', 'COUNTED', 'POSTED', 'BLOCKED']);
export const inventorySerialStatusEnum = pgEnum('inventory_serial_status_new', ['IN_STOCK', 'ISSUED', 'BLOCKED', 'IN_TRANSIT']);

// Inventory Stock – legal-safe inventory_stock – ISTC
export const inventoryStock = pgTable('inventory_stock', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // was material_id – EMTC
  materialId: uuid('material_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id – FAC-1000
  plantId: uuid('plant_id'), // legacy alias
  inventoryLocationId: uuid('inventory_location_id').notNull().references(() => orgInventoryLocation.id), // was sloc_id
  slocId: uuid('sloc_id'), // legacy alias
  lotId: uuid('lot_id').references(() => invLot.id), // was batch_id – ELTC
  batchId: uuid('batch_id'), // legacy alias
  stockStatus: inventoryStockStatusEnum('stock_status').notNull().default('UNRESTRICTED'),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull().default('0'),
  reservedQty: numeric('reserved_qty', { precision: 15, scale: 3 }).notNull().default('0'),
  isBlocked: boolean('is_blocked').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueStock: uniqueIndex('uq_inventory_stock_item_fac_loc_lot_status').on(t.itemId, t.facilityId, t.inventoryLocationId, t.lotId, t.stockStatus),
  idxItemFacility: index('idx_inventory_stock_item_fac').on(t.itemId, t.facilityId),
  idxLot: index('idx_inventory_stock_lot').on(t.lotId),
  idxStatus: index('idx_inventory_stock_status').on(t.stockStatus),
  idxFacility: index('idx_inventory_stock_facility').on(t.facilityId),
}));

// Immutable ledger – WORM-like for audit – inventory_stock_ledger – ISLC
export const inventoryStockLedger = pgTable('inventory_stock_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  movementType: inventoryMovementTypeEnum('movement_type').notNull(),
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // was material_id – EMTC
  materialId: uuid('material_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id – FAC-1000
  plantId: uuid('plant_id'), // legacy alias
  inventoryLocationId: uuid('inventory_location_id').notNull().references(() => orgInventoryLocation.id), // was sloc_id
  slocId: uuid('sloc_id'), // legacy alias
  lotId: uuid('lot_id').references(() => invLot.id), // was batch_id – ELTC
  batchId: uuid('batch_id'), // legacy alias
  stockStatusFrom: inventoryStockStatusEnum('stock_status_from'),
  stockStatusTo: inventoryStockStatusEnum('stock_status_to').notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(), // Positive = receipt, Negative = issue
  quantityBefore: numeric('quantity_before', { precision: 15, scale: 3 }).notNull(),
  quantityAfter: numeric('quantity_after', { precision: 15, scale: 3 }).notNull(),
  unitCost: numeric('unit_cost', { precision: 15, scale: 4 }).notNull().default('0'),
  totalValue: numeric('total_value', { precision: 15, scale: 3 }).notNull().default('0'),
  totalValueBefore: numeric('total_value_before', { precision: 15, scale: 3 }).notNull().default('0'),
  totalValueAfter: numeric('total_value_after', { precision: 15, scale: 3 }).notNull().default('0'),
  referenceDocType: varchar('reference_doc_type', { length: 30 }).notNull(), // PO, PROD_ORDER, SALES_ORDER, PHYSICAL_INVENTORY
  referenceDocId: uuid('reference_doc_id'),
  referenceDocNumber: varchar('reference_doc_number', { length: 30 }),
  referenceDocLine: integer('reference_doc_line'),
  postedBy: uuid('posted_by'),
  postedAt: timestamp('posted_at').defaultNow().notNull(),
  headerText: text('header_text'),
  isReversed: varchar('is_reversed', { length: 1 }).default('N'),
  reversalOfId: uuid('reversal_of_id').references((): any => inventoryStockLedger.id),
}, (t) => ({
  idxItemFacilityDate: index('idx_inventory_ledger_item_fac_date').on(t.itemId, t.facilityId, t.postedAt),
  idxRefDoc: index('idx_inventory_ledger_ref_doc').on(t.referenceDocType, t.referenceDocNumber),
  idxMovement: index('idx_inventory_ledger_movement').on(t.movementType),
  idxFacility: index('idx_inventory_ledger_facility').on(t.facilityId),
}));

// Physical Inventory Document – inventory_physical_document – IPDC
export const inventoryPhysicalDocument = pgTable('inventory_physical_document', {
  id: uuid('id').primaryKey().defaultRandom(),
  piNumber: varchar('pi_number', { length: 20 }).notNull().unique(), // PI-10000001
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id), // was company_code_id
  companyCodeId: uuid('company_code_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id – FAC-1000
  plantId: uuid('plant_id'), // legacy alias
  inventoryLocationId: uuid('inventory_location_id').notNull().references(() => orgInventoryLocation.id), // was sloc_id
  slocId: uuid('sloc_id'), // legacy alias
  status: inventoryPhysicalStatusEnum('status').notNull().default('CREATED'),
  postingDate: timestamp('posting_date').notNull(),
  plannedCountDate: timestamp('planned_count_date').notNull(),
  headerText: text('header_text'),
  isBlockingActive: boolean('is_blocking_active').notNull().default(true),
  totalLines: integer('total_lines').notNull().default(0),
  countedLines: integer('counted_lines').notNull().default(0),
  totalSystemQty: numeric('total_system_qty', { precision: 15, scale: 3 }).default('0'),
  totalCountedQty: numeric('total_counted_qty', { precision: 15, scale: 3 }).default('0'),
  totalVarianceQty: numeric('total_variance_qty', { precision: 15, scale: 3 }).default('0'),
  totalVarianceValue: numeric('total_variance_value', { precision: 15, scale: 3 }).default('0'),
  universalLedgerId: uuid('universal_ledger_id'), // was fi_document_id – FULC
  fiDocumentId: uuid('fi_document_id'), // legacy alias
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxFacilityLoc: index('idx_inventory_physical_fac_loc').on(t.facilityId, t.inventoryLocationId),
  idxStatus: index('idx_inventory_physical_status').on(t.status),
  idxPostingDate: index('idx_inventory_physical_posting').on(t.postingDate),
}));

// Physical Inventory Line – inventory_physical_line – IPLC
export const inventoryPhysicalLine = pgTable('inventory_physical_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  physicalDocumentId: uuid('physical_document_id').notNull().references(() => inventoryPhysicalDocument.id, { onDelete: 'cascade' }),
  piDocumentId: uuid('pi_document_id'), // legacy alias
  lineNumber: integer('line_number').notNull(),
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // was material_id – EMTC
  materialId: uuid('material_id'), // legacy alias
  lotId: uuid('lot_id').references(() => invLot.id), // was batch_id – ELTC
  batchId: uuid('batch_id'), // legacy alias
  lotNumber: varchar('lot_number', { length: 30 }), // was batch_number – ELTC lot_number
  batchNumber: varchar('batch_number', { length: 30 }), // legacy alias
  stockStatus: varchar('stock_status', { length: 20 }).notNull().default('UNRESTRICTED'),
  systemQty: numeric('system_qty', { precision: 15, scale: 3 }).notNull(),
  systemValue: numeric('system_value', { precision: 15, scale: 3 }).notNull().default('0'),
  unitCost: numeric('unit_cost', { precision: 15, scale: 4 }).notNull().default('0'),
  countedQty: numeric('counted_qty', { precision: 15, scale: 3 }),
  varianceQty: numeric('variance_qty', { precision: 15, scale: 3 }),
  varianceValue: numeric('variance_value', { precision: 15, scale: 3 }),
  status: inventoryPhysicalLineStatusEnum('status').notNull().default('PENDING'),
  isCounted: boolean('is_counted').default(false).notNull(),
  stockLedgerId: uuid('stock_ledger_id'),
  expiryDate: timestamp('expiry_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxPhysicalDoc: index('idx_inventory_physical_line_doc').on(t.physicalDocumentId),
  idxItem: index('idx_inventory_physical_line_item').on(t.itemId),
  uniquePhysicalLine: uniqueIndex('uq_inventory_physical_line').on(t.physicalDocumentId, t.lineNumber),
}));

// Count Entry – inventory_physical_count_entry
export const inventoryPhysicalCountEntry = pgTable('inventory_physical_count_entry', {
  id: uuid('id').primaryKey().defaultRandom(),
  physicalLineId: uuid('physical_line_id').notNull().references(() => inventoryPhysicalLine.id, { onDelete: 'cascade' }),
  piLineId: uuid('pi_line_id'), // legacy alias
  countedQty: numeric('counted_qty', { precision: 15, scale: 3 }).notNull(),
  countedBy: uuid('counted_by'),
  countedAt: timestamp('counted_at').defaultNow().notNull(),
  notes: text('notes'),
}, (t) => ({
  idxPhysicalLine: index('idx_inventory_count_line').on(t.physicalLineId),
}));

// Reservation – inventory_reservation – IRSC – NEW
export const inventoryReservation = pgTable('inventory_reservation', {
  id: uuid('id').primaryKey().defaultRandom(),
  reservationNumber: varchar('reservation_number', { length: 20 }).notNull().unique(), // RES-10000001
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // EMTC
  materialId: uuid('material_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // FAC-1000
  plantId: uuid('plant_id'), // legacy alias
  inventoryLocationId: uuid('inventory_location_id').notNull().references(() => orgInventoryLocation.id), // was sloc_id
  slocId: uuid('sloc_id'), // legacy alias
  lotId: uuid('lot_id').references(() => invLot.id), // ELTC
  batchId: uuid('batch_id'), // legacy alias
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  reservedQuantity: numeric('reserved_quantity', { precision: 15, scale: 3 }).notNull().default('0'),
  movementType: inventoryMovementTypeEnum('movement_type').notNull().default('GI_PROD'),
  referenceDocType: varchar('reference_doc_type', { length: 30 }).notNull(), // SALES_ORDER, PROD_ORDER
  referenceDocId: uuid('reference_doc_id'),
  referenceDocNumber: varchar('reference_doc_number', { length: 30 }),
  requiredDate: timestamp('required_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxItemFacility: index('idx_inventory_res_item_fac').on(t.itemId, t.facilityId),
  idxRefDoc: index('idx_inventory_res_ref').on(t.referenceDocType, t.referenceDocNumber),
  idxFacility: index('idx_inventory_res_facility').on(t.facilityId),
}));

// Serial – inventory_serial – ISRC – NEW
export const inventorySerial = pgTable('inventory_serial', {
  id: uuid('id').primaryKey().defaultRandom(),
  serialNumber: varchar('serial_number', { length: 30 }).notNull().unique(), // SER-10000001
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // EMTC
  materialId: uuid('material_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // FAC-1000
  plantId: uuid('plant_id'), // legacy alias
  lotId: uuid('lot_id').references(() => invLot.id), // ELTC
  batchId: uuid('batch_id'), // legacy alias
  status: inventorySerialStatusEnum('status').notNull().default('IN_STOCK'),
  inventoryLocationId: uuid('inventory_location_id').references(() => orgInventoryLocation.id),
  slocId: uuid('sloc_id'), // legacy alias
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxItem: index('idx_inventory_serial_item').on(t.itemId),
  idxFacility: index('idx_inventory_serial_facility').on(t.facilityId),
  idxStatus: index('idx_inventory_serial_status').on(t.status),
}));
