import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Plants & Storage Locations API - Multi-Plant Master Data
 * GET /api/plants - List plants and SLocs for dropdowns, filters
 * Supports small enterprise with multiple plants and storage areas
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const companyCode = searchParams.get('companyCode') || '1000';

  try {
    const plantsRes = await db.execute(sql`
      SELECT p.id, p.code, p.name, p.company_code_id, cc.code as company_code, p.is_active,
             (SELECT COUNT(*) FROM ent_storage_location WHERE plant_id = p.id) as sloc_count,
             (SELECT COUNT(*) FROM inv_stock WHERE plant_id = p.id AND quantity > 0) as stock_lines,
             (SELECT SUM(quantity) FROM inv_stock WHERE plant_id = p.id) as total_qty
      FROM ent_plant p
      LEFT JOIN ent_company_code cc ON p.company_code_id = cc.id
      WHERE cc.code = ${companyCode} OR ${companyCode} = 'ALL'
      ORDER BY p.code
    `);

    const slocsRes = await db.execute(sql`
      SELECT sl.id, sl.code, sl.name, sl.plant_id, p.code as plant_code, p.name as plant_name, sl.is_active,
             (SELECT COUNT(*) FROM inv_stock WHERE sloc_id = sl.id AND quantity > 0) as stock_lines
      FROM ent_storage_location sl
      JOIN ent_plant p ON sl.plant_id = p.id
      LEFT JOIN ent_company_code cc ON p.company_code_id = cc.id
      WHERE cc.code = ${companyCode} OR ${companyCode} = 'ALL'
      ORDER BY p.code, sl.code
    `);

    const companyCodesRes = await db.execute(sql`SELECT id, code, name, currency_code, city, country FROM ent_company_code ORDER BY code`);

    return NextResponse.json({
      code: 'OX10',
      functionDescription: 'Plant / Storage Location – OX10/OX09',

      plants: plantsRes.rows,
      slocs: slocsRes.rows,
      companyCodes: companyCodesRes.rows,
      count: { plants: plantsRes.rows.length, slocs: slocsRes.rows.length },
      source: 'db',
      multiPlant: 'Small enterprise multi-plant support: 1000 Main Kitchen, 1100 Storage, SLocs 0001 Main, 0002 Cold, 0003 Shop Floor, 0004 Returns, 0005 QI',
    });
  } catch (e: any) {
    console.error('DB error:', e.message);
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
  }
}
