import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { checkAuthorization, getAuthorizations, getUserRoles } from '@/shared/kernel/auth/authorization';

/**
 * Authorizations API – FRPC own IP – Foundation Role/Permission Checks – NEW OWN CODE – alias FROC (legacy PFCG)/FUSC (legacy SU01)
 * Implements authorization objects for plant, movement, company code, GL, posting period, number range – checks in APIs – industry standard
 * For large org with 1000s employees, critical – ensures user can only post for authorized plant, movement, company code, GL, etc.
 * Tables: fin_authorization_object, fin_role_authorization, fin_user_role
 * Makes data available in DB for now – modules will be modified to use as reworked – per user request
 */

async function ensureTables() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_authorization_object (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(100) NOT NULL UNIQUE,
        description text,
        created_at timestamp DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_role_authorization (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        role_code varchar(100) NOT NULL,
        auth_object_code varchar(100) NOT NULL,
        field_name varchar(100) NOT NULL,
        field_value varchar(200) NOT NULL,
        created_at timestamp DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_user_role (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar(200) NOT NULL,
        role_code varchar(100) NOT NULL,
        created_at timestamp DEFAULT NOW(),
        UNIQUE(user_id, role_code)
      )
    `);

    const defaultObjects = [
      { code: 'M_BEST_WRK', description: 'Plant authorization for purchasing – e.g., plant 1000, 1100 – checks if user can create PO/GR for plant' },
      { code: 'M_BEST_BSA', description: 'Purchasing document type – e.g., NB standard PO, FO framework order' },
      { code: 'M_MATE_MAT', description: 'Material type – e.g., RAW, FINISHED – checks if user can create material type' },
      { code: 'M_MATE_WGR', description: 'Material group – e.g., spices, oils' },
      { code: 'F_BKPF_BUK', description: 'Company code – e.g., 1000, 1100 – checks if user can post for company code' },
      { code: 'F_BKPF_KOA', description: 'Account type – e.g., A assets, D customers, K vendors, M materials, S GL' },
      { code: 'F_BKPF_KTO', description: 'GL account – e.g., 1400000001 inventory, 3000000001 revenue' },
      { code: 'F_BKPF_BLA', description: 'Document type – e.g., WE GR, RE invoice, SA GL' },
      { code: 'M_MSEG_BWA', description: 'Movement type – e.g., 101 GR, 261 GI, 601 PGI – checks if user can post movement' },
      { code: 'F_BKPF_BUP', description: 'Posting period – e.g., PPV-1000 – checks if user can open/close posting periods' },
      { code: 'F_NUM_RANGE', description: 'Number range – e.g., MAT-RAW-01, PO-01 – checks if user can edit number ranges' },
      { code: 'F_EXC_RATE', description: 'Exchange rate – e.g., USD→INR – checks if user can maintain exchange rates' },
    ];

    for (const obj of defaultObjects) {
      await db.execute(sql`
        INSERT INTO fin_authorization_object (code, description)
        VALUES (${obj.code}, ${obj.description})
        ON CONFLICT (code) DO NOTHING
      `);
    }
  } catch (e: any) {
    console.warn('Ensure authorization tables failed:', e.message);
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  await ensureTables();

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all'; // auth_objects, role_auth, user_roles, all
    const roleCode = searchParams.get('role_code');
    const userId = searchParams.get('user_id');

    const result: any = {};

    if (type === 'all' || type === 'auth_objects') {
      const res = await db.execute(sql`SELECT * FROM fin_authorization_object ORDER BY code`);
      result.authorization_objects = res.rows;
    }
    if (type === 'all' || type === 'role_auth') {
      result.role_authorizations = await getAuthorizations(roleCode || undefined);
    }
    if (type === 'all' || type === 'user_roles') {
      if (userId) {
        result.user_roles = await getUserRoles(userId);
      } else {
        const res = await db.execute(sql`SELECT * FROM fin_user_role ORDER BY user_id, role_code`);
        result.user_roles = res.rows;
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      code: 'FRPC',
      aliasCodes: ['PFCG', 'SU01', 'FUSC', 'FROC'],
      message: `Role/permission checks – FRPC own IP – ${Object.keys(result).length} types – authorization_objects, role_authorizations, user_roles – for large org with 1000s employees – ensures user can only post for authorized plant, movement, company code, GL, etc. – checks in APIs – 403 if not authorized – e.g., M_BEST_WRK plant 1000, M_MSEG_BWA movement 101, F_BKPF_BUK company code 1000, F_BKPF_KTO GL 1400000001 – industry standard – data available in DB – modules will use as reworked`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  await ensureTables();

  try {
    const body = await req.json();
    const { type, role_code, auth_object_code, field_name, field_value, user_id } = body;

    if (!type) return NextResponse.json({ error: 'type required – auth_object, role_auth, user_role, check' }, { status: 400 });

    if (type === 'auth_object') {
      const { code, description } = body;
      if (!code) return NextResponse.json({ error: 'code required for auth_object' }, { status: 400 });
      const res = await db.execute(sql`
        INSERT INTO fin_authorization_object (code, description)
        VALUES (${code.toUpperCase()}, ${description || null})
        ON CONFLICT (code) DO UPDATE SET description = ${description || null}
        RETURNING *
      `);
      return NextResponse.json({ success: true, data: res.rows[0], code: 'FRPC', message: `Authorization object ${code} created – FRPC own IP – e.g., M_BEST_WRK plant authorization` });
    }

    if (type === 'role_auth') {
      if (!role_code || !auth_object_code || !field_name || !field_value) return NextResponse.json({ error: 'role_code, auth_object_code, field_name, field_value required for role_auth' }, { status: 400 });
      const res = await db.execute(sql`
        INSERT INTO fin_role_authorization (role_code, auth_object_code, field_name, field_value)
        VALUES (${role_code.toUpperCase()}, ${auth_object_code.toUpperCase()}, ${field_name}, ${field_value})
        RETURNING *
      `);
      return NextResponse.json({ success: true, data: res.rows[0], code: 'FRPC', message: `Role authorization ${role_code}→${auth_object_code} ${field_name}=${field_value} created – e.g., PURCHASER with M_BEST_WRK plant 1000 – can only create PO for plant 1000` });
    }

    if (type === 'user_role') {
      if (!user_id || !role_code) return NextResponse.json({ error: 'user_id and role_code required for user_role' }, { status: 400 });
      const res = await db.execute(sql`
        INSERT INTO fin_user_role (user_id, role_code)
        VALUES (${user_id}, ${role_code.toUpperCase()})
        ON CONFLICT (user_id, role_code) DO NOTHING
        RETURNING *
      `);
      return NextResponse.json({ success: true, data: res.rows[0] || { user_id, role_code }, code: 'FRPC', message: `User role ${user_id}→${role_code} created – e.g., admin@er.deepakpt.com with PURCHASER role` });
    }

    if (type === 'check') {
      if (!user_id || !auth_object_code || !field_name || !field_value) return NextResponse.json({ error: 'user_id, auth_object_code, field_name, field_value required for check' }, { status: 400 });
      const result = await checkAuthorization({ user_id, auth_object_code, field_name, field_value });
      return NextResponse.json({
        success: true,
        authorized: result.authorized,
        message: result.message,
        code: 'FRPC',
        check: { user_id, auth_object_code, field_name, field_value },
      });
    }

    return NextResponse.json({ error: `Unknown type ${type}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
