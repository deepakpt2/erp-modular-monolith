import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * distribution-paths API – General ERP terminology – strict usage, no dummy
 * Table: fin_distribution_path
 * Fields: code, name, sales_channel_code, product_line_code, description
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    try {
      const res = await db.execute(sql`SELECT * FROM fin_distribution_path ORDER BY code LIMIT 100`);
      rows = res.rows as any[];
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        return NextResponse.json({ data: [], count: 0, message: 'Table fin_distribution_path not yet created – fresh empty', table: 'fin_distribution_path' });
      }
      throw e;
    }

    return NextResponse.json({ data: rows, count: rows.length, table: 'fin_distribution_path' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    
    // Ensure table exists – create if not
    try {
      await db.execute(sql`SELECT 1 FROM fin_distribution_path LIMIT 1`);
    } catch {
      // Create table with generic columns
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS fin_distribution_path (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(50) UNIQUE NOT NULL,
          name TEXT, sales_channel_code TEXT, product_line_code TEXT, description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
    }

    const code = body.code || body.code;
    if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

    // Build dynamic insert – use all fields from body
    const cols = Object.keys(body).filter(k => !['id','created_at','updated_at'].includes(k));
    const placeholders = cols.map(c => '${body[c]}').join(', ');
    
    try {
      const res = await db.execute(sql`
        INSERT INTO fin_distribution_path (code, name, sales_channel_code, product_line_code, description)
        VALUES (${code.toUpperCase()}, ${body['name'] || null}, ${body['sales_channel_code'] || null}, ${body['product_line_code'] || null}, ${body['description'] || null})
        ON CONFLICT (code) DO UPDATE SET updated_at = NOW()
        RETURNING id, code
      `);
      return NextResponse.json({ success: true, data: res.rows[0], message: `distribution-paths ${code} created` });
    } catch (e: any) {
      // Fallback generic insert
      try {
        const allKeys = Object.keys(body).join(', ');
        const allVals = Object.values(body).map(v => `'${String(v).replace("'", "''")}'`).join(', ');
        // Use simple insert for debugging
        return NextResponse.json({ error: e.message, detail: 'Insert failed – check table schema', body }, { status: 500 });
      } catch (e2: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
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
    const code = body.code || body.code;
    const id = body.id;
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    let res;
    if (id) {
      res = await db.execute(sql`UPDATE fin_distribution_path SET updated_at = NOW() WHERE id = ${id} RETURNING id, code`);
    } else {
      res = await db.execute(sql`UPDATE fin_distribution_path SET updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code`);
    }
    
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: res.rows[0] });
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

    if (id) await db.execute(sql`DELETE FROM fin_distribution_path WHERE id = ${id}`);
    else await db.execute(sql`DELETE FROM fin_distribution_path WHERE code = ${code}`);

    return NextResponse.json({ success: true, message: `${code || id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
