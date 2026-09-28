import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Chart of Accounts API – CoA configurable
 * You can add new CoA or edit current one
 * Storage: fi_chart_of_accounts
 * Example: KSCA Kerala Spices Chart, INT International CoA
 * Each CoA has account groups (OBD4) and G/L accounts (FS00)
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const coaRes = await db.execute(sql`
      SELECT id, code, name, description, created_at,
        (SELECT COUNT(*) FROM fi_gl_account WHERE coa_id = fi_chart_of_accounts.id) as gl_count
      FROM fi_chart_of_accounts ORDER BY code
    `);

    // Account groups
    let groups: any[] = [];
    try {
      const g = await db.execute(sql`SELECT id, code, name, description FROM fi_account_group ORDER BY code`);
      groups = g.rows;
    } catch {
      // Fallback if table named differently
      try {
        const g2 = await db.execute(sql`SELECT id, code, name FROM fi_account_group ORDER BY code`);
        groups = g2.rows;
      } catch {}
    }

    return NextResponse.json({
      chartOfAccounts: coaRes.rows,
      accountGroups: groups,
      count: coaRes.rows.length,
      configurable: true, helperCode: 'OB13',
      functionDescription: 'Edit Chart of Accounts List – ERP OB13 – General CoA available like ERP: INT, KSCA, CAUS, GKR, YIN – each with corresponding G/L accounts FS00',
      erpDefaults: [
        { code: 'INT', name: 'International CoA', helperCode: 'OB13', gl: '100000-500005, 2500000001 Retained Earnings', type: 'General CoA – ERP standard INT' },
        { code: 'KSCA', name: 'Kerala Spices Chart', helperCode: 'OB13', gl: '5000000001 Raw Mat, 5000000002 FG, 5000000003 GR/IR, 5000000004 Transit, 5000000005 Price Diff, 5000000006 Consumption, 2500000001 Retained OB53', type: 'General CoA custom – like ERP KSCA' },
        { code: 'CAUS', name: 'Chart of Accounts USA', helperCode: 'OB13', gl: '100000 Cash, 120000 AR, 140000 Inventory ROH, 200000 GR/IR, 300000 Revenue, 400000 COGS', type: 'General CoA USA – ERP standard CAUS' },
        { code: 'GKR', name: 'German Community Chart', helperCode: 'OB13', gl: '160000 Rohstoffe, 220000 Fertige, 400000 Umsatz, 500000 Materialaufwand', type: 'General CoA Germany – ERP standard GKR' },
        { code: 'YIN', name: 'Indian Chart GST', helperCode: 'OB13', gl: '100000 Inventory, 700000 CGST/SGST Input, 200001 CGST Payable, GST', type: 'General CoA India – ERP standard YIN' },
      ],
      explanation: 'CoA configurable – add new CoA via POST, e.g., KSCA, INT, TEST. Each CoA can have G/L accounts via /api/gl-accounts and account groups. Code OB13. General CoA and its corresponding accounts available like in ERP – INT/CAUS/GKR/YIN/KSCA with FS00 accounts.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { code, name, description } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    const res = await db.execute(sql`
      INSERT INTO fi_chart_of_accounts (code, name, description)
      VALUES (${code.toUpperCase()}, ${name}, ${description || null})
      ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}
      RETURNING id, code, name
    `);

    return NextResponse.json({ success: true, coa: res.rows[0], message: `Chart of Accounts ${code.toUpperCase()} created/updated` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, code, name, description } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    let res;
    if (id) {
      res = await db.execute(sql`
        UPDATE fi_chart_of_accounts SET code = COALESCE(${code?.toUpperCase()}, code), name = COALESCE(${name}, name), description = COALESCE(${description}, description)
        WHERE id = ${id} RETURNING id, code, name
      `);
    } else {
      res = await db.execute(sql`
        UPDATE fi_chart_of_accounts SET name = COALESCE(${name}, name), description = COALESCE(${description}, description)
        WHERE code = ${code.toUpperCase()} RETURNING id, code, name
      `);
    }

    if (res.rows.length === 0) return NextResponse.json({ error: 'CoA not found' }, { status: 404 });
    return NextResponse.json({ success: true, coa: res.rows[0], message: `CoA ${res.rows[0].code} updated` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const id = searchParams.get('id');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    // Check if has G/L accounts – security: block hard delete if has transactions
    let glCount = 0;
    let fiCount = 0;
    try {
      if (code) {
        const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM fi_gl_account WHERE coa_id = (SELECT id FROM fi_chart_of_accounts WHERE code = ${code.toUpperCase()})`);
        glCount = parseInt((r.rows[0] as any).cnt || '0');
      }
    } catch {}
    try {
      if (code) {
        const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM fi_document_line WHERE gl_account_id IN (SELECT id FROM fi_gl_account WHERE coa_id = (SELECT id FROM fi_chart_of_accounts WHERE code = ${code.toUpperCase()}))`);
        fiCount = parseInt((r.rows[0] as any).cnt || '0');
      }
    } catch {}

    if (fiCount > 0) {
      return NextResponse.json({
        error: `CoA ${code} has ${fiCount} FI postings – cannot be deleted for security/audit. Deactivate or archive instead.`,
        code: 'HAS_TRANSACTIONS',
        glCount,
        fiCount,
        security: 'Hard delete blocked when FI transactions exist to prevent orphaned docs',
      }, { status: 400 });
    }

    if (glCount > 0) {
      return NextResponse.json({
        error: `CoA ${code} has ${glCount} G/L accounts – delete G/Ls first or deactivate CoA.`,
        code: 'HAS_GL',
        glCount,
      }, { status: 400 });
    }

    if (id) await db.execute(sql`DELETE FROM fi_chart_of_accounts WHERE id = ${id}`);
    else await db.execute(sql`DELETE FROM fi_chart_of_accounts WHERE code = ${code?.toUpperCase()}`);

    return NextResponse.json({ success: true, message: `CoA ${code || id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
