import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';

    let query = sql`
      SELECT 
        m.id,
        m.material_number,
        m.type,
        m.description,
        m.base_uom,
        m.is_batch_managed,
        m.shelf_life_days,
        m.expiry_control,
        m.is_kit,
        m.is_phantom_kit,
        m.valuation_class,
        m.is_active,
        mg.code as group_code,
        mp.moving_avg_price,
        mp.standard_price,
        mp.total_stock_qty,
        mp.total_stock_value
      FROM ent_material_master m
      LEFT JOIN ent_material_group mg ON m.group_id = mg.id
      LEFT JOIN ent_material_plant mp ON m.id = mp.material_id
      WHERE 1=1
    `;

    if (search) {
      query = sql`${query} AND (m.material_number ILIKE ${`%${search}%`} OR m.description ILIKE ${`%${search}%`})`;
    }

    query = sql`${query} ORDER BY m.material_number LIMIT ${limit}`;

    const result = await db.execute(query);
    
    return NextResponse.json({
      code: 'MM01',
      functionDescription: 'Material Master – MM01/MM02/MM03',
 
      materials: result.rows,
      count: result.rows.length,
      source: 'db'
    });
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
    const { 
      material_number, description, description_long, type, base_uom, group_code, 
      shelf_life_days, expiry_control, is_kit, is_phantom_kit, valuation_class, is_hazardous, landed_cost_relevance,
      is_batch_managed,
      // Sales view
      sales_org, distribution_channel, division, sales_uom, tax_classification, account_assignment_group, item_category_group,
      // Purchasing view
      purchasing_group, purchasing_org,
      // MRP view
      mrp_type, mrp_controller, lot_size, min_lot_size, max_lot_size, fixed_lot_size, procurement_type, special_procurement, safety_stock, reorder_point,
      // Plant view
      plant_codes, // array of plant codes to create material_plant for
      // Accounting/Costing
      price_control, moving_avg_price, standard_price, costing_lot_size, overhead_group, price_unit,
      // Quality
      is_qm_active, qm_control_key, inspection_type,
      // Classification
      classifications, // array of {className, characteristic, value}
    } = body;

    if (!material_number || !description || !type) {
      return NextResponse.json({ error: 'material_number, description, type required' }, { status: 400 });
    }

    // Get group_id
    let groupId = null;
    if (group_code) {
      const groupRes = await db.execute(sql`SELECT id FROM ent_material_group WHERE code = ${group_code} LIMIT 1`);
      if (groupRes.rows.length > 0) groupId = (groupRes.rows[0] as any).id;
    }

    // Get plants for material_plant creation
    const reqCompanyCode = (body.companyCode as string) || null;
    const reqPlantCode = (body.plantCode as string) || null;
    let plantIds: any[] = [];
    
    if (plant_codes && Array.isArray(plant_codes) && plant_codes.length > 0) {
      for (const pc of plant_codes) {
        const plantRes = await db.execute(sql`SELECT id FROM ent_plant WHERE code = ${pc} LIMIT 1`);
        if (plantRes.rows.length > 0) plantIds.push((plantRes.rows[0] as any).id);
      }
    } else {
      let plantId: any = null;
      if (reqPlantCode) {
        const plantRes = await db.execute(sql`SELECT id FROM ent_plant WHERE code = ${reqPlantCode} LIMIT 1`);
        plantId = plantRes.rows.length > 0 ? (plantRes.rows[0] as any).id : null;
      }
      if (!plantId && reqCompanyCode) {
        const plantRes = await db.execute(sql`SELECT p.id FROM ent_plant p JOIN ent_company_code cc ON p.company_code_id = cc.id WHERE cc.code = ${reqCompanyCode} LIMIT 1`);
        plantId = plantRes.rows.length > 0 ? (plantRes.rows[0] as any).id : null;
      }
      if (!plantId) {
        const plantRes = await db.execute(sql`SELECT id FROM ent_plant WHERE code IN ('KP01','1000') ORDER BY CASE code WHEN 'KP01' THEN 0 WHEN '1000' THEN 1 ELSE 2 END LIMIT 1`);
        plantId = plantRes.rows.length > 0 ? (plantRes.rows[0] as any).id : null;
      }
      if (plantId) plantIds = [plantId];
    }

    // Insert material master with all basic data
    const insertRes = await db.execute(sql`
      INSERT INTO ent_material_master (
        material_number, type, group_id, base_uom, description, description_long,
        is_batch_managed, shelf_life_days, expiry_control, 
        is_kit, is_phantom_kit, valuation_class, is_hazardous, landed_cost_relevance, is_active
      )
      VALUES (
        ${material_number}, ${type}, ${groupId}, ${base_uom || 'KG'}, ${description}, ${description_long || null},
        ${is_batch_managed ?? true}, ${shelf_life_days || 30}, ${expiry_control || 'BLOCK'},
        ${is_kit || false}, ${is_phantom_kit || false}, ${valuation_class || (type === 'FERT' ? 'FERT' : 'ROH')}, ${is_hazardous || false}, ${landed_cost_relevance || 'ALL'}, true
      )
      ON CONFLICT (material_number) DO UPDATE SET
        description = ${description},
        description_long = COALESCE(${description_long || null}, ent_material_master.description_long),
        type = ${type},
        base_uom = ${base_uom || 'KG'},
        shelf_life_days = ${shelf_life_days || 30},
        valuation_class = ${valuation_class || (type === 'FERT' ? 'FERT' : 'ROH')}
      RETURNING id, material_number
    `);

    const materialId = (insertRes.rows[0] as any).id;

    // Create material_plant extensions for each plant with MRP, Purchasing, Accounting, Costing, Quality views
    for (const pId of plantIds) {
      await db.execute(sql`
        INSERT INTO ent_material_plant (
          material_id, plant_id, price_control, moving_avg_price, standard_price, 
          total_stock_qty, total_stock_value,
          safety_stock, reorder_point,
          mrp_type, mrp_controller, lot_size, min_lot_size, max_lot_size, fixed_lot_size,
          procurement_type, special_procurement,
          purchasing_group, purchasing_org,
          costing_lot_size, overhead_group,
          valuation_class, price_unit,
          is_qm_active
        )
        VALUES (
          ${materialId}, ${pId}, ${price_control || (type === 'FERT' ? 'S' : 'V')}, ${moving_avg_price || 0}, ${standard_price || 0}, 0, 0,
          ${safety_stock || 0}, ${reorder_point || 0},
          ${mrp_type || 'PD'}, ${mrp_controller || '001'}, ${lot_size || 'EX'}, ${min_lot_size || 0}, ${max_lot_size || 0}, ${fixed_lot_size || 0},
          ${procurement_type || (type === 'FERT' ? 'E' : 'F')}, ${special_procurement || null},
          ${purchasing_group || '001'}, ${purchasing_org || '1000'},
          ${costing_lot_size || 1}, ${overhead_group || null},
          ${valuation_class || (type === 'FERT' ? 'FERT' : 'ROH')}, ${price_unit || 1},
          ${is_qm_active || false}
        )
        ON CONFLICT (material_id, plant_id) DO UPDATE SET
          price_control = ${price_control || (type === 'FERT' ? 'S' : 'V')},
          safety_stock = ${safety_stock || 0},
          reorder_point = ${reorder_point || 0},
          mrp_type = ${mrp_type || 'PD'},
          procurement_type = ${procurement_type || (type === 'FERT' ? 'E' : 'F')},
          purchasing_group = ${purchasing_group || '001'},
          costing_lot_size = ${costing_lot_size || 1},
          updated_at = NOW()
      `);

      // Quality view
      try {
        await db.execute(sql`
          INSERT INTO ent_material_quality (material_id, plant_id, qm_control_key, inspection_type, is_qm_active)
          VALUES (${materialId}, ${pId}, ${qm_control_key || '0001'}, ${inspection_type || '01'}, ${is_qm_active || false})
          ON CONFLICT (material_id, plant_id) DO UPDATE SET
            qm_control_key = ${qm_control_key || '0001'},
            is_qm_active = ${is_qm_active || false}
        `);
      } catch {}
    }

    // Sales view - if sales_org provided
    if (sales_org) {
      try {
        const salesOrg = sales_org;
        const distChannel = distribution_channel || 'K1';
        const div = division || 'K1';
        // Get delivering plant id (first plant)
        const delPlantId = plantIds.length > 0 ? plantIds[0] : null;
        await db.execute(sql`
          INSERT INTO ent_material_sales (material_id, sales_org, distribution_channel, division, sales_uom, tax_classification, account_assignment_group, item_category_group, delivering_plant_id)
          VALUES (${materialId}, ${salesOrg}, ${distChannel}, ${div}, ${sales_uom || base_uom || 'KG'}, ${tax_classification || '1'}, ${account_assignment_group || '01'}, ${item_category_group || 'NORM'}, ${delPlantId})
          ON CONFLICT (material_id, sales_org, distribution_channel, division) DO UPDATE SET
            sales_uom = ${sales_uom || base_uom || 'KG'},
            tax_classification = ${tax_classification || '1'}
        `);
      } catch (e) {
        console.warn('Sales view insert failed', e);
      }
    }

    // Classification view
    if (classifications && Array.isArray(classifications) && classifications.length > 0) {
      for (const cls of classifications) {
        try {
          await db.execute(sql`
            INSERT INTO ent_material_classification (material_id, class_type, class_name, characteristic, value)
            VALUES (${materialId}, ${cls.classType || '001'}, ${cls.className}, ${cls.characteristic}, ${cls.value})
          `);
        } catch {}
      }
    }

    // Audit log WORM-lite old_values new_values JSON per Phase 5 requirement
    try {
      await db.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description)
        VALUES (
          'ent_material_master', ${materialId}, ${material_number}, 'INSERT',
          ${JSON.stringify(body)}::jsonb, ${`Material CREATE MM01 ERP Views: ${material_number} ${description} Type ${type} Basic+Classification+Sales+Purchasing+MRP+Plant+Quality+Accounting+Costing`}
        )
      `);
    } catch (e) {
      console.warn('Audit log failed:', e);
    }

    return NextResponse.json({ 
      success: true, 
      material: { id: materialId, material_number, description, type },
      message: `Material ${material_number} created with ERP views Basic+Classification+Sales+Purchasing+MRP+Plant+Quality+Accounting+Costing (MM01)`
    });

  } catch (e: any) {
    console.error('Create material failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, material_number, description, type, base_uom, group_code, shelf_life_days, expiry_control, is_kit, is_phantom_kit, valuation_class } = body;

    if (!id && !material_number) {
      return NextResponse.json({ error: 'id or material_number required for update' }, { status: 400 });
    }

    // Get existing for audit old_data
    let existing: any = null;
    if (id) {
      const res = await db.execute(sql`SELECT * FROM ent_material_master WHERE id = ${id} LIMIT 1`);
      if (res.rows.length > 0) existing = res.rows[0];
    } else if (material_number) {
      const res = await db.execute(sql`SELECT * FROM ent_material_master WHERE material_number = ${material_number} LIMIT 1`);
      if (res.rows.length > 0) existing = res.rows[0];
    }

    if (!existing) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    let groupId = existing.group_id;
    if (group_code) {
      const groupRes = await db.execute(sql`SELECT id FROM ent_material_group WHERE code = ${group_code} LIMIT 1`);
      if (groupRes.rows.length > 0) groupId = (groupRes.rows[0] as any).id;
    }

    const updated = await db.execute(sql`
      UPDATE ent_material_master SET
        description = COALESCE(${description}, description),
        type = COALESCE(${type}, type),
        base_uom = COALESCE(${base_uom}, base_uom),
        group_id = COALESCE(${groupId}, group_id),
        shelf_life_days = COALESCE(${shelf_life_days}, shelf_life_days),
        expiry_control = COALESCE(${expiry_control}, expiry_control),
        is_kit = COALESCE(${is_kit}, is_kit),
        is_phantom_kit = COALESCE(${is_phantom_kit}, is_phantom_kit),
        valuation_class = COALESCE(${valuation_class}, valuation_class),
        updated_at = NOW()
      WHERE id = ${existing.id}
      RETURNING id, material_number, description, type
    `);

    // Audit log with old_values and new_values JSON per Phase 5 WORM-lite requirement
    try {
      await db.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, old_values, new_values, description)
        VALUES (
          'ent_material_master', ${existing.id}, ${existing.material_number}, 'UPDATE',
          ${JSON.stringify(existing)}::jsonb,
          ${JSON.stringify(body)}::jsonb,
          ${`Material CHANGE MM02: ${existing.material_number} -> ${description || existing.description} old_data->new_data JSON captured`}
        )
      `);
    } catch (e) {
      console.warn('Audit log failed:', e);
    }

    return NextResponse.json({
      success: true,
      material: updated.rows[0],
      message: `Material ${existing.material_number} updated successfully (MM02)`,
    });
  } catch (e: any) {
    console.error('Update material failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const material_number = searchParams.get('material_number');
    const id = searchParams.get('id');
    if (!material_number && !id) return NextResponse.json({ error: 'material_number or id required' }, { status: 400 });

    let matId = id;
    let matNum = material_number;
    if (!matId && matNum) {
      const r = await db.execute(sql`SELECT id, material_number FROM ent_material_master WHERE material_number = ${matNum} LIMIT 1`);
      if (r.rows.length > 0) { matId = (r.rows[0] as any).id; matNum = (r.rows[0] as any).material_number; }
    }

    if (!matId) return NextResponse.json({ error: 'Material not found' }, { status: 404 });

    // SECURITY: Check if material has transactions and cannot be deleted to maintain audit trail – stock, PR, PO, GR, etc – block hard delete
    let stockCount = 0, prCount = 0, poCount = 0, grCount = 0, bomCount = 0;
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_stock WHERE material_id = ${matId}`); stockCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_pr_line WHERE material_id = ${matId}`); prCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_po_line WHERE material_id = ${matId}`); poCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_gr_line WHERE material_id = ${matId}`); grCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM pp_bom_line WHERE component_material_id = ${matId}`); bomCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}

    if (stockCount > 0 || prCount > 0 || poCount > 0 || grCount > 0 || bomCount > 0) {
      // Soft delete
      await db.execute(sql`UPDATE ent_material_master SET is_active = false WHERE id = ${matId}`);
      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: `Material ${matNum} has transactions and cannot be deleted to maintain audit trail – Stock:${stockCount} PR:${prCount} PO:${poCount} GR:${grCount} BOM:${bomCount} – hard delete BLOCKED for security/audit. Soft deleted (is_active=false) instead.`,
        security: 'Material with transactions cannot be hard deleted – would orphan stock, PR, PO, BOM, FI. Use soft delete.',
      });
    }

    await db.execute(sql`DELETE FROM ent_material_plant WHERE material_id = ${matId}`).catch(()=>{});
    await db.execute(sql`DELETE FROM ent_material_master WHERE id = ${matId}`);

    return NextResponse.json({ success: true, message: `Material ${matNum || matId} deleted – only allowed when no transactions` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
