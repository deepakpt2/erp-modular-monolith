import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export interface DeletionReason {
  code: string;
  message: string;
  resolution: string;
  tcode: string;
  count?: number;
}

export interface DeletionPrecheckResult {
  canDelete: boolean;
  entityType: string;
  entityIdentifier: string;
  errorTitle: string;
  reasons: DeletionReason[];
  deactivationAction?: {
    type: 'POSTING_BLOCK' | 'DELETION_FLAG';
    label: string;
    endpoint: string;
    payload: Record<string, any>;
  };
}

/**
 * 1. Validate G/L Account Deletion (FGLC / FS00)
 * SAP Standard Check:
 * - fin_universal_ledger_line: postings exist -> BLOCK
 * - fin_auto_posting_rule / fin_auto_account_det: account assigned in OBYC -> BLOCK
 * - fin_retained_earnings: account assigned in OB53 -> BLOCK
 */
export async function validateGLAccountDeletion(params: {
  id?: string | null;
  accountNumber?: string | null;
  coaCode?: string | null;
}): Promise<DeletionPrecheckResult> {
  const { id, accountNumber, coaCode } = params;
  const reasons: DeletionReason[] = [];
  const identifier = accountNumber || id || 'UNKNOWN';

  // Find the exact account record if id or account_number given
  let glRecord: any = null;
  try {
    if (id) {
      const res = await db.execute(sql`SELECT * FROM fin_ledger_account WHERE id = ${id} LIMIT 1`);
      glRecord = res.rows[0];
    } else if (accountNumber) {
      const res = await db.execute(sql`SELECT * FROM fin_ledger_account WHERE account_number = ${accountNumber} LIMIT 1`);
      glRecord = res.rows[0];
    }
  } catch (err: any) {
    console.warn('Error fetching GL account in deletion precheck:', err.message);
  }

  const effectiveId = glRecord?.id || id;
  const effectiveAcc = glRecord?.account_number || accountNumber;

  // 1. Check Universal Journal Line Items (Transactions)
  try {
    let txCount = 0;
    if (effectiveId) {
      const txRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM fin_universal_ledger_line 
        WHERE gl_account_id = ${effectiveId}
      `);
      txCount = Number(txRes.rows[0]?.cnt || 0);
    }
    if (txCount === 0 && effectiveAcc) {
      const txRes2 = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM fin_universal_ledger_line 
        WHERE account_number = ${effectiveAcc}
      `);
      txCount = Number(txRes2.rows[0]?.cnt || 0);
    }

    if (txCount > 0) {
      reasons.push({
        code: 'TRANSACTION_DATA_EXISTS',
        message: `Universal Ledger transaction records exist (${txCount} journal entry lines found).`,
        resolution: 'Accounts with posted transaction data cannot be physically deleted per statutory SAP audit standards. Set Posting Block (SPERR) or Deletion Flag (XLOEV) instead.',
        tcode: 'FS00',
        count: txCount,
      });
    }
  } catch (err: any) {
    console.warn('Check fin_universal_ledger_line:', err.message);
  }

  // 2. Check Automatic Account Determination (OBYC / FAUC)
  try {
    let autoDetCount = 0;
    if (effectiveId) {
      const adRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM fin_auto_posting_rule 
        WHERE gl_account_id = ${effectiveId}
      `);
      autoDetCount += Number(adRes.rows[0]?.cnt || 0);
    }
    if (effectiveAcc) {
      const adRes2 = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM fin_auto_account_det 
        WHERE gl_account = ${effectiveAcc}
      `);
      autoDetCount += Number(adRes2.rows[0]?.cnt || 0);
    }

    if (autoDetCount > 0) {
      reasons.push({
        code: 'AUTO_ACCOUNT_DETERMINATION_IN_USE',
        message: `Account is assigned in Automatic Account Determination (OBYC) for material/settlement postings (${autoDetCount} rules found).`,
        resolution: 'Remove or reassign account mappings in Automatic Account Determination (FAUC / OBYC) before deleting.',
        tcode: 'OBYC',
        count: autoDetCount,
      });
    }
  } catch (err: any) {
    console.warn('Check auto account determination:', err.message);
  }

  // 3. Check Retained Earnings Account (OB53 / FREC)
  try {
    if (effectiveAcc) {
      const reRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM fin_retained_earnings 
        WHERE gl_account = ${effectiveAcc} OR account_number = ${effectiveAcc}
      `);
      const reCount = Number(reRes.rows[0]?.cnt || 0);
      if (reCount > 0) {
        reasons.push({
          code: 'RETAINED_EARNINGS_ACCOUNT',
          message: 'Account is configured as the master Retained Earnings account.',
          resolution: 'Reconfigure the Retained Earnings account in OB53 / FREC before attempting deletion.',
          tcode: 'OB53',
          count: reCount,
        });
      }
    }
  } catch {}

  const canDelete = reasons.length === 0;

  return {
    canDelete,
    entityType: 'G/L Account',
    entityIdentifier: String(identifier),
    errorTitle: `G/L Account ${identifier} cannot be deleted`,
    reasons,
    deactivationAction: !canDelete ? {
      type: 'POSTING_BLOCK',
      label: 'Set Posting Block (SPERR)',
      endpoint: '/api/gl-accounts',
      payload: {
        id: effectiveId,
        account_number: effectiveAcc,
        is_blocked: 'true',
      },
    } : undefined,
  };
}

/**
 * 2. Validate Chart of Accounts Deletion (FCOA / OB13)
 * SAP Standard Check:
 * - org_company_code_coa / org_legal_entity: assigned to any Company Code -> BLOCK
 * - fin_ledger_account: G/L accounts created under CoA -> BLOCK
 * - fin_account_group: Account groups defined under CoA -> BLOCK
 */
export async function validateChartOfAccountsDeletion(params: {
  id?: string | null;
  code?: string | null;
}): Promise<DeletionPrecheckResult> {
  const { id, code } = params;
  const reasons: DeletionReason[] = [];
  const identifier = code || id || 'UNKNOWN';

  let coaRecord: any = null;
  try {
    if (id) {
      const res = await db.execute(sql`SELECT * FROM fin_chart WHERE id = ${id} LIMIT 1`);
      coaRecord = res.rows[0];
    } else if (code) {
      const res = await db.execute(sql`SELECT * FROM fin_chart WHERE code = ${code} LIMIT 1`);
      coaRecord = res.rows[0];
    }
  } catch {}

  const effectiveId = coaRecord?.id || id;
  const effectiveCode = coaRecord?.code || code;

  // 1. Check Company Code Assignments (OB62 / FLC2)
  try {
    let assignCount = 0;
    if (effectiveCode) {
      const aRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM org_company_code_coa 
        WHERE chart_of_accounts_code = ${effectiveCode}
      `);
      assignCount = Number(aRes.rows[0]?.cnt || 0);
    }
    if (effectiveId) {
      const leRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM org_legal_entity 
        WHERE coa_id = ${effectiveId}
      `);
      assignCount += Number(leRes.rows[0]?.cnt || 0);
    }

    if (assignCount > 0) {
      reasons.push({
        code: 'ASSIGNED_TO_COMPANY_CODE',
        message: `Chart of Accounts is assigned to ${assignCount} Company Code(s).`,
        resolution: 'Remove Company Code assignments in transaction FLC2 (legacy OB62) before deleting.',
        tcode: 'OB62',
        count: assignCount,
      });
    }
  } catch (err: any) {
    console.warn('Check CoA company code assignment:', err.message);
  }

  // 2. Check G/L Accounts Created (FS00 / FGLC)
  try {
    let glCount = 0;
    if (effectiveId) {
      const glRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM fin_ledger_account 
        WHERE coa_id = ${effectiveId}
      `);
      glCount = Number(glRes.rows[0]?.cnt || 0);
    }
    if (glCount === 0 && effectiveCode) {
      const glRes2 = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM fin_ledger_account 
        WHERE coa_code = ${effectiveCode}
      `);
      glCount = Number(glRes2.rows[0]?.cnt || 0);
    }

    if (glCount > 0) {
      reasons.push({
        code: 'GL_ACCOUNTS_EXIST',
        message: `${glCount} G/L Account(s) exist within this Chart of Accounts.`,
        resolution: 'All G/L accounts under this Chart of Accounts must be deleted or archived first in transaction FGLC (legacy FS00).',
        tcode: 'FS00',
        count: glCount,
      });
    }
  } catch (err: any) {
    console.warn('Check CoA gl accounts:', err.message);
  }

  // 3. Check Account Groups (OBD4 / FAGC)
  try {
    let agCount = 0;
    if (effectiveId) {
      const agRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM fin_account_group 
        WHERE coa_id = ${effectiveId}
      `);
      agCount = Number(agRes.rows[0]?.cnt || 0);
    }
    if (agCount === 0 && effectiveCode) {
      const agRes2 = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM fin_account_group 
        WHERE coa_code = ${effectiveCode}
      `);
      agCount = Number(agRes2.rows[0]?.cnt || 0);
    }

    if (agCount > 0) {
      reasons.push({
        code: 'ACCOUNT_GROUPS_EXIST',
        message: `${agCount} Account Group(s) are defined under this Chart of Accounts.`,
        resolution: 'Delete or reassign Account Groups in transaction FAGC (legacy OBD4) before deleting the Chart of Accounts.',
        tcode: 'OBD4',
        count: agCount,
      });
    }
  } catch {}

  const canDelete = reasons.length === 0;

  return {
    canDelete,
    entityType: 'Chart of Accounts',
    entityIdentifier: String(identifier),
    errorTitle: `Chart of Accounts ${identifier} cannot be deleted`,
    reasons,
    deactivationAction: undefined,
  };
}

/**
 * 3. Validate Company Code / Legal Entity Deletion (ELEC / OX02)
 * SAP Standard Check:
 * - fin_universal_ledger: transaction journal entries posted -> BLOCK
 * - Operational documents: Purchase Orders (proc_po), Goods Receipts (proc_gr), Invoices (proc_iv) -> BLOCK
 * - org_plant_company_code / org_facility: assigned Plants -> BLOCK
 * - org_purchasing_org_company_code: assigned Purchasing Orgs -> BLOCK
 * - org_sales_org_company_code: assigned Sales Orgs -> BLOCK
 */
export async function validateCompanyCodeDeletion(params: {
  id?: string | null;
  code?: string | null;
}): Promise<DeletionPrecheckResult> {
  const { id, code } = params;
  const reasons: DeletionReason[] = [];
  const identifier = code || id || 'UNKNOWN';

  let ccRecord: any = null;
  try {
    if (id) {
      const res = await db.execute(sql`SELECT * FROM org_legal_entity WHERE id = ${id} LIMIT 1`);
      ccRecord = res.rows[0];
    } else if (code) {
      const res = await db.execute(sql`SELECT * FROM org_legal_entity WHERE code = ${code} LIMIT 1`);
      ccRecord = res.rows[0];
    }
  } catch {}

  const effectiveId = ccRecord?.id || id;
  const effectiveCode = ccRecord?.code || code;

  // 1. Check Universal Ledger Journal Postings
  try {
    let ledgerCount = 0;
    if (effectiveCode) {
      const lRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM fin_universal_ledger 
        WHERE company_code = ${effectiveCode}
      `);
      ledgerCount = Number(lRes.rows[0]?.cnt || 0);
    }
    if (ledgerCount === 0 && effectiveId) {
      const lRes2 = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM fin_universal_ledger 
        WHERE legal_entity_id = ${effectiveId}
      `);
      ledgerCount = Number(lRes2.rows[0]?.cnt || 0);
    }

    if (ledgerCount > 0) {
      reasons.push({
        code: 'FINANCIAL_POSTINGS_EXIST',
        message: `Financial documents exist (${ledgerCount} Universal Ledger records found).`,
        resolution: 'Company Codes with financial postings cannot be deleted per statutory accounting principles. Deactivate company code or archive financial data.',
        tcode: 'FB03',
        count: ledgerCount,
      });
    }
  } catch (err: any) {
    console.warn('Check fin_universal_ledger:', err.message);
  }

  // 2. Check Operational Documents (PO, GR, IV)
  try {
    let docCount = 0;
    if (effectiveCode) {
      const poRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM proc_po 
        WHERE company_code = ${effectiveCode} OR legal_entity_code = ${effectiveCode}
      `);
      docCount += Number(poRes.rows[0]?.cnt || 0);

      const grRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM proc_gr 
        WHERE company_code = ${effectiveCode} OR legal_entity_code = ${effectiveCode}
      `);
      docCount += Number(grRes.rows[0]?.cnt || 0);

      const ivRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM proc_iv 
        WHERE company_code = ${effectiveCode} OR legal_entity_code = ${effectiveCode}
      `);
      docCount += Number(ivRes.rows[0]?.cnt || 0);
    }

    if (docCount > 0) {
      reasons.push({
        code: 'LOGISTICS_DOCUMENTS_EXIST',
        message: `Logistics operational documents exist (${docCount} PO, GR, or IV documents found).`,
        resolution: 'Company Code has active procurement and material documents. Cannot delete without archiving logistics history.',
        tcode: 'ME23N',
        count: docCount,
      });
    }
  } catch {}

  // 3. Check Plant Assignments (OX18 / EFLA)
  try {
    let plantAssignCount = 0;
    if (effectiveCode) {
      const pRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM org_plant_company_code 
        WHERE company_code = ${effectiveCode}
      `);
      plantAssignCount += Number(pRes.rows[0]?.cnt || 0);
    }
    if (effectiveId) {
      const facRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM org_facility 
        WHERE legal_entity_id = ${effectiveId}
      `);
      plantAssignCount += Number(facRes.rows[0]?.cnt || 0);
    }

    if (plantAssignCount > 0) {
      reasons.push({
        code: 'PLANTS_ASSIGNED',
        message: `${plantAssignCount} Plant(s) are assigned to this Company Code.`,
        resolution: 'Unassign plants in transaction EFLA (legacy OX18) before deleting the Company Code.',
        tcode: 'OX18',
        count: plantAssignCount,
      });
    }
  } catch {}

  // 4. Check Purchasing & Sales Org Assignments (OX01, OVX3)
  try {
    let orgAssignCount = 0;
    if (effectiveCode) {
      const poRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM org_purchasing_org_company_code 
        WHERE company_code = ${effectiveCode}
      `);
      orgAssignCount += Number(poRes.rows[0]?.cnt || 0);

      const soRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM org_sales_org_company_code 
        WHERE company_code = ${effectiveCode}
      `);
      orgAssignCount += Number(soRes.rows[0]?.cnt || 0);
    }

    if (orgAssignCount > 0) {
      reasons.push({
        code: 'COMMERCIAL_ORGS_ASSIGNED',
        message: `${orgAssignCount} Purchasing or Sales Organization(s) are assigned to this Company Code.`,
        resolution: 'Remove Purchasing Org (EPCA / OX01) and Sales Org (ESCA / OVX3) assignments first.',
        tcode: 'OX01',
        count: orgAssignCount,
      });
    }
  } catch {}

  const canDelete = reasons.length === 0;

  return {
    canDelete,
    entityType: 'Company Code / Legal Entity',
    entityIdentifier: String(identifier),
    errorTitle: `Company Code ${identifier} cannot be deleted`,
    reasons,
    deactivationAction: !canDelete ? {
      type: 'DELETION_FLAG',
      label: 'Set Inactive / Deactivation Flag',
      endpoint: '/api/legal-entities',
      payload: {
        id: effectiveId,
        code: effectiveCode,
        is_active: false,
      },
    } : undefined,
  };
}

