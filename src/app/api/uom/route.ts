import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * UoM API – Base Unit of Measure configurable – Legal-safe own IP
 * New table: core_unit_measure (was ent_uom)
 * Sample data kept for convenience: KG, G, L, ML, PC, BOX, PACK, KIT, M, TON – as per requirement fresh empty but common sample kept
 * Helper code: EUOC (alias UOC, CUNI) – 4-char module-grouped E=Enterprise, UO=Unit of Measure, C=Create
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    // Try new table first
    try {
      const res = await db.execute(sql`SELECT code, name, dimension, is_active, created_at FROM core_unit_measure ORDER BY code`);
      return NextResponse.json({
        uoms: res.rows,
        count: res.rows.length,
        configurable: true,
        code: 'EUOC',
        aliasCodes: ['UOC', 'CUNI', 'FND-UOM-CR'],
        helperCode: 'EUOC',
        functionDescription: 'Units of Measurement – ERP EUOC – Legal-safe own IP (was CUNI)',
        table: 'core_unit_measure',
        examples: 'KG Kilogram WEIGHT, G Gram WEIGHT, L Liter VOLUME, PC Piece QUANTITY, BOX Box QUANTITY, M Meter LENGTH',
        explanation: 'Base UoM configurable – add new UoM via POST, e.g., M for Meter, TON for Ton – Code EUOC (new) alias CUNI',
        legalSafe: true,
      });
    } catch (newErr: any) {
      console.warn('core_unit_measure not yet migrated, fallback ent_uom:', newErr.message);
      const res = await db.execute(sql`SELECT id, code, name, dimension, is_active, created_at FROM ent_uom ORDER BY code`);
      return NextResponse.json({
        uoms: res.rows,
        count: res.rows.length,
        configurable: true,
        code: 'EUOC',
        aliasCodes: ['UOC', 'CUNI'],
        helperCode: 'CUNI',
        functionDescription: 'Units of Measurement – ERP CUNI – Configurable base UoM (legacy ent_uom)',
        examples: 'KG Kilogram WEIGHT, G Gram WEIGHT, L Liter VOLUME, PC Piece QUANTITY, BOX Box QUANTITY, M Meter LENGTH',
        explanation: 'Base UoM configurable – add new UoM via POST, e.g., M for Meter, TON for Ton – Code CUNI (legacy, new EUOC)',
        table: 'ent_uom',
        legalSafe: false,
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { code, name, dimension } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    // Try new table
    try {
      const res = await db.execute(sql`
        INSERT INTO core_unit_measure (code, name, dimension)
        VALUES (${code.toUpperCase()}, ${name}, ${dimension || 'QUANTITY'})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, dimension = ${dimension || 'QUANTITY'}, is_active = true, updated_at = NOW()
        RETURNING code, name, dimension
      `);
      return NextResponse.json({ success: true, uom: res.rows[0], code: 'EUOC', message: `UoM ${code.toUpperCase()} created/updated – EUOC legal-safe` });
    } catch (newErr: any) {
      console.warn('core_unit_measure insert failed, fallback ent_uom:', newErr.message);
      const res = await db.execute(sql`
        INSERT INTO ent_uom (code, name, dimension)
        VALUES (${code.toUpperCase()}, ${name}, ${dimension || 'QUANTITY'})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, dimension = ${dimension || 'QUANTITY'}, is_active = true
        RETURNING id, code, name
      `);
      return NextResponse.json({ success: true, uom: res.rows[0], code: 'EUOC', aliasCodes: ['CUNI'], message: `UoM ${code.toUpperCase()} created/updated – legacy CUNI (migrating to EUOC)` });
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
    const { id, code, name, dimension, is_active } = body;
    if (!code && !id) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    // Try new table
    try {
      let res;
      if (id) {
        // core_unit_measure uses code as PK, not id – try by code if id is code
        res = await db.execute(sql`
          UPDATE core_unit_measure SET code = COALESCE(${code?.toUpperCase()}, code), name = COALESCE(${name}, name), dimension = COALESCE(${dimension}, dimension), is_active = COALESCE(${is_active}, is_active), updated_at = NOW()
          WHERE code = ${code?.toUpperCase() || id} RETURNING code, name, dimension
        `);
      } else {
        res = await db.execute(sql`
          UPDATE core_unit_measure SET name = COALESCE(${name}, name), dimension = COALESCE(${dimension}, dimension), is_active = COALESCE(${is_active}, is_active), updated_at = NOW()
          WHERE code = ${code.toUpperCase()} RETURNING code, name, dimension
        `);
      }
      if (res.rows.length === 0) return NextResponse.json({ error: 'UoM not found in core_unit_measure' }, { status: 404 });
      return NextResponse.json({ success: true, uom: res.rows[0], code: 'EUOC' });
    } catch (newErr: any) {
      console.warn('core_unit_measure update failed, fallback ent_uom:', newErr.message);
      let res;
      if (id) {
        res = await db.execute(sql`
          UPDATE ent_uom SET code = COALESCE(${code?.toUpperCase()}, code), name = COALESCE(${name}, name), dimension = COALESCE(${dimension}, dimension), is_active = COALESCE(${is_active}, is_active)
          WHERE id = ${id} RETURNING id, code, name
        `);
      } else {
        res = await db.execute(sql`
          UPDATE ent_uom SET name = COALESCE(${name}, name), dimension = COALESCE(${dimension}, dimension), is_active = COALESCE(${is_active}, is_active)
          WHERE code = ${code.toUpperCase()} RETURNING id, code, name
        `);
      }
      if (res.rows.length === 0) return NextResponse.json({ error: 'UoM not found' }, { status: 404 });
      return NextResponse.json({ success: true, uom: res.rows[0] });
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
    const code = searchParams.get('code');
    const id = searchParams.get('id');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    const checkCode = (code ? code.toUpperCase() : '').toUpperCase();

    // Try new table first
    try {
      let inUse = 0;
      if (checkCode) {
        try {
          const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM prod_item WHERE base_unit = ${checkCode}`);
          inUse = parseInt((r.rows[0] as any).cnt || '0');
        } catch {}
        // Also check legacy
        try {
          const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM ent_material_master WHERE base_uom = ${checkCode}`);
          inUse += parseInt((r.rows[0] as any).cnt || '0');
        } catch {}
      }

      if (inUse > 0) {
        if (checkCode) await db.execute(sql`UPDATE core_unit_measure SET is_active = false, updated_at = NOW() WHERE code = ${checkCode}`);
        return NextResponse.json({ error: `Cannot delete – UoM ${code} has ${inUse} items and cannot be deleted to maintain audit trail. Deactivated instead.`, code: 'HAS_TRANSACTIONS', softDeleted: true, message: `UoM ${code} deactivated – has items` }, { status: 400 });
      }

      if (checkCode) await db.execute(sql`DELETE FROM core_unit_measure WHERE code = ${checkCode}`);
      else if (id) await db.execute(sql`DELETE FROM core_unit_measure WHERE code = ${id}`);

      return NextResponse.json({ success: true, code: 'EUOC', message: `UoM ${code || id} deleted – legal-safe` });
    } catch (newErr: any) {
      console.warn('core_unit_measure delete failed, fallback ent_uom:', newErr.message);
      let inUse = 0;
      try {
        if (checkCode) {
          const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM ent_material_master WHERE base_uom = ${checkCode}`);
          inUse = parseInt((r.rows[0] as any).cnt || '0');
        }
      } catch {}

      if (inUse > 0) {
        if (id) await db.execute(sql`UPDATE ent_uom SET is_active = false WHERE id = ${id}`);
        else await db.execute(sql`UPDATE ent_uom SET is_active = false WHERE code = ${checkCode}`);
        return NextResponse.json({ error: `Cannot delete – UoM ${code} has ${inUse} materials and cannot be deleted to maintain audit trail. Deactivated instead.`, code: 'HAS_TRANSACTIONS', softDeleted: true, message: `UoM ${code} deactivated – has materials` }, { status: 400 });
      }

      if (id) await db.execute(sql`DELETE FROM ent_uom WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM ent_uom WHERE code = ${checkCode}`);

      return NextResponse.json({ success: true, message: `UoM ${code || id} deleted – legacy` });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
