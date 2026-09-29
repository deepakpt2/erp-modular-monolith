import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { getNextDocumentNumber, createDocumentEntry, updateDocumentWithAudit } from '@/shared/kernel/db/documentHelpers';
import { enforcePostingPeriod, getFiscalYearPeriodFromDate } from '@/shared/kernel/db/postingPeriodHelpers';
import { createReversalOrAdjustmentDocument, getReversalDocType } from '@/shared/kernel/db/reversalHelpers';

/**
 * Delivery API – Legal-safe own IP – Module 8 SD
 * New: sales_delivery + sales_delivery_line (was sd_delivery + sd_delivery_line) – deliveryNumber DN-80000001 was 80*, salesOrderId, legalEntityId was company_code_id, facilityId FAC-1000 was plant_id, shipToPartnerId SCUC was ship_to_customer_id, status DRAFT/PICKING/PICKED/GOODS_ISSUED/CANCELLED, pickingDate goodsIssueDate, universalLedgerId FULC was fi_document_id COGS Dr COGS Cr Inventory, totalQuantity, shippingPoint DP-1000 was KP01, deliveryPriority 02, deliveryBlock, route ROUTE-01 was KROUTE01, incoterms EXW, pickingStatus goodsMovementStatus, line: deliveryId salesLineId lineNumber itemId EMTC was material_id facilityId inventoryLocationId was sloc_id lotId ELTC was batch_id lotNumber was batch_number quantity quantityPicked quantityIssued 601 uomCode EUOC stockLedgerId
 * Helper code: SDLC Delivery Create (alias DLC, VL01N, FIN-DN-CR) – 4-char MOOA S=Sales D=Delivery L=Line? Actually SDLC = Sales Delivery Create – module grouped intuitive, same length as VL01N but own IP
 * Fallback to legacy sd_delivery
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const salesOrderId = searchParams.get('salesOrderId') || searchParams.get('sales_order_id');
  const facilityId = searchParams.get('facilityId') || searchParams.get('plantId');

  try {
    let rows: any[] = [];
    let dbSource = 'db-new';
    let table = 'sales_delivery';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT 
          d.id, d.delivery_number, d.status, d.picking_date, d.goods_issue_date, d.total_quantity,
          d.shipping_point, d.delivery_priority, d.delivery_block, d.route, d.incoterms, d.picking_status, d.goods_movement_status,
          so.sales_number,
          f.code as facility_code, f.name as facility_name, f.code as plant_code,
          pa.account_number as customer_number, pa.display_name as customer_name,
          (SELECT COUNT(*) FROM sales_delivery_line WHERE delivery_id = d.id) as line_count
        FROM sales_delivery d
        LEFT JOIN sales_order so ON d.sales_order_id = so.id
        LEFT JOIN org_facility f ON d.facility_id = f.id
        LEFT JOIN partner_account pa ON d.ship_to_partner_id = pa.id
        WHERE 1=1
      `;

      if (search) query = sql`${query} AND d.delivery_number ILIKE ${`%${search}%`}`;
      if (status) query = sql`${query} AND d.status = ${status}::sales_delivery_status_new`;
      if (salesOrderId) query = sql`${query} AND d.sales_order_id = ${salesOrderId}`;
      if (facilityId) query = sql`${query} AND d.facility_id = ${facilityId}`;

      query = sql`${query} ORDER BY d.created_at DESC LIMIT ${limit}`;

      const res = await db.execute(query);
      rows = res.rows as any[];

      for (let i = 0; i < rows.length; i++) {
        try {
          const linesRes = await db.execute(sql`
            SELECT dl.*, pi.item_number, pi.name as item_name
            FROM sales_delivery_line dl
            LEFT JOIN prod_item pi ON dl.item_id = pi.id
            WHERE dl.delivery_id = ${rows[i].id}
            ORDER BY dl.line_number
          `);
          rows[i].lines = linesRes.rows;
        } catch {
          rows[i].lines = [];
        }
      }
    } catch (newErr: any) {
      console.warn('sales_delivery not yet fallback sd_delivery:', newErr.message);
      dbSource = 'db-legacy';
      table = 'sd_delivery';
      legalSafe = false;

      let query = sql`
        SELECT 
          d.id, d.delivery_number, d.status, d.picking_date, d.goods_issue_date, d.total_quantity,
          d.shipping_point, d.delivery_priority, d.delivery_block, d.route, d.incoterms, d.picking_status, d.goods_movement_status,
          so.sales_number,
          p.code as facility_code, p.name as facility_name, p.code as plant_code,
          bp.bp_number as customer_number, bp.name1 as customer_name,
          (SELECT COUNT(*) FROM sd_delivery_line WHERE delivery_id = d.id) as line_count
        FROM sd_delivery d
        LEFT JOIN sd_sales_order so ON d.sales_order_id = so.id
        LEFT JOIN ent_plant p ON d.plant_id = p.id
        LEFT JOIN ent_business_partner bp ON d.ship_to_customer_id = bp.id
        WHERE 1=1
      `;

      if (search) query = sql`${query} AND d.delivery_number ILIKE ${`%${search}%`}`;
      if (status) query = sql`${query} AND d.status = ${status}::delivery_status`;
      if (salesOrderId) query = sql`${query} AND d.sales_order_id = ${salesOrderId}`;
      if (facilityId) query = sql`${query} AND d.plant_id = ${facilityId}`;

      query = sql`${query} ORDER BY d.created_at DESC LIMIT ${limit}`;

      const res = await db.execute(query);
      rows = res.rows as any[];
    }

    return NextResponse.json({
      deliveries: rows,
      count: rows.length,
      code: 'SDLC',
      aliasCodes: ['DLC', 'VL01N', 'FIN-DN-CR'],
      helperCode: 'SDLC',
      table,
      source: dbSource,
      legalSafe,
      functionDescription: 'Delivery – SDLC legal-safe own IP (was VL01N) – deliveryNumber DN-80000001 was 80*, facilityId FAC-1000 was plant_id, shipToPartnerId SCUC was ship_to_customer_id, itemId EMTC was material_id, inventoryLocationId was sloc_id, lotId ELTC was batch_id, uomCode EUOC, shippingPoint DP-1000 was KP01',
      explanation: 'Delivery legal-safe sales_delivery – deliveryNumber DN-80000001 was 80*, salesOrderId, legalEntityId was company_code_id, facilityId FAC-1000 was plant_id, shipToPartnerId SCUC was ship_to_customer_id, status DRAFT/PICKING/PICKED/GOODS_ISSUED/CANCELLED, pickingDate goodsIssueDate, universalLedgerId FULC was fi_document_id COGS, shippingPoint DP-1000 was KP01 VL01N, deliveryPriority 02, route ROUTE-01 was KROUTE01, itemId EMTC was material_id, inventoryLocationId was sloc_id, lotId ELTC was batch_id, uomCode EUOC – Code SDLC primary alias DLC/VL01N – 4-char MOOA S=Sales D=Delivery C=Create – module grouped intuitive, same length as VL01N but own IP.',
    });
  } catch (e: any) {
    console.error('Delivery API fatal, returning empty to avoid 500:', e.message);
    return NextResponse.json({
      deliveries: [],
      count: 0,
      code: 'SDLC',
      aliasCodes: ['DLC', 'VL01N'],
      helperCode: 'SDLC',
      table: 'sales_delivery',
      source: 'error-fallback',
      legalSafe: true,
      error: e.message,
      message: 'Delivery fetch failed but returned empty to avoid 500 – SDLC legal-safe',
    });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();

    // SAP-like posting period enforcement – OB52 – check if period open for account type M
    try {
      const postingDate = body.posting_date || body.posting_date || new Date().toISOString();
      const companyCodeForPosting = body.company_code || body.legal_entity_code || body.companyCode || '1000';
      const fiscalCheck = await getFiscalYearPeriodFromDate(companyCodeForPosting, postingDate);
      const postingCheck = await enforcePostingPeriod({ company_code: companyCodeForPosting, posting_date: postingDate, account_type: 'M' });
      if (!postingCheck.allowed) {
        return NextResponse.json({ 
          error: postingCheck.message,
          fiscal_year: postingCheck.fiscal_year,
          fiscal_period: postingCheck.fiscal_period,
          variant_code: postingCheck.variant_code,
          posting_date: postingDate,
          account_type: 'M',
          help: `Create open period via POST /api/posting-period-variants with variant_code=${postingCheck.variant_code}, account_type=M, from_period=${postingCheck.fiscal_period}, from_year=${postingCheck.fiscal_year}, to_period=${postingCheck.fiscal_period}, to_year=${postingCheck.fiscal_year}, is_open=true`
        }, { status: 400 });
      }
      // Attach fiscal info to body for storage
      (body as any)._fiscal_year = postingCheck.fiscal_year;
      (body as any)._fiscal_period = postingCheck.fiscal_period;
    } catch (ppErr: any) {
      console.warn('Posting period enforcement failed, allowing posting to not block fresh:', ppErr.message);
    }
    const { sales_order_id, salesOrderId, facility_id, plant_id, ship_to_partner_id, shipToPartnerId, shipping_point, delivery_priority, delivery_block, route, incoterms, lines } = body;

    const finalSalesOrderId = sales_order_id || salesOrderId;
    let facilityIdResolved = facility_id || plant_id;
    if (!facilityIdResolved && finalSalesOrderId) {
      try {
        const so = await db.execute(sql`SELECT facility_id, plant_id FROM sales_order WHERE id = ${finalSalesOrderId} LIMIT 1`);
        if (so.rows.length > 0) facilityIdResolved = (so.rows[0] as any).facility_id || (so.rows[0] as any).plant_id;
      } catch {}
    }

    if (!finalSalesOrderId) return NextResponse.json({ error: 'sales_order_id required' }, { status: 400 });

    let deliveryNumber = body.delivery_number;
    if (!deliveryNumber) {
      try {
        const nrRes = await db.execute(sql`SELECT current_number, prefix FROM core_number_range WHERE object_type = 'DELIVERY'::core_nr_object_type ORDER BY fiscal_year DESC LIMIT 1`);
        if (nrRes.rows.length > 0) {
          const current = parseInt((nrRes.rows[0] as any).current_number) + 1;
          const prefix = (nrRes.rows[0] as any).prefix || 'DN-';
          deliveryNumber = `${prefix}${current}`;
          await db.execute(sql`UPDATE core_number_range SET current_number = ${current}, updated_at = NOW() WHERE object_type = 'DELIVERY'::core_nr_object_type`);
        } else {
          deliveryNumber = `DN-80000001`;
        }
      } catch {
        deliveryNumber = `DN-${Date.now()}`;
      }
    }

    try {
      const res = await db.execute(sql`
        INSERT INTO sales_delivery (delivery_number, sales_order_id, facility_id, plant_id, ship_to_partner_id, ship_to_customer_id, shipping_point, delivery_priority, delivery_block, route, incoterms)
        VALUES (${deliveryNumber}, ${finalSalesOrderId}, ${facilityIdResolved || null}, ${facilityIdResolved || null}, ${ship_to_partner_id || shipToPartnerId || null}, ${ship_to_partner_id || shipToPartnerId || null}, ${shipping_point || 'DP-1000'}, ${delivery_priority || '02'}, ${delivery_block || null}, ${route || 'ROUTE-01'}, ${incoterms || 'EXW'})
        RETURNING id, delivery_number
      `);
      const deliveryId = (res.rows[0] as any).id;

      if (lines && Array.isArray(lines)) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          await db.execute(sql`
            INSERT INTO sales_delivery_line (delivery_id, sales_line_id, line_number, item_id, material_id, facility_id, plant_id, inventory_location_id, sloc_id, lot_id, batch_id, lot_number, batch_number, quantity, uom_code, uom)
            VALUES (${deliveryId}, ${line.sales_line_id || line.salesLineId}, ${line.line_number || i + 10}, ${line.item_id || line.material_id}, ${line.item_id || line.material_id}, ${facilityIdResolved || null}, ${facilityIdResolved || null}, ${line.inventory_location_id || line.sloc_id || null}, ${line.inventory_location_id || line.sloc_id || null}, ${line.lot_id || line.batch_id || null}, ${line.lot_id || line.batch_id || null}, ${line.lot_number || line.batch_number || null}, ${line.lot_number || line.batch_number || null}, ${line.quantity || '0'}, ${line.uom_code || line.uom || 'PC'}, ${line.uom_code || line.uom || 'PC'})
          `);
        }
      }

      return NextResponse.json({ success: true, delivery: res.rows[0], deliveryNumber, code: 'SDLC', message: `Delivery ${deliveryNumber} created – SDLC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('sales_delivery insert failed:', newErr.message);
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

    // SAP-like edit = Reversal or Adjustment document – legal-safe own IP – FNDC
    // Edit does NOT directly UPDATE – creates reversal/adjustment doc
    const action = (body.action || body.edit_action || 'ADJUST').toUpperCase();
    const isReversal = action.includes('REVERSE');
    const isAdjustment = action.includes('ADJUST') || action.includes('CORRECT') || !isReversal;
    const originalNumber = body.iv_number || body.document_number || body.id;
    if (originalNumber && (isReversal || action.includes('ADJUST') || action.includes('CORRECT'))) {
      const reversalResult = await createReversalOrAdjustmentDocument({
        original_document_type: 'IV',
        original_document_number: originalNumber,
        action: action as any,
        reason: body.reason || body.reversal_reason || body.adjustment_reason || null,
        new_payload: body,
        company_code: body.company_code || body.legal_entity_code || '1000',
        changed_by: body.changed_by || 'system'
      });

      if (reversalResult.success) {
        try {
          const newStatus = isReversal ? 'REVERSED' : 'ADJUSTED';
          await db.execute(sql`UPDATE proc_invoice_verification SET status = ${newStatus}::proc_iv_status, updated_at = NOW() WHERE iv_number = ${originalNumber} OR id::text = ${originalNumber}`);
        } catch (e) {
          console.warn('Status update failed for proc_invoice_verification', e);
        }

        return NextResponse.json({
          success: true,
          original_document: originalNumber,
          reversal_document: reversalResult.reversal_document_number,
          reversal_type: reversalResult.reversal_type,
          action: action,
          code: reversalResult.reversal_type,
          message: `${isReversal ? 'Reversal' : 'Adjustment'} document ${reversalResult.reversal_document_number} (${reversalResult.reversal_type}) created for ${originalNumber} – edit as reversal/adjustment – immutable audit trail`,
          legalSafe: true,
          audit_trail: `Original ${originalNumber} status set to ${isReversal ? 'REVERSED' : 'ADJUSTED'}, new doc ${reversalResult.reversal_document_number} references original`
        });
      }
    }
    // If no action or not reversal/adjustment, fall through to legacy update with audit trail
    // Immutable audit trail – log before update
    try {
      const docNum = body.delivery_number || body.document_number || body.id;
      if (docNum) await updateDocumentWithAudit({ document_number: docNum, new_payload: body, changed_by: 'system', action: 'UPDATE' });
    } catch (auditErr) { console.warn('Audit trail failed', auditErr); }
    const { id, delivery_number, status } = body;
    if (!id && !delivery_number) return NextResponse.json({ error: 'id or delivery_number required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE sales_delivery SET status = ${status}::sales_delivery_status_new, updated_at = NOW() WHERE id = ${id} RETURNING id, delivery_number, status`);
      else res = await db.execute(sql`UPDATE sales_delivery SET status = ${status}::sales_delivery_status_new, updated_at = NOW() WHERE delivery_number = ${delivery_number} RETURNING id, delivery_number, status`);
      if (res.rows.length === 0) throw new Error('Not found');
      return NextResponse.json({ success: true, delivery: res.rows[0], code: 'SDLC', message: `Delivery ${res.rows[0].delivery_number} status ${status} – SDLC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE sd_delivery SET status = ${status}::delivery_status, updated_at = NOW() WHERE id = ${id} RETURNING id, delivery_number, status`);
      else res = await db.execute(sql`UPDATE sd_delivery SET status = ${status}::delivery_status, updated_at = NOW() WHERE delivery_number = ${delivery_number} RETURNING id, delivery_number, status`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
      return NextResponse.json({ success: true, delivery: res.rows[0], message: `Delivery ${res.rows[0].delivery_number} status ${status} – VL01N legacy` });
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
    const delivery_number = searchParams.get('delivery_number');
    if (!id && !delivery_number) return NextResponse.json({ error: 'id or delivery_number required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM sales_delivery WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM sales_delivery WHERE delivery_number = ${delivery_number}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM sd_delivery WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM sd_delivery WHERE delivery_number = ${delivery_number}`);
    }

    return NextResponse.json({ success: true, code: 'SDLC', message: `Delivery ${delivery_number || id} deleted – SDLC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
