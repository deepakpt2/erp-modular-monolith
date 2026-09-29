import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Document Types API – Legal-safe own IP – Module 4
 * New: fin_document_type (was ent_document_type) – code INV/BILL/PAY/JRNL/GR/GI/DN was KR/KG/KZ/RE/WE/WA/SA legacy, sample kept
 * Helper code: FDTC Document Type Create (alias DTC, OBA7, FIN-DT-CR) – 4-char MOOA F=Financials, DT=DocumentType, C=Create
 * Fallback to legacy ent_document_type
 */

export async function GET(req: NextRequest) {
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
      console.warn('fin_document_type not yet fallback ent_document_type:', newErr.message);
      source = 'db-legacy';
      table = 'ent_document_type';
      legalSafe = false;
      try {
        const res = await db.execute(sql`SELECT * FROM ent_document_type ORDER BY code`);
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
    const { code, name, description, number_range_code } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    try {
      const res = await db.execute(sql`
        INSERT INTO fin_document_type (code, name, description, number_range_code, legacy_code)
        VALUES (${code.toUpperCase()}, ${name}, ${description || null}, ${number_range_code || null}, ${code.toUpperCase()})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}, number_range_code = ${number_range_code || null}, updated_at = NOW()
        RETURNING id, code, name
      `);
      return NextResponse.json({ success: true, documentType: res.rows[0], code: 'FDTC', message: `Document type ${code.toUpperCase()} created – FDTC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('fin_document_type insert failed fallback ent_document_type:', newErr.message);
      const res = await db.execute(sql`
        INSERT INTO ent_document_type (code, name, description, number_range_code)
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
      if (id) res = await db.execute(sql`UPDATE ent_document_type SET name = COALESCE(${name}, name), description = COALESCE(${description}, description) WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE ent_document_type SET name = COALESCE(${name}, name), description = COALESCE(${description}, description) WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
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
      if (id) await db.execute(sql`DELETE FROM ent_document_type WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM ent_document_type WHERE code = ${code}`);
    }

    return NextResponse.json({ success: true, code: 'FDTC', message: `Document type ${code || id} deleted – FDTC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
