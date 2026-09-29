import { pgTable, varchar, boolean, timestamp, uuid, text, numeric, integer, pgEnum, uniqueIndex, index, jsonb } from 'drizzle-orm/pg-core';
import { orgLegalEntity, orgFacility, orgInventoryLocation, orgCommercialOrg, orgSalesChannel, orgProductLine, orgCostUnit } from '../../foundation/enterprise/infrastructure/orgStructureSchema';
import { prodItem } from '../../foundation/enterprise/infrastructure/productCatalogSchema';
import { partnerAccount } from '../../foundation/enterprise/infrastructure/partnerAccountSchema';
import { invLot } from '../../foundation/enterprise/infrastructure/productCatalogSchema';
import { coreCurrency } from '../../foundation/enterprise/infrastructure/financialsFoundationSchema';
import { finTaxRule } from '../../foundation/enterprise/infrastructure/financialsFoundationSchema';

/**
 * Module 8 – SD Sales & Distribution – Legal-Safe Own IP
 * Replaces sd_* tables with sales_* – legal-safe
 * Maps:
 * - sd_sales_order → sales_order – salesNumber SO-10000001 was number range, type B2B/B2C_CASH/B2C_CARD/POS_WEBHOOK/ECOM, status DRAFT/CONFIRMED/PARTIALLY_ISSUED/FULLY_ISSUED/INVOICED/CANCELLED, legalEntityId was company_code_id, facilityId was plant_id FAC-1000 was 1000, partnerId was customer_id partner_account SCUC was customer, customerName for cash sales, paymentType CASH/CARD/KNET/AR/ONLINE, isCashSale Dr Cash Cr Revenue vs Dr AR Cr Revenue, source MANUAL/POS_FOODICS/POS_SQUARE/ECOM_SHOPIFY/ECOM_WOOCOM/API, externalId POS external order ID, externalPayload jsonb, orderDate/postingDate/requiredDate, totalAmount/taxAmount/discountAmount/netAmount currencyCode INR default was KWD, universalLedgerId was fi_document_id FULC Revenue+COGS+AR/Cash, dueDate isPaid paidAt, commercialOrgId was sales_org CO-1000 was KSO1 OVX2, salesChannelId was distribution_channel CH-10 was K1, productLineId was division PL-00 was K1, salesOffice/salesGroup, customerPoNumber, docDate/pricingDate/reqDeliveryDate, shippingPoint was dispatch_point DP-1000 was KP01 VL01N, deliveryPriority 02, deliveryBlock 01 Credit Block 02 Delivery Block, route KROUTE01, incoterms EXW/FOB/CIF, billingType F2 Invoice, billingBlock, paymentTerms 0001, shipToPartyId billToPartyId payerId partner_account, accountAssignmentGroup 01 costUnitId ECUC profitUnitId EPUC
 * - sd_sales_line → sales_order_line – salesOrderId, lineNumber, itemId was material_id prod_item EMTC FERT, facilityId was plant_id, inventoryLocationId was sloc_id, lotId was batch_id ELTC, lotNumber was batch_number, quantity, quantityIssued, uomCode was uom EUOC, unitPrice, discountPerUnit, taxRuleId was tax_code FTXC, taxRate, lineTotal, cogsPerUnit MAP/Standard, totalCogs, stockLedgerId, expiryDate isExpiryBlocked expiryWarning, itemCategory TAN Standard, pricingCondition PR00, accountAssignment 01 costUnitId profitUnitId, shippingPoint deliveryPriority route incoterms billingBlock taxClassification 1 scheduleLineDate confirmedQty
 * - sd_delivery → sales_delivery – deliveryNumber DN-80000001 was 80* Delivery, salesOrderId, legalEntityId was company_code_id, facilityId was plant_id, shipToPartnerId was ship_to_customer_id partner_account, status DRAFT/PICKING/PICKED/GOODS_ISSUED/CANCELLED, pickingDate goodsIssueDate, universalLedgerId was fi_document_id FULC COGS Dr COGS Cr Inventory, totalQuantity, shippingPoint deliveryPriority deliveryBlock route incoterms pickingStatus goodsMovementStatus VL01N
 * - sd_delivery_line → sales_delivery_line – deliveryId, salesLineId, lineNumber, itemId was material_id, facilityId was plant_id, inventoryLocationId was sloc_id, lotId was batch_id ELTC, lotNumber was batch_number, quantity, quantityPicked, quantityIssued 601, uomCode, stockLedgerId
 * - sd_billing → sales_billing – billingNumber BILL-90000001 was 90* Billing, type F2/F1/CREDIT/DEBIT, status DRAFT/POSTED/CANCELLED, salesOrderId, deliveryId, legalEntityId was company_code_id, partnerId was customer_id partner_account SCUC, billingDate, totalAmount/taxAmount/netAmount currencyCode INR was KWD, universalLedgerId was fi_document_id FULC Dr AR Cr Revenue+Tax, dueDate isPaid, billingType F2, billingBlock, paymentTerms 0001, incoterms EXW, pricingDate, accountAssignmentGroup 01 costUnitId profitUnitId EPUC VF01
 * - sd_billing_line → sales_billing_line – billingId, deliveryLineId, salesLineId, lineNumber, itemId was material_id, quantity, unitPrice, lineTotal, taxAmount, cogsPerUnit
 * - sd_pos_webhook_log → sales_pos_webhook_log – source MANUAL/POS_FOODICS/POS_SQUARE/ECOM_SHOPIFY/ECOM_WOOCOM/API, externalId, payload jsonb, headers jsonb, salesOrderId, status PENDING/PROCESSED/FAILED, errorMessage, processingTimeMs
 * - NEW: sales_customer_item – customer-material relationships – partnerId, itemId, customerItemNumber, customerItemDescription, isActive
 * - NEW: sales_pricing_condition – already in Module5 fin_pricing_condition but SD specific access via sales_pricing
 * Sample: none – fresh empty per requirement, but prod_item, facility, UoM, partner, tax, currency kept
 * Helper codes: SSOC Sales Order Create (alias SOC, VA01, FIN-SO-CR), SDLC Delivery Create (alias DLC, VL01N, FIN-DN-CR), SBLC Billing Create (alias BLC, VF01, FIN-BL-CR), SPWC POS Webhook Create (alias PWC), SCMR Customer-Material Rel Create (alias CMR), SPRC Pricing Create (alias PRC, VK11)
 * 4-char MOOA: S=Sales, SO=SalesOrder, C=Create etc – module grouped intuitive, same length as VA01/VL01N/VF01 but own IP
 */

