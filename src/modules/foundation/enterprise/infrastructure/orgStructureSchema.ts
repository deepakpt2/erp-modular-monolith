import { pgTable, varchar, boolean, timestamp, uuid, text, integer, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';

/**
 * Module 1 – Legal-Safe Enterprise Structure
 * Fresh empty – no SAP-identical names
 * Helper codes kept: OX15, OX02, OX10, OX09, OX08, OME4, OVX2, OVX1, KS01, OB45, OB29, OBBO etc
 * New auto-generated codes: ORG-CG-01, ORG-MC-01, ORG-PU-01, ORG-BS-01, ORG-WH-01, ORG-DP-01, ORG-PL-01
 * All tables use neutral naming: core_*, org_*, fin_*
 */

// Enums – neutral values, no SAP codes like ROH/FERT
export const locationTypeEnum = pgEnum('org_location_type', ['PRIMARY', 'COLD_ZONE', 'SHOP_FLOOR', 'RETURNS', 'QUALITY', 'BLOCKED', 'RAW_ZONE', 'FINISHED_ZONE', 'PACK_ZONE']);
export const zoneTypeEnum = pgEnum('org_zone_type', ['BULK', 'PICK', 'COLD', 'QC', 'RETURNS', 'PACK', 'STAGING']);
export const loadingGroupEnum = pgEnum('org_loading_group', ['MANUAL', 'FORKLIFT', 'CRANE', 'CONVEYOR']);

// Core Tenant – replaces ent_client (SAP T000)
export const coreTenant = pgTable('core_tenant', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(), // e.g., TEN-100, not 100
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Company Group – umbrella holding (NEW, was logical Company OX15)
// Extended with currency_code, country_code, language per real implementation guide – Title/Code/Data copyable
export const orgCompanyGroup = pgTable('org_company_group', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => coreTenant.id),
  code: varchar('code', { length: 20 }).notNull(), // e.g., CG-1000, not OX15 internal
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  currencyCode: varchar('currency_code', { length: 3 }).default('INR'), // Added per guide – ECGC needs currency INR
  countryCode: varchar('country_code', { length: 2 }).default('IN'), // Added – IN
  country: varchar('country', { length: 2 }).default('IN'), // alias for country_code
  language: varchar('language', { length: 10 }).default('EN'), // Added – EN per OB13 language requirement
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueTenantCode: uniqueIndex('uq_org_company_group_tenant_code').on(t.tenantId, t.code),
}));

// Legal Entity – replaces ent_company_code (SAP T001, OX02)
// Extended per real guide – needs chart_of_accounts_code, fiscal_year_variant, field_status_variant, posting_period_variant, credit_control_area
export const orgLegalEntity = pgTable('org_legal_entity', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => coreTenant.id),
  companyGroupId: uuid('company_group_id').references(() => orgCompanyGroup.id),
  code: varchar('code', { length: 20 }).notNull(), // e.g., LE-1000, not 1000 but keep compatibility
  name: varchar('name', { length: 100 }).notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull().default('INR'), // FK to core_currency kept as varchar for sample data
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 2 }).default('IN'),
  countryCode: varchar('country_code', { length: 2 }).default('IN'), // alias per guide
  address: text('address'),
  street: varchar('street', { length: 200 }),
  postalCode: varchar('postal_code', { length: 20 }),
  region: varchar('region', { length: 100 }),
  taxId: varchar('tax_id', { length: 50 }),
  gstNumber: varchar('gst_number', { length: 30 }),
  pan: varchar('pan', { length: 20 }),
  cin: varchar('cin', { length: 30 }),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 100 }),
  website: varchar('website', { length: 100 }),
  legalForm: varchar('legal_form', { length: 50 }),
  registrationNumber: varchar('registration_number', { length: 50 }),
  fiscalCalendarCode: varchar('fiscal_calendar_code', { length: 20 }).default('K4'),
  fiscalYearVariant: varchar('fiscal_year_variant', { length: 20 }).default('K4'), // alias per guide – K4
  chartOfAccountsCode: varchar('chart_of_accounts_code', { length: 20 }).default('CA-IN-01'), // per guide – CA-IN-01
  fieldStatusVariant: varchar('field_status_variant', { length: 20 }).default('FSSV-1000'), // per guide – FSSV-1000
  postingPeriodVariant: varchar('posting_period_variant', { length: 20 }).default('PPV-1000'), // per guide – PPV-1000
  creditControlArea: varchar('credit_control_area', { length: 20 }).default('CRED-1000'), // per guide – CRED-1000 / CPA-1000
  creditPolicyAreaCode: varchar('credit_policy_area_code', { length: 20 }).default('CRED-1000'), // alias for credit_control_area – FCPC OB45
  language: varchar('language', { length: 10 }).default('EN'), // EN per guide
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueTenantCode: uniqueIndex('uq_org_legal_entity_tenant_code').on(t.tenantId, t.code),
  idxCompanyGroup: index('idx_org_legal_entity_group').on(t.companyGroupId),
}));

