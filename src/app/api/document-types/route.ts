import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Document Types API – Legal-safe own IP – Module 4
 * New: fin_document_type (was fin_document_type) – code INV/BILL/PAY/JRNL/GR/GI/DN was KR/KG/KZ/RE/WE/WA/SA legacy, sample kept
 * Helper code: FDTC Document Type Create (alias DTC, OBA7, FIN-DT-CR) – 4-char MOOA F=Financials, DT=DocumentType, C=Create
 * Fallback to legacy fin_document_type
 */

async function ensureDocumentTypeSchema() {
  try {
    await db.execute(sql`ALTER TABLE fin_document_type ADD COLUMN IF NOT EXISTS number_range_code VARCHAR(50) DEFAULT '01'`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_document_type ADD COLUMN IF NOT EXISTS reverse_document_type VARCHAR(20)`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_document_type ADD COLUMN IF NOT EXISTS account_types_allowed VARCHAR(50) DEFAULT 'ALL'`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_document_type ADD COLUMN IF NOT EXISTS is_allowed_asset BOOLEAN DEFAULT true`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_document_type ADD COLUMN IF NOT EXISTS is_allowed_customer BOOLEAN DEFAULT true`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_document_type ADD COLUMN IF NOT EXISTS is_allowed_vendor BOOLEAN DEFAULT true`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_document_type ADD COLUMN IF NOT EXISTS is_allowed_material BOOLEAN DEFAULT true`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_document_type ADD COLUMN IF NOT EXISTS is_allowed_gl BOOLEAN DEFAULT true`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_document_type ADD COLUMN IF NOT EXISTS is_negative_posting_allowed BOOLEAN DEFAULT false`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_document_type ADD COLUMN IF NOT EXISTS reference_required BOOLEAN DEFAULT false`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_document_type ADD COLUMN IF NOT EXISTS doc_header_required BOOLEAN DEFAULT false`).catch(() => {});
  } catch (e: any) {
    console.warn('ensureDocumentTypeSchema error:', e.message);
  }
}

