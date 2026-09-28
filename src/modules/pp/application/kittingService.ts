/**
 * Kitting Service - Supports both Stocked and Phantom Kits
 * Stocked: K01/K02 movements, batch with inherited expiry
 * Phantom: Dynamic explosion at production confirmation (261)
 */
import { db, withTransaction } from '@/shared/kernel/db/client';
import { InventoryService } from '../../foundation/inventory-state/application/inventoryService';

export interface BomExplosionResult {
  materialId: string;
  quantity: number;
  uom: string;
  isPhantom: boolean;
  bomHeaderId?: string;
  components?: BomExplosionResult[]; // Recursive for phantom
}

export class KittingService {
  /**
   * Explode BOM recursively, handling phantom kits
   */
  static async explodeBom(
    materialId: string,
    plantId: string,
    quantity: number,
    visited = new Set<string>()
  ): Promise<BomExplosionResult[]> {
    if (visited.has(materialId)) {
      throw new Error(`Circular BOM detected for material ${materialId}`);
    }
    visited.add(materialId);

    const bomResult = await db.execute(`
      SELECT h.id, h.is_phantom, h.is_kit, h.type, l.component_material_id, l.quantity, l.uom, l.is_phantom_explode,
             cm.is_phantom_kit, cm.is_kit, cm.description
      FROM pp_bom_header h
      JOIN pp_bom_line l ON h.id = l.bom_header_id
      JOIN ent_material_master cm ON l.component_material_id = cm.id
      WHERE h.material_id = $1 AND h.plant_id = $2 AND h.status = 'ACTIVE'
        AND (h.valid_to IS NULL OR h.valid_to > NOW())
      ORDER BY l.line_number
    ` as any);

    if (!bomResult.rows || bomResult.rows.length === 0) {
      return []; // No BOM = raw material
    }

    const results: BomExplosionResult[] = [];

    for (const row of bomResult.rows as any[]) {
      const requiredQty = (parseFloat(row.quantity) * quantity);
      
      // If component is phantom kit and flagged for explosion, explode recursively
      if (row.is_phantom_kit && row.is_phantom_explode) {
        const subComponents = await this.explodeBom(row.component_material_id, plantId, requiredQty, new Set(visited));
        results.push(...subComponents);
      } else {
        results.push({
          materialId: row.component_material_id,
          quantity: requiredQty,
          uom: row.uom,
          isPhantom: row.is_phantom_kit || false,
          bomHeaderId: row.id,
        });
      }
    }

    return results;
  }

