import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Purchase Requisition API - Multi-Plant Support
 * GET /api/pr - List PRs with plant/sloc filters
 * POST /api/pr - Create PR with lines, triggers workflow if amount > threshold
 * PUT /api/pr - Update status, convert to PO
 * 
 * Tables: mm_purchase_requisition, mm_pr_line
 * Multi-plant: plant_id, sloc_id per line, company_code_id
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const plantId = searchParams.get('plantId');
  const status = searchParams.get('status');
  const companyCode = searchParams.get('companyCode') || '1000';

  try {
    let query = sql`
      SELECT 
        pr.id, pr.pr_number, pr.status, pr.total_amount, pr.currency, pr.required_date, pr.created_at,
        p.code as plant_code, p.name as plant_name,
        sloc.code as sloc_code, sloc.name as sloc_name,
        e.employee_number as requester_employee_number,
        e.first_name as requester_first_name,
        m.material_number, m.description as material_description,
        prl.quantity, prl.uom, prl.estimated_price,
        prl.plant_id, prl.sloc_id, prl.is_converted, prl.po_id,
        cc.code as company_code
      FROM mm_purchase_requisition pr
      LEFT JOIN ent_plant p ON pr.plant_id = p.id
      LEFT JOIN hr_employee e ON pr.requester_id = e.id
      LEFT JOIN ent_company_code cc ON pr.company_code_id = cc.id
      LEFT JOIN mm_pr_line prl ON prl.pr_id = pr.id
      LEFT JOIN ent_material_master m ON prl.material_id = m.id
      LEFT JOIN ent_storage_location sloc ON prl.sloc_id = sloc.id
      WHERE 1=1
    `;

    if (search) {
      query = sql`${query} AND (pr.pr_number ILIKE ${`%${search}%`} OR m.material_number ILIKE ${`%${search}%`} OR m.description ILIKE ${`%${search}%`})`;
    }
    if (plantId) {
      query = sql`${query} AND pr.plant_id = ${plantId}`;
    }
    if (status) {
      query = sql`${query} AND pr.status = ${status}`;
    }
    if (companyCode) {
      query = sql`${query} AND cc.code = ${companyCode}`;
    }

    query = sql`${query} ORDER BY pr.created_at DESC LIMIT ${limit}`;

    const result = await db.execute(query);

    return NextResponse.json({
      code: 'ME51N',
      functionDescription: 'Purchase Requisition – ME51N',

      prs: result.rows,
      count: result.rows.length,
      source: 'db',
      multiPlant: 'Supports plant_id, sloc_id per line, company_code_id filtering',
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
    const { companyCodeId, plantId, requesterId, requiredDate, headerText, itemText, docDate, purchasingOrg, purchasingGroup, lines } = body;
    // lines: [{materialId, quantity, uom, estimatedPrice, plantId, slocId, deliveryDate, accountAssignment, costCenter, glAccount, taxCode, itemText}]

    if (!plantId || !lines || lines.length === 0) {
      return NextResponse.json({ error: 'plantId and lines required' }, { status: 400 });
    }

    // Get company code if not provided - support KS01 and 1000
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
          else throw new Error('No company code found');
        }
      }
    }

    let reqId = requesterId;
    if (!reqId) {
      const empRes = await db.execute(sql`SELECT id FROM hr_employee WHERE is_active = true LIMIT 1`);
      if (empRes.rows.length > 0) reqId = (empRes.rows[0] as any).id;
    }

    // Generate PR number from number range
    const numRes = await db.execute(sql`
      SELECT current_number, prefix FROM ent_number_range WHERE object_type = 'PR' AND is_active = true LIMIT 1
    `);
    let prNumber = `PR${1000000000 + Date.now() % 1000000000}`;
    if (numRes.rows.length > 0) {
      const nr = numRes.rows[0] as any;
      const current = parseInt(nr.current_number) + 1;
      prNumber = `${nr.prefix || 'PR'}${current}`;
      await db.execute(sql`UPDATE ent_number_range SET current_number = ${current} WHERE object_type = 'PR'`);
    }

    const totalAmount = lines.reduce((sum: number, l: any) => sum + parseFloat(l.quantity) * parseFloat(l.estimatedPrice || 0), 0).toFixed(3);

    // Create PR header with ERP views: docDate, purchasingOrg, purchasingGroup
    const prRes = await db.execute(sql`
      INSERT INTO mm_purchase_requisition (pr_number, company_code_id, plant_id, requester_id, status, total_amount, currency, required_date, header_text, doc_date, purchasing_org, purchasing_group)
      VALUES (${prNumber}, ${compId}, ${plantId}, ${reqId}, 'DRAFT', ${totalAmount}, 'KWD', ${requiredDate ? new Date(requiredDate) : (body.deliveryDate ? new Date(body.deliveryDate) : new Date(Date.now() + 7*24*3600000))}, ${headerText || null}, ${docDate ? new Date(docDate) : new Date()}, ${purchasingOrg || '1000'}, ${purchasingGroup || '001'})
      RETURNING id, pr_number
    `);

    const prId = (prRes.rows[0] as any).id;

    // Create lines with ERP views: deliveryDate, accountAssignment, costCenter, glAccount, taxCode, itemText, plant/sloc multi-plant support
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      await db.execute(sql`
        INSERT INTO mm_pr_line (pr_id, line_number, material_id, quantity, uom, estimated_price, plant_id, sloc_id, delivery_date, account_assignment, item_text)
        VALUES (${prId}, ${i+1}, ${line.materialId}, ${line.quantity}, ${line.uom || 'KG'}, ${line.estimatedPrice || 0}, ${line.plantId || plantId}, ${line.slocId || null}, ${line.deliveryDate ? new Date(line.deliveryDate) : (body.deliveryDate ? new Date(body.deliveryDate) : new Date(Date.now()+7*24*3600000))}, ${line.accountAssignment || body.accountAssignment || 'K'}, ${line.itemText || itemText || null})
      `);
    }

    // Audit log WORM-lite
    try {
      await db.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description)
        VALUES ('mm_purchase_requisition', ${prId}, ${prNumber}, 'INSERT', ${JSON.stringify({ prNumber, totalAmount, lines })}::jsonb, ${`PR CREATE: ${prNumber} Plant ${plantId} Total ${totalAmount} KWD`})
      `);
    } catch (e: any) { console.warn('Audit log failed', e); }

    // Auto trigger workflow if amount > 0
    let workflowTriggered = false;
    try {
      const wfDef = await db.execute(sql`SELECT id FROM wf_definition WHERE document_type = 'PR' AND is_active = true LIMIT 1`);
      if (wfDef.rows.length > 0 && parseFloat(totalAmount) > 0) {
        const defId = (wfDef.rows[0] as any).id;
        const steps = await db.execute(sql`SELECT id, approver_type FROM wf_definition_step WHERE definition_id = ${defId} ORDER BY step_order`);
        const instRes = await db.execute(sql`
          INSERT INTO wf_instance (definition_id, document_type, document_id, document_number, company_code_id, current_state, current_step_order, requester_id, amount, currency)
          VALUES (${defId}, 'PR', ${prId}, ${prNumber}, ${compId}, 'PENDING_APPROVAL', 1, ${reqId}, ${totalAmount}, 'KWD')
          RETURNING id
        `);
        const instId = (instRes.rows[0] as any).id;
        for (const step of steps.rows as any[]) {
          let assignee = reqId;
          if (step.approver_type === 'MANAGER') {
            const mgr = await db.execute(sql`SELECT manager_id FROM hr_employee WHERE id = ${reqId} LIMIT 1`);
            if (mgr.rows.length > 0 && (mgr.rows[0] as any).manager_id) assignee = (mgr.rows[0] as any).manager_id;
          } else if (step.approver_type === 'OWNER') {
            const owner = await db.execute(sql`SELECT e.id FROM hr_employee e JOIN hr_position p ON e.position_id = p.id WHERE p.is_owner = true AND e.is_active = true LIMIT 1`);
            if (owner.rows.length > 0) assignee = (owner.rows[0] as any).id;
          }
          await db.execute(sql`INSERT INTO wf_task (instance_id, step_id, assignee_id, status) VALUES (${instId}, ${step.id}, ${assignee}, 'PENDING')`);
        }
        await db.execute(sql`UPDATE mm_purchase_requisition SET status = 'PENDING_APPROVAL', workflow_instance_id = ${instId} WHERE id = ${prId}`);
        workflowTriggered = true;
      }
    } catch (e: any) { console.warn('Workflow trigger failed', e); }

    return NextResponse.json({
      success: true,
      prId,
      prNumber,
      totalAmount,
      workflowTriggered,
      message: `PR ${prNumber} created with ${lines.length} lines, total ${totalAmount} KWD, multi-plant support plant ${plantId}`,
    });
  } catch (e: any) {
    console.error('Create PR failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, action, poId } = body;
    // action: APPROVE, REJECT, CONVERT_TO_PO

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action required' }, { status: 400 });
    }

    const prRes = await db.execute(sql`SELECT * FROM mm_purchase_requisition WHERE id = ${id} LIMIT 1`);
    if (prRes.rows.length === 0) return NextResponse.json({ error: 'PR not found' }, { status: 404 });
    const pr = prRes.rows[0] as any;

    let newStatus = pr.status;
    if (action === 'APPROVE') newStatus = 'APPROVED';
    else if (action === 'REJECT') newStatus = 'REJECTED';
    else if (action === 'CONVERT_TO_PO') newStatus = 'CONVERTED_TO_PO';

    await db.execute(sql`UPDATE mm_purchase_requisition SET status = ${newStatus}, updated_at = NOW() WHERE id = ${id}`);

    if (action === 'CONVERT_TO_PO' && poId) {
      await db.execute(sql`UPDATE mm_pr_line SET is_converted = true, po_id = ${poId} WHERE pr_id = ${id}`);
    }

    // Audit log old/new JSON
    try {
      await db.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, old_values, new_values, description)
        VALUES ('mm_purchase_requisition', ${id}, ${pr.pr_number}, 'UPDATE', ${JSON.stringify(pr)}::jsonb, ${JSON.stringify({ status: newStatus, poId })}::jsonb, ${`PR ${action}: ${pr.pr_number} ${pr.status} -> ${newStatus}`})
      `);
    } catch (e: any) {}

    return NextResponse.json({ success: true, prNumber: pr.pr_number, oldStatus: pr.status, newStatus, message: `PR ${pr.pr_number} ${action} ${pr.status} -> ${newStatus}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
