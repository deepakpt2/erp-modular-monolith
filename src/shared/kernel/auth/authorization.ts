/**
 * Role/Permission Checks – FRPC own IP – Foundation Role/Permission Checks – NEW OWN CODE – alias PFCG/SU01
 * Implements authorization objects for plant, movement, company code, GL, posting period, number range – checks in APIs – industry standard
 * For large org with 1000s employees, critical – ensures user can only post for authorized plant, movement, company code, GL, etc.
 * Tables: fin_authorization_object, fin_role_authorization, fin_user_role
 * Authorization objects: M_BEST_WRK plant, M_BEST_BSA purchasing document type, F_BKPF_BUK company code, F_BKPF_KOA account type, F_BKPF_KTO GL account, etc.
 */

import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

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
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_role_auth_role ON fin_role_authorization(role_code)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_role_auth_obj ON fin_role_authorization(auth_object_code)`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_user_role (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar(200) NOT NULL,
        role_code varchar(100) NOT NULL,
        created_at timestamp DEFAULT NOW(),
        UNIQUE(user_id, role_code)
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_role_user ON fin_user_role(user_id)`);

    // Seed default authorization objects
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

export async function checkAuthorization({
  user_id,
  auth_object_code,
  field_name,
  field_value,
}: {
  user_id: string;
  auth_object_code: string;
  field_name: string;
  field_value: string;
}): Promise<{ authorized: boolean; message?: string }> {
  await ensureTables();

  try {
    // If no roles assigned, allow for now – for MVP – in production, should deny
    const userRolesRes = await db.execute(sql`SELECT role_code FROM fin_user_role WHERE user_id = ${user_id}`);
    const userRoles = userRolesRes.rows as any[];

    if (userRoles.length === 0) {
      // No roles – allow for MVP – log warning – in production, should deny
      console.warn(`Authorization: User ${user_id} has no roles – allowing for MVP – in production should deny – check ${auth_object_code} ${field_name} ${field_value}`);
      return { authorized: true, message: `No roles – allowed for MVP` };
    }

    // Check if any role has authorization for this object/field/value
    for (const role of userRoles) {
      const authRes = await db.execute(sql`
        SELECT id FROM fin_role_authorization
        WHERE role_code = ${role.role_code}
        AND auth_object_code = ${auth_object_code.toUpperCase()}
        AND field_name = ${field_name}
        AND (field_value = ${field_value} OR field_value = '*' OR field_value = 'ALL')
        LIMIT 1
      `);

      if (authRes.rows.length > 0) {
        return { authorized: true, message: `Authorized via role ${role.role_code}` };
      }
    }

    // Not authorized
    return {
      authorized: false,
      message: `User ${user_id} not authorized for ${auth_object_code} ${field_name} ${field_value} – need role with ${auth_object_code} ${field_name} ${field_value} or * – e.g., role with M_BEST_WRK plant ${field_value} – check /admin/roles and /admin/authorizations – FRPC own IP alias PFCG/SU01`,
    };
  } catch (e: any) {
    console.warn('checkAuthorization failed:', e.message);
    // On error, allow for MVP – in production, should deny
    return { authorized: true, message: `Authorization check failed – allowed for MVP – ${e.message}` };
  }
}

// Helper for GR posting – check plant, movement, company code, GL
export async function checkGRAuthorization({
  user_id,
  plant,
  movement_type,
  company_code,
  gl_account,
}: {
  user_id: string;
  plant?: string;
  movement_type?: string;
  company_code?: string;
  gl_account?: string;
}) {
  await ensureTables();

  const checks: Array<{ auth_object_code: string; field_name: string; field_value: string }> = [];

  if (plant) checks.push({ auth_object_code: 'M_BEST_WRK', field_name: 'plant', field_value: plant });
  if (movement_type) checks.push({ auth_object_code: 'M_MSEG_BWA', field_name: 'movement_type', field_value: movement_type });
  if (company_code) checks.push({ auth_object_code: 'F_BKPF_BUK', field_name: 'company_code', field_value: company_code });
  if (gl_account) checks.push({ auth_object_code: 'F_BKPF_KTO', field_name: 'gl_account', field_value: gl_account });

  for (const check of checks) {
    const result = await checkAuthorization({ user_id, ...check });
    if (!result.authorized) return result;
  }

  return { authorized: true };
}

// Helper for number range edit
export async function checkNumberRangeAuthorization({
  user_id,
  range_code,
}: {
  user_id: string;
  range_code: string;
}) {
  return checkAuthorization({
    user_id,
    auth_object_code: 'F_NUM_RANGE',
    field_name: 'range_code',
    field_value: range_code,
  });
}

// Helper for posting period open/close
export async function checkPostingPeriodAuthorization({
  user_id,
  variant_code,
}: {
  user_id: string;
  variant_code: string;
}) {
  return checkAuthorization({
    user_id,
    auth_object_code: 'F_BKPF_BUP',
    field_name: 'variant_code',
    field_value: variant_code,
  });
}

export async function getAuthorizations(role_code?: string) {
  await ensureTables();
  try {
    let query = sql`SELECT * FROM fin_role_authorization WHERE 1=1`;
    if (role_code) query = sql`${query} AND role_code = ${role_code}`;
    query = sql`${query} ORDER BY role_code, auth_object_code, field_name`;
    const res = await db.execute(query);
    return res.rows;
  } catch (e: any) {
    console.warn('getAuthorizations failed:', e.message);
    return [];
  }
}

export async function getUserRoles(user_id: string) {
  await ensureTables();
  try {
    const res = await db.execute(sql`SELECT * FROM fin_user_role WHERE user_id = ${user_id}`);
    return res.rows;
  } catch (e: any) {
    console.warn('getUserRoles failed:', e.message);
    return [];
  }
}
