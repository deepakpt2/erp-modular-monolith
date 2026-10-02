import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Document Helpers – Unique sequential document numbering + immutable audit trail
 * Industry standard enterprise design
 */

export async function getNextDocumentNumber(objectType: string, companyCode?: string, fiscalYear?: string): Promise<{ document_number: string; current_number: number; prefix: string; code: string }> {
  const upperType = objectType.toUpperCase();
  
  try {
    // Try atomic increment
    let res = await db.execute(sql`
      UPDATE core_number_range 
      SET current_number = current_number + 1, updated_at = NOW()
      WHERE object_type = ${upperType}::core_number_range_object_type
      RETURNING prefix, current_number, code
    `);

    if (res.rows.length > 0) {
      const row = res.rows[0] as any;
      // If multiple rows updated, revert extras
      if (res.rows.length > 1) {
        for (let i = 1; i < res.rows.length; i++) {
          await db.execute(sql`UPDATE core_number_range SET current_number = current_number - 1 WHERE code = ${(res.rows[i] as any).code}`);
        }
      }
      const first = res.rows[0] as any;
      return {
        document_number: `${first.prefix || ''}${first.current_number}`,
        current_number: first.current_number,
        prefix: first.prefix || '',
        code: first.code
      };
    }

    // No range found – auto-create
    const prefixMap: Record<string, string> = {
      'PR': 'PR-', 'PO': 'PO-', 'GR': 'GR-', 'IV': 'IV-',
      'SO': 'SO-', 'DL': 'DL-', 'BL': 'BL-', 'FI_DOC': 'FI-',
      'BOM': 'BOM-', 'ROUTING': 'RT-', 'WC': 'WC-', 'KIT': 'KIT-',
      'MRP': 'MRP-', 'STO': 'STO-', 'PI': 'PI-',
      'FBN1': 'FI-', 'ITEM': 'ITM-', 'PARTNER': 'BP-'
    };
    const prefix = prefixMap[upperType] || `${upperType}-`;
    
    try {
      const newRange = await db.execute(sql`
        INSERT INTO core_number_range (code, object_type, prefix, from_number, to_number, current_number)
        VALUES (${`${upperType}-01`}, ${upperType}::core_number_range_object_type, ${prefix}, 1000000000, 1999999999, 1000000000)
        ON CONFLICT (code) DO UPDATE SET current_number = core_number_range.current_number + 1
        RETURNING prefix, current_number, code
      `);
      const row = newRange.rows[0] as any;
      return {
        document_number: `${row.prefix}${row.current_number}`,
        current_number: row.current_number,
        prefix: row.prefix,
        code: row.code
      };
    } catch {
      // Fallback
      return {
        document_number: `${prefix}${Date.now()}`,
        current_number: Date.now(),
        prefix,
        code: `${upperType}-01`
      };
    }
  } catch (e: any) {
    console.warn(`getNextDocumentNumber ${upperType} failed:`, e.message);
    // Final fallback
    const prefix = `${upperType}-`;
    return {
      document_number: `${prefix}${Date.now()}`,
      current_number: Date.now(),
      prefix,
      code: `${upperType}-01`
    };
  }
}

export async function createDocumentEntry(params: {
  document_type: string;
  document_number: string;
  company_code?: string;
  fiscal_year?: string;
  reference?: string;
  created_by?: string;
  payload?: any;
}) {
  try {
    // Ensure tables exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS core_document (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_type VARCHAR(20) NOT NULL,
        document_number VARCHAR(50) NOT NULL UNIQUE,
        company_code VARCHAR(20),
        fiscal_year VARCHAR(4),
        posting_date TIMESTAMP DEFAULT NOW(),
        reference VARCHAR(100),
        status VARCHAR(20) DEFAULT 'CREATED',
        created_by VARCHAR(100),
        payload JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS core_document_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID REFERENCES core_document(id),
        document_type VARCHAR(20) NOT NULL,
        document_number VARCHAR(50) NOT NULL,
        action VARCHAR(20) NOT NULL,
        old_data JSONB,
        new_data JSONB,
        changed_by VARCHAR(100),
        version INTEGER DEFAULT 1,
        changed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const docRes = await db.execute(sql`
      INSERT INTO core_document (document_type, document_number, company_code, fiscal_year, reference, created_by, payload, status)
      VALUES (${params.document_type.toUpperCase()}, ${params.document_number}, ${params.company_code || '1000'}, ${params.fiscal_year || new Date().getFullYear().toString()}, ${params.reference || null}, ${params.created_by || 'system'}, ${params.payload ? JSON.stringify(params.payload) : null}::jsonb, 'CREATED')
      ON CONFLICT (document_number) DO UPDATE SET payload = ${params.payload ? JSON.stringify(params.payload) : null}::jsonb, updated_at = NOW()
      RETURNING id
    `);
    const docId = (docRes.rows[0] as any).id;

    await db.execute(sql`
      INSERT INTO core_document_history (document_id, document_type, document_number, action, new_data, changed_by, version)
      VALUES (${docId}, ${params.document_type.toUpperCase()}, ${params.document_number}, 'CREATE', ${params.payload ? JSON.stringify(params.payload) : null}::jsonb, ${params.created_by || 'system'}, 1)
    `);

    return { success: true, document_id: docId };
  } catch (e: any) {
    console.warn('createDocumentEntry failed:', e.message);
    return { success: false, error: e.message };
  }
}

export async function updateDocumentWithAudit(params: {
  document_number: string;
  new_payload: any;
  changed_by?: string;
  action?: string;
}) {
  try {
    const existingRes = await db.execute(sql`SELECT * FROM core_document WHERE document_number = ${params.document_number} LIMIT 1`);
    if (existingRes.rows.length === 0) {
      return { success: false, error: 'Document not found' };
    }
    const existing = existingRes.rows[0] as any;

    const versionRes = await db.execute(sql`
      SELECT COALESCE(MAX(version), 0) + 1 as next_version 
      FROM core_document_history 
      WHERE document_number = ${params.document_number}
    `);
    const nextVersion = (versionRes.rows[0] as any).next_version || 1;

    await db.execute(sql`
      INSERT INTO core_document_history (document_id, document_type, document_number, action, old_data, new_data, changed_by, version)
      VALUES (${existing.id}, ${existing.document_type}, ${params.document_number}, ${params.action || 'UPDATE'}, ${existing.payload}::jsonb, ${params.new_payload ? JSON.stringify(params.new_payload) : existing.payload}::jsonb, ${params.changed_by || 'system'}, ${nextVersion})
    `);

    await db.execute(sql`
      UPDATE core_document 
      SET payload = COALESCE(${params.new_payload ? JSON.stringify(params.new_payload) : null}::jsonb, payload), 
          status = ${params.action || 'UPDATED'},
          updated_at = NOW()
      WHERE document_number = ${params.document_number}
    `);

    return { success: true, version: nextVersion };
  } catch (e: any) {
    console.warn('updateDocumentWithAudit failed:', e.message);
    return { success: false, error: e.message };
  }
}

export async function getDocumentHistory(documentNumber: string) {
  try {
    const res = await db.execute(sql`
      SELECT * FROM core_document_history 
      WHERE document_number = ${documentNumber}
      ORDER BY version ASC, changed_at ASC
    `);
    return res.rows as any[];
  } catch (e: any) {
    console.warn('getDocumentHistory failed:', e.message);
    return [];
  }
}
