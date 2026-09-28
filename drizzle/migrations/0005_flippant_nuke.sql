CREATE TYPE "public"."job_status" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('PAYROLL_RUN', 'COSTING_RUN', 'MRP_RUN', 'BOM_ROLLUP', 'STOCK_REVAL', 'FI_CLOSE');--> statement-breakpoint
CREATE TABLE "ent_job_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_type" "job_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "job_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"finished_at" timestamp,
	"error" text,
	"result" jsonb,
	"created_by" uuid,
	"company_code_id" uuid
);
--> statement-breakpoint
CREATE TABLE "ent_exchange_rate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_currency" varchar(3) NOT NULL,
	"to_currency" varchar(3) NOT NULL,
	"valid_from" timestamp NOT NULL,
	"rate" numeric(15, 6) NOT NULL,
	"rate_type" varchar(10) DEFAULT 'M' NOT NULL,
	"company_code_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ent_exchange_rate" ADD CONSTRAINT "ent_exchange_rate_company_code_id_ent_company_code_id_fk" FOREIGN KEY ("company_code_id") REFERENCES "public"."ent_company_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_job_status" ON "ent_job_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_type" ON "ent_job_queue" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX "idx_job_created" ON "ent_job_queue" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_exchange_rate" ON "ent_exchange_rate" USING btree ("from_currency","to_currency","valid_from","rate_type");--> statement-breakpoint
CREATE INDEX "idx_exchange_from_to" ON "ent_exchange_rate" USING btree ("from_currency","to_currency");--> statement-breakpoint
CREATE INDEX "idx_exchange_valid_from" ON "ent_exchange_rate" USING btree ("valid_from");