#!/bin/sh
# Fictional Company Setup – Bash wrapper for docker exec
# Usage:
#   docker compose run --rm migrator sh scripts/setupFictionalCompany.sh
#   docker exec -it <container> sh scripts/setupFictionalCompany.sh
#   FULL_WIPE=true docker compose run --rm migrator sh scripts/setupFictionalCompany.sh
#   FULL_WIPE=true npx tsx scripts/setupFictionalCompany.ts

set -e

echo "🚀 Fictional Company Setup – Bash Wrapper"
echo "   FULL_WIPE=${FULL_WIPE:-false}"
echo "   DATABASE_URL=${DATABASE_URL:-not set – will use .env}"

# If FULL_WIPE=true, warn
if [ "${FULL_WIPE}" = "true" ]; then
  echo "💥 FULL_WIPE=true – will TRUNCATE ALL TABLES CASCADE – fresh start"
  echo "   Press Ctrl+C within 3 seconds to abort..."
  sleep 3
fi

# Run TS script via npx tsx
echo "📦 Running npx tsx scripts/setupFictionalCompany.ts..."
npx tsx scripts/setupFictionalCompany.ts

echo ""
echo "✅ Setup complete – check logs above"
echo "   Login: https://er.deepakpt.com/login or http://localhost:3000/login"
echo "   Admin: admin@er.deepakpt.com / Admin@123456"
echo "   Users: erp_admin@fmcg.com / User@123 etc."
