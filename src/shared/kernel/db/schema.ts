// SINGLE SOURCE OF TRUTH - All module schemas merged here
// This is the key to Modular Monolith with shared PostgreSQL

export * from '../../../modules/foundation/enterprise/infrastructure/schema';
export * from '../../../modules/foundation/enterprise/infrastructure/enterpriseConfigSchema';
export * from '../../../modules/foundation/enterprise/infrastructure/orgStructureSchema';
export * from '../../../modules/foundation/enterprise/infrastructure/productCatalogSchema';
export * from '../../../modules/foundation/enterprise/infrastructure/partnerAccountSchema';
export * from '../../../modules/foundation/enterprise/infrastructure/financialsFoundationSchema';
export * from '../../../modules/fico/infrastructure/financialsDeepDiveSchema';
export * from '../../../modules/mm/infrastructure/procurementFoundationSchema';
export * from '../../../modules/pp/infrastructure/manufacturingFoundationSchema';
export * from '../../../modules/sd/infrastructure/salesFoundationSchema';
export * from '../../../modules/foundation/enterprise/infrastructure/jobQueueSchema';
export * from '../../../modules/foundation/enterprise/infrastructure/exchangeRateSchema';
export * from '../../../modules/foundation/number-range/infrastructure/schema';
export * from '../../../modules/foundation/inventory-state/infrastructure/schema';
export * from '../../../modules/foundation/dms/infrastructure/schema';
export * from '../../../modules/foundation/workflow/infrastructure/schema';
export * from '../../../modules/hr/infrastructure/schema';
export * from '../../../modules/fico/infrastructure/schema';
export * from '../../../modules/audit/infrastructure/schema';
export * from '../../../modules/mm/infrastructure/schema';
export * from '../../../modules/pp/infrastructure/schema';
export * from '../../../modules/sd/infrastructure/schema';
export * from '../../../modules/foundation/inventory-state/infrastructure/physicalInventorySchema';
export * from '../../../modules/pp/infrastructure/costingSchema';

// Auth.js tables (NextAuth v5)
import { pgTable, varchar, timestamp, uuid, text, boolean, primaryKey } from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

export const users = pgTable('auth_user', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  passwordHash: text('password_hash'), // For email/password auth
  role: varchar('role', { length: 30 }).notNull().default('USER'), // ADMIN, PURCHASER, WAREHOUSE, PRODUCTION, FINANCE, OWNER, AUDITOR
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const accounts = pgTable('auth_account', {
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<AdapterAccountType>().notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: timestamp('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
}));

export const sessions = pgTable('auth_session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable('auth_verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));
