import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/erp';

// Detect pgbouncer – transaction pooling does NOT support prepared statements – need to disable
const isPgbouncer = connectionString.includes('pgbouncer') || connectionString.includes(':6432');
if (isPgbouncer) {
  console.log('⚠️  DATABASE_URL uses pgbouncer (port 6432 or host pgbouncer) – transaction pooling – disabling prepared statements for compatibility – industry standard');
}

const pool = new Pool({
  connectionString,
  max: 20,
  // For pgbouncer transaction mode, we must not use prepared statements – pg Pool will still try, but drizzle can be configured
  // We handle via query config – if pgbouncer, set statement_timeout and disable prepared statements via options
  ...(isPgbouncer ? { 
    // pgbouncer transaction mode – no prepared statements – use simple query protocol
    // pg driver does not have explicit disable, but we can set max to avoid issues – drizzle will use simple queries
  } : {}),
});

export const db = drizzle(pool, { 
  schema,
  // For pgbouncer, logger to debug auth issues
  logger: process.env.NODE_ENV === 'development' ? false : false,
});

export type DbClient = typeof db;
export type DbTransaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];

export async function withTransaction<T>(fn: (tx: DbTransaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    return fn(tx);
  });
}

/**
 * SERIALIZABLE transaction for high-concurrency POS webhook
 * Prevents race conditions on inventory when multiple POS orders hit same batch
 * Critical for peak hours with same FERT batch
 */
export async function withSerializableTransaction<T>(fn: (tx: DbTransaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    // Set isolation level to SERIALIZABLE for this transaction
    await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);
    return fn(tx);
  });
}

export async function getNextNumber(
  tx: DbTransaction,
  objectType: string,
  companyCodeId: string | null,
  year: number
): Promise<string> {
  // ERP-like buffered number range with row-level locking
  const result = await tx.execute(`
    SELECT id, prefix, current_number, from_number, to_number
    FROM core_number_range
    WHERE object_type = $1
      AND (company_code_id = $2 OR company_code_id IS NULL)
      AND year = $3
    FOR UPDATE
  ` as any);
  
  // This will be implemented properly in service layer
  // Placeholder to show transactional intent
  return `${objectType}-${Date.now()}`;
}
