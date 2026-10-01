import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { ensureAssignmentSchema } from '@/shared/kernel/db/assignmentResolver';

/**
 * OX01 - Assign Purchasing Organization to Company Code
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureAssignmentSchema();

  try {
    const result = await db.execute(sql`
      SELECT 
        pca.id as id,
        pca.purchasing_org_code,
        pca.company_code,
        le.name as company_name,
        pca.updated_at
      FROM org_purchasing_company_assignment pca
      LEFT JOIN org_legal_entity le ON UPPER(pca.company_code) = UPPER(le.code)
      ORDER BY pca.purchasing_org_code, pca.company_code
    `);

    return NextResponse.json({
      data: result.rows,
      count: result.rows.length,
      helperCode: 'OX01',
      title: 'Assign Purchasing Organization to Company Code'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureAssignmentSchema();

  try {
    const body = await req.json();
    const { purchasing_org_code, company_code, description } = body;

    if (!purchasing_org_code || !company_code) {
      return NextResponse.json({ error: 'PURCHASING_ORG_CODE and COMPANY_CODE are required.' }, { status: 400 });
    }

    const po = purchasing_org_code.toUpperCase().trim();
    const cc = company_code.toUpperCase().trim();

    await db.execute(sql`
      INSERT INTO org_purchasing_company_assignment (purchasing_org_code, company_code, description, updated_at)
      VALUES (${po}, ${cc}, ${description || null}, NOW())
      ON CONFLICT (purchasing_org_code, company_code) DO UPDATE SET 
        description = ${description || null},
        updated_at = NOW()
    `);

    return NextResponse.json({
      success: true,
      message: `Purchasing Organization ${po} successfully assigned to Company Code ${cc} (OX01).`,
      assignment: { purchasing_org_code: po, company_code: cc }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const purchasing_org_code = searchParams.get('purchasing_org_code');
    const company_code = searchParams.get('company_code');

    if (!purchasing_org_code || !company_code) {
      return NextResponse.json({ error: 'purchasing_org_code and company_code are required' }, { status: 400 });
    }

    await db.execute(sql`
      DELETE FROM org_purchasing_company_assignment 
      WHERE UPPER(purchasing_org_code) = ${purchasing_org_code.toUpperCase()} 
        AND UPPER(company_code) = ${company_code.toUpperCase()}
    `);

    return NextResponse.json({ success: true, message: `Assignment removed.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
