import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { getNextDocumentNumber, createDocumentEntry, updateDocumentWithAudit } from '@/shared/kernel/db/documentHelpers';

/**
 * Work Centers API – Legal-safe own IP – Module 7 PP Manufacturing
 * New: mfg_work_center (was pp_work_center) – code WC-1000, facilityId was plant_id FAC-1000, costUnitId was cost_center ECUC, capacityPerHour, laborRatePerHour INR/h, machineRatePerHour, overheadRatePercent, setupTimeMinutes
 * Helper code: MWCC Work Center Create (alias WCC, CR01, FIN-WC-CR) – 4-char MOOA M=Manufacturing, WC=WorkCenter, C=Create
 * Fallback to legacy pp_work_center
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const facilityId = searchParams.get('facilityId') || searchParams.get('plantId');
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'mfg_work_center';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT wc.*, f.code as facility_code, f.name as facility_name, f.code as plant_code, cu.code as cost_unit_code
        FROM mfg_work_center wc
        LEFT JOIN org_facility f ON wc.facility_id = f.id
        LEFT JOIN org_cost_unit cu ON wc.cost_unit_id = cu.id
        WHERE 1=1
      `;
      if (facilityId) query = sql`${query} AND (wc.facility_id = ${facilityId} OR wc.plant_id = ${facilityId})`;
      if (search) query = sql`${query} AND (wc.code ILIKE ${`%${search}%`} OR wc.name ILIKE ${`%${search}%`})`;
      query = sql`${query} ORDER BY wc.code LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('mfg_work_center not yet fallback pp_work_center:', newErr.message);
      source = 'db-legacy';
      table = 'pp_work_center';
      legalSafe = false;
      let query = sql`
        SELECT wc.*, p.code as plant_code, p.name as plant_name, cc.code as cost_center_code
        FROM pp_work_center wc
        LEFT JOIN ent_plant p ON wc.plant_id = p.id
        LEFT JOIN fi_cost_center cc ON wc.cost_center_id = cc.id
        WHERE 1=1
      `;
      if (facilityId) query = sql`${query} AND wc.plant_id = ${facilityId}`;
      if (search) query = sql`${query} AND (wc.code ILIKE ${`%${search}%`} OR wc.name ILIKE ${`%${search}%`})`;
      query = sql`${query} ORDER BY wc.code LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    }

    return NextResponse.json({
      workCenters: rows,
      data: rows,
      count: rows.length,
      code: 'MWCC',
      aliasCodes: ['WCC', 'CR01', 'FIN-WC-CR'],
      helperCode: 'MWCC',
      table,
      source,
      legalSafe,
      functionDescription: 'Work Center – MWCC legal-safe own IP (was CR01) – code WC-1000, facilityId FAC-1000 was plant_id, costUnitId ECUC was cost_center, capacityPerHour, laborRatePerHour INR/h, machineRatePerHour, overheadRatePercent',
      explanation: 'Work center legal-safe mfg_work_center – code WC-1000, facilityId FAC-1000 was plant_id, costUnitId ECUC was cost_center, capacityPerHour, laborRatePerHour INR/h, machineRatePerHour, overheadRatePercent, setupTimeMinutes – Code MWCC primary alias WCC/CR01 – 4-char MOOA M=Manufacturing WC=WorkCenter C=Create – module grouped intuitive, same length as CR01 but own IP.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, workCenters: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    // SAP-like unique document number – FNDC – auto-generate from FNRC if not provided
    let work_center_code = body.work_center_code;
    if (!work_center_code) {
      try {
        const next = await getNextDocumentNumber('WC', body.company_code || body.legal_entity_code || '1000');
        work_center_code = next.document_number;
      } catch { work_center_code = `WC-${Date.now()}`; }
    }
    const { code, name, facility_id, plant_id, facility_code, plant_code, cost_unit_id, cost_center_id, capacity_per_hour, labor_rate_per_hour, machine_rate_per_hour, overhead_rate_percent, setup_time_minutes, description } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    let facilityIdResolved = facility_id || plant_id;
    if (!facilityIdResolved && (facility_code || plant_code)) {
      try {
        const f = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${facility_code || plant_code} LIMIT 1`);
        if (f.rows.length > 0) facilityIdResolved = (f.rows[0] as any).id;
        else {
          const f2 = await db.execute(sql`SELECT id FROM ent_plant WHERE code = ${facility_code || plant_code} LIMIT 1`);
          if (f2.rows.length > 0) facilityIdResolved = (f2.rows[0] as any).id;
        }
      } catch {}
    }
    if (!facilityIdResolved) return NextResponse.json({ error: 'facility_id/facility_code or plant_id/plant_code required' }, { status: 400 });

    let costUnitIdResolved = cost_unit_id || cost_center_id;
    if (cost_unit_id && typeof cost_unit_id === 'string' && cost_unit_id.length < 36) {
      // Assume code not id
      try {
        const cu = await db.execute(sql`SELECT id FROM org_cost_unit WHERE code = ${cost_unit_id} LIMIT 1`);
        if (cu.rows.length > 0) costUnitIdResolved = (cu.rows[0] as any).id;
      } catch {}
    }

    try {
      const res = await db.execute(sql`
        INSERT INTO mfg_work_center (code, name, facility_id, plant_id, cost_unit_id, cost_center_id, description, capacity_per_hour, labor_rate_per_hour, machine_rate_per_hour, overhead_rate_percent, setup_time_minutes)
        VALUES (${code.toUpperCase()}, ${name}, ${facilityIdResolved}, ${facilityIdResolved}, ${costUnitIdResolved || null}, ${costUnitIdResolved || null}, ${description || null}, ${capacity_per_hour || 0}, ${labor_rate_per_hour || 0}, ${machine_rate_per_hour || 0}, ${overhead_rate_percent || 0}, ${setup_time_minutes || 0})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, facility_id = ${facilityIdResolved}, cost_unit_id = ${costUnitIdResolved || null}, description = ${description || null}, capacity_per_hour = ${capacity_per_hour || 0}, labor_rate_per_hour = ${labor_rate_per_hour || 0}, machine_rate_per_hour = ${machine_rate_per_hour || 0}, overhead_rate_percent = ${overhead_rate_percent || 0}, setup_time_minutes = ${setup_time_minutes || 0}, updated_at = NOW()
        RETURNING id, code, name
      `);
      return NextResponse.json({ success: true, workCenter: res.rows[0], code: 'MWCC', message: `Work center ${code.toUpperCase()} created – MWCC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('mfg_work_center insert failed fallback pp_work_center:', newErr.message);
      const res = await db.execute(sql`
        INSERT INTO pp_work_center (code, name, plant_id, cost_center_id, description, capacity_per_hour, labor_rate_per_hour, machine_rate_per_hour, overhead_rate_percent, setup_time_minutes)
        VALUES (${code.toUpperCase()}, ${name}, ${facilityIdResolved}, ${costUnitIdResolved || null}, ${description || null}, ${capacity_per_hour || 0}, ${labor_rate_per_hour || 0}, ${machine_rate_per_hour || 0}, ${overhead_rate_percent || 0}, ${setup_time_minutes || 0})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, plant_id = ${facilityIdResolved}, description = ${description || null}
        RETURNING id, code, name
      `);
      return NextResponse.json({ success: true, workCenter: res.rows[0], code: 'MWCC', message: `Work center ${code.toUpperCase()} created – CR01 legacy (migrating to MWCC)`, legalSafe: false });
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
      const docNum = body.work_center_code || body.document_number || body.id;
      if (docNum) await updateDocumentWithAudit({ document_number: docNum, new_payload: body, changed_by: 'system', action: 'UPDATE' });
    } catch (auditErr) { console.warn('Audit trail failed', auditErr); }
    const { id, code, name, is_active } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE mfg_work_center SET name = COALESCE(${name}, name), is_active = COALESCE(${is_active}, is_active), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE mfg_work_center SET name = COALESCE(${name}, name), is_active = COALESCE(${is_active}, is_active), updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) throw new Error('Not found in mfg_work_center');
      return NextResponse.json({ success: true, workCenter: res.rows[0], code: 'MWCC', message: `Work center ${res.rows[0].code} updated – MWCC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE pp_work_center SET name = COALESCE(${name}, name), is_active = COALESCE(${is_active}, is_active), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE pp_work_center SET name = COALESCE(${name}, name), is_active = COALESCE(${is_active}, is_active), updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Work center not found' }, { status: 404 });
      return NextResponse.json({ success: true, workCenter: res.rows[0], message: `Work center ${res.rows[0].code} updated – CR01 legacy` });
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
    const code = searchParams.get('code')?.toUpperCase();
    const id = searchParams.get('id');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM mfg_work_center WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM mfg_work_center WHERE code = ${code}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM pp_work_center WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM pp_work_center WHERE code = ${code}`);
    }

    return NextResponse.json({ success: true, code: 'MWCC', message: `Work center ${code || id} deleted – MWCC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
