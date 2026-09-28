import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db, withTransaction } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * MRP API - MD01/MD04 - Material Requirements Planning
 * Multi-plant operation needs automated MRP runs to analyze stock levels and generate PRs/Planned Orders
 * GET /api/mrp - List MRP runs and stock/requirements
 * POST /api/mrp - Run MRP MD01
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const plantId = searchParams.get('plantId');
  const mrpRunId = searchParams.get('mrpRunId');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    if (mrpRunId) {
      // Get MRP elements for a run - MD04 Stock/Requirements List
      const elementsRes = await db.execute(sql`
        SELECT 
          e.id, e.material_id, e.plant_id, e.element_type, e.element_number, e.quantity, e.available_quantity, e.date, e.is_shortage,
          e.generated_pr_id, e.generated_planned_order_id,
          m.material_number, m.description,
          p.code as plant_code,
          pr.pr_number as generated_pr_number
        FROM pp_mrp_element e
        JOIN ent_material_master m ON e.material_id = m.id
        JOIN ent_plant p ON e.plant_id = p.id
        LEFT JOIN mm_purchase_requisition pr ON e.generated_pr_id = pr.id
        WHERE e.mrp_run_id = ${mrpRunId}
        ORDER BY e.material_id, e.date
      `);

      return NextResponse.json({ mrpElements: elementsRes.rows, count: elementsRes.rows.length, source: 'db', functionCode: 'MD04 Stock/Requirements List' });
    }

    // List MRP runs MD01
    let query = sql`
      SELECT 
        r.id, r.mrp_number, r.plant_id, r.status, r.planning_horizon_days, r.include_safety_stock, r.include_sales_orders,
        r.total_materials, r.total_shortages, r.total_prs_generated, r.total_planned_orders_generated, r.created_at, r.completed_at,
        p.code as plant_code, p.name as plant_name
      FROM pp_mrp_run r
      JOIN ent_plant p ON r.plant_id = p.id
      WHERE 1=1
    `;
    if (plantId) query = sql`${query} AND r.plant_id = ${plantId}`;
    query = sql`${query} ORDER BY r.mrp_number DESC LIMIT ${limit}`;

    const result = await db.execute(query);

    return NextResponse.json({ mrpRuns: result.rows, count: result.rows.length, source: 'db', functionCodes: 'MD01 MRP Run, MD04 Stock/Requirements List', note: 'MRP analyzes stock levels across plants and generates PRs/Planned Orders based on sales demand and safety stock' });
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
    const { plantId, planningHorizonDays, includeSafetyStock, includeSalesOrders } = body;
    if (!plantId) return NextResponse.json({ error: 'plantId required' }, { status: 400 });

    return withTransaction(async (tx) => {
      const mrpNumber = `MRP-${Date.now().toString().slice(-8)}`;

      const runRes = await tx.execute(sql`
        INSERT INTO pp_mrp_run (mrp_number, plant_id, status, planning_horizon_days, include_safety_stock, include_sales_orders)
        VALUES (${mrpNumber}, ${plantId}, 'RUNNING', ${planningHorizonDays || 30}, ${includeSafetyStock ?? true}, ${includeSalesOrders ?? true})
        RETURNING id, mrp_number
      `);

      const mrpRunId = (runRes.rows[0] as any).id;

      // MRP Logic: For each material in plant with safety stock / reorder point
      const materialsRes = await tx.execute(sql`
        SELECT 
          mp.material_id, mp.safety_stock, mp.reorder_point, mp.total_stock_qty,
          m.material_number, m.description, m.type
        FROM ent_material_plant mp
        JOIN ent_material_master m ON mp.material_id = m.id
        WHERE mp.plant_id = ${plantId}
      `);

      let totalMaterials = materialsRes.rows.length;
      let totalShortages = 0;
      let totalPrsGenerated = 0;

      // Get sales demand for horizon (sales orders not yet issued)
      let salesDemand: any[] = [];
      if (includeSalesOrders ?? true) {
        try {
          const salesRes = await tx.execute(sql`
            SELECT sl.material_id, SUM(sl.quantity - sl.quantity_issued) as demand_qty
            FROM sd_sales_line sl
            JOIN sd_sales_order so ON sl.sales_order_id = so.id
            WHERE so.plant_id = ${plantId} AND so.status IN ('DRAFT','CONFIRMED','PARTIALLY_ISSUED')
            GROUP BY sl.material_id
          `);
          salesDemand = salesRes.rows as any[];
        } catch {}
      }

      // Get existing PRs/POs as receipts
      let existingSupply: any[] = [];
      try {
        const prRes = await tx.execute(sql`
          SELECT prl.material_id, SUM(prl.quantity) as supply_qty
          FROM mm_pr_line prl
          JOIN mm_purchase_requisition pr ON prl.pr_id = pr.id
          WHERE pr.plant_id = ${plantId} AND pr.status IN ('DRAFT','PENDING_APPROVAL','APPROVED')
          GROUP BY prl.material_id
        `);
        existingSupply = prRes.rows as any[];
      } catch {}

      for (const mat of materialsRes.rows as any[]) {
        const safetyStock = parseFloat(mat.safety_stock || '0');
        const reorderPoint = parseFloat(mat.reorder_point || '0');
        const stockQty = parseFloat(mat.total_stock_qty || '0');

        // Find demand for this material
        const demandRow = salesDemand.find((d:any)=>d.material_id===mat.material_id);
        const demandQty = demandRow ? parseFloat(demandRow.demand_qty) : 0;

        // Find existing supply
        const supplyRow = existingSupply.find((s:any)=>s.material_id===mat.material_id);
        const supplyQty = supplyRow ? parseFloat(supplyRow.supply_qty) : 0;

        // Calculate available: stock - demand + supply
        const availableAfterDemand = stockQty - demandQty + supplyQty;

        // Insert MRP elements for MD04
        // Stock element
        await tx.execute(sql`
          INSERT INTO pp_mrp_element (mrp_run_id, material_id, plant_id, element_type, element_number, quantity, available_quantity, date, is_shortage)
          VALUES (${mrpRunId}, ${mat.material_id}, ${plantId}, 'STOCK', 'STOCK', ${stockQty}, ${stockQty}, NOW(), false)
        `);

        if (safetyStock > 0) {
          await tx.execute(sql`
            INSERT INTO pp_mrp_element (mrp_run_id, material_id, plant_id, element_type, element_number, quantity, available_quantity, date, is_shortage)
            VALUES (${mrpRunId}, ${mat.material_id}, ${plantId}, 'SAFETY_STOCK', 'SAFETY', ${-safetyStock}, ${stockQty - safetyStock}, NOW(), ${stockQty < safetyStock})
          `);
        }

        if (demandQty > 0) {
          await tx.execute(sql`
            INSERT INTO pp_mrp_element (mrp_run_id, material_id, plant_id, element_type, element_number, quantity, available_quantity, date, is_shortage)
            VALUES (${mrpRunId}, ${mat.material_id}, ${plantId}, 'SALES_ORDER', 'SALES', ${-demandQty}, ${availableAfterDemand}, NOW() + INTERVAL '1 day', ${availableAfterDemand < safetyStock})
          `);
        }

        if (supplyQty > 0) {
          await tx.execute(sql`
            INSERT INTO pp_mrp_element (mrp_run_id, material_id, plant_id, element_type, element_number, quantity, available_quantity, date, is_shortage)
            VALUES (${mrpRunId}, ${mat.material_id}, ${plantId}, 'PR', 'PR_SUPPLY', ${supplyQty}, ${availableAfterDemand}, NOW(), false)
          `);
        }

        // Check if shortage: available < safety stock or < reorder point
        const isShortage = availableAfterDemand < safetyStock || availableAfterDemand < reorderPoint;
        if (isShortage) {
          totalShortages++;

          // Generate PR for shortage: shortage qty = safety_stock - available + demand buffer
          const shortageQty = Math.max(safetyStock - availableAfterDemand, reorderPoint - availableAfterDemand, 0);
          const prQty = shortageQty > 0 ? shortageQty : safetyStock;

          if (prQty > 0) {
            try {
              // Generate PR number
              const prNumber = `PR${Date.now().toString().slice(-8)}${Math.floor(Math.random()*100)}`;
              
              // Get company code id from plant
              const plantRes = await tx.execute(sql`SELECT company_code_id FROM ent_plant WHERE id = ${plantId} LIMIT 1`);
              const companyCodeId = plantRes.rows.length > 0 ? (plantRes.rows[0] as any).company_code_id : null;

              // Get first employee as requester (simplified)
              const empRes = await tx.execute(sql`SELECT id FROM hr_employee LIMIT 1`);
              const requesterId = empRes.rows.length > 0 ? (empRes.rows[0] as any).id : null;

              if (companyCodeId && requesterId) {
                const prHeaderRes = await tx.execute(sql`
                  INSERT INTO mm_purchase_requisition (pr_number, company_code_id, plant_id, requester_id, status, total_amount, currency, header_text)
                  VALUES (${prNumber}, ${companyCodeId}, ${plantId}, ${requesterId}, 'DRAFT', ${prQty * 10}, 'KWD', ${`MRP Generated PR for ${mat.material_number} shortage ${shortageQty} - MRP ${mrpNumber}`})
                  RETURNING id
                `);
                const prId = (prHeaderRes.rows[0] as any).id;

                await tx.execute(sql`
                  INSERT INTO mm_pr_line (pr_id, line_number, material_id, quantity, uom, estimated_price, plant_id)
                  VALUES (${prId}, 10, ${mat.material_id}, ${prQty}, 'KG', '10', ${plantId})
                `);

                await tx.execute(sql`
                  INSERT INTO pp_mrp_element (mrp_run_id, material_id, plant_id, element_type, element_number, quantity, available_quantity, date, is_shortage, generated_pr_id)
                  VALUES (${mrpRunId}, ${mat.material_id}, ${plantId}, 'PR', ${prNumber}, ${prQty}, ${availableAfterDemand + prQty}, NOW() + INTERVAL '2 days', false, ${prId})
                `);

                totalPrsGenerated++;
              }
            } catch (e) {
              console.error('Failed to generate PR for MRP shortage', mat.material_number, e);
            }
          }
        }
      }

      await tx.execute(sql`
        UPDATE pp_mrp_run SET status = 'COMPLETED', total_materials = ${totalMaterials}, total_shortages = ${totalShortages}, total_prs_generated = ${totalPrsGenerated}, completed_at = NOW()
        WHERE id = ${mrpRunId}
      `);

      return NextResponse.json({ success: true, mrpRunId, mrpNumber, message: `MRP Run ${mrpNumber} completed MD01: ${totalMaterials} materials, ${totalShortages} shortages, ${totalPrsGenerated} PRs generated for plant ${plantId}` });
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
