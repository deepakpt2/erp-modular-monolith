import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { ensureAssignmentSchema } from '@/shared/kernel/db/assignmentResolver';

/**
 * OVX3 - Assign Sales Organization to Company Code
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureAssignmentSchema();

  try {
    const result = await db.execute(sql`
      SELECT 
        sca.id as id,
        sca.sales_org_code,
        sca.company_code,
        le.name as company_name,
        sca.updated_at
      FROM org_sales_company_assignment sca
      LEFT JOIN org_legal_entity le ON UPPER(sca.company_code) = UPPER(le.code)
      ORDER BY sca.sales_org_code, sca.company_code
    `);

    return NextResponse.json({
      data: result.rows,
      count: result.rows.length,
      helperCode: 'OVX3',
      title: 'Assign Sales Organization to Company Code'
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
    const { sales_org_code, company_code, description } = body;

    if (!sales_org_code || !company_code) {
      return NextResponse.json({ error: 'SALES_ORG_CODE and COMPANY_CODE are required.' }, { status: 400 });
    }

    const so = sales_org_code.toUpperCase().trim();
    const cc = company_code.toUpperCase().trim();

    await db.execute(sql`
      INSERT INTO org_sales_company_assignment (sales_org_code, company_code, description, updated_at)
      VALUES (${so}, ${cc}, ${description || null}, NOW())
      ON CONFLICT (sales_org_code, company_code) DO UPDATE SET 
        description = ${description || null},
        updated_at = NOW()
    `);

    return NextResponse.json({
      success: true,
      message: `Sales Organization ${so} successfully assigned to Company Code ${cc} (OVX3).`,
      assignment: { sales_org_code: so, company_code: cc }
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
    const sales_org_code = searchParams.get('sales_org_code');
    const company_code = searchParams.get('company_code');

    if (!sales_org_code || !company_code) {
      return NextResponse.json({ error: 'sales_org_code and company_code are required' }, { status: 400 });
    }

    await db.execute(sql`
      DELETE FROM org_sales_company_assignment 
      WHERE UPPER(sales_org_code) = ${sales_org_code.toUpperCase()} 
        AND UPPER(company_code) = ${company_code.toUpperCase()}
    `);

    return NextResponse.json({ success: true, message: `Assignment removed.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
