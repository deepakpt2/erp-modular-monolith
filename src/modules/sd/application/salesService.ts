/**
 * Sales Service - Manual B2B + POS Webhook + Cash vs AR Routing
 * Updated for SERIALIZABLE concurrency on POS webhook
 */
import { db, withTransaction, withSerializableTransaction } from '@/shared/kernel/db/client';
import { InventoryService } from '../../foundation/inventory-state/application/inventoryService';
import { sql } from 'drizzle-orm';

export interface SalesOrderLineInput {
  materialId: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  slocId?: string;
  batchId?: string;
  taxCodeId?: string;
  discountPerUnit?: number;
}

export interface CreateSalesOrderParams {
  companyCodeId: string;
  plantId: string;
  type: 'B2B' | 'B2C_CASH' | 'B2C_CARD' | 'POS_WEBHOOK' | 'ECOM';
  paymentType: 'CASH' | 'CARD' | 'KNET' | 'AR' | 'ONLINE';
  customerId?: string;
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
      
      // Generate sales number
      const salesNumberResult = await tx.execute(`
        SELECT current_number + 1 as next_num, prefix
        FROM ent_number_range
        WHERE object_type = 'SALES_ORDER' AND year = EXTRACT(YEAR FROM NOW())::int
        FOR UPDATE
      ` as any);
      
      let salesNumber: string;
      if (salesNumberResult.rows && salesNumberResult.rows.length > 0) {
        const row = salesNumberResult.rows[0] as any;
        salesNumber = `${row.prefix}${String(row.next_num).padStart(8, '0')}`;
        await tx.execute(`
          UPDATE ent_number_range SET current_number = $1 WHERE object_type = 'SALES_ORDER' AND year = EXTRACT(YEAR FROM NOW())::int
        ` as any);
      } else {
        salesNumber = `SO${Date.now()}`;
      }

      // Calculate totals
      let totalAmount = 0;
      let taxAmount = 0;
      for (const line of params.lines) {
        const lineTotal = line.quantity * line.unitPrice - (line.discountPerUnit || 0) * line.quantity;
        totalAmount += lineTotal;
      }

      // Create sales order header
      const orderResult = await tx.execute(`
        INSERT INTO sd_sales_order (
          sales_number, type, status, company_code_id, plant_id, customer_id, customer_name,
          payment_type, is_cash_sale, source, external_id, external_payload,
          order_date, posting_date, total_amount, net_amount, currency, created_by
        ) VALUES ($1,$2,'DRAFT',$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW(),$12,$12,'KWD',$13)
        RETURNING id
      ` as any);
      const orderId = (orderResult.rows[0] as any).id;

      // Create lines
      let lineNumber = 10;
      for (const line of params.lines) {
        // Resolve SLoc if not provided
        let slocId = line.slocId;
        if (!slocId) {
          const slocRes = await tx.execute(`
            SELECT id FROM ent_storage_location WHERE plant_id = $1 AND type = 'SHOP_FLOOR' LIMIT 1
          ` as any);
          if (slocRes.rows && slocRes.rows.length > 0) slocId = (slocRes.rows[0] as any).id;
          else {
            const anySloc = await tx.execute(`SELECT id FROM ent_storage_location WHERE plant_id = $1 LIMIT 1` as any);
            slocId = (anySloc.rows[0] as any).id;
          }
        }

        const lineTotal = line.quantity * line.unitPrice - (line.discountPerUnit || 0) * line.quantity;

        await tx.execute(`
          INSERT INTO sd_sales_line (
            sales_order_id, line_number, material_id, plant_id, sloc_id, batch_id,
            quantity, uom, unit_price, discount_per_unit, line_total
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ` as any);
        
        lineNumber += 10;
      }

