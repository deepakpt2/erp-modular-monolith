/**
 * Audit Trail – FAUD own IP – Foundation Audit Trail – NEW OWN CODE – alias CDHDR/CDPOS/SM20
 * Implements change docs CDHDR/CDPOS – who changed what when – old value/new value – user, timestamp – WORM-lite – industry standard
 * For large org with compliance, critical – tracks master and transactional changes – e.g., material create/change, number range change, GR, PO, SO, etc.
 * Tables: fin_change_doc_header (CDHDR), fin_change_doc_item (CDPOS)
 * WORM-lite: Change docs cannot be deleted or changed – only inserted – for audit compliance
 */

import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

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
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_cdhdr_obj ON fin_change_doc_header(object_type, object_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_cdhdr_user ON fin_change_doc_header(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_cdhdr_date ON fin_change_doc_header(change_date)`);

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
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_cdpos_changenum ON fin_change_doc_item(change_number)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_cdpos_field ON fin_change_doc_item(field_name)`);
  } catch (e: any) {
    console.warn('Ensure audit trail tables failed:', e.message);
  }
}

export async function createChangeDoc({
  object_type,
  object_id,
  user_id,
  transaction_code,
  description,
  changes, // array of {field_name, old_value, new_value}
}: {
  object_type: string;
  object_id: string;
  user_id: string;
  transaction_code?: string;
  description?: string;
  changes: Array<{ field_name: string; old_value?: any; new_value?: any }>;
}) {
  await ensureTables();

  try {
    const changeNumber = `CHG-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    
    // Insert header – WORM-lite – only insert, no update/delete
    await db.execute(sql`
      INSERT INTO fin_change_doc_header (object_type, object_id, change_number, user_id, change_date, transaction_code, description)
      VALUES (${object_type.toUpperCase()}, ${object_id}, ${changeNumber}, ${user_id}, NOW(), ${transaction_code || null}, ${description || null})
    `);

    // Insert items – old/new value
    for (const change of changes) {
      const oldVal = change.old_value != null ? String(change.old_value) : null;
      const newVal = change.new_value != null ? String(change.new_value) : null;
      
      // Only log if old != new
      if (oldVal !== newVal) {
        await db.execute(sql`
          INSERT INTO fin_change_doc_item (change_number, field_name, old_value, new_value)
          VALUES (${changeNumber}, ${change.field_name}, ${oldVal}, ${newVal})
        `);
      }
    }

    return changeNumber;
  } catch (e: any) {
    console.warn('createChangeDoc failed:', e.message);
    return null;
  }
}

// Helper for material master changes
export async function auditMaterialChange({
  material_id,
  user_id,
  transaction_code,
  old_data,
  new_data,
}: {
  material_id: string;
  user_id: string;
  transaction_code?: string;
  old_data?: any;
  new_data?: any;
}) {
  const changes: Array<{ field_name: string; old_value?: any; new_value?: any }> = [];
  
  if (old_data && new_data) {
    for (const key of Object.keys(new_data)) {
      if (old_data[key] !== new_data[key]) {
        changes.push({ field_name: key, old_value: old_data[key], new_value: new_data[key] });
      }
    }
  } else if (new_data) {
    for (const key of Object.keys(new_data)) {
      changes.push({ field_name: key, old_value: null, new_value: new_data[key] });
    }
  }

  if (changes.length === 0) return null;

  return createChangeDoc({
    object_type: 'MATERIAL',
    object_id: material_id,
    user_id,
    transaction_code: transaction_code || 'EMTC',
    description: `Material ${material_id} ${old_data ? 'changed' : 'created'} – ${changes.length} fields`,
    changes,
  });
}

// Helper for number range changes
export async function auditNumberRangeChange({
  range_code,
  user_id,
  transaction_code,
  old_data,
  new_data,
}: {
  range_code: string;
  user_id: string;
  transaction_code?: string;
  old_data?: any;
  new_data?: any;
}) {
  const changes: Array<{ field_name: string; old_value?: any; new_value?: any }> = [];
  
  if (old_data && new_data) {
    for (const key of Object.keys(new_data)) {
      if (old_data[key] !== new_data[key]) {
        changes.push({ field_name: key, old_value: old_data[key], new_value: new_data[key] });
      }
    }
  } else if (new_data) {
    for (const key of Object.keys(new_data)) {
      changes.push({ field_name: key, old_value: null, new_value: new_data[key] });
    }
  }

  if (changes.length === 0) return null;

  return createChangeDoc({
    object_type: 'NUMBER_RANGE',
    object_id: range_code,
    user_id,
    transaction_code: transaction_code || 'FNRC',
    description: `Number range ${range_code} ${old_data ? 'changed' : 'created'} – ${changes.length} fields`,
    changes,
  });
}

// Helper for transactional changes – GR, PO, SO, etc.
export async function auditTransactionalChange({
  object_type,
  object_id,
  user_id,
  transaction_code,
  description,
  changes,
}: {
  object_type: string;
  object_id: string;
  user_id: string;
  transaction_code?: string;
  description?: string;
  changes: Array<{ field_name: string; old_value?: any; new_value?: any }>;
}) {
  return createChangeDoc({
    object_type,
    object_id,
    user_id,
    transaction_code,
    description,
    changes,
  });
}

export async function getChangeDocs(object_type?: string, object_id?: string, limit = 100) {
  await ensureTables();
  try {
    let query = sql`SELECT h.*, array_agg(json_build_object('field_name', i.field_name, 'old_value', i.old_value, 'new_value', i.new_value)) as items FROM fin_change_doc_header h LEFT JOIN fin_change_doc_item i ON h.change_number = i.change_number WHERE 1=1`;
    if (object_type) query = sql`${query} AND h.object_type = ${object_type.toUpperCase()}`;
    if (object_id) query = sql`${query} AND h.object_id = ${object_id}`;
    query = sql`${query} GROUP BY h.id ORDER BY h.change_date DESC LIMIT ${limit}`;
    
    const res = await db.execute(query);
    return res.rows;
  } catch (e: any) {
    console.warn('getChangeDocs failed:', e.message);
    return [];
  }
}
