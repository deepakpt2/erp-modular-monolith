#!/bin/sh
# Fictional Company Setup – Bash wrapper – TEST ONLY – MANUAL AFTER BUILD
# Real file: manual-migrations/001_fictional_company_1000_fmcg_test_only.ts
# This is a shim for backward compat – points to manual-migrations

set -e

echo ""
echo "================================================================="
echo "⚠️  TEST ONLY – MANUAL MIGRATION – AFTER ACTUAL BUILD"
echo "   Real file: manual-migrations/001_fictional_company_1000_fmcg_test_only.ts"
echo "   NOT part of production auto-migrate – docker compose up --build does NOT run this"
echo "   FULL_WIPE=${FULL_WIPE:-false}"
echo "================================================================="
echo ""

# Run manual migration
echo "📦 Running npx tsx manual-migrations/001_fictional_company_1000_fmcg_test_only.ts..."
npx tsx manual-migrations/001_fictional_company_1000_fmcg_test_only.ts

echo ""
echo "✅ Setup complete – TEST ONLY – check logs above"
echo "   Login: https://er.deepakpt.com/login or http://localhost:3000/login"
echo "   Admin: admin@er.deepakpt.com / Admin@123456"
echo "   Users: erp_admin@fmcg.com / User@123 etc."
echo "   Docs: manual-migrations/README.md"
