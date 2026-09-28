import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const result = await db.execute(sql`
      SELECT ou.*, parent.code as parent_code, parent.name as parent_name,
             (SELECT COUNT(*) FROM hr_position WHERE org_unit_id = ou.id) as position_count,
             (SELECT COUNT(*) FROM hr_employee e JOIN hr_position p ON e.position_id = p.id WHERE p.org_unit_id = ou.id) as employee_count
      FROM hr_org_unit ou
      LEFT JOIN hr_org_unit parent ON ou.parent_id = parent.id
      ORDER BY ou.code
    `);
    return NextResponse.json({ orgUnits: result.rows, count: result.rows.length, source: 'db' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
  }
}
