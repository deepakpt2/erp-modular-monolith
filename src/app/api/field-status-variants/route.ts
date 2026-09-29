import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Field Status Variant – General ERP terminology (was OBC4 in SAP)
 * Defines variant that groups field status groups – e.g., 1000 = Standard
 * Strict usage: Assigned to company code, controls which fields are required/suppressed per GL account and posting key
 * Table: fin_field_status_variant
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    try {
      const res = await db.execute(sql`SELECT * FROM fin_field_status_variant ORDER BY code`);
      rows = res.rows as any[];
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        // Create table if not exists
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS fin_field_status_variant (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);
        // Insert default
        await db.execute(sql`
          INSERT INTO fin_field_status_variant (code, name, description)
          VALUES ('1000', 'Standard Field Status', 'Standard variant – controls required/suppressed fields per GL')
          ON CONFLICT (code) DO NOTHING
        `);
        const res = await db.execute(sql`SELECT * FROM fin_field_status_variant ORDER BY code`);
        rows = res.rows as any[];
      } else {
        throw e;
      }
    }

    return NextResponse.json({
      data: rows,
      fieldStatusVariants: rows,
      count: rows.length,
      code: 'OBC4',
      table: 'fin_field_status_variant',
      functionDescription: 'Field Status Variant – defines variant that groups field status groups – strict usage: assigned to company code, controls field requirements',
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
    const { code, name, description } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    // Ensure table exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_field_status_variant (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const res = await db.execute(sql`
      INSERT INTO fin_field_status_variant (code, name, description)
      VALUES (${code.toUpperCase()}, ${name}, ${description || null})
      ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}, updated_at = NOW()
      RETURNING id, code, name
    `);

    return NextResponse.json({ success: true, fieldStatusVariant: res.rows[0], message: `Field Status Variant ${code.toUpperCase()} created – OBC4` });
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
    if (id) res = await db.execute(sql`UPDATE fin_field_status_variant SET name = COALESCE(${name}, name), description = COALESCE(${description}, description), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name`);
    else res = await db.execute(sql`UPDATE fin_field_status_variant SET name = COALESCE(${name}, name), description = COALESCE(${description}, description), updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);

    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, fieldStatusVariant: res.rows[0] });
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

    if (id) await db.execute(sql`DELETE FROM fin_field_status_variant WHERE id = ${id}`);
    else await db.execute(sql`DELETE FROM fin_field_status_variant WHERE code = ${code}`);

    return NextResponse.json({ success: true, message: `Field Status Variant ${code || id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
