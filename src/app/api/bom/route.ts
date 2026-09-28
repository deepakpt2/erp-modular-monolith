import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * BOM API - CS01/CS02/CS03 - Bills of Material
 * GET /api/bom - List BOMs with material, plant, type, status
 * POST /api/bom - Create BOM header + lines
 * PUT /api/bom - Update BOM status, version, lines
 * DELETE /api/bom - Delete BOM (only DRAFT)
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const plantId = searchParams.get('plantId');
  const materialId = searchParams.get('materialId');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
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
    if (status) query = sql`${query} AND h.status = ${status}`;
    if (search) query = sql`${query} AND (h.bom_number ILIKE ${`%${search}%`} OR m.material_number ILIKE ${`%${search}%`} OR m.description ILIKE ${`%${search}%`})`;

    query = sql`${query} ORDER BY h.bom_number DESC LIMIT ${limit}`;

    const result = await db.execute(query);

    // For each BOM, fetch lines
    const boms = [];
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

    return NextResponse.json({
      boms,
      count: boms.length,
      source: 'db',
      functionCodes: 'CS01 Create BOM, CS02 Change BOM, CS03 Display BOM',
      note: 'BOM User Interface - Managing recipes/assemblies across multiple plants - Frontend for backend pp_bom_header/lines',
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
    const { materialId, plantId, type, baseQuantity, baseUom, isPhantom, isKit, expiryRule, fixedShelfLifeDays, validFrom, validTo, lines } = body;

    if (!materialId || !plantId) return NextResponse.json({ error: 'materialId and plantId required' }, { status: 400 });

    // Generate BOM number: BOM- + timestamp
    const bomNumber = `BOM-${Date.now().toString().slice(-8)}`;

    const headerRes = await db.execute(sql`
      INSERT INTO pp_bom_header (bom_number, material_id, plant_id, type, status, version, base_quantity, base_uom, is_phantom, is_kit, expiry_rule, fixed_shelf_life_days, valid_from, valid_to)
      VALUES (${bomNumber}, ${materialId}, ${plantId}, ${type || 'STANDARD'}::bom_type, 'ACTIVE', '01', ${baseQuantity || '1'}, ${baseUom || 'KG'}, ${isPhantom || false}, ${isKit || false}, ${expiryRule || 'MIN_COMPONENTS'}, ${fixedShelfLifeDays || null}, ${validFrom ? new Date(validFrom) : new Date()}::timestamp, ${validTo ? new Date(validTo) : null}::timestamp)
      RETURNING id, bom_number
    `);

    const bomId = (headerRes.rows[0] as any).id;

    // Insert lines if provided
    if (lines && Array.isArray(lines) && lines.length > 0) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        await db.execute(sql`
          INSERT INTO pp_bom_line (bom_header_id, line_number, component_material_id, quantity, uom, is_batch_tracked, is_phantom_explode, scrap_factor, work_center_id)
          VALUES (${bomId}, ${line.lineNumber || (i+1)*10}, ${line.componentMaterialId}, ${line.quantity}, ${line.uom || 'KG'}, ${line.isBatchTracked ?? true}, ${line.isPhantomExplode || false}, ${line.scrapFactor || '0'}, ${line.workCenterId || null})
        `);
      }
    }

    // Audit log
    await db.execute(sql`
      INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description)
      VALUES ('pp_bom_header', ${bomId}, ${bomNumber}, 'INSERT', ${JSON.stringify(body)}::jsonb, ${`BOM CREATE CS01: ${bomNumber} material ${materialId} plant ${plantId} type ${type} lines ${lines?.length||0}`})
    `).catch(()=>{});

    return NextResponse.json({ success: true, bomId, bomNumber, message: `BOM ${bomNumber} created CS01 with ${lines?.length||0} components` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, action, status, lines } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    if (action === 'SET_STATUS') {
      await db.execute(sql`UPDATE pp_bom_header SET status = ${status}::bom_status, updated_at = NOW() WHERE id = ${id}`);
      return NextResponse.json({ success: true, message: `BOM ${id} status set to ${status}` });
    }

    if (action === 'ADD_LINE') {
      const { componentMaterialId, quantity, uom, isPhantomExplode, scrapFactor, workCenterId } = body;
      const maxLineRes = await db.execute(sql`SELECT COALESCE(MAX(line_number),0)+10 as next_line FROM pp_bom_line WHERE bom_header_id = ${id}`);
      const nextLine = (maxLineRes.rows[0] as any).next_line;
      await db.execute(sql`
        INSERT INTO pp_bom_line (bom_header_id, line_number, component_material_id, quantity, uom, is_phantom_explode, scrap_factor, work_center_id)
        VALUES (${id}, ${nextLine}, ${componentMaterialId}, ${quantity}, ${uom || 'KG'}, ${isPhantomExplode || false}, ${scrapFactor || '0'}, ${workCenterId || null})
      `);
      return NextResponse.json({ success: true, message: `BOM line added to ${id} line ${nextLine}` });
    }

    if (action === 'UPDATE_LINES' && lines) {
      // Delete existing and re-insert (simplified)
      await db.execute(sql`DELETE FROM pp_bom_line WHERE bom_header_id = ${id}`);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        await db.execute(sql`
          INSERT INTO pp_bom_line (bom_header_id, line_number, component_material_id, quantity, uom, is_batch_tracked, is_phantom_explode, scrap_factor, work_center_id)
          VALUES (${id}, ${line.lineNumber || (i+1)*10}, ${line.componentMaterialId}, ${line.quantity}, ${line.uom || 'KG'}, ${line.isBatchTracked ?? true}, ${line.isPhantomExplode || false}, ${line.scrapFactor || '0'}, ${line.workCenterId || null})
        `);
      }
      await db.execute(sql`UPDATE pp_bom_header SET updated_at = NOW() WHERE id = ${id}`);
      return NextResponse.json({ success: true, message: `BOM ${id} lines updated ${lines.length} components` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
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
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const statusRes = await db.execute(sql`SELECT status FROM pp_bom_header WHERE id = ${id} LIMIT 1`);
    if (statusRes.rows.length === 0) return NextResponse.json({ error: 'BOM not found' }, { status: 404 });
    const status = (statusRes.rows[0] as any).status;
    if (status !== 'DRAFT') return NextResponse.json({ error: 'Only DRAFT BOM can be deleted, set to BLOCKED instead' }, { status: 400 });

    await db.execute(sql`DELETE FROM pp_bom_header WHERE id = ${id}`);

    return NextResponse.json({ success: true, message: `BOM ${id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
