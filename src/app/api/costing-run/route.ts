import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { BomCostingService } from '@/modules/pp/application/bomCostingService';

/**
 * BOM Cost Rollup API - CO-PC Product Cost Controlling
 * POST /api/costing-run - Execute costing run updates Std Price of FERT based on MAP of ROH
 * GET /api/costing-run?materialId=X&plantId=Y - Calculate cost rollup for single FERT
 */

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { plantId, materialIds, type, description, createdBy, companyCodeId, async } = body;

    if (!plantId || !createdBy) {
      return NextResponse.json({ error: 'plantId, createdBy required' }, { status: 400 });
    }

    const useAsync = async !== false; // Default async for heavy BOM costing

    if (useAsync) {
      const { db } = await import('@/shared/kernel/db/client');
      const { sql } = await import('drizzle-orm');

      const jobRes = await db.execute(sql`
        INSERT INTO core_job_queue (job_type, payload, status, company_code_id, created_by)
        VALUES ('COSTING_RUN', ${JSON.stringify({ plantId, materialIds, type, description, createdBy, companyCodeId })}::jsonb, 'PENDING', ${companyCodeId || null}, ${createdBy})
        RETURNING id, job_type, status, created_at
      `);

      const job = jobRes.rows[0] as any;

      const { setImmediate } = await import('timers');
      setImmediate(async () => {
        try {
          const { db: db2 } = await import('@/shared/kernel/db/client');
          const { sql: sql2 } = await import('drizzle-orm');
          await db2.execute(sql2`UPDATE core_job_queue SET status = 'RUNNING', started_at = NOW() WHERE id = ${job.id}`);

          const BomCostingService = (await import('@/modules/pp/application/bomCostingService')).BomCostingService;
          const result = await BomCostingService.executeCostingRun({ plantId, materialIds, type, description, createdBy });

          await db2.execute(sql2`
            UPDATE core_job_queue SET status = 'COMPLETED', finished_at = NOW(), result = ${JSON.stringify(result)}::jsonb
            WHERE id = ${job.id}
          `);
          console.log(`[COSTING JOB] ${job.id} COMPLETED:`, result);
        } catch (e: any) {
          console.error(`[COSTING JOB] ${job.id} FAILED:`, e.message);
          const { db: db3 } = await import('@/shared/kernel/db/client');
          const { sql: sql3 } = await import('drizzle-orm');
          await db3.execute(sql3`UPDATE core_job_queue SET status = 'FAILED', finished_at = NOW(), error = ${e.message} WHERE id = ${job.id}`).catch(()=>{});
        }
      });

      return NextResponse.json({
        success: true,
        jobId: job.id,
        jobType: 'COSTING_RUN',
        status: 'PENDING',
        plantId,
        message: `Costing job ${job.id} created PENDING for plant ${plantId}, BOM rollup recursive phantom async, returns 202 Accepted. Poll GET /api/jobs?id=${job.id}`,
        pollUrl: `/api/jobs?jobType=COSTING_RUN`,
      }, { status: 202 });
    } else {
      const result = await BomCostingService.executeCostingRun({
        plantId,
        materialIds,
        type,
        description,
        createdBy,
      });
      return NextResponse.json(result);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const materialId = searchParams.get('materialId');
  const plantId = searchParams.get('plantId');

  if (materialId && plantId) {
    try {
      const rollup = await BomCostingService.getCostRollup(materialId, plantId);
      return NextResponse.json(rollup);
    } catch (e: any) {
      return NextResponse.json({
      code: 'CK40N',
      functionDescription: 'Costing Run – CK40N',
 error: e.message }, { status: 400 });
    }
  }

  return NextResponse.json({
    description: 'BOM Cost Rollup (CO-PC) - Calculates FERT cost based on MAP of ROH components',
    logic: 'calculateBomCost(materialId, plantId, baseQty, level, visited Set): Get active BOM header, get lines JOIN material_master + material_plant for MAP, requiredQty = quantity×baseQty/base_quantity×(1+scrap/100), if phantom kit && is_phantom_explode → recursive explode with circular detection, else unitCost = price_control=V ? MAP : Std Price, totalCost = qty×unitCost, sum total',
    example: 'BOM-SHAWARMA-01 Base 1 PC: 0.15kg Chicken MAP 2.5=0.375 + 0.10kg Rice MAP 1.2=0.12 + 1x Spice Kit Phantom → Explodes 0.05kg Chicken 0.125 + 0.02kg Rice 0.024 = Total 0.644 KWD, Prev Std 0.500 → New 0.644 Diff +0.144',
    endpoints: {
      'GET /api/costing-run?materialId=X&plantId=Y': 'Calculate cost rollup for single FERT',
      'POST /api/costing-run': 'Execute costing run for all FERT or filtered materialIds, type STANDARD (update Std Price) or SIMULATION (preview)',
    },
    costingRun: 'Creates co_costing_run header run_number COSTxxx, type STANDARD/SIMULATION, status RUNNING→COMPLETED, lines co_costing_run_line with total_cost, material_cost, previous/new std price, price_difference, bom_explosion JSONB, if STANDARD updates prod_item_plant.standard_price',
  });
}
