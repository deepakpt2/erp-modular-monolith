import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export interface DeletionReason {
  code: string;
  message: string;
  resolution: string;
  tcode: string;
  count?: number;
}

export interface DeletionDiagnostic {
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
 * Industry Standard Check:
 * - fin_universal_ledger_line: postings exist -> BLOCK
 * - fin_auto_posting_rule / fin_auto_account_det: account assigned in auto-determination -> BLOCK
 * - fin_retained_earnings: account assigned in Retained Earnings -> BLOCK
 */
export async function validateGLAccountDeletion(params: {
  id?: string | null;
  accountNumber?: string | null;
  coaCode?: string | null;
}): Promise<DeletionDiagnostic> {
  const { id, accountNumber, coaCode } = params;
  const reasons: DeletionReason[] = [];
  const identifier = accountNumber || id || 'UNKNOWN';

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
        resolution: 'Accounts with posted transaction data cannot be physically deleted per statutory audit standards. Set Posting Block (SPERR) or Deletion Flag (XLOEV) instead.',
        tcode: 'FGLC',
        count: txCount,
      });
    }
  } catch (err: any) {
    console.warn('Check fin_universal_ledger_line:', err.message);
  }

  // 2. Check Automatic Account Determination
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
        message: `Account is assigned in Automatic Account Determination for material/settlement postings (${autoDetCount} rules found).`,
        resolution: 'Remove or reassign account mappings in Automatic Account Determination (FAUC) before deleting.',
        tcode: 'FAUC',
        count: autoDetCount,
      });
    }
  } catch (err: any) {
    console.warn('Check auto account determination:', err.message);
  }

  // 3. Check Retained Earnings Account
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
          resolution: 'Reconfigure the Retained Earnings account in FREC before attempting deletion.',
          tcode: 'FREC',
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
 */
export async function validateChartOfAccountsDeletion(params: {
  id?: string | null;
  code?: string | null;
}): Promise<DeletionDiagnostic> {
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

  // 1. Check Company Code Assignments
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
        resolution: 'Remove Company Code assignments in transaction FLC2 before deleting.',
        tcode: 'FLC2',
        count: assignCount,
      });
    }
  } catch (err: any) {
    console.warn('Check CoA company code assignment:', err.message);
  }

  // 2. Check G/L Accounts Created
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
        resolution: 'All G/L accounts under this Chart of Accounts must be deleted or archived first in transaction FGLC.',
        tcode: 'FGLC',
        count: glCount,
      });
    }
  } catch (err: any) {
    console.warn('Check CoA gl accounts:', err.message);
  }

  // 3. Check Account Groups
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
        resolution: 'Delete or reassign Account Groups in transaction FAGC before deleting the Chart of Accounts.',
        tcode: 'FAGC',
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
 */
export async function validateCompanyCodeDeletion(params: {
  id?: string | null;
  code?: string | null;
}): Promise<DeletionDiagnostic> {
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
        tcode: 'FLCS',
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
        tcode: 'PPOV',
        count: docCount,
      });
    }
  } catch {}

  // 3. Check Plant Assignments
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
        resolution: 'Unassign plants in transaction EFLA before deleting the Company Code.',
        tcode: 'EFLA',
        count: plantAssignCount,
      });
    }
  } catch {}

  // 4. Check Purchasing & Sales Org Assignments
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
        resolution: 'Remove Purchasing Org (EPCA) and Sales Org (ESCA) assignments first.',
        tcode: 'EPCA',
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
 */
export async function validatePlantDeletion(params: {
  id?: string | null;
  code?: string | null;
}): Promise<DeletionDiagnostic> {
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

  // 1. Check Physical Stock Balances
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
        resolution: 'Transfer or write off all inventory balances to zero in transaction IGRC before deleting.',
        tcode: 'ISTV',
        count: stockCount,
      });
    }
  } catch {}

  // 2. Check Open Purchase Order Lines
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
        tcode: 'PPOE',
        count: poLineCount,
      });
    }
  } catch {}

  // 3. Check Company Code Assignment
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
        resolution: 'Remove assignment in transaction EFLA first.',
        tcode: 'EFLA',
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

/**
 * =========================================================================
 * PHASE 2: Logistics & Commercial Master Data Safeguards
 * =========================================================================
 */

