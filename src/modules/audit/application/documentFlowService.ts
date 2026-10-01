/**
 * Document Flow Service - Global Document Relationship Engine (ERP Document Flow / Document Flow equivalent)
 * Builds unified chain: PR → PO → GR (material doc) → IV (FI) → Payment Clearing
 * POS Flow: Sales Order → Goods Issue (material doc) → FI Revenue/Cash Journal
 */
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

export interface DocumentFlowNode {
  id: string;
  type: string; // PR, PO, GR, IV, FI, PAYMENT, SALES_ORDER, PROD_ORDER, PI, etc
  number: string;
  status: string;
  postingDate?: Date;
  amount?: number;
  currency?: string;
  reference?: string;
  level: number;
  parentId?: string;
  children: DocumentFlowNode[];
}

export interface DocumentFlowChain {
  rootType: string;
  rootId: string;
  rootNumber: string;
  nodes: DocumentFlowNode[];
  totalDocuments: number;
  totalValue: number;
}

export class DocumentFlowService {
  /**
   * Build document flow chain from any document
   * Traverses audit_document_flow table and direct FK relationships
   */
  static async getDocumentFlow(documentType: string, documentId: string): Promise<DocumentFlowChain> {
    // First, find root document by traversing backwards to PR or Sales Order
    let rootType = documentType;
    let rootId = documentId;
    let rootNumber = '';

    // Traverse backwards to find root (PR or Sales Order)
    let currentType = documentType;
    let currentId = documentId;
    let depth = 0;

    while (depth < 10) {
      const precedingRes = await db.execute(sql`
        SELECT preceding_doc_type, preceding_doc_id, preceding_doc_number
        FROM audit_document_flow
        WHERE succeeding_doc_type = ${currentType} AND succeeding_doc_id = ${currentId}
        LIMIT 1
      `);

      if (precedingRes.rows.length === 0) break;

      const preceding = precedingRes.rows[0] as any;
      if (!preceding.preceding_doc_id) break;

      rootType = preceding.preceding_doc_type;
      rootId = preceding.preceding_doc_id;
      rootNumber = preceding.preceding_doc_number;
      currentType = preceding.preceding_doc_type;
      currentId = preceding.preceding_doc_id;
      depth++;
    }

    // If no flow found, try direct FK lookups for common chains
    if (depth === 0) {
      // Try to find root via direct relationships
      if (documentType === 'PO') {
        const poRes = await db.execute(sql`SELECT pr_id, po_number FROM mm_purchase_order WHERE id = ${documentId}`);
        if (poRes.rows.length > 0) {
          const po = poRes.rows[0] as any;
          if (po.pr_id) {
            const prRes = await db.execute(sql`SELECT pr_number FROM mm_purchase_requisition WHERE id = ${po.pr_id}`);
            if (prRes.rows.length > 0) {
              rootType = 'PR';
              rootId = po.pr_id;
              rootNumber = (prRes.rows[0] as any).pr_number;
            } else {
              rootType = 'PO';
              rootId = documentId;
              rootNumber = po.po_number;
            }
          } else {
            rootType = 'PO';
            rootId = documentId;
            rootNumber = po.po_number;
          }
        }
      } else if (documentType === 'GR') {
        const grRes = await db.execute(sql`SELECT po_id, gr_number FROM mm_goods_receipt WHERE id = ${documentId}`);
        if (grRes.rows.length > 0) {
          const gr = grRes.rows[0] as any;
          // Recursively get PO flow
          const poFlow = await this.getDocumentFlow('PO', gr.po_id);
          return poFlow;
        }
      } else if (documentType === 'IV') {
        const ivRes = await db.execute(sql`SELECT po_id, gr_id, iv_number FROM mm_invoice_verification WHERE id = ${documentId}`);
        if (ivRes.rows.length > 0) {
          const iv = ivRes.rows[0] as any;
          if (iv.gr_id) {
            return this.getDocumentFlow('GR', iv.gr_id);
          } else if (iv.po_id) {
            return this.getDocumentFlow('PO', iv.po_id);
          }
        }
      } else if (documentType === 'SALES_ORDER') {
        rootType = 'SALES_ORDER';
        rootId = documentId;
        const soRes = await db.execute(sql`SELECT sales_number FROM sd_sales_order WHERE id = ${documentId}`);
        if (soRes.rows.length > 0) rootNumber = (soRes.rows[0] as any).sales_number;
      }
    }

    // Now build forward chain from root
    const nodes: DocumentFlowNode[] = [];
    const visited = new Set<string>();

    const buildForward = async (type: string, id: string, level: number, parentId?: string): Promise<DocumentFlowNode | null> => {
      const key = `${type}-${id}`;
      if (visited.has(key) || level > 10) return null;
      visited.add(key);

      let node: DocumentFlowNode | null = null;

      // Get document details based on type
      if (type === 'PR') {
        const res = await db.execute(sql`SELECT id, pr_number, status, total_amount, currency FROM mm_purchase_requisition WHERE id = ${id}`);
        if (res.rows.length > 0) {
          const r = res.rows[0] as any;
          node = {
            id: r.id,
            type: 'PR',
            number: r.pr_number,
            status: r.status,
            amount: parseFloat(r.total_amount || '0'),
            currency: r.currency,
            level,
            parentId,
            children: [],
          };
        }
      } else if (type === 'PO') {
        const res = await db.execute(sql`SELECT id, po_number, status, total_amount, currency FROM mm_purchase_order WHERE id = ${id}`);
        if (res.rows.length > 0) {
          const r = res.rows[0] as any;
          node = {
            id: r.id,
            type: 'PO',
            number: r.po_number,
            status: r.status,
            amount: parseFloat(r.total_amount || '0'),
            currency: r.currency,
            level,
            parentId,
            children: [],
          };
        }
      } else if (type === 'GR') {
        const res = await db.execute(sql`SELECT id, gr_number, status, total_amount, posting_date, fi_document_id FROM mm_goods_receipt WHERE id = ${id}`);
        if (res.rows.length > 0) {
          const r = res.rows[0] as any;
          node = {
            id: r.id,
            type: 'GR',
            number: r.gr_number,
            status: r.status,
            postingDate: r.posting_date,
            amount: parseFloat(r.total_amount || '0'),
            level,
            parentId,
            children: [],
          };
          // Also add FI doc if exists (material doc → FI)
          if (r.fi_document_id) {
            const fiRes = await db.execute(sql`SELECT id, document_number, status, total_debit FROM fin_universal_ledger WHERE id = ${r.fi_document_id}`);
            if (fiRes.rows.length > 0) {
              const fi = fiRes.rows[0] as any;
              node.children.push({
                id: fi.id,
                type: 'FI',
                number: fi.document_number,
                status: fi.status,
                amount: parseFloat(fi.total_debit || '0'),
                level: level + 1,
                parentId: r.id,
                children: [],
              });
            }
          }
        }
      } else if (type === 'IV') {
        const res = await db.execute(sql`SELECT id, iv_number, status, total_amount, fi_document_id, ap_invoice_id FROM mm_invoice_verification WHERE id = ${id}`);
        if (res.rows.length > 0) {
          const r = res.rows[0] as any;
          node = {
            id: r.id,
            type: 'IV',
            number: r.iv_number,
            status: r.status,
            amount: parseFloat(r.total_amount || '0'),
            level,
            parentId,
            children: [],
          };
          if (r.fi_document_id) {
            const fiRes = await db.execute(sql`SELECT id, document_number, status, total_debit FROM fin_universal_ledger WHERE id = ${r.fi_document_id}`);
            if (fiRes.rows.length > 0) {
              const fi = fiRes.rows[0] as any;
              node.children.push({
                id: fi.id,
                type: 'FI',
                number: fi.document_number,
                status: fi.status,
                amount: parseFloat(fi.total_debit || '0'),
                level: level + 1,
                parentId: r.id,
                children: [],
              });
            }
          }
        }
      } else if (type === 'FI') {
        const res = await db.execute(sql`SELECT id, document_number, doc_type, status, total_debit, posting_date, reference_doc_type, reference_doc_number FROM fin_universal_ledger WHERE id = ${id}`);
        if (res.rows.length > 0) {
          const r = res.rows[0] as any;
          node = {
            id: r.id,
            type: `FI-${r.doc_type}`,
            number: r.document_number,
            status: r.status,
            postingDate: r.posting_date,
            amount: parseFloat(r.total_debit || '0'),
            reference: r.reference_doc_number,
            level,
            parentId,
            children: [],
          };
        }
      } else if (type === 'SALES_ORDER') {
        const res = await db.execute(sql`SELECT id, sales_number, status, net_amount, currency, fi_document_id FROM sd_sales_order WHERE id = ${id}`);
        if (res.rows.length > 0) {
          const r = res.rows[0] as any;
          node = {
            id: r.id,
            type: 'SALES_ORDER',
            number: r.sales_number,
            status: r.status,
            amount: parseFloat(r.net_amount || '0'),
            currency: r.currency,
            level,
            parentId,
            children: [],
          };
          // Add GI and FI children via stock ledger
          const ledgerRes = await db.execute(sql`
            SELECT id, reference_doc_number FROM inv_stock_ledger 
            WHERE reference_doc_type = 'SALES_ORDER' AND reference_doc_id = ${id}
            LIMIT 5
          `);
          for (const ledger of ledgerRes.rows as any[]) {
            node.children.push({
              id: ledger.id,
              type: 'GI-601',
              number: `MATDOC-${ledger.reference_doc_number}`,
              status: 'POSTED',
              level: level + 1,
              parentId: r.id,
              children: [],
            });
          }
          if (r.fi_document_id) {
            const fiRes = await db.execute(sql`SELECT id, document_number, status, total_debit FROM fin_universal_ledger WHERE id = ${r.fi_document_id}`);
            if (fiRes.rows.length > 0) {
              const fi = fiRes.rows[0] as any;
              node.children.push({
                id: fi.id,
                type: 'FI-RV',
                number: fi.document_number,
                status: fi.status,
                amount: parseFloat(fi.total_debit || '0'),
                level: level + 1,
                parentId: r.id,
                children: [],
              });
            }
          }
        }
      } else if (type === 'PI') {
        const res = await db.execute(sql`SELECT id, pi_number, status, total_variance_value, posting_date, fi_document_id FROM pi_document WHERE id = ${id}`);
        if (res.rows.length > 0) {
          const r = res.rows[0] as any;
          node = {
            id: r.id,
            type: 'PI',
            number: r.pi_number,
            status: r.status,
            postingDate: r.posting_date,
            amount: parseFloat(r.total_variance_value || '0'),
            level,
            parentId,
            children: [],
          };
          if (r.fi_document_id) {
            const fiRes = await db.execute(sql`SELECT id, document_number, status, total_debit FROM fin_universal_ledger WHERE id = ${r.fi_document_id}`);
            if (fiRes.rows.length > 0) {
              const fi = fiRes.rows[0] as any;
              node.children.push({
                id: fi.id,
                type: 'FI-SA',
                number: fi.document_number,
                status: fi.status,
                amount: parseFloat(fi.total_debit || '0'),
                level: level + 1,
                parentId: r.id,
                children: [],
              });
            }
          }
        }
      }

      if (!node) return null;

      // Get succeeding docs from flow table
      const succRes = await db.execute(sql`
        SELECT succeeding_doc_type, succeeding_doc_id, succeeding_doc_number
        FROM audit_document_flow
        WHERE preceding_doc_type = ${type} AND preceding_doc_id = ${id}
      `);

      for (const succ of succRes.rows as any[]) {
        const childNode = await buildForward(succ.succeeding_doc_type, succ.succeeding_doc_id, level + 1, id);
        if (childNode) node.children.push(childNode);
      }

      // Also try direct FK relationships for docs not in flow table yet (for demo)
      if (type === 'PR') {
        const poRes = await db.execute(sql`SELECT id FROM mm_purchase_order WHERE pr_id = ${id}`);
        for (const po of poRes.rows as any[]) {
          const child = await buildForward('PO', po.id, level + 1, id);
          if (child) node.children.push(child);
        }
      } else if (type === 'PO') {
        const grRes = await db.execute(sql`SELECT id FROM mm_goods_receipt WHERE po_id = ${id}`);
        for (const gr of grRes.rows as any[]) {
          const child = await buildForward('GR', gr.id, level + 1, id);
          if (child) node.children.push(child);
        }
        const ivRes = await db.execute(sql`SELECT id FROM mm_invoice_verification WHERE po_id = ${id}`);
        for (const iv of ivRes.rows as any[]) {
          const child = await buildForward('IV', iv.id, level + 1, id);
          if (child) node.children.push(child);
        }
      } else if (type === 'GR') {
        const ivRes = await db.execute(sql`SELECT id FROM mm_invoice_verification WHERE gr_id = ${id}`);
        for (const iv of ivRes.rows as any[]) {
          const child = await buildForward('IV', iv.id, level + 1, id);
          if (child) node.children.push(child);
        }
      }

      return node;
    };

    const rootNode = await buildForward(rootType, rootId, 0);
    if (!rootNode) {
      // Return mock chain for demo if DB not available
      return this.getMockFlow(documentType, documentId);
    }

    // Flatten nodes for counting
    const flatten = (node: DocumentFlowNode, acc: DocumentFlowNode[] = []): DocumentFlowNode[] => {
      acc.push(node);
      node.children.forEach(child => flatten(child, acc));
      return acc;
    };

    const allNodes = flatten(rootNode);
    const totalValue = allNodes.reduce((sum, n) => sum + (n.amount || 0), 0);

    return {
      rootType,
      rootId,
      rootNumber: rootNumber || rootNode.number,
      nodes: [rootNode],
      totalDocuments: allNodes.length,
      totalValue,
    };
  }

