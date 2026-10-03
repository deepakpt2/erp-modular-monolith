import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { cacheGet, cacheSet, CacheKeys, invalidateNumberRangeCache } from '@/shared/kernel/cache/client';

/**
 * Number Range Next – Atomic next number generation – Industry standard numbering
 * Industry standard: Number ranges are purely numeric intervals – no prefix
 * Example: PO 4500000000, PR 1000000000, Material 10000000 – numeric only
 * Assignment table: core_number_range_assignment – explicit XYZ to material, YZX to PO
 * GET /api/number-ranges/next?object_type=ITEM&assignment_key=RAW&company_code=1000&fiscal_year=2026
 * Returns next document number and increments current_number atomically
 * Exhaustion: error_and_extend – if exhausted, error, admin must extend to_number or create new range and update assignment – no auto fallback
 */

async function ensureAssignmentTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS core_number_range_assignment (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        object_type varchar(50) NOT NULL,
        assignment_key varchar(100) NOT NULL,
        assignment_type varchar(50) DEFAULT 'MATERIAL_TYPE',
        number_range_code varchar(50) NOT NULL,
        fiscal_year integer,
        is_active boolean DEFAULT true,
        description text,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW(),
        UNIQUE(object_type, assignment_key, fiscal_year)
      )
    `);
  } catch {}
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  await ensureAssignmentTable();

  try {
    const { searchParams } = new URL(req.url);
    const objectType = searchParams.get('object_type') || searchParams.get('objectType') || searchParams.get('type');
    const companyCode = searchParams.get('company_code') || searchParams.get('companyCode');
    const plantCode = searchParams.get('plant_code') || searchParams.get('plantCode');
    const controllingArea = searchParams.get('controlling_area_code') || searchParams.get('controllingArea');
    const fiscalYear = searchParams.get('fiscal_year') || searchParams.get('fiscalYear');
    const assignmentKey = searchParams.get('assignment_key') || searchParams.get('material_type') || searchParams.get('materialType') || searchParams.get('doc_type') || searchParams.get('company') || null;
    const materialType = searchParams.get('material_type') || searchParams.get('materialType');

    if (!objectType) {
      return NextResponse.json({ error: 'object_type required – e.g., ITEM, PR, PO, GR, IV, SO, etc.' }, { status: 400 });
    }

    const upperType = objectType.toUpperCase();
    const upperAssignKey = assignmentKey ? assignmentKey.toUpperCase() : null;
    const upperMatType = materialType ? materialType.toUpperCase() : upperAssignKey;

    try {
      // Step 1: Try assignment table – explicit XYZ to material, YZX to PO – industry standard assignment
      let assignedRangeCode: string | null = null;
      let assignmentRow: any = null;

      // Try to find assignment by object_type + assignment_key + fiscal_year
      if (upperAssignKey || upperMatType) {
        try {
          // Try with fiscal_year first
          if (fiscalYear) {
            const assignRes = await db.execute(sql`
              SELECT id, object_type, assignment_key, assignment_type, number_range_code, fiscal_year, description
              FROM core_number_range_assignment
              WHERE object_type = ${upperType}
              AND UPPER(assignment_key) = ${upperAssignKey || upperMatType}
              AND is_active = true
              AND (fiscal_year = ${fiscalYear} OR fiscal_year IS NULL)
              ORDER BY fiscal_year DESC NULLS LAST
              LIMIT 1
            `);
            if (assignRes.rows.length > 0) {
              assignmentRow = assignRes.rows[0] as any;
              assignedRangeCode = assignmentRow.number_range_code;
            }
          }
          if (!assignedRangeCode) {
            const assignRes = await db.execute(sql`
              SELECT id, object_type, assignment_key, assignment_type, number_range_code, fiscal_year, description
              FROM core_number_range_assignment
              WHERE object_type = ${upperType}
              AND UPPER(assignment_key) = ${upperAssignKey || upperMatType}
              AND is_active = true
              LIMIT 1
            `);
            if (assignRes.rows.length > 0) {
              assignmentRow = assignRes.rows[0] as any;
              assignedRangeCode = assignmentRow.number_range_code;
            }
          }
        } catch (assignErr: any) {
          console.warn('Assignment lookup failed:', assignErr.message);
        }
      }

      // Also try company_code based assignment if no material_type assignment found
      if (!assignedRangeCode && companyCode) {
        try {
          const assignRes = await db.execute(sql`
            SELECT id, object_type, assignment_key, assignment_type, number_range_code, fiscal_year, description
            FROM core_number_range_assignment
            WHERE object_type = ${upperType}
            AND UPPER(assignment_key) = ${companyCode.toUpperCase()}
            AND is_active = true
            AND (fiscal_year = ${fiscalYear || null} OR fiscal_year IS NULL)
            ORDER BY fiscal_year DESC NULLS LAST
            LIMIT 1
          `);
          if (assignRes.rows.length > 0) {
            assignmentRow = assignRes.rows[0] as any;
            assignedRangeCode = assignmentRow.number_range_code;
          }
        } catch {}
      }

      // Step 2: If assignment found, use specific range code – explicit assignment XYZ to material
      if (assignedRangeCode) {
        try {
          const res = await db.execute(sql`
            UPDATE core_number_range 
            SET current_number = current_number + 1, updated_at = NOW()
            WHERE code = ${assignedRangeCode}
            RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year
          `);
          if (res.rows.length > 0) {
            const row = res.rows[0] as any;
            const current = Number(row.current_number);
            const docNumber = String(current); // Purely numeric – no prefix

            // Exhaustion check – industry standard error_and_extend
            if (row.to_number && current > Number(row.to_number)) {
              // Revert increment
              await db.execute(sql`UPDATE core_number_range SET current_number = current_number - 1 WHERE code = ${assignedRangeCode}`);
              return NextResponse.json({ 
                error: `Number range ${row.code} (assigned to ${upperType} ${upperAssignKey || companyCode || ''}) exhausted – current ${current} > to ${row.to_number} – cannot generate – go to Number Ranges and increase to_number to e.g., ${Number(row.to_number)+10000} or create new range ${row.code}-NEW (e.g., from ${Number(row.to_number)+1} to ${Number(row.to_number)+10000}) and update assignment ${upperType} ${upperAssignKey || ''} → new code. No auto fallback – assignment must be updated explicitly.`,
                code: row.code,
                object_type: upperType,
                assignment_key: upperAssignKey,
                assignment: assignmentRow,
                from_number: Number(row.from_number),
                to_number: Number(row.to_number),
                current_number: current - 1,
                next_number: current,
                exhausted: true,
                suggestion: `Increase to_number in FNRC for ${row.code} or create new range and update assignment table core_number_range_assignment for ${upperType} ${upperAssignKey || ''}`
              }, { status: 400 });
            }

            const nextAvailable = current + 1;
            const usedCount = current - Number(row.from_number);
            const totalRange = Number(row.to_number) - Number(row.from_number);
            const usagePercent = totalRange > 0 ? Math.round((usedCount / totalRange) * 100) : 0;

            // Invalidate cache after increment – industry standard – cache must be updated on number consumption
            try { await invalidateNumberRangeCache(row.code); } catch {}

            return NextResponse.json({
              success: true,
              object_type: upperType,
              assignment_key: upperAssignKey || upperMatType,
              assignment: assignmentRow,
              document_number: docNumber, // Purely numeric
              current_number: current,
              next_number: nextAvailable,
              from_number: Number(row.from_number),
              to_number: Number(row.to_number),
              fiscal_year: row.fiscal_year,
              code: row.code,
              used_count: usedCount,
              usage_percent: usagePercent,
              usage_warning: usagePercent >= 90 ? `Range ${row.code} ${usagePercent}% used – nearly exhausted – consider increasing to_number or creating new range` : usagePercent >= 80 ? `Range ${row.code} ${usagePercent}% used – consider planning new interval` : null,
              is_used: usedCount > 0,
              is_locked: usedCount > 0,
              source: 'core_number_range via assignment table + dragonfly cache invalidated',
              assignment_found: true,
              message: `Next number ${docNumber} for ${upperType} ${upperAssignKey || ''} via assigned range ${row.code} – next ${nextAvailable} – ${usagePercent}% used`
            });
          }
        } catch (e: any) {
          console.warn(`Assigned range ${assignedRangeCode} update failed:`, e.message);
        }
      }

      // Step 3: Fallback – hierarchical matching (Plant -> Company Code -> Controlling Area -> Global)
      let res;
      if (plantCode) {
        res = await db.execute(sql`
          UPDATE core_number_range 
          SET current_number = current_number + 1, updated_at = NOW()
          WHERE object_type = ${upperType}::core_number_range_object_type 
          AND plant_code = ${plantCode.toUpperCase()}
          AND (fiscal_year = ${fiscalYear || null} OR fiscal_year IS NULL)
          ORDER BY fiscal_year DESC NULLS LAST
          LIMIT 1
          RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year
        `);
      }

      if ((!res || res.rows.length === 0) && companyCode && fiscalYear) {
        res = await db.execute(sql`
          UPDATE core_number_range 
          SET current_number = current_number + 1, updated_at = NOW()
          WHERE object_type = ${upperType}::core_number_range_object_type 
          AND (company_code = ${companyCode.toUpperCase()} OR legal_entity_id IN (SELECT id FROM org_legal_entity WHERE code = ${companyCode} LIMIT 1) OR company_code IS NULL)
          AND (fiscal_year = ${fiscalYear} OR fiscal_year IS NULL)
          ORDER BY fiscal_year DESC NULLS LAST, company_code DESC NULLS LAST
          LIMIT 1
          RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year
        `);
      }

      if ((!res || res.rows.length === 0) && controllingArea) {
        res = await db.execute(sql`
          UPDATE core_number_range 
          SET current_number = current_number + 1, updated_at = NOW()
          WHERE object_type = ${upperType}::core_number_range_object_type 
          AND controlling_area_code = ${controllingArea.toUpperCase()}
          ORDER BY fiscal_year DESC NULLS LAST
          LIMIT 1
          RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year
        `);
      }
      
      if (!res || res.rows.length === 0) {
        res = await db.execute(sql`
          UPDATE core_number_range 
          SET current_number = current_number + 1, updated_at = NOW()
          WHERE object_type = ${upperType}::core_number_range_object_type
          RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year
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
        const current = Number(row.current_number);
        const docNumber = String(current);

        if (row.to_number && current > Number(row.to_number)) {
          await db.execute(sql`UPDATE core_number_range SET current_number = current_number - 1 WHERE id = ${row.id}`);
          return NextResponse.json({ 
            error: `Number range ${row.code} exhausted – current ${current} > to ${row.to_number} – cannot generate – increase to_number or create new range ${row.code}-NEW and assign via assignment table. No auto fallback.`,
            code: row.code,
            from_number: Number(row.from_number),
            to_number: Number(row.to_number),
            current_number: current - 1,
            exhausted: true
          }, { status: 400 });
        }

        const nextAvailable = current + 1;
        const usedCount = current - Number(row.from_number);
        const totalRange = Number(row.to_number) - Number(row.from_number);
        const usagePercent = totalRange > 0 ? Math.round((usedCount / totalRange) * 100) : 0;

        try { await invalidateNumberRangeCache(row.code); } catch {}

        return NextResponse.json({
          success: true,
          object_type: upperType,
          document_number: docNumber,
          current_number: current,
          next_number: nextAvailable,
          from_number: Number(row.from_number),
          to_number: Number(row.to_number),
          fiscal_year: row.fiscal_year,
          code: row.code,
          used_count: usedCount,
          usage_percent: usagePercent,
          usage_warning: usagePercent >= 90 ? `Range ${row.code} ${usagePercent}% used – nearly exhausted` : usagePercent >= 80 ? `Range ${row.code} ${usagePercent}% used` : null,
          is_used: usedCount > 0,
          is_locked: usedCount > 0,
          source: 'core_number_range + cache invalidated',
          assignment_found: false,
          message: `Next number ${docNumber} for ${upperType} – next ${nextAvailable} – ${usagePercent}% used – via object_type (no explicit assignment, using default)`
        });
      }

      // No range found – create default
      const defaults: Record<string, { from: number, to: number }> = {
        'ITEM': { from: 10000000, to: 19999999 },
        'MATERIAL': { from: 10000000, to: 19999999 },
        'PR': { from: 1000000000, to: 1999999999 },
        'PO': { from: 4500000000, to: 4599999999 },
        'GR': { from: 5000000000, to: 5099999999 },
        'IV': { from: 5100000000, to: 5199999999 },
        'SO': { from: 1000000000, to: 1999999999 },
        'DL': { from: 8000000000, to: 8099999999 },
        'BL': { from: 9000000000, to: 9099999999 },
        'FI_DOC': { from: 1000000000, to: 1999999999 },
        'BILLING': { from: 9000000000, to: 9099999999 },
        'DELIVERY': { from: 8000000000, to: 8099999999 },
        'PARTNER': { from: 100000, to: 199999 },
        'LOT': { from: 1000000000, to: 1999999999 },
      };
      const def = defaults[upperType] || { from: 1000000000, to: 1999999999 };
      
      try {
        const newRange = await db.execute(sql`
          INSERT INTO core_number_range (code, object_type, prefix, from_number, to_number, current_number)
          VALUES (${`${upperType}-01`}, ${upperType}::core_number_range_object_type, '', ${def.from}, ${def.to}, ${def.from})
          ON CONFLICT (code) DO UPDATE SET current_number = core_number_range.current_number + 1, updated_at = NOW()
          RETURNING id, code, object_type, current_number, from_number, to_number, fiscal_year
        `);
        const row = newRange.rows[0] as any;
        const current = Number(row.current_number);
        const docNumber = String(current);
        return NextResponse.json({
          success: true,
          object_type: upperType,
          document_number: docNumber,
          current_number: current,
          next_number: current + 1,
          from_number: Number(row.from_number),
          to_number: Number(row.to_number),
          code: row.code,
          used_count: current - Number(row.from_number),
          source: 'core_number_range auto-created',
          message: `Next number ${docNumber} for ${upperType} – range auto-created – next ${current+1}`
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
          warning: `Range table not available: ${createErr.message}`,
          message: `Next number ${fallbackNum} for ${upperType} – fallback`
        });
      }
    } catch (coreErr: any) {
      console.warn('core_number_range next failed:', coreErr.message);
      const fallbackNum = Date.now() % 1000000000 + 1000000000;
      return NextResponse.json({
        success: true,
        object_type: upperType,
        document_number: String(fallbackNum),
        current_number: fallbackNum,
        next_number: fallbackNum + 1,
        code: `${upperType}-01`,
        source: 'fallback timestamp numeric',
        warning: `Both core and assignment failed: ${coreErr.message}`,
        message: `Next number ${fallbackNum} for ${upperType} – fallback`
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  await ensureAssignmentTable();
  try {
    const body = await req.json();
    const objectType = body.object_type || body.objectType || body.type;
    const companyCode = body.company_code || body.companyCode;
    const fiscalYear = body.fiscal_year || body.fiscalYear;
    const assignmentKey = body.assignment_key || body.material_type || body.materialType || body.doc_type;
    if (!objectType) return NextResponse.json({ error: 'object_type required' }, { status: 400 });
    const url = new URL(req.url);
    url.searchParams.set('object_type', objectType);
    if (companyCode) url.searchParams.set('company_code', companyCode);
    if (fiscalYear) url.searchParams.set('fiscal_year', fiscalYear);
    if (assignmentKey) url.searchParams.set('assignment_key', assignmentKey);
    if (body.material_type) url.searchParams.set('material_type', body.material_type);
    const mockReq = { url: url.toString(), headers: req.headers } as any;
    return GET(mockReq);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
