import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Retained Earnings API – Legal-safe own IP – Module 5 FICO Deep Dive
 * New: fin_retained_earnings (was fi_retained_earnings) – chartId was coa_id, accountNumber 2500000001 Retained Earnings – OB53
 * Helper code: FRGC Retained Earnings Create (alias RGC, OB53, FIN-RE-CR) – 4-char MOOA F=Financials, RG=Retained, C=Create – module grouped intuitive
 * Fallback to legacy fi_retained_earnings
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'fin_retained_earnings';
    let legalSafe = true;

    try {
      const res = await db.execute(sql`
        SELECT re.*, c.code as chart_code, c.name as chart_name, la.account_number, la.name as gl_name
        FROM fin_retained_earnings re
        JOIN fin_chart c ON re.chart_id = c.id
        LEFT JOIN fin_ledger_account la ON la.account_number = re.account_number AND la.chart_id = re.chart_id
        ORDER BY c.code, re.account_number
      `);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('fin_retained_earnings not yet fallback fi_retained_earnings:', newErr.message);
      source = 'db-legacy';
      table = 'fi_retained_earnings';
      legalSafe = false;
      try {
        const res = await db.execute(sql`
          SELECT re.*, coa.code as chart_code, coa.name as chart_name
          FROM fi_retained_earnings re
          JOIN fi_chart_of_accounts coa ON re.coa_id = coa.id
          ORDER BY coa.code, re.account_number
        `);
        rows = res.rows as any[];
      } catch (e: any) {
        if (e.message?.includes('does not exist')) {
          return NextResponse.json({ data: [], retainedEarnings: [], count: 0, message: 'Table fin_retained_earnings not yet migrated – fresh empty Module5', code: 'FRGC', aliasCodes: ['RGC','OB53'], helperCode: 'FRGC', table: 'fin_retained_earnings', source: 'none', legalSafe: true });
        }
        throw e;
      }
    }

    return NextResponse.json({
      data: rows,
      retainedEarnings: rows,
      count: rows.length,
      code: 'FRGC',
      aliasCodes: ['RGC', 'OB53', 'FIN-RE-CR'],
      helperCode: 'FRGC',
      table,
      source,
      legalSafe,
      functionDescription: 'Retained Earnings – FRGC legal-safe own IP (was OB53) – chartId was coa_id, accountNumber 2500000001 Retained Earnings, sample kept',
      erpDefaults: [
        { chart: 'INT', accountNumber: '2500000001', description: 'Retained Earnings – INT – sample kept', helperCode: 'FRGC', note: 'OB53 – Retained Earnings account for P&L closing' },
        { chart: 'KSCA', accountNumber: '2500000001', description: 'Retained Earnings – KSCA', helperCode: 'FRGC' },
      ],
      explanation: 'Retained earnings legal-safe fin_retained_earnings – chartId was coa_id, accountNumber 2500000001 Retained Earnings – Code FRGC primary alias RGC/OB53 – 4-char MOOA F=Financials RG=Retained C=Create – module grouped intuitive – sample data kept for user convenience per requirement fresh empty but common sample data like coa, gl, tax, currencies, UoM kept.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], retainedEarnings: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { chart_code, coa_code, account_number, description } = body;
    const finalChartCode = chart_code || coa_code;
    if (!finalChartCode || !account_number) return NextResponse.json({ error: 'chart_code/coa_code and account_number required' }, { status: 400 });

    try {
      const chartRes = await db.execute(sql`SELECT id FROM fin_chart WHERE code = ${finalChartCode.toUpperCase()} LIMIT 1`);
      if (chartRes.rows.length === 0) return NextResponse.json({ error: `Chart ${finalChartCode} not found in fin_chart` }, { status: 404 });
      const chartId = (chartRes.rows[0] as any).id;

      const res = await db.execute(sql`
        INSERT INTO fin_retained_earnings (chart_id, coa_id, account_number, description)
        VALUES (${chartId}, ${chartId}, ${account_number}, ${description || null})
        ON CONFLICT (chart_id, account_number) DO UPDATE SET description = ${description || null}
        RETURNING id, account_number
      `);
      return NextResponse.json({ success: true, retainedEarnings: res.rows[0], code: 'FRGC', message: `Retained earnings ${account_number} for chart ${finalChartCode.toUpperCase()} created – FRGC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('fin_retained_earnings insert failed fallback fi_retained_earnings:', newErr.message);
      const chartRes = await db.execute(sql`SELECT id FROM fi_chart_of_accounts WHERE code = ${finalChartCode.toUpperCase()} LIMIT 1`);
      if (chartRes.rows.length === 0) return NextResponse.json({ error: `Chart ${finalChartCode} not found` }, { status: 404 });
      const chartId = (chartRes.rows[0] as any).id;

      const res = await db.execute(sql`
        INSERT INTO fi_retained_earnings (coa_id, account_number)
        VALUES (${chartId}, ${account_number})
        ON CONFLICT (coa_id, account_number) DO NOTHING
        RETURNING id, account_number
      `);
      return NextResponse.json({ success: true, retainedEarnings: res.rows[0], code: 'FRGC', message: `Retained earnings ${account_number} for chart ${finalChartCode.toUpperCase()} created – OB53 legacy (migrating to FRGC)`, legalSafe: false });
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
    const id = searchParams.get('id');
    const account_number = searchParams.get('account_number');
    if (!id && !account_number) return NextResponse.json({ error: 'id or account_number required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM fin_retained_earnings WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fin_retained_earnings WHERE account_number = ${account_number}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM fi_retained_earnings WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fi_retained_earnings WHERE account_number = ${account_number}`);
    }

    return NextResponse.json({ success: true, code: 'FRGC', message: `Retained earnings ${account_number || id} deleted – FRGC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
