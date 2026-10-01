/**
 * Physical Inventory Service - PID Workflow with Movement Blocking and Variance FI Posting
 * Workflow: Create PID → Enter Count → Post Differences
 * Blocking: When PID active for SLoc+Material, block 101/261/601 movements
 * Variance: Debit Inventory Loss/Shrinkage (Expense) Credit Inventory (Asset) at MAP
 */
import { db, withTransaction } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { InventoryService } from './inventoryService';

export interface CreatePidParams {
  companyCodeId: string;
  plantId: string;
  slocId: string;
  materialIds?: string[]; // If empty, all materials in SLoc
  plannedCountDate: Date;
  postingDate: Date;
  headerText?: string;
  createdBy: string;
}

export class PhysicalInventoryService {
  /**
   * Create PID - Snapshot system qty for materials in SLoc
   * Activates blocking for 101/261/601 movements
   */
  static async createPid(params: CreatePidParams) {
    return withTransaction(async (tx) => {
      // Generate PI number
      const year = new Date().getFullYear();
      const nrRes = await tx.execute(sql`
        SELECT current_number + 1 as next_num, prefix
        FROM core_number_range
        WHERE object_type = 'BATCH' AND year = ${year}
        FOR UPDATE
      `);
      // Use PI prefix - create number range for PI if not exists
      let piNumber: string;
      const piNrRes = await tx.execute(sql`
        SELECT current_number + 1 as next_num, prefix
        FROM core_number_range
        WHERE object_type = 'KITTING_ORDER' AND year = ${year}
        FOR UPDATE
      `);
      // For PI, use PI prefix
      piNumber = `PI${Date.now().toString().slice(-8)}`;

      // Create PID header
      const piRes = await tx.execute(sql`
        INSERT INTO pi_document (pi_number, company_code_id, plant_id, sloc_id, status, posting_date, planned_count_date, header_text, is_blocking_active, created_by)
        VALUES (${piNumber}, ${params.companyCodeId}, ${params.plantId}, ${params.slocId}, 'CREATED', ${params.postingDate}, ${params.plannedCountDate}, ${params.headerText || ''}, true, ${params.createdBy})
        RETURNING id
      `);
      const piId = (piRes.rows[0] as any).id;

      // Get system stock for SLoc (and materials if filtered)
      let stockQuery = sql`
        SELECT s.id, s.material_id, s.batch_id, b.batch_number, s.stock_status, s.quantity,
               mp.moving_avg_price, mp.standard_price, mp.price_control,
               b.expiry_date, m.material_number, m.description
        FROM inv_stock s
        JOIN prod_item m ON s.material_id = m.id
        JOIN prod_item_plant mp ON s.material_id = mp.material_id AND s.plant_id = mp.plant_id
        LEFT JOIN inv_lot b ON s.batch_id = b.id
        WHERE s.plant_id = ${params.plantId} AND s.sloc_id = ${params.slocId} AND s.quantity > 0
      `;

      if (params.materialIds && params.materialIds.length > 0) {
        stockQuery = sql`${stockQuery} AND s.material_id IN (${sql.join(params.materialIds.map(id => sql`${id}`), sql`, `)})`;
      }

      const stockRes = await tx.execute(stockQuery);

      let totalSystemQty = 0;
      let lineNumber = 10;

      for (const stock of stockRes.rows as any[]) {
        const qty = parseFloat(stock.quantity);
        const unitCost = stock.price_control === 'V' ? parseFloat(stock.moving_avg_price || '0') : parseFloat(stock.standard_price || '0');
        const systemValue = qty * unitCost;

        await tx.execute(sql`
          INSERT INTO pi_line (pi_document_id, line_number, material_id, batch_id, batch_number, stock_status, system_qty, system_value, unit_cost, expiry_date, status, is_counted)
          VALUES (${piId}, ${lineNumber}, ${stock.material_id}, ${stock.batch_id}, ${stock.batch_number}, ${stock.stock_status}, ${qty}, ${systemValue}, ${unitCost}, ${stock.expiry_date}, 'PENDING', false)
        `);

        totalSystemQty += qty;
        lineNumber += 10;
      }

      await tx.execute(sql`
        UPDATE pi_document SET total_lines = ${stockRes.rows.length}, total_system_qty = ${totalSystemQty}
        WHERE id = ${piId}
      `);

      return {
        piId,
        piNumber,
        totalLines: stockRes.rows.length,
        totalSystemQty,
        message: `PID ${piNumber} created with ${stockRes.rows.length} lines, system qty ${totalSystemQty}. Blocking active for 101/261/601 movements on SLoc ${params.slocId}.`,
      };
    });
  }

