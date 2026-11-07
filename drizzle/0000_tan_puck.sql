CREATE TABLE "article_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"author_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"standfirst" text,
	"body" jsonb NOT NULL,
	"nature" text NOT NULL,
	"category" text,
	"department" text,
	"lead_media_id" text,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"edition_week" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug"),
	CONSTRAINT "articles_nature_check" CHECK ("articles"."nature" in ('info', 'analyse', 'opinion')),
	CONSTRAINT "articles_status_check" CHECK ("articles"."status" in ('draft', 'published', 'archived', 'deleted'))
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"target" text,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "backup_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"row_counts" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"object_key" text NOT NULL,
	"alt" text NOT NULL,
	"credit" text NOT NULL,
	"caption" text,
	"width" integer,
	"height" integer,
	"bytes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"suggestion_id" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"handled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "roadmap" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"status" text NOT NULL,
	"position" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roadmap_status_check" CHECK ("roadmap"."status" in ('done', 'doing', 'todo'))
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snapshot_meta" (
	"id" integer PRIMARY KEY NOT NULL,
	"built_at" timestamp with time zone NOT NULL,
	"etag" text NOT NULL,
	CONSTRAINT "snapshot_meta_single_row_check" CHECK ("snapshot_meta"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "studio_users" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disabled_at" timestamp with time zone,
	CONSTRAINT "studio_users_role_check" CHECK ("studio_users"."role" in ('admin', 'editor', 'moderator'))
);
--> statement-breakpoint
CREATE TABLE "suggestion_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"suggestion_id" text NOT NULL,
	"text" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suggestion_votes" (
	"suggestion_id" text NOT NULL,
	"voter_hash" text NOT NULL,
	"value" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suggestion_votes_suggestion_id_voter_hash_pk" PRIMARY KEY("suggestion_id","voter_hash"),
	CONSTRAINT "suggestion_votes_value_check" CHECK ("suggestion_votes"."value" in (-1, 1))
);
--> statement-breakpoint
CREATE TABLE "suggestions" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"category" text NOT NULL,
	"department" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"useful_count" integer DEFAULT 0 NOT NULL,
	"not_useful_count" integer DEFAULT 0 NOT NULL,
	"merged_into" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "suggestions_text_length_check" CHECK (char_length("suggestions"."text") between 20 and 600),
	CONSTRAINT "suggestions_status_check" CHECK ("suggestions"."status" in ('pending', 'discussion', 'retained', 'adapted', 'integrated', 'archived', 'expired', 'hidden'))
);
--> statement-breakpoint
ALTER TABLE "article_revisions" ADD CONSTRAINT "article_revisions_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_lead_media_id_media_id_fk" FOREIGN KEY ("lead_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_suggestion_id_suggestions_id_fk" FOREIGN KEY ("suggestion_id") REFERENCES "public"."suggestions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestion_responses" ADD CONSTRAINT "suggestion_responses_suggestion_id_suggestions_id_fk" FOREIGN KEY ("suggestion_id") REFERENCES "public"."suggestions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestion_votes" ADD CONSTRAINT "suggestion_votes_suggestion_id_suggestions_id_fk" FOREIGN KEY ("suggestion_id") REFERENCES "public"."suggestions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_merged_into_suggestions_id_fk" FOREIGN KEY ("merged_into") REFERENCES "public"."suggestions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "articles_status_published_idx" ON "articles" USING btree ("status","published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "suggestions_status_created_idx" ON "suggestions" USING btree ("status","created_at" DESC NULLS LAST);