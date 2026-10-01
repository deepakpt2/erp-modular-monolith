import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { ensureAssignmentSchema } from '@/shared/kernel/db/assignmentResolver';

/**
 * OX17 - Assign Purchasing Organization to Plant
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureAssignmentSchema();

  try {
    const result = await db.execute(sql`
      SELECT 
        ppa.id as id,
        ppa.purchasing_org_code,
        ppa.plant_code,
        f.name as plant_name,
        ppa.updated_at
      FROM org_purchasing_plant_assignment ppa
      LEFT JOIN org_facility f ON UPPER(ppa.plant_code) = UPPER(f.code)
      ORDER BY ppa.purchasing_org_code, ppa.plant_code
    `);

    return NextResponse.json({
      data: result.rows,
      count: result.rows.length,
      helperCode: 'OX17',
      title: 'Assign Purchasing Organization to Plant'
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
    const { purchasing_org_code, plant_code, description } = body;

    if (!purchasing_org_code || !plant_code) {
      return NextResponse.json({ error: 'PURCHASING_ORG_CODE and PLANT_CODE are required.' }, { status: 400 });
    }

    const po = purchasing_org_code.toUpperCase().trim();
    const plt = plant_code.toUpperCase().trim();

    await db.execute(sql`
      INSERT INTO org_purchasing_plant_assignment (purchasing_org_code, plant_code, description, updated_at)
      VALUES (${po}, ${plt}, ${description || null}, NOW())
      ON CONFLICT (purchasing_org_code, plant_code) DO UPDATE SET 
        description = ${description || null},
        updated_at = NOW()
    `);

    return NextResponse.json({
      success: true,
      message: `Purchasing Organization ${po} successfully assigned to Plant ${plt} (OX17).`,
      assignment: { purchasing_org_code: po, plant_code: plt }
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
    const plant_code = searchParams.get('plant_code');

    if (!purchasing_org_code || !plant_code) {
      return NextResponse.json({ error: 'purchasing_org_code and plant_code are required' }, { status: 400 });
    }

    await db.execute(sql`
      DELETE FROM org_purchasing_plant_assignment 
      WHERE UPPER(purchasing_org_code) = ${purchasing_org_code.toUpperCase()} 
        AND UPPER(plant_code) = ${plant_code.toUpperCase()}
    `);

    return NextResponse.json({ success: true, message: `Assignment removed.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
