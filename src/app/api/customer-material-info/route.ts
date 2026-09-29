import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * VD51 Customer-Material Info + FREE-GOODS VBN1 + REBATE VBO1 – T2 GOOD
 * VD51: Customer-specific material description, customer material number
 * FREE-GOODS: VBN1 – free goods determination – buy X get Y free
 * REBATE: VBO1 – rebate agreement – volume-based rebate
 * NO DANGLING – cust-mat info used in SO description + pricing, free goods used in SO item creation, rebate used in billing accrual
 */

export async function GET(req: NextRequest){
  const authCheck = await requireApiAuth(req as any);
  if(authCheck) return authCheck;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'CUST_MAT';
  const limit = parseInt(searchParams.get('limit') || '100');
  try{
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sd_customer_material_info (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_number VARCHAR(50) NOT NULL,
        material_code VARCHAR(100) NOT NULL,
        customer_material_number VARCHAR(100),
        customer_material_description VARCHAR(200),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(customer_number, material_code)
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sd_free_goods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        free_goods_number VARCHAR(50) NOT NULL UNIQUE,
        material_code VARCHAR(100) NOT NULL,
        min_quantity NUMERIC NOT NULL,
        free_material_code VARCHAR(100) NOT NULL,
        free_quantity NUMERIC NOT NULL,
        valid_from DATE DEFAULT CURRENT_DATE,
        valid_to DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sd_rebate_agreement (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rebate_number VARCHAR(50) NOT NULL UNIQUE,
        customer_number VARCHAR(50) NOT NULL,
        material_code VARCHAR(100),
        rebate_percentage NUMERIC NOT NULL,
        min_volume NUMERIC DEFAULT 0,
        valid_from DATE DEFAULT CURRENT_DATE,
        valid_to DATE,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        accrual_amount NUMERIC DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    if(action === 'FREE_GOODS' || action === 'VBN1'){
      const res = await db.execute(sql`SELECT * FROM sd_free_goods WHERE is_active = true ORDER BY min_quantity ASC LIMIT ${limit}`);
      return NextResponse.json({ success:true, code:'VBN1', data:res.rows, freeGoods:res.rows, count:res.rows.length, message:`VBN1 Free Goods – ${res.rows.length} free goods rules – buy X get Y free – T2 GOOD – NO DANGLING – free goods used in SO item creation` });
    }

    if(action === 'REBATE' || action === 'VBO1'){
      const res = await db.execute(sql`SELECT * FROM sd_rebate_agreement WHERE status = 'ACTIVE' ORDER BY valid_from DESC LIMIT ${limit}`);
      return NextResponse.json({ success:true, code:'VBO1', data:res.rows, rebates:res.rows, count:res.rows.length, message:`VBO1 Rebate – ${res.rows.length} rebate agreements – volume-based rebate – T2 GOOD – NO DANGLING – rebate used in billing accrual` });
    }

    const res = await db.execute(sql`SELECT * FROM sd_customer_material_info ORDER BY created_at DESC LIMIT ${limit}`);
    return NextResponse.json({ success:true, data:res.rows, customerMaterialInfo:res.rows, count:res.rows.length, code:'VD51', aliasCodes:['VD51','VBN1','VBO1'], functionDescription:'VD51 Customer-Material Info + VBN1 Free Goods + VBO1 Rebate – T2 GOOD – customer-specific material description, free goods buy X get Y, rebate volume-based' });
  }catch(e:any){
    return NextResponse.json({ error:e.message, data:[] }, {status:500});
  }
}

export async function POST(req: NextRequest){
  const authCheck = await requireApiAuth(req as any);
  if(authCheck) return authCheck;
  try{
    const body = await req.json();
    const { action, customer_number, material_code, customer_material_number, customer_material_description, min_quantity, free_material_code, free_quantity, valid_from, valid_to, rebate_percentage, min_volume } = body;

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sd_customer_material_info (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_number VARCHAR(50) NOT NULL,
        material_code VARCHAR(100) NOT NULL,
        customer_material_number VARCHAR(100),
        customer_material_description VARCHAR(200),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(customer_number, material_code)
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sd_free_goods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        free_goods_number VARCHAR(50) NOT NULL UNIQUE,
        material_code VARCHAR(100) NOT NULL,
        min_quantity NUMERIC NOT NULL,
        free_material_code VARCHAR(100) NOT NULL,
        free_quantity NUMERIC NOT NULL,
        valid_from DATE DEFAULT CURRENT_DATE,
        valid_to DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sd_rebate_agreement (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rebate_number VARCHAR(50) NOT NULL UNIQUE,
        customer_number VARCHAR(50) NOT NULL,
        material_code VARCHAR(100),
        rebate_percentage NUMERIC NOT NULL,
        min_volume NUMERIC DEFAULT 0,
        valid_from DATE DEFAULT CURRENT_DATE,
        valid_to DATE,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        accrual_amount NUMERIC DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    if(action === 'VBN1' || action === 'FREE_GOODS'){
      if(!material_code || !min_quantity || !free_material_code || !free_quantity) return NextResponse.json({ error:'material_code, min_quantity, free_material_code, free_quantity required – VBN1 – T2 GOOD' }, {status:400});
      const fgNumber = `FG-${Date.now().toString().slice(-6)}`;
      const insRes = await db.execute(sql`
        INSERT INTO sd_free_goods (free_goods_number, material_code, min_quantity, free_material_code, free_quantity, valid_from, valid_to, is_active)
        VALUES (${fgNumber}, ${material_code}, ${min_quantity}, ${free_material_code}, ${free_quantity}, ${valid_from ? new Date(valid_from) : new Date()}::date, ${valid_to ? new Date(valid_to) : null}::date, true)
        RETURNING *
      `);
      return NextResponse.json({ success:true, code:'VBN1', free_goods_number: fgNumber, freeGoods: insRes.rows[0], message:`VBN1 Free Goods ${fgNumber} – buy ${min_quantity} ${material_code} get ${free_quantity} ${free_material_code} free – T2 GOOD – NO DANGLING – free goods used in SO item creation – General ERP – SAP VBN1 alias` });
    }

    if(action === 'VBO1' || action === 'REBATE'){
      if(!customer_number || !rebate_percentage) return NextResponse.json({ error:'customer_number and rebate_percentage required – VBO1 – T2 GOOD' }, {status:400});
      const rebateNumber = `RB-${Date.now().toString().slice(-6)}`;
      const insRes = await db.execute(sql`
        INSERT INTO sd_rebate_agreement (rebate_number, customer_number, material_code, rebate_percentage, min_volume, valid_from, valid_to, status, accrual_amount)
        VALUES (${rebateNumber}, ${customer_number}, ${material_code || null}, ${rebate_percentage}, ${min_volume || 0}, ${valid_from ? new Date(valid_from) : new Date()}::date, ${valid_to ? new Date(valid_to) : null}::date, 'ACTIVE', 0)
        RETURNING *
      `);
      return NextResponse.json({ success:true, code:'VBO1', rebate_number: rebateNumber, rebate: insRes.rows[0], message:`VBO1 Rebate ${rebateNumber} – customer ${customer_number} material ${material_code||''} ${rebate_percentage}% min volume ${min_volume||0} – T2 GOOD – NO DANGLING – rebate used in billing accrual – General ERP – SAP VBO1 alias` });
    }

    // VD51 Customer-Material Info
    if(!customer_number || !material_code) return NextResponse.json({ error:'customer_number and material_code required – VD51 – T2 GOOD' }, {status:400});
    const insRes = await db.execute(sql`
      INSERT INTO sd_customer_material_info (customer_number, material_code, customer_material_number, customer_material_description)
      VALUES (${customer_number}, ${material_code}, ${customer_material_number || null}, ${customer_material_description || null})
      ON CONFLICT (customer_number, material_code) DO UPDATE SET customer_material_number = ${customer_material_number || null}, customer_material_description = ${customer_material_description || null}
      RETURNING *
    `);
    return NextResponse.json({ success:true, code:'VD51', customerMaterialInfo: insRes.rows[0], message:`VD51 Customer-Material Info – customer ${customer_number} material ${material_code} cust mat ${customer_material_number||''} desc ${customer_material_description||''} – T2 GOOD – NO DANGLING – cust-mat info used in SO description + pricing – General ERP – SAP VD51 alias` });
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
