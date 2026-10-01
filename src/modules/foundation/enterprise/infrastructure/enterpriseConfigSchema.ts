import { pgTable, varchar, boolean, timestamp, uuid, text, numeric, integer, index, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import { entCompanyCode, entPlant } from './schema';

// Fiscal Year Variant OB29 K4 April-March
export const entFiscalYearVariant = pgTable('fin_fiscal_calendar', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 4 }).notNull().unique(), // K4, K1, etc
  description: varchar('description', { length: 100 }).notNull(),
  yearDependent: boolean('year_dependent').default(false).notNull(),
  calendarYear: boolean('calendar_year').default(false).notNull(),
  numberOfPeriods: integer('number_of_periods').default(12).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const entFiscalYearPeriod = pgTable('fin_fiscal_calendar_period', {
  id: uuid('id').primaryKey().defaultRandom(),
  variantId: uuid('variant_id').notNull().references(() => entFiscalYearVariant.id),
  period: integer('period').notNull(), // 1-12
  month: integer('month').notNull(), // 1-12 calendar month mapping
  yearShift: integer('year_shift').default(0).notNull(), // -1,0,+1 for K4 April-March
  startDate: varchar('start_date', { length: 10 }), // MM-DD
  endDate: varchar('end_date', { length: 10 }),
}, (t) => ({
  uniqueVariantPeriod: uniqueIndex('uq_fiscal_variant_period').on(t.variantId, t.period),
}));

// Posting Period Variant OBBO
export const entPostingPeriodVariant = pgTable('fin_posting_calendar', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 10 }).notNull().unique(), // KS01, 1000
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Open/Close Posting Periods OB52
export const entPostingPeriod = pgTable('fin_posting_calendar_period', {
  id: uuid('id').primaryKey().defaultRandom(),
  variantId: uuid('variant_id').notNull().references(() => entPostingPeriodVariant.id),
  companyCodeId: uuid('company_code_id').references(() => entCompanyCode.id),
  fromPeriod: integer('from_period').notNull(),
  fromYear: integer('from_year').notNull(),
  toPeriod: integer('to_period').notNull(),
  toYear: integer('to_year').notNull(),
  accountType: varchar('account_type', { length: 2 }).notNull().default('+'), // + All, A Assets, D Customers, K Vendors, M Materials, S G/L
  isOpen: boolean('is_open').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxVariant: index('idx_posting_period_variant').on(t.variantId),
  idxCompany: index('idx_posting_period_company').on(t.companyCodeId),
}));

// Field Status Variant OBC4
export const entFieldStatusVariant = pgTable('fin_field_status_variant', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 10 }).notNull().unique(), // KS01, 1000
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const entFieldStatusGroup = pgTable('fin_field_status_group', {
  id: uuid('id').primaryKey().defaultRandom(),
  variantId: uuid('variant_id').notNull().references(() => entFieldStatusVariant.id),
  code: varchar('code', { length: 10 }).notNull(), // G001, G004, G005
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
}, (t) => ({
  uniqueVariantCode: uniqueIndex('uq_field_status_group').on(t.variantId, t.code),
}));

export const entFieldStatus = pgTable('fin_field_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => entFieldStatusGroup.id),
  fieldName: varchar('field_name', { length: 50 }).notNull(), // cost_center, profit_center, tax_code, etc
  isRequired: boolean('is_required').default(false).notNull(),
  isOptional: boolean('is_optional').default(true).notNull(),
  isSuppressed: boolean('is_suppressed').default(false).notNull(),
}, (t) => ({
  uniqueGroupField: uniqueIndex('uq_field_status_field').on(t.groupId, t.fieldName),
}));

