ALTER TABLE "articles" ADD COLUMN "body_blocks" jsonb;--> statement-breakpoint
ALTER TABLE "ingest_runs" ADD COLUMN "pruned_count" integer DEFAULT 0 NOT NULL;