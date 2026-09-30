import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * HSN Codes API – Legal-safe own IP – Module 4 Financials
 * Table: fin_hsn_code (HSN/SAC for GST) – sample 09041110 pepper, 090831 cardamom, 1515 oils etc kept for convenience
 * Helper code: FTXC alias HSN – wired from foundation – used in material master MARA HSN_CODE – T0 BLOCKING – NO DANGLING
 * Also fallback to fin_tax_rule hsn_code extraction if table not exists
 * Industry standard: HSN determines tax rate via tax classification – GST 0/5/12/18/28
 */

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;

  try {
    // Try fin_hsn_code table first
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS fin_hsn_code (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          code varchar(20) NOT NULL UNIQUE,
          description varchar(200) NOT NULL,
          gst_rate numeric DEFAULT 0,
          unit varchar(20),
          is_active boolean DEFAULT true,
          created_at timestamp DEFAULT NOW(),
          updated_at timestamp DEFAULT NOW()
        )
      `);

      // Seed sample HSN if empty
      const cntRes = await db.execute(sql`SELECT COUNT(*) as cnt FROM fin_hsn_code`);
      const cnt = parseInt((cntRes.rows[0] as any).cnt || '0');
      if (cnt === 0) {
        await db.execute(sql`
          INSERT INTO fin_hsn_code (code, description, gst_rate, unit) VALUES
          ('09041110', 'Pepper – Neither crushed nor ground – Black pepper', 5, 'KG'),
          ('09083120', 'Cardamom – Small cardamom – Green', 5, 'KG'),
          ('09041120', 'Pepper – White pepper', 5, 'KG'),
          ('09109100', 'Spices mixtures – Garam masala', 5, 'KG'),
          ('15159040', 'Fixed vegetable oils – Spice oils – Oleoresins', 12, 'KG'),
          ('09083020', 'Cardamom – Large cardamom – Amomum', 5, 'KG'),
          ('09101110', 'Ginger – Neither crushed nor ground – Fresh', 5, 'KG'),
          ('09071010', 'Cloves – Neither crushed nor ground', 5, 'KG'),
          ('09103020', 'Turmeric – Powder', 5, 'KG'),
          ('33012937', 'Essential oils – Spice oils – Pepper oil', 18, 'KG'),
          ('39239090', 'Packaging – Plastic packaging', 18, 'PC'),
          ('48191010', 'Packaging – Carton boxes', 18, 'PC'),
          ('00000000', 'Services – SAC', 18, 'PC')
          ON CONFLICT (code) DO NOTHING
        `);
      }

      const result = await db.execute(sql`SELECT id, code, description, gst_rate, unit, is_active FROM fin_hsn_code WHERE is_active = true ORDER BY code`);

      return NextResponse.json({
        hsnCodes: result.rows,
        count: result.rows.length,
        source: 'db-new',
        table: 'fin_hsn_code',
        configurable: true,
        code: 'FTXC',
        aliasCodes: ['HSN', 'FIN-HSN', 'FTXC-HSN'],
        helperCode: 'FTXC',
        functionDescription: 'HSN/SAC Codes – FTXC – Legal-safe own IP – HSN determines tax classification – wired from foundation – used in material master HSN_CODE – MARA STEUC – T0 BLOCKING',
        legalSafe: true,
        freshEmpty: 'Sample HSN 09041110 pepper, 090831 cardamom etc kept for convenience – fresh empty but common sample kept',
        examples: '09041110 Pepper 5% GST, 15159040 Spice oils 12%, 33012937 Essential oils 18%',
      });
    } catch (newErr: any) {
      console.warn('fin_hsn_code fallback to fin_tax_rule hsn extraction:', newErr.message);
      // Fallback to distinct hsn_code from fin_tax_rule
      try {
        const res = await db.execute(sql`SELECT DISTINCT hsn_code as code, description, rate as gst_rate FROM fin_tax_rule WHERE hsn_code IS NOT NULL AND hsn_code <> '' ORDER BY hsn_code`);
        const mapped = res.rows.map((r: any) => ({ id: r.code, code: r.code, description: r.description, gst_rate: r.gst_rate, unit: 'KG', is_active: true }));
        return NextResponse.json({
          hsnCodes: mapped,
          count: mapped.length,
          source: 'db-fallback-tax',
          table: 'fin_tax_rule',
          code: 'FTXC',
          helperCode: 'FTXC',
          functionDescription: 'HSN Codes fallback from fin_tax_rule – FTXC',
          legalSafe: true,
        });
      } catch (e2: any) {
        // Ultimate fallback static
        const staticCodes = [
          { id: '09041110', code: '09041110', description: 'Pepper – Black pepper', gst_rate: 5, unit: 'KG', is_active: true },
          { id: '09083120', code: '09083120', description: 'Cardamom – Small', gst_rate: 5, unit: 'KG', is_active: true },
          { id: '15159040', code: '15159040', description: 'Spice oils', gst_rate: 12, unit: 'KG', is_active: true },
          { id: '33012937', code: '33012937', description: 'Essential oils', gst_rate: 18, unit: 'KG', is_active: true },
        ];
        return NextResponse.json({
          hsnCodes: staticCodes,
          count: staticCodes.length,
          source: 'static',
          table: 'fin_hsn_code',
          code: 'FTXC',
          helperCode: 'FTXC',
          functionDescription: 'HSN Codes static fallback – FTXC',
        });
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message, hsnCodes: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  try {
    const body = await req.json();
    const { code, description, gst_rate, unit } = body;
    if (!code || !description) return NextResponse.json({ error: 'code and description required' }, { status: 400 });

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_hsn_code (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(20) NOT NULL UNIQUE,
        description varchar(200) NOT NULL,
        gst_rate numeric DEFAULT 0,
        unit varchar(20),
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      )
    `);

    const res = await db.execute(sql`
      INSERT INTO fin_hsn_code (code, description, gst_rate, unit)
      VALUES (${code}, ${description}, ${gst_rate || 0}, ${unit || 'KG'})
      ON CONFLICT (code) DO UPDATE SET description = ${description}, gst_rate = ${gst_rate || 0}, unit = ${unit || 'KG'}, is_active = true, updated_at = NOW()
      RETURNING id, code, description, gst_rate, unit
    `);

    return NextResponse.json({ success: true, hsnCode: res.rows[0], code: 'FTXC', message: `HSN ${code} created – FTXC legal-safe` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
