import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { DocumentFlowService } from '@/modules/audit/application/documentFlowService';

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (type && id) {
    try {
      const flow = await DocumentFlowService.getDocumentFlow(type, id);
      return NextResponse.json(flow);
    } catch (e: any) {
      console.error('Document flow failed:', e.message);
      return NextResponse.json({
      code: 'ALB',
      functionDescription: 'Document Flow – ALB',
 error: e.message, helperCode: 'DB_ERROR' }, { status: 500 });
    }
  }

  return NextResponse.json({
    description: 'Global Document Flow Engine (ERP Document Flow)',
    flows: {
      'PR→PO→GR→IV→Payment': 'PR Purchase Requisition → PO 45xxx → GR 50xxx Material Doc → IV 51xxx → FI WE Dr Inventory BSX Cr GR/IR WRX → FI RE Dr GR/IR Cr Vendor → FI Payment Dr Payable Cr Bank',
      'POS Sales→GI→FI': 'Sales Order SOxxx → GI 601 Material Doc MATDOC-xxx → FI RV Dr Cash/AR Cr Revenue + Dr COGS Cr Inventory',
      'PI→FI': 'Physical Inventory PIxxx → FI SA Dr Loss 500005 Cr Inventory or Dr Inventory Cr Gain',
    },
    table: 'audit_document_flow: root_type/id/number, preceding_type/id/number, succeeding_type/id/number, created_at - append-only WORM-lite relationship trail',
    ui: 'Visual tree with level, parentId, children, color coding by type, icons, amount, posting date, reference, Document Flow button on PO/Sales Order navigates to /audit/document-flow?type=PO&id=xxx',
    example: '/api/document-flow?type=PO&id=po-id → returns chain root PR, nodes with children, totalDocuments, totalValue',
  });
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { precedingDocType, precedingDocId, precedingDocNumber, succeedingDocType, succeedingDocId, succeedingDocNumber, rootDocType, rootDocId, rootDocNumber } = body;

    await DocumentFlowService.createFlowLink({
      precedingDocType,
      precedingDocId,
      precedingDocNumber,
      succeedingDocType,
      succeedingDocId,
      succeedingDocNumber,
      rootDocType,
      rootDocId,
      rootDocNumber,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
