import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { PhysicalInventoryService } from '@/modules/foundation/inventory-state/application/physicalInventoryService';

/**
 * Physical Inventory API - PID Workflow with Blocking and Variance FI
 * POST /api/physical-inventory - Create PID snapshot + block 101/261/601
 * PUT /api/physical-inventory/count - Enter count rapid entry
 * PUT /api/physical-inventory/post - Post differences FI Dr Loss Cr Inventory at MAP + release blocking
 */

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { companyCodeId, plantId, slocId, materialIds, plannedCountDate, postingDate, headerText, createdBy } = body;

    if (!companyCodeId || !plantId || !slocId || !createdBy) {
      return NextResponse.json({ error: 'companyCodeId, plantId, slocId, createdBy required' }, { status: 400 });
    }

    const result = await PhysicalInventoryService.createPid({
      companyCodeId,
      plantId,
      slocId,
      materialIds,
      plannedCountDate: plannedCountDate ? new Date(plannedCountDate) : new Date(),
      postingDate: postingDate ? new Date(postingDate) : new Date(),
      headerText,
      createdBy,
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function GET() {
  // Enterprise auth guard - secure by default, MVP open only if MVP_NO_AUTH=true
  const authCheck = await requireApiAuth();
  if (authCheck) return authCheck;

  return NextResponse.json({
      code: 'MI01',
      functionDescription: 'Physical Inventory – MI01/MI04/MI07',

    workflow: 'Create PID → Enter Count → Post Differences',
    blocking: 'When PID active (CREATED, COUNT_ENTERED) and is_blocking_active=true for Plant+SLoc+Material, block 101/261/601 movements via InventoryService check SELECT d.pi_number FROM pi_document JOIN pi_line WHERE plant_id=X AND sloc_id=Y AND status IN (CREATED,COUNT_ENTERED) AND is_blocking_active AND material_id=Z. Prevents moving-target counts.',
    variancePosting: {
      shrinkage: 'Missing stock (counted < system, variance negative): Issue via 551, FI Dr Inventory Loss/Shrinkage 500005 Expense Cr Inventory Asset 100000 at MAP',
      surplus: 'Extra stock (counted > system, variance positive): Receipt via 561, FI Dr Inventory Asset Cr Gain 400002 at MAP',
      balanced: 'Total Debit = Total Credit = Σ abs(varianceValue)',
    },
    endpoints: {
      'POST /api/physical-inventory': 'Create PID snapshot system qty for SLoc, activates blocking',
      'PUT /api/physical-inventory/count': 'Enter count rapid entry via keyboard Tab/Arrow, real-time variance',
      'PUT /api/physical-inventory/post': 'Post differences, FI variance at MAP, release blocking',
    },
    ui: 'High-density count sheet @tanstack/react-virtual 300 batches → 17 DOM, keyboard Tab/Arrow rapid entry down countedQty column, real-time variance System vs Counted before commit',
  });
}
