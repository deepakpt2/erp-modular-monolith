import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Chart of Accounts API – Legal-safe own IP – Module 4
 * New: fin_chart (was fin_chart) – INT, KSCA etc kept per requirement fresh empty but sample CoA kept
 * Helper code: FCOA Chart of Accounts Create (alias COA, FCOA (legacy OB13), FIN-COA-CR) – 4-char MOOA F=Financials, CO=ChartOfAccounts, A=Admin – module grouped, intuitive
 * Fallback to legacy fin_chart
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    let coaRows: any[] = [];
    let source = 'db-merged';
    let table = 'fin_chart+fin_chart';
    let legalSafe = true;

    // Try new fin_chart
    let newRows: any[] = [];
    try {
      const coaRes = await db.execute(sql`
        SELECT id, code, name, description, created_at,
          (SELECT COUNT(*) FROM fin_ledger_account WHERE chart_id = fin_chart.id) as gl_count
        FROM fin_chart ORDER BY code
      `);
      newRows = coaRes.rows as any[];
    } catch (newErr: any) {
      console.warn('fin_chart not yet:', newErr.message);
    }

    // Try legacy fin_chart – always try, merge
    let legacyRows: any[] = [];
    try {
      const coaRes2 = await db.execute(sql`
        SELECT id, code, name, description, created_at,
          (SELECT COUNT(*) FROM fin_ledger_account WHERE coa_id = fin_chart.id) as gl_count
        FROM fin_chart ORDER BY code
      `);
      legacyRows = coaRes2.rows as any[];
      if (newRows.length === 0 && legacyRows.length > 0) {
        source = 'db-legacy';
        table = 'fin_chart';
        legalSafe = false;
      }
    } catch (legacyErr: any) {
      console.warn('fin_chart not yet:', legacyErr.message);
      if (newRows.length > 0) {
        source = 'db-new';
        table = 'fin_chart';
      }
    }

    // Merge unique by code – prefer newRows over legacy
    const map = new Map<string, any>();
    for (const r of [...legacyRows, ...newRows]) {
      const key = (r.code || '').toUpperCase();
      if (!key) continue;
      // newRows overwrite legacy if same code
      if (!map.has(key) || newRows.some(nr => (nr.code||'').toUpperCase() === key)) {
        map.set(key, r);
      }
    }
    coaRows = Array.from(map.values()).sort((a,b)=> (a.code||'').localeCompare(b.code||''));
    // If still empty but one of the sources had rows, use that directly (fallback)
    if (coaRows.length === 0) {
      coaRows = newRows.length > 0 ? newRows : legacyRows;
    }

    // Enterprise Self-Healing: If 0 charts exist, auto-seed CA-IN-01 baseline on demand
    if (coaRows.length === 0) {
      try {
        console.log('[API FCOA] 0 Chart of Accounts detected. Running auto-seed for standard baseline (CA-IN-01)...');
        const { seedIndustryStandardBaseline } = await import('@/shared/kernel/db/standardSystemDefaults');
        await seedIndustryStandardBaseline();
        const refetch = await db.execute(sql`
          SELECT id, code, name, description, created_at,
            (SELECT COUNT(*) FROM fin_ledger_account WHERE chart_id = fin_chart.id) as gl_count
          FROM fin_chart ORDER BY code
        `);
        if (refetch.rows.length > 0) {
          coaRows = refetch.rows as any[];
        }
      } catch (seedErr: any) {
        console.warn('[API FCOA] Auto-seed attempt warning:', seedErr.message);
      }
    }

    // Account groups – try both
    let groups: any[] = [];
    try {
      const g = await db.execute(sql`SELECT id, code, name, description FROM fin_account_group ORDER BY code`);
      groups = g.rows;
    } catch {
      try {
        const g = await db.execute(sql`SELECT id, code, name, description FROM fi_account_group ORDER BY code`);
        groups = g.rows;
      } catch {
        try {
          const g2 = await db.execute(sql`SELECT id, code, name FROM fi_account_group ORDER BY code`);
          groups = g2.rows;
        } catch {}
      }
    }

    return NextResponse.json({
      chartOfAccounts: coaRows,
      accountGroups: groups,
      count: coaRows.length,
      configurable: true,
      code: 'FCOA',
      aliasCodes: ['COA', 'OB13', 'FIN-COA-CR'],
      helperCode: 'FCOA',
      table,
      source,
      legalSafe,
      functionDescription: 'Edit Chart of Accounts List – FCOA legal-safe own IP (was FCOA (legacy OB13)) – General CoA available like ERP: INT, KSCA, CAUS, GKR, YIN – each with corresponding G/L accounts FGLC (was FGLC (legacy FS00))',
      erpDefaults: [
        { code: 'INT', name: 'International CoA', helperCode: 'FCOA', gl: '100000-500005, 2500000001 Retained Earnings', type: 'General CoA – standard INT – sample kept' },
        { code: 'KSCA', name: 'Kerala Spices Chart', helperCode: 'FCOA', gl: '5000000001 Raw Mat, 5000000002 FG, 5000000003 GR/IR, 5000000004 Transit, 5000000005 Price Diff, 5000000006 Consumption, 2500000001 Retained OB53', type: 'General CoA custom – KSCA – sample kept' },
        { code: 'CAUS', name: 'Chart of Accounts USA', helperCode: 'FCOA', gl: '100000 Cash, 120000 AR, 140000 Inventory ROH, 200000 GR/IR, 300000 Revenue, 400000 COGS', type: 'General CoA USA – CAUS – sample kept' },
        { code: 'YIN', name: 'Indian Chart GST', helperCode: 'FCOA', gl: '100000 Inventory, 700000 CGST/SGST Input, 200001 CGST Payable, GST – sample kept', type: 'General CoA India – YIN – sample kept for user convenience' },
      ],
      explanation: 'CoA legal-safe fin_chart – add new CoA via POST, e.g., KSCA, INT, TEST. Each CoA can have G/L accounts via /api/gl-accounts (FGLC) and account groups. Code FCOA primary alias COA/FCOA (legacy OB13) – 4-char MOOA F=Financials CO=ChartOfAccounts A=Admin – module grouped intuitive – sample data kept for user convenience per requirement fresh empty but common sample data like coa, gl, tax, currencies, UoM kept.',
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
    const { code, name, description, language, copy_from_coa } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    let primaryRes: any = null;
    let legalSafe = true;
    let errors: string[] = [];
    const finalLang = (language || 'EN').toUpperCase();

    // Ensure language column exists – auto-migrate safe
    try {
      await db.execute(sql`ALTER TABLE fin_chart ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'EN'`);
    } catch {}

    // Try fin_chart – new legal-safe with language EN per guide
    try {
      const res = await db.execute(sql`
        INSERT INTO fin_chart (code, name, description, language)
        VALUES (${code.toUpperCase()}, ${name}, ${description || null}, ${finalLang})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}, language = ${finalLang}, updated_at = NOW()
        RETURNING id, code, name, language
      `);
      primaryRes = res.rows[0];
    } catch (newErr: any) {
      console.warn('fin_chart insert failed:', newErr.message);
      errors.push(`fin_chart: ${newErr.message}`);
      legalSafe = false;
    }

    // Try legacy fin_chart – keep in sync downstream safe – add language if column exists
    try {
      await db.execute(sql`ALTER TABLE fin_chart ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'EN'`).catch(()=>{});
      const res2 = await db.execute(sql`
        INSERT INTO fin_chart (code, name, description)
        VALUES (${code.toUpperCase()}, ${name}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}
        RETURNING id, code, name
      `);
      if (!primaryRes) primaryRes = res2.rows[0];
    } catch (legacyErr: any) {
      console.warn('fin_chart insert failed:', legacyErr.message);
      errors.push(`fin_chart: ${legacyErr.message}`);
    }

    if (!primaryRes) {
      return NextResponse.json({ error: `Failed to create CoA in both tables: ${errors.join(' | ')}` }, { status: 500 });
    }

    // If copy_from_coa was specified, copy G/L accounts from source chart to newly created chart
    let copiedCount = 0;
    if (copy_from_coa) {
      const sourceCode = copy_from_coa.toUpperCase().trim();
      try {
        const sourceChart = await db.execute(sql`SELECT id FROM fin_chart WHERE code = ${sourceCode} LIMIT 1`);
        if (sourceChart.rows.length > 0) {
          const srcId = (sourceChart.rows[0] as any).id;
          const copyRes = await db.execute(sql`
            INSERT INTO fin_ledger_account (
              chart_id, coa_id, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant, is_active
            )
            SELECT 
              ${primaryRes.id}, ${primaryRes.id}, account_number, name, account_type, is_balance_sheet, is_reconciliation, is_tax_relevant, true
            FROM fin_ledger_account
            WHERE chart_id = ${srcId} OR coa_id = ${srcId}
            ON CONFLICT DO NOTHING
            RETURNING id
          `);
          copiedCount = copyRes.rows.length;
        }
      } catch (copyErr: any) {
        console.warn('Copy accounts warning:', copyErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      chartOfAccounts: primaryRes,
      code: 'FCOA',
      aliasCodes: ['COA','OB13'],
      copied_accounts_count: copiedCount,
      message: `CoA ${code.toUpperCase()} created/updated${copiedCount > 0 ? ` with ${copiedCount} copied accounts from ${copy_from_coa.toUpperCase()}` : ''} – FCOA ${legalSafe ? 'legal-safe' : 'legacy merged'}`,
      legalSafe,
      errors: errors.length ? errors : undefined
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, code, name, description } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    try {
      let res;
      if (id) {
        res = await db.execute(sql`UPDATE fin_chart SET code = COALESCE(${code?.toUpperCase()}, code), name = COALESCE(${name}, name), description = COALESCE(${description}, description), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name`);
      } else {
        res = await db.execute(sql`UPDATE fin_chart SET name = COALESCE(${name}, name), description = COALESCE(${description}, description), updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      }
      if (res.rows.length === 0) throw new Error('Not found in fin_chart');
      return NextResponse.json({ success: true, chartOfAccounts: res.rows[0], code: 'FCOA', message: `CoA ${res.rows[0].code} updated – FCOA legal-safe` });
    } catch (newErr: any) {
      let res;
      if (id) {
        res = await db.execute(sql`UPDATE fin_chart SET code = COALESCE(${code?.toUpperCase()}, code), name = COALESCE(${name}, name), description = COALESCE(${description}, description) WHERE id = ${id} RETURNING id, code, name`);
      } else {
        res = await db.execute(sql`UPDATE fin_chart SET name = COALESCE(${name}, name), description = COALESCE(${description}, description) WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      }
      if (res.rows.length === 0) return NextResponse.json({ error: 'CoA not found' }, { status: 404 });
      return NextResponse.json({ success: true, chartOfAccounts: res.rows[0], code: 'FCOA', message: `CoA ${res.rows[0].code} updated – FCOA (legacy OB13) legacy` });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import { validateChartOfAccountsDeletion } from '@/shared/kernel/safety/deletionPrecheck';

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code')?.toUpperCase();
    const id = searchParams.get('id');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    // SAP Standard Safety Pre-check
    const precheck = await validateChartOfAccountsDeletion({ id, code });
    if (!precheck.canDelete) {
      return NextResponse.json({
        success: false,
        errorCode: 'SAP_MSG_OB13_001',
        error: precheck.errorTitle,
        diagnostic: precheck,
      }, { status: 409 });
    }

    try {
      if (id) await db.execute(sql`DELETE FROM fin_chart WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fin_chart WHERE code = ${code}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM fin_chart WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fin_chart WHERE code = ${code}`);
    }

    return NextResponse.json({ success: true, code: 'FCOA', message: `CoA ${code || id} deleted – FCOA legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
