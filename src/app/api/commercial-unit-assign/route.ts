import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * commercial-unit-assign API – General ERP terminology – strict usage, no dummy
 * Table: fin_commercial_unit_assign
 * Fields: commercial_unit_code, legal_entity_code, description
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    try {
      const res = await db.execute(sql`SELECT * FROM fin_commercial_unit_assign ORDER BY commercial_unit_code LIMIT 100`);
      rows = res.rows as any[];
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        return NextResponse.json({ data: [], count: 0, message: 'Table fin_commercial_unit_assign not yet created – fresh empty', table: 'fin_commercial_unit_assign' });
      }
      throw e;
    }

    return NextResponse.json({ data: rows, count: rows.length, table: 'fin_commercial_unit_assign' });
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
      await db.execute(sql`SELECT 1 FROM fin_commercial_unit_assign LIMIT 1`);
    } catch {
      // Create table with generic columns
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS fin_commercial_unit_assign (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          commercial_unit_code VARCHAR(50) UNIQUE NOT NULL,
          legal_entity_code TEXT, description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
    }

    const code = body.commercial_unit_code || body.code;
    if (!code) return NextResponse.json({ error: 'commercial_unit_code required' }, { status: 400 });

    // Build dynamic insert – use all fields from body
    const cols = Object.keys(body).filter(k => !['id','created_at','updated_at'].includes(k));
    const placeholders = cols.map(c => '${body[c]}').join(', ');
    
    try {
      const res = await db.execute(sql`
        INSERT INTO fin_commercial_unit_assign (commercial_unit_code, legal_entity_code, description)
        VALUES (${code.toUpperCase()}, ${body['legal_entity_code'] || null}, ${body['description'] || null})
        ON CONFLICT (commercial_unit_code) DO UPDATE SET updated_at = NOW()
        RETURNING id, commercial_unit_code
      `);
      return NextResponse.json({ success: true, data: res.rows[0], message: `commercial-unit-assign ${code} created` });
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
    const code = body.commercial_unit_code || body.code;
    const id = body.id;
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    let res;
    if (id) {
      res = await db.execute(sql`UPDATE fin_commercial_unit_assign SET updated_at = NOW() WHERE id = ${id} RETURNING id, commercial_unit_code`);
    } else {
      res = await db.execute(sql`UPDATE fin_commercial_unit_assign SET updated_at = NOW() WHERE commercial_unit_code = ${code.toUpperCase()} RETURNING id, commercial_unit_code`);
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

    if (id) await db.execute(sql`DELETE FROM fin_commercial_unit_assign WHERE id = ${id}`);
    else await db.execute(sql`DELETE FROM fin_commercial_unit_assign WHERE commercial_unit_code = ${code}`);

    return NextResponse.json({ success: true, message: `${code || id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
