import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Credit Policy Area API - OB45 + FD32 Credit Master + OVA8 Credit Check – T1 REQUIRED – STANDARD & COMPLIANCE
 * Legal-Safe Module 1 – General ERP terminology
 * Tables: fin_credit_policy_area (OB45) – code, name, currency_code, credit_limit, risk_category, description – defines credit control area
 *         fin_credit_master (FD32) – customer_code, credit_policy_area_code, credit_limit, risk_category, credit_exposure, last_calculated – customer credit master per credit control area – used in SO credit check OVA8
 *         fin_credit_check_config (OVA8) – automatic credit check: static/dynamic, reaction A/B/C (warning/error/block), risk category
 * Strict usage: SO creation checks exposure = open SO + open delivery + open billing + open AR (universal ledger) vs credit_limit – block/warning – prevents selling to bankrupt customer – T1 REQUIRED – NO DANGLING
 * Fresh empty – no sample data except tenant
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    let result;
    try {
      // Ensure columns exist for T1
      await db.execute(sql`ALTER TABLE fin_credit_policy_area ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT 1000000`).catch(()=>{});
      await db.execute(sql`ALTER TABLE fin_credit_policy_area ADD COLUMN IF NOT EXISTS risk_category VARCHAR(20) DEFAULT 'LOW'`).catch(()=>{});
      await db.execute(sql`ALTER TABLE fin_credit_policy_area ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'INR'`).catch(()=>{});
      await db.execute(sql`ALTER TABLE fin_credit_policy_area ADD COLUMN IF NOT EXISTS description TEXT`).catch(()=>{});
      await db.execute(sql`ALTER TABLE fin_credit_policy_area ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`).catch(()=>{});
      await db.execute(sql`ALTER TABLE fin_credit_policy_area ADD COLUMN IF NOT EXISTS tenant_id UUID`).catch(()=>{});
      await db.execute(sql`ALTER TABLE fin_credit_policy_area ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`).catch(()=>{});
      await db.execute(sql`ALTER TABLE fin_credit_policy_area ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`).catch(()=>{});

      result = await db.execute(sql`SELECT * FROM fin_credit_policy_area ORDER BY code`);
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS fin_credit_policy_area (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID,
            code VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            currency_code VARCHAR(3) DEFAULT 'INR',
            credit_limit NUMERIC DEFAULT 1000000,
            risk_category VARCHAR(20) DEFAULT 'LOW',
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);
        await db.execute(sql`
          INSERT INTO fin_credit_policy_area (code, name, currency_code, credit_limit, risk_category, description)
          VALUES ('CPA-1000', 'Standard Credit Control', 'INR', 1000000, 'LOW', 'Standard credit policy area – FD32 credit limit 10L – used in SO credit check OVA8 – T1 REQUIRED')
          ON CONFLICT (code) DO NOTHING
        `);
        result = await db.execute(sql`SELECT * FROM fin_credit_policy_area ORDER BY code`);
      } else throw e;
    }

    // Also get credit masters FD32
    let creditMasters: any[] = [];
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS fin_credit_master (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_code VARCHAR(50) NOT NULL,
          credit_policy_area_code VARCHAR(20) NOT NULL,
          credit_limit NUMERIC NOT NULL DEFAULT 1000000,
          risk_category VARCHAR(20) DEFAULT 'LOW',
          credit_exposure NUMERIC DEFAULT 0,
          last_calculated TIMESTAMPTZ DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(customer_code, credit_policy_area_code)
        )
      `);
      const cmRes = await db.execute(sql`SELECT * FROM fin_credit_master ORDER BY customer_code LIMIT 100`);
      creditMasters = cmRes.rows as any[];
    } catch {}

    // Credit check config OVA8
    let creditCheckConfigs: any[] = [];
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS fin_credit_check_config (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          credit_policy_area_code VARCHAR(20) NOT NULL,
          risk_category VARCHAR(20) DEFAULT 'LOW',
          check_type VARCHAR(20) DEFAULT 'STATIC',
          reaction VARCHAR(1) DEFAULT 'B',
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      const cfgRes = await db.execute(sql`SELECT * FROM fin_credit_check_config ORDER BY credit_policy_area_code LIMIT 100`);
      creditCheckConfigs = cfgRes.rows as any[];
    } catch {}

    return NextResponse.json({ 
      data: result.rows, 
      creditPolicyAreas: result.rows,
      creditMasters,
      creditCheckConfigs,
      count: result.rows.length, 
      code: 'FCPC',
      aliasCodes: ['OB45', 'FD32', 'OVA8'],
      table: 'fin_credit_policy_area', 
      functionDescription: 'Credit Policy Area OB45 + Credit Master FD32 + Credit Check OVA8 – T1 REQUIRED – credit limit, risk category, exposure = open SO+delivery+billing+AR vs limit – blocks SO if exceeded – NO DANGLING',
      helperCode: 'OB45' 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const body = await req.json();
    
      const { code, name, description, tenant_id, currency_code, credit_limit, risk_category, customer_code } = body;
      if (!code || !name) return NextResponse.json({ error: 'code and name required – FCPC OB45 – T1 REQUIRED' }, { status: 400 });

      // Ensure tables exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS fin_credit_policy_area (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID,
          code VARCHAR(20) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          currency_code VARCHAR(3) DEFAULT 'INR',
          credit_limit NUMERIC DEFAULT 1000000,
          risk_category VARCHAR(20) DEFAULT 'LOW',
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await db.execute(sql`ALTER TABLE fin_credit_policy_area ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT 1000000`).catch(()=>{});
      await db.execute(sql`ALTER TABLE fin_credit_policy_area ADD COLUMN IF NOT EXISTS risk_category VARCHAR(20) DEFAULT 'LOW'`).catch(()=>{});

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS fin_credit_master (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_code VARCHAR(50) NOT NULL,
          credit_policy_area_code VARCHAR(20) NOT NULL,
          credit_limit NUMERIC NOT NULL DEFAULT 1000000,
          risk_category VARCHAR(20) DEFAULT 'LOW',
          credit_exposure NUMERIC DEFAULT 0,
          last_calculated TIMESTAMPTZ DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(customer_code, credit_policy_area_code)
        )
      `);

      let tenantId = tenant_id;
      if (!tenantId) {
        const tr = await db.execute(sql`SELECT id FROM core_tenant LIMIT 1`);
        if (tr.rows.length) tenantId = (tr.rows[0] as any).id;
        else {
          const nt = await db.execute(sql`INSERT INTO core_tenant (code, name) VALUES ('TEN-100', 'Main Tenant') ON CONFLICT (code) DO UPDATE SET name='Main Tenant' RETURNING id`);
          tenantId = (nt.rows[0] as any).id;
        }
      }

      // If customer_code provided, create credit master FD32
      if (customer_code) {
        const cmRes = await db.execute(sql`
          INSERT INTO fin_credit_master (customer_code, credit_policy_area_code, credit_limit, risk_category)
          VALUES (${customer_code.toUpperCase()}, ${code.toUpperCase()}, ${credit_limit || 1000000}, ${risk_category || 'LOW'})
          ON CONFLICT (customer_code, credit_policy_area_code) DO UPDATE SET credit_limit = ${credit_limit || 1000000}, risk_category = ${risk_category || 'LOW'}, updated_at = NOW()
          RETURNING id, customer_code, credit_policy_area_code, credit_limit
        `);
        return NextResponse.json({ 
          success: true, 
          creditMaster: cmRes.rows[0], 
          code: 'FD32',
          message: `Credit Master FD32 for customer ${customer_code} in policy area ${code} created – limit ${credit_limit||1000000} risk ${risk_category||'LOW'} – T1 REQUIRED – used in SO credit check OVA8 exposure vs limit – NO DANGLING` 
        });
      }

      const res = await db.execute(sql`
        INSERT INTO fin_credit_policy_area (tenant_id, code, name, currency_code, credit_limit, risk_category, description) 
        VALUES (${tenantId}, ${code.toUpperCase()}, ${name}, ${currency_code || 'INR'}, ${credit_limit || 1000000}, ${risk_category || 'LOW'}, ${description || null}) 
        ON CONFLICT (code) DO UPDATE SET name = ${name}, credit_limit = ${credit_limit || 1000000}, risk_category = ${risk_category || 'LOW'}, description = ${description || null}, updated_at = NOW()
        RETURNING id, code, name, credit_limit, risk_category
      `);
      return NextResponse.json({ 
        success: true, 
        creditPolicyArea: res.rows[0], 
        code: 'FCPC',
        aliasCodes: ['OB45'],
        message: `Credit Policy Area ${code.toUpperCase()} created – OB45 – limit ${credit_limit||1000000} risk ${risk_category||'LOW'} – T1 REQUIRED – defines credit control area for FD32 credit master + OVA8 check – NO DANGLING – used in SO credit check exposure vs limit` 
      });
    
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const body = await req.json();
    const { id, code, name, description, is_active, credit_limit, risk_category, customer_code } = body;
    if (!id && !code && !customer_code) return NextResponse.json({ error: 'id or code or customer_code required' }, { status: 400 });

    // If customer_code, update credit master FD32
    if (customer_code && code) {
      const res = await db.execute(sql`
        UPDATE fin_credit_master SET credit_limit = COALESCE(${credit_limit}, credit_limit), risk_category = COALESCE(${risk_category}, risk_category), updated_at = NOW() 
        WHERE customer_code = ${customer_code.toUpperCase()} AND credit_policy_area_code = ${code.toUpperCase()}
        RETURNING id, customer_code, credit_policy_area_code, credit_limit
      `);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Credit Master not found – FD32' }, { status: 404 });
      return NextResponse.json({ success: true, creditMaster: res.rows[0], code: 'FD32', message: `Credit Master ${customer_code}/${code} updated – limit ${res.rows[0].credit_limit}` });
    }

    let res;
    if (id) {
      res = await db.execute(sql`UPDATE fin_credit_policy_area SET code = COALESCE(${code?.toUpperCase() ?? null}, code), name = COALESCE(${name ?? null}, name), description = COALESCE(${description ?? null}, description), is_active = COALESCE(${is_active ?? null}, is_active), credit_limit = COALESCE(${credit_limit ?? null}, credit_limit), risk_category = COALESCE(${risk_category ?? null}, risk_category), updated_at = NOW() WHERE id = ${id} RETURNING id, code, name, credit_limit`);
    } else {
      res = await db.execute(sql`UPDATE fin_credit_policy_area SET name = COALESCE(${name ?? null}, name), description = COALESCE(${description ?? null}, description), is_active = COALESCE(${is_active ?? null}, is_active), credit_limit = COALESCE(${credit_limit ?? null}, credit_limit), risk_category = COALESCE(${risk_category ?? null}, risk_category), updated_at = NOW() WHERE code = ${code.toUpperCase()} RETURNING id, code, name, credit_limit`);
    }
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: res.rows[0], code: 'FCPC', message: `Credit Policy Area ${res.rows[0].code} updated – limit ${res.rows[0].credit_limit}` });
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
    const customer_code = searchParams.get('customer_code')?.toUpperCase();
    const credit_policy_area_code = searchParams.get('credit_policy_area_code')?.toUpperCase();

    if (customer_code && credit_policy_area_code) {
      const res = await db.execute(sql`DELETE FROM fin_credit_master WHERE customer_code = ${customer_code} AND credit_policy_area_code = ${credit_policy_area_code} RETURNING customer_code`);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Credit Master not found – FD32' }, { status: 404 });
      return NextResponse.json({ success: true, code: 'FD32', message: `Credit Master ${customer_code}/${credit_policy_area_code} deleted` });
    }

    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });
    let res;
    if (id) {
      res = await db.execute(sql`DELETE FROM fin_credit_policy_area WHERE id = ${id} RETURNING code`);
    } else {
      res = await db.execute(sql`DELETE FROM fin_credit_policy_area WHERE code = ${code} RETURNING code`);
    }
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, code: 'FCPC', message: `Credit Policy Area ${res.rows[0].code} deleted`, deleted: res.rows[0].code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
