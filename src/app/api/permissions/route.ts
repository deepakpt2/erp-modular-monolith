import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Permissions API - List all permissions with T-code mapping
 * GET /api/permissions - List permissions grouped by module
 * 
 * Storage: ent_permission table
 * T-code to permission mapping:
 * - ME51N (Create PR) -> PR_CREATE
 * - ME52N (Change PR) -> PR_CREATE
 * - ME53N (Display PR) -> PR_VIEW
 * - ME54N (Release PR) -> PR_APPROVE
 * - ME21N (Create PO) -> PO_CREATE
 * - ME22N (Change PO) -> PO_CREATE
 * - ME23N (Display PO) -> PO_VIEW
 * - ME28 (Release PO) -> PO_APPROVE
 * - MIGO 101 (GR) -> GR_POST
 * - MIGO 102 (GR Reversal) -> GR_POST
 * - MIRO (IV) -> IV_POST
 * - VA01 (Create Sales) -> SALES_CREATE
 * - VL01N (Delivery) -> DELIVERY_CREATE
 * - VF01 (Billing) -> BILLING_CREATE
 * - FS00 (G/L) -> GL_VIEW, GL_POST
 * - KSB1 (CCA) -> CCA_VIEW
 * - PC00 (Payroll) -> PAYROLL_RUN, PAYROLL_APPROVE
 * - MM01 (Material) -> MATERIAL_CREATE
 * - etc
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const permsRes = await db.execute(sql`
      SELECT id, code, name, module, description FROM ent_permission ORDER BY module, code
    `);

    // Group by module
    const grouped: Record<string, any[]> = {};
    for (const perm of permsRes.rows as any[]) {
      if (!grouped[perm.module]) grouped[perm.module] = [];
      grouped[perm.module].push(perm);
    }

    // T-code mapping
    const functionMap = [
      { code: 'ME51N', desc: 'Create PR', perm: 'PR_CREATE', module: 'MM' },
      { code: 'ME52N', desc: 'Change PR', perm: 'PR_CREATE', module: 'MM' },
      { code: 'ME53N', desc: 'Display PR', perm: 'PR_VIEW', module: 'MM' },
      { code: 'ME54N', desc: 'Release PR', perm: 'PR_APPROVE', module: 'MM' },
      { code: 'ME21N', desc: 'Create PO', perm: 'PO_CREATE', module: 'MM' },
      { code: 'ME22N', desc: 'Change PO', perm: 'PO_CREATE', module: 'MM' },
      { code: 'ME23N', desc: 'Display PO', perm: 'PO_VIEW', module: 'MM' },
      { code: 'ME28', desc: 'Release PO', perm: 'PO_APPROVE', module: 'MM' },
      { code: 'MIGO', desc: 'Goods Receipt 101/102', perm: 'GR_POST', module: 'MM' },
      { code: 'MIRO', desc: 'Invoice Verification', perm: 'IV_POST', module: 'MM' },
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
      storage: 'ent_permission table: code, name, module, description',
      howToGivePermission: '1. Create role in ent_role, 2. Assign permissions via ent_role_permission (role_id + permission_id), 3. Assign role to user via ent_user_role (user_id + role_id + company_code_id + plant_id)',
      example: 'Give user ME51N access: assign role PURCHASER which has PR_CREATE permission via POST /api/user-roles { userId, roleId }',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
  }
}
