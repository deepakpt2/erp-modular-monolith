/**
 * Cost Center Report (CCA) Engine
 * Aggregates expenses by fi_cost_center from three sources:
 * 1. MM/POS COGS (movement 601 postings to GBB account)
 * 2. HR Payroll Runs (Salary expenses mapped to cost center)
 * 3. Direct FI/AP Invoices (overhead/utilities posted directly against cost center)
 * 
 * Supports hierarchical grouping (Cost Center -> GL Account) and period filtering
 */
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export interface CcaReportParams {
  companyCodeId: string;
  year: number;
  month?: number; // 1-12, optional for yearly view
  costCenterId?: string; // Optional filter for single cost center
  fromDate?: Date;
  toDate?: Date;
}

export interface CcaReportRow {
  costCenterId: string;
  costCenterCode: string;
  costCenterName: string;
  glAccountId: string;
  glAccountNumber: string;
  glAccountName: string;
  glAccountType: string;
  source: 'COGS' | 'PAYROLL' | 'DIRECT_FI' | 'AP_INVOICE';
  totalDebit: number;
  totalCredit: number;
  netAmount: number; // debit - credit for expense
  transactionCount: number;
  periodYear: number;
  periodMonth: number;
}

export interface CcaHierarchicalRow {
  costCenterId: string;
  costCenterCode: string;
  costCenterName: string;
  totalAmount: number;
  transactionCount: number;
  glAccounts: {
    glAccountId: string;
    glAccountNumber: string;
    glAccountName: string;
    source: string;
    amount: number;
    count: number;
    details: CcaReportRow[];
  }[];
}

