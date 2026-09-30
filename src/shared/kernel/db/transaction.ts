/**
 * Transaction Helper – FTRB own IP – Foundation Transaction Rollback – NEW OWN CODE – alias LUW
 * Implements DB transaction with BEGIN/COMMIT/ROLLBACK for all postings – industry standard LUW
 * Ensures no partial postings – e.g., GR posts stock ledger + universal ledger + MAP recalc + PO update ELIKZ – all in one transaction – if one fails, rollback all – no partial – own IP
 * Usage: await withTransaction(async (tx) => { await tx.execute(...); await tx.execute(...); })
 * For large org with 1000s employees, critical – prevents inconsistent data
 */

import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export async function withTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
  // Use drizzle transaction if available, else manual BEGIN/COMMIT/ROLLBACK
  try {
    // Try to use db.transaction if exists
    if ((db as any).transaction) {
      return await (db as any).transaction(async (tx: any) => {
        return await fn(tx);
      });
    }
    
    // Manual transaction with BEGIN/COMMIT/ROLLBACK
    await db.execute(sql`BEGIN`);
    try {
      // Create a tx-like object that uses same db but within transaction
      const tx = {
        execute: async (query: any) => {
          return await db.execute(query);
        },
      };
      
      const result = await fn(tx);
      await db.execute(sql`COMMIT`);
      return result;
    } catch (e) {
      await db.execute(sql`ROLLBACK`);
      throw e;
    }
  } catch (e: any) {
    // If transaction fails, try rollback
    try {
      await db.execute(sql`ROLLBACK`);
    } catch {}
    throw e;
  }
}

// Helper for GR transaction – example
export async function withGRTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
  return withTransaction(fn);
}

// Helper for billing transaction
export async function withBillingTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
  return withTransaction(fn);
}

// Helper for payroll transaction
export async function withPayrollTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
  return withTransaction(fn);
}

// Helper for generic posting transaction
export async function withPostingTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
  return withTransaction(fn);
}
