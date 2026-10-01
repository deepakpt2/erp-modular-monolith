import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { ensureAssignmentSchema } from '@/shared/kernel/db/assignmentResolver';

/**
 * OB62 - Assign Company Code to Chart of Accounts
 * Standard SAP: Operational Chart of Accounts + Country Chart of Accounts
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
        le.currency_code as currency_code,
        COALESCE(fa.chart_of_accounts_code, le.chart_of_accounts_code) as chart_of_accounts_code,
        fa.country_chart_of_accounts_code as country_chart_of_accounts_code,
        fa.updated_at
      FROM org_legal_entity le
      LEFT JOIN fin_company_assignment fa ON UPPER(le.code) = UPPER(fa.company_code)
      ORDER BY le.code
    `);

    return NextResponse.json({
      data: result.rows,
      count: result.rows.length,
      helperCode: 'OB62',
      title: 'Assign Company Code to Chart of Accounts'
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
    const { company_code, chart_of_accounts_code, country_chart_of_accounts_code } = body;

    if (!company_code || !chart_of_accounts_code) {
      return NextResponse.json({ error: 'COMPANY_CODE and CHART_OF_ACCOUNTS_CODE are required.' }, { status: 400 });
    }

    const cc = company_code.toUpperCase().trim();
    const coa = chart_of_accounts_code.toUpperCase().trim();
    const ctryCoa = country_chart_of_accounts_code ? country_chart_of_accounts_code.toUpperCase().trim() : null;

    // Verify company code exists
    const leCheck = await db.execute(sql`SELECT id, name FROM org_legal_entity WHERE UPPER(code) = ${cc} LIMIT 1`);
    if (leCheck.rows.length === 0) {
      return NextResponse.json({ error: `Company Code '${cc}' does not exist. Create it first in OX02 (Legal Entities).` }, { status: 404 });
    }
    const companyName = (leCheck.rows[0] as any)?.name;

    // Verify chart of accounts exists
    const coaCheck = await db.execute(sql`SELECT id FROM fin_chart WHERE UPPER(code) = ${coa} LIMIT 1`);
    if (coaCheck.rows.length === 0) {
      return NextResponse.json({ error: `Chart of Accounts '${coa}' does not exist. Create it first in OB13 (Chart of Accounts).` }, { status: 404 });
    }

    // Upsert assignment in fin_company_assignment
    await db.execute(sql`
      INSERT INTO fin_company_assignment (company_code, company_name, chart_of_accounts_code, country_chart_of_accounts_code, updated_at)
      VALUES (${cc}, ${companyName}, ${coa}, ${ctryCoa}, NOW())
      ON CONFLICT (company_code) DO UPDATE SET 
        chart_of_accounts_code = ${coa},
        country_chart_of_accounts_code = ${ctryCoa},
        updated_at = NOW()
    `);

    // Sync column on org_legal_entity for backward compatibility
    await db.execute(sql`
      UPDATE org_legal_entity 
      SET chart_of_accounts_code = ${coa}, updated_at = NOW() 
      WHERE UPPER(code) = ${cc}
    `).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Company Code ${cc} successfully assigned to Chart of Accounts ${coa} (OB62).`,
      assignment: { company_code: cc, chart_of_accounts_code: coa, country_chart_of_accounts_code: ctryCoa }
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

    if (!company_code) {
      return NextResponse.json({ error: 'company_code is required' }, { status: 400 });
    }

    const cc = company_code.toUpperCase().trim();
    await db.execute(sql`
      UPDATE fin_company_assignment 
      SET chart_of_accounts_code = NULL, country_chart_of_accounts_code = NULL, updated_at = NOW() 
      WHERE UPPER(company_code) = ${cc}
    `);

    await db.execute(sql`
      UPDATE org_legal_entity 
      SET chart_of_accounts_code = NULL, updated_at = NOW() 
      WHERE UPPER(code) = ${cc}
    `).catch(() => {});

    return NextResponse.json({ success: true, message: `Assignment removed for Company Code ${cc}.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
