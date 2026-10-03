import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Document Types API – Standard Industry Accounting Configuration (T003 / OBA7)
 * Defines financial document types (SA, KR, KZ, DR, DZ, RE, WA, WE),
 * assigned number range intervals, account types allowed, and statutory controls.
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const res = await db.execute(sql`SELECT * FROM fin_document_type ORDER BY code`);
    const rows = res.rows as any[];

    return NextResponse.json({
      data: rows,
      documentTypes: rows,
      count: rows.length,
      code: 'FDTC',
      aliasCodes: ['DTC', 'OBA7', 'FIN-DT-CR'],
      helperCode: 'FDTC',
      table: 'fin_document_type',
      legalSafe: true,
      industry_standard: true
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

    if (!code || !name) {
      return NextResponse.json({ error: 'code and name required' }, { status: 400 });
    }

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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, code, name, description, number_range_code } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    const res = await db.execute(sql`
      UPDATE fin_document_type SET
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        number_range_code = COALESCE(${number_range_code}, number_range_code),
        updated_at = NOW()
      WHERE id = ${id} OR UPPER(code) = ${code ? code.toUpperCase() : ''}
      RETURNING *
    `);
    if (res.rows.length === 0) return NextResponse.json({ error: 'Document type not found' }, { status: 404 });
    return NextResponse.json({ success: true, documentType: res.rows[0], code: 'FDTC', message: `Document type ${res.rows[0].code} updated successfully.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const code = searchParams.get('code');
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    if (id) {
      await db.execute(sql`DELETE FROM fin_document_type WHERE id = ${id}`);
    } else {
      await db.execute(sql`DELETE FROM fin_document_type WHERE UPPER(code) = ${code ? code.toUpperCase() : ''}`);
    }

    return NextResponse.json({ success: true, message: `Document type ${code || id} deleted successfully.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
