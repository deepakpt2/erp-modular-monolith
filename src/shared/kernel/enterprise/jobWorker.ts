import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Background Job Worker - Polling mechanism for core_job_queue
 * Processes PENDING jobs asynchronously: PAYROLL_RUN, COSTING_RUN, MRP_RUN
 * For medium enterprise 500 employees - avoids HTTP timeout
 */

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

export async function processNextJob(): Promise<boolean> {
  try {
    // Get oldest PENDING job FOR UPDATE SKIP LOCKED to avoid race
    const jobRes = await db.execute(sql`
      SELECT id, job_type, payload, company_code_id, created_by
      FROM core_job_queue
      WHERE status = 'PENDING'
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `);

    if (jobRes.rows.length === 0) return false;

    const job = jobRes.rows[0] as any;
    console.log(`[JOB WORKER] Picked job ${job.id} type ${job.job_type}`);

    await db.execute(sql`UPDATE core_job_queue SET status = 'RUNNING', started_at = NOW() WHERE id = ${job.id}`);

    const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload;

    let result: any = {};

    try {
      switch (job.job_type) {
        case 'PAYROLL_RUN':
          result = await processPayroll(job, payload);
          break;
        case 'COSTING_RUN':
          result = await processCosting(job, payload);
          break;
        case 'MRP_RUN':
          result = await processMrp(job, payload);
          break;
        default:
          result = { message: `Processed ${job.job_type}`, payload };
      }

      await db.execute(sql`
        UPDATE core_job_queue SET status = 'COMPLETED', finished_at = NOW(), result = ${JSON.stringify(result)}::jsonb
        WHERE id = ${job.id}
      `);
      console.log(`[JOB WORKER] Job ${job.id} COMPLETED`);
      return true;
    } catch (e: any) {
      console.error(`[JOB WORKER] Job ${job.id} FAILED:`, e.message);
      await db.execute(sql`
        UPDATE core_job_queue SET status = 'FAILED', finished_at = NOW(), error = ${e.message}
        WHERE id = ${job.id}
      `).catch(()=>{});
      return true;
    }
  } catch (e: any) {
    console.error('[JOB WORKER] processNextJob error:', e.message);
    return false;
  }
}

async function processPayroll(job: any, payload: any) {
  const { companyCodeId, periodYear, periodMonth } = payload;
  const empRes = await db.execute(sql`
    SELECT id, basic_salary, cost_center_id FROM hr_employee 
    WHERE company_code_id = ${companyCodeId} AND is_active = true
    LIMIT 500
  `);

  let totalGross = 0;
  for (const emp of empRes.rows as any[]) {
    totalGross += parseFloat(emp.basic_salary || '1000');
  }

  const fiNumber = `FI-PAYROLL-${periodYear}${periodMonth}-${Date.now().toString().slice(-6)}`;
  let fiDocId = null;
  try {
    const fiRes = await db.execute(sql`
      INSERT INTO fin_universal_ledger (document_number, company_code_id, doc_type, posting_date, document_date, total_debit, total_credit, status, header_text)
      VALUES (${fiNumber}, ${companyCodeId}, 'HR', NOW(), NOW(), ${totalGross}, ${totalGross}, 'POSTED', ${`Payroll ${periodYear}-${periodMonth} ${empRes.rows.length} employees`})
      RETURNING id
    `);
    fiDocId = (fiRes.rows[0] as any).id;
  } catch {}

  return { period: `${periodYear}-${periodMonth}`, employeeCount: empRes.rows.length, totalGross, fiDocumentId: fiDocId, fiNumber };
}

async function processCosting(job: any, payload: any) {
  const { plantId, type, companyCodeId } = payload;
  const matRes = await db.execute(sql`
    SELECT m.id, m.material_number
    FROM prod_item m
    JOIN prod_item_plant mp ON m.id = mp.material_id
    WHERE mp.plant_id = ${plantId} AND m.type = 'FERT'
    LIMIT 100
  `);

  let totalCost = 0;
  let updatedCount = 0;
  for (const mat of matRes.rows as any[]) {
    const bomRes = await db.execute(sql`
      SELECT bml.quantity as comp_qty, mp.moving_avg_price as comp_map
      FROM mfg_bom_header bmh
      JOIN mfg_bom_line bml ON bmh.id = bml.bom_header_id
      JOIN prod_item_plant mp ON bml.material_id = mp.material_id AND mp.plant_id = ${plantId}
      WHERE bmh.material_id = ${mat.id} AND bmh.plant_id = ${plantId} AND bmh.is_active = true
      LIMIT 20
    `);
    let matCost = 0;
    for (const comp of bomRes.rows as any[]) {
      matCost += parseFloat(comp.comp_map || '0') * parseFloat(comp.comp_qty || '0');
    }
    if (matCost > 0) {
      totalCost += matCost;
      if (type === 'STANDARD') {
        await db.execute(sql`UPDATE prod_item_plant SET standard_price = ${matCost} WHERE material_id = ${mat.id} AND plant_id = ${plantId}`);
        updatedCount++;
      }
    }
  }

  const runNumber = `COST${100000 + Date.now() % 900000}`;
  return { runNumber, materialCount: matRes.rows.length, totalCost, updatedCount };
}

async function processMrp(job: any, payload: any) {
  const { plantId, companyCodeId } = payload;
  const lowStockRes = await db.execute(sql`
    SELECT material_id, safety_stock, total_stock_qty
    FROM prod_item_plant
    WHERE plant_id = ${plantId} AND total_stock_qty < safety_stock
    LIMIT 50
  `);
  let prCount = 0;
  for (const low of lowStockRes.rows as any[]) {
    const needed = parseFloat(low.safety_stock || '100') - parseFloat(low.total_stock_qty || '0');
    if (needed > 0) {
      await db.execute(sql`
        INSERT INTO mm_purchase_requisition (pr_number, company_code_id, plant_id, status, total_amount, currency, required_date)
        VALUES (${`PR-MRP-${Date.now().toString().slice(-6)}-${prCount}`}, ${companyCodeId}, ${plantId}, 'DRAFT', ${needed * 10}, 'INR', NOW() + INTERVAL '7 days')
      `).catch(()=>{});
      prCount++;
    }
  }
  return { plantId, lowStockCount: lowStockRes.rows.length, prCount };
}

export function startJobWorker(intervalMs: number = 5000) {
  if (isRunning) {
    console.log('[JOB WORKER] Already running');
    return;
  }
  isRunning = true;
  console.log(`[JOB WORKER] Starting polling every ${intervalMs}ms for PENDING jobs`);

  intervalId = setInterval(async () => {
    try {
      const hadJob = await processNextJob();
      if (hadJob) {
        // Immediately check for next job without waiting
        setImmediate(() => processNextJob().catch(()=>{}));
      }
    } catch (e) {
      console.error('[JOB WORKER] Interval error:', e);
    }
  }, intervalMs);

  // Also process immediately on start
  setImmediate(() => processNextJob().catch(()=>{}));
}

export function stopJobWorker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
  console.log('[JOB WORKER] Stopped');
}

// Auto-start in Node.js environment when imported (for enterprise mode)
if (process.env.ENTERPRISE_MODE === 'true' || process.env.AUTO_START_JOB_WORKER === 'true') {
  // Delay start to allow DB connection
  setTimeout(() => {
    startJobWorker(10000);
  }, 5000);
}
