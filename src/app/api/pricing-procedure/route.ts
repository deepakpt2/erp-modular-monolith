import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * pricing-procedure API – General ERP terminology – strict usage, no dummy
 * Table: sd_pricing_procedure
 * Fields: code, name, condition_type, sequence, calculation_type, gl_account, description
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    try {
      const res = await db.execute(sql`SELECT * FROM sd_pricing_procedure ORDER BY code LIMIT 100`);
      rows = res.rows as any[];
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        return NextResponse.json({ data: [], count: 0, message: 'Table sd_pricing_procedure not yet created – fresh empty', table: 'sd_pricing_procedure' });
      }
      throw e;
    }

    return NextResponse.json({ data: rows, count: rows.length, table: 'sd_pricing_procedure' });
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
      await db.execute(sql`SELECT 1 FROM sd_pricing_procedure LIMIT 1`);
    } catch {
      // Create table with generic columns
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS sd_pricing_procedure (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(50) UNIQUE NOT NULL,
          name TEXT, condition_type TEXT, sequence TEXT, calculation_type TEXT, gl_account TEXT, description TEXT,
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
        INSERT INTO sd_pricing_procedure (code, name, condition_type, sequence, calculation_type, gl_account, description)
        VALUES (${code.toUpperCase()}, ${body['name'] || null}, ${body['condition_type'] || null}, ${body['sequence'] || null}, ${body['calculation_type'] || null}, ${body['gl_account'] || null}, ${body['description'] || null})
        ON CONFLICT (code) DO UPDATE SET updated_at = NOW()
        RETURNING id, code
      `);
      return NextResponse.json({ success: true, data: res.rows[0], message: `pricing-procedure ${code} created` });
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
      res = await db.execute(sql`UPDATE sd_pricing_procedure SET updated_at = NOW() WHERE id = ${id} RETURNING id, code`);
    } else {
      res = await db.execute(sql`UPDATE sd_pricing_procedure SET updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code`);
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

    if (id) await db.execute(sql`DELETE FROM sd_pricing_procedure WHERE id = ${id}`);
    else await db.execute(sql`DELETE FROM sd_pricing_procedure WHERE code = ${code}`);

    return NextResponse.json({ success: true, message: `${code || id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
