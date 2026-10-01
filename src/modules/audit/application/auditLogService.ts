/**
 * Audit Log Service - WORM-lite System-Wide Audit
 * Ensures old_data and new_data JSON payloads for critical state changes
 * Tables: fin_universal_ledger, inv_stock, pi_document, mm_purchase_order, etc
 */
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export interface AuditLogEntry {
  tableName: string;
  recordId: string;
  recordNumber?: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'POST' | 'REVERSE' | 'APPROVE' | 'REJECT';
  oldValues?: any;
  newValues?: any;
  changedFields?: string[];
  changedBy?: string;
  changedByEmail?: string;
  companyCodeId?: string;
  transactionId?: string;
  description?: string;
}

export class AuditLogService {
  /**
   * Log critical state change with old and new JSON payloads
   * WORM-lite: append-only, no updates/deletes on audit_log table
   */
  static async logChange(entry: AuditLogEntry) {
    try {
      const changedFields = entry.changedFields || this.calculateChangedFields(entry.oldValues, entry.newValues);

      await db.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, old_values, new_values, changed_fields, changed_by, changed_by_email, company_code_id, transaction_id, description, ip_address)
        VALUES (
          ${entry.tableName}, 
          ${entry.recordId}, 
          ${entry.recordNumber || null}, 
          ${entry.action}, 
          ${entry.oldValues ? JSON.stringify(entry.oldValues) : null}::jsonb, 
          ${entry.newValues ? JSON.stringify(entry.newValues) : null}::jsonb, 
          ${changedFields ? changedFields : null}, 
          ${entry.changedBy || null}, 
          ${entry.changedByEmail || null}, 
          ${entry.companyCodeId || null}, 
          ${entry.transactionId || null}, 
          ${entry.description || null},
          '127.0.0.1'
        )
      `);
    } catch (e) {
      console.warn('Audit log failed:', e);
      // Don't throw - audit failure shouldn't break transaction, but log warning
    }
  }

  static calculateChangedFields(oldValues: any, newValues: any): string[] {
    if (!oldValues || !newValues) return [];
    
    const oldKeys = Object.keys(oldValues);
    const newKeys = Object.keys(newValues);
    const allKeys = new Set([...oldKeys, ...newKeys]);
    
    const changed: string[] = [];
    for (const key of allKeys) {
      if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
        changed.push(key);
      }
    }
    return changed;
  }

  /**
   * Specific loggers for critical tables per requirement
   */

  static async logFiDocumentChange(
    oldDoc: any,
    newDoc: any,
    action: 'INSERT' | 'UPDATE' | 'POST' | 'REVERSE',
    userId: string,
    userEmail?: string
  ) {
    await this.logChange({
      tableName: 'fin_universal_ledger',
      recordId: newDoc.id || oldDoc.id,
      recordNumber: newDoc.document_number || oldDoc.document_number,
      action,
      oldValues: oldDoc,
      newValues: newDoc,
      changedBy: userId,
      changedByEmail: userEmail,
      companyCodeId: newDoc.company_code_id || oldDoc.company_code_id,
      transactionId: newDoc.id,
      description: `FI Document ${action}: ${newDoc.document_number || oldDoc.document_number} ${newDoc.doc_type || ''} ${newDoc.total_debit || ''} KWD`,
    });
  }

  static async logInvStockChange(
    oldStock: any,
    newStock: any,
    action: 'INSERT' | 'UPDATE',
    userId: string,
    movementType?: string
  ) {
    await this.logChange({
      tableName: 'inv_stock',
      recordId: newStock.id || oldStock.id,
      recordNumber: newStock.material_id || oldStock.material_id,
      action,
      oldValues: oldStock,
      newValues: newStock,
      changedBy: userId,
      companyCodeId: newStock.company_code_id,
      transactionId: newStock.id,
      description: `Stock ${action} ${movementType || ''}: Material ${newStock.material_id} Plant ${newStock.plant_id} SLoc ${newStock.sloc_id} Qty ${oldStock.quantity || 0} → ${newStock.quantity} Status ${newStock.stock_status}`,
    });
  }

  static async logPiDocumentChange(
    oldPi: any,
    newPi: any,
    action: 'INSERT' | 'UPDATE' | 'POST',
    userId: string
  ) {
    await this.logChange({
      tableName: 'pi_document',
      recordId: newPi.id || oldPi.id,
      recordNumber: newPi.pi_number || oldPi.pi_number,
      action,
      oldValues: oldPi,
      newValues: newPi,
      changedBy: userId,
      companyCodeId: newPi.company_code_id || oldPi.company_code_id,
      transactionId: newPi.id,
      description: `Physical Inventory ${action}: ${newPi.pi_number || oldPi.pi_number} Status ${oldPi.status || ''} → ${newPi.status || ''} Variance ${newPi.total_variance_qty || ''} Qty ${newPi.total_variance_value || ''} KWD`,
    });
  }

  static async logPurchaseOrderChange(
    oldPo: any,
    newPo: any,
    action: 'INSERT' | 'UPDATE' | 'POST' | 'APPROVE',
    userId: string
  ) {
    await this.logChange({
      tableName: 'mm_purchase_order',
      recordId: newPo.id || oldPo.id,
      recordNumber: newPo.po_number || oldPo.po_number,
      action,
      oldValues: oldPo,
      newValues: newPo,
      changedBy: userId,
      companyCodeId: newPo.company_code_id || oldPo.company_code_id,
      transactionId: newPo.id,
      description: `PO ${action}: ${newPo.po_number || oldPo.po_number} Status ${oldPo.status || ''} → ${newPo.status || ''} Total ${newPo.total_amount || ''} KWD Vendor ${newPo.vendor_id || ''}`,
    });
  }

  /**
   * Query audit logs with filters for admin UI
   */
  static async queryAuditLogs(params: {
    tableName?: string;
    recordId?: string;
    userId?: string;
    action?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    let query = sql`
      SELECT id, table_name, record_id, record_number, action, old_values, new_values, changed_fields, changed_by, changed_by_email, company_code_id, transaction_id, description, changed_at
      FROM audit_log
      WHERE 1=1
    `;

    if (params.tableName) {
      query = sql`${query} AND table_name = ${params.tableName}`;
    }
    if (params.recordId) {
      query = sql`${query} AND record_id = ${params.recordId}`;
    }
    if (params.userId) {
      query = sql`${query} AND changed_by = ${params.userId}`;
    }
    if (params.action) {
      query = sql`${query} AND action = ${params.action}`;
    }
    if (params.fromDate) {
      query = sql`${query} AND changed_at >= ${params.fromDate}`;
    }
    if (params.toDate) {
      query = sql`${query} AND changed_at <= ${params.toDate}`;
    }

    query = sql`${query} ORDER BY changed_at DESC LIMIT ${params.limit || 100} OFFSET ${params.offset || 0}`;

    const result = await db.execute(query);
    return result.rows;
  }

  /**
   * Mock audit logs for demo when DB not available
   */
  static getMockAuditLogs() {
    return Array.from({ length: 500 }, (_, i) => {
      const tables = ['fin_universal_ledger', 'inv_stock', 'pi_document', 'mm_purchase_order', 'mm_goods_receipt', 'sd_sales_order', 'hr_payroll_run'];
      const actions = ['INSERT', 'UPDATE', 'POST', 'APPROVE', 'REJECT'];
      const table = tables[i % tables.length];
      
      const oldData = table === 'fin_universal_ledger' 
        ? { status: 'DRAFT', total_debit: 0 }
        : table === 'inv_stock'
        ? { quantity: Math.floor(Math.random()*100), stock_status: 'UNRESTRICTED' }
        : table === 'mm_purchase_order'
        ? { status: 'DRAFT', total_amount: 0 }
        : { status: 'CREATED' };

      const newData = table === 'fin_universal_ledger'
        ? { status: 'POSTED', total_debit: (Math.random()*1000).toFixed(3), document_number: `FI${1000000000 + i}` }
        : table === 'inv_stock'
        ? { quantity: Math.floor(Math.random()*100), stock_status: 'UNRESTRICTED', material_id: `MAT-${1000000000 + i%8}` }
        : table === 'mm_purchase_order'
        ? { status: ['APPROVED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED'][i%3], total_amount: (Math.random()*1000).toFixed(3), po_number: `45${4500000000 + i}` }
        : { status: 'POSTED', pi_number: `PI${1000000000 + i}` };

      return {
        id: `audit-${i}`,
        table_name: table,
        record_id: `rec-${1000 + i}`,
        record_number: newData.document_number || newData.po_number || newData.pi_number || `REC-${1000 + i}`,
        action: actions[i % actions.length],
        old_values: oldData,
        new_values: newData,
        changed_fields: Object.keys(newData),
        changed_by: `user-${100 + i%12}`,
        changed_by_email: `user${100 + i%12}@erp.local`,
        company_code_id: '1000',
        transaction_id: `tx-${1000 + i}`,
        description: `${table} ${actions[i % actions.length]}: ${newData.document_number || newData.po_number || ''} Status ${oldData.status || ''} → ${newData.status || ''}`,
        changed_at: new Date(Date.now() - Math.random()*30*24*3600000),
      };
    });
  }
}
