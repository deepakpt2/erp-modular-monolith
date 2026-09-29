import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Number Ranges API – Legal-safe own IP – Module 4
 * New: core_number_range + core_number_range_buffer (was ent_number_range) – objectType ITEM/PARTNER/LOT/PR/PO/GR/IV/PROD_ORDER/FI_DOC etc, legalEntityId was company_code_id, fiscalYear was year, prefix neutral
 * Helper code: FNRC Number Range Create (alias NRC, FBN1, FIN-NR-CR) – 4-char MOOA F=Foundation, NR=NumberRange, C=Create – module grouped intuitive
 * Fallback to legacy ent_number_range
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
      const res = await db.execute(sql`SELECT * FROM core_number_range ORDER BY object_type, code`);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('core_number_range not yet fallback ent_number_range:', newErr.message);
      source = 'db-legacy';
      table = 'ent_number_range';
      legalSafe = false;
      try {
        const res = await db.execute(sql`SELECT * FROM ent_number_range ORDER BY object_type, code`);
        rows = res.rows as any[];
      } catch (e: any) {
        if (e.message?.includes('does not exist')) {
          return NextResponse.json({ data: [], numberRanges: [], count: 0, message: 'Table core_number_range not yet migrated – fresh empty Module 4', code: 'FNRC', aliasCodes: ['NRC','FBN1'], helperCode: 'FNRC', table: 'core_number_range', source: 'none', legalSafe: true });
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
      functionDescription: 'Number Ranges – FNRC legal-safe own IP (was FBN1) – objectType ITEM/PARTNER/LOT/PR/PO/GR/IV/PROD_ORDER/FI_DOC, legalEntityId, fiscalYear, prefix neutral, sample kept',
      erpDefaults: [
        { code: 'ITEM-01', objectType: 'ITEM', prefix: 'ITM-', from: 100000, to: 199999, current: 100000, helperCode: 'FNRC', note: 'Sample kept – material/item numbering' },
        { code: 'PARTNER-01', objectType: 'PARTNER', prefix: 'BP-', from: 100000, to: 199999, current: 100000, helperCode: 'FNRC' },
        { code: 'PO-01', objectType: 'PO', prefix: 'PO-', from: 4500000000, to: 4599999999, current: 4500000000, helperCode: 'FNRC' },
        { code: 'GR-01', objectType: 'GR', prefix: 'GR-', from: 5000000000, to: 5099999999, current: 5000000000, helperCode: 'FNRC' },
        { code: 'IV-01', objectType: 'IV', prefix: 'IV-', from: 5100000000, to: 5199999999, current: 5100000000, helperCode: 'FNRC' },
        { code: 'FI-DOC-01', objectType: 'FI_DOC', prefix: 'FI-', from: 1000000000, to: 1999999999, current: 1000000000, helperCode: 'FNRC' },
      ],
      explanation: 'Number ranges legal-safe core_number_range + buffer – objectType ITEM/PARTNER/LOT/PR/PO/GR/IV/PROD_ORDER/FI_DOC etc, legalEntityId was company_code_id, fiscalYear was year, prefix neutral – Code FNRC primary alias NRC/FBN1 – 4-char MOOA F=Foundation NR=NumberRange C=Create – module grouped intuitive – sample data kept for user convenience per requirement fresh empty but common sample data like coa, gl, tax, currencies, UoM kept.',
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
    const { code, object_type, objectType, prefix, from_number, to_number, current_number, legal_entity_id, fiscal_year, description } = body;
    const finalObjectType = objectType || object_type;
    if (!code || !finalObjectType) return NextResponse.json({ error: 'code and object_type/objectType required' }, { status: 400 });

    try {
      const res = await db.execute(sql`
        INSERT INTO core_number_range (code, object_type, prefix, from_number, to_number, current_number, legal_entity_id, fiscal_year, description)
        VALUES (${code.toUpperCase()}, ${finalObjectType.toUpperCase()}::core_number_range_object_type, ${prefix || ''}, ${from_number || 1}, ${to_number || 9999999999}, ${current_number || from_number || 1}, ${legal_entity_id || null}, ${fiscal_year || null}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET object_type = ${finalObjectType.toUpperCase()}::core_number_range_object_type, prefix = ${prefix || ''}, from_number = ${from_number || 1}, to_number = ${to_number || 9999999999}, current_number = ${current_number || from_number || 1}, description = ${description || null}, updated_at = NOW()
        RETURNING id, code, object_type, current_number
      `);
      return NextResponse.json({ success: true, numberRange: res.rows[0], code: 'FNRC', aliasCodes: ['NRC','FBN1'], message: `Number range ${code.toUpperCase()} created – FNRC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('core_number_range insert failed fallback ent_number_range:', newErr.message);
      const res = await db.execute(sql`
        INSERT INTO ent_number_range (code, object_type, prefix, from_number, to_number, current_number, company_code_id, year, description)
        VALUES (${code.toUpperCase()}, ${finalObjectType.toUpperCase()}, ${prefix || ''}, ${from_number || 1}, ${to_number || 9999999999}, ${current_number || from_number || 1}, ${legal_entity_id || null}, ${fiscal_year || null}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET object_type = ${finalObjectType.toUpperCase()}, prefix = ${prefix || ''}, from_number = ${from_number || 1}, to_number = ${to_number || 9999999999}, current_number = ${current_number || from_number || 1}, description = ${description || null}
        RETURNING id, code, object_type, current_number
      `);
      return NextResponse.json({ success: true, numberRange: res.rows[0], code: 'FNRC', aliasCodes: ['FBN1'], message: `Number range ${code.toUpperCase()} created – FBN1 legacy (migrating to FNRC)`, legalSafe: false });
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
    const { id, code, current_number, from_number, to_number, prefix } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE core_number_range SET current_number = COALESCE(${current_number}, current_number), from_number = COALESCE(${from_number}, from_number), to_number = COALESCE(${to_number}, to_number), prefix = COALESCE(${prefix}, prefix), updated_at = NOW() WHERE id = ${id} RETURNING id, code, current_number`);
      else res = await db.execute(sql`UPDATE core_number_range SET current_number = COALESCE(${current_number}, current_number), from_number = COALESCE(${from_number}, from_number), to_number = COALESCE(${to_number}, to_number), prefix = COALESCE(${prefix}, prefix), updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code, current_number`);
      if (res.rows.length === 0) throw new Error('Not found in core_number_range');
      return NextResponse.json({ success: true, numberRange: res.rows[0], code: 'FNRC', message: `Number range ${res.rows[0].code} updated – FNRC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE ent_number_range SET current_number = COALESCE(${current_number}, current_number), from_number = COALESCE(${from_number}, from_number), to_number = COALESCE(${to_number}, to_number), prefix = COALESCE(${prefix}, prefix) WHERE id = ${id} RETURNING id, code, current_number`);
      else res = await db.execute(sql`UPDATE ent_number_range SET current_number = COALESCE(${current_number}, current_number), from_number = COALESCE(${from_number}, from_number), to_number = COALESCE(${to_number}, to_number), prefix = COALESCE(${prefix}, prefix) WHERE code = ${code.toUpperCase()} RETURNING id, code, current_number`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Number range not found' }, { status: 404 });
      return NextResponse.json({ success: true, numberRange: res.rows[0], message: `Number range ${res.rows[0].code} updated – FBN1 legacy` });
    }
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

    try {
      if (id) await db.execute(sql`DELETE FROM core_number_range WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM core_number_range WHERE code = ${code}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM ent_number_range WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM ent_number_range WHERE code = ${code}`);
    }

    return NextResponse.json({ success: true, code: 'FNRC', message: `Number range ${code || id} deleted – FNRC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
