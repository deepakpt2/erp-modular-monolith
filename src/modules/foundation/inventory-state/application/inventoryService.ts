/**
 * Inventory State Mechanics - Core Invariant Enforcement
 * Updated for: Configurable Expiry Blocking, Landed Cost MAP, Kitting K01/K02
 */
import { db, withTransaction } from '@/shared/kernel/db/client';
import { invStock, invStockLedger } from '../infrastructure/schema';
import { eq, and } from 'drizzle-orm';

export type MovementType = 
  | 'GR_PO' // GR for PO
  | 'GR_PO_REV' // GR reversal
  | 'GR_RETURN' // Return to vendor
  | 'GI_PROD' // GI for production order
  | 'GI_PROD_REV' // GI reversal
  | '311' // Transfer
  | '321' // QI -> Unrestricted
  | '322' // QI -> Blocked
  | '343' // Blocked -> Unrestricted
  | '344' // Unrestricted -> Blocked
  | '350' // QI -> Blocked scrap
  | '453' // Yield from production
  | 'GI_SCRAP' // Scrap / Spoilage
  | 'INIT_STOCK' // Initial upload
  | 'GI_SALES' // GI for sales / POS
  | 'K01' // Kitting consumption (stocked kit build)
  | 'K02'; // Kitting production (stocked kit receipt)

export type StockStatus = 'UNRESTRICTED' | 'QUALITY_INSPECTION' | 'BLOCKED' | 'RETURNS' | 'IN_TRANSIT';

interface PostMovementParams {
  movementType: MovementType;
  materialId: string;
  plantId: string;
  slocId: string;
  batchId?: string | null;
  quantity: number; // Positive = receipt, Negative = issue
  stockStatusFrom?: StockStatus | null;
  stockStatusTo: StockStatus;
  referenceDocType: string;
  referenceDocId?: string;
  referenceDocNumber?: string;
  unitCost?: number; // Base price
  unitLandedCost?: number; // Freight + Customs + Tax per unit for MAP
  postedBy?: string;
  headerText?: string;
  skipExpiryCheck?: boolean; // For admin override
}

