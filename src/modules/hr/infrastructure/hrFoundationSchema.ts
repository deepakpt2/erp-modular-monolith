import { pgTable, varchar, boolean, timestamp, uuid, text, date, numeric, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { orgFacility, orgLegalEntity, orgCostUnit } from '../../foundation/enterprise/infrastructure/orgStructureSchema';
import { coreCurrency } from '../../foundation/enterprise/infrastructure/financialsFoundationSchema';

/**
 * Module 9 – HR Foundation – Legal-Safe Own IP
 * Replaces hr_org_unit, hr_position, hr_employee, hr_payroll_run, hr_payroll_line with hr_* legal-safe
 * Maps:
 * - hr_org_unit → hr_organization_unit – code OU-1000, name, parentId, facilityId FAC-1000 was plant_id, description, isActive – HOUC HR Org Unit Create alias OUC/PP01
 * - hr_position → hr_position – code POS-1000, name, organizationUnitId was org_unit_id, description, isManager, isOwner, isActive – HPOC HR Position Create alias POC/PO13
 * - hr_employee → hr_employee_master – employeeNumber EMP-10000001 was number range, userId, firstName lastName, email phone, positionId was position_id, managerId, facilityId FAC-1000 was plant_id, legalEntityId was company_code_id, costUnitId ECUC was cost_center_id, status ACTIVE/ON_LEAVE/TERMINATED/PROBATION, hireDate terminationDate, basicSalary, currencyCode INR default was KWD, isActive – HEMC HR Employee Master Create alias EMC/PA30
 * - hr_payroll_run → hr_payroll_run – periodYear 2026, periodMonth 09, legalEntityId was company_code_id, status DRAFT/POSTED/PAID/CANCELLED, totalGross/totalDeductions/totalNet, universalLedgerId FULC was fi_document_id, postedAt postedBy – HPRC HR Payroll Run Create alias PRC/PC00
 * - hr_payroll_line → hr_payroll_line – payrollRunId, employeeId, basicSalary, allowances, deductions, overtime, netPay, costUnitId was cost_center_id, status DRAFT/POSTED/PAID – HPRL HR Payroll Line Create
 * Sample: none – fresh empty per requirement but facility/legalEntity/costUnit/currency kept
 * Helper codes: HOUC HR Org Unit Create (alias OUC, PP01), HPOC HR Position Create (alias POC), HEMC HR Employee Master Create (alias EMC, PA30, FIN-HR-CR), HPRC HR Payroll Run Create (alias PRC, PC00)
 * 4-char MOOA: H=HR, OU=OrgUnit, C=Create etc – module grouped intuitive
 */

export const hrEmploymentStatusEnumNew = pgEnum('hr_employment_status_new', ['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'PROBATION']);
export const hrPayrollStatusEnumNew = pgEnum('hr_payroll_status_new', ['DRAFT', 'POSTED', 'PAID', 'CANCELLED']);

// Aliases for backward compat inside file
const employmentStatusEnum = hrEmploymentStatusEnumNew;
const payrollStatusEnum = hrPayrollStatusEnumNew;

// Org Unit – legal-safe hr_organization_unit – HOUC
export const hrOrganizationUnit = pgTable('hr_organization_unit', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(), // OU-1000
  name: varchar('name', { length: 100 }).notNull(),
  parentId: uuid('parent_id').references((): any => hrOrganizationUnit.id),
  facilityId: uuid('facility_id').references(() => orgFacility.id), // was plant_id – FAC-1000
  plantId: uuid('plant_id'), // legacy alias
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxParent: index('idx_hr_org_unit_parent').on(t.parentId),
  idxFacility: index('idx_hr_org_unit_facility').on(t.facilityId),
}));

// Position – legal-safe hr_position_new – HPOC
export const hrPositionNew = pgTable('hr_position_new', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(), // POS-1000
  name: varchar('name', { length: 100 }).notNull(),
  organizationUnitId: uuid('organization_unit_id').notNull().references(() => hrOrganizationUnit.id), // was org_unit_id
  orgUnitId: uuid('org_unit_id'), // legacy alias
  description: text('description'),
  isManager: boolean('is_manager').default(false).notNull(),
  isOwner: boolean('is_owner').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxOrgUnit: index('idx_hr_position_org_unit').on(t.organizationUnitId),
}));

