/**
 * Sales Service - Manual B2B + POS Webhook + Cash vs AR Routing – Legal-safe own IP – Module 8 SD
 * New: sales_order + sales_order_line + sales_pos_webhook_log (was sd_sales_order + sd_sales_line + sd_pos_webhook_log)
 * Maps:
 * - sd_sales_order → sales_order – salesNumber SO-10000001, type B2B/B2C_CASH/B2C_CARD/POS_WEBHOOK/ECOM, status DRAFT/CONFIRMED/PARTIALLY_ISSUED/FULLY_ISSUED/INVOICED/CANCELLED, legalEntityId was company_code_id, facilityId FAC-1000 was plant_id, partnerId SCUC was customer_id, paymentType CASH/CARD/KNET/AR/ONLINE, isCashSale, source MANUAL/POS_FOODICS/POS_SQUARE/ECOM_SHOPIFY/ECOM_WOOCOM/API, externalId, totalAmount/taxAmount/netAmount currencyCode INR was KWD, universalLedgerId FULC was fi_document_id
 * - sd_sales_line → sales_order_line – salesOrderId, itemId EMTC was material_id, facilityId was plant_id, inventoryLocationId was sloc_id, lotId ELTC was batch_id, quantity, uomCode EUOC was uom, unitPrice, lineTotal, cogsPerUnit, stockLedgerId
 * - sd_pos_webhook_log → sales_pos_webhook_log
 * - prod_item → prod_item EMTC
 * - org_facility → org_facility FAC-1000
 * - org_inventory_location → org_inventory_location
 * - inv_lot → inv_lot ELTC
 * - inv_stock → inv_stock_ledger? but keep inv_stock for now with fallback
 * - fin_universal_ledger → fin_universal_journal FULC
 * Helper codes: SSOC Sales Order Create (alias SOC, VA01), SDLC Delivery Create (alias DLC, VL01N), SBLC Billing Create (alias BLC, VF01), SPWC POS Webhook Create (alias PWC)
 * 4-char MOOA S=Sales
 */
import { db, withTransaction, withSerializableTransaction } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export interface SalesOrderLineInput {
  materialId?: string;
  itemId?: string;
  quantity: number;
  uom?: string;
  uomCode?: string;
  unitPrice: number;
  slocId?: string;
  inventoryLocationId?: string;
  batchId?: string;
  lotId?: string;
  taxCodeId?: string;
  taxRuleId?: string;
  discountPerUnit?: number;
}

export interface CreateSalesOrderParams {
  companyCodeId?: string;
  legalEntityId?: string;
  plantId?: string;
  facilityId?: string;
  type: 'B2B' | 'B2C_CASH' | 'B2C_CARD' | 'POS_WEBHOOK' | 'ECOM';
  paymentType: 'CASH' | 'CARD' | 'KNET' | 'AR' | 'ONLINE';
  customerId?: string;
  partnerId?: string;
  customerName?: string;
  lines: SalesOrderLineInput[];
  source: 'MANUAL' | 'POS_FOODICS' | 'POS_SQUARE' | 'ECOM_SHOPIFY' | 'ECOM_WOOCOM' | 'API';
  externalId?: string;
  externalPayload?: any;
  createdBy?: string;
}

