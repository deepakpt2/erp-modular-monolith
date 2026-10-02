import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * OB52 / FPPE - Open and Close Posting Periods (Table T001B / fin_posting_calendar_period)
 * Industry Standard structure:
 * - Variant (T001B-MANDT / variant_code)
 * - Account Type (T001B-KOART: +, A, D, K, M, S, V)
 * - From Account (T001B-VONAK)
 * - To Account (T001B-BISAK)
 * - Normal Period 1: From Period (T001B-FRPE1), From Year (T001B-FRYE1)
 * - Normal Period 1: To Period (T001B-TOPE1), To Year (T001B-TOYE1)
 * - Special Period 2: From Period 2 (T001B-FRPE2), From Year 2 (T001B-FRYE2)
 * - Special Period 2: To Period 2 (T001B-TOPE2), To Year 2 (T001B-TOYE2)
 * - Authorization Group (T001B-BRGRU)
 * - Is Open flag (is_open)
 */

async function ensurePostingPeriodsSchema() {
  try {
    // 1. Ensure fin_posting_calendar table exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_posting_calendar (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID,
        code VARCHAR(20) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_posting_calendar ALTER COLUMN tenant_id DROP NOT NULL`).catch(() => {});
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_fin_posting_calendar_code ON fin_posting_calendar (code)`).catch(() => {});

    // 2. Ensure fin_posting_calendar_period table exists with all standard columns
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_posting_calendar_period (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        posting_calendar_id UUID REFERENCES fin_posting_calendar(id),
        variant_code VARCHAR(20),
        account_type VARCHAR(10) NOT NULL DEFAULT '+',
        from_account VARCHAR(30) DEFAULT '',
        to_account VARCHAR(30) DEFAULT 'ZZZZZZZZZZ',
        from_period INTEGER NOT NULL DEFAULT 1,
        from_year INTEGER NOT NULL DEFAULT 2026,
        to_period INTEGER NOT NULL DEFAULT 12,
        to_year INTEGER NOT NULL DEFAULT 2026,
        from_period2 INTEGER DEFAULT 13,
        from_year2 INTEGER DEFAULT 2026,
        to_period2 INTEGER DEFAULT 16,
        to_year2 INTEGER DEFAULT 2026,
        authorization_group VARCHAR(20),
        is_open BOOLEAN NOT NULL DEFAULT true,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `).catch(() => {});

    // 3. Ensure any missing columns exist on existing table
    await db.execute(sql`ALTER TABLE fin_posting_calendar_period ADD COLUMN IF NOT EXISTS variant_code VARCHAR(20)`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_posting_calendar_period ADD COLUMN IF NOT EXISTS from_account VARCHAR(30) DEFAULT ''`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_posting_calendar_period ADD COLUMN IF NOT EXISTS to_account VARCHAR(30) DEFAULT 'ZZZZZZZZZZ'`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_posting_calendar_period ADD COLUMN IF NOT EXISTS from_period2 INTEGER DEFAULT 13`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_posting_calendar_period ADD COLUMN IF NOT EXISTS from_year2 INTEGER DEFAULT 2026`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_posting_calendar_period ADD COLUMN IF NOT EXISTS to_period2 INTEGER DEFAULT 16`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_posting_calendar_period ADD COLUMN IF NOT EXISTS to_year2 INTEGER DEFAULT 2026`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_posting_calendar_period ADD COLUMN IF NOT EXISTS authorization_group VARCHAR(20)`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_posting_calendar_period ADD COLUMN IF NOT EXISTS description TEXT`).catch(() => {});
    await db.execute(sql`ALTER TABLE fin_posting_calendar_period ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true`).catch(() => {});

    // 4. Ensure seed standard period entries if empty
    const checkCnt = await db.execute(sql`SELECT COUNT(*) as c FROM fin_posting_calendar_period`);
    if (parseInt((checkCnt.rows[0] as any)?.c || '0') === 0) {
      // Find or create default variant
      let calId: string | null = null;
      const calRes = await db.execute(sql`SELECT id FROM fin_posting_calendar WHERE UPPER(code) IN ('1000', 'KS01', 'AM01') LIMIT 1`);
      if (calRes.rows.length > 0) {
        calId = (calRes.rows[0] as any).id;
      }

      const standardTypes = [
        { type: '+', desc: 'Valid for all account types', fromAcc: '', toAcc: 'ZZZZZZZZZZ' },
        { type: 'A', desc: 'Asset accounts', fromAcc: '', toAcc: 'ZZZZZZZZZZ' },
        { type: 'D', desc: 'Customer accounts', fromAcc: '', toAcc: 'ZZZZZZZZZZ' },
        { type: 'K', desc: 'Vendor accounts', fromAcc: '', toAcc: 'ZZZZZZZZZZ' },
        { type: 'M', desc: 'Material accounts', fromAcc: '', toAcc: 'ZZZZZZZZZZ' },
        { type: 'S', desc: 'G/L accounts', fromAcc: '', toAcc: 'ZZZZZZZZZZ' },
        { type: 'V', desc: 'Contract accounts', fromAcc: '', toAcc: 'ZZZZZZZZZZ' },
      ];

      for (const st of standardTypes) {
        await db.execute(sql`
          INSERT INTO fin_posting_calendar_period (
            posting_calendar_id, variant_code, account_type, from_account, to_account,
            from_period, from_year, to_period, to_year,
            from_period2, from_year2, to_period2, to_year2,
            is_open, description
          ) VALUES (
            ${calId}, '1000', ${st.type}, ${st.fromAcc}, ${st.toAcc},
            1, 2026, 12, 2026,
            13, 2026, 16, 2026,
            true, ${st.desc}
          )
        `).catch(() => {});
      }
    }
  } catch (e: any) {
    console.warn('ensurePostingPeriodsSchema error:', e.message);
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensurePostingPeriodsSchema();

  try {
    const { searchParams } = new URL(req.url);
    const variantCode = searchParams.get('variant_code') || searchParams.get('variantCode') || searchParams.get('code');

    let query = sql`
      SELECT 
        p.id,
        COALESCE(p.variant_code, c.code, '1000') as variant_code,
        p.account_type,
        COALESCE(p.from_account, '') as from_account,
        COALESCE(p.to_account, 'ZZZZZZZZZZ') as to_account,
        COALESCE(p.from_period, 1) as from_period,
        COALESCE(p.from_year, 2026) as from_year,
        COALESCE(p.to_period, 12) as to_period,
        COALESCE(p.to_year, 2026) as to_year,
        COALESCE(p.from_period2, 13) as from_period2,
        COALESCE(p.from_year2, 2026) as from_year2,
        COALESCE(p.to_period2, 16) as to_period2,
        COALESCE(p.to_year2, 2026) as to_year2,
        p.authorization_group,
        COALESCE(p.is_open, true) as is_open,
        p.description,
        p.created_at,
        p.updated_at
      FROM fin_posting_calendar_period p
      LEFT JOIN fin_posting_calendar c ON p.posting_calendar_id = c.id
    `;

    if (variantCode && variantCode !== 'ALL') {
      const vUpper = variantCode.toUpperCase().trim();
      query = sql`${query} WHERE UPPER(COALESCE(p.variant_code, c.code, '')) = ${vUpper}`;
    }

    query = sql`${query} ORDER BY COALESCE(p.variant_code, c.code, ''), p.account_type, p.from_period`;

    const res = await db.execute(query);
    const periods = res.rows.map((r: any) => ({
      ...r,
      code: `${r.variant_code}-${r.account_type}-${r.from_period}-${r.from_year}`,
      name: `${r.variant_code} [${r.account_type}] ${r.from_period}/${r.from_year} - ${r.to_period}/${r.to_year}`
    }));

    return NextResponse.json({
      data: periods,
      postingPeriods: periods,
      count: periods.length,
      code: 'FPPE',
      aliasCodes: ['OB52', 'PPE'],
      helperCode: 'FPPE',
      title: 'Posting Period Control – Open / Close Periods'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], postingPeriods: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensurePostingPeriodsSchema();

  try {
    const body = await req.json();
    const {
      variant_code,
      account_type = '+',
      from_account = '',
      to_account = 'ZZZZZZZZZZ',
      from_period = 1,
      from_year = 2026,
      to_period = 12,
      to_year = 2026,
      from_period2 = 13,
      from_year2 = 2026,
      to_period2 = 16,
      to_year2 = 2026,
      authorization_group,
      is_open = true,
      description
    } = body;

    if (!variant_code) {
      return NextResponse.json({ error: 'POSTING_PERIOD_VARIANT_CODE (variant_code) is required' }, { status: 400 });
    }

    const vCode = variant_code.toUpperCase().trim();
    // Support either single letter '+' or verbose '+ (Valid for all account types)'
    let acctType = account_type.toString().trim() || '+';
    if (acctType.includes(' ')) {
      acctType = acctType.split(' ')[0].trim();
    }
    const isOpenVal = is_open === true || is_open === 'true';

    // Find or create parent variant
    let calId: string | null = null;
    const calCheck = await db.execute(sql`SELECT id FROM fin_posting_calendar WHERE UPPER(code) = ${vCode} LIMIT 1`);
    if (calCheck.rows.length > 0) {
      calId = (calCheck.rows[0] as any).id;
    } else {
      const insCal = await db.execute(sql`
        INSERT INTO fin_posting_calendar (code, name, description)
        VALUES (${vCode}, ${vCode}, 'Auto-created via Posting Period Control')
        RETURNING id
      `).catch(async () => {
        return await db.execute(sql`SELECT id FROM fin_posting_calendar WHERE UPPER(code) = ${vCode} LIMIT 1`);
      });
      if (insCal.rows.length > 0) calId = (insCal.rows[0] as any).id;
    }

    // Check if matching row exists by variant, account_type, and period window
    const existCheck = await db.execute(sql`
      SELECT id FROM fin_posting_calendar_period
      WHERE (UPPER(variant_code) = ${vCode} OR posting_calendar_id = ${calId})
        AND UPPER(account_type) = ${acctType.toUpperCase()}
        AND from_period = ${parseInt(from_period)}
        AND from_year = ${parseInt(from_year)}
      LIMIT 1
    `);

    let resultRow: any;
    if (existCheck.rows.length > 0) {
      const existingId = (existCheck.rows[0] as any).id;
      const upd = await db.execute(sql`
        UPDATE fin_posting_calendar_period SET
          variant_code = ${vCode},
          posting_calendar_id = ${calId},
          account_type = ${acctType},
          from_account = ${from_account || ''},
          to_account = ${to_account || 'ZZZZZZZZZZ'},
          to_period = ${parseInt(to_period)},
          to_year = ${parseInt(to_year)},
          from_period2 = ${parseInt(from_period2 || 13)},
          from_year2 = ${parseInt(from_year2 || from_year)},
          to_period2 = ${parseInt(to_period2 || 16)},
          to_year2 = ${parseInt(to_year2 || to_year)},
          authorization_group = ${authorization_group || null},
          is_open = ${isOpenVal},
          description = ${description || null},
          updated_at = NOW()
        WHERE id = ${existingId}
        RETURNING *
      `);
      resultRow = upd.rows[0];
    } else {
      const ins = await db.execute(sql`
        INSERT INTO fin_posting_calendar_period (
          posting_calendar_id, variant_code, account_type, from_account, to_account,
          from_period, from_year, to_period, to_year,
          from_period2, from_year2, to_period2, to_year2,
          authorization_group, is_open, description
        ) VALUES (
          ${calId}, ${vCode}, ${acctType}, ${from_account || ''}, ${to_account || 'ZZZZZZZZZZ'},
          ${parseInt(from_period)}, ${parseInt(from_year)}, ${parseInt(to_period)}, ${parseInt(to_year)},
          ${parseInt(from_period2 || 13)}, ${parseInt(from_year2 || from_year)}, ${parseInt(to_period2 || 16)}, ${parseInt(to_year2 || to_year)},
          ${authorization_group || null}, ${isOpenVal}, ${description || null}
        )
        RETURNING *
      `);
      resultRow = ins.rows[0];
    }

    const item = {
      ...resultRow,
      code: `${vCode}-${acctType}-${from_period}-${from_year}`,
      name: `${vCode} [${acctType}] ${from_period}/${from_year} - ${to_period}/${to_year}`
    };

    return NextResponse.json({
      success: true,
      message: `Posting period control for ${vCode} (${acctType}) ${isOpenVal ? 'OPEN' : 'CLOSED'} saved successfully.`,
      period: item,
      data: item
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const code = searchParams.get('code');

    if (id) {
      await db.execute(sql`DELETE FROM fin_posting_calendar_period WHERE id = ${id}`);
    } else if (code) {
      // Code format: VARIANT-ACCOUNTTYPE-FROMPERIOD-FROMYEAR
      const parts = code.split('-');
      if (parts.length >= 4) {
        const [vCode, aType, fPer, fYr] = parts;
        await db.execute(sql`
          DELETE FROM fin_posting_calendar_period
          WHERE (UPPER(variant_code) = ${vCode.toUpperCase()} OR posting_calendar_id IN (SELECT id FROM fin_posting_calendar WHERE UPPER(code) = ${vCode.toUpperCase()}))
            AND UPPER(account_type) = ${aType.toUpperCase()}
            AND from_period = ${parseInt(fPer)}
            AND from_year = ${parseInt(fYr)}
        `);
      } else {
        await db.execute(sql`DELETE FROM fin_posting_calendar_period WHERE id = ${code}`);
      }
    }

    return NextResponse.json({ success: true, message: 'Posting period control rule deleted successfully.' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
