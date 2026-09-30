# Manual Migrations – TEST ONLY – After Actual Build

> ⚠️ **These are NOT part of production auto-migration.**
> They are for **testing purpose only** and must be run **manually after actual build**.

## Why manual-migrations/ exists

- `src/shared/kernel/db/autoMigrate.ts` → runs automatically on `docker compose up --build` – **production minimal** – only ensures `auth_user`, `core_tenant`, `org_legal_entity`, `fin_field_status_variant` FSSV-1000 etc. – does NOT create fictional company.
- `src/shared/kernel/db/initProduction.ts` → production minimal init – no demo data.
- `manual-migrations/` → **TEST ONLY** – creates fictional company admin masters for testing PR→IV, SD, PP, FICO, HR, Audit.

This separation ensures:
- `docker compose up --build` **does NOT delete entries** and does NOT auto-create test data – only critical DB errors (e.g., type already exists 42710) may trigger cleanup – per user requirement.
- Test data is **opt-in** – run explicitly after build.

## Files

| File | Purpose |
|------|---------|
| `001_fictional_company_1000_fmcg_test_only.ts` | Fictional Company 1000 FMCG India Pvt Ltd – TEST ONLY – admin masters auto, ops manual – idempotent – FULL_WIPE optional |

### What 001 creates (admin auto, ops manual)

- Tenant TEN-100, Company Group ECGC-FMCG-01 INR/IN/EN, Currencies INR/USD/EUR/KWD/GBP/AED, UoM KG/PC/L/BOX/BAG/KIT
- Fiscal K4 year_dependent false calendar_year false number_of_periods 12 start_month 4 end_month 3 + 12 periods Apr 2026-Mar 2027
- Field Status Variant FSSV-1000 + Groups G001/G002/G004 bulk 12 fields R/O/S/D
- Posting Calendar PPV-1000 open 01-12/2026 ALL/S/K/D/A, Credit Control CRED-1000
- Chart CA-IN-01 EN, GL 12 accounts BSX 1000000001 WRX 2000000000 GBB 4000000000 PRD 4000000001 KOFI 4000001000 KDM 4000002000 Vendor 2000000001 K Customer 1000000002 D Payroll 6000000000 COGS 5000000000 Retained 2500000001
- Legal Entity 1000 FMCG India Pvt Ltd, Facility FAC-1000 + locations 0001/0002, Sales Area CO-1000/SC-10/PL-10
- Number Ranges SA-01/KR-01 etc, Doc Types SA/KR/KZ/RE/WE/RV, Tolerance GL-01/VEND-01, Auto Account OBYC BSX/WRX/GBB/PRD/KDM, Movement Types 101/102/261/601/602/122 OMJJ, Tax GST0/5/12/18/28/IGST18, Cost Centers
- Roles 17 ERP_ADMIN to PAYROLL_CLERK, Users 16 erp_admin@fmcg.com to payroll_clerk_01 password User@123 + superadmin admin@er.deepakpt.com / Admin@123456

### What it does NOT create (manual ops left for user)

- PR → PO → GR → IV (MM)
- Sales Order → Delivery → Billing (SD)
- Production Order → Confirmation (PP)
- Journal Entries, Payments, Dunning (FICO)
- HR Master, Payroll Runs
- Audit Reports

## Usage – AFTER actual build

```bash
# 1. Build and start – production minimal – no test data
docker compose up --build -d

# 2. Check logs – auto-migrate should have run, tables exist, admin ensured
docker compose logs migrator

# 3. Run manual test migration – idempotent – preserves data
docker compose run --rm migrator npm run db:seed:fictional:test
# or
docker compose run --rm migrator npx tsx manual-migrations/001_fictional_company_1000_fmcg_test_only.ts

# 4. Via docker exec if containers already up
docker ps  # find migrator or app
docker exec -it erp-migrator-1 npm run db:seed:fictional:test

# 5. Full wipe + fresh – TEST ONLY – deletes ALL transactions
FULL_WIPE=true docker compose run --rm migrator npm run db:seed:fictional:test:wipe
FULL_WIPE=true docker compose run --rm migrator npx tsx manual-migrations/001_fictional_company_1000_fmcg_test_only.ts

# 6. Local outside docker
npm run db:seed:fictional:test
FULL_WIPE=true npm run db:seed:fictional:test:wipe
```

## Idempotency & Safety

- Default: `ON CONFLICT DO NOTHING` – safe to run multiple times – does NOT delete entries – preserves manual PR→IV data.
- `FULL_WIPE=true`: `TRUNCATE <all tables> CASCADE` – then recreates – use only for fresh start or critical DB type errors.
- Respects fix: `docker-compose.yml` auto-migrate now only `npm run db:auto-migrate` – no `drizzle-kit push --force` on every up – so `postgres_data` volume persists.

## Related – old location (deprecated shim)

- `scripts/setupFictionalCompany.ts` – now a thin wrapper that calls `manual-migrations/001_fictional_company_1000_fmcg_test_only.ts` – kept for backward compat – logs TEST ONLY warning.
- `scripts/setupFictionalCompany.sh` – updated to point to manual-migrations.

## After Running

1. Login: http://localhost:3000/login or https://er.deepakpt.com/login
   - admin@er.deepakpt.com / Admin@123456 (super admin)
   - erp_admin@fmcg.com / User@123 (ERP admin for 1000)
2. Verify: Company Group ECGC-FMCG-01, Legal Entity 1000, K4, FSSV-1000, PPV-1000, CRED-1000, CA-IN-01
3. Manually test PR→PO→GR→IV with different users per role matrix
