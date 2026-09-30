/**
 * DEPRECATED SHIM – TEST ONLY – MANUAL MIGRATION WRAPPER
 * 
 * This file is kept for backward compat – it now delegates to:
 * manual-migrations/001_fictional_company_1000_fmcg_test_only.ts
 * 
 * ⚠️ TEST ONLY – NOT part of production auto-migration
 * - NOT called by autoMigrate.ts / initProduction.ts
 * - NOT run on docker compose up --build
 * - Run AFTER actual build manually:
 *   docker compose run --rm migrator npx tsx manual-migrations/001_fictional_company_1000_fmcg_test_only.ts
 * 
 * Use: npm run db:seed:fictional:test (points to manual-migrations)
 */

console.log('');
console.log('=================================================================');
console.log('⚠️  DEPRECATED – scripts/setupFictionalCompany.ts');
console.log('   This is a shim – real file is now:');
console.log('   manual-migrations/001_fictional_company_1000_fmcg_test_only.ts');
console.log('   TEST ONLY – MANUAL MIGRATION – NOT PART OF PRODUCTION');
console.log('   Run AFTER actual build:');
console.log('   docker compose run --rm migrator npm run db:seed:fictional:test');
console.log('=================================================================');
console.log('');

// Delegate to actual manual migration – dynamic import without .ts extension for TS compat
import('../manual-migrations/001_fictional_company_1000_fmcg_test_only').catch(e=>{
  console.error('❌ Failed to load manual migration:', e);
  console.log('   Try: npx tsx manual-migrations/001_fictional_company_1000_fmcg_test_only.ts');
  console.log('   Or: npm run db:seed:fictional:test');
  process.exit(1);
});
