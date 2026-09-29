import { pgTable, varchar, boolean, timestamp, uuid, text, integer, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orgFacility, orgLegalEntity, orgProcurementDivision, orgBuyerTeam, orgCommercialOrg, orgSalesChannel, orgProductLine, finCreditPolicyArea } from './orgStructureSchema';

/**
 * Module 3 – Partner Account – Legal-Safe Own IP
 * Replaces ent_business_partner, ent_bp_vendor_ext, ent_bp_customer_ext
 * Fresh empty – no SAP-identical names like BP, ME01, XK01, XD01 as primary – those kept as aliases
 * Helper codes: EPAC (Enterprise Partner Account Create) alias PTNC/BPAC/BP01/FND-BP-CR, SCUC (Sales Customer Create) alias CUCC/XD01, PSUC (Procurement Supplier Create) alias SUPC/XK01
 * All tables use neutral naming: partner_*, not ent_business_partner
 * No SAP-identical codes: BP role VENDOR/CUSTOMER/BOTH kept neutral, but field names own IP
 */

// Legal-safe enums – neutral, not SAP-specific
export const partnerRoleEnum = pgEnum('partner_role', ['VENDOR', 'CUSTOMER', 'BOTH', 'EMPLOYEE', 'CONTACT']);
export const partnerContactTypeEnum = pgEnum('partner_contact_type', ['PRIMARY', 'BILLING', 'SHIPPING', 'PURCHASING', 'SALES', 'TECHNICAL', 'FINANCE']);

// Partner Account – replaces ent_business_partner – central master with role VENDOR/CUSTOMER/BOTH
// Contextual views: partner_customer_profile (sales), partner_vendor_profile (procurement), partner_employee_link (HR)
export const partnerAccount = pgTable('partner_account', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountNumber: varchar('account_number', { length: 30 }).notNull().unique(), // was bp_number BP-V-10*, BP-C-20* – neutral account_number
  role: partnerRoleEnum('role').notNull(), // VENDOR/CUSTOMER/BOTH – neutral
  displayName: varchar('display_name', { length: 150 }).notNull(), // was name1 – neutral display_name
  legalName: varchar('legal_name', { length: 150 }), // was name2 – legal_name
  taxId: varchar('tax_id', { length: 50 }), // GSTIN, VAT ID, PAN
  gstNumber: varchar('gst_number', { length: 30 }), // India GST – new
  panNumber: varchar('pan_number', { length: 20 }), // India PAN – new
  email: varchar('email', { length: 150 }),
  phone: varchar('phone', { length: 30 }),
  alternatePhone: varchar('alternate_phone', { length: 30 }),
  website: varchar('website', { length: 150 }),
  addressLine1: varchar('address_line1', { length: 200 }),
  addressLine2: varchar('address_line2', { length: 200 }),
  city: varchar('city', { length: 100 }),
  region: varchar('region', { length: 100 }), // State
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 2 }).default('IN'),
  isBlocked: boolean('is_blocked').default(false).notNull(),
  isOneTime: boolean('is_one_time').default(false).notNull(), // one-time vendor/customer
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxRole: index('idx_partner_account_role').on(t.role),
  idxCity: index('idx_partner_account_city').on(t.city),
}));

// Partner Vendor Profile – replaces ent_bp_vendor_ext – procurement view
export const partnerVendorProfile = pgTable('partner_vendor_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  partnerId: uuid('partner_id').notNull().unique().references(() => partnerAccount.id),
  paymentTermsDays: integer('payment_terms_days').default(30),
  currencyCode: varchar('currency_code', { length: 3 }).default('INR'),
  reconciliationAccountId: uuid('reconciliation_account_id'), // FK to fin_ledger_account
  isQualityRelevant: boolean('is_quality_relevant').default(false), // was is_qm_relevant – legal-safe
  procurementDivisionId: uuid('procurement_division_id').references(() => orgProcurementDivision.id), // was purchasing_org
  buyerTeamId: uuid('buyer_team_id').references(() => orgBuyerTeam.id), // was purchasing_group
  taxClassification: varchar('tax_classification', { length: 20 }).default('TAXABLE'),
  incoterms: varchar('incoterms', { length: 20 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxProcDiv: index('idx_partner_vendor_proc_div').on(t.procurementDivisionId),
}));

