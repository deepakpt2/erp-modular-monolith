import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { ensureAssignmentSchema } from '@/shared/kernel/db/assignmentResolver';

/**
 * OVX6 - Assign Division to Sales Organization
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureAssignmentSchema();

  try {
    const result = await db.execute(sql`
      SELECT 
        id,
        sales_org_code,
        division_code,
        description,
        updated_at
      FROM org_division_sales_assignment
      ORDER BY sales_org_code, division_code
    `);

    return NextResponse.json({
      data: result.rows,
      count: result.rows.length,
      helperCode: 'OVX6',
      title: 'Assign Division to Sales Organization'
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
    const { sales_org_code, division_code, description } = body;

    if (!sales_org_code || !division_code) {
      return NextResponse.json({ error: 'SALES_ORG_CODE and DIVISION_CODE are required.' }, { status: 400 });
    }

    const so = sales_org_code.toUpperCase().trim();
    const div = division_code.toUpperCase().trim();

    await db.execute(sql`
      INSERT INTO org_division_sales_assignment (sales_org_code, division_code, description, updated_at)
      VALUES (${so}, ${div}, ${description || null}, NOW())
      ON CONFLICT (sales_org_code, division_code) DO UPDATE SET 
        description = ${description || null},
        updated_at = NOW()
    `);

    return NextResponse.json({
      success: true,
      message: `Division ${div} assigned to Sales Organization ${so} (OVX6).`,
      assignment: { sales_org_code: so, division_code: div }
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
    const division_code = searchParams.get('division_code');

    if (!sales_org_code || !division_code) {
      return NextResponse.json({ error: 'sales_org_code and division_code are required' }, { status: 400 });
    }

    await db.execute(sql`
      DELETE FROM org_division_sales_assignment 
      WHERE UPPER(sales_org_code) = ${sales_org_code.toUpperCase()} 
        AND UPPER(division_code) = ${division_code.toUpperCase()}
    `);

    return NextResponse.json({ success: true, message: `Assignment removed.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