export const salesOrderTypeEnumNew = pgEnum('sales_order_type_new', ['B2B', 'B2C_CASH', 'B2C_CARD', 'POS_WEBHOOK', 'ECOM']);
export const salesOrderStatusEnumNew = pgEnum('sales_order_status_new', ['DRAFT', 'CONFIRMED', 'PARTIALLY_ISSUED', 'FULLY_ISSUED', 'INVOICED', 'CANCELLED']);
export const salesPaymentTypeEnumNew = pgEnum('sales_payment_type_new', ['CASH', 'CARD', 'KNET', 'AR', 'ONLINE']);
export const salesSourceEnumNew = pgEnum('sales_source_new', ['MANUAL', 'POS_FOODICS', 'POS_SQUARE', 'ECOM_SHOPIFY', 'ECOM_WOOCOM', 'API']);
export const salesDeliveryStatusEnumNew = pgEnum('sales_delivery_status_new', ['DRAFT', 'PICKING', 'PICKED', 'GOODS_ISSUED', 'CANCELLED']);
export const salesBillingStatusEnumNew = pgEnum('sales_billing_status_new', ['DRAFT', 'POSTED', 'CANCELLED']);
export const salesBillingTypeEnumNew = pgEnum('sales_billing_type_new', ['F2', 'F1', 'CREDIT', 'DEBIT']);

// Aliases for backward compat inside this file
const salesOrderTypeEnum = salesOrderTypeEnumNew;
const salesOrderStatusEnum = salesOrderStatusEnumNew;
const salesPaymentTypeEnum = salesPaymentTypeEnumNew;
const salesSourceEnum = salesSourceEnumNew;
const salesDeliveryStatusEnum = salesDeliveryStatusEnumNew;
const salesBillingStatusEnum = salesBillingStatusEnumNew;
const salesBillingTypeEnum = salesBillingTypeEnumNew;

