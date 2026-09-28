/**
 * Payroll Service - FI Document Generation + Payment Clearing
 * Phase 3: Payroll FI Integration & Cost Center Reporting
 * 
 * Requirements:
 * - Auto generate balanced FI doc (BKPF/BSEG) upon approval
 * - Routing: Dr Salary Expense (cost center = employee's cost center) Cr Salaries Payable (Liability)
 * - Test seed: 300 KWD per employee
 * - Payment clearing: Dr Salaries Payable Cr Bank/Cash
 */
import { db, withTransaction } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export interface PayrollRunParams {
  periodYear: string; // e.g., '2026'
  periodMonth: string; // e.g., '09'
  companyCodeId: string;
  createdBy?: string;
}

export class PayrollService {
  /**
   * Create payroll run for period with 300 KWD per active employee (test seed requirement)
   */
  static async createPayrollRun(params: PayrollRunParams) {
    return withTransaction(async (tx) => {
      // Check if already exists for period
      const existing = await tx.execute(sql`
        SELECT id FROM hr_payroll_run 
        WHERE period_year = ${params.periodYear} AND period_month = ${params.periodMonth} AND company_code_id = ${params.companyCodeId}
      `);
      if (existing.rows.length > 0) {
        throw new Error(`Payroll run already exists for ${params.periodYear}-${params.periodMonth}`);
      }

      // Get active employees with cost centers
      const employees = await tx.execute(sql`
        SELECT e.id, e.employee_number, e.first_name, e.last_name, e.basic_salary, e.cost_center_id, cc.code as cost_center_code
        FROM hr_employee e
        LEFT JOIN fi_cost_center cc ON e.cost_center_id = cc.id
        WHERE e.is_active = true AND e.company_code_id = ${params.companyCodeId}
      `);

      if (employees.rows.length === 0) {
        // If no employees, create dummy for test - will be seeded with 300 KWD
        throw new Error('No active employees found for company code. Run seed first.');
      }

      // Create payroll run header - status DRAFT
      const runRes = await tx.execute(sql`
        INSERT INTO hr_payroll_run (period_year, period_month, company_code_id, status, total_gross, total_deductions, total_net)
        VALUES (${params.periodYear}, ${params.periodMonth}, ${params.companyCodeId}, 'DRAFT', 0, 0, 0)
        RETURNING id
      `);
      const runId = (runRes.rows[0] as any).id;

      let totalGross = 0;
      let totalNet = 0;

      // Create payroll lines - use actual employee salary, not hardcoded 300
      // Each employee can have different salary from hr_employee.basic_salary
      for (const emp of employees.rows as any[]) {
        const basicSalary = parseFloat(emp.basic_salary || '0');
        if (basicSalary <= 0) {
          console.warn(`Employee ${emp.employee_number} has 0 salary, skipping or using 0`);
        }
        const allowances = parseFloat(emp.allowances || '0');
        const deductions = parseFloat(emp.deductions || '0');
        const overtime = parseFloat(emp.overtime || '0');
        const netPay = basicSalary + allowances + overtime - deductions;

        await tx.execute(sql`
          INSERT INTO hr_payroll_line (payroll_run_id, employee_id, basic_salary, allowances, deductions, overtime, net_pay, cost_center_id, status)
          VALUES (${runId}, ${emp.id}, ${basicSalary}, ${allowances}, ${deductions}, ${overtime}, ${netPay}, ${emp.cost_center_id}, 'DRAFT')
        `);

        totalGross += basicSalary + allowances + overtime;
        totalNet += netPay;
      }

      await tx.execute(sql`
        UPDATE hr_payroll_run SET total_gross = ${totalGross}, total_net = ${totalNet}, total_deductions = ${totalGross - totalNet}
        WHERE id = ${runId}
      `);

      return {
        payrollRunId: runId,
        period: `${params.periodYear}-${params.periodMonth}`,
        employeeCount: employees.rows.length,
        totalGross,
        totalNet,
        message: `Payroll run created with ${employees.rows.length} employees at 300 KWD each = ${totalGross} KWD total. Ready for approval and FI posting.`,
      };
    });
  }

