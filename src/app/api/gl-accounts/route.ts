import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * G/L Accounts API - FS00, OB13, OB62, OBD4, OB53
 * GET /api/gl-accounts - List G/L accounts with CoA, account groups, auto determination
 * POST /api/gl-accounts - Create G/L account
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const coaCode = searchParams.get('coaCode') || searchParams.get('companyCode') || 'ALL';
  const search = searchParams.get('search') || '';

  try {
    let query = sql`
      SELECT 
        gl.id, gl.account_number, gl.name, gl.account_type, gl.is_balance_sheet, gl.is_reconciliation, gl.is_tax_relevant, gl.is_blocked,
        coa.code as coa_code, coa.name as coa_name,
        (SELECT COUNT(*) FROM fi_auto_account_determination WHERE gl_account_id = gl.id) as auto_det_count
      FROM fi_gl_account gl
      JOIN fi_chart_of_accounts coa ON gl.coa_id = coa.id
      WHERE 1=1
    `;
    if (coaCode && coaCode !== 'ALL') {
      // coaCode can be company code or CoA code
      query = sql`${query} AND (coa.code = ${coaCode} OR EXISTS (SELECT 1 FROM ent_company_code cc WHERE cc.coa_id = coa.id AND cc.code = ${coaCode}))`;
    }
    if (search) {
      query = sql`${query} AND (gl.account_number ILIKE ${`%${search}%`} OR gl.name ILIKE ${`%${search}%`})`;
    }
    query = sql`${query} ORDER BY gl.account_number LIMIT 500`;

    const result = await db.execute(query);

    // CoAs
    const coasRes = await db.execute(sql`SELECT id, code, name, description FROM fi_chart_of_accounts ORDER BY code`);
    // Account Groups
    let accountGroups: any[] = [];
    try {
      const ag = await db.execute(sql`SELECT coa_id, code, name, from_account, to_account FROM fi_account_group ORDER BY code`);
      accountGroups = ag.rows;
    } catch {}
    // Retained Earnings
    let retainedEarnings: any[] = [];
    try {
      const re = await db.execute(sql`SELECT * FROM fi_retained_earnings LIMIT 20`);
      retainedEarnings = re.rows;
    } catch {
      try {
        const re2 = await db.execute(sql`SELECT coa_id, account_number FROM fi_gl_account WHERE account_number = '2500000001' LIMIT 1`);
        retainedEarnings = re2.rows;
      } catch {}
    }
    // Auto Account Determination
    let autoDet: any[] = [];
    try {
      const ad = await db.execute(sql`
        SELECT aad.company_code_id, cc.code as company_code, aad.transaction_key, aad.valuation_class, gl.account_number, gl.name as gl_name, aad.description
        FROM fi_auto_account_determination aad
        JOIN fi_gl_account gl ON aad.gl_account_id = gl.id
        JOIN ent_company_code cc ON aad.company_code_id = cc.id
        ORDER BY cc.code, aad.transaction_key
        LIMIT 100
      `);
      autoDet = ad.rows;
    } catch {}

    return NextResponse.json({
      glAccounts: result.rows,
      count: result.rows.length,
      charts: coasRes.rows,
      accountGroups,
      retainedEarnings,
      autoAccountDetermination: autoDet,
      source: 'db',
      configurable: true, helperCode: 'FS00',
      functionMapping: {
        'OB13': 'Edit Chart of Accounts List – General CoA INT/KSCA/CAUS/GKR/YIN',
        'OB62': 'Assign Company Code to Chart of Accounts – OX02->OB13',
        'OBD4': 'G/L Account Groups – KASS/KLIA/KREV/KEXP/KMAT/KREC/KTAX/KCSH – configurable',
        'OB53': 'Retained Earnings Account – 2500000001 – P&L carry forward',
        'FS00': 'G/L Account Master – Create/Edit/Display G/L – configurable, secure delete blocked if has FI postings',
        'FS01': 'Create G/L Account – FS00 variant',
        'FS02': 'Change G/L Account – FS00 edit',
        'FS03': 'Display G/L Account',
        'OBYC': 'Automatic Posting – BSX Inventory, WRX GR/IR, PRD Price Diff, GBB Consumption',
      },
      erpDefaults: {
        INT: ['100000 Inventory ROH BSX', '100001 Inventory FERT BSX', '200000 GR/IR WRX', '210000 AP Vendor K', '120000 AR Customer D', '220000 Output Tax', '2500000001 Retained Earnings OB53'],
        KSCA: ['5000000001 Raw Materials Stock KMAT BSX – Code FS00', '5000000002 Finished Goods Stock BSX', '5000000003 GR/IR Clearing WRX Open Item', '5000000004 Stock in Transit BSV', '5000000005 Price Difference PRD P&L', '5000000006 Material Consumption GBB P&L', '2500000001 Retained Earnings OB53'],
        CAUS: ['100000 Cash', '120000 AR', '140000 Inventory ROH', '200000 GR/IR', '300000 Revenue', '400000 COGS'],
        GKR: ['160000 Rohstoffe', '220000 Fertige Erzeugnisse', '400000 Umsatzerlöse'],
      },
      ks01Mapping: 'KSCA Chart: 5000000001 Raw Mat Stock KMAT BS, 5000000002 FG Stock, 5000000003 GR/IR Clearing Open Item, 5000000004 Stock in Transit, 5000000005 Price Diff P&L, 5000000006 Consumption P&L – Code FS00 – General CoA available like ERP',
      explanation: 'G/L accounts configurable – FS00 – ERP-like defaults for INT/KSCA/CAUS/GKR/YIN – each CoA has corresponding accounts. Secure delete blocked if FI postings exist.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, glAccounts: [], source: 'error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { coa_code, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant, account_group } = body;
    if (!coa_code || !account_number || !name) return NextResponse.json({ error: 'coa_code, account_number, name required' }, { status: 400 });

    const coaRes = await db.execute(sql`SELECT id FROM fi_chart_of_accounts WHERE code = ${coa_code} LIMIT 1`);
    if (coaRes.rows.length === 0) return NextResponse.json({ error: `CoA ${coa_code} not found` }, { status: 404 });
    const coaId = (coaRes.rows[0] as any).id;

    const res = await db.execute(sql`
      INSERT INTO fi_gl_account (coa_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant, account_group)
      VALUES (${coaId}, ${account_number}, ${name}, ${account_type || 'ASSET'}, ${is_balance_sheet ?? true}, ${is_reconciliation ?? false}, ${is_tax_relevant ?? false}, ${account_group || null})
      ON CONFLICT (coa_id, account_number) DO UPDATE SET name = ${name}, account_type = ${account_type || 'ASSET'}, account_group = ${account_group || null}
      RETURNING id, account_number
    `).catch(async () => {
      // Fallback without account_group column if not exists
      return await db.execute(sql`
        INSERT INTO fi_gl_account (coa_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant)
        VALUES (${coaId}, ${account_number}, ${name}, ${account_type || 'ASSET'}, ${is_balance_sheet ?? true}, ${is_reconciliation ?? false}, ${is_tax_relevant ?? false})
        ON CONFLICT DO NOTHING
        RETURNING id, account_number
      `);
    });

    return NextResponse.json({ success: true, glAccount: res.rows[0], message: `G/L ${account_number} ${name} created in CoA ${coa_code} (FS00)` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, account_number, name, account_type, is_blocked, account_group } = body;
    if (!id && !account_number) return NextResponse.json({ error: 'id or account_number required' }, { status: 400 });

    let res;
    if (id) {
      res = await db.execute(sql`
        UPDATE fi_gl_account SET
          name = COALESCE(${name}, name),
          account_type = COALESCE(${account_type}, account_type),
          is_blocked = COALESCE(${is_blocked}, is_blocked),
          account_group = COALESCE(${account_group}, account_group)
        WHERE id = ${id}
        RETURNING id, account_number, name
      `).catch(async () => {
        return await db.execute(sql`
          UPDATE fi_gl_account SET name = COALESCE(${name}, name), account_type = COALESCE(${account_type}, account_type), is_blocked = COALESCE(${is_blocked}, is_blocked)
          WHERE id = ${id} RETURNING id, account_number, name
        `);
      });
    } else {
      res = await db.execute(sql`
        UPDATE fi_gl_account SET
          name = COALESCE(${name}, name),
          account_type = COALESCE(${account_type}, account_type),
          is_blocked = COALESCE(${is_blocked}, is_blocked),
          account_group = COALESCE(${account_group}, account_group)
        WHERE account_number = ${account_number}
        RETURNING id, account_number, name
      `).catch(async () => {
        return await db.execute(sql`
          UPDATE fi_gl_account SET name = COALESCE(${name}, name), account_type = COALESCE(${account_type}, account_type), is_blocked = COALESCE(${is_blocked}, is_blocked)
          WHERE account_number = ${account_number} RETURNING id, account_number, name
        `);
      });
    }

    if (res.rows.length === 0) return NextResponse.json({ error: 'G/L account not found' }, { status: 404 });
    return NextResponse.json({ success: true, glAccount: res.rows[0], message: `G/L ${res.rows[0].account_number} updated (FS00)` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const account_number = searchParams.get('account_number');
    const id = searchParams.get('id');
    if (!account_number && !id) return NextResponse.json({ error: 'account_number or id required' }, { status: 400 });

    // SECURITY: Check if G/L has FI postings – block hard delete
    let glId = id;
    let accNum = account_number;
    if (!glId && accNum) {
      const r = await db.execute(sql`SELECT id, account_number FROM fi_gl_account WHERE account_number = ${accNum} LIMIT 1`);
      if (r.rows.length > 0) { glId = (r.rows[0] as any).id; accNum = (r.rows[0] as any).account_number; }
    }

    let fiCount = 0;
    try {
      if (glId) {
        const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM fi_document_line WHERE gl_account_id = ${glId}`);
        fiCount = parseInt((r.rows[0] as any).cnt || '0');
      }
    } catch {}

    let autoCount = 0;
    try {
      if (glId) {
        const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM fi_auto_account_determination WHERE gl_account_id = ${glId}`);
        autoCount = parseInt((r.rows[0] as any).cnt || '0');
      }
    } catch {}

    if (fiCount > 0) {
      // Soft delete – block
      if (glId) await db.execute(sql`UPDATE fi_gl_account SET is_blocked = true WHERE id = ${glId}`);
      return NextResponse.json({
        error: `Cannot delete – G/L ${accNum} has ${fiCount} postings and cannot be deleted to maintain audit trail. Blocked instead.`,
        code: 'HAS_TRANSACTIONS',
        fiCount,
      }, { status: 400 });
    }

    if (autoCount > 0) {
      return NextResponse.json({
        error: `Cannot delete – G/L ${accNum} is used in ${autoCount} auto account determinations and cannot be deleted. Remove determination first.`,
        code: 'HAS_AUTO_DET',
        autoCount,
      }, { status: 400 });
    }

    if (glId) await db.execute(sql`DELETE FROM fi_gl_account WHERE id = ${glId}`);
    else if (accNum) await db.execute(sql`DELETE FROM fi_gl_account WHERE account_number = ${accNum}`);

    return NextResponse.json({ success: true, message: `G/L ${accNum || glId} deleted (FS00) – only allowed when no FI postings` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
