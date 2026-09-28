CREATE TYPE "public"."bp_role" AS ENUM('VENDOR', 'CUSTOMER', 'BOTH');--> statement-breakpoint
CREATE TYPE "public"."expiry_control" AS ENUM('BLOCK', 'WARNING', 'RESTRICTED_USE');--> statement-breakpoint
CREATE TYPE "public"."landed_cost_relevance" AS ENUM('NONE', 'FREIGHT', 'CUSTOMS', 'FREIGHT_CUSTOMS', 'ALL');--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('ROH', 'FERT', 'DIEN', 'HALB', 'NLAG');--> statement-breakpoint
CREATE TYPE "public"."price_control" AS ENUM('S', 'V');--> statement-breakpoint
CREATE TYPE "public"."sloc_type" AS ENUM('MAIN', 'COLD', 'SHOP_FLOOR', 'RETURNS', 'QI', 'BLOCKED', 'RAW', 'FG', 'PACK');--> statement-breakpoint
CREATE TYPE "public"."nr_object_type" AS ENUM('MATERIAL', 'BP', 'BATCH', 'PR', 'PO', 'GR', 'IV', 'PROD_ORDER', 'FI_DOC', 'FI_DOC_50', 'FI_DOC_51', 'FI_DOC_52', 'FI_DOC_53', 'FI_DOC_54', 'PAYROLL', 'SALES_ORDER', 'KITTING_ORDER', 'PI', 'COSTING_RUN');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('101', '102', '122', '261', '262', '311', '321', '322', '343', '344', '350', '453', '551', '561', '601', 'K01', 'K02');--> statement-breakpoint
CREATE TYPE "public"."stock_status" AS ENUM('UNRESTRICTED', 'QUALITY_INSPECTION', 'BLOCKED', 'RETURNS', 'IN_TRANSIT');--> statement-breakpoint
CREATE TYPE "public"."wf_approver_type" AS ENUM('MANAGER', 'ROLE', 'USER', 'OWNER', 'COST_CENTER_OWNER');--> statement-breakpoint
CREATE TYPE "public"."wf_document_type" AS ENUM('PR', 'PO', 'GR', 'IV', 'PROD_ORDER', 'PAYROLL', 'MATERIAL', 'VENDOR');--> statement-breakpoint
CREATE TYPE "public"."wf_state" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'IN_APPROVAL', 'APPROVED', 'REJECTED', 'ESCALATED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."wf_task_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'DELEGATED', 'ESCALATED');--> statement-breakpoint
CREATE TYPE "public"."employment_status" AS ENUM('ACTIVE', 'ON_LEAVE', 'TERMINATED', 'PROBATION');--> statement-breakpoint
CREATE TYPE "public"."payroll_status" AS ENUM('DRAFT', 'POSTED', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."ap_ar_status" AS ENUM('OPEN', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."fi_doc_status" AS ENUM('DRAFT', 'POSTED', 'REVERSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."fi_doc_type" AS ENUM('SA', 'RE', 'WE', 'RV', 'AB', 'PR', 'HR');--> statement-breakpoint
CREATE TYPE "public"."gl_account_type" AS ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');--> statement-breakpoint
CREATE TYPE "public"."tax_type" AS ENUM('INPUT', 'OUTPUT', 'BOTH', 'NONE');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('INSERT', 'UPDATE', 'DELETE', 'POST', 'REVERSE', 'APPROVE', 'REJECT');--> statement-breakpoint
CREATE TYPE "public"."gr_status" AS ENUM('DRAFT', 'POSTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."iv_status" AS ENUM('DRAFT', 'POSTED', 'BLOCKED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."po_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."pr_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONVERTED_TO_PO', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."sto_status" AS ENUM('DRAFT', 'APPROVED', 'IN_TRANSIT', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."sto_type" AS ENUM('ONE_STEP', 'TWO_STEP');--> statement-breakpoint
CREATE TYPE "public"."bom_status" AS ENUM('DRAFT', 'ACTIVE', 'BLOCKED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."bom_type" AS ENUM('STANDARD', 'KIT_STOCKED', 'KIT_PHANTOM');--> statement-breakpoint
CREATE TYPE "public"."mrp_element_type" AS ENUM('STOCK', 'SAFETY_STOCK', 'SALES_ORDER', 'PR', 'PO', 'PLANNED_ORDER', 'PROD_ORDER', 'STO');--> statement-breakpoint
CREATE TYPE "public"."mrp_run_status" AS ENUM('DRAFT', 'RUNNING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."prod_order_status" AS ENUM('CREATED', 'RELEASED', 'IN_PROCESS', 'CONFIRMED', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."prod_order_type" AS ENUM('STANDARD', 'KITTING', 'REWORK');--> statement-breakpoint
CREATE TYPE "public"."routing_status" AS ENUM('DRAFT', 'ACTIVE', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."billing_status" AS ENUM('DRAFT', 'POSTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."billing_type" AS ENUM('F2', 'F1', 'CREDIT', 'DEBIT');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('DRAFT', 'PICKING', 'PICKED', 'GOODS_ISSUED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."sales_order_status" AS ENUM('DRAFT', 'CONFIRMED', 'PARTIALLY_ISSUED', 'FULLY_ISSUED', 'INVOICED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."sales_order_type" AS ENUM('B2B', 'B2C_CASH', 'B2C_CARD', 'POS_WEBHOOK', 'ECOM');--> statement-breakpoint
CREATE TYPE "public"."sales_payment_type" AS ENUM('CASH', 'CARD', 'KNET', 'AR', 'ONLINE');--> statement-breakpoint
CREATE TYPE "public"."sales_source" AS ENUM('MANUAL', 'POS_FOODICS', 'POS_SQUARE', 'ECOM_SHOPIFY', 'ECOM_WOOCOM', 'API');--> statement-breakpoint
CREATE TYPE "public"."pi_line_status" AS ENUM('PENDING', 'COUNTED', 'POSTED', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."pi_status" AS ENUM('CREATED', 'COUNT_ENTERED', 'POSTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."costing_run_status" AS ENUM('DRAFT', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."costing_run_type" AS ENUM('STANDARD', 'SIMULATION');--> statement-breakpoint
CREATE TABLE "auth_account" (
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" timestamp,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "auth_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "auth_session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"password_hash" text,
	"role" varchar(30) DEFAULT 'USER' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "auth_verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "auth_verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "ent_batch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_number" varchar(30) NOT NULL,
	"material_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"supplier_batch_number" varchar(50),
	"manufacturing_date" timestamp,
	"expiry_date" timestamp,
	"is_expired" boolean DEFAULT false NOT NULL,
	"vendor_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ent_bp_customer_ext" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bp_id" uuid NOT NULL,
	"payment_terms_days" integer DEFAULT 0,
	"currency_code" varchar(3),
	"reconciliation_account_id" uuid,
	CONSTRAINT "ent_bp_customer_ext_bp_id_unique" UNIQUE("bp_id")
);
--> statement-breakpoint
CREATE TABLE "ent_bp_vendor_ext" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bp_id" uuid NOT NULL,
	"payment_terms_days" integer DEFAULT 30,
	"currency_code" varchar(3),
	"reconciliation_account_id" uuid,
	"is_qm_relevant" boolean DEFAULT false,
	CONSTRAINT "ent_bp_vendor_ext_bp_id_unique" UNIQUE("bp_id")
);
--> statement-breakpoint
CREATE TABLE "ent_business_partner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bp_number" varchar(20) NOT NULL,
	"role" "bp_role" NOT NULL,
	"name1" varchar(100) NOT NULL,
	"name2" varchar(100),
	"tax_id" varchar(30),
	"email" varchar(100),
	"phone" varchar(30),
	"address" text,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"is_one_time" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ent_business_partner_bp_number_unique" UNIQUE("bp_number")
);
--> statement-breakpoint
CREATE TABLE "ent_client" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(3) NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ent_client_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ent_company_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"code" varchar(4) NOT NULL,
	"name" varchar(100) NOT NULL,
	"currency_code" varchar(3) DEFAULT 'KWD' NOT NULL,
	"coa_id" uuid,
	"city" varchar(100),
	"country" varchar(2) DEFAULT 'KW',
	"address" text,
	"street" varchar(200),
	"postal_code" varchar(20),
	"region" varchar(100),
	"tax_id" varchar(50),
	"gst_number" varchar(30),
	"pan" varchar(20),
	"cin" varchar(30),
	"phone" varchar(30),
	"email" varchar(100),
	"website" varchar(100),
	"legal_form" varchar(50),
	"registration_number" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ent_company_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ent_currency" (
	"code" varchar(3) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"decimal_places" integer DEFAULT 3 NOT NULL,
	"symbol" varchar(5)
);
--> statement-breakpoint
CREATE TABLE "ent_material_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"parent_id" uuid,
	CONSTRAINT "ent_material_group_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ent_material_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_number" varchar(20) NOT NULL,
	"type" "material_type" NOT NULL,
	"group_id" uuid,
	"base_uom" varchar(10) NOT NULL,
	"description" varchar(200) NOT NULL,
	"description_long" text,
	"is_batch_managed" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"shelf_life_days" integer,
	"valuation_class" varchar(10) DEFAULT 'ROH' NOT NULL,
	"expiry_control" "expiry_control" DEFAULT 'BLOCK' NOT NULL,
	"is_kit" boolean DEFAULT false NOT NULL,
	"is_phantom_kit" boolean DEFAULT false NOT NULL,
	"landed_cost_relevance" "landed_cost_relevance" DEFAULT 'ALL' NOT NULL,
	"is_hazardous" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ent_material_master_material_number_unique" UNIQUE("material_number")
);
--> statement-breakpoint
CREATE TABLE "ent_material_plant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"price_control" "price_control" DEFAULT 'V' NOT NULL,
	"moving_avg_price" numeric(15, 4) DEFAULT '0' NOT NULL,
	"standard_price" numeric(15, 4) DEFAULT '0' NOT NULL,
	"total_stock_qty" numeric(15, 3) DEFAULT '0' NOT NULL,
	"total_stock_value" numeric(15, 3) DEFAULT '0' NOT NULL,
	"total_landed_cost" numeric(15, 3) DEFAULT '0' NOT NULL,
	"last_gr_price" numeric(15, 4) DEFAULT '0',
	"last_gr_landed_cost" numeric(15, 4) DEFAULT '0',
	"safety_stock" numeric(15, 3) DEFAULT '0',
	"reorder_point" numeric(15, 3) DEFAULT '0',
	"is_qm_active" boolean DEFAULT false NOT NULL,
	"expiry_control_override" "expiry_control",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ent_plant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_code_id" uuid NOT NULL,
	"code" varchar(4) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ent_plant_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ent_storage_location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plant_id" uuid NOT NULL,
	"code" varchar(4) NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "sloc_type" DEFAULT 'MAIN' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ent_uom" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"dimension" varchar(20),
	"base_uom_code" varchar(10),
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ent_number_range" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object_type" "nr_object_type" NOT NULL,
	"company_code_id" uuid,
	"year" integer NOT NULL,
	"prefix" varchar(10) DEFAULT '' NOT NULL,
	"from_number" bigint NOT NULL,
	"to_number" bigint NOT NULL,
	"current_number" bigint DEFAULT 0 NOT NULL,
	"is_buffered" boolean DEFAULT false NOT NULL,
	"buffer_size" integer DEFAULT 10,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ent_number_range_buffer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number_range_id" uuid NOT NULL,
	"buffered_number" bigint NOT NULL,
	"is_consumed" boolean DEFAULT false NOT NULL,
	"consumed_at" timestamp,
	"consumed_by_doc" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "inv_stock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"sloc_id" uuid NOT NULL,
	"batch_id" uuid,
	"stock_status" "stock_status" DEFAULT 'UNRESTRICTED' NOT NULL,
	"quantity" numeric(15, 3) DEFAULT '0' NOT NULL,
	"reserved_qty" numeric(15, 3) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inv_stock_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"movement_type" "movement_type" NOT NULL,
	"material_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"sloc_id" uuid NOT NULL,
	"batch_id" uuid,
	"stock_status_from" "stock_status",
	"stock_status_to" "stock_status" NOT NULL,
	"quantity" numeric(15, 3) NOT NULL,
	"quantity_before" numeric(15, 3) NOT NULL,
	"quantity_after" numeric(15, 3) NOT NULL,
	"unit_cost" numeric(15, 4) DEFAULT '0' NOT NULL,
	"total_value" numeric(15, 3) DEFAULT '0' NOT NULL,
	"total_value_before" numeric(15, 3) DEFAULT '0' NOT NULL,
	"total_value_after" numeric(15, 3) DEFAULT '0' NOT NULL,
	"reference_doc_type" varchar(20) NOT NULL,
	"reference_doc_id" uuid,
	"reference_doc_number" varchar(30),
	"reference_doc_line" integer,
	"posted_by" uuid,
	"posted_at" timestamp DEFAULT now() NOT NULL,
	"header_text" text,
	"is_reversed" varchar(1) DEFAULT 'N',
	"reversal_of_id" uuid
);
--> statement-breakpoint
CREATE TABLE "dms_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_file_name" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"storage_path" varchar(500) NOT NULL,
	"hash_sha256" varchar(64) NOT NULL,
	"uploaded_by" uuid,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "dms_document_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"linked_table" varchar(50) NOT NULL,
	"linked_id" uuid NOT NULL,
	"linked_doc_number" varchar(50),
	"doc_category" varchar(20) DEFAULT 'OTHER' NOT NULL,
	"description" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wf_definition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"document_type" "wf_document_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"conditions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wf_definition_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "wf_definition_step" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"definition_id" uuid NOT NULL,
	"step_order" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"approver_type" "wf_approver_type" NOT NULL,
	"approver_role" varchar(50),
	"approver_user_id" uuid,
	"min_amount" varchar(20),
	"max_amount" varchar(20),
	"requires_dual" boolean DEFAULT false NOT NULL,
	"is_owner_approval" boolean DEFAULT false NOT NULL,
	"sla_hours" integer DEFAULT 48,
	"can_delegate" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wf_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL,
	"from_state" "wf_state",
	"to_state" "wf_state" NOT NULL,
	"from_step" integer,
	"to_step" integer,
	"actor_id" uuid,
	"action" varchar(50) NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wf_instance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"definition_id" uuid NOT NULL,
	"document_type" "wf_document_type" NOT NULL,
	"document_id" uuid NOT NULL,
	"document_number" varchar(50) NOT NULL,
	"company_code_id" uuid,
	"current_state" "wf_state" DEFAULT 'PENDING_APPROVAL' NOT NULL,
	"current_step_order" integer DEFAULT 1 NOT NULL,
	"requester_id" uuid NOT NULL,
	"amount" varchar(20),
	"currency" varchar(3) DEFAULT 'KWD',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wf_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL,
	"step_id" uuid NOT NULL,
	"assignee_id" uuid NOT NULL,
	"status" "wf_task_status" DEFAULT 'PENDING' NOT NULL,
	"decision" varchar(20),
	"comment" text,
	"decided_at" timestamp,
	"delegated_to_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_employee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_number" varchar(20) NOT NULL,
	"user_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"phone" varchar(30),
	"position_id" uuid NOT NULL,
	"manager_id" uuid,
	"plant_id" uuid,
	"company_code_id" uuid,
	"cost_center_id" uuid,
	"status" "employment_status" DEFAULT 'ACTIVE' NOT NULL,
	"hire_date" date NOT NULL,
	"termination_date" date,
	"basic_salary" numeric(12, 3) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'KWD',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hr_employee_employee_number_unique" UNIQUE("employee_number"),
	CONSTRAINT "hr_employee_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "hr_employee_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "hr_org_unit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"parent_id" uuid,
	"plant_id" uuid,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hr_org_unit_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "hr_payroll_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"basic_salary" numeric(12, 3) NOT NULL,
	"allowances" numeric(12, 3) DEFAULT '0' NOT NULL,
	"deductions" numeric(12, 3) DEFAULT '0' NOT NULL,
	"overtime" numeric(12, 3) DEFAULT '0' NOT NULL,
	"net_pay" numeric(12, 3) NOT NULL,
	"cost_center_id" uuid,
	"status" varchar(20) DEFAULT 'DRAFT',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_payroll_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_year" varchar(4) NOT NULL,
	"period_month" varchar(2) NOT NULL,
	"company_code_id" uuid NOT NULL,
	"status" "payroll_status" DEFAULT 'DRAFT' NOT NULL,
	"total_gross" numeric(15, 3) DEFAULT '0' NOT NULL,
	"total_deductions" numeric(15, 3) DEFAULT '0' NOT NULL,
	"total_net" numeric(15, 3) DEFAULT '0' NOT NULL,
	"fi_document_id" uuid,
	"posted_at" timestamp,
	"posted_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_position" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"org_unit_id" uuid NOT NULL,
	"description" text,
	"is_manager" boolean DEFAULT false NOT NULL,
	"is_owner" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hr_position_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "fi_ap_invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(30) NOT NULL,
	"fi_document_id" uuid,
	"vendor_id" uuid NOT NULL,
	"company_code_id" uuid NOT NULL,
	"posting_date" timestamp NOT NULL,
	"invoice_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"gross_amount" numeric(15, 3) NOT NULL,
	"tax_amount" numeric(15, 3) DEFAULT '0' NOT NULL,
	"net_amount" numeric(15, 3) NOT NULL,
	"currency" varchar(3) DEFAULT 'KWD' NOT NULL,
	"status" "ap_ar_status" DEFAULT 'OPEN' NOT NULL,
	"gr_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fi_auto_account_determination" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_code_id" uuid NOT NULL,
	"transaction_key" varchar(10) NOT NULL,
	"valuation_class" varchar(10) NOT NULL,
	"gl_account_id" uuid NOT NULL,
	"description" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fi_chart_of_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fi_chart_of_accounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "fi_cost_center" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"company_code_id" uuid NOT NULL,
	"parent_id" uuid,
	"responsible_employee_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fi_cost_center_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "fi_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_number" varchar(20) NOT NULL,
	"company_code_id" uuid NOT NULL,
	"doc_type" "fi_doc_type" NOT NULL,
	"posting_date" timestamp NOT NULL,
	"document_date" timestamp NOT NULL,
	"reference" varchar(50),
	"header_text" varchar(100),
	"total_debit" numeric(15, 3) DEFAULT '0' NOT NULL,
	"total_credit" numeric(15, 3) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'KWD' NOT NULL,
	"status" "fi_doc_status" DEFAULT 'POSTED' NOT NULL,
	"reversal_of_id" uuid,
	"reference_doc_type" varchar(20),
	"reference_doc_id" uuid,
	"reference_doc_number" varchar(50),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fi_document_document_number_unique" UNIQUE("document_number")
);
--> statement-breakpoint
CREATE TABLE "fi_document_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fi_document_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"gl_account_id" uuid NOT NULL,
	"cost_center_id" uuid,
	"tax_code_id" uuid,
	"debit" numeric(15, 3) DEFAULT '0' NOT NULL,
	"credit" numeric(15, 3) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(15, 3) DEFAULT '0' NOT NULL,
	"text" varchar(100),
	"material_id" uuid,
	"quantity" numeric(15, 3),
	"bp_id" uuid,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fi_gl_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coa_id" uuid NOT NULL,
	"account_number" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"account_type" "gl_account_type" NOT NULL,
	"is_balance_sheet" boolean NOT NULL,
	"is_reconciliation" boolean DEFAULT false NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"is_tax_relevant" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fi_tax_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"description" varchar(100) NOT NULL,
	"rate" numeric(5, 2) NOT NULL,
	"type" "tax_type" NOT NULL,
	"gl_account_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "fi_tax_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "audit_document_flow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"root_document_type" varchar(20) NOT NULL,
	"root_document_id" uuid NOT NULL,
	"root_document_number" varchar(50) NOT NULL,
	"preceding_doc_type" varchar(20),
	"preceding_doc_id" uuid,
	"preceding_doc_number" varchar(50),
	"succeeding_doc_type" varchar(20) NOT NULL,
	"succeeding_doc_id" uuid NOT NULL,
	"succeeding_doc_number" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" uuid NOT NULL,
	"record_number" varchar(50),
	"action" "audit_action" NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_fields" text[],
	"changed_by" uuid,
	"changed_by_email" varchar(100),
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"company_code_id" uuid,
	"transaction_id" uuid,
	"ip_address" varchar(45),
	"user_agent" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "mm_goods_receipt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gr_number" varchar(20) NOT NULL,
	"po_id" uuid NOT NULL,
	"company_code_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"status" "gr_status" DEFAULT 'DRAFT' NOT NULL,
	"posting_date" timestamp NOT NULL,
	"document_date" timestamp NOT NULL,
	"header_text" text,
	"total_amount" numeric(15, 3) DEFAULT '0' NOT NULL,
	"total_landed_cost" numeric(15, 3) DEFAULT '0' NOT NULL,
	"fi_document_id" uuid,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mm_goods_receipt_gr_number_unique" UNIQUE("gr_number")
);
--> statement-breakpoint
CREATE TABLE "mm_gr_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gr_id" uuid NOT NULL,
	"po_line_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"material_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"sloc_id" uuid NOT NULL,
	"batch_id" uuid,
	"batch_number" varchar(30),
	"quantity" numeric(15, 3) NOT NULL,
	"uom" varchar(10) NOT NULL,
	"unit_price" numeric(15, 4) NOT NULL,
	"unit_landed_cost" numeric(15, 4) DEFAULT '0' NOT NULL,
	"total_value" numeric(15, 3) NOT NULL,
	"stock_status" varchar(20) DEFAULT 'UNRESTRICTED' NOT NULL,
	"expiry_date" timestamp,
	"stock_ledger_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mm_invoice_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"iv_number" varchar(20) NOT NULL,
	"gr_id" uuid,
	"po_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"company_code_id" uuid NOT NULL,
	"status" "iv_status" DEFAULT 'DRAFT' NOT NULL,
	"invoice_date" timestamp NOT NULL,
	"posting_date" timestamp NOT NULL,
	"vendor_invoice_number" varchar(50) NOT NULL,
	"total_amount" numeric(15, 3) NOT NULL,
	"tax_amount" numeric(15, 3) DEFAULT '0' NOT NULL,
	"freight_amount" numeric(15, 3) DEFAULT '0',
	"customs_amount" numeric(15, 3) DEFAULT '0',
	"other_charges" numeric(15, 3) DEFAULT '0',
	"total_landed_cost" numeric(15, 3) DEFAULT '0' NOT NULL,
	"price_variance" numeric(15, 3) DEFAULT '0',
	"fi_document_id" uuid,
	"ap_invoice_id" uuid,
	"is_landed_cost_posted" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mm_invoice_verification_iv_number_unique" UNIQUE("iv_number")
);
--> statement-breakpoint
CREATE TABLE "mm_iv_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"iv_id" uuid NOT NULL,
	"gr_line_id" uuid,
	"po_line_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"material_id" uuid NOT NULL,
	"quantity" numeric(15, 3) NOT NULL,
	"unit_price_invoiced" numeric(15, 4) NOT NULL,
	"unit_price_po" numeric(15, 4) NOT NULL,
	"freight_per_unit" numeric(15, 4) DEFAULT '0',
	"customs_per_unit" numeric(15, 4) DEFAULT '0',
	"other_per_unit" numeric(15, 4) DEFAULT '0',
	"total_per_unit_final" numeric(15, 4) NOT NULL,
	"price_variance_per_unit" numeric(15, 4) DEFAULT '0',
	"tax_code_id" uuid,
	"tax_amount" numeric(15, 3) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mm_po_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"material_id" uuid NOT NULL,
	"quantity" numeric(15, 3) NOT NULL,
	"quantity_received" numeric(15, 3) DEFAULT '0' NOT NULL,
	"quantity_invoiced" numeric(15, 3) DEFAULT '0' NOT NULL,
	"uom" varchar(10) NOT NULL,
	"unit_price" numeric(15, 4) NOT NULL,
	"freight_per_unit" numeric(15, 4) DEFAULT '0',
	"customs_per_unit" numeric(15, 4) DEFAULT '0',
	"tax_per_unit" numeric(15, 4) DEFAULT '0',
	"total_per_unit" numeric(15, 4) DEFAULT '0' NOT NULL,
	"plant_id" uuid NOT NULL,
	"sloc_id" uuid,
	"tax_code_id" uuid,
	"is_landed_cost_relevant" boolean DEFAULT true NOT NULL,
	"delivery_completed" boolean DEFAULT false NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"closed_reason" varchar(100),
	"closed_at" timestamp,
	"closed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mm_pr_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pr_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"material_id" uuid NOT NULL,
	"quantity" numeric(15, 3) NOT NULL,
	"uom" varchar(10) NOT NULL,
	"estimated_price" numeric(15, 4) DEFAULT '0' NOT NULL,
	"plant_id" uuid NOT NULL,
	"sloc_id" uuid,
	"is_converted" boolean DEFAULT false NOT NULL,
	"po_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mm_purchase_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_number" varchar(20) NOT NULL,
	"company_code_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"status" "po_status" DEFAULT 'DRAFT' NOT NULL,
	"total_amount" numeric(15, 3) DEFAULT '0' NOT NULL,
	"total_landed_cost" numeric(15, 3) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'KWD' NOT NULL,
	"payment_terms_days" integer DEFAULT 30,
	"delivery_date" timestamp,
	"header_text" text,
	"workflow_instance_id" uuid,
	"pr_id" uuid,
	"freight_amount" numeric(15, 3) DEFAULT '0',
	"customs_amount" numeric(15, 3) DEFAULT '0',
	"other_charges" numeric(15, 3) DEFAULT '0',
	"tax_amount" numeric(15, 3) DEFAULT '0',
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mm_purchase_order_po_number_unique" UNIQUE("po_number")
);
--> statement-breakpoint
CREATE TABLE "mm_purchase_requisition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pr_number" varchar(20) NOT NULL,
	"company_code_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"status" "pr_status" DEFAULT 'DRAFT' NOT NULL,
	"total_amount" numeric(15, 3) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'KWD' NOT NULL,
	"required_date" timestamp,
	"header_text" text,
	"workflow_instance_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mm_purchase_requisition_pr_number_unique" UNIQUE("pr_number")
);
--> statement-breakpoint
CREATE TABLE "mm_sto_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sto_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"material_id" uuid NOT NULL,
	"quantity" numeric(15, 3) NOT NULL,
	"quantity_issued" numeric(15, 3) DEFAULT '0',
	"quantity_received" numeric(15, 3) DEFAULT '0',
	"quantity_in_transit" numeric(15, 3) DEFAULT '0',
	"uom" varchar(10) NOT NULL,
	"unit_price" numeric(15, 4) DEFAULT '0',
	"batch_id" uuid,
	"batch_number" varchar(30),
	"is_closed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mm_stock_transport_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sto_number" varchar(20) NOT NULL,
	"type" "sto_type" DEFAULT 'TWO_STEP' NOT NULL,
	"status" "sto_status" DEFAULT 'DRAFT' NOT NULL,
	"company_code_id" uuid NOT NULL,
	"supplying_plant_id" uuid NOT NULL,
	"supplying_sloc_id" uuid,
	"receiving_plant_id" uuid NOT NULL,
	"receiving_sloc_id" uuid,
	"in_transit_plant_id" uuid,
	"freight_cost" numeric(15, 3) DEFAULT '0',
	"total_amount" numeric(15, 3) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'KWD',
	"delivery_number" varchar(20),
	"header_text" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mm_stock_transport_order_sto_number_unique" UNIQUE("sto_number")
);
--> statement-breakpoint
CREATE TABLE "pp_bom_header" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bom_number" varchar(30) NOT NULL,
	"material_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"type" "bom_type" DEFAULT 'STANDARD' NOT NULL,
	"status" "bom_status" DEFAULT 'ACTIVE' NOT NULL,
	"version" varchar(10) DEFAULT '01' NOT NULL,
	"base_quantity" numeric(15, 3) DEFAULT '1' NOT NULL,
	"base_uom" varchar(10) NOT NULL,
	"is_phantom" boolean DEFAULT false NOT NULL,
	"is_kit" boolean DEFAULT false NOT NULL,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_to" timestamp,
	"expiry_rule" varchar(20) DEFAULT 'MIN_COMPONENTS' NOT NULL,
	"fixed_shelf_life_days" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pp_bom_header_bom_number_unique" UNIQUE("bom_number")
);
--> statement-breakpoint
CREATE TABLE "pp_bom_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bom_header_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"component_material_id" uuid NOT NULL,
	"quantity" numeric(15, 3) NOT NULL,
	"uom" varchar(10) NOT NULL,
	"is_batch_tracked" boolean DEFAULT true NOT NULL,
	"is_phantom_explode" boolean DEFAULT false NOT NULL,
	"scrap_factor" numeric(5, 2) DEFAULT '0',
	"work_center_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pp_kitting_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kitting_number" varchar(20) NOT NULL,
	"production_order_id" uuid NOT NULL,
	"kit_material_id" uuid NOT NULL,
	"target_batch_id" uuid NOT NULL,
	"target_quantity" numeric(15, 3) NOT NULL,
	"min_component_expiry" timestamp,
	"calculated_expiry" timestamp,
	"k01_movement_id" uuid,
	"k02_movement_id" uuid,
	"status" "prod_order_status" DEFAULT 'CREATED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pp_kitting_order_kitting_number_unique" UNIQUE("kitting_number")
);
--> statement-breakpoint
CREATE TABLE "pp_mrp_element" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mrp_run_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"element_type" "mrp_element_type" NOT NULL,
	"element_number" varchar(30),
	"quantity" numeric(15, 3) NOT NULL,
	"available_quantity" numeric(15, 3) DEFAULT '0',
	"date" timestamp NOT NULL,
	"is_shortage" boolean DEFAULT false NOT NULL,
	"generated_pr_id" uuid,
	"generated_planned_order_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pp_mrp_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mrp_number" varchar(20) NOT NULL,
	"plant_id" uuid NOT NULL,
	"status" "mrp_run_status" DEFAULT 'DRAFT' NOT NULL,
	"planning_horizon_days" integer DEFAULT 30,
	"include_safety_stock" boolean DEFAULT true NOT NULL,
	"include_sales_orders" boolean DEFAULT true NOT NULL,
	"total_materials" integer DEFAULT 0,
	"total_shortages" integer DEFAULT 0,
	"total_prs_generated" integer DEFAULT 0,
	"total_planned_orders_generated" integer DEFAULT 0,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "pp_mrp_run_mrp_number_unique" UNIQUE("mrp_number")
);
--> statement-breakpoint
CREATE TABLE "pp_production_confirmation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"confirmation_number" varchar(20) NOT NULL,
	"production_order_id" uuid NOT NULL,
	"work_center_id" uuid,
	"yield_quantity" numeric(15, 3) NOT NULL,
	"scrap_quantity" numeric(15, 3) DEFAULT '0' NOT NULL,
	"rework_quantity" numeric(15, 3) DEFAULT '0' NOT NULL,
	"exploded_components" jsonb,
	"posted_at" timestamp DEFAULT now() NOT NULL,
	"posted_by" uuid,
	"fi_document_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pp_production_confirmation_confirmation_number_unique" UNIQUE("confirmation_number")
);
--> statement-breakpoint
CREATE TABLE "pp_production_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"type" "prod_order_type" DEFAULT 'STANDARD' NOT NULL,
	"material_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"bom_header_id" uuid,
	"work_center_id" uuid,
	"quantity_planned" numeric(15, 3) NOT NULL,
	"quantity_yield" numeric(15, 3) DEFAULT '0' NOT NULL,
	"quantity_scrap" numeric(15, 3) DEFAULT '0' NOT NULL,
	"quantity_rework" numeric(15, 3) DEFAULT '0' NOT NULL,
	"status" "prod_order_status" DEFAULT 'CREATED' NOT NULL,
	"target_batch_id" uuid,
	"target_batch_number" varchar(30),
	"target_expiry_date" timestamp,
	"planned_start" timestamp,
	"planned_end" timestamp,
	"actual_start" timestamp,
	"actual_end" timestamp,
	"planned_cost" numeric(15, 3) DEFAULT '0',
	"actual_cost" numeric(15, 3) DEFAULT '0',
	"is_kitting" boolean DEFAULT false NOT NULL,
	"kitting_order_id" uuid,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pp_production_order_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "pp_production_order_component" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"production_order_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"batch_id" uuid,
	"bom_line_id" uuid,
	"quantity_required" numeric(15, 3) NOT NULL,
	"quantity_issued" numeric(15, 3) DEFAULT '0' NOT NULL,
	"quantity_scrap" numeric(15, 3) DEFAULT '0' NOT NULL,
	"uom" varchar(10) NOT NULL,
	"is_phantom" boolean DEFAULT false NOT NULL,
	"is_backflushed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pp_routing_header" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routing_number" varchar(30) NOT NULL,
	"material_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"bom_header_id" uuid,
	"description" varchar(200),
	"status" "routing_status" DEFAULT 'ACTIVE' NOT NULL,
	"version" varchar(10) DEFAULT '01' NOT NULL,
	"lot_size_from" numeric(15, 3) DEFAULT '1',
	"lot_size_to" numeric(15, 3) DEFAULT '999999',
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pp_routing_header_routing_number_unique" UNIQUE("routing_number")
);
--> statement-breakpoint
CREATE TABLE "pp_routing_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routing_header_id" uuid NOT NULL,
	"operation_number" integer NOT NULL,
	"work_center_id" uuid NOT NULL,
	"description" varchar(200),
	"setup_time_minutes" integer DEFAULT 0 NOT NULL,
	"machine_time_minutes" integer DEFAULT 0 NOT NULL,
	"labor_time_minutes" integer DEFAULT 0 NOT NULL,
	"base_quantity" numeric(15, 3) DEFAULT '1' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pp_work_center" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"plant_id" uuid NOT NULL,
	"cost_center_id" uuid,
	"description" text,
	"capacity_per_hour" numeric(10, 2) DEFAULT '0',
	"labor_rate_per_hour" numeric(15, 4) DEFAULT '0',
	"machine_rate_per_hour" numeric(15, 4) DEFAULT '0',
	"overhead_rate_percent" numeric(5, 2) DEFAULT '0',
	"setup_time_minutes" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pp_work_center_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "sd_billing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"billing_number" varchar(20) NOT NULL,
	"type" "billing_type" DEFAULT 'F2' NOT NULL,
	"status" "billing_status" DEFAULT 'DRAFT' NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"delivery_id" uuid,
	"company_code_id" uuid NOT NULL,
	"customer_id" uuid,
	"billing_date" timestamp DEFAULT now() NOT NULL,
	"total_amount" numeric(15, 3) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(15, 3) DEFAULT '0',
	"net_amount" numeric(15, 3) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'KWD',
	"fi_document_id" uuid,
	"due_date" timestamp,
	"is_paid" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sd_billing_billing_number_unique" UNIQUE("billing_number")
);
--> statement-breakpoint
CREATE TABLE "sd_billing_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"billing_id" uuid NOT NULL,
	"delivery_line_id" uuid,
	"sales_line_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"material_id" uuid NOT NULL,
	"quantity" numeric(15, 3) NOT NULL,
	"unit_price" numeric(15, 4) NOT NULL,
	"line_total" numeric(15, 3) NOT NULL,
	"tax_amount" numeric(15, 3) DEFAULT '0',
	"cogs_per_unit" numeric(15, 4) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sd_delivery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_number" varchar(20) NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"company_code_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"ship_to_customer_id" uuid,
	"status" "delivery_status" DEFAULT 'DRAFT' NOT NULL,
	"picking_date" timestamp,
	"goods_issue_date" timestamp,
	"fi_document_id" uuid,
	"total_quantity" numeric(15, 3) DEFAULT '0',
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sd_delivery_delivery_number_unique" UNIQUE("delivery_number")
);
--> statement-breakpoint
CREATE TABLE "sd_delivery_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_id" uuid NOT NULL,
	"sales_line_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"material_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"sloc_id" uuid NOT NULL,
	"batch_id" uuid,
	"batch_number" varchar(30),
	"quantity" numeric(15, 3) NOT NULL,
	"quantity_picked" numeric(15, 3) DEFAULT '0',
	"quantity_issued" numeric(15, 3) DEFAULT '0',
	"uom" varchar(10) NOT NULL,
	"stock_ledger_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sd_pos_webhook_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "sales_source" NOT NULL,
	"external_id" varchar(100),
	"payload" jsonb NOT NULL,
	"headers" jsonb,
	"sales_order_id" uuid,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"error_message" text,
	"processing_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sd_sales_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"material_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"sloc_id" uuid NOT NULL,
	"batch_id" uuid,
	"batch_number" varchar(30),
	"quantity" numeric(15, 3) NOT NULL,
	"quantity_issued" numeric(15, 3) DEFAULT '0' NOT NULL,
	"uom" varchar(10) NOT NULL,
	"unit_price" numeric(15, 4) NOT NULL,
	"discount_per_unit" numeric(15, 4) DEFAULT '0',
	"tax_code_id" uuid,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"line_total" numeric(15, 3) NOT NULL,
	"cogs_per_unit" numeric(15, 4) DEFAULT '0',
	"total_cogs" numeric(15, 3) DEFAULT '0',
	"stock_ledger_id" uuid,
	"expiry_date" timestamp,
	"is_expiry_blocked" boolean DEFAULT false NOT NULL,
	"expiry_warning" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sd_sales_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sales_number" varchar(20) NOT NULL,
	"type" "sales_order_type" DEFAULT 'B2B' NOT NULL,
	"status" "sales_order_status" DEFAULT 'DRAFT' NOT NULL,
	"company_code_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"customer_id" uuid,
	"customer_name" varchar(100),
	"payment_type" "sales_payment_type" DEFAULT 'AR' NOT NULL,
	"is_cash_sale" boolean DEFAULT false NOT NULL,
	"source" "sales_source" DEFAULT 'MANUAL' NOT NULL,
	"external_id" varchar(100),
	"external_payload" jsonb,
	"order_date" timestamp DEFAULT now() NOT NULL,
	"posting_date" timestamp DEFAULT now() NOT NULL,
	"required_date" timestamp,
	"total_amount" numeric(15, 3) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(15, 3) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(15, 3) DEFAULT '0' NOT NULL,
	"net_amount" numeric(15, 3) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'KWD' NOT NULL,
	"fi_document_id" uuid,
	"due_date" timestamp,
	"is_paid" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sd_sales_order_sales_number_unique" UNIQUE("sales_number")
);
--> statement-breakpoint
CREATE TABLE "pi_count_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pi_line_id" uuid NOT NULL,
	"counted_qty" numeric(15, 3) NOT NULL,
	"counted_by" uuid,
	"counted_at" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "pi_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pi_number" varchar(20) NOT NULL,
	"company_code_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"sloc_id" uuid NOT NULL,
	"status" "pi_status" DEFAULT 'CREATED' NOT NULL,
	"posting_date" timestamp NOT NULL,
	"planned_count_date" timestamp NOT NULL,
	"header_text" text,
	"is_blocking_active" boolean DEFAULT true NOT NULL,
	"total_lines" integer DEFAULT 0 NOT NULL,
	"counted_lines" integer DEFAULT 0 NOT NULL,
	"total_system_qty" numeric(15, 3) DEFAULT '0',
	"total_counted_qty" numeric(15, 3) DEFAULT '0',
	"total_variance_qty" numeric(15, 3) DEFAULT '0',
	"total_variance_value" numeric(15, 3) DEFAULT '0',
	"fi_document_id" uuid,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pi_document_pi_number_unique" UNIQUE("pi_number")
);
--> statement-breakpoint
CREATE TABLE "pi_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pi_document_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"material_id" uuid NOT NULL,
	"batch_id" uuid,
	"batch_number" varchar(30),
	"stock_status" varchar(20) DEFAULT 'UNRESTRICTED' NOT NULL,
	"system_qty" numeric(15, 3) NOT NULL,
	"system_value" numeric(15, 3) DEFAULT '0' NOT NULL,
	"unit_cost" numeric(15, 4) DEFAULT '0' NOT NULL,
	"counted_qty" numeric(15, 3),
	"variance_qty" numeric(15, 3),
	"variance_value" numeric(15, 3),
	"status" "pi_line_status" DEFAULT 'PENDING' NOT NULL,
	"is_counted" boolean DEFAULT false NOT NULL,
	"stock_ledger_id" uuid,
	"expiry_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "co_costing_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_number" varchar(20) NOT NULL,
	"type" "costing_run_type" DEFAULT 'STANDARD' NOT NULL,
	"status" "costing_run_status" DEFAULT 'DRAFT' NOT NULL,
	"plant_id" uuid NOT NULL,
	"costing_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"total_materials" integer DEFAULT 0 NOT NULL,
	"total_costed" integer DEFAULT 0 NOT NULL,
	"total_value" numeric(15, 3) DEFAULT '0',
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "co_costing_run_run_number_unique" UNIQUE("run_number")
);
--> statement-breakpoint
CREATE TABLE "co_costing_run_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"costing_run_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"bom_header_id" uuid,
	"total_cost" numeric(15, 4) DEFAULT '0' NOT NULL,
	"material_cost" numeric(15, 4) DEFAULT '0' NOT NULL,
	"labor_cost" numeric(15, 4) DEFAULT '0' NOT NULL,
	"overhead_cost" numeric(15, 4) DEFAULT '0' NOT NULL,
	"previous_standard_price" numeric(15, 4) DEFAULT '0' NOT NULL,
	"new_standard_price" numeric(15, 4) DEFAULT '0' NOT NULL,
	"price_difference" numeric(15, 4) DEFAULT '0' NOT NULL,
	"bom_explosion" jsonb,
	"is_updated" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_userId_auth_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_userId_auth_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_batch" ADD CONSTRAINT "ent_batch_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_batch" ADD CONSTRAINT "ent_batch_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_batch" ADD CONSTRAINT "ent_batch_vendor_id_ent_business_partner_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."ent_business_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_bp_customer_ext" ADD CONSTRAINT "ent_bp_customer_ext_bp_id_ent_business_partner_id_fk" FOREIGN KEY ("bp_id") REFERENCES "public"."ent_business_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_bp_customer_ext" ADD CONSTRAINT "ent_bp_customer_ext_currency_code_ent_currency_code_fk" FOREIGN KEY ("currency_code") REFERENCES "public"."ent_currency"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_bp_vendor_ext" ADD CONSTRAINT "ent_bp_vendor_ext_bp_id_ent_business_partner_id_fk" FOREIGN KEY ("bp_id") REFERENCES "public"."ent_business_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_bp_vendor_ext" ADD CONSTRAINT "ent_bp_vendor_ext_currency_code_ent_currency_code_fk" FOREIGN KEY ("currency_code") REFERENCES "public"."ent_currency"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_company_code" ADD CONSTRAINT "ent_company_code_client_id_ent_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."ent_client"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_material_group" ADD CONSTRAINT "ent_material_group_parent_id_ent_material_group_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ent_material_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_material_master" ADD CONSTRAINT "ent_material_master_group_id_ent_material_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."ent_material_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_material_master" ADD CONSTRAINT "ent_material_master_base_uom_ent_uom_code_fk" FOREIGN KEY ("base_uom") REFERENCES "public"."ent_uom"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_material_plant" ADD CONSTRAINT "ent_material_plant_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_material_plant" ADD CONSTRAINT "ent_material_plant_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_plant" ADD CONSTRAINT "ent_plant_company_code_id_ent_company_code_id_fk" FOREIGN KEY ("company_code_id") REFERENCES "public"."ent_company_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_storage_location" ADD CONSTRAINT "ent_storage_location_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_uom" ADD CONSTRAINT "ent_uom_base_uom_code_ent_uom_code_fk" FOREIGN KEY ("base_uom_code") REFERENCES "public"."ent_uom"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ent_number_range_buffer" ADD CONSTRAINT "ent_number_range_buffer_number_range_id_ent_number_range_id_fk" FOREIGN KEY ("number_range_id") REFERENCES "public"."ent_number_range"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inv_stock" ADD CONSTRAINT "inv_stock_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inv_stock" ADD CONSTRAINT "inv_stock_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inv_stock" ADD CONSTRAINT "inv_stock_sloc_id_ent_storage_location_id_fk" FOREIGN KEY ("sloc_id") REFERENCES "public"."ent_storage_location"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inv_stock" ADD CONSTRAINT "inv_stock_batch_id_ent_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."ent_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inv_stock_ledger" ADD CONSTRAINT "inv_stock_ledger_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inv_stock_ledger" ADD CONSTRAINT "inv_stock_ledger_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inv_stock_ledger" ADD CONSTRAINT "inv_stock_ledger_sloc_id_ent_storage_location_id_fk" FOREIGN KEY ("sloc_id") REFERENCES "public"."ent_storage_location"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inv_stock_ledger" ADD CONSTRAINT "inv_stock_ledger_batch_id_ent_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."ent_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inv_stock_ledger" ADD CONSTRAINT "inv_stock_ledger_reversal_of_id_inv_stock_ledger_id_fk" FOREIGN KEY ("reversal_of_id") REFERENCES "public"."inv_stock_ledger"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dms_document_link" ADD CONSTRAINT "dms_document_link_document_id_dms_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."dms_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wf_definition_step" ADD CONSTRAINT "wf_definition_step_definition_id_wf_definition_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."wf_definition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wf_history" ADD CONSTRAINT "wf_history_instance_id_wf_instance_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."wf_instance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wf_instance" ADD CONSTRAINT "wf_instance_definition_id_wf_definition_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."wf_definition"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wf_task" ADD CONSTRAINT "wf_task_instance_id_wf_instance_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."wf_instance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wf_task" ADD CONSTRAINT "wf_task_step_id_wf_definition_step_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."wf_definition_step"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employee" ADD CONSTRAINT "hr_employee_position_id_hr_position_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."hr_position"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employee" ADD CONSTRAINT "hr_employee_manager_id_hr_employee_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."hr_employee"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employee" ADD CONSTRAINT "hr_employee_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_employee" ADD CONSTRAINT "hr_employee_company_code_id_ent_company_code_id_fk" FOREIGN KEY ("company_code_id") REFERENCES "public"."ent_company_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_org_unit" ADD CONSTRAINT "hr_org_unit_parent_id_hr_org_unit_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."hr_org_unit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_org_unit" ADD CONSTRAINT "hr_org_unit_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_payroll_line" ADD CONSTRAINT "hr_payroll_line_payroll_run_id_hr_payroll_run_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."hr_payroll_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_payroll_line" ADD CONSTRAINT "hr_payroll_line_employee_id_hr_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hr_employee"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_payroll_run" ADD CONSTRAINT "hr_payroll_run_company_code_id_ent_company_code_id_fk" FOREIGN KEY ("company_code_id") REFERENCES "public"."ent_company_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_position" ADD CONSTRAINT "hr_position_org_unit_id_hr_org_unit_id_fk" FOREIGN KEY ("org_unit_id") REFERENCES "public"."hr_org_unit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_ap_invoice" ADD CONSTRAINT "fi_ap_invoice_fi_document_id_fi_document_id_fk" FOREIGN KEY ("fi_document_id") REFERENCES "public"."fi_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_ap_invoice" ADD CONSTRAINT "fi_ap_invoice_vendor_id_ent_business_partner_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."ent_business_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_ap_invoice" ADD CONSTRAINT "fi_ap_invoice_company_code_id_ent_company_code_id_fk" FOREIGN KEY ("company_code_id") REFERENCES "public"."ent_company_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_auto_account_determination" ADD CONSTRAINT "fi_auto_account_determination_company_code_id_ent_company_code_id_fk" FOREIGN KEY ("company_code_id") REFERENCES "public"."ent_company_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_auto_account_determination" ADD CONSTRAINT "fi_auto_account_determination_gl_account_id_fi_gl_account_id_fk" FOREIGN KEY ("gl_account_id") REFERENCES "public"."fi_gl_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_cost_center" ADD CONSTRAINT "fi_cost_center_company_code_id_ent_company_code_id_fk" FOREIGN KEY ("company_code_id") REFERENCES "public"."ent_company_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_cost_center" ADD CONSTRAINT "fi_cost_center_parent_id_fi_cost_center_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."fi_cost_center"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_document" ADD CONSTRAINT "fi_document_company_code_id_ent_company_code_id_fk" FOREIGN KEY ("company_code_id") REFERENCES "public"."ent_company_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_document" ADD CONSTRAINT "fi_document_reversal_of_id_fi_document_id_fk" FOREIGN KEY ("reversal_of_id") REFERENCES "public"."fi_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_document_line" ADD CONSTRAINT "fi_document_line_fi_document_id_fi_document_id_fk" FOREIGN KEY ("fi_document_id") REFERENCES "public"."fi_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_document_line" ADD CONSTRAINT "fi_document_line_gl_account_id_fi_gl_account_id_fk" FOREIGN KEY ("gl_account_id") REFERENCES "public"."fi_gl_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_document_line" ADD CONSTRAINT "fi_document_line_cost_center_id_fi_cost_center_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."fi_cost_center"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_document_line" ADD CONSTRAINT "fi_document_line_tax_code_id_fi_tax_code_id_fk" FOREIGN KEY ("tax_code_id") REFERENCES "public"."fi_tax_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_document_line" ADD CONSTRAINT "fi_document_line_bp_id_ent_business_partner_id_fk" FOREIGN KEY ("bp_id") REFERENCES "public"."ent_business_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_gl_account" ADD CONSTRAINT "fi_gl_account_coa_id_fi_chart_of_accounts_id_fk" FOREIGN KEY ("coa_id") REFERENCES "public"."fi_chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fi_tax_code" ADD CONSTRAINT "fi_tax_code_gl_account_id_fi_gl_account_id_fk" FOREIGN KEY ("gl_account_id") REFERENCES "public"."fi_gl_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_goods_receipt" ADD CONSTRAINT "mm_goods_receipt_po_id_mm_purchase_order_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."mm_purchase_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_goods_receipt" ADD CONSTRAINT "mm_goods_receipt_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_gr_line" ADD CONSTRAINT "mm_gr_line_gr_id_mm_goods_receipt_id_fk" FOREIGN KEY ("gr_id") REFERENCES "public"."mm_goods_receipt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_gr_line" ADD CONSTRAINT "mm_gr_line_po_line_id_mm_po_line_id_fk" FOREIGN KEY ("po_line_id") REFERENCES "public"."mm_po_line"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_gr_line" ADD CONSTRAINT "mm_gr_line_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_gr_line" ADD CONSTRAINT "mm_gr_line_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_gr_line" ADD CONSTRAINT "mm_gr_line_sloc_id_ent_storage_location_id_fk" FOREIGN KEY ("sloc_id") REFERENCES "public"."ent_storage_location"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_gr_line" ADD CONSTRAINT "mm_gr_line_batch_id_ent_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."ent_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_invoice_verification" ADD CONSTRAINT "mm_invoice_verification_gr_id_mm_goods_receipt_id_fk" FOREIGN KEY ("gr_id") REFERENCES "public"."mm_goods_receipt"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_invoice_verification" ADD CONSTRAINT "mm_invoice_verification_po_id_mm_purchase_order_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."mm_purchase_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_invoice_verification" ADD CONSTRAINT "mm_invoice_verification_vendor_id_ent_business_partner_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."ent_business_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_iv_line" ADD CONSTRAINT "mm_iv_line_iv_id_mm_invoice_verification_id_fk" FOREIGN KEY ("iv_id") REFERENCES "public"."mm_invoice_verification"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_iv_line" ADD CONSTRAINT "mm_iv_line_gr_line_id_mm_gr_line_id_fk" FOREIGN KEY ("gr_line_id") REFERENCES "public"."mm_gr_line"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_iv_line" ADD CONSTRAINT "mm_iv_line_po_line_id_mm_po_line_id_fk" FOREIGN KEY ("po_line_id") REFERENCES "public"."mm_po_line"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_iv_line" ADD CONSTRAINT "mm_iv_line_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_po_line" ADD CONSTRAINT "mm_po_line_po_id_mm_purchase_order_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."mm_purchase_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_po_line" ADD CONSTRAINT "mm_po_line_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_po_line" ADD CONSTRAINT "mm_po_line_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_po_line" ADD CONSTRAINT "mm_po_line_sloc_id_ent_storage_location_id_fk" FOREIGN KEY ("sloc_id") REFERENCES "public"."ent_storage_location"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_pr_line" ADD CONSTRAINT "mm_pr_line_pr_id_mm_purchase_requisition_id_fk" FOREIGN KEY ("pr_id") REFERENCES "public"."mm_purchase_requisition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_pr_line" ADD CONSTRAINT "mm_pr_line_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_pr_line" ADD CONSTRAINT "mm_pr_line_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_pr_line" ADD CONSTRAINT "mm_pr_line_sloc_id_ent_storage_location_id_fk" FOREIGN KEY ("sloc_id") REFERENCES "public"."ent_storage_location"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_purchase_order" ADD CONSTRAINT "mm_purchase_order_vendor_id_ent_business_partner_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."ent_business_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_purchase_order" ADD CONSTRAINT "mm_purchase_order_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_purchase_order" ADD CONSTRAINT "mm_purchase_order_pr_id_mm_purchase_requisition_id_fk" FOREIGN KEY ("pr_id") REFERENCES "public"."mm_purchase_requisition"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_purchase_requisition" ADD CONSTRAINT "mm_purchase_requisition_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_sto_line" ADD CONSTRAINT "mm_sto_line_sto_id_mm_stock_transport_order_id_fk" FOREIGN KEY ("sto_id") REFERENCES "public"."mm_stock_transport_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_sto_line" ADD CONSTRAINT "mm_sto_line_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_sto_line" ADD CONSTRAINT "mm_sto_line_batch_id_ent_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."ent_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_stock_transport_order" ADD CONSTRAINT "mm_stock_transport_order_supplying_plant_id_ent_plant_id_fk" FOREIGN KEY ("supplying_plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_stock_transport_order" ADD CONSTRAINT "mm_stock_transport_order_supplying_sloc_id_ent_storage_location_id_fk" FOREIGN KEY ("supplying_sloc_id") REFERENCES "public"."ent_storage_location"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_stock_transport_order" ADD CONSTRAINT "mm_stock_transport_order_receiving_plant_id_ent_plant_id_fk" FOREIGN KEY ("receiving_plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_stock_transport_order" ADD CONSTRAINT "mm_stock_transport_order_receiving_sloc_id_ent_storage_location_id_fk" FOREIGN KEY ("receiving_sloc_id") REFERENCES "public"."ent_storage_location"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_bom_header" ADD CONSTRAINT "pp_bom_header_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_bom_header" ADD CONSTRAINT "pp_bom_header_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_bom_line" ADD CONSTRAINT "pp_bom_line_bom_header_id_pp_bom_header_id_fk" FOREIGN KEY ("bom_header_id") REFERENCES "public"."pp_bom_header"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_bom_line" ADD CONSTRAINT "pp_bom_line_component_material_id_ent_material_master_id_fk" FOREIGN KEY ("component_material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_bom_line" ADD CONSTRAINT "pp_bom_line_work_center_id_pp_work_center_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."pp_work_center"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_kitting_order" ADD CONSTRAINT "pp_kitting_order_production_order_id_pp_production_order_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."pp_production_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_kitting_order" ADD CONSTRAINT "pp_kitting_order_kit_material_id_ent_material_master_id_fk" FOREIGN KEY ("kit_material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_mrp_element" ADD CONSTRAINT "pp_mrp_element_mrp_run_id_pp_mrp_run_id_fk" FOREIGN KEY ("mrp_run_id") REFERENCES "public"."pp_mrp_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_mrp_element" ADD CONSTRAINT "pp_mrp_element_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_mrp_element" ADD CONSTRAINT "pp_mrp_element_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_mrp_run" ADD CONSTRAINT "pp_mrp_run_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_production_confirmation" ADD CONSTRAINT "pp_production_confirmation_production_order_id_pp_production_order_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."pp_production_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_production_confirmation" ADD CONSTRAINT "pp_production_confirmation_work_center_id_pp_work_center_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."pp_work_center"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_production_order" ADD CONSTRAINT "pp_production_order_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_production_order" ADD CONSTRAINT "pp_production_order_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_production_order" ADD CONSTRAINT "pp_production_order_bom_header_id_pp_bom_header_id_fk" FOREIGN KEY ("bom_header_id") REFERENCES "public"."pp_bom_header"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_production_order" ADD CONSTRAINT "pp_production_order_work_center_id_pp_work_center_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."pp_work_center"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_production_order" ADD CONSTRAINT "pp_production_order_kitting_order_id_pp_production_order_id_fk" FOREIGN KEY ("kitting_order_id") REFERENCES "public"."pp_production_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_production_order_component" ADD CONSTRAINT "pp_production_order_component_production_order_id_pp_production_order_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."pp_production_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_production_order_component" ADD CONSTRAINT "pp_production_order_component_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_production_order_component" ADD CONSTRAINT "pp_production_order_component_bom_line_id_pp_bom_line_id_fk" FOREIGN KEY ("bom_line_id") REFERENCES "public"."pp_bom_line"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_routing_header" ADD CONSTRAINT "pp_routing_header_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_routing_header" ADD CONSTRAINT "pp_routing_header_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_routing_header" ADD CONSTRAINT "pp_routing_header_bom_header_id_pp_bom_header_id_fk" FOREIGN KEY ("bom_header_id") REFERENCES "public"."pp_bom_header"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_routing_line" ADD CONSTRAINT "pp_routing_line_routing_header_id_pp_routing_header_id_fk" FOREIGN KEY ("routing_header_id") REFERENCES "public"."pp_routing_header"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_routing_line" ADD CONSTRAINT "pp_routing_line_work_center_id_pp_work_center_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."pp_work_center"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pp_work_center" ADD CONSTRAINT "pp_work_center_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_billing" ADD CONSTRAINT "sd_billing_sales_order_id_sd_sales_order_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sd_sales_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_billing" ADD CONSTRAINT "sd_billing_delivery_id_sd_delivery_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."sd_delivery"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_billing" ADD CONSTRAINT "sd_billing_customer_id_ent_business_partner_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."ent_business_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_billing_line" ADD CONSTRAINT "sd_billing_line_billing_id_sd_billing_id_fk" FOREIGN KEY ("billing_id") REFERENCES "public"."sd_billing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_billing_line" ADD CONSTRAINT "sd_billing_line_delivery_line_id_sd_delivery_line_id_fk" FOREIGN KEY ("delivery_line_id") REFERENCES "public"."sd_delivery_line"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_billing_line" ADD CONSTRAINT "sd_billing_line_sales_line_id_sd_sales_line_id_fk" FOREIGN KEY ("sales_line_id") REFERENCES "public"."sd_sales_line"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_billing_line" ADD CONSTRAINT "sd_billing_line_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_delivery" ADD CONSTRAINT "sd_delivery_sales_order_id_sd_sales_order_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sd_sales_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_delivery" ADD CONSTRAINT "sd_delivery_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_delivery" ADD CONSTRAINT "sd_delivery_ship_to_customer_id_ent_business_partner_id_fk" FOREIGN KEY ("ship_to_customer_id") REFERENCES "public"."ent_business_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_delivery_line" ADD CONSTRAINT "sd_delivery_line_delivery_id_sd_delivery_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."sd_delivery"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_delivery_line" ADD CONSTRAINT "sd_delivery_line_sales_line_id_sd_sales_line_id_fk" FOREIGN KEY ("sales_line_id") REFERENCES "public"."sd_sales_line"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_delivery_line" ADD CONSTRAINT "sd_delivery_line_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_delivery_line" ADD CONSTRAINT "sd_delivery_line_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_delivery_line" ADD CONSTRAINT "sd_delivery_line_sloc_id_ent_storage_location_id_fk" FOREIGN KEY ("sloc_id") REFERENCES "public"."ent_storage_location"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_delivery_line" ADD CONSTRAINT "sd_delivery_line_batch_id_ent_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."ent_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_pos_webhook_log" ADD CONSTRAINT "sd_pos_webhook_log_sales_order_id_sd_sales_order_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sd_sales_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD CONSTRAINT "sd_sales_line_sales_order_id_sd_sales_order_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sd_sales_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD CONSTRAINT "sd_sales_line_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD CONSTRAINT "sd_sales_line_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD CONSTRAINT "sd_sales_line_sloc_id_ent_storage_location_id_fk" FOREIGN KEY ("sloc_id") REFERENCES "public"."ent_storage_location"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_sales_line" ADD CONSTRAINT "sd_sales_line_batch_id_ent_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."ent_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD CONSTRAINT "sd_sales_order_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_sales_order" ADD CONSTRAINT "sd_sales_order_customer_id_ent_business_partner_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."ent_business_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pi_count_entry" ADD CONSTRAINT "pi_count_entry_pi_line_id_pi_line_id_fk" FOREIGN KEY ("pi_line_id") REFERENCES "public"."pi_line"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pi_document" ADD CONSTRAINT "pi_document_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pi_document" ADD CONSTRAINT "pi_document_sloc_id_ent_storage_location_id_fk" FOREIGN KEY ("sloc_id") REFERENCES "public"."ent_storage_location"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pi_line" ADD CONSTRAINT "pi_line_pi_document_id_pi_document_id_fk" FOREIGN KEY ("pi_document_id") REFERENCES "public"."pi_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pi_line" ADD CONSTRAINT "pi_line_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pi_line" ADD CONSTRAINT "pi_line_batch_id_ent_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."ent_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "co_costing_run" ADD CONSTRAINT "co_costing_run_plant_id_ent_plant_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."ent_plant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "co_costing_run_line" ADD CONSTRAINT "co_costing_run_line_costing_run_id_co_costing_run_id_fk" FOREIGN KEY ("costing_run_id") REFERENCES "public"."co_costing_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "co_costing_run_line" ADD CONSTRAINT "co_costing_run_line_material_id_ent_material_master_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ent_material_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_batch_mat_plant" ON "ent_batch" USING btree ("batch_number","material_id","plant_id");--> statement-breakpoint
CREATE INDEX "idx_batch_expiry" ON "ent_batch" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_mat_type" ON "ent_material_master" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_mat_kit" ON "ent_material_master" USING btree ("is_kit","is_phantom_kit");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_mat_plant" ON "ent_material_plant" USING btree ("material_id","plant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_plant_sloc" ON "ent_storage_location" USING btree ("plant_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_nr_obj_co_year" ON "ent_number_range" USING btree ("object_type","company_code_id","year");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_stock_mat_plant_sloc_batch_status" ON "inv_stock" USING btree ("material_id","plant_id","sloc_id","batch_id","stock_status");--> statement-breakpoint
CREATE INDEX "idx_stock_mat_plant" ON "inv_stock" USING btree ("material_id","plant_id");--> statement-breakpoint
CREATE INDEX "idx_stock_batch" ON "inv_stock" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_stock_status" ON "inv_stock" USING btree ("stock_status");--> statement-breakpoint
CREATE INDEX "idx_ledger_mat_plant_date" ON "inv_stock_ledger" USING btree ("material_id","plant_id","posted_at");--> statement-breakpoint
CREATE INDEX "idx_ledger_ref_doc" ON "inv_stock_ledger" USING btree ("reference_doc_type","reference_doc_number");--> statement-breakpoint
CREATE INDEX "idx_ledger_movement" ON "inv_stock_ledger" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "idx_dms_linked" ON "dms_document_link" USING btree ("linked_table","linked_id");--> statement-breakpoint
CREATE INDEX "idx_dms_doc" ON "dms_document_link" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_wf_step_def_order" ON "wf_definition_step" USING btree ("definition_id","step_order");--> statement-breakpoint
CREATE INDEX "idx_wf_inst_doc" ON "wf_instance" USING btree ("document_type","document_id");--> statement-breakpoint
CREATE INDEX "idx_wf_inst_state" ON "wf_instance" USING btree ("current_state");--> statement-breakpoint
CREATE INDEX "idx_wf_inst_requester" ON "wf_instance" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "idx_wf_task_inst" ON "wf_task" USING btree ("instance_id");--> statement-breakpoint
CREATE INDEX "idx_wf_task_assignee" ON "wf_task" USING btree ("assignee_id","status");--> statement-breakpoint
CREATE INDEX "idx_emp_manager" ON "hr_employee" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "idx_emp_position" ON "hr_employee" USING btree ("position_id");--> statement-breakpoint
CREATE INDEX "idx_emp_user" ON "hr_employee" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_payroll_line_run" ON "hr_payroll_line" USING btree ("payroll_run_id");--> statement-breakpoint
CREATE INDEX "idx_payroll_line_emp" ON "hr_payroll_line" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payroll_period" ON "hr_payroll_run" USING btree ("period_year","period_month","company_code_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_auto_key_val_class" ON "fi_auto_account_determination" USING btree ("company_code_id","transaction_key","valuation_class");--> statement-breakpoint
CREATE INDEX "idx_fi_doc_posting_date" ON "fi_document" USING btree ("posting_date");--> statement-breakpoint
CREATE INDEX "idx_fi_doc_ref" ON "fi_document" USING btree ("reference_doc_type","reference_doc_number");--> statement-breakpoint
CREATE INDEX "idx_fi_doc_company" ON "fi_document" USING btree ("company_code_id");--> statement-breakpoint
CREATE INDEX "idx_fi_line_doc" ON "fi_document_line" USING btree ("fi_document_id");--> statement-breakpoint
CREATE INDEX "idx_fi_line_gl" ON "fi_document_line" USING btree ("gl_account_id");--> statement-breakpoint
CREATE INDEX "idx_fi_line_cc" ON "fi_document_line" USING btree ("cost_center_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fi_doc_line" ON "fi_document_line" USING btree ("fi_document_id","line_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_coa_account" ON "fi_gl_account" USING btree ("coa_id","account_number");--> statement-breakpoint
CREATE INDEX "idx_docflow_root" ON "audit_document_flow" USING btree ("root_document_type","root_document_id");--> statement-breakpoint
CREATE INDEX "idx_docflow_preceding" ON "audit_document_flow" USING btree ("preceding_doc_type","preceding_doc_id");--> statement-breakpoint
CREATE INDEX "idx_docflow_succeeding" ON "audit_document_flow" USING btree ("succeeding_doc_type","succeeding_doc_id");--> statement-breakpoint
CREATE INDEX "idx_audit_table_record" ON "audit_log" USING btree ("table_name","record_id");--> statement-breakpoint
CREATE INDEX "idx_audit_changed_at" ON "audit_log" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "idx_audit_changed_by" ON "audit_log" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "idx_audit_transaction" ON "audit_log" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_gr_po" ON "mm_goods_receipt" USING btree ("po_id");--> statement-breakpoint
CREATE INDEX "idx_gr_posting" ON "mm_goods_receipt" USING btree ("posting_date");--> statement-breakpoint
CREATE INDEX "idx_gr_line_gr" ON "mm_gr_line" USING btree ("gr_id");--> statement-breakpoint
CREATE INDEX "idx_gr_line_mat" ON "mm_gr_line" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "idx_iv_po" ON "mm_invoice_verification" USING btree ("po_id");--> statement-breakpoint
CREATE INDEX "idx_iv_gr" ON "mm_invoice_verification" USING btree ("gr_id");--> statement-breakpoint
CREATE INDEX "idx_iv_vendor" ON "mm_invoice_verification" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_iv_line_iv" ON "mm_iv_line" USING btree ("iv_id");--> statement-breakpoint
CREATE INDEX "idx_po_line_po" ON "mm_po_line" USING btree ("po_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_po_line" ON "mm_po_line" USING btree ("po_id","line_number");--> statement-breakpoint
CREATE INDEX "idx_po_line_elikz" ON "mm_po_line" USING btree ("delivery_completed");--> statement-breakpoint
CREATE INDEX "idx_pr_line_pr" ON "mm_pr_line" USING btree ("pr_id");--> statement-breakpoint
CREATE INDEX "idx_po_status" ON "mm_purchase_order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_po_vendor" ON "mm_purchase_order" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_pr_status" ON "mm_purchase_requisition" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pr_requester" ON "mm_purchase_requisition" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "idx_sto_line_sto" ON "mm_sto_line" USING btree ("sto_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_sto_line" ON "mm_sto_line" USING btree ("sto_id","line_number");--> statement-breakpoint
CREATE INDEX "idx_sto_status" ON "mm_stock_transport_order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sto_supplying" ON "mm_stock_transport_order" USING btree ("supplying_plant_id");--> statement-breakpoint
CREATE INDEX "idx_sto_receiving" ON "mm_stock_transport_order" USING btree ("receiving_plant_id");--> statement-breakpoint
CREATE INDEX "idx_bom_mat_plant" ON "pp_bom_header" USING btree ("material_id","plant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_bom_mat_plant_ver" ON "pp_bom_header" USING btree ("material_id","plant_id","version");--> statement-breakpoint
CREATE INDEX "idx_bom_line_header" ON "pp_bom_line" USING btree ("bom_header_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_bom_line" ON "pp_bom_line" USING btree ("bom_header_id","line_number");--> statement-breakpoint
CREATE INDEX "idx_mrp_element_run" ON "pp_mrp_element" USING btree ("mrp_run_id");--> statement-breakpoint
CREATE INDEX "idx_mrp_element_mat_plant" ON "pp_mrp_element" USING btree ("material_id","plant_id");--> statement-breakpoint
CREATE INDEX "idx_mrp_run_plant" ON "pp_mrp_run" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "idx_mrp_run_status" ON "pp_mrp_run" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_prod_order_mat_plant" ON "pp_production_order" USING btree ("material_id","plant_id");--> statement-breakpoint
CREATE INDEX "idx_prod_order_status" ON "pp_production_order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_prod_order_type" ON "pp_production_order" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_prod_comp_order" ON "pp_production_order_component" USING btree ("production_order_id");--> statement-breakpoint
CREATE INDEX "idx_prod_comp_mat" ON "pp_production_order_component" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "idx_routing_mat_plant" ON "pp_routing_header" USING btree ("material_id","plant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_routing_mat_plant_ver" ON "pp_routing_header" USING btree ("material_id","plant_id","version");--> statement-breakpoint
CREATE INDEX "idx_routing_line_header" ON "pp_routing_line" USING btree ("routing_header_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_routing_op" ON "pp_routing_line" USING btree ("routing_header_id","operation_number");--> statement-breakpoint
CREATE INDEX "idx_billing_sales" ON "sd_billing" USING btree ("sales_order_id");--> statement-breakpoint
CREATE INDEX "idx_billing_delivery" ON "sd_billing" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "idx_billing_status" ON "sd_billing" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_billing_line_billing" ON "sd_billing_line" USING btree ("billing_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_sales" ON "sd_delivery" USING btree ("sales_order_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_status" ON "sd_delivery" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_delivery_line_delivery" ON "sd_delivery_line" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_source_ext" ON "sd_pos_webhook_log" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_status" ON "sd_pos_webhook_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sales_line_order" ON "sd_sales_line" USING btree ("sales_order_id");--> statement-breakpoint
CREATE INDEX "idx_sales_line_mat" ON "sd_sales_line" USING btree ("material_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_sales_line" ON "sd_sales_line" USING btree ("sales_order_id","line_number");--> statement-breakpoint
CREATE INDEX "idx_sales_status" ON "sd_sales_order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sales_customer" ON "sd_sales_order" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_sales_external" ON "sd_sales_order" USING btree ("external_id","source");--> statement-breakpoint
CREATE INDEX "idx_sales_posting" ON "sd_sales_order" USING btree ("posting_date");--> statement-breakpoint
CREATE INDEX "idx_sales_source" ON "sd_sales_order" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_pi_count_line" ON "pi_count_entry" USING btree ("pi_line_id");--> statement-breakpoint
CREATE INDEX "idx_pi_plant_sloc" ON "pi_document" USING btree ("plant_id","sloc_id");--> statement-breakpoint
CREATE INDEX "idx_pi_status" ON "pi_document" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pi_posting_date" ON "pi_document" USING btree ("posting_date");--> statement-breakpoint
CREATE INDEX "idx_pi_line_doc" ON "pi_line" USING btree ("pi_document_id");--> statement-breakpoint
CREATE INDEX "idx_pi_line_mat" ON "pi_line" USING btree ("material_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_pi_line" ON "pi_line" USING btree ("pi_document_id","line_number");--> statement-breakpoint
CREATE INDEX "idx_costing_run_plant" ON "co_costing_run" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "idx_costing_run_status" ON "co_costing_run" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_costing_line_run" ON "co_costing_run_line" USING btree ("costing_run_id");--> statement-breakpoint
CREATE INDEX "idx_costing_line_mat" ON "co_costing_run_line" USING btree ("material_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_costing_run_mat" ON "co_costing_run_line" USING btree ("costing_run_id","material_id");