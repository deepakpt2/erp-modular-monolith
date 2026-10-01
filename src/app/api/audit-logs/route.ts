import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { AuditLogService } from '@/modules/audit/application/auditLogService';

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { tableName, recordId, userId, action, fromDate, toDate, limit, offset } = body;

    const logs = await AuditLogService.queryAuditLogs({
      tableName,
      recordId,
      userId,
      action,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      limit,
      offset,
    });

    return NextResponse.json({ logs, count: logs.length, source: 'db' });
  } catch (e: any) {
    console.error('Audit log query failed:', e.message);
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
  }
}

export async function GET() {
  // Enterprise auth guard - secure by default, MVP open only if MVP_NO_AUTH=true
  const authCheck = await requireApiAuth();
  if (authCheck) return authCheck;

  return NextResponse.json({
      code: 'SM20',
      functionDescription: 'Audit Log – SM20',

    description: 'System-Wide Audit Log WORM-lite - old_data and new_data JSON for critical tables',
    criticalTables: ['fin_universal_ledger (FUNL own IP legacy BKPF/BSEG)', 'inv_stock (quantity, status)', 'pi_document (status, variance)', 'proc_purchase_order (status, total, delivery_completed legacy ELIKZ)'],
    wormLite: 'Append-only, INSERT only, no UPDATE/DELETE on audit_log, captures old_values::jsonb, new_values::jsonb, changed_fields array, transaction_id groups changes',
    queryFilters: 'table_name, record_id, user_id, action, fromDate, toDate, limit, offset',
    ui: 'Centralized virtualized grid @tanstack/react-virtual 500 rows → 22 DOM, query by table_name, record_id, user_id, shows old_data JSON red and new_data JSON green, changed_fields, description',
    exampleRequest: {
      tableName: 'fin_universal_ledger',
      recordId: 'rec-1000',
      userId: 'user-100',
      action: 'POST',
      limit: 100,
    },
  });
}
