import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Movement Types – FMTM own IP – T0 BLOCKING – No Dangling
 * Defines 101 GR, 102 GR reversal, 122 return to vendor, 161 returns, 261 GI to order, 262 reversal, 309 transfer material to material, 551 scrap, 601 GI for sales (PGI), 602 reversal, 701/702 PI diff
 * Strict usage: Every goods movement must have movement type, determines + / - stock, + / - value, account modifier BSX/WRX/GBB/PRD, reversal movement, allowed transactions
 * Used in: GR 101, GR reversal 102, Production GI 261, Sales PGI 601, Scrap 551, Transfer 309, PI 701/702
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    try {
      const res = await db.execute(sql`SELECT * FROM fin_movement_type ORDER BY code`);
      rows = res.rows as any[];
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS fin_movement_type (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(10) NOT NULL UNIQUE,
            description VARCHAR(200) NOT NULL,
            movement_indicator VARCHAR(2) NOT NULL, -- + increase, - decrease
            value_indicator VARCHAR(2) NOT NULL, -- + value increase, - value decrease, blank no value
            transaction_key VARCHAR(10) NOT NULL, -- BSX, WRX, GBB, PRD, BSV
            reversal_code VARCHAR(10),
            allowed_for VARCHAR(50) NOT NULL, -- GR, GI, TRANSFER, PI, ALL
            is_reversal BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);
        // Seed SAP standard movement types – T0 BLOCKING – used end-to-end
        await db.execute(sql`
          INSERT INTO fin_movement_type (code, description, movement_indicator, value_indicator, transaction_key, reversal_code, allowed_for, is_reversal) VALUES
          ('101', 'Goods Receipt for Purchase Order – GR 101 – stock + value + – BSX/WRX', '+', '+', 'BSX', '102', 'GR', false),
          ('102', 'Reversal of GR 101 – GR reversal – stock - value - – BSX/WRX reversal', '-', '-', 'BSX', '101', 'GR', true),
          ('122', 'Return Delivery to Vendor – return to vendor – stock - value - – WRX', '-', '-', 'WRX', '123', 'GR', false),
          ('161', 'Returns – returns from customer – stock + value + – BSX', '+', '+', 'BSX', '162', 'GR', false),
          ('261', 'GI for Production Order – consumption – stock - value - – GBB/BSX – used in CO11N confirmation', '-', '-', 'GBB', '262', 'GI', false),
          ('262', 'Reversal of GI 261 – reversal consumption – stock + value +', '+', '+', 'GBB', '261', 'GI', true),
          ('309', 'Transfer Posting Material to Material – stock + / - – BSX/BSX', '+', '+', 'BSX', '310', 'TRANSFER', false),
          ('551', 'GI Scrap – scrapping – stock - value - – GBB/BSX', '-', '-', 'GBB', '552', 'GI', false),
          ('601', 'GI for Delivery – PGI for Sales Order – stock - value - – GBB/BSX + COGS – used in VL02N PGI', '-', '-', 'GBB', '602', 'GI', false),
          ('602', 'Reversal of GI 601 – reversal PGI – stock + value + – used in VL09 reverse PGI', '+', '+', 'GBB', '601', 'GI', true),
          ('641', 'GI for STO – stock in transit – used in STO delivery', '-', '-', 'BSX', '642', 'GI', false),
          ('701', 'PI Receipt – surplus – stock + value + – BSV/BSX – used in MI07 post diff surplus', '+', '+', 'BSV', '702', 'PI', false),
          ('702', 'PI Issue – shrinkage – stock - value - – BSV/BSX – used in MI07 post diff shrinkage', '-', '-', 'BSV', '701', 'PI', false),
          ('561', 'Initial Stock Upload – initial entry – stock + value + – BSX', '+', '+', 'BSX', '562', 'GR', false)
          ON CONFLICT (code) DO NOTHING
        `);
        const res = await db.execute(sql`SELECT * FROM fin_movement_type ORDER BY code`);
        rows = res.rows as any[];
      } else throw e;
    }

    return NextResponse.json({
      data: rows,
      movementTypes: rows,
      count: rows.length,
      code: 'FMTM',
      aliasCodes: ['OMJJ', 'FIN-MV-CR'],
      table: 'fin_movement_type',
      functionDescription: 'Movement Types – FMTM own IP – T0 BLOCKING – defines 101/102/122/161/261/262/309/551/601/602/701/702 – determines stock +/- value +/- account modifier BSX/WRX/GBB/PRD/BSV – used in GR, GI, PGI, PI, Scrap, Transfer – NO DANGLING',
      usage: {
        '101': 'GR for PO – stock + value + – posts BSX inventory debit, WRX GR/IR credit – used in POST /api/gr',
        '102': 'Reversal 101 – stock - value - – reverses BSX/WRX – used in PUT /api/gr?action=REVERSE',
        '261': 'GI for Prod Order – stock - value - – posts GBB offset debit, BSX credit – used in POST /api/production-orders/confirm CO11N',
        '601': 'GI for Delivery PGI – stock - value - – posts GBB COGS debit, BSX credit – used in POST /api/delivery/pgi VL02N',
        '602': 'Reversal 601 – stock + value + – used in POST /api/delivery/reverse-pgi VL09',
        '701/702': 'PI diff – surplus/shrinkage – posts BSV – used in POST /api/physical-inventory MI07'
      }
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
    const { code, description, movement_indicator, value_indicator, transaction_key, reversal_code, allowed_for } = body;
    if (!code || !description || !movement_indicator || !value_indicator || !transaction_key || !allowed_for) {
      return NextResponse.json({ error: 'code, description, movement_indicator (+/-), value_indicator (+/-), transaction_key (BSX/WRX/GBB/PRD/BSV), allowed_for (GR/GI/TRANSFER/PI/ALL) required – e.g., 101 GR BSX' }, { status: 400 });
    }

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_movement_type (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(10) NOT NULL UNIQUE,
        description VARCHAR(200) NOT NULL,
        movement_indicator VARCHAR(2) NOT NULL,
        value_indicator VARCHAR(2) NOT NULL,
        transaction_key VARCHAR(10) NOT NULL,
        reversal_code VARCHAR(10),
        allowed_for VARCHAR(50) NOT NULL,
        is_reversal BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const res = await db.execute(sql`
      INSERT INTO fin_movement_type (code, description, movement_indicator, value_indicator, transaction_key, reversal_code, allowed_for, is_reversal)
      VALUES (${code}, ${description}, ${movement_indicator}, ${value_indicator}, ${transaction_key.toUpperCase()}, ${reversal_code || null}, ${allowed_for.toUpperCase()}, ${code.endsWith('2') || code === '102' || code === '122' ? true : false})
      ON CONFLICT (code) DO UPDATE SET description = ${description}, movement_indicator = ${movement_indicator}, value_indicator = ${value_indicator}, transaction_key = ${transaction_key.toUpperCase()}, reversal_code = ${reversal_code || null}, allowed_for = ${allowed_for.toUpperCase()}, updated_at = NOW()
      RETURNING id, code, description, movement_indicator, value_indicator, transaction_key
    `);

    return NextResponse.json({ success: true, movementType: res.rows[0], message: `Movement Type ${code} ${description} created – OMJJ – T0 BLOCKING – used in GR/GI/PGI/PI` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, description, movement_indicator, value_indicator, transaction_key, reversal_code, allowed_for, is_active } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const res = await db.execute(sql`
      UPDATE fin_movement_type SET
        description = COALESCE(${description}, description),
        movement_indicator = COALESCE(${movement_indicator}, movement_indicator),
        value_indicator = COALESCE(${value_indicator}, value_indicator),
        transaction_key = COALESCE(${transaction_key}, transaction_key),
        reversal_code = COALESCE(${reversal_code}, reversal_code),
        allowed_for = COALESCE(${allowed_for}, allowed_for),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, code, description
    `);
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, movementType: res.rows[0] });
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

    // Prevent delete if used in stock ledger
    try {
      const used = await db.execute(sql`SELECT COUNT(*) as cnt FROM inv_stock_ledger WHERE movement_type = (SELECT code FROM fin_movement_type WHERE id = ${id})`);
      if (parseInt((used.rows[0] as any).cnt || '0') > 0) {
        await db.execute(sql`UPDATE fin_movement_type SET is_active = false WHERE id = ${id}`);
        return NextResponse.json({ success: true, softDeleted: true, message: `Movement Type has transactions – soft deleted (is_active=false) – audit trail preserved` });
      }
    } catch {}

    await db.execute(sql`DELETE FROM fin_movement_type WHERE id = ${id}`);
    return NextResponse.json({ success: true, message: `Movement Type ${id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