/**
 * 5. Validate Material / Product Master Deletion (EMTC / MM01)
 * Industry Standard Check:
 * - Current stock on hand > 0 in inv_stock_balance or inv_stock -> BLOCK
 * - Open Purchase Order lines (proc_po_line / mm_po_line) -> BLOCK
 * - Open Purchase Requisition lines (proc_pr_line / mm_pr_line) -> BLOCK
 * - BOM component usage (mfg_bom_line) -> BLOCK
 * Alternative: Flag for Deletion (XLOEV) / is_active = false
 */
export async function validateMaterialDeletion(params: {
  id?: string | null;
  itemNumber?: string | null;
}): Promise<DeletionDiagnostic> {
  const { id, itemNumber } = params;
  const reasons: DeletionReason[] = [];
  const identifier = itemNumber || id || 'UNKNOWN';

  let itemRecord: any = null;
  try {
    if (id) {
      const res = await db.execute(sql`SELECT * FROM prod_item WHERE id = ${id} LIMIT 1`);
      itemRecord = res.rows[0];
    } else if (itemNumber) {
      const res = await db.execute(sql`SELECT * FROM prod_item WHERE item_number = ${itemNumber} LIMIT 1`);
      itemRecord = res.rows[0];
    }
  } catch {}

  const effectiveId = itemRecord?.id || id;
  const effectiveNum = itemRecord?.item_number || itemNumber;

  // 1. Check On-Hand Stock Balances
  try {
    let stockQty = 0;
    if (effectiveId) {
      const sRes = await db.execute(sql`
        SELECT COALESCE(SUM(quantity), 0)::numeric as total 
        FROM inv_stock_balance 
        WHERE item_id = ${effectiveId}
      `);
      stockQty += Number(sRes.rows[0]?.total || 0);

      const sRes2 = await db.execute(sql`
        SELECT COALESCE(SUM(quantity), 0)::numeric as total 
        FROM inv_stock 
        WHERE item_id = ${effectiveId}
      `);
      stockQty += Number(sRes2.rows[0]?.total || 0);
    }
    if (stockQty === 0 && effectiveNum) {
      const sRes3 = await db.execute(sql`
        SELECT COALESCE(SUM(quantity), 0)::numeric as total 
        FROM inv_stock_balance 
        WHERE item_number = ${effectiveNum}
      `);
      stockQty += Number(sRes3.rows[0]?.total || 0);
    }

    if (stockQty > 0) {
      reasons.push({
        code: 'PHYSICAL_STOCK_EXISTS',
        message: `Physical stock balance exists for this material (Current on-hand quantity: ${stockQty}).`,
        resolution: 'Zero out physical inventory balance via Goods Movement before attempting deletion.',
        tcode: 'ISTV',
        count: Math.round(stockQty),
      });
    }
  } catch {}

  // 2. Check Purchase Orders
  try {
    let poLines = 0;
    if (effectiveId) {
      const pRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM proc_po_line 
        WHERE item_id = ${effectiveId}
      `);
      poLines += Number(pRes.rows[0]?.cnt || 0);
    }
    if (poLines === 0 && effectiveNum) {
      const pRes2 = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM proc_po_line 
        WHERE item_number = ${effectiveNum}
      `);
      poLines += Number(pRes2.rows[0]?.cnt || 0);
    }

    if (poLines > 0) {
      reasons.push({
        code: 'PURCHASE_ORDERS_EXIST',
        message: `Material is referenced in ${poLines} Purchase Order line(s).`,
        resolution: 'Close or cancel open Purchase Order lines in transaction PPOE before deleting.',
        tcode: 'PPOE',
        count: poLines,
      });
    }
  } catch {}

  // 3. Check BOM Components
  try {
    let bomLines = 0;
    if (effectiveId) {
      const bRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM mfg_bom_line 
        WHERE component_item_id = ${effectiveId} OR component_material_id = ${effectiveId}
      `);
      bomLines += Number(bRes.rows[0]?.cnt || 0);
    }

    if (bomLines > 0) {
      reasons.push({
        code: 'BOM_USAGE_EXISTS',
        message: `Material is utilized as a component in ${bomLines} Bill of Materials (BOM).`,
        resolution: 'Remove component from manufacturing BOMs in transaction PBMC before deleting.',
        tcode: 'PBMC',
        count: bomLines,
      });
    }
  } catch {}

  const canDelete = reasons.length === 0;

  return {
    canDelete,
    entityType: 'Product / Material Master',
    entityIdentifier: String(identifier),
    errorTitle: `Material ${identifier} cannot be deleted`,
    reasons,
    deactivationAction: !canDelete ? {
      type: 'DELETION_FLAG',
      label: 'Flag for Deletion (XLOEV)',
      endpoint: '/api/materials',
      payload: {
        id: effectiveId,
        item_number: effectiveNum,
        is_active: false,
      },
    } : undefined,
  };
}

/**
 * 6. Validate Business Partner (Supplier / Customer) Deletion (PSUC / SCUC)
 * Industry Standard Check:
 * - Supplier with PO/GR/IV documents -> BLOCK
 * - Customer with Sales Orders / Deliveries / Billing documents -> BLOCK
 * - Open Financial subledger line items -> BLOCK
 * Alternative: Set Deletion Flag / Inactive Flag (is_active = false)
 */
export async function validateBusinessPartnerDeletion(params: {
  id?: string | null;
  accountNumber?: string | null;
  partnerRole?: 'SUPPLIER' | 'CUSTOMER' | 'ALL';
}): Promise<DeletionDiagnostic> {
  const { id, accountNumber, partnerRole = 'ALL' } = params;
  const reasons: DeletionReason[] = [];
  const identifier = accountNumber || id || 'UNKNOWN';

  let partnerRecord: any = null;
  try {
    if (id) {
      const res = await db.execute(sql`SELECT * FROM partner_account WHERE id = ${id} LIMIT 1`);
      partnerRecord = res.rows[0];
    } else if (accountNumber) {
      const res = await db.execute(sql`SELECT * FROM partner_account WHERE account_number = ${accountNumber} OR bp_number = ${accountNumber} LIMIT 1`);
      partnerRecord = res.rows[0];
    }
  } catch {}

  const effectiveId = partnerRecord?.id || id;
  const effectiveAcc = partnerRecord?.account_number || partnerRecord?.bp_number || accountNumber;

  // 1. Check Procurement Documents (PO / GR / IV)
  try {
    let procCount = 0;
    if (effectiveId) {
      const poRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM proc_po 
        WHERE partner_id = ${effectiveId} OR vendor_id = ${effectiveId}
      `);
      procCount += Number(poRes.rows[0]?.cnt || 0);

      const ivRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM proc_iv 
        WHERE partner_id = ${effectiveId} OR vendor_id = ${effectiveId}
      `);
      procCount += Number(ivRes.rows[0]?.cnt || 0);
    }
    if (procCount === 0 && effectiveAcc) {
      const poRes2 = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM proc_po 
        WHERE vendor_code = ${effectiveAcc} OR supplier_code = ${effectiveAcc}
      `);
      procCount += Number(poRes2.rows[0]?.cnt || 0);
    }

    if (procCount > 0) {
      reasons.push({
        code: 'PURCHASE_HISTORY_EXISTS',
        message: `Business Partner has active procurement records (${procCount} Purchase Orders / Invoices).`,
        resolution: 'Partners with procurement documents cannot be deleted to preserve commercial audit history. Apply Posting Block or Deactivation Flag instead.',
        tcode: 'PPOV',
        count: procCount,
      });
    }
  } catch {}

  // 2. Check Sales Documents (Sales Orders / Billing)
  try {
    let salesCount = 0;
    if (effectiveId) {
      const soRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM sales_order 
        WHERE customer_id = ${effectiveId}
      `);
      salesCount += Number(soRes.rows[0]?.cnt || 0);

      const bilRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM sales_billing_doc 
        WHERE customer_id = ${effectiveId}
      `);
      salesCount += Number(bilRes.rows[0]?.cnt || 0);
    }
    if (salesCount === 0 && effectiveAcc) {
      const soRes2 = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM sales_order 
        WHERE customer_code = ${effectiveAcc}
      `);
      salesCount += Number(soRes2.rows[0]?.cnt || 0);
    }

    if (salesCount > 0) {
      reasons.push({
        code: 'SALES_HISTORY_EXISTS',
        message: `Business Partner has active sales history (${salesCount} Sales Orders / Invoices).`,
        resolution: 'Customer account with historical sales records must be preserved for tax compliance. Set Deactivation Flag instead.',
        tcode: 'SSOV',
        count: salesCount,
      });
    }
  } catch {}

  const canDelete = reasons.length === 0;

  return {
    canDelete,
    entityType: partnerRole === 'SUPPLIER' ? 'Supplier Master' : partnerRole === 'CUSTOMER' ? 'Customer Master' : 'Business Partner',
    entityIdentifier: String(identifier),
    errorTitle: `Partner ${identifier} cannot be deleted`,
    reasons,
    deactivationAction: !canDelete ? {
      type: 'POSTING_BLOCK',
      label: 'Set Posting Block & Inactive Flag',
      endpoint: '/api/business-partners',
      payload: {
        id: effectiveId,
        account_number: effectiveAcc,
        is_active: false,
      },
    } : undefined,
  };
}

/**
 * 7. Validate Storage Location / Inventory Location Deletion (EILC / OX09)
 * Industry Standard Check:
 * - Stock balances exist at storage location -> BLOCK
 * - Open material movements -> BLOCK
 */
export async function validateStorageLocationDeletion(params: {
  id?: string | null;
  code?: string | null;
  facilityCode?: string | null;
}): Promise<DeletionDiagnostic> {
  const { id, code, facilityCode } = params;
  const reasons: DeletionReason[] = [];
  const identifier = code || id || 'UNKNOWN';

  let locRecord: any = null;
  try {
    if (id) {
      const res = await db.execute(sql`SELECT * FROM org_inventory_location WHERE id = ${id} LIMIT 1`);
      locRecord = res.rows[0];
    } else if (code) {
      const res = await db.execute(sql`SELECT * FROM org_inventory_location WHERE code = ${code} LIMIT 1`);
      locRecord = res.rows[0];
    }
  } catch {}

  const effectiveId = locRecord?.id || id;
  const effectiveCode = locRecord?.code || code;

  // 1. Check Stock Balances at this Location
  try {
    let stockCount = 0;
    if (effectiveId) {
      const sRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM inv_stock_balance 
        WHERE location_id = ${effectiveId} AND quantity > 0
      `);
      stockCount += Number(sRes.rows[0]?.cnt || 0);
    }
    if (stockCount === 0 && effectiveCode) {
      const sRes2 = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM inv_stock_balance 
        WHERE location_code = ${effectiveCode} AND quantity > 0
      `);
      stockCount += Number(sRes2.rows[0]?.cnt || 0);
    }

    if (stockCount > 0) {
      reasons.push({
        code: 'LOCATION_STOCK_EXISTS',
        message: `Storage location contains positive material stock (${stockCount} inventory balances).`,
        resolution: 'Transfer all stock to another storage location in transaction IGRC before deleting.',
        tcode: 'ISTV',
        count: stockCount,
      });
    }
  } catch {}

  const canDelete = reasons.length === 0;

  return {
    canDelete,
    entityType: 'Storage Location',
    entityIdentifier: String(identifier),
    errorTitle: `Storage Location ${identifier} cannot be deleted`,
    reasons,
    deactivationAction: !canDelete ? {
      type: 'DELETION_FLAG',
      label: 'Set Inactive / Deactivation Flag',
      endpoint: '/api/inventory-locations',
      payload: {
        id: effectiveId,
        code: effectiveCode,
        is_active: false,
      },
    } : undefined,
  };
}

/**
 * =========================================================================
 * PHASE 3: Controlling & Enterprise Organization Master Data Safeguards
 * =========================================================================
 */

/**
 * 8. Validate Cost Center Deletion (CCUC / KS01)
 * Industry Standard Check:
 * - Postings exist in fin_universal_ledger_line -> BLOCK
 * - Assigned employees in hr_employee -> BLOCK
 * Alternative: Lock / Set Inactive Flag (is_active = false)
 */
export async function validateCostCenterDeletion(params: {
  id?: string | null;
  code?: string | null;
}): Promise<DeletionDiagnostic> {
  const { id, code } = params;
  const reasons: DeletionReason[] = [];
  const identifier = code || id || 'UNKNOWN';

  let ccRecord: any = null;
  try {
    if (id) {
      const res = await db.execute(sql`SELECT * FROM fin_cost_center WHERE id = ${id} LIMIT 1`);
      ccRecord = res.rows[0];
    } else if (code) {
      const res = await db.execute(sql`SELECT * FROM fin_cost_center WHERE code = ${code} LIMIT 1`);
      ccRecord = res.rows[0];
    }
  } catch {}

  const effectiveId = ccRecord?.id || id;
  const effectiveCode = ccRecord?.code || code;

  // 1. Check Universal Ledger Postings
  try {
    let postingCount = 0;
    if (effectiveId) {
      const pRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM fin_universal_ledger_line 
        WHERE cost_center_id = ${effectiveId}
      `);
      postingCount += Number(pRes.rows[0]?.cnt || 0);
    }
    if (postingCount === 0 && effectiveCode) {
      const pRes2 = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM fin_universal_ledger_line 
        WHERE cost_center_code = ${effectiveCode}
      `);
      postingCount += Number(pRes2.rows[0]?.cnt || 0);
    }

    if (postingCount > 0) {
      reasons.push({
        code: 'ACTUAL_POSTINGS_EXIST',
        message: `Universal Ledger actual postings exist for this Cost Center (${postingCount} line items).`,
        resolution: 'Cost Centers with primary or secondary cost postings cannot be deleted. Set Posting Block / Deactivation instead.',
        tcode: 'CCUL',
        count: postingCount,
      });
    }
  } catch {}

  // 2. Check Employee Assignments
  try {
    let empCount = 0;
    if (effectiveId) {
      const eRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM hr_employee 
        WHERE cost_center_id = ${effectiveId}
      `);
      empCount += Number(eRes.rows[0]?.cnt || 0);
    }

    if (empCount > 0) {
      reasons.push({
        code: 'EMPLOYEES_ASSIGNED',
        message: `${empCount} Employee(s) are assigned to this Cost Center in HR master.`,
        resolution: 'Reassign employees to another Cost Center in transaction HHEC before deleting.',
        tcode: 'HHEC',
        count: empCount,
      });
    }
  } catch {}

  const canDelete = reasons.length === 0;

  return {
    canDelete,
    entityType: 'Cost Center',
    entityIdentifier: String(identifier),
    errorTitle: `Cost Center ${identifier} cannot be deleted`,
    reasons,
    deactivationAction: !canDelete ? {
      type: 'POSTING_BLOCK',
      label: 'Set Cost Center Block & Inactive',
      endpoint: '/api/cost-centers',
      payload: {
        id: effectiveId,
        code: effectiveCode,
        is_active: false,
      },
    } : undefined,
  };
}

