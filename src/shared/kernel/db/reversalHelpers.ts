import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { getNextDocumentNumber, createDocumentEntry, updateDocumentWithAudit } from './documentHelpers';

/**
 * Reversal & Adjustment Helpers – Industry standard immutable accounting audit trail
 * Edit = Reversal or Adjustment document, not direct UPDATE – immutable audit trail
 * 
 * Standard function codes (MOOA 4-char):
 * PORE = Procurement Order Reversal (legacy ME21N reversal – own IP PPOC)
 * POAD = Procurement Order Adjustment (PO change after GR)
 * POCO = Procurement Order Correction
 * GRRE = Goods Receipt Reversal (legacy 102 reversal of 101 – own IP GR_PO_REV reversal of GR_PO)
 * GRAD = Goods Receipt Adjustment
 * GRCO = Goods Receipt Correction
 * IVRE = Invoice Verification Reversal (was MR8M)
 * IVAD = Invoice Verification Adjustment
 * SORE = Sales Order Reversal
 * SOAD = Sales Order Adjustment
 * DLRE = Delivery Reversal
 * DLAD = Delivery Adjustment
 * BLRE = Billing Reversal (was VF11)
 * BLAD = Billing Adjustment
 * PRRE = Purchase Requisition Reversal
 * PRAD = Purchase Requisition Adjustment
 * STOR = STO Reversal
 * STOA = STO Adjustment
 */

export type ReversalAction = 'REVERSE' | 'REVERSAL' | 'ADJUST' | 'ADJUSTMENT' | 'CORRECT' | 'CORRECTION';

export function getReversalDocType(originalType: string, action: ReversalAction): string {
  const upperAction = action.toUpperCase();
  const isReversal = upperAction.includes('REVERSE') || upperAction === 'REVERSE';
  const isAdjustment = upperAction.includes('ADJUST');
  const isCorrection = upperAction.includes('CORRECT');

  const typeMap: Record<string, { rev: string; adj: string; cor: string }> = {
    'PR': { rev: 'PRRE', adj: 'PRAD', cor: 'PRCO' },
    'PO': { rev: 'PORE', adj: 'POAD', cor: 'POCO' },
    'GR': { rev: 'GRRE', adj: 'GRAD', cor: 'GRCO' },
    'IV': { rev: 'IVRE', adj: 'IVAD', cor: 'IVCO' },
    'SO': { rev: 'SORE', adj: 'SOAD', cor: 'SOCO' },
    'DL': { rev: 'DLRE', adj: 'DLAD', cor: 'DLCO' },
    'BL': { rev: 'BLRE', adj: 'BLAD', cor: 'BLCO' },
    'STO': { rev: 'STOR', adj: 'STOA', cor: 'STOC' },
    'BOM': { rev: 'BMRE', adj: 'BMAD', cor: 'BMCO' },
    'PI': { rev: 'PIRE', adj: 'PIAD', cor: 'PICO' },
  };

  const mapping = typeMap[originalType.toUpperCase()] || { rev: `${originalType}RE`, adj: `${originalType}AD`, cor: `${originalType}CO` };
  
  if (isReversal) return mapping.rev;
  if (isAdjustment) return mapping.adj;
  if (isCorrection) return mapping.cor;
  return mapping.adj; // Default to adjustment
}

export function getReversalDescription(originalType: string, reversalType: string, originalNumber: string, reason?: string): string {
  const descriptions: Record<string, string> = {
    'PORE': `Procurement Order Reversal – Reverses ${originalNumber} – Legal-safe own IP (was PO reversal)`,
    'POAD': `Procurement Order Adjustment – Adjusts ${originalNumber} – Legal-safe own IP`,
    'POCO': `Procurement Order Correction – Corrects ${originalNumber}`,
    'GRRE': `Goods Receipt Reversal – Reverses ${originalNumber} – Legal-safe own IP (was MIGO 102 – own IP GRRE/GR_PO_REV)`,
    'GRAD': `Goods Receipt Adjustment – Adjusts ${originalNumber}`,
    'GRCO': `Goods Receipt Correction – Corrects ${originalNumber}`,
    'IVRE': `Invoice Verification Reversal – Reverses ${originalNumber} – Legal-safe own IP (was MR8M)`,
    'IVAD': `Invoice Verification Adjustment – Adjusts ${originalNumber}`,
    'SORE': `Sales Order Reversal – Reverses ${originalNumber}`,
    'SOAD': `Sales Order Adjustment – Adjusts ${originalNumber}`,
    'DLRE': `Delivery Reversal – Reverses ${originalNumber}`,
    'DLAD': `Delivery Adjustment – Adjusts ${originalNumber}`,
    'BLRE': `Billing Reversal – Reverses ${originalNumber} – Legal-safe own IP (was VF11)`,
    'BLAD': `Billing Adjustment – Adjusts ${originalNumber}`,
    'PRRE': `Purchase Requisition Reversal – Reverses ${originalNumber}`,
    'PRAD': `Purchase Requisition Adjustment – Adjusts ${originalNumber}`,
  };
  const base = descriptions[reversalType] || `${reversalType} – ${originalNumber}`;
  return reason ? `${base} – Reason: ${reason}` : base;
}