export class InventoryService {
  /**
   * Post stock movement with:
   * - Configurable expiry blocking per material
   * - Physical Inventory blocking (PID active)
   * - Landed cost MAP calculation
   * - Strict valuation
   */
  static async postMovement(params: PostMovementParams) {
    return withTransaction(async (tx) => {
      // 0a. Check Physical Inventory blocking - prevent moving-target counts
      // When PID active for SLoc+Material, block 101/261/601 movements
      const blockingTypes = ['GR_PO', 'GI_PROD', 'GI_SALES', 'K01', 'K02', '453', 'GI_SCRAP'];
      if (blockingTypes.includes(params.movementType)) {
        const activePidRes = await tx.execute(`
          SELECT d.id, d.pi_number
          FROM pi_document d
          JOIN pi_line l ON d.id = l.pi_document_id
          WHERE d.plant_id = $1 
            AND d.sloc_id = $2
            AND d.status IN ('CREATED', 'COUNT_ENTERED')
            AND d.is_blocking_active = true
            AND l.material_id = $3
          LIMIT 1
        ` as any);
        if (activePidRes.rows && activePidRes.rows.length > 0) {
          const pid = activePidRes.rows[0] as any;
          throw new Error(`PHYSICAL_INVENTORY_BLOCK: Movement ${params.movementType} blocked for material ${params.materialId} in SLoc ${params.slocId} - PID ${pid.pi_number} active. Complete count and post differences before movements allowed. Prevents moving-target counts.`);
        }
      }

      // 0b. Check expiry control for GI movements (negative qty)
      if (params.quantity < 0 && !params.skipExpiryCheck) {
        const expiryCheck = await tx.execute(`
          SELECT 
            m.id, m.description, m.expiry_control, m.shelf_life_days,
            mp.expiry_control_override,
            b.id as batch_id, b.batch_number, b.expiry_date, b.is_expired,
            COALESCE(mp.expiry_control_override, m.expiry_control) as effective_control
          FROM prod_item m
          JOIN prod_item_plant mp ON m.id = mp.material_id AND mp.plant_id = $2
          LEFT JOIN inv_lot b ON b.id = $3
          WHERE m.id = $1
        ` as any);

        if (expiryCheck.rows && expiryCheck.rows.length > 0) {
          const mat = expiryCheck.rows[0] as any;
          const effectiveControl = mat.effective_control || 'BLOCK';
          const expiryDate = mat.expiry_date ? new Date(mat.expiry_date) : null;
          const isExpired = mat.is_expired || (expiryDate && expiryDate < new Date());

          if (isExpired) {
            if (effectiveControl === 'BLOCK') {
              throw new Error(`EXPIRY_BLOCK: Cannot issue expired batch ${mat.batch_number} for material ${mat.description}. Expiry: ${mat.expiry_date}. Control=BLOCK.`);
            } else if (effectiveControl === 'WARNING') {
              console.warn(`EXPIRY_WARNING: Issuing expired batch ${mat.batch_number} for ${mat.description}`);
              // Allow but log warning - will be stored in sales line or confirmation
            } else if (effectiveControl === 'RESTRICTED_USE') {
              // Auto downgrade to restricted - require manual UD or allow with flag
              console.warn(`EXPIRY_RESTRICTED: Batch ${mat.batch_number} expired, should be moved to RESTRICTED_USE`);
              // For now allow but caller should handle moving to restricted
            }
          }
        }
      }

      // 1. Lock stock row for update
      const existingStocks = await tx.execute(`
        SELECT id, quantity, batch_id
        FROM inv_stock
        WHERE material_id = $1
          AND plant_id = $2
          AND sloc_id = $3
          AND (batch_id = $4 OR (batch_id IS NULL AND $4 IS NULL))
          AND stock_status = $5
        FOR UPDATE
      ` as any);

      let stockId: string;
      let quantityBefore = 0;
      let quantityAfter = 0;

      if (!existingStocks.rows || existingStocks.rows.length === 0) {
        if (params.quantity < 0) {
          throw new Error(`Insufficient stock: Cannot issue ${Math.abs(params.quantity)} from non-existent stock: ${params.materialId} ${params.stockStatusTo}`);
        }
        const inserted = await tx.execute(`
          INSERT INTO inv_stock (material_id, plant_id, sloc_id, batch_id, stock_status, quantity)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, quantity
        ` as any);
        const row = (inserted.rows[0] as any);
        stockId = row.id;
        quantityBefore = 0;
        quantityAfter = params.quantity;
      } else {
        const stock = existingStocks.rows[0] as any;
        stockId = stock.id;
        quantityBefore = parseFloat(stock.quantity);
        quantityAfter = quantityBefore + params.quantity;

        if (quantityAfter < -0.001) {
          throw new Error(`Insufficient stock: have ${quantityBefore}, trying to issue ${Math.abs(params.quantity)} for ${params.materialId}`);
        }

        await tx.execute(`
          UPDATE inv_stock
          SET quantity = $1, updated_at = NOW()
          WHERE id = $2
        ` as any);
      }

      // 2. Handle valuation - MAP with landed costs
      const materialPlants = await tx.execute(`
        SELECT id, price_control, moving_avg_price, standard_price, total_stock_qty, total_stock_value, total_landed_cost
        FROM prod_item_plant
        WHERE material_id = $1 AND plant_id = $2
        FOR UPDATE
      ` as any);

      let unitCost = params.unitCost || 0;
      let unitLandedCost = params.unitLandedCost || 0;
      let totalCostPerUnit = unitCost + unitLandedCost;
      let totalValueAfter = 0;
      let totalValueBefore = 0;

      if (materialPlants.rows && materialPlants.rows.length > 0) {
        const matPlant = materialPlants.rows[0] as any;
        totalValueBefore = parseFloat(matPlant.total_stock_value);
        const qtyBefore = parseFloat(matPlant.total_stock_qty);
        const landedBefore = parseFloat(matPlant.total_landed_cost || '0');

        if (matPlant.price_control === 'V') {
          // Moving Average Price with landed costs: (Total Value Before + Receipt Value + Landed) / (Qty Before + Receipt Qty)
          if (params.quantity > 0) {
            const receiptValue = params.quantity * unitCost;
            const receiptLanded = params.quantity * unitLandedCost;
            const newTotalQty = qtyBefore + params.quantity;
            const newTotalValue = totalValueBefore + receiptValue + receiptLanded;
            const newTotalLanded = landedBefore + receiptLanded;
            const newMAP = newTotalQty > 0 ? newTotalValue / newTotalQty : 0;

            await tx.execute(`
              UPDATE prod_item_plant
              SET moving_avg_price = $1, total_stock_qty = $2, total_stock_value = $3, total_landed_cost = $4, 
                  last_gr_price = $5, last_gr_landed_cost = $6, updated_at = NOW()
              WHERE id = $7
            ` as any);
            totalValueAfter = newTotalValue;
            unitCost = newMAP;
            totalCostPerUnit = newMAP;
          } else {
            // Issue at current MAP
            unitCost = parseFloat(matPlant.moving_avg_price);
            totalCostPerUnit = unitCost;
            const issueValue = Math.abs(params.quantity) * unitCost;
            totalValueAfter = totalValueBefore - issueValue;
            const newQty = qtyBefore + params.quantity; // quantity negative
            await tx.execute(`
              UPDATE prod_item_plant
              SET total_stock_qty = $1, total_stock_value = $2, updated_at = NOW()
              WHERE id = $3
            ` as any);
          }
        } else {
          // Standard Price - variance goes to price difference account (PRD)
          unitCost = parseFloat(matPlant.standard_price);
          totalCostPerUnit = unitCost;
          totalValueAfter = (qtyBefore + params.quantity) * unitCost;
          await tx.execute(`
            UPDATE prod_item_plant
            SET total_stock_qty = $1, total_stock_value = $2, updated_at = NOW()
            WHERE id = $3
          ` as any);
        }
      }

      // 3. Write immutable ledger with landed cost
      const ledgerResult = await tx.execute(`
        INSERT INTO inv_stock_ledger (
          movement_type, material_id, plant_id, sloc_id, batch_id,
          stock_status_from, stock_status_to, quantity, quantity_before, quantity_after,
          unit_cost, total_value, total_value_before, total_value_after,
          reference_doc_type, reference_doc_id, reference_doc_number,
          posted_by, header_text
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
        RETURNING id
      ` as any);

      return {
        stockId,
        ledgerId: (ledgerResult.rows[0] as any).id,
        quantityBefore,
        quantityAfter,
        unitCost,
        totalCostPerUnit,
        unitLandedCost,
      };
    });
  }

