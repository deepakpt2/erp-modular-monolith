import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Permissions API - List all permissions with T-code mapping
 * GET /api/permissions - List permissions grouped by module
 * 
 * Storage: auth_permission table
 * T-code to permission mapping:
 * - PPRC (legacy ME51N) (Create PR) -> PR_CREATE
 * - PPRE (legacy ME52N) (Change PR) -> PR_CREATE
 * - PPRV (legacy ME53N) (Display PR) -> PR_VIEW
 * - PPRL (legacy ME54N) (Release PR) -> PR_APPROVE
 * - PPOC (legacy ME21N) (Create PO) -> PO_CREATE
 * - PPOE (legacy ME22N) (Change PO) -> PO_CREATE
 * - PPOV (legacy ME23N) (Display PO) -> PO_VIEW
 * - PPOR (legacy ME28) (Release PO) -> PO_APPROVE
 * - IGRC GR_PO (legacy IGRC (legacy MIGO) 101) (GR) -> GR_POST
 * - IGRC (legacy MIGO) 102 (GR Reversal) -> GR_POST
 * - PIVC (legacy MIRO) (IV) -> IV_POST
 * - VA01 (Create Sales) -> SALES_CREATE
 * - SDLC (legacy VL01N) (Delivery) -> DELIVERY_CREATE
 * - SBLC (legacy VF01) (Billing) -> BILLING_CREATE
 * - FGLC (legacy FS00) (G/L) -> GL_VIEW, GL_POST
 * - KSB1 (CCA) -> CCA_VIEW
 * - PC00 (Payroll) -> PAYROLL_RUN, PAYROLL_APPROVE
 * - EMTC (legacy MM01) (Material) -> MATERIAL_CREATE
 * - etc
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const permsRes = await db.execute(sql`
      SELECT id, code, name, module, description FROM auth_permission ORDER BY module, code
    `);

    // Group by module
    const grouped: Record<string, any[]> = {};
    for (const perm of permsRes.rows as any[]) {
      if (!grouped[perm.module]) grouped[perm.module] = [];
      grouped[perm.module].push(perm);
    }

    // T-code mapping
    const functionMap = [
      { code: 'PPRC', desc: 'Create PR (legacy ME51N)', perm: 'PR_CREATE', module: 'MM' },
      { code: 'ME52N', desc: 'Change PR', perm: 'PR_CREATE', module: 'MM' },
      { code: 'ME53N', desc: 'Display PR', perm: 'PR_VIEW', module: 'MM' },
      { code: 'ME54N', desc: 'Release PR', perm: 'PR_APPROVE', module: 'MM' },
      { code: 'PPOC', desc: 'Create PO (legacy ME21N)', perm: 'PO_CREATE', module: 'MM' },
      { code: 'ME22N', desc: 'Change PO', perm: 'PO_CREATE', module: 'MM' },
      { code: 'ME23N', desc: 'Display PO', perm: 'PO_VIEW', module: 'MM' },
      { code: 'ME28', desc: 'Release PO', perm: 'PO_APPROVE', module: 'MM' },
      { code: 'IGRC', desc: 'Goods Receipt GR_PO/GR_PO_REV (legacy MIGO 101/102)', perm: 'GR_POST', module: 'MM' },
      { code: 'PIVC', desc: 'Invoice Verification (legacy MIRO)', perm: 'IV_POST', module: 'MM' },
      { code: 'MI01', desc: 'Physical Inventory', perm: 'GR_POST', module: 'MM' },
      { code: 'VA01', desc: 'Create Sales Order', perm: 'SALES_CREATE', module: 'SD' },
      { code: 'VA02', desc: 'Change Sales', perm: 'SALES_CREATE', module: 'SD' },
      { code: 'VA03', desc: 'Display Sales', perm: 'SALES_VIEW', module: 'SD' },
      { code: 'VL01N', desc: 'Outbound Delivery', perm: 'DELIVERY_CREATE', module: 'SD' },
      { code: 'VF01', desc: 'Billing', perm: 'BILLING_CREATE', module: 'SD' },
      { code: 'FS00', desc: 'G/L Account', perm: 'GL_VIEW', module: 'FICO' },
      { code: 'KSB1', desc: 'CCA Report', perm: 'CCA_VIEW', module: 'FICO' },
      { code: 'CK40N', desc: 'Costing Run', perm: 'GL_POST', module: 'FICO' },
      { code: 'F-53', desc: 'Payment', perm: 'GL_POST', module: 'FICO' },
      { code: 'PC00', desc: 'Payroll', perm: 'PAYROLL_RUN', module: 'HR' },
      { code: 'PA30', desc: 'HR Employees', perm: 'EMPLOYEE_VIEW', module: 'HR' },
      { code: 'MM01', desc: 'Create Material', perm: 'MATERIAL_CREATE', module: 'FOUNDATION' },
      { code: 'MM02', desc: 'Change Material', perm: 'MATERIAL_CREATE', module: 'FOUNDATION' },
      { code: 'MM03', desc: 'Display Material', perm: 'MATERIAL_VIEW', module: 'FOUNDATION' },
      { code: 'MMBE', desc: 'Stock Overview', perm: 'MATERIAL_VIEW', module: 'FOUNDATION' },
      { code: 'CS01', desc: 'Create BOM', perm: 'MATERIAL_CREATE', module: 'PP' },
      { code: 'CR01', desc: 'Work Center', perm: 'MATERIAL_VIEW', module: 'PP' },
      { code: 'CA01', desc: 'Routing', perm: 'MATERIAL_VIEW', module: 'PP' },
      { code: 'MD01', desc: 'MRP Run', perm: 'MATERIAL_CREATE', module: 'PP' },
      { code: 'SM20', desc: 'Audit Logs', perm: 'ADMIN_ALL', module: 'AUDIT' },
      { code: 'ALB', desc: 'Document Flow', perm: 'ADMIN_ALL', module: 'AUDIT' },
      { code: 'SBWP', desc: 'Workflow Inbox', perm: 'PR_VIEW', module: 'FOUNDATION' },
    ];

    return NextResponse.json({
      permissions: permsRes.rows,
      grouped,
      functionMapping: functionMap,
      count: permsRes.rows.length,
      storage: 'auth_permission table: code, name, module, description',
      howToGivePermission: '1. Create role in auth_role, 2. Assign permissions via auth_role_permission (role_id + permission_id), 3. Assign role to user via auth_user_role (user_id + role_id + company_code_id + plant_id)',
      example: 'Give user PPRC (legacy ME51N) access: assign role PURCHASER which has PR_CREATE permission via POST /api/user-roles { userId, roleId }',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
  }
}
