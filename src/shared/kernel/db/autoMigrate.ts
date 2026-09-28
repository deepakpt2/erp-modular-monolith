/**
 * Auto Migrate & Seed - Runs automatically on docker compose up
 * Reads preferences from .env: AUTO_MIGRATE, FMCG_SAMPLE_DATA_ENABLED
 * 
 * Usage: npx tsx src/shared/kernel/db/autoMigrate.ts
 * Or: npm run db:auto-migrate
 * 
 * This is called by docker-compose auto-migrate service on startup
 */

import { db } from './client';
import { sql } from 'drizzle-orm';

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
    const res = await db.execute(sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ent_client') as exists`);
    return (res.rows[0] as any).exists;
  } catch {
    return false;
  }
}

async function runAutoMigrate() {
  console.log('🚀 Auto Migrate starting...');
  console.log(`   AUTO_MIGRATE=${process.env.AUTO_MIGRATE}`);
  console.log(`   FMCG_SAMPLE_DATA_ENABLED=${process.env.FMCG_SAMPLE_DATA_ENABLED}`);
  console.log(`   DATABASE_URL=${process.env.DATABASE_URL ? 'set' : 'NOT SET'}`);

  if (process.env.AUTO_MIGRATE !== 'true') {
    console.log('⏭️  AUTO_MIGRATE != true, skipping auto migration. Run manually: npm run db:push && npm run db:init-prod');
    return;
  }

  await waitForDb();

  const tablesExist = await checkTablesExist();
  if (!tablesExist) {
    console.log('📦 Tables do not exist, you need to run db:push first via drizzle-kit');
    console.log('   Attempting to run drizzle-kit push programmatically...');
    try {
      // Try to push schema using drizzle-kit via dynamic import if available
      const { execSync } = await import('child_process');
      console.log('   Running: npx drizzle-kit push --force');
      execSync('npx drizzle-kit push --force', { stdio: 'inherit', env: process.env });
      console.log('✅ drizzle-kit push completed');
    } catch (e) {
      console.log('⚠️  drizzle-kit push failed or not available, continuing with init-prod (tables may be created via SQL)');
      console.log('   Error:', (e as any).message);
    }
  }

  // Check if client exists, if not run initProduction
  try {
    const clientRes = await db.execute(sql`SELECT id FROM ent_client WHERE code = '100' LIMIT 1`);
    if (clientRes.rows.length === 0) {
      console.log('🏗️  Client 100 not found, running initProduction...');
      const { initProduction } = await import('./initProduction');
      await initProduction();
      console.log('✅ initProduction completed');
    } else {
      console.log('✅ Client 100 exists, skipping init-prod (already initialized)');
    }
  } catch (e) {
    console.log('⚠️  Check client failed, attempting init-prod anyway:', (e as any).message);
    try {
      const { initProduction } = await import('./initProduction');
      await initProduction();
    } catch (err) {
      console.log('❌ initProduction failed:', (err as any).message);
    }
  }

  // KS01 Kerala Spices - per PDF guide - always seed unless explicitly disabled
  const ksplEnabled = process.env.KSPL_ENABLED !== 'false'; // default true
  if (ksplEnabled) {
    console.log('🌶️  KSPL_ENABLED != false, seeding KS01 Kerala Spices per PDF...');
    try {
      const { seedKS01 } = await import('./seedKS01');
      await seedKS01();
      console.log('✅ KS01 Kerala Spices seed completed');
    } catch (e) {
      console.log('❌ KS01 seed failed:', (e as any).message);
      console.error(e);
    }
  } else {
    console.log('⏭️  KSPL_ENABLED=false, skipping KS01 seed');
  }

  // FMCG Sample Data based on env
  const fmcgEnabled = process.env.FMCG_SAMPLE_DATA_ENABLED === 'true';
  if (fmcgEnabled) {
    console.log('🏭 FMCG_SAMPLE_DATA_ENABLED=true, seeding FMCG sample data...');
    try {
      const { seedFmcg } = await import('./seedFmcg');
      await seedFmcg();
      console.log('✅ FMCG seed completed');
    } catch (e) {
      console.log('❌ FMCG seed failed:', (e as any).message);
    }
  } else {
    console.log('⏭️  FMCG_SAMPLE_DATA_ENABLED != true, skipping FMCG seed (clean production)');
  }

  console.log('');
  console.log('✅ Auto Migrate completed successfully');
  console.log(`   Admin: ${process.env.ADMIN_EMAIL || 'admin@er.deepakpt.com'}`);
  console.log(`   Domain: ${process.env.DOMAIN || 'er.deepakpt.com'}`);
  console.log(`   FMCG: ${fmcgEnabled ? 'ENABLED (23 mats)' : 'DISABLED (clean prod)'}`);
  console.log('');
}

runAutoMigrate()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Auto Migrate failed:', e);
    process.exit(1);
  });