// Management Control Area – replaces Controlling Area (SAP TKA01, NEW OX06)
export const orgMgmtControlArea = pgTable('org_mgmt_control_area', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => coreTenant.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull().default('INR'),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueTenantCode: uniqueIndex('uq_org_control_area_tenant_code').on(t.tenantId, t.code),
}));

// Assignment: Legal Entity ↔ Control Area (1:1 enforced)
export const orgLegalEntityControlAreaAssign = pgTable('org_legal_entity_control_area_assign', {
  id: uuid('id').primaryKey().defaultRandom(),
  legalEntityId: uuid('legal_entity_id').notNull().unique().references(() => orgLegalEntity.id),
  controlAreaId: uuid('control_area_id').notNull().references(() => orgMgmtControlArea.id),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  assignedBy: uuid('assigned_by'),
}, (t) => ({
  uniqueControlArea: index('idx_org_le_ca_control').on(t.controlAreaId),
}));

// Facility – replaces ent_plant (SAP T001W, OX10)
export const orgFacility = pgTable('org_facility', {
  id: uuid('id').primaryKey().defaultRandom(),
  legalEntityId: uuid('legal_entity_id').notNull().references(() => orgLegalEntity.id),
  code: varchar('code', { length: 20 }).notNull().unique(), // e.g., FAC-1000
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 2 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  idxLegalEntity: index('idx_org_facility_legal').on(t.legalEntityId),
}));

// Inventory Location – replaces ent_storage_location (SAP T001L, OX09)
export const orgInventoryLocation = pgTable('org_inventory_location', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  locationType: locationTypeEnum('location_type').notNull().default('PRIMARY'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueFacilityCode: uniqueIndex('uq_org_inv_loc_facility_code').on(t.facilityId, t.code),
}));

// Procurement Division – NEW master for Purchasing Organization (SAP T024E, OX08)
export const orgProcurementDivision = pgTable('org_procurement_division', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => coreTenant.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueTenantCode: uniqueIndex('uq_org_proc_div_tenant_code').on(t.tenantId, t.code),
}));

// Procurement Division ↔ Legal Entity assign
export const orgProcDivLegalAssign = pgTable('org_proc_div_legal_assign', {
  id: uuid('id').primaryKey().defaultRandom(),
  procurementDivisionId: uuid('procurement_division_id').notNull().references(() => orgProcurementDivision.id),
  legalEntityId: uuid('legal_entity_id').notNull().references(() => orgLegalEntity.id),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (t) => ({
  uniqueCombo: uniqueIndex('uq_org_proc_div_legal').on(t.procurementDivisionId, t.legalEntityId),
}));

// Procurement Division ↔ Facility assign
export const orgProcDivFacilityAssign = pgTable('org_proc_div_facility_assign', {
  id: uuid('id').primaryKey().defaultRandom(),
  procurementDivisionId: uuid('procurement_division_id').notNull().references(() => orgProcurementDivision.id),
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (t) => ({
  uniqueCombo: uniqueIndex('uq_org_proc_div_facility').on(t.procurementDivisionId, t.facilityId),
}));

// Buyer Team – NEW master for Purchasing Group (SAP T024, OME4)
export const orgBuyerTeam = pgTable('org_buyer_team', {
  id: uuid('id').primaryKey().defaultRandom(),
  procurementDivisionId: uuid('procurement_division_id').notNull().references(() => orgProcurementDivision.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }),
  phone: varchar('phone', { length: 30 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueDivCode: uniqueIndex('uq_org_buyer_team_div_code').on(t.procurementDivisionId, t.code),
}));

// Commercial Org – NEW master for Sales Organization (SAP TVKO, OVX2)
export const orgCommercialOrg = pgTable('org_commercial_org', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => coreTenant.id),
  legalEntityId: uuid('legal_entity_id').notNull().references(() => orgLegalEntity.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull().default('INR'),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueTenantCode: uniqueIndex('uq_org_commercial_org_tenant_code').on(t.tenantId, t.code),
}));