export async function GET(req: NextRequest) {
  await ensureDocumentTypeSchema();
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'fin_document_type';
    let legalSafe = true;

    try {
      const res = await db.execute(sql`SELECT * FROM fin_document_type ORDER BY code`);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('fin_document_type not yet fallback fin_document_type:', newErr.message);
      source = 'db-legacy';
      table = 'fin_document_type';
      legalSafe = false;
      try {
        const res = await db.execute(sql`SELECT * FROM fin_document_type ORDER BY code`);
        rows = res.rows as any[];
      } catch (e: any) {
        if (e.message?.includes('does not exist')) {
          return NextResponse.json({ data: [], documentTypes: [], count: 0, message: 'Table fin_document_type not yet migrated – fresh empty Module 4', code: 'FDTC', aliasCodes: ['DTC','OBA7'], helperCode: 'FDTC', table: 'fin_document_type', source: 'none', legalSafe: true });
        }
        throw e;
      }
    }

    return NextResponse.json({
      data: rows,
      documentTypes: rows,
      count: rows.length,
      code: 'FDTC',
      aliasCodes: ['DTC', 'OBA7', 'FIN-DT-CR'],
      helperCode: 'FDTC',
      table,
      source,
      legalSafe,
      functionDescription: 'Document Types – FDTC legal-safe own IP (was OBA7) – INV/BILL/PAY/JRNL/GR/GI/DN was KR/KG/KZ/RE/WE/WA/SA legacy, sample kept',
      erpDefaults: [
        { code: 'INV', name: 'Vendor Invoice – RE was KR/KR', legacy: 'RE/KR', helperCode: 'FDTC', note: 'Sample kept' },
        { code: 'BILL', name: 'Customer Invoice – RV', legacy: 'RV', helperCode: 'FDTC' },
        { code: 'PAY', name: 'Vendor Payment – KZ', legacy: 'KZ', helperCode: 'FDTC' },
        { code: 'JRNL', name: 'Journal Entry – SA', legacy: 'SA', helperCode: 'FDTC' },
        { code: 'GR', name: 'Goods Receipt – WE', legacy: 'WE', helperCode: 'FDTC' },
        { code: 'GI', name: 'Goods Issue – WA', legacy: 'WA', helperCode: 'FDTC' },
        { code: 'DN', name: 'Delivery Note – LF', legacy: 'LF', helperCode: 'FDTC' },
      ],
      explanation: 'Document types legal-safe fin_document_type – code INV/BILL/PAY/JRNL/GR/GI/DN was KR/KG/KZ/RE/WE/WA/SA legacy – Code FDTC primary alias DTC/OBA7 – 4-char MOOA F=Financials DT=DocumentType C=Create – module grouped intuitive – sample data kept for user convenience.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], documentTypes: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    await ensureDocumentTypeSchema();
    const {
      code,
      name,
      description,
      number_range_code = '01',
      reverse_document_type,
      is_allowed_asset = true,
      is_allowed_customer = true,
      is_allowed_vendor = true,
      is_allowed_material = true,
      is_allowed_gl = true,
      is_negative_posting_allowed = false,
      reference_required = false,
      doc_header_required = false
    } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    const docCode = code.toUpperCase().trim();
    const nrCode = (number_range_code || '01').toString().toUpperCase().trim();
    const revDoc = reverse_document_type ? reverse_document_type.toUpperCase().trim() : null;
    const allowAsset = is_allowed_asset === true || is_allowed_asset === 'true';
    const allowCust = is_allowed_customer === true || is_allowed_customer === 'true';
    const allowVend = is_allowed_vendor === true || is_allowed_vendor === 'true';
    const allowMat = is_allowed_material === true || is_allowed_material === 'true';
    const allowGl = is_allowed_gl === true || is_allowed_gl === 'true';
    const allowNeg = is_negative_posting_allowed === true || is_negative_posting_allowed === 'true';
    const reqRef = reference_required === true || reference_required === 'true';
    const reqHead = doc_header_required === true || doc_header_required === 'true';

    try {
      const checkExists = await db.execute(sql`SELECT id FROM fin_document_type WHERE UPPER(code) = ${docCode} LIMIT 1`);
      let res: any;
      if (checkExists.rows.length > 0) {
        const existId = (checkExists.rows[0] as any).id;
        res = await db.execute(sql`
          UPDATE fin_document_type SET
            name = ${name},
            description = ${description || null},
            number_range_code = ${nrCode},
            reverse_document_type = ${revDoc},
            is_allowed_asset = ${allowAsset},
            is_allowed_customer = ${allowCust},
            is_allowed_vendor = ${allowVend},
            is_allowed_material = ${allowMat},
            is_allowed_gl = ${allowGl},
            is_negative_posting_allowed = ${allowNeg},
            reference_required = ${reqRef},
            doc_header_required = ${reqHead},
            updated_at = NOW()
          WHERE id = ${existId}
          RETURNING *
        `);
      } else {
        res = await db.execute(sql`
          INSERT INTO fin_document_type (
            code, name, description, number_range_code, reverse_document_type,
            is_allowed_asset, is_allowed_customer, is_allowed_vendor, is_allowed_material, is_allowed_gl,
            is_negative_posting_allowed, reference_required, doc_header_required
          ) VALUES (
            ${docCode}, ${name}, ${description || null}, ${nrCode}, ${revDoc},
            ${allowAsset}, ${allowCust}, ${allowVend}, ${allowMat}, ${allowGl},
            ${allowNeg}, ${reqRef}, ${reqHead}
          )
          RETURNING *
        `);
      }
      return NextResponse.json({ success: true, documentType: res.rows[0], code: 'FDTC', message: `Document type ${docCode} saved successfully.`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('fin_document_type insert failed fallback fin_document_type:', newErr.message);
      const res = await db.execute(sql`
        INSERT INTO fin_document_type (code, name, description, number_range_code)
        VALUES (${code.toUpperCase()}, ${name}, ${description || null}, ${number_range_code || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}, number_range_code = ${number_range_code || null}
        RETURNING id, code, name
      `);
      return NextResponse.json({ success: true, documentType: res.rows[0], code: 'FDTC', message: `Document type ${code.toUpperCase()} created – OBA7 legacy (migrating to FDTC)`, legalSafe: false });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, code, name, description } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE fin_document_type SET name = COALESCE(${name}, name), description = COALESCE(${description}, description), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE fin_document_type SET name = COALESCE(${name}, name), description = COALESCE(${description}, description), updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) throw new Error('Not found in fin_document_type');
      return NextResponse.json({ success: true, documentType: res.rows[0], code: 'FDTC', message: `Document type ${res.rows[0].code} updated – FDTC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE fin_document_type SET name = COALESCE(${name}, name), description = COALESCE(${description}, description) WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE fin_document_type SET name = COALESCE(${name}, name), description = COALESCE(${description}, description) WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Document type not found' }, { status: 404 });
      return NextResponse.json({ success: true, documentType: res.rows[0], message: `Document type ${res.rows[0].code} updated – OBA7 legacy` });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code')?.toUpperCase();
    const id = searchParams.get('id');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM fin_document_type WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fin_document_type WHERE code = ${code}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM fin_document_type WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fin_document_type WHERE code = ${code}`);
    }

    return NextResponse.json({ success: true, code: 'FDTC', message: `Document type ${code || id} deleted – FDTC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
