import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Account Groups API – GL Account Groups configurable (OBD4)
 * Groups like KASS Assets, KLIA Liabilities, KREV Revenue, KEXP Expenses, KMAT Material, KREC Recon, KTAX Tax, KCSH Cash
 * You can add new groups or edit current
 * Storage: fi_account_group or ent_account_group – we try both
 */

async function ensureTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fi_account_group (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    const cnt = await db.execute(sql`SELECT COUNT(*) as c FROM fi_account_group`);
    if (parseInt((cnt.rows[0] as any).c || '0') === 0) {
      await db.execute(sql`
        INSERT INTO fi_account_group (code, name, description) VALUES
        ('KASS', 'Assets', 'Balance Sheet Assets 100000-199999'),
        ('KLIA', 'Liabilities', 'Balance Sheet Liabilities 200000-299999'),
        ('KREV', 'Revenue', 'P&L Revenue 400000-499999'),
        ('KEXP', 'Expenses', 'P&L Expenses 500000-599999'),
        ('KMAT', 'Material Stock', 'Material Stock Accounts 5000000001-5000000006'),
        ('KREC', 'Reconciliation', 'Recon Accounts AR/AP'),
        ('KTAX', 'Tax', 'Tax Accounts'),
        ('KCSH', 'Cash', 'Cash/Bank Accounts')
        ON CONFLICT (code) DO NOTHING
      `);
    }
  } catch (e) {
    console.warn('ensure fi_account_group failed', e);
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTable();

  try {
    const res = await db.execute(sql`SELECT id, code, name, description, created_at FROM fi_account_group ORDER BY code`);
    // Also get G/L count per group if possible
    let glCounts: any[] = [];
    try {
      const r = await db.execute(sql`SELECT account_group, COUNT(*) as cnt FROM fi_gl_account GROUP BY account_group`);
      glCounts = r.rows;
    } catch {}

    return NextResponse.json({
      accountGroups: res.rows,
      glCounts,
      count: res.rows.length,
      configurable: true, helperCode: 'OBD4',
      functionDescription: 'G/L Account Groups – ERP OBD4 – Groups like KASS/KLIA/KREV/KEXP/KMAT/KREC/KTAX/KCSH – configurable, ERP standard groups',
      erpDefaults: [
        { code: 'KASS', name: 'Assets', range: '1000000000-1999999999', helperCode: 'OBD4' },
        { code: 'KLIA', name: 'Liabilities', range: '2000000000-2999999999', helperCode: 'OBD4' },
        { code: 'KREV', name: 'Revenue', range: '3000000000-3999999999', helperCode: 'OBD4' },
        { code: 'KEXP', name: 'Expenses', range: '4000000000-4999999999', helperCode: 'OBD4' },
        { code: 'KMAT', name: 'Material Stock', range: '5000000000-5999999999', helperCode: 'OBD4', note: '5000000001 ROH, 5000000002 FERT, 5000000003 GR/IR WRX' },
        { code: 'KREC', name: 'Reconciliation', range: '6000000000-6999999999', helperCode: 'OBD4' },
        { code: 'KTAX', name: 'Tax', range: '7000000000-7999999999', helperCode: 'OBD4' },
        { code: 'KCSH', name: 'Cash/Bank', range: '8000000000-8999999999', helperCode: 'OBD4' },
      ],
      explanation: 'Account Groups configurable (OBD4) – e.g., KASS Assets, KMAT Material. Add new via POST. Used to group G/L accounts in FS00. Code OBD4.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTable();

  try {
    const body = await req.json();
    const { code, name, description } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    const res = await db.execute(sql`
      INSERT INTO fi_account_group (code, name, description)
      VALUES (${code.toUpperCase()}, ${name}, ${description || null})
      ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}
      RETURNING id, code, name
    `);

    return NextResponse.json({ success: true, accountGroup: res.rows[0], message: `Account Group ${code.toUpperCase()} created/updated` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTable();

  try {
    const body = await req.json();
    const { id, code, name, description } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    let res;
    if (id) {
      res = await db.execute(sql`UPDATE fi_account_group SET code = COALESCE(${code?.toUpperCase()}, code), name = COALESCE(${name}, name), description = COALESCE(${description}, description) WHERE id = ${id} RETURNING id, code, name`);
    } else {
      res = await db.execute(sql`UPDATE fi_account_group SET name = COALESCE(${name}, name), description = COALESCE(${description}, description) WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
    }

    if (res.rows.length === 0) return NextResponse.json({ error: 'Account group not found' }, { status: 404 });
    return NextResponse.json({ success: true, accountGroup: res.rows[0] });
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

    // Check if has G/L accounts
    let inUse = 0;
    try {
      if (code) {
        const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM fi_gl_account WHERE account_group = ${code.toUpperCase()}`);
        inUse = parseInt((r.rows[0] as any).cnt || '0');
      }
    } catch {}

    if (inUse > 0) {
      return NextResponse.json({ error: `Cannot delete – account group ${code} has ${inUse} G/L accounts and cannot be deleted to maintain audit trail.`, code: 'HAS_GL' }, { status: 400 });
    }

    if (id) await db.execute(sql`DELETE FROM fi_account_group WHERE id = ${id}`);
    else await db.execute(sql`DELETE FROM fi_account_group WHERE code = ${code?.toUpperCase()}`);

    return NextResponse.json({ success: true, message: `Account Group ${code || id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
