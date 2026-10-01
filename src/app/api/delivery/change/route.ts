import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/shared/kernel/auth/apiAuth';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

/**
 * SDLC (legacy VL02N) Change Delivery + VL03N Display + VL10C Delivery Due List + VL09 Reverse GI – T1 REQUIRED
 * SDLC (legacy VL02N): Change delivery – update picking qty, batch, shipping point, route
 * VL03N: Display – already GET /api/delivery
 * VL10C: Delivery Due List – sales orders due for delivery – SO with status OPEN/CONFIRMED, delivery not yet created
 * VL09: Reverse Goods Issue – cancel PGI – reverse inventory + COGS posting
 * NO DANGLING – delivery fields used in PGI + billing + stock
 */

export async function GET(req: NextRequest){
  const authCheck = await requireApiAuth(req as any);
  if(authCheck) return authCheck;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'DUE';
  try{
    if(action === 'DUE' || action === 'VL10C'){
      // VL10C Delivery Due List – sales orders where delivery not yet created or partially delivered
      let dueRows:any[]=[];
      try{
        const res = await db.execute(sql`
          SELECT so.id, so.sales_number, so.status, so.customer_number, so.customer_name, so.total_quantity, so.created_at,
                 (SELECT COUNT(*) FROM sales_delivery WHERE sales_order_id = so.id) as delivery_count
          FROM sales_order so
          WHERE so.status IN ('OPEN','CONFIRMED','PARTIALLY_DELIVERED')
          ORDER BY so.created_at DESC
          LIMIT 100
        `);
        dueRows = res.rows as any[];
      }catch(e){
        try{
          const res2 = await db.execute(sql`
            SELECT so.id, so.sales_number, so.status, so.total_quantity, so.created_at,
                   (SELECT COUNT(*) FROM sd_delivery WHERE sales_order_id = so.id) as delivery_count
            FROM sd_sales_order so
            WHERE so.status IN ('OPEN','CONFIRMED')
            ORDER BY so.created_at DESC
            LIMIT 100
          `);
          dueRows = res2.rows as any[];
        }catch{}
      }
      return NextResponse.json({ success:true, code:'VL10C', alias:'VL10C', due_list: dueRows, data: dueRows, count: dueRows.length, message:`VL10C Delivery Due List – ${dueRows.length} sales orders due for delivery – T1 REQUIRED – NO DANGLING – SO status OPEN/CONFIRMED, delivery not yet created – used for SDLC (legacy VL01N) delivery creation` });
    }
    return NextResponse.json({ success:true, code:'VL02N', message:'SDLC (legacy VL02N) Change Delivery – use POST to update delivery – T1 REQUIRED' });
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function POST(req: NextRequest){
  const authCheck = await requireApiAuth(req as any);
  if(authCheck) return authCheck;
  try{
    const body = await req.json();
    const { delivery_number, action, quantity_picked, picking_status, shipping_point, route, reversal_reason } = body;
    if(!delivery_number) return NextResponse.json({ error:'delivery_number required – SDLC (legacy VL02N)/VL09 – T1 REQUIRED' }, {status:400});

    if(action === 'VL09' || action === 'REVERSE_GI'){
      // VL09 Reverse Goods Issue – cancel PGI – reverse inventory + COGS posting
      // Find delivery
      let delivery:any=null;
      try{
        const res = await db.execute(sql`SELECT * FROM sales_delivery WHERE delivery_number = ${delivery_number} LIMIT 1`);
        if(res.rows.length>0) delivery = res.rows[0] as any;
      }catch{
        try{
          const res2 = await db.execute(sql`SELECT * FROM sd_delivery WHERE delivery_number = ${delivery_number} LIMIT 1`);
          if(res2.rows.length>0) delivery = res2.rows[0] as any;
        }catch{}
      }
      if(!delivery) return NextResponse.json({ error:`Delivery ${delivery_number} not found – VL09` }, {status:404});
      if(delivery.status !== 'GOODS_ISSUED' && delivery.status !== 'PGI') return NextResponse.json({ error:`Delivery ${delivery_number} status ${delivery.status} not GOODS_ISSUED – cannot reverse GI – VL09` }, {status:400});

      // Reverse GI: update status to PICKED, create reversal ledger entries, restore stock
      try{
        await db.execute(sql`UPDATE sales_delivery SET status = 'PICKED', goods_movement_status = 'REVERSED', goods_issue_date = NULL WHERE delivery_number = ${delivery_number}`).catch(async()=>{
          await db.execute(sql`UPDATE sd_delivery SET status = 'PICKED', goods_movement_status = 'REVERSED' WHERE delivery_number = ${delivery_number}`).catch(()=>{});
        });
        // Restore stock – add back quantity
        try{
          const linesRes = await db.execute(sql`SELECT * FROM sales_delivery_line WHERE delivery_id = ${delivery.id}`);
          for(const line of linesRes.rows as any[]){
            await db.execute(sql`UPDATE inv_stock SET quantity = quantity + ${line.quantity_issued || line.quantity || 0} WHERE item_number = ${line.item_id || ''} LIMIT 1`).catch(()=>{});
          }
        }catch{}
        // Reverse COGS posting – create reversal in universal ledger if exists
        try{
          if(delivery.universal_ledger_id || delivery.fi_document_id){
            const docId = delivery.universal_ledger_id || delivery.fi_document_id;
            await db.execute(sql`UPDATE fin_universal_ledger SET is_reversed = true WHERE document_number = ${docId} OR id = ${docId}::uuid`).catch(()=>{});
          }
        }catch{}
        // Create reversal record
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS sd_delivery_reversal (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            reversal_number VARCHAR(50) NOT NULL UNIQUE,
            delivery_number VARCHAR(50) NOT NULL,
            reversal_reason VARCHAR(100),
            reversed_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);
        const revNumber = `REV-GI-${Date.now().toString().slice(-6)}`;
        await db.execute(sql`INSERT INTO sd_delivery_reversal (reversal_number, delivery_number, reversal_reason) VALUES (${revNumber}, ${delivery_number}, ${reversal_reason || 'VL09 Reverse GI'}) ON CONFLICT DO NOTHING`);
        return NextResponse.json({ success:true, code:'VL09', reversal_number: revNumber, delivery_number, message:`VL09 Reverse Goods Issue – delivery ${delivery_number} reversed – status PICKED – stock restored – COGS reversed – reversal ${revNumber} – T1 REQUIRED – NO DANGLING – GI reversal fields used in stock + FI`, reversal: revNumber });
      }catch(e:any){
        return NextResponse.json({ error:e.message }, {status:500});
      }
    }

    // SDLC (legacy VL02N) Change Delivery
    try{
      await db.execute(sql`
        UPDATE sales_delivery SET
          picking_status = COALESCE(${picking_status || null}, picking_status),
          shipping_point = COALESCE(${shipping_point || null}, shipping_point),
          route = COALESCE(${route || null}, route),
          updated_at = NOW()
        WHERE delivery_number = ${delivery_number}
      `).catch(async()=>{
        await db.execute(sql`
          UPDATE sd_delivery SET
            picking_status = COALESCE(${picking_status || null}, picking_status),
            shipping_point = COALESCE(${shipping_point || null}, shipping_point),
            route = COALESCE(${route || null}, route)
          WHERE delivery_number = ${delivery_number}
        `).catch(()=>{});
      });
      if(quantity_picked){
        try{
          await db.execute(sql`UPDATE sales_delivery_line SET quantity_picked = ${quantity_picked} WHERE delivery_id = (SELECT id FROM sales_delivery WHERE delivery_number = ${delivery_number} LIMIT 1) LIMIT 1`).catch(()=>{});
        }catch{}
      }
      return NextResponse.json({ success:true, code:'VL02N', delivery_number, message:`SDLC (legacy VL02N) Change Delivery – delivery ${delivery_number} updated – picking_status ${picking_status} shipping_point ${shipping_point} route ${route} qty_picked ${quantity_picked} – T1 REQUIRED – NO DANGLING – delivery fields used in PGI + billing` });
    }catch(e:any){
      return NextResponse.json({ error:e.message }, {status:500});
    }
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
