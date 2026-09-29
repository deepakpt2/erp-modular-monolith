import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { getNextDocumentNumber, createDocumentEntry, updateDocumentWithAudit } from '@/shared/kernel/db/documentHelpers';

/**
 * Sales Orders API – Legal-safe own IP – Module 8 SD Sales & Distribution
 * New: sales_order + sales_order_line (was sd_sales_order + sd_sales_line) – salesNumber SO-10000001, type B2B/B2C_CASH/B2C_CARD/POS_WEBHOOK/ECOM, status DRAFT/CONFIRMED/PARTIALLY_ISSUED/FULLY_ISSUED/INVOICED/CANCELLED, legalEntityId was company_code_id, facilityId FAC-1000 was plant_id, partnerId SCUC was customer_id, customerName cash sales, paymentType CASH/CARD/KNET/AR/ONLINE, isCashSale Dr Cash Cr Revenue vs Dr AR Cr Revenue, source MANUAL/POS_FOODICS/POS_SQUARE/ECOM_SHOPIFY/ECOM_WOOCOM/API, externalId POS external order ID, orderDate/postingDate/requiredDate, totalAmount/taxAmount/discountAmount/netAmount currencyCode INR default was KWD, universalLedgerId FULC was fi_document_id Revenue+COGS+AR/Cash, commercialOrgId CO-1000 was sales_org KSO1, salesChannelId CH-10 was distribution_channel K1, productLineId PL-00 was division K1, shippingPoint DP-1000 was KP01 VL01N, deliveryPriority 02, route ROUTE-01 was KROUTE01, billingType F2, paymentTerms 0001, shipToPartnerId billToPartnerId payerPartnerId, costUnitId ECUC was cost_center profitUnitId EPUC was profit_center, itemId EMTC was material_id FERT, facilityId, inventoryLocationId was sloc_id, lotId ELTC was batch_id, lotNumber was batch_number, uomCode EUOC was uom, taxRuleId FTXC was tax_code
 * Helper code: SSOC Sales Order Create (alias SOC, VA01, FIN-SO-CR) – 4-char MOOA S=Sales, SO=SalesOrder, C=Create – same length as VA01 but own IP, module grouped, intuitive
 * Fallback to legacy sd_sales_order
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const facilityId = searchParams.get('facilityId') || searchParams.get('plantId');
  const status = searchParams.get('status');
  const partnerId = searchParams.get('partnerId') || searchParams.get('customerId');
  const source = searchParams.get('source');

  try {
    let rows: any[] = [];
    let dbSource = 'db-new';
    let table = 'sales_order';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT 
          so.id, so.sales_number, so.type, so.status, so.order_date, so.posting_date, so.required_date,
          so.total_amount, so.tax_amount, so.discount_amount, so.net_amount, so.currency_code as currency,
          so.customer_name, so.is_cash_sale, so.payment_type, so.source, so.external_id,
          so.customer_po_number, so.shipping_point, so.delivery_priority, so.route, so.incoterms, so.billing_type, so.payment_terms,
          f.code as plant_code, f.name as plant_name,
          f.code as facility_code, f.name as facility_name,
          pa.account_number as customer_number, pa.display_name as customer_name_display,
          co.code as commercial_org_code, sc.code as sales_channel_code, pl.code as product_line_code,
          le.code as company_code, le.code as legal_entity_code,
          (SELECT COUNT(*) FROM sales_order_line WHERE sales_order_id = so.id) as line_count
        FROM sales_order so
        LEFT JOIN org_facility f ON so.facility_id = f.id
        LEFT JOIN partner_account pa ON so.partner_id = pa.id
        LEFT JOIN org_legal_entity le ON so.legal_entity_id = le.id
        LEFT JOIN org_commercial_org co ON so.commercial_org_id = co.id
        LEFT JOIN org_sales_channel sc ON so.sales_channel_id = sc.id
        LEFT JOIN org_product_line pl ON so.product_line_id = pl.id
        WHERE 1=1
      `;

      if (search) query = sql`${query} AND (so.sales_number ILIKE ${`%${search}%`} OR pa.display_name ILIKE ${`%${search}%`} OR so.customer_name ILIKE ${`%${search}%`} OR so.customer_po_number ILIKE ${`%${search}%`})`;
      if (facilityId) query = sql`${query} AND (so.facility_id = ${facilityId} OR so.plant_id = ${facilityId})`;
      if (status) query = sql`${query} AND so.status = ${status}::sales_order_status_new`;
      if (partnerId) query = sql`${query} AND so.partner_id = ${partnerId}`;
      if (source) query = sql`${query} AND so.source = ${source}::sales_source_new`;

      query = sql`${query} ORDER BY so.order_date DESC LIMIT ${limit}`;

      const res = await db.execute(query);
      rows = res.rows as any[];

      for (let i = 0; i < rows.length; i++) {
        try {
          const linesRes = await db.execute(sql`
            SELECT sl.*, pi.item_number as material_number, pi.name as material_description, pi.item_number, pi.name as item_name
            FROM sales_order_line sl
            LEFT JOIN prod_item pi ON sl.item_id = pi.id
            WHERE sl.sales_order_id = ${rows[i].id}
            ORDER BY sl.line_number
          `);
          rows[i].lines = linesRes.rows;
        } catch {
          rows[i].lines = [];
        }
      }
    } catch (newErr: any) {
      console.warn('sales_order not yet fallback sd_sales_order:', newErr.message);
      dbSource = 'db-legacy';
      table = 'sd_sales_order';
      legalSafe = false;

      let query = sql`
        SELECT 
          so.id, so.sales_number, so.type, so.status, so.order_date, so.posting_date, so.required_date,
          so.total_amount, so.tax_amount, so.discount_amount, so.net_amount, so.currency,
          so.customer_name, so.is_cash_sale, so.payment_type, so.source, so.external_id,
          so.customer_po_number, so.shipping_point, so.delivery_priority, so.route, so.incoterms, so.billing_type, so.payment_terms,
          p.code as plant_code, p.name as plant_name,
          bp.bp_number as customer_number, bp.name1 as customer_name_display,
          so.sales_org as commercial_org_code, so.distribution_channel as sales_channel_code, so.division as product_line_code,
          cc.code as company_code,
          (SELECT COUNT(*) FROM sd_sales_line WHERE sales_order_id = so.id) as line_count
        FROM sd_sales_order so
        LEFT JOIN ent_plant p ON so.plant_id = p.id
        LEFT JOIN ent_business_partner bp ON so.customer_id = bp.id
        LEFT JOIN ent_company_code cc ON so.company_code_id = cc.id
        WHERE 1=1
      `;

      if (search) query = sql`${query} AND (so.sales_number ILIKE ${`%${search}%`} OR bp.name1 ILIKE ${`%${search}%`} OR so.customer_name ILIKE ${`%${search}%`})`;
      if (facilityId) query = sql`${query} AND so.plant_id = ${facilityId}`;
      if (status) query = sql`${query} AND so.status = ${status}::sales_order_status`;
      if (partnerId) query = sql`${query} AND so.customer_id = ${partnerId}`;
      if (source) query = sql`${query} AND so.source = ${source}::sales_source`;

      query = sql`${query} ORDER BY so.order_date DESC LIMIT ${limit}`;

      const res = await db.execute(query);
      rows = res.rows as any[];
    }

    return NextResponse.json({
      salesOrders: rows,
      count: rows.length,
      code: 'SSOC',
      aliasCodes: ['SOC', 'VA01', 'FIN-SO-CR'],
      helperCode: 'SSOC',
      table,
      source: dbSource,
      legalSafe,
      functionDescription: 'Sales Order – SSOC legal-safe own IP (was VA01) – salesNumber SO-10000001, facilityId FAC-1000 was plant_id, partnerId SCUC was customer_id, itemId EMTC was material_id, uomCode EUOC, inventoryLocationId was sloc_id, lotId ELTC was batch_id, taxRuleId FTXC was tax_code, currencyCode INR default was KWD, commercialOrg CO-1000 was sales_org, salesChannel CH-10 was distribution_channel, productLine PL-00 was division, shippingPoint DP-1000 was KP01',
      explanation: 'Sales order legal-safe sales_order + sales_order_line – salesNumber SO-10000001, type B2B/B2C_CASH/B2C_CARD/POS_WEBHOOK/ECOM, status DRAFT/CONFIRMED/PARTIALLY_ISSUED/FULLY_ISSUED/INVOICED/CANCELLED, legalEntityId was company_code_id, facilityId FAC-1000 was plant_id, partnerId SCUC was customer_id, paymentType CASH/CARD/KNET/AR/ONLINE, isCashSale, source MANUAL/POS_FOODICS/POS_SQUARE/ECOM_SHOPIFY/ECOM_WOOCOM/API, currencyCode INR default was KWD, commercialOrgId CO-1000 was sales_org, salesChannelId CH-10 was distribution_channel, productLineId PL-00 was division, shippingPoint DP-1000 was KP01, itemId EMTC was material_id FERT, inventoryLocationId was sloc_id, lotId ELTC was batch_id, uomCode EUOC, taxRuleId FTXC was tax_code – Code SSOC primary alias SOC/VA01 – 4-char MOOA S=Sales SO=SalesOrder C=Create – module grouped intuitive, same length as VA01 but own IP.',
    });
  } catch (e: any) {
    console.error('sales-orders API fatal, returning empty to avoid 500 on home:', e.message);
    return NextResponse.json({
      salesOrders: [],
      count: 0,
      code: 'SSOC',
      aliasCodes: ['SOC', 'VA01'],
      helperCode: 'SSOC',
      table: 'sales_order',
      source: 'error-fallback',
      legalSafe: true,
      error: e.message,
      message: 'Sales orders fetch failed but returned empty to avoid 500 on home – SSOC legal-safe – run db:init-prod',
    });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    // SAP-like unique document number – FNDC – auto-generate from FNRC if not provided
    let order_number = body.order_number;
    if (!order_number) {
      try {
        const next = await getNextDocumentNumber('SO', body.company_code || body.legal_entity_code || '1000');
        order_number = next.document_number;
      } catch { order_number = `SO-${Date.now()}`; }
    }
    const { facility_id, plant_id, facility_code, plant_code, legal_entity_code, company_code, partner_id, customer_id, partner_number, customer_number, customer_name, type, payment_type, source, external_id, required_date, customer_po_number, shipping_point, delivery_priority, route, incoterms, billing_type, payment_terms, commercial_org_id, sales_org, sales_channel_id, distribution_channel, product_line_id, division, lines, currency_code } = body;

    let facilityIdResolved = facility_id || plant_id;
    if (!facilityIdResolved && (facility_code || plant_code)) {
      try {
        const f = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${facility_code || plant_code} LIMIT 1`);
        if (f.rows.length > 0) facilityIdResolved = (f.rows[0] as any).id;
      } catch {}
    }

    let legalEntityIdResolved = null;
    const finalLegalCode = legal_entity_code || company_code;
    if (finalLegalCode) {
      try {
        const le = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code = ${finalLegalCode} LIMIT 1`);
        if (le.rows.length > 0) legalEntityIdResolved = (le.rows[0] as any).id;
      } catch {}
    }

    let partnerIdResolved = partner_id || customer_id;
    if (!partnerIdResolved && (partner_number || customer_number)) {
      try {
        const pa = await db.execute(sql`SELECT id FROM partner_account WHERE account_number = ${partner_number || customer_number} LIMIT 1`);
        if (pa.rows.length > 0) partnerIdResolved = (pa.rows[0] as any).id;
      } catch {}
    }

    if (!facilityIdResolved) return NextResponse.json({ error: 'facility_id/facility_code or plant_id/plant_code required' }, { status: 400 });

    let salesNumber = body.sales_number;
    if (!salesNumber) {
      try {
        const nrRes = await db.execute(sql`SELECT current_number, prefix FROM core_number_range WHERE object_type = 'SALES_ORDER'::core_nr_object_type ORDER BY fiscal_year DESC LIMIT 1`);
        if (nrRes.rows.length > 0) {
          const current = parseInt((nrRes.rows[0] as any).current_number) + 1;
          const prefix = (nrRes.rows[0] as any).prefix || 'SO-';
          salesNumber = `${prefix}${current}`;
          await db.execute(sql`UPDATE core_number_range SET current_number = ${current}, updated_at = NOW() WHERE object_type = 'SALES_ORDER'::core_nr_object_type`);
        } else {
          salesNumber = `SO-${Date.now()}`;
        }
      } catch {
        salesNumber = `SO-${Date.now()}`;
      }
    }

    try {
      const res = await db.execute(sql`
        INSERT INTO sales_order (sales_number, type, legal_entity_id, company_code_id, facility_id, plant_id, partner_id, customer_id, customer_name, payment_type, source, external_id, required_date, customer_po_number, shipping_point, delivery_priority, route, incoterms, billing_type, payment_terms, commercial_org_id, sales_org, sales_channel_id, distribution_channel, product_line_id, division, currency_code, currency)
        VALUES (${salesNumber}, ${type || 'B2B'}::sales_order_type_new, ${legalEntityIdResolved || null}, ${legalEntityIdResolved || null}, ${facilityIdResolved}, ${facilityIdResolved}, ${partnerIdResolved || null}, ${partnerIdResolved || null}, ${customer_name || null}, ${payment_type || 'AR'}::sales_payment_type_new, ${source || 'MANUAL'}::sales_source_new, ${external_id || null}, ${required_date ? new Date(required_date) : null}, ${customer_po_number || null}, ${shipping_point || 'DP-1000'}, ${delivery_priority || '02'}, ${route || 'ROUTE-01'}, ${incoterms || 'EXW'}, ${billing_type || 'F2'}, ${payment_terms || '0001'}, ${commercial_org_id || null}, ${sales_org || null}, ${sales_channel_id || null}, ${distribution_channel || null}, ${product_line_id || null}, ${division || null}, ${currency_code || 'INR'}, ${currency_code || 'INR'})
        RETURNING id, sales_number
      `);
      const salesId = (res.rows[0] as any).id;

      if (lines && Array.isArray(lines)) {
        let total = 0;
        let taxTotal = 0;
        let discountTotal = 0;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          let itemId = line.item_id || line.material_id;
          if (!itemId && line.item_number) {
            try {
              const it = await db.execute(sql`SELECT id FROM prod_item WHERE item_number = ${line.item_number} LIMIT 1`);
              if (it.rows.length > 0) itemId = (it.rows[0] as any).id;
            } catch {}
          }
          if (!itemId) continue;

          let invLocId = line.inventory_location_id || line.sloc_id;
          const qty = parseFloat(line.quantity || '0');
          const unitPrice = parseFloat(line.unit_price || line.unitPrice || '0');
          const discount = parseFloat(line.discount_per_unit || '0');
          const lineTotal = qty * (unitPrice - discount);
          total += lineTotal;

          await db.execute(sql`
            INSERT INTO sales_order_line (sales_order_id, line_number, item_id, material_id, facility_id, plant_id, inventory_location_id, sloc_id, lot_id, batch_id, lot_number, batch_number, quantity, uom_code, uom, unit_price, discount_per_unit, line_total)
            VALUES (${salesId}, ${line.line_number || i + 10}, ${itemId}, ${itemId}, ${facilityIdResolved}, ${facilityIdResolved}, ${invLocId || null}, ${invLocId || null}, ${line.lot_id || line.batch_id || null}, ${line.lot_id || line.batch_id || null}, ${line.lot_number || line.batch_number || null}, ${line.lot_number || line.batch_number || null}, ${qty}, ${line.uom_code || line.uom || 'PC'}, ${line.uom_code || line.uom || 'PC'}, ${unitPrice}, ${discount}, ${lineTotal})
          `);
        }

        await db.execute(sql`UPDATE sales_order SET total_amount = ${total}, net_amount = ${total}, tax_amount = ${taxTotal}, discount_amount = ${discountTotal} WHERE id = ${salesId}`);
      }

      return NextResponse.json({ success: true, salesOrder: res.rows[0], salesNumber, code: 'SSOC', message: `Sales order ${salesNumber} created – SSOC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('sales_order insert failed:', newErr.message);
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
      const docNum = body.order_number || body.document_number || body.id;
      if (docNum) await updateDocumentWithAudit({ document_number: docNum, new_payload: body, changed_by: 'system', action: 'UPDATE' });
    } catch (auditErr) { console.warn('Audit trail failed', auditErr); }
    const { id, sales_number, status } = body;
    if (!id && !sales_number) return NextResponse.json({ error: 'id or sales_number required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE sales_order SET status = ${status}::sales_order_status_new, updated_at = NOW() WHERE id = ${id} RETURNING id, sales_number, status`);
      else res = await db.execute(sql`UPDATE sales_order SET status = ${status}::sales_order_status_new, updated_at = NOW() WHERE sales_number = ${sales_number} RETURNING id, sales_number, status`);
      if (res.rows.length === 0) throw new Error('Not found in sales_order');
      return NextResponse.json({ success: true, salesOrder: res.rows[0], code: 'SSOC', message: `Sales order ${res.rows[0].sales_number} status ${status} – SSOC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE sd_sales_order SET status = ${status}::sales_order_status, updated_at = NOW() WHERE id = ${id} RETURNING id, sales_number, status`);
      else res = await db.execute(sql`UPDATE sd_sales_order SET status = ${status}::sales_order_status, updated_at = NOW() WHERE sales_number = ${sales_number} RETURNING id, sales_number, status`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Sales order not found' }, { status: 404 });
      return NextResponse.json({ success: true, salesOrder: res.rows[0], message: `Sales order ${res.rows[0].sales_number} status ${status} – VA01 legacy` });
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
    const sales_number = searchParams.get('sales_number');
    if (!id && !sales_number) return NextResponse.json({ error: 'id or sales_number required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM sales_order WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM sales_order WHERE sales_number = ${sales_number}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM sd_sales_order WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM sd_sales_order WHERE sales_number = ${sales_number}`);
    }

    return NextResponse.json({ success: true, code: 'SSOC', message: `Sales order ${sales_number || id} deleted – SSOC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