  /**
   * Create Stocked Kit - Make-to-Stock with K01/K02
   * Calculates expiry as MIN(component expiries) or fixed days
   */
  static async createStockedKit(params: {
    kitMaterialId: string;
    plantId: string;
    slocId: string;
    quantity: number;
    bomHeaderId: string;
    createdBy: string;
  }) {
    return withTransaction(async (tx) => {
      // Get BOM lines
      const bomLines = await tx.execute(`
        SELECT l.component_material_id, l.quantity, l.uom, m.description
        FROM pp_bom_line l
        JOIN ent_material_master m ON l.component_material_id = m.id
        WHERE l.bom_header_id = $1
      ` as any);

      // Get components with batch FIFO by expiry
      const components: any[] = [];
      let minExpiry: Date | null = null;

      for (const line of bomLines.rows as any[]) {
        const requiredQty = parseFloat(line.quantity) * params.quantity;
        
        // Get unrestricted stock FIFO by expiry
        const stockResult = await tx.execute(`
          SELECT s.batch_id, b.expiry_date, s.quantity, s.sloc_id, mp.moving_avg_price
          FROM inv_stock s
          LEFT JOIN ent_batch b ON s.batch_id = b.id
          JOIN ent_material_plant mp ON s.material_id = mp.material_id AND s.plant_id = mp.plant_id
          WHERE s.material_id = $1 AND s.plant_id = $2 AND s.stock_status = 'UNRESTRICTED' AND s.quantity > 0
          ORDER BY b.expiry_date ASC NULLS LAST
        ` as any);

        let remaining = requiredQty;
        for (const stock of stockResult.rows as any[]) {
          if (remaining <= 0) break;
          const available = parseFloat(stock.quantity);
          const toConsume = Math.min(available, remaining);
          
          components.push({
            materialId: line.component_material_id,
            batchId: stock.batch_id,
            quantity: toConsume,
            slocId: stock.sloc_id,
            unitCost: parseFloat(stock.moving_avg_price || '0'),
            unitLandedCost: 0,
          });

          if (stock.expiry_date) {
            const exp = new Date(stock.expiry_date);
            if (!minExpiry || exp < minExpiry) minExpiry = exp;
          }

          remaining -= toConsume;
        }

        if (remaining > 0.001) {
          throw new Error(`Insufficient stock for component ${line.description}: need ${requiredQty}, missing ${remaining}`);
        }
      }

      // Get BOM header for expiry rule
      const bomHeader = await tx.execute(`
        SELECT expiry_rule, fixed_shelf_life_days FROM pp_bom_header WHERE id = $1
      ` as any);
      const header = (bomHeader.rows[0] as any);
      
      let targetExpiry: Date | undefined;
      if (header.expiry_rule === 'MIN_COMPONENTS' && minExpiry) {
        targetExpiry = minExpiry;
      } else if (header.expiry_rule === 'FIXED_DAYS' && header.fixed_shelf_life_days) {
        targetExpiry = new Date();
        targetExpiry.setDate(targetExpiry.getDate() + header.fixed_shelf_life_days);
      } else {
        targetExpiry = minExpiry || undefined;
      }

      // Create new batch for kit
      const batchNumber = `KIT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const batchResult = await tx.execute(`
        INSERT INTO ent_batch (batch_number, material_id, plant_id, manufacturing_date, expiry_date)
        VALUES ($1, $2, $3, NOW(), $4)
        RETURNING id
      ` as any);
      const batchId = (batchResult.rows[0] as any).id;

      // Create kitting number
      const kittingNumber = `KIT${Date.now()}`;

      // Post K01/K02 movements
      const kittingResult = await InventoryService.postKittingMovements({
        kitMaterialId: params.kitMaterialId,
        kitBatchId: batchId,
        kitQuantity: params.quantity,
        plantId: params.plantId,
        slocId: params.slocId,
        components,
        kittingNumber,
        postedBy: params.createdBy,
        targetExpiryDate: targetExpiry,
      });

      // Create production order for kitting
      const prodOrderResult = await tx.execute(`
        INSERT INTO pp_production_order (order_number, type, material_id, plant_id, bom_header_id, quantity_planned, quantity_yield, status, target_batch_id, target_batch_number, target_expiry_date, is_kitting)
        VALUES ($1, 'KITTING', $2, $3, $4, $5, $5, 'CONFIRMED', $6, $7, $8, true)
        RETURNING id
      ` as any);

      const prodOrderId = (prodOrderResult.rows[0] as any).id;

      // Create kitting order link
      await tx.execute(`
        INSERT INTO pp_kitting_order (kitting_number, production_order_id, kit_material_id, target_batch_id, target_quantity, min_component_expiry, calculated_expiry, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'CONFIRMED')
      ` as any);

      return {
        batchId,
        batchNumber,
        kittingNumber,
        productionOrderId: prodOrderId,
        minExpiry,
        targetExpiry,
        componentsConsumed: components.length,
      };
    });
  }

  /**
   * Phantom Kit Explosion at Production Confirmation (261)
   * No intermediate stock, directly issue components
   */
  static async confirmProductionWithPhantomExplosion(params: {
    productionOrderId: string;
    yieldQuantity: number;
    scrapQuantity?: number;
    workCenterId?: string;
    postedBy: string;
  }) {
    return withTransaction(async (tx) => {
      const orderResult = await tx.execute(`
        SELECT material_id, plant_id, bom_header_id, quantity_planned
        FROM pp_production_order
        WHERE id = $1
      ` as any);

      const order = (orderResult.rows[0] as any);
      if (!order) throw new Error('Production order not found');

      // Explode BOM with phantom handling
      const exploded = await this.explodeBom(order.material_id, order.plant_id, params.yieldQuantity);

      // Issue components via 261 movement (including phantom exploded)
      for (const comp of exploded) {
        // Get batch FIFO
        const stockResult = await tx.execute(`
          SELECT batch_id, sloc_id, quantity FROM inv_stock
          WHERE material_id = $1 AND plant_id = $2 AND stock_status = 'UNRESTRICTED' AND quantity > 0
          ORDER BY created_at ASC
        ` as any);

        let remaining = comp.quantity;
        for (const stock of stockResult.rows as any[]) {
          if (remaining <= 0) break;
          const toIssue = Math.min(parseFloat(stock.quantity), remaining);
          
          await InventoryService.postMovement({
            movementType: '261',
            materialId: comp.materialId,
            plantId: order.plant_id,
            slocId: stock.sloc_id,
            batchId: stock.batch_id,
            quantity: -toIssue,
            stockStatusTo: 'UNRESTRICTED',
            referenceDocType: 'PROD_ORDER',
            referenceDocId: params.productionOrderId,
            referenceDocNumber: order.material_id,
            postedBy: params.postedBy,
            headerText: `GI for production order ${params.productionOrderId} ${comp.isPhantom ? '(phantom exploded)' : ''}`,
          });

          remaining -= toIssue;
        }

        if (remaining > 0.001) {
          throw new Error(`Insufficient stock for ${comp.materialId}: missing ${remaining}`);
        }
      }

      // Receipt of finished goods via 453
      const slocResult = await tx.execute(`
        SELECT id FROM ent_storage_location WHERE plant_id = $1 AND type = 'SHOP_FLOOR' LIMIT 1
      ` as any);
      const slocId = (slocResult.rows[0] as any)?.id || (await tx.execute(`SELECT id FROM ent_storage_location WHERE plant_id = $1 LIMIT 1` as any)).rows[0].id;

      await InventoryService.postMovement({
        movementType: '453',
        materialId: order.material_id,
        plantId: order.plant_id,
        slocId,
        quantity: params.yieldQuantity,
        stockStatusTo: 'UNRESTRICTED',
        referenceDocType: 'PROD_ORDER',
        referenceDocId: params.productionOrderId,
        postedBy: params.postedBy,
        headerText: `Yield from production ${params.productionOrderId}`,
      });

      // Scrap via 551
      if (params.scrapQuantity && params.scrapQuantity > 0) {
        await InventoryService.postMovement({
          movementType: '551',
          materialId: order.material_id,
          plantId: order.plant_id,
          slocId,
          quantity: -params.scrapQuantity,
          stockStatusTo: 'UNRESTRICTED',
          referenceDocType: 'PROD_ORDER',
          referenceDocId: params.productionOrderId,
          postedBy: params.postedBy,
          headerText: `Scrap from production ${params.productionOrderId}`,
        });
      }

      // Update production order
      await tx.execute(`
        UPDATE pp_production_order
        SET quantity_yield = $1, quantity_scrap = $2, status = 'CONFIRMED', actual_end = NOW(), updated_at = NOW()
        WHERE id = $3
      ` as any);

      // Create confirmation record
      const confResult = await tx.execute(`
        INSERT INTO pp_production_confirmation (confirmation_number, production_order_id, work_center_id, yield_quantity, scrap_quantity, exploded_components, posted_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      ` as any);

      return {
        confirmationId: (confResult.rows[0] as any).id,
        componentsIssued: exploded.length,
        yieldQuantity: params.yieldQuantity,
        explodedComponents: exploded,
      };
    });
  }
}
