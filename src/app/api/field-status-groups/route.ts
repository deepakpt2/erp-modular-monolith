import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Field Status Groups – General ERP terminology (was OBC5 in SAP)
 * Defines which fields are required/suppressed/optional per GL account group and posting
 * Strict usage: When posting to GL account, checks field status group – e.g., cost center required for expense GL, suppressed for cash
 * Table: fin_field_status_group – variant_code, group_code, field_name, status (R required, S suppressed, O optional, D display)
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    try {
      const res = await db.execute(sql`SELECT * FROM fin_field_status_group ORDER BY variant_code, group_code, field_name`);
      rows = res.rows as any[];
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS fin_field_status_group (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            variant_code VARCHAR(20) NOT NULL,
            group_code VARCHAR(20) NOT NULL,
            field_name VARCHAR(50) NOT NULL,
            status VARCHAR(1) NOT NULL CHECK (status IN ('R','S','O','D')),
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(variant_code, group_code, field_name)
          )
        `);
        // Insert defaults
        await db.execute(sql`
          INSERT INTO fin_field_status_group (variant_code, group_code, field_name, status, description) VALUES
          ('1000', 'G001', 'cost_center', 'R', 'Cost center required for expense accounts'),
          ('1000', 'G001', 'profit_center', 'O', 'Profit center optional for expense'),
          ('1000', 'G002', 'cost_center', 'S', 'Cost center suppressed for cash accounts'),
          ('1000', 'G002', 'profit_center', 'S', 'Profit center suppressed for cash')
          ON CONFLICT (variant_code, group_code, field_name) DO NOTHING
        `);
        const res = await db.execute(sql`SELECT * FROM fin_field_status_group ORDER BY variant_code, group_code, field_name`);
        rows = res.rows as any[];
      } else throw e;
    }

    return NextResponse.json({
      data: rows,
      fieldStatusGroups: rows,
      count: rows.length,
      code: 'OBC5',
      table: 'fin_field_status_group',
      functionDescription: 'Field Status Groups – defines field requirements per GL group – strict usage: validates cost_center required/suppressed per GL posting',
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
    const { variant_code, group_code, field_name, status, description } = body;
    if (!variant_code || !group_code || !field_name || !status) return NextResponse.json({ error: 'variant_code, group_code, field_name, status required – status R/S/O/D' }, { status: 400 });

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_field_status_group (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        variant_code VARCHAR(20) NOT NULL,
        group_code VARCHAR(20) NOT NULL,
        field_name VARCHAR(50) NOT NULL,
        status VARCHAR(1) NOT NULL CHECK (status IN ('R','S','O','D')),
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(variant_code, group_code, field_name)
      )
    `);

    // Validate variant exists
    const varCheck = await db.execute(sql`SELECT id FROM fin_field_status_variant WHERE code = ${variant_code.toUpperCase()} LIMIT 1`);
    if (varCheck.rows.length === 0) {
      return NextResponse.json({ error: `Field Status Variant ${variant_code} not found – create via OBC4 first` }, { status: 400 });
    }

    const res = await db.execute(sql`
      INSERT INTO fin_field_status_group (variant_code, group_code, field_name, status, description)
      VALUES (${variant_code.toUpperCase()}, ${group_code.toUpperCase()}, ${field_name}, ${status.toUpperCase()}, ${description || null})
      ON CONFLICT (variant_code, group_code, field_name) DO UPDATE SET status = ${status.toUpperCase()}, description = ${description || null}, updated_at = NOW()
      RETURNING id, variant_code, group_code, field_name, status
    `);

    return NextResponse.json({ success: true, fieldStatusGroup: res.rows[0], message: `Field Status Group ${variant_code}/${group_code}/${field_name} = ${status} created – OBC5` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, status, description } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const res = await db.execute(sql`UPDATE fin_field_status_group SET status = COALESCE(${status?.toUpperCase()}, status), description = COALESCE(${description}, description), updated_at = NOW() WHERE id = ${id} RETURNING id, variant_code, group_code, field_name, status`);
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, fieldStatusGroup: res.rows[0] });
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
    await db.execute(sql`DELETE FROM fin_field_status_group WHERE id = ${id}`);
    return NextResponse.json({ success: true, message: `Field Status Group ${id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
