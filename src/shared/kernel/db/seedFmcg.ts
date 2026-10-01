/**
 * FMCG Sample Data for Small Production Company
 * Toggleable sample data - realistic FMCG materials, BOMs, vendors, customers
 * 
 * Usage:
 *   npm run db:seed:fmcg  (loads FMCG sample)
 *   Or via API: POST /api/seed/fmcg with {enabled: true}
 *   Or via UI toggle in dashboard
 */

import { db } from './client';
import { sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

export async function seedFmcg() {
  console.log('🏭 Starting FMCG Sample Data seed for small production company...');

  const clientRes = await db.execute(sql`SELECT id FROM core_tenant WHERE code = '100'`);
  const companyRes = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code = '1000'`);
  if (clientRes.rows.length === 0 || companyRes.rows.length === 0) {
    console.log('❌ Run db:push and init-prod first');
    return;
  }
  const companyCodeId = (companyRes.rows[0] as any).id;
  const plantRes = await db.execute(sql`SELECT id FROM org_facility WHERE code = '1000'`);
  const plantId = plantRes.rows.length > 0 ? (plantRes.rows[0] as any).id : null;
  if (!plantId) {
    console.log('❌ Plant 1000 not found, run init-prod first');
    return;
  }

  const slocRes = await db.execute(sql`SELECT id, code FROM org_inventory_location WHERE plant_id = ${plantId}`);
  const mainSloc = slocRes.rows.find((r: any) => r.code === '0001') as any;
  const coldSloc = slocRes.rows.find((r: any) => r.code === '0002') as any;
  const mainSlocId = mainSloc?.id || (slocRes.rows[0] as any)?.id;

  const groupRes = await db.execute(sql`SELECT id, code FROM prod_category`);
  const foodGroup = groupRes.rows.find((r: any) => r.code === 'FOOD') as any;
  const menuGroup = groupRes.rows.find((r: any) => r.code === 'MENU') as any;
  const kitsGroup = groupRes.rows.find((r: any) => r.code === 'KITS') as any;
  const packGroup = groupRes.rows.find((r: any) => r.code === 'PACK') as any;

  const foodGroupId = foodGroup?.id;
  const menuGroupId = menuGroup?.id;
  const kitsGroupId = kitsGroup?.id;
  const packGroupId = packGroup?.id || foodGroupId;

  // 1. FMCG Vendors
  console.log('📦 Creating FMCG vendors...');
  const vendors = [
    { num: 'BP-V-1001', name: 'Al Ghurair Foods - Flour & Grains', city: 'Dubai', type: 'FLOUR' },
    { num: 'BP-V-1002', name: 'Savola - Edible Oils & Sugar', city: 'Jeddah', type: 'OIL_SUGAR' },
    { num: 'BP-V-1003', name: 'Tetra Pak - Packaging Solutions', city: 'Dubai', type: 'PACKAGING' },
    { num: 'BP-V-1004', name: 'Fonterra - Dairy & Milk Powder', city: 'Auckland', type: 'DAIRY' },
    { num: 'BP-V-1005', name: 'Cargill - Cocoa & Ingredients', city: 'Singapore', type: 'COCOA' },
  ];

  for (const v of vendors) {
    await db.execute(sql`
      INSERT INTO partner_account (bp_number, name1, role, address)
      VALUES (${v.num}, ${v.name}, 'VENDOR', ${v.city})
      ON CONFLICT (bp_number) DO UPDATE SET name1 = ${v.name}, address = ${v.city}
    `);
  }

  // 2. FMCG Customers (B2B)
  console.log('🛒 Creating FMCG customers...');
  const customers = [
    { num: 'BP-C-2001', name: 'Carrefour Kuwait - Supermarket Chain', city: 'Kuwait City' },
    { num: 'BP-C-2002', name: 'Lulu Hypermarket - GCC', city: 'Kuwait City' },
    { num: 'BP-C-2003', name: 'Sultan Center - Retail', city: 'Kuwait City' },
    { num: 'BP-C-2004', name: 'Talabat - E-commerce Delivery', city: 'Kuwait City' },
  ];

  for (const c of customers) {
    await db.execute(sql`
      INSERT INTO partner_account (bp_number, name1, role, address)
      VALUES (${c.num}, ${c.name}, 'CUSTOMER', ${c.city})
      ON CONFLICT (bp_number) DO UPDATE SET name1 = ${c.name}
    `);
  }

  // 3. FMCG Materials - Realistic small production company
  console.log('🧱 Creating FMCG materials...');
  const fmcgMaterials = [
    // ROH - Raw Materials
    { num: 'FMCG-ROH-001', desc: 'Wheat Flour Premium - 25kg Bag', type: 'ROH', uom: 'KG', group: foodGroupId, shelf: 180, expiry: 'WARNING', val: 'ROH', price: '0.450' },
    { num: 'FMCG-ROH-002', desc: 'White Sugar Refined - 50kg', type: 'ROH', uom: 'KG', group: foodGroupId, shelf: 365, expiry: 'WARNING', val: 'ROH', price: '0.550' },
    { num: 'FMCG-ROH-003', desc: 'Palm Oil RBD - Edible', type: 'ROH', uom: 'L', group: foodGroupId, shelf: 180, expiry: 'BLOCK', val: 'ROH', price: '1.200' },
    { num: 'FMCG-ROH-004', desc: 'Milk Powder Full Fat - 25kg', type: 'ROH', uom: 'KG', group: foodGroupId, shelf: 365, expiry: 'BLOCK', val: 'ROH', price: '3.500' },
    { num: 'FMCG-ROH-005', desc: 'Cocoa Powder Natural', type: 'ROH', uom: 'KG', group: foodGroupId, shelf: 365, expiry: 'WARNING', val: 'ROH', price: '4.200' },
    { num: 'FMCG-ROH-006', desc: 'Salt Iodized Fine', type: 'ROH', uom: 'KG', group: foodGroupId, shelf: 730, expiry: 'WARNING', val: 'ROH', price: '0.200' },
    { num: 'FMCG-ROH-007', desc: 'Baking Powder - 10kg', type: 'ROH', uom: 'KG', group: foodGroupId, shelf: 365, expiry: 'WARNING', val: 'ROH', price: '2.100' },
    { num: 'FMCG-ROH-008', desc: 'Vanilla Flavor - Liquid', type: 'ROH', uom: 'L', group: foodGroupId, shelf: 365, expiry: 'WARNING', val: 'ROH', price: '8.500' },
    { num: 'FMCG-ROH-009', desc: 'Potato Flakes - Dehydrated', type: 'ROH', uom: 'KG', group: foodGroupId, shelf: 180, expiry: 'BLOCK', val: 'ROH', price: '1.800' },
    { num: 'FMCG-ROH-010', desc: 'Tomato Powder - Spray Dried', type: 'ROH', uom: 'KG', group: foodGroupId, shelf: 180, expiry: 'BLOCK', val: 'ROH', price: '3.200' },
    // Packaging
    { num: 'FMCG-PACK-001', desc: 'BOPP Film Printed - Biscuit Pack 100g', type: 'ROH', uom: 'KG', group: packGroupId, shelf: 365, expiry: 'WARNING', val: 'ROH', price: '2.800' },
    { num: 'FMCG-PACK-002', desc: 'Carton Box - 12x100g Biscuits', type: 'ROH', uom: 'PC', group: packGroupId, shelf: 365, expiry: 'WARNING', val: 'ROH', price: '0.150' },
    { num: 'FMCG-PACK-003', desc: 'Laminated Pouch - Chips 50g', type: 'ROH', uom: 'PC', group: packGroupId, shelf: 365, expiry: 'WARNING', val: 'ROH', price: '0.035' },
    { num: 'FMCG-PACK-004', desc: 'PET Bottle - Juice 250ml', type: 'ROH', uom: 'PC', group: packGroupId, shelf: 365, expiry: 'WARNING', val: 'ROH', price: '0.080' },
    // Kits (sub-assemblies)
    { num: 'FMCG-KIT-001', desc: 'Biscuit Dough Mix - Chocolate - 10kg Batch', type: 'ROH', uom: 'KG', group: kitsGroupId, shelf: 2, expiry: 'BLOCK', val: 'KITS', price: '1.850', is_kit: true },
    { num: 'FMCG-KIT-002', desc: 'Seasoning Mix - Tomato - 5kg', type: 'ROH', uom: 'KG', group: kitsGroupId, shelf: 30, expiry: 'WARNING', val: 'KITS', price: '4.500', is_kit: true },
    { num: 'FMCG-KIT-003', desc: 'Chips Base - Unseasoned - 20kg', type: 'ROH', uom: 'KG', group: kitsGroupId, shelf: 7, expiry: 'BLOCK', val: 'KITS', price: '1.200', is_kit: true },
    // FERT - Finished Goods
    { num: 'FMCG-FERT-001', desc: 'Chocolate Biscuit Pack - 100g - 12pcs Carton', type: 'FERT', uom: 'PC', group: menuGroupId, shelf: 180, expiry: 'BLOCK', val: 'FERT', price: '0.350' },
    { num: 'FMCG-FERT-002', desc: 'Vanilla Biscuit Pack - 100g', type: 'FERT', uom: 'PC', group: menuGroupId, shelf: 180, expiry: 'BLOCK', val: 'FERT', price: '0.320' },
    { num: 'FMCG-FERT-003', desc: 'Potato Chips Tomato - 50g Pouch', type: 'FERT', uom: 'PC', group: menuGroupId, shelf: 120, expiry: 'BLOCK', val: 'FERT', price: '0.250' },
    { num: 'FMCG-FERT-004', desc: 'Potato Chips Salted - 50g', type: 'FERT', uom: 'PC', group: menuGroupId, shelf: 120, expiry: 'BLOCK', val: 'FERT', price: '0.230' },
    { num: 'FMCG-FERT-005', desc: 'Mango Juice Bottle - 250ml', type: 'FERT', uom: 'PC', group: menuGroupId, shelf: 90, expiry: 'BLOCK', val: 'FERT', price: '0.300' },
    { num: 'FMCG-FERT-006', desc: 'Mixed Biscuit Family Pack - 500g', type: 'FERT', uom: 'PC', group: menuGroupId, shelf: 180, expiry: 'BLOCK', val: 'FERT', price: '1.500', is_kit: true },
  ];

  for (const m of fmcgMaterials) {
    await db.execute(sql`
      INSERT INTO prod_item (
        material_number, type, group_id, base_uom, description,
        is_batch_managed, shelf_life_days, expiry_control,
        is_kit, is_phantom_kit, valuation_class, is_active
      )
      VALUES (
        ${m.num}, ${m.type}, ${m.group}, ${m.uom}, ${m.desc},
        true, ${m.shelf}, ${m.expiry},
        ${(m as any).is_kit || false}, false, ${m.val}, true
      )
      ON CONFLICT (material_number) DO UPDATE SET
        description = ${m.desc},
        type = ${m.type},
        shelf_life_days = ${m.shelf}
    `);
  }

  // Create material_plant extensions with MAP - prod_item_plant has no is_active, only is_qm_active
  const matRes = await db.execute(sql`SELECT id, material_number, type FROM prod_item WHERE material_number LIKE 'FMCG-%'`);
  for (const mat of matRes.rows as any[]) {
    const fmcgMat = fmcgMaterials.find(f => f.num === mat.material_number);
    const mapPrice = fmcgMat ? parseFloat(fmcgMat.price) : 1.0;
    await db.execute(sql`
      INSERT INTO prod_item_plant (material_id, plant_id, price_control, moving_avg_price, standard_price, total_stock_qty, total_stock_value)
      VALUES (${mat.id}, ${plantId}, ${mat.type === 'FERT' ? 'S' : 'V'}, ${mapPrice}, ${mapPrice}, 0, 0)
      ON CONFLICT (material_id, plant_id) DO NOTHING
    `);
  }

  // 4. BOMs for FMCG
  console.log('📋 Creating FMCG BOMs...');
  // Biscuit Dough Mix Kit
  const doughMixId = (await db.execute(sql`SELECT id FROM prod_item WHERE material_number = 'FMCG-KIT-001'`)).rows[0] as any;
  const flourId = (await db.execute(sql`SELECT id FROM prod_item WHERE material_number = 'FMCG-ROH-001'`)).rows[0] as any;
  const sugarId = (await db.execute(sql`SELECT id FROM prod_item WHERE material_number = 'FMCG-ROH-002'`)).rows[0] as any;
  const oilId = (await db.execute(sql`SELECT id FROM prod_item WHERE material_number = 'FMCG-ROH-003'`)).rows[0] as any;
  const milkId = (await db.execute(sql`SELECT id FROM prod_item WHERE material_number = 'FMCG-ROH-004'`)).rows[0] as any;
  const cocoaId = (await db.execute(sql`SELECT id FROM prod_item WHERE material_number = 'FMCG-ROH-005'`)).rows[0] as any;

  if (doughMixId && flourId) {
    await db.execute(sql`
      INSERT INTO mfg_bom_header (bom_number, material_id, plant_id, type, status, base_quantity, base_uom, is_kit, is_phantom)
      VALUES ('BOM-FMCG-DOUGH', ${doughMixId.id}, ${plantId}, 'KIT_STOCKED', 'ACTIVE', 10, 'KG', true, false)
      ON CONFLICT (bom_number) DO NOTHING
    `);
    const bomRes = await db.execute(sql`SELECT id FROM mfg_bom_header WHERE bom_number = 'BOM-FMCG-DOUGH'`);
    if (bomRes.rows.length > 0) {
      const bomId = (bomRes.rows[0] as any).id;
      await db.execute(sql`DELETE FROM mfg_bom_line WHERE bom_header_id = ${bomId}`);
      await db.execute(sql`
        INSERT INTO mfg_bom_line (bom_header_id, line_number, component_material_id, quantity, uom, is_batch_tracked)
        VALUES
          (${bomId}, 10, ${flourId.id}, 6, 'KG', true),
          (${bomId}, 20, ${sugarId.id}, 2, 'KG', true),
          (${bomId}, 30, ${oilId.id}, 1.5, 'L', true),
          (${bomId}, 40, ${milkId.id}, 0.3, 'KG', true),
          (${bomId}, 50, ${cocoaId.id}, 0.2, 'KG', true)
      `);
    }
  }

  // Chocolate Biscuit FERT BOM
  const chocBiscuitId = (await db.execute(sql`SELECT id FROM prod_item WHERE material_number = 'FMCG-FERT-001'`)).rows[0] as any;
  const packFilmId = (await db.execute(sql`SELECT id FROM prod_item WHERE material_number = 'FMCG-PACK-001'`)).rows[0] as any;
  
  if (chocBiscuitId && doughMixId) {
    await db.execute(sql`
      INSERT INTO mfg_bom_header (bom_number, material_id, plant_id, type, status, base_quantity, base_uom, is_kit, is_phantom)
      VALUES ('BOM-FMCG-CHOC', ${chocBiscuitId.id}, ${plantId}, 'STANDARD', 'ACTIVE', 100, 'PC', false, false)
      ON CONFLICT (bom_number) DO NOTHING
    `);
    const bomRes = await db.execute(sql`SELECT id FROM mfg_bom_header WHERE bom_number = 'BOM-FMCG-CHOC'`);
    if (bomRes.rows.length > 0) {
      const bomId = (bomRes.rows[0] as any).id;
      await db.execute(sql`DELETE FROM mfg_bom_line WHERE bom_header_id = ${bomId}`);
      await db.execute(sql`
        INSERT INTO mfg_bom_line (bom_header_id, line_number, component_material_id, quantity, uom, is_batch_tracked, is_phantom_explode)
        VALUES
          (${bomId}, 10, ${doughMixId.id}, 8, 'KG', true, true),
          (${bomId}, 20, ${packFilmId.id}, 0.1, 'KG', true, false)
      `);
    }
  }

  // 5. Initial Stock for FMCG (some raw materials in stock)
  console.log('📦 Creating initial FMCG stock...');
  const stockMaterials = [
    { num: 'FMCG-ROH-001', qty: 500, batch: 'B-FMCG-001', expiryDays: 150 },
    { num: 'FMCG-ROH-002', qty: 300, batch: 'B-FMCG-002', expiryDays: 300 },
    { num: 'FMCG-ROH-003', qty: 200, batch: 'B-FMCG-003', expiryDays: 120 },
    { num: 'FMCG-FERT-001', qty: 1000, batch: 'B-FMCG-FERT-001', expiryDays: 150 },
    { num: 'FMCG-FERT-003', qty: 800, batch: 'B-FMCG-FERT-003', expiryDays: 90 },
  ];

  for (const s of stockMaterials) {
    const matRes = await db.execute(sql`SELECT id FROM prod_item WHERE material_number = ${s.num}`);
    if (matRes.rows.length === 0) continue;
    const matId = (matRes.rows[0] as any).id;
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + s.expiryDays);
    
    // Create batch - inv_lot has no is_active column
    await db.execute(sql`
      INSERT INTO inv_lot (batch_number, material_id, plant_id, expiry_date, is_expired)
      VALUES (${s.batch}, ${matId}, ${plantId}, ${expiryDate}, false)
      ON CONFLICT (batch_number, material_id, plant_id) DO NOTHING
    `);
    
    const batchRes = await db.execute(sql`SELECT id FROM inv_lot WHERE batch_number = ${s.batch} AND material_id = ${matId} AND plant_id = ${plantId}`);
    const batchId = batchRes.rows.length > 0 ? (batchRes.rows[0] as any).id : null;
    
    if (batchId && mainSlocId) {
      await db.execute(sql`
        INSERT INTO inv_stock (material_id, plant_id, sloc_id, batch_id, stock_status, quantity, reserved_qty)
        VALUES (${matId}, ${plantId}, ${mainSlocId}, ${batchId}, 'UNRESTRICTED', ${s.qty}, 0)
        ON CONFLICT (material_id, plant_id, sloc_id, batch_id, stock_status) DO NOTHING
      `);
    }
  }

  console.log('');
  console.log('✅ FMCG Sample Data seeded successfully!');
  console.log(`   Vendors: ${vendors.length} (Flour, Oil, Packaging, Dairy, Cocoa)`);
  console.log(`   Customers: ${customers.length} (Carrefour, Lulu, Sultan, Talabat)`);
  console.log(`   Materials: ${fmcgMaterials.length} (10 ROH raw, 4 PACK, 3 KIT sub-assemblies, 6 FERT finished)`);
  console.log(`   BOMs: 2 (Dough Mix + Chocolate Biscuit with phantom explode)`);
  console.log(`   Stock: ${stockMaterials.length} batches with expiry`);
  console.log('');
  console.log('   FMCG Company Profile: Small production company making biscuits, chips, juice');
  console.log('   - Raw: Flour, Sugar, Oil, Milk Powder, Cocoa, Salt, Baking Powder, Vanilla, Potato Flakes');
  console.log('   - Pack: BOPP Film, Carton Box, Pouch, PET Bottle');
  console.log('   - Kits: Dough Mix Chocolate 10kg, Seasoning Tomato 5kg, Chips Base 20kg');
  console.log('   - Finished: Chocolate Biscuit 100g, Vanilla Biscuit 100g, Chips Tomato 50g, Chips Salted 50g, Mango Juice 250ml, Family Pack 500g');
  console.log('');
}

if (require.main === module) {
  seedFmcg().catch(console.error);
}
