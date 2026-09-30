import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Number Range Assignments API – Industry standard assignment
 * Explicit assignment: material type RAW → MAT-RAW-01, FINISHED → MAT-FG-01, PO company 1000 → PO-01 etc.
 * Table: core_number_range_assignment – object_type, assignment_key, number_range_code, fiscal_year
 * Industry standard: XYZ to material, YZX to PO via assignment table – not just object_type
 */

async function ensureTables() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS core_number_range_assignment (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        object_type varchar(50) NOT NULL,
        assignment_key varchar(100) NOT NULL,
        assignment_type varchar(50) DEFAULT 'MATERIAL_TYPE',
        number_range_code varchar(50) NOT NULL,
        fiscal_year integer,
        is_active boolean DEFAULT true,
        description text,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW(),
        UNIQUE(object_type, assignment_key, fiscal_year)
      )
    `);
  } catch {}
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS core_number_range (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(50) UNIQUE NOT NULL,
        object_type varchar(50) NOT NULL,
        prefix varchar(20) DEFAULT '',
        from_number bigint NOT NULL,
        to_number bigint NOT NULL,
        current_number bigint DEFAULT 0,
        legal_entity_id uuid,
        fiscal_year integer,
        is_active boolean DEFAULT true,
        description text,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      )
    `);
  } catch {}
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  await ensureTables();
  try {
    let rows: any[] = [];
    try {
      const res = await db.execute(sql`
        SELECT a.id, a.object_type, a.assignment_key, a.assignment_type, a.number_range_code, a.fiscal_year, a.is_active, a.description, a.created_at, a.updated_at,
               r.from_number, r.to_number, r.current_number,
               (r.current_number - r.from_number) as used_count,
               (r.current_number + 1) as next_number,
               CASE WHEN r.current_number > r.from_number THEN true ELSE false END as is_locked,
               CASE WHEN r.to_number > r.from_number THEN ROUND(((r.current_number - r.from_number)::numeric / (r.to_number - r.from_number)::numeric * 100)::numeric, 1) ELSE 0 END as usage_percent
        FROM core_number_range_assignment a
        LEFT JOIN core_number_range r ON r.code = a.number_range_code
        ORDER BY a.object_type, a.assignment_key, a.fiscal_year NULLS LAST
      `);
      rows = res.rows as any[];
    } catch (e: any) {
      console.warn('Assignment table not yet:', e.message);
      rows = [];
    }

    // Also fetch available ranges for dropdown
    let ranges: any[] = [];
    try {
      const rRes = await db.execute(sql`SELECT code, object_type, from_number, to_number, current_number, fiscal_year FROM core_number_range ORDER BY object_type, code`);
      ranges = rRes.rows as any[];
    } catch {}

    return NextResponse.json({
      data: rows,
      assignments: rows,
      numberRanges: ranges,
      count: rows.length,
      code: 'FNRA',
      message: `Number range assignments – ${rows.length} – explicit XYZ to material, YZX to PO – industry standard`,
      explanation: 'Assignment table links object_type + assignment_key (material type RAW/FINISHED, company 1000, doc type NB) to specific number_range_code – when creating doc, system looks up assignment and uses that range – e.g., ITEM RAW → MAT-RAW-01 (10000-19999), ITEM FINISHED → MAT-FG-01 (20000-29999), PO 1000 → PO-01',
      examples: [
        { object_type: 'ITEM', assignment_key: 'RAW', assignment_type: 'MATERIAL_TYPE', number_range_code: 'MAT-RAW-01', from: 10000, to: 19999, next: 10001, note: 'RAW materials use 10000-19999' },
        { object_type: 'ITEM', assignment_key: 'FINISHED', assignment_type: 'MATERIAL_TYPE', number_range_code: 'MAT-FG-01', from: 20000, to: 29999, next: 20001, note: 'FINISHED use 20000-29999' },
        { object_type: 'PO', assignment_key: '1000', assignment_type: 'COMPANY_CODE', number_range_code: 'PO-01', from: 4500000000, to: 4599999999, next: 4500000001, note: 'Company 1000 PO uses PO-01' },
        { object_type: 'PO', assignment_key: '2000', assignment_type: 'COMPANY_CODE', number_range_code: 'PO-02', from: 4600000000, to: 4699999999, next: 4600000001, note: 'Company 2000 PO uses PO-02' },
      ],
      exhaustionHandling: 'If range exhausted (current > to), API returns error – no auto fallback – admin must increase to_number in FNRC (allowed even if locked) or create new range and update assignment – e.g., MAT-RAW-01 exhausted 10000-19999 → create MAT-RAW-02 20000-29999 and update assignment RAW→MAT-RAW-02',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], assignments: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  await ensureTables();
  try {
    const body = await req.json();
    const { object_type, objectType, assignment_key, assignmentKey, material_type, company_code, doc_type, assignment_type, assignmentType, number_range_code, numberRangeCode, range_code, fiscal_year, description } = body;
    const finalObjectType = (objectType || object_type)?.toUpperCase();
    const finalAssignKey = (assignmentKey || assignment_key || material_type || company_code || doc_type)?.toString().toUpperCase();
    const finalRangeCode = (numberRangeCode || number_range_code || range_code)?.toString().toUpperCase();
    const finalAssignType = (assignmentType || assignment_type || (material_type ? 'MATERIAL_TYPE' : company_code ? 'COMPANY_CODE' : doc_type ? 'DOC_TYPE' : 'MATERIAL_TYPE')).toUpperCase();
    const finalFiscalYear = fiscal_year || null;

    if (!finalObjectType || !finalAssignKey || !finalRangeCode) {
      return NextResponse.json({ error: 'object_type, assignment_key (material_type/company_code/doc_type), number_range_code required – e.g., object_type=ITEM, assignment_key=RAW, number_range_code=MAT-RAW-01' }, { status: 400 });
    }

    // Validate range exists
    try {
      const rangeCheck = await db.execute(sql`SELECT code FROM core_number_range WHERE code = ${finalRangeCode} LIMIT 1`);
      if (rangeCheck.rows.length === 0) {
        return NextResponse.json({ error: `Number range code ${finalRangeCode} not found – create it first via FNRC` }, { status: 400 });
      }
    } catch {}

    const res = await db.execute(sql`
      INSERT INTO core_number_range_assignment (object_type, assignment_key, assignment_type, number_range_code, fiscal_year, description)
      VALUES (${finalObjectType}, ${finalAssignKey}, ${finalAssignType}, ${finalRangeCode}, ${finalFiscalYear}, ${description || null})
      ON CONFLICT (object_type, assignment_key, fiscal_year) DO UPDATE SET number_range_code = ${finalRangeCode}, assignment_type = ${finalAssignType}, description = ${description || null}, is_active = true, updated_at = NOW()
      RETURNING id, object_type, assignment_key, number_range_code, fiscal_year
    `);

    return NextResponse.json({ success: true, assignment: res.rows[0], message: `Assignment ${finalObjectType} ${finalAssignKey} → ${finalRangeCode}${finalFiscalYear ? ` FY ${finalFiscalYear}` : ''} created – explicit XYZ to material – industry standard` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  await ensureTables();
  try {
    const body = await req.json();
    const { id, object_type, assignment_key, number_range_code, fiscal_year, is_active, description } = body;
    if (!id && !(object_type && assignment_key)) return NextResponse.json({ error: 'id or object_type+assignment_key required' }, { status: 400 });

    let res;
    if (id) {
      res = await db.execute(sql`
        UPDATE core_number_range_assignment SET
          number_range_code = COALESCE(${number_range_code?.toUpperCase() || null}, number_range_code),
          is_active = COALESCE(${is_active}, is_active),
          description = COALESCE(${description || null}, description),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, object_type, assignment_key, number_range_code, fiscal_year
      `);
    } else {
      const fy = fiscal_year || null;
      res = await db.execute(sql`
        UPDATE core_number_range_assignment SET
          number_range_code = COALESCE(${number_range_code?.toUpperCase() || null}, number_range_code),
          is_active = COALESCE(${is_active}, is_active),
          description = COALESCE(${description || null}, description),
          updated_at = NOW()
        WHERE object_type = ${object_type.toUpperCase()} AND UPPER(assignment_key) = ${assignment_key.toUpperCase()} AND COALESCE(fiscal_year, -1) = COALESCE(${fy}, -1)
        RETURNING id, object_type, assignment_key, number_range_code, fiscal_year
      `);
    }

    if (res.rows.length === 0) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    return NextResponse.json({ success: true, assignment: res.rows[0], message: `Assignment ${res.rows[0].object_type} ${res.rows[0].assignment_key} → ${res.rows[0].number_range_code} updated` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  await ensureTables();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const object_type = searchParams.get('object_type')?.toUpperCase();
    const assignment_key = searchParams.get('assignment_key')?.toUpperCase();
    const fiscal_year = searchParams.get('fiscal_year');

    if (!id && !(object_type && assignment_key)) return NextResponse.json({ error: 'id or object_type+assignment_key required' }, { status: 400 });

    if (id) {
      await db.execute(sql`DELETE FROM core_number_range_assignment WHERE id = ${id}`);
    } else {
      if (fiscal_year) {
        await db.execute(sql`DELETE FROM core_number_range_assignment WHERE object_type = ${object_type} AND UPPER(assignment_key) = ${assignment_key} AND COALESCE(fiscal_year, -1) = COALESCE(${fiscal_year}, -1)`);
      } else {
        await db.execute(sql`DELETE FROM core_number_range_assignment WHERE object_type = ${object_type} AND UPPER(assignment_key) = ${assignment_key}`);
      }
    }

    return NextResponse.json({ success: true, message: `Assignment ${object_type || id} ${assignment_key || ''} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
