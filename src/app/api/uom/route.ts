import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * UoM API – Base Unit of Measure configurable
 * Storage: ent_uom table
 * You can add new UoM like KG, G, L, ML, PC, BOX, PACK, KIT, M, etc
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const res = await db.execute(sql`SELECT id, code, name, dimension, is_active, created_at FROM ent_uom ORDER BY code`);
    return NextResponse.json({
      uoms: res.rows,
      count: res.rows.length,
      configurable: true, helperCode: 'CUNI',
      functionDescription: 'Units of Measurement – ERP CUNI – Configurable base UoM',
      examples: 'KG Kilogram WEIGHT, G Gram WEIGHT, L Liter VOLUME, PC Piece QUANTITY, BOX Box QUANTITY, M Meter LENGTH',
      explanation: 'Base UoM configurable – add new UoM via POST, e.g., M for Meter, TON for Ton – Code CUNI',
    });
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

    const res = await db.execute(sql`
      INSERT INTO ent_uom (code, name, dimension)
      VALUES (${code.toUpperCase()}, ${name}, ${dimension || 'QUANTITY'})
      ON CONFLICT (code) DO UPDATE SET name = ${name}, dimension = ${dimension || 'QUANTITY'}, is_active = true
      RETURNING id, code, name
    `);

    return NextResponse.json({ success: true, uom: res.rows[0], message: `UoM ${code.toUpperCase()} created/updated` });
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
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

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
        const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM ent_material_master WHERE base_uom = ${checkCode}`);
        inUse = parseInt((r.rows[0] as any).cnt || '0');
      }
    } catch {}

    if (inUse > 0) {
      if (id) await db.execute(sql`UPDATE ent_uom SET is_active = false WHERE id = ${id}`);
      else await db.execute(sql`UPDATE ent_uom SET is_active = false WHERE code = ${code?.toUpperCase()}`);
      return NextResponse.json({ error: `Cannot delete – UoM ${code} has ${inUse} materials and cannot be deleted to maintain audit trail. Deactivated instead.`, code: 'HAS_TRANSACTIONS', softDeleted: true, message: `UoM ${code} deactivated – has materials` }, { status: 400 });
    }

    if (id) await db.execute(sql`DELETE FROM ent_uom WHERE id = ${id}`);
    else await db.execute(sql`DELETE FROM ent_uom WHERE code = ${code?.toUpperCase()}`);

    return NextResponse.json({ success: true, message: `UoM ${code || id} deleted` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
