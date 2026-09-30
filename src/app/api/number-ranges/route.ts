import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Number Ranges API – Legal-safe own IP – Module 4 – SAP-like locking
 * New: core_number_range + buffer – objectType ITEM/PARTNER/LOT/PR/PO/GR/IV/PROD_ORDER/FI_DOC etc
 * SAP-like rules (per user confirmation):
 * - Used if current_number > from_number (e.g., MAT-01 from 100000 current 100002 → 2 used)
 * - If used, locked from editing/deleting per code+year (per_code_year)
 * - Edit blocked: code, object_type, from_number, prefix cannot change when used
 * - to_number cannot be < current_number
 * - Allow only: description, to_number increase, is_active
 * - Delete blocked if used – keep for audit, like SAP FBN1/SNRO
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'core_number_range';
    let legalSafe = true;
    try {
      const res = await db.execute(sql`SELECT * FROM core_number_range ORDER BY object_type, code, fiscal_year NULLS LAST`);
      rows = res.rows as any[];
    } catch (newErr: any) {
      source = 'db-legacy';
      table = 'ent_number_range';
      legalSafe = false;
      try {
        const res = await db.execute(sql`SELECT * FROM ent_number_range ORDER BY object_type, code`);
        rows = res.rows as any[];
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
      functionDescription: 'Number Ranges – FNRC legal-safe – SAP-like locking: if current>from, range locked from edit/delete – per code+year',
      erpDefaults: [
        { code: 'ITEM-01', objectType: 'ITEM', prefix: 'ITM-', from: 100000, to: 199999, current: 100000, helperCode: 'FNRC', note: 'Material/item numbering – auto if blank' },
        { code: 'MAT-01', objectType: 'ITEM', prefix: 'MAT-', from: 100000, to: 199999, current: 100000, helperCode: 'FNRC', note: 'Material – MAT- prefix – SAP-like' },
        { code: 'PARTNER-01', objectType: 'PARTNER', prefix: 'BP-', from: 100000, to: 199999, current: 100000, helperCode: 'FNRC' },
        { code: 'PO-01', objectType: 'PO', prefix: 'PO-', from: 4500000000, to: 4599999999, current: 4500000000, helperCode: 'FNRC' },
        { code: 'PR-01', objectType: 'PR', prefix: 'PR-', from: 1000000000, to: 1999999999, current: 1000000000, helperCode: 'FNRC' },
        { code: 'GR-01', objectType: 'GR', prefix: 'GR-', from: 5000000000, to: 5099999999, current: 5000000000, helperCode: 'FNRC' },
        { code: 'SO-01', objectType: 'SALES_ORDER', prefix: 'SO-', from: 1000000000, to: 1999999999, current: 1000000000, helperCode: 'FNRC' },
      ],
      lockingRules: {
        usedCriteria: 'current_number > from_number – e.g., MAT-01 from 100000 current 100002 → 2 used → locked',
        editBlockedWhenUsed: 'code, object_type, from_number, prefix cannot change; to_number cannot be < current_number; only description, to_number increase, is_active allowed – SAP-like FBN1',
        deleteBlockedWhenUsed: 'If used, cannot delete – keep for audit – create new range MAT-02 instead – SAP-like',
        fiscalYear: 'Lock per code+year – e.g., PO-2026 locked only if 2026 used, PO-2025 can still be edited – per_code_year',
      },
      explanation: 'Number ranges legal-safe core_number_range – SAP-like locking – if used, locked',
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
    const { code, object_type, objectType, prefix, from_number, to_number, current_number, legal_entity_id, fiscal_year, description, year } = body;
    const finalObjectType = objectType || object_type;
    const finalFiscalYear = fiscal_year ?? year ?? null;
    if (!code || !finalObjectType) return NextResponse.json({ error: 'code and object_type/objectType required' }, { status: 400 });

    const upperCode = code.toUpperCase();
    const upperObjType = finalObjectType.toUpperCase();

    try {
      // Check existing for SAP-like locking – per code+year
      let existing: any = null;
      try {
        if (finalFiscalYear) {
          const exRes = await db.execute(sql`SELECT id, code, object_type, prefix, from_number, to_number, current_number, fiscal_year FROM core_number_range WHERE code = ${upperCode} AND COALESCE(fiscal_year, -1) = COALESCE(${finalFiscalYear}, -1) LIMIT 1`);
          if (exRes.rows.length > 0) existing = exRes.rows[0] as any;
        } else {
          const exRes = await db.execute(sql`SELECT id, code, object_type, prefix, from_number, to_number, current_number, fiscal_year FROM core_number_range WHERE code = ${upperCode} LIMIT 1`);
          if (exRes.rows.length > 0) existing = exRes.rows[0] as any;
        }
      } catch {}

      if (existing) {
        const isUsed = Number(existing.current_number) > Number(existing.from_number);
        const usedCount = Number(existing.current_number) - Number(existing.from_number);
        if (isUsed) {
          // SAP strict checks
          if (from_number && Number(from_number) !== Number(existing.from_number)) {
            return NextResponse.json({ error: `Range ${existing.code}${existing.fiscal_year ? ` FY ${existing.fiscal_year}` : ''} already used ${usedCount} times (current ${existing.current_number} > from ${existing.from_number}), cannot change from_number ${existing.from_number} → ${from_number} – SAP-like locked – only to_number increase, description allowed. Create new range ${upperCode}-NEW instead.` }, { status: 400 });
          }
          if (prefix && prefix !== existing.prefix) {
            return NextResponse.json({ error: `Range ${existing.code}${existing.fiscal_year ? ` FY ${existing.fiscal_year}` : ''} already used ${usedCount} times, cannot change prefix ${existing.prefix} → ${prefix} – SAP-like locked – prefix change would break existing docs ${existing.prefix}${existing.from_number}...` }, { status: 400 });
          }
          if (upperObjType !== String(existing.object_type).toUpperCase()) {
            return NextResponse.json({ error: `Range ${existing.code} already used ${usedCount} times, cannot change object_type ${existing.object_type} → ${upperObjType} – SAP-like locked` }, { status: 400 });
          }
          if (to_number && Number(to_number) < Number(existing.current_number)) {
            return NextResponse.json({ error: `Range ${existing.code} already used ${usedCount} times, cannot reduce to_number ${existing.to_number} → ${to_number} below current_number ${existing.current_number} – would lose generated numbers – SAP-like. Only increase to_number allowed.` }, { status: 400 });
          }
          // Allow only description, to_number increase
          const newTo = to_number ? Number(to_number) : Number(existing.to_number);
          const res = await db.execute(sql`
            UPDATE core_number_range SET to_number = ${newTo}, description = COALESCE(${description || null}, description), updated_at = NOW()
            WHERE code = ${upperCode} AND COALESCE(fiscal_year, -1) = COALESCE(${finalFiscalYear}, -1)
            RETURNING id, code, object_type, current_number, from_number, to_number
          `);
          return NextResponse.json({ success: true, numberRange: res.rows[0], code: 'FNRC', message: `Number range ${upperCode} already used ${usedCount} times – only to_number increase/description updated – SAP-like locked – from/prefix/object_type unchanged`, locked: true, usedCount });
        }
      }

      // Not used or new – allow full create/upsert
      const res = await db.execute(sql`
        INSERT INTO core_number_range (code, object_type, prefix, from_number, to_number, current_number, legal_entity_id, fiscal_year, description)
        VALUES (${upperCode}, ${upperObjType}::core_number_range_object_type, ${prefix || ''}, ${from_number || 1}, ${to_number || 9999999999}, ${current_number || from_number || 1}, ${legal_entity_id || null}, ${finalFiscalYear}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET object_type = ${upperObjType}::core_number_range_object_type, prefix = ${prefix || ''}, from_number = ${from_number || 1}, to_number = ${to_number || 9999999999}, current_number = ${current_number || from_number || 1}, description = ${description || null}, updated_at = NOW()
        RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year
      `);
      return NextResponse.json({ success: true, numberRange: res.rows[0], code: 'FNRC', message: `Number range ${upperCode}${finalFiscalYear ? ` FY ${finalFiscalYear}` : ''} created – FNRC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('core_number_range insert failed fallback ent_number_range:', newErr.message);
      // Fallback legacy – still apply locking check for legacy
      try {
        const exLegacy = await db.execute(sql`SELECT id, code, object_type, prefix, from_number, to_number, current_number FROM ent_number_range WHERE code = ${upperCode} LIMIT 1`);
        if (exLegacy.rows.length > 0) {
          const existing = exLegacy.rows[0] as any;
          const isUsed = Number(existing.current_number) > Number(existing.from_number);
          if (isUsed) {
            const usedCount = Number(existing.current_number) - Number(existing.from_number);
            if (from_number && Number(from_number) !== Number(existing.from_number)) {
              return NextResponse.json({ error: `Legacy range ${existing.code} already used ${usedCount} times, cannot change from_number – SAP-like locked` }, { status: 400 });
            }
            if (to_number && Number(to_number) < Number(existing.current_number)) {
              return NextResponse.json({ error: `Legacy range ${existing.code} already used ${usedCount} times, cannot reduce to_number below current ${existing.current_number}` }, { status: 400 });
            }
          }
        }
      } catch {}
      const res = await db.execute(sql`
        INSERT INTO ent_number_range (code, object_type, prefix, from_number, to_number, current_number, company_code_id, year, description)
        VALUES (${upperCode}, ${upperObjType}, ${prefix || ''}, ${from_number || 1}, ${to_number || 9999999999}, ${current_number || from_number || 1}, ${legal_entity_id || null}, ${finalFiscalYear}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET object_type = ${upperObjType}, prefix = ${prefix || ''}, from_number = ${from_number || 1}, to_number = ${to_number || 9999999999}, current_number = ${current_number || from_number || 1}, description = ${description || null}
        RETURNING id, code, object_type, current_number
      `);
      return NextResponse.json({ success: true, numberRange: res.rows[0], code: 'FNRC', aliasCodes: ['FBN1'], message: `Number range ${upperCode} created – FBN1 legacy`, legalSafe: false });
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
    const { id, code, current_number, from_number, to_number, prefix, object_type, objectType, description, fiscal_year, year } = body;
    const finalFiscalYear = fiscal_year ?? year ?? null;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    try {
      // Fetch existing – per code+year locking
      let existing: any = null;
      if (id) {
        const exRes = await db.execute(sql`SELECT id, code, object_type, prefix, from_number, to_number, current_number, fiscal_year FROM core_number_range WHERE id = ${id} LIMIT 1`);
        if (exRes.rows.length > 0) existing = exRes.rows[0] as any;
      } else {
        if (finalFiscalYear) {
          const exRes = await db.execute(sql`SELECT id, code, object_type, prefix, from_number, to_number, current_number, fiscal_year FROM core_number_range WHERE code = ${code.toUpperCase()} AND COALESCE(fiscal_year, -1) = COALESCE(${finalFiscalYear}, -1) LIMIT 1`);
          if (exRes.rows.length > 0) existing = exRes.rows[0] as any;
        } else {
          const exRes = await db.execute(sql`SELECT id, code, object_type, prefix, from_number, to_number, current_number, fiscal_year FROM core_number_range WHERE code = ${code.toUpperCase()} LIMIT 1`);
          if (exRes.rows.length > 0) existing = exRes.rows[0] as any;
        }
      }
      if (!existing) throw new Error('Not found in core_number_range');

      const isUsed = Number(existing.current_number) > Number(existing.from_number);
      const usedCount = Number(existing.current_number) - Number(existing.from_number);

      if (isUsed) {
        // SAP strict – block code, object_type, from_number, prefix change
        if (code && code.toUpperCase() !== String(existing.code).toUpperCase()) {
          return NextResponse.json({ error: `Range ${existing.code}${existing.fiscal_year ? ` FY ${existing.fiscal_year}` : ''} already used ${usedCount} times (current ${existing.current_number} > from ${existing.from_number}), cannot change code ${existing.code} → ${code.toUpperCase()} – SAP-like locked. Create new range instead.` }, { status: 400 });
        }
        const newObjType = (objectType || object_type)?.toUpperCase();
        if (newObjType && newObjType !== String(existing.object_type).toUpperCase()) {
          return NextResponse.json({ error: `Range ${existing.code}${existing.fiscal_year ? ` FY ${existing.fiscal_year}` : ''} already used ${usedCount} times, cannot change object_type ${existing.object_type} → ${newObjType} – SAP-like locked` }, { status: 400 });
        }
        if (from_number && Number(from_number) !== Number(existing.from_number)) {
          return NextResponse.json({ error: `Range ${existing.code}${existing.fiscal_year ? ` FY ${existing.fiscal_year}` : ''} already used ${usedCount} times, cannot change from_number ${existing.from_number} → ${from_number} – SAP-like locked – only to_number increase allowed` }, { status: 400 });
        }
        if (prefix && prefix !== existing.prefix) {
          return NextResponse.json({ error: `Range ${existing.code}${existing.fiscal_year ? ` FY ${existing.fiscal_year}` : ''} already used ${usedCount} times, cannot change prefix ${existing.prefix} → ${prefix} – would break existing docs like ${existing.prefix}${existing.from_number}` }, { status: 400 });
        }
        if (to_number && Number(to_number) < Number(existing.current_number)) {
          return NextResponse.json({ error: `Range ${existing.code}${existing.fiscal_year ? ` FY ${existing.fiscal_year}` : ''} already used ${usedCount} times, cannot reduce to_number ${existing.to_number} → ${to_number} below current_number ${existing.current_number} – SAP-like` }, { status: 400 });
        }
        if (current_number && Number(current_number) < Number(existing.current_number)) {
          return NextResponse.json({ error: `Range ${existing.code} already used ${usedCount} times, cannot reduce current_number ${existing.current_number} → ${current_number} – current only increases via /api/number-ranges/next` }, { status: 400 });
        }
        // Allow only to_number increase and description
        let res;
        const newTo = to_number ? Number(to_number) : Number(existing.to_number);
        const newDesc = description ?? null;
        if (id) {
          res = await db.execute(sql`UPDATE core_number_range SET to_number = ${newTo}, description = COALESCE(${newDesc}, description), updated_at = NOW() WHERE id = ${id} RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year`);
        } else {
          if (finalFiscalYear) {
            res = await db.execute(sql`UPDATE core_number_range SET to_number = ${newTo}, description = COALESCE(${newDesc}, description), updated_at = NOW() WHERE code = ${code.toUpperCase()} AND COALESCE(fiscal_year, -1) = COALESCE(${finalFiscalYear}, -1) RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year`);
          } else {
            res = await db.execute(sql`UPDATE core_number_range SET to_number = ${newTo}, description = COALESCE(${newDesc}, description), updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year`);
          }
        }
        return NextResponse.json({ success: true, numberRange: res.rows[0], code: 'FNRC', message: `Number range ${existing.code}${existing.fiscal_year ? ` FY ${existing.fiscal_year}` : ''} already used ${usedCount} times – only to_number increase (${existing.to_number}→${newTo}) and description updated – SAP-like locked`, locked: true, usedCount });
      }

      // Not used – allow full edit
      let res;
      if (id) {
        res = await db.execute(sql`UPDATE core_number_range SET current_number = COALESCE(${current_number}, current_number), from_number = COALESCE(${from_number}, from_number), to_number = COALESCE(${to_number}, to_number), prefix = COALESCE(${prefix}, prefix), updated_at = NOW() WHERE id = ${id} RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year`);
      } else {
        if (finalFiscalYear) {
          res = await db.execute(sql`UPDATE core_number_range SET current_number = COALESCE(${current_number}, current_number), from_number = COALESCE(${from_number}, from_number), to_number = COALESCE(${to_number}, to_number), prefix = COALESCE(${prefix}, prefix), updated_at = NOW() WHERE code = ${code.toUpperCase()} AND COALESCE(fiscal_year, -1) = COALESCE(${finalFiscalYear}, -1) RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year`);
        } else {
          res = await db.execute(sql`UPDATE core_number_range SET current_number = COALESCE(${current_number}, current_number), from_number = COALESCE(${from_number}, from_number), to_number = COALESCE(${to_number}, to_number), prefix = COALESCE(${prefix}, prefix), updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year`);
        }
      }
      if (res.rows.length === 0) throw new Error('Not found in core_number_range');
      return NextResponse.json({ success: true, numberRange: res.rows[0], code: 'FNRC', message: `Number range ${res.rows[0].code}${res.rows[0].fiscal_year ? ` FY ${res.rows[0].fiscal_year}` : ''} updated – FNRC legal-safe` });
    } catch (err: any) {
      if (err.message?.includes('already used') || err.message?.includes('cannot change') || err.message?.includes('cannot reduce')) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      // Fallback legacy
      let res;
      if (id) res = await db.execute(sql`UPDATE ent_number_range SET current_number = COALESCE(${current_number}, current_number), from_number = COALESCE(${from_number}, from_number), to_number = COALESCE(${to_number}, to_number), prefix = COALESCE(${prefix}, prefix) WHERE id = ${id} RETURNING id, code, object_type, current_number`);
      else res = await db.execute(sql`UPDATE ent_number_range SET current_number = COALESCE(${current_number}, current_number), from_number = COALESCE(${from_number}, from_number), to_number = COALESCE(${to_number}, to_number), prefix = COALESCE(${prefix}, prefix) WHERE code = ${code.toUpperCase()} RETURNING id, code, object_type, current_number`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Number range not found' }, { status: 404 });
      return NextResponse.json({ success: true, numberRange: res.rows[0], message: `Number range ${res.rows[0].code} updated – FBN1 legacy` });
    }
  } catch (e: any) {
    if (e.message?.includes('already used') || e.message?.includes('cannot')) {
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
      // Fetch existing to check used – per code+year
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
            error: `Range ${existing.code}${existing.fiscal_year ? ` FY ${existing.fiscal_year}` : ''} already used ${usedCount} times (current ${existing.current_number} > from ${existing.from_number}), cannot delete – SAP-like – keep for audit. Existing docs like ${existing.code}-${existing.from_number}...${existing.current_number} already generated (e.g., 2 POs). Create new range ${existing.code}-NEW or ${existing.code}-${Number(existing.fiscal_year || 2026)+1} instead. If you must reset, create new range, do not delete old – audit trail required.`,
            locked: true,
            usedCount,
            current_number: existing.current_number,
            from_number: existing.from_number,
          }, { status: 400 });
        }
      }

      if (id) await db.execute(sql`DELETE FROM core_number_range WHERE id = ${id}`);
      else {
        if (fiscal_year) await db.execute(sql`DELETE FROM core_number_range WHERE code = ${code} AND COALESCE(fiscal_year, -1) = COALESCE(${fiscal_year}, -1)`);
        else await db.execute(sql`DELETE FROM core_number_range WHERE code = ${code}`);
      }
    } catch (err: any) {
      if (err.message?.includes('already used') || err.message?.includes('cannot delete')) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      // Fallback legacy
      if (id) await db.execute(sql`DELETE FROM ent_number_range WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM ent_number_range WHERE code = ${code}`);
    }
    return NextResponse.json({ success: true, code: 'FNRC', message: `Number range ${code || id}${fiscal_year ? ` FY ${fiscal_year}` : ''} deleted – FNRC legal-safe – was not used yet (current == from)` });
  } catch (e: any) {
    if (e.message?.includes('already used') || e.message?.includes('cannot delete')) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
