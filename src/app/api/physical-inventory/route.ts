import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { getNextDocumentNumber, createDocumentEntry, updateDocumentWithAudit } from '@/shared/kernel/db/documentHelpers';

/**
 * Physical Inventory API – Legal-safe own IP – Module 9 Inventory
 * New: inventory_physical_document + inventory_physical_line + inventory_physical_count_entry (was pi_document + pi_line + pi_count_entry) – piNumber PI-10000001, legalEntityId was company_code_id, facilityId FAC-1000 was plant_id, inventoryLocationId was sloc_id, status CREATED/COUNT_ENTERED/POSTED/CANCELLED, postingDate plannedCountDate, isBlockingActive, totalLines/countedLines totalSystemQty/totalCountedQty/totalVarianceQty/totalVarianceValue universalLedgerId FULC was fi_document_id, line: physicalDocumentId lineNumber itemId EMTC was material_id lotId ELTC was batch_id lotNumber was batch_number stockStatus UNRESTRICTED systemQty systemValue unitCost MAP countedQty varianceQty varianceValue status PENDING/COUNTED/POSTED/BLOCKED isCounted stockLedgerId expiryDate
 * Helper code: IPDC Physical Inventory Doc Create (alias PIDC, MI01, FIN-PI-CR) – 4-char MOOA I=Inventory P=Physical D=Doc C=Create – module grouped intuitive, same length as MI01 but own IP
 * Fallback to legacy pi_document
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const facilityId = searchParams.get('facilityId') || searchParams.get('plantId');

  try {
    let rows: any[] = [];
    let table = 'inventory_physical_document';
    let legalSafe = true;
    let dbSource = 'db-new';

    try {
      let query = sql`
        SELECT d.id, d.pi_number, d.status, d.posting_date, d.planned_count_date, d.header_text, d.is_blocking_active,
               d.total_lines, d.counted_lines, d.total_system_qty, d.total_counted_qty, d.total_variance_qty, d.total_variance_value,
               f.code as facility_code, f.name as facility_name, f.code as plant_code,
               il.code as inventory_location_code, il.name as inventory_location_name,
               le.code as legal_entity_code,
               (SELECT COUNT(*) FROM inventory_physical_line WHERE physical_document_id = d.id) as line_count
        FROM inventory_physical_document d
        LEFT JOIN org_facility f ON d.facility_id = f.id
        LEFT JOIN org_inventory_location il ON d.inventory_location_id = il.id
        LEFT JOIN org_legal_entity le ON d.legal_entity_id = le.id
        WHERE 1=1
      `;
      if (search) query = sql`${query} AND d.pi_number ILIKE ${`%${search}%`}`;
      if (status) query = sql`${query} AND d.status = ${status}::inventory_physical_status_new`;
      if (facilityId) query = sql`${query} AND d.facility_id = ${facilityId}`;
      query = sql`${query} ORDER BY d.posting_date DESC LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];

      for (let i = 0; i < rows.length; i++) {
        try {
          const linesRes = await db.execute(sql`
            SELECT l.*, pi.item_number, pi.description as item_name
            FROM inventory_physical_line l
            LEFT JOIN prod_item pi ON l.item_id = pi.id
            WHERE l.physical_document_id = ${rows[i].id}
            ORDER BY l.line_number
          `);
          rows[i].lines = linesRes.rows;
        } catch {
          rows[i].lines = [];
        }
      }
    } catch (newErr: any) {
      console.warn('inventory_physical_document not yet fallback pi_document:', newErr.message);
      dbSource = 'db-legacy';
      table = 'pi_document';
      legalSafe = false;

      let query = sql`
        SELECT d.id, d.pi_number, d.status, d.posting_date, d.planned_count_date, d.header_text, d.is_blocking_active,
               d.total_lines, d.counted_lines, d.total_system_qty, d.total_counted_qty, d.total_variance_qty, d.total_variance_value,
               p.code as facility_code, p.name as facility_name, p.code as plant_code,
               sl.code as inventory_location_code, sl.name as inventory_location_name,
               cc.code as legal_entity_code,
               (SELECT COUNT(*) FROM pi_line WHERE pi_document_id = d.id) as line_count
        FROM pi_document d
        LEFT JOIN org_facility p ON d.plant_id = p.id
        LEFT JOIN org_inventory_location sl ON d.sloc_id = sl.id
        LEFT JOIN org_legal_entity cc ON d.company_code_id = cc.id
        WHERE 1=1
      `;
      if (search) query = sql`${query} AND d.pi_number ILIKE ${`%${search}%`}`;
      if (status) query = sql`${query} AND d.status = ${status}::pi_status`;
      if (facilityId) query = sql`${query} AND d.plant_id = ${facilityId}`;
      query = sql`${query} ORDER BY d.posting_date DESC LIMIT ${limit}`;
      const res = await db.execute(query);
      rows = res.rows as any[];
    }

    return NextResponse.json({
      physicalInventories: rows,
      data: rows,
      count: rows.length,
      code: 'IPDC',
      aliasCodes: ['PIDC', 'MI01', 'FIN-PI-CR'],
      helperCode: 'IPDC',
      table,
      source: dbSource,
      legalSafe,
      functionDescription: 'Physical Inventory – IPDC legal-safe own IP (was MI01) – piNumber PI-10000001, facilityId FAC-1000 was plant_id, inventoryLocationId was sloc_id, itemId EMTC was material_id, lotId ELTC was batch_id, status CREATED/COUNT_ENTERED/POSTED/CANCELLED',
      explanation: 'Physical inventory legal-safe inventory_physical_document – piNumber PI-10000001, legalEntityId was company_code_id, facilityId FAC-1000 was plant_id, inventoryLocationId was sloc_id, status CREATED/COUNT_ENTERED/POSTED/CANCELLED, postingDate plannedCountDate isBlockingActive totalLines/countedLines totalSystemQty/totalCountedQty/totalVarianceQty/totalVarianceValue universalLedgerId FULC was fi_document_id, itemId EMTC was material_id, lotId ELTC was batch_id, lotNumber was batch_number – Code IPDC primary alias PIDC/MI01 – 4-char MOOA I=Inventory P=Physical D=Doc C=Create – module grouped intuitive, same length as MI01 but own IP.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    // SAP-like unique document number – FNDC – auto-generate from FNRC if not provided
    let pi_number = body.pi_number;
    if (!pi_number) {
      try {
        const next = await getNextDocumentNumber('PI', body.company_code || body.legal_entity_code || '1000');
        pi_number = next.document_number;
      } catch { pi_number = `PI-${Date.now()}`; }
    }
    const { facility_id, plant_id, inventory_location_id, sloc_id, legal_entity_id, company_code_id, posting_date, planned_count_date, header_text, lines } = body;

    let facilityIdResolved = facility_id || plant_id;
    let inventoryLocationIdResolved = inventory_location_id || sloc_id;
    let legalEntityIdResolved = legal_entity_id || company_code_id;

    if (!facilityIdResolved) return NextResponse.json({ error: 'facility_id or plant_id required' }, { status: 400 });
    if (!inventoryLocationIdResolved) {
      try {
        const locRes = await db.execute(sql`SELECT id FROM org_inventory_location WHERE facility_id = ${facilityIdResolved} LIMIT 1`);
        if (locRes.rows.length > 0) inventoryLocationIdResolved = (locRes.rows[0] as any).id;
      } catch {}
      if (!inventoryLocationIdResolved) {
        try {
          const locRes = await db.execute(sql`SELECT id FROM org_inventory_location WHERE plant_id = ${facilityIdResolved} LIMIT 1`);
          if (locRes.rows.length > 0) inventoryLocationIdResolved = (locRes.rows[0] as any).id;
        } catch {}
      }
    }

    let piNumber = body.pi_number;
    if (!piNumber) {
      try {
        const nrRes = await db.execute(sql`SELECT current_number FROM core_number_range WHERE object_type = 'PHYSICAL_INVENTORY'::core_nr_object_type ORDER BY fiscal_year DESC LIMIT 1`);
        if (nrRes.rows.length > 0) {
          const current = parseInt((nrRes.rows[0] as any).current_number) + 1;
                    piNumber = `${current}`;
          await db.execute(sql`UPDATE core_number_range SET current_number = ${current}, updated_at = NOW() WHERE object_type = 'PHYSICAL_INVENTORY'::core_nr_object_type`);
        } else {
          piNumber = `PI-${Date.now()}`;
        }
      } catch {
        piNumber = `PI-${Date.now()}`;
      }
    }

    try {
      const res = await db.execute(sql`
        INSERT INTO inventory_physical_document (pi_number, legal_entity_id, company_code_id, facility_id, plant_id, inventory_location_id, sloc_id, posting_date, planned_count_date, header_text)
        VALUES (${piNumber}, ${legalEntityIdResolved || null}, ${legalEntityIdResolved || null}, ${facilityIdResolved}, ${facilityIdResolved}, ${inventoryLocationIdResolved}, ${inventoryLocationIdResolved}, ${posting_date ? new Date(posting_date) : new Date()}, ${planned_count_date ? new Date(planned_count_date) : new Date()}, ${header_text || null})
        RETURNING id, pi_number
      `);
      const docId = (res.rows[0] as any).id;

      if (lines && Array.isArray(lines)) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          await db.execute(sql`
            INSERT INTO inventory_physical_line (physical_document_id, pi_document_id, line_number, item_id, material_id, lot_id, batch_id, lot_number, batch_number, stock_status, system_qty, system_value, unit_cost)
            VALUES (${docId}, ${docId}, ${line.line_number || i + 10}, ${line.item_id || line.material_id}, ${line.item_id || line.material_id}, ${line.lot_id || line.batch_id || null}, ${line.lot_id || line.batch_id || null}, ${line.lot_number || line.batch_number || null}, ${line.lot_number || line.batch_number || null}, ${line.stock_status || 'UNRESTRICTED'}, ${line.system_qty || line.systemQty || '0'}, ${line.system_value || '0'}, ${line.unit_cost || '0'})
          `);
        }
        await db.execute(sql`UPDATE inventory_physical_document SET total_lines = ${lines.length} WHERE id = ${docId}`);
      }

      return NextResponse.json({ success: true, physicalDocument: res.rows[0], piNumber, code: 'IPDC', message: `Physical inventory ${piNumber} created – IPDC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('inventory_physical_document insert failed:', newErr.message);
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
    // Immutable audit trail – log before update
    try {
      const docNum = body.pi_number || body.document_number || body.id;
      if (docNum) await updateDocumentWithAudit({ document_number: docNum, new_payload: body, changed_by: 'system', action: 'UPDATE' });
    } catch (auditErr) { console.warn('Audit trail failed', auditErr); }
    const { id, pi_number, status } = body;
    if (!id && !pi_number) return NextResponse.json({ error: 'id or pi_number required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE inventory_physical_document SET status = ${status}::inventory_physical_status_new, updated_at = NOW() WHERE id = ${id} RETURNING id, pi_number, status`);
      else res = await db.execute(sql`UPDATE inventory_physical_document SET status = ${status}::inventory_physical_status_new, updated_at = NOW() WHERE pi_number = ${pi_number} RETURNING id, pi_number, status`);
      if (res.rows.length === 0) throw new Error('Not found');
      return NextResponse.json({ success: true, physicalDocument: res.rows[0], code: 'IPDC', message: `Physical inventory ${res.rows[0].pi_number} status ${status} – IPDC legal-safe` });
    } catch {
      let res;
      if (id) res = await db.execute(sql`UPDATE pi_document SET status = ${status}::pi_status, updated_at = NOW() WHERE id = ${id} RETURNING id, pi_number, status`);
      else res = await db.execute(sql`UPDATE pi_document SET status = ${status}::pi_status, updated_at = NOW() WHERE pi_number = ${pi_number} RETURNING id, pi_number, status`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Physical inventory not found' }, { status: 404 });
      return NextResponse.json({ success: true, physicalDocument: res.rows[0], message: `Physical inventory ${res.rows[0].pi_number} status ${status} – MI01 legacy` });
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
    const pi_number = searchParams.get('pi_number');
    if (!id && !pi_number) return NextResponse.json({ error: 'id or pi_number required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM inventory_physical_document WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM inventory_physical_document WHERE pi_number = ${pi_number}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM pi_document WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM pi_document WHERE pi_number = ${pi_number}`);
    }

    return NextResponse.json({ success: true, code: 'IPDC', message: `Physical inventory ${pi_number || id} deleted – IPDC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