// Sales Order – legal-safe sales_order – SSOC
export const salesOrder = pgTable('sales_order', {
  id: uuid('id').primaryKey().defaultRandom(),
  salesNumber: varchar('sales_number', { length: 20 }).notNull().unique(), // SO-10000001 – neutral, was number range
  type: salesOrderTypeEnum('type').notNull().default('B2B'),
  status: salesOrderStatusEnum('status').notNull().default('DRAFT'),
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id), // was company_code_id – LE-1000
  companyCodeId: uuid('company_code_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id – FAC-1000
  plantId: uuid('plant_id'), // legacy alias
  partnerId: uuid('partner_id').references(() => partnerAccount.id), // was customer_id – SCUC
  customerId: uuid('customer_id'), // legacy alias
  customerName: varchar('customer_name', { length: 100 }), // for cash sales without BP
  paymentType: salesPaymentTypeEnum('payment_type').notNull().default('AR'),
  isCashSale: boolean('is_cash_sale').notNull().default(false),
  source: salesSourceEnum('source').notNull().default('MANUAL'),
  externalId: varchar('external_id', { length: 100 }),
  externalPayload: jsonb('external_payload'),
  orderDate: timestamp('order_date').notNull().defaultNow(),
  postingDate: timestamp('posting_date').notNull().defaultNow(),
  requiredDate: timestamp('required_date'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  discountAmount: numeric('discount_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  netAmount: numeric('net_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  currencyCode: varchar('currency_code', { length: 3 }).notNull().default('INR').references(() => coreCurrency.code), // INR default – was KWD
  currency: varchar('currency', { length: 3 }), // legacy alias KWD
  universalLedgerId: uuid('universal_ledger_id'), // was fi_document_id – FULC
  fiDocumentId: uuid('fi_document_id'), // legacy alias
  dueDate: timestamp('due_date'),
  isPaid: boolean('is_paid').default(false).notNull(),
  paidAt: timestamp('paid_at'),
  commercialOrgId: uuid('commercial_org_id').references(() => orgCommercialOrg.id), // was sales_org – CO-1000
  salesOrg: varchar('sales_org', { length: 10 }), // legacy alias KSO1
  salesChannelId: uuid('sales_channel_id').references(() => orgSalesChannel.id), // was distribution_channel – CH-10
  distributionChannel: varchar('distribution_channel', { length: 10 }), // legacy alias K1
  productLineId: uuid('product_line_id').references(() => orgProductLine.id), // was division – PL-00
  division: varchar('division', { length: 10 }), // legacy alias K1
  salesOffice: varchar('sales_office', { length: 10 }).default('KSO'),
  salesGroup: varchar('sales_group', { length: 10 }).default('K01'),
  customerPoNumber: varchar('customer_po_number', { length: 50 }),
  docDate: timestamp('doc_date').defaultNow(),
  pricingDate: timestamp('pricing_date').defaultNow(),
  reqDeliveryDate: timestamp('req_delivery_date'),
  shippingPoint: varchar('shipping_point', { length: 10 }).default('DP-1000'), // was KP01 – DP-1000
  deliveryPriority: varchar('delivery_priority', { length: 2 }).default('02'),
  deliveryBlock: varchar('delivery_block', { length: 2 }),
  route: varchar('route', { length: 10 }).default('ROUTE-01'), // was KROUTE01
  incoterms: varchar('incoterms', { length: 10 }).default('EXW'),
  billingType: varchar('billing_type', { length: 5 }).default('F2'),
  billingBlock: varchar('billing_block', { length: 2 }),
  paymentTerms: varchar('payment_terms', { length: 10 }).default('0001'),
  shipToPartnerId: uuid('ship_to_partner_id').references(() => partnerAccount.id), // was ship_to_party_id
  shipToPartyId: uuid('ship_to_party_id'), // legacy alias
  billToPartnerId: uuid('bill_to_partner_id').references(() => partnerAccount.id), // was bill_to_party_id
  billToPartyId: uuid('bill_to_party_id'), // legacy alias
  payerPartnerId: uuid('payer_partner_id').references(() => partnerAccount.id), // was payer_id
  payerId: uuid('payer_id'), // legacy alias
  accountAssignmentGroup: varchar('account_assignment_group', { length: 10 }).default('01'),
  costUnitId: uuid('cost_unit_id').references(() => orgCostUnit.id), // was cost_center_id – ECUC
  costCenterId: uuid('cost_center_id'), // legacy alias
  profitUnitId: uuid('profit_unit_id'), // org_profit_unit – EPUC – was profit_center varchar
  profitCenter: varchar('profit_center', { length: 20 }), // legacy alias KS-PC-01
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxStatus: index('idx_sales_order_status').on(t.status),
  idxPartner: index('idx_sales_order_partner').on(t.partnerId),
  idxExternal: index('idx_sales_order_external').on(t.externalId, t.source),
  idxPostingDate: index('idx_sales_order_posting').on(t.postingDate),
  idxSource: index('idx_sales_order_source').on(t.source),
  idxFacility: index('idx_sales_order_facility').on(t.facilityId),
}));

// Sales Line – legal-safe sales_order_line
export const salesOrderLine = pgTable('sales_order_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  salesOrderId: uuid('sales_order_id').notNull().references(() => salesOrder.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // was material_id – FERT – EMTC
  materialId: uuid('material_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id
  plantId: uuid('plant_id'), // legacy alias
  inventoryLocationId: uuid('inventory_location_id').notNull().references(() => orgInventoryLocation.id), // was sloc_id
  slocId: uuid('sloc_id'), // legacy alias
  lotId: uuid('lot_id').references(() => invLot.id), // was batch_id – ELTC
  batchId: uuid('batch_id'), // legacy alias
  lotNumber: varchar('lot_number', { length: 30 }), // was batch_number – ELTC lot_number
  batchNumber: varchar('batch_number', { length: 30 }), // legacy alias
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  quantityIssued: numeric('quantity_issued', { precision: 15, scale: 3 }).notNull().default('0'),
  uomCode: varchar('uom_code', { length: 10 }).notNull(), // KG, PC – EUOC
  uom: varchar('uom', { length: 10 }), // legacy alias
  unitPrice: numeric('unit_price', { precision: 15, scale: 4 }).notNull(),
  discountPerUnit: numeric('discount_per_unit', { precision: 15, scale: 4 }).default('0'),
  taxRuleId: uuid('tax_rule_id').references(() => finTaxRule.id), // was tax_code_id – FTXC
  taxCodeId: uuid('tax_code_id'), // legacy alias
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0'),
  lineTotal: numeric('line_total', { precision: 15, scale: 3 }).notNull(),
  cogsPerUnit: numeric('cogs_per_unit', { precision: 15, scale: 4 }).default('0'),
  totalCogs: numeric('total_cogs', { precision: 15, scale: 3 }).default('0'),
  stockLedgerId: uuid('stock_ledger_id'),
  expiryDate: timestamp('expiry_date'),
  isExpiryBlocked: boolean('is_expiry_blocked').default(false).notNull(),
  expiryWarning: text('expiry_warning'),
  itemCategory: varchar('item_category', { length: 10 }).default('TAN'),
  pricingCondition: varchar('pricing_condition', { length: 10 }).default('PR00'),
  accountAssignment: varchar('account_assignment', { length: 10 }).default('01'),
  costUnitId: uuid('cost_unit_id').references(() => orgCostUnit.id),
  costCenterId: uuid('cost_center_id'), // legacy alias
  profitUnitId: uuid('profit_unit_id'),
  profitCenter: varchar('profit_center', { length: 20 }), // legacy alias
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
  idxSalesOrder: index('idx_sales_order_line_order').on(t.salesOrderId),
  idxItem: index('idx_sales_order_line_item').on(t.itemId),
  uniqueSalesLine: uniqueIndex('uq_sales_order_line').on(t.salesOrderId, t.lineNumber),
}));

