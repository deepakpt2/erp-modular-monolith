import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * production-orders API – General ERP terminology – strict usage, no dummy
 * Table: pp_production_order
 * Fields: material_code, plant_code, quantity, routing_code, bom_code, status, posting_date
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    try {
      const res = await db.execute(sql`SELECT * FROM pp_production_order ORDER BY order_number LIMIT 100`);
      rows = res.rows as any[];
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        return NextResponse.json({ data: [], count: 0, message: 'Table pp_production_order not yet created – fresh empty', table: 'pp_production_order' });
      }
      throw e;
    }

    return NextResponse.json({ data: rows, count: rows.length, table: 'pp_production_order' });
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
      await db.execute(sql`SELECT 1 FROM pp_production_order LIMIT 1`);
    } catch {
      // Create table with generic columns
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS pp_production_order (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_number VARCHAR(50) UNIQUE NOT NULL,
          material_code TEXT, plant_code TEXT, quantity TEXT, routing_code TEXT, bom_code TEXT, status TEXT, posting_date TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
    }

    const code = body.order_number || body.code;
    if (!code) return NextResponse.json({ error: 'order_number required' }, { status: 400 });

    // Build dynamic insert – use all fields from body
    const cols = Object.keys(body).filter(k => !['id','created_at','updated_at'].includes(k));
    const placeholders = cols.map(c => '${body[c]}').join(', ');
    
    try {
      const res = await db.execute(sql`
        INSERT INTO pp_production_order (order_number, material_code, plant_code, quantity, routing_code, bom_code, status, posting_date)
        VALUES (${code.toUpperCase()}, ${body['material_code'] || null}, ${body['plant_code'] || null}, ${body['quantity'] || null}, ${body['routing_code'] || null}, ${body['bom_code'] || null}, ${body['status'] || null}, ${body['posting_date'] || null})
        ON CONFLICT (order_number) DO UPDATE SET updated_at = NOW()
        RETURNING id, order_number
      `);
      return NextResponse.json({ success: true, data: res.rows[0], message: `production-orders ${code} created` });
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
    const code = body.order_number || body.code;
    const id = body.id;
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    let res;
    if (id) {
      res = await db.execute(sql`UPDATE pp_production_order SET updated_at = NOW() WHERE id = ${id} RETURNING id, order_number`);
    } else {
      res = await db.execute(sql`UPDATE pp_production_order SET updated_at = NOW() WHERE order_number = ${code.toUpperCase()} RETURNING id, order_number`);
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

    if (id) await db.execute(sql`DELETE FROM pp_production_order WHERE id = ${id}`);
    else await db.execute(sql`DELETE FROM pp_production_order WHERE order_number = ${code}`);

    return NextResponse.json({ success: true, message: `${code || id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
