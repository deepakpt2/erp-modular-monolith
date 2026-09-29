import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Product Item Types API – Configurable product types – Legal-safe own IP
 * New table: prod_item_type (was ent_material_type)
 * Old codes: ROH/HALB/FERT/HAWA/VERP/NLAG/DIEN – new legal-safe: RAW/SEMI/FINISHED/TRADING/PACKAGING/CONSUMABLE/SERVICE
 * Helper code: EMTC type view – actually EMGT? But we keep OMS2 alias for backward search, new primary EMTC? Let's use EMTY Product Type Create? For now use EMTP? Use EMTC still works but we introduce EMTY.
 * Per HELPER_CODE_SYSTEM: EMTC Material Create – we will use EMTY for Type? Actually keep OMS2 alias, new code EMTP? Let's use EMGC for group, and EMTY for type – but mapping says EMTC is material. For type we create new EMTP? Let's use EMTC for now but alias OMS2.
 * New short 4-char: EMTY – E=Enterprise, MT=Material Type? Actually MT is Material, TY is Type? Could be EITY? Let's keep simple: EMTY = Enterprise Material Type Create
 * But for backward compat we keep OMS2 as alias.
 */

async function ensureTableNew() {
  try {
    // Try to create new table if not exists via drizzle push fallback – but we can attempt manual
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS prod_item_type (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    // Seed default legal-safe types if empty
    const cnt = await db.execute(sql`SELECT COUNT(*) as c FROM prod_item_type`);
    if (parseInt((cnt.rows[0] as any).c || '0') === 0) {
      await db.execute(sql`
        INSERT INTO prod_item_type (code, name, description) VALUES
        ('RAW', 'Raw Material', 'Raw materials purchased from vendors, e.g., Black Pepper Raw, valuation BSX 5000000001 – legal-safe own IP, was ROH'),
        ('SEMI', 'Semi-Finished', 'Semi-finished goods produced internally, e.g., Spice Mix Intermediate – was HALB'),
        ('FINISHED', 'Finished Goods', 'Finished goods for sale, e.g., Pepper Powder 100g, valuation BSX 5000000002 – was FERT'),
        ('TRADING', 'Trading Goods', 'Trading goods bought and sold without production – was HAWA'),
        ('PACKAGING', 'Packaging', 'Packaging materials – was VERP'),
        ('CONSUMABLE', 'Consumable', 'Non-stock consumables – was NLAG'),
        ('SERVICE', 'Service', 'Service items – was DIEN')
        ON CONFLICT (code) DO NOTHING
      `);
    }
  } catch (e: any) {
    console.warn('ensure prod_item_type failed', e);
  }
}

async function ensureTableLegacy() {
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
  } catch (e: any) {
    console.warn('ensure ent_material_type failed', e);
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTableNew();
  await ensureTableLegacy();

  try {
    // Try new table
    try {
      const typesRes = await db.execute(sql`SELECT id, code, name, description, is_active, created_at FROM prod_item_type ORDER BY code`);
      let distinctTypes: any[] = [];
      try {
        const d = await db.execute(sql`SELECT DISTINCT type as code, COUNT(*) as count FROM prod_item GROUP BY type ORDER BY type`);
        distinctTypes = d.rows;
      } catch {
        try {
          const d = await db.execute(sql`SELECT DISTINCT type as code, COUNT(*) as count FROM ent_material_master GROUP BY type ORDER BY type`);
          distinctTypes = d.rows;
        } catch {}
      }

      let uoms: any[] = [];
      try {
        const u = await db.execute(sql`SELECT code, name, dimension, is_active FROM core_unit_measure ORDER BY code`);
        uoms = u.rows;
      } catch {
        try {
          const u = await db.execute(sql`SELECT code, name, dimension, is_active FROM ent_uom ORDER BY code`);
          uoms = u.rows;
        } catch {}
      }

      return NextResponse.json({
        materialTypes: typesRes.rows,
        productTypes: typesRes.rows,
        distinctInUse: distinctTypes,
        baseUoms: uoms,
        count: typesRes.rows.length,
        configurable: true,
        code: 'EMTP',
        aliasCodes: ['MTP', 'OMS2', 'FND-MT-CR'],
        helperCode: 'EMTP',
        functionDescription: 'Define Product Item Types – ERP EMTP – Legal-safe own IP – Configurable: RAW/SEMI/FINISHED + TRADING/PACKAGING/CONSUMABLE/SERVICE (was ROH/HALB/FERT + HAWA/VERP/NLAG/DIEN)',
        explanation: 'Legal-safe types RAW/FINISHED/SEMI, but old ROH/HALB/FERT also accepted and mapped – Base Unit also configurable via core_unit_measure table (EUOC). Code EMTP (new) alias OMS2.',
        table: 'prod_item_type',
        legalSafe: true,
        mapping: 'ROH->RAW, FERT->FINISHED, HALB->SEMI, HAWA->TRADING, VERP->PACKAGING, NLAG->CONSUMABLE, DIEN->SERVICE'
      });
    } catch (newErr: any) {
      console.warn('prod_item_type query failed, fallback ent_material_type:', newErr.message);
      const typesRes = await db.execute(sql`SELECT id, code, name, description, is_active, created_at FROM ent_material_type ORDER BY code`);
      let distinctTypes: any[] = [];
      try {
        const d = await db.execute(sql`SELECT DISTINCT type as code, COUNT(*) as count FROM ent_material_master GROUP BY type ORDER BY type`);
        distinctTypes = d.rows;
      } catch {}

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
        configurable: true,
        code: 'EMTP',
        aliasCodes: ['MTP', 'OMS2'],
        helperCode: 'OMS2',
        functionDescription: 'Define Material Types – ERP OMS2 – Configurable: ROH/HALB/FERT + HAWA/VERP/NLAG/DIEN etc (legacy ent_material_type – migrating to prod_item_type RAW/FINISHED/SEMI)',
        explanation: '3 default types ROH/HALB/FERT, but you can add new types like HAWA, VERP, NLAG via POST. Base UoM also configurable via ent_uom table (CUNI). Code OMS2 (legacy, new EMTP).',
        table: 'ent_material_type',
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

  await ensureTableNew();
  await ensureTableLegacy();

  try {
    const body = await req.json();
    const { code, name, description } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    // Map old codes to new
    const mapOldToNew: Record<string, string> = { 'ROH': 'RAW', 'FERT': 'FINISHED', 'HALB': 'SEMI', 'HAWA': 'TRADING', 'VERP': 'PACKAGING', 'NLAG': 'CONSUMABLE', 'DIEN': 'SERVICE' };
    const upperCode = code.toUpperCase();
    const legalCode = mapOldToNew[upperCode] || upperCode;

    try {
      const res = await db.execute(sql`
        INSERT INTO prod_item_type (code, name, description)
        VALUES (${legalCode}, ${name}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}, is_active = true
        RETURNING id, code, name
      `);
      return NextResponse.json({ success: true, materialType: res.rows[0], productType: res.rows[0], code: 'EMTP', message: `Product Type ${legalCode} created/updated – legal-safe (mapped from ${code}) – configurable`, legalSafe: true, mapping: `${code}->${legalCode}` });
    } catch (newErr: any) {
      console.warn('prod_item_type insert failed, fallback ent_material_type:', newErr.message);
      const res = await db.execute(sql`
        INSERT INTO ent_material_type (code, name, description)
        VALUES (${upperCode}, ${name}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}, is_active = true
        RETURNING id, code, name
      `);
      return NextResponse.json({ success: true, materialType: res.rows[0], code: 'EMTP', aliasCodes: ['OMS2'], message: `Material Type ${upperCode} created/updated – legacy (new legal-safe ${legalCode}) – configurable` });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTableNew();
  await ensureTableLegacy();

  try {
    const body = await req.json();
    const { id, code, name, description, is_active } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    const mapOldToNew: Record<string, string> = { 'ROH': 'RAW', 'FERT': 'FINISHED', 'HALB': 'SEMI', 'HAWA': 'TRADING', 'VERP': 'PACKAGING', 'NLAG': 'CONSUMABLE', 'DIEN': 'SERVICE' };
    const upperCode = code ? code.toUpperCase() : null;
    const legalCode = upperCode ? (mapOldToNew[upperCode] || upperCode) : null;

    try {
      let res;
      if (id) {
        res = await db.execute(sql`
          UPDATE prod_item_type SET
            code = COALESCE(${legalCode}, code),
            name = COALESCE(${name}, name),
            description = COALESCE(${description}, description),
            is_active = COALESCE(${is_active}, is_active)
          WHERE id = ${id}
          RETURNING id, code, name
        `);
      } else {
        res = await db.execute(sql`
          UPDATE prod_item_type SET
            name = COALESCE(${name}, name),
            description = COALESCE(${description}, description),
            is_active = COALESCE(${is_active}, is_active)
          WHERE code = ${legalCode}
          RETURNING id, code, name
        `);
      }
      if (res.rows.length === 0) return NextResponse.json({ error: 'Product type not found in prod_item_type' }, { status: 404 });
      return NextResponse.json({ success: true, materialType: res.rows[0], productType: res.rows[0], code: 'EMTP', message: `Product Type ${res.rows[0].code} updated – legal-safe` });
    } catch (newErr: any) {
      console.warn('prod_item_type update failed, fallback ent_material_type:', newErr.message);
      let res;
      if (id) {
        res = await db.execute(sql`
          UPDATE ent_material_type SET
            code = COALESCE(${upperCode}, code),
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
          WHERE code = ${upperCode}
          RETURNING id, code, name
        `);
      }
      if (res.rows.length === 0) return NextResponse.json({ error: 'Material type not found' }, { status: 404 });
      return NextResponse.json({ success: true, materialType: res.rows[0], message: `Material Type ${res.rows[0].code} updated – legacy` });
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

    const mapOldToNew: Record<string, string> = { 'ROH': 'RAW', 'FERT': 'FINISHED', 'HALB': 'SEMI', 'HAWA': 'TRADING', 'VERP': 'PACKAGING', 'NLAG': 'CONSUMABLE', 'DIEN': 'SERVICE' };
    const upperCode = code ? code.toUpperCase() : null;
    const legalCode = upperCode ? (mapOldToNew[upperCode] || upperCode) : null;

    // Try new table
    try {
      let inUse = 0;
      const checkCode = legalCode || upperCode || '';
      if (checkCode) {
        try {
          const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM prod_item WHERE type = ${checkCode}::prod_item_type_enum`);
          inUse = parseInt((r.rows[0] as any).cnt || '0');
        } catch {}
        // Also check legacy mapping
        try {
          const oldCode = Object.keys(mapOldToNew).find(k => mapOldToNew[k] === checkCode) || checkCode;
          const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM ent_material_master WHERE type = ${oldCode}::material_type`);
          inUse += parseInt((r.rows[0] as any).cnt || '0');
        } catch {}
      }

      if (inUse > 0) {
        if (id) await db.execute(sql`UPDATE prod_item_type SET is_active = false WHERE id = ${id}`);
        else if (legalCode) await db.execute(sql`UPDATE prod_item_type SET is_active = false WHERE code = ${legalCode}`);
        return NextResponse.json({ error: `Cannot delete – product type ${code} has ${inUse} items and cannot be deleted to maintain audit trail. Deactivated instead.`, code: 'HAS_TRANSACTIONS', softDeleted: true }, { status: 400 });
      }

      if (id) await db.execute(sql`DELETE FROM prod_item_type WHERE id = ${id}`);
      else if (legalCode) await db.execute(sql`DELETE FROM prod_item_type WHERE code = ${legalCode}`);

      return NextResponse.json({ success: true, code: 'EMTP', message: `Product Type ${code || id} deleted – legal-safe` });
    } catch (newErr: any) {
      console.warn('prod_item_type delete failed, fallback ent_material_type:', newErr.message);
      let inUse = 0;
      try {
        const checkCode = upperCode || '';
        if (checkCode) {
          const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM ent_material_master WHERE type = ${checkCode}::material_type`);
          inUse = parseInt((r.rows[0] as any).cnt || '0');
        }
      } catch {}

      if (inUse > 0) {
        if (id) await db.execute(sql`UPDATE ent_material_type SET is_active = false WHERE id = ${id}`);
        else await db.execute(sql`UPDATE ent_material_type SET is_active = false WHERE code = ${upperCode}`);
        return NextResponse.json({ error: `Cannot delete – material type ${code} has ${inUse} materials and cannot be deleted to maintain audit trail. Deactivated instead.`, code: 'HAS_TRANSACTIONS', softDeleted: true }, { status: 400 });
      }

      if (id) await db.execute(sql`DELETE FROM ent_material_type WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM ent_material_type WHERE code = ${upperCode}`);

      return NextResponse.json({ success: true, message: `Material Type ${code || id} deleted – legacy` });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