  static async getUnrestrictedStock(materialId: string, plantId: string) {
    const result = await db.execute(`
      SELECT s.id, s.material_id, s.plant_id, s.sloc_id, s.batch_id, s.quantity,
             b.batch_number, b.expiry_date, b.is_expired,
             m.description, m.expiry_control,
             mp.expiry_control_override,
             COALESCE(mp.expiry_control_override, m.expiry_control) as effective_control
      FROM inv_stock s
      JOIN prod_item m ON s.material_id = m.id
      JOIN prod_item_plant mp ON m.id = mp.material_id AND mp.plant_id = s.plant_id
      LEFT JOIN inv_lot b ON s.batch_id = b.id
      WHERE s.material_id = $1
        AND s.plant_id = $2
        AND s.stock_status = 'UNRESTRICTED'
        AND s.quantity > 0
        AND (b.is_expired = false OR b.id IS NULL)
        AND (b.expiry_date IS NULL OR b.expiry_date > NOW() OR COALESCE(mp.expiry_control_override, m.expiry_control) != 'BLOCK')
      ORDER BY b.expiry_date ASC NULLS LAST, s.created_at ASC
    ` as any);
    return result.rows;
  }

  static async postUsageDecision(
    materialId: string,
    plantId: string,
    slocId: string,
    batchId: string | null,
    quantity: number,
    decision: 'APPROVE' | 'REJECT' | 'RESTRICTED',
    referenceDocNumber: string,
    postedBy: string
  ) {
    let toStatus: StockStatus = 'UNRESTRICTED';
    let movementType: MovementType = '321';

    if (decision === 'APPROVE') {
      toStatus = 'UNRESTRICTED';
      movementType = '321';
    } else if (decision === 'REJECT') {
      toStatus = 'BLOCKED';
      movementType = '322';
    } else if (decision === 'RESTRICTED') {
      toStatus = 'BLOCKED'; // Using BLOCKED to represent restricted use, could add RESTRICTED_USE status later
      movementType = '344';
    }

    await this.postMovement({
      movementType,
      materialId,
      plantId,
      slocId,
      batchId,
      quantity: -quantity,
      stockStatusFrom: 'QUALITY_INSPECTION',
      stockStatusTo: 'QUALITY_INSPECTION',
      referenceDocType: 'QI_UD',
      referenceDocNumber,
      postedBy,
      headerText: `UD ${decision} QI->${toStatus}`,
    });

    return this.postMovement({
      movementType,
      materialId,
      plantId,
      slocId,
      batchId,
      quantity,
      stockStatusFrom: 'QUALITY_INSPECTION',
      stockStatusTo: toStatus,
      referenceDocType: 'QI_UD',
      referenceDocNumber,
      postedBy,
      headerText: `UD ${decision} QI->${toStatus}`,
    });
  }