export class CostCenterReportService {
  /**
   * Unified CCA report aggregating from 3 sources
   */
  static async getCcaReport(params: CcaReportParams): Promise<{ rows: CcaReportRow[]; hierarchical: CcaHierarchicalRow[]; summary: any }> {
    const { companyCodeId, year, month, costCenterId, fromDate, toDate } = params;

    // Build date filter
    let dateFilter = sql`EXTRACT(YEAR FROM d.posting_date) = ${year}`;
    if (month) {
      dateFilter = sql`${dateFilter} AND EXTRACT(MONTH FROM d.posting_date) = ${month}`;
    }
    if (fromDate) {
      dateFilter = sql`${dateFilter} AND d.posting_date >= ${fromDate}`;
    }
    if (toDate) {
      dateFilter = sql`${dateFilter} AND d.posting_date <= ${toDate}`;
    }

    let costCenterFilter = sql`true`;
    if (costCenterId) {
      costCenterFilter = sql`dl.cost_center_id = ${costCenterId}`;
    }

    // Query 1: COGS from MM/POS (GBB account, movement 601, sales orders)
    // Source: fi_document_line where gl is GBB/COGS and cost_center_id not null and reference_doc_type SALES_ORDER or GR
    const cogsQuery = sql`
      SELECT 
        dl.cost_center_id,
        cc.code as cost_center_code,
        cc.name as cost_center_name,
        dl.gl_account_id,
        gl.account_number as gl_account_number,
        gl.name as gl_account_name,
        gl.account_type as gl_account_type,
        'COGS' as source,
        SUM(dl.debit) as total_debit,
        SUM(dl.credit) as total_credit,
        SUM(dl.debit - dl.credit) as net_amount,
        COUNT(*) as transaction_count,
        EXTRACT(YEAR FROM d.posting_date)::int as period_year,
        EXTRACT(MONTH FROM d.posting_date)::int as period_month
      FROM fi_document_line dl
      JOIN fi_document d ON dl.fi_document_id = d.id
      JOIN fi_gl_account gl ON dl.gl_account_id = gl.id
      JOIN fi_cost_center cc ON dl.cost_center_id = cc.id
      WHERE d.company_code_id = ${companyCodeId}
        AND ${dateFilter}
        AND ${costCenterFilter}
        AND dl.cost_center_id IS NOT NULL
        AND gl.account_number IN ('300000', '300001') -- COGS accounts (GBB)
        AND d.doc_type IN ('RV', 'WE') -- RV = sales, WE = goods receipt
      GROUP BY dl.cost_center_id, cc.code, cc.name, dl.gl_account_id, gl.account_number, gl.name, gl.account_type, period_year, period_month
    `;

    // Query 2: Payroll (HR)
    const payrollQuery = sql`
      SELECT 
        dl.cost_center_id,
        cc.code as cost_center_code,
        cc.name as cost_center_name,
        dl.gl_account_id,
        gl.account_number as gl_account_number,
        gl.name as gl_account_name,
        gl.account_type as gl_account_type,
        'PAYROLL' as source,
        SUM(dl.debit) as total_debit,
        SUM(dl.credit) as total_credit,
        SUM(dl.debit - dl.credit) as net_amount,
        COUNT(*) as transaction_count,
        EXTRACT(YEAR FROM d.posting_date)::int as period_year,
        EXTRACT(MONTH FROM d.posting_date)::int as period_month
      FROM fi_document_line dl
      JOIN fi_document d ON dl.fi_document_id = d.id
      JOIN fi_gl_account gl ON dl.gl_account_id = gl.id
      JOIN fi_cost_center cc ON dl.cost_center_id = cc.id
      WHERE d.company_code_id = ${companyCodeId}
        AND ${dateFilter}
        AND ${costCenterFilter}
        AND dl.cost_center_id IS NOT NULL
        AND gl.account_number = '500000' -- Salary Expense
        AND d.doc_type = 'HR' -- HR payroll docs
      GROUP BY dl.cost_center_id, cc.code, cc.name, dl.gl_account_id, gl.account_number, gl.name, gl.account_type, period_year, period_month
    `;

    // Query 3: Direct FI/AP Invoices (overhead, utilities posted directly against cost center outside MM)
    const directFiQuery = sql`
      SELECT 
        dl.cost_center_id,
        cc.code as cost_center_code,
        cc.name as cost_center_name,
        dl.gl_account_id,
        gl.account_number as gl_account_number,
        gl.name as gl_account_name,
        gl.account_type as gl_account_type,
        CASE 
          WHEN d.doc_type = 'RE' THEN 'AP_INVOICE'
          ELSE 'DIRECT_FI'
        END as source,
        SUM(dl.debit) as total_debit,
        SUM(dl.credit) as total_credit,
        SUM(dl.debit - dl.credit) as net_amount,
        COUNT(*) as transaction_count,
        EXTRACT(YEAR FROM d.posting_date)::int as period_year,
        EXTRACT(MONTH FROM d.posting_date)::int as period_month
      FROM fi_document_line dl
      JOIN fi_document d ON dl.fi_document_id = d.id
      JOIN fi_gl_account gl ON dl.gl_account_id = gl.id
      JOIN fi_cost_center cc ON dl.cost_center_id = cc.id
      WHERE d.company_code_id = ${companyCodeId}
        AND ${dateFilter}
        AND ${costCenterFilter}
        AND dl.cost_center_id IS NOT NULL
        AND gl.account_type = 'EXPENSE'
        AND gl.account_number NOT IN ('300000', '300001', '500000') -- Exclude COGS and Payroll already covered
        AND d.doc_type IN ('SA', 'RE', 'AB') -- SA=GL, RE=Invoice, AB=Asset
      GROUP BY dl.cost_center_id, cc.code, cc.name, dl.gl_account_id, gl.account_number, gl.name, gl.account_type, source, period_year, period_month
    `;

    // Union all three sources
    const combinedQuery = sql`
      ${cogsQuery}
      UNION ALL
      ${payrollQuery}
      UNION ALL
      ${directFiQuery}
      ORDER BY cost_center_code, gl_account_number
    `;

    const result = await db.execute(combinedQuery);
    const rows = result.rows as any[];

    // Transform to hierarchical: Cost Center -> GL Accounts
    const hierarchicalMap = new Map<string, CcaHierarchicalRow>();

    for (const row of rows as any[]) {
      const ccId = row.cost_center_id || row.costCenterId;
      const ccCode = row.cost_center_code || row.costCenterCode;
      const ccName = row.cost_center_name || row.costCenterName;
      const glId = row.gl_account_id || row.glAccountId;
      const glNum = row.gl_account_number || row.glAccountNumber;
      const glName = row.gl_account_name || row.glAccountName;
      const netAmt = row.net_amount || row.netAmount || '0';
      const txCount = row.transaction_count || row.transactionCount || '0';

      if (!hierarchicalMap.has(ccId)) {
        hierarchicalMap.set(ccId, {
          costCenterId: ccId,
          costCenterCode: ccCode,
          costCenterName: ccName,
          totalAmount: 0,
          transactionCount: 0,
          glAccounts: [],
        });
      }

      const ccGroup = hierarchicalMap.get(ccId)!;
      ccGroup.totalAmount += parseFloat(netAmt || '0');
      ccGroup.transactionCount += parseInt(txCount || '0');

      // Find or create GL account group
      let glGroup = ccGroup.glAccounts.find(g => g.glAccountId === glId && g.source === row.source);
      if (!glGroup) {
        glGroup = {
          glAccountId: glId,
          glAccountNumber: glNum,
          glAccountName: glName,
          source: row.source,
          amount: 0,
          count: 0,
          details: [],
        };
        ccGroup.glAccounts.push(glGroup);
      }

      glGroup.amount += parseFloat(netAmt || '0');
      glGroup.count += parseInt(txCount || '0');
      glGroup.details.push(row);
    }

    const hierarchical = Array.from(hierarchicalMap.values());

    // Summary
    const summary = {
      totalCostCenters: hierarchical.length,
      totalAmount: hierarchical.reduce((sum, cc) => sum + cc.totalAmount, 0),
      totalTransactions: hierarchical.reduce((sum, cc) => sum + cc.transactionCount, 0),
      bySource: {
        COGS: rows.filter(r => r.source === 'COGS').reduce((sum, r) => sum + parseFloat(r.net_amount || '0'), 0),
        PAYROLL: rows.filter(r => r.source === 'PAYROLL').reduce((sum, r) => sum + parseFloat(r.net_amount || '0'), 0),
        DIRECT_FI: rows.filter(r => r.source === 'DIRECT_FI').reduce((sum, r) => sum + parseFloat(r.net_amount || '0'), 0),
        AP_INVOICE: rows.filter(r => r.source === 'AP_INVOICE').reduce((sum, r) => sum + parseFloat(r.net_amount || '0'), 0),
      },
      period: { year, month: month || 'ALL', fromDate, toDate },
    };

    return { rows, hierarchical, summary };
  }

