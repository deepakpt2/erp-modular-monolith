import { pgTable, varchar, timestamp, uuid, numeric, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { entCompanyCode } from './schema';

export const entExchangeRate = pgTable('core_exchange_rate', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromCurrency: varchar('from_currency', { length: 3 }).notNull(), // KWD, USD, INR, EUR
  toCurrency: varchar('to_currency', { length: 3 }).notNull(), // KWD, INR, etc
  validFrom: timestamp('valid_from').notNull(), // Rate valid from this date
  rate: numeric('rate', { precision: 15, scale: 6 }).notNull(), // e.g., 1 KWD = 270 INR => rate 270.000000
  rateType: varchar('rate_type', { length: 10 }).default('M').notNull(), // M=Average, B=Bank buying, G=Bank selling
  companyCodeId: uuid('company_code_id').references(() => entCompanyCode.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniqueRate: uniqueIndex('uq_exchange_rate').on(t.fromCurrency, t.toCurrency, t.validFrom, t.rateType),
  idxFromTo: index('idx_exchange_from_to').on(t.fromCurrency, t.toCurrency),
  idxValidFrom: index('idx_exchange_valid_from').on(t.validFrom),
}));
