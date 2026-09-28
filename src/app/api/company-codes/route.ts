import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Company Codes API - OX02, OX15, OX16, OB45, OB38
 * GET /api/company-codes - List company codes
 * POST /api/company-codes - Create company code
 * PUT /api/company-codes - Update company code (edit)
 * DELETE /api/company-codes - Delete company code
 * 
 * 1000 Main Company KWD is seeded by default in Layer 0 seed, but NOT necessary for SIT.
 * You can edit or delete it via PUT/DELETE if no dependent plants/stock/transactions, or with force=true.
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const result = await db.execute(sql`
      SELECT 
        cc.id, cc.code, cc.name, cc.currency_code, cc.city, cc.country, cc.coa_id,
        cc.address, cc.street, cc.postal_code, cc.region, cc.tax_id, cc.gst_number, cc.pan, cc.cin, cc.phone, cc.email, cc.website, cc.legal_form, cc.registration_number, cc.is_active,
        coa.code as coa_code, coa.name as coa_name,
        c.code as client_code, c.name as client_name,
        (SELECT COUNT(*) FROM ent_plant WHERE company_code_id = cc.id) as plant_count,
        (SELECT COUNT(*) FROM fi_cost_center WHERE company_code_id = cc.id) as cost_center_count,
        (SELECT COUNT(*) FROM ent_number_range WHERE company_code_id = cc.id) as number_range_count
      FROM ent_company_code cc
      LEFT JOIN fi_chart_of_accounts coa ON cc.coa_id = coa.id
      LEFT JOIN ent_client c ON cc.client_id = c.id
      ORDER BY cc.code
    `);

    // Also get fiscal year variants, posting period variants, credit control areas
    let fiscalVariants: any[] = [];
    let postingVariants: any[] = [];
    let creditControlAreas: any[] = [];
    try {
      const fv = await db.execute(sql`SELECT code, description FROM fi_fiscal_year_variant ORDER BY code`);
      fiscalVariants = fv.rows;
    } catch {}
    try {
      const pv = await db.execute(sql`SELECT code, name FROM fi_posting_period_variant ORDER BY code`);
      postingVariants = pv.rows;
    } catch {}
    try {
      const cca = await db.execute(sql`SELECT code, description, currency FROM fi_credit_control_area ORDER BY code`);
      creditControlAreas = cca.rows;
    } catch {}

    let currencies: any[] = [];
    try {
      const cur = await db.execute(sql`SELECT code, name, decimal_places, symbol, is_active FROM ent_currency ORDER BY code`);
      currencies = cur.rows;
    } catch {}

    return NextResponse.json({
      companyCodes: result.rows,
      count: result.rows.length,
      fiscalYearVariants: fiscalVariants,
      postingPeriodVariants: postingVariants,
      creditControlAreas: creditControlAreas,
      currencies: currencies,
      defaultCurrency: 'INR',
      source: 'db',
      functionCodes: 'OX15 Company, OX02 Company Code, OX16 Assign Company->Company Code, OB45 Credit Control Area, OB38 Assign Company Code->Credit Control, OY03 Currencies INR default KWD added by user',
      explanation: 'Only INR default per user request – all other currencies like KWD, USD, EUR must be added by user via POST /api/currencies – Code OY03',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, companyCodes: [], source: 'error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { code, name, currency_code, city, country, client_code, coa_code, address, street, postal_code, region, tax_id, gst_number, pan, cin, phone, email, website, legal_form, registration_number } = body;
    if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 });

    // Get client
    let clientId: any = null;
    if (client_code) {
      const cRes = await db.execute(sql`SELECT id FROM ent_client WHERE code = ${client_code} LIMIT 1`);
      if (cRes.rows.length > 0) clientId = (cRes.rows[0] as any).id;
    }
    if (!clientId) {
      const cRes = await db.execute(sql`SELECT id FROM ent_client WHERE code = '100' LIMIT 1`);
      clientId = cRes.rows.length > 0 ? (cRes.rows[0] as any).id : null;
      if (!clientId) {
        const newClient = await db.execute(sql`INSERT INTO ent_client (code, name) VALUES ('100', 'Main Client') ON CONFLICT (code) DO UPDATE SET name = 'Main Client' RETURNING id`);
        clientId = (newClient.rows[0] as any).id;
      }
    }

    // Get CoA
    let coaId: any = null;
    if (coa_code) {
      const coaRes = await db.execute(sql`SELECT id FROM fi_chart_of_accounts WHERE code = ${coa_code} LIMIT 1`);
      if (coaRes.rows.length > 0) coaId = (coaRes.rows[0] as any).id;
    }

    const res = await db.execute(sql`
      INSERT INTO ent_company_code (client_id, code, name, currency_code, city, country, coa_id, address, street, postal_code, region, tax_id, gst_number, pan, cin, phone, email, website, legal_form, registration_number)
      VALUES (${clientId}, ${code}, ${name}, ${currency_code || 'INR'}, ${city || null}, ${country || 'IN'}, ${coaId}, ${address || null}, ${street || null}, ${postal_code || null}, ${region || null}, ${tax_id || null}, ${gst_number || null}, ${pan || null}, ${cin || null}, ${phone || null}, ${email || null}, ${website || null}, ${legal_form || null}, ${registration_number || null})
      ON CONFLICT (code) DO UPDATE SET 
        name = ${name}, 
        currency_code = ${currency_code || 'INR'}, 
        city = ${city || null}, 
        country = ${country || 'IN'},
        address = COALESCE(${address || null}, ent_company_code.address),
        street = COALESCE(${street || null}, ent_company_code.street),
        postal_code = COALESCE(${postal_code || null}, ent_company_code.postal_code),
        region = COALESCE(${region || null}, ent_company_code.region),
        tax_id = COALESCE(${tax_id || null}, ent_company_code.tax_id),
        gst_number = COALESCE(${gst_number || null}, ent_company_code.gst_number),
        pan = COALESCE(${pan || null}, ent_company_code.pan),
        cin = COALESCE(${cin || null}, ent_company_code.cin),
        phone = COALESCE(${phone || null}, ent_company_code.phone),
        email = COALESCE(${email || null}, ent_company_code.email),
        website = COALESCE(${website || null}, ent_company_code.website),
        legal_form = COALESCE(${legal_form || null}, ent_company_code.legal_form),
        registration_number = COALESCE(${registration_number || null}, ent_company_code.registration_number),
        updated_at = NOW()
      RETURNING id, code
    `);

    await db.execute(sql`
      INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description)
      VALUES ('ent_company_code', ${res.rows[0].id}, ${code}, 'INSERT', ${JSON.stringify(body)}::jsonb, ${`Company Code CREATE OX02: ${code} ${name} ${currency_code}`})
    `).catch(()=>{});

    return NextResponse.json({ success: true, companyCode: res.rows[0], message: `Company Code ${code} created (OX02)` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, code, name, currency_code, city, country, address, street, postal_code, region, tax_id, gst_number, pan, cin, phone, email, website, legal_form, registration_number, is_active } = body;
    if (!id && !code) return NextResponse.json({ error: 'id or code required for update' }, { status: 400 });

    // Find existing
    let existingRes;
    if (id) {
      existingRes = await db.execute(sql`SELECT id, code FROM ent_company_code WHERE id = ${id} LIMIT 1`);
    } else {
      existingRes = await db.execute(sql`SELECT id, code FROM ent_company_code WHERE code = ${code} LIMIT 1`);
    }
    if (existingRes.rows.length === 0) return NextResponse.json({ error: 'Company code not found' }, { status: 404 });
    const existingId = (existingRes.rows[0] as any).id;
    const existingCode = (existingRes.rows[0] as any).code;

    const res = await db.execute(sql`
      UPDATE ent_company_code SET
        code = COALESCE(${code}, code),
        name = COALESCE(${name}, name),
        currency_code = COALESCE(${currency_code}, currency_code),
        city = COALESCE(${city}, city),
        country = COALESCE(${country}, country),
        address = COALESCE(${address}, address),
        street = COALESCE(${street}, street),
        postal_code = COALESCE(${postal_code}, postal_code),
        region = COALESCE(${region}, region),
        tax_id = COALESCE(${tax_id}, tax_id),
        gst_number = COALESCE(${gst_number}, gst_number),
        pan = COALESCE(${pan}, pan),
        cin = COALESCE(${cin}, cin),
        phone = COALESCE(${phone}, phone),
        email = COALESCE(${email}, email),
        website = COALESCE(${website}, website),
        legal_form = COALESCE(${legal_form}, legal_form),
        registration_number = COALESCE(${registration_number}, registration_number),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${existingId}
      RETURNING id, code, name
    `);

    await db.execute(sql`
      INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description)
      VALUES ('ent_company_code', ${existingId}, ${existingCode}, 'UPDATE', ${JSON.stringify(body)}::jsonb, ${`Company Code UPDATE OX02: ${existingCode} -> ${code || existingCode} ${name || ''}`})
    `).catch(()=>{});

    return NextResponse.json({ success: true, companyCode: res.rows[0], message: `Company Code ${existingCode} updated to ${res.rows[0].code} (OX02)` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const id = searchParams.get('id');
    const force = searchParams.get('force') === 'true';

    if (!code && !id) return NextResponse.json({ error: 'code or id required' }, { status: 400 });

    // Find company code
    let ccRes;
    if (id) {
      ccRes = await db.execute(sql`SELECT id, code FROM ent_company_code WHERE id = ${id} LIMIT 1`);
    } else {
      ccRes = await db.execute(sql`SELECT id, code FROM ent_company_code WHERE code = ${code} LIMIT 1`);
    }
    if (ccRes.rows.length === 0) return NextResponse.json({ error: 'Company code not found' }, { status: 404 });
    const ccId = (ccRes.rows[0] as any).id;
    const ccCode = (ccRes.rows[0] as any).code;

    // SECURITY: Check dependencies – deleting company with transactions is security problem
    // We must prevent hard delete if any transactional data exists, use soft delete (is_active=false) instead
    const checks: any = {};
    // Master data
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM ent_plant WHERE company_code_id = ${ccId}`); checks.plants = parseInt((r.rows[0] as any).cnt || '0'); } catch { checks.plants = 0; }
    checks.slocs = 0;
    try {
      const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM ent_storage_location WHERE plant_id IN (SELECT id FROM ent_plant WHERE company_code_id = ${ccId})`);
      checks.slocs = parseInt((r.rows[0] as any).cnt || '0');
    } catch { checks.slocs = 0; }
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM fi_cost_center WHERE company_code_id = ${ccId}`); checks.costCenters = parseInt((r.rows[0] as any).cnt || '0'); } catch { checks.costCenters = 0; }
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM ent_number_range WHERE company_code_id = ${ccId}`); checks.numberRanges = parseInt((r.rows[0] as any).cnt || '0'); } catch { checks.numberRanges = 0; }
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM hr_employee WHERE company_code_id = ${ccId}`); checks.employees = parseInt((r.rows[0] as any).cnt || '0'); } catch { checks.employees = 0; }
    checks.materials = 0;
    // Transactional data – CRITICAL: if any exists, block hard delete for security/audit
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_pr WHERE company_code_id = ${ccId}`); checks.pr = parseInt((r.rows[0] as any).cnt || '0'); } catch { checks.pr = 0; }
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_po WHERE company_code_id = ${ccId}`); checks.po = parseInt((r.rows[0] as any).cnt || '0'); } catch { checks.po = 0; }
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_gr WHERE company_code_id = ${ccId}`); checks.gr = parseInt((r.rows[0] as any).cnt || '0'); } catch { checks.gr = 0; }
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_iv WHERE company_code_id = ${ccId}`); checks.iv = parseInt((r.rows[0] as any).cnt || '0'); } catch { checks.iv = 0; }
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM sd_sales_order WHERE company_code_id = ${ccId}`); checks.sales = parseInt((r.rows[0] as any).cnt || '0'); } catch { checks.sales = 0; }
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM sales_orders WHERE company_code_id = ${ccId}`); checks.sales2 = parseInt((r.rows[0] as any).cnt || '0'); } catch { checks.sales2 = 0; }
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM fi_document WHERE company_code_id = ${ccId}`); checks.fiDocs = parseInt((r.rows[0] as any).cnt || '0'); } catch { checks.fiDocs = 0; }
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_stock WHERE company_code_id = ${ccId}`); checks.stock = parseInt((r.rows[0] as any).cnt || '0'); } catch { checks.stock = 0; }
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_physical_inventory WHERE company_code_id = ${ccId}`); checks.physicalInventory = parseInt((r.rows[0] as any).cnt || '0'); } catch { checks.physicalInventory = 0; }

    const hasMaster = checks.plants > 0 || checks.costCenters > 0 || checks.numberRanges > 0 || checks.employees > 0;
    const hasTransactions = checks.pr > 0 || checks.po > 0 || checks.gr > 0 || checks.iv > 0 || checks.sales > 0 || checks.sales2 > 0 || checks.fiDocs > 0 || checks.stock > 0 || checks.physicalInventory > 0;

    // SECURITY: If has transactions, NEVER allow hard delete – only soft delete (is_active=false) to preserve audit trail
    if (hasTransactions) {
      // Soft delete – deactivate
      await db.execute(sql`UPDATE ent_company_code SET is_active = false, updated_at = NOW() WHERE id = ${ccId}`);
      await db.execute(sql`
        INSERT INTO audit_log (table_name, record_id, record_number, action, description)
        VALUES ('ent_company_code', ${ccId}, ${ccCode}, 'UPDATE', ${`Company Code SOFT DELETE (deactivate) OX02: ${ccCode} – has transactions ${JSON.stringify(checks)}, set is_active=false for security – hard delete blocked to preserve audit trail`})
      `).catch(()=>{});
      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: `Company Code ${ccCode} has transactions (PR:${checks.pr} PO:${checks.po} GR:${checks.gr} IV:${checks.iv} FI:${checks.fiDocs} Stock:${checks.stock}) – hard delete BLOCKED for security/audit. Soft deleted (is_active=false) instead. To truly wipe for SIT, use docker compose down -v (full DB wipe) – that's safe for SIT only, not production. 1000 is NOT necessary for SIT.`,
        dependencies: checks,
        security: 'Hard delete blocked when transactions exist to prevent orphaned FI docs, broken document flow, audit trail loss. Use soft delete (is_active=false) – data remains for audit but hidden from UI.',
      });
    }

    if (!force && hasMaster) {
      return NextResponse.json({
        error: `Company Code ${ccCode} has master data: ${checks.plants} plants, ${checks.slocs} SLocs, ${checks.costCenters} cost centers, ${checks.numberRanges} number ranges, ${checks.employees} employees. Delete those first or use ?force=true to cascade master data (only if NO transactions).`,
        code: 'HAS_DEPENDENCIES',
        dependencies: checks,
        hint: `For SIT scratch test with NO transactions, use DELETE /api/company-codes?code=${ccCode}&force=true to delete company and its master data. For full wipe, docker compose down -v. 1000 is NOT necessary for SIT – you can delete it and use your own T001. Standard CoA and UoM etc remain – those are ok to keep per your note.`,
      }, { status: 400 });
    }

    if (force && !hasTransactions) {
      // Cascade delete master data only – safe because no transactions
      await db.execute(sql`DELETE FROM ent_storage_location WHERE plant_id IN (SELECT id FROM ent_plant WHERE company_code_id = ${ccId})`).catch(()=>{});
      await db.execute(sql`DELETE FROM ent_plant WHERE company_code_id = ${ccId}`).catch(()=>{});
      await db.execute(sql`DELETE FROM fi_cost_center WHERE company_code_id = ${ccId}`).catch(()=>{});
      await db.execute(sql`DELETE FROM ent_number_range WHERE company_code_id = ${ccId}`).catch(()=>{});
      await db.execute(sql`DELETE FROM mm_stock WHERE company_code_id = ${ccId}`).catch(()=>{});
      // Don't delete POs/PRs/GRs/IVs automatically for safety unless force – but we already checked
    }

    await db.execute(sql`DELETE FROM ent_company_code WHERE id = ${ccId}`);

    await db.execute(sql`
      INSERT INTO audit_log (table_name, record_id, record_number, action, description)
      VALUES ('ent_company_code', ${ccId}, ${ccCode}, 'DELETE', ${`Company Code DELETE OX02: ${ccCode} force=${force}`})
    `).catch(()=>{});

    return NextResponse.json({
      success: true,
      message: `Company Code ${ccCode} deleted ${force ? 'with cascade plants/slocs' : ''}. 1000 is NOT necessary for SIT – you can start with your own T001.`,
      deleted: ccCode,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