  /**
   * Detailed drill-down for a cost center and GL account
   */
  static async getCostCenterDetails(params: {
    companyCodeId: string;
    costCenterId: string;
    glAccountId?: string;
    year: number;
    month?: number;
  }) {
    const { companyCodeId, costCenterId, glAccountId, year, month } = params;

    let dateFilter = sql`EXTRACT(YEAR FROM d.posting_date) = ${year}`;
    if (month) {
      dateFilter = sql`${dateFilter} AND EXTRACT(MONTH FROM d.posting_date) = ${month}`;
    }

    let glFilter = sql`true`;
    if (glAccountId) {
      glFilter = sql`dl.gl_account_id = ${glAccountId}`;
    }

    const query = sql`
      SELECT 
        d.id as fi_doc_id,
        d.document_number,
        d.doc_type,
        d.posting_date,
        d.header_text,
        d.reference_doc_type,
        d.reference_doc_number,
        dl.line_number,
        dl.debit,
        dl.credit,
        (dl.debit - dl.credit) as net_amount,
        gl.account_number,
        gl.name as gl_name,
        cc.code as cost_center_code,
        dl.text as line_text
      FROM fi_document_line dl
      JOIN fi_document d ON dl.fi_document_id = d.id
      JOIN fi_gl_account gl ON dl.gl_account_id = gl.id
      JOIN fi_cost_center cc ON dl.cost_center_id = cc.id
      WHERE d.company_code_id = ${companyCodeId}
        AND dl.cost_center_id = ${costCenterId}
        AND ${dateFilter}
        AND ${glFilter}
        AND dl.cost_center_id IS NOT NULL
      ORDER BY d.posting_date DESC, d.document_number, dl.line_number
    `;

    const result = await db.execute(query);
    return result.rows;
  }

