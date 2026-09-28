CREATE TYPE "public"."approval_authority_level" AS ENUM('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'OWNER', 'CFO', 'CEO');--> statement-breakpoint
CREATE TYPE "public"."tolerance_type" AS ENUM('GL', 'EMPLOYEE', 'CUSTOMER', 'VENDOR', 'AP', 'AR');--> statement-breakpoint
CREATE TABLE "ent_approval_authority" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"position_id" uuid NOT NULL,
	"document_type" varchar(20) NOT NULL,
	"min_amount" numeric(15, 3) DEFAULT '0',
	"max_amount" numeric(15, 3) DEFAULT '999999999',
	"currency" varchar(3) DEFAULT 'INR',
	"level" "approval_authority_level" DEFAULT 'LEVEL_1' NOT NULL,
	"can_approve" boolean DEFAULT true NOT NULL,
	"can_reject" boolean DEFAULT true NOT NULL,
	"requires_dual" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ent_credit_control_area" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"currency" varchar(3) DEFAULT 'INR',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ent_credit_control_area_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ent_credit_control_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_code_id" uuid NOT NULL,
	"credit_control_area_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ent_document_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"number_range_from" varchar(20),
	"number_range_to" varchar(20),
	"account_types_allowed" varchar(20) DEFAULT '+',
	"reverse_doc_type" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ent_document_type_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ent_field_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"field_name" varchar(50) NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"is_optional" boolean DEFAULT true NOT NULL,
	"is_suppressed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ent_field_status_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "ent_field_status_variant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ent_field_status_variant_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ent_fiscal_year_period" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"period" integer NOT NULL,
	"month" integer NOT NULL,
	"year_shift" integer DEFAULT 0 NOT NULL,
	"start_date" varchar(10),
	"end_date" varchar(10)
);
--> statement-breakpoint
CREATE TABLE "ent_fiscal_year_variant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(4) NOT NULL,
	"description" varchar(100) NOT NULL,
	"year_dependent" boolean DEFAULT false NOT NULL,
	"calendar_year" boolean DEFAULT false NOT NULL,
	"number_of_periods" integer DEFAULT 12 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ent_fiscal_year_variant_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ent_permission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"module" varchar(20) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ent_permission_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ent_posting_period" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"company_code_id" uuid,
	"from_period" integer NOT NULL,
	"from_year" integer NOT NULL,
	"to_period" integer NOT NULL,
	"to_year" integer NOT NULL,
	"account_type" varchar(2) DEFAULT '+' NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ent_posting_period_variant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ent_posting_period_variant_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ent_role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ent_role_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ent_role_permission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ent_tolerance_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "tolerance_type" DEFAULT 'GL' NOT NULL,
	"company_code_id" uuid,
	"amount_per_document" numeric(15, 3) DEFAULT '0',
	"amount_per_open_item" numeric(15, 3) DEFAULT '0',
	"cash_discount_per_line" numeric(5, 2) DEFAULT '0',
	"max_cash_discount" numeric(15, 3) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ent_tolerance_group_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ent_user_role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"company_code_id" uuid,
	"plant_id" uuid,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" uuid
);
--> statement-breakpoint
ALTER TABLE "ent_credit_control_assignment" ADD CONSTRAINT "ent_credit_control_assignment_company_code_id_ent_company_code_id_fk" FOREIGN KEY ("company_code_id") REFERENCES "public"."ent_company_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_credit_control_assignment" ADD CONSTRAINT "ent_credit_control_assignment_credit_control_area_id_ent_credit_control_area_id_fk" FOREIGN KEY ("credit_control_area_id") REFERENCES "public"."ent_credit_control_area"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_field_status" ADD CONSTRAINT "ent_field_status_group_id_ent_field_status_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."ent_field_status_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_field_status_group" ADD CONSTRAINT "ent_field_status_group_variant_id_ent_field_status_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."ent_field_status_variant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_fiscal_year_period" ADD CONSTRAINT "ent_fiscal_year_period_variant_id_ent_fiscal_year_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."ent_fiscal_year_variant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_posting_period" ADD CONSTRAINT "ent_posting_period_variant_id_ent_posting_period_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."ent_posting_period_variant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_posting_period" ADD CONSTRAINT "ent_posting_period_company_code_id_ent_company_code_id_fk" FOREIGN KEY ("company_code_id") REFERENCES "public"."ent_company_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_role_permission" ADD CONSTRAINT "ent_role_permission_role_id_ent_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."ent_role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_role_permission" ADD CONSTRAINT "ent_role_permission_permission_id_ent_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."ent_permission"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_tolerance_group" ADD CONSTRAINT "ent_tolerance_group_company_code_id_ent_company_code_id_fk" FOREIGN KEY ("company_code_id") REFERENCES "public"."ent_company_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_user_role" ADD CONSTRAINT "ent_user_role_role_id_ent_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."ent_role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_user_role" ADD CONSTRAINT "ent_user_role_company_code_id_ent_company_code_id_fk" FOREIGN KEY ("company_code_id") REFERENCES "public"."ent_company_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_user_role" ADD CONSTRAINT "ent_user_role_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_approval_position" ON "ent_approval_authority" USING btree ("position_id");--> statement-breakpoint
CREATE INDEX "idx_approval_doctype" ON "ent_approval_authority" USING btree ("document_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_company_credit" ON "ent_credit_control_assignment" USING btree ("company_code_id","credit_control_area_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_field_status_field" ON "ent_field_status" USING btree ("group_id","field_name");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_field_status_group" ON "ent_field_status_group" USING btree ("variant_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fiscal_variant_period" ON "ent_fiscal_year_period" USING btree ("variant_id","period");--> statement-breakpoint
CREATE INDEX "idx_posting_period_variant" ON "ent_posting_period" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_posting_period_company" ON "ent_posting_period" USING btree ("company_code_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_role_permission" ON "ent_role_permission" USING btree ("role_id","permission_id");--> statement-breakpoint
CREATE INDEX "idx_user_role_user" ON "ent_user_role" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_role_role" ON "ent_user_role" USING btree ("role_id");