// Partner Customer Profile – replaces ent_bp_customer_ext – sales view
export const partnerCustomerProfile = pgTable('partner_customer_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  partnerId: uuid('partner_id').notNull().unique().references(() => partnerAccount.id),
  paymentTermsDays: integer('payment_terms_days').default(0),
  currencyCode: varchar('currency_code', { length: 3 }).default('INR'),
  reconciliationAccountId: uuid('reconciliation_account_id'), // FK to fin_ledger_account
  commercialOrgId: uuid('commercial_org_id').references(() => orgCommercialOrg.id), // was sales_org
  salesChannelId: uuid('sales_channel_id').references(() => orgSalesChannel.id), // was distribution_channel
  productLineId: uuid('product_line_id').references(() => orgProductLine.id), // was division
  creditPolicyAreaId: uuid('credit_policy_area_id').references(() => finCreditPolicyArea.id), // was credit_control_area
  priceGroup: varchar('price_group', { length: 20 }),
  taxClassification: varchar('tax_classification', { length: 20 }).default('TAXABLE'),
  accountAssignmentGroup: varchar('account_assignment_group', { length: 20 }).default('01'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxCommercialOrg: index('idx_partner_customer_commercial').on(t.commercialOrgId),
}));

// Partner Contact – NEW – multiple contacts per partner
export const partnerContact = pgTable('partner_contact', {
  id: uuid('id').primaryKey().defaultRandom(),
  partnerId: uuid('partner_id').notNull().references(() => partnerAccount.id),
  contactType: partnerContactTypeEnum('contact_type').notNull().default('PRIMARY'),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  email: varchar('email', { length: 150 }),
  phone: varchar('phone', { length: 30 }),
  department: varchar('department', { length: 100 }),
  isPrimary: boolean('is_primary').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxPartner: index('idx_partner_contact_partner').on(t.partnerId),
  uniquePartnerPrimary: index('idx_partner_contact_primary').on(t.partnerId, t.isPrimary),
}));

// Partner Facility Assignment – NEW – which facilities this partner can supply to / deliver from
export const partnerFacilityAssign = pgTable('partner_facility_assign', {
  id: uuid('id').primaryKey().defaultRandom(),
  partnerId: uuid('partner_id').notNull().references(() => partnerAccount.id),
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id),
  isDefault: boolean('is_default').default(false).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (t) => ({
  uniquePartnerFacility: uniqueIndex('uq_partner_facility').on(t.partnerId, t.facilityId),
}));

// Relations – legal-safe
export const partnerAccountRelations = relations(partnerAccount, ({ one, many }) => ({
  vendorProfile: one(partnerVendorProfile, { fields: [partnerAccount.id], references: [partnerVendorProfile.partnerId] }),
  customerProfile: one(partnerCustomerProfile, { fields: [partnerAccount.id], references: [partnerCustomerProfile.partnerId] }),
  contacts: many(partnerContact),
  facilityAssigns: many(partnerFacilityAssign),
}));

export const partnerVendorProfileRelations = relations(partnerVendorProfile, ({ one }) => ({
  partner: one(partnerAccount, { fields: [partnerVendorProfile.partnerId], references: [partnerAccount.id] }),
  procurementDivision: one(orgProcurementDivision, { fields: [partnerVendorProfile.procurementDivisionId], references: [orgProcurementDivision.id] }),
  buyerTeam: one(orgBuyerTeam, { fields: [partnerVendorProfile.buyerTeamId], references: [orgBuyerTeam.id] }),
}));

export const partnerCustomerProfileRelations = relations(partnerCustomerProfile, ({ one }) => ({
  partner: one(partnerAccount, { fields: [partnerCustomerProfile.partnerId], references: [partnerAccount.id] }),
  commercialOrg: one(orgCommercialOrg, { fields: [partnerCustomerProfile.commercialOrgId], references: [orgCommercialOrg.id] }),
}));
