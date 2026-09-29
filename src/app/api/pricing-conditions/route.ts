import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Pricing Conditions API – Legal-safe own IP – Module 5 FICO Deep Dive + MM/SD Pricing/Conditions Engine
 * New: fin_pricing_condition + fin_pricing_procedure + fin_pricing_condition_record (was pricing_condition) – code PR00 Base Price, K004 Material Discount, KF00 Freight, MWST VAT/GST – conditionType BASE/DISCOUNT/SURCHARGE/FREIGHT/TAX, origin MANUAL/AUTOMATIC/MASTER_DATA, isPercentage, isAccrual
 * Helper code: FPRC Pricing Condition Create (alias PRC, VK11, FIN-PR-CR) – 4-char MOOA F=Financials, PR=Pricing, C=Create – module grouped intuitive
 * Also FPRP Pricing Procedure Create (alias PRP, V/08)
 * Fallback to legacy pricing tables if exist
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  try {
    let conditions: any[] = [];
    let procedures: any[] = [];
    let records: any[] = [];
    let source = 'db-new';
    let table = 'fin_pricing_condition';
    let legalSafe = true;

    try {
      let condQuery = sql`SELECT * FROM fin_pricing_condition ORDER BY code`;
      if (type) condQuery = sql`SELECT * FROM fin_pricing_condition WHERE condition_type = ${type}::fin_pricing_cond_type ORDER BY code`;
      const condRes = await db.execute(condQuery);
      conditions = condRes.rows as any[];

      try {
        const procRes = await db.execute(sql`SELECT * FROM fin_pricing_procedure ORDER BY code`);
        procedures = procRes.rows as any[];
      } catch {}

      try {
        const recRes = await db.execute(sql`
          SELECT r.*, c.code as condition_code, c.name as condition_name
          FROM fin_pricing_condition_record r
          JOIN fin_pricing_condition c ON r.condition_id = c.id
          WHERE r.is_active = true
          ORDER BY r.valid_from DESC
          LIMIT 100
        `);
        records = recRes.rows as any[];
      } catch {}
    } catch (newErr: any) {
      console.warn('fin_pricing_condition not yet fallback legacy:', newErr.message);
      source = 'db-legacy';
      table = 'pricing_condition';
      legalSafe = false;
      try {
        const condRes = await db.execute(sql`SELECT * FROM pricing_condition ORDER BY code LIMIT 100`);
        conditions = condRes.rows as any[];
      } catch (e: any) {
        if (e.message?.includes('does not exist')) {
          return NextResponse.json({ data: [], pricingConditions: [], pricingProcedures: [], pricingRecords: [], count: 0, message: 'Table fin_pricing_condition not yet migrated – fresh empty Module5', code: 'FPRC', aliasCodes: ['PRC','VK11'], helperCode: 'FPRC', table: 'fin_pricing_condition', source: 'none', legalSafe: true });
        }
        throw e;
      }
    }

    return NextResponse.json({
      data: conditions,
      pricingConditions: conditions,
      pricingProcedures: procedures,
      pricingRecords: records,
      count: conditions.length,
      code: 'FPRC',
      aliasCodes: ['PRC', 'VK11', 'V/08', 'FIN-PR-CR'],
      helperCode: 'FPRC',
      table,
      source,
      legalSafe,
      functionDescription: 'Pricing Conditions – FPRC legal-safe own IP (was VK11) – PR00 Base Price, K004 Material Discount, KF00 Freight, MWST VAT/GST – conditionType BASE/DISCOUNT/SURCHARGE/FREIGHT/TAX, origin MANUAL/AUTOMATIC/MASTER_DATA, isPercentage, isAccrual – pricing engine: Base + Discount + Freight + Surcharge + Tax = Net, depends on customer, material, qty, date, plant, sales org – Module5',
      erpDefaults: [
        { code: 'PR00', name: 'Base Price – Material Price', type: 'BASE', origin: 'MASTER_DATA', isPercentage: false, helperCode: 'FPRC', note: 'Sample kept – Base price' },
        { code: 'K004', name: 'Material Discount', type: 'DISCOUNT', origin: 'MASTER_DATA', isPercentage: true, helperCode: 'FPRC', note: 'Sample – 10% discount' },
        { code: 'KF00', name: 'Freight', type: 'FREIGHT', origin: 'MANUAL', isPercentage: false, helperCode: 'FPRC' },
        { code: 'MWST', name: 'VAT/GST – Output Tax', type: 'TAX', origin: 'AUTOMATIC', isPercentage: true, helperCode: 'FPRC', note: 'Sample – 5%/12%/18%/28% GST' },
        { code: 'SKTO', name: 'Cash Discount', type: 'CASH_DISCOUNT', origin: 'AUTOMATIC', isPercentage: true, helperCode: 'FPRC' },
      ],
      explanation: 'Pricing conditions legal-safe fin_pricing_condition + fin_pricing_procedure + fin_pricing_condition_record – code PR00 Base Price, K004 Material Discount, KF00 Freight, MWST VAT/GST – conditionType BASE/DISCOUNT/SURCHARGE/FREIGHT/TAX/CASH_DISCOUNT, origin MANUAL/AUTOMATIC/MASTER_DATA – Code FPRC primary alias PRC/VK11 – 4-char MOOA F=Financials PR=Pricing C=Create – module grouped intuitive – pricing engine: Base + Discount + Freight + Surcharge + Tax = Net, depends on customer, material, qty, date, plant, sales org – sample data kept for user convenience.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [], pricingConditions: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { code, name, condition_type, origin, is_percentage, is_accrual, description, procedure_code, steps, records } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    // If creating pricing procedure
    if (procedure_code || steps) {
      try {
        const procRes = await db.execute(sql`
          INSERT INTO fin_pricing_procedure (code, name, description)
          VALUES (${(procedure_code || code).toUpperCase()}, ${name}, ${description || null})
          ON CONFLICT (code) DO UPDATE SET name = ${name}, description = ${description || null}
          RETURNING id, code, name
        `);
        const procId = (procRes.rows[0] as any).id;

        if (steps && Array.isArray(steps)) {
          for (const s of steps) {
            try {
              let condId = null;
              if (s.condition_code) {
                const cRes = await db.execute(sql`SELECT id FROM fin_pricing_condition WHERE code = ${s.condition_code.toUpperCase()} LIMIT 1`);
                if (cRes.rows.length > 0) condId = (cRes.rows[0] as any).id;
              }
              if (!condId && s.condition_id) condId = s.condition_id;
              if (!condId) continue;

              await db.execute(sql`
                INSERT INTO fin_pricing_procedure_step (procedure_id, step_number, condition_id, from_step, to_step, is_statistical, is_mandatory)
                VALUES (${procId}, ${s.step_number || s.stepNumber || 10}, ${condId}, ${s.from_step || s.fromStep || null}, ${s.to_step || s.toStep || null}, ${s.is_statistical || false}, ${s.is_mandatory || false})
                ON CONFLICT (procedure_id, step_number) DO UPDATE SET condition_id = ${condId}, from_step = ${s.from_step || s.fromStep || null}, to_step = ${s.to_step || s.toStep || null}
              `);
            } catch (se: any) {
              console.warn('pricing step insert failed:', se.message);
            }
          }
        }

        return NextResponse.json({ success: true, pricingProcedure: procRes.rows[0], code: 'FPRP', aliasCodes: ['PRP','V/08'], message: `Pricing procedure ${(procedure_code || code).toUpperCase()} created – FPRP legal-safe`, legalSafe: true });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    // Condition record creation
    if (records && Array.isArray(records)) {
      try {
        const condRes = await db.execute(sql`SELECT id FROM fin_pricing_condition WHERE code = ${code.toUpperCase()} LIMIT 1`);
        if (condRes.rows.length === 0) return NextResponse.json({ error: `Condition ${code} not found` }, { status: 404 });
        const condId = (condRes.rows[0] as any).id;

        for (const r of records) {
          await db.execute(sql`
            INSERT INTO fin_pricing_condition_record (condition_id, valid_from, valid_to, amount, percentage, currency_code, uom_code, partner_id, item_id, facility_id, min_quantity, max_quantity)
            VALUES (${condId}, ${r.valid_from ? new Date(r.valid_from) : new Date()}, ${r.valid_to ? new Date(r.valid_to) : null}, ${r.amount || 0}, ${r.percentage || 0}, ${r.currency_code || 'INR'}, ${r.uom_code || null}, ${r.partner_id || null}, ${r.item_id || null}, ${r.facility_id || null}, ${r.min_quantity || 0}, ${r.max_quantity || null})
          `);
        }

        return NextResponse.json({ success: true, code: 'FPRC', message: `Pricing condition records for ${code.toUpperCase()} created – FPRC legal-safe`, legalSafe: true });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    // Simple condition create
    try {
      const res = await db.execute(sql`
        INSERT INTO fin_pricing_condition (code, name, condition_type, origin, is_percentage, is_accrual, description)
        VALUES (${code.toUpperCase()}, ${name}, ${condition_type || 'BASE'}::fin_pricing_cond_type, ${origin || 'MANUAL'}::fin_pricing_cond_origin, ${is_percentage || false}, ${is_accrual || false}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET name = ${name}, condition_type = ${condition_type || 'BASE'}::fin_pricing_cond_type, origin = ${origin || 'MANUAL'}::fin_pricing_cond_origin, is_percentage = ${is_percentage || false}, is_accrual = ${is_accrual || false}, description = ${description || null}
        RETURNING id, code, name
      `);
      return NextResponse.json({ success: true, pricingCondition: res.rows[0], code: 'FPRC', aliasCodes: ['PRC','VK11'], message: `Pricing condition ${code.toUpperCase()} created – FPRC legal-safe`, legalSafe: true });
    } catch (newErr: any) {
      console.warn('fin_pricing_condition insert failed:', newErr.message);
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
    const { id, code, name, is_active } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required' }, { status: 400 });

    try {
      let res;
      if (id) res = await db.execute(sql`UPDATE fin_pricing_condition SET name = COALESCE(${name}, name), is_active = COALESCE(${is_active}, is_active) WHERE id = ${id} RETURNING id, code, name`);
      else res = await db.execute(sql`UPDATE fin_pricing_condition SET name = COALESCE(${name}, name), is_active = COALESCE(${is_active}, is_active) WHERE code = ${code.toUpperCase()} RETURNING id, code, name`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Pricing condition not found' }, { status: 404 });
      return NextResponse.json({ success: true, pricingCondition: res.rows[0], code: 'FPRC', message: `Pricing condition ${res.rows[0].code} updated – FPRC legal-safe` });
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
    const code = searchParams.get('code')?.toUpperCase();
    const id = searchParams.get('id');
    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    try {
      if (id) await db.execute(sql`DELETE FROM fin_pricing_condition WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM fin_pricing_condition WHERE code = ${code}`);
    } catch {
      if (id) await db.execute(sql`DELETE FROM pricing_condition WHERE id = ${id}`);
      else await db.execute(sql`DELETE FROM pricing_condition WHERE code = ${code}`);
    }

    return NextResponse.json({ success: true, code: 'FPRC', message: `Pricing condition ${code || id} deleted – FPRC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
