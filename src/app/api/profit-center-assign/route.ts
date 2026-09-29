import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * profit-center-assign API – General ERP terminology – strict usage, no dummy
 * Table: fin_profit_center_assign
 * Fields: profit_center_code, legal_entity_code, cost_center_code, description
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    try {
      const res = await db.execute(sql`SELECT * FROM fin_profit_center_assign ORDER BY profit_center_code LIMIT 100`);
      rows = res.rows as any[];
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        return NextResponse.json({ data: [], count: 0, message: 'Table fin_profit_center_assign not yet created – fresh empty', table: 'fin_profit_center_assign' });
      }
      throw e;
    }

    return NextResponse.json({ data: rows, count: rows.length, table: 'fin_profit_center_assign' });
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
      await db.execute(sql`SELECT 1 FROM fin_profit_center_assign LIMIT 1`);
    } catch {
      // Create table with generic columns
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS fin_profit_center_assign (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          profit_center_code VARCHAR(50) UNIQUE NOT NULL,
          legal_entity_code TEXT, cost_center_code TEXT, description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
    }

    const code = body.profit_center_code || body.code;
    if (!code) return NextResponse.json({ error: 'profit_center_code required' }, { status: 400 });

    // Build dynamic insert – use all fields from body
    const cols = Object.keys(body).filter(k => !['id','created_at','updated_at'].includes(k));
    const placeholders = cols.map(c => '${body[c]}').join(', ');
    
    try {
      const res = await db.execute(sql`
        INSERT INTO fin_profit_center_assign (profit_center_code, legal_entity_code, cost_center_code, description)
        VALUES (${code.toUpperCase()}, ${body['legal_entity_code'] || null}, ${body['cost_center_code'] || null}, ${body['description'] || null})
        ON CONFLICT (profit_center_code) DO UPDATE SET updated_at = NOW()
        RETURNING id, profit_center_code
      `);
      return NextResponse.json({ success: true, data: res.rows[0], message: `profit-center-assign ${code} created` });
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
    const code = body.profit_center_code || body.code;
    const id = body.id;
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    let res;
    if (id) {
      res = await db.execute(sql`UPDATE fin_profit_center_assign SET updated_at = NOW() WHERE id = ${id} RETURNING id, profit_center_code`);
    } else {
      res = await db.execute(sql`UPDATE fin_profit_center_assign SET updated_at = NOW() WHERE profit_center_code = ${code.toUpperCase()} RETURNING id, profit_center_code`);
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

    if (id) await db.execute(sql`DELETE FROM fin_profit_center_assign WHERE id = ${id}`);
    else await db.execute(sql`DELETE FROM fin_profit_center_assign WHERE profit_center_code = ${code}`);

    return NextResponse.json({ success: true, message: `${code || id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
