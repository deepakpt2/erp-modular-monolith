import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role') || 'ALL'; // VENDOR, CUSTOMER, BOTH
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let query = sql`
      SELECT id, bp_number, role, name1, name2, email, phone, address, is_blocked, is_one_time, created_at
      FROM ent_business_partner
      WHERE 1=1
    `;
    if (role && role !== 'ALL') {
      query = sql`${query} AND role = ${role}::bp_role`;
    }
    if (search) {
      query = sql`${query} AND (bp_number ILIKE ${`%${search}%`} OR name1 ILIKE ${`%${search}%`})`;
    }
    query = sql`${query} ORDER BY bp_number LIMIT ${limit}`;

    const result = await db.execute(query);

    return NextResponse.json({
      businessPartners: result.rows,
      count: result.rows.length,
      source: 'db',
      functionCodes: 'ME01 Vendor Master, XD01 Customer Master, BP Central',
      ks01: 'KS-V-001 Malabar Spice Farms Wayanad, KS-V-002 Idukki Cardamom, KS-V-003 Alleppey Turmeric, KS-C-001 Kochi Exports, KS-C-002 Mumbai Spice',
    });
  } catch (e: any) {
    console.error('DB error:', e.message);
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { bp_number, name1, role, email, phone, address } = body;
    if (!bp_number || !name1 || !role) return NextResponse.json({ error: 'bp_number, name1, role required' }, { status: 400 });

    const res = await db.execute(sql`
      INSERT INTO ent_business_partner (bp_number, name1, role, email, phone, address, is_blocked, is_one_time)
      VALUES (${bp_number}, ${name1}, ${role}::bp_role, ${email||null}, ${phone||null}, ${address||null}, false, false)
      ON CONFLICT (bp_number) DO UPDATE SET name1 = ${name1}, role = ${role}::bp_role
      RETURNING id, bp_number
    `);

    return NextResponse.json({ success: true, businessPartner: res.rows[0], message: `BP ${bp_number} ${name1} created role ${role}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
