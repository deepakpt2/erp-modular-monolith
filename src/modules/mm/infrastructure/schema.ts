import { pgTable, varchar, boolean, timestamp, uuid, text, numeric, pgEnum, integer, index, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';
import { entMaterialMaster, entPlant, entStorageLocation, entBusinessPartner, entBatch } from '../../foundation/enterprise/infrastructure/schema';

export const prStatusEnum = pgEnum('pr_status', ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONVERTED_TO_PO', 'CANCELLED']);
export const poStatusEnum = pgEnum('po_status', ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED', 'CANCELLED']);
export const grStatusEnum = pgEnum('gr_status', ['DRAFT', 'POSTED', 'CANCELLED']);
export const ivStatusEnum = pgEnum('iv_status', ['DRAFT', 'POSTED', 'BLOCKED', 'CANCELLED']);

// Purchase Requisition - ERP Views: Header+Items+Account Assignment+Delivery/Invoice+Texts+History+Workflow PPRC/PPRE/PPRV – own IP – legacy ME51N/ME52N/ME53N/ME54N
export const mmPurchaseRequisition = pgTable('mm_purchase_requisition', {
  id: uuid('id').primaryKey().defaultRandom(),
  prNumber: varchar('pr_number', { length: 20 }).notNull().unique(),
  companyCodeId: uuid('company_code_id').notNull(),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  requesterId: uuid('requester_id').notNull(), // hr_employee
  status: prStatusEnum('status').notNull().default('DRAFT'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  currency: varchar('currency', { length: 3 }).notNull().default('KWD'),
  requiredDate: timestamp('required_date'),
  headerText: text('header_text'),
  // ERP Header View
  docDate: timestamp('doc_date').defaultNow(),
  purchasingOrg: varchar('purchasing_org', { length: 10 }), // 1000, KPO1 OX08
  purchasingGroup: varchar('purchasing_group', { length: 10 }), // 001, K01 OME4
  workflowInstanceId: uuid('workflow_instance_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxStatus: index('idx_pr_status').on(t.status),
  idxRequester: index('idx_pr_requester').on(t.requesterId),
}));

export const mmPrLine = pgTable('mm_pr_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  prId: uuid('pr_id').notNull().references(() => mmPurchaseRequisition.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  uom: varchar('uom', { length: 10 }).notNull(),
  estimatedPrice: numeric('estimated_price', { precision: 15, scale: 4 }).notNull().default('0'),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  slocId: uuid('sloc_id').references(() => entStorageLocation.id),
  // ERP Item Detail + Account Assignment + Delivery/Invoice Views
  deliveryDate: timestamp('delivery_date'),
  accountAssignment: varchar('account_assignment', { length: 1 }), // K Cost Center, None Inventory
  costCenterId: uuid('cost_center_id'),
  glAccountId: uuid('gl_account_id'),
  taxCodeId: uuid('tax_code_id'),
  itemText: text('item_text'),
  isConverted: boolean('is_converted').default(false).notNull(),
  poId: uuid('po_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxPr: index('idx_pr_line_pr').on(t.prId),
}));

// Purchase Order - ERP Views: Header+Items+Item Detail+Delivery/Invoice+Account Assignment+Conditions+Texts+PO History PPOC/PPOE/PPOV – own IP – legacy ME21N/ME22N/ME23N
export const mmPurchaseOrder = pgTable('mm_purchase_order', {
  id: uuid('id').primaryKey().defaultRandom(),
  poNumber: varchar('po_number', { length: 20 }).notNull().unique(), // 45*
  companyCodeId: uuid('company_code_id').notNull(),
  vendorId: uuid('vendor_id').notNull().references(() => entBusinessPartner.id),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  status: poStatusEnum('status').notNull().default('DRAFT'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  totalLandedCost: numeric('total_landed_cost', { precision: 15, scale: 3 }).notNull().default('0'), // Freight + Customs + Tax
  currency: varchar('currency', { length: 3 }).notNull().default('KWD'),
  // ERP Header View
  docDate: timestamp('doc_date').defaultNow(),
  purchasingOrg: varchar('purchasing_org', { length: 10 }), // 1000, KPO1 OX08
  purchasingGroup: varchar('purchasing_group', { length: 10 }), // 001, K01 OME4
  paymentTerms: varchar('payment_terms', { length: 10 }).default('0001'), // 0001 Immediate, 0002 30 days
  paymentTermsDays: integer('payment_terms_days').default(30),
  incoterms: varchar('incoterms', { length: 10 }).default('EXW'), // EXW, FOB, CIF
  deliveryDate: timestamp('delivery_date'),
  headerText: text('header_text'),
  workflowInstanceId: uuid('workflow_instance_id'),
  prId: uuid('pr_id').references(() => mmPurchaseRequisition.id),
  // Landed cost breakdown
  freightAmount: numeric('freight_amount', { precision: 15, scale: 3 }).default('0'),
  customsAmount: numeric('customs_amount', { precision: 15, scale: 3 }).default('0'),
  otherCharges: numeric('other_charges', { precision: 15, scale: 3 }).default('0'),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 3 }).default('0'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxStatus: index('idx_po_status').on(t.status),
  idxVendor: index('idx_po_vendor').on(t.vendorId),
}));

export const mmPoLine = pgTable('mm_po_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  poId: uuid('po_id').notNull().references(() => mmPurchaseOrder.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  quantityReceived: numeric('quantity_received', { precision: 15, scale: 3 }).notNull().default('0'),
  quantityInvoiced: numeric('quantity_invoiced', { precision: 15, scale: 3 }).notNull().default('0'),
  uom: varchar('uom', { length: 10 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 4 }).notNull(),
  // Landed cost per line for MAP
  freightPerUnit: numeric('freight_per_unit', { precision: 15, scale: 4 }).default('0'),
  customsPerUnit: numeric('customs_per_unit', { precision: 15, scale: 4 }).default('0'),
  taxPerUnit: numeric('tax_per_unit', { precision: 15, scale: 4 }).default('0'),
  totalPerUnit: numeric('total_per_unit', { precision: 15, scale: 4 }).notNull().default('0'), // unit + freight + customs + tax
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  slocId: uuid('sloc_id').references(() => entStorageLocation.id),
  taxCodeId: uuid('tax_code_id'),
  // ERP Item Detail + Account Assignment + Texts Views
  accountAssignment: varchar('account_assignment', { length: 1 }), // K Cost Center, None Inventory
  costCenterId: uuid('cost_center_id'),
  glAccountId: uuid('gl_account_id'),
  itemText: text('item_text'),
  deliveryText: text('delivery_text'),
  isLandedCostRelevant: boolean('is_landed_cost_relevant').default(true).notNull(),
  // DELIV_COMPLETED (legacy ELIKZ) - Delivery Completed Indicator (ERP-like)
  // If true, PO line is closed even if received_qty < ordered_qty (short-shipment final)
  deliveryCompleted: boolean('delivery_completed').default(false).notNull(),
  isClosed: boolean('is_closed').default(false).notNull(), // Final closed flag
  closedReason: varchar('closed_reason', { length: 100 }), // e.g., 'SHORT_SHIPMENT_FINAL', 'CANCELLED'
  closedAt: timestamp('closed_at'),
  closedBy: uuid('closed_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxPo: index('idx_po_line_po').on(t.poId),
  uniquePoLine: uniqueIndex('uq_po_line').on(t.poId, t.lineNumber),
  idxDeliveryCompleted: index('idx_po_line_delivery_completed').on(t.deliveryCompleted),
}));

// Goods Receipt - with landed cost support for MAP
export const mmGoodsReceipt = pgTable('mm_goods_receipt', {
  id: uuid('id').primaryKey().defaultRandom(),
  grNumber: varchar('gr_number', { length: 20 }).notNull().unique(), // 50*
  poId: uuid('po_id').notNull().references(() => mmPurchaseOrder.id),
  companyCodeId: uuid('company_code_id').notNull(),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  status: grStatusEnum('status').notNull().default('DRAFT'),
  postingDate: timestamp('posting_date').notNull(),
  documentDate: timestamp('document_date').notNull(),
  headerText: text('header_text'),
  // Landed cost at GR time (provisional) - final at IV
  totalAmount: numeric('total_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  totalLandedCost: numeric('total_landed_cost', { precision: 15, scale: 3 }).notNull().default('0'),
  fiDocumentId: uuid('fi_document_id'), // Auto INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX)
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxPo: index('idx_gr_po').on(t.poId),
  idxPostingDate: index('idx_gr_posting').on(t.postingDate),
}));

export const mmGrLine = pgTable('mm_gr_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  grId: uuid('gr_id').notNull().references(() => mmGoodsReceipt.id, { onDelete: 'cascade' }),
  poLineId: uuid('po_line_id').notNull().references(() => mmPoLine.id),
  lineNumber: integer('line_number').notNull(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  slocId: uuid('sloc_id').notNull().references(() => entStorageLocation.id),
  batchId: uuid('batch_id').references(() => entBatch.id),
  batchNumber: varchar('batch_number', { length: 30 }),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  uom: varchar('uom', { length: 10 }).notNull(),
  // Valuation at GR
  unitPrice: numeric('unit_price', { precision: 15, scale: 4 }).notNull(), // PO price
  unitLandedCost: numeric('unit_landed_cost', { precision: 15, scale: 4 }).notNull().default('0'), // Freight/customs per unit at GR
  totalValue: numeric('total_value', { precision: 15, scale: 3 }).notNull(), // qty * (price + landed)
  // Stock status
  stockStatus: varchar('stock_status', { length: 20 }).notNull().default('UNRESTRICTED'), // UNRESTRICTED, QI, BLOCKED
  expiryDate: timestamp('expiry_date'),
  // Ledger link
  stockLedgerId: uuid('stock_ledger_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxGr: index('idx_gr_line_gr').on(t.grId),
  idxMaterial: index('idx_gr_line_mat').on(t.materialId),
}));

// --- Stock Transport Order STO - PSTC/IGRC/SDLC – own IP – legacy ME27/MIGO/VL10B - Multi-Plant Logistics ---
export const stoStatusEnum = pgEnum('sto_status', ['DRAFT', 'APPROVED', 'IN_TRANSIT', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED', 'CANCELLED']);
export const stoTypeEnum = pgEnum('sto_type', ['ONE_STEP', 'TWO_STEP']);

export const mmStockTransportOrder = pgTable('mm_stock_transport_order', {
  id: uuid('id').primaryKey().defaultRandom(),
  stoNumber: varchar('sto_number', { length: 20 }).notNull().unique(), // 45* STO
  type: stoTypeEnum('type').notNull().default('TWO_STEP'),
  status: stoStatusEnum('status').notNull().default('DRAFT'),
  companyCodeId: uuid('company_code_id').notNull(),
  supplyingPlantId: uuid('supplying_plant_id').notNull().references(() => entPlant.id), // From plant
  supplyingSlocId: uuid('supplying_sloc_id').references(() => entStorageLocation.id),
  receivingPlantId: uuid('receiving_plant_id').notNull().references(() => entPlant.id), // To plant
  receivingSlocId: uuid('receiving_sloc_id').references(() => entStorageLocation.id),
  // In-transit tracking
  inTransitPlantId: uuid('in_transit_plant_id'), // Virtual plant for in-transit stock
  freightCost: numeric('freight_cost', { precision: 15, scale: 3 }).default('0'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 3 }).default('0'),
  currency: varchar('currency', { length: 3 }).default('KWD'),
  deliveryNumber: varchar('delivery_number', { length: 20 }), // VL10B delivery
  headerText: text('header_text'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxStatus: index('idx_sto_status').on(t.status),
  idxSupplying: index('idx_sto_supplying').on(t.supplyingPlantId),
  idxReceiving: index('idx_sto_receiving').on(t.receivingPlantId),
}));

export const mmStoLine = pgTable('mm_sto_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  stoId: uuid('sto_id').notNull().references(() => mmStockTransportOrder.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  quantityIssued: numeric('quantity_issued', { precision: 15, scale: 3 }).default('0'), // TR_MAT (legacy MIGO 351) – own IP
  quantityReceived: numeric('quantity_received', { precision: 15, scale: 3 }).default('0'), // GR_PO (legacy MIGO 101) – own IP
  quantityInTransit: numeric('quantity_in_transit', { precision: 15, scale: 3 }).default('0'),
  uom: varchar('uom', { length: 10 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 4 }).default('0'), // MAP at time
  batchId: uuid('batch_id').references(() => entBatch.id),
  batchNumber: varchar('batch_number', { length: 30 }),
  isClosed: boolean('is_closed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxSto: index('idx_sto_line_sto').on(t.stoId),
  uniqueStoLine: uniqueIndex('uq_sto_line').on(t.stoId, t.lineNumber),
}));

// Invoice Verification - final landed cost for MAP adjustment
export const mmInvoiceVerification = pgTable('mm_invoice_verification', {
  id: uuid('id').primaryKey().defaultRandom(),
  ivNumber: varchar('iv_number', { length: 20 }).notNull().unique(), // 51*
  grId: uuid('gr_id').references(() => mmGoodsReceipt.id),
  poId: uuid('po_id').notNull().references(() => mmPurchaseOrder.id),
  vendorId: uuid('vendor_id').notNull().references(() => entBusinessPartner.id),
  companyCodeId: uuid('company_code_id').notNull(),
  status: ivStatusEnum('status').notNull().default('DRAFT'),
  invoiceDate: timestamp('invoice_date').notNull(),
  postingDate: timestamp('posting_date').notNull(),
  vendorInvoiceNumber: varchar('vendor_invoice_number', { length: 50 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 15, scale: 3 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  // Landed cost final - triggers MAP adjustment
  freightAmount: numeric('freight_amount', { precision: 15, scale: 3 }).default('0'),
  customsAmount: numeric('customs_amount', { precision: 15, scale: 3 }).default('0'),
  otherCharges: numeric('other_charges', { precision: 15, scale: 3 }).default('0'),
  totalLandedCost: numeric('total_landed_cost', { precision: 15, scale: 3 }).notNull().default('0'),
  // Price variance handling
  priceVariance: numeric('price_variance', { precision: 15, scale: 3 }).default('0'), // Difference between PO and Invoice
  fiDocumentId: uuid('fi_document_id'), // RE + GR_IR_CLEARING clearing + INV_POSTING adjustment (legacy WRX/BSX) – own IP
  apInvoiceId: uuid('ap_invoice_id'), // Link to AP
  isLandedCostPosted: boolean('is_landed_cost_posted').default(false).notNull(), // If true, MAP already adjusted
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxPo: index('idx_iv_po').on(t.poId),
  idxGr: index('idx_iv_gr').on(t.grId),
  idxVendor: index('idx_iv_vendor').on(t.vendorId),
}));

export const mmIvLine = pgTable('mm_iv_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  ivId: uuid('iv_id').notNull().references(() => mmInvoiceVerification.id, { onDelete: 'cascade' }),
  grLineId: uuid('gr_line_id').references(() => mmGrLine.id),
  poLineId: uuid('po_line_id').notNull().references(() => mmPoLine.id),
  lineNumber: integer('line_number').notNull(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  unitPriceInvoiced: numeric('unit_price_invoiced', { precision: 15, scale: 4 }).notNull(), // Final invoiced price
  unitPricePo: numeric('unit_price_po', { precision: 15, scale: 4 }).notNull(),
  // Landed cost per unit final
  freightPerUnit: numeric('freight_per_unit', { precision: 15, scale: 4 }).default('0'),
  customsPerUnit: numeric('customs_per_unit', { precision: 15, scale: 4 }).default('0'),
  otherPerUnit: numeric('other_per_unit', { precision: 15, scale: 4 }).default('0'),
  totalPerUnitFinal: numeric('total_per_unit_final', { precision: 15, scale: 4 }).notNull(), // Final for MAP
  priceVariancePerUnit: numeric('price_variance_per_unit', { precision: 15, scale: 4 }).default('0'),
  taxCodeId: uuid('tax_code_id'),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 3 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxIv: index('idx_iv_line_iv').on(t.ivId),
}));