  /**
   * Approve payroll run and auto-generate balanced FI document
   * Routing: Dr Salary Expense (cost center = employee's cost center) Cr Salaries Payable (Liability)
   * BKPF/BSEG equivalent
   */
  static async approveAndPostFi(payrollRunId: string, approvedBy: string) {
    return withTransaction(async (tx) => {
      const runRes = await tx.execute(sql`
        SELECT id, period_year, period_month, company_code_id, status, total_gross, total_net
        FROM hr_payroll_run WHERE id = ${payrollRunId} FOR UPDATE
      `);
      const run = (runRes.rows[0] as any);
      if (!run) throw new Error('Payroll run not found');
      if (run.status !== 'DRAFT') throw new Error(`Payroll run status is ${run.status}, must be DRAFT to approve`);

      const linesRes = await tx.execute(sql`
        SELECT pl.id, pl.employee_id, pl.basic_salary, pl.allowances, pl.overtime, pl.net_pay, pl.cost_center_id,
               e.first_name, e.last_name, e.employee_number,
               cc.code as cost_center_code
        FROM hr_payroll_line pl
        JOIN hr_employee e ON pl.employee_id = e.id
        LEFT JOIN fi_cost_center cc ON pl.cost_center_id = cc.id
        WHERE pl.payroll_run_id = ${payrollRunId}
      `);

      // Get GL accounts
      const glRes = await tx.execute(sql`
        SELECT id, account_number FROM fi_gl_account 
        WHERE account_number IN ('500000', '210001', '100010')
      `);
      const glMap = new Map((glRes.rows as any[]).map((r: any) => [r.account_number, r.id]));
      const salaryExpenseGlId = glMap.get('500000'); // Salary Expense
      const salaryPayableGlId = glMap.get('210001'); // Salary Payable Liability

      if (!salaryExpenseGlId || !salaryPayableGlId) {
        throw new Error('Required GL accounts not found: 500000 Salary Expense, 210001 Salary Payable. Run seed.');
      }

      // Generate FI document number
      const year = parseInt(run.period_year);
      const nrRes = await tx.execute(sql`
        SELECT current_number + 1 as next_num, prefix
        FROM ent_number_range
        WHERE object_type = 'FI_DOC' AND year = ${year}
        FOR UPDATE
      `);
      let fiDocNumber: string;
      if (nrRes.rows.length > 0) {
        const row = nrRes.rows[0] as any;
        fiDocNumber = `${row.prefix}${String(row.next_num).padStart(10, '0')}`;
        await tx.execute(sql`UPDATE ent_number_range SET current_number = ${row.next_num} WHERE object_type = 'FI_DOC' AND year = ${year}`);
      } else {
        fiDocNumber = `FI-HR-${Date.now()}`;
      }

      // Create FI document header (BKPF)
      const postingDate = new Date(parseInt(run.period_year), parseInt(run.period_month) - 1, 28); // Last day of month
      const docDate = new Date();

      const fiDocRes = await tx.execute(sql`
        INSERT INTO fi_document (document_number, company_code_id, doc_type, posting_date, document_date, reference, header_text, total_debit, total_credit, currency, status, reference_doc_type, reference_doc_id, reference_doc_number, created_by)
        VALUES (${fiDocNumber}, ${run.company_code_id}, 'HR', ${postingDate}, ${docDate}, ${'PAYROLL ' + run.period_year + '-' + run.period_month}, ${'Payroll ' + run.period_year + '-' + run.period_month + ' Salary Expense'}, ${run.total_net}, ${run.total_net}, 'KWD', 'POSTED', 'PAYROLL', ${payrollRunId}, ${run.period_year + '-' + run.period_month}, ${approvedBy})
        RETURNING id
      `);
      const fiDocId = (fiDocRes.rows[0] as any).id;

      // Create FI lines (BSEG) - Dr Salary Expense per cost center, Cr Salaries Payable
      let lineNumber = 10;
      let totalDebit = 0;

      // Group by cost center for aggregated posting (but keep detail per employee for audit)
      const costCenterGroups = new Map<string, { costCenterId: string | null, costCenterCode: string, total: number, employees: any[] }>();

      for (const line of linesRes.rows as any[]) {
        const netPay = parseFloat(line.net_pay);
        const ccId = line.cost_center_id;
        const ccCode = line.cost_center_code || 'UNKNOWN';

        if (!costCenterGroups.has(ccId || 'NULL')) {
          costCenterGroups.set(ccId || 'NULL', { costCenterId: ccId, costCenterCode: ccCode, total: 0, employees: [] });
        }
        const group = costCenterGroups.get(ccId || 'NULL')!;
        group.total += netPay;
        group.employees.push(line);
      }

      // Debit lines: Salary Expense per cost center
      for (const [_, group] of costCenterGroups) {
        await tx.execute(sql`
          INSERT INTO fi_document_line (fi_document_id, line_number, gl_account_id, cost_center_id, debit, credit, text, bp_id)
          VALUES (${fiDocId}, ${lineNumber}, ${salaryExpenseGlId}, ${group.costCenterId}, ${group.total}, 0, ${'Salary Expense ' + group.costCenterCode + ' - ' + run.period_year + '-' + run.period_month + ' (' + group.employees.length + ' empl)'}, null)
        `);
        lineNumber += 10;
        totalDebit += group.total;
      }

      // Credit line: Salaries Payable (liability, aggregated)
      await tx.execute(sql`
        INSERT INTO fi_document_line (fi_document_id, line_number, gl_account_id, cost_center_id, debit, credit, text)
        VALUES (${fiDocId}, ${lineNumber}, ${salaryPayableGlId}, null, 0, ${totalDebit}, ${'Salaries Payable ' + run.period_year + '-' + run.period_month + ' - ' + linesRes.rows.length + ' employees'})
      `);

      // Update payroll run to POSTED
      await tx.execute(sql`
        UPDATE hr_payroll_run 
        SET status = 'POSTED', fi_document_id = ${fiDocId}, posted_at = NOW(), posted_by = ${approvedBy}
        WHERE id = ${payrollRunId}
      `);

      // Update payroll lines to POSTED
      await tx.execute(sql`UPDATE hr_payroll_line SET status = 'POSTED' WHERE payroll_run_id = ${payrollRunId}`);

      // Audit log
      await tx.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, old_values, new_values, changed_by, description)
        VALUES ('hr_payroll_run', ${payrollRunId}, ${run.period_year + '-' + run.period_month}, 'POST', ${JSON.stringify({ status: 'DRAFT' })}::jsonb, ${JSON.stringify({ status: 'POSTED', fi_document: fiDocNumber, total: totalDebit })}::jsonb, ${approvedBy}, ${'Payroll approved and FI posted: Dr Salary Expense (cost center) ' + totalDebit + ' Cr Salaries Payable ' + totalDebit})
      `);

      return {
        payrollRunId,
        fiDocumentId: fiDocId,
        fiDocNumber,
        totalDebit,
        totalCredit: totalDebit,
        costCenterBreakdown: Array.from(costCenterGroups.values()).map(g => ({
          costCenter: g.costCenterCode,
          costCenterId: g.costCenterId,
          total: g.total,
          employeeCount: g.employees.length,
        })),
        message: `Payroll ${run.period_year}-${run.period_month} posted: Dr Salary Expense ${totalDebit} KWD (per cost center) Cr Salaries Payable ${totalDebit} KWD. Balanced FI ${fiDocNumber}.`,
      };
    });
  }

  /**
   * Payment Clearing: Dr Salaries Payable / Cr Bank or Cash
   * Posts actual payment execution after payroll approval
   */
  static async postPaymentClearing(params: {
    payrollRunId: string;
    paymentMethod: 'BANK' | 'CASH';
    bankGlAccountNumber?: string; // e.g., '100010' Cash on Hand, '100011' KNET
    postedBy: string;
    postingDate?: Date;
  }) {
    return withTransaction(async (tx) => {
      const runRes = await tx.execute(sql`
        SELECT id, period_year, period_month, company_code_id, status, total_net, fi_document_id
        FROM hr_payroll_run WHERE id = ${params.payrollRunId} FOR UPDATE
      `);
      const run = (runRes.rows[0] as any);
      if (!run) throw new Error('Payroll run not found');
      if (run.status !== 'POSTED') throw new Error(`Payroll run must be POSTED to clear payment, current status ${run.status}`);

      const glRes = await tx.execute(sql`
        SELECT id, account_number FROM fi_gl_account 
        WHERE account_number IN ('210001', '100010', '100011')
      `);
      const glMap = new Map((glRes.rows as any[]).map((r: any) => [r.account_number, r.id]));
      const salaryPayableGlId = glMap.get('210001');
      const bankGlId = glMap.get(params.bankGlAccountNumber || '100010');

      if (!salaryPayableGlId || !bankGlId) {
        throw new Error('Required GL accounts not found: 210001 Payable, 100010/100011 Bank/Cash');
      }

      // Generate FI doc number for clearing
      const year = parseInt(run.period_year);
      const nrRes = await tx.execute(sql`
        SELECT current_number + 1 as next_num, prefix
        FROM ent_number_range
        WHERE object_type = 'FI_DOC' AND year = ${year}
        FOR UPDATE
      `);
      let fiDocNumber: string;
      if (nrRes.rows.length > 0) {
        const row = nrRes.rows[0] as any;
        fiDocNumber = `${row.prefix}${String(row.next_num).padStart(10, '0')}`;
        await tx.execute(sql`UPDATE ent_number_range SET current_number = ${row.next_num} WHERE object_type = 'FI_DOC' AND year = ${year}`);
      } else {
        fiDocNumber = `FI-PAY-${Date.now()}`;
      }

      const postingDate = params.postingDate || new Date();
      const totalNet = parseFloat(run.total_net);

      const fiDocRes = await tx.execute(sql`
        INSERT INTO fi_document (document_number, company_code_id, doc_type, posting_date, document_date, reference, header_text, total_debit, total_credit, currency, status, reference_doc_type, reference_doc_id, reference_doc_number, created_by)
        VALUES (${fiDocNumber}, ${run.company_code_id}, 'HR', ${postingDate}, ${postingDate}, ${'PAYROLL CLEAR ' + run.period_year + '-' + run.period_month}, ${'Payroll Payment Clearing ' + run.period_year + '-' + run.period_month + ' via ' + params.paymentMethod}, ${totalNet}, ${totalNet}, 'KWD', 'POSTED', 'PAYROLL_CLEARING', ${params.payrollRunId}, ${run.period_year + '-' + run.period_month}, ${params.postedBy})
        RETURNING id
      `);
      const fiDocId = (fiDocRes.rows[0] as any).id;

      // Dr Salaries Payable (clear liability)
      await tx.execute(sql`
        INSERT INTO fi_document_line (fi_document_id, line_number, gl_account_id, debit, credit, text)
        VALUES (${fiDocId}, 10, ${salaryPayableGlId}, ${totalNet}, 0, ${'Clear Salaries Payable ' + run.period_year + '-' + run.period_month})
      `);

      // Cr Bank/Cash
      await tx.execute(sql`
        INSERT INTO fi_document_line (fi_document_id, line_number, gl_account_id, debit, credit, text)
        VALUES (${fiDocId}, 20, ${bankGlId}, 0, ${totalNet}, ${'Payroll Payment ' + run.period_year + '-' + run.period_month + ' via ' + params.paymentMethod})
      `);

      // Update payroll run to PAID
      await tx.execute(sql`
        UPDATE hr_payroll_run SET status = 'PAID' WHERE id = ${params.payrollRunId}
      `);

      await tx.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, old_values, new_values, changed_by, description)
        VALUES ('hr_payroll_run', ${params.payrollRunId}, ${run.period_year + '-' + run.period_month}, 'POST', ${JSON.stringify({ status: 'POSTED' })}::jsonb, ${JSON.stringify({ status: 'PAID', clearing_fi: fiDocNumber, amount: totalNet })}::jsonb, ${params.postedBy}, ${'Payroll payment cleared: Dr Salaries Payable ' + totalNet + ' Cr ' + (params.bankGlAccountNumber || '100010') + ' ' + totalNet})
      `);

      return {
        payrollRunId: params.payrollRunId,
        clearingFiDocId: fiDocId,
        clearingFiDocNumber: fiDocNumber,
        amount: totalNet,
        message: `Payment clearing posted: Dr Salaries Payable ${totalNet} KWD Cr ${params.bankGlAccountNumber || '100010'} ${totalNet} KWD via ${params.paymentMethod}. Payroll ${run.period_year}-${run.period_month} marked PAID.`,
      };
    });
  }

  /**
   * Get payroll run with cost center breakdown for CCA report
   */
  static async getPayrollRunDetails(payrollRunId: string) {
    const runRes = await db.execute(sql`
      SELECT r.*, cc.code as company_code, d.document_number as fi_doc_number
      FROM hr_payroll_run r
      JOIN ent_company_code cc ON r.company_code_id = cc.id
      LEFT JOIN fi_document d ON r.fi_document_id = d.id
      WHERE r.id = ${payrollRunId}
    `);

    const linesRes = await db.execute(sql`
      SELECT pl.*, e.first_name, e.last_name, e.employee_number, cc.code as cost_center_code, cc.name as cost_center_name
      FROM hr_payroll_line pl
      JOIN hr_employee e ON pl.employee_id = e.id
      LEFT JOIN fi_cost_center cc ON pl.cost_center_id = cc.id
      WHERE pl.payroll_run_id = ${payrollRunId}
      ORDER BY cc.code, e.employee_number
    `);

    const fiLinesRes = await db.execute(sql`
      SELECT dl.*, gl.account_number, gl.name as gl_name, cc.code as cost_center_code
      FROM fi_document_line dl
      JOIN fi_gl_account gl ON dl.gl_account_id = gl.id
      LEFT JOIN fi_cost_center cc ON dl.cost_center_id = cc.id
      WHERE dl.fi_document_id = (SELECT fi_document_id FROM hr_payroll_run WHERE id = ${payrollRunId})
      ORDER BY dl.line_number
    `);

    return {
      header: runRes.rows[0],
      lines: linesRes.rows,
      fiLines: fiLinesRes.rows,
    };
  }
}
