import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { PayrollService } from '@/modules/hr/application/payrollService';

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { payrollRunId, paymentMethod, bankGlAccountNumber, postedBy, postingDate } = body;

    if (!payrollRunId || !paymentMethod || !postedBy) {
      return NextResponse.json({ error: 'payrollRunId, paymentMethod, postedBy required' }, { status: 400 });
    }

    const result = await PayrollService.postPaymentClearing({
      payrollRunId,
      paymentMethod,
      bankGlAccountNumber,
      postedBy,
      postingDate: postingDate ? new Date(postingDate) : undefined,
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}


export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  return NextResponse.json({
    code: 'PC00',
    functionDescription: 'Payroll – PC00 / PA30 / PA20',
    message: 'Payroll – PC00 / PA30 / PA20 – API payroll – Code PC00 available in app per enforcement rule',
    api: '/api/payroll',
    module: 'payroll',
  });
}
