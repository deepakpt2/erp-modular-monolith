# Add backend validation to critical APIs
import os

# Map API file to validation logic
validations = {
    "src/app/api/company-groups/route.ts": """
      if (tenant_code) {
        const tr = await db.execute(sql`SELECT id FROM core_tenant WHERE code = ${tenant_code} LIMIT 1`);
        if (tr.rows.length === 0) {
          return NextResponse.json({ error: `TENANT_CODE ${tenant_code} not found in DB – create it first. Valid: /api/tenants` }, { status: 400 });
        }
      }
""",
    "src/app/api/facilities/route.ts": """
      if (legal_entity_code) {
        const le = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code = ${legal_entity_code} LIMIT 1`);
        if (le.rows.length === 0) {
          return NextResponse.json({ error: `LEGAL_ENTITY_CODE ${legal_entity_code} not found in DB – create it first via ELEC. Valid: /api/legal-entities` }, { status: 400 });
        }
      }
""",
    "src/app/api/inventory-locations/route.ts": """
      if (facility_code) {
        const f = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${facility_code} LIMIT 1`);
        if (f.rows.length === 0) {
          return NextResponse.json({ error: `FACILITY_CODE ${facility_code} not found in DB – create it first via EFCC` }, { status: 400 });
        }
      }
""",
    "src/app/api/procurement-divisions/route.ts": """
      if (tenant_code) {
        const tr = await db.execute(sql`SELECT id FROM core_tenant WHERE code = ${tenant_code} LIMIT 1`);
        if (tr.rows.length === 0) {
          return NextResponse.json({ error: `TENANT_CODE ${tenant_code} not found` }, { status: 400 });
        }
      }
""",
    "src/app/api/buyer-teams/route.ts": """
      if (procurement_division_code) {
        const pd = await db.execute(sql`SELECT id FROM org_procurement_division WHERE code = ${procurement_division_code} LIMIT 1`);
        if (pd.rows.length === 0) {
          return NextResponse.json({ error: `PROCUREMENT_DIVISION_CODE ${procurement_division_code} not found – create via EPDC` }, { status: 400 });
        }
      }
""",
    "src/app/api/commercial-orgs/route.ts": """
      if (legal_entity_code) {
        const le = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code = ${legal_entity_code} LIMIT 1`);
        if (le.rows.length === 0) {
          return NextResponse.json({ error: `LEGAL_ENTITY_CODE ${legal_entity_code} not found – create via ELEC` }, { status: 400 });
        }
      }
""",
    "src/app/api/profit-units/route.ts": """
      if (legal_entity_code) {
        const le = await db.execute(sql`SELECT id FROM org_legal_entity WHERE code = ${legal_entity_code} LIMIT 1`);
        if (le.rows.length === 0) {
          return NextResponse.json({ error: `LEGAL_ENTITY_CODE ${legal_entity_code} not found` }, { status: 400 });
        }
      }
      if (control_area_code) {
        const ca = await db.execute(sql`SELECT id FROM org_mgmt_control_area WHERE code = ${control_area_code} LIMIT 1`);
        if (ca.rows.length === 0) {
          return NextResponse.json({ error: `CONTROL_AREA_CODE ${control_area_code} not found` }, { status: 400 });
        }
      }
""",
    "src/app/api/cost-units/route.ts": """
      if (control_area_code) {
        const ca = await db.execute(sql`SELECT id FROM org_mgmt_control_area WHERE code = ${control_area_code} LIMIT 1`);
        if (ca.rows.length === 0) {
          return NextResponse.json({ error: `CONTROL_AREA_CODE ${control_area_code} not found` }, { status: 400 });
        }
      }
""",
    "src/app/api/warehouse-sites/route.ts": """
      if (facility_code) {
        const f = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${facility_code} LIMIT 1`);
        if (f.rows.length === 0) {
          return NextResponse.json({ error: `FACILITY_CODE ${facility_code} not found` }, { status: 400 });
        }
      }
""",
    "src/app/api/dispatch-points/route.ts": """
      if (facility_code) {
        const f = await db.execute(sql`SELECT id FROM org_facility WHERE code = ${facility_code} LIMIT 1`);
        if (f.rows.length === 0) {
          return NextResponse.json({ error: `FACILITY_CODE ${facility_code} not found` }, { status: 400 });
        }
      }
""",
}

for path, validation_code in validations.items():
    if not os.path.exists(path):
        print(f"SKIP {path} not found")
        continue
    txt = open(path, encoding="utf-8").read()
    # Find where to insert validation – after extracting body fields, before insert
    # Look for "if (!code || !name)" or similar
    # Insert validation after that check
    if "VALIDATION: Check foreign keys" in txt:
        print(f"Already has validation {path}")
        continue
    # Insert after first if (!code) check
    # Find pattern
    import re
    # Insert validation after body destructuring
    # Look for "const { code, name" line
    m = re.search(r"(const \{[^}]*code[^}]*\} = body;\s*)", txt)
    if m:
        insert_pos = m.end()
        new_txt = txt[:insert_pos] + "\n      // VALIDATION: Check foreign keys exist in DB – prevents invalid data\n" + validation_code + "\n" + txt[insert_pos:]
        open(path, "w", encoding="utf-8").write(new_txt)
        print(f"ADDED VALIDATION to {path}")
    else:
        print(f"Could not find insertion point for {path}")

