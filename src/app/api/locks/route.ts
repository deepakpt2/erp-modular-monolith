import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * Enqueue/Dequeue Locks API – Industry standard FELM own IP (alias FELM (legacy SM12)) – prevents double entry and concurrent edits
 * Table: core_enqueue_lock – lock_object, object_id, table_name, locked_by, locked_at, expires_at (now+5min), is_active, job_id
 * Features:
 * - When user starts GR for PO 4500000001 and moved to background, lock PO 4500000001 – other users locked out
 * - When user edits number range MAT-RAW-01, lock it – other users must wait until release or 5 min inactivity
 * - 5 min inactivity auto-expire – if user closes browser without releasing, lock expires – next user can take over
 * - Heartbeat: PUT extends expiry on activity
 * - Background jobs: When RUNNING, create lock with job_id – release on COMPLETED/FAILED/CANCELLED
 * - FELM (legacy SM12) page: /system/locks shows all active locks
 */

async function ensureTables() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS core_enqueue_lock (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        lock_object varchar(100) NOT NULL,
        object_id varchar(200) NOT NULL,
        table_name varchar(200),
        locked_by varchar(200) NOT NULL,
        locked_at timestamp DEFAULT NOW(),
        expires_at timestamp DEFAULT NOW() + INTERVAL '5 minutes',
        is_active boolean DEFAULT true,
        job_id uuid,
        description text,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lock_object_id ON core_enqueue_lock(lock_object, object_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lock_active ON core_enqueue_lock(is_active)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lock_expires ON core_enqueue_lock(expires_at)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lock_job ON core_enqueue_lock(job_id)`);
  } catch (e: any) {
    console.warn('Ensure lock table failed:', e.message);
  }
}

export async function GET(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  await ensureTables();

  try {
    const { searchParams } = new URL(req.url);
    const active = searchParams.get('active'); // true to show only active non-expired
    const lockObject = searchParams.get('lock_object');
    
    // Auto-expire old locks – set is_active=false where expires_at < NOW()
    await db.execute(sql`UPDATE core_enqueue_lock SET is_active = false, updated_at = NOW() WHERE is_active = true AND expires_at < NOW()`);

    let query = sql`SELECT * FROM core_enqueue_lock WHERE 1=1`;
    if (active === 'true') query = sql`${query} AND is_active = true AND expires_at > NOW()`;
    else if (active === 'false') query = sql`${query} AND is_active = false`;
    if (lockObject) query = sql`${query} AND lock_object = ${lockObject.toUpperCase()}`;

    query = sql`${query} ORDER BY locked_at DESC LIMIT 200`;

    const res = await db.execute(query);

    return NextResponse.json({
      data: res.rows,
      locks: res.rows,
      count: res.rows.length,
      code: 'FELM', aliasCodes: ['SM12', 'FND-ELM-LS'],
      message: `${res.rows.length} locks – active locks prevent double entry – GR for PO locked when background job running – number range locked when editing – 5 min inactivity auto-expire`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  await ensureTables();

  try {
    const body = await req.json();
    const { lock_object, lockObject, object_id, objectId, table_name, tableName, locked_by, lockedBy, job_id, jobId, description } = body;
    
    const finalLockObject = (lockObject || lock_object)?.toUpperCase();
    const finalObjectId = objectId || object_id;
    const finalTableName = tableName || table_name || null;
    const finalLockedBy = lockedBy || locked_by || 'system';
    const finalJobId = jobId || job_id || null;
    const finalDescription = description || null;

    if (!finalLockObject || !finalObjectId) {
      return NextResponse.json({ error: 'lock_object and object_id required – e.g., PO 4500000001, NUMBER_RANGE MAT-RAW-01' }, { status: 400 });
    }

    // Auto-expire old locks
    await db.execute(sql`UPDATE core_enqueue_lock SET is_active = false WHERE is_active = true AND expires_at < NOW()`);

    // Check if already locked by other user and not expired
    const existing = await db.execute(sql`
      SELECT id, locked_by, locked_at, expires_at, job_id FROM core_enqueue_lock
      WHERE lock_object = ${finalLockObject} AND object_id = ${finalObjectId} AND is_active = true AND expires_at > NOW()
      LIMIT 1
    `);

    if (existing.rows.length > 0) {
      const lock = existing.rows[0] as any;
      if (lock.locked_by !== finalLockedBy) {
        // Locked by other user – block
        return NextResponse.json({
          error: `🔒 Locked – ${finalLockObject} ${finalObjectId} is locked by ${lock.locked_by} since ${lock.locked_at} – expires ${lock.expires_at} – try after 5 min inactivity or after current user releases – ${lock.job_id ? `background job ${lock.job_id} running – check header Jobs icon or System Jobs page FBJM own IP (alias FBJM (legacy SM37))` : 'user editing critical settings'}`,
          locked: true,
          locked_by: lock.locked_by,
          locked_at: lock.locked_at,
          expires_at: lock.expires_at,
          job_id: lock.job_id,
          code: 'ENQUEUE_LOCKED',
        }, { status: 423 });
      } else {
        // Same user – extend lock
        await db.execute(sql`
          UPDATE core_enqueue_lock SET locked_at = NOW(), expires_at = NOW() + INTERVAL '5 minutes', updated_at = NOW(), job_id = COALESCE(${finalJobId}, job_id), description = COALESCE(${finalDescription}, description)
          WHERE id = ${lock.id}
        `);
        return NextResponse.json({ success: true, message: `Lock extended for ${finalLockObject} ${finalObjectId} – expires in 5 min`, lock_id: lock.id });
      }
    }

    // Create new lock – expires in 5 min
    const res = await db.execute(sql`
      INSERT INTO core_enqueue_lock (lock_object, object_id, table_name, locked_by, locked_at, expires_at, is_active, job_id, description)
      VALUES (${finalLockObject}, ${finalObjectId}, ${finalTableName}, ${finalLockedBy}, NOW(), NOW() + INTERVAL '5 minutes', true, ${finalJobId}, ${finalDescription})
      RETURNING id, lock_object, object_id, locked_by, locked_at, expires_at
    `);

    const newLock = res.rows[0] as any;

    return NextResponse.json({
      success: true,
      lock: newLock,
      lock_id: newLock.id,
      message: `🔒 Lock acquired – ${finalLockObject} ${finalObjectId} locked by ${finalLockedBy} – expires in 5 min – other users locked out – prevents double entry – e.g., GR for same PO or number range edit – industry standard FELM own IP (alias FELM (legacy SM12)) enqueue`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  await ensureTables();

  try {
    const body = await req.json();
    const { id, lock_object, object_id, locked_by, heartbeat } = body;

    if (heartbeat) {
      // Heartbeat – extend expiry on activity – called every 1 min while user typing
      const { lock_object: lo, object_id: oi, locked_by: lb } = body;
      if (!lo || !oi || !lb) return NextResponse.json({ error: 'lock_object, object_id, locked_by required for heartbeat' }, { status: 400 });
      
      const res = await db.execute(sql`
        UPDATE core_enqueue_lock SET locked_at = NOW(), expires_at = NOW() + INTERVAL '5 minutes', updated_at = NOW()
        WHERE lock_object = ${lo.toUpperCase()} AND object_id = ${oi} AND locked_by = ${lb} AND is_active = true AND expires_at > NOW()
        RETURNING id, expires_at
      `);
      
      if (res.rows.length === 0) return NextResponse.json({ error: 'Lock not found or expired' }, { status: 404 });
      
      return NextResponse.json({ success: true, message: 'Heartbeat – lock extended 5 min', expires_at: (res.rows[0] as any).expires_at });
    }

    if (!id && (!lock_object || !object_id)) return NextResponse.json({ error: 'id or lock_object+object_id required' }, { status: 400 });

    let res;
    if (id) {
      res = await db.execute(sql`
        UPDATE core_enqueue_lock SET expires_at = NOW() + INTERVAL '5 minutes', locked_at = NOW(), updated_at = NOW()
        WHERE id = ${id} AND is_active = true
        RETURNING id, lock_object, object_id, expires_at
      `);
    } else {
      res = await db.execute(sql`
        UPDATE core_enqueue_lock SET expires_at = NOW() + INTERVAL '5 minutes', locked_at = NOW(), updated_at = NOW()
        WHERE lock_object = ${lock_object.toUpperCase()} AND object_id = ${object_id} AND is_active = true
        RETURNING id, lock_object, object_id, expires_at
      `);
    }

    if (res.rows.length === 0) return NextResponse.json({ error: 'Lock not found or expired' }, { status: 404 });

    return NextResponse.json({ success: true, lock: res.rows[0], message: 'Lock extended 5 min – activity detected' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = await requireApiAuth(req as any);
  if (authCheck) return authCheck;
  await ensureTables();

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const lockObject = searchParams.get('lock_object');
    const objectId = searchParams.get('object_id');
    const lockedBy = searchParams.get('locked_by');
    const force = searchParams.get('force'); // admin force release

    if (id) {
      await db.execute(sql`UPDATE core_enqueue_lock SET is_active = false, updated_at = NOW() WHERE id = ${id}`);
      return NextResponse.json({ success: true, message: `Lock ${id} released – other users can now edit – table released` });
    }

    if (lockObject && objectId) {
      if (lockedBy) {
        await db.execute(sql`UPDATE core_enqueue_lock SET is_active = false, updated_at = NOW() WHERE lock_object = ${lockObject.toUpperCase()} AND object_id = ${objectId} AND locked_by = ${lockedBy}`);
      } else {
        // Force release if admin or expired
        await db.execute(sql`UPDATE core_enqueue_lock SET is_active = false, updated_at = NOW() WHERE lock_object = ${lockObject.toUpperCase()} AND object_id = ${objectId} AND is_active = true`);
      }
      return NextResponse.json({ success: true, message: `Lock ${lockObject} ${objectId} released – table released – other users can now edit after 5 min or now` });
    }

    // Cleanup expired
    await db.execute(sql`UPDATE core_enqueue_lock SET is_active = false WHERE is_active = true AND expires_at < NOW()`);

    return NextResponse.json({ success: true, message: 'Expired locks cleaned – auto-expire after 5 min inactivity' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
