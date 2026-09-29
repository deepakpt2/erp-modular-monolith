import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { getNextDocumentNumber, createDocumentEntry, updateDocumentWithAudit } from '@/shared/kernel/db/documentHelpers';

/**
 * Billing API – Legal-safe own IP – Module 8 SD
 * New: sales_billing + sales_billing_line (was sd_billing + sd_billing_line) – billingNumber BILL-90000001 was 90*, type F2/F1/CREDIT/DEBIT, status DRAFT/POSTED/CANCELLED, salesOrderId, deliveryId, legalEntityId was company_code_id, partnerId SCUC was customer_id, billingDate, totalAmount/taxAmount/netAmount currencyCode INR default was KWD, universalLedgerId FULC was fi_document_id Dr AR Cr Revenue+Tax, dueDate isPaid, billingType F2, billingBlock, paymentTerms 0001, incoterms EXW, pricingDate, accountAssignmentGroup 01 costUnitId ECUC profitUnitId EPUC, line: billingId deliveryLineId salesLineId lineNumber itemId EMTC was material_id quantity unitPrice lineTotal taxAmount cogsPerUnit
 * Helper code: SBLC Billing Create (alias BLC, VF01, FIN-BL-CR) – 4-char MOOA S=Sales B=Billing L? Actually SBLC = Sales Billing Create – module grouped intuitive, same length as VF01 but own IP
 * Fallback to legacy sd_billing
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const salesOrderId = searchParams.get('salesOrderId') || searchParams.get('sales_order_id');
  const partnerId = searchParams.get('partnerId') || searchParams.get('customerId');

  try {
    let rows: any[] = [];
    let dbSource = 'db-new';
    let table = 'sales_billing';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT 
          b.id, b.billing_number, b.type, b.status, b.billing_date, b.total_amount, b.tax_amount, b.net_amount, b.currency_code as currency,
          b.billing_type, b.billing_block, b.payment_terms, b.incoterms, b.due_date, b.is_paid,
          so.sales_number,
          d.delivery_number,
          pa.account_number as customer_number, pa.display_name as customer_name,
          le.code as company_code, le.code as legal_entity_code,
          (SELECT COUNT(*) FROM sales_billing_line WHERE billing_id = b.id) as line_count
        FROM sales_billing b
        LEFT JOIN sales_order so ON b.sales_order_id = so.id
        LEFT JOIN sales_delivery d ON b.delivery_id = d.id
        LEFT JOIN partner_account pa ON b.partner_id = pa.id
        LEFT JOIN org_legal_entity le ON b.legal_entity_id = le.id
        WHERE 1=1
      `;

      if (search) query = sql`${query} AND b.billing_number ILIKE ${`%${search}%`}`;
      if (status) query = sql`${query} AND b.status = ${status}::sales_billing_status_new`;
      if (salesOrderId) query = sql`${query} AND b.sales_order_id = ${salesOrderId}`;
      if (partnerId) query = sql`${query} AND b.partner_id = ${partnerId}`;

      query = sql`${query} ORDER BY b.billing_date DESC LIMIT ${limit}`;

      const res = await db.execute(query);
      rows = res.rows as any[];

      for (let i = 0; i < rows.length; i++) {
        try {
          const linesRes = await db.execute(sql`
            SELECT bl.*, pi.item_number, pi.name as item_name
            FROM sales_billing_line bl
            LEFT JOIN prod_item pi ON bl.item_id = pi.id
            WHERE bl.billing_id = ${rows[i].id}
            ORDER BY bl.line_number
          `);
          rows[i].lines = linesRes.rows;
        } catch {
          rows[i].lines = [];
        }
      }
    } catch (newErr: any) {
      console.warn('sales_billing not yet fallback sd_billing:', newErr.message);
      dbSource = 'db-legacy';
      table = 'sd_billing';
      legalSafe = false;

      let query = sql`
        SELECT 
          b.id, b.billing_number, b.type, b.status, b.billing_date, b.total_amount, b.tax_amount, b.net_amount, b.currency,
          b.billing_type, b.billing_block, b.payment_terms, b.incoterms, b.due_date, b.is_paid,
          so.sales_number,
          d.delivery_number,
          bp.bp_number as customer_number, bp.name1 as customer_name,
          cc.code as company_code,
          (SELECT COUNT(*) FROM sd_billing_line WHERE billing_id = b.id) as line_count
        FROM sd_billing b
        LEFT JOIN sd_sales_order so ON b.sales_order_id = so.id
        LEFT JOIN sd_delivery d ON b.delivery_id = d.id
        LEFT JOIN ent_business_partner bp ON b.customer_id = bp.id
        LEFT JOIN ent_company_code cc ON b.company_code_id = cc.id
        WHERE 1=1
      `;

      if (search) query = sql`${query} AND b.billing_number ILIKE ${`%${search}%`}`;
      if (status) query = sql`${query} AND b.status = ${status}::billing_status`;
      if (salesOrderId) query = sql`${query} AND b.sales_order_id = ${salesOrderId}`;
      if (partnerId) query = sql`${query} AND b.customer_id = ${partnerId}`;

      query = sql`${query} ORDER BY b.billing_date DESC LIMIT ${limit}`;

      const res = await db.execute(query);
      rows = res.rows as any[];
    }

    return NextResponse.json({
      billings: rows,
      count: rows.length,
      code: 'SBLC',
      aliasCodes: ['BLC', 'VF01', 'FIN-BL-CR'],
      helperCode: 'SBLC',
      table,
      source: dbSource,
      legalSafe,
      functionDescription: 'Billing – SBLC legal-safe own IP (was VF01) – billingNumber BILL-90000001 was 90*, salesOrderId, deliveryId, legalEntityId was company_code_id, partnerId SCUC was customer_id, currencyCode INR default was KWD, itemId EMTC was material_id',
      explanation: 'Billing legal-safe sales_billing – billingNumber BILL-90000001 was 90* Billing, type F2/F1/CREDIT/DEBIT, status DRAFT/POSTED/CANCELLED, salesOrderId, deliveryId, legalEntityId was company_code_id, partnerId SCUC was customer_id, billingDate, totalAmount/taxAmount/netAmount currencyCode INR default was KWD, universalLedgerId FULC was fi_document_id Dr AR Cr Revenue+Tax, dueDate isPaid, billingType F2, paymentTerms 0001, itemId EMTC was material_id, quantity unitPrice lineTotal taxAmount cogsPerUnit – Code SBLC primary alias BLC/VF01 – 4-char MOOA S=Sales B=Billing C=Create – module grouped intuitive, same length as VF01 but own IP.',
    });
  } catch (e: any) {
    console.error('Billing API fatal, returning empty to avoid 500:', e.message);
    return NextResponse.json({
      billings: [],
      count: 0,
      code: 'SBLC',
      aliasCodes: ['BLC', 'VF01'],
      helperCode: 'SBLC',
      table: 'sales_billing',
      source: 'error-fallback',
      legalSafe: true,
      error: e.message,
      message: 'Billing fetch failed but returned empty to avoid 500 – SBLC legal-safe',
    });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { sales_order_id, salesOrderId, delivery_id, deliveryId, partner_id, customer_id, partnerId, type, billing_type, payment_terms, incoterms, billing_block, due_date, lines, currency_code } = body;

    const finalSalesOrderId = sales_order_id || salesOrderId;
    if (!finalSalesOrderId) return NextResponse.json({ error: 'sales_order_id required' }, { status: 400 });

    let partnerIdResolved = partner_id || customer_id || partnerId;
    if (!partnerIdResolved) {
      try {
        const so = await db.execute(sql`SELECT partner_id, customer_id FROM sales_order WHERE id = ${finalSalesOrderId} LIMIT 1`);
        if (so.rows.length > 0) partnerIdResolved = (so.rows[0] as any).partner_id || (so.rows[0] as any).customer_id;
      } catch {}
    }

    let billingNumber = body.billing_number;
    if (!billingNumber) {
      try {
        const nrRes = await db.execute(sql`SELECT current_number, prefix FROM core_number_range WHERE object_type = 'BILLING'::core_nr_object_type ORDER BY fiscal_year DESC LIMIT 1`);
        if (nrRes.rows.length > 0) {
          const current = parseInt((nrRes.rows[0] as any).current_number) + 1;
          const prefix = (nrRes.rows[0] as any).prefix || 'BILL-';
          billingNumber = `${prefix}${current}`;
          await db.execute(sql`UPDATE core_number_range SET current_number = ${current}, updated_at = NOW() WHERE object_type = 'BILLING'::core_nr_object_type`);
        } else {
          billingNumber = `BILL-90000001`;
        }
      } catch {
        billingNumber = `BILL-${Date.now()}`;
      }
    }

    try {
      const res = await db.execute(sql`
        INSERT INTO sales_billing (billing_number, type, sales_order_id, delivery_id, partner_id, customer_id, billing_type, billing_block, payment_terms, incoterms, due_date, currency_code, currency)
        VALUES (${billingNumber}, ${type || 'F2'}::sales_billing_type_new, ${finalSalesOrderId}, ${delivery_id || deliveryId || null}, ${partnerIdResolved || null}, ${partnerIdResolved || null}, ${billing_type || 'F2'}, ${billing_block || null}, ${payment_terms || '0001'}, ${incoterms || 'EXW'}, ${due_date ? new Date(due_date) : null}, ${currency_code || 'INR'}, ${currency_code || 'INR'})
        RETURNING id, billing_number
      `);
      const billingId = (res.rows[0] as any).id;

      if (lines && Array.isArray(lines)) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          await db.execute(sql`
            INSERT INTO sales_billing_line (billing_id, delivery_line_id, sales_line_id, line_number, item_id, material_id, quantity, unit_price, line_total, tax_amount, cogs_per_unit)
            VALUES (${billingId}, ${line.delivery_line_id || line.deliveryLineId || null}, ${line.sales_line_id || line.salesLineId}, ${line.line_number || i + 10}, ${line.item_id || line.material_id}, ${line.item_id || line.material_id}, ${line.quantity || '0'}, ${line.unit_price || line.unitPrice || '0'}, ${line.line_total || line.lineTotal || '0'}, ${line.tax_amount || '0'}, ${line.cogs_per_unit || '0'})
          `);
        }
      }

      return NextResponse.json({ success: true, billing: res.rows[0], billingNumber, code: 'SBLC', message: `Billing ${billingNumber} created – SBLC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('sales_billing insert failed:', newErr.message);
      return NextResponse.json({ error: newErr.message }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    // Immutable audit trail – log before update
    try {
      const docNum = body.billing_number || body.document_number || body.id;
      if (docNum) await updateDocumentWithAudit({ document_number: docNum, new_payload: body, changed_by: 'system', action: 'UPDATE' });
    } catch (auditErr) { console.warn('Audit trail failed', auditErr); }
    const { id, billing_number, status } = body;
    if (!id && !billing_number) return NextResponse.json({ error: 'id or billing_number required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE sales_billing SET status = ${status}::sales_billing_status_new, updated_at = NOW() WHERE id = ${id} RETURNING id, billing_number, status`);
      else res = await db.execute(sql`UPDATE sales_billing SET status = ${status}::sales_billing_status_new, updated_at = NOW() WHERE billing_number = ${billing_number} RETURNING id, billing_number, status`);
      if (res.rows.length === 0) throw new Error('Not found');
      return NextResponse.json({ success: true, billing: res.rows[0], code: 'SBLC', message: `Billing ${res.rows[0].billing_number} status ${status} – SBLC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE sd_billing SET status = ${status}::billing_status, updated_at = NOW() WHERE id = ${id} RETURNING id, billing_number, status`);
      else res = await db.execute(sql`UPDATE sd_billing SET status = ${status}::billing_status, updated_at = NOW() WHERE billing_number = ${billing_number} RETURNING id, billing_number, status`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Billing not found' }, { status: 404 });
      return NextResponse.json({ success: true, billing: res.rows[0], message: `Billing ${res.rows[0].billing_number} status ${status} – VF01 legacy` });
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
    const billing_number = searchParams.get('billing_number');
    if (!id && !billing_number) return NextResponse.json({ error: 'id or billing_number required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM sales_billing WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM sales_billing WHERE billing_number = ${billing_number}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM sd_billing WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM sd_billing WHERE billing_number = ${billing_number}`);
    }

    return NextResponse.json({ success: true, code: 'SBLC', message: `Billing ${billing_number || id} deleted – SBLC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
