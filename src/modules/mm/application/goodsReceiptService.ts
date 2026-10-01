/**
 * Goods Receipt Service - Partial GRs & Short-Shipping with DELIV_COMPLETED (legacy ELIKZ) (Delivery Completed)
 * Supports multiple 101 movements per PO line, with final closure via delivery_completed flag
 */
import { db, withTransaction } from '@/shared/kernel/db/client';
import { InventoryService } from '../../foundation/inventory-state/application/inventoryService';
import { sql } from 'drizzle-orm';

export interface GrLineInput {
  poLineId: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: Date;
  stockStatus?: 'UNRESTRICTED' | 'QUALITY_INSPECTION' | 'BLOCKED';
  slocId?: string;
}

export interface CreateGrParams {
  poId: string;
  postingDate: Date;
  documentDate: Date;
  lines: GrLineInput[];
  headerText?: string;
  createdBy: string;
  isFinalDelivery?: boolean; // If true, sets DELIV_COMPLETED (legacy ELIKZ) on all lines
  shortShipmentReason?: string;
}

export class GoodsReceiptService {
  /**
   * Create Goods Receipt with partial handling and DELIV_COMPLETED (legacy ELIKZ) support
   * Each GR creates 101 movement, updates PO line received_qty, and posts FI INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX)
   */
  static async createGoodsReceipt(params: CreateGrParams) {
    return withTransaction(async (tx) => {
      // 1. Lock PO and validate lines
      const poRes = await tx.execute(sql`
        SELECT id, po_number, status, company_code_id, plant_id, vendor_id
        FROM mm_purchase_order
        WHERE id = ${params.poId}
        FOR UPDATE
      `);
      const po = (poRes.rows[0] as any);
      if (!po) throw new Error('PO not found');
      if (['CANCELLED', 'CLOSED'].includes(po.status)) throw new Error(`PO ${po.po_number} is ${po.status}, cannot receive`);

      // Generate GR number
      const year = new Date().getFullYear();
      const nrRes = await tx.execute(sql`
        SELECT current_number + 1 as next_num, prefix
        FROM core_number_range
        WHERE object_type = 'GR' AND year = ${year}
        FOR UPDATE
      `);
      let grNumber: string;
      if (nrRes.rows.length > 0) {
        const row = nrRes.rows[0] as any;
        grNumber = `${row.prefix}${String(row.next_num).padStart(10, '0')}`;
        await tx.execute(sql`
          UPDATE core_number_range SET current_number = ${row.next_num} WHERE object_type = 'GR' AND year = ${year}
        `);
      } else {
        grNumber = `50${Date.now()}`;
      }

      // 2. Create GR header
      const grHeaderRes = await tx.execute(sql`
        INSERT INTO mm_goods_receipt (gr_number, po_id, company_code_id, plant_id, status, posting_date, document_date, header_text, created_by)
        VALUES (${grNumber}, ${params.poId}, ${po.company_code_id}, ${po.plant_id}, 'POSTED', ${params.postingDate}, ${params.documentDate}, ${params.headerText || ''}, ${params.createdBy})
        RETURNING id
      `);
      const grId = (grHeaderRes.rows[0] as any).id;

      let totalAmount = 0;
      let totalLanded = 0;

      // 3. Process each line with partial GR logic
      for (let idx = 0; idx < params.lines.length; idx++) {
        const lineInput = params.lines[idx];
        
        // Lock PO line
        const poLineRes = await tx.execute(sql`
          SELECT id, material_id, quantity, quantity_received, uom, unit_price, total_per_unit, plant_id, sloc_id,
                 delivery_completed, is_closed
          FROM mm_po_line
          WHERE id = ${lineInput.poLineId} AND po_id = ${params.poId}
          FOR UPDATE
        `);
        const poLine = (poLineRes.rows[0] as any);
        if (!poLine) throw new Error(`PO line ${lineInput.poLineId} not found`);

        if (poLine.is_closed || poLine.delivery_completed) {
          throw new Error(`PO line ${poLine.id} is closed (DELIV_COMPLETED (legacy ELIKZ) set). No further receipts allowed. Received ${poLine.quantity_received}/${poLine.quantity}`);
        }

        const orderedQty = parseFloat(poLine.quantity);
        const receivedQty = parseFloat(poLine.quantity_received || '0');
        const openQty = orderedQty - receivedQty;

        if (lineInput.quantity > openQty + 0.001 && !params.isFinalDelivery) {
          // Allow over-delivery? In food service, usually not, but we warn
          console.warn(`Over-delivery: ordered ${orderedQty}, already received ${receivedQty}, trying to receive ${lineInput.quantity}, open ${openQty}`);
        }

        if (lineInput.quantity <= 0) throw new Error('GR quantity must be positive');

        // Resolve SLoc
        let slocId = lineInput.slocId || poLine.sloc_id;
        if (!slocId) {
          const slocRes = await tx.execute(sql`SELECT id FROM org_inventory_location WHERE plant_id = ${poLine.plant_id} LIMIT 1`);
          slocId = (slocRes.rows[0] as any).id;
        }

        // Handle batch creation for batch-managed materials
        let batchId: string | null = null;
        if (lineInput.batchNumber) {
          const batchRes = await tx.execute(sql`
            INSERT INTO inv_lot (batch_number, material_id, plant_id, expiry_date, manufacturing_date)
            VALUES (${lineInput.batchNumber}, ${poLine.material_id}, ${poLine.plant_id}, ${lineInput.expiryDate || null}, NOW())
            ON CONFLICT (batch_number, material_id, plant_id) DO UPDATE SET expiry_date = ${lineInput.expiryDate || null}
            RETURNING id
          `);
          batchId = (batchRes.rows[0] as any).id;
        }

        const unitPrice = parseFloat(poLine.total_per_unit || poLine.unit_price);
        const lineTotal = lineInput.quantity * unitPrice;
        totalAmount += lineTotal;

        // Create GR line
        const grLineRes = await tx.execute(sql`
          INSERT INTO mm_gr_line (gr_id, po_line_id, line_number, material_id, plant_id, sloc_id, batch_id, batch_number, quantity, uom, unit_price, total_value, stock_status, expiry_date)
          VALUES (${grId}, ${poLine.id}, ${(idx+1)*10}, ${poLine.material_id}, ${poLine.plant_id}, ${slocId}, ${batchId}, ${lineInput.batchNumber || null}, ${lineInput.quantity}, ${poLine.uom}, ${unitPrice}, ${lineTotal}, ${lineInput.stockStatus || 'UNRESTRICTED'}, ${lineInput.expiryDate || null})
          RETURNING id
        `);
        const grLineId = (grLineRes.rows[0] as any).id;

        // 4. Post inventory movement 101 (GR for PO) with landed cost
        const landedPerUnit = 0; // Will be enhanced with freight distribution later
        const movement = await InventoryService.postMovement({
          movementType: 'GR_PO',
          materialId: poLine.material_id,
          plantId: poLine.plant_id,
          slocId,
          batchId,
          quantity: lineInput.quantity,
          stockStatusTo: (lineInput.stockStatus as any) || 'UNRESTRICTED',
          referenceDocType: 'PO',
          referenceDocId: params.poId,
          referenceDocNumber: grNumber,
          unitCost: unitPrice,
          unitLandedCost: landedPerUnit,
          postedBy: params.createdBy,
          headerText: `GR ${grNumber} for PO ${po.po_number}`,
        });

        // Link ledger to GR line
        await tx.execute(sql`
          UPDATE mm_gr_line SET stock_ledger_id = ${movement.ledgerId} WHERE id = ${grLineId}
        `);

        // 5. Update PO line received qty
        const newReceivedQty = receivedQty + lineInput.quantity;
        await tx.execute(sql`
          UPDATE mm_po_line SET quantity_received = ${newReceivedQty} WHERE id = ${poLine.id}
        `);

        // 6. Handle DELIV_COMPLETED (legacy ELIKZ) - Delivery Completed Indicator
        // If this is marked as final delivery (short-shipment final), set delivery_completed=true
        // This closes the line even if received < ordered
        if (params.isFinalDelivery) {
          await tx.execute(sql`
            UPDATE mm_po_line 
            SET delivery_completed = true, is_closed = true, closed_reason = ${params.shortShipmentReason || 'SHORT_SHIPMENT_FINAL'}, closed_at = NOW(), closed_by = ${params.createdBy}
            WHERE id = ${poLine.id}
          `);
        } else {
          // Auto-close if fully received (with tolerance 0.001)
          if (Math.abs(newReceivedQty - orderedQty) < 0.001 || newReceivedQty >= orderedQty) {
            await tx.execute(sql`
              UPDATE mm_po_line SET is_closed = true, closed_at = NOW() WHERE id = ${poLine.id}
            `);
          }
        }
      }

      // 7. Update PO status based on all lines
      const allLinesRes = await tx.execute(sql`
        SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_closed = true) as closed_count
        FROM mm_po_line WHERE po_id = ${params.poId}
      `);
      const { total, closed_count } = allLinesRes.rows[0] as any;
      
      if (parseInt(closed_count) === parseInt(total)) {
        await tx.execute(sql`UPDATE mm_purchase_order SET status = 'FULLY_RECEIVED' WHERE id = ${params.poId}`);
      } else if (parseInt(closed_count) > 0) {
        await tx.execute(sql`UPDATE mm_purchase_order SET status = 'PARTIALLY_RECEIVED' WHERE id = ${params.poId}`);
      }

      // 8. Update GR header totals
      await tx.execute(sql`
        UPDATE mm_goods_receipt SET total_amount = ${totalAmount}, total_landed_cost = ${totalLanded} WHERE id = ${grId}
      `);

      // 9. Create FI document for GR - INV_POSTING/GR_IR_CLEARING (legacy BSX/WRX) auto posting (in same transaction for ACID)
      const fiDocNumber = `FI-GR-${Date.now()}`;
      const fiDocRes = await tx.execute(sql`
        INSERT INTO fin_universal_ledger (document_number, company_code_id, doc_type, posting_date, document_date, reference, header_text, total_debit, total_credit, currency, status, reference_doc_type, reference_doc_id, reference_doc_number)
        VALUES (${fiDocNumber}, ${po.company_code_id}, 'WE', ${params.postingDate}, ${params.documentDate}, ${po.po_number}, ${'GR ' + grNumber + ' for PO ' + po.po_number}, ${totalAmount}, ${totalAmount}, 'KWD', 'POSTED', 'GR', ${grId}, ${grNumber})
        RETURNING id
      `);
      const fiDocId = (fiDocRes.rows[0] as any).id;

      // FI lines: Dr Inventory (BSX) Cr GR/IR (WRX) - simplified, real would use auto determination
      // TODO: Proper GL account determination via fin_auto_posting_rule

      await tx.execute(sql`UPDATE mm_goods_receipt SET fi_document_id = ${fiDocId} WHERE id = ${grId}`);

      return {
        grId,
        grNumber,
        fiDocumentId: fiDocId,
        totalAmount,
        linesProcessed: params.lines.length,
        isFinalDelivery: params.isFinalDelivery || false,
      };
    });
  }

