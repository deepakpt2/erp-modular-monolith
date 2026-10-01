import { pgTable, varchar, boolean, timestamp, uuid, text, date, numeric, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { entPlant, entCompanyCode } from '../../foundation/enterprise/infrastructure/schema';

export const employmentStatusEnum = pgEnum('employment_status', ['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'PROBATION']);
export const payrollStatusEnum = pgEnum('payroll_status', ['DRAFT', 'POSTED', 'PAID', 'CANCELLED']);

export const hrOrgUnit = pgTable('hr_org_unit', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  parentId: uuid('parent_id').references((): any => hrOrgUnit.id),
  plantId: uuid('plant_id').references(() => entPlant.id),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const hrPosition = pgTable('hr_position', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  orgUnitId: uuid('org_unit_id').notNull().references(() => hrOrgUnit.id),
  description: text('description'),
  isManager: boolean('is_manager').default(false).notNull(),
  isOwner: boolean('is_owner').default(false).notNull(), // For dual approval owner flag
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const hrEmployee = pgTable('hr_employee', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeNumber: varchar('employee_number', { length: 20 }).notNull().unique(),
  userId: uuid('user_id').unique(), // 1:1 with auth user
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  phone: varchar('phone', { length: 30 }),
  positionId: uuid('position_id').notNull().references(() => hrPosition.id),
  managerId: uuid('manager_id').references((): any => hrEmployee.id), // Reporting hierarchy
  plantId: uuid('plant_id').references(() => entPlant.id),
  companyCodeId: uuid('company_code_id').references(() => entCompanyCode.id),
  costCenterId: uuid('cost_center_id'), // FK to fin_cost_center later
  status: employmentStatusEnum('status').notNull().default('ACTIVE'),
  hireDate: date('hire_date').notNull(),
  terminationDate: date('termination_date'),
  basicSalary: numeric('basic_salary', { precision: 12, scale: 3 }).notNull().default('0'),
  currency: varchar('currency', { length: 3 }).default('KWD'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxManager: index('idx_emp_manager').on(t.managerId),
  idxPosition: index('idx_emp_position').on(t.positionId),
  idxUser: index('idx_emp_user').on(t.userId),
}));

// Payroll - Basic to track monthly salary expenses and generate FI entries
export const hrPayrollRun = pgTable('hr_payroll_run', {
  id: uuid('id').primaryKey().defaultRandom(),
  periodYear: varchar('period_year', { length: 4 }).notNull(), // 2026
  periodMonth: varchar('period_month', { length: 2 }).notNull(), // 09
  companyCodeId: uuid('company_code_id').notNull().references(() => entCompanyCode.id),
  status: payrollStatusEnum('status').notNull().default('DRAFT'),
  totalGross: numeric('total_gross', { precision: 15, scale: 3 }).notNull().default('0'),
  totalDeductions: numeric('total_deductions', { precision: 15, scale: 3 }).notNull().default('0'),
  totalNet: numeric('total_net', { precision: 15, scale: 3 }).notNull().default('0'),
  fiDocumentId: uuid('fi_document_id'), // Posted FI doc
  postedAt: timestamp('posted_at'),
  postedBy: uuid('posted_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniquePeriod: uniqueIndex('uq_payroll_period').on(t.periodYear, t.periodMonth, t.companyCodeId),
}));

export const hrPayrollLine = pgTable('hr_payroll_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  payrollRunId: uuid('payroll_run_id').notNull().references(() => hrPayrollRun.id, { onDelete: 'cascade' }),
  employeeId: uuid('employee_id').notNull().references(() => hrEmployee.id),
  basicSalary: numeric('basic_salary', { precision: 12, scale: 3 }).notNull(),
  allowances: numeric('allowances', { precision: 12, scale: 3 }).notNull().default('0'),
  deductions: numeric('deductions', { precision: 12, scale: 3 }).notNull().default('0'),
  overtime: numeric('overtime', { precision: 12, scale: 3 }).notNull().default('0'),
  netPay: numeric('net_pay', { precision: 12, scale: 3 }).notNull(),
  costCenterId: uuid('cost_center_id'),
  status: varchar('status', { length: 20 }).default('DRAFT'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxPayroll: index('idx_payroll_line_run').on(t.payrollRunId),
  idxEmployee: index('idx_payroll_line_emp').on(t.employeeId),
}));
