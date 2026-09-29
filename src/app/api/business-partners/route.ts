import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Business Partners API – Legal-safe own IP – Module 3
 * New tables: partner_account (was ent_business_partner), partner_vendor_profile (was ent_bp_vendor_ext), partner_customer_profile (was ent_bp_customer_ext), partner_contact (new)
 * Fresh empty – no hardcoded KS-V-001 etc – sample kept? No, fresh empty per requirement, but common sample data like CoA/GL/Tax/Currencies/UoM kept – partner fresh empty
 * Helper codes: EPAC Partner Account Create (alias PTNC, BPAC, BP01, FND-BP-CR), SCUC Customer Create (alias CUCC, XD01), PSUC Supplier Create (alias SUPC, XK01, ME01)
 * Fallback to legacy ent_business_partner if new tables not yet migrated
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role') || 'ALL'; // VENDOR, CUSTOMER, BOTH
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    // Try new legal-safe tables first
    try {
      let query = sql`
        SELECT 
          pa.id, pa.account_number as bp_number, pa.account_number, pa.role, pa.display_name as name1, pa.display_name, pa.legal_name as name2, pa.legal_name,
          pa.email, pa.phone, pa.address_line1 as address, pa.city, pa.region, pa.postal_code, pa.country,
          pa.gst_number, pa.pan_number, pa.tax_id, pa.is_blocked, pa.is_one_time, pa.is_active, pa.created_at,
          vp.payment_terms_days as vendor_payment_terms, vp.currency_code as vendor_currency, vp.is_quality_relevant,
          cp.payment_terms_days as customer_payment_terms, cp.currency_code as customer_currency
        FROM partner_account pa
        LEFT JOIN partner_vendor_profile vp ON pa.id = vp.partner_id
        LEFT JOIN partner_customer_profile cp ON pa.id = cp.partner_id
        WHERE 1=1
      `;
      if (role && role !== 'ALL') {
        query = sql`${query} AND pa.role = ${role}::partner_role`;
      }
      if (search) {
        query = sql`${query} AND (pa.account_number ILIKE ${`%${search}%`} OR pa.display_name ILIKE ${`%${search}%`} OR pa.legal_name ILIKE ${`%${search}%`})`;
      }
      query = sql`${query} ORDER BY pa.account_number LIMIT ${limit}`;

      const result = await db.execute(query);

      return NextResponse.json({
        businessPartners: result.rows,
        partners: result.rows,
        count: result.rows.length,
        source: 'db-new',
        table: 'partner_account',
        code: 'EPAC',
        aliasCodes: ['PTNC', 'BPAC', 'BP01', 'FND-BP-CR', 'ME01', 'XK01', 'XD01'],
        helperCode: 'EPAC',
        functionDescription: 'Partner Account – EPAC – Legal-safe own IP (was BP Central) – central master with role VENDOR/CUSTOMER/BOTH, contextual views via partner_customer_profile (sales SCUC alias CUCC/XD01) and partner_vendor_profile (procurement PSUC alias SUPC/XK01)',
        legalSafe: true,
        freshEmpty: 'Module 3 – fresh empty – no hardcoded KS-V-001 etc – common sample data like CoA/GL/Tax/Currencies/UoM kept for convenience',
      });
    } catch (newErr: any) {
      console.warn('partner_account not yet migrated, fallback ent_business_partner:', newErr.message);
      let query = sql`
        SELECT id, bp_number, role, name1, name2, email, phone, address, is_blocked, is_one_time, created_at
        FROM ent_business_partner
        WHERE 1=1
      `;
      if (role && role !== 'ALL') {
        query = sql`${query} AND role = ${role}::bp_role`;
      }
      if (search) {
        query = sql`${query} AND (bp_number ILIKE ${`%${search}%`} OR name1 ILIKE ${`%${search}%`})`;
      }
      query = sql`${query} ORDER BY bp_number LIMIT ${limit}`;

      const result = await db.execute(query);

      return NextResponse.json({
        businessPartners: result.rows,
        count: result.rows.length,
        source: 'db-legacy',
        table: 'ent_business_partner',
        code: 'EPAC',
        aliasCodes: ['PTNC', 'BP01'],
        helperCode: 'BP',
        functionDescription: 'Business Partner – BP Central (legacy ent_business_partner – migrating to partner_account EPAC)',
        functionCodes: 'ME01 Vendor Master, XD01 Customer Master, BP Central',
        ks01: 'Legacy KS-V-001 Malabar Spice Farms Wayanad, KS-V-002 Idukki Cardamom, KS-V-003 Alleppey Turmeric, KS-C-001 Kochi Exports, KS-C-002 Mumbai Spice – will be removed for fresh empty Module3',
        legalSafe: false,
        migrationNote: 'Fallback to legacy – run drizzle-kit push to create partner_account',
      });
    }
  } catch (e: any) {
    console.error('DB error:', e.message);
    return NextResponse.json({ error: e.message, code: 'DB_ERROR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { 
      bp_number, account_number, name1, display_name, name2, legal_name, role, email, phone, alternate_phone, address, address_line1, city, region, postal_code, country,
      gst_number, pan_number, tax_id, website,
      is_blocked, is_one_time,
      // Vendor profile
      payment_terms_days, vendor_payment_terms_days, currency_code, vendor_currency_code, is_qm_relevant, is_quality_relevant, procurement_division_id, buyer_team_id,
      // Customer profile
      customer_payment_terms_days, customer_currency_code, commercial_org_id, sales_channel_id, product_line_id, credit_policy_area_id, price_group,
      // Contacts
      contacts,
      // Facility assigns
      facility_ids,
    } = body;

    const finalAccountNumber = account_number || bp_number;
    const finalDisplayName = display_name || name1;
    const finalLegalName = legal_name || name2;
    const finalAddressLine1 = address_line1 || address;
    const finalRole = role;

    if (!finalAccountNumber || !finalDisplayName || !finalRole) return NextResponse.json({ error: 'account_number (or bp_number), display_name (or name1), role VENDOR/CUSTOMER/BOTH required – legal-safe' }, { status: 400 });

    // Try new tables first
    try {
      const res = await db.execute(sql`
        INSERT INTO partner_account (account_number, display_name, legal_name, role, email, phone, alternate_phone, website, address_line1, city, region, postal_code, country, gst_number, pan_number, tax_id, is_blocked, is_one_time, is_active)
        VALUES (${finalAccountNumber}, ${finalDisplayName}, ${finalLegalName || null}, ${finalRole}::partner_role, ${email||null}, ${phone||null}, ${alternate_phone||null}, ${website||null}, ${finalAddressLine1||null}, ${city||null}, ${region||null}, ${postal_code||null}, ${country||'IN'}, ${gst_number||null}, ${pan_number||null}, ${tax_id||null}, ${is_blocked||false}, ${is_one_time||false}, true)
        ON CONFLICT (account_number) DO UPDATE SET display_name = ${finalDisplayName}, legal_name = COALESCE(${finalLegalName||null}, partner_account.legal_name), role = ${finalRole}::partner_role, email = COALESCE(${email||null}, partner_account.email), updated_at = NOW()
        RETURNING id, account_number
      `);

      const partnerId = (res.rows[0] as any).id;

      // Vendor profile if role VENDOR or BOTH
      if (finalRole === 'VENDOR' || finalRole === 'BOTH') {
        try {
          await db.execute(sql`
            INSERT INTO partner_vendor_profile (partner_id, payment_terms_days, currency_code, is_quality_relevant, procurement_division_id, buyer_team_id)
            VALUES (${partnerId}, ${payment_terms_days || vendor_payment_terms_days || 30}, ${currency_code || vendor_currency_code || 'INR'}, ${is_quality_relevant ?? is_qm_relevant ?? false}, ${procurement_division_id||null}, ${buyer_team_id||null})
            ON CONFLICT (partner_id) DO UPDATE SET payment_terms_days = COALESCE(${payment_terms_days || vendor_payment_terms_days || 30}, partner_vendor_profile.payment_terms_days), is_quality_relevant = COALESCE(${is_quality_relevant ?? is_qm_relevant ?? false}, partner_vendor_profile.is_quality_relevant), updated_at = NOW()
          `);
        } catch (e: any) { console.warn('vendor profile insert failed', e.message); }
      }

      // Customer profile if role CUSTOMER or BOTH
      if (finalRole === 'CUSTOMER' || finalRole === 'BOTH') {
        try {
          await db.execute(sql`
            INSERT INTO partner_customer_profile (partner_id, payment_terms_days, currency_code, commercial_org_id, sales_channel_id, product_line_id, credit_policy_area_id, price_group)
            VALUES (${partnerId}, ${customer_payment_terms_days || payment_terms_days || 0}, ${customer_currency_code || currency_code || 'INR'}, ${commercial_org_id||null}, ${sales_channel_id||null}, ${product_line_id||null}, ${credit_policy_area_id||null}, ${price_group||null})
            ON CONFLICT (partner_id) DO UPDATE SET payment_terms_days = COALESCE(${customer_payment_terms_days || payment_terms_days || 0}, partner_customer_profile.payment_terms_days), updated_at = NOW()
          `);
        } catch (e: any) { console.warn('customer profile insert failed', e.message); }
      }

      // Contacts
      if (contacts && Array.isArray(contacts)) {
        for (const c of contacts) {
          try {
            await db.execute(sql`
              INSERT INTO partner_contact (partner_id, contact_type, full_name, email, phone, department, is_primary)
              VALUES (${partnerId}, ${c.contact_type || 'PRIMARY'}::partner_contact_type, ${c.full_name || c.name}, ${c.email||null}, ${c.phone||null}, ${c.department||null}, ${c.is_primary||false})
            `);
          } catch {}
        }
      }

      // Facility assigns
      if (facility_ids && Array.isArray(facility_ids)) {
        for (const fid of facility_ids) {
          try {
            await db.execute(sql`
              INSERT INTO partner_facility_assign (partner_id, facility_id) VALUES (${partnerId}, ${fid}) ON CONFLICT (partner_id, facility_id) DO NOTHING
            `);
          } catch {}
        }
      }

      // Audit log
      try {
        await db.execute(sql`
          INSERT INTO audit_log (table_name, record_id, record_number, action, new_values, description)
          VALUES ('partner_account', ${partnerId}, ${finalAccountNumber}, 'INSERT', ${JSON.stringify(body)}::jsonb, ${`Partner CREATE EPAC – Legal-safe: ${finalAccountNumber} ${finalDisplayName} role ${finalRole} – central master with contextual views vendor/customer`})
        `);
      } catch {}

      const primaryCode = finalRole === 'VENDOR' ? 'PSUC' : finalRole === 'CUSTOMER' ? 'SCUC' : 'EPAC';
      const aliasCodes = finalRole === 'VENDOR' ? ['SUPC','XK01','ME01'] : finalRole === 'CUSTOMER' ? ['CUCC','XD01'] : ['PTNC','BP01'];

      return NextResponse.json({ 
        success: true, 
        businessPartner: { id: partnerId, account_number: finalAccountNumber, bp_number: finalAccountNumber, display_name: finalDisplayName, name1: finalDisplayName, role: finalRole },
        partner: { id: partnerId, account_number: finalAccountNumber, display_name: finalDisplayName, role: finalRole },
        code: primaryCode,
        aliasCodes,
        helperCode: primaryCode,
        message: `Partner ${finalAccountNumber} ${finalDisplayName} created – ${primaryCode} (alias ${aliasCodes.join(', ')}) – role ${finalRole} – legal-safe own IP – central master with contextual views`,
        legalSafe: true,
      });
    } catch (newErr: any) {
      console.warn('partner_account insert failed, fallback ent_business_partner:', newErr.message);
      const res = await db.execute(sql`
        INSERT INTO ent_business_partner (bp_number, name1, role, email, phone, address, is_blocked, is_one_time)
        VALUES (${finalAccountNumber}, ${finalDisplayName}, ${finalRole}::bp_role, ${email||null}, ${phone||null}, ${finalAddressLine1||null}, false, false)
        ON CONFLICT (bp_number) DO UPDATE SET name1 = ${finalDisplayName}, role = ${finalRole}::bp_role
        RETURNING id, bp_number
      `);

      return NextResponse.json({ success: true, businessPartner: res.rows[0], code: 'EPAC', aliasCodes: ['PTNC','BP01'], message: `BP ${finalAccountNumber} ${finalDisplayName} created role ${finalRole} – legacy ent_business_partner (migrating to partner_account EPAC)`, legalSafe: false });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();
    const { id, bp_number, account_number, name1, display_name, role, email, phone, address, address_line1, city, is_blocked, is_active } = body;
    const finalAccountNumber = account_number || bp_number;
    if (!id && !finalAccountNumber) return NextResponse.json({ error: 'id or account_number (or bp_number) required' }, { status: 400 });

    // Try new table
    try {
      let existing: any = null;
      if (id) {
        const r = await db.execute(sql`SELECT * FROM partner_account WHERE id = ${id} LIMIT 1`);
        if (r.rows.length > 0) existing = r.rows[0];
      } else if (finalAccountNumber) {
        const r = await db.execute(sql`SELECT * FROM partner_account WHERE account_number = ${finalAccountNumber} LIMIT 1`);
        if (r.rows.length > 0) existing = r.rows[0];
      }

      if (existing) {
        const updated = await db.execute(sql`
          UPDATE partner_account SET
            display_name = COALESCE(${display_name || name1}, display_name),
            role = COALESCE(${role}::partner_role, role),
            email = COALESCE(${email}, email),
            phone = COALESCE(${phone}, phone),
            address_line1 = COALESCE(${address_line1 || address}, address_line1),
            city = COALESCE(${city}, city),
            is_blocked = COALESCE(${is_blocked}, is_blocked),
            is_active = COALESCE(${is_active}, is_active),
            updated_at = NOW()
          WHERE id = ${existing.id}
          RETURNING id, account_number, display_name, role
        `);

        try {
          await db.execute(sql`
            INSERT INTO audit_log (table_name, record_id, record_number, action, old_values, new_values, description)
            VALUES ('partner_account', ${existing.id}, ${existing.account_number}, 'UPDATE', ${JSON.stringify(existing)}::jsonb, ${JSON.stringify(body)}::jsonb, ${`Partner CHANGE EPAE: ${existing.account_number} -> ${display_name || name1 || existing.display_name}`})
          `);
        } catch {}

        return NextResponse.json({ success: true, partner: updated.rows[0], businessPartner: updated.rows[0], code: 'EPAE', message: `Partner ${existing.account_number} updated – EPAE legal-safe` });
      }
    } catch (e: any) { console.warn('partner_account update failed fallback', e.message); }

    // Fallback legacy
    let existing: any = null;
    if (id) {
      const r = await db.execute(sql`SELECT * FROM ent_business_partner WHERE id = ${id} LIMIT 1`);
      if (r.rows.length > 0) existing = r.rows[0];
    } else if (finalAccountNumber) {
      const r = await db.execute(sql`SELECT * FROM ent_business_partner WHERE bp_number = ${finalAccountNumber} LIMIT 1`);
      if (r.rows.length > 0) existing = r.rows[0];
    }

    if (!existing) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

    const updated = await db.execute(sql`
      UPDATE ent_business_partner SET
        name1 = COALESCE(${display_name || name1}, name1),
        role = COALESCE(${role}::bp_role, role),
        email = COALESCE(${email}, email),
        phone = COALESCE(${phone}, phone),
        address = COALESCE(${address_line1 || address}, address),
        is_blocked = COALESCE(${is_blocked}, is_blocked),
        updated_at = NOW()
      WHERE id = ${existing.id}
      RETURNING id, bp_number, name1, role
    `);

    return NextResponse.json({ success: true, businessPartner: updated.rows[0], code: 'EPAE', message: `BP ${existing.bp_number} updated – legacy` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const bp_number = searchParams.get('bp_number') || searchParams.get('account_number');
    const id = searchParams.get('id');
    if (!bp_number && !id) return NextResponse.json({ error: 'bp_number or account_number or id required' }, { status: 400 });

    // Try new table
    try {
      let partnerId = id;
      let accNum = bp_number;
      if (!partnerId && accNum) {
        const r = await db.execute(sql`SELECT id, account_number FROM partner_account WHERE account_number = ${accNum} LIMIT 1`);
        if (r.rows.length > 0) { partnerId = (r.rows[0] as any).id; accNum = (r.rows[0] as any).account_number; }
      }

      if (partnerId) {
        let prCount = 0, poCount = 0, grCount = 0, soCount = 0;
        try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_pr_line WHERE partner_id = ${partnerId}`); prCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
        try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_purchase_order WHERE vendor_id = ${partnerId}`); poCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
        try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_goods_receipt WHERE vendor_id = ${partnerId}`); grCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
        try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM sd_sales_order WHERE customer_id = ${partnerId}`); soCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
        // Legacy checks too
        try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM ent_business_partner WHERE id = ${partnerId}`); } catch {}

        if (prCount > 0 || poCount > 0 || grCount > 0 || soCount > 0) {
          await db.execute(sql`UPDATE partner_account SET is_active = false, updated_at = NOW() WHERE id = ${partnerId}`);
          return NextResponse.json({ success: true, softDeleted: true, code: 'EPAE', message: `Partner ${accNum} has transactions PR:${prCount} PO:${poCount} GR:${grCount} SO:${soCount} – hard delete BLOCKED for audit trail – soft deleted (is_active=false)`, security: 'Partner with transactions cannot be hard deleted' });
        }

        await db.execute(sql`DELETE FROM partner_contact WHERE partner_id = ${partnerId}`).catch(()=>{});
        await db.execute(sql`DELETE FROM partner_vendor_profile WHERE partner_id = ${partnerId}`).catch(()=>{});
        await db.execute(sql`DELETE FROM partner_customer_profile WHERE partner_id = ${partnerId}`).catch(()=>{});
        await db.execute(sql`DELETE FROM partner_facility_assign WHERE partner_id = ${partnerId}`).catch(()=>{});
        await db.execute(sql`DELETE FROM partner_account WHERE id = ${partnerId}`);

        return NextResponse.json({ success: true, code: 'EPAE', message: `Partner ${accNum || partnerId} deleted – legal-safe partner_account – only allowed when no transactions` });
      }
    } catch (e: any) { console.warn('partner_account delete failed fallback', e.message); }

    // Fallback legacy
    let entId = id;
    let entNum = bp_number;
    if (!entId && entNum) {
      const r = await db.execute(sql`SELECT id, bp_number FROM ent_business_partner WHERE bp_number = ${entNum} LIMIT 1`);
      if (r.rows.length > 0) { entId = (r.rows[0] as any).id; entNum = (r.rows[0] as any).bp_number; }
    }

    if (!entId) return NextResponse.json({ error: 'Business Partner not found' }, { status: 404 });

    let poCount = 0, soCount = 0;
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM mm_purchase_order WHERE vendor_id = ${entId}`); poCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}
    try { const r = await db.execute(sql`SELECT COUNT(*) as cnt FROM sd_sales_order WHERE customer_id = ${entId}`); soCount = parseInt((r.rows[0] as any).cnt || '0'); } catch {}

    if (poCount > 0 || soCount > 0) {
      await db.execute(sql`UPDATE ent_business_partner SET is_blocked = true WHERE id = ${entId}`);
      return NextResponse.json({ success: true, softDeleted: true, message: `BP ${entNum} has transactions PO:${poCount} SO:${soCount} – hard delete BLOCKED – blocked instead` });
    }

    await db.execute(sql`DELETE FROM ent_bp_vendor_ext WHERE bp_id = ${entId}`).catch(()=>{});
    await db.execute(sql`DELETE FROM ent_bp_customer_ext WHERE bp_id = ${entId}`).catch(()=>{});
    await db.execute(sql`DELETE FROM ent_business_partner WHERE id = ${entId}`);

    return NextResponse.json({ success: true, message: `BP ${entNum || entId} deleted – legacy – only allowed when no transactions` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
