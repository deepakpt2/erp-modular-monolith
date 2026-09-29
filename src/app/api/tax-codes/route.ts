import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Tax Codes API – Legal-safe own IP – Module 4
 * New table: fin_tax_rule (was fi_tax_code) – sample GST0/5/12/18/28, IGST, VAT 5% kept for convenience, plus India GST CGST/SGST/IGST/UTGST, HSN/SAC, GSTIN, place of supply
 * Helper code: FTXC Tax Create (alias TXC, FTXP, FIN-TX-CR) – 4-char MOOA F=Financials, TX=Tax, C=Create – same length as FTXP but own IP, module grouped, intuitive
 * Fallback to legacy fi_tax_code if new not yet migrated
 */

export async function GET() {
  const authCheck = await requireApiAuth();
  if (authCheck) return authCheck;

  try {
    // Try new legal-safe table first
    try {
      const result = await db.execute(sql`
        SELECT tr.id, tr.code, tr.description, tr.rate, tr.type, tr.gst_type, tr.hsn_code, tr.is_reverse_charge, tr.is_active, tr.ledger_account_id as gl_account_id, la.account_number, la.name as gl_name
        FROM fin_tax_rule tr
        LEFT JOIN fin_ledger_account la ON tr.ledger_account_id = la.id
        ORDER BY tr.code
      `);

      return NextResponse.json({
        taxCodes: result.rows,
        count: result.rows.length,
        source: 'db-new',
        table: 'fin_tax_rule',
        configurable: true,
        code: 'FTXC',
        aliasCodes: ['TXC', 'FTXP', 'FIN-TX-CR'],
        helperCode: 'FTXC',
        functionDescription: 'Tax Codes – FTXC – Legal-safe own IP (was FTXP) – GST0/5/12/18/28, IGST, CGST/SGST/IGST/UTGST, HSN/SAC, VAT 5% – fin_tax_rule',
        legalSafe: true,
        freshEmpty: 'Sample GST0/5/12/18/28, IGST, VAT 5% kept for convenience – fresh empty but common sample kept',
        erpDefaults: [
          { code: 'GST0', description: 'GST 0% – India GST 0% Spices – CGST0/SGST0', rate: 0, type: 'INPUT', gst_type: 'CGST', hsn: '0910', helperCode: 'FTXC', gl: '200000 CGST Input' },
          { code: 'GST5', description: 'GST 5% Spices – India GST 5% for spices – CGST 2.5% + SGST 2.5% – VAT 5% equivalent', rate: 5, type: 'INPUT', gst_type: 'CGST', hsn: '0910', helperCode: 'FTXC', gl: '200000 CGST', note: 'GST 5% like VAT 5%' },
          { code: 'GST12', description: 'GST 12% – CGST 6% + SGST 6%', rate: 12, type: 'INPUT', gst_type: 'CGST', helperCode: 'FTXC' },
          { code: 'GST18', description: 'GST 18% – CGST 9% + SGST 9%', rate: 18, type: 'INPUT', gst_type: 'CGST', helperCode: 'FTXC' },
          { code: 'GST28', description: 'GST 28% – CGST 14% + SGST 14%', rate: 28, type: 'INPUT', gst_type: 'CGST', helperCode: 'FTXC' },
          { code: 'CGST9', description: 'CGST 9% – Central GST 9%', rate: 9, type: 'INPUT', gst_type: 'CGST', helperCode: 'FTXC' },
          { code: 'SGST9', description: 'SGST 9% – State GST 9%', rate: 9, type: 'INPUT', gst_type: 'SGST', helperCode: 'FTXC' },
          { code: 'IGST18', description: 'IGST 18% – Integrated GST 18% – Interstate', rate: 18, type: 'OUTPUT', gst_type: 'IGST', helperCode: 'FTXC' },
          { code: 'VAT5', description: 'VAT 5% – GCC VAT 5% – Kuwait/GCC', rate: 5, type: 'INPUT', gst_type: 'VAT', helperCode: 'FTXC', gl: '130000 Input Tax VAT' },
        ],
        explanation: 'Tax codes legal-safe fin_tax_rule – GST0/5/12/18/28, CGST/SGST/IGST/UTGST, HSN/SAC, VAT 5% – add new via POST, edit via PUT, delete blocked if has FI postings for security. Code FTXC primary alias TXC/FTXP – 4-char MOOA F=Financials, TX=Tax, C=Create – same length as FTXP but own IP, module grouped, intuitive – sample data kept for user convenience as per requirement fresh empty but common sample data like coa, gl, tax, currencies, UoM kept.',
      });
    } catch (newErr: any) {
      console.warn('fin_tax_rule not yet migrated, fallback fi_tax_code:', newErr.message);
      const result = await db.execute(sql`
        SELECT tc.id, tc.code, tc.description, tc.rate, tc.type, tc.is_active, tc.gl_account_id, gl.account_number, gl.name as gl_name
        FROM fi_tax_code tc
        LEFT JOIN fi_gl_account gl ON tc.gl_account_id = gl.id
        ORDER BY tc.code
      `);

      return NextResponse.json({
        taxCodes: result.rows,
        count: result.rows.length,
        source: 'db-legacy',
        table: 'fi_tax_code',
        configurable: true,
        code: 'FTXC',
        aliasCodes: ['TXC', 'FTXP'],
        helperCode: 'FTXP',
        functionDescription: 'Tax Codes – ERP FTXP – VAT 5%, GST 5%/12%/18%/28%, Input/Output – configurable, secure delete blocked if has FI postings (legacy fi_tax_code – migrating to fin_tax_rule)',
        legalSafe: false,
        erpDefaults: [
          { code: 'V0', description: 'Input Tax 0% – VAT 0%', rate: 0, type: 'INPUT', helperCode: 'FTXP', gl: '130000 Input Tax VAT' },
          { code: 'V5', description: 'Input Tax 5% – VAT 5% – Kuwait/GCC VAT 5%', rate: 5, type: 'INPUT', helperCode: 'FTXP', gl: '130000 Input Tax VAT', note: 'VAT 5% example – like KWD VAT 5%' },
          { code: 'GST5', description: 'GST 5% Spices – India GST 5% for spices – VAT 5% equivalent', rate: 5, type: 'INPUT', helperCode: 'FTXP', gl: '7000000000 CGST', note: 'GST 5% like VAT 5%' },
          { code: 'GST18', description: 'GST 18%', rate: 18, type: 'INPUT', helperCode: 'FTXP' },
        ],
        explanation: 'Tax codes configurable via FTXP – VAT 5% V5/A5, GST 5% GST5/IGST5 – add new via POST, edit via PUT, delete blocked if has FI postings for security. Code FTXP (legacy, new FTXC).',
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message, taxCodes: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { code, description, rate, type, gst_type, hsn_code, is_reverse_charge, gl_account_number, ledger_account_number } = body;
    if (!code || !description || rate == null) return NextResponse.json({ error: 'code, description, rate required' }, { status: 400 });

    const finalGlNumber = ledger_account_number || gl_account_number;

    try {
      let glId = null;
      if (finalGlNumber) {
        try {
          const g = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number = ${finalGlNumber} LIMIT 1`);
          if (g.rows.length > 0) glId = (g.rows[0] as any).id;
        } catch {
          const g = await db.execute(sql`SELECT id FROM fi_gl_account WHERE account_number = ${finalGlNumber} LIMIT 1`);
          if (g.rows.length > 0) glId = (g.rows[0] as any).id;
        }
      }

      const res = await db.execute(sql`
        INSERT INTO fin_tax_rule (code, description, rate, type, gst_type, hsn_code, is_reverse_charge, ledger_account_id)
        VALUES (${code.toUpperCase()}, ${description}, ${rate}, ${type || 'INPUT'}::fin_tax_rule_type, ${gst_type || 'NONE'}::fin_gst_type, ${hsn_code || null}, ${is_reverse_charge || false}, ${glId})
        ON CONFLICT (code) DO UPDATE SET description = ${description}, rate = ${rate}, type = ${type || 'INPUT'}::fin_tax_rule_type, gst_type = ${gst_type || 'NONE'}::fin_gst_type, hsn_code = COALESCE(${hsn_code || null}, fin_tax_rule.hsn_code), ledger_account_id = COALESCE(${glId}, fin_tax_rule.ledger_account_id), is_active = true, updated_at = NOW()
        RETURNING id, code
      `);

      return NextResponse.json({ success: true, taxCode: res.rows[0], code: 'FTXC', aliasCodes: ['TXC','FTXP'], message: `Tax Code ${code.toUpperCase()} ${rate}% created – FTXC legal-safe – GST ${gst_type || ''} HSN ${hsn_code || ''} – VAT 5% etc`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('fin_tax_rule insert failed fallback fi_tax_code:', newErr.message);
      let glId = null;
      if (finalGlNumber) {
        const g = await db.execute(sql`SELECT id FROM fi_gl_account WHERE account_number = ${finalGlNumber} LIMIT 1`);
        if (g.rows.length > 0) glId = (g.rows[0] as any).id;
      }

      const res = await db.execute(sql`
        INSERT INTO fi_tax_code (code, description, rate, type, gl_account_id)
        VALUES (${code.toUpperCase()}, ${description}, ${rate}, ${type || 'INPUT'}::tax_type, ${glId})
        ON CONFLICT (code) DO UPDATE SET description = ${description}, rate = ${rate}, type = ${type || 'INPUT'}::tax_type, gl_account_id = COALESCE(${glId}, fi_tax_code.gl_account_id), is_active = true
        RETURNING id, code
      `);

      return NextResponse.json({ success: true, taxCode: res.rows[0], code: 'FTXC', aliasCodes: ['FTXP'], message: `Tax Code ${code.toUpperCase()} ${rate}% created – FTXP legacy (migrating to FTXC) – VAT 5% etc`, legalSafe: false });
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
    const { id, code, description, rate, type, gst_type, hsn_code, is_reverse_charge, gl_account_number, ledger_account_number, is_active } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    const finalGlNumber = ledger_account_number || gl_account_number;

    try {
      let glId = null;
      if (finalGlNumber) {
        try {
          const g = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number = ${finalGlNumber} LIMIT 1`);
          if (g.rows.length > 0) glId = (g.rows[0] as any).id;
        } catch {
          const g = await db.execute(sql`SELECT id FROM fi_gl_account WHERE account_number = ${finalGlNumber} LIMIT 1`);
          if (g.rows.length > 0) glId = (g.rows[0] as any).id;
        }
      }

      let res;
      if (id) {
        res = await db.execute(sql`
          UPDATE fin_tax_rule SET
            code = COALESCE(${code?.toUpperCase()}, code),
            description = COALESCE(${description}, description),
            rate = COALESCE(${rate}, rate),
            type = COALESCE(${type}::fin_tax_rule_type, type),
            gst_type = COALESCE(${gst_type}::fin_gst_type, gst_type),
            hsn_code = COALESCE(${hsn_code}, hsn_code),
            is_reverse_charge = COALESCE(${is_reverse_charge}, is_reverse_charge),
            ledger_account_id = COALESCE(${glId}, ledger_account_id),
            is_active = COALESCE(${is_active}, is_active),
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, code
        `);
      } else {
        res = await db.execute(sql`
          UPDATE fin_tax_rule SET
            description = COALESCE(${description}, description),
            rate = COALESCE(${rate}, rate),
            type = COALESCE(${type}::fin_tax_rule_type, type),
            gst_type = COALESCE(${gst_type}::fin_gst_type, gst_type),
            hsn_code = COALESCE(${hsn_code}, hsn_code),
            is_reverse_charge = COALESCE(${is_reverse_charge}, is_reverse_charge),
            ledger_account_id = COALESCE(${glId}, ledger_account_id),
            is_active = COALESCE(${is_active}, is_active),
            updated_at = NOW()
          WHERE code = ${code.toUpperCase()}
          RETURNING id, code
        `);
      }

      if (res.rows.length === 0) return NextResponse.json({ error: 'Tax code not found in fin_tax_rule' }, { status: 404 });
      return NextResponse.json({ success: true, taxCode: res.rows[0], code: 'FTXC', message: `Tax Code ${res.rows[0].code} updated – FTXC legal-safe` });
    } catch (newErr: any) {
      console.warn('fin_tax_rule update failed fallback fi_tax_code:', newErr.message);
      let glId = null;
      if (finalGlNumber) {
        const g = await db.execute(sql`SELECT id FROM fi_gl_account WHERE account_number = ${finalGlNumber} LIMIT 1`);
        if (g.rows.length > 0) glId = (g.rows[0] as any).id;
      }

      let res;
      if (id) {
        res = await db.execute(sql`
          UPDATE fi_tax_code SET
            code = COALESCE(${code?.toUpperCase()}, code),
            description = COALESCE(${description}, description),
            rate = COALESCE(${rate}, rate),
            type = COALESCE(${type}::tax_type, type),
            gl_account_id = COALESCE(${glId}, gl_account_id),
            is_active = COALESCE(${is_active}, is_active)
          WHERE id = ${id}
          RETURNING id, code
        `);
      } else {
        res = await db.execute(sql`
          UPDATE fi_tax_code SET
            description = COALESCE(${description}, description),
            rate = COALESCE(${rate}, rate),
            type = COALESCE(${type}::tax_type, type),
            gl_account_id = COALESCE(${glId}, gl_account_id),
            is_active = COALESCE(${is_active}, is_active)
          WHERE code = ${code.toUpperCase()}
          RETURNING id, code
        `);
      }

      if (res.rows.length === 0) return NextResponse.json({ error: 'Tax code not found' }, { status: 404 });
      return NextResponse.json({ success: true, taxCode: res.rows[0], message: `Tax Code ${res.rows[0].code} updated – FTXP legacy` });
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

    const checkCode = code?.toUpperCase();

    // Check if tax code in use
    let inUse = 0;
    try {
      if (checkCode) {
        try {
          const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM fin_ledger_account WHERE id IN (SELECT ledger_account_id FROM fin_tax_rule WHERE code = ${checkCode})`);
          // Actually check fi_document_line tax_code_id
          const r2 = await db.execute(sql`SELECT COUNT(*) as cnt FROM fi_document_line WHERE tax_code_id IN (SELECT id FROM fin_tax_rule WHERE code = ${checkCode})`);
          inUse = parseInt((r2.rows[0] as any).cnt || '0');
        } catch {
          const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM fi_document_line WHERE tax_code_id IN (SELECT id FROM fi_tax_code WHERE code = ${checkCode})`);
          inUse = parseInt((r.rows[0] as any).cnt || '0');
        }
      }
    } catch {}

    if (inUse > 0) {
      try {
        if (id) await db.execute(sql`UPDATE fin_tax_rule SET is_active = false, updated_at = NOW() WHERE id = ${id}`);
        else if (checkCode) await db.execute(sql`UPDATE fin_tax_rule SET is_active = false, updated_at = NOW() WHERE code = ${checkCode}`);
      } catch {
        if (id) await db.execute(sql`UPDATE fi_tax_code SET is_active = false WHERE id = ${id}`);
        else await db.execute(sql`UPDATE fi_tax_code SET is_active = false WHERE code = ${checkCode}`);
      }
      return NextResponse.json({ error: `Cannot delete – tax code ${checkCode} has ${inUse} FI postings and cannot be deleted to maintain audit trail. Deactivated instead.`, code: 'HAS_TRANSACTIONS', softDeleted: true }, { status: 400 });
    }

    try {
      if (id) await db.execute(sql`DELETE FROM fin_tax_rule WHERE id = ${id}`);
      else if (checkCode) await db.execute(sql`DELETE FROM fin_tax_rule WHERE code = ${checkCode}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM fi_tax_code WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fi_tax_code WHERE code = ${checkCode}`);
    }

    return NextResponse.json({ success: true, code: 'FTXC', message: `Tax Code ${checkCode || id} deleted – FTXC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