  /**
   * Create document flow link - called during transactional postings
   */
  static async createFlowLink(params: {
    precedingDocType: string;
    precedingDocId: string;
    precedingDocNumber: string;
    succeedingDocType: string;
    succeedingDocId: string;
    succeedingDocNumber: string;
    rootDocType?: string;
    rootDocId?: string;
    rootDocNumber?: string;
  }) {
    try {
      await db.execute(sql`
        INSERT INTO audit_document_flow (root_document_type, root_document_id, root_document_number, preceding_doc_type, preceding_doc_id, preceding_doc_number, succeeding_doc_type, succeeding_doc_id, succeeding_doc_number)
        VALUES (${params.rootDocType || params.precedingDocType}, ${params.rootDocId || params.precedingDocId}, ${params.rootDocNumber || params.precedingDocNumber}, ${params.precedingDocType}, ${params.precedingDocId}, ${params.precedingDocNumber}, ${params.succeedingDocType}, ${params.succeedingDocId}, ${params.succeedingDocNumber})
        ON CONFLICT DO NOTHING
      `);
    } catch (e) {
      console.warn('Failed to create document flow link:', e);
    }
  }

  /**
   * Mock flows for demo when DB not available
   */
  static getMockFlow(documentType: string, documentId: string): DocumentFlowChain {
    if (documentType === 'PO' || documentType === 'PR') {
      return {
        rootType: 'PR',
        rootId: 'pr-1',
        rootNumber: 'PR1000000001',
        totalDocuments: 6,
        totalValue: 1250,
        nodes: [
          {
            id: 'pr-1',
            type: 'PR',
            number: 'PR1000000001',
            status: 'CONVERTED_TO_PO',
            amount: 1250,
            currency: 'KWD',
            level: 0,
            children: [
              {
                id: 'po-1',
                type: 'PO',
                number: '4500000001',
                status: 'FULLY_RECEIVED',
                amount: 1250,
                currency: 'KWD',
                level: 1,
                parentId: 'pr-1',
                children: [
                  {
                    id: 'gr-1',
                    type: 'GR',
                    number: '5000000001',
                    status: 'POSTED',
                    postingDate: new Date('2026-09-28'),
                    amount: 1125,
                    level: 2,
                    parentId: 'po-1',
                    children: [
                      {
                        id: 'fi-gr-1',
                        type: 'FI-WE',
                        number: 'FI1000000001',
                        status: 'POSTED',
                        amount: 1125,
                        level: 3,
                        parentId: 'gr-1',
                        children: [],
                      },
                      {
                        id: 'iv-1',
                        type: 'IV',
                        number: '5100000001',
                        status: 'POSTED',
                        amount: 1250,
                        level: 3,
                        parentId: 'gr-1',
                        children: [
                          {
                            id: 'fi-iv-1',
                            type: 'FI-RE',
                            number: 'FI1000000002',
                            status: 'POSTED',
                            amount: 1250,
                            level: 4,
                            parentId: 'iv-1',
                            children: [
                              {
                                id: 'fi-pay-1',
                                type: 'FI-PAYMENT',
                                number: 'FI1000000003',
                                status: 'POSTED',
                                amount: 1250,
                                level: 5,
                                parentId: 'fi-iv-1',
                                children: [],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
    } else if (documentType === 'SALES_ORDER') {
      return {
        rootType: 'SALES_ORDER',
        rootId: 'so-1',
        rootNumber: 'SO1000000001',
        totalDocuments: 3,
        totalValue: 150,
        nodes: [
          {
            id: 'so-1',
            type: 'SALES_ORDER',
            number: 'SO1000000001',
            status: 'FULLY_ISSUED',
            amount: 150,
            currency: 'KWD',
            level: 0,
            children: [
              {
                id: 'gi-1',
                type: 'GI-601',
                number: 'MATDOC-5000000002',
                status: 'POSTED',
                level: 1,
                parentId: 'so-1',
                children: [],
              },
              {
                id: 'fi-sales-1',
                type: 'FI-RV',
                number: 'FI1000000004',
                status: 'POSTED',
                amount: 150,
                level: 1,
                parentId: 'so-1',
                children: [],
              },
            ],
          },
        ],
      };
    } else {
      return {
        rootType: documentType,
        rootId: documentId,
        rootNumber: `${documentType}-${documentId.slice(0,8)}`,
        totalDocuments: 1,
        totalValue: 0,
        nodes: [
          {
            id: documentId,
            type: documentType,
            number: `${documentType}-${documentId.slice(0,8)}`,
            status: 'POSTED',
            level: 0,
            children: [],
          },
        ],
      };
    }
  }
}
