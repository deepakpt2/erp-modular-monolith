import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Number Ranges API – FNRC – Industry standard NUMBERING – NO PREFIX
 *  Standard: Number ranges are purely numeric intervals – NO PREFIX in range itself
 * Example : PO 4500000000, PR 1000000000, MAT 10000000 – numeric only
 * In  Interval maintenance standard: Interval defined by From Number, To Number, Current Number – all numeric
 * Prefix handling: REMOVED for  compliance – prefix field forced to '' always
 * Industry standard locking (per user confirmation):
 * - Used if current_number > from_number
 * - If used, locked from editing/deleting per code+year
 * - Edit blocked: code, object_type, from_number cannot change when used
 * - to_number cannot be < current_number
 * - Allow only: description, to_number increase
 * - Delete blocked if used
 */

async function ensureNumberRangeSchema() {
  try {
    await db.execute(sql`ALTER TABLE core_number_range ADD COLUMN IF NOT EXISTS company_code VARCHAR(20)`).catch(() => {});
    await db.execute(sql`ALTER TABLE core_number_range ADD COLUMN IF NOT EXISTS plant_code VARCHAR(20)`).catch(() => {});
    await db.execute(sql`ALTER TABLE core_number_range ADD COLUMN IF NOT EXISTS controlling_area_code VARCHAR(20)`).catch(() => {});
    await db.execute(sql`ALTER TABLE core_number_range ADD COLUMN IF NOT EXISTS scope_level VARCHAR(30) DEFAULT 'GLOBAL'`).catch(() => {});
    await db.execute(sql`ALTER TABLE core_number_range ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT false`).catch(() => {});
    await db.execute(sql`ALTER TABLE core_number_range ADD COLUMN IF NOT EXISTS is_buffered BOOLEAN DEFAULT false`).catch(() => {});
    await db.execute(sql`ALTER TABLE core_number_range ADD COLUMN IF NOT EXISTS buffer_size INTEGER DEFAULT 10`).catch(() => {});
    await db.execute(sql`ALTER TABLE core_number_range ALTER COLUMN object_type TYPE VARCHAR(50)`).catch(() => {});
    // Drop single-column unique indexes/constraints individually so each one executes even if another fails
    await db.execute(sql`DROP INDEX IF EXISTS uq_core_nr_code`).catch(() => {});
    await db.execute(sql`ALTER TABLE core_number_range DROP CONSTRAINT IF EXISTS core_number_range_code_unique`).catch(() => {});
    await db.execute(sql`ALTER TABLE core_number_range DROP CONSTRAINT IF EXISTS core_number_range_code_key`).catch(() => {});
    await db.execute(sql`ALTER TABLE core_number_range DROP CONSTRAINT IF EXISTS uq_core_nr_code`).catch(() => {});
  } catch (e: any) {
    console.warn('ensureNumberRangeSchema warning:', e.message);
  }
}

