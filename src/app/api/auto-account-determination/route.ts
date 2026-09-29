import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Automatic Account Determination – General ERP terminology (was OBYC in SAP)
 * Defines which GL account is posted for which transaction – e.g., BSX inventory posting, WRX GR/IR clearing, GBB offsetting, etc.
 * Strict usage: When goods receipt 101 is posted, system auto-determines GL accounts via this table – debit inventory (BSX), credit GR/IR (WRX)
 * Table: fin_auto_account – transaction_key, chart_of_accounts, valuation_class, gl_account, company_code
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    try {
      const res = await db.execute(sql`SELECT * FROM fin_auto_account ORDER BY transaction_key, chart_of_accounts, valuation_class`);
      rows = res.rows as any[];
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS fin_auto_account (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            transaction_key VARCHAR(10) NOT NULL,
            chart_of_accounts VARCHAR(10) NOT NULL,
            valuation_class VARCHAR(10),
            gl_account VARCHAR(20) NOT NULL,
            company_code VARCHAR(10),
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(transaction_key, chart_of_accounts, COALESCE(valuation_class,''), COALESCE(company_code,''))
          )
        `);
        // Insert defaults for KSCA chart – BSX inventory, WRX GR/IR
        await db.execute(sql`
          INSERT INTO fin_auto_account (transaction_key, chart_of_accounts, valuation_class, gl_account, description) VALUES
          ('BSX', 'KSCA', 'RAW', '5000000001', 'Inventory posting – raw materials – debit inventory on GR'),
          ('BSX', 'KSCA', 'FINISHED', '5000000002', 'Inventory posting – finished goods'),
          ('BSX', 'KSCA', 'SEMI', '5000000003', 'Inventory posting – semi-finished'),
          ('WRX', 'KSCA', 'RAW', '2000000001', 'GR/IR clearing – raw – credit GR/IR on GR, debit on IV'),
          ('WRX', 'KSCA', 'FINISHED', '2000000002', 'GR/IR clearing – finished'),
          ('GBB', 'KSCA', 'RAW', '4000000001', 'Offsetting entry – inventory offset'),
          ('PRD', 'KSCA', 'RAW', '4000000002', 'Price difference')
          ON CONFLICT (transaction_key, chart_of_accounts, COALESCE(valuation_class,''), COALESCE(company_code,'')) DO NOTHING
        `);
        const res = await db.execute(sql`SELECT * FROM fin_auto_account ORDER BY transaction_key`);
        rows = res.rows as any[];
      } else throw e;
    }

    return NextResponse.json({
      data: rows,
      autoAccounts: rows,
      count: rows.length,
      code: 'OBYC',
      table: 'fin_auto_account',
      functionDescription: 'Automatic Account Determination – defines GL per transaction key BSX/WRX/GBB/PRD – strict usage: auto GL for goods movements',
      transactionKeys: {
        BSX: 'Inventory posting – debit inventory on GR 101',
        WRX: 'GR/IR clearing – credit GR/IR on GR, debit on invoice verification',
        GBB: 'Offsetting entry – inventory offset for goods issues',
        PRD: 'Price difference',
        BSV: 'Inventory posting – change',
      },
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
    const { transaction_key, chart_of_accounts, valuation_class, gl_account, company_code, description } = body;
    if (!transaction_key || !chart_of_accounts || !gl_account) return NextResponse.json({ error: 'transaction_key, chart_of_accounts, gl_account required – e.g., BSX, KSCA, 5000000001' }, { status: 400 });

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_auto_account (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transaction_key VARCHAR(10) NOT NULL,
        chart_of_accounts VARCHAR(10) NOT NULL,
        valuation_class VARCHAR(10),
        gl_account VARCHAR(20) NOT NULL,
        company_code VARCHAR(10),
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(transaction_key, chart_of_accounts, COALESCE(valuation_class,''), COALESCE(company_code,''))
      )
    `);

    // Validate GL exists
    try {
      const glCheck = await db.execute(sql`SELECT id FROM fin_gl_account WHERE account_number = ${gl_account} LIMIT 1`);
      if (glCheck.rows.length === 0) {
        const glCheck2 = await db.execute(sql`SELECT id FROM ent_gl_account WHERE account_number = ${gl_account} LIMIT 1`);
        if (glCheck2.rows.length === 0) {
          return NextResponse.json({ error: `GL Account ${gl_account} not found – create via FGLC/FS00 first` }, { status: 400 });
        }
      }
    } catch {}

    const res = await db.execute(sql`
      INSERT INTO fin_auto_account (transaction_key, chart_of_accounts, valuation_class, gl_account, company_code, description)
      VALUES (${transaction_key.toUpperCase()}, ${chart_of_accounts.toUpperCase()}, ${valuation_class || null}, ${gl_account}, ${company_code || null}, ${description || null})
      ON CONFLICT (transaction_key, chart_of_accounts, COALESCE(valuation_class,''), COALESCE(company_code,'')) DO UPDATE SET gl_account = ${gl_account}, description = ${description || null}, updated_at = NOW()
      RETURNING id, transaction_key, chart_of_accounts, valuation_class, gl_account
    `);

    return NextResponse.json({ success: true, autoAccount: res.rows[0], message: `Auto Account ${transaction_key}/${chart_of_accounts}/${valuation_class || ''} → ${gl_account} created – OBYC` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, gl_account, description } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const res = await db.execute(sql`UPDATE fin_auto_account SET gl_account = COALESCE(${gl_account}, gl_account), description = COALESCE(${description}, description), updated_at = NOW() WHERE id = ${id} RETURNING id, transaction_key, gl_account`);
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, autoAccount: res.rows[0] });
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
    await db.execute(sql`DELETE FROM fin_auto_account WHERE id = ${id}`);
    return NextResponse.json({ success: true, message: `Auto Account ${id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
