ALTER TABLE "mm_po_line" ADD COLUMN "account_assignment" varchar(1);--> statement-breakpoint
ALTER TABLE "mm_po_line" ADD COLUMN "cost_center_id" uuid;--> statement-breakpoint
ALTER TABLE "mm_po_line" ADD COLUMN "gl_account_id" uuid;--> statement-breakpoint
ALTER TABLE "mm_po_line" ADD COLUMN "item_text" text;--> statement-breakpoint
ALTER TABLE "mm_po_line" ADD COLUMN "delivery_text" text;--> statement-breakpoint
ALTER TABLE "mm_pr_line" ADD COLUMN "delivery_date" timestamp;--> statement-breakpoint
ALTER TABLE "mm_pr_line" ADD COLUMN "account_assignment" varchar(1);--> statement-breakpoint
ALTER TABLE "mm_pr_line" ADD COLUMN "cost_center_id" uuid;--> statement-breakpoint
ALTER TABLE "mm_pr_line" ADD COLUMN "gl_account_id" uuid;--> statement-breakpoint
ALTER TABLE "mm_pr_line" ADD COLUMN "tax_code_id" uuid;--> statement-breakpoint
ALTER TABLE "mm_pr_line" ADD COLUMN "item_text" text;--> statement-breakpoint
ALTER TABLE "mm_purchase_order" ADD COLUMN "doc_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "mm_purchase_order" ADD COLUMN "purchasing_org" varchar(10);--> statement-breakpoint
ALTER TABLE "mm_purchase_order" ADD COLUMN "purchasing_group" varchar(10);--> statement-breakpoint
ALTER TABLE "mm_purchase_order" ADD COLUMN "payment_terms" varchar(10) DEFAULT '0001';--> statement-breakpoint
ALTER TABLE "mm_purchase_order" ADD COLUMN "incoterms" varchar(10) DEFAULT 'EXW';--> statement-breakpoint
ALTER TABLE "mm_purchase_requisition" ADD COLUMN "doc_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "mm_purchase_requisition" ADD COLUMN "purchasing_org" varchar(10);--> statement-breakpoint
ALTER TABLE "mm_purchase_requisition" ADD COLUMN "purchasing_group" varchar(10);