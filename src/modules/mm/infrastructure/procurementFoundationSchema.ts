import { pgTable, varchar, boolean, timestamp, uuid, text, numeric, integer, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { orgLegalEntity, orgFacility, orgInventoryLocation, orgProcurementDivision, orgBuyerTeam } from '../../foundation/enterprise/infrastructure/orgStructureSchema';
import { prodItem } from '../../foundation/enterprise/infrastructure/productCatalogSchema';
import { partnerAccount } from '../../foundation/enterprise/infrastructure/partnerAccountSchema';
import { invLot } from '../../foundation/enterprise/infrastructure/productCatalogSchema';
import { coreCurrency } from '../../foundation/enterprise/infrastructure/financialsFoundationSchema';
import { finTaxRule, finLedgerAccount } from '../../foundation/enterprise/infrastructure/financialsFoundationSchema';
import { orgCostUnit } from '../../foundation/enterprise/infrastructure/orgStructureSchema';

/**
 * Module 6 – MM Procurement & Inventory – Legal-Safe Own IP
 * Replaces mm_* tables with proc_* – legal-safe
 * Maps:
 * - mm_purchase_requisition → proc_purchase_requisition – prNumber, legalEntityId was company_code_id, facilityId was plant_id, procurementDivision was purchasing_org, buyerTeam was purchasing_group, requesterId hr_employee, status, currency INR default
 * - mm_pr_line → proc_pr_line – itemId was material_id prod_item, uomCode was uom core_unit_measure, facilityId was plant_id, inventoryLocationId was sloc_id, taxRuleId was tax_code, ledgerAccountId was gl_account, costUnitId was cost_center
 * - mm_purchase_order → proc_purchase_order – poNumber 45*, legalEntityId was company_code_id, partnerId was vendor_id partner_account, facilityId was plant_id, status, totalAmount INR, procurementDivision, buyerTeam, paymentTerms, incoterms EXW/FOB/CIF, landed cost freight/customs/tax
 * - mm_po_line → proc_po_line – itemId prod_item, uomCode, facilityId, inventoryLocationId, taxRuleId, costUnitId, ledgerAccountId, deliveryCompleted was DELIV_COMPLETED (legacy ELIKZ), isClosed
 * - mm_goods_receipt → proc_goods_receipt – grNumber 50*, poId, legalEntityId, facilityId, status, postingDate, universalLedgerId was fi_document_id
 * - mm_gr_line → proc_gr_line – itemId, facilityId, inventoryLocationId, lotId was batch_id inv_lot, lotNumber was batch_number, uomCode, stockStatus UNRESTRICTED/QI/BLOCKED, expiryDate
 * - mm_stock_transport_order → proc_stock_transport_order – stoNumber, type ONE_STEP/TWO_STEP, supplyingFacilityId was supplying_plant_id, receivingFacilityId, inTransitFacilityId
 * - mm_invoice_verification → proc_invoice_verification – ivNumber 51*, grId, poId, partnerId was vendor_id, legalEntityId, vendorInvoiceNumber, priceVariance, universalLedgerId was fi_document_id, isLandedCostPosted for MAP adjustment
 * - NEW: proc_info_record – purchasing info record – partnerId, itemId, facilityId, validFrom/To, unitPrice, leadTimeDays, minOrderQty – replaces proc_info_record legacy
 * - NEW: proc_source_list – source list – itemId, facilityId, partnerId, validFrom/To, isMrpRelevant, priority – replaces proc_source_list legacy
 * - NEW: proc_purchasing_condition – pricing conditions for PO – conditionType BASE/DISCOUNT/FREIGHT/CUSTOMS/TAX
 * Sample data: none – fresh empty per requirement, but UoM, currencies, tax, CoA, GL kept from Module4
 * Helper codes: PPRC PR Create (alias PRC, ME51N, FIN-PR-CR), PPOC PO Create (alias POC, ME21N, FIN-PO-CR), PGRC GR Create (alias GRC, MIGO, FIN-GR-CR), PIVC IV Create (alias IVC, MIRO, FIN-IV-CR), PSTC STO Create (alias STC, ME27), PIRC Info Record Create (alias IRC, ME11), PSRC Source List Create (alias SRC, ME01)
 * 4-char MOOA: P=Procurement, PR=PurchaseRequisition, C=Create etc – module grouped intuitive, same length as PPRC/PPOC/IGRC/PIVC own IP (legacy ME51N/ME21N/MIGO/MIRO) but own IP
 */

export const procPrStatusEnum = pgEnum('proc_pr_status', ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONVERTED_TO_PO', 'CANCELLED']);
export const procPoStatusEnum = pgEnum('proc_po_status', ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED', 'CANCELLED']);
export const procGrStatusEnum = pgEnum('proc_gr_status', ['DRAFT', 'POSTED', 'CANCELLED']);
export const procIvStatusEnum = pgEnum('proc_iv_status', ['DRAFT', 'POSTED', 'BLOCKED', 'CANCELLED']);
export const procStoStatusEnum = pgEnum('proc_sto_status', ['DRAFT', 'APPROVED', 'IN_TRANSIT', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED', 'CANCELLED']);
export const procStoTypeEnum = pgEnum('proc_sto_type', ['ONE_STEP', 'TWO_STEP']);
export const procStockStatusEnum = pgEnum('proc_stock_status', ['UNRESTRICTED', 'QUALITY_INSPECTION', 'BLOCKED', 'IN_TRANSIT']);

// Purchase Requisition – legal-safe proc_purchase_requisition – PPRC
export const procPurchaseRequisition = pgTable('proc_purchase_requisition', {
  id: uuid('id').primaryKey().defaultRandom(),
  prNumber: varchar('pr_number', { length: 20 }).notNull().unique(), // PR-10000001 – neutral, was 10* from number range
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id), // was company_code_id – legal-safe
  companyCodeId: uuid('company_code_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id – legal-safe FAC-1000
  plantId: uuid('plant_id'), // legacy alias
  requesterId: uuid('requester_id'), // hr_employee – requester
  status: procPrStatusEnum('status').notNull().default('DRAFT'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  currencyCode: varchar('currency_code', { length: 3 }).notNull().default('INR').references(() => coreCurrency.code), // INR default – was currency KWD
  currency: varchar('currency', { length: 3 }), // legacy alias
  requiredDate: timestamp('required_date'),
  headerText: text('header_text'),
  docDate: timestamp('doc_date').defaultNow(),
  procurementDivisionId: uuid('procurement_division_id').references(() => orgProcurementDivision.id), // was purchasing_org – PD-1000
  purchasingOrg: varchar('purchasing_org', { length: 10 }), // legacy alias 1000/KPO1
  buyerTeamId: uuid('buyer_team_id').references(() => orgBuyerTeam.id), // was purchasing_group – BUY-001
  purchasingGroup: varchar('purchasing_group', { length: 10 }), // legacy alias 001/K01
  workflowInstanceId: uuid('workflow_instance_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxStatus: index('idx_proc_pr_status').on(t.status),
  idxRequester: index('idx_proc_pr_requester').on(t.requesterId),
  idxFacility: index('idx_proc_pr_facility').on(t.facilityId),
}));

// PR Line – legal-safe proc_pr_line
export const procPrLine = pgTable('proc_pr_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  prId: uuid('pr_id').notNull().references(() => procPurchaseRequisition.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // was material_id – prod_item – EMTC
  materialId: uuid('material_id'), // legacy alias
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  uomCode: varchar('uom_code', { length: 10 }).notNull().references(() => coreCurrency.code), // Actually UoM – will reference core_unit_measure via varchar – keep simple
  uom: varchar('uom', { length: 10 }), // legacy alias – e.g., KG, PC – EUOC
  estimatedPrice: numeric('estimated_price', { precision: 15, scale: 4 }).notNull().default('0'),
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id
  plantId: uuid('plant_id'), // legacy alias
  inventoryLocationId: uuid('inventory_location_id').references(() => orgInventoryLocation.id), // was sloc_id – org_inventory_location
  slocId: uuid('sloc_id'), // legacy alias
  deliveryDate: timestamp('delivery_date'),
  accountAssignment: varchar('account_assignment', { length: 1 }), // K Cost Center, None Inventory
  costUnitId: uuid('cost_unit_id').references(() => orgCostUnit.id), // was cost_center_id – org_cost_unit ECUC
  costCenterId: uuid('cost_center_id'), // legacy alias
  ledgerAccountId: uuid('ledger_account_id').references(() => finLedgerAccount.id), // was gl_account_id – fin_ledger_account FGLC
  glAccountId: uuid('gl_account_id'), // legacy alias
  taxRuleId: uuid('tax_rule_id').references(() => finTaxRule.id), // was tax_code_id – fin_tax_rule FTXC
  taxCodeId: uuid('tax_code_id'), // legacy alias
  itemText: text('item_text'),
  isConverted: boolean('is_converted').default(false).notNull(),
  poId: uuid('po_id').references(() => procPurchaseOrder.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxPr: index('idx_proc_pr_line_pr').on(t.prId),
  idxItem: index('idx_proc_pr_line_item').on(t.itemId),
}));

// Purchase Order – legal-safe proc_purchase_order – PPOC
export const procPurchaseOrder = pgTable('proc_purchase_order', {
  id: uuid('id').primaryKey().defaultRandom(),
  poNumber: varchar('po_number', { length: 20 }).notNull().unique(), // PO-4500000001 – neutral, was 45* from number range
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id), // was company_code_id
  companyCodeId: uuid('company_code_id'), // legacy alias
  partnerId: uuid('partner_id').notNull().references(() => partnerAccount.id), // was vendor_id – partner_account PSUC
  vendorId: uuid('vendor_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id
  plantId: uuid('plant_id'), // legacy alias
  status: procPoStatusEnum('status').notNull().default('DRAFT'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  totalLandedCost: numeric('total_landed_cost', { precision: 15, scale: 3 }).notNull().default('0'), // Freight + Customs + Tax
  currencyCode: varchar('currency_code', { length: 3 }).notNull().default('INR').references(() => coreCurrency.code), // INR default
  currency: varchar('currency', { length: 3 }), // legacy alias KWD
  docDate: timestamp('doc_date').defaultNow(),
  procurementDivisionId: uuid('procurement_division_id').references(() => orgProcurementDivision.id), // was purchasing_org
  purchasingOrg: varchar('purchasing_org', { length: 10 }), // legacy alias
  buyerTeamId: uuid('buyer_team_id').references(() => orgBuyerTeam.id), // was purchasing_group
  purchasingGroup: varchar('purchasing_group', { length: 10 }), // legacy alias
  paymentTerms: varchar('payment_terms', { length: 10 }).default('0001'), // 0001 Immediate, 0002 30 days
  paymentTermsDays: integer('payment_terms_days').default(30),
  incoterms: varchar('incoterms', { length: 10 }).default('EXW'), // EXW, FOB, CIF
  deliveryDate: timestamp('delivery_date'),
  headerText: text('header_text'),
  workflowInstanceId: uuid('workflow_instance_id'),
  prId: uuid('pr_id').references(() => procPurchaseRequisition.id),
  freightAmount: numeric('freight_amount', { precision: 15, scale: 3 }).default('0'),
  customsAmount: numeric('customs_amount', { precision: 15, scale: 3 }).default('0'),
  otherCharges: numeric('other_charges', { precision: 15, scale: 3 }).default('0'),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 3 }).default('0'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxStatus: index('idx_proc_po_status').on(t.status),
  idxPartner: index('idx_proc_po_partner').on(t.partnerId),
  idxFacility: index('idx_proc_po_facility').on(t.facilityId),
}));

// PO Line – legal-safe proc_po_line
export const procPoLine = pgTable('proc_po_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  poId: uuid('po_id').notNull().references(() => procPurchaseOrder.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // was material_id
  materialId: uuid('material_id'), // legacy alias
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  quantityReceived: numeric('quantity_received', { precision: 15, scale: 3 }).notNull().default('0'),
  quantityInvoiced: numeric('quantity_invoiced', { precision: 15, scale: 3 }).notNull().default('0'),
  uomCode: varchar('uom_code', { length: 10 }).notNull(), // KG, PC – EUOC
  uom: varchar('uom', { length: 10 }), // legacy alias
  unitPrice: numeric('unit_price', { precision: 15, scale: 4 }).notNull(),
  freightPerUnit: numeric('freight_per_unit', { precision: 15, scale: 4 }).default('0'),
  customsPerUnit: numeric('customs_per_unit', { precision: 15, scale: 4 }).default('0'),
  taxPerUnit: numeric('tax_per_unit', { precision: 15, scale: 4 }).default('0'),
  totalPerUnit: numeric('total_per_unit', { precision: 15, scale: 4 }).notNull().default('0'),
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id
  plantId: uuid('plant_id'), // legacy alias
  inventoryLocationId: uuid('inventory_location_id').references(() => orgInventoryLocation.id), // was sloc_id
  slocId: uuid('sloc_id'), // legacy alias
  taxRuleId: uuid('tax_rule_id').references(() => finTaxRule.id), // was tax_code_id
  taxCodeId: uuid('tax_code_id'), // legacy alias
  accountAssignment: varchar('account_assignment', { length: 1 }), // K Cost Center, None Inventory
  costUnitId: uuid('cost_unit_id').references(() => orgCostUnit.id), // was cost_center_id
  costCenterId: uuid('cost_center_id'), // legacy alias
  ledgerAccountId: uuid('ledger_account_id').references(() => finLedgerAccount.id), // was gl_account_id
  glAccountId: uuid('gl_account_id'), // legacy alias
  itemText: text('item_text'),
  deliveryText: text('delivery_text'),
  isLandedCostRelevant: boolean('is_landed_cost_relevant').default(true).notNull(),
  deliveryCompleted: boolean('delivery_completed').default(false).notNull(), // DELIV_COMPLETED (legacy ELIKZ) – delivery completed indicator
  isClosed: boolean('is_closed').default(false).notNull(),
  closedReason: varchar('closed_reason', { length: 100 }),
  closedAt: timestamp('closed_at'),
  closedBy: uuid('closed_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxPo: index('idx_proc_po_line_po').on(t.poId),
  uniquePoLine: uniqueIndex('uq_proc_po_line').on(t.poId, t.lineNumber),
  idxDeliveryCompleted: index('idx_proc_po_line_delivery_completed').on(t.deliveryCompleted),
  idxItem: index('idx_proc_po_line_item').on(t.itemId),
}));

// Goods Receipt – legal-safe proc_goods_receipt – PGRC
export const procGoodsReceipt = pgTable('proc_goods_receipt', {
  id: uuid('id').primaryKey().defaultRandom(),
  grNumber: varchar('gr_number', { length: 20 }).notNull().unique(), // GR-5000000001 – neutral, was 50*
  poId: uuid('po_id').notNull().references(() => procPurchaseOrder.id),
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id), // was company_code_id
  companyCodeId: uuid('company_code_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id
  plantId: uuid('plant_id'), // legacy alias
  status: procGrStatusEnum('status').notNull().default('DRAFT'),
  postingDate: timestamp('posting_date').notNull(),
  documentDate: timestamp('document_date').notNull(),
  headerText: text('header_text'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  totalLandedCost: numeric('total_landed_cost', { precision: 15, scale: 3 }).notNull().default('0'),
  universalLedgerId: uuid('universal_ledger_id'), // was fi_document_id – fin_universal_ledger FULC
  fiDocumentId: uuid('fi_document_id'), // legacy alias – INV_POSTING/GR_IR_CLEARING (legacy INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX) – own IP)
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxPo: index('idx_proc_gr_po').on(t.poId),
  idxPostingDate: index('idx_proc_gr_posting').on(t.postingDate),
  idxFacility: index('idx_proc_gr_facility').on(t.facilityId),
}));

// GR Line – legal-safe proc_gr_line
export const procGrLine = pgTable('proc_gr_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  grId: uuid('gr_id').notNull().references(() => procGoodsReceipt.id, { onDelete: 'cascade' }),
  poLineId: uuid('po_line_id').notNull().references(() => procPoLine.id),
  lineNumber: integer('line_number').notNull(),
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // was material_id
  materialId: uuid('material_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // was plant_id
  plantId: uuid('plant_id'), // legacy alias
  inventoryLocationId: uuid('inventory_location_id').notNull().references(() => orgInventoryLocation.id), // was sloc_id
  slocId: uuid('sloc_id'), // legacy alias
  lotId: uuid('lot_id').references(() => invLot.id), // was batch_id – inv_lot ELTC
  batchId: uuid('batch_id'), // legacy alias
  lotNumber: varchar('lot_number', { length: 30 }), // was batch_number – lot_number ELTC
  batchNumber: varchar('batch_number', { length: 30 }), // legacy alias
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  uomCode: varchar('uom_code', { length: 10 }).notNull(), // KG, PC – EUOC
  uom: varchar('uom', { length: 10 }), // legacy alias
  unitPrice: numeric('unit_price', { precision: 15, scale: 4 }).notNull(),
  unitLandedCost: numeric('unit_landed_cost', { precision: 15, scale: 4 }).notNull().default('0'),
  totalValue: numeric('total_value', { precision: 15, scale: 3 }).notNull(),
  stockStatus: procStockStatusEnum('stock_status').notNull().default('UNRESTRICTED'), // UNRESTRICTED, QUALITY_INSPECTION, BLOCKED, IN_TRANSIT – was UNRESTRICTED/QI/BLOCKED
  stockStatusLegacy: varchar('stock_status_legacy', { length: 20 }), // legacy alias UNRESTRICTED/QI/BLOCKED
  expiryDate: timestamp('expiry_date'),
  stockLedgerId: uuid('stock_ledger_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxGr: index('idx_proc_gr_line_gr').on(t.grId),
  idxItem: index('idx_proc_gr_line_item').on(t.itemId),
  idxFacility: index('idx_proc_gr_line_facility').on(t.facilityId),
}));

// Stock Transport Order – legal-safe proc_stock_transport_order – PSTC
export const procStockTransportOrder = pgTable('proc_stock_transport_order', {
  id: uuid('id').primaryKey().defaultRandom(),
  stoNumber: varchar('sto_number', { length: 20 }).notNull().unique(), // STO-4500000001 – neutral
  type: procStoTypeEnum('type').notNull().default('TWO_STEP'),
  status: procStoStatusEnum('status').notNull().default('DRAFT'),
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id), // was company_code_id
  companyCodeId: uuid('company_code_id'), // legacy alias
  supplyingFacilityId: uuid('supplying_facility_id').notNull().references(() => orgFacility.id), // was supplying_plant_id
  supplyingPlantId: uuid('supplying_plant_id'), // legacy alias
  supplyingInventoryLocationId: uuid('supplying_inventory_location_id').references(() => orgInventoryLocation.id), // was supplying_sloc_id
  supplyingSlocId: uuid('supplying_sloc_id'), // legacy alias
  receivingFacilityId: uuid('receiving_facility_id').notNull().references(() => orgFacility.id), // was receiving_plant_id
  receivingPlantId: uuid('receiving_plant_id'), // legacy alias
  receivingInventoryLocationId: uuid('receiving_inventory_location_id').references(() => orgInventoryLocation.id), // was receiving_sloc_id
  receivingSlocId: uuid('receiving_sloc_id'), // legacy alias
  inTransitFacilityId: uuid('in_transit_facility_id').references(() => orgFacility.id), // virtual facility for in-transit
  inTransitPlantId: uuid('in_transit_plant_id'), // legacy alias
  freightCost: numeric('freight_cost', { precision: 15, scale: 3 }).default('0'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 3 }).default('0'),
  currencyCode: varchar('currency_code', { length: 3 }).default('INR').references(() => coreCurrency.code), // INR default
  currency: varchar('currency', { length: 3 }), // legacy alias KWD
  deliveryNumber: varchar('delivery_number', { length: 20 }), // VL10B delivery
  headerText: text('header_text'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxStatus: index('idx_proc_sto_status').on(t.status),
  idxSupplying: index('idx_proc_sto_supplying').on(t.supplyingFacilityId),
  idxReceiving: index('idx_proc_sto_receiving').on(t.receivingFacilityId),
}));

// STO Line – legal-safe proc_sto_line
export const procStoLine = pgTable('proc_sto_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  stoId: uuid('sto_id').notNull().references(() => procStockTransportOrder.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // was material_id
  materialId: uuid('material_id'), // legacy alias
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  quantityIssued: numeric('quantity_issued', { precision: 15, scale: 3 }).default('0'), // TR_MAT (legacy MIGO 351)
  quantityReceived: numeric('quantity_received', { precision: 15, scale: 3 }).default('0'), // GR_PO (legacy MIGO 101)
  quantityInTransit: numeric('quantity_in_transit', { precision: 15, scale: 3 }).default('0'),
  uomCode: varchar('uom_code', { length: 10 }).notNull(), // KG, PC – EUOC
  uom: varchar('uom', { length: 10 }), // legacy alias
  unitPrice: numeric('unit_price', { precision: 15, scale: 4 }).default('0'),
  lotId: uuid('lot_id').references(() => invLot.id), // was batch_id
  batchId: uuid('batch_id'), // legacy alias
  lotNumber: varchar('lot_number', { length: 30 }), // was batch_number
  batchNumber: varchar('batch_number', { length: 30 }), // legacy alias
  isClosed: boolean('is_closed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxSto: index('idx_proc_sto_line_sto').on(t.stoId),
  uniqueStoLine: uniqueIndex('uq_proc_sto_line').on(t.stoId, t.lineNumber),
  idxItem: index('idx_proc_sto_line_item').on(t.itemId),
}));