      return { orderId, salesNumber, isCashSale, totalAmount };
    });
  }

  /**
   * Issue sales order - GI 601 + FI posting with Cash vs AR routing
   * Uses SERIALIZABLE isolation to prevent race conditions on same batch during peak POS hours
   */
  static async issueSalesOrder(orderId: string, postedBy: string) {
    return withSerializableTransaction(async (tx) => {
      const orderRes = await tx.execute(`
        SELECT id, sales_number, company_code_id, plant_id, customer_id, is_cash_sale, payment_type, status
        FROM sd_sales_order WHERE id = $1 FOR UPDATE
      ` as any);
      const order = (orderRes.rows[0] as any);
      if (!order) throw new Error('Sales order not found');
      if (order.status === 'FULLY_ISSUED' || order.status === 'INVOICED') throw new Error('Already issued');

      const linesRes = await tx.execute(`
        SELECT id, material_id, plant_id, sloc_id, batch_id, quantity, quantity_issued, uom
        FROM sd_sales_line WHERE sales_order_id = $1
      ` as any);

      let totalCogs = 0;
      let totalRevenue = 0;

      for (const line of linesRes.rows as any[]) {
        const toIssue = parseFloat(line.quantity) - parseFloat(line.quantity_issued);
        if (toIssue <= 0) continue;

        // Check expiry control and get stock with FIFO
        const stockRes = await tx.execute(`
          SELECT s.id, s.batch_id, b.expiry_date, b.is_expired, s.quantity,
                 m.expiry_control, mp.expiry_control_override,
                 COALESCE(mp.expiry_control_override, m.expiry_control) as effective_control,
                 mp.moving_avg_price, mp.standard_price, m.description
          FROM inv_stock s
          JOIN ent_material_master m ON s.material_id = m.id
          JOIN ent_material_plant mp ON m.id = mp.material_id AND mp.plant_id = s.plant_id
          LEFT JOIN ent_batch b ON s.batch_id = b.id
          WHERE s.material_id = $1 AND s.plant_id = $2 AND s.sloc_id = $3 AND s.stock_status = 'UNRESTRICTED' AND s.quantity > 0
          ORDER BY b.expiry_date ASC NULLS LAST
        ` as any);

        let remaining = toIssue;
        for (const stock of stockRes.rows as any[]) {
          if (remaining <= 0) break;

          // Expiry blocking check per material config
          const isExpired = stock.is_expired || (stock.expiry_date && new Date(stock.expiry_date) < new Date());
          if (isExpired) {
            if (stock.effective_control === 'BLOCK') {
              throw new Error(`EXPIRY_BLOCK: Material ${stock.description} batch expired, cannot issue. Control=BLOCK`);
            } else if (stock.effective_control === 'WARNING') {
              await tx.execute(`
                UPDATE sd_sales_line SET expiry_warning = $1 WHERE id = $2
              ` as any);
            } else if (stock.effective_control === 'RESTRICTED_USE') {
              await tx.execute(`
                UPDATE sd_sales_line SET is_expiry_blocked = true, expiry_warning = $1 WHERE id = $2
              ` as any);
              // Allow but flag as restricted
            }
          }

          const available = parseFloat(stock.quantity);
          const issueQty = Math.min(available, remaining);

          const movement = await InventoryService.postMovement({
            movementType: '601',
            materialId: line.material_id,
            plantId: line.plant_id,
            slocId: line.sloc_id,
            batchId: stock.batch_id,
            quantity: -issueQty,
            stockStatusTo: 'UNRESTRICTED',
            referenceDocType: 'SALES_ORDER',
            referenceDocId: orderId,
            referenceDocNumber: order.sales_number,
            postedBy,
            headerText: `GI for sales ${order.sales_number}`,
          });

          const cogsPerUnit = movement.unitCost;
          totalCogs += cogsPerUnit * issueQty;

          await tx.execute(`
            UPDATE sd_sales_line SET quantity_issued = quantity_issued + $1, cogs_per_unit = $2, total_cogs = $3, stock_ledger_id = $4
            WHERE id = $5
          ` as any);

          remaining -= issueQty;
        }

        if (remaining > 0.001) {
          throw new Error(`Insufficient stock for material ${line.material_id}: missing ${remaining}`);
        }
      }

      // FI Posting - Cash vs AR routing
      // Get GL accounts from auto determination
      const fiDocNumber = `FI${Date.now()}`;
      
      // Determine accounts based on cash vs AR
      let debitAccountType: string;
      let debitGlAccountId: string | null = null;

      if (order.is_cash_sale) {
        // Dr Cash (100001) Cr Revenue (400000) + Dr COGS (500000) Cr Inventory (100000)
        debitAccountType = 'CASH';
      } else {
        // Dr AR (120000) Cr Revenue (400000) + Dr COGS Cr Inventory
        debitAccountType = 'AR';
      }

      // Create FI document (simplified - real would use auto determination)
      const fiDocResult = await tx.execute(`
        INSERT INTO fi_document (document_number, company_code_id, doc_type, posting_date, document_date, reference, header_text, total_debit, total_credit, currency, status, reference_doc_type, reference_doc_id, reference_doc_number)
        VALUES ($1,$2,'RV',NOW(),NOW(),$3,$4,$5,$5,'KWD','POSTED','SALES_ORDER',$6,$3)
        RETURNING id
      ` as any);
      const fiDocId = (fiDocResult.rows[0] as any).id;

      // TODO: Create FI lines based on auto determination - placeholder
      // Line 1: Dr Cash/AR, Cr Revenue, Dr COGS, Cr Inventory

      await tx.execute(`
        UPDATE sd_sales_order SET status = 'FULLY_ISSUED', fi_document_id = $1, updated_at = NOW() WHERE id = $2
      ` as any);

      return { fiDocumentId: fiDocId, totalCogs, salesNumber: order.sales_number };
    });
  }

  /**
   * Webhook handler for external POS - universal POST /api/sales/issue
   */
  static async handlePosWebhook(params: {
    source: 'POS_FOODICS' | 'POS_SQUARE' | 'ECOM_SHOPIFY' | 'ECOM_WOOCOM' | 'API';
    externalId: string;
    payload: any;
    companyCodeId: string;
    plantId: string;
  }) {
    const start = Date.now();
    let webhookLogId: string | null = null;

    try {
      // Log webhook
      const logRes = await db.execute(`
        INSERT INTO sd_pos_webhook_log (source, external_id, payload, status)
        VALUES ($1,$2,$3,'PENDING')
        RETURNING id
      ` as any);
      webhookLogId = (logRes.rows[0] as any).id;

      // Parse payload - support multiple formats
      // Expected: { items: [{ sku/materialNumber, quantity, unitPrice, batchNumber? }], paymentType, customer?, totalAmount }
      const items = params.payload.items || params.payload.lines || [];
      const paymentType = params.payload.paymentType || params.payload.payment_method || 'CASH';
      
      // Map SKU to materialId
      const lines: SalesOrderLineInput[] = [];
      for (const item of items) {
        const materialNumber = item.sku || item.materialNumber || item.material_number || item.code;
        const matRes = await db.execute(`
          SELECT id, base_uom FROM ent_material_master WHERE material_number = $1
        ` as any);
        if (!matRes.rows || matRes.rows.length === 0) {
          throw new Error(`Material not found for SKU ${materialNumber}`);
        }
        const mat = (matRes.rows[0] as any);
        
        lines.push({
          materialId: mat.id,
          quantity: parseFloat(item.quantity || item.qty || '1'),
          uom: item.uom || mat.base_uom,
          unitPrice: parseFloat(item.unitPrice || item.price || item.unit_price || '0'),
          batchId: item.batchId,
        });
      }

      // Create sales order as POS_WEBHOOK type, cash sale
      const order = await this.createSalesOrder({
        companyCodeId: params.companyCodeId,
        plantId: params.plantId,
        type: 'POS_WEBHOOK',
        paymentType: paymentType === 'CASH' ? 'CASH' : paymentType === 'CARD' ? 'CARD' : 'AR',
        lines,
        source: params.source,
        externalId: params.externalId,
        externalPayload: params.payload,
        customerId: params.payload.customerId,
        customerName: params.payload.customerName,
      });

      // Auto issue for cash sales
      if (order.isCashSale) {
        await this.issueSalesOrder(order.orderId, 'POS_WEBHOOK');
      }

      await db.execute(`
        UPDATE sd_pos_webhook_log SET status = 'PROCESSED', sales_order_id = $1, processing_time_ms = $2 WHERE id = $3
      ` as any);

      return { success: true, salesNumber: order.salesNumber, orderId: order.orderId, isCashSale: order.isCashSale };

    } catch (error: any) {
      if (webhookLogId) {
        await db.execute(`
          UPDATE sd_pos_webhook_log SET status = 'FAILED', error_message = $1, processing_time_ms = $2 WHERE id = $3
        ` as any);
      }
      throw error;
    }
  }
}