  /**
   * Kitting: Stocked Kit production K01/K02
   * K01: Consume components
   * K02: Produce kit batch with inherited expiry
   */
  static async postKittingMovements(params: {
    kitMaterialId: string;
    kitBatchId: string;
    kitQuantity: number;
    plantId: string;
    slocId: string;
    components: { materialId: string; batchId?: string | null; quantity: number; slocId: string; unitCost?: number; unitLandedCost?: number }[];
    kittingNumber: string;
    postedBy?: string;
    targetExpiryDate?: Date;
  }) {
    return withTransaction(async (tx) => {
      // K01: Issue components
      for (const comp of params.components) {
        await this.postMovement({
          movementType: 'K01',
          materialId: comp.materialId,
          plantId: params.plantId,
          slocId: comp.slocId,
          batchId: comp.batchId || null,
          quantity: -comp.quantity,
          stockStatusTo: 'UNRESTRICTED',
          referenceDocType: 'KITTING_ORDER',
          referenceDocNumber: params.kittingNumber,
          unitCost: comp.unitCost,
          unitLandedCost: comp.unitLandedCost,
          postedBy: params.postedBy,
          headerText: `Kitting consumption for ${params.kittingNumber}`,
        });
      }

      // Calculate total cost for kit = sum(component costs)
      let totalKitCost = 0;
      let totalKitLanded = 0;
      for (const comp of params.components) {
        totalKitCost += (comp.unitCost || 0) * comp.quantity;
        totalKitLanded += (comp.unitLandedCost || 0) * comp.quantity;
      }
      const kitUnitCost = params.kitQuantity > 0 ? totalKitCost / params.kitQuantity : 0;
      const kitUnitLanded = params.kitQuantity > 0 ? totalKitLanded / params.kitQuantity : 0;

      // K02: Receipt of kit
      const result = await this.postMovement({
        movementType: 'K02',
        materialId: params.kitMaterialId,
        plantId: params.plantId,
        slocId: params.slocId,
        batchId: params.kitBatchId,
        quantity: params.kitQuantity,
        stockStatusTo: 'UNRESTRICTED',
        referenceDocType: 'KITTING_ORDER',
        referenceDocNumber: params.kittingNumber,
        unitCost: kitUnitCost,
        unitLandedCost: kitUnitLanded,
        postedBy: params.postedBy,
        headerText: `Kitting production ${params.kittingNumber} expiry ${params.targetExpiryDate?.toISOString()}`,
      });

      return result;
    });
  }
}
