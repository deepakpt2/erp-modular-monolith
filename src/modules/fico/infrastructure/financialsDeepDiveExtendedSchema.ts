import { pgTable, varchar, boolean, timestamp, uuid, text, numeric, integer, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { orgLegalEntity, orgCostUnit, orgProfitUnit } from '../../foundation/enterprise/infrastructure/orgStructureSchema';
import { finLedgerAccount, finChart } from '../../foundation/enterprise/infrastructure/financialsFoundationSchema';
import { finAsset, finUniversalLedger } from './financialsDeepDiveSchema';
import { coreCurrency } from '../../foundation/enterprise/infrastructure/financialsFoundationSchema';
import { partnerAccount } from '../../foundation/enterprise/infrastructure/partnerAccountSchema';

/**
 * Module 10 – FICO Deep Dive Extended – Legal-Safe Own IP – Completing Module5 to 100%
 * Remaining tables:
 * - fin_asset_posting → asset depreciation postings – assetId, postingDate, documentNumber, depreciationAmount, accumulatedDepreciation, bookValue, periodYear, periodMonth, universalLedgerId FULC, type DEPRECIATION/ACQUISITION/RETIREMENT/TRANSFER – FAPT Asset Posting Create alias APT
 * - fin_recurring_posting → recurring journal – recurringNumber REC-10000001, legalEntityId LE-1000 was company_code_id, ledgerAccountId FGLC, amount, currencyCode INR, frequency MONTHLY/WEEKLY/DAILY, nextRunDate, endDate, isActive, template jsonb – FRPC Recurring Posting Create alias RPC
 * - fin_fx_valuation → foreign currency valuation – valuationNumber FXV-10000001, legalEntityId LE-1000, currencyCode foreign currency, valuationDate, exchangeRate, valuationMethod BALANCE_SHEET/PROFIT_LOSS, totalForeignAmount, totalLocalAmount, varianceAmount, universalLedgerId FULC, status DRAFT/POSTED – FFVC FX Valuation Create alias FVC
 * - fin_tax_report → tax reporting – reportNumber TAXR-10000001, legalEntityId, periodYear, periodMonth, taxRuleId FTXC, totalTaxableAmount, totalTaxAmount, status DRAFT/SUBMITTED/PAID – FTRC Tax Report Create alias TRC
 * - fin_closing_document → period closing – closingNumber CLOSE-10000001, legalEntityId, fiscalYear, fiscalPeriod, closingType MM/SD/FICO/CO/ASSET/INVENTORY, status OPEN/CLOSED, closedBy, closedAt – FCDC Closing Document Create alias CDC
 * - fin_cost_center_allocation → cost center allocation – allocationNumber ALLOC-10000001, fromCostUnitId ECUC, toCostUnitId ECUC, amount, allocationType ASSESSMENT/DISTRIBUTION, periodYear, periodMonth – FCCA Cost Center Allocation Create alias CCA
 * Helper codes: FAPT/FPRC? Actually FAPT Asset Posting Create, FRPC Recurring Posting Create, FFVC FX Valuation Create, FTRC Tax Report Create, FCDC Closing Doc Create, FCCA Cost Center Allocation Create – 4-char MOOA F=Financials + Object + C=Create – module grouped intuitive
 * Fresh empty per requirement but CoA/GL/Currencies kept INR default
 */

export const finAssetPostingTypeEnum = pgEnum('fin_asset_posting_type_new', ['ACQUISITION', 'DEPRECIATION', 'RETIREMENT', 'TRANSFER', 'REVALUATION']);
export const finRecurringFrequencyEnum = pgEnum('fin_recurring_frequency_new', ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']);
export const finFxValuationMethodEnum = pgEnum('fin_fx_valuation_method_new', ['BALANCE_SHEET', 'PROFIT_LOSS', 'BOTH']);
export const finFxValuationStatusEnum = pgEnum('fin_fx_valuation_status_new', ['DRAFT', 'POSTED', 'CANCELLED']);
export const finTaxReportStatusEnum = pgEnum('fin_tax_report_status_new', ['DRAFT', 'SUBMITTED', 'PAID', 'CANCELLED']);
export const finClosingTypeEnum = pgEnum('fin_closing_type_new', ['MM', 'SD', 'FICO', 'CO', 'ASSET', 'INVENTORY', 'PAYROLL', 'ALL']);
export const finClosingStatusEnum = pgEnum('fin_closing_status_new', ['OPEN', 'CLOSED', 'LOCKED']);
export const finAllocationTypeEnum = pgEnum('fin_allocation_type_new', ['ASSESSMENT', 'DISTRIBUTION', 'SETTLEMENT']);

// Asset Posting – FAPT
export const finAssetPosting = pgTable('fin_asset_posting', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id').notNull().references(() => finAsset.id),
  postingNumber: varchar('posting_number', { length: 20 }).notNull().unique(), // AP-10000001
  postingType: finAssetPostingTypeEnum('posting_type').notNull().default('DEPRECIATION'),
  postingDate: timestamp('posting_date').notNull(),
  documentNumber: varchar('document_number', { length: 30 }), // FI-10000001
  periodYear: integer('period_year').notNull(),
  periodMonth: integer('period_month').notNull(),
  depreciationAmount: numeric('depreciation_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  accumulatedDepreciation: numeric('accumulated_depreciation', { precision: 15, scale: 3 }).notNull().default('0'),
  bookValue: numeric('book_value', { precision: 15, scale: 3 }).notNull().default('0'),
  currencyCode: varchar('currency_code', { length: 3 }).default('INR').references(() => coreCurrency.code),
  universalLedgerId: uuid('universal_ledger_id').references(() => finUniversalLedger.id), // FULC
  text: varchar('text', { length: 200 }),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxAsset: index('idx_fin_asset_posting_asset').on(t.assetId),
  idxPostingDate: index('idx_fin_asset_posting_date').on(t.postingDate),
  idxPeriod: index('idx_fin_asset_posting_period').on(t.periodYear, t.periodMonth),
}));

// Recurring Posting – FRPC
export const finRecurringPosting = pgTable('fin_recurring_posting', {
  id: uuid('id').primaryKey().defaultRandom(),
  recurringNumber: varchar('recurring_number', { length: 20 }).notNull().unique(), // REC-10000001
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id), // LE-1000 was company_code_id
  companyCodeId: uuid('company_code_id'), // legacy alias
  ledgerAccountId: uuid('ledger_account_id').references(() => finLedgerAccount.id), // FGLC
  glAccountId: uuid('gl_account_id'), // legacy alias
  amount: numeric('amount', { precision: 15, scale: 3 }).notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).default('INR').references(() => coreCurrency.code),
  currency: varchar('currency', { length: 3 }), // legacy alias
  frequency: finRecurringFrequencyEnum('frequency').notNull().default('MONTHLY'),
  nextRunDate: timestamp('next_run_date').notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true).notNull(),
  template: text('template'), // jsonb as text for flexibility – contains debit/credit lines
  description: varchar('description', { length: 200 }),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxLegalEntity: index('idx_fin_recurring_legal').on(t.legalEntityId),
  idxNextRun: index('idx_fin_recurring_next_run').on(t.nextRunDate),
  idxActive: index('idx_fin_recurring_active').on(t.isActive),
}));

