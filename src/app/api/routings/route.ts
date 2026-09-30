import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { getNextDocumentNumber, createDocumentEntry, updateDocumentWithAudit } from '@/shared/kernel/db/documentHelpers';

/**
 * Routings API – Legal-safe own IP – Module 7 PP Manufacturing
 * New: mfg_routing_header + mfg_routing_line (was pp_routing_header + pp_routing_line) – routingNumber ROUTING-1001, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, bomHeaderId, description, status, version, lotSizeFrom/To, workCenterId MWCC, operationNumber 0010/0020/0030, setupTimeMinutes, machineTimeMinutes, laborTimeMinutes, baseQuantity
 * Helper code: MRTC Routing Create (alias RTC, CA01, FIN-RT-CR) – 4-char MOOA M=Manufacturing, RT=Routing, C=Create
 * Fallback to legacy pp_routing_header
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const plantId = searchParams.get('plantId') || searchParams.get('facilityId');
  const materialId = searchParams.get('materialId') || searchParams.get('itemId');
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let routings: any[] = [];
    let source = 'db-new';
    let table = 'mfg_routing_header';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT 
          h.id, h.routing_number, h.item_id as material_id, h.facility_id as plant_id, h.bom_header_id, h.description, h.status, h.version,
          h.lot_size_from, h.lot_size_to, h.valid_from, h.valid_to,
          pi.item_number as material_number, pi.description as material_description,
          f.code as plant_code, f.name as plant_name,
          f.code as facility_code, f.name as facility_name,
          bh.bom_number,
          (SELECT COUNT(*) FROM mfg_routing_line WHERE routing_header_id = h.id) as operation_count,
          (SELECT SUM(setup_time_minutes + machine_time_minutes + labor_time_minutes) FROM mfg_routing_line WHERE routing_header_id = h.id) as total_time_minutes
        FROM mfg_routing_header h
        LEFT JOIN prod_item pi ON h.item_id = pi.id
        LEFT JOIN org_facility f ON h.facility_id = f.id
        LEFT JOIN mfg_bom_header bh ON h.bom_header_id = bh.id
        WHERE 1=1
      `;

      if (plantId) query = sql`${query} AND (h.facility_id = ${plantId} OR h.plant_id = ${plantId})`;
      if (materialId) query = sql`${query} AND (h.item_id = ${materialId} OR h.material_id = ${materialId})`;
      if (search) query = sql`${query} AND (h.routing_number ILIKE ${`%${search}%`} OR pi.item_number ILIKE ${`%${search}%`} OR pi.name ILIKE ${`%${search}%`})`;

      query = sql`${query} ORDER BY h.routing_number DESC LIMIT ${limit}`;

      const result = await db.execute(query);

      for (const row of result.rows as any[]) {
        try {
          const opsRes = await db.execute(sql`
            SELECT l.id, l.operation_number, l.work_center_id, l.description, l.setup_time_minutes, l.machine_time_minutes, l.labor_time_minutes, l.base_quantity,
                   wc.code as work_center_code, wc.name as work_center_name
            FROM mfg_routing_line l
            LEFT JOIN mfg_work_center wc ON l.work_center_id = wc.id
            WHERE l.routing_header_id = ${row.id}
            ORDER BY l.operation_number
          `);
          routings.push({ ...row, operations: opsRes.rows, lines: opsRes.rows });
        } catch {
          routings.push({ ...row, operations: [], lines: [] });
        }
      }
    } catch (newErr: any) {
      console.warn('mfg_routing_header not yet fallback pp_routing_header:', newErr.message);
      source = 'db-legacy';
      table = 'pp_routing_header';
      legalSafe = false;

      let query = sql`
        SELECT 
          h.id, h.routing_number, h.material_id, h.plant_id, h.bom_header_id, h.description, h.status, h.version,
          h.lot_size_from, h.lot_size_to, h.valid_from, h.valid_to,
          m.material_number, m.description as material_description,
          p.code as plant_code, p.name as plant_name,
          bh.bom_number,
          (SELECT COUNT(*) FROM pp_routing_line WHERE routing_header_id = h.id) as operation_count,
          (SELECT SUM(setup_time_minutes + machine_time_minutes + labor_time_minutes) FROM pp_routing_line WHERE routing_header_id = h.id) as total_time_minutes
        FROM pp_routing_header h
        JOIN ent_material_master m ON h.material_id = m.id
        JOIN ent_plant p ON h.plant_id = p.id
        LEFT JOIN pp_bom_header bh ON h.bom_header_id = bh.id
        WHERE 1=1
      `;

      if (plantId) query = sql`${query} AND h.plant_id = ${plantId}`;
      if (materialId) query = sql`${query} AND h.material_id = ${materialId}`;
      if (search) query = sql`${query} AND (h.routing_number ILIKE ${`%${search}%`} OR m.material_number ILIKE ${`%${search}%`} OR m.description ILIKE ${`%${search}%`})`;

      query = sql`${query} ORDER BY h.routing_number DESC LIMIT ${limit}`;

      const result = await db.execute(query);

      for (const row of result.rows as any[]) {
        const opsRes = await db.execute(sql`
          SELECT l.id, l.operation_number, l.work_center_id, l.description, l.setup_time_minutes, l.machine_time_minutes, l.labor_time_minutes, l.base_quantity,
                 wc.code as work_center_code, wc.name as work_center_name
          FROM pp_routing_line l
          LEFT JOIN pp_work_center wc ON l.work_center_id = wc.id
          WHERE l.routing_header_id = ${row.id}
          ORDER BY l.operation_number
        `);
        routings.push({ ...row, operations: opsRes.rows, lines: opsRes.rows });
      }
    }

    return NextResponse.json({
      routings,
      count: routings.length,
      code: 'MRTC',
      aliasCodes: ['RTC', 'CA01', 'FIN-RT-CR'],
      helperCode: 'MRTC',
      table,
      source,
      legalSafe,
      functionDescription: 'Routing – MRTC legal-safe own IP (was CA01) – routingNumber ROUTING-1001, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, bomHeaderId, operationNumber 0010/0020/0030, workCenterId MWCC, setup/machine/labor times',
      explanation: 'Routing legal-safe mfg_routing_header + mfg_routing_line – routingNumber ROUTING-1001, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, bomHeaderId, description, status, version, lotSizeFrom/To, workCenterId MWCC, operationNumber 0010/0020/0030, setupTimeMinutes, machineTimeMinutes, laborTimeMinutes, baseQuantity – Code MRTC primary alias RTC/CA01 – 4-char MOOA M=Manufacturing RT=Routing C=Create – module grouped intuitive, same length as CA01 but own IP.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, routings: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    // SAP-like unique document number – FNDC – auto-generate from FNRC if not provided
    let routing_number = body.routing_number;
    if (!routing_number) {
      try {
        const next = await getNextDocumentNumber('ROUTING', body.company_code || body.legal_entity_code || '1000');
        routing_number = next.document_number;
      } catch { routing_number = `ROUTING-${Date.now()}`; }
    }
    const { item_id, material_id, item_number, facility_id, plant_id, facility_code, plant_code, bom_header_id, bom_number, description, version, lot_size_from, lot_size_to, operations, lines } = body;

    let itemIdResolved = item_id || material_id;
    if (!itemIdResolved && item_number) {
      try {
        const it = await db.execute(sql`SELECT id FROM prod_item WHERE item_number = ${item_number} LIMIT 1`);
        if (it.rows.length > 0) itemIdResolved = (it.rows[0] as any).id;
      } catch {}
    }

    let facilityIdResolved = facility_id || plant_id;
    if (!facilityIdResolved && (facility_code || plant_code)) {
      try {
        const f = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${facility_code || plant_code} LIMIT 1`);
        if (f.rows.length > 0) facilityIdResolved = (f.rows[0] as any).id;
      } catch {}
    }

    let bomHeaderIdResolved = bom_header_id;
    if (!bomHeaderIdResolved && bom_number) {
      try {
        const bh = await db.execute(sql`SELECT id FROM mfg_bom_header WHERE bom_number = ${bom_number} LIMIT 1`);
        if (bh.rows.length > 0) bomHeaderIdResolved = (bh.rows[0] as any).id;
      } catch {}
    }

    if (!itemIdResolved) return NextResponse.json({ error: 'item_id/item_number or material_id required' }, { status: 400 });
    if (!facilityIdResolved) return NextResponse.json({ error: 'facility_id/facility_code or plant_id/plant_code required' }, { status: 400 });

    let routingNumber = body.routing_number;
    if (!routingNumber) routingNumber = `ROUTING-${Date.now()}`;

    try {
      const res = await db.execute(sql`
        INSERT INTO mfg_routing_header (routing_number, item_id, material_id, facility_id, plant_id, bom_header_id, description, version, lot_size_from, lot_size_to)
        VALUES (${routingNumber}, ${itemIdResolved}, ${itemIdResolved}, ${facilityIdResolved}, ${facilityIdResolved}, ${bomHeaderIdResolved || null}, ${description || null}, ${version || '01'}, ${lot_size_from || 1}, ${lot_size_to || 999999})
        RETURNING id, routing_number
      `);
      const routingId = (res.rows[0] as any).id;

      const ops = operations || lines;
      if (ops && Array.isArray(ops)) {
        for (const op of ops) {
          await db.execute(sql`
            INSERT INTO mfg_routing_line (routing_header_id, operation_number, work_center_id, description, setup_time_minutes, machine_time_minutes, labor_time_minutes, base_quantity)
            VALUES (${routingId}, ${op.operation_number || op.operationNumber || 10}, ${op.work_center_id || null}, ${op.description || null}, ${op.setup_time_minutes || 0}, ${op.machine_time_minutes || 0}, ${op.labor_time_minutes || 0}, ${op.base_quantity || 1})
          `);
        }
      }

      return NextResponse.json({ success: true, routing: res.rows[0], routingNumber, code: 'MRTC', message: `Routing ${routingNumber} created – MRTC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('mfg_routing_header insert failed:', newErr.message);
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
      const docNum = body.routing_number || body.document_number || body.id;
      if (docNum) await updateDocumentWithAudit({ document_number: docNum, new_payload: body, changed_by: 'system', action: 'UPDATE' });
    } catch (auditErr) { console.warn('Audit trail failed', auditErr); }
    const { id, routing_number, status } = body;
    if (!id && !routing_number) return NextResponse.json({ error: 'id or routing_number required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE mfg_routing_header SET status = ${status}::mfg_routing_status, updated_at = NOW() WHERE id = ${id} RETURNING id, routing_number, status`);
      else res = await db.execute(sql`UPDATE mfg_routing_header SET status = ${status}::mfg_routing_status, updated_at = NOW() WHERE routing_number = ${routing_number} RETURNING id, routing_number, status`);
      if (res.rows.length === 0) throw new Error('Not found in mfg_routing_header');
      return NextResponse.json({ success: true, routing: res.rows[0], code: 'MRTC', message: `Routing ${res.rows[0].routing_number} status ${status} – MRTC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE pp_routing_header SET status = ${status}::routing_status, updated_at = NOW() WHERE id = ${id} RETURNING id, routing_number, status`);
      else res = await db.execute(sql`UPDATE pp_routing_header SET status = ${status}::routing_status, updated_at = NOW() WHERE routing_number = ${routing_number} RETURNING id, routing_number, status`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Routing not found' }, { status: 404 });
      return NextResponse.json({ success: true, routing: res.rows[0], message: `Routing ${res.rows[0].routing_number} status ${status} – CA01 legacy` });
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
    const routing_number = searchParams.get('routing_number');
    if (!id && !routing_number) return NextResponse.json({ error: 'id or routing_number required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM mfg_routing_header WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM mfg_routing_header WHERE routing_number = ${routing_number}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM pp_routing_header WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM pp_routing_header WHERE routing_number = ${routing_number}`);
    }

    return NextResponse.json({ success: true, code: 'MRTC', message: `Routing ${routing_number || id} deleted – MRTC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