  /**
   * Check if movement should be blocked due to active PID
   * Called from InventoryService.postMovement
   */
  static async isMovementBlocked(
    tx: any,
    materialId: string,
    plantId: string,
    slocId: string,
    movementType: string
  ): Promise<{ blocked: boolean; piNumber?: string; piId?: string }> {
    // Only block 101 (GR), 261 (GI prod), 601 (GI sales) as per requirement
    const blockingTypes = ['GR_PO', 'GI_PROD', 'GI_SALES', 'K01', 'K02', '453', 'GI_SCRAP'];
    if (!blockingTypes.includes(movementType)) {
      return { blocked: false };
    }

    const activePidRes = await tx.execute(sql`
      SELECT d.id, d.pi_number
      FROM pi_document d
      JOIN pi_line l ON d.id = l.pi_document_id
      WHERE d.plant_id = ${plantId} 
        AND d.sloc_id = ${slocId}
        AND d.status IN ('CREATED', 'COUNT_ENTERED')
        AND d.is_blocking_active = true
        AND l.material_id = ${materialId}
      LIMIT 1
    `);

    if (activePidRes.rows.length > 0) {
      const pid = activePidRes.rows[0] as any;
      return { blocked: true, piNumber: pid.pi_number, piId: pid.id };
    }

    return { blocked: false };
  }

  /**
   * Enter count - rapid keyboard entry via UI
   */
  static async enterCount(params: {
    piId: string;
    counts: { lineId: string; countedQty: number; notes?: string; countedBy: string }[];
  }) {
    return withTransaction(async (tx) => {
      const piRes = await tx.execute(sql`
        SELECT id, status FROM pi_document WHERE id = ${params.piId} FOR UPDATE
      `);
      const pi = (piRes.rows[0] as any);
      if (!pi) throw new Error('PID not found');
      if (pi.status === 'POSTED' || pi.status === 'CANCELLED') throw new Error(`PID status ${pi.status} cannot enter count`);

      let countedLines = 0;
      let totalCountedQty = 0;
      let totalVarianceQty = 0;
      let totalVarianceValue = 0;

      for (const count of params.counts) {
        const lineRes = await tx.execute(sql`
          SELECT id, system_qty, unit_cost FROM pi_line WHERE id = ${count.lineId} AND pi_document_id = ${params.piId} FOR UPDATE
        `);
        const line = (lineRes.rows[0] as any);
        if (!line) continue;

        const systemQty = parseFloat(line.system_qty);
        const unitCost = parseFloat(line.unit_cost || '0');
        const varianceQty = count.countedQty - systemQty;
        const varianceValue = varianceQty * unitCost;

        await tx.execute(sql`
          UPDATE pi_line 
          SET counted_qty = ${count.countedQty}, variance_qty = ${varianceQty}, variance_value = ${varianceValue}, 
              status = 'COUNTED', is_counted = true, updated_at = NOW()
          WHERE id = ${count.lineId}
        `);

        // Audit count entry
        await tx.execute(sql`
          INSERT INTO pi_count_entry (pi_line_id, counted_qty, counted_by, notes)
          VALUES (${count.lineId}, ${count.countedQty}, ${count.countedBy}, ${count.notes || ''})
        `);

        countedLines++;
        totalCountedQty += count.countedQty;
        totalVarianceQty += varianceQty;
        totalVarianceValue += varianceValue;
      }

      // Update PID totals and status to COUNT_ENTERED if all counted
      const allLinesRes = await tx.execute(sql`
        SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_counted = true) as counted
        FROM pi_line WHERE pi_document_id = ${params.piId}
      `);
      const { total, counted } = allLinesRes.rows[0] as any;

      const newStatus = parseInt(counted) === parseInt(total) ? 'COUNT_ENTERED' : 'CREATED';

      await tx.execute(sql`
        UPDATE pi_document 
        SET counted_lines = ${counted}, total_counted_qty = ${totalCountedQty}, total_variance_qty = ${totalVarianceQty}, total_variance_value = ${totalVarianceValue}, status = ${newStatus}, updated_at = NOW()
        WHERE id = ${params.piId}
      `);

      return {
        piId: params.piId,
        totalLines: parseInt(total),
        countedLines: parseInt(counted),
        totalCountedQty,
        totalVarianceQty,
        totalVarianceValue,
        status: newStatus,
        message: `Count entered: ${counted}/${total} lines, variance qty ${totalVarianceQty}, value ${totalVarianceValue} KWD`,
      };
    });
  }

