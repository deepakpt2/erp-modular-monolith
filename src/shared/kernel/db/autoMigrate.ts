/**
 * Auto Migrate - Runs on docker compose startup
 * 
 * Responsibilities:
 * 1. Checks DB connection.
 * 2. Migrates schemas/types safely via Drizzle and raw SQL if necessary.
 * 3. Ensures the initial root ADMIN user exists from ADMIN_EMAIL / ADMIN_PASSWORD.
 * 
 * NOTE: Does NOT auto-seed business master data (companies, materials, vendors).
 * Master data setup is strictly manual via UI or dedicated manual migration scripts.
 */

import { db } from './client';
import { sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

async function waitForDb(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      await db.execute(sql`SELECT 1`);
      console.log('✅ DB connection ready');
      return true;
    } catch (e) {
      console.log(`⏳ Waiting for DB... attempt ${i + 1}/${retries}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('DB not ready after 30 attempts');
}

async function checkTablesExist() {
  try {
    const res = await db.execute(sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'auth_user') as exists`);
    return Boolean((res.rows[0] as any)?.exists);
  } catch {
    return false;
  }
}

async function ensureAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@er.deepakpt.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'System Admin';

  try {
    const check = await db.execute(sql`SELECT id FROM auth_user WHERE email = ${adminEmail} LIMIT 1`);
    if (check.rows.length > 0) {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
      try {
        const hash = await bcrypt.hash(adminPassword, 10);
        await db.execute(sql`
          UPDATE auth_user SET password_hash = ${hash}, role='OWNER', is_active=true, name=${adminName}
          WHERE email = ${adminEmail}
        `);
        console.log(`✅ Admin password re-synced to .env for: ${adminEmail}`);
      } catch (e: any) {
        console.warn('⚠️ Could not re-sync admin password:', e.message);
      }
      return;
    }
  } catch (e: any) {
    console.log('⚠️ auth_user table check failed, ensuring table exists:', e.message);
  }

  try {
    console.log(`🔐 Creating admin user: ${adminEmail}`);
    const hash = await bcrypt.hash(adminPassword, 10);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS auth_user (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(255) UNIQUE NOT NULL,
        name varchar(255),
        role varchar(50) DEFAULT 'OWNER',
        is_active boolean DEFAULT true,
        password_hash varchar(255),
        created_at timestamp DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      INSERT INTO auth_user (email, name, role, is_active, password_hash)
      VALUES (${adminEmail}, ${adminName}, 'OWNER', true, ${hash})
      ON CONFLICT (email) DO UPDATE SET password_hash=${hash}, role='OWNER', is_active=true, name=${adminName}
    `);
    console.log(`✅ Admin user ensured: ${adminEmail}`);
  } catch (err: any) {
    console.error('❌ Admin creation failed:', err.message);
  }
}

async function runAutoMigrate() {
  console.log('🚀 Auto Migrate starting (schema & admin only)...');
  console.log(`   AUTO_MIGRATE=${process.env.AUTO_MIGRATE}`);
  console.log(`   ADMIN_EMAIL=${process.env.ADMIN_EMAIL || 'admin@er.deepakpt.com'}`);

  if (process.env.AUTO_MIGRATE === 'false') {
    console.log('⏭️  AUTO_MIGRATE=false, skipping auto migration.');
    return;
  }

  await waitForDb();

  // Handle prod_item_type enum/table collision if necessary
  try {
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prod_item_type_enum') THEN
          CREATE TYPE prod_item_type_enum AS ENUM ('RAW','FINISHED','SEMI','TRADING','PACKAGING','CONSUMABLE','SERVICE');
        END IF;
      END$$;
    `);
  } catch (e: any) {
    console.warn('⚠️ prod_item_type enum ensure note:', e.message);
  }

  const tablesExist = await checkTablesExist();
  if (!tablesExist) {
    console.log('📦 Core tables not detected, running drizzle-kit push...');
    try {
      const { execSync } = await import('child_process');
      execSync('npx drizzle-kit push --force', { stdio: 'inherit', env: process.env });
      console.log('✅ drizzle-kit push completed');
    } catch (e: any) {
      console.log('⚠️ drizzle-kit push returned note (schema might already exist partially):', e.message);
    }
  } else {
    console.log('✅ Core tables exist, skipping initial push.');
  }

  // Always ensure root admin exists
  await ensureAdmin();

  console.log('');
  console.log('✅ Auto Migrate completed: clean schema ready, no demo data injected.');
  console.log(`   Admin Login: ${process.env.ADMIN_EMAIL || 'admin@er.deepakpt.com'}`);
  console.log('');
}

runAutoMigrate()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Auto Migrate failed:', e);
    process.exit(1);
  });