  /**
   * Mock data for UI demo when DB not available (sandbox)
   */
  static getMockCcaData() {
    const costCenters = [
      { id: 'cc-1', code: 'CC-KITCHEN-01', name: 'Main Kitchen' },
      { id: 'cc-2', code: 'CC-COLD-01', name: 'Cold Storage' },
      { id: 'cc-3', code: 'CC-SALES-01', name: 'Sales / Shop Floor' },
      { id: 'cc-4', code: 'CC-ADMIN-01', name: 'Administration' },
      { id: 'cc-5', code: 'CC-PURCH-01', name: 'Purchasing' },
    ];

    const glAccounts = [
      { id: 'gl-1', number: '300000', name: 'COGS - Food', type: 'EXPENSE', source: 'COGS' as const },
      { id: 'gl-2', number: '500000', name: 'Salary Expense', type: 'EXPENSE', source: 'PAYROLL' as const },
      { id: 'gl-3', number: '500001', name: 'Freight Expense', type: 'EXPENSE', source: 'DIRECT_FI' as const },
      { id: 'gl-4', number: '500002', name: 'Customs Expense', type: 'EXPENSE', source: 'DIRECT_FI' as const },
      { id: 'gl-5', number: '500003', name: 'Utility - Electricity', type: 'EXPENSE', source: 'AP_INVOICE' as const },
      { id: 'gl-6', number: '500004', name: 'Utility - Water', type: 'EXPENSE', source: 'AP_INVOICE' as const },
    ];

    const hierarchical = costCenters.map(cc => {
      const ccGlAccounts = glAccounts.map(gl => {
        const baseAmount = cc.code === 'CC-KITCHEN-01' ? 1500 : cc.code === 'CC-SALES-01' ? 800 : 300;
        const variance = Math.random() * 500;
        const amount = baseAmount + variance + (gl.source === 'PAYROLL' ? 900 : 0); // Payroll 300 KWD per employee * 3 = 900 for kitchen
        
        return {
          glAccountId: gl.id,
          glAccountNumber: gl.number,
          glAccountName: gl.name,
          source: gl.source,
          amount,
          count: Math.floor(Math.random() * 20 + 5),
          details: [] as any[],
        };
      });

      return {
        costCenterId: cc.id,
        costCenterCode: cc.code,
        costCenterName: cc.name,
        totalAmount: ccGlAccounts.reduce((sum, g) => sum + g.amount, 0),
        transactionCount: ccGlAccounts.reduce((sum, g) => sum + g.count, 0),
        glAccounts: ccGlAccounts,
      };
    });

    const summary = {
      totalCostCenters: hierarchical.length,
      totalAmount: hierarchical.reduce((sum, cc) => sum + cc.totalAmount, 0),
      totalTransactions: hierarchical.reduce((sum, cc) => sum + cc.transactionCount, 0),
      bySource: {
        COGS: hierarchical.reduce((sum, cc) => sum + cc.glAccounts.filter(g => g.source === 'COGS').reduce((s, g) => s + g.amount, 0), 0),
        PAYROLL: hierarchical.reduce((sum, cc) => sum + cc.glAccounts.filter(g => g.source === 'PAYROLL').reduce((s, g) => s + g.amount, 0), 0),
        DIRECT_FI: hierarchical.reduce((sum, cc) => sum + cc.glAccounts.filter(g => g.source === 'DIRECT_FI').reduce((s, g) => s + g.amount, 0), 0),
        AP_INVOICE: hierarchical.reduce((sum, cc) => sum + cc.glAccounts.filter(g => g.source === 'AP_INVOICE').reduce((s, g) => s + g.amount, 0), 0),
      },
      period: { year: 2026, month: 9 },
    };

    return { hierarchical, summary };
  }
}
