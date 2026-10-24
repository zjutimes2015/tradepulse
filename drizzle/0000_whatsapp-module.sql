CREATE TYPE "public"."linkedin_account_status" AS ENUM('connecting', 'active', 'suspended', 'expired');--> statement-breakpoint
CREATE TYPE "public"."linkedin_account_type" AS ENUM('basic', 'sales_navigator');--> statement-breakpoint
CREATE TYPE "public"."campaign_mode" AS ENUM('copilot', 'auto');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'running', 'paused', 'completed');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('linkedin', 'whatsapp', 'both');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'replied', 'meeting_booked', 'converted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."conversation_channel" AS ENUM('linkedin', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."message_source" AS ENUM('linkedin', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."send_log_status" AS ENUM('success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."template_category" AS ENUM('utility', 'marketing', 'authentication');--> statement-breakpoint
CREATE TYPE "public"."template_meta_status" AS ENUM('draft', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_account_status" AS ENUM('connecting', 'active', 'suspended');--> statement-breakpoint
CREATE TABLE "linkedin_account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"unipile_account_id" text NOT NULL,
	"type" "linkedin_account_type" DEFAULT 'basic' NOT NULL,
	"status" "linkedin_account_status" DEFAULT 'connecting' NOT NULL,
	"daily_send_limit" integer DEFAULT 20 NOT NULL,
	"daily_connect_limit" integer DEFAULT 40 NOT NULL,
	"warmup_days" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"mode" "campaign_mode" DEFAULT 'copilot' NOT NULL,
	"target_industries" jsonb DEFAULT '[]'::jsonb,
	"target_locations" jsonb DEFAULT '[]'::jsonb,
	"target_keywords" jsonb DEFAULT '[]'::jsonb,
	"target_company_size" jsonb DEFAULT '[]'::jsonb,
	"signal_types" jsonb DEFAULT '[]'::jsonb,
	"daily_send_limit" integer DEFAULT 10 NOT NULL,
	"daily_connect_limit" integer DEFAULT 20 NOT NULL,
	"message_template" text DEFAULT '' NOT NULL,
	"total_leads" integer DEFAULT 0 NOT NULL,
	"total_contacted" integer DEFAULT 0 NOT NULL,
	"total_replied" integer DEFAULT 0 NOT NULL,
	"total_meetings" integer DEFAULT 0 NOT NULL,
	"assigned_account_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"user_id" text NOT NULL,
	"source" "lead_source" DEFAULT 'linkedin' NOT NULL,
	"linkedin_profile_url" text DEFAULT '' NOT NULL,
	"linkedin_id" text DEFAULT '' NOT NULL,
	"name" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"industry" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"profile_headline" text DEFAULT '' NOT NULL,
	"signal_score" integer DEFAULT 0 NOT NULL,
	"signal_summary" text DEFAULT '' NOT NULL,
	"signal_details" jsonb DEFAULT '[]'::jsonb,
	"ai_analysis" text DEFAULT '' NOT NULL,
	"message_generated" text DEFAULT '' NOT NULL,
	"message_sent" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp,
	"reply_received" boolean DEFAULT false NOT NULL,
	"reply_content" text DEFAULT '' NOT NULL,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"email" text DEFAULT '',
	"phone" text DEFAULT '',
	"whatsapp_phone" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"channel" "conversation_channel" NOT NULL,
	"external_conversation_id" text NOT NULL,
	"last_message_at" timestamp,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_template" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"category" "template_category" DEFAULT 'utility' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"body" text NOT NULL,
	"meta_status" "template_meta_status" DEFAULT 'draft' NOT NULL,
	"meta_rejection_reason" text DEFAULT '' NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "send_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lead_id" text,
	"source" "message_source" NOT NULL,
	"external_message_id" text DEFAULT '' NOT NULL,
	"template_id" text,
	"category" "template_category",
	"content" text DEFAULT '' NOT NULL,
	"cost" double precision DEFAULT 0 NOT NULL,
	"status" "send_log_status" DEFAULT 'success' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"unipile_account_id" text NOT NULL,
	"phone_number" text DEFAULT '' NOT NULL,
	"status" "whatsapp_account_status" DEFAULT 'connecting' NOT NULL,
	"daily_template_limit" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_assigned_account_id_linkedin_account_id_fk" FOREIGN KEY ("assigned_account_id") REFERENCES "public"."linkedin_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "send_log" ADD CONSTRAINT "send_log_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "send_log" ADD CONSTRAINT "send_log_template_id_message_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_template"("id") ON DELETE no action ON UPDATE no action;