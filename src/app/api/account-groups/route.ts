import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Account Groups API – Legal-safe own IP – Module 5 FICO Deep Dive
 * New: fin_account_group (was fi_account_group) – chartId was coa_id, code, name, from_account, to_account – OBD4
 * Helper code: FAGC Account Group Create (alias AGC, OBD4, FIN-AG-CR) – 4-char MOOA F=Financials, AG=AccountGroup, C=Create – module grouped intuitive
 * Fallback to legacy fi_account_group
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const coaCode = searchParams.get('coaCode') || searchParams.get('chartCode') || 'ALL';

  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'fin_account_group';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT ag.*, c.code as chart_code, c.name as chart_name
        FROM fin_account_group ag
        JOIN fin_chart c ON ag.chart_id = c.id
        WHERE 1=1
      `;
      if (coaCode && coaCode !== 'ALL') query = sql`${query} AND c.code = ${coaCode}`;
      query = sql`${query} ORDER BY c.code, ag.code`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('fin_account_group not yet fallback fi_account_group:', newErr.message);
      source = 'db-legacy';
      table = 'fi_account_group';
      legalSafe = false;
      try {
        let query = sql`
          SELECT ag.*, coa.code as chart_code, coa.name as chart_name
          FROM fi_account_group ag
          JOIN fin_chart coa ON ag.coa_id = coa.id
          WHERE 1=1
        `;
        if (coaCode && coaCode !== 'ALL') query = sql`${query} AND coa.code = ${coaCode}`;
        query = sql`${query} ORDER BY coa.code, ag.code`;
        const res = await db.execute(query);
        rows = res.rows as any[];
      } catch (e: any) {
        if (e.message?.includes('does not exist')) {
          return NextResponse.json({ data: [], accountGroups: [], count: 0, message: 'Table fin_account_group not yet migrated – fresh empty Module5', code: 'FAGC', aliasCodes: ['AGC','OBD4'], helperCode: 'FAGC', table: 'fin_account_group', source: 'none', legalSafe: true });
        }
        throw e;
      }
    }

    return NextResponse.json({
      data: rows,
      accountGroups: rows,
      count: rows.length,
      code: 'FAGC',
      aliasCodes: ['AGC', 'OBD4', 'FIN-AG-CR'],
      helperCode: 'FAGC',
      table,
      source,
      legalSafe,
      functionDescription: 'Account Groups – FAGC legal-safe own IP (was OBD4) – chartId was coa_id, code ASST/LIAB/REVN/EXPN, from_account 100000 to_account 199999, sample kept',
      erpDefaults: [
        { code: 'ASST', name: 'Asset Accounts', from: '100000', to: '199999', chart: 'INT', helperCode: 'FAGC', note: 'Sample kept' },
        { code: 'LIAB', name: 'Liability Accounts', from: '200000', to: '299999', chart: 'INT', helperCode: 'FAGC' },
        { code: 'REVN', name: 'Revenue Accounts', from: '300000', to: '399999', chart: 'INT', helperCode: 'FAGC' },
        { code: 'EXPN', name: 'Expense Accounts', from: '400000', to: '499999', chart: 'INT', helperCode: 'FAGC' },
      ],
      explanation: 'Account groups legal-safe fin_account_group – chartId was coa_id, code, name, from_account, to_account – Code FAGC primary alias AGC/OBD4 – 4-char MOOA F=Financials AG=AccountGroup C=Create – module grouped intuitive – sample data kept for user convenience.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], accountGroups: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { coa_code, chart_code, code, name, from_account, to_account, description } = body;
    const finalChartCode = chart_code || coa_code;
    if (!finalChartCode || !code || !name || !from_account || !to_account) return NextResponse.json({ error: 'chart_code/coa_code, code, name, from_account, to_account required' }, { status: 400 });

    try {
      const chartRes = await db.execute(sql`SELECT id FROM fin_chart WHERE code = ${finalChartCode.toUpperCase()} LIMIT 1`);
      if (chartRes.rows.length === 0) return NextResponse.json({ error: `Chart ${finalChartCode} not found in fin_chart` }, { status: 404 });
      const chartId = (chartRes.rows[0] as any).id;

      const res = await db.execute(sql`
        INSERT INTO fin_account_group (chart_id, coa_id, code, name, from_account, to_account, description)
        VALUES (${chartId}, ${chartId}, ${code.toUpperCase()}, ${name}, ${from_account}, ${to_account}, ${description || null})
        ON CONFLICT (chart_id, code) DO UPDATE SET name = ${name}, from_account = ${from_account}, to_account = ${to_account}, description = ${description || null}, updated_at = NOW()
        RETURNING id, code, name
      `);
      return NextResponse.json({ success: true, accountGroup: res.rows[0], code: 'FAGC', message: `Account group ${code.toUpperCase()} created – FAGC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('fin_account_group insert failed fallback fi_account_group:', newErr.message);
      const chartRes = await db.execute(sql`SELECT id FROM fin_chart WHERE code = ${finalChartCode.toUpperCase()} LIMIT 1`);
      if (chartRes.rows.length === 0) return NextResponse.json({ error: `Chart ${finalChartCode} not found` }, { status: 404 });
      const chartId = (chartRes.rows[0] as any).id;

      const res = await db.execute(sql`
        INSERT INTO fi_account_group (coa_id, code, name, from_account, to_account, description)
        VALUES (${chartId}, ${code.toUpperCase()}, ${name}, ${from_account}, ${to_account}, ${description || null})
        ON CONFLICT (coa_id, code) DO UPDATE SET name = ${name}, from_account = ${from_account}, to_account = ${to_account}, description = ${description || null}
        RETURNING id, code, name
      `);
      return NextResponse.json({ success: true, accountGroup: res.rows[0], code: 'FAGC', message: `Account group ${code.toUpperCase()} created – OBD4 legacy (migrating to FAGC)`, legalSafe: false });
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
    const { id, code, name, from_account, to_account } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE fin_account_group SET name = COALESCE(${name}, name), from_account = COALESCE(${from_account}, from_account), to_account = COALESCE(${to_account}, to_account), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE fin_account_group SET name = COALESCE(${name}, name), from_account = COALESCE(${from_account}, from_account), to_account = COALESCE(${to_account}, to_account), updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) throw new Error('Not found in fin_account_group');
      return NextResponse.json({ success: true, accountGroup: res.rows[0], code: 'FAGC', message: `Account group ${res.rows[0].code} updated – FAGC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE fi_account_group SET name = COALESCE(${name}, name), from_account = COALESCE(${from_account}, from_account), to_account = COALESCE(${to_account}, to_account) WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE fi_account_group SET name = COALESCE(${name}, name), from_account = COALESCE(${from_account}, from_account), to_account = COALESCE(${to_account}, to_account) WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Account group not found' }, { status: 404 });
      return NextResponse.json({ success: true, accountGroup: res.rows[0], message: `Account group ${res.rows[0].code} updated – OBD4 legacy` });
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
      if (id) await db.execute(sql`DELETE FROM fin_account_group WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fin_account_group WHERE code = ${code}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM fi_account_group WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fi_account_group WHERE code = ${code}`);
    }

    return NextResponse.json({ success: true, code: 'FAGC', message: `Account group ${code || id} deleted – FAGC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