// Delivery – legal-safe sales_delivery – SDLC
export const salesDelivery = pgTable('sales_delivery', {
  id: uuid('id').primaryKey().defaultRandom(),
  deliveryNumber: varchar('delivery_number', { length: 20 }).notNull().unique(), // DN-80000001 was 80*
  salesOrderId: uuid('sales_order_id').notNull().references(() => salesOrder.id),
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id), // was company_code_id
  companyCodeId: uuid('company_code_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id
  plantId: uuid('plant_id'), // legacy alias
  shipToPartnerId: uuid('ship_to_partner_id').references(() => partnerAccount.id), // was ship_to_customer_id
  shipToCustomerId: uuid('ship_to_customer_id'), // legacy alias
  status: salesDeliveryStatusEnum('status').notNull().default('DRAFT'),
  pickingDate: timestamp('picking_date'),
  goodsIssueDate: timestamp('goods_issue_date'),
  universalLedgerId: uuid('universal_ledger_id'), // was fi_document_id – FULC COGS
  fiDocumentId: uuid('fi_document_id'), // legacy alias
  totalQuantity: numeric('total_quantity', { precision: 15, scale: 3 }).default('0'),
  shippingPoint: varchar('shipping_point', { length: 10 }).default('DP-1000'), // was KP01
  deliveryPriority: varchar('delivery_priority', { length: 2 }).default('02'),
  deliveryBlock: varchar('delivery_block', { length: 2 }),
  route: varchar('route', { length: 10 }).default('ROUTE-01'),
  incoterms: varchar('incoterms', { length: 10 }).default('EXW'),
  pickingStatus: varchar('picking_status', { length: 20 }).default('Not Picked'),
  goodsMovementStatus: varchar('goods_movement_status', { length: 20 }).default('Not Started'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxSalesOrder: index('idx_sales_delivery_sales').on(t.salesOrderId),
  idxStatus: index('idx_sales_delivery_status').on(t.status),
  idxFacility: index('idx_sales_delivery_facility').on(t.facilityId),
}));

