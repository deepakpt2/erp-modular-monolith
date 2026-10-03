/**
 * Auto Migrate - Clean Enterprise Database Initialization
 * 
 * Responsibilities on fresh boot:
 * 1. Verifies PostgreSQL connection.
 * 2. Runs drizzle-kit push --force to build 100% of the unified enterprise schema from scratch.
 * 3. Pre-populates universal baseline reference standards (Currencies, Fiscal Variants K4/V3, Document Types, Movement Types, Units of Measure).
 * 4. Ensures the initial root ADMIN user exists from ADMIN_EMAIL / ADMIN_PASSWORD.
 */

import { db } from './client';
import { sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { seedIndustryStandardBaseline } from './standardSystemDefaults';
import { execSync } from 'child_process';

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
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
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
      } catch (e: any) {
        console.warn('⚠️ Could not re-sync admin password:', e.message);
      }
      return;
    }
  } catch (e: any) {}

  try {
    console.log(`🔐 Creating admin user: ${adminEmail}`);
    const hash = await bcrypt.hash(adminPassword, 10);
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
  console.log('🚀 Auto Migrate starting: clean enterprise schema & baseline initialization...');

  if (process.env.AUTO_MIGRATE === 'false') {
    console.log('⏭️ AUTO_MIGRATE=false, skipping auto migration.');
    return;
  }

  await waitForDb();

  const tablesExist = await checkTablesExist();
  if (!tablesExist) {
    console.log('📦 Clean database detected. Pushing standard enterprise schemas with drizzle-kit push...');
    try {
      execSync('npx drizzle-kit push --force', { stdio: 'inherit', env: process.env });
      console.log('✅ drizzle-kit push completed: all tables created with pure standard schema.');
    } catch (e: any) {
      console.warn('⚠️ drizzle-kit push note:', e.message);
    }
  } else {
    console.log('✅ Core tables exist. Applying standard baseline updates...');
  }

  // Pre-populate standard industry system-level baseline reference tables
  try {
    await seedIndustryStandardBaseline();
  } catch (err: any) {
    console.warn('⚠️ Standard baseline seeding note:', err.message);
  }

  // Always ensure root admin exists
  await ensureAdmin();

  console.log('✅ Clean database initialization complete.');
  console.log(`   Admin Login: ${process.env.ADMIN_EMAIL || 'admin@example.com'}`);
}

runAutoMigrate()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Auto Migrate failed:', e);
    process.exit(1);
  });
