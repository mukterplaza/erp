CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"sub_type" text NOT NULL,
	"balance" numeric(16, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_reads" (
	"id" serial PRIMARY KEY NOT NULL,
	"announcement_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"created_by" text NOT NULL,
	"created_by_user_id" integer,
	"published" boolean DEFAULT true NOT NULL,
	"attachment_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_corrections" (
	"id" serial PRIMARY KEY NOT NULL,
	"attendance_id" integer,
	"employee_id" integer NOT NULL,
	"date" text NOT NULL,
	"requested_check_in" text NOT NULL,
	"requested_check_out" text NOT NULL,
	"requested_check_in2" text,
	"requested_check_out2" text,
	"reason" text NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"date" text NOT NULL,
	"check_in" text,
	"check_out" text,
	"check_in2" text,
	"check_out2" text,
	"status" text DEFAULT 'Present' NOT NULL,
	"late_minutes" integer DEFAULT 0 NOT NULL,
	"early_leave_minutes" integer DEFAULT 0 NOT NULL,
	"morning_hours" numeric(6, 2) DEFAULT '0' NOT NULL,
	"afternoon_hours" numeric(6, 2) DEFAULT '0' NOT NULL,
	"working_hours" numeric(6, 2) DEFAULT '0' NOT NULL,
	"overtime_hours" numeric(6, 2) DEFAULT '0' NOT NULL,
	"is_approved" boolean DEFAULT true NOT NULL,
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"user_name" text NOT NULL,
	"user_role" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"record_id" text NOT NULL,
	"before_data" jsonb,
	"after_data" jsonb,
	"ip_address" text DEFAULT '127.0.0.1',
	"user_agent" text DEFAULT 'INSAF-ERP-Client',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_code" text NOT NULL,
	"lead_id" integer,
	"name" text NOT NULL,
	"company_name" text DEFAULT '',
	"phone" text NOT NULL,
	"whatsapp" text DEFAULT '',
	"email" text DEFAULT '',
	"address" text DEFAULT '',
	"assigned_staff_id" integer,
	"total_invoiced" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_paid" numeric(14, 2) DEFAULT '0' NOT NULL,
	"outstanding_balance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contractors" (
	"id" serial PRIMARY KEY NOT NULL,
	"contractor_code" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"specialty" text NOT NULL,
	"project_id" integer,
	"site_id" integer,
	"work_order_ref" text DEFAULT '' NOT NULL,
	"contract_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"approved_bill_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"paid_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"outstanding_due" numeric(14, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_work_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"date" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"auto_progress_percent" integer DEFAULT 0 NOT NULL,
	"manual_override_percent" integer,
	"override_reason" text DEFAULT '',
	"overridden_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_works" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"date" text NOT NULL,
	"arrival_time" text DEFAULT '09:30' NOT NULL,
	"start_time" text DEFAULT '09:30' NOT NULL,
	"end_time" text DEFAULT '19:30' NOT NULL,
	"status" text DEFAULT 'Completed' NOT NULL,
	"work_summary" text NOT NULL,
	"task_id" integer,
	"client_id" integer,
	"project_id" integer,
	"site_id" integer,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"problems" text DEFAULT '',
	"pending_work" text DEFAULT '',
	"tomorrow_plan" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '',
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"doc_code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" text NOT NULL,
	"file_data_url" text NOT NULL,
	"related_entity_id" integer,
	"related_entity_code" text DEFAULT '',
	"uploaded_by" text NOT NULL,
	"min_role_required" text DEFAULT 'Staff' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"emp_code" text NOT NULL,
	"user_id" integer,
	"name" text NOT NULL,
	"department" text NOT NULL,
	"designation" text NOT NULL,
	"joining_date" text NOT NULL,
	"basic_salary" numeric(14, 2) DEFAULT '0' NOT NULL,
	"allowance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"advance_balance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"deduction_default" numeric(14, 2) DEFAULT '0' NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"emergency_contact" text DEFAULT '' NOT NULL,
	"employment_status" text DEFAULT 'Active' NOT NULL,
	"bank_name" text DEFAULT '' NOT NULL,
	"bank_account_no" text DEFAULT '' NOT NULL,
	"payment_method" text DEFAULT 'Bank' NOT NULL,
	"profile_photo" text,
	"manager_id" integer,
	"annual_leave_quota" integer DEFAULT 20 NOT NULL,
	"casual_leave_quota" integer DEFAULT 10 NOT NULL,
	"sick_leave_quota" integer DEFAULT 14 NOT NULL,
	"company" text DEFAULT 'INSAF' NOT NULL,
	"marketing_company" text,
	"assigned_site" text DEFAULT '' NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"expense_code" text NOT NULL,
	"date" text NOT NULL,
	"category" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"project_id" integer,
	"site_id" integer,
	"employee_id" integer,
	"vendor_name" text DEFAULT '',
	"payment_method" text DEFAULT 'Cash' NOT NULL,
	"account_id" integer,
	"description" text NOT NULL,
	"attachment_url" text,
	"approval_status" text DEFAULT 'Approved' NOT NULL,
	"approved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_code" text NOT NULL,
	"client_id" integer NOT NULL,
	"project_id" integer,
	"quotation_id" integer,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_amount" numeric(14, 2) NOT NULL,
	"paid_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"outstanding_amount" numeric(14, 2) NOT NULL,
	"date" text NOT NULL,
	"due_date" text NOT NULL,
	"status" text DEFAULT 'Unpaid' NOT NULL,
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"voucher_no" text NOT NULL,
	"date" text NOT NULL,
	"reference_type" text NOT NULL,
	"reference_code" text NOT NULL,
	"description" text NOT NULL,
	"total_debit" numeric(16, 2) NOT NULL,
	"total_credit" numeric(16, 2) NOT NULL,
	"is_void" boolean DEFAULT false NOT NULL,
	"created_by" text DEFAULT 'System' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"journal_entry_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"account_name" text NOT NULL,
	"debit" numeric(16, 2) DEFAULT '0' NOT NULL,
	"credit" numeric(16, 2) DEFAULT '0' NOT NULL,
	"description" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labours" (
	"id" serial PRIMARY KEY NOT NULL,
	"labour_code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"daily_rate" numeric(14, 2) NOT NULL,
	"phone" text NOT NULL,
	"project_id" integer,
	"assigned_site_id" integer,
	"total_work_days" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_earned" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_paid" numeric(14, 2) DEFAULT '0' NOT NULL,
	"due_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_followups" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"follow_up_number" integer DEFAULT 1 NOT NULL,
	"staff_id" integer,
	"staff_name" text NOT NULL,
	"date" text NOT NULL,
	"time" text DEFAULT '10:00' NOT NULL,
	"contact_method" text DEFAULT 'Phone Call' NOT NULL,
	"outcome" text DEFAULT 'Contacted' NOT NULL,
	"client_response" text DEFAULT '' NOT NULL,
	"discussion" text NOT NULL,
	"next_action" text DEFAULT '' NOT NULL,
	"next_follow_up_date" text,
	"next_follow_up_time" text DEFAULT '10:00' NOT NULL,
	"attachment_name" text,
	"attachment_type" text,
	"attachment_size" text,
	"attachment_url" text,
	"reminder_key" text,
	"reminder_notified" boolean DEFAULT false NOT NULL,
	"result" text DEFAULT 'Contacted' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_code" text NOT NULL,
	"company_id" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"whatsapp" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"source" text DEFAULT 'Direct' NOT NULL,
	"service" text DEFAULT 'Other' NOT NULL,
	"property_type" text DEFAULT 'Other' NOT NULL,
	"project_name" text DEFAULT '' NOT NULL,
	"unit_flat_shop" text DEFAULT '' NOT NULL,
	"preferred_location" text DEFAULT '' NOT NULL,
	"size" text DEFAULT '' NOT NULL,
	"floor" text DEFAULT '' NOT NULL,
	"bedrooms" text DEFAULT '' NOT NULL,
	"purpose" text DEFAULT '' NOT NULL,
	"expected_purchase_date" text DEFAULT '' NOT NULL,
	"client_requirement" text DEFAULT '' NOT NULL,
	"requirement" text DEFAULT '' NOT NULL,
	"land_size" text DEFAULT '' NOT NULL,
	"road_width" text DEFAULT '' NOT NULL,
	"budget" numeric(14, 2) DEFAULT '0' NOT NULL,
	"priority" text DEFAULT 'Warm' NOT NULL,
	"status" text DEFAULT 'New' NOT NULL,
	"last_contact_date" text,
	"next_follow_up_time" text DEFAULT '10:00' NOT NULL,
	"assigned_staff_id" integer,
	"next_follow_up_date" text,
	"converted_client_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"leave_code" text NOT NULL,
	"employee_id" integer NOT NULL,
	"leave_type" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"total_days" integer DEFAULT 1 NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"manager_approved_by" text,
	"hr_approved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"unit" text NOT NULL,
	"warehouse" text DEFAULT 'Central Warehouse' NOT NULL,
	"opening_stock" numeric(14, 2) DEFAULT '0' NOT NULL,
	"purchase_received" numeric(14, 2) DEFAULT '0' NOT NULL,
	"transfer_in" numeric(14, 2) DEFAULT '0' NOT NULL,
	"return_qty" numeric(14, 2) DEFAULT '0' NOT NULL,
	"issue_qty" numeric(14, 2) DEFAULT '0' NOT NULL,
	"transfer_out" numeric(14, 2) DEFAULT '0' NOT NULL,
	"consumption_qty" numeric(14, 2) DEFAULT '0' NOT NULL,
	"adjustment_qty" numeric(14, 2) DEFAULT '0' NOT NULL,
	"current_stock" numeric(14, 2) DEFAULT '0' NOT NULL,
	"unit_cost" numeric(14, 2) DEFAULT '0' NOT NULL,
	"reorder_level" numeric(14, 2) DEFAULT '20' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"target_role" text DEFAULT 'All',
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"created_by" text DEFAULT 'System',
	"priority" text DEFAULT 'Medium',
	"assigned_person_or_team" text DEFAULT 'All Staff',
	"due_date" text,
	"attachment_url" text,
	"related_task_id" integer,
	"category" text,
	"sender_user_id" integer,
	"recipient_employee_id" integer,
	"recipient_name" text,
	"related_employee_id" integer,
	"related_url" text DEFAULT '/dashboard' NOT NULL,
	"related_entity_code" text DEFAULT '',
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_code" text NOT NULL,
	"payment_type" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"date" text NOT NULL,
	"method" text DEFAULT 'Bank' NOT NULL,
	"account_id" integer,
	"reference_code" text DEFAULT '',
	"client_id" integer,
	"invoice_id" integer,
	"supplier_id" integer,
	"supplier_bill_id" integer,
	"contractor_id" integer,
	"employee_id" integer,
	"payroll_id" integer,
	"expense_id" integer,
	"labour_id" integer,
	"project_id" integer,
	"is_void" boolean DEFAULT false NOT NULL,
	"created_by" text DEFAULT 'Admin' NOT NULL,
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payrolls" (
	"id" serial PRIMARY KEY NOT NULL,
	"payroll_code" text NOT NULL,
	"employee_id" integer NOT NULL,
	"salary_month" text NOT NULL,
	"working_days" integer DEFAULT 26 NOT NULL,
	"present_days" integer DEFAULT 26 NOT NULL,
	"late_days" integer DEFAULT 0 NOT NULL,
	"leave_days" integer DEFAULT 0 NOT NULL,
	"overtime_hours" numeric(8, 2) DEFAULT '0' NOT NULL,
	"basic_salary" numeric(14, 2) NOT NULL,
	"allowance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"overtime_pay" numeric(14, 2) DEFAULT '0' NOT NULL,
	"bonus" numeric(14, 2) DEFAULT '0' NOT NULL,
	"advance_deduction" numeric(14, 2) DEFAULT '0' NOT NULL,
	"other_deduction" numeric(14, 2) DEFAULT '0' NOT NULL,
	"tax_deduction" numeric(14, 2) DEFAULT '0' NOT NULL,
	"net_salary" numeric(14, 2) NOT NULL,
	"status" text DEFAULT 'Draft' NOT NULL,
	"approved_by" text,
	"paid_at" timestamp,
	"payment_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"period" text NOT NULL,
	"attendance_score" integer DEFAULT 0 NOT NULL,
	"task_score" integer DEFAULT 0 NOT NULL,
	"daily_update_score" integer DEFAULT 0 NOT NULL,
	"follow_up_score" integer DEFAULT 0 NOT NULL,
	"project_contribution_score" integer DEFAULT 0 NOT NULL,
	"manager_review_points" integer DEFAULT 0 NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"manager_comments" text DEFAULT '',
	"reviewed_by" text DEFAULT 'Manager' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_code" text NOT NULL,
	"client_id" integer NOT NULL,
	"quotation_id" integer,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"land_size" text DEFAULT '' NOT NULL,
	"road_width" text DEFAULT '' NOT NULL,
	"project_type" text DEFAULT 'Residential Building' NOT NULL,
	"start_date" text NOT NULL,
	"expected_completion" text NOT NULL,
	"budget" numeric(14, 2) DEFAULT '0' NOT NULL,
	"manager_id" integer,
	"engineer_id" integer,
	"assigned_staff_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_code" text NOT NULL,
	"pr_id" integer,
	"supplier_id" integer NOT NULL,
	"project_id" integer,
	"site_id" integer,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"received_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'Approved' NOT NULL,
	"supplier_quotation_ref" text DEFAULT '',
	"approved_by" text,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"pr_code" text NOT NULL,
	"project_id" integer,
	"site_id" integer,
	"requested_by_id" integer,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_estimated" numeric(14, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"approved_by" text,
	"notes" text DEFAULT '',
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"quotation_number" text NOT NULL,
	"lead_id" integer,
	"client_id" integer,
	"project_id" integer,
	"service" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"tax" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"terms" text DEFAULT '50% advance, 50% upon milestone completion.',
	"valid_until" text NOT NULL,
	"status" text DEFAULT 'Draft' NOT NULL,
	"created_by" text DEFAULT 'Admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"late_check_in_after" text DEFAULT '09:30' NOT NULL,
	"work_plan_reminder_time" text DEFAULT '10:00' NOT NULL,
	"daily_summary_reminder_time" text DEFAULT '18:30' NOT NULL,
	"enable_overdue_task_reminder" boolean DEFAULT true NOT NULL,
	"enable_pending_task_reminder" boolean DEFAULT true NOT NULL,
	"updated_by" text DEFAULT 'Owner' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_code" text NOT NULL,
	"site_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"reported_by_id" integer,
	"date" text NOT NULL,
	"work_done" text NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"labour_count" integer DEFAULT 0 NOT NULL,
	"materials_used_summary" text DEFAULT '',
	"site_expense_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"problems" text DEFAULT '',
	"tomorrow_plan" text DEFAULT '',
	"photo_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_code" text NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"site_manager_id" integer,
	"engineer_id" integer,
	"workers_count" integer DEFAULT 0 NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"problems" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_id" integer NOT NULL,
	"movement_type" text NOT NULL,
	"quantity" numeric(14, 2) NOT NULL,
	"unit_cost" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_value" numeric(14, 2) DEFAULT '0' NOT NULL,
	"project_id" integer,
	"site_id" integer,
	"warehouse_from" text DEFAULT 'Central Warehouse',
	"warehouse_to" text DEFAULT '',
	"reference_code" text DEFAULT '',
	"notes" text DEFAULT '',
	"created_by" text DEFAULT 'System' NOT NULL,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_code" text NOT NULL,
	"po_id" integer,
	"supplier_id" integer NOT NULL,
	"project_id" integer,
	"total_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"paid_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"outstanding_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'Unpaid' NOT NULL,
	"date" text NOT NULL,
	"due_date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_code" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text DEFAULT '',
	"address" text DEFAULT '' NOT NULL,
	"contact_person" text DEFAULT '' NOT NULL,
	"products_provided" text DEFAULT '' NOT NULL,
	"total_billed" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_paid" numeric(14, 2) DEFAULT '0' NOT NULL,
	"outstanding_payable" numeric(14, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"user_id" integer,
	"author_name" text NOT NULL,
	"comment" text NOT NULL,
	"action_type" text DEFAULT 'Comment' NOT NULL,
	"progress_percent" integer,
	"file_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"event_type" text,
	"old_status" text,
	"new_status" text,
	"actor_employee_id" integer,
	"actor_designation" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_code" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"assigned_to" integer NOT NULL,
	"manager_id" integer,
	"project_id" integer,
	"site_id" integer,
	"client_id" integer,
	"priority" text DEFAULT 'Medium' NOT NULL,
	"due_date" text NOT NULL,
	"status" text DEFAULT 'Todo' NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"requires_review" boolean DEFAULT false NOT NULL,
	"created_by" text DEFAULT 'Manager' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"completed_by" text,
	"completed_at" timestamp,
	"completion_note" text DEFAULT '',
	"attachment_url" text,
	"evidence_attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_company_wide" boolean DEFAULT false NOT NULL,
	"visibility" text DEFAULT 'Assigned' NOT NULL,
	"assigned_by_user_id" integer,
	"assigned_by_employee_id" integer,
	"assigned_by_name" text,
	"assigned_by_designation" text,
	"assigned_to_name" text,
	"assigned_to_designation" text,
	"due_time" text,
	"viewed_at" timestamp,
	"deadline_reminder_sent_at" timestamp,
	"overdue_notified_at" timestamp,
	"category" text DEFAULT 'General' NOT NULL,
	"start_date" text,
	"next_action" text DEFAULT '' NOT NULL,
	"delay_reason" text DEFAULT '' NOT NULL,
	"review_status" text DEFAULT 'None' NOT NULL,
	"review_note" text DEFAULT '' NOT NULL,
	"correction_count" integer DEFAULT 0 NOT NULL,
	"last_update_at" timestamp,
	"rating" text,
	"started_at" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"username" text,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'Staff' NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"reset_token" text,
	"reset_token_expiry" timestamp,
	"last_login_at" timestamp,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer,
	"daily_work_id" integer,
	"employee_id" integer,
	"uploaded_by_user_id" integer,
	"uploaded_by_name" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"data_base64" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_attendance_id_attendances_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_assigned_staff_id_employees_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractors" ADD CONSTRAINT "contractors_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractors" ADD CONSTRAINT "contractors_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_work_plans" ADD CONSTRAINT "daily_work_plans_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_works" ADD CONSTRAINT "daily_works_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_works" ADD CONSTRAINT "daily_works_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_works" ADD CONSTRAINT "daily_works_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_works" ADD CONSTRAINT "daily_works_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_works" ADD CONSTRAINT "daily_works_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labours" ADD CONSTRAINT "labours_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labours" ADD CONSTRAINT "labours_assigned_site_id_sites_id_fk" FOREIGN KEY ("assigned_site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_followups" ADD CONSTRAINT "lead_followups_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_followups" ADD CONSTRAINT "lead_followups_staff_id_employees_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_staff_id_employees_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_supplier_bill_id_supplier_bills_id_fk" FOREIGN KEY ("supplier_bill_id") REFERENCES "public"."supplier_bills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_contractor_id_contractors_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_labour_id_labours_id_fk" FOREIGN KEY ("labour_id") REFERENCES "public"."labours"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_id_employees_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_engineer_id_employees_id_fk" FOREIGN KEY ("engineer_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_pr_id_purchase_requests_id_fk" FOREIGN KEY ("pr_id") REFERENCES "public"."purchase_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_requested_by_id_employees_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_reports" ADD CONSTRAINT "site_reports_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_reports" ADD CONSTRAINT "site_reports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_reports" ADD CONSTRAINT "site_reports_reported_by_id_employees_id_fk" FOREIGN KEY ("reported_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_site_manager_id_employees_id_fk" FOREIGN KEY ("site_manager_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_engineer_id_employees_id_fk" FOREIGN KEY ("engineer_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_bills" ADD CONSTRAINT "supplier_bills_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_bills" ADD CONSTRAINT "supplier_bills_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_bills" ADD CONSTRAINT "supplier_bills_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_employees_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_manager_id_employees_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_files" ADD CONSTRAINT "work_files_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_files" ADD CONSTRAINT "work_files_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_files" ADD CONSTRAINT "work_files_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_code_idx" ON "accounts" USING btree ("code");--> statement-breakpoint
CREATE INDEX "attendances_emp_date_idx" ON "attendances" USING btree ("employee_id","date");--> statement-breakpoint
CREATE INDEX "attendances_date_idx" ON "attendances" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "clients_code_idx" ON "clients" USING btree ("client_code");--> statement-breakpoint
CREATE INDEX "daily_work_plans_emp_date_idx" ON "daily_work_plans" USING btree ("employee_id","date");--> statement-breakpoint
CREATE INDEX "daily_works_emp_date_idx" ON "daily_works" USING btree ("employee_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_code_idx" ON "employees" USING btree ("emp_code");--> statement-breakpoint
CREATE INDEX "employees_user_idx" ON "employees" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "expenses_code_idx" ON "expenses" USING btree ("expense_code");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_code_idx" ON "invoices" USING btree ("invoice_code");--> statement-breakpoint
CREATE UNIQUE INDEX "journal_voucher_idx" ON "journal_entries" USING btree ("voucher_no");--> statement-breakpoint
CREATE INDEX "lead_followups_lead_idx" ON "lead_followups" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_followups_next_date_idx" ON "lead_followups" USING btree ("next_follow_up_date");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_code_idx" ON "leads" USING btree ("lead_code");--> statement-breakpoint
CREATE INDEX "leads_company_idx" ON "leads" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "materials_code_idx" ON "materials" USING btree ("material_code");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_code_idx" ON "payments" USING btree ("payment_code");--> statement-breakpoint
CREATE UNIQUE INDEX "payrolls_code_idx" ON "payrolls" USING btree ("payroll_code");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_code_idx" ON "projects" USING btree ("project_code");--> statement-breakpoint
CREATE UNIQUE INDEX "po_code_idx" ON "purchase_orders" USING btree ("po_code");--> statement-breakpoint
CREATE UNIQUE INDEX "quotations_num_idx" ON "quotations" USING btree ("quotation_number");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "sites_code_idx" ON "sites" USING btree ("site_code");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_code_idx" ON "suppliers" USING btree ("supplier_code");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_code_idx" ON "tasks" USING btree ("task_code");--> statement-breakpoint
CREATE INDEX "tasks_assigned_idx" ON "tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "work_files_task_idx" ON "work_files" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "work_files_emp_idx" ON "work_files" USING btree ("employee_id");