// Tolerance Group OBA0 G/L, OBA4 Employee/Customer/Vendor
export const toleranceTypeEnum = pgEnum('tolerance_type', ['GL', 'EMPLOYEE', 'CUSTOMER', 'VENDOR', 'AP', 'AR']);
export const entToleranceGroup = pgTable('fin_tolerance_group', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(), // 1000, KS01, blank
  name: varchar('name', { length: 100 }).notNull(),
  type: toleranceTypeEnum('type').notNull().default('GL'),
  companyCodeId: uuid('company_code_id').references(() => entCompanyCode.id),
  amountPerDocument: numeric('amount_per_document', { precision: 15, scale: 3 }).default('0'), // Max amount per doc
  amountPerOpenItem: numeric('amount_per_open_item', { precision: 15, scale: 3 }).default('0'),
  cashDiscountPerLine: numeric('cash_discount_per_line', { precision: 5, scale: 2 }).default('0'), // %
  maxCashDiscount: numeric('max_cash_discount', { precision: 15, scale: 3 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Credit Control Area OB45
export const entCreditControlArea = pgTable('fin_credit_policy_area', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 10 }).notNull().unique(), // KS01, 1000
  name: varchar('name', { length: 100 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('INR'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const entCreditControlAssignment = pgTable('ent_credit_control_assignment', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyCodeId: uuid('company_code_id').notNull().references(() => entCompanyCode.id),
  creditControlAreaId: uuid('credit_control_area_id').notNull().references(() => entCreditControlArea.id),
}, (t) => ({
  uniqueCompanyCredit: uniqueIndex('uq_company_credit').on(t.companyCodeId, t.creditControlAreaId),
}));

// Document Type OBA7
export const entDocumentType = pgTable('fin_document_type', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 10 }).notNull().unique(), // KR, KG, KZ, RE, WE, WA, SA
  name: varchar('name', { length: 100 }).notNull(),
  numberRangeFrom: varchar('number_range_from', { length: 20 }),
  numberRangeTo: varchar('number_range_to', { length: 20 }),
  accountTypesAllowed: varchar('account_types_allowed', { length: 20 }).default('+'), // + All, A, D, K, M, S
  reverseDocType: varchar('reverse_doc_type', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Approval Authority Matrix for 500 employees hierarchical
export const approvalAuthorityLevel = pgEnum('approval_authority_level', ['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'OWNER', 'CFO', 'CEO']);
export const entApprovalAuthority = pgTable('ent_approval_authority', {
  id: uuid('id').primaryKey().defaultRandom(),
  positionId: uuid('position_id').notNull(), // FK to hr_position
  documentType: varchar('document_type', { length: 20 }).notNull(), // PR, PO, PAYROLL, SALES, GR, IV
  minAmount: numeric('min_amount', { precision: 15, scale: 3 }).default('0'),
  maxAmount: numeric('max_amount', { precision: 15, scale: 3 }).default('999999999'),
  currency: varchar('currency', { length: 3 }).default('INR'),
  level: approvalAuthorityLevel('level').notNull().default('LEVEL_1'),
  canApprove: boolean('can_approve').default(true).notNull(),
  canReject: boolean('can_reject').default(true).notNull(),
  requiresDual: boolean('requires_dual').default(false).notNull(), // Dual approval required
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxPosition: index('idx_approval_position').on(t.positionId),
  idxDocType: index('idx_approval_doctype').on(t.documentType),
}));

// Role Based Access Control for 500 employees
export const entRole = pgTable('auth_role', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 30 }).notNull().unique(), // ADMIN, PURCHASER, WAREHOUSE, ACCOUNTANT, MANAGER, OWNER, HR, SALES
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isSystem: boolean('is_system').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const entPermission = pgTable('auth_permission', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 100 }).notNull().unique(), // PR_CREATE, PO_APPROVE, GR_POST, IV_POST, SALES_CREATE, etc
  name: varchar('name', { length: 100 }).notNull(),
  module: varchar('module', { length: 20 }).notNull(), // MM, SD, PP, FICO, HR, FOUNDATION
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const entRolePermission = pgTable('auth_role_permission', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull().references(() => entRole.id),
  permissionId: uuid('permission_id').notNull().references(() => entPermission.id),
}, (t) => ({
  uniqueRolePerm: uniqueIndex('uq_role_permission').on(t.roleId, t.permissionId),
}));

export const entUserRole = pgTable('auth_user_role', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // FK to auth user
  roleId: uuid('role_id').notNull().references(() => entRole.id),
  companyCodeId: uuid('company_code_id').references(() => entCompanyCode.id),
  plantId: uuid('plant_id').references(() => entPlant.id),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  assignedBy: uuid('assigned_by'),
}, (t) => ({
  idxUser: index('idx_user_role_user').on(t.userId),
  idxRole: index('idx_user_role_role').on(t.roleId),
}));
