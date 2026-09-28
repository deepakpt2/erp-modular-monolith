import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
  // Enterprise auth guard - secure by default, MVP open only if MVP_NO_AUTH=true
  const authCheck = await requireApiAuth();
  if (authCheck) return authCheck;

  try {
    const result = await db.execute(sql`
      SELECT tc.id, tc.code, tc.description, tc.rate, tc.type, tc.is_active, tc.gl_account_id, gl.account_number, gl.name as gl_name
      FROM fi_tax_code tc
      LEFT JOIN fi_gl_account gl ON tc.gl_account_id = gl.id
      ORDER BY tc.code
    `);

    return NextResponse.json({
      taxCodes: result.rows,
      count: result.rows.length,
      source: 'db',
      configurable: true, helperCode: 'FTXP',
      functionDescription: 'Tax Codes – ERP FTXP – VAT 5%, GST 5%/12%/18%/28%, Input/Output – configurable, secure delete blocked if has FI postings',
      erpDefaults: [
        { code: 'V0', description: 'Input Tax 0% – VAT 0%', rate: 0, type: 'INPUT', helperCode: 'FTXP', gl: '130000 Input Tax VAT' },
        { code: 'V5', description: 'Input Tax 5% – VAT 5% – Kuwait/GCC VAT 5%', rate: 5, type: 'INPUT', helperCode: 'FTXP', gl: '130000 Input Tax VAT', note: 'VAT 5% example – like KWD VAT 5%' },
        { code: 'V14', description: 'Input Tax 14% – VAT 14%', rate: 14, type: 'INPUT', helperCode: 'FTXP' },
        { code: 'A0', description: 'Output Tax 0% – VAT 0%', rate: 0, type: 'OUTPUT', helperCode: 'FTXP', gl: '220000 Output Tax VAT' },
        { code: 'A5', description: 'Output Tax 5% – VAT 5% – Output', rate: 5, type: 'OUTPUT', helperCode: 'FTXP', gl: '220000 Output Tax VAT', note: 'VAT 5% Output' },
        { code: 'GST0', description: 'GST 0% – India GST 0% Spices', rate: 0, type: 'INPUT', helperCode: 'FTXP', gl: '7000000000 CGST Input' },
        { code: 'GST5', description: 'GST 5% Spices – India GST 5% for spices – VAT 5% equivalent', rate: 5, type: 'INPUT', helperCode: 'FTXP', gl: '7000000000 CGST', note: 'GST 5% like VAT 5%' },
        { code: 'GST12', description: 'GST 12%', rate: 12, type: 'INPUT', helperCode: 'FTXP' },
        { code: 'GST18', description: 'GST 18%', rate: 18, type: 'INPUT', helperCode: 'FTXP' },
        { code: 'GST28', description: 'GST 28%', rate: 28, type: 'INPUT', helperCode: 'FTXP' },
        { code: 'IGST0', description: 'IGST 0% Export', rate: 0, type: 'OUTPUT', helperCode: 'FTXP' },
        { code: 'IGST5', description: 'IGST 5%', rate: 5, type: 'OUTPUT', helperCode: 'FTXP' },
        { code: 'IGST18', description: 'IGST 18%', rate: 18, type: 'OUTPUT', helperCode: 'FTXP' },
      ],
      explanation: 'Tax codes configurable via FTXP – VAT 5% V5/A5, GST 5% GST5/IGST5 – add new via POST, edit via PUT, delete blocked if has FI postings for security. Code FTXP.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, taxCodes: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { code, description, rate, type, gl_account_number } = body;
    if (!code || !description || rate == null) return NextResponse.json({ error: 'code, description, rate required' }, { status: 400 });

    let glId = null;
    if (gl_account_number) {
      const g = await db.execute(sql`SELECT id FROM fi_gl_account WHERE account_number = ${gl_account_number} LIMIT 1`);
      if (g.rows.length > 0) glId = (g.rows[0] as any).id;
    }

    const res = await db.execute(sql`
      INSERT INTO fi_tax_code (code, description, rate, type, gl_account_id)
      VALUES (${code.toUpperCase()}, ${description}, ${rate}, ${type || 'INPUT'}, ${glId})
      ON CONFLICT (code) DO UPDATE SET description = ${description}, rate = ${rate}, type = ${type || 'INPUT'}, gl_account_id = COALESCE(${glId}, fi_tax_code.gl_account_id), is_active = true
      RETURNING id, code
    `);

    return NextResponse.json({ success: true, taxCode: res.rows[0], message: `Tax Code ${code.toUpperCase()} ${rate}% created – FTXP configurable – VAT 5% etc` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, code, description, rate, type, is_active, gl_account_number } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    let glId = null;
    if (gl_account_number) {
      const g = await db.execute(sql`SELECT id FROM fi_gl_account WHERE account_number = ${gl_account_number} LIMIT 1`);
      if (g.rows.length > 0) glId = (g.rows[0] as any).id;
    }

    let res;
    if (id) {
      res = await db.execute(sql`
        UPDATE fi_tax_code SET
          code = COALESCE(${code?.toUpperCase()}, code),
          description = COALESCE(${description}, description),
          rate = COALESCE(${rate}, rate),
          type = COALESCE(${type}, type),
          is_active = COALESCE(${is_active}, is_active),
          gl_account_id = COALESCE(${glId}, gl_account_id)
        WHERE id = ${id}
        RETURNING id, code, rate
      `);
    } else {
      res = await db.execute(sql`
        UPDATE fi_tax_code SET
          description = COALESCE(${description}, description),
          rate = COALESCE(${rate}, rate),
          type = COALESCE(${type}, type),
          is_active = COALESCE(${is_active}, is_active),
          gl_account_id = COALESCE(${glId}, gl_account_id)
        WHERE code = ${code.toUpperCase()}
        RETURNING id, code, rate
      `);
    }

    if (res.rows.length === 0) return NextResponse.json({ error: 'Tax code not found' }, { status: 404 });
    return NextResponse.json({ success: true, taxCode: res.rows[0], message: `Tax Code ${res.rows[0].code} updated – FTXP` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const id = searchParams.get('id');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    // Security: check if tax code used in FI documents – block hard delete
    let taxId = id;
    let taxCode = code?.toUpperCase();
    if (!taxId && taxCode) {
      const r = await db.execute(sql`SELECT id, code FROM fi_tax_code WHERE code = ${taxCode} LIMIT 1`);
      if (r.rows.length > 0) { taxId = (r.rows[0] as any).id; taxCode = (r.rows[0] as any).code; }
    }

    let fiCount = 0;
    try {
      if (taxId) {
        const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM fi_document_line WHERE tax_code_id = ${taxId}`);
        fiCount = parseInt((r.rows[0] as any).cnt || '0');
      }
    } catch {}

    if (fiCount > 0) {
      // Soft delete – blocked to maintain audit trail
      if (taxId) await db.execute(sql`UPDATE fi_tax_code SET is_active = false WHERE id = ${taxId}`);
      return NextResponse.json({
        error: `Cannot delete – tax code ${taxCode} has ${fiCount} postings and cannot be deleted to maintain audit trail. Deactivated instead.`,
        code: 'HAS_TRANSACTIONS',
        fiCount,
      }, { status: 400 });
    }

    if (taxId) await db.execute(sql`DELETE FROM fi_tax_code WHERE id = ${taxId}`);
    else if (taxCode) await db.execute(sql`DELETE FROM fi_tax_code WHERE code = ${taxCode}`);

    return NextResponse.json({ success: true, message: `Tax Code ${taxCode || taxId} deleted – FTXP – only allowed when no FI postings` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
