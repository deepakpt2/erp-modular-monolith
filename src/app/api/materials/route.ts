import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

// Mapping old SAP-like values to new legal-safe values
const mapTypeOldToNew = (oldType: string): string => {
  const m: Record<string, string> = {
    'ROH': 'RAW', 'FERT': 'FINISHED', 'HALB': 'SEMI', 'HAWA': 'TRADING',
    'VERP': 'PACKAGING', 'NLAG': 'CONSUMABLE', 'DIEN': 'SERVICE',
    'RAW': 'RAW', 'FINISHED': 'FINISHED', 'SEMI': 'SEMI', 'TRADING': 'TRADING',
    'PACKAGING': 'PACKAGING', 'CONSUMABLE': 'CONSUMABLE', 'SERVICE': 'SERVICE'
  };
  return m[oldType?.toUpperCase()] || 'RAW';
};
const mapTypeNewToOld = (newType: string): string => {
  const m: Record<string, string> = {
    'RAW': 'ROH', 'FINISHED': 'FERT', 'SEMI': 'HALB', 'TRADING': 'HAWA',
    'PACKAGING': 'VERP', 'CONSUMABLE': 'NLAG', 'SERVICE': 'DIEN'
  };
  return m[newType?.toUpperCase()] || 'ROH';
};
const mapPriceControlOldToNew = (old: string): string => {
  if (!old) return 'MOVING_AVG';
  const u = old.toUpperCase();
  if (u === 'S' || u === 'STANDARD') return 'STANDARD';
  if (u === 'V' || u === 'MOVING_AVG') return 'MOVING_AVG';
  return 'MOVING_AVG';
};
const mapExpiryOldToNew = (old: string): string => {
  const m: Record<string, string> = { 'BLOCK': 'BLOCKED', 'WARNING': 'WARN', 'RESTRICTED_USE': 'RESTRICTED', 'BLOCKED': 'BLOCKED', 'WARN': 'WARN', 'RESTRICTED': 'RESTRICTED' };
  return m[old?.toUpperCase()] || 'BLOCKED';
};
const mapMrpOldToNew = (old: string): string => {
  const m: Record<string, string> = { 'PD': 'MRP', 'ND': 'NO_PLANNING', 'VB': 'MANUAL_REORDER', 'VM': 'REORDER_POINT', 'MRP': 'MRP', 'MANUAL_REORDER': 'MANUAL_REORDER', 'NO_PLANNING': 'NO_PLANNING', 'REORDER_POINT': 'REORDER_POINT' };
  return m[old?.toUpperCase()] || 'MRP';
};
const mapLotSizeOldToNew = (old: string): string => {
  const m: Record<string, string> = { 'EX': 'LOT_FOR_LOT', 'FX': 'FIXED', 'HB': 'MAX_LEVEL', 'LOT_FOR_LOT': 'LOT_FOR_LOT', 'FIXED': 'FIXED', 'MAX_LEVEL': 'MAX_LEVEL' };
  return m[old?.toUpperCase()] || 'LOT_FOR_LOT';
};
const mapProcTypeOldToNew = (old: string): string => {
  const m: Record<string, string> = { 'F': 'BUY', 'E': 'MAKE', 'X': 'BOTH', 'BUY': 'BUY', 'MAKE': 'MAKE', 'BOTH': 'BOTH' };
  return m[old?.toUpperCase()] || 'BUY';
};

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';

    // Try new legal-safe tables first
    try {
      let query = sql`
        SELECT 
          p.id,
          p.item_number as material_number,
          p.item_number,
          p.type,
          p.description,
          p.description_long,
          p.base_unit as base_uom,
          p.base_unit,
          p.is_lot_managed as is_batch_managed,
          p.shelf_life_days,
          p.lot_control as expiry_control,
          p.is_kit,
          p.is_phantom_kit,
          p.inventory_valuation_class as valuation_class,
          p.is_active,
          p.hsn_code,
          pc.code as group_code,
          pf.moving_avg_price,
          pf.standard_price,
          pf.total_stock_qty,
          pf.total_stock_value
        FROM prod_item p
        LEFT JOIN prod_category pc ON p.category_id = pc.id
        LEFT JOIN prod_facility_profile pf ON p.id = pf.item_id
        WHERE 1=1
      `;

      if (search) {
        query = sql`${query} AND (p.item_number ILIKE ${`%${search}%`} OR p.description ILIKE ${`%${search}%`})`;
      }

      query = sql`${query} ORDER BY p.item_number LIMIT ${limit}`;

      const result = await db.execute(query);
      
      return NextResponse.json({
        code: 'EMTC',
        aliasCodes: ['MTC', 'MM01', 'FND-MAT-CR'],
        helperCode: 'EMTC',
        functionDescription: 'Product Catalog – EMTC/EMTE/EMTV/EMTL – Legal-safe own IP (was MM01/MM02/MM03)',
        table: 'prod_item',
        materials: result.rows,
        count: result.rows.length,
        source: 'db-new',
        legalSafe: true,
        mapping: 'ROH->RAW, FERT->FINISHED, HALB->SEMI, S->STANDARD, V->MOVING_AVG, PD->MRP, EX->LOT_FOR_LOT, F->BUY'
      });
    } catch (newErr: any) {
      // Fallback to old tables
      console.warn('New prod_item table not yet migrated, fallback to ent_material_master:', newErr.message);
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
        code: 'EMTC',
        aliasCodes: ['MTC', 'MM01', 'FND-MAT-CR'],
        helperCode: 'EMTC',
        functionDescription: 'Material Master – MM01/MM02/MM03 (legacy ent_material_master – migrating to prod_item)',
        materials: result.rows,
        count: result.rows.length,
        source: 'db-legacy',
        legalSafe: false,
        migrationNote: 'Fallback to legacy – run drizzle-kit push to create prod_item'
      });
    }
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
      material_number, item_number, description, description_long, type, base_uom, base_unit, group_code, category_code,
      shelf_life_days, expiry_control, lot_control, is_kit, is_phantom_kit, valuation_class, inventory_valuation_class, is_hazardous, landed_cost_relevance, landed_cost_scope,
      is_batch_managed, is_lot_managed,
      // Sales view
      sales_org, commercial_org, distribution_channel, sales_channel, division, product_line, sales_uom, commercial_unit, tax_classification, account_assignment_group, item_category_group,
      // Purchasing view
      purchasing_group, buyer_group, purchasing_org, procurement_division,
      // MRP view
      mrp_type, planning_type, mrp_controller, planning_controller, lot_size, lot_sizing, min_lot_size, max_lot_size, fixed_lot_size, procurement_type, procurement_method, special_procurement, special_procurement_method, safety_stock, reorder_point,
      // Plant view
      plant_codes, facility_codes,
      // Accounting/Costing
      price_control, pricing_method, moving_avg_price, standard_price, costing_lot_size, overhead_group, price_unit,
      // Quality
      is_qm_active, is_quality_active, qm_control_key, quality_control_key, inspection_type,
      // Classification
      classifications,
      // HSN
      hsn_code,
      barcode,
    } = body;

    // SAP STANDARD – ALWAYS AUTO – BLOCK MANUAL – per user confirmation block_manual
    // If user types random 10 digits like 1234567890, it is BLOCKED – always auto via number range
    // This is SAP internal numbering – like SAP MM01 – no manual entry allowed – field removed from UI
    if (item_number || material_number) {
      console.warn(`Manual material number blocked – user tried ${item_number || material_number} – SAP internal numbering – always auto – per user block_manual – random 10 digits blocked`);
      // Optionally return error, but for backward compat we will auto-generate and warn
      // If you want strict block, uncomment below:
      // return NextResponse.json({ error: `Manual material number ${item_number || material_number} not allowed – SAP internal numbering – always auto via number range MAT-01/ITEM – random 10 digits like 1234567890 blocked – per configuration block_manual – system will generate 10000001 etc. Create range via FNRC.` }, { status: 400 });
    }

    let finalItemNumber: string;
    // Always auto-number from number range – SAP STANDARD numeric – NO PREFIX – FBN1 style – no manual allowed
    // SAP: Material number is purely numeric e.g., 10000001, not MAT-10000001 – always auto
    try {
      const nrRes = await db.execute(sql`SELECT code, current_number, from_number, to_number FROM core_number_range WHERE object_type = 'ITEM'::core_number_range_object_type OR code IN ('MAT-01','ITEM-01','ITEM','MATERIAL') ORDER BY CASE code WHEN 'MAT-01' THEN 0 WHEN 'ITEM-01' THEN 1 WHEN 'ITEM' THEN 2 ELSE 3 END LIMIT 1`);
      if (nrRes.rows.length > 0) {
        const nr = nrRes.rows[0] as any;
        const nextNum = Number(nr.current_number || nr.from_number || 10000000) + 1;
        if (nr.to_number && nextNum > Number(nr.to_number)) throw new Error(`Number range ${nr.code} exhausted – ${nextNum} > ${nr.to_number} – SAP – next available would be ${nextNum} > to ${nr.to_number} – create new range MAT-02`);
        await db.execute(sql`UPDATE core_number_range SET current_number = ${nextNum}, prefix = '', updated_at = NOW() WHERE code = ${nr.code}`);
        finalItemNumber = String(nextNum); // SAP numeric only – no prefix – e.g., 10000001
      } else {
        finalItemNumber = String(10000000 + Math.floor(Date.now() % 9000000));
      }
    } catch (e: any) {
      console.warn('Auto-number failed, fallback numeric:', e.message);
      finalItemNumber = String(10000000 + Math.floor(Date.now() % 9000000));
    }
    const finalBaseUnit = base_unit || base_uom || 'KG';
    const finalGroupCode = category_code || group_code;
    const finalType = mapTypeOldToNew(type || 'RAW');
    const finalLotControl = mapExpiryOldToNew(lot_control || expiry_control || 'BLOCKED');
    const finalPricingMethod = mapPriceControlOldToNew(pricing_method || price_control || 'MOVING_AVG');
    const finalPlanningType = mapMrpOldToNew(planning_type || mrp_type || 'MRP');
    const finalLotSizing = mapLotSizeOldToNew(lot_sizing || lot_size || 'LOT_FOR_LOT');
    const finalProcMethod = mapProcTypeOldToNew(procurement_method || procurement_type || 'BUY');
    const finalValuationClass = inventory_valuation_class || valuation_class || (finalType === 'FINISHED' ? 'FINISHED' : 'RAW');
    const finalLandedScope = landed_cost_scope || landed_cost_relevance || 'ALL';
    const finalIsLotManaged = is_lot_managed ?? is_batch_managed ?? true;
    const finalIsQualityActive = is_quality_active ?? is_qm_active ?? false;

    if (!finalItemNumber || !description || !type) {
      return NextResponse.json({ error: 'item_number (or material_number), description, type required – type RAW/FINISHED/SEMI (legal-safe, old ROH/FERT/HALB also accepted). If item_number blank, auto-number from MAT-01 range will be used.' }, { status: 400 });
    }

    // Try new tables first
    try {
      // Get category_id
      let categoryId = null;
      if (finalGroupCode) {
        const groupRes = await db.execute(sql`SELECT id FROM prod_category WHERE code = ${finalGroupCode} LIMIT 1`);
        if (groupRes.rows.length > 0) categoryId = (groupRes.rows[0] as any).id;
        else {
          // Try legacy
          try {
            const legacyGroup = await db.execute(sql`SELECT id FROM ent_material_group WHERE code = ${finalGroupCode} LIMIT 1`);
            if (legacyGroup.rows.length > 0) {
              // Create in new table
              const newCat = await db.execute(sql`INSERT INTO prod_category (code, name) VALUES (${finalGroupCode}, ${finalGroupCode}) ON CONFLICT (code) DO UPDATE SET name=${finalGroupCode} RETURNING id`);
              categoryId = (newCat.rows[0] as any).id;
            }
          } catch {}
        }
      }

      // Get facilities
      let facilityIds: any[] = [];
      const reqFacilityCodes = facility_codes || plant_codes;
      if (reqFacilityCodes && Array.isArray(reqFacilityCodes) && reqFacilityCodes.length > 0) {
        for (const fc of reqFacilityCodes) {
          try {
            const fRes = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${fc} LIMIT 1`);
            if (fRes.rows.length > 0) facilityIds.push((fRes.rows[0] as any).id);
            else {
              const legacyPlant = await db.execute(sql`SELECT id FROM ent_plant WHERE code = ${fc} LIMIT 1`);
              if (legacyPlant.rows.length > 0) facilityIds.push((legacyPlant.rows[0] as any).id);
            }
          } catch {}
        }
      } else {
        // Default facility
        try {
          const fRes = await db.execute(sql`SELECT id FROM org_facility ORDER BY code LIMIT 1`);
          if (fRes.rows.length > 0) facilityIds = [(fRes.rows[0] as any).id];
          else {
            const plantRes = await db.execute(sql`SELECT id FROM ent_plant WHERE code IN ('FAC-1000','1000') ORDER BY CASE code WHEN 'FAC-1000' THEN 0 WHEN '1000' THEN 1 ELSE 2 END LIMIT 1`);
            if (plantRes.rows.length > 0) facilityIds = [(plantRes.rows[0] as any).id];
          }
        } catch {}
      }

      // Insert prod_item
      const insertRes = await db.execute(sql`
        INSERT INTO prod_item (
          item_number, type, category_id, base_unit, description, description_long,
          is_lot_managed, shelf_life_days, lot_control, 
          is_kit, is_phantom_kit, inventory_valuation_class, is_hazardous, landed_cost_scope, is_active, hsn_code, barcode
        )
        VALUES (
          ${finalItemNumber}, ${finalType}::prod_item_type_enum, ${categoryId}, ${finalBaseUnit}, ${description}, ${description_long || null},
          ${finalIsLotManaged}, ${shelf_life_days || 30}, ${finalLotControl}::prod_lot_control,
          ${is_kit || false}, ${is_phantom_kit || false}, ${finalValuationClass}, ${is_hazardous || false}, ${finalLandedScope}::prod_landed_cost_scope, true, ${hsn_code || null}, ${barcode || null}
        )
        ON CONFLICT (item_number) DO UPDATE SET
          description = ${description},
          description_long = COALESCE(${description_long || null}, prod_item.description_long),
          type = ${finalType}::prod_item_type_enum,
          base_unit = ${finalBaseUnit},
          shelf_life_days = ${shelf_life_days || 30},
          inventory_valuation_class = ${finalValuationClass}
        RETURNING id, item_number
      `);

      const itemId = (insertRes.rows[0] as any).id;

      // Create facility profiles
      for (const fId of facilityIds) {
        await db.execute(sql`
          INSERT INTO prod_facility_profile (
            item_id, facility_id, pricing_method, moving_avg_price, standard_price, 
            total_stock_qty, total_stock_value,
            safety_stock, reorder_point,
            planning_type, planning_controller, lot_sizing, min_lot_size, max_lot_size, fixed_lot_size,
            procurement_method, special_procurement_method,
            buyer_group, procurement_division,
            costing_lot_size, overhead_group,
            inventory_valuation_class, price_unit,
            is_quality_active
          )
          VALUES (
            ${itemId}, ${fId}, ${finalPricingMethod}::prod_pricing_method, ${moving_avg_price || 0}, ${standard_price || 0}, 0, 0,
            ${safety_stock || 0}, ${reorder_point || 0},
            ${finalPlanningType}::prod_planning_type, ${planning_controller || mrp_controller || 'CTRL-001'}, ${finalLotSizing}::prod_lot_sizing, ${min_lot_size || 0}, ${max_lot_size || 0}, ${fixed_lot_size || 0},
            ${finalProcMethod}::prod_procurement_method, ${special_procurement_method || special_procurement || null},
            ${buyer_group || purchasing_group || 'BUY-001'}, ${procurement_division || purchasing_org || 'PD-1000'},
            ${costing_lot_size || 1}, ${overhead_group || null},
            ${finalValuationClass}, ${price_unit || 1},
            ${finalIsQualityActive}
          )
          ON CONFLICT (item_id, facility_id) DO UPDATE SET
            pricing_method = ${finalPricingMethod}::prod_pricing_method,
            safety_stock = ${safety_stock || 0},
            reorder_point = ${reorder_point || 0},
            planning_type = ${finalPlanningType}::prod_planning_type,
            procurement_method = ${finalProcMethod}::prod_procurement_method,
            buyer_group = ${buyer_group || purchasing_group || 'BUY-001'},
            costing_lot_size = ${costing_lot_size || 1},
            updated_at = NOW()
        `);

        // Quality view
        try {
          await db.execute(sql`
            INSERT INTO prod_quality_profile (item_id, facility_id, quality_control_key, inspection_type, is_quality_active)
            VALUES (${itemId}, ${fId}, ${quality_control_key || qm_control_key || 'QC-001'}, ${inspection_type || 'RECEIPT'}, ${finalIsQualityActive})
            ON CONFLICT (item_id, facility_id) DO UPDATE SET
              quality_control_key = ${quality_control_key || qm_control_key || 'QC-001'},
              is_quality_active = ${finalIsQualityActive}
          `);
        } catch {}
      }

      // Commercial view
      const finalCommercialOrg = commercial_org || sales_org;
      if (finalCommercialOrg) {
        try {
          const finalSalesChannel = sales_channel || distribution_channel || 'CH-10';
          const finalProductLine = product_line || division || 'PL-00';
          const delFacilityId = facilityIds.length > 0 ? facilityIds[0] : null;
          await db.execute(sql`
            INSERT INTO prod_commercial_profile (item_id, commercial_org, sales_channel, product_line, commercial_unit, tax_classification, account_assignment_group, item_category_group, fulfilling_facility_id)
            VALUES (${itemId}, ${finalCommercialOrg}, ${finalSalesChannel}, ${finalProductLine}, ${commercial_unit || sales_uom || finalBaseUnit}, ${tax_classification || 'FULL'}, ${account_assignment_group || '01'}, ${item_category_group || 'STANDARD'}, ${delFacilityId})
            ON CONFLICT (item_id, commercial_org, sales_channel, product_line) DO UPDATE SET
              commercial_unit = ${commercial_unit || sales_uom || finalBaseUnit},
              tax_classification = ${tax_classification || 'FULL'}
          `);
        } catch (e: any) {
          console.warn('Commercial view insert failed', e);
        }
      }

      // Classification view
      if (classifications && Array.isArray(classifications) && classifications.length > 0) {
        for (const cls of classifications) {
          try {
            await db.execute(sql`
              INSERT INTO prod_item_classification (item_id, class_type, class_name, characteristic, value)
              VALUES (${itemId}, ${cls.classType || 'BATCH'}, ${cls.className}, ${cls.characteristic}, ${cls.value})
            `);
          } catch {}
        }
      }

      // Audit log
      try {
        await db.execute(sql`
          INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description)
          VALUES (
            'prod_item', ${itemId}, ${finalItemNumber}, 'INSERT',
            ${JSON.stringify(body)}::jsonb, ${`Product CREATE EMTC – Legal-safe: ${finalItemNumber} ${description} Type ${finalType} (mapped from ${type}) BaseUnit ${finalBaseUnit} Views: Basic+Classification+Commercial+Facility+Quality+Accounting+Costing`}
          )
        `);
      } catch (e: any) {
        console.warn('Audit log failed:', e);
      }

      return NextResponse.json({ 
        success: true, 
        material: { id: itemId, item_number: finalItemNumber, material_number: finalItemNumber, description, type: finalType },
        item: { id: itemId, item_number: finalItemNumber, description, type: finalType },
        code: 'EMTC',
        aliasCodes: ['MTC', 'MM01', 'FND-MAT-CR'],
        message: `Product ${finalItemNumber} created with legal-safe own IP – EMTC – Type ${finalType} (mapped from ${type}) – Basic+Classification+Commercial+Facility+Quality+Accounting+Costing`,
        legalSafe: true,
        mapping: { oldType: type, newType: finalType, oldBaseUom: base_uom, newBaseUnit: finalBaseUnit }
      });

    } catch (newErr: any) {
      console.warn('New table insert failed, fallback to legacy:', newErr.message);
      // Fallback to old tables – keep backward compat
      let groupId = null;
      if (finalGroupCode) {
        const groupRes = await db.execute(sql`SELECT id FROM ent_material_group WHERE code = ${finalGroupCode} LIMIT 1`);
        if (groupRes.rows.length > 0) groupId = (groupRes.rows[0] as any).id;
      }

      const reqCompanyCode = (body.companyCode as string) || null;
      const reqPlantCode = (body.plantCode as string) || null;
      let plantIds: any[] = [];
      
      const legacyPlantCodes = facility_codes || plant_codes;
      if (legacyPlantCodes && Array.isArray(legacyPlantCodes) && legacyPlantCodes.length > 0) {
        for (const pc of legacyPlantCodes) {
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

      const oldType = mapTypeNewToOld(finalType);
      const oldPriceControl = finalPricingMethod === 'STANDARD' ? 'S' : 'V';
      const oldExpiry = finalLotControl === 'BLOCKED' ? 'BLOCK' : finalLotControl === 'WARN' ? 'WARNING' : 'RESTRICTED_USE';
      const oldMrpType = finalPlanningType === 'MRP' ? 'PD' : finalPlanningType === 'NO_PLANNING' ? 'ND' : finalPlanningType === 'MANUAL_REORDER' ? 'VB' : 'VM';
      const oldLotSize = finalLotSizing === 'LOT_FOR_LOT' ? 'EX' : finalLotSizing === 'FIXED' ? 'FX' : 'HB';
      const oldProcType = finalProcMethod === 'BUY' ? 'F' : finalProcMethod === 'MAKE' ? 'E' : 'X';

      const insertRes = await db.execute(sql`
        INSERT INTO ent_material_master (
          material_number, type, group_id, base_uom, description, description_long,
          is_batch_managed, shelf_life_days, expiry_control, 
          is_kit, is_phantom_kit, valuation_class, is_hazardous, landed_cost_relevance, is_active
        )
        VALUES (
          ${finalItemNumber}, ${oldType}::material_type, ${groupId}, ${finalBaseUnit}, ${description}, ${description_long || null},
          ${finalIsLotManaged}, ${shelf_life_days || 30}, ${oldExpiry}::expiry_control,
          ${is_kit || false}, ${is_phantom_kit || false}, ${mapTypeNewToOld(finalValuationClass) || (finalType === 'FINISHED' ? 'FERT' : 'ROH')}, ${is_hazardous || false}, ${finalLandedScope}::landed_cost_relevance, true
        )
        ON CONFLICT (material_number) DO UPDATE SET
          description = ${description},
          description_long = COALESCE(${description_long || null}, ent_material_master.description_long),
          type = ${oldType}::material_type,
          base_uom = ${finalBaseUnit},
          shelf_life_days = ${shelf_life_days || 30},
          valuation_class = ${mapTypeNewToOld(finalValuationClass) || (finalType === 'FINISHED' ? 'FERT' : 'ROH')}
        RETURNING id, material_number
      `);

      const materialId = (insertRes.rows[0] as any).id;

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
            ${materialId}, ${pId}, ${oldPriceControl}::price_control, ${moving_avg_price || 0}, ${standard_price || 0}, 0, 0,
            ${safety_stock || 0}, ${reorder_point || 0},
            ${oldMrpType}, ${planning_controller || mrp_controller || '001'}, ${oldLotSize}, ${min_lot_size || 0}, ${max_lot_size || 0}, ${fixed_lot_size || 0},
            ${oldProcType}, ${special_procurement_method || special_procurement || null},
            ${buyer_group || purchasing_group || '001'}, ${procurement_division || purchasing_org || '1000'},
            ${costing_lot_size || 1}, ${overhead_group || null},
            ${mapTypeNewToOld(finalValuationClass) || (finalType === 'FINISHED' ? 'FERT' : 'ROH')}, ${price_unit || 1},
            ${finalIsQualityActive}
          )
          ON CONFLICT (material_id, plant_id) DO UPDATE SET
            price_control = ${oldPriceControl}::price_control,
            safety_stock = ${safety_stock || 0},
            reorder_point = ${reorder_point || 0},
            mrp_type = ${oldMrpType},
            procurement_type = ${oldProcType},
            purchasing_group = ${buyer_group || purchasing_group || '001'},
            costing_lot_size = ${costing_lot_size || 1},
            updated_at = NOW()
        `);

        try {
          await db.execute(sql`
            INSERT INTO ent_material_quality (material_id, plant_id, qm_control_key, inspection_type, is_qm_active)
            VALUES (${materialId}, ${pId}, ${quality_control_key || qm_control_key || '0001'}, ${inspection_type || '01'}, ${finalIsQualityActive})
            ON CONFLICT (material_id, plant_id) DO UPDATE SET
              qm_control_key = ${quality_control_key || qm_control_key || '0001'},
              is_qm_active = ${finalIsQualityActive}
          `);
        } catch {}
      }

      if (sales_org || commercial_org) {
        try {
          const salesOrg = sales_org || commercial_org;
          const distChannel = distribution_channel || sales_channel || 'K1';
          const div = division || product_line || 'K1';
          const delPlantId = plantIds.length > 0 ? plantIds[0] : null;
          await db.execute(sql`
            INSERT INTO ent_material_sales (material_id, sales_org, distribution_channel, division, sales_uom, tax_classification, account_assignment_group, item_category_group, delivering_plant_id)
            VALUES (${materialId}, ${salesOrg}, ${distChannel}, ${div}, ${commercial_unit || sales_uom || finalBaseUnit}, ${tax_classification || '1'}, ${account_assignment_group || '01'}, ${item_category_group || 'NORM'}, ${delPlantId})
            ON CONFLICT (material_id, sales_org, distribution_channel, division) DO UPDATE SET
              sales_uom = ${commercial_unit || sales_uom || finalBaseUnit},
              tax_classification = ${tax_classification || '1'}
          `);
        } catch (e: any) {
          console.warn('Sales view insert failed', e);
        }
      }

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

      try {
        await db.execute(sql`
          INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description)
          VALUES (
            'ent_material_master', ${materialId}, ${finalItemNumber}, 'INSERT',
            ${JSON.stringify(body)}::jsonb, ${`Material CREATE MM01 ERP Views: ${finalItemNumber} ${description} Type ${oldType} (legal-safe ${finalType})`}
          )
        `);
      } catch {}

      return NextResponse.json({ 
        success: true, 
        material: { id: materialId, material_number: finalItemNumber, item_number: finalItemNumber, description, type: oldType },
        message: `Material ${finalItemNumber} created with legacy tables (migrating to prod_item) – Type ${oldType} (new ${finalType})`,
        code: 'EMTC',
        legalSafe: false,
        migrationNote: 'Created in legacy ent_material_master – will be migrated to prod_item'
      });
    }

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
    const { id, material_number, item_number, description, type, base_uom, base_unit, group_code, category_code, shelf_life_days, expiry_control, lot_control, is_kit, is_phantom_kit, valuation_class, inventory_valuation_class } = body;

    const finalItemNumber = item_number || material_number;
    if (!id && !finalItemNumber) {
      return NextResponse.json({ error: 'id or item_number (or material_number) required for update' }, { status: 400 });
    }

    // Try new table
    try {
      let existing: any = null;
      if (id) {
        const res = await db.execute(sql`SELECT * FROM prod_item WHERE id = ${id} LIMIT 1`);
        if (res.rows.length > 0) existing = res.rows[0];
      } else if (finalItemNumber) {
        const res = await db.execute(sql`SELECT * FROM prod_item WHERE item_number = ${finalItemNumber} LIMIT 1`);
        if (res.rows.length > 0) existing = res.rows[0];
      }

      if (existing) {
        let categoryId = existing.category_id;
        const finalGroupCode = category_code || group_code;
        if (finalGroupCode) {
          const groupRes = await db.execute(sql`SELECT id FROM prod_category WHERE code = ${finalGroupCode} LIMIT 1`);
          if (groupRes.rows.length > 0) categoryId = (groupRes.rows[0] as any).id;
        }

        const finalType = type ? mapTypeOldToNew(type) : existing.type;
        const finalBaseUnit = base_unit || base_uom || existing.base_unit;
        const finalLotControl = lot_control || expiry_control ? mapExpiryOldToNew(lot_control || expiry_control) : existing.lot_control;
        const finalValuationClass = inventory_valuation_class || valuation_class || existing.inventory_valuation_class;

        const updated = await db.execute(sql`
          UPDATE prod_item SET
            description = COALESCE(${description}, description),
            type = COALESCE(${finalType}::prod_item_type_enum, type),
            base_unit = COALESCE(${finalBaseUnit}, base_unit),
            category_id = COALESCE(${categoryId}, category_id),
            shelf_life_days = COALESCE(${shelf_life_days}, shelf_life_days),
            lot_control = COALESCE(${finalLotControl}::prod_lot_control, lot_control),
            is_kit = COALESCE(${is_kit}, is_kit),
            is_phantom_kit = COALESCE(${is_phantom_kit}, is_phantom_kit),
            inventory_valuation_class = COALESCE(${finalValuationClass}, inventory_valuation_class),
            updated_at = NOW()
          WHERE id = ${existing.id}
          RETURNING id, item_number, description, type
        `);

        try {
          await db.execute(sql`
            INSERT INTO audit_log (table_name, record_id, record_number, action, old_values, new_values, description)
            VALUES (
              'prod_item', ${existing.id}, ${existing.item_number}, 'UPDATE',
              ${JSON.stringify(existing)}::jsonb,
              ${JSON.stringify(body)}::jsonb,
              ${`Product CHANGE EMTE: ${existing.item_number} -> ${description || existing.description} old->new JSON`}
            )
          `);
        } catch {}

        return NextResponse.json({
          success: true,
          material: updated.rows[0],
          item: updated.rows[0],
          code: 'EMTE',
          message: `Product ${existing.item_number} updated successfully (EMTE) – legal-safe`,
        });
      }
    } catch (e: any) {
      console.warn('New table update failed, fallback legacy', e.message);
    }

    // Fallback legacy
    let existing: any = null;
    if (id) {
      const res = await db.execute(sql`SELECT * FROM ent_material_master WHERE id = ${id} LIMIT 1`);
      if (res.rows.length > 0) existing = res.rows[0];
    } else if (finalItemNumber) {
      const res = await db.execute(sql`SELECT * FROM ent_material_master WHERE material_number = ${finalItemNumber} LIMIT 1`);
      if (res.rows.length > 0) existing = res.rows[0];
    }

    if (!existing) {
      return NextResponse.json({ error: 'Material not found in prod_item nor ent_material_master' }, { status: 404 });
    }

    let groupId = existing.group_id;
    const finalGroupCode = category_code || group_code;
    if (finalGroupCode) {
      const groupRes = await db.execute(sql`SELECT id FROM ent_material_group WHERE code = ${finalGroupCode} LIMIT 1`);
      if (groupRes.rows.length > 0) groupId = (groupRes.rows[0] as any).id;
    }

    const finalOldType = type ? mapTypeNewToOld(mapTypeOldToNew(type)) : existing.type;

    const updated = await db.execute(sql`
      UPDATE ent_material_master SET
        description = COALESCE(${description}, description),
        type = COALESCE(${finalOldType}::material_type, type),
        base_uom = COALESCE(${base_unit || base_uom}, base_uom),
        group_id = COALESCE(${groupId}, group_id),
        shelf_life_days = COALESCE(${shelf_life_days}, shelf_life_days),
        expiry_control = COALESCE(${expiry_control ? (mapExpiryOldToNew(expiry_control) === 'BLOCKED' ? 'BLOCK' : mapExpiryOldToNew(expiry_control) === 'WARN' ? 'WARNING' : 'RESTRICTED_USE') : null}::expiry_control, expiry_control),
        is_kit = COALESCE(${is_kit}, is_kit),
        is_phantom_kit = COALESCE(${is_phantom_kit}, is_phantom_kit),
        valuation_class = COALESCE(${valuation_class || inventory_valuation_class}, valuation_class),
        updated_at = NOW()
      WHERE id = ${existing.id}
      RETURNING id, material_number, description, type
    `);

    try {
      await db.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, old_values, new_values, description)
        VALUES (
          'ent_material_master', ${existing.id}, ${existing.material_number}, 'UPDATE',
          ${JSON.stringify(existing)}::jsonb,
          ${JSON.stringify(body)}::jsonb,
          ${`Material CHANGE MM02: ${existing.material_number} -> ${description || existing.description} old_data->new_data JSON`}
        )
      `);
    } catch {}

    return NextResponse.json({
      success: true,
      material: updated.rows[0],
      code: 'EMTE',
      aliasCodes: ['MTE', 'MM02'],
      message: `Material ${existing.material_number} updated successfully (MM02 legacy, EMTE new)`,
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
    const material_number = searchParams.get('material_number') || searchParams.get('item_number');
    const id = searchParams.get('id');
    if (!material_number && !id) return NextResponse.json({ error: 'material_number or item_number or id required' }, { status: 400 });

    // Try new table first
    try {
      let itemId = id;
      let itemNum = material_number;
      if (!itemId && itemNum) {
        const r = await db.execute(sql`SELECT id, item_number FROM prod_item WHERE item_number = ${itemNum} LIMIT 1`);
        if (r.rows.length > 0) { itemId = (r.rows[0] as any).id; itemNum = (r.rows[0] as any).item_number; }
      }

      if (itemId) {
        let stockCount = 0, prCount = 0, poCount = 0, grCount = 0, bomCount = 0;
        try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_stock WHERE material_id = ${itemId}`); stockCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
        try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_pr_line WHERE material_id = ${itemId}`); prCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
        try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_po_line WHERE material_id = ${itemId}`); poCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
        try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_gr_line WHERE material_id = ${itemId}`); grCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
        try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM pp_bom_line WHERE component_material_id = ${itemId}`); bomCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
        // Also check new tables
        try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM inv_stock WHERE item_id = ${itemId}`); stockCount += parseInt((r.rows[0] as any).cnt || '0'); } catch {}
        try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM inv_lot WHERE item_id = ${itemId}`); stockCount += parseInt((r.rows[0] as any).cnt || '0'); } catch {}

        if (stockCount > 0 || prCount > 0 || poCount > 0 || grCount > 0 || bomCount > 0) {
          await db.execute(sql`UPDATE prod_item SET is_active = false WHERE id = ${itemId}`);
          return NextResponse.json({
            success: true,
            softDeleted: true,
            code: 'EMTE',
            message: `Product ${itemNum} has transactions and cannot be deleted to maintain audit trail – Stock:${stockCount} PR:${prCount} PO:${poCount} GR:${grCount} BOM:${bomCount} – hard delete BLOCKED for security/audit. Soft deleted (is_active=false) instead.`,
          });
        }

        await db.execute(sql`DELETE FROM prod_facility_profile WHERE item_id = ${itemId}`).catch(()=>{});
        await db.execute(sql`DELETE FROM prod_commercial_profile WHERE item_id = ${itemId}`).catch(()=>{});
        await db.execute(sql`DELETE FROM prod_item_classification WHERE item_id = ${itemId}`).catch(()=>{});
        await db.execute(sql`DELETE FROM prod_quality_profile WHERE item_id = ${itemId}`).catch(()=>{});
        await db.execute(sql`DELETE FROM inv_lot WHERE item_id = ${itemId}`).catch(()=>{});
        await db.execute(sql`DELETE FROM prod_item WHERE id = ${itemId}`);

        return NextResponse.json({ success: true, code: 'EMTE', message: `Product ${itemNum || itemId} deleted – legal-safe prod_item – only allowed when no transactions` });
      }
    } catch (e: any) {
      console.warn('New table delete failed, fallback legacy', e.message);
    }

    // Fallback legacy
    let matId = id;
    let matNum = material_number;
    if (!matId && matNum) {
      const r = await db.execute(sql`SELECT id, material_number FROM ent_material_master WHERE material_number = ${matNum} LIMIT 1`);
      if (r.rows.length > 0) { matId = (r.rows[0] as any).id; matNum = (r.rows[0] as any).material_number; }
    }

    if (!matId) return NextResponse.json({ error: 'Material not found' }, { status: 404 });

    let stockCount = 0, prCount = 0, poCount = 0, grCount = 0, bomCount = 0;
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_stock WHERE material_id = ${matId}`); stockCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_pr_line WHERE material_id = ${matId}`); prCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_po_line WHERE material_id = ${matId}`); poCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_gr_line WHERE material_id = ${matId}`); grCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM pp_bom_line WHERE component_material_id = ${matId}`); bomCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}

    if (stockCount > 0 || prCount > 0 || poCount > 0 || grCount > 0 || bomCount > 0) {
      await db.execute(sql`UPDATE ent_material_master SET is_active = false WHERE id = ${matId}`);
      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: `Material ${matNum} has transactions and cannot be deleted to maintain audit trail – Stock:${stockCount} PR:${prCount} PO:${poCount} GR:${grCount} BOM:${bomCount} – hard delete BLOCKED for security/audit. Soft deleted (is_active=false) instead.`,
      });
    }

    await db.execute(sql`DELETE FROM ent_material_plant WHERE material_id = ${matId}`).catch(()=>{});
    await db.execute(sql`DELETE FROM ent_material_master WHERE id = ${matId}`);

    return NextResponse.json({ success: true, message: `Material ${matNum || matId} deleted – only allowed when no transactions` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
