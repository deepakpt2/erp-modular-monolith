# Fictional Company Setup – 1000 FMCG India Pvt Ltd – TEST ONLY – MANUAL

> ⚠️ MOVED – Now in `manual-migrations/001_fictional_company_1000_fmcg_test_only.ts` – TEST ONLY – MANUAL AFTER BUILD – NOT PART OF PRODUCTION AUTO-MIGRATION

## Purpose
Auto-create **all admin/master data** needed to safely test day-to-day operations (PR→IV, SD, PP, FICO, HR, Audit) without manual foundation setup – **FOR TESTING PURPOSE ONLY**.

**Real Script:** `manual-migrations/001_fictional_company_1000_fmcg_test_only.ts` (TSX migrator, idempotent, MANUAL ONLY)
**Shim:** `scripts/setupFictionalCompany.ts` – deprecated wrapper that delegates to manual-migrations – kept for backward compat
**Docs:** `manual-migrations/README.md` – explains manual after build usage

**NOT part of main migration:**
- NOT called by `src/shared/kernel/db/autoMigrate.ts` / `initProduction.ts`
- NOT run on `docker compose up --build` – only `npm run db:auto-migrate` runs on build
- Must be run MANUALLY AFTER actual build: `docker compose run --rm migrator npm run db:seed:fictional:test`

## What it creates (per guide defaults)

| Area | Code / Values |
|------|---------------|
| **Tenant** | TEN-100 (1000 FMCG Demo Tenant) |
| **Company Group** | ECGC-FMCG-01 – Currency INR – Country IN – Language EN |
| **Currencies** | INR, USD, EUR, KWD, GBP, AED |
| **UoM** | KG, PC, L, BOX, BAG, KIT |
| **Fiscal Calendar** | K4 – year_dependent false – calendar_year false – 12 periods – start_month 4 end_month 3 (Apr-Mar India) + 12 fiscal periods 2026-04 to 2027-03 |
| **Field Status Variant** | FSSV-1000 – active, 12 fields (cost_center, profit_center, tax_code, plant, business_area, text, assignment, trading_partner, etc.) status R/O/S/D |
| **Field Status Groups** | G001, G002, G004 bulk – linked to FSSV-1000 |
| **Posting Calendar** | PPV-1000 – open 01-12/2026 for ALL/S/K/D/A – closed before |
| **Credit Control** | CRED-1000 – risk cat LOW/MED/HIGH – INR |
| **Chart of Accounts** | CA-IN-01 – language EN – type OPERATING |
| **GL Accounts** | 12 accounts – BSX 1000000001 GR/IR, WRX 2000000000 GR/IR, GBB 4000000000 Offsetting, PRD 4000000001 Price Diff, KOFI 4000001000 Inventory Adj, KDM 4000002000 Exchange Diff, 2000000001 Vendor Recon, 1000000002 Customer Recon, 6000000000 Payroll, 5000000000 COGS, 2500000001 Retained, plus extra |
| **Legal Entity** | 1000 – 1000 FMCG India Pvt Ltd – INR – IN – ECGC-FMCG-01 – CA-IN-01 – K4 – PPV-1000 – CRED-1000 – FSSV-1000 – FAC-1000 |
| **Facility / Plant** | FAC-1000 – 1000 FMCG Plant |
| **Storage Locations** | 0001 RM Store, 0002 FG Store – FAC-1000 |
| **Sales Area** | CO-1000 / SC-10 / PL-10 – FMCG Sales / Direct / Standard Price |
| **Number Ranges** | SA-01, KR-01, DR-01, PR-01, PO-01, MAT-01, CUST-01, VEND-01, CC-01, PC-01, 2026 |
| **Document Types** | SA – G/L, KR – Vendor Inv, KZ – Vendor Pay, RE – Vendor Credit, WE – Goods Receipt, RV – Billing |
| **Tolerance Groups** | GL-01, VEND-01 |
| **Auto Account (OBYC)** | BSX/WRX/GBB/PRD/KDM/KOFI/KOFK linked to GLs |
| **Movement Types (OMJJ)** | 101 GR PO, 102 GR Reverse, 261 GI Order, 601 GI Delivery, 602 GD Reverse, 122 Return to Vendor |
| **Tax Codes** | GST0 0%, GST5 5%, GST12 12%, GST18 18%, GST28 28%, IGST18 18% IGST |
| **Cost Centers / Profit Centers** | CC-1000 Production, CC-1001 Sales, CC-1002 Admin + PC-1000 etc. |
| **Roles** | 17 roles – ERP_ADMIN, FICO_ADMIN/CONSULTANT/USER, MM_ADMIN/BUYER, SD_ADMIN/SALES_REP, PP_ADMIN/PLANNER, QM_INSPECTOR, PM_TECHNICIAN, HR_ADMIN, AUDITOR, PAYROLL_CLERK |
| **Users** | 16 users – erp_admin@fmcg.com ... payroll_clerk_01@fmcg.com – password User@123 – superadmin admin@er.deepakpt.com / Admin@123456 |

