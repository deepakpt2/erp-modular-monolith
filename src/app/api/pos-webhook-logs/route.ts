import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * POS Webhook Logs API – Legal-safe own IP – Module 8 SD
 * New: sales_pos_webhook_log (was sd_pos_webhook_log) – source MANUAL/POS_FOODICS/POS_SQUARE/ECOM_SHOPIFY/ECOM_WOOCOM/API, externalId, payload jsonb, headers jsonb, salesOrderId, status PENDING/PROCESSED/FAILED, errorMessage, processingTimeMs
 * Helper code: SPWC POS Webhook Create (alias PWC, FIN-PW-CR) – 4-char MOOA S=Sales P=POS W=Webhook C=Create – module grouped intuitive
 * Fallback to legacy sd_pos_webhook_log
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const source = searchParams.get('source');
  const status = searchParams.get('status');

  try {
    let rows: any[] = [];
    let table = 'sales_pos_webhook_log';
    let legalSafe = true;
    let dbSource = 'db-new';

    try {
      let query = sql`
        SELECT wl.id, wl.source, wl.external_id, wl.status, wl.error_message, wl.processing_time_ms, wl.created_at,
               so.sales_number
        FROM sales_pos_webhook_log wl
        LEFT JOIN sales_order so ON wl.sales_order_id = so.id
        WHERE 1=1
      `;
      if (search) query = sql`${query} AND wl.external_id ILIKE ${`%${search}%`}`;
      if (source) query = sql`${query} AND wl.source = ${source}::sales_source_new`;
      if (status) query = sql`${query} AND wl.status = ${status}`;
      query = sql`${query} ORDER BY wl.created_at DESC LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('sales_pos_webhook_log not yet fallback:', newErr.message);
      dbSource = 'db-legacy';
      table = 'sd_pos_webhook_log';
      legalSafe = false;
      try {
        let query = sql`
          SELECT wl.id, wl.source, wl.external_id, wl.status, wl.error_message, wl.processing_time_ms, wl.created_at,
                 so.sales_number
          FROM sd_pos_webhook_log wl
          LEFT JOIN sd_sales_order so ON wl.sales_order_id = so.id
          WHERE 1=1
        `;
        if (search) query = sql`${query} AND wl.external_id ILIKE ${`%${search}%`}`;
        if (source) query = sql`${query} AND wl.source = ${source}::sales_source`;
        if (status) query = sql`${query} AND wl.status = ${status}`;
        query = sql`${query} ORDER BY wl.created_at DESC LIMIT ${limit}`;
        const res = await db.execute(query);
        rows = res.rows as any[];
      } catch (e: any) {
        if (e.message?.includes('does not exist')) {
          return NextResponse.json({ data: [], webhookLogs: [], count: 0, code: 'SPWC', aliasCodes: ['PWC'], helperCode: 'SPWC', table: 'sales_pos_webhook_log', source: 'none', legalSafe: true, message: 'Table sales_pos_webhook_log not yet migrated – fresh empty Module8' });
        }
        throw e;
      }
    }

    return NextResponse.json({
      data: rows,
      webhookLogs: rows,
      count: rows.length,
      code: 'SPWC',
      aliasCodes: ['PWC', 'FIN-PW-CR'],
      helperCode: 'SPWC',
      table,
      source: dbSource,
      legalSafe,
      functionDescription: 'POS Webhook Log – SPWC legal-safe own IP – source MANUAL/POS_FOODICS/POS_SQUARE/ECOM_SHOPIFY/ECOM_WOOCOM/API, externalId, payload jsonb, status PENDING/PROCESSED/FAILED',
      explanation: 'POS webhook log legal-safe sales_pos_webhook_log – source MANUAL/POS_FOODICS/POS_SQUARE/ECOM_SHOPIFY/ECOM_WOOCOM/API, externalId, payload jsonb, headers jsonb, salesOrderId, status PENDING/PROCESSED/FAILED, errorMessage, processingTimeMs – Code SPWC primary alias PWC – 4-char MOOA S=Sales P=POS W=Webhook C=Create – module grouped intuitive – audit trail for POS integration.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}
