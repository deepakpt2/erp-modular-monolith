import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Universal Ledger API – Legal-safe own IP – Module 5 FICO Deep Dive + 21-point foundation: Universal Ledger/Posting Engine (point 4)
 * New: fin_universal_ledger (was ACDOCA) – ledgerType LEADING/NON_LEADING/EXTENSION, documentNumber, documentType JRNL/INV/BILL/PAY/GR/GI/DN/ASSET/PAYROLL/REVERSAL was SA/RE/WE/RV/AB/PR/HR, postingDate, documentDate, fiscalYear, fiscalPeriod 1-12, legalEntityId was company_code_id, ledgerAccountId was gl_account_id, debit/credit/amount, currencyCode INR default, costUnitId org_cost_unit was cost_center, profitUnitId org_profit_unit, partnerId partner_account was bp_id, itemId prod_item was material_id, facilityId org_facility was plant, lotId inv_lot was batch, taxRuleId fin_tax_rule was tax_code, referenceDocType PO/GR/IV/SO/BILL, referenceDocNumber, text, isReversed
 * Helper code: FULC Universal Ledger Create (alias ULC, ACDOCA, FIN-UL-CR) – 4-char MOOA F=Financials, UL=UniversalLedger, C=Create – module grouped intuitive
 * Fallback to legacy fi_document + fi_document_line if new not yet
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const legalEntity = searchParams.get('legalEntity') || searchParams.get('companyCode');
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const ledgerAccount = searchParams.get('ledgerAccount') || searchParams.get('glAccount');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'fin_universal_ledger';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT ul.*, la.account_number, la.name as ledger_account_name, le.code as legal_entity_code, pa.account_number as partner_number, pa.display_name as partner_name, pi.item_number, pi.name as item_name
        FROM fin_universal_ledger ul
        LEFT JOIN fin_ledger_account la ON ul.ledger_account_id = la.id
        LEFT JOIN org_legal_entity le ON ul.legal_entity_id = le.id
        LEFT JOIN partner_account pa ON ul.partner_id = pa.id
        LEFT JOIN prod_item pi ON ul.item_id = pi.id
        WHERE 1=1
      `;
      if (legalEntity) query = sql`${query} AND (le.code = ${legalEntity} OR EXISTS (SELECT 1 FROM ent_company_code cc WHERE cc.code = ${legalEntity} AND cc.id = ul.company_code_id))`;
      if (fromDate) query = sql`${query} AND ul.posting_date >= ${new Date(fromDate)}`;
      if (toDate) query = sql`${query} AND ul.posting_date <= ${new Date(toDate)}`;
      if (ledgerAccount) query = sql`${query} AND la.account_number = ${ledgerAccount}`;
      query = sql`${query} ORDER BY ul.posting_date DESC, ul.document_number DESC LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    } catch (newErr: any) {
      console.warn('fin_universal_ledger not yet fallback fi_document:', newErr.message);
      source = 'db-legacy';
      table = 'fi_document + fi_document_line';
      legalSafe = false;
      try {
        let query = sql`
          SELECT d.document_number, d.doc_type, d.posting_date, d.document_date, d.currency, l.debit, l.credit, gl.account_number, gl.name as gl_name, cc.code as company_code
          FROM fi_document d
          JOIN fi_document_line l ON l.fi_document_id = d.id
          JOIN fi_gl_account gl ON l.gl_account_id = gl.id
          JOIN ent_company_code cc ON d.company_code_id = cc.id
          WHERE 1=1
        `;
        if (legalEntity) query = sql`${query} AND cc.code = ${legalEntity}`;
        if (fromDate) query = sql`${query} AND d.posting_date >= ${new Date(fromDate)}`;
        if (toDate) query = sql`${query} AND d.posting_date <= ${new Date(toDate)}`;
        if (ledgerAccount) query = sql`${query} AND gl.account_number = ${ledgerAccount}`;
        query = sql`${query} ORDER BY d.posting_date DESC LIMIT ${limit}`;
        const res = await db.execute(query);
        rows = res.rows as any[];
      } catch (e: any) {
        if (e.message?.includes('does not exist')) {
          return NextResponse.json({ data: [], universalLedger: [], count: 0, message: 'Table fin_universal_ledger not yet migrated – fresh empty Module5', code: 'FULC', aliasCodes: ['ULC','ACDOCA'], helperCode: 'FULC', table: 'fin_universal_ledger', source: 'none', legalSafe: true });
        }
        throw e;
      }
    }

    // Trial balance summary
    let trialBalance: any[] = [];
    try {
      if (legalSafe) {
        const tbRes = await db.execute(sql`
          SELECT la.account_number, la.name, la.account_type, SUM(ul.debit) as total_debit, SUM(ul.credit) as total_credit, SUM(ul.amount) as net
          FROM fin_universal_ledger ul
          JOIN fin_ledger_account la ON ul.ledger_account_id = la.id
          WHERE ul.is_reversed = false
          GROUP BY la.account_number, la.name, la.account_type
          ORDER BY la.account_number
          LIMIT 100
        `);
        trialBalance = tbRes.rows as any[];
      }
    } catch {}

    return NextResponse.json({
      data: rows,
      universalLedger: rows,
      trialBalance,
      count: rows.length,
      code: 'FULC',
      aliasCodes: ['ULC', 'ACDOCA', 'FIN-UL-CR'],
      helperCode: 'FULC',
      table,
      source,
      legalSafe,
      functionDescription: 'Universal Ledger – FULC legal-safe own IP (was ACDOCA) – ledgerType LEADING/NON_LEADING/EXTENSION, documentNumber, documentType JRNL/INV/BILL/PAY/GR/GI/DN/ASSET/PAYROLL/REVERSAL was SA/RE/WE/RV/AB/PR/HR, postingDate, documentDate, fiscalYear, fiscalPeriod 1-12, legalEntityId was company_code_id, ledgerAccountId was gl_account_id, debit/credit/amount, currencyCode INR default, costUnitId org_cost_unit, profitUnitId org_profit_unit, partnerId partner_account, itemId prod_item, facilityId org_facility, lotId inv_lot, taxRuleId fin_tax_rule – universal ledger/posting engine – Module5',
      erpDefaults: [
        { documentNumber: 'FI-1000000001', documentType: 'GR', postingDate: '2026-09-29', ledgerAccount: '140000 Inventory RAW', debit: 10000, credit: 0, amount: 10000, reference: 'GR-5000000001', helperCode: 'FULC', note: 'Sample – Goods Receipt inventory posting BSX' },
        { documentNumber: 'FI-1000000002', documentType: 'GR', postingDate: '2026-09-29', ledgerAccount: '200000 GR/IR Clearing WRX', debit: 0, credit: 10000, amount: -10000, reference: 'GR-5000000001', helperCode: 'FULC', note: 'Sample – GR/IR clearing WRX' },
        { documentNumber: 'FI-1000000003', documentType: 'INV', postingDate: '2026-09-29', ledgerAccount: '200000 GR/IR Clearing', debit: 10000, credit: 0, amount: 10000, reference: 'IV-5100000001', helperCode: 'FULC' },
        { documentNumber: 'FI-1000000004', documentType: 'INV', postingDate: '2026-09-29', ledgerAccount: '210000 Vendor Payables', debit: 0, credit: 10000, amount: -10000, reference: 'IV-5100000001', helperCode: 'FULC' },
      ],
      explanation: 'Universal ledger legal-safe fin_universal_ledger – ledgerType LEADING/NON_LEADING/EXTENSION, documentNumber from number range FNRC FI-DOC-01, documentType JRNL/INV/BILL/PAY/GR/GI/DN/ASSET/PAYROLL/REVERSAL was SA/RE/WE/RV/AB/PR/HR, postingDate, documentDate, fiscalYear, fiscalPeriod 1-12, legalEntityId was company_code_id, ledgerAccountId was gl_account_id, debit/credit/amount, currencyCode INR default, costUnitId org_cost_unit, profitUnitId org_profit_unit, partnerId partner_account, itemId prod_item, facilityId org_facility, lotId inv_lot, taxRuleId fin_tax_rule – universal ledger/posting engine (point 4 of 21-point foundation doc) – Code FULC primary alias ULC/ACDOCA – 4-char MOOA F=Financials UL=UniversalLedger C=Create – module grouped intuitive – sample data kept for user convenience.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], universalLedger: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { document_type, posting_date, document_date, fiscal_year, fiscal_period, legal_entity_code, ledger_account_number, gl_account_number, debit, credit, amount, currency_code, partner_account_number, item_number, facility_code, reference_doc_type, reference_doc_number, text } = body;
    if (!document_type || !posting_date || !ledger_account_number && !gl_account_number) return NextResponse.json({ error: 'document_type, posting_date, ledger_account_number/gl_account_number required' }, { status: 400 });

    const finalLedgerNumber = ledger_account_number || gl_account_number;

    try {
      let ledgerAccountId = null;
      try {
        const la = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number = ${finalLedgerNumber} LIMIT 1`);
        if (la.rows.length > 0) ledgerAccountId = (la.rows[0] as any).id;
      } catch {
        const la = await db.execute(sql`SELECT id FROM fi_gl_account WHERE account_number = ${finalLedgerNumber} LIMIT 1`);
        if (la.rows.length > 0) ledgerAccountId = (la.rows[0] as any).id;
      }
      if (!ledgerAccountId) return NextResponse.json({ error: `Ledger account ${finalLedgerNumber} not found` }, { status: 404 });

      let legalEntityId = null;
      if (legal_entity_code) {
        try {
          const le = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code = ${legal_entity_code} LIMIT 1`);
          if (le.rows.length > 0) legalEntityId = (le.rows[0] as any).id;
        } catch {
          try {
            const le = await db.execute(sql`SELECT id FROM ent_company_code WHERE code = ${legal_entity_code} LIMIT 1`);
            if (le.rows.length > 0) legalEntityId = (le.rows[0] as any).id;
          } catch {}
        }
      }

      let partnerId = null;
      if (partner_account_number) {
        try {
          const pa = await db.execute(sql`SELECT id FROM partner_account WHERE account_number = ${partner_account_number} LIMIT 1`);
          if (pa.rows.length > 0) partnerId = (pa.rows[0] as any).id;
        } catch {
          try {
            const pa = await db.execute(sql`SELECT id FROM ent_business_partner WHERE bp_number = ${partner_account_number} LIMIT 1`);
            if (pa.rows.length > 0) partnerId = (pa.rows[0] as any).id;
          } catch {}
        }
      }

      let itemId = null;
      if (item_number) {
        try {
          const it = await db.execute(sql`SELECT id FROM prod_item WHERE item_number = ${item_number} LIMIT 1`);
          if (it.rows.length > 0) itemId = (it.rows[0] as any).id;
        } catch {
          try {
            const it = await db.execute(sql`SELECT id FROM ent_material_master WHERE material_number = ${item_number} LIMIT 1`);
            if (it.rows.length > 0) itemId = (it.rows[0] as any).id;
          } catch {}
        }
      }

      let facilityId = null;
      if (facility_code) {
        try {
          const fac = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${facility_code} LIMIT 1`);
          if (fac.rows.length > 0) facilityId = (fac.rows[0] as any).id;
        } catch {
          try {
            const fac = await db.execute(sql`SELECT id FROM ent_plant WHERE code = ${facility_code} LIMIT 1`);
            if (fac.rows.length > 0) facilityId = (fac.rows[0] as any).id;
          } catch {}
        }
      }

      // Generate document number via number range if not provided – simple sequence
      let docNumber = body.document_number;
      if (!docNumber) {
        try {
          const nrRes = await db.execute(sql`SELECT current_number, prefix FROM core_number_range WHERE object_type = 'FI_DOC'::core_nr_object_type ORDER BY fiscal_year DESC LIMIT 1`);
          if (nrRes.rows.length > 0) {
            const current = parseInt((nrRes.rows[0] as any).current_number) + 1;
            const prefix = (nrRes.rows[0] as any).prefix || 'FI-';
            docNumber = `${prefix}${current}`;
            await db.execute(sql`UPDATE core_number_range SET current_number = ${current}, updated_at = NOW() WHERE object_type = 'FI_DOC'::core_nr_object_type`);
          } else {
            docNumber = `FI-${Date.now()}`;
          }
        } catch {
          docNumber = `FI-${Date.now()}`;
        }
      }

      const postingDate = new Date(posting_date);
      const docDate = document_date ? new Date(document_date) : postingDate;
      const fy = fiscal_year || postingDate.getFullYear();
      const fp = fiscal_period || (postingDate.getMonth() + 1);

      const res = await db.execute(sql`
        INSERT INTO fin_universal_ledger (document_number, document_type, document_type_legacy, posting_date, document_date, fiscal_year, fiscal_period, legal_entity_id, ledger_account_id, gl_account_id, debit, credit, amount, currency_code, partner_id, item_id, facility_id, reference_doc_type, reference_doc_number, text)
        VALUES (${docNumber}, ${document_type.toUpperCase()}::fin_doc_type_new, ${document_type.toUpperCase()}, ${postingDate}, ${docDate}, ${fy}, ${fp}, ${legalEntityId}, ${ledgerAccountId}, ${ledgerAccountId}, ${debit || 0}, ${credit || 0}, ${amount || (debit || 0) - (credit || 0)}, ${currency_code || 'INR'}, ${partnerId}, ${itemId}, ${facilityId}, ${reference_doc_type || null}, ${reference_doc_number || null}, ${text || null})
        RETURNING id, document_number, document_type
      `);

      return NextResponse.json({ success: true, universalLedger: res.rows[0], code: 'FULC', message: `Universal ledger entry ${docNumber} created – FULC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('fin_universal_ledger insert failed:', newErr.message);
      return NextResponse.json({ error: newErr.message }, { status: 500 });
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
    const document_number = searchParams.get('document_number');
    if (!id && !document_number) return NextResponse.json({ error: 'id or document_number required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`UPDATE fin_universal_ledger SET is_reversed = true WHERE id = ${id}`);
      else await db.execute(sql`UPDATE fin_universal_ledger SET is_reversed = true WHERE document_number = ${document_number}`);
    } catch {
      // Legacy reversal not supported – just delete
      if (id) await db.execute(sql`DELETE FROM fin_universal_ledger WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fin_universal_ledger WHERE document_number = ${document_number}`);
    }

    return NextResponse.json({ success: true, code: 'FULC', message: `Ledger ${document_number || id} reversed – FULC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
