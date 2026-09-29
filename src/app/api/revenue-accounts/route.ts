import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Revenue Account Determination – VKOA – T0 BLOCKING – No Dangling
 * Condition technique: chart + sales org + customer group + material group + account assignment group → GL account (KOFI/KOFK)
 * Strict usage: Billing VF01 needs to find revenue GL via VKOA, otherwise cannot post Dr AR Cr Revenue
 * Used in: POST /api/billing – determineRevenueAccount() – searches fin_revenue_account with fallback logic
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    try {
      const res = await db.execute(sql`SELECT * FROM fin_revenue_account ORDER BY chart_of_accounts, transaction_key, sales_org, customer_group, material_group`);
      rows = res.rows as any[];
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS fin_revenue_account (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            chart_of_accounts VARCHAR(10) NOT NULL,
            sales_org VARCHAR(20),
            customer_group VARCHAR(20),
            material_group VARCHAR(20),
            account_assignment_group VARCHAR(20),
            transaction_key VARCHAR(10) NOT NULL,
            gl_account VARCHAR(20) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(chart_of_accounts, COALESCE(sales_org,''), COALESCE(customer_group,''), COALESCE(material_group,''), COALESCE(account_assignment_group,''), transaction_key)
          )
        `);
        await db.execute(sql`
          INSERT INTO fin_revenue_account (chart_of_accounts, sales_org, customer_group, material_group, account_assignment_group, transaction_key, gl_account, description) VALUES
          ('KSCA', '1000', '01', '01', '01', 'KOFI', '3000000001', 'Revenue domestic – chart KSCA + sales org 1000 + cust grp 01 + mat grp 01 + acct assign 01 → 3000000001 – T0 BLOCKING VKOA – used in VF01'),
          ('KSCA', '', '', '', '', 'KOFI', '3000000001', 'Revenue default fallback – T0'),
          ('KSCA', '1000', '01', '01', '01', 'KOFK', '3000000003', 'Revenue KOFK with account assignment')
          ON CONFLICT (chart_of_accounts, COALESCE(sales_org,''), COALESCE(customer_group,''), COALESCE(material_group,''), COALESCE(account_assignment_group,''), transaction_key) DO NOTHING
        `);
        const res = await db.execute(sql`SELECT * FROM fin_revenue_account ORDER BY chart_of_accounts`);
        rows = res.rows as any[];
      } else throw e;
    }

    return NextResponse.json({
      data: rows,
      revenueAccounts: rows,
      count: rows.length,
      code: 'VKOA',
      aliasCodes: ['VKOA', 'FIN-REV-CR'],
      table: 'fin_revenue_account',
      functionDescription: 'Revenue Account Determination – VKOA – T0 BLOCKING – chart + sales org + customer group + material group + account assignment → GL (KOFI/KOFK) – used in billing VF01 – NO DANGLING',
      usage: {
        KOFI: 'Revenue determination without account assignment – used in standard billing F2',
        KOFK: 'Revenue with account assignment – used in billing with account assignment',
        fallback: 'Search order: exact match chart+sales org+cust grp+mat grp+acct assign → chart+sales org → chart only → default'
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
    const { chart_of_accounts, sales_org, customer_group, material_group, account_assignment_group, transaction_key, gl_account, description } = body;
    if (!chart_of_accounts || !transaction_key || !gl_account) {
      return NextResponse.json({ error: 'chart_of_accounts, transaction_key (KOFI/KOFK), gl_account required – e.g., KSCA, KOFI, 3000000001' }, { status: 400 });
    }

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_revenue_account (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chart_of_accounts VARCHAR(10) NOT NULL,
        sales_org VARCHAR(20),
        customer_group VARCHAR(20),
        material_group VARCHAR(20),
        account_assignment_group VARCHAR(20),
        transaction_key VARCHAR(10) NOT NULL,
        gl_account VARCHAR(20) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(chart_of_accounts, COALESCE(sales_org,''), COALESCE(customer_group,''), COALESCE(material_group,''), COALESCE(account_assignment_group,''), transaction_key)
      )
    `);

    // Validate GL exists
    try {
      const glCheck = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number = ${gl_account} LIMIT 1`);
      if (glCheck.rows.length === 0) {
        const glCheck2 = await db.execute(sql`SELECT id FROM ent_gl_account WHERE account_number = ${gl_account} LIMIT 1`);
        if (glCheck2.rows.length === 0) {
          return NextResponse.json({ error: `GL Account ${gl_account} not found – create via FGLC/FS00 first` }, { status: 400 });
        }
      }
    } catch {}

    const res = await db.execute(sql`
      INSERT INTO fin_revenue_account (chart_of_accounts, sales_org, customer_group, material_group, account_assignment_group, transaction_key, gl_account, description)
      VALUES (${chart_of_accounts.toUpperCase()}, ${sales_org || null}, ${customer_group || null}, ${material_group || null}, ${account_assignment_group || null}, ${transaction_key.toUpperCase()}, ${gl_account}, ${description || null})
      ON CONFLICT (chart_of_accounts, COALESCE(sales_org,''), COALESCE(customer_group,''), COALESCE(material_group,''), COALESCE(account_assignment_group,''), transaction_key) DO UPDATE SET gl_account = ${gl_account}, description = ${description || null}, updated_at = NOW()
      RETURNING id, chart_of_accounts, transaction_key, gl_account
    `);

    return NextResponse.json({ success: true, revenueAccount: res.rows[0], message: `Revenue Account ${chart_of_accounts}/${transaction_key}/${sales_org || ''}/${customer_group || ''}/${material_group || ''} → ${gl_account} created – VKOA – T0 BLOCKING` });
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

    const res = await db.execute(sql`UPDATE fin_revenue_account SET gl_account = COALESCE(${gl_account}, gl_account), description = COALESCE(${description}, description), updated_at = NOW() WHERE id = ${id} RETURNING id, chart_of_accounts, gl_account`);
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, revenueAccount: res.rows[0] });
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
    await db.execute(sql`DELETE FROM fin_revenue_account WHERE id = ${id}`);
    return NextResponse.json({ success: true, message: `Revenue Account ${id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