// Invoice Verification – legal-safe proc_invoice_verification – PIVC
export const procInvoiceVerification = pgTable('proc_invoice_verification', {
  id: uuid('id').primaryKey().defaultRandom(),
  ivNumber: varchar('iv_number', { length: 20 }).notNull().unique(), // IV-5100000001 – neutral, was 51*
  grId: uuid('gr_id').references(() => procGoodsReceipt.id),
  poId: uuid('po_id').notNull().references(() => procPurchaseOrder.id),
  partnerId: uuid('partner_id').notNull().references(() => partnerAccount.id), // was vendor_id – partner_account PSUC
  vendorId: uuid('vendor_id'), // legacy alias
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id), // was company_code_id
  companyCodeId: uuid('company_code_id'), // legacy alias
  status: procIvStatusEnum('status').notNull().default('DRAFT'),
  invoiceDate: timestamp('invoice_date').notNull(),
  postingDate: timestamp('posting_date').notNull(),
  vendorInvoiceNumber: varchar('vendor_invoice_number', { length: 50 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 15, scale: 3 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  freightAmount: numeric('freight_amount', { precision: 15, scale: 3 }).default('0'),
  customsAmount: numeric('customs_amount', { precision: 15, scale: 3 }).default('0'),
  otherCharges: numeric('other_charges', { precision: 15, scale: 3 }).default('0'),
  totalLandedCost: numeric('total_landed_cost', { precision: 15, scale: 3 }).notNull().default('0'),
  priceVariance: numeric('price_variance', { precision: 15, scale: 3 }).default('0'),
  universalLedgerId: uuid('universal_ledger_id'), // was fi_document_id – fin_universal_ledger FULC – RE + GR_IR_CLEARING clearing + INV_POSTING adjustment (legacy WRX/BSX) – own IP
  fiDocumentId: uuid('fi_document_id'), // legacy alias
  apInvoiceId: uuid('ap_invoice_id'),
  isLandedCostPosted: boolean('is_landed_cost_posted').default(false).notNull(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxPo: index('idx_proc_iv_po').on(t.poId),
  idxGr: index('idx_proc_iv_gr').on(t.grId),
  idxPartner: index('idx_proc_iv_partner').on(t.partnerId),
}));

// IV Line – legal-safe proc_iv_line
export const procIvLine = pgTable('proc_iv_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  ivId: uuid('iv_id').notNull().references(() => procInvoiceVerification.id, { onDelete: 'cascade' }),
  grLineId: uuid('gr_line_id').references(() => procGrLine.id),
  poLineId: uuid('po_line_id').notNull().references(() => procPoLine.id),
  lineNumber: integer('line_number').notNull(),
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // was material_id
  materialId: uuid('material_id'), // legacy alias
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  unitPriceInvoiced: numeric('unit_price_invoiced', { precision: 15, scale: 4 }).notNull(),
  unitPricePo: numeric('unit_price_po', { precision: 15, scale: 4 }).notNull(),
  freightPerUnit: numeric('freight_per_unit', { precision: 15, scale: 4 }).default('0'),
  customsPerUnit: numeric('customs_per_unit', { precision: 15, scale: 4 }).default('0'),
  otherPerUnit: numeric('other_per_unit', { precision: 15, scale: 4 }).default('0'),
  totalPerUnitFinal: numeric('total_per_unit_final', { precision: 15, scale: 4 }).notNull(),
  priceVariancePerUnit: numeric('price_variance_per_unit', { precision: 15, scale: 4 }).default('0'),
  taxRuleId: uuid('tax_rule_id').references(() => finTaxRule.id), // was tax_code_id
  taxCodeId: uuid('tax_code_id'), // legacy alias
  taxAmount: numeric('tax_amount', { precision: 15, scale: 3 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxIv: index('idx_proc_iv_line_iv').on(t.ivId),
  idxItem: index('idx_proc_iv_line_item').on(t.itemId),
}));

// Info Record – NEW legal-safe proc_info_record – PIRC – ME11
export const procInfoRecord = pgTable('proc_info_record', {
  id: uuid('id').primaryKey().defaultRandom(),
  infoRecordNumber: varchar('info_record_number', { length: 20 }).notNull().unique(), // PIR-1000001 – neutral
  partnerId: uuid('partner_id').notNull().references(() => partnerAccount.id), // supplier – PSUC
  vendorId: uuid('vendor_id'), // legacy alias
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // material – EMTC
  materialId: uuid('material_id'), // legacy alias
  facilityId: uuid('facility_id').references(() => orgFacility.id), // plant – EFCC – optional, plant-specific info record
  plantId: uuid('plant_id'), // legacy alias
  validFrom: timestamp('valid_from').notNull().defaultNow(),
  validTo: timestamp('valid_to'),
  unitPrice: numeric('unit_price', { precision: 15, scale: 4 }).notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull().default('INR').references(() => coreCurrency.code), // INR default
  currency: varchar('currency', { length: 3 }), // legacy alias
  uomCode: varchar('uom_code', { length: 10 }).notNull(), // KG, PC – EUOC
  uom: varchar('uom', { length: 10 }), // legacy alias
  leadTimeDays: integer('lead_time_days').default(7), // delivery lead time
  minOrderQty: numeric('min_order_qty', { precision: 15, scale: 3 }).default('0'), // MOQ
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniquePartnerItemFacility: uniqueIndex('uq_proc_info_partner_item_fac').on(t.partnerId, t.itemId, t.facilityId),
  idxPartner: index('idx_proc_info_partner').on(t.partnerId),
  idxItem: index('idx_proc_info_item').on(t.itemId),
}));

