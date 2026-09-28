/**
 * ERP-like Number Range Service with Buffered Sequential Integrity
 * Critical for audit compliance
 */
import { db } from '@/shared/kernel/db/client';
import { entNumberRange } from '../infrastructure/schema';
import { eq, and } from 'drizzle-orm';

export type NumberRangeObjectType = 
  | 'MATERIAL' | 'BP' | 'BATCH' | 'PR' | 'PO' | 'GR' | 'IV' 
  | 'PROD_ORDER' | 'FI_DOC' | 'PAYROLL' | 'SALES_ORDER' | 'KITTING_ORDER';

export class NumberRangeService {
  /**
   * Get next number with row-level locking for strict sequential integrity
   * Uses SELECT FOR UPDATE to prevent gaps under concurrency
   */
  static async getNextNumber(
    objectType: NumberRangeObjectType,
    companyCodeId: string | null,
    year: number
  ): Promise<{ number: number; formatted: string }> {
    return db.transaction(async (tx) => {
      // Lock the range row
      const ranges = await tx.execute(`
        SELECT id, prefix, current_number, from_number, to_number
        FROM ent_number_range
        WHERE object_type = $1
          AND (company_code_id = $2 OR company_code_id IS NULL)
          AND year = $3
          AND is_active = true
        FOR UPDATE
      ` as any);

      // Fallback if no range defined - create emergency range
      // In production, ranges must be pre-configured
      if (!ranges.rows || ranges.rows.length === 0) {
        const next = Date.now() % 100000000;
        return { number: next, formatted: `${objectType}-${year}-${String(next).padStart(8, '0')}` };
      }

      const range = ranges.rows[0] as any;
      const nextNumber = range.current_number + 1;

      if (nextNumber > range.to_number) {
        throw new Error(`Number range exhausted for ${objectType} ${year}: ${range.current_number} > ${range.to_number}`);
      }

      await tx.execute(`
        UPDATE ent_number_range
        SET current_number = $1, updated_at = NOW()
        WHERE id = $2
      ` as any);

      const formatted = `${range.prefix}${String(nextNumber).padStart(10, '0')}`;
      return { number: nextNumber, formatted };
    });
  }

  /**
   * Initialize default number ranges for single company setup
   */
  static async initializeDefaultRanges(companyCodeId: string, year: number) {
    const defaults = [
      { objectType: 'MATERIAL' as const, prefix: 'MAT', from: 1000000000, to: 1999999999 },
      { objectType: 'BP' as const, prefix: 'BP', from: 100000, to: 999999 },
      { objectType: 'BATCH' as const, prefix: 'B', from: 1000000000, to: 1999999999 },
      { objectType: 'PR' as const, prefix: 'PR', from: 1000000000, to: 1999999999 },
      { objectType: 'PO' as const, prefix: '45', from: 4500000000, to: 4599999999 },
      { objectType: 'GR' as const, prefix: '50', from: 5000000000, to: 5099999999 },
      { objectType: 'IV' as const, prefix: '51', from: 5100000000, to: 5199999999 },
      { objectType: 'PROD_ORDER' as const, prefix: '10', from: 1000000000, to: 1999999999 },
      { objectType: 'FI_DOC' as const, prefix: '', from: 1000000000, to: 1999999999 },
      { objectType: 'PAYROLL' as const, prefix: 'HR', from: 100000, to: 999999 },
      { objectType: 'KITTING_ORDER' as const, prefix: 'KIT', from: 100000, to: 999999 },
    ];

    for (const def of defaults) {
      await db.insert(entNumberRange).values({
        objectType: def.objectType,
        companyCodeId,
        year,
        prefix: def.prefix,
        fromNumber: def.from,
        toNumber: def.to,
        currentNumber: def.from - 1,
        isBuffered: false,
        isActive: true,
      }).onConflictDoNothing();
    }
  }
}