// Sales Channel – NEW for Distribution Channel (SAP TVTW, OVX1)
export const orgSalesChannel = pgTable('org_sales_channel', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => coreTenant.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueTenantCode: uniqueIndex('uq_org_sales_channel_tenant_code').on(t.tenantId, t.code),
}));

// Product Line – NEW for Division (SAP TSPA, ORG-PL-01)
export const orgProductLine = pgTable('org_product_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => coreTenant.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueTenantCode: uniqueIndex('uq_org_product_line_tenant_code').on(t.tenantId, t.code),
}));

// Commercial Org ↔ Sales Channel ↔ Product Line assignment (combined)
export const orgCommercialAssign = pgTable('org_commercial_assign', {
  id: uuid('id').primaryKey().defaultRandom(),
  commercialOrgId: uuid('commercial_org_id').notNull().references(() => orgCommercialOrg.id),
  salesChannelId: uuid('sales_channel_id').notNull().references(() => orgSalesChannel.id),
  productLineId: uuid('product_line_id').notNull().references(() => orgProductLine.id),
  isActive: boolean('is_active').default(true).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (t) => ({
  uniqueCombo: uniqueIndex('uq_org_commercial_assign').on(t.commercialOrgId, t.salesChannelId, t.productLineId),
}));

// Profit Unit – NEW for Profit Center (SAP CEPC, ORG-PU-01 / KE51)
export const orgProfitUnit = pgTable('org_profit_unit', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => coreTenant.id),
  legalEntityId: uuid('legal_entity_id').notNull().references(() => orgLegalEntity.id),
  controlAreaId: uuid('control_area_id').notNull().references(() => orgMgmtControlArea.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  responsibleId: uuid('responsible_id'),
  validFrom: timestamp('valid_from').defaultNow().notNull(),
  validTo: timestamp('valid_to'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueControlAreaCode: uniqueIndex('uq_org_profit_unit_ca_code').on(t.controlAreaId, t.code),
}));

// Cost Unit – renamed from Cost Center (SAP CSKS, KS01)
export const orgCostUnit = pgTable('org_cost_unit', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => coreTenant.id),
  legalEntityId: uuid('legal_entity_id').notNull().references(() => orgLegalEntity.id),
  controlAreaId: uuid('control_area_id').notNull().references(() => orgMgmtControlArea.id),
  parentId: uuid('parent_id').references((): any => orgCostUnit.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  responsibleId: uuid('responsible_id'),
  validFrom: timestamp('valid_from').defaultNow().notNull(),
  validTo: timestamp('valid_to'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueControlAreaCode: uniqueIndex('uq_org_cost_unit_ca_code').on(t.controlAreaId, t.code),
  idxLegalEntity: index('idx_org_cost_unit_legal').on(t.legalEntityId),
  idxParent: index('idx_org_cost_unit_parent').on(t.parentId),
}));

// Business Segment – NEW for Business Area (SAP TGSB, ORG-BS-01)
export const orgBusinessSegment = pgTable('org_business_segment', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => coreTenant.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueTenantCode: uniqueIndex('uq_org_business_segment_tenant_code').on(t.tenantId, t.code),
}));

// Warehouse Site – NEW for Warehouse Number (SAP T300, ORG-WH-01)
export const orgWarehouseSite = pgTable('org_warehouse_site', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueFacilityCode: uniqueIndex('uq_org_warehouse_site_facility_code').on(t.facilityId, t.code),
}));

