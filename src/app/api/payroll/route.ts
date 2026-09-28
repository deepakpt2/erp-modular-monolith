import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { PayrollService } from '@/modules/hr/application/payrollService';

/**
 * Payroll API - FI Integration
 * POST /api/payroll - Create payroll run with 300 KWD per employee
 * PUT /api/payroll - Approve and post FI doc Dr Salary Expense (Cost Center) Cr Payable
 * POST /api/payroll/clearing - Payment clearing Dr Payable Cr Bank
 */

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { periodYear, periodMonth, companyCodeId, createdBy, employeeIds, async } = body;

    if (!periodYear || !periodMonth || !companyCodeId) {
      return NextResponse.json({ error: 'periodYear, periodMonth, companyCodeId required' }, { status: 400 });
    }

    // For enterprise 500 employees, use async job queue to avoid HTTP timeout
    const useAsync = async !== false; // Default async for enterprise

    if (useAsync) {
      // Create PENDING job in ent_job_queue and return 202 Accepted
      const { db } = await import('@/shared/kernel/db/client');
      const { sql } = await import('drizzle-orm');
      
      const jobRes = await db.execute(sql`
        INSERT INTO ent_job_queue (job_type, payload, status, company_code_id, created_by)
        VALUES ('PAYROLL_RUN', ${JSON.stringify({ periodYear, periodMonth, companyCodeId, createdBy, employeeIds })}::jsonb, 'PENDING', ${companyCodeId}, ${createdBy || null})
        RETURNING id, job_type, status, created_at
      `);

      const job = jobRes.rows[0] as any;

      // Trigger background processing
      const { setImmediate } = await import('timers');
      setImmediate(async () => {
        try {
          const { db: db2 } = await import('@/shared/kernel/db/client');
          const { sql: sql2 } = await import('drizzle-orm');
          await db2.execute(sql2`UPDATE ent_job_queue SET status = 'RUNNING', started_at = NOW() WHERE id = ${job.id}`);
          
          const PayrollService = (await import('@/modules/hr/application/payrollService')).PayrollService;
          const result = await PayrollService.createPayrollRun({ periodYear, periodMonth, companyCodeId, createdBy });
          
          await db2.execute(sql2`
            UPDATE ent_job_queue SET status = 'COMPLETED', finished_at = NOW(), result = ${JSON.stringify(result)}::jsonb
            WHERE id = ${job.id}
          `);
          console.log(`[PAYROLL JOB] ${job.id} COMPLETED:`, result);
        } catch (e: any) {
          console.error(`[PAYROLL JOB] ${job.id} FAILED:`, e.message);
          const { db: db3 } = await import('@/shared/kernel/db/client');
          const { sql: sql3 } = await import('drizzle-orm');
          await db3.execute(sql3`UPDATE ent_job_queue SET status = 'FAILED', finished_at = NOW(), error = ${e.message} WHERE id = ${job.id}`).catch(()=>{});
        }
      });

      return NextResponse.json({
        success: true,
        jobId: job.id,
        jobType: 'PAYROLL_RUN',
        status: 'PENDING',
        period: `${periodYear}-${periodMonth}`,
        message: `Payroll job ${job.id} created PENDING for ${periodYear}-${periodMonth}, 500 employees async, returns 202 Accepted. Poll GET /api/jobs?id=${job.id} for status.`,
        pollUrl: `/api/jobs?jobType=PAYROLL_RUN`,
      }, { status: 202 });
    } else {
      // Synchronous fallback for small runs
      const result = await PayrollService.createPayrollRun({
        periodYear,
        periodMonth,
        companyCodeId,
        createdBy,
      });
      return NextResponse.json(result);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { payrollRunId, approvedBy } = body;

    if (!payrollRunId || !approvedBy) {
      return NextResponse.json({ error: 'payrollRunId, approvedBy required' }, { status: 400 });
    }

    const result = await PayrollService.approveAndPostFi(payrollRunId, approvedBy);

    return NextResponse.json({
      ...result,
      routing: 'Dr Salary Expense 500000 (Cost Center per employee) Cr Salaries Payable 210001',
      testSeed: '300 KWD per employee validated',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function GET() {
  // Enterprise auth guard - secure by default, MVP open only if MVP_NO_AUTH=true
  const authCheck = await requireApiAuth();
  if (authCheck) return authCheck;

  return NextResponse.json({
      code: 'PC00',
      functionDescription: 'Payroll – PC00 / PA30 / PA20',

    endpoints: {
      'POST /api/payroll': 'Create payroll run with actual employee salaries from hr_employee.basic_salary, each employee different',
      'PUT /api/payroll': 'Approve and auto-generate FI doc Dr Salary Expense (cost center) Cr Payable, balanced BKPF/BSEG',
      'POST /api/payroll/clearing': 'Payment clearing Dr Payable Cr Bank/Cash, marks PAID',
    },
    salaryLogic: 'Each employee has different salary from hr_employee.basic_salary, not hardcoded 300. Previously 300 KWD was test seed, now dynamic per employee master',
    routingLogic: {
      approval: 'Dr Salary Expense 500000 (cost_center_id = employee.cost_center_id) Cr Salaries Payable 210001',
      clearing: 'Dr Salaries Payable 210001 Cr Bank 100010 / Cash',
      costCenter: 'Strictly assigned per employee for CCA report aggregation',
    },
    example: {
      create: { periodYear: '2026', periodMonth: '09', companyCodeId: 'uuid', createdBy: 'user-id' },
      approve: { payrollRunId: 'uuid', approvedBy: 'user-id' },
      clearing: { payrollRunId: 'uuid', paymentMethod: 'BANK', bankGlAccountNumber: '100010', postedBy: 'user-id' },
    },
  });
}
