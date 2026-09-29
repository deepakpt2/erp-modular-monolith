import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * partner-contacts API – General ERP terminology – strict usage, no dummy
 * Table: partner_contact
 * Fields: partner_code, contact_name, email, phone, contact_type, description
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    try {
      const res = await db.execute(sql`SELECT * FROM partner_contact ORDER BY id LIMIT 100`);
      rows = res.rows as any[];
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        return NextResponse.json({ data: [], count: 0, message: 'Table partner_contact not yet created – fresh empty', table: 'partner_contact' });
      }
      throw e;
    }

    return NextResponse.json({ data: rows, count: rows.length, table: 'partner_contact' });
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
      await db.execute(sql`SELECT 1 FROM partner_contact LIMIT 1`);
    } catch {
      // Create table with generic columns
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS partner_contact (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          id VARCHAR(50) UNIQUE NOT NULL,
          partner_code TEXT, contact_name TEXT, email TEXT, phone TEXT, contact_type TEXT, description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
    }

    const code = body.id || body.code;
    if (!code) return NextResponse.json({ error: 'id required' }, { status: 400 });

    // Build dynamic insert – use all fields from body
    const cols = Object.keys(body).filter(k => !['id','created_at','updated_at'].includes(k));
    const placeholders = cols.map(c => '${body[c]}').join(', ');
    
    try {
      const res = await db.execute(sql`
        INSERT INTO partner_contact (id, partner_code, contact_name, email, phone, contact_type, description)
        VALUES (${code.toUpperCase()}, ${body['partner_code'] || null}, ${body['contact_name'] || null}, ${body['email'] || null}, ${body['phone'] || null}, ${body['contact_type'] || null}, ${body['description'] || null})
        ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
        RETURNING id, id
      `);
      return NextResponse.json({ success: true, data: res.rows[0], message: `partner-contacts ${code} created` });
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
    const code = body.id || body.code;
    const id = body.id;
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    let res;
    if (id) {
      res = await db.execute(sql`UPDATE partner_contact SET updated_at = NOW() WHERE id = ${id} RETURNING id, id`);
    } else {
      res = await db.execute(sql`UPDATE partner_contact SET updated_at = NOW() WHERE id = ${code.toUpperCase()} RETURNING id, id`);
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

    if (id) await db.execute(sql`DELETE FROM partner_contact WHERE id = ${id}`);
    else await db.execute(sql`DELETE FROM partner_contact WHERE id = ${code}`);

    return NextResponse.json({ success: true, message: `${code || id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
