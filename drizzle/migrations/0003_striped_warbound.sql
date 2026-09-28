ALTER TABLE "sd_billing" ADD COLUMN "billing_type_detail" varchar(10) DEFAULT 'F2';--> statement-breakpoint
ALTER TABLE "sd_billing" ADD COLUMN "billing_block" varchar(2);--> statement-breakpoint
ALTER TABLE "sd_billing" ADD COLUMN "payment_terms" varchar(10) DEFAULT '0001';--> statement-breakpoint
ALTER TABLE "sd_billing" ADD COLUMN "incoterms" varchar(10) DEFAULT 'EXW';--> statement-breakpoint
ALTER TABLE "sd_billing" ADD COLUMN "pricing_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "sd_billing" ADD COLUMN "account_assignment_group" varchar(10) DEFAULT '01';--> statement-breakpoint
ALTER TABLE "sd_billing" ADD COLUMN "cost_center_id" uuid;--> statement-breakpoint
ALTER TABLE "sd_billing" ADD COLUMN "profit_center" varchar(20);--> statement-breakpoint
ALTER TABLE "sd_delivery" ADD COLUMN "shipping_point" varchar(10) DEFAULT 'KP01';--> statement-breakpoint
ALTER TABLE "sd_delivery" ADD COLUMN "delivery_priority" varchar(2) DEFAULT '02';--> statement-breakpoint
ALTER TABLE "sd_delivery" ADD COLUMN "delivery_block" varchar(2);--> statement-breakpoint
ALTER TABLE "sd_delivery" ADD COLUMN "route" varchar(10) DEFAULT 'KROUTE01';--> statement-breakpoint
ALTER TABLE "sd_delivery" ADD COLUMN "incoterms" varchar(10) DEFAULT 'EXW';--> statement-breakpoint
ALTER TABLE "sd_delivery" ADD COLUMN "picking_status" varchar(20) DEFAULT 'Not Picked';--> statement-breakpoint
ALTER TABLE "sd_delivery" ADD COLUMN "goods_movement_status" varchar(20) DEFAULT 'Not Started';--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD COLUMN "item_category" varchar(10) DEFAULT 'TAN';--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD COLUMN "pricing_condition" varchar(10) DEFAULT 'PR00';--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD COLUMN "account_assignment" varchar(10) DEFAULT '01';--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD COLUMN "cost_center_id" uuid;--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD COLUMN "profit_center" varchar(20);--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD COLUMN "shipping_point" varchar(10);--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD COLUMN "delivery_priority" varchar(2);--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD COLUMN "route" varchar(10);--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD COLUMN "incoterms" varchar(10);--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD COLUMN "billing_block" varchar(2);--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD COLUMN "tax_classification" varchar(2) DEFAULT '1';--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD COLUMN "schedule_line_date" timestamp;--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD COLUMN "confirmed_qty" numeric(15, 3);--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "sales_org" varchar(10) DEFAULT 'KSO1';--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "distribution_channel" varchar(10) DEFAULT 'K1';--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "division" varchar(10) DEFAULT 'K1';--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "sales_office" varchar(10) DEFAULT 'KSO';--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "sales_group" varchar(10) DEFAULT 'K01';--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "customer_po_number" varchar(50);--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "doc_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "pricing_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "req_delivery_date" timestamp;--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "shipping_point" varchar(10) DEFAULT 'KP01';--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "delivery_priority" varchar(2) DEFAULT '02';--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "delivery_block" varchar(2);--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "route" varchar(10) DEFAULT 'KROUTE01';--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "incoterms" varchar(10) DEFAULT 'EXW';--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "billing_type" varchar(5) DEFAULT 'F2';--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "billing_block" varchar(2);--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "payment_terms" varchar(10) DEFAULT '0001';--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "ship_to_party_id" uuid;--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "bill_to_party_id" uuid;--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "payer_id" uuid;--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "account_assignment_group" varchar(10) DEFAULT '01';--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "cost_center_id" uuid;--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD COLUMN "profit_center" varchar(20) DEFAULT 'KS-PC-01';--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD CONSTRAINT "sd_sales_order_ship_to_party_id_ent_business_partner_id_fk" FOREIGN KEY ("ship_to_party_id") REFERENCES "public"."ent_business_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD CONSTRAINT "sd_sales_order_bill_to_party_id_ent_business_partner_id_fk" FOREIGN KEY ("bill_to_party_id") REFERENCES "public"."ent_business_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD CONSTRAINT "sd_sales_order_payer_id_ent_business_partner_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."ent_business_partner"("id") ON DELETE no action ON UPDATE no action;