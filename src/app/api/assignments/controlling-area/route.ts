import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { ensureAssignmentSchema } from '@/shared/kernel/db/assignmentResolver';

/**
 * OX19 - Assign Company Code to Controlling Area
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureAssignmentSchema();

  try {
    const result = await db.execute(sql`
      SELECT 
        le.code as company_code,
        le.name as company_name,
        le.city as city,
        fa.controlling_area_code as controlling_area_code,
        fa.updated_at
      FROM org_legal_entity le
      LEFT JOIN fin_company_assignment fa ON UPPER(le.code) = UPPER(fa.company_code)
      ORDER BY le.code
    `);

    return NextResponse.json({
      data: result.rows,
      count: result.rows.length,
      helperCode: 'OX19',
      title: 'Assign Company Code to Controlling Area'
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
    const { company_code, controlling_area_code } = body;

    if (!company_code || !controlling_area_code) {
      return NextResponse.json({ error: 'COMPANY_CODE and CONTROLLING_AREA_CODE are required.' }, { status: 400 });
    }

    const cc = company_code.toUpperCase().trim();
    const co = controlling_area_code.toUpperCase().trim();

    const leCheck = await db.execute(sql`SELECT id, name FROM org_legal_entity WHERE UPPER(code) = ${cc} LIMIT 1`);
    if (leCheck.rows.length === 0) {
      return NextResponse.json({ error: `Company Code '${cc}' does not exist.` }, { status: 404 });
    }
    const companyName = (leCheck.rows[0] as any)?.name;

    await db.execute(sql`
      INSERT INTO fin_company_assignment (company_code, company_name, controlling_area_code, updated_at)
      VALUES (${cc}, ${companyName}, ${co}, NOW())
      ON CONFLICT (company_code) DO UPDATE SET 
        controlling_area_code = ${co},
        updated_at = NOW()
    `);

    return NextResponse.json({
      success: true,
      message: `Company Code ${cc} successfully assigned to Controlling Area ${co} (OX19).`,
      assignment: { company_code: cc, controlling_area_code: co }
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
    const company_code = searchParams.get('company_code') || searchParams.get('code');
    if (!company_code) return NextResponse.json({ error: 'company_code is required' }, { status: 400 });

    const cc = company_code.toUpperCase().trim();
    await db.execute(sql`
      UPDATE fin_company_assignment SET controlling_area_code = NULL, updated_at = NOW() WHERE UPPER(company_code) = ${cc}
    `);

    return NextResponse.json({ success: true, message: `Controlling Area assignment removed for ${cc}.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
