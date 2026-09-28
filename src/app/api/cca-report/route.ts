import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { CostCenterReportService } from '@/modules/fico/application/costCenterReportService';

/**
 * Cost Center Report API - CCA Engine
 * Aggregates from 3 sources: COGS (GBB) + Payroll (300 KWD) + Direct FI/AP
 */

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { companyCodeId, year, month, costCenterId, fromDate, toDate } = body;

    if (!companyCodeId || !year) {
      return NextResponse.json({ error: 'companyCodeId, year required' }, { status: 400 });
    }

    const result = await CostCenterReportService.getCcaReport({
      companyCodeId,
      year,
      month,
      costCenterId,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });

    return NextResponse.json({ ...result, source: 'db' });
  } catch (e: any) {
    console.error('CCA report failed:', e.message);
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
  }
}

export async function GET() {
  // Enterprise auth guard - secure by default, MVP open only if MVP_NO_AUTH=true
  const authCheck = await requireApiAuth();
  if (authCheck) return authCheck;

  const mock = CostCenterReportService.getMockCcaData();
  return NextResponse.json({
      code: 'KSB1',
      functionDescription: 'Cost Center Actuals – KSB1',

    description: 'Cost Center Report (CCA) Engine - Aggregates 3 sources by fi_cost_center',
    sources: {
      COGS: 'MM/POS COGS movement 601 postings to GBB account 300000/300001, fi_document_line with cost_center_id, doc_type RV/WE',
      PAYROLL: 'HR Payroll Runs 300 KWD per employee mapped to department/cost center, gl 500000 Salary Expense, doc_type HR',
      DIRECT_FI: 'Direct FI postings overhead/utilities outside MM, gl expense type not COGS/Payroll, doc_type SA',
      AP_INVOICE: 'AP Invoices overhead posted directly against cost center, doc_type RE',
    },
    query: 'UNION ALL 3 queries GROUP BY cost_center_id, gl_account_id, period, hierarchical transform CC→GL',
    periodFiltering: 'WHERE EXTRACT(YEAR/MONTH FROM posting_date) = year/month, supports yearly (month ALL) and monthly',
    hierarchicalGrouping: 'Cost Center header row with +/− toggle, GL account children indented, virtualized flatRows',
    ui: 'VirtualDataGrid @tanstack/react-virtual + @tanstack/react-table, 5 CC, 6 GL, 600+ tx aggregated',
    mockSummary: mock.summary,
    exampleRequest: {
      companyCodeId: 'uuid',
      year: 2026,
      month: 9,
      costCenterId: 'optional uuid for single CC',
    },
  });
}
