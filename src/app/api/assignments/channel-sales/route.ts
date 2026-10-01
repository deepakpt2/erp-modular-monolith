import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { ensureAssignmentSchema } from '@/shared/kernel/db/assignmentResolver';

/**
 * OVX8 - Assign Distribution Channel to Sales Organization
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
        distribution_channel_code,
        description,
        updated_at
      FROM org_dist_channel_sales_assignment
      ORDER BY sales_org_code, distribution_channel_code
    `);

    return NextResponse.json({
      data: result.rows,
      count: result.rows.length,
      helperCode: 'OVX8',
      title: 'Assign Distribution Channel to Sales Organization'
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
    const { sales_org_code, distribution_channel_code, description } = body;

    if (!sales_org_code || !distribution_channel_code) {
      return NextResponse.json({ error: 'SALES_ORG_CODE and DISTRIBUTION_CHANNEL_CODE are required.' }, { status: 400 });
    }

    const so = sales_org_code.toUpperCase().trim();
    const dc = distribution_channel_code.toUpperCase().trim();

    await db.execute(sql`
      INSERT INTO org_dist_channel_sales_assignment (sales_org_code, distribution_channel_code, description, updated_at)
      VALUES (${so}, ${dc}, ${description || null}, NOW())
      ON CONFLICT (sales_org_code, distribution_channel_code) DO UPDATE SET 
        description = ${description || null},
        updated_at = NOW()
    `);

    return NextResponse.json({
      success: true,
      message: `Distribution Channel ${dc} assigned to Sales Organization ${so} (OVX8).`,
      assignment: { sales_org_code: so, distribution_channel_code: dc }
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
    const distribution_channel_code = searchParams.get('distribution_channel_code');

    if (!sales_org_code || !distribution_channel_code) {
      return NextResponse.json({ error: 'sales_org_code and distribution_channel_code are required' }, { status: 400 });
    }

    await db.execute(sql`
      DELETE FROM org_dist_channel_sales_assignment 
      WHERE UPPER(sales_org_code) = ${sales_org_code.toUpperCase()} 
        AND UPPER(distribution_channel_code) = ${distribution_channel_code.toUpperCase()}
    `);

    return NextResponse.json({ success: true, message: `Assignment removed.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
