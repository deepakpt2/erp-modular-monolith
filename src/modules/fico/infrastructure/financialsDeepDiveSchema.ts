import { pgTable, varchar, boolean, timestamp, uuid, text, numeric, integer, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orgLegalEntity } from '../../foundation/enterprise/infrastructure/orgStructureSchema';
import { finChart, finLedgerAccount } from '../../foundation/enterprise/infrastructure/financialsFoundationSchema';

/**
 * Module 5 – FICO Deep Dive – Legal-Safe Own IP
 * Extends Module 4 Financials Foundation with:
 * - Account Groups (OBD4), Retained Earnings (OB53), Asset Masters, Pricing/Conditions Engine, Universal Ledger, Cost Elements, Profit Center hierarchy, etc
 * All tables neutral: fin_*, core_*, not fi_*, ent_*
 * Sample data kept for convenience: CoA INT, GL 100000-500000, Tax GST, etc
 * Helper codes: FAGC Account Group Create (alias AGC, OBD4), FRGC Retained Earnings Create (alias RGC, OB53), FASC Asset Create (alias ASC, AS01), FPRC Pricing Condition Create (alias PRC, VK11), FPPC Pricing Procedure (alias OBYC), FULC Universal Ledger Create, etc
 * 4-char MOOA: F=Financials, AG=AccountGroup, C=Create etc – module grouped intuitive
 */

// Account Group – replaces fi_account_group – legal-safe fin_account_group – OBD4
export const finAccountGroup = pgTable('fin_account_group', {
  id: uuid('id').primaryKey().defaultRandom(),
  chartId: uuid('chart_id').notNull().references(() => finChart.id), // was coa_id – legal-safe chart_id
  coaId: uuid('coa_id'), // legacy alias
  code: varchar('code', { length: 20 }).notNull(), // e.g., AG-1000, ASST, LIAB, REVN, EXPN – neutral
  name: varchar('name', { length: 150 }).notNull(), // Asset Accounts, Liability, Revenue – neutral
  fromAccount: varchar('from_account', { length: 30 }).notNull(), // 100000
  toAccount: varchar('to_account', { length: 30 }).notNull(), // 199999
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueChartCode: uniqueIndex('uq_fin_account_group_chart_code').on(t.chartId, t.code),
}));