## What it DOES NOT create (manual ops – left for user)
- PR → PO → GR → IV (MM)
- Sales Order → Delivery → Billing (SD)
- Production Order → Confirmation → Goods Movements (PP)
- Journal Entries, Payments, Dunning (FICO)
- HR Master, Payroll Runs
- Audit Reports

This ensures after running script, you can immediately test day-to-day transactions.

## Usage

### Via docker compose (recommended)
```bash
# Normal – idempotent – preserves existing data – ON CONFLICT DO NOTHING
docker compose run --rm migrator npm run db:seed:fictional

# Or directly
docker compose run --rm migrator npx tsx scripts/setupFictionalCompany.ts

# Full wipe + fresh create – TRUNCATE CASCADE – deletes ALL transactions
FULL_WIPE=true docker compose run --rm migrator npm run db:seed:fictional:wipe
# or
docker compose run --rm migrator sh scripts/setupFictionalCompany.sh
FULL_WIPE=true docker compose run --rm migrator sh scripts/setupFictionalCompany.sh
```

### Via docker exec (if containers already up)
```bash
docker ps  # find migrator or app container
docker exec -it erp-migrator-1 npm run db:seed:fictional
docker exec -it erp-migrator-1 npx tsx scripts/setupFictionalCompany.ts

# With wipe
docker exec -it erp-migrator-1 sh -c "FULL_WIPE=true npx tsx scripts/setupFictionalCompany.ts"
```

### Local (outside docker)
```bash
npm run db:seed:fictional
FULL_WIPE=true npm run db:seed:fictional:wipe
```

## Idempotency & Data Safety
- **Default mode:** Uses `ON CONFLICT (code) DO NOTHING` / `ON CONFLICT (id) DO NOTHING` – safe to run multiple times – does NOT delete entries.
- **FULL_WIPE=true mode:** Runs `TRUNCATE <all 60+ tables> CASCADE` – then recreates everything – use only when you want fresh start or critical DB type errors (42710 etc.).
- This respects the fix: `docker compose up --build` no longer runs `drizzle-kit push --force` – only `npm run db:auto-migrate` which checks tables exist – so `postgres_data` volume persists across builds.

## After Running
1. Login: https://er.deepakpt.com/login
   - admin@er.deepakpt.com / Admin@123456 (super admin)
   - erp_admin@fmcg.com / User@123 (ERP admin for 1000)
2. Verify foundation: Company Group ECGC-FMCG-01, Legal Entity 1000, K4, FSSV-1000, PPV-1000, CRED-1000, CA-IN-01
3. Create PR → PO → GR → IV manually to test MM flow
4. Create Cost Centers already present – post journals

## Notes
- Fiscal K4: `year_dependent false`, `calendar_year false`, `number_of_periods 12`, `start_month 4`, `end_month 3` – per user requirement – Apr-Mar Indian fiscal.
- Field Status: FSSV-1000 + groups G001/G002/G004 – 12 fields each – OBC4/OBC5 SAP-like.
- GLs: BSX/WRX/GBB/PRD/KDM/KOFI/KOFK auto accounts covered.
- All 10+ GLs + facilities + locations + sales area per requirement.
