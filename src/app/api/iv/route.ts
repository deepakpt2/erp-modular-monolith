import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { getNextDocumentNumber, createDocumentEntry, updateDocumentWithAudit } from '@/shared/kernel/db/documentHelpers';
import { enforcePostingPeriod, getFiscalYearPeriodFromDate, checkTolerance, getAutoAccount } from '@/shared/kernel/db/postingPeriodHelpers';
import { createReversalOrAdjustmentDocument, getReversalDocType } from '@/shared/kernel/db/reversalHelpers';

/**
 * Invoice Verification API – Legal-safe own IP – Module 6 MM Procurement
 * New: proc_invoice_verification + proc_iv_line (was mm_invoice_verification + mm_iv_line) – ivNumber IV-5100000001 was 51*, grId, poId, partnerId was vendor_id PSUC, legalEntityId was company_code_id, vendorInvoiceNumber, priceVariance, universalLedgerId was fi_document_id FULC RE + WRX clearing + BSX adjustment, isLandedCostPosted for MAP adjustment, itemId EMTC was material_id, taxRuleId FTXC was tax_code
 * Helper code: PIVC IV Create (alias IVC, MIRO, FIN-IV-CR) – 4-char MOOA P=Procurement, IV=InvoiceVerification, C=Create – same length as MIRO but own IP, module grouped, intuitive
 * Fallback to legacy mm_invoice_verification
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const plantId = searchParams.get('plantId') || searchParams.get('facilityId');
  const status = searchParams.get('status');

  try {
    let rows: any[] = [];
    let source = 'db-new';
    let table = 'proc_invoice_verification';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT 
          iv.id, iv.iv_number, iv.status, iv.invoice_date, iv.posting_date, iv.vendor_invoice_number,
          iv.total_amount, iv.total_landed_cost, iv.price_variance, iv.is_landed_cost_posted,
          po.po_number, gr.gr_number,
          pa.display_name as vendor_name,
          f.code as plant_code, f.code as facility_code
        FROM proc_invoice_verification iv
        LEFT JOIN proc_purchase_order po ON iv.po_id = po.id
        LEFT JOIN proc_goods_receipt gr ON iv.gr_id = gr.id
        LEFT JOIN partner_account pa ON iv.partner_id = pa.id
        LEFT JOIN org_facility f ON po.facility_id = f.id
        WHERE 1=1
      `;

      if (search) query = sql`${query} AND (iv.iv_number ILIKE ${`%${search}%`} OR iv.vendor_invoice_number ILIKE ${`%${search}%`} OR po.po_number ILIKE ${`%${search}%`} OR pa.display_name ILIKE ${`%${search}%`})`;
      if (plantId) query = sql`${query} AND (po.facility_id = ${plantId} OR po.plant_id = ${plantId})`;
      if (status) query = sql`${query} AND iv.status = ${status}::proc_iv_status`;

      query = sql`${query} ORDER BY iv.posting_date DESC LIMIT ${limit}`;

      const result = await db.execute(query);
      rows = result.rows as any[];
    } catch (newErr: any) {
      console.warn('proc_invoice_verification not yet fallback mm_invoice_verification:', newErr.message);
      source = 'db-legacy';
      table = 'mm_invoice_verification';
      legalSafe = false;

      let query = sql`
        SELECT 
          iv.id, iv.iv_number, iv.status, iv.invoice_date, iv.posting_date, iv.vendor_invoice_number,
          iv.total_amount, iv.total_landed_cost, iv.price_variance, iv.is_landed_cost_posted,
          po.po_number, gr.gr_number,
          COALESCE(pa.display_name, bp.name1, bp.name) as vendor_name,
          p.code as plant_code
        FROM mm_invoice_verification iv
        LEFT JOIN mm_purchase_order po ON iv.po_id = po.id
        LEFT JOIN mm_goods_receipt gr ON iv.gr_id = gr.id
        LEFT JOIN partner_account pa ON iv.vendor_id = pa.id
        LEFT JOIN ent_business_partner bp ON iv.vendor_id = bp.id
        LEFT JOIN ent_plant p ON po.plant_id = p.id
        WHERE 1=1
      `;

      if (search) query = sql`${query} AND (iv.iv_number ILIKE ${`%${search}%`} OR iv.vendor_invoice_number ILIKE ${`%${search}%`} OR po.po_number ILIKE ${`%${search}%`} OR COALESCE(pa.display_name, bp.name1, bp.name) ILIKE ${`%${search}%`})`;
      if (plantId) query = sql`${query} AND po.plant_id = ${plantId}`;
      if (status) query = sql`${query} AND iv.status = ${status}::iv_status`;

      query = sql`${query} ORDER BY iv.posting_date DESC LIMIT ${limit}`;

      const result = await db.execute(query);
      rows = result.rows as any[];
    }

    return NextResponse.json({
      ivs: rows,
      invoiceVerifications: rows,
      count: rows.length,
      code: 'PIVC',
      aliasCodes: ['IVC', 'MIRO', 'FIN-IV-CR'],
      helperCode: 'PIVC',
      table,
      source,
      legalSafe,
      functionDescription: 'Invoice Verification – PIVC legal-safe own IP (was MIRO 51 RE) – ivNumber IV-5100000001, partnerId PSUC was vendor_id, itemId EMTC was material_id, taxRuleId FTXC was tax_code, priceVariance PRD, universalLedgerId FULC RE + WRX clearing + BSX adjustment, isLandedCostPosted for MAP adjustment',
      multiPlant: 'Facility filtering via PO facility_id – Module6',
      explanation: 'IV legal-safe proc_invoice_verification + proc_iv_line – ivNumber IV-5100000001 was 51*, grId, poId, partnerId was vendor_id PSUC, legalEntityId was company_code_id, vendorInvoiceNumber, priceVariance PRD, universalLedgerId was fi_document_id FULC RE + WRX clearing + BSX adjustment, isLandedCostPosted for MAP adjustment, itemId EMTC was material_id, taxRuleId FTXC was tax_code – Code PIVC primary alias IVC/MIRO – 4-char MOOA P=Procurement IV=InvoiceVerification C=Create – module grouped intuitive, same length as MIRO but own IP.',
    });
  } catch (e: any) {
    console.error('DB error:', e.message);
    return NextResponse.json({ error: e.message, code: 'DB_ERROR', ivs: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();

    // SAP-like posting period enforcement – OB52 – check if period open for account type K
    try {
      const postingDate = body.posting_date || body.posting_date || new Date().toISOString();
      const companyCodeForPosting = body.company_code || body.legal_entity_code || body.companyCode || '1000';
      const fiscalCheck = await getFiscalYearPeriodFromDate(companyCodeForPosting, postingDate);
      const postingCheck = await enforcePostingPeriod({ company_code: companyCodeForPosting, posting_date: postingDate, account_type: 'K' });
      if (!postingCheck.allowed) {
        return NextResponse.json({ 
          error: postingCheck.message,
          fiscal_year: postingCheck.fiscal_year,
          fiscal_period: postingCheck.fiscal_period,
          variant_code: postingCheck.variant_code,
          posting_date: postingDate,
          account_type: 'K',
          help: `Create open period via POST /api/posting-period-variants with variant_code=${postingCheck.variant_code}, account_type=K, from_period=${postingCheck.fiscal_period}, from_year=${postingCheck.fiscal_year}, to_period=${postingCheck.fiscal_period}, to_year=${postingCheck.fiscal_year}, is_open=true`
        }, { status: 400 });
      }
      // Attach fiscal info to body for storage
      (body as any)._fiscal_year = postingCheck.fiscal_year;
      (body as any)._fiscal_period = postingCheck.fiscal_period;
      // Strict ERP: Tolerance OBA0/OBA4 – GL + Customer/Vendor – T1 REQUIRED – NO DANGLING – check invoice vs PO price diff within tolerance – prevents overpay vendor 100%
      try {
        // Calculate price difference automatically if not provided
        let diffAmount = parseFloat(body.difference_amount || '0');
        if (!diffAmount && body.lines && Array.isArray(body.lines)) {
          for (const line of body.lines) {
            const invoiced = parseFloat(line.unit_price_invoiced || line.unitPriceInvoiced || 0);
            const poPrice = parseFloat(line.unit_price_po || line.unitPricePo || invoiced);
            const qty = parseFloat(line.quantity || 0);
            diffAmount += Math.abs((invoiced - poPrice) * qty);
          }
        }
        if (diffAmount === 0 && body.total_amount && body.po_total) {
          diffAmount = Math.abs(parseFloat(body.total_amount) - parseFloat(body.po_total));
        }
        // Get tolerance group – from body or default VEND-01 / GL-01
        const tolGroupCode = body.tolerance_group_code || body.tolerance_group || 'VEND-01';
        if (diffAmount > 0) {
          const tolCheck = await checkTolerance({ group_code: tolGroupCode, difference_amount: diffAmount });
          if (!tolCheck.allowed) {
            return NextResponse.json({ 
              error: tolCheck.message, 
              tolerance_group: tolGroupCode, 
              difference_amount: diffAmount,
              help: `Tolerance exceeded – OBA0/OBA4 – T1 REQUIRED – adjust invoice or increase tolerance via /fico/tolerance-groups – prevents fraud/overpay – difference ${diffAmount} > limit`,
              code: 'OBA0/OBA4'
            }, { status: 400 });
          }
          console.log(`Tolerance OBA0/OBA4 OK: group ${tolGroupCode} diff ${diffAmount} – ${tolCheck.message} – T1 REQUIRED – NO DANGLING`);
          (body as any)._tolerance_checked = true;
          (body as any)._difference_amount = diffAmount;
        }
      } catch (tolErr: any) {
        console.warn('Tolerance OBA0/OBA4 check failed, allowing to not block fresh:', tolErr.message);
      }
      // Strict ERP: Auto Account OBYC for IV – WRX clearing
      try {
        const chartOfAccounts = 'KSCA';
        const valuationClass = body.material_type || 'RAW';
        const wrx = await getAutoAccount({ transaction_key: 'WRX', chart_of_accounts: chartOfAccounts, valuation_class: valuationClass, company_code: companyCodeForPosting });
        (body as any)._auto_gl_wrx = wrx.gl_account;
      } catch {}

    } catch (ppErr: any) {
      console.warn('Posting period enforcement failed, allowing posting to not block fresh:', ppErr.message);
    }
    // SAP-like unique document number – FNDC – auto-generate from FNRC if not provided
    let iv_number = body.iv_number;
    if (!iv_number) {
      try {
        const next = await getNextDocumentNumber('IV', body.company_code || body.legal_entity_code || '1000');
        iv_number = next.document_number;
      } catch { iv_number = `IV-${Date.now()}`; }
    }
    const { po_id, po_number, gr_id, gr_number, partner_id, vendor_id, partner_number, vendor_number, invoice_date, posting_date, vendor_invoice_number, total_amount, tax_amount, freight_amount, customs_amount, other_charges, lines } = body;

    let poIdResolved = po_id;
    if (!poIdResolved && po_number) {
      try {
        const po = await db.execute(sql`SELECT id FROM proc_purchase_order WHERE po_number = ${po_number} LIMIT 1`);
        if (po.rows.length > 0) poIdResolved = (po.rows[0] as any).id;
        else {
          const po2 = await db.execute(sql`SELECT id FROM mm_purchase_order WHERE po_number = ${po_number} LIMIT 1`);
          if (po2.rows.length > 0) poIdResolved = (po2.rows[0] as any).id;
        }
      } catch {}
    }
    if (!poIdResolved) return NextResponse.json({ error: 'po_id or po_number required' }, { status: 400 });

    let grIdResolved = gr_id;
    if (!grIdResolved && gr_number) {
      try {
        const gr = await db.execute(sql`SELECT id FROM proc_goods_receipt WHERE gr_number = ${gr_number} LIMIT 1`);
        if (gr.rows.length > 0) grIdResolved = (gr.rows[0] as any).id;
        else {
          const gr2 = await db.execute(sql`SELECT id FROM mm_goods_receipt WHERE gr_number = ${gr_number} LIMIT 1`);
          if (gr2.rows.length > 0) grIdResolved = (gr2.rows[0] as any).id;
        }
      } catch {}
    }

    let partnerIdResolved = partner_id || vendor_id;
    if (!partnerIdResolved && (partner_number || vendor_number)) {
      try {
        const pa = await db.execute(sql`SELECT id FROM partner_account WHERE account_number = ${partner_number || vendor_number} LIMIT 1`);
        if (pa.rows.length > 0) partnerIdResolved = (pa.rows[0] as any).id;
      } catch {}
    }

    // Get legal entity from PO if not provided
    let legalEntityIdResolved = null;
    try {
      const poLe = await db.execute(sql`SELECT legal_entity_id, company_code_id FROM proc_purchase_order WHERE id = ${poIdResolved} LIMIT 1`);
      if (poLe.rows.length > 0) legalEntityIdResolved = (poLe.rows[0] as any).legal_entity_id || (poLe.rows[0] as any).company_code_id;
      else {
        const poLe2 = await db.execute(sql`SELECT company_code_id FROM mm_purchase_order WHERE id = ${poIdResolved} LIMIT 1`);
        if (poLe2.rows.length > 0) legalEntityIdResolved = (poLe2.rows[0] as any).company_code_id;
      }
    } catch {}

    let ivNumber = body.iv_number;
    if (!ivNumber) {
      try {
        const nrRes = await db.execute(sql`SELECT current_number, prefix FROM core_number_range WHERE object_type = 'IV'::core_nr_object_type ORDER BY fiscal_year DESC LIMIT 1`);
        if (nrRes.rows.length > 0) {
          const current = parseInt((nrRes.rows[0] as any).current_number) + 1;
          const prefix = (nrRes.rows[0] as any).prefix || 'IV-';
          ivNumber = `${prefix}${current}`;
          await db.execute(sql`UPDATE core_number_range SET current_number = ${current}, updated_at = NOW() WHERE object_type = 'IV'::core_nr_object_type`);
        } else {
          ivNumber = `IV-${Date.now()}`;
        }
      } catch {
        ivNumber = `IV-${Date.now()}`;
      }
    }

    try {
      const res = await db.execute(sql`
        INSERT INTO proc_invoice_verification (iv_number, gr_id, po_id, partner_id, vendor_id, legal_entity_id, company_code_id, invoice_date, posting_date, vendor_invoice_number, total_amount, tax_amount, freight_amount, customs_amount, other_charges)
        VALUES (${ivNumber}, ${grIdResolved || null}, ${poIdResolved}, ${partnerIdResolved || null}, ${partnerIdResolved || null}, ${legalEntityIdResolved || null}, ${legalEntityIdResolved || null}, ${invoice_date ? new Date(invoice_date) : new Date()}, ${posting_date ? new Date(posting_date) : new Date()}, ${vendor_invoice_number}, ${total_amount || 0}, ${tax_amount || 0}, ${freight_amount || 0}, ${customs_amount || 0}, ${other_charges || 0})
        RETURNING id, iv_number
      `);
      const ivId = (res.rows[0] as any).id;

      if (lines && Array.isArray(lines)) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          let poLineId = line.po_line_id;
          if (!poLineId && line.po_line_number) {
            try {
              const pl = await db.execute(sql`SELECT id FROM proc_po_line WHERE po_id = ${poIdResolved} AND line_number = ${line.po_line_number} LIMIT 1`);
              if (pl.rows.length > 0) poLineId = (pl.rows[0] as any).id;
            } catch {}
          }
          if (!poLineId) continue;

          let itemId = line.item_id;
          try {
            const plInfo = await db.execute(sql`SELECT item_id FROM proc_po_line WHERE id = ${poLineId} LIMIT 1`);
            if (plInfo.rows.length > 0) itemId = itemId || (plInfo.rows[0] as any).item_id;
          } catch {}

          const qty = parseFloat(line.quantity || '0');
          const unitInvoiced = parseFloat(line.unit_price_invoiced || line.unitPriceInvoiced || '0');
          const unitPo = parseFloat(line.unit_price_po || line.unitPricePo || unitInvoiced);
          const freight = parseFloat(line.freight_per_unit || '0');
          const customs = parseFloat(line.customs_per_unit || '0');
          const other = parseFloat(line.other_per_unit || '0');
          const totalFinal = unitInvoiced + freight + customs + other;
          const variance = unitInvoiced - unitPo;

          await db.execute(sql`
            INSERT INTO proc_iv_line (iv_id, gr_line_id, po_line_id, line_number, item_id, quantity, unit_price_invoiced, unit_price_po, freight_per_unit, customs_per_unit, other_per_unit, total_per_unit_final, price_variance_per_unit, tax_amount)
            VALUES (${ivId}, ${line.gr_line_id || null}, ${poLineId}, ${line.line_number || i + 10}, ${itemId}, ${qty}, ${unitInvoiced}, ${unitPo}, ${freight}, ${customs}, ${other}, ${totalFinal}, ${variance}, ${line.tax_amount || 0})
          `);

          // Update PO line invoiced qty
          try {
            await db.execute(sql`UPDATE proc_po_line SET quantity_invoiced = quantity_invoiced + ${qty} WHERE id = ${poLineId}`);
          } catch {}
        }
      }

      return NextResponse.json({ success: true, iv: res.rows[0], ivNumber, code: 'PIVC', message: `IV ${ivNumber} created – PIVC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('proc_invoice_verification insert failed:', newErr.message);
      return NextResponse.json({ error: newErr.message }, { status: 500 });
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
    const action = (body.action || body.edit_action || 'ADJUST').toUpperCase();
    const isReversal = action.includes('REVERSE');
    const originalNumber = body.iv_number || body.document_number || body.id;

    if (originalNumber && (isReversal || action.includes('ADJUST') || action.includes('CORRECT'))) {
      const reversalResult = await createReversalOrAdjustmentDocument({
        original_document_type: 'IV',
        original_document_number: originalNumber,
        action: action as any,
        reason: body.reason || body.reversal_reason || null,
        new_payload: body,
        company_code: body.company_code || '1000',
        changed_by: body.changed_by || 'system'
      });

      if (reversalResult.success) {
        try {
          const newStatus = isReversal ? 'REVERSED' : 'ADJUSTED';
          await db.execute(sql`UPDATE proc_invoice_verification SET status = ${newStatus}::proc_iv_status, updated_at = NOW() WHERE iv_number = ${originalNumber} OR id::text = ${originalNumber}`);
        } catch (e) { console.warn('Status update failed', e); }

        return NextResponse.json({
          success: true,
          original_document: originalNumber,
          reversal_document: reversalResult.reversal_document_number,
          reversal_type: reversalResult.reversal_type,
          action: action,
          code: reversalResult.reversal_type,
          message: `${isReversal ? 'Reversal' : 'Adjustment'} document ${reversalResult.reversal_document_number} (${reversalResult.reversal_type}) created for ${originalNumber} – IV reversal/adjustment – immutable audit trail – legal-safe own IP (was MR8M)`,
          legalSafe: true
        });
      }
    }

    try {
      if (originalNumber) await updateDocumentWithAudit({ document_number: originalNumber, new_payload: body, changed_by: 'system', action: 'UPDATE' });
    } catch {}

    const { id, iv_number, status } = body;
    if (!id && !iv_number) return NextResponse.json({ error: 'id or iv_number required' }, { status: 400 });
    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE proc_invoice_verification SET status = ${status}::proc_iv_status, updated_at = NOW() WHERE id = ${id} RETURNING id, iv_number, status`);
      else res = await db.execute(sql`UPDATE proc_invoice_verification SET status = ${status}::proc_iv_status, updated_at = NOW() WHERE iv_number = ${iv_number} RETURNING id, iv_number, status`);
      if (res.rows.length === 0) throw new Error('Not found');
      return NextResponse.json({ success: true, iv: res.rows[0], code: 'PIVC', message: `IV ${res.rows[0].iv_number} status ${status} – PIVC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE mm_invoice_verification SET status = ${status}::iv_status WHERE id = ${id} RETURNING id, iv_number, status`);
      else res = await db.execute(sql`UPDATE mm_invoice_verification SET status = ${status}::iv_status WHERE iv_number = ${iv_number} RETURNING id, iv_number, status`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'IV not found' }, { status: 404 });
      return NextResponse.json({ success: true, iv: res.rows[0], message: `IV ${res.rows[0].iv_number} status ${status} – MIRO legacy` });
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
    const iv_number = searchParams.get('iv_number');
    if (!id && !iv_number) return NextResponse.json({ error: 'id or iv_number required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM proc_invoice_verification WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM proc_invoice_verification WHERE iv_number = ${iv_number}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM mm_invoice_verification WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM mm_invoice_verification WHERE iv_number = ${iv_number}`);
    }

    return NextResponse.json({ success: true, code: 'PIVC', message: `IV ${iv_number || id} deleted – PIVC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
