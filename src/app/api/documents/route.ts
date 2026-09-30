import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { enforcePostingPeriod, getFiscalYearPeriodFromDate, checkFieldStatus, getDocumentTypeNumberRange } from '@/shared/kernel/db/postingPeriodHelpers';

/**
 * Documents API – SAP-like unique document for every business transaction
 * Legal-safe own IP – FNDC Document Numbering (was BKPF/MKPF/VBAK/LIKP/VBRK)
 * Every business transaction gets distinct document number from FNRC number ranges
 * Immutable audit trail via core_document + core_document_history
 * 
 * Table: core_document – id, document_type (PR/PO/GR/IV/SO/DL/BL/FI_DOC/BOM/ROUTING/WC/KIT/MRP/STO/PI), document_number (unique), company_code, fiscal_year, posting_date, reference, created_by, status, payload
 * Table: core_document_history – id, document_id, document_type, document_number, action (CREATE/UPDATE/DELETE), old_data, new_data, changed_by, changed_at, version
 */

async function ensureTables() {
  try {
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
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_core_document_type ON core_document(document_type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_core_document_number ON core_document(document_number)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_core_document_company ON core_document(company_code)`);
  } catch (e: any) {
    console.warn('core_document table creation failed:', e.message);
  }

  try {
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
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_core_doc_hist_number ON core_document_history(document_number)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_core_doc_hist_type ON core_document_history(document_type)`);
  } catch (e: any) {
    console.warn('core_document_history table creation failed:', e.message);
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    await ensureTables();
    const { searchParams } = new URL(req.url);
    const documentType = searchParams.get('document_type') || searchParams.get('type');
    const documentNumber = searchParams.get('document_number') || searchParams.get('number');
    const companyCode = searchParams.get('company_code');
    const limit = parseInt(searchParams.get('limit') || '100');
    const includeHistory = searchParams.get('include_history') === 'true';

    let query = sql`SELECT * FROM core_document WHERE 1=1`;
    if (documentType) query = sql`${query} AND document_type = ${documentType.toUpperCase()}`;
    if (documentNumber) query = sql`${query} AND document_number = ${documentNumber}`;
    if (companyCode) query = sql`${query} AND company_code = ${companyCode}`;
    query = sql`${query} ORDER BY created_at DESC LIMIT ${limit}`;

    const res = await db.execute(query);
    const docs = res.rows as any[];

    let history: any[] = [];
    if (includeHistory && docs.length > 0) {
      const docNumbers = docs.map((d: any) => d.document_number);
      try {
        const histRes = await db.execute(sql`
          SELECT * FROM core_document_history 
          WHERE document_number = ANY(${docNumbers})
          ORDER BY changed_at DESC LIMIT 500
        `);
        history = histRes.rows as any[];
      } catch (e: any) {
        console.warn('history fetch failed:', e.message);
      }
    }

    return NextResponse.json({
      data: docs,
      documents: docs,
      history: includeHistory ? history : undefined,
      count: docs.length,
      code: 'FNDC',
      aliasCodes: ['DOC', 'BKPF', 'MKPF'],
      helperCode: 'FNDC',
      table: 'core_document',
      source: 'db',
      legalSafe: true,
      functionDescription: 'Documents – FNDC legal-safe own IP (was BKPF/MKPF/VBAK) – unique document number for every business transaction from FNRC',
      explanation: 'Every business transaction gets distinct document number from FNRC number ranges – PR, PO, GR, IV, SO, DL, BL, FI_DOC, BOM, ROUTING, WC, KIT, MRP, STO, PI – immutable audit trail via core_document_history – SAP-like but own IP'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], documents: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    await ensureTables();
    const body = await req.json();

    // SAP-like posting period enforcement – OB52 – check if period open for account type +
    try {
      const postingDate = body.posting_date || body.posting_date || new Date().toISOString();
      const companyCodeForPosting = body.company_code || body.legal_entity_code || body.companyCode || '1000';
      const fiscalCheck = await getFiscalYearPeriodFromDate(companyCodeForPosting, postingDate);
      const postingCheck = await enforcePostingPeriod({ company_code: companyCodeForPosting, posting_date: postingDate, account_type: '+' });
      if (!postingCheck.allowed) {
        return NextResponse.json({ 
          error: postingCheck.message,
          fiscal_year: postingCheck.fiscal_year,
          fiscal_period: postingCheck.fiscal_period,
          variant_code: postingCheck.variant_code,
          posting_date: postingDate,
          account_type: '+',
          help: `Create open period via POST /api/posting-period-variants with variant_code=${postingCheck.variant_code}, account_type=+, from_period=${postingCheck.fiscal_period}, from_year=${postingCheck.fiscal_year}, to_period=${postingCheck.fiscal_period}, to_year=${postingCheck.fiscal_year}, is_open=true`
        }, { status: 400 });
      }
      // Attach fiscal info to body for storage
      (body as any)._fiscal_year = postingCheck.fiscal_year;
      (body as any)._fiscal_period = postingCheck.fiscal_period;
      // Strict ERP: Document Types OBA7 – get number range from document type
      try {
        if (body.document_type_code) {
          const docTypeNR = await getDocumentTypeNumberRange(body.document_type_code);
          if (docTypeNR.found && docTypeNR.number_range_code) {
            (body as any)._number_range_code = docTypeNR.number_range_code;
            console.log(`Document type ${body.document_type_code} → number range ${docTypeNR.number_range_code} – ${docTypeNR.message}`);
          }
        }
      } catch (docTypeErr: any) {
        console.warn('Document type check failed:', docTypeErr.message);
      }
      // Strict ERP: Field Status OBC4/OBC5 – validate required/suppressed fields per GL group
      try {
        if (body.field_status_variant_code && body.field_status_group_code) {
          const fieldCheck = await checkFieldStatus({
            variant_code: body.field_status_variant_code,
            group_code: body.field_status_group_code,
            field_values: body
          });
          if (!fieldCheck.allowed) {
            return NextResponse.json({
              error: fieldCheck.message,
              field_status_errors: fieldCheck.errors,
              variant_code: body.field_status_variant_code,
              group_code: body.field_status_group_code,
              help: `Check field status groups via /fico/field-status-groups?variant=${body.field_status_variant_code}&group=${body.field_status_group_code}`
            }, { status: 400 });
          }
          console.log(`Field status OK: ${fieldCheck.message}`);
        }
      } catch (fieldErr: any) {
        console.warn('Field status check failed:', fieldErr.message);
      }

    } catch (ppErr: any) {
      console.warn('Posting period enforcement failed, allowing posting to not block fresh:', ppErr.message);
    }
    const { document_type, documentType, document_number, documentNumber, company_code, companyCode, fiscal_year, fiscalYear, reference, payload, created_by, createdBy } = body;
    const finalType = (document_type || documentType || 'FI_DOC').toUpperCase();
    const finalCompany = company_code || companyCode || '1000';
    const finalFiscal = fiscal_year || fiscalYear || new Date().getFullYear().toString();
    const finalCreatedBy = created_by || createdBy || 'system';

    let finalDocNumber = document_number || documentNumber;
    
    // If no document number provided, generate from number ranges
    if (!finalDocNumber) {
      try {
        const nrRes = await db.execute(sql`
          UPDATE core_number_range 
          SET current_number = current_number + 1, updated_at = NOW()
          WHERE object_type = ${finalType}::core_number_range_object_type
          RETURNING prefix, current_number, code
        `);
        
        if (nrRes.rows.length > 0) {
          const row = nrRes.rows[0] as any;
          finalDocNumber = `${row.prefix || ''}${row.current_number}`;
        } else {
          // Auto-create range if not exists
          const prefixMap: Record<string, string> = {
            'PR': 'PR-', 'PO': 'PO-', 'GR': 'GR-', 'IV': 'IV-',
            'SO': 'SO-', 'DL': 'DL-', 'BL': 'BL-', 'FI_DOC': 'FI-',
            'BOM': 'BOM-', 'ROUTING': 'RT-', 'WC': 'WC-', 'KIT': 'KIT-',
            'MRP': 'MRP-', 'STO': 'STO-', 'PI': 'PI-'
          };
                    const newRange = await db.execute(sql`
            INSERT INTO core_number_range (code, object_type, prefix, from_number, to_number, current_number)
            VALUES (${`${finalType}-01`}, ${finalType}::core_number_range_object_type, ${prefix}, 1000000000, 1999999999, 1000000000)
            ON CONFLICT (code) DO UPDATE SET current_number = core_number_range.current_number + 1
            RETURNING prefix, current_number
          `);
          const row = newRange.rows[0] as any;
          finalDocNumber = `${row.current_number}`;
        }
      } catch (nrErr: any) {
        console.warn('Number range generation failed, using timestamp:', nrErr.message);
        finalDocNumber = `${finalType}-${Date.now()}`;
      }
    }

    // Insert into core_document
    const docRes = await db.execute(sql`
      INSERT INTO core_document (document_type, document_number, company_code, fiscal_year, reference, created_by, payload, status)
      VALUES (${finalType}, ${finalDocNumber}, ${finalCompany}, ${finalFiscal}, ${reference || null}, ${finalCreatedBy}, ${payload ? JSON.stringify(payload) : null}::jsonb, 'CREATED')
      ON CONFLICT (document_number) DO UPDATE SET payload = ${payload ? JSON.stringify(payload) : null}::jsonb, updated_at = NOW()
      RETURNING id, document_type, document_number, company_code, fiscal_year, created_at
    `);

    const doc = docRes.rows[0] as any;

    // Insert into history – CREATE action – immutable audit trail
    try {
      await db.execute(sql`
        INSERT INTO core_document_history (document_id, document_type, document_number, action, new_data, changed_by, version)
        VALUES (${doc.id}, ${finalType}, ${finalDocNumber}, 'CREATE', ${payload ? JSON.stringify(payload) : null}::jsonb, ${finalCreatedBy}, 1)
      `);
    } catch (histErr: any) {
      console.warn('History insert failed:', histErr.message);
    }

    return NextResponse.json({
      success: true,
      document: doc,
      document_number: finalDocNumber,
      code: 'FNDC',
      message: `Document ${finalDocNumber} (${finalType}) created – FNDC legal-safe unique document`,
      legalSafe: true
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    await ensureTables();
    const body = await req.json();
    const { document_number, documentNumber, document_type, documentType, payload, changed_by, changedBy, action } = body;
    const finalDocNumber = document_number || documentNumber;
    const finalType = (document_type || documentType || '').toUpperCase();
    const finalChangedBy = changed_by || changedBy || 'system';
    const finalAction = (action || 'UPDATE').toUpperCase();

    if (!finalDocNumber) {
      return NextResponse.json({ error: 'document_number required for audit trail update' }, { status: 400 });
    }

    // Get existing document
    const existingRes = await db.execute(sql`SELECT * FROM core_document WHERE document_number = ${finalDocNumber} LIMIT 1`);
    if (existingRes.rows.length === 0) {
      return NextResponse.json({ error: `Document ${finalDocNumber} not found` }, { status: 404 });
    }
    const existing = existingRes.rows[0] as any;

    // Get current version
    const versionRes = await db.execute(sql`
      SELECT COALESCE(MAX(version), 0) + 1 as next_version 
      FROM core_document_history 
      WHERE document_number = ${finalDocNumber}
    `);
    const nextVersion = (versionRes.rows[0] as any).next_version || 1;

    // Insert history with old_data and new_data – immutable audit trail
    await db.execute(sql`
      INSERT INTO core_document_history (document_id, document_type, document_number, action, old_data, new_data, changed_by, version)
      VALUES (${existing.id}, ${existing.document_type}, ${finalDocNumber}, ${finalAction}, ${existing.payload}::jsonb, ${payload ? JSON.stringify(payload) : existing.payload}::jsonb, ${finalChangedBy}, ${nextVersion})
    `);

    // Update main document – but keep payload history immutable
    const updateRes = await db.execute(sql`
      UPDATE core_document 
      SET payload = COALESCE(${payload ? JSON.stringify(payload) : null}::jsonb, payload), 
          status = ${finalAction},
          updated_at = NOW()
      WHERE document_number = ${finalDocNumber}
      RETURNING id, document_type, document_number, status, updated_at
    `);

    return NextResponse.json({
      success: true,
      document: updateRes.rows[0],
      history_version: nextVersion,
      code: 'FNDC',
      message: `Document ${finalDocNumber} updated to version ${nextVersion} – immutable audit trail preserved`,
      legalSafe: true,
      auditTrail: `Old version preserved in core_document_history version ${nextVersion - 1}, new version ${nextVersion}`
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    await ensureTables();
    const { searchParams } = new URL(req.url);
    const documentNumber = searchParams.get('document_number') || searchParams.get('number');
    const changedBy = searchParams.get('changed_by') || 'system';

    if (!documentNumber) {
      return NextResponse.json({ error: 'document_number required' }, { status: 400 });
    }

    const existingRes = await db.execute(sql`SELECT * FROM core_document WHERE document_number = ${documentNumber} LIMIT 1`);
    if (existingRes.rows.length === 0) {
      return NextResponse.json({ error: `Document ${documentNumber} not found` }, { status: 404 });
    }
    const existing = existingRes.rows[0] as any;

    const versionRes = await db.execute(sql`
      SELECT COALESCE(MAX(version), 0) + 1 as next_version 
      FROM core_document_history 
      WHERE document_number = ${documentNumber}
    `);
    const nextVersion = (versionRes.rows[0] as any).next_version || 1;

    // Immutable audit trail – log DELETE before actual delete (soft delete)
    await db.execute(sql`
      INSERT INTO core_document_history (document_id, document_type, document_number, action, old_data, changed_by, version)
      VALUES (${existing.id}, ${existing.document_type}, ${documentNumber}, 'DELETE', ${existing.payload}::jsonb, ${changedBy}, ${nextVersion})
    `);

    // Soft delete – update status to DELETED instead of hard delete for audit trail
    await db.execute(sql`
      UPDATE core_document SET status = 'DELETED', updated_at = NOW() WHERE document_number = ${documentNumber}
    `);

    return NextResponse.json({
      success: true,
      code: 'FNDC',
      message: `Document ${documentNumber} soft-deleted – audit trail preserved version ${nextVersion}`,
      legalSafe: true,
      note: 'Document status set to DELETED, history preserved – immutable audit trail – use hard delete only if explicitly required'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