// Warehouse Zone
export const orgWarehouseZone = pgTable('org_warehouse_zone', {
  id: uuid('id').primaryKey().defaultRandom(),
  warehouseSiteId: uuid('warehouse_site_id').notNull().references(() => orgWarehouseSite.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  zoneType: zoneTypeEnum('zone_type').notNull().default('BULK'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueSiteCode: uniqueIndex('uq_org_warehouse_zone_site_code').on(t.warehouseSiteId, t.code),
}));

// Warehouse Bin
export const orgWarehouseBin = pgTable('org_warehouse_bin', {
  id: uuid('id').primaryKey().defaultRandom(),
  zoneId: uuid('zone_id').notNull().references(() => orgWarehouseZone.id),
  code: varchar('code', { length: 20 }).notNull(),
  aisle: varchar('aisle', { length: 10 }),
  rack: varchar('rack', { length: 10 }),
  level: varchar('level', { length: 10 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueZoneCode: uniqueIndex('uq_org_warehouse_bin_zone_code').on(t.zoneId, t.code),
}));

// Inventory Location ↔ Warehouse Site assignment
export const orgInventoryWarehouseAssign = pgTable('org_inventory_warehouse_assign', {
  id: uuid('id').primaryKey().defaultRandom(),
  inventoryLocationId: uuid('inventory_location_id').notNull().references(() => orgInventoryLocation.id),
  warehouseSiteId: uuid('warehouse_site_id').notNull().references(() => orgWarehouseSite.id),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (t) => ({
  uniqueCombo: uniqueIndex('uq_org_inv_wh_assign').on(t.inventoryLocationId, t.warehouseSiteId),
}));

// Dispatch Point – NEW for Shipping Point (SAP TVST, ORG-DP-01)
export const orgDispatchPoint = pgTable('org_dispatch_point', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  loadingGroup: loadingGroupEnum('loading_group').notNull().default('FORKLIFT'),
  route: varchar('route', { length: 20 }),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  uniqueFacilityCode: uniqueIndex('uq_org_dispatch_point_facility_code').on(t.facilityId, t.code),
}));

// Dispatch Determination
export const orgDispatchDetermination = pgTable('org_dispatch_determination', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').notNull().references(() => orgFacility.id),
  salesChannelId: uuid('sales_channel_id').references(() => orgSalesChannel.id),
  loadingGroup: loadingGroupEnum('loading_group').notNull().default('FORKLIFT'),
  dispatchPointId: uuid('dispatch_point_id').notNull().references(() => orgDispatchPoint.id),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueFacilityChannelGroup: uniqueIndex('uq_org_dispatch_determination').on(t.facilityId, t.salesChannelId, t.loadingGroup),
}));

// Credit Policy Area – renamed from ent_credit_control_area (OB45)
export const finCreditPolicyArea = pgTable('fin_credit_policy_area', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => coreTenant.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull().default('INR'),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueTenantCode: uniqueIndex('uq_fin_credit_policy_tenant_code').on(t.tenantId, t.code),
}));

// Legal Entity ↔ Credit Policy Area assign (was ent_credit_control_assignment, OB38)
export const finLegalEntityCreditAssign = pgTable('fin_legal_entity_credit_assign', {
  id: uuid('id').primaryKey().defaultRandom(),
  legalEntityId: uuid('legal_entity_id').notNull().references(() => orgLegalEntity.id),
  creditPolicyAreaId: uuid('credit_policy_area_id').notNull().references(() => finCreditPolicyArea.id),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (t) => ({
  uniqueCombo: uniqueIndex('uq_fin_legal_credit_assign').on(t.legalEntityId, t.creditPolicyAreaId),
}));

// Fiscal Calendar – renamed from ent_fiscal_year_variant (OB29)
export const finFiscalCalendar = pgTable('fin_fiscal_calendar', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => coreTenant.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  yearDependent: boolean('year_dependent').default(false).notNull(),
  calendarYear: boolean('calendar_year').default(false).notNull(),
  numberOfPeriods: integer('number_of_periods').default(12).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueTenantCode: uniqueIndex('uq_fin_fiscal_calendar_tenant_code').on(t.tenantId, t.code),
}));

// Posting Calendar – renamed from ent_posting_period_variant (OBBO)
export const finPostingCalendar = pgTable('fin_posting_calendar', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => coreTenant.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueTenantCode: uniqueIndex('uq_fin_posting_calendar_tenant_code').on(t.tenantId, t.code),
}));
