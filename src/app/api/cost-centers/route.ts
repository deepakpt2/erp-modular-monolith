import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const companyCode = searchParams.get('companyCode') || 'ALL';

  try {
    let query = sql`
      SELECT cc.id, cc.code, cc.name, cc.company_code_id, comp.code as company_code, comp.name as company_name, comp.currency_code,
             cc.is_active, cc.valid_from, cc.valid_to,
             (SELECT COUNT(*) FROM hr_employee WHERE cost_center_id = cc.id) as employee_count,
             (SELECT COUNT(*) FROM fin_universal_ledger_line WHERE cost_center_id = cc.id) as posting_count
      FROM fin_cost_center cc
      JOIN org_legal_entity comp ON cc.company_code_id = comp.id
      WHERE 1=1
    `;
    if (companyCode && companyCode !== 'ALL') {
      query = sql`${query} AND comp.code = ${companyCode}`;
    }
    query = sql`${query} ORDER BY comp.code, cc.code`;

    const result = await db.execute(query);

    return NextResponse.json({
      costCenters: result.rows,
      count: result.rows.length,
      source: 'db',
      configurable: true, helperCode: 'KS01',
      functionMapping: {
        'KS01': 'Create Cost Center',
        'KS02': 'Change Cost Center – edit',
        'KS03': 'Display Cost Center',
        'KSB1': 'Cost Center Report',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, costCenters: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { code, name, company_code } = body;
    if (!code || !name || !company_code) return NextResponse.json({ error: 'code, name, company_code required' }, { status: 400 });

    const ccRes = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code = ${company_code} LIMIT 1`);
    if (ccRes.rows.length === 0) return NextResponse.json({ error: `Company code ${company_code} not found` }, { status: 404 });
    const companyCodeId = (ccRes.rows[0] as any).id;

    const res = await db.execute(sql`
      INSERT INTO fin_cost_center (code, name, company_code_id)
      VALUES (${code.toUpperCase()}, ${name}, ${companyCodeId})
      ON CONFLICT (code) DO UPDATE SET name = ${name}, company_code_id = ${companyCodeId}, is_active = true
      RETURNING id, code
    `);

    return NextResponse.json({ success: true, costCenter: res.rows[0], message: `Cost Center ${code.toUpperCase()} created for ${company_code} – KS01` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, code, name, is_active, company_code } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    let companyCodeId = null;
    if (company_code) {
      const r = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code = ${company_code} LIMIT 1`);
      if (r.rows.length > 0) companyCodeId = (r.rows[0] as any).id;
    }

    let res;
    if (id) {
      res = await db.execute(sql`
        UPDATE fin_cost_center SET
          code = COALESCE(${code?.toUpperCase()}, code),
          name = COALESCE(${name}, name),
          company_code_id = COALESCE(${companyCodeId}, company_code_id),
          is_active = COALESCE(${is_active}, is_active)
        WHERE id = ${id}
        RETURNING id, code, name
      `);
    } else {
      res = await db.execute(sql`
        UPDATE fin_cost_center SET
          name = COALESCE(${name}, name),
          company_code_id = COALESCE(${companyCodeId}, company_code_id),
          is_active = COALESCE(${is_active}, is_active)
        WHERE code = ${code.toUpperCase()}
        RETURNING id, code, name
      `);
    }

    if (res.rows.length === 0) return NextResponse.json({ error: 'Cost center not found' }, { status: 404 });
    return NextResponse.json({ success: true, costCenter: res.rows[0], message: `Cost Center ${res.rows[0].code} updated – KS02` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import { validateCostCenterDeletion } from '@/shared/kernel/safety/deletionPrecheck';

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const id = searchParams.get('id');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    let ccId = id;
    let ccCode = code?.toUpperCase();
    if (!ccId && ccCode) {
      const r = await db.execute(sql`SELECT id, code FROM fin_cost_center WHERE code = ${ccCode} LIMIT 1`);
      if (r.rows.length > 0) { ccId = (r.rows[0] as any).id; ccCode = (r.rows[0] as any).code; }
    }

    if (!ccId) return NextResponse.json({ error: 'Cost center not found' }, { status: 404 });

    // Industry Standard Pre-check
    const precheck = await validateCostCenterDeletion({ id: ccId, code: ccCode });
    if (!precheck.canDelete) {
      return NextResponse.json({
        success: false,
        errorCode: 'MSG_CC_001',
        error: precheck.errorTitle,
        diagnostic: precheck,
      }, { status: 409 });
    }

    await db.execute(sql`DELETE FROM fin_cost_center WHERE id = ${ccId}`);
    return NextResponse.json({ success: true, message: `Cost Center ${ccCode} deleted – KS01 – only allowed when no transactions` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
