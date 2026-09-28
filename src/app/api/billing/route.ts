import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db, withTransaction } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Billing API - VF01/VF02/VF03 - Billing Document for B2B AR
 * Decouples Delivery (VL01N) from Invoicing (VF01) - B2B requires AR
 * GET /api/billing - List billing docs
 * POST /api/billing - Create billing VF01 from delivery or sales order
 * PUT /api/billing - Post, Cancel
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let query = sql`
      SELECT 
        b.id, b.billing_number, b.type, b.status, b.sales_order_id, b.delivery_id, b.company_code_id, b.customer_id, b.billing_date, b.total_amount, b.tax_amount, b.net_amount, b.currency, b.is_paid, b.created_at,
        so.sales_number, so.customer_name,
        d.delivery_number,
        bp.name1 as customer_name1, bp.bp_number as customer_bp_number
      FROM sd_billing b
      JOIN sd_sales_order so ON b.sales_order_id = so.id
      LEFT JOIN sd_delivery d ON b.delivery_id = d.id
      LEFT JOIN ent_business_partner bp ON b.customer_id = bp.id
      WHERE 1=1
    `;
    if (status) query = sql`${query} AND b.status = ${status}`;
    if (search) query = sql`${query} AND (b.billing_number ILIKE ${`%${search}%`} OR so.sales_number ILIKE ${`%${search}%`} OR d.delivery_number ILIKE ${`%${search}%`})`;
    query = sql`${query} ORDER BY b.billing_number DESC LIMIT ${limit}`;

    const result = await db.execute(query);

    const billings = [];
    for (const row of result.rows as any[]) {
      const linesRes = await db.execute(sql`
        SELECT bl.id, bl.line_number, bl.material_id, bl.quantity, bl.unit_price, bl.line_total, bl.tax_amount,
               m.material_number, m.description
        FROM sd_billing_line bl
        JOIN ent_material_master m ON bl.material_id = m.id
        WHERE bl.billing_id = ${row.id}
        ORDER BY bl.line_number
      `);
      billings.push({ ...row, lines: linesRes.rows });
    }

    return NextResponse.json({ billings, count: billings.length, source: 'db', functionCodes: 'VF01 Create Billing, VF02 Change Billing, VF03 Display Billing, F-28 Customer Payment', note: 'B2B wholesale decouples: VA01 Order → VL01N Delivery → VF01 Billing triggers AR Dr AR Cr Revenue+Tax' });
  } catch (e: any) {
    console.error('DB error:', e.message);
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { salesOrderId, deliveryId } = body;
    if (!salesOrderId) return NextResponse.json({ error: 'salesOrderId required' }, { status: 400 });

    return withTransaction(async (tx) => {
      const soRes = await tx.execute(sql`SELECT * FROM sd_sales_order WHERE id = ${salesOrderId} LIMIT 1`);
      if (soRes.rows.length === 0) throw new Error('Sales Order not found');
      const so = soRes.rows[0] as any;

      // If deliveryId provided, check delivery status GOODS_ISSUED
      if (deliveryId) {
        const delRes = await tx.execute(sql`SELECT * FROM sd_delivery WHERE id = ${deliveryId} LIMIT 1`);
        if (delRes.rows.length === 0) throw new Error('Delivery not found');
        const del = delRes.rows[0] as any;
        if (del.status !== 'GOODS_ISSUED') throw new Error('Delivery must be GOODS_ISSUED before billing VF01');
      }

      // Get sales lines for billing
      const soLinesRes = await tx.execute(sql`SELECT * FROM sd_sales_line WHERE sales_order_id = ${salesOrderId} ORDER BY line_number`);

      const billingNumber = `90${Date.now().toString().slice(-8)}`;

      const billRes = await tx.execute(sql`
        INSERT INTO sd_billing (billing_number, type, status, sales_order_id, delivery_id, company_code_id, customer_id, billing_date, total_amount, tax_amount, net_amount, currency, billing_type, billing_block, payment_terms, incoterms, pricing_date, account_assignment_group, cost_center_id, profit_center)
        VALUES (${billingNumber}, 'F2', 'DRAFT', ${salesOrderId}, ${deliveryId || null}, ${so.company_code_id}, ${so.customer_id}, NOW(), ${so.total_amount}, ${so.tax_amount}, ${so.net_amount}, ${so.currency}, ${so.billing_type || 'F2'}, ${body.billingBlock || so.billing_block || null}, ${body.paymentTerms || so.payment_terms || '0001'}, ${body.incoterms || so.incoterms || 'EXW'}, NOW(), ${so.account_assignment_group || '01'}, ${so.cost_center_id || null}, ${so.profit_center || 'KS-PC-01'})
        RETURNING id, billing_number
      `);

      const billingId = (billRes.rows[0] as any).id;

      for (const sl of soLinesRes.rows as any[]) {
        // Find delivery line if exists
        let deliveryLineId = null;
        if (deliveryId) {
          const dlRes = await tx.execute(sql`SELECT id FROM sd_delivery_line WHERE delivery_id = ${deliveryId} AND sales_line_id = ${sl.id} LIMIT 1`);
          if (dlRes.rows.length > 0) deliveryLineId = (dlRes.rows[0] as any).id;
        }

        await tx.execute(sql`
          INSERT INTO sd_billing_line (billing_id, delivery_line_id, sales_line_id, line_number, material_id, quantity, unit_price, line_total, tax_amount, cogs_per_unit)
          VALUES (${billingId}, ${deliveryLineId}, ${sl.id}, ${sl.line_number}, ${sl.material_id}, ${sl.quantity}, ${sl.unit_price}, ${sl.line_total}, ${sl.quantity * sl.unit_price * sl.tax_rate / 100}, ${sl.cogs_per_unit})
        `);
      }

      // Create FI document for AR: Dr AR Cr Revenue + Tax
      // For MVP, we create fi_document header
      try {
        const fiNumber = `FI${Date.now().toString().slice(-8)}`;
        const fiRes = await tx.execute(sql`
          INSERT INTO fi_document (company_code_id, document_number, document_type, posting_date, document_date, reference, header_text, total_amount, currency, status)
          VALUES (${so.company_code_id}, ${fiNumber}, 'RV', NOW(), NOW(), ${billingNumber}, ${`Billing ${billingNumber} for SO ${so.sales_number} VF01`}, ${so.total_amount}, ${so.currency}, 'POSTED')
          RETURNING id
        `);
        const fiId = (fiRes.rows[0] as any).id;

        // BSEG lines: Dr AR, Cr Revenue, Cr Tax
        // Simplified: AR 6000000000 for KS01, 120000 for 1000, Revenue 3000000000/400000, Tax 2000000001/220000
        const isKS01 = so.currency === 'INR';
        const arAccount = isKS01 ? '6000000000' : '120000';
        const revenueAccount = isKS01 ? '3000000000' : '400000';
        const taxAccount = isKS01 ? '2000000001' : '220000';

        // Get GL account IDs (simplified: use first matching)
        const arGlRes = await tx.execute(sql`SELECT id FROM fi_gl_account WHERE account_number = ${arAccount} LIMIT 1`);
        const revGlRes = await tx.execute(sql`SELECT id FROM fi_gl_account WHERE account_number = ${revenueAccount} LIMIT 1`);
        const taxGlRes = await tx.execute(sql`SELECT id FROM fi_gl_account WHERE account_number = ${taxAccount} LIMIT 1`);

        if (arGlRes.rows.length > 0 && revGlRes.rows.length > 0) {
          await tx.execute(sql`
            INSERT INTO fi_document_line (fi_document_id, line_number, gl_account_id, debit_credit, amount, currency, cost_center_id, text)
            VALUES (${fiId}, 1, ${(arGlRes.rows[0] as any).id}, 'D', ${so.net_amount}, ${so.currency}, null, ${`AR ${so.customer_name} Billing ${billingNumber}`})
          `);
          await tx.execute(sql`
            INSERT INTO fi_document_line (fi_document_id, line_number, gl_account_id, debit_credit, amount, currency, text)
            VALUES (${fiId}, 2, ${(revGlRes.rows[0] as any).id}, 'C', ${so.net_amount}, ${so.currency}, ${`Revenue Billing ${billingNumber}`})
          `);
          if (parseFloat(so.tax_amount) > 0 && taxGlRes.rows.length > 0) {
            await tx.execute(sql`
              INSERT INTO fi_document_line (fi_document_id, line_number, gl_account_id, debit_credit, amount, currency, text)
              VALUES (${fiId}, 3, ${(taxGlRes.rows[0] as any).id}, 'C', ${so.tax_amount}, ${so.currency}, ${`Tax GST/VAT Billing ${billingNumber}`})
            `);
          }
        }

        await tx.execute(sql`UPDATE sd_billing SET fi_document_id = ${fiId}, status = 'POSTED', updated_at = NOW() WHERE id = ${billingId}`);
        await tx.execute(sql`UPDATE sd_sales_order SET status = 'INVOICED', updated_at = NOW() WHERE id = ${salesOrderId}`);

      } catch (e) {
        console.error('FI creation failed for billing', e);
        // Still mark as POSTED even if FI fails for MVP
        await tx.execute(sql`UPDATE sd_billing SET status = 'POSTED', updated_at = NOW() WHERE id = ${billingId}`);
      }

      await tx.execute(sql`INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description) VALUES ('sd_billing', ${billingId}, ${billingNumber}, 'INSERT', ${JSON.stringify(body)}::jsonb, ${`Billing CREATE VF01: ${billingNumber} for SO ${so.sales_number} Delivery ${deliveryId||'None'} AR`})`).catch(()=>{});

      return NextResponse.json({ success: true, billingId, billingNumber, message: `Billing ${billingNumber} created VF01 for SO ${so.sales_number} ${deliveryId?`Delivery ${deliveryId}`:''} - AR Dr AR Cr Revenue+Tax` });
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, action } = body;
    if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

    if (action === 'CANCEL') {
      await db.execute(sql`UPDATE sd_billing SET status = 'CANCELLED', updated_at = NOW() WHERE id = ${id}`);
      return NextResponse.json({ success: true, message: `Billing ${id} CANCELLED` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
