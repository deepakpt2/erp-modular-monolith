import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import { createChangeDoc, getChangeDocs } from '@/shared/kernel/audit/changeDocs';

/**
 * Audit Trail API – FAUD own IP – Foundation Audit Trail – NEW OWN CODE – alias CDHDR/CDPOS/SM20
 * Implements change docs CDHDR/CDPOS – who changed what when – old value/new value – user, timestamp – WORM-lite – industry standard
 * For large org with compliance, critical – tracks master and transactional changes
 * Tables: fin_change_doc_header (CDHDR), fin_change_doc_item (CDPOS)
 * Makes data available in DB for now – modules will be modified to use as reworked – per user request
 */

async function ensureTables() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_change_doc_header (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        object_type varchar(100) NOT NULL,
        object_id varchar(200) NOT NULL,
        change_number varchar(50) NOT NULL,
        user_id varchar(200) NOT NULL,
        change_date timestamp DEFAULT NOW(),
        transaction_code varchar(50),
        description text,
        created_at timestamp DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fin_change_doc_item (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        change_number varchar(50) NOT NULL,
        field_name varchar(200) NOT NULL,
        old_value text,
        new_value text,
        created_at timestamp DEFAULT NOW()
      )
    `);
  } catch (e: any) {
    console.warn('Ensure audit trail tables failed:', e.message);
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  await ensureTables();

  try {
    const { searchParams } = new URL(req.url);
    const objectType = searchParams.get('object_type');
    const objectId = searchParams.get('object_id');
    const limit = parseInt(searchParams.get('limit') || '100');

    const docs = await getChangeDocs(objectType || undefined, objectId || undefined, limit);

    return NextResponse.json({
      success: true,
      data: docs,
      change_docs: docs,
      count: docs.length,
      code: 'FAUD',
      aliasCodes: ['CDHDR', 'CDPOS', 'SM20', 'AALG'],
      message: `Audit trail – FAUD own IP – ${docs.length} change docs – CDHDR/CDPOS – who changed what when – old/new value – user, timestamp – WORM-lite – for compliance – e.g., MATERIAL 10001 changed description from Spice to Premium Spice by user1 at 2026-09-30 – industry standard – data available in DB – modules will use as reworked`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  await ensureTables();

  try {
    const body = await req.json();
    const { object_type, object_id, user_id, transaction_code, description, changes } = body;

    if (!object_type || !object_id || !user_id || !changes) {
      return NextResponse.json({ error: 'object_type, object_id, user_id, changes array required – e.g., object_type MATERIAL, object_id 10001, user_id admin@er.deepakpt.com, changes [{field_name: description, old_value: Spice, new_value: Premium Spice}]' }, { status: 400 });
    }

    const changeNumber = await createChangeDoc({
      object_type,
      object_id,
      user_id,
      transaction_code,
      description,
      changes,
    });

    if (!changeNumber) return NextResponse.json({ error: 'Failed to create change doc' }, { status: 500 });

    return NextResponse.json({
      success: true,
      change_number: changeNumber,
      code: 'FAUD',
      message: `Change doc ${changeNumber} created – FAUD own IP – ${object_type} ${object_id} – ${changes.length} fields – old/new value – user ${user_id} – WORM-lite – audit trail – industry standard – data available in DB`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