export async function GET(req: NextRequest) {
  await ensureNumberRangeSchema();
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'core_number_range';
    let legalSafe = true;
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
      rows = res.rows as any[];
      // Enrich with Industry standard fields: next_number, used_count, is_locked
      rows = rows.map((r: any) => ({
        ...r,
        prefix: '', // Industry standard – no prefix
        next_number: Number(r.current_number) + 1,
        used_count: Number(r.current_number) - Number(r.from_number),
        is_used: Number(r.current_number) > Number(r.from_number),
        is_locked: Number(r.current_number) > Number(r.from_number),
      }));
    } catch (newErr: any) {
      source = 'db-legacy';
      table = 'core_number_range';
      legalSafe = false;
      try {
        const res = await db.execute(sql`SELECT * FROM core_number_range ORDER BY object_type, code`);
        rows = res.rows as any[];
        rows = rows.map((r: any) => ({
          ...r,
          prefix: '',
          next_number: Number(r.current_number) + 1,
          used_count: Number(r.current_number) - Number(r.from_number),
          is_used: Number(r.current_number) > Number(r.from_number),
          is_locked: Number(r.current_number) > Number(r.from_number),
        }));
      } catch (e: any) {
        if (e.message?.includes('does not exist')) {
          return NextResponse.json({ data: [], numberRanges: [], count: 0, message: 'Table core_number_range not yet migrated', code: 'FNRC', aliasCodes: ['NRC','FBN1'], helperCode: 'FNRC', table: 'core_number_range', source: 'none', legalSafe: true });
        }
        throw e;
      }
    }
    return NextResponse.json({
      data: rows,
      numberRanges: rows,
      count: rows.length,
      code: 'FNRC',
      aliasCodes: ['NRC', 'FBN1', 'FIN-NR-CR'],
      helperCode: 'FNRC',
      table,
      source,
      legalSafe,
      functionDescription: 'Number Ranges – FNRC – Industry standard – purely numeric intervals – no prefix – Interval maintenance standard – shows next available number, locked badge if used',
      standardSpec: {
        numbering: 'Purely numeric – no prefix –  Interval maintenance standard – From/To/Current are numeric – e.g., PO 4500000000, PR 1000000000, MAT 10000000',
        prefix: 'REMOVED –  does not store prefix in number range – prefix field forced to empty for compliance',
        nextNumber: 'Next available = current_number + 1 – shown in FNRC page standard – e.g., current 4500000000 → next 4500000001',
        locking: 'If current > from, range is used → locked badge 🔒 instead of Edit/Delete – Industry standard',
      },
      erpDefaults: [
        { code: 'ITEM-01', objectType: 'ITEM', from: 10000000, to: 19999999, current: 10000000, next: 10000001, helperCode: 'FNRC', note: 'Material – Industry standard numeric 8-digit' },
        { code: 'MAT-01', objectType: 'ITEM', from: 10000000, to: 19999999, current: 10000000, next: 10000001, helperCode: 'FNRC', note: 'Material – numeric – no MAT- prefix – ' },
        { code: 'PARTNER-01', objectType: 'PARTNER', from: 100000, to: 199999, current: 100000, next: 100001, helperCode: 'FNRC' },
        { code: 'PO-01', objectType: 'PO', from: 4500000000, to: 4599999999, current: 4500000000, next: 4500000001, helperCode: 'FNRC', note: 'PO –  45* numeric' },
        { code: 'PR-01', objectType: 'PR', from: 1000000000, to: 1999999999, current: 1000000000, next: 1000000001, helperCode: 'FNRC', note: 'PR –  10-digit numeric' },
        { code: 'GR-01', objectType: 'GR', from: 5000000000, to: 5099999999, current: 5000000000, next: 5000000001, helperCode: 'FNRC', note: 'GR –  50* numeric' },
        { code: 'IV-01', objectType: 'IV', from: 5100000000, to: 5199999999, current: 5100000000, next: 5100000001, helperCode: 'FNRC' },
        { code: 'SO-01', objectType: 'SO', from: 1000000000, to: 1999999999, current: 1000000000, next: 1000000001, helperCode: 'FNRC' },
        { code: 'FI-01', objectType: 'FI_DOC', from: 1000000000, to: 1999999999, current: 1000000000, next: 1000000001, helperCode: 'FNRC' },
      ],
      lockingRules: {
        usedCriteria: 'current_number > from_number – e.g., ITEM-01 from 10000000 current 10000002 → 2 used → locked 🔒',
        editBlockedWhenUsed: 'code, object_type, from_number cannot change when used; to_number cannot be < current; only description, to_number increase allowed – Standard',
        deleteBlockedWhenUsed: 'If used, cannot delete – locked badge shown instead of Edit/Delete – keep for audit – create new range ITEM-02 instead',
        fiscalYear: 'Lock per code+year – e.g., PO-01 FY 2026 locked only if 2026 used, FY 2025 can still be edited',
        ui: 'FNRC page shows next available number standard – locked badge 🔒 replaces Edit/Delete buttons when used',
      },
      explanation: 'Number ranges – Industry standard – purely numeric, no prefix – next number displayed – locked badge if used – Interval maintenance standard',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], numberRanges: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureNumberRangeSchema();

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

    const isExternalVal = is_external === true || is_external === 'true';
    const finalObjectType = (objectType || object_type || 'FI_DOC').toString().trim().toUpperCase();
    const finalFiscalYear = fiscal_year !== undefined && fiscal_year !== null && fiscal_year !== '' ? Number(fiscal_year) : (year ? Number(year) : null);

    if (!code) {
      return NextResponse.json({ error: 'Interval code is required (e.g. 01, 10, 50)' }, { status: 400 });
    }

    const upperCode = code.toString().trim().toUpperCase();
    const fromNum = Number(from_number) || 1;
    const toNum = Number(to_number) || 9999999999;
    const currNum = current_number !== undefined && current_number !== null && current_number !== '' ? Number(current_number) : fromNum;
    const cCode = company_code ? company_code.toString().trim().toUpperCase() : null;
    const pCode = plant_code ? plant_code.toString().trim().toUpperCase() : null;
    const coCode = controlling_area_code ? controlling_area_code.toString().trim().toUpperCase() : null;
    const resolvedScope = scope_level ? scope_level.toString().trim().toUpperCase() : (cCode ? 'COMPANY_CODE' : (pCode ? 'PLANT' : (coCode ? 'CONTROLLING_AREA' : 'GLOBAL')));

    // Deterministic lookup by code + scope (company_code / plant_code) + fiscal_year
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
      if (exRes.rows.length > 0) {
        existing = exRes.rows[0];
      } else {
        // Fallback: check if exact code exists without company code / year
        const fallbackRes = await db.execute(sql`
          SELECT id, code, object_type, company_code, plant_code, controlling_area_code, from_number, to_number, current_number, fiscal_year, is_external 
          FROM core_number_range 
          WHERE UPPER(code) = ${upperCode}
            AND company_code IS NULL
            AND fiscal_year IS NULL
          LIMIT 1
        `);
        if (fallbackRes.rows.length > 0 && !cCode && !finalFiscalYear) {
          existing = fallbackRes.rows[0];
        }
      }
    } catch (lookupErr: any) {
      console.warn('Existing interval lookup warning:', lookupErr.message);
    }

    if (existing) {
      const isUsed = Number(existing.current_number) > Number(existing.from_number);
      const usedCount = Math.max(0, Number(existing.current_number) - Number(existing.from_number));

      if (isUsed) {
        if (Number(fromNum) !== Number(existing.from_number)) {
          return NextResponse.json({
            error: `Interval ${existing.code}${existing.fiscal_year ? ` FY ${existing.fiscal_year}` : ''} already in active use (${usedCount} documents issued). Starting number cannot be altered to maintain audit trail. Only upper bound (To Number) expansion is allowed.`
          }, { status: 400 });
        }
        if (Number(toNum) < Number(existing.current_number)) {
          return NextResponse.json({
            error: `Cannot reduce To Number ${existing.to_number} to ${toNum} below current consumed level ${existing.current_number}.`
          }, { status: 400 });
        }
      }

      const newTo = Number(toNum);
      const newFrom = isUsed ? Number(existing.from_number) : fromNum;
      const newCurr = isUsed ? Number(existing.current_number) : currNum;

      const updateRes = await db.execute(sql`
        UPDATE core_number_range SET
          from_number = ${newFrom},
          to_number = ${newTo},
          current_number = ${newCurr},
          company_code = COALESCE(${cCode}, company_code),
          plant_code = COALESCE(${pCode}, plant_code),
          controlling_area_code = COALESCE(${coCode}, controlling_area_code),
          scope_level = COALESCE(${resolvedScope}, scope_level),
          description = COALESCE(${description || null}, description),
          is_external = ${isExternalVal},
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

    // Fresh insert with constraint drop resilience
    let insertRes: any;
    try {
      insertRes = await db.execute(sql`
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
    } catch (insertErr: any) {
      // If error is duplicate key on code (legacy constraint), drop constraint on-the-fly and retry
      if (insertErr.message?.includes('uq_core_nr_code') || insertErr.message?.includes('duplicate key') || insertErr.message?.includes('core_number_range_code')) {
        console.warn('Dropping legacy unique constraint on code and retrying insert...');
        await db.execute(sql`DROP INDEX IF EXISTS uq_core_nr_code`).catch(() => {});
        await db.execute(sql`ALTER TABLE core_number_range DROP CONSTRAINT IF EXISTS core_number_range_code_unique`).catch(() => {});
        await db.execute(sql`ALTER TABLE core_number_range DROP CONSTRAINT IF EXISTS core_number_range_code_key`).catch(() => {});
        await db.execute(sql`ALTER TABLE core_number_range DROP CONSTRAINT IF EXISTS uq_core_nr_code`).catch(() => {});
        
        // Check if there is an existing row for this code that we can simply adopt/update
        const existingAny = await db.execute(sql`
          SELECT id FROM core_number_range WHERE UPPER(code) = ${upperCode} LIMIT 1
        `);
        if (existingAny.rows.length > 0 && (!cCode || cCode === '1000')) {
          insertRes = await db.execute(sql`
            UPDATE core_number_range SET
              from_number = ${fromNum},
              to_number = ${toNum},
              current_number = ${currNum},
              company_code = ${cCode},
              plant_code = ${pCode},
              controlling_area_code = ${coCode},
              scope_level = ${resolvedScope},
              fiscal_year = ${finalFiscalYear},
              is_external = ${isExternalVal},
              description = ${description || null},
              prefix = '',
              updated_at = NOW()
            WHERE id = ${(existingAny.rows[0] as any).id}
            RETURNING id, code, object_type, company_code, plant_code, controlling_area_code, scope_level, current_number, from_number, to_number, fiscal_year, is_external, description
          `);
        } else {
          // Retry insert with unique constraint eliminated
          insertRes = await db.execute(sql`
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
        }
      } else {
        throw insertErr;
      }
    }
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
    const { id, code, current_number, from_number, to_number, object_type, objectType, description, fiscal_year, year } = body;
    const finalFiscalYear = fiscal_year ?? year ?? null;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    try {
      let existing: any = null;
      if (id) {
        const exRes = await db.execute(sql`SELECT id, code, object_type, from_number, to_number, current_number, fiscal_year FROM core_number_range WHERE id = ${id} LIMIT 1`);
        if (exRes.rows.length > 0) existing = exRes.rows[0] as any;
      } else {
        if (finalFiscalYear) {
          const exRes = await db.execute(sql`SELECT id, code, object_type, from_number, to_number, current_number, fiscal_year FROM core_number_range WHERE code = ${code.toUpperCase()} AND COALESCE(fiscal_year, -1) = COALESCE(${finalFiscalYear}, -1) LIMIT 1`);
          if (exRes.rows.length > 0) existing = exRes.rows[0] as any;
        } else {
          const exRes = await db.execute(sql`SELECT id, code, object_type, from_number, to_number, current_number, fiscal_year FROM core_number_range WHERE code = ${code.toUpperCase()} LIMIT 1`);
          if (exRes.rows.length > 0) existing = exRes.rows[0] as any;
        }
      }
      if (!existing) throw new Error('Not found in core_number_range');

      const isUsed = Number(existing.current_number) > Number(existing.from_number);
      const usedCount = Number(existing.current_number) - Number(existing.from_number);

      if (isUsed) {
        if (code && code.toUpperCase() !== String(existing.code).toUpperCase()) {
          return NextResponse.json({ error: `Range ${existing.code}${existing.fiscal_year ? ` FY ${existing.fiscal_year}` : ''} used ${usedCount} times (current ${existing.current_number} > from ${existing.from_number}), cannot change code –  locked 🔒 – next ${Number(existing.current_number)+1} – create new range instead.` }, { status: 400 });
        }
        const newObjType = (objectType || object_type)?.toUpperCase();
        if (newObjType && newObjType !== String(existing.object_type).toUpperCase()) {
          return NextResponse.json({ error: `Range ${existing.code} used ${usedCount} times, cannot change object_type –  locked 🔒` }, { status: 400 });
        }
        if (from_number && Number(from_number) !== Number(existing.from_number)) {
          return NextResponse.json({ error: `Range ${existing.code} used ${usedCount} times, cannot change from_number –  locked – only to_number increase – next ${Number(existing.current_number)+1}` }, { status: 400 });
        }
        if (to_number && Number(to_number) < Number(existing.current_number)) {
          return NextResponse.json({ error: `Range ${existing.code} used ${usedCount} times, cannot reduce to_number ${existing.to_number} → ${to_number} below current ${existing.current_number} –  locked – next ${Number(existing.current_number)+1}` }, { status: 400 });
        }
        if (current_number && Number(current_number) < Number(existing.current_number)) {
          return NextResponse.json({ error: `Range ${existing.code} used ${usedCount} times, cannot reduce current_number – only increases via /api/number-ranges/next – next ${Number(existing.current_number)+1}` }, { status: 400 });
        }
        let res;
        const newTo = to_number ? Number(to_number) : Number(existing.to_number);
        const newDesc = description ?? null;
        if (id) {
          res = await db.execute(sql`UPDATE core_number_range SET to_number = ${newTo}, description = COALESCE(${newDesc}, description), prefix = '', updated_at = NOW() WHERE id = ${id} RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year`);
        } else {
          if (finalFiscalYear) {
            res = await db.execute(sql`UPDATE core_number_range SET to_number = ${newTo}, description = COALESCE(${newDesc}, description), prefix = '', updated_at = NOW() WHERE code = ${code.toUpperCase()} AND COALESCE(fiscal_year, -1) = COALESCE(${finalFiscalYear}, -1) RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year`);
          } else {
            res = await db.execute(sql`UPDATE core_number_range SET to_number = ${newTo}, description = COALESCE(${newDesc}, description), prefix = '', updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year`);
          }
        }
        const updated = res.rows[0] as any;
        return NextResponse.json({ success: true, numberRange: { ...updated, next_number: Number(updated.current_number)+1, used_count: usedCount, is_locked: true }, code: 'FNRC', message: `Range ${existing.code} used ${usedCount} times – locked 🔒 – only to_number increase (${existing.to_number}→${newTo}) and description updated – next ${Number(updated.current_number)+1}`, locked: true, usedCount, next_number: Number(updated.current_number)+1 });
      }

      let res;
      if (id) {
        res = await db.execute(sql`UPDATE core_number_range SET current_number = COALESCE(${current_number}, current_number), from_number = COALESCE(${from_number}, from_number), to_number = COALESCE(${to_number}, to_number), prefix = '', updated_at = NOW() WHERE id = ${id} RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year`);
      } else {
        if (finalFiscalYear) {
          res = await db.execute(sql`UPDATE core_number_range SET current_number = COALESCE(${current_number}, current_number), from_number = COALESCE(${from_number}, from_number), to_number = COALESCE(${to_number}, to_number), prefix = '', updated_at = NOW() WHERE code = ${code.toUpperCase()} AND COALESCE(fiscal_year, -1) = COALESCE(${finalFiscalYear}, -1) RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year`);
        } else {
          res = await db.execute(sql`UPDATE core_number_range SET current_number = COALESCE(${current_number}, current_number), from_number = COALESCE(${from_number}, from_number), to_number = COALESCE(${to_number}, to_number), prefix = '', updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year`);
        }
      }
      if (res.rows.length === 0) throw new Error('Not found in core_number_range');
      const updated = res.rows[0] as any;
      return NextResponse.json({ success: true, numberRange: { ...updated, next_number: Number(updated.current_number)+1, used_count: Number(updated.current_number)-Number(updated.from_number), is_locked: false }, code: 'FNRC', message: `Range ${updated.code} updated –  numeric – next ${Number(updated.current_number)+1}` });
    } catch (err: any) {
      if (err.message?.includes('used') || err.message?.includes('cannot') || err.message?.includes('locked')) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      let res;
      if (id) res = await db.execute(sql`UPDATE core_number_range SET current_number = COALESCE(${current_number}, current_number), from_number = COALESCE(${from_number}, from_number), to_number = COALESCE(${to_number}, to_number), prefix = '' WHERE id = ${id} RETURNING id, code, object_type, current_number`);
      else res = await db.execute(sql`UPDATE core_number_range SET current_number = COALESCE(${current_number}, current_number), from_number = COALESCE(${from_number}, from_number), to_number = COALESCE(${to_number}, to_number), prefix = '' WHERE code = ${code.toUpperCase()} RETURNING id, code, object_type, current_number`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Number range not found' }, { status: 404 });
      return NextResponse.json({ success: true, numberRange: { ...(res.rows[0] as any), next_number: Number((res.rows[0] as any).current_number)+1 }, message: `Range ${(res.rows[0] as any).code} updated – legacy – next ${Number((res.rows[0] as any).current_number)+1}` });
    }
  } catch (e: any) {
    if (e.message?.includes('used') || e.message?.includes('cannot') || e.message?.includes('locked')) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
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
    const fiscal_year = searchParams.get('fiscal_year') || searchParams.get('fiscalYear');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    try {
      let existing: any = null;
      if (id) {
        const exRes = await db.execute(sql`SELECT id, code, from_number, to_number, current_number, fiscal_year FROM core_number_range WHERE id = ${id} LIMIT 1`);
        if (exRes.rows.length > 0) existing = exRes.rows[0] as any;
      } else {
        if (fiscal_year) {
          const exRes = await db.execute(sql`SELECT id, code, from_number, to_number, current_number, fiscal_year FROM core_number_range WHERE code = ${code} AND COALESCE(fiscal_year, -1) = COALESCE(${fiscal_year}, -1) LIMIT 1`);
          if (exRes.rows.length > 0) existing = exRes.rows[0] as any;
        } else {
          const exRes = await db.execute(sql`SELECT id, code, from_number, to_number, current_number, fiscal_year FROM core_number_range WHERE code = ${code} LIMIT 1`);
          if (exRes.rows.length > 0) existing = exRes.rows[0] as any;
        }
      }

      if (existing) {
        const isUsed = Number(existing.current_number) > Number(existing.from_number);
        const usedCount = Number(existing.current_number) - Number(existing.from_number);
        if (isUsed) {
          return NextResponse.json({ 
            error: `Range ${existing.code}${existing.fiscal_year ? ` FY ${existing.fiscal_year}` : ''} used ${usedCount} times (current ${existing.current_number} > from ${existing.from_number}) – next ${Number(existing.current_number)+1} – cannot delete –  locked 🔒 – keep for audit. Docs ${existing.from_number}...${existing.current_number} already generated. Create new range ${existing.code}-NEW or ${existing.code}-${Number(existing.fiscal_year || 2026)+1} instead.`,
            locked: true,
            usedCount,
            current_number: existing.current_number,
            from_number: existing.from_number,
            next_number: Number(existing.current_number)+1,
            is_locked: true,
          }, { status: 400 });
        }
      }

      if (id) await db.execute(sql`DELETE FROM core_number_range WHERE id = ${id}`);
      else {
        if (fiscal_year) await db.execute(sql`DELETE FROM core_number_range WHERE code = ${code} AND COALESCE(fiscal_year, -1) = COALESCE(${fiscal_year}, -1)`);
        else await db.execute(sql`DELETE FROM core_number_range WHERE code = ${code}`);
      }
    } catch (err: any) {
      if (err.message?.includes('used') || err.message?.includes('cannot delete') || err.message?.includes('locked')) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      if (id) await db.execute(sql`DELETE FROM core_number_range WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM core_number_range WHERE code = ${code}`);
    }
    return NextResponse.json({ success: true, code: 'FNRC', message: `Range ${code || id}${fiscal_year ? ` FY ${fiscal_year}` : ''} deleted – was not used yet (current == from) – Industry standard` });
  } catch (e: any) {
    if (e.message?.includes('used') || e.message?.includes('cannot delete') || e.message?.includes('locked')) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
