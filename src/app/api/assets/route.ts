import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Assets API – Legal-safe own IP – Module 5 FICO Deep Dive
 * New: fin_asset + fin_asset_class (was fi_asset) – assetNumber, description, legalEntityId was company_code_id, capitalizationDate, acquisitionValue, usefulLifeMonths, depreciationMethod STRAIGHT/DECLINING/UNITS, status ACTIVE/RETIRED/BLOCKED/UNDER_CONSTRUCTION
 * Helper code: FASC Asset Create (alias ASC, AS01, FIN-AS-CR) – 4-char MOOA F=Financials, AS=Asset, C=Create – module grouped intuitive
 * Fallback to legacy fi_asset if exists
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search') || '';

  try {
    let rows: any[] = [];
    let classes: any[] = [];
    let source = 'db-new';
    let table = 'fin_asset';
    let legalSafe = true;

    try {
      let query = sql`
        SELECT a.*, ac.code as asset_class_code, ac.name as asset_class_name, le.code as legal_entity_code, gl.account_number, gl.name as gl_name
        FROM fin_asset a
        LEFT JOIN fin_asset_class ac ON a.asset_class_id = ac.id
        LEFT JOIN org_legal_entity le ON a.legal_entity_id = le.id
        LEFT JOIN fin_ledger_account gl ON a.gl_account_id = gl.id
        WHERE 1=1
      `;
      if (status) query = sql`${query} AND a.status = ${status}::fin_asset_status`;
      if (search) query = sql`${query} AND (a.asset_number ILIKE ${`%${search}%`} OR a.description ILIKE ${`%${search}%`})`;
      query = sql`${query} ORDER BY a.asset_number LIMIT 200`;
      const res = await db.execute(query);
      rows = res.rows as any[];

      try {
        const cRes = await db.execute(sql`SELECT * FROM fin_asset_class ORDER BY code`);
        classes = cRes.rows as any[];
      } catch {}
    } catch (newErr: any) {
      console.warn('fin_asset not yet fallback fi_asset:', newErr.message);
      source = 'db-legacy';
      table = 'fi_asset';
      legalSafe = false;
      try {
        let query = sql`
          SELECT a.*, ac.code as asset_class_code, ac.name as asset_class_name, cc.code as company_code, gl.account_number, gl.name as gl_name
          FROM fi_asset a
          LEFT JOIN fi_asset_class ac ON a.asset_class_id = ac.id
          LEFT JOIN ent_company_code cc ON a.company_code_id = cc.id
          LEFT JOIN fi_gl_account gl ON a.gl_account_id = gl.id
          WHERE 1=1
        `;
        if (search) query = sql`${query} AND (a.asset_number ILIKE ${`%${search}%`} OR a.description ILIKE ${`%${search}%`})`;
        query = sql`${query} ORDER BY a.asset_number LIMIT 200`;
        const res = await db.execute(query);
        rows = res.rows as any[];
      } catch (e: any) {
        if (e.message?.includes('does not exist')) {
          return NextResponse.json({ data: [], assets: [], assetClasses: [], count: 0, message: 'Table fin_asset not yet migrated – fresh empty Module5', code: 'FASC', aliasCodes: ['ASC','AS01'], helperCode: 'FASC', table: 'fin_asset', source: 'none', legalSafe: true });
        }
        throw e;
      }
    }

    return NextResponse.json({
      data: rows,
      assets: rows,
      assetClasses: classes,
      count: rows.length,
      code: 'FASC',
      aliasCodes: ['ASC', 'AS01', 'FIN-AS-CR'],
      helperCode: 'FASC',
      table,
      source,
      legalSafe,
      functionDescription: 'Asset Masters – FASC legal-safe own IP (was AS01) – assetNumber, description, legalEntityId was company_code_id, capitalizationDate, acquisitionValue, usefulLifeMonths, depreciationMethod STRAIGHT/DECLINING/UNITS, status ACTIVE/RETIRED/BLOCKED/UNDER_CONSTRUCTION, sample kept',
      erpDefaults: [
        { assetNumber: 'AST-100001', description: 'CNC Machine – Manufacturing', class: 'AST-1000 Machinery', value: 500000, life: 120, method: 'STRAIGHT', helperCode: 'FASC', note: 'Sample kept' },
        { assetNumber: 'AST-200001', description: 'Delivery Vehicle – Sales', class: 'AST-2000 Vehicles', value: 800000, life: 60, method: 'STRAIGHT', helperCode: 'FASC' },
        { assetNumber: 'AST-300001', description: 'Office Building – Admin', class: 'AST-3000 Buildings', value: 5000000, life: 240, method: 'STRAIGHT', helperCode: 'FASC' },
      ],
      explanation: 'Asset masters legal-safe fin_asset + fin_asset_class – assetNumber, description, legalEntityId was company_code_id, capitalizationDate, acquisitionValue, usefulLifeMonths, depreciationMethod STRAIGHT/DECLINING/UNITS, status ACTIVE/RETIRED/BLOCKED/UNDER_CONSTRUCTION – Code FASC primary alias ASC/AS01 – 4-char MOOA F=Financials AS=Asset C=Create – module grouped intuitive – sample data kept for user convenience per requirement fresh empty but common sample data like coa, gl, tax, currencies, UoM kept.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], assets: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { asset_number, description, asset_class_code, legal_entity_code, company_code, gl_account_number, capitalization_date, acquisition_value, useful_life_months, depreciation_method } = body;
    if (!asset_number || !description || !asset_class_code) return NextResponse.json({ error: 'asset_number, description, asset_class_code required' }, { status: 400 });

    try {
      const classRes = await db.execute(sql`SELECT id FROM fin_asset_class WHERE code = ${asset_class_code.toUpperCase()} LIMIT 1`);
      if (classRes.rows.length === 0) {
        // Auto-create class if not exists
        await db.execute(sql`INSERT INTO fin_asset_class (code, name) VALUES (${asset_class_code.toUpperCase()}, ${asset_class_code}) ON CONFLICT (code) DO NOTHING`);
      }
      const classRes2 = await db.execute(sql`SELECT id FROM fin_asset_class WHERE code = ${asset_class_code.toUpperCase()} LIMIT 1`);
      const classId = (classRes2.rows[0] as any).id;

      let legalEntityId = null;
      const finalLegalCode = legal_entity_code || company_code;
      if (finalLegalCode) {
        try {
          const le = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code = ${finalLegalCode} LIMIT 1`);
          if (le.rows.length > 0) legalEntityId = (le.rows[0] as any).id;
          else {
            const le2 = await db.execute(sql`SELECT id FROM ent_company_code WHERE code = ${finalLegalCode} LIMIT 1`);
            if (le2.rows.length > 0) legalEntityId = (le2.rows[0] as any).id;
          }
        } catch {}
      }

      let glId = null;
      if (gl_account_number) {
        try {
          const g = await db.execute(sql`SELECT id FROM fin_ledger_account WHERE account_number = ${gl_account_number} LIMIT 1`);
          if (g.rows.length > 0) glId = (g.rows[0] as any).id;
        } catch {
          const g = await db.execute(sql`SELECT id FROM fi_gl_account WHERE account_number = ${gl_account_number} LIMIT 1`);
          if (g.rows.length > 0) glId = (g.rows[0] as any).id;
        }
      }

      const res = await db.execute(sql`
        INSERT INTO fin_asset (asset_number, description, asset_class_id, legal_entity_id, gl_account_id, capitalization_date, acquisition_value, useful_life_months, depreciation_method)
        VALUES (${asset_number.toUpperCase()}, ${description}, ${classId}, ${legalEntityId}, ${glId}, ${capitalization_date ? new Date(capitalization_date) : null}, ${acquisition_value || 0}, ${useful_life_months || 60}, ${depreciation_method || 'STRAIGHT'})
        ON CONFLICT (asset_number) DO UPDATE SET description = ${description}, asset_class_id = ${classId}, legal_entity_id = COALESCE(${legalEntityId}, fin_asset.legal_entity_id), gl_account_id = COALESCE(${glId}, fin_asset.gl_account_id), capitalization_date = ${capitalization_date ? new Date(capitalization_date) : null}, acquisition_value = ${acquisition_value || 0}, useful_life_months = ${useful_life_months || 60}, depreciation_method = ${depreciation_method || 'STRAIGHT'}, updated_at = NOW()
        RETURNING id, asset_number, description
      `);
      return NextResponse.json({ success: true, asset: res.rows[0], code: 'FASC', message: `Asset ${asset_number.toUpperCase()} created – FASC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('fin_asset insert failed fallback fi_asset:', newErr.message);
      return NextResponse.json({ error: newErr.message }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, asset_number, description, status } = body;
    if (!id && !asset_number) return NextResponse.json({ error: 'id or asset_number required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE fin_asset SET description = COALESCE(${description}, description), status = COALESCE(${status}::fin_asset_status, status), updated_at = NOW() WHERE id = ${id} RETURNING id, asset_number, description`);
      else res = await db.execute(sql`UPDATE fin_asset SET description = COALESCE(${description}, description), status = COALESCE(${status}::fin_asset_status, status), updated_at = NOW() WHERE asset_number = ${asset_number.toUpperCase()} RETURNING id, asset_number, description`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      return NextResponse.json({ success: true, asset: res.rows[0], code: 'FASC', message: `Asset ${res.rows[0].asset_number} updated – FASC legal-safe` });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const asset_number = searchParams.get('asset_number')?.toUpperCase();
    const id = searchParams.get('id');
    if (!asset_number && !id) return NextResponse.json({ error: 'asset_number or id required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM fin_asset WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fin_asset WHERE asset_number = ${asset_number}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM fi_asset WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fi_asset WHERE asset_number = ${asset_number}`);
    }

    return NextResponse.json({ success: true, code: 'FASC', message: `Asset ${asset_number || id} deleted – FASC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