/**
 * 4. Validate Plant / Facility Deletion (EFCC / OX10)
 * SAP Standard Check:
 * - inv_stock_balance: current stock on hand > 0 -> BLOCK
 * - proc_po_line: open PO lines referencing plant -> BLOCK
 * - org_plant_company_code: assigned to Company Code -> BLOCK
 */
export async function validatePlantDeletion(params: {
  id?: string | null;
  code?: string | null;
}): Promise<DeletionPrecheckResult> {
  const { id, code } = params;
  const reasons: DeletionReason[] = [];
  const identifier = code || id || 'UNKNOWN';

  let facRecord: any = null;
  try {
    if (id) {
      const res = await db.execute(sql`SELECT * FROM org_facility WHERE id = ${id} LIMIT 1`);
      facRecord = res.rows[0];
    } else if (code) {
      const res = await db.execute(sql`SELECT * FROM org_facility WHERE code = ${code} LIMIT 1`);
      facRecord = res.rows[0];
    }
  } catch {}

  const effectiveId = facRecord?.id || id;
  const effectiveCode = facRecord?.code || code;

  // 1. Check Physical Stock Balances (MMBE / ISTV)
  try {
    let stockCount = 0;
    if (effectiveId) {
      const sRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM inv_stock_balance 
        WHERE facility_id = ${effectiveId} AND quantity > 0
      `);
      stockCount += Number(sRes.rows[0]?.cnt || 0);
    }
    if (stockCount === 0 && effectiveCode) {
      const sRes2 = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM inv_stock_balance 
        WHERE facility_code = ${effectiveCode} AND quantity > 0
      `);
      stockCount += Number(sRes2.rows[0]?.cnt || 0);
    }

    if (stockCount > 0) {
      reasons.push({
        code: 'PHYSICAL_STOCK_EXISTS',
        message: `Physical inventory stock is currently held at this plant (${stockCount} positive stock balance records).`,
        resolution: 'Transfer or write off all inventory balances to zero in transaction MIGO / IGRC before deleting.',
        tcode: 'MMBE',
        count: stockCount,
      });
    }
  } catch {}

  // 2. Check Open Purchase Order Lines (ME23N / PPOC)
  try {
    let poLineCount = 0;
    if (effectiveId) {
      const pRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM proc_po_line 
        WHERE facility_id = ${effectiveId} OR plant_id = ${effectiveId}
      `);
      poLineCount += Number(pRes.rows[0]?.cnt || 0);
    }
    if (poLineCount === 0 && effectiveCode) {
      const pRes2 = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM proc_po_line 
        WHERE facility_code = ${effectiveCode} OR plant_code = ${effectiveCode}
      `);
      poLineCount += Number(pRes2.rows[0]?.cnt || 0);
    }

    if (poLineCount > 0) {
      reasons.push({
        code: 'OPEN_PURCHASE_DOCUMENTS_EXIST',
        message: `Purchase orders reference this plant (${poLineCount} PO lines found).`,
        resolution: 'Complete or cancel open Purchase Orders referencing this plant before attempting deletion.',
        tcode: 'ME22N',
        count: poLineCount,
      });
    }
  } catch {}

  // 3. Check Company Code Assignment (OX18 / EFLA)
  try {
    let assignCount = 0;
    if (effectiveCode) {
      const aRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM org_plant_company_code 
        WHERE plant_code = ${effectiveCode}
      `);
      assignCount = Number(aRes.rows[0]?.cnt || 0);
    }

    if (assignCount > 0) {
      reasons.push({
        code: 'ASSIGNED_TO_COMPANY_CODE',
        message: `Plant is assigned to Company Code in Enterprise Structure.`,
        resolution: 'Remove assignment in transaction EFLA (legacy OX18) first.',
        tcode: 'OX18',
        count: assignCount,
      });
    }
  } catch {}

  const canDelete = reasons.length === 0;

  return {
    canDelete,
    entityType: 'Plant / Facility',
    entityIdentifier: String(identifier),
    errorTitle: `Plant ${identifier} cannot be deleted`,
    reasons,
    deactivationAction: !canDelete ? {
      type: 'DELETION_FLAG',
      label: 'Set Inactive / Deactivation Flag',
      endpoint: '/api/facilities',
      payload: {
        id: effectiveId,
        code: effectiveCode,
        is_active: false,
      },
    } : undefined,
  };
}
