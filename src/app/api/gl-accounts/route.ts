import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { validateGLAccountDeletion } from '@/shared/kernel/safety/deletionPrecheck';

/**
 * G/L Accounts API (FGLC / FS00) – Pure Industry Standard Architecture
 * Clean, modern implementation with zero legacy fallbacks or obsolete workarounds.
 * Table: fin_ledger_account (chart_id, account_group_code, account_number, name, account_category, account_type, is_balance_sheet, is_reconciliation, is_blocked, is_tax_relevant, description)
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const coaCode = searchParams.get('coaCode') || searchParams.get('companyCode') || 'ALL';
  const search = searchParams.get('search') || '';

  try {
    // 1. Fetch G/L accounts directly from fin_ledger_account
    let query = sql`
      SELECT 
        gl.id,
        gl.account_number,
        gl.name,
        gl.account_group_code,
        gl.account_category,
        gl.account_type,
        gl.is_balance_sheet,
        gl.is_reconciliation,
        gl.is_tax_relevant,
        gl.is_blocked,
        gl.description,
        coa.code as coa_code,
        coa.name as coa_name,
        (SELECT COUNT(*) FROM fin_auto_posting_rule WHERE ledger_account_id = gl.id) as auto_det_count
      FROM fin_ledger_account gl
      JOIN fin_chart coa ON gl.chart_id = coa.id
      WHERE 1=1
    `;

    if (coaCode && coaCode !== 'ALL') {
      query = sql`${query} AND (
        coa.code = ${coaCode} 
        OR EXISTS (SELECT 1 FROM org_legal_entity cc WHERE cc.chart_id = coa.id AND cc.code = ${coaCode})
      )`;
    }
    if (search) {
      query = sql`${query} AND (gl.account_number ILIKE ${`%${search}%`} OR gl.name ILIKE ${`%${search}%`})`;
    }
    query = sql`${query} ORDER BY gl.account_number LIMIT 500`;

    const result = await db.execute(query);
    let glRows = result.rows as any[];

    // Auto-seed baseline on demand if empty system
    if (glRows.length === 0 && (!search || search.trim() === '')) {
      const totalGlCheck = await db.execute(sql`SELECT COUNT(*) as c FROM fin_ledger_account`);
      const totalCount = Number((totalGlCheck.rows[0] as any)?.c || 0);
      if (totalCount === 0) {
        const { seedIndustryStandardBaseline } = await import('@/shared/kernel/db/standardSystemDefaults');
        await seedIndustryStandardBaseline();
        const refetched = await db.execute(query);
        glRows = refetched.rows as any[];
      }
    }

    // 2. Fetch Chart of Accounts and Account Groups for validation & reference
    const coasRes = await db.execute(sql`SELECT id, code, name, description FROM fin_chart ORDER BY code`);
    const agRes = await db.execute(sql`SELECT chart_id, code, name, from_account, to_account, account_type, account_category FROM fin_account_group ORDER BY code`).catch(() => ({ rows: [] }));

    return NextResponse.json({
      glAccounts: glRows,
      count: glRows.length,
      charts: coasRes.rows,
      accountGroups: agRes.rows,
      code: 'FGLC',
      aliasCodes: ['GLC', 'FS00', 'FIN-GL-CR'],
      helperCode: 'FGLC',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, glAccounts: [], count: 0 }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    // Ensure updated_at and required audit columns exist
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT NOW()`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT NOW()`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS account_group_code varchar(50)`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS account_category varchar(50)`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS description text`).catch(()=>{});
    const body = await req.json();
    let {
      coa_code,
      chart_code,
      account_number,
      name,
      account_group_code,
      account_category,
      account_type,
      is_balance_sheet,
      is_reconciliation,
      is_tax_relevant,
      is_blocked,
      description
    } = body;

    const finalCoaCode = chart_code || coa_code;
    if (!finalCoaCode || !account_number || !name || !account_group_code) {
      return NextResponse.json({ error: 'Chart of Accounts, Account Group Code, Account Number, and Account Name are required' }, { status: 400 });
    }

    const trimmedAccountGroup = account_group_code.toString().trim().toUpperCase();

    // Industry Standard Parity: Inherit account_type and account_category from Account Group if unspecified
    if (!account_type || account_type === 'INHERIT_FROM_GROUP' || !account_category || account_category === 'INHERIT_FROM_GROUP') {
      const agRes = await db.execute(sql`SELECT account_type, account_category FROM fin_account_group WHERE code = ${trimmedAccountGroup} LIMIT 1`);
      if (agRes.rows.length > 0) {
        const ag = agRes.rows[0] as any;
        if (!account_category || account_category === 'INHERIT_FROM_GROUP') {
          account_category = ag.account_category || 'BALANCE_SHEET';
        }
        if (!account_type || account_type === 'INHERIT_FROM_GROUP') {
          account_type = ag.account_type || 'ASSET';
        }
      } else {
        if (!account_category || account_category === 'INHERIT_FROM_GROUP') account_category = 'BALANCE_SHEET';
        if (!account_type || account_type === 'INHERIT_FROM_GROUP') account_type = 'ASSET';
      }
    }

    // Resolve Chart ID
    const chartRes = await db.execute(sql`SELECT id FROM fin_chart WHERE code = ${finalCoaCode.toUpperCase()} LIMIT 1`);
    if (chartRes.rows.length === 0) {
      return NextResponse.json({ error: `Chart of Accounts ${finalCoaCode} not found` }, { status: 404 });
    }
    const chartId = (chartRes.rows[0] as any).id;

    // Direct, pure upsert into fin_ledger_account
    const res = await db.execute(sql`
      INSERT INTO fin_ledger_account (
        chart_id,
        account_group_code,
        account_number,
        name,
        account_category,
        account_type,
        is_balance_sheet,
        is_reconciliation,
        is_tax_relevant,
        is_blocked,
        description,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        ${chartId},
        ${trimmedAccountGroup},
        ${account_number.toString().trim()},
        ${name.toString().trim()},
        ${account_category},
        ${account_type},
        ${is_balance_sheet === true || is_balance_sheet === 'true'},
        ${is_reconciliation === true || is_reconciliation === 'true'},
        ${is_tax_relevant === true || is_tax_relevant === 'true'},
        ${is_blocked === true || is_blocked === 'true'},
        ${description || null},
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (chart_id, account_number) DO UPDATE SET
        account_group_code = ${trimmedAccountGroup},
        name = ${name.toString().trim()},
        account_category = ${account_category},
        account_type = ${account_type},
        is_balance_sheet = ${is_balance_sheet === true || is_balance_sheet === 'true'},
        is_reconciliation = ${is_reconciliation === true || is_reconciliation === 'true'},
        is_tax_relevant = ${is_tax_relevant === true || is_tax_relevant === 'true'},
        is_blocked = ${is_blocked === true || is_blocked === 'true'},
        description = ${description || null},
        updated_at = NOW()
      RETURNING id, chart_id, account_group_code, account_number, name, account_category, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant, is_blocked, description
    `);

    return NextResponse.json({
      success: true,
      glAccount: res.rows[0],
      code: 'FGLC',
      message: `G/L Account ${account_number} created successfully`,
    });
  } catch (e: any) {
    console.error('API /api/gl-accounts POST error:', e);
    return NextResponse.json({ 
      error: e.message || 'Database error while creating G/L account',
      detail: e.detail || e.hint || e.message,
      query: e.query || null
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    // Ensure updated_at and required audit columns exist
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT NOW()`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT NOW()`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS account_group_code varchar(50)`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS account_category varchar(50)`).catch(()=>{});
    await db.execute(sql`ALTER TABLE fin_ledger_account ADD COLUMN IF NOT EXISTS description text`).catch(()=>{});
    const body = await req.json();
    let {
      id,
      account_number,
      name,
      account_group_code,
      account_category,
      account_type,
      is_balance_sheet,
      is_reconciliation,
      is_tax_relevant,
      is_blocked,
      description
    } = body;

    if (!id && !account_number) {
      return NextResponse.json({ error: 'id or account_number required' }, { status: 400 });
    }

    const trimmedAccountGroup = (account_group_code && typeof account_group_code === 'string' && account_group_code.trim()) 
      ? account_group_code.trim().toUpperCase() 
      : null;

    // Inherit from Account Group if set to INHERIT_FROM_GROUP or unspecified
    if (trimmedAccountGroup && (!account_type || account_type === 'INHERIT_FROM_GROUP' || !account_category || account_category === 'INHERIT_FROM_GROUP')) {
      try {
        const agRes = await db.execute(sql`SELECT account_type, account_category FROM fin_account_group WHERE code = ${trimmedAccountGroup} LIMIT 1`);
        if (agRes.rows.length > 0) {
          const ag = agRes.rows[0] as any;
          if (!account_category || account_category === 'INHERIT_FROM_GROUP') account_category = ag.account_category;
          if (!account_type || account_type === 'INHERIT_FROM_GROUP') account_type = ag.account_type;
        }
      } catch {}
    }

    const validAccountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
    const finalAccountType = (account_type && validAccountTypes.includes(account_type.toString().toUpperCase())) 
      ? account_type.toString().toUpperCase() 
      : null;

    const finalAccountCategory = (account_category && account_category !== 'INHERIT_FROM_GROUP' && account_category.toString().trim()) 
      ? account_category.toString().trim() 
      : null;

    const nameVal = (name !== undefined && name !== null && name.toString().trim()) ? name.toString().trim() : null;
    const descVal = (description !== undefined && description !== null && description.toString().trim()) ? description.toString().trim() : null;

    const bsVal = is_balance_sheet !== undefined ? (is_balance_sheet === true || is_balance_sheet === 'true') : null;
    const recVal = is_reconciliation !== undefined ? (is_reconciliation === true || is_reconciliation === 'true') : null;
    const taxVal = is_tax_relevant !== undefined ? (is_tax_relevant === true || is_tax_relevant === 'true') : null;
    const blkVal = is_blocked !== undefined ? (is_blocked === true || is_blocked === 'true') : null;

    // Direct UPDATE query with COALESCE to ensure clean parameter passing
    let res;
    if (id) {
      res = await db.execute(sql`
        UPDATE fin_ledger_account SET
          name = COALESCE(${nameVal}, name),
          account_group_code = COALESCE(${trimmedAccountGroup}, account_group_code),
          account_category = COALESCE(${finalAccountCategory}, account_category),
          account_type = COALESCE(${finalAccountType}, account_type),
          is_balance_sheet = COALESCE(${bsVal}, is_balance_sheet),
          is_reconciliation = COALESCE(${recVal}, is_reconciliation),
          is_tax_relevant = COALESCE(${taxVal}, is_tax_relevant),
          is_blocked = COALESCE(${blkVal}, is_blocked),
          description = COALESCE(${descVal}, description),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, chart_id, account_group_code, account_number, name, account_category, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant, is_blocked, description
      `);
    } else {
      res = await db.execute(sql`
        UPDATE fin_ledger_account SET
          name = COALESCE(${nameVal}, name),
          account_group_code = COALESCE(${trimmedAccountGroup}, account_group_code),
          account_category = COALESCE(${finalAccountCategory}, account_category),
          account_type = COALESCE(${finalAccountType}, account_type),
          is_balance_sheet = COALESCE(${bsVal}, is_balance_sheet),
          is_reconciliation = COALESCE(${recVal}, is_reconciliation),
          is_tax_relevant = COALESCE(${taxVal}, is_tax_relevant),
          is_blocked = COALESCE(${blkVal}, is_blocked),
          description = COALESCE(${descVal}, description),
          updated_at = NOW()
        WHERE account_number = ${account_number}
        RETURNING id, chart_id, account_group_code, account_number, name, account_category, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant, is_blocked, description
      `);
    }

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'G/L account not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      glAccount: res.rows[0],
      code: 'FGLC',
      message: `G/L account ${res.rows[0].account_number} updated successfully`,
    });
  } catch (e: any) {
    console.error('API /api/gl-accounts PUT error:', e);
    const detailMsg = e.detail || e.message || 'Unknown database error';
    return NextResponse.json({ 
      error: `Database Error: ${e.message}`,
      detail: detailMsg,
      query: e.query || null
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const account_number = searchParams.get('account_number');
    const id = searchParams.get('id');
    const coa_code = searchParams.get('coa_code');
    if (!account_number && !id) return NextResponse.json({ error: 'account_number or id required' }, { status: 400 });

    // Safety Pre-check before deletion
    const precheck = await validateGLAccountDeletion({ id, accountNumber: account_number, coaCode: coa_code });
    if (!precheck.canDelete) {
      return NextResponse.json({
        success: false,
        errorCode: 'ERR_GL_DELETION_BLOCKED',
        error: precheck.errorTitle,
        diagnostic: precheck,
      }, { status: 409 });
    }

    if (id) {
      await db.execute(sql`DELETE FROM fin_ledger_account WHERE id = ${id}`);
    } else {
      await db.execute(sql`DELETE FROM fin_ledger_account WHERE account_number = ${account_number}`);
    }

    return NextResponse.json({ success: true, code: 'FGLC', message: `G/L Account ${account_number || id} deleted successfully` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
