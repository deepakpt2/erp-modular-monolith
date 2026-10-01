import { pgTable, varchar, boolean, timestamp, uuid, text, numeric, integer, pgEnum, uniqueIndex, index, bigint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orgLegalEntity, finFiscalCalendar, finPostingCalendar } from './orgStructureSchema';

/**
 * Module 4 – Financials Foundation – Legal-Safe Own IP
 * Replaces core_number_range, core_currency, core_exchange_rate, fin_fiscal_calendar, fin_posting_calendar, fin_chart, fin_ledger_account, fin_tax_rule, fin_auto_posting_rule etc
 * Fresh empty for some, but sample data kept for convenience: Currencies INR default (KWD/USD/EUR sample), CoA INT, GL 100000-500000, Tax GST0/5/12/18/28, Fiscal Calendar K4 April-March, Posting Calendar etc
 * Helper codes: FNRC Number Range Create (alias FBN1), FCYC Currency Create (alias OY03/CYC), FFYC Fiscal Calendar Create (alias OB29/FYC), FPPC Posting Calendar Create (alias OBBO/PPC), FPPE Open/Close Posting Periods (alias OB52), FCOA Chart Create (alias OB13/COA), FGLC GL Create (alias FS00/GLC), FTXC Tax Create (alias FTXP/TXC), FAUC Auto Posting Rule (alias OBYC), FTGC Tolerance Group Create (alias OBA4), FDTC Document Type Create (alias OBA7)
 * All tables use neutral naming: core_*, fin_*, not ent_*, fi_*
 * No SAP-identical codes: K4, KS01, 1000 etc replaced with neutral LE-1000, FAC-1000, FC-INT etc but old codes kept as aliases for search
 */

// Number Range – replaces core_number_range – legal-safe core_number_range – own IP short code FNRC
export const coreNumberRangeObjectTypeEnum = pgEnum('core_nr_object_type', [
  'ITEM',
  'PARTNER',
  'LOT',
  'PR',
  'PO',
  'GR',
  'IV',
  'PROD_ORDER',
  'FI_DOC',
  'FI_DOC_50',
  'FI_DOC_51',
  'FI_DOC_52',
  'FI_DOC_53',
  'FI_DOC_54',
  'PAYROLL',
  'SALES_ORDER',
  'KITTING_ORDER',
  'PI',
  'COSTING_RUN',
  'BILLING',
  'DELIVERY',
  'PAYMENT',
  'JOURNAL',
]);

export const coreNumberRange = pgTable('core_number_range', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(), // e.g., ITEM-01, PO-01, FI-DOC-01 – legal-safe with code for search
  objectType: coreNumberRangeObjectTypeEnum('object_type').notNull(),
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id),
  companyCodeId: uuid('company_code_id'), // legacy column for backward compat – was company_code_id
  fiscalYear: integer('fiscal_year'), // nullable – was year, notNull previously – now nullable for yearly reset optional
  year: integer('year'), // legacy alias for fiscal_year
  prefix: varchar('prefix', { length: 20 }).notNull().default(''),
  fromNumber: bigint('from_number', { mode: 'number' }).notNull(),
  toNumber: bigint('to_number', { mode: 'number' }).notNull(),
  currentNumber: bigint('current_number', { mode: 'number' }).notNull().default(0),
  description: text('description'),
  isBuffered: boolean('is_buffered').default(false).notNull(),
  bufferSize: integer('buffer_size').default(10),
  isExternal: boolean('is_external').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueCode: uniqueIndex('uq_core_nr_code').on(t.code),
  uniqueRange: uniqueIndex('uq_core_nr_obj_le_year').on(t.objectType, t.legalEntityId, t.fiscalYear),
}));

export const coreNumberRangeBuffer = pgTable('core_number_range_buffer', {
  id: uuid('id').primaryKey().defaultRandom(),
  numberRangeId: uuid('number_range_id').notNull().references(() => coreNumberRange.id),
  bufferedNumber: bigint('buffered_number', { mode: 'number' }).notNull(),
  isConsumed: boolean('is_consumed').default(false).notNull(),
  consumedAt: timestamp('consumed_at'),
  consumedByDoc: varchar('consumed_by_doc', { length: 100 }),
});