export async function createReversalOrAdjustmentDocument(params: {
  original_document_type: string;
  original_document_number: string;
  action: ReversalAction;
  reason?: string;
  new_payload?: any;
  company_code?: string;
  changed_by?: string;
}): Promise<{ success: boolean; reversal_document_number?: string; reversal_type?: string; error?: string }> {
  try {
    const reversalType = getReversalDocType(params.original_document_type, params.action);
    const isReversal = params.action.toUpperCase().includes('REVERSE');

    // Get next number for reversal type
    let reversalNumber: string;
    try {
      const next = await getNextDocumentNumber(reversalType, params.company_code || '1000');
      reversalNumber = next.document_number;
    } catch {
      reversalNumber = `${reversalType}-${Date.now()}`;
    }

    // Ensure number range exists for reversal type
    try {
      await db.execute(sql`
        INSERT INTO core_number_range (code, object_type, prefix, from_number, to_number, current_number)
        VALUES (${`${reversalType}-01`}, ${reversalType}::core_number_range_object_type, ${`${reversalType}-`}, 1000000000, 1999999999, 1000000000)
        ON CONFLICT (code) DO NOTHING
      `);
    } catch (e: any) {
      console.warn(`Failed to ensure range for ${reversalType}:`, e.message);
    }

    // Get original document
    let originalDoc: any = null;
    try {
      const origRes = await db.execute(sql`SELECT * FROM core_document WHERE document_number = ${params.original_document_number} LIMIT 1`);
      if (origRes.rows.length > 0) originalDoc = origRes.rows[0];
    } catch {}

    // Create reversal/adjustment document in core_document
    const reversalPayload = {
      original_document_type: params.original_document_type,
      original_document_number: params.original_document_number,
      action: params.action,
      reason: params.reason,
      is_reversal: isReversal,
      original_payload: originalDoc?.payload || null,
      new_payload: params.new_payload || null,
      reversal_type: reversalType,
      created_via: 'edit_as_reversal_adjustment',
      legal_safe: true,
      description: getReversalDescription(params.original_document_type, reversalType, params.original_document_number, params.reason)
    };

    await createDocumentEntry({
      document_type: reversalType,
      document_number: reversalNumber,
      company_code: params.company_code || '1000',
      fiscal_year: new Date().getFullYear().toString(),
      reference: params.original_document_number,
      created_by: params.changed_by || 'system',
      payload: reversalPayload
    });

    // Update original document status to REVERSED or ADJUSTED
    try {
      const newStatus = isReversal ? 'REVERSED' : 'ADJUSTED';
      await db.execute(sql`
        UPDATE core_document 
        SET status = ${newStatus}, 
            payload = jsonb_set(COALESCE(payload, '{}'::jsonb), '{reversal_document}', ${JSON.stringify(reversalNumber)}::jsonb),
            updated_at = NOW()
        WHERE document_number = ${params.original_document_number}
      `);

      // Create history entry for original document
      await updateDocumentWithAudit({
        document_number: params.original_document_number,
        new_payload: { ...originalDoc?.payload, status: newStatus, reversal_document: reversalNumber, last_action: params.action, reason: params.reason },
        changed_by: params.changed_by || 'system',
        action: isReversal ? 'REVERSED' : 'ADJUSTED'
      });
    } catch (e: any) {
      console.warn('Failed to update original doc status:', e.message);
    }

    // Also update the transactional table status if possible
    // This will be handled by caller for specific tables (po, gr, etc.)

    return {
      success: true,
      reversal_document_number: reversalNumber,
      reversal_type: reversalType
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getDocumentWithReversals(documentNumber: string) {
  try {
    const docRes = await db.execute(sql`SELECT * FROM core_document WHERE document_number = ${documentNumber} LIMIT 1`);
    if (docRes.rows.length === 0) return null;
    const doc = docRes.rows[0] as any;

    const reversalsRes = await db.execute(sql`
      SELECT * FROM core_document 
      WHERE reference = ${documentNumber} 
      AND document_type IN ('PORE', 'POAD', 'POCO', 'GRRE', 'GRAD', 'GRCO', 'IVRE', 'IVAD', 'SORE', 'SOAD', 'DLRE', 'DLAD', 'BLRE', 'BLAD', 'PRRE', 'PRAD', 'STOR', 'STOA')
      ORDER BY created_at DESC
    `);

    const historyRes = await db.execute(sql`
      SELECT * FROM core_document_history 
      WHERE document_number = ${documentNumber} OR document_number IN (SELECT document_number FROM core_document WHERE reference = ${documentNumber})
      ORDER BY changed_at DESC LIMIT 100
    `);

    return {
      document: doc,
      reversals: reversalsRes.rows,
      history: historyRes.rows
    };
  } catch (e: any) {
    console.warn('getDocumentWithReversals failed:', e.message);
    return null;
  }
}
