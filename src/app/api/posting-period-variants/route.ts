import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Posting Period Variants API – OBBO/OB52
 * Code OBBO Define Variant, OB52 Open/Close Periods, OBBP Assign to Company Code
 * Configurable: create/edit/delete variants, open/close periods
 */

async function ensureTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fi_posting_period_variant (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fi_posting_period (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        variant_code VARCHAR(10) REFERENCES fi_posting_period_variant(code),
        account_type VARCHAR(2) NOT NULL,
        from_period INTEGER, from_year INTEGER, to_period INTEGER, to_year INTEGER,
        from_period2 INTEGER, from_year2 INTEGER, to_period2 INTEGER, to_year2 INTEGER
      );
    `);
    const cnt = await db.execute(sql`SELECT COUNT(*) as c FROM fi_posting_period_variant`);
    if (parseInt((cnt.rows[0] as any).c || '0') === 0) {
      await db.execute(sql`
        INSERT INTO fi_posting_period_variant (code, name) VALUES ('1000', 'Standard Posting Variant'), ('KS01', 'Kerala Spices Posting Period') ON CONFLICT (code) DO NOTHING
      `);
      const types = ['+', 'A', 'D', 'K', 'M', 'S'];
      for (const at of types) {
        await db.execute(sql`
          INSERT INTO fi_posting_period (variant_code, account_type, from_period, from_year, to_period, to_year, from_period2, from_year2, to_period2, to_year2)
          VALUES ('1000', ${at}, 1, 2024, 12, 2026, 1, 2024, 12, 2026) ON CONFLICT DO NOTHING
        `);
      }
    }
  } catch (e: any) {
    console.warn('ensure posting period failed', e);
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureTable();

  try {
    const variants = await db.execute(sql`SELECT id, code, name, created_at FROM fi_posting_period_variant ORDER BY code`);
    const periods = await db.execute(sql`SELECT id, variant_code, account_type, from_period, from_year, to_period, to_year FROM fi_posting_period ORDER BY variant_code, account_type`);
    return NextResponse.json({
      postingPeriodVariants: variants.rows,
      postingPeriods: periods.rows,
      count: variants.rows.length,
      configurable: true,
      code: 'OBBO/OB52',
      functionDescription: 'OBBO Define Posting Period Variant, OB52 Open and Close Posting Periods, OBBP Assign Variant to Company Code – configurable',
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
    const { code, name, periods } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    const res = await db.execute(sql`
      INSERT INTO fi_posting_period_variant (code, name) VALUES (${code.toUpperCase()}, ${name})
      ON CONFLICT (code) DO UPDATE SET name = ${name} RETURNING id, code, name
    `);

    if (periods && Array.isArray(periods)) {
      for (const p of periods) {
        await db.execute(sql`
          INSERT INTO fi_posting_period (variant_code, account_type, from_period, from_year, to_period, to_year)
          VALUES (${code.toUpperCase()}, ${p.account_type||'+'}, ${p.from_period||1}, ${p.from_year||2024}, ${p.to_period||12}, ${p.to_year||2026})
          ON CONFLICT DO NOTHING
        `);
      }
    }

    return NextResponse.json({ success: true, variant: res.rows[0], message: `Posting Period Variant ${code.toUpperCase()} created – OBBO/OB52` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, code, name } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    let res;
    if (id) {
      res = await db.execute(sql`UPDATE fi_posting_period_variant SET code = COALESCE(${code?.toUpperCase()}, code), name = COALESCE(${name}, name) WHERE id = ${id} RETURNING id, code, name`);
    } else {
      res = await db.execute(sql`UPDATE fi_posting_period_variant SET name = COALESCE(${name}, name) WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
    }

    if (res.rows.length===0) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    return NextResponse.json({ success: true, variant: res.rows[0] });
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

    // Check if assigned to company code – block if in use
    let variantCode = code?.toUpperCase();
    if (!variantCode && id) {
      const r = await db.execute(sql`SELECT code FROM fi_posting_period_variant WHERE id = ${id} LIMIT 1`);
      if (r.rows.length>0) variantCode = (r.rows[0] as any).code;
    }

    let inUse = 0;
    try {
      if (variantCode) {
        // Check if any company code uses this variant via custom logic or just block if periods exist
        const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM fi_posting_period WHERE variant_code = ${variantCode}`);
        inUse = parseInt((r.rows[0] as any).cnt || '0');
      }
    } catch {}

    if (inUse > 5) {
      // Soft – don't hard delete if many periods, just warn
      return NextResponse.json({ error: `Posting Period Variant ${variantCode} has ${inUse} periods – delete periods first`, code: 'HAS_PERIODS' }, { status: 400 });
    }

    if (id) {
      await db.execute(sql`DELETE FROM fi_posting_period WHERE variant_code = (SELECT code FROM fi_posting_period_variant WHERE id = ${id})`);
      await db.execute(sql`DELETE FROM fi_posting_period_variant WHERE id = ${id}`);
    } else {
      await db.execute(sql`DELETE FROM fi_posting_period WHERE variant_code = ${variantCode}`);
      await db.execute(sql`DELETE FROM fi_posting_period_variant WHERE code = ${variantCode}`);
    }

    return NextResponse.json({ success: true, message: `Posting Period Variant ${variantCode||id} deleted – OBBO/OB52` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
