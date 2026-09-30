import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Source Lists API – Legal-safe own IP – Module 6 MM Procurement – NEW
 * New: proc_source_list (was none) – itemId EMTC was material_id, facilityId EFCC was plant_id, partnerId PSUC was vendor_id, validFrom/To, isMrpRelevant, isBlocked, priority 1=highest
 * Helper code: PSRC Source List Create (alias SRC, ME01, FIN-SL-CR) – 4-char MOOA P=Procurement, SR=Source, C=Create – module grouped intuitive
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

    try {
      let query = sql`
        SELECT sl.*, pa.account_number as vendor_number, pa.display_name as vendor_name, pi.item_number, pi.description as item_name, f.code as facility_code, f.name as facility_name
        FROM proc_source_list sl
        LEFT JOIN partner_account pa ON sl.partner_id = pa.id
        LEFT JOIN prod_item pi ON sl.item_id = pi.id
        LEFT JOIN org_facility f ON sl.facility_id = f.id
        WHERE 1=1
      `;
      if (partnerId) query = sql`${query} AND sl.partner_id = ${partnerId}`;
      if (itemId) query = sql`${query} AND sl.item_id = ${itemId}`;
      if (facilityId) query = sql`${query} AND sl.facility_id = ${facilityId}`;
      if (search) query = sql`${query} AND (pi.item_number ILIKE ${`%${search}%`} OR pa.display_name ILIKE ${`%${search}%`})`;
      query = sql`${query} ORDER BY sl.priority ASC, sl.valid_from DESC LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('proc_source_list not yet:', newErr.message);
      return NextResponse.json({ data: [], sourceLists: [], count: 0, message: 'Table proc_source_list not yet migrated – fresh empty Module6', code: 'PSRC', aliasCodes: ['SRC','ME01'], helperCode: 'PSRC', table: 'proc_source_list', source: 'none', legalSafe: true });
    }

    return NextResponse.json({
      data: rows,
      sourceLists: rows,
      count: rows.length,
      code: 'PSRC',
      aliasCodes: ['SRC', 'ME01', 'FIN-SL-CR'],
      helperCode: 'PSRC',
      table: 'proc_source_list',
      source: 'db-new',
      legalSafe: true,
      functionDescription: 'Source Lists – PSRC legal-safe own IP (was ME01) – itemId EMTC was material_id, facilityId EFCC was plant_id, partnerId PSUC was vendor_id, validFrom/To, isMrpRelevant, isBlocked, priority 1=highest – source list – Module6',
      erpDefaults: [
        { item: 'ITM-1001 Spices RAW', facility: 'FAC-1000', vendor: 'SUP-1001', validFrom: '2026-01-01', isMrpRelevant: true, priority: 1, helperCode: 'PSRC', note: 'Sample – fresh empty per requirement but CoA/GL/Tax/Currencies/UoM kept' },
      ],
      explanation: 'Source lists legal-safe proc_source_list – itemId EMTC was material_id, facilityId EFCC was plant_id, partnerId PSUC was vendor_id, validFrom/To, isMrpRelevant, isBlocked, priority 1=highest – Code PSRC primary alias SRC/ME01 – 4-char MOOA P=Procurement SR=Source C=Create – module grouped intuitive – source list – Module6 – fresh empty per requirement but CoA/GL/Tax/Currencies/UoM kept.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], sourceLists: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { partner_id, vendor_id, partner_number, item_id, material_id, item_number, facility_id, plant_id, facility_code, valid_from, valid_to, is_mrp_relevant, is_blocked, priority } = body;

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
    if (!facilityIdResolved) return NextResponse.json({ error: 'facility_id/facility_code or plant_id required' }, { status: 400 });

    const res = await db.execute(sql`
      INSERT INTO proc_source_list (item_id, material_id, facility_id, plant_id, partner_id, vendor_id, valid_from, valid_to, is_mrp_relevant, is_blocked, priority)
      VALUES (${itemIdResolved}, ${itemIdResolved}, ${facilityIdResolved}, ${facilityIdResolved}, ${partnerIdResolved}, ${partnerIdResolved}, ${valid_from ? new Date(valid_from) : new Date()}, ${valid_to ? new Date(valid_to) : null}, ${is_mrp_relevant ?? true}, ${is_blocked ?? false}, ${priority || 1})
      ON CONFLICT (item_id, facility_id, partner_id) DO UPDATE SET valid_from = ${valid_from ? new Date(valid_from) : new Date()}, valid_to = ${valid_to ? new Date(valid_to) : null}, is_mrp_relevant = ${is_mrp_relevant ?? true}, is_blocked = ${is_blocked ?? false}, priority = ${priority || 1}
      RETURNING id
    `);

    return NextResponse.json({ success: true, sourceList: res.rows[0], code: 'PSRC', message: `Source list for item ${itemIdResolved} facility ${facilityIdResolved} partner ${partnerIdResolved} created – PSRC legal-safe`, legalSafe: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, is_mrp_relevant, is_blocked, priority, valid_from, valid_to } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const res = await db.execute(sql`
      UPDATE proc_source_list SET is_mrp_relevant = COALESCE(${is_mrp_relevant}, is_mrp_relevant), is_blocked = COALESCE(${is_blocked}, is_blocked), priority = COALESCE(${priority}, priority), valid_from = COALESCE(${valid_from ? new Date(valid_from) : null}, valid_from), valid_to = COALESCE(${valid_to ? new Date(valid_to) : null}, valid_to)
      WHERE id = ${id}
      RETURNING id
    `);

    if (res.rows.length === 0) return NextResponse.json({ error: 'Source list not found' }, { status: 404 });
    return NextResponse.json({ success: true, sourceList: res.rows[0], code: 'PSRC', message: `Source list ${id} updated – PSRC legal-safe` });
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

    await db.execute(sql`DELETE FROM proc_source_list WHERE id = ${id}`);

    return NextResponse.json({ success: true, code: 'PSRC', message: `Source list ${id} deleted – PSRC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
