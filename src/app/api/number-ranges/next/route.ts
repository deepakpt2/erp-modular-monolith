import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Number Range Next – Atomic next number generation – SAP-like FBN1/SNRO
 * GET /api/number-ranges/next?object_type=PR&company_code=1000&fiscal_year=2026
 * Returns next document number and increments current_number atomically
 * Legal-safe own IP – FNDC Document Numbering (was FBN1/SNRO)
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const objectType = searchParams.get('object_type') || searchParams.get('objectType') || searchParams.get('type');
    const companyCode = searchParams.get('company_code') || searchParams.get('companyCode');
    const fiscalYear = searchParams.get('fiscal_year') || searchParams.get('fiscalYear');

    if (!objectType) {
      return NextResponse.json({ error: 'object_type required – e.g., PR, PO, GR, IV, SO, DL, BL, FI_DOC, BOM, etc.' }, { status: 400 });
    }

    const upperType = objectType.toUpperCase();

    // Try core_number_range first
    try {
      // Atomic increment via UPDATE RETURNING
      let res;
      if (companyCode && fiscalYear) {
        // Try with company and fiscal year filter
        res = await db.execute(sql`
          UPDATE core_number_range 
          SET current_number = current_number + 1, updated_at = NOW()
          WHERE object_type = ${upperType}::core_number_range_object_type 
          AND (legal_entity_id IN (SELECT id FROM org_legal_entity WHERE code = ${companyCode} LIMIT 1) OR legal_entity_id IS NULL)
          AND (fiscal_year = ${fiscalYear} OR fiscal_year IS NULL)
          ORDER BY fiscal_year DESC NULLS LAST, legal_entity_id DESC NULLS LAST
          LIMIT 1
          RETURNING id, code, object_type, prefix, current_number, from_number, to_number
        `);
      }
      
      if (!res || res.rows.length === 0) {
        // Try without company/fiscal filters – just object_type
        res = await db.execute(sql`
          UPDATE core_number_range 
          SET current_number = current_number + 1, updated_at = NOW()
          WHERE object_type = ${upperType}::core_number_range_object_type
          RETURNING id, code, object_type, prefix, current_number, from_number, to_number
        `);
        
        // If multiple, take first
        if (res.rows.length > 1) {
          // Get first and revert others
          const first = res.rows[0];
          // Revert extra increments
          for (let i = 1; i < res.rows.length; i++) {
            await db.execute(sql`UPDATE core_number_range SET current_number = current_number - 1 WHERE id = ${(res.rows[i] as any).id}`);
          }
          res.rows = [first];
        }
      }

      if (res && res.rows.length > 0) {
        const row = res.rows[0] as any;
        const prefix = row.prefix || '';
        const current = row.current_number;
        const docNumber = `${prefix}${current}`;
        
        // Check if exceeds to_number
        if (row.to_number && current > row.to_number) {
          return NextResponse.json({ error: `Number range ${row.code} exhausted – ${current} > ${row.to_number}` }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          object_type: upperType,
          document_number: docNumber,
          current_number: current,
          prefix,
          code: row.code,
          from_number: row.from_number,
          to_number: row.to_number,
          source: 'core_number_range',
          message: `Next number ${docNumber} for ${upperType}`
        });
      }

      // No range found – create default one
      const defaultPrefixMap: Record<string, string> = {
        'PR': 'PR-',
        'PO': 'PO-',
        'GR': 'GR-',
        'IV': 'IV-',
        'SO': 'SO-',
        'DL': 'DL-',
        'BL': 'BL-',
        'FI_DOC': 'FI-',
        'BOM': 'BOM-',
        'ROUTING': 'RT-',
        'WC': 'WC-',
        'KIT': 'KIT-',
        'MRP': 'MRP-',
        'STO': 'STO-',
        'PI': 'PI-',
      };
      const prefix = defaultPrefixMap[upperType] || `${upperType}-`;
      const fromNum = 1000000000;
      const toNum = 1999999999;
      
      try {
        const newRange = await db.execute(sql`
          INSERT INTO core_number_range (code, object_type, prefix, from_number, to_number, current_number)
          VALUES (${`${upperType}-01`}, ${upperType}::core_number_range_object_type, ${prefix}, ${fromNum}, ${toNum}, ${fromNum})
          ON CONFLICT (code) DO UPDATE SET current_number = core_number_range.current_number + 1, updated_at = NOW()
          RETURNING id, code, object_type, prefix, current_number, from_number, to_number
        `);
        const row = newRange.rows[0] as any;
        const docNumber = `${row.prefix}${row.current_number}`;
        return NextResponse.json({
          success: true,
          object_type: upperType,
          document_number: docNumber,
          current_number: row.current_number,
          prefix: row.prefix,
          code: row.code,
          source: 'core_number_range auto-created',
          message: `Next number ${docNumber} for ${upperType} – range auto-created`
        });
      } catch (createErr: any) {
        // Fallback to simple timestamp if range creation fails
        const docNumber = `${prefix}${Date.now()}`;
        return NextResponse.json({
          success: true,
          object_type: upperType,
          document_number: docNumber,
          current_number: Date.now(),
          prefix,
          code: `${upperType}-01`,
          source: 'fallback timestamp',
          warning: `Range table not available, using timestamp fallback: ${createErr.message}`,
          message: `Next number ${docNumber} for ${upperType} – fallback`
        });
      }
    } catch (coreErr: any) {
      console.warn('core_number_range next failed, trying ent_number_range:', coreErr.message);
      
      // Fallback to ent_number_range
      try {
        const res = await db.execute(sql`
          UPDATE ent_number_range 
          SET current_number = current_number + 1
          WHERE object_type = ${upperType}
          RETURNING id, code, object_type, prefix, current_number, from_number, to_number
        `);
        
        if (res.rows.length > 0) {
          const row = res.rows[0] as any;
          const docNumber = `${row.prefix || ''}${row.current_number}`;
          return NextResponse.json({
            success: true,
            object_type: upperType,
            document_number: docNumber,
            current_number: row.current_number,
            prefix: row.prefix,
            code: row.code,
            source: 'ent_number_range',
            message: `Next number ${docNumber} for ${upperType}`
          });
        }
      } catch (entErr: any) {
        console.warn('ent_number_range also failed:', entErr.message);
      }

      // Final fallback
      const docNumber = `${upperType}-${Date.now()}`;
      return NextResponse.json({
        success: true,
        object_type: upperType,
        document_number: docNumber,
        current_number: Date.now(),
        prefix: `${upperType}-`,
        code: `${upperType}-01`,
        source: 'fallback timestamp',
        warning: `Both core and ent number range failed: ${coreErr.message}`,
        message: `Next number ${docNumber} for ${upperType} – fallback`
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // POST version for atomic next number – body { object_type, company_code, fiscal_year }
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const objectType = body.object_type || body.objectType || body.type;
    const companyCode = body.company_code || body.companyCode;
    const fiscalYear = body.fiscal_year || body.fiscalYear;

    if (!objectType) {
      return NextResponse.json({ error: 'object_type required' }, { status: 400 });
    }

    // Reuse GET logic by constructing URL
    const url = new URL(req.url);
    url.searchParams.set('object_type', objectType);
    if (companyCode) url.searchParams.set('company_code', companyCode);
    if (fiscalYear) url.searchParams.set('fiscal_year', fiscalYear);

    // Call same logic as GET
    const mockReq = { url: url.toString(), headers: req.headers } as any;
    return GET(mockReq);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
