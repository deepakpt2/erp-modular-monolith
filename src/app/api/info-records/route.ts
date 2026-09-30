import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Info Records API – Legal-safe own IP – Module 6 MM Procurement – NEW
 * New: proc_info_record (was none) – infoRecordNumber PIR-1000001, partnerId PSUC was vendor_id, itemId EMTC was material_id, facilityId EFCC was plant_id, validFrom/To, unitPrice, currencyCode INR default, uomCode EUOC, leadTimeDays, minOrderQty MOQ
 * Helper code: PIRC Info Record Create (alias IRC, ME11, FIN-IR-CR) – 4-char MOOA P=Procurement, IR=InfoRecord, C=Create – module grouped intuitive
 * Fallback to legacy if exists
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get('partnerId') || searchParams.get('vendorId');
  const itemId = searchParams.get('itemId') || searchParams.get('materialId');
  const facilityId = searchParams.get('facilityId') || searchParams.get('plantId');
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'proc_info_record';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT ir.*, pa.account_number as vendor_number, pa.display_name as vendor_name, pi.item_number, pi.description as item_name, f.code as facility_code, f.name as facility_name
        FROM proc_info_record ir
        LEFT JOIN partner_account pa ON ir.partner_id = pa.id
        LEFT JOIN prod_item pi ON ir.item_id = pi.id
        LEFT JOIN org_facility f ON ir.facility_id = f.id
        WHERE 1=1
      `;
      if (partnerId) query = sql`${query} AND ir.partner_id = ${partnerId}`;
      if (itemId) query = sql`${query} AND ir.item_id = ${itemId}`;
      if (facilityId) query = sql`${query} AND ir.facility_id = ${facilityId}`;
      if (search) query = sql`${query} AND (ir.info_record_number ILIKE ${`%${search}%`} OR pa.display_name ILIKE ${`%${search}%`} OR pi.item_number ILIKE ${`%${search}%`})`;
      query = sql`${query} ORDER BY ir.valid_from DESC LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('proc_info_record not yet:', newErr.message);
      return NextResponse.json({ data: [], infoRecords: [], count: 0, message: 'Table proc_info_record not yet migrated – fresh empty Module6', code: 'PIRC', aliasCodes: ['IRC','ME11'], helperCode: 'PIRC', table: 'proc_info_record', source: 'none', legalSafe: true });
    }

    return NextResponse.json({
      data: rows,
      infoRecords: rows,
      count: rows.length,
      code: 'PIRC',
      aliasCodes: ['IRC', 'ME11', 'FIN-IR-CR'],
      helperCode: 'PIRC',
      table,
      source,
      legalSafe,
      functionDescription: 'Info Records – PIRC legal-safe own IP (was ME11) – infoRecordNumber PIR-1000001, partnerId PSUC was vendor_id, itemId EMTC was material_id, facilityId EFCC was plant_id, validFrom/To, unitPrice, currencyCode INR default, uomCode EUOC, leadTimeDays, minOrderQty MOQ – purchasing info records – Module6',
      erpDefaults: [
        { infoRecordNumber: 'PIR-1000001', vendor: 'SUP-1001', item: 'ITM-1001 Spices RAW', facility: 'FAC-1000', unitPrice: 50, currency: 'INR', uom: 'KG', leadTime: 7, moq: 10, helperCode: 'PIRC', note: 'Sample – fresh empty per requirement but CoA/GL/Tax/Currencies/UoM kept' },
      ],
      explanation: 'Info records legal-safe proc_info_record – infoRecordNumber PIR-1000001, partnerId PSUC was vendor_id, itemId EMTC was material_id, facilityId EFCC was plant_id, validFrom/To, unitPrice, currencyCode INR default, uomCode EUOC, leadTimeDays, minOrderQty MOQ – Code PIRC primary alias IRC/ME11 – 4-char MOOA P=Procurement IR=InfoRecord C=Create – module grouped intuitive – purchasing info records – Module6 – fresh empty per requirement but CoA/GL/Tax/Currencies/UoM kept.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], infoRecords: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { partner_id, vendor_id, partner_number, item_id, material_id, item_number, facility_id, plant_id, facility_code, valid_from, valid_to, unit_price, currency_code, uom_code, lead_time_days, min_order_qty } = body;

    let partnerIdResolved = partner_id || vendor_id;
    if (!partnerIdResolved && partner_number) {
      try {
        const pa = await db.execute(sql`SELECT id FROM partner_account WHERE account_number = ${partner_number} LIMIT 1`);
        if (pa.rows.length > 0) partnerIdResolved = (pa.rows[0] as any).id;
      } catch {}
    }

    let itemIdResolved = item_id || material_id;
    if (!itemIdResolved && item_number) {
      try {
        const it = await db.execute(sql`SELECT id FROM prod_item WHERE item_number = ${item_number} LIMIT 1`);
        if (it.rows.length > 0) itemIdResolved = (it.rows[0] as any).id;
      } catch {}
    }

    let facilityIdResolved = facility_id || plant_id;
    if (!facilityIdResolved && facility_code) {
      try {
        const f = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${facility_code} LIMIT 1`);
        if (f.rows.length > 0) facilityIdResolved = (f.rows[0] as any).id;
      } catch {}
    }

    if (!partnerIdResolved) return NextResponse.json({ error: 'partner_id/partner_number or vendor_id required' }, { status: 400 });
    if (!itemIdResolved) return NextResponse.json({ error: 'item_id/item_number or material_id required' }, { status: 400 });

    let infoNumber = body.info_record_number;
    if (!infoNumber) {
      infoNumber = `PIR-${Date.now()}`;
    }

    const res = await db.execute(sql`
      INSERT INTO proc_info_record (info_record_number, partner_id, vendor_id, item_id, material_id, facility_id, plant_id, valid_from, valid_to, unit_price, currency_code, currency, uom_code, uom, lead_time_days, min_order_qty)
      VALUES (${infoNumber}, ${partnerIdResolved}, ${partnerIdResolved}, ${itemIdResolved}, ${itemIdResolved}, ${facilityIdResolved || null}, ${facilityIdResolved || null}, ${valid_from ? new Date(valid_from) : new Date()}, ${valid_to ? new Date(valid_to) : null}, ${unit_price || 0}, ${currency_code || 'INR'}, ${currency_code || 'INR'}, ${uom_code || 'PC'}, ${uom_code || 'PC'}, ${lead_time_days || 7}, ${min_order_qty || 0})
      ON CONFLICT (info_record_number) DO UPDATE SET partner_id = ${partnerIdResolved}, item_id = ${itemIdResolved}, facility_id = ${facilityIdResolved || null}, valid_from = ${valid_from ? new Date(valid_from) : new Date()}, valid_to = ${valid_to ? new Date(valid_to) : null}, unit_price = ${unit_price || 0}, currency_code = ${currency_code || 'INR'}, uom_code = ${uom_code || 'PC'}, lead_time_days = ${lead_time_days || 7}, min_order_qty = ${min_order_qty || 0}, updated_at = NOW()
      RETURNING id, info_record_number
    `);

    return NextResponse.json({ success: true, infoRecord: res.rows[0], infoRecordNumber: infoNumber, code: 'PIRC', message: `Info record ${infoNumber} created – PIRC legal-safe`, legalSafe: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, info_record_number, unit_price, valid_from, valid_to, is_active } = body;
    if (!id && !info_record_number) return NextResponse.json({ error: 'id or info_record_number required' }, { status: 400 });

    let res;
    if (id) res = await db.execute(sql`UPDATE proc_info_record SET unit_price = COALESCE(${unit_price}, unit_price), valid_from = COALESCE(${valid_from ? new Date(valid_from) : null}, valid_from), valid_to = COALESCE(${valid_to ? new Date(valid_to) : null}, valid_to), is_active = COALESCE(${is_active}, is_active), updated_at = NOW() WHERE id = ${id} RETURNING id, info_record_number`);
    else res = await db.execute(sql`UPDATE proc_info_record SET unit_price = COALESCE(${unit_price}, unit_price), valid_from = COALESCE(${valid_from ? new Date(valid_from) : null}, valid_from), valid_to = COALESCE(${valid_to ? new Date(valid_to) : null}, valid_to), is_active = COALESCE(${is_active}, is_active), updated_at = NOW() WHERE info_record_number = ${info_record_number} RETURNING id, info_record_number`);

    if (res.rows.length === 0) return NextResponse.json({ error: 'Info record not found' }, { status: 404 });
    return NextResponse.json({ success: true, infoRecord: res.rows[0], code: 'PIRC', message: `Info record ${res.rows[0].info_record_number} updated – PIRC legal-safe` });
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
    const info_record_number = searchParams.get('info_record_number');
    if (!id && !info_record_number) return NextResponse.json({ error: 'id or info_record_number required' }, { status: 400 });

    if (id) await db.execute(sql`DELETE FROM proc_info_record WHERE id = ${id}`);
    else await db.execute(sql`DELETE FROM proc_info_record WHERE info_record_number = ${info_record_number}`);

    return NextResponse.json({ success: true, code: 'PIRC', message: `Info record ${info_record_number || id} deleted – PIRC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
