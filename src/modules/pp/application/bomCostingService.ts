/**
 * BOM Cost Rollup Service (CO-PC) - Product Cost Controlling
 * Calculates total cost of FERT based on current MAP of ROH components in active BOM
 * Costing Run updates Standard Price of FERT in Material Master
 */
import { db, withTransaction } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export interface BomCostComponent {
  componentMaterialId: string;
  materialNumber: string;
  description: string;
  quantity: number;
  uom: string;
  unitCost: number; // MAP
  totalCost: number;
  isPhantom: boolean;
  level: number;
  bomHeaderId?: string;
}

export interface BomCostRollup {
  materialId: string;
  materialNumber: string;
  description: string;
  plantId: string;
  bomHeaderId: string;
  baseQuantity: number;
  totalCost: number;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  components: BomCostComponent[];
  previousStandardPrice: number;
  newStandardPrice: number;
}

export class BomCostingService {
  /**
   * Explode BOM recursively and calculate cost based on MAP
   */
  static async calculateBomCost(
    materialId: string,
    plantId: string,
    baseQuantity: number = 1,
    level: number = 0,
    visited: Set<string> = new Set()
  ): Promise<{ components: BomCostComponent[]; totalCost: number }> {
    if (visited.has(materialId)) {
      throw new Error(`Circular BOM detected for material ${materialId}`);
    }
    visited.add(materialId);

    const bomRes = await db.execute(sql`
      SELECT h.id, h.base_quantity, h.base_uom, l.component_material_id, l.quantity, l.uom, l.is_phantom_explode, l.scrap_factor,
             cm.material_number, cm.description, cm.is_phantom_kit,
             mp.moving_avg_price, mp.standard_price, mp.price_control
      FROM pp_bom_header h
      JOIN pp_bom_line l ON h.id = l.bom_header_id
      JOIN ent_material_master cm ON l.component_material_id = cm.id
      JOIN ent_material_plant mp ON cm.id = mp.material_id AND mp.plant_id = h.plant_id
      WHERE h.material_id = ${materialId} AND h.plant_id = ${plantId} AND h.status = 'ACTIVE'
        AND (h.valid_to IS NULL OR h.valid_to > NOW())
      ORDER BY l.line_number
    `);

    if (bomRes.rows.length === 0) {
      return { components: [], totalCost: 0 };
    }

    let totalCost = 0;
    const components: BomCostComponent[] = [];

    for (const row of bomRes.rows as any[]) {
      const requiredQty = (parseFloat(row.quantity) * baseQuantity) / parseFloat(row.base_quantity);
      const scrapFactor = parseFloat(row.scrap_factor || '0');
      const qtyWithScrap = requiredQty * (1 + scrapFactor / 100);

      // If component is phantom kit and flagged for explosion, explode recursively
      if (row.is_phantom_kit && row.is_phantom_explode) {
        const subResult = await this.calculateBomCost(
          row.component_material_id,
          plantId,
          qtyWithScrap,
          level + 1,
          new Set(visited)
        );
        totalCost += subResult.totalCost;
        components.push(...subResult.components);
      } else {
        const unitCost = row.price_control === 'V' 
          ? parseFloat(row.moving_avg_price || '0') 
          : parseFloat(row.standard_price || '0');
        const compTotalCost = qtyWithScrap * unitCost;

        components.push({
          componentMaterialId: row.component_material_id,
          materialNumber: row.material_number,
          description: row.description,
          quantity: qtyWithScrap,
          uom: row.uom,
          unitCost,
          totalCost: compTotalCost,
          isPhantom: row.is_phantom_kit || false,
          level,
          bomHeaderId: row.id,
        });

        totalCost += compTotalCost;
      }
    }

    return { components, totalCost };
  }

  /**
   * Calculate cost rollup for a single FERT material
   */
  static async getCostRollup(materialId: string, plantId: string): Promise<BomCostRollup> {
    const matRes = await db.execute(sql`
      SELECT m.id, m.material_number, m.description, mp.standard_price, mp.moving_avg_price
      FROM ent_material_master m
      JOIN ent_material_plant mp ON m.id = mp.material_id AND mp.plant_id = ${plantId}
      WHERE m.id = ${materialId}
    `);

    if (matRes.rows.length === 0) throw new Error('Material not found in plant');

    const mat = matRes.rows[0] as any;
    const bomHeaderRes = await db.execute(sql`
      SELECT id, base_quantity FROM pp_bom_header 
      WHERE material_id = ${materialId} AND plant_id = ${plantId} AND status = 'ACTIVE'
      LIMIT 1
    `);

    const bomHeaderId = bomHeaderRes.rows.length > 0 ? (bomHeaderRes.rows[0] as any).id : null;
    const baseQty = bomHeaderRes.rows.length > 0 ? parseFloat((bomHeaderRes.rows[0] as any).base_quantity) : 1;

    const { components, totalCost } = await this.calculateBomCost(materialId, plantId, baseQty);

    // For simplicity, labor and overhead = 0, can be extended with work center rates
    const materialCost = totalCost;
    const laborCost = 0;
    const overheadCost = 0;
    const total = materialCost + laborCost + overheadCost;

    const previousStandardPrice = parseFloat(mat.standard_price || '0');
    const newStandardPrice = baseQty > 0 ? total / baseQty : total;

    return {
      materialId,
      materialNumber: mat.material_number,
      description: mat.description,
      plantId,
      bomHeaderId,
      baseQuantity: baseQty,
      totalCost: total,
      materialCost,
      laborCost,
      overheadCost,
      components,
      previousStandardPrice,
      newStandardPrice,
    };
  }

