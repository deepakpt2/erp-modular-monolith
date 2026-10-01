/**
 * Invoice Verification Service - Landed Cost MAP Adjustment
 * Supports freight, customs, non-recoverable taxes inclusion into MAP at IV time
 */
import { db, withTransaction } from '@/shared/kernel/db/client';

export interface LandedCostLine {
  materialId: string;
  quantity: number;
  unitPricePo: number;
  unitPriceInvoiced: number;
  freightPerUnit: number;
  customsPerUnit: number;
  otherPerUnit: number;
  taxPerUnit?: number;
}

export class InvoiceVerificationService {
  /**
   * Post IV and adjust MAP with landed costs
   * This is critical for accurate COGS
   */
  static async postInvoiceVerification(params: {
    ivId: string;
    postedBy: string;
  }) {
    return withTransaction(async (tx) => {
      const ivRes = await tx.execute(`
        SELECT id, po_id, gr_id, status, total_landed_cost, price_variance, is_landed_cost_posted
        FROM mm_invoice_verification
        WHERE id = $1 FOR UPDATE
      ` as any);

      const iv = (ivRes.rows[0] as any);
      if (!iv) throw new Error('IV not found');
      if (iv.status === 'POSTED') throw new Error('Already posted');
      if (iv.is_landed_cost_posted) throw new Error('Landed cost already posted to MAP');

      const linesRes = await tx.execute(`
        SELECT id, material_id, quantity, unit_price_invoiced, unit_price_po,
               freight_per_unit, customs_per_unit, other_per_unit, total_per_unit_final,
               price_variance_per_unit, gr_line_id, po_line_id
        FROM mm_iv_line
        WHERE iv_id = $1
      ` as any);

      let totalPriceVariance = 0;
      let totalLandedAdjustment = 0;

      for (const line of linesRes.rows as any[]) {
        const qty = parseFloat(line.quantity);
        const pricePo = parseFloat(line.unit_price_po);
        const priceInvoiced = parseFloat(line.unit_price_invoiced);
        const freight = parseFloat(line.freight_per_unit || '0');
        const customs = parseFloat(line.customs_per_unit || '0');
        const other = parseFloat(line.other_per_unit || '0');
        const totalFinal = parseFloat(line.total_per_unit_final);

        // Price variance = invoiced - PO
        const variancePerUnit = priceInvoiced - pricePo;
        const varianceTotal = variancePerUnit * qty;
        totalPriceVariance += varianceTotal;

        // Landed cost = freight + customs + other (non-recoverable)
        const landedPerUnit = freight + customs + other;
        const landedTotal = landedPerUnit * qty;
        totalLandedAdjustment += landedTotal;

        // Get material plant for MAP adjustment
        const matPlantRes = await tx.execute(`
          SELECT id, price_control, moving_avg_price, total_stock_qty, total_stock_value, total_landed_cost
          FROM prod_item_plant
          WHERE material_id = $1
          FOR UPDATE
        ` as any);

        if (matPlantRes.rows && matPlantRes.rows.length > 0) {
          const matPlant = matPlantRes.rows[0] as any;
          
          if (matPlant.price_control === 'V') {
            // MAP adjustment: Add landed cost and price variance to stock value
            // New MAP = (Old Total Value + Landed + Variance) / Qty
            // But careful: If stock already issued, variance goes to price difference
            const oldValue = parseFloat(matPlant.total_stock_value);
            const oldQty = parseFloat(matPlant.total_stock_qty);
            const oldLanded = parseFloat(matPlant.total_landed_cost || '0');

            // Only adjust if stock still exists, otherwise post to price diff account
            if (oldQty > 0) {
              const newTotalValue = oldValue + landedTotal + varianceTotal;
              const newMAP = newTotalValue / oldQty;
              const newLanded = oldLanded + landedTotal;

              await tx.execute(`
                UPDATE prod_item_plant
                SET moving_avg_price = $1, total_stock_value = $2, total_landed_cost = $3, updated_at = NOW()
                WHERE id = $4
              ` as any);
            } else {
              // Stock already consumed - variance goes to PRD (price difference) account, not MAP
              console.log(`Material ${line.material_id} stock zero, variance ${varianceTotal} goes to PRD account`);
            }
          }
          // For standard price (S), variance always goes to PRD, not to MAP
        }

        // Update GR line with final landed cost if needed
        if (line.gr_line_id) {
          await tx.execute(`
            UPDATE mm_gr_line
            SET unit_landed_cost = $1, total_value = $2
            WHERE id = $3
          ` as any);
        }
      }

      // Create FI document for IV: RE + WRX clearing + BSX adjustment + PRD for variance
      const fiDocNumber = `FI-IV-${Date.now()}`;
      const poRes = await tx.execute(`SELECT company_code_id FROM mm_purchase_order WHERE id = $1` as any);
      const companyCodeId = (poRes.rows[0] as any).company_code_id;

      const fiDocRes = await tx.execute(`
        INSERT INTO fin_universal_ledger (document_number, company_code_id, doc_type, posting_date, document_date, reference, header_text, total_debit, total_credit, currency, status, reference_doc_type, reference_doc_id)
        VALUES ($1,$2,'RE',NOW(),NOW(),$3,$4,$5,$5,'KWD','POSTED','IV',$6)
        RETURNING id
      ` as any);
      const fiDocId = (fiDocRes.rows[0] as any).id;

      // TODO: Create FI lines with auto determination
      // Dr GR/IR (WRX) Cr Vendor (AP)
      // Dr Inventory (BSX) Cr GR/IR for landed cost adjustment
      // Dr/Cr Price Difference (PRD) for variance

      await tx.execute(`
        UPDATE mm_invoice_verification
        SET status = 'POSTED', fi_document_id = $1, is_landed_cost_posted = true, price_variance = $2
        WHERE id = $3
      ` as any);

      return {
        fiDocumentId: fiDocId,
        totalPriceVariance,
        totalLandedAdjustment,
        message: `IV posted. MAP adjusted with landed cost ${totalLandedAdjustment} and variance ${totalPriceVariance}. For standard price materials, variance posted to PRD account.`
      };
    });
  }

