import { pgTable, varchar, boolean, timestamp, uuid, text, numeric, pgEnum, integer, index, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';
import { entMaterialMaster, entPlant, entStorageLocation, entBusinessPartner, entBatch } from '../../foundation/enterprise/infrastructure/schema';

export const salesOrderTypeEnum = pgEnum('sales_order_type', ['B2B', 'B2C_CASH', 'B2C_CARD', 'POS_WEBHOOK', 'ECOM']);
export const salesOrderStatusEnum = pgEnum('sales_order_status', ['DRAFT', 'CONFIRMED', 'PARTIALLY_ISSUED', 'FULLY_ISSUED', 'INVOICED', 'CANCELLED']);
export const salesPaymentTypeEnum = pgEnum('sales_payment_type', ['CASH', 'CARD', 'KNET', 'AR', 'ONLINE']);
export const salesSourceEnum = pgEnum('sales_source', ['MANUAL', 'POS_FOODICS', 'POS_SQUARE', 'ECOM_SHOPIFY', 'ECOM_WOOCOM', 'API']);

export const sdSalesOrder = pgTable('sd_sales_order', {
  id: uuid('id').primaryKey().defaultRandom(),
  salesNumber: varchar('sales_number', { length: 20 }).notNull().unique(), // Number range
  type: salesOrderTypeEnum('type').notNull().default('B2B'),
  status: salesOrderStatusEnum('status').notNull().default('DRAFT'),
  companyCodeId: uuid('company_code_id').notNull(),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  // Customer - optional for cash sales
  customerId: uuid('customer_id').references(() => entBusinessPartner.id),
  customerName: varchar('customer_name', { length: 100 }), // For cash sales without BP
  // Payment handling - Cash vs AR routing
  paymentType: salesPaymentTypeEnum('payment_type').notNull().default('AR'),
  isCashSale: boolean('is_cash_sale').notNull().default(false), // True = Dr Cash Cr Revenue, False = Dr AR Cr Revenue
  // Source tracking for webhook
  source: salesSourceEnum('source').notNull().default('MANUAL'),
  externalId: varchar('external_id', { length: 100 }), // POS external order ID
  externalPayload: jsonb('external_payload'), // Original webhook payload
  // Dates
  orderDate: timestamp('order_date').notNull().defaultNow(),
  postingDate: timestamp('posting_date').notNull().defaultNow(),
  requiredDate: timestamp('required_date'),
  // Amounts
  totalAmount: numeric('total_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  discountAmount: numeric('discount_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  netAmount: numeric('net_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  currency: varchar('currency', { length: 3 }).notNull().default('KWD'),
  // FI integration
  fiDocumentId: uuid('fi_document_id'), // Revenue + COGS + AR/Cash
  // For AR flow
  dueDate: timestamp('due_date'),
  isPaid: boolean('is_paid').default(false).notNull(),
  paidAt: timestamp('paid_at'),
  // ERP VA01 9 tabs - Header
  salesOrg: varchar('sales_org', { length: 10 }).default('KSO1'), // Sales Organization OVX2
  distributionChannel: varchar('distribution_channel', { length: 10 }).default('K1'), // K1 Retail, 10 Wholesale, K2 B2B
  division: varchar('division', { length: 10 }).default('K1'), // K1 Spices, 00 Common
  salesOffice: varchar('sales_office', { length: 10 }).default('KSO'),
  salesGroup: varchar('sales_group', { length: 10 }).default('K01'),
  customerPoNumber: varchar('customer_po_number', { length: 50 }), // Customer reference
  docDate: timestamp('doc_date').defaultNow(),
  pricingDate: timestamp('pricing_date').defaultNow(),
  reqDeliveryDate: timestamp('req_delivery_date'),
  // Delivery tab
  shippingPoint: varchar('shipping_point', { length: 10 }).default('KP01'), // Where VL01N delivery created
  deliveryPriority: varchar('delivery_priority', { length: 2 }).default('02'),
  deliveryBlock: varchar('delivery_block', { length: 2 }), // 01 Credit Block, 02 Delivery Block
  route: varchar('route', { length: 10 }).default('KROUTE01'),
  incoterms: varchar('incoterms', { length: 10 }).default('EXW'),
  // Billing tab
  billingType: varchar('billing_type', { length: 5 }).default('F2'), // F2 Invoice
  billingBlock: varchar('billing_block', { length: 2 }),
  paymentTerms: varchar('payment_terms', { length: 10 }).default('0001'),
  // Partners tab (additional, main is customerId)
  shipToPartyId: uuid('ship_to_party_id').references(() => entBusinessPartner.id),
  billToPartyId: uuid('bill_to_party_id').references(() => entBusinessPartner.id),
  payerId: uuid('payer_id').references(() => entBusinessPartner.id),
  // Accounting tab
  accountAssignmentGroup: varchar('account_assignment_group', { length: 10 }).default('01'),
  costCenterId: uuid('cost_center_id'),
  profitCenter: varchar('profit_center', { length: 20 }).default('KS-PC-01'),
  // Audit
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxStatus: index('idx_sales_status').on(t.status),
  idxCustomer: index('idx_sales_customer').on(t.customerId),
  idxExternal: index('idx_sales_external').on(t.externalId, t.source),
  idxPostingDate: index('idx_sales_posting').on(t.postingDate),
  idxSource: index('idx_sales_source').on(t.source),
}));

export const sdSalesLine = pgTable('sd_sales_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  salesOrderId: uuid('sales_order_id').notNull().references(() => sdSalesOrder.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id), // FERT
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  slocId: uuid('sloc_id').notNull().references(() => entStorageLocation.id),
  batchId: uuid('batch_id').references(() => entBatch.id),
  batchNumber: varchar('batch_number', { length: 30 }),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  quantityIssued: numeric('quantity_issued', { precision: 15, scale: 3 }).notNull().default('0'),
  uom: varchar('uom', { length: 10 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 4 }).notNull(),
  discountPerUnit: numeric('discount_per_unit', { precision: 15, scale: 4 }).default('0'),
  taxCodeId: uuid('tax_code_id'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0'),
  lineTotal: numeric('line_total', { precision: 15, scale: 3 }).notNull(),
  // COGS - from material valuation
  cogsPerUnit: numeric('cogs_per_unit', { precision: 15, scale: 4 }).default('0'), // MAP or Standard at time of issue
  totalCogs: numeric('total_cogs', { precision: 15, scale: 3 }).default('0'),
  // Stock ledger link
  stockLedgerId: uuid('stock_ledger_id'),
  // For expiry control check
  expiryDate: timestamp('expiry_date'),
  isExpiryBlocked: boolean('is_expiry_blocked').default(false).notNull(),
  expiryWarning: text('expiry_warning'),
  // ERP VA01 Item Detail additional
  itemCategory: varchar('item_category', { length: 10 }).default('TAN'), // TAN Standard, TAD, TAS
  pricingCondition: varchar('pricing_condition', { length: 10 }).default('PR00'),
  accountAssignment: varchar('account_assignment', { length: 10 }).default('01'),
  costCenterId: uuid('cost_center_id'),
  profitCenter: varchar('profit_center', { length: 20 }),
  shippingPoint: varchar('shipping_point', { length: 10 }),
  deliveryPriority: varchar('delivery_priority', { length: 2 }),
  route: varchar('route', { length: 10 }),
  incoterms: varchar('incoterms', { length: 10 }),
  billingBlock: varchar('billing_block', { length: 2 }),
  taxClassification: varchar('tax_classification', { length: 2 }).default('1'),
  scheduleLineDate: timestamp('schedule_line_date'),
  confirmedQty: numeric('confirmed_qty', { precision: 15, scale: 3 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxSalesOrder: index('idx_sales_line_order').on(t.salesOrderId),
  idxMaterial: index('idx_sales_line_mat').on(t.materialId),
  uniqueSalesLine: uniqueIndex('uq_sales_line').on(t.salesOrderId, t.lineNumber),
}));

// --- Outbound Delivery VL01N - B2B Wholesale - Decoupling Sales Order from GI ---
export const deliveryStatusEnum = pgEnum('delivery_status', ['DRAFT', 'PICKING', 'PICKED', 'GOODS_ISSUED', 'CANCELLED']);
export const sdDelivery = pgTable('sd_delivery', {
  id: uuid('id').primaryKey().defaultRandom(),
  deliveryNumber: varchar('delivery_number', { length: 20 }).notNull().unique(), // 80* Delivery
  salesOrderId: uuid('sales_order_id').notNull().references(() => sdSalesOrder.id),
  companyCodeId: uuid('company_code_id').notNull(),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  shipToCustomerId: uuid('ship_to_customer_id').references(() => entBusinessPartner.id),
  status: deliveryStatusEnum('status').notNull().default('DRAFT'),
  pickingDate: timestamp('picking_date'),
  goodsIssueDate: timestamp('goods_issue_date'),
  // FI link for COGS
  fiDocumentId: uuid('fi_document_id'), // COGS Dr COGS Cr Inventory
  totalQuantity: numeric('total_quantity', { precision: 15, scale: 3 }).default('0'),
  // ERP VL01N tabs
  shippingPoint: varchar('shipping_point', { length: 10 }).default('KP01'),
  deliveryPriority: varchar('delivery_priority', { length: 2 }).default('02'),
  deliveryBlock: varchar('delivery_block', { length: 2 }),
  route: varchar('route', { length: 10 }).default('KROUTE01'),
  incoterms: varchar('incoterms', { length: 10 }).default('EXW'),
  pickingStatus: varchar('picking_status', { length: 20 }).default('Not Picked'),
  goodsMovementStatus: varchar('goods_movement_status', { length: 20 }).default('Not Started'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxSalesOrder: index('idx_delivery_sales').on(t.salesOrderId),
  idxStatus: index('idx_delivery_status').on(t.status),
}));

export const sdDeliveryLine = pgTable('sd_delivery_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  deliveryId: uuid('delivery_id').notNull().references(() => sdDelivery.id, { onDelete: 'cascade' }),
  salesLineId: uuid('sales_line_id').notNull().references(() => sdSalesLine.id),
  lineNumber: integer('line_number').notNull(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  plantId: uuid('plant_id').notNull().references(() => entPlant.id),
  slocId: uuid('sloc_id').notNull().references(() => entStorageLocation.id),
  batchId: uuid('batch_id').references(() => entBatch.id),
  batchNumber: varchar('batch_number', { length: 30 }),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  quantityPicked: numeric('quantity_picked', { precision: 15, scale: 3 }).default('0'),
  quantityIssued: numeric('quantity_issued', { precision: 15, scale: 3 }).default('0'), // 601
  uom: varchar('uom', { length: 10 }).notNull(),
  stockLedgerId: uuid('stock_ledger_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxDelivery: index('idx_delivery_line_delivery').on(t.deliveryId),
}));

// --- Billing VF01 - B2B AR - Decoupling Delivery from Invoicing ---
export const billingStatusEnum = pgEnum('billing_status', ['DRAFT', 'POSTED', 'CANCELLED']);
export const billingTypeEnum = pgEnum('billing_type', ['F2', 'F1', 'CREDIT', 'DEBIT']); // F2 Invoice, F1 Order-related, etc
export const sdBilling = pgTable('sd_billing', {
  id: uuid('id').primaryKey().defaultRandom(),
  billingNumber: varchar('billing_number', { length: 20 }).notNull().unique(), // 90* Billing
  type: billingTypeEnum('type').notNull().default('F2'),
  status: billingStatusEnum('status').notNull().default('DRAFT'),
  salesOrderId: uuid('sales_order_id').notNull().references(() => sdSalesOrder.id),
  deliveryId: uuid('delivery_id').references(() => sdDelivery.id), // Optional link to delivery for B2B
  companyCodeId: uuid('company_code_id').notNull(),
  customerId: uuid('customer_id').references(() => entBusinessPartner.id),
  billingDate: timestamp('billing_date').notNull().defaultNow(),
  // Amounts
  totalAmount: numeric('total_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 3 }).default('0'),
  netAmount: numeric('net_amount', { precision: 15, scale: 3 }).default('0'),
  currency: varchar('currency', { length: 3 }).default('KWD'),
  // FI integration - AR
  fiDocumentId: uuid('fi_document_id'), // Dr AR Cr Revenue + Tax
  dueDate: timestamp('due_date'),
  isPaid: boolean('is_paid').default(false).notNull(),
  // ERP VF01 tabs
  billingType: varchar('billing_type_detail', { length: 10 }).default('F2'),
  billingBlock: varchar('billing_block', { length: 2 }),
  paymentTerms: varchar('payment_terms', { length: 10 }).default('0001'),
  incoterms: varchar('incoterms', { length: 10 }).default('EXW'),
  pricingDate: timestamp('pricing_date').defaultNow(),
  accountAssignmentGroup: varchar('account_assignment_group', { length: 10 }).default('01'),
  costCenterId: uuid('cost_center_id'),
  profitCenter: varchar('profit_center', { length: 20 }),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxSalesOrder: index('idx_billing_sales').on(t.salesOrderId),
  idxDelivery: index('idx_billing_delivery').on(t.deliveryId),
  idxStatus: index('idx_billing_status').on(t.status),
}));

export const sdBillingLine = pgTable('sd_billing_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  billingId: uuid('billing_id').notNull().references(() => sdBilling.id, { onDelete: 'cascade' }),
  deliveryLineId: uuid('delivery_line_id').references(() => sdDeliveryLine.id),
  salesLineId: uuid('sales_line_id').notNull().references(() => sdSalesLine.id),
  lineNumber: integer('line_number').notNull(),
  materialId: uuid('material_id').notNull().references(() => entMaterialMaster.id),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 4 }).notNull(),
  lineTotal: numeric('line_total', { precision: 15, scale: 3 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 3 }).default('0'),
  cogsPerUnit: numeric('cogs_per_unit', { precision: 15, scale: 4 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxBilling: index('idx_billing_line_billing').on(t.billingId),
}));

// Webhook log for POS integration - audit trail
export const sdPosWebhookLog = pgTable('sd_pos_webhook_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: salesSourceEnum('source').notNull(),
  externalId: varchar('external_id', { length: 100 }),
  payload: jsonb('payload').notNull(),
  headers: jsonb('headers'),
  salesOrderId: uuid('sales_order_id').references(() => sdSalesOrder.id),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'), // PENDING, PROCESSED, FAILED
  errorMessage: text('error_message'),
  processingTimeMs: integer('processing_time_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxSourceExternal: index('idx_webhook_source_ext').on(t.source, t.externalId),
  idxStatus: index('idx_webhook_status').on(t.status),
}));