  /**
   * Post differences - generate FI doc for variance
   * Shrinkage: Dr Inventory Loss/Shrinkage Expense Cr Inventory Asset at MAP
   * Surplus: Dr Inventory Asset Cr Inventory Gain
   */
  static async postDifferences(params: {
    piId: string;
    postedBy: string;
  }) {
    return withTransaction(async (tx) => {
      const piRes = await tx.execute(sql`
        SELECT id, pi_number, company_code_id, plant_id, sloc_id, status, posting_date
        FROM pi_document WHERE id = ${params.piId} FOR UPDATE
      `);
      const pi = (piRes.rows[0] as any);
      if (!pi) throw new Error('PID not found');
      if (pi.status !== 'COUNT_ENTERED') throw new Error(`PID must be COUNT_ENTERED to post, current ${pi.status}`);

      const linesRes = await tx.execute(sql`
        SELECT id, material_id, batch_id, batch_number, system_qty, counted_qty, variance_qty, variance_value, unit_cost, stock_status
        FROM pi_line WHERE pi_document_id = ${params.piId} AND is_counted = true AND variance_qty != 0
      `);

      if (linesRes.rows.length === 0) {
        // No variance, just close PID
        await tx.execute(sql`
          UPDATE pi_document SET status = 'POSTED', is_blocking_active = false, updated_at = NOW() WHERE id = ${params.piId}
        `);
        return { piId: params.piId, varianceLines: 0, fiDocId: null, message: 'No variance, PID posted without FI' };
      }

      // Get GL accounts for variance posting
      const glRes = await tx.execute(sql`
        SELECT id, account_number FROM fin_ledger_account 
        WHERE account_number IN ('100000', '100001', '500005', '400002')
      `);
      // Create shrinkage/loss accounts if not exist
      await tx.execute(sql`
        INSERT INTO fin_ledger_account (coa_id, account_number, name, account_type, is_balance_sheet, is_reconciliation)
        VALUES 
          ((SELECT coa_id FROM org_legal_entity WHERE id = ${pi.company_code_id}), '500005', 'Inventory Loss / Shrinkage', 'EXPENSE', false, false),
          ((SELECT coa_id FROM org_legal_entity WHERE id = ${pi.company_code_id}), '400002', 'Inventory Gain', 'REVENUE', false, false)
        ON CONFLICT DO NOTHING
      `);

      const glRes2 = await tx.execute(sql`
        SELECT id, account_number FROM fin_ledger_account 
        WHERE account_number IN ('100000', '100001', '500005', '400002')
      `);
      const glMap = new Map((glRes2.rows as any[]).map((r: any) => [r.account_number, r.id]));
      const inventoryRohGlId = glMap.get('100000');
      const inventoryFertGlId = glMap.get('100001');
      const lossGlId = glMap.get('500005');
      const gainGlId = glMap.get('400002');

      // Generate FI doc number
      const year = new Date().getFullYear();
      const nrRes = await tx.execute(sql`
        SELECT current_number + 1 as next_num, prefix
        FROM core_number_range WHERE object_type = 'FI_DOC' AND year = ${year} FOR UPDATE
      `);
      let fiDocNumber: string;
      if (nrRes.rows.length > 0) {
        const row = nrRes.rows[0] as any;
        fiDocNumber = `${row.prefix}${String(row.next_num).padStart(10, '0')}`;
        await tx.execute(sql`UPDATE core_number_range SET current_number = ${row.next_num} WHERE object_type = 'FI_DOC' AND year = ${year}`);
      } else {
        fiDocNumber = `FI-PI-${Date.now()}`;
      }

      // Create FI doc header
      let totalDebit = 0;
      let totalCredit = 0;
      for (const line of linesRes.rows as any[]) {
        const varValue = Math.abs(parseFloat(line.variance_value || '0'));
        totalDebit += varValue;
        totalCredit += varValue;
      }

      const fiDocRes = await tx.execute(sql`
        INSERT INTO fin_universal_ledger (document_number, company_code_id, doc_type, posting_date, document_date, reference, header_text, total_debit, total_credit, currency, status, reference_doc_type, reference_doc_id, reference_doc_number, created_by)
        VALUES (${fiDocNumber}, ${pi.company_code_id}, 'SA', ${pi.posting_date}, NOW(), ${pi.pi_number}, ${'Physical Inventory Variance ' + pi.pi_number}, ${totalDebit}, ${totalCredit}, 'KWD', 'POSTED', 'PI', ${params.piId}, ${pi.pi_number}, ${params.postedBy})
        RETURNING id
      `);
      const fiDocId = (fiDocRes.rows[0] as any).id;

      // Post inventory adjustments and FI lines
      let lineNumber = 10;

      for (const line of linesRes.rows as any[]) {
        const varianceQty = parseFloat(line.variance_qty);
        const varianceValue = parseFloat(line.variance_value || '0');
        const absValue = Math.abs(varianceValue);
        const absQty = Math.abs(varianceQty);

        // Get material type for GL determination
        const matRes = await tx.execute(sql`SELECT type FROM prod_item WHERE id = ${line.material_id}`);
        const matType = (matRes.rows[0] as any)?.type || 'ROH';
        const inventoryGlId = matType === 'FERT' ? inventoryFertGlId : inventoryRohGlId;

        // Post inventory movement 702 (PI issue) for shrinkage, 701 (PI receipt) for surplus
        if (varianceQty < 0) {
          // Shrinkage - missing stock: Issue via 702 (or 551)
          const movement = await tx.execute(sql`
            SELECT moving_avg_price FROM prod_item_plant WHERE material_id = ${line.material_id} AND plant_id = ${pi.plant_id}
          `);
          const map = parseFloat((movement.rows[0] as any)?.moving_avg_price || line.unit_cost || '0');

          // Use InventoryService logic via direct SQL to avoid circular import issues
          // For simplicity, direct update here - in production would call InventoryService
          await tx.execute(sql`
            UPDATE inv_stock SET quantity = quantity + ${varianceQty}, updated_at = NOW()
            WHERE material_id = ${line.material_id} AND plant_id = ${pi.plant_id} AND sloc_id = ${pi.sloc_id} 
              AND (batch_id = ${line.batch_id} OR (batch_id IS NULL AND ${line.batch_id} IS NULL))
              AND stock_status = ${line.stock_status}
          `);

          await tx.execute(sql`
            INSERT INTO inv_stock_ledger (movement_type, material_id, plant_id, sloc_id, batch_id, stock_status_from, stock_status_to, quantity, quantity_before, quantity_after, unit_cost, total_value, reference_doc_type, reference_doc_number, posted_by, header_text)
            VALUES ('GI_SCRAP', ${line.material_id}, ${pi.plant_id}, ${pi.sloc_id}, ${line.batch_id}, ${line.stock_status}, ${line.stock_status}, ${varianceQty}, ${parseFloat(line.system_qty)}, ${parseFloat(line.counted_qty || '0')}, ${map}, ${varianceValue}, 'PI', ${pi.pi_number}, ${params.postedBy}, ${'PI Shrinkage ' + pi.pi_number})
            RETURNING id
          `);

          // FI: Dr Loss Expense Cr Inventory Asset at MAP
          await tx.execute(sql`
            INSERT INTO fin_universal_ledger_line (fi_document_id, line_number, gl_account_id, debit, credit, text, material_id, quantity)
            VALUES (${fiDocId}, ${lineNumber}, ${lossGlId}, ${absValue}, 0, ${'PI Shrinkage ' + line.batch_number + ' ' + varianceQty}, ${line.material_id}, ${absQty})
          `);
          lineNumber += 10;
          await tx.execute(sql`
            INSERT INTO fin_universal_ledger_line (fi_document_id, line_number, gl_account_id, debit, credit, text, material_id, quantity)
            VALUES (${fiDocId}, ${lineNumber}, ${inventoryGlId}, 0, ${absValue}, ${'PI Shrinkage Inventory ' + line.batch_number}, ${line.material_id}, ${absQty})
          `);
          lineNumber += 10;

        } else if (varianceQty > 0) {
          // Surplus - extra stock found: Receipt via 701
          await tx.execute(sql`
            UPDATE inv_stock SET quantity = quantity + ${varianceQty}, updated_at = NOW()
            WHERE material_id = ${line.material_id} AND plant_id = ${pi.plant_id} AND sloc_id = ${pi.sloc_id} 
              AND (batch_id = ${line.batch_id} OR (batch_id IS NULL AND ${line.batch_id} IS NULL))
              AND stock_status = ${line.stock_status}
          `);

          // If stock row doesn't exist, insert
          const checkStock = await tx.execute(sql`
            SELECT id FROM inv_stock 
            WHERE material_id = ${line.material_id} AND plant_id = ${pi.plant_id} AND sloc_id = ${pi.sloc_id} AND (batch_id = ${line.batch_id} OR batch_id IS NULL)
              AND stock_status = ${line.stock_status}
          `);
          if (checkStock.rows.length === 0) {
            await tx.execute(sql`
              INSERT INTO inv_stock (material_id, plant_id, sloc_id, batch_id, stock_status, quantity)
              VALUES (${line.material_id}, ${pi.plant_id}, ${pi.sloc_id}, ${line.batch_id}, ${line.stock_status}, ${varianceQty})
            `);
          }

          await tx.execute(sql`
            INSERT INTO inv_stock_ledger (movement_type, material_id, plant_id, sloc_id, batch_id, stock_status_to, quantity, quantity_before, quantity_after, unit_cost, total_value, reference_doc_type, reference_doc_number, posted_by, header_text)
            VALUES ('INIT_STOCK', ${line.material_id}, ${pi.plant_id}, ${pi.sloc_id}, ${line.batch_id}, ${line.stock_status}, ${varianceQty}, ${parseFloat(line.system_qty)}, ${parseFloat(line.counted_qty || '0')}, ${parseFloat(line.unit_cost || '0')}, ${varianceValue}, 'PI', ${pi.pi_number}, ${params.postedBy}, ${'PI Surplus ' + pi.pi_number})
            RETURNING id
          `);

          // FI: Dr Inventory Asset Cr Gain at MAP
          await tx.execute(sql`
            INSERT INTO fin_universal_ledger_line (fi_document_id, line_number, gl_account_id, debit, credit, text, material_id, quantity)
            VALUES (${fiDocId}, ${lineNumber}, ${inventoryGlId}, ${absValue}, 0, ${'PI Surplus Inventory ' + line.batch_number}, ${line.material_id}, ${absQty})
          `);
          lineNumber += 10;
          await tx.execute(sql`
            INSERT INTO fin_universal_ledger_line (fi_document_id, line_number, gl_account_id, debit, credit, text, material_id, quantity)
            VALUES (${fiDocId}, ${lineNumber}, ${gainGlId}, 0, ${absValue}, ${'PI Surplus Gain ' + line.batch_number + ' ' + varianceQty}, ${line.material_id}, ${absQty})
          `);
          lineNumber += 10;
        }

        await tx.execute(sql`
          UPDATE pi_line SET status = 'POSTED', stock_ledger_id = (SELECT id FROM inv_stock_ledger WHERE reference_doc_number = ${pi.pi_number} AND material_id = ${line.material_id} ORDER BY posted_at DESC LIMIT 1), updated_at = NOW()
          WHERE id = ${line.id}
        `);
      }

      // Close PID and release blocking
      await tx.execute(sql`
        UPDATE pi_document SET status = 'POSTED', is_blocking_active = false, fi_document_id = ${fiDocId}, updated_at = NOW()
        WHERE id = ${params.piId}
      `);

      return {
        piId: params.piId,
        piNumber: pi.pi_number,
        varianceLines: linesRes.rows.length,
        fiDocId,
        fiDocNumber: fiDocNumber,
        totalVarianceValue: linesRes.rows.reduce((sum: number, r: any) => sum + parseFloat(r.variance_value || '0'), 0),
        message: `PID ${pi.pi_number} posted with ${linesRes.rows.length} variance lines, FI ${fiDocNumber} created. Blocking released for SLoc ${pi.sloc_id}.`,
      };
    });
  }
}
