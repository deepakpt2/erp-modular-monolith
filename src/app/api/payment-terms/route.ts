import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Payment Terms – General ERP terminology
 * Defines payment terms – e.g., NT30 Net 30, 2% 10 Net 30, etc. – used in PO, SO, IV, Billing
 * Strict usage: When PO created with payment term NT30, due date = posting date + 30 days – used for aging, cash flow
 * Table: fin_payment_term
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    try {
      const res = await db.execute(sql`SELECT * FROM fin_payment_term ORDER BY code`);
      rows = res.rows as any[];
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS fin_payment_term (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            days INT NOT NULL DEFAULT 0,
            discount_percent NUMERIC(5,2) DEFAULT 0,
            discount_days INT DEFAULT 0,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);
        await db.execute(sql`
          INSERT INTO fin_payment_term (code, name, days, discount_percent, discount_days, description) VALUES
          ('NT30', 'Net 30 Days', 30, 0, 0, 'Payment due 30 days from invoice date'),
          ('NT15', 'Net 15 Days', 15, 0, 0, 'Payment due 15 days'),
          ('NT60', 'Net 60 Days', 60, 0, 0, 'Payment due 60 days'),
          ('2-10-N30', '2% Discount 10 Days Net 30', 30, 2, 10, '2% discount if paid within 10 days, net 30'),
          ('IMMED', 'Immediate', 0, 0, 0, 'Immediate payment')
          ON CONFLICT (code) DO NOTHING
        `);
        const res = await db.execute(sql`SELECT * FROM fin_payment_term ORDER BY code`);
        rows = res.rows as any[];
      } else throw e;
    }

    return NextResponse.json({
      data: rows,
      paymentTerms: rows,
      count: rows.length,
      code: 'FAPT',
      table: 'fin_payment_term',
      functionDescription: 'Payment Terms – defines due date calculation – strict usage: PO/SO/IV/Billing uses payment term to calculate due date',
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
    const { code, name, days, discount_percent, discount_days, description } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_payment_term (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        days INT NOT NULL DEFAULT 0,
        discount_percent NUMERIC(5,2) DEFAULT 0,
        discount_days INT DEFAULT 0,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const res = await db.execute(sql`
      INSERT INTO fin_payment_term (code, name, days, discount_percent, discount_days, description)
      VALUES (${code.toUpperCase()}, ${name}, ${days || 0}, ${discount_percent || 0}, ${discount_days || 0}, ${description || null})
      ON CONFLICT (code) DO UPDATE SET name = ${name}, days = ${days || 0}, discount_percent = ${discount_percent || 0}, discount_days = ${discount_days || 0}, description = ${description || null}, updated_at = NOW()
      RETURNING id, code, name, days
    `);

    return NextResponse.json({ success: true, paymentTerm: res.rows[0], message: `Payment Term ${code.toUpperCase()} created – FAPT` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, code, name, days, discount_percent, discount_days, description } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    let res;
    if (id) res = await db.execute(sql`UPDATE fin_payment_term SET name = COALESCE(${name}, name), days = COALESCE(${days}, days), discount_percent = COALESCE(${discount_percent}, discount_percent), discount_days = COALESCE(${discount_days}, discount_days), description = COALESCE(${description}, description), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name`);
    else res = await db.execute(sql`UPDATE fin_payment_term SET name = COALESCE(${name}, name), days = COALESCE(${days}, days), discount_percent = COALESCE(${discount_percent}, discount_percent), discount_days = COALESCE(${discount_days}, discount_days), description = COALESCE(${description}, description), updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);

    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, paymentTerm: res.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code')?.toUpperCase();
    const id = searchParams.get('id');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    if (id) await db.execute(sql`DELETE FROM fin_payment_term WHERE id = ${id}`);
    else await db.execute(sql`DELETE FROM fin_payment_term WHERE code = ${code}`);

    return NextResponse.json({ success: true, message: `Payment Term ${code || id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
