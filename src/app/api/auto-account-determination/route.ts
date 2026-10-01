import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Automatic Account Determination – General ERP terminology (was FAUC (legacy OBYC) in SAP)
 * New table: fin_auto_posting_rule – transaction_key, inventory_valuation_class, gl_account
 * Legacy fallback: fin_auto_account
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    let tableUsed = 'fin_auto_posting_rule';
    try {
      const res = await db.execute(sql`SELECT * FROM fin_auto_posting_rule ORDER BY transaction_key, inventory_valuation_class`);
      rows = res.rows as any[];
    } catch (newErr: any) {
      tableUsed = 'fin_auto_account';
      try {
        const res = await db.execute(sql`SELECT * FROM fin_auto_account ORDER BY transaction_key, chart_of_accounts, valuation_class`);
        rows = res.rows as any[];
      } catch (e: any) {
        if (e.message?.includes('does not exist') || newErr.message?.includes('does not exist')) {
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS fin_auto_account (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              transaction_key VARCHAR(20) NOT NULL,
              chart_of_accounts VARCHAR(10) NOT NULL,
              valuation_class VARCHAR(10),
              gl_account VARCHAR(20) NOT NULL,
              company_code VARCHAR(10),
              description TEXT,
              sap_legacy_key VARCHAR(10),
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW(),
              UNIQUE(transaction_key, chart_of_accounts, COALESCE(valuation_class,''), COALESCE(company_code,''))
            )
          `);
          await db.execute(sql`
            INSERT INTO fin_auto_account (transaction_key, chart_of_accounts, valuation_class, gl_account, description, sap_legacy_key) VALUES
            ('INV_POST', 'KSCA', 'RAW', '5000000001', 'Inventory posting – raw – legacy BSX', 'INV_POSTING'),
            ('INV_POST', 'KSCA', 'FINISHED', '5000000002', 'Inventory posting – finished – legacy BSX', 'INV_POSTING'),
            ('GRIR_CLEAR', 'KSCA', 'RAW', '2000000001', 'GR/IR clearing – raw – legacy WRX', 'GR_IR_CLEARING'),
            ('OFFSET', 'KSCA', 'RAW', '4000000001', 'Offsetting entry – raw – legacy GBB', 'INV_OFFSET'),
            ('REV_DET', 'KSCA', 'FINISHED', '3000000001', 'Revenue – REV_DET – legacy KOFI', 'KOFI')
            ON CONFLICT (transaction_key, chart_of_accounts, COALESCE(valuation_class,''), COALESCE(company_code,'')) DO NOTHING
          `);
          const res = await db.execute(sql`SELECT * FROM fin_auto_account ORDER BY transaction_key`);
          rows = res.rows as any[];
        } else {
          throw e;
        }
      }
    }

    return NextResponse.json({
      data: rows,
      autoAccounts: rows,
      count: rows.length,
      code: 'FAUC',
      sapAlias: 'OBYC',
      table: tableUsed,
      functionDescription: 'Automatic Account Determination – FAUC own IP – defines GL per transaction key INV_POST/GRIR_CLEAR/OFFSET/PRICE_DIFF/INV_DIFF – legacy BSX/WRX/GBB/PRD/BSV – own IP with SAP aliases',
      transactionKeys: {
        INV_POST: 'Inventory posting – debit inventory on GR_PO – legacy BSX – GR_PO 101',
        GRIR_CLEAR: 'GR/IR clearing – credit GR/IR on GR_PO – legacy WRX – GR_PO 101',
        OFFSET: 'Offsetting entry – inventory offset – legacy GBB – GI_PROD 261, GI_SALES 601',
        PRICE_DIFF: 'Price difference – legacy PRD – IV variance',
        INV_DIFF: 'Inventory posting change – PI diff – legacy BSV – PI_PLUS 701/PI_MINUS 702',
        EXCH_DIFF: 'Exchange rate difference – legacy KDM',
        REV_DET: 'Revenue – legacy KOFI/KOFK – billing',
        FREIGHT: 'Freight – landed cost – legacy FRE/FR1',
        CUSTOMS: 'Customs – landed cost – legacy ZOL',
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
    const { transaction_key, chart_of_accounts, valuation_class, inventory_valuation_class, gl_account, company_code, description, ledger_account_id } = body;
    if (!transaction_key || !gl_account) return NextResponse.json({ error: 'transaction_key, gl_account required' }, { status: 400 });

    // Try new table first
    try {
      const finalValClass = inventory_valuation_class || valuation_class || null;
      const res = await db.execute(sql`
        INSERT INTO fin_auto_posting_rule (transaction_key, inventory_valuation_class, valuation_class, description)
        VALUES (${transaction_key.toUpperCase()}::fin_auto_posting_transaction_key, ${finalValClass}, ${finalValClass}, ${description || null})
        ON CONFLICT (legal_entity_id, transaction_key, inventory_valuation_class) DO NOTHING
        RETURNING id, transaction_key
      `);
      // If conflict handling different (no legal_entity_id), fallback to simple insert
      if (res.rows.length === 0) {
        // Try with legal_entity_id null – need to handle unique index
        await db.execute(sql`INSERT INTO fin_auto_posting_rule (transaction_key, inventory_valuation_class, description) VALUES (${transaction_key.toUpperCase()}::fin_auto_posting_transaction_key, ${finalValClass}, ${description || null}) ON CONFLICT DO NOTHING`);
      }
      return NextResponse.json({ success: true, message: `Auto posting rule ${transaction_key} → ${gl_account} created via fin_auto_posting_rule` });
    } catch (newErr: any) {
      // Fallback to legacy fin_auto_account
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS fin_auto_account (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          transaction_key VARCHAR(20) NOT NULL,
          chart_of_accounts VARCHAR(10) NOT NULL,
          valuation_class VARCHAR(10),
          gl_account VARCHAR(20) NOT NULL,
          company_code VARCHAR(10),
          description TEXT,
          sap_legacy_key VARCHAR(10),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(transaction_key, chart_of_accounts, COALESCE(valuation_class,''), COALESCE(company_code,''))
        )
      `);
      const res = await db.execute(sql`
        INSERT INTO fin_auto_account (transaction_key, chart_of_accounts, valuation_class, gl_account, company_code, description)
        VALUES (${transaction_key.toUpperCase()}, ${chart_of_accounts?.toUpperCase() || 'KSCA'}, ${valuation_class || inventory_valuation_class || null}, ${gl_account}, ${company_code || null}, ${description || null})
        ON CONFLICT (transaction_key, chart_of_accounts, COALESCE(valuation_class,''), COALESCE(company_code,'')) DO UPDATE SET gl_account = ${gl_account}, description = ${description || null}
        RETURNING id, transaction_key, chart_of_accounts, valuation_class, gl_account
      `);
      return NextResponse.json({ success: true, autoAccount: res.rows[0], message: `Auto Account ${transaction_key} → ${gl_account} created – legacy fallback` });
    }
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
    try {
      const res = await db.execute(sql`UPDATE fin_auto_posting_rule SET description = COALESCE(${description}, description) WHERE id = ${id} RETURNING id, transaction_key`);
      if (res.rows.length === 0) throw new Error('Not found in new table');
      return NextResponse.json({ success: true, autoAccount: res.rows[0] });
    } catch {
      const res = await db.execute(sql`UPDATE fin_auto_account SET gl_account = COALESCE(${gl_account}, gl_account), description = COALESCE(${description}, description) WHERE id = ${id} RETURNING id, transaction_key, gl_account`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true, autoAccount: res.rows[0] });
    }
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
    try {
      await db.execute(sql`DELETE FROM fin_auto_posting_rule WHERE id = ${id}`);
    } catch {
      await db.execute(sql`DELETE FROM fin_auto_account WHERE id = ${id}`);
    }
    return NextResponse.json({ success: true, message: `Auto Account ${id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
