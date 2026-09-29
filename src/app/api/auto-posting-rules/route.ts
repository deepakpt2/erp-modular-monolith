import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Auto Posting Rules API – Legal-safe own IP – Module 4
 * New: fin_auto_posting_rule (was fi_auto_account_determination) – transactionKey INV_POSTING was BSX, GR_IR_CLEARING was WRX, PRICE_DIFF was PRD, INV_OFFSET was GBB etc with legacy columns for alias, sample kept
 * Helper code: FAUC Auto Posting Rule Create (alias AUC, OBYC, FIN-AP-CR) – 4-char MOOA F=Financials, AU=AutoPosting, C=Create – module grouped intuitive
 * Fallback to legacy fi_auto_account_determination
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'fin_auto_posting_rule';
    let legalSafe = true;

    try {
      const res = await db.execute(sql`
        SELECT apr.*, gl.account_number, gl.name as gl_name, cc.code as company_code
        FROM fin_auto_posting_rule apr
        LEFT JOIN fin_ledger_account gl ON apr.ledger_account_id = gl.id
        LEFT JOIN ent_company_code cc ON apr.company_code_id = cc.id
        ORDER BY apr.company_code_id, apr.transaction_key
        LIMIT 200
      `);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('fin_auto_posting_rule not yet fallback fi_auto_account_determination:', newErr.message);
      source = 'db-legacy';
      table = 'fi_auto_account_determination';
      legalSafe = false;
      try {
        const res = await db.execute(sql`
          SELECT aad.*, gl.account_number, gl.name as gl_name, cc.code as company_code
          FROM fi_auto_account_determination aad
          LEFT JOIN fi_gl_account gl ON aad.gl_account_id = gl.id
          LEFT JOIN ent_company_code cc ON aad.company_code_id = cc.id
          ORDER BY aad.company_code_id, aad.transaction_key
          LIMIT 200
        `);
        rows = res.rows as any[];
      } catch (e: any) {
        if (e.message?.includes('does not exist')) {
          return NextResponse.json({ data: [], autoPostingRules: [], count: 0, message: 'Table fin_auto_posting_rule not yet migrated – fresh empty Module 4', code: 'FAUC', aliasCodes: ['AUC','OBYC'], helperCode: 'FAUC', table: 'fin_auto_posting_rule', source: 'none', legalSafe: true });
        }
        throw e;
      }
    }

    return NextResponse.json({
      data: rows,
      autoPostingRules: rows,
      count: rows.length,
      code: 'FAUC',
      aliasCodes: ['AUC', 'OBYC', 'FIN-AP-CR'],
      helperCode: 'FAUC',
      table,
      source,
      legalSafe,
      functionDescription: 'Auto Posting Rules – FAUC legal-safe own IP (was OBYC) – INV_POSTING was BSX, GR_IR_CLEARING was WRX, PRICE_DIFF was PRD, INV_OFFSET was GBB – fin_auto_posting_rule',
      erpDefaults: [
        { transactionKey: 'INV_POSTING', legacyKey: 'BSX', description: 'Inventory Posting – BSX – Raw Mat stock', gl: '140000/5000000001', helperCode: 'FAUC', note: 'Sample kept' },
        { transactionKey: 'GR_IR_CLEARING', legacyKey: 'WRX', description: 'GR/IR Clearing – WRX', gl: '200000/5000000003', helperCode: 'FAUC' },
        { transactionKey: 'PRICE_DIFF', legacyKey: 'PRD', description: 'Price Difference – PRD', gl: '5000000005', helperCode: 'FAUC' },
        { transactionKey: 'INV_OFFSET', legacyKey: 'GBB', description: 'Inventory Offsetting – GBB – Consumption', gl: '400000/5000000006', helperCode: 'FAUC' },
        { transactionKey: 'FREIGHT', legacyKey: 'FRL', description: 'Freight Clearing', helperCode: 'FAUC' },
        { transactionKey: 'TAX_INPUT', legacyKey: 'TAX', description: 'Input Tax – VAT/GST', gl: '130000/7000000000', helperCode: 'FAUC' },
      ],
      explanation: 'Auto posting rules legal-safe fin_auto_posting_rule – transactionKey INV_POSTING was BSX, GR_IR_CLEARING was WRX, PRICE_DIFF was PRD, INV_OFFSET was GBB etc with legacy columns for alias – Code FAUC primary alias AUC/OBYC – 4-char MOOA F=Financials AU=AutoPosting C=Create – module grouped intuitive – sample data kept for user convenience per requirement fresh empty but common sample data like coa, gl, tax, currencies, UoM kept.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], autoPostingRules: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { company_code, transaction_key, valuation_class, inventory_valuation_class, gl_account_number, ledger_account_number, description } = body;
    if (!company_code || !transaction_key || (!gl_account_number && !ledger_account_number)) return NextResponse.json({ error: 'company_code, transaction_key, gl_account_number/ledger_account_number required' }, { status: 400 });

    const finalGl = ledger_account_number || gl_account_number;
    const finalValuation = inventory_valuation_class || valuation_class;

    let companyCodeId = null;
    try {
      const cc = await db.execute(sql`SELECT id FROM ent_company_code WHERE code = ${company_code} LIMIT 1`);
      if (cc.rows.length > 0) companyCodeId = (cc.rows[0] as any).id;
    } catch {}

    try {
      let glId = null;
      try {
        const g = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number = ${finalGl} LIMIT 1`);
        if (g.rows.length > 0) glId = (g.rows[0] as any).id;
      } catch {
        const g = await db.execute(sql`SELECT id FROM fi_gl_account WHERE account_number = ${finalGl} LIMIT 1`);
        if (g.rows.length > 0) glId = (g.rows[0] as any).id;
      }
      if (!glId) return NextResponse.json({ error: `G/L ${finalGl} not found` }, { status: 404 });

      const res = await db.execute(sql`
        INSERT INTO fin_auto_posting_rule (company_code_id, transaction_key, inventory_valuation_class, ledger_account_id, description, legacy_transaction_key)
        VALUES (${companyCodeId}, ${transaction_key.toUpperCase()}::fin_auto_posting_transaction_key, ${finalValuation || null}, ${glId}, ${description || null}, ${transaction_key.toUpperCase()})
        ON CONFLICT (company_code_id, transaction_key, inventory_valuation_class) DO UPDATE SET ledger_account_id = ${glId}, description = ${description || null}, updated_at = NOW()
        RETURNING id, transaction_key
      `);
      return NextResponse.json({ success: true, autoPostingRule: res.rows[0], code: 'FAUC', message: `Auto posting ${transaction_key} -> ${finalGl} created – FAUC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('fin_auto_posting_rule insert failed fallback fi_auto_account_determination:', newErr.message);
      const g = await db.execute(sql`SELECT id FROM fi_gl_account WHERE account_number = ${finalGl} LIMIT 1`);
      if (g.rows.length === 0) return NextResponse.json({ error: `G/L ${finalGl} not found` }, { status: 404 });
      const glId = (g.rows[0] as any).id;

      const res = await db.execute(sql`
        INSERT INTO fi_auto_account_determination (company_code_id, transaction_key, valuation_class, gl_account_id, description)
        VALUES (${companyCodeId}, ${transaction_key.toUpperCase()}, ${finalValuation || null}, ${glId}, ${description || null})
        ON CONFLICT (company_code_id, transaction_key, valuation_class) DO UPDATE SET gl_account_id = ${glId}, description = ${description || null}
        RETURNING id, transaction_key
      `);
      return NextResponse.json({ success: true, autoPostingRule: res.rows[0], code: 'FAUC', message: `Auto posting ${transaction_key} -> ${finalGl} created – OBYC legacy (migrating to FAUC)`, legalSafe: false });
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
    const { id, gl_account_number, ledger_account_number } = body;
    const finalGl = ledger_account_number || gl_account_number;
    if (!id || !finalGl) return NextResponse.json({ error: 'id and gl_account_number/ledger_account_number required' }, { status: 400 });

    try {
      let glId = null;
      try {
        const g = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number = ${finalGl} LIMIT 1`);
        if (g.rows.length > 0) glId = (g.rows[0] as any).id;
      } catch {
        const g = await db.execute(sql`SELECT id FROM fi_gl_account WHERE account_number = ${finalGl} LIMIT 1`);
        if (g.rows.length > 0) glId = (g.rows[0] as any).id;
      }
      if (!glId) return NextResponse.json({ error: `G/L ${finalGl} not found` }, { status: 404 });

      const res = await db.execute(sql`UPDATE fin_auto_posting_rule SET ledger_account_id = ${glId}, updated_at = NOW() WHERE id = ${id} RETURNING id, transaction_key`);
      if (res.rows.length === 0) throw new Error('Not found in fin_auto_posting_rule');
      return NextResponse.json({ success: true, autoPostingRule: res.rows[0], code: 'FAUC', message: `Auto posting ${res.rows[0].transaction_key} updated -> ${finalGl} – FAUC legal-safe` });
    } catch {
      const g = await db.execute(sql`SELECT id FROM fi_gl_account WHERE account_number = ${finalGl} LIMIT 1`);
      if (g.rows.length === 0) return NextResponse.json({ error: `G/L ${finalGl} not found` }, { status: 404 });
      const glId = (g.rows[0] as any).id;

      const res = await db.execute(sql`UPDATE fi_auto_account_determination SET gl_account_id = ${glId} WHERE id = ${id} RETURNING id, transaction_key`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Auto posting not found' }, { status: 404 });
      return NextResponse.json({ success: true, autoPostingRule: res.rows[0], message: `Auto posting ${res.rows[0].transaction_key} updated -> ${finalGl} – OBYC legacy` });
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
      await db.execute(sql`DELETE FROM fi_auto_account_determination WHERE id = ${id}`);
    }

    return NextResponse.json({ success: true, code: 'FAUC', message: `Auto posting ${id} deleted – FAUC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
