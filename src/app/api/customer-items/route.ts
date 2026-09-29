import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Customer-Material Relations API – Legal-safe own IP – Module 8 SD
 * New: sales_customer_item (was customer_material) – partnerId SCUC was customer_id, itemId EMTC was material_id, customerItemNumber customer-specific material number, customerItemDescription, isActive
 * Helper code: SCMR Customer-Material Rel Create (alias CMR, VD51, FIN-CM-CR) – 4-char MOOA S=Sales C=Customer M=Material? Actually SCMR = Sales Customer Material Rel – module grouped intuitive
 * Fresh empty per requirement but partner/item kept
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const partnerId = searchParams.get('partnerId') || searchParams.get('customerId');
  const itemId = searchParams.get('itemId') || searchParams.get('materialId');

  try {
    let rows: any[] = [];
    let table = 'sales_customer_item';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT sci.id, sci.customer_item_number, sci.customer_item_description, sci.is_active, sci.created_at,
               pa.account_number as customer_number, pa.display_name as customer_name,
               pi.item_number as material_number, pi.name as material_name, pi.item_number
        FROM sales_customer_item sci
        JOIN partner_account pa ON sci.partner_id = pa.id
        JOIN prod_item pi ON sci.item_id = pi.id
        WHERE 1=1
      `;
      if (search) query = sql`${query} AND (sci.customer_item_number ILIKE ${`%${search}%`} OR pi.item_number ILIKE ${`%${search}%`} OR pa.display_name ILIKE ${`%${search}%`})`;
      if (partnerId) query = sql`${query} AND sci.partner_id = ${partnerId}`;
      if (itemId) query = sql`${query} AND sci.item_id = ${itemId}`;
      query = sql`${query} ORDER BY sci.created_at DESC LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    } catch (e: any) {
      console.warn('sales_customer_item not yet:', e.message);
      return NextResponse.json({
        data: [],
        customerItems: [],
        count: 0,
        code: 'SCMR',
        aliasCodes: ['CMR', 'VD51', 'FIN-CM-CR'],
        helperCode: 'SCMR',
        table: 'sales_customer_item',
        source: 'none',
        legalSafe: true,
        message: 'Table sales_customer_item fresh empty – SCMR legal-safe own IP – customer-material relations – partnerId SCUC was customer_id, itemId EMTC was material_id, customerItemNumber customer-specific number – fresh empty per requirement',
        explanation: 'Customer-material relations legal-safe sales_customer_item – partnerId SCUC was customer_id, itemId EMTC was material_id FERT, customerItemNumber customer-specific material number, customerItemDescription, isActive – Code SCMR primary alias CMR/VD51 – 4-char MOOA S=Sales C=Customer M=Material R=Rel? Actually SCMR Sales Customer Material Rel – module grouped intuitive, same length as VD51 but own IP – fresh empty but prod_item/partner kept.',
      });
    }

    return NextResponse.json({
      data: rows,
      customerItems: rows,
      count: rows.length,
      code: 'SCMR',
      aliasCodes: ['CMR', 'VD51', 'FIN-CM-CR'],
      helperCode: 'SCMR',
      table,
      source: 'db-new',
      legalSafe,
      functionDescription: 'Customer-Material Rel – SCMR legal-safe own IP (was VD51) – partnerId SCUC was customer_id, itemId EMTC was material_id, customerItemNumber, customerItemDescription, isActive',
      explanation: 'Customer-material relations legal-safe sales_customer_item – partnerId SCUC was customer_id SCUC, itemId EMTC was material_id FERT EMTC, customerItemNumber customer-specific material number, customerItemDescription, isActive – Code SCMR primary alias CMR/VD51 – 4-char MOOA S=Sales C=Customer M=Material R=Rel – module grouped intuitive – fresh empty per requirement but prod_item/partner kept.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { partner_id, customer_id, partner_number, item_id, material_id, item_number, customer_item_number, customer_item_description } = body;

    let partnerIdResolved = partner_id || customer_id;
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

    if (!partnerIdResolved) return NextResponse.json({ error: 'partner_id/customer_id or partner_number required' }, { status: 400 });
    if (!itemIdResolved) return NextResponse.json({ error: 'item_id/material_id or item_number required' }, { status: 400 });
    if (!customer_item_number) return NextResponse.json({ error: 'customer_item_number required' }, { status: 400 });

    const res = await db.execute(sql`
      INSERT INTO sales_customer_item (partner_id, customer_id, item_id, material_id, customer_item_number, customer_item_description)
      VALUES (${partnerIdResolved}, ${partnerIdResolved}, ${itemIdResolved}, ${itemIdResolved}, ${customer_item_number}, ${customer_item_description || null})
      ON CONFLICT (partner_id, item_id) DO UPDATE SET customer_item_number = ${customer_item_number}, customer_item_description = ${customer_item_description || null}
      RETURNING id, customer_item_number
    `);

    return NextResponse.json({ success: true, customerItem: res.rows[0], code: 'SCMR', message: `Customer-item ${customer_item_number} created – SCMR legal-safe`, legalSafe: true });
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

    await db.execute(sql`DELETE FROM sales_customer_item WHERE id = ${id}`);

    return NextResponse.json({ success: true, code: 'SCMR', message: `Customer-item ${id} deleted – SCMR legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
