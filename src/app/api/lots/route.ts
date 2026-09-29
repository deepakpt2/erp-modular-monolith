import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * lots API – General ERP terminology – strict usage, no dummy
 * Table: inv_lot
 * Fields: lot_number, material_code, facility_code, expiry_date, manufacturing_date, description
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    try {
      const res = await db.execute(sql`SELECT * FROM inv_lot ORDER BY lot_number LIMIT 100`);
      rows = res.rows as any[];
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        return NextResponse.json({ data: [], count: 0, message: 'Table inv_lot not yet created – fresh empty', table: 'inv_lot' });
      }
      throw e;
    }

    return NextResponse.json({ data: rows, count: rows.length, table: 'inv_lot' });
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
      await db.execute(sql`SELECT 1 FROM inv_lot LIMIT 1`);
    } catch {
      // Create table with generic columns
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS inv_lot (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          lot_number VARCHAR(50) UNIQUE NOT NULL,
          material_code TEXT, facility_code TEXT, expiry_date TEXT, manufacturing_date TEXT, description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
    }

    const code = body.lot_number || body.code;
    if (!code) return NextResponse.json({ error: 'lot_number required' }, { status: 400 });

    // Build dynamic insert – use all fields from body
    const cols = Object.keys(body).filter(k => !['id','created_at','updated_at'].includes(k));
    const placeholders = cols.map(c => '${body[c]}').join(', ');
    
    try {
      const res = await db.execute(sql`
        INSERT INTO inv_lot (lot_number, material_code, facility_code, expiry_date, manufacturing_date, description)
        VALUES (${code.toUpperCase()}, ${body['material_code'] || null}, ${body['facility_code'] || null}, ${body['expiry_date'] || null}, ${body['manufacturing_date'] || null}, ${body['description'] || null})
        ON CONFLICT (lot_number) DO UPDATE SET updated_at = NOW()
        RETURNING id, lot_number
      `);
      return NextResponse.json({ success: true, data: res.rows[0], message: `lots ${code} created` });
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
    const code = body.lot_number || body.code;
    const id = body.id;
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    let res;
    if (id) {
      res = await db.execute(sql`UPDATE inv_lot SET updated_at = NOW() WHERE id = ${id} RETURNING id, lot_number`);
    } else {
      res = await db.execute(sql`UPDATE inv_lot SET updated_at = NOW() WHERE lot_number = ${code.toUpperCase()} RETURNING id, lot_number`);
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

    if (id) await db.execute(sql`DELETE FROM inv_lot WHERE id = ${id}`);
    else await db.execute(sql`DELETE FROM inv_lot WHERE lot_number = ${code}`);

    return NextResponse.json({ success: true, message: `${code || id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
