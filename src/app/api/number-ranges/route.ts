import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Number Ranges API – Industry Standard Specification
 * Scoping:
 * - FI: Scoped to (Company Code, Fiscal Year, Interval No)
 * - Logistics / Global: Scoped to (Scope Level, Interval No)
 * - Numeric boundaries: from_number, to_number, current_number (all numeric)
 * - External numbering: is_external flag
 * - Audit Lock: if current_number > from_number, lower bound cannot be altered
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const filterObjectType = searchParams.get('object_type') || searchParams.get('objectType');
    const filterCompanyCode = searchParams.get('company_code') || searchParams.get('companyCode');
    const filterPlantCode = searchParams.get('plant_code') || searchParams.get('plantCode');
    const filterControllingArea = searchParams.get('controlling_area_code') || searchParams.get('controllingArea');
    const filterScope = searchParams.get('scope_level') || searchParams.get('scope');

    let query = sql`SELECT * FROM core_number_range WHERE 1=1`;
    if (filterObjectType) {
      query = sql`${query} AND object_type = ${filterObjectType.toUpperCase()}`;
    }
    if (filterCompanyCode) {
      query = sql`${query} AND (company_code = ${filterCompanyCode.toUpperCase()} OR company_code IS NULL)`;
    }
    if (filterPlantCode) {
      query = sql`${query} AND (plant_code = ${filterPlantCode.toUpperCase()} OR plant_code IS NULL)`;
    }
    if (filterControllingArea) {
      query = sql`${query} AND (controlling_area_code = ${filterControllingArea.toUpperCase()} OR controlling_area_code IS NULL)`;
    }
    if (filterScope) {
      query = sql`${query} AND scope_level = ${filterScope.toUpperCase()}`;
    }
    query = sql`${query} ORDER BY object_type, code, fiscal_year NULLS LAST`;

    const res = await db.execute(query);
    const rows = (res.rows as any[]).map((r: any) => ({
      ...r,
      next_number: Number(r.current_number) + 1,
      used_count: Math.max(0, Number(r.current_number) - Number(r.from_number)),
      is_used: Number(r.current_number) > Number(r.from_number),
      is_locked: Number(r.current_number) > Number(r.from_number),
    }));

    return NextResponse.json({
      data: rows,
      numberRanges: rows,
      count: rows.length,
      code: 'FNRC',
      aliasCodes: ['NRC', 'FBN1', 'FIN-NR-CR'],
      helperCode: 'FNRC',
      legalSafe: true,
      industry_standard: true
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], numberRanges: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const {
      code,
      object_type,
      objectType,
      company_code,
      plant_code,
      controlling_area_code,
      scope_level,
      from_number,
      to_number,
      current_number,
      fiscal_year,
      description,
      is_external = false,
      year
    } = body;

    const upperCode = code ? code.toString().trim().toUpperCase() : '';
    if (!upperCode) {
      return NextResponse.json({ error: 'Interval No. (code) is required (e.g. 01, 10, 50)' }, { status: 400 });
    }

    const finalObjectType = (objectType || object_type || 'FI_DOC').toString().trim().toUpperCase();
    const finalFiscalYear = fiscal_year !== undefined && fiscal_year !== null && fiscal_year !== '' ? Number(fiscal_year) : (year ? Number(year) : null);
    const fromNum = Number(from_number) || 1;
    const toNum = Number(to_number) || 9999999999;
    const currNum = current_number !== undefined && current_number !== null && current_number !== '' ? Number(current_number) : fromNum;
    const isExternalVal = is_external === true || is_external === 'true';

    const cCode = company_code ? company_code.toString().trim().toUpperCase() : null;
    const pCode = plant_code ? plant_code.toString().trim().toUpperCase() : null;
    const coCode = controlling_area_code ? controlling_area_code.toString().trim().toUpperCase() : null;
    const resolvedScope = scope_level ? scope_level.toString().trim().toUpperCase() : (cCode ? 'COMPANY_CODE' : (pCode ? 'PLANT' : (coCode ? 'CONTROLLING_AREA' : 'GLOBAL')));

    // Clean lookup: match by code + company + fiscal_year
    let existing: any = null;
    try {
      let q = sql`
        SELECT id, code, object_type, company_code, plant_code, controlling_area_code, from_number, to_number, current_number, fiscal_year, is_external 
        FROM core_number_range 
        WHERE UPPER(code) = ${upperCode}
          AND COALESCE(UPPER(company_code), '') = COALESCE(${cCode}, '')
          AND COALESCE(fiscal_year, -1) = COALESCE(${finalFiscalYear}, -1)
        LIMIT 1
      `;
      const exRes = await db.execute(q);
      if (exRes.rows.length > 0) existing = exRes.rows[0];
    } catch (err: any) {
      console.warn('Lookup warning:', err.message);
    }

    if (existing) {
      const isUsed = Number(existing.current_number) > Number(existing.from_number);
      const usedCount = Math.max(0, Number(existing.current_number) - Number(existing.from_number));

      if (isUsed) {
        if (Number(fromNum) !== Number(existing.from_number)) {
          return NextResponse.json({
            error: `Interval ${existing.code}${existing.fiscal_year ? ` FY ${existing.fiscal_year}` : ''} is in active use (${usedCount} numbers issued). Starting number cannot be altered. Only upper bound (To Number) expansion is allowed.`
          }, { status: 400 });
        }
        if (Number(toNum) < Number(existing.current_number)) {
          return NextResponse.json({
            error: `Cannot reduce To Number ${existing.to_number} below current consumed level ${existing.current_number}.`
          }, { status: 400 });
        }
      }

      const updateRes = await db.execute(sql`
        UPDATE core_number_range SET
          from_number = ${isUsed ? Number(existing.from_number) : fromNum},
          to_number = ${Number(toNum)},
          current_number = ${isUsed ? Number(existing.current_number) : currNum},
          company_code = ${cCode},
          plant_code = ${pCode},
          controlling_area_code = ${coCode},
          scope_level = ${resolvedScope},
          fiscal_year = ${finalFiscalYear},
          is_external = ${isExternalVal},
          description = ${description || null},
          prefix = '',
          updated_at = NOW()
        WHERE id = ${existing.id}
        RETURNING id, code, object_type, company_code, plant_code, controlling_area_code, scope_level, current_number, from_number, to_number, fiscal_year, is_external, description
      `);
      const updated = updateRes.rows[0] as any;
      return NextResponse.json({
        success: true,
        numberRange: {
          ...updated,
          next_number: Number(updated.current_number) + 1,
          used_count: usedCount,
          is_locked: isUsed
        },
        code: 'FNRC',
        message: `Number range ${upperCode} updated successfully.`,
        legalSafe: true,
        industry_standard: true
      });
    }

    // Clean INSERT
    const insertRes = await db.execute(sql`
      INSERT INTO core_number_range (
        code, object_type, company_code, plant_code, controlling_area_code, scope_level,
        prefix, from_number, to_number, current_number, fiscal_year, is_external, description
      ) VALUES (
        ${upperCode}, ${finalObjectType}, ${cCode}, ${pCode}, ${coCode}, ${resolvedScope},
        '', ${fromNum}, ${toNum}, ${currNum},
        ${finalFiscalYear}, ${isExternalVal}, ${description || null}
      )
      RETURNING id, code, object_type, company_code, plant_code, controlling_area_code, scope_level, current_number, from_number, to_number, fiscal_year, is_external, description
    `);
    const created = insertRes.rows[0] as any;
    return NextResponse.json({
      success: true,
      numberRange: {
        ...created,
        next_number: Number(created.current_number) + 1,
        used_count: 0,
        is_locked: false
      },
      code: 'FNRC',
      message: `Number range ${upperCode}${finalFiscalYear ? ` FY ${finalFiscalYear}` : ''} created successfully.`,
      legalSafe: true,
      industry_standard: true
    });
  } catch (err: any) {
    console.error('Number range POST error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, code, current_number, from_number, to_number, description, fiscal_year } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    const res = await db.execute(sql`
      UPDATE core_number_range SET
        to_number = COALESCE(${to_number ? Number(to_number) : null}, to_number),
        description = COALESCE(${description || null}, description),
        updated_at = NOW()
      WHERE id = ${id} OR UPPER(code) = ${code ? code.toUpperCase() : ''}
      RETURNING *
    `);
    if (res.rows.length === 0) return NextResponse.json({ error: 'Interval not found' }, { status: 404 });
    return NextResponse.json({ success: true, numberRange: res.rows[0], message: 'Interval updated successfully.' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const code = searchParams.get('code');
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    let existing: any = null;
    if (id) {
      const res = await db.execute(sql`SELECT id, code, from_number, current_number FROM core_number_range WHERE id = ${id} LIMIT 1`);
      if (res.rows.length > 0) existing = res.rows[0];
    } else if (code) {
      const res = await db.execute(sql`SELECT id, code, from_number, current_number FROM core_number_range WHERE UPPER(code) = ${code.toUpperCase()} LIMIT 1`);
      if (res.rows.length > 0) existing = res.rows[0];
    }

    if (existing && Number(existing.current_number) > Number(existing.from_number)) {
      const count = Number(existing.current_number) - Number(existing.from_number);
      return NextResponse.json({
        error: `Interval ${existing.code} cannot be deleted because it has already been used (${count} documents issued). Active ranges are locked for audit trail continuity.`
      }, { status: 400 });
    }

    if (id) {
      await db.execute(sql`DELETE FROM core_number_range WHERE id = ${id}`);
    } else {
      await db.execute(sql`DELETE FROM core_number_range WHERE UPPER(code) = ${code ? code.toUpperCase() : ''}`);
    }
    return NextResponse.json({ success: true, message: `Interval deleted successfully.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
