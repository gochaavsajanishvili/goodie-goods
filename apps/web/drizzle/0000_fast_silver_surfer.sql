CREATE TYPE "public"."admin_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text DEFAULT 'ambebi.ge' NOT NULL,
	"source_url" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"image_url" text,
	"category" text NOT NULL,
	"score" integer NOT NULL,
	"is_good_news" boolean NOT NULL,
	"reason" text,
	"classifier_model" text NOT NULL,
	"classifier_version" integer DEFAULT 1 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"admin_status" "admin_status" DEFAULT 'pending' NOT NULL,
	CONSTRAINT "articles_source_url_unique" UNIQUE("source_url")
);
--> statement-breakpoint
CREATE TABLE "ingest_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"urls_seen" integer DEFAULT 0 NOT NULL,
	"urls_new" integer DEFAULT 0 NOT NULL,
	"keyword_rejected" integer DEFAULT 0 NOT NULL,
	"llm_classified" integer DEFAULT 0 NOT NULL,
	"llm_approved" integer DEFAULT 0 NOT NULL,
	"error_log" jsonb
);