// Source List – NEW legal-safe proc_source_list – PSRC – ME01
export const procSourceList = pgTable('proc_source_list', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => prodItem.id), // material – EMTC
  materialId: uuid('material_id'), // legacy alias
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id), // plant – EFCC
  plantId: uuid('plant_id'), // legacy alias
  partnerId: uuid('partner_id').notNull().references(() => partnerAccount.id), // supplier – PSUC
  vendorId: uuid('vendor_id'), // legacy alias
  validFrom: timestamp('valid_from').notNull().defaultNow(),
  validTo: timestamp('valid_to'),
  isMrpRelevant: boolean('is_mrp_relevant').default(true).notNull(), // MRP relevant
  isBlocked: boolean('is_blocked').default(false).notNull(),
  priority: integer('priority').default(1), // 1 = highest
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueItemFacilityPartner: uniqueIndex('uq_proc_source_item_fac_partner').on(t.itemId, t.facilityId, t.partnerId),
  idxItem: index('idx_proc_source_item').on(t.itemId),
  idxFacility: index('idx_proc_source_facility').on(t.facilityId),
  idxPartner: index('idx_proc_source_partner').on(t.partnerId),
}));

// Purchasing Condition – for landed cost breakdown per PO line – NEW
export const procPurchasingConditionTypeEnum = pgEnum('proc_purch_cond_type', ['BASE', 'DISCOUNT', 'FREIGHT', 'CUSTOMS', 'TAX', 'OTHER']);

export const procPurchasingCondition = pgTable('proc_purchasing_condition', {
  id: uuid('id').primaryKey().defaultRandom(),
  poLineId: uuid('po_line_id').notNull().references(() => procPoLine.id, { onDelete: 'cascade' }),
  conditionType: procPurchasingConditionTypeEnum('condition_type').notNull(), // BASE, DISCOUNT, FREIGHT, CUSTOMS, TAX, OTHER
  amount: numeric('amount', { precision: 15, scale: 4 }).notNull().default('0'),
  percentage: numeric('percentage', { precision: 5, scale: 2 }).default('0'),
  currencyCode: varchar('currency_code', { length: 3 }).default('INR'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxPoLine: index('idx_proc_purch_cond_po_line').on(t.poLineId),
}));
