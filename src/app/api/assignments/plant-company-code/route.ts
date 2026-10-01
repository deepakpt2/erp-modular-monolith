import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { ensureAssignmentSchema } from '@/shared/kernel/db/assignmentResolver';

/**
 * OX18 - Assign Plant to Company Code
 * Logistics General -> Enterprise Structure -> Assignment -> Assign plant to company code
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureAssignmentSchema();

  try {
    const result = await db.execute(sql`
      SELECT 
        pca.id as id,
        pca.company_code,
        le.name as company_name,
        pca.plant_code,
        f.name as plant_name,
        f.city as plant_city,
        pca.updated_at
      FROM org_plant_company_assignment pca
      LEFT JOIN org_legal_entity le ON UPPER(pca.company_code) = UPPER(le.code)
      LEFT JOIN org_facility f ON UPPER(pca.plant_code) = UPPER(f.code)
      ORDER BY pca.company_code, pca.plant_code
    `);

    // Also include facilities directly mapped via legal_entity_id if missing from table
    const directFacilities = await db.execute(sql`
      SELECT 
        f.id as id,
        le.code as company_code,
        le.name as company_name,
        f.code as plant_code,
        f.name as plant_name,
        f.city as plant_city,
        f.updated_at
      FROM org_facility f
      JOIN org_legal_entity le ON f.legal_entity_id = le.id
      WHERE NOT EXISTS (
        SELECT 1 FROM org_plant_company_assignment pca 
        WHERE UPPER(pca.plant_code) = UPPER(f.code) AND UPPER(pca.company_code) = UPPER(le.code)
      )
    `);

    const combined = [...result.rows, ...directFacilities.rows];

    return NextResponse.json({
      data: combined,
      count: combined.length,
      helperCode: 'OX18',
      title: 'Assign Plant to Company Code'
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
    const { company_code, plant_code, description } = body;

    if (!company_code || !plant_code) {
      return NextResponse.json({ error: 'COMPANY_CODE and PLANT_CODE are required.' }, { status: 400 });
    }

    const cc = company_code.toUpperCase().trim();
    const plt = plant_code.toUpperCase().trim();

    const leCheck = await db.execute(sql`SELECT id, name FROM org_legal_entity WHERE UPPER(code) = ${cc} LIMIT 1`);
    if (leCheck.rows.length === 0) {
      return NextResponse.json({ error: `Company Code '${cc}' does not exist.` }, { status: 404 });
    }
    const legalEntityId = (leCheck.rows[0] as any)?.id;

    const facCheck = await db.execute(sql`SELECT id, name FROM org_facility WHERE UPPER(code) = ${plt} LIMIT 1`);
    if (facCheck.rows.length === 0) {
      return NextResponse.json({ error: `Plant '${plt}' does not exist. Create it first in OX10 / EFCC.` }, { status: 404 });
    }

    await db.execute(sql`
      INSERT INTO org_plant_company_assignment (company_code, plant_code, description, updated_at)
      VALUES (${cc}, ${plt}, ${description || null}, NOW())
      ON CONFLICT (plant_code, company_code) DO UPDATE SET 
        description = ${description || null},
        updated_at = NOW()
    `);

    // Sync direct legal_entity_id reference on facility
    await db.execute(sql`
      UPDATE org_facility 
      SET legal_entity_id = ${legalEntityId}, updated_at = NOW() 
      WHERE UPPER(code) = ${plt}
    `).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Plant ${plt} successfully assigned to Company Code ${cc} (OX18).`,
      assignment: { company_code: cc, plant_code: plt }
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
    const plant_code = searchParams.get('plant_code');

    if (!company_code || !plant_code) {
      return NextResponse.json({ error: 'company_code and plant_code are required' }, { status: 400 });
    }

    const cc = company_code.toUpperCase().trim();
    const plt = plant_code.toUpperCase().trim();

    await db.execute(sql`
      DELETE FROM org_plant_company_assignment 
      WHERE UPPER(company_code) = ${cc} AND UPPER(plant_code) = ${plt}
    `);

    return NextResponse.json({ success: true, message: `Assignment removed between Plant ${plt} and Company Code ${cc}.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