// Delivery Line – legal-safe sales_delivery_line
export const salesDeliveryLine = pgTable('sales_delivery_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  deliveryId: uuid('delivery_id').notNull().references(() => salesDelivery.id, { onDelete: 'cascade' }),
  salesLineId: uuid('sales_line_id').notNull().references(() => salesOrderLine.id),
  lineNumber: integer('line_number').notNull(),
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // was material_id
  materialId: uuid('material_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id
  plantId: uuid('plant_id'), // legacy alias
  inventoryLocationId: uuid('inventory_location_id').notNull().references(() => orgInventoryLocation.id), // was sloc_id
  slocId: uuid('sloc_id'), // legacy alias
  lotId: uuid('lot_id').references(() => invLot.id), // was batch_id
  batchId: uuid('batch_id'), // legacy alias
  lotNumber: varchar('lot_number', { length: 30 }), // was batch_number
  batchNumber: varchar('batch_number', { length: 30 }), // legacy alias
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  quantityPicked: numeric('quantity_picked', { precision: 15, scale: 3 }).default('0'),
  quantityIssued: numeric('quantity_issued', { precision: 15, scale: 3 }).default('0'), // 601
  uomCode: varchar('uom_code', { length: 10 }).notNull(),
  uom: varchar('uom', { length: 10 }), // legacy alias
  stockLedgerId: uuid('stock_ledger_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxDelivery: index('idx_sales_delivery_line_delivery').on(t.deliveryId),
  idxItem: index('idx_sales_delivery_line_item').on(t.itemId),
}));

