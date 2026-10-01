import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
  // Enterprise auth guard - secure by default, MVP open only if MVP_NO_AUTH=true
  const authCheck = await requireApiAuth();
  if (authCheck) return authCheck;

  try {
    const matRes = await db.execute(sql`SELECT COUNT(*) as count FROM prod_item WHERE material_number LIKE 'FMCG-%'`);
    const vendorRes = await db.execute(sql`SELECT COUNT(*) as count FROM partner_account WHERE bp_number LIKE 'BP-V-10%'`);
    const customerRes = await db.execute(sql`SELECT COUNT(*) as count FROM partner_account WHERE bp_number LIKE 'BP-C-20%'`);
    const stockRes = await db.execute(sql`SELECT COUNT(*) as count FROM inv_stock WHERE material_id IN (SELECT id FROM prod_item WHERE material_number LIKE 'FMCG-%')`);

    return NextResponse.json({
      enabled: (matRes.rows[0] as any).count > 0,
      counts: {
        materials: (matRes.rows[0] as any).count,
        vendors: (vendorRes.rows[0] as any).count,
        customers: (customerRes.rows[0] as any).count,
        stockBatches: (stockRes.rows[0] as any).count,
      },
      description: 'FMCG Sample Data for small production company - biscuits, chips, juice',
      materials: [
        'FMCG-ROH-001 Wheat Flour Premium 25kg',
        'FMCG-ROH-002 White Sugar Refined 50kg',
        'FMCG-ROH-003 Palm Oil RBD',
        'FMCG-ROH-004 Milk Powder Full Fat',
        'FMCG-ROH-005 Cocoa Powder',
        'FMCG-PACK-001 BOPP Film Biscuit 100g',
        'FMCG-KIT-001 Biscuit Dough Mix Chocolate 10kg',
        'FMCG-FERT-001 Chocolate Biscuit Pack 100g',
        'FMCG-FERT-003 Potato Chips Tomato 50g',
      ],
    });
  } catch (e: any) {
    return NextResponse.json({ enabled: false, error: e.message, counts: { materials: 0 } });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { enabled } = body;

    if (enabled) {
      // Dynamically import and run FMCG seed
      const { seedFmcg } = await import('@/shared/kernel/db/seedFmcg');
      await seedFmcg();
      return NextResponse.json({ success: true, message: 'FMCG sample data enabled - 23 materials, 5 vendors, 4 customers, 2 BOMs, 5 stock batches created' });
    } else {
      // Disable - delete FMCG data
      await db.execute(sql`DELETE FROM inv_stock WHERE material_id IN (SELECT id FROM prod_item WHERE material_number LIKE 'FMCG-%')`);
      await db.execute(sql`DELETE FROM inv_lot WHERE batch_number LIKE 'B-FMCG-%'`);
      await db.execute(sql`DELETE FROM mfg_bom_line WHERE bom_header_id IN (SELECT id FROM mfg_bom_header WHERE bom_number LIKE 'BOM-FMCG-%')`);
      await db.execute(sql`DELETE FROM mfg_bom_header WHERE bom_number LIKE 'BOM-FMCG-%'`);
      await db.execute(sql`DELETE FROM prod_item_plant WHERE material_id IN (SELECT id FROM prod_item WHERE material_number LIKE 'FMCG-%')`);
      await db.execute(sql`DELETE FROM prod_item WHERE material_number LIKE 'FMCG-%'`);
      await db.execute(sql`DELETE FROM partner_account WHERE bp_number LIKE 'BP-V-10%' OR bp_number LIKE 'BP-C-20%'`);

      return NextResponse.json({ success: true, message: 'FMCG sample data disabled - deleted' });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE() {
  // Enterprise auth guard - secure by default, MVP open only if MVP_NO_AUTH=true
  const authCheck = await requireApiAuth();
  if (authCheck) return authCheck;

  // Same as disable
  try {
    const { db } = await import('@/shared/kernel/db/client');
    const { sql } = await import('drizzle-orm');
    await db.execute(sql`DELETE FROM inv_stock WHERE material_id IN (SELECT id FROM prod_item WHERE material_number LIKE 'FMCG-%')`);
    await db.execute(sql`DELETE FROM inv_lot WHERE batch_number LIKE 'B-FMCG-%'`);
    await db.execute(sql`DELETE FROM mfg_bom_line WHERE bom_header_id IN (SELECT id FROM mfg_bom_header WHERE bom_number LIKE 'BOM-FMCG-%')`);
    await db.execute(sql`DELETE FROM mfg_bom_header WHERE bom_number LIKE 'BOM-FMCG-%'`);
    await db.execute(sql`DELETE FROM prod_item_plant WHERE material_id IN (SELECT id FROM prod_item WHERE material_number LIKE 'FMCG-%')`);
    await db.execute(sql`DELETE FROM prod_item WHERE material_number LIKE 'FMCG-%'`);
    await db.execute(sql`DELETE FROM partner_account WHERE bp_number LIKE 'BP-V-10%' OR bp_number LIKE 'BP-C-20%'`);
    return NextResponse.json({ success: true, message: 'FMCG sample data deleted' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