// FX Valuation – FFVC
export const finFxValuation = pgTable('fin_fx_valuation', {
  id: uuid('id').primaryKey().defaultRandom(),
  valuationNumber: varchar('valuation_number', { length: 20 }).notNull().unique(), // FXV-10000001
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id), // LE-1000
  companyCodeId: uuid('company_code_id'), // legacy alias
  currencyCode: varchar('currency_code', { length: 3 }).notNull().references(() => coreCurrency.code), // foreign currency USD/EUR etc
  valuationDate: timestamp('valuation_date').notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }).notNull(),
  valuationMethod: finFxValuationMethodEnum('valuation_method').notNull().default('BALANCE_SHEET'),
  totalForeignAmount: numeric('total_foreign_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  totalLocalAmount: numeric('total_local_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  varianceAmount: numeric('variance_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  universalLedgerId: uuid('universal_ledger_id').references(() => finUniversalLedger.id), // FULC
  status: finFxValuationStatusEnum('status').notNull().default('DRAFT'),
  text: varchar('text', { length: 200 }),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxLegalEntity: index('idx_fin_fx_valuation_legal').on(t.legalEntityId),
  idxValuationDate: index('idx_fin_fx_valuation_date').on(t.valuationDate),
  idxCurrency: index('idx_fin_fx_valuation_currency').on(t.currencyCode),
}));