// Billing – legal-safe sales_billing – SBLC
export const salesBilling = pgTable('sales_billing', {
  id: uuid('id').primaryKey().defaultRandom(),
  billingNumber: varchar('billing_number', { length: 20 }).notNull().unique(), // BILL-90000001 was 90*
  type: salesBillingTypeEnum('type').notNull().default('F2'),
  status: salesBillingStatusEnum('status').notNull().default('DRAFT'),
  salesOrderId: uuid('sales_order_id').notNull().references(() => salesOrder.id),
  deliveryId: uuid('delivery_id').references(() => salesDelivery.id),
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id), // was company_code_id
  companyCodeId: uuid('company_code_id'), // legacy alias
  partnerId: uuid('partner_id').references(() => partnerAccount.id), // was customer_id – SCUC
  customerId: uuid('customer_id'), // legacy alias
  billingDate: timestamp('billing_date').notNull().defaultNow(),
  totalAmount: numeric('total_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 3 }).default('0'),
  netAmount: numeric('net_amount', { precision: 15, scale: 3 }).default('0'),
  currencyCode: varchar('currency_code', { length: 3 }).default('INR').references(() => coreCurrency.code), // INR default was KWD
  currency: varchar('currency', { length: 3 }), // legacy alias KWD
  universalLedgerId: uuid('universal_ledger_id'), // was fi_document_id – FULC Dr AR Cr Revenue+Tax
  fiDocumentId: uuid('fi_document_id'), // legacy alias
  dueDate: timestamp('due_date'),
  isPaid: boolean('is_paid').default(false).notNull(),
  billingType: varchar('billing_type_detail', { length: 10 }).default('F2'),
  billingBlock: varchar('billing_block', { length: 2 }),
  paymentTerms: varchar('payment_terms', { length: 10 }).default('0001'),
  incoterms: varchar('incoterms', { length: 10 }).default('EXW'),
  pricingDate: timestamp('pricing_date').defaultNow(),
  accountAssignmentGroup: varchar('account_assignment_group', { length: 10 }).default('01'),
  costUnitId: uuid('cost_unit_id').references(() => orgCostUnit.id),
  costCenterId: uuid('cost_center_id'), // legacy alias
  profitUnitId: uuid('profit_unit_id'),
  profitCenter: varchar('profit_center', { length: 20 }), // legacy alias
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxSalesOrder: index('idx_sales_billing_sales').on(t.salesOrderId),
  idxDelivery: index('idx_sales_billing_delivery').on(t.deliveryId),
  idxStatus: index('idx_sales_billing_status').on(t.status),
  idxPartner: index('idx_sales_billing_partner').on(t.partnerId),
}));

// Billing Line – legal-safe sales_billing_line
export const salesBillingLine = pgTable('sales_billing_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  billingId: uuid('billing_id').notNull().references(() => salesBilling.id, { onDelete: 'cascade' }),
  deliveryLineId: uuid('delivery_line_id').references(() => salesDeliveryLine.id),
  salesLineId: uuid('sales_line_id').notNull().references(() => salesOrderLine.id),
  lineNumber: integer('line_number').notNull(),
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // was material_id
  materialId: uuid('material_id'), // legacy alias
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 4 }).notNull(),
  lineTotal: numeric('line_total', { precision: 15, scale: 3 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 3 }).default('0'),
  cogsPerUnit: numeric('cogs_per_unit', { precision: 15, scale: 4 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxBilling: index('idx_sales_billing_line_billing').on(t.billingId),
  idxItem: index('idx_sales_billing_line_item').on(t.itemId),
}));

// POS Webhook Log – legal-safe sales_pos_webhook_log
export const salesPosWebhookLog = pgTable('sales_pos_webhook_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: salesSourceEnum('source').notNull(),
  externalId: varchar('external_id', { length: 100 }),
  payload: jsonb('payload').notNull(),
  headers: jsonb('headers'),
  salesOrderId: uuid('sales_order_id').references(() => salesOrder.id),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  errorMessage: text('error_message'),
  processingTimeMs: integer('processing_time_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxSourceExternal: index('idx_sales_webhook_source_ext').on(t.source, t.externalId),
  idxStatus: index('idx_sales_webhook_status').on(t.status),
}));

// Customer-Material Relationships – NEW – sales_customer_item – SCMR
export const salesCustomerItem = pgTable('sales_customer_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  partnerId: uuid('partner_id').notNull().references(() => partnerAccount.id), // customer – SCUC
  customerId: uuid('customer_id'), // legacy alias
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // material – EMTC
  materialId: uuid('material_id'), // legacy alias
  customerItemNumber: varchar('customer_item_number', { length: 50 }).notNull(), // customer-specific material number
  customerItemDescription: varchar('customer_item_description', { length: 200 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniquePartnerItem: uniqueIndex('uq_sales_customer_item').on(t.partnerId, t.itemId),
  idxPartner: index('idx_sales_customer_item_partner').on(t.partnerId),
  idxItem: index('idx_sales_customer_item_item').on(t.itemId),
}));

// Supplier-Material Relationships – already in Module6 proc_supplier_item via proc_info_record, but also for sales we have supplier-material via info record
// For completeness, sales_supplier_item is same as proc_info_record – we keep proc_info_record as master
