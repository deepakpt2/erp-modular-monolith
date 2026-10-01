import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth, requirePermission } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Payroll API – Legal-safe own IP – Module 9 HR Foundation
 * New: hr_payroll_run_new + hr_payroll_line_new (was hr_payroll_run + hr_payroll_line) – periodYear 2026 periodMonth 09 legalEntityId LE-1000 was company_code_id status DRAFT/POSTED/PAID/CANCELLED totalGross/totalDeductions/totalNet universalLedgerId FULC was fi_document_id postedAt postedBy, line: payrollRunId employeeId basicSalary allowances deductions overtime netPay costUnitId ECUC was cost_center_id status
 * Helper code: HPRC HR Payroll Run Create (alias PRC, PC00, FIN-HR-PR-CR) – 4-char MOOA H=HR PR=Payroll R=Run? Actually HPRC = HR Payroll Run Create – module grouped intuitive
 * Fallback to legacy hr_payroll_run
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  const permCheck = await requirePermission('PAYROLL_RUN');
  if (permCheck) return permCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const legalEntityId = searchParams.get('legalEntityId') || searchParams.get('companyCodeId');

  try {
    let rows: any[] = [];
    let table = 'hr_payroll_run_new';
    let legalSafe = true;
    let dbSource = 'db-new';

    try {
      let query = sql`
        SELECT r.id, r.period_year, r.period_month, r.status, r.total_gross, r.total_deductions, r.total_net, r.posted_at, r.created_at,
               le.code as legal_entity_code, le.name as legal_entity_name,
               (SELECT COUNT(*) FROM hr_payroll_line_new WHERE payroll_run_id = r.id) as line_count
        FROM hr_payroll_run_new r
        LEFT JOIN org_legal_entity le ON r.legal_entity_id = le.id
        WHERE 1=1
      `;
      if (search) query = sql`${query} AND (r.period_year ILIKE ${`%${search}%`} OR r.period_month ILIKE ${`%${search}%`})`;
      if (status) query = sql`${query} AND r.status = ${status}::hr_payroll_status_new`;
      if (legalEntityId) query = sql`${query} AND r.legal_entity_id = ${legalEntityId}`;
      query = sql`${query} ORDER BY r.period_year DESC, r.period_month DESC LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];

      for (let i = 0; i < rows.length; i++) {
        try {
          const linesRes = await db.execute(sql`
            SELECT l.*, e.employee_number, e.first_name, e.last_name
            FROM hr_payroll_line_new l
            LEFT JOIN hr_employee_master e ON l.employee_id = e.id
            WHERE l.payroll_run_id = ${rows[i].id}
            ORDER BY e.employee_number
          `);
          rows[i].lines = linesRes.rows;
        } catch {
          rows[i].lines = [];
        }
      }
    } catch (newErr: any) {
      console.warn('hr_payroll_run_new not yet fallback hr_payroll_run:', newErr.message);
      dbSource = 'db-legacy';
      table = 'hr_payroll_run';
      legalSafe = false;

      let query = sql`
        SELECT r.id, r.period_year, r.period_month, r.status, r.total_gross, r.total_deductions, r.total_net, r.posted_at, r.created_at,
               cc.code as legal_entity_code, cc.name as legal_entity_name,
               (SELECT COUNT(*) FROM hr_payroll_line WHERE payroll_run_id = r.id) as line_count
        FROM hr_payroll_run r
        LEFT JOIN org_legal_entity cc ON r.company_code_id = cc.id
        WHERE 1=1
      `;
      if (search) query = sql`${query} AND (r.period_year ILIKE ${`%${search}%`} OR r.period_month ILIKE ${`%${search}%`})`;
      if (status) query = sql`${query} AND r.status = ${status}::payroll_status`;
      if (legalEntityId) query = sql`${query} AND r.company_code_id = ${legalEntityId}`;
      query = sql`${query} ORDER BY r.period_year DESC, r.period_month DESC LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    }

    return NextResponse.json({
      payrollRuns: rows,
      data: rows,
      count: rows.length,
      code: 'HPRC',
      aliasCodes: ['PRC', 'PC00', 'FIN-HR-PR-CR'],
      helperCode: 'HPRC',
      table,
      source: dbSource,
      legalSafe,
      functionDescription: 'Payroll Run – HPRC legal-safe own IP (was PC00) – periodYear 2026 periodMonth 09 legalEntityId LE-1000 was company_code_id status DRAFT/POSTED/PAID/CANCELLED totalGross/totalDeductions/totalNet universalLedgerId FULC was fi_document_id',
      explanation: 'Payroll run legal-safe hr_payroll_run_new – periodYear 2026 periodMonth 09 legalEntityId LE-1000 was company_code_id status DRAFT/POSTED/PAID/CANCELLED totalGross/totalDeductions/totalNet universalLedgerId FULC was fi_document_id postedAt postedBy – Code HPRC primary alias PRC/PC00 – 4-char MOOA H=HR PR=Payroll C=Create – module grouped intuitive, same length as PC00 but own IP – fresh empty but legalEntity/costUnit kept.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  const permCheck = await requirePermission('PAYROLL_RUN');
  if (permCheck) return permCheck;

  try {
    const body = await req.json();
    const { period_year, period_month, legal_entity_id, company_code_id, lines } = body;

    if (!period_year || !period_month) return NextResponse.json({ error: 'period_year and period_month required' }, { status: 400 });

    let legalEntityIdResolved = legal_entity_id || company_code_id;
    if (!legalEntityIdResolved) {
      try {
        const le = await db.execute(sql`SELECT id FROM org_legal_entity LIMIT 1`);
        if (le.rows.length > 0) legalEntityIdResolved = (le.rows[0] as any).id;
      } catch {}
    }

    if (!legalEntityIdResolved) return NextResponse.json({ error: 'legal_entity_id or company_code_id required' }, { status: 400 });

    try {
      const res = await db.execute(sql`
        INSERT INTO hr_payroll_run_new (period_year, period_month, legal_entity_id, company_code_id)
        VALUES (${period_year}, ${period_month}, ${legalEntityIdResolved}, ${legalEntityIdResolved})
        ON CONFLICT (period_year, period_month, legal_entity_id) DO UPDATE SET status = 'DRAFT'
        RETURNING id, period_year, period_month
      `);
      const runId = (res.rows[0] as any).id;

      if (lines && Array.isArray(lines)) {
        let totalGross = 0;
        let totalDeductions = 0;
        let totalNet = 0;

        for (const line of lines) {
          const basic = parseFloat(line.basic_salary || '0');
          const allowances = parseFloat(line.allowances || '0');
          const deductions = parseFloat(line.deductions || '0');
          const overtime = parseFloat(line.overtime || '0');
          const net = basic + allowances + overtime - deductions;

          totalGross += basic + allowances + overtime;
          totalDeductions += deductions;
          totalNet += net;

          await db.execute(sql`
            INSERT INTO hr_payroll_line_new (payroll_run_id, employee_id, basic_salary, allowances, deductions, overtime, net_pay, cost_unit_id, cost_center_id)
            VALUES (${runId}, ${line.employee_id}, ${basic}, ${allowances}, ${deductions}, ${overtime}, ${net}, ${line.cost_unit_id || line.cost_center_id || null}, ${line.cost_unit_id || line.cost_center_id || null})
          `);
        }

        await db.execute(sql`UPDATE hr_payroll_run_new SET total_gross = ${totalGross}, total_deductions = ${totalDeductions}, total_net = ${totalNet} WHERE id = ${runId}`);
      }

      return NextResponse.json({ success: true, payrollRun: res.rows[0], code: 'HPRC', message: `Payroll run ${period_year}-${period_month} created – HPRC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('hr_payroll_run_new insert failed fallback:', newErr.message);
      try {
        const res = await db.execute(sql`
          INSERT INTO hr_payroll_run (period_year, period_month, company_code_id)
          VALUES (${period_year}, ${period_month}, ${legalEntityIdResolved})
          ON CONFLICT (period_year, period_month, company_code_id) DO UPDATE SET status = 'DRAFT'
          RETURNING id, period_year, period_month
        `);
        return NextResponse.json({ success: true, payrollRun: res.rows[0], message: `Payroll run ${period_year}-${period_month} created – PC00 legacy`, legalSafe: false });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  const permCheck = await requirePermission('PAYROLL_RUN');
  if (permCheck) return permCheck;

  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    try {
      const res = await db.execute(sql`UPDATE hr_payroll_run_new SET status = ${status}::hr_payroll_status_new WHERE id = ${id} RETURNING id, period_year, period_month, status`);
      if (res.rows.length === 0) throw new Error('Not found');
      return NextResponse.json({ success: true, payrollRun: res.rows[0], code: 'HPRC', message: `Payroll run ${res.rows[0].period_year}-${res.rows[0].period_month} status ${status} – HPRC legal-safe` });
    } catch {
      const res = await db.execute(sql`UPDATE hr_payroll_run SET status = ${status}::payroll_status WHERE id = ${id} RETURNING id, period_year, period_month, status`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });
      return NextResponse.json({ success: true, payrollRun: res.rows[0], message: `Payroll run ${res.rows[0].period_year}-${res.rows[0].period_month} status ${status} – PC00 legacy` });
    }
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

    try {
      await db.execute(sql`DELETE FROM hr_payroll_run_new WHERE id = ${id}`);
    } catch {
      await db.execute(sql`DELETE FROM hr_payroll_run WHERE id = ${id}`);
    }

    return NextResponse.json({ success: true, code: 'HPRC', message: `Payroll run ${id} deleted – HPRC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