export class SalesService {
  static async createSalesOrder(params: CreateSalesOrderParams) {
    return withTransaction(async (tx) => {
      const isCashSale = ['CASH', 'CARD', 'KNET', 'ONLINE'].includes(params.paymentType) || params.type !== 'B2B';

      // Generate sales number – try new core_number_range then legacy core_number_range
      let salesNumber: string = `SO-${Date.now()}`;
      try {
        const nrRes = await tx.execute(sql`
          SELECT current_number, prefix FROM core_number_range WHERE object_type = 'SALES_ORDER'::core_nr_object_type ORDER BY fiscal_year DESC LIMIT 1 FOR UPDATE
        ` as any);
        if (nrRes.rows && nrRes.rows.length > 0) {
          const row = nrRes.rows[0] as any;
          const next = parseInt(row.current_number) + 1;
          salesNumber = `${row.prefix || 'SO-'}${String(next).padStart(8, '0')}`;
          await tx.execute(sql`UPDATE core_number_range SET current_number = ${next}, updated_at = NOW() WHERE object_type = 'SALES_ORDER'::core_nr_object_type` as any);
        }
      } catch {
        try {
          const salesNumberResult = await tx.execute(sql`
            SELECT current_number + 1 as next_num, prefix
            FROM core_number_range
            WHERE object_type = 'SALES_ORDER' AND year = EXTRACT(YEAR FROM NOW())::int
            FOR UPDATE
          ` as any);
          if (salesNumberResult.rows && salesNumberResult.rows.length > 0) {
            const row = salesNumberResult.rows[0] as any;
            salesNumber = `${row.prefix}${String(row.next_num).padStart(8, '0')}`;
            await tx.execute(sql`UPDATE core_number_range SET current_number = ${row.next_num} WHERE object_type = 'SALES_ORDER' AND year = EXTRACT(YEAR FROM NOW())::int` as any);
          }
        } catch {}
      }

      // Calculate totals
      let totalAmount = 0;
      for (const line of params.lines) {
        const lineTotal = line.quantity * line.unitPrice - (line.discountPerUnit || 0) * line.quantity;
        totalAmount += lineTotal;
      }

      const legalEntityId = (params as any).legalEntityId || params.companyCodeId;
      const facilityId = (params as any).facilityId || params.plantId;
      const partnerId = (params as any).partnerId || params.customerId;

      // Create sales order header – try new sales_order then legacy sd_sales_order
      let orderId: string;
      try {
        const orderResult = await tx.execute(sql`
          INSERT INTO sales_order (
            sales_number, type, status, legal_entity_id, company_code_id, facility_id, plant_id, partner_id, customer_id, customer_name,
            payment_type, is_cash_sale, source, external_id, external_payload,
            order_date, posting_date, total_amount, net_amount, currency_code, currency, created_by
          ) VALUES (${salesNumber}, ${params.type}::sales_order_type_new, 'DRAFT'::sales_order_status_new, ${legalEntityId}, ${legalEntityId}, ${facilityId}, ${facilityId}, ${partnerId || null}, ${partnerId || null}, ${params.customerName || null},
          ${params.paymentType}::sales_payment_type_new, ${isCashSale}, ${params.source}::sales_source_new, ${params.externalId || null}, ${params.externalPayload ? JSON.stringify(params.externalPayload) : null}::jsonb,
          NOW(), NOW(), ${totalAmount}, ${totalAmount}, 'INR', 'INR', ${params.createdBy || null}::uuid)
          RETURNING id
        ` as any);
        orderId = (orderResult.rows[0] as any).id;
      } catch (newErr: any) {
        console.warn('sales_order insert failed, fallback sd_sales_order:', newErr.message);
        const orderResult = await tx.execute(sql`
          INSERT INTO sd_sales_order (
            sales_number, type, status, company_code_id, plant_id, customer_id, customer_name,
            payment_type, is_cash_sale, source, external_id, external_payload,
            order_date, posting_date, total_amount, net_amount, currency, created_by
          ) VALUES (${salesNumber}, ${params.type}::sales_order_type, 'DRAFT'::sales_order_status, ${legalEntityId}, ${facilityId}, ${partnerId || null}, ${params.customerName || null},
          ${params.paymentType}::sales_payment_type, ${isCashSale}, ${params.source}::sales_source, ${params.externalId || null}, ${params.externalPayload ? JSON.stringify(params.externalPayload) : null}::jsonb,
          NOW(), NOW(), ${totalAmount}, ${totalAmount}, 'KWD', ${params.createdBy || null}::uuid)
          RETURNING id
        ` as any);
        orderId = (orderResult.rows[0] as any).id;
      }

      // Create lines – try new sales_order_line then legacy sd_sales_line
      let lineNumber = 10;
      for (const line of params.lines) {
        let slocId = line.slocId || line.inventoryLocationId;
        if (!slocId) {
          try {
            const slocRes = await tx.execute(sql`SELECT id FROM org_inventory_location WHERE facility_id = ${facilityId} LIMIT 1` as any);
            if (slocRes.rows && slocRes.rows.length > 0) slocId = (slocRes.rows[0] as any).id;
            else {
              const anySloc = await tx.execute(sql`SELECT id FROM org_inventory_location WHERE plant_id = ${facilityId} LIMIT 1` as any);
              if (anySloc.rows && anySloc.rows.length > 0) slocId = (anySloc.rows[0] as any).id;
            }
          } catch {}
        }

        const lineTotal = line.quantity * line.unitPrice - (line.discountPerUnit || 0) * line.quantity;
        const itemId = line.itemId || line.materialId;

        try {
          await tx.execute(sql`
            INSERT INTO sales_order_line (
              sales_order_id, line_number, item_id, material_id, facility_id, plant_id, inventory_location_id, sloc_id, lot_id, batch_id,
              quantity, uom_code, uom, unit_price, discount_per_unit, line_total
            ) VALUES (${orderId}, ${lineNumber}, ${itemId}, ${itemId}, ${facilityId}, ${facilityId}, ${slocId || null}, ${slocId || null}, ${line.lotId || line.batchId || null}, ${line.lotId || line.batchId || null},
            ${line.quantity}, ${line.uomCode || line.uom || 'PC'}, ${line.uomCode || line.uom || 'PC'}, ${line.unitPrice}, ${line.discountPerUnit || 0}, ${lineTotal})
          ` as any);
        } catch {
          await tx.execute(sql`
            INSERT INTO sd_sales_line (
              sales_order_id, line_number, material_id, plant_id, sloc_id, batch_id,
              quantity, uom, unit_price, discount_per_unit, line_total
            ) VALUES (${orderId}, ${lineNumber}, ${itemId}, ${facilityId}, ${slocId || null}, ${line.lotId || line.batchId || null},
            ${line.quantity}, ${line.uomCode || line.uom || 'PC'}, ${line.unitPrice}, ${line.discountPerUnit || 0}, ${lineTotal})
          ` as any);
        }

        lineNumber += 10;
      }

      return { orderId, salesNumber, isCashSale, totalAmount };
    });
  }

