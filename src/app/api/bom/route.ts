import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * BOM API – Legal-safe own IP – Module 7 PP Manufacturing
 * New: mfg_bom_header + mfg_bom_line (was pp_bom_header + pp_bom_line) – bomNumber BOM-1001, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, type STANDARD/KIT_STOCKED/KIT_PHANTOM, status DRAFT/ACTIVE/BLOCKED/EXPIRED, baseQuantity, baseUom EUOC, isPhantom, isKit, expiryRule MIN_COMPONENTS/FIXED_DAYS/MANUAL, componentItemId EMTC was component_material_id ROH, uomCode EUOC was uom, isBatchTracked ELTC, scrapFactor, workCenterId MWCC
 * Helper code: MBMC BOM Create (alias BMC, CS01, FIN-BOM-CR) – 4-char MOOA M=Manufacturing, BM=BOM, C=Create – same length as CS01 but own IP, module grouped, intuitive
 * Fallback to legacy pp_bom_header
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const plantId = searchParams.get('plantId') || searchParams.get('facilityId');
  const materialId = searchParams.get('materialId') || searchParams.get('itemId');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let boms: any[] = [];
    let source = 'db-new';
    let table = 'mfg_bom_header';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT 
          h.id, h.bom_number, h.item_id as material_id, h.facility_id as plant_id, h.type, h.status, h.version, h.base_quantity, h.base_uom,
          h.is_phantom, h.is_kit, h.expiry_rule, h.fixed_shelf_life_days, h.valid_from, h.valid_to,
          pi.item_number as material_number, pi.name as material_description, pi.item_type as material_type, pi.is_kit, pi.is_phantom_kit,
          f.code as plant_code, f.name as plant_name,
          f.code as facility_code, f.name as facility_name,
          (SELECT COUNT(*) FROM mfg_bom_line WHERE bom_header_id = h.id) as line_count,
          (SELECT SUM(quantity) FROM mfg_bom_line WHERE bom_header_id = h.id) as total_component_qty
        FROM mfg_bom_header h
        LEFT JOIN prod_item pi ON h.item_id = pi.id
        LEFT JOIN org_facility f ON h.facility_id = f.id
        WHERE 1=1
      `;

      if (plantId) query = sql`${query} AND (h.facility_id = ${plantId} OR h.plant_id = ${plantId})`;
      if (materialId) query = sql`${query} AND (h.item_id = ${materialId} OR h.material_id = ${materialId})`;
      if (status) query = sql`${query} AND h.status = ${status}::mfg_bom_status`;
      if (search) query = sql`${query} AND (h.bom_number ILIKE ${`%${search}%`} OR pi.item_number ILIKE ${`%${search}%`} OR pi.name ILIKE ${`%${search}%`})`;

      query = sql`${query} ORDER BY h.bom_number DESC LIMIT ${limit}`;

      const result = await db.execute(query);

      for (const row of result.rows as any[]) {
        try {
          const linesRes = await db.execute(sql`
            SELECT 
              l.id, l.line_number, l.component_item_id as component_material_id, l.quantity, l.uom_code as uom, l.is_batch_tracked, l.is_phantom_explode, l.scrap_factor, l.work_center_id,
              cpi.item_number as component_number, cpi.name as component_description, cpi.item_type as component_type,
              wc.code as work_center_code, wc.name as work_center_name
            FROM mfg_bom_line l
            LEFT JOIN prod_item cpi ON l.component_item_id = cpi.id
            LEFT JOIN mfg_work_center wc ON l.work_center_id = wc.id
            WHERE l.bom_header_id = ${row.id}
            ORDER BY l.line_number
          `);
          boms.push({ ...row, lines: linesRes.rows });
        } catch {
          boms.push({ ...row, lines: [] });
        }
      }
    } catch (newErr: any) {
      console.warn('mfg_bom_header not yet fallback pp_bom_header:', newErr.message);
      source = 'db-legacy';
      table = 'pp_bom_header';
      legalSafe = false;

      let query = sql`
        SELECT 
          h.id, h.bom_number, h.material_id, h.plant_id, h.type, h.status, h.version, h.base_quantity, h.base_uom,
          h.is_phantom, h.is_kit, h.expiry_rule, h.fixed_shelf_life_days, h.valid_from, h.valid_to,
          m.material_number, m.description as material_description, m.type as material_type, m.is_kit, m.is_phantom_kit,
          p.code as plant_code, p.name as plant_name,
          (SELECT COUNT(*) FROM pp_bom_line WHERE bom_header_id = h.id) as line_count,
          (SELECT SUM(quantity) FROM pp_bom_line WHERE bom_header_id = h.id) as total_component_qty
        FROM pp_bom_header h
        JOIN ent_material_master m ON h.material_id = m.id
        JOIN ent_plant p ON h.plant_id = p.id
        WHERE 1=1
      `;

      if (plantId) query = sql`${query} AND h.plant_id = ${plantId}`;
      if (materialId) query = sql`${query} AND h.material_id = ${materialId}`;
      if (status) query = sql`${query} AND h.status = ${status}::bom_status`;
      if (search) query = sql`${query} AND (h.bom_number ILIKE ${`%${search}%`} OR m.material_number ILIKE ${`%${search}%`} OR m.description ILIKE ${`%${search}%`})`;

      query = sql`${query} ORDER BY h.bom_number DESC LIMIT ${limit}`;

      const result = await db.execute(query);

      for (const row of result.rows as any[]) {
        const linesRes = await db.execute(sql`
          SELECT 
            l.id, l.line_number, l.component_material_id, l.quantity, l.uom, l.is_batch_tracked, l.is_phantom_explode, l.scrap_factor, l.work_center_id,
            cm.material_number as component_number, cm.description as component_description, cm.type as component_type,
            wc.code as work_center_code, wc.name as work_center_name
          FROM pp_bom_line l
          JOIN ent_material_master cm ON l.component_material_id = cm.id
          LEFT JOIN pp_work_center wc ON l.work_center_id = wc.id
          WHERE l.bom_header_id = ${row.id}
          ORDER BY l.line_number
        `);
        boms.push({ ...row, lines: linesRes.rows });
      }
    }

    return NextResponse.json({
      boms,
      count: boms.length,
      code: 'MBMC',
      aliasCodes: ['BMC', 'CS01', 'FIN-BOM-CR'],
      helperCode: 'MBMC',
      table,
      source,
      legalSafe,
      functionDescription: 'BOM – MBMC legal-safe own IP (was CS01) – bomNumber BOM-1001, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, type STANDARD/KIT_STOCKED/KIT_PHANTOM, componentItemId EMTC was component_material_id ROH, uomCode EUOC, isBatchTracked ELTC, workCenterId MWCC',
      explanation: 'BOM legal-safe mfg_bom_header + mfg_bom_line – bomNumber BOM-1001, itemId EMTC was material_id, facilityId FAC-1000 was plant_id, type STANDARD/KIT_STOCKED/KIT_PHANTOM, status DRAFT/ACTIVE/BLOCKED/EXPIRED, baseQuantity, baseUom EUOC, isPhantom, isKit, expiryRule MIN_COMPONENTS/FIXED_DAYS/MANUAL, componentItemId EMTC was component_material_id ROH, uomCode EUOC was uom, isBatchTracked ELTC, scrapFactor, workCenterId MWCC – Code MBMC primary alias BMC/CS01 – 4-char MOOA M=Manufacturing BM=BOM C=Create – module grouped intuitive, same length as CS01 but own IP.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, boms: [], source: 'error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { item_id, material_id, item_number, facility_id, plant_id, facility_code, plant_code, type, version, base_quantity, base_uom, is_phantom, is_kit, expiry_rule, lines } = body;

    let itemIdResolved = item_id || material_id;
    if (!itemIdResolved && item_number) {
      try {
        const it = await db.execute(sql`SELECT id FROM prod_item WHERE item_number = ${item_number} LIMIT 1`);
        if (it.rows.length > 0) itemIdResolved = (it.rows[0] as any).id;
        else {
          const it2 = await db.execute(sql`SELECT id FROM ent_material_master WHERE material_number = ${item_number} LIMIT 1`);
          if (it2.rows.length > 0) itemIdResolved = (it2.rows[0] as any).id;
        }
      } catch {}
    }

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

    if (!itemIdResolved) return NextResponse.json({ error: 'item_id/item_number or material_id required' }, { status: 400 });
    if (!facilityIdResolved) return NextResponse.json({ error: 'facility_id/facility_code or plant_id/plant_code required' }, { status: 400 });

    let bomNumber = body.bom_number;
    if (!bomNumber) bomNumber = `BOM-${Date.now()}`;

    try {
      const res = await db.execute(sql`
        INSERT INTO mfg_bom_header (bom_number, item_id, material_id, facility_id, plant_id, type, version, base_quantity, base_uom, is_phantom, is_kit, expiry_rule)
        VALUES (${bomNumber}, ${itemIdResolved}, ${itemIdResolved}, ${facilityIdResolved}, ${facilityIdResolved}, ${type || 'STANDARD'}::mfg_bom_type, ${version || '01'}, ${base_quantity || 1}, ${base_uom || 'PC'}, ${is_phantom || false}, ${is_kit || false}, ${expiry_rule || 'MIN_COMPONENTS'})
        RETURNING id, bom_number
      `);
      const bomId = (res.rows[0] as any).id;

      if (lines && Array.isArray(lines)) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          let compId = line.component_item_id || line.component_material_id;
          if (!compId && line.component_number) {
            try {
              const it = await db.execute(sql`SELECT id FROM prod_item WHERE item_number = ${line.component_number} LIMIT 1`);
              if (it.rows.length > 0) compId = (it.rows[0] as any).id;
            } catch {}
          }
          if (!compId) continue;

          await db.execute(sql`
            INSERT INTO mfg_bom_line (bom_header_id, line_number, component_item_id, component_material_id, quantity, uom_code, uom, is_batch_tracked, scrap_factor, work_center_id)
            VALUES (${bomId}, ${line.line_number || i + 10}, ${compId}, ${compId}, ${line.quantity || 1}, ${line.uom_code || line.uom || 'PC'}, ${line.uom_code || line.uom || 'PC'}, ${line.is_batch_tracked ?? true}, ${line.scrap_factor || 0}, ${line.work_center_id || null})
          `);
        }
      }

      return NextResponse.json({ success: true, bom: res.rows[0], bomNumber, code: 'MBMC', message: `BOM ${bomNumber} created – MBMC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('mfg_bom_header insert failed:', newErr.message);
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
    const { id, bom_number, status } = body;
    if (!id && !bom_number) return NextResponse.json({ error: 'id or bom_number required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE mfg_bom_header SET status = ${status}::mfg_bom_status, updated_at = NOW() WHERE id = ${id} RETURNING id, bom_number, status`);
      else res = await db.execute(sql`UPDATE mfg_bom_header SET status = ${status}::mfg_bom_status, updated_at = NOW() WHERE bom_number = ${bom_number} RETURNING id, bom_number, status`);
      if (res.rows.length === 0) throw new Error('Not found in mfg_bom_header');
      return NextResponse.json({ success: true, bom: res.rows[0], code: 'MBMC', message: `BOM ${res.rows[0].bom_number} status ${status} – MBMC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE pp_bom_header SET status = ${status}::bom_status, updated_at = NOW() WHERE id = ${id} RETURNING id, bom_number, status`);
      else res = await db.execute(sql`UPDATE pp_bom_header SET status = ${status}::bom_status, updated_at = NOW() WHERE bom_number = ${bom_number} RETURNING id, bom_number, status`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'BOM not found' }, { status: 404 });
      return NextResponse.json({ success: true, bom: res.rows[0], message: `BOM ${res.rows[0].bom_number} status ${status} – CS01 legacy` });
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
    const bom_number = searchParams.get('bom_number');
    if (!id && !bom_number) return NextResponse.json({ error: 'id or bom_number required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM mfg_bom_header WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM mfg_bom_header WHERE bom_number = ${bom_number}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM pp_bom_header WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM pp_bom_header WHERE bom_number = ${bom_number}`);
    }

    return NextResponse.json({ success: true, code: 'MBMC', message: `BOM ${bom_number || id} deleted – MBMC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