  /**
   * Execute Costing Run - updates Standard Price of FERT items
   */
  static async executeCostingRun(params: {
    plantId: string;
    materialIds?: string[]; // If empty, all FERT with active BOM in plant
    type?: 'STANDARD' | 'SIMULATION';
    description?: string;
    createdBy: string;
  }) {
    return withTransaction(async (tx) => {
      const year = new Date().getFullYear();
      const runNumber = `COST${Date.now().toString().slice(-8)}`;

      // Create costing run header
      const runRes = await tx.execute(sql`
        INSERT INTO co_costing_run (run_number, type, status, plant_id, description, created_by)
        VALUES (${runNumber}, ${params.type || 'STANDARD'}, 'RUNNING', ${params.plantId}, ${params.description || ''}, ${params.createdBy})
        RETURNING id
      `);
      const runId = (runRes.rows[0] as any).id;

      // Get FERT materials with active BOM
      let matQuery = sql`
        SELECT DISTINCT m.id, m.material_number, m.description, mp.standard_price
        FROM ent_material_master m
        JOIN ent_material_plant mp ON m.id = mp.material_id AND mp.plant_id = ${params.plantId}
        JOIN pp_bom_header h ON m.id = h.material_id AND h.plant_id = ${params.plantId}
        WHERE m.type = 'FERT' AND h.status = 'ACTIVE'
      `;

      if (params.materialIds && params.materialIds.length > 0) {
        matQuery = sql`${matQuery} AND m.id IN (${sql.join(params.materialIds.map(id => sql`${id}`), sql`, `)})`;
      }

      const matRes = await tx.execute(matQuery);

      let totalCosted = 0;
      let totalValue = 0;

      for (const mat of matRes.rows as any[]) {
        try {
          const rollup = await this.getCostRollup(mat.id, params.plantId);

          // Create costing run line - FIXED: rollup.newStandardPrice not rollup.newStandardPrice
          await tx.execute(sql`
            INSERT INTO co_costing_run_line (costing_run_id, material_id, bom_header_id, total_cost, material_cost, labor_cost, overhead_cost, previous_standard_price, new_standard_price, price_difference, bom_explosion)
            VALUES (${runId}, ${mat.id}, ${rollup.bomHeaderId}, ${rollup.totalCost}, ${rollup.materialCost}, ${rollup.laborCost}, ${rollup.overheadCost}, ${rollup.previousStandardPrice}, ${rollup.newStandardPrice}, ${rollup.newStandardPrice - rollup.previousStandardPrice}, ${JSON.stringify(rollup.components)}::jsonb)
          `);

          // If STANDARD type, update material master standard price
          if ((params.type || 'STANDARD') === 'STANDARD') {
            await tx.execute(sql`
              UPDATE ent_material_plant 
              SET standard_price = ${rollup.newStandardPrice}, updated_at = NOW()
              WHERE material_id = ${mat.id} AND plant_id = ${params.plantId}
            `);

            await tx.execute(sql`
              UPDATE co_costing_run_line SET is_updated = true WHERE costing_run_id = ${runId} AND material_id = ${mat.id}
            `);
          }

          totalCosted++;
          totalValue += rollup.totalCost;

        } catch (e: any) {
          console.error(`Costing failed for ${mat.material_number}:`, e.message);
          // Continue with other materials
        }
      }

      await tx.execute(sql`
        UPDATE co_costing_run 
        SET status = 'COMPLETED', total_materials = ${matRes.rows.length}, total_costed = ${totalCosted}, total_value = ${totalValue}, completed_at = NOW()
        WHERE id = ${runId}
      `);

      return {
        runId,
        runNumber,
        totalMaterials: matRes.rows.length,
        totalCosted,
        totalValue,
        type: params.type || 'STANDARD',
        message: `Costing run ${runNumber} completed: ${totalCosted}/${matRes.rows.length} FERT materials costed, total value ${totalValue} KWD. ${params.type === 'SIMULATION' ? 'Simulation only, no price update' : 'Standard prices updated in material master.'}`,
      };
    });
  }

  /**
   * Get costing run details for UI
   */
  static async getCostingRunDetails(runId: string) {
    const runRes = await db.execute(sql`
      SELECT r.*, p.code as plant_code, p.name as plant_name
      FROM co_costing_run r
      JOIN ent_plant p ON r.plant_id = p.id
      WHERE r.id = ${runId}
    `);

    const linesRes = await db.execute(sql`
      SELECT l.*, m.material_number, m.description
      FROM co_costing_run_line l
      JOIN ent_material_master m ON l.material_id = m.id
      WHERE l.costing_run_id = ${runId}
      ORDER BY m.material_number
    `);

    return {
      header: runRes.rows[0],
      lines: linesRes.rows,
    };
  }
}