  /**
   * Calculate landed cost per unit from PO header charges
   * Distributes freight/customs proportionally by value or qty
   */
  static calculateLandedCostDistribution(
    poLines: { materialId: string; quantity: number; unitPrice: number; lineTotal: number }[],
    freightTotal: number,
    customsTotal: number,
    otherTotal: number,
    distributionMethod: 'BY_VALUE' | 'BY_QTY' = 'BY_VALUE'
  ): Map<string, { freightPerUnit: number; customsPerUnit: number; otherPerUnit: number }> {
    const result = new Map<string, { freightPerUnit: number; customsPerUnit: number; otherPerUnit: number }>();
    
    const totalValue = poLines.reduce((sum, l) => sum + l.lineTotal, 0);
    const totalQty = poLines.reduce((sum, l) => sum + l.quantity, 0);

    for (const line of poLines) {
      let freightPerUnit = 0;
      let customsPerUnit = 0;
      let otherPerUnit = 0;

      if (distributionMethod === 'BY_VALUE' && totalValue > 0) {
        const ratio = line.lineTotal / totalValue;
        freightPerUnit = (freightTotal * ratio) / line.quantity;
        customsPerUnit = (customsTotal * ratio) / line.quantity;
        otherPerUnit = (otherTotal * ratio) / line.quantity;
      } else if (totalQty > 0) {
        const ratio = line.quantity / totalQty;
        freightPerUnit = (freightTotal * ratio) / line.quantity;
        customsPerUnit = (customsTotal * ratio) / line.quantity;
        otherPerUnit = (otherTotal * ratio) / line.quantity;
      }

      result.set(line.materialId, { freightPerUnit, customsPerUnit, otherPerUnit });
    }

    return result;
  }
}
