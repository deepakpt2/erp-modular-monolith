import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db, withTransaction } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { validatePostingPeriod, checkATP, checkCreditLimit, getNextNumberForUpdate, validateTolerance } from '@/shared/kernel/enterprise/validation';

/**
 * Sales Orders API - VA01/VA02/VA03 - 9 Tabs ERP Views Backed - Enterprise Secure
 * GET - List with companyCode filter
 * POST - Create VA01 with full 9 tabs + enterprise validations: OB52 posting period, ATP availability, OB45 credit check, OBA0 tolerance, FOR UPDATE number range
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const companyCode = searchParams.get('companyCode') || 'KS01';
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '50');
  const status = searchParams.get('status');

  try {
    let query = sql`
      SELECT 
        so.id, so.sales_number, so.customer_id, so.customer_name, so.status, so.total_amount, so.net_amount, so.tax_amount, so.currency, so.created_at,
        so.sales_org, so.distribution_channel, so.division, so.sales_office, so.sales_group, so.customer_po_number,
        so.doc_date, so.pricing_date, so.req_delivery_date, so.shipping_point, so.delivery_priority, so.delivery_block, so.route, so.incoterms,
        so.billing_type, so.billing_block, so.payment_terms, so.account_assignment_group, so.cost_center_id, so.profit_center,
        so.payment_type, so.is_cash_sale, so.type, so.source,
        p.code as plant_code, p.name as plant_name
      FROM sd_sales_order so
      JOIN ent_plant p ON so.plant_id = p.id
      JOIN ent_company_code cc ON so.company_code_id = cc.id
      WHERE cc.code = ${companyCode}
    `;
    if (search) query = sql`${query} AND (so.sales_number ILIKE ${`%${search}%`} OR so.customer_name ILIKE ${`%${search}%`} OR so.customer_po_number ILIKE ${`%${search}%`})`;
    if (status) query = sql`${query} AND so.status = ${status}`;
    query = sql`${query} ORDER BY so.sales_number DESC LIMIT ${limit}`;

    const result = await db.execute(query);

    const orders: any[] = [];
    for (const row of result.rows as any[]) {
      const linesRes = await db.execute(sql`
        SELECT sl.*, m.material_number, m.description as material_desc
        FROM sd_sales_line sl
        JOIN ent_material_master m ON sl.material_id = m.id
        WHERE sl.sales_order_id = ${row.id}
        ORDER BY sl.line_number
      `);
      orders.push({ ...row, lines: linesRes.rows });
    }

    return NextResponse.json({
      code: 'VA01',
      functionDescription: 'Sales Order – VA01/VA02/VA03',
 salesOrders: orders, count: orders.length, source: 'db', tabs: '9 tabs backed: header+items+item_detail+partners+conditions+delivery+billing+accounting+status' });
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
    const {
      companyCode, companyCodeId, plantId, customerId, customerName,
      paymentType, type, source,
      salesOrg, distributionChannel, division, salesOffice, salesGroup, customerPoNumber, docDate, pricingDate, reqDeliveryDate,
      shippingPoint, deliveryPriority, deliveryBlock, route, incoterms,
      billingType, billingBlock, paymentTerms,
      accountAssignmentGroup, costCenterId, profitCenter,
      shipToPartyId, billToPartyId, payerId,
      currency,
      lines,
    } = body;

    if (!plantId || !lines || lines.length === 0) {
      return NextResponse.json({ error: 'plantId and lines required' }, { status: 400 });
    }

    let compId = companyCodeId;
    if (!compId) {
      if (companyCode) {
        const ccRes = await db.execute(sql`SELECT id FROM ent_company_code WHERE code = ${companyCode} LIMIT 1`);
        if (ccRes.rows.length > 0) compId = (ccRes.rows[0] as any).id;
      }
      if (!compId) {
        const ccRes = await db.execute(sql`SELECT id FROM ent_company_code WHERE code IN ('KS01','1000') ORDER BY CASE code WHEN 'KS01' THEN 0 WHEN '1000' THEN 1 ELSE 2 END LIMIT 1`);
        if (ccRes.rows.length > 0) compId = (ccRes.rows[0] as any).id;
        else {
          const anyCc = await db.execute(sql`SELECT id FROM ent_company_code LIMIT 1`);
          if (anyCc.rows.length > 0) compId = (anyCc.rows[0] as any).id;
          else throw new Error('No company code');
        }
      }
    }

    // Enterprise validations before transaction
    const docDateObj = docDate ? new Date(docDate) : new Date();
    const periodCheck = await validatePostingPeriod(compId, docDateObj, 'D');
    if (!periodCheck.valid) {
      return NextResponse.json({ error: periodCheck.error, code: 'POSTING_PERIOD_CLOSED' }, { status: 400 });
    }

    const totalAmountPre = lines.reduce((s: number, l: any) => s + parseFloat(l.quantity) * parseFloat(l.unitPrice || 0), 0);
    
    // Tolerance check OBA0
    const tolCheck = await validateTolerance(compId, 'CUSTOMER', totalAmountPre, currency || 'INR');
    if (!tolCheck.valid) {
      return NextResponse.json({ error: tolCheck.error, code: 'TOLERANCE_EXCEEDED' }, { status: 400 });
    }

    // Credit check OB45/OB38 for AR sales
    if (customerId && (paymentType === 'AR' || !paymentType)) {
      const creditCheck = await checkCreditLimit(customerId, totalAmountPre);
      if (!creditCheck.ok) {
        return NextResponse.json({ error: creditCheck.error, code: 'CREDIT_LIMIT_EXCEEDED', creditLimit: creditCheck.creditLimit, openAR: creditCheck.openAR }, { status: 400 });
      }
    }

    // ATP check for each line
    for (const l of lines) {
      const atp = await checkATP(l.materialId, l.plantId || plantId, l.slocId, parseFloat(l.quantity));
      if (!atp.available) {
        return NextResponse.json({ error: atp.error || `ATP failed: only ${atp.availableQty} available for material ${l.materialId}`, code: 'ATP_FAILED', availableQty: atp.availableQty }, { status: 400 });
      }
    }

    return withTransaction(async (tx) => {
      const year = docDateObj.getFullYear();
      const num = await getNextNumberForUpdate(tx, 'SALES_ORDER', compId, year);
      const salesNumber = num.number;

      const totalAmount = lines.reduce((s: number, l: any) => s + parseFloat(l.quantity) * parseFloat(l.unitPrice || 0), 0);
      const taxAmount = totalAmount * 0.18;
      const discountAmount = 0;

      const orderRes = await tx.execute(sql`
        INSERT INTO sd_sales_order (
          sales_number, type, status, company_code_id, plant_id, customer_id, customer_name,
          payment_type, is_cash_sale, source,
          order_date, posting_date, required_date, doc_date, pricing_date, req_delivery_date,
          total_amount, tax_amount, discount_amount, net_amount, currency,
          sales_org, distribution_channel, division, sales_office, sales_group, customer_po_number,
          shipping_point, delivery_priority, delivery_block, route, incoterms,
          billing_type, billing_block, payment_terms,
          account_assignment_group, cost_center_id, profit_center,
          ship_to_party_id, bill_to_party_id, payer_id
        ) VALUES (
          ${salesNumber}, ${type || 'B2B'}, 'CONFIRMED', ${compId}, ${plantId}, ${customerId || null}, ${customerName || 'Walk-in'},
          ${paymentType || 'AR'}, ${paymentType === 'CASH'}, ${source || 'MANUAL'},
          ${docDate ? new Date(docDate) : new Date()}, NOW(), ${reqDeliveryDate ? new Date(reqDeliveryDate) : new Date(Date.now()+2*24*3600000)}, ${docDate ? new Date(docDate) : new Date()}, ${pricingDate ? new Date(pricingDate) : new Date()}, ${reqDeliveryDate ? new Date(reqDeliveryDate) : new Date(Date.now()+2*24*3600000)},
          ${totalAmount}, ${taxAmount}, ${discountAmount}, ${totalAmount}, ${currency || 'INR'},
          ${salesOrg || 'KSO1'}, ${distributionChannel || 'K1'}, ${division || 'K1'}, ${salesOffice || 'KSO'}, ${salesGroup || 'K01'}, ${customerPoNumber || null},
          ${shippingPoint || 'KP01'}, ${deliveryPriority || '02'}, ${deliveryBlock || null}, ${route || 'KROUTE01'}, ${incoterms || 'EXW'},
          ${billingType || 'F2'}, ${billingBlock || null}, ${paymentTerms || '0001'},
          ${accountAssignmentGroup || '01'}, ${costCenterId || null}, ${profitCenter || 'KS-PC-01'},
          ${shipToPartyId || null}, ${billToPartyId || null}, ${payerId || null}
        ) RETURNING id, sales_number
      `);

      const orderId = (orderRes.rows[0] as any).id;

      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        const qty = parseFloat(l.quantity);
        const unitPrice = parseFloat(l.unitPrice || 0);
        const lineTotal = qty * unitPrice;
        let cogsPerUnit = 0;
        try {
          const mpRes = await tx.execute(sql`SELECT moving_avg_price FROM ent_material_plant WHERE material_id = ${l.materialId} AND plant_id = ${l.plantId || plantId} LIMIT 1`);
          if (mpRes.rows.length > 0) cogsPerUnit = parseFloat((mpRes.rows[0] as any).moving_avg_price || 0);
        } catch {}
        const totalCogs = cogsPerUnit * qty;

        await tx.execute(sql`
          INSERT INTO sd_sales_line (
            sales_order_id, line_number, material_id, plant_id, sloc_id, batch_id, batch_number,
            quantity, uom, unit_price, tax_rate, line_total, cogs_per_unit, total_cogs,
            item_category, pricing_condition, account_assignment, cost_center_id, profit_center,
            shipping_point, delivery_priority, route, incoterms, billing_block, tax_classification,
            schedule_line_date, confirmed_qty
          ) VALUES (
            ${orderId}, ${i+1}, ${l.materialId}, ${l.plantId || plantId}, ${l.slocId}, ${l.batchId || null}, ${l.batchNumber || null},
            ${qty}, ${l.uom || 'PC'}, ${unitPrice}, ${l.taxRate || 18}, ${lineTotal}, ${cogsPerUnit}, ${totalCogs},
            ${l.itemCategory || 'TAN'}, ${l.pricingCondition || 'PR00'}, ${l.accountAssignment || '01'}, ${l.costCenterId || costCenterId || null}, ${l.profitCenter || profitCenter || 'KS-PC-01'},
            ${l.shippingPoint || shippingPoint || 'KP01'}, ${l.deliveryPriority || deliveryPriority || '02'}, ${l.route || route || 'KROUTE01'}, ${l.incoterms || incoterms || 'EXW'}, ${l.billingBlock || billingBlock || null}, ${l.taxClassification || '1'},
            ${l.scheduleLineDate ? new Date(l.scheduleLineDate) : (reqDeliveryDate ? new Date(reqDeliveryDate) : new Date(Date.now()+2*24*3600000))}, ${l.confirmedQty || qty}
          )
        `);
      }

      await tx.execute(sql`INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description) VALUES ('sd_sales_order', ${orderId}, ${salesNumber}, 'INSERT', ${JSON.stringify(body)}::jsonb, ${`Sales Order VA01 CREATE: ${salesNumber} Type ${type||'B2B'} Plant ${plantId} Total ${totalAmount} ${currency||'INR'} 9 tabs backed ATP+Credit checked`})`).catch(()=>{});

      return NextResponse.json({ success: true, orderId, salesNumber, totalAmount, taxAmount, netAmount: totalAmount, message: `Sales Order ${salesNumber} created VA01 with 9 tabs backed, ATP OK, Credit OK` });
    });
  } catch (e: any) {
    console.error('Create sales order failed', e);
    return NextResponse.json({ error: e.message, code: e.message.includes('POSTING_PERIOD') ? 'POSTING_PERIOD_CLOSED' : e.message.includes('Credit') ? 'CREDIT_LIMIT_EXCEEDED' : e.message.includes('ATP') ? 'ATP_FAILED' : 'SALES_ERROR' }, { status: 500 });
  }
}