// Currency – replaces core_currency – legal-safe core_currency – sample INR default, KWD/USD/EUR sample kept
export const coreCurrency = pgTable('core_currency', {
  code: varchar('code', { length: 3 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  decimalPlaces: integer('decimal_places').notNull().default(2),
  symbol: varchar('symbol', { length: 10 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Exchange Rate – replaces core_exchange_rate – legal-safe core_exchange_rate
export const coreExchangeRateTypeEnum = pgEnum('core_rate_type', ['AVG', 'BUY', 'SELL', 'SPOT']);

export const coreExchangeRate = pgTable('core_exchange_rate', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromCurrency: varchar('from_currency', { length: 3 }).notNull().references(() => coreCurrency.code),
  toCurrency: varchar('to_currency', { length: 3 }).notNull().references(() => coreCurrency.code),
  validFrom: timestamp('valid_from').notNull(),
  rate: numeric('rate', { precision: 15, scale: 6 }).notNull(),
  rateType: coreExchangeRateTypeEnum('rate_type').default('AVG').notNull(),
  companyCodeId: uuid('company_code_id'), // legacy – org_legal_entity reference
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueRate: uniqueIndex('uq_core_exchange_rate').on(t.fromCurrency, t.toCurrency, t.validFrom, t.rateType),
  idxFromTo: index('idx_core_exchange_from_to').on(t.fromCurrency, t.toCurrency),
  idxValidFrom: index('idx_core_exchange_valid_from').on(t.validFrom),
}));

// Fiscal Calendar – replaces fin_fiscal_calendar – legal-safe fin_fiscal_calendar already in orgStructureSchema – period table
export const finFiscalCalendarPeriod = pgTable('fin_fiscal_calendar_period', {
  id: uuid('id').primaryKey().defaultRandom(),
  fiscalCalendarId: uuid('fiscal_calendar_id').notNull().references(() => finFiscalCalendar.id),
  period: integer('period').notNull(),
  periodNumber: integer('period_number'), // alias for period
  calendarMonth: integer('calendar_month').notNull(),
  month: integer('month'), // legacy alias
  yearShift: integer('year_shift').default(0).notNull(),
  year_shift: integer('year_shift_alias'), // legacy – will be ignored, but keep for compat search
  startDayMonth: varchar('start_day_month', { length: 10 }),
  endDayMonth: varchar('end_day_month', { length: 10 }),
  description: text('description'),
}, (t) => ({
  uniqueCalendarPeriod: uniqueIndex('uq_fin_fiscal_calendar_period').on(t.fiscalCalendarId, t.period),
}));

// Posting Calendar – replaces fin_posting_calendar – legal-safe fin_posting_calendar already in orgStructureSchema – period open/close
export const finPostingAccountTypeEnum = pgEnum('fin_posting_account_type', ['ALL', 'ASSET', 'CUSTOMER', 'VENDOR', 'ITEM', 'GL']);

export const finPostingCalendarPeriod = pgTable('fin_posting_calendar_period', {
  id: uuid('id').primaryKey().defaultRandom(),
  postingCalendarId: uuid('posting_calendar_id').notNull().references(() => finPostingCalendar.id),
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id),
  fromPeriod: integer('from_period').notNull(),
  fromYear: integer('from_year').notNull(),
  toPeriod: integer('to_period').notNull(),
  toYear: integer('to_year').notNull(),
  accountType: finPostingAccountTypeEnum('account_type').notNull().default('ALL'),
  isOpen: boolean('is_open').default(true).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxCalendar: index('idx_fin_posting_calendar_period_calendar').on(t.postingCalendarId),
  idxLegalEntity: index('idx_fin_posting_calendar_period_legal').on(t.legalEntityId),
}));

// Chart of Accounts – replaces fin_chart – legal-safe fin_chart – sample INT kept
// Extended with language EN per guide – OB13 needs language
export const finChart = pgTable('fin_chart', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  language: varchar('language', { length: 10 }).default('EN').notNull(), // Added per guide – OB13 language EN
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// GL Account – replaces fin_ledger_account – legal-safe fin_ledger_account – sample 100000-500000 kept
export const finLedgerAccountTypeEnum = pgEnum('fin_ledger_account_type', ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);

export const finLedgerAccount = pgTable('fin_ledger_account', {
  id: uuid('id').primaryKey().defaultRandom(),
  chartId: uuid('chart_id').notNull().references(() => finChart.id),
  coaId: uuid('coa_id'), // legacy alias for chart_id
  accountNumber: varchar('account_number', { length: 30 }).notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  accountType: finLedgerAccountTypeEnum('account_type').notNull(),
  isBalanceSheet: boolean('is_balance_sheet').notNull(),
  isReconciliation: boolean('is_reconciliation').default(false).notNull(),
  isBlocked: boolean('is_blocked').default(false).notNull(),
  isTaxRelevant: boolean('is_tax_relevant').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueChartAccount: uniqueIndex('uq_fin_chart_account').on(t.chartId, t.accountNumber),
}));

// Tax Rule – replaces fin_tax_rule – legal-safe fin_tax_rule – sample GST0/5/12/18/28, IGST, VAT 5% kept
export const finTaxRuleTypeEnum = pgEnum('fin_tax_rule_type', ['INPUT', 'OUTPUT', 'BOTH', 'NONE', 'EXEMPT']);
export const finGstTypeEnum = pgEnum('fin_gst_type', ['CGST', 'SGST', 'IGST', 'UTGST', 'CESS', 'VAT', 'NONE']);

export const finTaxRule = pgTable('fin_tax_rule', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  description: varchar('description', { length: 150 }).notNull(),
  rate: numeric('rate', { precision: 5, scale: 2 }).notNull(),
  type: finTaxRuleTypeEnum('type').notNull(),
  gstType: finGstTypeEnum('gst_type').default('NONE').notNull(),
  ledgerAccountId: uuid('ledger_account_id').references(() => finLedgerAccount.id),
  glAccountId: uuid('gl_account_id'), // legacy alias
  hsnCode: varchar('hsn_code', { length: 20 }),
  isReverseCharge: boolean('is_reverse_charge').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Auto Posting Rule – replaces fin_auto_posting_rule – legal-safe fin_auto_posting_rule
export const finAutoPostingTransactionKeyEnum = pgEnum('fin_auto_posting_key', [
  'INV_POSTING',
  'GR_IR_CLEARING',
  'PRICE_DIFF',
  'INV_OFFSET',
  'STOCK_TRANSFER',
  'TAX_PAYABLE',
  'TAX_RECEIVABLE',
  'REVENUE',
  'COGS',
  'AR',
  'AP',
  'BANK',
  'CASH',
  'SALARY_PAYABLE',
  'SALARY_EXPENSE',
  'FREIGHT',
  'TAX_INPUT',
]);

export const finAutoPostingRule = pgTable('fin_auto_posting_rule', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyCodeId: uuid('company_code_id'),
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id),
  transactionKey: finAutoPostingTransactionKeyEnum('transaction_key').notNull(),
  transactionKeyLegacy: varchar('transaction_key_legacy', { length: 10 }),
  inventoryValuationClass: varchar('inventory_valuation_class', { length: 20 }),
  valuationClass: varchar('valuation_class', { length: 20 }), // legacy alias – kept for backward compat, UI uses inventory_valuation_class only
  ledgerAccountId: uuid('ledger_account_id').references(() => finLedgerAccount.id),
  glAccountId: uuid('gl_account_id'), // legacy
  description: varchar('description', { length: 200 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueAuto: uniqueIndex('uq_fin_auto_key_val_class').on(t.legalEntityId, t.transactionKey, t.inventoryValuationClass),
}));

// Document Type – replaces fin_document_type – legal-safe fin_document_type
export const finDocumentType = pgTable('fin_document_type', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  codeLegacy: varchar('code_legacy', { length: 10 }),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  numberRangeCode: varchar('number_range_code', { length: 50 }),
  numberRangeFrom: varchar('number_range_from', { length: 30 }),
  numberRangeTo: varchar('number_range_to', { length: 30 }),
  accountTypesAllowed: varchar('account_types_allowed', { length: 30 }).default('ALL'),
  reverseDocumentType: varchar('reverse_document_type', { length: 20 }),
  legacyCode: varchar('legacy_code', { length: 10 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tolerance Group – replaces fin_tolerance_group – legal-safe fin_tolerance_group
export const finToleranceGroupTypeEnum = pgEnum('fin_tolerance_group_type', ['GL', 'EMPLOYEE', 'CUSTOMER', 'VENDOR', 'AP', 'AR']);

export const finToleranceGroup = pgTable('fin_tolerance_group', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 30 }).notNull().unique(),
  codeLegacy: varchar('code_legacy', { length: 20 }),
  name: varchar('name', { length: 150 }).notNull(),
  type: finToleranceGroupTypeEnum('type').notNull().default('GL'),
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id),
  lowerLimit: numeric('lower_limit', { precision: 15, scale: 3 }).default('0'),
  upperLimit: numeric('upper_limit', { precision: 15, scale: 3 }).default('0'),
  amountPerDocument: numeric('amount_per_document', { precision: 15, scale: 3 }).default('0'),
  amountPerOpenItem: numeric('amount_per_open_item', { precision: 15, scale: 3 }).default('0'),
  cashDiscountPerLine: numeric('cash_discount_per_line', { precision: 5, scale: 2 }).default('0'),
  maxCashDiscount: numeric('max_cash_discount', { precision: 15, scale: 3 }).default('0'),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const finChartRelations = relations(finChart, ({ many }) => ({
  ledgerAccounts: many(finLedgerAccount),
}));
