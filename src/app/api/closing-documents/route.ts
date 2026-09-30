import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Closing Documents API – Legal-safe own IP – Module 10 FICO Extended – Completing Module5 to 100% + Module10 Final Audit & Closing
 * New: fin_closing_document (was MISSING) – closingNumber CLOSE-10000001, legalEntityId LE-1000 was company_code_id, fiscalYear, fiscalPeriod, closingType MM/SD/FICO/CO/ASSET/INVENTORY/PAYROLL/ALL, status OPEN/CLOSED/LOCKED, closedBy, closedAt, lockedAt
 * Helper code: FCDC Closing Document Create (alias CDC, OB52, FIN-CL-CR) – 4-char MOOA F=Financials CD=Closing Doc? Actually FCDC = Financials Closing Document Create – module grouped intuitive, same length as OB52 but own IP
 * Fresh empty per requirement but legalEntity/fiscal kept
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const fiscalYear = searchParams.get('fiscalYear');
  const closingType = searchParams.get('closingType');

  try {
    let rows: any[] = [];
    let table = 'fin_closing_document';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT c.id, c.closing_number, c.fiscal_year, c.fiscal_period, c.closing_type, c.status, c.closed_at, c.locked_at, c.text, c.created_at,
               le.code as legal_entity_code, le.name as legal_entity_name
        FROM fin_closing_document c
        LEFT JOIN org_legal_entity le ON c.legal_entity_id = le.id
        WHERE 1=1
      `;
      if (search) query = sql`${query} AND c.closing_number ILIKE ${`%${search}%`}`;
      if (status) query = sql`${query} AND c.status = ${status}::fin_closing_status_new`;
      if (fiscalYear) query = sql`${query} AND c.fiscal_year = ${fiscalYear}::int`;
      if (closingType) query = sql`${query} AND c.closing_type = ${closingType}::fin_closing_type_new`;
      query = sql`${query} ORDER BY c.fiscal_year DESC, c.fiscal_period DESC LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    } catch (e: any) {
      console.warn('fin_closing_document not yet:', e.message);
      return NextResponse.json({
        data: [],
        closingDocuments: [],
        count: 0,
        code: 'FCDC',
        aliasCodes: ['CDC', 'OB52', 'FIN-CL-CR'],
        helperCode: 'FCDC',
        table: 'fin_closing_document',
        source: 'none',
        legalSafe: true,
        message: 'Table fin_closing_document fresh empty – FCDC legal-safe own IP – closingNumber CLOSE-10000001, legalEntityId LE-1000, fiscalYear, fiscalPeriod, closingType MM/SD/FICO/CO/ASSET/INVENTORY/PAYROLL/ALL, status OPEN/CLOSED/LOCKED – fresh empty per requirement',
        explanation: 'Closing document legal-safe fin_closing_document – closingNumber CLOSE-10000001, legalEntityId LE-1000 was company_code_id, fiscalYear, fiscalPeriod, closingType MM/SD/FICO/CO/ASSET/INVENTORY/PAYROLL/ALL, status OPEN/CLOSED/LOCKED, closedBy, closedAt, lockedAt – Code FCDC primary alias CDC/OB52 – 4-char MOOA F=Financials CD=Closing Doc C=Create – module grouped intuitive – fresh empty but legalEntity/fiscal kept.',
      });
    }

    return NextResponse.json({
      data: rows,
      closingDocuments: rows,
      count: rows.length,
      code: 'FCDC',
      aliasCodes: ['CDC', 'OB52', 'FIN-CL-CR'],
      helperCode: 'FCDC',
      table,
      source: 'db-new',
      legalSafe,
      functionDescription: 'Closing Document – FCDC legal-safe own IP (was OB52) – closingNumber CLOSE-10000001, legalEntityId LE-1000, fiscalYear, fiscalPeriod, closingType MM/SD/FICO/CO/ASSET/INVENTORY/PAYROLL/ALL, status OPEN/CLOSED/LOCKED',
      explanation: 'Closing document legal-safe fin_closing_document – closingNumber CLOSE-10000001, legalEntityId LE-1000 was company_code_id, fiscalYear, fiscalPeriod, closingType MM/SD/FICO/CO/ASSET/INVENTORY/PAYROLL/ALL, status OPEN/CLOSED/LOCKED, closedBy, closedAt, lockedAt – Code FCDC primary alias CDC/OB52 – 4-char MOOA F=Financials CD=Closing Doc C=Create – module grouped intuitive – fresh empty but legalEntity/fiscal kept.',
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
    const { legal_entity_id, company_code_id, fiscal_year, fiscal_period, closing_type, text } = body;

    if (!fiscal_year || !fiscal_period) return NextResponse.json({ error: 'fiscal_year and fiscal_period required' }, { status: 400 });

    let legalEntityIdResolved = legal_entity_id || company_code_id;
    if (!legalEntityIdResolved) {
      try {
        const le = await db.execute(sql`SELECT id FROM org_legal_entity LIMIT 1`);
        if (le.rows.length > 0) legalEntityIdResolved = (le.rows[0] as any).id;
      } catch {}
    }

    if (!legalEntityIdResolved) return NextResponse.json({ error: 'legal_entity_id or company_code_id required' }, { status: 400 });

    let closingNumber = body.closing_number;
    if (!closingNumber) {
      try {
        const nrRes = await db.execute(sql`SELECT current_number FROM core_number_range WHERE object_type = 'CLOSING'::core_nr_object_type ORDER BY fiscal_year DESC LIMIT 1`);
        if (nrRes.rows.length > 0) {
          const current = parseInt((nrRes.rows[0] as any).current_number) + 1;
                    closingNumber = `${current}`;
          await db.execute(sql`UPDATE core_number_range SET current_number = ${current}, updated_at = NOW() WHERE object_type = 'CLOSING'::core_nr_object_type`);
        } else {
          closingNumber = `CLOSE-${Date.now()}`;
        }
      } catch {
        closingNumber = `CLOSE-${Date.now()}`;
      }
    }

    const res = await db.execute(sql`
      INSERT INTO fin_closing_document (closing_number, legal_entity_id, company_code_id, fiscal_year, fiscal_period, closing_type, text)
      VALUES (${closingNumber}, ${legalEntityIdResolved}, ${legalEntityIdResolved}, ${fiscal_year}, ${fiscal_period}, ${closing_type || 'ALL'}::fin_closing_type_new, ${text || null})
      ON CONFLICT (legal_entity_id, fiscal_year, fiscal_period, closing_type) DO UPDATE SET text = ${text || null}
      RETURNING id, closing_number
    `);

    return NextResponse.json({ success: true, closingDocument: res.rows[0], closingNumber, code: 'FCDC', message: `Closing document ${closingNumber} created – FCDC legal-safe`, legalSafe: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, closing_number, status } = body;
    if (!id && !closing_number) return NextResponse.json({ error: 'id or closing_number required' }, { status: 400 });

    let res;
    if (status === 'CLOSED') {
      if (id) res = await db.execute(sql`UPDATE fin_closing_document SET status = ${status}::fin_closing_status_new, closed_at = NOW() WHERE id = ${id} RETURNING id, closing_number, status`);
      else res = await db.execute(sql`UPDATE fin_closing_document SET status = ${status}::fin_closing_status_new, closed_at = NOW() WHERE closing_number = ${closing_number} RETURNING id, closing_number, status`);
    } else if (status === 'LOCKED') {
      if (id) res = await db.execute(sql`UPDATE fin_closing_document SET status = ${status}::fin_closing_status_new, locked_at = NOW() WHERE id = ${id} RETURNING id, closing_number, status`);
      else res = await db.execute(sql`UPDATE fin_closing_document SET status = ${status}::fin_closing_status_new, locked_at = NOW() WHERE closing_number = ${closing_number} RETURNING id, closing_number, status`);
    } else {
      if (id) res = await db.execute(sql`UPDATE fin_closing_document SET status = ${status}::fin_closing_status_new WHERE id = ${id} RETURNING id, closing_number, status`);
      else res = await db.execute(sql`UPDATE fin_closing_document SET status = ${status}::fin_closing_status_new WHERE closing_number = ${closing_number} RETURNING id, closing_number, status`);
    }

    if (res.rows.length === 0) return NextResponse.json({ error: 'Closing document not found' }, { status: 404 });

    return NextResponse.json({ success: true, closingDocument: res.rows[0], code: 'FCDC', message: `Closing document ${res.rows[0].closing_number} status ${status} – FCDC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await db.execute(sql`DELETE FROM fin_closing_document WHERE id = ${id}`);

    return NextResponse.json({ success: true, code: 'FCDC', message: `Closing document ${id} deleted – FCDC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
