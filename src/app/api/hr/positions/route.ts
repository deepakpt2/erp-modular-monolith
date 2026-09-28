import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const result = await db.execute(sql`
      SELECT p.*, ou.code as org_unit_code, ou.name as org_unit_name,
             (SELECT COUNT(*) FROM hr_employee WHERE position_id = p.id) as employee_count,
             (SELECT COUNT(*) FROM ent_approval_authority WHERE position_id = p.id) as authority_count
      FROM hr_position p
      JOIN hr_org_unit ou ON p.org_unit_id = ou.id
      ORDER BY ou.code, p.code
    `);
    return NextResponse.json({ positions: result.rows, count: result.rows.length, source: 'db' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
  }
}
