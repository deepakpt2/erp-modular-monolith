import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Auto Posting Rules API – Legal-safe own IP – Module 4
 * New: fin_auto_posting_rule (was fin_auto_posting_rule) – transactionKey INV_POSTING was BSX, GR_IR_CLEARING was WRX, PRICE_DIFF was PRD, INV_OFFSET was GBB etc with legacy columns for alias, sample kept
 * Helper code: FAUC Auto Posting Rule Create (alias AUC, FAUC (legacy OBYC), FIN-AP-CR) – 4-char MOOA F=Financials, AU=AutoPosting, C=Create – module grouped intuitive
 * Fallback to legacy fin_auto_posting_rule
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
        LEFT JOIN org_legal_entity cc ON apr.company_code_id = cc.id
        ORDER BY apr.company_code_id, apr.transaction_key
        LIMIT 200
      `);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('fin_auto_posting_rule not yet fallback fin_auto_posting_rule:', newErr.message);
      source = 'db-legacy';
      table = 'fin_auto_posting_rule';
      legalSafe = false;
      try {
        const res = await db.execute(sql`
          SELECT aad.*, gl.account_number, gl.name as gl_name, cc.code as company_code
          FROM fin_auto_posting_rule aad
          LEFT JOIN fin_ledger_account gl ON aad.gl_account_id = gl.id
          LEFT JOIN org_legal_entity cc ON aad.company_code_id = cc.id
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
      functionDescription: 'Auto Posting Rules – FAUC legal-safe own IP (was FAUC (legacy OBYC)) – INV_POSTING was BSX, GR_IR_CLEARING was WRX, PRICE_DIFF was PRD, INV_OFFSET was GBB – fin_auto_posting_rule',
      erpDefaults: [
        { transactionKey: 'INV_POSTING', legacyKey: 'INV_POSTING', description: 'Inventory Posting – BSX – Raw Mat stock', gl: '140000/5000000001', helperCode: 'FAUC', note: 'Sample kept' },
        { transactionKey: 'GR_IR_CLEARING', legacyKey: 'GR_IR_CLEARING', description: 'GR/IR Clearing – WRX', gl: '200000/5000000003', helperCode: 'FAUC' },
        { transactionKey: 'PRICE_DIFF', legacyKey: 'PRICE_DIFF', description: 'Price Difference – PRD', gl: '5000000005', helperCode: 'FAUC' },
        { transactionKey: 'INV_OFFSET', legacyKey: 'INV_OFFSET', description: 'Inventory Offsetting – GBB – Consumption', gl: '400000/5000000006', helperCode: 'FAUC' },
        { transactionKey: 'FREIGHT', legacyKey: 'FRL', description: 'Freight Clearing', helperCode: 'FAUC' },
        { transactionKey: 'TAX_INPUT', legacyKey: 'TAX', description: 'Input Tax – VAT/GST', gl: '130000/7000000000', helperCode: 'FAUC' },
      ],
      explanation: 'Auto posting rules legal-safe fin_auto_posting_rule – transactionKey INV_POSTING was BSX, GR_IR_CLEARING was WRX, PRICE_DIFF was PRD, INV_OFFSET was GBB etc with legacy columns for alias – Code FAUC primary alias AUC/FAUC (legacy OBYC) – 4-char MOOA F=Financials AU=AutoPosting C=Create – module grouped intuitive – sample data kept for user convenience per requirement fresh empty but common sample data like coa, gl, tax, currencies, UoM kept.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], autoPostingRules: [] }, { status: 500 });
  }
}

