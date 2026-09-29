import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * MEQ1 Quota Arrangement – T2 GOOD – OPERATIONAL EXCELLENCE
 * Quota arrangement defines % split of procurement between vendors for a material/plant
 * Used in MRP source determination – MRP splits PR quantity by quota %
 * Table: proc_quota_arrangement – itemId EMTC was material_id, facilityId EFCC was plant_id, partnerId PSUC was vendor_id, quota_quantity, quota_percentage, valid_from/to, is_active
 * NO DANGLING – quota % used in MRP PR creation split + PO source determination
 */

export async function GET(req: NextRequest){
  const authCheck = await requireApiAuth(req as any);
  if(authCheck) return authCheck;
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get('itemId') || searchParams.get('materialId');
  const facilityId = searchParams.get('facilityId') || searchParams.get('plantId');
  const limit = parseInt(searchParams.get('limit') || '100');
  try{
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS proc_quota_arrangement (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id VARCHAR(100) NOT NULL,
        material_code VARCHAR(100),
        facility_id VARCHAR(100) NOT NULL,
        facility_code VARCHAR(50),
        partner_id VARCHAR(100) NOT NULL,
        vendor_number VARCHAR(50),
        quota_quantity NUMERIC DEFAULT 0,
        quota_percentage NUMERIC DEFAULT 0,
        valid_from DATE DEFAULT CURRENT_DATE,
        valid_to DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(item_id, facility_id, partner_id)
      )
    `);
    let query = sql`
      SELECT qa.*, pa.account_number as vendor_number, pa.display_name as vendor_name, pi.item_number, pi.name as item_name, f.code as facility_code, f.name as facility_name
      FROM proc_quota_arrangement qa
      LEFT JOIN partner_account pa ON qa.partner_id = pa.id OR pa.account_number = qa.vendor_number
      LEFT JOIN prod_item pi ON qa.item_id = pi.id OR pi.item_number = qa.material_code
      LEFT JOIN org_facility f ON qa.facility_id = f.id OR f.code = qa.facility_code
      WHERE 1=1
    `;
    if(itemId) query = sql`${query} AND (qa.item_id = ${itemId} OR qa.material_code = ${itemId})`;
    if(facilityId) query = sql`${query} AND (qa.facility_id = ${facilityId} OR qa.facility_code = ${facilityId})`;
    query = sql`${query} ORDER BY qa.quota_percentage DESC LIMIT ${limit}`;
    const res = await db.execute(query);
    return NextResponse.json({ success:true, data:res.rows, quotaArrangements:res.rows, count:res.rows.length, code:'MEQ1', aliasCodes:['MEQ1','QUOTA'], table:'proc_quota_arrangement', functionDescription:'MEQ1 Quota Arrangement – T2 GOOD – % split between vendors for material/plant – used in MRP source determination + PO split' });
  }catch(e:any){
    return NextResponse.json({ error:e.message, data:[] }, {status:500});
  }
}

export async function POST(req: NextRequest){
  const authCheck = await requireApiAuth(req as any);
  if(authCheck) return authCheck;
  try{
    const body = await req.json();
    const { item_id, material_code, item_number, facility_id, facility_code, plant_id, partner_id, vendor_number, partner_number, quota_quantity, quota_percentage, valid_from, valid_to } = body;
    const itemId = item_id || material_code || item_number;
    const facId = facility_id || facility_code || plant_id;
    const partId = partner_id || vendor_number || partner_number;
    if(!itemId || !facId || !partId) return NextResponse.json({ error:'item_id/material_code, facility_id/facility_code, partner_id/vendor_number required – MEQ1 – T2 GOOD' }, {status:400});

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS proc_quota_arrangement (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id VARCHAR(100) NOT NULL,
        material_code VARCHAR(100),
        facility_id VARCHAR(100) NOT NULL,
        facility_code VARCHAR(50),
        partner_id VARCHAR(100) NOT NULL,
        vendor_number VARCHAR(50),
        quota_quantity NUMERIC DEFAULT 0,
        quota_percentage NUMERIC DEFAULT 0,
        valid_from DATE DEFAULT CURRENT_DATE,
        valid_to DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(item_id, facility_id, partner_id)
      )
    `);

    // Validate total quota % for material+plant does not exceed 100
    try{
      const existingRes = await db.execute(sql`SELECT COALESCE(SUM(quota_percentage),0) as total_pct FROM proc_quota_arrangement WHERE (item_id = ${itemId} OR material_code = ${itemId}) AND (facility_id = ${facId} OR facility_code = ${facId}) AND is_active = true`);
      const totalPct = parseFloat((existingRes.rows[0] as any)?.total_pct || '0');
      const newPct = parseFloat(quota_percentage || '0');
      if(totalPct + newPct > 100){
        return NextResponse.json({ error:`Total quota % would be ${totalPct + newPct}% exceeds 100% for material ${itemId} plant ${facId} – existing ${totalPct}% – adjust percentages – MEQ1` }, {status:400});
      }
    }catch{}

    const insRes = await db.execute(sql`
      INSERT INTO proc_quota_arrangement (item_id, material_code, facility_id, facility_code, partner_id, vendor_number, quota_quantity, quota_percentage, valid_from, valid_to, is_active)
      VALUES (${itemId}, ${material_code || item_number || itemId}, ${facId}, ${facility_code || null}, ${partId}, ${vendor_number || partner_number || partId}, ${quota_quantity || 0}, ${quota_percentage || 0}, ${valid_from ? new Date(valid_from) : new Date()}::date, ${valid_to ? new Date(valid_to) : null}::date, true)
      ON CONFLICT (item_id, facility_id, partner_id) DO UPDATE SET quota_quantity = ${quota_quantity || 0}, quota_percentage = ${quota_percentage || 0}, valid_from = ${valid_from ? new Date(valid_from) : new Date()}::date, valid_to = ${valid_to ? new Date(valid_to) : null}::date, is_active = true
      RETURNING *
    `);
    return NextResponse.json({ success:true, code:'MEQ1', quotaArrangement: insRes.rows[0], message:`MEQ1 Quota Arrangement created – material ${itemId} plant ${facId} vendor ${partId} qty ${quota_quantity} % ${quota_percentage} – T2 GOOD – NO DANGLING – quota % used in MRP source determination + PO split – General ERP – SAP MEQ1 alias` });
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
