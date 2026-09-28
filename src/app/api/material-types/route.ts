import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Material Types API – Configurable material types
 * Currently 3 types: ROH (Raw), HALB (Semi-finished), FERT (Finished)
 * But configurable – you can add new types like HAWA (Trading), VERP (Packaging), etc
 * Storage: ent_material_type table (created if not exists) or fallback to distinct from ent_material_master.type
 * Base UoM also configurable via ent_uom
 */

async function ensureTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ent_material_type (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    // Seed default 3 types if empty
    const cnt = await db.execute(sql`SELECT COUNT(*) as c FROM ent_material_type`);
    if (parseInt((cnt.rows[0] as any).c || '0') === 0) {
      await db.execute(sql`
        INSERT INTO ent_material_type (code, name, description) VALUES
        ('ROH', 'Raw Material', 'Raw materials purchased from vendors, e.g., Black Pepper Raw, valuation BSX 5000000001'),
        ('HALB', 'Semi-Finished', 'Semi-finished goods produced internally, e.g., Spice Mix Intermediate'),
        ('FERT', 'Finished Goods', 'Finished goods for sale, e.g., Pepper Powder 100g, valuation BSX 5000000002'),
        ('HAWA', 'Trading Goods', 'Trading goods bought and sold without production'),
        ('VERP', 'Packaging', 'Packaging materials'),
        ('NLAG', 'Non-Stock Material', 'Non-stock consumables')
        ON CONFLICT (code) DO NOTHING
      `);
    }
  } catch (e) {
    console.warn('ensure ent_material_type failed', e);
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTable();

  try {
    const typesRes = await db.execute(sql`SELECT id, code, name, description, is_active, created_at FROM ent_material_type ORDER BY code`);
    // Also get distinct from actual materials for reference
    let distinctTypes: any[] = [];
    try {
      const d = await db.execute(sql`SELECT DISTINCT type as code, COUNT(*) as count FROM ent_material_master GROUP BY type ORDER BY type`);
      distinctTypes = d.rows;
    } catch {}

    // UoM also
    let uoms: any[] = [];
    try {
      const u = await db.execute(sql`SELECT code, name, dimension, is_active FROM ent_uom ORDER BY code`);
      uoms = u.rows;
    } catch {}

    return NextResponse.json({
      materialTypes: typesRes.rows,
      distinctInUse: distinctTypes,
      baseUoms: uoms,
      count: typesRes.rows.length,
      configurable: true, helperCode: 'OMS2',
      functionDescription: 'Define Material Types – ERP OMS2 – Configurable: ROH/HALB/FERT + HAWA/VERP/NLAG/DIEN etc',
      explanation: '3 default types ROH/HALB/FERT, but you can add new types like HAWA, VERP, NLAG via POST. Base UoM also configurable via ent_uom table (CUNI). Code OMS2.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTable();

  try {
    const body = await req.json();
    const { code, name, description } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    const res = await db.execute(sql`
      INSERT INTO ent_material_type (code, name, description)
      VALUES (${code.toUpperCase()}, ${name}, ${description || null})
      ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}, is_active = true
      RETURNING id, code, name
    `);

    return NextResponse.json({ success: true, materialType: res.rows[0], message: `Material Type ${code.toUpperCase()} created/updated – configurable` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTable();

  try {
    const body = await req.json();
    const { id, code, name, description, is_active } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    let res;
    if (id) {
      res = await db.execute(sql`
        UPDATE ent_material_type SET
          code = COALESCE(${code?.toUpperCase()}, code),
          name = COALESCE(${name}, name),
          description = COALESCE(${description}, description),
          is_active = COALESCE(${is_active}, is_active)
        WHERE id = ${id}
        RETURNING id, code, name
      `);
    } else {
      res = await db.execute(sql`
        UPDATE ent_material_type SET
          name = COALESCE(${name}, name),
          description = COALESCE(${description}, description),
          is_active = COALESCE(${is_active}, is_active)
        WHERE code = ${code.toUpperCase()}
        RETURNING id, code, name
      `);
    }

    if (res.rows.length === 0) return NextResponse.json({ error: 'Material type not found' }, { status: 404 });

    return NextResponse.json({ success: true, materialType: res.rows[0], message: `Material Type ${res.rows[0].code} updated` });
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

    // Check if in use
    let inUse = 0;
    try {
      const checkCode = code ? code.toUpperCase() : '';
      if (checkCode) {
        const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM ent_material_master WHERE type = ${checkCode}`);
        inUse = parseInt((r.rows[0] as any).cnt || '0');
      }
    } catch {}

    if (inUse > 0) {
      // Soft delete
      if (id) await db.execute(sql`UPDATE ent_material_type SET is_active = false WHERE id = ${id}`);
      else await db.execute(sql`UPDATE ent_material_type SET is_active = false WHERE code = ${code?.toUpperCase()}`);
      return NextResponse.json({ error: `Cannot delete – material type ${code} has ${inUse} materials and cannot be deleted to maintain audit trail. Deactivated instead.`, code: 'HAS_TRANSACTIONS', softDeleted: true }, { status: 400 });
    }

    if (id) await db.execute(sql`DELETE FROM ent_material_type WHERE id = ${id}`);
    else await db.execute(sql`DELETE FROM ent_material_type WHERE code = ${code?.toUpperCase()}`);

    return NextResponse.json({ success: true, message: `Material Type ${code || id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