// Tax Report – FTRC
export const finTaxReport = pgTable('fin_tax_report', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportNumber: varchar('report_number', { length: 20 }).notNull().unique(), // TAXR-10000001
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id), // LE-1000
  companyCodeId: uuid('company_code_id'), // legacy alias
  periodYear: integer('period_year').notNull(),
  periodMonth: integer('period_month').notNull(),
  taxRuleId: uuid('tax_rule_id'), // fin_tax_rule FTXC
  totalTaxableAmount: numeric('total_taxable_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  totalTaxAmount: numeric('total_tax_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  currencyCode: varchar('currency_code', { length: 3 }).default('INR').references(() => coreCurrency.code),
  status: finTaxReportStatusEnum('status').notNull().default('DRAFT'),
  submittedAt: timestamp('submitted_at'),
  paidAt: timestamp('paid_at'),
  text: varchar('text', { length: 200 }),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxLegalEntity: index('idx_fin_tax_report_legal').on(t.legalEntityId),
  idxPeriod: index('idx_fin_tax_report_period').on(t.periodYear, t.periodMonth),
  idxStatus: index('idx_fin_tax_report_status').on(t.status),
}));

// Closing Document – FCDC
export const finClosingDocument = pgTable('fin_closing_document', {
  id: uuid('id').primaryKey().defaultRandom(),
  closingNumber: varchar('closing_number', { length: 20 }).notNull().unique(), // CLOSE-10000001
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id), // LE-1000
  companyCodeId: uuid('company_code_id'), // legacy alias
  fiscalYear: integer('fiscal_year').notNull(),
  fiscalPeriod: integer('fiscal_period').notNull(),
  closingType: finClosingTypeEnum('closing_type').notNull().default('ALL'),
  status: finClosingStatusEnum('status').notNull().default('OPEN'),
  closedBy: uuid('closed_by'),
  closedAt: timestamp('closed_at'),
  lockedAt: timestamp('locked_at'),
  text: varchar('text', { length: 200 }),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueClosing: uniqueIndex('uq_fin_closing_legal_year_period_type').on(t.legalEntityId, t.fiscalYear, t.fiscalPeriod, t.closingType),
  idxLegalEntity: index('idx_fin_closing_legal').on(t.legalEntityId),
  idxPeriod: index('idx_fin_closing_period').on(t.fiscalYear, t.fiscalPeriod),
  idxStatus: index('idx_fin_closing_status').on(t.status),
}));

// Cost Center Allocation – FCCA
export const finCostCenterAllocation = pgTable('fin_cost_center_allocation', {
  id: uuid('id').primaryKey().defaultRandom(),
  allocationNumber: varchar('allocation_number', { length: 20 }).notNull().unique(), // ALLOC-10000001
  fromCostUnitId: uuid('from_cost_unit_id').notNull().references(() => orgCostUnit.id), // ECUC
  fromCostCenterId: uuid('from_cost_center_id'), // legacy alias
  toCostUnitId: uuid('to_cost_unit_id').notNull().references(() => orgCostUnit.id), // ECUC
  toCostCenterId: uuid('to_cost_center_id'), // legacy alias
  amount: numeric('amount', { precision: 15, scale: 3 }).notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).default('INR').references(() => coreCurrency.code),
  allocationType: finAllocationTypeEnum('allocation_type').notNull().default('ASSESSMENT'),
  periodYear: integer('period_year').notNull(),
  periodMonth: integer('period_month').notNull(),
  universalLedgerId: uuid('universal_ledger_id').references(() => finUniversalLedger.id), // FULC
  text: varchar('text', { length: 200 }),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxFromCost: index('idx_fin_alloc_from').on(t.fromCostUnitId),
  idxToCost: index('idx_fin_alloc_to').on(t.toCostUnitId),
  idxPeriod: index('idx_fin_alloc_period').on(t.periodYear, t.periodMonth),
}));
