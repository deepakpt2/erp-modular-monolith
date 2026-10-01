import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Company Group Assignment API - OX16 / ECGA
 * SAP Parity: Assign Company Code (Legal Entity) to Company (Company Group)
 * IMG Path: Enterprise Structure -> Assignment -> Financial Accounting -> Assign company code to company
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const result = await db.execute(sql`
      SELECT 
        le.id as id,
        le.code as legal_entity_code,
        le.code as code,
        le.name as legal_entity_name,
        le.currency_code as currency_code,
        le.city as city,
        cg.id as company_group_id,
        cg.code as company_group_code,
        cg.name as company_group_name,
        le.updated_at
      FROM org_legal_entity le
      LEFT JOIN org_company_group cg ON le.company_group_id = cg.id
      ORDER BY le.code
    `);

    return NextResponse.json({
      data: result.rows,
      assignments: result.rows,
      count: result.rows.length,
      helperCode: 'OX16',
      table: 'org_legal_entity'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { legal_entity_code, company_group_code, description } = body;

    if (!legal_entity_code) {
      return NextResponse.json({ error: 'legal_entity_code is required' }, { status: 400 });
    }

    const leCheck = await db.execute(sql`SELECT id, code, name FROM org_legal_entity WHERE UPPER(code) = ${legal_entity_code.toUpperCase().trim()} LIMIT 1`);
    if (leCheck.rows.length === 0) {
      return NextResponse.json({ error: `Legal Entity '${legal_entity_code}' not found (OX02 / ELEC)` }, { status: 404 });
    }
    const le = leCheck.rows[0] as any;

    let cgId: string | null = null;
    if (company_group_code) {
      const cgCheck = await db.execute(sql`SELECT id, code, name FROM org_company_group WHERE UPPER(code) = ${company_group_code.toUpperCase().trim()} LIMIT 1`);
      if (cgCheck.rows.length === 0) {
        return NextResponse.json({ error: `Company Group '${company_group_code}' not found (OX15 / ECGC)` }, { status: 404 });
      }
      cgId = (cgCheck.rows[0] as any).id;
    }

    await db.execute(sql`
      UPDATE org_legal_entity 
      SET company_group_id = ${cgId}, updated_at = NOW() 
      WHERE id = ${le.id}
    `);

    return NextResponse.json({
      success: true,
      message: company_group_code 
        ? `Legal Entity ${le.code} successfully assigned to Company Group ${company_group_code.toUpperCase()} (OX16)`
        : `Assignment cleared for Legal Entity ${le.code}`,
      assignment: {
        legal_entity_code: le.code,
        company_group_code: company_group_code ? company_group_code.toUpperCase() : null,
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
