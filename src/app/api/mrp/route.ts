import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { getNextDocumentNumber, createDocumentEntry, updateDocumentWithAudit } from '@/shared/kernel/db/documentHelpers';

/**
 * MRP API – Legal-safe own IP – Module 7 PP Manufacturing
 * New: mfg_mrp_run + mfg_mrp_element (was pp_mrp_run + pp_mrp_element) – mrpNumber MRP-1001, facilityId was plant_id FAC-1000, status DRAFT/RUNNING/COMPLETED/FAILED, planningHorizonDays, includeSafetyStock, includeSalesOrders, itemId was material_id prod_item EMTC, facilityId, elementType STOCK/SAFETY_STOCK/SALES_ORDER/PR/PO/PLANNED_ORDER/PROD_ORDER/STO, quantity, availableQuantity, isShortage, generatedPrId proc_purchase_requisition PPRC
 * Helper code: MMRP MRP Run Create (alias MRP, MD01, FIN-MRP-CR) – 4-char MOOA M=Manufacturing, MR=MRP, P=Process – same length as MD01 but own IP, module grouped, intuitive
 * Fallback to legacy pp_mrp_run
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const facilityId = searchParams.get('facilityId') || searchParams.get('plantId');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'mfg_mrp_run';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT r.*, f.code as facility_code, f.name as facility_name
        FROM mfg_mrp_run r
        LEFT JOIN org_facility f ON r.facility_id = f.id
        WHERE 1=1
      `;
      if (facilityId) query = sql`${query} AND (r.facility_id = ${facilityId} OR r.plant_id = ${facilityId})`;
      if (status) query = sql`${query} AND r.status = ${status}::mfg_mrp_run_status`;
      query = sql`${query} ORDER BY r.created_at DESC LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];

      for (let i = 0; i < rows.length; i++) {
        try {
          const elRes = await db.execute(sql`
            SELECT e.*, pi.item_number, pi.name as item_name
            FROM mfg_mrp_element e
            LEFT JOIN prod_item pi ON e.item_id = pi.id
            WHERE e.mrp_run_id = ${rows[i].id}
            ORDER BY e.date ASC
            LIMIT 100
          `);
          rows[i].elements = elRes.rows;
        } catch {
          rows[i].elements = [];
        }
      }
    } catch (newErr: any) {
      console.warn('mfg_mrp_run not yet fallback pp_mrp_run:', newErr.message);
      source = 'db-legacy';
      table = 'pp_mrp_run';
      legalSafe = false;
      let query = sql`
        SELECT r.*, p.code as plant_code, p.name as plant_name
        FROM pp_mrp_run r
        LEFT JOIN ent_plant p ON r.plant_id = p.id
        WHERE 1=1
      `;
      if (facilityId) query = sql`${query} AND r.plant_id = ${facilityId}`;
      if (status) query = sql`${query} AND r.status = ${status}::mrp_run_status`;
      query = sql`${query} ORDER BY r.created_at DESC LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    }

    return NextResponse.json({
      mrpRuns: rows,
      count: rows.length,
      code: 'MMRP',
      aliasCodes: ['MRP', 'MD01', 'FIN-MRP-CR'],
      helperCode: 'MMRP',
      table,
      source,
      legalSafe,
      functionDescription: 'MRP Run – MMRP legal-safe own IP (was MD01) – mrpNumber MRP-1001, facilityId FAC-1000 was plant_id, itemId EMTC was material_id, elementType STOCK/SAFETY_STOCK/SALES_ORDER/PR/PO/PLANNED_ORDER/PROD_ORDER/STO, quantity, isShortage, generatedPrId PPRC',
      explanation: 'MRP legal-safe mfg_mrp_run + mfg_mrp_element – mrpNumber MRP-1001, facilityId FAC-1000 was plant_id, status DRAFT/RUNNING/COMPLETED/FAILED, planningHorizonDays, itemId EMTC was material_id, facilityId, elementType STOCK/SAFETY_STOCK/SALES_ORDER/PR/PO/PLANNED_ORDER/PROD_ORDER/STO, quantity, availableQuantity, isShortage, generatedPrId proc_purchase_requisition PPRC – Code MMRP primary alias MRP/MD01 – 4-char MOOA M=Manufacturing MR=MRP P=Process – module grouped intuitive, same length as MD01 but own IP.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, mrpRuns: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { facility_id, plant_id, facility_code, plant_code, planning_horizon_days, include_safety_stock, include_sales_orders } = body;

    let facilityIdResolved = facility_id || plant_id;
    if (!facilityIdResolved && (facility_code || plant_code)) {
      try {
        const f = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${facility_code || plant_code} LIMIT 1`);
        if (f.rows.length > 0) facilityIdResolved = (f.rows[0] as any).id;
      } catch {}
    }
    if (!facilityIdResolved) return NextResponse.json({ error: 'facility_id/facility_code or plant_id/plant_code required' }, { status: 400 });

    let mrpNumber = body.mrp_number;
    if (!mrpNumber) mrpNumber = `MRP-${Date.now()}`;

    try {
      const res = await db.execute(sql`
        INSERT INTO mfg_mrp_run (mrp_number, facility_id, plant_id, planning_horizon_days, include_safety_stock, include_sales_orders)
        VALUES (${mrpNumber}, ${facilityIdResolved}, ${facilityIdResolved}, ${planning_horizon_days || 30}, ${include_safety_stock ?? true}, ${include_sales_orders ?? true})
        RETURNING id, mrp_number
      `);

      // Simplified MRP logic – in real implementation would explode BOMs, check stock, generate PRs
      // For now just create a run record

      return NextResponse.json({ success: true, mrpRun: res.rows[0], mrpNumber, code: 'MMRP', message: `MRP run ${mrpNumber} created – MMRP legal-safe – planning horizon ${planning_horizon_days || 30} days`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('mfg_mrp_run insert failed:', newErr.message);
      return NextResponse.json({ error: newErr.message }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    // Immutable audit trail – log before update
    try {
      const docNum = body.mrp_number || body.document_number || body.id;
      if (docNum) await updateDocumentWithAudit({ document_number: docNum, new_payload: body, changed_by: 'system', action: 'UPDATE' });
    } catch (auditErr) { console.warn('Audit trail failed', auditErr); }
    const { id, mrp_number, status } = body;
    if (!id && !mrp_number) return NextResponse.json({ error: 'id or mrp_number required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE mfg_mrp_run SET status = ${status}::mfg_mrp_run_status, completed_at = ${status === 'COMPLETED' ? new Date() : null} WHERE id = ${id} RETURNING id, mrp_number, status`);
      else res = await db.execute(sql`UPDATE mfg_mrp_run SET status = ${status}::mfg_mrp_run_status, completed_at = ${status === 'COMPLETED' ? new Date() : null} WHERE mrp_number = ${mrp_number} RETURNING id, mrp_number, status`);
      if (res.rows.length === 0) throw new Error('Not found in mfg_mrp_run');
      return NextResponse.json({ success: true, mrpRun: res.rows[0], code: 'MMRP', message: `MRP run ${res.rows[0].mrp_number} status ${status} – MMRP legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE pp_mrp_run SET status = ${status}::mrp_run_status, completed_at = ${status === 'COMPLETED' ? new Date() : null} WHERE id = ${id} RETURNING id, mrp_number, status`);
      else res = await db.execute(sql`UPDATE pp_mrp_run SET status = ${status}::mrp_run_status, completed_at = ${status === 'COMPLETED' ? new Date() : null} WHERE mrp_number = ${mrp_number} RETURNING id, mrp_number, status`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'MRP run not found' }, { status: 404 });
      return NextResponse.json({ success: true, mrpRun: res.rows[0], message: `MRP run ${res.rows[0].mrp_number} status ${status} – MD01 legacy` });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const mrp_number = searchParams.get('mrp_number');
    if (!id && !mrp_number) return NextResponse.json({ error: 'id or mrp_number required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM mfg_mrp_run WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM mfg_mrp_run WHERE mrp_number = ${mrp_number}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM pp_mrp_run WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM pp_mrp_run WHERE mrp_number = ${mrp_number}`);
    }

    return NextResponse.json({ success: true, code: 'MMRP', message: `MRP run ${mrp_number || id} deleted – MMRP legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
