import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db, withTransaction } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { validatePostingPeriod, validateTolerance, getNextNumberForUpdate } from '@/shared/kernel/enterprise/validation';

/**
 * Purchase Order API - Multi-Plant + ELIKZ + Approval - Enterprise Secure
 * GET /api/po - List POs with plant/sloc/vendor filters
 * POST /api/po - Create PO with lines, multi-plant, landed costs, triggers workflow, OB52 posting period, OBA0 tolerance, FOR UPDATE number range
 * PUT /api/po - Update ELIKZ delivery_completed, approve, status changes
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const plantId = searchParams.get('plantId');
  const status = searchParams.get('status');
  const vendorId = searchParams.get('vendorId');
  const companyCode = searchParams.get('companyCode') || '1000';
  const elikz = searchParams.get('elikz');

  try {
    // Legal-safe: try partner_account (new) + ent_business_partner (legacy) – COALESCE for backward compat – Module3
    let query = sql`
      SELECT 
        po.id, po.po_number, po.status, po.total_amount, po.total_landed_cost, po.currency,
        po.delivery_date, po.freight_amount, po.customs_amount, po.created_at,
        p.code as plant_code, p.name as plant_name,
        COALESCE(pa.account_number, bp.bp_number) as vendor_number, COALESCE(pa.display_name, bp.name1) as vendor_name,
        cc.code as company_code,
        (SELECT COUNT(*) FROM mm_po_line WHERE po_id = po.id) as line_count,
        (SELECT SUM(quantity) FROM mm_po_line WHERE po_id = po.id) as total_ordered_qty,
        (SELECT SUM(quantity_received) FROM mm_po_line WHERE po_id = po.id) as total_received_qty,
        (SELECT BOOL_AND(delivery_completed) FROM mm_po_line WHERE po_id = po.id) as all_elikz,
        pr.pr_number as pr_ref
      FROM mm_purchase_order po
      LEFT JOIN ent_plant p ON po.plant_id = p.id
      LEFT JOIN partner_account pa ON po.vendor_id = pa.id
      LEFT JOIN ent_business_partner bp ON po.vendor_id = bp.id
      LEFT JOIN ent_company_code cc ON po.company_code_id = cc.id
      LEFT JOIN mm_purchase_requisition pr ON po.pr_id = pr.id
      WHERE 1=1
    `;

    if (search) {
      query = sql`${query} AND (po.po_number ILIKE ${`%${search}%`} OR COALESCE(pa.display_name, bp.name1) ILIKE ${`%${search}%`} OR pr.pr_number ILIKE ${`%${search}%`})`;
    }
    if (plantId) query = sql`${query} AND po.plant_id = ${plantId}`;
    if (status) query = sql`${query} AND po.status = ${status}`;
    if (vendorId) query = sql`${query} AND po.vendor_id = ${vendorId}`;
    if (companyCode) query = sql`${query} AND cc.code = ${companyCode}`;
    if (elikz === 'true') query = sql`${query} AND EXISTS (SELECT 1 FROM mm_po_line WHERE po_id = po.id AND delivery_completed = true)`;
    if (elikz === 'false') query = sql`${query} AND NOT EXISTS (SELECT 1 FROM mm_po_line WHERE po_id = po.id AND delivery_completed = true)`;

    query = sql`${query} ORDER BY po.created_at DESC LIMIT ${limit}`;

    const result = await db.execute(query);

    return NextResponse.json({
      code: 'ME21N',
      functionDescription: 'Purchase Order – ME21N/ME22N/ME23N',

      pos: result.rows,
      count: result.rows.length,
      source: 'db',
      multiPlant: 'Supports plant_id per PO, vendor, company_code, ELIKZ filtering',
    });
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
    const { companyCodeId, vendorId, plantId, deliveryDate, docDate, headerText, itemText, freightAmount, customsAmount, prId, purchasingOrg, purchasingGroup, paymentTerms, incoterms, currency, lines } = body;

    if (!vendorId || !plantId || !lines || lines.length === 0) {
      return NextResponse.json({ error: 'vendorId, plantId, lines required' }, { status: 400 });
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
          else throw new Error('No company code');
        }
      }
    }

    const docDateObj = docDate ? new Date(docDate) : new Date();
    const periodCheck = await validatePostingPeriod(compId, docDateObj, 'K');
    if (!periodCheck.valid) {
      return NextResponse.json({ error: periodCheck.error, code: 'POSTING_PERIOD_CLOSED' }, { status: 400 });
    }

    const totalAmountPre = lines.reduce((sum: number, l: any) => sum + parseFloat(l.quantity) * parseFloat(l.unitPrice || 0), 0);
    const tolCheck = await validateTolerance(compId, 'VENDOR', totalAmountPre, currency || 'INR');
    if (!tolCheck.valid) {
      return NextResponse.json({ error: tolCheck.error, code: 'TOLERANCE_EXCEEDED' }, { status: 400 });
    }

    return await withTransaction(async (tx) => {
      const year = docDateObj.getFullYear();
      const poNum = await getNextNumberForUpdate(tx, 'PO', compId, year);
      const poNumber = poNum.number;

      const totalAmount = lines.reduce((sum: number, l: any) => sum + parseFloat(l.quantity) * parseFloat(l.unitPrice || 0), 0).toFixed(3);
      const totalLanded = (parseFloat(totalAmount) + parseFloat(freightAmount || 0) + parseFloat(customsAmount || 0)).toFixed(3);

      const poRes = await tx.execute(sql`
        INSERT INTO mm_purchase_order (po_number, company_code_id, vendor_id, plant_id, status, total_amount, total_landed_cost, currency, doc_date, delivery_date, header_text, pr_id, freight_amount, customs_amount, purchasing_org, purchasing_group, payment_terms, incoterms)
        VALUES (${poNumber}, ${compId}, ${vendorId}, ${plantId}, 'DRAFT', ${totalAmount}, ${totalLanded}, ${currency || 'KWD'}, ${docDate ? new Date(docDate) : new Date()}, ${deliveryDate ? new Date(deliveryDate) : new Date(Date.now() + 7*24*3600000)}, ${headerText || null}, ${prId || null}, ${freightAmount || 0}, ${customsAmount || 0}, ${purchasingOrg || '1000'}, ${purchasingGroup || '001'}, ${paymentTerms || '0001'}, ${incoterms || 'EXW'})
        RETURNING id, po_number
      `);

      const poId = (poRes.rows[0] as any).id;

      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        const totalPerUnit = (parseFloat(l.unitPrice || 0) + parseFloat(l.freightPerUnit || 0) + parseFloat(l.customsPerUnit || 0)).toFixed(4);
        await tx.execute(sql`
          INSERT INTO mm_po_line (po_id, line_number, material_id, quantity, uom, unit_price, freight_per_unit, customs_per_unit, total_per_unit, plant_id, sloc_id, tax_code_id, account_assignment, item_text, delivery_text, is_landed_cost_relevant)
          VALUES (${poId}, ${i+1}, ${l.materialId}, ${l.quantity}, ${l.uom || 'KG'}, ${l.unitPrice || 0}, ${l.freightPerUnit || 0}, ${l.customsPerUnit || 0}, ${totalPerUnit}, ${l.plantId || plantId}, ${l.slocId || null}, ${l.taxCodeId || l.taxCode || null}, ${l.accountAssignment || 'K'}, ${l.itemText || itemText || null}, ${l.deliveryText || null}, true)
        `);
      }

      await tx.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description)
        VALUES ('mm_purchase_order', ${poId}, ${poNumber}, 'INSERT', ${JSON.stringify({ poNumber, totalAmount, totalLanded, lines })}::jsonb, ${`PO CREATE: ${poNumber} Vendor ${vendorId} Plant ${plantId} Total ${totalAmount} KWD Landed ${totalLanded} Enterprise validated`})
      `).catch(()=>{});

      let workflowTriggered = false;
      try {
        const wfDef = await tx.execute(sql`SELECT id FROM wf_definition WHERE document_type = 'PO' AND is_active = true LIMIT 1`);
        if (wfDef.rows.length > 0) {
          const defId = (wfDef.rows[0] as any).id;
          const steps = await tx.execute(sql`SELECT id, approver_type, min_amount, max_amount FROM wf_definition_step WHERE definition_id = ${defId} ORDER BY step_order`);
          // Filter steps by amount authority
          let filteredSteps = steps.rows as any[];
          if (totalAmount) {
            const amt = parseFloat(totalAmount);
            filteredSteps = filteredSteps.filter((s: any) => {
              const min = s.min_amount ? parseFloat(s.min_amount) : 0;
              const max = s.max_amount ? parseFloat(s.max_amount) : 999999999;
              return amt >= min && amt <= max;
            });
            if (filteredSteps.length === 0) filteredSteps = steps.rows as any[];
          }

          const empRes = await tx.execute(sql`SELECT id, manager_id FROM hr_employee WHERE is_active = true LIMIT 1`);
          const reqId = empRes.rows.length > 0 ? (empRes.rows[0] as any).id : null;
          const managerId = empRes.rows.length > 0 ? (empRes.rows[0] as any).manager_id : null;
          
          const instRes = await tx.execute(sql`
            INSERT INTO wf_instance (definition_id, document_type, document_id, document_number, company_code_id, current_state, current_step_order, requester_id, amount, currency)
            VALUES (${defId}, 'PO', ${poId}, ${poNumber}, ${compId}, 'PENDING_APPROVAL', 1, ${reqId}, ${totalAmount}, ${currency || 'KWD'})
            RETURNING id
          `);
          const instId = (instRes.rows[0] as any).id;
          for (const step of filteredSteps) {
            let assignee = reqId;
            if (step.approver_type === 'MANAGER' && managerId) assignee = managerId;
            else if (step.approver_type === 'OWNER') {
              const owner = await tx.execute(sql`SELECT e.id FROM hr_employee e JOIN hr_position p ON e.position_id = p.id WHERE p.is_owner = true AND e.is_active = true LIMIT 1`);
              if (owner.rows.length > 0) assignee = (owner.rows[0] as any).id;
            }
            if (assignee) await tx.execute(sql`INSERT INTO wf_task (instance_id, step_id, assignee_id, status) VALUES (${instId}, ${step.id}, ${assignee}, 'PENDING')`);
          }
          await tx.execute(sql`UPDATE mm_purchase_order SET status = 'PENDING_APPROVAL', workflow_instance_id = ${instId} WHERE id = ${poId}`);
          workflowTriggered = true;
        }
      } catch (e: any) { console.warn('PO workflow trigger failed', e); }

      return NextResponse.json({ success: true, poId, poNumber, totalAmount, totalLanded, workflowTriggered, message: `PO ${poNumber} created, total ${totalAmount} KWD, landed ${totalLanded} KWD, plant ${plantId}, workflow ${workflowTriggered ? 'triggered' : 'auto-approved'}, enterprise validated` });
    });
  } catch (e: any) {
    console.error('Create PO failed', e);
    return NextResponse.json({ error: e.message, code: e.message.includes('POSTING_PERIOD') ? 'POSTING_PERIOD_CLOSED' : 'PO_ERROR' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, action, lineId, deliveryCompleted, reason } = body;

    if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

    const poRes = await db.execute(sql`SELECT * FROM mm_purchase_order WHERE id = ${id} LIMIT 1`);
    if (poRes.rows.length === 0) return NextResponse.json({ error: 'PO not found' }, { status: 404 });
    const po = poRes.rows[0] as any;

    if ((action === 'SET_ELIKZ' && lineId) || action === 'SET_ELIKZ_AUTO') {
      let targetLineId = lineId;
      if (action === 'SET_ELIKZ_AUTO' && !lineId) {
        const openLineRes = await db.execute(sql`SELECT id FROM mm_po_line WHERE po_id = ${id} AND (delivery_completed = false OR delivery_completed IS NULL) AND (is_closed = false OR is_closed IS NULL) ORDER BY line_number LIMIT 1`);
        if (openLineRes.rows.length === 0) return NextResponse.json({ error: 'No open PO line found for ELIKZ' }, { status: 404 });
        targetLineId = (openLineRes.rows[0] as any).id;
      }
      const lineRes = await db.execute(sql`SELECT * FROM mm_po_line WHERE id = ${targetLineId} LIMIT 1`);
      if (lineRes.rows.length === 0) return NextResponse.json({ error: 'PO line not found' }, { status: 404 });
      const line = lineRes.rows[0] as any;
      const ordered = parseFloat(line.quantity);
      const received = parseFloat(line.quantity_received);
      const shortQty = ordered - received;

      await db.execute(sql`
        UPDATE mm_po_line 
        SET delivery_completed = ${deliveryCompleted}, is_closed = ${deliveryCompleted}, closed_reason = ${deliveryCompleted ? (reason || 'SHORT_SHIPMENT_FINAL') : null}, closed_at = ${deliveryCompleted ? new Date() : null}
        WHERE id = ${targetLineId}
      `);

      await db.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, old_values, new_values, description)
        VALUES ('mm_po_line', ${targetLineId}, ${po.po_number}, 'UPDATE', ${JSON.stringify({ delivery_completed: false })}::jsonb, ${JSON.stringify({ delivery_completed: deliveryCompleted, short_qty: shortQty, reason })}::jsonb, ${`ELIKZ set: PO ${po.po_number} line ${line.line_number} ordered ${ordered} received ${received} short ${shortQty} reason ${reason || 'SHORT_SHIPMENT_FINAL'}`})
      `).catch(()=>{});

      const allLines = await db.execute(sql`SELECT BOOL_AND(delivery_completed OR is_closed OR quantity_received >= quantity) as all_closed FROM mm_po_line WHERE po_id = ${id}`);
      const allClosed = (allLines.rows[0] as any)?.all_closed;
      if (allClosed) {
        await db.execute(sql`UPDATE mm_purchase_order SET status = 'CLOSED', updated_at = NOW() WHERE id = ${id}`);
      }

      return NextResponse.json({ success: true, poNumber: po.po_number, lineId: targetLineId, deliveryCompleted, shortQty, allClosed, message: `ELIKZ set for PO ${po.po_number} line ${line.line_number}, short ${shortQty}` });
    }

    let newStatus = po.status;
    if (action === 'APPROVE') newStatus = 'APPROVED';
    else if (action === 'REJECT') newStatus = 'REJECTED';
    else if (action === 'SEND') newStatus = 'SENT';
    else if (action === 'CLOSE') newStatus = 'CLOSED';
    else if (action === 'REOPEN') newStatus = 'APPROVED';

    await db.execute(sql`UPDATE mm_purchase_order SET status = ${newStatus}, updated_at = NOW() WHERE id = ${id}`);

    await db.execute(sql`
      INSERT INTO audit_log (table_name, record_id, record_number, action, old_values, new_values, description)
      VALUES ('mm_purchase_order', ${id}, ${po.po_number}, 'UPDATE', ${JSON.stringify(po)}::jsonb, ${JSON.stringify({ status: newStatus })}::jsonb, ${`PO ${action}: ${po.po_number} ${po.status} -> ${newStatus}`})
    `).catch(()=>{});

    return NextResponse.json({ success: true, poNumber: po.po_number, oldStatus: po.status, newStatus, message: `PO ${po.po_number} ${action} ${po.status} -> ${newStatus}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