// Retained Earnings – replaces fi_retained_earnings – legal-safe fin_retained_earnings – OB53
export const finRetainedEarnings = pgTable('fin_retained_earnings', {
  id: uuid('id').primaryKey().defaultRandom(),
  chartId: uuid('chart_id').notNull().references(() => finChart.id), // was coa_id
  coaId: uuid('coa_id'), // legacy
  accountNumber: varchar('account_number', { length: 30 }).notNull(), // 2500000001 Retained Earnings – sample kept
  profitUnitId: uuid('profit_unit_id'), // optional – org_profit_unit
  description: varchar('description', { length: 200 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueChartAccount: uniqueIndex('uq_fin_retained_chart_account').on(t.chartId, t.accountNumber),
}));

// Asset Class – replaces fi_asset_class – legal-safe fin_asset_class
export const finAssetClass = pgTable('fin_asset_class', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(), // AST-1000 Machinery, AST-2000 Vehicles – neutral
  name: varchar('name', { length: 150 }).notNull(),
  chartId: uuid('chart_id').references(() => finChart.id),
  glAccountId: uuid('gl_account_id').references(() => finLedgerAccount.id), // APC account
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Asset Master – replaces fi_asset – legal-safe fin_asset – AS01
export const finAssetStatusEnum = pgEnum('fin_asset_status', ['ACTIVE', 'RETIRED', 'BLOCKED', 'UNDER_CONSTRUCTION']);

export const finAsset = pgTable('fin_asset', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetNumber: varchar('asset_number', { length: 30 }).notNull().unique(), // AST-100000 – neutral
  assetClassId: uuid('asset_class_id').notNull().references(() => finAssetClass.id),
  description: varchar('description', { length: 200 }).notNull(),
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id), // was company_code_id
  companyCodeId: uuid('company_code_id'), // legacy
  costCenterId: uuid('cost_center_id'), // org_cost_unit
  profitUnitId: uuid('profit_unit_id'), // org_profit_unit
  glAccountId: uuid('gl_account_id').references(() => finLedgerAccount.id),
  capitalizationDate: timestamp('capitalization_date'),
  acquisitionValue: numeric('acquisition_value', { precision: 15, scale: 3 }).default('0'),
  usefulLifeMonths: integer('useful_life_months').default(60),
  depreciationMethod: varchar('depreciation_method', { length: 20 }).default('STRAIGHT'), // STRAIGHT, DECLINING, UNITS
  status: finAssetStatusEnum('status').default('ACTIVE').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Pricing Condition – replaces pricing_condition – legal-safe fin_pricing_condition – VK11
export const finPricingConditionTypeEnum = pgEnum('fin_pricing_cond_type', ['BASE', 'DISCOUNT', 'SURCHARGE', 'FREIGHT', 'TAX', 'CASH_DISCOUNT']);
export const finPricingConditionOriginEnum = pgEnum('fin_pricing_cond_origin', ['MANUAL', 'AUTOMATIC', 'MASTER_DATA']);

export const finPricingCondition = pgTable('fin_pricing_condition', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 30 }).notNull().unique(), // PR00 Base Price, K004 Material Discount, KF00 Freight, MWST VAT/GST – neutral but sample kept
  name: varchar('name', { length: 150 }).notNull(),
  conditionType: finPricingConditionTypeEnum('condition_type').notNull(), // BASE, DISCOUNT, SURCHARGE, FREIGHT, TAX
  origin: finPricingConditionOriginEnum('origin').default('MANUAL').notNull(),
  isPercentage: boolean('is_percentage').default(false).notNull(), // true = %, false = amount
  isAccrual: boolean('is_accrual').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Pricing Procedure – replaces pricing_procedure – legal-safe fin_pricing_procedure – defines calculation sequence
export const finPricingProcedure = pgTable('fin_pricing_procedure', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(), // PP-1000 Standard Pricing – neutral
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const finPricingProcedureStep = pgTable('fin_pricing_procedure_step', {
  id: uuid('id').primaryKey().defaultRandom(),
  procedureId: uuid('procedure_id').notNull().references(() => finPricingProcedure.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(), // 10,20,30...
  conditionId: uuid('condition_id').notNull().references(() => finPricingCondition.id),
  fromStep: integer('from_step'), // reference step for calculation base
  toStep: integer('to_step'),
  isStatistical: boolean('is_statistical').default(false).notNull(),
  isMandatory: boolean('is_mandatory').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueProcedureStep: uniqueIndex('uq_fin_pricing_procedure_step').on(t.procedureId, t.stepNumber),
}));

// Pricing Condition Record – actual price master data – e.g., material/customer/plant specific price
export const finPricingConditionRecord = pgTable('fin_pricing_condition_record', {
  id: uuid('id').primaryKey().defaultRandom(),
  conditionId: uuid('condition_id').notNull().references(() => finPricingCondition.id),
  validFrom: timestamp('valid_from').notNull(),
  validTo: timestamp('valid_to'),
  amount: numeric('amount', { precision: 15, scale: 3 }).notNull().default('0'),
  percentage: numeric('percentage', { precision: 5, scale: 2 }).default('0'),
  currencyCode: varchar('currency_code', { length: 3 }).default('INR'),
  uomCode: varchar('uom_code', { length: 10 }), // KG, PC etc
  // Access sequence keys – flexible
  partnerId: uuid('partner_id'), // customer or supplier
  itemId: uuid('item_id'), // prod_item
  facilityId: uuid('facility_id'), // org_facility
  commercialOrgId: uuid('commercial_org_id'), // org_commercial_org
  salesChannelId: uuid('sales_channel_id'),
  productLineId: uuid('product_line_id'),
  procurementDivisionId: uuid('procurement_division_id'),
  // Additional
  minQuantity: numeric('min_quantity', { precision: 15, scale: 3 }).default('0'),
  maxQuantity: numeric('max_quantity', { precision: 15, scale: 3 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxCondition: index('idx_fin_pricing_record_condition').on(t.conditionId),
  idxValid: index('idx_fin_pricing_record_valid').on(t.validFrom, t.validTo),
  idxPartner: index('idx_fin_pricing_record_partner').on(t.partnerId),
  idxItem: index('idx_fin_pricing_record_item').on(t.itemId),
}));

// Universal Ledger – replaces universal ledger – legal-safe fin_universal_ledger – ACDOCA equivalent but own IP
export const finLedgerTypeEnum = pgEnum('fin_ledger_type', ['LEADING', 'NON_LEADING', 'EXTENSION']);
export const finDocumentTypeEnum = pgEnum('fin_doc_type_new', ['JRNL', 'INV', 'BILL', 'PAY', 'GR', 'GI', 'DN', 'ASSET', 'PAYROLL', 'REVERSAL']);

export const finUniversalLedger = pgTable('fin_universal_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  ledgerType: finLedgerTypeEnum('ledger_type').default('LEADING').notNull(),
  documentNumber: varchar('document_number', { length: 30 }).notNull(), // e.g., FI-1000000001 – from number range
  documentType: finDocumentTypeEnum('document_type').notNull(), // JRNL, INV, BILL etc – legal-safe
  documentTypeLegacy: varchar('document_type_legacy', { length: 10 }), // SA, RE, WE etc legacy alias
  postingDate: timestamp('posting_date').notNull(),
  documentDate: timestamp('document_date').notNull(),
  fiscalYear: integer('fiscal_year').notNull(),
  fiscalPeriod: integer('fiscal_period').notNull(), // 1-12
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id),
  companyCodeId: uuid('company_code_id'), // legacy
  ledgerAccountId: uuid('ledger_account_id').notNull().references(() => finLedgerAccount.id),
  glAccountId: uuid('gl_account_id'), // legacy alias
  debit: numeric('debit', { precision: 15, scale: 3 }).default('0'),
  credit: numeric('credit', { precision: 15, scale: 3 }).default('0'),
  amount: numeric('amount', { precision: 15, scale: 3 }).notNull(), // net amount
  currencyCode: varchar('currency_code', { length: 3 }).notNull().default('INR'),
  // Dimensions
  costUnitId: uuid('cost_unit_id'), // org_cost_unit
  profitUnitId: uuid('profit_unit_id'), // org_profit_unit
  partnerId: uuid('partner_id'), // partner_account – vendor/customer
  itemId: uuid('item_id'), // prod_item – for inventory postings
  facilityId: uuid('facility_id'), // org_facility
  lotId: uuid('lot_id'), // inv_lot
  taxRuleId: uuid('tax_rule_id'), // fin_tax_rule
  // Reference
  referenceDocType: varchar('reference_doc_type', { length: 20 }), // PO, GR, IV, SO, BILL etc
  referenceDocNumber: varchar('reference_doc_number', { length: 50 }),
  referenceDocId: uuid('reference_doc_id'),
  text: varchar('text', { length: 200 }),
  isReversed: boolean('is_reversed').default(false).notNull(),
  reversedById: uuid('reversed_by_id'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxPostingDate: index('idx_fin_ledger_posting_date').on(t.postingDate),
  idxLedgerAccount: index('idx_fin_ledger_account').on(t.ledgerAccountId),
  idxLegalEntity: index('idx_fin_ledger_legal_entity').on(t.legalEntityId),
  idxDocNumber: index('idx_fin_ledger_doc_number').on(t.documentNumber),
  idxReference: index('idx_fin_ledger_reference').on(t.referenceDocType, t.referenceDocNumber),
}));

// Relations
export const finChartDeepRelations = relations(finChart, ({ many }) => ({
  accountGroups: many(finAccountGroup),
  retainedEarnings: many(finRetainedEarnings),
  ledgerAccounts: many(finLedgerAccount),
}));

export const finLedgerAccountDeepRelations = relations(finLedgerAccount, ({ many }) => ({
  universalLedgerEntries: many(finUniversalLedger),
}));
