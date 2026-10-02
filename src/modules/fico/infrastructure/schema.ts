import { pgTable, varchar, boolean, timestamp, uuid, text, numeric, pgEnum, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { entCompanyCode, entBusinessPartner } from '../../foundation/enterprise/infrastructure/schema';

export const glAccountTypeEnum = pgEnum('gl_account_type', ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);
export const fiDocTypeEnum = pgEnum('fi_doc_type', ['SA', 'RE', 'WE', 'RV', 'AB', 'PR', 'HR']); // SA=GL, RE=Invoice, WE=GR, RV=Invoice reversal, AB=Asset, PR=Payroll, HR=HR
export const fiDocStatusEnum = pgEnum('fi_doc_status', ['DRAFT', 'POSTED', 'REVERSED', 'CANCELLED']);
export const taxTypeEnum = pgEnum('tax_type', ['INPUT', 'OUTPUT', 'BOTH', 'NONE']);
export const apArStatusEnum = pgEnum('ap_ar_status', ['OPEN', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'BLOCKED']);

export const fiChartOfAccounts = pgTable('fin_chart', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(), // e.g., 'INT', 'CA-IN-01'
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  language: varchar('language', { length: 10 }).default('EN').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const fiGlAccount = pgTable('fin_ledger_account', {
  id: uuid('id').primaryKey().defaultRandom(),
  coaId: uuid('coa_id').notNull().references(() => fiChartOfAccounts.id),
  accountNumber: varchar('account_number', { length: 20 }).notNull(), // e.g., '100000'
  name: varchar('name', { length: 100 }).notNull(),
  accountType: glAccountTypeEnum('account_type').notNull(),
  isBalanceSheet: boolean('is_balance_sheet').notNull(),
  isReconciliation: boolean('is_reconciliation').default(false).notNull(), // For AP/AR recon
  isBlocked: boolean('is_blocked').default(false).notNull(),
  isTaxRelevant: boolean('is_tax_relevant').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueCoaAccount: uniqueIndex('uq_coa_account').on(t.coaId, t.accountNumber),
}));

export const fiCostCenter = pgTable('fin_cost_center', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(), // e.g., 'CC-KITCHEN-01'
  name: varchar('name', { length: 100 }).notNull(),
  companyCodeId: uuid('company_code_id').notNull().references(() => entCompanyCode.id),
  parentId: uuid('parent_id').references((): any => fiCostCenter.id),
  responsibleEmployeeId: uuid('responsible_employee_id'),
  isActive: boolean('is_active').default(true).notNull(),
  validFrom: timestamp('valid_from').defaultNow().notNull(),
  validTo: timestamp('valid_to'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const fiTaxCode = pgTable('fin_tax_rule', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 10 }).notNull().unique(), // V0, V5, A0, A5
  description: varchar('description', { length: 100 }).notNull(),
  rate: numeric('rate', { precision: 5, scale: 2 }).notNull(), // 5.00 = 5%
  type: taxTypeEnum('type').notNull(),
  glAccountId: uuid('gl_account_id').references(() => fiGlAccount.id), // Tax GL
  isActive: boolean('is_active').default(true).notNull(),
});

export const fiAutoAccountDetermination = pgTable('fin_auto_posting_rule', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyCodeId: uuid('company_code_id').notNull().references(() => entCompanyCode.id),
  transactionKey: varchar('transaction_key', { length: 20 }).notNull(), // Own IP: INV_POSTING (legacy BSX), GR_IR_CLEARING (legacy WRX), INV_OFFSET (legacy GBB), PRICE_DIFF (legacy PRD), INV_DIFF (legacy BSV) etc – with SAP alias
  valuationClass: varchar('valuation_class', { length: 10 }).notNull(), // ROH, FERT, etc
  glAccountId: uuid('gl_account_id').notNull().references(() => fiGlAccount.id),
  description: varchar('description', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueAuto: uniqueIndex('uq_auto_key_val_class').on(t.companyCodeId, t.transactionKey, t.valuationClass),
}));