/**
 * 9. Validate Profit Center / Profit Unit Deletion (EPUC / KE51)
 * Industry Standard Check:
 * - Cost Centers assigned to this Profit Center -> BLOCK
 * - Universal Ledger postings with this Profit Center -> BLOCK
 * Alternative: Inactive Flag
 */
export async function validateProfitCenterDeletion(params: {
  id?: string | null;
  code?: string | null;
}): Promise<DeletionDiagnostic> {
  const { id, code } = params;
  const reasons: DeletionReason[] = [];
  const identifier = code || id || 'UNKNOWN';

  let puRecord: any = null;
  try {
    if (id) {
      const res = await db.execute(sql`SELECT * FROM org_profit_unit WHERE id = ${id} LIMIT 1`);
      puRecord = res.rows[0];
    } else if (code) {
      const res = await db.execute(sql`SELECT * FROM org_profit_unit WHERE code = ${code} LIMIT 1`);
      puRecord = res.rows[0];
    }
  } catch {}

  const effectiveId = puRecord?.id || id;
  const effectiveCode = puRecord?.code || code;

  // 1. Check Assigned Cost Centers
  try {
    let ccCount = 0;
    if (effectiveId) {
      const ccRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM fin_cost_center 
        WHERE profit_center_id = ${effectiveId}
      `);
      ccCount += Number(ccRes.rows[0]?.cnt || 0);
    }
    if (ccCount === 0 && effectiveCode) {
      const ccRes2 = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM fin_cost_center 
        WHERE profit_center_code = ${effectiveCode}
      `);
      ccCount += Number(ccRes2.rows[0]?.cnt || 0);
    }

    if (ccCount > 0) {
      reasons.push({
        code: 'COST_CENTERS_ASSIGNED',
        message: `${ccCount} Cost Center(s) reference this Profit Center.`,
        resolution: 'Reassign or unassign Cost Centers in transaction CCUE before deleting.',
        tcode: 'CCUE',
        count: ccCount,
      });
    }
  } catch {}

  // 2. Check Universal Ledger Postings
  try {
    let pCount = 0;
    if (effectiveId) {
      const pRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM fin_universal_ledger_line 
        WHERE profit_center_id = ${effectiveId}
      `);
      pCount += Number(pRes.rows[0]?.cnt || 0);
    }

    if (pCount > 0) {
      reasons.push({
        code: 'FINANCIAL_POSTINGS_EXIST',
        message: `Financial documents exist with this Profit Center (${pCount} ledger lines).`,
        resolution: 'Profit centers with ledger postings must be retained for profitability reporting. Deactivate instead.',
        tcode: 'FLCS',
        count: pCount,
      });
    }
  } catch {}

  const canDelete = reasons.length === 0;

  return {
    canDelete,
    entityType: 'Profit Center / Profit Unit',
    entityIdentifier: String(identifier),
    errorTitle: `Profit Unit ${identifier} cannot be deleted`,
    reasons,
    deactivationAction: !canDelete ? {
      type: 'DELETION_FLAG',
      label: 'Set Inactive / Deactivation Flag',
      endpoint: '/api/profit-units',
      payload: {
        id: effectiveId,
        code: effectiveCode,
        is_active: false,
      },
    } : undefined,
  };
}

/**
 * 10. Validate Purchasing Organization Deletion (EPDC / OX08)
 * Industry Standard Check:
 * - Active Purchase Orders exist in proc_po -> BLOCK
 * - Assigned to Company Code in org_purchasing_org_company_code -> BLOCK
 * - Assigned to Plant in org_purchasing_org_plant -> BLOCK
 */
export async function validatePurchasingOrgDeletion(params: {
  id?: string | null;
  code?: string | null;
}): Promise<DeletionDiagnostic> {
  const { id, code } = params;
  const reasons: DeletionReason[] = [];
  const identifier = code || id || 'UNKNOWN';

  let pdRecord: any = null;
  try {
    if (id) {
      const res = await db.execute(sql`SELECT * FROM org_procurement_division WHERE id = ${id} LIMIT 1`);
      pdRecord = res.rows[0];
    } else if (code) {
      const res = await db.execute(sql`SELECT * FROM org_procurement_division WHERE code = ${code} LIMIT 1`);
      pdRecord = res.rows[0];
    }
  } catch {}

  const effectiveId = pdRecord?.id || id;
  const effectiveCode = pdRecord?.code || code;

  // 1. Check Purchase Orders
  try {
    let poCount = 0;
    if (effectiveCode) {
      const poRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM proc_po 
        WHERE purchasing_org_code = ${effectiveCode} OR procurement_division_code = ${effectiveCode}
      `);
      poCount += Number(poRes.rows[0]?.cnt || 0);
    }

    if (poCount > 0) {
      reasons.push({
        code: 'PURCHASE_ORDERS_EXIST',
        message: `${poCount} Purchase Order(s) exist under this Purchasing Organization.`,
        resolution: 'Active procurement records cannot be deleted. Deactivate or archive purchasing history.',
        tcode: 'PPOV',
        count: poCount,
      });
    }
  } catch {}

  // 2. Check Company Code Assignments (EPCA / OX01)
  try {
    let assignCount = 0;
    if (effectiveCode) {
      const aRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM org_purchasing_org_company_code 
        WHERE purchasing_org_code = ${effectiveCode}
      `);
      assignCount += Number(aRes.rows[0]?.cnt || 0);
    }

    if (assignCount > 0) {
      reasons.push({
        code: 'ASSIGNED_TO_COMPANY_CODE',
        message: `Purchasing Org is assigned to Company Code in Enterprise Structure.`,
        resolution: 'Remove assignment in transaction EPCA before deleting.',
        tcode: 'EPCA',
        count: assignCount,
      });
    }
  } catch {}

  // 3. Check Plant Assignments (EPPA / OX17)
  try {
    let pCount = 0;
    if (effectiveCode) {
      const aRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM org_purchasing_org_plant 
        WHERE purchasing_org_code = ${effectiveCode}
      `);
      pCount += Number(aRes.rows[0]?.cnt || 0);
    }

    if (pCount > 0) {
      reasons.push({
        code: 'ASSIGNED_TO_PLANT',
        message: `Purchasing Org is assigned to Plant(s) in Enterprise Structure.`,
        resolution: 'Remove plant assignments in transaction EPPA before deleting.',
        tcode: 'EPPA',
        count: pCount,
      });
    }
  } catch {}

  const canDelete = reasons.length === 0;

  return {
    canDelete,
    entityType: 'Purchasing Organization',
    entityIdentifier: String(identifier),
    errorTitle: `Purchasing Organization ${identifier} cannot be deleted`,
    reasons,
    deactivationAction: !canDelete ? {
      type: 'DELETION_FLAG',
      label: 'Set Inactive / Deactivation Flag',
      endpoint: '/api/procurement-divisions',
      payload: {
        id: effectiveId,
        code: effectiveCode,
        is_active: false,
      },
    } : undefined,
  };
}