  static async issueSalesOrder(orderId: string, postedBy: string) {
    return withSerializableTransaction(async (tx) => {
      // Try new sales_order then legacy
      let order: any = null;
      try {
        const orderRes = await tx.execute(sql`SELECT id, sales_number, legal_entity_id, company_code_id, facility_id, plant_id, partner_id, customer_id, is_cash_sale, payment_type, status FROM sales_order WHERE id = ${orderId} FOR UPDATE` as any);
        order = (orderRes.rows[0] as any);
      } catch {}
      if (!order) {
        const orderRes = await tx.execute(sql`SELECT id, sales_number, company_code_id, plant_id, customer_id, is_cash_sale, payment_type, status FROM sd_sales_order WHERE id = ${orderId} FOR UPDATE` as any);
        order = (orderRes.rows[0] as any);
      }
      if (!order) throw new Error('Sales order not found');
      if (order.status === 'FULLY_ISSUED' || order.status === 'INVOICED') throw new Error('Already issued');

      let lines: any[] = [];
      try {
        const linesRes = await tx.execute(sql`SELECT id, item_id, material_id, facility_id, plant_id, inventory_location_id, sloc_id, lot_id, batch_id, quantity, quantity_issued, uom_code, uom FROM sales_order_line WHERE sales_order_id = ${orderId}` as any);
        lines = linesRes.rows as any[];
      } catch {
        const linesRes = await tx.execute(sql`SELECT id, material_id, plant_id, sloc_id, batch_id, quantity, quantity_issued, uom FROM sd_sales_line WHERE sales_order_id = ${orderId}` as any);
        lines = linesRes.rows as any[];
      }

      let totalCogs = 0;

      for (const line of lines) {
        const toIssue = parseFloat(line.quantity) - parseFloat(line.quantity_issued || '0');
        if (toIssue <= 0) continue;

        const materialId = line.item_id || line.material_id;
        const plantId = line.facility_id || line.plant_id;
        const slocId = line.inventory_location_id || line.sloc_id;

        // Stock check – try new prod_item + org_facility then legacy ent_*
        let stockRows: any[] = [];
        try {
          const stockRes = await tx.execute(sql`
            SELECT s.id, s.lot_id as batch_id, l.expiry_date, l.is_expired, s.quantity,
                   pi.expiry_control, pi.name as description
            FROM inv_stock s
            JOIN prod_item pi ON s.item_id = pi.id
            LEFT JOIN inv_lot l ON s.lot_id = l.id
            WHERE s.item_id = ${materialId} AND s.facility_id = ${plantId} AND s.quantity > 0
            ORDER BY l.expiry_date ASC NULLS LAST
          ` as any);
          stockRows = stockRes.rows as any[];
        } catch {
          try {
            const stockRes = await tx.execute(sql`
              SELECT s.id, s.batch_id, b.expiry_date, b.is_expired, s.quantity,
                     m.expiry_control, mp.expiry_control_override,
                     COALESCE(mp.expiry_control_override, m.expiry_control) as effective_control,
                     mp.moving_avg_price, mp.standard_price, m.description
              FROM inv_stock s
              JOIN prod_item m ON s.material_id = m.id
              JOIN prod_item_plant mp ON m.id = mp.material_id AND mp.plant_id = s.plant_id
              LEFT JOIN inv_lot b ON s.batch_id = b.id
              WHERE s.material_id = ${materialId} AND s.plant_id = ${plantId} AND s.sloc_id = ${slocId} AND s.stock_status = 'UNRESTRICTED' AND s.quantity > 0
              ORDER BY b.expiry_date ASC NULLS LAST
            ` as any);
            stockRows = stockRes.rows as any[];
          } catch {}
        }

        let remaining = toIssue;
        for (const stock of stockRows) {
          if (remaining <= 0) break;
          const available = parseFloat(stock.quantity);
          const issueQty = Math.min(available, remaining);

          // Inventory movement – use InventoryService if available
          try {
            const { InventoryService } = await import('../../foundation/inventory-state/application/inventoryService');
            const movement = await InventoryService.postMovement({
              movementType: 'GI_SALES',
              materialId,
              plantId,
              slocId,
              batchId: stock.batch_id,
              quantity: -issueQty,
              stockStatusTo: 'UNRESTRICTED',
              referenceDocType: 'SALES_ORDER',
              referenceDocId: orderId,
              referenceDocNumber: order.sales_number,
              postedBy,
              headerText: `GI for sales ${order.sales_number}`,
            } as any);
            totalCogs += (movement as any).unitCost * issueQty;
          } catch {
            // Fallback simple stock deduction
            try {
              await tx.execute(sql`UPDATE inv_stock SET quantity = quantity - ${issueQty} WHERE id = ${stock.id}` as any);
            } catch {}
          }

          remaining -= issueQty;
        }

        if (remaining > 0.001) {
          throw new Error(`Insufficient stock for item ${materialId}: missing ${remaining}`);
        }

        // Update issued qty
        try {
          await tx.execute(sql`UPDATE sales_order_line SET quantity_issued = quantity_issued + ${toIssue} WHERE id = ${line.id}` as any);
        } catch {
          await tx.execute(sql`UPDATE sd_sales_line SET quantity_issued = quantity_issued + ${toIssue} WHERE id = ${line.id}` as any);
        }
      }

      // FI posting – try new fin_universal_journal then legacy fin_universal_ledger
      let fiDocId: string | null = null;
      try {
        const fiDocResult = await tx.execute(sql`
          INSERT INTO fin_universal_journal (document_number, legal_entity_id, company_code_id, doc_type, posting_date, document_date, reference, header_text, total_debit, total_credit, currency_code, currency, status, reference_doc_type, reference_doc_id, reference_doc_number)
          VALUES (${`UJ${Date.now()}`}, ${order.legal_entity_id || order.company_code_id}, ${order.legal_entity_id || order.company_code_id}, 'RV', NOW(), NOW(), ${order.sales_number}, ${`GI for sales ${order.sales_number}`}, ${totalCogs}, ${totalCogs}, 'INR', 'INR', 'POSTED', 'SALES_ORDER', ${orderId}, ${order.sales_number})
          RETURNING id
        ` as any);
        fiDocId = (fiDocResult.rows[0] as any).id;
      } catch {
        try {
          const fiDocResult = await tx.execute(sql`
            INSERT INTO fin_universal_ledger (document_number, company_code_id, doc_type, posting_date, document_date, reference, header_text, total_debit, total_credit, currency, status, reference_doc_type, reference_doc_id, reference_doc_number)
            VALUES (${`FI${Date.now()}`}, ${order.company_code_id}, 'RV', NOW(), NOW(), ${order.sales_number}, ${`GI for sales ${order.sales_number}`}, ${totalCogs}, ${totalCogs}, 'KWD', 'POSTED', 'SALES_ORDER', ${orderId}, ${order.sales_number})
            RETURNING id
          ` as any);
          fiDocId = (fiDocResult.rows[0] as any).id;
        } catch {}
      }

      try {
        await tx.execute(sql`UPDATE sales_order SET status = 'FULLY_ISSUED'::sales_order_status_new, universal_ledger_id = ${fiDocId}, fi_document_id = ${fiDocId}, updated_at = NOW() WHERE id = ${orderId}` as any);
      } catch {
        await tx.execute(sql`UPDATE sd_sales_order SET status = 'FULLY_ISSUED'::sales_order_status, fi_document_id = ${fiDocId}, updated_at = NOW() WHERE id = ${orderId}` as any);
      }

      return { fiDocumentId: fiDocId, totalCogs, salesNumber: order.sales_number };
    });
  }

