/**
 * Create First Admin User - Production safe, WITHOUT demo data
 * Works WITHOUT seed.ts - only needs auth_user table (from db:push)
 * 
 * Usage:
 *   npx tsx src/shared/kernel/db/createAdmin.ts
 *   npx tsx src/shared/kernel/db/createAdmin.ts --email=you@example.com --password=StrongPass@123
 *   ADMIN_EMAIL=you@domain.com ADMIN_PASSWORD=StrongPass@123 npx tsx src/shared/kernel/db/createAdmin.ts
 * 
 * In Docker:
 *   docker compose exec app npm run db:create-admin
 *   docker compose exec app npx tsx src/shared/kernel/db/createAdmin.ts --email=you@example.com --password=StrongPass
 * 
 * Or via SQL directly (if container not running):
 *   docker compose exec postgres psql -U postgres -d erp -c "UPDATE auth_user SET password_hash = '\$2a\$10\$...' WHERE email = 'admin@example.com'"
 */

import { db } from './client';
import { sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

async function createAdmin() {
  // Parse CLI args --email= --password= --name=
  const args = process.argv.slice(2);
  const getArg = (key: string) => {
    const arg = args.find(a => a.startsWith(`--${key}=`));
    return arg ? arg.split('=')[1] : undefined;
  };

  const adminEmail = getArg('email') || process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = getArg('password') || process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = getArg('name') || process.env.ADMIN_NAME || 'System Admin';

  console.log(`🔐 Creating first admin user (production safe, no demo data)...`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Domain: ${process.env.DOMAIN || 'erp.example.com'}`);

  // Validate
  if (!adminEmail.includes('@')) {
    console.error('❌ Invalid email');
    process.exit(1);
  }
  if (adminPassword.length < 8) {
    console.error('❌ Password must be at least 8 chars');
    process.exit(1);
  }

  const hash = await bcrypt.hash(adminPassword, 10);

  try {
    // Check if table exists
    await db.execute(sql`SELECT 1 FROM auth_user LIMIT 1`);
  } catch (e: any) {
    console.error('❌ auth_user table does not exist. Run db:push first:');
    console.error('   npm run db:push');
    console.error('   or');
    console.error('   docker compose exec app npx drizzle-kit push');
    console.error('');
    console.error('   Error:', e.message);
    process.exit(1);
  }

  // Upsert admin user - works even without any other data
  await db.execute(sql`
    INSERT INTO auth_user (email, name, role, is_active, password_hash)
    VALUES (${adminEmail}, ${adminName}, 'OWNER', true, ${hash})
    ON CONFLICT (email) DO UPDATE SET 
      password_hash = ${hash},
      role = 'OWNER',
      is_active = true,
      name = ${adminName}
  `);

  console.log('');
  console.log(`✅ Admin user created/updated (PRODUCTION SAFE):`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Role: OWNER (can approve all workflows, manage users)`);
  console.log(`   Hash: ${hash.substring(0, 20)}...`);
  console.log('');
  console.log(`   Login: https://${process.env.DOMAIN || 'erp.example.com'}/login`);
  console.log('');
  console.log(`   🔒 Security:`);
  console.log(`   - Change password after first login via UI or re-run this script`);
  console.log(`   - In production, delete DEFAULT_USER_PASSWORD from .env`);
  console.log(`   - Use strong password: at least 12 chars, mixed case, numbers, symbols`);
  console.log('');
  console.log(`   To change password:`);
  console.log(`   ADMIN_EMAIL=${adminEmail} ADMIN_PASSWORD=NewStrongPass@123 npx tsx src/shared/kernel/db/createAdmin.ts`);
  console.log(`   or`);
  console.log(`   npx tsx src/shared/kernel/db/createAdmin.ts --email=${adminEmail} --password=NewStrongPass@123`);
  console.log('');
  console.log(`   Without seed (actual production) - minimal steps:`);
  console.log(`   1. docker compose up -d postgres (or full app)`);
  console.log(`   2. docker compose exec app npm run db:push  (creates tables)`);
  console.log(`   3. docker compose exec app npm run db:create-admin  (creates first admin, NO demo data)`);
  console.log(`   4. Login at https://erp.example.com/login`);
  console.log(`   OR for full foundation without demo materials:`);

  process.exit(0);
}

createAdmin().catch((e) => {
  console.error('❌ Failed to create admin:', e);
  process.exit(1);
});