  /**
   * Toggle DELIV_COMPLETED (legacy ELIKZ) - Mark PO line as delivery completed (short-shipment final)
   * Prevents further GRs and clears open commitment
   */
  static async setDeliveryCompleted(params: {
    poLineId: string;
    isCompleted: boolean;
    reason?: string;
    userId: string;
  }) {
    return withTransaction(async (tx) => {
      const poLineRes = await tx.execute(sql`
        SELECT id, po_id, quantity, quantity_received, delivery_completed, is_closed
        FROM mm_po_line WHERE id = ${params.poLineId} FOR UPDATE
      `);
      const poLine = (poLineRes.rows[0] as any);
      if (!poLine) throw new Error('PO line not found');

      const ordered = parseFloat(poLine.quantity);
      const received = parseFloat(poLine.quantity_received || '0');
      const shortQty = ordered - received;

      if (params.isCompleted) {
        await tx.execute(sql`
          UPDATE mm_po_line 
          SET delivery_completed = true, is_closed = true, closed_reason = ${params.reason || 'SHORT_SHIPMENT_FINAL'}, closed_at = NOW(), closed_by = ${params.userId}
          WHERE id = ${params.poLineId}
        `);

        // If short shipment, log variance for audit
        if (shortQty > 0.001) {
          await tx.execute(sql`
            INSERT INTO audit_log (table_name, record_id, record_number, action, old_values, new_values, changed_by, description)
            VALUES ('mm_po_line', ${poLine.id}, ${poLine.po_id}, 'UPDATE', ${JSON.stringify({ delivery_completed: false })}::jsonb, ${JSON.stringify({ delivery_completed: true, short_qty: shortQty, reason: params.reason })}::jsonb, ${params.userId}, ${'DELIV_COMPLETED (legacy ELIKZ) set: short-shipment final, ordered ' + ordered + ' received ' + received + ' short ' + shortQty})
          `);
        }
      } else {
        // Reopen - only allowed if not fully invoiced etc (simplified)
        await tx.execute(sql`
          UPDATE mm_po_line SET delivery_completed = false, is_closed = false, closed_reason = null, closed_at = null, closed_by = null
          WHERE id = ${params.poLineId}
        `);
      }

      // Update PO header status
      const allLinesRes = await tx.execute(sql`
        SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_closed = true) as closed_count
        FROM mm_po_line WHERE po_id = ${poLine.po_id}
      `);
      const { total, closed_count } = allLinesRes.rows[0] as any;
      
      if (parseInt(closed_count) === parseInt(total)) {
        await tx.execute(sql`UPDATE mm_purchase_order SET status = 'FULLY_RECEIVED' WHERE id = ${poLine.po_id}`);
      } else {
        await tx.execute(sql`UPDATE mm_purchase_order SET status = 'PARTIALLY_RECEIVED' WHERE id = ${poLine.po_id}`);
      }

      return {
        poLineId: params.poLineId,
        deliveryCompleted: params.isCompleted,
        orderedQty: ordered,
        receivedQty: received,
        shortQty: shortQty,
        message: params.isCompleted 
          ? `PO line closed via DELIV_COMPLETED (legacy ELIKZ). Short shipment ${shortQty} cleared from commitment. No further GRs allowed.`
          : `PO line reopened. Open qty ${ordered - received} available for GR.`,
      };
    });
  }

  /**
   * Get PO line status with open qty and DELIV_COMPLETED (legacy ELIKZ) info for UI
   */
  static async getPoLineStatus(poId: string) {
    const res = await db.execute(sql`
      SELECT 
        l.id, l.line_number, l.material_id, m.description, m.material_number,
        l.quantity as ordered_qty, l.quantity_received as received_qty,
        (l.quantity - l.quantity_received) as open_qty,
        l.delivery_completed, l.is_closed, l.closed_reason, l.closed_at,
        l.unit_price, l.total_per_unit,
        CASE 
          WHEN l.delivery_completed THEN 'CLOSED_SHORT'
          WHEN l.is_closed THEN 'CLOSED'
          WHEN l.quantity_received = 0 THEN 'OPEN'
          WHEN l.quantity_received < l.quantity THEN 'PARTIAL'
          ELSE 'FULL'
        END as status
      FROM mm_po_line l
      JOIN prod_item m ON l.material_id = m.id
      WHERE l.po_id = ${poId}
      ORDER BY l.line_number
    `);
    return res.rows;
  }
}
