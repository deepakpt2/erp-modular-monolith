import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Number Range Next – Atomic next number generation – SAP-like FBN1/SNRO – STANDARD SAP NUMBERING
 * SAP Standard: Number ranges are purely numeric intervals – NO PREFIX in number range itself
 * Example SAP: PO 4500000000, PR 1000000000, MAT 10000000 – numeric only, no PO- or MAT- prefix
 * Prefix handling: Removed for SAP compliance – document_number = current_number only
 * GET /api/number-ranges/next?object_type=PR&company_code=1000&fiscal_year=2026
 * Returns next document number and increments current_number atomically
 * Legal-safe own IP – FNRC Document Numbering (was FBN1/SNRO)
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

    // Try core_number_range first – SAP standard: purely numeric, no prefix
    try {
      let res;
      if (companyCode && fiscalYear) {
        res = await db.execute(sql`
          UPDATE core_number_range 
          SET current_number = current_number + 1, updated_at = NOW()
          WHERE object_type = ${upperType}::core_number_range_object_type 
          AND (legal_entity_id IN (SELECT id FROM org_legal_entity WHERE code = ${companyCode} LIMIT 1) OR legal_entity_id IS NULL)
          AND (fiscal_year = ${fiscalYear} OR fiscal_year IS NULL)
          ORDER BY fiscal_year DESC NULLS LAST, legal_entity_id DESC NULLS LAST
          LIMIT 1
          RETURNING id, code, object_type, prefix, current_number, from_number, to_number, fiscal_year
        `);
      }
      
      if (!res || res.rows.length === 0) {
        // SAP standard: filter by object_type only, ignore prefix
        res = await db.execute(sql`
          UPDATE core_number_range 
          SET current_number = current_number + 1, updated_at = NOW()
          WHERE object_type = ${upperType}::core_number_range_object_type
          RETURNING id, code, object_type, prefix, current_number, from_number, to_number, fiscal_year
        `);
        
        if (res.rows.length > 1) {
          const first = res.rows[0];
          for (let i = 1; i < res.rows.length; i++) {
            await db.execute(sql`UPDATE core_number_range SET current_number = current_number - 1 WHERE id = ${(res.rows[i] as any).id}`);
          }
          res.rows = [first];
        }
      }

      if (res && res.rows.length > 0) {
        const row = res.rows[0] as any;
        // SAP STANDARD: document_number is purely numeric – no prefix
        // In SAP, number range defines interval, document type may add prefix via config, but range itself is numeric
        const current = Number(row.current_number);
        const docNumber = String(current); // Pure numeric – SAP standard
        
        if (row.to_number && current > Number(row.to_number)) {
          return NextResponse.json({ error: `Number range ${row.code} exhausted – ${current} > ${row.to_number} – SAP-like – create new interval` }, { status: 400 });
        }

        const nextAvailable = current + 1;
        const usedCount = current - Number(row.from_number);

        return NextResponse.json({
          success: true,
          object_type: upperType,
          document_number: docNumber, // SAP: purely numeric
          current_number: current,
          next_number: nextAvailable, // SAP FBN1 shows next available
          from_number: Number(row.from_number),
          to_number: Number(row.to_number),
          fiscal_year: row.fiscal_year,
          code: row.code,
          used_count: usedCount,
          is_used: usedCount > 0,
          is_locked: usedCount > 0, // SAP: if used, locked
          source: 'core_number_range',
          sap_standard: true,
          note: 'SAP standard – purely numeric – no prefix in range – prefix field ignored for compliance',
          message: `Next number ${docNumber} for ${upperType} – SAP standard numeric – next available ${nextAvailable}`
        });
      }

      // No range found – create default one – SAP standard: numeric only, empty prefix
      const sapDefaults: Record<string, { from: number, to: number }> = {
        'ITEM': { from: 10000000, to: 19999999 }, // Material – 8-digit SAP-like
        'MATERIAL': { from: 10000000, to: 19999999 },
        'MAT': { from: 10000000, to: 19999999 },
        'PR': { from: 1000000000, to: 1999999999 }, // 10-digit SAP-like PR
        'PO': { from: 4500000000, to: 4599999999 }, // 10-digit SAP-like PO 45*
        'GR': { from: 5000000000, to: 5099999999 }, // GR 50*
        'IV': { from: 5100000000, to: 5199999999 }, // IV 51*
        'SO': { from: 1000000000, to: 1999999999 },
        'DL': { from: 8000000000, to: 8099999999 },
        'BL': { from: 9000000000, to: 9099999999 },
        'FI_DOC': { from: 1000000000, to: 1999999999 },
        'BILLING': { from: 9000000000, to: 9099999999 },
        'DELIVERY': { from: 8000000000, to: 8099999999 },
        'PARTNER': { from: 100000, to: 199999 },
        'LOT': { from: 1000000000, to: 1999999999 },
      };
      const def = sapDefaults[upperType] || { from: 1000000000, to: 1999999999 };
      
      try {
        const newRange = await db.execute(sql`
          INSERT INTO core_number_range (code, object_type, prefix, from_number, to_number, current_number)
          VALUES (${`${upperType}-01`}, ${upperType}::core_number_range_object_type, '', ${def.from}, ${def.to}, ${def.from})
          ON CONFLICT (code) DO UPDATE SET current_number = core_number_range.current_number + 1, updated_at = NOW()
          RETURNING id, code, object_type, prefix, current_number, from_number, to_number, fiscal_year
        `);
        const row = newRange.rows[0] as any;
        const current = Number(row.current_number);
        const docNumber = String(current); // SAP numeric only
        const nextAvailable = current + 1;
        return NextResponse.json({
          success: true,
          object_type: upperType,
          document_number: docNumber,
          current_number: current,
          next_number: nextAvailable,
          from_number: Number(row.from_number),
          to_number: Number(row.to_number),
          code: row.code,
          used_count: current - Number(row.from_number),
          source: 'core_number_range auto-created',
          sap_standard: true,
          note: 'SAP standard numeric range auto-created – no prefix',
          message: `Next number ${docNumber} for ${upperType} – range auto-created – next ${nextAvailable}`
        });
      } catch (createErr: any) {
        const fallbackNum = def.from + 1;
        return NextResponse.json({
          success: true,
          object_type: upperType,
          document_number: String(fallbackNum),
          current_number: fallbackNum,
          next_number: fallbackNum + 1,
          from_number: def.from,
          to_number: def.to,
          code: `${upperType}-01`,
          source: 'fallback numeric',
          sap_standard: true,
          warning: `Range table not available, using fallback numeric: ${createErr.message}`,
          message: `Next number ${fallbackNum} for ${upperType} – fallback numeric`
        });
      }
    } catch (coreErr: any) {
      console.warn('core_number_range next failed, trying ent_number_range:', coreErr.message);
      
      try {
        const res = await db.execute(sql`
          UPDATE ent_number_range 
          SET current_number = current_number + 1
          WHERE object_type = ${upperType}
          RETURNING id, code, object_type, prefix, current_number, from_number, to_number
        `);
        
        if (res.rows.length > 0) {
          const row = res.rows[0] as any;
          const current = Number(row.current_number);
          const docNumber = String(current); // SAP numeric only
          return NextResponse.json({
            success: true,
            object_type: upperType,
            document_number: docNumber,
            current_number: current,
            next_number: current + 1,
            from_number: Number(row.from_number),
            to_number: Number(row.to_number),
            code: row.code,
            source: 'ent_number_range',
            sap_standard: true,
            message: `Next number ${docNumber} for ${upperType} – SAP numeric`
          });
        }
      } catch (entErr: any) {
        console.warn('ent_number_range also failed:', entErr.message);
      }

      const fallbackNum = Date.now() % 1000000000 + 1000000000;
      return NextResponse.json({
        success: true,
        object_type: upperType,
        document_number: String(fallbackNum),
        current_number: fallbackNum,
        next_number: fallbackNum + 1,
        code: `${upperType}-01`,
        source: 'fallback timestamp numeric',
        sap_standard: true,
        warning: `Both core and ent number range failed: ${coreErr.message}`,
        message: `Next number ${fallbackNum} for ${upperType} – fallback numeric`
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const body = await req.json();
    const objectType = body.object_type || body.objectType || body.type;
    const companyCode = body.company_code || body.companyCode;
    const fiscalYear = body.fiscal_year || body.fiscalYear;
    if (!objectType) return NextResponse.json({ error: 'object_type required' }, { status: 400 });
    const url = new URL(req.url);
    url.searchParams.set('object_type', objectType);
    if (companyCode) url.searchParams.set('company_code', companyCode);
    if (fiscalYear) url.searchParams.set('fiscal_year', fiscalYear);
    const mockReq = { url: url.toString(), headers: req.headers } as any;
    return GET(mockReq);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
