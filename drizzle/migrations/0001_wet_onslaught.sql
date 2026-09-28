CREATE TABLE "ent_material_classification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"class_type" varchar(10) DEFAULT '001' NOT NULL,
	"class_name" varchar(50) NOT NULL,
	"characteristic" varchar(100) NOT NULL,
	"value" varchar(200) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ent_material_quality" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"qm_control_key" varchar(10) DEFAULT '0001',
	"inspection_type" varchar(10) DEFAULT '01',
	"inspection_interval" integer DEFAULT 0,
	"is_qm_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ent_material_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"sales_org" varchar(10) NOT NULL,
	"distribution_channel" varchar(10) DEFAULT 'K1' NOT NULL,
	"division" varchar(10) DEFAULT 'K1' NOT NULL,
	"sales_uom" varchar(10),
	"sales_group" varchar(10),
	"item_category_group" varchar(10) DEFAULT 'NORM',
	"tax_classification" varchar(10) DEFAULT '1',
	"account_assignment_group" varchar(10) DEFAULT '01',
	"delivering_plant_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ent_material_plant" ADD COLUMN "mrp_type" varchar(10) DEFAULT 'PD';--> statement-breakpoint
ALTER TABLE "ent_material_plant" ADD COLUMN "mrp_controller" varchar(10);--> statement-breakpoint
ALTER TABLE "ent_material_plant" ADD COLUMN "lot_size" varchar(10) DEFAULT 'EX';--> statement-breakpoint
ALTER TABLE "ent_material_plant" ADD COLUMN "min_lot_size" numeric(15, 3) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "ent_material_plant" ADD COLUMN "max_lot_size" numeric(15, 3) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "ent_material_plant" ADD COLUMN "fixed_lot_size" numeric(15, 3) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "ent_material_plant" ADD COLUMN "procurement_type" varchar(1) DEFAULT 'F';--> statement-breakpoint
ALTER TABLE "ent_material_plant" ADD COLUMN "special_procurement" varchar(2);--> statement-breakpoint
ALTER TABLE "ent_material_plant" ADD COLUMN "purchasing_group" varchar(10);--> statement-breakpoint
ALTER TABLE "ent_material_plant" ADD COLUMN "purchasing_org" varchar(10);--> statement-breakpoint
ALTER TABLE "ent_material_plant" ADD COLUMN "costing_lot_size" numeric(15, 3) DEFAULT '1';--> statement-breakpoint
ALTER TABLE "ent_material_plant" ADD COLUMN "overhead_group" varchar(10);--> statement-breakpoint
ALTER TABLE "ent_material_plant" ADD COLUMN "valuation_class" varchar(10);--> statement-breakpoint
ALTER TABLE "ent_material_plant" ADD COLUMN "price_unit" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "ent_material_classification" ADD CONSTRAINT "ent_material_classification_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_material_quality" ADD CONSTRAINT "ent_material_quality_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_material_quality" ADD CONSTRAINT "ent_material_quality_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_material_sales" ADD CONSTRAINT "ent_material_sales_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_material_sales" ADD CONSTRAINT "ent_material_sales_delivering_plant_id_ent_plant_id_fk" FOREIGN KEY ("delivering_plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_mat_class_mat" ON "ent_material_classification" USING btree ("material_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_mat_plant_qm" ON "ent_material_quality" USING btree ("material_id","plant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_mat_sales_org" ON "ent_material_sales" USING btree ("material_id","sales_org","distribution_channel","division");