const legacyToNewMap: Record<string,string> = {
  'INV_POSTING': 'INV_POSTING',
  'GR_IR_CLEARING': 'GR_IR_CLEARING',
  'PRICE_DIFF': 'PRICE_DIFF',
  'INV_OFFSET': 'INV_OFFSET',
  'KOFI': 'REVENUE',
  'KOFK': 'REVENUE',
  'KDM': 'PRICE_DIFF',
  'INV_DIFF': 'INV_POSTING',
  'FRL': 'FREIGHT',
  'TAX': 'TAX_INPUT',
};

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { company_code, transaction_key, valuation_class, inventory_valuation_class, gl_account_number, ledger_account_number, description } = body;
    if (!company_code || !transaction_key || (!gl_account_number && !ledger_account_number)) return NextResponse.json({ error: 'company_code, transaction_key, gl_account_number/ledger_account_number required' }, { status: 400 });

    const rawKey = transaction_key.toUpperCase();
    const mappedKey = legacyToNewMap[rawKey] || rawKey; // BSX -> INV_POSTING etc
    const finalGl = ledger_account_number || gl_account_number;
    const finalValuation = inventory_valuation_class || valuation_class;

    let companyCodeId = null;
    try {
      const cc = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code = ${company_code} LIMIT 1`);
      if (cc.rows.length > 0) companyCodeId = (cc.rows[0] as any).id;
    } catch {}

    try {
      let glId = null;
      try {
        const g = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number = ${finalGl} LIMIT 1`);
        if (g.rows.length > 0) glId = (g.rows[0] as any).id;
      } catch {
        const g = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number = ${finalGl} LIMIT 1`);
        if (g.rows.length > 0) glId = (g.rows[0] as any).id;
      }
      if (!glId) return NextResponse.json({ error: `G/L ${finalGl} not found` }, { status: 404 });

      const res = await db.execute(sql`
        INSERT INTO fin_auto_posting_rule (company_code_id, transaction_key, inventory_valuation_class, ledger_account_id, description, transaction_key_legacy)
        VALUES (${companyCodeId}, ${mappedKey}::fin_auto_posting_key, ${finalValuation || null}, ${glId}, ${description || null}, ${rawKey})
        ON CONFLICT DO NOTHING
        RETURNING id, transaction_key
      `);
      // If conflict due to unique index (legal_entity_id, transaction_key, inventory_valuation_class), try update
      if (res.rows.length === 0) {
        const upd = await db.execute(sql`UPDATE fin_auto_posting_rule SET ledger_account_id = ${glId}, description = ${description || null} WHERE transaction_key = ${mappedKey}::fin_auto_posting_key AND COALESCE(inventory_valuation_class,'') = COALESCE(${finalValuation || null},'') RETURNING id, transaction_key`);
        if (upd.rows.length > 0) {
          return NextResponse.json({ success: true, autoPostingRule: upd.rows[0], code: 'FAUC', message: `Auto posting ${rawKey} (${mappedKey}) -> ${finalGl} updated – FAUC legal-safe`, legalSafe: true });
        }
      }
      return NextResponse.json({ success: true, autoPostingRule: res.rows[0] || { transaction_key: mappedKey }, code: 'FAUC', message: `Auto posting ${rawKey} (${mappedKey}) -> ${finalGl} created – FAUC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('fin_auto_posting_rule insert failed fallback fin_auto_posting_rule:', newErr.message);
      const g = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number = ${finalGl} LIMIT 1`);
      if (g.rows.length === 0) return NextResponse.json({ error: `G/L ${finalGl} not found` }, { status: 404 });
      const glId = (g.rows[0] as any).id;

      const res = await db.execute(sql`
        INSERT INTO fin_auto_posting_rule (company_code_id, transaction_key, valuation_class, gl_account_id, description)
        VALUES (${companyCodeId}, ${transaction_key.toUpperCase()}, ${finalValuation || null}, ${glId}, ${description || null})
        ON CONFLICT (company_code_id, transaction_key, valuation_class) DO UPDATE SET gl_account_id = ${glId}, description = ${description || null}
        RETURNING id, transaction_key
      `);
      return NextResponse.json({ success: true, autoPostingRule: res.rows[0], code: 'FAUC', message: `Auto posting ${transaction_key} -> ${finalGl} created – FAUC (legacy OBYC) legacy (migrating to FAUC)`, legalSafe: false });
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
        const g = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number = ${finalGl} LIMIT 1`);
        if (g.rows.length > 0) glId = (g.rows[0] as any).id;
      }
      if (!glId) return NextResponse.json({ error: `G/L ${finalGl} not found` }, { status: 404 });

      const res = await db.execute(sql`UPDATE fin_auto_posting_rule SET ledger_account_id = ${glId}, updated_at = NOW() WHERE id = ${id} RETURNING id, transaction_key`);
      if (res.rows.length === 0) throw new Error('Not found in fin_auto_posting_rule');
      return NextResponse.json({ success: true, autoPostingRule: res.rows[0], code: 'FAUC', message: `Auto posting ${res.rows[0].transaction_key} updated -> ${finalGl} – FAUC legal-safe` });
    } catch {
      const g = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number = ${finalGl} LIMIT 1`);
      if (g.rows.length === 0) return NextResponse.json({ error: `G/L ${finalGl} not found` }, { status: 404 });
      const glId = (g.rows[0] as any).id;

      const res = await db.execute(sql`UPDATE fin_auto_posting_rule SET gl_account_id = ${glId} WHERE id = ${id} RETURNING id, transaction_key`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Auto posting not found' }, { status: 404 });
      return NextResponse.json({ success: true, autoPostingRule: res.rows[0], message: `Auto posting ${res.rows[0].transaction_key} updated -> ${finalGl} – FAUC (legacy OBYC) legacy` });
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
      await db.execute(sql`DELETE FROM fin_auto_posting_rule WHERE id = ${id}`);
    }

    return NextResponse.json({ success: true, code: 'FAUC', message: `Auto posting ${id} deleted – FAUC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
