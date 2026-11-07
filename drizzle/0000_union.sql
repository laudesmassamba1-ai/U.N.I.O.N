CREATE TABLE "article_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"revision_number" integer NOT NULL,
	"snapshot" text NOT NULL,
	"summary" text,
	"author" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"standfirst" text,
	"body" text NOT NULL,
	"lead_image" text,
	"category" text NOT NULL,
	"department" text,
	"nature" text NOT NULL,
	"status" text NOT NULL,
	"featured" integer DEFAULT 0 NOT NULL,
	"week_number" integer,
	"week_start" text,
	"week_end" text,
	"sources" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"published_at" text,
	"archived_at" text,
	"deleted_at" text,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug"),
	CONSTRAINT "articles_status_check" CHECK ("articles"."status" in ('draft', 'published', 'archived')),
	CONSTRAINT "articles_nature_check" CHECK ("articles"."nature" in ('info', 'analyse', 'opinion'))
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"target" text NOT NULL,
	"details" text,
	"user_role" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backup_log" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"row_counts" text NOT NULL,
	"destination" text
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"width" integer,
	"height" integer,
	"size" integer,
	"alt_text" text NOT NULL,
	"credit" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"member_number" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"department" text,
	"status" text DEFAULT 'dossier_recu' NOT NULL,
	"created_at" text NOT NULL,
	"card_sent_at" text,
	CONSTRAINT "members_member_number_unique" UNIQUE("member_number")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"suggestion_id" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roadmap" (
	"id" text PRIMARY KEY NOT NULL,
	"step_order" integer NOT NULL,
	"title" text NOT NULL,
	"status" text NOT NULL,
	"description" text,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snapshot_meta" (
	"id" integer PRIMARY KEY NOT NULL,
	"built_at" text NOT NULL,
	"etag" text NOT NULL,
	CONSTRAINT "snapshot_meta_single_row_check" CHECK ("snapshot_meta"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "studio_users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"passhash" text NOT NULL,
	"role" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "studio_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "suggestion_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"suggestion_id" text NOT NULL,
	"response_text" text NOT NULL,
	"responder_role" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suggestion_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"suggestion_id" text NOT NULL,
	"voter_hash" text NOT NULL,
	"value" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "suggestion_votes_value_check" CHECK ("suggestion_votes"."value" in ('useful', 'not_useful'))
);
--> statement-breakpoint
CREATE TABLE "suggestions" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"category" text NOT NULL,
	"department" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"flagged" integer DEFAULT 0 NOT NULL,
	"flag_reason" text,
	"votes_useful" integer DEFAULT 0 NOT NULL,
	"votes_not_useful" integer DEFAULT 0 NOT NULL,
	"report_count" integer DEFAULT 0 NOT NULL,
	"duplicate_of" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"published_at" text,
	"archived_at" text,
	CONSTRAINT "suggestions_text_length_check" CHECK (char_length("suggestions"."text") between 20 and 600),
	CONSTRAINT "suggestions_status_check" CHECK ("suggestions"."status" in ('pending', 'discussion', 'retained', 'adapted', 'integrated', 'archived', 'expired', 'hidden'))
);
--> statement-breakpoint
ALTER TABLE "article_revisions" ADD CONSTRAINT "article_revisions_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_suggestion_id_suggestions_id_fk" FOREIGN KEY ("suggestion_id") REFERENCES "public"."suggestions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestion_responses" ADD CONSTRAINT "suggestion_responses_suggestion_id_suggestions_id_fk" FOREIGN KEY ("suggestion_id") REFERENCES "public"."suggestions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestion_votes" ADD CONSTRAINT "suggestion_votes_suggestion_id_suggestions_id_fk" FOREIGN KEY ("suggestion_id") REFERENCES "public"."suggestions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "article_revisions_article_idx" ON "article_revisions" USING btree ("article_id","revision_number");--> statement-breakpoint
CREATE UNIQUE INDEX "article_revisions_number_idx" ON "article_revisions" USING btree ("article_id","revision_number");--> statement-breakpoint
CREATE INDEX "articles_status_published_idx" ON "articles" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "backup_log_created_at_idx" ON "backup_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "members_created_at_idx" ON "members" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reports_suggestion_idx" ON "reports" USING btree ("suggestion_id");--> statement-breakpoint
CREATE INDEX "reports_created_at_idx" ON "reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "roadmap_order_idx" ON "roadmap" USING btree ("step_order");--> statement-breakpoint
CREATE INDEX "suggestion_responses_suggestion_idx" ON "suggestion_responses" USING btree ("suggestion_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "suggestion_votes_unique_idx" ON "suggestion_votes" USING btree ("suggestion_id","voter_hash");--> statement-breakpoint
CREATE INDEX "suggestion_votes_suggestion_value_idx" ON "suggestion_votes" USING btree ("suggestion_id","value");--> statement-breakpoint
CREATE INDEX "suggestions_status_created_idx" ON "suggestions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "suggestions_created_at_idx" ON "suggestions" USING btree ("created_at");