// Employee – legal-safe hr_employee_master – HEMC
export const hrEmployeeMaster = pgTable('hr_employee_master', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeNumber: varchar('employee_number', { length: 20 }).notNull().unique(), // EMP-10000001
  userId: uuid('user_id').unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  phone: varchar('phone', { length: 30 }),
  positionId: uuid('position_id').notNull().references(() => hrPositionNew.id),
  managerId: uuid('manager_id').references((): any => hrEmployeeMaster.id),
  facilityId: uuid('facility_id').references(() => orgFacility.id), // was plant_id – FAC-1000
  plantId: uuid('plant_id'), // legacy alias
  legalEntityId: uuid('legal_entity_id').references(() => orgLegalEntity.id), // was company_code_id – LE-1000
  companyCodeId: uuid('company_code_id'), // legacy alias
  costUnitId: uuid('cost_unit_id').references(() => orgCostUnit.id), // was cost_center_id – ECUC
  costCenterId: uuid('cost_center_id'), // legacy alias
  status: employmentStatusEnum('status').notNull().default('ACTIVE'),
  hireDate: date('hire_date').notNull(),
  terminationDate: date('termination_date'),
  basicSalary: numeric('basic_salary', { precision: 12, scale: 3 }).notNull().default('0'),
  currencyCode: varchar('currency_code', { length: 3 }).default('INR').references(() => coreCurrency.code), // INR default was KWD
  currency: varchar('currency', { length: 3 }), // legacy alias KWD
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxManager: index('idx_hr_emp_master_manager').on(t.managerId),
  idxPosition: index('idx_hr_emp_master_position').on(t.positionId),
  idxUser: index('idx_hr_emp_master_user').on(t.userId),
  idxFacility: index('idx_hr_emp_master_facility').on(t.facilityId),
  idxLegalEntity: index('idx_hr_emp_master_legal').on(t.legalEntityId),
}));

// Payroll Run – legal-safe hr_payroll_run_new – HPRC
export const hrPayrollRunNew = pgTable('hr_payroll_run_new', {
  id: uuid('id').primaryKey().defaultRandom(),
  periodYear: varchar('period_year', { length: 4 }).notNull(), // 2026
  periodMonth: varchar('period_month', { length: 2 }).notNull(), // 09
  legalEntityId: uuid('legal_entity_id').notNull().references(() => orgLegalEntity.id), // was company_code_id – LE-1000
  companyCodeId: uuid('company_code_id'), // legacy alias
  status: payrollStatusEnum('status').notNull().default('DRAFT'),
  totalGross: numeric('total_gross', { precision: 15, scale: 3 }).notNull().default('0'),
  totalDeductions: numeric('total_deductions', { precision: 15, scale: 3 }).notNull().default('0'),
  totalNet: numeric('total_net', { precision: 15, scale: 3 }).notNull().default('0'),
  universalLedgerId: uuid('universal_ledger_id'), // was fi_document_id – FULC
  fiDocumentId: uuid('fi_document_id'), // legacy alias
  postedAt: timestamp('posted_at'),
  postedBy: uuid('posted_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniquePeriod: uniqueIndex('uq_hr_payroll_period_new').on(t.periodYear, t.periodMonth, t.legalEntityId),
  idxLegalEntity: index('idx_hr_payroll_legal').on(t.legalEntityId),
}));

// Payroll Line – legal-safe hr_payroll_line_new – HPRL
export const hrPayrollLineNew = pgTable('hr_payroll_line_new', {
  id: uuid('id').primaryKey().defaultRandom(),
  payrollRunId: uuid('payroll_run_id').notNull().references(() => hrPayrollRunNew.id, { onDelete: 'cascade' }),
  employeeId: uuid('employee_id').notNull().references(() => hrEmployeeMaster.id),
  basicSalary: numeric('basic_salary', { precision: 12, scale: 3 }).notNull(),
  allowances: numeric('allowances', { precision: 12, scale: 3 }).notNull().default('0'),
  deductions: numeric('deductions', { precision: 12, scale: 3 }).notNull().default('0'),
  overtime: numeric('overtime', { precision: 12, scale: 3 }).notNull().default('0'),
  netPay: numeric('net_pay', { precision: 12, scale: 3 }).notNull(),
  costUnitId: uuid('cost_unit_id').references(() => orgCostUnit.id), // was cost_center_id – ECUC
  costCenterId: uuid('cost_center_id'), // legacy alias
  status: varchar('status', { length: 20 }).default('DRAFT'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxPayroll: index('idx_hr_payroll_line_run_new').on(t.payrollRunId),
  idxEmployee: index('idx_hr_payroll_line_emp_new').on(t.employeeId),
}));
