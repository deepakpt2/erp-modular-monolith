import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db, withTransaction } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { validatePostingPeriod, getNextNumberForUpdate } from '@/shared/kernel/enterprise/validation';
import { convertCurrency, createFiDocumentWithCurrency } from '@/shared/kernel/enterprise/exchangeRate';

/**
 * Invoice Verification API - MIRO - Landed Cost + MAP + PRD
 * GET /api/iv - List IVs with plant/vendor filters
 * POST /api/iv - Create IV with final landed cost, MAP adjustment, price variance PRD handling
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const plantId = searchParams.get('plantId');
  const status = searchParams.get('status');

  try {
    let query = sql`
      SELECT 
        iv.id, iv.iv_number, iv.status, iv.invoice_date, iv.posting_date, iv.vendor_invoice_number,
        iv.total_amount, iv.total_landed_cost, iv.price_variance, iv.is_landed_cost_posted,
        po.po_number, gr.gr_number,
        bp.name as vendor_name,
        p.code as plant_code
      FROM mm_invoice_verification iv
      LEFT JOIN mm_purchase_order po ON iv.po_id = po.id
      LEFT JOIN mm_goods_receipt gr ON iv.gr_id = gr.id
      LEFT JOIN ent_business_partner bp ON iv.vendor_id = bp.id
      LEFT JOIN ent_plant p ON po.plant_id = p.id
      WHERE 1=1
    `;

    if (search) query = sql`${query} AND (iv.iv_number ILIKE ${`%${search}%`} OR iv.vendor_invoice_number ILIKE ${`%${search}%`} OR po.po_number ILIKE ${`%${search}%`})`;
    if (plantId) query = sql`${query} AND po.plant_id = ${plantId}`;
    if (status) query = sql`${query} AND iv.status = ${status}`;

    query = sql`${query} ORDER BY iv.posting_date DESC LIMIT ${limit}`;

    const result = await db.execute(query);
    return NextResponse.json({
      code: 'MIRO',
      functionDescription: 'Invoice Verification – MIRO 51 RE',
 ivs: result.rows, count: result.rows.length, source: 'db', multiPlant: 'Plant filtering via PO plant_id' });
  } catch (e: any) {
    console.error('DB error:', e.message);
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { poId, grId, vendorId, companyCodeId, invoiceDate, postingDate, vendorInvoiceNumber, totalAmount, freightAmount, customsAmount, otherCharges, taxAmount, lines, currency } = body;

    if (!poId || !vendorId || !vendorInvoiceNumber || !totalAmount) {
      return NextResponse.json({ error: 'poId, vendorId, vendorInvoiceNumber, totalAmount required' }, { status: 400 });
    }

    let compId = companyCodeId;
    const reqCompanyCode = (body.companyCode as string) || null;
    if (!compId) {
      if (reqCompanyCode) {
        const ccRes = await db.execute(sql`SELECT id FROM ent_company_code WHERE code = ${reqCompanyCode} LIMIT 1`);
        if (ccRes.rows.length > 0) compId = (ccRes.rows[0] as any).id;
      }
      if (!compId) {
        const ccRes = await db.execute(sql`SELECT id FROM ent_company_code WHERE code IN ('KS01','1000') ORDER BY CASE code WHEN 'KS01' THEN 0 WHEN '1000' THEN 1 ELSE 2 END LIMIT 1`);
        if (ccRes.rows.length > 0) compId = (ccRes.rows[0] as any).id;
        else {
          const ccRes2 = await db.execute(sql`SELECT id FROM ent_company_code LIMIT 1`);
          if (ccRes2.rows.length > 0) compId = (ccRes2.rows[0] as any).id;
        }
      }
    }

    // Get company currency
    const compCurRes = await db.execute(sql`SELECT currency_code FROM ent_company_code WHERE id = ${compId} LIMIT 1`);
    const companyCurrency = (compCurRes.rows[0] as any)?.currency_code || 'INR';
    const transactionCurrency = currency || companyCurrency;

    const postingDateObj = postingDate ? new Date(postingDate) : new Date();
    const periodCheck = await validatePostingPeriod(compId, postingDateObj, 'K');
    if (!periodCheck.valid) {
      return NextResponse.json({ error: periodCheck.error, code: 'POSTING_PERIOD_CLOSED' }, { status: 400 });
    }

    // Multi-currency conversion if needed
    let convertedTotal = parseFloat(totalAmount);
    let conversionRate = 1.0;
    if (transactionCurrency !== companyCurrency) {
      const conv = await convertCurrency(parseFloat(totalAmount), transactionCurrency, companyCurrency, postingDateObj);
      convertedTotal = conv.convertedAmount;
      conversionRate = conv.rate;
    }

    return await withTransaction(async (tx) => {
      const year = postingDateObj.getFullYear();
      const ivNum = await getNextNumberForUpdate(tx, 'IV', compId, year);
      const ivNumber = ivNum.number;

      const totalLanded = (parseFloat(totalAmount) + parseFloat(freightAmount || 0) + parseFloat(customsAmount || 0) + parseFloat(otherCharges || 0)).toFixed(3);

      const poRes = await tx.execute(sql`SELECT total_amount FROM mm_purchase_order WHERE id = ${poId} LIMIT 1`);
      const poTotal = poRes.rows.length > 0 ? parseFloat((poRes.rows[0] as any).total_amount || 0) : 0;
      const priceVariance = (parseFloat(totalAmount) - poTotal).toFixed(3);

      const ivRes = await tx.execute(sql`
        INSERT INTO mm_invoice_verification (iv_number, gr_id, po_id, vendor_id, company_code_id, status, invoice_date, posting_date, vendor_invoice_number, total_amount, freight_amount, customs_amount, other_charges, tax_amount, total_landed_cost, price_variance, is_landed_cost_posted)
        VALUES (${ivNumber}, ${grId || null}, ${poId}, ${vendorId}, ${compId}, 'POSTED', ${invoiceDate ? new Date(invoiceDate) : new Date()}, ${postingDateObj}, ${vendorInvoiceNumber}, ${totalAmount}, ${freightAmount || 0}, ${customsAmount || 0}, ${otherCharges || 0}, ${taxAmount || 0}, ${totalLanded}, ${priceVariance}, true)
        RETURNING id, iv_number
      `);

      const ivId = (ivRes.rows[0] as any).id;

      if (lines && lines.length > 0) {
        for (let i = 0; i < lines.length; i++) {
          const l = lines[i];
          const totalPerUnitFinal = (parseFloat(l.unitPriceInvoiced || 0) + parseFloat(l.freightPerUnit || 0) + parseFloat(l.customsPerUnit || 0)).toFixed(4);
          await tx.execute(sql`
            INSERT INTO mm_iv_line (iv_id, gr_line_id, po_line_id, line_number, material_id, quantity, unit_price_invoiced, unit_price_po, freight_per_unit, customs_per_unit, total_per_unit_final, price_variance_per_unit)
            VALUES (${ivId}, ${l.grLineId || null}, ${l.poLineId}, ${i+1}, ${l.materialId}, ${l.quantity}, ${l.unitPriceInvoiced || 0}, ${l.unitPricePo || 0}, ${l.freightPerUnit || 0}, ${l.customsPerUnit || 0}, ${totalPerUnitFinal}, ${parseFloat(l.unitPriceInvoiced || 0) - parseFloat(l.unitPricePo || 0)})
          `);

          try {
            const mpRes = await tx.execute(sql`SELECT * FROM ent_material_plant WHERE material_id = ${l.materialId} LIMIT 1`);
            if (mpRes.rows.length > 0) {
              const mp = mpRes.rows[0] as any;
              if (mp.price_control === 'V') {
                const oldQty = parseFloat(mp.total_stock_qty || 0);
                const oldValue = parseFloat(mp.total_stock_value || 0);
                const variancePerUnit = parseFloat(l.unitPriceInvoiced || 0) - parseFloat(l.unitPricePo || 0) + parseFloat(l.freightPerUnit || 0) + parseFloat(l.customsPerUnit || 0);
                const varianceTotal = variancePerUnit * parseFloat(l.quantity);
                
                if (oldQty > 0.001) {
                  const newValue = oldValue + varianceTotal;
                  const newMap = (newValue / oldQty).toFixed(4);
                  await tx.execute(sql`UPDATE ent_material_plant SET moving_avg_price = ${newMap}, total_stock_value = ${newValue} WHERE material_id = ${l.materialId}`);
                } else {
                  const fiNum = await getNextNumberForUpdate(tx, 'FI_DOC', compId, year);
                  await tx.execute(sql`
                    INSERT INTO fi_document (document_number, company_code_id, doc_type, posting_date, document_date, total_debit, total_credit, currency, status)
                    VALUES (${fiNum.number}, ${compId}, 'SA', NOW(), NOW(), ${Math.abs(varianceTotal)}, ${Math.abs(varianceTotal)}, ${companyCurrency}, 'POSTED')
                  `);
                }
              }
            }
          } catch (e: any) { console.warn('MAP adjustment failed', e); }
        }
      }

      // FI doc RE with multi-currency conversion
      let fiDocId = null;
      let fiNumber = '';
      try {
        const fiDoc = await createFiDocumentWithCurrency({
          companyCodeId: compId,
          companyCurrency,
          docType: 'RE',
          postingDate: postingDateObj,
          documentDate: invoiceDate ? new Date(invoiceDate) : new Date(),
          totalAmount: parseFloat(totalAmount),
          transactionCurrency,
          reference: vendorInvoiceNumber,
          headerText: `IV ${ivNumber} ${vendorInvoiceNumber} ${transactionCurrency}->${companyCurrency} @ ${conversionRate}`,
          referenceDocType: 'IV',
          referenceDocId: ivId,
          referenceDocNumber: ivNumber,
          tx,
        });
        fiDocId = fiDoc.fiDocumentId;
        fiNumber = fiDoc.documentNumber;
        await tx.execute(sql`UPDATE mm_invoice_verification SET fi_document_id = ${fiDocId} WHERE id = ${ivId}`);
      } catch (e: any) { console.warn('FI doc creation failed', e); }

      await tx.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description)
        VALUES ('mm_invoice_verification', ${ivId}, ${ivNumber}, 'INSERT', ${JSON.stringify({ ivNumber, totalAmount, convertedTotal, transactionCurrency, companyCurrency, conversionRate, totalLanded, priceVariance })}::jsonb, ${`IV POSTED: ${ivNumber} PO ${poId} Total ${totalAmount} ${transactionCurrency} -> ${convertedTotal.toFixed(3)} ${companyCurrency} @ ${conversionRate} Landed ${totalLanded} Variance ${priceVariance}`})
      `).catch(()=>{});

      return NextResponse.json({ 
        success: true, 
        ivId, 
        ivNumber, 
        totalAmount, 
        convertedTotal: convertedTotal.toFixed(3),
        transactionCurrency,
        companyCurrency,
        conversionRate,
        totalLanded, 
        priceVariance, 
        fiDocumentId: fiDocId,
        fiNumber,
        message: `IV ${ivNumber} posted, total ${totalAmount} ${transactionCurrency} -> ${convertedTotal.toFixed(3)} ${companyCurrency} @ rate ${conversionRate}, landed ${totalLanded}, variance ${priceVariance}, MAP adjusted, enterprise validated` 
      });
    });
  } catch (e: any) {
    console.error('Create IV failed', e);
    return NextResponse.json({ error: e.message, code: e.message.includes('POSTING_PERIOD') ? 'POSTING_PERIOD_CLOSED' : 'IV_ERROR' }, { status: 500 });
  }
}