  static async handlePosWebhook(params: {
    source: 'POS_FOODICS' | 'POS_SQUARE' | 'ECOM_SHOPIFY' | 'ECOM_WOOCOM' | 'API';
    externalId: string;
    payload: any;
    companyCodeId?: string;
    legalEntityId?: string;
    plantId?: string;
    facilityId?: string;
  }) {
    let webhookLogId: string | null = null;

    try {
      const legalEntityId = (params as any).legalEntityId || params.companyCodeId;
      const facilityId = (params as any).facilityId || params.plantId;

      try {
        const logRes = await db.execute(sql`
          INSERT INTO sales_pos_webhook_log (source, external_id, payload, status)
          VALUES (${params.source}::sales_source_new, ${params.externalId}, ${JSON.stringify(params.payload)}::jsonb, 'PENDING')
          RETURNING id
        ` as any);
        webhookLogId = (logRes.rows[0] as any).id;
      } catch {
        try {
          const logRes = await db.execute(sql`
            INSERT INTO sd_pos_webhook_log (source, external_id, payload, status)
            VALUES (${params.source}::sales_source, ${params.externalId}, ${JSON.stringify(params.payload)}::jsonb, 'PENDING')
            RETURNING id
          ` as any);
          webhookLogId = (logRes.rows[0] as any).id;
        } catch {}
      }

      const items = params.payload.items || params.payload.lines || [];
      const paymentType = params.payload.paymentType || params.payload.payment_method || 'CASH';

      const lines: SalesOrderLineInput[] = [];
      for (const item of items) {
        const materialNumber = item.sku || item.materialNumber || item.material_number || item.code || item.item_number;
        let matId: string | null = null;
        let baseUom = 'PC';

        try {
          const matRes = await db.execute(sql`SELECT id, base_uom FROM prod_item WHERE item_number = ${materialNumber} LIMIT 1` as any);
          if (matRes.rows && matRes.rows.length > 0) {
            matId = (matRes.rows[0] as any).id;
            baseUom = (matRes.rows[0] as any).base_uom || 'PC';
          }
        } catch {}
        if (!matId) {
          try {
            const matRes = await db.execute(sql`SELECT id, base_uom FROM prod_item WHERE material_number = ${materialNumber} LIMIT 1` as any);
            if (matRes.rows && matRes.rows.length > 0) {
              matId = (matRes.rows[0] as any).id;
              baseUom = (matRes.rows[0] as any).base_uom || 'PC';
            }
          } catch {}
        }
        if (!matId) throw new Error(`Material not found for SKU ${materialNumber}`);

        lines.push({
          itemId: matId,
          materialId: matId,
          quantity: parseFloat(item.quantity || item.qty || '1'),
          uom: item.uom || baseUom,
          uomCode: item.uom || baseUom,
          unitPrice: parseFloat(item.unitPrice || item.price || item.unit_price || '0'),
          lotId: item.batchId || item.lotId,
          batchId: item.batchId || item.lotId,
        });
      }

      const order = await this.createSalesOrder({
        legalEntityId,
        companyCodeId: legalEntityId,
        facilityId,
        plantId: facilityId,
        type: 'POS_WEBHOOK',
        paymentType: paymentType === 'CASH' ? 'CASH' : paymentType === 'CARD' ? 'CARD' : 'AR',
        lines,
        source: params.source,
        externalId: params.externalId,
        externalPayload: params.payload,
        customerId: params.payload.customerId || params.payload.partnerId,
        partnerId: params.payload.customerId || params.payload.partnerId,
        customerName: params.payload.customerName,
      });

      if (order.isCashSale) {
        await this.issueSalesOrder(order.orderId, 'POS_WEBHOOK');
      }

      if (webhookLogId) {
        try {
          await db.execute(sql`UPDATE sales_pos_webhook_log SET status = 'PROCESSED', sales_order_id = ${order.orderId} WHERE id = ${webhookLogId}` as any);
        } catch {
          try {
            await db.execute(sql`UPDATE sd_pos_webhook_log SET status = 'PROCESSED', sales_order_id = ${order.orderId} WHERE id = ${webhookLogId}` as any);
          } catch {}
        }
      }

      return { success: true, salesNumber: order.salesNumber, orderId: order.orderId, isCashSale: order.isCashSale };
    } catch (error: any) {
      if (webhookLogId) {
        try {
          await db.execute(sql`UPDATE sales_pos_webhook_log SET status = 'FAILED', error_message = ${error.message} WHERE id = ${webhookLogId}` as any);
        } catch {
          try {
            await db.execute(sql`UPDATE sd_pos_webhook_log SET status = 'FAILED', error_message = ${error.message} WHERE id = ${webhookLogId}` as any);
          } catch {}
        }
      }
      throw error;
    }
  }
}
