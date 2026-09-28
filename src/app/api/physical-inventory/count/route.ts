import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { PhysicalInventoryService } from '@/modules/foundation/inventory-state/application/physicalInventoryService';

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { piId, counts } = body;
    if (!piId || !counts) return NextResponse.json({ error: 'piId, counts required' }, { status: 400 });

    const result = await PhysicalInventoryService.enterCount({ piId, counts });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}


export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  return NextResponse.json({
    code: 'MI01',
    functionDescription: 'Physical Inventory – MI01/MI04/MI07',
    message: 'Physical Inventory – MI01/MI04/MI07 – API physical-inventory – Code MI01 available in app per enforcement rule',
    api: '/api/physical-inventory',
    module: 'physical-inventory',
  });
}