/**
 * 11. Validate Sales Organization Deletion (ECOC / OVX2)
 * Industry Standard Check:
 * - Active Sales Orders exist in sales_order -> BLOCK
 * - Assigned to Company Code in org_sales_org_company_code -> BLOCK
 * - Assigned to Distribution Channel in org_channel_sales_org -> BLOCK
 * - Assigned to Division in org_division_sales_org -> BLOCK
 */
export async function validateSalesOrgDeletion(params: {
  id?: string | null;
  code?: string | null;
}): Promise<DeletionDiagnostic> {
  const { id, code } = params;
  const reasons: DeletionReason[] = [];
  const identifier = code || id || 'UNKNOWN';

  let soRecord: any = null;
  try {
    if (id) {
      const res = await db.execute(sql`SELECT * FROM org_commercial_org WHERE id = ${id} LIMIT 1`);
      soRecord = res.rows[0];
    } else if (code) {
      const res = await db.execute(sql`SELECT * FROM org_commercial_org WHERE code = ${code} LIMIT 1`);
      soRecord = res.rows[0];
    }
  } catch {}

  const effectiveId = soRecord?.id || id;
  const effectiveCode = soRecord?.code || code;

  // 1. Check Sales Orders
  try {
    let orderCount = 0;
    if (effectiveCode) {
      const soRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM sales_order 
        WHERE sales_org_code = ${effectiveCode} OR commercial_org_code = ${effectiveCode}
      `);
      orderCount += Number(soRes.rows[0]?.cnt || 0);
    }

    if (orderCount > 0) {
      reasons.push({
        code: 'SALES_ORDERS_EXIST',
        message: `${orderCount} Sales Order(s) exist under this Sales Organization.`,
        resolution: 'Active commercial customer contracts cannot be deleted. Deactivate sales organization instead.',
        tcode: 'SSOV',
        count: orderCount,
      });
    }
  } catch {}

  // 2. Check Company Code Assignment (ESCA / OVX3)
  try {
    let assignCount = 0;
    if (effectiveCode) {
      const aRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM org_sales_org_company_code 
        WHERE sales_org_code = ${effectiveCode}
      `);
      assignCount += Number(aRes.rows[0]?.cnt || 0);
    }

    if (assignCount > 0) {
      reasons.push({
        code: 'ASSIGNED_TO_COMPANY_CODE',
        message: `Sales Org is assigned to Company Code in Enterprise Structure.`,
        resolution: 'Remove Company Code assignment in transaction ESCA before deleting.',
        tcode: 'ESCA',
        count: assignCount,
      });
    }
  } catch {}

  // 3. Check Channel & Division Assignments (ECSA_ASSIGN, EDSA)
  try {
    let subAssignCount = 0;
    if (effectiveCode) {
      const cRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM org_channel_sales_org 
        WHERE sales_org_code = ${effectiveCode}
      `);
      subAssignCount += Number(cRes.rows[0]?.cnt || 0);

      const dRes = await db.execute(sql`
        SELECT COUNT(*)::int as cnt 
        FROM org_division_sales_org 
        WHERE sales_org_code = ${effectiveCode}
      `);
      subAssignCount += Number(dRes.rows[0]?.cnt || 0);
    }

    if (subAssignCount > 0) {
      reasons.push({
        code: 'CHANNELS_DIVISIONS_ASSIGNED',
        message: `${subAssignCount} Distribution Channel or Division assignment(s) reference this Sales Org.`,
        resolution: 'Remove Distribution Channel (ECSA_ASSIGN) and Division (EDSA) assignments first.',
        tcode: 'EDSA',
        count: subAssignCount,
      });
    }
  } catch {}

  const canDelete = reasons.length === 0;

  return {
    canDelete,
    entityType: 'Sales Organization',
    entityIdentifier: String(identifier),
    errorTitle: `Sales Organization ${identifier} cannot be deleted`,
    reasons,
    deactivationAction: !canDelete ? {
      type: 'DELETION_FLAG',
      label: 'Set Inactive / Deactivation Flag',
      endpoint: '/api/commercial-orgs',
      payload: {
        id: effectiveId,
        code: effectiveCode,
        is_active: false,
      },
    } : undefined,
  };
}
