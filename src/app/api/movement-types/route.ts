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
            code VARCHAR(20) NOT NULL UNIQUE,
            description VARCHAR(250) NOT NULL,
            movement_indicator VARCHAR(2) NOT NULL,
            value_indicator VARCHAR(2) NOT NULL,
            transaction_key VARCHAR(20) NOT NULL,
            reversal_code VARCHAR(20),
            allowed_for VARCHAR(50) NOT NULL,
            is_reversal BOOLEAN DEFAULT false,
            sap_legacy_code VARCHAR(10),
            sap_legacy_key VARCHAR(10),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);
        // Seed SAP standard movement types – T0 BLOCKING – used end-to-end
        await db.execute(sql`
          INSERT INTO fin_movement_type (code, description, movement_indicator, value_indicator, transaction_key, reversal_code, allowed_for, is_reversal, sap_legacy_code, sap_legacy_key) VALUES
          ('GR_PO', 'Goods Receipt for Purchase Order – GR_PO – stock + value + – INV_POST/GRIR_CLEAR – legacy 101', '+', '+', 'INV_POST', 'GR_PO_REV', 'GR', false, 'GR_PO', 'INV_POSTING'),
          ('GR_PO_REV', 'Reversal of GR_PO – GR reversal – stock - value - – INV_POST/GRIR_CLEAR – legacy 102', '-', '-', 'INV_POST', 'GR_PO', 'GR', true, 'GR_PO_REV', 'INV_POSTING'),
          ('GR_RETURN', 'Return Delivery to Vendor – return to vendor – stock - value - – GRIR_CLEAR – legacy 122', '-', '-', 'GRIR_CLEAR', 'GR_RETURN_REV', 'GR', false, '122', 'GR_IR_CLEARING'),
          ('GR_RET_CUST', 'Returns from Customer – stock + value + – INV_POST – legacy 161', '+', '+', 'INV_POST', 'GR_RET_CUST_REV', 'GR', false, '161', 'INV_POSTING'),
          ('GI_PROD', 'GI for Production Order – consumption – stock - value - – OFFSET/INV_POST – legacy 261 – used in PROD_CONFIRM', '-', '-', 'OFFSET', 'GI_PROD_REV', 'GI', false, 'GI_PROD', 'INV_OFFSET'),
          ('GI_PROD_REV', 'Reversal of GI_PROD – reversal consumption – stock + value + – legacy 262', '+', '+', 'OFFSET', 'GI_PROD', 'GI', true, 'GI_PROD_REV', 'INV_OFFSET'),
          ('TR_MAT', 'Transfer Posting Material to Material – stock + / - – INV_POST – legacy 309', '+', '+', 'INV_POST', 'TR_MAT_REV', 'TRANSFER', false, '309', 'INV_POSTING'),
          ('GI_SCRAP', 'GI Scrap – scrapping – stock - value - – OFFSET/INV_POST – legacy 551', '-', '-', 'OFFSET', 'GI_SCRAP_REV', 'GI', false, '551', 'INV_OFFSET'),
          ('GI_SALES', 'GI for Sales – PGI for Sales Order – stock - value - – OFFSET/INV_POST + COGS – legacy 601 – used in DELIVERY_PGI', '-', '-', 'OFFSET', 'GI_SALES_REV', 'GI', false, 'GI_SALES', 'INV_OFFSET'),
          ('GI_SALES_REV', 'Reversal of GI_SALES – reversal PGI – stock + value + – legacy 602 – used in reverse PGI', '+', '+', 'OFFSET', 'GI_SALES', 'GI', true, 'GI_SALES_REV', 'INV_OFFSET'),
          ('GI_STO', 'GI for STO – stock in transit – legacy 641 – used in STO delivery', '-', '-', 'INV_POST', 'GI_STO_REV', 'GI', false, '641', 'INV_POSTING'),
          ('PI_PLUS', 'PI Receipt – surplus – stock + value + – INV_DIFF/INV_POST – legacy 701 – used in post diff surplus', '+', '+', 'INV_DIFF', 'PI_MINUS', 'PI', false, 'PI_PLUS', 'INV_DIFF'),
          ('PI_MINUS', 'PI Issue – shrinkage – stock - value - – INV_DIFF/INV_POST – legacy 702 – used in post diff shrinkage', '-', '-', 'INV_DIFF', 'PI_PLUS', 'PI', false, 'PI_MINUS', 'INV_DIFF'),
          ('INIT_STOCK', 'Initial Stock Upload – initial entry – stock + value + – INV_POST – legacy 561', '+', '+', 'INV_POST', 'INIT_STOCK_REV', 'GR', false, '561', 'INV_POSTING')
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
        'GR_PO': 'GR for PO – stock + value + – posts BSX inventory debit, WRX GR/IR credit – used in POST /api/gr',
        'GR_PO_REV': 'Reversal 101 – stock - value - – reverses BSX/WRX – used in PUT /api/gr?action=REVERSE',
        'GI_PROD': 'GI for Prod Order – stock - value - – posts GBB offset debit, BSX credit – used in POST /api/production-orders/confirm CO11N',
        'GI_SALES': 'GI for Delivery PGI – stock - value - – posts GBB COGS debit, BSX credit – used in POST /api/delivery/pgi VL02N',
        'GI_SALES_REV': 'Reversal 601 – stock + value + – used in POST /api/delivery/reverse-pgi VL09',
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
      return NextResponse.json({ error: 'code, description, movement_indicator (+/-), value_indicator (+/-), transaction_key (INV_POST/GRIR_CLEAR/OFFSET/PRICE_DIFF/INV_DIFF/EXCH_DIFF/REV_DET), allowed_for (GR/GI/TRANSFER/PI/ALL) required – e.g., GR_PO GR INV_POST – legacy 101 BSX' }, { status: 400 });
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
      VALUES (${code}, ${description}, ${movement_indicator}, ${value_indicator}, ${transaction_key.toUpperCase()}, ${reversal_code || null}, ${allowed_for.toUpperCase()}, ${code.endsWith('2') || code === 'GR_PO_REV' || code === 'GR_RETURN' ? true : false})
      ON CONFLICT (code) DO UPDATE SET description = ${description}, movement_indicator = ${movement_indicator}, value_indicator = ${value_indicator}, transaction_key = ${transaction_key.toUpperCase()}, reversal_code = ${reversal_code || null}, allowed_for = ${allowed_for.toUpperCase()}, updated_at = NOW()
      RETURNING id, code, description, movement_indicator, value_indicator, transaction_key
    `);

    return NextResponse.json({ success: true, movementType: res.rows[0], message: `Movement Type ${code} ${description} created – FMTM (legacy OMJJ) – T0 BLOCKING – used in GR/GI/PGI/PI` });
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