// FI Document - Header – Own IP FUNL (legacy BKPF) – Universal Ledger
export const fiDocument = pgTable('fin_universal_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentNumber: varchar('document_number', { length: 20 }).notNull().unique(), // Number range
  companyCodeId: uuid('company_code_id').notNull().references(() => entCompanyCode.id),
  docType: fiDocTypeEnum('doc_type').notNull(),
  postingDate: timestamp('posting_date').notNull(),
  documentDate: timestamp('document_date').notNull(),
  reference: varchar('reference', { length: 50 }),
  headerText: varchar('header_text', { length: 100 }),
  totalDebit: numeric('total_debit', { precision: 15, scale: 3 }).notNull().default('0'),
  totalCredit: numeric('total_credit', { precision: 15, scale: 3 }).notNull().default('0'),
  currency: varchar('currency', { length: 3 }).notNull().default('KWD'),
  status: fiDocStatusEnum('status').notNull().default('POSTED'),
  reversalOfId: uuid('reversal_of_id').references((): any => fiDocument.id),
  // Reference to source doc (MM, PP, HR)
  referenceDocType: varchar('reference_doc_type', { length: 20 }), // GR, IV, PROD, PAYROLL
  referenceDocId: uuid('reference_doc_id'),
  referenceDocNumber: varchar('reference_doc_number', { length: 50 }),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxPostingDate: index('idx_fi_doc_posting_date').on(t.postingDate),
  idxRefDoc: index('idx_fi_doc_ref').on(t.referenceDocType, t.referenceDocNumber),
  idxCompany: index('idx_fi_doc_company').on(t.companyCodeId),
}));

// FI Document - Line (Own IP FUNL line – legacy BSEG)
export const fiDocumentLine = pgTable('fin_universal_ledger_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  fiDocumentId: uuid('fi_document_id').notNull().references(() => fiDocument.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(), // 1,2,3
  glAccountId: uuid('gl_account_id').notNull().references(() => fiGlAccount.id),
  costCenterId: uuid('cost_center_id').references(() => fiCostCenter.id),
  taxCodeId: uuid('tax_code_id').references(() => fiTaxCode.id),
  debit: numeric('debit', { precision: 15, scale: 3 }).notNull().default('0'),
  credit: numeric('credit', { precision: 15, scale: 3 }).notNull().default('0'),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  text: varchar('text', { length: 100 }),
  // For inventory postings
  materialId: uuid('material_id'),
  quantity: numeric('quantity', { precision: 15, scale: 3 }),
  // For AP/AR
  bpId: uuid('bp_id').references(() => entBusinessPartner.id),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxFiDoc: index('idx_fi_line_doc').on(t.fiDocumentId),
  idxGlAccount: index('idx_fi_line_gl').on(t.glAccountId),
  idxCostCenter: index('idx_fi_line_cc').on(t.costCenterId),
  uniqueLine: uniqueIndex('uq_fi_doc_line').on(t.fiDocumentId, t.lineNumber),
}));

// AP/AR Open Items
export const fiApInvoice = pgTable('fin_ap_invoice', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceNumber: varchar('invoice_number', { length: 30 }).notNull(), // Vendor invoice no
  fiDocumentId: uuid('fi_document_id').references(() => fiDocument.id),
  vendorId: uuid('vendor_id').notNull().references(() => entBusinessPartner.id),
  companyCodeId: uuid('company_code_id').notNull().references(() => entCompanyCode.id),
  postingDate: timestamp('posting_date').notNull(),
  invoiceDate: timestamp('invoice_date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  grossAmount: numeric('gross_amount', { precision: 15, scale: 3 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 3 }).notNull().default('0'),
  netAmount: numeric('net_amount', { precision: 15, scale: 3 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('KWD'),
  status: apArStatusEnum('status').notNull().default('OPEN'),
  grId: uuid('gr_id'), // Link to goods receipt
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
